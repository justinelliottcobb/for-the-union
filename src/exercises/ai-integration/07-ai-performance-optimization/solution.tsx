import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Card, Text, Group, Stack, Badge, Progress, Alert, Tabs, TextInput, Select, Textarea, NumberInput, Code, ScrollArea, Divider, ActionIcon, Modal, Slider, Switch, Paper, Container, Grid, RingProgress, Table, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh, IconAnalyze, IconClock, IconCoin, IconTrendingUp, IconSettings, IconChartLine, IconTarget, IconBolt, IconDatabase, IconCpu, IconMemory } from '@tabler/icons-react';

// ===== PERFORMANCE OPTIMIZATION TYPES =====

interface BatchRequest {
  id: string;
  prompt: string;
  parameters: RequestParameters;
  priority: number;
  deadline: number;
  similarity: SimilarityMetrics;
  metadata: RequestMetadata;
  timestamp: number;
}

interface RequestParameters {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

interface SimilarityMetrics {
  contentHash: string;
  semanticVector: number[];
  parameterHash: string;
  similarity: number;
}

interface RequestMetadata {
  userId: string;
  sessionId: string;
  requestType: string;
  context: string;
  tags: string[];
}

interface BatchingStrategy {
  maxBatchSize: number;
  maxWaitTime: number;
  similarityThreshold: number;
  priorityWeights: PriorityWeights;
  optimizationRules: OptimizationRule[];
}

interface PriorityWeights {
  deadline: number;
  user: number;
  cost: number;
  similarity: number;
}

interface OptimizationRule {
  name: string;
  condition: string;
  action: string;
  weight: number;
}

interface BatchResult {
  batchId: string;
  requests: BatchRequest[];
  response: BatchResponse;
  performance: BatchPerformance;
  cost: CostMetrics;
}

interface BatchResponse {
  results: ResponseResult[];
  processingTime: number;
  tokensUsed: number;
  success: boolean;
  errors: BatchError[];
}

interface ResponseResult {
  requestId: string;
  response: string;
  tokens: TokenUsage;
  latency: number;
  cached: boolean;
}

interface TokenUsage {
  input: number;
  output: number;
  total: number;
  cost: number;
}

interface BatchPerformance {
  throughput: number;
  efficiency: number;
  cacheHitRate: number;
  deduplicationRate: number;
  averageLatency: number;
}

interface BatchError {
  requestId: string;
  error: string;
  recoverable: boolean;
  retryCount: number;
}

interface CacheEntry {
  key: string;
  value: CachedResponse;
  metadata: CacheMetadata;
  expiry: number;
  accessCount: number;
  lastAccess: number;
  cost: number;
  size: number;
  hits: number;
}

interface CachedResponse {
  response: string;
  tokens: TokenUsage;
  quality: number;
  timestamp: number;
}

interface CacheMetadata {
  model: string;
  parameters: RequestParameters;
  promptHash: string;
  tags: string[];
  dependencies: string[];
}

interface CacheStrategy {
  policy: 'LRU' | 'LFU' | 'FIFO' | 'adaptive';
  maxSize: number;
  ttl: number;
  compressionLevel: number;
  invalidationRules: InvalidationRule[];
}

interface InvalidationRule {
  trigger: string;
  scope: string;
  condition: string;
}

interface TokenMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  efficiency: number;
  compressionRatio: number;
}

interface OptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  tokenReduction: number;
  costSavings: number;
  qualityScore: number;
  optimizationStrategies: string[];
}

interface CostMetrics {
  totalCost: number;
  breakdown: CostBreakdown[];
  trends: CostTrend[];
  predictions: CostPrediction[];
  budget: BudgetStatus;
}

interface CostBreakdown {
  model: string;
  requests: number;
  tokens: number;
  cost: number;
  percentage: number;
}

