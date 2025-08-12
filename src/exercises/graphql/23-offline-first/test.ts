// Test file for Offline-First GraphQL Applications exercise
// Tests implementation of resilient offline-first applications

import type { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test 1: Offline data persistence implementation
  tests.push({
    name: 'Offline data persistence implementation',
    passed: compiledCode.includes('function setupOfflinePersistence') &&
            compiledCode.includes('localStorage') &&
            compiledCode.includes('IndexedDB') &&
            compiledCode.includes('cache') &&
            compiledCode.includes('persist') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'setupOfflinePersistence needs implementation - replace placeholder with offline persistence setup' :
      (compiledCode.includes('function setupOfflinePersistence') ? undefined : 'setupOfflinePersistence function not found'),
    executionTime: 1,
  });

  // Test 2: Online/offline transition sync strategies
  tests.push({
    name: 'Online/offline transition sync strategies',
    passed: compiledCode.includes('function handleOnlineOfflineTransition') &&
            compiledCode.includes('navigator.onLine') &&
            compiledCode.includes('sync') &&
            compiledCode.includes('queue') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'handleOnlineOfflineTransition needs implementation - replace placeholder with transition handling' :
      (compiledCode.includes('function handleOnlineOfflineTransition') ? undefined : 'handleOnlineOfflineTransition function not found'),
    executionTime: 1,
  });

  // Test 3: Conflict resolution for offline edits
  tests.push({
    name: 'Conflict resolution for offline edits',
    passed: compiledCode.includes('function resolveOfflineConflicts') &&
            compiledCode.includes('conflict') &&
            compiledCode.includes('resolution') &&
            compiledCode.includes('merge') &&
            compiledCode.includes('version') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'resolveOfflineConflicts needs implementation - replace placeholder with conflict resolution logic' :
      (compiledCode.includes('function resolveOfflineConflicts') ? undefined : 'resolveOfflineConflicts function not found'),
    executionTime: 1,
  });

  // Test 4: Offline queue management
  tests.push({
    name: 'Offline queue management',
    passed: compiledCode.includes('function manageOfflineQueue') &&
            compiledCode.includes('queue') &&
            compiledCode.includes('enqueue') &&
            compiledCode.includes('dequeue') &&
            compiledCode.includes('process') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'manageOfflineQueue needs implementation - replace placeholder with queue management' :
      (compiledCode.includes('function manageOfflineQueue') ? undefined : 'manageOfflineQueue function not found'),
    executionTime: 1,
  });

  // Test 5: Background sync implementation
  tests.push({
    name: 'Background sync implementation',
    passed: compiledCode.includes('function setupBackgroundSync') &&
            compiledCode.includes('serviceWorker') &&
            compiledCode.includes('background') &&
            compiledCode.includes('sync') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'setupBackgroundSync needs implementation - replace placeholder with background sync setup' :
      (compiledCode.includes('function setupBackgroundSync') ? undefined : 'setupBackgroundSync function not found'),
    executionTime: 1,
  });

  // Test 6: Offline-first UI patterns
  tests.push({
    name: 'Offline-first UI patterns',
    passed: compiledCode.includes('function implementOfflineUI') &&
            compiledCode.includes('offline') &&
            compiledCode.includes('indicator') &&
            compiledCode.includes('fallback') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'implementOfflineUI needs implementation - replace placeholder with offline UI patterns' :
      (compiledCode.includes('function implementOfflineUI') ? undefined : 'implementOfflineUI function not found'),
    executionTime: 1,
  });

  // Test 7: Data freshness and staleness management
  tests.push({
    name: 'Data freshness and staleness management',
    passed: compiledCode.includes('function manageFreshness') &&
            compiledCode.includes('freshness') &&
            compiledCode.includes('stale') &&
            compiledCode.includes('timestamp') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'manageFreshness needs implementation - replace placeholder with freshness management' :
      (compiledCode.includes('function manageFreshness') ? undefined : 'manageFreshness function not found'),
    executionTime: 1,
  });

  // Test 8: Progressive sync strategies
  tests.push({
    name: 'Progressive sync strategies',
    passed: compiledCode.includes('function progressiveSync') &&
            compiledCode.includes('progressive') &&
            compiledCode.includes('priority') &&
            compiledCode.includes('batch') &&
            !compiledCode.includes('Your code here'),
    error: compiledCode.includes('Your code here') ?
      'progressiveSync needs implementation - replace placeholder with progressive sync logic' :
      (compiledCode.includes('function progressiveSync') ? undefined : 'progressiveSync function not found'),
    executionTime: 1,
  });

  // Test 9: OfflineTaskManager component implementation
  tests.push(createComponentTest('OfflineTaskManager', compiledCode, {
    requiredElements: ['div', 'ul', 'li', 'button'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('offline') && code.includes('task'),
    errorMessage: 'OfflineTaskManager component needs implementation to manage offline tasks',
  }));

  // Test 10: SyncStatus component implementation
  tests.push(createComponentTest('SyncStatus', compiledCode, {
    requiredElements: ['div', 'span'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('sync') && code.includes('status'),
    errorMessage: 'SyncStatus component needs implementation to display synchronization status',
  }));

  // Test 11: ConflictResolver component implementation
  tests.push(createComponentTest('ConflictResolver', compiledCode, {
    requiredElements: ['div', 'button', 'ul'],
    customValidation: (code) => !code.includes('Your code here') && code.includes('conflict') && code.includes('resolve'),
    errorMessage: 'ConflictResolver component needs implementation to handle offline edit conflicts',
  }));

  return tests;
}