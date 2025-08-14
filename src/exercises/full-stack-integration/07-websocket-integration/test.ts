import { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: ReconnectLogic class exists
  results.push({
    name: 'ReconnectLogic Class Implementation',
    passed: compiledCode.includes('class ReconnectLogic') && 
            compiledCode.includes('getNextDelay') && 
            compiledCode.includes('shouldRetry'),
    message: compiledCode.includes('class ReconnectLogic') ? 
      'ReconnectLogic class properly defined with required methods' : 
      'ReconnectLogic class is missing or incomplete. Should include getNextDelay and shouldRetry methods'
  });

  // Test 2: MessageHandler class exists  
  results.push({
    name: 'MessageHandler Class Implementation',
    passed: compiledCode.includes('class MessageHandler') && 
            compiledCode.includes('send') && 
            compiledCode.includes('getQueuedMessages') &&
            compiledCode.includes('setConnection'),
    message: compiledCode.includes('class MessageHandler') ? 
      'MessageHandler class properly defined with required methods' : 
      'MessageHandler class is missing or incomplete. Should include send, getQueuedMessages, and setConnection methods'
  });

  // Test 3: ConnectionManager class exists
  results.push({
    name: 'ConnectionManager Class Implementation', 
    passed: compiledCode.includes('class ConnectionManager') &&
            compiledCode.includes('extends EventEmitter') &&
            compiledCode.includes('connect') &&
            compiledCode.includes('disconnect') &&
            compiledCode.includes('isConnected'),
    message: compiledCode.includes('class ConnectionManager') ? 
      'ConnectionManager class properly defined extending EventEmitter' : 
      'ConnectionManager class is missing or incomplete. Should extend EventEmitter and include connect, disconnect, isConnected methods'
  });

  // Test 4: WebSocketProvider component exists
  results.push({
    name: 'WebSocketProvider Component Implementation',
    passed: compiledCode.includes('WebSocketProvider') &&
            compiledCode.includes('WebSocketContext.Provider') &&
            compiledCode.includes('children'),
    message: compiledCode.includes('WebSocketProvider') ? 
      'WebSocketProvider component properly implemented' : 
      'WebSocketProvider component is missing or incomplete. Should be a React component using Context.Provider'
  });

  // Test 5: useWebSocket hook exists
  results.push({
    name: 'useWebSocket Hook Implementation',
    passed: compiledCode.includes('useWebSocket') &&
            compiledCode.includes('connectionState') &&
            compiledCode.includes('sendMessage'),
    message: compiledCode.includes('useWebSocket') ? 
      'useWebSocket hook properly implemented' : 
      'useWebSocket hook is missing or incomplete. Should return connectionState and sendMessage'
  });

  // Test 6: ConnectionStatus component exists
  results.push({
    name: 'ConnectionStatus Component Implementation',
    passed: compiledCode.includes('ConnectionStatus') &&
            compiledCode.includes('React.FC') &&
            compiledCode.includes('url'),
    message: compiledCode.includes('ConnectionStatus') ? 
      'ConnectionStatus component properly implemented' : 
      'ConnectionStatus component is missing or incomplete. Should be a React.FC that takes url prop'
  });

  // Test 7: ChatComponent exists
  results.push({
    name: 'ChatComponent Implementation',
    passed: compiledCode.includes('ChatComponent') &&
            compiledCode.includes('userId') &&
            compiledCode.includes('url'),
    message: compiledCode.includes('ChatComponent') ? 
      'ChatComponent properly implemented' : 
      'ChatComponent is missing or incomplete. Should take userId and url props'
  });

  // Test 8: Exponential backoff implementation
  results.push({
    name: 'Exponential Backoff Logic',
    passed: compiledCode.includes('backoffMultiplier') &&
            compiledCode.includes('Math.pow') ||
            compiledCode.includes('**') || 
            compiledCode.includes('exponential'),
    message: compiledCode.includes('backoffMultiplier') ? 
      'Exponential backoff logic implemented' : 
      'Exponential backoff logic missing. Should use backoffMultiplier and exponential calculation'
  });

  // Test 9: Message queuing implementation
  results.push({
    name: 'Message Queuing System',
    passed: compiledCode.includes('messageQueue') ||
            compiledCode.includes('queue') &&
            compiledCode.includes('replay'),
    message: compiledCode.includes('messageQueue') || compiledCode.includes('queue') ? 
      'Message queuing system implemented' : 
      'Message queuing system missing. Should queue messages when disconnected and replay on reconnection'
  });

  // Test 10: Auto-reconnection logic
  results.push({
    name: 'Auto-reconnection Implementation',
    passed: compiledCode.includes('autoReconnect') &&
            (compiledCode.includes('setTimeout') || compiledCode.includes('reconnectTimer')),
    message: compiledCode.includes('autoReconnect') ? 
      'Auto-reconnection logic implemented' : 
      'Auto-reconnection logic missing. Should include autoReconnect option and timer-based reconnection'
  });

  return results;
}