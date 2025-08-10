// Free Monads and Abstract Computation
// Master the art of separating program structure from interpretation using Free monads

// Learning objectives:
// - Understand Free monads as the "free" structure over a functor
// - Build composable, testable programs using Free monad DSLs
// - Separate program definition from program execution
// - Create multiple interpreters for the same abstract program
// - Implement command pattern and dependency injection with Free monads
// - Build streaming computation pipelines with Free monads
// - Design effect systems and algebraic effects using Free structures

// Hints:
// 1. Free monads turn any functor into a monad "for free"
// 2. Separate "what to do" (DSL) from "how to do it" (interpreter)
// 3. Programs become data structures that can be inspected and transformed
// 4. Multiple interpreters enable testing, optimization, and different execution strategies
// 5. Use tagged unions to represent different operations in your DSL
// 6. Church encoding can be used for more efficient Free monad implementations
// 7. Free monads enable "algebraic effects" - composable effect systems

import React, { useState, useCallback, useRef, useEffect } from 'react';

// TODO: Free Monad Foundation
// The Free monad structure over any functor

// Free monad data type - either Pure value or Impure functor operation
type Free<F, A> = 
  | { readonly _tag: 'Pure'; readonly value: A }
  | { readonly _tag: 'Impure'; readonly functor: F; readonly continuation: (result: any) => Free<F, A> };

const Free = {
  // Pure value constructor
  pure: <F, A>(value: A): Free<F, A> => ({
    _tag: 'Pure' as const,
    value,
  }),

  // Lift a functor operation into Free monad
  liftF: <F, A>(functor: F & { map?: (f: (a: any) => any) => any }): Free<F, A> => ({
    _tag: 'Impure' as const,
    functor,
    continuation: (result: A) => Free.pure(result),
  }),

  // Monadic bind/flatMap
  flatMap: <F, A, B>(
    free: Free<F, A>, 
    f: (a: A) => Free<F, B>
  ): Free<F, B> => {
    switch (free._tag) {
      case 'Pure':
        return f(free.value);
      case 'Impure':
        return {
          _tag: 'Impure' as const,
          functor: free.functor,
          continuation: (result: any) => Free.flatMap(free.continuation(result), f),
        };
    }
  },

  // Functor map
  map: <F, A, B>(free: Free<F, A>, f: (a: A) => B): Free<F, B> => 
    Free.flatMap(free, (a: A) => Free.pure(f(a))),

  // Check if Free computation is pure
  isPure: <F, A>(free: Free<F, A>): free is { _tag: 'Pure'; value: A } =>
    free._tag === 'Pure',

  // Check if Free computation is impure
  isImpure: <F, A>(free: Free<F, A>): free is { _tag: 'Impure'; functor: F; continuation: (result: any) => Free<F, A> } =>
    free._tag === 'Impure',
};

// TODO: Example 1 - Console DSL with Free Monad
// Build a DSL for console operations that can be interpreted differently

// Console operations functor
type ConsoleF<A> = 
  | { readonly _tag: 'ReadLine'; readonly prompt: string }
  | { readonly _tag: 'WriteLine'; readonly message: string }
  | { readonly _tag: 'Clear' };

// Console DSL type alias
type Console<A> = Free<ConsoleF<A>, A>;

