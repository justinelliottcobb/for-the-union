# Exercise Creation Guide

## Quick Start

This guide provides practical steps and automation tools for creating new exercises that follow the established template structure based on the React Hooks gold standard.

## 🛠️ Prerequisites

Before creating exercises:
- Review `EXERCISE_SECTION_TEMPLATE.md` for structure standards
- Understand the modular test system in `TEST_SYSTEM.md`
- Have the development server running (`npm run dev`)

## 📋 Step-by-Step Creation Process

### Step 1: Plan Your Exercise

Use this checklist:

```markdown
## Exercise Planning Checklist

- [ ] **Category**: Which section does this belong to?
- [ ] **Exercise Number**: What's the next sequential number?
- [ ] **Learning Objectives**: 4-6 specific, measurable goals
- [ ] **Prerequisites**: Which exercises must be completed first?
- [ ] **Difficulty Level**: 1-5 scale based on complexity
- [ ] **Time Estimate**: Realistic completion time in minutes
- [ ] **Components/Hooks**: What will students implement?
- [ ] **Key Concepts**: 3-5 main concepts to teach
```

### Step 2: Use the Exercise Generator

Create a helper script for generating exercise scaffolding:

```typescript
// scripts/create-exercise-advanced.ts
import { promises as fs } from 'fs';
import { join } from 'path';

interface ExerciseConfig {
  category: string;
  exerciseNumber: number;
  exerciseName: string;
  title: string;
  description: string;
  difficulty: number;
  prerequisites: string[];
  learningObjectives: string[];
  hints: string[];
  estimatedTime: number;
  components: string[];
  hooks: string[];
}

export async function createExercise(config: ExerciseConfig) {
  const exerciseId = `${config.exerciseNumber.toString().padStart(2, '0')}-${config.exerciseName}`;
  
  // Create directories
  const srcDir = join('src/exercises', config.category, exerciseId);
  const exerciseFilesDir = join('exercise-files', config.category, exerciseId);
  
  await fs.mkdir(srcDir, { recursive: true });
  await fs.mkdir(exerciseFilesDir, { recursive: true });
  
  // Generate files
  await Promise.all([
    generateInstructionsMd(config, srcDir),
    generateExerciseTsx(config, exerciseFilesDir),
    generateSolutionTsx(config, srcDir),
    generateTestTs(config, srcDir),
    updateCategoryConfig(config)
  ]);
  
  console.log(`✅ Exercise ${exerciseId} created successfully!`);
}

async function generateInstructionsMd(config: ExerciseConfig, dir: string) {
  const content = `# ${config.title}

${config.description}

## Learning Objectives

${config.learningObjectives.map(obj => `- ${obj}`).join('\n')}

## Prerequisites

${config.prerequisites.length > 0 
  ? config.prerequisites.map(req => `- ${req}`).join('\n')
  : '- Basic TypeScript and React knowledge'
}

## Background

[Add comprehensive background explanation about the concepts being taught]

### Key Concepts

- **Concept 1**: [Define first key concept]
- **Concept 2**: [Define second key concept]  
- **Concept 3**: [Define third key concept]

## Exercise Instructions

### Part 1: Basic Implementation

[Detailed instructions for basic requirements]

### Part 2: Advanced Features

[Instructions for intermediate features]

### Part 3: Integration & Testing

[Instructions for advanced integration]

## Common Patterns

### Pattern 1: [Important Pattern]

\`\`\`typescript
// Example implementation
\`\`\`

## Testing Your Implementation

Your solution should:
- ✅ [First testable requirement]
- ✅ [Second testable requirement]
- ✅ [Third testable requirement]

## Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
`;

  await fs.writeFile(join(dir, 'instructions.md'), content);
}

