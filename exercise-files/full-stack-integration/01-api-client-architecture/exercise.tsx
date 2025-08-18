import React, { useState } from 'react';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { z } from 'zod';

// Zod schemas for type safety and runtime validation
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().url().optional(),
});

const CreatePostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  authorId: z.string(),
});

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type User = z.infer<typeof UserSchema>;
type CreatePostRequest = z.infer<typeof CreatePostSchema>;
type Post = z.infer<typeof PostSchema>;

// TODO: Define ApiClientConfig interface
interface ApiClientConfig {
  // Add configuration properties:
  // - baseURL: string
  // - timeout: number
  // - retryAttempts: number
  // - authTokenHeader: string
}

// TODO: Define EndpointDefinition interface
interface EndpointDefinition<TRequest, TResponse> {
  // Add endpoint definition properties:
  // - method: HTTP method
  // - path: URL path with parameter placeholders
  // - requestSchema?: Zod schema for request validation
  // - responseSchema: Zod schema for response validation
  // - requiresAuth?: boolean for authentication requirement
  // - cacheKey?: string for request deduplication
}

// TODO: Define custom error classes
class ApiError extends Error {
  // Add properties:
  // - status: number
  // - code: string
  // - originalError?: any
}

class AuthenticationError extends ApiError {}
class ValidationError extends ApiError {}
class NetworkError extends ApiError {}
class ServerError extends ApiError {}

// TODO: Define AuthService interface
interface AuthService {
  // Add methods:
  // - getToken(): string | null
  // - refreshToken(): Promise<string>
  // - logout(): void
  // - isTokenExpired(token: string): boolean
}

// TODO: Implement RequestDeduplicator class
class RequestDeduplicator {
  // Add properties to track in-flight requests
  // Add methods:
  // - getKey(config: AxiosRequestConfig): string
  // - deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T>
  // - cleanup(key: string): void
}

// TODO: Implement BaseApiClient class
class BaseApiClient {
  // Add properties:
  // - private client: AxiosInstance
  // - private config: ApiClientConfig
  // - private authService: AuthService
  // - private deduplicator: RequestDeduplicator

  constructor(config: ApiClientConfig, authService: AuthService) {
    // TODO: Initialize Axios instance
    // TODO: Set up request interceptors
    // TODO: Set up response interceptors
    // TODO: Initialize deduplicator
  }

  // TODO: Implement setupRequestInterceptors()
  private setupRequestInterceptors(): void {
    // Add authentication headers
    // Add request logging
    // Handle request transformation
  }

  // TODO: Implement setupResponseInterceptors()
  private setupResponseInterceptors(): void {
    // Handle successful responses
    // Handle error responses
    // Implement retry logic
    // Handle token refresh
  }

  // TODO: Implement request method
  async request<TRequest, TResponse>(
    endpoint: EndpointDefinition<TRequest, TResponse>,
    data?: TRequest,
    pathParams?: Record<string, string>
  ): Promise<TResponse> {
    // Build URL with path parameters
    // Validate request data
    // Handle deduplication
    // Make request
    // Validate response
    // Return typed response
  }

  // TODO: Implement retry logic
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempts: number = this.config.retryAttempts
  ): Promise<T> {
    // Implement exponential backoff
    // Handle specific error types
    // Return final result or throw error
  }

  // TODO: Implement error handling
  private handleError(error: any): ApiError {
    // Categorize errors
    // Create appropriate error instances
    // Log errors for debugging
  }
}

// TODO: Implement MockAuthService for demonstration
class MockAuthService implements AuthService {
  private token: string | null = null;

  getToken(): string | null {
    // Return current token
  }

  async refreshToken(): Promise<string> {
    // Simulate token refresh
  }

  logout(): void {
    // Clear token
  }

  isTokenExpired(token: string): boolean {
    // Check if token is expired
    // For demo purposes, always return false
  }
}

// Example endpoint definitions
const endpoints = {
  getUser: {
    method: 'GET' as const,
    path: '/users/{id}',
    responseSchema: UserSchema,
    requiresAuth: true,
    cacheKey: 'user-{id}'
  } satisfies EndpointDefinition<void, User>,

  createPost: {
    method: 'POST' as const,
    path: '/posts',
    requestSchema: CreatePostSchema,
    responseSchema: PostSchema,
    requiresAuth: true
  } satisfies EndpointDefinition<CreatePostRequest, Post>,

  getPosts: {
    method: 'GET' as const,
    path: '/posts',
    responseSchema: z.array(PostSchema),
    requiresAuth: false,
    cacheKey: 'posts'
  } satisfies EndpointDefinition<void, Post[]>
};

// Demo Component
const ApiClientDemo: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Initialize API client
  const authService = new MockAuthService();
  const apiClient = new BaseApiClient({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 10000,
    retryAttempts: 3,
    authTokenHeader: 'Authorization'
  }, authService);

  const fetchUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Use API client to fetch user
      // const userData = await apiClient.request(endpoints.getUser, undefined, { id: userId });
      // setUser(userData);
      
      // Temporary mock implementation
      setUser({
        id: userId,
        name: 'John Doe',
        email: 'john.doe@example.com',
        avatar: 'https://via.placeholder.com/100'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    try {
      setLoading(true);
      setError(null);

      const postData: CreatePostRequest = {
        title: 'New Post from API Client',
        content: 'This post was created using our custom API client architecture.',
        authorId: user?.id || '1'
      };

      // TODO: Use API client to create post
      // const newPost = await apiClient.request(endpoints.createPost, postData);
      // setPosts(prev => [newPost, ...prev]);

      // Temporary mock implementation
      const newPost: Post = {
        id: Date.now().toString(),
        ...postData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setPosts(prev => [newPost, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Use API client to fetch posts
      // const postsData = await apiClient.request(endpoints.getPosts);
      // setPosts(postsData);

      // Temporary mock implementation
      setPosts([
        {
          id: '1',
          title: 'Welcome to API Client Architecture',
          content: 'This is an example post to demonstrate our API client.',
          authorId: '1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>API Client Architecture Demo</h1>
      
      {error && (
        <div style={{ 
          background: '#fee', 
          border: '1px solid #fcc', 
          padding: '10px', 
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2>User Management</h2>
        <button 
          onClick={() => fetchUser('1')} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Fetch User'}
        </button>
        
        {user && (
          <div style={{ 
            marginTop: '10px', 
            padding: '15px', 
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3>User Details</h3>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            {user.avatar && <img src={user.avatar} alt="Avatar" style={{ width: '50px', height: '50px' }} />}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Post Management</h2>
        <button 
          onClick={fetchPosts} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Fetch Posts'}
        </button>
        
        <button 
          onClick={createPost} 
          disabled={loading || !user}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (loading || !user) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Creating...' : 'Create Post'}
        </button>
      </div>

      {posts.length > 0 && (
        <div>
          <h2>Posts</h2>
          {posts.map(post => (
            <div key={post.id} style={{ 
              marginBottom: '15px', 
              padding: '15px', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f9f9f9'
            }}>
              <h3>{post.title}</h3>
              <p>{post.content}</p>
              <small>
                <strong>Author ID:</strong> {post.authorId} | 
                <strong> Created:</strong> {new Date(post.createdAt).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h3>Implementation Notes</h3>
        <ul>
          <li>Complete the BaseApiClient class with all required methods</li>
          <li>Implement request/response interceptors for authentication and error handling</li>
          <li>Add request deduplication to prevent duplicate API calls</li>
          <li>Integrate Zod validation for type-safe API responses</li>
          <li>Implement proper error handling and retry logic</li>
          <li>Test with both successful and error scenarios</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiClientDemo;