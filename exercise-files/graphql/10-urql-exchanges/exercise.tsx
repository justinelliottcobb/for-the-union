// URQL Custom Exchanges and Middleware Exercise
// Build custom URQL exchanges for authentication, retry logic, and advanced patterns

import React, { useState, useCallback, useRef } from 'react';
import {
  Client,
  Provider,
  cacheExchange,
  fetchExchange,
  createClient,
  useQuery,
  useMutation,
  Exchange,
  Operation,
  OperationResult,
  makeOperation,
} from 'urql';
import { pipe, tap, map, mergeMap, fromPromise, delay } from 'wonka';

// TODO 1: Define Authentication Exchange
// Create an exchange that handles JWT token authentication
// - Add Authorization header to requests
// - Handle token refresh on 401 errors
// - Store tokens securely

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
}

// TODO: Implement authentication exchange
export const authExchange: Exchange = ({ forward }) => (ops$) => {
  return pipe(
    ops$,
    map((operation) => {
      // TODO: Add Authorization header logic
      const token = getAuthToken();
      if (token) {
        return makeOperation(operation.kind, operation, {
          ...operation.context,
          fetchOptions: {
            ...operation.context.fetchOptions,
            headers: {
              ...operation.context.fetchOptions?.headers,
              // TODO: Add authorization header
            },
          },
        });
      }
      return operation;
    }),
    forward,
    tap((result) => {
      // TODO: Handle 401 errors and token refresh
      if (result.error?.networkError?.status === 401) {
        // TODO: Implement token refresh logic
      }
    })
  );
};

// TODO 2: Define Retry Exchange
// Create an exchange that implements exponential backoff retry logic
// - Retry failed requests with exponential backoff
// - Configure maximum retry attempts
// - Handle specific error types differently

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryIf: (error: any) => boolean;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryIf: (error) => {
    // TODO: Define which errors should be retried
    return false;
  },
};

// TODO: Implement retry exchange with exponential backoff
export const retryExchange = (config: Partial<RetryConfig> = {}): Exchange => {
  const finalConfig = { ...defaultRetryConfig, ...config };
  
  return ({ forward }) => (ops$) => {
    return pipe(
      ops$,
      mergeMap((operation) => {
        // TODO: Implement retry logic
        let attempts = 0;
        
        const executeWithRetry = (op: Operation): any => {
          return pipe(
            forward([op]),
            mergeMap((result) => {
              // TODO: Check if result should be retried
              if (result.error && attempts < finalConfig.maxRetries) {
                // TODO: Implement exponential backoff
                const backoffDelay = Math.min(
                  finalConfig.baseDelay * Math.pow(2, attempts),
                  finalConfig.maxDelay
                );
                
                attempts++;
                // TODO: Return delayed retry
                return pipe(
                  fromPromise(new Promise(resolve => setTimeout(resolve, backoffDelay))),
                  mergeMap(() => executeWithRetry(op))
                );
              }
              
              return [result];
            })
          );
        };
        
        return executeWithRetry(operation);
      })
    );
  };
};

// TODO 3: Define Request/Response Transformation Exchange
// Create an exchange that transforms requests and responses
// - Add request ID for tracking
// - Transform request variables
// - Transform response data
// - Add request timing metrics

