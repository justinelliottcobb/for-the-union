// Test file for GraphQL Schema Design exercise
// Tests implementation of schema design patterns and type generation

import type { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test 1: Product type schema implementation
  tests.push({
    name: 'Product type schema implementation',
    passed: compiledCode.includes('type Product') &&
            compiledCode.includes('id: ID!') &&
            compiledCode.includes('name: String!') &&
            compiledCode.includes('price: Float!') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Product type needs implementation - replace placeholder with schema definition' :
      (compiledCode.includes('type Product') ? undefined : 'Product type definition not found'),
    executionTime: 1,
  });

  // Test 2: Query type with pagination implementation
  tests.push({
    name: 'Query type with pagination implementation',
    passed: compiledCode.includes('type Query') &&
            compiledCode.includes('products(') &&
            compiledCode.includes('first: Int') &&
            compiledCode.includes('after: String') &&
            compiledCode.includes('Connection') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Query type needs implementation - replace placeholder with query definitions and pagination' :
      (compiledCode.includes('type Query') ? undefined : 'Query type definition not found'),
    executionTime: 1,
  });

  // Test 3: Connection and Edge types implementation
  tests.push({
    name: 'Connection and Edge types implementation',
    passed: compiledCode.includes('type ProductConnection') &&
            compiledCode.includes('type ProductEdge') &&
            compiledCode.includes('PageInfo') &&
            compiledCode.includes('hasNextPage') &&
            compiledCode.includes('hasPreviousPage') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Connection types need implementation - replace placeholder with Relay-style connection definitions' :
      (compiledCode.includes('type ProductConnection') ? undefined : 'Connection type definitions not found'),
    executionTime: 1,
  });

  // Test 4: Input types for mutations
  tests.push({
    name: 'Input types for mutations',
    passed: compiledCode.includes('input CreateProductInput') &&
            compiledCode.includes('input UpdateProductInput') &&
            compiledCode.includes('input ProductFilterInput') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Input types need implementation - replace placeholder with input type definitions' :
      (compiledCode.includes('input CreateProductInput') ? undefined : 'Input type definitions not found'),
    executionTime: 1,
  });

  // Test 5: Custom scalars implementation
  tests.push({
    name: 'Custom scalars implementation',
    passed: compiledCode.includes('scalar DateTime') &&
            compiledCode.includes('scalar URL') &&
            compiledCode.includes('scalar Price') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Custom scalars need implementation - replace placeholder with scalar definitions' :
      (compiledCode.includes('scalar DateTime') ? undefined : 'Custom scalar definitions not found'),
    executionTime: 1,
  });

  // Test 6: Enum types implementation
  tests.push({
    name: 'Enum types implementation',
    passed: compiledCode.includes('enum ProductStatus') &&
            compiledCode.includes('enum SortOrder') &&
            compiledCode.includes('ACTIVE') &&
            compiledCode.includes('ASC') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Enum types need implementation - replace placeholder with enum definitions' :
      (compiledCode.includes('enum ProductStatus') ? undefined : 'Enum type definitions not found'),
    executionTime: 1,
  });

  // Test 7: Interface and Union types
  tests.push({
    name: 'Interface and Union types',
    passed: compiledCode.includes('interface Node') &&
            compiledCode.includes('union SearchResult') &&
            compiledCode.includes('implements Node') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'Interface and Union types need implementation - replace placeholder with interface/union definitions' :
      (compiledCode.includes('interface Node') ? undefined : 'Interface/Union type definitions not found'),
    executionTime: 1,
  });

  // Test 8: TypeScript type generation helper
  tests.push({
    name: 'TypeScript type generation helper',
    passed: compiledCode.includes('generateTypes') &&
            compiledCode.includes('GraphQLSchema') &&
            compiledCode.includes('codegen') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'generateTypes needs implementation - replace placeholder with type generation logic' :
      (compiledCode.includes('generateTypes') ? undefined : 'generateTypes function not found'),
    executionTime: 1,
  });

  // Test 9: SchemaBuilder component implementation
  tests.push(createComponentTest('SchemaBuilder', compiledCode, {
    requiredElements: ['div', 'textarea', 'button'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('schema'),
    errorMessage: 'SchemaBuilder component needs implementation with schema editing functionality',
  }));

  // Test 10: TypeViewer component implementation
  tests.push(createComponentTest('TypeViewer', compiledCode, {
    requiredElements: ['div', 'pre', 'code'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('types'),
    errorMessage: 'TypeViewer component needs implementation to display generated types',
  }));

  // Test 11: SchemaValidation component implementation
  tests.push(createComponentTest('SchemaValidation', compiledCode, {
    requiredElements: ['div', 'ul', 'li'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('validate'),
    errorMessage: 'SchemaValidation component needs implementation to show validation results',
  }));

  return tests;
}