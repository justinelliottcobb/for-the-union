// Apollo Client React Hooks Integration Exercise
// Master useQuery, useMutation, useSubscription hooks with proper TypeScript integration

import React, { useState, useEffect, Suspense } from 'react';
import {
  useQuery,
  useMutation,
  useSubscription,
  useLazyQuery,
  useApolloClient,
  gql,
  DocumentNode,
  TypedDocumentNode,
  QueryHookOptions,
  MutationHookOptions,
  SubscriptionHookOptions,
} from '@apollo/client';

// TODO 1: Define TypeScript interfaces for your data
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
  posts: Post[];
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: User;
  likes: number;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  post: Post;
  createdAt: string;
}

// TODO 2: Define GraphQL Queries with TypeScript
// Create typed GraphQL queries for better IDE support and type safety

export const GET_USERS = gql`
  query GetUsers($limit: Int, $offset: Int, $search: String) {
    users(limit: $limit, offset: $offset, search: $search) {
      id
      username
      email
      firstName
      lastName
      avatar
      isOnline
      lastSeen
    }
  }
`;

export const GET_USER_POSTS = gql`
  query GetUserPosts($userId: ID!, $limit: Int, $offset: Int) {
    user(id: $userId) {
      id
      username
      posts(limit: $limit, offset: $offset) {
        id
        title
        content
        likes
        createdAt
        updatedAt
        comments {
          id
          content
          author {
            id
            username
            avatar
          }
          createdAt
        }
      }
    }
  }
`;

export const GET_POST_DETAILS = gql`
  query GetPostDetails($postId: ID!) {
    post(id: $postId) {
      id
      title
      content
      likes
      author {
        id
        username
        firstName
        lastName
        avatar
      }
      comments {
        id
        content
        author {
          id
          username
          avatar
        }
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

// TODO: Define query variables types
export interface GetUsersQueryVariables {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface GetUserPostsQueryVariables {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface GetPostDetailsQueryVariables {
  postId: string;
}

// TODO: Define query result types
export interface GetUsersQuery {
  users: User[];
}

export interface GetUserPostsQuery {
  user: {
    id: string;
    username: string;
    posts: Post[];
  };
}

export interface GetPostDetailsQuery {
  post: Post;
}

// TODO 3: Create Custom useQuery Hook with Enhanced Features
export function useUsersQuery(variables?: GetUsersQueryVariables) {
  // TODO: Implement enhanced useQuery hook
  // Features to include:
  // - Loading states with meaningful messages
  // - Error handling with user-friendly messages
  // - Refetching capabilities
  // - Cache management
  // - Polling for real-time updates

  const { data, loading, error, refetch, fetchMore, networkStatus } = useQuery<
    GetUsersQuery,
    GetUsersQueryVariables
  >(GET_USERS, {
    variables,
    // TODO: Configure query options
    errorPolicy: 'all', // Show partial data even with errors
    fetchPolicy: 'cache-and-network', // Always check network for fresh data
    notifyOnNetworkStatusChange: true,
    
    // TODO: Add polling for real-time updates
    pollInterval: 30000, // Poll every 30 seconds
    
    // TODO: Configure error handling
    onError: (error) => {
      console.error('Users query error:', error);
      // TODO: Add error reporting/tracking
    },
    
    onCompleted: (data) => {
      console.log('Users query completed:', data.users.length, 'users loaded');
    }
  });

  // TODO: Implement pagination helper
  const loadMore = () => {
    const currentCount = data?.users.length || 0;
    return fetchMore({
      variables: {
        ...variables,
        offset: currentCount,
        limit: variables?.limit || 20
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        // TODO: Implement proper merge logic
        if (!fetchMoreResult) return prev;
        
        return {
          users: [...prev.users, ...fetchMoreResult.users]
        };
      }
    });
  };

  // TODO: Add search functionality
  const search = (searchTerm: string) => {
    return refetch({ ...variables, search: searchTerm, offset: 0 });
  };

  return {
    users: data?.users || [],
    loading,
    error,
    refetch,
    loadMore,
    search,
    networkStatus,
    // TODO: Add computed properties
    hasUsers: (data?.users.length || 0) > 0,
    isEmpty: !loading && (!data?.users || data.users.length === 0)
  };
}

// TODO 4: Create Mutation Hooks with Optimistic Updates
export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      content
      author {
        id
        username
        avatar
      }
      likes
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_POST = gql`
  mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      id
      title
      content
      updatedAt
    }
  }
