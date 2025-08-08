import type { TestResult } from '@/types';

export interface TestSuite {
  name: string;
  tests: TestFunction[];
}

export interface TestFunction {
  name: string;
  fn: () => void | Promise<void>;
  timeout?: number;
}

export class TestExecutor {
  private testSuites: TestSuite[] = [];
  
  describe(name: string, fn: () => void): void {
    const suite: TestSuite = { name, tests: [] };
    const originalIt = global.it;
    
    // Mock the global 'it' function to capture tests
    global.it = (testName: string, testFn: () => void | Promise<void>, timeout?: number) => {
      suite.tests.push({ name: testName, fn: testFn, timeout });
    };
    
    try {
      fn();
      this.testSuites.push(suite);
    } finally {
      global.it = originalIt;
    }
  }
  
  async runTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (const suite of this.testSuites) {
      for (const test of suite.tests) {
        const startTime = performance.now();
        
        try {
          await Promise.race([
            test.fn(),
            this.timeout(test.timeout || 5000)
          ]);
          
          const endTime = performance.now();
          results.push({
            name: `${suite.name} - ${test.name}`,
            passed: true,
            executionTime: endTime - startTime,
          });
        } catch (error) {
          const endTime = performance.now();
          results.push({
            name: `${suite.name} - ${test.name}`,
            passed: false,
            error: error instanceof Error ? error.message : String(error),
            executionTime: endTime - startTime,
          });
        }
      }
    }
    
    return results;
  }
  
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Test timed out after ${ms}ms`)), ms);
    });
  }
  
  // Mock assertion functions for basic testing
  static expect(actual: any): ExpectMatcher {
    return new ExpectMatcher(actual);
  }
}

class ExpectMatcher {
  constructor(private actual: any) {}
  
  toBe(expected: any): void {
    if (this.actual !== expected) {
      throw new Error(`Expected ${this.actual} to be ${expected}`);
    }
  }
  
  toEqual(expected: any): void {
    if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} to equal ${JSON.stringify(expected)}`);
    }
  }
  
  toBeCloseTo(expected: number, precision = 2): void {
    const actual = Number(this.actual);
    const diff = Math.abs(actual - expected);
    const threshold = Math.pow(10, -precision) / 2;
    
    if (diff >= threshold) {
      throw new Error(`Expected ${actual} to be close to ${expected} (precision: ${precision})`);
    }
  }
  
  toBeGreaterThan(expected: number): void {
    if (this.actual <= expected) {
      throw new Error(`Expected ${this.actual} to be greater than ${expected}`);
    }
  }
  
  toBeTruthy(): void {
    if (!this.actual) {
      throw new Error(`Expected ${this.actual} to be truthy`);
    }
  }
  
  toBeFalsy(): void {
    if (this.actual) {
      throw new Error(`Expected ${this.actual} to be falsy`);
    }
  }
  
  toContain(expected: any): void {
    if (typeof this.actual === 'string') {
      if (!this.actual.includes(expected)) {
        throw new Error(`Expected "${this.actual}" to contain "${expected}"`);
      }
    } else if (Array.isArray(this.actual)) {
      if (!this.actual.includes(expected)) {
        throw new Error(`Expected array ${JSON.stringify(this.actual)} to contain ${expected}`);
      }
    } else {
      throw new Error('toContain can only be used with strings or arrays');
    }
  }
  
  toHaveLength(expected: number): void {
    if (!this.actual || typeof this.actual.length !== 'number') {
      throw new Error(`Expected ${this.actual} to have a length property`);
    }
    if (this.actual.length !== expected) {
      throw new Error(`Expected ${this.actual} to have length ${expected}, but got ${this.actual.length}`);
    }
  }
  
  toThrow(expectedMessage?: string): void {
    if (typeof this.actual !== 'function') {
      throw new Error('Expected a function to test for throwing');
    }
    
    try {
      this.actual();
      throw new Error('Expected function to throw, but it did not');
    } catch (error) {
      if (expectedMessage) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes(expectedMessage)) {
          throw new Error(`Expected function to throw with message containing "${expectedMessage}", but got "${message}"`);
        }
      }
    }
  }
}