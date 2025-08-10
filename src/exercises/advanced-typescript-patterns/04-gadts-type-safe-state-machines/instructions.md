# GADTs and Type-Safe State Machines

Master Generalized Algebraic Data Types to create impossible-to-break state machines.

## Learning Objectives

- Understand Generalized Algebraic Data Types extending regular ADTs
- Implement network connection state machines preventing invalid transitions
- Create document editing systems with undo/redo capabilities
- Build game state management with hierarchical states
- Model HTTP request lifecycles with type safety
- Design interactive React components with impossible-to-break state

## Background

Generalized Algebraic Data Types (GADTs) extend regular Algebraic Data Types by allowing constructors to specify their return types more precisely. While regular ADTs have all constructors return the same type, GADTs let each constructor return a more specific type.

This enables:
- State machines where impossible states are literally impossible
- Type-safe parsing where the result type depends on the input
- Protocol implementations where each step constrains the next
- UI state management where invalid combinations can't be represented

## Instructions

1. **Network Connection State Machine**
   - Model states: `Disconnected`, `Connecting`, `Connected`, `Error`
   - Implement GADT constructors that encode valid transitions
   - Ensure operations are only available in appropriate states
   - Show how impossible transitions become compile errors

2. **Document Editor with Undo/Redo**
   - Create document state: `Clean`, `Dirty`, `Saving`, `Error`
   - Implement operation history with type-safe undo/redo
   - Track document version and prevent invalid operations
   - Handle complex state transitions safely

3. **Game State Management**
   - Model hierarchical states: `Menu`, `Playing`, `Paused`, `GameOver`
   - Create sub-states within `Playing`: `Turn<Player>`, `Animation`, `WaitingForInput`
   - Implement state transitions that preserve game invariants
   - Show how game logic becomes impossible to break

4. **HTTP Request Lifecycle**
   - Model request phases: `Pending`, `Headers`, `Body`, `Complete`, `Error`
   - Ensure each phase only allows appropriate operations
   - Track request/response types through the lifecycle
   - Prevent accessing response before it's available

5. **Interactive React Components**
   - Create a network status component using GADT state machine
   - Implement document editor with type-safe state management
   - Build game UI that prevents invalid user actions
   - Demonstrate how GADTs make UI bugs impossible

6. **Advanced GADT Patterns**
   - Implement existential types within GADTs
   - Create type witnesses for runtime type information
   - Show how GADTs enable safe downcasting
   - Demonstrate protocol state machines

## Key Concepts

### GADT Pattern in TypeScript

```typescript
// Regular ADT - all constructors return ConnectionState
type ConnectionState = 
  | { type: 'disconnected' }
  | { type: 'connecting' }
  | { type: 'connected', socket: WebSocket };

// GADT - constructors return more specific types
type Connection<S extends ConnectionStatus> = {
  status: S;
  data: ConnectionData<S>;
};

type ConnectionData<S> = 
  S extends 'disconnected' ? {} :
  S extends 'connecting' ? { startTime: number } :
  S extends 'connected' ? { socket: WebSocket; connectedAt: number } :
  never;
```

### Type-Safe State Transitions

```typescript
function connect(conn: Connection<'disconnected'>): Connection<'connecting'>;
function finishConnect(
  conn: Connection<'connecting'>, 
  socket: WebSocket
): Connection<'connected'>;
function send(
  conn: Connection<'connected'>, 
  data: string
): Promise<void>;

// This won't compile:
// function send(conn: Connection<'disconnected'>, data: string): Promise<void>;
```

## Hints

1. GADTs allow constructors to specify return types more precisely
2. State machines can encode valid transitions at the type level
3. Pattern matching reveals additional type information
4. Impossible states become literally impossible to represent
5. React components can leverage GADTs for bulletproof state management
6. Use discriminated unions with type guards for GADT patterns

## Expected Behavior

When complete, you should be able to:

```typescript
// Network state machine
const disconnected = createConnection(); // Connection<'disconnected'>
const connecting = connect(disconnected); // Connection<'connecting'>
const connected = finishConnect(connecting, socket); // Connection<'connected'>

// Only connected state allows sending
send(connected, 'Hello'); // ✓ Compiles
// send(disconnected, 'Hello'); // ✗ Compile error!

// Document editor
const doc = createDocument(); // Document<'clean'>
const edited = edit(doc, 'new content'); // Document<'dirty'>
const saving = startSave(edited); // Document<'saving'>
// const undone = undo(saving); // ✗ Compile error! Can't undo while saving

// Game state
const game = startGame(); // Game<'menu'>
const playing = enterGame(game, players); // Game<'playing', Turn<Player1>>
const afterMove = makeMove(playing, move); // Game<'playing', Turn<Player2>>
// const invalid = makeMove(afterMove, move); // ✗ Wrong player's turn!
```

**Estimated time:** 55 minutes  
**Difficulty:** 5/5