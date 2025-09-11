import React, { useState, useEffect } from 'react';
import type { ReactElement } from 'react';

// === TYPES AND INTERFACES ===

interface WorkerRequest extends Request {
  cf?: {
    country: string;
    region: string;
    city: string;
    timezone: string;
    longitude: string;
    latitude: string;
  };
}

interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<any>;
  put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: KVPutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<KVListResult>;
}

interface KVPutOptions {
  expirationTtl?: number;
  expiration?: number;
  metadata?: any;
}

interface KVListResult {
  keys: Array<{ name: string; expiration?: number; metadata?: any }>;
  list_complete: boolean;
  cursor?: string;
}

interface DurableObjectNamespace {
  get(id: DurableObjectId): DurableObjectStub;
  idFromName(name: string): DurableObjectId;
  idFromString(id: string): DurableObjectId;
  newUniqueId(): DurableObjectId;
}

interface DurableObjectId {
  toString(): string;
  equals(other: DurableObjectId): boolean;
}

interface DurableObjectStub {
  fetch(request: Request): Promise<Response>;
}

interface DurableObjectState {
  storage: DurableObjectStorage;
  waitUntil(promise: Promise<any>): void;
}

interface DurableObjectStorage {
  get(key: string): Promise<any>;
  put(key: string, value: any): Promise<void>;
  delete(key: string): Promise<boolean>;
  list(options?: { start?: string; end?: string; prefix?: string; reverse?: boolean; limit?: number }): Promise<Map<string, any>>;
}

interface Env {
  CHAT_STORAGE: KVNamespace;
  USER_SESSIONS: KVNamespace;
  ANALYTICS: KVNamespace;
  CHAT_ROOMS: DurableObjectNamespace;
  USER_PRESENCE: DurableObjectNamespace;
}

// === WORKER HANDLER CLASS ===

export class WorkerHandler {
  private env: Env;
  private kvStorage: KVStorage;
  private routes: Map<string, (request: WorkerRequest) => Promise<Response>> = new Map();

  constructor(env: Env) {
    this.env = env;
    this.kvStorage = new KVStorage(env);
    this.setupRoutes();
  }

  async fetch(request: WorkerRequest): Promise<Response> {
    try {
      const url = new URL(request.url);
      const route = this.matchRoute(url.pathname, request.method);
      
      if (route) {
        return await route(request);
      }
      
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      return this.handleError(error as Error, request);
    }
  }

  private setupRoutes(): void {
    // API Routes
    this.routes.set('GET:/api/chat/rooms', this.getChatRooms.bind(this));
    this.routes.set('POST:/api/chat/rooms', this.createChatRoom.bind(this));
    this.routes.set('GET:/api/chat/rooms/:id/messages', this.getRoomMessages.bind(this));
    this.routes.set('POST:/api/chat/rooms/:id/messages', this.sendMessage.bind(this));
    
    // WebSocket Routes
    this.routes.set('GET:/api/chat/rooms/:id/ws', this.handleWebSocket.bind(this));
    
    // Analytics Routes
    this.routes.set('POST:/api/analytics/track', this.trackEvent.bind(this));
    this.routes.set('GET:/api/analytics/dashboard', this.getAnalytics.bind(this));
    
    // Session Routes
    this.routes.set('POST:/api/auth/session', this.createSession.bind(this));
    this.routes.set('DELETE:/api/auth/session', this.destroySession.bind(this));
    
    // Health Check
    this.routes.set('GET:/health', this.healthCheck.bind(this));
  }

  private matchRoute(path: string, method: string): ((request: WorkerRequest) => Promise<Response>) | null {
    const routeKey = `${method}:${path}`;
    
    // Exact match first
    if (this.routes.has(routeKey)) {
      return this.routes.get(routeKey)!;
    }
    
    // Pattern matching for dynamic routes
    for (const [pattern, handler] of this.routes.entries()) {
      const [routeMethod, routePath] = pattern.split(':');
      if (routeMethod !== method) continue;
      
      const regex = this.pathToRegex(routePath);
      if (regex.test(path)) {
        return handler;
      }
    }
    
    return null;
  }

  private pathToRegex(path: string): RegExp {
    const escaped = path.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const pattern = escaped.replace(/:([^/]+)/g, '([^/]+)');
    return new RegExp(`^${pattern}$`);
  }

