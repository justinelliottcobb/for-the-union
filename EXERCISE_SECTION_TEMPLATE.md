# Exercise Section Template Documentation

## Overview

This document defines the **gold standard** structure for exercise sections, based on the comprehensive React Hooks implementation. All future exercise sections should follow this template to ensure consistency, scalability, and optimal learning experience.

## 🏗️ Directory Structure Template

```
src/exercises/[category-name]/
├── config.ts                           # Category configuration and metadata
├── 01-[exercise-name]/
│   ├── instructions.md                  # Detailed learning content
│   ├── solution.tsx                     # Complete reference solution
│   └── test.ts                          # Comprehensive test suite
├── 02-[exercise-name]/
│   ├── instructions.md
│   ├── solution.tsx
│   └── test.ts
└── [nn-exercise-name]/
    ├── instructions.md
    ├── solution.tsx
    └── test.ts

exercise-files/[category-name]/
├── 01-[exercise-name]/
│   └── exercise.tsx                     # Student TODO-driven file
├── 02-[exercise-name]/
│   └── exercise.tsx
└── [nn-exercise-name]/
    └── exercise.tsx
```

## 📋 File Standards

### 1. Category Configuration (`config.ts`)

**Purpose**: Define the exercise category with metadata and exercise list
**Location**: `src/exercises/[category-name]/config.ts`

```typescript
import type { ExerciseCategory } from '@/types';

export const [categoryName]Category: ExerciseCategory = {
  id: 'category-name',                    // kebab-case identifier
  name: 'Category Display Name',          // Human-readable title
  description: 'Brief compelling description of what learners will master',
  icon: 'IconName',                       // Tabler icon name
  order: 2,                              // Display order in navigation
  exercises: [
    {
      id: '01-exercise-name',             // REQUIRED: kebab-case, zero-padded
      title: 'Exercise Display Title',     // REQUIRED: Human-readable
      description: 'Brief description of specific exercise goals',
      category: 'category-name',          // REQUIRED: matches category id
      difficulty: 2,                      // REQUIRED: 1-5 scale
      prerequisites: ['previous-exercise'], // Array of prerequisite exercise IDs
      learningObjectives: [               // 4-6 specific, measurable objectives
        'Understand core concept X',
        'Learn to implement pattern Y', 
        'Practice handling edge case Z',
        'Master integration with W'
      ],
      hints: [                           // 4-6 helpful tips for students
        'Key insight about the problem',
        'Common pitfall to avoid',
        'Useful pattern or approach',
        'TypeScript-specific guidance'
      ],
      estimatedTime: 20,                 // Minutes for average completion
      filePath: './exercise-files/category-name/01-exercise-name/exercise.tsx',
      solutionPath: './src/exercises/category-name/01-exercise-name/solution.tsx',
      testsPath: './src/exercises/category-name/01-exercise-name/tests.ts',
      instructionsPath: './src/exercises/category-name/01-exercise-name/instructions.md',
    }
    // ... more exercises
  ],
};
```

### 2. Exercise File (`exercise-files/[category]/[exercise]/exercise.tsx`)

**Purpose**: Student-facing file with TODOs and learning structure
**Standards**:

```typescript
// [Exercise Title]
// [Brief description of what the exercise teaches]

import { relevant, imports } from 'react/libraries';

// Learning objectives:
// - Objective 1 (copy from config.ts)
// - Objective 2  
// - Objective 3
// - Objective 4

// Hints:
// 1. Hint 1 (copy from config.ts)
// 2. Hint 2
// 3. Hint 3
// 4. Hint 4

// TODO: Define types for the exercise
type RequiredType = {
  // Define necessary type structure
};

// Mock data, helper functions, or setup code here
const mockData = {
  // Provide realistic sample data
};

// TODO: Implement [ComponentName] component
function ComponentName() {
  // TODO: Add state for [specific requirement]
  // TODO: Implement [specific function]
  // TODO: Handle [specific case]
  
  // Guidance comments for complex sections
  const helperFunction = () => {
    // Your code here
  };
  
  // TODO: Return JSX with:
  // - Specific requirement 1
  // - Specific requirement 2
  // - Specific requirement 3
  return null; // Replace with your JSX
}

// Additional components as needed...

// Export all components and types for testing
export {
  ComponentName,
  // ... other exports
  type RequiredType,
};
```

