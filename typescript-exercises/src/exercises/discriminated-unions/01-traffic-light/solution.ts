// Traffic Light States Exercise - Solution
// Model traffic light states using discriminated unions

// Define individual state types with discriminator property
type RedLightState = {
  color: 'red';
  duration: number;
  stopRequired: boolean;
};

type YellowLightState = {
  color: 'yellow';
  duration: number;
  warningActive: boolean;
};

type GreenLightState = {
  color: 'green';
  duration: number;
  proceedAllowed: boolean;
};

// Create the discriminated union
type TrafficLightState = RedLightState | YellowLightState | GreenLightState;

// Function to get state duration
function getStateDuration(state: TrafficLightState): number {
  return state.duration;
}

// Function to get next state in the cycle: Red -> Green -> Yellow -> Red
function getNextState(currentState: TrafficLightState): TrafficLightState {
  switch (currentState.color) {
    case 'red':
      return {
        color: 'green',
        duration: 25,
        proceedAllowed: true,
      };
    case 'green':
      return {
        color: 'yellow',
        duration: 5,
        warningActive: true,
      };
    case 'yellow':
      return {
        color: 'red',
        duration: 30,
        stopRequired: true,
      };
    default:
      // Exhaustive check - this should never be reached
      const _exhaustive: never = currentState;
      throw new Error(`Unhandled state: ${_exhaustive}`);
  }
}

// Function to check if cars can proceed
function canCarsProceed(state: TrafficLightState): boolean {
  switch (state.color) {
    case 'green':
      return state.proceedAllowed;
    case 'red':
    case 'yellow':
      return false;
    default:
      const _exhaustive: never = state;
      throw new Error(`Unhandled state: ${_exhaustive}`);
  }
}

// Function to create initial traffic light state
function createTrafficLight(): TrafficLightState {
  return {
    color: 'red',
    duration: 30,
    stopRequired: true,
  };
}

// Function that processes a state transition with descriptive message
function processStateTransition(currentState: TrafficLightState): {
  nextState: TrafficLightState;
  message: string;
} {
  const nextState = getNextState(currentState);
  
  let message: string;
  switch (nextState.color) {
    case 'red':
      message = '🔴 STOP! Traffic light is now red. All vehicles must come to a complete stop.';
      break;
    case 'yellow':
      message = '🟡 CAUTION! Traffic light is now yellow. Prepare to stop.';
      break;
    case 'green':
      message = '🟢 GO! Traffic light is now green. Vehicles may proceed.';
      break;
    default:
      const _exhaustive: never = nextState;
      throw new Error(`Unhandled state: ${_exhaustive}`);
  }
  
  return { nextState, message };
}

// Export all functions and types for testing
export {
  TrafficLightState,
  RedLightState,
  YellowLightState,
  GreenLightState,
  getStateDuration,
  getNextState,
  canCarsProceed,
  createTrafficLight,
  processStateTransition,
};