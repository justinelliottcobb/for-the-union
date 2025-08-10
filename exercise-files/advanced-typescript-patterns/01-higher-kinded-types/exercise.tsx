// Higher-Kinded Types and Type Constructors
// Master abstract type programming by abstracting over type constructors, not just types

// Learning objectives:
// - Understand the difference between types (*, Type) and type constructors (* -> *, Type -> Type)
// - Implement Higher-Kinded Types in TypeScript using branded types and module augmentation
// - Create generic abstractions that work across different container types (Maybe, Either, Array, etc.)
// - Build type-level functions that operate on type constructors
// - Implement kind-polymorphic functions and data structures
// - Design APIs that are parametric in their container type

// Hints:
// 1. TypeScript doesn't have native HKT support, but we can simulate it with clever type programming
// 2. Use module augmentation to register type constructors in a global registry
// 3. Branded types help us distinguish between different kinds at the type level
// 4. Think in terms of "containers" and "contained values" - abstract over the container
// 5. HKT allows us to write code once that works for Maybe, Either, Array, IO, etc.
// 6. Focus on the "shape" of computation, not the specific container

import React, { useState, useEffect, useCallback } from 'react';

// TODO: Define the HKT infrastructure
// This is the foundation for all higher-kinded type programming in TypeScript

// Global registry for type constructors
// This maps string keys to their actual type constructors
interface HKTRegistry {
  // Placeholder - will be extended via module augmentation
}

// The core HKT type - represents F<A> where F is a type constructor
type HKT<F extends keyof HKTRegistry, A> = (HKTRegistry & {
  readonly [K in F]: (arg: A) => any;
})[F] extends (arg: any) => infer B ? B : never;

// Branded type for kind tracking at the type level
declare const HKTBrand: unique symbol;
type Kind<F extends keyof HKTRegistry, A> = HKT<F, A> & {
  readonly [HKTBrand]: F;
};

// TODO: Define fundamental type classes that abstract over type constructors

// Functor - Types that can be mapped over
interface Functor<F extends keyof HKTRegistry> {
  readonly map: <A, B,>(fa: Kind<F, A>, f: (a: A) => B) => Kind<F, B>;
}

// Applicative - Types that support applying functions in context
interface Applicative<F extends keyof HKTRegistry> extends Functor<F> {
  readonly of: <A,>(a: A) => Kind<F, A>;
  readonly ap: <A, B,>(fab: Kind<F, (a: A) => B>, fa: Kind<F, A>) => Kind<F, B>;
}

// Monad - Types that support flatMap/bind operations
interface Monad<F extends keyof HKTRegistry> extends Applicative<F> {
  readonly flatMap: <A, B,>(fa: Kind<F, A>, f: (a: A) => Kind<F, B>) => Kind<F, B>;
  readonly chain: <A, B,>(f: (a: A) => Kind<F, B>) => (fa: Kind<F, A>) => Kind<F, B>;
}

// Foldable - Types that can be reduced to a single value
interface Foldable<F extends keyof HKTRegistry> {
  readonly foldLeft: <A, B,>(fa: Kind<F, A>, initial: B, f: (b: B, a: A) => B) => B;
  readonly foldRight: <A, B,>(fa: Kind<F, A>, initial: B, f: (a: A, b: B) => B) => B;
  readonly foldMap: <A, M,>(fa: Kind<F, A>, f: (a: A) => M, monoid: Monoid<M>) => M;
}

// Traversable - Types that can be traversed with effects
interface Traversable<T extends keyof HKTRegistry> extends Functor<T>, Foldable<T> {
  readonly traverse: <F extends keyof HKTRegistry, A, B,>(
    fa: Kind<T, A>, 
    f: (a: A) => Kind<F, B>, 
    applicative: Applicative<F>
  ) => Kind<F, Kind<T, B>>;
  
  readonly sequence: <F extends keyof HKTRegistry, A,>(
    fa: Kind<T, Kind<F, A>>, 
    applicative: Applicative<F>
  ) => Kind<F, Kind<T, A>>;
}

// Monoid - Types with identity and associative operation
interface Monoid<A> {
  readonly empty: A;
  readonly concat: (x: A, y: A) => A;
}

// TODO: Implement Maybe type constructor
type MaybeContainer<A> = 
  | { readonly _tag: 'Some'; readonly value: A }
  | { readonly _tag: 'None' };

// Register Maybe in the HKT registry
declare module './exercise.tsx' {
  interface HKTRegistry {
    readonly Maybe: MaybeContainer<any>;
  }
}

