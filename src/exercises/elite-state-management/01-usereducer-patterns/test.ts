// Test file for useReducer with Discriminated Union Patterns
// Tests implementation of advanced state management patterns

import type { TestResult } from '@/types';
import { extractComponentCode, createComponentTest, createHookTest } from '@/lib/test-utils';

export default function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test 1: AsyncState discriminated union definition
  tests.push({
    name: 'AsyncState discriminated union',
    passed: compiledCode.includes('type AsyncState<TData, TError = string>') &&
            compiledCode.includes("status: 'idle'") &&
            compiledCode.includes("status: 'loading'") &&
            compiledCode.includes("status: 'success'") &&
            compiledCode.includes("status: 'error'"),
    error: compiledCode.includes('type AsyncState') ? undefined : 'AsyncState discriminated union not found or incomplete',
    executionTime: 1,
  });

  // Test 2: AsyncAction discriminated union definition
  tests.push({
    name: 'AsyncAction discriminated union',
    passed: compiledCode.includes('type AsyncAction<TData, TError = string>') &&
            compiledCode.includes("type: 'FETCH_START'") &&
            compiledCode.includes("type: 'FETCH_SUCCESS'") &&
            compiledCode.includes("type: 'FETCH_ERROR'") &&
            compiledCode.includes("type: 'RETRY'"),
    error: compiledCode.includes('type AsyncAction') ? undefined : 'AsyncAction discriminated union not found or incomplete',
    executionTime: 1,
  });

  // Test 3: Shopping cart types
  tests.push({
    name: 'Shopping cart type definitions',
    passed: compiledCode.includes('type CartItem') &&
            compiledCode.includes('type CartState') &&
            compiledCode.includes('type CartAction') &&
            compiledCode.includes('id: string') &&
            compiledCode.includes('quantity: number'),
    error: compiledCode.includes('type CartItem') ? undefined : 'Cart type definitions not found or incomplete',
    executionTime: 1,
  });

  // Test 4: Async data reducer
  tests.push(createHookTest('asyncDataReducer', compiledCode, {
    requiredContent: ['AsyncState', 'AsyncAction', 'switch', 'action.type'],
    errorMessage: 'asyncDataReducer function needs proper discriminated union handling with switch statement',
  }));

  // Test 5: Shopping cart reducer
  tests.push(createHookTest('cartReducer', compiledCode, {
    requiredContent: ['CartState', 'CartAction', 'switch', 'ADD_ITEM', 'REMOVE_ITEM', 'UPDATE_QUANTITY'],
    errorMessage: 'cartReducer function needs proper discriminated union handling for cart operations',
  }));

  // Test 6: Data fetching hook
  tests.push(createHookTest('useAsyncData', compiledCode, {
    requiredContent: ['useReducer', 'asyncDataReducer', 'useCallback', 'fetch'],
    errorMessage: 'useAsyncData hook needs useReducer with asyncDataReducer and async fetch logic',
  }));

  // Test 7: Shopping cart hook
  tests.push(createHookTest('useShoppingCart', compiledCode, {
    requiredContent: ['useReducer', 'cartReducer', 'addItem', 'removeItem', 'updateQuantity'],
    errorMessage: 'useShoppingCart hook needs useReducer with cartReducer and cart action functions',
  }));

  // Test 8: Undo/redo types
  tests.push({
    name: 'Undo/redo type definitions',
    passed: compiledCode.includes('type UndoRedoState') &&
            compiledCode.includes('type UndoRedoAction') &&
            compiledCode.includes('history:') &&
            compiledCode.includes('currentIndex:'),
    error: compiledCode.includes('type UndoRedoState') ? undefined : 'UndoRedoState and UndoRedoAction types not found',
    executionTime: 1,
  });

  // Test 9: Undo/redo reducer
  tests.push(createHookTest('undoRedoReducer', compiledCode, {
    requiredContent: ['UndoRedoState', 'UndoRedoAction', 'UNDO', 'REDO', 'ADD_STATE'],
    errorMessage: 'undoRedoReducer function needs proper undo/redo logic with discriminated unions',
  }));

  // Test 10: Undo/redo hook
  tests.push(createHookTest('useUndoRedo', compiledCode, {
    requiredContent: ['useReducer', 'undoRedoReducer', 'undo', 'redo', 'canUndo', 'canRedo'],
    errorMessage: 'useUndoRedo hook needs complete undo/redo functionality',
  }));

  // Test 11: Form validation types
  tests.push({
    name: 'Form validation type definitions',
    passed: compiledCode.includes('type ValidationResult') &&
            compiledCode.includes('type FormState') &&
            (compiledCode.includes("status: 'valid'") || compiledCode.includes("status: 'invalid'")),
    error: compiledCode.includes('type ValidationResult') ? undefined : 'Form validation types not found',
    executionTime: 1,
  });

  // Test 12: Form component with useReducer
  tests.push(createComponentTest('FormWithValidation', compiledCode, {
    requiredHooks: ['useReducer'],
    requiredElements: ['form', 'input', 'button'],
    errorMessage: 'FormWithValidation component needs useReducer for form state management',
  }));

  // Test 13: Data fetching component
  tests.push(createComponentTest('DataFetcher', compiledCode, {
    requiredHooks: ['useAsyncData', 'useEffect'],
    requiredElements: ['div', 'button'],
    errorMessage: 'DataFetcher component needs useAsyncData hook and proper UI for async states',
  }));

  // Test 14: Shopping cart component
  tests.push(createComponentTest('ShoppingCartComponent', compiledCode, {
    requiredHooks: ['useShoppingCart'],
    requiredElements: ['div', 'button'],
    errorMessage: 'ShoppingCartComponent needs useShoppingCart hook and cart UI',
  }));

  // Test 15: Undo/redo demonstration component
  tests.push(createComponentTest('UndoRedoDemo', compiledCode, {
    requiredHooks: ['useUndoRedo'],
    requiredElements: ['div', 'button'],
    errorMessage: 'UndoRedoDemo component needs useUndoRedo hook and undo/redo buttons',
  }));

  return tests;
}