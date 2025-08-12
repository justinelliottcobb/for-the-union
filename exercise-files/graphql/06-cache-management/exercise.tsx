// Advanced Apollo Cache Management Exercise
// Master cache normalization, optimistic updates, and sophisticated caching strategies

import React, { useState, useCallback } from 'react';
import {
  useApolloClient,
  useQuery,
  useMutation,
  gql,
  ApolloCache,
  Reference,
  StoreObject,
  makeVar,
  ReactiveVar,
  InMemoryCache,
  FieldPolicy,
  TypePolicy
} from '@apollo/client';

// TODO 1: Understanding Cache Normalization
// Apollo normalizes objects by their __typename and id/key fields

export interface User {
  __typename: 'User';
  id: string;
  username: string;
  email: string;
  profile: UserProfile;
  posts: Post[];
  followers: User[];
  following: User[];
  stats: UserStats;
}

export interface UserProfile {
  __typename: 'UserProfile';
  id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
}

export interface Post {
  __typename: 'Post';
  id: string;
  title: string;
  content: string;
  author: User;
  tags: string[];
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  __typename: 'Comment';
  id: string;
  content: string;
  author: User;
  post: Reference; // Reference to avoid circular dependency
  likes: number;
  replies: Comment[];
  createdAt: string;
}

export interface UserStats {
  __typename: 'UserStats';
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesReceived: number;
}

// TODO 2: Advanced Type Policies for Complex Data Structures
const advancedTypePolicies: Record<string, TypePolicy> = {
  User: {
    keyFields: ['id'],
    fields: {
      posts: {
        // TODO: Implement sophisticated posts merging with pagination
        keyArgs: ['sortBy', 'filter'], // Cache different sorts/filters separately
        merge(existing: any[] = [], incoming: any[], { args, readField }) {
          // TODO: Handle different merge scenarios:
          // 1. Initial load vs pagination
          // 2. Cache-first vs network-first
          // 3. Optimistic updates vs real data

          const isInitialLoad = !existing.length;
          const offset = args?.offset || 0;

          if (isInitialLoad || offset === 0) {
            // Initial load or refresh - replace existing
            return incoming;
          } else {
            // Pagination - merge with existing
            const existingIds = existing.map(ref => readField('id', ref));
            const newPosts = incoming.filter(post => 
              !existingIds.includes(readField('id', post))
            );
            return [...existing, ...newPosts];
          }
        }
      },

      followers: {
        // TODO: Implement followers list management
        merge(existing: any[] = [], incoming: any[], { args }) {
          // Handle follow/unfollow operations
          if (args?.operation === 'follow') {
            return [...existing, ...incoming];
          } else if (args?.operation === 'unfollow') {
            const unfollowIds = incoming.map(ref => ref.__ref?.split(':')[1]);
            return existing.filter(ref => 
              !unfollowIds.includes(ref.__ref?.split(':')[1])
            );
          }
          return incoming; // Default replacement
        }
      },

      stats: {
        // TODO: Implement stats merging with computed fields
        merge(existing: any, incoming: any) {
          // Always take the latest stats but preserve client-side computations
          return { ...existing, ...incoming };
        }
      },

      // Computed field example
      displayName: {
        read(existing, { readField }) {
          // TODO: Compute display name from profile data
          const profile = readField('profile') as any;
          if (profile) {
            const firstName = readField('firstName', profile);
            const lastName = readField('lastName', profile);
            return `${firstName} ${lastName}`.trim();
          }
          return readField('username');
        }
      }
    }
  },

  Post: {
    keyFields: ['id'],
    fields: {
      comments: {
        // TODO: Handle nested comments with threading
        keyArgs: ['sortBy'],
        merge(existing: any[] = [], incoming: any[], { args, readField }) {
          const sortBy = args?.sortBy || 'createdAt';
          
          if (sortBy === 'threaded') {
            // TODO: Handle threaded comment merging
            return mergeThreadedComments(existing, incoming);
          } else {
            // Simple chronological merge
            return [...existing, ...incoming];
          }
        }
      },

      // Reactive field for like status
      isLiked: {
        read(existing, { readField, variables }) {
          // TODO: Determine if current user has liked this post
          // This could be computed from a local state or user's liked posts
          const currentUserId = getCurrentUserId();
          const likedPosts = getLikedPostsVar();
          const postId = readField('id');
          
          return likedPosts.includes(postId);
        }
      },

      // Computed field for engagement rate
      engagementRate: {
        read(existing, { readField }) {
          const likes = readField('likes') as number || 0;
          const comments = (readField('comments') as any[])?.length || 0;
          const author = readField('author') as any;
          const followers = readField('followers', author) as any[] || [];
          
          if (followers.length === 0) return 0;
          return ((likes + comments) / followers.length * 100).toFixed(2);
        }
      }
    }
  },

  Query: {
    fields: {
      // TODO: Implement feed merging with complex logic
      feed: {
        keyArgs: ['filter', 'algorithm'],
        merge(existing: any[] = [], incoming: any[], { args, readField }) {
          // TODO: Handle different feed algorithms
          const algorithm = args?.algorithm || 'chronological';
          
          switch (algorithm) {
            case 'chronological':
              return mergeChronological(existing, incoming);
            case 'engagement':
              return mergeByEngagement(existing, incoming, readField);
            case 'personalized':
              return mergePersonalized(existing, incoming, readField);
            default:
              return incoming;
          }
        }
      },

      // Search results with different merge strategies
      search: {
        keyArgs: ['query', 'type'],
        merge(existing: any, incoming: any, { args }) {
          const query = args?.query || '';
          
          // Don't merge search results - always replace
          // Search is context-specific
          return incoming;
        }
      }
    }
  }
};

