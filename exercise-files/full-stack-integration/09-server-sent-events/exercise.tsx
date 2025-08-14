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

// TODO: Implement HealthMonitor class
export class HealthMonitor {
  // TODO: Add private properties for tracking connection health
  
  constructor(options: { heartbeatInterval?: number } = {}) {
    // TODO: Initialize with heartbeat interval (default 30000ms)
    // TODO: Set up connection status tracking
    // TODO: Initialize metrics counters
  }

  attachToHandler(handler: EventStreamHandler): void {
    // TODO: Set up event listeners on the handler
    // TODO: Listen for 'connecting', 'connected', 'disconnected', 'error', 'message' events
    // TODO: Update internal state based on events
    // TODO: Start heartbeat monitoring if interval > 0
  }

  getConnectionStatus(): string {
    // TODO: Return current connection status
    return 'disconnected'; // Placeholder
  }

  getLastHeartbeat(): Date | undefined {
    // TODO: Return timestamp of last heartbeat
    return undefined; // Placeholder
  }

  getMetrics(): HealthMetrics {
    // TODO: Return comprehensive health metrics
    // TODO: Calculate error rate, uptime, etc.
    return {
      connectionStatus: 'disconnected',
      errorRate: 0,
      uptime: 0
    }; // Placeholder
  }

  getHealthRecommendations(): string[] {
    // TODO: Analyze metrics and provide recommendations
    // TODO: Check error rate, latency, heartbeat freshness
    // TODO: Return array of recommendation strings
    return []; // Placeholder
  }

  recordEvent(event: string): void {
    // TODO: Record event in internal log
    // TODO: Update counters based on event type
    // TODO: Maintain rolling log of recent events
  }
}

// TODO: Implement EventStreamHandler class
export class EventStreamHandler extends EventEmitter {
  // TODO: Add private properties for EventSource, configuration, timers, etc.

  constructor(url: string, options: EventStreamOptions = {}) {
    super();
    // TODO: Store URL and merge options with defaults
    // TODO: Initialize maps for filters, throttling
    // TODO: Set up fallback polling flag
  }

  async connect(): Promise<void> {
    // TODO: Check if EventSource is supported
    // TODO: If not supported and fallbackToPolling enabled, start polling
    // TODO: Create EventSource with proper configuration
    // TODO: Set up event handlers (onopen, onmessage, onerror)
    // TODO: Set up custom event type listeners
    // TODO: Emit appropriate events
    throw new Error('Not implemented');
  }

  disconnect(): void {
    // TODO: Clear timers
    // TODO: Close EventSource
    // TODO: Stop polling if in fallback mode
    // TODO: Emit disconnected event
  }

  isConnected(): boolean {
    // TODO: Check EventSource readyState or polling status
    return false; // Placeholder
  }

  addFilter(eventType: string, filter: (data: any) => boolean): void {
    // TODO: Store filter function for event type
  }

  removeFilter(eventType: string): void {
    // TODO: Remove filter for event type
  }

  getReconnectAttempts(): number {
    // TODO: Return current reconnection attempt count
    return 0; // Placeholder
  }

  isFallbackMode(): boolean {
    // TODO: Return whether currently using polling fallback
    return false; // Placeholder
  }

  // TODO: Add private helper methods:
  // - setupCustomEventListeners(): void
  // - handleMessage(eventType: string, data: string, eventId?: string): void
  // - shouldThrottleEvent(eventType: string): boolean
  // - handleReconnection(): void
  // - calculateReconnectDelay(): number
  // - startPolling(): void
  // - clearReconnectTimer(): void
  // - clearPollingTimer(): void
}

// TODO: Implement NotificationCenter class
export class NotificationCenter {
  // TODO: Add private properties for notifications array and options
  
  constructor(options: NotificationOptions = {}) {
    // TODO: Initialize with default options
    // TODO: Set up storage key
    // TODO: Load from storage if persistence enabled
  }

  addNotification(notificationData: Omit<Notification, 'id' | 'timestamp'>): void {
    // TODO: Create notification with ID and timestamp
    // TODO: Add to notifications array (at beginning)
    // TODO: Limit array size to maxNotifications
    // TODO: Set up auto-dismiss timer if configured
    // TODO: Save to storage if persistence enabled
  }

  dismissNotification(id: string): void {
    // TODO: Remove notification from array
    // TODO: Save to storage if persistence enabled
  }

  markAsRead(id: string): void {
    // TODO: Find notification and mark as read
    // TODO: Save to storage if persistence enabled
  }

  getNotifications(): Notification[] {
    // TODO: Return copy of notifications array
    return []; // Placeholder
  }

  getNotificationsByType(type: string): Notification[] {
    // TODO: Filter notifications by type
    return []; // Placeholder
  }

  clearAll(): void {
    // TODO: Clear all notifications
    // TODO: Save to storage if persistence enabled
  }

  getUnreadCount(): number {
    // TODO: Count unread notifications
    return 0; // Placeholder
  }

  // TODO: Add private helper methods:
  // - generateId(): string
  // - loadFromStorage(): void
  // - saveToStorage(): void
}

// TODO: Create SSE Context
const SSEContext = createContext<SSEContextValue | null>(null);

