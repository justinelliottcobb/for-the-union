import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Card, Text, Group, Stack, Badge, Progress, Alert, Tabs, TextInput, Select, Textarea, NumberInput, JsonInput, Code, ScrollArea, Divider, ActionIcon, Modal, Table, ThemeIcon, Timeline, Slider, Switch } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconMessage, IconBrain, IconDatabase, IconOptimize, IconTimeline, IconSettings, IconTrash, IconDownload, IconUpload, IconSearch, IconFilter, IconChartLine, IconMemory } from '@tabler/icons-react';

// ===== AI STATE MANAGEMENT TYPES =====

interface ConversationState {
  id: string;
  metadata: ConversationMetadata;
  messages: MessageThread[];
  context: ConversationContext;
  branches: ConversationBranch[];
  summary: ConversationSummary;
  analytics: ConversationAnalytics;
}

interface ConversationMetadata {
  title: string;
  createdAt: string;
  lastModified: string;
  userId: string;
  tags: string[];
  priority: 'low' | 'normal' | 'high';
  status: 'active' | 'archived' | 'deleted';
}

interface MessageThread {
  id: string;
  messages: Message[];
  parentId?: string;
  branchPoint?: number;
  metadata: ThreadMetadata;
}

interface ThreadMetadata {
  createdAt: string;
  lastMessage: string;
  messageCount: number;
  isActive: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata: MessageMetadata;
  relevanceScore?: number;
  compressed?: boolean;
}

interface MessageMetadata {
  tokens?: number;
  cost?: number;
  model?: string;
  processingTime?: number;
  importance?: number;
}

interface ConversationContext {
  windowSize: number;
  activeWindow: Message[];
  compressedHistory: CompressedContext[];
  globalContext: GlobalContextData;
  preferences: UserPreferences;
}

interface CompressedContext {
  id: string;
  summary: string;
  keyPoints: string[];
  timeRange: { start: string; end: string };
  messageCount: number;
  compressionRatio: number;
}

interface GlobalContextData {
  variables: Map<string, any>;
  facts: FactualKnowledge[];
  relationships: EntityRelationship[];
  preferences: Record<string, any>;
}

interface FactualKnowledge {
  id: string;
  content: string;
  confidence: number;
  source: string;
  timestamp: string;
  category: string;
}

interface EntityRelationship {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
  context: string;
}

interface UserPreferences {
  contextWindowSize: number;
  compressionStrategy: 'aggressive' | 'balanced' | 'conservative';
  retentionPeriod: number;
  priorityWeighting: Record<string, number>;
}

interface ConversationBranch {
  id: string;
  parentMessageId: string;
  threadId: string;
  title: string;
  createdAt: string;
  metadata: BranchMetadata;
}

interface BranchMetadata {
  description: string;
  isExperimental: boolean;
  performanceMetrics: PerformanceMetrics;
}

interface PerformanceMetrics {
  responseTime: number;
  accuracy: number;
  userSatisfaction: number;
  resourceUsage: number;
}

interface ConversationSummary {
  overview: string;
  keyTopics: string[];
  decisions: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  complexity: number;
}

interface ConversationAnalytics {
  messageCount: number;
  avgResponseTime: number;
  topicDistribution: Record<string, number>;
  engagementScore: number;
  costAnalysis: CostAnalysis;
  optimizationOpportunities: string[];
}

interface CostAnalysis {
  totalTokens: number;
  totalCost: number;
  avgCostPerMessage: number;
  costByModel: Record<string, number>;
}

interface ContextWindow {
  size: number;
  strategy: WindowingStrategy;
  content: WindowContent[];
  metadata: WindowMetadata;
  optimization: OptimizationSettings;
}

interface WindowingStrategy {
  type: 'fixed' | 'adaptive' | 'semantic' | 'hybrid';
  pruningAlgorithm: PruningAlgorithm;
  compressionRatio: number;
  retentionCriteria: RetentionCriteria;
}

interface PruningAlgorithm {
  relevanceScoring: ScoringFunction;
  recencyWeighting: WeightingFunction;
  importanceThreshold: number;
  preservationRules: PreservationRule[];
}

interface ScoringFunction {
  algorithm: 'tfidf' | 'semantic' | 'hybrid';
  weights: Record<string, number>;
}

interface WeightingFunction {
  type: 'exponential' | 'linear' | 'logarithmic';
  decayRate: number;
}

interface RetentionCriteria {
  minRelevanceScore: number;
  maxAge: number;
  preserveSystemMessages: boolean;
  preserveUserQuestions: boolean;
}

interface PreservationRule {
  type: string;
  condition: string;
  priority: number;
}

interface WindowContent {
  messageId: string;
  relevanceScore: number;
  retentionReason: string;
  compressionLevel: number;
}

interface WindowMetadata {
  totalMessages: number;
  compressionRatio: number;
  avgRelevanceScore: number;
  lastOptimization: string;
}

interface OptimizationSettings {
  enabled: boolean;
  frequency: number;
  aggressiveness: number;
  performanceTarget: string;
}

interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  relevanceScore: number;
  createdAt: string;
  lastAccessed: string;
  accessCount: number;
  category: string;
  tags: string[];
}

type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'factual';

interface MemoryStore {
  shortTerm: ShortTermMemory;
  longTerm: LongTermMemory;
  episodic: EpisodicMemory;
  semantic: SemanticMemory;
  procedural: ProceduralMemory;
}

interface ShortTermMemory {
  capacity: number;
  current: Memory[];
  retention: number;
}

