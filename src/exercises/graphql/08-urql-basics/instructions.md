# URQL Basic Setup and Querying

Learn URQL fundamentals with TypeScript integration and basic caching strategies for building GraphQL applications.

## Learning Objectives

- Set up URQL client with TypeScript
- Use URQL hooks for queries and mutations  
- Understand URQL's document caching strategy
- Implement error handling with URQL patterns
- Build custom hooks for enhanced functionality
- Create practical GraphQL components

## Prerequisites

- Completion of GraphQL fundamentals exercises
- React Hooks knowledge (useState, useEffect, useCallback)
- TypeScript fundamentals and generics
- Basic GraphQL concepts (queries, mutations, variables)

## Overview

URQL is a lightweight GraphQL client that focuses on simplicity and extensibility. Unlike Apollo Client's normalized cache, URQL uses document caching by default, which is simpler but different in behavior.

### Key URQL Concepts

1. **Document Caching**: Caches by query + variables combination
2. **Request Policies**: Control when to fetch from network vs cache
3. **Exchanges**: Composable middleware system (like Apollo Links)
4. **Hooks Integration**: React hooks that feel natural
5. **TypeScript Support**: Excellent TypeScript integration

### URQL vs Apollo Client

| Feature | URQL | Apollo Client |
|---------|------|---------------|
| Cache | Document cache (default) | Normalized cache |
| Bundle Size | ~25kb | ~75kb |
| Learning Curve | Lower | Higher |
| Flexibility | High (exchanges) | High (links) |
| DevTools | Browser extension | Integrated |

## Exercise Tasks

### Task 1: TypeScript Definitions (TODO 1-2)

Define comprehensive interfaces for:
- **GraphQL Schema Types**: User, UserProfile, Post, Comment
- **Query Variables**: GetUsersQueryVariables, GetPostsQueryVariables
- **Mutation Variables**: CreateUserMutationVariables, CreatePostMutationVariables
- **Response Types**: Proper pagination and error handling interfaces

**Key Requirements:**
- Full type safety for all GraphQL operations
- Proper generic constraints for query/mutation hooks
- Error handling types for validation and network errors

### Task 2: GraphQL Documents (TODO 3)

Write GraphQL queries and mutations:
- **Users Query**: Paginated with search and filtering
- **Posts Query**: With author relations and status filtering
- **User Query**: Single user with full profile
- **Create User/Post Mutations**: With validation error handling

**Best Practices:**
- Use consistent naming conventions
- Include all required fields for UI components
- Design for pagination and real-time updates
- Handle relationship data efficiently

### Task 3: URQL Client Setup (TODO 4)

Configure URQL client with:
- **Basic Setup**: URL, request policies, exchanges
- **Error Handling**: Network and GraphQL error processing
- **Development Tools**: DevTools integration
- **Authentication**: Header management for auth tokens

**Configuration Options:**
```typescript
const client = createClient({
  url: 'http://localhost:4000/graphql',
  requestPolicy: 'cache-first', // or 'cache-and-network', 'network-only'
  exchanges: [cacheExchange, fetchExchange],
});
```

### Task 4: Custom Query Hooks (TODO 5)

