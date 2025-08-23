import { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: APIClient class implementation
  results.push({
    name: 'APIClient Class Implementation',
    passed: compiledCode.includes('export class APIClient') &&
            !compiledCode.includes('// TODO: Implement HTTP methods') &&
            compiledCode.includes('async get') &&
            compiledCode.includes('async post'),
    error: (!compiledCode.includes('export class APIClient')) ?
      'APIClient class is not exported' :
      (compiledCode.includes('// TODO: Implement HTTP methods')) ?
      'APIClient contains TODO comments - implement HTTP methods' :
      'APIClient should implement get and post methods',
    executionTime: 1
  });

  // Test 2: WebSocketManager implementation
  results.push({
    name: 'WebSocketManager Implementation',
    passed: compiledCode.includes('export class WebSocketManager') &&
            !compiledCode.includes('// TODO: Implement WebSocket') &&
            compiledCode.includes('connect') &&
            compiledCode.includes('send'),
    error: (!compiledCode.includes('export class WebSocketManager')) ?
      'WebSocketManager class is not exported' :
      (compiledCode.includes('// TODO: Implement WebSocket')) ?
      'WebSocketManager contains TODO comments - complete implementation' :
      'WebSocketManager should implement connect and send methods',
    executionTime: 1
  });

  return results;
}