// TODO 3: Helper functions for complex merging
function mergeThreadedComments(existing: any[], incoming: any[]): any[] {
  // TODO: Implement threaded comment merging logic
  // Handle parent-child relationships
  // Maintain proper nesting structure
  throw new Error('TODO: Implement threaded comment merging');
}

function mergeChronological(existing: any[], incoming: any[]): any[] {
  // TODO: Merge posts in chronological order
  // Remove duplicates and sort by creation date
  const existingIds = new Set(existing.map(post => post.__ref));
  const newPosts = incoming.filter(post => !existingIds.has(post.__ref));
  
  return [...existing, ...newPosts].sort((a, b) => {
    // This would need access to readField to get createdAt
    // For now, assume incoming is already sorted
    return 0;
  });
}

function mergeByEngagement(existing: any[], incoming: any[], readField: any): any[] {
  // TODO: Sort by engagement (likes + comments)
  throw new Error('TODO: Implement engagement-based merging');
}

function mergePersonalized(existing: any[], incoming: any[], readField: any): any[] {
  // TODO: Merge based on user preferences and behavior
  throw new Error('TODO: Implement personalized feed merging');
}

// TODO 4: Reactive Variables for Client-Side State
export const currentUserVar: ReactiveVar<User | null> = makeVar<User | null>(null);
export const likedPostsVar: ReactiveVar<string[]> = makeVar<string[]>([]);
export const viewedPostsVar: ReactiveVar<string[]> = makeVar<string[]>([]);
export const offlineModeVar: ReactiveVar<boolean> = makeVar<boolean>(false);
export const uiStateVar: ReactiveVar<{
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
}> = makeVar({
  sidebarOpen: false,
  theme: 'light',
  fontSize: 'medium'
});

// Helper functions for reactive variables
export const getCurrentUserId = () => currentUserVar()?.id;
export const getLikedPostsVar = () => likedPostsVar();

// TODO 5: Cache Manipulation Utilities
export class CacheManager {
  private cache: ApolloCache<any>;

  constructor(cache: ApolloCache<any>) {
    this.cache = cache;
  }

  // TODO: Read data from cache
  readUser(userId: string): User | null {
    try {
      return this.cache.readFragment({
        id: `User:${userId}`,
        fragment: gql`
          fragment UserFragment on User {
            id
            username
            email
            profile {
              firstName
              lastName
              avatar
            }
            stats {
              postsCount
              followersCount
              followingCount
            }
          }
        `
      });
    } catch (error) {
      console.warn(`Could not read user ${userId} from cache:`, error);
      return null;
    }
  }

