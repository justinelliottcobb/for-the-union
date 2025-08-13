// Solution: Higher-Kinded Types for State Management
// Complete implementation of HKT patterns applied to state management

import React, { useState, useCallback, useEffect, useReducer } from 'react';

// Higher-kinded type infrastructure
interface HKT {
  readonly _URI: unknown;
  readonly _A: unknown;
}

interface HKT2 {
  readonly _URI: unknown;
  readonly _A: unknown;
  readonly _B: unknown;
}

type Kind<F extends HKT, A,> = F extends { readonly _A: any }
  ? (F & { readonly _A: A })
  : never;

type Kind2<F extends HKT2, A, B,> = F extends { readonly _A: any; readonly _B: any }
  ? (F & { readonly _A: A; readonly _B: B })
  : never;

// Effect monad implementation
interface EffectHKT extends HKT {
  readonly _URI: 'Effect';
}

interface Effect<A,> extends Kind<EffectHKT, A,> {
  run: () => Promise<A,>;
}

const Effect = {
  of: <A,>(value: A): Effect<A,> => ({
    _URI: 'Effect' as const,
    _A: undefined as any,
    run: () => Promise.resolve(value),
  }),
  
  map: <A, B,>(fa: Effect<A,>, f: (a: A) => B): Effect<B,> => ({
    _URI: 'Effect' as const,
    _A: undefined as any,
    run: async () => f(await fa.run()),
  }),
  
  chain: <A, B,>(fa: Effect<A,>, f: (a: A) => Effect<B,>): Effect<B,> => ({
    _URI: 'Effect' as const,
    _A: undefined as any,
    run: async () => {
      const a = await fa.run();
      return f(a).run();
    },
  }),
  
  fromPromise: <A,>(promise: Promise<A,>): Effect<A,> => ({
    _URI: 'Effect' as const,
    _A: undefined as any,
    run: () => promise,
  }),
  
  delay: <A,>(ms: number, value: A): Effect<A,> => ({
    _URI: 'Effect' as const,
    _A: undefined as any,
    run: () => new Promise(resolve => setTimeout(() => resolve(value), ms)),
  }),
};

// State monad implementation
interface StateHKT extends HKT2 {
  readonly _URI: 'State';
}

interface State<S, A,> extends Kind2<StateHKT, S, A,> {
  runState: (state: S) => [A, S];
}

const State = {
  of: <S, A,>(value: A): State<S, A,> => ({
    _URI: 'State' as const,
    _A: undefined as any,
    _B: undefined as any,
    runState: (s: S) => [value, s],
  }),
  
  get: <S,>(): State<S, S,> => ({
    _URI: 'State' as const,
    _A: undefined as any,
    _B: undefined as any,
    runState: (s: S) => [s, s],
  }),
  
  put: <S,>(newState: S): State<S, void> => ({
    _URI: 'State' as const,
    _A: undefined as any,
    _B: undefined as any,
    runState: () => [undefined as any, newState],
  }),
  
  modify: <S,>(f: (s: S) => S): State<S, void> => ({
    _URI: 'State' as const,
    _A: undefined as any,
    _B: undefined as any,
    runState: (s: S) => [undefined as any, f(s)],
  }),
  
  map: <S, A, B,>(sa: State<S, A,>, f: (a: A) => B): State<S, B,> => ({
    _URI: 'State' as const,
    _A: undefined as any,
    _B: undefined as any,
    runState: (s: S) => {
      const [a, s2] = sa.runState(s);
      return [f(a), s2];
    },
  }),
  
  chain: <S, A, B,>(sa: State<S, A,>, f: (a: A) => State<S, B,>): State<S, B,> => ({
    _URI: 'State' as const,
    _A: undefined as any,
    _B: undefined as any,
    runState: (s: S) => {
      const [a, s2] = sa.runState(s);
      return f(a).runState(s2);
    },
  }),
};