interface CostTrend {
  period: string;
  cost: number;
  change: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface CostPrediction {
  period: string;
  estimatedCost: number;
  confidence: number;
  factors: string[];
}

interface BudgetStatus {
  limit: number;
  spent: number;
  remaining: number;
  burnRate: number;
  daysRemaining: number;
  budgetStart: number;
  alerts: BudgetAlert[];
}

interface BudgetAlert {
  level: 'warning' | 'critical' | 'info';
  message: string;
  threshold: number;
  action: string;
}

interface PerformanceMetrics {
  requestLatency: LatencyMetrics;
  throughput: ThroughputMetrics;
  errorRate: ErrorMetrics;
  costEfficiency: CostEfficiencyMetrics;
  resourceUtilization: ResourceMetrics;
}

interface LatencyMetrics {
  p50: number;
  p95: number;
  p99: number;
  average: number;
  max: number;
  trend: number;
}

interface ThroughputMetrics {
  requestsPerSecond: number;
  tokensPerSecond: number;
  batchesPerMinute: number;
  efficiency: number;
}

interface ErrorMetrics {
  errorRate: number;
  errorCount: number;
  errorTypes: ErrorTypeMetric[];
  recovery: RecoveryMetrics;
}

interface ErrorTypeMetric {
  type: string;
  count: number;
  percentage: number;
  trend: number;
}

interface RecoveryMetrics {
  averageRecoveryTime: number;
  successRate: number;
  retryEffectiveness: number;
}

interface CostEfficiencyMetrics {
  costPerRequest: number;
  costPerToken: number;
  efficiency: number;
  optimization: number;
}

interface ResourceMetrics {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
}

// ===== REQUEST BATCHER HOOK =====

const useRequestBatcher = () => {
  const [batchQueue, setBatchQueue] = useState<BatchRequest[]>([]);
  const [activeBatches, setActiveBatches] = useState<BatchResult[]>([]);
  const [batchingStrategy, setBatchingStrategy] = useState<BatchingStrategy>({
    maxBatchSize: 10,
    maxWaitTime: 1000,
    similarityThreshold: 0.8,
    priorityWeights: {
      deadline: 0.4,
      user: 0.3,
      cost: 0.2,
      similarity: 0.1
    },
    optimizationRules: [
      { name: 'DeduplicateRequests', condition: 'similarity > 0.95', action: 'merge', weight: 1.0 },
      { name: 'PrioritizeDeadlines', condition: 'deadline < 5000', action: 'prioritize', weight: 0.8 },
      { name: 'OptimizeCost', condition: 'cost > budget', action: 'defer', weight: 0.6 }
    ]
  });

  const batchTimer = useRef<NodeJS.Timeout | null>(null);
  const performanceMetrics = useRef<BatchPerformance>({
    throughput: 0,
    efficiency: 0,
    cacheHitRate: 0,
    deduplicationRate: 0,
    averageLatency: 0
  });

  const addRequest = useCallback((request: Omit<BatchRequest, 'id' | 'timestamp'>) => {
    const newRequest: BatchRequest = {
      ...request,
      id: 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };

    setBatchQueue(prev => {
      const updated = [...prev, newRequest];
      
      // Check if batch should be processed immediately
      if (updated.length >= batchingStrategy.maxBatchSize || 
          newRequest.priority > 0.9) {
        processBatch(updated);
        return [];
      }

      // Set timer for batch processing
      if (batchTimer.current) {
        clearTimeout(batchTimer.current);
      }
      
      batchTimer.current = setTimeout(() => {
        if (updated.length > 0) {
          processBatch(updated);
          setBatchQueue([]);
        }
      }, batchingStrategy.maxWaitTime);

      return updated;
    });

    return newRequest.id;
  }, [batchingStrategy]);

  const processBatch = async (requests: BatchRequest[]) => {
    const batchId = 'batch_' + Date.now();
    const startTime = Date.now();

    try {
      // Step 1: Deduplicate requests
      const deduplicatedRequests = deduplicateRequests(requests);
      const deduplicationRate = (requests.length - deduplicatedRequests.length) / requests.length;

      // Step 2: Optimize batch composition
      const optimizedBatch = optimizeBatch(deduplicatedRequests);

      // Step 3: Execute batch processing
      const response = await executeBatch(optimizedBatch);

      // Step 4: Calculate performance metrics
      const performance: BatchPerformance = {
        throughput: optimizedBatch.length / ((Date.now() - startTime) / 1000),
        efficiency: response.results.filter(r => r.cached).length / response.results.length,
        cacheHitRate: response.results.filter(r => r.cached).length / response.results.length,
        deduplicationRate,
        averageLatency: response.results.reduce((sum, r) => sum + r.latency, 0) / response.results.length
      };

      // Step 5: Calculate cost metrics
      const cost: CostMetrics = calculateBatchCost(response);

      const batchResult: BatchResult = {
        batchId,
        requests: optimizedBatch,
        response,
        performance,
        cost
      };

      setActiveBatches(prev => [...prev, batchResult].slice(-50)); // Keep last 50 batches
      performanceMetrics.current = performance;

      notifications.show({
        title: 'Batch Processed',
        message: 'Processed ' + optimizedBatch.length + ' requests in ' + (Date.now() - startTime) + 'ms',
        color: 'green'
      });

      return batchResult;

    } catch (error) {
      notifications.show({
        title: 'Batch Error',
        message: error instanceof Error ? error.message : 'Failed to process batch',
        color: 'red'
      });
      throw error;
    }
  };

  const deduplicateRequests = (requests: BatchRequest[]): BatchRequest[] => {
    const seen = new Map<string, BatchRequest>();
    const deduplicated: BatchRequest[] = [];

    for (const request of requests) {
      const key = generateRequestKey(request);
      const existing = seen.get(key);

      if (existing) {
        // Merge similar requests
        const merged = mergeRequests(existing, request);
        seen.set(key, merged);
      } else {
        seen.set(key, request);
        deduplicated.push(request);
      }
    }

    return deduplicated;
  };

  const generateRequestKey = (request: BatchRequest): string => {
    return [
      request.prompt.trim().toLowerCase().substring(0, 100),
      request.parameters.model,
      request.parameters.temperature,
      request.parameters.maxTokens
    ].join('|');
  };

  const mergeRequests = (existing: BatchRequest, incoming: BatchRequest): BatchRequest => {
    return {
      ...existing,
      priority: Math.max(existing.priority, incoming.priority),
      deadline: Math.min(existing.deadline, incoming.deadline),
      metadata: {
        ...existing.metadata,
        tags: [...new Set([...existing.metadata.tags, ...incoming.metadata.tags])]
      }
    };
  };

  const optimizeBatch = (requests: BatchRequest[]): BatchRequest[] => {
    // Sort by priority and deadline
    return requests.sort((a, b) => {
      const priorityScore = (req: BatchRequest) => 
        req.priority * batchingStrategy.priorityWeights.deadline +
        (1 - (req.deadline - Date.now()) / 10000) * batchingStrategy.priorityWeights.user +
        req.similarity.similarity * batchingStrategy.priorityWeights.similarity;

      return priorityScore(b) - priorityScore(a);
    });
  };

  const executeBatch = async (requests: BatchRequest[]): Promise<BatchResponse> => {
    const results: ResponseResult[] = [];
    const startTime = Date.now();
    const errors: BatchError[] = [];

    for (const request of requests) {
      try {
        // Simulate AI API call with cache check
        const cached = Math.random() < 0.3; // 30% cache hit rate simulation
        const latency = cached ? 50 + Math.random() * 100 : 500 + Math.random() * 1500;
        
        await new Promise(resolve => setTimeout(resolve, latency));

        const tokens: TokenUsage = {
          input: Math.floor(request.prompt.length / 4),
          output: Math.floor(Math.random() * 200 + 50),
          total: 0,
          cost: 0
        };
        tokens.total = tokens.input + tokens.output;
        tokens.cost = (tokens.input * 0.0001) + (tokens.output * 0.0002);

        results.push({
          requestId: request.id,
          response: 'Generated response for: ' + request.prompt.substring(0, 50) + '...',
          tokens,
          latency,
          cached
        });

      } catch (error) {
        errors.push({
          requestId: request.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
          retryCount: 0
        });
      }
    }

    return {
      results,
      processingTime: Date.now() - startTime,
      tokensUsed: results.reduce((sum, r) => sum + r.tokens.total, 0),
      success: errors.length === 0,
      errors
    };
  };

  const calculateBatchCost = (response: BatchResponse): CostMetrics => {
    const totalCost = response.results.reduce((sum, r) => sum + r.tokens.cost, 0);
    
    return {
      totalCost,
      breakdown: [
        {
          model: 'gpt-4',
          requests: response.results.length,
          tokens: response.tokensUsed,
          cost: totalCost,
          percentage: 100
        }
      ],
      trends: [],
      predictions: [],
      budget: {
        limit: 1000,
        spent: totalCost,
        remaining: 1000 - totalCost,
        burnRate: totalCost / (Date.now() / (1000 * 60 * 60 * 24)),
        daysRemaining: (1000 - totalCost) / (totalCost / (Date.now() / (1000 * 60 * 60 * 24))),
        alerts: []
      }
    };
  };

  const clearBatchHistory = () => {
    setActiveBatches([]);
  };

  const updateBatchingStrategy = (updates: Partial<BatchingStrategy>) => {
    setBatchingStrategy(prev => ({ ...prev, ...updates }));
  };

  return {
    batchQueue,
    activeBatches,
    batchingStrategy,
    performanceMetrics: performanceMetrics.current,
    addRequest,
    clearBatchHistory,
    updateBatchingStrategy
  };
};

// ===== RESPONSE CACHE HOOK =====

const useResponseCache = () => {
  const [cacheEntries, setCacheEntries] = useState<Map<string, CacheEntry>>(new Map());
  const [cacheStats, setCacheStats] = useState({
    hitRate: 0,
    missRate: 0,
    size: 0,
    maxSize: 1000,
    memoryUsage: 0,
    evictions: 0
  });

  const cacheStrategy: CacheStrategy = {
    policy: 'LRU',
    maxSize: 1000,
    ttl: 3600000, // 1 hour
    compressionLevel: 6,
    invalidationRules: [
      { trigger: 'modelUpdate', scope: 'model', condition: 'model = updated' },
      { trigger: 'parameterChange', scope: 'request', condition: 'parameters != cached' }
    ]
  };

  const generateCacheKey = (prompt: string, parameters: RequestParameters): string => {
    const normalized = {
      prompt: prompt.trim().toLowerCase(),
      model: parameters.model,
      temperature: Math.round(parameters.temperature * 10) / 10,
      maxTokens: parameters.maxTokens
    };
    
    // Simple browser-compatible hash function
    const hashString = (str: string): string => {
      let hash = 0;
      if (str.length === 0) return hash.toString();
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(36);
    };
    
    const hash = hashString(JSON.stringify(normalized));
    return 'cache_' + hash;
  };

  const get = useCallback((prompt: string, parameters: RequestParameters): CachedResponse | null => {
    const key = generateCacheKey(prompt, parameters);
    const entry = cacheEntries.get(key);

    if (!entry) {
      setCacheStats(prev => ({ ...prev, missRate: prev.missRate + 1 }));
      return null;
    }

    // Check expiry
    if (Date.now() > entry.expiry) {
      setCacheEntries(prev => {
        const updated = new Map(prev);
        updated.delete(key);
        return updated;
      });
      setCacheStats(prev => ({ ...prev, missRate: prev.missRate + 1 }));
      return null;
    }

    // Update access statistics
    setCacheEntries(prev => {
      const updated = new Map(prev);
      const updatedEntry = {
        ...entry,
        accessCount: entry.accessCount + 1,
        lastAccess: Date.now(),
        hits: entry.hits + 1
      };
      updated.set(key, updatedEntry);
      return updated;
    });

    setCacheStats(prev => ({ ...prev, hitRate: prev.hitRate + 1 }));
    return entry.value;
  }, [cacheEntries]);

  const set = useCallback((
    prompt: string, 
    parameters: RequestParameters, 
    response: CachedResponse
  ): void => {
    const key = generateCacheKey(prompt, parameters);
    
    // Check if cache is full
    if (cacheEntries.size >= cacheStrategy.maxSize) {
      evictLRU();
    }

    const entry: CacheEntry = {
      key,
      value: response,
      metadata: {
        model: parameters.model,
        parameters,
        promptHash: key,
        tags: [],
        dependencies: []
      },
      expiry: Date.now() + cacheStrategy.ttl,
      accessCount: 1,
      lastAccess: Date.now(),
      cost: response.tokens.cost,
      size: JSON.stringify(response).length,
      hits: 0
    };

    setCacheEntries(prev => new Map(prev).set(key, entry));
    setCacheStats(prev => ({
      ...prev,
      size: prev.size + 1,
      memoryUsage: prev.memoryUsage + entry.size
    }));
  }, [cacheEntries, cacheStrategy]);

  const evictLRU = () => {
    let oldestKey = '';
    let oldestAccess = Date.now();

    cacheEntries.forEach((entry, key) => {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      const entry = cacheEntries.get(oldestKey);
      setCacheEntries(prev => {
        const updated = new Map(prev);
        updated.delete(oldestKey);
        return updated;
      });
      
      setCacheStats(prev => ({
        ...prev,
        size: prev.size - 1,
        memoryUsage: prev.memoryUsage - (entry?.size || 0),
        evictions: prev.evictions + 1
      }));
    }
  };

  const invalidate = (pattern: string) => {
    const toDelete: string[] = [];
    
    cacheEntries.forEach((entry, key) => {
      if (key.includes(pattern) || 
          entry.metadata.model.includes(pattern) ||
          entry.metadata.tags.some(tag => tag.includes(pattern))) {
        toDelete.push(key);
      }
    });

    setCacheEntries(prev => {
      const updated = new Map(prev);
      toDelete.forEach(key => updated.delete(key));
      return updated;
    });

    setCacheStats(prev => ({
      ...prev,
      size: prev.size - toDelete.length
    }));
  };

  const clear = () => {
    setCacheEntries(new Map());
    setCacheStats(prev => ({
      ...prev,
      size: 0,
      memoryUsage: 0,
      hitRate: 0,
      missRate: 0,
      evictions: 0
    }));
  };

  const getCacheAnalytics = () => {
    const entries = Array.from(cacheEntries.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const totalCost = entries.reduce((sum, entry) => sum + entry.cost, 0);
    
    return {
      ...cacheStats,
      hitRate: cacheStats.hitRate / (cacheStats.hitRate + cacheStats.missRate),
      avgHitsPerEntry: totalHits / entries.length || 0,
      totalCostSaved: totalCost,
      entries: entries.length
    };
  };

  return {
    get,
    set,
    invalidate,
    clear,
    cacheStats: getCacheAnalytics(),
    cacheEntries: Array.from(cacheEntries.values())
  };
};

// ===== TOKEN OPTIMIZER HOOK =====

const useTokenOptimizer = () => {
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationResult[]>([]);

  const countTokens = useCallback((text: string, model: string = 'gpt-4'): number => {
    // Simple token estimation (in real implementation, use tiktoken or similar)
    const baseTokens = Math.ceil(text.length / 4);
    const modelMultiplier = model.includes('gpt-4') ? 1.0 : 0.8;
    return Math.floor(baseTokens * modelMultiplier);
  }, []);

  const estimateCost = useCallback((inputTokens: number, outputTokens: number, model: string): number => {
    const pricing = {
      'gpt-4': { input: 0.00003, output: 0.00006 },
      'gpt-3.5-turbo': { input: 0.000001, output: 0.000002 },
      'claude-3': { input: 0.000008, output: 0.000024 }
    };

    const rates = pricing[model as keyof typeof pricing] || pricing['gpt-4'];
    return (inputTokens * rates.input) + (outputTokens * rates.output);
  }, []);

  const optimizePrompt = useCallback((prompt: string, options: {
    maxReduction: number;
    preserveQuality: boolean;
    compressionLevel: number;
  } = { maxReduction: 0.3, preserveQuality: true, compressionLevel: 5 }): OptimizationResult => {
    const originalTokens = countTokens(prompt);
    
    // Optimization strategies
    const strategies: string[] = [];
    let optimizedPrompt = prompt;

    // 1. Remove redundancy
    if (options.compressionLevel >= 3) {
      optimizedPrompt = removeRedundancy(optimizedPrompt);
      strategies.push('redundancy_removal');
    }

    // 2. Compress instructions
    if (options.compressionLevel >= 5) {
      optimizedPrompt = compressInstructions(optimizedPrompt);
      strategies.push('instruction_compression');
    }

    // 3. Optimize formatting
    if (options.compressionLevel >= 2) {
      optimizedPrompt = optimizeFormatting(optimizedPrompt);
      strategies.push('formatting_optimization');
    }

    // 4. Context prioritization
    if (options.compressionLevel >= 7) {
      optimizedPrompt = prioritizeContext(optimizedPrompt);
      strategies.push('context_prioritization');
    }

    const optimizedTokens = countTokens(optimizedPrompt);
    const tokenReduction = originalTokens - optimizedTokens;
    const costSavings = estimateCost(tokenReduction, 0, 'gpt-4');
    const qualityScore = calculateQualityScore(prompt, optimizedPrompt);

    const result: OptimizationResult = {
      originalPrompt: prompt,
      optimizedPrompt,
      tokenReduction,
      costSavings,
      qualityScore,
      optimizationStrategies: strategies
    };

    setOptimizationHistory(prev => [result, ...prev].slice(0, 100));
    return result;
  }, [countTokens, estimateCost]);

  const removeRedundancy = (prompt: string): string => {
    // Remove repeated phrases and unnecessary words
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim());
    const unique = [...new Set(sentences.map(s => s.trim().toLowerCase()))];
    return unique.join('. ') + '.';
  };

  const compressInstructions = (prompt: string): string => {
    const compressionMap: Record<string, string> = {
      'please provide': 'provide',
      'could you please': '',
      'i would like you to': '',
      'can you help me': '',
      'it would be great if': '',
      'make sure to': 'ensure',
      'in order to': 'to',
      'due to the fact that': 'because',
      'at the present time': 'now',
      'in the event that': 'if'
    };

    let compressed = prompt;
    Object.entries(compressionMap).forEach(([verbose, concise]) => {
      compressed = compressed.replace(new RegExp(verbose, 'gi'), concise);
    });

    return compressed;
  };

  const optimizeFormatting = (prompt: string): string => {
    return prompt
      .replace(/\s+/g, ' ') // Remove extra whitespace
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
  };

  const prioritizeContext = (prompt: string): string => {
    // Move most important context to the beginning
    const paragraphs = prompt.split('\n\n');
    const prioritized = paragraphs.sort((a, b) => {
      const importanceScore = (text: string) => {
        let score = 0;
        if (text.includes('important') || text.includes('critical')) score += 10;
        if (text.includes('must') || text.includes('required')) score += 8;
        if (text.includes('example') || text.includes('format')) score += 6;
        return score;
      };
      return importanceScore(b) - importanceScore(a);
    });
    
    return prioritized.join('\n\n');
  };

  const calculateQualityScore = (original: string, optimized: string): number => {
    // Simple quality assessment based on information preservation
    const originalWords = new Set(original.toLowerCase().split(/\s+/));
    const optimizedWords = new Set(optimized.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...originalWords].filter(word => optimizedWords.has(word)));
    const preservation = intersection.size / originalWords.size;
    
    // Penalty for over-compression
    const compressionRatio = optimized.length / original.length;
    const penalty = compressionRatio < 0.5 ? 0.8 : 1.0;
    
    return Math.min(preservation * penalty * 100, 100);
  };

  const analyzeTokenUsage = (prompts: string[], responses: string[]): TokenMetrics[] => {
    return prompts.map((prompt, index) => {
      const response = responses[index] || '';
      const inputTokens = countTokens(prompt);
      const outputTokens = countTokens(response);
      const totalTokens = inputTokens + outputTokens;
      const estimatedCost = estimateCost(inputTokens, outputTokens, 'gpt-4');
      
      return {
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCost,
        efficiency: outputTokens / inputTokens,
        compressionRatio: 1.0 // Would be calculated from optimization
      };
    });
  };

  const getOptimizationRecommendations = (metrics: TokenMetrics[]): string[] => {
    const recommendations: string[] = [];
    const avgEfficiency = metrics.reduce((sum, m) => sum + m.efficiency, 0) / metrics.length;
    const avgCost = metrics.reduce((sum, m) => sum + m.estimatedCost, 0) / metrics.length;

    if (avgEfficiency < 0.5) {
      recommendations.push('Consider more specific prompts to improve output efficiency');
    }

    if (avgCost > 0.01) {
      recommendations.push('High token usage detected - consider prompt compression');
    }

    const highInputTokens = metrics.filter(m => m.inputTokens > 1000).length;
    if (highInputTokens > metrics.length * 0.3) {
      recommendations.push('Many prompts exceed 1000 tokens - implement context windowing');
    }

    return recommendations;
  };

  return {
    countTokens,
    estimateCost,
    optimizePrompt,
    analyzeTokenUsage,
    getOptimizationRecommendations,
    optimizationHistory
  };
};

// ===== COST TRACKER HOOK =====

const useCostTracker = () => {
  const [costData, setCostData] = useState<CostMetrics>({
    totalCost: 0,
    breakdown: [],
    trends: [],
    predictions: [],
    budget: {
      limit: 1000,
      spent: 0,
      remaining: 1000,
      burnRate: 0,
      daysRemaining: 0,
      budgetStart: Date.now(),
      alerts: []
    }
  });

  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);

