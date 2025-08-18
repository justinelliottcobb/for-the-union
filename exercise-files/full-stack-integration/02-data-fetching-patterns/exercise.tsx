import React, { useState, useEffect } from 'react';
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

// TODO: Define QueryConfig interface
interface QueryConfig {
  // Add configuration properties:
  // - defaultStaleTime: number
  // - defaultCacheTime: number  
  // - retryAttempts: number
  // - retryDelay: (attemptIndex: number) => number
  // - refetchOnWindowFocus: boolean
  // - refetchOnReconnect: boolean
}

// TODO: Create advanced QueryClient
function createQueryClient(config: QueryConfig): QueryClient {
  // Configure QueryClient with:
  // - Default query options
  // - Error handling
  // - Retry logic
  // - Cache configuration
  // - Network detection
}

// TODO: Implement CacheManager class
class CacheManager {
  constructor(private queryClient: QueryClient) {}

  // TODO: Implement cache invalidation by tags
  async invalidateByTags(tags: string[]): Promise<void> {
    // Invalidate queries that match specific tags
  }

  // TODO: Implement pattern-based invalidation
  async invalidateByPattern(pattern: string): Promise<void> {
    // Invalidate queries matching a pattern
  }

  // TODO: Implement cache warming
  async warmCache(queries: QueryKey[]): Promise<void> {
    // Prefetch queries to warm cache
  }

  // TODO: Implement selective cache updates
  updateCacheData<T>(key: QueryKey, updater: (old: T) => T): void {
    // Update cached data without refetching
  }

  // TODO: Implement memory optimization
  optimizeMemory(): void {
    // Clear unused cache entries
  }
}

// TODO: Define OptimisticUpdate interface
interface OptimisticUpdate<TData, TVariable> {
  // Add properties:
  // - queryKey: QueryKey
  // - optimisticData: (variables: TVariable, currentData: TData) => TData
  // - rollbackData?: (variables: TVariable, currentData: TData) => TData
  // - onError?: (error: Error, variables: TVariable, context: any) => void
}

// TODO: Implement useOptimisticMutation hook
function useOptimisticMutation<TData, TVariable>(
  mutationFn: (variables: TVariable) => Promise<TData>,
  updates: OptimisticUpdate<TData, TVariable>[]
): UseMutationResult<TData, Error, TVariable> {
  // Implement optimistic updates with rollback
  // Use queryClient.setQueryData for optimistic updates
  // Handle rollback on error
  // Provide immediate UI feedback
}

// TODO: Implement OfflineManager class
class OfflineManager {
  private queue: QueuedRequest[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncStatus: SyncStatus = 'online';

  // TODO: Implement request queuing
  queueRequest(request: QueuedRequest): void {
    // Add request to queue when offline
  }

  // TODO: Implement queue processing
  async processQueue(): Promise<void> {
    // Process queued requests when back online
  }

  // TODO: Implement conflict resolution
  resolveConflicts(localData: any, serverData: any): any {
    // Resolve conflicts between local and server data
  }

  // TODO: Implement sync status management
  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  onSyncStatusChange(callback: (status: SyncStatus) => void): void {
    // Subscribe to sync status changes
  }
}

// TODO: Implement useInfiniteData hook
function useInfiniteData<T>(
  queryKey: QueryKey,
  fetcher: (params: { pageParam?: unknown }) => Promise<PaginatedResponse<T>>,
  options?: UseInfiniteQueryOptions
): UseInfiniteQueryResult<InfiniteData<PaginatedResponse<T>>> {
  // Implement infinite query with proper pagination
  // Handle loading states
  // Provide fetchNextPage functionality
}

// TODO: Implement useBackgroundSync hook
function useBackgroundSync<T>(
  queryKey: QueryKey,
  fetcher: QueryFunction<T>,
  syncInterval: number
): UseQueryResult<T> {
  // Implement background synchronization
  // Set up interval-based refetching
  // Handle online/offline states
}

// TODO: Implement useDependentQueries hook
function useDependentQueries<T1, T2>(
  query1: { queryKey: QueryKey; queryFn: QueryFunction<T1>; options?: UseQueryOptions<T1> },
  query2: (data: T1) => { queryKey: QueryKey; queryFn: QueryFunction<T2>; options?: UseQueryOptions<T2> }
): [UseQueryResult<T1>, UseQueryResult<T2>] {
  // Implement dependent queries
  // Second query should depend on first query's data
  // Handle loading states properly
}

// TODO: Implement useRealTimeQuery hook
function useRealTimeQuery<T>(
  queryKey: QueryKey,
  fetcher: QueryFunction<T>,
  websocketUrl: string
): UseQueryResult<T> & {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
} {
  // Implement real-time query with WebSocket
  // Handle connection states
  // Update cache on WebSocket messages
  // Provide connection status
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
      content: `This is the content of post ${page * limit + i + 1}. It demonstrates pagination and infinite scrolling patterns.`,
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

// User Profile Component
const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  // TODO: Use smart caching for user data
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => mockApi.getUser(userId),
    // Add staleTime and cacheTime configuration
  });

  // TODO: Implement optimistic user updates
  const updateUserMutation = useMutation({
    mutationFn: mockApi.updateUser,
    // Add optimistic updates
  });

  const handleUpdateUser = () => {
    updateUserMutation.mutate({
      id: userId,
      name: `Updated User ${Date.now()}`
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
      <h3>User Profile (Smart Caching)</h3>
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
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: updateUserMutation.isPending ? 'not-allowed' : 'pointer'
        }}
      >
        {updateUserMutation.isPending ? 'Updating...' : 'Update User (Optimistic)'}
      </button>
    </div>
  );
};

