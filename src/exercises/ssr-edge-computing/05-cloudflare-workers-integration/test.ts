import type { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  try {
    // Test 1: WorkerHandler class exists
    if (compiledCode.includes('class WorkerHandler') && compiledCode.includes('async fetch(')) {
      tests.push({
        name: 'WorkerHandler implementation',
        passed: true,
        executionTime: 1
      });
    } else {
      tests.push({
        name: 'WorkerHandler implementation',
        passed: false,
        error: 'WorkerHandler class with fetch method not found',
        executionTime: 1
      });
    }

    // Test 2: KVStorage class exists
    if (compiledCode.includes('class KVStorage') && compiledCode.includes('async get(') && compiledCode.includes('async put(')) {
      tests.push({
        name: 'KVStorage implementation',
        passed: true,
        executionTime: 1
      });
    } else {
      tests.push({
        name: 'KVStorage implementation',
        passed: false,
        error: 'KVStorage class with get/put methods not found',
        executionTime: 1
      });
    }

    // Test 3: DurableObjects class exists
    if (compiledCode.includes('class ChatRoom') && compiledCode.includes('webSocketMessage')) {
      tests.push({
        name: 'DurableObjects implementation',
        passed: true,
        executionTime: 1
      });
    } else {
      tests.push({
        name: 'DurableObjects implementation',
        passed: false,
        error: 'Durable Objects implementation not found',
        executionTime: 1
      });
    }

    // Test 4: StreamProcessor class exists
    if (compiledCode.includes('class StreamProcessor') && compiledCode.includes('Transform')) {
      tests.push({
        name: 'StreamProcessor implementation',
        passed: true,
        executionTime: 1
      });
    } else {
      tests.push({
        name: 'StreamProcessor implementation',
        passed: false,
        error: 'StreamProcessor class not found',
        executionTime: 1
      });
    }

    // Test 5: Demo component exists
    if (compiledCode.includes('DemoCloudflareWorkers')) {
      tests.push({
        name: 'Demo component implementation',
        passed: true,
        executionTime: 1
      });
    } else {
      tests.push({
        name: 'Demo component implementation',
        passed: false,
        error: 'DemoCloudflareWorkers component not found',
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