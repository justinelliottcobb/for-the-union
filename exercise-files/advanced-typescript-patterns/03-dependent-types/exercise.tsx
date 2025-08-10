// Dependent Types and Value-Level Types
// Master types that depend on values or other types for ultimate compile-time safety

// Learning objectives:
// - Understand dependent types and their relationship to values
// - Implement length-indexed arrays (vectors) for safe indexing
// - Create refinement types with value constraints
// - Build singleton types and literal type programming
// - Design type-level arithmetic and comparisons
// - Implement value-dependent API design patterns
// - Use template literal types for dynamic type generation

// Hints:
// 1. Dependent types blur the line between values and types
// 2. Use template literal types to create types from string values
// 3. Recursive conditional types enable type-level computation
// 4. Branded types can encode value constraints at the type level
// 5. Const assertions preserve literal types for value-dependent typing
// 6. Think of the type system as a functional programming language
// 7. Use mapped types and key remapping for dynamic type construction

import React, { useState, useCallback, useMemo } from 'react';

// TODO: Foundation - Type-Level Arithmetic
// Build a complete type-level number system

// Natural numbers at the type level using tuple length
type Nat = readonly unknown[];
type Zero = readonly [];
type One = readonly [unknown];
type Two = readonly [unknown, unknown];
type Three = readonly [unknown, unknown, unknown];
type Four = readonly [unknown, unknown, unknown, unknown];
type Five = readonly [unknown, unknown, unknown, unknown, unknown];

// Convert number literal to Nat type
type ToNat<N extends number> = 
  N extends 0 ? Zero :
  N extends 1 ? One :
  N extends 2 ? Two :
  N extends 3 ? Three :
  N extends 4 ? Four :
  N extends 5 ? Five :
  // Extend as needed for larger numbers
  readonly unknown[];

// Convert Nat type to number
type ToNumber<N extends Nat> = N['length'];

// Type-level addition
type Add<A extends Nat, B extends Nat> = readonly [...A, ...B];

// Type-level subtraction (limited implementation)
type Subtract<A extends Nat, B extends Nat> = 
  B extends readonly [infer _, ...infer Rest]
    ? A extends readonly [infer __, ...infer ARest]
      ? Rest extends Nat
        ? ARest extends Nat
          ? Subtract<ARest, Rest>
          : never
        : never
      : never
    : A;

// Type-level comparison
type LessThan<A extends Nat, B extends Nat> = 
  A extends B ? false :
  A extends readonly [infer _, ...infer ARest]
    ? B extends readonly [infer __, ...infer BRest]
      ? ARest extends Nat
        ? BRest extends Nat
          ? LessThan<ARest, BRest>
          : never
        : never
      : false
    : true;

type GreaterThan<A extends Nat, B extends Nat> = LessThan<B, A>;
type Equal<A extends Nat, B extends Nat> = A extends B ? B extends A ? true : false : false;

// TODO: Example 1 - Length-Indexed Arrays (Vectors)
// Safe array operations with compile-time length checking

declare const VectorBrand: unique symbol;
type Vector<T, N extends Nat> = readonly T[] & {
  readonly [VectorBrand]: N;
  readonly length: ToNumber<N>;
};

