// Solution: Advanced State Machines with XState
// Complete implementation of XState patterns with discriminated unions

import React from 'react';
import { createMachine, assign, interpret } from 'xstate';
import { useMachine } from '@xstate/react';

// Authentication context and events
interface AuthContext {
  user: User | null;
  error: string | null;
  attempts: number;
  maxAttempts: number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

type AuthEvent = 
  | { type: 'LOGIN'; credentials: { email: string; password: string } }
  | { type: 'LOGOUT' }
  | { type: 'SUCCESS'; user: User }
  | { type: 'FAILURE'; error: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

// Authentication machine
const authMachine = createMachine<AuthContext, AuthEvent>({
  id: 'auth',
  initial: 'loggedOut',
  context: {
    user: null,
    error: null,
    attempts: 0,
    maxAttempts: 3,
  },
  states: {
    loggedOut: {
      on: {
        LOGIN: {
          target: 'authenticating',
          actions: assign({
            error: null,
            attempts: (ctx) => ctx.attempts + 1,
          }),
          cond: 'hasAttemptsRemaining',
        },
        RESET: {
          actions: assign({
            attempts: 0,
            error: null,
          }),
        },
      },
    },
    authenticating: {
      invoke: {
        id: 'loginUser',
        src: 'loginUser',
        onDone: {
          target: 'loggedIn',
          actions: assign({
            user: (ctx, event) => event.data,
            error: null,
          }),
        },
        onError: {
          target: 'loggedOut',
          actions: assign({
            error: (ctx, event) => event.data.message,
          }),
        },
      },
    },
    loggedIn: {
      on: {
        LOGOUT: {
          target: 'loggedOut',
          actions: assign({
            user: null,
            attempts: 0,
          }),
        },
      },
    },
  },
}, {
  guards: {
    hasAttemptsRemaining: (ctx) => ctx.attempts < ctx.maxAttempts,
  },
  services: {
    loginUser: async (context, event) => {
      const { credentials } = event;
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation
      if (credentials.email === 'test@example.com' && credentials.password === 'password') {
        return {
          id: '1',
          name: 'Test User',
          email: credentials.email,
        };
      } else {
        throw new Error('Invalid credentials');
      }
    },
  },
});

// Shopping cart machine
interface CartContext {
  items: CartItem[];
  total: number;
  shipping: ShippingInfo | null;
  payment: PaymentInfo | null;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ShippingInfo {
  address: string;
  method: 'standard' | 'express';
  cost: number;
}

interface PaymentInfo {
  method: 'card' | 'paypal';
  amount: number;
}

type CartEvent = 
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'CHECKOUT' }
  | { type: 'SET_SHIPPING'; shipping: ShippingInfo }
  | { type: 'SET_PAYMENT'; payment: PaymentInfo }
  | { type: 'CONFIRM_ORDER' }
  | { type: 'CANCEL' }
  | { type: 'RESET' };

const cartMachine = createMachine<CartContext, CartEvent>({
  id: 'cart',
  initial: 'empty',
  context: {
    items: [],
    total: 0,
    shipping: null,
    payment: null,
  },
  states: {
    empty: {
      on: {
        ADD_ITEM: {
          target: 'hasItems',
          actions: assign({
            items: (ctx, event) => [...ctx.items, event.item],
            total: (ctx, event) => ctx.total + (event.item.price * event.item.quantity),
          }),
        },
      },
    },
    hasItems: {
      on: {
        ADD_ITEM: {
          actions: assign({
            items: (ctx, event) => [...ctx.items, event.item],
            total: (ctx, event) => ctx.total + (event.item.price * event.item.quantity),
          }),
        },
        REMOVE_ITEM: [
          {
            target: 'empty',
            actions: assign({
              items: (ctx, event) => ctx.items.filter(item => item.id !== event.id),
              total: (ctx, event) => {
                const item = ctx.items.find(i => i.id === event.id);
                return item ? ctx.total - (item.price * item.quantity) : ctx.total;
              },
            }),
            cond: (ctx, event) => ctx.items.filter(item => item.id !== event.id).length === 0,
          },
          {
            actions: assign({
              items: (ctx, event) => ctx.items.filter(item => item.id !== event.id),
              total: (ctx, event) => {
                const item = ctx.items.find(i => i.id === event.id);
                return item ? ctx.total - (item.price * item.quantity) : ctx.total;
              },
            }),
          },
        ],
        CHECKOUT: 'checkout',
      },
    },
    checkout: {
      initial: 'shipping',
      states: {
        shipping: {
          on: {
            SET_SHIPPING: {
              target: 'payment',
              actions: assign({
                shipping: (ctx, event) => event.shipping,
              }),
            },
          },
        },
        payment: {
          on: {
            SET_PAYMENT: {
              target: 'confirmation',
              actions: assign({
                payment: (ctx, event) => event.payment,
              }),
            },
          },
        },
        confirmation: {
          on: {
            CONFIRM_ORDER: 'processing',
          },
        },
        processing: {
          invoke: {
            id: 'processOrder',
            src: 'processOrder',
            onDone: '#cart.completed',
            onError: 'payment',
          },
        },
      },
      on: {
        CANCEL: 'hasItems',
      },
    },
    completed: {
      on: {
        RESET: {
          target: 'empty',
          actions: assign({
            items: [],
            total: 0,
            shipping: null,
            payment: null,
          }),
        },
      },
    },
  },
}, {
  services: {
    processOrder: async (context) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { orderId: `order_${Date.now()}` };
    },
  },
});

// Traffic light machine (classic example)
const trafficLightMachine = createMachine({
  id: 'trafficLight',
  initial: 'green',
  states: {
    green: {
      after: {
        3000: 'yellow',
      },
    },
    yellow: {
      after: {
        1000: 'red',
      },
    },
    red: {
      after: {
        3000: 'green',
      },
    },
  },
});

// Components
function AuthComponent() {
  const [state, send] = useMachine(authMachine);
  const [credentials, setCredentials] = React.useState({ email: '', password: '' });
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    send('LOGIN', { credentials });
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Authentication State Machine</h3>
      
      {state.matches('loggedOut') && (
        <div>
          <form onSubmit={handleLogin}>
            <div>
              <input
                type="email"
                placeholder="Email (try: test@example.com)"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password (try: password)"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <button type="submit" disabled={state.context.attempts >= state.context.maxAttempts}>
              Login
            </button>
          </form>
          
          {state.context.error && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              Error: {state.context.error}
              <br />
              Attempts: {state.context.attempts}/{state.context.maxAttempts}
            </div>
          )}
          
          {state.context.attempts >= state.context.maxAttempts && (
            <div>
              <p>Too many failed attempts. Please reset.</p>
              <button onClick={() => send('RESET')}>Reset</button>
            </div>
          )}
        </div>
      )}
      
