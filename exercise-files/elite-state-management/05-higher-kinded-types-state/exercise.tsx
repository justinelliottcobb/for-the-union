// Higher-Kinded Types for Advanced State Management
// Master higher-kinded types to build ultra-flexible, composable state management patterns

import React, { useReducer, useCallback, useMemo, useEffect } from 'react';

// Learning objectives:
// - Understand higher-kinded types (HKT) and their implementation in TypeScript
// - Build generic state containers that work with any data type
// - Create composable state management patterns using HKT
// - Implement functor, applicative, and monad patterns for state
// - Design effect systems for managing side effects with HKT
// - Build type-safe, reusable state abstractions

// Hints:
// 1. TypeScript doesn't have native HKT, but we can simulate them with branded types
// 2. Use module augmentation to extend HKT registry
// 3. Build abstractions that work across different container types
// 4. Implement functor laws: identity and composition
// 5. Create effect systems that compose cleanly
// 6. Design APIs that are both type-safe and ergonomic

// TODO: Define Higher-Kinded Type Infrastructure

// HKT Registry - This is where we register our type constructors
interface HKTRegistry {
  readonly State: unknown;
  readonly AsyncState: unknown;
  readonly Result: unknown;
  readonly IO: unknown;
  readonly Reader: unknown;
  readonly Writer: unknown;
  readonly Task: unknown;
}

// Higher-Kinded Type helper
type HKT<F extends keyof HKTRegistry, A,> = (HKTRegistry & {
  readonly [K in F]: (arg: A) => any;
})[F] extends (arg: any) => infer B ? B : never;

// Brand for nominal typing
declare const HKTBrand: unique symbol;
type Kind<F extends keyof HKTRegistry, A,> = HKT<F, A,> & {
  readonly [HKTBrand]: F;
};

// TODO: Define Functor typeclass
interface Functor<F extends keyof HKTRegistry> {
  readonly map: <A, B,>(fa: Kind<F, A,>, f: (a: A) => B) => Kind<F, B,>;
}

// TODO: Define Applicative typeclass  
interface Applicative<F extends keyof HKTRegistry> extends Functor<F,> {
  readonly of: <A,>(a: A) => Kind<F, A,>;
  readonly ap: <A, B,>(fab: Kind<F, (a: A) => B,>, fa: Kind<F, A,>) => Kind<F, B,>;
}

// TODO: Define Monad typeclass
interface Monad<F extends keyof HKTRegistry> extends Applicative<F,> {
  readonly flatMap: <A, B,>(fa: Kind<F, A,>, f: (a: A) => Kind<F, B,>) => Kind<F, B,>;
  readonly chain: <A, B,>(f: (a: A) => Kind<F, B,>) => (fa: Kind<F, A,>) => Kind<F, B,>;
}

// TODO: Define State Container with HKT
type StateContainer<S, A,> = {
  readonly tag: 'State';
  readonly runState: (initialState: S) => readonly [A, S];
};

// Augment HKT registry for State
declare module './exercise.tsx' {
  interface HKTRegistry {
    readonly State: StateContainer<any, any>;
  }
}

// Make State work with our HKT system
type State<S, A,> = Kind<'State', A,> & StateContainer<S, A,>;

// TODO: Create State constructor
const State = {
  of: <S, A,>(value: A): State<S, A,> => ({
    tag: 'State',
    runState: (state: S) => [value, state] as const,
    [HKTBrand]: 'State' as const,
  }),

  get: <S,>(): State<S, S> => ({
    tag: 'State',
    runState: (state: S) => [state, state] as const,
    [HKTBrand]: 'State' as const,
  }),

  put: <S,>(newState: S): State<S, void> => ({
    tag: 'State',
    runState: (_: S) => [undefined, newState] as const,
    [HKTBrand]: 'State' as const,
  }),

  modify: <S,>(f: (state: S) => S): State<S, void> => ({
    tag: 'State',
    runState: (state: S) => [undefined, f(state)] as const,
    [HKTBrand]: 'State' as const,
  }),

  runState: <S, A,>(state: State<S, A,>, initialState: S) => {
    return state.runState(initialState);
  },
};

