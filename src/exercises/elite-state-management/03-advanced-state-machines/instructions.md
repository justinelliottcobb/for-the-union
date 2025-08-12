# Advanced State Machines with XState

Build complex state machines using XState with discriminated unions for bulletproof state management that models real-world business logic.

## Learning Objectives

- Model complex business logic as state machines
- Integrate XState with React and TypeScript
- Design hierarchical and parallel state machines
- Implement guards, actions, and activities
- Handle machine-to-machine communication
- Test state machines comprehensively

## Prerequisites

- Mastery of useReducer patterns and Redux
- Understanding of state machine concepts
- Knowledge of async/await and Promise patterns
- TypeScript advanced types and discriminated unions

## Background

State machines represent the pinnacle of predictable state management. When combined with XState and TypeScript, they provide:

- **Impossibility of Invalid States**: Only valid states and transitions are possible
- **Visual Documentation**: State machines serve as living documentation
- **Comprehensive Testing**: Every state and transition can be tested
- **Complex Logic Modeling**: Business rules become explicit and maintainable

### The XState + TypeScript Pattern

```typescript
import { createMachine, interpret, assign } from 'xstate';

// Context and Events with TypeScript
interface AuthContext {
  user: User | null;
  error: string | null;
  attempts: number;
  maxAttempts: number;
}

type AuthEvent = 
  | { type: 'LOGIN'; credentials: LoginCredentials }
  | { type: 'LOGOUT' }
  | { type: 'SUCCESS'; user: User }
  | { type: 'FAILURE'; error: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

// State machine definition
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
          cond: 'hasAttemptsRemaining',
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
});
```

## Instructions

You'll build increasingly sophisticated state machines:

1. **Authentication Flow**: Login/logout with retry logic and lockouts
2. **Shopping Cart**: Complex e-commerce flow with multiple payment options
3. **Form Wizard**: Multi-step form with validation and navigation
4. **File Upload**: Drag-and-drop with progress, retry, and error handling
5. **Chat Application**: Real-time messaging with connection management
6. **Game State**: Turn-based game with complex rule validation

## Essential Patterns

### Basic State Machine Structure

```typescript
import { createMachine, assign, spawn } from 'xstate';

const toggleMachine = createMachine({
  id: 'toggle',
  initial: 'inactive',
  states: {
    inactive: {
      on: {
        TOGGLE: 'active',
      },
    },
    active: {
      on: {
        TOGGLE: 'inactive',
      },
    },
  },
});
```

### State Machine with Context and Guards

```typescript
interface TrafficLightContext {
  pedestrianWaiting: boolean;
  emergencyVehicle: boolean;
  timeInState: number;
}

type TrafficLightEvent = 
  | { type: 'TIMER' }
  | { type: 'PEDESTRIAN_BUTTON' }
  | { type: 'EMERGENCY_VEHICLE' }
  | { type: 'EMERGENCY_CLEAR' };

const trafficLightMachine = createMachine<TrafficLightContext, TrafficLightEvent>({
  id: 'trafficLight',
  initial: 'green',
  context: {
    pedestrianWaiting: false,
    emergencyVehicle: false,
    timeInState: 0,
  },
  states: {
    green: {
      entry: assign({ timeInState: 0 }),
      after: {
        30000: { target: 'yellow', cond: 'shouldChangeFromGreen' },
      },
      on: {
        TIMER: {
          actions: assign({
            timeInState: (ctx) => ctx.timeInState + 1000,
          }),
        },
        PEDESTRIAN_BUTTON: {
          actions: assign({ pedestrianWaiting: true }),
        },
        EMERGENCY_VEHICLE: {
          target: 'red',
          actions: assign({ emergencyVehicle: true }),
        },
      },
    },
    yellow: {
      after: {
        5000: 'red',
      },
    },
    red: {
      entry: assign({ pedestrianWaiting: false }),
      after: {
        25000: { target: 'green', cond: 'noEmergencyVehicle' },
      },
      on: {
        EMERGENCY_CLEAR: {
          actions: assign({ emergencyVehicle: false }),
        },
      },
    },
  },
}, {
  guards: {
    shouldChangeFromGreen: (ctx) => 
      ctx.pedestrianWaiting || ctx.timeInState >= 30000,
    noEmergencyVehicle: (ctx) => !ctx.emergencyVehicle,
  },
});
```

### Hierarchical States

```typescript
const appMachine = createMachine({
  id: 'app',
  initial: 'loading',
  states: {
    loading: {
      invoke: {
        id: 'loadApp',
        src: 'loadApplication',
        onDone: 'authenticated',
        onError: 'error',
      },
    },
    authenticated: {
      initial: 'dashboard',
      states: {
        dashboard: {
          on: {
            NAVIGATE_TO_PROFILE: 'profile',
            NAVIGATE_TO_SETTINGS: 'settings',
          },
        },
        profile: {
          initial: 'viewing',
          states: {
            viewing: {
              on: {
                EDIT: 'editing',
              },
            },
            editing: {
              on: {
                SAVE: 'saving',
                CANCEL: 'viewing',
              },
            },
            saving: {
              invoke: {
                id: 'saveProfile',
                src: 'saveProfile',
                onDone: 'viewing',
                onError: 'editing',
              },
            },
          },
        },
        settings: {
          on: {
            NAVIGATE_TO_DASHBOARD: '#app.authenticated.dashboard',
          },
        },
      },
      on: {
        LOGOUT: 'loggedOut',
      },
    },
    loggedOut: {
      on: {
        LOGIN: 'loading',
      },
    },
    error: {
      on: {
        RETRY: 'loading',
      },
    },
  },
});
```

