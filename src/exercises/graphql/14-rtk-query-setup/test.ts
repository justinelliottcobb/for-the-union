// Test file for RTK Query GraphQL Integration Setup exercise
// Tests implementation of RTK Query with GraphQL endpoints

import type { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test 1: RTK Query API slice creation
  tests.push({
    name: 'RTK Query API slice creation',
    passed: compiledCode.includes('createApi') &&
            compiledCode.includes('reducerPath') &&
            compiledCode.includes('baseQuery') &&
            compiledCode.includes('endpoints') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'createApi needs implementation - replace placeholder with RTK Query API setup' :
      (compiledCode.includes('createApi') ? undefined : 'createApi setup not found'),
    executionTime: 1,
  });

  // Test 2: Custom GraphQL base query
  tests.push({
    name: 'Custom GraphQL base query',
    passed: compiledCode.includes('function graphqlBaseQuery') &&
            compiledCode.includes('fetch') &&
            compiledCode.includes('query') &&
            compiledCode.includes('variables') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'graphqlBaseQuery needs implementation - replace placeholder with GraphQL base query logic' :
      (compiledCode.includes('function graphqlBaseQuery') ? undefined : 'graphqlBaseQuery function not found'),
    executionTime: 1,
  });

  // Test 3: Endpoints definition with TypeScript
  tests.push({
    name: 'Endpoints definition with TypeScript',
    passed: compiledCode.includes('endpoints: (builder) =>') &&
            compiledCode.includes('builder.query') &&
            compiledCode.includes('builder.mutation') &&
            compiledCode.includes('query:') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Endpoints need implementation - replace placeholder with endpoint definitions' :
      (compiledCode.includes('endpoints: (builder) =>') ? undefined : 'Endpoints definition not found'),
    executionTime: 1,
  });

  // Test 4: Tag system for cache invalidation
  tests.push({
    name: 'Tag system for cache invalidation',
    passed: compiledCode.includes('tagTypes') &&
            compiledCode.includes('providesTags') &&
            compiledCode.includes('invalidatesTags') &&
            compiledCode.includes('Product') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Tag system needs implementation - replace placeholder with tag configuration' :
      (compiledCode.includes('tagTypes') ? undefined : 'Tag system not found'),
    executionTime: 1,
  });

  // Test 5: Store configuration with RTK Query
  tests.push({
    name: 'Store configuration with RTK Query',
    passed: compiledCode.includes('configureStore') &&
            compiledCode.includes('reducer') &&
            compiledCode.includes('middleware') &&
            compiledCode.includes('getDefaultMiddleware') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Store configuration needs implementation - replace placeholder with store setup' :
      (compiledCode.includes('configureStore') ? undefined : 'Store configuration not found'),
    executionTime: 1,
  });

  // Test 6: Error handling in base query
  tests.push({
    name: 'Error handling in base query',
    passed: compiledCode.includes('function handleGraphQLErrors') &&
            compiledCode.includes('error') &&
            compiledCode.includes('data') &&
            compiledCode.includes('status') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'handleGraphQLErrors needs implementation - replace placeholder with error handling' :
      (compiledCode.includes('function handleGraphQLErrors') ? undefined : 'handleGraphQLErrors function not found'),
    executionTime: 1,
  });

  // Test 7: TypeScript integration setup
  tests.push({
    name: 'TypeScript integration setup',
    passed: compiledCode.includes('export type RootState') &&
            compiledCode.includes('export type AppDispatch') &&
            compiledCode.includes('TypedUseSelectorHook') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'TypeScript integration needs setup - replace placeholder with typed hooks' :
      (compiledCode.includes('export type RootState') ? undefined : 'TypeScript integration not found'),
    executionTime: 1,
  });

  // Test 8: ProductList component implementation
  tests.push(createComponentTest('ProductList', compiledCode, {
    requiredElements: ['div', 'ul', 'li'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('useGetProductsQuery'),
    errorMessage: 'ProductList component needs implementation with RTK Query hooks',
  }));

  // Test 9: CreateProduct component implementation
  tests.push(createComponentTest('CreateProduct', compiledCode, {
    requiredElements: ['form', 'input', 'button'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('useCreateProductMutation'),
    errorMessage: 'CreateProduct component needs implementation with RTK Query mutation hooks',
  }));

  // Test 10: QueryStatus component implementation
  tests.push(createComponentTest('QueryStatus', compiledCode, {
    requiredElements: ['div', 'span'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('isLoading') && code.includes('error'),
    errorMessage: 'QueryStatus component needs implementation to display RTK Query state',
  }));

  return tests;
}