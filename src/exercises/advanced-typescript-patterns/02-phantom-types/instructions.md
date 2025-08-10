# Phantom Types and Compile-time Safety

Achieve zero-runtime-cost type-level constraints and invariants using phantom types.

## Learning Objectives

- Understand phantom types and zero-runtime-cost safety
- Implement state machines with phantom states
- Create units of measure preventing calculation errors
- Design database connection lifecycle with phantom states
- Build HTTP request builders ensuring required fields
- Create branded primitives preventing type mix-ups

## Background

Phantom types are types that exist only at compile time and carry no runtime information. They're called "phantom" because the type parameter doesn't actually appear in the runtime representation of the data, but it's tracked by the type system for safety.

This enables us to:
- Prevent invalid state transitions in state machines
- Ensure units of measure compatibility (preventing Mars Climate Orbiter disasters)
- Guarantee required fields in builders
- Create branded primitives that can't be mixed up

## Instructions

1. **Create Phantom State Machines**
   - Implement a `Door` type with phantom states: `Open`, `Closed`, `Locked`
   - Define state transition functions that only allow valid transitions
   - Ensure impossible transitions are caught at compile time

2. **Implement Units of Measure**
   - Create branded types for `Meters`, `Feet`, `Kilograms`, `Pounds`
   - Implement conversion functions between compatible units
   - Prevent mixing incompatible units (length + weight should not compile)

3. **Design Database Connection Lifecycle**
   - Model connection states: `Disconnected`, `Connected`, `InTransaction`
   - Ensure queries can only be run on connected database
   - Prevent committing transactions that haven't been started

4. **Build HTTP Request Builder**
   - Create a builder that tracks which required fields have been set
   - Use phantom types to ensure URL, method, and body are provided
   - Make the request only compilable when all required fields are present

5. **Create Branded Primitives**
   - Implement `UserId`, `EmailAddress`, `ProductId` as branded string types
   - Prevent accidentally passing a `UserId` where `ProductId` is expected
   - Show how this prevents entire classes of bugs

6. **Interactive React Component**
   - Create a door control component that uses phantom state machine
   - Show how invalid operations are prevented at compile time
   - Demonstrate the power of type-level state tracking

## Key Concepts

### Phantom Types Pattern

```typescript
// The State parameter is "phantom" - it doesn't exist at runtime
type Door<State extends DoorState> = {
  readonly _state: State; // This is never actually used
  readonly isOpen: boolean; // This is the actual runtime data
};

type Open = { readonly _tag: 'Open' };
type Closed = { readonly _tag: 'Closed' };
type Locked = { readonly _tag: 'Locked' };

// Only certain transitions are allowed
function lock(door: Door<Closed>): Door<Locked>;
function open(door: Door<Closed>): Door<Open>;
// function lock(door: Door<Open>): Door<Locked>; // This shouldn't exist!
```

### Branded Types for Safety

```typescript
type UserId = string & { readonly _brand: 'UserId' };
type ProductId = string & { readonly _brand: 'ProductId' };

// These are identical at runtime, but different at compile time
const userId: UserId = 'user-123' as UserId;
const productId: ProductId = 'product-456' as ProductId;

// This would be a compile error:
// processUser(productId); // Type error!
```

## Hints

1. Phantom types exist only at compile time - no runtime overhead
2. Use branded types with never-existing properties
3. State machines can prevent invalid state transitions at compile time
4. Units of measure prevent Mars Climate Orbiter disasters
5. Builder patterns can ensure all required fields are provided
6. Branded primitives like UserId prevent accidental mixing

## Expected Behavior

When complete, you should be able to:

```typescript
// State machine usage
const door = createDoor(); // Door<Closed>
const openDoor = open(door); // Door<Open>
// const lockedOpenDoor = lock(openDoor); // Compile error!

// Units of measure
const distance = meters(100);
const weight = kilograms(50);
// const invalid = add(distance, weight); // Compile error!

// Branded primitives
const user: UserId = createUserId('123');
const product: ProductId = createProductId('456');
// processUser(product); // Compile error!

// Request builder
const request = httpRequest()
  .url('/api/users')
  .method('POST')
  .body({ name: 'John' })
  .send(); // Only compiles when all required fields are set
```

**Estimated time:** 45 minutes  
**Difficulty:** 4/5