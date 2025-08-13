import type { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Helper function to extract component/function code
  function extractCode(code: string, name: string): string {
    // Try function pattern first
    let pattern = new RegExp(`function ${name}\\(.*?\\)\\s*{([\\s\\S]*?)}(?=\\s*(?:function|export|const|$))`, 'i');
    let match = code.match(pattern);
    
    if (!match) {
      // Try const/arrow function pattern
      pattern = new RegExp(`const ${name}\\s*=.*?{([\\s\\S]*?)}(?=\\s*(?:function|export|const|$))`, 'i');
      match = code.match(pattern);
    }
    
    if (!match) {
      // Try more flexible pattern
      const startPattern = new RegExp(`(?:function|const)\\s+${name}[\\s\\S]*?{`, 'i');
      const startMatch = code.match(startPattern);
      
      if (startMatch) {
        const startIndex = code.indexOf(startMatch[0]) + startMatch[0].length;
        let braceCount = 1;
        let endIndex = startIndex;
        
        for (let i = startIndex; i < code.length && braceCount > 0; i++) {
          if (code[i] === '{') braceCount++;
          if (code[i] === '}') braceCount--;
          endIndex = i;
        }
        
        return code.substring(startIndex, endIndex);
      }
    }
    
    return match ? match[1] : '';
  }

  // Test 1: Design Token System
  tests.push({
    name: 'Design token system is properly defined',
    passed: compiledCode.includes('interface DesignTokens') &&
            compiledCode.includes('defaultTokens') &&
            compiledCode.includes('colors:') &&
            compiledCode.includes('typography:') &&
            compiledCode.includes('spacing:') &&
            compiledCode.includes('shadows:'),
    error: !compiledCode.includes('interface DesignTokens')
      ? 'DesignTokens interface should be defined'
      : !compiledCode.includes('defaultTokens')
      ? 'defaultTokens should be defined with token values'
      : !compiledCode.includes('colors:')
      ? 'Design tokens should include colors'
      : !compiledCode.includes('typography:')
      ? 'Design tokens should include typography'
      : !compiledCode.includes('spacing:')
      ? 'Design tokens should include spacing'
      : 'Design tokens should include shadows and other categories',
    executionTime: 1,
  });

  // Test 2: Token Merging Implementation
  const mergeTokensCode = extractCode(compiledCode, 'mergeTokens');
  tests.push({
    name: 'mergeTokens implements deep token merging',
    passed: mergeTokensCode.includes('Object.keys') &&
            mergeTokensCode.includes('typeof') &&
            mergeTokensCode.includes('object') &&
            !mergeTokensCode.includes('TODO') &&
            mergeTokensCode.length > 100,
    error: !mergeTokensCode.includes('Object.keys')
      ? 'mergeTokens should iterate through override keys'
      : !mergeTokensCode.includes('typeof')
      ? 'mergeTokens should check type for deep merging'
      : !mergeTokensCode.includes('object')
      ? 'mergeTokens should handle nested objects'
      : mergeTokensCode.includes('TODO')
      ? 'mergeTokens still contains TODO comments'
      : 'mergeTokens needs proper deep merging implementation',
    executionTime: 1,
  });

  // Test 3: Dark Mode Token Transformation
  const applyDarkModeCode = extractCode(compiledCode, 'applyDarkModeTokens');
  tests.push({
    name: 'applyDarkModeTokens transforms semantic colors for dark mode',
    passed: applyDarkModeCode.includes('darkTokens') &&
            applyDarkModeCode.includes('semantic') &&
            applyDarkModeCode.includes('background') &&
            applyDarkModeCode.includes('#0f172a') &&
            !applyDarkModeCode.includes('TODO') &&
            applyDarkModeCode.length > 50,
    error: !applyDarkModeCode.includes('darkTokens')
      ? 'applyDarkModeTokens should create darkTokens copy'
      : !applyDarkModeCode.includes('semantic')
      ? 'applyDarkModeTokens should transform semantic colors'
      : !applyDarkModeCode.includes('background')
      ? 'applyDarkModeTokens should update background color'
      : !applyDarkModeCode.includes('#0f172a')
      ? 'applyDarkModeTokens should use proper dark background color'
      : applyDarkModeCode.includes('TODO')
      ? 'applyDarkModeTokens still contains TODO comments'
      : 'applyDarkModeTokens needs proper implementation',
    executionTime: 1,
  });

  // Test 4: CSS Variables Generation
  const createCSSVariablesCode = extractCode(compiledCode, 'createCSSVariables');
  tests.push({
    name: 'createCSSVariables generates CSS custom properties from tokens',
    passed: createCSSVariablesCode.includes('variables') &&
            createCSSVariablesCode.includes('Object.entries') &&
            createCSSVariablesCode.includes('--color-') &&
            createCSSVariablesCode.includes('--font-size-') &&
            createCSSVariablesCode.includes('--spacing-') &&
            !createCSSVariablesCode.includes('TODO') &&
            createCSSVariablesCode.length > 100,
    error: !createCSSVariablesCode.includes('variables')
      ? 'createCSSVariables should create variables object'
      : !createCSSVariablesCode.includes('Object.entries')
      ? 'createCSSVariables should iterate through token categories'
      : !createCSSVariablesCode.includes('--color-')
      ? 'createCSSVariables should create CSS custom properties for colors'
      : !createCSSVariablesCode.includes('--font-size-')
      ? 'createCSSVariables should create CSS custom properties for typography'
      : !createCSSVariablesCode.includes('--spacing-')
      ? 'createCSSVariables should create CSS custom properties for spacing'
      : createCSSVariablesCode.includes('TODO')
      ? 'createCSSVariables still contains TODO comments'
      : 'createCSSVariables needs proper implementation',
    executionTime: 1,
  });

  // Test 5: Theme Provider Implementation
  const themeProviderCode = extractCode(compiledCode, 'ThemeProvider');
  tests.push({
    name: 'ThemeProvider implements comprehensive theme management',
    passed: themeProviderCode.includes('useState') &&
            themeProviderCode.includes('useCallback') &&
            themeProviderCode.includes('useMemo') &&
            themeProviderCode.includes('localStorage') &&
            themeProviderCode.includes('resolvedTokens') &&
            !themeProviderCode.includes('TODO') &&
            themeProviderCode.length > 300,
    error: !themeProviderCode.includes('useState')
      ? 'ThemeProvider should use useState for mode and custom tokens'
      : !themeProviderCode.includes('useCallback')
      ? 'ThemeProvider should use useCallback for setMode'
      : !themeProviderCode.includes('useMemo')
      ? 'ThemeProvider should use useMemo for resolved tokens'
      : !themeProviderCode.includes('localStorage')
      ? 'ThemeProvider should persist theme to localStorage'
      : !themeProviderCode.includes('resolvedTokens')
      ? 'ThemeProvider should compute resolvedTokens'
      : themeProviderCode.includes('TODO')
      ? 'ThemeProvider still contains TODO comments'
      : 'ThemeProvider needs comprehensive implementation',
    executionTime: 1,
  });

  // Test 6: useTheme Hook Implementation
  const useThemeCode = extractCode(compiledCode, 'useTheme');
  tests.push({
    name: 'useTheme hook validates context and provides theme access',
    passed: useThemeCode.includes('useContext') &&
            useThemeCode.includes('ThemeContext') &&
            useThemeCode.includes('throw new Error') &&
            useThemeCode.includes('ThemeProvider') &&
            !useThemeCode.includes('TODO') &&
            useThemeCode.length > 50,
    error: !useThemeCode.includes('useContext')
      ? 'useTheme should use useContext hook'
      : !useThemeCode.includes('ThemeContext')
      ? 'useTheme should access ThemeContext'
      : !useThemeCode.includes('throw new Error')
      ? 'useTheme should throw error when used outside provider'
      : !useThemeCode.includes('ThemeProvider')
      ? 'useTheme error message should mention ThemeProvider'
      : useThemeCode.includes('TODO')
      ? 'useTheme still contains TODO comments'
      : 'useTheme needs proper implementation',
    executionTime: 1,
  });

  // Test 7: Variant System Implementation
  const createVariantsCode = extractCode(compiledCode, 'createVariants');
  tests.push({
    name: 'createVariants implements sophisticated variant resolution',
    passed: createVariantsCode.includes('function resolveVariants') &&
            createVariantsCode.includes('classes') &&
            createVariantsCode.includes('Object.entries') &&
            createVariantsCode.includes('compoundVariants') &&
            createVariantsCode.includes('responsive') &&
            !createVariantsCode.includes('TODO') &&
            createVariantsCode.length > 200,
    error: !createVariantsCode.includes('function resolveVariants')
      ? 'createVariants should return resolveVariants function'
      : !createVariantsCode.includes('classes')
      ? 'createVariants should collect classes array'
      : !createVariantsCode.includes('Object.entries')
      ? 'createVariants should iterate through variant entries'
      : !createVariantsCode.includes('compoundVariants')
      ? 'createVariants should handle compound variants'
      : !createVariantsCode.includes('responsive')
      ? 'createVariants should handle responsive variants'
      : createVariantsCode.includes('TODO')
      ? 'createVariants still contains TODO comments'
      : 'createVariants needs comprehensive implementation',
    executionTime: 1,
  });

  // Test 8: Extensible Component Factory
  const createExtensibleComponentCode = extractCode(compiledCode, 'createExtensibleComponent');
  tests.push({
    name: 'createExtensibleComponent implements component factory with variants',
    passed: createExtensibleComponentCode.includes('forwardRef') &&
            createExtensibleComponentCode.includes('useTheme') &&
            createExtensibleComponentCode.includes('useMemo') &&
            createExtensibleComponentCode.includes('createVariants') &&
            createExtensibleComponentCode.includes('displayName') &&
            !createExtensibleComponentCode.includes('TODO') &&
            createExtensibleComponentCode.length > 200,
    error: !createExtensibleComponentCode.includes('forwardRef')
      ? 'createExtensibleComponent should use forwardRef for ref forwarding'
      : !createExtensibleComponentCode.includes('useTheme')
      ? 'createExtensibleComponent should access theme context'
      : !createExtensibleComponentCode.includes('useMemo')
      ? 'createExtensibleComponent should memoize variant resolution'
      : !createExtensibleComponentCode.includes('createVariants')
      ? 'createExtensibleComponent should use createVariants for class generation'
      : !createExtensibleComponentCode.includes('displayName')
      ? 'createExtensibleComponent should set component displayName'
      : createExtensibleComponentCode.includes('TODO')
      ? 'createExtensibleComponent still contains TODO comments'
      : 'createExtensibleComponent needs proper factory implementation',
    executionTime: 1,
  });

  // Test 9: Button Component Implementation
  tests.push({
    name: 'Button component is created with proper variant configuration',
    passed: compiledCode.includes('buttonVariants') &&
            compiledCode.includes('const Button = createExtensibleComponent') &&
            compiledCode.includes('\'Button\'') &&
            compiledCode.includes('\'button\'') &&
            compiledCode.includes('size:') &&
            compiledCode.includes('variant:') &&
            compiledCode.includes('color:'),
    error: !compiledCode.includes('buttonVariants')
      ? 'buttonVariants configuration should be defined'
      : !compiledCode.includes('const Button = createExtensibleComponent')
      ? 'Button should be created using createExtensibleComponent'
      : !compiledCode.includes('size:')
      ? 'buttonVariants should include size variants'
      : !compiledCode.includes('variant:')
      ? 'buttonVariants should include style variants'
      : 'Button component needs proper variant configuration',
    executionTime: 1,
  });

  // Test 10: Card Component Implementation
  const cardCode = extractCode(compiledCode, 'Card');
  tests.push({
    name: 'Card component implements compound component pattern with theme integration',
    passed: cardCode.includes('useTheme') &&
            cardCode.includes('resolvedTokens') &&
            cardCode.includes('padding') &&
            cardCode.includes('shadow') &&
            cardCode.includes('border') &&
            !cardCode.includes('TODO') &&
            cardCode.length > 150,
    error: !cardCode.includes('useTheme')
      ? 'Card should use useTheme hook'
      : !cardCode.includes('resolvedTokens')
      ? 'Card should access resolvedTokens from theme'
      : !cardCode.includes('padding')
      ? 'Card should support padding prop'
      : !cardCode.includes('shadow')
      ? 'Card should support shadow prop'
      : !cardCode.includes('border')
      ? 'Card should support border prop'
      : cardCode.includes('TODO')
      ? 'Card still contains TODO comments'
      : 'Card needs proper implementation',
    executionTime: 1,
  });

  // Test 11: Card Sub-components
  tests.push({
    name: 'Card sub-components are properly attached',
    passed: compiledCode.includes('Card.Header = CardHeader') &&
            compiledCode.includes('Card.Body = CardBody') &&
            compiledCode.includes('Card.Footer = CardFooter'),
    error: 'Card.Header, Card.Body, and Card.Footer should be attached to Card component',
    executionTime: 1,
  });

  // Test 12: Component Documentation System
  const componentDocCode = extractCode(compiledCode, 'ComponentDoc');
  tests.push({
    name: 'ComponentDoc implements live documentation with interactive examples',
    passed: componentDocCode.includes('useState') &&
            componentDocCode.includes('activeExample') &&
            componentDocCode.includes('setActiveExample') &&
            componentDocCode.includes('examples.map') &&
            componentDocCode.includes('props') &&
            !componentDocCode.includes('TODO') &&
            componentDocCode.length > 200,
    error: !componentDocCode.includes('useState')
      ? 'ComponentDoc should use useState for active example'
      : !componentDocCode.includes('activeExample')
      ? 'ComponentDoc should track activeExample state'
      : !componentDocCode.includes('setActiveExample')
      ? 'ComponentDoc should allow switching examples'
      : !componentDocCode.includes('examples.map')
      ? 'ComponentDoc should render examples list'
      : !componentDocCode.includes('props')
      ? 'ComponentDoc should render props documentation'
      : componentDocCode.includes('TODO')
      ? 'ComponentDoc still contains TODO comments'
      : 'ComponentDoc needs proper implementation',
    executionTime: 1,
  });

  // Test 13: Theme Customizer Implementation
  const themeCustomizerCode = extractCode(compiledCode, 'ThemeCustomizer');
  tests.push({
    name: 'ThemeCustomizer provides visual theme editing interface',
    passed: themeCustomizerCode.includes('useTheme') &&
            themeCustomizerCode.includes('useState') &&
            themeCustomizerCode.includes('handleColorChange') &&
            themeCustomizerCode.includes('onTokenChange') &&
            themeCustomizerCode.includes('setMode') &&
            !themeCustomizerCode.includes('TODO') &&
            themeCustomizerCode.length > 150,
    error: !themeCustomizerCode.includes('useTheme')
      ? 'ThemeCustomizer should use useTheme hook'
      : !themeCustomizerCode.includes('useState')
      ? 'ThemeCustomizer should use useState for custom colors'
      : !themeCustomizerCode.includes('handleColorChange')
      ? 'ThemeCustomizer should handle color changes'
      : !themeCustomizerCode.includes('onTokenChange')
      ? 'ThemeCustomizer should call onTokenChange prop'
      : !themeCustomizerCode.includes('setMode')
      ? 'ThemeCustomizer should allow theme mode switching'
      : themeCustomizerCode.includes('TODO')
      ? 'ThemeCustomizer still contains TODO comments'
      : 'ThemeCustomizer needs proper implementation',
    executionTime: 1,
  });

  // Test 14: System Preference Detection
  tests.push({
    name: 'Theme system supports auto mode with system preference detection',
    passed: compiledCode.includes('matchMedia') &&
            compiledCode.includes('prefers-color-scheme: dark') &&
            compiledCode.includes('addEventListener') &&
            compiledCode.includes('removeEventListener'),
    error: 'Theme system should detect system preferences and listen for changes in auto mode',
    executionTime: 1,
  });

  // Test 15: Export Structure
  tests.push({
    name: 'All components and utilities are properly exported',
    passed: compiledCode.includes('export {') &&
            compiledCode.includes('ThemeProvider') &&
            compiledCode.includes('useTheme') &&
            compiledCode.includes('Button') &&
            compiledCode.includes('Card') &&
            compiledCode.includes('createVariants') &&
            compiledCode.includes('createExtensibleComponent'),
    error: 'All major components and utilities should be exported for external use',
    executionTime: 1,
  });

  // Test 16: Error Handling
  tests.push({
    name: 'Theme system includes proper error handling for localStorage failures',
    passed: compiledCode.includes('try') &&
            compiledCode.includes('catch') &&
            compiledCode.includes('localStorage') &&
            (compiledCode.includes('console.warn') || compiledCode.includes('// Ignore')),
    error: 'Theme system should handle localStorage errors gracefully with try/catch blocks',
    executionTime: 1,
  });

  // Test 17: CSS Class Generation
  tests.push({
    name: 'Components generate consistent CSS class names with design system prefix',
    passed: compiledCode.includes('ds-') &&
            compiledCode.includes('displayName.toLowerCase()') &&
            (compiledCode.includes('ds-button') || compiledCode.includes('ds-card')),
    error: 'Components should generate consistent CSS class names with ds- prefix',
    executionTime: 1,
  });

  return tests;
}