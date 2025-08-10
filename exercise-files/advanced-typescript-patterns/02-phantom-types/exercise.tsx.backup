// Phantom Types and Compile-time Safety
// Master phantom types to encode invariants and states that exist only at compile time

// Learning objectives:
// - Understand phantom types and their zero-runtime-cost nature
// - Encode states, units, protocols, and invariants in the type system
// - Create impossible states unrepresentable at compile time
// - Build type-safe APIs that prevent common programming errors
// - Design state machines with phantom type states
// - Implement branded types for domain-specific primitives

// Hints:
// 1. Phantom types are type parameters that don't appear in the value constructor
// 2. Use unique symbols or brands to create distinct types from the same underlying data
// 3. Phantom types are erased at runtime - zero performance cost
// 4. Think of them as compile-time "tags" or "labels" on your data
// 5. Use phantom types to model state transitions, units, permissions, protocols
// 6. Builder patterns with phantom types ensure correct API usage

import React, { useState, useCallback, useEffect } from 'react';

// TODO: Foundation - Phantom Type Infrastructure

// Unique symbol brands for creating distinct phantom types
declare const BrandSymbol: unique symbol;
declare const StateSymbol: unique symbol;
declare const UnitSymbol: unique symbol;
declare const ProtocolSymbol: unique symbol;
declare const PermissionSymbol: unique symbol;

// Basic phantom type wrapper
type Phantom<T, P> = T & { readonly [BrandSymbol]: P };

// Create a phantom type constructor
const phantom = <T, P>(value: T): Phantom<T, P> => value as Phantom<T, P>;

// Extract the underlying value (unsafe - loses phantom information)
const unphantom = <T, P>(phantom: Phantom<T, P>): T => phantom as T;

// TODO: Example 1 - State Machine with Phantom States
// Model a door that can be Open, Closed, or Locked - invalid transitions are impossible

// Phantom state brands
interface DoorOpen {}
interface DoorClosed {}
interface DoorLocked {}

// Door with phantom state
type Door<State> = Phantom<{
  readonly material: string;
  readonly width: number;
  readonly height: number;
}, State>;

// Smart constructors ensure proper initial states
const Door = {
  // Create a new closed door
  create: (material: string, width: number, height: number): Door<DoorClosed> =>
    phantom({ material, width, height }),

  // State transitions with compile-time safety
  open: (door: Door<DoorClosed>): Door<DoorOpen> =>
    phantom(unphantom(door)),

  close: (door: Door<DoorOpen>): Door<DoorClosed> =>
    phantom(unphantom(door)),

  lock: (door: Door<DoorClosed>): Door<DoorLocked> =>
    phantom(unphantom(door)),

  unlock: (door: Door<DoorLocked>): Door<DoorClosed> =>
    phantom(unphantom(door)),

  // Operations only valid in specific states
  walkThrough: (door: Door<DoorOpen>): string => {
    const { material } = unphantom(door);
    return `Walking through the ${material} door`;
  },

  knock: (door: Door<DoorClosed> | Door<DoorLocked>): string => {
    const { material } = unphantom(door);
    return `*knock knock* on the ${material} door`;
  },

  // Query functions work on any door state
  describe: <State>(door: Door<State>): string => {
    const { material, width, height } = unphantom(door);
    return `${material} door: ${width}x${height}`;
  },
};

// TODO: Example 2 - Units of Measure
// Prevent unit confusion (like the Mars Climate Orbiter disaster)

interface Meters {}
interface Feet {}
interface Seconds {}
interface MetersPerSecond {}
interface FeetPerSecond {}

type Distance<Unit> = Phantom<number, Unit>;
type Time<Unit> = Phantom<number, Unit>;
type Velocity<Unit> = Phantom<number, Unit>;

