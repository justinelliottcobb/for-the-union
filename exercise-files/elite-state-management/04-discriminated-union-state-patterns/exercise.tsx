// Discriminated Union State Management Patterns
// Master advanced patterns using discriminated unions for bulletproof state management

import React, { useReducer, useCallback, useEffect, useMemo } from 'react';

// Learning objectives:
// - Design state machines using pure discriminated unions (without XState)
// - Implement complex state transitions with type safety
// - Create reusable state management patterns with discriminated unions
// - Handle async operations and error states elegantly
// - Build undo/redo functionality using discriminated union history
// - Design domain-specific state machines for business logic

// Hints:
// 1. Always use discriminated unions for both state and actions
// 2. Implement exhaustive checking with `never` type
// 3. Create state machine guards for valid transitions
// 4. Use discriminated unions for modeling different entity states
// 5. Implement history patterns for undo/redo functionality
// 6. Design composable state machines for complex applications

// TODO: Define discriminated union state patterns for different domains

// Form Wizard State Machine using Discriminated Unions
type FormWizardState = 
  | { status: 'personal-info'; data: { name: string; email: string; phone: string }; errors?: Record<string, string> }
  | { status: 'address'; data: { street: string; city: string; state: string; zip: string }; errors?: Record<string, string> }
  | { status: 'payment'; data: { cardNumber: string; expiryDate: string; cvv: string }; errors?: Record<string, string> }
  | { status: 'review'; data: PersonalInfo & Address & PaymentInfo }
  | { status: 'submitting'; data: PersonalInfo & Address & PaymentInfo; progress: number }
  | { status: 'success'; data: PersonalInfo & Address & PaymentInfo; confirmationId: string }
  | { status: 'error'; data: PersonalInfo & Address & PaymentInfo; error: string; retryCount: number };

type PersonalInfo = { name: string; email: string; phone: string };
type Address = { street: string; city: string; state: string; zip: string };
type PaymentInfo = { cardNumber: string; expiryDate: string; cvv: string };

type FormWizardAction =
  | { type: 'UPDATE_PERSONAL_INFO'; data: Partial<PersonalInfo> }
  | { type: 'PERSONAL_INFO_COMPLETE'; data: PersonalInfo }
  | { type: 'UPDATE_ADDRESS'; data: Partial<Address> }
  | { type: 'ADDRESS_COMPLETE'; data: Address }
  | { type: 'UPDATE_PAYMENT'; data: Partial<PaymentInfo> }
  | { type: 'PAYMENT_COMPLETE'; data: PaymentInfo }
  | { type: 'GO_BACK' }
  | { type: 'SUBMIT_FORM' }
  | { type: 'SUBMISSION_PROGRESS'; progress: number }
  | { type: 'SUBMISSION_SUCCESS'; confirmationId: string }
  | { type: 'SUBMISSION_ERROR'; error: string }
  | { type: 'RETRY_SUBMISSION' }
  | { type: 'RESET_FORM' };

// TODO: Implement form wizard reducer with discriminated union patterns
const formWizardReducer = (state: FormWizardState, action: FormWizardAction): FormWizardState => {
  switch (action.type) {
    case 'UPDATE_PERSONAL_INFO':
      if (state.status === 'personal-info') {
        return {
          ...state,
          data: { ...state.data, ...action.data },
          errors: undefined, // Clear errors on update
        };
      }
      return state;

    case 'PERSONAL_INFO_COMPLETE':
      if (state.status === 'personal-info') {
        // TODO: Validate personal info and transition to address
        const errors = validatePersonalInfo(action.data);
        if (Object.keys(errors).length > 0) {
          return { ...state, errors };
        }
        return {
          status: 'address',
          data: { street: '', city: '', state: '', zip: '' },
        };
      }
      return state;

    case 'UPDATE_ADDRESS':
      // TODO: Implement address update logic
      return state;

    case 'ADDRESS_COMPLETE':
      // TODO: Implement address completion logic
      return state;

    case 'UPDATE_PAYMENT':
      // TODO: Implement payment update logic
      return state;

    case 'PAYMENT_COMPLETE':
      // TODO: Implement payment completion logic
      return state;

    case 'GO_BACK':
      // TODO: Implement back navigation logic
      switch (state.status) {
        case 'address':
          return {
            status: 'personal-info',
            data: state.data, // Preserve data when going back
          };
        case 'payment':
          return {
            status: 'address',
            data: state.data,
          };
        case 'review':
          return {
            status: 'payment',
            data: state.data,
          };
        default:
          return state;
      }

    case 'SUBMIT_FORM':
      // TODO: Implement form submission logic
      return state;

    case 'SUBMISSION_PROGRESS':
      // TODO: Implement submission progress logic
      return state;

    case 'SUBMISSION_SUCCESS':
      // TODO: Implement success logic
      return state;

    case 'SUBMISSION_ERROR':
      // TODO: Implement error logic
      return state;

    case 'RETRY_SUBMISSION':
      // TODO: Implement retry logic
      return state;

    case 'RESET_FORM':
      return {
        status: 'personal-info',
        data: { name: '', email: '', phone: '' },
      };

    default:
      // Exhaustive check
      const _exhaustive: never = action;
      return state;
  }
};

