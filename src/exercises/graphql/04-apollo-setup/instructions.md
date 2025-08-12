# Apollo Client Setup and Configuration

Configure Apollo Client with InMemoryCache, type policies, and advanced caching strategies for production-ready GraphQL applications.

## Learning Objectives

- Set up Apollo Client with optimal configuration
- Configure InMemoryCache with type policies
- Implement field policies for computed fields
- Set up development tools and debugging
- Create custom Apollo Links for middleware functionality
- Implement error boundaries and resilience patterns

## Prerequisites

- Completion of Basic GraphQL Queries and Error Handling exercises
- React and TypeScript fundamentals
- Understanding of caching concepts
- Familiarity with middleware patterns

## Overview

Apollo Client is a comprehensive GraphQL client that provides:

- **Intelligent Caching**: Normalized cache with automatic updates
- **React Integration**: Hooks-based API for React applications
- **Developer Experience**: Excellent tooling and debugging support
- **Extensibility**: Link system for custom functionality
- **Performance**: Request deduplication, pagination, optimistic updates

This exercise focuses on setting up a production-ready Apollo Client configuration with advanced features.

## Key Concepts

### Apollo Client Architecture

```
React Components
       ↓
Apollo React Hooks
       ↓
Apollo Client Core
       ↓
Link Chain (Auth, Error, HTTP)
       ↓
GraphQL Server
```

### InMemoryCache Normalization

Apollo normalizes objects using:
- `__typename` + `id` (or other key fields)
- Flat storage structure for efficient updates
- Automatic relationship management
- Custom merge strategies for fields

### Link System

Apollo Links provide middleware functionality:
- **HTTP Link**: Network communication
- **Auth Link**: Authentication headers
- **Error Link**: Error handling and reporting
- **Retry Link**: Automatic retry logic
- **Custom Links**: Application-specific logic

## Exercise Tasks

### Task 1: Type Policies Configuration (TODO 1)

Configure cache normalization with:
- Key field definitions for each type
- Field policies for computed fields
- Merge strategies for arrays and pagination
- Read functions for derived data

**Key Considerations:**
```typescript
const typePolicies = {
  User: {
    keyFields: ['id'],
    fields: {
      posts: {
        keyArgs: ['sortBy', 'filter'],
        merge: (existing, incoming, { args }) => {
          // Implement pagination merge logic
        }
      }
    }
  }
};
```

### Task 2: Custom Apollo Links (TODO 2)

Build middleware links for:
- **Authentication**: Token management and refresh
- **Error Handling**: Classification and user feedback  
- **Logging**: Request/response debugging (dev only)
- **Performance**: Monitoring and slow query detection

**Link Implementation Pattern:**
```typescript
const customLink = new ApolloLink((operation, forward) => {
  // Pre-request logic
  return forward(operation).map(result => {
    // Post-response logic
    return result;
  });
});
```

### Task 3: InMemoryCache Configuration (TODO 3)

Configure cache with:
- Type policies for normalization
- Possible types for unions/interfaces  
- Custom data ID generation
- Cache size and eviction policies

**Advanced Cache Features:**
- Result caching for performance
- Typename addition for normalization
- Custom object identification
- Cache persistence options

### Task 4: HTTP Link with Upload Support (TODO 4)

Set up HTTP communication with:
- File upload capabilities
- Custom headers and credentials
- Fetch options configuration
- Error response handling

### Task 5: Complete Apollo Client Creation (TODO 5)

Integrate all components:
- Link chain composition
- Cache configuration
- Default query options
- Development tool integration

**Client Configuration:**
```typescript
const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({ typePolicies }),
  defaultOptions: {
    watchQuery: { errorPolicy: 'all' },
    query: { fetchPolicy: 'cache-first' }
  }
});
```

### Task 6: Provider with Error Boundaries (TODO 6)

Create robust provider component:
- Error boundary for GraphQL errors
- Graceful error fallback UI
- Development-friendly error details
- Client creation and memoization

### Task 7: Cache Utilities (TODO 7)

Build helper functions for:
- Cache clearing and reset
- Manual cache updates
- Object eviction from cache
- Query prefetching

