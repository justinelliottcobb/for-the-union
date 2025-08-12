# URQL Custom Exchanges and Middleware

Build custom URQL exchanges for authentication, retry logic, and advanced request/response transformation patterns.

## Learning Objectives

- Create custom URQL exchanges using the Wonka stream library
- Implement authentication exchange with JWT token handling
- Build retry exchange with exponential backoff strategies
- Design request/response transformation middleware
- Understand URQL's exchange pipeline architecture
- Handle complex error scenarios with custom exchanges
- Integrate multiple exchanges in the correct order

## Prerequisites

- Completion of URQL basics and Graphcache exercises
- Understanding of streams and reactive programming concepts
- Knowledge of authentication patterns (JWT tokens)
- Familiarity with retry and circuit breaker patterns
- Experience with TypeScript generics and advanced types

## Overview

URQL's exchange system provides a powerful middleware architecture for customizing GraphQL request/response handling. Exchanges are composable stream transformers that use the Wonka library for reactive stream processing.

### Key Exchange Concepts

1. **Exchange Function**: `({ forward, client, dispatchDebug }) => (ops$) => results$`
2. **Operation Stream**: Stream of GraphQL operations (queries, mutations, subscriptions)
3. **Result Stream**: Stream of operation results with data/error/extensions
4. **Forward Function**: Passes operations to the next exchange in the pipeline
5. **Wonka Operators**: Functional operators for stream transformation

### Exchange Pipeline Order

The order of exchanges matters significantly:

```typescript
[
  debugExchange,     // Development debugging
  dedupExchange,     // Deduplication (built-in)
  cacheExchange,     // Caching layer
  authExchange,      // Authentication (custom)
  retryExchange,     // Retry logic (custom)  
  errorExchange,     // Error handling (custom)
  fetchExchange,     // Network requests (always last)
]
```

### Common Exchange Patterns

| Pattern | Purpose | Implementation |
|---------|---------|----------------|
| Authentication | Add/refresh tokens | Transform operation context |
| Retry | Exponential backoff | Merge operation streams |
| Transformation | Request/response modification | Map operations and results |
| Error Handling | Enhanced error processing | Tap results for side effects |
| Metrics | Request timing/tracking | Tap operations and results |

## Exercise Tasks

### Task 1: Authentication Exchange (TODO 1)

Create an exchange that handles JWT token authentication:

```typescript
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
    tap((result) => {
      // Handle 401 errors and token refresh
      if (result.error?.networkError?.status === 401) {
        handleTokenRefresh();
      }
    })
  );
};
```

**Requirements:**
- Add Authorization header to all authenticated requests
- Handle 401 responses by triggering token refresh
- Store and retrieve tokens securely
- Support both access and refresh token patterns

### Task 2: Retry Exchange (TODO 2)

Implement exponential backoff retry logic:

```typescript
export const retryExchange = (config: RetryConfig = {}): Exchange => {
  return ({ forward }) => (ops$) => {
    return pipe(
      ops$,
      mergeMap((operation) => {
        let attempts = 0;
        
        const executeWithRetry = (op: Operation) => {
          return pipe(
            forward([op]),
            mergeMap((result) => {
              if (shouldRetry(result.error) && attempts < config.maxRetries) {
                const delay = calculateBackoff(attempts, config);
                attempts++;
                
                return pipe(
                  fromPromise(new Promise(resolve => setTimeout(resolve, delay))),
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
```

**Requirements:**
- Implement exponential backoff with jitter
- Configure maximum retry attempts and delays
- Selective retry based on error types
- Avoid retrying mutations by default
- Handle timeout and network errors appropriately

### Task 3: Request/Response Transformation Exchange (TODO 3)

Create an exchange for request/response transformation:

