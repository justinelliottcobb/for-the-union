// Test file for useReducer with Discriminated Union Patterns
// Tests implementation of advanced state management patterns

import type { TestResult } from '@/types';
import { extractComponentCode, createComponentTest, createHookTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test 1: AsyncState discriminated union definition (already complete in scaffold)
  tests.push({
    name: 'AsyncState discriminated union',
    passed: compiledCode.includes('type AsyncState<TData, TError = string>') &&
            compiledCode.includes("status: 'idle'") &&
            compiledCode.includes("status: 'loading'") &&
            compiledCode.includes("status: 'success'") &&
            compiledCode.includes("status: 'error'"),
    error: undefined, // Type is already defined in scaffold
    executionTime: 1,
  });

  // Test 2: AsyncAction discriminated union definition (already complete in scaffold)
  tests.push({
    name: 'AsyncAction discriminated union',
    passed: compiledCode.includes('type AsyncAction<TData, TError = string>') &&
            compiledCode.includes("type: 'FETCH_START'") &&
            compiledCode.includes("type: 'FETCH_SUCCESS'") &&
            compiledCode.includes("type: 'FETCH_ERROR'") &&
            compiledCode.includes("type: 'RETRY'"),
    error: undefined, // Type is already defined in scaffold
    executionTime: 1,
  });

  // Test 3: Shopping cart types (already complete in scaffold)
  tests.push({
    name: 'Shopping cart type definitions',
    passed: compiledCode.includes('type CartItem') &&
            compiledCode.includes('type CartState') &&
            compiledCode.includes('type CartAction') &&
            compiledCode.includes('id: string') &&
            compiledCode.includes('quantity: number'),
    error: undefined, // Types are already defined in scaffold
    executionTime: 1,
  });

  // Test 4: Async data reducer implementation
  tests.push({
    name: 'asyncDataReducer implementation',
    passed: compiledCode.includes('function asyncDataReducer') &&
            compiledCode.includes('switch') &&
            compiledCode.includes('action.type') &&
            compiledCode.includes('FETCH_START') &&
            compiledCode.includes('FETCH_SUCCESS') &&
            !compiledCode.includes('return state;'), // Should not return state unchanged
    error: compiledCode.includes('return state;') && compiledCode.includes('// Your code here') ?
      'asyncDataReducer needs implementation - replace placeholder with switch statement logic' :
      (compiledCode.includes('function asyncDataReducer') ? undefined : 'asyncDataReducer function not found'),
    executionTime: 1,
  });

  // Test 5: Shopping cart reducer implementation  
  tests.push({
    name: 'cartReducer implementation',
    passed: compiledCode.includes('function cartReducer') &&
            compiledCode.includes('switch') &&
            compiledCode.includes('ADD_ITEM') &&
            compiledCode.includes('REMOVE_ITEM') &&
            compiledCode.includes('UPDATE_QUANTITY') &&
            !compiledCode.includes('return state;'), // Should not return state unchanged
    error: compiledCode.includes('return state;') && compiledCode.includes('// Your code here') ?
      'cartReducer needs implementation - replace placeholder with switch statement logic' :
      (compiledCode.includes('function cartReducer') ? undefined : 'cartReducer function not found'),
    executionTime: 1,
  });

  // Test 6: useAsyncData hook implementation
  tests.push({
    name: 'useAsyncData hook implementation',
    passed: compiledCode.includes('function useAsyncData') &&
            compiledCode.includes('useReducer') &&
            compiledCode.includes('asyncDataReducer') &&
            !compiledCode.includes("{ status: 'idle' }"), // Should not use hardcoded state
    error: compiledCode.includes("{ status: 'idle' }") && compiledCode.includes('// Your code here') ?
      'useAsyncData needs implementation - replace placeholder with useReducer logic' :
      (compiledCode.includes('function useAsyncData') ? undefined : 'useAsyncData hook not found'),
    executionTime: 1,
  });

  // Test 7: useShoppingCart hook implementation
  tests.push({
    name: 'useShoppingCart hook implementation',
    passed: compiledCode.includes('function useShoppingCart') &&
            compiledCode.includes('useReducer') &&
            compiledCode.includes('cartReducer') &&
            !compiledCode.includes('total: 0'), // Should not use hardcoded state
    error: compiledCode.includes('total: 0') && compiledCode.includes('// Your code here') ?
      'useShoppingCart needs implementation - replace placeholder with useReducer logic' :
      (compiledCode.includes('function useShoppingCart') ? undefined : 'useShoppingCart hook not found'),
    executionTime: 1,
  });

  // Test 8: Undo/redo types (already complete in scaffold)
  tests.push({
    name: 'Undo/redo type definitions',
    passed: compiledCode.includes('type UndoRedoState') &&
            compiledCode.includes('type UndoRedoAction') &&
            compiledCode.includes('past:') &&
            compiledCode.includes('present:') &&
            compiledCode.includes('future:'),
    error: undefined, // Types are already defined in scaffold
    executionTime: 1,
  });

  // Test 9: undoRedoReducer implementation
  tests.push({
    name: 'undoRedoReducer implementation',
    passed: compiledCode.includes('function undoRedoReducer') &&
            compiledCode.includes('switch') &&
            compiledCode.includes('UNDO') &&
            compiledCode.includes('REDO') &&
            compiledCode.includes('PRESENT') &&
            !compiledCode.includes('return state;'), // Should not return state unchanged
    error: compiledCode.includes('return state;') && compiledCode.includes('// Your code here') ?
      'undoRedoReducer needs implementation - replace placeholder with switch statement logic' :
      (compiledCode.includes('function undoRedoReducer') ? undefined : 'undoRedoReducer function not found'),
    executionTime: 1,
  });

  // Test 10: useUndoRedo hook implementation
  tests.push({
    name: 'useUndoRedo hook implementation',
    passed: compiledCode.includes('function useUndoRedo') &&
            compiledCode.includes('useReducer') &&
            compiledCode.includes('undoRedoReducer') &&
            !compiledCode.includes('past: [],'), // Should not use hardcoded state
    error: compiledCode.includes('past: [],') && compiledCode.includes('// Your code here') ?
      'useUndoRedo needs implementation - replace placeholder with useReducer logic' :
      (compiledCode.includes('function useUndoRedo') ? undefined : 'useUndoRedo hook not found'),
    executionTime: 1,
  });

  // Test 11: Form validation types (already complete in scaffold)
  tests.push({
    name: 'Form validation type definitions',
    passed: compiledCode.includes('type ValidationResult') &&
            compiledCode.includes('type FormState') &&
            compiledCode.includes("status: 'valid'"),
    error: undefined, // Types are already defined in scaffold
    executionTime: 1,
  });

  // Test 12: FormWithValidation component implementation
  tests.push(createComponentTest('FormWithValidation', compiledCode, {
    requiredHooks: ['useReducer'],
    requiredElements: ['form', 'input', 'button'],
    customValidation: (code) => !code.includes('placeholder="Your code here"'),
    errorMessage: 'FormWithValidation component needs useReducer implementation and proper form inputs',
  }));

  // Test 13: DataFetcher component implementation
  tests.push(createComponentTest('DataFetcher', compiledCode, {
    requiredHooks: ['useAsyncData'],
    requiredElements: ['div', 'button'],
    customValidation: (code) => !code.includes('Your code here'),
    errorMessage: 'DataFetcher component needs useAsyncData hook and proper async state UI',
  }));

  // Test 14: ShoppingCartComponent implementation
  tests.push(createComponentTest('ShoppingCartComponent', compiledCode, {
    requiredHooks: ['useShoppingCart'],
    requiredElements: ['div', 'button'],
    customValidation: (code) => !code.includes('Shopping Cart') || code.includes('map'),
    errorMessage: 'ShoppingCartComponent needs useShoppingCart hook and cart item rendering',
  }));

  // Test 15: UndoRedoDemo component implementation
  tests.push(createComponentTest('UndoRedoDemo', compiledCode, {
    requiredHooks: ['useUndoRedo'],
    requiredElements: ['div', 'button'],
    customValidation: (code) => !code.includes('Current state: Your code here'),
    errorMessage: 'UndoRedoDemo component needs useUndoRedo hook and proper state display',
  }));

  return tests;
}