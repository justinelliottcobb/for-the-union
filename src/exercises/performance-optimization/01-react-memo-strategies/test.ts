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

  // Test 1: useRenderPerformance hook implementation
  tests.push({
    name: 'useRenderPerformance hook tracks render metrics',
    passed: compiledCode.includes('useRenderPerformance') && 
            compiledCode.includes('useRef') &&
            (compiledCode.includes('renderCount') || compiledCode.includes('performance')),
    error: !compiledCode.includes('useRenderPerformance') 
      ? 'useRenderPerformance hook not found'
      : !compiledCode.includes('useRef')
      ? 'useRenderPerformance should use useRef for metrics storage'
      : 'useRenderPerformance should track render count and performance',
    executionTime: 1,
  });

  // Test 2: expensiveCalculation function
  const expensiveCalcCode = extractCode(compiledCode, 'expensiveCalculation');
  tests.push({
    name: 'expensiveCalculation function implements heavy computation',
    passed: expensiveCalcCode.includes('for') && 
            (expensiveCalcCode.includes('console.log') || expensiveCalcCode.includes('console.')) &&
            expensiveCalcCode.length > 50,
    error: !expensiveCalcCode.includes('for')
      ? 'expensiveCalculation should use loops for heavy computation'
      : !(expensiveCalcCode.includes('console.log') || expensiveCalcCode.includes('console.'))
      ? 'expensiveCalculation should log when it runs'
      : 'expensiveCalculation needs more substantial implementation',
    executionTime: 1,
  });

  // Test 3: UserCard component with React.memo optimization
  const userCardCode = extractCode(compiledCode, 'UserCard');
  tests.push({
    name: 'UserCard component renders user information',
    passed: (userCardCode.includes('_jsx') || userCardCode.includes('<')) && 
            userCardCode.includes('user.') &&
            !userCardCode.includes('return null'),
    error: !(userCardCode.includes('_jsx') || userCardCode.includes('<'))
      ? 'UserCard component needs JSX implementation'
      : !userCardCode.includes('user.')
      ? 'UserCard should display user properties'
      : 'UserCard component implementation is incomplete',
    executionTime: 1,
  });

  // Test 4: OptimizedUserCard with React.memo
  tests.push({
    name: 'OptimizedUserCard uses React.memo with custom comparison',
    passed: compiledCode.includes('OptimizedUserCard') && 
            compiledCode.includes('memo(') &&
            compiledCode.includes('UserCard'),
    error: !compiledCode.includes('OptimizedUserCard')
      ? 'OptimizedUserCard component not found'
      : !compiledCode.includes('memo(')
      ? 'OptimizedUserCard should use React.memo'
      : 'OptimizedUserCard should wrap UserCard with memo',
    executionTime: 1,
  });

  // Test 5: ExpensiveList component with useMemo optimization
  const expensiveListCode = extractCode(compiledCode, 'ExpensiveList');
  tests.push({
    name: 'ExpensiveList uses useMemo for expensive operations',
    passed: expensiveListCode.includes('useMemo') && 
            (expensiveListCode.includes('filter') || expensiveListCode.includes('sort')) &&
            expensiveListCode.includes('processedItems'),
    error: !expensiveListCode.includes('useMemo')
      ? 'ExpensiveList should use useMemo for optimization'
      : !(expensiveListCode.includes('filter') || expensiveListCode.includes('sort'))
      ? 'ExpensiveList should filter and sort items'
      : 'ExpensiveList needs processedItems with useMemo',
    executionTime: 1,
  });

  // Test 6: MemoizedForm component with useCallback optimization
  const memoizedFormCode = extractCode(compiledCode, 'MemoizedForm');
  tests.push({
    name: 'MemoizedForm uses useCallback for stable handlers',
    passed: memoizedFormCode.includes('useCallback') && 
            (memoizedFormCode.includes('handleFieldChange') || memoizedFormCode.includes('handleSubmit')) &&
            memoizedFormCode.includes('formData'),
    error: !memoizedFormCode.includes('useCallback')
      ? 'MemoizedForm should use useCallback for handlers'
      : !(memoizedFormCode.includes('handleFieldChange') || memoizedFormCode.includes('handleSubmit'))
      ? 'MemoizedForm should have optimized event handlers'
      : 'MemoizedForm needs form data state management',
    executionTime: 1,
  });

  // Test 7: FieldComponent with React.memo
  tests.push({
    name: 'FieldComponent optimized with React.memo',
    passed: compiledCode.includes('FieldComponent') && 
            compiledCode.includes('memo(') &&
            (compiledCode.includes('field') || compiledCode.includes('onChange')),
    error: !compiledCode.includes('FieldComponent')
      ? 'FieldComponent not found'
      : !compiledCode.includes('memo(')
      ? 'FieldComponent should be wrapped with React.memo'
      : 'FieldComponent should handle field props and events',
    executionTime: 1,
  });

  // Test 8: Performance tracking integration
  tests.push({
    name: 'Components integrate performance tracking',
    passed: compiledCode.includes('useRenderPerformance') && 
            compiledCode.includes('metrics') &&
            (compiledCode.includes('renderCount') || compiledCode.includes('performance')),
    error: !compiledCode.includes('useRenderPerformance')
      ? 'Components should use useRenderPerformance hook'
      : !compiledCode.includes('metrics')
      ? 'Performance metrics should be accessible'
      : 'Performance tracking not properly integrated',
    executionTime: 1,
  });

  // Test 9: Custom comparison function for memo
  tests.push({
    name: 'Custom comparison function implemented for memo optimization',
    passed: (compiledCode.includes('prevProps') && compiledCode.includes('nextProps')) ||
            compiledCode.includes('comparison') ||
            compiledCode.includes('areEqual'),
    error: 'Custom comparison function should compare prevProps and nextProps for memo optimization',
    executionTime: 1,
  });

  // Test 10: Main demo component implementation
  const demoCode = extractCode(compiledCode, 'ReactMemoStrategiesDemo');
  tests.push({
    name: 'ReactMemoStrategiesDemo component integrates all features',
    passed: demoCode.includes('useState') && 
            (demoCode.includes('OptimizedUserCard') || demoCode.includes('ExpensiveList') || demoCode.includes('MemoizedForm')) &&
            (demoCode.includes('_jsx') || demoCode.includes('<')),
    error: !demoCode.includes('useState')
      ? 'Demo component should manage state'
      : !(demoCode.includes('OptimizedUserCard') || demoCode.includes('ExpensiveList') || demoCode.includes('MemoizedForm'))
      ? 'Demo component should use the optimized components'
      : 'Demo component needs proper JSX implementation',
    executionTime: 1,
  });

  // Test 11: useCallback usage for event handlers
  tests.push({
    name: 'Event handlers use useCallback for optimization',
    passed: compiledCode.includes('useCallback') && 
            (compiledCode.includes('handleUserSelect') || compiledCode.includes('handleFormSubmit') || compiledCode.includes('handleFieldChange')),
    error: 'Event handlers should use useCallback to maintain reference stability and prevent unnecessary re-renders',
    executionTime: 1,
  });

  // Test 12: Dependencies arrays for optimization hooks
  tests.push({
    name: 'Optimization hooks have proper dependency arrays',
    passed: compiledCode.includes('useMemo(') && 
            compiledCode.includes('useCallback(') &&
            (compiledCode.includes('], [') || compiledCode.includes(',[') || compiledCode.includes('], []')),
    error: 'useMemo and useCallback should include proper dependency arrays for correct optimization',
    executionTime: 1,
  });

  return tests;
}