# Apollo Client React Hooks Integration

Master useQuery, useMutation, useSubscription hooks with proper TypeScript integration for building reactive GraphQL applications.

## Learning Objectives

- Implement useQuery with loading and error states
- Handle mutations with optimistic updates
- Set up real-time subscriptions
- Integrate with React Suspense and Error Boundaries
- Build custom hooks for enhanced functionality
- Create reusable patterns for GraphQL operations

## Prerequisites

- Completion of Apollo Client Setup exercise
- React Hooks fundamentals (useState, useEffect, useCallback)
- TypeScript generics and advanced types
- Understanding of GraphQL operations (queries, mutations, subscriptions)

## Overview

Apollo's React integration provides powerful hooks that make GraphQL operations feel native to React:

- **useQuery**: Declarative data fetching with caching
- **useMutation**: Imperative operations with optimistic updates
- **useSubscription**: Real-time data updates
- **useLazyQuery**: On-demand query execution
- **useApolloClient**: Direct cache access and imperative operations

## Key Concepts

### Apollo React Hook Patterns

1. **Declarative Queries**: useQuery runs automatically on component mount
2. **Imperative Mutations**: useMutation returns function to execute
3. **Reactive Subscriptions**: useSubscription maintains connection
4. **Cache Integration**: All hooks work with normalized cache
5. **Error Boundaries**: Hooks integrate with React error handling

### TypeScript Integration

```typescript
const { data, loading, error } = useQuery<QueryType, VariablesType>(
  QUERY_DOCUMENT,
  { variables: { id: '1' } }
);
```

### Optimistic Updates

Provide immediate UI feedback:
```typescript
const [mutate] = useMutation(MUTATION, {
  optimisticResponse: { ... },
  update: (cache, { data }) => { ... }
});
```

## Exercise Tasks

### Task 1: TypeScript Definitions (TODO 1-2)

Define comprehensive types for:
- GraphQL schema entities (User, Post, Comment)
- Query/mutation variables interfaces  
- Response type interfaces
- Operation result types

**Type Safety Goals:**
- Every GraphQL operation fully typed
- Compile-time validation of variables
- IntelliSense support in IDE
- Runtime type checking where needed

### Task 2: Enhanced useQuery Hook (TODO 3)

Build `useUsersQuery` with features:
- Loading states with meaningful messages
- Error handling with user-friendly messages
- Pagination with `fetchMore`
- Search functionality
- Real-time updates with polling
- Network status monitoring

**Implementation Pattern:**
```typescript
export function useUsersQuery(variables?: GetUsersQueryVariables) {
  const { data, loading, error, fetchMore, refetch, networkStatus } = useQuery(
    GET_USERS, 
    { variables, /* configuration */ }
  );
  
  return {
    users: data?.users || [],
    loading,
    error,
    // Enhanced functionality
    loadMore: () => fetchMore({ /* pagination logic */ }),
    search: (term: string) => refetch({ search: term }),
    hasUsers: (data?.users.length || 0) > 0
  };
}
```

### Task 3: Mutation Hooks with Optimistic Updates (TODO 4)

Implement mutation hooks for:
- **Creating posts**: `useCreatePost` with optimistic UI updates
- **Liking posts**: `useLikePost` with immediate feedback
- **Cache updates**: Automatic cache synchronization

**Optimistic Update Strategy:**
1. Provide immediate optimistic response
2. Update UI instantly
3. Update cache with expected result
4. Handle server response and conflicts
5. Revert on error with user notification

### Task 4: Subscription Hooks (TODO 5)

Build real-time subscription hooks:
- **Post likes**: `usePostLikedSubscription` for live like counts
- **New comments**: `useNewCommentSubscription` for real-time discussions
- **User status**: `useUserStatusSubscription` for online presence

**Subscription Management:**
- Automatic connection management
- Reconnection on network issues
- Cache updates from subscription data
- Error handling and fallbacks

### Task 5: Lazy Query Hooks (TODO 6)

Create on-demand query execution:
- Search functionality with `useSearchUsers`
- Conditional data loading
- Manual query triggering
- Results state management

### Task 6: Higher-Order Components (TODO 7)

Build reusable UI patterns:
- `WithLoading`: Universal loading state handler
- Error boundaries for GraphQL operations
- Suspense integration components
- Loading and error fallback components

### Task 7: Example Components (TODO 8)

Implement practical examples:
- **UsersList**: Paginated user listing with search
- **UserCard**: Individual user display with real-time status
- **CreatePostForm**: Post creation with optimistic updates
- **PostDetails**: Detailed post view with live interactions

### Task 8: Suspense Integration (TODO 9)

Implement React Suspense patterns:
- Suspense-enabled queries
- Loading boundaries
- Error boundaries
- Progressive loading strategies

## Implementation Guidelines

### Query Hook Patterns

#### Basic Query Hook
```typescript
function useBasicData(id: string) {
  return useQuery(GET_DATA, { 
    variables: { id },
    fetchPolicy: 'cache-first'
  });
}
```

