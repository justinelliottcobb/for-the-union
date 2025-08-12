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

  // Test 1: useBundlePerformance hook implementation
  const useBundlePerfCode = extractCode(compiledCode, 'useBundlePerformance');
  tests.push({
    name: 'useBundlePerformance hook tracks bundle metrics',
    passed: useBundlePerfCode.includes('useRef') && 
            useBundlePerfCode.includes('loadedChunks') &&
            useBundlePerfCode.includes('chunkSizes') &&
            useBundlePerfCode.includes('loadingTimes') &&
            useBundlePerfCode.includes('PerformanceObserver') &&
            useBundlePerfCode.includes('trackDynamicImport') &&
            !useBundlePerfCode.includes('TODO') &&
            useBundlePerfCode.length > 300,
    error: !useBundlePerfCode.includes('useRef')
      ? 'useBundlePerformance should use useRef for metrics storage'
      : !useBundlePerfCode.includes('loadedChunks')
      ? 'useBundlePerformance should track loadedChunks'
      : !useBundlePerfCode.includes('PerformanceObserver')
      ? 'useBundlePerformance should use PerformanceObserver to monitor resource loading'
      : !useBundlePerfCode.includes('trackDynamicImport')
      ? 'useBundlePerformance should provide trackDynamicImport function'
      : useBundlePerfCode.includes('TODO')
      ? 'useBundlePerformance still contains TODO comments - needs implementation'
      : 'useBundlePerformance needs substantial implementation with performance monitoring',
    executionTime: 1,
  });

  // Test 2: React.lazy implementation for HeavyFeatureComponent
  tests.push({
    name: 'HeavyFeatureComponent uses React.lazy for code splitting',
    passed: compiledCode.includes('HeavyFeatureComponent = React.lazy') && 
            compiledCode.includes('setTimeout') &&
            compiledCode.includes('console.log') &&
            compiledCode.includes('Promise.resolve') &&
            !compiledCode.match(/HeavyFeatureComponent.*TODO/),
    error: !compiledCode.includes('HeavyFeatureComponent = React.lazy')
      ? 'HeavyFeatureComponent should use React.lazy'
      : !compiledCode.includes('setTimeout')
      ? 'HeavyFeatureComponent should simulate loading time with setTimeout'
      : !compiledCode.includes('console.log')
      ? 'HeavyFeatureComponent should log loading progress'
      : !compiledCode.includes('Promise.resolve')
      ? 'HeavyFeatureComponent should return Promise.resolve with component'
      : 'HeavyFeatureComponent still contains TODO comments in lazy loading implementation',
    executionTime: 1,
  });

  // Test 3: DynamicImportExample component
  const dynamicImportCode = extractCode(compiledCode, 'DynamicImportExample');
  tests.push({
    name: 'DynamicImportExample handles dynamic feature loading',
    passed: dynamicImportCode.includes('loadChartsModule') && 
            dynamicImportCode.includes('loadEditorModule') &&
            dynamicImportCode.includes('loadAnalyticsModule') &&
            dynamicImportCode.includes('useState') &&
            dynamicImportCode.includes('useEffect') &&
            dynamicImportCode.includes('setLoading') &&
            dynamicImportCode.includes('setTimeout') &&
            !dynamicImportCode.includes('TODO') &&
            dynamicImportCode.length > 500,
    error: !dynamicImportCode.includes('loadChartsModule')
      ? 'DynamicImportExample should implement loadChartsModule'
      : !dynamicImportCode.includes('useState')
      ? 'DynamicImportExample should use useState for loading state'
      : !dynamicImportCode.includes('useEffect')
      ? 'DynamicImportExample should use useEffect to handle feature changes'
      : !dynamicImportCode.includes('setLoading')
      ? 'DynamicImportExample should manage loading state'
      : !dynamicImportCode.includes('setTimeout')
      ? 'DynamicImportExample should simulate loading with setTimeout'
      : dynamicImportCode.includes('TODO')
      ? 'DynamicImportExample still contains TODO comments - needs implementation'
      : 'DynamicImportExample needs substantial implementation with all three feature modules',
    executionTime: 1,
  });

  // Test 4: Dynamic import functions
  tests.push({
    name: 'Dynamic import functions implement async module loading',
    passed: (compiledCode.includes('loadChartsModule') || compiledCode.includes('loadEditorModule') || compiledCode.includes('loadAnalyticsModule')) && 
            compiledCode.includes('async') &&
            (compiledCode.includes('Promise') || compiledCode.includes('setTimeout')),
    error: !(compiledCode.includes('loadChartsModule') || compiledCode.includes('loadEditorModule') || compiledCode.includes('loadAnalyticsModule'))
      ? 'Dynamic import functions not found'
      : !compiledCode.includes('async')
      ? 'Dynamic import functions should be async'
      : 'Dynamic imports should simulate loading with Promise/setTimeout',
    executionTime: 1,
  });

  // Test 5: ChunkedDataGrid component
  const chunkedGridCode = extractCode(compiledCode, 'ChunkedDataGrid');
  tests.push({
    name: 'ChunkedDataGrid implements progressive data loading',
    passed: chunkedGridCode.includes('chunkSize') && 
            chunkedGridCode.includes('loadedChunks') &&
            chunkedGridCode.includes('slice') &&
            chunkedGridCode.includes('loadNextChunk') &&
            chunkedGridCode.includes('useState') &&
            chunkedGridCode.includes('hasMoreData') &&
            !chunkedGridCode.includes('TODO') &&
            chunkedGridCode.length > 400,
    error: !chunkedGridCode.includes('chunkSize')
      ? 'ChunkedDataGrid should use chunkSize prop'
      : !chunkedGridCode.includes('loadedChunks')
      ? 'ChunkedDataGrid should track loaded chunks with state'
      : !chunkedGridCode.includes('slice')
      ? 'ChunkedDataGrid should slice data progressively'
      : !chunkedGridCode.includes('loadNextChunk')
      ? 'ChunkedDataGrid should implement loadNextChunk function'
      : !chunkedGridCode.includes('hasMoreData')
      ? 'ChunkedDataGrid should track if more data is available'
      : chunkedGridCode.includes('TODO')
      ? 'ChunkedDataGrid still contains TODO comments - needs implementation'
      : 'ChunkedDataGrid needs substantial implementation with progressive loading logic',
    executionTime: 1,
  });

  // Test 6: Intersection Observer for progressive loading
  tests.push({
    name: 'ChunkedDataGrid uses Intersection Observer for auto-loading',
    passed: chunkedGridCode.includes('IntersectionObserver') && 
            chunkedGridCode.includes('observerRef') &&
            chunkedGridCode.includes('useEffect') &&
            chunkedGridCode.includes('observe') &&
            chunkedGridCode.includes('disconnect') &&
            chunkedGridCode.includes('isIntersecting'),
    error: !chunkedGridCode.includes('IntersectionObserver')
      ? 'ChunkedDataGrid should use IntersectionObserver for progressive loading'
      : !chunkedGridCode.includes('observerRef')
      ? 'ChunkedDataGrid should use useRef to manage observer reference'
      : !chunkedGridCode.includes('useEffect')
      ? 'ChunkedDataGrid should use useEffect to setup/cleanup observer'
      : !chunkedGridCode.includes('observe')
      ? 'ChunkedDataGrid should call observe() on the trigger element'
      : !chunkedGridCode.includes('isIntersecting')
      ? 'ChunkedDataGrid should check isIntersecting in observer callback'
      : 'ChunkedDataGrid should properly setup and cleanup IntersectionObserver',
    executionTime: 1,
  });

  // Test 7: Route-level lazy loading components
  tests.push({
    name: 'Route components use React.lazy for code splitting',
    passed: (compiledCode.includes('DashboardRoute') || compiledCode.includes('SettingsRoute')) && 
            compiledCode.includes('React.lazy') &&
            compiledCode.includes('Promise'),
    error: !(compiledCode.includes('DashboardRoute') || compiledCode.includes('SettingsRoute'))
      ? 'Route components not found'
      : !compiledCode.includes('React.lazy')
      ? 'Route components should use React.lazy'
      : 'Route lazy loading should use Promise for dynamic imports',
    executionTime: 1,
  });

  // Test 8: LazyLoadedRoute component with Suspense
  const lazyRouteCode = extractCode(compiledCode, 'LazyLoadedRoute');
  tests.push({
    name: 'LazyLoadedRoute handles route-based code splitting',
    passed: lazyRouteCode.includes('route') && 
            (lazyRouteCode.includes('Suspense') || compiledCode.includes('Suspense')) &&
            (lazyRouteCode.includes('_jsx') || lazyRouteCode.includes('<')),
    error: !lazyRouteCode.includes('route')
      ? 'LazyLoadedRoute should handle route prop'
      : !(lazyRouteCode.includes('Suspense') || compiledCode.includes('Suspense'))
      ? 'Should use Suspense for handling loading states'
      : 'LazyLoadedRoute needs JSX implementation',
    executionTime: 1,
  });

  // Test 9: useResourcePreloader hook
  tests.push({
    name: 'useResourcePreloader implements intelligent preloading',
    passed: compiledCode.includes('useResourcePreloader') && 
            (compiledCode.includes('preloadRoute') || compiledCode.includes('preloadFeature')) &&
            compiledCode.includes('useCallback'),
    error: !compiledCode.includes('useResourcePreloader')
      ? 'useResourcePreloader hook not found'
      : !(compiledCode.includes('preloadRoute') || compiledCode.includes('preloadFeature'))
      ? 'useResourcePreloader should provide preload functions'
      : 'useResourcePreloader should use useCallback for optimization',
    executionTime: 1,
  });

  // Test 10: Performance monitoring dashboard
  const performanceDashboardCode = extractCode(compiledCode, 'PerformanceDashboard');
  tests.push({
    name: 'PerformanceDashboard displays bundle metrics',
    passed: performanceDashboardCode.includes('metrics') && 
            (performanceDashboardCode.includes('loadedChunks') || performanceDashboardCode.includes('chunkSizes') || performanceDashboardCode.includes('loadingTimes')) &&
            (performanceDashboardCode.includes('_jsx') || performanceDashboardCode.includes('<')),
    error: !performanceDashboardCode.includes('metrics')
      ? 'PerformanceDashboard should display metrics'
      : !(performanceDashboardCode.includes('loadedChunks') || performanceDashboardCode.includes('chunkSizes') || performanceDashboardCode.includes('loadingTimes'))
      ? 'PerformanceDashboard should show bundle performance data'
      : 'PerformanceDashboard needs JSX implementation',
    executionTime: 1,
  });

  // Test 11: Suspense fallback handling
  tests.push({
    name: 'Suspense boundaries provide loading fallbacks',
    passed: compiledCode.includes('Suspense') && 
            compiledCode.includes('fallback') &&
            (compiledCode.includes('Loading') || compiledCode.includes('loading')),
    error: !compiledCode.includes('Suspense')
      ? 'Should use Suspense for lazy loaded components'
      : !compiledCode.includes('fallback')
      ? 'Suspense should have fallback prop'
      : 'Suspense fallback should show loading state',
    executionTime: 1,
  });

  // Test 12: Performance tracking for dynamic imports
  tests.push({
    name: 'Dynamic imports track loading performance',
    passed: compiledCode.includes('trackDynamicImport') || 
            (compiledCode.includes('performance.now') && compiledCode.includes('console.log')) ||
            (compiledCode.includes('loadTime') && compiledCode.includes('startTime')),
    error: 'Dynamic imports should track loading performance with timing measurements and logging',
    executionTime: 1,
  });

  // Test 13: Error handling for failed chunk loads
  tests.push({
    name: 'Components handle chunk loading errors gracefully',
    passed: (compiledCode.includes('try') && compiledCode.includes('catch')) || 
            compiledCode.includes('error') ||
            compiledCode.includes('Error'),
    error: 'Should implement error handling for failed chunk loads with try/catch or error state',
    executionTime: 1,
  });

  // Test 14: Main demo component integration
  const demoCode = extractCode(compiledCode, 'BundleOptimizationDemo');
  tests.push({
    name: 'BundleOptimizationDemo integrates all optimization features',
    passed: demoCode.includes('useState') && 
            (demoCode.includes('DynamicImportExample') || demoCode.includes('ChunkedDataGrid') || demoCode.includes('Suspense')) &&
            (demoCode.includes('_jsx') || demoCode.includes('<')),
    error: !demoCode.includes('useState')
      ? 'Demo component should manage state'
      : !(demoCode.includes('DynamicImportExample') || demoCode.includes('ChunkedDataGrid') || demoCode.includes('Suspense'))
      ? 'Demo component should use optimization components'
      : 'Demo component needs proper JSX implementation',
    executionTime: 1,
  });

  // Test 15: Bundle size analysis utilities
  tests.push({
    name: 'Bundle analysis provides actionable metrics',
    passed: compiledCode.includes('transferSize') || 
            compiledCode.includes('bundleSize') ||
            (compiledCode.includes('metrics') && compiledCode.includes('size')),
    error: 'Should provide bundle size analysis with transfer size or bundle metrics for optimization insights',
    executionTime: 1,
  });

  return tests;
}