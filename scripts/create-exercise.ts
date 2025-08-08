#!/usr/bin/env tsx

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { program } from 'commander';

interface ExerciseConfig {
  category: string;
  name: string;
  title: string;
  description: string;
  difficulty: number;
  estimatedTime: number;
  prerequisites: string[];
  learningObjectives: string[];
  hints: string[];
}

// Template for exercise file
const exerciseTemplate = (config: ExerciseConfig) => `// ${config.title}
// ${config.description}

// TODO: Implement your solution here
// Learning objectives:
${config.learningObjectives.map(obj => `// - ${obj}`).join('\n')}

// Hints:
${config.hints.map((hint, index) => `// ${index + 1}. ${hint}`).join('\n')}

// Your code goes below this line
// Remove this line and implement the required types and functions

export {};
`;

// Template for solution file
const solutionTemplate = (config: ExerciseConfig) => `// ${config.title} - Solution
// ${config.description}

// This is the reference solution for this exercise
// Students should try to solve it themselves before looking at this

// TODO: Add the complete solution here

export {};
`;

// Template for test file
const testTemplate = (config: ExerciseConfig) => `// Tests for ${config.title}
import { describe, it, expect } from 'vitest';

// Import the student's implementation
// Adjust the import path as needed
// import { ... } from '../../../exercise-files/${config.category}/${config.name}/exercise';

describe('${config.title}', () => {
  describe('Basic Functionality', () => {
    it('should pass basic test', () => {
      // TODO: Add test cases
      expect(true).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct types', () => {
      // TODO: Add type checking tests
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle edge cases correctly', () => {
      // TODO: Add edge case tests
      expect(true).toBe(true);
    });
  });

  describe('Integration', () => {
    it('should work in complex scenarios', () => {
      // TODO: Add integration tests
      expect(true).toBe(true);
    });
  });
});
`;

// Template for instructions markdown
const instructionsTemplate = (config: ExerciseConfig) => `# ${config.title}

${config.description}

## Learning Objectives

${config.learningObjectives.map(obj => `- ${obj}`).join('\n')}

## Prerequisites

${config.prerequisites.length > 0 
  ? config.prerequisites.map(prereq => `- ${prereq}`).join('\n')
  : 'None'
}

## Background

[Add background information about the concepts being taught]

## Instructions

1. **Step 1**: [Describe the first step]
2. **Step 2**: [Describe the second step]
3. **Step 3**: [Describe the third step]

## Key Concepts

### Concept 1
[Explain the first key concept with code examples]

\`\`\`typescript
// Example code
type Example = {
  property: string;
};
\`\`\`

### Concept 2
[Explain the second key concept]

## Hints

${config.hints.map((hint, index) => `${index + 1}. ${hint}`).join('\n')}

## Expected Behavior

When complete, you should be able to:

\`\`\`typescript
// Example usage
const example = createExample();
console.log(example); // Expected output
\`\`\`

**Estimated time:** ${config.estimatedTime} minutes  
**Difficulty:** ${config.difficulty}/5
`;

async function ensureDirectoryExists(path: string): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

async function createExerciseFiles(config: ExerciseConfig): Promise<void> {
  const basePath = join(process.cwd(), 'src', 'exercises', config.category, config.name);
  const exerciseFilesPath = join(process.cwd(), 'exercise-files', config.category, config.name);

  console.log(`Creating exercise: ${config.title}`);
  console.log(`Category: ${config.category}`);
  console.log(`Name: ${config.name}`);
  console.log(`Difficulty: ${config.difficulty}/5`);
  console.log(`Estimated time: ${config.estimatedTime} minutes`);
  console.log();

  // Create source files
  const instructionsFile = join(basePath, 'instructions.md');
  const solutionFile = join(basePath, 'solution.ts');
  const testsFile = join(basePath, 'tests.ts');

  // Create exercise files
  const exerciseFile = join(exerciseFilesPath, 'exercise.ts');

  // Ensure directories exist
  await ensureDirectoryExists(instructionsFile);
  await ensureDirectoryExists(exerciseFile);

  // Write files
  await writeFile(instructionsFile, instructionsTemplate(config));
  await writeFile(solutionFile, solutionTemplate(config));
  await writeFile(testsFile, testTemplate(config));
  await writeFile(exerciseFile, exerciseTemplate(config));

  console.log('✅ Created files:');
  console.log(`   📄 ${instructionsFile}`);
  console.log(`   ✅ ${solutionFile}`);
  console.log(`   🧪 ${testsFile}`);
  console.log(`   📝 ${exerciseFile}`);
  console.log();
  console.log('📚 Next steps:');
  console.log('1. Fill in the exercise template with TODO comments');
  console.log('2. Implement the reference solution');
  console.log('3. Write comprehensive test cases');
  console.log('4. Update the instructions with detailed guidance');
  console.log('5. Add the exercise to the category configuration');
}

// CLI setup
program
  .name('create-exercise')
  .description('Create a new TypeScript exercise')
  .requiredOption('--category <category>', 'Exercise category (e.g., discriminated-unions)')
  .requiredOption('--name <name>', 'Exercise name (e.g., advanced-patterns)')
  .option('--title <title>', 'Exercise title (defaults to formatted name)')
  .option('--description <description>', 'Exercise description')
  .option('--difficulty <difficulty>', 'Difficulty level (1-5)', '3')
  .option('--time <time>', 'Estimated time in minutes', '20')
  .option('--prerequisites <prerequisites...>', 'Prerequisites (exercise IDs)', [])
  .option('--objectives <objectives...>', 'Learning objectives', [])
  .option('--hints <hints...>', 'Hints for students', [])
  .action(async (options) => {
    const config: ExerciseConfig = {
      category: options.category,
      name: options.name,
      title: options.title || options.name.split('-').map((word: string) => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      description: options.description || `Learn about ${options.title || options.name}`,
      difficulty: parseInt(options.difficulty),
      estimatedTime: parseInt(options.time),
      prerequisites: options.prerequisites,
      learningObjectives: options.objectives.length > 0 
        ? options.objectives 
        : [`Understand ${options.title || options.name} concepts`],
      hints: options.hints.length > 0 
        ? options.hints 
        : ['Think step by step', 'Use TypeScript\'s type system to your advantage'],
    };

    try {
      await createExerciseFiles(config);
      console.log('🎉 Exercise created successfully!');
    } catch (error) {
      console.error('❌ Error creating exercise:', error);
      process.exit(1);
    }
  });

program.parse();