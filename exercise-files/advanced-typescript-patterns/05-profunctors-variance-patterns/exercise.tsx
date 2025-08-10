// Profunctors and Variance Patterns
// Master covariance, contravariance, and invariance to build flexible, composable abstractions

// Learning objectives:
// - Understand variance: covariant, contravariant, and invariant functors
// - Implement Profunctors that are contravariant in input, covariant in output
// - Build Strong profunctors with additional structure
// - Create Choice profunctors for sum type handling
// - Design Optics (Lens, Prism, Traversal) using profunctor encoding
// - Implement data transformation pipelines with profunctor composition
// - Build type-safe parsers and serializers using profunctor patterns

// Hints:
// 1. Profunctors abstract over functions A -> B, being contravariant in A, covariant in B
// 2. Use HKT infrastructure to create generic profunctor abstractions
// 3. Strong profunctors can handle product types (tuples, records)
// 4. Choice profunctors can handle sum types (unions, Either)
// 5. Optics are profunctor-encoded data accessors
// 6. Think of profunctors as "bidirectional" functors
// 7. Compose profunctors to build complex data transformation pipelines

import React, { useState, useCallback, useMemo } from 'react';

// TODO: HKT Infrastructure for Profunctors
// Extend our HKT system to support profunctors (two type parameters)

interface HKTRegistry {
  readonly Function: (input: any) => any;
  readonly Tagged: { tag: any; value: any };
  readonly Star: { run: (input: any) => any };
  readonly Forget: any;
}

// Two-parameter HKT for profunctors
type HKT2<F extends keyof HKTRegistry, A, B> = (HKTRegistry & {
  readonly [K in F]: (arg1: A, arg2: B) => any;
})[F] extends (arg1: any, arg2: any) => infer R ? R : never;

// Profunctor brand for type tracking
declare const ProfunctorBrand: unique symbol;
type Prof<F extends keyof HKTRegistry, A, B> = HKT2<F, A, B> & {
  readonly [ProfunctorBrand]: { F: F; A: A; B: B };
};

// TODO: Core Profunctor Type Classes

// Basic Profunctor - contravariant in first argument, covariant in second
interface Profunctor<F extends keyof HKTRegistry> {
  readonly dimap: <A, B, C, D,>(
    f: (c: C) => A,  // Contravariant function
    g: (b: B) => D,  // Covariant function
    prof: Prof<F, A, B>
  ) => Prof<F, C, D>;
  
  readonly lmap: <A, B, C,>(
    f: (c: C) => A,
    prof: Prof<F, A, B>
  ) => Prof<F, C, B>;
  
  readonly rmap: <A, B, D,>(
    g: (b: B) => D,
    prof: Prof<F, A, B>
  ) => Prof<F, A, D>;
}

// Strong Profunctor - can handle products (pairs, tuples, records)
interface Strong<F extends keyof HKTRegistry> extends Profunctor<F> {
  readonly first: <A, B, C,>(
    prof: Prof<F, A, B>
  ) => Prof<F, readonly [A, C], readonly [B, C]>;
  
  readonly second: <A, B, C,>(
    prof: Prof<F, A, B>
  ) => Prof<F, readonly [C, A], readonly [C, B]>;
}

// Choice Profunctor - can handle sums (Either, union types)
interface Choice<F extends keyof HKTRegistry> extends Profunctor<F> {
  readonly left: <A, B, C,>(
    prof: Prof<F, A, B>
  ) => Prof<F, Either<A, C>, Either<B, C>>;
  
  readonly right: <A, B, C,>(
    prof: Prof<F, A, B>
  ) => Prof<F, Either<C, A>, Either<C, B>>;
}

// Either type for Choice profunctor
type Either<L, R> = 
  | { readonly _tag: 'Left'; readonly left: L }
  | { readonly _tag: 'Right'; readonly right: R };

const Either = {
  left: <L, R = never,>(value: L): Either<L, R> => ({
    _tag: 'Left' as const,
    left: value,
  }),
  
  right: <L = never, R = unknown,>(value: R): Either<L, R> => ({
    _tag: 'Right' as const,
    right: value,
  }),
  
  isLeft: <L, R,>(either: Either<L, R>): either is Either<L, R> & { _tag: 'Left' } =>
    either._tag === 'Left',
    
  isRight: <L, R,>(either: Either<L, R>): either is Either<L, R> & { _tag: 'Right' } =>
    either._tag === 'Right',
    
  fold: <L, R, T,>(either: Either<L, R>, onLeft: (l: L) => T, onRight: (r: R) => T): T =>
    Either.isLeft(either) ? onLeft(either.left) : onRight(either.right),
};