// Smart constructors for Console DSL
const ConsoleOps = {
  readLine: (prompt: string): Console<string> =>
    Free.liftF({ _tag: 'ReadLine' as const, prompt }),

  writeLine: (message: string): Console<void> =>
    Free.liftF({ _tag: 'WriteLine' as const, message }),

  clear: (): Console<void> =>
    Free.liftF({ _tag: 'Clear' as const }),

  // Helper for building console programs
  program: {
    // Simple greeting program
    greeting: (): Console<string> => {
      return Free.flatMap(
        ConsoleOps.writeLine("Welcome! What's your name?"),
        () => Free.flatMap(
          ConsoleOps.readLine("Enter name: "),
          (name: string) => Free.flatMap(
            ConsoleOps.writeLine(`Hello, ${name}!`),
            () => Free.pure(name)
          )
        )
      );
    },

    // Interactive calculator
    calculator: (): Console<number> => {
      return Free.flatMap(
        ConsoleOps.writeLine("Simple Calculator"),
        () => Free.flatMap(
          ConsoleOps.readLine("Enter first number: "),
          (first: string) => Free.flatMap(
            ConsoleOps.readLine("Enter second number: "),
            (second: string) => {
              const result = parseFloat(first) + parseFloat(second);
              return Free.flatMap(
                ConsoleOps.writeLine(`Result: ${result}`),
                () => Free.pure(result)
              );
            }
          )
        )
      );
    },

    // Quiz program
    quiz: (): Console<number> => {
      const questions = [
        { question: "What is 2 + 2?", answer: "4" },
        { question: "What is the capital of France?", answer: "Paris" },
        { question: "What is 5 * 6?", answer: "30" },
      ];

      const askQuestion = (q: typeof questions[0], index: number): Console<boolean> =>
        Free.flatMap(
          ConsoleOps.writeLine(`Question ${index + 1}: ${q.question}`),
          () => Free.flatMap(
            ConsoleOps.readLine("Your answer: "),
            (answer: string) => {
              const correct = answer.toLowerCase().trim() === q.answer.toLowerCase();
              const feedback = correct ? "Correct!" : `Wrong! The answer was: ${q.answer}`;
              return Free.flatMap(
                ConsoleOps.writeLine(feedback),
                () => Free.pure(correct)
              );
            }
          )
        );

      // Process all questions sequentially
      const processQuestions = (qs: typeof questions, score = 0, index = 0): Console<number> => {
        if (index >= qs.length) {
          return Free.flatMap(
            ConsoleOps.writeLine(`Quiz complete! Your score: ${score}/${qs.length}`),
            () => Free.pure(score)
          );
        }

        return Free.flatMap(
          askQuestion(qs[index], index),
          (correct: boolean) => processQuestions(qs, score + (correct ? 1 : 0), index + 1)
        );
      };

      return Free.flatMap(
        ConsoleOps.writeLine("Welcome to the Quiz!"),
        () => processQuestions(questions)
      );
    },
  },
};

// Console interpreters
type ConsoleState = {
  readonly output: readonly string[];
  readonly inputs: readonly string[];
  readonly inputIndex: number;
};

const ConsoleInterpreter = {
  // Pure interpreter for testing - uses predefined inputs
  pure: <A>(inputs: readonly string[]) => {
    const interpret = (program: Console<A>, state: ConsoleState): { result: A; state: ConsoleState } => {
      if (Free.isPure(program)) {
        return { result: program.value, state };
      }

      const { functor, continuation } = program;
      
      switch (functor._tag) {
        case 'ReadLine': {
          const input = state.inputs[state.inputIndex] || '';
          const newState = {
            ...state,
            output: [...state.output, `${functor.prompt}${input}`],
            inputIndex: state.inputIndex + 1,
          };
          const nextProgram = continuation(input);
          return interpret(nextProgram, newState);
        }
        
        case 'WriteLine': {
          const newState = {
            ...state,
            output: [...state.output, functor.message],
          };
          const nextProgram = continuation(undefined);
          return interpret(nextProgram, newState);
        }
        
        case 'Clear': {
          const newState = {
            ...state,
            output: [],
          };
          const nextProgram = continuation(undefined);
          return interpret(nextProgram, newState);
        }
        
        default:
          throw new Error(`Unknown console operation: ${(functor as any)._tag}`);
      }
    };

    return (program: Console<A>) => interpret(program, { output: [], inputs, inputIndex: 0 });
  },

  // Interactive interpreter for React components
  interactive: <A>(
    onOutput: (message: string) => void,
    onInput: (prompt: string, callback: (input: string) => void) => void,
    onClear: () => void
  ) => {
    const interpret = (program: Console<A>): Promise<A> => {
      if (Free.isPure(program)) {
        return Promise.resolve(program.value);
      }

      const { functor, continuation } = program;

      return new Promise((resolve) => {
        switch (functor._tag) {
          case 'ReadLine':
            onInput(functor.prompt, (input: string) => {
              const nextProgram = continuation(input);
              interpret(nextProgram).then(resolve);
            });
            break;

          case 'WriteLine':
            onOutput(functor.message);
            const nextProgram = continuation(undefined);
            interpret(nextProgram).then(resolve);
            break;

          case 'Clear':
            onClear();
            const clearNext = continuation(undefined);
            interpret(clearNext).then(resolve);
            break;

          default:
            throw new Error(`Unknown console operation: ${(functor as any)._tag}`);
        }
      });
    };

    return interpret;
  },
};