```typescript
export const transformationExchange: Exchange = ({ forward }) => {
  return (ops$) => {
    return pipe(
      ops$,
      map((operation) => {
        // Add request ID and timing
        const requestId = generateRequestId();
        const startTime = performance.now();
        
        return makeOperation(operation.kind, operation, {
          ...operation.context,
          requestId,
          meta: { ...operation.context.meta, startTime },
        });
      }),
      forward,
      tap((result) => {
        // Calculate and log request duration
        const duration = performance.now() - result.operation.context.meta.startTime;
        logRequestMetrics(result.operation.context.requestId, duration);
      })
    );
  };
};
```

**Requirements:**
- Add unique request IDs for tracking
- Measure and log request timing
- Transform request variables if needed
- Add request correlation for debugging
- Support request/response logging

### Task 4: Error Handling Exchange (TODO 4)

Implement comprehensive error handling:

```typescript
export const errorHandlingExchange: Exchange = ({ forward }) => (ops$) => {
  return pipe(
    ops$,
    forward,
    map((result) => {
      if (result.error) {
        const enhancedError = {
          ...result.error,
          category: categorizeError(result.error),
          timestamp: new Date().toISOString(),
          operation: result.operation.kind,
        };
        
        // Log for monitoring
        logError(result.operation, enhancedError);
        
        return { ...result, error: enhancedError };
      }
      
      return result;
    })
  );
};
```

**Requirements:**
- Categorize errors (network, GraphQL, timeout, etc.)
- Add error context and metadata
- Integration with error reporting services
- Transform errors for consistent UI handling
- Differentiate between retryable and non-retryable errors

### Task 5: Helper Functions (TODO 5)

Implement utility functions used by exchanges:

```typescript
function getAuthToken(): string | null {
  // Secure token retrieval from storage
  return localStorage.getItem('auth_token');
}

function generateRequestId(): string {
  // Generate unique, traceable request ID
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function categorizeError(error: CombinedError): ErrorCategory {
  // Categorize error types for handling
  if (error.networkError) {
    return { type: 'network', retryable: true };
  }
  // ... other categorizations
}
```

**Requirements:**
- Secure token storage and retrieval
- Unique request ID generation
- Error categorization logic
- Request metrics calculation
- Logging and monitoring integration

### Task 6: Client Configuration (TODO 6)

Configure URQL client with custom exchanges:

```typescript
export const createUrqlClient = (options: ClientOptions) => {
  const exchanges = [
    cacheExchange,
    ...(options.enableAuth ? [authExchange] : []),
    ...(options.enableRetry ? [retryExchange(options.retryConfig)] : []),
    transformationExchange,
    errorHandlingExchange,
    fetchExchange, // Always last
  ];
  
  return createClient({
    url: options.url,
    exchanges,
  });
};
```

**Requirements:**
- Correct exchange ordering
- Conditional exchange inclusion
- Configuration options for each exchange
- Type-safe client creation
- Development vs production configurations

### Task 7: React Components (TODO 7)

Create components demonstrating exchange functionality:

```typescript
export const UsersList: React.FC = () => {
  const [result] = useQuery({ query: GET_USERS_QUERY });
  
  // Component will benefit from:
  // - Automatic authentication headers
  // - Retry on failures
  // - Enhanced error messages
  // - Request timing logs
  
  return (
    <div>
      {result.fetching && <div>Loading...</div>}
      {result.error && <ErrorDisplay error={result.error} />}
      {result.data?.users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};
```

**Requirements:**
- Demonstrate authentication flow
- Show retry behavior on failures
- Display enhanced error information
- Integration with all custom exchanges
- Request tracking and metrics display

### Task 8: Integration Demo (TODO 8)

Create a comprehensive demo component:

```typescript
export const UrqlExchangesExercise: React.FC = () => {
  const client = createUrqlClient({
    url: 'https://api.example.com/graphql',
    enableAuth: true,
    enableRetry: true,
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
    },
  });
  
  return (
    <Provider value={client}>
      <AuthTest />
      <UsersList />
      <MetricsDisplay />
    </Provider>
  );
};
```

**Requirements:**
- Complete exchange pipeline demonstration
- Authentication state management
- Error handling showcase
- Performance metrics display
- Configuration options demo