// Infinite Posts Component
const InfinitePosts: React.FC = () => {
  // TODO: Implement infinite pagination
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam = 0 }) => mockApi.getPosts({ page: pageParam, limit: 5 }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    // Add initial page param and other options
  });

  // TODO: Implement optimistic like updates
  const likeMutation = useMutation({
    mutationFn: mockApi.likePost,
    // Add optimistic updates for likes
  });

  const handleLikePost = (postId: string) => {
    likeMutation.mutate(postId);
  };

  if (isLoading) return <div style={{ padding: '20px' }}>Loading posts...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error loading posts</div>;

  const posts = postsData?.pages.flatMap(page => page.data) || [];

  return (
    <div style={{ padding: '20px' }}>
      <h3>Infinite Posts (Background Refetching)</h3>
      
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
                👍 Like
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

  // TODO: Implement background sync
  const { data: syncData, isLoading } = useQuery({
    queryKey: ['background-sync'],
    queryFn: async () => {
      const response = await mockApi.getPosts({ page: 0, limit: 3 });
      setLastUpdate(new Date());
      return response;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    // Add additional background sync options
  });

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#f0f8ff'
    }}>
      <h3>Background Sync Demo</h3>
      <p>
        This component automatically refetches data every 10 seconds to demonstrate 
        background synchronization patterns.
      </p>
      
      {lastUpdate && (
        <p style={{ fontSize: '14px', color: '#666' }}>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}

      {isLoading ? (
        <p>Syncing...</p>
      ) : (
        <div>
          <p><strong>Latest Posts Count:</strong> {syncData?.data.length || 0}</p>
          <p><strong>Status:</strong> ✅ Synchronized</p>
        </div>
      )}
    </div>
  );
};

// Offline Status Component
const OfflineStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedRequests, setQueuedRequests] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div style={{
      padding: '15px',
      backgroundColor: isOnline ? '#d4edda' : '#f8d7da',
      border: `1px solid ${isOnline ? '#c3e6cb' : '#f5c6cb'}`,
      borderRadius: '4px',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>
          {isOnline ? '🟢' : '🔴'}
        </span>
        <div>
          <strong>
            {isOnline ? 'Online' : 'Offline'}
          </strong>
          {!isOnline && queuedRequests > 0 && (
            <span style={{ marginLeft: '10px', fontSize: '14px' }}>
              ({queuedRequests} requests queued)
            </span>
          )}
        </div>
      </div>
      {!isOnline && (
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#721c24' }}>
          You're currently offline. Changes will be synced when connection is restored.
        </p>
      )}
    </div>
  );
};

// Main Demo Component
const DataFetchingDemo: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Modern Data Fetching Patterns</h1>
      
      <OfflineStatus />

      <div style={{ 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        padding: '15px', 
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <h3>⚠️ Implementation Required</h3>
        <ul style={{ margin: 0 }}>
          <li>Complete the QueryClient configuration with advanced options</li>
          <li>Implement CacheManager for intelligent cache operations</li>
          <li>Create optimistic update patterns with rollback support</li>
          <li>Build OfflineManager for queue management and sync</li>
          <li>Implement custom hooks for common data fetching patterns</li>
          <li>Add real-time synchronization with WebSocket support</li>
        </ul>
      </div>

      <UserProfile userId="1" />
      
      <InfinitePosts />
      
      <BackgroundSyncDemo />

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h3>🚀 Pattern Implementation Guide</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          <div>
            <h4>✅ Smart Caching</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Stale-while-revalidate patterns</li>
              <li>Cache invalidation strategies</li>
              <li>Memory optimization</li>
            </ul>
          </div>
          <div>
            <h4>🔄 Optimistic Updates</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Immediate UI feedback</li>
              <li>Rollback on failure</li>
              <li>Conflict resolution</li>
            </ul>
          </div>
          <div>
            <h4>📡 Background Sync</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Automatic refetching</li>
              <li>Network recovery handling</li>
              <li>Focus-based updates</li>
            </ul>
          </div>
          <div>
            <h4>📱 Offline Support</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Request queue management</li>
              <li>Offline detection</li>
              <li>Sync on reconnection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Query Client Setup (TODO: Replace with your implementation)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
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