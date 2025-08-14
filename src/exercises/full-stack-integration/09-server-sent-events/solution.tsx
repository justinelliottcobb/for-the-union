import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { EventEmitter } from 'events';

// Types and Interfaces
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

interface NotificationAction {
  label: string;
  action: () => void;
  type?: 'primary' | 'secondary' | 'danger';
}

interface NotificationOptions {
  autoDissmissTimeout?: number;
  maxNotifications?: number;
  persistToStorage?: boolean;
}

interface HealthMetrics {
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'unhealthy';
  latency?: number;
  errorRate: number;
  uptime: number;
  lastHeartbeat?: Date;
}

interface ServerSentEventsState {
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastEvent: any;
  eventHistory: any[];
  subscribe: (eventType: string, handler: (data: any) => void) => () => void;
  unsubscribe: (eventType: string) => void;
  reconnect: () => void;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  getNotificationsByType: (type: string) => Notification[];
}

interface SSEContextValue {
  handlers: Map<string, EventStreamHandler>;
  subscribe: (url: string, eventType: string, callback: (data: any) => void) => () => void;
  getConnectionState: (url: string) => string;
  getHealthMetrics: (url: string) => HealthMetrics | null;
}

// Health Monitor
export class HealthMonitor {
  private connectionStatus: HealthMetrics['connectionStatus'] = 'disconnected';
  private latency?: number;
  private errorCount = 0;
  private totalRequests = 0;
  private startTime = Date.now();
  private lastHeartbeat?: Date;
  private heartbeatInterval: number;
  private eventLog: string[] = [];

  constructor(options: { heartbeatInterval?: number } = {}) {
    this.heartbeatInterval = options.heartbeatInterval ?? 30000;
  }

  attachToHandler(handler: EventStreamHandler): void {
    handler.on('connecting', () => {
      this.connectionStatus = 'connecting';
    });

    handler.on('connected', () => {
      this.connectionStatus = 'connected';
      this.lastHeartbeat = new Date();
    });

    handler.on('disconnected', () => {
      this.connectionStatus = 'disconnected';
    });

    handler.on('error', () => {
      this.connectionStatus = 'unhealthy';
      this.errorCount++;
    });

    handler.on('message', () => {
      this.lastHeartbeat = new Date();
      this.totalRequests++;
    });

    // Start heartbeat monitoring
    if (this.heartbeatInterval > 0) {
      setInterval(() => {
        this.checkHeartbeat();
      }, this.heartbeatInterval / 2);
    }
  }

  private checkHeartbeat(): void {
    if (this.lastHeartbeat) {
      const timeSinceHeartbeat = Date.now() - this.lastHeartbeat.getTime();
      if (timeSinceHeartbeat > this.heartbeatInterval * 2) {
        this.connectionStatus = 'unhealthy';
      }
    }
  }

  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  getLastHeartbeat(): Date | undefined {
    return this.lastHeartbeat;
  }

  getMetrics(): HealthMetrics {
    return {
      connectionStatus: this.connectionStatus,
      latency: this.latency,
      errorRate: this.totalRequests > 0 ? this.errorCount / this.totalRequests : 0,
      uptime: Date.now() - this.startTime,
      lastHeartbeat: this.lastHeartbeat
    };
  }

  getHealthRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();

    if (metrics.errorRate > 0.1) {
      recommendations.push('High error rate detected. Consider checking network connectivity.');
    }

    if (metrics.latency && metrics.latency > 5000) {
      recommendations.push('High latency detected. Check server performance.');
    }

    if (this.connectionStatus === 'unhealthy') {
      recommendations.push('Connection appears unhealthy. Consider restarting the connection.');
    }

    if (!this.lastHeartbeat || Date.now() - this.lastHeartbeat.getTime() > this.heartbeatInterval) {
      recommendations.push('No recent heartbeat detected. Check server status.');
    }

    return recommendations;
  }

  recordEvent(event: string): void {
    this.eventLog.push(`${new Date().toISOString()}: ${event}`);
    
    if (event.includes('error') || event.includes('timeout')) {
      this.errorCount++;
    }
    
    this.totalRequests++;

    // Keep only last 100 events
    if (this.eventLog.length > 100) {
      this.eventLog = this.eventLog.slice(-100);
    }
  }
}

