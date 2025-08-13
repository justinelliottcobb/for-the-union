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
      // Try class pattern
      pattern = new RegExp(`class ${name}[\\s\\S]*?{([\\s\\S]*?)}(?=\\s*(?:function|export|const|class|$))`, 'i');
      match = code.match(pattern);
    }
    
    if (!match) {
      // Try more flexible pattern with brace counting
      const startPattern = new RegExp(`(?:function|const|class)\\s+${name}[\\s\\S]*?{`, 'i');
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

  // Test 1: useMemoryMonitor hook implementation
  const useMemoryMonitorCode = extractCode(compiledCode, 'useMemoryMonitor');
  tests.push({
    name: 'useMemoryMonitor hook tracks memory usage and detects leaks',
    passed: useMemoryMonitorCode.includes('performance.memory') && 
            useMemoryMonitorCode.includes('usedJSHeapSize') &&
            useMemoryMonitorCode.includes('useState') &&
            useMemoryMonitorCode.includes('useRef') &&
            useMemoryMonitorCode.includes('setInterval') &&
            useMemoryMonitorCode.includes('detectLeak') &&
            !useMemoryMonitorCode.includes('TODO') &&
            useMemoryMonitorCode.length > 800,
    error: !useMemoryMonitorCode.includes('performance.memory')
      ? 'useMemoryMonitor should use performance.memory API for memory tracking'
      : !useMemoryMonitorCode.includes('usedJSHeapSize')
      ? 'useMemoryMonitor should track usedJSHeapSize from memory API'
      : !useMemoryMonitorCode.includes('useState')
      ? 'useMemoryMonitor should use useState for metrics state'
      : !useMemoryMonitorCode.includes('setInterval')
      ? 'useMemoryMonitor should use setInterval for periodic monitoring'
      : !useMemoryMonitorCode.includes('detectLeak')
      ? 'useMemoryMonitor should implement leak detection algorithm'
      : useMemoryMonitorCode.includes('TODO')
      ? 'useMemoryMonitor still contains TODO comments - needs implementation'
      : 'useMemoryMonitor needs substantial implementation with memory monitoring logic',
    executionTime: 1,
  });

  // Test 2: useMemoryProfiler hook implementation
  const useMemoryProfilerCode = extractCode(compiledCode, 'useMemoryProfiler');
  tests.push({
    name: 'useMemoryProfiler provides component-specific memory profiling',
    passed: useMemoryProfilerCode.includes('useRef') && 
            useMemoryProfilerCode.includes('startProfiling') &&
            useMemoryProfilerCode.includes('stopProfiling') &&
            useMemoryProfilerCode.includes('getProfile') &&
            useMemoryProfilerCode.includes('performance.now') &&
            useMemoryProfilerCode.includes('componentName') &&
            !useMemoryProfilerCode.includes('TODO') &&
            useMemoryProfilerCode.length > 400,
    error: !useMemoryProfilerCode.includes('startProfiling')
      ? 'useMemoryProfiler should implement startProfiling function'
      : !useMemoryProfilerCode.includes('stopProfiling')
      ? 'useMemoryProfiler should implement stopProfiling function'
      : !useMemoryProfilerCode.includes('getProfile')
      ? 'useMemoryProfiler should implement getProfile function'
      : !useMemoryProfilerCode.includes('performance.now')
      ? 'useMemoryProfiler should use performance.now for timing measurements'
      : useMemoryProfilerCode.includes('TODO')
      ? 'useMemoryProfiler still contains TODO comments - needs implementation'
      : 'useMemoryProfiler needs substantial implementation with profiling logic',
    executionTime: 1,
  });

  // Test 3: LeakyComponent with memory leak demonstrations
  const leakyComponentCode = extractCode(compiledCode, 'LeakyComponent');
  tests.push({
    name: 'LeakyComponent demonstrates multiple types of memory leaks',
    passed: leakyComponentCode.includes('addEventListener') && 
            leakyComponentCode.includes('setInterval') &&
            leakyComponentCode.includes('useEffect') &&
            leakyComponentCode.includes('enableLeaks') &&
            leakyComponentCode.includes('removeEventListener') &&
            leakyComponentCode.includes('clearInterval') &&
            !leakyComponentCode.includes('TODO') &&
            leakyComponentCode.length > 1000,
    error: !leakyComponentCode.includes('addEventListener')
      ? 'LeakyComponent should demonstrate event listener leaks'
      : !leakyComponentCode.includes('setInterval')
      ? 'LeakyComponent should demonstrate interval timer leaks'
      : !leakyComponentCode.includes('enableLeaks')
      ? 'LeakyComponent should conditionally enable/disable leaks based on enableLeaks prop'
      : !leakyComponentCode.includes('removeEventListener')
      ? 'LeakyComponent should show proper event listener cleanup'
      : !leakyComponentCode.includes('clearInterval')
      ? 'LeakyComponent should show proper interval cleanup'
      : leakyComponentCode.includes('TODO')
      ? 'LeakyComponent still contains TODO comments - needs implementation'
      : 'LeakyComponent needs substantial implementation with multiple leak types',
    executionTime: 1,
  });

  // Test 4: CleanupExample with proper resource cleanup
  const cleanupExampleCode = extractCode(compiledCode, 'CleanupExample');
  tests.push({
    name: 'CleanupExample demonstrates proper cleanup patterns',
    passed: cleanupExampleCode.includes('AbortController') && 
            cleanupExampleCode.includes('addEventListener') &&
            cleanupExampleCode.includes('removeEventListener') &&
            cleanupExampleCode.includes('useEffect') &&
            cleanupExampleCode.includes('useCallback') &&
            cleanupExampleCode.includes('abortControllerRef') &&
            !cleanupExampleCode.includes('TODO') &&
            cleanupExampleCode.length > 800,
    error: !cleanupExampleCode.includes('AbortController')
      ? 'CleanupExample should use AbortController for fetch request cleanup'
      : !cleanupExampleCode.includes('addEventListener')
      ? 'CleanupExample should demonstrate event listener management'
      : !cleanupExampleCode.includes('removeEventListener')
      ? 'CleanupExample should properly remove event listeners'
      : !cleanupExampleCode.includes('abortControllerRef')
      ? 'CleanupExample should use ref to manage AbortController'
      : cleanupExampleCode.includes('TODO')
      ? 'CleanupExample still contains TODO comments - needs implementation'
      : 'CleanupExample needs substantial implementation with cleanup patterns',
    executionTime: 1,
  });

  // Test 5: ObjectRegistry using WeakMap
  const objectRegistryCode = extractCode(compiledCode, 'ObjectRegistry');
  tests.push({
    name: 'ObjectRegistry uses WeakMap for automatic garbage collection',
    passed: objectRegistryCode.includes('WeakMap') && 
            objectRegistryCode.includes('associate') &&
            objectRegistryCode.includes('getMetadata') &&
            objectRegistryCode.includes('hasMetadata') &&
            objectRegistryCode.includes('set') &&
            objectRegistryCode.includes('get') &&
            !objectRegistryCode.includes('TODO') &&
            objectRegistryCode.length > 200,
    error: !objectRegistryCode.includes('WeakMap')
      ? 'ObjectRegistry should use WeakMap for object associations'
      : !objectRegistryCode.includes('associate')
      ? 'ObjectRegistry should implement associate method'
      : !objectRegistryCode.includes('getMetadata')
      ? 'ObjectRegistry should implement getMetadata method'
      : !objectRegistryCode.includes('set')
      ? 'ObjectRegistry should use WeakMap.set for storing metadata'
      : !objectRegistryCode.includes('get')
      ? 'ObjectRegistry should use WeakMap.get for retrieving metadata'
      : objectRegistryCode.includes('TODO')
      ? 'ObjectRegistry still contains TODO comments - needs implementation'
      : 'ObjectRegistry needs substantial implementation with WeakMap usage',
    executionTime: 1,
  });

  // Test 6: MemoryMonitorDashboard component
  const memoryDashboardCode = extractCode(compiledCode, 'MemoryMonitorDashboard');
  tests.push({
    name: 'MemoryMonitorDashboard displays memory metrics and controls',
    passed: memoryDashboardCode.includes('useMemoryMonitor') && 
            memoryDashboardCode.includes('startMonitoring') &&
            memoryDashboardCode.includes('stopMonitoring') &&
            memoryDashboardCode.includes('metrics') &&
            (memoryDashboardCode.includes('_jsx') || memoryDashboardCode.includes('<')) &&
            !memoryDashboardCode.includes('TODO') &&
            memoryDashboardCode.length > 300,
    error: !memoryDashboardCode.includes('useMemoryMonitor')
      ? 'MemoryMonitorDashboard should use useMemoryMonitor hook'
      : !memoryDashboardCode.includes('startMonitoring')
      ? 'MemoryMonitorDashboard should provide startMonitoring control'
      : !memoryDashboardCode.includes('stopMonitoring')
      ? 'MemoryMonitorDashboard should provide stopMonitoring control'
      : !(memoryDashboardCode.includes('_jsx') || memoryDashboardCode.includes('<'))
      ? 'MemoryMonitorDashboard should render UI components'
      : memoryDashboardCode.includes('TODO')
      ? 'MemoryMonitorDashboard still contains TODO comments - needs implementation'
      : 'MemoryMonitorDashboard needs substantial implementation with metrics display',
    executionTime: 1,
  });

  // Test 7: useLeakDetector hook implementation
  tests.push({
    name: 'useLeakDetector provides leak detection utilities',
    passed: compiledCode.includes('useLeakDetector') && 
            compiledCode.includes('startDetection') &&
            compiledCode.includes('stopDetection') &&
            compiledCode.includes('getLeakReport') &&
            compiledCode.includes('isDetecting'),
    error: !compiledCode.includes('useLeakDetector')
      ? 'useLeakDetector hook not found'
      : !compiledCode.includes('startDetection')
      ? 'useLeakDetector should provide startDetection function'
      : !compiledCode.includes('stopDetection')
      ? 'useLeakDetector should provide stopDetection function'
      : !compiledCode.includes('getLeakReport')
      ? 'useLeakDetector should provide getLeakReport function'
      : 'useLeakDetector should provide isDetecting state',
    executionTime: 1,
  });

  // Test 8: Event listener cleanup implementation
  tests.push({
    name: 'Components properly clean up event listeners',
    passed: compiledCode.includes('addEventListener') && 
            compiledCode.includes('removeEventListener') &&
            (compiledCode.match(/addEventListener/g) || []).length === 
            (compiledCode.match(/removeEventListener/g) || []).length,
    error: !compiledCode.includes('addEventListener')
      ? 'Components should add event listeners for demonstration'
      : !compiledCode.includes('removeEventListener')
      ? 'Components must remove event listeners to prevent leaks'
      : 'Number of addEventListener calls should match removeEventListener calls for proper cleanup',
    executionTime: 1,
  });

  // Test 9: AbortController usage for request cleanup
  tests.push({
    name: 'Components use AbortController for request cancellation',
    passed: compiledCode.includes('AbortController') && 
            compiledCode.includes('abort()') &&
            compiledCode.includes('signal') &&
            (compiledCode.includes('abortControllerRef') || compiledCode.includes('abortController')),
    error: !compiledCode.includes('AbortController')
      ? 'Should use AbortController for request cancellation'
      : !compiledCode.includes('abort()')
      ? 'Should call abort() method to cancel requests'
      : !compiledCode.includes('signal')
      ? 'Should use signal property for request cancellation'
      : 'Should store AbortController reference for cleanup',
    executionTime: 1,
  });

  // Test 10: Memory leak prevention patterns
  tests.push({
    name: 'Components implement comprehensive memory leak prevention',
    passed: compiledCode.includes('useEffect') && 
            compiledCode.includes('return () =>') &&
            compiledCode.includes('clearInterval') &&
            compiledCode.includes('performance.memory') &&
            !compiledCode.includes('// TODO:'),
    error: !compiledCode.includes('useEffect')
      ? 'Should use useEffect for lifecycle management'
      : !compiledCode.includes('return () =>')
      ? 'Should use cleanup functions in useEffect'
      : !compiledCode.includes('clearInterval')
      ? 'Should clear intervals to prevent timer leaks'
      : !compiledCode.includes('performance.memory')
      ? 'Should use performance.memory API for memory monitoring'
      : 'Should not contain TODO comments in implementation',
    executionTime: 1,
  });

  // Test 11: Main demo component integration
  const demoCode = extractCode(compiledCode, 'MemoryLeakPreventionDemo');
  tests.push({
    name: 'MemoryLeakPreventionDemo integrates all memory management features',
    passed: demoCode.includes('LeakyComponent') && 
            demoCode.includes('CleanupExample') &&
            demoCode.includes('MemoryMonitorDashboard') &&
            demoCode.includes('enableLeaks') &&
            demoCode.includes('useState') &&
            (demoCode.includes('_jsx') || demoCode.includes('<')) &&
            demoCode.length > 500,
    error: !demoCode.includes('LeakyComponent')
      ? 'Demo should include LeakyComponent'
      : !demoCode.includes('CleanupExample')
      ? 'Demo should include CleanupExample'
      : !demoCode.includes('MemoryMonitorDashboard')
      ? 'Demo should include MemoryMonitorDashboard'
      : !demoCode.includes('enableLeaks')
      ? 'Demo should control leak behavior with enableLeaks state'
      : 'Demo component needs substantial implementation integrating all features',
    executionTime: 1,
  });

  // Test 12: Performance monitoring integration
  tests.push({
    name: 'Components integrate performance monitoring and profiling',
    passed: compiledCode.includes('useMemoryProfiler') && 
            compiledCode.includes('startProfiling') &&
            compiledCode.includes('stopProfiling') &&
            (compiledCode.includes('console.log') || compiledCode.includes('console.')) &&
            compiledCode.includes('componentName'),
    error: !compiledCode.includes('useMemoryProfiler')
      ? 'Components should use useMemoryProfiler for performance tracking'
      : !compiledCode.includes('startProfiling')
      ? 'Components should call startProfiling to begin monitoring'
      : !compiledCode.includes('stopProfiling')
      ? 'Components should call stopProfiling to end monitoring'
      : !(compiledCode.includes('console.log') || compiledCode.includes('console.'))
      ? 'Should log profiling information for debugging'
      : 'Should pass componentName to profiler for identification',
    executionTime: 1,
  });

  return tests;
}