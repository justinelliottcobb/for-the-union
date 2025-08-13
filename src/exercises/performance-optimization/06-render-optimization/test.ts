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

  // Test 1: useRenderTracker hook implementation
  const useRenderTrackerCode = extractCode(compiledCode, 'useRenderTracker');
  tests.push({
    name: 'useRenderTracker hook accurately tracks component render performance',
    passed: useRenderTrackerCode.includes('performance.now') && 
            useRenderTrackerCode.includes('renderCount') &&
            useRenderTrackerCode.includes('averageRenderTime') &&
            useRenderTrackerCode.includes('totalRenderTime') &&
            useRenderTrackerCode.includes('isExpensive') &&
            useRenderTrackerCode.includes('startTracking') &&
            useRenderTrackerCode.includes('endTracking') &&
            !useRenderTrackerCode.includes('TODO') &&
            useRenderTrackerCode.length > 800,
    error: !useRenderTrackerCode.includes('performance.now')
      ? 'useRenderTracker should use performance.now() for timing measurement'
      : !useRenderTrackerCode.includes('renderCount')
      ? 'useRenderTracker should track render count'
      : !useRenderTrackerCode.includes('averageRenderTime')
      ? 'useRenderTracker should calculate average render time'
      : !useRenderTrackerCode.includes('totalRenderTime')
      ? 'useRenderTracker should track total render time'
      : !useRenderTrackerCode.includes('isExpensive')
      ? 'useRenderTracker should detect expensive renders (>16ms)'
      : !useRenderTrackerCode.includes('startTracking')
      ? 'useRenderTracker should provide startTracking function'
      : useRenderTrackerCode.includes('TODO')
      ? 'useRenderTracker still contains TODO comments - needs implementation'
      : 'useRenderTracker needs substantial implementation with performance tracking',
    executionTime: 1,
  });

  // Test 2: RenderTracker component implementation
  const renderTrackerCode = extractCode(compiledCode, 'RenderTracker');
  tests.push({
    name: 'RenderTracker component provides comprehensive render monitoring',
    passed: renderTrackerCode.includes('useRenderTracker') && 
            renderTrackerCode.includes('onMetrics') &&
            renderTrackerCode.includes('showWarnings') &&
            renderTrackerCode.includes('resetMetrics') &&
            renderTrackerCode.includes('getPerformanceColor') &&
            !renderTrackerCode.includes('TODO') &&
            renderTrackerCode.length > 600,
    error: !renderTrackerCode.includes('useRenderTracker')
      ? 'RenderTracker should use useRenderTracker hook'
      : !renderTrackerCode.includes('onMetrics')
      ? 'RenderTracker should call onMetrics callback with metrics'
      : !renderTrackerCode.includes('showWarnings')
      ? 'RenderTracker should support showing performance warnings'
      : !renderTrackerCode.includes('resetMetrics')
      ? 'RenderTracker should provide metrics reset functionality'
      : renderTrackerCode.includes('TODO')
      ? 'RenderTracker still contains TODO comments - needs implementation'
      : 'RenderTracker needs substantial implementation with monitoring features',
    executionTime: 1,
  });

  // Test 3: useBatchedUpdates hook implementation
  const useBatchedUpdatesCode = extractCode(compiledCode, 'useBatchedUpdates');
  tests.push({
    name: 'useBatchedUpdates implements intelligent update batching',
    passed: useBatchedUpdatesCode.includes('scheduleUpdate') && 
            useBatchedUpdatesCode.includes('flushUpdates') &&
            useBatchedUpdatesCode.includes('priority') &&
            useBatchedUpdatesCode.includes('urgent') &&
            useBatchedUpdatesCode.includes('normal') &&
            useBatchedUpdatesCode.includes('low') &&
            useBatchedUpdatesCode.includes('useTransition') &&
            useBatchedUpdatesCode.includes('startTransition') &&
            !useBatchedUpdatesCode.includes('TODO') &&
            useBatchedUpdatesCode.length > 800,
    error: !useBatchedUpdatesCode.includes('scheduleUpdate')
      ? 'useBatchedUpdates should implement scheduleUpdate function'
      : !useBatchedUpdatesCode.includes('flushUpdates')
      ? 'useBatchedUpdates should implement flushUpdates function'
      : !useBatchedUpdatesCode.includes('priority')
      ? 'useBatchedUpdates should handle update priorities'
      : !useBatchedUpdatesCode.includes('urgent')
      ? 'useBatchedUpdates should support urgent priority updates'
      : !useBatchedUpdatesCode.includes('useTransition')
      ? 'useBatchedUpdates should use React useTransition hook'
      : !useBatchedUpdatesCode.includes('startTransition')
      ? 'useBatchedUpdates should use startTransition for non-urgent updates'
      : useBatchedUpdatesCode.includes('TODO')
      ? 'useBatchedUpdates still contains TODO comments - needs implementation'
      : 'useBatchedUpdates needs substantial implementation with batching logic',
    executionTime: 1,
  });

  // Test 4: BatchedUpdates component implementation
  const batchedUpdatesCode = extractCode(compiledCode, 'BatchedUpdates');
  tests.push({
    name: 'BatchedUpdates component provides update batching interface',
    passed: batchedUpdatesCode.includes('useBatchedUpdates') && 
            batchedUpdatesCode.includes('scheduleUpdate') &&
            batchedUpdatesCode.includes('flushUpdates') &&
            batchedUpdatesCode.includes('pendingCount') &&
            batchedUpdatesCode.includes('isPending') &&
            batchedUpdatesCode.includes('handleTestUpdate') &&
            !batchedUpdatesCode.includes('TODO') &&
            batchedUpdatesCode.length > 600,
    error: !batchedUpdatesCode.includes('useBatchedUpdates')
      ? 'BatchedUpdates should use useBatchedUpdates hook'
      : !batchedUpdatesCode.includes('scheduleUpdate')
      ? 'BatchedUpdates should use scheduleUpdate for batching'
      : !batchedUpdatesCode.includes('flushUpdates')
      ? 'BatchedUpdates should provide manual flush capability'
      : !batchedUpdatesCode.includes('pendingCount')
      ? 'BatchedUpdates should display pending update count'
      : !batchedUpdatesCode.includes('isPending')
      ? 'BatchedUpdates should show batching status'
      : batchedUpdatesCode.includes('TODO')
      ? 'BatchedUpdates still contains TODO comments - needs implementation'
      : 'BatchedUpdates needs substantial implementation with batching controls',
    executionTime: 1,
  });

  // Test 5: useConcurrentFeatures hook implementation
  const useConcurrentFeaturesCode = extractCode(compiledCode, 'useConcurrentFeatures');
  tests.push({
    name: 'useConcurrentFeatures implements React concurrent capabilities',
    passed: useConcurrentFeaturesCode.includes('useTransition') && 
            useConcurrentFeaturesCode.includes('useDeferredValue') &&
            useConcurrentFeaturesCode.includes('scheduleWork') &&
            useConcurrentFeaturesCode.includes('timeSlice') &&
            useConcurrentFeaturesCode.includes('startTransition') &&
            useConcurrentFeaturesCode.includes('setTimeout') &&
            !useConcurrentFeaturesCode.includes('TODO') &&
            useConcurrentFeaturesCode.length > 400,
    error: !useConcurrentFeaturesCode.includes('useTransition')
      ? 'useConcurrentFeatures should use useTransition hook'
      : !useConcurrentFeaturesCode.includes('useDeferredValue')
      ? 'useConcurrentFeatures should use useDeferredValue hook'
      : !useConcurrentFeaturesCode.includes('scheduleWork')
      ? 'useConcurrentFeatures should implement scheduleWork function'
      : !useConcurrentFeaturesCode.includes('timeSlice')
      ? 'useConcurrentFeatures should implement timeSlice function'
      : !useConcurrentFeaturesCode.includes('startTransition')
      ? 'useConcurrentFeatures should use startTransition for work scheduling'
      : useConcurrentFeaturesCode.includes('TODO')
      ? 'useConcurrentFeatures still contains TODO comments - needs implementation'
      : 'useConcurrentFeatures needs substantial implementation with concurrent features',
    executionTime: 1,
  });

  // Test 6: ConcurrentRenderer component implementation
  const concurrentRendererCode = extractCode(compiledCode, 'ConcurrentRenderer');
  tests.push({
    name: 'ConcurrentRenderer implements time slicing and concurrent rendering',
    passed: concurrentRendererCode.includes('renderConcurrently') && 
            concurrentRendererCode.includes('enableTimeSlicing') &&
            concurrentRendererCode.includes('enablePrioritization') &&
            concurrentRendererCode.includes('sliceSize') &&
            concurrentRendererCode.includes('useTransition') &&
            concurrentRendererCode.includes('startTransition') &&
            concurrentRendererCode.includes('setTimeout') &&
            !concurrentRendererCode.includes('TODO') &&
            concurrentRendererCode.length > 1000,
    error: !concurrentRendererCode.includes('renderConcurrently')
      ? 'ConcurrentRenderer should implement renderConcurrently function'
      : !concurrentRendererCode.includes('enableTimeSlicing')
      ? 'ConcurrentRenderer should support time slicing toggle'
      : !concurrentRendererCode.includes('enablePrioritization')
      ? 'ConcurrentRenderer should support prioritization toggle'
      : !concurrentRendererCode.includes('sliceSize')
      ? 'ConcurrentRenderer should use configurable slice size'
      : !concurrentRendererCode.includes('useTransition')
      ? 'ConcurrentRenderer should use useTransition for concurrent rendering'
      : !concurrentRendererCode.includes('startTransition')
      ? 'ConcurrentRenderer should use startTransition for non-blocking updates'
      : concurrentRendererCode.includes('TODO')
      ? 'ConcurrentRenderer still contains TODO comments - needs implementation'
      : 'ConcurrentRenderer needs substantial implementation with concurrent features',
    executionTime: 1,
  });

  // Test 7: ExpensiveComponent optimization implementation
  const expensiveComponentCode = extractCode(compiledCode, 'ExpensiveComponent');
  tests.push({
    name: 'ExpensiveComponent implements proper optimization patterns',
    passed: expensiveComponentCode.includes('React.memo') && 
            expensiveComponentCode.includes('useMemo') &&
            expensiveComponentCode.includes('performance.now') &&
            expensiveComponentCode.includes('computation') &&
            expensiveComponentCode.includes('enableOptimization') &&
            expensiveComponentCode.includes('iterations') &&
            !expensiveComponentCode.includes('TODO') &&
            expensiveComponentCode.length > 800,
    error: !expensiveComponentCode.includes('React.memo')
      ? 'ExpensiveComponent should use React.memo for component optimization'
      : !expensiveComponentCode.includes('useMemo')
      ? 'ExpensiveComponent should use useMemo for expensive calculations'
      : !expensiveComponentCode.includes('performance.now')
      ? 'ExpensiveComponent should measure computation time with performance.now'
      : !expensiveComponentCode.includes('computation')
      ? 'ExpensiveComponent should handle different computation levels'
      : !expensiveComponentCode.includes('enableOptimization')
      ? 'ExpensiveComponent should support optimization toggle'
      : expensiveComponentCode.includes('TODO')
      ? 'ExpensiveComponent still contains TODO comments - needs implementation'
      : 'ExpensiveComponent needs substantial implementation with optimization patterns',
    executionTime: 1,
  });

  // Test 8: usePerformanceProfiler hook implementation
  const usePerformanceProfilerCode = extractCode(compiledCode, 'usePerformanceProfiler');
  tests.push({
    name: 'usePerformanceProfiler provides comprehensive performance profiling',
    passed: usePerformanceProfilerCode.includes('profileComponent') && 
            usePerformanceProfilerCode.includes('getProfileSummary') &&
            usePerformanceProfilerCode.includes('clearProfiles') &&
            usePerformanceProfilerCode.includes('profiles') &&
            usePerformanceProfilerCode.includes('duration') &&
            usePerformanceProfilerCode.includes('timestamp') &&
            usePerformanceProfilerCode.includes('phase') &&
            !usePerformanceProfilerCode.includes('TODO') &&
            usePerformanceProfilerCode.length > 400,
    error: !usePerformanceProfilerCode.includes('profileComponent')
      ? 'usePerformanceProfiler should implement profileComponent function'
      : !usePerformanceProfilerCode.includes('getProfileSummary')
      ? 'usePerformanceProfiler should implement getProfileSummary function'
      : !usePerformanceProfilerCode.includes('clearProfiles')
      ? 'usePerformanceProfiler should implement clearProfiles function'
      : !usePerformanceProfilerCode.includes('profiles')
      ? 'usePerformanceProfiler should store performance profiles'
      : !usePerformanceProfilerCode.includes('duration')
      ? 'usePerformanceProfiler should track render duration'
      : !usePerformanceProfilerCode.includes('phase')
      ? 'usePerformanceProfiler should track component lifecycle phases'
      : usePerformanceProfilerCode.includes('TODO')
      ? 'usePerformanceProfiler still contains TODO comments - needs implementation'
      : 'usePerformanceProfiler needs substantial implementation with profiling logic',
    executionTime: 1,
  });

  // Test 9: React concurrent features usage
  tests.push({
    name: 'Components properly implement React concurrent features',
    passed: compiledCode.includes('useTransition') && 
            compiledCode.includes('useDeferredValue') &&
            compiledCode.includes('startTransition') &&
            (compiledCode.match(/useTransition/g) || []).length >= 2 &&
            (compiledCode.match(/startTransition/g) || []).length >= 3,
    error: !compiledCode.includes('useTransition')
      ? 'Should use useTransition hook for concurrent features'
      : !compiledCode.includes('useDeferredValue')
      ? 'Should use useDeferredValue for deferred updates'
      : !compiledCode.includes('startTransition')
      ? 'Should use startTransition for non-urgent updates'
      : (compiledCode.match(/useTransition/g) || []).length < 2
      ? 'Should use useTransition in multiple components'
      : 'Should use startTransition in multiple places for proper concurrency',
    executionTime: 1,
  });

  // Test 10: Performance measurement implementation
  tests.push({
    name: 'Components implement accurate performance measurement',
    passed: compiledCode.includes('performance.now') && 
            compiledCode.includes('renderCount') &&
            compiledCode.includes('averageRenderTime') &&
            compiledCode.includes('isExpensive') &&
            (compiledCode.match(/performance\.now/g) || []).length >= 3 &&
            compiledCode.includes('16'), // 16ms threshold for 60fps
    error: !compiledCode.includes('performance.now')
      ? 'Should use performance.now() for accurate timing'
      : !compiledCode.includes('renderCount')
      ? 'Should track render count for performance analysis'
      : !compiledCode.includes('averageRenderTime')
      ? 'Should calculate average render time'
      : !compiledCode.includes('isExpensive')
      ? 'Should detect expensive renders (>16ms)'
      : (compiledCode.match(/performance\.now/g) || []).length < 3
      ? 'Should use performance.now() in multiple measurement points'
      : 'Should use 16ms threshold for expensive render detection',
    executionTime: 1,
  });

  // Test 11: Update batching and prioritization
  tests.push({
    name: 'Components implement intelligent update batching and prioritization',
    passed: compiledCode.includes('urgent') && 
            compiledCode.includes('normal') &&
            compiledCode.includes('low') &&
            compiledCode.includes('batchTimeout') &&
            compiledCode.includes('flushUpdates') &&
            compiledCode.includes('pendingUpdates') &&
            compiledCode.includes('priority'),
    error: !compiledCode.includes('urgent')
      ? 'Should implement urgent priority for immediate updates'
      : !compiledCode.includes('normal')
      ? 'Should implement normal priority for regular updates'
      : !compiledCode.includes('low')
      ? 'Should implement low priority for background updates'
      : !compiledCode.includes('batchTimeout')
      ? 'Should use batch timeout for automatic flushing'
      : !compiledCode.includes('flushUpdates')
      ? 'Should implement manual update flushing'
      : !compiledCode.includes('pendingUpdates')
      ? 'Should track pending updates'
      : 'Should implement comprehensive priority-based update system',
    executionTime: 1,
  });

  // Test 12: Time slicing implementation
  tests.push({
    name: 'Components implement time slicing for large rendering tasks',
    passed: compiledCode.includes('timeSlice') && 
            compiledCode.includes('sliceSize') &&
            compiledCode.includes('setTimeout') &&
            compiledCode.includes('Promise') &&
            compiledCode.includes('resolve') &&
            compiledCode.includes('enableTimeSlicing'),
    error: !compiledCode.includes('timeSlice')
      ? 'Should implement time slicing functionality'
      : !compiledCode.includes('sliceSize')
      ? 'Should use configurable slice size'
      : !compiledCode.includes('setTimeout')
      ? 'Should use setTimeout for yielding control'
      : !compiledCode.includes('Promise')
      ? 'Should use Promises for async time slicing'
      : !compiledCode.includes('enableTimeSlicing')
      ? 'Should provide toggle for time slicing feature'
      : 'Should implement comprehensive time slicing with proper async handling',
    executionTime: 1,
  });

  // Test 13: Main demo component integration
  const demoCode = extractCode(compiledCode, 'RenderOptimizationDemo');
  tests.push({
    name: 'RenderOptimizationDemo integrates all render optimization features',
    passed: demoCode.includes('RenderTracker') && 
            demoCode.includes('BatchedUpdates') &&
            demoCode.includes('ConcurrentRenderer') &&
            demoCode.includes('ExpensiveComponent') &&
            demoCode.includes('usePerformanceProfiler') &&
            demoCode.includes('selectedTool') &&
            demoCode.includes('dataSize') &&
            demoCode.includes('computationLevel') &&
            demoCode.length > 800,
    error: !demoCode.includes('RenderTracker')
      ? 'Demo should include RenderTracker component'
      : !demoCode.includes('BatchedUpdates')
      ? 'Demo should include BatchedUpdates component'
      : !demoCode.includes('ConcurrentRenderer')
      ? 'Demo should include ConcurrentRenderer component'
      : !demoCode.includes('ExpensiveComponent')
      ? 'Demo should include ExpensiveComponent for testing'
      : !demoCode.includes('usePerformanceProfiler')
      ? 'Demo should use usePerformanceProfiler for monitoring'
      : !demoCode.includes('selectedTool')
      ? 'Demo should allow switching between different tools'
      : 'Demo component needs substantial implementation integrating all features',
    executionTime: 1,
  });

  // Test 14: Optimization pattern implementation
  tests.push({
    name: 'Components implement comprehensive React optimization patterns',
    passed: compiledCode.includes('React.memo') && 
            compiledCode.includes('useMemo') &&
            compiledCode.includes('useCallback') &&
            (compiledCode.match(/useMemo/g) || []).length >= 3 &&
            (compiledCode.match(/useCallback/g) || []).length >= 5,
    error: !compiledCode.includes('React.memo')
      ? 'Should use React.memo for component memoization'
      : !compiledCode.includes('useMemo')
      ? 'Should use useMemo for expensive calculations'
      : !compiledCode.includes('useCallback')
      ? 'Should use useCallback for stable function references'
      : (compiledCode.match(/useMemo/g) || []).length < 3
      ? 'Should use useMemo in multiple places for optimization'
      : 'Should use useCallback extensively for function stability',
    executionTime: 1,
  });

  // Test 15: Error handling and browser compatibility
  tests.push({
    name: 'Components implement proper error handling and browser compatibility',
    passed: compiledCode.includes('console.warn') && 
            compiledCode.includes('try') &&
            compiledCode.includes('catch') &&
            compiledCode.includes('clearTimeout') &&
            compiledCode.includes('cleanup') &&
            (compiledCode.includes('typeof') || compiledCode.includes('performance')),
    error: !compiledCode.includes('console.warn')
      ? 'Should warn about performance issues'
      : !compiledCode.includes('try')
      ? 'Should implement error handling with try-catch'
      : !compiledCode.includes('catch')
      ? 'Should handle errors gracefully'
      : !compiledCode.includes('clearTimeout')
      ? 'Should clean up timeouts properly'
      : !compiledCode.includes('cleanup')
      ? 'Should implement proper cleanup patterns'
      : 'Should implement browser compatibility checks',
    executionTime: 1,
  });

  return tests;
}