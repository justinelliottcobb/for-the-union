import { useState, useEffect } from 'react';
import type { Exercise, ExerciseCategory } from '@/types';

// This would normally come from a configuration file or API
const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  {
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
  },
];

export function useExercises() {
  const [categories] = useState<ExerciseCategory[]>(EXERCISE_CATEGORIES);

  const getExercise = (categoryId: string, exerciseId: string): Exercise | undefined => {
    const category = categories.find(c => c.id === categoryId);
    return category?.exercises.find(e => e.id === exerciseId);
  };

  const getAllExercises = (): Exercise[] => {
    return categories.flatMap(category => category.exercises);
  };

  const getCategory = (categoryId: string): ExerciseCategory | undefined => {
    return categories.find(c => c.id === categoryId);
  };

  const getNextExercise = (currentExerciseId: string): Exercise | undefined => {
    const allExercises = getAllExercises();
    const currentIndex = allExercises.findIndex(e => e.id === currentExerciseId);
    return currentIndex >= 0 && currentIndex < allExercises.length - 1
      ? allExercises[currentIndex + 1]
      : undefined;
  };

  const getPreviousExercise = (currentExerciseId: string): Exercise | undefined => {
    const allExercises = getAllExercises();
    const currentIndex = allExercises.findIndex(e => e.id === currentExerciseId);
    return currentIndex > 0
      ? allExercises[currentIndex - 1]
      : undefined;
  };

  const getPrerequisites = (exerciseId: string): Exercise[] => {
    const exercise = getAllExercises().find(e => e.id === exerciseId);
    if (!exercise) return [];
    
    return exercise.prerequisites
      .map(prereqId => getAllExercises().find(e => e.id === prereqId))
      .filter((e): e is Exercise => e !== undefined);
  };

  return {
    categories,
    getExercise,
    getAllExercises,
    getCategory,
    getNextExercise,
    getPreviousExercise,
    getPrerequisites,
  };
}