// TODO: Example 2 - HTTP DSL with Free Monad
// Build a DSL for HTTP operations with multiple interpreters

type HttpF<A> = 
  | { readonly _tag: 'Get'; readonly url: string }
  | { readonly _tag: 'Post'; readonly url: string; readonly body: unknown }
  | { readonly _tag: 'Put'; readonly url: string; readonly body: unknown }
  | { readonly _tag: 'Delete'; readonly url: string };

type Http<A> = Free<HttpF<A>, A>;

// HTTP response type
type HttpResponse = {
  readonly status: number;
  readonly data: unknown;
  readonly headers: Record<string, string>;
};

// Smart constructors for HTTP DSL
const HttpOps = {
  get: (url: string): Http<HttpResponse> =>
    Free.liftF({ _tag: 'Get' as const, url }),

  post: (url: string, body: unknown): Http<HttpResponse> =>
    Free.liftF({ _tag: 'Post' as const, url, body }),

  put: (url: string, body: unknown): Http<HttpResponse> =>
    Free.liftF({ _tag: 'Put' as const, url, body }),

  delete: (url: string): Http<HttpResponse> =>
    Free.liftF({ _tag: 'Delete' as const, url }),

  // Helper for JSON operations
  json: {
    get: <T>(url: string): Http<T> =>
      Free.map(HttpOps.get(url), (response) => response.data as T),

    post: <T>(url: string, body: unknown): Http<T> =>
      Free.map(HttpOps.post(url, body), (response) => response.data as T),

    put: <T>(url: string, body: unknown): Http<T> =>
      Free.map(HttpOps.put(url, body), (response) => response.data as T),
  },

  // Sample HTTP programs
  program: {
    // Fetch user profile
    getUserProfile: (userId: number): Http<{ name: string; email: string }> =>
      HttpOps.json.get(`/api/users/${userId}`),

    // Update user profile
    updateUserProfile: (userId: number, profile: { name: string; email: string }): Http<{ success: boolean }> =>
      HttpOps.json.put(`/api/users/${userId}`, profile),

    // Complex workflow: fetch, update, and verify
    updateAndVerify: (userId: number, newName: string): Http<{ success: boolean; verified: boolean }> =>
      Free.flatMap(
        HttpOps.getUserProfile(userId),
        (profile) => Free.flatMap(
          HttpOps.updateUserProfile(userId, { ...profile, name: newName }),
          (updateResult) => Free.flatMap(
            HttpOps.getUserProfile(userId),
            (updatedProfile) => Free.pure({
              success: updateResult.success,
              verified: updatedProfile.name === newName,
            })
          )
        )
      ),

    // Batch operations
    batchUsers: (userIds: readonly number[]): Http<readonly { id: number; profile: any }[]> => {
      const fetchUser = (id: number): Http<{ id: number; profile: any }> =>
        Free.map(HttpOps.getUserProfile(id), (profile) => ({ id, profile }));

      // Sequential processing using Free monad
      const processUsers = (ids: readonly number[], results: readonly { id: number; profile: any }[] = []): Http<readonly { id: number; profile: any }[]> => {
        if (ids.length === 0) {
          return Free.pure(results);
        }

        const [first, ...rest] = ids;
        return Free.flatMap(
          fetchUser(first),
          (result) => processUsers(rest, [...results, result])
        );
      };

      return processUsers(userIds);
    },
  },
};

