# Traffic Light States

Learn the fundamentals of discriminated unions by modeling a traffic light system.

## Learning Objectives

- Understand discriminated union basics
- Learn to create type-safe state machines  
- Practice pattern matching with switch statements

## Background

A traffic light has three states: **Red**, **Yellow**, and **Green**. Each state has different behavior:

- **Red**: Cars must stop, duration is typically 30 seconds
- **Yellow**: Cars should prepare to stop, duration is typically 5 seconds  
- **Green**: Cars can go, duration is typically 25 seconds

We want to model this system using TypeScript's discriminated unions to ensure type safety.

## Instructions

1. **Define the Traffic Light States**: Create types for each traffic light state
   - Each state should have a `color` property that acts as the discriminator
   - Each state should include its typical `duration` in seconds
   - Red and Green states should have additional properties relevant to their behavior

2. **Create the Union Type**: Combine all states into a single `TrafficLightState` union

3. **Implement State Functions**: Create functions that work with the union type:
   - `getStateDuration(state: TrafficLightState): number` - returns the duration
   - `getNextState(currentState: TrafficLightState): TrafficLightState` - returns the next state in the cycle
   - `canCarsProceed(state: TrafficLightState): boolean` - returns whether cars can proceed

4. **Handle State Transitions**: Implement a function that processes state changes safely

## Key Concepts

### Discriminated Unions
A discriminated union uses a common property (the discriminator) to distinguish between different object shapes:

```typescript
type Shape = 
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number };
```

### Type Narrowing
TypeScript automatically narrows the type when you check the discriminator:

```typescript
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      // TypeScript knows this is the circle type
      return Math.PI * shape.radius * shape.radius;
    case 'rectangle':
      // TypeScript knows this is the rectangle type  
      return shape.width * shape.height;
  }
}
```

## Hints

1. Start by defining a type for each possible state (Red, Yellow, Green)
2. Use a common property like `color` to discriminate between states  
3. TypeScript will narrow types automatically in switch statements
4. Make sure to handle all cases in your switch statements (exhaustive checking)

## Expected Behavior

When complete, you should be able to:

```typescript
const redLight: TrafficLightState = { color: 'red', duration: 30, /* other props */ };
const yellowLight = getNextState(redLight);
const canGo = canCarsProceed(yellowLight); // false
```

**Estimated time:** 15 minutes  
**Difficulty:** 2/5