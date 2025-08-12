// Test file for Advanced State Machines with XState
// Tests implementation of XState patterns with discriminated unions

import type { TestResult } from '@/types';
import { extractComponentCode, createComponentTest, createHookTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test 1: XState imports and basic setup
  tests.push({
    name: 'XState imports and setup',
    passed: compiledCode.includes('from \'xstate\'') &&
            (compiledCode.includes('createMachine') || compiledCode.includes('Machine')) &&
            (compiledCode.includes('interpret') || compiledCode.includes('useMachine')),
    error: compiledCode.includes('xstate') ? undefined : 'XState imports and basic setup not found',
    executionTime: 1,
  });

  // Test 2: Authentication state machine
  tests.push({
    name: 'Authentication state machine definition',
    passed: compiledCode.includes('authMachine') &&
            compiledCode.includes('states:') &&
            (compiledCode.includes('loggedOut') || compiledCode.includes('unauthenticated')) &&
            (compiledCode.includes('loggedIn') || compiledCode.includes('authenticated')) &&
            compiledCode.includes('loading'),
    error: compiledCode.includes('authMachine') ? undefined : 'Authentication state machine not found',
    executionTime: 1,
  });

  // Test 3: State machine events/actions
  tests.push({
    name: 'State machine events and actions',
    passed: compiledCode.includes('LOGIN') &&
            compiledCode.includes('LOGOUT') &&
            (compiledCode.includes('SUCCESS') || compiledCode.includes('RESOLVE')) &&
            (compiledCode.includes('FAILURE') || compiledCode.includes('REJECT')) &&
            compiledCode.includes('on:'),
    error: compiledCode.includes('LOGIN') ? undefined : 'State machine events and actions not found',
    executionTime: 1,
  });

  // Test 4: State machine guards
  tests.push({
    name: 'State machine guards',
    passed: compiledCode.includes('guards:') &&
            (compiledCode.includes('cond:') || compiledCode.includes('guard:')) &&
            (compiledCode.includes('isValidUser') || compiledCode.includes('canAccess')),
    error: compiledCode.includes('guards:') ? undefined : 'State machine guards not found',
    executionTime: 1,
  });

  // Test 5: State machine services/activities
  tests.push({
    name: 'State machine services',
    passed: compiledCode.includes('services:') &&
            (compiledCode.includes('invoke:') || compiledCode.includes('src:')) &&
            (compiledCode.includes('loginUser') || compiledCode.includes('fetchUser')),
    error: compiledCode.includes('services:') ? undefined : 'State machine services not found',
    executionTime: 1,
  });

  // Test 6: Shopping cart state machine
  tests.push({
    name: 'Shopping cart state machine',
    passed: compiledCode.includes('cartMachine') &&
            compiledCode.includes('empty') &&
            compiledCode.includes('hasItems') &&
            (compiledCode.includes('checkout') || compiledCode.includes('purchasing')),
    error: compiledCode.includes('cartMachine') ? undefined : 'Shopping cart state machine not found',
    executionTime: 1,
  });

  // Test 7: Form wizard state machine
  tests.push({
    name: 'Form wizard state machine',
    passed: compiledCode.includes('formWizardMachine') &&
            compiledCode.includes('step1') &&
            compiledCode.includes('step2') &&
            compiledCode.includes('NEXT') &&
            compiledCode.includes('PREVIOUS'),
    error: compiledCode.includes('formWizardMachine') ? undefined : 'Form wizard state machine not found',
    executionTime: 1,
  });

  // Test 8: Hierarchical states
  tests.push({
    name: 'Hierarchical state implementation',
    passed: compiledCode.includes('states:') &&
            (compiledCode.includes('initial:') || compiledCode.includes('entry:')) &&
            (compiledCode.includes('idle') || compiledCode.includes('active')) &&
            compiledCode.includes('{') && // Nested state structure
            (compiledCode.includes('on: {') || compiledCode.includes('invoke: {')),
    error: compiledCode.includes('initial:') ? undefined : 'Hierarchical state structure not found',
    executionTime: 1,
  });

  // Test 9: Parallel states (if implemented)
  tests.push({
    name: 'Parallel states pattern',
    passed: compiledCode.includes('type:') &&
            (compiledCode.includes("'parallel'") || compiledCode.includes('parallel')) &&
            compiledCode.includes('regions:'),
    error: compiledCode.includes('parallel') ? undefined : 'Parallel states pattern not found (optional)',
    executionTime: 1,
  });

  // Test 10: Machine context and assignments
  tests.push({
    name: 'State machine context',
    passed: compiledCode.includes('context:') &&
            compiledCode.includes('assign') &&
            (compiledCode.includes('user:') || compiledCode.includes('data:') || compiledCode.includes('error:')),
    error: compiledCode.includes('context:') ? undefined : 'State machine context and assignments not found',
    executionTime: 1,
  });

  // Test 11: Auth component with XState
  tests.push(createComponentTest('AuthComponent', compiledCode, {
    requiredHooks: ['useMachine'],
    requiredElements: ['div', 'button'],
    errorMessage: 'AuthComponent needs useMachine hook and authentication UI',
  }));

  // Test 12: Shopping cart component with XState
  tests.push(createComponentTest('ShoppingCartXState', compiledCode, {
    requiredHooks: ['useMachine'],
    requiredElements: ['div', 'button'],
    errorMessage: 'ShoppingCartXState component needs state machine integration',
  }));

  // Test 13: Form wizard component
  tests.push(createComponentTest('FormWizard', compiledCode, {
    requiredHooks: ['useMachine'],
    requiredElements: ['form', 'button'],
    errorMessage: 'FormWizard component needs multi-step form with state machine',
  }));

  // Test 14: Traffic light example (classic state machine)
  tests.push(createComponentTest('TrafficLight', compiledCode, {
    requiredHooks: ['useMachine'],
    requiredElements: ['div'],
    errorMessage: 'TrafficLight component demonstrates basic state machine patterns',
  }));

  // Test 15: State visualizer or debugger component
  tests.push(createComponentTest('StateVisualizer', compiledCode, {
    requiredElements: ['div', 'pre'],
    errorMessage: 'StateVisualizer component shows current state and context',
  }));

  return tests;
}