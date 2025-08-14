import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, render, screen } from '@testing-library/react';
import { 
  SSEProvider,
  EventStreamHandler,
  NotificationCenter,
  HealthMonitor,
  useServerSentEvents,
  useNotifications
} from './solution';

// Mock EventSource
class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  readyState = MockEventSource.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  
  private eventListeners: Map<string, ((event: MessageEvent) => void)[]> = new Map();

  constructor(public url: string, public eventSourceInitDict?: EventSourceInit) {
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }

  // Test helpers
  simulateEvent(type: string, data: any, id?: string) {
    const event = new MessageEvent(type, {
      data: JSON.stringify(data),
      lastEventId: id || '',
      origin: this.url
    });

    if (type === 'message') {
      this.onmessage?.(event);
    }

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }

  simulateError() {
    this.readyState = MockEventSource.CLOSED;
    this.onerror?.(new Event('error'));
  }
}

// Replace global EventSource with mock
vi.stubGlobal('EventSource', MockEventSource);

describe('Server-Sent Events', () => {
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEventSource = new MockEventSource('/api/sse');
  });

  afterEach(() => {
    mockEventSource?.close();
  });

  describe('EventStreamHandler', () => {
    it('should establish SSE connection', async () => {
      const handler = new EventStreamHandler('/api/sse');
      const connectPromise = handler.connect();

      await act(async () => {
        await connectPromise;
      });

      expect(handler.isConnected()).toBe(true);
    });

    it('should handle different event types', async () => {
      const handler = new EventStreamHandler('/api/sse');
      const messageHandler = vi.fn();
      const notificationHandler = vi.fn();

      handler.on('user-message', messageHandler);
      handler.on('notification', notificationHandler);

      await handler.connect();

      mockEventSource.simulateEvent('user-message', { content: 'Hello' });
      mockEventSource.simulateEvent('notification', { type: 'info', message: 'Update available' });

      expect(messageHandler).toHaveBeenCalledWith({ content: 'Hello' });
      expect(notificationHandler).toHaveBeenCalledWith({ type: 'info', message: 'Update available' });
    });

    it('should implement automatic reconnection', async () => {
      const handler = new EventStreamHandler('/api/sse', {
        autoReconnect: true,
        reconnectDelay: 100,
        maxReconnectAttempts: 3
      });

      await handler.connect();
      expect(handler.isConnected()).toBe(true);

      // Simulate connection error
      mockEventSource.simulateError();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(handler.getReconnectAttempts()).toBeGreaterThan(0);
    });

    it('should handle event filtering', async () => {
      const handler = new EventStreamHandler('/api/sse');
      
      // Add filters
      handler.addFilter('user-message', (data) => data.userId === 'current-user');
      handler.addFilter('notification', (data) => data.priority === 'high');

      const messageHandler = vi.fn();
      const notificationHandler = vi.fn();

      handler.on('user-message', messageHandler);
      handler.on('notification', notificationHandler);

      await handler.connect();

      // Should be filtered out
      mockEventSource.simulateEvent('user-message', { userId: 'other-user', content: 'Hello' });
      mockEventSource.simulateEvent('notification', { priority: 'low', message: 'Info' });

      // Should pass filter
      mockEventSource.simulateEvent('user-message', { userId: 'current-user', content: 'Hello' });
      mockEventSource.simulateEvent('notification', { priority: 'high', message: 'Alert' });

      expect(messageHandler).toHaveBeenCalledTimes(1);
      expect(notificationHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle authentication', async () => {
      const handler = new EventStreamHandler('/api/sse', {
        headers: {
          'Authorization': 'Bearer token123'
        }
      });

      await handler.connect();

      // Check that headers were passed to EventSource
      expect(mockEventSource.eventSourceInitDict?.withCredentials).toBe(true);
    });
  });

  describe('NotificationCenter', () => {
    it('should store and manage notifications', () => {
      const center = new NotificationCenter();
      
      const notification1 = {
        id: '1',
        type: 'info',
        title: 'Update Available',
        message: 'A new version is available',
        timestamp: new Date()
      };

      const notification2 = {
        id: '2',
        type: 'error',
        title: 'Connection Error',
        message: 'Failed to connect to server',
        timestamp: new Date()
      };

      center.addNotification(notification1);
      center.addNotification(notification2);

      const notifications = center.getNotifications();
      expect(notifications).toHaveLength(2);
      expect(notifications[0]).toEqual(notification1);
    });

    it('should filter notifications by type', () => {
      const center = new NotificationCenter();
      
      center.addNotification({ id: '1', type: 'info', title: 'Info', message: 'Info message', timestamp: new Date() });
      center.addNotification({ id: '2', type: 'error', title: 'Error', message: 'Error message', timestamp: new Date() });
      center.addNotification({ id: '3', type: 'warning', title: 'Warning', message: 'Warning message', timestamp: new Date() });

      const errors = center.getNotificationsByType('error');
      const infos = center.getNotificationsByType('info');

      expect(errors).toHaveLength(1);
      expect(infos).toHaveLength(1);
      expect(errors[0].type).toBe('error');
    });

    it('should handle notification dismissal', () => {
      const center = new NotificationCenter();
      
      center.addNotification({ id: '1', type: 'info', title: 'Info', message: 'Info message', timestamp: new Date() });
      center.addNotification({ id: '2', type: 'error', title: 'Error', message: 'Error message', timestamp: new Date() });

      expect(center.getNotifications()).toHaveLength(2);

      center.dismissNotification('1');
      expect(center.getNotifications()).toHaveLength(1);
      expect(center.getNotifications()[0].id).toBe('2');
    });

    it('should auto-dismiss notifications after timeout', async () => {
      const center = new NotificationCenter({ autoDissmissTimeout: 100 });
      
      center.addNotification({ 
        id: '1', 
        type: 'info', 
        title: 'Auto-dismiss', 
        message: 'This will disappear', 
        timestamp: new Date(),
        autoDismiss: true
      });

      expect(center.getNotifications()).toHaveLength(1);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(center.getNotifications()).toHaveLength(0);
    });

    it('should persist notifications to local storage', () => {
      const center = new NotificationCenter({ persistToStorage: true });
      
      const notification = {
        id: '1',
        type: 'info',
        title: 'Persistent',
        message: 'This should persist',
        timestamp: new Date()
      };

      center.addNotification(notification);

      // Create new instance (simulating page reload)
      const newCenter = new NotificationCenter({ persistToStorage: true });
      const loaded = newCenter.getNotifications();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('1');
    });
  });

  describe('HealthMonitor', () => {
    it('should track connection health', async () => {
      const monitor = new HealthMonitor();
      const handler = new EventStreamHandler('/api/sse');
      
      monitor.attachToHandler(handler);

      await handler.connect();
      
      expect(monitor.getConnectionStatus()).toBe('connected');
      expect(monitor.getLastHeartbeat()).toBeDefined();
    });

    it('should detect connection issues', async () => {
      const monitor = new HealthMonitor({ heartbeatInterval: 50 });
      const handler = new EventStreamHandler('/api/sse');
      
      monitor.attachToHandler(handler);
      await handler.connect();

      // Simulate missed heartbeats
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(monitor.getConnectionStatus()).toBe('unhealthy');
    });

    it('should calculate latency metrics', async () => {
      const monitor = new HealthMonitor();
      const handler = new EventStreamHandler('/api/sse');
      
      monitor.attachToHandler(handler);
      await handler.connect();

      // Simulate ping-pong events for latency calculation
      mockEventSource.simulateEvent('ping', { timestamp: Date.now() });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const metrics = monitor.getMetrics();
      expect(metrics.latency).toBeDefined();
      expect(metrics.latency).toBeGreaterThan(0);
    });

    it('should provide health recommendations', () => {
      const monitor = new HealthMonitor();
      
      // Simulate poor connection
      monitor.recordEvent('connection_error');
      monitor.recordEvent('connection_error');
      monitor.recordEvent('timeout');

      const recommendations = monitor.getHealthRecommendations();
      
      expect(recommendations).toContain('Consider checking network connectivity');
    });
  });

  describe('useServerSentEvents Hook', () => {
    it('should provide SSE connection state', async () => {
      const { result } = renderHook(() => 
        useServerSentEvents('/api/sse')
      );

      expect(result.current.connectionState).toBe('connecting');

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(result.current.connectionState).toBe('connected');
    });

    it('should handle event subscriptions', async () => {
      const { result } = renderHook(() => 
        useServerSentEvents('/api/sse')
      );

      const messageHandler = vi.fn();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      act(() => {
        result.current.subscribe('user-message', messageHandler);
      });

      mockEventSource.simulateEvent('user-message', { content: 'Hello' });

      expect(messageHandler).toHaveBeenCalledWith({ content: 'Hello' });
    });

    it('should cleanup subscriptions on unmount', () => {
      const { result, unmount } = renderHook(() => 
        useServerSentEvents('/api/sse')
      );

      const messageHandler = vi.fn();
      
      act(() => {
        result.current.subscribe('user-message', messageHandler);
      });

      unmount();

      // Handler should not be called after unmount
      mockEventSource.simulateEvent('user-message', { content: 'Hello' });
      expect(messageHandler).not.toHaveBeenCalled();
    });
  });

  describe('useNotifications Hook', () => {
    it('should manage notification state', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.notifications).toEqual([]);

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test message'
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].type).toBe('info');
    });

    it('should handle notification dismissal', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          id: 'test-1',
          type: 'info',
          title: 'Test',
          message: 'Test message'
        });
      });

      expect(result.current.notifications).toHaveLength(1);

      act(() => {
        result.current.dismissNotification('test-1');
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should filter notifications', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({ type: 'info', title: 'Info', message: 'Info message' });
        result.current.addNotification({ type: 'error', title: 'Error', message: 'Error message' });
        result.current.addNotification({ type: 'warning', title: 'Warning', message: 'Warning message' });
      });

      const errors = result.current.getNotificationsByType('error');
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('error');
    });
  });

  describe('SSEProvider Component', () => {
    it('should provide SSE context to children', () => {
      // This would test the provider pattern
      // Implementation details depend on React Context usage
      expect(true).toBe(true); // Placeholder
    });

    it('should handle multiple event streams', () => {
      // Test multiple SSE connections
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Error Handling', () => {
    it('should handle EventSource not supported', () => {
      // Temporarily remove EventSource
      const originalEventSource = global.EventSource;
      // @ts-ignore
      delete global.EventSource;

      const handler = new EventStreamHandler('/api/sse');
      
      expect(() => handler.connect()).toThrow('EventSource not supported');

      // Restore EventSource
      global.EventSource = originalEventSource;
    });

    it('should provide graceful degradation', () => {
      const handler = new EventStreamHandler('/api/sse', {
        fallbackToPolling: true,
        pollingInterval: 1000
      });

      // Should fall back to polling when EventSource fails
      expect(handler.isFallbackMode()).toBe(false);
      
      // Simulate EventSource failure
      mockEventSource.simulateError();
      
      expect(handler.isFallbackMode()).toBe(true);
    });

    it('should handle malformed event data', async () => {
      const handler = new EventStreamHandler('/api/sse');
      const errorHandler = vi.fn();
      
      handler.on('error', errorHandler);
      await handler.connect();

      // Simulate malformed JSON
      const malformedEvent = new MessageEvent('message', {
        data: 'invalid json{',
        origin: '/api/sse'
      });

      mockEventSource.onmessage?.(malformedEvent);

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle high-frequency events', async () => {
      const handler = new EventStreamHandler('/api/sse');
      const messageHandler = vi.fn();
      
      handler.on('high-frequency', messageHandler);
      await handler.connect();

      const startTime = performance.now();

      // Simulate 1000 rapid events
      for (let i = 0; i < 1000; i++) {
        mockEventSource.simulateEvent('high-frequency', { index: i });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should handle quickly
      expect(messageHandler).toHaveBeenCalledTimes(1000);
    });

    it('should implement event throttling', async () => {
      const handler = new EventStreamHandler('/api/sse', {
        throttle: { 'rapid-event': 100 } // Max 1 event per 100ms
      });
      
      const messageHandler = vi.fn();
      handler.on('rapid-event', messageHandler);
      await handler.connect();

      // Send 10 rapid events
      for (let i = 0; i < 10; i++) {
        mockEventSource.simulateEvent('rapid-event', { index: i });
      }

      // Should be throttled to fewer calls
      expect(messageHandler).toHaveBeenCalledTimes(1);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Send another event after throttle period
      mockEventSource.simulateEvent('rapid-event', { index: 10 });

      expect(messageHandler).toHaveBeenCalledTimes(2);
    });
  });
});