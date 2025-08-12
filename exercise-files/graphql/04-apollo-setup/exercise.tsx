// Apollo Client Setup and Configuration Exercise
// Configure Apollo Client with InMemoryCache, type policies, and advanced caching strategies

import React, { ReactNode } from 'react';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  from,
  HttpLink,
  ApolloLink,
  Operation,
  NextLink,
  Observable,
  FetchResult,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { RetryLink } from '@apollo/client/link/retry';
import { createUploadLink } from 'apollo-upload-client';

// TODO 1: Define Type Policies for Cache Normalization
// Configure how Apollo normalizes and caches different types

export interface User {
  id: string;
  username: string;
  email: string;
  profile: UserProfile;
  posts: Post[];
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  avatar?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: User;
  comments: Comment[];
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  post: Post;
  parent?: Comment;
  replies: Comment[];
  createdAt: string;
}

// TODO: Configure type policies for normalization
const typePolicies = {
  User: {
    // TODO: Define how User objects should be cached
    // Consider:
    // - Key fields for normalization
    // - Field policies for computed fields
    // - Merge strategies for arrays
    keyFields: ['id'],
    fields: {
      // TODO: Define field policies
      fullName: {
        // Computed field example
        read(existing, { readField }) {
          // TODO: Compute fullName from firstName and lastName
          throw new Error('TODO: Implement fullName field policy');
        }
      },
      posts: {
        // TODO: Configure posts array merging
        // Should support pagination
        merge(existing = [], incoming: any[], { args, mergeObjects }) {
          // TODO: Implement posts merge strategy
          throw new Error('TODO: Implement posts merge policy');
        }
      }
    }
  },

  Post: {
    // TODO: Configure Post type policies
    keyFields: ['id'],
    fields: {
      // TODO: Configure comment pagination
      comments: {
        merge(existing = [], incoming: any[], { args }) {
          // TODO: Implement comments merge with pagination support
          throw new Error('TODO: Implement comments merge policy');
        }
      },
      
      // TODO: Add computed field for comment count
      commentCount: {
        read(existing, { readField }) {
          // TODO: Calculate comment count from comments array
          throw new Error('TODO: Implement commentCount field policy');
        }
      }
    }
  },

  Comment: {
    // TODO: Configure Comment type policies for threaded comments
    keyFields: ['id'],
    fields: {
      replies: {
        merge(existing = [], incoming: any[]) {
          // TODO: Merge nested comment replies
          throw new Error('TODO: Implement replies merge policy');
        }
      }
    }
  },

  // TODO: Add Query type policies for root fields
  Query: {
    fields: {
      posts: {
        // TODO: Configure posts query caching
        // Consider cursor-based pagination
        keyArgs: ['filter', 'sortBy'],
        merge(existing, incoming, { args }) {
          // TODO: Implement posts query merge strategy
          throw new Error('TODO: Implement posts query merge policy');
        }
      },
      
      user: {
        // TODO: Configure user query caching
        // Simple field, might not need custom merge
        keyArgs: ['id'],
      },

      search: {
        // TODO: Configure search results caching
        keyArgs: ['query', 'type'],
        merge(existing, incoming, { args }) {
          // TODO: Implement search results merge
          // Consider that search results shouldn't be cached long
          throw new Error('TODO: Implement search merge policy');
        }
      }
    }
  }
};

// TODO 2: Create Custom Apollo Links
// Build middleware for authentication, error handling, and logging

// Authentication Link
const createAuthLink = () => {
  return setContext((operation: Operation, { headers }) => {
    // TODO: Get authentication token
    // This could be from localStorage, sessionStorage, or context
    const getAuthToken = (): string | null => {
      // TODO: Implement token retrieval
      // Check localStorage, cookies, or authentication context
      throw new Error('TODO: Implement token retrieval');
    };

    const token = getAuthToken();
    
    // TODO: Return headers with authentication
    return {
      headers: {
        ...headers,
        // TODO: Add authorization header if token exists
      }
    };
  });
};

