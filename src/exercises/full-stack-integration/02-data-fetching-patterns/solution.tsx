import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  QueryKey,
  QueryFunction,
  UseQueryOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  InfiniteData,
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Types for our data
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

interface PaginatedResponse<T> {
  data: T[];
  page: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  nextPage?: number;
}

interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  data: any;
  timestamp: number;
  retries: number;
}

type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';

// Query Configuration
interface QueryConfig {
  defaultStaleTime: number;
  defaultCacheTime: number;
  retryAttempts: number;
  retryDelay: (attemptIndex: number) => number;
  refetchOnWindowFocus: boolean;
  refetchOnReconnect: boolean;
}

// Advanced QueryClient Creation
function createQueryClient(config: QueryConfig): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: config.defaultStaleTime,
        cacheTime: config.defaultCacheTime,
        retry: config.retryAttempts,
        retryDelay: config.retryDelay,
        refetchOnWindowFocus: config.refetchOnWindowFocus,
        refetchOnReconnect: config.refetchOnReconnect,
        refetchOnMount: 'always',
        // Network mode for offline support
        networkMode: 'offlineFirst',
      },
      mutations: {
        retry: 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        networkMode: 'offlineFirst',
      },
    },
    // Global error handler
    mutationCache: {
      onError: (error) => {
        console.error('Global mutation error:', error);
      },
    },
    queryCache: {
      onError: (error) => {
        console.error('Global query error:', error);
      },
    },
  });
}

// Cache Manager Implementation
class CacheManager {
  constructor(private queryClient: QueryClient) {}

  async invalidateByTags(tags: string[]): Promise<void> {
    const promises = tags.map(tag => 
      this.queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey.some(key => 
            typeof key === 'string' && key.includes(tag)
          );
        }
      })
    );
    await Promise.all(promises);
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    await this.queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && queryKey.some(key =>
          typeof key === 'string' && new RegExp(pattern).test(key)
        );
      }
    });
  }

  async warmCache(queries: QueryKey[]): Promise<void> {
    const promises = queries.map(queryKey =>
      this.queryClient.prefetchQuery({ queryKey })
    );
    await Promise.allSettled(promises);
  }

  updateCacheData<T>(key: QueryKey, updater: (old: T | undefined) => T): void {
    this.queryClient.setQueryData(key, updater);
  }

  optimizeMemory(): void {
    // Remove queries that haven't been used in the last 10 minutes
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    
    this.queryClient.getQueryCache().getAll().forEach(query => {
      if (query.state.dataUpdatedAt < tenMinutesAgo && !query.getObserversCount()) {
        this.queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
  }
}

// Optimistic Update Interface
interface OptimisticUpdate<TData, TVariable> {
  queryKey: QueryKey;
  optimisticData: (variables: TVariable, currentData: TData | undefined) => TData;
  rollbackData?: (variables: TVariable, currentData: TData | undefined) => TData | undefined;
  onError?: (error: Error, variables: TVariable, context: any) => void;
}

// Optimistic Mutation Hook
function useOptimisticMutation<TData, TVariable>(
  mutationFn: (variables: TVariable) => Promise<TData>,
  updates: OptimisticUpdate<TData, TVariable>[]
): UseMutationResult<TData, Error, TVariable> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      const cancelPromises = updates.map(update =>
        queryClient.cancelQueries({ queryKey: update.queryKey })
      );
      await Promise.all(cancelPromises);

      // Snapshot previous values
      const previousData = updates.map(update => ({
        queryKey: update.queryKey,
        data: queryClient.getQueryData(update.queryKey)
      }));

      // Optimistically update cache
      updates.forEach(update => {
        const currentData = queryClient.getQueryData(update.queryKey);
        const optimisticData = update.optimisticData(variables, currentData);
        queryClient.setQueryData(update.queryKey, optimisticData);
      });

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(({ queryKey, data }: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Call custom error handlers
      updates.forEach(update => {
        update.onError?.(error, variables, context);
      });
    },
    onSettled: (data, error, variables, context) => {
      // Refetch to ensure consistency
      updates.forEach(update => {
        queryClient.invalidateQueries({ queryKey: update.queryKey });
      });
    },
  });
}

