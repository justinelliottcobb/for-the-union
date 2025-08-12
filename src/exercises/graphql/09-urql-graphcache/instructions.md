# URQL Graphcache Configuration

Configure URQL's Graphcache for normalized caching and automatic cache updates, bringing Apollo-like caching capabilities to URQL.

## Learning Objectives

- Configure Graphcache for normalized caching
- Implement cache updates and invalidation  
- Handle optimistic updates with Graphcache
- Design resolvers for computed fields
- Build efficient cache persistence strategies
- Master advanced caching patterns

## Prerequisites

- Completion of URQL Basics exercise
- Understanding of normalized vs document caching
- GraphQL schema design knowledge
- Advanced TypeScript concepts (generics, conditional types)

## Overview

Graphcache is URQL's normalized caching solution that provides Apollo Client-like functionality:

- **Normalized Storage**: Entities stored by ID with relationships
- **Automatic Updates**: Cache updates propagate to all references
- **Client-side Resolvers**: Compute derived data locally
- **Optimistic Updates**: Immediate UI feedback with rollback
- **Cache Persistence**: Maintain cache across page reloads

### Document Cache vs Graphcache

| Feature | Document Cache | Graphcache |
|---------|----------------|------------|
| Storage | Query + Variables | Normalized by ID |
| Updates | Manual cache invalidation | Automatic propagation |
| Bundle Size | ~25kb | ~35kb |
| Complexity | Low | Medium |
| Performance | Good for simple apps | Better for complex apps |

## Exercise Tasks

### Task 1: Schema Type Definitions (TODO 1)

Define comprehensive GraphQL entity types:
- **Core Entities**: User, Post, Comment with proper relationships
- **Computed Fields**: fullName, excerpt, isLikedByViewer
- **Counts**: likesCount, commentsCount, followersCount
- **Type Safety**: Full TypeScript integration with __typename

### Task 2: Cache Configuration Types (TODO 2)

Create configuration interfaces for:
- **GraphcacheConfig**: Main configuration structure
- **KeyGenerator**: Functions for entity key generation
- **Resolver**: Client-side field resolvers
- **UpdateResolver**: Mutation cache update handlers

### Task 3: Cache Keys Configuration (TODO 3)

Define entity identification:
```typescript
const cacheKeys = {
  User: (data: any) => data.id,
  Post: (data: any) => data.id,
  // Custom key generation for complex scenarios
};
```

### Task 4: Client-side Resolvers (TODO 4)

Implement resolvers for computed fields:

**User Resolvers:**
- `fullName`: Combine firstName + lastName
- `postsCount`: Count posts from cache
- `followersCount/followingCount`: Social metrics

**Post Resolvers:**
- `excerpt`: Generate from content (first 150 chars)
- `isLikedByViewer`: Check if current user liked post
- `likesCount/commentsCount`: Aggregate counts

**Query Resolvers:**
- Pagination handling for posts/users queries
- Entity resolution from cache by ID

### Task 5: Cache Update Handlers (TODO 5)

Implement mutation update logic:

**Create Operations:**
- `createUser`: Add to users lists, update counts
- `createPost`: Update author posts, category counts
- `createComment`: Update post comments, reply threads

**Social Operations:**
- `likePost`: Update likes count, isLikedByViewer
- `followUser`: Update follower/following counts

**Update Operations:**
- `updateUserProfile`: Handle computed field recalculation

### Task 6: Optimistic Updates (TODO 6)

Define immediate UI feedback:
```typescript
const optimisticUpdates = {
  likePost: (args, cache, info) => ({
    __typename: 'LikePostPayload',
    like: {
      __typename: 'Like',
      id: `temp-${Date.now()}`,
      // ... optimistic response
    }
  })
};
```

### Task 7: Graphcache Client Setup (TODO 7)

Configure URQL client with Graphcache:
- **Exchange Order**: Graphcache before fetch exchange
- **Schema Integration**: Type information for better inference
- **Storage Adapter**: localStorage persistence
- **Error Handling**: Graceful fallback for storage issues

### Task 8: Enhanced Query Hooks (TODO 8)

Build hooks leveraging normalized cache:
- **usePostQuery**: Efficient post loading with relationships
- **Automatic Updates**: Benefits from cache normalization
- **Cache-first Strategy**: Optimal performance with Graphcache

### Task 9: Mutation Hooks (TODO 9)

Implement optimistic mutation patterns:
- **useLikePost**: Like/unlike with immediate feedback
- **Error Handling**: Automatic rollback on failures
- **Cache Integration**: Leverages Graphcache update handlers

### Task 10: Example Components (TODO 10-12)

Build practical examples:
- **PostCard**: Shows real-time updates from cache changes
- **GraphcacheDevTools**: Cache inspection utilities
- **Complete App**: Demonstrates all Graphcache features

## Implementation Guidelines

### Graphcache Configuration Structure

```typescript
const graphcacheExchange = cacheExchange({
  keys: { /* Entity key generators */ },
  resolvers: { /* Client-side field resolvers */ },
  updates: { /* Mutation cache update handlers */ },
  optimistic: { /* Optimistic update configurations */ },
  schema: { /* GraphQL schema information */ },
  storage: { /* Cache persistence adapter */ }
});
```

