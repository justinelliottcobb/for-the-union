// Test file for URQL Basic Setup exercise
// Tests implementation of URQL fundamentals and TypeScript integration

import type { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test 1: URQL Client setup
  tests.push({
    name: 'URQL Client setup',
    passed: compiledCode.includes('function createUrqlClient') &&
            compiledCode.includes('Client') &&
            compiledCode.includes('url') &&
            compiledCode.includes('exchanges') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'createUrqlClient needs implementation - replace placeholder with URQL Client setup' :
      (compiledCode.includes('function createUrqlClient') ? undefined : 'createUrqlClient function not found'),
    executionTime: 1,
  });

  // Test 2: useQuery hook usage
  tests.push({
    name: 'useQuery hook usage',
    passed: compiledCode.includes('useQuery(') &&
            compiledCode.includes('fetching') &&
            compiledCode.includes('data') &&
            compiledCode.includes('error') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'useQuery hook needs implementation - replace placeholder with URQL query usage' :
      (compiledCode.includes('useQuery(') ? undefined : 'useQuery hook usage not found'),
    executionTime: 1,
  });

  // Test 3: useMutation hook usage
  tests.push({
    name: 'useMutation hook usage',
    passed: compiledCode.includes('useMutation(') &&
            compiledCode.includes('executeMutation') &&
            compiledCode.includes('variables') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'useMutation hook needs implementation - replace placeholder with URQL mutation usage' :
      (compiledCode.includes('useMutation(') ? undefined : 'useMutation hook usage not found'),
    executionTime: 1,
  });

  // Test 4: Request policy configuration
  tests.push({
    name: 'Request policy configuration',
    passed: compiledCode.includes('requestPolicy') &&
            compiledCode.includes('cache-first') &&
            compiledCode.includes('cache-and-network') &&
            compiledCode.includes('network-only') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Request policy needs implementation - replace placeholder with policy configuration' :
      (compiledCode.includes('requestPolicy') ? undefined : 'Request policy configuration not found'),
    executionTime: 1,
  });

  // Test 5: Error handling patterns
  tests.push({
    name: 'Error handling patterns',
    passed: compiledCode.includes('function handleUrqlError') &&
            compiledCode.includes('CombinedError') &&
            compiledCode.includes('networkError') &&
            compiledCode.includes('graphQLErrors') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'handleUrqlError needs implementation - replace placeholder with error handling logic' :
      (compiledCode.includes('function handleUrqlError') ? undefined : 'handleUrqlError function not found'),
    executionTime: 1,
  });

  // Test 6: Document caching strategy
  tests.push({
    name: 'Document caching strategy',
    passed: compiledCode.includes('function configureCaching') &&
            compiledCode.includes('cacheExchange') &&
            compiledCode.includes('document') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'configureCaching needs implementation - replace placeholder with caching configuration' :
      (compiledCode.includes('function configureCaching') ? undefined : 'configureCaching function not found'),
    executionTime: 1,
  });

  // Test 7: ProductList component implementation
  tests.push(createComponentTest('ProductList', compiledCode, {
    requiredElements: ['div', 'ul', 'li'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('useQuery') && code.includes('fetching'),
    errorMessage: 'ProductList component needs implementation with URQL useQuery hook',
  }));

  // Test 8: CreateProduct component implementation
  tests.push(createComponentTest('CreateProduct', compiledCode, {
    requiredElements: ['form', 'input', 'button'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('useMutation'),
    errorMessage: 'CreateProduct component needs implementation with URQL useMutation hook',
  }));

  // Test 9: ErrorDisplay component implementation
  tests.push(createComponentTest('ErrorDisplay', compiledCode, {
    requiredElements: ['div'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('error'),
    errorMessage: 'ErrorDisplay component needs implementation to show URQL errors',
  }));

  return tests;
}