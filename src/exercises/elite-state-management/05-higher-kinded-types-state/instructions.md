# Higher-Kinded Types for State Management

Apply higher-kinded types and functional programming patterns to state management, creating abstract, composable, and mathematically sound state operations.

## Learning Objectives

- Apply higher-kinded types to state management patterns
- Implement Effect and IO monads for state operations
- Create composable state transformations
- Build type-safe state machines with HKTs
- Design algebraic effect systems
- Implement lenses and optics for state updates

## Prerequisites

- Mastery of all previous state management exercises
- Deep understanding of higher-kinded types from Advanced TypeScript Patterns
- Knowledge of functional programming concepts (Functor, Monad, etc.)
- Category theory foundations

## Background

Higher-kinded types represent the pinnacle of type-safe, composable state management. When applied to state, they provide:

- **Mathematical Correctness**: State operations follow proven mathematical laws
- **Composability**: Complex state operations built from simple, composable parts
- **Type Safety**: Impossible to create invalid state transformations
- **Abstraction**: Generic patterns that work across different state containers

### The HKT State Management Pattern

```typescript
// Higher-kinded type infrastructure for state
interface StateHKT extends HKT2 {
  readonly _URI: 'State';
  readonly _A: unknown;
  readonly _B: unknown;
}

interface State<S, A> extends Kind2<StateHKT, S, A> {
  runState: (state: S) => [A, S];
}

// Functor instance for State
const StateFunctor: Functor2<StateHKT> = {
  map: <S, A, B>(fa: State<S, A>, f: (a: A) => B): State<S, B> => ({
    runState: (s: S) => {
      const [a, s2] = fa.runState(s);
      return [f(a), s2];
    },
  }),
};

// Monad instance for State
const StateMonad: Monad2<StateHKT> = {
  ...StateFunctor,
  of: <S, A>(a: A): State<S, A> => ({
    runState: (s: S) => [a, s],
  }),
  chain: <S, A, B>(fa: State<S, A>, f: (a: A) => State<S, B>): State<S, B> => ({
    runState: (s: S) => {
      const [a, s2] = fa.runState(s);
      return f(a).runState(s2);
    },
  }),
};
```

## Instructions

You'll build the most advanced state management system possible:

1. **Effect System**: Model all side effects as pure data structures
2. **State Monad**: Compose stateful computations mathematically
3. **Lens System**: Focused updates on deeply nested state
4. **Free Monad DSL**: Domain-specific languages for state operations
5. **Algebraic Effects**: Handler-based effect systems
6. **Observable State**: Reactive state with functional composition

## Essential Patterns

### Effect Monad for State Operations

```typescript
// Effect monad for capturing state operations
interface EffectHKT extends HKT {
  readonly _URI: 'Effect';
  readonly _A: unknown;
}

interface Effect<A> extends Kind<EffectHKT, A> {
  run: () => Promise<A>;
}

// Effect constructors
const Effect = {
  of: <A>(value: A): Effect<A> => ({
    run: () => Promise.resolve(value),
  }),
  
  fromPromise: <A>(promise: Promise<A>): Effect<A> => ({
    run: () => promise,
  }),
  
  fromThunk: <A>(thunk: () => A): Effect<A> => ({
    run: () => Promise.resolve(thunk()),
  }),
  
  delay: <A>(ms: number, value: A): Effect<A> => ({
    run: () => new Promise(resolve => setTimeout(() => resolve(value), ms)),
  }),
};

// Functor instance
const EffectFunctor: Functor1<EffectHKT> = {
  map: <A, B>(fa: Effect<A>, f: (a: A) => B): Effect<B> => ({
    run: async () => f(await fa.run()),
  }),
};

// Monad instance
const EffectMonad: Monad1<EffectHKT> = {
  ...EffectFunctor,
  of: Effect.of,
  chain: <A, B>(fa: Effect<A>, f: (a: A) => Effect<B>): Effect<B> => ({
    run: async () => {
      const a = await fa.run();
      return f(a).run();
    },
  }),
};

// Usage in state management
interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
}

const fetchUsersEffect = (api: ApiClient): Effect<User[]> =>
  Effect.fromPromise(api.getUsers());

const updateUsersState = (users: User[]): State<UserState, void> => ({
  runState: (state) => [undefined, { ...state, users, loading: false, error: null }],
});

const loadUsers = (api: ApiClient): State<UserState, Effect<void>> =>
  pipe(
    get<UserState>(),
    chain(state => 
      of(pipe(
        fetchUsersEffect(api),
        EffectMonad.chain(users => Effect.fromThunk(() => {
          // This would trigger a state update in practice
          updateUsersState(users).runState(state);
        }))
      ))
    )
  );
```

