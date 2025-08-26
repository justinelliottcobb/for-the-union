import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Card, Text, Group, Stack, Badge, Progress, Alert, Tabs, TextInput, Select, Textarea, NumberInput, Code, ScrollArea, Divider, ActionIcon, Modal, Table, JsonInput, Switch, Paper, Container, Notification } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlayerPlay, IconPlayerStop, IconSettings, IconCheck, IconX, IconRefresh, IconCode, IconShield, IconClock, IconDatabase, IconTool, IconBug } from '@tabler/icons-react';

// ===== TOOL CALLING TYPES =====

interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  schema: FunctionSchema;
  implementation: (params: any, context: ExecutionContext) => Promise<any>;
  metadata: FunctionMetadata;
  security: SecurityConfig;
}

interface FunctionSchema {
  parameters: ParameterSchema[];
  returns: ReturnSchema;
  examples: FunctionExample[];
  dependencies: string[];
}

interface ParameterSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  validation?: ValidationRule[];
}

interface ReturnSchema {
  type: string;
  description: string;
  properties?: Record<string, any>;
}

interface FunctionExample {
  name: string;
  description: string;
  parameters: Record<string, any>;
  expectedResult: any;
}

interface FunctionMetadata {
  category: string;
  tags: string[];
  author: string;
  createdAt: string;
  lastModified: string;
  usage: UsageStats;
}

interface UsageStats {
  totalCalls: number;
  successRate: number;
  avgExecutionTime: number;
  lastUsed: string;
}

interface SecurityConfig {
  permissions: Permission[];
  restrictions: string[];
  timeout: number;
  maxMemory: number;
  allowNetworkAccess: boolean;
  sandboxLevel: 'none' | 'basic' | 'strict';
}

interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  message?: string;
}

interface ExecutionContext {
  toolId: string;
  parameters: Record<string, any>;
  permissions: Permission[];
  timeout: number;
  userId: string;
  sessionId: string;
  startTime: number;
}

interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: ToolError;
  metadata: ExecutionMetadata;
  performance: PerformanceMetrics;
}

interface ToolError {
  type: string;
  message: string;
  code: string;
  details?: any;
  stack?: string;
  recoverable: boolean;
}

interface ExecutionMetadata {
  executionId: string;
  startTime: number;
  endTime: number;
  duration: number;
  cacheHit: boolean;
  retryCount: number;
}

interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkCalls: number;
  cacheHitRate: number;
}

interface ValidationResult {
  valid: boolean;
  data: any;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  transformed: any;
}

interface ValidationError {
  field: string;
  message: string;
  value: any;
  rule: string;
}

interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
}

// ===== FUNCTION REGISTRY =====

const useFunctionRegistry = () => {
  const [tools, setTools] = useState<Map<string, ToolDefinition>>(new Map());
  const [categories, setCategories] = useState<string[]>(['data', 'math', 'text', 'network', 'system']);
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);

  const registerTool = useCallback((tool: ToolDefinition) => {
    const validationResult = validateToolDefinition(tool);
    if (!validationResult.valid) {
      throw new Error(`Invalid tool definition: ${validationResult.errors.join(', ')}`);
    }

    setTools(prev => new Map(prev.set(tool.id, tool)));
    
    if (!categories.includes(tool.metadata.category)) {
      setCategories(prev => [...prev, tool.metadata.category]);
    }

    notifications.show({
      title: 'Tool Registered',
      message: `Function "${tool.name}" registered successfully`,
      color: 'green'
    });
  }, [categories]);

  const validateToolDefinition = useCallback((tool: ToolDefinition): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!tool.id || typeof tool.id !== 'string') {
      errors.push({ field: 'id', message: 'Tool ID is required and must be a string', value: tool.id, rule: 'required' });
    }

    if (!tool.name || typeof tool.name !== 'string') {
      errors.push({ field: 'name', message: 'Tool name is required and must be a string', value: tool.name, rule: 'required' });
    }

    if (!tool.implementation || typeof tool.implementation !== 'function') {
      errors.push({ field: 'implementation', message: 'Tool implementation must be a function', value: typeof tool.implementation, rule: 'type' });
    }

    if (!tool.schema || !tool.schema.parameters) {
      errors.push({ field: 'schema', message: 'Tool schema with parameters is required', value: tool.schema, rule: 'required' });
    }

    if (tools.has(tool.id)) {
      warnings.push({ field: 'id', message: `Tool with ID "${tool.id}" already exists and will be replaced`, suggestion: 'Consider using a different ID or versioning' });
    }

    return {
      valid: errors.length === 0,
      data: tool,
      errors,
      warnings,
      transformed: tool
    };
  }, [tools]);

  const getTool = useCallback((toolId: string): ToolDefinition | undefined => {
    return tools.get(toolId);
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
    
    return results.sort((a, b) => b.metadata.usage.totalCalls - a.metadata.usage.totalCalls);
  }, [tools]);

  const getToolsByCategory = useCallback((category: string): ToolDefinition[] => {
    return Array.from(tools.values()).filter(tool => tool.metadata.category === category);
  }, [tools]);

  const updateToolUsage = useCallback((toolId: string, result: ExecutionResult) => {
    setTools(prev => {
      const tool = prev.get(toolId);
      if (!tool) return prev;

      const updatedTool = {
        ...tool,
        metadata: {
          ...tool.metadata,
          usage: {
            totalCalls: tool.metadata.usage.totalCalls + 1,
            successRate: result.success 
              ? (tool.metadata.usage.successRate * tool.metadata.usage.totalCalls + 1) / (tool.metadata.usage.totalCalls + 1)
              : (tool.metadata.usage.successRate * tool.metadata.usage.totalCalls) / (tool.metadata.usage.totalCalls + 1),
            avgExecutionTime: (tool.metadata.usage.avgExecutionTime * tool.metadata.usage.totalCalls + result.metadata.duration) / (tool.metadata.usage.totalCalls + 1),
            lastUsed: new Date().toISOString()
          }
        }
      };

      return new Map(prev.set(toolId, updatedTool));
    });

    setExecutionHistory(prev => [...prev.slice(-49), result]); // Keep last 50 executions
  }, []);

  // Initialize with sample tools
  useEffect(() => {
    const sampleTools: ToolDefinition[] = [
      {
        id: 'calculator',
        name: 'Calculator',
        description: 'Perform mathematical calculations with support for basic arithmetic operations',
        version: '1.0.0',
        schema: {
          parameters: [
            {
              name: 'expression',
              type: 'string',
              description: 'Mathematical expression to evaluate (e.g., "2 + 3 * 4")',
              required: true,
              validation: [
                { type: 'pattern', value: /^[0-9+\-*/.() ]+$/, message: 'Expression contains invalid characters' }
              ]
            }
          ],
          returns: {
            type: 'number',
            description: 'Result of the mathematical calculation'
          },
          examples: [
            {
              name: 'Simple Addition',
              description: 'Basic addition calculation',
              parameters: { expression: '5 + 3' },
              expectedResult: 8
            },
            {
              name: 'Complex Expression',
              description: 'Expression with multiple operations',
              parameters: { expression: '(10 + 5) * 2 - 8' },
              expectedResult: 22
            }
          ],
          dependencies: []
        },
        implementation: async (params, context) => {
          try {
            // Simple math evaluation (in production, use a safe math parser)
            const result = Function('"use strict"; return (' + params.expression + ')')();
            return { value: result, expression: params.expression };
          } catch (error) {
            throw new Error(`Invalid mathematical expression: ${error}`);
          }
        },
        metadata: {
          category: 'math',
          tags: ['calculator', 'arithmetic', 'math'],
          author: 'System',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          usage: {
            totalCalls: 0,
            successRate: 1.0,
            avgExecutionTime: 50,
            lastUsed: new Date().toISOString()
          }
        },
        security: {
          permissions: [{ action: 'execute', resource: 'calculator' }],
          restrictions: [],
          timeout: 5000,
          maxMemory: 10,
          allowNetworkAccess: false,
          sandboxLevel: 'basic'
        }
      },
      {
        id: 'text_analyzer',
        name: 'Text Analyzer',
        description: 'Analyze text content for various metrics including word count, sentiment, and readability',
        version: '1.0.0',
        schema: {
          parameters: [
            {
              name: 'text',
              type: 'string',
              description: 'Text content to analyze',
              required: true,
              validation: [
                { type: 'min', value: 1, message: 'Text cannot be empty' },
                { type: 'max', value: 10000, message: 'Text cannot exceed 10,000 characters' }
              ]
            },
            {
              name: 'includeReadability',
              type: 'boolean',
              description: 'Include readability analysis in the results',
              required: false,
              default: false
            }
          ],
          returns: {
            type: 'object',
            description: 'Text analysis results including metrics and insights'
          },
          examples: [
            {
              name: 'Basic Analysis',
              description: 'Analyze a simple text passage',
              parameters: { text: 'Hello world! This is a test message.' },
              expectedResult: { wordCount: 7, characterCount: 35, sentiment: 'neutral' }
            }
          ],
          dependencies: []
        },
        implementation: async (params, context) => {
          const { text, includeReadability = false } = params;
          
          const words = text.trim().split(/\s+/).filter(word => word.length > 0);
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
          
          const analysis: any = {
            wordCount: words.length,
            characterCount: text.length,
            sentenceCount: sentences.length,
            avgWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
            sentiment: 'neutral' // Simplified sentiment analysis
          };

          if (includeReadability) {
            // Simplified readability score (Flesch Reading Ease approximation)
            const avgSentenceLength = words.length / sentences.length;
            const avgSyllablesPerWord = 1.5; // Simplified estimation
            analysis.readabilityScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
            analysis.readabilityLevel = analysis.readabilityScore > 60 ? 'Easy' : analysis.readabilityScore > 30 ? 'Moderate' : 'Difficult';
          }

          return analysis;
        },
        metadata: {
          category: 'text',
          tags: ['analysis', 'nlp', 'text processing'],
          author: 'System',
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          usage: {
            totalCalls: 0,
            successRate: 0.95,
            avgExecutionTime: 150,
            lastUsed: new Date().toISOString()
          }
        },
        security: {
          permissions: [{ action: 'execute', resource: 'text_analyzer' }],
          restrictions: [],
          timeout: 10000,
          maxMemory: 50,
          allowNetworkAccess: false,
          sandboxLevel: 'basic'
        }
      }
    ];

    sampleTools.forEach(tool => {
      setTools(prev => new Map(prev.set(tool.id, tool)));
    });
  }, []);

  return {
    tools: Array.from(tools.values()),
    categories,
    executionHistory,
    registerTool,
    getTool,
    searchTools,
    getToolsByCategory,
    updateToolUsage,
    validateToolDefinition
  };
};

