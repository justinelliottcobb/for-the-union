import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Card, Text, Group, Stack, Badge, Progress, Alert, Tabs, TextInput, Select, Textarea, NumberInput, JsonInput, Code, ScrollArea, Divider, ActionIcon, Modal, Table } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlay, IconStop, IconRefresh, IconSettings, IconCheck, IconX, IconClock, IconActivity } from '@tabler/icons-react';

// ===== MCP PROTOCOL TYPES =====

interface MCPMessage {
  type: 'request' | 'response' | 'notification';
  id: string;
  method?: string;
  params?: any;
  result?: any;
  error?: MCPError;
  timestamp: number;
  correlation?: string;
}

interface MCPError {
  code: number;
  message: string;
  data?: any;
}

interface ToolDefinition {
  name: string;
  version: string;
  description: string;
  schema: JSONSchema;
  handler: ToolHandler;
  permissions: Permission[];
  metadata: ToolMetadata;
}

interface JSONSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

interface ToolHandler {
  execute: (params: any, context: CallContext) => Promise<ToolResult>;
  validate: (params: any) => ValidationResult;
}

interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

interface ToolMetadata {
  category: string;
  tags: string[];
  createdAt: string;
  lastModified: string;
  author: string;
  version: string;
}

interface CallContext {
  sessionId: string;
  userId: string;
  timestamp: number;
  permissions: Permission[];
  timeout: number;
}

interface ToolResult {
  callId: string;
  success: boolean;
  result: any;
  error?: ToolError;
  duration: number;
  resources: ResourceUsage;
  sideEffects: SideEffect[];
}

interface ToolError {
  type: string;
  message: string;
  code: string;
  recoverable: boolean;
}

interface ResourceUsage {
  memory: number;
  cpu: number;
  network: number;
  storage: number;
}

interface SideEffect {
  type: string;
  description: string;
  reversible: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ContextState {
  sessionId: string;
  conversationHistory: Message[];
  toolState: Map<string, any>;
  globalContext: GlobalContext;
  userPreferences: UserPreferences;
  permissionContext: PermissionContext;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface GlobalContext {
  variables: Map<string, any>;
  settings: Record<string, any>;
  environmentInfo: Record<string, any>;
}

interface UserPreferences {
  theme: string;
  language: string;
  notifications: boolean;
  autoSave: boolean;
}

interface PermissionContext {
  role: string;
  permissions: Permission[];
  restrictions: string[];
}

interface ToolCall {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  context: CallContext;
  timeout: number;
  retries: number;
  priority: 'low' | 'normal' | 'high';
}

interface ConnectionConfig {
  url: string;
  protocol: 'websocket' | 'http';
  authentication: AuthConfig;
  reconnection: ReconnectionConfig;
  heartbeat: HeartbeatConfig;
}

interface AuthConfig {
  type: 'apikey' | 'oauth' | 'jwt';
  credentials: Record<string, string>;
  refreshToken?: string;
}

interface ReconnectionConfig {
  enabled: boolean;
  maxAttempts: number;
  backoffStrategy: 'exponential' | 'linear';
  baseDelay: number;
  maxDelay: number;
}

interface HeartbeatConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  failureThreshold: number;
}

interface ProtocolStats {
  messagesProcessed: number;
  errors: number;
  avgLatency: number;
  uptime: number;
  reconnections: number;
}

// ===== MCP CLIENT IMPLEMENTATION =====

interface MCPClientState {
  connected: boolean;
  connecting: boolean;
  lastError?: string;
  stats: ProtocolStats;
  messageQueue: MCPMessage[];
}

const useMCPClient = (config: ConnectionConfig) => {
  const [state, setState] = useState<MCPClientState>({
    connected: false,
    connecting: false,
    stats: {
      messagesProcessed: 0,
      errors: 0,
      avgLatency: 0,
      uptime: 0,
      reconnections: 0
    },
    messageQueue: []
  });

  const [messages, setMessages] = useState<MCPMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const messageCallbacks = useRef<Map<string, (response: MCPMessage) => void>>(new Map());

  const generateMessageId = useCallback(() => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const startHeartbeat = useCallback(() => {
    if (config.heartbeat?.enabled && wsRef.current?.readyState === WebSocket.OPEN) {
      heartbeatIntervalRef.current = setInterval(() => {
        const heartbeatMessage: MCPMessage = {
          type: 'notification',
          id: generateMessageId(),
          method: 'heartbeat',
          timestamp: Date.now()
        };
        wsRef.current?.send(JSON.stringify(heartbeatMessage));
      }, config.heartbeat.interval);
    }
  }, [config.heartbeat, generateMessageId]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = undefined;
    }
  }, []);