// HTTP interpreters
const HttpInterpreter = {
  // Mock interpreter for testing
  mock: (responses: Record<string, { status: number; data: unknown }>) => {
    const interpret = <A>(program: Http<A>): Promise<A> => {
      if (Free.isPure(program)) {
        return Promise.resolve(program.value);
      }

      const { functor, continuation } = program;
      
      return new Promise((resolve) => {
        setTimeout(() => {
          let response: HttpResponse;
          const key = `${functor._tag}:${(functor as any).url}`;
          const mockResponse = responses[key] || responses[(functor as any).url];
          
          if (mockResponse) {
            response = {
              status: mockResponse.status,
              data: mockResponse.data,
              headers: { 'Content-Type': 'application/json' },
            };
          } else {
            response = {
              status: 404,
              data: { error: 'Not found' },
              headers: {},
            };
          }

          const nextProgram = continuation(response);
          interpret(nextProgram).then(resolve);
        }, 100); // Simulate network delay
      });
    };

    return interpret;
  },

  // Real fetch interpreter
  fetch: () => {
    const interpret = <A>(program: Http<A>): Promise<A> => {
      if (Free.isPure(program)) {
        return Promise.resolve(program.value);
      }

      const { functor, continuation } = program;

      const executeRequest = async (): Promise<HttpResponse> => {
        const baseUrl = 'https://jsonplaceholder.typicode.com';
        
        try {
          let response: Response;
          
          switch (functor._tag) {
            case 'Get':
              response = await fetch(`${baseUrl}${(functor as any).url}`);
              break;
            case 'Post':
              response = await fetch(`${baseUrl}${(functor as any).url}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify((functor as any).body),
              });
              break;
            case 'Put':
              response = await fetch(`${baseUrl}${(functor as any).url}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify((functor as any).body),
              });
              break;
            case 'Delete':
              response = await fetch(`${baseUrl}${(functor as any).url}`, {
                method: 'DELETE',
              });
              break;
            default:
              throw new Error(`Unknown HTTP operation: ${(functor as any)._tag}`);
          }

          const data = await response.json();
          return {
            status: response.status,
            data,
            headers: Object.fromEntries(response.headers.entries()),
          };
        } catch (error) {
          return {
            status: 500,
            data: { error: (error as Error).message },
            headers: {},
          };
        }
      };

      return executeRequest().then((response) => {
        const nextProgram = continuation(response);
        return interpret(nextProgram);
      });
    };

    return interpret;
  },
};

// TODO: Example 3 - State Management DSL with Free Monad
// Build a DSL for state operations that can be optimized and batched

type StateF<S, A> = 
  | { readonly _tag: 'Get' }
  | { readonly _tag: 'Put'; readonly newState: S }
  | { readonly _tag: 'Modify'; readonly f: (s: S) => S };

type State<S, A> = Free<StateF<S, A>, A>;

