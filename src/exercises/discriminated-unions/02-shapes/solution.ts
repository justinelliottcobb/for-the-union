// Geometric Shapes Exercise - Solution
// Calculate areas for different shapes using discriminated unions

// Define individual shape types with discriminator property
type Circle = {
  kind: 'circle';
  radius: number;
  color?: string;
};

type Rectangle = {
  kind: 'rectangle';
  width: number;
  height: number;
  color?: string;
};

type Triangle = {
  kind: 'triangle';
  base: number;
  height: number;
  color?: string;
};

type Square = {
  kind: 'square';
  sideLength: number;
  color?: string;
};

// Create the discriminated union
type Shape = Circle | Rectangle | Triangle | Square;

// Area calculation function
function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius * shape.radius;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return (shape.base * shape.height) / 2;
    case 'square':
      return shape.sideLength * shape.sideLength;
    default:
      const _exhaustive: never = shape;
      throw new Error(`Unhandled shape: ${_exhaustive}`);
  }
}

// Perimeter calculation function
function calculatePerimeter(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return 2 * Math.PI * shape.radius;
    case 'rectangle':
      return 2 * (shape.width + shape.height);
    case 'triangle':
      // For simplicity, assuming equilateral triangle
      return shape.base * 3;
    case 'square':
      return 4 * shape.sideLength;
    default:
      const _exhaustive: never = shape;
      throw new Error(`Unhandled shape: ${_exhaustive}`);
  }
}

// Shape description function
function getShapeDescription(shape: Shape): string {
  const colorPrefix = shape.color ? `${shape.color} ` : '';
  
  switch (shape.kind) {
    case 'circle':
      return `${colorPrefix}circle with radius ${shape.radius}`;
    case 'rectangle':
      return `${colorPrefix}rectangle with dimensions ${shape.width}×${shape.height}`;
    case 'triangle':
      return `${colorPrefix}triangle with base ${shape.base} and height ${shape.height}`;
    case 'square':
      return `${colorPrefix}square with side length ${shape.sideLength}`;
    default:
      const _exhaustive: never = shape;
      throw new Error(`Unhandled shape: ${_exhaustive}`);
  }
}

// Shape creation helpers
function createCircle(radius: number, color?: string): Circle {
  return { kind: 'circle', radius, color };
}

function createRectangle(width: number, height: number, color?: string): Rectangle {
  return { kind: 'rectangle', width, height, color };
}

function createTriangle(base: number, height: number, color?: string): Triangle {
  return { kind: 'triangle', base, height, color };
}

function createSquare(sideLength: number, color?: string): Square {
  return { kind: 'square', sideLength, color };
}

// Area comparison function
function compareAreas(shape1: Shape, shape2: Shape): string {
  const area1 = calculateArea(shape1);
  const area2 = calculateArea(shape2);
  
  const shape1Desc = getShapeDescription(shape1);
  const shape2Desc = getShapeDescription(shape2);
  
  if (Math.abs(area1 - area2) < 0.001) { // Handle floating point precision
    return `Both shapes have equal areas (${area1.toFixed(2)})`;
  } else if (area1 > area2) {
    return `${shape1Desc} (${area1.toFixed(2)}) is larger than ${shape2Desc} (${area2.toFixed(2)})`;
  } else {
    return `${shape1Desc} (${area1.toFixed(2)}) is smaller than ${shape2Desc} (${area2.toFixed(2)})`;
  }
}

// Function to find largest shape
function findLargestShape(shapes: Shape[]): Shape {
  if (shapes.length === 0) {
    throw new Error('Cannot find largest shape in empty array');
  }
  
  return shapes.reduce((largest, current) => {
    return calculateArea(current) > calculateArea(largest) ? current : largest;
  });
}

// Function to calculate total area
function calculateTotalArea(shapes: Shape[]): number {
  return shapes.reduce((total, shape) => total + calculateArea(shape), 0);
}

// Function to group shapes by type
function groupShapesByKind(shapes: Shape[]): Record<string, Shape[]> {
  const groups: Record<string, Shape[]> = {
    circle: [],
    rectangle: [],
    triangle: [],
    square: [],
  };
  
  for (const shape of shapes) {
    groups[shape.kind].push(shape);
  }
  
  return groups;
}

// Export all functions and types for testing
export {
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
};