  const connect = useCallback(async () => {
    if (state.connecting || state.connected) return;

    setState(prev => ({ ...prev, connecting: true, lastError: undefined }));

    try {
      const ws = new WebSocket(config.url);
      
      ws.onopen = () => {
        setState(prev => ({ 
          ...prev, 
          connected: true, 
          connecting: false,
          stats: { ...prev.stats, uptime: Date.now() }
        }));
        wsRef.current = ws;
        startHeartbeat();
        notifications.show({
          title: 'MCP Connection Established',
          message: 'Successfully connected to MCP server',
          color: 'green',
          icon: <IconCheck size={16} />
        });
      };

      ws.onmessage = (event) => {
        try {
          const message: MCPMessage = JSON.parse(event.data);
          setMessages(prev => [...prev, message]);
          
          setState(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              messagesProcessed: prev.stats.messagesProcessed + 1
            }
          }));

          if (message.type === 'response' && message.correlation) {
            const callback = messageCallbacks.current.get(message.correlation);
            if (callback) {
              callback(message);
              messageCallbacks.current.delete(message.correlation);
            }
          }
        } catch (error) {
          console.error('Failed to parse MCP message:', error);
          setState(prev => ({
            ...prev,
            stats: { ...prev.stats, errors: prev.stats.errors + 1 }
          }));
        }
      };

      ws.onclose = () => {
        setState(prev => ({ 
          ...prev, 
          connected: false, 
          connecting: false 
        }));
        stopHeartbeat();
        wsRef.current = null;
        
        if (config.reconnection?.enabled) {
          attemptReconnection();
        }
      };

      ws.onerror = (error) => {
        setState(prev => ({ 
          ...prev, 
          lastError: 'Connection failed',
          connecting: false,
          stats: { ...prev.stats, errors: prev.stats.errors + 1 }
        }));
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        connecting: false, 
        lastError: error instanceof Error ? error.message : 'Unknown error' 
      }));
    }
  }, [state.connecting, state.connected, config, startHeartbeat, stopHeartbeat]);

  const attemptReconnection = useCallback(() => {
    if (!config.reconnection?.enabled) return;

    const delay = Math.min(
      config.reconnection.baseDelay * Math.pow(2, state.stats.reconnections),
      config.reconnection.maxDelay
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        stats: { ...prev.stats, reconnections: prev.stats.reconnections + 1 }
      }));
      connect();
    }, delay);
  }, [config.reconnection, state.stats.reconnections, connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    stopHeartbeat();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState(prev => ({ ...prev, connected: false, connecting: false }));
  }, [stopHeartbeat]);

  const sendMessage = useCallback(async (message: Omit<MCPMessage, 'id' | 'timestamp'>): Promise<MCPMessage | undefined> => {
    if (!state.connected || !wsRef.current) {
      throw new Error('Not connected to MCP server');
    }

    const fullMessage: MCPMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      if (message.type === 'request') {
        messageCallbacks.current.set(fullMessage.id, (response) => {
          resolve(response);
        });

        setTimeout(() => {
          messageCallbacks.current.delete(fullMessage.id);
          reject(new Error('Request timeout'));
        }, 30000);
      }

      wsRef.current!.send(JSON.stringify(fullMessage));
      setMessages(prev => [...prev, fullMessage]);

      if (message.type !== 'request') {
        resolve(undefined);
      }
    });
  }, [state.connected, generateMessageId]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    messages,
    connect,
    disconnect,
    sendMessage,
    clearMessages: () => setMessages([])
  };
};

// ===== TOOL REGISTRY IMPLEMENTATION =====