// TODO: Define Game State Machine using Discriminated Unions
type GameState = 
  | { status: 'menu' }
  | { status: 'playing'; level: number; score: number; lives: number; playerPosition: { x: number; y: number }; enemies: Enemy[]; powerUps: PowerUp[] }
  | { status: 'paused'; level: number; score: number; lives: number; playerPosition: { x: number; y: number }; enemies: Enemy[]; powerUps: PowerUp[] }
  | { status: 'game-over'; finalScore: number; highScore: number; level: number }
  | { status: 'level-complete'; level: number; score: number; lives: number; bonus: number }
  | { status: 'victory'; finalScore: number; completionTime: number };

type Enemy = {
  id: string;
  type: 'basic' | 'fast' | 'boss';
  position: { x: number; y: number };
  health: number;
  direction: 'up' | 'down' | 'left' | 'right';
};

type PowerUp = {
  id: string;
  type: 'health' | 'speed' | 'weapon' | 'points';
  position: { x: number; y: number };
  duration?: number; // For temporary powerups
};

type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'MOVE_PLAYER'; direction: 'up' | 'down' | 'left' | 'right' }
  | { type: 'PLAYER_HIT'; damage: number }
  | { type: 'ENEMY_DEFEATED'; enemyId: string; points: number }
  | { type: 'POWER_UP_COLLECTED'; powerUpId: string }
  | { type: 'LEVEL_COMPLETE' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'GAME_OVER' }
  | { type: 'RESTART_GAME' }
  | { type: 'RETURN_TO_MENU' }
  | { type: 'TICK'; deltaTime: number }; // Game loop tick

// TODO: Implement game reducer
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'START_GAME':
      // TODO: Initialize game state
      return {
        status: 'playing',
        level: 1,
        score: 0,
        lives: 3,
        playerPosition: { x: 50, y: 50 },
        enemies: [],
        powerUps: [],
      };

    case 'PAUSE_GAME':
      // TODO: Pause game if playing
      return state;

    case 'RESUME_GAME':
      // TODO: Resume game if paused
      return state;

    case 'MOVE_PLAYER':
      // TODO: Move player if game is playing
      return state;

    case 'PLAYER_HIT':
      // TODO: Handle player taking damage
      return state;

    case 'ENEMY_DEFEATED':
      // TODO: Remove enemy and add score
      return state;

    case 'POWER_UP_COLLECTED':
      // TODO: Apply power up effects
      return state;

    case 'LEVEL_COMPLETE':
      // TODO: Transition to level complete state
      return state;

    case 'NEXT_LEVEL':
      // TODO: Start next level
      return state;

    case 'GAME_OVER':
      // TODO: Transition to game over
      return state;

    case 'RESTART_GAME':
      return gameReducer(state, { type: 'START_GAME' });

    case 'RETURN_TO_MENU':
      return { status: 'menu' };

    case 'TICK':
      // TODO: Handle game loop updates
      return state;

    default:
      const _exhaustive: never = action;
      return state;
  }
};

// TODO: Define Document Editor State Machine
type DocumentState = 
  | { status: 'empty' }
  | { status: 'editing'; content: string; cursor: number; selection?: { start: number; end: number } }
  | { status: 'saving'; content: string; progress: number }
  | { status: 'saved'; content: string; lastSaved: Date }
  | { status: 'error'; content: string; error: string; lastAttempt: Date };