// ===== PARAMETER VALIDATOR =====

const useParameterValidator = () => {
  const validateParameters = useCallback((parameters: any, schema: ParameterSchema[]): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const transformedData: Record<string, any> = {};

    // Check required parameters
    for (const param of schema) {
      const value = parameters[param.name];
      
      if (param.required && (value === undefined || value === null)) {
        errors.push({
          field: param.name,
          message: `Parameter "${param.name}" is required`,
          value,
          rule: 'required'
        });
        continue;
      }

      let processedValue = value;

      // Apply default value if missing
      if (processedValue === undefined && param.default !== undefined) {
        processedValue = param.default;
        warnings.push({
          field: param.name,
          message: `Using default value for "${param.name}"`,
          suggestion: `Consider explicitly providing a value for "${param.name}"`
        });
      }

      // Type validation and coercion
      if (processedValue !== undefined) {
        const typeValidation = validateType(processedValue, param.type);
        if (!typeValidation.valid) {
          errors.push({
            field: param.name,
            message: `Parameter "${param.name}" must be of type ${param.type}`,
            value: processedValue,
            rule: 'type'
          });
        } else {
          processedValue = typeValidation.value;
        }

        // Custom validation rules
        if (param.validation) {
          for (const rule of param.validation) {
            const ruleValidation = validateRule(processedValue, rule);
            if (!ruleValidation.valid) {
              errors.push({
                field: param.name,
                message: rule.message || ruleValidation.message,
                value: processedValue,
                rule: rule.type
              });
            }
          }
        }
      }

      if (processedValue !== undefined) {
        transformedData[param.name] = processedValue;
      }
    }

    // Check for unexpected parameters
    for (const key in parameters) {
      if (!schema.some(param => param.name === key)) {
        warnings.push({
          field: key,
          message: `Unexpected parameter "${key}"`,
          suggestion: 'Remove this parameter or check the function schema'
        });
      }
    }

    return {
      valid: errors.length === 0,
      data: parameters,
      errors,
      warnings,
      transformed: transformedData
    };
  }, []);

  const validateType = useCallback((value: any, expectedType: string): { valid: boolean; value: any } => {
    switch (expectedType) {
      case 'string':
        if (typeof value === 'string') return { valid: true, value };
        if (typeof value === 'number' || typeof value === 'boolean') {
          return { valid: true, value: String(value) };
        }
        return { valid: false, value };

      case 'number':
        if (typeof value === 'number' && !isNaN(value)) return { valid: true, value };
        if (typeof value === 'string' && !isNaN(Number(value))) {
          return { valid: true, value: Number(value) };
        }
        return { valid: false, value };

      case 'boolean':
        if (typeof value === 'boolean') return { valid: true, value };
        if (value === 'true' || value === 'false') {
          return { valid: true, value: value === 'true' };
        }
        return { valid: false, value };

      case 'object':
        return { valid: typeof value === 'object' && value !== null && !Array.isArray(value), value };

      case 'array':
        return { valid: Array.isArray(value), value };

      default:
        return { valid: true, value };
    }
  }, []);

  const validateRule = useCallback((value: any, rule: ValidationRule): { valid: boolean; message: string } => {
    switch (rule.type) {
      case 'min':
        if (typeof value === 'string' || Array.isArray(value)) {
          return {
            valid: value.length >= rule.value,
            message: `Must have at least ${rule.value} ${typeof value === 'string' ? 'characters' : 'items'}`
          };
        }
        if (typeof value === 'number') {
          return {
            valid: value >= rule.value,
            message: `Must be at least ${rule.value}`
          };
        }
        return { valid: true, message: '' };

      case 'max':
        if (typeof value === 'string' || Array.isArray(value)) {
          return {
            valid: value.length <= rule.value,
            message: `Must have at most ${rule.value} ${typeof value === 'string' ? 'characters' : 'items'}`
          };
        }
        if (typeof value === 'number') {
          return {
            valid: value <= rule.value,
            message: `Must be at most ${rule.value}`
          };
        }
        return { valid: true, message: '' };

      case 'pattern':
        if (typeof value === 'string') {
          return {
            valid: rule.value.test(value),
            message: 'Does not match the required pattern'
          };
        }
        return { valid: true, message: '' };

      case 'custom':
        // Custom validation would be implemented here
        return { valid: true, message: '' };

      default:
        return { valid: true, message: '' };
    }
  }, []);

  const sanitizeInput = useCallback((input: any): any => {
    if (typeof input === 'string') {
      // Basic XSS prevention
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }

    if (typeof input === 'object' && input !== null) {
      if (Array.isArray(input)) {
        return input.map(sanitizeInput);
      }

      const sanitized: Record<string, any> = {};
      for (const key in input) {
        sanitized[key] = sanitizeInput(input[key]);
      }
      return sanitized;
    }

    return input;
  }, []);

  return {
    validateParameters,
    validateType,
    validateRule,
    sanitizeInput
  };
};