// Event Stream Handler
export class EventStreamHandler extends EventEmitter {
  private url: string;
  private options: EventStreamOptions;
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private filters = new Map<string, (data: any) => boolean>();
  private throttleTimers = new Map<string, NodeJS.Timeout>();
  private lastEventTime = new Map<string, number>();
  private fallbackPolling = false;
  private pollingTimer: NodeJS.Timeout | null = null;

  constructor(url: string, options: EventStreamOptions = {}) {
    super();
    this.url = url;
    this.options = {
      autoReconnect: true,
      reconnectDelay: 1000,
      maxReconnectAttempts: 5,
      fallbackToPolling: false,
      pollingInterval: 5000,
      ...options
    };
  }

  async connect(): Promise<void> {
    if (this.eventSource?.readyState === EventSource.OPEN) {
      return;
    }

    // Check if EventSource is supported
    if (typeof EventSource === 'undefined') {
      if (this.options.fallbackToPolling) {
        this.startPolling();
        return;
      } else {
        throw new Error('EventSource not supported');
      }
    }

    this.emit('connecting');

    try {
      const eventSourceOptions: EventSourceInit = {
        withCredentials: this.options.withCredentials
      };

      this.eventSource = new EventSource(this.url, eventSourceOptions);

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.emit('connected');
        this.emit('open');
      };

      this.eventSource.onmessage = (event) => {
        this.handleMessage('message', event.data, event.lastEventId);
      };

      this.eventSource.onerror = (error) => {
        this.emit('error', error);
        this.handleReconnection();
      };

      // Handle custom event types
      this.setupCustomEventListeners();

    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private setupCustomEventListeners(): void {
    if (!this.eventSource) return;

    // Common event types
    const eventTypes = ['notification', 'user-message', 'system-update', 'ping'];
    
    eventTypes.forEach(eventType => {
      this.eventSource!.addEventListener(eventType, (event: MessageEvent) => {
        this.handleMessage(eventType, event.data, event.lastEventId);
      });
    });
  }

  private handleMessage(eventType: string, data: string, eventId?: string): void {
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch {
        parsedData = data; // Use raw data if not JSON
      }

      // Apply filtering
      const filter = this.filters.get(eventType);
      if (filter && !filter(parsedData)) {
        return; // Filtered out
      }

      // Apply throttling
      if (this.shouldThrottleEvent(eventType)) {
        return;
      }

      this.emit('message', parsedData);
      this.emit(eventType, parsedData);
      
      // Handle ping events for latency calculation
      if (eventType === 'ping' && parsedData.timestamp) {
        const latency = Date.now() - parsedData.timestamp;
        this.emit('latency', latency);
      }

    } catch (error) {
      this.emit('error', new Error(`Failed to parse message: ${error}`));
    }
  }

  private shouldThrottleEvent(eventType: string): boolean {
    const throttleMs = this.options.throttle?.[eventType];
    if (!throttleMs) return false;

    const lastTime = this.lastEventTime.get(eventType);
    const now = Date.now();
    
    if (lastTime && now - lastTime < throttleMs) {
      return true; // Throttled
    }

    this.lastEventTime.set(eventType, now);
    return false;
  }

  disconnect(): void {
    this.clearReconnectTimer();
    this.clearPollingTimer();
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.fallbackPolling = false;
    this.emit('disconnected');
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN || this.fallbackPolling;
  }

  addFilter(eventType: string, filter: (data: any) => boolean): void {
    this.filters.set(eventType, filter);
  }

  removeFilter(eventType: string): void {
    this.filters.delete(eventType);
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  isFallbackMode(): boolean {
    return this.fallbackPolling;
  }

  private handleReconnection(): void {
    if (!this.options.autoReconnect) {
      this.emit('disconnected');
      return;
    }

    if (this.reconnectAttempts >= (this.options.maxReconnectAttempts || 5)) {
      if (this.options.fallbackToPolling) {
        this.startPolling();
      } else {
        this.emit('maxReconnectAttemptsReached');
      }
      return;
    }

    const delay = this.calculateReconnectDelay();
    this.reconnectAttempts++;

    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.emit('reconnectError', error);
      });
    }, delay);
  }

  private calculateReconnectDelay(): number {
    const baseDelay = this.options.reconnectDelay || 1000;
    const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts - 1);
    const maxDelay = 30000;
    
    // Add jitter
    const jitter = Math.random() * 1000;
    
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  private startPolling(): void {
    this.fallbackPolling = true;
    this.emit('connected');
    this.emit('fallbackActivated');

    const poll = async () => {
      try {
        const response = await fetch(this.url, {
          headers: this.options.headers,
          credentials: this.options.withCredentials ? 'include' : 'same-origin'
        });
        
        const data = await response.json();
        this.handleMessage('message', JSON.stringify(data));
        
      } catch (error) {
        this.emit('error', error);
      }

      if (this.fallbackPolling) {
        this.pollingTimer = setTimeout(poll, this.options.pollingInterval);
      }
    };

    poll();
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private clearPollingTimer(): void {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }
  }
}