## Testing Strategies

### Unit Testing Exchanges

```typescript
import { pipe, fromArray, toPromise } from 'wonka';

describe('authExchange', () => {
  it('adds authorization header when token exists', async () => {
    const mockForward = jest.fn(() => pipe(fromArray([mockResult])));
    const exchange = authExchange({ forward: mockForward });
    
    // Test the exchange behavior
    const result = await pipe(
      fromArray([mockOperation]),
      exchange,
      toPromise
    );
    
    expect(mockForward).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          context: expect.objectContaining({
            fetchOptions: expect.objectContaining({
              headers: expect.objectContaining({
                Authorization: 'Bearer token',
              }),
            }),
          }),
        }),
      ])
    );
  });
});
```

### Integration Testing

```typescript
describe('Exchange Pipeline Integration', () => {
  it('processes operations through all exchanges in correct order', async () => {
    const client = createUrqlClient({
      url: 'https://api.test.com/graphql',
      enableAuth: true,
      enableRetry: true,
    });
    
    // Test end-to-end flow
    const result = await client.query(GET_USERS_QUERY).toPromise();
    
    expect(result.data).toBeDefined();
    // Verify exchange side effects occurred
  });
});
```

## Advanced Patterns

### Conditional Exchanges

```typescript
const conditionalExchange = (condition: boolean, exchange: Exchange) => 
  condition ? exchange : ({ forward }) => forward;

const exchanges = [
  cacheExchange,
  conditionalExchange(isDevelopment, debugExchange),
  conditionalExchange(requiresAuth, authExchange),
  fetchExchange,
];
```

### Exchange Composition

```typescript
const composedExchange = (...exchanges: Exchange[]): Exchange => 
  ({ forward, client, dispatchDebug }) => {
    const composedForward = exchanges.reduceRight(
      (acc, exchange) => exchange({ forward: acc, client, dispatchDebug }),
      forward
    );
    return composedForward;
  };
```

### Dynamic Exchange Configuration

```typescript
const configurableRetryExchange = () => {
  let config = defaultRetryConfig;
  
  const exchange: Exchange = ({ forward }) => (ops$) => {
    return pipe(ops$, retryLogic(config), forward);
  };
  
  exchange.configure = (newConfig: Partial<RetryConfig>) => {
    config = { ...config, ...newConfig };
  };
  
  return exchange;
};
```

## Performance Considerations

1. **Stream Performance**: Wonka streams are lazy and efficient, but complex transformations can impact performance
2. **Memory Management**: Be careful with stateful exchanges that accumulate data
3. **Error Handling**: Excessive retries can degrade performance
4. **Request Deduplication**: Built-in deduplication helps, but custom logic should avoid duplication
5. **Development vs Production**: Use different exchange configurations for different environments

## Common Pitfalls

1. **Exchange Order**: Wrong order can break functionality (auth before retry, cache before transform)
2. **Stream Subscription**: Improper stream handling can lead to memory leaks
3. **Error Propagation**: Not properly forwarding errors through the pipeline
4. **Side Effects**: Exchanges should be pure functions; use tap() for side effects
5. **Context Mutation**: Always create new contexts rather than mutating existing ones

## Success Criteria

- [ ] Authentication exchange adds JWT tokens and handles refresh
- [ ] Retry exchange implements exponential backoff correctly
- [ ] Transformation exchange adds request tracking and metrics
- [ ] Error handling exchange categorizes and enhances errors
- [ ] Client configuration supports conditional exchange inclusion
- [ ] React components demonstrate all exchange features
- [ ] Integration demo shows complete pipeline functionality
- [ ] Code follows URQL and Wonka best practices
- [ ] TypeScript types are comprehensive and accurate
- [ ] Error handling is robust and user-friendly

## Estimated Time

50 minutes

## Difficulty Level

4/5 - Advanced patterns requiring understanding of streams, middleware, and reactive programming concepts