`;

export const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      likes
    }
  }
`;

export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      success
      message
    }
  }
`;

// TODO: Define mutation input types
export interface CreatePostInput {
  title: string;
  content: string;
  authorId: string;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
}

export interface CreatePostMutation {
  createPost: Post;
}

export interface UpdatePostMutation {
  updatePost: Post;
}

export interface LikePostMutation {
  likePost: {
    id: string;
    likes: number;
  };
}

export interface DeletePostMutation {
  deletePost: {
    success: boolean;
    message: string;
  };
}

// TODO: Create custom mutation hooks with optimistic updates
export function useCreatePost() {
  const [createPost, { loading, error, data }] = useMutation<
    CreatePostMutation,
    { input: CreatePostInput }
  >(CREATE_POST, {
    // TODO: Implement optimistic response
    optimisticResponse: (variables) => {
      return {
        createPost: {
          __typename: 'Post',
          id: `temp-${Date.now()}`, // Temporary ID
          title: variables.input.title,
          content: variables.input.content,
          author: {
            __typename: 'User',
            id: variables.input.authorId,
            username: 'You', // We'll get real data from cache
            avatar: null
          },
          likes: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          comments: []
        }
      };
    },

    // TODO: Update cache after mutation
    update: (cache, { data: mutationData }) => {
      if (!mutationData?.createPost) return;

      // TODO: Add new post to user's posts list
      // Read existing posts from cache
      // Add new post to the list
      // Write back to cache
      
      try {
        // Example of cache update - you'll need to adapt based on your queries
        const existingData = cache.readQuery<GetUserPostsQuery>({
          query: GET_USER_POSTS,
          variables: { userId: mutationData.createPost.author.id }
        });

        if (existingData?.user) {
          cache.writeQuery<GetUserPostsQuery>({
            query: GET_USER_POSTS,
            variables: { userId: mutationData.createPost.author.id },
            data: {
              user: {
                ...existingData.user,
                posts: [mutationData.createPost, ...existingData.user.posts]
              }
            }
          });
        }
      } catch (error) {
        console.warn('Could not update cache after post creation:', error);
      }
    },

    onCompleted: (data) => {
      console.log('Post created successfully:', data.createPost.id);
      // TODO: Show success message to user
    },

    onError: (error) => {
      console.error('Error creating post:', error);
      // TODO: Show error message to user
    }
  });

  return {
    createPost,
    loading,
    error,
    data: data?.createPost
  };
}

// TODO: Implement like post mutation with optimistic updates
export function useLikePost() {
  const [likePost, { loading, error }] = useMutation<
    LikePostMutation,
    { postId: string }
  >(LIKE_POST, {
    // TODO: Implement optimistic response for immediate UI feedback
    optimisticResponse: (variables) => ({
      likePost: {
        __typename: 'Post' as const,
        id: variables.postId,
        likes: -1 // We don't know the exact count, will be updated from server
      }
    }),

    // TODO: Update cache to increment likes count
    update: (cache, { data: mutationData }) => {
      if (!mutationData?.likePost) return;

      // TODO: Update the post in cache with new likes count
      cache.modify({
        id: cache.identify({ __typename: 'Post', id: mutationData.likePost.id }),
        fields: {
          likes: (existingLikes = 0) => {
            // TODO: Implement proper likes increment logic
            // Handle optimistic vs real updates
            return mutationData.likePost.likes !== -1 
              ? mutationData.likePost.likes 
              : existingLikes + 1;
          }
        }
      });
    },

    onError: (error) => {
      console.error('Error liking post:', error);
      // TODO: Revert optimistic update
    }
  });

  return { likePost, loading, error };
}

// TODO 5: Create Subscription Hooks for Real-time Updates
export const POST_LIKED_SUBSCRIPTION = gql`
  subscription PostLiked($postId: ID!) {
    postLiked(postId: $postId) {
      id
      likes
      likedBy {
        id
        username
      }
    }
  }
`;

export const NEW_COMMENT_SUBSCRIPTION = gql`
  subscription NewComment($postId: ID!) {
    newComment(postId: $postId) {
      id
      content
      author {
        id
        username
        avatar
      }
      post {
        id
      }
      createdAt
    }
  }
`;

export const USER_STATUS_SUBSCRIPTION = gql`
  subscription UserStatus($userId: ID!) {
    userStatus(userId: $userId) {
      id
      isOnline
      lastSeen
    }
  }