// TODO: Example 1 - Function Profunctor
// Functions are the canonical profunctor

declare module './exercise.tsx' {
  interface HKTRegistry {
    readonly Function: (input: any) => any;
  }
}

type FunctionProf<A, B> = Prof<'Function', A, B> & ((input: A) => B);

const FunctionProfunctor: Profunctor<'Function'> = {
  dimap: <A, B, C, D,>(
    f: (c: C) => A,
    g: (b: B) => D,
    prof: FunctionProf<A, B>
  ): FunctionProf<C, D> => {
    return ((c: C) => g(prof(f(c)))) as FunctionProf<C, D>;
  },
  
  lmap: <A, B, C,>(
    f: (c: C) => A,
    prof: FunctionProf<A, B>
  ): FunctionProf<C, B> => {
    return ((c: C) => prof(f(c))) as FunctionProf<C, B>;
  },
  
  rmap: <A, B, D,>(
    g: (b: B) => D,
    prof: FunctionProf<A, B>
  ): FunctionProf<A, D> => {
    return ((a: A) => g(prof(a))) as FunctionProf<A, D>;
  },
};

const FunctionStrong: Strong<'Function'> = {
  ...FunctionProfunctor,
  
  first: <A, B, C,>(
    prof: FunctionProf<A, B>
  ): FunctionProf<readonly [A, C], readonly [B, C]> => {
    return (([a, c]: readonly [A, C]) => [prof(a), c] as const) as FunctionProf<readonly [A, C], readonly [B, C]>;
  },
  
  second: <A, B, C,>(
    prof: FunctionProf<A, B>
  ): FunctionProf<readonly [C, A], readonly [C, B]> => {
    return (([c, a]: readonly [C, A]) => [c, prof(a)] as const) as FunctionProf<readonly [C, A], readonly [C, B]>;
  },
};

const FunctionChoice: Choice<'Function'> = {
  ...FunctionProfunctor,
  
  left: <A, B, C,>(
    prof: FunctionProf<A, B>
  ): FunctionProf<Either<A, C>, Either<B, C>> => {
    return ((either: Either<A, C>) =>
      Either.isLeft(either) 
        ? Either.left(prof(either.left))
        : Either.right(either.right)
    ) as FunctionProf<Either<A, C>, Either<B, C>>;
  },
  
  right: <A, B, C,>(
    prof: FunctionProf<A, B>
  ): FunctionProf<Either<C, A>, Either<C, B>> => {
    return ((either: Either<C, A>) =>
      Either.isLeft(either)
        ? Either.left(either.left)
        : Either.right(prof(either.right))
    ) as FunctionProf<Either<C, A>, Either<C, B>>;
  },
};

// TODO: Example 2 - Tagged Profunctor
// Tagged values that carry their input type as metadata

declare module './exercise.tsx' {
  interface HKTRegistry {
    readonly Tagged: { tag: any; value: any };
  }
}

type TaggedProf<A, B> = Prof<'Tagged', A, B> & {
  readonly tag: A;
  readonly value: B;
};

const Tagged = {
  create: <A, B,>(tag: A, value: B): TaggedProf<A, B> => ({
    tag,
    value,
    [ProfunctorBrand]: { F: 'Tagged' as const, A: tag, B: value },
  } as TaggedProf<A, B>),
  
  retag: <A, B, C,>(tagged: TaggedProf<A, B>, newTag: C): TaggedProf<C, B> => ({
    tag: newTag,
    value: tagged.value,
    [ProfunctorBrand]: { F: 'Tagged' as const, A: newTag, B: tagged.value },
  } as TaggedProf<C, B>),
};

