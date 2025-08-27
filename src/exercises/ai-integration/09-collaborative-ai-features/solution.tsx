import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Card, Text, Group, Stack, Badge, Progress, Alert, Tabs, TextInput, Select, Textarea, NumberInput, Code, ScrollArea, Divider, ActionIcon, Modal, Slider, Switch, Paper, Container, Grid, RingProgress, Table, Tooltip, Avatar, Timeline } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUsers, IconMessage, IconRobot, IconGitMerge, IconEye, IconEdit, IconShare, IconLock, IconCrown, IconUser, IconRefresh, IconSend, IconHistory, IconSettings, IconActivity, IconBell } from '@tabler/icons-react';

// ===== COLLABORATIVE AI TYPES =====

interface SharedAISession {
  id: string;
  name: string;
  participants: SessionParticipant[];
  context: SharedContext;
  status: SessionStatus;
  createdAt: number;
  updatedAt: number;
  settings: SessionSettings;
  permissions: SessionPermissions;
}

interface SessionParticipant {
  userId: string;
  username: string;
  avatar: string;
  role: ParticipantRole;
  permissions: Permission[];
  status: ParticipantStatus;
  joinedAt: number;
  lastActive: number;
  contributions: ParticipantContribution[];
  cursor?: CursorPosition;
}

interface SharedContext {
  messages: CollaborativeMessage[];
  prompts: SharedPrompt[];
  results: SharedResult[];
  metadata: ContextMetadata;
  version: number;
  conflicts: ContextConflict[];
  history: ContextHistory[];
}

interface CollaborativeMessage {
  id: string;
  content: string;
  authorId: string;
  timestamp: number;
  type: MessageType;
  metadata: MessageMetadata;
  operations: EditOperation[];
  conflicts: MessageConflict[];
}

interface SharedPrompt {
  id: string;
  content: string;
  contributors: string[];
  status: PromptStatus;
  version: number;
  createdAt: number;
  updatedAt: number;
  executions: PromptExecution[];
  conflicts: PromptConflict[];
}

interface SharedResult {
  id: string;
  promptId: string;
  content: string;
  authorId: string;
  timestamp: number;
  quality: number;
  votes: ResultVote[];
  annotations: ResultAnnotation[];
}

interface CollaborativeEditor {
  content: string;
  participants: EditingParticipant[];
  operations: EditOperation[];
  conflicts: EditConflict[];
  cursors: CursorPosition[];
  selections: SelectionRange[];
}

interface EditingParticipant {
  userId: string;
  username: string;
  cursor: CursorPosition;
  selection?: SelectionRange;
  isTyping: boolean;
  lastEdit: number;
}

interface EditOperation {
  id: string;
  type: OperationType;
  position: number;
  content: string;
  length?: number;
  authorId: string;
  timestamp: number;
  applied: boolean;
}

interface ConflictResolution {
  conflictId: string;
  strategy: ResolutionStrategy;
  result: string;
  participants: string[];
  votes: ConflictVote[];
  resolvedAt: number;
  resolvedBy: string;
}

interface AIAssistantConfig {
  personality: AssistantPersonality;
  collaborationMode: CollaborationMode;
  contextAwareness: ContextAwareness;
  responseStyle: ResponseStyle;
  capabilities: AssistantCapability[];
}

interface AssistantPersonality {
  name: string;
  description: string;
  traits: string[];
  collaborationStyle: CollaborationStyle;
  adaptability: AdaptabilityLevel;
}

interface CollaborativeInteraction {
  id: string;
  type: InteractionType;
  participants: string[];
  context: InteractionContext;
  timestamp: number;
  duration: number;
  outcome: InteractionOutcome;
}

// Enums and utility types
type SessionStatus = 'active' | 'paused' | 'archived' | 'conflicted';
type ParticipantRole = 'owner' | 'collaborator' | 'viewer' | 'assistant';
type ParticipantStatus = 'active' | 'idle' | 'away' | 'offline';
type Permission = 'read' | 'write' | 'execute' | 'admin' | 'moderate';
type MessageType = 'user' | 'assistant' | 'system' | 'collaborative';
type PromptStatus = 'draft' | 'ready' | 'executing' | 'completed' | 'conflicted';
type OperationType = 'insert' | 'delete' | 'replace' | 'format';
type ResolutionStrategy = 'merge' | 'vote' | 'priority' | 'manual';
type CollaborationMode = 'concurrent' | 'sequential' | 'moderated';
type CollaborationStyle = 'facilitating' | 'participating' | 'observing';
type AdaptabilityLevel = 'low' | 'medium' | 'high';
type InteractionType = 'prompt' | 'edit' | 'vote' | 'resolve';

interface CursorPosition {
  line: number;
  column: number;
  userId: string;
}

interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
  userId: string;
}

interface ContextMetadata {
  totalMessages: number;
  totalPrompts: number;
  activeParticipants: number;
  lastActivity: number;
  collaborationScore: number;
}

interface SessionSettings {
  maxParticipants: number;
  autoSave: boolean;
  conflictResolution: ResolutionStrategy;
  aiAssistantEnabled: boolean;
  moderationEnabled: boolean;
  historyRetention: number;
}

interface SessionPermissions {
  public: boolean;
  inviteOnly: boolean;
  requireApproval: boolean;
  allowAnonymous: boolean;
  defaultRole: ParticipantRole;
}

// ===== SHARED AI SESSION HOOK =====