// Error Handling Link
const createErrorLink = () => {
  return onError(({ graphQLErrors, networkError, operation, forward }) => {
    // TODO: Implement comprehensive error handling
    
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path, extensions }) => {
        // TODO: Handle different types of GraphQL errors
        // Consider:
        // - Authentication errors (redirect to login)
        // - Authorization errors (show access denied)
        // - Validation errors (show to user)
        // - Server errors (show generic message)
        
        const errorCode = extensions?.code;
        
        switch (errorCode) {
          case 'UNAUTHENTICATED':
            // TODO: Handle authentication errors
            console.error('Authentication error:', message);
            // Redirect to login or refresh token
            break;
            
          case 'FORBIDDEN':
            // TODO: Handle authorization errors
            console.error('Authorization error:', message);
            break;
            
          case 'VALIDATION_ERROR':
            // TODO: Handle validation errors
            console.error('Validation error:', message);
            break;
            
          default:
            // TODO: Handle other GraphQL errors
            console.error('GraphQL error:', message);
        }
      });
    }

    if (networkError) {
      // TODO: Handle network errors
      console.error('Network error:', networkError);
      
      // TODO: Implement network error handling
      // Consider retry logic for transient failures
      // Show offline message for network unavailable
    }
  });
};

// Logging Link
const createLoggingLink = () => {
  return new ApolloLink((operation: Operation, forward: NextLink) => {
    // TODO: Implement request/response logging
    const startTime = Date.now();
    
    console.log(`GraphQL Request: ${operation.operationName}`);
    console.log('Variables:', operation.variables);
    console.log('Query:', operation.query.loc?.source.body);
    
    return forward(operation).map((result: FetchResult) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // TODO: Log response details
      console.log(`GraphQL Response: ${operation.operationName} (${duration}ms)`);
      console.log('Data:', result.data);
      console.log('Errors:', result.errors);
      
      return result;
    });
  });
};

// Performance Monitoring Link
const createPerformanceLink = () => {
  return new ApolloLink((operation: Operation, forward: NextLink) => {
    return new Observable(observer => {
      const startTime = performance.now();
      
      // TODO: Implement performance monitoring
      const subscription = forward(operation).subscribe({
        next: (result) => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          // TODO: Record performance metrics
          // Send to analytics service
          // Log slow queries
          
          if (duration > 1000) { // Log slow queries (>1s)
            console.warn(`Slow GraphQL query: ${operation.operationName} took ${duration}ms`);
          }
          
          // TODO: Send metrics to monitoring service
          recordPerformanceMetric({
            operationName: operation.operationName,
            duration,
            variables: operation.variables,
            success: !result.errors?.length
          });
          
          observer.next(result);
        },
        error: observer.error.bind(observer),
        complete: observer.complete.bind(observer)
      });

      return subscription;
    });
  });
};

// TODO: Implement performance metric recording
function recordPerformanceMetric(metric: {
  operationName?: string;
  duration: number;
  variables: any;
  success: boolean;
}) {
  // TODO: Send metrics to monitoring service (DataDog, New Relic, etc.)
  throw new Error('TODO: Implement performance metric recording');
}

// TODO 3: Configure InMemoryCache with Advanced Options
const createInMemoryCache = () => {
  return new InMemoryCache({
    // TODO: Configure cache options
    typePolicies,
    
    // TODO: Configure additional cache options
    addTypename: true,
    resultCaching: true,
    
    // TODO: Configure cache size and eviction
    possibleTypes: {
      // TODO: Define possible types for unions and interfaces
      // Example for SearchResult union:
      // SearchResult: ['User', 'Post', 'Comment']
    },
    
    // TODO: Configure data ID from object
    dataIdFromObject: (object: any) => {
      // TODO: Implement custom data ID generation
      // Default behavior is to use __typename + id
      // You might want custom logic for certain types
      
      switch (object.__typename) {
        case 'User':
          return `User:${object.id}`;
        case 'Post':
          return `Post:${object.id}`;
        case 'Comment':
          return `Comment:${object.id}`;
        default:
          return `${object.__typename}:${object.id}`;
      }
    }
  });
};