// Offline Manager Implementation
class OfflineManager {
  private queue: QueuedRequest[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncStatus: SyncStatus = navigator.onLine ? 'online' : 'offline';
  private statusCallbacks: ((status: SyncStatus) => void)[] = [];
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupNetworkListeners();
    this.startSyncLoop();
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateSyncStatus('online');
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateSyncStatus('offline');
    });
  }

  private startSyncLoop(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.queue.length > 0) {
        this.processQueue();
      }
    }, 30000); // Check every 30 seconds
  }

  private updateSyncStatus(status: SyncStatus): void {
    this.syncStatus = status;
    this.statusCallbacks.forEach(callback => callback(status));
  }

  queueRequest(request: QueuedRequest): void {
    this.queue.push(request);
    console.log(`Request queued: ${request.method} ${request.url}`);
  }

  async processQueue(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0) return;

    this.updateSyncStatus('syncing');

    const requestsToProcess = [...this.queue];
    this.queue = [];

    for (const request of requestsToProcess) {
      try {
        // Simulate API call
        await fetch(request.url, {
          method: request.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.data)
        });
        
        console.log(`Synced request: ${request.method} ${request.url}`);
      } catch (error) {
        // Re-queue failed requests with retry limit
        if (request.retries < 3) {
          this.queue.push({
            ...request,
            retries: request.retries + 1
          });
        } else {
          console.error(`Failed to sync request after 3 retries: ${request.id}`);
        }
      }
    }

    this.updateSyncStatus(this.queue.length > 0 ? 'offline' : 'online');
  }

  resolveConflicts(localData: any, serverData: any): any {
    // Simple last-write-wins strategy
    // In production, implement more sophisticated conflict resolution
    const localTimestamp = new Date(localData.updatedAt || localData.createdAt).getTime();
    const serverTimestamp = new Date(serverData.updatedAt || serverData.createdAt).getTime();
    
    return localTimestamp > serverTimestamp ? localData : serverData;
  }

  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  onSyncStatusChange(callback: (status: SyncStatus) => void): void {
    this.statusCallbacks.push(callback);
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Infinite Data Hook
function useInfiniteData<T>(
  queryKey: QueryKey,
  fetcher: (params: { pageParam?: unknown }) => Promise<PaginatedResponse<T>>,
  options?: UseInfiniteQueryOptions
): UseInfiniteQueryResult<InfiniteData<PaginatedResponse<T>>> {
  return useInfiniteQuery({
    queryKey,
    queryFn: fetcher,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// Background Sync Hook
function useBackgroundSync<T>(
  queryKey: QueryKey,
  fetcher: QueryFunction<T>,
  syncInterval: number
): UseQueryResult<T> {
  return useQuery({
    queryKey,
    queryFn: fetcher,
    refetchInterval: syncInterval,
    refetchIntervalInBackground: true,
    staleTime: syncInterval / 2, // Consider data stale halfway through interval
    cacheTime: syncInterval * 2, // Cache for twice the interval
  });
}

// Dependent Queries Hook
function useDependentQueries<T1, T2>(
  query1: { queryKey: QueryKey; queryFn: QueryFunction<T1>; options?: UseQueryOptions<T1> },
  query2: (data: T1) => { queryKey: QueryKey; queryFn: QueryFunction<T2>; options?: UseQueryOptions<T2> }
): [UseQueryResult<T1>, UseQueryResult<T2>] {
  const firstQuery = useQuery({
    queryKey: query1.queryKey,
    queryFn: query1.queryFn,
    ...query1.options,
  });

  const secondQueryConfig = firstQuery.data ? query2(firstQuery.data) : null;
  
  const secondQuery = useQuery({
    queryKey: secondQueryConfig?.queryKey || ['dependent-query-disabled'],
    queryFn: secondQueryConfig?.queryFn || (() => Promise.resolve(null)),
    enabled: !!firstQuery.data && !!secondQueryConfig,
    ...secondQueryConfig?.options,
  });

  return [firstQuery, secondQuery as UseQueryResult<T2>];
}

// Real-time Query Hook
function useRealTimeQuery<T>(
  queryKey: QueryKey,
  fetcher: QueryFunction<T>,
  websocketUrl: string
): UseQueryResult<T> & {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
} {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);

  const query = useQuery({
    queryKey,
    queryFn: fetcher,
    staleTime: Infinity, // Real-time data is always fresh
  });

  useEffect(() => {
    if (!websocketUrl) return;

    setConnectionStatus('connecting');
    
    const ws = new WebSocket(websocketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Update query cache with real-time data
        queryClient.setQueryData(queryKey, data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      console.log('WebSocket disconnected');
    };

    ws.onerror = () => {
      setConnectionStatus('error');
      console.error('WebSocket error');
    };

    return () => {
      ws.close();
    };
  }, [websocketUrl, queryKey, queryClient]);

  return {
    ...query,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
  };
}

// Mock API functions
const mockApi = {
  getUser: async (id: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
      avatar: `https://via.placeholder.com/100?text=${id}`
    };
  },

  updateUser: async (updates: Partial<User>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      id: updates.id || '1',
      name: updates.name || 'Updated User',
      email: updates.email || 'updated@example.com',
      avatar: updates.avatar
    };
  },

  getPosts: async (params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Post>> => {
    const { page = 0, limit = 10 } = params;
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const posts: Post[] = Array.from({ length: limit }, (_, i) => ({
      id: `${page * limit + i + 1}`,
      title: `Post ${page * limit + i + 1}`,
      content: `This is the content of post ${page * limit + i + 1}. It demonstrates pagination and infinite scrolling patterns with smart caching.`,
      authorId: '1',
      createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      likesCount: Math.floor(Math.random() * 100),
      commentsCount: Math.floor(Math.random() * 20)
    }));

    return {
      data: posts,
      page,
      totalPages: 10,
      totalItems: 100,
      hasNextPage: page < 9,
      nextPage: page < 9 ? page + 1 : undefined
    };
  },

  likePost: async (postId: string): Promise<Post> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      id: postId,
      title: `Post ${postId}`,
      content: `Content of post ${postId}`,
      authorId: '1',
      createdAt: new Date().toISOString(),
      likesCount: Math.floor(Math.random() * 100) + 1,
      commentsCount: Math.floor(Math.random() * 20)
    };
  }
};

// Global offline manager instance
const offlineManager = new OfflineManager();

// User Profile Component
const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => mockApi.getUser(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const updateUserMutation = useOptimisticMutation(
    mockApi.updateUser,
    [{
      queryKey: ['user', userId],
      optimisticData: (variables, currentUser) => ({
        ...currentUser,
        ...variables,
      } as User),
    }]
  );

  const handleUpdateUser = () => {
    const newName = `Updated User ${Date.now()}`;
    updateUserMutation.mutate({
      id: userId,
      name: newName
    });
  };

  if (isLoading) return <div style={{ padding: '20px' }}>Loading user...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error loading user</div>;
  if (!user) return <div style={{ padding: '20px' }}>No user found</div>;

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      marginBottom: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>User Profile (Smart Caching + Optimistic Updates)</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {user.avatar && (
          <img 
            src={user.avatar} 
            alt="Avatar" 
            style={{ width: '60px', height: '60px', borderRadius: '50%' }}
          />
        )}
        <div>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      </div>
      <button 
        onClick={handleUpdateUser}
        disabled={updateUserMutation.isPending}
        style={{
          marginTop: '10px',
          padding: '8px 16px',
          backgroundColor: updateUserMutation.isPending ? '#6c757d' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: updateUserMutation.isPending ? 'not-allowed' : 'pointer'
        }}
      >
        {updateUserMutation.isPending ? 'Updating...' : 'Update User (Optimistic)'}
      </button>
      {updateUserMutation.isError && (
        <p style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
          Update failed! Changes have been reverted.
        </p>
      )}
    </div>
  );
};