// Smart constructors for State DSL
const StateOps = {
  get: <S>(): State<S, S> =>
    Free.liftF({ _tag: 'Get' as const }),

  put: <S>(newState: S): State<S, void> =>
    Free.liftF({ _tag: 'Put' as const, newState }),

  modify: <S>(f: (s: S) => S): State<S, void> =>
    Free.liftF({ _tag: 'Modify' as const, f }),

  // Helper combinators
  gets: <S, A>(f: (s: S) => A): State<S, A> =>
    Free.map(StateOps.get<S>(), f),

  // Counter operations
  counter: {
    increment: (): State<number, number> =>
      Free.flatMap(
        StateOps.modify<number>((n) => n + 1),
        () => StateOps.get<number>()
      ),

    decrement: (): State<number, number> =>
      Free.flatMap(
        StateOps.modify<number>((n) => n - 1),
        () => StateOps.get<number>()
      ),

    add: (amount: number): State<number, number> =>
      Free.flatMap(
        StateOps.modify<number>((n) => n + amount),
        () => StateOps.get<number>()
      ),

    reset: (): State<number, number> =>
      Free.flatMap(
        StateOps.put<number>(0),
        () => StateOps.get<number>()
      ),
  },

  // Todo list operations
  todoList: {
    type: {} as {
      Todo: { id: number; text: string; completed: boolean };
      TodoState: { todos: readonly StateOps.todoList.type.Todo[]; nextId: number };
    },

    addTodo: (text: string): State<StateOps.todoList.type.TodoState, number> =>
      Free.flatMap(
        StateOps.get<StateOps.todoList.type.TodoState>(),
        (state) => {
          const newTodo = { id: state.nextId, text, completed: false };
          return Free.flatMap(
            StateOps.put<StateOps.todoList.type.TodoState>({
              todos: [...state.todos, newTodo],
              nextId: state.nextId + 1,
            }),
            () => Free.pure(newTodo.id)
          );
        }
      ),

    toggleTodo: (id: number): State<StateOps.todoList.type.TodoState, boolean> =>
      Free.flatMap(
        StateOps.modify<StateOps.todoList.type.TodoState>((state) => ({
          ...state,
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          ),
        })),
        () => Free.flatMap(
          StateOps.gets<StateOps.todoList.type.TodoState, StateOps.todoList.type.Todo | undefined>(
            (state) => state.todos.find(t => t.id === id)
          ),
          (todo) => Free.pure(todo?.completed ?? false)
        )
      ),

    removeTodo: (id: number): State<StateOps.todoList.type.TodoState, boolean> =>
      Free.flatMap(
        StateOps.get<StateOps.todoList.type.TodoState>(),
        (state) => {
          const todoExists = state.todos.some(t => t.id === id);
          return Free.flatMap(
            StateOps.put<StateOps.todoList.type.TodoState>({
              ...state,
              todos: state.todos.filter(t => t.id !== id),
            }),
            () => Free.pure(todoExists)
          );
        }
      ),

    getTodos: (): State<StateOps.todoList.type.TodoState, readonly StateOps.todoList.type.Todo[]> =>
      StateOps.gets((state: StateOps.todoList.type.TodoState) => state.todos),
  },
};

// State interpreter
const StateInterpreter = {
  run: <S, A>(initialState: S) => {
    const interpret = (program: State<S, A>, currentState: S): { result: A; finalState: S } => {
      if (Free.isPure(program)) {
        return { result: program.value, finalState: currentState };
      }

      const { functor, continuation } = program;

      switch (functor._tag) {
        case 'Get': {
          const nextProgram = continuation(currentState);
          return interpret(nextProgram, currentState);
        }
        
        case 'Put': {
          const nextProgram = continuation(undefined);
          return interpret(nextProgram, functor.newState);
        }
        
        case 'Modify': {
          const newState = functor.f(currentState);
          const nextProgram = continuation(undefined);
          return interpret(nextProgram, newState);
        }
        
        default:
          throw new Error(`Unknown state operation: ${(functor as any)._tag}`);
      }
    };

    return (program: State<S, A>) => interpret(program, initialState);
  },
};

// TODO: Example 4 - Logging DSL that can be composed with other DSLs
// Demonstrate DSL composition and effect stacking

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogF<A> = {
  readonly _tag: 'Log';
  readonly level: LogLevel;
  readonly message: string;
};

type Log<A> = Free<LogF<A>, A>;

const LogOps = {
  log: (level: LogLevel, message: string): Log<void> =>
    Free.liftF({ _tag: 'Log' as const, level, message }),

  debug: (message: string): Log<void> => LogOps.log('debug', message),
  info: (message: string): Log<void> => LogOps.log('info', message),
  warn: (message: string): Log<void> => LogOps.log('warn', message),
  error: (message: string): Log<void> => LogOps.log('error', message),
};

