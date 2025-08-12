# Manual GraphQL Integration with TanStack Query

Integrate GraphQL with React Query for flexible caching, synchronization, and state management patterns.

## Learning Objectives

- Integrate GraphQL operations with TanStack Query (React Query)
- Design structured query keys for GraphQL operations
- Implement smart caching strategies for GraphQL data
- Handle GraphQL errors with React Query patterns
- Build reusable hooks for GraphQL operations
- Configure background refetching and stale-while-revalidate
- Implement cache invalidation for related data updates
- Create type-safe GraphQL request functions

## Prerequisites

- Completion of GraphQL fundamentals exercises
- Understanding of React Query concepts (queries, mutations, cache)
- Knowledge of GraphQL schema design and relationships
- Familiarity with TypeScript generics and advanced types
- Experience with React hooks and state management

## Overview

While specialized GraphQL clients like Apollo and URQL provide integrated caching solutions, React Query offers a different approach that can be more flexible for complex applications. This exercise demonstrates manual GraphQL integration with React Query for maximum control over caching behavior.

### React Query vs GraphQL Clients

| Feature | React Query + GraphQL | Apollo/URQL |
|---------|----------------------|-------------|
| Cache Strategy | Query-based (document cache) | Normalized cache |
| Bundle Size | Smaller (~13kb + GraphQL) | Larger (25-75kb) |
| Flexibility | High (manual control) | Medium (configured) |
| Learning Curve | Moderate | Higher |
| Non-GraphQL Data | Native support | Requires additional setup |
| Background Sync | Excellent | Good |

### Key Concepts

1. **Query Keys**: Structured identifiers for cache entries
2. **Query Functions**: Async functions that fetch data
3. **Stale Time**: How long data is considered fresh
4. **Garbage Collection**: When unused data is removed
5. **Invalidation**: Marking cache entries as stale
6. **Optimistic Updates**: Immediate UI updates before server confirmation

## Exercise Tasks

### Task 1: GraphQL Request Function (TODO 1)

Create a robust GraphQL request function:

```typescript
export async function graphqlRequest<T = any>(
  endpoint: string,
  request: GraphQLRequest,
  headers?: Record<string, string>
): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result: GraphQLResponse<T> = await response.json();
  
  if (result.errors?.length) {
    const error = new Error(result.errors[0].message);
    (error as any).graphQLErrors = result.errors;
    throw error;
  }
  
  return result.data!;
}
```

**Requirements:**
- Handle HTTP errors (network failures, server errors)
- Parse and throw GraphQL errors appropriately
- Support custom headers for authentication
- Return properly typed data
- Provide detailed error information

### Task 2: Query Key Factory (TODO 2)

Design a structured query key system:

```typescript
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: UserFilters) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: PostFilters) => [...queryKeys.posts.lists(), filters] as const,
    byUser: (userId: string) => [...queryKeys.posts.all, 'byUser', userId] as const,
  },
} as const;
```

**Requirements:**
- Hierarchical structure for precise invalidation
- Type-safe query key generation
- Support for filtered and parameterized queries
- Consistent naming conventions
- Relationship-aware key structure

### Task 3: TypeScript Interfaces (TODO 3)

Define comprehensive type definitions:

```typescript
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

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: GraphQLError[];
  extensions?: Record<string, any>;
}

export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, any>;
}
```

**Requirements:**
- Match GraphQL schema exactly
- Include optional fields appropriately
- Support nested object types
- Define input types for mutations
- Provide error type definitions

### Task 4: GraphQL Operations (TODO 4)

Define GraphQL queries and mutations as constants:

```typescript
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

const CREATE_USER_MUTATION = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      username
      email
      fullName
      createdAt
      postsCount
    }
  }
`;
```

**Requirements:**
- Consistent query structure and naming
- Proper variable definitions
- Selective field querying
- Mutation return types for cache updates
- Fragment reuse for common fields

### Task 5: Custom Query Hooks (TODO 5)

Create reusable hooks for GraphQL operations:

```typescript
export function useUsers(options: UseUsersOptions = {}) {
  const { limit = 10, offset = 0, search, enabled = true } = options;
  
  return useQuery({
    queryKey: queryKeys.users.list({ limit, offset, search }),
    queryFn: () => graphqlRequest('https://api.example.com/graphql', {
      query: GET_USERS_QUERY,
      variables: { limit, offset, search },
    }),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
```

**Requirements:**
- Flexible options with sensible defaults
- Proper query key generation
- Configurable cache behavior
- Type-safe return values
- Conditional querying support

### Task 6: Mutation Hooks (TODO 6)

Implement mutation hooks with cache updates:

```typescript
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateUserInput) => 
      graphqlRequest('https://api.example.com/graphql', {
        query: CREATE_USER_MUTATION,
        variables: { input },
      }),
    onSuccess: (data) => {
      // Invalidate users list queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.users.lists() 
      });
      
      // Set user detail cache
      queryClient.setQueryData(
        queryKeys.users.detail(data.createUser.id),
        { user: data.createUser }
      );
    },
  });
}
```

**Requirements:**
- Immediate cache invalidation for lists
- Optimistic cache updates for created entities
- Related data updates (e.g., user post counts)
- Error handling and rollback capabilities
- Type-safe mutation variables and results

### Task 7: Error Handling Component (TODO 7)

Create a comprehensive error display component:

```typescript
export const GraphQLErrorDisplay: React.FC<{
  error: Error | null;
  title?: string;
  showDetails?: boolean;
  onRetry?: () => void;
}> = ({ error, title, showDetails, onRetry }) => {
  if (!error) return null;
  
  const isNetworkError = error.message.includes('HTTP');
  const hasGraphQLErrors = (error as any).graphQLErrors;
  
  return (
    <div className="error-display">
      <div className="error-title">
        {isNetworkError ? '🌐' : '📝'} {title}
      </div>
      <div className="error-message">{error.message}</div>
      
      {showDetails && hasGraphQLErrors && (
        <details className="error-details">
          <summary>GraphQL Errors</summary>
          <ul>
            {(error as any).graphQLErrors.map((err: any, i: number) => (
              <li key={i}>{err.message}</li>
            ))}
          </ul>
        </details>
      )}
      
      {onRetry && (
        <button onClick={onRetry} className="retry-button">
          Retry
        </button>
      )}
    </div>
  );
};
```

**Requirements:**
- Distinguish between network and GraphQL errors
- Show detailed error information when requested
- Provide retry functionality
- Visual error categorization
- Accessible error display

### Task 8: React Components (TODO 8)

Build components demonstrating the integration:

```typescript
export const UsersList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(10);
  
  const { data, isLoading, error, refetch } = useUsers({ 
    search: search || undefined,
    limit,
  });
  
  return (
    <div>
      <SearchInput value={search} onChange={setSearch} />
      <LimitSelector value={limit} onChange={setLimit} />
      
      {isLoading && <LoadingSpinner />}
      <GraphQLErrorDisplay error={error} onRetry={refetch} />
      
      {data?.users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};
```

**Requirements:**
- Interactive filtering and pagination
- Loading and error state handling
- Retry functionality
- Responsive design
- Performance optimization

### Task 9: Query Client Configuration (TODO 9)

Configure React Query with appropriate defaults:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry client errors
        if (error.message.includes('400') || error.message.includes('404')) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});
```

**Requirements:**
- Appropriate cache timing for GraphQL data
- Smart retry logic based on error types
- Performance-optimized defaults
- Development vs production configuration
- Error boundary integration

## Advanced Patterns

### Infinite Queries for Pagination

```typescript
export function useInfiniteUsers(search?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.users.list({ search }),
    queryFn: ({ pageParam = 0 }) => 
      graphqlRequest('https://api.example.com/graphql', {
        query: GET_USERS_QUERY,
        variables: { offset: pageParam, limit: 10, search },
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage.users.length === 10;
      return hasMore ? allPages.length * 10 : undefined;
    },
  });
}
```

### Dependent Queries

```typescript
export function useUserWithPosts(userId: string) {
  const userQuery = useUser(userId);
  const postsQuery = usePosts({
    authorId: userId,
    enabled: !!userQuery.data,
  });
  
  return {
    user: userQuery.data?.user,
    posts: postsQuery.data?.posts,
    isLoading: userQuery.isLoading || postsQuery.isLoading,
    error: userQuery.error || postsQuery.error,
  };
}
```

### Optimistic Updates

```typescript
export function useOptimisticCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPost,
    onMutate: async (newPost) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.lists() });
      
      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(queryKeys.posts.lists());
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.posts.lists(), (old: any) => ({
        posts: [{ ...newPost, id: 'temp-' + Date.now() }, ...(old?.posts || [])],
      }));
      
      return { previousPosts };
    },
    onError: (err, newPost, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(queryKeys.posts.lists(), context.previousPosts);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
    },
  });
}
```

## Testing Strategies

### Mocking GraphQL Requests

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('https://api.example.com/graphql', (req, res, ctx) => {
    const { query, variables } = req.body as any;
    
    if (query.includes('GetUsers')) {
      return res(ctx.json({
        data: {
          users: [
            { id: '1', username: 'test', email: 'test@example.com' }
          ]
        }
      }));
    }
    
    return res(ctx.json({ errors: [{ message: 'Unknown query' }] }));
  })
);
```

### Testing Custom Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('useUsers', () => {
  it('fetches users successfully', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    
    const { result } = renderHook(() => useUsers(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

## Performance Considerations

1. **Query Key Structure**: Design for efficient invalidation
2. **Stale Time Configuration**: Balance freshness with performance
3. **Selective Querying**: Only request needed fields
4. **Background Refetching**: Configure based on data sensitivity
5. **Cache Persistence**: Consider persisting cache between sessions

## Common Pitfalls

1. **Over-invalidation**: Invalidating too many queries on mutations
2. **Query Key Inconsistency**: Different key structures for same data
3. **Stale Time Misconfiguration**: Too aggressive or too conservative
4. **Error Handling**: Not distinguishing error types properly
5. **Type Safety**: Losing type safety in query functions

## Success Criteria

- [ ] GraphQL request function handles all error scenarios
- [ ] Query keys are structured and hierarchical
- [ ] Custom hooks provide flexible options
- [ ] Mutations update related cache entries appropriately
- [ ] Error handling distinguishes between error types
- [ ] Components demonstrate loading, error, and success states
- [ ] Cache invalidation is precise and efficient
- [ ] TypeScript integration is comprehensive
- [ ] Query client is configured optimally
- [ ] Background refetching works correctly

## Estimated Time

45 minutes

## Difficulty Level

4/5 - Requires understanding of React Query concepts, GraphQL integration patterns, and cache management strategies