`;

// TODO: Define subscription result types
export interface PostLikedSubscription {
  postLiked: {
    id: string;
    likes: number;
    likedBy: {
      id: string;
      username: string;
    };
  };
}

export interface NewCommentSubscription {
  newComment: Comment;
}

export interface UserStatusSubscription {
  userStatus: {
    id: string;
    isOnline: boolean;
    lastSeen?: string;
  };
}

// TODO: Create subscription hooks
export function usePostLikedSubscription(postId: string) {
  const { data, loading, error } = useSubscription<
    PostLikedSubscription,
    { postId: string }
  >(POST_LIKED_SUBSCRIPTION, {
    variables: { postId },
    
    // TODO: Handle subscription data
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data) {
        console.log('Post liked:', subscriptionData.data.postLiked);
        // TODO: Show notification to user
        // "Someone liked this post!"
      }
    },

    onSubscriptionComplete: () => {
      console.log('Post liked subscription completed');
    },

    shouldResubscribe: true // Resubscribe on network reconnection
  });

  return { data: data?.postLiked, loading, error };
}

export function useNewCommentSubscription(postId: string) {
  const { data, loading, error } = useSubscription<
    NewCommentSubscription,
    { postId: string }
  >(NEW_COMMENT_SUBSCRIPTION, {
    variables: { postId },
    
    onSubscriptionData: ({ subscriptionData, client }) => {
      if (subscriptionData.data?.newComment) {
        // TODO: Update cache with new comment
        const newComment = subscriptionData.data.newComment;
        
        try {
          // Add comment to post's comments list in cache
          client.cache.modify({
            id: client.cache.identify({ __typename: 'Post', id: postId }),
            fields: {
              comments: (existingComments = []) => [newComment, ...existingComments]
            }
          });
        } catch (error) {
          console.warn('Could not add new comment to cache:', error);
        }

        // TODO: Show notification
        console.log('New comment added:', newComment);
      }
    }
  });

  return { data: data?.newComment, loading, error };
}

// TODO 6: Create Lazy Query Hooks for On-Demand Loading
export function useSearchUsers() {
  const [searchUsers, { loading, data, error, called }] = useLazyQuery<
    GetUsersQuery,
    GetUsersQueryVariables
  >(GET_USERS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    
    onCompleted: (data) => {
      console.log('Search completed:', data.users.length, 'users found');
    }
  });

  const search = (searchTerm: string) => {
    if (searchTerm.trim()) {
      searchUsers({
        variables: {
          search: searchTerm,
          limit: 50
        }
      });
    }
  };

  return {
    search,
    loading,
    data: data?.users || [],
    error,
    called,
    hasResults: called && !loading && (data?.users.length || 0) > 0,
    noResults: called && !loading && (!data?.users || data.users.length === 0)
  };
}

// TODO 7: Create Higher-Order Components for Common Patterns
export interface WithLoadingProps {
  loading?: boolean;
  error?: Error;
  children: React.ReactNode;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: Error; retry?: () => void }>;
}

export const WithLoading: React.FC<WithLoadingProps> = ({
  loading,
  error,
  children,
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent
}) => {
  if (loading) {
    return LoadingComponent ? <LoadingComponent /> : (
      <div className="loading-spinner">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return ErrorComponent ? <ErrorComponent error={error} /> : (
      <div className="error-message">
        <h3>Something went wrong</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return <>{children}</>;
};

// TODO 8: Create Example Components Using the Hooks
export const UsersList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { users, loading, error, loadMore, search, hasUsers, isEmpty } = useUsersQuery({
    limit: 20
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(searchTerm);
  };

  return (
    <WithLoading loading={loading} error={error}>
      <div className="users-list">
        <h2>Users</h2>
        
        {/* TODO: Search form */}
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
          />
          <button type="submit">Search</button>
        </form>

        {/* TODO: Users list */}
        {hasUsers ? (
          <div className="users-grid">
            {users.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        ) : isEmpty ? (
          <p>No users found</p>
        ) : null}

        {/* TODO: Load more button */}
        {hasUsers && (
          <button onClick={loadMore}>
            Load More Users
          </button>
        )}
      </div>
    </WithLoading>
  );
};

export const UserCard: React.FC<{ user: User }> = ({ user }) => {
  // TODO: Use user status subscription for real-time online status
  const { data: statusData } = useSubscription<UserStatusSubscription>(
    USER_STATUS_SUBSCRIPTION,
    {
      variables: { userId: user.id }
    }
  );

  const isOnline = statusData?.userStatus.isOnline ?? user.isOnline;

  return (
    <div className={`user-card ${isOnline ? 'online' : 'offline'}`}>
      <img src={user.avatar || '/default-avatar.png'} alt={user.username} />
      <h3>{user.firstName} {user.lastName}</h3>
      <p>@{user.username}</p>
      <div className={`status ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? '🟢 Online' : '⚫ Offline'}
      </div>
    </div>
  );
};