### Parallel States

```typescript
const mediaPlayerMachine = createMachine({
  id: 'mediaPlayer',
  type: 'parallel',
  states: {
    playback: {
      initial: 'stopped',
      states: {
        stopped: {
          on: { PLAY: 'playing' },
        },
        playing: {
          on: { 
            PAUSE: 'paused',
            STOP: 'stopped',
          },
        },
        paused: {
          on: { 
            PLAY: 'playing',
            STOP: 'stopped',
          },
        },
      },
    },
    volume: {
      initial: 'unmuted',
      states: {
        unmuted: {
          on: { MUTE: 'muted' },
        },
        muted: {
          on: { UNMUTE: 'unmuted' },
        },
      },
    },
    quality: {
      initial: 'auto',
      states: {
        auto: {
          on: { SET_QUALITY: 'manual' },
        },
        manual: {
          on: { AUTO_QUALITY: 'auto' },
        },
      },
    },
  },
});
```

## Advanced Patterns

### Machine Communication

```typescript
const parentMachine = createMachine({
  id: 'parent',
  initial: 'active',
  states: {
    active: {
      invoke: {
        id: 'childMachine',
        src: childMachine,
        onDone: 'success',
        onError: 'failure',
      },
      on: {
        SEND_TO_CHILD: {
          actions: send('CHILD_EVENT', { to: 'childMachine' }),
        },
      },
    },
    success: {},
    failure: {},
  },
});

const childMachine = createMachine({
  id: 'child',
  initial: 'waiting',
  states: {
    waiting: {
      on: {
        CHILD_EVENT: {
          actions: sendParent('CHILD_RESPONDED'),
        },
      },
    },
  },
});
```

### Testing State Machines

```typescript
import { interpret } from 'xstate';

describe('Auth Machine', () => {
  it('should transition from loggedOut to authenticating on LOGIN', () => {
    const authService = interpret(authMachine);
    authService.start();
    
    expect(authService.state.value).toBe('loggedOut');
    
    authService.send('LOGIN', { credentials: mockCredentials });
    
    expect(authService.state.value).toBe('authenticating');
    expect(authService.state.context.attempts).toBe(1);
    
    authService.stop();
  });
  
  it('should handle login failure with retry', () => {
    const authService = interpret(authMachine.withConfig({
      services: {
        loginUser: () => Promise.reject(new Error('Invalid credentials')),
      },
    }));
    
    authService.start();
    authService.send('LOGIN', { credentials: mockCredentials });
    
    // Wait for async operation
    return new Promise((resolve) => {
      authService.onTransition((state) => {
        if (state.value === 'loggedOut' && state.context.attempts === 1) {
          expect(state.context.error).toBe('Invalid credentials');
          resolve();
        }
      });
    });
  });
});
```

### React Integration

```typescript
import { useMachine } from '@xstate/react';

function AuthComponent() {
  const [state, send] = useMachine(authMachine, {
    services: {
      loginUser: async (context, event) => {
        const response = await api.login(event.credentials);
        return response.user;
      },
    },
  });
  
  const { user, error, attempts, maxAttempts } = state.context;
  
  return (
    <div>
      {state.matches('loggedOut') && (
        <LoginForm 
          onSubmit={(credentials) => send('LOGIN', { credentials })}
          error={error}
          attemptsRemaining={maxAttempts - attempts}
        />
      )}
      
      {state.matches('authenticating') && (
        <div>Authenticating...</div>
      )}
      
      {state.matches('loggedIn') && (
        <Dashboard 
          user={user}
          onLogout={() => send('LOGOUT')}
        />
      )}
    </div>
  );
}
```

## Hints

1. Start with simple machines and build complexity gradually
2. Use the XState visualizer to understand machine behavior
3. Leverage TypeScript for better machine typing
4. Consider using services for async operations
5. Use hierarchical states for complex UI flows
6. Test all possible state transitions thoroughly

## Expected Behavior

When complete, you'll have mastered:

```typescript
// Type-safe state machines
const [state, send] = useMachine(authMachine);

// Impossible invalid states
if (state.matches('loggedIn')) {
  // TypeScript knows user is not null here
  console.log(state.context.user.name);
}

// Exhaustive state checking
switch (state.value) {
  case 'loggedOut':
    // Handle logged out state
    break;
  case 'authenticating':
    // Handle authenticating state
    break;
  case 'loggedIn':
    // Handle logged in state
    break;
  default:
    // TypeScript error - all cases covered
    const _exhaustive: never = state.value;
}

// Machine communication
send('LOGIN', { credentials }); // ✅ Type-safe
send('INVALID_EVENT'); // ❌ TypeScript error
```

**Estimated time:** 55 minutes  
**Difficulty:** 5/5