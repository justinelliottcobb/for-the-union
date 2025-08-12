// React Query + GraphQL Integration Exercise
// Integrate GraphQL with React Query for flexible caching and synchronization

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

// TODO 1: Define GraphQL Client and Request Function
// Create a GraphQL request function that works with React Query

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

// TODO: Implement GraphQL request function
export async function graphqlRequest<T = any>(
  endpoint: string,
  request: GraphQLRequest,
  headers?: Record<string, string>
): Promise<T> {
  // TODO: Implement fetch-based GraphQL request
  // - Handle POST request with proper headers
  // - Parse response and handle errors
  // - Return data or throw on GraphQL errors
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  
  const result: GraphQLResponse<T> = await response.json();
  
  // TODO: Handle GraphQL errors
  if (result.errors && result.errors.length > 0) {
    // TODO: Create comprehensive error handling
    throw new Error(result.errors[0].message);
  }
  
  if (!result.data) {
    throw new Error('No data returned from GraphQL');
  }
  
  return result.data;
}

// TODO 2: Define Query Key Factory
// Create structured query keys for GraphQL operations

export const queryKeys = {
  // TODO: Create query key factories for different entity types
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
  // TODO: Add more query key factories
} as const;

// TODO 3: Define TypeScript Interfaces
// Create comprehensive type definitions for GraphQL schema

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

// TODO 4: GraphQL Queries and Mutations
// Define GraphQL operations as constants

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

// TODO 5: Custom Hooks for GraphQL Operations
// Create reusable hooks that integrate GraphQL with React Query

interface UseUsersOptions {
  limit?: number;
  offset?: number;
  search?: string;
  enabled?: boolean;
}

// TODO: Implement useUsers hook
export function useUsers(options: UseUsersOptions = {}): UseQueryResult<{ users: User[] }> {
  const { limit = 10, offset = 0, search, enabled = true } = options;
  
  return useQuery({
    queryKey: queryKeys.users.list({ limit, offset, search }),
    queryFn: () => graphqlRequest<{ users: User[] }>('https://api.example.com/graphql', {
      query: GET_USERS_QUERY,
      variables: { limit, offset, search },
    }),
    enabled,
    // TODO: Configure stale time, cache time, and other options
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// TODO: Implement useUser hook
export function useUser(id: string, enabled: boolean = true): UseQueryResult<{ user: User }> {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => graphqlRequest<{ user: User }>('https://api.example.com/graphql', {
      query: GET_USER_QUERY,
      variables: { id },
    }),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// TODO: Implement usePosts hook
export function usePosts(options: {
  limit?: number;
  offset?: number;
  authorId?: string;
  tag?: string;
  enabled?: boolean;
} = {}): UseQueryResult<{ posts: Post[] }> {
  const { limit = 20, offset = 0, authorId, tag, enabled = true } = options;
  
  // TODO: Create appropriate query key based on filters
  const queryKey = authorId 
    ? queryKeys.posts.byUser(authorId)
    : queryKeys.posts.list({ limit, offset, tag });
  
  return useQuery({
    queryKey,
    queryFn: () => graphqlRequest<{ posts: Post[] }>('https://api.example.com/graphql', {
      query: GET_POSTS_QUERY,
      variables: { limit, offset, authorId, tag },
    }),
    enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// TODO 6: Mutation Hooks
// Create hooks for GraphQL mutations with React Query integration

// TODO: Implement useCreateUser mutation
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateUserInput) => 
      graphqlRequest<{ createUser: User }>('https://api.example.com/graphql', {
        query: CREATE_USER_MUTATION,
        variables: { input },
      }),
    // TODO: Implement optimistic updates and cache invalidation
    onSuccess: (data) => {
      // TODO: Invalidate users list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      
      // TODO: Set user detail cache
      queryClient.setQueryData(
        queryKeys.users.detail(data.createUser.id),
        { user: data.createUser }
      );
    },
  });
}

// TODO: Implement useCreatePost mutation
export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreatePostInput) => 
      graphqlRequest<{ createPost: Post }>('https://api.example.com/graphql', {
        query: CREATE_POST_MUTATION,
        variables: { input },
      }),
    onSuccess: (data) => {
      // TODO: Invalidate posts list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      
      // TODO: Invalidate user-specific posts
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.posts.byUser(data.createPost.author.id) 
      });
      
      // TODO: Update user posts count if user is cached
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
    },
  });
}