const useSharedAISession = (sessionId?: string) => {
  const [sessions, setSessions] = useState<SharedAISession[]>([]);
  const [currentSession, setCurrentSession] = useState<SharedAISession | null>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [synchronizationState, setSynchronizationState] = useState({
    lastSync: 0,
    pendingOperations: 0,
    conflictsResolved: 0,
    syncEfficiency: 100
  });

  const wsRef = useRef<WebSocket | null>(null);

  const createSession = useCallback(async (name: string, settings: Partial<SessionSettings> = {}) => {
    const newSession: SharedAISession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name,
      participants: [{
        userId: 'current_user',
        username: 'You',
        avatar: '/default-avatar.png',
        role: 'owner',
        permissions: ['read', 'write', 'execute', 'admin'],
        status: 'active',
        joinedAt: Date.now(),
        lastActive: Date.now(),
        contributions: []
      }],
      context: {
        messages: [],
        prompts: [],
        results: [],
        metadata: {
          totalMessages: 0,
          totalPrompts: 0,
          activeParticipants: 1,
          lastActivity: Date.now(),
          collaborationScore: 100
        },
        version: 1,
        conflicts: [],
        history: []
      },
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: {
        maxParticipants: 10,
        autoSave: true,
        conflictResolution: 'merge',
        aiAssistantEnabled: true,
        moderationEnabled: false,
        historyRetention: 30,
        ...settings
      },
      permissions: {
        public: false,
        inviteOnly: true,
        requireApproval: false,
        allowAnonymous: false,
        defaultRole: 'collaborator'
      }
    };

    setSessions(prev => [...prev, newSession]);
    setCurrentSession(newSession);
    
    // Simulate WebSocket connection
    setTimeout(() => {
      setConnectionStatus('connected');
      setSynchronizationState(prev => ({ ...prev, lastSync: Date.now() }));
    }, 1000);

    notifications.show({
      title: 'Session Created',
      message: `Collaborative AI session "${name}" created successfully`,
      color: 'green'
    });

    return newSession;
  }, []);

  const joinSession = useCallback(async (sessionId: string, userId: string, username: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.participants.length >= session.settings.maxParticipants) {
      throw new Error('Session is full');
    }

    const newParticipant: SessionParticipant = {
      userId,
      username,
      avatar: '/default-avatar.png',
      role: session.permissions.defaultRole,
      permissions: session.permissions.defaultRole === 'owner' ? ['read', 'write', 'execute', 'admin'] : ['read', 'write'],
      status: 'active',
      joinedAt: Date.now(),
      lastActive: Date.now(),
      contributions: []
    };

    const updatedSession = {
      ...session,
      participants: [...session.participants, newParticipant],
      context: {
        ...session.context,
        metadata: {
          ...session.context.metadata,
          activeParticipants: session.participants.length + 1
        }
      },
      updatedAt: Date.now()
    };

    setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
    setCurrentSession(updatedSession);
    setParticipants(updatedSession.participants);

    notifications.show({
      title: 'Joined Session',
      message: `${username} joined the collaborative session`,
      color: 'blue'
    });

    return updatedSession;
  }, [sessions]);

  const leaveSession = useCallback(async (userId: string) => {
    if (!currentSession) return;

    const updatedParticipants = currentSession.participants.filter(p => p.userId !== userId);
    const updatedSession = {
      ...currentSession,
      participants: updatedParticipants,
      context: {
        ...currentSession.context,
        metadata: {
          ...currentSession.context.metadata,
          activeParticipants: updatedParticipants.length
        }
      },
      updatedAt: Date.now()
    };

    setSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));
    setCurrentSession(updatedSession);
    setParticipants(updatedParticipants);
  }, [currentSession]);

  const syncSessionState = useCallback(async () => {
    if (!currentSession) return;

    // Simulate synchronization with server
    setSynchronizationState(prev => ({
      ...prev,
      lastSync: Date.now(),
      syncEfficiency: Math.max(90, prev.syncEfficiency + Math.random() * 10 - 5)
    }));

    // Simulate resolving pending operations
    setTimeout(() => {
      setSynchronizationState(prev => ({
        ...prev,
        pendingOperations: Math.max(0, prev.pendingOperations - 1),
        conflictsResolved: prev.conflictsResolved + (Math.random() > 0.8 ? 1 : 0)
      }));
    }, 500);
  }, [currentSession]);

  const updateParticipantStatus = useCallback((userId: string, status: ParticipantStatus) => {
    if (!currentSession) return;

    const updatedParticipants = currentSession.participants.map(p =>
      p.userId === userId ? { ...p, status, lastActive: Date.now() } : p
    );

    setParticipants(updatedParticipants);
  }, [currentSession]);

  // Auto-sync every 5 seconds
  useEffect(() => {
    const interval = setInterval(syncSessionState, 5000);
    return () => clearInterval(interval);
  }, [syncSessionState]);

  return {
    sessions,
    currentSession,
    participants,
    connectionStatus,
    synchronizationState,
    createSession,
    joinSession,
    leaveSession,
    syncSessionState,
    updateParticipantStatus,
    setCurrentSession
  };
};

// ===== COLLABORATIVE PROMPTING HOOK =====

