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

// TODO: Implement ReconnectLogic class
// This class should handle exponential backoff for reconnection attempts
export class ReconnectLogic {
  // TODO: Add private properties for configuration
  
  constructor(options: ReconnectOptions = {}) {
    // TODO: Initialize configuration options with defaults
    // - initialDelay: 1000ms
    // - maxDelay: 30000ms  
    // - backoffMultiplier: 2
    // - jitter: true
  }

  getNextDelay(attemptCount: number): number {
    // TODO: Implement exponential backoff calculation
    // Formula: initialDelay * (backoffMultiplier ^ attemptCount)
    // Add jitter if enabled (±25% random variation)
    // Cap at maxDelay
    return 1000; // Placeholder
  }

  shouldRetry(attemptCount: number, maxAttempts: number): boolean {
    // TODO: Determine if another retry attempt should be made
    return false; // Placeholder
  }

  reset(): void {
    // TODO: Reset any internal state if needed
  }
}

// TODO: Implement MessageHandler class  
// This class should handle message queuing when disconnected
export class MessageHandler {
  // TODO: Add private properties for message queue and configuration

  constructor(options: MessageOptions = {}) {
    // TODO: Initialize with default options
    // - bufferSize: 1000
    // - enableQueue: true
    // - replayOnConnect: true
  }

  setConnection(connection: ConnectionManager): void {
    // TODO: Set the connection reference
    // TODO: Set up event listener for 'connected' event to replay messages
  }

  send(message: any): void {
    // TODO: If connected, send immediately
    // TODO: If disconnected and queue enabled, add to queue
    // TODO: Handle buffer overflow by removing oldest messages
  }

  getQueuedMessages(): any[] {
    // TODO: Return copy of queued messages
    return []; // Placeholder
  }

  clearQueue(): void {
    // TODO: Clear the message queue
  }

  // TODO: Add private helper methods:
  // - queueMessage(message: any): void
  // - replayQueuedMessages(): void
}

// TODO: Implement ConnectionManager class
// This class should manage WebSocket connections with auto-reconnection
export class ConnectionManager extends EventEmitter {
  // TODO: Add private properties for WebSocket, configuration, timers, etc.

  constructor(url: string, options: ConnectionOptions = {}) {
    super();
    // TODO: Store URL and merge options with defaults
    // TODO: Initialize ReconnectLogic instance
    // TODO: Initialize state tracking variables
  }

  async connect(): Promise<void> {
    // TODO: Check if already connecting or connected
    // TODO: Create new WebSocket instance
    // TODO: Set up event handlers (onopen, onmessage, onclose, onerror)
    // TODO: Handle connection timeout
    // TODO: Emit appropriate events ('connecting', 'connected', etc.)
    throw new Error('Not implemented');
  }

  disconnect(): void {
    // TODO: Clear any timers
    // TODO: Close WebSocket connection
    // TODO: Emit cleanup events
  }

  isConnected(): boolean {
    // TODO: Check if WebSocket is in OPEN state
    return false; // Placeholder
  }

  send(message: any): void {
    // TODO: Send message if connected
    // TODO: Throw error if not connected
  }

  getReconnectAttempts(): number {
    // TODO: Return current reconnection attempt count
    return 0; // Placeholder
  }

  // TODO: Add private helper methods:
  // - handleReconnection(): void
  // - clearReconnectTimer(): void
  // - clearConnectionTimer(): void
  // - cleanup(): void
}

// TODO: Create WebSocket Context
const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// TODO: Implement WebSocketProvider component
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // TODO: Create refs for connections and subscribers maps
  // TODO: Implement subscribe function that:
  //   - Gets or creates connection for URL
  //   - Adds subscriber to the appropriate set
  //   - Returns unsubscribe function
  // TODO: Implement send function
  // TODO: Implement getConnectionState function
  // TODO: Set up cleanup on unmount

  const value: WebSocketContextValue = {
    connections: new Map(), // TODO: Replace with actual implementation
    subscribe: () => () => {}, // TODO: Implement
    send: () => {}, // TODO: Implement  
    getConnectionState: () => 'disconnected' // TODO: Implement
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// TODO: Implement useWebSocket hook
export const useWebSocket = (url: string, options: UseWebSocketOptions = {}): WebSocketState => {
  // TODO: Use WebSocket context or throw error if not available
  // TODO: Set up state for connection, messages, history
  // TODO: Create connection on mount with proper cleanup
  // TODO: Handle message events and update state
  // TODO: Implement sendMessage, connect, disconnect functions

  return {
    connectionState: 'disconnected', // TODO: Implement
    lastMessage: null, // TODO: Implement
    messageHistory: [], // TODO: Implement
    sendMessage: () => {}, // TODO: Implement
    connect: () => {}, // TODO: Implement
    disconnect: () => {} // TODO: Implement
  };
};

// TODO: Implement ConnectionStatus component
export const ConnectionStatus: React.FC<{ url: string }> = ({ url }) => {
  // TODO: Get connection state from context
  // TODO: Set up polling to update state
  // TODO: Return status indicator with color and text

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div 
        style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: 'gray' // TODO: Use dynamic color based on state
        }} 
      />
      <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>
        disconnected {/* TODO: Use actual state */}
      </span>
    </div>
  );
};

// TODO: Implement ChatComponent example
export const ChatComponent: React.FC<{ url: string; userId: string }> = ({ url, userId }) => {
  // TODO: Set up state for messages and input
  // TODO: Subscribe to WebSocket messages
  // TODO: Implement message sending
  // TODO: Handle connection state for UI updates

  return (
    <div style={{ maxWidth: '400px', border: '1px solid #ccc', borderRadius: '8px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>Chat</h3>
        <ConnectionStatus url={url} />
      </div>
      
      <div style={{ height: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '8px', marginBottom: '16px' }}>
        {/* TODO: Render messages */}
        <p>No messages yet...</p>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Type a message..."
          style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          disabled // TODO: Enable when connected
        />
        <button 
          disabled // TODO: Enable when connected
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'not-allowed' // TODO: Update based on connection state
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

// Demo Component
export const WebSocketDemo: React.FC = () => {
  return (
    <WebSocketProvider>
      <div style={{ padding: '20px' }}>
        <h1>WebSocket Integration Exercise</h1>
        <p>Complete the TODOs above to implement a robust WebSocket communication system.</p>
        
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <ChatComponent url="ws://localhost:8080/chat" userId="user1" />
          <ChatComponent url="ws://localhost:8080/chat" userId="user2" />
        </div>
        
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h4>Exercise Requirements:</h4>
          <ul>
            <li>✅ Implement ReconnectLogic with exponential backoff</li>
            <li>✅ Implement MessageHandler with queuing and replay</li>
            <li>✅ Implement ConnectionManager with auto-reconnection</li>
            <li>✅ Create WebSocketProvider context</li>
            <li>✅ Implement useWebSocket hook</li>
            <li>✅ Complete ConnectionStatus and ChatComponent</li>
          </ul>
        </div>
      </div>
    </WebSocketProvider>
  );
};

export default WebSocketDemo;