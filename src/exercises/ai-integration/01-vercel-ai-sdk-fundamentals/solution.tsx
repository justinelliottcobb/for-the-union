import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Card, Text, Group, Stack, Badge, Progress, Alert, Tabs, TextInput, Select, Textarea, NumberInput } from '@mantine/core';

// ===== AI PROVIDER ABSTRACTION =====

interface AIProvider {
  id: string;
  name: string;
  models: ModelInfo[];
  rateLimits: RateLimitInfo;
  pricing: PricingInfo;
  status: 'healthy' | 'degraded' | 'offline';
  lastHealthCheck: string;
}

interface ModelInfo {
  id: string;
  name: string;
  maxTokens: number;
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  capabilities: string[];
}

interface RateLimitInfo {
  requestsPerMinute: number;
  tokensPerMinute: number;
  currentUsage: {
    requests: number;
    tokens: number;
    resetTime: string;
  };
}

interface PricingInfo {
  currency: 'USD';
  billing: 'per-token' | 'per-request';
  minimumCharge?: number;
}

// AI Provider Implementation
const useAIProvider = () => {
  const [providers, setProviders] = useState<AIProvider[]>([
    {
      id: 'openai',
      name: 'OpenAI',
      models: [
        {
          id: 'gpt-4',
          name: 'GPT-4',
          maxTokens: 8192,
          inputCostPer1kTokens: 0.03,
          outputCostPer1kTokens: 0.06,
          capabilities: ['chat', 'completion', 'function-calling']
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          maxTokens: 4096,
          inputCostPer1kTokens: 0.001,
          outputCostPer1kTokens: 0.002,
          capabilities: ['chat', 'completion', 'function-calling']
        }
      ],
      rateLimits: {
        requestsPerMinute: 3500,
        tokensPerMinute: 90000,
        currentUsage: {
          requests: 23,
          tokens: 1250,
          resetTime: new Date(Date.now() + 60000).toISOString()
        }
      },
      pricing: {
        currency: 'USD',
        billing: 'per-token'
      },
      status: 'healthy',
      lastHealthCheck: new Date().toISOString()
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      models: [
        {
          id: 'claude-3-sonnet',
          name: 'Claude 3 Sonnet',
          maxTokens: 200000,
          inputCostPer1kTokens: 0.003,
          outputCostPer1kTokens: 0.015,
          capabilities: ['chat', 'completion', 'analysis']
        },
        {
          id: 'claude-3-haiku',
          name: 'Claude 3 Haiku',
          maxTokens: 200000,
          inputCostPer1kTokens: 0.00025,
          outputCostPer1kTokens: 0.00125,
          capabilities: ['chat', 'completion', 'analysis']
        }
      ],
      rateLimits: {
        requestsPerMinute: 1000,
        tokensPerMinute: 40000,
        currentUsage: {
          requests: 12,
          tokens: 890,
          resetTime: new Date(Date.now() + 45000).toISOString()
        }
      },
      pricing: {
        currency: 'USD',
        billing: 'per-token'
      },
      status: 'healthy',
      lastHealthCheck: new Date().toISOString()
    }
  ]);

  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4');

  const getCurrentProvider = useCallback(() => {
    return providers.find(p => p.id === selectedProvider);
  }, [providers, selectedProvider]);

  const getCurrentModel = useCallback(() => {
    const provider = getCurrentProvider();
    return provider?.models.find(m => m.id === selectedModel);
  }, [getCurrentProvider, selectedModel]);

  const checkProviderHealth = useCallback(async (providerId: string) => {
    // Simulate health check
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setProviders(prev => prev.map(provider => 
      provider.id === providerId 
        ? {
            ...provider,
            status: Math.random() > 0.1 ? 'healthy' : 'degraded',
            lastHealthCheck: new Date().toISOString()
          }
        : provider
    ));
  }, []);

  const selectOptimalProvider = useCallback((criteria: {
    maxCost?: number;
    minTokens?: number;
    requiredCapabilities?: string[];
  }) => {
    const suitableProviders = providers.filter(provider => {
      return provider.models.some(model => {
        const meetsTokenRequirement = !criteria.minTokens || model.maxTokens >= criteria.minTokens;
        const meetsCostRequirement = !criteria.maxCost || 
          (model.inputCostPer1kTokens + model.outputCostPer1kTokens) / 2 <= criteria.maxCost;
        const meetsCapabilities = !criteria.requiredCapabilities ||
          criteria.requiredCapabilities.every(cap => model.capabilities.includes(cap));
        
        return meetsTokenRequirement && meetsCostRequirement && meetsCapabilities;
      });
    });

    if (suitableProviders.length > 0) {
      // Select provider with lowest average cost
      const optimal = suitableProviders.reduce((best, current) => {
        const bestAvgCost = best.models.reduce((sum, model) => 
          sum + (model.inputCostPer1kTokens + model.outputCostPer1kTokens) / 2, 0) / best.models.length;
        const currentAvgCost = current.models.reduce((sum, model) => 
          sum + (model.inputCostPer1kTokens + model.outputCostPer1kTokens) / 2, 0) / current.models.length;
        
        return currentAvgCost < bestAvgCost ? current : best;
      });

      setSelectedProvider(optimal.id);
      setSelectedModel(optimal.models[0].id);
      return optimal;
    }

    return null;
  }, [providers]);

  return {
    providers,
    selectedProvider,
    selectedModel,
    getCurrentProvider,
    getCurrentModel,
    setSelectedProvider,
    setSelectedModel,
    checkProviderHealth,
    selectOptimalProvider
  };
};