  const trackCost = useCallback((cost: number, model: string, tokens: number) => {
    setCostData(prev => {
      const newTotal = prev.totalCost + cost;
      const existingBreakdown = prev.breakdown.find(b => b.model === model);
      
      let updatedBreakdown;
      if (existingBreakdown) {
        updatedBreakdown = prev.breakdown.map(b => 
          b.model === model 
            ? { ...b, cost: b.cost + cost, tokens: b.tokens + tokens, requests: b.requests + 1 }
            : b
        );
      } else {
        updatedBreakdown = [...prev.breakdown, {
          model,
          requests: 1,
          tokens,
          cost,
          percentage: 0
        }];
      }

      // Recalculate percentages
      updatedBreakdown = updatedBreakdown.map(b => ({
        ...b,
        percentage: (b.cost / newTotal) * 100
      }));

      // Calculate daysElapsed since budget tracking started
      const budgetStart = prev.budget.budgetStart || Date.now();
      const daysElapsed = Math.max(1, (Date.now() - budgetStart) / (1000 * 60 * 60 * 24));
      const burnRate = daysElapsed > 0 ? newTotal / daysElapsed : 0; // Cost per day
      const daysRemaining =
        burnRate > 0
          ? Math.max(0, (prev.budget.limit - newTotal) / burnRate)
          : 0;

      const newBudget = {
        ...prev.budget,
        spent: newTotal,
        remaining: prev.budget.limit - newTotal,
        burnRate,
        daysRemaining,
        budgetStart
      };

      // Check for budget alerts
      checkBudgetAlerts(newBudget);

      return {
        ...prev,
        totalCost: newTotal,
        breakdown: updatedBreakdown,
        budget: newBudget
      };
    });
  }, []);

