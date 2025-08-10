// Higher-Kinded Types and Type Constructors - Solution
import React, { useState } from 'react';

// HKT Infrastructure
interface HKTRegistry {}

type HKT<F extends keyof HKTRegistry, A> = (HKTRegistry & {
  readonly [K in F]: (arg: A) => any;
})[F] extends (arg: any) => infer B ? B : never;

declare const HKTBrand: unique symbol;
type Kind<F extends keyof HKTRegistry, A> = HKT<F, A> & {
  readonly [HKTBrand]: F;
};

// Type Classes
interface Functor<F extends keyof HKTRegistry> {
  readonly map: <A, B>(fa: Kind<F, A>, f: (a: A) => B) => Kind<F, B>;
}

interface Applicative<F extends keyof HKTRegistry> extends Functor<F> {
  readonly pure: <A>(a: A) => Kind<F, A>;
  readonly apply: <A, B>(fab: Kind<F, (a: A) => B>, fa: Kind<F, A>) => Kind<F, B>;
}

interface Monad<F extends keyof HKTRegistry> extends Applicative<F> {
  readonly flatMap: <A, B>(fa: Kind<F, A>, f: (a: A) => Kind<F, B>) => Kind<F, B>;
}

// Maybe Implementation
type Maybe<T> = Some<T> | None;
type Some<T> = { readonly tag: 'some'; readonly value: T };
type None = { readonly tag: 'none' };

const some = <T>(value: T): Some<T> => ({ tag: 'some', value });
const none: None = { tag: 'none' };

declare module './solution' {
  interface HKTRegistry {
    Maybe: Maybe<any>;
  }
}

const maybeFunctor: Functor<'Maybe'> = {
  map: (fa, f) => fa.tag === 'some' ? some(f(fa.value)) : none
};

const maybeApplicative: Applicative<'Maybe'> = {
  ...maybeFunctor,
  pure: some,
  apply: (fab, fa) => 
    fab.tag === 'some' && fa.tag === 'some' 
      ? some(fab.value(fa.value)) 
      : none
};

// Either Implementation  
type Either<E, A> = Left<E> | Right<A>;
type Left<E> = { readonly tag: 'left'; readonly value: E };
type Right<A> = { readonly tag: 'right'; readonly value: A };

const left = <E>(value: E): Left<E> => ({ tag: 'left', value });
const right = <A>(value: A): Right<A> => ({ tag: 'right', value });

declare module './solution' {
  interface HKTRegistry {
    Either: Either<any, any>;
  }
}

// Form Validation Example
type ValidationResult<T> = Either<string[], T>;

const validateName = (name: string): ValidationResult<string> =>
  name.length > 0 ? right(name) : left(['Name is required']);

const validateEmail = (email: string): ValidationResult<string> =>
  email.includes('@') ? right(email) : left(['Invalid email']);

// Interactive Component
export const HKTDemo: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const validation = {
    name: validateName(name),
    email: validateEmail(email)
  };

  return (
    <div>
      <h3>Higher-Kinded Types Demo</h3>
      <div>
        <input 
          placeholder="Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
        />
        {validation.name.tag === 'left' && (
          <div style={{ color: 'red' }}>{validation.name.value.join(', ')}</div>
        )}
      </div>
      <div>
        <input 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        {validation.email.tag === 'left' && (
          <div style={{ color: 'red' }}>{validation.email.value.join(', ')}</div>
        )}
      </div>
      
      <pre>{JSON.stringify({ name: validation.name, email: validation.email }, null, 2)}</pre>
    </div>
  );
};

export default HKTDemo;