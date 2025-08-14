# Server-Sent Events

## Overview

Implement a comprehensive Server-Sent Events (SSE) system for real-time notifications, system monitoring, and live updates. This exercise focuses on building production-ready SSE integration with graceful degradation, event filtering, and robust error handling patterns used in monitoring dashboards and notification systems.

## Learning Objectives

By completing this exercise, you will:

- Implement EventSource API for server-sent events
- Build notification systems with real-time updates
- Create automatic reconnection and error handling
- Design event filtering and subscription management
- Handle system monitoring and health checks
- Implement graceful degradation for unsupported browsers

## Background

Server-Sent Events provide a simple way to receive real-time updates from a server over HTTP. Unlike WebSockets, SSE is unidirectional (server-to-client) and automatically handles reconnection, making it ideal for notifications, live data feeds, and monitoring systems.

Key concepts to master:

### EventSource API
- Browser-native SSE implementation
- Automatic reconnection handling
- Event-driven architecture
- Built-in error handling

### Event Filtering and Routing
- Event type-based filtering
- Client-side event routing
- Subscription management
- Performance optimization

### Error Handling and Resilience
- Connection error recovery
- Malformed data handling
- Network interruption management
- Graceful degradation strategies

### Notification Systems
- Real-time notification delivery
- Notification persistence and state
- User interaction handling
- Categorization and filtering

## Requirements

### Core Features

1. **EventStreamHandler**
   - EventSource API wrapper with enhanced features
   - Automatic reconnection with exponential backoff
   - Event type filtering and routing
   - Connection health monitoring

2. **NotificationCenter**
   - Centralized notification management
   - Persistent notification storage
   - Categorization and filtering
   - Auto-dismissal and user actions

3. **HealthMonitor**
   - Connection health tracking
   - Latency monitoring
   - Error rate calculation
   - Performance metrics collection

4. **SSEProvider**
   - React Context for SSE management
   - Multiple stream subscription
   - Event broadcasting to components
   - Resource cleanup

### React Integration

1. **useServerSentEvents Hook**
   - Connection state management
   - Event subscription handling
   - Automatic cleanup
   - Error state management

2. **useNotifications Hook**
   - Notification state management
   - Filter and search capabilities
   - User actions (dismiss, mark read)
   - Persistence handling

### Advanced Features

1. **Event Filtering System**
   - Client-side event filtering
   - Dynamic filter management
   - Performance optimization
   - Custom filter functions

2. **Graceful Degradation**
   - Fallback to polling when SSE unavailable
   - Browser compatibility detection
   - Feature detection and progressive enhancement
   - Alternative delivery mechanisms

## Implementation Guide

### 1. EventStreamHandler Class

Create the core SSE handler:

```typescript
interface EventStreamOptions {
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  throttle?: Record<string, number>;
  fallbackToPolling?: boolean;
  pollingInterval?: number;
}

class EventStreamHandler extends EventEmitter {
  constructor(url: string, options?: EventStreamOptions);
  
  connect(): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
  addFilter(eventType: string, filter: (data: any) => boolean): void;
  removeFilter(eventType: string): void;
  getReconnectAttempts(): number;
  isFallbackMode(): boolean;
}
```

### 2. NotificationCenter Class

Implement notification management:

```typescript
interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read?: boolean;
  autoDismiss?: boolean;
  actions?: NotificationAction[];
}

interface NotificationOptions {
  autoDissmissTimeout?: number;
  maxNotifications?: number;
  persistToStorage?: boolean;
}

class NotificationCenter {
  constructor(options?: NotificationOptions);
  
  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void;
  dismissNotification(id: string): void;
  markAsRead(id: string): void;
  getNotifications(): Notification[];
  getNotificationsByType(type: string): Notification[];
  clearAll(): void;
}
```

### 3. HealthMonitor Class

Create connection monitoring:

```typescript
interface HealthMetrics {
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'unhealthy';
  latency?: number;
  errorRate: number;
  uptime: number;
  lastHeartbeat?: Date;
}

class HealthMonitor {
  constructor(options?: { heartbeatInterval?: number });
  
  attachToHandler(handler: EventStreamHandler): void;
  getConnectionStatus(): string;
  getLastHeartbeat(): Date | undefined;
  getMetrics(): HealthMetrics;
  getHealthRecommendations(): string[];
  recordEvent(event: string): void;
}
```