type DocumentAction =
  | { type: 'START_EDITING' }
  | { type: 'INSERT_TEXT'; text: string; position: number }
  | { type: 'DELETE_TEXT'; start: number; end: number }
  | { type: 'SET_SELECTION'; start: number; end: number }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SAVE_DOCUMENT' }
  | { type: 'SAVE_PROGRESS'; progress: number }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_ERROR'; error: string }
  | { type: 'RETRY_SAVE' }
  | { type: 'CLEAR_DOCUMENT' };

// TODO: Implement document reducer
const documentReducer = (state: DocumentState, action: DocumentAction): DocumentState => {
  switch (action.type) {
    case 'START_EDITING':
      return {
        status: 'editing',
        content: '',
        cursor: 0,
      };

    case 'INSERT_TEXT':
      // TODO: Insert text at position
      return state;

    case 'DELETE_TEXT':
      // TODO: Delete text in range
      return state;

    case 'SET_SELECTION':
      // TODO: Set text selection
      return state;

    case 'CLEAR_SELECTION':
      // TODO: Clear selection
      return state;

    case 'SAVE_DOCUMENT':
      // TODO: Start saving process
      return state;

    case 'SAVE_PROGRESS':
      // TODO: Update save progress
      return state;

    case 'SAVE_SUCCESS':
      // TODO: Mark as saved
      return state;

    case 'SAVE_ERROR':
      // TODO: Handle save error
      return state;

    case 'RETRY_SAVE':
      // TODO: Retry saving
      return state;

    case 'CLEAR_DOCUMENT':
      return { status: 'empty' };

    default:
      const _exhaustive: never = action;
      return state;
  }
};

// TODO: Define Undo/Redo History Pattern using Discriminated Unions
type HistoryState<T> = {
  past: T[];
  present: T;
  future: T[];
  maxHistorySize: number;
};

type HistoryAction<T> = 
  | { type: 'EXECUTE'; newState: T }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_MAX_SIZE'; size: number };

// TODO: Implement generic history reducer
const createHistoryReducer = <T>() => (
  state: HistoryState<T>, 
  action: HistoryAction<T>
): HistoryState<T> => {
  switch (action.type) {
    case 'EXECUTE':
      // TODO: Add current state to past, set new state as present, clear future
      const newPast = [...state.past, state.present];
      if (newPast.length > state.maxHistorySize) {
        newPast.shift(); // Remove oldest entry
      }
      return {
        ...state,
        past: newPast,
        present: action.newState,
        future: [], // Clear future on new action
      };

    case 'UNDO':
      // TODO: Move to previous state
      if (state.past.length > 0) {
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, -1);
        return {
          ...state,
          past: newPast,
          present: previous,
          future: [state.present, ...state.future],
        };
      }
      return state;

    case 'REDO':
      // TODO: Move to next state
      if (state.future.length > 0) {
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        return {
          ...state,
          past: [...state.past, state.present],
          present: next,
          future: newFuture,
        };
      }
      return state;

    case 'CLEAR_HISTORY':
      return {
        ...state,
        past: [],
        future: [],
      };

    case 'SET_MAX_SIZE':
      const updatedPast = state.past.slice(-action.size);
      return {
        ...state,
        past: updatedPast,
        maxHistorySize: action.size,
      };

    default:
      const _exhaustive: never = action;
      return state;
  }
};

// TODO: Define Network Request State Machine
type NetworkState<T> = 
  | { status: 'idle' }
  | { status: 'loading'; requestId: string; startTime: Date; timeout?: number }
  | { status: 'success'; data: T; requestId: string; responseTime: number; cached?: boolean }
  | { status: 'error'; error: string; requestId: string; retryCount: number; retryable: boolean }
  | { status: 'timeout'; requestId: string; retryCount: number };

type NetworkAction<T> =
  | { type: 'FETCH_START'; requestId: string; timeout?: number }
  | { type: 'FETCH_SUCCESS'; data: T; requestId: string; responseTime: number; cached?: boolean }
  | { type: 'FETCH_ERROR'; error: string; requestId: string; retryable?: boolean }
  | { type: 'FETCH_TIMEOUT'; requestId: string }
  | { type: 'RETRY'; requestId: string }
  | { type: 'RESET' };

