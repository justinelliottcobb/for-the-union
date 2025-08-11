// Phantom Types and Compile-time Safety - Solution
import React, { useState } from 'react';

// Phantom State Machine - Door Example
type DoorState = 'open' | 'closed' | 'locked';
type Door<State extends DoorState> = {
  readonly _phantomState: State;
  readonly isOpen: boolean;
  readonly isLocked: boolean;
};

// Constructor
const createDoor = (): Door<'closed'> => ({
  _phantomState: 'closed',
  isOpen: false,
  isLocked: false
});

// State transition functions - only valid transitions allowed
const open = (door: Door<'closed'>): Door<'open'> => ({
  _phantomState: 'open',
  isOpen: true,
  isLocked: false
});

const close = (door: Door<'open'>): Door<'closed'> => ({
  _phantomState: 'closed',
  isOpen: false,
  isLocked: false
});

const lock = (door: Door<'closed'>): Door<'locked'> => ({
  _phantomState: 'locked',
  isOpen: false,
  isLocked: true
});

const unlock = (door: Door<'locked'>): Door<'closed'> => ({
  _phantomState: 'closed',
  isOpen: false,
  isLocked: false
});

// Units of Measure
type Meters = number & { readonly _unit: 'meters' };
type Feet = number & { readonly _unit: 'feet' };
type Kilograms = number & { readonly _unit: 'kg' };

const meters = (value: number): Meters => value as Meters;
const feet = (value: number): Feet => value as Feet;
const kilograms = (value: number): Kilograms => value as Kilograms;

// Unit conversions
const metersToFeet = (m: Meters): Feet => feet(m * 3.28084);
const feetToMeters = (f: Feet): Meters => meters(f / 3.28084);

// Safe arithmetic (only same units)
const addMeters = (a: Meters, b: Meters): Meters => meters(a + b);
const addFeet = (a: Feet, b: Feet): Feet => feet(a + b);

// Branded Primitives
type UserId = string & { readonly _brand: 'UserId' };
type ProductId = string & { readonly _brand: 'ProductId' };

const createUserId = (id: string): UserId => id as UserId;
const createProductId = (id: string): ProductId => id as ProductId;

const processUser = (userId: UserId): string => `Processing user: ${userId}`;
const processProduct = (productId: ProductId): string => `Processing product: ${productId}`;

// HTTP Request Builder with Required Fields
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type RequestBuilder<HasUrl extends boolean = false, HasMethod extends boolean = false> = {
  readonly _hasUrl: HasUrl;
  readonly _hasMethod: HasMethod;
  readonly url?: string;
  readonly method?: HttpMethod;
  readonly body?: any;
  readonly headers?: Record<string, string>;
};

const createRequestBuilder = (): RequestBuilder => ({
  _hasUrl: false,
  _hasMethod: false
});

const withUrl = <M extends boolean,>(
  builder: RequestBuilder<false, M>,
  url: string
): RequestBuilder<true, M> => ({
  ...builder,
  _hasUrl: true,
  url
});

const withMethod = <U extends boolean,>(
  builder: RequestBuilder<U, false>,
  method: HttpMethod
): RequestBuilder<U, true> => ({
  ...builder,
  _hasMethod: true,
  method
});

const withBody = <U extends boolean, M extends boolean,>(
  builder: RequestBuilder<U, M>,
  body: any
): RequestBuilder<U, M> => ({
  ...builder,
  body
});

// Can only send when both URL and method are provided
const send = (builder: RequestBuilder<true, true>): Promise<Response> => {
  return fetch(builder.url!, {
    method: builder.method,
    body: builder.body ? JSON.stringify(builder.body) : undefined,
    headers: builder.headers
  });
};

// Interactive Demo Component
export const PhantomTypesDemo: React.FC = () => {
  const [doorState, setDoorState] = useState<'open' | 'closed' | 'locked'>('closed');
  
  let door: Door<any> = createDoor();
  
  const handleDoorAction = (action: string) => {
    try {
      switch (action) {
        case 'open':
          if (doorState === 'closed') {
            door = open(door);
            setDoorState('open');
          }
          break;
        case 'close':
          if (doorState === 'open') {
            door = close(door);
            setDoorState('closed');
          }
          break;
        case 'lock':
          if (doorState === 'closed') {
            door = lock(door);
            setDoorState('locked');
          }
          break;
        case 'unlock':
          if (doorState === 'locked') {
            door = unlock(door);
            setDoorState('closed');
          }
          break;
      }
    } catch (error) {
      console.log('Invalid state transition prevented at compile time');
    }
  };

  // Units demo
  const distance1 = meters(100);
  const distance2 = meters(50);
  const totalDistance = addMeters(distance1, distance2);
  const distanceInFeet = metersToFeet(totalDistance);

  // Branded types demo
  const userId = createUserId('user-123');
  const productId = createProductId('prod-456');

  return (
    <div>
      <h3>Phantom Types Demo</h3>
      
      <div>
        <h4>State Machine: Door is {doorState}</h4>
        <button onClick={() => handleDoorAction('open')} disabled={doorState !== 'closed'}>
          Open
        </button>
        <button onClick={() => handleDoorAction('close')} disabled={doorState !== 'open'}>
          Close
        </button>
        <button onClick={() => handleDoorAction('lock')} disabled={doorState !== 'closed'}>
          Lock
        </button>
        <button onClick={() => handleDoorAction('unlock')} disabled={doorState !== 'locked'}>
          Unlock
        </button>
      </div>

      <div>
        <h4>Units of Measure</h4>
        <p>Distance: {totalDistance} meters = {distanceInFeet.toFixed(2)} feet</p>
      </div>

      <div>
        <h4>Branded Types</h4>
        <p>{processUser(userId)}</p>
        <p>{processProduct(productId)}</p>
      </div>
    </div>
  );
};

export default PhantomTypesDemo;