      {state.matches('authenticating') && (
        <div>Authenticating...</div>
      )}
      
      {state.matches('loggedIn') && (
        <div>
          <p>Welcome, {state.context.user?.name}!</p>
          <button onClick={() => send('LOGOUT')}>Logout</button>
        </div>
      )}
    </div>
  );
}

function ShoppingCartXState() {
  const [state, send] = useMachine(cartMachine);
  
  const sampleItems = [
    { id: '1', name: 'Laptop', price: 999, quantity: 1 },
    { id: '2', name: 'Mouse', price: 29, quantity: 1 },
    { id: '3', name: 'Keyboard', price: 79, quantity: 1 },
  ];
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Shopping Cart State Machine</h3>
      <p>Current state: {JSON.stringify(state.value)}</p>
      
      {(state.matches('empty') || state.matches('hasItems')) && (
        <div>
          <h4>Products</h4>
          {sampleItems.map(item => (
            <div key={item.id} style={{ marginBottom: '10px' }}>
              <span>{item.name} - ${item.price}</span>
              <button 
                onClick={() => send('ADD_ITEM', { item })}
                style={{ marginLeft: '10px' }}
              >
                Add to Cart
              </button>
            </div>
          ))}
          
          {state.context.items.length > 0 && (
            <div>
              <h4>Cart Items</h4>
              {state.context.items.map(item => (
                <div key={item.id} style={{ marginBottom: '5px' }}>
                  <span>{item.name} - ${item.price}</span>
                  <button 
                    onClick={() => send('REMOVE_ITEM', { id: item.id })}
                    style={{ marginLeft: '10px' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <p>Total: ${state.context.total}</p>
              <button onClick={() => send('CHECKOUT')}>Checkout</button>
            </div>
          )}
        </div>
      )}
      
      {state.matches('checkout.shipping') && (
        <div>
          <h4>Shipping Information</h4>
          <button onClick={() => send('SET_SHIPPING', { 
            shipping: { address: '123 Main St', method: 'standard', cost: 5 }
          })}>
            Set Standard Shipping ($5)
          </button>
          <button onClick={() => send('SET_SHIPPING', { 
            shipping: { address: '123 Main St', method: 'express', cost: 15 }
          })}>
            Set Express Shipping ($15)
          </button>
        </div>
      )}
      
      {state.matches('checkout.payment') && (
        <div>
          <h4>Payment Method</h4>
          <button onClick={() => send('SET_PAYMENT', { 
            payment: { method: 'card', amount: state.context.total + (state.context.shipping?.cost || 0) }
          })}>
            Pay with Card
          </button>
          <button onClick={() => send('SET_PAYMENT', { 
            payment: { method: 'paypal', amount: state.context.total + (state.context.shipping?.cost || 0) }
          })}>
            Pay with PayPal
          </button>
        </div>
      )}
      
      {state.matches('checkout.confirmation') && (
        <div>
          <h4>Order Confirmation</h4>
          <p>Items: {state.context.items.length}</p>
          <p>Subtotal: ${state.context.total}</p>
          <p>Shipping: ${state.context.shipping?.cost}</p>
          <p>Total: ${state.context.total + (state.context.shipping?.cost || 0)}</p>
          <button onClick={() => send('CONFIRM_ORDER')}>Confirm Order</button>
          <button onClick={() => send('CANCEL')}>Cancel</button>
        </div>
      )}
      
      {state.matches('checkout.processing') && (
        <div>Processing your order...</div>
      )}
      
      {state.matches('completed') && (
        <div>
          <h4>Order Complete!</h4>
          <p>Thank you for your purchase.</p>
          <button onClick={() => send('RESET')}>Start New Order</button>
        </div>
      )}
    </div>
  );
}

function TrafficLight() {
  const [state, send] = useMachine(trafficLightMachine);
  
  const getColor = () => {
    switch (state.value) {
      case 'green': return '#4CAF50';
      case 'yellow': return '#FFC107';
      case 'red': return '#F44336';
      default: return '#9E9E9E';
    }
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Traffic Light State Machine</h3>
      <div 
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          backgroundColor: getColor(),
          margin: '20px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          textTransform: 'capitalize',
        }}
      >
        {state.value as string}
      </div>
      <p style={{ textAlign: 'center' }}>
        Current state: {state.value as string}
      </p>
    </div>
  );
}

function StateVisualizer() {
  const [authState] = useMachine(authMachine);
  const [cartState] = useMachine(cartMachine);
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>State Visualizer</h3>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
          <h4>Auth State</h4>
          <pre style={{ fontSize: '12px' }}>
            {JSON.stringify({
              state: authState.value,
              context: authState.context,
            }, null, 2)}
          </pre>
        </div>
        <div>
          <h4>Cart State</h4>
          <pre style={{ fontSize: '12px' }}>
            {JSON.stringify({
              state: cartState.value,
              context: {
                itemCount: cartState.context.items.length,
                total: cartState.context.total,
                hasShipping: !!cartState.context.shipping,
                hasPayment: !!cartState.context.payment,
              },
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Main demo component
export default function AdvancedStateMachinesDemo() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Advanced State Machines with XState</h1>
      <p>Demonstration of complex state machines using XState with TypeScript.</p>
      
      <AuthComponent />
      <ShoppingCartXState />
      <TrafficLight />
      <StateVisualizer />
    </div>
  );
}

// Export components and machines for testing
export {
  AuthComponent,
  ShoppingCartXState,
  TrafficLight,
  StateVisualizer,
  authMachine,
  cartMachine,
  trafficLightMachine,
  type AuthContext,
  type AuthEvent,
  type CartContext,
  type CartEvent,
};