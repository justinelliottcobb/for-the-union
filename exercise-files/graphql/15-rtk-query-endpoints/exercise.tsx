// RTK Query GraphQL Endpoints Exercise
// Create comprehensive GraphQL endpoints with queries, mutations, and subscriptions

import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

// TODO 1: Enhanced GraphQL Base Query
// Implement base query with improved error handling and transformations

interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
    extensions?: Record<string, any>;
  }>;
  extensions?: Record<string, any>;
}

// TODO: Implement enhanced GraphQL base query
const graphqlBaseQuery = (
  { baseUrl, prepareHeaders }: { baseUrl: string; prepareHeaders?: any } = { baseUrl: '' }
): BaseQueryFn<GraphQLRequest, unknown, FetchBaseQueryError> => {
  const baseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders,
  });
  
  return async (args, api, extraOptions) => {
    // TODO: Add request logging
    console.log('GraphQL Request:', {
      query: args.query.split('\n')[1]?.trim() || 'Unknown',
      variables: args.variables,
    });
    
    const httpArgs: FetchArgs = {
      url: '',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...args.headers,
      },
      body: JSON.stringify({
        query: args.query,
        variables: args.variables,
        operationName: args.operationName,
      }),
    };
    
    const result = await baseQuery(httpArgs, api, extraOptions);
    
    if (result.error) {
      return result;
    }
    
    const response = result.data as GraphQLResponse;
    
    // TODO: Enhanced error handling
    if (response.errors && response.errors.length > 0) {
      const firstError = response.errors[0];
      const errorType = firstError.extensions?.code || 'GRAPHQL_ERROR';
      
      return {
        error: {
          status: 'CUSTOM_ERROR',
          error: firstError.message,
          data: {
            errors: response.errors,
            type: errorType,
            path: firstError.path,
          },
        } as FetchBaseQueryError,
      };
    }
    
    // TODO: Add response logging
    console.log('GraphQL Response received:', Object.keys(response.data || {}));
    
    return { data: response.data };
  };
};

// TODO 2: Comprehensive Type Definitions
// Define all necessary types for the GraphQL schema

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  authorId: string;
  author: User;
  likesCount: number;
  commentsCount: number;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  isLiked?: boolean;
}

// Input types
export interface CreateUserInput {
  username: string;
  email: string;
  fullName: string;
  bio?: string;
  avatar?: string;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  fullName?: string;
  bio?: string;
  avatar?: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
}

export interface CreateCommentInput {
  content: string;
  postId: string;
}

// Filter types
export interface UserFilters {
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'fullName' | 'postsCount';
  sortOrder?: 'asc' | 'desc';
}

export interface PostFilters {
  authorId?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'likesCount' | 'commentsCount';
  sortOrder?: 'asc' | 'desc';
}

// TODO 3: Create Comprehensive API Definition
// Define all endpoints with proper error handling and transformations