// Provider Selection Component
const AIProviderManager: React.FC = () => {
  const {
    providers,
    selectedProvider,
    selectedModel,
    getCurrentProvider,
    getCurrentModel,
    setSelectedProvider,
    setSelectedModel,
    checkProviderHealth,
    selectOptimalProvider
  } = useAIProvider();

  const currentProvider = getCurrentProvider();
  const currentModel = getCurrentModel();

  const handleOptimalSelection = useCallback(() => {
    const criteria = {
      maxCost: 0.01, // $0.01 per 1k tokens
      minTokens: 8000,
      requiredCapabilities: ['chat', 'function-calling']
    };
    
    const optimal = selectOptimalProvider(criteria);
    if (!optimal) {
      alert('No suitable provider found for the given criteria');
    }
  }, [selectOptimalProvider]);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>AI Provider Manager</Text>
          <Button onClick={handleOptimalSelection} variant="light" size="sm">
            Select Optimal Provider
          </Button>
        </Group>

        <Group grow>
          <Select
            label="Provider"
            value={selectedProvider}
            onChange={(value) => value && setSelectedProvider(value)}
            data={providers.map(p => ({ value: p.id, label: p.name }))}
          />
          <Select
            label="Model"
            value={selectedModel}
            onChange={(value) => value && setSelectedModel(value)}
            data={currentProvider?.models.map(m => ({ value: m.id, label: m.name })) || []}
          />
        </Group>

        {currentProvider && (
          <Card withBorder>
            <Group justify="apart" mb="md">
              <Text fw={500}>{currentProvider.name}</Text>
              <Group>
                <Badge color={
                  currentProvider.status === 'healthy' ? 'green' : 
                  currentProvider.status === 'degraded' ? 'orange' : 'red'
                }>
                  {currentProvider.status}
                </Badge>
                <Button 
                  onClick={() => checkProviderHealth(currentProvider.id)}
                  size="xs"
                  variant="light"
                >
                  Check Health
                </Button>
              </Group>
            </Group>

            {currentModel && (
              <div>
                <Text fw={500} mb="sm">Current Model: {currentModel.name}</Text>
                <Group mb="sm">
                  <div>
                    <Text size="xs" c="dimmed">Max Tokens</Text>
                    <Text size="sm">{currentModel.maxTokens.toLocaleString()}</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Input Cost</Text>
                    <Text size="sm">${currentModel.inputCostPer1kTokens}/1k</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Output Cost</Text>
                    <Text size="sm">${currentModel.outputCostPer1kTokens}/1k</Text>
                  </div>
                </Group>
                <Group>
                  {currentModel.capabilities.map((cap, idx) => (
                    <Badge key={idx} size="sm" variant="light">
                      {cap}
                    </Badge>
                  ))}
                </Group>
              </div>
            )}

            <Card withBorder mt="md" padding="sm">
              <Text fw={500} mb="xs">Rate Limits</Text>
              <Group grow>
                <div>
                  <Text size="xs" c="dimmed">Requests/min</Text>
                  <Text size="sm">
                    {currentProvider.rateLimits.currentUsage.requests}/{currentProvider.rateLimits.requestsPerMinute}
                  </Text>
                  <Progress 
                    value={(currentProvider.rateLimits.currentUsage.requests / currentProvider.rateLimits.requestsPerMinute) * 100}
                    size="xs"
                    color="blue"
                  />
                </div>
                <div>
                  <Text size="xs" c="dimmed">Tokens/min</Text>
                  <Text size="sm">
                    {currentProvider.rateLimits.currentUsage.tokens.toLocaleString()}/{currentProvider.rateLimits.tokensPerMinute.toLocaleString()}
                  </Text>
                  <Progress 
                    value={(currentProvider.rateLimits.currentUsage.tokens / currentProvider.rateLimits.tokensPerMinute) * 100}
                    size="xs"
                    color="orange"
                  />
                </div>
              </Group>
            </Card>
          </Card>
        )}
      </Stack>
    </Card>
  );
};

