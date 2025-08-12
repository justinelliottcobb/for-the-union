// Test file for URQL Custom Exchanges exercise
// Tests implementation of custom URQL exchanges and client configuration

import type { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test 1: authExchange implementation
  tests.push({
    name: 'authExchange implementation',
    passed: compiledCode.includes('function authExchange') &&
            compiledCode.includes('getAuthToken') &&
            compiledCode.includes('Authorization') &&
            compiledCode.includes('Bearer') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'authExchange needs implementation - replace placeholder with authentication logic' :
      (compiledCode.includes('function authExchange') ? undefined : 'authExchange function not found'),
    executionTime: 1,
  });

  // Test 2: retryExchange implementation
  tests.push({
    name: 'retryExchange implementation',
    passed: compiledCode.includes('function retryExchange') &&
            compiledCode.includes('maxRetries') &&
            compiledCode.includes('shouldRetry') &&
            compiledCode.includes('delay') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'retryExchange needs implementation - replace placeholder with retry logic' :
      (compiledCode.includes('function retryExchange') ? undefined : 'retryExchange function not found'),
    executionTime: 1,
  });

  // Test 3: transformationExchange implementation
  tests.push({
    name: 'transformationExchange implementation',
    passed: compiledCode.includes('function transformationExchange') &&
            compiledCode.includes('requestId') &&
            compiledCode.includes('performance.now') &&
            compiledCode.includes('meta') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'transformationExchange needs implementation - replace placeholder with transformation logic' :
      (compiledCode.includes('function transformationExchange') ? undefined : 'transformationExchange function not found'),
    executionTime: 1,
  });

  // Test 4: errorHandlingExchange implementation
  tests.push({
    name: 'errorHandlingExchange implementation',
    passed: compiledCode.includes('function errorHandlingExchange') &&
            compiledCode.includes('categorizeError') &&
            compiledCode.includes('timestamp') &&
            compiledCode.includes('operation') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'errorHandlingExchange needs implementation - replace placeholder with error handling logic' :
      (compiledCode.includes('function errorHandlingExchange') ? undefined : 'errorHandlingExchange function not found'),
    executionTime: 1,
  });

  // Test 5: createUrqlClient implementation
  tests.push({
    name: 'createUrqlClient implementation',
    passed: compiledCode.includes('function createUrqlClient') &&
            compiledCode.includes('Client') &&
            compiledCode.includes('exchanges') &&
            compiledCode.includes('fetchExchange') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'createUrqlClient needs implementation - replace placeholder with client creation logic' :
      (compiledCode.includes('function createUrqlClient') ? undefined : 'createUrqlClient function not found'),
    executionTime: 1,
  });

  // Test 6: Error categorization helper
  tests.push({
    name: 'Error categorization helper',
    passed: compiledCode.includes('function categorizeError') &&
            compiledCode.includes('networkError') &&
            compiledCode.includes('graphQLErrors') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'categorizeError needs implementation - replace placeholder with error categorization logic' :
      (compiledCode.includes('function categorizeError') ? undefined : 'categorizeError function not found'),
    executionTime: 1,
  });

  // Test 7: AuthComponent implementation
  tests.push(createComponentTest('AuthComponent', compiledCode, {
    requiredElements: ['div', 'button'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('useQuery'),
    errorMessage: 'AuthComponent needs implementation with URQL useQuery hook',
  }));

  // Test 8: RetryDemo component implementation
  tests.push(createComponentTest('RetryDemo', compiledCode, {
    requiredElements: ['div', 'button'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('useMutation'),
    errorMessage: 'RetryDemo component needs implementation with URQL useMutation hook',
  }));

  // Test 9: MetricsDisplay component implementation
  tests.push(createComponentTest('MetricsDisplay', compiledCode, {
    requiredElements: ['div', 'pre'],
    customValidation: (code) => !code.includes('Your code here'),
    errorMessage: 'MetricsDisplay component needs implementation to show request metrics',
  }));

  return tests;
}