interface LongTermMemory {
  facts: FactualKnowledge[];
  summaries: ConversationSummary[];
  relationships: EntityRelationship[];
  patterns: ConversationPattern[];
  preferences: UserPreferenceData[];
}

interface EpisodicMemory {
  episodes: ConversationEpisode[];
  timeline: TimelineEvent[];
}

interface SemanticMemory {
  concepts: Concept[];
  relationships: ConceptRelationship[];
  categories: Category[];
}

interface ProceduralMemory {
  procedures: Procedure[];
  skills: Skill[];
  workflows: Workflow[];
}

interface ConversationPattern {
  id: string;
  pattern: string;
  frequency: number;
  context: string[];
  effectiveness: number;
}

interface UserPreferenceData {
  key: string;
  value: any;
  confidence: number;
  source: string;
}

interface ConversationEpisode {
  id: string;
  title: string;
  summary: string;
  startTime: string;
  endTime: string;
  participants: string[];
  outcome: string;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  significance: number;
}

interface Concept {
  id: string;
  name: string;
  definition: string;
  examples: string[];
  relatedConcepts: string[];
}

interface ConceptRelationship {
  source: string;
  target: string;
  type: 'is-a' | 'part-of' | 'related-to' | 'opposite-of';
  strength: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  concepts: string[];
  parent?: string;
}

interface Procedure {
  id: string;
  name: string;
  steps: string[];
  conditions: string[];
  outcomes: string[];
}

interface Skill {
  id: string;
  name: string;
  level: number;
  procedures: string[];
  applications: string[];
}

interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  triggers: string[];
  outcomes: string[];
}

interface WorkflowStep {
  id: string;
  action: string;
  inputs: string[];
  outputs: string[];
  conditions?: string[];
}

// ===== CONVERSATION STATE MANAGER =====

const useConversationStateManager = () => {
  const [conversations, setConversations] = useState<Map<string, ConversationState>>(new Map());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const createConversation = useCallback((title: string, userId: string): string => {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newConversation: ConversationState = {
      id,
      metadata: {
        title,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        userId,
        tags: [],
        priority: 'normal',
        status: 'active'
      },
      messages: [{
        id: `thread_${Date.now()}`,
        messages: [],
        metadata: {
          createdAt: new Date().toISOString(),
          lastMessage: '',
          messageCount: 0,
          isActive: true
        }
      }],
      context: {
        windowSize: 20,
        activeWindow: [],
        compressedHistory: [],
        globalContext: {
          variables: new Map(),
          facts: [],
          relationships: [],
          preferences: {}
        },
        preferences: {
          contextWindowSize: 20,
          compressionStrategy: 'balanced',
          retentionPeriod: 7,
          priorityWeighting: { system: 0.8, user: 1.0, assistant: 0.9 }
        }
      },
      branches: [],
      summary: {
        overview: '',
        keyTopics: [],
        decisions: [],
        actionItems: [],
        sentiment: 'neutral',
        complexity: 0
      },
      analytics: {
        messageCount: 0,
        avgResponseTime: 0,
        topicDistribution: {},
        engagementScore: 0,
        costAnalysis: {
          totalTokens: 0,
          totalCost: 0,
          avgCostPerMessage: 0,
          costByModel: {}
        },
        optimizationOpportunities: []
      }
    };

    setConversations(prev => new Map(prev.set(id, newConversation)));
    setActiveConversationId(id);

    notifications.show({
      title: 'Conversation Created',
      message: `New conversation "${title}" created successfully`,
      color: 'green'
    });

    return id;
  }, []);

  const addMessage = useCallback((conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    setConversations(prev => {
      const conversation = prev.get(conversationId);
      if (!conversation) return prev;

      const fullMessage: Message = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      };

      const updatedConversation: ConversationState = {
        ...conversation,
        messages: conversation.messages.map((thread, index) => 
          index === 0 ? {
            ...thread,
            messages: [...thread.messages, fullMessage],
            metadata: {
              ...thread.metadata,
              lastMessage: fullMessage.timestamp,
              messageCount: thread.messages.length + 1
            }
          } : thread
        ),
        metadata: {
          ...conversation.metadata,
          lastModified: new Date().toISOString()
        },
        analytics: {
          ...conversation.analytics,
          messageCount: conversation.analytics.messageCount + 1
        }
      };

      return new Map(prev.set(conversationId, updatedConversation));
    });
  }, []);

  const createBranch = useCallback((conversationId: string, messageId: string, title: string) => {
    setConversations(prev => {
      const conversation = prev.get(conversationId);
      if (!conversation) return prev;

      const branchId = `branch_${Date.now()}`;
      const threadId = `thread_${Date.now()}`;

      const newBranch: ConversationBranch = {
        id: branchId,
        parentMessageId: messageId,
        threadId,
        title,
        createdAt: new Date().toISOString(),
        metadata: {
          description: `Branch created from message ${messageId}`,
          isExperimental: true,
          performanceMetrics: {
            responseTime: 0,
            accuracy: 0,
            userSatisfaction: 0,
            resourceUsage: 0
          }
        }
      };

      const newThread: MessageThread = {
        id: threadId,
        messages: [],
        parentId: messageId,
        branchPoint: conversation.messages[0].messages.findIndex(m => m.id === messageId),
        metadata: {
          createdAt: new Date().toISOString(),
          lastMessage: '',
          messageCount: 0,
          isActive: false
        }
      };

      const updatedConversation: ConversationState = {
        ...conversation,
        branches: [...conversation.branches, newBranch],
        messages: [...conversation.messages, newThread]
      };

      return new Map(prev.set(conversationId, updatedConversation));
    });

    notifications.show({
      title: 'Branch Created',
      message: `New conversation branch "${title}" created`,
      color: 'blue'
    });
  }, []);

  const exportConversation = useCallback((conversationId: string): string => {
    const conversation = conversations.get(conversationId);
    if (!conversation) return '';

    return JSON.stringify(conversation, (key, value) => {
      if (value instanceof Map) {
        return Object.fromEntries(value);
      }
      return value;
    }, 2);
  }, [conversations]);

  const importConversation = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data);
      
      // Restore Maps
      if (parsed.context?.globalContext?.variables) {
        parsed.context.globalContext.variables = new Map(
          Object.entries(parsed.context.globalContext.variables)
        );
      }

      setConversations(prev => new Map(prev.set(parsed.id, parsed)));
      
      notifications.show({
        title: 'Conversation Imported',
        message: 'Conversation has been imported successfully',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Import Failed',
        message: 'Failed to import conversation data',
        color: 'red'
      });
    }
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => {
      const newMap = new Map(prev);
      newMap.delete(conversationId);
      return newMap;
    });

    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
    }

    notifications.show({
      title: 'Conversation Deleted',
      message: 'Conversation has been deleted',
      color: 'yellow'
    });
  }, [activeConversationId]);

  const getConversationStats = useCallback(() => {
    const totalConversations = conversations.size;
    const totalMessages = Array.from(conversations.values()).reduce(
      (sum, conv) => sum + conv.analytics.messageCount, 0
    );
    const totalCost = Array.from(conversations.values()).reduce(
      (sum, conv) => sum + conv.analytics.costAnalysis.totalCost, 0
    );

    return {
      totalConversations,
      totalMessages,
      totalCost,
      avgMessagesPerConversation: totalMessages / totalConversations || 0
    };
  }, [conversations]);

  return {
    conversations: Array.from(conversations.values()),
    activeConversationId,
    setActiveConversationId,
    createConversation,
    addMessage,
    createBranch,
    exportConversation,
    importConversation,
    deleteConversation,
    getConversationStats
  };
};

