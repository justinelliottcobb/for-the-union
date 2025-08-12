// Utility functions for working with the test system

import type { TestResult } from '@/types';
import { getTestRegistryStats, getRegisteredCategories, getRegisteredExercises } from './test-registry';

// Standard helper function for extracting component/function code from compiled TypeScript
export function extractComponentCode(code: string, componentName: string): string {
  // Try class pattern first (for classes like LRUCache)
  if (componentName.includes('Cache') || componentName.includes('Class')) {
    const classPattern = new RegExp(`class ${componentName}[\\s\\S]*?{([\\s\\S]*?)}\\s*(?=class|function|export|$)`, 'i');
    const match = code.match(classPattern);
    if (match) return match[1];
  }
  
  // Standard function pattern
  let functionPattern = new RegExp(`function ${componentName}\\(.*?\\)\\s*{([\\s\\S]*?)}(?=\\s*(?:function|export|class|$))`, 'i');
  let match = code.match(functionPattern);
  
  if (!match) {
    // Try a more flexible pattern that looks for the function and captures everything until the next function or end
    const startPattern = new RegExp(`function ${componentName}\\(.*?\\)\\s*{`, 'i');
    const startMatch = code.match(startPattern);
    
    if (startMatch) {
      const startIndex = code.indexOf(startMatch[0]) + startMatch[0].length;
      let braceCount = 1;
      let endIndex = startIndex;
      
      // Find the matching closing brace
      for (let i = startIndex; i < code.length && braceCount > 0; i++) {
        if (code[i] === '{') braceCount++;
        if (code[i] === '}') braceCount--;
        endIndex = i;
      }
      
      if (braceCount === 0) {
        return code.substring(startIndex, endIndex);
      }
    }
  }
  
  return match ? match[1] : '';
}

// Create a standard test for React component implementation
export function createComponentTest(
  componentName: string,
  compiledCode: string,
  options: {
    requiredHooks?: string[];
    requiredElements?: string[];
    customValidation?: (code: string) => boolean;
    errorMessage?: string;
  } = {}
): TestResult {
  const {
    requiredHooks = [],
    requiredElements = [],
    customValidation,
    errorMessage
  } = options;
  
  const componentSection = extractComponentCode(compiledCode, componentName);
  
  // Check basic JSX implementation
  const hasJSX = componentSection.includes('_jsx') || componentSection.includes('<');
  const notReturningNull = !componentSection.includes('return null');
  
  // Check required hooks
  const hasRequiredHooks = requiredHooks.every(hook => componentSection.includes(hook));
  
  // Check required elements
  const hasRequiredElements = requiredElements.every(element => 
    componentSection.includes(element) || componentSection.toLowerCase().includes(element.toLowerCase())
  );
  
  // Run custom validation if provided
  const passesCustomValidation = customValidation ? customValidation(componentSection) : true;
  
  const passed = hasJSX && notReturningNull && hasRequiredHooks && hasRequiredElements && passesCustomValidation;
  
  let error: string | undefined;
  if (!passed) {
    if (errorMessage) {
      error = errorMessage;
    } else {
      const missing = [];
      if (!hasJSX) missing.push('JSX implementation');
      if (!notReturningNull) missing.push('should not return null');
      if (!hasRequiredHooks) missing.push(`hooks: ${requiredHooks.join(', ')}`);
      if (!hasRequiredElements) missing.push(`elements: ${requiredElements.join(', ')}`);
      if (!passesCustomValidation) missing.push('custom validation');
      
      error = `${componentName} component needs ${missing.join(', ')}`;
    }
  }
  
  return {
    name: `${componentName} component implementation`,
    passed,
    error,
    executionTime: 1,
  };
}

// Create a standard test for custom hook implementation
export function createHookTest(
  hookName: string,
  compiledCode: string,
  options: {
    requiredHooks?: string[];
    requiredReturns?: string[];
    shouldNotReturn?: string[];
    customValidation?: (code: string) => boolean;
    errorMessage?: string;
  } = {}
): TestResult {
  const {
    requiredHooks = [],
    requiredReturns = [],
    shouldNotReturn = [],
    customValidation,
    errorMessage
  } = options;
  
  const hookSection = extractComponentCode(compiledCode, hookName);
  
  // Check required hooks
  const hasRequiredHooks = requiredHooks.every(hook => hookSection.includes(hook));
  
  // Check required returns
  const hasRequiredReturns = requiredReturns.every(returnVal => hookSection.includes(returnVal));
  
  // Check that it doesn't return default/stub values
  const doesntReturnStubs = shouldNotReturn.every(stubVal => !hookSection.includes(stubVal));
  
  // Run custom validation if provided
  const passesCustomValidation = customValidation ? customValidation(hookSection) : true;
  
  const passed = hasRequiredHooks && hasRequiredReturns && doesntReturnStubs && passesCustomValidation;
  
  let error: string | undefined;
  if (!passed) {
    if (errorMessage) {
      error = errorMessage;
    } else {
      const missing = [];
      if (!hasRequiredHooks) missing.push(`hooks: ${requiredHooks.join(', ')}`);
      if (!hasRequiredReturns) missing.push(`returns: ${requiredReturns.join(', ')}`);
      if (!doesntReturnStubs) missing.push('proper implementation (not stub values)');
      if (!passesCustomValidation) missing.push('custom validation');
      
      error = `${hookName} hook needs ${missing.join(', ')}`;
    }
  }
  
  return {
    name: `${hookName} custom hook implementation`,
    passed,
    error,
    executionTime: 1,
  };
}

// Generate a test file template for a new exercise
export function generateTestTemplate(
  category: string,
  exerciseId: string,
  components: string[],
  hooks: string[] = []
): string {
  const testCases = [
    ...hooks.map(hook => `  // Check ${hook} custom hook
  const ${hook.toLowerCase()}Section = extractComponentCode(compiledCode, '${hook}');
  tests.push(createHookTest('${hook}', compiledCode, {
    requiredHooks: ['useState'], // Add required hooks
    requiredReturns: [], // Add required return values
    shouldNotReturn: [], // Add stub return values to avoid
    // customValidation: (code) => code.includes('customLogic'),
    // errorMessage: 'Custom error message'
  }));`),
    
    ...components.map(component => `  // Check ${component} component
  tests.push(createComponentTest('${component}', compiledCode, {
    requiredHooks: [], // Add required hooks like 'useState', 'useEffect'
    requiredElements: [], // Add required elements like 'button', 'input'
    // customValidation: (code) => code.includes('customLogic'),
    // errorMessage: 'Custom error message'
  }));`)
  ];

  return `import type { TestResult } from '@/types';
import { extractComponentCode, createComponentTest, createHookTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

${testCases.join('\n\n')}

  return tests;
}`;
}

// Debug function to inspect the test registry
export function debugTestRegistry(): void {
  const stats = getTestRegistryStats();
  console.group('🔍 Test Registry Debug Info');
  console.log('Total categories:', stats.totalCategories);
  console.log('Total exercises:', stats.totalExercises);
  
  console.group('Categories:');
  getRegisteredCategories().forEach(category => {
    const exercises = getRegisteredExercises(category);
    console.log(`${category} (${exercises.length} exercises):`, exercises);
  });
  console.groupEnd();
  
  console.groupEnd();
}