  const checkBudgetAlerts = (budget: BudgetStatus) => {
    const alerts: BudgetAlert[] = [];
    const spentPercentage = (budget.spent / budget.limit) * 100;

    if (spentPercentage >= 90) {
      alerts.push({
        level: 'critical',
        message: 'Budget usage exceeded 90%',
        threshold: 90,
        action: 'Immediate attention required'
      });
    } else if (spentPercentage >= 75) {
      alerts.push({
        level: 'warning',
        message: 'Budget usage exceeded 75%',
        threshold: 75,
        action: 'Consider optimizing usage'
      });
    } else if (spentPercentage >= 50) {
      alerts.push({
        level: 'info',
        message: 'Budget usage reached 50%',
        threshold: 50,
        action: 'Monitor usage trends'
      });
    }

    if (budget.daysRemaining <= 7 && budget.daysRemaining > 0) {
      alerts.push({
        level: 'warning',
        message: 'Budget will be exhausted in ' + Math.ceil(budget.daysRemaining) + ' days',
        threshold: 7,
        action: 'Review spending patterns'
      });
    }

    setBudgetAlerts(alerts);
  };

  const updateBudgetLimit = (newLimit: number) => {
    setCostData(prev => {
      // Calculate daysElapsed based on budget start time
      const now = Date.now();
      const budgetStart = prev.budget.budgetStart || now;
      const daysElapsed = Math.max(1, (now - budgetStart) / (1000 * 60 * 60 * 24));
      const newBurnRate = daysElapsed > 0 ? prev.budget.spent / daysElapsed : 0;
      
      return {
        ...prev,
        budget: {
          ...prev.budget,
          limit: newLimit,
          remaining: newLimit - prev.budget.spent,
          burnRate: newBurnRate,
          daysRemaining: newBurnRate > 0
            ? Math.max(0, (newLimit - prev.budget.spent) / newBurnRate)
            : 0
        }
      };
    });
  };

