// React Query Invalidation and Cache Synchronization Exercise
// Master React Query invalidation patterns for GraphQL data consistency

import React, { useState, useCallback } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
  useIsFetching,
  useIsMutating,
} from '@tanstack/react-query';

// TODO 1: Advanced Query Key Strategies
// Design invalidation-friendly query key structures

export const queryKeys = {
  // TODO: Create hierarchical query keys for precise invalidation
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    // TODO: Add relationship-based keys
    followers: (id: string) => [...queryKeys.users.detail(id), 'followers'] as const,
    following: (id: string) => [...queryKeys.users.detail(id), 'following'] as const,
  },
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.posts.lists(), filters] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
    // TODO: Add author-based and tag-based keys
    byAuthor: (authorId: string) => [...queryKeys.posts.all, 'byAuthor', authorId] as const,
    byTag: (tag: string) => [...queryKeys.posts.all, 'byTag', tag] as const,
    liked: (userId: string) => [...queryKeys.posts.all, 'liked', userId] as const,
  },
  // TODO: Add more entity types with relationship keys
} as const;

// TODO 2: Selective Invalidation Patterns
// Implement precise cache invalidation strategies

interface InvalidationStrategy {
  invalidateUsers?: boolean;
  invalidateUserDetails?: string[];
  invalidatePosts?: boolean;
  invalidatePostsByAuthor?: string[];
  invalidateRelatedData?: boolean;
}

// TODO: Implement selective invalidation utility
export function useSelectiveInvalidation() {
  const queryClient = useQueryClient();
  
  const invalidateWithStrategy = useCallback((strategy: InvalidationStrategy) => {
    const promises: Promise<void>[] = [];
    
    // TODO: Invalidate users
    if (strategy.invalidateUsers) {
      promises.push(
        queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
      );
    }
    
    // TODO: Invalidate specific user details
    if (strategy.invalidateUserDetails?.length) {
      strategy.invalidateUserDetails.forEach(userId => {
        promises.push(
          queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
        );
      });
    }
    
    // TODO: Invalidate posts
    if (strategy.invalidatePosts) {
      promises.push(
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() })
      );
    }
    
    // TODO: Invalidate posts by author
    if (strategy.invalidatePostsByAuthor?.length) {
      strategy.invalidatePostsByAuthor.forEach(authorId => {
        promises.push(
          queryClient.invalidateQueries({ queryKey: queryKeys.posts.byAuthor(authorId) })
        );
      });
    }
    
    // TODO: Invalidate related data
    if (strategy.invalidateRelatedData) {
      // TODO: Implement complex relationship invalidation
    }
    
    return Promise.all(promises);
  }, [queryClient]);
  
  return { invalidateWithStrategy };
}

// TODO 3: Mutation with Cache Updates
// Create mutations that update multiple related cache entries

interface User {
  id: string;
  username: string;
  fullName: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  likesCount: number;
  isLiked: boolean;
  tags: string[];
}

// TODO: Implement useFollowUser mutation
export function useFollowUser() {
  const queryClient = useQueryClient();
  const { invalidateWithStrategy } = useSelectiveInvalidation();
  
  return useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'follow' | 'unfollow' }) => {
      // TODO: API call simulation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { userId, action, success: true };
    },
    onMutate: async ({ userId, action }) => {
      // TODO: Implement optimistic updates
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(userId) });
      
      // Snapshot previous value
      const previousUser = queryClient.getQueryData(queryKeys.users.detail(userId));
      
      // Optimistically update user
      queryClient.setQueryData(queryKeys.users.detail(userId), (old: { user: User } | undefined) => {
        if (!old) return old;
        
        const delta = action === 'follow' ? 1 : -1;
        return {
          user: {
            ...old.user,
            followersCount: old.user.followersCount + delta,
          },
        };
      });
      
      return { previousUser };
    },
    onError: (err, variables, context) => {
      // TODO: Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(
          queryKeys.users.detail(variables.userId),
          context.previousUser
        );
      }
    },
    onSuccess: ({ userId, action }) => {
      // TODO: Invalidate related queries
      invalidateWithStrategy({
        invalidateUserDetails: [userId],
        invalidateUsers: true, // User counts changed
        invalidateRelatedData: true,
      });
    },
  });
}

