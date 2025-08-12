// URQL Basic Setup and Querying Exercise
// Learn URQL fundamentals with TypeScript integration and basic caching

import React, { useState, useCallback } from 'react';
import {
  Client,
  Provider,
  cacheExchange,
  fetchExchange,
  createClient,
  useQuery,
  useMutation,
  UseQueryState,
  UseMutationState,
  OperationContext,
  CombinedError,
} from 'urql';

// TODO 1: Define TypeScript Interfaces for GraphQL Schema
// Create comprehensive type definitions for your GraphQL entities

export interface User {
  id: string;
  username: string;
  email: string;
  profile: UserProfile;
  createdAt: string;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  avatar?: string;
  location?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: User;
  tags: string[];
  publishedAt: string;
  status: PostStatus;
  likesCount: number;
  commentsCount: number;
}

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Comment {
  id: string;
  content: string;
  author: User;
  post: Post;
  createdAt: string;
  updatedAt: string;
}

// TODO 2: Define Query and Mutation Variables Types
// Create interfaces for all GraphQL operation variables

export interface GetUsersQueryVariables {
  first?: number;
  after?: string;
  search?: string;
  isActive?: boolean;
}

export interface GetUsersQueryResult {
  users: {
    edges: Array<{
      node: User;
      cursor: string;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    };
    totalCount: number;
  };
}

export interface GetPostsQueryVariables {
  first?: number;
  after?: string;
  authorId?: string;
  status?: PostStatus;
  tags?: string[];
}

export interface GetPostsQueryResult {
  posts: {
    edges: Array<{
      node: Post;
      cursor: string;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    };
    totalCount: number;
  };
}

export interface CreateUserMutationVariables {
  input: {
    username: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      bio?: string;
    };
  };
}