const TaggedProfunctor: Profunctor<'Tagged'> = {
  dimap: <A, B, C, D,>(
    f: (c: C) => A,
    g: (b: B) => D,
    prof: TaggedProf<A, B>
  ): TaggedProf<C, D> => {
    // Note: We can't actually compute f(c) without a C value
    // This demonstrates the theoretical nature of some profunctor operations
    return Tagged.create(f as any, g(prof.value));
  },
  
  lmap: <A, B, C,>(
    f: (c: C) => A,
    prof: TaggedProf<A, B>
  ): TaggedProf<C, B> => {
    return Tagged.create(f as any, prof.value);
  },
  
  rmap: <A, B, D,>(
    g: (b: B) => D,
    prof: TaggedProf<A, B>
  ): TaggedProf<A, D> => {
    return Tagged.create(prof.tag, g(prof.value));
  },
};

// TODO: Example 3 - Star Profunctor 
// Wraps functions A -> F<B> for effectful computations

declare module './exercise.tsx' {
  interface HKTRegistry {
    readonly Star: { run: (input: any) => any };
  }
}

type StarProf<F, A, B> = Prof<'Star', A, B> & {
  readonly run: (input: A) => F;
};

const Star = {
  create: <F, A, B,>(run: (input: A) => F): StarProf<F, A, B> => ({
    run,
    [ProfunctorBrand]: { F: 'Star' as const, A: undefined as A, B: undefined as B },
  } as StarProf<F, A, B>),
};

// Star profunctor for Maybe effects
type MaybeStarProf<A, B> = StarProf<Maybe<B>, A, B>;

type Maybe<A> = A | null | undefined;

const MaybeStar = {
  create: <A, B,>(run: (input: A) => Maybe<B>): MaybeStarProf<A, B> =>
    Star.create(run) as MaybeStarProf<A, B>,
    
  // Kleisli composition for Maybe
  compose: <A, B, C,>(
    f: MaybeStarProf<A, B>,
    g: MaybeStarProf<B, C>
  ): MaybeStarProf<A, C> =>
    MaybeStar.create((a: A) => {
      const b = f.run(a);
      return b != null ? g.run(b) : null;
    }),
};

// TODO: Example 4 - Forget Profunctor
// Extracts values using a Monoid, "forgetting" the output type

declare module './exercise.tsx' {
  interface HKTRegistry {
    readonly Forget: any;
  }
}

interface Monoid<A> {
  readonly empty: A;
  readonly concat: (x: A, y: A) => A;
}

type ForgetProf<M, A, B> = Prof<'Forget', A, B> & {
  readonly run: (input: A) => M;
};

const Forget = {
  create: <M, A, B,>(run: (input: A) => M): ForgetProf<M, A, B> => ({
    run,
    [ProfunctorBrand]: { F: 'Forget' as const, A: undefined as A, B: undefined as B },
  } as ForgetProf<M, A, B>),
};

// Common monoids
const StringMonoid: Monoid<string> = {
  empty: '',
  concat: (x, y) => x + y,
};

const NumberSumMonoid: Monoid<number> = {
  empty: 0,
  concat: (x, y) => x + y,
};

const NumberProductMonoid: Monoid<number> = {
  empty: 1,
  concat: (x, y) => x * y,
};

const ArrayMonoid = <T>(): Monoid<readonly T[]> => ({
  empty: [],
  concat: (x, y) => [...x, ...y],
});

// TODO: Example 5 - Optics using Profunctor Encoding
// Lens, Prism, and Traversal implemented as profunctor transformers

// Lens type - focuses on a part of a structure
type Lens<S, A> = <P extends keyof HKTRegistry>(
  profunctor: Strong<P>
) => (prof: Prof<P, A, A>) => Prof<P, S, S>;

// Prism type - focuses on a case of a sum type
type Prism<S, A> = <P extends keyof HKTRegistry>(
  profunctor: Choice<P>
) => (prof: Prof<P, A, A>) => Prof<P, S, S>;