  const generateCostReport = () => {
    return {
      summary: {
        totalCost: costData.totalCost,
        budgetUsed: (costData.totalCost / costData.budget.limit) * 100,
        topModel: costData.breakdown.reduce((top, current) => 
          current.cost > (top?.cost || 0) ? current : top, costData.breakdown[0]
        ),
        efficiency: costData.breakdown.reduce((sum, b) => sum + b.tokens, 0) / costData.totalCost
      },
      breakdown: costData.breakdown,
      recommendations: generateCostOptimizationRecommendations()
    };
  };

  const generateCostOptimizationRecommendations = (): string[] => {
    const recommendations: string[] = [];
    
    if (costData.budget.burnRate > costData.budget.limit / 30) {
      recommendations.push('High daily spend rate - consider implementing request limits');
    }

    const highCostModel = costData.breakdown.find(b => b.percentage > 50);
    if (highCostModel) {
      recommendations.push('Consider alternatives to ' + highCostModel.model + ' for lower-priority requests');
    }

    if (costData.totalCost > costData.budget.limit * 0.8) {
      recommendations.push('Approaching budget limit - enable stricter cost controls');
    }

    return recommendations;
  };

  return {
    costData,
    budgetAlerts,
    trackCost,
    updateBudgetLimit,
    generateCostReport
  };
};

// ===== PERFORMANCE MONITOR COMPONENT =====