### Task 8: Development Tools (TODO 8)

Create debugging utilities:
- Cache content inspection
- Active query monitoring
- Network response mocking
- Performance analysis

### Task 9: Configuration Presets (TODO 9)

Define environment-specific configs:
- Development: Full logging and debugging
- Staging: Limited logging, performance monitoring
- Production: Minimal logging, error reporting

### Task 10: Example Implementation (TODO 10)

Build demonstration component showing:
- Provider setup and usage
- Cache configuration in action
- Error boundary behavior
- Development tools integration

## Implementation Guidelines

### Cache Performance Optimization

1. **Minimize Cache Size**: Only cache necessary data
2. **Efficient Merging**: Use proper merge strategies for lists
3. **Garbage Collection**: Regularly clean unused cache entries  
4. **Key Field Selection**: Choose stable, unique identifiers

### Link Chain Optimization

```typescript
// Optimal link order
const linkChain = from([
  errorLink,        // Handle errors first
  authLink,         // Add authentication
  retryLink,        // Retry failed requests  
  loggingLink,      // Log requests (dev only)
  httpLink          // Make network requests
]);
```

### Error Boundary Strategy

- **Granular Boundaries**: Protect specific components
- **Fallback Hierarchy**: Progressive degradation
- **Error Reporting**: Send errors to monitoring
- **User Feedback**: Clear error messages

## Testing Considerations

Your Apollo setup should be testable:

```typescript
// Test with MockedProvider
const mocks = [
  {
    request: { query: GET_USERS },
    result: { data: { users: [...] } }
  }
];

render(
  <MockedProvider mocks={mocks}>
    <App />
  </MockedProvider>
);
```

## Performance Best Practices

### Cache Configuration
- Use `cache-first` for stable data
- Use `cache-and-network` for frequently changing data
- Configure appropriate `fetchPolicy` defaults
- Implement cache size limits

### Network Optimization
- Enable request batching when possible
- Use persisted queries for production
- Implement query complexity analysis
- Configure appropriate timeouts

### Memory Management
- Clean up subscriptions properly
- Evict unused cache entries
- Monitor cache size growth
- Handle memory pressure gracefully

## Success Criteria

✅ **Apollo Client Setup**: Properly configured with all features  
✅ **Cache Configuration**: InMemoryCache with type policies working  
✅ **Link Chain**: Custom links functioning correctly  
✅ **Error Handling**: Error boundaries catching and displaying errors  
✅ **Development Tools**: Debugging utilities operational  
✅ **Performance**: Optimized configuration for production  
✅ **Testing**: MockedProvider integration working  
✅ **Type Safety**: Full TypeScript integration  
✅ **Documentation**: Clear examples and usage patterns

## Advanced Features

Consider implementing:

- **Persisted Queries**: Improve performance with query hashing
- **Schema Stitching**: Combine multiple GraphQL services
- **Local State**: Client-side state management with Apollo
- **Subscriptions**: Real-time updates configuration
- **Federation**: Microservice GraphQL architecture

## Common Issues and Solutions

1. **Cache Inconsistency**: 
   - Solution: Proper key field configuration and merge policies

2. **Memory Leaks**: 
   - Solution: Clean up subscriptions and unused cache entries

3. **Authentication Errors**:
   - Solution: Implement token refresh in auth link

4. **Network Failures**:
   - Solution: Configure retry link with appropriate strategies

5. **Development Performance**:
   - Solution: Disable expensive features in development

## Integration Patterns

### With React Suspense
```typescript
const client = new ApolloClient({
  // ... configuration
  defaultOptions: {
    watchQuery: { suspense: true }
  }
});
```

### With React Error Boundaries
```typescript
class GraphQLErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Handle GraphQL errors specifically
  }
}
```

### With State Management
Apollo can work alongside:
- Redux for application state
- Context for theme/UI state  
- Zustand for simple state needs
- React Query for non-GraphQL APIs

## Next Steps

After mastering Apollo Client setup:
- Learn React hooks integration (Exercise 5)
- Explore advanced caching strategies (Exercise 6)
- Implement real-time subscriptions
- Build production monitoring and analytics