// GADTs and Type-Safe State Machines
// Master Generalized Algebraic Data Types to build impossible-to-break state machines

// Learning objectives:
// - Understand GADTs and how they extend regular ADTs
// - Build state machines where invalid states are unrepresentable
// - Create type-safe event handling with impossible transitions
// - Implement hierarchical state machines with nested states
// - Design protocol state machines for network communication
// - Build workflow engines with compile-time guarantees
// - Create parser state machines with type-level validation

// Hints:
// 1. GADTs allow constructors to return different specializations of the same generic type
// 2. Use discriminated unions where each variant constrains the generic type differently
// 3. State machines should make illegal states unrepresentable at compile time
// 4. Think of state transitions as functions from State<A> to State<B>
// 5. Use phantom types to track state at the type level
// 6. Event handlers should only accept valid events for current state
// 7. Nested state machines enable hierarchical state modeling

import React, { useState, useCallback, useEffect, useRef } from 'react';

// TODO: Foundation - GADT Infrastructure
// GADTs allow constructors to return different type specializations

// Phantom type for state tracking
declare const StateBrand: unique symbol;
type StatePhantom<T> = { readonly [StateBrand]: T };

// GADT for type-safe state machines
type State<S, Data = unknown> = {
  readonly state: S;
  readonly data: Data;
} & StatePhantom<S>;

// Event with phantom typing for valid source states
declare const EventBrand: unique symbol;
type Event<From, To = From, Payload = void> = {
  readonly type: string;
  readonly payload: Payload;
  readonly [EventBrand]: { from: From; to: To };
};

// Transition function type
type Transition<From, To, Payload = void> = (
  state: State<From>,
  payload: Payload
) => State<To>;

// State machine definition
type StateMachineDefinition<States, Events> = {
  readonly initialState: States;
  readonly transitions: Events;
};

// TODO: Example 1 - Network Connection State Machine
// Model TCP connection lifecycle with impossible invalid states

type NetworkState = 
  | 'Disconnected'
  | 'Connecting' 
  | 'Connected'
  | 'Authenticating'
  | 'Authenticated'
  | 'Disconnecting'
  | 'Failed';

type NetworkData = {
  readonly host?: string;
  readonly port?: number;
  readonly connectionId?: string;
  readonly error?: string;
  readonly userId?: string;
  readonly sessionToken?: string;
  readonly lastActivity?: Date;
};

// Network events with type-safe constraints
type NetworkEvents = 
  | Event<'Disconnected', 'Connecting', { host: string; port: number }>
  | Event<'Connecting', 'Connected', { connectionId: string }>
  | Event<'Connecting', 'Failed', { error: string }>
  | Event<'Connected', 'Authenticating', { userId: string; password: string }>
  | Event<'Connected', 'Disconnecting'>
  | Event<'Authenticating', 'Authenticated', { sessionToken: string }>
  | Event<'Authenticating', 'Failed', { error: string }>
  | Event<'Authenticated', 'Disconnecting'>
  | Event<'Failed', 'Disconnected'>
  | Event<'Disconnecting', 'Disconnected'>;

// Network state machine implementation
const NetworkStateMachine = {
  // Create initial state
  initial: (): State<'Disconnected', NetworkData> => ({
    state: 'Disconnected' as const,
    data: {},
    [StateBrand]: 'Disconnected' as const,
  }),

  // Transition functions - each only accepts valid source states
  connect: (
    state: State<'Disconnected', NetworkData>,
    payload: { host: string; port: number }
  ): State<'Connecting', NetworkData> => ({
    state: 'Connecting' as const,
    data: { ...state.data, host: payload.host, port: payload.port },
    [StateBrand]: 'Connecting' as const,
  }),

  connectionEstablished: (
    state: State<'Connecting', NetworkData>,
    payload: { connectionId: string }
  ): State<'Connected', NetworkData> => ({
    state: 'Connected' as const,
    data: { ...state.data, connectionId: payload.connectionId },
    [StateBrand]: 'Connected' as const,
  }),

  connectionFailed: <From extends 'Connecting' | 'Authenticating',>(
    state: State<From, NetworkData>,
    payload: { error: string }
  ): State<'Failed', NetworkData> => ({
    state: 'Failed' as const,
    data: { ...state.data, error: payload.error },
    [StateBrand]: 'Failed' as const,
  }),

  startAuthentication: (
    state: State<'Connected', NetworkData>,
    payload: { userId: string; password: string }
  ): State<'Authenticating', NetworkData> => ({
    state: 'Authenticating' as const,
    data: { ...state.data, userId: payload.userId },
    [StateBrand]: 'Authenticating' as const,
  }),

  authenticationSucceeded: (
    state: State<'Authenticating', NetworkData>,
    payload: { sessionToken: string }
  ): State<'Authenticated', NetworkData> => ({
    state: 'Authenticated' as const,
    data: { 
      ...state.data, 
      sessionToken: payload.sessionToken, 
      lastActivity: new Date() 
    },
    [StateBrand]: 'Authenticated' as const,
  }),

  startDisconnection: <From extends 'Connected' | 'Authenticated',>(
    state: State<From, NetworkData>
  ): State<'Disconnecting', NetworkData> => ({
    state: 'Disconnecting' as const,
    data: state.data,
    [StateBrand]: 'Disconnecting' as const,
  }),

  disconnected: <From extends 'Failed' | 'Disconnecting',>(
    state: State<From, NetworkData>
  ): State<'Disconnected', NetworkData> => ({
    state: 'Disconnected' as const,
    data: {},
    [StateBrand]: 'Disconnected' as const,
  }),

  // Query functions - work on any state
  isConnected: (state: State<NetworkState, NetworkData>): boolean =>
    ['Connected', 'Authenticating', 'Authenticated'].includes(state.state),

  canAuthenticate: (state: State<NetworkState, NetworkData>): state is State<'Connected', NetworkData> =>
    state.state === 'Connected',

  isAuthenticated: (state: State<NetworkState, NetworkData>): state is State<'Authenticated', NetworkData> =>
    state.state === 'Authenticated',

  getConnectionInfo: (state: State<NetworkState, NetworkData>) => ({
    host: state.data.host,
    port: state.data.port,
    connectionId: state.data.connectionId,
    userId: state.data.userId,
    isConnected: NetworkStateMachine.isConnected(state),
    isAuthenticated: NetworkStateMachine.isAuthenticated(state),
  }),
};