// Type alias for convenience
type Maybe<A> = Kind<'Maybe', A> & MaybeContainer<A>;

// Maybe constructor functions
const Maybe = {
  some: <A,>(value: A): Maybe<A> => ({
    _tag: 'Some',
    value,
    [HKTBrand]: 'Maybe' as const,
  } as Maybe<A>),

  none: <A = never,>(): Maybe<A> => ({
    _tag: 'None',
    [HKTBrand]: 'Maybe' as const,
  } as Maybe<A>),

  of: <A,>(value: A): Maybe<A> => Maybe.some(value),

  fromNullable: <A,>(value: A | null | undefined): Maybe<A> =>
    value != null ? Maybe.some(value) : Maybe.none(),

  isSome: <A,>(maybe: Maybe<A>): maybe is Maybe<A> & { _tag: 'Some' } =>
    maybe._tag === 'Some',

  isNone: <A,>(maybe: Maybe<A>): maybe is Maybe<A> & { _tag: 'None' } =>
    maybe._tag === 'None',

  // TODO: Implement utilities
  getOrElse: <A,>(maybe: Maybe<A>, defaultValue: A): A =>
    Maybe.isSome(maybe) ? maybe.value : defaultValue,

  fold: <A, B,>(maybe: Maybe<A>, onNone: () => B, onSome: (value: A) => B): B =>
    Maybe.isSome(maybe) ? onSome(maybe.value) : onNone(),
};

// TODO: Implement Maybe instances
const MaybeFunctor: Functor<'Maybe'> = {
  map: <A, B,>(fa: Maybe<A>, f: (a: A) => B): Maybe<B> =>
    Maybe.isSome(fa) ? Maybe.some(f(fa.value)) : Maybe.none(),
};

const MaybeApplicative: Applicative<'Maybe'> = {
  ...MaybeFunctor,
  of: Maybe.of,
  ap: <A, B,>(fab: Maybe<(a: A) => B>, fa: Maybe<A>): Maybe<B> =>
    Maybe.isSome(fab) && Maybe.isSome(fa) 
      ? Maybe.some(fab.value(fa.value))
      : Maybe.none(),
};