const useToolRegistry = () => {
  const [tools, setTools] = useState<Map<string, ToolDefinition>>(new Map());
  const [categories, setCategories] = useState<string[]>(['general', 'data', 'ai', 'system']);

  const registerTool = useCallback((tool: ToolDefinition) => {
    const validationResult = validateToolDefinition(tool);
    if (!validationResult.valid) {
      throw new Error(`Invalid tool definition: ${validationResult.errors.join(', ')}`);
    }

    setTools(prev => new Map(prev.set(tool.name, tool)));
    
    if (!categories.includes(tool.metadata.category)) {
      setCategories(prev => [...prev, tool.metadata.category]);
    }

    notifications.show({
      title: 'Tool Registered',
      message: `Tool "${tool.name}" registered successfully`,
      color: 'green'
    });
  }, [categories]);

  const unregisterTool = useCallback((toolName: string) => {
    setTools(prev => {
      const newMap = new Map(prev);
      newMap.delete(toolName);
      return newMap;
    });
  }, []);

  const getTool = useCallback((toolName: string): ToolDefinition | undefined => {
    return tools.get(toolName);
  }, [tools]);

  const searchTools = useCallback((query: string, category?: string): ToolDefinition[] => {
    const results: ToolDefinition[] = [];
    
    for (const tool of tools.values()) {
      if (category && tool.metadata.category !== category) continue;
      
      if (
        tool.name.toLowerCase().includes(query.toLowerCase()) ||
        tool.description.toLowerCase().includes(query.toLowerCase()) ||
        tool.metadata.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      ) {
        results.push(tool);
      }
    }
    
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }, [tools]);

  const validateToolDefinition = useCallback((tool: ToolDefinition): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!tool.name || typeof tool.name !== 'string') {
      errors.push('Tool name is required and must be a string');
    }

    if (!tool.description || typeof tool.description !== 'string') {
      errors.push('Tool description is required and must be a string');
    }

    if (!tool.schema || typeof tool.schema !== 'object') {
      errors.push('Tool schema is required and must be a valid JSON schema');
    }

    if (!tool.handler || typeof tool.handler.execute !== 'function') {
      errors.push('Tool handler must have an execute function');
    }

    if (!tool.metadata || !tool.metadata.category) {
      errors.push('Tool metadata with category is required');
    }

    if (tools.has(tool.name)) {
      warnings.push(`Tool with name "${tool.name}" already exists and will be replaced`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }, [tools]);

  const executeTool = useCallback(async (call: ToolCall): Promise<ToolResult> => {
    const tool = tools.get(call.toolName);
    if (!tool) {
      throw new Error(`Tool "${call.toolName}" not found`);
    }

    const startTime = Date.now();
    
    try {
      const validationResult = tool.handler.validate(call.parameters);
      if (!validationResult.valid) {
        throw new Error(`Invalid parameters: ${validationResult.errors.join(', ')}`);
      }

      const result = await tool.handler.execute(call.parameters, call.context);
      const duration = Date.now() - startTime;

      return {
        callId: call.id,
        success: true,
        result: result.result,
        duration,
        resources: result.resources || { memory: 0, cpu: 0, network: 0, storage: 0 },
        sideEffects: result.sideEffects || []
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        callId: call.id,
        success: false,
        error: {
          type: 'execution_error',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'TOOL_EXECUTION_FAILED',
          recoverable: true
        },
        duration,
        resources: { memory: 0, cpu: 0, network: 0, storage: 0 },
        sideEffects: []
      };
    }
  }, [tools]);

  // Initialize with sample tools
  useEffect(() => {
    const sampleTools: ToolDefinition[] = [
      {
        name: 'calculator',
        version: '1.0.0',
        description: 'Perform mathematical calculations',
        schema: {
          type: 'object',
          properties: {
            expression: { type: 'string', description: 'Mathematical expression to evaluate' }
          },
          required: ['expression']
        },
        handler: {
          execute: async (params, context) => {
            try {
              // Simple evaluation (in real implementation, use a safe math parser)
              const result = eval(params.expression);
              return {
                callId: context.sessionId,
                success: true,
                result: { value: result, expression: params.expression },
                duration: 0,
                resources: { memory: 1, cpu: 1, network: 0, storage: 0 },
                sideEffects: []
              };
            } catch (error) {
              throw new Error(`Invalid mathematical expression: ${error}`);
            }
          },
          validate: (params) => ({
            valid: typeof params.expression === 'string',
            errors: typeof params.expression !== 'string' ? ['Expression must be a string'] : [],
            warnings: []
          })
        },
        permissions: [{ action: 'execute', resource: 'calculator' }],
        metadata: {
          category: 'data',
          tags: ['math', 'calculation'],
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          author: 'System',
          version: '1.0.0'
        }
      },
      {
        name: 'weather',
        version: '1.0.0',
        description: 'Get weather information for a location',
        schema: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'City name or coordinates' },
            units: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Temperature units' }
          },
          required: ['location']
        },
        handler: {
          execute: async (params, context) => {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return {
              callId: context.sessionId,
              success: true,
              result: {
                location: params.location,
                temperature: Math.round(Math.random() * 35 + 10),
                condition: ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)],
                humidity: Math.round(Math.random() * 100),
                units: params.units || 'celsius'
              },
              duration: 500,
              resources: { memory: 2, cpu: 1, network: 10, storage: 0 },
              sideEffects: []
            };
          },
          validate: (params) => ({
            valid: typeof params.location === 'string',
            errors: typeof params.location !== 'string' ? ['Location must be a string'] : [],
            warnings: []
          })
        },
        permissions: [{ action: 'read', resource: 'weather_api' }],
        metadata: {
          category: 'data',
          tags: ['weather', 'location', 'api'],
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          author: 'System',
          version: '1.0.0'
        }
      }
    ];

    sampleTools.forEach(tool => {
      setTools(prev => new Map(prev.set(tool.name, tool)));
    });
  }, []);

  return {
    tools: Array.from(tools.values()),
    categories,
    registerTool,
    unregisterTool,
    getTool,
    searchTools,
    executeTool,
    validateToolDefinition
  };
};