  // TODO: Write data to cache
  writeUser(user: Partial<User> & { id: string }): void {
    try {
      this.cache.writeFragment({
        id: `User:${user.id}`,
        fragment: gql`
          fragment UserUpdateFragment on User {
            id
            username
            email
            profile {
              firstName
              lastName
              avatar
              bio
            }
          }
        `,
        data: user
      });
    } catch (error) {
      console.error(`Could not write user ${user.id} to cache:`, error);
    }
  }

  // TODO: Update user stats atomically
  updateUserStats(userId: string, updates: Partial<UserStats>): void {
    this.cache.modify({
      id: `User:${userId}`,
      fields: {
        stats(existingStats: UserStats | Reference) {
          // TODO: Merge new stats with existing
          if (existingStats && typeof existingStats === 'object' && '__ref' in existingStats) {
            // It's a reference, need to read the actual object
            const stats = this.cache.readFragment({
              id: existingStats.__ref,
              fragment: gql`
                fragment StatsFragment on UserStats {
                  postsCount
                  followersCount
                  followingCount
                  likesReceived
                }
              `
            });
            return { ...stats, ...updates };
          } else {
            return { ...existingStats, ...updates };
          }
        }
      }
    });
  }

  // TODO: Add post to user's posts list
  addPostToUser(userId: string, post: Post): void {
    this.cache.modify({
      id: `User:${userId}`,
      fields: {
        posts(existingPosts: Reference[] = []) {
          const newPostRef = this.cache.writeFragment({
            fragment: gql`
              fragment NewPost on Post {
                id
                title
                content
                author {
                  id
                }
                likes
                createdAt
              }
            `,
            data: post
          });
          
          // Add to beginning of posts array
          return [newPostRef, ...existingPosts];
        }
      }
    });

    // Also update user stats
    this.updateUserStats(userId, { postsCount: undefined }); // Will be recalculated
  }

  // TODO: Remove post from cache and update references
  removePost(postId: string, authorId: string): void {
    // Remove from user's posts
    this.cache.modify({
      id: `User:${authorId}`,
      fields: {
        posts(existingPosts: Reference[]) {
          return existingPosts.filter(postRef => 
            this.cache.identify({ __typename: 'Post', id: postId }) !== postRef.__ref
          );
        }
      }
    });

    // Evict the post itself
    this.cache.evict({ id: `Post:${postId}` });
    
    // Clean up orphaned references
    this.cache.gc();
  }

  // TODO: Update post like count with optimistic updates
  optimisticLikePost(postId: string, increment: boolean = true): void {
    this.cache.modify({
      id: `Post:${postId}`,
      fields: {
        likes(existingLikes: number = 0) {
          return increment ? existingLikes + 1 : Math.max(0, existingLikes - 1);
        },
        isLiked() {
          return increment;
        }
      }
    });

    // Update reactive variable
    const likedPosts = likedPostsVar();
    if (increment) {
      likedPostsVar([...likedPosts, postId]);
    } else {
      likedPostsVar(likedPosts.filter(id => id !== postId));
    }
  }

  // TODO: Prefetch related data
  prefetchUserPosts(userId: string): void {
    // This would typically trigger a query to prefetch data
    // For now, we'll simulate loading related user data
    
    const user = this.readUser(userId);
    if (user) {
      // TODO: Prefetch user's followers, following, etc.
      console.log(`Prefetching data for user: ${user.username}`);
    }
  }

  // TODO: Export cache for debugging
  exportCache(): any {
    return this.cache.extract();
  }

  // TODO: Analyze cache size and structure
  analyzeCacheHealth(): {
    totalObjects: number;
    typeBreakdown: Record<string, number>;
    orphanedObjects: number;
    cacheSize: number;
  } {
    const cacheData = this.cache.extract();
    const typeBreakdown: Record<string, number> = {};
    let orphanedObjects = 0;

    Object.keys(cacheData).forEach(key => {
      if (key === 'ROOT_QUERY' || key === 'ROOT_MUTATION') return;
      
      const [typename] = key.split(':');
      typeBreakdown[typename] = (typeBreakdown[typename] || 0) + 1;

      // TODO: Detect orphaned objects (not referenced by any query)
      // This is a simplified check
      const obj = cacheData[key];
      if (obj && typeof obj === 'object' && !obj.__ref) {
        // Check if this object is referenced elsewhere
        const isReferenced = Object.values(cacheData).some(other => 
          JSON.stringify(other).includes(key)
        );
        if (!isReferenced) orphanedObjects++;
      }
    });

    return {
      totalObjects: Object.keys(cacheData).length,
      typeBreakdown,
      orphanedObjects,
      cacheSize: JSON.stringify(cacheData).length
    };
  }
}