// TODO: Implement useLikePost mutation
export function useLikePost() {
  const queryClient = useQueryClient();
  const { invalidateWithStrategy } = useSelectiveInvalidation();
  
  return useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: 'like' | 'unlike' }) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { postId, action, success: true };
    },
    onMutate: async ({ postId, action }) => {
      // TODO: Optimistic updates for post likes
      
      // Cancel related queries
      const postDetailKey = queryKeys.posts.detail(postId);
      await queryClient.cancelQueries({ queryKey: postDetailKey });
      
      // Snapshot
      const previousPost = queryClient.getQueryData(postDetailKey);
      
      // Update post like status and count
      queryClient.setQueryData(postDetailKey, (old: { post: Post } | undefined) => {
        if (!old) return old;
        
        const delta = action === 'like' ? 1 : -1;
        return {
          post: {
            ...old.post,
            isLiked: action === 'like',
            likesCount: old.post.likesCount + delta,
          },
        };
      });
      
      // TODO: Update post in lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.posts.lists() },
        (old: { posts: Post[] } | undefined) => {
          if (!old) return old;
          
          return {
            posts: old.posts.map(post => {
              if (post.id === postId) {
                const delta = action === 'like' ? 1 : -1;
                return {
                  ...post,
                  isLiked: action === 'like',
                  likesCount: post.likesCount + delta,
                };
              }
              return post;
            }),
          };
        }
      );
      
      return { previousPost };
    },
    onError: (err, { postId }, context) => {
      // TODO: Rollback optimistic updates
      if (context?.previousPost) {
        queryClient.setQueryData(queryKeys.posts.detail(postId), context.previousPost);
        
        // TODO: Revert list updates
        queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      }
    },
    onSuccess: ({ postId }) => {
      // TODO: Minimal invalidation - data already updated optimistically
      console.log('Like/unlike successful for post:', postId);
    },
  });
}

// TODO 4: Bulk Cache Operations
// Implement utilities for bulk cache updates and invalidation

export function useBulkCacheOperations() {
  const queryClient = useQueryClient();
  
  // TODO: Bulk invalidate by entity type
  const invalidateByEntityType = useCallback(async (entityType: 'users' | 'posts' | 'all') => {
    switch (entityType) {
      case 'users':
        await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
        break;
      case 'posts':
        await queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
        break;
      case 'all':
        await queryClient.invalidateQueries();
        break;
    }
  }, [queryClient]);
  
  // TODO: Bulk remove cache entries
  const removeCacheEntries = useCallback((entityType: 'users' | 'posts' | 'all') => {
    switch (entityType) {
      case 'users':
        queryClient.removeQueries({ queryKey: queryKeys.users.all });
        break;
      case 'posts':
        queryClient.removeQueries({ queryKey: queryKeys.posts.all });
        break;
      case 'all':
        queryClient.clear();
        break;
    }
  }, [queryClient]);
  
  // TODO: Prefetch related data
  const prefetchRelatedData = useCallback(async (userId: string) => {
    // Prefetch user details
    queryClient.prefetchQuery({
      queryKey: queryKeys.users.detail(userId),
      queryFn: () => fetchUser(userId),
      staleTime: 5 * 60 * 1000,
    });
    
    // Prefetch user posts
    queryClient.prefetchQuery({
      queryKey: queryKeys.posts.byAuthor(userId),
      queryFn: () => fetchPostsByAuthor(userId),
      staleTime: 3 * 60 * 1000,
    });
  }, [queryClient]);
  
  return {
    invalidateByEntityType,
    removeCacheEntries,
    prefetchRelatedData,
  };
}

// TODO 5: Cache Synchronization Patterns
// Implement patterns for keeping related data in sync

export function useCacheSynchronization() {
  const queryClient = useQueryClient();
  
  // TODO: Sync user data across different cache entries
  const syncUserData = useCallback((updatedUser: User) => {
    // Update user detail cache
    queryClient.setQueryData(
      queryKeys.users.detail(updatedUser.id),
      { user: updatedUser }
    );
    
    // TODO: Update user in lists
    queryClient.setQueriesData(
      { queryKey: queryKeys.users.lists() },
      (old: { users: User[] } | undefined) => {
        if (!old) return old;
        
        return {
          users: old.users.map(user => 
            user.id === updatedUser.id ? updatedUser : user
          ),
        };
      }
    );
    
    // TODO: Update author data in posts
    queryClient.setQueriesData(
      { queryKey: queryKeys.posts.lists() },
      (old: { posts: any[] } | undefined) => {
        if (!old) return old;
        
        return {
          posts: old.posts.map(post => 
            post.authorId === updatedUser.id 
              ? { ...post, author: updatedUser }
              : post
          ),
        };
      }
    );
  }, [queryClient]);
  
  return { syncUserData };
}

// TODO 6: React Components for Demonstration

