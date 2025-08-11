// URQL Custom Exchanges and Middleware - Solution
// Complete implementation of custom URQL exchanges for authentication, retry logic, and advanced patterns

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
  CombinedError,
} from 'urql';
import { pipe, tap, map, mergeMap, fromPromise, delay, onEnd } from 'wonka';

// Authentication Exchange Implementation
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
}

export const authExchange: Exchange = ({ forward }) => (ops$) => {
  return pipe(
    ops$,
    map((operation) => {
      const token = getAuthToken();
      if (token) {
        return makeOperation(operation.kind, operation, {
          ...operation.context,
          fetchOptions: {
            ...operation.context.fetchOptions,
            headers: {
              ...operation.context.fetchOptions?.headers,
              Authorization: `Bearer ${token}`,
            },
          },
        });
      }
      return operation;
    }),
    forward,
    tap(async (result) => {
      // Handle 401 errors and token refresh
      if (result.error?.networkError?.status === 401) {
        try {
          const newToken = await refreshAuthToken();
          setAuthToken(newToken);
          
          // Could trigger a re-execution here if needed
          console.log('Token refreshed successfully');
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Clear invalid tokens
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
        }
      }
    })
  );
};

// Retry Exchange Implementation
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryIf: (error: any, operation: Operation) => boolean;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryIf: (error, operation) => {
    // Don't retry mutations by default to avoid side effects
    if (operation.kind === 'mutation') return false;
    
    // Retry on network errors or specific GraphQL errors
    if (error?.networkError) {
      const status = error.networkError.status;
      // Retry on 5xx server errors and some 4xx client errors
      return status >= 500 || status === 408 || status === 429;
    }
    
    // Retry on timeout or connection errors
    if (error?.message?.includes('timeout') || 
        error?.message?.includes('network') ||
        error?.message?.includes('fetch')) {
      return true;
    }
    
    return false;
  },
};

