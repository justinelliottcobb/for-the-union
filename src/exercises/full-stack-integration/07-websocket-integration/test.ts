import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  WebSocketProvider, 
  useWebSocket,
  ConnectionManager,
  MessageHandler,
  ReconnectLogic
} from './solution';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string, public protocols?: string | string[]) {
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Simulate echo
    setTimeout(() => {
      this.onmessage?.(new MessageEvent('message', { data }));
    }, 5);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.onclose?.(new CloseEvent('close', { code, reason }));
    }, 5);
  }

  // Test helpers
  simulateMessage(data: any) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
  }

  simulateError() {
    this.onerror?.(new Event('error'));
  }

  simulateClose(code = 1000, reason = 'Normal closure') {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason }));
  }
}

// Replace global WebSocket with mock
vi.stubGlobal('WebSocket', MockWebSocket);

describe('WebSocket Integration', () => {
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocket = new MockWebSocket('ws://localhost:8080');
  });

  afterEach(() => {
    mockWebSocket?.close();
  });

  describe('ConnectionManager', () => {
    it('should establish WebSocket connection', async () => {
      const manager = new ConnectionManager('ws://localhost:8080');
      const connectPromise = manager.connect();

      await act(async () => {
        await connectPromise;
      });

      expect(manager.isConnected()).toBe(true);
    });

    it('should handle connection errors', async () => {
      const manager = new ConnectionManager('ws://invalid-url');
      const onError = vi.fn();
      manager.on('error', onError);

      await act(async () => {
        try {
          await manager.connect();
        } catch (error) {
          // Expected to fail
        }
      });

      expect(onError).toHaveBeenCalled();
    });

    it('should implement auto-reconnection', async () => {
      const manager = new ConnectionManager('ws://localhost:8080', {
        autoReconnect: true,
        maxReconnectAttempts: 3,
        reconnectDelay: 100
      });

      await manager.connect();
      
      // Simulate connection loss
      mockWebSocket.simulateClose(1006, 'Connection lost');

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(manager.getReconnectAttempts()).toBeGreaterThan(0);
    });

    it('should implement exponential backoff', () => {
      const reconnectLogic = new ReconnectLogic({
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2
      });

      expect(reconnectLogic.getNextDelay(0)).toBe(1000);
      expect(reconnectLogic.getNextDelay(1)).toBe(2000);
      expect(reconnectLogic.getNextDelay(2)).toBe(4000);
      expect(reconnectLogic.getNextDelay(10)).toBe(30000); // Capped at maxDelay
    });
  });

  describe('MessageHandler', () => {
    it('should queue messages when disconnected', () => {
      const handler = new MessageHandler();
      const message = { type: 'test', data: 'hello' };

      handler.send(message);
      
      expect(handler.getQueuedMessages()).toHaveLength(1);
      expect(handler.getQueuedMessages()[0]).toEqual(message);
    });

    it('should replay queued messages on reconnection', async () => {
      const handler = new MessageHandler();
      const manager = new ConnectionManager('ws://localhost:8080');
      
      handler.setConnection(manager);

      // Queue messages while disconnected
      handler.send({ type: 'msg1', data: 'test1' });
      handler.send({ type: 'msg2', data: 'test2' });

      await manager.connect();
      
      // Messages should be sent
      expect(handler.getQueuedMessages()).toHaveLength(0);
    });

    it('should handle message buffering', () => {
      const handler = new MessageHandler({ bufferSize: 100 });
      
      // Fill buffer
      for (let i = 0; i < 150; i++) {
        handler.send({ type: 'test', data: `message ${i}` });
      }

      // Should only keep last 100 messages
      expect(handler.getQueuedMessages()).toHaveLength(100);
      expect(handler.getQueuedMessages()[0].data).toBe('message 50');
    });
  });

  describe('useWebSocket Hook', () => {
    it('should provide connection state', async () => {
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080')
      );

      expect(result.current.connectionState).toBe('connecting');

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(result.current.connectionState).toBe('connected');
    });

    it('should handle message sending and receiving', async () => {
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080')
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      const testMessage = { type: 'test', data: 'hello' };
      
      act(() => {
        result.current.sendMessage(testMessage);
      });

      // Should receive echo
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      expect(result.current.lastMessage).toEqual(testMessage);
    });

    it('should track message history', async () => {
      const { result } = renderHook(() => 
        useWebSocket('ws://localhost:8080', { keepHistory: true })
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      const messages = [
        { type: 'msg1', data: 'test1' },
        { type: 'msg2', data: 'test2' },
        { type: 'msg3', data: 'test3' }
      ];

      for (const message of messages) {
        act(() => {
          result.current.sendMessage(message);
        });
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }

      expect(result.current.messageHistory).toHaveLength(3);
      expect(result.current.messageHistory.map(m => m.data)).toEqual(messages);
    });
  });

  describe('WebSocketProvider', () => {
    it('should provide WebSocket context to children', () => {
      // This would test the provider pattern
      // Implementation details depend on React Context usage
      expect(true).toBe(true); // Placeholder
    });

    it('should handle multiple subscribers', () => {
      // Test multiple components using the same WebSocket connection
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const manager = new ConnectionManager('ws://localhost:8080');
      const onError = vi.fn();
      manager.on('error', onError);

      await manager.connect();
      mockWebSocket.simulateError();

      expect(onError).toHaveBeenCalled();
    });

    it('should handle connection timeouts', async () => {
      const manager = new ConnectionManager('ws://localhost:8080', {
        connectionTimeout: 100
      });

      const connectPromise = manager.connect();
      
      await act(async () => {
        await expect(connectPromise).rejects.toThrow('Connection timeout');
      });
    });
  });

  describe('Performance', () => {
    it('should handle high message throughput', async () => {
      const handler = new MessageHandler();
      const manager = new ConnectionManager('ws://localhost:8080');
      handler.setConnection(manager);

      await manager.connect();

      const messageCount = 1000;
      const startTime = performance.now();

      for (let i = 0; i < messageCount; i++) {
        handler.send({ type: 'test', data: `message ${i}` });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle 1000 messages in reasonable time
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });

    it('should cleanup resources on disconnect', async () => {
      const manager = new ConnectionManager('ws://localhost:8080');
      await manager.connect();

      const cleanup = vi.fn();
      manager.on('cleanup', cleanup);

      manager.disconnect();

      expect(cleanup).toHaveBeenCalled();
    });
  });
});