// TODO: Example 2 - Document Editing State Machine
// Complex state machine with hierarchical states and undo/redo

type DocumentState =
  | 'Empty'
  | 'Editing'
  | 'Saving'
  | 'Saved'
  | 'SaveFailed'
  | 'ReadOnly';

type DocumentData = {
  readonly content: string;
  readonly savedContent?: string;
  readonly isDirty: boolean;
  readonly lastSaved?: Date;
  readonly error?: string;
  readonly version: number;
  readonly history: readonly { content: string; timestamp: Date }[];
  readonly historyIndex: number;
};

type DocumentEvents =
  | Event<'Empty', 'Editing', { initialContent: string }>
  | Event<'Editing', 'Editing', { newContent: string }>
  | Event<'Editing', 'Saving'>
  | Event<'Saving', 'Saved', { savedAt: Date }>
  | Event<'Saving', 'SaveFailed', { error: string }>
  | Event<'Saved', 'Editing', { newContent: string }>
  | Event<'SaveFailed', 'Editing'>
  | Event<'Editing', 'ReadOnly'>
  | Event<'ReadOnly', 'Editing'>
  | Event<'Editing', 'Editing', 'undo'>
  | Event<'Editing', 'Editing', 'redo'>;

const DocumentStateMachine = {
  initial: (): State<'Empty', DocumentData> => ({
    state: 'Empty' as const,
    data: {
      content: '',
      isDirty: false,
      version: 0,
      history: [],
      historyIndex: -1,
    },
    [StateBrand]: 'Empty' as const,
  }),

  startEditing: (
    state: State<'Empty', DocumentData>,
    payload: { initialContent: string }
  ): State<'Editing', DocumentData> => ({
    state: 'Editing' as const,
    data: {
      ...state.data,
      content: payload.initialContent,
      isDirty: false,
      history: [{ content: payload.initialContent, timestamp: new Date() }],
      historyIndex: 0,
    },
    [StateBrand]: 'Editing' as const,
  }),

  editContent: (
    state: State<'Editing', DocumentData> | State<'Saved', DocumentData>,
    payload: { newContent: string }
  ): State<'Editing', DocumentData> => {
    const newHistoryEntry = { content: payload.newContent, timestamp: new Date() };
    const newHistory = [
      ...state.data.history.slice(0, state.data.historyIndex + 1),
      newHistoryEntry
    ];
    
    return {
      state: 'Editing' as const,
      data: {
        ...state.data,
        content: payload.newContent,
        isDirty: payload.newContent !== state.data.savedContent,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      },
      [StateBrand]: 'Editing' as const,
    };
  },

  startSaving: (
    state: State<'Editing', DocumentData>
  ): State<'Saving', DocumentData> => ({
    state: 'Saving' as const,
    data: state.data,
    [StateBrand]: 'Saving' as const,
  }),

  saveSucceeded: (
    state: State<'Saving', DocumentData>,
    payload: { savedAt: Date }
  ): State<'Saved', DocumentData> => ({
    state: 'Saved' as const,
    data: {
      ...state.data,
      savedContent: state.data.content,
      isDirty: false,
      lastSaved: payload.savedAt,
      version: state.data.version + 1,
      error: undefined,
    },
    [StateBrand]: 'Saved' as const,
  }),

  saveFailed: (
    state: State<'Saving', DocumentData>,
    payload: { error: string }
  ): State<'SaveFailed', DocumentData> => ({
    state: 'SaveFailed' as const,
    data: { ...state.data, error: payload.error },
    [StateBrand]: 'SaveFailed' as const,
  }),

  resumeEditing: (
    state: State<'SaveFailed', DocumentData>
  ): State<'Editing', DocumentData> => ({
    state: 'Editing' as const,
    data: { ...state.data, error: undefined },
    [StateBrand]: 'Editing' as const,
  }),

  makeReadOnly: (
    state: State<'Editing', DocumentData>
  ): State<'ReadOnly', DocumentData> => ({
    state: 'ReadOnly' as const,
    data: state.data,
    [StateBrand]: 'ReadOnly' as const,
  }),

  makeEditable: (
    state: State<'ReadOnly', DocumentData>
  ): State<'Editing', DocumentData> => ({
    state: 'Editing' as const,
    data: state.data,
    [StateBrand]: 'Editing' as const,
  }),

  undo: (
    state: State<'Editing', DocumentData>
  ): State<'Editing', DocumentData> => {
    if (state.data.historyIndex <= 0) return state;
    
    const newIndex = state.data.historyIndex - 1;
    const previousContent = state.data.history[newIndex]?.content || '';
    
    return {
      state: 'Editing' as const,
      data: {
        ...state.data,
        content: previousContent,
        isDirty: previousContent !== state.data.savedContent,
        historyIndex: newIndex,
      },
      [StateBrand]: 'Editing' as const,
    };
  },

  redo: (
    state: State<'Editing', DocumentData>
  ): State<'Editing', DocumentData> => {
    if (state.data.historyIndex >= state.data.history.length - 1) return state;
    
    const newIndex = state.data.historyIndex + 1;
    const nextContent = state.data.history[newIndex]?.content || '';
    
    return {
      state: 'Editing' as const,
      data: {
        ...state.data,
        content: nextContent,
        isDirty: nextContent !== state.data.savedContent,
        historyIndex: newIndex,
      },
      [StateBrand]: 'Editing' as const,
    };
  },

  // Query functions
  canSave: (state: State<DocumentState, DocumentData>): boolean =>
    state.state === 'Editing' && state.data.isDirty,

  canUndo: (state: State<DocumentState, DocumentData>): boolean =>
    state.state === 'Editing' && state.data.historyIndex > 0,

  canRedo: (state: State<DocumentState, DocumentData>): boolean =>
    state.state === 'Editing' && state.data.historyIndex < state.data.history.length - 1,

  isEditable: (state: State<DocumentState, DocumentData>): boolean =>
    ['Editing', 'Saved'].includes(state.state),

  getStats: (state: State<DocumentState, DocumentData>) => ({
    wordCount: state.data.content.split(/\s+/).filter(Boolean).length,
    characterCount: state.data.content.length,
    isDirty: state.data.isDirty,
    version: state.data.version,
    lastSaved: state.data.lastSaved,
    historyLength: state.data.history.length,
    canUndo: DocumentStateMachine.canUndo(state),
    canRedo: DocumentStateMachine.canRedo(state),
  }),
};