interface RequestMetrics {
  requestId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

// TODO: Implement transformation exchange
export const transformationExchange: Exchange = ({ forward }) => {
  const activeRequests = new Map<string, RequestMetrics>();
  
  return (ops$) => {
    return pipe(
      ops$,
      map((operation) => {
        // TODO: Add request ID and start timing
        const requestId = generateRequestId();
        const startTime = performance.now();
        
        activeRequests.set(requestId, {
          requestId,
          startTime,
        });
        
        // TODO: Transform operation (add request ID, modify variables)
        return makeOperation(operation.kind, operation, {
          ...operation.context,
          requestId,
          meta: {
            ...operation.context.meta,
            startTime,
          },
        });
      }),
      forward,
      tap((result) => {
        // TODO: Add response timing and transformation
        const requestId = result.operation.context.requestId;
        if (requestId && activeRequests.has(requestId)) {
          const metrics = activeRequests.get(requestId)!;
          metrics.endTime = performance.now();
          metrics.duration = metrics.endTime - metrics.startTime;
          
          // TODO: Log metrics or send to analytics
          console.log('Request metrics:', metrics);
          
          activeRequests.delete(requestId);
        }
      })
    );
  };
};

// TODO 4: Define Error Handling Exchange
// Create an exchange that provides comprehensive error handling
// - Categorize different types of errors
// - Add error reporting/logging
// - Transform errors for UI consumption
// - Handle network errors vs GraphQL errors

interface ErrorCategory {
  type: 'network' | 'graphql' | 'timeout' | 'unknown';
  message: string;
  retryable: boolean;
}

// TODO: Implement error handling exchange
export const errorHandlingExchange: Exchange = ({ forward }) => (ops$) => {
  return pipe(
    ops$,
    forward,
    map((result) => {
      if (result.error) {
        // TODO: Categorize and enhance errors
        const enhancedError = enhanceError(result.error);
        
        // TODO: Log error for monitoring
        logError(result.operation, enhancedError);
        
        return {
          ...result,
          error: enhancedError,
        };
      }
      
      return result;
    })
  );
};

// TODO 5: Helper Functions
// Implement utility functions used by the exchanges

function getAuthToken(): string | null {
  // TODO: Implement secure token retrieval
  return localStorage.getItem('auth_token');
}

function setAuthToken(token: string): void {
  // TODO: Implement secure token storage
  localStorage.setItem('auth_token', token);
}

function refreshAuthToken(): Promise<string> {
  // TODO: Implement token refresh logic
  return Promise.resolve('new_token');
}

function generateRequestId(): string {
  // TODO: Generate unique request ID
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function enhanceError(error: any): any {
  // TODO: Enhance error with additional context
  return error;
}

function logError(operation: Operation, error: any): void {
  // TODO: Log error for monitoring/analytics
  console.error('GraphQL Error:', {
    operation: operation.query,
    variables: operation.variables,
    error,
  });
}

// TODO 6: URQL Client Configuration
// Set up URQL client with custom exchanges in the correct order

export const createUrqlClient = (options: {
  url: string;
  enableAuth?: boolean;
  enableRetry?: boolean;
  retryConfig?: Partial<RetryConfig>;
}) => {
  const exchanges = [cacheExchange];
  
  // TODO: Add custom exchanges in the correct order
  // Note: Order matters! Authentication should come before retry,
  // retry should come before error handling, etc.
  
  if (options.enableAuth) {
    // TODO: Add auth exchange
  }
  
  if (options.enableRetry) {
    // TODO: Add retry exchange with config
  }
  
  // TODO: Add transformation and error handling exchanges
  
  // Fetch exchange should always be last
  exchanges.push(fetchExchange);
  
  return createClient({
    url: options.url,
    exchanges,
  });
};

// TODO 7: React Components
// Create components that demonstrate the custom exchanges in action

interface User {
  id: string;
  name: string;
  email: string;
}

const GET_USERS_QUERY = `
  query GetUsers($limit: Int) {
    users(limit: $limit) {
      id
      name
      email
    }
  }
`;

const CREATE_USER_MUTATION = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
    }
  }
`;

// TODO: Implement UsersList component that demonstrates the exchanges
export const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // TODO: Use useQuery with error handling
  // This should demonstrate the custom exchanges working:
  // - Authentication headers added
  // - Retry logic for failures
  // - Request/response transformation
  // - Enhanced error handling
  
  const loadUsers = useCallback(async () => {
    // TODO: Implement query logic
  }, []);
  
  return (
    <div>
      <h3>Users List (Custom Exchanges Demo)</h3>
      <button onClick={loadUsers} disabled={loading}>
        Load Users
      </button>
      
      {loading && <div>Loading users...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      
      <div>
        {users.map(user => (
          <div key={user.id} style={{ border: '1px solid #ccc', padding: '8px', margin: '4px' }}>
            <strong>{user.name}</strong> ({user.email})
          </div>
        ))}
      </div>
    </div>
  );
};

// TODO: Implement AuthTest component to test authentication exchange
export const AuthTest: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  const handleLogin = useCallback(() => {
    // TODO: Implement mock login that sets token
    const mockToken = `token_${Date.now()}`;
    setAuthToken(mockToken);
    setToken(mockToken);
    setIsAuthenticated(true);
  }, []);
  
  const handleLogout = useCallback(() => {
    // TODO: Implement logout that clears token
    localStorage.removeItem('auth_token');
    setToken(null);
    setIsAuthenticated(false);
  }, []);
  
  return (
    <div>
      <h3>Authentication Test</h3>
      <div>Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      {token && <div>Token: {token.substring(0, 20)}...</div>}
      
      <div style={{ marginTop: '16px' }}>
        <button onClick={handleLogin} disabled={isAuthenticated}>
          Login
        </button>
        <button onClick={handleLogout} disabled={!isAuthenticated} style={{ marginLeft: '8px' }}>
          Logout
        </button>
      </div>
    </div>
  );
};

// TODO 8: Main Exercise Component
// Combine all components and demonstrate the exchanges working together

export const UrqlExchangesExercise: React.FC = () => {
  // TODO: Create URQL client with custom exchanges
  const client = createUrqlClient({
    url: 'https://api.example.com/graphql',
    enableAuth: true,
    enableRetry: true,
    retryConfig: {
      maxRetries: 2,
      baseDelay: 500,
    },
  });
  
  return (
    <Provider value={client}>
      <div style={{ padding: '20px' }}>
        <h2>URQL Custom Exchanges Exercise</h2>
        
        <div style={{ marginBottom: '24px' }}>
          <AuthTest />
        </div>
        
        <div>
          <UsersList />
        </div>
        
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f5f5f5' }}>
          <h4>Exchange Features Demonstrated:</h4>
          <ul>
            <li>🔐 Authentication exchange (JWT token handling)</li>
            <li>🔄 Retry exchange (exponential backoff)</li>
            <li>📊 Request/Response transformation (metrics)</li>
            <li>⚠️ Enhanced error handling</li>
            <li>🔧 Configurable exchange pipeline</li>
          </ul>
        </div>
      </div>
    </Provider>
  );
};

export default UrqlExchangesExercise;