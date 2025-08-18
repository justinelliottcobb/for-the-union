# WebSocket Integration

## Overview

Build a robust WebSocket communication system with React integration, connection management, and message handling patterns. This exercise focuses on implementing production-ready real-time communication features commonly used in collaborative applications and live dashboards.

## Learning Objectives

By completing this exercise, you will:

- Implement WebSocket lifecycle management with React
- Build connection management with auto-reconnection logic
- Create message queuing and buffering systems
- Design real-time UI patterns with connection status
- Handle WebSocket errors and connection recovery
- Integrate Socket.IO patterns with native WebSocket API

## Background

WebSocket communication is essential for modern real-time applications. However, implementing robust WebSocket integration requires careful consideration of connection lifecycle, error handling, message queuing, and user experience patterns.

Key concepts to master:

### WebSocket Lifecycle Management
- Connection establishment and teardown
- React component integration with useEffect
- Cleanup and resource management
- Connection state tracking

### Connection Recovery
- Automatic reconnection with exponential backoff
- Connection health monitoring
- Graceful degradation strategies
- User feedback during connection issues

### Message Handling
- Message queuing during disconnection
- Message buffering and replay
- Type-safe message handling
- Performance optimization for high-frequency messages

## Requirements

### Core Features

1. **WebSocketProvider**
   - React Context provider for WebSocket connections
   - Connection state management
   - Global message broadcasting
   - Multiple component subscription support

2. **ConnectionManager**
   - WebSocket connection lifecycle management
   - Auto-reconnection with exponential backoff
   - Connection health monitoring
   - Error handling and recovery

3. **MessageHandler**
   - Type-safe message sending and receiving
   - Message queuing when disconnected
   - Message buffering with size limits
   - Message replay on reconnection

4. **ReconnectLogic**
   - Exponential backoff algorithm
   - Maximum retry attempts
   - Connection timeout handling
   - Backoff jitter for avoiding thundering herd

### React Integration

1. **useWebSocket Hook**
   - Connection state management
   - Message sending and receiving
   - Message history tracking
   - Component cleanup on unmount

2. **Connection Status UI**
   - Visual connection state indicators
   - Reconnection progress feedback
   - Error message display
   - Queue status information

### Advanced Features

1. **Message Queuing**
   - Queue messages when disconnected
   - Replay queued messages on reconnection
   - Queue size management and overflow handling
   - Message prioritization

2. **Performance Optimization**
   - Message batching for high frequency updates
   - Connection pooling for multiple endpoints
   - Memory leak prevention
   - Efficient message serialization

## Implementation Guide

### 1. ConnectionManager Class

Create a connection manager that handles the WebSocket lifecycle:

```typescript
interface ConnectionOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  connectionTimeout?: number;
}

class ConnectionManager extends EventEmitter {
  constructor(url: string, options?: ConnectionOptions);
  
  connect(): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
  getReconnectAttempts(): number;
  send(message: any): void;
}
```

### 2. MessageHandler Class

Implement message queuing and handling:

```typescript
interface MessageOptions {
  bufferSize?: number;
  enableQueue?: boolean;
  replayOnConnect?: boolean;
}

class MessageHandler {
  constructor(options?: MessageOptions);
  
  setConnection(connection: ConnectionManager): void;
  send(message: any): void;
  getQueuedMessages(): any[];
  clearQueue(): void;
}
```

### 3. ReconnectLogic Class

Create exponential backoff logic:

```typescript
interface ReconnectOptions {
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
}

class ReconnectLogic {
  constructor(options?: ReconnectOptions);
  
  getNextDelay(attemptCount: number): number;
  shouldRetry(attemptCount: number, maxAttempts: number): boolean;
  reset(): void;
}
```

### 4. useWebSocket Hook

Implement the React hook:

```typescript
interface UseWebSocketOptions {
  keepHistory?: boolean;
  maxHistorySize?: number;
  autoConnect?: boolean;
}

interface WebSocketState {
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: any;
  messageHistory: any[];
  sendMessage: (message: any) => void;
  connect: () => void;
  disconnect: () => void;
}

function useWebSocket(url: string, options?: UseWebSocketOptions): WebSocketState;
```

### 5. WebSocketProvider Component

Create the React context provider:

```typescript
interface WebSocketContextValue {
  connections: Map<string, ConnectionManager>;
  subscribe: (url: string, callback: (message: any) => void) => () => void;
  send: (url: string, message: any) => void;
  getConnectionState: (url: string) => string;
}

function WebSocketProvider({ children }: { children: React.ReactNode });
```

## Testing Requirements

Your implementation should pass these test scenarios:

1. **Connection Management**
   - ✅ Establish WebSocket connection
   - ✅ Handle connection errors gracefully
   - ✅ Implement auto-reconnection with backoff
   - ✅ Cleanup resources on disconnect

2. **Message Handling**
   - ✅ Send and receive messages
   - ✅ Queue messages when disconnected
   - ✅ Replay queued messages on reconnection
   - ✅ Handle message buffer overflow

3. **React Integration**
   - ✅ Provide connection state in hook
   - ✅ Track message history
   - ✅ Cleanup subscriptions on unmount
   - ✅ Multiple component support

4. **Error Handling**
   - ✅ Handle network errors
   - ✅ Handle connection timeouts
   - ✅ Graceful degradation
   - ✅ User-friendly error messages

5. **Performance**
   - ✅ Handle high message throughput
   - ✅ Efficient memory usage
   - ✅ Prevent memory leaks
   - ✅ Optimize reconnection attempts

## Expected Behavior

### Connection Flow
1. Component mounts and initiates WebSocket connection
2. Connection state updates are reflected in UI
3. Messages can be sent and received once connected
4. Connection lost scenarios trigger auto-reconnection
5. Queued messages are replayed when connection restored

### Error Scenarios
- Network failures trigger reconnection attempts
- Invalid URLs show appropriate error messages
- Connection timeouts are handled gracefully
- Maximum retry attempts prevent infinite loops

### Performance Considerations
- Large message volumes don't block UI
- Memory usage remains bounded
- Connection resources are properly cleaned up
- Multiple components can share connections efficiently

## Success Criteria

- ✅ All tests pass
- ✅ Connection state is properly managed
- ✅ Messages are queued and replayed correctly
- ✅ Reconnection works with exponential backoff
- ✅ UI provides clear connection status feedback
- ✅ Performance handles high message volumes
- ✅ Memory leaks are prevented
- ✅ Error handling is robust and user-friendly

## Extensions

Once you've completed the basic requirements, consider these extensions:

1. **Protocol Support**
   - Socket.IO client integration
   - Custom protocol handling
   - Binary message support

2. **Advanced Features**
   - Message compression
   - Connection pooling
   - Load balancing across endpoints

3. **Monitoring**
   - Connection metrics
   - Message statistics
   - Performance monitoring

4. **Security**
   - Authentication integration
   - Message encryption
   - Rate limiting

## Resources

- [WebSocket API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [React WebSocket Best Practices](https://react.dev/learn/lifecycle-of-reactive-effects#effects-with-cleanup)
- [Exponential Backoff Algorithm](https://en.wikipedia.org/wiki/Exponential_backoff)