// Test file for GraphQL Basic Queries exercise
// Tests implementation of GraphQL query patterns and error handling

import type { TestResult } from '@/types';
import { createComponentTest, createHookTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test 1: fetchProduct function implementation
  tests.push({
    name: 'fetchProduct function implementation',
    passed: compiledCode.includes('function fetchProduct') &&
            compiledCode.includes('fetch(') &&
            compiledCode.includes('GetProduct') &&
            compiledCode.includes('variables') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'fetchProduct needs implementation - replace placeholder with GraphQL fetch logic' :
      (compiledCode.includes('function fetchProduct') ? undefined : 'fetchProduct function not found'),
    executionTime: 1,
  });

  // Test 2: fetchProducts function implementation
  tests.push({
    name: 'fetchProducts function implementation',
    passed: compiledCode.includes('function fetchProducts') &&
            compiledCode.includes('GetProducts') &&
            compiledCode.includes('limit') &&
            compiledCode.includes('offset') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'fetchProducts needs implementation - replace placeholder with GraphQL fetch logic' :
      (compiledCode.includes('function fetchProducts') ? undefined : 'fetchProducts function not found'),
    executionTime: 1,
  });

  // Test 3: fetchProductsByCategory function implementation
  tests.push({
    name: 'fetchProductsByCategory function implementation',
    passed: compiledCode.includes('function fetchProductsByCategory') &&
            compiledCode.includes('GetProductsByCategory') &&
            compiledCode.includes('categoryId') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'fetchProductsByCategory needs implementation - replace placeholder with GraphQL fetch logic' :
      (compiledCode.includes('function fetchProductsByCategory') ? undefined : 'fetchProductsByCategory function not found'),
    executionTime: 1,
  });

  // Test 4: safeGraphQLQuery function implementation
  tests.push({
    name: 'safeGraphQLQuery function implementation',
    passed: compiledCode.includes('function safeGraphQLQuery') &&
            compiledCode.includes('try') &&
            compiledCode.includes('catch') &&
            compiledCode.includes('data:') &&
            compiledCode.includes('error:') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'safeGraphQLQuery needs implementation - replace placeholder with try/catch logic' :
      (compiledCode.includes('function safeGraphQLQuery') ? undefined : 'safeGraphQLQuery function not found'),
    executionTime: 1,
  });

  // Test 5: batchQueries function implementation
  tests.push({
    name: 'batchQueries function implementation',
    passed: compiledCode.includes('function batchQueries') &&
            compiledCode.includes('Promise.all') &&
            compiledCode.includes('map') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'batchQueries needs implementation - replace placeholder with Promise.all logic' :
      (compiledCode.includes('function batchQueries') ? undefined : 'batchQueries function not found'),
    executionTime: 1,
  });

  // Test 6: Product type definitions
  tests.push({
    name: 'Product type definitions',
    passed: compiledCode.includes('interface Product') &&
            compiledCode.includes('interface GraphQLResponse') &&
            compiledCode.includes('interface GraphQLError') &&
            compiledCode.includes('id: string') &&
            compiledCode.includes('name: string'),
    error: compiledCode.includes('interface Product') ? undefined : 'Product type definitions not found',
    executionTime: 1,
  });

  // Test 7: Error handling patterns
  tests.push({
    name: 'Error handling patterns',
    passed: compiledCode.includes('GraphQLError') &&
            compiledCode.includes('response.errors') &&
            compiledCode.includes('throw') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Error handling needs implementation - add GraphQL error checking' :
      undefined,
    executionTime: 1,
  });

  // Test 8: Query validation patterns
  tests.push({
    name: 'Query validation patterns',
    passed: compiledCode.includes('validateProduct') &&
            compiledCode.includes('required fields') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Query validation needs implementation - add data validation logic' :
      (compiledCode.includes('validateProduct') ? undefined : 'validateProduct function not found'),
    executionTime: 1,
  });

  // Test 9: ProductDisplay component implementation
  tests.push(createComponentTest('ProductDisplay', compiledCode, {
    requiredElements: ['div', 'h2', 'p'],
    customValidation: (code) => !code.includes('Your code here'),
    errorMessage: 'ProductDisplay component needs JSX implementation with product details',
  }));

  // Test 10: ProductList component implementation
  tests.push(createComponentTest('ProductList', compiledCode, {
    requiredElements: ['div', 'ul', 'li'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('map'),
    errorMessage: 'ProductList component needs JSX implementation with product mapping',
  }));

  // Test 11: QueryDemo component implementation
  tests.push(createComponentTest('QueryDemo', compiledCode, {
    requiredElements: ['div', 'button'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('fetchProduct'),
    errorMessage: 'QueryDemo component needs implementation with GraphQL query functionality',
  }));

  return tests;
}