// ===== CONTEXT WINDOW MANAGER =====

const useContextWindowManager = () => {
  const [windowConfig, setWindowConfig] = useState<ContextWindow>({
    size: 20,
    strategy: {
      type: 'adaptive',
      pruningAlgorithm: {
        relevanceScoring: {
          algorithm: 'hybrid',
          weights: { recency: 0.3, importance: 0.4, semantic: 0.3 }
        },
        recencyWeighting: {
          type: 'exponential',
          decayRate: 0.1
        },
        importanceThreshold: 0.5,
        preservationRules: [
          { type: 'system', condition: 'role === "system"', priority: 10 },
          { type: 'user_question', condition: 'role === "user" && content.includes("?")', priority: 8 }
        ]
      },
      compressionRatio: 0.3,
      retentionCriteria: {
        minRelevanceScore: 0.3,
        maxAge: 24 * 60 * 60 * 1000,
        preserveSystemMessages: true,
        preserveUserQuestions: true
      }
    },
    content: [],
    metadata: {
      totalMessages: 0,
      compressionRatio: 0,
      avgRelevanceScore: 0,
      lastOptimization: new Date().toISOString()
    },
    optimization: {
      enabled: true,
      frequency: 5,
      aggressiveness: 0.5,
      performanceTarget: 'balanced'
    }
  });

  const calculateRelevanceScore = useCallback((message: Message, context: Message[]): number => {
    let score = 0;

    // Recency score
    const messageAge = Date.now() - new Date(message.timestamp).getTime();
    const recencyScore = Math.exp(-messageAge / (24 * 60 * 60 * 1000 * 0.1));
    score += recencyScore * 0.3;

    // Role importance
    const roleWeights = { system: 0.9, user: 1.0, assistant: 0.8 };
    score += roleWeights[message.role] * 0.2;

    // Content length (longer messages often more important)
    const lengthScore = Math.min(message.content.length / 500, 1);
    score += lengthScore * 0.2;

    // Question detection
    if (message.content.includes('?')) {
      score += 0.15;
    }

    // Keywords importance
    const importantKeywords = ['important', 'critical', 'urgent', 'remember', 'note'];
    const hasImportantKeywords = importantKeywords.some(keyword => 
      message.content.toLowerCase().includes(keyword)
    );
    if (hasImportantKeywords) {
      score += 0.15;
    }

    return Math.min(score, 1);
  }, []);

  const pruneContext = useCallback((messages: Message[]): Message[] => {
    if (messages.length <= windowConfig.size) {
      return messages;
    }

    // Calculate relevance scores
    const scoredMessages = messages.map(message => ({
      ...message,
      relevanceScore: calculateRelevanceScore(message, messages)
    }));

    // Sort by relevance score (descending)
    scoredMessages.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    // Apply preservation rules
    const preserved: Message[] = [];
    const candidates: Message[] = [];

    scoredMessages.forEach(message => {
      const shouldPreserve = windowConfig.strategy.pruningAlgorithm.preservationRules.some(rule => {
        if (rule.type === 'system' && message.role === 'system') return true;
        if (rule.type === 'user_question' && message.role === 'user' && message.content.includes('?')) return true;
        return false;
      });

      if (shouldPreserve) {
        preserved.push(message);
      } else if ((message.relevanceScore || 0) >= windowConfig.strategy.retentionCriteria.minRelevanceScore) {
        candidates.push(message);
      }
    });

    // Select best candidates to fill remaining space
    const remainingSpace = windowConfig.size - preserved.length;
    const selected = candidates.slice(0, Math.max(0, remainingSpace));

    // Combine and sort by timestamp
    const result = [...preserved, ...selected].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return result;
  }, [windowConfig.size, windowConfig.strategy, calculateRelevanceScore]);

  const compressContext = useCallback((messages: Message[]): CompressedContext => {
    const timeRange = {
      start: messages[0]?.timestamp || new Date().toISOString(),
      end: messages[messages.length - 1]?.timestamp || new Date().toISOString()
    };

    // Extract key points using simple heuristics
    const keyPoints = messages
      .filter(msg => msg.role === 'user' && msg.content.includes('?'))
      .map(msg => msg.content.substring(0, 100))
      .slice(0, 5);

    // Create summary
    const topics = new Set<string>();
    messages.forEach(msg => {
      const words = msg.content.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 5) topics.add(word);
      });
    });

    const summary = `Conversation covered ${topics.size} topics including: ${
      Array.from(topics).slice(0, 3).join(', ')
    }. ${messages.length} messages exchanged.`;

    return {
      id: `compressed_${Date.now()}`,
      summary,
      keyPoints,
      timeRange,
      messageCount: messages.length,
      compressionRatio: windowConfig.strategy.compressionRatio
    };
  }, [windowConfig.strategy.compressionRatio]);

  const optimizeWindow = useCallback((messages: Message[]): Message[] => {
    if (!windowConfig.optimization.enabled) {
      return messages;
    }

    const optimized = pruneContext(messages);
    
    setWindowConfig(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        totalMessages: messages.length,
        compressionRatio: (messages.length - optimized.length) / messages.length,
        avgRelevanceScore: optimized.reduce((sum, msg) => sum + (msg.relevanceScore || 0), 0) / optimized.length || 0,
        lastOptimization: new Date().toISOString()
      }
    }));

    return optimized;
  }, [windowConfig.optimization.enabled, pruneContext]);

  const updateWindowConfig = useCallback((updates: Partial<ContextWindow>) => {
    setWindowConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    windowConfig,
    updateWindowConfig,
    calculateRelevanceScore,
    pruneContext,
    compressContext,
    optimizeWindow
  };
};

