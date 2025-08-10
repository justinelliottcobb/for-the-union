// Category Theory Foundations
// Unite all advanced patterns under the mathematical elegance of Category Theory

// Learning objectives:
// - Master Categories, Objects, and Morphisms in TypeScript
// - Implement Functors, Natural Transformations, and Functor Laws
// - Build Monoids, Semigroups, and their homomorphisms
// - Create Applicative Functors and their composition laws
// - Design Monads, Kleisli categories, and monadic composition
// - Implement Comonads and explore duality principles
// - Build Adjunctions and understand their fundamental role
// - Create Yoneda embedding and explore representable functors

// Hints:
// 1. Category Theory provides the mathematical foundation for all functional programming
// 2. Focus on laws and their verification - they ensure composability
// 3. Use HKT infrastructure to express categorical concepts generically
// 4. Natural transformations are polymorphic functions that preserve structure
// 5. Adjunctions are everywhere - they're the fundamental pattern of mathematics
// 6. The Yoneda lemma reveals deep connections between structure and representation
// 7. Comonads model context and environment - dual to monads' effects

import React, { useState, useCallback, useMemo } from 'react';

// TODO: HKT Infrastructure (Enhanced for Category Theory)
// Extended HKT system supporting higher-order type operations

interface HKTRegistry {
  readonly Identity: any;
  readonly Maybe: any;
  readonly Either: any;
  readonly Array: any[];
  readonly Function: (input: any) => any;
  readonly Const: any;
  readonly Compose: any;
  readonly Product: any;
  readonly Sum: any;
  readonly Reader: any;
  readonly Writer: any;
  readonly State: any;
  readonly IO: any;
  readonly Free: any;
  readonly Cofree: any;
  readonly Store: any;
  readonly Traced: any;
}

type HKT<F extends keyof HKTRegistry, A> = (HKTRegistry & {
  readonly [K in F]: (arg: A) => any;
})[F] extends (arg: any) => infer B ? B : never;

type HKT2<F extends keyof HKTRegistry, A, B> = (HKTRegistry & {
  readonly [K in F]: (arg1: A, arg2: B) => any;
})[F] extends (arg1: any, arg2: any) => infer R ? R : never;

declare const HKTBrand: unique symbol;
type Kind<F extends keyof HKTRegistry, A> = HKT<F, A> & { readonly [HKTBrand]: F };
type Kind2<F extends keyof HKTRegistry, A, B> = HKT2<F, A, B> & { readonly [HKTBrand]: F };

// TODO: Category Theory Foundations

// Category - A collection of objects and morphisms (arrows) between them
interface Category<Ob, Mor> {
  readonly objects: ReadonlySet<Ob>;
  readonly morphisms: ReadonlyMap<readonly [Ob, Ob], ReadonlySet<Mor>>;
  readonly identity: (obj: Ob) => Mor;
  readonly compose: (f: Mor, g: Mor) => Mor;
}

// TypeScript types form a category where:
// - Objects are types
// - Morphisms are functions between types
// - Identity is the identity function
// - Composition is function composition
const TypesCategory = {
  identity: <A,>(a: A): A => a,
  compose: <A, B, C,>(f: (a: A) => B, g: (b: B) => C) => (a: A): C => g(f(a)),
  
  // Verify category laws
  laws: {
    // Left identity: id ∘ f = f
    leftIdentity: <A, B,>(f: (a: A) => B, a: A): boolean => {
      const composed = TypesCategory.compose(TypesCategory.identity, f);
      return composed(a) === f(a);
    },
    
    // Right identity: f ∘ id = f  
    rightIdentity: <A, B,>(f: (a: A) => B, a: A): boolean => {
      const composed = TypesCategory.compose(f, TypesCategory.identity);
      return composed(a) === f(a);
    },
    
    // Associativity: (f ∘ g) ∘ h = f ∘ (g ∘ h)
    associativity: <A, B, C, D,>(
      f: (a: A) => B,
      g: (b: B) => C, 
      h: (c: C) => D,
      a: A
    ): boolean => {
      const left = TypesCategory.compose(TypesCategory.compose(f, g), h);
      const right = TypesCategory.compose(f, TypesCategory.compose(g, h));
      return left(a) === right(a);
    },
  },
};

// TODO: Functors - Structure-preserving mappings between categories

interface Functor<F extends keyof HKTRegistry> {
  readonly map: <A, B,>(fa: Kind<F, A>, f: (a: A) => B) => Kind<F, B>;
}

// Functor Laws
interface FunctorLaws<F extends keyof HKTRegistry> {
  // Identity: map(id) = id
  readonly identity: <A,>(fa: Kind<F, A>) => boolean;
  
  // Composition: map(f ∘ g) = map(f) ∘ map(g)
  readonly composition: <A, B, C,>(
    fa: Kind<F, A>,
    f: (a: A) => B,
    g: (b: B) => C
  ) => boolean;
}

// Identity Functor
declare module './exercise.tsx' {
  interface HKTRegistry {
    readonly Identity: any;
  }
}