const Units = {
  // Distance constructors
  meters: (value: number): Distance<Meters> => phantom(value),
  feet: (value: number): Distance<Feet> => phantom(value),

  // Time constructors
  seconds: (value: number): Time<Seconds> => phantom(value),

  // Velocity constructors
  metersPerSecond: (value: number): Velocity<MetersPerSecond> => phantom(value),
  feetPerSecond: (value: number): Velocity<FeetPerSecond> => phantom(value),

  // Safe unit conversions
  feetToMeters: (feet: Distance<Feet>): Distance<Meters> =>
    phantom(unphantom(feet) * 0.3048),

  metersToFeet: (meters: Distance<Meters>): Distance<Feet> =>
    phantom(unphantom(meters) / 0.3048),

  // Physics calculations with type safety
  velocity: (distance: Distance<Meters>, time: Time<Seconds>): Velocity<MetersPerSecond> =>
    phantom(unphantom(distance) / unphantom(time)),

  distance: (velocity: Velocity<MetersPerSecond>, time: Time<Seconds>): Distance<Meters> =>
    phantom(unphantom(velocity) * unphantom(time)),

  // Generic arithmetic for same-unit values
  add: <Unit>(a: Distance<Unit>, b: Distance<Unit>): Distance<Unit> =>
    phantom(unphantom(a) + unphantom(b)),

  subtract: <Unit>(a: Distance<Unit>, b: Distance<Unit>): Distance<Unit> =>
    phantom(unphantom(a) - unphantom(b)),

  multiply: <Unit>(distance: Distance<Unit>, scalar: number): Distance<Unit> =>
    phantom(unphantom(distance) * scalar),

  // Comparison operations
  compare: <Unit>(a: Distance<Unit>, b: Distance<Unit>): number =>
    unphantom(a) - unphantom(b),

  isGreater: <Unit>(a: Distance<Unit>, b: Distance<Unit>): boolean =>
    unphantom(a) > unphantom(b),
};

// TODO: Example 3 - Database Connection States
// Ensure proper connection lifecycle management

interface Connected {}
interface Disconnected {}
interface InTransaction {}

type DatabaseConnection<State> = Phantom<{
  readonly host: string;
  readonly database: string;
  readonly connectionId: string;
}, State>;

type Query = string;
type QueryResult = { rows: unknown[]; rowCount: number };