### Lens System for State Updates

```typescript
// Lens implementation with HKT support
interface Lens<S, A> {
  get: (s: S) => A;
  set: (a: A) => (s: S) => S;
}

const Lens = {
  fromProp: <S, K extends keyof S>(key: K): Lens<S, S[K]> => ({
    get: (s) => s[key],
    set: (value) => (s) => ({ ...s, [key]: value }),
  }),
  
  compose: <A, B, C>(ab: Lens<A, B>, bc: Lens<B, C>): Lens<A, C> => ({
    get: (a) => bc.get(ab.get(a)),
    set: (c) => (a) => ab.set(bc.set(c)(ab.get(a)))(a),
  }),
  
  over: <S, A>(lens: Lens<S, A>, f: (a: A) => A): (s: S) => S => 
    (s) => lens.set(f(lens.get(s)))(s),
};

// Lens-based state updates
interface AppState {
  user: UserState;
  posts: PostState;
  ui: UIState;
}

const userLens = Lens.fromProp<AppState, 'user'>('user');
const usersLens = Lens.fromProp<UserState, 'users'>('users');
const userUsersLens = Lens.compose(userLens, usersLens);

// Update nested state with lenses
const addUser = (newUser: User): State<AppState, void> => ({
  runState: (state) => {
    const updatedState = Lens.over(userUsersLens, users => [...users, newUser])(state);
    return [undefined, updatedState];
  },
});

// Lens utilities for React hooks
function useLens<S, A>(
  state: S,
  setState: (s: S) => void,
  lens: Lens<S, A>
): [A, (a: A) => void] {
  const value = lens.get(state);
  const setValue = (newValue: A) => {
    setState(lens.set(newValue)(state));
  };
  return [value, setValue];
}
```

### Free Monad DSL for State Operations

```typescript
// Free monad for state operations DSL
interface FreeHKT extends HKT2 {
  readonly _URI: 'Free';
  readonly _F: unknown;
  readonly _A: unknown;
}

type Free<F extends HKT, A> = 
  | { tag: 'Pure'; value: A }
  | { tag: 'Impure'; fa: Kind<F, Free<F, A>> };

// State operation DSL
interface StateOpHKT extends HKT {
  readonly _URI: 'StateOp';
  readonly _A: unknown;
}

type StateOp<A> = 
  | { tag: 'Get'; next: (state: any) => A }
  | { tag: 'Put'; state: any; next: A }
  | { tag: 'Modify'; f: (state: any) => any; next: A };

// Free monad constructors
const Free = {
  pure: <F extends HKT, A>(value: A): Free<F, A> => ({
    tag: 'Pure',
    value,
  }),
  
  liftF: <F extends HKT, A>(fa: Kind<F, A>): Free<F, A> => ({
    tag: 'Impure',
    fa: pipe(
      fa,
      map(a => Free.pure<F, A>(a))
    ) as Kind<F, Free<F, A>>,
  }),
};

// State operation constructors
const StateOps = {
  get: <S>(): Free<StateOpHKT, S> =>
    Free.liftF<StateOpHKT, S>({
      tag: 'Get',
      next: (state: S) => state,
    } as StateOp<S>),
  
  put: <S>(state: S): Free<StateOpHKT, void> =>
    Free.liftF<StateOpHKT, void>({
      tag: 'Put',
      state,
      next: undefined,
    } as StateOp<void>),
  
  modify: <S>(f: (s: S) => S): Free<StateOpHKT, void> =>
    Free.liftF<StateOpHKT, void>({
      tag: 'Modify',
      f,
      next: undefined,
    } as StateOp<void>),
};

// Interpreter for state operations
function interpretState<S, A>(program: Free<StateOpHKT, A>, initialState: S): [A, S] {
  let currentState = initialState;
  
  function run(free: Free<StateOpHKT, A>): A {
    switch (free.tag) {
      case 'Pure':
        return free.value;
        
      case 'Impure':
        const op = free.fa as StateOp<Free<StateOpHKT, A>>;
        switch (op.tag) {
          case 'Get':
            return run(op.next(currentState));
            
          case 'Put':
            currentState = op.state;
            return run(op.next);
            
          case 'Modify':
            currentState = op.f(currentState);
            return run(op.next);
        }
    }
  }
  
  const result = run(program);
  return [result, currentState];
}

// Example DSL program
const userProgram = pipe(
  StateOps.get<UserState>(),
  chain(state => 
    state.users.length === 0
      ? StateOps.put({ ...state, loading: true })
      : Free.pure(undefined)
  ),
  chain(() => StateOps.modify<UserState>(state => ({
    ...state,
    lastAccessed: new Date(),
  })))
);
```

