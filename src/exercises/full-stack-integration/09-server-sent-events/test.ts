import { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: HealthMonitor class exists
  results.push({
    name: 'HealthMonitor Class Implementation',
    passed: compiledCode.includes('class HealthMonitor') && 
            compiledCode.includes('attachToHandler') && 
            compiledCode.includes('getConnectionStatus') &&
            compiledCode.includes('getMetrics'),
    message: compiledCode.includes('class HealthMonitor') ? 
      'HealthMonitor class properly defined with required methods' : 
      'HealthMonitor class is missing or incomplete. Should include attachToHandler, getConnectionStatus, and getMetrics methods'
  });

  // Test 2: EventStreamHandler class exists
  results.push({
    name: 'EventStreamHandler Class Implementation',
    passed: compiledCode.includes('class EventStreamHandler') && 
            compiledCode.includes('extends EventEmitter') &&
            compiledCode.includes('connect') && 
            compiledCode.includes('disconnect') &&
            compiledCode.includes('addFilter'),
    message: compiledCode.includes('class EventStreamHandler') ? 
      'EventStreamHandler class properly defined extending EventEmitter' : 
      'EventStreamHandler class is missing or incomplete. Should extend EventEmitter and include connect, disconnect, addFilter methods'
  });

  // Test 3: NotificationCenter class exists
  results.push({
    name: 'NotificationCenter Class Implementation',
    passed: compiledCode.includes('class NotificationCenter') &&
            compiledCode.includes('addNotification') &&
            compiledCode.includes('dismissNotification') &&
            compiledCode.includes('getNotifications'),
    message: compiledCode.includes('class NotificationCenter') ? 
      'NotificationCenter class properly defined with required methods' : 
      'NotificationCenter class is missing or incomplete. Should include addNotification, dismissNotification, and getNotifications methods'
  });

  // Test 4: SSEProvider component exists
  results.push({
    name: 'SSEProvider Component Implementation',
    passed: compiledCode.includes('SSEProvider') &&
            compiledCode.includes('SSEContext.Provider') &&
            compiledCode.includes('children'),
    message: compiledCode.includes('SSEProvider') ? 
      'SSEProvider component properly implemented' : 
      'SSEProvider component is missing or incomplete. Should be a React component using Context.Provider'
  });

  // Test 5: useServerSentEvents hook exists
  results.push({
    name: 'useServerSentEvents Hook Implementation',
    passed: compiledCode.includes('useServerSentEvents') &&
            compiledCode.includes('connectionState') &&
            compiledCode.includes('subscribe') &&
            compiledCode.includes('reconnect'),
    message: compiledCode.includes('useServerSentEvents') ? 
      'useServerSentEvents hook properly implemented' : 
      'useServerSentEvents hook is missing or incomplete. Should return connectionState, subscribe, and reconnect'
  });

  // Test 6: useNotifications hook exists
  results.push({
    name: 'useNotifications Hook Implementation',
    passed: compiledCode.includes('useNotifications') &&
            compiledCode.includes('notifications') &&
            compiledCode.includes('addNotification') &&
            compiledCode.includes('dismissNotification'),
    message: compiledCode.includes('useNotifications') ? 
      'useNotifications hook properly implemented' : 
      'useNotifications hook is missing or incomplete. Should return notifications, addNotification, dismissNotification'
  });

  // Test 7: NotificationItem component exists
  results.push({
    name: 'NotificationItem Component Implementation',
    passed: compiledCode.includes('NotificationItem') &&
            compiledCode.includes('notification') &&
            compiledCode.includes('onDismiss'),
    message: compiledCode.includes('NotificationItem') ? 
      'NotificationItem component properly implemented' : 
      'NotificationItem component is missing or incomplete. Should take notification and onDismiss props'
  });

  // Test 8: NotificationPanel component exists
  results.push({
    name: 'NotificationPanel Component Implementation',
    passed: compiledCode.includes('NotificationPanel') &&
            compiledCode.includes('React.FC'),
    message: compiledCode.includes('NotificationPanel') ? 
      'NotificationPanel component properly implemented' : 
      'NotificationPanel component is missing or incomplete. Should be a React.FC component'
  });

  // Test 9: EventSource integration
  results.push({
    name: 'EventSource Integration',
    passed: compiledCode.includes('EventSource') &&
            (compiledCode.includes('onopen') || compiledCode.includes('onmessage') || compiledCode.includes('onerror')),
    message: compiledCode.includes('EventSource') ? 
      'EventSource integration implemented' : 
      'EventSource integration missing. Should use EventSource API with event handlers'
  });

  // Test 10: Auto-reconnection logic
  results.push({
    name: 'Auto-reconnection Logic',
    passed: compiledCode.includes('autoReconnect') &&
            (compiledCode.includes('reconnectDelay') || compiledCode.includes('reconnectTimer')),
    message: compiledCode.includes('autoReconnect') ? 
      'Auto-reconnection logic implemented' : 
      'Auto-reconnection logic missing. Should include autoReconnect option and delay management'
  });

  // Test 11: Event filtering system
  results.push({
    name: 'Event Filtering System',
    passed: compiledCode.includes('addFilter') &&
            compiledCode.includes('removeFilter') &&
            (compiledCode.includes('filter') || compiledCode.includes('Filter')),
    message: compiledCode.includes('addFilter') ? 
      'Event filtering system implemented' : 
      'Event filtering system missing. Should include addFilter, removeFilter methods'
  });

  // Test 12: Fallback polling mechanism
  results.push({
    name: 'Fallback Polling Mechanism',
    passed: compiledCode.includes('fallbackToPolling') &&
            (compiledCode.includes('pollingInterval') || compiledCode.includes('polling')),
    message: compiledCode.includes('fallbackToPolling') ? 
      'Fallback polling mechanism implemented' : 
      'Fallback polling mechanism missing. Should include fallbackToPolling option and polling interval'
  });

  // Test 13: Notification persistence
  results.push({
    name: 'Notification Persistence',
    passed: compiledCode.includes('persistToStorage') &&
            (compiledCode.includes('localStorage') || compiledCode.includes('Storage')),
    message: compiledCode.includes('persistToStorage') ? 
      'Notification persistence implemented' : 
      'Notification persistence missing. Should include persistToStorage option and localStorage integration'
  });

  // Test 14: Health metrics tracking
  results.push({
    name: 'Health Metrics Tracking',
    passed: compiledCode.includes('HealthMetrics') &&
            compiledCode.includes('connectionStatus') &&
            compiledCode.includes('errorRate'),
    message: compiledCode.includes('HealthMetrics') ? 
      'Health metrics tracking implemented' : 
      'Health metrics tracking missing. Should include HealthMetrics interface with connectionStatus, errorRate'
  });

  // Test 15: Throttling mechanism
  results.push({
    name: 'Event Throttling Mechanism',
    passed: compiledCode.includes('throttle') &&
            (compiledCode.includes('shouldThrottleEvent') || compiledCode.includes('Throttle')),
    message: compiledCode.includes('throttle') ? 
      'Event throttling mechanism implemented' : 
      'Event throttling mechanism missing. Should include throttle configuration and throttling logic'
  });

  return results;
}