const useCollaborativePrompting = (session: SharedAISession | null) => {
  const [collaborativeEditor, setCollaborativeEditor] = useState<CollaborativeEditor>({
    content: '',
    participants: [],
    operations: [],
    conflicts: [],
    cursors: [],
    selections: []
  });
  const [sharedPrompts, setSharedPrompts] = useState<SharedPrompt[]>([]);
  const [editingState, setEditingState] = useState({
    isEditing: false,
    lastEdit: 0,
    collaborators: 0,
    conflictCount: 0
  });

  const addCollaborativeEdit = useCallback((operation: Omit<EditOperation, 'id' | 'timestamp' | 'applied'>) => {
    const editOperation: EditOperation = {
      ...operation,
      id: `edit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      applied: false
    };

    setCollaborativeEditor(prev => ({
      ...prev,
      operations: [...prev.operations, editOperation]
    }));

    // Apply operation to content
    setTimeout(() => {
      setCollaborativeEditor(prev => {
        let newContent = prev.content;
        
        switch (operation.type) {
          case 'insert':
            newContent = newContent.slice(0, operation.position) + operation.content + newContent.slice(operation.position);
            break;
          case 'delete':
            newContent = newContent.slice(0, operation.position) + newContent.slice(operation.position + (operation.length || 1));
            break;
          case 'replace':
            newContent = newContent.slice(0, operation.position) + operation.content + newContent.slice(operation.position + (operation.length || 0));
            break;
        }

        return {
          ...prev,
          content: newContent,
          operations: prev.operations.map(op => 
            op.id === editOperation.id ? { ...op, applied: true } : op
          )
        };
      });

      setEditingState(prev => ({
        ...prev,
        lastEdit: Date.now(),
        conflictCount: Math.random() > 0.9 ? prev.conflictCount + 1 : prev.conflictCount
      }));
    }, 100 + Math.random() * 200);
  }, []);

  const createSharedPrompt = useCallback(async (content: string, contributors: string[] = []) => {
    if (!session) return null;

    const prompt: SharedPrompt = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      content,
      contributors,
      status: 'draft',
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      executions: [],
      conflicts: []
    };

    setSharedPrompts(prev => [...prev, prompt]);

    notifications.show({
      title: 'Shared Prompt Created',
      message: 'Collaborative prompt created and shared with team',
      color: 'green'
    });

    return prompt;
  }, [session]);

  const executeSharedPrompt = useCallback(async (promptId: string) => {
    const prompt = sharedPrompts.find(p => p.id === promptId);
    if (!prompt || !session) return null;

    // Update prompt status
    setSharedPrompts(prev => prev.map(p =>
      p.id === promptId ? { ...p, status: 'executing' } : p
    ));

    // Simulate AI execution
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    const result: SharedResult = {
      id: `result_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      promptId,
      content: `AI Response to: "${prompt.content.substring(0, 50)}..." - This is a collaborative AI response generated for the shared session.`,
      authorId: 'ai_assistant',
      timestamp: Date.now(),
      quality: 80 + Math.random() * 20,
      votes: [],
      annotations: []
    };

    // Update prompt status and add result
    setSharedPrompts(prev => prev.map(p =>
      p.id === promptId ? {
        ...p,
        status: 'completed',
        executions: [...p.executions, {
          id: result.id,
          timestamp: Date.now(),
          duration: 2000,
          success: true,
          result: result.content
        }]
      } : p
    ));

    notifications.show({
      title: 'Prompt Executed',
      message: 'Collaborative prompt executed successfully',
      color: 'green'
    });

    return result;
  }, [sharedPrompts, session]);

  const updateCursorPosition = useCallback((userId: string, position: CursorPosition) => {
    setCollaborativeEditor(prev => ({
      ...prev,
      cursors: prev.cursors.filter(c => c.userId !== userId).concat({ ...position, userId })
    }));
  }, []);

  const resolveConflict = useCallback(async (conflictId: string, strategy: ResolutionStrategy) => {
    const conflict = collaborativeEditor.conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    // Simulate conflict resolution
    await new Promise(resolve => setTimeout(resolve, 1000));

    setCollaborativeEditor(prev => ({
      ...prev,
      conflicts: prev.conflicts.filter(c => c.id !== conflictId)
    }));

    setEditingState(prev => ({
      ...prev,
      conflictCount: Math.max(0, prev.conflictCount - 1)
    }));

    notifications.show({
      title: 'Conflict Resolved',
      message: `Conflict resolved using ${strategy} strategy`,
      color: 'green'
    });
  }, [collaborativeEditor.conflicts]);

  const mergeCollaborativeEdits = useCallback(() => {
    // Simulate intelligent merge operation
    const pendingOps = collaborativeEditor.operations.filter(op => !op.applied);
    
    pendingOps.forEach(op => {
      setTimeout(() => {
        setCollaborativeEditor(prev => ({
          ...prev,
          operations: prev.operations.map(o =>
            o.id === op.id ? { ...o, applied: true } : o
          )
        }));
      }, Math.random() * 500);
    });
  }, [collaborativeEditor.operations]);

  // Auto-merge edits every 2 seconds
  useEffect(() => {
    const interval = setInterval(mergeCollaborativeEdits, 2000);
    return () => clearInterval(interval);
  }, [mergeCollaborativeEdits]);

  return {
    collaborativeEditor,
    sharedPrompts,
    editingState,
    addCollaborativeEdit,
    createSharedPrompt,
    executeSharedPrompt,
    updateCursorPosition,
    resolveConflict,
    setCollaborativeEditor
  };
};

// ===== AI ASSISTANT HOOK =====

