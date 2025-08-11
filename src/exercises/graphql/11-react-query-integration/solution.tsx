// React Query + GraphQL Integration - Solution
// Complete implementation of manual GraphQL integration with TanStack Query

import React, { useState, useCallback } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
  QueryKey,
} from '@tanstack/react-query';

// GraphQL Client and Request Function Implementation
interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
    extensions?: Record<string, any>;
  }>;
}

interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export async function graphqlRequest<T = any>(
  endpoint: string,
  request: GraphQLRequest,
  headers?: Record<string, string>
): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result: GraphQLResponse<T> = await response.json();
    
    if (result.errors && result.errors.length > 0) {
      const error = new Error(result.errors[0].message);
      (error as any).graphQLErrors = result.errors;
      (error as any).isGraphQLError = true;
      
      // Add additional context for specific error types
      const firstError = result.errors[0];
      if (firstError.extensions?.code) {
        (error as any).code = firstError.extensions.code;
      }
      
      throw error;
    }
    
    if (!result.data) {
      throw new Error('No data returned from GraphQL query');
    }
    
    return result.data;
  } catch (error) {
    // Enhance network errors
    if (error instanceof Error && !((error as any).isGraphQLError)) {
      if (error.message.includes('fetch')) {
        throw new Error(`Network error: Unable to connect to GraphQL endpoint`);
      }
    }
    throw error;
  }
}

// Query Key Factory Implementation
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.posts.lists(), filters] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
    byUser: (userId: string) => [...queryKeys.posts.all, 'byUser', userId] as const,
  },
  comments: {
    all: ['comments'] as const,
    lists: () => [...queryKeys.comments.all, 'list'] as const,
    byPost: (postId: string) => [...queryKeys.comments.lists(), 'byPost', postId] as const,
  },
} as const;

// TypeScript Interfaces Implementation
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  postsCount: number;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  publishedAt: string;
  author: User;
  likesCount: number;
  commentsCount: number;
  tags: string[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: User;
  post: Pick<Post, 'id' | 'title'>;
}

export interface CreateUserInput {
  username: string;
  email: string;
  fullName: string;
  bio?: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  tags?: string[];
}

export interface CreateCommentInput {
  content: string;
  postId: string;
}

// GraphQL Queries and Mutations
const GET_USERS_QUERY = `
  query GetUsers($limit: Int, $offset: Int, $search: String) {
    users(limit: $limit, offset: $offset, search: $search) {
      id
      username
      email
      fullName
      avatar
      bio
      createdAt
      postsCount
    }
  }
`;

const GET_USER_QUERY = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      username
      email
      fullName
      avatar
      bio
      createdAt
      postsCount
    }
  }
`;

const GET_POSTS_QUERY = `
  query GetPosts($limit: Int, $offset: Int, $authorId: ID, $tag: String) {
    posts(limit: $limit, offset: $offset, authorId: $authorId, tag: $tag) {
      id
      title
      content
      excerpt
      publishedAt
      author {
        id
        username
        fullName
        avatar
      }
      likesCount
      commentsCount
      tags
    }
  }
`;

const CREATE_USER_MUTATION = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      username
      email
      fullName
      avatar
      bio
      createdAt
      postsCount
    }
  }
`;

const CREATE_POST_MUTATION = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      content
      excerpt
      publishedAt
      author {
        id
        username
        fullName
        avatar
      }
      likesCount
      commentsCount
      tags
    }
  }
`;

const CREATE_COMMENT_MUTATION = `
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
      content
      createdAt
      author {
        id
        username
        fullName
      }
      post {
        id
        title
        commentsCount
      }
    }
  }