const Database = {
  // Create disconnected connection
  create: (host: string, database: string): DatabaseConnection<Disconnected> =>
    phantom({
      host,
      database,
      connectionId: Math.random().toString(36),
    }),

  // Connect (async simulation)
  connect: async (conn: DatabaseConnection<Disconnected>): Promise<DatabaseConnection<Connected>> => {
    const { host, database } = unphantom(conn);
    console.log(`Connecting to ${database} on ${host}...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return phantom(unphantom(conn));
  },

  // Disconnect
  disconnect: async <State extends Connected | InTransaction>(
    conn: DatabaseConnection<State>
  ): Promise<DatabaseConnection<Disconnected>> => {
    const { host, database } = unphantom(conn);
    console.log(`Disconnecting from ${database} on ${host}...`);
    await new Promise(resolve => setTimeout(resolve, 50));
    return phantom(unphantom(conn));
  },

  // Execute query (only when connected)
  query: async (conn: DatabaseConnection<Connected>, sql: Query): Promise<QueryResult> => {
    const { database } = unphantom(conn);
    console.log(`Executing query on ${database}: ${sql}`);
    await new Promise(resolve => setTimeout(resolve, 200));
    return { rows: [{ id: 1, name: 'test' }], rowCount: 1 };
  },

  // Begin transaction
  beginTransaction: async (conn: DatabaseConnection<Connected>): Promise<DatabaseConnection<InTransaction>> => {
    const { database } = unphantom(conn);
    console.log(`Beginning transaction on ${database}`);
    await new Promise(resolve => setTimeout(resolve, 50));
    return phantom(unphantom(conn));
  },

  // Commit transaction
  commit: async (conn: DatabaseConnection<InTransaction>): Promise<DatabaseConnection<Connected>> => {
    const { database } = unphantom(conn);
    console.log(`Committing transaction on ${database}`);
    await new Promise(resolve => setTimeout(resolve, 50));
    return phantom(unphantom(conn));
  },

  // Rollback transaction
  rollback: async (conn: DatabaseConnection<InTransaction>): Promise<DatabaseConnection<Connected>> => {
    const { database } = unphantom(conn);
    console.log(`Rolling back transaction on ${database}`);
    await new Promise(resolve => setTimeout(resolve, 50));
    return phantom(unphantom(conn));
  },

  // Execute in transaction (only when in transaction)
  executeInTransaction: async (conn: DatabaseConnection<InTransaction>, sql: Query): Promise<QueryResult> => {
    const { database } = unphantom(conn);
    console.log(`Executing in transaction on ${database}: ${sql}`);
    await new Promise(resolve => setTimeout(resolve, 150));
    return { rows: [{ affected: 1 }], rowCount: 1 };
  },
};

// TODO: Example 4 - HTTP Protocol Phantom Types
// Ensure correct HTTP request building

interface MethodSet {}
interface MethodNotSet {}
interface URLSet {}
interface URLNotSet {}
interface HeadersSet {}
interface HeadersNotSet {}

// HTTP request builder with phantom state tracking
type HTTPRequestBuilder<Method, URL, Headers> = Phantom<{
  method?: string;
  url?: string;
  headers: Record<string, string>;
  body?: string;
}, { method: Method; url: URL; headers: Headers }>;

type CompleteRequest = HTTPRequestBuilder<MethodSet, URLSet, HeadersSet>;

const HTTPRequest = {
  // Create empty builder
  builder: (): HTTPRequestBuilder<MethodNotSet, URLNotSet, HeadersNotSet> =>
    phantom({ headers: {} }),

  // Set method (transitions MethodNotSet -> MethodSet)
  method: <URL, Headers>(
    builder: HTTPRequestBuilder<MethodNotSet, URL, Headers>,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  ): HTTPRequestBuilder<MethodSet, URL, Headers> => {
    const current = unphantom(builder);
    return phantom({ ...current, method });
  },

  // Set URL (transitions URLNotSet -> URLSet)
  url: <Method, Headers>(
    builder: HTTPRequestBuilder<Method, URLNotSet, Headers>,
    url: string
  ): HTTPRequestBuilder<Method, URLSet, Headers> => {
    const current = unphantom(builder);
    return phantom({ ...current, url });
  },

  // Add header (transitions HeadersNotSet -> HeadersSet)
  header: <Method, URL>(
    builder: HTTPRequestBuilder<Method, URL, HeadersNotSet>,
    key: string,
    value: string
  ): HTTPRequestBuilder<Method, URL, HeadersSet> => {
    const current = unphantom(builder);
    return phantom({
      ...current,
      headers: { ...current.headers, [key]: value },
    });
  },

  // Add header to existing headers
  addHeader: <Method, URL>(
    builder: HTTPRequestBuilder<Method, URL, HeadersSet>,
    key: string,
    value: string
  ): HTTPRequestBuilder<Method, URL, HeadersSet> => {
    const current = unphantom(builder);
    return phantom({
      ...current,
      headers: { ...current.headers, [key]: value },
    });
  },

  // Set body (works on any complete request)
  body: (builder: CompleteRequest, body: string): CompleteRequest => {
    const current = unphantom(builder);
    return phantom({ ...current, body });
  },

  // Execute request (only when complete)
  execute: async (request: CompleteRequest): Promise<{ status: number; data: any }> => {
    const { method, url, headers, body } = unphantom(request);
    console.log(`${method} ${url}`, { headers, body });
    
    // Simulate HTTP request
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      status: 200,
      data: { message: 'Success', requestId: Math.random().toString(36) },
    };
  },
};

// TODO: Example 5 - Branded Primitive Types
// Prevent mixing up similar primitive values

// User ID brand
interface UserIdBrand {}
type UserId = Phantom<number, UserIdBrand>;

// Order ID brand
interface OrderIdBrand {}
type OrderId = Phantom<string, OrderIdBrand>;

// Email brand with validation
interface EmailBrand {}
type Email = Phantom<string, EmailBrand>;

// Password brand (never logged or displayed)
interface PasswordBrand {}
type Password = Phantom<string, PasswordBrand>;

const BrandedPrimitives = {
  // Safe constructors with validation
  userId: (id: number): UserId | null =>
    id > 0 ? phantom(id) : null,

  orderId: (id: string): OrderId | null =>
    /^ORD-\d{8}$/.test(id) ? phantom(id) : null,

  email: (email: string): Email | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? phantom(email) : null;
  },

  password: (password: string): Password | null =>
    password.length >= 8 ? phantom(password) : null,

  // Utilities
  userIdToString: (userId: UserId): string => 
    `User#${unphantom(userId)}`,

  orderIdToString: (orderId: OrderId): string => 
    unphantom(orderId),

  emailDomain: (email: Email): string => 
    unphantom(email).split('@')[1],

  // Unsafe extractors (use sparingly)
  unsafeExtractUserId: (userId: UserId): number => unphantom(userId),
  unsafeExtractOrderId: (orderId: OrderId): string => unphantom(orderId),
  unsafeExtractEmail: (email: Email): string => unphantom(email),
  // Note: No password extractor - passwords should never be extracted for display
};

// TODO: Example 6 - File System Permissions
// Ensure only authorized operations can be performed

interface ReadPermission {}
interface WritePermission {}
interface ExecutePermission {}

// File handle with phantom permissions
type FileHandle<Permissions> = Phantom<{
  readonly path: string;
  readonly size: number;
}, Permissions>;

// Permission combinators
type HasRead<P> = P extends ReadPermission ? ReadPermission : never;
type HasWrite<P> = P extends WritePermission ? WritePermission : never;
type HasExecute<P> = P extends ExecutePermission ? ExecutePermission : never;

// Common permission combinations
type ReadOnly = ReadPermission;
type ReadWrite = ReadPermission & WritePermission;
type ReadExecute = ReadPermission & ExecutePermission;
type FullPermissions = ReadPermission & WritePermission & ExecutePermission;

const FileSystem = {
  // Open file with specific permissions
  openReadOnly: (path: string): FileHandle<ReadOnly> =>
    phantom({ path, size: 1024 }),

  openReadWrite: (path: string): FileHandle<ReadWrite> =>
    phantom({ path, size: 1024 }),

  openExecutable: (path: string): FileHandle<ReadExecute> =>
    phantom({ path, size: 2048 }),

  openFull: (path: string): FileHandle<FullPermissions> =>
    phantom({ path, size: 4096 }),

  // Operations requiring specific permissions
  read: <P>(file: FileHandle<P & ReadPermission>): string => {
    const { path } = unphantom(file);
    return `Contents of ${path}`;
  },

  write: <P>(file: FileHandle<P & WritePermission>, data: string): void => {
    const { path } = unphantom(file);
    console.log(`Writing to ${path}: ${data}`);
  },

  execute: <P>(file: FileHandle<P & ExecutePermission>): string => {
    const { path } = unphantom(file);
    return `Executing ${path}...`;
  },

  // Metadata operations (work on any file)
  getSize: <P>(file: FileHandle<P>): number => unphantom(file).size,
  getPath: <P>(file: FileHandle<P>): string => unphantom(file).path,

  // Permission escalation/de-escalation
  addWritePermission: <P extends ReadPermission>(
    file: FileHandle<P>
  ): FileHandle<P & WritePermission> => phantom(unphantom(file)),

  removeWritePermission: <P extends WritePermission>(
    file: FileHandle<P>
  ): FileHandle<Exclude<P, WritePermission>> => phantom(unphantom(file)),
};

// TODO: React Components demonstrating phantom types

// Door state machine component
function PhantomDoorDemo() {
  // We need to track the door state at runtime for the UI
  const [doorState, setDoorState] = useState<'closed' | 'open' | 'locked'>('closed');
  const [door, setDoor] = useState(() => Door.create('Oak', 32, 80));
  const [message, setMessage] = useState('');

  // Type-safe operations based on current state
  const handleOperation = useCallback((operation: string) => {
    try {
      switch (operation) {
        case 'open':
          if (doorState === 'closed') {
            const openDoor = Door.open(door as Door<DoorClosed>);
            setDoor(openDoor as any);
            setDoorState('open');
            setMessage(Door.describe(openDoor));
          }
          break;
        case 'close':
          if (doorState === 'open') {
            const closedDoor = Door.close(door as Door<DoorOpen>);
            setDoor(closedDoor as any);
            setDoorState('closed');
            setMessage(Door.describe(closedDoor));
          }
          break;
        case 'lock':
          if (doorState === 'closed') {
            const lockedDoor = Door.lock(door as Door<DoorClosed>);
            setDoor(lockedDoor as any);
            setDoorState('locked');
            setMessage(Door.describe(lockedDoor));
          }
          break;
        case 'unlock':
          if (doorState === 'locked') {
            const unlockedDoor = Door.unlock(door as Door<DoorLocked>);
            setDoor(unlockedDoor as any);
            setDoorState('closed');
            setMessage(Door.describe(unlockedDoor));
          }
          break;
        case 'walkThrough':
          if (doorState === 'open') {
            const walkMessage = Door.walkThrough(door as Door<DoorOpen>);
            setMessage(walkMessage);
          }
          break;
        case 'knock':
          if (doorState === 'closed' || doorState === 'locked') {
            const knockMessage = Door.knock(door as Door<DoorClosed> | Door<DoorLocked>);
            setMessage(knockMessage);
          }
          break;
      }
    } catch (error) {
      setMessage('Invalid operation for current door state');
    }
  }, [door, doorState]);

  return (
    <div>
      <h3>Phantom Door State Machine</h3>
      
      <div style={{ margin: '10px 0' }}>
        <strong>State:</strong> {doorState}
      </div>

      <div style={{ margin: '10px 0' }}>
        <button 
          onClick={() => handleOperation('open')}
          disabled={doorState !== 'closed'}
        >
          Open
        </button>
        <button 
          onClick={() => handleOperation('close')}
          disabled={doorState !== 'open'}
        >
          Close
        </button>
        <button 
          onClick={() => handleOperation('lock')}
          disabled={doorState !== 'closed'}
        >
          Lock
        </button>
        <button 
          onClick={() => handleOperation('unlock')}
          disabled={doorState !== 'locked'}
        >
          Unlock
        </button>
      </div>

      <div style={{ margin: '10px 0' }}>
        <button 
          onClick={() => handleOperation('walkThrough')}
          disabled={doorState !== 'open'}
        >
          Walk Through
        </button>
        <button 
          onClick={() => handleOperation('knock')}
          disabled={doorState === 'open'}
        >
          Knock
        </button>
      </div>

      {message && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0' }}>
          {message}
        </div>
      )}
    </div>
  );
}

// Units calculator component
function PhantomUnitsCalculator() {
  const [distance1, setDistance1] = useState(0);
  const [distance2, setDistance2] = useState(0);
  const [unit, setUnit] = useState<'meters' | 'feet'>('meters');
  const [result, setResult] = useState('');

  const handleCalculation = useCallback((operation: string) => {
    const d1 = unit === 'meters' ? Units.meters(distance1) : Units.feet(distance1);
    const d2 = unit === 'meters' ? Units.meters(distance2) : Units.feet(distance2);

    let calc;
    switch (operation) {
      case 'add':
        calc = Units.add(d1, d2);
        setResult(`${unphantom(calc)} ${unit}`);
        break;
      case 'subtract':
        calc = Units.subtract(d1, d2);
        setResult(`${unphantom(calc)} ${unit}`);
        break;
      case 'convert':
        if (unit === 'meters') {
          const converted = Units.metersToFeet(d1);
          setResult(`${unphantom(converted)} feet`);
        } else {
          const converted = Units.feetToMeters(d1);
          setResult(`${unphantom(converted)} meters`);
        }
        break;
    }
  }, [distance1, distance2, unit]);

  return (
    <div>
      <h3>Phantom Units Calculator</h3>
      
      <div>
        <label>
          Unit:
          <select value={unit} onChange={(e) => setUnit(e.target.value as 'meters' | 'feet')}>
            <option value="meters">Meters</option>
            <option value="feet">Feet</option>
          </select>
        </label>
      </div>

      <div>
        <input
          type="number"
          value={distance1}
          onChange={(e) => setDistance1(Number(e.target.value))}
          placeholder="Distance 1"
        />
        <input
          type="number"
          value={distance2}
          onChange={(e) => setDistance2(Number(e.target.value))}
          placeholder="Distance 2"
        />
      </div>

      <div>
        <button onClick={() => handleCalculation('add')}>Add</button>
        <button onClick={() => handleCalculation('subtract')}>Subtract</button>
        <button onClick={() => handleCalculation('convert')}>Convert Unit</button>
      </div>

      {result && (
        <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
          Result: {result}
        </div>
      )}
    </div>
  );
}

// HTTP Request builder component
function PhantomHTTPBuilder() {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRequest = useCallback(async () => {
    setLoading(true);
    try {
      // Build request with phantom type safety
      const request = HTTPRequest.builder()
        |> (b => HTTPRequest.method(b, 'GET'))
        |> (b => HTTPRequest.url(b, 'https://api.example.com/data'))
        |> (b => HTTPRequest.header(b, 'Content-Type', 'application/json'))
        |> (b => HTTPRequest.addHeader(b, 'Authorization', 'Bearer token'));

      const result = await HTTPRequest.execute(request);
      setResponse(result);
    } catch (error) {
      setResponse({ error: 'Request failed' });
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div>
      <h3>Phantom HTTP Request Builder</h3>
      
      <button onClick={handleRequest} disabled={loading}>
        {loading ? 'Sending...' : 'Send Type-Safe Request'}
      </button>

      {response && (
        <pre style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0' }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
}

// Main app component
function App() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Phantom Types and Compile-time Safety</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <PhantomDoorDemo />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <PhantomUnitsCalculator />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <PhantomHTTPBuilder />
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Phantom Types Concepts Demonstrated:</h3>
        <ul>
          <li><strong>State Machines:</strong> Door states with impossible invalid transitions</li>
          <li><strong>Units of Measure:</strong> Prevent unit confusion at compile time</li>
          <li><strong>Connection States:</strong> Database lifecycle management</li>
          <li><strong>Protocol Safety:</strong> HTTP request builder with required fields</li>
          <li><strong>Branded Primitives:</strong> UserId vs OrderId cannot be confused</li>
          <li><strong>Permission Systems:</strong> File operations with phantom permissions</li>
          <li><strong>Zero Runtime Cost:</strong> All safety checks happen at compile time</li>
        </ul>
      </div>
    </div>
  );
}

// Note: The pipeline operator |> is not yet available in TypeScript
// The HTTP builder example would need to be written with nested function calls in practice

export {
  App,
  PhantomDoorDemo,
  PhantomUnitsCalculator,
  PhantomHTTPBuilder,
  Door,
  Units,
  Database,
  HTTPRequest,
  BrandedPrimitives,
  FileSystem,
  phantom,
  unphantom,
  type Phantom,
  type Door as DoorType,
  type Distance,
  type Time,
  type Velocity,
  type DatabaseConnection,
  type HTTPRequestBuilder,
  type CompleteRequest,
  type UserId,
  type OrderId,
  type Email,
  type Password,
  type FileHandle,
};