// Lens constructors
const Lens = {
  // Create a lens from getter and setter
  create: <S, A,>(
    get: (s: S) => A,
    set: (a: A) => (s: S) => S
  ): Lens<S, A> => 
    <P extends keyof HKTRegistry>(profunctor: Strong<P>) =>
      (prof: Prof<P, A, A>) => {
        const mapped = profunctor.dimap(
          (s: S) => [get(s), s] as const,
          ([a, s]: readonly [A, S]) => set(a)(s),
          profunctor.first(prof)
        );
        return mapped;
      },

  // Property lens for objects
  prop: <S, K extends keyof S,>(key: K): Lens<S, S[K]> =>
    Lens.create(
      (s: S) => s[key],
      (a: S[K]) => (s: S) => ({ ...s, [key]: a })
    ),

  // Index lens for arrays
  index: <T,>(i: number): Lens<readonly T[], T | undefined> =>
    Lens.create(
      (arr: readonly T[]) => arr[i],
      (value: T | undefined) => (arr: readonly T[]) => {
        if (value === undefined) return arr;
        const newArr = [...arr];
        newArr[i] = value;
        return newArr;
      }
    ),

  // Compose lenses
  compose: <S, A, B,>(
    lens1: Lens<S, A>,
    lens2: Lens<A, B>
  ): Lens<S, B> =>
    <P extends keyof HKTRegistry>(profunctor: Strong<P>) =>
      (prof: Prof<P, B, B>) =>
        lens1(profunctor)(lens2(profunctor)(prof)),

  // View through a lens (using Forget profunctor)
  view: <S, A,>(lens: Lens<S, A>) => (s: S): A => {
    const forget = Forget.create((a: A) => a);
    const applied = lens({
      ...TaggedProfunctor,
      first: <X, Y, Z,>(prof: ForgetProf<X, Y, Z>) =>
        Forget.create(([y, _]: readonly [Y, unknown]) => prof.run(y)),
      second: <X, Y, Z,>(prof: ForgetProf<X, Y, Z>) =>
        Forget.create(([_, y]: readonly [unknown, Y]) => prof.run(y)),
    } as Strong<'Forget'>)(forget as any);
    return (applied as ForgetProf<A, S, S>).run(s);
  },

  // Set through a lens (using Function profunctor)
  set: <S, A,>(lens: Lens<S, A>) => (a: A) => (s: S): S => {
    const identity = ((x: A) => a) as FunctionProf<A, A>;
    const applied = lens(FunctionStrong)(identity);
    return (applied as FunctionProf<S, S>)(s);
  },

  // Over/modify through a lens
  over: <S, A,>(lens: Lens<S, A>) => (f: (a: A) => A) => (s: S): S => {
    const mapper = f as FunctionProf<A, A>;
    const applied = lens(FunctionStrong)(mapper);
    return (applied as FunctionProf<S, S>)(s);
  },
};

// TODO: Example 6 - Data Processing Pipeline with Profunctors
// Build composable data transformation pipelines

interface User {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly age: number;
  readonly isActive: boolean;
  readonly roles: readonly string[];
  readonly preferences: {
    readonly theme: 'light' | 'dark';
    readonly language: string;
    readonly notifications: boolean;
  };
}

interface UserSummary {
  readonly displayName: string;
  readonly contactInfo: string;
  readonly accessLevel: 'admin' | 'user' | 'guest';
  readonly settings: {
    readonly darkMode: boolean;
    readonly locale: string;
  };
}

// Pipeline stages using profunctor composition
const DataPipeline = {
  // Validation stage
  validateUser: MaybeStar.create((data: unknown): Maybe<User> => {
    if (
      typeof data === 'object' && 
      data !== null &&
      'id' in data && 
      'name' in data && 
      'email' in data
    ) {
      return data as User;
    }
    return null;
  }),

  // Transformation stage
  transformToSummary: MaybeStar.create((user: User): Maybe<UserSummary> => {
    if (!user.isActive) return null;
    
    return {
      displayName: user.name,
      contactInfo: user.email,
      accessLevel: user.roles.includes('admin') ? 'admin' : 
                  user.roles.includes('user') ? 'user' : 'guest',
      settings: {
        darkMode: user.preferences.theme === 'dark',
        locale: user.preferences.language,
      },
    };
  }),

  // Enrichment stage
  enrichSummary: MaybeStar.create((summary: UserSummary): Maybe<UserSummary & { timestamp: Date }> => ({
    ...summary,
    timestamp: new Date(),
  })),

  // Complete pipeline
  processUser: (() => {
    const stage1 = DataPipeline.validateUser;
    const stage2 = MaybeStar.compose(stage1, DataPipeline.transformToSummary);
    const stage3 = MaybeStar.compose(stage2, DataPipeline.enrichSummary);
    return stage3;
  })(),
};

// TODO: Example 7 - Parser Combinator using Strong Profunctor
// Build composable parsers using profunctor patterns

type Parser<A> = {
  readonly parse: (input: string) => readonly [A, string] | null;
};