// TODO: Implement Functor instance for State
const StateFunctor: Functor<'State'> = {
  map: <A, B,>(fa: State<any, A,>, f: (a: A) => B): State<any, B,> => ({
    tag: 'State',
    runState: (state) => {
      const [value, newState] = fa.runState(state);
      return [f(value), newState] as const;
    },
    [HKTBrand]: 'State' as const,
  }),
};

// TODO: Implement Monad instance for State
const StateMonad: Monad<'State'> = {
  ...StateFunctor,
  
  of: State.of,
  
  ap: <A, B,>(fab: State<any, (a: A) => B,>, fa: State<any, A,>): State<any, B,> => ({
    tag: 'State',
    runState: (state) => {
      const [f, state1] = fab.runState(state);
      const [value, state2] = fa.runState(state1);
      return [f(value), state2] as const;
    },
    [HKTBrand]: 'State' as const,
  }),
  
  flatMap: <A, B,>(fa: State<any, A,>, f: (a: A) => State<any, B,>): State<any, B,> => ({
    tag: 'State',
    runState: (state) => {
      const [value, newState] = fa.runState(state);
      return f(value).runState(newState);
    },
    [HKTBrand]: 'State' as const,
  }),
  
  chain: <A, B,>(f: (a: A) => State<any, B,>) => (fa: State<any, A,>): State<any, B,> =>
    StateMonad.flatMap(fa, f),
};

// TODO: Define AsyncState for handling async operations with HKT
type AsyncStateContainer<S, A,> = {
  readonly tag: 'AsyncState';
  readonly runAsyncState: (initialState: S) => Promise<readonly [A, S]>;
};

type AsyncState<S, A,> = Kind<'AsyncState', A,> & AsyncStateContainer<S, A,>;

// Augment registry
declare module './exercise.tsx' {
  interface HKTRegistry {
    readonly AsyncState: AsyncStateContainer<any, any>;
  }
}

const AsyncState = {
  of: <S, A,>(value: A): AsyncState<S, A,> => ({
    tag: 'AsyncState',
    runAsyncState: async (state: S) => [value, state] as const,
    [HKTBrand]: 'AsyncState' as const,
  }),

  fromState: <S, A,>(state: State<S, A,>): AsyncState<S, A,> => ({
    tag: 'AsyncState',
    runAsyncState: async (initialState: S) => state.runState(initialState),
    [HKTBrand]: 'AsyncState' as const,
  }),

  fromPromise: <S, A,>(promise: Promise<A,>): AsyncState<S, A,> => ({
    tag: 'AsyncState',
    runAsyncState: async (state: S) => [await promise, state] as const,
    [HKTBrand]: 'AsyncState' as const,
  }),

  get: <S,>(): AsyncState<S, S> => ({
    tag: 'AsyncState',
    runAsyncState: async (state: S) => [state, state] as const,
    [HKTBrand]: 'AsyncState' as const,
  }),

  put: <S,>(newState: S): AsyncState<S, void> => ({
    tag: 'AsyncState',
    runAsyncState: async (_: S) => [undefined, newState] as const,
    [HKTBrand]: 'AsyncState' as const,
  }),

  delay: <S,>(ms: number): AsyncState<S, void> => ({
    tag: 'AsyncState',
    runAsyncState: async (state: S) => {
      await new Promise(resolve => setTimeout(resolve, ms));
      return [undefined, state] as const;
    },
    [HKTBrand]: 'AsyncState' as const,
  }),

  runAsyncState: <S, A,>(asyncState: AsyncState<S, A,>, initialState: S) => {
    return asyncState.runAsyncState(initialState);
  },
};