const MaybeMonad: Monad<'Maybe'> = {
  ...MaybeApplicative,
  flatMap: <A, B,>(fa: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> =>
    Maybe.isSome(fa) ? f(fa.value) : Maybe.none(),
  chain: <A, B,>(f: (a: A) => Maybe<B>) => (fa: Maybe<A>): Maybe<B> =>
    MaybeMonad.flatMap(fa, f),
};

// TODO: Implement Either type constructor
type EitherContainer<E, A> = 
  | { readonly _tag: 'Left'; readonly left: E }
  | { readonly _tag: 'Right'; readonly right: A };

// Register Either in HKT registry - note the partial application
declare module './exercise.tsx' {
  interface HKTRegistry {
    readonly Either: EitherContainer<any, any>;
  }
}

type Either<E, A> = Kind<'Either', A> & EitherContainer<E, A>;

// Either constructor functions
const Either = {
  left: <E, A = never,>(error: E): Either<E, A> => ({
    _tag: 'Left',
    left: error,
    [HKTBrand]: 'Either' as const,
  } as Either<E, A>),

  right: <E = never, A = unknown,>(value: A): Either<E, A> => ({
    _tag: 'Right',
    right: value,
    [HKTBrand]: 'Either' as const,
  } as Either<E, A>),

  of: <E = never, A = unknown,>(value: A): Either<E, A> => Either.right(value),

  fromNullable: <E, A,>(value: A | null | undefined, error: E): Either<E, A> =>
    value != null ? Either.right(value) : Either.left(error),

  tryCatch: <E, A,>(f: () => A, onError: (error: unknown) => E): Either<E, A> => {
    try {
      return Either.right(f());
    } catch (error) {
      return Either.left(onError(error));
    }
  },

  isLeft: <E, A,>(either: Either<E, A>): either is Either<E, A> & { _tag: 'Left' } =>
    either._tag === 'Left',

  isRight: <E, A,>(either: Either<E, A>): either is Either<E, A> & { _tag: 'Right' } =>
    either._tag === 'Right',

  // TODO: Implement utilities
  fold: <E, A, B,>(either: Either<E, A>, onLeft: (error: E) => B, onRight: (value: A) => B): B =>
    Either.isLeft(either) ? onLeft(either.left) : onRight(either.right),

  getOrElse: <E, A,>(either: Either<E, A>, defaultValue: A): A =>
    Either.isRight(either) ? either.right : defaultValue,

  swap: <E, A,>(either: Either<E, A>): Either<A, E> =>
    Either.isLeft(either) ? Either.right(either.left) : Either.left(either.right),

  mapLeft: <E, A, F,>(either: Either<E, A>, f: (error: E) => F): Either<F, A> =>
    Either.isLeft(either) ? Either.left(f(either.left)) : either as Either<F, A>,
};

// TODO: Implement Either instances (fix the E parameter)
const EitherFunctor = <E>(): Functor<'Either'> => ({
  map: <A, B,>(fa: Either<E, A>, f: (a: A) => B): Either<E, B> =>
    Either.isRight(fa) ? Either.right(f(fa.right)) : fa as Either<E, B>,
});

const EitherApplicative = <E>(): Applicative<'Either'> => ({
  ...EitherFunctor<E>(),
  of: Either.of,
  ap: <A, B,>(fab: Either<E, (a: A) => B>, fa: Either<E, A>): Either<E, B> =>
    Either.isRight(fab) && Either.isRight(fa)
      ? Either.right(fab.right(fa.right))
      : Either.isLeft(fab) ? fab as Either<E, B> : fa as Either<E, B>,
});

const EitherMonad = <E>(): Monad<'Either'> => ({
  ...EitherApplicative<E>(),
  flatMap: <A, B,>(fa: Either<E, A>, f: (a: A) => Either<E, B>): Either<E, B> =>
    Either.isRight(fa) ? f(fa.right) : fa as Either<E, B>,
  chain: <A, B,>(f: (a: A) => Either<E, B>) => (fa: Either<E, A>): Either<E, B> =>
    EitherMonad<E>().flatMap(fa, f),
});

// TODO: Implement Array as HKT
declare module './exercise.tsx' {
  interface HKTRegistry {
    readonly Array: Array<any>;
  }
}

type HKTArray<A> = Kind<'Array', A> & Array<A>;

const HKTArray = {
  of: <A,>(value: A): HKTArray<A> => [value] as HKTArray<A>,
  empty: <A,>(): HKTArray<A> => [] as HKTArray<A>,
};

// Array instances
const ArrayFunctor: Functor<'Array'> = {
  map: <A, B,>(fa: HKTArray<A>, f: (a: A) => B): HKTArray<B> =>
    fa.map(f) as HKTArray<B>,
};

const ArrayApplicative: Applicative<'Array'> = {
  ...ArrayFunctor,
  of: HKTArray.of,
  ap: <A, B,>(fab: HKTArray<(a: A) => B>, fa: HKTArray<A>): HKTArray<B> =>
    fab.flatMap(f => fa.map(f)) as HKTArray<B>,
};

const ArrayMonad: Monad<'Array'> = {
  ...ArrayApplicative,
  flatMap: <A, B,>(fa: HKTArray<A>, f: (a: A) => HKTArray<B>): HKTArray<B> =>
    fa.flatMap(f) as HKTArray<B>,
  chain: <A, B,>(f: (a: A) => HKTArray<B>) => (fa: HKTArray<A>): HKTArray<B> =>
    ArrayMonad.flatMap(fa, f),
};

// TODO: Higher-order functions that work with any HKT
const HKT = {
  // Lift a binary function to work in any Applicative context
  lift2: <F extends keyof HKTRegistry,>(A: Applicative<F>) => 
    <A, B, C>(f: (a: A, b: B) => C) => 
    (fa: Kind<F, A>, fb: Kind<F, B>): Kind<F, C> =>
      A.ap(A.map(fa, (a: A) => (b: B) => f(a, b)), fb),

  // Lift a ternary function to work in any Applicative context  
  lift3: <F extends keyof HKTRegistry,>(A: Applicative<F>) =>
    <A, B, C, D>(f: (a: A, b: B, c: C) => D) =>
    (fa: Kind<F, A>, fb: Kind<F, B>, fc: Kind<F, C>): Kind<F, D> =>
      A.ap(A.ap(A.map(fa, (a: A) => (b: B) => (c: C) => f(a, b, c)), fb), fc),

  // Sequence a list of computations
  sequence: <F extends keyof HKTRegistry,>(A: Applicative<F>) => 
    <A>(fas: Array<Kind<F, A>>): Kind<F, Array<A>> =>
      fas.reduce(
        (acc, fa) => HKT.lift2(A)((as: A[], a: A) => [...as, a])(acc, fa),
        A.of([] as A[])
      ),

  // Map and then sequence
  traverse: <F extends keyof HKTRegistry,>(A: Applicative<F>) =>
    <A, B>(f: (a: A) => Kind<F, B>) =>
    (as: Array<A>): Kind<F, Array<B>> =>
      HKT.sequence(A)(as.map(f)),

  // Filter with effects
  filterA: <F extends keyof HKTRegistry,>(A: Applicative<F>) =>
    <A>(predicate: (a: A) => Kind<F, boolean>) =>
    (as: Array<A>): Kind<F, Array<A>> =>
      HKT.lift2(A)((results: boolean[], values: A[]) =>
        values.filter((_, i) => results[i])
      )(
        HKT.traverse(A)(predicate)(as),
        A.of(as)
      ),

  // Replicate a computation n times
  replicate: <F extends keyof HKTRegistry,>(A: Applicative<F>) =>
    <A>(n: number, fa: Kind<F, A>): Kind<F, Array<A>> =>
      HKT.sequence(A)(Array.from({ length: n }, () => fa)),

  // Kleisli composition for monads
  kleisli: <F extends keyof HKTRegistry,>(M: Monad<F>) =>
    <A, B, C>(f: (a: A) => Kind<F, B>, g: (b: B) => Kind<F, C>) =>
    (a: A): Kind<F, C> =>
      M.flatMap(f(a), g),
};

// TODO: Type-level utilities for working with HKTs
type Const<A, B> = A; // Const functor - ignores second parameter
type Identity<A> = A;  // Identity functor

// Fix point combinator for recursive types
type Fix<F> = F extends (arg: any) => any ? F extends (arg: infer A) => any ? F extends (arg: Fix<F>) => A ? A : never : never : never;

// Natural transformation - structure-preserving map between functors
type NaturalTransformation<F extends keyof HKTRegistry, G extends keyof HKTRegistry> = 
  <A>(fa: Kind<F, A>) => Kind<G, A>;

// TODO: Practical examples demonstrating HKT power

// Example: Validation that accumulates errors
type Validation<E, A> = Either<E[], A>;

const Validation = {
  success: <E, A,>(value: A): Validation<E, A> => Either.right(value),
  failure: <E, A,>(error: E): Validation<E, A> => Either.left([error]),
  failures: <E, A,>(errors: E[]): Validation<E, A> => Either.left(errors),
};

// Validation Applicative that accumulates errors
const ValidationApplicative = <E>(): Applicative<'Either'> => ({
  map: EitherFunctor<E[]>().map,
  of: Validation.success,
  ap: <A, B,>(fab: Validation<E, (a: A) => B>, fa: Validation<E, A>): Validation<E, B> => {
    if (Either.isLeft(fab) && Either.isLeft(fa)) {
      return Either.left([...fab.left, ...fa.left]);
    }
    if (Either.isLeft(fab)) return fab as Validation<E, B>;
    if (Either.isLeft(fa)) return fa as Validation<E, B>;
    return Either.right(fab.right(fa.right));
  },
});

// Example: Generic form validation using HKT
type FormField<T> = {
  value: T;
  errors: string[];
};

type FormData = {
  name: string;
  email: string;
  age: number;
};

const FormValidation = {
  validateName: (name: string): Validation<string, string> =>
    name.length >= 2 
      ? Validation.success(name)
      : Validation.failure('Name must be at least 2 characters'),

  validateEmail: (email: string): Validation<string, string> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email)
      ? Validation.success(email)
      : Validation.failure('Invalid email format');
  },

  validateAge: (age: number): Validation<string, number> =>
    age >= 0 && age <= 120
      ? Validation.success(age)
      : Validation.failure('Age must be between 0 and 120'),

  // Using HKT to validate entire form
  validateForm: (form: { name: string; email: string; age: number }): Validation<string, FormData> => {
    const V = ValidationApplicative<string>();
    
    return HKT.lift3(V)(
      (name: string, email: string, age: number): FormData => ({ name, email, age })
    )(
      FormValidation.validateName(form.name),
      FormValidation.validateEmail(form.email),
      FormValidation.validateAge(form.age)
    );
  },
};

