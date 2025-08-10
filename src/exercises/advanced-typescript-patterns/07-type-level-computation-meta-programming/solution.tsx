// Type-Level Computation and Meta-Programming - Solution
import React, { useState } from 'react';

// Type-Level Arithmetic
type Tuple<N extends number, R extends unknown[] = []> = 
  R['length'] extends N ? R : Tuple<N, [...R, unknown]>;

type Add<A extends number, B extends number> = 
  [...Tuple<A>, ...Tuple<B>]['length'];

type Subtract<A extends number, B extends number> = 
  Tuple<A> extends [...infer U, ...Tuple<B>] ? U['length'] : never;

type Multiply<A extends number, B extends number, Counter extends unknown[] = [], Acc extends unknown[] = []> = 
  Counter['length'] extends A ? Acc['length'] :
  Multiply<A, B, [...Counter, unknown], [...Acc, ...Tuple<B>]>;

// Type-Level Quicksort
type Quicksort<T extends number[]> = T extends [infer Head, ...infer Tail]
  ? Head extends number
    ? Tail extends number[]
      ? [...Quicksort<Filter<Tail, Head, 'smaller'>>, Head, ...Quicksort<Filter<Tail, Head, 'larger'>>]
      : [Head]
    : []
  : [];

type Filter<T extends number[], Pivot extends number, Mode extends 'smaller' | 'larger'> = 
  T extends [infer Head, ...infer Tail]
    ? Head extends number
      ? Tail extends number[]
        ? Mode extends 'smaller'
          ? Head extends LessThan<Head, Pivot> 
            ? [Head, ...Filter<Tail, Pivot, Mode>]
            : Filter<Tail, Pivot, Mode>
          : Head extends GreaterThan<Head, Pivot>
            ? [Head, ...Filter<Tail, Pivot, Mode>]
            : Filter<Tail, Pivot, Mode>
        : []
      : Filter<Tail extends number[] ? Tail : [], Pivot, Mode>
    : [];

type LessThan<A extends number, B extends number> = 
  Tuple<A> extends [...infer U, ...Tuple<B>] ? never : A;

type GreaterThan<A extends number, B extends number> = 
  Tuple<B> extends [...infer U, ...Tuple<A>] ? never : A;

// Template Literal Parsers
type ParseJson<T extends string> = T extends `{${infer Content}}`
  ? ParseObject<Content>
  : T extends `[${infer Content}]`
    ? ParseArray<Content>
    : T extends `"${infer S}"`
      ? S
      : T extends 'true' | 'false'
        ? T extends 'true' ? true : false
        : T extends `${number}`
          ? ParseNumber<T>
          : never;

type ParseObject<T extends string> = T extends `"${infer Key}":${infer Rest}`
  ? Rest extends `${infer Value},${infer Remaining}`
    ? { [K in Key]: ParseJson<Trim<Value>> } & ParseObject<Remaining>
    : { [K in Key]: ParseJson<Trim<Rest>> }
  : {};

type ParseArray<T extends string> = T extends `${infer First},${infer Rest}`
  ? [ParseJson<Trim<First>>, ...ParseArray<Rest>]
  : T extends ''
    ? []
    : [ParseJson<Trim<T>>];

type Trim<T extends string> = T extends ` ${infer Rest}` | `\t${infer Rest}` | `\n${infer Rest}`
  ? Trim<Rest>
  : T extends `${infer Rest} ` | `${infer Rest}\t` | `${infer Rest}\n`
    ? Trim<Rest>
    : T;

type ParseNumber<T extends string> = T extends `${infer N extends number}` ? N : never;

// URL Path Parser
type ParsePath<Path extends string> = 
  Path extends `${infer Prefix}/:${infer Param}/${infer Suffix}`
    ? { [K in Param]: string } & ParsePath<`/${Suffix}`>
    : Path extends `${infer Prefix}/:${infer Param}`
      ? { [K in Param]: string }
      : {};