export const CreatePostForm: React.FC<{ authorId: string; onSuccess?: () => void }> = ({
  authorId,
  onSuccess
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { createPost, loading, error } = useCreatePost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      return;
    }

    try {
      await createPost({
        variables: {
          input: {
            title: title.trim(),
            content: content.trim(),
            authorId
          }
        }
      });

      // Clear form on success
      setTitle('');
      setContent('');
      onSuccess?.();
    } catch (err) {
      // Error is handled in the hook
      console.error('Create post error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-post-form">
      <h3>Create New Post</h3>
      
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title..."
        disabled={loading}
      />
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        disabled={loading}
      />
      
      {error && (
        <div className="error">
          Error: {error.message}
        </div>
      )}
      
      <button type="submit" disabled={loading || !title.trim() || !content.trim()}>
        {loading ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
};

export const PostDetails: React.FC<{ postId: string }> = ({ postId }) => {
  const { data: post, loading, error } = useQuery<GetPostDetailsQuery>(
    GET_POST_DETAILS,
    { variables: { postId } }
  );

  const { likePost, loading: likingPost } = useLikePost();
  
  // TODO: Subscribe to real-time updates
  usePostLikedSubscription(postId);
  useNewCommentSubscription(postId);

  const handleLike = () => {
    likePost({ variables: { postId } });
  };

  return (
    <WithLoading loading={loading} error={error}>
      {post?.post && (
        <article className="post-details">
          <header>
            <img 
              src={post.post.author.avatar || '/default-avatar.png'} 
              alt={post.post.author.username}
            />
            <div>
              <h3>{post.post.author.firstName} {post.post.author.lastName}</h3>
              <p>@{post.post.author.username}</p>
            </div>
          </header>

          <h1>{post.post.title}</h1>
          <div className="content">{post.post.content}</div>

          <footer>
            <button 
              onClick={handleLike} 
              disabled={likingPost}
              className="like-button"
            >
              👍 {post.post.likes} {likingPost && '...'}
            </button>
            
            <span className="date">
              {new Date(post.post.createdAt).toLocaleDateString()}
            </span>
          </footer>

          <section className="comments">
            <h4>Comments ({post.post.comments.length})</h4>
            {post.post.comments.map(comment => (
              <div key={comment.id} className="comment">
                <img 
                  src={comment.author.avatar || '/default-avatar.png'} 
                  alt={comment.author.username}
                />
                <div>
                  <strong>@{comment.author.username}</strong>
                  <p>{comment.content}</p>
                  <small>{new Date(comment.createdAt).toLocaleDateString()}</small>
                </div>
              </div>
            ))}
          </section>
        </article>
      )}
    </WithLoading>
  );
};

// TODO 9: Create React Suspense Integration
export const SuspenseQueryExample: React.FC<{ userId: string }> = ({ userId }) => {
  // TODO: This would work with React 18+ and Apollo Client's Suspense integration
  const { data } = useQuery<GetUserPostsQuery>(GET_USER_POSTS, {
    variables: { userId },
    suspense: true // Enable Suspense integration
  });

  // No loading state needed - handled by Suspense boundary
  return (
    <div>
      <h2>@{data.user.username}'s Posts</h2>
      {data.user.posts.map(post => (
        <article key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  );
};

export const SuspenseExample: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading posts...</div>}>
      <SuspenseQueryExample userId="user-1" />
    </Suspense>
  );
};

// TODO 10: Export everything for use in other components
export {
  GET_USERS,
  GET_USER_POSTS,
  GET_POST_DETAILS,
  CREATE_POST,
  UPDATE_POST,
  LIKE_POST,
  DELETE_POST,
  POST_LIKED_SUBSCRIPTION,
  NEW_COMMENT_SUBSCRIPTION,
  USER_STATUS_SUBSCRIPTION
};