// Profunctors and Variance Patterns - Solution
import React, { useState } from 'react';

// Core Profunctor Infrastructure
type Profunctor2 = string; // Kind marker

interface HKT2<P extends Profunctor2, A, B> {
  readonly _P: P;
  readonly _A: A;
  readonly _B: B;
}

interface Profunctor<P extends Profunctor2> {
  dimap<A, B, C, D>(
    pab: HKT2<P, A, B>,
    f: (c: C) => A,
    g: (b: B) => D
  ): HKT2<P, C, D>;
}

// Function Profunctor
type FunctionHKT<A, B> = (a: A) => B;

declare module './solution' {
  interface HKT2Registry {
    Function: FunctionHKT<any, any>;
  }
}

const functionProfunctor: Profunctor<'Function'> = {
  dimap: (fab, f, g) => (c: any) => g(fab(f(c)))
};

// Strong Profunctor (for product types)
interface Strong<P extends Profunctor2> extends Profunctor<P> {
  first<A, B, C>(pab: HKT2<P, A, B>): HKT2<P, [A, C], [B, C]>;
  second<A, B, C>(pab: HKT2<P, A, B>): HKT2<P, [C, A], [C, B]>;
}

const functionStrong: Strong<'Function'> = {
  ...functionProfunctor,
  first: (fab) => ([a, c]: [any, any]) => [fab(a), c],
  second: (fab) => ([c, a]: [any, any]) => [c, fab(a)]
};

// Lens using Profunctor encoding
type Lens<S, T, A, B> = <P extends keyof Strong,>(
  P: Strong<P>
) => (pab: HKT2<P, A, B>) => HKT2<P, S, T>;

type User = { name: string; age: number; email: string };

const nameLens: Lens<User, User, string, string> = (P) => (pab) =>
  P.dimap(
    P.first(pab),
    (user: User) => [user.name, { age: user.age, email: user.email }],
    ([newName, rest]: [string, Omit<User, 'name'>]) => ({ ...rest, name: newName })
  ) as any;

// Parser Profunctor
type Parser<I, O> = {
  parse: (input: I) => { success: true; value: O; rest: I } | { success: false; error: string };
};

const parserProfunctor: Profunctor<'Parser'> = {
  dimap: (parser, f, g) => ({
    parse: (input: any) => {
      const mapped = f(input);
      const result = parser.parse(mapped);
      if (result.success) {
        return {
          success: true,
          value: g(result.value),
          rest: result.rest
        };
      }
      return result;
    }
  })
};

// Simple parsers
const stringParser: Parser<string, string> = {
  parse: (input: string) => ({ success: true, value: input, rest: '' })
};

const numberParser: Parser<string, number> = {
  parse: (input: string) => {
    const num = parseInt(input);
    if (isNaN(num)) {
      return { success: false, error: 'Not a number' };
    }
    return { success: true, value: num, rest: '' };
  }
};

// Data Transformation Pipeline
type Pipeline<I, O> = {
  transform: (input: I) => O;
};

const pipelineProfunctor: Profunctor<'Pipeline'> = {
  dimap: (pipeline, f, g) => ({
    transform: (input: any) => g(pipeline.transform(f(input)))
  })
};

// Example pipeline
const stringToUpperPipeline: Pipeline<string, string> = {
  transform: (s: string) => s.toUpperCase()
};

// Interactive Demo Component
export const ProfunctorDemo: React.FC = () => {
  const [input, setInput] = useState('hello world');
  const [user, setUser] = useState<User>,({ name: 'John', age: 30, email: 'john@example.com' });

  // Function profunctor demo
  const addOne = (x: number) => x + 1;
  const stringToNumberPlusOne = functionProfunctor.dimap(
    addOne,
    (s: string) => parseInt(s),
    (n: number) => n.toString()
  );

  // Parser demo
  const result = numberParser.parse(input);
  
  // Pipeline demo
  const processedInput = stringToUpperPipeline.transform(input);

  // Lens demo (simplified)
  const updateName = (newName: string) => {
    setUser({ ...user, name: newName });
  };

  return (
    <div>
      <h3>Profunctors and Variance Patterns</h3>
      
      <div>
        <h4>Function Profunctor</h4>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text/number"
        />
        <p>Transformed function result: {stringToNumberPlusOne(input)}</p>
      </div>

      <div>
        <h4>Parser Profunctor</h4>
        <p>Parse result: {JSON.stringify(result)}</p>
      </div>

      <div>
        <h4>Pipeline Profunctor</h4>
        <p>Processed input: {processedInput}</p>
      </div>

      <div>
        <h4>Lens Example</h4>
        <p>Current user: {JSON.stringify(user)}</p>
        <input 
          value={user.name}
          onChange={(e) => updateName(e.target.value)}
          placeholder="Update name"
        />
      </div>

      <div>
        <h4>Profunctor Laws</h4>
        <p>• Contravariant in first argument</p>
        <p>• Covariant in second argument</p>
        <p>• dimap(id, id) = id</p>
        <p>• dimap(f ∘ g, h ∘ i) = dimap(g, h) ∘ dimap(f, i)</p>
      </div>
    </div>
  );
};

export default ProfunctorDemo;