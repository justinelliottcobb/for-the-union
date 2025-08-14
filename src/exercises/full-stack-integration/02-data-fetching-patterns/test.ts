import { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: QueryConfig interface exists
  results.push({
    name: 'QueryConfig Interface Definition',
    passed: compiledCode.includes('interface QueryConfig') && 
            compiledCode.includes('defaultStaleTime') && 
            compiledCode.includes('defaultCacheTime') &&
            compiledCode.includes('retryAttempts') &&
            compiledCode.includes('retryDelay') &&
            compiledCode.includes('refetchOnWindowFocus') &&
            compiledCode.includes('refetchOnReconnect'),
    message: compiledCode.includes('interface QueryConfig') ? 
      'QueryConfig interface properly defined with all required configuration options' : 
      'QueryConfig interface is missing or incomplete. Should include stale time, cache time, retry options, and refetch settings'
  });

  // Test 2: createQueryClient function exists
  results.push({
    name: 'Advanced QueryClient Creation',
    passed: compiledCode.includes('function createQueryClient') &&
            compiledCode.includes('new QueryClient') &&
            compiledCode.includes('defaultOptions') &&
            (compiledCode.includes('networkMode') || compiledCode.includes('staleTime')),
    message: compiledCode.includes('function createQueryClient') ? 
      'createQueryClient function implemented with proper configuration and options' : 
      'createQueryClient function is missing or incomplete. Should create QueryClient with advanced configuration'
  });

  // Test 3: CacheManager class exists
  results.push({
    name: 'CacheManager Implementation',
    passed: compiledCode.includes('class CacheManager') &&
            compiledCode.includes('invalidateByTags') &&
            compiledCode.includes('invalidateByPattern') &&
            compiledCode.includes('warmCache') &&
            compiledCode.includes('updateCacheData') &&
            compiledCode.includes('optimizeMemory'),
    message: compiledCode.includes('class CacheManager') ? 
      'CacheManager class implemented with all required cache management methods' : 
      'CacheManager class is missing or incomplete. Should include tag invalidation, pattern matching, cache warming, and memory optimization'
  });

  // Test 4: OptimisticUpdate interface exists
  results.push({
    name: 'OptimisticUpdate Interface Type Safety',
    passed: compiledCode.includes('interface OptimisticUpdate<TData, TVariable>') &&
            compiledCode.includes('queryKey') &&
            compiledCode.includes('optimisticData') &&
            (compiledCode.includes('rollbackData') || compiledCode.includes('onError')),
    message: compiledCode.includes('interface OptimisticUpdate<TData, TVariable>') ? 
      'OptimisticUpdate interface properly defined with generic types and callback functions' : 
      'OptimisticUpdate interface is missing or incomplete. Should be generic with queryKey, optimisticData, and error handling'
  });

  // Test 5: useOptimisticMutation hook exists
  results.push({
    name: 'Optimistic Mutation Hook Implementation',
    passed: compiledCode.includes('function useOptimisticMutation') &&
            compiledCode.includes('useMutation') &&
            compiledCode.includes('onMutate') &&
            (compiledCode.includes('setQueryData') || compiledCode.includes('queryClient.setQueryData')) &&
            compiledCode.includes('onError'),
    message: compiledCode.includes('function useOptimisticMutation') ? 
      'useOptimisticMutation hook implemented with proper optimistic updates and rollback logic' : 
      'useOptimisticMutation hook is missing or incomplete. Should handle optimistic updates, rollback, and error scenarios'
  });

  // Test 6: OfflineManager class exists
  results.push({
    name: 'OfflineManager Implementation',
    passed: compiledCode.includes('class OfflineManager') &&
            compiledCode.includes('queueRequest') &&
            compiledCode.includes('processQueue') &&
            compiledCode.includes('resolveConflicts') &&
            compiledCode.includes('getSyncStatus') &&
            compiledCode.includes('onSyncStatusChange'),
    message: compiledCode.includes('class OfflineManager') ? 
      'OfflineManager class implemented with queue management and sync capabilities' : 
      'OfflineManager class is missing or incomplete. Should include request queuing, processing, and sync status management'
  });

  // Test 7: useInfiniteData hook exists
  results.push({
    name: 'Infinite Data Hook Implementation',
    passed: compiledCode.includes('function useInfiniteData') &&
            compiledCode.includes('useInfiniteQuery') &&
            compiledCode.includes('getNextPageParam') &&
            (compiledCode.includes('PaginatedResponse') || compiledCode.includes('InfiniteData')),
    message: compiledCode.includes('function useInfiniteData') ? 
      'useInfiniteData hook implemented with proper infinite query configuration' : 
      'useInfiniteData hook is missing or incomplete. Should use useInfiniteQuery with pagination support'
  });

  // Test 8: useBackgroundSync hook exists
  results.push({
    name: 'Background Sync Hook Implementation',
    passed: compiledCode.includes('function useBackgroundSync') &&
            compiledCode.includes('useQuery') &&
            (compiledCode.includes('refetchInterval') || compiledCode.includes('syncInterval')) &&
            (compiledCode.includes('refetchIntervalInBackground') || compiledCode.includes('background')),
    message: compiledCode.includes('function useBackgroundSync') ? 
      'useBackgroundSync hook implemented with interval-based refetching' : 
      'useBackgroundSync hook is missing or incomplete. Should implement background refetching with configurable intervals'
  });

  // Test 9: useDependentQueries hook exists
  results.push({
    name: 'Dependent Queries Hook Implementation',
    passed: compiledCode.includes('function useDependentQueries') &&
            compiledCode.includes('useQuery') &&
            compiledCode.includes('enabled') &&
            (compiledCode.includes('firstQuery') || compiledCode.includes('query1')),
    message: compiledCode.includes('function useDependentQueries') ? 
      'useDependentQueries hook implemented with proper dependency management' : 
      'useDependentQueries hook is missing or incomplete. Should handle query dependencies with enabled conditions'
  });

  // Test 10: useRealTimeQuery hook exists
  results.push({
    name: 'Real-time Query Hook Implementation',
    passed: compiledCode.includes('function useRealTimeQuery') &&
            compiledCode.includes('WebSocket') &&
            compiledCode.includes('connectionStatus') &&
            compiledCode.includes('isConnected') &&
            (compiledCode.includes('onmessage') || compiledCode.includes('setQueryData')),
    message: compiledCode.includes('function useRealTimeQuery') ? 
      'useRealTimeQuery hook implemented with WebSocket integration and connection management' : 
      'useRealTimeQuery hook is missing or incomplete. Should integrate WebSocket with query caching and connection status'
  });

  // Test 11: Network event handling
  results.push({
    name: 'Network Event Handling',
    passed: (compiledCode.includes("addEventListener('online'") || compiledCode.includes('addEventListener("online"')) &&
            (compiledCode.includes("addEventListener('offline'") || compiledCode.includes('addEventListener("offline"')) &&
            compiledCode.includes('navigator.onLine'),
    message: compiledCode.includes("addEventListener('online'") || compiledCode.includes('addEventListener("online"') ? 
      'Network event handling properly implemented for online/offline detection' : 
      'Network event handling is missing or incomplete. Should listen for online/offline events and check navigator.onLine'
  });

  // Test 12: Retry logic implementation
  results.push({
    name: 'Advanced Retry Logic',
    passed: compiledCode.includes('retryDelay') &&
            (compiledCode.includes('Math.min') || compiledCode.includes('exponential')) &&
            (compiledCode.includes('2 **') || compiledCode.includes('Math.pow')),
    message: compiledCode.includes('retryDelay') ? 
      'Retry logic implemented with exponential backoff and maximum delay limits' : 
      'Retry logic is missing or incomplete. Should implement exponential backoff with configurable delays'
  });

  // Test 13: Cache invalidation patterns
  results.push({
    name: 'Cache Invalidation Patterns',
    passed: compiledCode.includes('invalidateQueries') &&
            (compiledCode.includes('predicate') || compiledCode.includes('queryKey')) &&
            (compiledCode.includes('includes') || compiledCode.includes('test') || compiledCode.includes('RegExp')),
    message: compiledCode.includes('invalidateQueries') ? 
      'Cache invalidation patterns implemented with predicate functions and pattern matching' : 
      'Cache invalidation is missing or incomplete. Should support pattern-based and tag-based invalidation'
  });

  // Test 14: Optimistic update rollback
  results.push({
    name: 'Optimistic Update Rollback',
    passed: compiledCode.includes('onMutate') &&
            compiledCode.includes('onError') &&
            (compiledCode.includes('previousData') || compiledCode.includes('snapshot')) &&
            compiledCode.includes('setQueryData'),
    message: compiledCode.includes('onMutate') && compiledCode.includes('onError') ? 
      'Optimistic update rollback properly implemented with data snapshots and error handling' : 
      'Optimistic update rollback is missing or incomplete. Should snapshot data and restore on error'
  });

  // Test 15: Component integration test
  const componentResult = createComponentTest(
    'App',
    compiledCode,
    {
      requiredElements: ['QueryClientProvider', 'div'],
      customValidation: (code) => code.includes('Data Fetching') || code.includes('TanStack') || code.includes('Query'),
      errorMessage: 'App component should render data fetching demonstration with QueryClientProvider'
    }
  );
  results.push(componentResult);

  return results;
}