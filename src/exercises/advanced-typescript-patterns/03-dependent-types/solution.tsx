// Dependent Types and Value-Level Types - Solution
import React, { useState } from 'react';

// Length-Indexed Arrays (Vectors)
type Tuple<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [...R, T]>;

type Vector<T, N extends number> = {
  readonly length: N;
  readonly data: Tuple<T, N>;
};

// Safe vector construction
const vector = <T, N extends number,>(data: Tuple<T, N>): Vector<T, N> => ({
  length: data.length as N,
  data
});

// Type-Level Arithmetic
type Add<A extends number, B extends number> = 
  [...Tuple<unknown, A>, ...Tuple<unknown, B>]['length'] extends number ? 
  [...Tuple<unknown, A>, ...Tuple<unknown, B>]['length'] : never;

type Sub<A extends number, B extends number> = 
  A extends number ? B extends number ?
    Tuple<unknown, A> extends [...infer U, ...Tuple<unknown, B>] ?
      U['length'] : never : never : never;

// Refinement Types
type PositiveInt = number & { readonly _refinement: 'positive' };
type NonEmptyString = string & { readonly _refinement: 'non-empty' };
type ValidEmail = string & { readonly _refinement: 'email' };

const createPositiveInt = (n: number): PositiveInt | null => 
  n > 0 ? n as PositiveInt : null;

const createNonEmptyString = (s: string): NonEmptyString | null => 
  s.length > 0 ? s as NonEmptyString : null;

const createValidEmail = (s: string): ValidEmail | null => 
  s.includes('@') && s.includes('.') ? s as ValidEmail : null;

// Template Literal Programming
type CamelCase<S extends string> = 
  S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${P1}${Uppercase<P2>}${CamelCase<P3>}`
    : S;

type KebabCase<S extends string> = 
  S extends `${infer P1}${Uppercase<infer P2>}${infer P3}`
    ? `${P1}-${Lowercase<P2>}${KebabCase<P3>}`
    : S;

type Join<T extends readonly string[], D extends string = '/'> = 
  T extends readonly [infer F, ...infer R]
    ? F extends string
      ? R extends readonly string[]
        ? R['length'] extends 0
          ? F
          : `${F}${D}${Join<R, D>}`
        : never
      : never
    : never;

// Environment-Dependent Configuration
type Environment = 'development' | 'production' | 'test';

type Config<E extends Environment> = {
  environment: E;
  database: {
    host: string;
    port: number;
  };
} & (E extends 'production' ? {
  security: {
    https: true;
    cors: string[];
    apiKey: string;
  };
} : {});

const createConfig = <E extends Environment,>(env: E): Config<E> => {
  const baseConfig = {
    environment: env,
    database: {
      host: 'localhost',
      port: 5432
    }
  };

  if (env === 'production') {
    return {
      ...baseConfig,
      security: {
        https: true,
        cors: ['https://myapp.com'],
        apiKey: 'prod-key'
      }
    } as Config<E>;
  }

  return baseConfig as Config<E>;
};

// Interactive Demo
export const DependentTypesDemo: React.FC = () => {
  const [input, setInput] = useState('');

  // Vector example
  const vec3 = vector([1, 2, 3] as const);
  const vec2 = vector([4, 5] as const);
  
  // Type-level computation examples
  type Sum = Add<3, 2>; // 5
  type Diff = Sub<5, 2>; // 3
  
  // Template literal examples
  type CamelResult = CamelCase<'hello_world_test'>; // 'helloWorldTest'
  type KebabResult = KebabCase<'HelloWorldTest'>; // 'hello-world-test'
  type PathResult = Join<['api', 'users', 'profile']>; // 'api/users/profile'
  
  // Refinement validation
  const positiveInt = createPositiveInt(42);
  const nonEmptyStr = createNonEmptyString(input);
  const validEmail = createValidEmail(input);
  
  // Environment configs
  const devConfig = createConfig('development');
  const prodConfig = createConfig('production');

  return (
    <div>
      <h3>Dependent Types Demo</h3>
      
      <div>
        <h4>Length-Indexed Vectors</h4>
        <p>Vector3: [{vec3.data.join(', ')}] (length: {vec3.length})</p>
        <p>Vector2: [{vec2.data.join(', ')}] (length: {vec2.length})</p>
      </div>

      <div>
        <h4>Template Literal Programming</h4>
        <p>CamelCase example: 'hello_world_test' → 'helloWorldTest'</p>
        <p>KebabCase example: 'HelloWorldTest' → 'hello-world-test'</p>
        <p>Join example: ['api', 'users', 'profile'] → 'api/users/profile'</p>
      </div>

      <div>
        <h4>Refinement Types</h4>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Test refinement types"
        />
        <p>Positive int (42): {positiveInt ? '✓ Valid' : '✗ Invalid'}</p>
        <p>Non-empty string: {nonEmptyStr ? '✓ Valid' : '✗ Invalid'}</p>
        <p>Valid email: {validEmail ? '✓ Valid' : '✗ Invalid'}</p>
      </div>

      <div>
        <h4>Environment Configs</h4>
        <pre>{JSON.stringify(devConfig, null, 2)}</pre>
        <pre>{JSON.stringify(prodConfig, null, 2)}</pre>
      </div>
    </div>
  );
};

export default DependentTypesDemo;