// TODO: Implement AsyncState Monad
const AsyncStateMonad: Monad<'AsyncState'> = {
  map: <A, B,>(fa: AsyncState<any, A,>, f: (a: A) => B): AsyncState<any, B,> => ({
    tag: 'AsyncState',
    runAsyncState: async (state) => {
      const [value, newState] = await fa.runAsyncState(state);
      return [f(value), newState] as const;
    },
    [HKTBrand]: 'AsyncState' as const,
  }),

  of: AsyncState.of,

  ap: <A, B,>(fab: AsyncState<any, (a: A) => B,>, fa: AsyncState<any, A,>): AsyncState<any, B,> => ({
    tag: 'AsyncState',
    runAsyncState: async (state) => {
      const [f, state1] = await fab.runAsyncState(state);
      const [value, state2] = await fa.runAsyncState(state1);
      return [f(value), state2] as const;
    },
    [HKTBrand]: 'AsyncState' as const,
  }),

  flatMap: <A, B,>(fa: AsyncState<any, A,>, f: (a: A) => AsyncState<any, B,>): AsyncState<any, B,> => ({
    tag: 'AsyncState',
    runAsyncState: async (state) => {
      const [value, newState] = await fa.runAsyncState(state);
      return f(value).runAsyncState(newState);
    },
    [HKTBrand]: 'AsyncState' as const,
  }),

  chain: <A, B,>(f: (a: A) => AsyncState<any, B,>) => (fa: AsyncState<any, A,>): AsyncState<any, B,> =>
    AsyncStateMonad.flatMap(fa, f),
};

// TODO: Define Result type for error handling
type ResultContainer<E, A,> = 
  | { readonly tag: 'Success'; readonly value: A }
  | { readonly tag: 'Failure'; readonly error: E };

type Result<E, A,> = Kind<'Result', A,> & ResultContainer<E, A,>;

// Augment registry
declare module './exercise.tsx' {
  interface HKTRegistry {
    readonly Result: ResultContainer<any, any>;
  }
}

const Result = {
  success: <E, A,>(value: A): Result<E, A,> => ({
    tag: 'Success',
    value,
    [HKTBrand]: 'Result' as const,
  }),

  failure: <E, A,>(error: E): Result<E, A,> => ({
    tag: 'Failure',
    error,
    [HKTBrand]: 'Result' as const,
  }),

  fromNullable: <E, A,>(value: A | null | undefined, error: E): Result<E, A,> =>
    value != null ? Result.success(value) : Result.failure(error),

  tryCatch: <E, A,>(f: () => A, onError: (error: unknown) => E): Result<E, A,> => {
    try {
      return Result.success(f());
    } catch (error) {
      return Result.failure(onError(error));
    }
  },

  isSuccess: <E, A,>(result: Result<E, A,>): result is Result<E, A,> & { tag: 'Success' } =>
    result.tag === 'Success',

  isFailure: <E, A,>(result: Result<E, A,>): result is Result<E, A,> & { tag: 'Failure' } =>
    result.tag === 'Failure',
};

// TODO: Implement Result Monad
const ResultMonad: Monad<'Result'> = {
  map: <A, B,>(fa: Result<any, A,>, f: (a: A) => B): Result<any, B,> =>
    fa.tag === 'Success' 
      ? Result.success(f(fa.value))
      : fa as any,

  of: Result.success,

  ap: <A, B,>(fab: Result<any, (a: A) => B,>, fa: Result<any, A,>): Result<any, B,> =>
    fab.tag === 'Success' && fa.tag === 'Success'
      ? Result.success(fab.value(fa.value))
      : fab.tag === 'Failure' ? fab as any : fa as any,

  flatMap: <A, B,>(fa: Result<any, A,>, f: (a: A) => Result<any, B,>): Result<any, B,> =>
    fa.tag === 'Success' ? f(fa.value) : fa as any,

  chain: <A, B,>(f: (a: A) => Result<any, B,>) => (fa: Result<any, A,>): Result<any, B,> =>
    ResultMonad.flatMap(fa, f),
};

// TODO: Define IO type for managing side effects
type IOContainer<A,> = {
  readonly tag: 'IO';
  readonly unsafeRun: () => A;
};

type IO<A,> = Kind<'IO', A,> & IOContainer<A,>;

// Augment registry
declare module './exercise.tsx' {
  interface HKTRegistry {
    readonly IO: IOContainer<any>;
  }
}

const IO = {
  of: <A,>(value: A): IO<A,> => ({
    tag: 'IO',
    unsafeRun: () => value,
    [HKTBrand]: 'IO' as const,
  }),

  lazy: <A,>(thunk: () => A): IO<A,> => ({
    tag: 'IO',
    unsafeRun: thunk,
    [HKTBrand]: 'IO' as const,
  }),

  // Common IO operations
  log: (message: string): IO<void> => IO.lazy(() => console.log(message)),
  
  now: (): IO<Date> => IO.lazy(() => new Date()),
  
  random: (): IO<number> => IO.lazy(() => Math.random()),
  
  localStorage: {
    getItem: (key: string): IO<string | null> => 
      IO.lazy(() => localStorage.getItem(key)),
    
    setItem: (key: string, value: string): IO<void> => 
      IO.lazy(() => localStorage.setItem(key, value)),
    
    removeItem: (key: string): IO<void> => 
      IO.lazy(() => localStorage.removeItem(key)),
  },

  unsafeRun: <A,>(io: IO<A,>): A => io.unsafeRun(),
};