// TODO: Example 3 - HTTP Request State Machine
// Protocol state machine for HTTP request lifecycle

type HttpState = 
  | 'Idle'
  | 'Pending'
  | 'Success'
  | 'Error'
  | 'Timeout'
  | 'Cancelled';

type HttpData<T = unknown> = {
  readonly url?: string;
  readonly method?: string;
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
  readonly response?: T;
  readonly error?: string;
  readonly statusCode?: number;
  readonly duration?: number;
  readonly startTime?: Date;
  readonly endTime?: Date;
};

type HttpEvents<T> =
  | Event<'Idle', 'Pending', { url: string; method: string; headers?: Record<string, string>; body?: unknown }>
  | Event<'Pending', 'Success', { response: T; statusCode: number }>
  | Event<'Pending', 'Error', { error: string; statusCode?: number }>
  | Event<'Pending', 'Timeout'>
  | Event<'Pending', 'Cancelled'>
  | Event<'Success' | 'Error' | 'Timeout' | 'Cancelled', 'Idle'>;

const HttpStateMachine = {
  initial: <T,>(): State<'Idle', HttpData<T>> => ({
    state: 'Idle' as const,
    data: {},
    [StateBrand]: 'Idle' as const,
  }),

  startRequest: <T,>(
    state: State<'Idle', HttpData<T>>,
    payload: { url: string; method: string; headers?: Record<string, string>; body?: unknown }
  ): State<'Pending', HttpData<T>> => ({
    state: 'Pending' as const,
    data: {
      ...state.data,
      url: payload.url,
      method: payload.method,
      headers: payload.headers,
      body: payload.body,
      startTime: new Date(),
    },
    [StateBrand]: 'Pending' as const,
  }),

  requestSucceeded: <T,>(
    state: State<'Pending', HttpData<T>>,
    payload: { response: T; statusCode: number }
  ): State<'Success', HttpData<T>> => {
    const endTime = new Date();
    const duration = state.data.startTime ? endTime.getTime() - state.data.startTime.getTime() : 0;

    return {
      state: 'Success' as const,
      data: {
        ...state.data,
        response: payload.response,
        statusCode: payload.statusCode,
        endTime,
        duration,
      },
      [StateBrand]: 'Success' as const,
    };
  },

  requestFailed: <T,>(
    state: State<'Pending', HttpData<T>>,
    payload: { error: string; statusCode?: number }
  ): State<'Error', HttpData<T>> => {
    const endTime = new Date();
    const duration = state.data.startTime ? endTime.getTime() - state.data.startTime.getTime() : 0;

    return {
      state: 'Error' as const,
      data: {
        ...state.data,
        error: payload.error,
        statusCode: payload.statusCode,
        endTime,
        duration,
      },
      [StateBrand]: 'Error' as const,
    };
  },

  requestTimedOut: <T,>(
    state: State<'Pending', HttpData<T>>
  ): State<'Timeout', HttpData<T>> => {
    const endTime = new Date();
    const duration = state.data.startTime ? endTime.getTime() - state.data.startTime.getTime() : 0;

    return {
      state: 'Timeout' as const,
      data: {
        ...state.data,
        error: 'Request timed out',
        endTime,
        duration,
      },
      [StateBrand]: 'Timeout' as const,
    };
  },

  requestCancelled: <T,>(
    state: State<'Pending', HttpData<T>>
  ): State<'Cancelled', HttpData<T>> => {
    const endTime = new Date();
    const duration = state.data.startTime ? endTime.getTime() - state.data.startTime.getTime() : 0;

    return {
      state: 'Cancelled' as const,
      data: {
        ...state.data,
        error: 'Request cancelled',
        endTime,
        duration,
      },
      [StateBrand]: 'Cancelled' as const,
    };
  },

  reset: <T,>(
    state: State<'Success' | 'Error' | 'Timeout' | 'Cancelled', HttpData<T>>
  ): State<'Idle', HttpData<T>> => ({
    state: 'Idle' as const,
    data: {},
    [StateBrand]: 'Idle' as const,
  }),

  // Query functions
  isPending: <T,>(state: State<HttpState, HttpData<T>>): boolean =>
    state.state === 'Pending',

  isComplete: <T,>(state: State<HttpState, HttpData<T>>): boolean =>
    ['Success', 'Error', 'Timeout', 'Cancelled'].includes(state.state),

  isSuccessful: <T,>(state: State<HttpState, HttpData<T>>): state is State<'Success', HttpData<T>> =>
    state.state === 'Success',

  hasError: <T,>(state: State<HttpState, HttpData<T>>): boolean =>
    ['Error', 'Timeout', 'Cancelled'].includes(state.state),

  canRetry: <T,>(state: State<HttpState, HttpData<T>>): boolean =>
    ['Error', 'Timeout'].includes(state.state),

  getRequestInfo: <T,>(state: State<HttpState, HttpData<T>>) => ({
    url: state.data.url,
    method: state.data.method,
    state: state.state,
    duration: state.data.duration,
    statusCode: state.data.statusCode,
    hasResponse: !!state.data.response,
    error: state.data.error,
  }),
};