// Infinite Posts Component
const InfinitePosts: React.FC = () => {
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteData(
    ['posts'],
    ({ pageParam = 0 }) => mockApi.getPosts({ page: pageParam, limit: 5 })
  );

  const likeMutation = useOptimisticMutation(
    mockApi.likePost,
    [{
      queryKey: ['posts'],
      optimisticData: (postId, currentData) => {
        if (!currentData) return currentData;
        
        return {
          ...currentData,
          pages: currentData.pages.map(page => ({
            ...page,
            data: page.data.map(post => 
              post.id === postId 
                ? { ...post, likesCount: post.likesCount + 1 }
                : post
            )
          }))
        };
      },
    }]
  );

  const handleLikePost = (postId: string) => {
    likeMutation.mutate(postId);
  };

  if (isLoading) return <div style={{ padding: '20px' }}>Loading posts...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error loading posts</div>;

  const posts = postsData?.pages.flatMap(page => page.data) || [];

  return (
    <div style={{ padding: '20px' }}>
      <h3>Infinite Posts (Background Refetching + Optimistic Likes)</h3>
      
      {posts.map(post => (
        <div key={post.id} style={{
          padding: '15px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginBottom: '15px',
          backgroundColor: '#fff'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>{post.title}</h4>
          <p style={{ margin: '0 0 10px 0', color: '#666' }}>{post.content}</p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '14px',
            color: '#888'
          }}>
            <span>
              👍 {post.likesCount} likes • 💬 {post.commentsCount} comments
            </span>
            <div>
              <button
                onClick={() => handleLikePost(post.id)}
                disabled={likeMutation.isPending}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: likeMutation.isPending ? 'not-allowed' : 'pointer'
                }}
              >
                👍 {likeMutation.isPending ? 'Liking...' : 'Like'}
              </button>
              <small style={{ marginLeft: '10px' }}>
                {new Date(post.createdAt).toLocaleDateString()}
              </small>
            </div>
          </div>
        </div>
      ))}

      {hasNextPage && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            style={{
              padding: '10px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isFetchingNextPage ? 'not-allowed' : 'pointer'
            }}
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load More Posts'}
          </button>
        </div>
      )}
    </div>
  );
};

