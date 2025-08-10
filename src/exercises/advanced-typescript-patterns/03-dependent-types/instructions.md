# Dependent Types and Value-Level Types

Master types that depend on values for sophisticated compile-time safety guarantees.

## Learning Objectives

- Understand dependent types and value-level type programming
- Implement length-indexed arrays with compile-time bounds checking
- Master type-level arithmetic operations
- Create refinement types with value constraints
- Use template literal programming for string manipulation
- Build type-safe configuration builders dependent on environment

## Background

Dependent types are types that depend on values. While TypeScript doesn't have full dependent type support like languages such as Agda or Idris, we can simulate many dependent type patterns using:
- Template literal types for string-based dependent types
- Recursive conditional types for arithmetic
- Mapped types for value-dependent transformations
- Const assertions for preserving literal types

This enables compile-time verification of array bounds, string formats, configuration validity, and more.

## Instructions

1. **Implement Length-Indexed Arrays (Vectors)**
   - Create `Vector<T, N>` type where N is the length
   - Implement safe indexing that prevents out-of-bounds access
   - Create vector operations that preserve length information
   - Show how this prevents buffer overflow bugs

2. **Master Type-Level Arithmetic**
   - Implement `Add<A, B>`, `Sub<A, B>`, `Mult<A, B>` type-level operations
   - Create comparison operations: `LT<A, B>`, `GT<A, B>`, `Eq<A, B>`
   - Use these for compile-time bounds checking
   - Demonstrate arithmetic with practical examples

3. **Create Refinement Types**
   - Implement `PositiveInt`, `NonEmptyString`, `ValidEmail` types
   - Use template literal types for format validation
   - Create smart constructors that enforce constraints
   - Show how refinement types prevent invalid data

4. **Template Literal Programming**
   - Implement case conversion: `CamelCase<T>`, `SnakeCase<T>`, `KebabCase<T>`
   - Create path manipulation: `Join<Paths>`, `Split<Path>`
   - Build URL template parsing and validation
   - Demonstrate advanced string manipulation

5. **Environment-Dependent Configuration**
   - Create config types that depend on environment values
   - Implement `Config<'development' | 'production' | 'test'>`
   - Ensure production configs require security settings
   - Show compile-time environment validation

6. **SQL Query Builder with Schema Dependencies**
   - Create table schema types
   - Implement query builder with schema-dependent result types
   - Ensure SELECT queries return correctly typed results
   - Prevent joining incompatible tables

## Key Concepts

### Length-Indexed Arrays

```typescript
type Vector<T, N extends number> = {
  readonly length: N;
  readonly data: T[];
};

// Safe indexing - only allows valid indices
type SafeIndex<V extends Vector<any, any>, I extends number> = 
  V extends Vector<infer T, infer N>
    ? I extends LT<I, N>
      ? T
      : never
    : never;
```

### Type-Level Arithmetic

```typescript
type Add<A extends number, B extends number> = 
  [...Tuple<A>, ...Tuple<B>]['length'];

type Tuple<N extends number, R extends unknown[] = []> =
  R['length'] extends N ? R : Tuple<N, [...R, unknown]>;
```

### Template Literal Magic

```typescript
type CamelCase<S extends string> = 
  S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${P1}${Uppercase<P2>}${CamelCase<P3>}`
    : S;

// "hello_world_test" → "helloWorldTest"
```

## Hints

1. Dependent types let you encode invariants in the type system
2. Length-indexed arrays prevent out-of-bounds errors at compile time
3. Type-level arithmetic uses recursive conditional types
4. Refinement types ensure values meet specific constraints
5. Template literal types enable powerful string manipulations
6. Environment-dependent configs ensure type safety across deployments

## Expected Behavior

When complete, you should be able to:

```typescript
// Length-indexed arrays
const vec3 = vector([1, 2, 3]); // Vector<number, 3>
const first = vec3[0]; // number
// const invalid = vec3[5]; // Compile error!

// Type-level arithmetic
type Sum = Add<5, 3>; // 8
type IsValid = LT<2, 5>; // true

// Refinement types
const email = createEmail('user@example.com'); // ValidEmail | never
const positive = createPositive(42); // PositiveInt

// Template literal programming
type Camel = CamelCase<'hello_world'>; // 'helloWorld'
type Joined = Join<['api', 'users', 'profile']>; // 'api/users/profile'

// Environment-dependent config
const devConfig: Config<'development'> = { /* dev settings */ };
const prodConfig: Config<'production'> = { 
  /* must include security settings */
};
```

**Estimated time:** 50 minutes  
**Difficulty:** 5/5