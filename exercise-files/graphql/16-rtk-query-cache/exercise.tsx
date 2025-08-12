// RTK Query Cache Tag Invalidation Strategies Exercise
// Master RTK Query cache invalidation with tags for GraphQL data consistency

import React, { useState, useCallback } from 'react';
import { Provider, useSelector } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';

// TODO 1: Advanced Tag System Design
// Create a sophisticated tag system for complex relationships

// Base entity tags
type EntityTags = 
  | 'User'
  | 'Post' 
  | 'Comment'
  | 'Tag'
  | 'Like'
  | 'Follow';

// Relationship tags
type RelationshipTags =
  | 'UserPosts'
  | 'UserComments'
  | 'UserFollowers'
  | 'UserFollowing'
  | 'PostComments'
  | 'PostLikes'
  | 'PostTags'
  | 'TagPosts'
  | 'UserLikes'
  | 'Dashboard';

type AllTags = EntityTags | RelationshipTags;

// TODO: Tag utility functions
export const tagUtils = {
  // Create entity tag with ID
  entity: <T extends EntityTags>(type: T, id?: string | number) => 
    id ? { type, id } as const : { type, id: 'LIST' } as const,
  
  // Create relationship tag
  relationship: <T extends RelationshipTags>(type: T, id: string | number) => 
    ({ type, id }) as const,
  
  // Create multiple entity tags
  entities: <T extends EntityTags>(type: T, ids: (string | number)[]) =>
    ids.map(id => ({ type, id })) as const,
  
  // Invalidate entire entity type
  invalidateAll: <T extends AllTags>(type: T) => 
    [{ type, id: 'LIST' }, { type, id: 'PARTIAL-LIST' }] as const,
};

// TODO 2: Interface Definitions with Cache Metadata
interface CacheTimestamp {
  lastFetched: string;
  lastUpdated: string;
}

export interface User extends CacheTimestamp {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  createdAt: string;
}

export interface Post extends CacheTimestamp {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  authorId: string;
  author: User;
  likesCount: number;
  commentsCount: number;
  tags: PostTag[];
  isLiked?: boolean;
  isBookmarked?: boolean;
  publishedAt: string;
}

export interface Comment extends CacheTimestamp {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author: User;
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
}

export interface PostTag {
  id: string;
  name: string;
  slug: string;
  postsCount: number;
}

// TODO 3: Enhanced API with Advanced Caching Strategies

