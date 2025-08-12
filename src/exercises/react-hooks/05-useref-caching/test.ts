import type { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Helper function to extract class/component code
  function extractComponentCode(code: string, componentName: string): string {
    // Try class pattern first for LRUCache
    if (componentName === 'LRUCache') {
      const classPattern = new RegExp(`class ${componentName}[\\s\\S]*?{([\\s\\S]*?)}\\s*(?=class|function|export|$)`, 'i');
      const match = code.match(classPattern);
      if (match) return match[1];
    }
    
    // Standard function pattern
    let functionPattern = new RegExp(`function ${componentName}\\(.*?\\)\\s*{([\\s\\S]*?)}(?=\\s*(?:function|export|class|$))`, 'i');
    let match = code.match(functionPattern);
    
    if (!match) {
      // Try a more flexible pattern that looks for the function and captures everything until the next function or end
      const startPattern = new RegExp(`function ${componentName}\\(.*?\\)\\s*{`, 'i');
      const startMatch = code.match(startPattern);
      
      if (startMatch) {
        const startIndex = code.indexOf(startMatch[0]) + startMatch[0].length;
        let braceCount = 1;
        let endIndex = startIndex;
        
        // Find the matching closing brace
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

  // Check LRUCache class implementation
  const lruCacheSection = extractComponentCode(compiledCode, 'LRUCache');
  tests.push({
    name: 'LRUCache class implementation',
    passed: lruCacheSection.includes('Map') &&
            lruCacheSection.includes('get') &&
            lruCacheSection.includes('set') &&
            lruCacheSection.includes('clear') &&
            lruCacheSection.includes('size') &&
            !lruCacheSection.includes('return undefined') &&
            !lruCacheSection.includes('return 0'),
    error: lruCacheSection.includes('Map') &&
           lruCacheSection.includes('get') &&
           lruCacheSection.includes('set') &&
           lruCacheSection.includes('clear') &&
           lruCacheSection.includes('size') &&
           !lruCacheSection.includes('return undefined') &&
           !lruCacheSection.includes('return 0')
      ? undefined 
      : 'LRUCache class needs Map, get/set/clear/size methods with proper implementation',
    executionTime: 1,
  });

  // Check useComputationCache custom hook
  const useComputationCacheSection = extractComponentCode(compiledCode, 'useComputationCache');
  tests.push({
    name: 'useComputationCache custom hook implementation',
    passed: useComputationCacheSection.includes('useRef') &&
            useComputationCacheSection.includes('LRUCache') &&
            useComputationCacheSection.includes('useEffect') &&
            !useComputationCacheSection.includes('return computeFn'),
    error: useComputationCacheSection.includes('useRef') &&
           useComputationCacheSection.includes('LRUCache') &&
           useComputationCacheSection.includes('useEffect') &&
           !useComputationCacheSection.includes('return computeFn')
      ? undefined 
      : 'useComputationCache hook needs useRef, LRUCache, useEffect, and proper memoization',
    executionTime: 1,
  });

  // Check useApiCache custom hook
  const useApiCacheSection = extractComponentCode(compiledCode, 'useApiCache');
  tests.push({
    name: 'useApiCache custom hook implementation',
    passed: useApiCacheSection.includes('useState') &&
            useApiCacheSection.includes('useRef') &&
            useApiCacheSection.includes('useEffect') &&
            useApiCacheSection.includes('refetch') &&
            useApiCacheSection.includes('clearCache') &&
            !useApiCacheSection.includes('data: null as T | null'),
    error: useApiCacheSection.includes('useState') &&
           useApiCacheSection.includes('useRef') &&
           useApiCacheSection.includes('useEffect') &&
           useApiCacheSection.includes('refetch') &&
           useApiCacheSection.includes('clearCache') &&
           !useApiCacheSection.includes('data: null as T | null')
      ? undefined 
      : 'useApiCache hook needs useState, useRef, useEffect, refetch, and clearCache functions',
    executionTime: 1,
  });

  // Check usePrevious custom hook
  const usePreviousSection = extractComponentCode(compiledCode, 'usePrevious');
  tests.push({
    name: 'usePrevious custom hook implementation',
    passed: usePreviousSection.includes('useRef') &&
            usePreviousSection.includes('useEffect') &&
            !usePreviousSection.includes('return undefined'),
    error: usePreviousSection.includes('useRef') &&
           usePreviousSection.includes('useEffect') &&
           !usePreviousSection.includes('return undefined')
      ? undefined 
      : 'usePrevious hook needs useRef and useEffect to track previous values',
    executionTime: 1,
  });

  // Check useRenderCount custom hook
  const useRenderCountSection = extractComponentCode(compiledCode, 'useRenderCount');
  tests.push({
    name: 'useRenderCount custom hook implementation',
    passed: useRenderCountSection.includes('useRef') &&
            !useRenderCountSection.includes('return 0'),
    error: useRenderCountSection.includes('useRef') &&
           !useRenderCountSection.includes('return 0')
      ? undefined 
      : 'useRenderCount hook needs useRef to track render count',
    executionTime: 1,
  });

  // Check useLatestCallback custom hook
  const useLatestCallbackSection = extractComponentCode(compiledCode, 'useLatestCallback');
  tests.push({
    name: 'useLatestCallback custom hook implementation',
    passed: useLatestCallbackSection.includes('useRef') &&
            useLatestCallbackSection.includes('useCallback') &&
            !useLatestCallbackSection.includes('return callback'),
    error: useLatestCallbackSection.includes('useRef') &&
           useLatestCallbackSection.includes('useCallback') &&
           !useLatestCallbackSection.includes('return callback')
      ? undefined 
      : 'useLatestCallback hook needs useRef and useCallback for stable callback reference',
    executionTime: 1,
  });

  // Check useFocusManager custom hook
  const useFocusManagerSection = extractComponentCode(compiledCode, 'useFocusManager');
  tests.push({
    name: 'useFocusManager custom hook implementation',
    passed: useFocusManagerSection.includes('focus') &&
            useFocusManagerSection.includes('blur') &&
            useFocusManagerSection.includes('focusNext') &&
            useFocusManagerSection.includes('focusPrevious'),
    error: useFocusManagerSection.includes('focus') &&
           useFocusManagerSection.includes('blur') &&
           useFocusManagerSection.includes('focusNext') &&
           useFocusManagerSection.includes('focusPrevious')
      ? undefined 
      : 'useFocusManager hook needs focus, blur, focusNext, and focusPrevious functions',
    executionTime: 1,
  });

  // Check ExpensiveCalculator component
  const expensiveCalculatorSection = extractComponentCode(compiledCode, 'ExpensiveCalculator');
  tests.push({
    name: 'ExpensiveCalculator component implementation',
    passed: (expensiveCalculatorSection.includes('_jsx') || expensiveCalculatorSection.includes('<')) && 
            expensiveCalculatorSection.includes('useState') &&
            expensiveCalculatorSection.includes('useComputationCache') &&
            !expensiveCalculatorSection.includes('return null'),
    error: (expensiveCalculatorSection.includes('_jsx') || expensiveCalculatorSection.includes('<')) && 
           expensiveCalculatorSection.includes('useState') &&
           expensiveCalculatorSection.includes('useComputationCache') &&
           !expensiveCalculatorSection.includes('return null')
      ? undefined 
      : 'ExpensiveCalculator component needs JSX with useState and useComputationCache (not return null)',
    executionTime: 1,
  });

  // Check ApiCacheDemo component
  const apiCacheDemoSection = extractComponentCode(compiledCode, 'ApiCacheDemo');
  tests.push({
    name: 'ApiCacheDemo component implementation',
    passed: (apiCacheDemoSection.includes('_jsx') || apiCacheDemoSection.includes('<')) && 
            apiCacheDemoSection.includes('useApiCache') &&
            apiCacheDemoSection.includes('useState') &&
            !apiCacheDemoSection.includes('return null'),
    error: (apiCacheDemoSection.includes('_jsx') || apiCacheDemoSection.includes('<')) && 
           apiCacheDemoSection.includes('useApiCache') &&
           apiCacheDemoSection.includes('useState') &&
           !apiCacheDemoSection.includes('return null')
      ? undefined 
      : 'ApiCacheDemo component needs JSX with useApiCache and useState (not return null)',
    executionTime: 1,
  });

  // Check PreviousValueDemo component
  const previousValueDemoSection = extractComponentCode(compiledCode, 'PreviousValueDemo');
  tests.push({
    name: 'PreviousValueDemo component implementation',
    passed: (previousValueDemoSection.includes('_jsx') || previousValueDemoSection.includes('<')) && 
            previousValueDemoSection.includes('usePrevious') &&
            previousValueDemoSection.includes('useRenderCount') &&
            !previousValueDemoSection.includes('return null'),
    error: (previousValueDemoSection.includes('_jsx') || previousValueDemoSection.includes('<')) && 
           previousValueDemoSection.includes('usePrevious') &&
           previousValueDemoSection.includes('useRenderCount') &&
           !previousValueDemoSection.includes('return null')
      ? undefined 
      : 'PreviousValueDemo component needs JSX with usePrevious and useRenderCount (not return null)',
    executionTime: 1,
  });

  // Check FocusManagerDemo component
  const focusManagerDemoSection = extractComponentCode(compiledCode, 'FocusManagerDemo');
  tests.push({
    name: 'FocusManagerDemo component implementation',
    passed: (focusManagerDemoSection.includes('_jsx') || focusManagerDemoSection.includes('<')) && 
            focusManagerDemoSection.includes('useFocusManager') &&
            !focusManagerDemoSection.includes('return null'),
    error: (focusManagerDemoSection.includes('_jsx') || focusManagerDemoSection.includes('<')) && 
           focusManagerDemoSection.includes('useFocusManager') &&
           !focusManagerDemoSection.includes('return null')
      ? undefined 
      : 'FocusManagerDemo component needs JSX with useFocusManager (not return null)',
    executionTime: 1,
  });

  // Check PerformanceMonitor component
  const performanceMonitorSection = extractComponentCode(compiledCode, 'PerformanceMonitor');
  tests.push({
    name: 'PerformanceMonitor component implementation',
    passed: (performanceMonitorSection.includes('_jsx') || performanceMonitorSection.includes('<')) && 
            performanceMonitorSection.includes('useRenderCount') &&
            performanceMonitorSection.includes('useRef') &&
            performanceMonitorSection.includes('children') &&
            !performanceMonitorSection.includes('return null'),
    error: (performanceMonitorSection.includes('_jsx') || performanceMonitorSection.includes('<')) && 
           performanceMonitorSection.includes('useRenderCount') &&
           performanceMonitorSection.includes('useRef') &&
           performanceMonitorSection.includes('children') &&
           !performanceMonitorSection.includes('return null')
      ? undefined 
      : 'PerformanceMonitor component needs JSX with useRenderCount, useRef, and children rendering (not return null)',
    executionTime: 1,
  });

  return tests;
}