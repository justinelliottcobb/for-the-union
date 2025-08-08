import type { ExerciseCategory } from '@/types';

export const discriminatedUnionsCategory: ExerciseCategory = {
  id: 'discriminated-unions',
  name: 'Discriminated Unions',
  description: 'Learn to model complex data with type-safe discriminated unions',
  icon: 'IconBinaryTree2',
  order: 1,
  exercises: [
    {
      id: 'traffic-light',
      title: 'Traffic Light States',
      description: 'Model traffic light states using discriminated unions',
      category: 'discriminated-unions',
      difficulty: 2,
      prerequisites: [],
      learningObjectives: [
        'Understand discriminated union basics',
        'Learn to create type-safe state machines',
        'Practice pattern matching with switch statements',
      ],
      hints: [
        'Start by defining a type for each possible state',
        'Use a common property to discriminate between states',
        'TypeScript will narrow types automatically in switch statements',
      ],
      estimatedTime: 15,
      filePath: './exercise-files/discriminated-unions/01-traffic-light/exercise.ts',
      solutionPath: './src/exercises/discriminated-unions/01-traffic-light/solution.ts',
      testsPath: './src/exercises/discriminated-unions/01-traffic-light/tests.ts',
      instructionsPath: './src/exercises/discriminated-unions/01-traffic-light/instructions.md',
    },
    {
      id: 'shapes',
      title: 'Geometric Shapes',
      description: 'Calculate areas for different shapes using discriminated unions',
      category: 'discriminated-unions',
      difficulty: 3,
      prerequisites: ['traffic-light'],
      learningObjectives: [
        'Apply discriminated unions to real-world modeling',
        'Implement functions that work with union types',
        'Handle complex object shapes with type safety',
      ],
      hints: [
        'Each shape should have a "kind" property',
        'Include the necessary measurements for each shape',
        'Use exhaustive checking to ensure all shapes are handled',
      ],
      estimatedTime: 25,
      filePath: './exercise-files/discriminated-unions/02-shapes/exercise.ts',
      solutionPath: './src/exercises/discriminated-unions/02-shapes/solution.ts',
      testsPath: './src/exercises/discriminated-unions/02-shapes/tests.ts',
      instructionsPath: './src/exercises/discriminated-unions/02-shapes/instructions.md',
    },
  ],
};