// ===== CONTEXT MANAGER IMPLEMENTATION =====

const useContextManager = () => {
  const [context, setContext] = useState<ContextState>({
    sessionId: `session_${Date.now()}`,
    conversationHistory: [],
    toolState: new Map(),
    globalContext: {
      variables: new Map(),
      settings: {},
      environmentInfo: {
        platform: 'web',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    },
    userPreferences: {
      theme: 'light',
      language: 'en',
      notifications: true,
      autoSave: true
    },
    permissionContext: {
      role: 'user',
      permissions: [
        { action: 'read', resource: '*' },
        { action: 'execute', resource: 'safe_tools' }
      ],
      restrictions: []
    }
  });

  const [contextWindow, setContextWindow] = useState({
    maxSize: 100,
    currentSize: 0,
    compressionRatio: 0.7,
    lastPruned: Date.now()
  });

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const fullMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    setContext(prev => ({
      ...prev,
      conversationHistory: [...prev.conversationHistory, fullMessage]
    }));

    setContextWindow(prev => ({
      ...prev,
      currentSize: prev.currentSize + 1
    }));
  }, []);

  const updateToolState = useCallback((toolName: string, state: any) => {
    setContext(prev => ({
      ...prev,
      toolState: new Map(prev.toolState.set(toolName, state))
    }));
  }, []);

  const setGlobalVariable = useCallback((key: string, value: any) => {
    setContext(prev => ({
      ...prev,
      globalContext: {
        ...prev.globalContext,
        variables: new Map(prev.globalContext.variables.set(key, value))
      }
    }));
  }, []);

  const getGlobalVariable = useCallback((key: string) => {
    return context.globalContext.variables.get(key);
  }, [context.globalContext.variables]);

  const pruneContext = useCallback(() => {
    if (contextWindow.currentSize <= contextWindow.maxSize) return;

    const messagesToKeep = Math.floor(contextWindow.maxSize * contextWindow.compressionRatio);
    
    setContext(prev => ({
      ...prev,
      conversationHistory: prev.conversationHistory.slice(-messagesToKeep)
    }));

    setContextWindow(prev => ({
      ...prev,
      currentSize: messagesToKeep,
      lastPruned: Date.now()
    }));

    notifications.show({
      title: 'Context Pruned',
      message: `Context window pruned to ${messagesToKeep} messages`,
      color: 'yellow'
    });
  }, [contextWindow.currentSize, contextWindow.maxSize, contextWindow.compressionRatio]);

  const serializeContext = useCallback(() => {
    const serializable = {
      sessionId: context.sessionId,
      conversationHistory: context.conversationHistory,
      toolState: Object.fromEntries(context.toolState),
      globalContext: {
        variables: Object.fromEntries(context.globalContext.variables),
        settings: context.globalContext.settings,
        environmentInfo: context.globalContext.environmentInfo
      },
      userPreferences: context.userPreferences,
      permissionContext: context.permissionContext
    };
    
    return JSON.stringify(serializable, null, 2);
  }, [context]);

  const deserializeContext = useCallback((serializedContext: string) => {
    try {
      const parsed = JSON.parse(serializedContext);
      
      setContext({
        sessionId: parsed.sessionId,
        conversationHistory: parsed.conversationHistory || [],
        toolState: new Map(Object.entries(parsed.toolState || {})),
        globalContext: {
          variables: new Map(Object.entries(parsed.globalContext?.variables || {})),
          settings: parsed.globalContext?.settings || {},
          environmentInfo: parsed.globalContext?.environmentInfo || {}
        },
        userPreferences: parsed.userPreferences || context.userPreferences,
        permissionContext: parsed.permissionContext || context.permissionContext
      });
      
      notifications.show({
        title: 'Context Restored',
        message: 'Context state has been restored from backup',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Context Restore Failed',
        message: 'Failed to restore context from backup',
        color: 'red'
      });
    }
  }, [context.userPreferences, context.permissionContext]);

  const clearContext = useCallback(() => {
    setContext(prev => ({
      ...prev,
      conversationHistory: [],
      toolState: new Map(),
      globalContext: {
        ...prev.globalContext,
        variables: new Map()
      }
    }));

    setContextWindow(prev => ({
      ...prev,
      currentSize: 0
    }));
  }, []);

  const getContextStats = useCallback(() => {
    const totalMessages = context.conversationHistory.length;
    const messagesByRole = context.conversationHistory.reduce((acc, msg) => {
      acc[msg.role] = (acc[msg.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const toolStates = context.toolState.size;
    const globalVariables = context.globalContext.variables.size;
    
    return {
      totalMessages,
      messagesByRole,
      toolStates,
      globalVariables,
      sessionDuration: Date.now() - parseInt(context.sessionId.split('_')[1]),
      contextWindowUsage: (contextWindow.currentSize / contextWindow.maxSize) * 100
    };
  }, [context, contextWindow]);

  // Auto-prune when context window exceeds limit
  useEffect(() => {
    if (contextWindow.currentSize > contextWindow.maxSize) {
      pruneContext();
    }
  }, [contextWindow.currentSize, contextWindow.maxSize, pruneContext]);

  return {
    context,
    contextWindow,
    addMessage,
    updateToolState,
    setGlobalVariable,
    getGlobalVariable,
    pruneContext,
    serializeContext,
    deserializeContext,
    clearContext,
    getContextStats,
    setContextWindowSize: (size: number) => setContextWindow(prev => ({ ...prev, maxSize: size }))
  };
};

// ===== MCP CLIENT COMPONENT =====

const MCPClient: React.FC = () => {
  const [config, setConfig] = useState<ConnectionConfig>({
    url: 'ws://localhost:8080/mcp',
    protocol: 'websocket',
    authentication: {
      type: 'apikey',
      credentials: { apikey: 'demo-key-12345' }
    },
    reconnection: {
      enabled: true,
      maxAttempts: 5,
      backoffStrategy: 'exponential',
      baseDelay: 1000,
      maxDelay: 30000
    },
    heartbeat: {
      enabled: true,
      interval: 30000,
      timeout: 5000,
      failureThreshold: 3
    }
  });

  const { state, messages, connect, disconnect, sendMessage, clearMessages } = useMCPClient(config);
  const [testMessage, setTestMessage] = useState('{"method": "test", "params": {"message": "Hello MCP!"}}');

  const handleSendTestMessage = useCallback(async () => {
    try {
      const messageObj = JSON.parse(testMessage);
      await sendMessage({
        type: 'request',
        method: messageObj.method,
        params: messageObj.params
      });
      
      notifications.show({
        title: 'Message Sent',
        message: 'Test message sent successfully',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Send Failed',
        message: error instanceof Error ? error.message : 'Failed to send message',
        color: 'red'
      });
    }
  }, [testMessage, sendMessage]);

  return (
    <Stack>
      <Group>
        <Badge color={state.connected ? 'green' : 'red'} variant="dot">
          {state.connected ? 'Connected' : 'Disconnected'}
        </Badge>
        {state.connecting && <Badge color="yellow" variant="dot">Connecting...</Badge>}
      </Group>

      <Group>
        <Button 
          onClick={connect} 
          disabled={state.connected || state.connecting}
          leftSection={<IconPlay size={16} />}
        >
          Connect
        </Button>
        <Button 
          onClick={disconnect} 
          disabled={!state.connected}
          leftSection={<IconStop size={16} />}
          variant="outline"
        >
          Disconnect
        </Button>
        <Button 
          onClick={clearMessages} 
          leftSection={<IconRefresh size={16} />}
          variant="subtle"
        >
          Clear Messages
        </Button>
      </Group>

      {state.lastError && (
        <Alert color="red" title="Connection Error">
          {state.lastError}
        </Alert>
      )}

      <Card>
        <Text size="sm" fw={500} mb="xs">Protocol Statistics</Text>
        <Group>
          <Text size="xs">Messages: {state.stats.messagesProcessed}</Text>
          <Text size="xs">Errors: {state.stats.errors}</Text>
          <Text size="xs">Reconnections: {state.stats.reconnections}</Text>
          <Text size="xs">Latency: {state.stats.avgLatency}ms</Text>
        </Group>
      </Card>

      <Card>
        <Text size="sm" fw={500} mb="xs">Send Test Message</Text>
        <Textarea
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Enter JSON message"
          rows={3}
          mb="xs"
        />
        <Button 
          onClick={handleSendTestMessage} 
          disabled={!state.connected}
          size="sm"
        >
          Send Message
        </Button>
      </Card>

      <Card>
        <Text size="sm" fw={500} mb="xs">Message History ({messages.length})</Text>
        <ScrollArea h={300}>
          <Stack gap="xs">
            {messages.map((msg) => (
              <Card key={msg.id} p="xs" withBorder>
                <Group>
                  <Badge size="xs" color={msg.type === 'request' ? 'blue' : msg.type === 'response' ? 'green' : 'gray'}>
                    {msg.type}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </Text>
                </Group>
                <Code block mt="xs" fz="xs">
                  {JSON.stringify({ method: msg.method, params: msg.params, result: msg.result }, null, 2)}
                </Code>
              </Card>
            ))}
          </Stack>
        </ScrollArea>
      </Card>
    </Stack>
  );
};

// ===== TOOL REGISTRY COMPONENT =====

const ToolRegistry: React.FC = () => {
  const { tools, categories, registerTool, unregisterTool, searchTools, executeTool } = useToolRegistry();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newToolJson, setNewToolJson] = useState('');
  const [executionParams, setExecutionParams] = useState('{}');
  const [executionResult, setExecutionResult] = useState<ToolResult | null>(null);

  const filteredTools = useMemo(() => {
    if (!searchQuery && !selectedCategory) return tools;
    return searchTools(searchQuery, selectedCategory || undefined);
  }, [tools, searchQuery, selectedCategory, searchTools]);

  const handleExecuteTool = useCallback(async () => {
    if (!selectedTool) return;

    try {
      const params = JSON.parse(executionParams);
      const call: ToolCall = {
        id: `call_${Date.now()}`,
        toolName: selectedTool.name,
        parameters: params,
        context: {
          sessionId: `session_${Date.now()}`,
          userId: 'demo-user',
          timestamp: Date.now(),
          permissions: [{ action: 'execute', resource: selectedTool.name }],
          timeout: 30000
        },
        timeout: 30000,
        retries: 3,
        priority: 'normal'
      };

      const result = await executeTool(call);
      setExecutionResult(result);
      
      notifications.show({
        title: 'Tool Executed',
        message: `Tool "${selectedTool.name}" executed ${result.success ? 'successfully' : 'with errors'}`,
        color: result.success ? 'green' : 'red'
      });
    } catch (error) {
      notifications.show({
        title: 'Execution Error',
        message: error instanceof Error ? error.message : 'Failed to execute tool',
        color: 'red'
      });
    }
  }, [selectedTool, executionParams, executeTool]);

  const handleAddTool = useCallback(() => {
    try {
      const toolDef = JSON.parse(newToolJson);
      registerTool(toolDef);
      setShowAddModal(false);
      setNewToolJson('');
    } catch (error) {
      notifications.show({
        title: 'Invalid Tool Definition',
        message: 'Please provide a valid JSON tool definition',
        color: 'red'
      });
    }
  }, [newToolJson, registerTool]);

  return (
    <Stack>
      <Group>
        <TextInput
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Category"
          data={[{ value: '', label: 'All Categories' }, ...categories.map(cat => ({ value: cat, label: cat }))]}
          value={selectedCategory || ''}
          onChange={(value) => setSelectedCategory(value || null)}
          clearable
        />
        <Button onClick={() => setShowAddModal(true)} leftSection={<IconSettings size={16} />}>
          Add Tool
        </Button>
      </Group>

      <Group align="stretch" style={{ minHeight: 400 }}>
        <Card style={{ flex: 1 }}>
          <Text size="sm" fw={500} mb="xs">Available Tools ({filteredTools.length})</Text>
          <ScrollArea h={350}>
            <Stack gap="xs">
              {filteredTools.map((tool) => (
                <Card
                  key={tool.name}
                  p="xs"
                  withBorder
                  style={{ cursor: 'pointer' }}
                  bg={selectedTool?.name === tool.name ? 'var(--mantine-color-blue-light)' : undefined}
                  onClick={() => setSelectedTool(tool)}
                >
                  <Group>
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>{tool.name}</Text>
                      <Text size="xs" c="dimmed">{tool.description}</Text>
                    </div>
                    <Badge size="xs">{tool.metadata.category}</Badge>
                    <ActionIcon
                      size="sm"
                      color="red"
                      variant="subtle"
                      onClick={(e) => {
                        e.stopPropagation();
                        unregisterTool(tool.name);
                      }}
                    >
                      <IconX size={12} />
                    </ActionIcon>
                  </Group>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
        </Card>

        <Card style={{ flex: 1 }}>
          {selectedTool ? (
            <Stack>
              <div>
                <Text size="sm" fw={500} mb="xs">Tool Details</Text>
                <Text size="xs"><strong>Name:</strong> {selectedTool.name}</Text>
                <Text size="xs"><strong>Version:</strong> {selectedTool.version}</Text>
                <Text size="xs"><strong>Category:</strong> {selectedTool.metadata.category}</Text>
                <Text size="xs"><strong>Tags:</strong> {selectedTool.metadata.tags.join(', ')}</Text>
              </div>
              
              <Divider />
              
              <div>
                <Text size="xs" fw={500} mb="xs">Schema:</Text>
                <Code block fz="xs">
                  {JSON.stringify(selectedTool.schema, null, 2)}
                </Code>
              </div>

              <div>
                <Text size="xs" fw={500} mb="xs">Test Parameters:</Text>
                <Textarea
                  value={executionParams}
                  onChange={(e) => setExecutionParams(e.target.value)}
                  placeholder="Enter JSON parameters"
                  rows={3}
                  fz="xs"
                />
                <Button 
                  size="xs" 
                  mt="xs" 
                  onClick={handleExecuteTool}
                  leftSection={<IconPlay size={12} />}
                >
                  Execute Tool
                </Button>
              </div>

              {executionResult && (
                <div>
                  <Text size="xs" fw={500} mb="xs">Execution Result:</Text>
                  <Code block fz="xs">
                    {JSON.stringify(executionResult, null, 2)}
                  </Code>
                </div>
              )}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">Select a tool to view details and test execution</Text>
          )}
        </Card>
      </Group>

      <Modal
        opened={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Tool"
        size="lg"
      >
        <Stack>
          <Text size="sm">Enter tool definition as JSON:</Text>
          <Textarea
            value={newToolJson}
            onChange={(e) => setNewToolJson(e.target.value)}
            placeholder={JSON.stringify({
              name: "example_tool",
              version: "1.0.0",
              description: "Example tool description",
              schema: {
                type: "object",
                properties: {
                  input: { type: "string", description: "Input parameter" }
                },
                required: ["input"]
              },
              metadata: {
                category: "general",
                tags: ["example"],
                author: "User"
              }
            }, null, 2)}
            rows={15}
            fz="xs"
          />
          <Group>
            <Button onClick={handleAddTool}>Add Tool</Button>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

// ===== CONTEXT MANAGER COMPONENT =====

const ContextManager: React.FC = () => {
  const {
    context,
    contextWindow,
    addMessage,
    updateToolState,
    setGlobalVariable,
    getGlobalVariable,
    serializeContext,
    deserializeContext,
    clearContext,
    getContextStats,
    setContextWindowSize
  } = useContextManager();

  const [newMessage, setNewMessage] = useState('');
  const [messageRole, setMessageRole] = useState<'user' | 'assistant' | 'system' | 'tool'>('user');
  const [showContextModal, setShowContextModal] = useState(false);
  const [contextBackup, setContextBackup] = useState('');
  const [variableKey, setVariableKey] = useState('');
  const [variableValue, setVariableValue] = useState('');

  const stats = getContextStats();

  const handleAddMessage = useCallback(() => {
    if (!newMessage.trim()) return;
    
    addMessage({
      role: messageRole,
      content: newMessage
    });
    
    setNewMessage('');
  }, [newMessage, messageRole, addMessage]);

  const handleSetVariable = useCallback(() => {
    if (!variableKey.trim()) return;
    
    try {
      const value = variableValue.startsWith('{') || variableValue.startsWith('[') 
        ? JSON.parse(variableValue) 
        : variableValue;
      
      setGlobalVariable(variableKey, value);
      setVariableKey('');
      setVariableValue('');
      
      notifications.show({
        title: 'Variable Set',
        message: `Variable "${variableKey}" has been set`,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Invalid Value',
        message: 'Please provide a valid value',
        color: 'red'
      });
    }
  }, [variableKey, variableValue, setGlobalVariable]);

  const handleBackupContext = useCallback(() => {
    const serialized = serializeContext();
    setContextBackup(serialized);
    setShowContextModal(true);
  }, [serializeContext]);

  const handleRestoreContext = useCallback(() => {
    deserializeContext(contextBackup);
    setShowContextModal(false);
  }, [contextBackup, deserializeContext]);

  return (
    <Stack>
      <Card>
        <Text size="sm" fw={500} mb="xs">Context Statistics</Text>
        <Group>
          <Text size="xs">Messages: {stats.totalMessages}</Text>
          <Text size="xs">Tool States: {stats.toolStates}</Text>
          <Text size="xs">Variables: {stats.globalVariables}</Text>
          <Text size="xs">Window Usage: {stats.contextWindowUsage.toFixed(1)}%</Text>
        </Group>
        <Progress value={stats.contextWindowUsage} size="sm" mt="xs" />
      </Card>

      <Group>
        <NumberInput
          label="Context Window Size"
          value={contextWindow.maxSize}
          onChange={(value) => setContextWindowSize(Number(value))}
          min={10}
          max={1000}
          style={{ width: 150 }}
        />
        <Button onClick={handleBackupContext} leftSection={<IconSettings size={16} />}>
          Backup Context
        </Button>
        <Button onClick={clearContext} color="red" variant="outline">
          Clear Context
        </Button>
      </Group>

      <Group align="stretch" style={{ minHeight: 400 }}>
        <Card style={{ flex: 1 }}>
          <Text size="sm" fw={500} mb="xs">Conversation History</Text>
          <ScrollArea h={300}>
            <Stack gap="xs">
              {context.conversationHistory.map((msg) => (
                <Card key={msg.id} p="xs" withBorder>
                  <Group>
                    <Badge size="xs" color={
                      msg.role === 'user' ? 'blue' : 
                      msg.role === 'assistant' ? 'green' : 
                      msg.role === 'system' ? 'orange' : 'gray'
                    }>
                      {msg.role}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </Text>
                  </Group>
                  <Text size="xs" mt="xs">{msg.content}</Text>
                </Card>
              ))}
            </Stack>
          </ScrollArea>

          <Group mt="xs">
            <Select
              data={[
                { value: 'user', label: 'User' },
                { value: 'assistant', label: 'Assistant' },
                { value: 'system', label: 'System' },
                { value: 'tool', label: 'Tool' }
              ]}
              value={messageRole}
              onChange={(value) => setMessageRole(value as any)}
              style={{ width: 100 }}
            />
            <TextInput
              placeholder="Enter message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ flex: 1 }}
              onKeyPress={(e) => e.key === 'Enter' && handleAddMessage()}
            />
            <Button onClick={handleAddMessage} size="sm">Add</Button>
          </Group>
        </Card>

        <Card style={{ flex: 1 }}>
          <Text size="sm" fw={500} mb="xs">Global Variables</Text>
          <ScrollArea h={200}>
            <Table size="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Key</Table.Th>
                  <Table.Th>Value</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Array.from(context.globalContext.variables.entries()).map(([key, value]) => (
                  <Table.Tr key={key}>
                    <Table.Td>{key}</Table.Td>
                    <Table.Td>
                      <Code fz="xs">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </Code>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>

          <Group mt="xs">
            <TextInput
              placeholder="Variable key"
              value={variableKey}
              onChange={(e) => setVariableKey(e.target.value)}
              style={{ flex: 1 }}
            />
            <TextInput
              placeholder="Variable value"
              value={variableValue}
              onChange={(e) => setVariableValue(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button onClick={handleSetVariable} size="sm">Set</Button>
          </Group>

          <Divider my="sm" />

          <Text size="sm" fw={500} mb="xs">Tool States</Text>
          <ScrollArea h={100}>
            <Stack gap="xs">
              {Array.from(context.toolState.entries()).map(([toolName, state]) => (
                <Card key={toolName} p="xs" withBorder>
                  <Text size="xs" fw={500}>{toolName}</Text>
                  <Code block fz="xs" mt="xs">
                    {JSON.stringify(state, null, 2)}
                  </Code>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
        </Card>
      </Group>

      <Modal
        opened={showContextModal}
        onClose={() => setShowContextModal(false)}
        title="Context Backup & Restore"
        size="xl"
      >
        <Stack>
          <Textarea
            label="Context Backup (JSON)"
            value={contextBackup}
            onChange={(e) => setContextBackup(e.target.value)}
            rows={20}
            fz="xs"
          />
          <Group>
            <Button onClick={handleRestoreContext}>Restore Context</Button>
            <Button variant="outline" onClick={() => setShowContextModal(false)}>Close</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

// ===== MAIN COMPONENT =====

export const MCPProtocolIntegrationExercise: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <Stack>
        <div>
          <h1>MCP Protocol Integration</h1>
          <p>Advanced AI tool calling and context management with Model Context Protocol implementation</p>
        </div>

        <Tabs defaultValue="client">
          <Tabs.List>
            <Tabs.Tab value="client" leftSection={<IconActivity size={16} />}>MCP Client</Tabs.Tab>
            <Tabs.Tab value="tools" leftSection={<IconSettings size={16} />}>Tool Registry</Tabs.Tab>
            <Tabs.Tab value="context" leftSection={<IconClock size={16} />}>Context Manager</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="client" pt="md">
            <MCPClient />
          </Tabs.Panel>

          <Tabs.Panel value="tools" pt="md">
            <ToolRegistry />
          </Tabs.Panel>

          <Tabs.Panel value="context" pt="md">
            <ContextManager />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </div>
  );
};

export default MCPProtocolIntegrationExercise;