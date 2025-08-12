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

  // Check ThemeProvider component
  const themeProviderSection = extractComponentCode(compiledCode, 'ThemeProvider');
  tests.push({
    name: 'ThemeProvider component implementation',
    passed: (themeProviderSection.includes('_jsx') || themeProviderSection.includes('<')) && 
            themeProviderSection.includes('useState') &&
            themeProviderSection.includes('ThemeContext') &&
            themeProviderSection.includes('Provider') &&
            !themeProviderSection.includes('return null'),
    error: (themeProviderSection.includes('_jsx') || themeProviderSection.includes('<')) && 
           themeProviderSection.includes('useState') &&
           themeProviderSection.includes('ThemeContext') &&
           themeProviderSection.includes('Provider') &&
           !themeProviderSection.includes('return null')
      ? undefined 
      : 'ThemeProvider needs JSX with useState, ThemeContext.Provider (not return null)',
    executionTime: 1,
  });

  // Check UserProvider component
  const userProviderSection = extractComponentCode(compiledCode, 'UserProvider');
  tests.push({
    name: 'UserProvider component implementation',
    passed: (userProviderSection.includes('_jsx') || userProviderSection.includes('<')) && 
            userProviderSection.includes('useState') &&
            userProviderSection.includes('UserContext') &&
            userProviderSection.includes('Provider') &&
            !userProviderSection.includes('return null'),
    error: (userProviderSection.includes('_jsx') || userProviderSection.includes('<')) && 
           userProviderSection.includes('useState') &&
           userProviderSection.includes('UserContext') &&
           userProviderSection.includes('Provider') &&
           !userProviderSection.includes('return null')
      ? undefined 
      : 'UserProvider needs JSX with useState, UserContext.Provider (not return null)',
    executionTime: 1,
  });

  // Check useTheme custom hook
  const useThemeSection = extractComponentCode(compiledCode, 'useTheme');
  tests.push({
    name: 'useTheme custom hook implementation',
    passed: useThemeSection.includes('useContext') &&
            useThemeSection.includes('ThemeContext') &&
            (useThemeSection.includes('throw') || useThemeSection.includes('error')),
    error: useThemeSection.includes('useContext') &&
           useThemeSection.includes('ThemeContext') &&
           (useThemeSection.includes('throw') || useThemeSection.includes('error'))
      ? undefined 
      : 'useTheme hook needs useContext, ThemeContext, and error handling',
    executionTime: 1,
  });

  // Check useUser custom hook
  const useUserSection = extractComponentCode(compiledCode, 'useUser');
  tests.push({
    name: 'useUser custom hook implementation',
    passed: useUserSection.includes('useContext') &&
            useUserSection.includes('UserContext') &&
            (useUserSection.includes('throw') || useUserSection.includes('error')),
    error: useUserSection.includes('useContext') &&
           useUserSection.includes('UserContext') &&
           (useUserSection.includes('throw') || useUserSection.includes('error'))
      ? undefined 
      : 'useUser hook needs useContext, UserContext, and error handling',
    executionTime: 1,
  });

  // Check Header component
  const headerSection = extractComponentCode(compiledCode, 'Header');
  tests.push({
    name: 'Header component implementation',
    passed: (headerSection.includes('_jsx') || headerSection.includes('<')) && 
            headerSection.includes('useTheme') &&
            headerSection.includes('useUser') &&
            !headerSection.includes('return null'),
    error: (headerSection.includes('_jsx') || headerSection.includes('<')) && 
           headerSection.includes('useTheme') &&
           headerSection.includes('useUser') &&
           !headerSection.includes('return null')
      ? undefined 
      : 'Header component needs JSX with useTheme and useUser hooks (not return null)',
    executionTime: 1,
  });

  // Check UserProfile component
  const userProfileSection = extractComponentCode(compiledCode, 'UserProfile');
  tests.push({
    name: 'UserProfile component implementation',
    passed: (userProfileSection.includes('_jsx') || userProfileSection.includes('<')) && 
            userProfileSection.includes('useUser') &&
            !userProfileSection.includes('return null'),
    error: (userProfileSection.includes('_jsx') || userProfileSection.includes('<')) && 
           userProfileSection.includes('useUser') &&
           !userProfileSection.includes('return null')
      ? undefined 
      : 'UserProfile component needs JSX with useUser hook (not return null)',
    executionTime: 1,
  });

  // Check ThemeDemo component
  const themeDemoSection = extractComponentCode(compiledCode, 'ThemeDemo');
  tests.push({
    name: 'ThemeDemo component implementation',
    passed: (themeDemoSection.includes('_jsx') || themeDemoSection.includes('<')) && 
            themeDemoSection.includes('useTheme') &&
            !themeDemoSection.includes('return null'),
    error: (themeDemoSection.includes('_jsx') || themeDemoSection.includes('<')) && 
           themeDemoSection.includes('useTheme') &&
           !themeDemoSection.includes('return null')
      ? undefined 
      : 'ThemeDemo component needs JSX with useTheme hook (not return null)',
    executionTime: 1,
  });

  // Check LoginForm component
  const loginFormSection = extractComponentCode(compiledCode, 'LoginForm');
  tests.push({
    name: 'LoginForm component implementation',
    passed: (loginFormSection.includes('_jsx') || loginFormSection.includes('<')) && 
            loginFormSection.includes('useUser') &&
            loginFormSection.includes('useState') &&
            (loginFormSection.includes('form') || loginFormSection.includes('input')) &&
            !loginFormSection.includes('return null'),
    error: (loginFormSection.includes('_jsx') || loginFormSection.includes('<')) && 
           loginFormSection.includes('useUser') &&
           loginFormSection.includes('useState') &&
           (loginFormSection.includes('form') || loginFormSection.includes('input')) &&
           !loginFormSection.includes('return null')
      ? undefined 
      : 'LoginForm component needs JSX with useUser, useState, and form elements (not return null)',
    executionTime: 1,
  });

  // Check NestedComponent component
  const nestedComponentSection = extractComponentCode(compiledCode, 'NestedComponent');
  tests.push({
    name: 'NestedComponent component implementation',
    passed: (nestedComponentSection.includes('_jsx') || nestedComponentSection.includes('<')) && 
            nestedComponentSection.includes('useTheme') &&
            nestedComponentSection.includes('useUser') &&
            !nestedComponentSection.includes('return null'),
    error: (nestedComponentSection.includes('_jsx') || nestedComponentSection.includes('<')) && 
           nestedComponentSection.includes('useTheme') &&
           nestedComponentSection.includes('useUser') &&
           !nestedComponentSection.includes('return null')
      ? undefined 
      : 'NestedComponent needs JSX with both useTheme and useUser hooks (not return null)',
    executionTime: 1,
  });

  // Check App component
  const appSection = extractComponentCode(compiledCode, 'App');
  tests.push({
    name: 'App component implementation',
    passed: (appSection.includes('_jsx') || appSection.includes('<')) && 
            appSection.includes('ThemeProvider') &&
            appSection.includes('UserProvider') &&
            !appSection.includes('return null'),
    error: (appSection.includes('_jsx') || appSection.includes('<')) && 
           appSection.includes('ThemeProvider') &&
           appSection.includes('UserProvider') &&
           !appSection.includes('return null')
      ? undefined 
      : 'App component needs JSX with ThemeProvider and UserProvider (not return null)',
    executionTime: 1,
  });

  return tests;
}