// Vector constructor utilities
const Vector = {
  // Create empty vector
  empty: <T,>(): Vector<T, Zero> => [] as Vector<T, Zero>,

  // Create single-element vector
  singleton: <T,>(value: T): Vector<T, One> => [value] as Vector<T, One>,

  // Create vector from array with length assertion
  fromArray: <T, N extends Nat,>(
    array: readonly T[], 
    _length: N
  ): Vector<T, N> => {
    if (array.length !== (_length as any).length) {
      throw new Error(`Array length mismatch: expected ${(_length as any).length}, got ${array.length}`);
    }
    return array as Vector<T, N>;
  },

  // Safe head - only works on non-empty vectors
  head: <T, N extends Nat,>(
    vector: Vector<T, N>
  ): N extends Zero ? never : T => {
    if (vector.length === 0) {
      throw new Error('Cannot get head of empty vector');
    }
    return vector[0] as N extends Zero ? never : T;
  },

  // Safe tail - reduces length by one
  tail: <T, N extends Nat,>(
    vector: Vector<T, N>
  ): N extends readonly [infer _, ...infer Rest]
    ? Rest extends Nat
      ? Vector<T, Rest>
      : never
    : never => {
    if (vector.length === 0) {
      throw new Error('Cannot get tail of empty vector');
    }
    return vector.slice(1) as any;
  },

  // Safe indexing - prevents out-of-bounds access
  get: <T, N extends Nat, I extends number,>(
    vector: Vector<T, N>,
    index: I
  ): LessThan<ToNat<I>, N> extends true ? T : never => {
    if (index >= vector.length || index < 0) {
      throw new Error(`Index ${index} out of bounds for vector of length ${vector.length}`);
    }
    return vector[index] as any;
  },

  // Prepend element - increases length by one
  prepend: <T, N extends Nat,>(
    element: T,
    vector: Vector<T, N>
  ): Vector<T, Add<One, N>> => 
    [element, ...vector] as Vector<T, Add<One, N>>,

  // Append element - increases length by one
  append: <T, N extends Nat,>(
    vector: Vector<T, N>,
    element: T
  ): Vector<T, Add<N, One>> =>
    [...vector, element] as Vector<T, Add<N, One>>,

  // Concatenate vectors - adds lengths
  concat: <T, A extends Nat, B extends Nat,>(
    vectorA: Vector<T, A>,
    vectorB: Vector<T, B>
  ): Vector<T, Add<A, B>> =>
    [...vectorA, ...vectorB] as Vector<T, Add<A, B>>,

  // Map preserves length
  map: <T, U, N extends Nat,>(
    vector: Vector<T, N>,
    f: (value: T, index: number) => U
  ): Vector<U, N> =>
    vector.map(f) as Vector<U, N>,

  // Zip two vectors of same length
  zip: <T, U, N extends Nat,>(
    vectorA: Vector<T, N>,
    vectorB: Vector<U, N>
  ): Vector<readonly [T, U], N> =>
    vectorA.map((a, i) => [a, vectorB[i]] as const) as Vector<readonly [T, U], N>,

  // Reverse preserves length
  reverse: <T, N extends Nat,>(vector: Vector<T, N>): Vector<T, N> =>
    [...vector].reverse() as Vector<T, N>,

  // Take first n elements (compile-time safe)
  take: <T, N extends Nat, K extends Nat,>(
    vector: Vector<T, N>,
    count: K
  ): LessThan<K, Add<N, One>> extends true ? Vector<T, K> : never => {
    const k = (count as any).length || 0;
    if (k > vector.length) {
      throw new Error(`Cannot take ${k} elements from vector of length ${vector.length}`);
    }
    return vector.slice(0, k) as any;
  },

  // Create vector from repeating element
  replicate: <T, N extends Nat,>(count: N, element: T): Vector<T, N> => {
    const n = (count as any).length || 0;
    return Array.from({ length: n }, () => element) as Vector<T, N>;
  },
};

// TODO: Example 2 - Refinement Types with Value Constraints
// Types that encode value-level constraints

declare const RefinedBrand: unique symbol;
type Refined<T, P extends string> = T & {
  readonly [RefinedBrand]: P;
};

// Positive integers
type PositiveInt = Refined<number, 'positive'>;

// Email addresses
type Email = Refined<string, 'email'>;

// Non-empty strings  
type NonEmptyString = Refined<string, 'non-empty'>;

// Bounded numbers
type Percentage = Refined<number, 'percentage'>;

// URL strings
type URL = Refined<string, 'url'>;

// Safe constructors with runtime validation
const Refined = {
  positiveInt: (value: number): PositiveInt | null =>
    Number.isInteger(value) && value > 0 
      ? value as PositiveInt 
      : null,

  email: (value: string): Email | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? value as Email : null;
  },

  nonEmptyString: (value: string): NonEmptyString | null =>
    value.length > 0 ? value as NonEmptyString : null,

  percentage: (value: number): Percentage | null =>
    value >= 0 && value <= 100 ? value as Percentage : null,

  url: (value: string): URL | null => {
    try {
      new URL(value);
      return value as URL;
    } catch {
      return null;
    }
  },

  // Generic refinement with custom predicate
  refine: <T, P extends string,>(
    value: T,
    predicate: (v: T) => boolean,
    _proof: P
  ): Refined<T, P> | null =>
    predicate(value) ? value as Refined<T, P> : null,

  // Unsafe extraction (use sparingly)
  unsafeExtract: <T, P extends string,>(refined: Refined<T, P>): T =>
    refined as T,
};

