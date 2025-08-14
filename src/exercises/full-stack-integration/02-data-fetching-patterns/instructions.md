# Modern Data Fetching Patterns

## Overview

In this exercise, you'll master modern data fetching strategies using TanStack Query (React Query) and implement sophisticated caching, background refetching, and state management patterns. This exercise focuses on patterns that Staff Frontend Engineers use to build performant, user-friendly data layers in production applications.

**Difficulty:** ⭐⭐⭐⭐ (75 minutes)

## Learning Objectives

By completing this exercise, you will:

- Implement TanStack Query for intelligent data fetching
- Design effective caching strategies and cache invalidation
- Handle optimistic updates and rollback mechanisms
- Create background refetching and stale-while-revalidate patterns
- Implement offline detection and queue management
- Build pagination and infinite query patterns

## Background

Modern applications require sophisticated data fetching that goes beyond simple HTTP requests. Users expect:
- Instant loading with cached data
- Background updates without UI disruption
- Optimistic updates for immediate feedback
- Offline functionality and sync recovery
- Efficient pagination for large datasets

TanStack Query provides a powerful foundation for these patterns, but requires careful architecture to leverage its full potential in enterprise applications.

## Requirements

### Core Components

1. **QueryProvider Setup**
   - Custom query client configuration
   - Error handling and retry policies
   - Cache persistence and hydration
   - Development tools integration

2. **CacheManager**
   - Intelligent cache invalidation strategies
   - Cache warming and preloading
   - Selective data updates
   - Memory optimization

3. **OfflineSync**
   - Offline detection and handling
   - Request queue management
   - Background synchronization
   - Conflict resolution

### Key Features

1. **Background Refetching**
   - Stale-while-revalidate patterns
   - Smart refetch triggers
   - Window focus and network recovery
   - Scheduled background updates

2. **Optimistic Updates**
   - Immediate UI updates
   - Rollback on failure
   - Conflict resolution
   - User feedback mechanisms

3. **Pagination Patterns**
   - Cursor-based pagination
   - Infinite scroll implementation
   - Cache-efficient page management
   - Loading state coordination

## Implementation Tasks

### Task 1: Advanced QueryClient Configuration

Create a production-ready QueryClient:

```typescript
interface QueryConfig {
  defaultStaleTime: number;
  defaultCacheTime: number;
  retryAttempts: number;
  retryDelay: (attemptIndex: number) => number;
  refetchOnWindowFocus: boolean;
  refetchOnReconnect: boolean;
}

function createQueryClient(config: QueryConfig): QueryClient {
  // Configure default options
  // Set up error handling
  // Configure retry logic
  // Set up cache persistence
}
```

### Task 2: Smart Caching Strategies

Implement intelligent cache management:

```typescript
class CacheManager {
  // Cache invalidation patterns
  invalidateByTags(tags: string[]): Promise<void>;
  invalidateByPattern(pattern: string): Promise<void>;
  
  // Cache warming
  warmCache(queries: QueryKey[]): Promise<void>;
  
  // Selective updates
  updateCacheData<T>(key: QueryKey, updater: (old: T) => T): void;
  
  // Memory optimization
  optimizeMemory(): void;
}
```

### Task 3: Optimistic Updates System

Create robust optimistic update patterns:

```typescript
interface OptimisticUpdate<TData, TVariable> {
  queryKey: QueryKey;
  optimisticData: (variables: TVariable, currentData: TData) => TData;
  rollbackData?: (variables: TVariable, currentData: TData) => TData;
  onError?: (error: Error, variables: TVariable, context: any) => void;
}

function useOptimisticMutation<TData, TVariable>(
  mutationFn: (variables: TVariable) => Promise<TData>,
  updates: OptimisticUpdate<TData, TVariable>[]
): UseMutationResult<TData, Error, TVariable>;
```

### Task 4: Offline Synchronization

Implement offline-first patterns:

```typescript
class OfflineManager {
  // Queue management
  queueRequest(request: QueuedRequest): void;
  processQueue(): Promise<void>;
  
  // Conflict resolution
  resolveConflicts(localData: any, serverData: any): any;
  
  // Sync status
  getSyncStatus(): SyncStatus;
  onSyncStatusChange(callback: (status: SyncStatus) => void): void;
}

interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  data: any;
  timestamp: number;
  retries: number;
}
```

### Task 5: Advanced Query Hooks

Create custom hooks for common patterns:

```typescript
// Infinite pagination
function useInfiniteData<T>(
  queryKey: QueryKey,
  fetcher: (params: { pageParam?: unknown }) => Promise<PaginatedResponse<T>>,
  options?: UseInfiniteQueryOptions
): UseInfiniteQueryResult<InfiniteData<PaginatedResponse<T>>>;

// Background sync
function useBackgroundSync<T>(
  queryKey: QueryKey,
  fetcher: QueryFunction<T>,
  syncInterval: number
): UseQueryResult<T>;

// Dependent queries
function useDependentQueries<T1, T2>(
  query1: QueryConfig<T1>,
  query2: (data: T1) => QueryConfig<T2>
): [UseQueryResult<T1>, UseQueryResult<T2>];
```

### Task 6: Real-time Updates

Implement real-time data synchronization:

```typescript
function useRealTimeQuery<T>(
  queryKey: QueryKey,
  fetcher: QueryFunction<T>,
  websocketUrl: string
): UseQueryResult<T> & {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
};
```

## Example Usage

Your implementation should support these usage patterns:

```typescript
// Basic query with smart caching
const { data: user, isLoading, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => apiClient.getUser(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// Optimistic mutation
const updateUserMutation = useOptimisticMutation(
  apiClient.updateUser,
  [{
    queryKey: ['user', userId],
    optimisticData: (variables, currentUser) => ({
      ...currentUser,
      ...variables
    })
  }]
);

// Infinite pagination
const {
  data: posts,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 0 }) => 
    apiClient.getPosts({ page: pageParam, limit: 20 }),
  getNextPageParam: (lastPage) => lastPage.nextPage
});

// Background sync with offline support
const { data: messages } = useBackgroundSync(
  ['messages', chatId],
  () => apiClient.getMessages(chatId),
  30000 // 30 seconds
);
```

## Testing Requirements

Your implementation should include comprehensive tests:

1. **Query Behavior Tests**
   - Cache hit/miss scenarios
   - Stale-while-revalidate patterns
   - Error handling and retries
   - Background refetching

2. **Optimistic Update Tests**
   - Successful optimistic updates
   - Rollback on failure
   - Multiple concurrent updates
   - Conflict resolution

3. **Offline Functionality Tests**
   - Queue management
   - Sync recovery
   - Conflict resolution
   - Data persistence

4. **Performance Tests**
   - Memory usage optimization
   - Cache efficiency
   - Network request patterns
   - Loading state coordination

## Advanced Challenges

For additional practice, implement:

1. **Prefetching Strategies**
   - Link hover prefetching
   - Route-based prefetching
   - User behavior prediction

2. **Advanced Cache Patterns**
   - Normalized caching
   - Shared entity updates
   - Cross-query synchronization

3. **Performance Monitoring**
   - Query performance metrics
   - Cache hit rate tracking
   - Network usage monitoring

## Success Criteria

Your implementation should:

- ✅ Provide seamless user experience with smart caching
- ✅ Handle offline scenarios gracefully
- ✅ Implement robust optimistic updates
- ✅ Support efficient pagination patterns
- ✅ Maintain data consistency across components
- ✅ Optimize memory and network usage
- ✅ Provide comprehensive error handling
- ✅ Support real-time data synchronization

## Tips

- Start with basic TanStack Query setup and gradually add complexity
- Focus on user experience - minimize loading states and maximize responsiveness
- Implement proper error boundaries for query failures
- Consider data staleness vs. freshness trade-offs carefully
- Test offline scenarios thoroughly
- Monitor and optimize cache performance
- Use React DevTools and TanStack Query DevTools for debugging

This exercise demonstrates patterns used in applications with millions of users where data consistency, performance, and user experience are critical. Focus on building a foundation that can handle complex data requirements while maintaining excellent performance.