const Parser = {
  create: <A,>(parse: (input: string) => readonly [A, string] | null): Parser<A> => ({
    parse,
  }),

  // Basic parsers
  string: (expected: string): Parser<string> =>
    Parser.create((input) => {
      if (input.startsWith(expected)) {
        return [expected, input.slice(expected.length)];
      }
      return null;
    }),

  regex: (pattern: RegExp, group = 0): Parser<string> =>
    Parser.create((input) => {
      const match = input.match(pattern);
      if (match && match.index === 0) {
        const matched = match[group];
        return [matched, input.slice(match[0].length)];
      }
      return null;
    }),

  number: (): Parser<number> =>
    Parser.create((input) => {
      const match = input.match(/^-?\d+(\.\d+)?/);
      if (match) {
        const num = parseFloat(match[0]);
        return [num, input.slice(match[0].length)];
      }
      return null;
    }),

  // Parser combinators
  map: <A, B,>(parser: Parser<A>, f: (a: A) => B): Parser<B> =>
    Parser.create((input) => {
      const result = parser.parse(input);
      if (result) {
        const [value, remaining] = result;
        return [f(value), remaining];
      }
      return null;
    }),

  chain: <A, B,>(parser: Parser<A>, f: (a: A) => Parser<B>): Parser<B> =>
    Parser.create((input) => {
      const result = parser.parse(input);
      if (result) {
        const [value, remaining] = result;
        return f(value).parse(remaining);
      }
      return null;
    }),

  sequence: <A, B,>(parserA: Parser<A>, parserB: Parser<B>): Parser<readonly [A, B]> =>
    Parser.create((input) => {
      const resultA = parserA.parse(input);
      if (resultA) {
        const [valueA, remainingA] = resultA;
        const resultB = parserB.parse(remainingA);
        if (resultB) {
          const [valueB, remainingB] = resultB;
          return [[valueA, valueB], remainingB];
        }
      }
      return null;
    }),

  alternative: <A,>(parser1: Parser<A>, parser2: Parser<A>): Parser<A> =>
    Parser.create((input) => {
      const result1 = parser1.parse(input);
      if (result1) return result1;
      return parser2.parse(input);
    }),

  many: <A,>(parser: Parser<A>): Parser<readonly A[]> =>
    Parser.create((input) => {
      const results: A[] = [];
      let remaining = input;
      
      while (true) {
        const result = parser.parse(remaining);
        if (result) {
          const [value, newRemaining] = result;
          results.push(value);
          remaining = newRemaining;
        } else {
          break;
        }
      }
      
      return [results, remaining];
    }),

  optional: <A,>(parser: Parser<A>): Parser<A | null> =>
    Parser.create((input) => {
      const result = parser.parse(input);
      return result || [null, input];
    }),
};

// JSON parser using parser combinators
const JsonParser = {
  whitespace: Parser.regex(/^\s*/),
  
  string: (() => {
    const escaped = Parser.regex(/^"([^"\\]|\\.)*"/);
    return Parser.map(escaped, (s) => JSON.parse(s));
  })(),
  
  number: Parser.number(),
  
  boolean: Parser.alternative(
    Parser.map(Parser.string('true'), () => true),
    Parser.map(Parser.string('false'), () => false)
  ),
  
  null: Parser.map(Parser.string('null'), () => null),

  // Recursive parsers would need more sophisticated setup
  // This is a simplified example
  value: (() => {
    const value: Parser<any> = Parser.alternative(
      JsonParser.string,
      Parser.alternative(
        JsonParser.number,
        Parser.alternative(
          JsonParser.boolean,
          JsonParser.null
        )
      )
    );
    return value;
  })(),
};

// TODO: React Components demonstrating Profunctor concepts