// TODO: Example 3 - Singleton Types and Literal Programming
// Types derived from specific values

// String literal utilities
type StringLength<S extends string> = S extends `${string}${infer Rest}` 
  ? Add<One, ToNat<StringLength<Rest>['length']>>
  : Zero;

type StartsWith<S extends string, Prefix extends string> = 
  S extends `${Prefix}${string}` ? true : false;

type EndsWith<S extends string, Suffix extends string> = 
  S extends `${string}${Suffix}` ? true : false;

type Contains<S extends string, Substring extends string> = 
  S extends `${string}${Substring}${string}` ? true : false;

// Template literal type programming
type PascalCase<S extends string> = 
  S extends `${infer First}${infer Rest}` 
    ? `${Uppercase<First>}${Rest}`
    : S;

type CamelCase<S extends string> = 
  S extends `${infer First}${infer Rest}` 
    ? `${Lowercase<First>}${Rest}`
    : S;

type KebabCase<S extends string> = 
  S extends `${infer First}${Capitalize<infer Rest>}` 
    ? `${Lowercase<First>}-${KebabCase<Rest>}`
    : Lowercase<S>;

type SnakeCase<S extends string> = 
  S extends `${infer First}${Capitalize<infer Rest>}` 
    ? `${Lowercase<First>}_${SnakeCase<Rest>}`
    : Lowercase<S>;

// Path manipulation types
type Join<Paths extends readonly string[]> = 
  Paths extends readonly [infer First extends string, ...infer Rest extends readonly string[]]
    ? Rest extends readonly []
      ? First
      : `${First}/${Join<Rest>}`
    : never;

type Split<Path extends string, Delimiter extends string = '/') =
  Path extends `${infer First}${Delimiter}${infer Rest}`
    ? [First, ...Split<Rest, Delimiter>]
    : [Path];

// TODO: Example 4 - Type-Safe Configuration with Dependent Types
// Configuration types that depend on runtime values

// Environment-dependent configuration
type Environment = 'development' | 'staging' | 'production';

type Config<Env extends Environment> = {
  readonly environment: Env;
  readonly database: {
    readonly host: Env extends 'production' ? URL : string;
    readonly port: PositiveInt;
    readonly ssl: Env extends 'production' ? true : boolean;
  };
  readonly logging: {
    readonly level: Env extends 'development' ? 'debug' | 'info' | 'warn' | 'error' : 'info' | 'warn' | 'error';
    readonly destination: Env extends 'production' ? 'file' | 'database' : 'console' | 'file';
  };
  readonly features: {
    readonly debugMode: Env extends 'development' ? true : false;
    readonly metrics: Env extends 'production' ? true : boolean;
  };
};

const ConfigBuilder = {
  create: <Env extends Environment,>(env: Env) => ({
    environment: env,
    
    database: <Host extends string, Port extends number,>(
      host: Env extends 'production' ? URL : Host,
      port: Port
    ) => {
      const validPort = Refined.positiveInt(port);
      if (!validPort) throw new Error(`Invalid port: ${port}`);
      
      return {
        host,
        port: validPort,
        ssl: (env === 'production' ? true : false) as Env extends 'production' ? true : false,
      };
    },

    logging: (
      level: Env extends 'development' ? 'debug' | 'info' | 'warn' | 'error' : 'info' | 'warn' | 'error',
      destination: Env extends 'production' ? 'file' | 'database' : 'console' | 'file'
    ) => ({
      level,
      destination,
    }),

    features: () => ({
      debugMode: (env === 'development' ? true : false) as Env extends 'development' ? true : false,
      metrics: (env === 'production' ? true : false) as Env extends 'production' ? true : boolean,
    }),

    build: (parts: {
      database: Config<Env>['database'];
      logging: Config<Env>['logging'];
      features: Config<Env>['features'];
    }): Config<Env> => ({
      environment: env,
      ...parts,
    }),
  }),
};