// TODO: React components demonstrating HKT concepts

// Generic component that works with any container
function ContainerDisplay<F extends keyof HKTRegistry, A>({
  container,
  functor,
  render,
  empty = 'Empty',
}: {
  container: Kind<F, A>;
  functor: Functor<F>;
  render: (value: A) => React.ReactNode;
  empty?: React.ReactNode;
}) {
  // This is a simplified example - in reality we'd need runtime type information
  // to determine how to extract values from the container
  return <div>Generic container display (needs runtime type info)</div>;
}

// Maybe-specific component
function MaybeDisplay<A>({
  maybe,
  render,
  empty = 'Nothing',
}: {
  maybe: Maybe<A>;
  render: (value: A) => React.ReactNode;
  empty?: React.ReactNode;
}) {
  return (
    <div>
      {Maybe.fold(
        maybe,
        () => <span>{empty}</span>,
        render
      )}
    </div>
  );
}

// Either-specific component  
function EitherDisplay<E, A>({
  either,
  renderSuccess,
  renderError,
}: {
  either: Either<E, A>;
  renderSuccess: (value: A) => React.ReactNode;
  renderError: (error: E) => React.ReactNode;
}) {
  return (
    <div>
      {Either.fold(either, renderError, renderSuccess)}
    </div>
  );
}