export const cacheApi = createApi({
  reducerPath: 'cacheApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.example.com/graphql',
    prepareHeaders: (headers) => {
      headers.set('content-type', 'application/json');
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'User', 'Post', 'Comment', 'Tag', 'Like', 'Follow',
    'UserPosts', 'UserComments', 'UserFollowers', 'UserFollowing',
    'PostComments', 'PostLikes', 'PostTags', 'TagPosts', 
    'UserLikes', 'Dashboard'
  ],
  endpoints: (builder) => ({
    
    // TODO 4: Query Endpoints with Complex Tag Strategies
    
    // Get users with comprehensive tagging
    getUsers: builder.query<{ users: User[] }, { search?: string; limit?: number }>({
      query: ({ search, limit = 20 }) => ({
        url: '',
        method: 'POST',
        body: {
          query: `
            query GetUsers($search: String, $limit: Int) {
              users(search: $search, limit: $limit) {
                id username email fullName avatar bio
                postsCount followersCount followingCount isFollowing
                createdAt
              }
            }
          `,
          variables: { search, limit },
        },
      }),
      transformResponse: (response: any) => ({
        users: response.data.users.map((user: User) => ({
          ...user,
          lastFetched: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        })),
      }),
      providesTags: (result) => 
        result ? [
          ...tagUtils.entities('User', result.users.map(u => u.id)),
          tagUtils.entity('User'),
          // Add dashboard tag since users affect dashboard
          tagUtils.relationship('Dashboard', 'users'),
        ] : [tagUtils.entity('User')],
    }),

    // Get user dashboard data with multiple relationships
    getUserDashboard: builder.query<{
      user: User;
      recentPosts: Post[];
      followers: User[];
      following: User[];
      likedPosts: Post[];
    }, string>({
      query: (userId) => ({
        url: '',
        method: 'POST',
        body: {
          query: `
            query GetUserDashboard($userId: ID!) {
              user(id: $userId) {
                id username fullName avatar bio
                postsCount followersCount followingCount
              }
              recentPosts: posts(authorId: $userId, limit: 5) {
                id title excerpt likesCount commentsCount publishedAt
              }
              followers: userFollowers(userId: $userId, limit: 10) {
                id username fullName avatar
              }
              following: userFollowing(userId: $userId, limit: 10) {
                id username fullName avatar
              }
              likedPosts: userLikedPosts(userId: $userId, limit: 5) {
                id title author { fullName } likesCount
              }
            }
          `,
          variables: { userId },
        },
      }),
      // TODO: Complex tag provision for dashboard data
      providesTags: (result, error, userId) => {
        if (!result) return [tagUtils.relationship('Dashboard', userId)];
        
        return [
          // User entity
          tagUtils.entity('User', userId),
          // User relationships
          tagUtils.relationship('UserPosts', userId),
          tagUtils.relationship('UserFollowers', userId),
          tagUtils.relationship('UserFollowing', userId),
          tagUtils.relationship('UserLikes', userId),
          // Dashboard aggregate
          tagUtils.relationship('Dashboard', userId),
          // Individual posts that appear in dashboard
          ...tagUtils.entities('Post', result.recentPosts.map(p => p.id)),
          ...tagUtils.entities('Post', result.likedPosts.map(p => p.id)),
          // Users that appear in followers/following
          ...tagUtils.entities('User', result.followers.map(u => u.id)),
          ...tagUtils.entities('User', result.following.map(u => u.id)),
        ];
      },
    }),

    // Get posts with tag-based caching
    getPosts: builder.query<{ posts: Post[] }, { 
      authorId?: string; 
      tagSlug?: string; 
      liked?: boolean;
      limit?: number; 
    }>({
      query: (filters) => ({
        url: '',
        method: 'POST', 
        body: {
          query: `
            query GetPosts($authorId: ID, $tagSlug: String, $liked: Boolean, $limit: Int) {
              posts(authorId: $authorId, tagSlug: $tagSlug, liked: $liked, limit: $limit) {
                id title excerpt authorId likesCount commentsCount
                author { id fullName avatar }
                tags { id name slug }
                isLiked isBookmarked publishedAt
              }
            }
          `,
          variables: filters,
        },
      }),
      // TODO: Conditional tag provision based on filters
      providesTags: (result, error, filters) => {
        if (!result) return [tagUtils.entity('Post')];
        
        const tags = [
          ...tagUtils.entities('Post', result.posts.map(p => p.id)),
          tagUtils.entity('Post'),
        ];
        
        // Add specific relationship tags based on filters
        if (filters.authorId) {
          tags.push(tagUtils.relationship('UserPosts', filters.authorId));
        }
        
        if (filters.tagSlug) {
          tags.push(tagUtils.relationship('TagPosts', filters.tagSlug));
        }
        
        if (filters.liked) {
          // This would need current user ID in real app
          tags.push(tagUtils.relationship('UserLikes', 'current'));
        }
        
        return tags;
      },
    }),

    // TODO 5: Mutation Endpoints with Strategic Cache Invalidation
    
    // Follow user with precise invalidation
    followUser: builder.mutation<{ success: boolean }, { userId: string; action: 'follow' | 'unfollow' }>({
      query: ({ userId, action }) => ({
        url: '',
        method: 'POST',
        body: {
          query: `
            mutation FollowUser($userId: ID!, $action: String!) {
              followUser(userId: $userId, action: $action) {
                success
              }
            }
          `,
          variables: { userId, action },
        },
      }),
      // TODO: Strategic cache invalidation for follow action
      invalidatesTags: (result, error, { userId }) => [
        // Target user's follower count and relationship status
        tagUtils.entity('User', userId),
        tagUtils.relationship('UserFollowers', userId),
        
        // Current user's following count and following list  
        tagUtils.entity('User', 'current'), // Would be actual current user ID
        tagUtils.relationship('UserFollowing', 'current'),
        
        // Dashboard data for both users
        tagUtils.relationship('Dashboard', userId),
        tagUtils.relationship('Dashboard', 'current'),
        
        // User lists that show follow status
        tagUtils.entity('User'),
      ],
      // TODO: Optimistic updates
      async onQueryStarted({ userId, action }, { dispatch, queryFulfilled }) {
        // Optimistic update for target user
        const userPatch = dispatch(
          cacheApi.util.updateQueryData('getUsers', {}, (draft) => {
            const user = draft.users.find(u => u.id === userId);
            if (user) {
              user.followersCount += action === 'follow' ? 1 : -1;
              user.isFollowing = action === 'follow';
            }
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          userPatch.undo();
        }
      },
    }),

    // Like post with cascade invalidation
    likePost: builder.mutation<{ success: boolean; likesCount: number }, { postId: string; action: 'like' | 'unlike' }>({
      query: ({ postId, action }) => ({
        url: '',
        method: 'POST',
        body: {
          query: `
            mutation LikePost($postId: ID!, $action: String!) {
              likePost(postId: $postId, action: $action) {
                success
                likesCount
              }
            }
          `,
          variables: { postId, action },
        },
      }),
      // TODO: Cascade invalidation for like action
      invalidatesTags: (result, error, { postId }) => [
        // The specific post
        tagUtils.entity('Post', postId),
        
        // All post lists that might contain this post
        tagUtils.entity('Post'),
        tagUtils.relationship('UserPosts', 'any'), // Would need actual author ID
        
        // User's liked posts list
        tagUtils.relationship('UserLikes', 'current'),
        
        // Dashboard that shows liked posts
        tagUtils.relationship('Dashboard', 'current'),
        
        // Post comments (like count visible in comments)
        tagUtils.relationship('PostComments', postId),
      ],
    }),

    // Create post with comprehensive cache updates
    createPost: builder.mutation<{ post: Post }, { title: string; content: string; tags: string[] }>({
      query: (input) => ({
        url: '',
        method: 'POST',
        body: {
          query: `
            mutation CreatePost($input: CreatePostInput!) {
              createPost(input: $input) {
                id title content excerpt authorId
                author { id fullName avatar }
                tags { id name slug }
                likesCount commentsCount publishedAt
              }
            }
          `,
          variables: { input },
        },
      }),
      // TODO: Comprehensive invalidation for new post
      invalidatesTags: (result) => {
        if (!result) return [];
        
        const post = result.post;
        return [
          // All post lists
          ...tagUtils.invalidateAll('Post'),
          
          // Author's posts and profile
          tagUtils.entity('User', post.authorId),
          tagUtils.relationship('UserPosts', post.authorId),
          
          // Tag-based post lists
          ...post.tags.map(tag => tagUtils.relationship('TagPosts', tag.slug)),
          
          // Dashboard updates
          tagUtils.relationship('Dashboard', post.authorId),
          
          // Global dashboard/feed
          tagUtils.relationship('Dashboard', 'global'),
        ];
      },
    }),

    // TODO 6: Cache Warming and Preloading Strategies
    
    // Prefetch user related data
    prefetchUserData: builder.query<void, string>({
      queryFn: () => ({ data: undefined }),
      async onCacheEntryAdded(userId, { dispatch }) {
        // Prefetch related data
        dispatch(cacheApi.util.prefetch('getUserDashboard', userId, { force: false }));
        dispatch(cacheApi.util.prefetch('getPosts', { authorId: userId, limit: 10 }, { force: false }));
      },
    }),
  }),
});

// TODO 7: Cache Management Utilities

export const useCacheManagement = () => {
  const dispatch = useAppDispatch();
  
  // TODO: Selective cache invalidation
  const invalidateUserCache = useCallback((userId: string) => {
    dispatch(cacheApi.util.invalidateTags([
      tagUtils.entity('User', userId),
      tagUtils.relationship('UserPosts', userId),
      tagUtils.relationship('UserFollowers', userId),
      tagUtils.relationship('UserFollowing', userId),
      tagUtils.relationship('Dashboard', userId),
    ]));
  }, [dispatch]);
  
  // TODO: Bulk cache operations
  const clearAllCaches = useCallback(() => {
    dispatch(cacheApi.util.resetApiState());
  }, [dispatch]);
  
  // TODO: Cache warming
  const warmCache = useCallback((userId: string) => {
    dispatch(cacheApi.util.prefetch('getUserDashboard', userId));
    dispatch(cacheApi.util.prefetch('getPosts', { authorId: userId }));
  }, [dispatch]);
  
  // TODO: Smart preloading based on user behavior
  const preloadRelatedData = useCallback((postId: string) => {
    // When user views a post, preload author data and comments
    const post = getCurrentPost(postId); // Would implement this
    if (post) {
      dispatch(cacheApi.util.prefetch('getUserDashboard', post.authorId));
      dispatch(cacheApi.util.prefetch('getPosts', { authorId: post.authorId, limit: 5 }));
    }
  }, [dispatch]);
  
  return {
    invalidateUserCache,
    clearAllCaches,
    warmCache,
    preloadRelatedData,
  };
};

// TODO 8: Cache Statistics and Monitoring

export const useCacheStats = () => {
  const apiState = useSelector((state: RootState) => state.cacheApi);
  
  const stats = {
    totalQueries: Object.keys(apiState.queries).length,
    totalSubscriptions: Object.keys(apiState.subscriptions).length,
    
    // Count by status
    staleQueries: Object.values(apiState.queries).filter(q => 
      q?.status === 'fulfilled' && 
      new Date(q.fulfilledTimeStamp || 0) < new Date(Date.now() - 5 * 60 * 1000)
    ).length,
    
    errorQueries: Object.values(apiState.queries).filter(q => q?.status === 'rejected').length,
    
    // Cache size estimation (rough)
    cacheSize: JSON.stringify(apiState.queries).length,
  };
  
  return stats;
};

// Export hooks
export const {
  useGetUsersQuery,
  useGetUserDashboardQuery,
  useGetPostsQuery,
  useFollowUserMutation,
  useLikePostMutation,
  useCreatePostMutation,
  usePrefetchUserDataQuery,
} = cacheApi;

// TODO 9: Store Configuration
export const store = configureStore({
  reducer: {
    [cacheApi.reducerPath]: cacheApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cacheApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

const useAppDispatch = () => useDispatch<AppDispatch>();
const useDispatch = (dispatch: any) => dispatch; // Simplified for demo

// TODO 10: Demo Component
export const CacheInvalidationExercise: React.FC = () => {
  const [userId, setUserId] = useState('user1');
  const cacheStats = useCacheStats();
  const { invalidateUserCache, clearAllCaches, warmCache } = useCacheManagement();
  
  return (
    <Provider store={store}>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2>RTK Query Cache Tag Invalidation Strategies</h2>
        
        {/* Cache Stats Panel */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h4>📊 Cache Statistics</h4>
            <div>Total Queries: {cacheStats.totalQueries}</div>
            <div>Stale Queries: {cacheStats.staleQueries}</div>
            <div>Error Queries: {cacheStats.errorQueries}</div>
            <div>Cache Size: ~{Math.round(cacheStats.cacheSize / 1024)}KB</div>
          </div>
          
          <div style={{ padding: '16px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
            <h4>🛠️ Cache Operations</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => invalidateUserCache(userId)}>
                Invalidate User Cache
              </button>
              <button onClick={() => warmCache(userId)}>
                Warm Cache for User
              </button>
              <button onClick={clearAllCaches}>
                Clear All Caches
              </button>
            </div>
          </div>
        </div>
        
        {/* User Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label>
            Select User: 
            <select value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="user1">User 1</option>
              <option value="user2">User 2</option>
              <option value="user3">User 3</option>
            </select>
          </label>
        </div>
        
        {/* Demo Sections */}
        <div style={{ display: 'grid', gap: '24px' }}>
          <CacheTagDemo userId={userId} />
          <InvalidationDemo />
          <OptimisticUpdatesDemo />
        </div>
        
        <div style={{ 
          marginTop: '32px', 
          padding: '16px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
        }}>
          <h4>🎯 Cache Invalidation Features:</h4>
          <ul>
            <li>🏷️ Strategic tag design for complex relationships</li>
            <li>🔄 Cascade invalidation for related data</li>
            <li>⚡ Optimistic updates with selective rollback</li>
            <li>📊 Cache warming and preloading strategies</li>
            <li>📈 Real-time cache statistics and monitoring</li>
            <li>🎯 Granular invalidation control</li>
          </ul>
        </div>
      </div>
    </Provider>
  );
};

// Placeholder components - TODO: Implement these
const CacheTagDemo = ({ userId }: { userId: string }) => <div>Cache tag demo for {userId}</div>;
const InvalidationDemo = () => <div>Invalidation strategies demo</div>;
const OptimisticUpdatesDemo = () => <div>Optimistic updates demo</div>;

// Helper function placeholder
const getCurrentPost = (postId: string): Post | null => null;

export default CacheInvalidationExercise;