export const graphqlApi = createApi({
  reducerPath: 'graphqlApi',
  baseQuery: graphqlBaseQuery({
    baseUrl: 'https://api.example.com/graphql',
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('x-client-version', '1.0.0');
      return headers;
    },
  }),
  tagTypes: ['User', 'Post', 'Comment', 'UserPosts', 'PostComments'],
  endpoints: (builder) => ({
    // TODO 4: User Endpoints
    
    // Get users with comprehensive filtering
    getUsers: builder.query<{ users: User[] }, UserFilters>({
      query: (filters = {}) => ({
        query: `
          query GetUsers($search: String, $limit: Int, $offset: Int, $sortBy: String, $sortOrder: String) {
            users(search: $search, limit: $limit, offset: $offset, sortBy: $sortBy, sortOrder: $sortOrder) {
              id
              username
              email
              fullName
              avatar
              bio
              createdAt
              updatedAt
              postsCount
              followersCount
              followingCount
              isFollowing
            }
          }
        `,
        variables: {
          search: filters.search,
          limit: filters.limit || 10,
          offset: filters.offset || 0,
          sortBy: filters.sortBy || 'createdAt',
          sortOrder: filters.sortOrder || 'desc',
        },
      }),
      // TODO: Transform response to add computed fields
      transformResponse: (response: { users: User[] }) => ({
        users: response.users.map(user => ({
          ...user,
          // Add computed field
          displayName: user.fullName || user.username,
        })),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.users.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),
    
    // Get single user with detailed information
    getUserById: builder.query<{ user: User }, string>({
      query: (id) => ({
        query: `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              username
              email
              fullName
              avatar
              bio
              createdAt
              updatedAt
              postsCount
              followersCount
              followingCount
              isFollowing
            }
          }
        `,
        variables: { id },
      }),
      // TODO: Handle user not found error
      transformErrorResponse: (response: FetchBaseQueryError) => {
        if (response.data && typeof response.data === 'object' && 'type' in response.data) {
          const errorData = response.data as any;
          if (errorData.type === 'NOT_FOUND') {
            return {
              status: 404,
              error: 'User not found',
              data: errorData,
            };
          }
        }
        return response;
      },
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    
    // TODO 5: Post Endpoints
    
    // Get posts with advanced filtering and sorting
    getPosts: builder.query<{ posts: Post[] }, PostFilters>({
      query: (filters = {}) => ({
        query: `
          query GetPosts($authorId: ID, $tag: String, $search: String, $limit: Int, $offset: Int, $sortBy: String, $sortOrder: String) {
            posts(authorId: $authorId, tag: $tag, search: $search, limit: $limit, offset: $offset, sortBy: $sortBy, sortOrder: $sortOrder) {
              id
              title
              content
              excerpt
              slug
              authorId
              author {
                id
                username
                fullName
                avatar
              }
              likesCount
              commentsCount
              tags
              publishedAt
              updatedAt
              isLiked
              isBookmarked
            }
          }
        `,
        variables: {
          authorId: filters.authorId,
          tag: filters.tag,
          search: filters.search,
          limit: filters.limit || 20,
          offset: filters.offset || 0,
          sortBy: filters.sortBy || 'publishedAt',
          sortOrder: filters.sortOrder || 'desc',
        },
      }),
      // TODO: Transform response to enhance post data
      transformResponse: (response: { posts: Post[] }) => ({
        posts: response.posts.map(post => ({
          ...post,
          // Add computed fields
          readingTime: Math.ceil(post.content.split(' ').length / 200), // ~200 WPM
          isRecent: new Date(post.publishedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        })),
      }),
      providesTags: (result, error, filters) => {
        if (!result) return [{ type: 'Post', id: 'LIST' }];
        
        const tags = [
          ...result.posts.map(({ id }) => ({ type: 'Post' as const, id })),
          { type: 'Post', id: 'LIST' },
        ];
        
        // Add author-specific tags
        if (filters.authorId) {
          tags.push({ type: 'UserPosts', id: filters.authorId });
        }
        
        return tags;
      },
    }),
    
    // Get single post with full details
    getPostById: builder.query<{ post: Post }, string>({
      query: (id) => ({
        query: `
          query GetPost($id: ID!) {
            post(id: $id) {
              id
              title
              content
              excerpt
              slug
              authorId
              author {
                id
                username
                fullName
                avatar
                bio
              }
              likesCount
              commentsCount
              tags
              publishedAt
              updatedAt
              isLiked
              isBookmarked
            }
          }
        `,
        variables: { id },
      }),
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    
    // TODO 6: Comment Endpoints
    
    // Get comments for a post
    getPostComments: builder.query<{ comments: Comment[] }, { postId: string; limit?: number; offset?: number }>({
      query: ({ postId, limit = 50, offset = 0 }) => ({
        query: `
          query GetPostComments($postId: ID!, $limit: Int, $offset: Int) {
            comments(postId: $postId, limit: $limit, offset: $offset) {
              id
              content
              postId
              authorId
              author {
                id
                username
                fullName
                avatar
              }
              createdAt
              updatedAt
              likesCount
              isLiked
            }
          }
        `,
        variables: { postId, limit, offset },
      }),
      providesTags: (result, error, { postId }) =>
        result
          ? [
              ...result.comments.map(({ id }) => ({ type: 'Comment' as const, id })),
              { type: 'PostComments', id: postId },
            ]
          : [{ type: 'PostComments', id: postId }],
    }),
    
    // TODO 7: Mutation Endpoints with Enhanced Error Handling
    
    // Create user with validation
    createUser: builder.mutation<{ createUser: User }, CreateUserInput>({
      query: (input) => ({
        query: `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
              username
              email
              fullName
              avatar
              bio
              createdAt
              updatedAt
              postsCount
              followersCount
              followingCount
            }
          }
        `,
        variables: { input },
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
      // TODO: Enhanced mutation lifecycle
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        try {
          const { data } = await queryFulfilled;
          
          // Update users list optimistically
          dispatch(
            graphqlApi.util.updateQueryData('getUsers', {}, (draft) => {
              draft.users.unshift(data.createUser);
            })
          );
          
          console.log('✅ User created successfully:', data.createUser.username);
        } catch (error) {
          console.error('❌ Failed to create user:', error);
        }
      },
    }),
    
    // Update user with optimistic updates
    updateUser: builder.mutation<{ updateUser: User }, { id: string; input: UpdateUserInput }>({
      query: ({ id, input }) => ({
        query: `
          mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
            updateUser(id: $id, input: $input) {
              id
              username
              email
              fullName
              avatar
              bio
              createdAt
              updatedAt
              postsCount
              followersCount
              followingCount
            }
          }
        `,
        variables: { id, input },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        { type: 'UserPosts', id }, // User data might appear in posts
      ],
      // TODO: Implement optimistic updates
      async onQueryStarted({ id, input }, { dispatch, queryFulfilled }) {
        // Optimistic update for user detail
        const patchResult = dispatch(
          graphqlApi.util.updateQueryData('getUserById', id, (draft) => {
            Object.assign(draft.user, input);
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          // Rollback on error
          patchResult.undo();
        }
      },
    }),
    
    // Create post with relationship updates
    createPost: builder.mutation<{ createPost: Post }, CreatePostInput>({
      query: (input) => ({
        query: `
          mutation CreatePost($input: CreatePostInput!) {
            createPost(input: $input) {
              id
              title
              content
              excerpt
              slug
              authorId
              author {
                id
                username
                fullName
                avatar
              }
              likesCount
              commentsCount
              tags
              publishedAt
              updatedAt
              isLiked
              isBookmarked
            }
          }
        `,
        variables: { input },
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'Post', id: 'LIST' },
              { type: 'UserPosts', id: result.createPost.authorId },
              { type: 'User', id: result.createPost.authorId }, // Post count changed
            ]
          : [],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          
          // Update posts list
          dispatch(
            graphqlApi.util.updateQueryData('getPosts', {}, (draft) => {
              draft.posts.unshift(data.createPost);
            })
          );
          
          // Update author's post count
          dispatch(
            graphqlApi.util.updateQueryData('getUserById', data.createPost.authorId, (draft) => {
              draft.user.postsCount += 1;
            })
          );
          
          console.log('✅ Post created:', data.createPost.title);
        } catch (error) {
          console.error('❌ Failed to create post:', error);
        }
      },
    }),
    
    // Like/Unlike post with optimistic updates
    togglePostLike: builder.mutation<{ togglePostLike: { postId: string; isLiked: boolean; likesCount: number } }, string>({
      query: (postId) => ({
        query: `
          mutation TogglePostLike($postId: ID!) {
            togglePostLike(postId: $postId) {
              postId
              isLiked
              likesCount
            }
          }
        `,
        variables: { postId },
      }),
      // TODO: Optimistic updates for like action
      async onQueryStarted(postId, { dispatch, queryFulfilled }) {
        // Optimistic update for post detail
        const postPatchResult = dispatch(
          graphqlApi.util.updateQueryData('getPostById', postId, (draft) => {
            draft.post.isLiked = !draft.post.isLiked;
            draft.post.likesCount += draft.post.isLiked ? 1 : -1;
          })
        );
        
        // Optimistic update for posts list
        const postListPatchResult = dispatch(
          graphqlApi.util.updateQueryData('getPosts', {}, (draft) => {
            const post = draft.posts.find(p => p.id === postId);
            if (post) {
              post.isLiked = !post.isLiked;
              post.likesCount += post.isLiked ? 1 : -1;
            }
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          // Rollback optimistic updates
          postPatchResult.undo();
          postListPatchResult.undo();
        }
      },
    }),
    
    // Add comment with cache updates
    addComment: builder.mutation<{ addComment: Comment }, CreateCommentInput>({
      query: (input) => ({
        query: `
          mutation AddComment($input: CreateCommentInput!) {
            addComment(input: $input) {
              id
              content
              postId
              authorId
              author {
                id
                username
                fullName
                avatar
              }
              createdAt
              updatedAt
              likesCount
              isLiked
            }
          }
        `,
        variables: { input },
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'PostComments', id: result.addComment.postId },
              { type: 'Post', id: result.addComment.postId }, // Comment count changed
            ]
          : [],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          
          // Update post comments count
          dispatch(
            graphqlApi.util.updateQueryData('getPostById', data.addComment.postId, (draft) => {
              draft.post.commentsCount += 1;
            })
          );
          
          console.log('✅ Comment added to post:', data.addComment.postId);
        } catch (error) {
          console.error('❌ Failed to add comment:', error);
        }
      },
    }),
  }),
});

// TODO 8: Export Generated Hooks
export const {
  // Query hooks
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetPostsQuery,
  useGetPostByIdQuery,
  useGetPostCommentsQuery,
  // Mutation hooks
  useCreateUserMutation,
  useUpdateUserMutation,
  useCreatePostMutation,
  useTogglePostLikeMutation,
  useAddCommentMutation,
  // Lazy query hooks
  useLazyGetUsersQuery,
  useLazyGetPostsQuery,
  // Utilities
  util: { getRunningQueriesThunk },
} = graphqlApi;

// TODO 9: Configure Store
export const store = configureStore({
  reducer: {
    [graphqlApi.reducerPath]: graphqlApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(graphqlApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;

// TODO 10: Demo Components
export const RTKQueryEndpointsExercise: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'post-detail'>('users');
  
  return (
    <Provider store={store}>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2>RTK Query GraphQL Endpoints</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Comprehensive GraphQL endpoints with advanced error handling, optimistic updates, 
          and cache invalidation strategies.
        </p>
        
        <div style={{ marginBottom: '24px' }}>
          <nav style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #ddd' }}>
            {[
              { key: 'users', label: '👥 Users' },
              { key: 'posts', label: '📝 Posts' },
              { key: 'post-detail', label: '📄 Post Detail' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: activeTab === tab.key ? '#3498db' : 'transparent',
                  color: activeTab === tab.key ? 'white' : '#333',
                  cursor: 'pointer',
                  borderRadius: '4px 4px 0 0',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div style={{ minHeight: '500px' }}>
          {activeTab === 'users' && <UsersSection />}
          {activeTab === 'posts' && <PostsSection />}
          {activeTab === 'post-detail' && <PostDetailSection />}
        </div>
        
        <div style={{ 
          marginTop: '32px', 
          padding: '16px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
        }}>
          <h4>🎯 Advanced Endpoint Features:</h4>
          <ul>
            <li>🔧 Enhanced error handling with custom transformations</li>
            <li>⚡ Optimistic updates with automatic rollback</li>
            <li>🏷️ Smart cache tagging for relationship updates</li>
            <li>📊 Response transformations with computed fields</li>
            <li>🔄 Automatic cache invalidation on mutations</li>
            <li>📝 Comprehensive logging and debugging</li>
          </ul>
        </div>
      </div>
    </Provider>
  );
};

// Placeholder components - TODO: Implement these
const UsersSection = () => <div>Users section - TODO: Implement</div>;
const PostsSection = () => <div>Posts section - TODO: Implement</div>;
const PostDetailSection = () => <div>Post detail section - TODO: Implement</div>;

export default RTKQueryEndpointsExercise;