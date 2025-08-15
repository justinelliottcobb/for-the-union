import { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: ReconnectLogic class implementation
  results.push({
    name: 'ReconnectLogic Class Implementation',
    passed: compiledCode.includes('class ReconnectLogic') && 
            !compiledCode.includes('// TODO: Implement exponential backoff calculation') &&
            !compiledCode.includes('return 1000; // Placeholder') &&
            (compiledCode.includes('Math.pow') || compiledCode.includes('**')) &&
            compiledCode.includes('backoffMultiplier'),
    error: (!compiledCode.includes('class ReconnectLogic')) ? 
      'ReconnectLogic class is missing' :
      (compiledCode.includes('// TODO: Implement exponential backoff calculation') || compiledCode.includes('return 1000; // Placeholder')) ?
      'ReconnectLogic getNextDelay method needs actual exponential backoff implementation' :
      'ReconnectLogic missing exponential backoff logic with backoffMultiplier',
    executionTime: 1
  });

  // Test 2: MessageHandler class implementation  
  results.push({
    name: 'MessageHandler Class Implementation',
    passed: compiledCode.includes('class MessageHandler') && 
            !compiledCode.includes('// TODO: Implement message queuing logic') &&
            !compiledCode.includes('// TODO: Send queued messages when connection is available') &&
            compiledCode.includes('messageQueue') &&
            compiledCode.includes('push') &&
            compiledCode.includes('splice'),
    error: (!compiledCode.includes('class MessageHandler')) ? 
      'MessageHandler class is missing' :
      (compiledCode.includes('// TODO: Implement message queuing logic') || compiledCode.includes('// TODO: Send queued messages when connection is available')) ?
      'MessageHandler needs actual message queuing implementation' :
      'MessageHandler missing queue management with push/splice operations',
    executionTime: 1
  });

  // Test 3: ConnectionManager class implementation
  results.push({
    name: 'ConnectionManager Class Implementation', 
    passed: compiledCode.includes('class ConnectionManager') &&
            compiledCode.includes('extends EventEmitter') &&
            !compiledCode.includes('// TODO: Create WebSocket connection') &&
            !compiledCode.includes('// TODO: Implement connection logic') &&
            compiledCode.includes('new WebSocket') &&
            compiledCode.includes('WebSocket.OPEN'),
    error: (!compiledCode.includes('class ConnectionManager')) ? 
      'ConnectionManager class is missing' :
      (!compiledCode.includes('extends EventEmitter')) ?
      'ConnectionManager should extend EventEmitter' :
      (compiledCode.includes('// TODO: Create WebSocket connection') || compiledCode.includes('// TODO: Implement connection logic')) ?
      'ConnectionManager needs actual WebSocket connection implementation' :
      'ConnectionManager missing WebSocket instantiation and state checking',
    executionTime: 1
  });

  // Test 4: WebSocketProvider component implementation
  results.push({
    name: 'WebSocketProvider Component Implementation',
    passed: compiledCode.includes('WebSocketProvider') &&
            compiledCode.includes('WebSocketContext.Provider') &&
            !compiledCode.includes('// TODO: Implement WebSocketProvider') &&
            !compiledCode.includes('// TODO: Initialize context state') &&
            compiledCode.includes('useState') &&
            compiledCode.includes('new Map'),
    error: (!compiledCode.includes('WebSocketProvider')) ? 
      'WebSocketProvider component is missing' :
      (compiledCode.includes('// TODO: Implement WebSocketProvider') || compiledCode.includes('// TODO: Initialize context state')) ?
      'WebSocketProvider needs actual state management implementation' :
      'WebSocketProvider missing state initialization with useState and Map',
    executionTime: 1
  });

  // Test 5: useWebSocket hook implementation
  results.push({
    name: 'useWebSocket Hook Implementation',
    passed: compiledCode.includes('useWebSocket') &&
            !compiledCode.includes('// TODO: Implement useWebSocket hook') &&
            !compiledCode.includes('// TODO: Get context and connection manager') &&
            compiledCode.includes('useContext') &&
            compiledCode.includes('WebSocketContext') &&
            compiledCode.includes('useEffect'),
    error: (!compiledCode.includes('useWebSocket')) ? 
      'useWebSocket hook is missing' :
      (compiledCode.includes('// TODO: Implement useWebSocket hook') || compiledCode.includes('// TODO: Get context and connection manager')) ?
      'useWebSocket hook needs actual implementation with context and effects' :
      'useWebSocket hook missing useContext and useEffect implementation',
    executionTime: 1
  });

  // Test 6: ConnectionStatus component exists
  results.push({
    name: 'ConnectionStatus Component Implementation',
    passed: compiledCode.includes('ConnectionStatus') &&
            compiledCode.includes('React.FC') &&
            compiledCode.includes('url'),
    error: compiledCode.includes('ConnectionStatus') ? 
      undefined : 
      'ConnectionStatus component is missing or incomplete. Should be a React.FC that takes url prop',
    executionTime: 1
  });

  // Test 7: ChatComponent exists
  results.push({
    name: 'ChatComponent Implementation',
    passed: compiledCode.includes('ChatComponent') &&
            compiledCode.includes('userId') &&
            compiledCode.includes('url'),
    error: compiledCode.includes('ChatComponent') ? 
      undefined : 
      'ChatComponent is missing or incomplete. Should take userId and url props',
    executionTime: 1
  });

  // Test 8: Exponential backoff implementation
  results.push({
    name: 'Exponential Backoff Logic',
    passed: compiledCode.includes('backoffMultiplier') &&
            compiledCode.includes('Math.pow') ||
            compiledCode.includes('**') || 
            compiledCode.includes('exponential'),
    error: compiledCode.includes('backoffMultiplier') ? 
      undefined : 
      'Exponential backoff logic missing. Should use backoffMultiplier and exponential calculation',
    executionTime: 1
  });

  // Test 9: Message queuing implementation
  results.push({
    name: 'Message Queuing System',
    passed: compiledCode.includes('messageQueue') ||
            compiledCode.includes('queue') &&
            compiledCode.includes('replay'),
    error: compiledCode.includes('messageQueue') || compiledCode.includes('queue') ? 
      undefined : 
      'Message queuing system missing. Should queue messages when disconnected and replay on reconnection',
    executionTime: 1
  });

  // Test 10: Auto-reconnection logic
  results.push({
    name: 'Auto-reconnection Implementation',
    passed: compiledCode.includes('autoReconnect') &&
            (compiledCode.includes('setTimeout') || compiledCode.includes('reconnectTimer')),
    error: compiledCode.includes('autoReconnect') ? 
      undefined : 
      'Auto-reconnection logic missing. Should include autoReconnect option and timer-based reconnection',
    executionTime: 1
  });

  return results;
}