### Cache Update Patterns

#### Adding to Lists
```typescript
updates: {
  Mutation: {
    createPost: (result, args, cache, info) => {
      // Update Query.posts field
      cache.updateQuery(
        { query: GET_POSTS },
        (data) => ({
          ...data,
          posts: {
            ...data.posts,
            edges: [newEdge, ...data.posts.edges]
          }
        })
      );
    }
  }
}
```

#### Updating Counts
```typescript
cache.writeFragment(
  {
    id: 'User:123',
    fragment: gql`fragment _ on User { postsCount }`
  },
  { postsCount: currentCount + 1 }
);
```

### Client-side Resolvers

```typescript
resolvers: {
  User: {
    fullName: (parent, args, cache, info) => {
      const profile = cache.resolve(parent, 'profile');
      const firstName = cache.resolve(profile, 'firstName');
      const lastName = cache.resolve(profile, 'lastName');
      return firstName && lastName ? `${firstName} ${lastName}` : null;
    }
  }
}
```

### Optimistic Updates

```typescript
optimistic: {
  likePost: (args, cache, info) => ({
    __typename: 'LikePostPayload',
    like: {
      __typename: 'Like',
      id: `optimistic-${args.postId}-${Date.now()}`,
      user: cache.resolve('Query', 'viewer'), // Current user
      post: { __typename: 'Post', id: args.postId }
    }
  })
}
```

## Advanced Patterns

### Schema-Aware Resolvers

With schema information, Graphcache can:
- Validate resolver implementations
- Provide better TypeScript inference
- Optimize cache operations
- Handle interfaces and unions correctly

### Cache Persistence Strategies

```typescript
storage: {
  readData: () => {
    try {
      const stored = localStorage.getItem('graphcache');
      return stored ? JSON.parse(stored) : undefined;
    } catch {
      return undefined;
    }
  },
  writeData: (data) => {
    try {
      localStorage.setItem('graphcache', JSON.stringify(data));
    } catch (error) {
      console.warn('Cache persistence failed:', error);
    }
  }
}
```

### Partial Cache Updates

```typescript
// Update specific fields without full refetch
cache.writeFragment(
  { 
    id: 'Post:123',
    fragment: gql`fragment _ on Post { likesCount isLikedByViewer }`
  },
  { 
    likesCount: post.likesCount + 1,
    isLikedByViewer: true
  }
);
```

## Performance Considerations

### Bundle Size Trade-offs
- Basic URQL: ~25kb
- URQL + Graphcache: ~35kb
- Still smaller than Apollo Client (~75kb)
- Better caching performance for complex apps

### Cache Efficiency
- Normalized storage reduces data duplication
- Automatic update propagation eliminates manual invalidation
- Client-side resolvers reduce network requests
- Optimistic updates improve perceived performance

### Memory Management
- Graphcache implements garbage collection
- Unused entities are automatically cleaned up
- Configure cache size limits if needed
- Monitor memory usage in complex applications

## Testing Strategies

### Mocking Graphcache

```typescript
import { cacheExchange } from '@urql/exchange-graphcache';

const testCache = cacheExchange({
  keys: cacheKeys,
  resolvers: testResolvers,
  // Simplified config for testing
});

const testClient = createClient({
  url: 'test://graphql',
  exchanges: [testCache, mockExchange]
});
```

### Cache State Testing

```typescript
test('updates cache after mutation', async () => {
  const { result } = renderHook(() => useLikePost(), {
    wrapper: ({ children }) => (
      <Provider value={testClient}>{children}</Provider>
    )
  });

  await act(() => result.current.likePost('post-1'));
  
  // Verify cache state changes
  expect(/* cache state */).toEqual(/* expected state */);
});
```

## Success Criteria

✅ **Normalized Caching**: Entities properly stored and linked by ID  
✅ **Automatic Updates**: Mutations update all related cache entries  
✅ **Client Resolvers**: Computed fields work correctly  
✅ **Optimistic Updates**: Immediate UI feedback with error rollback  
✅ **Cache Persistence**: Data survives page reloads  
✅ **Performance**: Faster than document cache for complex scenarios  
✅ **Type Safety**: Full TypeScript integration maintained  
✅ **Testing**: Cache behavior properly unit tested

## Common Pitfalls

1. **Exchange Order**: Graphcache must come before fetchExchange
2. **Key Generation**: Ensure all entities have stable, unique keys
3. **Update Logic**: Missing cache updates cause stale data
4. **Optimistic Errors**: Not handling rollback on mutation failures
5. **Storage Failures**: Not gracefully handling localStorage errors
6. **Resolver Dependencies**: Circular dependencies in client resolvers

## Next Steps

After mastering Graphcache:
- Learn custom URQL exchanges for advanced middleware
- Explore real-time subscriptions with cache updates
- Compare performance with Apollo Client in complex scenarios
- Implement advanced patterns like cursor-based pagination
- Build production-ready apps with sophisticated caching strategies

This exercise demonstrates how Graphcache brings Apollo-like normalized caching to URQL while maintaining its lightweight philosophy and excellent developer experience.