import type { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Helper function to extract hook/component code
  function extractComponentCode(code: string, componentName: string): string {
    // First try the standard function pattern
    let functionPattern = new RegExp(`function ${componentName}\\(.*?\\)\\s*{([\\s\\S]*?)}(?=\\s*(?:function|export|$))`, 'i');
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

  // Check useCounter custom hook
  const useCounterSection = extractComponentCode(compiledCode, 'useCounter');
  tests.push({
    name: 'useCounter custom hook implementation',
    passed: useCounterSection.includes('useState') &&
            useCounterSection.includes('increment') &&
            useCounterSection.includes('decrement') &&
            useCounterSection.includes('reset') &&
            !useCounterSection.includes('count: 0'),
    error: useCounterSection.includes('useState') &&
           useCounterSection.includes('increment') &&
           useCounterSection.includes('decrement') &&
           useCounterSection.includes('reset') &&
           !useCounterSection.includes('count: 0')
      ? undefined 
      : 'useCounter hook needs useState and increment, decrement, reset functions',
    executionTime: 1,
  });

  // Check useToggle custom hook
  const useToggleSection = extractComponentCode(compiledCode, 'useToggle');
  tests.push({
    name: 'useToggle custom hook implementation',
    passed: useToggleSection.includes('useState') &&
            useToggleSection.includes('toggle') &&
            !useToggleSection.includes('[false, () => {}, () => {}, () => {}]'),
    error: useToggleSection.includes('useState') &&
           useToggleSection.includes('toggle') &&
           !useToggleSection.includes('[false, () => {}, () => {}, () => {}]')
      ? undefined 
      : 'useToggle hook needs useState and toggle functionality',
    executionTime: 1,
  });

  // Check useLocalStorage custom hook
  const useLocalStorageSection = extractComponentCode(compiledCode, 'useLocalStorage');
  tests.push({
    name: 'useLocalStorage custom hook implementation',
    passed: useLocalStorageSection.includes('useState') &&
            useLocalStorageSection.includes('localStorage') &&
            useLocalStorageSection.includes('setValue'),
    error: useLocalStorageSection.includes('useState') &&
           useLocalStorageSection.includes('localStorage') &&
           useLocalStorageSection.includes('setValue')
      ? undefined 
      : 'useLocalStorage hook needs useState, localStorage, and setValue function',
    executionTime: 1,
  });

  // Check useFetch custom hook
  const useFetchSection = extractComponentCode(compiledCode, 'useFetch');
  tests.push({
    name: 'useFetch custom hook implementation',
    passed: useFetchSection.includes('useState') &&
            useFetchSection.includes('useEffect') &&
            useFetchSection.includes('data') &&
            useFetchSection.includes('loading') &&
            useFetchSection.includes('error') &&
            !useFetchSection.includes('data: null,\n    loading: false'),
    error: useFetchSection.includes('useState') &&
           useFetchSection.includes('useEffect') &&
           useFetchSection.includes('data') &&
           useFetchSection.includes('loading') &&
           useFetchSection.includes('error') &&
           !useFetchSection.includes('data: null,\n    loading: false')
      ? undefined 
      : 'useFetch hook needs useState, useEffect, and proper data/loading/error states',
    executionTime: 1,
  });

  // Check useDebounce custom hook
  const useDebounceSection = extractComponentCode(compiledCode, 'useDebounce');
  tests.push({
    name: 'useDebounce custom hook implementation',
    passed: useDebounceSection.includes('useState') &&
            useDebounceSection.includes('useEffect') &&
            (useDebounceSection.includes('setTimeout') || useDebounceSection.includes('timeout')) &&
            !useDebounceSection.includes('return value'),
    error: useDebounceSection.includes('useState') &&
           useDebounceSection.includes('useEffect') &&
           (useDebounceSection.includes('setTimeout') || useDebounceSection.includes('timeout')) &&
           !useDebounceSection.includes('return value')
      ? undefined 
      : 'useDebounce hook needs useState, useEffect, and setTimeout for debouncing',
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

  // Check useWindowSize custom hook
  const useWindowSizeSection = extractComponentCode(compiledCode, 'useWindowSize');
  tests.push({
    name: 'useWindowSize custom hook implementation',
    passed: useWindowSizeSection.includes('useState') &&
            useWindowSizeSection.includes('useEffect') &&
            (useWindowSizeSection.includes('resize') || useWindowSizeSection.includes('addEventListener')) &&
            !useWindowSizeSection.includes('return { width: 0, height: 0 }'),
    error: useWindowSizeSection.includes('useState') &&
           useWindowSizeSection.includes('useEffect') &&
           (useWindowSizeSection.includes('resize') || useWindowSizeSection.includes('addEventListener')) &&
           !useWindowSizeSection.includes('return { width: 0, height: 0 }')
      ? undefined 
      : 'useWindowSize hook needs useState, useEffect, and resize event handling',
    executionTime: 1,
  });

  // Check useInterval custom hook
  const useIntervalSection = extractComponentCode(compiledCode, 'useInterval');
  tests.push({
    name: 'useInterval custom hook implementation',
    passed: useIntervalSection.includes('useRef') &&
            useIntervalSection.includes('useEffect') &&
            (useIntervalSection.includes('setInterval') || useIntervalSection.includes('interval')),
    error: useIntervalSection.includes('useRef') &&
           useIntervalSection.includes('useEffect') &&
           (useIntervalSection.includes('setInterval') || useIntervalSection.includes('interval'))
      ? undefined 
      : 'useInterval hook needs useRef, useEffect, and setInterval functionality',
    executionTime: 1,
  });

  // Check useAsync custom hook
  const useAsyncSection = extractComponentCode(compiledCode, 'useAsync');
  tests.push({
    name: 'useAsync custom hook implementation',
    passed: useAsyncSection.includes('useState') &&
            useAsyncSection.includes('execute') &&
            useAsyncSection.includes('async') &&
            !useAsyncSection.includes('data: null,\n    loading: false'),
    error: useAsyncSection.includes('useState') &&
           useAsyncSection.includes('execute') &&
           useAsyncSection.includes('async') &&
           !useAsyncSection.includes('data: null,\n    loading: false')
      ? undefined 
      : 'useAsync hook needs useState, async execute function, and proper state management',
    executionTime: 1,
  });

  // Check useForm custom hook
  const useFormSection = extractComponentCode(compiledCode, 'useForm');
  tests.push({
    name: 'useForm custom hook implementation',
    passed: useFormSection.includes('useState') &&
            useFormSection.includes('handleChange') &&
            useFormSection.includes('handleSubmit') &&
            useFormSection.includes('values') &&
            useFormSection.includes('errors') &&
            !useFormSection.includes('values: config.initialValues'),
    error: useFormSection.includes('useState') &&
           useFormSection.includes('handleChange') &&
           useFormSection.includes('handleSubmit') &&
           useFormSection.includes('values') &&
           useFormSection.includes('errors') &&
           !useFormSection.includes('values: config.initialValues')
      ? undefined 
      : 'useForm hook needs useState, handleChange, handleSubmit, and proper form state management',
    executionTime: 1,
  });

  // Check CounterExample component
  const counterExampleSection = extractComponentCode(compiledCode, 'CounterExample');
  tests.push({
    name: 'CounterExample component implementation',
    passed: (counterExampleSection.includes('_jsx') || counterExampleSection.includes('<')) && 
            counterExampleSection.includes('useCounter') &&
            !counterExampleSection.includes('return null'),
    error: (counterExampleSection.includes('_jsx') || counterExampleSection.includes('<')) && 
           counterExampleSection.includes('useCounter') &&
           !counterExampleSection.includes('return null')
      ? undefined 
      : 'CounterExample component needs JSX with useCounter hook (not return null)',
    executionTime: 1,
  });

  // Check FetchExample component
  const fetchExampleSection = extractComponentCode(compiledCode, 'FetchExample');
  tests.push({
    name: 'FetchExample component implementation',
    passed: (fetchExampleSection.includes('_jsx') || fetchExampleSection.includes('<')) && 
            fetchExampleSection.includes('useFetch') &&
            !fetchExampleSection.includes('return null'),
    error: (fetchExampleSection.includes('_jsx') || fetchExampleSection.includes('<')) && 
           fetchExampleSection.includes('useFetch') &&
           !fetchExampleSection.includes('return null')
      ? undefined 
      : 'FetchExample component needs JSX with useFetch hook (not return null)',
    executionTime: 1,
  });

  // Check FormExample component
  const formExampleSection = extractComponentCode(compiledCode, 'FormExample');
  tests.push({
    name: 'FormExample component implementation',
    passed: (formExampleSection.includes('_jsx') || formExampleSection.includes('<')) && 
            formExampleSection.includes('useForm') &&
            !formExampleSection.includes('return null'),
    error: (formExampleSection.includes('_jsx') || formExampleSection.includes('<')) && 
           formExampleSection.includes('useForm') &&
           !formExampleSection.includes('return null')
      ? undefined 
      : 'FormExample component needs JSX with useForm hook (not return null)',
    executionTime: 1,
  });

  return tests;
}