import type { TestResult } from '@/types';

// Test runner function signature
export type TestRunner = (compiledCode: string) => TestResult[];

// Test registry interface
export interface TestRegistry {
  [category: string]: {
    [exerciseId: string]: TestRunner;
  };
}

// Dynamic test loader function
export async function loadExerciseTests(
  category: string,
  exerciseId: string
): Promise<TestRunner | null> {
  try {
    // Try different test file extensions with explicit paths for Vite
    const testPaths = [
      `../exercises/${category}/${exerciseId}/test.tsx`,
      `../exercises/${category}/${exerciseId}/test.ts`,
      `../exercises/${category}/${exerciseId}/tests.ts`
    ];
    
    for (const testPath of testPaths) {
      try {
        console.log(`Attempting to load: ${testPath}`);
        // Use /* @vite-ignore */ to suppress Vite warnings for dynamic imports
        const testModule = await import(/* @vite-ignore */ testPath);
        console.log(`Successfully loaded test module for ${category}/${exerciseId}, has runTests:`, typeof testModule.runTests);
        if (testModule.runTests && typeof testModule.runTests === 'function') {
          return testModule.runTests;
        }
      } catch (importError) {
        console.log(`Failed to import ${testPath} for ${category}/${exerciseId}:`, importError);
        // Continue to next path
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`No tests found for ${category}/${exerciseId}:`, error);
    return null;
  }
}

// Pre-populate registry with known test modules for better performance
export const TEST_REGISTRY: TestRegistry = {};

// Register a test runner for a specific exercise
export function registerTest(
  category: string,
  exerciseId: string,
  testRunner: TestRunner
): void {
  if (!TEST_REGISTRY[category]) {
    TEST_REGISTRY[category] = {};
  }
  TEST_REGISTRY[category][exerciseId] = testRunner;
}

// Get test runner from registry or load dynamically
export async function getTestRunner(
  category: string,
  exerciseId: string
): Promise<TestRunner | null> {
  // Check if already loaded in registry
  if (TEST_REGISTRY[category]?.[exerciseId]) {
    return TEST_REGISTRY[category][exerciseId];
  }
  
  // Try to load dynamically
  const testRunner = await loadExerciseTests(category, exerciseId);
  
  // Cache in registry if found
  if (testRunner) {
    registerTest(category, exerciseId, testRunner);
  }
  
  return testRunner;
}

// Initialize registry with all available tests (called at startup)
export async function initializeTestRegistry(): Promise<void> {
  const categories = [
    'react-hooks',
    'discriminated-unions', 
    'advanced-typescript-patterns',
    'elite-state-management',
    'graphql',
    'performance-optimization',
    'component-architecture-design-patterns',
    'full-stack-integration',
    'testing-strategies'
  ];
  
  for (const category of categories) {
    try {
      // Get category config to find all exercises
      const configModule = await import(/* @vite-ignore */ `../exercises/${category}/config.ts`);
      const config = Object.values(configModule)[0] as any; // Get the exported category config
      
      if (config?.exercises) {
        // Pre-load all test runners for this category
        const loadPromises = config.exercises.map(async (exercise: any) => {
          try {
            const testRunner = await loadExerciseTests(category, exercise.id);
            if (testRunner) {
              registerTest(category, exercise.id, testRunner);
              console.log(`✓ Loaded tests for ${category}/${exercise.id}`);
            }
          } catch (error) {
            console.warn(`⚠ Failed to load tests for ${category}/${exercise.id}`);
          }
        });
        
        await Promise.allSettled(loadPromises);
      }
    } catch (error) {
      console.warn(`Failed to load category config for ${category}:`, error);
    }
  }
  
  console.log('Test registry initialized with', 
    Object.keys(TEST_REGISTRY).reduce((total, category) => 
      total + Object.keys(TEST_REGISTRY[category]).length, 0
    ), 'test modules'
  );
}

// Get all registered test categories
export function getRegisteredCategories(): string[] {
  return Object.keys(TEST_REGISTRY);
}

// Get all registered exercises for a category
export function getRegisteredExercises(category: string): string[] {
  return Object.keys(TEST_REGISTRY[category] || {});
}

// Get test registry stats
export function getTestRegistryStats(): {
  totalCategories: number;
  totalExercises: number;
  categoriesWithTests: Record<string, number>;
} {
  const categoriesWithTests: Record<string, number> = {};
  let totalExercises = 0;
  
  for (const category of Object.keys(TEST_REGISTRY)) {
    const exerciseCount = Object.keys(TEST_REGISTRY[category]).length;
    categoriesWithTests[category] = exerciseCount;
    totalExercises += exerciseCount;
  }
  
  return {
    totalCategories: Object.keys(TEST_REGISTRY).length,
    totalExercises,
    categoriesWithTests,
  };
}