// Lens demo component
function LensDemo() {
  const [user, setUser] = useState<User>({
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    isActive: true,
    roles: ['user'],
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true,
    },
  });

  // Define lenses
  const nameLens = Lens.prop('name' as keyof User);
  const emailLens = Lens.prop('email' as keyof User);
  const preferencesLens = Lens.prop('preferences' as keyof User);
  const themeLens = Lens.prop('theme' as keyof User['preferences']);
  
  // Composed lens for nested property
  const userThemeLens = Lens.compose(preferencesLens, themeLens);

  const handleNameChange = useCallback((newName: string) => {
    setUser(Lens.set(nameLens)(newName));
  }, []);

  const handleEmailChange = useCallback((newEmail: string) => {
    setUser(Lens.set(emailLens)(newEmail));
  }, []);

  const toggleTheme = useCallback(() => {
    setUser(Lens.over(userThemeLens)((theme) => theme === 'light' ? 'dark' : 'light'));
  }, []);

  // View values using lenses
  const currentName = Lens.view(nameLens)(user);
  const currentEmail = Lens.view(emailLens)(user);
  const currentTheme = Lens.view(userThemeLens)(user);

  return (
    <div>
      <h3>Lens Profunctor Demo</h3>
      
      <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <div><strong>Current Name:</strong> {currentName}</div>
        <div><strong>Current Email:</strong> {currentEmail}</div>
        <div><strong>Current Theme:</strong> {currentTheme}</div>
      </div>

      <div style={{ margin: '10px 0' }}>
        <input
          type="text"
          placeholder="Name"
          value={currentName}
          onChange={(e) => handleNameChange(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={currentEmail}
          onChange={(e) => handleEmailChange(e.target.value)}
        />
        <button onClick={toggleTheme}>
          Toggle Theme ({currentTheme})
        </button>
      </div>

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <strong>Full User Object:</strong>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
    </div>
  );
}

// Data pipeline demo component
function DataPipelineDemo() {
  const [inputData, setInputData] = useState('{"id": 1, "name": "Alice", "email": "alice@example.com", "age": 28, "isActive": true, "roles": ["admin"], "preferences": {"theme": "dark", "language": "en", "notifications": true}}');
  const [result, setResult] = useState<string>('');

  const processData = useCallback(() => {
    try {
      const parsed = JSON.parse(inputData);
      const processed = DataPipeline.processUser.run(parsed);
      
      if (processed) {
        setResult(JSON.stringify(processed, null, 2));
      } else {
        setResult('Processing failed - invalid user data or inactive user');
      }
    } catch (error) {
      setResult(`Error: ${(error as Error).message}`);
    }
  }, [inputData]);

  return (
    <div>
      <h3>Data Processing Pipeline</h3>
      
      <div style={{ margin: '10px 0' }}>
        <textarea
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          style={{ width: '100%', height: '100px', fontFamily: 'monospace' }}
          placeholder="Enter JSON user data..."
        />
      </div>

      <button onClick={processData}>Process Data</button>

      {result && (
        <div style={{ marginTop: '10px' }}>
          <strong>Result:</strong>
          <pre style={{ 
            backgroundColor: '#f0f0f0', 
            padding: '10px', 
            fontSize: '12px',
            whiteSpace: 'pre-wrap'
          }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}

// Parser demo component
function ParserDemo() {
  const [input, setInput] = useState('42');
  const [results, setResults] = useState<Record<string, string>>({});

  const runParsers = useCallback(() => {
    const parsers = {
      number: Parser.number(),
      string: Parser.string('"hello"'),
      regex: Parser.regex(/^[a-zA-Z]+/),
      boolean: JsonParser.boolean,
      sequence: Parser.sequence(Parser.number(), Parser.regex(/^\s*[a-zA-Z]+/)),
    };

    const newResults: Record<string, string> = {};
    
    Object.entries(parsers).forEach(([name, parser]) => {
      const result = parser.parse(input);
      newResults[name] = result 
        ? `Success: ${JSON.stringify(result[0])}, Remaining: "${result[1]}"`
        : 'Failed to parse';
    });

    setResults(newResults);
  }, [input]);

  // Run parsers when input changes
  React.useEffect(() => {
    runParsers();
  }, [runParsers]);

  return (
    <div>
      <h3>Parser Combinator Demo</h3>
      
      <div style={{ margin: '10px 0' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to parse..."
          style={{ width: '100%', padding: '5px' }}
        />
      </div>

      <div style={{ margin: '10px 0' }}>
        <strong>Parser Results:</strong>
        {Object.entries(results).map(([parser, result]) => (
          <div key={parser} style={{ margin: '5px 0', fontSize: '14px' }}>
            <strong>{parser}:</strong> {result}
          </div>
        ))}
      </div>
    </div>
  );
}

// Profunctor composition demo
function ProfunctorCompositionDemo() {
  const [numbers] = useState([1, 2, 3, 4, 5]);
  const [transformations, setTransformations] = useState({
    addTen: true,
    multiplyByTwo: true,
    toString: true,
  });

  // Build transformation pipeline using function profunctor
  const pipeline = useMemo(() => {
    let transform = ((x: number) => x) as FunctionProf<number, number>;

    if (transformations.addTen) {
      const addTen = ((x: number) => x + 10) as FunctionProf<number, number>;
      transform = FunctionProfunctor.rmap((x: number) => addTen(x), transform);
    }

    if (transformations.multiplyByTwo) {
      const multiplyTwo = ((x: number) => x * 2) as FunctionProf<number, number>;
      transform = FunctionProfunctor.rmap((x: number) => multiplyTwo(x), transform);
    }

    if (transformations.toString) {
      const toString = ((x: number) => x.toString()) as FunctionProf<number, string>;
      return FunctionProfunctor.rmap((x: number) => toString(x), transform);
    }

    return transform;
  }, [transformations]);

  const results = numbers.map((n) => (pipeline as any)(n));

  return (
    <div>
      <h3>Profunctor Composition</h3>
      
      <div style={{ margin: '10px 0' }}>
        <strong>Input:</strong> [{numbers.join(', ')}]
      </div>

      <div style={{ margin: '10px 0' }}>
        <strong>Transformations:</strong>
        <label style={{ display: 'block', margin: '5px 0' }}>
          <input
            type="checkbox"
            checked={transformations.addTen}
            onChange={(e) => setTransformations(prev => ({ ...prev, addTen: e.target.checked }))}
          />
          Add 10
        </label>
        <label style={{ display: 'block', margin: '5px 0' }}>
          <input
            type="checkbox"
            checked={transformations.multiplyByTwo}
            onChange={(e) => setTransformations(prev => ({ ...prev, multiplyByTwo: e.target.checked }))}
          />
          Multiply by 2
        </label>
        <label style={{ display: 'block', margin: '5px 0' }}>
          <input
            type="checkbox"
            checked={transformations.toString}
            onChange={(e) => setTransformations(prev => ({ ...prev, toString: e.target.checked }))}
          />
          Convert to string
        </label>
      </div>

      <div style={{ margin: '10px 0' }}>
        <strong>Result:</strong> [{results.map(r => typeof r === 'string' ? `"${r}"` : r).join(', ')}]
      </div>
    </div>
  );
}

// Main app component
function App() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Profunctors and Variance Patterns</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <LensDemo />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <DataPipelineDemo />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <ParserDemo />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <ProfunctorCompositionDemo />
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Profunctor Concepts Demonstrated:</h3>
        <ul>
          <li><strong>Variance:</strong> Contravariant in input (A), covariant in output (B)</li>
          <li><strong>Function Profunctor:</strong> The canonical profunctor with dimap, lmap, rmap</li>
          <li><strong>Strong Profunctors:</strong> Handle product types with first/second operations</li>
          <li><strong>Choice Profunctors:</strong> Handle sum types with left/right operations</li>
          <li><strong>Optics (Lenses):</strong> Profunctor-encoded data accessors and transformers</li>
          <li><strong>Data Pipelines:</strong> Composable transformations using Star profunctor</li>
          <li><strong>Parser Combinators:</strong> Building complex parsers from simple components</li>
          <li><strong>Tagged/Forget:</strong> Specialized profunctors for metadata and extraction</li>
        </ul>
      </div>
    </div>
  );
}

// Export everything for testing and further exercises
export {
  App,
  LensDemo,
  DataPipelineDemo,
  ParserDemo,
  ProfunctorCompositionDemo,
  FunctionProfunctor,
  FunctionStrong,
  FunctionChoice,
  TaggedProfunctor,
  MaybeStar,
  DataPipeline,
  JsonParser,
  Parser,
  Lens,
  Tagged,
  Star,
  Forget,
  Either,
  StringMonoid,
  NumberSumMonoid,
  NumberProductMonoid,
  ArrayMonoid,
  type Prof,
  type Profunctor,
  type Strong,
  type Choice,
  type FunctionProf,
  type TaggedProf,
  type StarProf,
  type ForgetProf,
  type MaybeStarProf,
  type Lens as LensType,
  type Prism,
  type Monoid,
  type Maybe,
  type Either as EitherType,
  type User,
  type UserSummary,
  type Parser as ParserType,
};