// ===== MEMORY MANAGER =====

const useMemoryManager = () => {
  const [memoryStore, setMemoryStore] = useState<MemoryStore>({
    shortTerm: {
      capacity: 50,
      current: [],
      retention: 0.8
    },
    longTerm: {
      facts: [],
      summaries: [],
      relationships: [],
      patterns: [],
      preferences: []
    },
    episodic: {
      episodes: [],
      timeline: []
    },
    semantic: {
      concepts: [],
      relationships: [],
      categories: []
    },
    procedural: {
      procedures: [],
      skills: [],
      workflows: []
    }
  });

  const addMemory = useCallback((memory: Omit<Memory, 'id' | 'createdAt' | 'lastAccessed' | 'accessCount'>) => {
    const fullMemory: Memory = {
      ...memory,
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      accessCount: 0
    };

    setMemoryStore(prev => ({
      ...prev,
      shortTerm: {
        ...prev.shortTerm,
        current: [...prev.shortTerm.current, fullMemory].slice(-prev.shortTerm.capacity)
      }
    }));

    notifications.show({
      title: 'Memory Added',
      message: `${memory.type} memory added successfully`,
      color: 'blue'
    });
  }, []);

  const searchMemories = useCallback((query: string, type?: MemoryType): Memory[] => {
    const allMemories = [
      ...memoryStore.shortTerm.current,
      // In a real implementation, we'd also search long-term memories
    ];

    return allMemories.filter(memory => {
      if (type && memory.type !== type) return false;
      return memory.content.toLowerCase().includes(query.toLowerCase()) ||
             memory.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [memoryStore.shortTerm.current]);

  const consolidateMemories = useCallback(() => {
    const shortTermMemories = memoryStore.shortTerm.current;
    
    // Simple consolidation: move high-relevance memories to long-term
    const highRelevance = shortTermMemories.filter(mem => mem.relevanceScore > 0.7);
    
    if (highRelevance.length > 0) {
      setMemoryStore(prev => ({
        ...prev,
        longTerm: {
          ...prev.longTerm,
          facts: [
            ...prev.longTerm.facts,
            ...highRelevance
              .filter(mem => mem.type === 'factual')
              .map(mem => ({
                id: mem.id,
                content: mem.content,
                confidence: mem.relevanceScore,
                source: 'conversation',
                timestamp: mem.createdAt,
                category: mem.category
              }))
          ]
        },
        shortTerm: {
          ...prev.shortTerm,
          current: prev.shortTerm.current.filter(mem => mem.relevanceScore <= 0.7)
        }
      }));

      notifications.show({
        title: 'Memories Consolidated',
        message: `${highRelevance.length} memories moved to long-term storage`,
        color: 'green'
      });
    }
  }, [memoryStore.shortTerm.current]);

  const getMemoryStats = useCallback(() => {
    return {
      shortTerm: {
        count: memoryStore.shortTerm.current.length,
        capacity: memoryStore.shortTerm.capacity,
        utilizationRate: memoryStore.shortTerm.current.length / memoryStore.shortTerm.capacity
      },
      longTerm: {
        facts: memoryStore.longTerm.facts.length,
        summaries: memoryStore.longTerm.summaries.length,
        relationships: memoryStore.longTerm.relationships.length,
        patterns: memoryStore.longTerm.patterns.length
      },
      total: memoryStore.shortTerm.current.length + 
             memoryStore.longTerm.facts.length + 
             memoryStore.longTerm.summaries.length
    };
  }, [memoryStore]);

  const createConversationSummary = useCallback((messages: Message[]): ConversationSummary => {
    // Simple summarization logic
    const userMessages = messages.filter(m => m.role === 'user').length;
    const assistantMessages = messages.filter(m => m.role === 'assistant').length;
    
    const topics = new Set<string>();
    messages.forEach(msg => {
      const words = msg.content.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 4) topics.add(word);
      });
    });

    const keyTopics = Array.from(topics).slice(0, 5);
    
    return {
      overview: `Conversation with ${userMessages} user messages and ${assistantMessages} assistant responses`,
      keyTopics,
      decisions: [],
      actionItems: [],
      sentiment: 'neutral',
      complexity: Math.min(messages.length / 10, 10)
    };
  }, []);

  // Initialize with sample memories
  useEffect(() => {
    const sampleMemories: Memory[] = [
      {
        id: 'mem_sample_1',
        type: 'factual',
        content: 'User prefers concise responses',
        relevanceScore: 0.8,
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        accessCount: 5,
        category: 'user_preferences',
        tags: ['preference', 'communication']
      },
      {
        id: 'mem_sample_2',
        type: 'episodic',
        content: 'Previous discussion about React hooks',
        relevanceScore: 0.6,
        createdAt: new Date(Date.now() - 60000).toISOString(),
        lastAccessed: new Date().toISOString(),
        accessCount: 2,
        category: 'technical',
        tags: ['react', 'hooks', 'programming']
      }
    ];

    setMemoryStore(prev => ({
      ...prev,
      shortTerm: {
        ...prev.shortTerm,
        current: sampleMemories
      }
    }));
  }, []);

  return {
    memoryStore,
    addMemory,
    searchMemories,
    consolidateMemories,
    getMemoryStats,
    createConversationSummary
  };
};