// Lens implementation
interface Lens<S, A,> {
  get: (s: S) => A;
  set: (a: A) => (s: S) => S;
}

const Lens = {
  fromProp: <S, K extends keyof S,>(key: K): Lens<S, S[K]> => ({
    get: (s) => s[key],
    set: (value) => (s) => ({ ...s, [key]: value }),
  }),
  
  compose: <A, B, C,>(ab: Lens<A, B,>, bc: Lens<B, C,>): Lens<A, C,> => ({
    get: (a) => bc.get(ab.get(a)),
    set: (c) => (a) => ab.set(bc.set(c)(ab.get(a)))(a),
  }),
  
  over: <S, A,>(lens: Lens<S, A,>, f: (a: A) => A): (s: S) => S => 
    (s) => lens.set(f(lens.get(s)))(s),
  
  view: <S, A,>(lens: Lens<S, A,>): (s: S) => A => lens.get,
  
  set: <S, A,>(lens: Lens<S, A,>, value: A): (s: S) => S => lens.set(value),
};

// Validation with applicative functors
interface ValidationHKT extends HKT {
  readonly _URI: 'Validation';
}

type Validation<A,> = 
  | { tag: 'Success'; value: A }
  | { tag: 'Failure'; errors: string[] };

const Validation = {
  success: <A,>(value: A): Validation<A,> => ({ tag: 'Success', value }),
  
  failure: (errors: string[]): Validation<never> => ({ tag: 'Failure', errors }),
  
  map: <A, B,>(va: Validation<A,>, f: (a: A) => B): Validation<B,> => 
    va.tag === 'Success' ? { tag: 'Success', value: f(va.value) } : va,
  
  ap: <A, B,>(vf: Validation<(a: A) => B,>, va: Validation<A,>): Validation<B,> => {
    if (vf.tag === 'Failure' && va.tag === 'Failure') {
      return { tag: 'Failure', errors: [...vf.errors, ...va.errors] };
    }
    if (vf.tag === 'Failure') return vf;
    if (va.tag === 'Failure') return va;
    return { tag: 'Success', value: vf.value(va.value) };
  },
  
  chain: <A, B,>(va: Validation<A,>, f: (a: A) => Validation<B,>): Validation<B,> =>
    va.tag === 'Success' ? f(va.value) : va,
};

// IO monad for side effects
interface IOHKT extends HKT {
  readonly _URI: 'IO';
}

interface IO<A,> extends Kind<IOHKT, A,> {
  run: () => A;
}

const IO = {
  of: <A,>(value: A): IO<A,> => ({
    _URI: 'IO' as const,
    _A: undefined as any,
    run: () => value,
  }),
  
  map: <A, B,>(ioa: IO<A,>, f: (a: A) => B): IO<B,> => ({
    _URI: 'IO' as const,
    _A: undefined as any,
    run: () => f(ioa.run()),
  }),
  
  chain: <A, B,>(ioa: IO<A,>, f: (a: A) => IO<B,>): IO<B,> => ({
    _URI: 'IO' as const,
    _A: undefined as any,
    run: () => f(ioa.run()).run(),
  }),
  
  fromThunk: <A,>(thunk: () => A): IO<A,> => ({
    _URI: 'IO' as const,
    _A: undefined as any,
    run: thunk,
  }),
};

// Custom hooks using HKT patterns
function useStateMonad<S,>(initialState: S) {
  const [state, setState] = useState(initialState);
  
  const runState = useCallback(<A,>(stateComputation: State<S, A,>): A => {
    const [result, newState] = stateComputation.runState(state);
    setState(newState);
    return result;
  }, [state]);
  
  return { state, runState };
}

function useEffectMonad() {
  const [results, setResults] = useState<any[]>([]);
  
  const runEffect = useCallback(async <A,>(effect: Effect<A,>): Promise<A,> => {
    const result = await effect.run();
    setResults(prev => [...prev, result]);
    return result;
  }, []);
  
  return { results, runEffect };
}