// TODO: Implement SSEProvider component
export const SSEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // TODO: Create refs for handlers and subscribers
  // TODO: Implement subscribe function
  // TODO: Implement getConnectionState function
  // TODO: Implement getHealthMetrics function
  // TODO: Set up cleanup on unmount

  const value: SSEContextValue = {
    handlers: new Map(), // TODO: Replace with actual implementation
    subscribe: () => () => {}, // TODO: Implement
    getConnectionState: () => 'disconnected', // TODO: Implement
    getHealthMetrics: () => null // TODO: Implement
  };

  return (
    <SSEContext.Provider value={value}>
      {children}
    </SSEContext.Provider>
  );
};

// TODO: Implement useServerSentEvents hook
export const useServerSentEvents = (url: string, options?: EventStreamOptions): ServerSentEventsState => {
  // TODO: Set up state for connection, events, history
  // TODO: Create EventStreamHandler on mount
  // TODO: Set up event listeners
  // TODO: Implement subscribe/unsubscribe functions
  // TODO: Implement reconnect function
  // TODO: Handle cleanup on unmount

  return {
    connectionState: 'disconnected', // TODO: Implement
    lastEvent: null, // TODO: Implement
    eventHistory: [], // TODO: Implement
    subscribe: () => () => {}, // TODO: Implement
    unsubscribe: () => {}, // TODO: Implement
    reconnect: () => {} // TODO: Implement
  };
};

// TODO: Implement useNotifications hook
export const useNotifications = (): NotificationsState => {
  // TODO: Create NotificationCenter instance
  // TODO: Set up state for notifications and unread count
  // TODO: Set up periodic state updates
  // TODO: Implement notification management functions

  return {
    notifications: [], // TODO: Implement
    unreadCount: 0, // TODO: Implement
    addNotification: () => {}, // TODO: Implement
    dismissNotification: () => {}, // TODO: Implement
    markAsRead: () => {}, // TODO: Implement
    clearAll: () => {}, // TODO: Implement
    getNotificationsByType: () => [] // TODO: Implement
  };
};

// TODO: Implement NotificationItem component
export const NotificationItem: React.FC<{
  notification: Notification;
  onDismiss: () => void;
  onMarkAsRead: () => void;
}> = ({ notification, onDismiss, onMarkAsRead }) => {
  // TODO: Implement notification rendering
  // TODO: Add type-based styling
  // TODO: Handle action buttons
  // TODO: Show read/unread state

  return (
    <div style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <strong>{notification.title}</strong>
          <p style={{ margin: '4px 0 0 0' }}>{notification.message}</p>
          {/* TODO: Implement action buttons */}
        </div>
        
        <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
          {/* TODO: Implement Mark Read and Dismiss buttons */}
          <button onClick={onDismiss}>×</button>
        </div>
      </div>
    </div>
  );
};

// TODO: Implement NotificationCenter component
export const NotificationCenter: React.FC = () => {
  // TODO: Use useNotifications hook
  // TODO: Set up filtering state
  // TODO: Implement filtered notifications
  // TODO: Render header with unread count
  // TODO: Render filter dropdown
  // TODO: Render notification list

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
          {/* TODO: Add unread count badge */}
        </h3>
        
        <button style={{ padding: '4px 8px', fontSize: '12px' }}>
          Clear All
        </button>
      </div>

      <div style={{ padding: '8px' }}>
        {/* TODO: Add filter dropdown */}
        <select style={{ width: '100%', padding: '4px', marginBottom: '8px' }}>
          <option value="all">All Notifications</option>
          <option value="info">Info</option>
          <option value="warning">Warnings</option>
          <option value="error">Errors</option>
          <option value="success">Success</option>
        </select>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0 8px 8px' }}>
        {/* TODO: Render filtered notifications or empty state */}
        <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
          No notifications
        </p>
      </div>
    </div>
  );
};

// Demo Component
export const SSEDemo: React.FC = () => {
  // TODO: Use useServerSentEvents and useNotifications hooks
  // TODO: Set up event subscription for notifications
  // TODO: Add test notification button

  return (
    <SSEProvider>
      <div style={{ padding: '20px' }}>
        <h1>Server-Sent Events Exercise</h1>
        <p>Complete the TODOs above to implement a comprehensive SSE system with notifications.</p>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h3>Connection Status: disconnected {/* TODO: Use actual state */}</h3>
            <p>Last Event: None {/* TODO: Display last event */}</p>
            <p>Event Count: 0 {/* TODO: Display event history length */}</p>
            
            <button
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

        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h4>Exercise Requirements:</h4>
          <ul>
            <li>✅ Implement EventStreamHandler with SSE and fallback polling</li>
            <li>✅ Implement NotificationCenter with persistence</li>
            <li>✅ Implement HealthMonitor for connection tracking</li>
            <li>✅ Create SSEProvider context</li>
            <li>✅ Implement useServerSentEvents hook</li>
            <li>✅ Implement useNotifications hook</li>
            <li>✅ Complete NotificationItem and NotificationCenter components</li>
          </ul>

          <h4>Key Features to Implement:</h4>
          <ul>
            <li><strong>Event Filtering:</strong> Filter events by type before processing</li>
            <li><strong>Auto-reconnection:</strong> Exponential backoff on connection loss</li>
            <li><strong>Graceful Degradation:</strong> Fallback to polling when SSE unavailable</li>
            <li><strong>Health Monitoring:</strong> Track connection health and provide recommendations</li>
            <li><strong>Throttling:</strong> Prevent high-frequency event flooding</li>
          </ul>
        </div>
      </div>
    </SSEProvider>
  );
};

export default SSEDemo;