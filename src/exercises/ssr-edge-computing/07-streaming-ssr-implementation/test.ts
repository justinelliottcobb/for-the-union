import type { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  try {
    // Test 1: StreamRenderer class exists
    if (compiledCode.includes('class StreamRenderer') && compiledCode.includes('renderToStream')) {
      tests.push({
        name: 'StreamRenderer implementation',
        passed: true,
        executionTime: 1
      });
    } else {
      tests.push({
        name: 'StreamRenderer implementation',
        passed: false,
        error: 'StreamRenderer class with renderToStream method not found',
        executionTime: 1
      });
    }

    // Test 2: ChunkProcessor class exists
    if (compiledCode.includes('class ChunkProcessor') && compiledCode.includes('processChunk')) {
      tests.push({
        name: 'ChunkProcessor implementation',
        passed: true,
        executionTime: 1
      });
    } else {
      tests.push({
        name: 'ChunkProcessor implementation',
        passed: false,
        error: 'ChunkProcessor class not found',
        executionTime: 1
      });
    }

    // Test 3: HydrationManager class exists
    if (compiledCode.includes('class HydrationManager') && compiledCode.includes('scheduleHydration')) {
      tests.push({
        name: 'HydrationManager implementation',
        passed: true,
        executionTime: 1
      });
    } else {
      tests.push({
        name: 'HydrationManager implementation',
        passed: false,
        error: 'HydrationManager class not found',
        executionTime: 1
      });
    }

    // Test 4: ProgressiveLoader class exists
    if (compiledCode.includes('class ProgressiveLoader') && compiledCode.includes('loadChunk')) {
      tests.push({
        name: 'ProgressiveLoader implementation',
        passed: true,
        executionTime: 1
      });
    } else {
      tests.push({
        name: 'ProgressiveLoader implementation',
        passed: false,
        error: 'ProgressiveLoader class not found',
        executionTime: 1
      });
    }

    // Test 5: Demo component exists
    if (compiledCode.includes('DemoStreamingSSR')) {
      tests.push({
        name: 'Demo component implementation',
        passed: true,
        executionTime: 1
      });
    } else {
      tests.push({
        name: 'Demo component implementation',
        passed: false,
        error: 'DemoStreamingSSR component not found',
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