// Notification Center
export class NotificationCenter {
  private notifications: Notification[] = [];
  private options: NotificationOptions;
  private storageKey = 'sse-notifications';

  constructor(options: NotificationOptions = {}) {
    this.options = {
      autoDissmissTimeout: 5000,
      maxNotifications: 100,
      persistToStorage: false,
      ...options
    };

    if (this.options.persistToStorage) {
      this.loadFromStorage();
    }
  }

  addNotification(notificationData: Omit<Notification, 'id' | 'timestamp'>): void {
    const notification: Notification = {
      ...notificationData,
      id: this.generateId(),
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(notification);

    // Limit number of notifications
    if (this.notifications.length > (this.options.maxNotifications || 100)) {
      this.notifications = this.notifications.slice(0, this.options.maxNotifications);
    }

    // Auto-dismiss if configured
    if (notification.autoDismiss && this.options.autoDissmissTimeout) {
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, this.options.autoDissmissTimeout);
    }

    if (this.options.persistToStorage) {
      this.saveToStorage();
    }
  }

  dismissNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    
    if (this.options.persistToStorage) {
      this.saveToStorage();
    }
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      
      if (this.options.persistToStorage) {
        this.saveToStorage();
      }
    }
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  getNotificationsByType(type: string): Notification[] {
    return this.notifications.filter(n => n.type === type);
  }

  clearAll(): void {
    this.notifications = [];
    
    if (this.options.persistToStorage) {
      this.saveToStorage();
    }
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.notifications = data.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load notifications from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.notifications));
    } catch (error) {
      console.warn('Failed to save notifications to storage:', error);
    }
  }
}

// SSE Context
const SSEContext = createContext<SSEContextValue | null>(null);

// SSE Provider
export const SSEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const handlers = useRef(new Map<string, EventStreamHandler>());
  const subscribers = useRef(new Map<string, Map<string, Set<(data: any) => void>>>());

  const subscribe = useCallback((url: string, eventType: string, callback: (data: any) => void) => {
    // Get or create handler
    if (!handlers.current.has(url)) {
      const handler = new EventStreamHandler(url);
      handlers.current.set(url, handler);
      handler.connect();
    }

    // Set up subscriber maps
    if (!subscribers.current.has(url)) {
      subscribers.current.set(url, new Map());
    }
    
    const urlSubscribers = subscribers.current.get(url)!;
    if (!urlSubscribers.has(eventType)) {
      urlSubscribers.set(eventType, new Set());
    }

    const eventSubscribers = urlSubscribers.get(eventType)!;
    eventSubscribers.add(callback);

    // Set up event handler
    const handler = handlers.current.get(url)!;
    const eventHandler = (data: any) => {
      eventSubscribers.forEach(cb => cb(data));
    };

    handler.on(eventType, eventHandler);

    // Return unsubscribe function
    return () => {
      eventSubscribers.delete(callback);
      handler.off(eventType, eventHandler);
      
      // Clean up if no subscribers
      if (eventSubscribers.size === 0) {
        urlSubscribers.delete(eventType);
        
        if (urlSubscribers.size === 0) {
          handler.disconnect();
          handlers.current.delete(url);
          subscribers.current.delete(url);
        }
      }
    };
  }, []);

  const getConnectionState = useCallback((url: string): string => {
    const handler = handlers.current.get(url);
    if (!handler) return 'disconnected';
    
    if (handler.isConnected()) return 'connected';
    return 'connecting';
  }, []);

  const getHealthMetrics = useCallback((url: string): HealthMetrics | null => {
    const handler = handlers.current.get(url);
    // This would require integrating HealthMonitor with the handler
    return null; // Placeholder
  }, []);

  useEffect(() => {
    // Cleanup all handlers on unmount
    return () => {
      handlers.current.forEach(handler => handler.disconnect());
      handlers.current.clear();
      subscribers.current.clear();
    };
  }, []);

  const value: SSEContextValue = {
    handlers: handlers.current,
    subscribe,
    getConnectionState,
    getHealthMetrics
  };

  return (
    <SSEContext.Provider value={value}>
      {children}
    </SSEContext.Provider>
  );
};