Build enhanced `useUsersQuery` hook with:
- **Pagination**: Manual pagination handling (URQL doesn't have built-in fetchMore)
- **Search**: Dynamic search with debouncing
- **Loading States**: Comprehensive loading state management
- **Error Handling**: User-friendly error messages
- **Refresh Logic**: Force network requests when needed

**Hook Interface:**
```typescript
interface UseUsersQueryResult {
  users: User[];
  loading: boolean;
  error?: CombinedError;
  hasNextPage: boolean;
  loadMore: () => void;
  refresh: () => void;
  search: (term: string) => void;
}
```

### Task 5: Mutation Hooks (TODO 6)

Implement `useCreateUser` mutation hook:
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: GraphQL errors and validation errors
- **Cache Updates**: Manual cache invalidation strategies
- **Loading States**: Proper loading and completion states

**Mutation Pattern:**
```typescript
const [result, executeMutation] = useMutation(CREATE_USER);

const createUser = async (variables) => {
  const result = await executeMutation(variables);
  // Handle result, errors, cache updates
};
```

### Task 6: Error Handling (TODO 7)

Create comprehensive error utilities:
- **Error Parsing**: Distinguish network vs GraphQL errors
- **Error Types**: Authentication, validation, server errors
- **User Messages**: Convert technical errors to user-friendly messages
- **Error Recovery**: Retry strategies and fallback handling

### Task 7: Provider Setup (TODO 8)

Build `UrqlProvider` component:
- **Client Management**: Create or accept client instance
- **Environment Configuration**: Development vs production settings
- **Error Boundaries**: Global error handling for GraphQL operations

### Task 8: Example Components (TODO 9-10)

Implement practical components:
- **UsersList**: Paginated, searchable user list
- **UserCard**: Individual user display component
- **CreateUserForm**: Form with validation and error handling
- **Main App**: Demonstrate all features working together

## Implementation Guidelines

### URQL Request Policies

1. **cache-first** (default): Check cache first, fetch if not found
2. **cache-and-network**: Return cached data, but also fetch fresh data
3. **network-only**: Always fetch from network, update cache
4. **cache-only**: Only return data from cache

### Pagination with URQL

Unlike Apollo's `fetchMore`, URQL pagination is manual:

```typescript
const [variables, setVariables] = useState({ first: 20 });
const [result] = useQuery({ query: GET_USERS, variables });

const loadMore = () => {
  setVariables(prev => ({
    ...prev,
    first: prev.first + 20,
    after: pageInfo.endCursor
  }));
};
```

### Error Handling Patterns

```typescript
const parseUrqlError = (error: CombinedError) => ({
  networkError: error.networkError,
  graphQLErrors: error.graphQLErrors,
  isAuthError: error.graphQLErrors?.some(e => 
    e.extensions?.code === 'UNAUTHENTICATED'
  ),
  errorMessages: error.graphQLErrors?.map(e => e.message) || []
});
```

### Cache Management

URQL's document cache is simpler but less flexible:
- Cache key = query + variables
- No automatic cache updates after mutations
- Manual cache invalidation required
- Consider Graphcache for normalized caching

## Testing Strategies

### Mock URQL Client

```typescript
import { Client, Provider } from 'urql';
import { never, fromValue } from 'wonka';

const mockClient = {
  executeQuery: jest.fn(() => fromValue({ data: mockData })),
  executeMutation: jest.fn(() => fromValue({ data: mockResult })),
} as any;

const wrapper = ({ children }) => (
  <Provider value={mockClient}>{children}</Provider>
);
```

### Integration Testing

```typescript
import { render, waitFor } from '@testing-library/react';

test('displays users from query', async () => {
  render(<UsersList />, { wrapper: UrqlProvider });
  
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

## Performance Considerations

### Bundle Size
- URQL is lighter than Apollo (~25kb vs ~75kb)
- Tree-shaking friendly
- Optional exchanges for advanced features

### Request Optimization
- Use appropriate request policies
- Implement query deduplication
- Consider request batching for multiple queries
- Optimize GraphQL queries (avoid over-fetching)

### Cache Efficiency
- Understand document cache behavior
- Plan cache invalidation strategies
- Consider upgrade to Graphcache for complex apps
- Implement proper loading states to avoid UI flicker

## Success Criteria

✅ **Client Setup**: URQL client properly configured with TypeScript  
✅ **Query Hooks**: Enhanced hooks with pagination and search  
✅ **Mutation Hooks**: Create operations with error handling  
✅ **Error Management**: Comprehensive error parsing and display  
✅ **Components**: Working examples demonstrating all features  
✅ **Type Safety**: Full TypeScript integration without any escapes  
✅ **Performance**: Optimal request policies and loading states  
✅ **Testing**: Unit tests for hooks and components

## Next Steps

After mastering URQL basics:
- Learn Graphcache for normalized caching
- Implement custom exchanges for middleware
- Explore advanced patterns like subscriptions
- Compare URQL performance with Apollo Client
- Build production-ready GraphQL applications

## Common Pitfalls

1. **Document Cache Confusion**: Understanding the difference from normalized cache
2. **Missing Pagination**: URQL requires manual pagination handling
3. **Cache Invalidation**: No automatic cache updates after mutations
4. **Request Policies**: Choosing wrong policy for your use case
5. **Error Handling**: Not properly parsing URQL error structures
6. **TypeScript Setup**: Missing proper generic types for operations

This exercise provides a solid foundation in URQL fundamentals while highlighting the key differences from Apollo Client, preparing you for more advanced URQL features.