// Combined DSL example - HTTP with Logging
type HttpWithLog<A> = Free<HttpF<A> | LogF<A>, A>;

const HttpWithLogOps = {
  // Lift HTTP operations
  get: (url: string): HttpWithLog<HttpResponse> => {
    return Free.flatMap(
      Free.liftF<HttpF<HttpResponse> | LogF<void>, void>({ _tag: 'Log', level: 'info', message: `GET ${url}` }),
      () => Free.liftF<HttpF<HttpResponse> | LogF<void>, HttpResponse>({ _tag: 'Get', url })
    );
  },

  post: (url: string, body: unknown): HttpWithLog<HttpResponse> => {
    return Free.flatMap(
      Free.liftF<HttpF<HttpResponse> | LogF<void>, void>({ _tag: 'Log', level: 'info', message: `POST ${url}` }),
      () => Free.liftF<HttpF<HttpResponse> | LogF<void>, HttpResponse>({ _tag: 'Post', url, body })
    );
  },

  // Program that logs and makes HTTP requests
  loggedApiCall: (url: string): HttpWithLog<unknown> =>
    Free.flatMap(
      Free.liftF<HttpF<HttpResponse> | LogF<void>, void>({ _tag: 'Log', level: 'debug', message: `Starting API call to ${url}` }),
      () => Free.flatMap(
        Free.liftF<HttpF<HttpResponse> | LogF<void>, HttpResponse>({ _tag: 'Get', url }),
        (response) => Free.flatMap(
          Free.liftF<HttpF<HttpResponse> | LogF<void>, void>({ 
            _tag: 'Log', 
            level: response.status >= 400 ? 'error' : 'info', 
            message: `API call completed with status ${response.status}` 
          }),
          () => Free.pure(response.data)
        )
      )
    ),
};

// TODO: React Components demonstrating Free Monad concepts

