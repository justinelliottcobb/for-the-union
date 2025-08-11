// Free Monads and Abstract Computation - Solution
import React, { useState } from 'react';

// Free Monad Infrastructure
type Free<F extends string, A> = 
  | { tag: 'Pure'; value: A }
  | { tag: 'Bind'; fa: any; f: (a: any) => Free<F, A> };

const pure = <F extends string, A,>(value: A): Free<F, A> => ({ tag: 'Pure', value });

const liftF = <F extends string, A,>(fa: any): Free<F, A> => ({
  tag: 'Bind',
  fa,
  f: (a: A) => pure(a)
});

const flatMap = <F extends string, A, B,>(
  fa: Free<F, A>,
  f: (a: A) => Free<F, B>
): Free<F, B> => {
  switch (fa.tag) {
    case 'Pure': return f(fa.value);
    case 'Bind': return {
      tag: 'Bind',
      fa: fa.fa,
      f: (x: any) => flatMap(fa.f(x), f)
    };
  }
};

// Console DSL
type ConsoleF<A> = 
  | { tag: 'Log'; message: string; next: A }
  | { tag: 'Read'; prompt: string; next: (input: string) => A };

const log = (message: string): Free<'Console', void> =>
  liftF<'Console', void>({ tag: 'Log', message, next: undefined });

const read = (prompt: string): Free<'Console', string> =>
  liftF<'Console', string>({ tag: 'Read', prompt, next: (s: string) => s });

// HTTP DSL
type HttpF<A> =
  | { tag: 'Get'; url: string; next: (response: any) => A }
  | { tag: 'Post'; url: string; data: any; next: (response: any) => A };

const httpGet = (url: string): Free<'Http', any> =>
  liftF<'Http', any>({ tag: 'Get', url, next: (r: any) => r });

const httpPost = (url: string, data: any): Free<'Http', any> =>
  liftF<'Http', any>({ tag: 'Post', url, data, next: (r: any) => r });

// State DSL
type StateF<S, A> =
  | { tag: 'Get'; next: (state: S) => A }
  | { tag: 'Put'; state: S; next: A };

const getState = <S,>(): Free<'State', S> =>
  liftF<'State', S>({ tag: 'Get', next: (s: S) => s });

const putState = <S,>(state: S): Free<'State', void> =>
  liftF<'State', void>({ tag: 'Put', state, next: undefined });

// Do-notation helper (simplified)
const doM = function*<F extends string, A>(
  gen: () => Generator<Free<F, any>, A, any>
): Free<F, A> {
  const iterator = gen();
  let result = iterator.next();
  
  if (result.done) {
    return pure(result.value);
  }
  
  return flatMap(result.value, (value) => {
    result = iterator.next(value);
    if (result.done) {
      return pure(result.value);
    }
    // Simplified - should continue the generator
    return pure(result.value);
  });
};

// Interpreters
type InterpreterLog = { type: 'log'; message: string };
type InterpreterResult = { logs: InterpreterLog[]; result: any };

const pureInterpreter = <A,>(program: Free<any, A>): InterpreterResult => {
  const logs: InterpreterLog[] = [];
  
  const interpret = (prog: Free<any, any>): any => {
    switch (prog.tag) {
      case 'Pure': 
        return prog.value;
      case 'Bind':
        const fa = prog.fa;
        switch (fa.tag) {
          case 'Log':
            logs.push({ type: 'log', message: fa.message });
            return interpret(prog.f(fa.next));
          case 'Read':
            logs.push({ type: 'log', message: `Read: ${fa.prompt}` });
            return interpret(prog.f('mocked input'));
          case 'Get':
            return interpret(prog.f({ count: 0 })); // Mock state
          case 'Put':
            logs.push({ type: 'log', message: `State updated: ${JSON.stringify(fa.state)}` });
            return interpret(prog.f(fa.next));
          case 'Get':
          case 'Post':
            logs.push({ type: 'log', message: `HTTP ${fa.tag}: ${fa.url}` });
            return interpret(prog.f({ status: 'mocked' }));
          default:
            return prog;
        }
    }
  };
  
  const result = interpret(program);
  return { logs, result };
};

// Example Programs
const todoProgram = (): Free<any, any> => {
  return flatMap(log('Starting todo app'), () =>
    flatMap(httpGet('/api/todos'), (todos) =>
      flatMap(putState({ todos }), () =>
        flatMap(read('Enter new todo: '), (input) =>
          flatMap(httpPost('/api/todos', { text: input }), (newTodo) =>
            flatMap(getState(), (state) =>
              flatMap(putState({ todos: [...(state as any).todos, newTodo] }), () =>
                pure(newTodo)
              )
            )
          )
        )
      )
    )
  );
};

// Interactive Demo
export const FreeMonadDemo: React.FC = () => {
  const [programResult, setProgramResult] = useState<InterpreterResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runProgram = () => {
    setIsRunning(true);
    const result = pureInterpreter(todoProgram());
    setProgramResult(result);
    setIsRunning(false);
  };

  const simpleLogProgram = flatMap(log('Hello'), () =>
    flatMap(log('World'), () =>
      flatMap(read('What\'s your name?'), (name) =>
        log(`Nice to meet you, ${name}!`)
      )
    )
  );

  const simpleResult = pureInterpreter(simpleLogProgram);

  return (
    <div>
      <h3>Free Monads and Abstract Computation</h3>
      
      <div>
        <h4>Simple Program Example</h4>
        <p>A program that logs, reads input, and responds:</p>
        <pre>{JSON.stringify(simpleResult, null, 2)}</pre>
      </div>

      <div>
        <h4>Complex Todo Program</h4>
        <button onClick={runProgram} disabled={isRunning}>
          {isRunning ? 'Running...' : 'Run Todo Program'}
        </button>
        {programResult && (
          <div>
            <h5>Execution Log:</h5>
            <pre>{JSON.stringify(programResult, null, 2)}</pre>
          </div>
        )}
      </div>

      <div>
        <h4>Free Monad Benefits</h4>
        <ul>
          <li>Separate program structure from interpretation</li>
          <li>Multiple interpreters: Pure, Mock, Real</li>
          <li>Programs as data structures</li>
          <li>Composable effects</li>
          <li>Testable with pure interpreters</li>
        </ul>
      </div>

      <div>
        <h4>DSL Operations</h4>
        <p>• Console: log, read</p>
        <p>• HTTP: get, post</p>
        <p>• State: getState, putState</p>
        <p>• Composed with flatMap for sequencing</p>
      </div>
    </div>
  );
};

export default FreeMonadDemo;