export interface CreateUserMutationResult {
  createUser: {
    user: User;
    errors?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface CreatePostMutationVariables {
  input: {
    title: string;
    content: string;
    tags?: string[];
    status?: PostStatus;
  };
}

export interface CreatePostMutationResult {
  createPost: {
    post: Post;
    errors?: Array<{
      field: string;
      message: string;
    }>;
  };
}

// TODO 3: Define GraphQL Query and Mutation Documents
// Write GraphQL operations using gql template literals

// Users query
export const GET_USERS = `
  query GetUsers($first: Int, $after: String, $search: String, $isActive: Boolean) {
    users(first: $first, after: $after, search: $search, isActive: $isActive) {
      edges {
        node {
          id
          username
          email
          profile {
            id
            firstName
            lastName
            bio
            avatar
            location
          }
          createdAt
          isActive
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

// Posts query
export const GET_POSTS = `
  query GetPosts($first: Int, $after: String, $authorId: ID, $status: PostStatus, $tags: [String!]) {
    posts(first: $first, after: $after, authorId: $authorId, status: $status, tags: $tags) {
      edges {
        node {
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
          tags
          publishedAt
          status
          likesCount
          commentsCount
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

// Single user query
export const GET_USER = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      username
      email
      profile {
        id
        firstName
        lastName
        bio
        avatar
        location
      }
      createdAt
      isActive
    }
  }
`;

// Create user mutation
export const CREATE_USER = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      user {
        id
        username
        email
        profile {
          id
          firstName
          lastName
          bio
        }
        createdAt
        isActive
      }
      errors {
        field
        message
      }
    }
  }
`;

// Create post mutation
export const CREATE_POST = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      post {
        id
        title
        content
        author {
          id
          username
          profile {
            firstName
            lastName
          }
        }
        tags
        publishedAt
        status
        likesCount
        commentsCount
      }
      errors {
        field
        message
      }
    }
  }
`;

// TODO 4: Create URQL Client Configuration
// Set up URQL client with proper exchanges and TypeScript integration

export const createUrqlClient = (config: {
  url: string;
  fetchOptions?: RequestInit;
  requestPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'cache-only';
  enableDevTools?: boolean;
}): Client => {
  const { url, fetchOptions = {}, requestPolicy = 'cache-first', enableDevTools = true } = config;

  // TODO: Configure URQL client
  // Set up exchanges, request policies, and error handling
  
  const client = createClient({
    url,
    
    // TODO: Configure default request policy
    requestPolicy,
    
    // TODO: Set up exchanges
    exchanges: [
      // TODO: Add cache exchange with configuration
      cacheExchange({
        // TODO: Configure cache settings
        // Document cache is URQL's default - different from normalized caching
      }),
      
      // TODO: Add fetch exchange with error handling
      fetchExchange,
    ],
    
    // TODO: Configure fetch options
    fetchOptions: () => ({
      ...fetchOptions,
      headers: {
        // TODO: Add default headers
        'Content-Type': 'application/json',
        // TODO: Add authentication headers if needed
        ...fetchOptions.headers,
      },
    }),
    
    // TODO: Add error handling
    // URQL doesn't have global error handling like Apollo
    // Individual queries/mutations handle their own errors
  });

  // TODO: Add development tools integration
  if (enableDevTools && process.env.NODE_ENV === 'development') {
    // URQL DevTools can be added via browser extension
    // No additional setup needed here
  }

  return client;
};

// TODO 5: Create Custom URQL Hooks
// Build enhanced hooks with additional functionality

export interface UseUsersQueryOptions {
  search?: string;
  isActive?: boolean;
  first?: number;
  requestPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'cache-only';
}

export interface UseUsersQueryResult {
  users: User[];
  loading: boolean;
  error?: CombinedError;
  hasNextPage: boolean;
  totalCount: number;
  loadMore: () => void;
  refresh: () => void;
  search: (term: string) => void;
}

export const useUsersQuery = (options: UseUsersQueryOptions = {}): UseUsersQueryResult => {
  const { search = '', isActive = true, first = 20, requestPolicy = 'cache-first' } = options;
  
  // TODO: Implement enhanced users query hook
  const [variables, setVariables] = useState({
    first,
    search: search || undefined,
    isActive,
  });

  const [result, executeQuery] = useQuery<GetUsersQueryResult, GetUsersQueryVariables>({
    query: GET_USERS,
    variables,
    requestPolicy,
    // TODO: Configure additional options
    // pause: false, // Set to true to prevent automatic execution
  });

  // TODO: Extract and transform data
  const users = result.data?.users?.edges.map(edge => edge.node) || [];
  const pageInfo = result.data?.users?.pageInfo;
  const totalCount = result.data?.users?.totalCount || 0;

  // TODO: Implement helper functions
  const loadMore = useCallback(() => {
    if (pageInfo?.hasNextPage && pageInfo?.endCursor) {
      // TODO: Implement pagination
      // URQL doesn't have built-in fetchMore like Apollo
      // Need to handle pagination manually
      setVariables(prev => ({
        ...prev,
        after: pageInfo.endCursor,
        first: prev.first + 20,
      }));
    }
  }, [pageInfo]);

  const refresh = useCallback(() => {
    // TODO: Force refresh by changing request policy
    executeQuery({
      requestPolicy: 'network-only',
    });
  }, [executeQuery]);

  const searchUsers = useCallback((term: string) => {
    // TODO: Update search variables
    setVariables(prev => ({
      ...prev,
      search: term || undefined,
      after: undefined, // Reset pagination
    }));
  }, []);

  return {
    users,
    loading: result.fetching,
    error: result.error,
    hasNextPage: pageInfo?.hasNextPage || false,
    totalCount,
    loadMore,
    refresh,
    search: searchUsers,
  };
};

// TODO 6: Create User Mutation Hook
export interface UseCreateUserResult {
  createUser: (variables: CreateUserMutationVariables) => Promise<CreateUserMutationResult | undefined>;
  loading: boolean;
  error?: CombinedError;
  data?: CreateUserMutationResult;
}

export const useCreateUser = (): UseCreateUserResult => {
  // TODO: Implement create user mutation hook
  const [result, executeMutation] = useMutation<CreateUserMutationResult, CreateUserMutationVariables>(CREATE_USER);

  const createUser = useCallback(async (variables: CreateUserMutationVariables) => {
    // TODO: Execute mutation with variables
    const mutationResult = await executeMutation(variables);
    
    // TODO: Handle mutation result
    if (mutationResult.error) {
      console.error('Create user error:', mutationResult.error);
      // TODO: Handle different error types
      // Network errors, GraphQL errors, validation errors
    }
    
    if (mutationResult.data?.createUser.errors) {
      console.error('Validation errors:', mutationResult.data.createUser.errors);
      // TODO: Handle validation errors from the server
    }

    return mutationResult.data;
  }, [executeMutation]);

  return {
    createUser,
    loading: result.fetching,
    error: result.error,
    data: result.data,
  };
};

// TODO 7: Create Error Handling Utilities
// URQL error handling helpers

export interface GraphQLError {
  message: string;
  path?: (string | number)[];
  extensions?: {
    code?: string;
    field?: string;
    [key: string]: any;
  };
}

export const parseUrqlError = (error: CombinedError) => {
  const result = {
    networkError: error.networkError,
    graphQLErrors: error.graphQLErrors,
    hasNetworkError: Boolean(error.networkError),
    hasGraphQLErrors: Boolean(error.graphQLErrors?.length),
    isAuthError: false,
    isValidationError: false,
    errorMessages: [] as string[],
  };

  // TODO: Parse GraphQL errors
  if (result.hasGraphQLErrors) {
    error.graphQLErrors.forEach(gqlError => {
      result.errorMessages.push(gqlError.message);
      
      // TODO: Check for specific error types
      const errorCode = gqlError.extensions?.code;
      if (errorCode === 'UNAUTHENTICATED' || errorCode === 'FORBIDDEN') {
        result.isAuthError = true;
      }
      if (errorCode === 'VALIDATION_ERROR') {
        result.isValidationError = true;
      }
    });
  }

  // TODO: Parse network errors
  if (result.hasNetworkError) {
    result.errorMessages.push('Network error occurred');
  }

  return result;
};

// TODO 8: Create URQL Provider Component
export interface UrqlProviderProps {
  client?: Client;
  url?: string;
  children: React.ReactNode;
}

export const UrqlProvider: React.FC<UrqlProviderProps> = ({
  client: providedClient,
  url = 'http://localhost:4000/graphql',
  children,
}) => {
  // TODO: Create client if not provided
  const client = React.useMemo(() => {
    if (providedClient) {
      return providedClient;
    }

    return createUrqlClient({
      url,
      requestPolicy: 'cache-first',
      enableDevTools: process.env.NODE_ENV === 'development',
    });
  }, [providedClient, url]);

  return (
    <Provider value={client}>
      {children}
    </Provider>
  );
};

// TODO 9: Example Components
// Practical examples using URQL hooks

export const UsersList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { users, loading, error, hasNextPage, loadMore, search } = useUsersQuery({
    search: searchTerm,
    first: 10,
  });

  // TODO: Handle search input
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
    search(term);
  };

  // TODO: Handle error states
  if (error) {
    const parsedError = parseUrqlError(error);
    return (
      <div className="error-container">
        <h3>Error loading users</h3>
        <ul>
          {parsedError.errorMessages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
        {parsedError.isAuthError && (
          <p>Please log in to view users.</p>
        )}
      </div>
    );
  }

  return (
    <div className="users-list">
      <h2>Users</h2>
      
      {/* Search input */}
      <input
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={handleSearch}
        className="search-input"
      />

      {/* Loading state */}
      {loading && <div className="loading">Loading users...</div>}

      {/* Users list */}
      <div className="users-grid">
        {users.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      {/* Load more button */}
      {hasNextPage && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}

      {/* Empty state */}
      {!loading && users.length === 0 && (
        <div className="empty-state">
          <p>No users found.</p>
        </div>
      )}
    </div>
  );
};

export interface UserCardProps {
  user: User;
}

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return (
    <div className="user-card">
      <div className="user-avatar">
        {user.profile.avatar ? (
          <img src={user.profile.avatar} alt={user.username} />
        ) : (
          <div className="avatar-placeholder">
            {user.profile.firstName[0]}{user.profile.lastName[0]}
          </div>
        )}
      </div>
      
      <div className="user-info">
        <h3>{user.profile.firstName} {user.profile.lastName}</h3>
        <p className="username">@{user.username}</p>
        {user.profile.bio && <p className="bio">{user.profile.bio}</p>}
        {user.profile.location && <p className="location">{user.profile.location}</p>}
        
        <div className="user-status">
          <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const CreateUserForm: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    bio: '',
  });

  const { createUser, loading, error, data } = useCreateUser();

  // TODO: Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const result = await createUser({
      input: {
        username: formData.username,
        email: formData.email,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          bio: formData.bio || undefined,
        },
      },
    });

    // TODO: Handle success
    if (result?.createUser.user) {
      console.log('User created successfully:', result.createUser.user);
      // Reset form or redirect
      setFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        bio: '',
      });
    }
  };

  // TODO: Handle input changes
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="create-user-form">
      <h2>Create New User</h2>

      {/* Error display */}
      {error && (
        <div className="error-message">
          {parseUrqlError(error).errorMessages.join(', ')}
        </div>
      )}

      {/* Validation errors */}
      {data?.createUser.errors && (
        <div className="validation-errors">
          {data.createUser.errors.map((error, index) => (
            <div key={index} className="validation-error">
              {error.field}: {error.message}
            </div>
          ))}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="firstName">First Name</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="lastName">Last Name</label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="bio">Bio (Optional)</label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={3}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
};

// TODO 10: Example App with URQL Setup
export const UrqlBasicsExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'create'>('users');

  return (
    <UrqlProvider url="http://localhost:4000/graphql">
      <div className="urql-example">
        <header>
          <h1>URQL Basics Example</h1>
          <nav>
            <button
              onClick={() => setActiveTab('users')}
              className={activeTab === 'users' ? 'active' : ''}
            >
              Users List
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={activeTab === 'create' ? 'active' : ''}
            >
              Create User
            </button>
          </nav>
        </header>

        <main>
          {activeTab === 'users' && <UsersList />}
          {activeTab === 'create' && <CreateUserForm />}
        </main>

        <footer>
          <p>
            URQL Features Demonstrated:
            <br />
            ✅ Document caching (default)
            <br />
            ✅ Request policies
            <br />
            ✅ TypeScript integration
            <br />
            ✅ Error handling
            <br />
            ✅ Custom hooks
            <br />
            ✅ Pagination (manual)
          </p>
        </footer>
      </div>
    </UrqlProvider>
  );
};

export default UrqlBasicsExample;