function useLens<S, A,>(
  state: S,
  setState: (s: S) => void,
  lens: Lens<S, A,>
): [A, (a: A) => void, (f: (a: A) => A) => void] {
  const value = lens.get(state);
  
  const setValue = useCallback((newValue: A) => {
    setState(lens.set(newValue)(state));
  }, [state, setState, lens]);
  
  const modifyValue = useCallback((f: (a: A) => A) => {
    setState(Lens.over(lens, f)(state));
  }, [state, setState, lens]);
  
  return [value, setValue, modifyValue];
}

function useValidation<T,>(
  validators: Array<(value: T) => Validation<T,>>
) {
  const validate = useCallback((value: T): Validation<T,> => {
    return validators.reduce(
      (acc, validator) => {
        const result = validator(value);
        return Validation.ap(
          Validation.map(acc, (a: T) => (b: T) => b), // Keep the last valid value
          result
        );
      },
      Validation.success(value)
    );
  }, [validators]);
  
  return { validate };
}

// Demo components
interface AppState {
  user: {
    name: string;
    email: string;
    age: number;
  };
  settings: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
  counter: number;
}

function EffectSystemDemo() {
  const { results, runEffect } = useEffectMonad();
  
  const handleAsyncOperation = () => {
    const operation = Effect.chain(
      Effect.delay(1000, 'First step completed'),
      (result1) => Effect.chain(
        Effect.delay(500, 'Second step completed'),
        (result2) => Effect.of(`Final result: ${result1} -> ${result2}`)
      )
    );
    
    runEffect(operation);
  };
  
  const handleDataFetch = () => {
    const fetchOperation = Effect.fromPromise(
      fetch('https://jsonplaceholder.typicode.com/posts/1').then(r => r.json())
    );
    
    runEffect(fetchOperation);
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Effect System Demo</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleAsyncOperation}>Run Async Chain</button>
        <button onClick={handleDataFetch}>Fetch Data</button>
      </div>
      
      <div>
        <h4>Results:</h4>
        <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function LensEditor() {
  const [appState, setAppState] = useState<AppState>({
    user: { name: 'John', email: 'john@example.com', age: 30 },
    settings: { theme: 'light', notifications: true },
    counter: 0,
  });
  
  // Create lenses
  const userLens = Lens.fromProp<AppState, 'user'>('user');
  const nameLens = Lens.fromProp<typeof appState.user, 'name'>('name');
  const userNameLens = Lens.compose(userLens, nameLens);
  
  const settingsLens = Lens.fromProp<AppState, 'settings'>('settings');
  const themeLens = Lens.fromProp<typeof appState.settings, 'theme'>('theme');
  const themeSettingsLens = Lens.compose(settingsLens, themeLens);
  
  // Use lens hooks
  const [userName, setUserName, modifyUserName] = useLens(appState, setAppState, userNameLens);
  const [theme, setTheme] = useLens(appState, setAppState, themeSettingsLens);
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Lens Editor</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>
            User Name: 
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </label>
          <button onClick={() => modifyUserName(name => name.toUpperCase())}>
            Uppercase
          </button>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            Theme: 
            <select value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
      </div>
      
      <div>
        <h4>Current State:</h4>
        <pre style={{ fontSize: '12px' }}>
          {JSON.stringify(appState, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function ValidationComposer() {
  const [formData, setFormData] = useState({ name: '', email: '', age: 0 });
  const [validationResult, setValidationResult] = useState<Validation<typeof formData> | null>(null);
  
  const nameValidator = (data: typeof formData): Validation<typeof formData> =>
    data.name.length >= 2 
      ? Validation.success(data)
      : Validation.failure(['Name must be at least 2 characters']);
  
  const emailValidator = (data: typeof formData): Validation<typeof formData> =>
    data.email.includes('@') 
      ? Validation.success(data)
      : Validation.failure(['Email must contain @']);
  
  const ageValidator = (data: typeof formData): Validation<typeof formData> =>
    data.age >= 18 
      ? Validation.success(data)
      : Validation.failure(['Age must be 18 or older']);
  
  const { validate } = useValidation([nameValidator, emailValidator, ageValidator]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validate(formData);
    setValidationResult(result);
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Validation Composer</h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <input
            type="number"
            placeholder="Age"
            value={formData.age}
            onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
          />
        </div>
        
        <button type="submit">Validate</button>
      </form>
      
      {validationResult && (
        <div style={{ marginTop: '20px' }}>
          <h4>Validation Result:</h4>
          {validationResult.tag === 'Success' ? (
            <p style={{ color: 'green' }}>✅ Form is valid!</p>
          ) : (
            <div style={{ color: 'red' }}>
              <p>❌ Validation errors:</p>
              <ul>
                {validationResult.errors.map((error, index) => (
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

function StateMonadDemo() {
  const { state, runState } = useStateMonad({ count: 0, history: [] as string[] });
  
  const increment = () => {
    const operation = State.chain(
      State.get<typeof state>(),
      (currentState) => State.chain(
        State.put({ 
          ...currentState, 
          count: currentState.count + 1,
          history: [...currentState.history, `Incremented to ${currentState.count + 1}`]
        }),
        () => State.of(currentState.count + 1)
      )
    );
    
    runState(operation);
  };
  
  const reset = () => {
    const operation = State.put({ count: 0, history: ['Reset to 0'] });
    runState(operation);
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>State Monad Demo</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Count: {state.count}</h2>
        <button onClick={increment}>Increment</button>
        <button onClick={reset}>Reset</button>
      </div>
      
      <div>
        <h4>History:</h4>
        <ul>
          {state.history.map((entry, index) => (
            <li key={index}>{entry}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function HKTPlayground() {
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  const demonstrateComposition = () => {
    // Effect composition
    const effectChain = Effect.chain(
      Effect.of(5),
      (x) => Effect.chain(
        Effect.of(x * 2),
        (y) => Effect.of(y + 3)
      )
    );
    
    effectChain.run().then(result => {
      addLog(`Effect chain result: ${result}`);
    });
    
    // State composition
    const stateOp = State.chain(
      State.get<number>(),
      (current) => State.chain(
        State.put(current + 10),
        () => State.of(current)
      )
    );
    
    const [result, newState] = stateOp.runState(42);
    addLog(`State operation: ${result} -> ${newState}`);
    
    // Validation composition
    const validationChain = Validation.chain(
      Validation.success(10),
      (x) => x > 5 
        ? Validation.success(x * 2)
        : Validation.failure(['Value too small'])
    );
    
    const validationResult = validationChain.tag === 'Success' 
      ? validationChain.value 
      : validationChain.errors.join(', ');
    addLog(`Validation result: ${validationResult}`);
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>HKT Playground</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={demonstrateComposition}>Demonstrate HKT Composition</button>
        <button onClick={() => setLogs([])}>Clear Logs</button>
      </div>
      
      <div>
        <h4>Execution Log:</h4>
        <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
          {logs.join('\n')}
        </pre>
      </div>
    </div>
  );
}

// Main demo component
export default function HKTStateManagementDemo() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Higher-Kinded Types for State Management</h1>
      <p>Demonstration of HKT patterns applied to state management.</p>
      
      <EffectSystemDemo />
      <LensEditor />
      <ValidationComposer />
      <StateMonadDemo />
      <HKTPlayground />
    </div>
  );
}

// Export components and utilities for testing
export {
  EffectSystemDemo,
  LensEditor,
  ValidationComposer,
  StateMonadDemo,
  HKTPlayground,
  Effect,
  State,
  Lens,
  Validation,
  IO,
  useStateMonad,
  useEffectMonad,
  useLens,
  useValidation,
};