// TODO 4: Configure HTTP Link with Upload Support
const createHttpLink = (uri: string) => {
  // TODO: Create HTTP link with file upload support
  return createUploadLink({
    uri,
    // TODO: Configure additional options
    headers: {
      // TODO: Add default headers
    },
    
    // TODO: Configure fetch options
    fetchOptions: {
      // TODO: Add fetch configuration
    },
    
    // TODO: Configure credentials
    credentials: 'include', // Include cookies for authentication
  }) as any;
};

// TODO 5: Create Apollo Client with All Configurations
export const createApolloClient = (config: {
  uri: string;
  enableLogging?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableDevTools?: boolean;
}) => {
  const { uri, enableLogging = true, enablePerformanceMonitoring = true, enableDevTools = true } = config;

  // TODO: Create and configure cache
  const cache = createInMemoryCache();
  
  // TODO: Create HTTP link
  const httpLink = createHttpLink(uri);
  
  // TODO: Create authentication link
  const authLink = createAuthLink();
  
  // TODO: Create error handling link
  const errorLink = createErrorLink();
  
  // TODO: Create optional links
  const links: ApolloLink[] = [errorLink, authLink];
  
  if (enableLogging && process.env.NODE_ENV === 'development') {
    links.push(createLoggingLink());
  }
  
  if (enablePerformanceMonitoring) {
    links.push(createPerformanceLink());
  }
  
  // TODO: Add retry link for network resilience
  const retryLink = new RetryLink({
    delay: {
      initial: 300,
      max: Infinity,
      jitter: true
    },
    attempts: {
      max: 3,
      retryIf: (error, _operation) => {
        // TODO: Configure retry conditions
        // Retry on network errors but not on GraphQL errors
        return !!error && !error.result;
      }
    }
  });
  
  links.push(retryLink);
  links.push(httpLink);
  
  // TODO: Create Apollo Client
  const client = new ApolloClient({
    link: from(links),
    cache,
    
    // TODO: Configure additional options
    defaultOptions: {
      watchQuery: {
        // TODO: Configure default watch query options
        errorPolicy: 'all', // Return partial data with errors
        fetchPolicy: 'cache-and-network', // Always fetch from network for freshness
      },
      query: {
        // TODO: Configure default query options
        errorPolicy: 'all',
        fetchPolicy: 'cache-first',
      },
      mutate: {
        // TODO: Configure default mutation options
        errorPolicy: 'all',
      }
    },
    
    // TODO: Configure development tools
    connectToDevTools: enableDevTools && process.env.NODE_ENV === 'development',
    
    // TODO: Configure cache persistence
    // You might want to restore cache from storage
    // onCacheRestore: async () => {
    //   TODO: Restore cache from persistent storage
    // }
  });

  // TODO: Add cache persistence
  if (typeof window !== 'undefined') {
    // TODO: Persist cache to localStorage
    // You can use apollo-cache-persist for this
  }

  return client;
};

