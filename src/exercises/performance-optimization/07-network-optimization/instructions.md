# Network Optimization & Caching Strategies

**Difficulty:** ⭐⭐⭐⭐ (75 minutes)

## Learning Objectives

By completing this exercise, you will:

- Master network request optimization and intelligent caching strategies
- Learn to implement request batching and deduplication techniques
- Practice offline handling with request queuing and sync
- Build production-ready HTTP caching with ETags and TTL
- Understand request prioritization and retry mechanisms
- Create comprehensive network performance monitoring tools

## Background

Modern web applications make hundreds of network requests, and staff-level engineers must optimize these for performance, reliability, and user experience. This exercise covers advanced network optimization patterns including request batching, intelligent caching, offline handling, and performance monitoring.

### Key Concepts

1. **Request Batching** - Group similar requests to reduce HTTP overhead
2. **Intelligent Caching** - HTTP caching with TTL, ETags, and invalidation
3. **Request Deduplication** - Prevent duplicate concurrent requests
4. **Offline Handling** - Queue requests when offline, sync when online
5. **Request Prioritization** - Handle urgent vs background requests
6. **Performance Monitoring** - Track cache hit rates and request timing

## Network Optimization Patterns

### Request Batching
```typescript
// Batch similar GraphQL queries
const batchRequests = (requests: Request[]) => {
  // Group by endpoint/query type
  // Execute as single batch request
  // Distribute results to individual promises
};
```

### HTTP Caching with ETags
```typescript
const cacheWithETag = {
  get: (url: string) => {
    const cached = cache.get(url);
    if (cached && !isExpired(cached)) {
      return cached.data;
    }
    return null;
  },
  
  set: (url: string, data: any, etag: string, ttl: number) => {
    cache.set(url, { data, etag, expires: Date.now() + ttl });
  }
};
```

### Request Deduplication
```typescript
const deduplicatedFetch = (() => {
  const pendingRequests = new Map();
  
  return async (url: string, options: RequestInit) => {
    const key = generateKey(url, options);
    
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key);
    }
    
    const promise = fetch(url, options);
    pendingRequests.set(key, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      pendingRequests.delete(key);
    }
  };
})();
```

## Exercise Tasks

### 1. Request Batching System (20 minutes)

Implement `useRequestBatcher` hook for intelligent request grouping:

```typescript
function useRequestBatcher() {
  // Queue similar requests together
  // Batch by URL pattern or GraphQL queries
  // Execute batches with optimal timing (50ms default)
  // Handle partial failures gracefully
  // Deduplicate identical requests
}
```

**Key Features:**
- Automatic request grouping by similarity
- Configurable batch timeout and size limits
- Request deduplication within batches
- Graceful handling of partial batch failures
- Priority-based batch execution

**Advanced Capabilities:**
- GraphQL query batching and optimization
- REST endpoint intelligent grouping
- Dynamic batch sizing based on network conditions
- Request dependency tracking and ordering

### 2. Intelligent Cache Manager (20 minutes)

Create `useCacheManager` with comprehensive HTTP caching:
- TTL-based expiration with automatic cleanup
- ETag and Last-Modified header support
- Cache invalidation patterns and strategies
- LRU eviction for memory management
- Cache performance metrics and monitoring

**Caching Strategies:**
- Memory-first with localStorage fallback
- Stale-while-revalidate patterns
- Cache warming and prefetching
- Conditional requests with 304 responses

### 3. Offline Request Handler (20 minutes)

Build `useOfflineHandler` for robust offline functionality:
- Request queuing when network unavailable
- Automatic sync when connectivity restored
- Conflict resolution for concurrent modifications
- Request prioritization during sync
- Persistent storage for queued requests

**Offline Patterns:**
- Optimistic updates with rollback
- Background sync with retry logic
- Conflict detection and resolution
- Progressive sync with user feedback

### 4. Optimized Fetch Implementation (15 minutes)

Implement `useOptimizedFetch` combining all optimizations:
- Cache-first request strategy
- Request batching when beneficial
- Offline request queuing
- Retry with exponential backoff
- Request timing and performance metrics

## Advanced Challenges

### GraphQL Request Optimization
Implement sophisticated GraphQL batching:
- Query combination and optimization
- Variable deduplication across queries
- Fragment sharing and reuse
- Subscription batching and multiplexing

### Advanced Cache Strategies
Build production-grade caching system:
- Multi-level cache hierarchy (memory → localStorage → IndexedDB)
- Cache warming strategies
- Background cache refresh
- Cache compression and size optimization

### Network Condition Adaptation
Implement adaptive network strategies:
- Connection quality detection
- Dynamic batch sizing based on latency
- Request prioritization by bandwidth
- Fallback strategies for poor connections

## Testing Your Implementation

Your solution should demonstrate:

1. **Efficient Batching**: Reduced request count through intelligent grouping
2. **Smart Caching**: High cache hit rates with proper invalidation
3. **Offline Resilience**: Seamless operation during network interruptions
4. **Performance Monitoring**: Detailed metrics for optimization decisions
5. **Production Ready**: Error handling and edge case coverage

## Success Criteria

- [ ] `useRequestBatcher` efficiently groups and executes similar requests
- [ ] `useCacheManager` implements comprehensive HTTP caching strategies
- [ ] `useOfflineHandler` provides robust offline functionality
- [ ] `useOptimizedFetch` combines all optimizations seamlessly
- [ ] Request deduplication prevents unnecessary duplicate calls
- [ ] Cache hit rate exceeds 70% for repeated requests
- [ ] Offline requests queue and sync properly when online
- [ ] Performance metrics provide actionable optimization insights

## Performance Targets

Your implementation should achieve:

### Network Performance
- Request batching: <50ms latency overhead
- Cache lookup: <1ms for memory cache hits
- Offline queue: <10ms to queue request
- Sync performance: 100+ requests/second during batch sync

### Cache Efficiency
- Memory usage: <5MB for 1000 cached responses
- Hit rate: >70% for typical application usage
- Invalidation: <5ms to clear related cache entries
- Storage: Automatic cleanup maintains <50MB total cache

### Reliability Metrics
- Offline resilience: 100% request capture when offline
- Sync success: >99% successful request execution after reconnect
- Error recovery: Automatic retry with exponential backoff
- Data consistency: Zero data loss during network interruptions

## Real-world Network Optimization Patterns

### Request Batching Strategies
```typescript
// GraphQL query batching
const batchGraphQLQueries = (queries: GraphQLQuery[]) => {
  const batchQuery = {
    query: `
      query BatchedQuery {
        ${queries.map((q, i) => `query${i}: ${q.query}`).join('\n')}
      }
    `,
    variables: queries.reduce((acc, q, i) => ({ ...acc, [`vars${i}`]: q.variables }), {})
  };
  
  return fetch('/graphql', {
    method: 'POST',
    body: JSON.stringify(batchQuery)
  }).then(response => {
    // Distribute results back to individual promises
    return distributeBatchResults(response, queries);
  });
};

// REST endpoint intelligent batching
const batchRESTRequests = (requests: RESTRequest[]) => {
  // Group by endpoint pattern
  const groups = groupByEndpoint(requests);
  
  // Execute each group as batch request
  return Promise.all(
    groups.map(group => executeBatchRequest(group))
  ).then(results => flattenResults(results));
};
```

### Advanced Caching Implementation
```typescript
// Multi-level cache with stale-while-revalidate
class AdvancedCache {
  private memoryCache = new Map();
  private storageCache: LocalStorage;
  
  async get(key: string, maxAge: number = 300000) {
    // Check memory cache first
    let cached = this.memoryCache.get(key);
    if (cached && !this.isExpired(cached, maxAge)) {
      return cached.data;
    }
    
    // Check storage cache
    cached = await this.storageCache.get(key);
    if (cached) {
      // Promote to memory cache
      this.memoryCache.set(key, cached);
      
      if (!this.isExpired(cached, maxAge)) {
        return cached.data;
      }
      
      // Stale-while-revalidate: return stale data, trigger refresh
      this.revalidateInBackground(key);
      return cached.data;
    }
    
    return null;
  }
  
  private async revalidateInBackground(key: string) {
    try {
      const fresh = await this.fetchFresh(key);
      await this.set(key, fresh);
    } catch (error) {
      console.warn('Background revalidation failed:', error);
    }
  }
}
```

### Offline Request Management
```typescript
// Sophisticated offline handling
class OfflineRequestManager {
  private queue: OfflineRequest[] = [];
  private syncInProgress = false;
  
  async queueRequest(request: Request, priority: 'high' | 'normal' | 'low' = 'normal') {
    const offlineRequest: OfflineRequest = {
      id: generateId(),
      request: await this.serializeRequest(request),
      priority,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    this.queue.push(offlineRequest);
    await this.persistQueue();
    
    // Return optimistic response if possible
    return this.generateOptimisticResponse(request);
  }
  
  async syncWhenOnline() {
    if (this.syncInProgress || !navigator.onLine) return;
    
    this.syncInProgress = true;
    
    try {
      // Sort by priority and timestamp
      const sortedQueue = this.queue.sort(this.priorityComparator);
      
      for (const offlineRequest of sortedQueue) {
        await this.executeRequest(offlineRequest);
        this.removeFromQueue(offlineRequest.id);
      }
    } finally {
      this.syncInProgress = false;
      await this.persistQueue();
    }
  }
  
  private priorityComparator(a: OfflineRequest, b: OfflineRequest) {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
  }
}
```

### Performance Monitoring Integration
```typescript
// Comprehensive network performance tracking
const useNetworkMetrics = () => {
  const [metrics, setMetrics] = useState({
    requestCount: 0,
    cacheHitRate: 0,
    averageResponseTime: 0,
    failureRate: 0,
    offlineQueueSize: 0
  });
  
  const trackRequest = useCallback((url: string, cached: boolean, duration: number, success: boolean) => {
    setMetrics(prev => {
      const newCount = prev.requestCount + 1;
      const newHits = cached ? prev.cacheHitRate * prev.requestCount + 1 : prev.cacheHitRate * prev.requestCount;
      const newResponseTime = (prev.averageResponseTime * prev.requestCount + duration) / newCount;
      const newFailures = success ? prev.failureRate * prev.requestCount : prev.failureRate * prev.requestCount + 1;
      
      return {
        requestCount: newCount,
        cacheHitRate: newHits / newCount,
        averageResponseTime: newResponseTime,
        failureRate: newFailures / newCount,
        offlineQueueSize: prev.offlineQueueSize
      };
    });
  }, []);
  
  return { metrics, trackRequest };
};
```

## Production Deployment Considerations

### Cache Configuration
- Set appropriate TTL values based on data volatility
- Implement cache warming for critical resources
- Monitor cache hit rates and adjust strategies
- Use CDN integration for static assets

### Network Resilience
- Implement circuit breaker patterns for failing services
- Use retry policies with jitter to prevent thundering herd
- Monitor network performance and adapt strategies
- Provide graceful degradation for offline scenarios

### Security Considerations
- Validate cached responses before use
- Implement proper CORS handling for cross-origin requests
- Secure offline data storage with encryption
- Prevent cache poisoning attacks

Remember: Network optimization is about balancing performance, reliability, and user experience. Focus on measurable improvements that enhance real-world application performance.