#### Enhanced Query Hook
```typescript
function useEnhancedData(id: string) {
  const result = useQuery(GET_DATA, { variables: { id } });
  
  return {
    ...result,
    // Add computed properties
    isEmpty: !result.loading && !result.data,
    hasError: Boolean(result.error),
    // Add helper methods
    retry: () => result.refetch(),
    refresh: () => result.refetch({ fetchPolicy: 'network-only' })
  };
}
```

### Mutation Hook Patterns

#### Basic Mutation
```typescript
function useCreateItem() {
  return useMutation(CREATE_ITEM, {
    onCompleted: (data) => console.log('Created:', data),
    onError: (error) => console.error('Error:', error)
  });
}
```

#### Optimistic Mutation
```typescript
function useOptimisticMutation() {
  return useMutation(LIKE_POST, {
    optimisticResponse: (variables) => ({
      likePost: { id: variables.postId, likes: -1 }
    }),
    update: (cache, { data }) => {
      // Update cache immediately
    }
  });
}
```

### Subscription Hook Patterns

```typescript
function useRealtimeData(id: string) {
  const { data } = useSubscription(DATA_SUBSCRIPTION, {
    variables: { id },
    onSubscriptionData: ({ subscriptionData, client }) => {
      // Handle incoming data
      // Update cache if needed
    }
  });
  
  return data;
}
```

## Error Handling Strategies

### Query Error Handling
```typescript
function useQueryWithErrorHandling() {
  const { data, loading, error } = useQuery(QUERY, {
    errorPolicy: 'all', // Return partial data with errors
    onError: (error) => {
      // Log error, show notification, etc.
    }
  });
  
  return {
    data,
    loading,
    error,
    hasPartialData: Boolean(data && error)
  };
}
```

### Mutation Error Handling
```typescript
function useMutationWithErrorHandling() {
  const [mutate, { loading, error }] = useMutation(MUTATION, {
    onError: (error) => {
      // Handle specific error types
      if (error.graphQLErrors.some(e => e.extensions?.code === 'VALIDATION_ERROR')) {
        // Show validation errors to user
      }
    }
  });
  
  return { mutate, loading, error };
}
```

## Performance Considerations

### Query Optimization
- Use `fetchPolicy` appropriately for different data types
- Implement proper pagination with `fetchMore`
- Enable query deduplication
- Use `notifyOnNetworkStatusChange` judiciously

### Mutation Optimization  
- Batch related mutations when possible
- Use optimistic updates for better UX
- Update cache efficiently to avoid refetches
- Handle concurrent mutations properly

### Subscription Optimization
- Limit subscription scope to needed data
- Implement proper cleanup on unmount
- Handle connection failures gracefully
- Use subscription batching when available

## Testing Strategies

### Mocking Apollo Hooks
```typescript
import { MockedProvider } from '@apollo/client/testing';

const mocks = [{
  request: { query: GET_USERS },
  result: { data: { users: [] } }
}];

render(
  <MockedProvider mocks={mocks}>
    <Component />
  </MockedProvider>
);
```

### Testing Custom Hooks
```typescript
import { renderHook } from '@testing-library/react-hooks';

const { result } = renderHook(
  () => useUsersQuery(),
  { wrapper: MockedProvider }
);
```

## Success Criteria

✅ **Type Safety**: All hooks properly typed with generics  
✅ **Query Hooks**: Enhanced useQuery with additional functionality  
✅ **Mutation Hooks**: Optimistic updates working correctly  
✅ **Subscription Hooks**: Real-time updates functioning  
✅ **Error Handling**: Comprehensive error management  
✅ **Performance**: Optimized for production use  
✅ **Reusability**: Custom hooks promote code reuse  
✅ **Testing**: All hooks unit tested  
✅ **Documentation**: Clear examples and usage patterns

## Advanced Patterns

### Custom Hook Composition
```typescript
function usePostOperations(postId: string) {
  const post = usePostQuery(postId);
  const [like] = useLikePost();
  const [comment] = useAddComment();
  
  return {
    ...post,
    like: () => like({ variables: { postId } }),
    comment: (content: string) => comment({ variables: { postId, content } })
  };
}
```

### Conditional Queries
```typescript
function useConditionalQuery(condition: boolean) {
  return useQuery(QUERY, {
    skip: !condition,
    fetchPolicy: condition ? 'cache-and-network' : 'cache-only'
  });
}
```

### Dependent Queries
```typescript
function useDependentQueries(userId?: string) {
  const user = useQuery(GET_USER, { 
    variables: { id: userId },
    skip: !userId 
  });
  
  const posts = useQuery(GET_USER_POSTS, {
    variables: { userId },
    skip: !user.data
  });
  
  return { user, posts };
}
```

## Common Pitfalls

1. **Missing Loading States**: Always handle loading properly
2. **Ignoring Errors**: Implement comprehensive error handling  
3. **Cache Inconsistency**: Update cache correctly after mutations
4. **Memory Leaks**: Clean up subscriptions on unmount
5. **Over-fetching**: Use appropriate fetch policies
6. **Type Safety**: Don't skip TypeScript definitions

## Next Steps

After mastering Apollo React hooks:
- Learn advanced cache management techniques
- Implement complex real-time features
- Explore performance optimization strategies
- Build production-ready GraphQL applications