`;

// Custom Hooks Implementation
interface UseUsersOptions {
  limit?: number;
  offset?: number;
  search?: string;
  enabled?: boolean;
}

export function useUsers(options: UseUsersOptions = {}): UseQueryResult<{ users: User[] }> {
  const { limit = 10, offset = 0, search, enabled = true } = options;
  
  return useQuery({
    queryKey: queryKeys.users.list({ limit, offset, search: search || undefined }),
    queryFn: async () => {
      // Mock data for demo since we don't have a real GraphQL endpoint
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockUsers: User[] = [
        {
          id: '1',
          username: 'alice_johnson',
          email: 'alice@example.com',
          fullName: 'Alice Johnson',
          avatar: '👩‍💼',
          bio: 'Product manager passionate about user experience',
          createdAt: '2024-01-15T10:00:00Z',
          postsCount: 12,
        },
        {
          id: '2',
          username: 'bob_developer',
          email: 'bob@example.com',
          fullName: 'Bob Smith',
          avatar: '👨‍💻',
          bio: 'Full-stack developer and tech enthusiast',
          createdAt: '2024-02-20T14:30:00Z',
          postsCount: 8,
        },
        {
          id: '3',
          username: 'carol_designer',
          email: 'carol@example.com',
          fullName: 'Carol Williams',
          avatar: '👩‍🎨',
          bio: 'UI/UX designer with a love for minimalism',
          createdAt: '2024-03-10T09:15:00Z',
          postsCount: 5,
        },
      ];
      
      let filteredUsers = mockUsers;
      
      if (search) {
        filteredUsers = mockUsers.filter(user => 
          user.fullName.toLowerCase().includes(search.toLowerCase()) ||
          user.username.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      const paginatedUsers = filteredUsers.slice(offset, offset + limit);
      
      return { users: paginatedUsers };
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUser(id: string, enabled: boolean = true): UseQueryResult<{ user: User }> {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockUser: User = {
        id,
        username: `user_${id}`,
        email: `user${id}@example.com`,
        fullName: `User ${id}`,
        avatar: '👤',
        bio: `Bio for user ${id}`,
        createdAt: '2024-01-01T00:00:00Z',
        postsCount: Math.floor(Math.random() * 20),
      };
      
      return { user: mockUser };
    },
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

interface UsePostsOptions {
  limit?: number;
  offset?: number;
  authorId?: string;
  tag?: string;
  enabled?: boolean;
}

export function usePosts(options: UsePostsOptions = {}): UseQueryResult<{ posts: Post[] }> {
  const { limit = 20, offset = 0, authorId, tag, enabled = true } = options;
  
  const queryKey = authorId 
    ? queryKeys.posts.byUser(authorId)
    : queryKeys.posts.list({ limit, offset, tag });
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const mockPosts: Post[] = [
        {
          id: '1',
          title: 'Getting Started with React Query',
          content: 'React Query is a powerful data fetching library...',
          excerpt: 'Learn how to integrate React Query into your React applications...',
          publishedAt: '2024-05-15T10:00:00Z',
          author: {
            id: '1',
            username: 'alice_johnson',
            email: 'alice@example.com',
            fullName: 'Alice Johnson',
            avatar: '👩‍💼',
            bio: 'Product manager passionate about user experience',
            createdAt: '2024-01-15T10:00:00Z',
            postsCount: 12,
          },
          likesCount: 24,
          commentsCount: 8,
          tags: ['react', 'javascript', 'tutorial'],
        },
        {
          id: '2',
          title: 'GraphQL Best Practices',
          content: 'When building GraphQL APIs, there are several best practices...',
          excerpt: 'Explore the essential practices for building robust GraphQL APIs...',
          publishedAt: '2024-05-10T14:30:00Z',
          author: {
            id: '2',
            username: 'bob_developer',
            email: 'bob@example.com',
            fullName: 'Bob Smith',
            avatar: '👨‍💻',
            bio: 'Full-stack developer and tech enthusiast',
            createdAt: '2024-02-20T14:30:00Z',
            postsCount: 8,
          },
          likesCount: 18,
          commentsCount: 12,
          tags: ['graphql', 'api', 'backend'],
        },
      ];
      
      let filteredPosts = mockPosts;
      
      if (authorId) {
        filteredPosts = mockPosts.filter(post => post.author.id === authorId);
      }
      
      if (tag) {
        filteredPosts = filteredPosts.filter(post => post.tags.includes(tag));
      }
      
      const paginatedPosts = filteredPosts.slice(offset, offset + limit);
      
      return { posts: paginatedPosts };
    },
    enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Mutation Hooks Implementation
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateUserInput): Promise<{ createUser: User }> => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: `user_${Date.now()}`,
        ...input,
        avatar: '👤',
        createdAt: new Date().toISOString(),
        postsCount: 0,
      };
      
      return { createUser: newUser };
    },
    onSuccess: (data) => {
      // Invalidate users list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      
      // Set user detail cache
      queryClient.setQueryData(
        queryKeys.users.detail(data.createUser.id),
        { user: data.createUser }
      );
      
      console.log('✅ User created and cache updated:', data.createUser.username);
    },
    onError: (error) => {
      console.error('❌ Failed to create user:', error);
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreatePostInput): Promise<{ createPost: Post }> => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Mock current user
      const currentUser: User = {
        id: '1',
        username: 'alice_johnson',
        email: 'alice@example.com',
        fullName: 'Alice Johnson',
        avatar: '👩‍💼',
        bio: 'Product manager passionate about user experience',
        createdAt: '2024-01-15T10:00:00Z',
        postsCount: 12,
      };
      
      const newPost: Post = {
        id: `post_${Date.now()}`,
        ...input,
        excerpt: input.content.substring(0, 100) + '...',
        publishedAt: new Date().toISOString(),
        author: currentUser,
        likesCount: 0,
        commentsCount: 0,
        tags: input.tags || [],
      };
      
      return { createPost: newPost };
    },
    onSuccess: (data) => {
      // Invalidate posts list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      
      // Invalidate user-specific posts
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.posts.byUser(data.createPost.author.id) 
      });
      
      // Update user posts count if user is cached
      const userId = data.createPost.author.id;
      const userQueryKey = queryKeys.users.detail(userId);
      
      queryClient.setQueryData(userQueryKey, (old: { user: User } | undefined) => {
        if (old) {
          return {
            user: {
              ...old.user,
              postsCount: old.user.postsCount + 1,
            },
          };
        }
        return old;
      });
      
      console.log('✅ Post created and cache updated:', data.createPost.title);
    },
    onError: (error) => {
      console.error('❌ Failed to create post:', error);
    },
  });
}

// Error Handling Component Implementation
interface GraphQLErrorDisplayProps {
  error: Error | null;
  title?: string;
  showDetails?: boolean;
  onRetry?: () => void;
}

export const GraphQLErrorDisplay: React.FC<GraphQLErrorDisplayProps> = ({
  error,
  title = "Something went wrong",
  showDetails = false,
  onRetry,
}) => {
  if (!error) return null;
  
  const isNetworkError = error.message.includes('Network') || error.message.includes('HTTP');
  const isGraphQLError = (error as any).isGraphQLError;
  const graphQLErrors = (error as any).graphQLErrors;
  
  const getErrorIcon = () => {
    if (isNetworkError) return '🌐';
    if (isGraphQLError) return '📝';
    return '⚠️';
  };
  
  const getErrorColor = () => {
    if (isNetworkError) return '#f39c12';
    if (isGraphQLError) return '#e74c3c';
    return '#9b59b6';
  };
  
  return (
    <div style={{
      border: `2px solid ${getErrorColor()}`,
      borderRadius: '8px',
      padding: '16px',
      margin: '16px 0',
      backgroundColor: `${getErrorColor()}15`,
    }}>
      <div style={{ 
        fontWeight: 'bold', 
        color: getErrorColor(),
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        {getErrorIcon()} {title}
      </div>
      
      <div style={{ marginBottom: '12px', color: '#333' }}>
        {error.message}
      </div>
      
      {showDetails && graphQLErrors && (
        <details style={{ marginBottom: '12px' }}>
          <summary style={{ cursor: 'pointer', color: '#666', fontSize: '14px' }}>
            Show GraphQL Error Details
          </summary>
          <div style={{ marginTop: '8px', fontSize: '13px' }}>
            {graphQLErrors.map((err: any, i: number) => (
              <div key={i} style={{ 
                backgroundColor: 'white',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                marginBottom: '4px',
              }}>
                <strong>Error {i + 1}:</strong> {err.message}
                {err.path && (
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    Path: {err.path.join(' → ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
      
      {onRetry && (
        <button 
          onClick={onRetry}
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          🔄 Retry
        </button>
      )}
      
      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        💡 {isNetworkError ? 'Check your network connection' : 'This may be a temporary issue'}
      </div>
    </div>
  );
};

// React Components Implementation
export const UsersList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(10);
  
  const { data, isLoading, error, refetch, isFetching } = useUsers({ 
    search: search || undefined,
    limit,
  });
  
  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h3>Users List</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              padding: '8px', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              minWidth: '200px',
            }}
          />
          
          <select 
            value={limit} 
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{ 
              padding: '8px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
            }}
          >
            <option value={5}>5 users</option>
            <option value={10}>10 users</option>
            <option value={20}>20 users</option>
          </select>
          
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              padding: '8px 12px',
              backgroundColor: isFetching ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isFetching ? 'not-allowed' : 'pointer',
            }}
          >
            {isFetching ? '🔄' : '↻'} Refresh
          </button>
        </div>
      </div>
      
      {isLoading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#666',
        }}>
          🔄 Loading users...
        </div>
      )}
      
      <GraphQLErrorDisplay 
        error={error} 
        title="Failed to load users"
        showDetails={true}
        onRetry={() => refetch()}
      />
      
      {data?.users && data.users.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#666',
          border: '1px dashed #ddd',
          borderRadius: '8px',
        }}>
          No users found {search && `for "${search}"`}
        </div>
      )}
      
      {data?.users && data.users.length > 0 && (
        <div style={{ display: 'grid', gap: '8px' }}>
          {data.users.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
};

const UserCard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontSize: '32px' }}>{user.avatar || '👤'}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{user.fullName}</div>
        <div style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>
          @{user.username} • {user.email}
        </div>
        {user.bio && (
          <div style={{ fontSize: '13px', color: '#777', marginBottom: '4px' }}>
            {user.bio}
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#888' }}>
          📝 {user.postsCount} posts • 📅 Member since {new Date(user.createdAt).getFullYear()}
        </div>
      </div>
    </div>
  );
};

export const PostsList: React.FC<{ authorId?: string; tag?: string }> = ({ 
  authorId, 
  tag 
}) => {
  const { data, isLoading, error, refetch, isFetching } = usePosts({ 
    authorId, 
    tag,
    limit: 15,
  });
  
  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h3>
          Posts
          {authorId && ' by User'}
          {tag && ` tagged "${tag}"`}
        </h3>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{
            padding: '8px 12px',
            backgroundColor: isFetching ? '#95a5a6' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isFetching ? 'not-allowed' : 'pointer',
          }}
        >
          {isFetching ? '🔄 Refreshing...' : '↻ Refresh Posts'}
        </button>
      </div>
      
      {isLoading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#666',
        }}>
          📚 Loading posts...
        </div>
      )}
      
      <GraphQLErrorDisplay 
        error={error} 
        title="Failed to load posts"
        showDetails={true}
        onRetry={() => refetch()}
      />
      
      {data?.posts && data.posts.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#666',
          border: '1px dashed #ddd',
          borderRadius: '8px',
        }}>
          No posts found
        </div>
      )}
      
      {data?.posts && data.posts.length > 0 && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {data.posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <div style={{ marginBottom: '8px' }}>
        <h4 style={{ margin: '0 0 4px 0', color: '#333' }}>{post.title}</h4>
        <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{post.author.avatar}</span>
          <span>by {post.author.fullName}</span>
          <span>•</span>
          <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div style={{ marginBottom: '12px', color: '#555', lineHeight: '1.4' }}>
        {post.excerpt}
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: '8px',
        borderTop: '1px solid #f0f0f0',
      }}>
        <div style={{ fontSize: '12px', color: '#666', display: 'flex', gap: '12px' }}>
          <span>❤️ {post.likesCount}</span>
          <span>💬 {post.commentsCount}</span>
        </div>
        
        <div style={{ fontSize: '11px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {post.tags.slice(0, 3).map(tag => (
            <span 
              key={tag}
              style={{
                backgroundColor: '#e9ecef',
                padding: '2px 6px',
                borderRadius: '12px',
                color: '#495057',
              }}
            >
              #{tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span style={{ color: '#666', fontSize: '10px' }}>
              +{post.tags.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const CreateUserForm: React.FC = () => {
  const [formData, setFormData] = useState<CreateUserInput>({
    username: '',
    email: '',
    fullName: '',
    bio: '',
  });
  
  const createUserMutation = useCreateUser();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.email.trim() || !formData.fullName.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    
    createUserMutation.mutate(formData, {
      onSuccess: () => {
        setFormData({ username: '', email: '', fullName: '', bio: '' });
        alert('✅ User created successfully!');
      },
    });
  };
  
  const handleChange = (field: keyof CreateUserInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };
  
  return (
    <div style={{ 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      padding: '20px',
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <h3 style={{ marginTop: '0' }}>👤 Create New User</h3>
      
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            Username *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={handleChange('username')}
            placeholder="e.g. john_doe"
            style={{ 
              width: '100%',
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              fontSize: '14px',
            }}
            required
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="john@example.com"
            style={{ 
              width: '100%',
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              fontSize: '14px',
            }}
            required
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            Full Name *
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={handleChange('fullName')}
            placeholder="John Doe"
            style={{ 
              width: '100%',
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              fontSize: '14px',
            }}
            required
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            Bio (optional)
          </label>
          <textarea
            value={formData.bio}
            onChange={handleChange('bio')}
            placeholder="Tell us about yourself..."
            rows={3}
            style={{ 
              width: '100%',
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={createUserMutation.isPending}
          style={{
            padding: '14px',
            backgroundColor: createUserMutation.isPending ? '#95a5a6' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: createUserMutation.isPending ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'background-color 0.2s',
          }}
        >
          {createUserMutation.isPending ? '⏳ Creating User...' : '✅ Create User'}
        </button>
      </form>
      
      <GraphQLErrorDisplay 
        error={createUserMutation.error} 
        title="Failed to create user"
        showDetails={true}
      />
    </div>
  );
};

// Main Exercise Component Implementation
export const ReactQueryGraphQLExercise: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'create'>('users');
  
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount, error) => {
          // Don't retry client errors (4xx)
          if (error.message.includes('400') || 
              error.message.includes('401') ||
              error.message.includes('403') ||
              error.message.includes('404')) {
            return false;
          }
          // Retry server errors up to 3 times
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false, // Don't retry mutations to avoid side effects
      },
    },
  });
  
  const tabs = [
    { key: 'users' as const, label: '👥 Users', description: 'Browse and search users' },
    { key: 'posts' as const, label: '📚 Posts', description: 'View posts and articles' },
    { key: 'create' as const, label: '➕ Create User', description: 'Add a new user' },
  ];
  
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2>🚀 React Query + GraphQL Integration</h2>
          <p style={{ color: '#666', marginBottom: '16px', lineHeight: '1.5' }}>
            Demonstrating manual GraphQL integration with TanStack Query for flexible caching, 
            background synchronization, and state management. This approach provides maximum 
            control over caching behavior while leveraging React Query's powerful features.
          </p>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <nav style={{ 
            display: 'flex', 
            gap: '4px', 
            borderBottom: '2px solid #f0f0f0',
            marginBottom: '20px',
          }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: activeTab === tab.key ? '#3498db' : 'transparent',
                  color: activeTab === tab.key ? 'white' : '#333',
                  cursor: 'pointer',
                  borderRadius: '6px 6px 0 0',
                  fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.backgroundColor = '#ecf0f1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                title={tab.description}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div style={{ minHeight: '500px' }}>
          {activeTab === 'users' && <UsersList />}
          {activeTab === 'posts' && <PostsList />}
          {activeTab === 'create' && <CreateUserForm />}
        </div>
        
        <div style={{ 
          marginTop: '32px', 
          padding: '20px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
        }}>
          <h4 style={{ marginTop: '0', color: '#333' }}>🔧 React Query + GraphQL Features:</h4>
          <div style={{ 
            display: 'grid', 
            gap: '10px', 
            marginTop: '16px',
            fontSize: '14px',
            lineHeight: '1.4',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span>📊</span>
              <div>
                <strong>Structured Query Keys:</strong> Hierarchical cache keys enable precise 
                invalidation and efficient cache management
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span>🔄</span>
              <div>
                <strong>Stale-While-Revalidate:</strong> Instant cache serving with background 
                refetching for optimal UX
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span>⚡</span>
              <div>
                <strong>Smart Invalidation:</strong> Related data updates automatically when 
                mutations succeed
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span>🛡️</span>
              <div>
                <strong>Error Categorization:</strong> Network vs GraphQL error handling with 
                appropriate retry strategies
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span>🎯</span>
              <div>
                <strong>TypeScript Integration:</strong> Full type safety for queries, mutations, 
                and cache operations
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span>⏱️</span>
              <div>
                <strong>Configurable Caching:</strong> Fine-tuned stale time and garbage collection 
                for optimal performance
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#27ae60' }}>
              💡 Try These Features:
            </div>
            <ul style={{ 
              margin: '0', 
              paddingLeft: '20px',
              fontSize: '13px',
              color: '#555',
            }}>
              <li>Search users to see query key changes</li>
              <li>Create a user and watch cache invalidation</li>
              <li>Switch tabs to see cached data persist</li>
              <li>Refresh pages to see background refetching</li>
              <li>Check browser DevTools for React Query cache</li>
            </ul>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default ReactQueryGraphQLExercise;