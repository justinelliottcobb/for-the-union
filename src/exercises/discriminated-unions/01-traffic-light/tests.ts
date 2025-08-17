import { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: RedLightState type definition
  results.push({
    name: 'RedLightState Type Definition',
    passed: compiledCode.includes('color:') &&
            compiledCode.includes('duration:') &&
            compiledCode.includes('stopRequired:') &&
            !compiledCode.includes('// TODO: Add properties for red light state'),
    error: (!compiledCode.includes('color:') || !compiledCode.includes('duration:') || !compiledCode.includes('stopRequired:')) ?
      'RedLightState type definition is incomplete' :
      (compiledCode.includes('// TODO: Add properties for red light state')) ?
      'RedLightState contains TODO comments - complete the type definition' :
      'RedLightState should have color, duration, and stopRequired properties',
    executionTime: 1
  });

  // Test 2: YellowLightState type definition
  results.push({
    name: 'YellowLightState Type Definition',
    passed: compiledCode.includes('warningActive:') &&
            !compiledCode.includes('// TODO: Add properties for yellow light state') &&
            compiledCode.includes("'yellow'"),
    error: (!compiledCode.includes('warningActive:')) ?
      'YellowLightState type definition is incomplete' :
      (compiledCode.includes('// TODO: Add properties for yellow light state')) ?
      'YellowLightState contains TODO comments - complete the type definition' :
      'YellowLightState should have warningActive property and yellow color',
    executionTime: 1
  });

  // Test 3: GreenLightState type definition
  results.push({
    name: 'GreenLightState Type Definition',
    passed: compiledCode.includes('proceedAllowed:') &&
            !compiledCode.includes('// TODO: Add properties for green light state') &&
            compiledCode.includes("'green'"),
    error: (!compiledCode.includes('proceedAllowed:')) ?
      'GreenLightState type definition is incomplete' :
      (compiledCode.includes('// TODO: Add properties for green light state')) ?
      'GreenLightState contains TODO comments - complete the type definition' :
      'GreenLightState should have proceedAllowed property and green color',
    executionTime: 1
  });

  // Test 4: TrafficLightState discriminated union
  results.push({
    name: 'TrafficLightState Discriminated Union',
    passed: !compiledCode.includes('type TrafficLightState = never') &&
            !compiledCode.includes('// TODO: Create the discriminated union') &&
            (compiledCode.includes('RedLightState | YellowLightState | GreenLightState') ||
             compiledCode.includes('RedLightState|YellowLightState|GreenLightState')),
    error: (compiledCode.includes('type TrafficLightState = never')) ?
      'TrafficLightState is still set to never - create the discriminated union' :
      (compiledCode.includes('// TODO: Create the discriminated union')) ?
      'TrafficLightState contains TODO comments - implement the union type' :
      'TrafficLightState should be a union of RedLightState, YellowLightState, and GreenLightState',
    executionTime: 1
  });

  // Test 5: getStateDuration function implementation
  results.push({
    name: 'getStateDuration Function Implementation',
    passed: !compiledCode.includes('throw new Error(\'Not implemented\')') &&
            !compiledCode.includes('// TODO: Implement function to get state duration') &&
            compiledCode.includes('switch') &&
            compiledCode.includes('return'),
    error: (compiledCode.includes('throw new Error(\'Not implemented\')')) ?
      'getStateDuration function is not implemented - remove the error throw' :
      (compiledCode.includes('// TODO: Implement function to get state duration')) ?
      'getStateDuration contains TODO comments - implement the function' :
      'getStateDuration should use a switch statement and return duration values',
    executionTime: 1
  });

  // Test 6: getNextState function implementation
  results.push({
    name: 'getNextState Function Implementation',
    passed: !compiledCode.includes('// TODO: Implement function to get next state in the cycle') &&
            compiledCode.includes('getNextState') &&
            (compiledCode.includes('red') && compiledCode.includes('green') && compiledCode.includes('yellow')),
    error: (compiledCode.includes('// TODO: Implement function to get next state in the cycle')) ?
      'getNextState contains TODO comments - implement state transitions' :
      'getNextState should handle transitions between red, green, and yellow states',
    executionTime: 1
  });

  // Test 7: canCarsProceed function implementation
  results.push({
    name: 'canCarsProceed Function Implementation',
    passed: !compiledCode.includes('// TODO: Implement function to check if cars can proceed') &&
            compiledCode.includes('canCarsProceed') &&
            (compiledCode.includes('green') || compiledCode.includes('proceedAllowed')),
    error: (compiledCode.includes('// TODO: Implement function to check if cars can proceed')) ?
      'canCarsProceed contains TODO comments - implement the logic' :
      'canCarsProceed should check for green light or proceedAllowed property',
    executionTime: 1
  });

  // Test 8: createTrafficLight function implementation
  results.push({
    name: 'createTrafficLight Function Implementation',
    passed: !compiledCode.includes('// TODO: Implement function to create initial state') &&
            compiledCode.includes('createTrafficLight') &&
            compiledCode.includes('red'),
    error: (compiledCode.includes('// TODO: Implement function to create initial state')) ?
      'createTrafficLight contains TODO comments - implement initial state creation' :
      'createTrafficLight should return an initial red light state',
    executionTime: 1
  });

  // Test 9: processStateTransition function implementation
  results.push({
    name: 'processStateTransition Function Implementation',
    passed: !compiledCode.includes('// TODO: Implement function that processes a state transition') &&
            compiledCode.includes('nextState') &&
            compiledCode.includes('message'),
    error: (compiledCode.includes('// TODO: Implement function that processes a state transition')) ?
      'processStateTransition contains TODO comments - implement the transition logic' :
      'processStateTransition should return an object with nextState and message properties',
    executionTime: 1
  });

  // Test 10: Switch statement pattern usage
  results.push({
    name: 'Switch Statement Pattern Usage',
    passed: compiledCode.includes('switch') &&
            compiledCode.includes('case') &&
            (compiledCode.includes('red') || compiledCode.includes('green') || compiledCode.includes('yellow')),
    error: (!compiledCode.includes('switch') || !compiledCode.includes('case')) ?
      'Switch statement pattern is missing - use switch statements for discriminated union handling' :
      'Switch statements should handle red, green, and yellow cases',
    executionTime: 1
  });

  return results;
}