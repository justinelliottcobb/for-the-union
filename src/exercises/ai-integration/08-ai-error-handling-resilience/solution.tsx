import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Card, Text, Group, Stack, Badge, Progress, Alert, Tabs, TextInput, Select, Textarea, NumberInput, Code, ScrollArea, Divider, ActionIcon, Modal, Slider, Switch, Paper, Container, Grid, RingProgress, Table, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh, IconAlertTriangle, IconShield, IconNetwork, IconClock, IconTarget, IconChartLine, IconSettings, IconBolt, IconExclamationCircle, IconCheck, IconX } from '@tabler/icons-react';

// ===== ERROR HANDLING & RESILIENCE TYPES =====

interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: BackoffStrategy;
  jitterStrategy: JitterStrategy;
  conditions: RetryCondition[];
  circuitBreakerThreshold: number;
}

interface BackoffStrategy {
  type: 'exponential' | 'linear' | 'fixed';
  baseDelay: number;
  maxDelay: number;
  multiplier: number;
}

interface JitterStrategy {
  type: 'full' | 'equal' | 'decorrelated';
  factor: number;
}

interface RetryCondition {
  errorType: string;
  statusCodes: number[];
  messagePatterns: string[];
  retryable: boolean;
}

interface RetryExecution {
  attempt: number;
  delay: number;
  error: ErrorDetails;
  success: boolean;
  totalTime: number;
  nextRetry?: number;
  startTime: number;
}

interface ErrorDetails {
  type: string;
  message: string;
  code?: string;
  statusCode?: number;
  provider?: string;
  recoverable: boolean;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  successThreshold: number;
  monitoringWindow: number;
  halfOpenMaxCalls: number;
}

interface CircuitState {
  current: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  totalCalls: number;
  failureRate: number;
}

interface CircuitMetrics {
  stateChanges: StateChange[];
  callMetrics: CallMetric[];
  currentState: CircuitState;
  performance: CircuitPerformance;
}

interface StateChange {
  from: string;
  to: string;
  timestamp: number;
  reason: string;
  triggerMetric?: string;
}

interface CallMetric {
  timestamp: number;
  success: boolean;
  duration: number;
  error?: string;
}

interface CircuitPerformance {
  availabilityRate: number;
  averageResponseTime: number;
  errorRate: number;
  recoveryTime: number;
}

interface AIProvider {
  id: string;
  name: string;
  endpoint: string;
  credentials: ProviderCredentials;
  capabilities: ProviderCapabilities;
  health: ProviderHealth;
  metrics: ProviderMetrics;
  priority: number;
  costPerToken: number;
}

interface ProviderCredentials {
  apiKey: string;
  endpoint: string;
  region?: string;
}

interface ProviderCapabilities {
  models: string[];
  maxTokens: number;
  streaming: boolean;
  functionCalling: boolean;
  multimodal: boolean;
}

interface ProviderHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  errorRate: number;
  lastCheck: number;
  availability: number;
  uptime: number;
}

interface ProviderMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  costEfficiency: number;
  rateLimitHits: number;
}

interface RateLimitInfo {
  provider: string;
  limit: number;
  remaining: number;
  resetTime: number;
  windowDuration: number;
  quotaType: string;
}

interface RateLimitState {
  limits: Map<string, RateLimitInfo>;
  queues: Map<string, QueuedRequest[]>;
  throttlingActive: boolean;
  adaptiveRate: number;
}