// TODO: Implement InvalidationDemo component
export const InvalidationDemo: React.FC = () => {
  const queryClient = useQueryClient();
  const { invalidateWithStrategy } = useSelectiveInvalidation();
  const { invalidateByEntityType, removeCacheEntries } = useBulkCacheOperations();
  
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  
  const handleSelectiveInvalidation = () => {
    // TODO: Demonstrate selective invalidation
    invalidateWithStrategy({
      invalidateUsers: true,
      invalidateUserDetails: ['1', '2'],
      invalidatePosts: false,
    });
  };
  
  const handleBulkInvalidation = () => {
    // TODO: Demonstrate bulk invalidation
    invalidateByEntityType('all');
  };
  
  return (
    <div>
      <h3>Cache Invalidation Patterns</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <div>Global State: {isFetching ? '🔄 Fetching' : '✅ Idle'} | {isMutating ? '⏳ Mutating' : '✅ No Mutations'}</div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <button onClick={handleSelectiveInvalidation}>
          Selective Invalidation
        </button>
        
        <button onClick={handleBulkInvalidation}>
          Bulk Invalidation
        </button>
        
        <button onClick={() => invalidateByEntityType('users')}>
          Invalidate Users Only
        </button>
        
        <button onClick={() => invalidateByEntityType('posts')}>
          Invalidate Posts Only
        </button>
        
        <button onClick={() => removeCacheEntries('all')}>
          Clear All Cache
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: '#f8f9fa',
        padding: '12px',
        borderRadius: '4px',
        fontSize: '14px',
      }}>
        <strong>Cache Stats:</strong>
        <div>Queries in cache: {queryClient.getQueryCache().getAll().length}</div>
        <div>Mutations in progress: {isMutating}</div>
        <div>Active fetches: {isFetching}</div>
      </div>
    </div>
  );
};

// TODO: Implement UserInteractionDemo component
export const UserInteractionDemo: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState('1');
  const followUserMutation = useFollowUser();
  const { prefetchRelatedData } = useBulkCacheOperations();
  
  const handleFollow = () => {
    followUserMutation.mutate({
      userId: selectedUser,
      action: 'follow',
    });
  };
  
  const handlePrefetch = () => {
    prefetchRelatedData(selectedUser);
  };
  
  return (
    <div>
      <h3>User Interactions & Cache Updates</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <select 
          value={selectedUser} 
          onChange={(e) => setSelectedUser(e.target.value)}
          style={{ padding: '8px', marginRight: '8px' }}
        >
          <option value="1">User 1</option>
          <option value="2">User 2</option>
          <option value="3">User 3</option>
        </select>
        
        <button 
          onClick={handleFollow}
          disabled={followUserMutation.isPending}
          style={{ marginRight: '8px' }}
        >
          {followUserMutation.isPending ? 'Following...' : 'Follow User'}
        </button>
        
        <button onClick={handlePrefetch}>
          Prefetch Related Data
        </button>
      </div>
      
      <div>
        TODO: Show user details, follow status, and related data here
      </div>
    </div>
  );
};

// TODO 7: Main Exercise Component
export const QueryInvalidationExercise: React.FC = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000, // 2 minutes - shorter for demo
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: '20px' }}>
        <h2>Query Invalidation and Cache Synchronization</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Demonstrating advanced React Query invalidation patterns for maintaining 
          data consistency across related GraphQL entities.
        </p>
        
        <div style={{ display: 'grid', gap: '24px' }}>
          <InvalidationDemo />
          <UserInteractionDemo />
        </div>
        
        <div style={{ 
          marginTop: '32px', 
          padding: '16px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
        }}>
          <h4>🎯 Invalidation Strategies Demonstrated:</h4>
          <ul>
            <li>Selective invalidation based on data relationships</li>
            <li>Bulk operations for entity types</li>
            <li>Optimistic updates with rollback</li>
            <li>Cache synchronization across multiple queries</li>
            <li>Prefetching related data</li>
          </ul>
        </div>
      </div>
    </QueryClientProvider>
  );
};

// TODO: Mock API functions (implement these)
async function fetchUser(userId: string): Promise<User> {
  // TODO: Implement mock user fetch
  return {
    id: userId,
    username: `user_${userId}`,
    fullName: `User ${userId}`,
    followersCount: 100,
    followingCount: 50,
    postsCount: 25,
  };
}

async function fetchPostsByAuthor(authorId: string): Promise<Post[]> {
  // TODO: Implement mock posts fetch
  return [];
}

export default QueryInvalidationExercise;