type Identity<A> = Kind<'Identity', A> & { readonly value: A };

const Identity = {
  of: <A,>(value: A): Identity<A> => ({ 
    value, 
    [HKTBrand]: 'Identity' as const 
  } as Identity<A>),
  
  map: <A, B,>(fa: Identity<A>, f: (a: A) => B): Identity<B> => 
    Identity.of(f(fa.value)),
    
  extract: <A,>(fa: Identity<A>): A => fa.value,
};

const IdentityFunctor: Functor<'Identity'> = {
  map: Identity.map,
};

// Maybe Functor (enhanced)
type Maybe<A> = Kind<'Maybe', A> & (
  | { readonly _tag: 'Some'; readonly value: A }
  | { readonly _tag: 'None' }
);

const Maybe = {
  some: <A,>(value: A): Maybe<A> => ({ 
    _tag: 'Some' as const, 
    value, 
    [HKTBrand]: 'Maybe' as const 
  } as Maybe<A>),
  
  none: <A = never,>(): Maybe<A> => ({ 
    _tag: 'None' as const, 
    [HKTBrand]: 'Maybe' as const 
  } as Maybe<A>),
  
  isSome: <A,>(maybe: Maybe<A>): maybe is Maybe<A> & { _tag: 'Some' } =>
    maybe._tag === 'Some',
    
  isNone: <A,>(maybe: Maybe<A>): maybe is Maybe<A> & { _tag: 'None' } =>
    maybe._tag === 'None',
    
  map: <A, B,>(fa: Maybe<A>, f: (a: A) => B): Maybe<B> =>
    Maybe.isSome(fa) ? Maybe.some(f(fa.value)) : Maybe.none(),
    
  fold: <A, B,>(maybe: Maybe<A>, onNone: () => B, onSome: (a: A) => B): B =>
    Maybe.isSome(maybe) ? onSome(maybe.value) : onNone(),
};

const MaybeFunctor: Functor<'Maybe'> = {
  map: Maybe.map,
};

// Either Functor
type Either<E, A> = Kind<'Either', A> & (
  | { readonly _tag: 'Left'; readonly left: E }
  | { readonly _tag: 'Right'; readonly right: A }
);

const Either = {
  left: <E, A = never,>(error: E): Either<E, A> => ({ 
    _tag: 'Left' as const, 
    left: error, 
    [HKTBrand]: 'Either' as const 
  } as Either<E, A>),
  
  right: <E = never, A = unknown,>(value: A): Either<E, A> => ({ 
    _tag: 'Right' as const, 
    right: value, 
    [HKTBrand]: 'Either' as const 
  } as Either<E, A>),
  
  isLeft: <E, A,>(either: Either<E, A>): either is Either<E, A> & { _tag: 'Left' } =>
    either._tag === 'Left',
    
  isRight: <E, A,>(either: Either<E, A>): either is Either<E, A> & { _tag: 'Right' } =>
    either._tag === 'Right',
    
  map: <E, A, B,>(fa: Either<E, A>, f: (a: A) => B): Either<E, B> =>
    Either.isRight(fa) ? Either.right(f(fa.right)) : fa as Either<E, B>,
    
  fold: <E, A, B,>(either: Either<E, A>, onLeft: (e: E) => B, onRight: (a: A) => B): B =>
    Either.isLeft(either) ? onLeft(either.left) : onRight(either.right),
};

// TODO: Natural Transformations - Structure-preserving transformations between functors

// Natural transformation from F to G
type NaturalTransformation<F extends keyof HKTRegistry, G extends keyof HKTRegistry> = 
  <A>(fa: Kind<F, A>) => Kind<G, A>;

// Example: Maybe to Either natural transformation
const maybeToEither = <A>(maybe: Maybe<A>): Either<string, A> =>
  Maybe.isSome(maybe) 
    ? Either.right(maybe.value)
    : Either.left('None');

// Example: Identity to Maybe natural transformation  
const identityToMaybe = <A>(identity: Identity<A>): Maybe<A> =>
  Maybe.some(identity.value);

// Natural transformation laws
const NaturalTransformationLaws = {
  // Naturality: nt ∘ map_F(f) = map_G(f) ∘ nt
  naturality: <F extends keyof HKTRegistry, G extends keyof HKTRegistry, A, B,>(
    nt: NaturalTransformation<F, G>,
    functorF: Functor<F>,
    functorG: Functor<G>,
    fa: Kind<F, A>,
    f: (a: A) => B
  ): boolean => {
    const left = nt(functorF.map(fa, f));
    const right = functorG.map(nt(fa), f);
    // In practice, we'd need deep equality comparison
    return JSON.stringify(left) === JSON.stringify(right);
  },
};

// TODO: Monoids and Semigroups - Algebraic structures with associative operations

interface Semigroup<A> {
  readonly concat: (x: A, y: A) => A;
}

interface Monoid<A> extends Semigroup<A> {
  readonly empty: A;
}

// String monoid
const StringMonoid: Monoid<string> = {
  empty: '',
  concat: (x, y) => x + y,
};