// TODO 7: Error Handling Component
// Create a reusable error display component

interface GraphQLErrorDisplayProps {
  error: Error | null;
  title?: string;
  showDetails?: boolean;
  onRetry?: () => void;
}

// TODO: Implement error display component
export const GraphQLErrorDisplay: React.FC<GraphQLErrorDisplayProps> = ({
  error,
  title = "Something went wrong",
  showDetails = false,
  onRetry,
}) => {
  if (!error) return null;
  
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
  const isGraphQLError = error.message.includes('GraphQL');
  
  return (
    <div style={{
      border: '2px solid #e74c3c',
      borderRadius: '8px',
      padding: '16px',
      margin: '16px 0',
      backgroundColor: '#ffe6e6',
    }}>
      <div style={{ fontWeight: 'bold', color: '#c0392b', marginBottom: '8px' }}>
        {isNetworkError ? '🌐' : isGraphQLError ? '📝' : '⚠️'} {title}
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        {error.message}
      </div>
      
      {showDetails && (
        <details style={{ marginBottom: '12px' }}>
          <summary style={{ cursor: 'pointer', color: '#666' }}>
            Show Details
          </summary>
          <pre style={{ 
            fontSize: '12px', 
            backgroundColor: '#f8f8f8', 
            padding: '8px',
            borderRadius: '4px',
            overflow: 'auto',
          }}>
            {error.stack}
          </pre>
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
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
};

// TODO 8: React Components
// Create components that demonstrate React Query + GraphQL integration

// TODO: Implement UsersList component
export const UsersList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(10);
  
  const { data, isLoading, error, refetch } = useUsers({ 
    search: search || undefined,
    limit,
  });
  
  return (
    <div>
      <h3>Users List</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ 
            padding: '8px', 
            marginRight: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
        
        <select 
          value={limit} 
          onChange={(e) => setLimit(Number(e.target.value))}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value={5}>5 users</option>
          <option value={10}>10 users</option>
          <option value={20}>20 users</option>
        </select>
      </div>
      
      {isLoading && <div>Loading users...</div>}
      
      <GraphQLErrorDisplay 
        error={error} 
        title="Failed to load users"
        showDetails={true}
        onRetry={() => refetch()}
      />
      
      {data?.users && (
        <div style={{ display: 'grid', gap: '8px' }}>
          {data.users.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
};

// TODO: Implement UserCard component
const UserCard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div style={{ fontSize: '32px' }}>{user.avatar || '👤'}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold' }}>{user.fullName}</div>
        <div style={{ color: '#666' }}>@{user.username}</div>
        <div style={{ fontSize: '14px', color: '#888' }}>
          {user.postsCount} posts • Member since {new Date(user.createdAt).getFullYear()}
        </div>
      </div>
    </div>
  );
};

// TODO: Implement PostsList component
export const PostsList: React.FC<{ authorId?: string; tag?: string }> = ({ 
  authorId, 
  tag 
}) => {
  const { data, isLoading, error, refetch } = usePosts({ 
    authorId, 
    tag,
    limit: 15,
  });
  
  return (
    <div>
      <h3>
        Posts
        {authorId && ' by User'}
        {tag && ` tagged "${tag}"`}
      </h3>
      
      {isLoading && <div>Loading posts...</div>}
      
      <GraphQLErrorDisplay 
        error={error} 
        title="Failed to load posts"
        onRetry={() => refetch()}
      />
      
      {data?.posts && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {data.posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

// TODO: Implement PostCard component
const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
    }}>
      <div style={{ marginBottom: '8px' }}>
        <h4 style={{ margin: '0 0 4px 0' }}>{post.title}</h4>
        <div style={{ fontSize: '12px', color: '#666' }}>
          by {post.author.fullName} • {new Date(post.publishedAt).toLocaleDateString()}
        </div>
      </div>
      
      <div style={{ marginBottom: '12px', color: '#333' }}>
        {post.excerpt}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          ❤️ {post.likesCount} • 💬 {post.commentsCount}
        </div>
        
        <div style={{ fontSize: '12px' }}>
          {post.tags.map(tag => (
            <span 
              key={tag}
              style={{
                backgroundColor: '#e9ecef',
                padding: '2px 6px',
                borderRadius: '12px',
                marginLeft: '4px',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// TODO: Implement CreateUserForm component
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
    
    // TODO: Basic validation
    if (!formData.username || !formData.email || !formData.fullName) {
      alert('Please fill in all required fields');
      return;
    }
    
    createUserMutation.mutate(formData, {
      onSuccess: () => {
        // TODO: Reset form and show success message
        setFormData({ username: '', email: '', fullName: '', bio: '' });
        alert('User created successfully!');
      },
    });
  };
  
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}>
      <h3>Create New User</h3>
      
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
        <input
          type="text"
          placeholder="Username *"
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          required
        />
        
        <input
          type="email"
          placeholder="Email *"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          required
        />
        
        <input
          type="text"
          placeholder="Full Name *"
          value={formData.fullName}
          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          required
        />
        
        <textarea
          placeholder="Bio (optional)"
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          style={{ 
            padding: '8px', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            minHeight: '60px',
            resize: 'vertical',
          }}
        />
        
        <button 
          type="submit" 
          disabled={createUserMutation.isPending}
          style={{
            padding: '12px',
            backgroundColor: createUserMutation.isPending ? '#95a5a6' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: createUserMutation.isPending ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {createUserMutation.isPending ? 'Creating...' : 'Create User'}
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

// TODO 9: Main Exercise Component
// Create the main component that demonstrates React Query + GraphQL integration

export const ReactQueryGraphQLExercise: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'create'>('users');
  
  // TODO: Create React Query client with appropriate configuration
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount, error) => {
          // TODO: Smart retry logic
          if (error.message.includes('404') || error.message.includes('403')) {
            return false; // Don't retry client errors
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        <h2>React Query + GraphQL Integration</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Demonstrating manual GraphQL integration with TanStack Query for flexible caching and state management.
        </p>
        
        <div style={{ marginBottom: '24px' }}>
          <nav style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #ddd' }}>
            {[
              { key: 'users', label: 'Users' },
              { key: 'posts', label: 'Posts' },
              { key: 'create', label: 'Create User' },
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
        
        <div style={{ minHeight: '400px' }}>
          {activeTab === 'users' && <UsersList />}
          {activeTab === 'posts' && <PostsList />}
          {activeTab === 'create' && <CreateUserForm />}
        </div>
        
        <div style={{ 
          marginTop: '32px', 
          padding: '16px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
        }}>
          <h4>🔧 React Query + GraphQL Features:</h4>
          <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
            <div>📊 <strong>Structured Query Keys:</strong> Hierarchical keys for precise cache management</div>
            <div>🔄 <strong>Stale-While-Revalidate:</strong> Background refetching with immediate cache serving</div>
            <div>⚡ <strong>Smart Invalidation:</strong> Related data updates when mutations succeed</div>
            <div>🛡️ <strong>Error Categorization:</strong> Network vs GraphQL error handling</div>
            <div>🎯 <strong>TypeScript Integration:</strong> Full type safety for queries and mutations</div>
            <div>⏱️ <strong>Configurable Caching:</strong> Stale time and garbage collection control</div>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default ReactQueryGraphQLExercise;