import type { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test Web3StateManager class implementation
  tests.push({
    name: 'Web3StateManager class exists',
    passed: compiledCode.includes('class Web3StateManager'),
    error: !compiledCode.includes('class Web3StateManager') ? 'Web3StateManager class is missing' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'Web3StateManager state methods',
    passed: compiledCode.includes('getState') && compiledCode.includes('setState'),
    error: !compiledCode.includes('getState') ? 'Web3StateManager needs getState and setState methods' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'Web3StateManager subscription support',
    passed: compiledCode.includes('subscribe') && compiledCode.includes('subscribers'),
    error: !compiledCode.includes('subscribe') ? 'Web3StateManager needs subscription system' : undefined,
    executionTime: 1
  });

  // Test TransactionQueue class implementation
  tests.push({
    name: 'TransactionQueue class exists',
    passed: compiledCode.includes('class TransactionQueue'),
    error: !compiledCode.includes('class TransactionQueue') ? 'TransactionQueue class is missing' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'TransactionQueue processing methods',
    passed: compiledCode.includes('add') && compiledCode.includes('process'),
    error: !compiledCode.includes('add') || !compiledCode.includes('process') ? 'TransactionQueue needs add and process methods' : undefined,
    executionTime: 1
  });

  // Test CacheManager class implementation
  tests.push({
    name: 'CacheManager class exists',
    passed: compiledCode.includes('class CacheManager'),
    error: !compiledCode.includes('class CacheManager') ? 'CacheManager class is missing' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'CacheManager cache operations',
    passed: compiledCode.includes('async get') && compiledCode.includes('async set'),
    error: !compiledCode.includes('async get') || !compiledCode.includes('async set') ? 'CacheManager needs async get/set methods' : undefined,
    executionTime: 1
  });

  // Test SyncEngine class implementation
  tests.push({
    name: 'SyncEngine class exists',
    passed: compiledCode.includes('class SyncEngine'),
    error: !compiledCode.includes('class SyncEngine') ? 'SyncEngine class is missing' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'SyncEngine control methods',
    passed: compiledCode.includes('async start') && compiledCode.includes('async stop'),
    error: !compiledCode.includes('async start') || !compiledCode.includes('async stop') ? 'SyncEngine needs async start/stop methods' : undefined,
    executionTime: 1
  });

  // Test React Context implementation
  tests.push({
    name: 'Web3StateContext defined',
    passed: compiledCode.includes('Web3StateContext') && compiledCode.includes('createContext'),
    error: !compiledCode.includes('Web3StateContext') ? 'Web3StateContext is missing' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'Web3StateProvider component',
    passed: compiledCode.includes('Web3StateProvider') && compiledCode.includes('React.FC'),
    error: !compiledCode.includes('Web3StateProvider') ? 'Web3StateProvider component is missing' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'useWeb3State hook',
    passed: compiledCode.includes('useWeb3State') && compiledCode.includes('useContext'),
    error: !compiledCode.includes('useWeb3State') ? 'useWeb3State hook is missing' : undefined,
    executionTime: 1
  });

  // Test React component implementation
  tests.push(createComponentTest('Web3StateManagementExercise', compiledCode, {
    requiredElements: ['Container', 'Title', 'Tabs'],
    customValidation: (code) => code.includes('useState') && code.includes('createContext'),
    errorMessage: 'Main component needs proper React hooks and context integration'
  }));

  // Test state interfaces
  tests.push({
    name: 'Web3State interface defined',
    passed: compiledCode.includes('interface Web3State'),
    error: !compiledCode.includes('interface Web3State') ? 'Web3State interface is missing' : undefined,
    executionTime: 1
  });

  // Test persistence methods
  tests.push({
    name: 'State persistence methods',
    passed: compiledCode.includes('async persist') && compiledCode.includes('async restore'),
    error: !compiledCode.includes('async persist') || !compiledCode.includes('async restore') ? 'State persistence methods are missing' : undefined,
    executionTime: 1
  });

  // Test time-travel debugging
  tests.push({
    name: 'Time-travel debugging support',
    passed: compiledCode.includes('undo') && compiledCode.includes('redo'),
    error: !compiledCode.includes('undo') || !compiledCode.includes('redo') ? 'Time-travel debugging methods are missing' : undefined,
    executionTime: 1
  });

  return tests;
}