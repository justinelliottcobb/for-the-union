// Test file for Apollo Client React Hooks exercise
// Tests implementation of useQuery, useMutation, and useSubscription hooks

import type { TestResult } from '@/types';
import { createComponentTest, createHookTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test 1: useQuery hook usage with loading states
  tests.push({
    name: 'useQuery hook usage with loading states',
    passed: compiledCode.includes('useQuery(') &&
            compiledCode.includes('loading') &&
            compiledCode.includes('error') &&
            compiledCode.includes('data') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'useQuery hook needs implementation - replace placeholder with query usage and state handling' :
      (compiledCode.includes('useQuery(') ? undefined : 'useQuery hook usage not found'),
    executionTime: 1,
  });

  // Test 2: useMutation hook with optimistic updates
  tests.push({
    name: 'useMutation hook with optimistic updates',
    passed: compiledCode.includes('useMutation(') &&
            compiledCode.includes('optimisticResponse') &&
            compiledCode.includes('update') &&
            compiledCode.includes('onCompleted') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'useMutation hook needs implementation - replace placeholder with mutation and optimistic updates' :
      (compiledCode.includes('useMutation(') ? undefined : 'useMutation hook usage not found'),
    executionTime: 1,
  });

  // Test 3: useSubscription hook implementation
  tests.push({
    name: 'useSubscription hook implementation',
    passed: compiledCode.includes('useSubscription(') &&
            compiledCode.includes('onSubscriptionData') &&
            compiledCode.includes('subscription') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'useSubscription hook needs implementation - replace placeholder with subscription handling' :
      (compiledCode.includes('useSubscription(') ? undefined : 'useSubscription hook usage not found'),
    executionTime: 1,
  });

  // Test 4: Error handling patterns with hooks
  tests.push({
    name: 'Error handling patterns with hooks',
    passed: compiledCode.includes('ErrorPolicy') &&
            compiledCode.includes('errorPolicy') &&
            compiledCode.includes('all') &&
            compiledCode.includes('none') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Error handling needs implementation - replace placeholder with error policy configuration' :
      undefined,
    executionTime: 1,
  });

  // Test 5: Fetch policy configuration
  tests.push({
    name: 'Fetch policy configuration',
    passed: compiledCode.includes('fetchPolicy') &&
            compiledCode.includes('cache-first') &&
            compiledCode.includes('network-only') &&
            compiledCode.includes('cache-and-network') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Fetch policy needs implementation - replace placeholder with fetch policy options' :
      (compiledCode.includes('fetchPolicy') ? undefined : 'Fetch policy configuration not found'),
    executionTime: 1,
  });

  // Test 6: Variables and dynamic queries
  tests.push({
    name: 'Variables and dynamic queries',
    passed: compiledCode.includes('variables') &&
            compiledCode.includes('skip') &&
            compiledCode.includes('refetch') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Dynamic queries need implementation - replace placeholder with variable handling' :
      (compiledCode.includes('variables') ? undefined : 'Query variables not found'),
    executionTime: 1,
  });

  // Test 7: Cache update patterns
  tests.push({
    name: 'Cache update patterns',
    passed: compiledCode.includes('cache.writeQuery') &&
            compiledCode.includes('cache.readQuery') &&
            compiledCode.includes('cache.modify') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Cache updates need implementation - replace placeholder with cache manipulation' :
      (compiledCode.includes('cache.writeQuery') ? undefined : 'Cache update methods not found'),
    executionTime: 1,
  });

  // Test 8: ProductList component implementation
  tests.push(createComponentTest('ProductList', compiledCode, {
    requiredElements: ['div', 'ul', 'li'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('useQuery') && code.includes('loading'),
    errorMessage: 'ProductList component needs implementation with useQuery hook and loading states',
  }));

  // Test 9: CreateProduct component implementation
  tests.push(createComponentTest('CreateProduct', compiledCode, {
    requiredElements: ['form', 'input', 'button'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('useMutation'),
    errorMessage: 'CreateProduct component needs implementation with useMutation hook',
  }));

  // Test 10: LiveUpdates component implementation
  tests.push(createComponentTest('LiveUpdates', compiledCode, {
    requiredElements: ['div'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('useSubscription'),
    errorMessage: 'LiveUpdates component needs implementation with useSubscription hook',
  }));

  return tests;
}