interface PerformanceMonitorProps {
  batcher: ReturnType<typeof useRequestBatcher>;
  cache: ReturnType<typeof useResponseCache>;
  tokenOptimizer: ReturnType<typeof useTokenOptimizer>;
  costTracker: ReturnType<typeof useCostTracker>;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  batcher,
  cache,
  tokenOptimizer,
  costTracker
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'throughput' | 'cache' | 'cost' | 'tokens'>('throughput');

  const metrics = useMemo(() => ({
    throughput: {
      requestsPerSecond: batcher.performanceMetrics.throughput,
      efficiency: batcher.performanceMetrics.efficiency,
      averageLatency: batcher.performanceMetrics.averageLatency,
      batchCount: batcher.activeBatches.length
    },
    cache: {
      hitRate: cache.cacheStats.hitRate,
      entries: cache.cacheStats.entries,
      memoryUsage: cache.cacheStats.memoryUsage,
      evictions: cache.cacheStats.evictions
    },
    cost: {
      totalSpent: costTracker.costData.totalCost,
      budgetRemaining: costTracker.costData.budget.remaining,
      burnRate: costTracker.costData.budget.burnRate,
      daysRemaining: costTracker.costData.budget.daysRemaining
    },
    tokens: {
      optimizations: tokenOptimizer.optimizationHistory.length,
      avgSavings: tokenOptimizer.optimizationHistory.reduce((sum, opt) => sum + opt.costSavings, 0) / tokenOptimizer.optimizationHistory.length || 0,
      avgQuality: tokenOptimizer.optimizationHistory.reduce((sum, opt) => sum + opt.qualityScore, 0) / tokenOptimizer.optimizationHistory.length || 0
    }
  }), [batcher, cache, costTracker, tokenOptimizer]);

