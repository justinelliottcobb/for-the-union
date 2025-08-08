import { useState, useEffect } from 'react';
import type { Exercise, ExerciseCategory } from '@/types';
import { discriminatedUnionsCategory } from '@exercises/discriminated-unions/config';
import { reactHooksCategory } from '@exercises/react-hooks/config';

// Import all exercise categories
const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  discriminatedUnionsCategory,
  reactHooksCategory,
].sort((a, b) => a.order - b.order);

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