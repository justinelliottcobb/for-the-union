# Profunctors and Variance Patterns

Master contravariant/covariant duality and implement powerful data transformation patterns.

## Learning Objectives

- Understand contravariant/covariant duality principles
- Implement Function, Tagged, Star, Forget profunctors
- Master Strong profunctors for handling product types
- Use Choice profunctors for handling sum types
- Create Optics (Lenses) using profunctor encoding
- Build data transformation pipelines and parser combinators

## Background

Profunctors are a fundamental abstraction that captures the essence of "things that can be transformed from both directions." They're contravariant in their first argument and covariant in their second argument.

While Functors map `F<A> → F<B>`, Profunctors map `P<A, C> → P<B, D>` where:
- `A → B` (contravariant - we can map backwards)  
- `C → D` (covariant - we can map forwards)

This duality enables powerful patterns like:
- Lenses for data access and modification
- Parser combinators that transform input and output
- Data transformation pipelines
- Adapters that convert between different interfaces

## Instructions

1. **Implement Core Profunctors**
   - `Function` profunctor: `(A) => C`
   - `Tagged` profunctor: `{ tag: A; value: C }`
   - `Star` profunctor: `(A) => F<C>` (for some Functor F)
   - `Forget` profunctor: `(A) => R` (ignoring the second type)

2. **Strong Profunctors for Product Types**
   - Implement `Strong` typeclass for handling tuples/records
   - Create `first` and `second` operations for tuple manipulation
   - Show how Strong enables working with product types
   - Build record field accessors using Strong

3. **Choice Profunctors for Sum Types**
   - Implement `Choice` typeclass for handling Either/unions
   - Create `left` and `right` operations for sum type handling
   - Show how Choice enables working with union types
   - Build error handling pipelines using Choice

4. **Optics with Profunctor Encoding**
   - Implement Lens using profunctor encoding
   - Create Prism for optional access
   - Build Traversal for multi-target operations
   - Show how optics compose naturally

5. **Parser Combinators**
   - Create parser type using profunctor pattern
   - Implement primitive parsers (string, number, etc.)
   - Build combinator operations (sequence, choice, many)
   - Show how profunctors enable parser composition

6. **Data Transformation Pipelines**
   - Create transformation pipeline using profunctors
   - Implement mapping, filtering, and aggregation stages
   - Show how pipelines compose and transform
   - Build practical data processing examples

## Key Concepts

### Profunctor Definition

```typescript
interface Profunctor<P extends Profunctor2> {
  // Contravariant in first argument, covariant in second
  dimap<A, B, C, D>(
    pab: HKT2<P, A, B>,
    f: (c: C) => A,  // contravariant
    g: (b: B) => D   // covariant
  ): HKT2<P, C, D>;
}
```

### Strong for Product Types

```typescript
interface Strong<P extends Profunctor2> extends Profunctor<P> {
  first<A, B, C>(pab: HKT2<P, A, B>): HKT2<P, [A, C], [B, C]>;
  second<A, B, C>(pab: HKT2<P, A, B>): HKT2<P, [C, A], [C, B]>;
}
```

### Lens as Profunctor

```typescript
type Lens<S, T, A, B> = <P extends Strong>(
  P: Strong<P>
) => (pab: HKT2<P, A, B>) => HKT2<P, S, T>;

// Usage
const nameLens: Lens<User, User, string, string> = 
  <P extends Strong>(P: Strong<P>) =>
    P.dimap(
      P.first,
      (user: User) => [user.name, user],
      ([newName, user]: [string, User]) => ({ ...user, name: newName })
    );
```

## Hints

1. Profunctors are contravariant in first argument, covariant in second
2. Strong profunctors can handle tuples and records
3. Choice profunctors can handle Either and union types
4. Lenses are just profunctor-encoded data accessors
5. Parser combinators naturally form profunctor structures
6. Think of profunctors as "shape-preserving transformations"

## Expected Behavior

When complete, you should be able to:

```typescript
// Function profunctor
const addOne = (x: number) => x + 1;
const doubled = functionProfunctor.dimap(
  addOne,
  (s: string) => parseInt(s),  // contravariant
  (n: number) => n.toString()  // covariant
); // (s: string) => string

// Lens composition
const userAddressStreet = compose(
  userAddress,    // Lens<User, User, Address, Address>
  addressStreet   // Lens<Address, Address, string, string>
); // Lens<User, User, string, string>

// Parser combinators
const numberParser = profunctorParser.dimap(
  stringParser,
  (input: string) => input,
  (result: string) => parseInt(result)
); // Parser<string, number>

// Data pipeline
const pipeline = profunctorPipeline
  .dimap(
    transformStage,
    (input: RawData) => input.values,
    (output: ProcessedData) => ({ result: output })
  );
```

**Estimated time:** 65 minutes  
**Difficulty:** 5/5