// TODO: Implement network request reducer
const createNetworkReducer = <T>() => (
  state: NetworkState<T>, 
  action: NetworkAction<T>
): NetworkState<T> => {
  switch (action.type) {
    case 'FETCH_START':
      return {
        status: 'loading',
        requestId: action.requestId,
        startTime: new Date(),
        timeout: action.timeout,
      };

    case 'FETCH_SUCCESS':
      // TODO: Only update if request IDs match
      if (state.status === 'loading' && state.requestId === action.requestId) {
        return {
          status: 'success',
          data: action.data,
          requestId: action.requestId,
          responseTime: action.responseTime,
          cached: action.cached,
        };
      }
      return state;

    case 'FETCH_ERROR':
      // TODO: Handle error state
      return state;

    case 'FETCH_TIMEOUT':
      // TODO: Handle timeout
      return state;

    case 'RETRY':
      // TODO: Retry request if in error/timeout state
      return state;

    case 'RESET':
      return { status: 'idle' };

    default:
      const _exhaustive: never = action;
      return state;
  }
};

// TODO: Create React components using these patterns

// Form Wizard Component
function FormWizard() {
  const [state, dispatch] = useReducer(formWizardReducer, {
    status: 'personal-info',
    data: { name: '', email: '', phone: '' },
  });

  const handlePersonalInfoUpdate = useCallback((data: Partial<PersonalInfo>) => {
    dispatch({ type: 'UPDATE_PERSONAL_INFO', data });
  }, []);

  const handleNext = useCallback(() => {
    switch (state.status) {
      case 'personal-info':
        dispatch({ type: 'PERSONAL_INFO_COMPLETE', data: state.data });
        break;
      case 'address':
        dispatch({ type: 'ADDRESS_COMPLETE', data: state.data });
        break;
      case 'payment':
        dispatch({ type: 'PAYMENT_COMPLETE', data: state.data });
        break;
    }
  }, [state]);

  const handleBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, []);

  // TODO: Implement form steps rendering based on discriminated union state
  return (
    <div>
      <h3>Form Wizard - Step: {state.status}</h3>
      
      {state.status === 'personal-info' && (
        <div>
          <input 
            placeholder="Name"
            value={state.data.name}
            onChange={(e) => handlePersonalInfoUpdate({ name: e.target.value })}
          />
          <input 
            placeholder="Email"
            value={state.data.email}
            onChange={(e) => handlePersonalInfoUpdate({ email: e.target.value })}
          />
          <input 
            placeholder="Phone"
            value={state.data.phone}
            onChange={(e) => handlePersonalInfoUpdate({ phone: e.target.value })}
          />
          {state.errors && Object.entries(state.errors).map(([field, error]) => (
            <div key={field} style={{ color: 'red' }}>{field}: {error}</div>
          ))}
          <button onClick={handleNext}>Next</button>
        </div>
      )}

      {/* TODO: Implement other form steps */}
      
      <div>
        <button onClick={handleBack} disabled={state.status === 'personal-info'}>
          Back
        </button>
        <button onClick={() => dispatch({ type: 'RESET_FORM' })}>
          Reset
        </button>
      </div>
    </div>
  );
}

