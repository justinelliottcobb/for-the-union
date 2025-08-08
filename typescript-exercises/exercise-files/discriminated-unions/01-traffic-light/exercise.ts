// Traffic Light States Exercise
// Model traffic light states using discriminated unions

// TODO: Define individual state types
// Hint: Each state needs a 'color' property as the discriminator

type RedLightState = {
  // TODO: Add properties for red light state
  // - color: 'red'
  // - duration: number (typical: 30 seconds)
  // - stopRequired: boolean (always true for red)
};

type YellowLightState = {
  // TODO: Add properties for yellow light state
  // - color: 'yellow'  
  // - duration: number (typical: 5 seconds)
  // - warningActive: boolean (always true for yellow)
};

type GreenLightState = {
  // TODO: Add properties for green light state
  // - color: 'green'
  // - duration: number (typical: 25 seconds)
  // - proceedAllowed: boolean (always true for green)
};

// TODO: Create the discriminated union
type TrafficLightState = never; // Replace with proper union

// TODO: Implement function to get state duration
function getStateDuration(state: TrafficLightState): number {
  // Hint: Use a switch statement on the color property
  throw new Error('Not implemented');
}

// TODO: Implement function to get next state in the cycle
// Cycle: Red -> Green -> Yellow -> Red
function getNextState(currentState: TrafficLightState): TrafficLightState {
  throw new Error('Not implemented');
}

// TODO: Implement function to check if cars can proceed
function canCarsProceed(state: TrafficLightState): boolean {
  // Only green light allows cars to proceed
  throw new Error('Not implemented');
}

// TODO: Implement function to create initial state
function createTrafficLight(): TrafficLightState {
  // Start with red light
  throw new Error('Not implemented');
}

// TODO: Implement function that processes a state transition
function processStateTransition(currentState: TrafficLightState): {
  nextState: TrafficLightState;
  message: string;
} {
  throw new Error('Not implemented');
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