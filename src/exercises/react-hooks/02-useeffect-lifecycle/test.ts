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

  // Check DataFetcher component
  const dataFetcherSection = extractComponentCode(compiledCode, 'DataFetcher');
  tests.push({
    name: 'DataFetcher component implementation',
    passed: (dataFetcherSection.includes('_jsx') || dataFetcherSection.includes('<')) && 
            dataFetcherSection.includes('useEffect') &&
            dataFetcherSection.includes('useState') &&
            (dataFetcherSection.includes('loading') || dataFetcherSection.includes('Loading')) &&
            !dataFetcherSection.includes('return null'),
    error: (dataFetcherSection.includes('_jsx') || dataFetcherSection.includes('<')) && 
           dataFetcherSection.includes('useEffect') &&
           dataFetcherSection.includes('useState') &&
           (dataFetcherSection.includes('loading') || dataFetcherSection.includes('Loading')) &&
           !dataFetcherSection.includes('return null')
      ? undefined 
      : 'DataFetcher component needs JSX with useEffect, useState, and loading state (not return null)',
    executionTime: 1,
  });

  // Check Timer component
  const timerSection = extractComponentCode(compiledCode, 'Timer');
  tests.push({
    name: 'Timer component implementation',
    passed: (timerSection.includes('_jsx') || timerSection.includes('<')) && 
            timerSection.includes('useEffect') &&
            timerSection.includes('useState') &&
            (timerSection.includes('setInterval') || timerSection.includes('interval')) &&
            !timerSection.includes('return null'),
    error: (timerSection.includes('_jsx') || timerSection.includes('<')) && 
           timerSection.includes('useEffect') &&
           timerSection.includes('useState') &&
           (timerSection.includes('setInterval') || timerSection.includes('interval')) &&
           !timerSection.includes('return null')
      ? undefined 
      : 'Timer component needs JSX with useEffect, useState, and setInterval (not return null)',
    executionTime: 1,
  });

  // Check WindowSizeTracker component
  const windowSizeTrackerSection = extractComponentCode(compiledCode, 'WindowSizeTracker');
  tests.push({
    name: 'WindowSizeTracker component implementation',
    passed: (windowSizeTrackerSection.includes('_jsx') || windowSizeTrackerSection.includes('<')) && 
            windowSizeTrackerSection.includes('useEffect') &&
            windowSizeTrackerSection.includes('useState') &&
            (windowSizeTrackerSection.includes('addEventListener') || windowSizeTrackerSection.includes('resize')) &&
            !windowSizeTrackerSection.includes('return null'),
    error: (windowSizeTrackerSection.includes('_jsx') || windowSizeTrackerSection.includes('<')) && 
           windowSizeTrackerSection.includes('useEffect') &&
           windowSizeTrackerSection.includes('useState') &&
           (windowSizeTrackerSection.includes('addEventListener') || windowSizeTrackerSection.includes('resize')) &&
           !windowSizeTrackerSection.includes('return null')
      ? undefined 
      : 'WindowSizeTracker component needs JSX with useEffect, useState, and resize event listener (not return null)',
    executionTime: 1,
  });

  // Check SearchComponent component
  const searchComponentSection = extractComponentCode(compiledCode, 'SearchComponent');
  tests.push({
    name: 'SearchComponent component implementation',
    passed: (searchComponentSection.includes('_jsx') || searchComponentSection.includes('<')) && 
            searchComponentSection.includes('useEffect') &&
            searchComponentSection.includes('useState') &&
            (searchComponentSection.includes('setTimeout') || searchComponentSection.includes('debounce')) &&
            searchComponentSection.includes('input') &&
            !searchComponentSection.includes('return null'),
    error: (searchComponentSection.includes('_jsx') || searchComponentSection.includes('<')) && 
           searchComponentSection.includes('useEffect') &&
           searchComponentSection.includes('useState') &&
           (searchComponentSection.includes('setTimeout') || searchComponentSection.includes('debounce')) &&
           searchComponentSection.includes('input') &&
           !searchComponentSection.includes('return null')
      ? undefined 
      : 'SearchComponent needs JSX with useEffect, useState, setTimeout for debouncing, and input field (not return null)',
    executionTime: 1,
  });

  // Check MultiEffectComponent component
  const multiEffectComponentSection = extractComponentCode(compiledCode, 'MultiEffectComponent');
  tests.push({
    name: 'MultiEffectComponent component implementation',
    passed: (multiEffectComponentSection.includes('_jsx') || multiEffectComponentSection.includes('<')) && 
            multiEffectComponentSection.includes('useEffect') &&
            multiEffectComponentSection.includes('useState') &&
            // Check for multiple useEffect calls (at least 2)
            (multiEffectComponentSection.match(/useEffect/g) || []).length >= 2 &&
            !multiEffectComponentSection.includes('return null'),
    error: (multiEffectComponentSection.includes('_jsx') || multiEffectComponentSection.includes('<')) && 
           multiEffectComponentSection.includes('useEffect') &&
           multiEffectComponentSection.includes('useState') &&
           (multiEffectComponentSection.match(/useEffect/g) || []).length >= 2 &&
           !multiEffectComponentSection.includes('return null')
      ? undefined 
      : 'MultiEffectComponent needs JSX with multiple useEffect calls and useState (not return null)',
    executionTime: 1,
  });

  // Check ConditionalEffect component
  const conditionalEffectSection = extractComponentCode(compiledCode, 'ConditionalEffect');
  tests.push({
    name: 'ConditionalEffect component implementation',
    passed: (conditionalEffectSection.includes('_jsx') || conditionalEffectSection.includes('<')) && 
            conditionalEffectSection.includes('useEffect') &&
            conditionalEffectSection.includes('useState') &&
            (conditionalEffectSection.includes('isEven') || conditionalEffectSection.includes('even')) &&
            !conditionalEffectSection.includes('return null'),
    error: (conditionalEffectSection.includes('_jsx') || conditionalEffectSection.includes('<')) && 
           conditionalEffectSection.includes('useEffect') &&
           conditionalEffectSection.includes('useState') &&
           (conditionalEffectSection.includes('isEven') || conditionalEffectSection.includes('even')) &&
           !conditionalEffectSection.includes('return null')
      ? undefined 
      : 'ConditionalEffect component needs JSX with useEffect, useState, and even number logic (not return null)',
    executionTime: 1,
  });

  return tests;
}