### 4. useServerSentEvents Hook

Implement the React hook:

```typescript
interface ServerSentEventsState {
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastEvent: any;
  eventHistory: any[];
  subscribe: (eventType: string, handler: (data: any) => void) => () => void;
  unsubscribe: (eventType: string) => void;
  reconnect: () => void;
}

function useServerSentEvents(url: string, options?: EventStreamOptions): ServerSentEventsState;
```

### 5. useNotifications Hook

Create notification management hook:

```typescript
interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  getNotificationsByType: (type: string) => Notification[];
}

function useNotifications(): NotificationsState;
```

### 6. SSEProvider Component

Implement the context provider:

```typescript
interface SSEContextValue {
  handlers: Map<string, EventStreamHandler>;
  subscribe: (url: string, eventType: string, callback: (data: any) => void) => () => void;
  getConnectionState: (url: string) => string;
  getHealthMetrics: (url: string) => HealthMetrics | null;
}

function SSEProvider({ children }: { children: React.ReactNode }): JSX.Element;
```

## Testing Requirements

Your implementation should pass these test scenarios:

1. **EventSource Integration**
   - ✅ Establish SSE connection successfully
   - ✅ Handle different event types correctly
   - ✅ Implement automatic reconnection
   - ✅ Apply event filtering accurately

2. **Notification Management**
   - ✅ Store and retrieve notifications
   - ✅ Filter notifications by type
   - ✅ Handle notification dismissal
   - ✅ Auto-dismiss with timeout
   - ✅ Persist to local storage

3. **Health Monitoring**
   - ✅ Track connection health
   - ✅ Detect connection issues
   - ✅ Calculate latency metrics
   - ✅ Provide health recommendations

4. **React Integration**
   - ✅ Provide SSE connection state
   - ✅ Handle event subscriptions
   - ✅ Cleanup subscriptions on unmount
   - ✅ Manage notification state

5. **Error Handling**
   - ✅ Handle EventSource not supported
   - ✅ Provide graceful degradation
   - ✅ Handle malformed event data
   - ✅ Recover from connection errors

6. **Performance**
   - ✅ Handle high-frequency events
   - ✅ Implement event throttling
   - ✅ Optimize memory usage
   - ✅ Prevent memory leaks

## Expected Behavior

### Connection Flow
1. Component establishes SSE connection
2. Events are received and filtered
3. Notifications are created and displayed
4. Connection health is monitored
5. Automatic reconnection on failures

### Event Processing
- Events are filtered based on type
- Malformed events are handled gracefully
- High-frequency events can be throttled
- Event history is maintained efficiently

### Notification System
- Real-time notifications appear immediately
- Notifications can be dismissed or auto-expire
- Persistent storage maintains state across sessions
- Categories and filters help organize notifications

### Error Scenarios
- Connection failures trigger reconnection
- Unsupported browsers fall back gracefully
- Malformed data doesn't break the system
- Network issues are handled transparently

## Success Criteria

- ✅ All tests pass with comprehensive coverage
- ✅ SSE connections are established reliably
- ✅ Event filtering works correctly
- ✅ Notifications are managed effectively
- ✅ Health monitoring provides useful insights
- ✅ Error handling is robust and graceful
- ✅ Performance handles realistic loads
- ✅ UI provides clear status feedback

## Extensions

Once you've completed the basic requirements, consider these extensions:

1. **Advanced Features**
   - Event replay on reconnection
   - Multi-stream aggregation
   - Custom event parsers
   - Bandwidth monitoring

2. **Enterprise Integration**
   - Authentication with SSE
   - Rate limiting handling
   - Load balancer compatibility
   - Monitoring dashboards

3. **Performance Optimization**
   - Event batching
   - Compression support
   - Memory pool management
   - Background processing

4. **User Experience**
   - Notification templates
   - Sound and visual alerts
   - Keyboard shortcuts
   - Accessibility features

## Resources

- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [EventSource MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [SSE vs WebSocket Comparison](https://www.ably.com/blog/websockets-vs-sse)
- [EventSource Polyfills](https://github.com/Yaffle/EventSource)
- [Real-time Web Technologies](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Server-sent_events)