// TODO: Implement IO Monad
const IOMonad: Monad<'IO'> = {
  map: <A, B,>(fa: IO<A,>, f: (a: A) => B): IO<B,> => ({
    tag: 'IO',
    unsafeRun: () => f(fa.unsafeRun()),
    [HKTBrand]: 'IO' as const,
  }),

  of: IO.of,

  ap: <A, B,>(fab: IO<(a: A) => B,>, fa: IO<A,>): IO<B,> => ({
    tag: 'IO',
    unsafeRun: () => fab.unsafeRun()(fa.unsafeRun()),
    [HKTBrand]: 'IO' as const,
  }),

  flatMap: <A, B,>(fa: IO<A,>, f: (a: A) => IO<B,>): IO<B,> => ({
    tag: 'IO',
    unsafeRun: () => f(fa.unsafeRun()).unsafeRun(),
    [HKTBrand]: 'IO' as const,
  }),

  chain: <A, B,>(f: (a: A) => IO<B,>) => (fa: IO<A,>): IO<B,> =>
    IOMonad.flatMap(fa, f),
};

// TODO: Create higher-order combinators that work with any Functor/Monad
const Combinators = {
  // Lift a regular function to work in any Functor context
  lift: <F extends keyof HKTRegistry,>(F: Functor<F,>) => 
    <A, B,>(f: (a: A) => B) => (fa: Kind<F, A,>): Kind<F, B,> =>
      F.map(fa, f),

  // Apply a function in a context to a value in a context
  liftA2: <F extends keyof HKTRegistry,>(F: Applicative<F,>) => 
    <A, B, C,>(f: (a: A, b: B) => C) => (fa: Kind<F, A,>, fb: Kind<F, B,>): Kind<F, C,> =>
      F.ap(F.map(fa, (a: A) => (b: B) => f(a, b)), fb),

  // Sequence a list of computations
  sequence: <F extends keyof HKTRegistry,>(F: Applicative<F,>) => 
    <A,>(fas: Array<Kind<F, A,>>): Kind<F, Array<A,>> =>
      fas.reduce(
        (acc, fa) => Combinators.liftA2(F)((as: A[], a: A) => [...as, a])(acc, fa),
        F.of([] as A[])
      ),

  // Map and then flatten
  bind: <F extends keyof HKTRegistry,>(M: Monad<F>) => 
    <A, B,>(f: (a: A) => Kind<F, B>) => (fa: Kind<F, A>): Kind<F, B> =>
      M.flatMap(fa, f),

  // Compose monadic functions
  compose: <F extends keyof HKTRegistry,>(M: Monad<F>) => 
    <A, B, C,>(f: (a: A) => Kind<F, B>, g: (b: B) => Kind<F, C>) => 
    (a: A): Kind<F, C> =>
      M.flatMap(f(a), g),
};

// TODO: Create practical state management examples using HKT

// Counter State with HKT
type CounterState = {
  count: number;
  history: number[];
  maxHistory: number;
};