// ===== CONVERSATION STATE MANAGER COMPONENT =====

const ConversationStateManager: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    addMessage,
    createBranch,
    exportConversation,
    importConversation,
    deleteConversation,
    getConversationStats
  } = useConversationStateManager();

  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messageRole, setMessageRole] = useState<'user' | 'assistant' | 'system'>('user');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [branchTitle, setBranchTitle] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string>('');

  const stats = getConversationStats();
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const handleCreateConversation = useCallback(() => {
    if (!newConversationTitle.trim()) return;
    createConversation(newConversationTitle, 'demo-user');
    setNewConversationTitle('');
  }, [newConversationTitle, createConversation]);

  const handleAddMessage = useCallback(() => {
    if (!activeConversationId || !newMessage.trim()) return;
    
    addMessage(activeConversationId, {
      role: messageRole,
      content: newMessage,
      metadata: {
        importance: 0.7
      }
    });
    
    setNewMessage('');
  }, [activeConversationId, newMessage, messageRole, addMessage]);

  const handleCreateBranch = useCallback(() => {
    if (!activeConversationId || !selectedMessageId || !branchTitle.trim()) return;
    
    createBranch(activeConversationId, selectedMessageId, branchTitle);
    setBranchTitle('');
    setSelectedMessageId('');
  }, [activeConversationId, selectedMessageId, branchTitle, createBranch]);

  const handleExport = useCallback(() => {
    if (!activeConversationId) return;
    
    const data = exportConversation(activeConversationId);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${activeConversationId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeConversationId, exportConversation]);

  const handleImport = useCallback(() => {
    importConversation(importData);
    setShowImportModal(false);
    setImportData('');
  }, [importData, importConversation]);

  return (
    <Stack>
      <Card>
        <Text size="sm" fw={500} mb="xs">Conversation Statistics</Text>
        <Group>
          <Text size="xs">Total: {stats.totalConversations}</Text>
          <Text size="xs">Messages: {stats.totalMessages}</Text>
          <Text size="xs">Avg/Conv: {stats.avgMessagesPerConversation.toFixed(1)}</Text>
          <Text size="xs">Cost: ${stats.totalCost.toFixed(4)}</Text>
        </Group>
      </Card>

      <Group>
        <TextInput
          placeholder="Conversation title..."
          value={newConversationTitle}
          onChange={(e) => setNewConversationTitle(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button onClick={handleCreateConversation}>Create</Button>
        <Button onClick={() => setShowImportModal(true)} leftSection={<IconUpload size={16} />}>
          Import
        </Button>
        {activeConversationId && (
          <Button onClick={handleExport} leftSection={<IconDownload size={16} />}>
            Export
          </Button>
        )}
      </Group>

      <Group align="stretch" style={{ minHeight: 400 }}>
        <Card style={{ flex: 1 }}>
          <Text size="sm" fw={500} mb="xs">Conversations ({conversations.length})</Text>
          <ScrollArea h={350}>
            <Stack gap="xs">
              {conversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  p="xs"
                  withBorder
                  style={{ cursor: 'pointer' }}
                  bg={activeConversationId === conversation.id ? 'var(--mantine-color-blue-light)' : undefined}
                  onClick={() => setActiveConversationId(conversation.id)}
                >
                  <Group>
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>{conversation.metadata.title}</Text>
                      <Text size="xs" c="dimmed">
                        {conversation.analytics.messageCount} messages • {conversation.branches.length} branches
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(conversation.metadata.lastModified).toLocaleDateString()}
                      </Text>
                    </div>
                    <Badge size="xs" color={conversation.metadata.status === 'active' ? 'green' : 'gray'}>
                      {conversation.metadata.status}
                    </Badge>
                    <ActionIcon
                      size="sm"
                      color="red"
                      variant="subtle"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.id);
                      }}
                    >
                      <IconTrash size={12} />
                    </ActionIcon>
                  </Group>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
        </Card>

        <Card style={{ flex: 1 }}>
          {activeConversation ? (
            <Stack>
              <div>
                <Text size="sm" fw={500}>{activeConversation.metadata.title}</Text>
                <Text size="xs" c="dimmed">
                  Created: {new Date(activeConversation.metadata.createdAt).toLocaleString()}
                </Text>
              </div>

              <Divider />

              <div>
                <Text size="xs" fw={500} mb="xs">Messages ({activeConversation.analytics.messageCount})</Text>
                <ScrollArea h={200}>
                  <Stack gap="xs">
                    {activeConversation.messages[0]?.messages.map((msg) => (
                      <Card key={msg.id} p="xs" withBorder>
                        <Group>
                          <Badge size="xs" color={
                            msg.role === 'user' ? 'blue' : 
                            msg.role === 'assistant' ? 'green' : 'orange'
                          }>
                            {msg.role}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </Text>
                          {msg.relevanceScore && (
                            <Badge size="xs" variant="outline">
                              {(msg.relevanceScore * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </Group>
                        <Text size="xs" mt="xs">{msg.content}</Text>
                      </Card>
                    ))}
                  </Stack>
                </ScrollArea>
              </div>

              <Group>
                <Select
                  data={[
                    { value: 'user', label: 'User' },
                    { value: 'assistant', label: 'Assistant' },
                    { value: 'system', label: 'System' }
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
                />
                <Button onClick={handleAddMessage} size="sm">Add</Button>
              </Group>

              <Divider />

              <div>
                <Text size="xs" fw={500} mb="xs">Create Branch</Text>
                <Group>
                  <TextInput
                    placeholder="Branch title..."
                    value={branchTitle}
                    onChange={(e) => setBranchTitle(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Select
                    placeholder="From message"
                    data={activeConversation.messages[0]?.messages.map(msg => ({
                      value: msg.id,
                      label: `${msg.role}: ${msg.content.substring(0, 30)}...`
                    })) || []}
                    value={selectedMessageId}
                    onChange={(value) => setSelectedMessageId(value || '')}
                    style={{ width: 200 }}
                  />
                  <Button onClick={handleCreateBranch} size="sm">Branch</Button>
                </Group>
              </div>

              {activeConversation.branches.length > 0 && (
                <div>
                  <Text size="xs" fw={500} mb="xs">Branches ({activeConversation.branches.length})</Text>
                  <Stack gap="xs">
                    {activeConversation.branches.map((branch) => (
                      <Card key={branch.id} p="xs" withBorder>
                        <Text size="xs" fw={500}>{branch.title}</Text>
                        <Text size="xs" c="dimmed">
                          Created: {new Date(branch.createdAt).toLocaleString()}
                        </Text>
                      </Card>
                    ))}
                  </Stack>
                </div>
              )}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">Select a conversation to view details</Text>
          )}
        </Card>
      </Group>

      <Modal
        opened={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Conversation"
        size="lg"
      >
        <Stack>
          <Textarea
            label="Conversation Data (JSON)"
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            rows={15}
            placeholder="Paste conversation JSON data here..."
          />
          <Group>
            <Button onClick={handleImport}>Import</Button>
            <Button variant="outline" onClick={() => setShowImportModal(false)}>Cancel</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

// ===== CONTEXT WINDOW MANAGER COMPONENT =====

const ContextWindowManagerComponent: React.FC = () => {
  const { windowConfig, updateWindowConfig, calculateRelevanceScore, optimizeWindow } = useContextWindowManager();
  const [testMessages] = useState<Message[]>([
    {
      id: 'msg1',
      role: 'user',
      content: 'What is React?',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      metadata: { importance: 0.8 }
    },
    {
      id: 'msg2',
      role: 'assistant',
      content: 'React is a JavaScript library for building user interfaces...',
      timestamp: new Date(Date.now() - 50000).toISOString(),
      metadata: { importance: 0.7 }
    },
    {
      id: 'msg3',
      role: 'user',
      content: 'How do I use hooks?',
      timestamp: new Date(Date.now() - 40000).toISOString(),
      metadata: { importance: 0.9 }
    },
    {
      id: 'msg4',
      role: 'assistant',
      content: 'Hooks are functions that let you use state and other React features...',
      timestamp: new Date(Date.now() - 30000).toISOString(),
      metadata: { importance: 0.6 }
    },
    {
      id: 'msg5',
      role: 'system',
      content: 'Context window optimization enabled',
      timestamp: new Date(Date.now() - 20000).toISOString(),
      metadata: { importance: 0.5 }
    }
  ]);

  const [optimizedMessages, setOptimizedMessages] = useState<Message[]>([]);

  const handleOptimize = useCallback(() => {
    const optimized = optimizeWindow(testMessages);
    setOptimizedMessages(optimized);
    
    notifications.show({
      title: 'Context Optimized',
      message: `Reduced from ${testMessages.length} to ${optimized.length} messages`,
      color: 'green'
    });
  }, [testMessages, optimizeWindow]);

  return (
    <Stack>
      <Card>
        <Text size="sm" fw={500} mb="xs">Window Configuration</Text>
        <Group>
          <NumberInput
            label="Window Size"
            value={windowConfig.size}
            onChange={(value) => updateWindowConfig({ size: Number(value) })}
            min={1}
            max={100}
            style={{ width: 120 }}
          />
          <Select
            label="Strategy"
            data={[
              { value: 'fixed', label: 'Fixed' },
              { value: 'adaptive', label: 'Adaptive' },
              { value: 'semantic', label: 'Semantic' },
              { value: 'hybrid', label: 'Hybrid' }
            ]}
            value={windowConfig.strategy.type}
            onChange={(value) => updateWindowConfig({
              strategy: { ...windowConfig.strategy, type: value as any }
            })}
            style={{ width: 120 }}
          />
          <NumberInput
            label="Compression Ratio"
            value={windowConfig.strategy.compressionRatio}
            onChange={(value) => updateWindowConfig({
              strategy: { ...windowConfig.strategy, compressionRatio: Number(value) }
            })}
            min={0.1}
            max={1}
            step={0.1}
            style={{ width: 150 }}
          />
        </Group>
      </Card>

      <Card>
        <Text size="sm" fw={500} mb="xs">Pruning Algorithm</Text>
        <Group>
          <NumberInput
            label="Importance Threshold"
            value={windowConfig.strategy.pruningAlgorithm.importanceThreshold}
            onChange={(value) => updateWindowConfig({
              strategy: {
                ...windowConfig.strategy,
                pruningAlgorithm: {
                  ...windowConfig.strategy.pruningAlgorithm,
                  importanceThreshold: Number(value)
                }
              }
            })}
            min={0}
            max={1}
            step={0.1}
            style={{ width: 150 }}
          />
          <Switch
            label="Preserve System Messages"
            checked={windowConfig.strategy.retentionCriteria.preserveSystemMessages}
            onChange={(event) => updateWindowConfig({
              strategy: {
                ...windowConfig.strategy,
                retentionCriteria: {
                  ...windowConfig.strategy.retentionCriteria,
                  preserveSystemMessages: event.currentTarget.checked
                }
              }
            })}
          />
          <Switch
            label="Preserve User Questions"
            checked={windowConfig.strategy.retentionCriteria.preserveUserQuestions}
            onChange={(event) => updateWindowConfig({
              strategy: {
                ...windowConfig.strategy,
                retentionCriteria: {
                  ...windowConfig.strategy.retentionCriteria,
                  preserveUserQuestions: event.currentTarget.checked
                }
              }
            })}
          />
        </Group>
      </Card>

      <Card>
        <Text size="sm" fw={500} mb="xs">Window Metadata</Text>
        <Group>
          <Text size="xs">Total Messages: {windowConfig.metadata.totalMessages}</Text>
          <Text size="xs">Compression Ratio: {(windowConfig.metadata.compressionRatio * 100).toFixed(1)}%</Text>
          <Text size="xs">Avg Relevance: {windowConfig.metadata.avgRelevanceScore.toFixed(2)}</Text>
          <Text size="xs">Last Optimization: {new Date(windowConfig.metadata.lastOptimization).toLocaleTimeString()}</Text>
        </Group>
      </Card>

      <Group>
        <Button onClick={handleOptimize} leftSection={<IconOptimize size={16} />}>
          Optimize Window
        </Button>
      </Group>

      <Group align="stretch" style={{ minHeight: 300 }}>
        <Card style={{ flex: 1 }}>
          <Text size="sm" fw={500} mb="xs">Original Messages ({testMessages.length})</Text>
          <ScrollArea h={250}>
            <Stack gap="xs">
              {testMessages.map((msg) => {
                const relevanceScore = calculateRelevanceScore(msg, testMessages);
                return (
                  <Card key={msg.id} p="xs" withBorder>
                    <Group>
                      <Badge size="xs" color={
                        msg.role === 'user' ? 'blue' : 
                        msg.role === 'assistant' ? 'green' : 'orange'
                      }>
                        {msg.role}
                      </Badge>
                      <Badge size="xs" variant="outline">
                        {(relevanceScore * 100).toFixed(0)}%
                      </Badge>
                    </Group>
                    <Text size="xs" mt="xs">{msg.content}</Text>
                  </Card>
                );
              })}
            </Stack>
          </ScrollArea>
        </Card>

        <Card style={{ flex: 1 }}>
          <Text size="sm" fw={500} mb="xs">Optimized Messages ({optimizedMessages.length})</Text>
          <ScrollArea h={250}>
            <Stack gap="xs">
              {optimizedMessages.map((msg) => (
                <Card key={msg.id} p="xs" withBorder>
                  <Group>
                    <Badge size="xs" color={
                      msg.role === 'user' ? 'blue' : 
                      msg.role === 'assistant' ? 'green' : 'orange'
                    }>
                      {msg.role}
                    </Badge>
                    <Badge size="xs" variant="outline">
                      {((msg.relevanceScore || 0) * 100).toFixed(0)}%
                    </Badge>
                  </Group>
                  <Text size="xs" mt="xs">{msg.content}</Text>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
        </Card>
      </Group>
    </Stack>
  );
};

// ===== MEMORY MANAGER COMPONENT =====

const MemoryManagerComponent: React.FC = () => {
  const { memoryStore, addMemory, searchMemories, consolidateMemories, getMemoryStats } = useMemoryManager();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemoryType, setSelectedMemoryType] = useState<MemoryType | ''>('');
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryType, setNewMemoryType] = useState<MemoryType>('factual');
  const [newMemoryCategory, setNewMemoryCategory] = useState('');

  const stats = getMemoryStats();
  const searchResults = searchQuery ? searchMemories(searchQuery, selectedMemoryType || undefined) : [];

  const handleAddMemory = useCallback(() => {
    if (!newMemoryContent.trim()) return;

    addMemory({
      type: newMemoryType,
      content: newMemoryContent,
      relevanceScore: 0.7,
      category: newMemoryCategory || 'general',
      tags: newMemoryContent.split(' ').slice(0, 3)
    });

    setNewMemoryContent('');
    setNewMemoryCategory('');
  }, [newMemoryContent, newMemoryType, newMemoryCategory, addMemory]);

  return (
    <Stack>
      <Card>
        <Text size="sm" fw={500} mb="xs">Memory Statistics</Text>
        <Group>
          <div>
            <Text size="xs" fw={500}>Short-term Memory</Text>
            <Progress value={stats.shortTerm.utilizationRate * 100} size="sm" />
            <Text size="xs" c="dimmed">{stats.shortTerm.count}/{stats.shortTerm.capacity}</Text>
          </div>
          <div>
            <Text size="xs" fw={500}>Long-term Memory</Text>
            <Text size="xs">Facts: {stats.longTerm.facts}</Text>
            <Text size="xs">Summaries: {stats.longTerm.summaries}</Text>
            <Text size="xs">Relationships: {stats.longTerm.relationships}</Text>
          </div>
          <div>
            <Text size="xs" fw={500}>Total Memories</Text>
            <Text size="lg" fw={700}>{stats.total}</Text>
          </div>
        </Group>
      </Card>

      <Group>
        <TextInput
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Memory type"
          data={[
            { value: '', label: 'All Types' },
            { value: 'episodic', label: 'Episodic' },
            { value: 'semantic', label: 'Semantic' },
            { value: 'procedural', label: 'Procedural' },
            { value: 'factual', label: 'Factual' }
          ]}
          value={selectedMemoryType}
          onChange={(value) => setSelectedMemoryType(value as MemoryType | '')}
          leftSection={<IconFilter size={16} />}
          style={{ width: 150 }}
        />
        <Button onClick={consolidateMemories} leftSection={<IconDatabase size={16} />}>
          Consolidate
        </Button>
      </Group>

      <Group align="stretch" style={{ minHeight: 300 }}>
        <Card style={{ flex: 1 }}>
          <Text size="sm" fw={500} mb="xs">Current Memories</Text>
          <ScrollArea h={250}>
            <Stack gap="xs">
              {(searchQuery ? searchResults : memoryStore.shortTerm.current).map((memory) => (
                <Card key={memory.id} p="xs" withBorder>
                  <Group>
                    <Badge size="xs" color={
                      memory.type === 'episodic' ? 'blue' :
                      memory.type === 'semantic' ? 'green' :
                      memory.type === 'procedural' ? 'orange' : 'purple'
                    }>
                      {memory.type}
                    </Badge>
                    <Badge size="xs" variant="outline">
                      {(memory.relevanceScore * 100).toFixed(0)}%
                    </Badge>
                    <Text size="xs" c="dimmed">
                      Accessed: {memory.accessCount}x
                    </Text>
                  </Group>
                  <Text size="xs" mt="xs">{memory.content}</Text>
                  <Text size="xs" c="dimmed">
                    Category: {memory.category} • Tags: {memory.tags.join(', ')}
                  </Text>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
        </Card>

        <Card style={{ flex: 1 }}>
          <Text size="sm" fw={500} mb="xs">Add Memory</Text>
          <Stack>
            <Select
              label="Memory Type"
              data={[
                { value: 'episodic', label: 'Episodic' },
                { value: 'semantic', label: 'Semantic' },
                { value: 'procedural', label: 'Procedural' },
                { value: 'factual', label: 'Factual' }
              ]}
              value={newMemoryType}
              onChange={(value) => setNewMemoryType(value as MemoryType)}
            />
            <TextInput
              label="Category"
              placeholder="e.g., user_preferences, technical, personal"
              value={newMemoryCategory}
              onChange={(e) => setNewMemoryCategory(e.target.value)}
            />
            <Textarea
              label="Content"
              placeholder="Enter memory content..."
              value={newMemoryContent}
              onChange={(e) => setNewMemoryContent(e.target.value)}
              rows={4}
            />
            <Button onClick={handleAddMemory} leftSection={<IconMemory size={16} />}>
              Add Memory
            </Button>
          </Stack>

          <Divider my="md" />

          <div>
            <Text size="sm" fw={500} mb="xs">Long-term Storage</Text>
            <Stack gap="xs">
              {memoryStore.longTerm.facts.slice(0, 3).map((fact) => (
                <Card key={fact.id} p="xs" withBorder>
                  <Text size="xs" fw={500}>Fact</Text>
                  <Text size="xs">{fact.content}</Text>
                  <Text size="xs" c="dimmed">
                    Confidence: {(fact.confidence * 100).toFixed(0)}% • {fact.category}
                  </Text>
                </Card>
              ))}
            </Stack>
          </div>
        </Card>
      </Group>
    </Stack>
  );
};

// ===== MAIN COMPONENT =====

export const AIStateManagementExercise: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <Stack>
        <div>
          <h1>AI State Management</h1>
          <p>Advanced conversation state and context persistence with intelligent memory management</p>
        </div>

        <Tabs defaultValue="conversations">
          <Tabs.List>
            <Tabs.Tab value="conversations" leftSection={<IconMessage size={16} />}>Conversations</Tabs.Tab>
            <Tabs.Tab value="context" leftSection={<IconOptimize size={16} />}>Context Window</Tabs.Tab>
            <Tabs.Tab value="memory" leftSection={<IconBrain size={16} />}>Memory</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="conversations" pt="md">
            <ConversationStateManager />
          </Tabs.Panel>

          <Tabs.Panel value="context" pt="md">
            <ContextWindowManagerComponent />
          </Tabs.Panel>

          <Tabs.Panel value="memory" pt="md">
            <MemoryManagerComponent />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </div>
  );
};

export default AIStateManagementExercise;