// ===== TOOL EXECUTOR =====

const useToolExecutor = () => {
  const { validateParameters, sanitizeInput } = useParameterValidator();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionQueue, setExecutionQueue] = useState<ExecutionContext[]>([]);
  const executionCache = useRef<Map<string, { result: any; timestamp: number; ttl: number }>>(new Map());

  const executeFunction = useCallback(async (
    tool: ToolDefinition, 
    parameters: Record<string, any>, 
    context: Partial<ExecutionContext> = {}
  ): Promise<ExecutionResult> => {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const fullContext: ExecutionContext = {
      toolId: tool.id,
      parameters,
      permissions: context.permissions || [],
      timeout: context.timeout || tool.security.timeout,
      userId: context.userId || 'anonymous',
      sessionId: context.sessionId || 'default',
      startTime
    };

    try {
      setIsExecuting(true);

      // 1. Parameter validation
      const validationResult = validateParameters(parameters, tool.schema.parameters);
      if (!validationResult.valid) {
        return {
          success: false,
          error: {
            type: 'ValidationError',
            message: 'Parameter validation failed',
            code: 'INVALID_PARAMETERS',
            details: validationResult.errors,
            recoverable: true
          },
          metadata: {
            executionId,
            startTime,
            endTime: Date.now(),
            duration: Date.now() - startTime,
            cacheHit: false,
            retryCount: 0
          },
          performance: {
            cpuUsage: 0,
            memoryUsage: 0,
            networkCalls: 0,
            cacheHitRate: 0
          }
        };
      }

      // 2. Security checks
      const securityCheck = validateSecurity(tool, fullContext);
      if (!securityCheck.valid) {
        return {
          success: false,
          error: {
            type: 'SecurityError',
            message: 'Security validation failed',
            code: 'SECURITY_VIOLATION',
            details: securityCheck.message,
            recoverable: false
          },
          metadata: {
            executionId,
            startTime,
            endTime: Date.now(),
            duration: Date.now() - startTime,
            cacheHit: false,
            retryCount: 0
          },
          performance: {
            cpuUsage: 0,
            memoryUsage: 0,
            networkCalls: 0,
            cacheHitRate: 0
          }
        };
      }

      // 3. Check cache
      const cacheKey = `${tool.id}:${JSON.stringify(validationResult.transformed)}`;
      const cachedResult = executionCache.current.get(cacheKey);
      if (cachedResult && Date.now() - cachedResult.timestamp < cachedResult.ttl) {
        return {
          success: true,
          result: cachedResult.result,
          metadata: {
            executionId,
            startTime,
            endTime: Date.now(),
            duration: Date.now() - startTime,
            cacheHit: true,
            retryCount: 0
          },
          performance: {
            cpuUsage: 0,
            memoryUsage: 0,
            networkCalls: 0,
            cacheHitRate: 1
          }
        };
      }

      // 4. Sanitize input
      const sanitizedParams = sanitizeInput(validationResult.transformed);

      // 5. Execute with timeout
      const executionPromise = Promise.race([
        tool.implementation(sanitizedParams, fullContext),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Execution timeout')), fullContext.timeout)
        )
      ]);

      const result = await executionPromise;
      const endTime = Date.now();

      // 6. Cache result
      executionCache.current.set(cacheKey, {
        result,
        timestamp: endTime,
        ttl: 300000 // 5 minutes
      });

      // 7. Clean up old cache entries
      const now = Date.now();
      for (const [key, value] of executionCache.current.entries()) {
        if (now - value.timestamp > value.ttl) {
          executionCache.current.delete(key);
        }
      }

      return {
        success: true,
        result,
        metadata: {
          executionId,
          startTime,
          endTime,
          duration: endTime - startTime,
          cacheHit: false,
          retryCount: 0
        },
        performance: {
          cpuUsage: Math.random() * 50, // Simulated metrics
          memoryUsage: Math.random() * 100,
          networkCalls: 0,
          cacheHitRate: 0
        }
      };

    } catch (error) {
      const endTime = Date.now();
      return {
        success: false,
        error: {
          type: 'ExecutionError',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'EXECUTION_FAILED',
          details: error,
          stack: error instanceof Error ? error.stack : undefined,
          recoverable: true
        },
        metadata: {
          executionId,
          startTime,
          endTime,
          duration: endTime - startTime,
          cacheHit: false,
          retryCount: 0
        },
        performance: {
          cpuUsage: 0,
          memoryUsage: 0,
          networkCalls: 0,
          cacheHitRate: 0
        }
      };
    } finally {
      setIsExecuting(false);
    }
  }, [validateParameters, sanitizeInput]);

  const validateSecurity = useCallback((tool: ToolDefinition, context: ExecutionContext): { valid: boolean; message?: string } => {
    // Check permissions
    if (tool.security.permissions.length > 0) {
      const hasPermission = tool.security.permissions.some(permission =>
        context.permissions.some(userPermission =>
          userPermission.action === permission.action && 
          userPermission.resource === permission.resource
        )
      );

      if (!hasPermission) {
        return { valid: false, message: 'Insufficient permissions' };
      }
    }

    // Check restrictions
    if (tool.security.restrictions.length > 0) {
      // Implementation would check various restrictions
    }

    return { valid: true };
  }, []);

  const clearCache = useCallback(() => {
    executionCache.current.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, value] of executionCache.current.entries()) {
      if (now - value.timestamp < value.ttl) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: executionCache.current.size,
      validEntries,
      expiredEntries,
      hitRate: validEntries / Math.max(1, validEntries + expiredEntries)
    };
  }, []);

  return {
    executeFunction,
    isExecuting,
    executionQueue,
    clearCache,
    getCacheStats
  };
};