// useServerSentEvents Hook
export const useServerSentEvents = (url: string, options?: EventStreamOptions): ServerSentEventsState => {
  const [connectionState, setConnectionState] = useState<ServerSentEventsState['connectionState']>('disconnected');
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [eventHistory, setEventHistory] = useState<any[]>([]);
  
  const handler = useRef<EventStreamHandler | null>(null);
  const eventSubscribers = useRef(new Map<string, Set<(data: any) => void>>());

  useEffect(() => {
    handler.current = new EventStreamHandler(url, options);
    
    const handleConnecting = () => setConnectionState('connecting');
    const handleConnected = () => setConnectionState('connected');
    const handleDisconnected = () => setConnectionState('disconnected');
    const handleError = () => setConnectionState('error');
    
    const handleMessage = (data: any) => {
      setLastEvent(data);
      setEventHistory(prev => [...prev.slice(-99), data]); // Keep last 100 events
    };

    handler.current.on('connecting', handleConnecting);
    handler.current.on('connected', handleConnected);
    handler.current.on('disconnected', handleDisconnected);
    handler.current.on('error', handleError);
    handler.current.on('message', handleMessage);

    handler.current.connect();

    return () => {
      handler.current?.disconnect();
      handler.current?.removeAllListeners();
    };
  }, [url, options]);

  const subscribe = useCallback((eventType: string, eventHandler: (data: any) => void) => {
    if (!eventSubscribers.current.has(eventType)) {
      eventSubscribers.current.set(eventType, new Set());
    }
    
    const subscribers = eventSubscribers.current.get(eventType)!;
    subscribers.add(eventHandler);

    // Set up handler event listener
    const handleEvent = (data: any) => {
      subscribers.forEach(handler => handler(data));
    };

    handler.current?.on(eventType, handleEvent);

    return () => {
      subscribers.delete(eventHandler);
      handler.current?.off(eventType, handleEvent);
      
      if (subscribers.size === 0) {
        eventSubscribers.current.delete(eventType);
      }
    };
  }, []);

  const unsubscribe = useCallback((eventType: string) => {
    const subscribers = eventSubscribers.current.get(eventType);
    if (subscribers) {
      subscribers.clear();
      eventSubscribers.current.delete(eventType);
      handler.current?.removeAllListeners(eventType);
    }
  }, []);

  const reconnect = useCallback(() => {
    handler.current?.connect();
  }, []);

  return {
    connectionState,
    lastEvent,
    eventHistory,
    subscribe,
    unsubscribe,
    reconnect
  };
};

// useNotifications Hook
export const useNotifications = (): NotificationsState => {
  const [notificationCenter] = useState(() => new NotificationCenter({ persistToStorage: true }));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateState = () => {
      const current = notificationCenter.getNotifications();
      setNotifications(current);
      setUnreadCount(notificationCenter.getUnreadCount());
    };

    updateState();
    
    // Set up periodic updates (simple approach)
    const interval = setInterval(updateState, 1000);
    return () => clearInterval(interval);
  }, [notificationCenter]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    notificationCenter.addNotification(notification);
    setNotifications(notificationCenter.getNotifications());
    setUnreadCount(notificationCenter.getUnreadCount());
  }, [notificationCenter]);

  const dismissNotification = useCallback((id: string) => {
    notificationCenter.dismissNotification(id);
    setNotifications(notificationCenter.getNotifications());
    setUnreadCount(notificationCenter.getUnreadCount());
  }, [notificationCenter]);

  const markAsRead = useCallback((id: string) => {
    notificationCenter.markAsRead(id);
    setNotifications(notificationCenter.getNotifications());
    setUnreadCount(notificationCenter.getUnreadCount());
  }, [notificationCenter]);

  const clearAll = useCallback(() => {
    notificationCenter.clearAll();
    setNotifications([]);
    setUnreadCount(0);
  }, [notificationCenter]);

  const getNotificationsByType = useCallback((type: string) => {
    return notificationCenter.getNotificationsByType(type);
  }, [notificationCenter]);

  return {
    notifications,
    unreadCount,
    addNotification,
    dismissNotification,
    markAsRead,
    clearAll,
    getNotificationsByType
  };
};