// TODO: Example 4 - Game State Machine
// Complex game state with hierarchical states and game logic

type GameState = 
  | 'MainMenu'
  | 'Playing'
  | 'Paused'
  | 'GameOver'
  | 'Victory'
  | 'Settings'
  | 'Loading';

type GameData = {
  readonly level: number;
  readonly score: number;
  readonly lives: number;
  readonly playerPosition: { x: number; y: number };
  readonly enemies: readonly { id: string; x: number; y: number; health: number }[];
  readonly powerUps: readonly { id: string; type: string; x: number; y: number }[];
  readonly timeRemaining: number;
  readonly highScore: number;
  readonly settings: {
    readonly difficulty: 'easy' | 'medium' | 'hard';
    readonly soundEnabled: boolean;
    readonly musicEnabled: boolean;
  };
};

const GameStateMachine = {
  initial: (): State<'MainMenu', GameData> => ({
    state: 'MainMenu' as const,
    data: {
      level: 1,
      score: 0,
      lives: 3,
      playerPosition: { x: 0, y: 0 },
      enemies: [],
      powerUps: [],
      timeRemaining: 0,
      highScore: 0,
      settings: {
        difficulty: 'medium',
        soundEnabled: true,
        musicEnabled: true,
      },
    },
    [StateBrand]: 'MainMenu' as const,
  }),

  startGame: (
    state: State<'MainMenu', GameData>
  ): State<'Loading', GameData> => ({
    state: 'Loading' as const,
    data: {
      ...state.data,
      level: 1,
      score: 0,
      lives: 3,
      playerPosition: { x: 0, y: 0 },
      enemies: [],
      powerUps: [],
      timeRemaining: 60,
    },
    [StateBrand]: 'Loading' as const,
  }),

  gameLoaded: (
    state: State<'Loading', GameData>
  ): State<'Playing', GameData> => ({
    state: 'Playing' as const,
    data: state.data,
    [StateBrand]: 'Playing' as const,
  }),

  pauseGame: (
    state: State<'Playing', GameData>
  ): State<'Paused', GameData> => ({
    state: 'Paused' as const,
    data: state.data,
    [StateBrand]: 'Paused' as const,
  }),

  resumeGame: (
    state: State<'Paused', GameData>
  ): State<'Playing', GameData> => ({
    state: 'Playing' as const,
    data: state.data,
    [StateBrand]: 'Playing' as const,
  }),

  playerDied: (
    state: State<'Playing', GameData>
  ): State<'Playing', GameData> | State<'GameOver', GameData> => {
    const newLives = state.data.lives - 1;
    
    if (newLives <= 0) {
      return {
        state: 'GameOver' as const,
        data: {
          ...state.data,
          lives: 0,
          highScore: Math.max(state.data.score, state.data.highScore),
        },
        [StateBrand]: 'GameOver' as const,
      };
    }
    
    return {
      state: 'Playing' as const,
      data: {
        ...state.data,
        lives: newLives,
        playerPosition: { x: 0, y: 0 }, // Respawn at start
      },
      [StateBrand]: 'Playing' as const,
    };
  },

  levelCompleted: (
    state: State<'Playing', GameData>
  ): State<'Playing', GameData> | State<'Victory', GameData> => {
    const newLevel = state.data.level + 1;
    const bonusScore = state.data.timeRemaining * 10;
    const newScore = state.data.score + bonusScore;
    
    // Victory condition - completed all levels (let's say 10)
    if (newLevel > 10) {
      return {
        state: 'Victory' as const,
        data: {
          ...state.data,
          score: newScore,
          highScore: Math.max(newScore, state.data.highScore),
        },
        [StateBrand]: 'Victory' as const,
      };
    }
    
    return {
      state: 'Playing' as const,
      data: {
        ...state.data,
        level: newLevel,
        score: newScore,
        timeRemaining: 60 + (newLevel * 5), // More time for harder levels
        enemies: [], // Reset enemies for new level
        powerUps: [],
      },
      [StateBrand]: 'Playing' as const,
    };
  },

  updateScore: (
    state: State<'Playing', GameData>,
    payload: { points: number }
  ): State<'Playing', GameData> => ({
    state: 'Playing' as const,
    data: {
      ...state.data,
      score: state.data.score + payload.points,
    },
    [StateBrand]: 'Playing' as const,
  }),

  movePlayer: (
    state: State<'Playing', GameData>,
    payload: { x: number; y: number }
  ): State<'Playing', GameData> => ({
    state: 'Playing' as const,
    data: {
      ...state.data,
      playerPosition: payload,
    },
    [StateBrand]: 'Playing' as const,
  }),

  openSettings: <From extends 'MainMenu' | 'Paused',>(
    state: State<From, GameData>
  ): State<'Settings', GameData> => ({
    state: 'Settings' as const,
    data: state.data,
    [StateBrand]: 'Settings' as const,
  }),

  closeSettings: (
    state: State<'Settings', GameData>
  ): State<'MainMenu', GameData> => ({
    state: 'MainMenu' as const,
    data: state.data,
    [StateBrand]: 'MainMenu' as const,
  }),

  backToMenu: <From extends 'GameOver' | 'Victory' | 'Paused',>(
    state: State<From, GameData>
  ): State<'MainMenu', GameData> => ({
    state: 'MainMenu' as const,
    data: state.data,
    [StateBrand]: 'MainMenu' as const,
  }),

  // Query functions
  isPlaying: (state: State<GameState, GameData>): boolean =>
    state.state === 'Playing',

  canPause: (state: State<GameState, GameData>): boolean =>
    state.state === 'Playing',

  canResume: (state: State<GameState, GameData>): boolean =>
    state.state === 'Paused',

  isGameActive: (state: State<GameState, GameData>): boolean =>
    ['Playing', 'Paused'].includes(state.state),

  hasEnded: (state: State<GameState, GameData>): boolean =>
    ['GameOver', 'Victory'].includes(state.state),

  getGameStats: (state: State<GameState, GameData>) => ({
    level: state.data.level,
    score: state.data.score,
    lives: state.data.lives,
    timeRemaining: state.data.timeRemaining,
    highScore: state.data.highScore,
    isPlaying: GameStateMachine.isPlaying(state),
    enemyCount: state.data.enemies.length,
    powerUpCount: state.data.powerUps.length,
  }),
};