export const retryExchange = (config: Partial<RetryConfig> = {}): Exchange => {
  const finalConfig = { ...defaultRetryConfig, ...config };
  
  return ({ forward }) => (ops$) => {
    return pipe(
      ops$,
      mergeMap((operation) => {
        let attempts = 0;
        
        const executeWithRetry = (op: Operation): any => {
          return pipe(
            forward([op]),
            mergeMap((result) => {
              if (result.error && 
                  finalConfig.retryIf(result.error, op) && 
                  attempts < finalConfig.maxRetries) {
                
                // Calculate exponential backoff with jitter
                const baseDelay = finalConfig.baseDelay * Math.pow(2, attempts);
                const jitter = Math.random() * 0.3 * baseDelay; // 30% jitter
                const backoffDelay = Math.min(baseDelay + jitter, finalConfig.maxDelay);
                
                attempts++;
                console.log(`Retrying operation (attempt ${attempts}/${finalConfig.maxRetries}) after ${Math.round(backoffDelay)}ms`);
                
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

// Request/Response Transformation Exchange Implementation
interface RequestMetrics {
  requestId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  operationType: string;
  operationName?: string;
}

export const transformationExchange: Exchange = ({ forward }) => {
  const activeRequests = new Map<string, RequestMetrics>();
  
  return (ops$) => {
    return pipe(
      ops$,
      map((operation) => {
        const requestId = generateRequestId();
        const startTime = performance.now();
        
        const metrics: RequestMetrics = {
          requestId,
          startTime,
          operationType: operation.kind,
          operationName: operation.query.definitions[0]?.name?.value,
        };
        
        activeRequests.set(requestId, metrics);
        
        // Transform operation with additional context
        return makeOperation(operation.kind, operation, {
          ...operation.context,
          requestId,
          meta: {
            ...operation.context.meta,
            startTime,
            requestId,
          },
        });
      }),
      forward,
      tap((result) => {
        const requestId = result.operation.context.requestId;
        if (requestId && activeRequests.has(requestId)) {
          const metrics = activeRequests.get(requestId)!;
          metrics.endTime = performance.now();
          metrics.duration = metrics.endTime - metrics.startTime;
          
          // Log metrics for monitoring
          console.log('📊 Request Metrics:', {
            ...metrics,
            success: !result.error,
            hasData: !!result.data,
          });
          
          // Send to analytics service in production
          if (typeof window !== 'undefined' && (window as any).analytics) {
            (window as any).analytics.track('GraphQL Request', metrics);
          }
          
          activeRequests.delete(requestId);
        }
      })
    );
  };
};

// Error Handling Exchange Implementation
interface ErrorCategory {
  type: 'network' | 'graphql' | 'timeout' | 'authorization' | 'unknown';
  message: string;
  retryable: boolean;
  code?: string;
}

export const errorHandlingExchange: Exchange = ({ forward }) => (ops$) => {
  return pipe(
    ops$,
    forward,
    map((result) => {
      if (result.error) {
        const category = categorizeError(result.error);
        const enhancedError = {
          ...result.error,
          category,
          timestamp: new Date().toISOString(),
          operation: {
            type: result.operation.kind,
            name: result.operation.query.definitions[0]?.name?.value,
          },
          requestId: result.operation.context.requestId,
        };
        
        // Log error for monitoring
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

// Helper Functions Implementation
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('auth_token', token);
  } catch (error) {
    console.warn('Failed to store auth token:', error);
  }
}

async function refreshAuthToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    // Mock token refresh - replace with actual API call
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    
    // Store new tokens
    localStorage.setItem('auth_token', data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem('refresh_token', data.refreshToken);
    }
    
    return data.accessToken;
  } catch (error) {
    // Fallback: generate mock token for demo
    const mockToken = `refreshed_token_${Date.now()}`;
    return mockToken;
  }
}

function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 9);
  return `req_${timestamp}_${randomStr}`;
}

function categorizeError(error: CombinedError): ErrorCategory {
  // Network errors
  if (error.networkError) {
    const status = error.networkError.status;
    
    if (status === 401 || status === 403) {
      return {
        type: 'authorization',
        message: 'Authentication required or forbidden',
        retryable: false,
        code: `HTTP_${status}`,
      };
    }
    
    if (status >= 500) {
      return {
        type: 'network',
        message: 'Server error occurred',
        retryable: true,
        code: `HTTP_${status}`,
      };
    }
    
    if (status === 408 || status === 504) {
      return {
        type: 'timeout',
        message: 'Request timed out',
        retryable: true,
        code: `HTTP_${status}`,
      };
    }
    
    return {
      type: 'network',
      message: `Network error: ${error.networkError.message}`,
      retryable: false,
      code: `HTTP_${status}`,
    };
  }
  
  // GraphQL errors
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    const graphqlError = error.graphQLErrors[0];
    const extensions = graphqlError.extensions;
    
    if (extensions?.code === 'UNAUTHENTICATED') {
      return {
        type: 'authorization',
        message: 'Authentication required',
        retryable: false,
        code: 'UNAUTHENTICATED',
      };
    }
    
    return {
      type: 'graphql',
      message: graphqlError.message,
      retryable: false,
      code: extensions?.code as string,
    };
  }
  
  // Unknown errors
  return {
    type: 'unknown',
    message: error.message || 'An unknown error occurred',
    retryable: false,
  };
}

function logError(operation: Operation, error: any): void {
  const errorLog = {
    timestamp: new Date().toISOString(),
    operation: {
      type: operation.kind,
      name: operation.query.definitions[0]?.name?.value || 'Anonymous',
      variables: operation.variables,
    },
    error: {
      message: error.message,
      category: error.category,
      networkError: error.networkError,
      graphQLErrors: error.graphQLErrors,
    },
    requestId: error.requestId,
  };
  
  console.error('🚨 GraphQL Error:', errorLog);
  
  // Send to error reporting service in production
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, {
      tags: {
        operation_type: operation.kind,
        operation_name: operation.query.definitions[0]?.name?.value,
      },
      extra: errorLog,
    });
  }
}

// URQL Client Configuration
export const createUrqlClient = (options: {
  url: string;
  enableAuth?: boolean;
  enableRetry?: boolean;
  retryConfig?: Partial<RetryConfig>;
  enableMetrics?: boolean;
  enableErrorEnhancement?: boolean;
}) => {
  const exchanges = [cacheExchange];
  
  // Add custom exchanges in the correct order
  if (options.enableAuth) {
    exchanges.push(authExchange);
  }
  
  if (options.enableRetry) {
    exchanges.push(retryExchange(options.retryConfig));
  }
  
  if (options.enableMetrics) {
    exchanges.push(transformationExchange);
  }
  
  if (options.enableErrorEnhancement) {
    exchanges.push(errorHandlingExchange);
  }
  
  // Fetch exchange should always be last
  exchanges.push(fetchExchange);
  
  return createClient({
    url: options.url,
    exchanges,
  });
};

// React Components
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

const GET_USERS_QUERY = `
  query GetUsers($limit: Int) {
    users(limit: $limit) {
      id
      name
      email
      avatar
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

// Enhanced Error Display Component
const ErrorDisplay: React.FC<{ error: any }> = ({ error }) => {
  const category = error.category;
  
  const getErrorIcon = () => {
    switch (category?.type) {
      case 'network': return '🌐';
      case 'authorization': return '🔒';
      case 'timeout': return '⏱️';
      case 'graphql': return '📝';
      default: return '⚠️';
    }
  };
  
  const getErrorColor = () => {
    switch (category?.type) {
      case 'authorization': return '#e74c3c';
      case 'network': return '#f39c12';
      case 'timeout': return '#9b59b6';
      default: return '#e67e22';
    }
  };
  
  return (
    <div style={{ 
      border: `2px solid ${getErrorColor()}`, 
      borderRadius: '8px',
      padding: '16px',
      margin: '8px 0',
      backgroundColor: `${getErrorColor()}15`
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        {getErrorIcon()} {category?.type.toUpperCase() || 'ERROR'}
        {category?.code && ` (${category.code})`}
      </div>
      <div style={{ marginBottom: '8px' }}>
        {category?.message || error.message}
      </div>
      {category?.retryable && (
        <div style={{ fontSize: '12px', color: '#666' }}>
          💡 This error is retryable - the exchange will automatically retry
        </div>
      )}
      {error.requestId && (
        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
          Request ID: {error.requestId}
        </div>
      )}
    </div>
  );
};

// Users List Component with Exchange Demo
export const UsersList: React.FC = () => {
  const [limit, setLimit] = useState(5);
  const [result, reexecuteQuery] = useQuery({
    query: GET_USERS_QUERY,
    variables: { limit },
    requestPolicy: 'network-only', // Force network requests to demo exchanges
  });
  
  // Mock users for demo when API not available
  const mockUsers: User[] = [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', avatar: '👩‍💼' },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com', avatar: '👨‍💻' },
    { id: '3', name: 'Carol Williams', email: 'carol@example.com', avatar: '👩‍🎨' },
  ];
  
  const users = result.data?.users || mockUsers;
  
  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h3>Users List (Custom Exchanges Demo)</h3>
        <div style={{ marginBottom: '8px' }}>
          <label>
            Limit:{' '}
            <select 
              value={limit} 
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{ marginLeft: '8px', padding: '4px' }}
            >
              <option value={3}>3 users</option>
              <option value={5}>5 users</option>
              <option value={10}>10 users</option>
            </select>
          </label>
        </div>
        <button 
          onClick={() => reexecuteQuery({ requestPolicy: 'network-only' })}
          disabled={result.fetching}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: result.fetching ? 'not-allowed' : 'pointer',
            opacity: result.fetching ? 0.6 : 1,
          }}
        >
          {result.fetching ? 'Loading...' : 'Reload Users'}
        </button>
      </div>
      
      {result.fetching && (
        <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
          🔄 Loading users... (watch console for exchange logs)
        </div>
      )}
      
      {result.error && <ErrorDisplay error={result.error} />}
      
      <div style={{ display: 'grid', gap: '8px' }}>
        {users.map(user => (
          <div 
            key={user.id} 
            style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '24px' }}>{user.avatar || '👤'}</div>
            <div>
              <div style={{ fontWeight: 'bold' }}>{user.name}</div>
              <div style={{ color: '#666' }}>{user.email}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Authentication Test Component
export const AuthTest: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  React.useEffect(() => {
    const currentToken = getAuthToken();
    if (currentToken) {
      setToken(currentToken);
      setIsAuthenticated(true);
    }
  }, []);
  
  const handleLogin = useCallback(() => {
    const mockToken = `demo_token_${Date.now()}`;
    setAuthToken(mockToken);
    setToken(mockToken);
    setIsAuthenticated(true);
    
    console.log('🔐 Authentication: Logged in with token:', mockToken);
  }, []);
  
  const handleLogout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setIsAuthenticated(false);
    
    console.log('🔐 Authentication: Logged out');
  }, []);
  
  const handleRefreshToken = useCallback(async () => {
    try {
      const newToken = await refreshAuthToken();
      setToken(newToken);
      console.log('🔄 Token refreshed successfully');
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
    }
  }, []);
  
  return (
    <div style={{ 
      border: '2px solid #3498db', 
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#3498db15',
    }}>
      <h3>🔐 Authentication Test</h3>
      <div style={{ marginBottom: '12px' }}>
        <strong>Status:</strong>{' '}
        <span style={{ 
          color: isAuthenticated ? '#27ae60' : '#e74c3c',
          fontWeight: 'bold',
        }}>
          {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
        </span>
      </div>
      
      {token && (
        <div style={{ marginBottom: '12px', fontSize: '12px' }}>
          <strong>Token:</strong> {token.substring(0, 20)}...
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button 
          onClick={handleLogin} 
          disabled={isAuthenticated}
          style={{
            padding: '8px 16px',
            backgroundColor: isAuthenticated ? '#95a5a6' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isAuthenticated ? 'not-allowed' : 'pointer',
          }}
        >
          Login
        </button>
        
        <button 
          onClick={handleLogout} 
          disabled={!isAuthenticated}
          style={{
            padding: '8px 16px',
            backgroundColor: !isAuthenticated ? '#95a5a6' : '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isAuthenticated ? 'not-allowed' : 'pointer',
          }}
        >
          Logout
        </button>
        
        <button 
          onClick={handleRefreshToken} 
          disabled={!isAuthenticated}
          style={{
            padding: '8px 16px',
            backgroundColor: !isAuthenticated ? '#95a5a6' : '#f39c12',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isAuthenticated ? 'not-allowed' : 'pointer',
          }}
        >
          Refresh Token
        </button>
      </div>
      
      <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
        💡 The auth exchange will automatically add authorization headers to requests
        when authenticated
      </div>
    </div>
  );
};

// Metrics Display Component
const MetricsDisplay: React.FC = () => {
  const [metrics, setMetrics] = useState<RequestMetrics[]>([]);
  
  // In a real app, you'd subscribe to metrics updates
  // For demo, we'll show example metrics
  React.useEffect(() => {
    const exampleMetrics: RequestMetrics[] = [
      {
        requestId: 'req_1234_abc',
        startTime: Date.now() - 1000,
        endTime: Date.now() - 800,
        duration: 200,
        operationType: 'query',
        operationName: 'GetUsers',
      },
      {
        requestId: 'req_5678_def',
        startTime: Date.now() - 500,
        endTime: Date.now() - 200,
        duration: 300,
        operationType: 'mutation',
        operationName: 'CreateUser',
      },
    ];
    
    setMetrics(exampleMetrics);
  }, []);
  
  return (
    <div style={{ 
      border: '2px solid #9b59b6', 
      borderRadius: '8px',
      padding: '16px',
      marginTop: '16px',
      backgroundColor: '#9b59b615',
    }}>
      <h3>📊 Request Metrics</h3>
      <div style={{ fontSize: '12px', marginBottom: '12px', color: '#666' }}>
        Check browser console for real-time metrics from the transformation exchange
      </div>
      
      {metrics.length === 0 ? (
        <div style={{ color: '#666' }}>No metrics available</div>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {metrics.map(metric => (
            <div 
              key={metric.requestId}
              style={{
                padding: '8px',
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '12px',
              }}
            >
              <div><strong>{metric.operationType.toUpperCase()}</strong>: {metric.operationName}</div>
              <div>Duration: {metric.duration}ms</div>
              <div>ID: {metric.requestId}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Exercise Component
export const UrqlExchangesExercise: React.FC = () => {
  const client = createUrqlClient({
    url: 'https://api.example.com/graphql',
    enableAuth: true,
    enableRetry: true,
    enableMetrics: true,
    enableErrorEnhancement: true,
    retryConfig: {
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 5000,
    },
  });
  
  return (
    <Provider value={client}>
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2>🚀 URQL Custom Exchanges Exercise</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          This demo showcases custom URQL exchanges working together in a pipeline.
          Open browser console to see exchange logs in action.
        </p>
        
        <AuthTest />
        <UsersList />
        <MetricsDisplay />
        
        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
        }}>
          <h4>🔧 Exchange Features Demonstrated:</h4>
          <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
            <div>🔐 <strong>Authentication Exchange:</strong> JWT token handling and automatic refresh</div>
            <div>🔄 <strong>Retry Exchange:</strong> Exponential backoff with configurable retry logic</div>
            <div>📊 <strong>Transformation Exchange:</strong> Request tracking, timing, and metrics</div>
            <div>⚠️ <strong>Error Enhancement:</strong> Categorized errors with user-friendly messages</div>
            <div>🔧 <strong>Configurable Pipeline:</strong> Conditional exchange inclusion</div>
          </div>
          
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
            <strong>Try these actions:</strong>
            <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
              <li>Toggle authentication to see header changes</li>
              <li>Reload users to trigger exchanges</li>
              <li>Check console for detailed exchange logs</li>
              <li>Observe enhanced error messages</li>
            </ul>
          </div>
        </div>
      </div>
    </Provider>
  );
};

export default UrqlExchangesExercise;