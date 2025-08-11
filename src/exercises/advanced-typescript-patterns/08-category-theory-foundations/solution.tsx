// Category Theory Foundations - Solution
import React, { useState } from 'react';

// Category Definition
interface Category<Obj, Mor> {
  objects: Set<Obj>;
  id<A extends Obj>(a: A): Mor;
  compose<A extends Obj, B extends Obj, C extends Obj>(
    f: Mor, 
    g: Mor
  ): Mor;
}

// Functor Laws
interface Functor<F,> {
  map<A, B,>(fa: F, f: (a: A) => B): F;
}

// Verify functor laws
const verifyFunctorLaws = <F,>(functor: Functor<F,>, fa: F, f: (a: any) => any, g: (b: any) => any) => {
  // Law 1: map(fa, id) ≡ fa
  const id = <T,>(x: T): T => x;
  const law1 = JSON.stringify(functor.map(fa, id)) === JSON.stringify(fa);
  
  // Law 2: map(fa, compose(f, g)) ≡ map(map(fa, f), g)
  const compose = (f: any, g: any) => (x: any) => g(f(x));
  const left = functor.map(fa, compose(f, g));
  const right = functor.map(functor.map(fa, f), g);
  const law2 = JSON.stringify(left) === JSON.stringify(right);
  
  return { law1, law2 };
};

// Array Functor
const arrayFunctor: Functor<any[]> = {
  map: (arr, f) => arr.map(f)
};

// Maybe Functor
type Maybe<T> = { tag: 'some'; value: T } | { tag: 'none' };

const some = <T,>(value: T): Maybe<T> => ({ tag: 'some', value });
const none: Maybe<never> = { tag: 'none' };

const maybeFunctor: Functor<Maybe<any>> = {
  map: (ma, f) => ma.tag === 'some' ? some(f(ma.value)) : none
};

// Natural Transformation
type NaturalTransformation<F, G,> = <A,>(fa: F) => G;

// head: Array → Maybe (natural transformation)
const head: NaturalTransformation<any[], Maybe<any>> = (arr) => 
  arr.length > 0 ? some(arr[0]) : none;

// Verify naturality condition
const verifyNaturality = <F, G,>(
  nt: NaturalTransformation<F, G,>,
  fa: F,
  f: (a: any) => any,
  functorF: Functor<F,>,
  functorG: Functor<G,>
) => {
  // α(map_F(f, fa)) ≡ map_G(f, α(fa))
  const left = nt(functorF.map(fa, f));
  const right = functorG.map(nt(fa), f);
  return JSON.stringify(left) === JSON.stringify(right);
};

// Monoid
interface Monoid<T> {
  empty: T;
  concat(a: T, b: T): T;
}

// String Monoid
const stringMonoid: Monoid<strinG,> = {
  empty: '',
  concat: (a, b) => a + b
};

// Array Monoid
const arrayMonoid: Monoid<any[]> = {
  empty: [],
  concat: (a, b) => [...a, ...b]
};

// Verify monoid laws
const verifyMonoidLaws = <T,>(monoid: Monoid<T>, a: T, b: T, c: T) => {
  // Left identity: concat(empty, a) ≡ a
  const leftIdentity = JSON.stringify(monoid.concat(monoid.empty, a)) === JSON.stringify(a);
  
  // Right identity: concat(a, empty) ≡ a  
  const rightIdentity = JSON.stringify(monoid.concat(a, monoid.empty)) === JSON.stringify(a);
  
  // Associativity: concat(a, concat(b, c)) ≡ concat(concat(a, b), c)
  const left = monoid.concat(a, monoid.concat(b, c));
  const right = monoid.concat(monoid.concat(a, b), c);
  const associativity = JSON.stringify(left) === JSON.stringify(right);
  
  return { leftIdentity, rightIdentity, associativity };
};

// Applicative
interface Applicative<F,> extends Functor<F,> {
  pure: <A,>(a: A) => F;
  apply: <A, B,>(fab: F, fa: F) => F;
}

// Maybe Applicative
const maybeApplicative: Applicative<Maybe<any>> = {
  ...maybeFunctor,
  pure: some,
  apply: (fab, fa) => {
    if (fab.tag === 'some' && fa.tag === 'some') {
      return some(fab.value(fa.value));
    }
    return none;
  }
};

// Monad
interface Monad<F,> extends Applicative<F,> {
  flatMap<A, B,>(fa: F, f: (a: A) => F): F;
}

// Maybe Monad
const maybeMonad: Monad<Maybe<any>> = {
  ...maybeApplicative,
  flatMap: (ma, f) => ma.tag === 'some' ? f(ma.value) : none
};

// Comonad (dual of Monad)
interface Comonad<F,> {
  extract: <A,>(fa: F) => A;
  extend: <A, B,>(fa: F, f: (fa: F) => B) => F;
}

// Store Comonad (for context-dependent computations)
type Store<S, A,> = {
  pos: S;
  peek: (s: S) => A;
};