// TODO: Example 5 - SQL Query Builder with Type-Level Safety
// Build SQL queries where types depend on the query structure

// Table schema definition
type TableSchema = Record<string, 'string' | 'number' | 'boolean' | 'date'>;

// Type mapping from schema to TypeScript types
type TypeFromSchema<Schema extends TableSchema> = {
  readonly [K in keyof Schema]: 
    Schema[K] extends 'string' ? string :
    Schema[K] extends 'number' ? number :
    Schema[K] extends 'boolean' ? boolean :
    Schema[K] extends 'date' ? Date :
    never;
};

// Example schemas
interface UserSchema extends TableSchema {
  readonly id: 'number';
  readonly name: 'string';
  readonly email: 'string';
  readonly isActive: 'boolean';
  readonly createdAt: 'date';
}

interface OrderSchema extends TableSchema {
  readonly id: 'number';
  readonly userId: 'number';
  readonly amount: 'number';
  readonly status: 'string';
  readonly createdAt: 'date';
}

// Query builder with dependent types
type Query<Schema extends TableSchema, Selected extends keyof Schema = keyof Schema> = {
  readonly schema: Schema;
  readonly selected: readonly Selected[];
  readonly where: Partial<TypeFromSchema<Schema>>;
  readonly orderBy: readonly (keyof Schema)[];
};

type QueryResult<Schema extends TableSchema, Selected extends keyof Schema> = 
  readonly (Pick<TypeFromSchema<Schema>, Selected>)[];

const QueryBuilder = {
  from: <Schema extends TableSchema,>(schema: Schema) => ({
    select: <Fields extends readonly (keyof Schema)[],>(...fields: Fields) => ({
      where: (conditions: Partial<TypeFromSchema<Schema>>) => ({
        orderBy: (...orderFields: readonly (keyof Schema)[]) => ({
          build: (): Query<Schema, Fields[number]> => ({
            schema,
            selected: fields,
            where: conditions,
            orderBy: orderFields,
          }),

          execute: async (): Promise<QueryResult<Schema, Fields[number]>> => {
            // Mock implementation
            console.log('Executing query with conditions:', conditions);
            return [] as QueryResult<Schema, Fields[number]>;
          },
        }),
      }),
    }),
  }),
};

// Usage examples with type safety
const userSchema: UserSchema = {
  id: 'number',
  name: 'string', 
  email: 'string',
  isActive: 'boolean',
  createdAt: 'date',
};

// TODO: Example 6 - State Machine with Dependent Types
// State machines where transitions depend on state values

type StateMachineConfig<States extends string, Events extends string> = {
  readonly initialState: States;
  readonly transitions: Partial<Record<States, Partial<Record<Events, States>>>>;
};

type StateMachine<
  Config extends StateMachineConfig<string, string>,
  CurrentState extends string = Config['initialState']
> = {
  readonly config: Config;
  readonly currentState: CurrentState;
  readonly send: <Event extends string,>(
    event: Event
  ) => Event extends keyof NonNullable<Config['transitions'][CurrentState]>
    ? NonNullable<Config['transitions'][CurrentState]>[Event] extends string
      ? StateMachine<Config, NonNullable<Config['transitions'][CurrentState]>[Event]>
      : never
    : never;
};

const StateMachine = {
  create: <States extends string, Events extends string,>(
    config: StateMachineConfig<States, Events>
  ): StateMachine<typeof config> => ({
    config,
    currentState: config.initialState,
    send: (event) => {
      const transitions = config.transitions[config.initialState as States];
      const nextState = transitions?.[event as Events];
      
      if (!nextState) {
        throw new Error(`No transition for event '${event}' in state '${config.initialState}'`);
      }
      
      return StateMachine.create({
        ...config,
        initialState: nextState,
      }) as any;
    },
  }),
};

// Example: Traffic light state machine
const trafficLightConfig = {
  initialState: 'red' as const,
  transitions: {
    red: { next: 'green' as const },
    green: { next: 'yellow' as const },
    yellow: { next: 'red' as const },
  },
} satisfies StateMachineConfig<'red' | 'green' | 'yellow', 'next'>;

