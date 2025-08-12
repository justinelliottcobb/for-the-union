// Test file for Discriminated Union State Patterns
// Tests advanced patterns for modeling complex domain state

import type { TestResult } from '@/types';
import { extractComponentCode, createComponentTest, createHookTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test 1: Entity lifecycle discriminated unions
  tests.push({
    name: 'Entity lifecycle discriminated unions',
    passed: compiledCode.includes('type EntityState') &&
            (compiledCode.includes("status: 'draft'") || compiledCode.includes("status: 'pending'")) &&
            (compiledCode.includes("status: 'published'") || compiledCode.includes("status: 'active'")) &&
            (compiledCode.includes("status: 'archived'") || compiledCode.includes("status: 'deleted'")),
    error: compiledCode.includes('type EntityState') ? undefined : 'Entity lifecycle discriminated unions not found',
    executionTime: 1,
  });

  // Test 2: Validation result discriminated unions
  tests.push({
    name: 'Validation result discriminated unions',
    passed: compiledCode.includes('type ValidationResult') &&
            (compiledCode.includes("status: 'valid'") || compiledCode.includes("type: 'success'")) &&
            (compiledCode.includes("status: 'invalid'") || compiledCode.includes("type: 'error'")) &&
            compiledCode.includes('errors:'),
    error: compiledCode.includes('type ValidationResult') ? undefined : 'Validation result discriminated unions not found',
    executionTime: 1,
  });

  // Test 3: Form field state discriminated unions
  tests.push({
    name: 'Form field state discriminated unions',
    passed: compiledCode.includes('type FieldState') &&
            (compiledCode.includes("status: 'pristine'") || compiledCode.includes("status: 'untouched'")) &&
            (compiledCode.includes("status: 'dirty'") || compiledCode.includes("status: 'touched'")) &&
            compiledCode.includes('value:'),
    error: compiledCode.includes('type FieldState') ? undefined : 'Form field state discriminated unions not found',
    executionTime: 1,
  });

  // Test 4: Resource loading states
  tests.push({
    name: 'Resource loading discriminated unions',
    passed: compiledCode.includes('type Resource') &&
            (compiledCode.includes("state: 'loading'") || compiledCode.includes("status: 'loading'")) &&
            (compiledCode.includes("state: 'loaded'") || compiledCode.includes("status: 'success'")) &&
            (compiledCode.includes("state: 'error'") || compiledCode.includes("status: 'error'")),
    error: compiledCode.includes('type Resource') ? undefined : 'Resource loading discriminated unions not found',
    executionTime: 1,
  });

  // Test 5: Business domain models
  tests.push({
    name: 'Business domain models',
    passed: compiledCode.includes('type Order') &&
            compiledCode.includes('type OrderItem') &&
            (compiledCode.includes('type Customer') || compiledCode.includes('type User')) &&
            compiledCode.includes('total:') &&
            compiledCode.includes('items:'),
    error: compiledCode.includes('type Order') ? undefined : 'Business domain models not found',
    executionTime: 1,
  });

  // Test 6: Nested state structures
  tests.push({
    name: 'Nested state structures',
    passed: compiledCode.includes('type ApplicationState') &&
            compiledCode.includes('auth:') &&
            compiledCode.includes('user:') &&
            (compiledCode.includes('ui:') || compiledCode.includes('app:')) &&
            compiledCode.includes('{'),
    error: compiledCode.includes('type ApplicationState') ? undefined : 'Nested state structures not found',
    executionTime: 1,
  });

  // Test 7: State normalization patterns
  tests.push({
    name: 'State normalization patterns',
    passed: compiledCode.includes('entities:') &&
            compiledCode.includes('ids:') &&
            (compiledCode.includes('byId:') || compiledCode.includes('Record<')) &&
            (compiledCode.includes('allIds') || compiledCode.includes('Array<')),
    error: compiledCode.includes('entities:') ? undefined : 'State normalization patterns not found',
    executionTime: 1,
  });

  // Test 8: Entity validation functions
  tests.push(createHookTest('validateEntity', compiledCode, {
    requiredContent: ['ValidationResult', 'errors', 'valid'],
    errorMessage: 'validateEntity function needs proper validation logic with discriminated unions',
  }));

  // Test 9: State update functions
  tests.push(createHookTest('updateEntityState', compiledCode, {
    requiredContent: ['EntityState', 'status', 'entities'],
    errorMessage: 'updateEntityState function needs entity lifecycle management',
  }));

  // Test 10: Resource loading hook
  tests.push(createHookTest('useResource', compiledCode, {
    requiredContent: ['Resource', 'loading', 'loaded', 'useState', 'useEffect'],
    errorMessage: 'useResource hook needs resource state management with discriminated unions',
  }));

  // Test 11: Form validation hook
  tests.push(createHookTest('useFormValidation', compiledCode, {
    requiredContent: ['FieldState', 'ValidationResult', 'validate', 'pristine'],
    errorMessage: 'useFormValidation hook needs form field state management',
  }));

  // Test 12: Entity management hook
  tests.push(createHookTest('useEntityManager', compiledCode, {
    requiredContent: ['EntityState', 'create', 'update', 'delete', 'useReducer'],
    errorMessage: 'useEntityManager hook needs complete entity lifecycle management',
  }));

  // Test 13: Order management component
  tests.push(createComponentTest('OrderManager', compiledCode, {
    requiredHooks: ['useEntityManager', 'useState'],
    requiredElements: ['div', 'button', 'form'],
    errorMessage: 'OrderManager component needs entity management with UI',
  }));

  // Test 14: Validation form component
  tests.push(createComponentTest('ValidationForm', compiledCode, {
    requiredHooks: ['useFormValidation'],
    requiredElements: ['form', 'input', 'div'],
    errorMessage: 'ValidationForm component needs form validation with error display',
  }));

  // Test 15: Resource viewer component
  tests.push(createComponentTest('ResourceViewer', compiledCode, {
    requiredHooks: ['useResource'],
    requiredElements: ['div'],
    errorMessage: 'ResourceViewer component needs resource loading state management',
  }));

  return tests;
}