// Notification Component
export const NotificationItem: React.FC<{
  notification: Notification;
  onDismiss: () => void;
  onMarkAsRead: () => void;
}> = ({ notification, onDismiss, onMarkAsRead }) => {
  const getTypeColor = () => {
    switch (notification.type) {
      case 'error': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'success': return '#28a745';
      default: return '#17a2b8';
    }
  };

  return (
    <div
      style={{
        border: `1px solid ${getTypeColor()}`,
        borderLeft: `4px solid ${getTypeColor()}`,
        borderRadius: '4px',
        padding: '12px',
        marginBottom: '8px',
        backgroundColor: notification.read ? '#f8f9fa' : 'white',
        opacity: notification.read ? 0.7 : 1
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <strong style={{ color: getTypeColor() }}>{notification.title}</strong>
            <span style={{ fontSize: '12px', color: '#666' }}>
              {notification.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <p style={{ margin: '0', color: '#333' }}>{notification.message}</p>
          
          {notification.actions && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    backgroundColor: action.type === 'primary' ? '#007bff' : 'white',
                    color: action.type === 'primary' ? 'white' : '#333',
                    cursor: 'pointer'
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
          {!notification.read && (
            <button
              onClick={onMarkAsRead}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                border: 'none',
                borderRadius: '3px',
                backgroundColor: '#6c757d',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Mark Read
            </button>
          )}
          <button
            onClick={onDismiss}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: 'none',
              borderRadius: '3px',
              backgroundColor: '#dc3545',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

// Notification Center Component
export const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, dismissNotification, markAsRead, clearAll } = useNotifications();
  const [filter, setFilter] = useState<string>('all');

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  return (
    <div style={{ maxWidth: '400px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #eee', 
        backgroundColor: '#f8f9fa',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: '0' }}>
          Notifications 
          {unreadCount > 0 && (
            <span style={{
              marginLeft: '8px',
              padding: '2px 6px',
              backgroundColor: '#dc3545',
              color: 'white',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              {unreadCount}
            </span>
          )}
        </h3>
        
        <button
          onClick={clearAll}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid #ddd',
            borderRadius: '3px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          Clear All
        </button>
      </div>

      <div style={{ padding: '8px' }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: '100%',
            padding: '4px',
            marginBottom: '8px',
            border: '1px solid #ddd',
            borderRadius: '3px'
          }}
        >
          <option value="all">All Notifications</option>
          <option value="info">Info</option>
          <option value="warning">Warnings</option>
          <option value="error">Errors</option>
          <option value="success">Success</option>
        </select>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0 8px 8px' }}>
        {filteredNotifications.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No notifications
          </p>
        ) : (
          filteredNotifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDismiss={() => dismissNotification(notification.id)}
              onMarkAsRead={() => markAsRead(notification.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Demo Component
export const SSEDemo: React.FC = () => {
  const sse = useServerSentEvents('/api/sse');
  const { addNotification } = useNotifications();

  useEffect(() => {
    const unsubscribe = sse.subscribe('notification', (data) => {
      addNotification({
        type: data.type || 'info',
        title: data.title || 'New Notification',
        message: data.message || 'You have a new notification',
        autoDismiss: data.autoDismiss
      });
    });

    return unsubscribe;
  }, [sse, addNotification]);

  return (
    <SSEProvider>
      <div style={{ padding: '20px' }}>
        <h1>Server-Sent Events Demo</h1>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h3>Connection Status: {sse.connectionState}</h3>
            <p>Last Event: {sse.lastEvent ? JSON.stringify(sse.lastEvent) : 'None'}</p>
            <p>Event Count: {sse.eventHistory.length}</p>
            
            <button
              onClick={() => addNotification({
                type: 'info',
                title: 'Test Notification',
                message: 'This is a test notification created locally.'
              })}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Test Notification
            </button>
          </div>
          
          <NotificationCenter />
        </div>
      </div>
    </SSEProvider>
  );
};

export default SSEDemo;