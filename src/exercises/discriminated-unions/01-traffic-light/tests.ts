// Tests for Traffic Light States Exercise
import { describe, it, expect } from 'vitest';
import {
  TrafficLightState,
  RedLightState,
  YellowLightState,
  GreenLightState,
  getStateDuration,
  getNextState,
  canCarsProceed,
  createTrafficLight,
  processStateTransition,
} from '../../../exercise-files/discriminated-unions/01-traffic-light/exercise';

describe('Traffic Light States', () => {
  describe('Type Definitions', () => {
    it('should allow creating red light state', () => {
      const redLight: RedLightState = {
        color: 'red',
        duration: 30,
        stopRequired: true,
      };
      expect(redLight.color).toBe('red');
      expect(redLight.stopRequired).toBe(true);
    });

    it('should allow creating yellow light state', () => {
      const yellowLight: YellowLightState = {
        color: 'yellow',
        duration: 5,
        warningActive: true,
      };
      expect(yellowLight.color).toBe('yellow');
      expect(yellowLight.warningActive).toBe(true);
    });

    it('should allow creating green light state', () => {
      const greenLight: GreenLightState = {
        color: 'green',
        duration: 25,
        proceedAllowed: true,
      };
      expect(greenLight.color).toBe('green');
      expect(greenLight.proceedAllowed).toBe(true);
    });
  });

  describe('getStateDuration', () => {
    it('should return correct duration for red light', () => {
      const redLight: TrafficLightState = {
        color: 'red',
        duration: 30,
        stopRequired: true,
      };
      expect(getStateDuration(redLight)).toBe(30);
    });

    it('should return correct duration for yellow light', () => {
      const yellowLight: TrafficLightState = {
        color: 'yellow',
        duration: 5,
        warningActive: true,
      };
      expect(getStateDuration(yellowLight)).toBe(5);
    });

    it('should return correct duration for green light', () => {
      const greenLight: TrafficLightState = {
        color: 'green',
        duration: 25,
        proceedAllowed: true,
      };
      expect(getStateDuration(greenLight)).toBe(25);
    });
  });

  describe('getNextState', () => {
    it('should transition from red to green', () => {
      const redLight: TrafficLightState = {
        color: 'red',
        duration: 30,
        stopRequired: true,
      };
      const nextState = getNextState(redLight);
      expect(nextState.color).toBe('green');
      expect('proceedAllowed' in nextState && nextState.proceedAllowed).toBe(true);
    });

    it('should transition from green to yellow', () => {
      const greenLight: TrafficLightState = {
        color: 'green',
        duration: 25,
        proceedAllowed: true,
      };
      const nextState = getNextState(greenLight);
      expect(nextState.color).toBe('yellow');
      expect('warningActive' in nextState && nextState.warningActive).toBe(true);
    });

    it('should transition from yellow to red', () => {
      const yellowLight: TrafficLightState = {
        color: 'yellow',
        duration: 5,
        warningActive: true,
      };
      const nextState = getNextState(yellowLight);
      expect(nextState.color).toBe('red');
      expect('stopRequired' in nextState && nextState.stopRequired).toBe(true);
    });
  });

  describe('canCarsProceed', () => {
    it('should return false for red light', () => {
      const redLight: TrafficLightState = {
        color: 'red',
        duration: 30,
        stopRequired: true,
      };
      expect(canCarsProceed(redLight)).toBe(false);
    });

    it('should return false for yellow light', () => {
      const yellowLight: TrafficLightState = {
        color: 'yellow',
        duration: 5,
        warningActive: true,
      };
      expect(canCarsProceed(yellowLight)).toBe(false);
    });

    it('should return true for green light', () => {
      const greenLight: TrafficLightState = {
        color: 'green',
        duration: 25,
        proceedAllowed: true,
      };
      expect(canCarsProceed(greenLight)).toBe(true);
    });
  });

  describe('createTrafficLight', () => {
    it('should create initial red light state', () => {
      const initialState = createTrafficLight();
      expect(initialState.color).toBe('red');
      expect('stopRequired' in initialState && initialState.stopRequired).toBe(true);
    });
  });

  describe('processStateTransition', () => {
    it('should process red to green transition', () => {
      const redLight: TrafficLightState = {
        color: 'red',
        duration: 30,
        stopRequired: true,
      };
      const result = processStateTransition(redLight);
      expect(result.nextState.color).toBe('green');
      expect(result.message).toContain('green');
      expect(result.message).toContain('GO');
    });

    it('should process green to yellow transition', () => {
      const greenLight: TrafficLightState = {
        color: 'green',
        duration: 25,
        proceedAllowed: true,
      };
      const result = processStateTransition(greenLight);
      expect(result.nextState.color).toBe('yellow');
      expect(result.message).toContain('yellow');
      expect(result.message).toContain('CAUTION');
    });

    it('should process yellow to red transition', () => {
      const yellowLight: TrafficLightState = {
        color: 'yellow',
        duration: 5,
        warningActive: true,
      };
      const result = processStateTransition(yellowLight);
      expect(result.nextState.color).toBe('red');
      expect(result.message).toContain('red');
      expect(result.message).toContain('STOP');
    });
  });

  describe('Full Cycle Integration', () => {
    it('should complete a full traffic light cycle', () => {
      let currentState = createTrafficLight(); // Start with red
      expect(currentState.color).toBe('red');

      // Red -> Green
      currentState = getNextState(currentState);
      expect(currentState.color).toBe('green');
      expect(canCarsProceed(currentState)).toBe(true);

      // Green -> Yellow  
      currentState = getNextState(currentState);
      expect(currentState.color).toBe('yellow');
      expect(canCarsProceed(currentState)).toBe(false);

      // Yellow -> Red
      currentState = getNextState(currentState);
      expect(currentState.color).toBe('red');
      expect(canCarsProceed(currentState)).toBe(false);
    });
  });
});