const useAIAssistant = (session: SharedAISession | null) => {
  const [assistantConfig, setAssistantConfig] = useState<AIAssistantConfig>({
    personality: {
      name: 'Collaborative AI Assistant',
      description: 'A helpful AI assistant optimized for team collaboration and shared AI experiences',
      traits: ['collaborative', 'contextual', 'adaptive', 'supportive'],
      collaborationStyle: 'facilitating',
      adaptability: 'high'
    },
    collaborationMode: 'concurrent',
    contextAwareness: {
      enabled: true,
      depth: 'full',
      participantAwareness: true,
      historyIntegration: true
    },
    responseStyle: {
      tone: 'professional',
      length: 'adaptive',
      personalization: true,
      multiUserAddressing: true
    },
    capabilities: ['prompting', 'analysis', 'facilitation', 'conflict-resolution']
  });

  const [interactions, setInteractions] = useState<CollaborativeInteraction[]>([]);
  const [assistantState, setAssistantState] = useState({
    isActive: true,
    currentContext: '',
    participantPreferences: new Map<string, any>(),
    collaborationInsights: []
  });

  const processCollaborativePrompt = useCallback(async (prompt: string, participants: string[]) => {
    const interaction: CollaborativeInteraction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: 'prompt',
      participants,
      context: {
        prompt,
        sessionId: session?.id || '',
        participantCount: participants.length,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      duration: 0,
      outcome: { success: false, result: '', participants: [] }
    };

    setInteractions(prev => [...prev, interaction]);

    // Simulate AI processing with collaboration awareness
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    const response = `As your collaborative AI assistant, I've processed this request considering input from ${participants.length} team members. Here's a comprehensive response that addresses the collective context and individual perspectives shared in your collaborative session.`;

    const updatedInteraction = {
      ...interaction,
      duration: Date.now() - interaction.timestamp,
      outcome: {
        success: true,
        result: response,
        participants: participants
      }
    };

    setInteractions(prev => prev.map(i => i.id === interaction.id ? updatedInteraction : i));

    notifications.show({
      title: 'Collaborative Response Generated',
      message: 'AI assistant generated response considering all team perspectives',
      color: 'blue'
    });

    return response;
  }, [session]);

  const facilitateCollaboration = useCallback(async (conflictType: string, participants: string[]) => {
    const facilitation = {
      type: conflictType,
      participants,
      suggestions: [
        'Consider merging different perspectives for a comprehensive approach',
        'Each participant brings valuable insights to this discussion',
        'Let\'s explore how these different viewpoints can complement each other',
        'I can help synthesize these ideas into a cohesive solution'
      ],
      mediationStrategies: ['consensus-building', 'perspective-integration', 'structured-discussion']
    };

    notifications.show({
      title: 'Collaboration Facilitation',
      message: `AI assistant is helping facilitate resolution for ${conflictType}`,
      color: 'yellow'
    });

    return facilitation;
  }, []);

  const adaptToCollaborationContext = useCallback((context: any) => {
    setAssistantState(prev => ({
      ...prev,
      currentContext: JSON.stringify(context),
      collaborationInsights: [
        ...prev.collaborationInsights,
        {
          timestamp: Date.now(),
          insight: 'Collaboration pattern detected: active multi-user engagement',
          confidence: 0.85
        }
      ].slice(-10) // Keep last 10 insights
    }));

    // Adapt personality based on collaboration context
    if (context.conflictLevel > 0.5) {
      setAssistantConfig(prev => ({
        ...prev,
        personality: {
          ...prev.personality,
          collaborationStyle: 'facilitating'
        }
      }));
    }
  }, []);

  const generateCollaborativeInsights = useCallback(() => {
    if (!session) return [];

    return [
      {
        type: 'participation',
        insight: `${session.participants.length} active collaborators contributing to the session`,
        confidence: 0.9
      },
      {
        type: 'engagement',
        insight: 'High collaboration activity detected with frequent prompt exchanges',
        confidence: 0.8
      },
      {
        type: 'efficiency',
        insight: 'Team collaboration showing strong synergy and productive outcomes',
        confidence: 0.75
      }
    ];
  }, [session]);

  return {
    assistantConfig,
    interactions,
    assistantState,
    processCollaborativePrompt,
    facilitateCollaboration,
    adaptToCollaborationContext,
    generateCollaborativeInsights,
    setAssistantConfig
  };
};

// ===== CONFLICT RESOLVER HOOK =====

