# Higher-Kinded Types and Type Constructors

Master abstract type programming by abstracting over type constructors, not just types.

## Learning Objectives

- Understand the difference between types (*, Type) and type constructors (* -> *, Type -> Type)
- Implement Higher-Kinded Types in TypeScript using branded types and module augmentation
- Create generic abstractions that work across different container types (Maybe, Either, Array, etc.)
- Build type-level functions that operate on type constructors
- Implement kind-polymorphic functions and data structures
- Design APIs that are parametric in their container type

## Background

Higher-Kinded Types (HKT) allow you to abstract over type constructors, not just types. While TypeScript doesn't natively support HKT, we can simulate them using clever type programming with branded types and module augmentation.

Think of it this way:
- **Types**: `string`, `number`, `User` (kind: `*`)
- **Type Constructors**: `Array<T>`, `Maybe<T>`, `Either<E, T>` (kind: `* -> *`)
- **Higher-Kinded Types**: Abstract over the constructor itself

This enables writing code that works generically across `Maybe`, `Either`, `Array`, `IO`, and any other container type.

## Instructions

1. **Define the HKT Infrastructure**
   - Create a global `HKTRegistry` interface for type constructor registration
   - Implement the core `HKT<F, A>` type for representing `F<A>` where `F` is a type constructor
   - Create a branded `Kind<F, A>` type for kind tracking at the type level

2. **Implement Fundamental Type Classes**
   - `Functor<F>` - Types that can be mapped over
   - `Applicative<F>` - Types that support applying functions in context
   - `Monad<F>` - Types that support sequential composition

3. **Create Concrete Implementations**
   - `Maybe<T>` - Represents optional values
   - `Either<E, T>` - Represents computations that can fail
   - `Array<T>` - Represents multiple values
   - Register each in the HKT registry via module augmentation

4. **Build Generic Abstractions**
   - `traverse` - Turn `Array<F<A>>` into `F<Array<A>>`
   - `sequence` - Special case of traverse
   - Generic form validation using applicative composition

5. **Create Practical Applications**
   - Form validation that accumulates all errors
   - Data pipeline that works with any container type
   - Interactive React component demonstrating the abstractions

## Key Concepts

### Type Constructors vs Types

```typescript
// Types (kind: *)
type User = { name: string; age: number };

// Type Constructors (kind: * -> *)
type Maybe<T> = Some<T> | None;
type Either<E, T> = Left<E> | Right<T>;

// Higher-Kinded Types (abstract over the constructor)
interface Functor<F> {
  map<A, B>(fa: F<A>, f: (a: A) => B): F<B>;
}
```

### Module Augmentation Pattern

```typescript
declare module './hkt' {
  interface HKTRegistry {
    Maybe: Maybe<any>;
    Either: Either<any, any>;
  }
}
```

## Hints

1. TypeScript doesn't have native HKT support, but we can simulate it with clever type programming
2. Use module augmentation to register type constructors in a global registry
3. Branded types help us distinguish between different kinds at the type level
4. Think in terms of "containers" and "contained values" - abstract over the container
5. HKT allows us to write code once that works for Maybe, Either, Array, IO, etc.
6. Focus on the "shape" of computation, not the specific container

## Expected Behavior

When complete, you should be able to:

```typescript
// Generic function that works with any Functor
const double = <F extends keyof HKTRegistry>(F: Functor<F>) =>
  <A>(fa: Kind<F, A>) => F.map(fa, (x: number) => x * 2);

// Works with Maybe
const maybeFunctor = getMaybeFunctor();
const doubledMaybe = double(maybeFunctor)(some(5)); // Some(10)

// Works with Array  
const arrayFunctor = getArrayFunctor();
const doubledArray = double(arrayFunctor)([1, 2, 3]); // [2, 4, 6]

// Form validation with error accumulation
const validateUser = applicativeValidation({
  name: validateName,
  email: validateEmail,
  age: validateAge
});
```

**Estimated time:** 60 minutes  
**Difficulty:** 5/5