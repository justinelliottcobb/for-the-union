import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { EventEmitter } from 'events';

// Types and Interfaces
interface ConnectionOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  connectionTimeout?: number;
}

interface MessageOptions {
  bufferSize?: number;
  enableQueue?: boolean;
  replayOnConnect?: boolean;
}

interface ReconnectOptions {
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
}

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

interface WebSocketContextValue {
  connections: Map<string, ConnectionManager>;
  subscribe: (url: string, callback: (message: any) => void) => () => void;
  send: (url: string, message: any) => void;
  getConnectionState: (url: string) => string;
}

// Reconnection Logic with Exponential Backoff
export class ReconnectLogic {
  private initialDelay: number;
  private maxDelay: number;
  private backoffMultiplier: number;
  private jitter: boolean;

  constructor(options: ReconnectOptions = {}) {
    this.initialDelay = options.initialDelay ?? 1000;
    this.maxDelay = options.maxDelay ?? 30000;
    this.backoffMultiplier = options.backoffMultiplier ?? 2;
    this.jitter = options.jitter ?? true;
  }

  getNextDelay(attemptCount: number): number {
    let delay = this.initialDelay * Math.pow(this.backoffMultiplier, attemptCount);
    delay = Math.min(delay, this.maxDelay);

    if (this.jitter) {
      // Add ±25% jitter to prevent thundering herd
      const jitterAmount = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(delay, 0);
  }

  shouldRetry(attemptCount: number, maxAttempts: number): boolean {
    return attemptCount < maxAttempts;
  }

  reset(): void {
    // Reset any internal state if needed
  }
}

// Message Handler with Queuing
export class MessageHandler {
  private bufferSize: number;
  private enableQueue: boolean;
  private replayOnConnect: boolean;
  private messageQueue: any[] = [];
  private connection: ConnectionManager | null = null;

  constructor(options: MessageOptions = {}) {
    this.bufferSize = options.bufferSize ?? 1000;
    this.enableQueue = options.enableQueue ?? true;
    this.replayOnConnect = options.replayOnConnect ?? true;
  }

  setConnection(connection: ConnectionManager): void {
    this.connection = connection;
    
    if (this.replayOnConnect) {
      connection.on('connected', () => {
        this.replayQueuedMessages();
      });
    }
  }

  send(message: any): void {
    if (this.connection?.isConnected()) {
      this.connection.send(message);
    } else if (this.enableQueue) {
      this.queueMessage(message);
    }
  }

  private queueMessage(message: any): void {
    this.messageQueue.push(message);
    
    // Implement buffer size limit
    if (this.messageQueue.length > this.bufferSize) {
      // Remove oldest messages to make room
      this.messageQueue = this.messageQueue.slice(-this.bufferSize);
    }
  }

  private replayQueuedMessages(): void {
    const messages = [...this.messageQueue];
    this.messageQueue = [];
    
    messages.forEach(message => {
      this.connection?.send(message);
    });
  }

  getQueuedMessages(): any[] {
    return [...this.messageQueue];
  }

  clearQueue(): void {
    this.messageQueue = [];
  }
}

// Connection Manager
export class ConnectionManager extends EventEmitter {
  private url: string;
  private options: ConnectionOptions;
  private socket: WebSocket | null = null;
  private reconnectLogic: ReconnectLogic;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;

  constructor(url: string, options: ConnectionOptions = {}) {
    super();
    this.url = url;
    this.options = {
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      connectionTimeout: 30000,
      ...options
    };
    
    this.reconnectLogic = new ReconnectLogic({
      initialDelay: this.options.reconnectDelay,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true
    });
  }

  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected()) {
      return;
    }