// Form validation component using HKT
function HKTFormValidation() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    age: 0,
  });

  const [validation, setValidation] = useState<Validation<string, FormData> | null>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const result = FormValidation.validateForm(form);
    setValidation(result);
  }, [form]);

  const handleInputChange = useCallback((field: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'age' ? parseInt(event.target.value) || 0 : event.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div>
      <h3>HKT Form Validation</h3>
      
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={handleInputChange('name')}
          />
        </div>
        
        <div>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleInputChange('email')}
          />
        </div>
        
        <div>
          <input
            type="number"
            placeholder="Age"
            value={form.age}
            onChange={handleInputChange('age')}
          />
        </div>

        <button type="submit">Validate</button>
      </form>

      {validation && (
        <div style={{ marginTop: '1rem' }}>
          <EitherDisplay
            either={validation}
            renderSuccess={(data) => (
              <div style={{ color: 'green' }}>
                <h4>✅ Valid Form Data:</h4>
                <pre>{JSON.stringify(data, null, 2)}</pre>
              </div>
            )}
            renderError={(errors) => (
              <div style={{ color: 'red' }}>
                <h4>❌ Validation Errors:</h4>
                <ul>
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}

// Data fetching component using Maybe
function MaybeFetcher() {
  const [data, setData] = useState<Maybe<{ message: string }>>(Maybe.none());
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (Math.random() > 0.3) {
        setData(Maybe.some({ message: 'Hello from HKT!' }));
      } else {
        setData(Maybe.none());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div>
      <h3>Maybe Data Fetcher</h3>
      
      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>

      <div style={{ marginTop: '1rem' }}>
        <MaybeDisplay
          maybe={data}
          render={(value) => (
            <div style={{ color: 'green' }}>
              <strong>Data:</strong> {value.message}
            </div>
          )}
          empty={<div style={{ color: 'gray' }}>No data available</div>}
        />
      </div>
    </div>
  );
}

// Main demonstration app
function App() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Higher-Kinded Types and Type Constructors</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <HKTFormValidation />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <MaybeFetcher />
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>HKT Concepts Demonstrated:</h3>
        <ul>
          <li><strong>Type Constructors:</strong> Maybe&lt;A&gt;, Either&lt;E, A&gt;, Array&lt;A&gt;</li>
          <li><strong>HKT Infrastructure:</strong> Registry, Kind types, module augmentation</li>
          <li><strong>Functor/Applicative/Monad:</strong> Generic abstractions over containers</li>
          <li><strong>Higher-order Functions:</strong> lift2, lift3, sequence, traverse</li>
          <li><strong>Validation:</strong> Error-accumulating applicative validation</li>
          <li><strong>Generic Programming:</strong> Code that works with any container type</li>
        </ul>
      </div>
    </div>
  );
}

// Export everything for testing and further exercises
export {
  App,
  HKTFormValidation,
  MaybeFetcher,
  MaybeDisplay,
  EitherDisplay,
  Maybe,
  Either,
  HKTArray,
  MaybeFunctor,
  MaybeApplicative,
  MaybeMonad,
  EitherFunctor,
  EitherApplicative,
  EitherMonad,
  ArrayFunctor,
  ArrayApplicative,
  ArrayMonad,
  ValidationApplicative,
  FormValidation,
  HKT,
  type Kind,
  type HKT as HKTType,
  type Functor,
  type Applicative,
  type Monad,
  type Foldable,
  type Traversable,
  type Monoid,
  type NaturalTransformation,
  type Validation,
  type FormData,
};