### 3. Instructions (`src/exercises/[category]/[exercise]/instructions.md`)

**Purpose**: Comprehensive learning content and context
**Structure**:

```markdown
# [Exercise Title]

[Compelling introduction paragraph about what they'll learn]

## Learning Objectives

- [Copy learning objectives from config.ts]

## Prerequisites

- [List required prior knowledge]
- [Reference prerequisite exercises]

## Background

[2-3 paragraphs explaining the concept, why it's important, real-world usage]

### Key Concepts

- **Concept 1**: Definition and explanation
- **Concept 2**: Definition and explanation  
- **Concept 3**: Definition and explanation

## Exercise Instructions

### Part 1: [First Major Section]

[Detailed explanation of first requirements]

### Part 2: [Second Major Section]

[Detailed explanation of second requirements]

### Part 3: [Advanced Implementation]

[Detailed explanation of advanced requirements]

## Common Patterns

### Pattern 1: [Important Pattern Name]

```typescript
// Example implementation of the pattern
```

### Pattern 2: [Another Important Pattern]

```typescript
// Example implementation
```

## Testing Your Implementation

Your solution should:
- ✅ [Specific testable requirement 1]
- ✅ [Specific testable requirement 2]
- ✅ [Specific testable requirement 3]

## Additional Resources

- [Link to official docs]
- [Link to relevant articles]
- [Link to related patterns]
```

### 4. Solution (`src/exercises/[category]/[exercise]/solution.tsx`)

**Purpose**: Complete reference implementation
**Standards**:

```typescript
// [Exercise Title] - Complete Solution
// This is the reference implementation showing best practices

import { relevant, imports } from 'react/libraries';

// Types (fully implemented)
type RequiredType = {
  // Complete type definitions
};

// Full implementation with best practices
function ComponentName() {
  // State management with proper types
  const [state, setState] = useState<StateType>(initialState);
  
  // Event handlers with proper types
  const handleEvent = useCallback((param: ParamType) => {
    // Proper implementation
  }, [dependencies]);
  
  // Effects with cleanup if needed
  useEffect(() => {
    // Implementation
    return () => {
      // Cleanup
    };
  }, [dependencies]);
  
  // Complete JSX with accessibility and best practices
  return (
    <div>
      {/* Full implementation */}
    </div>
  );
}

// Export all components
export {
  ComponentName,
  type RequiredType,
};
```

### 5. Tests (`src/exercises/[category]/[exercise]/test.ts`)

**Purpose**: Comprehensive test suite validating implementation
**Standards**:

```typescript
import type { TestResult } from '@/types';
import { createComponentTest, createHookTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test each major component/hook
  tests.push(createComponentTest('ComponentName', compiledCode, {
    requiredHooks: ['useState', 'useEffect'],
    requiredElements: ['button', 'input'],
    customValidation: (code) => {
      return code.includes('specificPattern') && 
             !code.includes('antiPattern');
    },
    errorMessage: 'ComponentName needs proper implementation with X, Y, Z'
  }));

  // Test custom hooks if present
  tests.push(createHookTest('useCustomHook', compiledCode, {
    requiredHooks: ['useState'],
    requiredReturns: ['data', 'loading'],
    shouldNotReturn: ['return null'],
    customValidation: (code) => code.includes('properLogic')
  }));

  // Complex custom tests when helpers aren't sufficient
  const customSection = extractComponentCode(compiledCode, 'ComplexComponent');
  tests.push({
    name: 'Advanced feature validation',
    passed: (
      customSection.includes('advancedFeature') &&
      customSection.match(/pattern/g)?.length >= 3 &&
      !customSection.includes('return null')
    ),
    error: !passed ? 'Complex component needs advanced implementation' : undefined,
    executionTime: 1
  });

  return tests;
}
```

## 📊 Naming Conventions

### Exercise IDs
- Format: `[nn]-[descriptive-name]`
- Zero-padded numbers: `01`, `02`, `10`, `15`
- Kebab-case names: `usestate-fundamentals`, `custom-hooks`

