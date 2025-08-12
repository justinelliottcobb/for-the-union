// Test file for Apollo Client Advanced Patterns exercise
// Tests implementation of custom links, local state, and advanced patterns

import type { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test 1: Custom Apollo Link creation
  tests.push({
    name: 'Custom Apollo Link creation',
    passed: compiledCode.includes('function createCustomLink') &&
            compiledCode.includes('ApolloLink') &&
            compiledCode.includes('forward') &&
            compiledCode.includes('operation') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'createCustomLink needs implementation - replace placeholder with custom Apollo Link logic' :
      (compiledCode.includes('function createCustomLink') ? undefined : 'createCustomLink function not found'),
    executionTime: 1,
  });

  // Test 2: Local state management with Apollo
  tests.push({
    name: 'Local state management with Apollo',
    passed: compiledCode.includes('function setupLocalState') &&
            compiledCode.includes('typeDefs') &&
            compiledCode.includes('resolvers') &&
            compiledCode.includes('@client') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'setupLocalState needs implementation - replace placeholder with local state configuration' :
      (compiledCode.includes('function setupLocalState') ? undefined : 'setupLocalState function not found'),
    executionTime: 1,
  });

  // Test 3: Custom directives implementation
  tests.push({
    name: 'Custom directives implementation',
    passed: compiledCode.includes('function createCustomDirective') &&
            compiledCode.includes('directive') &&
            compiledCode.includes('@auth') &&
            compiledCode.includes('SchemaDirectiveVisitor') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'createCustomDirective needs implementation - replace placeholder with directive logic' :
      (compiledCode.includes('function createCustomDirective') ? undefined : 'createCustomDirective function not found'),
    executionTime: 1,
  });

  // Test 4: Performance monitoring link
  tests.push({
    name: 'Performance monitoring link',
    passed: compiledCode.includes('function createPerformanceLink') &&
            compiledCode.includes('performance.now') &&
            compiledCode.includes('metrics') &&
            compiledCode.includes('duration') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'createPerformanceLink needs implementation - replace placeholder with performance monitoring' :
      (compiledCode.includes('function createPerformanceLink') ? undefined : 'createPerformanceLink function not found'),
    executionTime: 1,
  });

  // Test 5: Testing strategies with MockedProvider
  tests.push({
    name: 'Testing strategies with MockedProvider',
    passed: compiledCode.includes('function setupMockedProvider') &&
            compiledCode.includes('MockedProvider') &&
            compiledCode.includes('mocks') &&
            compiledCode.includes('addTypename') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'setupMockedProvider needs implementation - replace placeholder with testing setup' :
      (compiledCode.includes('function setupMockedProvider') ? undefined : 'setupMockedProvider function not found'),
    executionTime: 1,
  });

  // Test 6: Schema stitching patterns
  tests.push({
    name: 'Schema stitching patterns',
    passed: compiledCode.includes('function stitchSchemas') &&
            compiledCode.includes('mergeSchemas') &&
            compiledCode.includes('transforms') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'stitchSchemas needs implementation - replace placeholder with schema stitching logic' :
      (compiledCode.includes('function stitchSchemas') ? undefined : 'stitchSchemas function not found'),
    executionTime: 1,
  });

  // Test 7: LocalStateManager component implementation
  tests.push(createComponentTest('LocalStateManager', compiledCode, {
    requiredElements: ['div', 'button'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('@client'),
    errorMessage: 'LocalStateManager component needs implementation with local state queries',
  }));

  // Test 8: DirectiveDemo component implementation
  tests.push(createComponentTest('DirectiveDemo', compiledCode, {
    requiredElements: ['div'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('directive'),
    errorMessage: 'DirectiveDemo component needs implementation to demonstrate custom directives',
  }));

  // Test 9: PerformanceMonitor component implementation
  tests.push(createComponentTest('PerformanceMonitor', compiledCode, {
    requiredElements: ['div', 'pre'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('metrics'),
    errorMessage: 'PerformanceMonitor component needs implementation to display performance data',
  }));

  return tests;
}