// Console program demo
function ConsoleDemo() {
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<'greeting' | 'calculator' | 'quiz'>('greeting');
  const inputCallbackRef = useRef<((input: string) => void) | null>(null);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [showInput, setShowInput] = useState(false);

  const addOutput = useCallback((message: string) => {
    setOutput(prev => [...prev, message]);
  }, []);

  const requestInput = useCallback((prompt: string, callback: (input: string) => void) => {
    setInputPrompt(prompt);
    inputCallbackRef.current = callback;
    setShowInput(true);
  }, []);

  const handleInput = useCallback((input: string) => {
    if (inputCallbackRef.current) {
      inputCallbackRef.current(input);
      inputCallbackRef.current = null;
      setShowInput(false);
      setInputPrompt('');
    }
  }, []);

  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  const runProgram = useCallback(async () => {
    setIsRunning(true);
    setOutput([]);

    const interpreter = ConsoleInterpreter.interactive(
      addOutput,
      requestInput,
      clearOutput
    );

    try {
      const program = (() => {
        switch (currentProgram) {
          case 'greeting': return ConsoleOps.program.greeting();
          case 'calculator': return ConsoleOps.program.calculator();
          case 'quiz': return ConsoleOps.program.quiz();
        }
      })();

      await interpreter(program);
    } catch (error) {
      addOutput(`Error: ${(error as Error).message}`);
    } finally {
      setIsRunning(false);
    }
  }, [currentProgram, addOutput, requestInput, clearOutput]);

  // Test with pure interpreter
  const runPureTest = useCallback(() => {
    const inputs = currentProgram === 'greeting' 
      ? ['Alice']
      : currentProgram === 'calculator'
      ? ['10', '5']
      : ['4', 'Paris', '30']; // Quiz answers

    const program = (() => {
      switch (currentProgram) {
        case 'greeting': return ConsoleOps.program.greeting();
        case 'calculator': return ConsoleOps.program.calculator();
        case 'quiz': return ConsoleOps.program.quiz();
      }
    })();

    const pureInterpreter = ConsoleInterpreter.pure(inputs);
    const result = pureInterpreter(program);
    
    setOutput([
      'Pure Interpreter Test:',
      `Inputs: [${inputs.join(', ')}]`,
      '---',
      ...result.state.output,
      '---',
      `Final result: ${JSON.stringify(result.result)}`,
    ]);
  }, [currentProgram]);

  return (
    <div>
      <h3>Free Monad Console DSL</h3>
      
      <div style={{ margin: '10px 0' }}>
        <label>
          Program:
          <select 
            value={currentProgram} 
            onChange={(e) => setCurrentProgram(e.target.value as any)}
            disabled={isRunning}
          >
            <option value="greeting">Greeting</option>
            <option value="calculator">Calculator</option>
            <option value="quiz">Quiz</option>
          </select>
        </label>
      </div>

      <div style={{ margin: '10px 0' }}>
        <button onClick={runProgram} disabled={isRunning}>
          {isRunning ? 'Running...' : 'Run Interactive'}
        </button>
        <button onClick={runPureTest} disabled={isRunning}>
          Run Pure Test
        </button>
        <button onClick={clearOutput} disabled={isRunning}>
          Clear
        </button>
      </div>

      {showInput && (
        <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#e3f2fd' }}>
          <div>{inputPrompt}</div>
          <input
            type="text"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleInput(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      )}

      <div style={{
        margin: '10px 0',
        padding: '10px',
        backgroundColor: '#000',
        color: '#00ff00',
        fontFamily: 'monospace',
        height: '300px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
      }}>
        {output.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
    </div>
  );
}

// HTTP program demo
function HttpDemo() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [useMock, setUseMock] = useState(true);

  const runHttpProgram = useCallback(async (programName: string) => {
    setLoading(true);
    setResult('');

    try {
      const interpreter = useMock 
        ? HttpInterpreter.mock({
          '/api/users/1': { status: 200, data: { name: 'John Doe', email: 'john@example.com' } },
          '/api/users/2': { status: 200, data: { name: 'Jane Smith', email: 'jane@example.com' } },
          'PUT:/api/users/1': { status: 200, data: { success: true } },
        })
        : HttpInterpreter.fetch();

      let program: Http<any>;
      
      switch (programName) {
        case 'getUserProfile':
          program = HttpOps.program.getUserProfile(1);
          break;
        case 'updateAndVerify':
          program = HttpOps.program.updateAndVerify(1, 'Updated Name');
          break;
        case 'batchUsers':
          program = HttpOps.program.batchUsers([1, 2]);
          break;
        default:
          throw new Error(`Unknown program: ${programName}`);
      }

      const response = await interpreter(program);
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [useMock]);

  return (
    <div>
      <h3>Free Monad HTTP DSL</h3>
      
      <div style={{ margin: '10px 0' }}>
        <label>
          <input
            type="checkbox"
            checked={useMock}
            onChange={(e) => setUseMock(e.target.checked)}
          />
          Use Mock Interpreter (uncheck for real API)
        </label>
      </div>

      <div style={{ margin: '10px 0' }}>
        <button 
          onClick={() => runHttpProgram('getUserProfile')} 
          disabled={loading}
        >
          Get User Profile
        </button>
        <button 
          onClick={() => runHttpProgram('updateAndVerify')} 
          disabled={loading}
        >
          Update & Verify
        </button>
        <button 
          onClick={() => runHttpProgram('batchUsers')} 
          disabled={loading}
        >
          Batch Users
        </button>
      </div>

      {loading && <div>Loading...</div>}

      {result && (
        <pre style={{
          margin: '10px 0',
          padding: '10px',
          backgroundColor: '#f0f0f0',
          fontSize: '12px',
          whiteSpace: 'pre-wrap',
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
          {result}
        </pre>
      )}
    </div>
  );
}

// State management demo
function StateDemo() {
  type Todo = StateOps.todoList.type.Todo;
  type TodoState = StateOps.todoList.type.TodoState;

  const [todoState, setTodoState] = useState<TodoState>({ todos: [], nextId: 1 });
  const [counterState, setCounterState] = useState(0);
  const [newTodoText, setNewTodoText] = useState('');

  const runTodoOperation = useCallback((operation: State<TodoState, any>) => {
    const interpreter = StateInterpreter.run(todoState);
    const result = interpreter(operation);
    setTodoState(result.finalState);
    return result.result;
  }, [todoState]);

  const runCounterOperation = useCallback((operation: State<number, any>) => {
    const interpreter = StateInterpreter.run(counterState);
    const result = interpreter(operation);
    setCounterState(result.finalState);
    return result.result;
  }, [counterState]);

  const addTodo = useCallback(() => {
    if (newTodoText.trim()) {
      runTodoOperation(StateOps.todoList.addTodo(newTodoText.trim()));
      setNewTodoText('');
    }
  }, [newTodoText, runTodoOperation]);

  const toggleTodo = useCallback((id: number) => {
    runTodoOperation(StateOps.todoList.toggleTodo(id));
  }, [runTodoOperation]);

  const removeTodo = useCallback((id: number) => {
    runTodoOperation(StateOps.todoList.removeTodo(id));
  }, [runTodoOperation]);

  return (
    <div>
      <h3>Free Monad State DSL</h3>
      
      {/* Counter Section */}
      <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #ddd' }}>
        <h4>Counter: {counterState}</h4>
        <button onClick={() => runCounterOperation(StateOps.counter.increment())}>
          +1
        </button>
        <button onClick={() => runCounterOperation(StateOps.counter.decrement())}>
          -1
        </button>
        <button onClick={() => runCounterOperation(StateOps.counter.add(5))}>
          +5
        </button>
        <button onClick={() => runCounterOperation(StateOps.counter.reset())}>
          Reset
        </button>
      </div>

      {/* Todo Section */}
      <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #ddd' }}>
        <h4>Todo List</h4>
        
        <div style={{ margin: '10px 0' }}>
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Enter new todo..."
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          />
          <button onClick={addTodo}>Add Todo</button>
        </div>

        <div>
          {todoState.todos.map((todo) => (
            <div key={todo.id} style={{ margin: '5px 0', display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span
                style={{
                  marginLeft: '10px',
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  color: todo.completed ? '#888' : '#000',
                  flex: 1,
                }}
              >
                {todo.text}
              </span>
              <button onClick={() => removeTodo(todo.id)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main app component
function App() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Free Monads and Abstract Computation</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <ConsoleDemo />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <HttpDemo />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <StateDemo />
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Free Monad Concepts Demonstrated:</h3>
        <ul>
          <li><strong>Abstract Computation:</strong> Separate program structure from interpretation</li>
          <li><strong>Multiple Interpreters:</strong> Pure (testing), Interactive (UI), Mock (development)</li>
          <li><strong>Composable DSLs:</strong> Console, HTTP, State, and Logging operations</li>
          <li><strong>Effect Systems:</strong> Algebraic effects through Free monad composition</li>
          <li><strong>Testable Programs:</strong> Pure interpreters enable deterministic testing</li>
          <li><strong>Program Transformation:</strong> Programs as data structures that can be analyzed</li>
          <li><strong>Dependency Injection:</strong> Interpreters inject behavior at runtime</li>
          <li><strong>Sequential Composition:</strong> flatMap enables step-by-step program building</li>
        </ul>
      </div>
    </div>
  );
}

// Export everything for testing and further exercises
export {
  App,
  ConsoleDemo,
  HttpDemo,
  StateDemo,
  Free,
  ConsoleOps,
  ConsoleInterpreter,
  HttpOps,
  HttpInterpreter,
  StateOps,
  StateInterpreter,
  LogOps,
  HttpWithLogOps,
  type Free as FreeType,
  type Console,
  type ConsoleF,
  type Http,
  type HttpF,
  type HttpResponse,
  type State,
  type StateF,
  type Log,
  type LogF,
  type LogLevel,
  type HttpWithLog,
  type ConsoleState,
};