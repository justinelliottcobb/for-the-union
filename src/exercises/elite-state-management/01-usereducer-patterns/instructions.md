# useReducer with Discriminated Union Patterns

Master advanced state management by combining useReducer with discriminated unions for type-safe, scalable, and predictable state transitions.

## Learning Objectives

- Combine discriminated unions with useReducer for type-safe actions
- Design complex state machines with predictable transitions
- Implement async operations with discriminated union states
- Create reusable reducer patterns for different domains
- Handle error states and loading patterns elegantly
- Build undo/redo functionality with discriminated unions

## Prerequisites

- Mastery of discriminated unions (traffic lights, shapes exercises)
- Advanced React hooks knowledge (useState, useEffect, useContext)
- Understanding of reducer patterns and immutability
- TypeScript advanced types and conditional types

## Background

The combination of `useReducer` and discriminated unions creates one of the most powerful patterns in TypeScript React applications. This approach provides:

- **Type Safety**: Actions and state are strictly typed
- **Predictability**: State transitions are explicit and controlled
- **Scalability**: Complex state logic is organized and maintainable
- **Testability**: Reducers are pure functions easy to test

### The Power Pattern

```typescript
// Discriminated Union Actions
type Action = 
  | { type: 'LOADING'; payload?: { message: string } }
  | { type: 'SUCCESS'; payload: { data: User[] } }
  | { type: 'ERROR'; payload: { error: string } }
  | { type: 'RETRY' }
  | { type: 'RESET' };

// Discriminated Union State
type State = 
  | { status: 'idle' }
  | { status: 'loading'; message?: string }
  | { status: 'success'; data: User[]; timestamp: number }
  | { status: 'error'; error: string; retryCount: number };
```

## Instructions

You'll build increasingly complex state management systems:

1. **Async Data Fetcher**: Loading states with discriminated unions
2. **Shopping Cart**: Complex business logic with type-safe actions
3. **Form Wizard**: Multi-step form with validation states
4. **Task Manager**: CRUD operations with optimistic updates
5. **Undo/Redo System**: Time travel debugging implementation
6. **Real-time Chat**: WebSocket state management

## Essential Patterns

### Basic Reducer with Discriminated Unions
```typescript
type CounterState = 
  | { mode: 'normal'; count: number }
  | { mode: 'fast'; count: number; multiplier: number }
  | { mode: 'paused'; count: number; pausedAt: Date };

type CounterAction =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET_FAST_MODE'; multiplier: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' };

function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case 'INCREMENT':
      switch (state.mode) {
        case 'normal':
          return { ...state, count: state.count + 1 };
        case 'fast':
          return { ...state, count: state.count + state.multiplier };
        case 'paused':
          return state; // No change when paused
      }
      break;
    // ... other cases
  }
}
```

### Async State Machine
```typescript
type AsyncState<T, E = string> = 
  | { status: 'idle' }
  | { status: 'loading'; progress?: number }
  | { status: 'success'; data: T; lastFetch: Date }
  | { status: 'error'; error: E; retryCount: number };

type AsyncAction<T, E = string> =
  | { type: 'FETCH_START'; progress?: number }
  | { type: 'FETCH_PROGRESS'; progress: number }
  | { type: 'FETCH_SUCCESS'; data: T }
  | { type: 'FETCH_ERROR'; error: E }
  | { type: 'RETRY' }
  | { type: 'RESET' };
```

### Complex Business Logic
```typescript
type ShoppingCartState = {
  items: CartItem[];
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  discounts: Discount[];
  checkout: CheckoutState;
};

type CheckoutState =
  | { phase: 'cart' }
  | { phase: 'shipping'; address: Address | null }
  | { phase: 'payment'; paymentMethod: PaymentMethod | null }
  | { phase: 'processing'; orderId: string }
  | { phase: 'complete'; order: Order }
  | { phase: 'error'; error: string; previousPhase: CheckoutState['phase'] };
```

## Advanced Patterns

### State Machine Guards
```typescript
function canTransition(
  currentState: State, 
  action: Action
): boolean {
  switch (currentState.status) {
    case 'loading':
      // Can't start another load while loading
      return action.type !== 'FETCH_START';
    case 'error':
      // Can only retry or reset from error
      return ['RETRY', 'RESET'].includes(action.type);
    default:
      return true;
  }
}
```

### Middleware Pattern
```typescript
type Middleware<S, A> = (
  state: S,
  action: A,
  next: (action: A) => S
) => S;

const loggingMiddleware: Middleware<State, Action> = (state, action, next) => {
  console.group(`Action: ${action.type}`);
  console.log('Previous State:', state);
  const newState = next(action);
  console.log('New State:', newState);
  console.groupEnd();
  return newState;
};
```

### Time Travel / Undo Redo
```typescript
type TimeTravelState<T> = {
  past: T[];
  present: T;
  future: T[];
};

type TimeTravelAction<A> =
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'PRESENT'; action: A };

function timeTravelReducer<S, A>(
  state: TimeTravelState<S>,
  action: TimeTravelAction<A>,
  baseReducer: (state: S, action: A) => S
): TimeTravelState<S> {
  switch (action.type) {
    case 'UNDO':
      if (state.past.length === 0) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
      };
    
    case 'REDO':
      if (state.future.length === 0) return state;
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
      };
    
    case 'PRESENT':
      const newPresent = baseReducer(state.present, action.action);
      if (newPresent === state.present) return state;
      return {
        past: [...state.past, state.present],
        present: newPresent,
        future: [],
      };
  }
}
```

## Hints

1. Always define discriminated unions for both state and actions
2. Use exhaustive checking with `never` type for complete coverage
3. Keep reducers pure - no side effects or mutations
4. Use immer for complex state updates if needed
5. Implement state machine guards for valid transitions
6. Create action creators for better ergonomics

## Expected Behavior

When complete, you'll have mastered:

```typescript
// Type-safe async operations
const [state, dispatch] = useReducer(asyncReducer, { status: 'idle' });

// Complex business logic
const [cartState, cartDispatch] = useReducer(cartReducer, initialCartState);

// Time travel debugging
const [{ present, past, future }, timeTravelDispatch] = useReducer(
  (state, action) => timeTravelReducer(state, action, appReducer),
  { past: [], present: initialState, future: [] }
);

// Perfect TypeScript inference
dispatch({ type: 'FETCH_SUCCESS', data: users }); // ✅ Type-safe
dispatch({ type: 'FETCH_SUCCESS' }); // ❌ TypeScript error - missing data
```

**Estimated time:** 45 minutes  
**Difficulty:** 5/5