    this.isConnecting = true;
    this.emit('connecting');

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);
        
        // Set connection timeout
        this.connectionTimer = setTimeout(() => {
          this.cleanup();
          reject(new Error('Connection timeout'));
        }, this.options.connectionTimeout);

        this.socket.onopen = () => {
          this.clearConnectionTimer();
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.emit('connected');
          this.emit('open');
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit('message', data);
          } catch (error) {
            this.emit('message', event.data);
          }
        };

        this.socket.onclose = (event) => {
          this.isConnecting = false;
          this.emit('disconnected', event);
          this.handleReconnection();
        };

        this.socket.onerror = (error) => {
          this.isConnecting = false;
          this.emit('error', error);
          if (this.connectionTimer) {
            this.clearConnectionTimer();
            reject(error);
          }
        };

      } catch (error) {
        this.isConnecting = false;
        this.clearConnectionTimer();
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.clearReconnectTimer();
    this.clearConnectionTimer();
    
    if (this.socket) {
      this.socket.close(1000, 'Normal closure');
      this.socket = null;
    }
    
    this.emit('cleanup');
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  send(message: any): void {
    if (this.isConnected()) {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket!.send(data);
    } else {
      throw new Error('WebSocket is not connected');
    }
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  private handleReconnection(): void {
    if (!this.options.autoReconnect) {
      return;
    }

    if (!this.reconnectLogic.shouldRetry(this.reconnectAttempts, this.options.maxReconnectAttempts!)) {
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    const delay = this.reconnectLogic.getNextDelay(this.reconnectAttempts);
    this.reconnectAttempts++;

    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.emit('reconnectError', error);
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearConnectionTimer(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  private cleanup(): void {
    this.clearReconnectTimer();
    this.clearConnectionTimer();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// WebSocket Context
const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// WebSocket Provider Component
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const connections = useRef(new Map<string, ConnectionManager>());
  const subscribers = useRef(new Map<string, Set<(message: any) => void>>());

  const subscribe = useCallback((url: string, callback: (message: any) => void) => {
    // Get or create connection
    if (!connections.current.has(url)) {
      const connection = new ConnectionManager(url);
      connections.current.set(url, connection);
      
      connection.on('message', (message) => {
        const urlSubscribers = subscribers.current.get(url);
        if (urlSubscribers) {
          urlSubscribers.forEach(callback => callback(message));
        }
      });
    }

    // Add subscriber
    if (!subscribers.current.has(url)) {
      subscribers.current.set(url, new Set());
    }
    subscribers.current.get(url)!.add(callback);

    // Connect if not already connected
    const connection = connections.current.get(url)!;
    if (!connection.isConnected()) {
      connection.connect();
    }

    // Return unsubscribe function
    return () => {
      const urlSubscribers = subscribers.current.get(url);
      if (urlSubscribers) {
        urlSubscribers.delete(callback);
        
        // Clean up connection if no subscribers
        if (urlSubscribers.size === 0) {
          connection.disconnect();
          connections.current.delete(url);
          subscribers.current.delete(url);
        }
      }
    };
  }, []);

  const send = useCallback((url: string, message: any) => {
    const connection = connections.current.get(url);
    if (connection) {
      connection.send(message);
    }
  }, []);

  const getConnectionState = useCallback((url: string): string => {
    const connection = connections.current.get(url);
    if (!connection) return 'disconnected';
    
    if (connection.isConnected()) return 'connected';
    return 'connecting';
  }, []);

  useEffect(() => {
    // Cleanup all connections on unmount
    return () => {
      connections.current.forEach(connection => connection.disconnect());
      connections.current.clear();
      subscribers.current.clear();
    };
  }, []);

  const value: WebSocketContextValue = {
    connections: connections.current,
    subscribe,
    send,
    getConnectionState
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// useWebSocket Hook
export const useWebSocket = (url: string, options: UseWebSocketOptions = {}): WebSocketState => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }

  const [connectionState, setConnectionState] = useState<WebSocketState['connectionState']>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [messageHistory, setMessageHistory] = useState<any[]>([]);
  
  const {
    keepHistory = false,
    maxHistorySize = 100,
    autoConnect = true
  } = options;

  const connection = useRef<ConnectionManager | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    connection.current = new ConnectionManager(url);
    
    const handleConnecting = () => setConnectionState('connecting');
    const handleConnected = () => setConnectionState('connected');
    const handleDisconnected = () => setConnectionState('disconnected');
    const handleError = () => setConnectionState('error');
    const handleMessage = (message: any) => {
      setLastMessage(message);
      if (keepHistory) {
        setMessageHistory(prev => {
          const newHistory = [...prev, message];
          return newHistory.slice(-maxHistorySize);
        });
      }
    };

    connection.current.on('connecting', handleConnecting);
    connection.current.on('connected', handleConnected);
    connection.current.on('disconnected', handleDisconnected);
    connection.current.on('error', handleError);
    connection.current.on('message', handleMessage);

    connection.current.connect();

    return () => {
      connection.current?.disconnect();
      connection.current?.removeAllListeners();
    };
  }, [url, autoConnect, keepHistory, maxHistorySize]);

  const sendMessage = useCallback((message: any) => {
    connection.current?.send(message);
  }, []);

  const connect = useCallback(() => {
    connection.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    connection.current?.disconnect();
  }, []);

  return {
    connectionState,
    lastMessage,
    messageHistory,
    sendMessage,
    connect,
    disconnect
  };
};

// Connection Status Component
export const ConnectionStatus: React.FC<{ url: string }> = ({ url }) => {
  const { getConnectionState } = useContext(WebSocketContext)!;
  const [state, setState] = useState(getConnectionState(url));

  useEffect(() => {
    const interval = setInterval(() => {
      setState(getConnectionState(url));
    }, 1000);

    return () => clearInterval(interval);
  }, [url, getConnectionState]);

  const getStatusColor = () => {
    switch (state) {
      case 'connected': return 'green';
      case 'connecting': return 'yellow';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div 
        style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: getStatusColor() 
        }} 
      />
      <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>
        {state}
      </span>
    </div>
  );
};

// Chat Component Example
export const ChatComponent: React.FC<{ url: string; userId: string }> = ({ url, userId }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const { subscribe, send, getConnectionState } = useContext(WebSocketContext)!;
  
  useEffect(() => {
    const unsubscribe = subscribe(url, (message) => {
      setMessages(prev => [...prev, message]);
    });

    return unsubscribe;
  }, [url, subscribe]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && getConnectionState(url) === 'connected') {
      send(url, {
        type: 'message',
        content: inputMessage,
        userId,
        timestamp: new Date().toISOString()
      });
      setInputMessage('');
    }
  };

  return (
    <div style={{ maxWidth: '400px', border: '1px solid #ccc', borderRadius: '8px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>Chat</h3>
        <ConnectionStatus url={url} />
      </div>
      
      <div style={{ height: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '8px', marginBottom: '16px' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '8px' }}>
            <strong>{msg.userId}: </strong>
            <span>{msg.content}</span>
            <small style={{ color: '#666', marginLeft: '8px' }}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </small>
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          disabled={getConnectionState(url) !== 'connected'}
        />
        <button 
          onClick={handleSendMessage}
          disabled={getConnectionState(url) !== 'connected'}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: getConnectionState(url) === 'connected' ? 'pointer' : 'not-allowed'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

// Usage Example Component
export const WebSocketDemo: React.FC = () => {
  return (
    <WebSocketProvider>
      <div style={{ padding: '20px' }}>
        <h1>WebSocket Integration Demo</h1>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <ChatComponent url="ws://localhost:8080/chat" userId="user1" />
          <ChatComponent url="ws://localhost:8080/chat" userId="user2" />
        </div>
      </div>
    </WebSocketProvider>
  );
};

export default WebSocketDemo;