// Number addition monoid
const NumberSumMonoid: Monoid<number> = {
  empty: 0,
  concat: (x, y) => x + y,
};

// Number multiplication monoid
const NumberProductMonoid: Monoid<number> = {
  empty: 1,
  concat: (x, y) => x * y,
};

// Array monoid
const ArrayMonoid = <T>(): Monoid<readonly T[]> => ({
  empty: [],
  concat: (x, y) => [...x, ...y],
});

// Boolean OR monoid
const BooleanOrMonoid: Monoid<boolean> = {
  empty: false,
  concat: (x, y) => x || y,
};

// Boolean AND monoid
const BooleanAndMonoid: Monoid<boolean> = {
  empty: true,
  concat: (x, y) => x && y,
};

// Monoid operations
const MonoidOps = {
  // Fold a list using a monoid
  fold: <A,>(monoid: Monoid<A>, list: readonly A[]): A =>
    list.reduce(monoid.concat, monoid.empty),
    
  // Power operation - repeated application
  power: <A,>(monoid: Monoid<A>, a: A, n: number): A => {
    if (n <= 0) return monoid.empty;
    if (n === 1) return a;
    const half = MonoidOps.power(monoid, a, Math.floor(n / 2));
    const doubled = monoid.concat(half, half);
    return n % 2 === 0 ? doubled : monoid.concat(doubled, a);
  },
  
  // Dual monoid - reverse the operation order
  dual: <A,>(monoid: Monoid<A>): Monoid<A> => ({
    empty: monoid.empty,
    concat: (x, y) => monoid.concat(y, x),
  }),
};

// TODO: Applicative Functors - Functors with application

interface Applicative<F extends keyof HKTRegistry> extends Functor<F> {
  readonly of: <A,>(a: A) => Kind<F, A>;
  readonly ap: <A, B,>(fab: Kind<F, (a: A) => B>, fa: Kind<F, A>) => Kind<F, B>;
}

// Applicative operations
const ApplicativeOps = {
  // Lift a binary function
  lift2: <F extends keyof HKTRegistry,>(A: Applicative<F>) => 
    <A, B, C>(f: (a: A, b: B) => C) => 
    (fa: Kind<F, A>, fb: Kind<F, B>): Kind<F, C> =>
      A.ap(A.map(fa, (a: A) => (b: B) => f(a, b)), fb),
      
  // Lift a ternary function
  lift3: <F extends keyof HKTRegistry,>(A: Applicative<F>) =>
    <A, B, C, D>(f: (a: A, b: B, c: C) => D) =>
    (fa: Kind<F, A>, fb: Kind<F, B>, fc: Kind<F, C>): Kind<F, D> =>
      A.ap(A.ap(A.map(fa, (a: A) => (b: B) => (c: C) => f(a, b, c)), fb), fc),
      
  // Sequence computations
  sequence: <F extends keyof HKTRegistry,>(A: Applicative<F>) =>
    <A>(fas: readonly Kind<F, A>[]): Kind<F, readonly A[]> =>
      fas.reduce(
        (acc, fa) => ApplicativeOps.lift2(A)((as: readonly A[], a: A) => [...as, a])(acc, fa),
        A.of([] as readonly A[])
      ),
};

// Maybe Applicative
const MaybeApplicative: Applicative<'Maybe'> = {
  map: Maybe.map,
  of: Maybe.some,
  ap: <A, B,>(fab: Maybe<(a: A) => B>, fa: Maybe<A>): Maybe<B> =>
    Maybe.isSome(fab) && Maybe.isSome(fa) 
      ? Maybe.some(fab.value(fa.value))
      : Maybe.none(),
};

// Either Applicative (for fixed error type)
const EitherApplicative = <E>(): Applicative<'Either'> => ({
  map: Either.map,
  of: Either.right,
  ap: <A, B,>(fab: Either<E, (a: A) => B>, fa: Either<E, A>): Either<E, B> =>
    Either.isRight(fab) && Either.isRight(fa)
      ? Either.right(fab.right(fa.right))
      : Either.isLeft(fab) ? fab as Either<E, B> : fa as Either<E, B>,
});

// TODO: Monads - Applicatives with sequential composition

interface Monad<F extends keyof HKTRegistry> extends Applicative<F> {
  readonly flatMap: <A, B,>(fa: Kind<F, A>, f: (a: A) => Kind<F, B>) => Kind<F, B>;
}

