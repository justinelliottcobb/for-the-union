import type { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Helper function to extract component code
  function extractComponentCode(code: string, componentName: string): string {
    // First try the standard function pattern
    let functionPattern = new RegExp(`function ${componentName}\\(.*?\\)\\s*{([\\s\\S]*?)}(?=\\s*(?:function|export|$))`, 'i');
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

  // Check Counter component specifically
  const counterSection = extractComponentCode(compiledCode, 'Counter');
  tests.push({
    name: 'Counter component implementation',
    passed: (counterSection.includes('_jsx') || counterSection.includes('<')) && 
            (counterSection.includes('onClick') || counterSection.includes('click')) && 
            !counterSection.includes('return null'),
    error: (counterSection.includes('_jsx') || counterSection.includes('<')) && 
           (counterSection.includes('onClick') || counterSection.includes('click')) && 
           !counterSection.includes('return null')
      ? undefined 
      : 'Counter component needs JSX with click handlers (not return null)',
    executionTime: 1,
  });

  // Check UserForm component specifically
  const userFormSection = extractComponentCode(compiledCode, 'UserForm');
  
  tests.push({
    name: 'UserForm component implementation',
    passed: (userFormSection.includes('_jsx') || userFormSection.includes('<')) && 
            (userFormSection.includes('form') || userFormSection.includes('input')) &&
            !userFormSection.includes('return null'),
    error: (userFormSection.includes('_jsx') || userFormSection.includes('<')) && 
           (userFormSection.includes('form') || userFormSection.includes('input')) &&
           !userFormSection.includes('return null')
      ? undefined 
      : 'UserForm component needs form JSX with inputs (not return null)',
    executionTime: 1,
  });

  // Check TodoList component specifically  
  const todoListSection = extractComponentCode(compiledCode, 'TodoList');
  tests.push({
    name: 'TodoList component implementation',
    passed: (todoListSection.includes('_jsx') || todoListSection.includes('<')) && 
            !todoListSection.includes('return null'),
    error: (todoListSection.includes('_jsx') || todoListSection.includes('<')) && 
           !todoListSection.includes('return null')
      ? undefined 
      : 'TodoList component needs JSX implementation (not return null)',
    executionTime: 1,
  });

  // Check StateAnalyzer component specifically
  const stateAnalyzerSection = extractComponentCode(compiledCode, 'StateAnalyzer');
  tests.push({
    name: 'StateAnalyzer component implementation',
    passed: (stateAnalyzerSection.includes('_jsx') || stateAnalyzerSection.includes('<')) && 
            !stateAnalyzerSection.includes('return null'),
    error: (stateAnalyzerSection.includes('_jsx') || stateAnalyzerSection.includes('<')) && 
           !stateAnalyzerSection.includes('return null')
      ? undefined 
      : 'StateAnalyzer component needs JSX implementation (not return null)',
    executionTime: 1,
  });

  return tests;
}