// TODO: React Components demonstrating dependent types

// Vector display component
function VectorDemo() {
  const [numbers, setNumbers] = useState<number[]>([1, 2, 3]);
  const [result, setResult] = useState<string>('');

  const handleVectorOperation = useCallback((operation: string) => {
    try {
      // Create vectors with compile-time length checking
      const vector1 = Vector.fromArray(numbers, numbers as any);
      
      switch (operation) {
        case 'head':
          const head = Vector.head(vector1);
          setResult(`Head: ${head}`);
          break;
          
        case 'tail':
          const tail = Vector.tail(vector1);
          setResult(`Tail: [${tail.join(', ')}]`);
          break;
          
        case 'reverse':
          const reversed = Vector.reverse(vector1);
          setResult(`Reversed: [${reversed.join(', ')}]`);
          break;
          
        case 'prepend':
          const prepended = Vector.prepend(0, vector1);
          setResult(`Prepended 0: [${prepended.join(', ')}]`);
          break;
          
        case 'append':
          const appended = Vector.append(vector1, 4);
          setResult(`Appended 4: [${appended.join(', ')}]`);
          break;
      }
    } catch (error) {
      setResult(`Error: ${(error as Error).message}`);
    }
  }, [numbers]);

  return (
    <div>
      <h3>Length-Indexed Vectors</h3>
      
      <div>
        <strong>Vector:</strong> [{numbers.join(', ')}]
        <div>
          <input
            type="text"
            placeholder="Enter numbers (comma-separated)"
            onChange={(e) => {
              const nums = e.target.value.split(',').map(n => parseInt(n.trim()) || 0).filter(Boolean);
              setNumbers(nums);
            }}
          />
        </div>
      </div>

      <div style={{ margin: '10px 0' }}>
        <button onClick={() => handleVectorOperation('head')}>Get Head</button>
        <button onClick={() => handleVectorOperation('tail')}>Get Tail</button>
        <button onClick={() => handleVectorOperation('reverse')}>Reverse</button>
        <button onClick={() => handleVectorOperation('prepend')}>Prepend 0</button>
        <button onClick={() => handleVectorOperation('append')}>Append 4</button>
      </div>

      {result && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0' }}>
          {result}
        </div>
      )}
    </div>
  );
}