// ===== RESULT RENDERER =====

interface ResultRendererProps {
  result: ExecutionResult;
  format?: 'json' | 'table' | 'text' | 'chart';
}

const ResultRenderer: React.FC<ResultRendererProps> = ({ result, format = 'json' }) => {
  const [selectedFormat, setSelectedFormat] = useState(format);
  const [showMetadata, setShowMetadata] = useState(false);

  const renderResult = useCallback(() => {
    if (!result.success) {
      return (
        <Alert color="red" title="Execution Failed" icon={<IconX size={16} />}>
          <Stack spacing="xs">
            <Text size="sm">
              <strong>Error:</strong> {result.error?.message}
            </Text>
            <Text size="sm">
              <strong>Type:</strong> {result.error?.type}
            </Text>
            <Text size="sm">
              <strong>Code:</strong> {result.error?.code}
            </Text>
            {result.error?.details && (
              <Code block mt="sm">
                {JSON.stringify(result.error.details, null, 2)}
              </Code>
            )}
          </Stack>
        </Alert>
      );
    }

    switch (selectedFormat) {
      case 'json':
        return (
          <Code block>
            {JSON.stringify(result.result, null, 2)}
          </Code>
        );

      case 'table':
        if (typeof result.result === 'object' && result.result !== null) {
          return (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Property</Table.Th>
                  <Table.Th>Value</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {Object.entries(result.result).map(([key, value]) => (
                  <Table.Tr key={key}>
                    <Table.Td>{key}</Table.Td>
                    <Table.Td>
                      {typeof value === 'object' ? 
                        JSON.stringify(value) : 
                        String(value)
                      }
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          );
        }
        return <Text>Result is not a valid object for table display</Text>;

      case 'text':
        return (
          <Text style={{ whiteSpace: 'pre-wrap' }}>
            {typeof result.result === 'string' ? 
              result.result : 
              JSON.stringify(result.result, null, 2)
            }
          </Text>
        );

      case 'chart':
        // Simplified chart representation
        if (typeof result.result === 'object' && result.result !== null) {
          const data = Object.entries(result.result).filter(([key, value]) => typeof value === 'number');
          if (data.length > 0) {
            return (
              <div>
                {data.map(([key, value]) => (
                  <div key={key} style={{ marginBottom: '8px' }}>
                    <Text size="sm">{key}: {value}</Text>
                    <Progress value={(value as number / Math.max(...data.map(([, v]) => v as number))) * 100} />
                  </div>
                ))}
              </div>
            );
          }
        }
        return <Text>Result does not contain numeric data for chart visualization</Text>;

      default:
        return <Text>Unknown format</Text>;
    }
  }, [result, selectedFormat]);

  return (
    <Stack>
      <Group>
        <Select
          label="Display Format"
          value={selectedFormat}
          onChange={(value) => setSelectedFormat(value as any)}
          data={[
            { value: 'json', label: 'JSON' },
            { value: 'table', label: 'Table' },
            { value: 'text', label: 'Text' },
            { value: 'chart', label: 'Chart' }
          ]}
          size="sm"
        />
        <Switch
          label="Show Metadata"
          checked={showMetadata}
          onChange={(event) => setShowMetadata(event.currentTarget.checked)}
          size="sm"
        />
      </Group>

      <Paper p="md" withBorder>
        {renderResult()}
      </Paper>

      {showMetadata && (
        <Paper p="md" withBorder>
          <Text size="sm" weight={500} mb="sm">Execution Metadata</Text>
          <Group spacing="lg">
            <div>
              <Text size="xs" color="dimmed">Duration</Text>
              <Text size="sm">{result.metadata.duration}ms</Text>
            </div>
            <div>
              <Text size="xs" color="dimmed">Cache Hit</Text>
              <Badge color={result.metadata.cacheHit ? 'green' : 'gray'}>
                {result.metadata.cacheHit ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <Text size="xs" color="dimmed">Memory Usage</Text>
              <Text size="sm">{result.performance.memoryUsage.toFixed(1)}MB</Text>
            </div>
            <div>
              <Text size="xs" color="dimmed">CPU Usage</Text>
              <Text size="sm">{result.performance.cpuUsage.toFixed(1)}%</Text>
            </div>
          </Group>
        </Paper>
      )}
    </Stack>
  );
};

// ===== TOOL EXECUTOR COMPONENT =====

const ToolExecutorComponent: React.FC = () => {
  const { tools, registerTool, getTool, searchTools, categories, updateToolUsage } = useFunctionRegistry();
  const { executeFunction, isExecuting, getCacheStats, clearCache } = useToolExecutor();
  
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const filteredTools = useMemo(() => {
    if (!searchQuery && !selectedCategory) return tools;
    return searchTools(searchQuery, selectedCategory || undefined);
  }, [tools, searchQuery, selectedCategory, searchTools]);

  const handleExecute = useCallback(async () => {
    if (!selectedTool) return;

    try {
      const result = await executeFunction(selectedTool, parameters);
      setExecutionResult(result);
      updateToolUsage(selectedTool.id, result);
      
      if (result.success) {
        notifications.show({
          title: 'Execution Successful',
          message: `Tool "${selectedTool.name}" executed successfully`,
          color: 'green'
        });
      } else {
        notifications.show({
          title: 'Execution Failed',
          message: `Tool execution failed: ${result.error?.message}`,
          color: 'red'
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Execution Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        color: 'red'
      });
    }
  }, [selectedTool, parameters, executeFunction, updateToolUsage]);

  const handleParameterChange = useCallback((paramName: string, value: any) => {
    setParameters(prev => ({ ...prev, [paramName]: value }));
  }, []);

  const cacheStats = getCacheStats();

  return (
    <Container size="xl">
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
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value || '')}
            clearable
          />
          <Button onClick={clearCache} variant="outline">
            Clear Cache
          </Button>
        </Group>

        <Group align="stretch" style={{ minHeight: 600 }}>
          {/* Tool List */}
          <Card style={{ flex: 1, maxWidth: 400 }}>
            <Text size="sm" weight={500} mb="xs">Available Tools ({filteredTools.length})</Text>
            <ScrollArea h={500}>
              <Stack spacing="xs">
                {filteredTools.map((tool) => (
                  <Card
                    key={tool.id}
                    p="xs"
                    withBorder
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: selectedTool?.id === tool.id ? 'var(--mantine-color-blue-light)' : undefined
                    }}
                    onClick={() => setSelectedTool(tool)}
                  >
                    <Group>
                      <div style={{ flex: 1 }}>
                        <Text size="sm" weight={500}>{tool.name}</Text>
                        <Text size="xs" color="dimmed" lineClamp={2}>{tool.description}</Text>
                        <Group spacing="xs" mt="xs">
                          <Badge size="xs" color="blue">{tool.metadata.category}</Badge>
                          <Badge size="xs" variant="outline">
                            {tool.metadata.usage.totalCalls} calls
                          </Badge>
                          <Badge size="xs" variant="outline" color={tool.metadata.usage.successRate > 0.9 ? 'green' : 'orange'}>
                            {(tool.metadata.usage.successRate * 100).toFixed(0)}% success
                          </Badge>
                        </Group>
                      </div>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </ScrollArea>
          </Card>

          {/* Tool Details and Execution */}
          <Card style={{ flex: 2 }}>
            {selectedTool ? (
              <Stack>
                <div>
                  <Text size="lg" weight={500}>{selectedTool.name}</Text>
                  <Text size="sm" color="dimmed" mb="md">{selectedTool.description}</Text>
                  
                  <Group>
                    <Badge>{selectedTool.metadata.category}</Badge>
                    <Badge variant="outline">v{selectedTool.version}</Badge>
                    <Badge variant="outline" leftSection={<IconShield size={12} />}>
                      {selectedTool.security.sandboxLevel}
                    </Badge>
                  </Group>
                </div>

                <Divider />

                {/* Parameters */}
                <div>
                  <Text size="sm" weight={500} mb="sm">Parameters</Text>
                  {selectedTool.schema.parameters.map((param) => (
                    <div key={param.name} style={{ marginBottom: '12px' }}>
                      <Group spacing="xs" mb="xs">
                        <Text size="sm">{param.name}</Text>
                        {param.required && <Badge size="xs" color="red">Required</Badge>}
                        <Badge size="xs" variant="outline">{param.type}</Badge>
                      </Group>
                      <Text size="xs" color="dimmed" mb="xs">{param.description}</Text>
                      
                      {param.type === 'string' && (
                        <TextInput
                          value={parameters[param.name] || ''}
                          onChange={(e) => handleParameterChange(param.name, e.target.value)}
                          placeholder={param.default ? `Default: ${param.default}` : undefined}
                        />
                      )}
                      
                      {param.type === 'number' && (
                        <NumberInput
                          value={parameters[param.name] || ''}
                          onChange={(value) => handleParameterChange(param.name, value)}
                          placeholder={param.default ? `Default: ${param.default}` : undefined}
                        />
                      )}
                      
                      {param.type === 'boolean' && (
                        <Switch
                          checked={parameters[param.name] || false}
                          onChange={(event) => handleParameterChange(param.name, event.currentTarget.checked)}
                          label="Enable"
                        />
                      )}
                      
                      {param.type === 'object' && (
                        <Textarea
                          value={JSON.stringify(parameters[param.name] || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              handleParameterChange(param.name, parsed);
                            } catch (err) {
                              // Invalid JSON, keep as string for now
                            }
                          }}
                          placeholder="Enter JSON object"
                          rows={3}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleExecute}
                  loading={isExecuting}
                  leftSection={<IconPlayerPlay size={16} />}
                  disabled={!selectedTool}
                >
                  Execute Tool
                </Button>

                {/* Execution Result */}
                {executionResult && (
                  <div>
                    <Text size="sm" weight={500} mb="sm">Execution Result</Text>
                    <ResultRenderer result={executionResult} />
                  </div>
                )}

                {/* Tool Examples */}
                {selectedTool.schema.examples.length > 0 && (
                  <div>
                    <Text size="sm" weight={500} mb="sm">Examples</Text>
                    {selectedTool.schema.examples.map((example, index) => (
                      <Paper key={index} p="sm" withBorder mb="sm">
                        <Text size="sm" weight={500}>{example.name}</Text>
                        <Text size="xs" color="dimmed" mb="xs">{example.description}</Text>
                        <Code block size="xs">
                          Parameters: {JSON.stringify(example.parameters, null, 2)}
                        </Code>
                        <Button
                          size="xs"
                          variant="subtle"
                          mt="xs"
                          onClick={() => setParameters(example.parameters)}
                        >
                          Use This Example
                        </Button>
                      </Paper>
                    ))}
                  </div>
                )}
              </Stack>
            ) : (
              <Text color="dimmed" size="sm">Select a tool from the list to view details and execute</Text>
            )}
          </Card>
        </Group>

        {/* Cache Statistics */}
        <Paper p="md" withBorder>
          <Text size="sm" weight={500} mb="sm">Performance Statistics</Text>
          <Group>
            <div>
              <Text size="xs" color="dimmed">Cache Entries</Text>
              <Text size="sm">{cacheStats.totalEntries}</Text>
            </div>
            <div>
              <Text size="xs" color="dimmed">Valid Entries</Text>
              <Text size="sm">{cacheStats.validEntries}</Text>
            </div>
            <div>
              <Text size="xs" color="dimmed">Hit Rate</Text>
              <Text size="sm">{(cacheStats.hitRate * 100).toFixed(1)}%</Text>
            </div>
            <div>
              <Text size="xs" color="dimmed">Total Tools</Text>
              <Text size="sm">{tools.length}</Text>
            </div>
          </Group>
        </Paper>
      </Stack>
    </Container>
  );
};

// ===== MAIN COMPONENT =====

export const ToolCallingIntegrationExercise: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <Stack>
        <div>
          <h1>Tool Calling Integration</h1>
          <p>AI tool calling and function execution patterns with secure execution and comprehensive validation</p>
        </div>

        <ToolExecutorComponent />
      </Stack>
    </div>
  );
};

export default ToolCallingIntegrationExercise;