// Monad operations
const MonadOps = {
  // Kleisli composition
  kleisli: <F extends keyof HKTRegistry,>(M: Monad<F>) =>
    <A, B, C>(f: (a: A) => Kind<F, B>, g: (b: B) => Kind<F, C>) =>
    (a: A): Kind<F, C> => M.flatMap(f(a), g),
    
  // Join operation
  join: <F extends keyof HKTRegistry,>(M: Monad<F>) =>
    <A>(mma: Kind<F, Kind<F, A>>): Kind<F, A> =>
      M.flatMap(mma, (ma: Kind<F, A>) => ma),
      
  // Sequence with effects
  sequence: <F extends keyof HKTRegistry,>(M: Monad<F>) =>
    <A>(mas: readonly Kind<F, A>[]): Kind<F, readonly A[]> =>
      mas.reduce(
        (acc, ma) => M.flatMap(acc, (as: readonly A[]) => 
          M.flatMap(ma, (a: A) => M.of([...as, a]))),
        M.of([] as readonly A[])
      ),
      
  // Replicate operation
  replicate: <F extends keyof HKTRegistry,>(M: Monad<F>) =>
    <A>(n: number, ma: Kind<F, A>): Kind<F, readonly A[]> =>
      MonadOps.sequence(M)(Array.from({ length: n }, () => ma)),
};

