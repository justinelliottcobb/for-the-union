import { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: Button component implementation
  results.push({
    name: 'Button Component Implementation',
    passed: compiledCode.includes('export const Button') &&
            !compiledCode.includes('// TODO: Implement button styling') &&
            compiledCode.includes('getButtonStyles') &&
            compiledCode.includes('variant') &&
            compiledCode.includes('size'),
    error: (!compiledCode.includes('export const Button')) ?
      'Button component is not exported' :
      (compiledCode.includes('// TODO: Implement button styling')) ?
      'Button contains TODO comments - complete implementation' :
      'Button should implement variant and size-based styling',
    executionTime: 1
  });

  // Test 2: Card component implementation
  results.push({
    name: 'Card Component Implementation',
    passed: compiledCode.includes('export const Card') &&
            compiledCode.includes('elevated') &&
            compiledCode.includes('data-testid="card"'),
    error: (!compiledCode.includes('export const Card')) ?
      'Card component is not exported' :
      'Card should support elevation and proper test attributes',
    executionTime: 1
  });

  return results;
}