const CounterActions = {
  // Pure state operations
  increment: (): State<CounterState, number> =>
    StateMonad.flatMap(State.get<CounterState>, (state) =>
      StateMonad.flatMap(State.put({
        ...state,
        count: state.count + 1,
        history: [...state.history, state.count].slice(-state.maxHistory),
      }), () => State.of(state.count + 1))
    ),

  decrement: (): State<CounterState, number> =>
    StateMonad.flatMap(State.get<CounterState>(), state =>
      StateMonad.flatMap(State.put({
        ...state,
        count: state.count - 1,
        history: [...state.history, state.count].slice(-state.maxHistory),
      }), () => State.of(state.count - 1))
    ),

  reset: (): State<CounterState, void> =>
    State.modify(state => ({ ...state, count: 0 })),

  setMaxHistory: (max: number): State<CounterState, void> =>
    State.modify(state => ({
      ...state,
      maxHistory: max,
      history: state.history.slice(-max),
    })),

  // Async operations
  incrementAsync: (delay: number = 1000): AsyncState<CounterState, number> =>
    AsyncStateMonad.flatMap(AsyncState.delay(delay), () =>
      AsyncState.fromState(CounterActions.increment())
    ),

  persistCount: (): AsyncState<CounterState, Result<string, void>> =>
    AsyncStateMonad.flatMap(AsyncState.get<CounterState>(), state =>
      AsyncState.fromPromise(
        new Promise<Result<string, void>>(resolve => {
          try {
            localStorage.setItem('counter', state.count.toString());
            resolve(Result.success(undefined));
          } catch (error) {
            resolve(Result.failure('Failed to persist count'));
          }
        })
      )
    ),

  loadCount: (): AsyncState<CounterState, Result<string, number>> =>
    AsyncState.fromPromise(
      new Promise<Result<string, number>>(resolve => {
        try {
          const saved = localStorage.getItem('counter');
          if (saved !== null) {
            const count = parseInt(saved, 10);
            resolve(isNaN(count) ? Result.failure('Invalid saved count') : Result.success(count));
          } else {
            resolve(Result.failure('No saved count found'));
          }
        } catch (error) {
          resolve(Result.failure('Failed to load count'));
        }
      })
    ),
};

// TODO: Create React hooks that use HKT-based state
function useHKTState<S, A,>(
  computation: State<S, A,>, 
  initialState: S
): [A, S, (newComputation: State<S, any>) => void] {
  const [state, setState] = React.useState(initialState);
  const [value, setValue] = React.useState(() => {
    const [val] = State.runState(computation, initialState);
    return val;
  });

  const runComputation = useCallback((comp: State<S, any>) => {
    const [newValue, newState] = State.runState(comp, state);
    setValue(newValue);
    setState(newState);
  }, [state]);

  return [value, state, runComputation];
}

