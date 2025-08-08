// Tests for Geometric Shapes Exercise
import { describe, it, expect } from 'vitest';
import {
  Shape,
  Circle,
  Rectangle,
  Triangle,
  Square,
  calculateArea,
  calculatePerimeter,
  getShapeDescription,
  createCircle,
  createRectangle,
  createTriangle,
  createSquare,
  compareAreas,
  findLargestShape,
  calculateTotalArea,
  groupShapesByKind,
} from '../../../exercise-files/discriminated-unions/02-shapes/exercise';

describe('Geometric Shapes', () => {
  describe('Shape Creation', () => {
    it('should create circle correctly', () => {
      const circle = createCircle(5, 'red');
      expect(circle.kind).toBe('circle');
      expect(circle.radius).toBe(5);
      expect(circle.color).toBe('red');
    });

    it('should create rectangle correctly', () => {
      const rectangle = createRectangle(4, 6, 'blue');
      expect(rectangle.kind).toBe('rectangle');
      expect(rectangle.width).toBe(4);
      expect(rectangle.height).toBe(6);
      expect(rectangle.color).toBe('blue');
    });

    it('should create triangle correctly', () => {
      const triangle = createTriangle(3, 4, 'green');
      expect(triangle.kind).toBe('triangle');
      expect(triangle.base).toBe(3);
      expect(triangle.height).toBe(4);
      expect(triangle.color).toBe('green');
    });

    it('should create square correctly', () => {
      const square = createSquare(5, 'yellow');
      expect(square.kind).toBe('square');
      expect(square.sideLength).toBe(5);
      expect(square.color).toBe('yellow');
    });

    it('should create shapes without color', () => {
      const circle = createCircle(3);
      expect(circle.color).toBeUndefined();
    });
  });

  describe('Area Calculation', () => {
    it('should calculate circle area correctly', () => {
      const circle = createCircle(5);
      const area = calculateArea(circle);
      expect(area).toBeCloseTo(Math.PI * 25, 2);
    });

    it('should calculate rectangle area correctly', () => {
      const rectangle = createRectangle(4, 6);
      const area = calculateArea(rectangle);
      expect(area).toBe(24);
    });

    it('should calculate triangle area correctly', () => {
      const triangle = createTriangle(6, 8);
      const area = calculateArea(triangle);
      expect(area).toBe(24);
    });

    it('should calculate square area correctly', () => {
      const square = createSquare(5);
      const area = calculateArea(square);
      expect(area).toBe(25);
    });
  });

  describe('Perimeter Calculation', () => {
    it('should calculate circle circumference correctly', () => {
      const circle = createCircle(5);
      const perimeter = calculatePerimeter(circle);
      expect(perimeter).toBeCloseTo(2 * Math.PI * 5, 2);
    });

    it('should calculate rectangle perimeter correctly', () => {
      const rectangle = createRectangle(4, 6);
      const perimeter = calculatePerimeter(rectangle);
      expect(perimeter).toBe(20);
    });

    it('should calculate triangle perimeter correctly', () => {
      const triangle = createTriangle(4, 6);
      const perimeter = calculatePerimeter(triangle);
      expect(perimeter).toBe(12); // base * 3 for equilateral approximation
    });

    it('should calculate square perimeter correctly', () => {
      const square = createSquare(5);
      const perimeter = calculatePerimeter(square);
      expect(perimeter).toBe(20);
    });
  });

  describe('Shape Description', () => {
    it('should describe circle with color', () => {
      const circle = createCircle(5, 'red');
      const description = getShapeDescription(circle);
      expect(description).toBe('red circle with radius 5');
    });

    it('should describe rectangle without color', () => {
      const rectangle = createRectangle(4, 6);
      const description = getShapeDescription(rectangle);
      expect(description).toBe('rectangle with dimensions 4×6');
    });

    it('should describe triangle with color', () => {
      const triangle = createTriangle(3, 4, 'green');
      const description = getShapeDescription(triangle);
      expect(description).toBe('green triangle with base 3 and height 4');
    });

    it('should describe square without color', () => {
      const square = createSquare(5);
      const description = getShapeDescription(square);
      expect(description).toBe('square with side length 5');
    });
  });

  describe('Area Comparison', () => {
    it('should identify larger shape', () => {
      const circle = createCircle(3); // Area ≈ 28.27
      const square = createSquare(5); // Area = 25
      const comparison = compareAreas(circle, square);
      expect(comparison).toContain('circle');
      expect(comparison).toContain('larger');
    });

    it('should identify smaller shape', () => {
      const triangle = createTriangle(3, 4); // Area = 6
      const rectangle = createRectangle(4, 6); // Area = 24
      const comparison = compareAreas(triangle, rectangle);
      expect(comparison).toContain('triangle');
      expect(comparison).toContain('smaller');
    });

    it('should identify equal areas', () => {
      const square1 = createSquare(5); // Area = 25
      const square2 = createSquare(5); // Area = 25
      const comparison = compareAreas(square1, square2);
      expect(comparison).toContain('equal areas');
    });
  });

  describe('Find Largest Shape', () => {
    it('should find largest shape in array', () => {
      const shapes: Shape[] = [
        createCircle(2), // Area ≈ 12.57
        createSquare(3), // Area = 9
        createRectangle(5, 6), // Area = 30 (largest)
        createTriangle(4, 5), // Area = 10
      ];
      
      const largest = findLargestShape(shapes);
      expect(largest.kind).toBe('rectangle');
    });

    it('should throw error for empty array', () => {
      expect(() => findLargestShape([])).toThrow('Cannot find largest shape in empty array');
    });

    it('should handle single shape', () => {
      const shapes = [createCircle(5)];
      const largest = findLargestShape(shapes);
      expect(largest.kind).toBe('circle');
    });
  });

  describe('Total Area Calculation', () => {
    it('should calculate total area of multiple shapes', () => {
      const shapes: Shape[] = [
        createSquare(2), // Area = 4
        createRectangle(3, 4), // Area = 12
        createTriangle(4, 6), // Area = 12
      ];
      
      const total = calculateTotalArea(shapes);
      expect(total).toBe(28);
    });

    it('should return 0 for empty array', () => {
      const total = calculateTotalArea([]);
      expect(total).toBe(0);
    });
  });

  describe('Group Shapes by Kind', () => {
    it('should group shapes by their kind', () => {
      const shapes: Shape[] = [
        createCircle(1),
        createSquare(2),
        createCircle(3),
        createRectangle(4, 5),
        createTriangle(2, 3),
        createSquare(4),
      ];
      
      const groups = groupShapesByKind(shapes);
      
      expect(groups.circle).toHaveLength(2);
      expect(groups.square).toHaveLength(2);
      expect(groups.rectangle).toHaveLength(1);
      expect(groups.triangle).toHaveLength(1);
      
      expect(groups.circle.every(s => s.kind === 'circle')).toBe(true);
      expect(groups.square.every(s => s.kind === 'square')).toBe(true);
      expect(groups.rectangle.every(s => s.kind === 'rectangle')).toBe(true);
      expect(groups.triangle.every(s => s.kind === 'triangle')).toBe(true);
    });

    it('should handle empty array', () => {
      const groups = groupShapesByKind([]);
      expect(groups.circle).toHaveLength(0);
      expect(groups.square).toHaveLength(0);
      expect(groups.rectangle).toHaveLength(0);
      expect(groups.triangle).toHaveLength(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex scenario with multiple operations', () => {
      // Create a variety of shapes
      const shapes: Shape[] = [
        createCircle(3, 'red'),
        createRectangle(4, 5, 'blue'),
        createSquare(4, 'green'),
        createTriangle(6, 8, 'yellow'),
      ];

      // Test various operations
      const totalArea = calculateTotalArea(shapes);
      const largestShape = findLargestShape(shapes);
      const groups = groupShapesByKind(shapes);

      expect(totalArea).toBeGreaterThan(0);
      expect(largestShape).toBeDefined();
      expect(Object.keys(groups)).toContain('circle');
      expect(Object.keys(groups)).toContain('rectangle');
      expect(Object.keys(groups)).toContain('square');
      expect(Object.keys(groups)).toContain('triangle');

      // Verify each shape can be processed
      shapes.forEach(shape => {
        expect(calculateArea(shape)).toBeGreaterThan(0);
        expect(calculatePerimeter(shape)).toBeGreaterThan(0);
        expect(getShapeDescription(shape)).toContain(shape.kind);
      });
    });
  });
});