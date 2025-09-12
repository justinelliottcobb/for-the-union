import type { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  try {
    // Test 1: MiddlewareChain class exists
    if (compiledCode.includes('class MiddlewareChain') && compiledCode.includes('use(') && compiledCode.includes('execute(')) {
      tests.push({
        name: 'MiddlewareChain implementation',
        passed: true,
        executionTime: 1
      });
    } else {
      tests.push({
        name: 'MiddlewareChain implementation',
        passed: false,
        error: 'MiddlewareChain class with use/execute methods not found',
        executionTime: 1
      });
    }

    // Test 2: AuthMiddleware class exists
    if (compiledCode.includes('class AuthMiddleware') && compiledCode.includes('authenticate')) {
      tests.push({
        name: 'AuthMiddleware implementation',
        passed: true,
        executionTime: 1
      });
    } else {
      tests.push({
        name: 'AuthMiddleware implementation',
        passed: false,
        error: 'AuthMiddleware class not found',
        executionTime: 1
      });
    }

    // Test 3: RateLimiter class exists
    if (compiledCode.includes('class RateLimiter') && compiledCode.includes('checkLimit')) {
      tests.push({
        name: 'RateLimiter implementation',
        passed: true,
        executionTime: 1
      });
    } else {
      tests.push({
        name: 'RateLimiter implementation',
        passed: false,
        error: 'RateLimiter class not found',
        executionTime: 1
      });
    }

    // Test 4: RequestRouter class exists
    if (compiledCode.includes('class RequestRouter') && compiledCode.includes('route')) {
      tests.push({
        name: 'RequestRouter implementation',
        passed: true,
        executionTime: 1
      });
    } else {
      tests.push({
        name: 'RequestRouter implementation',
        passed: false,
        error: 'RequestRouter class not found',
        executionTime: 1
      });
    }

    // Test 5: Demo component exists
    if (compiledCode.includes('DemoEdgeMiddleware')) {
      tests.push({
        name: 'Demo component implementation',
        passed: true,
        executionTime: 1
      });
    } else {
      tests.push({
        name: 'Demo component implementation',
        passed: false,
        error: 'DemoEdgeMiddleware component not found',
        executionTime: 1
      });
    }

  } catch (error) {
    tests.push({
      name: 'Code compilation test',
      passed: false,
      error: `Test execution failed: ${error}`,
      executionTime: 1
    });
  }

  return tests;
}