// Refinement types validation component
function RefinementDemo() {
  const [inputs, setInputs] = useState({
    number: '',
    email: '',
    text: '',
    percentage: '',
    url: '',
  });
  
  const [validations, setValidations] = useState<Record<string, string>>({});

  const handleValidate = useCallback(() => {
    const results: Record<string, string> = {};

    const num = parseFloat(inputs.number);
    const positiveInt = Refined.positiveInt(num);
    results.number = positiveInt ? `✅ Valid positive integer: ${positiveInt}` : '❌ Invalid positive integer';

    const email = Refined.email(inputs.email);
    results.email = email ? `✅ Valid email: ${email}` : '❌ Invalid email';

    const nonEmpty = Refined.nonEmptyString(inputs.text);
    results.text = nonEmpty ? `✅ Non-empty string: "${nonEmpty}"` : '❌ Empty string';

    const percentage = Refined.percentage(parseFloat(inputs.percentage));
    results.percentage = percentage ? `✅ Valid percentage: ${percentage}%` : '❌ Invalid percentage (0-100)';

    const url = Refined.url(inputs.url);
    results.url = url ? `✅ Valid URL: ${url}` : '❌ Invalid URL';

    setValidations(results);
  }, [inputs]);

  return (
    <div>
      <h3>Refinement Types Validation</h3>
      
      <div style={{ display: 'grid', gap: '10px' }}>
        <input
          type="number"
          placeholder="Positive integer"
          value={inputs.number}
          onChange={(e) => setInputs(prev => ({ ...prev, number: e.target.value }))}
        />
        
        <input
          type="email"
          placeholder="Email address"
          value={inputs.email}
          onChange={(e) => setInputs(prev => ({ ...prev, email: e.target.value }))}
        />
        
        <input
          type="text"
          placeholder="Non-empty string"
          value={inputs.text}
          onChange={(e) => setInputs(prev => ({ ...prev, text: e.target.value }))}
        />
        
        <input
          type="number"
          placeholder="Percentage (0-100)"
          value={inputs.percentage}
          onChange={(e) => setInputs(prev => ({ ...prev, percentage: e.target.value }))}
        />
        
        <input
          type="url"
          placeholder="URL"
          value={inputs.url}
          onChange={(e) => setInputs(prev => ({ ...prev, url: e.target.value }))}
        />
      </div>

      <button onClick={handleValidate} style={{ margin: '10px 0' }}>
        Validate All
      </button>

      {Object.keys(validations).length > 0 && (
        <div style={{ marginTop: '10px' }}>
          {Object.entries(validations).map(([field, result]) => (
            <div key={field} style={{ margin: '5px 0', fontSize: '14px' }}>
              <strong>{field}:</strong> {result}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Type-safe query builder component
function QueryBuilderDemo() {
  const [results, setResults] = useState<string>('');

  const handleQuery = useCallback(async (queryType: string) => {
    try {
      switch (queryType) {
        case 'users':
          // Type-safe query with dependent types
          const userQuery = QueryBuilder
            .from(userSchema)
            .select('id', 'name', 'email')
            .where({ isActive: true })
            .orderBy('name')
            .build();
            
          setResults(`User Query: SELECT id, name, email WHERE isActive = true ORDER BY name`);
          break;
          
        case 'user-names':
          const nameQuery = QueryBuilder
            .from(userSchema)
            .select('name')
            .where({ isActive: true })
            .orderBy('name')
            .build();
            
          setResults(`Name Query: SELECT name WHERE isActive = true ORDER BY name`);
          break;
      }
    } catch (error) {
      setResults(`Error: ${(error as Error).message}`);
    }
  }, []);

  return (
    <div>
      <h3>Type-Safe Query Builder</h3>
      
      <div style={{ margin: '10px 0' }}>
        <button onClick={() => handleQuery('users')}>
          Query Active Users
        </button>
        <button onClick={() => handleQuery('user-names')}>
          Query User Names Only
        </button>
      </div>

      {results && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', fontFamily: 'monospace' }}>
          {results}
        </div>
      )}
    </div>
  );
}

// Main app component
function App() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Dependent Types and Value-Level Types</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <VectorDemo />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <RefinementDemo />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <QueryBuilderDemo />
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Dependent Types Concepts Demonstrated:</h3>
        <ul>
          <li><strong>Length-Indexed Arrays:</strong> Vectors with compile-time length tracking</li>
          <li><strong>Type-Level Arithmetic:</strong> Addition, subtraction, comparisons at type level</li>
          <li><strong>Refinement Types:</strong> Value constraints encoded in types</li>
          <li><strong>Singleton Types:</strong> Types derived from specific string/number literals</li>
          <li><strong>Template Literals:</strong> Dynamic type generation from string patterns</li>
          <li><strong>Value-Dependent APIs:</strong> Configuration and query builders</li>
          <li><strong>State Machines:</strong> Transitions that depend on current state</li>
          <li><strong>Type-Safe SQL:</strong> Query builders with schema-dependent result types</li>
        </ul>
      </div>
    </div>
  );
}

// Export everything for testing and further exercises
export {
  App,
  VectorDemo,
  RefinementDemo,
  QueryBuilderDemo,
  Vector,
  Refined,
  ConfigBuilder,
  QueryBuilder,
  StateMachine,
  trafficLightConfig,
  userSchema,
  type Vector as VectorType,
  type Refined as RefinedType,
  type Config,
  type Query,
  type QueryResult,
  type StateMachine as StateMachineType,
  type StateMachineConfig,
  type Nat,
  type Zero,
  type One,
  type Add,
  type Subtract,
  type LessThan,
  type GreaterThan,
  type Equal,
  type ToNat,
  type ToNumber,
  type PositiveInt,
  type Email,
  type NonEmptyString,
  type Percentage,
  type URL,
  type StringLength,
  type StartsWith,
  type EndsWith,
  type Contains,
  type PascalCase,
  type CamelCase,
  type KebabCase,
  type SnakeCase,
  type Join,
  type Split,
  type TableSchema,
  type TypeFromSchema,
  type UserSchema,
  type OrderSchema,
};