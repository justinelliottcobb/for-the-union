import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import type { ExerciseProgress, ExerciseStatus, LearningStats } from '@/types';
import { useExercises } from './useExercises';

interface ProgressData {
  exercises: ExerciseProgress[];
  lastUpdated: Date;
}

const defaultProgressData: ProgressData = {
  exercises: [],
  lastUpdated: new Date(),
};

export function useProgress() {
  const { getAllExercises, categories } = useExercises();
  const [progressData, setProgressData] = useLocalStorage<ProgressData>({
    key: 'typescript-exercises-progress',
    defaultValue: defaultProgressData,
  });

  const getExerciseProgress = useCallback((exerciseId: string): ExerciseProgress => {
    const existing = progressData.exercises.find(p => p.exerciseId === exerciseId);
    return existing || {
      exerciseId,
      status: 'not_started',
      attempts: 0,
      timeSpent: 0,
      hintsUsed: [],
    };
  }, [progressData.exercises]);

  const updateExerciseProgress = useCallback(
    (exerciseId: string, updates: Partial<Omit<ExerciseProgress, 'exerciseId'>>) => {
      setProgressData(prev => {
        const existingIndex = prev.exercises.findIndex(p => p.exerciseId === exerciseId);
        // Use the previous data to avoid calling getExerciseProgress which could cause re-renders
        const existing = existingIndex >= 0 ? prev.exercises[existingIndex] : {
          exerciseId,
          status: 'not_started' as ExerciseStatus,
          attempts: 0,
          timeSpent: 0,
          hintsUsed: [],
        };
        
        const updated: ExerciseProgress = {
          ...existing,
          ...updates,
        };

        // Handle status changes
        if (updates.status === 'completed' && existing.status !== 'completed') {
          updated.completionTime = new Date();
        }

        if (updates.status === 'in_progress' && existing.status === 'not_started') {
          updated.startTime = new Date();
        }

        const newExercises = [...prev.exercises];
        if (existingIndex >= 0) {
          newExercises[existingIndex] = updated;
        } else {
          newExercises.push(updated);
        }

        return {
          exercises: newExercises,
          lastUpdated: new Date(),
        };
      });
    },
    [setProgressData]
  );

  const getAllExerciseProgress = useCallback((): ExerciseProgress[] => {
    return progressData.exercises;
  }, [progressData.exercises]);

  const getCategoryProgress = useCallback((categoryId: string) => {
    const categoryExercises = categories
      .find(c => c.id === categoryId)
      ?.exercises || [];
    
    const completed = categoryExercises.filter(exercise => {
      const progress = getExerciseProgress(exercise.id);
      return progress.status === 'completed';
    }).length;

    return {
      total: categoryExercises.length,
      completed,
      inProgress: categoryExercises.filter(exercise => {
        const progress = getExerciseProgress(exercise.id);
        return progress.status === 'in_progress';
      }).length,
    };
  }, [categories, getExerciseProgress]);

  const getOverallProgress = useCallback((): LearningStats => {
    const allExercises = getAllExercises();
    const completedExercises = allExercises.filter(exercise => {
      const progress = getExerciseProgress(exercise.id);
      return progress.status === 'completed';
    });

    const totalTimeSpent = progressData.exercises.reduce(
      (acc, progress) => acc + progress.timeSpent,
      0
    );

    const averageCompletionTime = completedExercises.length > 0
      ? totalTimeSpent / completedExercises.length
      : 0;

    const categoriesCompleted = categories
      .filter(category => {
        const progress = getCategoryProgress(category.id);
        return progress.completed === progress.total && progress.total > 0;
      })
      .map(c => c.id);

    return {
      totalExercises: allExercises.length,
      completedExercises: completedExercises.length,
      totalTimeSpent,
      averageCompletionTime,
      categoriesCompleted,
      currentStreak: 0, // TODO: Implement streak calculation
      longestStreak: 0, // TODO: Implement streak calculation
    };
  }, [getAllExercises, getExerciseProgress, progressData.exercises, categories, getCategoryProgress]);

  const resetProgress = () => {
    setProgressData(defaultProgressData);
  };

  const resetExerciseProgress = (exerciseId: string) => {
    setProgressData(prev => ({
      ...prev,
      exercises: prev.exercises.filter(p => p.exerciseId !== exerciseId),
      lastUpdated: new Date(),
    }));
  };

  return {
    getExerciseProgress,
    updateExerciseProgress,
    getAllExerciseProgress,
    getCategoryProgress,
    getOverallProgress,
    resetProgress,
    resetExerciseProgress,
  };
}