const storeComonad: Comonad<Store<any, any>> = {
  extract: (store) => store.peek(store.pos),
  extend: (store, f) => ({
    pos: store.pos,
    peek: (s) => f({ ...store, pos: s })
  })
};

// Example Store usage
const gridStore: Store<[number, number], strinG,> = {
  pos: [0, 0],
  peek: ([x, y]) => `Cell(${x},${y})`
};

// Interactive Demo Component
export const CategoryTheoryDemo: React.FC = () => {
  const [testArray, setTestArray] = useState([1, 2, 3, 4]);
  const [testString, setTestString] = useState('hello');

  // Functor law verification
  const addOne = (x: number) => x + 1;
  const double = (x: number) => x * 2;
  const arrayLaws = verifyFunctorLaws(arrayFunctor, testArray, addOne, double);
  
  const maybeSome = some(5);
  const maybeLaws = verifyFunctorLaws(maybeFunctor, maybeSome, addOne, double);

  // Natural transformation verification
  const naturalityCheck = verifyNaturality(
    head, 
    testArray, 
    addOne, 
    arrayFunctor, 
    maybeFunctor
  );

  // Monoid law verification
  const stringLaws = verifyMonoidLaws(stringMonoid, 'a', 'b', 'c');
  const arrayLaws2 = verifyMonoidLaws(arrayMonoid, [1], [2], [3]);

  // Applicative vs Monad distinction
  const val1 = some(5);
  const val2 = some(3);
  const addFunc = some((x: number) => (y: number) => x + y);
  
  // Applicative: parallel computation
  const applicativeResult = maybeApplicative.apply(
    maybeApplicative.apply(addFunc, val1),
    val2
  );
  
  // Monad: sequential computation  
  const monadicResult = maybeMonad.flatMap(val1, (x) =>
    maybeMonad.flatMap(val2, (y) =>
      maybeMonad.pure(x + y)
    )
  );

  // Store comonad example
  const currentValue = storeComonad.extract(gridStore);
  const neighborhood = storeComonad.extend(gridStore, (store) => {
    const [x, y] = store.pos;
    return `${store.peek([x-1, y])} ${store.peek([x, y])} ${store.peek([x+1, y])}`;
  });

  return (
    <div>
      <h3>Category Theory Foundations</h3>
      
      <div>
        <h4>Functor Law Verification</h4>
        <input 
          value={testArray.join(',')}
          onChange={(e) => setTestArray(e.target.value.split(',').map(Number))}
        />
        <p>Array functor laws: {JSON.stringify(arrayLaws)}</p>
        <p>Maybe functor laws: {JSON.stringify(maybeLaws)}</p>
      </div>

      <div>
        <h4>Natural Transformation</h4>
        <p>head: Array → Maybe</p>
        <p>Naturality verified: {naturalityCheck.toString()}</p>
        <p>head([1,2,3]) = {JSON.stringify(head([1,2,3]))}</p>
      </div>

      <div>
        <h4>Monoid Laws</h4>
        <p>String monoid laws: {JSON.stringify(stringLaws)}</p>
        <p>Array monoid laws: {JSON.stringify(arrayLaws2)}</p>
      </div>

      <div>
        <h4>Applicative vs Monad</h4>
        <p>Applicative result (parallel): {JSON.stringify(applicativeResult)}</p>
        <p>Monadic result (sequential): {JSON.stringify(monadicResult)}</p>
      </div>

      <div>
        <h4>Store Comonad</h4>
        <p>Current position value: {currentValue}</p>
        <p>Neighborhood context: {storeComonad.extract(neighborhood)}</p>
      </div>

      <div>
        <h4>Category Theory Concepts</h4>
        <ul>
          <li><strong>Category:</strong> Objects + Morphisms + Composition + Identity</li>
          <li><strong>Functor:</strong> Structure-preserving mapping between categories</li>
          <li><strong>Natural Transformation:</strong> Systematic way to transform functors</li>
          <li><strong>Monoid:</strong> Associative operation with identity element</li>
          <li><strong>Applicative:</strong> Parallel computation context</li>
          <li><strong>Monad:</strong> Sequential computation context</li>
          <li><strong>Comonad:</strong> Context-dependent computation (dual of Monad)</li>
        </ul>
      </div>

      <div>
        <h4>Mathematical Laws</h4>
        <p><strong>Functor Laws:</strong></p>
        <ul>
          <li>Identity: map(fa, id) ≡ fa</li>
          <li>Composition: map(fa, g ∘ f) ≡ map(map(fa, f), g)</li>
        </ul>
        <p><strong>Monoid Laws:</strong></p>
        <ul>
          <li>Left Identity: empty ⊕ a ≡ a</li>
          <li>Right Identity: a ⊕ empty ≡ a</li>
          <li>Associativity: (a ⊕ b) ⊕ c ≡ a ⊕ (b ⊕ c)</li>
        </ul>
      </div>
    </div>
  );
};

export default CategoryTheoryDemo;