### File Names
- Exercise files: `exercise.tsx` (always)
- Solution files: `solution.tsx` (always)
- Test files: `test.ts` (new standard) or `tests.ts` (legacy)
- Instructions: `instructions.md` (always)

### Component Names
- PascalCase: `UserProfile`, `DataFetcher`, `WindowSizeTracker`
- Descriptive and specific to functionality

### Type Names
- PascalCase with descriptive suffixes: `UserFormData`, `TodoItem`, `LoadingState`

## 🎯 Content Standards

### Difficulty Progression
1. **Level 1-2**: Foundation concepts, basic implementation
2. **Level 3**: Integration patterns, multiple concepts
3. **Level 4**: Advanced patterns, performance considerations
4. **Level 5**: Expert-level, complex architectures

### Learning Objectives
- 4-6 objectives per exercise
- Specific and measurable
- Build progressively in complexity
- Use action verbs: "Understand", "Implement", "Master", "Practice"

### Hints
- 4-6 practical hints
- Address common pitfalls
- Provide TypeScript-specific guidance
- Reference key patterns or APIs

### Prerequisites
- List specific prior exercises
- Mention required external knowledge
- Keep dependencies minimal and clear

## 🧪 Testing Standards

### Test Coverage
Each exercise should test:
- ✅ **Component Implementation**: Proper JSX, hooks usage, not returning null
- ✅ **State Management**: Correct state variables and updates
- ✅ **Event Handling**: User interactions and callbacks
- ✅ **Type Safety**: Proper TypeScript usage
- ✅ **Integration**: Components working together
- ✅ **Edge Cases**: Error handling, empty states

### Test Quality
- Use helper functions from `test-utils.ts` for consistency
- Provide clear error messages for failures
- Test the compiled JavaScript output (not raw TypeScript)
- Handle both JSX and compiled `_jsx` patterns

## 📁 Example: Complete Exercise Structure

Based on React Hooks `01-usestate-fundamentals`:

```
src/exercises/react-hooks/01-usestate-fundamentals/
├── instructions.md      # 87 lines of detailed learning content
├── solution.tsx         # 156 lines with 4 complete components
└── test.ts             # 100 lines testing all components

exercise-files/react-hooks/01-usestate-fundamentals/
└── exercise.tsx        # 168 lines with TODOs and guidance
```

**Content Quality Metrics**:
- Instructions: Comprehensive background, examples, patterns
- Exercise file: Clear TODOs, helpful comments, proper scaffolding  
- Solution: Production-ready code with best practices
- Tests: 13 test cases covering all components and edge cases

## 🚀 Exercise Creation Workflow

1. **Plan the Exercise**
   - Define learning objectives (4-6 items)
   - Identify prerequisites
   - Choose difficulty level (1-5)
   - Estimate completion time

2. **Create Directory Structure**
   ```bash
   mkdir -p src/exercises/[category]/[nn-exercise-name]
   mkdir -p exercise-files/[category]/[nn-exercise-name]
   ```

3. **Write Core Files**
   - Start with `exercise.tsx` (student TODO file)
   - Create comprehensive `instructions.md`
   - Implement complete `solution.tsx`
   - Build thorough `test.ts` using helpers

4. **Update Configuration**
   - Add exercise entry to `config.ts`
   - Ensure proper ordering and metadata

5. **Test Integration**
   - Verify exercise loads in development
   - Test all components compile correctly
   - Validate test suite runs successfully

## 🎉 Success Metrics

A well-structured exercise section should achieve:
- **100% test coverage** of learning objectives
- **Clear progression** from basic to advanced concepts
- **Consistent structure** across all exercises
- **Comprehensive documentation** for self-directed learning
- **Production-ready code** in solutions
- **Engaging content** that motivates continued learning

## 🔄 Maintenance

### Regular Updates
- Review and update external links
- Ensure compatibility with latest React/TypeScript versions
- Refresh examples with current best practices
- Add new exercises based on community feedback

### Quality Assurance
- All exercises should compile without errors
- Tests should have clear, helpful error messages
- Instructions should be comprehensive yet concise
- Solutions should demonstrate best practices

---

**This template is based on the React Hooks exercise section, which serves as the gold standard for all future exercise development. Following this template ensures consistency, quality, and scalability across the entire learning platform.**