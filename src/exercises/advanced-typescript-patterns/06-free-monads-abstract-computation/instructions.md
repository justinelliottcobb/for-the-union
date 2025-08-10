# Free Monads and Abstract Computation

Master the revolutionary separation of program structure from interpretation.

## Learning Objectives

- Understand revolutionary separation of structure from interpretation  
- Create Console, HTTP, State, Logging DSLs with multiple interpreters
- Implement Pure, Interactive, Mock interpreters for different contexts
- Master program composition using flatMap for sequential execution
- Handle effect stacking and algebraic effects
- Transform programs as data structures

## Background

Free Monads enable the ultimate separation of concerns: they let you describe *what* your program does without specifying *how* it does it. Your program becomes a data structure that can be interpreted in multiple ways.

This enables:
- Testing with pure interpreters (no side effects)
- Development with mock interpreters (fake data)  
- Production with real interpreters (actual I/O)
- Program transformation and optimization
- Effect tracking and analysis
- Multiple execution strategies for the same program

Think of it as writing a script that can be "performed" by different actors in different contexts.

## Instructions

1. **Create Core Free Monad Infrastructure**
   - Implement `Free<F, A>` type with `Pure` and `Bind` constructors
   - Create `liftF` to lift functor operations into Free
   - Implement monadic operations: `map`, `flatMap`, `pure`
   - Show how Free forms a monad for any functor

2. **Build Domain-Specific Languages (DSLs)**
   - Console DSL: `log`, `read`, `write` operations
   - HTTP DSL: `get`, `post`, `put`, `delete` requests
   - State DSL: `get`, `put`, `modify` state operations
   - File DSL: `readFile`, `writeFile`, `exists` operations

3. **Implement Multiple Interpreters**
   - Pure Interpreter: Runs in memory with no side effects
   - Interactive Interpreter: Connects to real UI and services
   - Mock Interpreter: Uses fake data for development/testing
   - Logging Interpreter: Wraps another interpreter with logging

4. **Program Composition and Sequencing**
   - Show how programs compose using `flatMap`
   - Implement `sequence` and `traverse` for program lists
   - Create higher-order programs that use other programs
   - Demonstrate the power of compositional programming

5. **Effect Stacking and Combination**
   - Combine multiple DSLs in a single program
   - Handle heterogeneous effect stacks
   - Show how different effects can be interpreted differently
   - Create programs that use console + http + state together

6. **Interactive React Application**
   - Build a todo app using Free Monad architecture
   - Show the same program logic with different interpreters
   - Demonstrate testing with pure interpreters
   - Switch interpreters at runtime for different behaviors

## Key Concepts

### Free Monad Structure

```typescript
type Free<F, A> = 
  | { tag: 'Pure'; value: A }
  | { tag: 'Bind'; fa: HKT<F, any>; f: (a: any) => Free<F, A> };

// Lift a functor operation into Free
function liftF<F, A>(fa: HKT<F, A>): Free<F, A> {
  return { tag: 'Bind', fa, f: (a: A) => pure(a) };
}
```

### DSL Example

```typescript
// Console DSL
type ConsoleF<A> = 
  | { tag: 'Log'; message: string; next: A }
  | { tag: 'Read'; prompt: string; next: (input: string) => A };

// Smart constructors
const log = (message: string) => 
  liftF<'Console', void>({ tag: 'Log', message, next: undefined });

const read = (prompt: string) => 
  liftF<'Console', string>({ tag: 'Read', prompt, next: (s: string) => s });
```

### Interpreter Pattern

```typescript
// Pure interpreter
const pureInterpreter = <A>(program: Free<'Console', A>): A => {
  switch (program.tag) {
    case 'Pure': return program.value;
    case 'Bind': 
      const fa = program.fa as ConsoleF<any>;
      switch (fa.tag) {
        case 'Log': 
          console.log(fa.message);  // Could be stored in array instead
          return pureInterpreter(fa.next);
        case 'Read':
          return pureInterpreter(fa.next('mocked input'));
      }
  }
};
```

## Hints

1. Free monads separate "what to do" from "how to do it"
2. Programs become data structures that can be inspected and transformed
3. Different interpreters can run the same program in different contexts
4. Pure interpreters enable deterministic testing
5. Interactive interpreters connect to real UI and services
6. Think of programs as abstract syntax trees

## Expected Behavior

When complete, you should be able to:

```typescript
// Define a program using multiple DSLs
const todoProgram = doM(function* () {
  yield* log('Starting todo application...');
  const todos = yield* httpGet('/api/todos');
  yield* putState({ todos });
  const input = yield* read('Enter new todo: ');
  const newTodo = yield* httpPost('/api/todos', { text: input });
  const currentState = yield* getState();
  yield* putState({ todos: [...currentState.todos, newTodo] });
  return newTodo;
});

// Run with different interpreters
const testResult = pureInterpreter(todoProgram); // For testing
const devResult = mockInterpreter(todoProgram);  // For development  
const prodResult = realInterpreter(todoProgram); // For production

// Programs are data - can be analyzed
const effects = analyzeEffects(todoProgram); // ['Console', 'HTTP', 'State']
const optimized = optimizeProgram(todoProgram); // Remove redundant operations
```

**Estimated time:** 70 minutes  
**Difficulty:** 5/5