### Algebraic Effects System

```typescript
// Effect handlers system
interface EffectHandler<E, A, R> {
  effect: E;
  handler: (effect: E) => (resume: (a: A) => R) => R;
}

interface Effectful<E, A> {
  effects: E[];
  computation: (perform: <B>(effect: E) => B) => A;
}

// State effect
interface StateEffect<S> {
  tag: 'StateEffect';
  operation: 'get' | 'set' | 'modify';
  value?: S | ((s: S) => S);
}

// State effect handler
function handleState<S>(initialState: S) {
  return <A>(effectful: Effectful<StateEffect<S>, A>): [A, S] => {
    let currentState = initialState;
    
    const perform = <B>(effect: StateEffect<S>): B => {
      switch (effect.operation) {
        case 'get':
          return currentState as unknown as B;
          
        case 'set':
          currentState = effect.value as S;
          return undefined as unknown as B;
          
        case 'modify':
          currentState = (effect.value as (s: S) => S)(currentState);
          return undefined as unknown as B;
          
        default:
          throw new Error(`Unknown state operation: ${(effect as any).operation}`);
      }
    };
    
    const result = effectful.computation(perform);
    return [result, currentState];
  };
}

// Example usage
const stateProgram: Effectful<StateEffect<number>, number> = {
  effects: [{ tag: 'StateEffect', operation: 'get' }],
  computation: (perform) => {
    const current = perform({ tag: 'StateEffect', operation: 'get' });
    perform({ tag: 'StateEffect', operation: 'set', value: current + 1 });
    return current;
  },
};

const [result, finalState] = handleState(0)(stateProgram);
```

## Advanced Patterns

### Observable State with Functional Composition

```typescript
// Observable state monad
interface Observable<A> {
  subscribe: (observer: (value: A) => void) => () => void;
}

const Observable = {
  of: <A>(value: A): Observable<A> => ({
    subscribe: (observer) => {
      observer(value);
      return () => {};
    },
  }),
  
  map: <A, B>(fa: Observable<A>, f: (a: A) => B): Observable<B> => ({
    subscribe: (observer) => fa.subscribe(a => observer(f(a))),
  }),
  
  chain: <A, B>(fa: Observable<A>, f: (a: A) => Observable<B>): Observable<B> => ({
    subscribe: (observer) => {
      let unsubscribe: (() => void) | null = null;
      
      const outerUnsubscribe = fa.subscribe(a => {
        if (unsubscribe) unsubscribe();
        unsubscribe = f(a).subscribe(observer);
      });
      
      return () => {
        outerUnsubscribe();
        if (unsubscribe) unsubscribe();
      };
    },
  }),
};

// Reactive state management
interface ReactiveState<S> {
  state$: Observable<S>;
  dispatch: (action: any) => void;
}

function createReactiveState<S, A>(
  initialState: S,
  reducer: (state: S, action: A) => S
): ReactiveState<S> {
  let currentState = initialState;
  const observers: ((state: S) => void)[] = [];
  
  const state$: Observable<S> = {
    subscribe: (observer) => {
      observers.push(observer);
      observer(currentState);
      return () => {
        const index = observers.indexOf(observer);
        if (index !== -1) observers.splice(index, 1);
      };
    },
  };
  
  const dispatch = (action: A) => {
    const newState = reducer(currentState, action);
    if (newState !== currentState) {
      currentState = newState;
      observers.forEach(observer => observer(currentState));
    }
  };
  
  return { state$, dispatch };
}
```

## Hints

1. Start with simple Effect monads for async operations
2. Use HKTs to abstract over different state containers
3. Implement lenses for focused state updates
4. Consider using free monads for complex operations
5. Build composable validation with applicative functors
6. Use phantom types for state machine type safety

## Expected Behavior

When complete, you'll have mastered:

```typescript
// Composable state operations
const program = pipe(
  StateOps.get<UserState>(),
  chain(state => 
    pipe(
      Effect.fromPromise(fetchUsers()),
      EffectMonad.map(users => StateOps.put({ ...state, users }))
    )
  )
);

// Lens-based updates
const [userName, setUserName] = useLens(
  appState,
  setAppState,
  Lens.compose(userLens, nameLens)
);

// Free monad DSL
const userFlow = pipe(
  loadUsers,
  chain(() => validateUsers),
  chain(() => saveUsers)
);

// Algebraic effects
const [result, finalState] = handleState(initialState)(stateProgram);
```

**Estimated time:** 60 minutes  
**Difficulty:** 5/5