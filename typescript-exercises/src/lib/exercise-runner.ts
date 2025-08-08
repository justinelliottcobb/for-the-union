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
    const sourceFile = ts.createSourceFile(
      fileName,
      code,
      ts.ScriptTarget.ES2022,
      true
    );

    const host = ts.createCompilerHost(this.compilerOptions);
    const program = ts.createProgram([fileName], this.compilerOptions, {
      ...host,
      getSourceFile: (name) => name === fileName ? sourceFile : undefined,
    });

    const diagnostics = ts.getPreEmitDiagnostics(program);
    const errors: CompilationError[] = diagnostics.map(diagnostic => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      const sourceFile = diagnostic.file;
      const start = diagnostic.start;
      
      if (sourceFile && start !== undefined) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(start);
        return {
          message,
          line: line + 1,
          column: character + 1,
          file: sourceFile.fileName,
          code: diagnostic.code?.toString(),
        };
      }
      
      return { message, code: diagnostic.code?.toString() };
    });

    if (errors.length > 0) {
      return { compiledCode: '', errors };
    }

    // Emit JavaScript
    let compiledCode = '';
    const emitResult = program.emit(undefined, (fileName, data) => {
      compiledCode = data;
    });

    return { compiledCode, errors: [] };
  }

  private async runTests(exercise: Exercise, compiledCode: string): Promise<TestResult[]> {
    if (!exercise.testsPath) {
      return [];
    }

    try {
      // Load and run test files
      // This is a simplified version - in a real implementation, you'd want to:
      // 1. Load the test file
      // 2. Execute it in a sandboxed environment
      // 3. Capture test results
      
      const testResults: TestResult[] = [];
      
      // For now, return a placeholder test result
      testResults.push({
        name: 'Compilation test',
        passed: true,
        executionTime: 1,
      });

      return testResults;
    } catch (error) {
      return [{
        name: 'Test execution',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown test error',
        executionTime: 0,
      }];
    }
  }

  async loadExerciseCode(filePath: string): Promise<string> {
    try {
      const response = await fetch(filePath);
      return await response.text();
    } catch (error) {
      throw new Error(`Failed to load exercise file: ${error}`);
    }
  }
}