// Maybe Monad
const MaybeMonad: Monad<'Maybe'> = {
  ...MaybeApplicative,
  flatMap: <A, B,>(fa: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> =>
    Maybe.isSome(fa) ? f(fa.value) : Maybe.none(),
};

// Either Monad
const EitherMonad = <E>(): Monad<'Either'> => ({
  ...EitherApplicative<E>(),
  flatMap: <A, B,>(fa: Either<E, A>, f: (a: A) => Either<E, B>): Either<E, B> =>
    Either.isRight(fa) ? f(fa.right) : fa as Either<E, B>,
});

// TODO: Comonads - Dual to monads, representing context

interface Comonad<F extends keyof HKTRegistry> extends Functor<F> {
  readonly extract: <A,>(fa: Kind<F, A>) => A;
  readonly extend: <A, B,>(fa: Kind<F, A>, f: (fa: Kind<F, A>) => B) => Kind<F, B>;
  readonly duplicate: <A,>(fa: Kind<F, A>) => Kind<F, Kind<F, A>>;
}

// Store Comonad - represents a value in a context with ability to look around
declare module './exercise.tsx' {
  interface HKTRegistry {
    readonly Store: any;
  }
}

type Store<S, A> = Kind2<'Store', S, A> & {
  readonly position: S;
  readonly peek: (s: S) => A;
};

const Store = {
  create: <S, A,>(position: S, peek: (s: S) => A): Store<S, A> => ({
    position,
    peek,
    [HKTBrand]: 'Store' as const,
  } as Store<S, A>),
  
  map: <S, A, B,>(fa: Store<S, A>, f: (a: A) => B): Store<S, B> =>
    Store.create(fa.position, (s) => f(fa.peek(s))),
    
  extract: <S, A,>(fa: Store<S, A>): A =>
    fa.peek(fa.position),
    
  extend: <S, A, B,>(fa: Store<S, A>, f: (fa: Store<S, A>) => B): Store<S, B> =>
    Store.create(fa.position, (s) => f(Store.create(s, fa.peek))),
    
  duplicate: <S, A,>(fa: Store<S, A>): Store<S, Store<S, A>> =>
    Store.create(fa.position, (s) => Store.create(s, fa.peek)),
    
  // Move the focus
  seek: <S, A,>(fa: Store<S, A>, position: S): Store<S, A> =>
    Store.create(position, fa.peek),
};

// TODO: Adjunctions - Fundamental categorical pattern

// Left adjoint and right adjoint functors
interface Adjunction<L extends keyof HKTRegistry, R extends keyof HKTRegistry> {
  readonly leftAdjoint: Functor<L>;
  readonly rightAdjoint: Functor<R>;
  readonly unit: <A,>(a: A) => Kind<R, Kind<L, A>>;
  readonly counit: <A,>(lra: Kind<L, Kind<R, A>>) => A;
}

// Currying adjunction: (-) × A ⊣ (-) → A
const CurryingAdjunction = <A>() => ({
  // Left adjoint: (-, A)
  leftAdjoint: {
    map: <B, C,>(fab: readonly [B, A], f: (b: B) => C): readonly [C, A] =>
      [f(fab[0]), fab[1]],
  },
  
  // Right adjoint: (-) → A  
  rightAdjoint: {
    map: <B, C,>(fba: (b: B) => A, f: (c: C) => B): (c: C) => A =>
      (c) => fba(f(c)),
  },
  
  // Unit: B → (B × A) → A
  unit: <B,>(b: B): ((ba: readonly [B, A]) => A) =>
    (ba) => ba[1],
    
  // Counit: ((B → A) × A) → B
  counit: <B,>(faa: readonly [(b: B) => A, A]): B => {
    // This is not implementable in general - demonstrates limits
    throw new Error('Counit for currying adjunction cannot be implemented');
  },
});

// TODO: Yoneda Lemma - Deep connection between structure and representation

// Yoneda embedding
type Yoneda<F extends keyof HKTRegistry, A> = <B>(f: (a: A) => B) => Kind<F, B>;

const YonedaOps = {
  // Transform from functor to Yoneda
  to: <F extends keyof HKTRegistry,>(functor: Functor<F>) =>
    <A>(fa: Kind<F, A>): Yoneda<F, A> =>
      <B>(f: (a: A) => B) => functor.map(fa, f),
      
  // Transform from Yoneda to functor  
  from: <F extends keyof HKTRegistry, A,>(yoneda: Yoneda<F, A>): Kind<F, A> =>
    yoneda((a: A) => a) as Kind<F, A>,
    
  // Yoneda lemma isomorphism verification
  isomorphism: <F extends keyof HKTRegistry, A,>(
    functor: Functor<F>,
    fa: Kind<F, A>
  ): boolean => {
    const yoneda = YonedaOps.to(functor)(fa);
    const back = YonedaOps.from(yoneda);
    // In practice, would need deep equality
    return JSON.stringify(fa) === JSON.stringify(back);
  },
};

// TODO: Real-world Category Theory Applications

// Validation Applicative (accumulates errors)
type Validation<E, A> = Either<readonly E[], A>;

const Validation = {
  success: <E, A,>(value: A): Validation<E, A> => Either.right(value),
  failure: <E, A,>(error: E): Validation<E, A> => Either.left([error]),
  failures: <E, A,>(errors: readonly E[]): Validation<E, A> => Either.left(errors),
};

const ValidationApplicative = <E>(): Applicative<'Either'> => ({
  map: Either.map,
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

// Form validation using category theory
type FormField<T> = {
  readonly value: T;
  readonly validate: (value: T) => Validation<string, T>;
};

type Form<T> = {
  readonly [K in keyof T]: FormField<T[K]>;
};

const FormOps = {
  // Create a form field with validation
  field: <T,>(value: T, validate: (value: T) => Validation<string, T>): FormField<T> => ({
    value,
    validate,
  }),
  
  // Validate entire form using Applicative
  validate: <T,>(form: Form<T>): Validation<string, T> => {
    const V = ValidationApplicative<string>();
    
    // This would need to be implemented generically for arbitrary record types
    // Here we'll show the pattern for a specific form
    return Either.right({} as T); // Simplified for demonstration
  },
};

// Pipeline composition using Category Theory
interface Pipeline<A, B> {
  readonly run: (input: A) => B;
}

const Pipeline = {
  // Identity morphism
  identity: <A,>(): Pipeline<A, A> => ({
    run: (a) => a,
  }),
  
  // Composition
  compose: <A, B, C,>(p1: Pipeline<A, B>, p2: Pipeline<B, C>): Pipeline<A, C> => ({
    run: (a) => p2.run(p1.run(a)),
  }),
  
  // Lift a function to a pipeline
  lift: <A, B,>(f: (a: A) => B): Pipeline<A, B> => ({
    run: f,
  }),
  
  // Parallel composition (product)
  parallel: <A, B, C, D,>(p1: Pipeline<A, B>, p2: Pipeline<C, D>): Pipeline<readonly [A, C], readonly [B, D]> => ({
    run: ([a, c]) => [p1.run(a), p2.run(c)],
  }),
  
  // Choice composition (coproduct)
  choice: <A, B, C,>(p1: Pipeline<A, C>, p2: Pipeline<B, C>): Pipeline<Either<A, B>, C> => ({
    run: (either) => Either.isLeft(either) ? p1.run(either.left) : p2.run(either.right),
  }),
};

// TODO: React Components demonstrating Category Theory concepts

// Functor laws verification component
function FunctorLawsDemo() {
  const [testValue, setTestValue] = useState(42);
  const [results, setResults] = useState<Record<string, boolean>>({});

  const testFunctorLaws = useCallback(() => {
    const maybe = Maybe.some(testValue);
    const identity = Identity.of(testValue);
    
    const f = (x: number) => x * 2;
    const g = (x: number) => x + 1;
    
    // Test Identity law
    const identityLawMaybe = 
      JSON.stringify(Maybe.map(maybe, (x) => x)) === JSON.stringify(maybe);
    const identityLawIdentity = 
      JSON.stringify(Identity.map(identity, (x) => x)) === JSON.stringify(identity);
    
    // Test Composition law
    const compositionLeftMaybe = Maybe.map(Maybe.map(maybe, f), g);
    const compositionRightMaybe = Maybe.map(maybe, (x) => g(f(x)));
    const compositionLawMaybe = 
      JSON.stringify(compositionLeftMaybe) === JSON.stringify(compositionRightMaybe);
      
    const compositionLeftIdentity = Identity.map(Identity.map(identity, f), g);
    const compositionRightIdentity = Identity.map(identity, (x) => g(f(x)));
    const compositionLawIdentity = 
      JSON.stringify(compositionLeftIdentity) === JSON.stringify(compositionRightIdentity);

    setResults({
      'Maybe Identity Law': identityLawMaybe,
      'Identity Identity Law': identityLawIdentity,
      'Maybe Composition Law': compositionLawMaybe,
      'Identity Composition Law': compositionLawIdentity,
    });
  }, [testValue]);

  useEffect(() => {
    testFunctorLaws();
  }, [testFunctorLaws]);

  return (
    <div>
      <h3>Functor Laws Verification</h3>
      
      <div style={{ margin: '10px 0' }}>
        <label>
          Test Value:
          <input
            type="number"
            value={testValue}
            onChange={(e) => setTestValue(parseInt(e.target.value) || 0)}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>

      <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h4>Functor Laws:</h4>
        <div><strong>Identity:</strong> map(id) = id</div>
        <div><strong>Composition:</strong> map(f ∘ g) = map(f) ∘ map(g)</div>
      </div>

      <div style={{ margin: '10px 0' }}>
        {Object.entries(results).map(([law, passed]) => (
          <div key={law} style={{ 
            margin: '5px 0',
            color: passed ? '#4caf50' : '#f44336',
            fontWeight: 'bold'
          }}>
            {passed ? '✅' : '❌'} {law}
          </div>
        ))}
      </div>

      <div style={{ margin: '10px 0', fontSize: '12px', color: '#666' }}>
        These laws ensure that functors preserve the categorical structure.
        All properly implemented functors must satisfy these laws.
      </div>
    </div>
  );
}

// Monoid operations demo
function MonoidDemo() {
  const [strings, setStrings] = useState(['Hello', ' ', 'Category', ' ', 'Theory']);
  const [numbers, setNumbers] = useState([1, 2, 3, 4, 5]);
  const [operation, setOperation] = useState<'sum' | 'product'>('sum');

  const results = useMemo(() => {
    const stringResult = MonoidOps.fold(StringMonoid, strings);
    const numberMonoid = operation === 'sum' ? NumberSumMonoid : NumberProductMonoid;
    const numberResult = MonoidOps.fold(numberMonoid, numbers);
    
    // Power demonstration
    const powerResult = MonoidOps.power(numberMonoid, 2, 5);
    
    return {
      string: stringResult,
      number: numberResult,
      power: powerResult,
      powerMeaning: operation === 'sum' ? '2 + 2 + 2 + 2 + 2' : '2 × 2 × 2 × 2 × 2',
    };
  }, [strings, numbers, operation]);

  return (
    <div>
      <h3>Monoid Operations</h3>
      
      <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h4>Monoid Laws:</h4>
        <div><strong>Associativity:</strong> (a ⊕ b) ⊕ c = a ⊕ (b ⊕ c)</div>
        <div><strong>Identity:</strong> empty ⊕ a = a = a ⊕ empty</div>
      </div>

      <div style={{ margin: '10px 0' }}>
        <label>
          String List:
          <input
            type="text"
            value={strings.join(',')}
            onChange={(e) => setStrings(e.target.value.split(','))}
            style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
          />
        </label>
      </div>
      
      <div style={{ margin: '10px 0' }}>
        <label>
          Number List:
          <input
            type="text"
            value={numbers.join(',')}
            onChange={(e) => setNumbers(e.target.value.split(',').map(n => parseInt(n.trim()) || 0))}
            style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
          />
        </label>
      </div>
      
      <div style={{ margin: '10px 0' }}>
        <label>
          Number Operation:
          <select 
            value={operation} 
            onChange={(e) => setOperation(e.target.value as 'sum' | 'product')}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="sum">Sum (+)</option>
            <option value="product">Product (×)</option>
          </select>
        </label>
      </div>

      <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#e3f2fd' }}>
        <h4>Results:</h4>
        <div><strong>String Concatenation:</strong> "{results.string}"</div>
        <div><strong>Number {operation}:</strong> {results.number}</div>
        <div><strong>Power (2^5 using {operation}):</strong> {results.power} ({results.powerMeaning})</div>
      </div>
    </div>
  );
}

// Applicative validation demo
function ApplicativeValidationDemo() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
  });
  const [validationResult, setValidationResult] = useState<string>('');

  const validateName = (name: string): Validation<string, string> =>
    name.length >= 2 ? Validation.success(name) : Validation.failure('Name must be at least 2 characters');

  const validateEmail = (email: string): Validation<string, string> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? Validation.success(email) : Validation.failure('Invalid email format');
  };

  const validateAge = (ageStr: string): Validation<string, number> => {
    const age = parseInt(ageStr);
    return !isNaN(age) && age >= 0 && age <= 120 
      ? Validation.success(age) 
      : Validation.failure('Age must be a number between 0 and 120');
  };

  const validateForm = useCallback(() => {
    const V = ValidationApplicative<string>();
    
    // Validate each field
    const nameResult = validateName(formData.name);
    const emailResult = validateEmail(formData.email);
    const ageResult = validateAge(formData.age);
    
    // Combine using Applicative - accumulates all errors
    const combined = ApplicativeOps.lift3(V)(
      (name: string, email: string, age: number) => ({ name, email, age })
    )(nameResult, emailResult, ageResult);
    
    const result = Either.fold(
      combined,
      (errors) => `❌ Validation Errors:\n${errors.map(e => `• ${e}`).join('\n')}`,
      (data) => `✅ Valid Data:\n${JSON.stringify(data, null, 2)}`
    );
    
    setValidationResult(result);
  }, [formData]);

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  return (
    <div>
      <h3>Applicative Validation</h3>
      
      <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h4>Applicative Pattern:</h4>
        <p>Unlike Monads, Applicatives can accumulate errors from multiple independent validations.</p>
        <div><strong>Monad:</strong> Fails fast on first error</div>
        <div><strong>Applicative:</strong> Collects all validation errors</div>
      </div>

      <div style={{ margin: '10px 0' }}>
        <div style={{ margin: '5px 0' }}>
          <label>
            Name:
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        
        <div style={{ margin: '5px 0' }}>
          <label>
            Email:
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        
        <div style={{ margin: '5px 0' }}>
          <label>
            Age:
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
      </div>

      <pre style={{
        margin: '10px 0',
        padding: '10px',
        backgroundColor: validationResult.startsWith('✅') ? '#e8f5e8' : '#ffeaea',
        border: `1px solid ${validationResult.startsWith('✅') ? '#4caf50' : '#f44336'}`,
        fontSize: '12px',
        whiteSpace: 'pre-wrap',
      }}>
        {validationResult}
      </pre>
    </div>
  );
}