// ===== TOKEN MANAGEMENT SYSTEM =====

interface TokenEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  provider: string;
  model: string;
}

interface TokenUsage {
  sessionId: string;
  timestamp: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  actualCost: number;
  provider: string;
  model: string;
}

const useTokenManager = () => {
  const [usageHistory, setUsageHistory] = useState<TokenUsage[]>([]);
  const [dailyBudget, setDailyBudget] = useState<number>(10.00);
  const [currentSpend, setCurrentSpend] = useState<number>(0);

  // Simple token estimation (in real implementation, use tiktoken or provider-specific tokenizer)
  const estimateTokens = useCallback((text: string, model: string): number => {
    // Rough estimation: ~4 characters per token for most models
    const roughTokenCount = Math.ceil(text.length / 4);
    
    // Adjust for model-specific characteristics
    const modelMultiplier = model.includes('gpt-4') ? 1.1 : 
                           model.includes('claude') ? 0.9 : 1.0;
    
    return Math.ceil(roughTokenCount * modelMultiplier);
  }, []);

  const calculateCost = useCallback((tokens: number, costPer1k: number): number => {
    return (tokens / 1000) * costPer1k;
  }, []);

  const createEstimate = useCallback((
    input: string, 
    maxOutputTokens: number, 
    provider: AIProvider, 
    model: ModelInfo
  ): TokenEstimate => {
    const inputTokens = estimateTokens(input, model.id);
    const outputTokens = maxOutputTokens;
    const totalTokens = inputTokens + outputTokens;
    
    const inputCost = calculateCost(inputTokens, model.inputCostPer1kTokens);
    const outputCost = calculateCost(outputTokens, model.outputCostPer1kTokens);
    const estimatedCost = inputCost + outputCost;

    return {
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
      provider: provider.id,
      model: model.id
    };
  }, [estimateTokens, calculateCost]);

  const recordUsage = useCallback((usage: Omit<TokenUsage, 'sessionId' | 'timestamp'>) => {
    const newUsage: TokenUsage = {
      ...usage,
      sessionId: `session_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    setUsageHistory(prev => [...prev, newUsage]);
    setCurrentSpend(prev => prev + usage.actualCost);
  }, []);

  const checkBudget = useCallback((estimatedCost: number) => {
    const remainingBudget = dailyBudget - currentSpend;
    const wouldExceedBudget = estimatedCost > remainingBudget;
    
    return {
      remainingBudget,
      wouldExceedBudget,
      budgetUtilization: (currentSpend / dailyBudget) * 100,
      canAfford: !wouldExceedBudget
    };
  }, [dailyBudget, currentSpend]);

  const getUsageStats = useCallback(() => {
    const today = new Date().toDateString();
    const todayUsage = usageHistory.filter(usage => 
      new Date(usage.timestamp).toDateString() === today
    );

    const totalTokensToday = todayUsage.reduce((sum, usage) => sum + usage.totalTokens, 0);
    const totalCostToday = todayUsage.reduce((sum, usage) => sum + usage.actualCost, 0);
    
    return {
      totalSessions: todayUsage.length,
      totalTokens: totalTokensToday,
      totalCost: totalCostToday,
      averageCostPerSession: todayUsage.length > 0 ? totalCostToday / todayUsage.length : 0,
      budgetUsed: (totalCostToday / dailyBudget) * 100
    };
  }, [usageHistory, dailyBudget]);

  return {
    dailyBudget,
    currentSpend,
    setDailyBudget,
    estimateTokens,
    createEstimate,
    recordUsage,
    checkBudget,
    getUsageStats,
    usageHistory
  };
};

// Token Counter Component
const TokenCounter: React.FC = () => {
  const { getCurrentProvider, getCurrentModel } = useAIProvider();
  const {
    dailyBudget,
    currentSpend,
    setDailyBudget,
    createEstimate,
    checkBudget,
    getUsageStats,
    recordUsage
  } = useTokenManager();

  const [inputText, setInputText] = useState('');
  const [maxOutputTokens, setMaxOutputTokens] = useState(500);
  const [estimate, setEstimate] = useState<TokenEstimate | null>(null);

  const provider = getCurrentProvider();
  const model = getCurrentModel();
  const stats = getUsageStats();

  const handleEstimate = useCallback(() => {
    if (!provider || !model || !inputText.trim()) return;

    const newEstimate = createEstimate(inputText, maxOutputTokens, provider, model);
    setEstimate(newEstimate);
  }, [inputText, maxOutputTokens, provider, model, createEstimate]);

  const handleSimulateUsage = useCallback(() => {
    if (!estimate) return;

    // Simulate actual usage (in real app, this would come from API response)
    const actualOutputTokens = Math.floor(maxOutputTokens * (0.7 + Math.random() * 0.3));
    const actualInputCost = (estimate.inputTokens / 1000) * (model?.inputCostPer1kTokens || 0);
    const actualOutputCost = (actualOutputTokens / 1000) * (model?.outputCostPer1kTokens || 0);

    recordUsage({
      inputTokens: estimate.inputTokens,
      outputTokens: actualOutputTokens,
      totalTokens: estimate.inputTokens + actualOutputTokens,
      actualCost: actualInputCost + actualOutputCost,
      provider: estimate.provider,
      model: estimate.model
    });
  }, [estimate, maxOutputTokens, model, recordUsage]);

  const budget = checkBudget(estimate?.estimatedCost || 0);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>Token Counter & Cost Estimator</Text>
          <NumberInput
            label="Daily Budget ($)"
            value={dailyBudget}
            onChange={(value) => setDailyBudget(typeof value === 'number' ? value : dailyBudget)}
            min={0}
            step={0.01}
            precision={2}
            size="sm"
            w={120}
          />
        </Group>

        <Textarea
          label="Input Text"
          placeholder="Enter your prompt or text to analyze..."
          value={inputText}
          onChange={(event) => setInputText(event.currentTarget.value)}
          minRows={3}
          maxRows={6}
        />

        <Group>
          <NumberInput
            label="Max Output Tokens"
            value={maxOutputTokens}
            onChange={(value) => setMaxOutputTokens(typeof value === 'number' ? value : maxOutputTokens)}
            min={1}
            max={model?.maxTokens || 8192}
            step={50}
            w={150}
          />
          <Button 
            onClick={handleEstimate}
            disabled={!inputText.trim() || !provider || !model}
          >
            Estimate Tokens & Cost
          </Button>
        </Group>

        {estimate && (
          <Card withBorder>
            <Group justify="apart" mb="md">
              <Text fw={500}>Cost Estimate</Text>
              <Badge color={budget.canAfford ? 'green' : 'red'}>
                {budget.canAfford ? 'Within Budget' : 'Exceeds Budget'}
              </Badge>
            </Group>

            <Group grow mb="md">
              <div>
                <Text size="xs" c="dimmed">Input Tokens</Text>
                <Text size="sm" fw={500}>{estimate.inputTokens.toLocaleString()}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Output Tokens</Text>
                <Text size="sm" fw={500}>{estimate.outputTokens.toLocaleString()}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Total Tokens</Text>
                <Text size="sm" fw={500}>{estimate.totalTokens.toLocaleString()}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Estimated Cost</Text>
                <Text size="sm" fw={500}>${estimate.estimatedCost.toFixed(4)}</Text>
              </div>
            </Group>

            <Button 
              onClick={handleSimulateUsage}
              variant="light"
              fullWidth
            >
              Simulate API Usage
            </Button>
          </Card>
        )}

        <Card withBorder>
          <Text fw={500} mb="md">Daily Usage Statistics</Text>
          
          <Group grow mb="md">
            <div>
              <Text size="xs" c="dimmed">Budget Used</Text>
              <Text size="lg" fw={700}>{stats.budgetUsed.toFixed(1)}%</Text>
              <Progress 
                value={stats.budgetUsed} 
                color={stats.budgetUsed > 80 ? 'red' : stats.budgetUsed > 60 ? 'orange' : 'green'}
                size="sm"
              />
            </div>
            <div>
              <Text size="xs" c="dimmed">Total Cost</Text>
              <Text size="lg" fw={700}>${stats.totalCost.toFixed(4)}</Text>
              <Text size="xs" c="dimmed">of ${dailyBudget.toFixed(2)}</Text>
            </div>
          </Group>

          <Group grow>
            <div>
              <Text size="xs" c="dimmed">Sessions</Text>
              <Text size="sm">{stats.totalSessions}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Total Tokens</Text>
              <Text size="sm">{stats.totalTokens.toLocaleString()}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Avg Cost/Session</Text>
              <Text size="sm">${stats.averageCostPerSession.toFixed(4)}</Text>
            </div>
          </Group>
        </Card>
      </Stack>
    </Card>
  );
};

// ===== STREAMING TEXT COMPONENT =====

interface StreamingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

const StreamingText: React.FC<StreamingTextProps> = ({ 
  text, 
  speed = 50, 
  onComplete, 
  className 
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const indexRef = useRef(0);

  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    setIsComplete(false);
    setDisplayText('');
    indexRef.current = 0;

    intervalRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayText(text.substring(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        setIsStreaming(false);
        setIsComplete(true);
        onComplete?.();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }, speed);
  }, [text, speed, onComplete]);

  const stopStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsStreaming(false);
    setDisplayText(text);
    setIsComplete(true);
    onComplete?.();
  }, [text, onComplete]);

  const resetStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsStreaming(false);
    setIsComplete(false);
    setDisplayText('');
    indexRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className={className}>
      <Group justify="apart" mb="md">
        <Text fw={500}>Streaming Text Demo</Text>
        <Group>
          <Button onClick={startStreaming} disabled={isStreaming} size="sm">
            Start Stream
          </Button>
          <Button onClick={stopStreaming} disabled={!isStreaming} variant="outline" size="sm">
            Complete
          </Button>
          <Button onClick={resetStreaming} variant="light" size="sm">
            Reset
          </Button>
        </Group>
      </Group>

      <Card withBorder p="md" style={{ minHeight: '150px' }}>
        <Text style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
          {displayText}
          {isStreaming && <span style={{ opacity: 0.6 }}>▋</span>}
        </Text>
        
        {isComplete && (
          <Badge color="green" size="sm" mt="md">
            ✓ Streaming Complete
          </Badge>
        )}
      </Card>

      <Progress 
        value={(displayText.length / text.length) * 100} 
        mt="md"
        color={isComplete ? 'green' : 'blue'}
        animate={isStreaming}
      />
    </div>
  );
};

// ===== CHAT INTERFACE =====

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tokens?: number;
  cost?: number;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'Welcome to the AI Chat Interface. This is a demonstration of streaming AI responses with token management.',
      timestamp: new Date().toISOString()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');

  const { getCurrentProvider, getCurrentModel } = useAIProvider();
  const { createEstimate, recordUsage, checkBudget } = useTokenManager();

  const simulateAIResponse = useCallback((prompt: string): string => {
    const responses = [
      "I understand you're asking about AI integration patterns. Here's what I recommend for building production-ready AI applications:\n\n1. Always implement proper error handling\n2. Use streaming responses for better user experience\n3. Implement token counting and cost management\n4. Add rate limiting to prevent API quota issues\n5. Consider provider fallbacks for reliability",
      
      "Great question about streaming responses! Streaming is essential for AI applications because:\n\n• Users get immediate feedback instead of waiting\n• Large responses feel more natural\n• You can implement stop/cancel functionality\n• It reduces perceived latency\n\nThe key is to implement proper buffering and error recovery.",
      
      "For AI state management, I recommend:\n\n```typescript\ninterface ConversationState {\n  messages: Message[];\n  context: string;\n  tokens: TokenUsage;\n  settings: AISettings;\n}\n```\n\nThis approach gives you full control over conversation flow and enables features like conversation branching.",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isGenerating) return;

    const provider = getCurrentProvider();
    const model = getCurrentModel();
    
    if (!provider || !model) {
      alert('Please select a provider and model first');
      return;
    }

    // Create user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);

    // Check budget and estimate cost
    const estimate = createEstimate(inputValue, 500, provider, model);
    const budget = checkBudget(estimate.estimatedCost);
    
    if (!budget.canAfford) {
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: `❌ Request would exceed daily budget. Estimated cost: $${estimate.estimatedCost.toFixed(4)}, Remaining budget: $${budget.remainingBudget.toFixed(4)}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsGenerating(false);
      return;
    }

    try {
      // Simulate AI response generation
      const responseText = simulateAIResponse(inputValue);
      setStreamingResponse('');
      
      // Simulate streaming response
      const assistantMessageId = `assistant_${Date.now()}`;
      let currentResponse = '';
      
      for (let i = 0; i < responseText.length; i++) {
        currentResponse += responseText[i];
        setStreamingResponse(currentResponse);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30));
      }

      // Create final message
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
        tokens: estimate.inputTokens + Math.floor(responseText.length / 4),
        cost: estimate.estimatedCost
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingResponse('');

      // Record actual usage
      recordUsage({
        inputTokens: estimate.inputTokens,
        outputTokens: Math.floor(responseText.length / 4),
        totalTokens: estimate.totalTokens,
        actualCost: estimate.estimatedCost,
        provider: provider.id,
        model: model.id
      });

    } catch (error) {
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: `❌ Error generating response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  }, [inputValue, isGenerating, getCurrentProvider, getCurrentModel, createEstimate, checkBudget, recordUsage, simulateAIResponse]);

  const clearConversation = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'system',
      content: 'Conversation cleared. Ready for new messages.',
      timestamp: new Date().toISOString()
    }]);
    setStreamingResponse('');
  }, []);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>AI Chat Interface</Text>
          <Button onClick={clearConversation} variant="light" size="sm">
            Clear Chat
          </Button>
        </Group>

        <Card withBorder style={{ height: '400px', overflow: 'auto' }} p="md">
          <Stack gap="md">
            {messages.map((message) => (
              <div key={message.id}>
                <Group gap="sm" mb="xs">
                  <Badge 
                    color={
                      message.role === 'user' ? 'blue' : 
                      message.role === 'assistant' ? 'green' : 'gray'
                    }
                    size="sm"
                  >
                    {message.role}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </Text>
                  {message.tokens && (
                    <Badge size="xs" variant="light">
                      {message.tokens} tokens
                    </Badge>
                  )}
                  {message.cost && (
                    <Badge size="xs" variant="light">
                      ${message.cost.toFixed(4)}
                    </Badge>
                  )}
                </Group>
                <Text 
                  style={{ 
                    whiteSpace: 'pre-wrap',
                    fontFamily: message.role === 'system' ? 'inherit' : 'monospace'
                  }}
                  size="sm"
                >
                  {message.content}
                </Text>
              </div>
            ))}

            {streamingResponse && (
              <div>
                <Group gap="sm" mb="xs">
                  <Badge color="green" size="sm">assistant</Badge>
                  <Badge size="xs" color="blue">streaming...</Badge>
                </Group>
                <Text 
                  style={{ 
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace'
                  }}
                  size="sm"
                >
                  {streamingResponse}
                  <span style={{ opacity: 0.6 }}>▋</span>
                </Text>
              </div>
            )}
          </Stack>
        </Card>

        <Group>
          <Textarea
            placeholder="Type your message..."
            value={inputValue}
            onChange={(event) => setInputValue(event.currentTarget.value)}
            style={{ flex: 1 }}
            minRows={2}
            maxRows={4}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isGenerating}
            loading={isGenerating}
          >
            Send
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

// ===== MAIN COMPONENT =====

export const VercelAISDKFundamentalsExercise: React.FC = () => {
  const demoText = `Welcome to the Vercel AI SDK Fundamentals exercise! 

This demonstrates streaming text functionality that you'll implement in your AI applications. 

Key features include:
- Real-time text streaming
- Configurable typing speed
- Start/stop/reset controls
- Progress tracking
- Completion callbacks

This streaming pattern is essential for creating responsive AI interfaces that provide immediate feedback to users while responses are being generated.`;

  return (
    <div style={{ padding: '20px' }}>
      <Stack>
        <div>
          <h1>Vercel AI SDK Fundamentals</h1>
          <p>Master modern AI integration patterns with provider abstraction, token management, and streaming responses</p>
        </div>

        <Tabs defaultValue="providers">
          <Tabs.List>
            <Tabs.Tab value="providers">AI Providers</Tabs.Tab>
            <Tabs.Tab value="tokens">Token Management</Tabs.Tab>
            <Tabs.Tab value="streaming">Streaming Text</Tabs.Tab>
            <Tabs.Tab value="chat">Chat Interface</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="providers" pt="md">
            <AIProviderManager />
          </Tabs.Panel>

          <Tabs.Panel value="tokens" pt="md">
            <TokenCounter />
          </Tabs.Panel>

          <Tabs.Panel value="streaming" pt="md">
            <StreamingText 
              text={demoText}
              speed={30}
              onComplete={() => console.log('Streaming completed!')}
            />
          </Tabs.Panel>

          <Tabs.Panel value="chat" pt="md">
            <ChatInterface />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </div>
  );
};

export default VercelAISDKFundamentalsExercise;