// TODO 6: Create Apollo Provider Component with Error Boundaries
export interface ApolloProviderWithErrorBoundaryProps {
  client?: ApolloClient<any>;
  uri?: string;
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class GraphQLErrorBoundary extends React.Component<
  { children: ReactNode; onError?: (error: Error, errorInfo: React.ErrorInfo) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: Log error to monitoring service
    console.error('GraphQL Error Boundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // TODO: Render error fallback UI
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong with the GraphQL connection</h2>
          <p>Please refresh the page or try again later.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px' }}>
              <summary>Error Details (Development Only)</summary>
              <pre style={{ textAlign: 'left', fontSize: '12px' }}>
                {this.state.error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export const ApolloProviderWithErrorBoundary: React.FC<ApolloProviderWithErrorBoundaryProps> = ({
  client: providedClient,
  uri = process.env.REACT_APP_GRAPHQL_URI || 'http://localhost:4000/graphql',
  children,
  onError
}) => {
  // TODO: Create client if not provided
  const client = React.useMemo(() => {
    if (providedClient) {
      return providedClient;
    }
    
    return createApolloClient({
      uri,
      enableLogging: process.env.NODE_ENV === 'development',
      enablePerformanceMonitoring: true,
      enableDevTools: process.env.NODE_ENV === 'development'
    });
  }, [providedClient, uri]);

  return (
    <GraphQLErrorBoundary onError={onError}>
      <ApolloProvider client={client}>
        {children}
      </ApolloProvider>
    </GraphQLErrorBoundary>
  );
};

// TODO 7: Cache Utilities and Helpers
export const cacheUtils = {
  // TODO: Clear all cache
  clearCache: (client: ApolloClient<any>) => {
    return client.clearStore();
  },

  // TODO: Reset store (clear + refetch active queries)
  resetStore: (client: ApolloClient<any>) => {
    return client.resetStore();
  },

  // TODO: Evict specific objects from cache
  evictFromCache: (client: ApolloClient<any>, typename: string, id: string) => {
    return client.cache.evict({ id: `${typename}:${id}` });
  },

  // TODO: Update cache manually
  updateCache: <T,>(
    client: ApolloClient<any>,
    typename: string,
    id: string,
    updater: (existing: T) => T
  ) => {
    const cacheId = `${typename}:${id}`;
    const existing = client.cache.readFragment({
      id: cacheId,
      fragment: gql`
        fragment UpdateFragment on ${typename} {
          id
          __typename
        }
      `
    });

    if (existing) {
      const updated = updater(existing);
      client.cache.writeFragment({
        id: cacheId,
        fragment: gql`
          fragment UpdateFragment on ${typename} {
            id
            __typename
          }
        `,
        data: updated
      });
    }
  },

  // TODO: Prefetch query
  prefetch: (client: ApolloClient<any>, query: any, variables?: any) => {
    return client.query({
      query,
      variables,
      fetchPolicy: 'cache-first'
    });
  }
};

// TODO 8: Development Tools and Debugging
export const apolloDevTools = {
  // TODO: Log cache contents
  logCache: (client: ApolloClient<any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Apollo Cache Contents:', client.cache.extract());
    }
  },

  // TODO: Log active queries
  logActiveQueries: (client: ApolloClient<any>) => {
    if (process.env.NODE_ENV === 'development') {
      // TODO: Access and log active queries
      console.log('Active Queries:', client.queryManager);
    }
  },

  // TODO: Mock network responses for testing
  mockNetworkResponse: (operation: string, response: any) => {
    // TODO: Create mock link for testing
    throw new Error('TODO: Implement network response mocking');
  }
};

// TODO 9: Configuration Presets
export const apolloConfigPresets = {
  development: {
    uri: 'http://localhost:4000/graphql',
    enableLogging: true,
    enablePerformanceMonitoring: true,
    enableDevTools: true,
  },

  staging: {
    uri: process.env.REACT_APP_GRAPHQL_URI,
    enableLogging: false,
    enablePerformanceMonitoring: true,
    enableDevTools: false,
  },

  production: {
    uri: process.env.REACT_APP_GRAPHQL_URI,
    enableLogging: false,
    enablePerformanceMonitoring: true,
    enableDevTools: false,
  }
};

// TODO 10: Example Usage Component
export const ApolloSetupExample: React.FC = () => {
  return (
    <ApolloProviderWithErrorBoundary
      uri="http://localhost:4000/graphql"
      onError={(error, errorInfo) => {
        console.error('Apollo Error:', error, errorInfo);
        // TODO: Send error to monitoring service
      }}
    >
      <div>
        <h1>Apollo Client Setup Example</h1>
        <p>Apollo Client is configured with:</p>
        <ul>
          <li>✅ InMemoryCache with type policies</li>
          <li>✅ Authentication link</li>
          <li>✅ Error handling link</li>
          <li>✅ Performance monitoring</li>
          <li>✅ Request/response logging (dev only)</li>
          <li>✅ Retry mechanism</li>
          <li>✅ File upload support</li>
          <li>✅ Error boundary</li>
        </ul>
        
        {/* TODO: Add example queries to test the setup */}
        <ExampleQueries />
      </div>
    </ApolloProviderWithErrorBoundary>
  );
};

// TODO: Create example queries component to test the setup
const ExampleQueries: React.FC = () => {
  // TODO: Add example queries using the configured Apollo client
  return (
    <div>
      <h3>Example Queries</h3>
      <p>TODO: Add example queries to test Apollo Client setup</p>
    </div>
  );
};

export default ApolloProviderWithErrorBoundary;