// TODO 6: Cache-First Strategies with Fallbacks
export const CACHE_FIRST_QUERIES = {
  GET_USER_PROFILE: gql`
    query GetUserProfile($userId: ID!) {
      user(id: $userId) {
        id
        username
        profile {
          firstName
          lastName
          bio
          avatar
        }
        stats {
          postsCount
          followersCount
          followingCount
        }
      }
    }
  `,

  GET_POST_DETAILS: gql`
    query GetPostDetails($postId: ID!) {
      post(id: $postId) {
        id
        title
        content
        author {
          id
          username
          profile {
            firstName
            lastName
            avatar
          }
        }
        likes
        isLiked
        comments {
          id
          content
          author {
            id
            username
            profile {
              avatar
            }
          }
          createdAt
        }
        createdAt
        updatedAt
      }
    }
  `
};

// TODO 7: Custom Hook for Cache-Aware Data Fetching
export function useCacheAwareQuery<TData, TVariables>(
  query: any,
  options: {
    variables?: TVariables;
    cacheFirst?: boolean;
    staleTime?: number;
    backgroundRefetch?: boolean;
  } = {}
) {
  const client = useApolloClient();
  const [cacheAge, setCacheAge] = useState<number>(0);

  // TODO: Implement cache-aware query logic
  const { data, loading, error, refetch } = useQuery<TData, TVariables>(query, {
    variables: options.variables,
    fetchPolicy: options.cacheFirst ? 'cache-first' : 'cache-and-network',
    nextFetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    
    onCompleted: () => {
      setCacheAge(Date.now());
    }
  });

  // TODO: Check if data is stale
  const isStale = options.staleTime ? 
    (Date.now() - cacheAge) > options.staleTime : false;

  // TODO: Background refetch if stale
  React.useEffect(() => {
    if (isStale && options.backgroundRefetch && data) {
      refetch();
    }
  }, [isStale, options.backgroundRefetch, data, refetch]);

  return {
    data,
    loading,
    error,
    refetch,
    isStale,
    cacheAge: Date.now() - cacheAge
  };
}

// TODO 8: Cache Warming Strategies
export const useCacheWarming = () => {
  const client = useApolloClient();
  const cacheManager = new CacheManager(client.cache);

  const warmCache = useCallback(async (strategy: 'user-centric' | 'content-centric' | 'hybrid') => {
    switch (strategy) {
      case 'user-centric':
        // TODO: Warm cache with user-related data
        const currentUser = currentUserVar();
        if (currentUser) {
          // Prefetch user's posts, followers, following
          cacheManager.prefetchUserPosts(currentUser.id);
        }
        break;

      case 'content-centric':
        // TODO: Warm cache with trending content
        // Prefetch popular posts, trending topics
        break;

      case 'hybrid':
        // TODO: Combine both strategies
        break;
    }
  }, [cacheManager]);

  return { warmCache };
};