// Document Editor Component with History
function DocumentEditor() {
  const [documentState, dispatchDocument] = useReducer(documentReducer, { status: 'empty' });
  const [historyState, dispatchHistory] = useReducer(
    createHistoryReducer<DocumentState>(), 
    {
      past: [],
      present: documentState,
      future: [],
      maxHistorySize: 50,
    }
  );

  const handleEdit = useCallback((action: DocumentAction) => {
    const newState = documentReducer(historyState.present, action);
    if (newState !== historyState.present) {
      dispatchHistory({ type: 'EXECUTE', newState });
    }
  }, [historyState.present]);

  const handleUndo = useCallback(() => {
    dispatchHistory({ type: 'UNDO' });
  }, []);

  const handleRedo = useCallback(() => {
    dispatchHistory({ type: 'REDO' });
  }, []);

  const canUndo = historyState.past.length > 0;
  const canRedo = historyState.future.length > 0;
  const currentDocument = historyState.present;

  return (
    <div>
      <h3>Document Editor</h3>
      
      <div>
        <button onClick={handleUndo} disabled={!canUndo}>
          Undo ({historyState.past.length})
        </button>
        <button onClick={handleRedo} disabled={!canRedo}>
          Redo ({historyState.future.length})
        </button>
        <button onClick={() => dispatchHistory({ type: 'CLEAR_HISTORY' })}>
          Clear History
        </button>
      </div>

      {currentDocument.status === 'empty' && (
        <div>
          <p>No document loaded</p>
          <button onClick={() => handleEdit({ type: 'START_EDITING' })}>
            Create New Document
          </button>
        </div>
      )}

      {currentDocument.status === 'editing' && (
        <div>
          <textarea
            value={currentDocument.content}
            onChange={(e) => {
              handleEdit({ 
                type: 'INSERT_TEXT', 
                text: e.target.value, 
                position: currentDocument.cursor 
              });
            }}
            placeholder="Start typing..."
            style={{ width: '100%', height: '200px' }}
          />
          <button onClick={() => handleEdit({ type: 'SAVE_DOCUMENT' })}>
            Save Document
          </button>
        </div>
      )}

      {/* TODO: Handle other document states */}
    </div>
  );
}

// Network Request Component
function NetworkRequestDemo() {
  const [networkState, dispatch] = useReducer(
    createNetworkReducer<{ message: string }>(), 
    { status: 'idle' }
  );

  const handleFetch = useCallback(() => {
    const requestId = 'req-' + Date.now();
    dispatch({ type: 'FETCH_START', requestId, timeout: 5000 });

    // Simulate network request
    setTimeout(() => {
      if (Math.random() > 0.3) {
        dispatch({ 
          type: 'FETCH_SUCCESS', 
          data: { message: 'Hello from server!' }, 
          requestId,
          responseTime: Math.random() * 1000 + 200
        });
      } else {
        dispatch({ 
          type: 'FETCH_ERROR', 
          error: 'Network error', 
          requestId,
          retryable: true 
        });
      }
    }, 1000 + Math.random() * 2000);
  }, []);

  const handleRetry = useCallback(() => {
    if (networkState.status === 'error') {
      dispatch({ type: 'RETRY', requestId: networkState.requestId });
      handleFetch();
    }
  }, [networkState, handleFetch]);

  return (
    <div>
      <h3>Network Request Demo</h3>
      
      <button onClick={handleFetch} disabled={networkState.status === 'loading'}>
        {networkState.status === 'loading' ? 'Loading...' : 'Fetch Data'}
      </button>

      {networkState.status === 'success' && (
        <div style={{ color: 'green' }}>
          Success: {networkState.data.message}
          <br />
          Response time: {networkState.responseTime.toFixed(0)}ms
          {networkState.cached && ' (cached)'}
        </div>
      )}

      {networkState.status === 'error' && (
        <div style={{ color: 'red' }}>
          Error: {networkState.error}
          <br />
          Retry count: {networkState.retryCount}
          {networkState.retryable && (
            <button onClick={handleRetry}>Retry</button>
          )}
        </div>
      )}

      <button onClick={() => dispatch({ type: 'RESET' })}>
        Reset
      </button>
    </div>
  );
}

// Main App Component
function App() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Discriminated Union State Management Patterns</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <FormWizard />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <DocumentEditor />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <NetworkRequestDemo />
        </div>
      </div>
    </div>
  );
}

// Helper functions
function validatePersonalInfo(data: PersonalInfo): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }
  
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!data.phone.trim()) {
    errors.phone = 'Phone is required';
  }
  
  return errors;
}

// Export components and utilities for testing
export {
  App,
  FormWizard,
  DocumentEditor,
  NetworkRequestDemo,
  formWizardReducer,
  gameReducer,
  documentReducer,
  createHistoryReducer,
  createNetworkReducer,
  type FormWizardState,
  type FormWizardAction,
  type GameState,
  type GameAction,
  type DocumentState,
  type DocumentAction,
  type HistoryState,
  type HistoryAction,
  type NetworkState,
  type NetworkAction,
  type PersonalInfo,
  type Address,
  type PaymentInfo,
  type Enemy,
  type PowerUp,
};