async function generateExerciseTsx(config: ExerciseConfig, dir: string) {
  const content = `// ${config.title}
// ${config.description}

import { useState, useEffect, useCallback } from 'react';

// Learning objectives:
${config.learningObjectives.map(obj => `// - ${obj}`).join('\n')}

// Hints:
${config.hints.map((hint, i) => `// ${i + 1}. ${hint}`).join('\n')}

// TODO: Define types for the exercise
type ExerciseData = {
  // Define your types here
};

// TODO: Mock data and helpers
const mockData = {
  // Provide sample data
};

${config.components.map(componentName => `
// TODO: Implement ${componentName} component
function ${componentName}() {
  // TODO: Add state management
  // TODO: Implement core functionality
  // TODO: Handle user interactions
  
  // TODO: Return JSX with:
  // - [Specific requirement 1]
  // - [Specific requirement 2]  
  // - [Specific requirement 3]
  return null; // Replace with your JSX
}`).join('\n\n')}

// Export all components and types for testing
export {
${config.components.map(name => `  ${name},`).join('\n')}
  type ExerciseData,
};
`;

  await fs.writeFile(join(dir, 'exercise.tsx'), content);
}

async function generateSolutionTsx(config: ExerciseConfig, dir: string) {
  const content = `// ${config.title} - Complete Solution
// Reference implementation demonstrating best practices

import { useState, useEffect, useCallback } from 'react';

// Complete type definitions
type ExerciseData = {
  // Full implementation of types
};

${config.components.map(componentName => `
// Complete implementation of ${componentName}
function ${componentName}() {
  // Proper state management
  const [state, setState] = useState<StateType>(initialState);
  
  // Event handlers with proper types
  const handleEvent = useCallback((param: ParamType) => {
    // Implementation
  }, []);
  
  // Complete JSX implementation
  return (
    <div>
      {/* Full working implementation */}
    </div>
  );
}`).join('\n\n')}

export {
${config.components.map(name => `  ${name},`).join('\n')}
  type ExerciseData,
};
`;

  await fs.writeFile(join(dir, 'solution.tsx'), content);
}

async function generateTestTs(config: ExerciseConfig, dir: string) {
  const content = `import type { TestResult } from '@/types';
import { createComponentTest, createHookTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

${config.components.map(componentName => `
  // Test ${componentName} component
  tests.push(createComponentTest('${componentName}', compiledCode, {
    requiredHooks: ['useState'], // Add required hooks
    requiredElements: [], // Add required DOM elements
    // customValidation: (code) => code.includes('specificPattern'),
    // errorMessage: 'Custom error message for ${componentName}'
  }));`).join('\n')}

${config.hooks.map(hookName => `
  // Test ${hookName} custom hook
  tests.push(createHookTest('${hookName}', compiledCode, {
    requiredHooks: ['useState'],
    requiredReturns: [], // Add expected return values
    shouldNotReturn: ['return null'], // Add stub values to avoid
    // customValidation: (code) => code.includes('hookLogic')
  }));`).join('\n')}

  return tests;
}
`;

  await fs.writeFile(join(dir, 'test.ts'), content);
}

// Usage example
const sampleConfig: ExerciseConfig = {
  category: 'react-hooks',
  exerciseNumber: 7,
  exerciseName: 'usecontext-advanced',
  title: 'Advanced useContext Patterns',
  description: 'Master advanced Context API patterns for complex state management',
  difficulty: 4,
  prerequisites: ['06-useeffect-preloading'],
  learningObjectives: [
    'Understand Context composition patterns',
    'Implement provider optimization techniques',
    'Master context value memoization',
    'Handle complex context hierarchies'
  ],
  hints: [
    'Use React.memo for provider optimization',
    'Memoize context values to prevent unnecessary re-renders',
    'Separate different concerns into different contexts',
    'Use custom hooks to encapsulate context logic'
  ],
  estimatedTime: 35,
  components: ['OptimizedProvider', 'ContextConsumer', 'NestedContextDemo'],
  hooks: ['useOptimizedContext', 'useContextSelector']
};
```

### Step 3: Manual Creation (Alternative)

If not using the generator, create directories manually:

```bash
# Create exercise directories
mkdir -p src/exercises/[category]/[nn-exercise-name]
mkdir -p exercise-files/[category]/[nn-exercise-name]

# Create required files
touch src/exercises/[category]/[nn-exercise-name]/instructions.md
touch src/exercises/[category]/[nn-exercise-name]/solution.tsx
touch src/exercises/[category]/[nn-exercise-name]/test.ts
touch exercise-files/[category]/[nn-exercise-name]/exercise.tsx
```

### Step 4: Content Creation Workflow

#### 4.1 Write the Exercise File First
- Start with the student-facing `exercise.tsx`
- Include comprehensive TODOs and guidance
- Add type definitions and mock data
- Provide clear structure for implementation

#### 4.2 Create Comprehensive Instructions
- Write detailed `instructions.md` with background
- Include examples and common patterns
- Add links to relevant resources
- Explain the "why" behind each requirement

#### 4.3 Implement Complete Solution
- Build production-ready `solution.tsx`
- Demonstrate best practices
- Handle edge cases and errors
- Include proper TypeScript types

#### 4.4 Build Thorough Tests
- Create comprehensive `test.ts` using helpers
- Test all major functionality
- Include edge cases and error scenarios
- Provide clear error messages

#### 4.5 Update Category Configuration
- Add exercise entry to `config.ts`
- Ensure proper ordering and metadata
- Verify all paths are correct

## 🧪 Testing Your Exercise

### Automated Tests
```bash
# Run development server
npm run dev

# Navigate to your exercise in the browser
# Verify all components load correctly
# Test the solution compiles
# Ensure tests run successfully
```

### Manual Testing Checklist
- [ ] Exercise loads without errors
- [ ] Instructions are clear and comprehensive
- [ ] TODOs provide adequate guidance
- [ ] Solution demonstrates best practices
- [ ] Tests provide helpful feedback
- [ ] Integration with existing exercises works
- [ ] Time estimate is realistic

## 📊 Quality Standards

### Content Quality
- **Instructions**: 50-150 lines of comprehensive learning content
- **Exercise File**: Clear TODOs, helpful comments, proper scaffolding
- **Solution**: Production-ready code with best practices
- **Tests**: Cover all major functionality and edge cases

### Technical Quality
- **TypeScript**: Proper types throughout
- **React**: Current best practices and patterns
- **Testing**: Use helper functions for consistency
- **Documentation**: Clear, actionable guidance

### Learning Quality  
- **Progressive Difficulty**: Build on previous exercises
- **Clear Objectives**: Specific, measurable goals
- **Practical Application**: Real-world relevant scenarios
- **Comprehensive Coverage**: Address common use cases

## 🔧 Tools and Utilities

### Test Creation Helper
```typescript
// Use when test-utils helpers aren't sufficient
function createCustomTest(name: string, compiledCode: string): TestResult {
  const componentSection = extractComponentCode(compiledCode, name);
  
  const passed = (
    componentSection.includes('requiredPattern') &&
    componentSection.match(/specificRegex/g)?.length >= 2 &&
    !componentSection.includes('antiPattern')
  );
  
  return {
    name: `${name} implementation`,
    passed,
    error: passed ? undefined : `${name} needs proper implementation with X, Y, Z`,
    executionTime: 1
  };
}
```

### Development Commands
```bash
# Generate exercise scaffolding
npm run create-exercise

# Run development server with hot reload
npm run dev

# Build and test specific exercise
npm run test:exercise [category] [exercise-id]

# Validate exercise structure
npm run validate:exercises
```

## 📈 Scaling Considerations

### For Large Exercise Collections (50+ exercises)
- Use consistent naming conventions
- Implement automated validation
- Create category-specific templates
- Build progress tracking systems

### Performance Optimization
- Lazy load exercise content
- Cache compiled solutions
- Optimize test execution
- Preload critical resources

### Maintenance Strategy
- Regular content updates
- Version compatibility checks
- Community feedback integration
- Performance monitoring

## 🚀 Best Practices Summary

1. **Start with Learning Objectives** - Define what students will achieve
2. **Follow the Template** - Use the React Hooks structure as your guide
3. **Test Early and Often** - Validate functionality throughout development
4. **Think Progressively** - Build complexity gradually across exercises
5. **Document Thoroughly** - Clear instructions prevent student confusion
6. **Use Standard Tools** - Leverage the modular test system and helpers
7. **Quality Over Quantity** - Better to have fewer, excellent exercises
8. **Gather Feedback** - Test with actual learners when possible

---

**Following this guide ensures your exercises meet the high standards established by the React Hooks section and integrate seamlessly with the modular architecture.**