const useConflictResolver = () => {
  const [activeConflicts, setActiveConflicts] = useState<ContextConflict[]>([]);
  const [resolutionHistory, setResolutionHistory] = useState<ConflictResolution[]>([]);
  const [conflictMetrics, setConflictMetrics] = useState({
    totalConflicts: 0,
    resolvedConflicts: 0,
    averageResolutionTime: 0,
    resolutionSuccess: 100,
    conflictTypes: new Map<string, number>()
  });

  const detectConflict = useCallback((operation1: EditOperation, operation2: EditOperation): boolean => {
    // Simple conflict detection logic
    if (operation1.authorId === operation2.authorId) return false;
    
    const op1End = operation1.position + (operation1.content?.length || operation1.length || 0);
    const op2End = operation2.position + (operation2.content?.length || operation2.length || 0);

    return !(op1End <= operation2.position || op2End <= operation1.position);
  }, []);

  const createConflict = useCallback((operations: EditOperation[], type: string = 'edit') => {
    const conflict: ContextConflict = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type,
      operations,
      participants: [...new Set(operations.map(op => op.authorId))],
      severity: operations.length > 2 ? 'high' : 'medium',
      createdAt: Date.now(),
      status: 'pending',
      resolutionOptions: [
        { strategy: 'merge', description: 'Automatically merge non-conflicting parts' },
        { strategy: 'vote', description: 'Let participants vote on preferred version' },
        { strategy: 'priority', description: 'Use author priority or timestamps' },
        { strategy: 'manual', description: 'Manual resolution by moderator' }
      ]
    };

    setActiveConflicts(prev => [...prev, conflict]);
    setConflictMetrics(prev => ({
      ...prev,
      totalConflicts: prev.totalConflicts + 1,
      conflictTypes: new Map(prev.conflictTypes.set(type, (prev.conflictTypes.get(type) || 0) + 1))
    }));

    notifications.show({
      title: 'Conflict Detected',
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} conflict detected between ${conflict.participants.length} participants`,
      color: 'orange'
    });

    return conflict;
  }, []);

  const resolveConflict = useCallback(async (conflictId: string, strategy: ResolutionStrategy, userInput?: any) => {
    const conflict = activeConflicts.find(c => c.id === conflictId);
    if (!conflict) return null;

    const startTime = Date.now();

    // Simulate resolution process
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    let resolvedContent = '';
    let success = true;

    switch (strategy) {
      case 'merge':
        resolvedContent = mergeOperations(conflict.operations);
        break;
      case 'vote':
        resolvedContent = resolveByVoting(conflict.operations, userInput?.votes || []);
        break;
      case 'priority':
        resolvedContent = resolveByPriority(conflict.operations);
        break;
      case 'manual':
        resolvedContent = userInput?.resolution || '';
        break;
      default:
        success = false;
    }

    const resolution: ConflictResolution = {
      conflictId,
      strategy,
      result: resolvedContent,
      participants: conflict.participants,
      votes: userInput?.votes || [],
      resolvedAt: Date.now(),
      resolvedBy: userInput?.resolvedBy || 'system'
    };

    setResolutionHistory(prev => [...prev, resolution]);
    setActiveConflicts(prev => prev.filter(c => c.id !== conflictId));
    
    const resolutionTime = Date.now() - startTime;
    setConflictMetrics(prev => ({
      ...prev,
      resolvedConflicts: prev.resolvedConflicts + 1,
      averageResolutionTime: (prev.averageResolutionTime * prev.resolvedConflicts + resolutionTime) / (prev.resolvedConflicts + 1),
      resolutionSuccess: success ? prev.resolutionSuccess : Math.max(0, prev.resolutionSuccess - 5)
    }));

    notifications.show({
      title: success ? 'Conflict Resolved' : 'Resolution Failed',
      message: success ? `Conflict resolved using ${strategy} strategy` : 'Failed to resolve conflict automatically',
      color: success ? 'green' : 'red'
    });

    return resolution;
  }, [activeConflicts]);

  const mergeOperations = (operations: EditOperation[]): string => {
    // Simple merge strategy - concatenate non-overlapping operations
    const sortedOps = [...operations].sort((a, b) => a.position - b.position);
    return sortedOps.map(op => op.content).join(' ');
  };

  const resolveByVoting = (operations: EditOperation[], votes: ConflictVote[]): string => {
    // Find operation with most votes
    const voteCounts = new Map<string, number>();
    votes.forEach(vote => {
      voteCounts.set(vote.operationId, (voteCounts.get(vote.operationId) || 0) + 1);
    });

    let maxVotes = 0;
    let winningOperation = operations[0];
    
    operations.forEach(op => {
      const voteCount = voteCounts.get(op.id) || 0;
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        winningOperation = op;
      }
    });

    return winningOperation.content;
  };

  const resolveByPriority = (operations: EditOperation[]): string => {
    // Use timestamp priority - earlier operations win
    const sortedOps = [...operations].sort((a, b) => a.timestamp - b.timestamp);
    return sortedOps[0].content;
  };

  const getConflictAnalytics = useCallback(() => {
    const resolutionStrategies = resolutionHistory.reduce((acc, resolution) => {
      acc[resolution.strategy] = (acc[resolution.strategy] || 0) + 1;
      return acc;
    }, {} as Record<ResolutionStrategy, number>);

    return {
      ...conflictMetrics,
      resolutionStrategies,
      recentConflicts: activeConflicts.slice(-5),
      recentResolutions: resolutionHistory.slice(-10)
    };
  }, [conflictMetrics, activeConflicts, resolutionHistory]);

  return {
    activeConflicts,
    resolutionHistory,
    conflictMetrics,
    detectConflict,
    createConflict,
    resolveConflict,
    getConflictAnalytics
  };
};

// ===== COLLABORATIVE SESSION DASHBOARD COMPONENT =====

interface CollaborativeSessionDashboardProps {
  session: ReturnType<typeof useSharedAISession>;
  prompting: ReturnType<typeof useCollaborativePrompting>;
  assistant: ReturnType<typeof useAIAssistant>;
  conflictResolver: ReturnType<typeof useConflictResolver>;
}

const CollaborativeSessionDashboard: React.FC<CollaborativeSessionDashboardProps> = ({
  session,
  prompting,
  assistant,
  conflictResolver
}) => {
  const renderParticipants = () => (
    <Card>
      <Group justify="space-between" mb="md">
        <Text fw={500}>Active Participants ({session.participants.length})</Text>
        <Badge color={session.connectionStatus === 'connected' ? 'green' : 'red'}>
          {session.connectionStatus}
        </Badge>
      </Group>
      
      <Stack gap="sm">
        {session.participants.map(participant => (
          <Group key={participant.userId} justify="space-between">
            <Group>
              <Avatar size="sm" src={participant.avatar} />
              <div>
                <Text size="sm" fw={500}>{participant.username}</Text>
                <Text size="xs" c="dimmed">{participant.role}</Text>
              </div>
            </Group>
            <Group>
              <Badge 
                size="xs" 
                color={participant.status === 'active' ? 'green' : 'gray'}
              >
                {participant.status}
              </Badge>
              {participant.role === 'owner' && <IconCrown size={14} />}
            </Group>
          </Group>
        ))}
      </Stack>
    </Card>
  );

  const renderCollaborativeEditor = () => (
    <Card>
      <Group justify="space-between" mb="md">
        <Text fw={500}>Collaborative Editor</Text>
        <Group>
          <Badge color="blue">{prompting.editingState.collaborators} editing</Badge>
          {prompting.editingState.conflictCount > 0 && (
            <Badge color="orange">{prompting.editingState.conflictCount} conflicts</Badge>
          )}
        </Group>
      </Group>

      <Textarea
        value={prompting.collaborativeEditor.content}
        onChange={(e) => {
          const newContent = e.target.value;
          const operation: Omit<EditOperation, 'id' | 'timestamp' | 'applied'> = {
            type: 'replace',
            position: 0,
            content: newContent,
            length: prompting.collaborativeEditor.content.length,
            authorId: 'current_user'
          };
          prompting.addCollaborativeEdit(operation);
        }}
        placeholder="Start typing to collaborate on prompts..."
        minRows={4}
        mb="md"
      />

      {prompting.collaborativeEditor.cursors.length > 0 && (
        <Text size="xs" c="dimmed">
          Active cursors: {prompting.collaborativeEditor.cursors.map(c => c.userId).join(', ')}
        </Text>
      )}
    </Card>
  );

  const renderSharedPrompts = () => (
    <Card>
      <Group justify="space-between" mb="md">
        <Text fw={500}>Shared Prompts ({prompting.sharedPrompts.length})</Text>
        <Button
          size="sm"
          leftSection={<IconShare size={14} />}
          onClick={() => {
            if (prompting.collaborativeEditor.content.trim()) {
              prompting.createSharedPrompt(
                prompting.collaborativeEditor.content,
                session.participants.map(p => p.userId)
              );
            }
          }}
        >
          Share Prompt
        </Button>
      </Group>

      <ScrollArea h={300}>
        <Stack gap="sm">
          {prompting.sharedPrompts.map(prompt => (
            <Paper key={prompt.id} p="sm" withBorder>
              <Group justify="space-between" mb="xs">
                <Badge color={prompt.status === 'completed' ? 'green' : 'blue'}>
                  {prompt.status}
                </Badge>
                <Text size="xs" c="dimmed">
                  v{prompt.version} • {prompt.contributors.length} contributors
                </Text>
              </Group>
              
              <Text size="sm" mb="sm" lineClamp={2}>
                {prompt.content}
              </Text>

              {prompt.status === 'ready' && (
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconSend size={12} />}
                  onClick={() => prompting.executeSharedPrompt(prompt.id)}
                >
                  Execute
                </Button>
              )}
            </Paper>
          ))}
        </Stack>
      </ScrollArea>
    </Card>
  );

  const renderAIAssistant = () => (
    <Card>
      <Group justify="space-between" mb="md">
        <Text fw={500}>AI Assistant</Text>
        <Badge color={assistant.assistantState.isActive ? 'green' : 'gray'}>
          {assistant.assistantState.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </Group>

      <Stack gap="sm">
        <Paper p="sm" withBorder>
          <Text size="sm" fw={500} mb="xs">{assistant.assistantConfig.personality.name}</Text>
          <Text size="xs" c="dimmed" mb="sm">{assistant.assistantConfig.personality.description}</Text>
          
          <Group gap="xs">
            {assistant.assistantConfig.personality.traits.map(trait => (
              <Badge key={trait} size="xs" variant="light">{trait}</Badge>
            ))}
          </Group>
        </Paper>

        <Button
          leftSection={<IconRobot size={16} />}
          onClick={() => {
            if (prompting.collaborativeEditor.content.trim()) {
              assistant.processCollaborativePrompt(
                prompting.collaborativeEditor.content,
                session.participants.map(p => p.userId)
              );
            }
          }}
        >
          Get Collaborative Response
        </Button>

        {assistant.interactions.length > 0 && (
          <Paper p="sm" withBorder>
            <Text size="sm" fw={500} mb="xs">Recent Interactions</Text>
            <Text size="xs" c="dimmed">
              {assistant.interactions.length} interactions • Last: {new Date(assistant.interactions[assistant.interactions.length - 1]?.timestamp).toLocaleTimeString()}
            </Text>
          </Paper>
        )}
      </Stack>
    </Card>
  );

  const renderConflictResolution = () => (
    <Card>
      <Group justify="space-between" mb="md">
        <Text fw={500}>Conflict Resolution</Text>
        <Badge color={conflictResolver.activeConflicts.length > 0 ? 'orange' : 'green'}>
          {conflictResolver.activeConflicts.length} active
        </Badge>
      </Group>

      {conflictResolver.activeConflicts.length > 0 ? (
        <Stack gap="sm">
          {conflictResolver.activeConflicts.map(conflict => (
            <Paper key={conflict.id} p="sm" withBorder>
              <Group justify="space-between" mb="xs">
                <Badge color="orange">{conflict.type}</Badge>
                <Text size="xs" c="dimmed">
                  {conflict.participants.length} participants
                </Text>
              </Group>
              
              <Text size="sm" mb="sm">
                Conflict between operations from {conflict.participants.join(', ')}
              </Text>

              <Group>
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => conflictResolver.resolveConflict(conflict.id, 'merge')}
                >
                  Auto-merge
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="orange"
                  onClick={() => conflictResolver.resolveConflict(conflict.id, 'manual')}
                >
                  Manual
                </Button>
              </Group>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Text size="sm" c="dimmed" ta="center" py="md">
          No active conflicts
        </Text>
      )}

      <Divider my="md" />

      <Grid>
        <Grid.Col span={6}>
          <Text size="xs" c="dimmed">Total Resolved</Text>
          <Text fw={500}>{conflictResolver.conflictMetrics.resolvedConflicts}</Text>
        </Grid.Col>
        <Grid.Col span={6}>
          <Text size="xs" c="dimmed">Success Rate</Text>
          <Text fw={500}>{conflictResolver.conflictMetrics.resolutionSuccess.toFixed(1)}%</Text>
        </Grid.Col>
      </Grid>
    </Card>
  );

  return (
    <Stack>
      <Grid>
        <Grid.Col span={6}>
          {renderParticipants()}
        </Grid.Col>
        <Grid.Col span={6}>
          {renderAIAssistant()}
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={8}>
          {renderCollaborativeEditor()}
        </Grid.Col>
        <Grid.Col span={4}>
          {renderConflictResolution()}
        </Grid.Col>
      </Grid>

      {renderSharedPrompts()}
    </Stack>
  );
};

// ===== MAIN COMPONENT =====

export const CollaborativeAIFeaturesExercise: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>('session');
  
  const session = useSharedAISession();
  const prompting = useCollaborativePrompting(session.currentSession);
  const assistant = useAIAssistant(session.currentSession);
  const conflictResolver = useConflictResolver();

  const [demoSessionName, setDemoSessionName] = useState('My Collaborative AI Session');
  const [demoUsername, setDemoUsername] = useState('User ' + Math.floor(Math.random() * 1000));

  const handleCreateSession = async () => {
    try {
      await session.createSession(demoSessionName, {
        maxParticipants: 5,
        aiAssistantEnabled: true,
        conflictResolution: 'merge'
      });
    } catch (error) {
      notifications.show({
        title: 'Session Creation Failed',
        message: 'Failed to create collaborative session',
        color: 'red'
      });
    }
  };

  const handleJoinSession = async () => {
    if (session.currentSession) {
      try {
        await session.joinSession(
          session.currentSession.id, 
          `user_${Date.now()}`, 
          demoUsername
        );
      } catch (error: any) {
        notifications.show({
          title: 'Join Failed',
          message: error.message,
          color: 'red'
        });
      }
    }
  };

  const handleCreateConflict = () => {
    const operations: EditOperation[] = [
      {
        id: 'op1',
        type: 'insert',
        position: 10,
        content: 'Version A content',
        authorId: 'user1',
        timestamp: Date.now() - 1000,
        applied: false
      },
      {
        id: 'op2',
        type: 'insert',
        position: 12,
        content: 'Version B content',
        authorId: 'user2',
        timestamp: Date.now(),
        applied: false
      }
    ];

    conflictResolver.createConflict(operations, 'edit');
  };

  return (
    <Container size="xl" p="md">
      <Stack>
        <div>
          <h1>Collaborative AI Features</h1>
          <p>Multi-user AI collaboration and shared AI experiences with real-time synchronization</p>
        </div>

        <Tabs value={selectedDemo} onChange={(value) => setSelectedDemo(value || '')}>
          <Tabs.List>
            <Tabs.Tab value="session">Shared Session</Tabs.Tab>
            <Tabs.Tab value="prompting">Collaborative Prompting</Tabs.Tab>
            <Tabs.Tab value="assistant">AI Assistant</Tabs.Tab>
            <Tabs.Tab value="conflicts">Conflict Resolution</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="session" pt="md">
            <Stack>
              <Card>
                <Group justify="space-between" mb="md">
                  <Text fw={500}>Session Management</Text>
                  <Group>
                    <Badge color={session.connectionStatus === 'connected' ? 'green' : 'gray'}>
                      {session.connectionStatus}
                    </Badge>
                    <Badge>Sessions: {session.sessions.length}</Badge>
                  </Group>
                </Group>

                <Grid>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Session Name"
                      value={demoSessionName}
                      onChange={(e) => setDemoSessionName(e.target.value)}
                      mb="sm"
                    />
                    <Button 
                      fullWidth 
                      onClick={handleCreateSession}
                      leftSection={<IconUsers size={16} />}
                    >
                      Create Collaborative Session
                    </Button>
                  </Grid.Col>
                  
                  <Grid.Col span={6}>
                    <TextInput
                      label="Username"
                      value={demoUsername}
                      onChange={(e) => setDemoUsername(e.target.value)}
                      mb="sm"
                    />
                    <Button 
                      fullWidth 
                      variant="light" 
                      onClick={handleJoinSession}
                      disabled={!session.currentSession}
                      leftSection={<IconUser size={16} />}
                    >
                      Join Session
                    </Button>
                  </Grid.Col>
                </Grid>
              </Card>

              {session.currentSession && (
                <CollaborativeSessionDashboard
                  session={session}
                  prompting={prompting}
                  assistant={assistant}
                  conflictResolver={conflictResolver}
                />
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="prompting" pt="md">
            <Stack>
              <Card>
                <Text fw={500} mb="md">Collaborative Prompting System</Text>
                
                <Grid mb="md">
                  <Grid.Col span={4}>
                    <Paper p="sm" withBorder ta="center">
                      <Text size="sm" c="dimmed">Active Editors</Text>
                      <Text fw={500} size="lg">{prompting.editingState.collaborators}</Text>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Paper p="sm" withBorder ta="center">
                      <Text size="sm" c="dimmed">Shared Prompts</Text>
                      <Text fw={500} size="lg">{prompting.sharedPrompts.length}</Text>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Paper p="sm" withBorder ta="center">
                      <Text size="sm" c="dimmed">Active Operations</Text>
                      <Text fw={500} size="lg">{prompting.collaborativeEditor.operations.length}</Text>
                    </Paper>
                  </Grid.Col>
                </Grid>

                <Textarea
                  label="Collaborative Prompt Editor"
                  placeholder="Start typing to see collaborative editing in action..."
                  value={prompting.collaborativeEditor.content}
                  onChange={(e) => {
                    prompting.setCollaborativeEditor(prev => ({
                      ...prev,
                      content: e.target.value
                    }));
                  }}
                  minRows={5}
                  mb="md"
                />

                <Group>
                  <Button
                    leftSection={<IconEdit size={16} />}
                    onClick={() => {
                      const operation: Omit<EditOperation, 'id' | 'timestamp' | 'applied'> = {
                        type: 'insert',
                        position: prompting.collaborativeEditor.content.length,
                        content: ' [Collaborative edit]',
                        authorId: 'demo_user'
                      };
                      prompting.addCollaborativeEdit(operation);
                    }}
                  >
                    Simulate Collaborative Edit
                  </Button>
                  
                  <Button
                    variant="light"
                    leftSection={<IconShare size={16} />}
                    onClick={() => {
                      if (prompting.collaborativeEditor.content.trim()) {
                        prompting.createSharedPrompt(
                          prompting.collaborativeEditor.content,
                          ['current_user', 'demo_user']
                        );
                      }
                    }}
                  >
                    Create Shared Prompt
                  </Button>
                </Group>
              </Card>

              {prompting.sharedPrompts.length > 0 && (
                <Card>
                  <Text fw={500} mb="md">Shared Prompts</Text>
                  <Stack gap="sm">
                    {prompting.sharedPrompts.slice(-3).map(prompt => (
                      <Paper key={prompt.id} p="sm" withBorder>
                        <Group justify="space-between" mb="xs">
                          <Badge color={prompt.status === 'completed' ? 'green' : 'blue'}>
                            {prompt.status}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {new Date(prompt.createdAt).toLocaleTimeString()}
                          </Text>
                        </Group>
                        <Text size="sm" lineClamp={2}>{prompt.content}</Text>
                      </Paper>
                    ))}
                  </Stack>
                </Card>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="assistant" pt="md">
            <Stack>
              <Card>
                <Group justify="space-between" mb="md">
                  <Text fw={500}>Collaborative AI Assistant</Text>
                  <Badge color="green">Active</Badge>
                </Group>

                <Paper p="sm" withBorder mb="md">
                  <Text fw={500} mb="xs">{assistant.assistantConfig.personality.name}</Text>
                  <Text size="sm" c="dimmed" mb="sm">{assistant.assistantConfig.personality.description}</Text>
                  
                  <Group gap="xs" mb="sm">
                    {assistant.assistantConfig.personality.traits.map(trait => (
                      <Badge key={trait} size="xs" variant="light">{trait}</Badge>
                    ))}
                  </Group>

                  <Text size="xs" c="dimmed">
                    Collaboration Style: {assistant.assistantConfig.personality.collaborationStyle} • 
                    Adaptability: {assistant.assistantConfig.personality.adaptability}
                  </Text>
                </Paper>

                <Textarea
                  label="Send Collaborative Request"
                  placeholder="Ask the AI assistant something that considers the collaborative context..."
                  minRows={3}
                  mb="md"
                />

                <Group mb="md">
                  <Button
                    leftSection={<IconRobot size={16} />}
                    onClick={() => {
                      assistant.processCollaborativePrompt(
                        'Please help our team analyze this collaborative session',
                        ['user1', 'user2', 'current_user']
                      );
                    }}
                  >
                    Get Collaborative Response
                  </Button>
                  
                  <Button
                    variant="light"
                    leftSection={<IconGitMerge size={16} />}
                    onClick={() => {
                      assistant.facilitateCollaboration('perspective-conflict', ['user1', 'user2']);
                    }}
                  >
                    Request Facilitation
                  </Button>
                </Group>

                {assistant.interactions.length > 0 && (
                  <Paper p="sm" withBorder>
                    <Text fw={500} mb="xs">Recent Collaborative Interactions</Text>
                    <Stack gap="xs">
                      {assistant.interactions.slice(-3).map(interaction => (
                        <Group key={interaction.id} justify="space-between">
                          <Text size="sm">
                            {interaction.type} with {interaction.participants.length} participants
                          </Text>
                          <Text size="xs" c="dimmed">
                            {new Date(interaction.timestamp).toLocaleTimeString()}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                  </Paper>
                )}
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="conflicts" pt="md">
            <Stack>
              <Card>
                <Group justify="space-between" mb="md">
                  <Text fw={500}>Conflict Resolution System</Text>
                  <Group>
                    <Badge color={conflictResolver.activeConflicts.length > 0 ? 'orange' : 'green'}>
                      {conflictResolver.activeConflicts.length} active
                    </Badge>
                    <Button
                      size="sm"
                      variant="light"
                      onClick={handleCreateConflict}
                    >
                      Simulate Conflict
                    </Button>
                  </Group>
                </Group>

                <Grid mb="md">
                  <Grid.Col span={3}>
                    <Paper p="sm" withBorder ta="center">
                      <Text size="sm" c="dimmed">Total Conflicts</Text>
                      <Text fw={500} size="lg">{conflictResolver.conflictMetrics.totalConflicts}</Text>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Paper p="sm" withBorder ta="center">
                      <Text size="sm" c="dimmed">Resolved</Text>
                      <Text fw={500} size="lg">{conflictResolver.conflictMetrics.resolvedConflicts}</Text>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Paper p="sm" withBorder ta="center">
                      <Text size="sm" c="dimmed">Success Rate</Text>
                      <Text fw={500} size="lg">{conflictResolver.conflictMetrics.resolutionSuccess.toFixed(1)}%</Text>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Paper p="sm" withBorder ta="center">
                      <Text size="sm" c="dimmed">Avg. Resolution</Text>
                      <Text fw={500} size="lg">{Math.round(conflictResolver.conflictMetrics.averageResolutionTime)}ms</Text>
                    </Paper>
                  </Grid.Col>
                </Grid>

                {conflictResolver.activeConflicts.length > 0 ? (
                  <Stack gap="sm">
                    <Text fw={500}>Active Conflicts</Text>
                    {conflictResolver.activeConflicts.map(conflict => (
                      <Paper key={conflict.id} p="sm" withBorder>
                        <Group justify="space-between" mb="sm">
                          <Badge color="orange">{conflict.type}</Badge>
                          <Text size="xs" c="dimmed">
                            {new Date(conflict.createdAt).toLocaleTimeString()}
                          </Text>
                        </Group>
                        
                        <Text size="sm" mb="sm">
                          Conflict between {conflict.participants.length} participants: {conflict.participants.join(', ')}
                        </Text>

                        <Group>
                          <Button
                            size="xs"
                            onClick={() => conflictResolver.resolveConflict(conflict.id, 'merge')}
                          >
                            Auto-merge
                          </Button>
                          <Button
                            size="xs"
                            variant="light"
                            onClick={() => conflictResolver.resolveConflict(conflict.id, 'vote')}
                          >
                            Vote
                          </Button>
                          <Button
                            size="xs"
                            variant="light"
                            color="orange"
                            onClick={() => conflictResolver.resolveConflict(conflict.id, 'manual')}
                          >
                            Manual
                          </Button>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Paper p="md" withBorder>
                    <Text ta="center" c="dimmed">No active conflicts</Text>
                  </Paper>
                )}

                {conflictResolver.resolutionHistory.length > 0 && (
                  <div>
                    <Text fw={500} mb="sm">Resolution History</Text>
                    <Timeline>
                      {conflictResolver.resolutionHistory.slice(-3).map(resolution => (
                        <Timeline.Item
                          key={resolution.conflictId}
                          bullet={<IconGitMerge size={12} />}
                          title={`${resolution.strategy} resolution`}
                        >
                          <Text size="xs" c="dimmed">
                            Resolved conflict for {resolution.participants.length} participants • {new Date(resolution.resolvedAt).toLocaleString()}
                          </Text>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </div>
                )}
              </Card>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default CollaborativeAIFeaturesExercise;