// Category composition demo
function CategoryCompositionDemo() {
  const [inputValue, setInputValue] = useState(5);
  const [functions, setFunctions] = useState({
    f: 'x * 2',
    g: 'x + 3',
    h: 'x * x',
  });

  const results = useMemo(() => {
    try {
      // Create functions from strings (unsafe eval for demo)
      const f = new Function('x', `return ${functions.f}`) as (x: number) => number;
      const g = new Function('x', `return ${functions.g}`) as (x: number) => number;
      const h = new Function('x', `return ${functions.h}`) as (x: number) => number;
      
      // Test category laws
      const id = TypesCategory.identity;
      
      // Individual applications
      const fResult = f(inputValue);
      const gResult = g(inputValue);
      const hResult = h(inputValue);
      
      // Compositions
      const fgComposed = TypesCategory.compose(f, g);
      const fgResult = fgComposed(inputValue);
      
      const associativityLeft = TypesCategory.compose(TypesCategory.compose(f, g), h);
      const associativityRight = TypesCategory.compose(f, TypesCategory.compose(g, h));
      const leftResult = associativityLeft(inputValue);
      const rightResult = associativityRight(inputValue);
      
      // Identity laws
      const leftIdentity = TypesCategory.compose(id, f);
      const rightIdentity = TypesCategory.compose(f, id);
      const leftIdResult = leftIdentity(inputValue);
      const rightIdResult = rightIdentity(inputValue);
      
      return {
        individual: { f: fResult, g: gResult, h: hResult },
        composition: fgResult,
        associativity: { left: leftResult, right: rightResult, equal: leftResult === rightResult },
        identity: { 
          left: leftIdResult, 
          right: rightIdResult, 
          original: fResult,
          leftEqual: leftIdResult === fResult,
          rightEqual: rightIdResult === fResult,
        },
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }, [inputValue, functions]);

  return (
    <div>
      <h3>Category Theory Composition</h3>
      
      <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h4>Category Laws:</h4>
        <div><strong>Identity:</strong> id ∘ f = f = f ∘ id</div>
        <div><strong>Associativity:</strong> (f ∘ g) ∘ h = f ∘ (g ∘ h)</div>
      </div>

      <div style={{ margin: '10px 0' }}>
        <label>
          Input Value:
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(parseInt(e.target.value) || 0)}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>

      <div style={{ margin: '10px 0' }}>
        <div style={{ margin: '5px 0' }}>
          <label>
            Function f:
            <input
              type="text"
              value={functions.f}
              onChange={(e) => setFunctions(prev => ({ ...prev, f: e.target.value }))}
              style={{ marginLeft: '10px', padding: '5px', width: '100px' }}
            />
          </label>
        </div>
        
        <div style={{ margin: '5px 0' }}>
          <label>
            Function g:
            <input
              type="text"
              value={functions.g}
              onChange={(e) => setFunctions(prev => ({ ...prev, g: e.target.value }))}
              style={{ marginLeft: '10px', padding: '5px', width: '100px' }}
            />
          </label>
        </div>
        
        <div style={{ margin: '5px 0' }}>
          <label>
            Function h:
            <input
              type="text"
              value={functions.h}
              onChange={(e) => setFunctions(prev => ({ ...prev, h: e.target.value }))}
              style={{ marginLeft: '10px', padding: '5px', width: '100px' }}
            />
          </label>
        </div>
      </div>

      {'error' in results ? (
        <div style={{ color: '#f44336', padding: '10px', backgroundColor: '#ffeaea' }}>
          Error: {results.error}
        </div>
      ) : (
        <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#e3f2fd' }}>
          <h4>Results:</h4>
          <div><strong>f({inputValue}) =</strong> {results.individual.f}</div>
          <div><strong>g({inputValue}) =</strong> {results.individual.g}</div>
          <div><strong>h({inputValue}) =</strong> {results.individual.h}</div>
          <div><strong>(g ∘ f)({inputValue}) =</strong> {results.composition}</div>
          
          <h4>Law Verification:</h4>
          <div style={{ color: results.associativity.equal ? '#4caf50' : '#f44336' }}>
            <strong>Associativity:</strong> 
            {results.associativity.equal ? ' ✅' : ' ❌'} 
            ({results.associativity.left} = {results.associativity.right})
          </div>
          
          <div style={{ color: results.identity.leftEqual ? '#4caf50' : '#f44336' }}>
            <strong>Left Identity:</strong> 
            {results.identity.leftEqual ? ' ✅' : ' ❌'} 
            ({results.identity.left} = {results.identity.original})
          </div>
          
          <div style={{ color: results.identity.rightEqual ? '#4caf50' : '#f44336' }}>
            <strong>Right Identity:</strong> 
            {results.identity.rightEqual ? ' ✅' : ' ❌'} 
            ({results.identity.right} = {results.identity.original})
          </div>
        </div>
      )}
    </div>
  );
}

// Main app component
function App() {
  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Category Theory Foundations</h1>
      
      <div style={{ margin: '20px 0', padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px', border: '2px solid #ff9800' }}>
        <h2 style={{ color: '#e65100', margin: '0 0 10px 0' }}>🎓 The Mathematical Foundation</h2>
        <p>
          <strong>Category Theory is the "mathematics of mathematics"</strong> - it reveals the deep patterns 
          that connect all areas of mathematics and computation. Every advanced TypeScript pattern we've 
          explored has its roots in categorical concepts!
        </p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <FunctorLawsDemo />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <MonoidDemo />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <ApplicativeValidationDemo />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <CategoryCompositionDemo />
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Category Theory Concepts Mastered:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          <div>
            <h4>🔗 Categories & Morphisms</h4>
            <ul>
              <li>Objects and arrows (functions)</li>
              <li>Identity and composition laws</li>
              <li>TypeScript as a category</li>
            </ul>
          </div>
          
          <div>
            <h4>🗺️ Functors & Natural Transformations</h4>
            <ul>
              <li>Structure-preserving mappings</li>
              <li>Functor laws verification</li>
              <li>Natural polymorphic transformations</li>
            </ul>
          </div>
          
          <div>
            <h4>⚡ Monoids & Algebraic Structures</h4>
            <ul>
              <li>Associative operations with identity</li>
              <li>Folding and power operations</li>
              <li>String, number, and boolean monoids</li>
            </ul>
          </div>
          
          <div>
            <h4>🚀 Applicatives & Monads</h4>
            <ul>
              <li>Sequential vs parallel composition</li>
              <li>Error accumulation patterns</li>
              <li>Kleisli composition</li>
            </ul>
          </div>
          
          <div>
            <h4>🔄 Comonads & Context</h4>
            <ul>
              <li>Dual to monads - extracting from context</li>
              <li>Store comonad for positional data</li>
              <li>Extend and duplicate operations</li>
            </ul>
          </div>
          
          <div>
            <h4>🤝 Adjunctions & Yoneda</h4>
            <ul>
              <li>Left and right adjoint functors</li>
              <li>Unit and counit transformations</li>
              <li>Yoneda embedding and representation</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px', border: '2px solid #4caf50' }}>
        <h2 style={{ color: '#2e7d32', margin: '0 0 15px 0' }}>🎊 MASTERY ACHIEVED!</h2>
        <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
          You've completed the ultimate journey through advanced TypeScript patterns! 
        </p>
        <p>
          From <strong>Higher-Kinded Types</strong> to <strong>Category Theory</strong>, you now possess 
          the most sophisticated type-level programming skills possible. These patterns unite under 
          category theory's elegant mathematical framework - the same principles that govern 
          <em>all of mathematics and computation</em>.
        </p>
        <div style={{ marginTop: '15px', fontSize: '16px', fontStyle: 'italic' }}>
          <strong>Bartosz Milewski would be proud!</strong> You're now equipped to see the deep 
          categorical structure underlying all software design. 🎭✨
        </div>
      </div>
    </div>
  );
}

// Export everything for testing and further exploration
export {
  App,
  FunctorLawsDemo,
  MonoidDemo,
  ApplicativeValidationDemo,
  CategoryCompositionDemo,
  TypesCategory,
  Identity,
  IdentityFunctor,
  Maybe,
  MaybeFunctor,
  MaybeApplicative,
  MaybeMonad,
  Either,
  EitherApplicative,
  EitherMonad,
  Store,
  StringMonoid,
  NumberSumMonoid,
  NumberProductMonoid,
  ArrayMonoid,
  BooleanOrMonoid,
  BooleanAndMonoid,
  MonoidOps,
  ApplicativeOps,
  MonadOps,
  YonedaOps,
  ValidationApplicative,
  Pipeline,
  maybeToEither,
  identityToMaybe,
  type Kind,
  type Kind2,
  type Category,
  type Functor,
  type FunctorLaws,
  type NaturalTransformation,
  type Semigroup,
  type Monoid,
  type Applicative,
  type Monad,
  type Comonad,
  type Adjunction,
  type Yoneda,
  type Validation,
  type FormField,
  type Form,
};