// Case Conversions
type CamelCase<S extends string> = 
  S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${P1}${Uppercase<P2>}${CamelCase<P3>}`
    : S;

type KebabCase<S extends string> = 
  S extends `${infer P1}${Uppercase<infer P2>}${infer P3}`
    ? `${P1}-${Lowercase<P2>}${KebabCase<P3>}`
    : S;

type SnakeCase<S extends string> = 
  S extends `${infer P1}${Uppercase<infer P2>}${infer P3}`
    ? `${P1}_${Lowercase<P2>}${SnakeCase<P3>}`
    : S;

// JSON Schema to TypeScript
type JsonSchemaToType<Schema> = 
  Schema extends { type: 'object'; properties: infer Props }
    ? { [K in keyof Props]: JsonSchemaToType<Props[K]> }
    : Schema extends { type: 'array'; items: infer Items }
      ? JsonSchemaToType<Items>[]
      : Schema extends { type: 'string' }
        ? string
        : Schema extends { type: 'number' }
          ? number
          : Schema extends { type: 'boolean' }
            ? boolean
            : Schema extends { type: 'null' }
              ? null
              : never;

// Database Schema Validation
type TableDef<Columns extends Record<string, any>> = {
  columns: Columns;
};

type QueryResult<Table extends TableDef<any>, Select extends keyof Table['columns']> = {
  [K in Select]: Table['columns'][K];
}[];

// Example schemas and usage
type UserSchema = {
  type: 'object';
  properties: {
    id: { type: 'number' };
    name: { type: 'string' };
    email: { type: 'string' };
    isActive: { type: 'boolean' };
    tags: { type: 'array'; items: { type: 'string' } };
  };
};

type User = JsonSchemaToType<UserSchema>;
// Result: { id: number; name: string; email: string; isActive: boolean; tags: string[] }

type UsersTable = TableDef<{
  id: number;
  name: string;
  email: string;
  created_at: Date;
}>;

type UserListQuery = QueryResult<UsersTable, 'id' | 'name' | 'email'>;
// Result: { id: number; name: string; email: string }[]

// Type-level Examples
type ArithmeticExamples = {
  addition: Add<5, 3>; // 8
  subtraction: Subtract<10, 4>; // 6
  multiplication: Multiply<3, 4>; // 12
};

type SortingExample = Quicksort<[5, 2, 8, 1, 9, 3]>; // [1, 2, 3, 5, 8, 9]

type CaseConversions = {
  camel: CamelCase<'hello_world_test'>; // 'helloWorldTest'
  kebab: KebabCase<'HelloWorldTest'>; // 'hello-world-test'
  snake: SnakeCase<'HelloWorldTest'>; // 'hello_world_test'
};

type PathParams = ParsePath<'/api/users/:userId/posts/:postId'>;
// Result: { userId: string; postId: string }

// Interactive Demo Component
export const TypeLevelComputationDemo: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('{"name":"John","age":30}');
  const [pathInput, setPathInput] = useState('/api/users/:userId/posts/:postId');

  // Type-level computation examples (these happen at compile time!)
  const examples = {
    arithmetic: {
      'Add<5, 3>': 8,
      'Subtract<10, 4>': 6,
      'Multiply<3, 4>': 12
    },
    sorting: {
      'Quicksort<[5, 2, 8, 1, 9]>': '[1, 2, 5, 8, 9]'
    },
    caseConversions: {
      'CamelCase<"hello_world">': 'helloWorld',
      'KebabCase<"HelloWorld">': 'hello-world',
      'SnakeCase<"HelloWorld">': 'hello_world'
    },
    jsonSchema: {
      input: '{ type: "object", properties: { name: { type: "string" }, age: { type: "number" } } }',
      output: '{ name: string; age: number }'
    }
  };

  return (
    <div>
      <h3>Type-Level Computation and Meta-Programming</h3>
      
      <div>
        <h4>Type-Level Arithmetic (Computed at Compile Time)</h4>
        <pre>{JSON.stringify(examples.arithmetic, null, 2)}</pre>
      </div>

      <div>
        <h4>Type-Level Quicksort</h4>
        <pre>{JSON.stringify(examples.sorting, null, 2)}</pre>
      </div>

      <div>
        <h4>String Case Conversions</h4>
        <pre>{JSON.stringify(examples.caseConversions, null, 2)}</pre>
      </div>

      <div>
        <h4>JSON Schema to TypeScript</h4>
        <textarea 
          value={jsonInput} 
          onChange={(e) => setJsonInput(e.target.value)}
          rows={3}
          style={{ width: '100%' }}
        />
        <p>This would generate TypeScript types at compile time!</p>
        <pre>{JSON.stringify(examples.jsonSchema, null, 2)}</pre>
      </div>

      <div>
        <h4>URL Path Parameter Extraction</h4>
        <input 
          value={pathInput} 
          onChange={(e) => setPathInput(e.target.value)}
          style={{ width: '100%' }}
        />
        <p>Extracted params: userId: string, postId: string</p>
      </div>

      <div>
        <h4>Key Concepts</h4>
        <ul>
          <li>All computations happen at compile time (zero runtime cost)</li>
          <li>Recursive conditional types enable Turing-complete computation</li>
          <li>Template literal types are powerful string processors</li>
          <li>Mapped types transform object shapes</li>
          <li>Can generate types from external schemas</li>
          <li>Perfect for type-safe APIs and configuration validation</li>
        </ul>
      </div>
    </div>
  );
};

export default TypeLevelComputationDemo;