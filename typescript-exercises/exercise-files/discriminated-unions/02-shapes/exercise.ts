// Geometric Shapes Exercise
// Calculate areas for different shapes using discriminated unions

// TODO: Define individual shape types
// Each shape needs a 'kind' property as the discriminator

type Circle = {
  // TODO: Add properties for circle
  // - kind: 'circle'
  // - radius: number
  // - color?: string (optional)
};

type Rectangle = {
  // TODO: Add properties for rectangle
  // - kind: 'rectangle'
  // - width: number
  // - height: number
  // - color?: string (optional)
};

type Triangle = {
  // TODO: Add properties for triangle
  // - kind: 'triangle'
  // - base: number
  // - height: number
  // - color?: string (optional)
};

type Square = {
  // TODO: Add properties for square
  // - kind: 'square'
  // - sideLength: number
  // - color?: string (optional)
};

// TODO: Create the discriminated union
type Shape = never; // Replace with proper union

// TODO: Implement area calculation function
function calculateArea(shape: Shape): number {
  // Use switch statement on the 'kind' property
  // Circle: π × radius²
  // Rectangle: width × height
  // Triangle: (base × height) / 2
  // Square: sideLength²
  throw new Error('Not implemented');
}

// TODO: Implement perimeter calculation function
function calculatePerimeter(shape: Shape): number {
  // Circle: 2 × π × radius (circumference)
  // Rectangle: 2 × (width + height)
  // Triangle: For simplicity, use base × 3 (assuming equilateral)
  // Square: 4 × sideLength
  throw new Error('Not implemented');
}

// TODO: Implement shape description function
function getShapeDescription(shape: Shape): string {
  // Return a descriptive string like:
  // "Red circle with radius 5"
  // "Blue rectangle with dimensions 4×6"
  throw new Error('Not implemented');
}

// TODO: Implement shape creation helpers
function createCircle(radius: number, color?: string): Circle {
  throw new Error('Not implemented');
}

function createRectangle(width: number, height: number, color?: string): Rectangle {
  throw new Error('Not implemented');
}

function createTriangle(base: number, height: number, color?: string): Triangle {
  throw new Error('Not implemented');
}

function createSquare(sideLength: number, color?: string): Square {
  throw new Error('Not implemented');
}

// TODO: Implement area comparison function
function compareAreas(shape1: Shape, shape2: Shape): string {
  // Compare the areas and return a descriptive string
  // e.g., "Circle is larger than rectangle"
  //       "Both shapes have equal areas"
  //       "Rectangle is smaller than circle"
  throw new Error('Not implemented');
}

// TODO: Implement function to find largest shape
function findLargestShape(shapes: Shape[]): Shape {
  // Find and return the shape with the largest area
  // Throw an error if the array is empty
  throw new Error('Not implemented');
}

// TODO: Implement function to calculate total area
function calculateTotalArea(shapes: Shape[]): number {
  // Calculate the sum of all shapes' areas
  throw new Error('Not implemented');
}

// TODO: Implement function to group shapes by type
function groupShapesByKind(shapes: Shape[]): Record<string, Shape[]> {
  // Group shapes by their 'kind' property
  // Return an object like { circle: [...], rectangle: [...] }
  throw new Error('Not implemented');
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