function useAsyncHKTState<S, A,>(
  computation: AsyncState<S, A,>,
  initialState: S
): [A | null, S, boolean, string | null, (newComputation: AsyncState<S, any>) => void] {
  const [state, setState] = React.useState(initialState);
  const [value, setValue] = React.useState<A | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const runAsyncComputation = useCallback(async (comp: AsyncState<S, any>) => {
    setLoading(true);
    setError(null);
    try {
      const [newValue, newState] = await AsyncState.runAsyncState(comp, state);
      setValue(newValue);
      setState(newState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [state]);

  return [value, state, loading, error, runAsyncComputation];
}

// TODO: Create React components using HKT-based state

// Counter Component using HKT State
function HKTCounter() {
  const initialState: CounterState = {
    count: 0,
    history: [],
    maxHistory: 5,
  };

  const [count, state, runState] = useHKTState(
    State.of(0), 
    initialState
  );

  const [asyncResult, asyncState, loading, error, runAsync] = useAsyncHKTState(
    AsyncState.of(null),
    initialState
  );

  const handleIncrement = () => {
    runState(CounterActions.increment());
  };

  const handleDecrement = () => {
    runState(CounterActions.decrement());
  };

  const handleReset = () => {
    runState(CounterActions.reset());
  };

  const handleIncrementAsync = () => {
    runAsync(CounterActions.incrementAsync(500));
  };

  const handleSave = () => {
    runAsync(CounterActions.persistCount());
  };

  const handleLoad = () => {
    runAsync(
      AsyncStateMonad.flatMap(CounterActions.loadCount(), result => {
        if (Result.isSuccess(result)) {
          return AsyncState.fromState(
            State.modify<CounterState>,(s => ({ ...s, count: result.value }))
          );
        }
        return AsyncState.of(result);
      })
    );
  };

  return (
    <div>
      <h3>HKT Counter</h3>
      
      <div>
        <p>Count: {state.count}</p>
        <p>History: [{state.history.join(', ')}]</p>
      </div>

      <div>
        <button onClick={handleIncrement}>Increment</button>
        <button onClick={handleDecrement}>Decrement</button>
        <button onClick={handleReset}>Reset</button>
      </div>

      <div>
        <button onClick={handleIncrementAsync} disabled={loading}>
          {loading ? 'Incrementing...' : 'Async Increment'}
        </button>
      </div>

      <div>
        <button onClick={handleSave} disabled={loading}>Save</button>
        <button onClick={handleLoad} disabled={loading}>Load</button>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>
    </div>
  );
}

// Form Validation using Result HKT
type FormData = {
  name: string;
  email: string;
  age: string;
};

const FormValidation = {
  validateName: (name: string): Result<string, string> =>
    name.trim().length >= 2 
      ? Result.success(name.trim())
      : Result.failure('Name must be at least 2 characters'),

  validateEmail: (email: string): Result<string, string> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email)
      ? Result.success(email)
      : Result.failure('Invalid email format');
  },

  validateAge: (age: string): Result<string, number> => {
    const ageNum = parseInt(age, 10);
    return !isNaN(ageNum) && ageNum >= 0 && ageNum <= 120
      ? Result.success(ageNum)
      : Result.failure('Age must be a number between 0 and 120');
  },

  validateForm: (form: FormData): Result<string[], { name: string; email: string; age: number }> => {
    const nameResult = FormValidation.validateName(form.name);
    const emailResult = FormValidation.validateEmail(form.email);
    const ageResult = FormValidation.validateAge(form.age);

    // Collect all errors
    const errors: string[] = [];
    if (Result.isFailure(nameResult)) errors.push(nameResult.error);
    if (Result.isFailure(emailResult)) errors.push(emailResult.error);
    if (Result.isFailure(ageResult)) errors.push(ageResult.error);

    if (errors.length > 0) {
      return Result.failure(errors);
    }

    // All validations passed
    return Result.success({
      name: nameResult.value,
      email: emailResult.value,
      age: ageResult.value,
    });
  },
};

// Form Component using Result HKT
function HKTForm() {
  const [formData, setFormData] = React.useState<FormData>({
    name: '',
    email: '',
    age: '',
  });

  const [validationResult, setValidationResult] = React.useState<
    Result<string[], { name: string; email: string; age: number }> | null
  >(null);

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    setValidationResult(null); // Clear validation on input change
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = FormValidation.validateForm(formData);
    setValidationResult(result);
  };

  return (
    <div>
      <h3>HKT Form Validation</h3>
      
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={handleInputChange('name')}
          />
        </div>
        
        <div>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange('email')}
          />
        </div>
        
        <div>
          <input
            type="number"
            placeholder="Age"
            value={formData.age}
            onChange={handleInputChange('age')}
          />
        </div>

        <button type="submit">Validate & Submit</button>
      </form>

      {validationResult && (
        <div style={{ marginTop: '1rem' }}>
          {Result.isSuccess(validationResult) ? (
            <div style={{ color: 'green' }}>
              <h4>✅ Form is valid!</h4>
              <pre>{JSON.stringify(validationResult.value, null, 2)}</pre>
            </div>
          ) : (
            <div style={{ color: 'red' }}>
              <h4>❌ Validation errors:</h4>
              <ul>
                {validationResult.error.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main App Component
function App() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Higher-Kinded Types for State Management</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <HKTCounter />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <HKTForm />
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>HKT Concepts Demonstrated:</h3>
        <ul>
          <li><strong>State Monad:</strong> Composable state transformations</li>
          <li><strong>AsyncState Monad:</strong> Async operations with state</li>
          <li><strong>Result Monad:</strong> Error handling without exceptions</li>
          <li><strong>IO Monad:</strong> Side effect management</li>
          <li><strong>Functor/Applicative/Monad:</strong> Type class patterns</li>
          <li><strong>HKT Registry:</strong> Type-safe higher-kinded types in TypeScript</li>
        </ul>
      </div>
    </div>
  );
}

// Export everything for testing
export {
  App,
  HKTCounter,
  HKTForm,
  State,
  AsyncState,
  Result,
  IO,
  StateFunctor,
  StateMonad,
  AsyncStateMonad,
  ResultMonad,
  IOMonad,
  Combinators,
  CounterActions,
  FormValidation,
  useHKTState,
  useAsyncHKTState,
  type HKT,
  type Kind,
  type Functor,
  type Applicative,
  type Monad,
  type StateContainer,
  type AsyncStateContainer,
  type ResultContainer,
  type IOContainer,
  type CounterState,
  type FormData,
};