  const renderMetricCards = () => {
    switch (selectedMetric) {
      case 'throughput':
        return (
          <Grid>
            <Grid.Col span={3}>
              <Card>
                <Group>
                  <IconBolt color="blue" />
                  <div>
                    <Text size="xs" color="dimmed">Requests/sec</Text>
                    <Text weight={500}>{metrics.throughput.requestsPerSecond.toFixed(2)}</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={3}>
              <Card>
                <Group>
                  <IconTarget color="green" />
                  <div>
                    <Text size="xs" color="dimmed">Efficiency</Text>
                    <Text weight={500}>{(metrics.throughput.efficiency * 100).toFixed(1)}%</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={3}>
              <Card>
                <Group>
                  <IconClock color="orange" />
                  <div>
                    <Text size="xs" color="dimmed">Avg Latency</Text>
                    <Text weight={500}>{metrics.throughput.averageLatency.toFixed(0)}ms</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={3}>
              <Card>
                <Group>
                  <IconChartLine color="purple" />
                  <div>
                    <Text size="xs" color="dimmed">Batches</Text>
                    <Text weight={500}>{metrics.throughput.batchCount}</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        );

      case 'cache':
        return (
          <Grid>
            <Grid.Col span={6}>
              <Card>
                <Group justify="space-between">
                  <div>
                    <Text size="sm" color="dimmed">Cache Hit Rate</Text>
                    <Text size="xl" weight={500}>{(metrics.cache.hitRate * 100).toFixed(1)}%</Text>
                  </div>
                  <RingProgress
                    size={80}
                    thickness={8}
                    sections={[{ value: metrics.cache.hitRate * 100, color: 'blue' }]}
                  />
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card>
                <Stack spacing="xs">
                  <Group justify="space-between">
                    <Text size="sm">Entries</Text>
                    <Text weight={500}>{metrics.cache.entries}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">Memory</Text>
                    <Text weight={500}>{(metrics.cache.memoryUsage / 1024).toFixed(1)}KB</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">Evictions</Text>
                    <Text weight={500}>{metrics.cache.evictions}</Text>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        );

      case 'cost':
        return (
          <Grid>
            <Grid.Col span={6}>
              <Card>
                <Group justify="space-between">
                  <div>
                    <Text size="sm" color="dimmed">Budget Used</Text>
                    <Text size="xl" weight={500}>
                      ${metrics.cost.totalSpent.toFixed(4)}
                    </Text>
                    <Text size="xs" color="dimmed">
                      ${metrics.cost.budgetRemaining.toFixed(4)} remaining
                    </Text>
                  </div>
                  <RingProgress
                    size={80}
                    thickness={8}
                    sections={[{ 
                      value: (metrics.cost.totalSpent / (metrics.cost.totalSpent + metrics.cost.budgetRemaining)) * 100, 
                      color: metrics.cost.budgetRemaining < 100 ? 'red' : 'green' 
                    }]}
                  />
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card>
                <Stack spacing="xs">
                  <Group justify="space-between">
                    <Text size="sm">Daily Burn Rate</Text>
                    <Text weight={500}>${metrics.cost.burnRate.toFixed(4)}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">Days Remaining</Text>
                    <Text weight={500}>{Math.ceil(metrics.cost.daysRemaining)}</Text>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        );

      case 'tokens':
        return (
          <Grid>
            <Grid.Col span={4}>
              <Card>
                <Group>
                  <IconSettings color="blue" />
                  <div>
                    <Text size="xs" color="dimmed">Optimizations</Text>
                    <Text weight={500}>{metrics.tokens.optimizations}</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={4}>
              <Card>
                <Group>
                  <IconCoin color="green" />
                  <div>
                    <Text size="xs" color="dimmed">Avg Savings</Text>
                    <Text weight={500}>${metrics.tokens.avgSavings.toFixed(6)}</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={4}>
              <Card>
                <Group>
                  <IconTrendingUp color="orange" />
                  <div>
                    <Text size="xs" color="dimmed">Avg Quality</Text>
                    <Text weight={500}>{metrics.tokens.avgQuality.toFixed(1)}%</Text>
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
        <Text weight={500}>Performance Monitor</Text>
        <Select
          value={selectedMetric}
          onChange={(value) => setSelectedMetric(value as any)}
          data={[
            { value: 'throughput', label: 'Throughput' },
            { value: 'cache', label: 'Cache' },
            { value: 'cost', label: 'Cost' },
            { value: 'tokens', label: 'Tokens' }
          ]}
        />
      </Group>
      
      {renderMetricCards()}

      {costTracker.budgetAlerts.length > 0 && (
        <Card>
          <Text weight={500} mb="md">Budget Alerts</Text>
          <Stack spacing="xs">
            {costTracker.budgetAlerts.map((alert, index) => (
              <Alert key={index} color={alert.level === 'critical' ? 'red' : alert.level === 'warning' ? 'yellow' : 'blue'}>
                <Group justify="space-between">
                  <Text size="sm">{alert.message}</Text>
                  <Badge color={alert.level === 'critical' ? 'red' : alert.level === 'warning' ? 'yellow' : 'blue'}>
                    {alert.level}
                  </Badge>
                </Group>
              </Alert>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
};

// ===== MAIN COMPONENT =====

export const AIPerformanceOptimizationExercise: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>('batcher');
  
  const batcher = useRequestBatcher();
  const cache = useResponseCache();
  const tokenOptimizer = useTokenOptimizer();
  const costTracker = useCostTracker();

  const [testPrompt, setTestPrompt] = useState('Write a comprehensive analysis of machine learning trends in 2024, focusing on transformer architectures, multimodal capabilities, and their applications in various industries including healthcare, finance, and education.');

  const handleBatchTest = () => {
    const testRequests = [
      {
        prompt: testPrompt,
        parameters: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 500,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        },
        priority: 0.8,
        deadline: Date.now() + 5000,
        similarity: {
          contentHash: 'hash1',
          semanticVector: [0.1, 0.2, 0.3],
          parameterHash: 'param1',
          similarity: 0.9
        },
        metadata: {
          userId: 'user1',
          sessionId: 'session1',
          requestType: 'analysis',
          context: 'demo',
          tags: ['test', 'analysis']
        }
      },
      {
        prompt: testPrompt.substring(0, 100) + '...',
        parameters: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 300,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        },
        priority: 0.6,
        deadline: Date.now() + 8000,
        similarity: {
          contentHash: 'hash2',
          semanticVector: [0.15, 0.25, 0.35],
          parameterHash: 'param2',
          similarity: 0.85
        },
        metadata: {
          userId: 'user2',
          sessionId: 'session2',
          requestType: 'summary',
          context: 'demo',
          tags: ['test', 'summary']
        }
      }
    ];

    testRequests.forEach(req => {
      batcher.addRequest(req);
      // Simulate cost tracking
      setTimeout(() => {
        costTracker.trackCost(0.015, req.parameters.model, 250);
      }, 1000);
    });

    notifications.show({
      title: 'Test Batch Started',
      message: 'Added ' + testRequests.length + ' requests to the batch queue',
      color: 'blue'
    });
  };

  const handleCacheTest = () => {
    const cachedResponse = cache.get(testPrompt, {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 500,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    });

    if (cachedResponse) {
      notifications.show({
        title: 'Cache Hit',
        message: 'Response found in cache',
        color: 'green'
      });
    } else {
      // Set cache entry
      cache.set(testPrompt, {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 500,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0
      }, {
        response: 'Cached response for: ' + testPrompt.substring(0, 50) + '...',
        tokens: { input: 100, output: 150, total: 250, cost: 0.012 },
        quality: 0.95,
        timestamp: Date.now()
      });

      notifications.show({
        title: 'Cache Miss',
        message: 'Response cached for future use',
        color: 'orange'
      });
    }
  };

  const handleOptimizationTest = () => {
    const result = tokenOptimizer.optimizePrompt(testPrompt, {
      maxReduction: 0.3,
      preserveQuality: true,
      compressionLevel: 7
    });

    notifications.show({
      title: 'Optimization Complete',
      message: 'Reduced tokens by ' + result.tokenReduction + ' (saved $' + result.costSavings.toFixed(6) + ')',
      color: 'green'
    });
  };

  return (
    <Container size="xl" p="md">
      <Stack>
        <div>
          <h1>AI Performance Optimization</h1>
          <p>Advanced performance optimization and cost management patterns for AI applications</p>
        </div>

        <Tabs value={selectedDemo} onChange={setSelectedDemo}>
          <Tabs.List>
            <Tabs.Tab value="batcher">Request Batcher</Tabs.Tab>
            <Tabs.Tab value="cache">Response Cache</Tabs.Tab>
            <Tabs.Tab value="optimizer">Token Optimizer</Tabs.Tab>
            <Tabs.Tab value="monitor">Performance Monitor</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="batcher" pt="md">
            <Stack>
              <Card>
                <Group justify="space-between" mb="md">
                  <Text weight={500}>Request Batching System</Text>
                  <Group>
                    <Badge>Queue: {batcher.batchQueue.length}</Badge>
                    <Badge color="blue">Batches: {batcher.activeBatches.length}</Badge>
                  </Group>
                </Group>
                
                <Textarea
                  label="Test Prompt"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  minRows={3}
                  mb="md"
                />

                <Group>
                  <Button onClick={handleBatchTest} leftSection={<IconBolt size={16} />}>
                    Add to Batch Queue
                  </Button>
                  <Button variant="light" onClick={batcher.clearBatchHistory}>
                    Clear History
                  </Button>
                </Group>
              </Card>

              <Card>
                <Text weight={500} mb="md">Batch Performance</Text>
                <Grid>
                  <Grid.Col span={3}>
                    <Text size="xs" color="dimmed">Throughput</Text>
                    <Text size="lg" weight={500}>{batcher.performanceMetrics.throughput.toFixed(2)} req/s</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" color="dimmed">Efficiency</Text>
                    <Text size="lg" weight={500}>{(batcher.performanceMetrics.efficiency * 100).toFixed(1)}%</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" color="dimmed">Cache Hit Rate</Text>
                    <Text size="lg" weight={500}>{(batcher.performanceMetrics.cacheHitRate * 100).toFixed(1)}%</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" color="dimmed">Avg Latency</Text>
                    <Text size="lg" weight={500}>{batcher.performanceMetrics.averageLatency.toFixed(0)}ms</Text>
                  </Grid.Col>
                </Grid>
              </Card>

              {batcher.activeBatches.length > 0 && (
                <Card>
                  <Text weight={500} mb="md">Recent Batches</Text>
                  <ScrollArea.Autosize maxHeight={300}>
                    <Stack spacing="xs">
                      {batcher.activeBatches.slice(-5).map((batch) => (
                        <Paper key={batch.batchId} p="sm" withBorder>
                          <Group justify="space-between">
                            <div>
                              <Text size="sm" weight={500}>{batch.batchId}</Text>
                              <Text size="xs" color="dimmed">
                                {batch.requests.length} requests, {batch.response.processingTime}ms
                              </Text>
                            </div>
                            <Group>
                              <Badge size="sm" color="green">
                                ${batch.cost.totalCost.toFixed(4)}
                              </Badge>
                              <Badge size="sm" variant="light">
                                {batch.response.tokensUsed} tokens
                              </Badge>
                            </Group>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </ScrollArea.Autosize>
                </Card>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="cache" pt="md">
            <Stack>
              <Card>
                <Group justify="space-between" mb="md">
                  <Text weight={500}>Response Cache System</Text>
                  <Group>
                    <Button onClick={handleCacheTest} leftSection={<IconDatabase size={16} />}>
                      Test Cache
                    </Button>
                    <Button variant="light" color="red" onClick={cache.clear}>
                      Clear Cache
                    </Button>
                  </Group>
                </Group>

                <Grid>
                  <Grid.Col span={3}>
                    <Card withBorder>
                      <Text size="xs" color="dimmed">Hit Rate</Text>
                      <Text size="xl" weight={500}>{(cache.cacheStats.hitRate * 100).toFixed(1)}%</Text>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Card withBorder>
                      <Text size="xs" color="dimmed">Entries</Text>
                      <Text size="xl" weight={500}>{cache.cacheStats.entries}</Text>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Card withBorder>
                      <Text size="xs" color="dimmed">Memory</Text>
                      <Text size="xl" weight={500}>{(cache.cacheStats.memoryUsage / 1024).toFixed(1)}KB</Text>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Card withBorder>
                      <Text size="xs" color="dimmed">Cost Saved</Text>
                      <Text size="xl" weight={500}>${cache.cacheStats.totalCostSaved?.toFixed(4) || '0.0000'}</Text>
                    </Card>
                  </Grid.Col>
                </Grid>
              </Card>

              {cache.cacheEntries.length > 0 && (
                <Card>
                  <Text weight={500} mb="md">Cache Entries</Text>
                  <ScrollArea.Autosize maxHeight={400}>
                    <Table striped>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Key</Table.Th>
                          <Table.Th>Model</Table.Th>
                          <Table.Th>Hits</Table.Th>
                          <Table.Th>Size</Table.Th>
                          <Table.Th>Cost</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {cache.cacheEntries.slice(-10).map((entry) => (
                          <Table.Tr key={entry.key}>
                            <Table.Td>
                              <Text size="xs" style={{ fontFamily: 'monospace' }}>
                                {entry.key.substring(0, 12)}...
                              </Text>
                            </Table.Td>
                            <Table.Td>{entry.metadata.model}</Table.Td>
                            <Table.Td>{entry.hits}</Table.Td>
                            <Table.Td>{(entry.size / 1024).toFixed(1)}KB</Table.Td>
                            <Table.Td>${entry.cost.toFixed(6)}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea.Autosize>
                </Card>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="optimizer" pt="md">
            <Stack>
              <Card>
                <Group justify="space-between" mb="md">
                  <Text weight={500}>Token Optimizer</Text>
                  <Button onClick={handleOptimizationTest} leftSection={<IconSettings size={16} />}>
                    Optimize Prompt
                  </Button>
                </Group>

                <Textarea
                  label="Prompt to Optimize"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  minRows={4}
                  mb="md"
                />

                <Group mb="md">
                  <div>
                    <Text size="xs" color="dimmed">Estimated Tokens</Text>
                    <Text size="lg" weight={500}>{tokenOptimizer.countTokens(testPrompt)}</Text>
                  </div>
                  <div>
                    <Text size="xs" color="dimmed">Estimated Cost</Text>
                    <Text size="lg" weight={500}>${tokenOptimizer.estimateCost(tokenOptimizer.countTokens(testPrompt), 150, 'gpt-4').toFixed(6)}</Text>
                  </div>
                </Group>
              </Card>

              {tokenOptimizer.optimizationHistory.length > 0 && (
                <Card>
                  <Text weight={500} mb="md">Optimization History</Text>
                  <ScrollArea.Autosize maxHeight={400}>
                    <Stack spacing="md">
                      {tokenOptimizer.optimizationHistory.slice(0, 5).map((optimization, index) => (
                        <Paper key={index} p="md" withBorder>
                          <Group justify="space-between" mb="sm">
                            <Text size="sm" weight={500}>Optimization #{tokenOptimizer.optimizationHistory.length - index}</Text>
                            <Group>
                              <Badge color="green">-{optimization.tokenReduction} tokens</Badge>
                              <Badge color="blue">${optimization.costSavings.toFixed(6)} saved</Badge>
                              <Badge color="orange">{optimization.qualityScore.toFixed(1)}% quality</Badge>
                            </Group>
                          </Group>
                          
                          <Text size="xs" color="dimmed" mb="xs">Strategies: {optimization.optimizationStrategies.join(', ')}</Text>
                          
                          <Divider my="sm" />
                          
                          <Grid>
                            <Grid.Col span={6}>
                              <Text size="xs" color="dimmed" mb="xs">Original ({tokenOptimizer.countTokens(optimization.originalPrompt)} tokens)</Text>
                              <Text size="sm" lineClamp={3}>{optimization.originalPrompt}</Text>
                            </Grid.Col>
                            <Grid.Col span={6}>
                              <Text size="xs" color="dimmed" mb="xs">Optimized ({tokenOptimizer.countTokens(optimization.optimizedPrompt)} tokens)</Text>
                              <Text size="sm" lineClamp={3}>{optimization.optimizedPrompt}</Text>
                            </Grid.Col>
                          </Grid>
                        </Paper>
                      ))}
                    </Stack>
                  </ScrollArea.Autosize>
                </Card>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="monitor" pt="md">
            <PerformanceMonitor
              batcher={batcher}
              cache={cache}
              tokenOptimizer={tokenOptimizer}
              costTracker={costTracker}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default AIPerformanceOptimizationExercise;