// TODO: React Components demonstrating GADTs and State Machines

// Network connection component
function NetworkStateMachineDemo() {
  const [networkState, setNetworkState] = useState(() => NetworkStateMachine.initial());
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  const handleConnect = useCallback(() => {
    if (networkState.state === 'Disconnected') {
      const newState = NetworkStateMachine.connect(networkState, { 
        host: 'api.example.com', 
        port: 443 
      });
      setNetworkState(newState);
      addLog(`Connecting to ${newState.data.host}:${newState.data.port}`);
      
      // Simulate connection establishment
      setTimeout(() => {
        setNetworkState(prev => {
          if (prev.state === 'Connecting') {
            const connectedState = NetworkStateMachine.connectionEstablished(prev, {
              connectionId: Math.random().toString(36).substr(2, 9)
            });
            addLog(`Connected with ID: ${connectedState.data.connectionId}`);
            return connectedState;
          }
          return prev;
        });
      }, 1000);
    }
  }, [networkState, addLog]);

  const handleAuthenticate = useCallback(() => {
    if (networkState.state === 'Connected') {
      const authState = NetworkStateMachine.startAuthentication(networkState, {
        userId: 'user123',
        password: 'secret'
      });
      setNetworkState(authState);
      addLog('Starting authentication...');
      
      // Simulate authentication
      setTimeout(() => {
        setNetworkState(prev => {
          if (prev.state === 'Authenticating') {
            if (Math.random() > 0.3) {
              const authenticatedState = NetworkStateMachine.authenticationSucceeded(prev, {
                sessionToken: 'token_' + Math.random().toString(36).substr(2, 12)
              });
              addLog('Authentication successful');
              return authenticatedState;
            } else {
              const failedState = NetworkStateMachine.connectionFailed(prev, {
                error: 'Invalid credentials'
              });
              addLog('Authentication failed: Invalid credentials');
              return failedState;
            }
          }
          return prev;
        });
      }, 1500);
    }
  }, [networkState, addLog]);

  const handleDisconnect = useCallback(() => {
    if (networkState.state === 'Connected' || networkState.state === 'Authenticated') {
      const disconnectingState = NetworkStateMachine.startDisconnection(networkState);
      setNetworkState(disconnectingState);
      addLog('Disconnecting...');
      
      setTimeout(() => {
        setNetworkState(prev => {
          if (prev.state === 'Disconnecting') {
            const disconnectedState = NetworkStateMachine.disconnected(prev);
            addLog('Disconnected');
            return disconnectedState;
          }
          return prev;
        });
      }, 500);
    }
  }, [networkState, addLog]);

  const handleReset = useCallback(() => {
    if (networkState.state === 'Failed') {
      const resetState = NetworkStateMachine.disconnected(networkState);
      setNetworkState(resetState);
      addLog('Reset to disconnected state');
    }
  }, [networkState, addLog]);

  const connectionInfo = NetworkStateMachine.getConnectionInfo(networkState);

  return (
    <div>
      <h3>Network State Machine</h3>
      
      <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <strong>State:</strong> <span style={{ color: getStateColor(networkState.state) }}>
          {networkState.state}
        </span>
        {connectionInfo.host && (
          <div><strong>Host:</strong> {connectionInfo.host}:{connectionInfo.port}</div>
        )}
        {connectionInfo.connectionId && (
          <div><strong>Connection ID:</strong> {connectionInfo.connectionId}</div>
        )}
        {connectionInfo.userId && (
          <div><strong>User:</strong> {connectionInfo.userId}</div>
        )}
      </div>

      <div style={{ margin: '10px 0' }}>
        <button 
          onClick={handleConnect}
          disabled={networkState.state !== 'Disconnected'}
        >
          Connect
        </button>
        <button 
          onClick={handleAuthenticate}
          disabled={!NetworkStateMachine.canAuthenticate(networkState)}
        >
          Authenticate
        </button>
        <button 
          onClick={handleDisconnect}
          disabled={!NetworkStateMachine.isConnected(networkState)}
        >
          Disconnect
        </button>
        <button 
          onClick={handleReset}
          disabled={networkState.state !== 'Failed'}
        >
          Reset
        </button>
      </div>

      <div style={{ margin: '10px 0' }}>
        <strong>Activity Log:</strong>
        <div style={{ 
          height: '150px', 
          overflowY: 'auto', 
          border: '1px solid #ccc', 
          padding: '5px',
          backgroundColor: '#fafafa',
          fontSize: '12px'
        }}>
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Document editing component
function DocumentStateMachineDemo() {
  const [docState, setDocState] = useState(() => DocumentStateMachine.initial());
  const [textInput, setTextInput] = useState('');

  const handleStartEditing = useCallback(() => {
    if (docState.state === 'Empty') {
      const editingState = DocumentStateMachine.startEditing(docState, {
        initialContent: 'Hello, World!'
      });
      setDocState(editingState);
      setTextInput(editingState.data.content);
    }
  }, [docState]);

  const handleContentChange = useCallback((newContent: string) => {
    setTextInput(newContent);
    if (docState.state === 'Editing' || docState.state === 'Saved') {
      const updatedState = DocumentStateMachine.editContent(docState, { newContent });
      setDocState(updatedState);
    }
  }, [docState]);

  const handleSave = useCallback(() => {
    if (docState.state === 'Editing' && DocumentStateMachine.canSave(docState)) {
      const savingState = DocumentStateMachine.startSaving(docState);
      setDocState(savingState);
      
      // Simulate save operation
      setTimeout(() => {
        setDocState(prev => {
          if (prev.state === 'Saving') {
            if (Math.random() > 0.2) {
              return DocumentStateMachine.saveSucceeded(prev, { savedAt: new Date() });
            } else {
              return DocumentStateMachine.saveFailed(prev, { error: 'Network error' });
            }
          }
          return prev;
        });
      }, 1000);
    }
  }, [docState]);

  const handleUndo = useCallback(() => {
    if (DocumentStateMachine.canUndo(docState)) {
      const undoState = DocumentStateMachine.undo(docState as State<'Editing', DocumentData>);
      setDocState(undoState);
      setTextInput(undoState.data.content);
    }
  }, [docState]);

  const handleRedo = useCallback(() => {
    if (DocumentStateMachine.canRedo(docState)) {
      const redoState = DocumentStateMachine.redo(docState as State<'Editing', DocumentData>);
      setDocState(redoState);
      setTextInput(redoState.data.content);
    }
  }, [docState]);

  const handleRetry = useCallback(() => {
    if (docState.state === 'SaveFailed') {
      const editingState = DocumentStateMachine.resumeEditing(docState);
      setDocState(editingState);
    }
  }, [docState]);

  const stats = DocumentStateMachine.getStats(docState);
  const isEditable = DocumentStateMachine.isEditable(docState);

  return (
    <div>
      <h3>Document State Machine</h3>
      
      <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <strong>State:</strong> <span style={{ color: getStateColor(docState.state) }}>
          {docState.state}
        </span>
        <div><strong>Words:</strong> {stats.wordCount} | <strong>Characters:</strong> {stats.characterCount}</div>
        <div><strong>Version:</strong> {stats.version} | <strong>Dirty:</strong> {stats.isDirty ? 'Yes' : 'No'}</div>
        {stats.lastSaved && <div><strong>Last Saved:</strong> {stats.lastSaved.toLocaleTimeString()}</div>}
        {docState.data.error && (
          <div style={{ color: 'red' }}><strong>Error:</strong> {docState.data.error}</div>
        )}
      </div>

      {docState.state === 'Empty' && (
        <button onClick={handleStartEditing}>Start Editing</button>
      )}

      {isEditable && (
        <div>
          <textarea
            value={textInput}
            onChange={(e) => handleContentChange(e.target.value)}
            disabled={!isEditable}
            style={{ 
              width: '100%', 
              height: '100px', 
              margin: '10px 0',
              opacity: docState.state === 'ReadOnly' ? 0.6 : 1
            }}
            placeholder="Start typing..."
          />
          
          <div>
            <button 
              onClick={handleSave}
              disabled={!DocumentStateMachine.canSave(docState)}
            >
              {docState.state === 'Saving' ? 'Saving...' : 'Save'}
            </button>
            <button 
              onClick={handleUndo}
              disabled={!stats.canUndo}
            >
              Undo
            </button>
            <button 
              onClick={handleRedo}
              disabled={!stats.canRedo}
            >
              Redo
            </button>
            {docState.state === 'SaveFailed' && (
              <button onClick={handleRetry}>Retry Save</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple game state machine component
function GameStateMachineDemo() {
  const [gameState, setGameState] = useState(() => GameStateMachine.initial());

  const handleStartGame = useCallback(() => {
    if (gameState.state === 'MainMenu') {
      const loadingState = GameStateMachine.startGame(gameState);
      setGameState(loadingState);
      
      setTimeout(() => {
        setGameState(prev => {
          if (prev.state === 'Loading') {
            return GameStateMachine.gameLoaded(prev);
          }
          return prev;
        });
      }, 1000);
    }
  }, [gameState]);

  const handlePause = useCallback(() => {
    if (GameStateMachine.canPause(gameState)) {
      const pausedState = GameStateMachine.pauseGame(gameState as State<'Playing', GameData>);
      setGameState(pausedState);
    }
  }, [gameState]);

  const handleResume = useCallback(() => {
    if (GameStateMachine.canResume(gameState)) {
      const playingState = GameStateMachine.resumeGame(gameState as State<'Paused', GameData>);
      setGameState(playingState);
    }
  }, [gameState]);

  const handleBackToMenu = useCallback(() => {
    if (['GameOver', 'Victory', 'Paused'].includes(gameState.state)) {
      const menuState = GameStateMachine.backToMenu(gameState as any);
      setGameState(menuState);
    }
  }, [gameState]);

  const handleLevelComplete = useCallback(() => {
    if (gameState.state === 'Playing') {
      const newState = GameStateMachine.levelCompleted(gameState);
      setGameState(newState);
    }
  }, [gameState]);

  const handlePlayerDeath = useCallback(() => {
    if (gameState.state === 'Playing') {
      const newState = GameStateMachine.playerDied(gameState);
      setGameState(newState);
    }
  }, [gameState]);

  const stats = GameStateMachine.getGameStats(gameState);

  return (
    <div>
      <h3>Game State Machine</h3>
      
      <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <strong>State:</strong> <span style={{ color: getStateColor(gameState.state) }}>
          {gameState.state}
        </span>
        <div><strong>Level:</strong> {stats.level} | <strong>Score:</strong> {stats.score}</div>
        <div><strong>Lives:</strong> {stats.lives} | <strong>High Score:</strong> {stats.highScore}</div>
        {stats.isPlaying && <div><strong>Time:</strong> {stats.timeRemaining}s</div>}
      </div>

      <div style={{ margin: '10px 0' }}>
        {gameState.state === 'MainMenu' && (
          <button onClick={handleStartGame}>Start Game</button>
        )}
        
        {gameState.state === 'Loading' && (
          <div>Loading game...</div>
        )}
        
        {GameStateMachine.canPause(gameState) && (
          <button onClick={handlePause}>Pause</button>
        )}
        
        {GameStateMachine.canResume(gameState) && (
          <button onClick={handleResume}>Resume</button>
        )}
        
        {gameState.state === 'Playing' && (
          <>
            <button onClick={handleLevelComplete}>Complete Level</button>
            <button onClick={handlePlayerDeath}>Lose Life</button>
          </>
        )}
        
        {['GameOver', 'Victory', 'Paused'].includes(gameState.state) && (
          <button onClick={handleBackToMenu}>Back to Menu</button>
        )}
      </div>

      {gameState.state === 'GameOver' && (
        <div style={{ color: 'red', fontWeight: 'bold' }}>
          Game Over! Final Score: {stats.score}
        </div>
      )}
      
      {gameState.state === 'Victory' && (
        <div style={{ color: 'green', fontWeight: 'bold' }}>
          Victory! You completed all levels! Score: {stats.score}
        </div>
      )}
    </div>
  );
}

// Helper function for state colors
function getStateColor(state: string): string {
  const colors: Record<string, string> = {
    // Network states
    'Disconnected': '#666',
    'Connecting': '#ff9800',
    'Connected': '#4caf50',
    'Authenticating': '#2196f3',
    'Authenticated': '#8bc34a',
    'Disconnecting': '#ff9800',
    'Failed': '#f44336',
    
    // Document states
    'Empty': '#666',
    'Editing': '#2196f3',
    'Saving': '#ff9800',
    'Saved': '#4caf50',
    'SaveFailed': '#f44336',
    'ReadOnly': '#9c27b0',
    
    // Game states
    'MainMenu': '#666',
    'Playing': '#4caf50',
    'Paused': '#ff9800',
    'GameOver': '#f44336',
    'Victory': '#8bc34a',
    'Loading': '#2196f3',
  };
  
  return colors[state] || '#333';
}

// Main app component
function App() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>GADTs and Type-Safe State Machines</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <NetworkStateMachineDemo />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <DocumentStateMachineDemo />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <GameStateMachineDemo />
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>GADT and State Machine Concepts Demonstrated:</h3>
        <ul>
          <li><strong>GADTs:</strong> Constructors that return different type specializations</li>
          <li><strong>Type-Safe Transitions:</strong> Invalid state transitions are impossible at compile time</li>
          <li><strong>Phantom States:</strong> State tracking at the type level with zero runtime cost</li>
          <li><strong>Event Constraints:</strong> Events can only be sent from valid source states</li>
          <li><strong>Hierarchical States:</strong> Complex state machines with nested state logic</li>
          <li><strong>Protocol Machines:</strong> Network and HTTP request lifecycle modeling</li>
          <li><strong>Workflow Engines:</strong> Document editing with undo/redo and save states</li>
          <li><strong>Game State Logic:</strong> Complex game flow with multiple conditional transitions</li>
        </ul>
      </div>
    </div>
  );
}

// Export everything for testing and further exercises
export {
  App,
  NetworkStateMachineDemo,
  DocumentStateMachineDemo,
  GameStateMachineDemo,
  NetworkStateMachine,
  DocumentStateMachine,
  HttpStateMachine,
  GameStateMachine,
  getStateColor,
  type State,
  type Event,
  type Transition,
  type StateMachineDefinition,
  type NetworkState,
  type NetworkData,
  type NetworkEvents,
  type DocumentState,
  type DocumentData,
  type DocumentEvents,
  type HttpState,
  type HttpData,
  type HttpEvents,
  type GameState,
  type GameData,
};