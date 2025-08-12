# Modular Test System Documentation

## Overview

This project uses a modular test system that can scale to handle 100+ exercises across multiple categories. The system automatically discovers and loads test files for exercises, making it easy to add new tests without modifying central configuration.

## Architecture

### Core Components

1. **Test Registry** (`src/lib/test-registry.ts`)
   - Manages dynamic loading and caching of test modules
   - Provides efficient lookup for test runners by category and exercise ID
   - Handles fallback to legacy test file formats

2. **Test Index** (`src/lib/test-index.ts`) 
   - Initializes the test registry at app startup
   - Provides statistics and monitoring for loaded tests
   - Ensures tests are available before exercise execution

3. **Test Utils** (`src/lib/test-utils.ts`)
   - Common helper functions for test creation
   - Standardized component and hook test generators
   - Template generator for new exercise tests

4. **Exercise Runner** (`src/lib/exercise-runner.ts`)
   - Integrates with the modular test system
   - Ensures test registry is initialized before running tests
   - Provides detailed logging for test execution

## File Structure

```
src/
├── exercises/
│   ├── category-name/
│   │   ├── exercise-id/
│   │   │   ├── test.ts          # New test file format
│   │   │   ├── tests.ts         # Legacy format (auto-detected)
│   │   │   ├── solution.tsx
│   │   │   └── instructions.md
│   │   └── config.ts
│   └── ...
├── lib/
│   ├── test-registry.ts         # Core test loading system
│   ├── test-index.ts            # Initialization and stats
│   ├── test-utils.ts            # Helper functions
│   └── exercise-runner.ts       # Updated to use modular tests
└── main.tsx                     # Imports test-index for initialization
```

## Test File Format

### Basic Structure

Each exercise can have a `test.ts` file that exports a `runTests` function:

```typescript
import type { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];
  
  // Add your tests here
  
  return tests;
}
```

### Using Helper Functions

The test utils provide standardized helpers for common patterns:

```typescript
import type { TestResult } from '@/types';
import { createComponentTest, createHookTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test a React component
  tests.push(createComponentTest('MyComponent', compiledCode, {
    requiredHooks: ['useState', 'useEffect'],
    requiredElements: ['button', 'input'],
    customValidation: (code) => code.includes('handleSubmit')
  }));

  // Test a custom hook
  tests.push(createHookTest('useMyHook', compiledCode, {
    requiredHooks: ['useState'],
    requiredReturns: ['data', 'loading'],
    shouldNotReturn: ['return null', 'return undefined']
  }));

  return tests;
}
```

## Adding Tests for New Exercises

### 1. Create Test File

Create a `test.ts` file in your exercise directory:

```bash
# Example: adding tests for a new React hooks exercise
touch src/exercises/react-hooks/07-new-exercise/test.ts
```

### 2. Implement Tests

Use the helper functions or write custom test logic:

```typescript
import type { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  tests.push(createComponentTest('NewComponent', compiledCode, {
    requiredHooks: ['useState'],
    requiredElements: ['div']
  }));

  return tests;
}
```

### 3. Automatic Discovery

The test will be automatically discovered and loaded when:
- The app starts (pre-loading for performance)
- The exercise is first run (lazy loading fallback)

## System Features

### 🚀 Performance Optimized
- Pre-loads all tests at app startup
- Caches test runners in memory
- Provides fast lookup for test execution

### 🔍 Auto-Discovery
- Automatically finds test files in exercise directories
- Supports both `test.ts` and legacy `tests.ts` formats
- No central configuration required for new tests

### 📊 Monitoring & Stats
- Detailed logging of test loading and execution
- Statistics on loaded tests by category
- Debug utilities for troubleshooting

### 🛠 Developer Friendly
- Helper functions for common test patterns
- Template generator for new exercise tests
- Consistent error handling and reporting

## API Reference

### Test Registry Functions

```typescript
// Get a test runner for a specific exercise
getTestRunner(category: string, exerciseId: string): Promise<TestRunner | null>

// Register a test runner manually
registerTest(category: string, exerciseId: string, testRunner: TestRunner): void

// Get registry statistics
getTestRegistryStats(): { totalCategories: number, totalExercises: number, ... }
```

### Test Utils Functions

```typescript
// Extract component code from compiled TypeScript
extractComponentCode(code: string, componentName: string): string

// Create standardized component test
createComponentTest(name: string, code: string, options: ComponentTestOptions): TestResult

// Create standardized hook test  
createHookTest(name: string, code: string, options: HookTestOptions): TestResult

// Generate test template for new exercise
generateTestTemplate(category: string, exerciseId: string, components: string[], hooks?: string[]): string
```

## Examples

### React Component Test

```typescript
tests.push(createComponentTest('UserForm', compiledCode, {
  requiredHooks: ['useState'],
  requiredElements: ['form', 'input', 'button'],
  customValidation: (code) => {
    return code.includes('onSubmit') && code.includes('validation');
  },
  errorMessage: 'UserForm needs form validation and submit handling'
}));
```

### Custom Hook Test

```typescript
tests.push(createHookTest('useFetch', compiledCode, {
  requiredHooks: ['useState', 'useEffect'],
  requiredReturns: ['data', 'loading', 'error'],
  shouldNotReturn: ['return null', 'loading: false'],
  customValidation: (code) => code.includes('fetch') || code.includes('axios')
}));
```

### Complex Custom Test

```typescript
// For cases where helpers aren't sufficient
const customSection = extractComponentCode(compiledCode, 'ComplexComponent');
tests.push({
  name: 'Complex component advanced validation',
  passed: (
    customSection.includes('advanced logic') &&
    customSection.match(/pattern/g)?.length >= 3 &&
    !customSection.includes('return null')
  ),
  error: !passed ? 'Complex component needs advanced implementation' : undefined,
  executionTime: 1
});
```

## Migration Guide

### From Legacy Tests

If you have existing tests in `tests.ts` format:

1. **Keep existing files** - they'll continue to work
2. **For new tests** - use `test.ts` format with helpers
3. **Gradual migration** - move tests when convenient, not required

### Integration Steps

1. Import test-index in your main.tsx (already done)
2. Use the test registry in your exercise runner (already done)
3. Create test files using the new format and helpers

## Troubleshooting

### Tests Not Loading

1. Check console for initialization messages
2. Verify test file exports `runTests` function
3. Use `debugTestRegistry()` to inspect loaded tests

### Performance Issues

1. Tests are pre-loaded at startup for performance
2. Check console for loading time and stats
3. Large test files may need optimization

### Test Failures

1. Use `extractComponentCode()` to debug code extraction
2. Add console.log in tests to inspect compiled code
3. Verify test expectations match compiled output format

## Future Enhancements

- [ ] Test result caching for faster re-runs
- [ ] Hot reloading of test files in development
- [ ] Test coverage reporting
- [ ] Parallel test execution
- [ ] Visual test result diff viewer