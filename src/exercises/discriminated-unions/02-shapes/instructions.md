# Geometric Shapes

Apply discriminated unions to a more complex real-world scenario by implementing area calculations for different geometric shapes.

## Learning Objectives

- Apply discriminated unions to real-world modeling
- Implement functions that work with union types
- Handle complex object shapes with type safety
- Practice exhaustive checking to ensure all cases are handled

## Background

You need to create a geometry calculation system that can handle different shapes. Each shape has different properties and area calculation formulas:

- **Circle**: Has a `radius`, area = π × radius²
- **Rectangle**: Has `width` and `height`, area = width × height  
- **Triangle**: Has a `base` and `height`, area = (base × height) / 2
- **Square**: Has a `sideLength`, area = sideLength²

## Instructions

1. **Define Shape Types**: Create individual types for each shape
   - Each shape should have a `kind` property as the discriminator
   - Include all necessary measurements for area calculation
   - Add optional properties like `color` or `name` for additional context

2. **Create the Union Type**: Combine all shapes into a single `Shape` union

3. **Implement Calculation Functions**:
   - `calculateArea(shape: Shape): number` - calculates the area based on shape type
   - `calculatePerimeter(shape: Shape): number` - calculates the perimeter/circumference
   - `getShapeDescription(shape: Shape): string` - returns a descriptive string

4. **Implement Helper Functions**:
   - `createCircle(radius: number, color?: string): Circle`
   - `createRectangle(width: number, height: number, color?: string): Rectangle`
   - `createTriangle(base: number, height: number, color?: string): Triangle`
   - `createSquare(sideLength: number, color?: string): Square`

5. **Advanced Challenge**: 
   - `compareAreas(shape1: Shape, shape2: Shape): string` - compares two shapes' areas
   - `findLargestShape(shapes: Shape[]): Shape` - finds the shape with the largest area

## Key Concepts

### Complex Discriminated Unions
Real-world discriminated unions often have multiple properties and complex logic:

```typescript
type APIResponse = 
  | { status: 'success'; data: User[]; total: number }
  | { status: 'error'; message: string; code: number }
  | { status: 'loading'; progress?: number };
```

### Exhaustive Checking
Use TypeScript's `never` type to ensure all cases are handled:

```typescript
function handleShape(shape: Shape): number {
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.radius ** 2;
    case 'rectangle': return shape.width * shape.height;
    case 'triangle': return (shape.base * shape.height) / 2;
    case 'square': return shape.sideLength ** 2;
    default:
      // This ensures TypeScript checks all cases
      const _exhaustive: never = shape;
      throw new Error(`Unhandled shape: ${_exhaustive}`);
  }
}
```

## Hints

1. Each shape should have a "kind" property that serves as the discriminator
2. Include the necessary measurements for each shape (radius, width, height, etc.)
3. Use exhaustive checking with `never` type to ensure all shapes are handled
4. Remember the mathematical formulas for each shape's area and perimeter
5. Use TypeScript's type narrowing in switch statements for type safety

## Mathematical Formulas

- **Circle**: Area = π × r², Circumference = 2 × π × r
- **Rectangle**: Area = w × h, Perimeter = 2 × (w + h)
- **Triangle**: Area = (b × h) / 2, Perimeter = a + b + c (we'll use base as perimeter approximation)
- **Square**: Area = s², Perimeter = 4 × s

## Expected Behavior

When complete, you should be able to:

```typescript
const circle = createCircle(5, 'red');
const rectangle = createRectangle(4, 6, 'blue');

const circleArea = calculateArea(circle); // ~78.54
const rectArea = calculateArea(rectangle); // 24

const comparison = compareAreas(circle, rectangle); // "Circle is larger"
```

**Estimated time:** 25 minutes  
**Difficulty:** 3/5