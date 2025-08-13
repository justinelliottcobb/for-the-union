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
  const useRenderPerfCode = extractCode(compiledCode, 'useRenderPerformance');
  tests.push({
    name: 'useRenderPerformance hook tracks render metrics',
    passed: useRenderPerfCode.includes('useRef') && 
            useRenderPerfCode.includes('renderCount') &&
            useRenderPerfCode.includes('performance.now') &&
            useRenderPerfCode.includes('useEffect') &&
            useRenderPerfCode.length > 200, // Requires substantial implementation
    error: !useRenderPerfCode.includes('useRef')
      ? 'useRenderPerformance should use useRef for metrics storage'
      : !useRenderPerfCode.includes('renderCount')
      ? 'useRenderPerformance should track renderCount'
      : !useRenderPerfCode.includes('performance.now')
      ? 'useRenderPerformance should use performance.now() for timing'
      : !useRenderPerfCode.includes('useEffect')
      ? 'useRenderPerformance should use useEffect for timing logic'
      : 'useRenderPerformance needs more substantial implementation',
    executionTime: 1,
  });

  // Test 2: expensiveCalculation function
  const expensiveCalcCode = extractCode(compiledCode, 'expensiveCalculation');
  tests.push({
    name: 'expensiveCalculation function implements heavy computation',
    passed: expensiveCalcCode.includes('for') && 
            expensiveCalcCode.includes('console.log') &&
            expensiveCalcCode.includes('items.length') &&
            expensiveCalcCode.includes('return') &&
            !expensiveCalcCode.includes('TODO') &&
            expensiveCalcCode.length > 150, // Requires substantial loops and logic
    error: !expensiveCalcCode.includes('for')
      ? 'expensiveCalculation should use loops for heavy computation'
      : !expensiveCalcCode.includes('console.log')
      ? 'expensiveCalculation should log when it runs'
      : !expensiveCalcCode.includes('items.length')
      ? 'expensiveCalculation should process the items array'
      : expensiveCalcCode.includes('TODO')
      ? 'expensiveCalculation still contains TODO comments - needs implementation'
      : 'expensiveCalculation needs more substantial implementation with nested loops',
    executionTime: 1,
  });

  // Test 3: UserCard component with React.memo optimization
  const userCardCode = extractCode(compiledCode, 'UserCard');
  tests.push({
    name: 'UserCard component renders user information',
    passed: (userCardCode.includes('_jsx') || userCardCode.includes('<')) && 
            userCardCode.includes('user.name') &&
            userCardCode.includes('user.email') &&
            userCardCode.includes('onClick') &&
            userCardCode.includes('useCallback') &&
            !userCardCode.includes('TODO') &&
            userCardCode.length > 200,
    error: !(userCardCode.includes('_jsx') || userCardCode.includes('<'))
      ? 'UserCard component needs JSX implementation'
      : !userCardCode.includes('user.name') || !userCardCode.includes('user.email')
      ? 'UserCard should display user.name and user.email'
      : !userCardCode.includes('onClick')
      ? 'UserCard should handle click events'
      : !userCardCode.includes('useCallback')
      ? 'UserCard should use useCallback for event handlers'
      : userCardCode.includes('TODO')
      ? 'UserCard still contains TODO comments - needs implementation'
      : 'UserCard component needs more substantial implementation',
    executionTime: 1,
  });

  // Test 4: OptimizedUserCard with React.memo
  tests.push({
    name: 'OptimizedUserCard uses React.memo with custom comparison',
    passed: compiledCode.includes('OptimizedUserCard') && 
            compiledCode.includes('memo(UserCard,') &&
            (compiledCode.includes('prevProps') && compiledCode.includes('nextProps')),
    error: !compiledCode.includes('OptimizedUserCard')
      ? 'OptimizedUserCard component not found'
      : !compiledCode.includes('memo(UserCard,')
      ? 'OptimizedUserCard should use React.memo with UserCard and custom comparison'
      : !(compiledCode.includes('prevProps') && compiledCode.includes('nextProps'))
      ? 'OptimizedUserCard should have custom comparison function with prevProps and nextProps'
      : 'OptimizedUserCard needs custom comparison function implementation',
    executionTime: 1,
  });

  // Test 5: ExpensiveList component with useMemo optimization
  const expensiveListCode = extractCode(compiledCode, 'ExpensiveList');
  tests.push({
    name: 'ExpensiveList uses useMemo for expensive operations',
    passed: expensiveListCode.includes('useMemo') && 
            expensiveListCode.includes('filter') &&
            expensiveListCode.includes('sort') &&
            expensiveListCode.includes('processedItems') &&
            expensiveListCode.includes('expensiveCalculation') &&
            !expensiveListCode.includes('TODO') &&
            expensiveListCode.length > 300,
    error: !expensiveListCode.includes('useMemo')
      ? 'ExpensiveList should use useMemo for optimization'
      : !expensiveListCode.includes('filter')
      ? 'ExpensiveList should filter items based on threshold'
      : !expensiveListCode.includes('sort')
      ? 'ExpensiveList should sort items by direction'
      : !expensiveListCode.includes('expensiveCalculation')
      ? 'ExpensiveList should call expensiveCalculation on items'
      : expensiveListCode.includes('TODO')
      ? 'ExpensiveList still contains TODO comments - needs implementation'
      : 'ExpensiveList needs more substantial implementation with filtering, sorting, and expensive calculations',
    executionTime: 1,
  });

  // Test 6: MemoizedForm component with useCallback optimization
  const memoizedFormCode = extractCode(compiledCode, 'MemoizedForm');
  tests.push({
    name: 'MemoizedForm uses useCallback for stable handlers',
    passed: memoizedFormCode.includes('useCallback') && 
            memoizedFormCode.includes('handleFieldChange') &&
            memoizedFormCode.includes('handleSubmit') &&
            memoizedFormCode.includes('setFormData') &&
            memoizedFormCode.includes('validation') &&
            !memoizedFormCode.includes('TODO') &&
            memoizedFormCode.length > 400,
    error: !memoizedFormCode.includes('useCallback')
      ? 'MemoizedForm should use useCallback for handlers'
      : !memoizedFormCode.includes('handleFieldChange')
      ? 'MemoizedForm should implement handleFieldChange with useCallback'
      : !memoizedFormCode.includes('handleSubmit')
      ? 'MemoizedForm should implement handleSubmit with useCallback'
      : !memoizedFormCode.includes('setFormData')
      ? 'MemoizedForm should manage form state with setFormData'
      : !memoizedFormCode.includes('validation')
      ? 'MemoizedForm should implement field validation'
      : memoizedFormCode.includes('TODO')
      ? 'MemoizedForm still contains TODO comments - needs implementation'
      : 'MemoizedForm needs substantial implementation with handlers and validation',
    executionTime: 1,
  });

  // Test 7: FieldComponent with React.memo
  const fieldComponentCode = extractCode(compiledCode, 'FieldComponent');
  tests.push({
    name: 'FieldComponent optimized with React.memo',
    passed: compiledCode.includes('memo(function FieldComponent') &&
            fieldComponentCode.includes('field.label') &&
            fieldComponentCode.includes('onChange') &&
            fieldComponentCode.includes('useCallback') &&
            !fieldComponentCode.includes('TODO') &&
            fieldComponentCode.length > 150,
    error: !compiledCode.includes('memo(function FieldComponent')
      ? 'FieldComponent should be wrapped with React.memo'
      : !fieldComponentCode.includes('field.label')
      ? 'FieldComponent should display field.label'
      : !fieldComponentCode.includes('onChange')
      ? 'FieldComponent should handle onChange events'
      : !fieldComponentCode.includes('useCallback')
      ? 'FieldComponent should use useCallback for event handlers'
      : fieldComponentCode.includes('TODO')
      ? 'FieldComponent still contains TODO comments - needs implementation'
      : 'FieldComponent needs more substantial implementation',
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