// Test file for React Query GraphQL Integration exercise
// Tests implementation of GraphQL with TanStack Query patterns

import type { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test 1: GraphQL request function
  tests.push({
    name: 'GraphQL request function',
    passed: compiledCode.includes('function graphqlRequest') &&
            compiledCode.includes('fetch') &&
            compiledCode.includes('query') &&
            compiledCode.includes('variables') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'graphqlRequest needs implementation - replace placeholder with GraphQL fetch logic' :
      (compiledCode.includes('function graphqlRequest') ? undefined : 'graphqlRequest function not found'),
    executionTime: 1,
  });

  // Test 2: Query keys design
  tests.push({
    name: 'Query keys design',
    passed: compiledCode.includes('function createQueryKey') &&
            compiledCode.includes('queryKey') &&
            compiledCode.includes('operation') &&
            compiledCode.includes('variables') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'createQueryKey needs implementation - replace placeholder with query key generation' :
      (compiledCode.includes('function createQueryKey') ? undefined : 'createQueryKey function not found'),
    executionTime: 1,
  });

  // Test 3: useQuery integration
  tests.push({
    name: 'useQuery integration',
    passed: compiledCode.includes('useQuery(') &&
            compiledCode.includes('queryKey') &&
            compiledCode.includes('queryFn') &&
            compiledCode.includes('enabled') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'useQuery integration needs implementation - replace placeholder with React Query usage' :
      (compiledCode.includes('useQuery(') ? undefined : 'useQuery integration not found'),
    executionTime: 1,
  });

  // Test 4: useMutation integration
  tests.push({
    name: 'useMutation integration',
    passed: compiledCode.includes('useMutation(') &&
            compiledCode.includes('mutationFn') &&
            compiledCode.includes('onSuccess') &&
            compiledCode.includes('onError') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'useMutation integration needs implementation - replace placeholder with mutation logic' :
      (compiledCode.includes('useMutation(') ? undefined : 'useMutation integration not found'),
    executionTime: 1,
  });

  // Test 5: Error handling with React Query
  tests.push({
    name: 'Error handling with React Query',
    passed: compiledCode.includes('function handleGraphQLError') &&
            compiledCode.includes('error') &&
            compiledCode.includes('retry') &&
            compiledCode.includes('onError') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'handleGraphQLError needs implementation - replace placeholder with error handling' :
      (compiledCode.includes('function handleGraphQLError') ? undefined : 'handleGraphQLError function not found'),
    executionTime: 1,
  });

  // Test 6: Background refetching configuration
  tests.push({
    name: 'Background refetching configuration',
    passed: compiledCode.includes('staleTime') &&
            compiledCode.includes('refetchInterval') &&
            compiledCode.includes('refetchOnWindowFocus') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Background refetching needs configuration - replace placeholder with refetch options' :
      undefined,
    executionTime: 1,
  });

  // Test 7: Custom GraphQL hooks
  tests.push({
    name: 'Custom GraphQL hooks',
    passed: compiledCode.includes('function useGraphQLQuery') &&
            compiledCode.includes('function useGraphQLMutation') &&
            compiledCode.includes('return useQuery') &&
            compiledCode.includes('return useMutation') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Custom hooks need implementation - replace placeholder with hook logic' :
      (compiledCode.includes('function useGraphQLQuery') ? undefined : 'Custom GraphQL hooks not found'),
    executionTime: 1,
  });

  // Test 8: ProductList component implementation
  tests.push(createComponentTest('ProductList', compiledCode, {
    requiredElements: ['div', 'ul', 'li'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('useQuery') && code.includes('isLoading'),
    errorMessage: 'ProductList component needs implementation with React Query useQuery hook',
  }));

  // Test 9: CreateProduct component implementation
  tests.push(createComponentTest('CreateProduct', compiledCode, {
    requiredElements: ['form', 'input', 'button'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('useMutation'),
    errorMessage: 'CreateProduct component needs implementation with React Query useMutation hook',
  }));

  // Test 10: QueryStatus component implementation
  tests.push(createComponentTest('QueryStatus', compiledCode, {
    requiredElements: ['div', 'span'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('status'),
    errorMessage: 'QueryStatus component needs implementation to display query state information',
  }));

  return tests;
}