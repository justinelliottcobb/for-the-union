import type { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Helper function to extract component/function code
  function extractCode(code: string, name: string): string {
    // Try function pattern first
    let pattern = new RegExp(`function ${name}\\(.*?\\)\\s*{([\\s\\S]*?)}(?=\\s*(?:function|export|const|class|$))`, 'i');
    let match = code.match(pattern);
    
    if (!match) {
      // Try const/arrow function pattern
      pattern = new RegExp(`const ${name}\\s*=.*?{([\\s\\S]*?)}(?=\\s*(?:function|export|const|class|$))`, 'i');
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

  // Test 1: DataProvider render prop implementation
  const dataProviderCode = extractCode(compiledCode, 'DataProvider');
  tests.push({
    name: 'DataProvider render prop component implements comprehensive data fetching',
    passed: dataProviderCode.includes('Component') && 
            dataProviderCode.includes('fetchData') &&
            dataProviderCode.includes('abortController') &&
            dataProviderCode.includes('fetch') &&
            dataProviderCode.includes('children') &&
            dataProviderCode.includes('this.state') &&
            dataProviderCode.includes('componentDidMount') &&
            dataProviderCode.includes('componentWillUnmount') &&
            !dataProviderCode.includes('TODO') &&
            dataProviderCode.length > 1000,
    error: !dataProviderCode.includes('Component')
      ? 'DataProvider should extend React.Component'
      : !dataProviderCode.includes('fetchData')
      ? 'DataProvider should implement fetchData method'
      : !dataProviderCode.includes('abortController')
      ? 'DataProvider should use AbortController for request cancellation'
      : !dataProviderCode.includes('fetch')
      ? 'DataProvider should use fetch for data fetching'
      : !dataProviderCode.includes('children')
      ? 'DataProvider should call children function with state'
      : !dataProviderCode.includes('componentDidMount')
      ? 'DataProvider should implement componentDidMount lifecycle'
      : dataProviderCode.includes('TODO')
      ? 'DataProvider still contains TODO comments - needs implementation'
      : 'DataProvider needs substantial implementation with lifecycle methods and state management',
    executionTime: 1,
  });

  // Test 2: useData hook conversion
  const useDataCode = extractCode(compiledCode, 'useData');
  tests.push({
    name: 'useData hook converts DataProvider functionality to modern hooks',
    passed: useDataCode.includes('useState') && 
            useDataCode.includes('useEffect') &&
            useDataCode.includes('useCallback') &&
            useDataCode.includes('useRef') &&
            useDataCode.includes('fetch') &&
            useDataCode.includes('abortController') &&
            useDataCode.includes('retries') &&
            useDataCode.includes('refresh') &&
            !useDataCode.includes('TODO') &&
            useDataCode.length > 800,
    error: !useDataCode.includes('useState')
      ? 'useData should use useState for state management'
      : !useDataCode.includes('useEffect')
      ? 'useData should use useEffect for side effects'
      : !useDataCode.includes('useCallback')
      ? 'useData should use useCallback for memoized functions'
      : !useDataCode.includes('useRef')
      ? 'useData should use useRef for refs and timers'
      : !useDataCode.includes('fetch')
      ? 'useData should implement data fetching'
      : !useDataCode.includes('abortController')
      ? 'useData should handle request cancellation'
      : !useDataCode.includes('retries')
      ? 'useData should implement retry logic'
      : useDataCode.includes('TODO')
      ? 'useData still contains TODO comments'
      : 'useData needs substantial hook implementation with all DataProvider features',
    executionTime: 1,
  });

  // Test 3: MouseTracker render prop implementation
  const mouseTrackerCode = extractCode(compiledCode, 'MouseTracker');
  tests.push({
    name: 'MouseTracker render prop component implements mouse position tracking',
    passed: mouseTrackerCode.includes('Component') && 
            mouseTrackerCode.includes('mousemove') &&
            mouseTrackerCode.includes('addEventListener') &&
            mouseTrackerCode.includes('removeEventListener') &&
            mouseTrackerCode.includes('handleMouseMove') &&
            mouseTrackerCode.includes('throttle') &&
            mouseTrackerCode.includes('relative') &&
            !mouseTrackerCode.includes('TODO') &&
            mouseTrackerCode.length > 400,
    error: !mouseTrackerCode.includes('Component')
      ? 'MouseTracker should extend React.Component'
      : !mouseTrackerCode.includes('mousemove')
      ? 'MouseTracker should listen to mousemove events'
      : !mouseTrackerCode.includes('addEventListener')
      ? 'MouseTracker should add event listeners'
      : !mouseTrackerCode.includes('removeEventListener')
      ? 'MouseTracker should clean up event listeners'
      : !mouseTrackerCode.includes('handleMouseMove')
      ? 'MouseTracker should implement handleMouseMove method'
      : !mouseTrackerCode.includes('throttle')
      ? 'MouseTracker should implement throttling'
      : mouseTrackerCode.includes('TODO')
      ? 'MouseTracker still contains TODO comments'
      : 'MouseTracker needs substantial implementation with event handling',
    executionTime: 1,
  });

  // Test 4: useMouse hook conversion
  const useMouseCode = extractCode(compiledCode, 'useMouse');
  tests.push({
    name: 'useMouse hook converts MouseTracker functionality to modern hooks',
    passed: useMouseCode.includes('useState') && 
            useMouseCode.includes('useEffect') &&
            useMouseCode.includes('useRef') &&
            useMouseCode.includes('mousemove') &&
            useMouseCode.includes('addEventListener') &&
            useMouseCode.includes('throttle') &&
            useMouseCode.includes('relative') &&
            !useMouseCode.includes('TODO') &&
            useMouseCode.length > 400,
    error: !useMouseCode.includes('useState')
      ? 'useMouse should use useState for position state'
      : !useMouseCode.includes('useEffect')
      ? 'useMouse should use useEffect for event listeners'
      : !useMouseCode.includes('useRef')
      ? 'useMouse should use useRef for element reference'
      : !useMouseCode.includes('mousemove')
      ? 'useMouse should handle mousemove events'
      : !useMouseCode.includes('addEventListener')
      ? 'useMouse should add event listeners'
      : !useMouseCode.includes('throttle')
      ? 'useMouse should implement throttling'
      : useMouseCode.includes('TODO')
      ? 'useMouse still contains TODO comments'
      : 'useMouse needs substantial hook implementation',
    executionTime: 1,
  });

  // Test 5: Counter render prop implementation
  const counterCode = extractCode(compiledCode, 'Counter');
  tests.push({
    name: 'Counter render prop component implements bounded counter logic',
    passed: counterCode.includes('Component') && 
            counterCode.includes('increment') &&
            counterCode.includes('decrement') &&
            counterCode.includes('reset') &&
            counterCode.includes('min') &&
            counterCode.includes('max') &&
            counterCode.includes('onChange') &&
            !counterCode.includes('TODO') &&
            counterCode.length > 300,
    error: !counterCode.includes('Component')
      ? 'Counter should extend React.Component'
      : !counterCode.includes('increment')
      ? 'Counter should implement increment method'
      : !counterCode.includes('decrement')
      ? 'Counter should implement decrement method'
      : !counterCode.includes('reset')
      ? 'Counter should implement reset method'
      : !counterCode.includes('min')
      ? 'Counter should handle min bounds'
      : !counterCode.includes('max')
      ? 'Counter should handle max bounds'
      : !counterCode.includes('onChange')
      ? 'Counter should call onChange callback'
      : counterCode.includes('TODO')
      ? 'Counter still contains TODO comments'
      : 'Counter needs substantial implementation with bounds checking',
    executionTime: 1,
  });

  // Test 6: useCounter hook conversion
  const useCounterCode = extractCode(compiledCode, 'useCounter');
  tests.push({
    name: 'useCounter hook converts Counter functionality to modern hooks',
    passed: useCounterCode.includes('useState') && 
            useCounterCode.includes('useCallback') &&
            useCounterCode.includes('increment') &&
            useCounterCode.includes('decrement') &&
            useCounterCode.includes('reset') &&
            useCounterCode.includes('min') &&
            useCounterCode.includes('max') &&
            !useCounterCode.includes('TODO') &&
            useCounterCode.length > 250,
    error: !useCounterCode.includes('useState')
      ? 'useCounter should use useState for count state'
      : !useCounterCode.includes('useCallback')
      ? 'useCounter should use useCallback for methods'
      : !useCounterCode.includes('increment')
      ? 'useCounter should implement increment function'
      : !useCounterCode.includes('decrement')
      ? 'useCounter should implement decrement function'
      : !useCounterCode.includes('reset')
      ? 'useCounter should implement reset function'
      : !useCounterCode.includes('min')
      ? 'useCounter should handle min bounds'
      : useCounterCode.includes('TODO')
      ? 'useCounter still contains TODO comments'
      : 'useCounter needs substantial hook implementation',
    executionTime: 1,
  });

  // Test 7: Toggle render prop implementation
  const toggleCode = extractCode(compiledCode, 'Toggle');
  tests.push({
    name: 'Toggle render prop component implements toggle state management',
    passed: toggleCode.includes('Component') && 
            toggleCode.includes('toggle') &&
            toggleCode.includes('turnOn') &&
            toggleCode.includes('turnOff') &&
            toggleCode.includes('isOn') &&
            toggleCode.includes('onChange') &&
            !toggleCode.includes('TODO') &&
            toggleCode.length > 200,
    error: !toggleCode.includes('Component')
      ? 'Toggle should extend React.Component'
      : !toggleCode.includes('toggle')
      ? 'Toggle should implement toggle method'
      : !toggleCode.includes('turnOn')
      ? 'Toggle should implement turnOn method'
      : !toggleCode.includes('turnOff')
      ? 'Toggle should implement turnOff method'
      : !toggleCode.includes('isOn')
      ? 'Toggle should manage isOn state'
      : !toggleCode.includes('onChange')
      ? 'Toggle should call onChange callback'
      : toggleCode.includes('TODO')
      ? 'Toggle still contains TODO comments'
      : 'Toggle needs substantial implementation',
    executionTime: 1,
  });

  // Test 8: useToggle hook conversion
  const useToggleCode = extractCode(compiledCode, 'useToggle');
  tests.push({
    name: 'useToggle hook converts Toggle functionality to modern hooks',
    passed: useToggleCode.includes('useState') && 
            useToggleCode.includes('useCallback') &&
            useToggleCode.includes('toggle') &&
            useToggleCode.includes('turnOn') &&
            useToggleCode.includes('turnOff') &&
            useToggleCode.includes('isOn') &&
            !useToggleCode.includes('TODO') &&
            useToggleCode.length > 150,
    error: !useToggleCode.includes('useState')
      ? 'useToggle should use useState for toggle state'
      : !useToggleCode.includes('useCallback')
      ? 'useToggle should use useCallback for methods'
      : !useToggleCode.includes('toggle')
      ? 'useToggle should implement toggle function'
      : !useToggleCode.includes('turnOn')
      ? 'useToggle should implement turnOn function'
      : !useToggleCode.includes('turnOff')
      ? 'useToggle should implement turnOff function'
      : !useToggleCode.includes('isOn')
      ? 'useToggle should manage isOn state'
      : useToggleCode.includes('TODO')
      ? 'useToggle still contains TODO comments'
      : 'useToggle needs substantial hook implementation',
    executionTime: 1,
  });

  // Test 9: Performance tracking implementation
  const usePerformanceTrackerCode = extractCode(compiledCode, 'usePerformanceTracker');
  tests.push({
    name: 'usePerformanceTracker implements render performance monitoring',
    passed: usePerformanceTrackerCode.includes('useRef') && 
            usePerformanceTrackerCode.includes('useEffect') &&
            usePerformanceTrackerCode.includes('performance.now') &&
            usePerformanceTrackerCode.includes('renderCount') &&
            usePerformanceTrackerCode.includes('averageRenderTime') &&
            usePerformanceTrackerCode.includes('totalRenderTime') &&
            !usePerformanceTrackerCode.includes('TODO') &&
            usePerformanceTrackerCode.length > 200,
    error: !usePerformanceTrackerCode.includes('useRef')
      ? 'usePerformanceTracker should use useRef for metrics persistence'
      : !usePerformanceTrackerCode.includes('useEffect')
      ? 'usePerformanceTracker should use useEffect for timing calculations'
      : !usePerformanceTrackerCode.includes('performance.now')
      ? 'usePerformanceTracker should use performance.now() for timing'
      : !usePerformanceTrackerCode.includes('renderCount')
      ? 'usePerformanceTracker should track render count'
      : !usePerformanceTrackerCode.includes('averageRenderTime')
      ? 'usePerformanceTracker should calculate average render time'
      : usePerformanceTrackerCode.includes('TODO')
      ? 'usePerformanceTracker still contains TODO comments'
      : 'usePerformanceTracker needs substantial implementation',
    executionTime: 1,
  });

  // Test 10: Backward compatibility wrapper
  const withRenderPropsCode = extractCode(compiledCode, 'withRenderProps');
  tests.push({
    name: 'withRenderProps creates backward compatibility wrapper for hooks',
    passed: withRenderPropsCode.includes('hook') && 
            withRenderPropsCode.includes('children') &&
            withRenderPropsCode.includes('displayName') &&
            withRenderPropsCode.includes('React.FC') &&
            !withRenderPropsCode.includes('TODO') &&
            withRenderPropsCode.length > 100,
    error: !withRenderPropsCode.includes('hook')
      ? 'withRenderProps should accept a hook function parameter'
      : !withRenderPropsCode.includes('children')
      ? 'withRenderProps should call children function with hook result'
      : !withRenderPropsCode.includes('displayName')
      ? 'withRenderProps should set displayName for debugging'
      : !withRenderPropsCode.includes('React.FC')
      ? 'withRenderProps should return a React functional component'
      : withRenderPropsCode.includes('TODO')
      ? 'withRenderProps still contains TODO comments'
      : 'withRenderProps needs proper implementation',
    executionTime: 1,
  });

  // Test 11: Render prop lifecycle methods
  tests.push({
    name: 'Render prop components implement proper lifecycle methods',
    passed: compiledCode.includes('componentDidMount') && 
            compiledCode.includes('componentWillUnmount') &&
            compiledCode.includes('componentDidUpdate') &&
            (compiledCode.match(/componentDidMount/g) || []).length >= 2 &&
            (compiledCode.match(/componentWillUnmount/g) || []).length >= 2,
    error: !compiledCode.includes('componentDidMount')
      ? 'Render prop components should implement componentDidMount'
      : !compiledCode.includes('componentWillUnmount')
      ? 'Render prop components should implement componentWillUnmount'
      : !compiledCode.includes('componentDidUpdate')
      ? 'Render prop components should implement componentDidUpdate'
      : 'Should implement lifecycle methods in multiple render prop components',
    executionTime: 1,
  });

  // Test 12: Hook cleanup and effects
  tests.push({
    name: 'Hooks implement proper cleanup and effect dependencies',
    passed: (compiledCode.match(/useEffect/g) || []).length >= 4 && 
            (compiledCode.match(/return.*=>/g) || []).length >= 3 &&
            compiledCode.includes('cleanup') &&
            compiledCode.includes('dependencies') &&
            (compiledCode.match(/\[\]/g) || []).length >= 2,
    error: !(compiledCode.match(/useEffect/g) || []).length >= 4
      ? 'Should use multiple useEffect hooks for different concerns'
      : !(compiledCode.match(/return.*=>/g) || []).length >= 3
      ? 'Should implement cleanup functions in useEffect'
      : !compiledCode.includes('cleanup')
      ? 'Should implement proper cleanup logic'
      : !(compiledCode.match(/\[\]/g) || []).length >= 2
      ? 'Should use proper dependency arrays in useEffect'
      : 'Should implement comprehensive effect management',
    executionTime: 1,
  });

  // Test 13: State management patterns
  tests.push({
    name: 'Components implement consistent state management patterns',
    passed: (compiledCode.match(/setState/g) || []).length >= 5 && 
            (compiledCode.match(/useState/g) || []).length >= 5 &&
            compiledCode.includes('prevState') &&
            compiledCode.includes('callback') &&
            compiledCode.includes('initialValue'),
    error: !(compiledCode.match(/setState/g) || []).length >= 5
      ? 'Render prop components should use setState'
      : !(compiledCode.match(/useState/g) || []).length >= 5
      ? 'Hooks should use useState for state management'
      : !compiledCode.includes('prevState')
      ? 'Should use functional state updates'
      : !compiledCode.includes('callback')
      ? 'Should handle callback functions'
      : 'Should implement consistent state management patterns',
    executionTime: 1,
  });

  // Test 14: Error handling and edge cases
  tests.push({
    name: 'Components handle errors and edge cases properly',
    passed: compiledCode.includes('try') && 
            compiledCode.includes('catch') &&
            compiledCode.includes('AbortError') &&
            compiledCode.includes('clearTimeout') &&
            compiledCode.includes('clearInterval') &&
            (compiledCode.includes('disabled') || compiledCode.includes('enabled')),
    error: !compiledCode.includes('try')
      ? 'Should implement try-catch blocks for error handling'
      : !compiledCode.includes('catch')
      ? 'Should catch and handle errors'
      : !compiledCode.includes('AbortError')
      ? 'Should handle AbortError for cancelled requests'
      : !compiledCode.includes('clearTimeout')
      ? 'Should clean up timeouts'
      : !compiledCode.includes('clearInterval')
      ? 'Should clean up intervals'
      : 'Should handle edge cases and error conditions',
    executionTime: 1,
  });

  // Test 15: Demo component integration
  const renderPropExampleCode = extractCode(compiledCode, 'RenderPropExample');
  const hookExampleCode = extractCode(compiledCode, 'HookExample');
  tests.push({
    name: 'Demo components showcase both patterns with performance tracking',
    passed: renderPropExampleCode.includes('DataProvider') && 
            renderPropExampleCode.includes('MouseTracker') &&
            renderPropExampleCode.includes('Counter') &&
            renderPropExampleCode.includes('Toggle') &&
            hookExampleCode.includes('useData') &&
            hookExampleCode.includes('useMouse') &&
            hookExampleCode.includes('useCounter') &&
            hookExampleCode.includes('useToggle') &&
            renderPropExampleCode.length > 500 &&
            hookExampleCode.length > 500,
    error: !renderPropExampleCode.includes('DataProvider')
      ? 'RenderPropExample should use DataProvider component'
      : !renderPropExampleCode.includes('MouseTracker')
      ? 'RenderPropExample should use MouseTracker component'
      : !hookExampleCode.includes('useData')
      ? 'HookExample should use useData hook'
      : !hookExampleCode.includes('useMouse')
      ? 'HookExample should use useMouse hook'
      : renderPropExampleCode.length <= 500
      ? 'RenderPropExample needs substantial implementation'
      : hookExampleCode.length <= 500
      ? 'HookExample needs substantial implementation'
      : 'Demo components need comprehensive implementation showcasing both patterns',
    executionTime: 1,
  });

  // Test 16: TypeScript integration and type safety
  tests.push({
    name: 'Components implement proper TypeScript interfaces and generics',
    passed: compiledCode.includes('interface DataState') && 
            compiledCode.includes('interface MousePosition') &&
            compiledCode.includes('interface CounterState') &&
            compiledCode.includes('interface ToggleState') &&
            compiledCode.includes('<T>') &&
            compiledCode.includes('ReactNode') &&
            (compiledCode.match(/interface/g) || []).length >= 8,
    error: !compiledCode.includes('interface DataState')
      ? 'Should define DataState interface'
      : !compiledCode.includes('interface MousePosition')
      ? 'Should define MousePosition interface'
      : !compiledCode.includes('interface CounterState')
      ? 'Should define CounterState interface'
      : !compiledCode.includes('<T>')
      ? 'Should use TypeScript generics'
      : !compiledCode.includes('ReactNode')
      ? 'Should use ReactNode for children typing'
      : 'Should implement comprehensive TypeScript interfaces',
    executionTime: 1,
  });

  return tests;
}