export interface Exercise {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  prerequisites: string[];
  learningObjectives: string[];
  hints: string[];
  estimatedTime: number; // minutes
  filePath: string;
  solutionPath?: string;
  testsPath?: string;
  instructionsPath?: string;
}

export interface ExerciseCategory {
  id: string;
  name: string;
  description: string;
  icon: string; // Tabler icon name
  exercises: Exercise[];
  order: number;
}

export interface ExerciseProgress {
  exerciseId: string;
  status: ExerciseStatus;
  startTime?: Date;
  completionTime?: Date;
  attempts: number;
  timeSpent: number; // minutes
  hintsUsed: string[];
  lastError?: string;
}

export type ExerciseStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  executionTime: number;
  expected?: unknown;
  actual?: unknown;
}

export interface ExerciseResult {
  exercise: Exercise;
  status: ExerciseStatus;
  tests: TestResult[];
  compilationErrors: CompilationError[];
  consoleOutput: string[];
  totalExecutionTime: number;
}

export interface CompilationError {
  message: string;
  line?: number;
  column?: number;
  file?: string;
  code?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  showHints: boolean;
  preferredEditor: string;
  notifications: boolean;
}

export interface LearningStats {
  totalExercises: number;
  completedExercises: number;
  totalTimeSpent: number;
  averageCompletionTime: number;
  categoriesCompleted: string[];
  currentStreak: number;
  longestStreak: number;
}