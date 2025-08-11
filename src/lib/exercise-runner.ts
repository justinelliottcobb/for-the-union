import * as ts from 'typescript';
import type { ExerciseResult, Exercise, TestResult, CompilationError } from '@/types';

export class ExerciseRunner {
  private compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    allowSyntheticDefaultImports: true,
    jsx: ts.JsxEmit.ReactJSX,
  };

  async runExercise(exercise: Exercise, code: string): Promise<ExerciseResult> {
    const startTime = performance.now();
    
    try {
      // Compile TypeScript to JavaScript
      const { compiledCode, errors } = this.compileTypeScript(code, exercise.filePath);
      
      if (errors.length > 0) {
        return {
          exercise,
          status: 'failed',
          tests: [],
          compilationErrors: errors,
          consoleOutput: [],
          totalExecutionTime: performance.now() - startTime,
        };
      }

      // Execute tests if they exist
      const tests = await this.runTests(exercise, compiledCode);
      const allTestsPassed = tests.every(test => test.passed);

      return {
        exercise,
        status: allTestsPassed ? 'completed' : 'failed',
        tests,
        compilationErrors: [],
        consoleOutput: [], // TODO: Capture console output
        totalExecutionTime: performance.now() - startTime,
      };
    } catch (error) {
      return {
        exercise,
        status: 'failed',
        tests: [],
        compilationErrors: [{ message: error instanceof Error ? error.message : 'Unknown error' }],
        consoleOutput: [],
        totalExecutionTime: performance.now() - startTime,
      };
    }
  }

  private compileTypeScript(code: string, fileName: string): { compiledCode: string; errors: CompilationError[] } {
    try {
      // Use TypeScript's transpile function instead of creating a full program
      const result = ts.transpile(code, this.compilerOptions, fileName);
      
      // For now, just do basic syntax checking
      const sourceFile = ts.createSourceFile(
        fileName,
        code,
        ts.ScriptTarget.ES2022,
        true
      );

      // Get syntax errors
      const syntaxErrors = sourceFile.parseDiagnostics;
      const errors: CompilationError[] = syntaxErrors.map(diagnostic => {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        const start = diagnostic.start;
        
        if (start !== undefined) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(start);
          return {
            message,
            line: line + 1,
            column: character + 1,
            file: fileName,
            code: diagnostic.code?.toString(),
          };
        }
        
        return { message, code: diagnostic.code?.toString() };
      });

      if (errors.length > 0) {
        return { compiledCode: '', errors };
      }

      return { compiledCode: result, errors: [] };
    } catch (error) {
      return {
        compiledCode: '',
        errors: [{
          message: error instanceof Error ? error.message : 'TypeScript compilation failed',
        }]
      };
    }
  }

  private async runTests(exercise: Exercise, compiledCode: string): Promise<TestResult[]> {
    if (!exercise.testsPath) {
      // If no tests are defined, return basic implementation checks
      return this.runBasicImplementationTests(exercise, compiledCode);
    }

    try {
      // TODO: Load and run actual test files when they exist
      // For now, fall back to basic implementation checks
      return this.runBasicImplementationTests(exercise, compiledCode);
    } catch (error) {
      return [{
        name: 'Test execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown test error',
        executionTime: 0,
      }];
    }
  }

  private runBasicImplementationTests(exercise: Exercise, compiledCode: string): TestResult[] {
    const tests: TestResult[] = [];
    
    // Check if code compiles (we already know it does at this point)
    tests.push({
      name: 'TypeScript compilation',
      passed: true,
      executionTime: 1,
    });

    // Basic implementation checks based on exercise ID
    if (exercise.id === '01-usestate-fundamentals') {
      // Check Counter component specifically
      const counterSection = this.extractComponentCode(compiledCode, 'Counter');
      
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
      const userFormSection = this.extractComponentCode(compiledCode, 'UserForm');
      tests.push({
        name: 'UserForm component implementation',
        passed: (userFormSection.includes('_jsx') || userFormSection.includes('<')) && 
                !userFormSection.includes('return null'),
        error: (userFormSection.includes('_jsx') || userFormSection.includes('<')) && 
               !userFormSection.includes('return null')
          ? undefined 
          : 'UserForm component needs JSX implementation (not return null)',
        executionTime: 1,
      });

      // Check TodoList component specifically  
      const todoListSection = this.extractComponentCode(compiledCode, 'TodoList');
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
      const stateAnalyzerSection = this.extractComponentCode(compiledCode, 'StateAnalyzer');
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
    }

    return tests;
  }

  private extractComponentCode(code: string, componentName: string): string {
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

  async loadExerciseCode(filePath: string): Promise<string> {
    try {
      // Convert file path and add ?raw parameter for Vite to serve raw content
      let url = filePath;
      if (filePath.startsWith('./exercise-files/')) {
        url = filePath.replace('./', '/') + '?raw';
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      let content = await response.text();
      
      // Handle Vite's ?raw parameter response which exports the content as a string
      if (content.startsWith('export default "')) {
        try {
          // Find where the string content actually ends
          const stringStart = content.indexOf('export default "') + 'export default "'.length;
          const stringEnd = content.lastIndexOf('";');
          
          if (stringStart < stringEnd) {
            const rawContent = content.substring(stringStart, stringEnd);
            // Decode the escaped string content
            content = rawContent
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
          }
        } catch (parseError) {
          console.warn('Could not parse raw file content');
          throw new Error('Could not parse exercise file content');
        }
      }
      
      return content;
    } catch (error) {
      throw new Error(`Failed to load exercise file: ${error}`);
    }
  }
}