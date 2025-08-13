import type { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Helper function to extract component/function code
  function extractCode(code: string, name: string): string {
    // Try function pattern first
    let pattern = new RegExp(`function ${name}\\(.*?\\)\\s*{([\\s\\S]*?)}(?=\\s*(?:function|export|const|$))`, 'i');
    let match = code.match(pattern);
    
    if (!match) {
      // Try const/arrow function pattern
      pattern = new RegExp(`const ${name}\\s*=.*?{([\\s\\S]*?)}(?=\\s*(?:function|export|const|$))`, 'i');
      match = code.match(pattern);
    }
    
    if (!match) {
      // Try more flexible pattern with brace counting
      const startPattern = new RegExp(`(?:function|const)\\s+${name}[\\s\\S]*?{`, 'i');
      const startMatch = code.match(startPattern);
      
      if (startMatch) {
        const startIndex = code.indexOf(startMatch[0]) + startMatch[0].length;
        let braceCount = 1;
        let endIndex = startIndex;
        
        for (let i = startIndex; i < code.length && braceCount > 0; i++) {
          if (code[i] === '{') braceCount++;
          if (code[i] === '}') braceCount--;
          endIndex = i;
        }
        
        if (braceCount === 0) {
          return code.substring(startIndex, endIndex);
        }
      }
    }
    
    return match ? match[1] : '';
  }

  // Test 1: useRequestBatcher hook implementation
  const useRequestBatcherCode = extractCode(compiledCode, 'useRequestBatcher');
  tests.push({
    name: 'useRequestBatcher hook implements intelligent request batching',
    passed: useRequestBatcherCode.includes('batchRequest') && 
            useRequestBatcherCode.includes('executeBatch') &&
            useRequestBatcherCode.includes('flushBatch') &&
            useRequestBatcherCode.includes('pendingRequests') &&
            useRequestBatcherCode.includes('setTimeout') &&
            useRequestBatcherCode.includes('clearTimeout') &&
            useRequestBatcherCode.includes('deduplication') &&
            !useRequestBatcherCode.includes('TODO') &&
            useRequestBatcherCode.length > 800,
    error: !useRequestBatcherCode.includes('batchRequest')
      ? 'useRequestBatcher should implement batchRequest function'
      : !useRequestBatcherCode.includes('executeBatch')
      ? 'useRequestBatcher should implement executeBatch function'
      : !useRequestBatcherCode.includes('flushBatch')
      ? 'useRequestBatcher should implement flushBatch function'
      : !useRequestBatcherCode.includes('pendingRequests')
      ? 'useRequestBatcher should track pending requests'
      : !useRequestBatcherCode.includes('setTimeout')
      ? 'useRequestBatcher should use setTimeout for batch timing'
      : !useRequestBatcherCode.includes('deduplication')
      ? 'useRequestBatcher should implement request deduplication'
      : useRequestBatcherCode.includes('TODO')
      ? 'useRequestBatcher still contains TODO comments - needs implementation'
      : 'useRequestBatcher needs substantial implementation with batching logic',
    executionTime: 1,
  });

  // Test 2: RequestBatcher component implementation
  const requestBatcherCode = extractCode(compiledCode, 'RequestBatcher');
  tests.push({
    name: 'RequestBatcher component provides comprehensive batching interface',
    passed: requestBatcherCode.includes('useRequestBatcher') && 
            requestBatcherCode.includes('pendingCount') &&
            requestBatcherCode.includes('flushBatch') &&
            requestBatcherCode.includes('batchStats') &&
            requestBatcherCode.includes('handleManualFlush') &&
            requestBatcherCode.includes('totalBatches') &&
            !requestBatcherCode.includes('TODO') &&
            requestBatcherCode.length > 400,
    error: !requestBatcherCode.includes('useRequestBatcher')
      ? 'RequestBatcher should use useRequestBatcher hook'
      : !requestBatcherCode.includes('pendingCount')
      ? 'RequestBatcher should display pending request count'
      : !requestBatcherCode.includes('flushBatch')
      ? 'RequestBatcher should provide manual flush capability'
      : !requestBatcherCode.includes('batchStats')
      ? 'RequestBatcher should track batch statistics'
      : !requestBatcherCode.includes('handleManualFlush')
      ? 'RequestBatcher should handle manual flush actions'
      : requestBatcherCode.includes('TODO')
      ? 'RequestBatcher still contains TODO comments - needs implementation'
      : 'RequestBatcher needs substantial implementation with batching controls',
    executionTime: 1,
  });

  // Test 3: useCacheManager hook implementation
  const useCacheManagerCode = extractCode(compiledCode, 'useCacheManager');
  tests.push({
    name: 'useCacheManager implements intelligent HTTP caching with TTL and ETags',
    passed: useCacheManagerCode.includes('getCacheKey') && 
            useCacheManagerCode.includes('get') &&
            useCacheManagerCode.includes('set') &&
            useCacheManagerCode.includes('invalidate') &&
            useCacheManagerCode.includes('cleanup') &&
            useCacheManagerCode.includes('ttl') &&
            useCacheManagerCode.includes('etag') &&
            useCacheManagerCode.includes('metrics') &&
            useCacheManagerCode.includes('cacheHits') &&
            useCacheManagerCode.includes('cacheMisses') &&
            !useCacheManagerCode.includes('TODO') &&
            useCacheManagerCode.length > 1000,
    error: !useCacheManagerCode.includes('getCacheKey')
      ? 'useCacheManager should implement getCacheKey function'
      : !useCacheManagerCode.includes('get')
      ? 'useCacheManager should implement get function for cache retrieval'
      : !useCacheManagerCode.includes('set')
      ? 'useCacheManager should implement set function for cache storage'
      : !useCacheManagerCode.includes('invalidate')
      ? 'useCacheManager should implement invalidate function'
      : !useCacheManagerCode.includes('cleanup')
      ? 'useCacheManager should implement cleanup function'
      : !useCacheManagerCode.includes('ttl')
      ? 'useCacheManager should support TTL (time to live) for cache entries'
      : !useCacheManagerCode.includes('etag')
      ? 'useCacheManager should support ETag headers for HTTP caching'
      : !useCacheManagerCode.includes('metrics')
      ? 'useCacheManager should track cache performance metrics'
      : useCacheManagerCode.includes('TODO')
      ? 'useCacheManager still contains TODO comments - needs implementation'
      : 'useCacheManager needs substantial implementation with caching logic',
    executionTime: 1,
  });

  // Test 4: CacheManager component implementation
  const cacheManagerCode = extractCode(compiledCode, 'CacheManager');
  tests.push({
    name: 'CacheManager component provides comprehensive cache management interface',
    passed: cacheManagerCode.includes('useCacheManager') && 
            cacheManagerCode.includes('metrics') &&
            cacheManagerCode.includes('cacheSize') &&
            cacheManagerCode.includes('invalidate') &&
            cacheManagerCode.includes('cleanup') &&
            cacheManagerCode.includes('hitRate') &&
            cacheManagerCode.includes('cacheHits') &&
            cacheManagerCode.includes('cacheMisses') &&
            !cacheManagerCode.includes('TODO') &&
            cacheManagerCode.length > 800,
    error: !cacheManagerCode.includes('useCacheManager')
      ? 'CacheManager should use useCacheManager hook'
      : !cacheManagerCode.includes('metrics')
      ? 'CacheManager should display cache metrics'
      : !cacheManagerCode.includes('cacheSize')
      ? 'CacheManager should show current cache size'
      : !cacheManagerCode.includes('invalidate')
      ? 'CacheManager should provide cache invalidation controls'
      : !cacheManagerCode.includes('cleanup')
      ? 'CacheManager should provide cache cleanup functionality'
      : !cacheManagerCode.includes('hitRate')
      ? 'CacheManager should calculate and display cache hit rate'
      : cacheManagerCode.includes('TODO')
      ? 'CacheManager still contains TODO comments - needs implementation'
      : 'CacheManager needs substantial implementation with management interface',
    executionTime: 1,
  });

  // Test 5: useOfflineHandler hook implementation
  const useOfflineHandlerCode = extractCode(compiledCode, 'useOfflineHandler');
  tests.push({
    name: 'useOfflineHandler implements robust offline request queuing and sync',
    passed: useOfflineHandlerCode.includes('queueRequest') && 
            useOfflineHandlerCode.includes('syncOfflineRequests') &&
            useOfflineHandlerCode.includes('clearOfflineQueue') &&
            useOfflineHandlerCode.includes('isOnline') &&
            useOfflineHandlerCode.includes('offlineQueue') &&
            useOfflineHandlerCode.includes('syncInProgress') &&
            useOfflineHandlerCode.includes('localStorage') &&
            useOfflineHandlerCode.includes('priority') &&
            useOfflineHandlerCode.includes('addEventListener') &&
            !useOfflineHandlerCode.includes('TODO') &&
            useOfflineHandlerCode.length > 1000,
    error: !useOfflineHandlerCode.includes('queueRequest')
      ? 'useOfflineHandler should implement queueRequest function'
      : !useOfflineHandlerCode.includes('syncOfflineRequests')
      ? 'useOfflineHandler should implement syncOfflineRequests function'
      : !useOfflineHandlerCode.includes('clearOfflineQueue')
      ? 'useOfflineHandler should implement clearOfflineQueue function'
      : !useOfflineHandlerCode.includes('isOnline')
      ? 'useOfflineHandler should track online/offline status'
      : !useOfflineHandlerCode.includes('offlineQueue')
      ? 'useOfflineHandler should maintain offline request queue'
      : !useOfflineHandlerCode.includes('localStorage')
      ? 'useOfflineHandler should persist queue in localStorage'
      : !useOfflineHandlerCode.includes('priority')
      ? 'useOfflineHandler should support request priority ordering'
      : !useOfflineHandlerCode.includes('addEventListener')
      ? 'useOfflineHandler should listen for online/offline events'
      : useOfflineHandlerCode.includes('TODO')
      ? 'useOfflineHandler still contains TODO comments - needs implementation'
      : 'useOfflineHandler needs substantial implementation with offline handling',
    executionTime: 1,
  });

  // Test 6: OfflineHandler component implementation
  const offlineHandlerCode = extractCode(compiledCode, 'OfflineHandler');
  tests.push({
    name: 'OfflineHandler component provides comprehensive offline management interface',
    passed: offlineHandlerCode.includes('useOfflineHandler') && 
            offlineHandlerCode.includes('isOnline') &&
            offlineHandlerCode.includes('offlineQueue') &&
            offlineHandlerCode.includes('syncInProgress') &&
            offlineHandlerCode.includes('syncOfflineRequests') &&
            offlineHandlerCode.includes('clearOfflineQueue') &&
            offlineHandlerCode.includes('bg-green-500') &&
            offlineHandlerCode.includes('bg-red-500') &&
            !offlineHandlerCode.includes('TODO') &&
            offlineHandlerCode.length > 600,
    error: !offlineHandlerCode.includes('useOfflineHandler')
      ? 'OfflineHandler should use useOfflineHandler hook'
      : !offlineHandlerCode.includes('isOnline')
      ? 'OfflineHandler should display online/offline status'
      : !offlineHandlerCode.includes('offlineQueue')
      ? 'OfflineHandler should show queued requests'
      : !offlineHandlerCode.includes('syncInProgress')
      ? 'OfflineHandler should show sync progress status'
      : !offlineHandlerCode.includes('syncOfflineRequests')
      ? 'OfflineHandler should provide sync control'
      : !offlineHandlerCode.includes('clearOfflineQueue')
      ? 'OfflineHandler should provide queue clearing'
      : offlineHandlerCode.includes('TODO')
      ? 'OfflineHandler still contains TODO comments - needs implementation'
      : 'OfflineHandler needs substantial implementation with offline interface',
    executionTime: 1,
  });

  // Test 7: useOptimizedFetch hook implementation
  const useOptimizedFetchCode = extractCode(compiledCode, 'useOptimizedFetch');
  tests.push({
    name: 'useOptimizedFetch combines all network optimizations seamlessly',
    passed: useOptimizedFetchCode.includes('optimizedFetch') && 
            useOptimizedFetchCode.includes('prefetch') &&
            useOptimizedFetchCode.includes('preload') &&
            useOptimizedFetchCode.includes('batchRequest') &&
            useOptimizedFetchCode.includes('getCached') &&
            useOptimizedFetchCode.includes('setCached') &&
            useOptimizedFetchCode.includes('queueRequest') &&
            useOptimizedFetchCode.includes('isOnline') &&
            useOptimizedFetchCode.includes('shouldBatchRequest') &&
            !useOptimizedFetchCode.includes('TODO') &&
            useOptimizedFetchCode.length > 600,
    error: !useOptimizedFetchCode.includes('optimizedFetch')
      ? 'useOptimizedFetch should implement optimizedFetch function'
      : !useOptimizedFetchCode.includes('prefetch')
      ? 'useOptimizedFetch should implement prefetch function'
      : !useOptimizedFetchCode.includes('preload')
      ? 'useOptimizedFetch should implement preload function'
      : !useOptimizedFetchCode.includes('batchRequest')
      ? 'useOptimizedFetch should integrate request batching'
      : !useOptimizedFetchCode.includes('getCached')
      ? 'useOptimizedFetch should integrate cache retrieval'
      : !useOptimizedFetchCode.includes('queueRequest')
      ? 'useOptimizedFetch should integrate offline queuing'
      : !useOptimizedFetchCode.includes('isOnline')
      ? 'useOptimizedFetch should check online status'
      : useOptimizedFetchCode.includes('TODO')
      ? 'useOptimizedFetch still contains TODO comments - needs implementation'
      : 'useOptimizedFetch needs substantial implementation combining optimizations',
    executionTime: 1,
  });

  // Test 8: NetworkTestComponent implementation
  const networkTestComponentCode = extractCode(compiledCode, 'NetworkTestComponent');
  tests.push({
    name: 'NetworkTestComponent provides comprehensive network optimization testing',
    passed: networkTestComponentCode.includes('useOptimizedFetch') && 
            networkTestComponentCode.includes('testEndpoint') &&
            networkTestComponentCode.includes('testAllEndpoints') &&
            networkTestComponentCode.includes('simulateSlowNetwork') &&
            networkTestComponentCode.includes('performance.now') &&
            networkTestComponentCode.includes('results') &&
            networkTestComponentCode.includes('duration') &&
            networkTestComponentCode.includes('status') &&
            !networkTestComponentCode.includes('TODO') &&
            networkTestComponentCode.length > 1000,
    error: !networkTestComponentCode.includes('useOptimizedFetch')
      ? 'NetworkTestComponent should use useOptimizedFetch hook'
      : !networkTestComponentCode.includes('testEndpoint')
      ? 'NetworkTestComponent should implement testEndpoint function'
      : !networkTestComponentCode.includes('testAllEndpoints')
      ? 'NetworkTestComponent should implement testAllEndpoints function'
      : !networkTestComponentCode.includes('simulateSlowNetwork')
      ? 'NetworkTestComponent should implement simulateSlowNetwork function'
      : !networkTestComponentCode.includes('performance.now')
      ? 'NetworkTestComponent should measure request timing with performance.now'
      : !networkTestComponentCode.includes('results')
      ? 'NetworkTestComponent should track test results'
      : networkTestComponentCode.includes('TODO')
      ? 'NetworkTestComponent still contains TODO comments - needs implementation'
      : 'NetworkTestComponent needs substantial implementation with testing interface',
    executionTime: 1,
  });

  // Test 9: Request batching and deduplication
  tests.push({
    name: 'Components implement proper request batching and deduplication',
    passed: compiledCode.includes('groupRequestsForBatching') && 
            compiledCode.includes('getBatchKey') &&
            compiledCode.includes('executeBatchedRequests') &&
            compiledCode.includes('deduplication') &&
            compiledCode.includes('identical pending requests') &&
            compiledCode.includes('50'), // batch timeout
    error: !compiledCode.includes('groupRequestsForBatching')
      ? 'Should implement groupRequestsForBatching for intelligent request grouping'
      : !compiledCode.includes('getBatchKey')
      ? 'Should implement getBatchKey for request similarity detection'
      : !compiledCode.includes('executeBatchedRequests')
      ? 'Should implement executeBatchedRequests for batch execution'
      : !compiledCode.includes('deduplication')
      ? 'Should implement request deduplication logic'
      : !compiledCode.includes('identical pending requests')
      ? 'Should detect and handle identical pending requests'
      : 'Should implement comprehensive request batching with 50ms timeout',
    executionTime: 1,
  });

  // Test 10: Cache management and TTL handling
  tests.push({
    name: 'Components implement comprehensive cache management with TTL and ETags',
    passed: compiledCode.includes('CacheEntry') && 
            compiledCode.includes('timestamp') &&
            compiledCode.includes('ttl') &&
            compiledCode.includes('etag') &&
            compiledCode.includes('lastModified') &&
            compiledCode.includes('Date.now()') &&
            compiledCode.includes('cleanup') &&
            compiledCode.includes('setInterval'),
    error: !compiledCode.includes('CacheEntry')
      ? 'Should define CacheEntry interface for cache structure'
      : !compiledCode.includes('timestamp')
      ? 'Should track cache entry timestamps'
      : !compiledCode.includes('ttl')
      ? 'Should implement TTL (time to live) for cache entries'
      : !compiledCode.includes('etag')
      ? 'Should support ETag headers for HTTP caching'
      : !compiledCode.includes('lastModified')
      ? 'Should support Last-Modified headers'
      : !compiledCode.includes('Date.now()')
      ? 'Should use Date.now() for timestamp tracking'
      : !compiledCode.includes('setInterval')
      ? 'Should implement periodic cache cleanup'
      : 'Should implement comprehensive cache management with TTL and HTTP headers',
    executionTime: 1,
  });

  // Test 11: Offline handling and persistence
  tests.push({
    name: 'Components implement robust offline handling with persistent storage',
    passed: compiledCode.includes('navigator.onLine') && 
            compiledCode.includes('localStorage') &&
            compiledCode.includes('addEventListener') &&
            compiledCode.includes('online') &&
            compiledCode.includes('offline') &&
            compiledCode.includes('priorityOrder') &&
            compiledCode.includes('executeRequestWithRetry') &&
            compiledCode.includes('exponential backoff'),
    error: !compiledCode.includes('navigator.onLine')
      ? 'Should use navigator.onLine to detect network status'
      : !compiledCode.includes('localStorage')
      ? 'Should use localStorage for offline queue persistence'
      : !compiledCode.includes('addEventListener')
      ? 'Should listen for online/offline events'
      : !compiledCode.includes('online')
      ? 'Should handle online event'
      : !compiledCode.includes('offline')
      ? 'Should handle offline event'
      : !compiledCode.includes('priorityOrder')
      ? 'Should implement priority-based request ordering'
      : !compiledCode.includes('executeRequestWithRetry')
      ? 'Should implement retry logic for failed requests'
      : 'Should implement exponential backoff for retries',
    executionTime: 1,
  });

  // Test 12: Performance monitoring and metrics
  tests.push({
    name: 'Components implement comprehensive performance monitoring and metrics',
    passed: compiledCode.includes('NetworkMetrics') && 
            compiledCode.includes('requestCount') &&
            compiledCode.includes('cacheHits') &&
            compiledCode.includes('cacheMisses') &&
            compiledCode.includes('averageResponseTime') &&
            compiledCode.includes('failureRate') &&
            compiledCode.includes('bytesTransferred') &&
            compiledCode.includes('performance.now'),
    error: !compiledCode.includes('NetworkMetrics')
      ? 'Should define NetworkMetrics interface for performance tracking'
      : !compiledCode.includes('requestCount')
      ? 'Should track total request count'
      : !compiledCode.includes('cacheHits')
      ? 'Should track cache hit count'
      : !compiledCode.includes('cacheMisses')
      ? 'Should track cache miss count'
      : !compiledCode.includes('averageResponseTime')
      ? 'Should calculate average response time'
      : !compiledCode.includes('failureRate')
      ? 'Should track request failure rate'
      : !compiledCode.includes('bytesTransferred')
      ? 'Should track bytes transferred'
      : 'Should use performance.now for accurate timing',
    executionTime: 1,
  });

  // Test 13: Request priority and retry logic
  tests.push({
    name: 'Components implement intelligent request priority and retry mechanisms',
    passed: compiledCode.includes('priority') && 
            compiledCode.includes('high') &&
            compiledCode.includes('normal') &&
            compiledCode.includes('low') &&
            compiledCode.includes('retries') &&
            compiledCode.includes('timeout') &&
            compiledCode.includes('AbortController') &&
            (compiledCode.match(/Math\.pow/g) || []).length >= 1,
    error: !compiledCode.includes('priority')
      ? 'Should implement request priority system'
      : !compiledCode.includes('high')
      ? 'Should support high priority requests'
      : !compiledCode.includes('normal')
      ? 'Should support normal priority requests'
      : !compiledCode.includes('low')
      ? 'Should support low priority requests'
      : !compiledCode.includes('retries')
      ? 'Should implement request retry logic'
      : !compiledCode.includes('timeout')
      ? 'Should implement request timeout handling'
      : !compiledCode.includes('AbortController')
      ? 'Should use AbortController for request cancellation'
      : 'Should implement exponential backoff using Math.pow',
    executionTime: 1,
  });

  // Test 14: Main demo component integration
  const demoCode = extractCode(compiledCode, 'NetworkOptimizationDemo');
  tests.push({
    name: 'NetworkOptimizationDemo integrates all network optimization features',
    passed: demoCode.includes('RequestBatcher') && 
            demoCode.includes('CacheManager') &&
            demoCode.includes('OfflineHandler') &&
            demoCode.includes('NetworkTestComponent') &&
            demoCode.includes('selectedTool') &&
            demoCode.includes('enableOptimizations') &&
            demoCode.includes('testEndpoints') &&
            demoCode.length > 1000,
    error: !demoCode.includes('RequestBatcher')
      ? 'Demo should include RequestBatcher component'
      : !demoCode.includes('CacheManager')
      ? 'Demo should include CacheManager component'
      : !demoCode.includes('OfflineHandler')
      ? 'Demo should include OfflineHandler component'
      : !demoCode.includes('NetworkTestComponent')
      ? 'Demo should include NetworkTestComponent for testing'
      : !demoCode.includes('selectedTool')
      ? 'Demo should allow switching between different tools'
      : !demoCode.includes('enableOptimizations')
      ? 'Demo should provide optimization toggle'
      : !demoCode.includes('testEndpoints')
      ? 'Demo should define test endpoints for demonstration'
      : 'Demo component needs substantial implementation integrating all features',
    executionTime: 1,
  });

  // Test 15: Error handling and browser compatibility
  tests.push({
    name: 'Components implement proper error handling and browser compatibility',
    passed: compiledCode.includes('try') && 
            compiledCode.includes('catch') &&
            compiledCode.includes('console.warn') &&
            compiledCode.includes('clearTimeout') &&
            compiledCode.includes('clearInterval') &&
            compiledCode.includes('cleanup') &&
            (compiledCode.includes('navigator') || compiledCode.includes('window')),
    error: !compiledCode.includes('try')
      ? 'Should implement error handling with try-catch blocks'
      : !compiledCode.includes('catch')
      ? 'Should handle errors gracefully'
      : !compiledCode.includes('console.warn')
      ? 'Should warn about issues and failures'
      : !compiledCode.includes('clearTimeout')
      ? 'Should clean up timeouts properly'
      : !compiledCode.includes('clearInterval')
      ? 'Should clean up intervals properly'
      : !compiledCode.includes('cleanup')
      ? 'Should implement proper cleanup patterns'
      : 'Should implement browser compatibility checks',
    executionTime: 1,
  });

  return tests;
}