  // Route Handlers
  private async getChatRooms(request: WorkerRequest): Promise<Response> {
    try {
      const rooms = await this.kvStorage.list('chat:rooms:', { type: 'json' });
      return new Response(JSON.stringify(rooms), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch rooms' }), { status: 500 });
    }
  }

  private async createChatRoom(request: WorkerRequest): Promise<Response> {
    try {
      const body = await request.json() as { name: string; description?: string };
      const roomId = crypto.randomUUID();
      const room = {
        id: roomId,
        name: body.name,
        description: body.description || '',
        createdAt: Date.now(),
        memberCount: 0
      };
      
      await this.kvStorage.put(`chat:rooms:${roomId}`, room, { ttl: 86400 * 30 }); // 30 days
      
      return new Response(JSON.stringify(room), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to create room' }), { status: 500 });
    }
  }

  private async getRoomMessages(request: WorkerRequest): Promise<Response> {
    const url = new URL(request.url);
    const roomId = this.extractPathParam(url.pathname, '/api/chat/rooms/:id/messages', 'id');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const cursor = url.searchParams.get('cursor');
    
    try {
      const messages = await this.kvStorage.list(`chat:messages:${roomId}:`, { 
        type: 'json', 
        limit,
        cursor 
      });
      
      return new Response(JSON.stringify(messages), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), { status: 500 });
    }
  }

  private async sendMessage(request: WorkerRequest): Promise<Response> {
    const url = new URL(request.url);
    const roomId = this.extractPathParam(url.pathname, '/api/chat/rooms/:id/messages', 'id');
    
    try {
      const body = await request.json() as { content: string; userId: string; username: string };
      const messageId = crypto.randomUUID();
      const message = {
        id: messageId,
        roomId,
        content: body.content,
        userId: body.userId,
        username: body.username,
        timestamp: Date.now()
      };
      
      // Store message
      await this.kvStorage.put(`chat:messages:${roomId}:${messageId}`, message, { ttl: 86400 * 7 }); // 7 days
      
      // Broadcast to room via Durable Object
      const roomStub = this.env.CHAT_ROOMS.idFromName(roomId);
      const durableRoom = this.env.CHAT_ROOMS.get(roomStub);
      await durableRoom.fetch(new Request('https://room/broadcast', {
        method: 'POST',
        body: JSON.stringify(message)
      }));
      
      return new Response(JSON.stringify(message), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to send message' }), { status: 500 });
    }
  }

  private async handleWebSocket(request: WorkerRequest): Promise<Response> {
    const url = new URL(request.url);
    const roomId = this.extractPathParam(url.pathname, '/api/chat/rooms/:id/ws', 'id');
    
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }
    
    // Forward to Durable Object
    const roomStub = this.env.CHAT_ROOMS.idFromName(roomId);
    const durableRoom = this.env.CHAT_ROOMS.get(roomStub);
    return durableRoom.fetch(request);
  }

  private async trackEvent(request: WorkerRequest): Promise<Response> {
    try {
      const body = await request.json() as { event: string; properties: Record<string, any> };
      const eventId = crypto.randomUUID();
      const event = {
        id: eventId,
        event: body.event,
        properties: body.properties,
        timestamp: Date.now(),
        country: request.cf?.country || 'unknown'
      };
      
      // Store event
      await this.kvStorage.put(`analytics:events:${Date.now()}:${eventId}`, event, { ttl: 86400 * 90 }); // 90 days
      
      // Process with stream processor
      const processor = new StreamProcessor();
      await processor.processEvent(event);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to track event' }), { status: 500 });
    }
  }

  private async getAnalytics(request: WorkerRequest): Promise<Response> {
    try {
      const analytics = await this.kvStorage.list('analytics:aggregated:', { type: 'json' });
      return new Response(JSON.stringify(analytics), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch analytics' }), { status: 500 });
    }
  }

  private async createSession(request: WorkerRequest): Promise<Response> {
    try {
      const body = await request.json() as { userId: string; username: string };
      const sessionId = crypto.randomUUID();
      const session = {
        id: sessionId,
        userId: body.userId,
        username: body.username,
        createdAt: Date.now(),
        lastActive: Date.now(),
        country: request.cf?.country || 'unknown'
      };
      
      await this.kvStorage.put(`sessions:${sessionId}`, session, { ttl: 86400 }); // 24 hours
      
      return new Response(JSON.stringify({ sessionId }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to create session' }), { status: 500 });
    }
  }

  private async destroySession(request: WorkerRequest): Promise<Response> {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID required' }), { status: 400 });
    }
    
    try {
      await this.kvStorage.delete(`sessions:${sessionId}`);
      return new Response(JSON.stringify({ success: true }));
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to destroy session' }), { status: 500 });
    }
  }

  private async healthCheck(request: WorkerRequest): Promise<Response> {
    return new Response(JSON.stringify({ 
      status: 'healthy', 
      timestamp: Date.now(),
      region: request.cf?.region || 'unknown'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private extractPathParam(path: string, pattern: string, paramName: string): string {
    const pathParts = path.split('/');
    const patternParts = pattern.split('/');
    
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === `:${paramName}`) {
        return pathParts[i];
      }
    }
    
    return '';
  }

  private async handleError(error: Error, request: WorkerRequest): Promise<Response> {
    console.error('Worker error:', error);
    
    // Log error for monitoring
    await this.kvStorage.put(`errors:${Date.now()}:${crypto.randomUUID()}`, {
      message: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      timestamp: Date.now()
    }, { ttl: 86400 * 7 }); // 7 days
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      requestId: crypto.randomUUID()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// === KV STORAGE CLASS ===

export class KVStorage {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async get(key: string, options: { type?: 'text' | 'json'; namespace?: keyof Env } = {}): Promise<any> {
    const namespace = this.getNamespace(options.namespace || 'CHAT_STORAGE');
    const value = await namespace.get(key, { type: options.type || 'text' });
    
    if (options.type === 'json' && value) {
      return JSON.parse(value);
    }
    
    return value;
  }

  async put(key: string, value: any, options: { ttl?: number; namespace?: keyof Env } = {}): Promise<void> {
    const namespace = this.getNamespace(options.namespace || 'CHAT_STORAGE');
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    const putOptions: KVPutOptions = {};
    if (options.ttl) {
      putOptions.expirationTtl = options.ttl;
    }
    
    await namespace.put(key, stringValue, putOptions);
  }

  async delete(key: string, options: { namespace?: keyof Env } = {}): Promise<void> {
    const namespace = this.getNamespace(options.namespace || 'CHAT_STORAGE');
    await namespace.delete(key);
  }

  async list(prefix: string, options: { type?: 'json'; limit?: number; cursor?: string; namespace?: keyof Env } = {}): Promise<any[]> {
    const namespace = this.getNamespace(options.namespace || 'CHAT_STORAGE');
    const result = await namespace.list({
      prefix,
      limit: options.limit || 50,
      cursor: options.cursor
    });
    
    const items: any[] = [];
    
    for (const key of result.keys) {
      const value = await namespace.get(key.name, { type: options.type || 'text' });
      items.push(options.type === 'json' ? JSON.parse(value) : value);
    }
    
    return items;
  }

  async batch(operations: Array<{ 
    type: 'put' | 'delete'; 
    key: string; 
    value?: any; 
    ttl?: number; 
    namespace?: keyof Env 
  }>): Promise<void> {
    const promises = operations.map(op => {
      if (op.type === 'put') {
        return this.put(op.key, op.value, { ttl: op.ttl, namespace: op.namespace });
      } else {
        return this.delete(op.key, { namespace: op.namespace });
      }
    });
    
    await Promise.all(promises);
  }

  private getNamespace(name: keyof Env): KVNamespace {
    return this.env[name] as KVNamespace;
  }
}

// === DURABLE OBJECTS ===

export class ChatRoom {
  private state: DurableObjectState;
  private env: Env;
  private connections: Map<string, WebSocket> = new Map();
  private users: Map<string, { id: string; username: string; joinedAt: number }> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/websocket') {
      return this.handleWebSocketUpgrade(request);
    } else if (url.pathname === '/broadcast') {
      return this.handleBroadcast(request);
    } else if (url.pathname === '/users') {
      return this.handleGetUsers(request);
    }
    
    return new Response('Not found', { status: 404 });
  }

  private async handleWebSocketUpgrade(request: Request): Response {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 400 });
    }
    
    const { 0: client, 1: server } = new WebSocketPair();
    const connectionId = crypto.randomUUID();
    
    server.accept();
    this.connections.set(connectionId, server);
    
    server.addEventListener('message', (event) => {
      this.handleWebSocketMessage(connectionId, event.data as string);
    });
    
    server.addEventListener('close', () => {
      this.handleWebSocketClose(connectionId);
    });
    
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  private async handleWebSocketMessage(connectionId: string, message: string): Promise<void> {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join':
          await this.handleUserJoin(connectionId, data);
          break;
        case 'leave':
          await this.handleUserLeave(connectionId);
          break;
        case 'typing':
          await this.handleTyping(connectionId, data);
          break;
        case 'message':
          await this.handleMessage(connectionId, data);
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  }

  private async handleUserJoin(connectionId: string, data: { userId: string; username: string }): Promise<void> {
    this.users.set(connectionId, {
      id: data.userId,
      username: data.username,
      joinedAt: Date.now()
    });
    
    // Store user presence
    await this.state.storage.put(`user:${connectionId}`, {
      userId: data.userId,
      username: data.username,
      joinedAt: Date.now()
    });
    
    // Broadcast user joined
    this.broadcast({
      type: 'user_joined',
      user: { id: data.userId, username: data.username },
      timestamp: Date.now()
    }, connectionId);
    
    // Send current users to new connection
    const ws = this.connections.get(connectionId);
    if (ws) {
      ws.send(JSON.stringify({
        type: 'users_list',
        users: Array.from(this.users.values()),
        timestamp: Date.now()
      }));
    }
  }

  private async handleUserLeave(connectionId: string): Promise<void> {
    const user = this.users.get(connectionId);
    if (user) {
      this.users.delete(connectionId);
      await this.state.storage.delete(`user:${connectionId}`);
      
      this.broadcast({
        type: 'user_left',
        user: { id: user.id, username: user.username },
        timestamp: Date.now()
      }, connectionId);
    }
    
    this.connections.delete(connectionId);
  }

  private async handleTyping(connectionId: string, data: { isTyping: boolean }): Promise<void> {
    const user = this.users.get(connectionId);
    if (user) {
      this.broadcast({
        type: 'user_typing',
        user: { id: user.id, username: user.username },
        isTyping: data.isTyping,
        timestamp: Date.now()
      }, connectionId);
    }
  }

  private async handleMessage(connectionId: string, data: { content: string }): Promise<void> {
    const user = this.users.get(connectionId);
    if (user) {
      const message = {
        id: crypto.randomUUID(),
        content: data.content,
        userId: user.id,
        username: user.username,
        timestamp: Date.now()
      };
      
      // Store message in Durable Object storage for immediate consistency
      await this.state.storage.put(`message:${message.id}`, message);
      
      // Broadcast to all connections
      this.broadcast({
        type: 'new_message',
        message,
        timestamp: Date.now()
      });
    }
  }

  private async handleWebSocketClose(connectionId: string): Promise<void> {
    await this.handleUserLeave(connectionId);
  }

  private async handleBroadcast(request: Request): Promise<Response> {
    try {
      const message = await request.json();
      this.broadcast({
        type: 'new_message',
        message,
        timestamp: Date.now()
      });
      
      return new Response(JSON.stringify({ success: true }));
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to broadcast' }), { status: 500 });
    }
  }

  private async handleGetUsers(request: Request): Promise<Response> {
    return new Response(JSON.stringify({
      users: Array.from(this.users.values()),
      count: this.users.size
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private broadcast(data: any, exclude?: string): void {
    const message = JSON.stringify(data);
    
    for (const [connectionId, ws] of this.connections.entries()) {
      if (connectionId !== exclude && ws.readyState === WebSocket.READY_STATE_OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          console.error('Broadcast error:', error);
          this.connections.delete(connectionId);
        }
      }
    }
  }
}

// === STREAM PROCESSOR CLASS ===

export class StreamProcessor {
  private transformers: Map<string, (chunk: any) => any> = new Map();

  constructor() {
    this.setupDefaultTransformers();
  }

  async processEvent(event: any): Promise<void> {
    // Create a readable stream from the event
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(event);
        controller.close();
      }
    });

    // Process through transform pipeline
    const processed = await this.processStream(stream, [
      'validate',
      'enrich',
      'aggregate'
    ]);

    // Consume the processed stream
    const reader = processed.getReader();
    const results = [];
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        results.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    return results[0];
  }

  async processStream(input: ReadableStream, transformers: string[]): Promise<ReadableStream> {
    let stream = input;
    
    for (const transformerName of transformers) {
      const transformer = this.transformers.get(transformerName);
      if (transformer) {
        stream = stream.pipeThrough(new TransformStream({
          transform(chunk, controller) {
            try {
              const result = transformer(chunk);
              controller.enqueue(result);
            } catch (error) {
              console.error(`Transform error in ${transformerName}:`, error);
              controller.enqueue(chunk); // Pass through on error
            }
          }
        }));
      }
    }
    
    return stream;
  }

  private setupDefaultTransformers(): void {
    this.transformers.set('validate', (chunk: any) => {
      if (!chunk.event || !chunk.timestamp) {
        throw new Error('Invalid event format');
      }
      return chunk;
    });

    this.transformers.set('enrich', (chunk: any) => {
      return {
        ...chunk,
        processed: true,
        processingTime: Date.now(),
        enrichedData: {
          dayOfWeek: new Date(chunk.timestamp).getDay(),
          hour: new Date(chunk.timestamp).getHours()
        }
      };
    });

    this.transformers.set('aggregate', (chunk: any) => {
      // In a real implementation, this would update counters/aggregations
      return {
        ...chunk,
        aggregated: true
      };
    });
  }

  addTransformer(name: string, transformer: (chunk: any) => any): void {
    this.transformers.set(name, transformer);
  }
}

// === DEMO COMPONENT ===

export const DemoCloudflareWorkers: React.FC = () => {
  const [workerStatus, setWorkerStatus] = useState<string>('Initializing...');
  const [kvStats, setKvStats] = useState<{ stored: number; retrieved: number }>({ stored: 0, retrieved: 0 });
  const [chatRooms, setChatRooms] = useState<Array<{ id: string; name: string; members: number }>>([]);
  const [wsStatus, setWsStatus] = useState<string>('Disconnected');
  const [messages, setMessages] = useState<Array<{ id: string; content: string; username: string }>>([]);

  useEffect(() => {
    // Simulate worker initialization
    const initializeWorker = async () => {
      setWorkerStatus('Worker initialized on edge');
      
      // Mock KV operations
      setKvStats({ stored: 247, retrieved: 1523 });
      
      // Mock chat rooms
      setChatRooms([
        { id: '1', name: 'General', members: 12 },
        { id: '2', name: 'Tech Talk', members: 8 },
        { id: '3', name: 'Random', members: 5 }
      ]);
      
      // Simulate WebSocket connection
      setTimeout(() => {
        setWsStatus('Connected');
        setMessages([
          { id: '1', content: 'Welcome to the chat!', username: 'System' },
          { id: '2', content: 'Hello everyone!', username: 'Alice' },
          { id: '3', content: 'How is everyone doing?', username: 'Bob' }
        ]);
      }, 1000);
    };
    
    initializeWorker();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cloudflare Workers Integration Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Worker Status</h3>
          <p className="text-sm">{workerStatus}</p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold mb-2">KV Storage</h3>
          <div className="text-sm space-y-1">
            <p>Stored: {kvStats.stored}</p>
            <p>Retrieved: {kvStats.retrieved}</p>
          </div>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold mb-2">WebSocket Status</h3>
          <p className="text-sm">{wsStatus}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-white border rounded-lg">
          <h3 className="font-semibold mb-3">Chat Rooms (Durable Objects)</h3>
          <div className="space-y-2">
            {chatRooms.map(room => (
              <div key={room.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{room.name}</span>
                <span className="text-sm text-gray-600">{room.members} members</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 bg-white border rounded-lg">
          <h3 className="font-semibold mb-3">Live Messages (WebStreams)</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {messages.map(message => (
              <div key={message.id} className="text-sm">
                <span className="font-medium text-blue-600">{message.username}:</span>{' '}
                <span>{message.content}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Worker Features</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Request routing with dynamic parameters</li>
          <li>✅ KV storage for persistent data</li>
          <li>✅ Durable Objects for stateful processing</li>
          <li>✅ WebSocket connections for real-time features</li>
          <li>✅ Stream processing for analytics</li>
          <li>✅ Error handling and monitoring</li>
          <li>✅ Geographic distribution and edge deployment</li>
        </ul>
      </div>
    </div>
  );
};

export default DemoCloudflareWorkers;