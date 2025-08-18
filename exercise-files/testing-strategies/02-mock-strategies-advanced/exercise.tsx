import React, { useState, useEffect, useRef } from 'react';

// =============================================================================
// EXERCISE: Advanced Mock Strategies
// =============================================================================
// Learn sophisticated mocking patterns used by Staff Frontend Engineers
// Focus: Module mocking, API mocking, timer mocking, partial mocking
// Tools: Jest mocks, MSW (Mock Service Worker), jest-mock-extended
//
// Complete all TODO sections to build comprehensive mocking knowledge
// =============================================================================

// =============================================================================
// API CLIENT - External Service Dependencies
// =============================================================================

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  apiKey: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
}

export class APIClient {
  private config: ApiClientConfig;
  private requestInterceptors: Array<(config: any) => any> = [];
  private responseInterceptors: Array<(response: any) => any> = [];

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  // TODO: Implement HTTP methods that need sophisticated mocking
  async get<T>(endpoint: string, options?: any): Promise<ApiResponse<T>> {
    // TODO: Implement GET request with interceptors
    // TODO: Handle authentication headers
    // TODO: Process request through interceptors
    // TODO: Handle timeout logic
    // TODO: Return properly formatted response
    throw new Error('Not implemented');
  }

  async post<T>(endpoint: string, data: any, options?: any): Promise<ApiResponse<T>> {
    // TODO: Implement POST request with data
    // TODO: Handle different content types
    // TODO: Apply request interceptors
    // TODO: Handle response processing
    throw new Error('Not implemented');
  }

  async put<T>(endpoint: string, data: any, options?: any): Promise<ApiResponse<T>> {
    // TODO: Implement PUT request for updates
    throw new Error('Not implemented');
  }

  async delete<T>(endpoint: string, options?: any): Promise<ApiResponse<T>> {
    // TODO: Implement DELETE request
    throw new Error('Not implemented');
  }

  // TODO: Implement interceptor management
  addRequestInterceptor(interceptor: (config: any) => any) {
    // TODO: Add request interceptor to chain
  }

  addResponseInterceptor(interceptor: (response: any) => any) {
    // TODO: Add response interceptor to chain
  }

  // TODO: Implement retry logic for failed requests
  private async retryRequest<T>(
    method: string, 
    endpoint: string, 
    data?: any, 
    options?: any,
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    // TODO: Implement exponential backoff retry logic
    // TODO: Handle different retry strategies based on error type
    throw new Error('Not implemented');
  }
}

// =============================================================================
// WEBSOCKET MANAGER - Real-time Connection Dependencies
// =============================================================================

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  id: string;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private messageHandlers: Map<string, Array<(message: WebSocketMessage) => void>> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  // TODO: Implement WebSocket connection management
  connect(): Promise<void> {
    // TODO: Create WebSocket connection
    // TODO: Set up event listeners
    // TODO: Handle connection success/failure
    // TODO: Implement heartbeat mechanism
    return Promise.reject(new Error('Not implemented'));
  }

  disconnect(): void {
    // TODO: Clean up WebSocket connection
    // TODO: Clear timers and handlers
    // TODO: Update connection state
  }

  // TODO: Implement message sending with queuing
  send(message: WebSocketMessage): Promise<void> {
    // TODO: Queue messages if not connected
    // TODO: Implement message acknowledgment
    // TODO: Handle send failures
    return Promise.reject(new Error('Not implemented'));
  }

  // TODO: Implement message handler registration
  on(messageType: string, handler: (message: WebSocketMessage) => void): void {
    // TODO: Register message handler for specific type
    // TODO: Support multiple handlers per message type
  }

  off(messageType: string, handler: (message: WebSocketMessage) => void): void {
    // TODO: Remove specific message handler
  }

  // TODO: Implement automatic reconnection logic
  private reconnect(): void {
    // TODO: Implement exponential backoff reconnection
    // TODO: Respect max reconnect attempts
    // TODO: Emit reconnection events
  }

  // TODO: Implement connection health monitoring
  private startHeartbeat(): void {
    // TODO: Send periodic ping messages
    // TODO: Monitor pong responses
    // TODO: Trigger reconnection on missed heartbeats
  }
}

// =============================================================================
// DEMO COMPONENT FOR TESTING
// =============================================================================

export const MockStrategiesDemo: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('api');

  return (
    <div data-testid="mock-strategies-demo">
      <nav data-testid="demo-navigation">
        <button 
          onClick={() => setCurrentView('api')}
          data-testid="nav-api"
          aria-pressed={currentView === 'api'}
        >
          API Client
        </button>
        <button 
          onClick={() => setCurrentView('websocket')}
          data-testid="nav-websocket"
          aria-pressed={currentView === 'websocket'}
        >
          WebSocket
        </button>
      </nav>

      <main>
        {currentView === 'api' && <div>API Demo Placeholder</div>}
        {currentView === 'websocket' && <div>WebSocket Demo Placeholder</div>}
      </main>
    </div>
  );
};

export default MockStrategiesDemo;