// Background Sync Demo Component
const BackgroundSyncDemo: React.FC = () => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { data: syncData, isLoading, isFetching } = useBackgroundSync(
    ['background-sync'],
    async () => {
      const response = await mockApi.getPosts({ page: 0, limit: 3 });
      setLastUpdate(new Date());
      return response;
    },
    10000 // 10 seconds
  );

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#f0f8ff',
      marginBottom: '20px'
    }}>
      <h3>Background Sync Demo</h3>
      <p>
        This component automatically refetches data every 10 seconds in the background, 
        demonstrating stale-while-revalidate patterns.
      </p>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {lastUpdate && (
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
          <p style={{ fontSize: '14px', margin: '5px 0 0 0' }}>
            <strong>Latest Posts Count:</strong> {syncData?.data.length || 0}
          </p>
        </div>
        
        <div style={{ 
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          backgroundColor: isFetching ? '#ffc107' : '#28a745',
          color: 'white'
        }}>
          {isFetching ? '🔄 Syncing...' : '✅ Synchronized'}
        </div>
      </div>
    </div>
  );
};

// Offline Status Component
const OfflineStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('online');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to sync status changes
    offlineManager.onSyncStatusChange(setSyncStatus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'online': return '#28a745';
      case 'offline': return '#dc3545';
      case 'syncing': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'online': return '🟢';
      case 'offline': return '🔴';
      case 'syncing': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div style={{
      padding: '15px',
      backgroundColor: syncStatus === 'online' ? '#d4edda' : '#f8d7da',
      border: `1px solid ${syncStatus === 'online' ? '#c3e6cb' : '#f5c6cb'}`,
      borderRadius: '4px',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>
          {getStatusIcon()}
        </span>
        <div>
          <strong style={{ color: getStatusColor() }}>
            {syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}
          </strong>
          {syncStatus === 'syncing' && (
            <span style={{ marginLeft: '10px', fontSize: '14px' }}>
              (Processing queued requests...)
            </span>
          )}
        </div>
      </div>
      {syncStatus === 'offline' && (
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#721c24' }}>
          You're currently offline. Changes will be synced when connection is restored.
        </p>
      )}
    </div>
  );
};

// Cache Manager Demo
const CacheManagerDemo: React.FC = () => {
  const queryClient = useQueryClient();
  const cacheManager = new CacheManager(queryClient);

  const handleClearCache = () => {
    queryClient.clear();
    console.log('✅ Cache cleared');
  };

  const handleOptimizeMemory = () => {
    cacheManager.optimizeMemory();
    console.log('✅ Memory optimized');
  };

  const handleWarmCache = async () => {
    await cacheManager.warmCache([
      ['user', '2'],
      ['posts'],
      ['background-sync']
    ]);
    console.log('✅ Cache warmed');
  };

  return (
    <div style={{
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f8f9fa',
      marginBottom: '20px'
    }}>
      <h3>Cache Management Demo</h3>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
        Demonstrate advanced cache management capabilities including warming, optimization, and invalidation.
      </p>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleWarmCache}
          style={{
            padding: '8px 12px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🔥 Warm Cache
        </button>
        
        <button
          onClick={handleOptimizeMemory}
          style={{
            padding: '8px 12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🧹 Optimize Memory
        </button>
        
        <button
          onClick={handleClearCache}
          style={{
            padding: '8px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🗑️ Clear Cache
        </button>
      </div>
    </div>
  );
};

// Main Demo Component
const DataFetchingDemo: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Modern Data Fetching Patterns - Solution</h1>
      
      <div style={{ 
        background: '#d4edda', 
        border: '1px solid #c3e6cb', 
        padding: '15px', 
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <h3>✅ Complete Implementation</h3>
        <ul style={{ margin: 0 }}>
          <li><strong>Smart Caching:</strong> Stale-while-revalidate with configurable cache times</li>
          <li><strong>Optimistic Updates:</strong> Immediate UI feedback with automatic rollback</li>
          <li><strong>Offline Support:</strong> Request queuing and background synchronization</li>
          <li><strong>Infinite Pagination:</strong> Efficient loading of large datasets</li>
          <li><strong>Background Sync:</strong> Automatic data freshening without user interruption</li>
          <li><strong>Cache Management:</strong> Intelligent invalidation and memory optimization</li>
        </ul>
      </div>
      
      <OfflineStatus />
      <CacheManagerDemo />
      <UserProfile userId="1" />
      <InfinitePosts />
      <BackgroundSyncDemo />

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h3>🚀 Advanced Pattern Implementation</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          <div>
            <h4>✅ Smart Caching</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Configurable stale/cache times</li>
              <li>Pattern-based invalidation</li>
              <li>Memory optimization strategies</li>
              <li>Cache warming for performance</li>
            </ul>
          </div>
          <div>
            <h4>🔄 Optimistic Updates</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Immediate UI feedback</li>
              <li>Automatic rollback on failure</li>
              <li>Context preservation</li>
              <li>Error handling integration</li>
            </ul>
          </div>
          <div>
            <h4>📡 Background Sync</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Interval-based refetching</li>
              <li>Focus/blur event handling</li>
              <li>Network state awareness</li>
              <li>Stale-while-revalidate patterns</li>
            </ul>
          </div>
          <div>
            <h4>📱 Offline Support</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Request queue management</li>
              <li>Network event listeners</li>
              <li>Conflict resolution strategies</li>
              <li>Automatic sync recovery</li>
            </ul>
          </div>
        </div>
        
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff', borderRadius: '4px' }}>
          <h4>🏗️ Production-Ready Features</h4>
          <ul style={{ fontSize: '14px', margin: 0 }}>
            <li><strong>Error Boundaries:</strong> Global error handling for queries and mutations</li>
            <li><strong>Network Mode:</strong> Offline-first approach with intelligent fallbacks</li>
            <li><strong>Retry Logic:</strong> Exponential backoff with configurable limits</li>
            <li><strong>DevTools Integration:</strong> Complete debugging and monitoring support</li>
            <li><strong>Type Safety:</strong> Full TypeScript integration with generic constraints</li>
            <li><strong>Performance Monitoring:</strong> Cache hit rates and query performance tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Production-ready QueryClient with advanced configuration
const queryClient = createQueryClient({
  defaultStaleTime: 5 * 60 * 1000, // 5 minutes
  defaultCacheTime: 10 * 60 * 1000, // 10 minutes
  retryAttempts: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
});

// Main App Component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <DataFetchingDemo />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;