// TODO 9: Cache Persistence and Restoration
export const useCachePersistence = () => {
  const client = useApolloClient();

  const persistCache = useCallback(() => {
    try {
      const cacheData = client.cache.extract();
      localStorage.setItem('apollo-cache', JSON.stringify({
        data: cacheData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Could not persist cache:', error);
    }
  }, [client.cache]);

  const restoreCache = useCallback(() => {
    try {
      const cached = localStorage.getItem('apollo-cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        
        // Check if cache is not too old (e.g., 1 hour)
        const isStale = Date.now() - timestamp > 60 * 60 * 1000;
        
        if (!isStale) {
          client.cache.restore(data);
          return true;
        } else {
          localStorage.removeItem('apollo-cache');
        }
      }
    } catch (error) {
      console.warn('Could not restore cache:', error);
      localStorage.removeItem('apollo-cache');
    }
    return false;
  }, [client.cache]);

  const clearPersistedCache = useCallback(() => {
    localStorage.removeItem('apollo-cache');
  }, []);

  return { persistCache, restoreCache, clearPersistedCache };
};

// TODO 10: Example Components Demonstrating Cache Patterns
export const CacheManagementDemo: React.FC = () => {
  const client = useApolloClient();
  const cacheManager = new CacheManager(client.cache);
  const { warmCache } = useCacheWarming();
  const { persistCache, restoreCache, clearPersistedCache } = useCachePersistence();
  
  const [cacheStats, setCacheStats] = useState(cacheManager.analyzeCacheHealth());
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const refreshStats = () => {
    setCacheStats(cacheManager.analyzeCacheHealth());
  };

  const handleLikePost = (postId: string) => {
    // Optimistic update
    cacheManager.optimisticLikePost(postId, true);
    
    // TODO: Trigger actual mutation
    // likePostMutation({ variables: { postId } });
  };

  return (
    <div className="cache-management-demo">
      <h2>Advanced Cache Management Demo</h2>
      
      {/* Cache Statistics */}
      <section className="cache-stats">
        <h3>Cache Health Analysis</h3>
        <button onClick={refreshStats}>Refresh Stats</button>
        
        <div className="stats-grid">
          <div>Total Objects: {cacheStats.totalObjects}</div>
          <div>Cache Size: {(cacheStats.cacheSize / 1024).toFixed(2)} KB</div>
          <div>Orphaned Objects: {cacheStats.orphanedObjects}</div>
        </div>

        <div className="type-breakdown">
          <h4>Type Breakdown:</h4>
          {Object.entries(cacheStats.typeBreakdown).map(([type, count]) => (
            <div key={type}>{type}: {count}</div>
          ))}
        </div>
      </section>

      {/* Cache Operations */}
      <section className="cache-operations">
        <h3>Cache Operations</h3>
        
        <div className="operation-buttons">
          <button onClick={() => warmCache('user-centric')}>
            Warm Cache (User-Centric)
          </button>
          <button onClick={() => warmCache('content-centric')}>
            Warm Cache (Content-Centric)
          </button>
          <button onClick={persistCache}>
            Persist Cache
          </button>
          <button onClick={() => restoreCache()}>
            Restore Cache
          </button>
          <button onClick={clearPersistedCache}>
            Clear Persisted Cache
          </button>
          <button onClick={() => client.cache.reset()}>
            Reset Cache
          </button>
        </div>
      </section>

      {/* Manual Cache Manipulation */}
      <section className="cache-manipulation">
        <h3>Manual Cache Manipulation</h3>
        
        <div className="user-operations">
          <input
            type="text"
            placeholder="User ID"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          />
          
          <button 
            onClick={() => cacheManager.prefetchUserPosts(selectedUserId)}
            disabled={!selectedUserId}
          >
            Prefetch User Posts
          </button>
          
          <button
            onClick={() => {
              const user = cacheManager.readUser(selectedUserId);
              console.log('User from cache:', user);
            }}
            disabled={!selectedUserId}
          >
            Read User from Cache
          </button>
        </div>
      </section>

      {/* Reactive Variables Demo */}
      <section className="reactive-variables">
        <h3>Reactive Variables</h3>
        
        <div className="reactive-controls">
          <label>
            <input
              type="checkbox"
              checked={offlineModeVar()}
              onChange={(e) => offlineModeVar(e.target.checked)}
            />
            Offline Mode
          </label>
          
          <select
            value={uiStateVar().theme}
            onChange={(e) => uiStateVar({
              ...uiStateVar(),
              theme: e.target.value as 'light' | 'dark'
            })}
          >
            <option value="light">Light Theme</option>
            <option value="dark">Dark Theme</option>
          </select>
        </div>
      </section>

      {/* Cache Export */}
      <section className="cache-export">
        <h3>Cache Debug</h3>
        <button onClick={() => console.log('Cache Export:', cacheManager.exportCache())}>
          Export Cache to Console
        </button>
      </section>
    </div>
  );
};

export default CacheManagementDemo;