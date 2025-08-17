import { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: Circle type definition
  results.push({
    name: 'Circle Type Definition',
    passed: compiledCode.includes('kind:') &&
            compiledCode.includes('radius:') &&
            compiledCode.includes("'circle'") &&
            !compiledCode.includes('// TODO: Add properties for circle'),
    error: (!compiledCode.includes('kind:') || !compiledCode.includes('radius:')) ?
      'Circle type definition is incomplete' :
      (compiledCode.includes('// TODO: Add properties for circle')) ?
      'Circle contains TODO comments - complete the type definition' :
      'Circle should have kind and radius properties with circle discriminator',
    executionTime: 1
  });

  // Test 2: Rectangle type definition
  results.push({
    name: 'Rectangle Type Definition',
    passed: compiledCode.includes('width:') &&
            compiledCode.includes('height:') &&
            compiledCode.includes("'rectangle'") &&
            !compiledCode.includes('// TODO: Add properties for rectangle'),
    error: (!compiledCode.includes('width:') || !compiledCode.includes('height:')) ?
      'Rectangle type definition is incomplete' :
      (compiledCode.includes('// TODO: Add properties for rectangle')) ?
      'Rectangle contains TODO comments - complete the type definition' :
      'Rectangle should have width, height properties with rectangle discriminator',
    executionTime: 1
  });

  // Test 3: Triangle type definition
  results.push({
    name: 'Triangle Type Definition',
    passed: compiledCode.includes('base:') &&
            compiledCode.includes("'triangle'") &&
            !compiledCode.includes('// TODO: Add properties for triangle'),
    error: (!compiledCode.includes('base:')) ?
      'Triangle type definition is incomplete' :
      (compiledCode.includes('// TODO: Add properties for triangle')) ?
      'Triangle contains TODO comments - complete the type definition' :
      'Triangle should have base and height properties with triangle discriminator',
    executionTime: 1
  });

  // Test 4: Square type definition
  results.push({
    name: 'Square Type Definition',
    passed: compiledCode.includes('sideLength:') &&
            compiledCode.includes("'square'") &&
            !compiledCode.includes('// TODO: Add properties for square'),
    error: (!compiledCode.includes('sideLength:')) ?
      'Square type definition is incomplete' :
      (compiledCode.includes('// TODO: Add properties for square')) ?
      'Square contains TODO comments - complete the type definition' :
      'Square should have sideLength property with square discriminator',
    executionTime: 1
  });

  // Test 5: Shape discriminated union
  results.push({
    name: 'Shape Discriminated Union',
    passed: !compiledCode.includes('type Shape = never') &&
            !compiledCode.includes('// TODO: Create the discriminated union') &&
            (compiledCode.includes('Circle | Rectangle | Triangle | Square') ||
             compiledCode.includes('Circle|Rectangle|Triangle|Square')),
    error: (compiledCode.includes('type Shape = never')) ?
      'Shape is still set to never - create the discriminated union' :
      (compiledCode.includes('// TODO: Create the discriminated union')) ?
      'Shape contains TODO comments - implement the union type' :
      'Shape should be a union of Circle, Rectangle, Triangle, and Square',
    executionTime: 1
  });

  // Test 6: calculateArea function implementation
  results.push({
    name: 'calculateArea Function Implementation',
    passed: !compiledCode.includes('throw new Error(\'Not implemented\')') &&
            !compiledCode.includes('// TODO: Implement area calculation function') &&
            compiledCode.includes('switch') &&
            (compiledCode.includes('Math.PI') || compiledCode.includes('radius * radius')),
    error: (compiledCode.includes('throw new Error(\'Not implemented\')')) ?
      'calculateArea function is not implemented - remove the error throw' :
      (compiledCode.includes('// TODO: Implement area calculation function')) ?
      'calculateArea contains TODO comments - implement the function' :
      'calculateArea should use switch statement and handle circle area with π',
    executionTime: 1
  });

  // Test 7: calculatePerimeter function implementation
  results.push({
    name: 'calculatePerimeter Function Implementation',
    passed: !compiledCode.includes('// TODO: Implement perimeter calculation function') &&
            compiledCode.includes('calculatePerimeter') &&
            (compiledCode.includes('2 * Math.PI') || compiledCode.includes('circumference')),
    error: (compiledCode.includes('// TODO: Implement perimeter calculation function')) ?
      'calculatePerimeter contains TODO comments - implement the function' :
      'calculatePerimeter should handle circumference calculation for circles',
    executionTime: 1
  });

  // Test 8: getShapeDescription function implementation
  results.push({
    name: 'getShapeDescription Function Implementation',
    passed: !compiledCode.includes('// TODO: Implement shape description function') &&
            compiledCode.includes('getShapeDescription') &&
            (compiledCode.includes('radius') || compiledCode.includes('dimensions')),
    error: (compiledCode.includes('// TODO: Implement shape description function')) ?
      'getShapeDescription contains TODO comments - implement the function' :
      'getShapeDescription should return descriptive strings for shapes',
    executionTime: 1
  });

  // Test 9: Shape creation helper functions
  results.push({
    name: 'Shape Creation Helper Functions',
    passed: !compiledCode.includes('// TODO: Implement shape creation helpers') &&
            compiledCode.includes('createCircle') &&
            compiledCode.includes('createRectangle') &&
            compiledCode.includes('createTriangle') &&
            compiledCode.includes('createSquare'),
    error: (compiledCode.includes('// TODO: Implement shape creation helpers')) ?
      'Shape creation helpers contain TODO comments - implement all creation functions' :
      'All shape creation functions (createCircle, createRectangle, etc.) should be implemented',
    executionTime: 1
  });

  // Test 10: compareAreas function implementation
  results.push({
    name: 'compareAreas Function Implementation',
    passed: !compiledCode.includes('// TODO: Implement area comparison function') &&
            compiledCode.includes('compareAreas') &&
            (compiledCode.includes('larger') || compiledCode.includes('smaller') || compiledCode.includes('equal')),
    error: (compiledCode.includes('// TODO: Implement area comparison function')) ?
      'compareAreas contains TODO comments - implement the comparison logic' :
      'compareAreas should return descriptive comparison strings',
    executionTime: 1
  });

  // Test 11: findLargestShape function implementation
  results.push({
    name: 'findLargestShape Function Implementation',
    passed: !compiledCode.includes('// TODO: Implement function to find largest shape') &&
            compiledCode.includes('findLargestShape') &&
            (compiledCode.includes('empty') || compiledCode.includes('reduce') || compiledCode.includes('Math.max')),
    error: (compiledCode.includes('// TODO: Implement function to find largest shape')) ?
      'findLargestShape contains TODO comments - implement the search logic' :
      'findLargestShape should handle empty arrays and find maximum area',
    executionTime: 1
  });

  // Test 12: calculateTotalArea function implementation
  results.push({
    name: 'calculateTotalArea Function Implementation',
    passed: !compiledCode.includes('// TODO: Implement function to calculate total area') &&
            compiledCode.includes('calculateTotalArea') &&
            (compiledCode.includes('reduce') || compiledCode.includes('sum')),
    error: (compiledCode.includes('// TODO: Implement function to calculate total area')) ?
      'calculateTotalArea contains TODO comments - implement the summation logic' :
      'calculateTotalArea should sum all shapes areas using reduce or similar',
    executionTime: 1
  });

  // Test 13: groupShapesByKind function implementation
  results.push({
    name: 'groupShapesByKind Function Implementation',
    passed: !compiledCode.includes('// TODO: Implement function to group shapes by type') &&
            compiledCode.includes('groupShapesByKind') &&
            (compiledCode.includes('Record') || compiledCode.includes('reduce') || compiledCode.includes('kind')),
    error: (compiledCode.includes('// TODO: Implement function to group shapes by type')) ?
      'groupShapesByKind contains TODO comments - implement the grouping logic' :
      'groupShapesByKind should group shapes by their kind property into Record structure',
    executionTime: 1
  });

  // Test 14: Switch statement pattern usage
  results.push({
    name: 'Switch Statement Pattern Usage',
    passed: compiledCode.includes('switch') &&
            compiledCode.includes('case') &&
            (compiledCode.includes('circle') || compiledCode.includes('rectangle') || compiledCode.includes('triangle') || compiledCode.includes('square')),
    error: (!compiledCode.includes('switch') || !compiledCode.includes('case')) ?
      'Switch statement pattern is missing - use switch statements for discriminated union handling' :
      'Switch statements should handle circle, rectangle, triangle, and square cases',
    executionTime: 1
  });

  return results;
}