interface QueuedRequest {
  id: string;
  request: any;
  priority: number;
  queueTime: number;
  maxWait: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

interface ResilienceMetrics {
  retrySuccess: RetryMetrics;
  circuitBreaker: CircuitMetrics;
  providerHealth: ProviderHealthMetrics;
  rateLimits: RateLimitMetrics;
  errorRates: ErrorMetrics;
  performance: PerformanceMetrics;
}

interface RetryMetrics {
  totalRetries: number;
  successfulRetries: number;
  failedRetries: number;
  averageRetryCount: number;
  maxRetryCount: number;
  totalRetryTime: number;
}

interface ProviderHealthMetrics {
  healthyProviders: number;
  degradedProviders: number;
  unhealthyProviders: number;
  averageLatency: number;
  averageAvailability: number;
  failoverEvents: number;
}

interface RateLimitMetrics {
  totalLimitHits: number;
  queuedRequests: number;
  throttledRequests: number;
  averageQueueTime: number;
  adaptiveRateChanges: number;
}

interface ErrorMetrics {
  totalErrors: number;
  recoverableErrors: number;
  criticalErrors: number;
  errorsByType: Map<string, number>;
  errorsByProvider: Map<string, number>;
  meanTimeToRecovery: number;
}

interface PerformanceMetrics {
  overallLatency: number;
  successRate: number;
  availability: number;
  throughput: number;
  resilenceOverhead: number;
}

// ===== RETRY MANAGER HOOK =====

const useRetryManager = () => {
  const [retryHistory, setRetryHistory] = useState<RetryExecution[]>([]);
  const [retryMetrics, setRetryMetrics] = useState<RetryMetrics>({
    totalRetries: 0,
    successfulRetries: 0,
    failedRetries: 0,
    averageRetryCount: 0,
    maxRetryCount: 0,
    totalRetryTime: 0
  });

  const defaultRetryPolicy: RetryPolicy = {
    maxRetries: 3,
    backoffStrategy: {
      type: 'exponential',
      baseDelay: 1000,
      maxDelay: 30000,
      multiplier: 2
    },
    jitterStrategy: {
      type: 'full',
      factor: 0.1
    },
    conditions: [
      {
        errorType: 'network',
        statusCodes: [429, 502, 503, 504],
        messagePatterns: ['timeout', 'connection', 'temporary'],
        retryable: true
      },
      {
        errorType: 'rate_limit',
        statusCodes: [429],
        messagePatterns: ['rate limit', 'quota exceeded'],
        retryable: true
      },
      {
        errorType: 'auth',
        statusCodes: [401, 403],
        messagePatterns: ['unauthorized', 'forbidden'],
        retryable: false
      }
    ],
    circuitBreakerThreshold: 5
  };

  const classifyError = useCallback((error: any): ErrorDetails => {
    const errorDetails: ErrorDetails = {
      type: 'unknown',
      message: error.message || 'Unknown error',
      statusCode: error.status || error.statusCode,
      provider: error.provider,
      recoverable: true,
      retryable: false,
      severity: 'medium'
    };

    // Classify by status code
    if (errorDetails.statusCode) {
      if ([401, 403, 404].includes(errorDetails.statusCode)) {
        errorDetails.type = 'client_error';
        errorDetails.retryable = false;
        errorDetails.recoverable = false;
        errorDetails.severity = 'high';
      } else if ([429].includes(errorDetails.statusCode)) {
        errorDetails.type = 'rate_limit';
        errorDetails.retryable = true;
        errorDetails.recoverable = true;
        errorDetails.severity = 'medium';
      } else if ([500, 502, 503, 504].includes(errorDetails.statusCode)) {
        errorDetails.type = 'server_error';
        errorDetails.retryable = true;
        errorDetails.recoverable = true;
        errorDetails.severity = 'high';
      }
    }

    // Classify by message patterns
    const message = errorDetails.message.toLowerCase();
    if (message.includes('timeout') || message.includes('connection')) {
      errorDetails.type = 'network';
      errorDetails.retryable = true;
      errorDetails.severity = 'medium';
    } else if (message.includes('rate limit') || message.includes('quota')) {
      errorDetails.type = 'rate_limit';
      errorDetails.retryable = true;
      errorDetails.severity = 'low';
    } else if (message.includes('authentication') || message.includes('authorization')) {
      errorDetails.type = 'auth';
      errorDetails.retryable = false;
      errorDetails.recoverable = false;
      errorDetails.severity = 'critical';
    }

    return errorDetails;
  }, []);

  const calculateDelay = useCallback((
    attempt: number, 
    backoffStrategy: BackoffStrategy, 
    jitterStrategy: JitterStrategy
  ): number => {
    let delay = backoffStrategy.baseDelay;

    // Apply backoff strategy
    switch (backoffStrategy.type) {
      case 'exponential':
        delay = Math.min(
          backoffStrategy.baseDelay * Math.pow(backoffStrategy.multiplier, attempt - 1),
          backoffStrategy.maxDelay
        );
        break;
      case 'linear':
        delay = Math.min(
          backoffStrategy.baseDelay * attempt,
          backoffStrategy.maxDelay
        );
        break;
      case 'fixed':
        delay = backoffStrategy.baseDelay;
        break;
    }

    // Apply jitter strategy
    switch (jitterStrategy.type) {
      case 'full':
        delay = delay * (1 + (Math.random() - 0.5) * 2 * jitterStrategy.factor);
        break;
      case 'equal':
        delay = delay * (1 - jitterStrategy.factor) + 
               (delay * jitterStrategy.factor * Math.random());
        break;
      case 'decorrelated':
        delay = Math.min(
          backoffStrategy.maxDelay,
          Math.max(backoffStrategy.baseDelay, delay * (1 + Math.random() * jitterStrategy.factor))
        );
        break;
    }

    return Math.max(0, Math.floor(delay));
  }, []);

  const shouldRetry = useCallback((error: ErrorDetails, attempt: number, policy: RetryPolicy): boolean => {
    if (attempt >= policy.maxRetries) {
      return false;
    }

    if (!error.retryable) {
      return false;
    }

    // Check retry conditions
    const matchingCondition = policy.conditions.find(condition => {
      if (condition.errorType !== error.type) return false;
      
      if (condition.statusCodes.length > 0 && error.statusCode) {
        if (!condition.statusCodes.includes(error.statusCode)) return false;
      }

      if (condition.messagePatterns.length > 0) {
        const messageMatch = condition.messagePatterns.some(pattern => 
          error.message.toLowerCase().includes(pattern.toLowerCase())
        );
        if (!messageMatch) return false;
      }

      return true;
    });

    return matchingCondition ? matchingCondition.retryable : false;
  }, []);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    policy: RetryPolicy = defaultRetryPolicy
  ): Promise<T> => {
    const executionId = 'retry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    let attempt = 0;
    let lastError: ErrorDetails | null = null;
    const startTime = Date.now();

    while (attempt < policy.maxRetries) {
      attempt++;
      const attemptStart = Date.now();

      try {
        const result = await operation();
        
        // Record successful retry execution
        const execution: RetryExecution = {
          attempt,
          delay: attempt > 1 ? calculateDelay(attempt - 1, policy.backoffStrategy, policy.jitterStrategy) : 0,
          error: lastError || { type: 'none', message: '', recoverable: true, retryable: false, severity: 'low' },
          success: true,
          totalTime: Date.now() - startTime,
          startTime
        };

        setRetryHistory(prev => [execution, ...prev].slice(0, 100));
        
        if (attempt > 1) {
          setRetryMetrics(prev => ({
            ...prev,
            totalRetries: prev.totalRetries + (attempt - 1),
            successfulRetries: prev.successfulRetries + 1,
            averageRetryCount: (prev.totalRetries + (attempt - 1)) / (prev.successfulRetries + prev.failedRetries + 1),
            maxRetryCount: Math.max(prev.maxRetryCount, attempt - 1),
            totalRetryTime: prev.totalRetryTime + (Date.now() - startTime)
          }));
        }

        return result;

      } catch (error) {
        lastError = classifyError(error);
        
        if (!shouldRetry(lastError, attempt, policy)) {
          // Record failed retry execution
          const execution: RetryExecution = {
            attempt,
            delay: 0,
            error: lastError,
            success: false,
            totalTime: Date.now() - startTime,
            startTime
          };

          setRetryHistory(prev => [execution, ...prev].slice(0, 100));
          setRetryMetrics(prev => ({
            ...prev,
            totalRetries: prev.totalRetries + Math.max(0, attempt - 1),
            failedRetries: prev.failedRetries + 1,
            averageRetryCount: (prev.totalRetries + Math.max(0, attempt - 1)) / (prev.successfulRetries + prev.failedRetries + 1),
            maxRetryCount: Math.max(prev.maxRetryCount, attempt - 1),
            totalRetryTime: prev.totalRetryTime + (Date.now() - startTime)
          }));

          throw error;
        }

        if (attempt < policy.maxRetries) {
          const delay = calculateDelay(attempt, policy.backoffStrategy, policy.jitterStrategy);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }, [classifyError, shouldRetry, calculateDelay]);

  const clearRetryHistory = () => {
    setRetryHistory([]);
    setRetryMetrics({
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageRetryCount: 0,
      maxRetryCount: 0,
      totalRetryTime: 0
    });
  };

  return {
    executeWithRetry,
    retryHistory,
    retryMetrics,
    classifyError,
    clearRetryHistory,
    defaultRetryPolicy
  };
};

// ===== CIRCUIT BREAKER HOOK =====

const useCircuitBreaker = () => {
  const [circuitState, setCircuitState] = useState<CircuitState>({
    current: 'closed',
    failureCount: 0,
    successCount: 0,
    lastFailureTime: 0,
    nextAttemptTime: 0,
    totalCalls: 0,
    failureRate: 0
  });

  const [circuitMetrics, setCircuitMetrics] = useState<CircuitMetrics>({
    stateChanges: [],
    callMetrics: [],
    currentState: circuitState,
    performance: {
      availabilityRate: 100,
      averageResponseTime: 0,
      errorRate: 0,
      recoveryTime: 0
    }
  });

  const config: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 30000,
    successThreshold: 3,
    monitoringWindow: 60000,
    halfOpenMaxCalls: 3
  };

  const changeState = useCallback((newState: CircuitState['current'], reason: string) => {
    setCircuitState(prev => {
      const stateChange: StateChange = {
        from: prev.current,
        to: newState,
        timestamp: Date.now(),
        reason
      };

      setCircuitMetrics(prevMetrics => ({
        ...prevMetrics,
        stateChanges: [stateChange, ...prevMetrics.stateChanges].slice(0, 50),
        currentState: { ...prev, current: newState }
      }));

      return { ...prev, current: newState };
    });
  }, []);

  const recordCall = useCallback((success: boolean, duration: number, error?: string) => {
    const callMetric: CallMetric = {
      timestamp: Date.now(),
      success,
      duration,
      error
    };

    setCircuitState(prev => {
      const newState = { ...prev };
      newState.totalCalls++;

      if (success) {
        newState.successCount++;
        if (prev.current === 'half-open' && newState.successCount >= config.successThreshold) {
          changeState('closed', 'Success threshold reached in half-open state');
          newState.failureCount = 0;
          newState.successCount = 0;
        }
      } else {
        newState.failureCount++;
        newState.lastFailureTime = Date.now();

        if (prev.current === 'closed' && newState.failureCount >= config.failureThreshold) {
          changeState('open', 'Failure threshold exceeded');
          newState.nextAttemptTime = Date.now() + config.recoveryTimeout;
        } else if (prev.current === 'half-open') {
          changeState('open', 'Failure in half-open state');
          newState.nextAttemptTime = Date.now() + config.recoveryTimeout;
          newState.successCount = 0;
        }
      }

      // Calculate failure rate over monitoring window
      const windowStart = Date.now() - config.monitoringWindow;
      const recentCalls = circuitMetrics.callMetrics.filter(call => call.timestamp > windowStart);
      if (recentCalls.length > 0) {
        const failures = recentCalls.filter(call => !call.success).length;
        newState.failureRate = failures / recentCalls.length;
      }

      return newState;
    });

    setCircuitMetrics(prev => ({
      ...prev,
      callMetrics: [callMetric, ...prev.callMetrics].slice(0, 1000),
      performance: {
        ...prev.performance,
        averageResponseTime: (prev.performance.averageResponseTime + duration) / 2,
        errorRate: success ? prev.performance.errorRate * 0.99 : prev.performance.errorRate * 1.01
      }
    }));
  }, [config, circuitMetrics.callMetrics, changeState]);

  const canExecute = useCallback((): { allowed: boolean; reason?: string } => {
    switch (circuitState.current) {
      case 'closed':
        return { allowed: true };
      
      case 'open':
        if (Date.now() >= circuitState.nextAttemptTime) {
          changeState('half-open', 'Recovery timeout elapsed');
          return { allowed: true };
        }
        return { 
          allowed: false, 
          reason: 'Circuit breaker is open - waiting for recovery timeout' 
        };
      
      case 'half-open':
        const halfOpenCalls = circuitMetrics.callMetrics
          .filter(call => call.timestamp > (circuitState.nextAttemptTime - config.recoveryTimeout))
          .length;
        
        if (halfOpenCalls < config.halfOpenMaxCalls) {
          return { allowed: true };
        }
        return { 
          allowed: false, 
          reason: 'Half-open call limit reached' 
        };
      
      default:
        return { allowed: false, reason: 'Unknown circuit state' };
    }
  }, [circuitState, circuitMetrics.callMetrics, config, changeState]);

  const executeWithCircuitBreaker = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    const { allowed, reason } = canExecute();
    
    if (!allowed) {
      throw new Error('Circuit breaker: ' + reason);
    }

    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      recordCall(true, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      recordCall(false, duration, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [canExecute, recordCall]);

  const resetCircuitBreaker = () => {
    setCircuitState({
      current: 'closed',
      failureCount: 0,
      successCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      totalCalls: 0,
      failureRate: 0
    });
    setCircuitMetrics({
      stateChanges: [],
      callMetrics: [],
      currentState: circuitState,
      performance: {
        availabilityRate: 100,
        averageResponseTime: 0,
        errorRate: 0,
        recoveryTime: 0
      }
    });
  };

  return {
    circuitState,
    circuitMetrics,
    config,
    executeWithCircuitBreaker,
    canExecute,
    resetCircuitBreaker
  };
};

// ===== FALLBACK PROVIDER HOOK =====

const useFallbackProvider = () => {
  const [providers, setProviders] = useState<AIProvider[]>([
    {
      id: 'openai',
      name: 'OpenAI GPT-4',
      endpoint: 'https://api.openai.com',
      credentials: { apiKey: 'sk-...', endpoint: 'https://api.openai.com' },
      capabilities: {
        models: ['gpt-4', 'gpt-3.5-turbo'],
        maxTokens: 4096,
        streaming: true,
        functionCalling: true,
        multimodal: true
      },
      health: {
        status: 'healthy',
        latency: 250,
        errorRate: 0.02,
        lastCheck: Date.now(),
        availability: 99.9,
        uptime: 99.95
      },
      metrics: {
        totalRequests: 1500,
        successfulRequests: 1470,
        failedRequests: 30,
        averageLatency: 280,
        costEfficiency: 0.85,
        rateLimitHits: 5
      },
      priority: 1,
      costPerToken: 0.00003
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      endpoint: 'https://api.anthropic.com',
      credentials: { apiKey: 'sk-...', endpoint: 'https://api.anthropic.com' },
      capabilities: {
        models: ['claude-3-opus', 'claude-3-sonnet'],
        maxTokens: 4096,
        streaming: true,
        functionCalling: false,
        multimodal: true
      },
      health: {
        status: 'healthy',
        latency: 320,
        errorRate: 0.01,
        lastCheck: Date.now(),
        availability: 99.8,
        uptime: 99.9
      },
      metrics: {
        totalRequests: 800,
        successfulRequests: 792,
        failedRequests: 8,
        averageLatency: 310,
        costEfficiency: 0.90,
        rateLimitHits: 2
      },
      priority: 2,
      costPerToken: 0.000015
    },
    {
      id: 'cohere',
      name: 'Cohere Command',
      endpoint: 'https://api.cohere.ai',
      credentials: { apiKey: 'co-...', endpoint: 'https://api.cohere.ai' },
      capabilities: {
        models: ['command', 'command-light'],
        maxTokens: 2048,
        streaming: true,
        functionCalling: false,
        multimodal: false
      },
      health: {
        status: 'degraded',
        latency: 450,
        errorRate: 0.05,
        lastCheck: Date.now(),
        availability: 98.5,
        uptime: 99.2
      },
      metrics: {
        totalRequests: 300,
        successfulRequests: 285,
        failedRequests: 15,
        averageLatency: 420,
        costEfficiency: 0.95,
        rateLimitHits: 8
      },
      priority: 3,
      costPerToken: 0.000008
    }
  ]);

  const [activeProvider, setActiveProvider] = useState<string>('openai');
  const [failoverHistory, setFailoverHistory] = useState<any[]>([]);

  const checkProviderHealth = useCallback(async (provider: AIProvider): Promise<ProviderHealth> => {
    const startTime = Date.now();
    
    try {
      // Simulate health check API call
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      
      const latency = Date.now() - startTime;
      const simulatedErrorRate = Math.random() * 0.1; // 0-10% error rate
      const simulatedAvailability = 95 + Math.random() * 5; // 95-100% availability

      return {
        status: simulatedErrorRate < 0.03 ? 'healthy' : simulatedErrorRate < 0.08 ? 'degraded' : 'unhealthy',
        latency,
        errorRate: simulatedErrorRate,
        lastCheck: Date.now(),
        availability: simulatedAvailability,
        uptime: provider.health.uptime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        errorRate: 1.0,
        lastCheck: Date.now(),
        availability: 0,
        uptime: provider.health.uptime * 0.9
      };
    }
  }, []);

  const selectBestProvider = useCallback((requirements?: {
    model?: string;
    streaming?: boolean;
    functionCalling?: boolean;
    multimodal?: boolean;
    maxLatency?: number;
    maxCost?: number;
  }): AIProvider | null => {
    // Filter providers based on health and requirements
    let availableProviders = providers.filter(provider => {
      if (provider.health.status === 'unhealthy') return false;
      
      if (requirements) {
        if (requirements.model && !provider.capabilities.models.includes(requirements.model)) return false;
        if (requirements.streaming && !provider.capabilities.streaming) return false;
        if (requirements.functionCalling && !provider.capabilities.functionCalling) return false;
        if (requirements.multimodal && !provider.capabilities.multimodal) return false;
        if (requirements.maxLatency && provider.health.latency > requirements.maxLatency) return false;
        if (requirements.maxCost && provider.costPerToken > requirements.maxCost) return false;
      }
      
      return true;
    });

    if (availableProviders.length === 0) {
      return null;
    }

    // Score providers based on multiple factors
    availableProviders = availableProviders.map(provider => {
      let score = 0;
      
      // Health score (40% weight)
      const healthScore = provider.health.status === 'healthy' ? 1.0 : 
                         provider.health.status === 'degraded' ? 0.6 : 0.2;
      score += healthScore * 0.4;
      
      // Performance score (30% weight)
      const latencyScore = Math.max(0, 1 - (provider.health.latency / 1000));
      const availabilityScore = provider.health.availability / 100;
      score += (latencyScore * 0.5 + availabilityScore * 0.5) * 0.3;
      
      // Cost efficiency score (20% weight)
      const costScore = Math.max(0, 1 - (provider.costPerToken / 0.0001));
      score += costScore * 0.2;
      
      // Priority score (10% weight)
      const priorityScore = Math.max(0, 1 - (provider.priority / 10));
      score += priorityScore * 0.1;

      return { ...provider, score };
    });

    // Sort by score and return best provider
    availableProviders.sort((a, b) => (b as any).score - (a as any).score);
    return availableProviders[0];
  }, [providers]);

  const executeWithFallback = useCallback(async <T>(
    operation: (provider: AIProvider) => Promise<T>,
    requirements?: Parameters<typeof selectBestProvider>[0]
  ): Promise<T> => {
    const availableProviders = providers
      .filter(p => p.health.status !== 'unhealthy')
      .sort((a, b) => a.priority - b.priority);

    let lastError: Error | null = null;
    
    for (const provider of availableProviders) {
      try {
        // Update active provider
        setActiveProvider(provider.id);
        
        const result = await operation(provider);
        
        // Update provider metrics on success
        setProviders(prev => prev.map(p => 
          p.id === provider.id 
            ? {
                ...p,
                metrics: {
                  ...p.metrics,
                  totalRequests: p.metrics.totalRequests + 1,
                  successfulRequests: p.metrics.successfulRequests + 1
                }
              }
            : p
        ));

        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Update provider metrics on failure
        setProviders(prev => prev.map(p => 
          p.id === provider.id 
            ? {
                ...p,
                metrics: {
                  ...p.metrics,
                  totalRequests: p.metrics.totalRequests + 1,
                  failedRequests: p.metrics.failedRequests + 1
                },
                health: {
                  ...p.health,
                  errorRate: Math.min(1, p.health.errorRate + 0.01)
                }
              }
            : p
        ));

        // Log failover event
        setFailoverHistory(prev => [{
          timestamp: Date.now(),
          fromProvider: provider.id,
          toProvider: availableProviders[availableProviders.indexOf(provider) + 1]?.id || 'none',
          error: lastError?.message,
          reason: 'Provider failure'
        }, ...prev].slice(0, 50));

        // Continue to next provider
        continue;
      }
    }

    throw lastError || new Error('All providers failed');
  }, [providers]);

  const runHealthChecks = useCallback(async () => {
    const healthPromises = providers.map(async (provider) => {
      const health = await checkProviderHealth(provider);
      return { providerId: provider.id, health };
    });

    const healthResults = await Promise.all(healthPromises);
    
    setProviders(prev => prev.map(provider => {
      const healthResult = healthResults.find(result => result.providerId === provider.id);
      return healthResult 
        ? { ...provider, health: healthResult.health }
        : provider;
    }));
  }, [providers, checkProviderHealth]);

  // Run health checks periodically
  useEffect(() => {
    const interval = setInterval(runHealthChecks, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [runHealthChecks]);

  return {
    providers,
    activeProvider,
    failoverHistory,
    selectBestProvider,
    executeWithFallback,
    runHealthChecks
  };
};

// ===== RATE LIMIT HANDLER HOOK =====

const useRateLimitHandler = () => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    limits: new Map(),
    queues: new Map(),
    throttlingActive: false,
    adaptiveRate: 1.0
  });

  const [rateLimitMetrics, setRateLimitMetrics] = useState<RateLimitMetrics>({
    totalLimitHits: 0,
    queuedRequests: 0,
    throttledRequests: 0,
    averageQueueTime: 0,
    adaptiveRateChanges: 0
  });

  const parseRateLimitHeaders = useCallback((headers: any, provider: string): RateLimitInfo | null => {
    try {
      // Different providers use different header formats
      let limit, remaining, resetTime, windowDuration;

      if (headers['x-ratelimit-limit-requests'] || headers['x-ratelimit-remaining-requests']) {
        // OpenAI format
        limit = parseInt(headers['x-ratelimit-limit-requests'] || '0');
        remaining = parseInt(headers['x-ratelimit-remaining-requests'] || '0');
        resetTime = new Date(headers['x-ratelimit-reset-requests'] || Date.now()).getTime();
        windowDuration = 60000; // 1 minute
      } else if (headers['anthropic-ratelimit-requests-limit']) {
        // Anthropic format
        limit = parseInt(headers['anthropic-ratelimit-requests-limit'] || '0');
        remaining = parseInt(headers['anthropic-ratelimit-requests-remaining'] || '0');
        resetTime = new Date(headers['anthropic-ratelimit-requests-reset'] || Date.now()).getTime();
        windowDuration = 60000;
      } else if (headers['x-api-key-limit']) {
        // Generic format
        limit = parseInt(headers['x-api-key-limit'] || '0');
        remaining = parseInt(headers['x-api-key-remaining'] || '0');
        resetTime = Date.now() + (parseInt(headers['retry-after'] || '60') * 1000);
        windowDuration = 60000;
      }

      if (limit && remaining !== undefined) {
        return {
          provider,
          limit,
          remaining,
          resetTime,
          windowDuration,
          quotaType: 'requests'
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing rate limit headers:', error);
      return null;
    }
  }, []);

  const updateRateLimits = useCallback((headers: any, provider: string) => {
    const rateLimitInfo = parseRateLimitHeaders(headers, provider);
    
    if (rateLimitInfo) {
      setRateLimitState(prev => {
        const newLimits = new Map(prev.limits);
        newLimits.set(provider, rateLimitInfo);
        
        // Activate throttling if remaining requests are low
        const throttlingThreshold = rateLimitInfo.limit * 0.1; // 10% of limit
        const shouldThrottle = rateLimitInfo.remaining < throttlingThreshold;
        
        return {
          ...prev,
          limits: newLimits,
          throttlingActive: shouldThrottle
        };
      });
    }
  }, [parseRateLimitHeaders]);

  const calculateDelay = useCallback((provider: string): number => {
    const limitInfo = rateLimitState.limits.get(provider);
    
    if (!limitInfo) return 0;
    
    const now = Date.now();
    const timeUntilReset = Math.max(0, limitInfo.resetTime - now);
    
    if (limitInfo.remaining === 0) {
      // No requests remaining, wait until reset
      return timeUntilReset;
    }
    
    if (rateLimitState.throttlingActive && limitInfo.remaining < limitInfo.limit * 0.2) {
      // Adaptive throttling when approaching limits
      const remainingRatio = limitInfo.remaining / limitInfo.limit;
      const baseDelay = timeUntilReset / Math.max(1, limitInfo.remaining);
      const throttlingMultiplier = Math.max(1, 2 - remainingRatio * 2);
      
      return baseDelay * throttlingMultiplier * rateLimitState.adaptiveRate;
    }
    
    return 0;
  }, [rateLimitState]);

  const executeWithRateLimit = useCallback(async <T>(
    operation: () => Promise<T>,
    provider: string
  ): Promise<T> => {
    const delay = calculateDelay(provider);
    
    if (delay > 0) {
      setRateLimitMetrics(prev => ({
        ...prev,
        throttledRequests: prev.throttledRequests + 1
      }));
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const startTime = Date.now();
    
    try {
      const result = await operation();
      
      // Successful request - adjust adaptive rate
      setRateLimitState(prev => ({
        ...prev,
        adaptiveRate: Math.max(0.1, prev.adaptiveRate * 0.99)
      }));
      
      return result;
      
    } catch (error: any) {
      // Check if it's a rate limit error
      if (error.status === 429 || error.message?.includes('rate limit')) {
        setRateLimitMetrics(prev => ({
          ...prev,
          totalLimitHits: prev.totalLimitHits + 1
        }));
        
        // Increase adaptive rate to be more conservative
        setRateLimitState(prev => ({
          ...prev,
          adaptiveRate: Math.min(5.0, prev.adaptiveRate * 1.5)
        }));
        
        // Parse retry-after header if available
        const retryAfter = error.headers?.['retry-after'];
        if (retryAfter) {
          const retryDelay = parseInt(retryAfter) * 1000;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return executeWithRateLimit(operation, provider);
        }
      }
      
      throw error;
    }
  }, [calculateDelay]);

  const queueRequest = useCallback(<T>(
    operation: () => Promise<T>,
    provider: string,
    priority: number = 1,
    maxWait: number = 30000
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        request: operation,
        priority,
        queueTime: Date.now(),
        maxWait,
        resolve,
        reject
      };

      setRateLimitState(prev => {
        const newQueues = new Map(prev.queues);
        const providerQueue = newQueues.get(provider) || [];
        
        // Insert request based on priority (higher priority first)
        const insertIndex = providerQueue.findIndex(req => req.priority < priority);
        if (insertIndex === -1) {
          providerQueue.push(queuedRequest);
        } else {
          providerQueue.splice(insertIndex, 0, queuedRequest);
        }
        
        newQueues.set(provider, providerQueue);
        
        setRateLimitMetrics(prevMetrics => ({
          ...prevMetrics,
          queuedRequests: prevMetrics.queuedRequests + 1
        }));
        
        return { ...prev, queues: newQueues };
      });

      // Set timeout for max wait
      setTimeout(() => {
        reject(new Error('Request timeout: exceeded maximum wait time'));
      }, maxWait);
    });
  }, []);

  const processQueue = useCallback(async (provider: string) => {
    const queue = rateLimitState.queues.get(provider);
    if (!queue || queue.length === 0) return;

    const request = queue.shift();
    if (!request) return;

    const queueTime = Date.now() - request.queueTime;
    
    try {
      const result = await executeWithRateLimit(request.request as () => Promise<any>, provider);
      
      setRateLimitMetrics(prev => ({
        ...prev,
        averageQueueTime: (prev.averageQueueTime + queueTime) / 2
      }));
      
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    }

    // Update queue state
    setRateLimitState(prev => {
      const newQueues = new Map(prev.queues);
      newQueues.set(provider, queue);
      return { ...prev, queues: newQueues };
    });
  }, [rateLimitState.queues, executeWithRateLimit]);

  // Process queues periodically
  useEffect(() => {
    const interval = setInterval(() => {
      rateLimitState.queues.forEach((_, provider) => {
        processQueue(provider);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitState.queues, processQueue]);

  return {
    rateLimitState,
    rateLimitMetrics,
    updateRateLimits,
    executeWithRateLimit,
    queueRequest,
    processQueue
  };
};

// ===== RESILIENCE MONITOR COMPONENT =====

interface ResilienceMonitorProps {
  retryManager: ReturnType<typeof useRetryManager>;
  circuitBreaker: ReturnType<typeof useCircuitBreaker>;
  fallbackProvider: ReturnType<typeof useFallbackProvider>;
  rateLimitHandler: ReturnType<typeof useRateLimitHandler>;
}

const ResilienceMonitor: React.FC<ResilienceMonitorProps> = ({
  retryManager,
  circuitBreaker,
  fallbackProvider,
  rateLimitHandler
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'retry' | 'circuit' | 'provider' | 'ratelimit'>('retry');

  const renderMetricCards = () => {
    switch (selectedMetric) {
      case 'retry':
        return (
          <Grid>
            <Grid.Col span={3}>
              <Card withBorder>
                <Group>
                  <IconRefresh color="blue" />
                  <div>
                    <Text size="xs" color="dimmed">Total Retries</Text>
                    <Text size="xl" weight={500}>{retryManager.retryMetrics.totalRetries}</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={3}>
              <Card withBorder>
                <Group>
                  <IconCheck color="green" />
                  <div>
                    <Text size="xs" color="dimmed">Success Rate</Text>
                    <Text size="xl" weight={500}>
                      {retryManager.retryMetrics.totalRetries > 0 
                        ? ((retryManager.retryMetrics.successfulRetries / (retryManager.retryMetrics.successfulRetries + retryManager.retryMetrics.failedRetries)) * 100).toFixed(1)
                        : 0}%
                    </Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={3}>
              <Card withBorder>
                <Group>
                  <IconClock color="orange" />
                  <div>
                    <Text size="xs" color="dimmed">Avg Retry Count</Text>
                    <Text size="xl" weight={500}>{retryManager.retryMetrics.averageRetryCount.toFixed(1)}</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={3}>
              <Card withBorder>
                <Group>
                  <IconTarget color="purple" />
                  <div>
                    <Text size="xs" color="dimmed">Max Retries</Text>
                    <Text size="xl" weight={500}>{retryManager.retryMetrics.maxRetryCount}</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        );

      case 'circuit':
        const stateColor = {
          closed: 'green',
          open: 'red',
          'half-open': 'yellow'
        }[circuitBreaker.circuitState.current] || 'gray';

        return (
          <Grid>
            <Grid.Col span={6}>
              <Card withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="sm" color="dimmed">Circuit State</Text>
                    <Group>
                      <Badge color={stateColor} size="lg">
                        {circuitBreaker.circuitState.current.toUpperCase()}
                      </Badge>
                      <Text size="sm" color="dimmed">
                        Failures: {circuitBreaker.circuitState.failureCount}
                      </Text>
                    </Group>
                  </div>
                  <RingProgress
                    size={80}
                    thickness={8}
                    sections={[{ 
                      value: (1 - circuitBreaker.circuitState.failureRate) * 100, 
                      color: stateColor 
                    }]}
                  />
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card withBorder>
                <Stack spacing="xs">
                  <Group justify="space-between">
                    <Text size="sm">Total Calls</Text>
                    <Text weight={500}>{circuitBreaker.circuitState.totalCalls}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">Failure Rate</Text>
                    <Text weight={500}>{(circuitBreaker.circuitState.failureRate * 100).toFixed(1)}%</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">State Changes</Text>
                    <Text weight={500}>{circuitBreaker.circuitMetrics.stateChanges.length}</Text>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        );

      case 'provider':
        const healthyProviders = fallbackProvider.providers.filter(p => p.health.status === 'healthy').length;
        const totalProviders = fallbackProvider.providers.length;

        return (
          <Grid>
            <Grid.Col span={12}>
              <Card withBorder>
                <Text weight={500} mb="md">Provider Health Status</Text>
                <Grid>
                  {fallbackProvider.providers.map((provider) => (
                    <Grid.Col key={provider.id} span={4}>
                      <Paper p="sm" withBorder>
                        <Group justify="space-between" mb="xs">
                          <Text size="sm" weight={500}>{provider.name}</Text>
                          <Badge 
                            color={
                              provider.health.status === 'healthy' ? 'green' : 
                              provider.health.status === 'degraded' ? 'yellow' : 'red'
                            }
                            size="sm"
                          >
                            {provider.health.status}
                          </Badge>
                        </Group>
                        <Stack spacing="xs">
                          <Group justify="space-between">
                            <Text size="xs" color="dimmed">Latency</Text>
                            <Text size="xs">{provider.health.latency}ms</Text>
                          </Group>
                          <Group justify="space-between">
                            <Text size="xs" color="dimmed">Error Rate</Text>
                            <Text size="xs">{(provider.health.errorRate * 100).toFixed(1)}%</Text>
                          </Group>
                          <Group justify="space-between">
                            <Text size="xs" color="dimmed">Availability</Text>
                            <Text size="xs">{provider.health.availability.toFixed(1)}%</Text>
                          </Group>
                        </Stack>
                      </Paper>
                    </Grid.Col>
                  ))}
                </Grid>
              </Card>
            </Grid.Col>
          </Grid>
        );

      case 'ratelimit':
        return (
          <Grid>
            <Grid.Col span={3}>
              <Card withBorder>
                <Group>
                  <IconAlertTriangle color="orange" />
                  <div>
                    <Text size="xs" color="dimmed">Limit Hits</Text>
                    <Text size="xl" weight={500}>{rateLimitHandler.rateLimitMetrics.totalLimitHits}</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={3}>
              <Card withBorder>
                <Group>
                  <IconClock color="blue" />
                  <div>
                    <Text size="xs" color="dimmed">Queued Requests</Text>
                    <Text size="xl" weight={500}>{rateLimitHandler.rateLimitMetrics.queuedRequests}</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={3}>
              <Card withBorder>
                <Group>
                  <IconBolt color="red" />
                  <div>
                    <Text size="xs" color="dimmed">Throttled</Text>
                    <Text size="xl" weight={500}>{rateLimitHandler.rateLimitMetrics.throttledRequests}</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={3}>
              <Card withBorder>
                <Group>
                  <IconTarget color="purple" />
                  <div>
                    <Text size="xs" color="dimmed">Avg Queue Time</Text>
                    <Text size="xl" weight={500}>{rateLimitHandler.rateLimitMetrics.averageQueueTime.toFixed(0)}ms</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Text weight={500}>Resilience Monitor</Text>
        <Select
          value={selectedMetric}
          onChange={(value) => setSelectedMetric(value as any)}
          data={[
            { value: 'retry', label: 'Retry Manager' },
            { value: 'circuit', label: 'Circuit Breaker' },
            { value: 'provider', label: 'Provider Health' },
            { value: 'ratelimit', label: 'Rate Limits' }
          ]}
        />
      </Group>
      
      {renderMetricCards()}
    </Stack>
  );
};

// ===== MAIN COMPONENT =====

export const AIErrorHandlingResilienceExercise: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>('retry');
  
  const retryManager = useRetryManager();
  const circuitBreaker = useCircuitBreaker();
  const fallbackProvider = useFallbackProvider();
  const rateLimitHandler = useRateLimitHandler();

  const [testScenario, setTestScenario] = useState<'success' | 'failure' | 'timeout' | 'ratelimit'>('success');

  const simulateAPICall = useCallback(async (): Promise<string> => {
    const delay = 100 + Math.random() * 400; // 100-500ms delay
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    switch (testScenario) {
      case 'success':
        if (Math.random() < 0.1) { // 10% failure rate for success scenario
          throw new Error('Random server error');
        }
        return 'API call successful';
      
      case 'failure':
        throw new Error('Simulated server error (status: 500)');
      
      case 'timeout':
        await new Promise(resolve => setTimeout(resolve, 5000));
        return 'Should have timed out';
      
      case 'ratelimit':
        const error = new Error('Rate limit exceeded') as any;
        error.status = 429;
        error.headers = { 'retry-after': '60' };
        throw error;
      
      default:
        return 'Default response';
    }
  }, [testScenario]);

  const handleRetryTest = async () => {
    try {
      const result = await retryManager.executeWithRetry(simulateAPICall);
      notifications.show({
        title: 'Retry Test Complete',
        message: result,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Retry Test Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        color: 'red'
      });
    }
  };

  const handleCircuitBreakerTest = async () => {
    try {
      const result = await circuitBreaker.executeWithCircuitBreaker(simulateAPICall);
      notifications.show({
        title: 'Circuit Breaker Test Complete',
        message: result,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Circuit Breaker Test Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        color: 'red'
      });
    }
  };

  const handleFallbackTest = async () => {
    try {
      const result = await fallbackProvider.executeWithFallback(async (provider) => {
        // Simulate provider-specific call
        if (provider.health.status === 'unhealthy') {
          throw new Error('Provider ' + provider.name + ' is unhealthy');
        }
        return 'Response from ' + provider.name;
      });
      
      notifications.show({
        title: 'Fallback Test Complete',
        message: result,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Fallback Test Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        color: 'red'
      });
    }
  };

  const handleRateLimitTest = async () => {
    try {
      const result = await rateLimitHandler.executeWithRateLimit(simulateAPICall, 'openai');
      notifications.show({
        title: 'Rate Limit Test Complete',
        message: result,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Rate Limit Test Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        color: 'red'
      });
    }
  };

  return (
    <Container size="xl" p="md">
      <Stack>
        <div>
          <h1>AI Error Handling & Resilience</h1>
          <p>Advanced error handling and resilience patterns for robust AI applications</p>
        </div>

        <Card mb="md">
          <Group>
            <Text size="sm">Test Scenario:</Text>
            <Select
              value={testScenario}
              onChange={(value) => setTestScenario(value as any)}
              data={[
                { value: 'success', label: 'Success (10% failure)' },
                { value: 'failure', label: 'Always Fail' },
                { value: 'timeout', label: 'Timeout' },
                { value: 'ratelimit', label: 'Rate Limited' }
              ]}
              size="sm"
            />
          </Group>
        </Card>

        <Tabs value={selectedDemo} onChange={setSelectedDemo || ''}>
          {/* @ts-ignore */}
          <Tabs.List>
            <Tabs.Tab value="retry">Retry Manager</Tabs.Tab>
            <Tabs.Tab value="circuit">Circuit Breaker</Tabs.Tab>
            <Tabs.Tab value="fallback">Fallback Provider</Tabs.Tab>
            <Tabs.Tab value="ratelimit">Rate Limit Handler</Tabs.Tab>
            <Tabs.Tab value="monitor">Resilience Monitor</Tabs.Tab>
          </Tabs.List>

          {/* @ts-ignore */}
          <Tabs.Panel value="retry" pt="md">
            <Stack>
              <Card>
                <Group justify="space-between" mb="md">
                  <Text weight={500}>Retry Management System</Text>
                  <Group>
                    <Button onClick={handleRetryTest} leftSection={<IconRefresh size={16} />}>
                      Test Retry
                    </Button>
                    <Button variant="light" onClick={retryManager.clearRetryHistory}>
                      Clear History
                    </Button>
                  </Group>
                </Group>

                <Grid mb="md">
                  <Grid.Col span={3}>
                    <Text size="xs" color="dimmed">Total Retries</Text>
                    <Text size="lg" weight={500}>{retryManager.retryMetrics.totalRetries}</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" color="dimmed">Successful</Text>
                    <Text size="lg" weight={500} color="green">{retryManager.retryMetrics.successfulRetries}</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" color="dimmed">Failed</Text>
                    <Text size="lg" weight={500} color="red">{retryManager.retryMetrics.failedRetries}</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" color="dimmed">Average Count</Text>
                    <Text size="lg" weight={500}>{retryManager.retryMetrics.averageRetryCount.toFixed(1)}</Text>
                  </Grid.Col>
                </Grid>
              </Card>

              {retryManager.retryHistory.length > 0 && (
                <Card>
                  <Text weight={500} mb="md">Recent Retry Executions</Text>
                  <ScrollArea.Autosize maxHeight={400}>
                    <Table striped>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Attempt</Table.Th>
                          <Table.Th>Status</Table.Th>
                          <Table.Th>Error Type</Table.Th>
                          <Table.Th>Delay</Table.Th>
                          <Table.Th>Total Time</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {retryManager.retryHistory.slice(0, 10).map((execution, index) => (
                          <Table.Tr key={index}>
                            <Table.Td>{execution.attempt}</Table.Td>
                            <Table.Td>
                              <Badge color={execution.success ? 'green' : 'red'} size="sm">
                                {execution.success ? 'Success' : 'Failed'}
                              </Badge>
                            </Table.Td>
                            <Table.Td>{execution.error.type}</Table.Td>
                            <Table.Td>{execution.delay}ms</Table.Td>
                            <Table.Td>{execution.totalTime}ms</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea.Autosize>
                </Card>
              )}
            </Stack>
          </Tabs.Panel>

          {/* @ts-ignore */}
          <Tabs.Panel value="circuit" pt="md">
            <Stack>
              <Card>
                <Group justify="space-between" mb="md">
                  <Text weight={500}>Circuit Breaker System</Text>
                  <Group>
                    <Button onClick={handleCircuitBreakerTest} leftSection={<IconShield size={16} />}>
                      Test Circuit
                    </Button>
                    <Button variant="light" onClick={circuitBreaker.resetCircuitBreaker}>
                      Reset Circuit
                    </Button>
                  </Group>
                </Group>

                <Grid mb="md">
                  <Grid.Col span={4}>
                    <Paper p="md" withBorder ta="center">
                      <Text size="xs" color="dimmed" mb="xs">Circuit State</Text>
                      <Badge 
                        size="lg"
                        color={
                          circuitBreaker.circuitState.current === 'closed' ? 'green' :
                          circuitBreaker.circuitState.current === 'open' ? 'red' : 'yellow'
                        }
                      >
                        {circuitBreaker.circuitState.current.toUpperCase()}
                      </Badge>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Paper p="md" withBorder ta="center">
                      <Text size="xs" color="dimmed" mb="xs">Failure Count</Text>
                      <Text size="xl" weight={500}>{circuitBreaker.circuitState.failureCount}</Text>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Paper p="md" withBorder ta="center">
                      <Text size="xs" color="dimmed" mb="xs">Total Calls</Text>
                      <Text size="xl" weight={500}>{circuitBreaker.circuitState.totalCalls}</Text>
                    </Paper>
                  </Grid.Col>
                </Grid>

                <Alert color="blue">
                  <Text size="sm">
                    Current failure rate: {(circuitBreaker.circuitState.failureRate * 100).toFixed(1)}%
                    {circuitBreaker.circuitState.current === 'open' && (
                      <> • Next attempt in: {Math.max(0, circuitBreaker.circuitState.nextAttemptTime - Date.now())}ms</>
                    )}
                  </Text>
                </Alert>
              </Card>

              {circuitBreaker.circuitMetrics.stateChanges.length > 0 && (
                <Card>
                  <Text weight={500} mb="md">Circuit State Changes</Text>
                  <ScrollArea.Autosize maxHeight={300}>
                    <Stack spacing="xs">
                      {circuitBreaker.circuitMetrics.stateChanges.slice(0, 10).map((change, index) => (
                        <Paper key={index} p="sm" withBorder>
                          <Group justify="space-between">
                            <Group>
                              <Badge size="sm" color="gray">{change.from}</Badge>
                              <Text size="sm">→</Text>
                              <Badge 
                                size="sm" 
                                color={
                                  change.to === 'closed' ? 'green' :
                                  change.to === 'open' ? 'red' : 'yellow'
                                }
                              >
                                {change.to}
                              </Badge>
                            </Group>
                            <Text size="xs" color="dimmed">
                              {new Date(change.timestamp).toLocaleTimeString()}
                            </Text>
                          </Group>
                          <Text size="xs" color="dimmed" mt="xs">{change.reason}</Text>
                        </Paper>
                      ))}
                    </Stack>
                  </ScrollArea.Autosize>
                </Card>
              )}
            </Stack>
          </Tabs.Panel>

          {/* @ts-ignore */}
          <Tabs.Panel value="fallback" pt="md">
            <Stack>
              <Card>
                <Group justify="space-between" mb="md">
                  <Text weight={500}>Fallback Provider System</Text>
                  <Group>
                    <Button onClick={handleFallbackTest} leftSection={<IconNetwork size={16} />}>
                      Test Fallback
                    </Button>
                    <Button variant="light" onClick={fallbackProvider.runHealthChecks}>
                      Health Check
                    </Button>
                  </Group>
                </Group>

                <Grid>
                  {fallbackProvider.providers.map((provider) => (
                    <Grid.Col key={provider.id} span={4}>
                      <Card withBorder>
                        <Group justify="space-between" mb="xs">
                          <Text weight={500}>{provider.name}</Text>
                          <Badge 
                            color={
                              provider.health.status === 'healthy' ? 'green' : 
                              provider.health.status === 'degraded' ? 'yellow' : 'red'
                            }
                            size="sm"
                          >
                            {provider.health.status}
                          </Badge>
                        </Group>
                        
                        <Stack spacing="xs">
                          <Group justify="space-between">
                            <Text size="sm" color="dimmed">Priority</Text>
                            <Text size="sm">#{provider.priority}</Text>
                          </Group>
                          <Group justify="space-between">
                            <Text size="sm" color="dimmed">Latency</Text>
                            <Text size="sm">{provider.health.latency}ms</Text>
                          </Group>
                          <Group justify="space-between">
                            <Text size="sm" color="dimmed">Error Rate</Text>
                            <Text size="sm">{(provider.health.errorRate * 100).toFixed(1)}%</Text>
                          </Group>
                          <Group justify="space-between">
                            <Text size="sm" color="dimmed">Requests</Text>
                            <Text size="sm">{provider.metrics.totalRequests}</Text>
                          </Group>
                        </Stack>
                        
                        {fallbackProvider.activeProvider === provider.id && (
                          <Badge color="blue" variant="light" size="xs" mt="xs">
                            ACTIVE
                          </Badge>
                        )}
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              </Card>
            </Stack>
          </Tabs.Panel>

          {/* @ts-ignore */}
          <Tabs.Panel value="ratelimit" pt="md">
            <Stack>
              <Card>
                <Group justify="space-between" mb="md">
                  <Text weight={500}>Rate Limit Handler</Text>
                  <Group>
                    <Button onClick={handleRateLimitTest} leftSection={<IconClock size={16} />}>
                      Test Rate Limit
                    </Button>
                  </Group>
                </Group>

                <Grid mb="md">
                  <Grid.Col span={3}>
                    <Text size="xs" color="dimmed">Total Hits</Text>
                    <Text size="lg" weight={500}>{rateLimitHandler.rateLimitMetrics.totalLimitHits}</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" color="dimmed">Queued</Text>
                    <Text size="lg" weight={500}>{rateLimitHandler.rateLimitMetrics.queuedRequests}</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" color="dimmed">Throttled</Text>
                    <Text size="lg" weight={500}>{rateLimitHandler.rateLimitMetrics.throttledRequests}</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" color="dimmed">Adaptive Rate</Text>
                    <Text size="lg" weight={500}>{rateLimitHandler.rateLimitState.adaptiveRate.toFixed(2)}x</Text>
                  </Grid.Col>
                </Grid>

                {rateLimitHandler.rateLimitState.throttlingActive && (
                  <Alert color="orange" mb="md">
                    <Text size="sm">Adaptive throttling is active due to approaching rate limits</Text>
                  </Alert>
                )}
              </Card>

              <Card>
                <Text weight={500} mb="md">Current Rate Limits</Text>
                {Array.from(rateLimitHandler.rateLimitState.limits.entries()).length === 0 ? (
                  <Text size="sm" color="dimmed">No rate limit information available</Text>
                ) : (
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Provider</Table.Th>
                        <Table.Th>Limit</Table.Th>
                        <Table.Th>Remaining</Table.Th>
                        <Table.Th>Reset Time</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {Array.from(rateLimitHandler.rateLimitState.limits.entries()).map(([provider, limit]) => (
                        <Table.Tr key={provider}>
                          <Table.Td>{provider}</Table.Td>
                          <Table.Td>{limit.limit}</Table.Td>
                          <Table.Td>{limit.remaining}</Table.Td>
                          <Table.Td>{new Date(limit.resetTime).toLocaleTimeString()}</Table.Td>
                          <Table.Td>
                            <Badge 
                              size="sm"
                              color={limit.remaining > limit.limit * 0.2 ? 'green' : 
                                     limit.remaining > 0 ? 'yellow' : 'red'}
                            >
                              {limit.remaining > limit.limit * 0.2 ? 'Healthy' : 
                               limit.remaining > 0 ? 'Warning' : 'Exhausted'}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </Card>
            </Stack>
          </Tabs.Panel>

          {/* @ts-ignore */}
          <Tabs.Panel value="monitor" pt="md">
            <ResilienceMonitor
              retryManager={retryManager}
              circuitBreaker={circuitBreaker}
              fallbackProvider={fallbackProvider}
              rateLimitHandler={rateLimitHandler}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default AIErrorHandlingResilienceExercise;