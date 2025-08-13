import type { TestResult } from '@/types';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Helper function to extract component/function code
  function extractCode(code: string, name: string): string {
    // Try function pattern first
    let pattern = new RegExp(`function ${name}\\(.*?\\)\\s*{([\\s\\S]*?)}(?=\\s*(?:function|export|const|class|$))`, 'i');
    let match = code.match(pattern);
    
    if (!match) {
      // Try const/arrow function pattern
      pattern = new RegExp(`const ${name}\\s*=.*?{([\\s\\S]*?)}(?=\\s*(?:function|export|const|class|$))`, 'i');
      match = code.match(pattern);
    }
    
    if (!match) {
      // Try more flexible pattern with brace counting
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
        
        if (braceCount === 0) {
          return code.substring(startIndex, endIndex);
        }
      }
    }
    
    return match ? match[1] : '';
  }

  // Test 1: Polymorphic type definitions
  tests.push({
    name: 'Polymorphic type definitions are correctly implemented',
    passed: compiledCode.includes('PolymorphicComponentProp') && 
            compiledCode.includes('PolymorphicRef') &&
            compiledCode.includes('PolymorphicComponentPropWithRef') &&
            compiledCode.includes('AsProp') &&
            compiledCode.includes('PropsToOmit') &&
            compiledCode.includes('ElementType') &&
            compiledCode.includes('ComponentRef'),
    error: !compiledCode.includes('PolymorphicComponentProp')
      ? 'Should define PolymorphicComponentProp type for polymorphic props'
      : !compiledCode.includes('PolymorphicRef')
      ? 'Should define PolymorphicRef type for ref forwarding'
      : !compiledCode.includes('PolymorphicComponentPropWithRef')
      ? 'Should define PolymorphicComponentPropWithRef type combining props and ref'
      : !compiledCode.includes('AsProp')
      ? 'Should define AsProp type for the "as" prop'
      : !compiledCode.includes('PropsToOmit')
      ? 'Should define PropsToOmit type for prop exclusion'
      : 'Should implement all required polymorphic TypeScript type definitions',
    executionTime: 1,
  });

  // Test 2: Box polymorphic component implementation
  const boxComponentCode = extractCode(compiledCode, 'BoxComponent');
  tests.push({
    name: 'Box polymorphic component implements design system props and element flexibility',
    passed: boxComponentCode.includes('const Component = as || ') && 
            boxComponentCode.includes('color') &&
            boxComponentCode.includes('bg') &&
            boxComponentCode.includes('padding') &&
            boxComponentCode.includes('margin') &&
            boxComponentCode.includes('rounded') &&
            boxComponentCode.includes('shadow') &&
            boxComponentCode.includes('border') &&
            boxComponentCode.includes('getColorClass') &&
            boxComponentCode.includes('getSpacingClass') &&
            !boxComponentCode.includes('TODO') &&
            boxComponentCode.length > 1000,
    error: !boxComponentCode.includes('const Component = as || ')
      ? 'Box should use "as" prop to determine component type'
      : !boxComponentCode.includes('color')
      ? 'Box should handle color prop for text color'
      : !boxComponentCode.includes('bg')
      ? 'Box should handle bg prop for background color'
      : !boxComponentCode.includes('padding')
      ? 'Box should handle padding spacing props'
      : !boxComponentCode.includes('margin')
      ? 'Box should handle margin spacing props'
      : !boxComponentCode.includes('getColorClass')
      ? 'Box should implement color class generation'
      : !boxComponentCode.includes('getSpacingClass')
      ? 'Box should implement spacing class generation'
      : boxComponentCode.includes('TODO')
      ? 'Box still contains TODO comments - needs implementation'
      : 'Box needs substantial implementation with design system props',
    executionTime: 1,
  });

  // Test 3: forwardRef integration for Box
  tests.push({
    name: 'Box component is properly wrapped with forwardRef for polymorphic usage',
    passed: compiledCode.includes('const Box = forwardRef(BoxComponent)') && 
            compiledCode.includes('as <C extends ElementType = ') &&
            compiledCode.includes('BoxProps<C>') &&
            compiledCode.includes('ReactElement | null'),
    error: !compiledCode.includes('const Box = forwardRef(BoxComponent)')
      ? 'Box should be wrapped with forwardRef'
      : !compiledCode.includes('as <C extends ElementType = ')
      ? 'Box should use generic type casting for polymorphic usage'
      : !compiledCode.includes('BoxProps<C>')
      ? 'Box should use generic BoxProps type'
      : 'Box needs proper forwardRef integration with polymorphic types',
    executionTime: 1,
  });

  // Test 4: Button polymorphic component implementation
  const buttonComponentCode = extractCode(compiledCode, 'ButtonComponent');
  tests.push({
    name: 'Button polymorphic component implements variants, sizes, and states',
    passed: buttonComponentCode.includes('variant') && 
            buttonComponentCode.includes('size') &&
            buttonComponentCode.includes('isLoading') &&
            buttonComponentCode.includes('isDisabled') &&
            buttonComponentCode.includes('leftIcon') &&
            buttonComponentCode.includes('rightIcon') &&
            buttonComponentCode.includes('getVariantClasses') &&
            buttonComponentCode.includes('getSizeClasses') &&
            buttonComponentCode.includes('getStateClasses') &&
            !buttonComponentCode.includes('TODO') &&
            buttonComponentCode.length > 800,
    error: !buttonComponentCode.includes('variant')
      ? 'Button should handle variant prop (solid, outline, ghost, link)'
      : !buttonComponentCode.includes('size')
      ? 'Button should handle size prop for different button sizes'
      : !buttonComponentCode.includes('isLoading')
      ? 'Button should handle loading state'
      : !buttonComponentCode.includes('isDisabled')
      ? 'Button should handle disabled state'
      : !buttonComponentCode.includes('leftIcon')
      ? 'Button should support left icon'
      : !buttonComponentCode.includes('rightIcon')
      ? 'Button should support right icon'
      : !buttonComponentCode.includes('getVariantClasses')
      ? 'Button should implement variant class generation'
      : buttonComponentCode.includes('TODO')
      ? 'Button still contains TODO comments - needs implementation'
      : 'Button needs substantial implementation with variants and states',
    executionTime: 1,
  });

  // Test 5: Generic List component implementation
  const listComponentCode = extractCode(compiledCode, 'ListComponent');
  tests.push({
    name: 'List polymorphic component implements generic types and item rendering',
    passed: listComponentCode.includes('<C extends ElementType') && 
            listComponentCode.includes('<T') &&
            listComponentCode.includes('items: T[]') &&
            listComponentCode.includes('renderItem') &&
            listComponentCode.includes('keyExtractor') &&
            listComponentCode.includes('emptyMessage') &&
            listComponentCode.includes('isLoading') &&
            listComponentCode.includes('variant') &&
            listComponentCode.includes('getVariantClasses') &&
            listComponentCode.includes('getItemClasses') &&
            !listComponentCode.includes('TODO') &&
            listComponentCode.length > 600,
    error: !listComponentCode.includes('<C extends ElementType')
      ? 'List should use generic C for element type'
      : !listComponentCode.includes('<T')
      ? 'List should use generic T for item type'
      : !listComponentCode.includes('items: T[]')
      ? 'List should accept generic items array'
      : !listComponentCode.includes('renderItem')
      ? 'List should accept renderItem function'
      : !listComponentCode.includes('keyExtractor')
      ? 'List should implement keyExtractor for item keys'
      : !listComponentCode.includes('emptyMessage')
      ? 'List should handle empty state'
      : !listComponentCode.includes('isLoading')
      ? 'List should handle loading state'
      : !listComponentCode.includes('getVariantClasses')
      ? 'List should implement variant class generation'
      : listComponentCode.includes('TODO')
      ? 'List still contains TODO comments - needs implementation'
      : 'List needs substantial generic implementation',
    executionTime: 1,
  });

  // Test 6: Design system token integration
  tests.push({
    name: 'Components implement design system tokens and class generation utilities',
    passed: compiledCode.includes('spacingTokens') && 
            compiledCode.includes('colorTokens') &&
            compiledCode.includes('ColorScale') &&
            compiledCode.includes('SizeScale') &&
            compiledCode.includes('SpacingScale') &&
            (compiledCode.match(/getColorClass|getSpacingClass|getSizeClass/g) || []).length >= 3,
    error: !compiledCode.includes('spacingTokens')
      ? 'Should define spacingTokens for design system spacing'
      : !compiledCode.includes('colorTokens')
      ? 'Should define colorTokens for design system colors'
      : !compiledCode.includes('ColorScale')
      ? 'Should define ColorScale type for color variants'
      : !compiledCode.includes('SizeScale')
      ? 'Should define SizeScale type for size variants'
      : !compiledCode.includes('SpacingScale')
      ? 'Should define SpacingScale type for spacing values'
      : 'Should implement design system token utilities and class generators',
    executionTime: 1,
  });

  // Test 7: Advanced polymorphic patterns
  const createPolymorphicLinkCode = extractCode(compiledCode, 'createPolymorphicLink');
  tests.push({
    name: 'createPolymorphicLink factory implements smart routing logic',
    passed: createPolymorphicLinkCode.includes('RouterLinkComponent') && 
            createPolymorphicLinkCode.includes('external') &&
            createPolymorphicLinkCode.includes('download') &&
            createPolymorphicLinkCode.includes('href') &&
            createPolymorphicLinkCode.includes('to') &&
            createPolymorphicLinkCode.includes('RouterLink') &&
            createPolymorphicLinkCode.includes('forwardRef') &&
            !createPolymorphicLinkCode.includes('TODO') &&
            createPolymorphicLinkCode.length > 400,
    error: !createPolymorphicLinkCode.includes('RouterLinkComponent')
      ? 'createPolymorphicLink should accept RouterLinkComponent parameter'
      : !createPolymorphicLinkCode.includes('external')
      ? 'createPolymorphicLink should handle external links'
      : !createPolymorphicLinkCode.includes('download')
      ? 'createPolymorphicLink should handle download links'
      : !createPolymorphicLinkCode.includes('href')
      ? 'createPolymorphicLink should handle href prop'
      : !createPolymorphicLinkCode.includes('to')
      ? 'createPolymorphicLink should handle router "to" prop'
      : !createPolymorphicLinkCode.includes('RouterLink')
      ? 'createPolymorphicLink should use RouterLink component when available'
      : createPolymorphicLinkCode.includes('TODO')
      ? 'createPolymorphicLink still contains TODO comments'
      : 'createPolymorphicLink needs substantial smart routing implementation',
    executionTime: 1,
  });

  // Test 8: Validation utilities
  const validatePolymorphicPropsCode = extractCode(compiledCode, 'validatePolymorphicProps');
  tests.push({
    name: 'validatePolymorphicProps implements comprehensive prop validation',
    passed: validatePolymorphicPropsCode.includes('warnings') && 
            validatePolymorphicPropsCode.includes('href') &&
            validatePolymorphicPropsCode.includes('to') &&
            validatePolymorphicPropsCode.includes('as') &&
            validatePolymorphicPropsCode.includes('role') &&
            validatePolymorphicPropsCode.includes('isValidElementType') &&
            !validatePolymorphicPropsCode.includes('TODO') &&
            validatePolymorphicPropsCode.length > 200,
    error: !validatePolymorphicPropsCode.includes('warnings')
      ? 'validatePolymorphicProps should return warnings array'
      : !validatePolymorphicPropsCode.includes('href')
      ? 'validatePolymorphicProps should check for href prop conflicts'
      : !validatePolymorphicPropsCode.includes('to')
      ? 'validatePolymorphicProps should check for "to" prop conflicts'
      : !validatePolymorphicPropsCode.includes('as')
      ? 'validatePolymorphicProps should validate "as" prop'
      : !validatePolymorphicPropsCode.includes('role')
      ? 'validatePolymorphicProps should check accessibility concerns'
      : !validatePolymorphicPropsCode.includes('isValidElementType')
      ? 'validatePolymorphicProps should validate element types'
      : validatePolymorphicPropsCode.includes('TODO')
      ? 'validatePolymorphicProps still contains TODO comments'
      : 'validatePolymorphicProps needs substantial validation implementation',
    executionTime: 1,
  });

  // Test 9: Testing utilities
  const createPolymorphicTestUtilsCode = extractCode(compiledCode, 'createPolymorphicTestUtils');
  tests.push({
    name: 'createPolymorphicTestUtils provides comprehensive testing utilities',
    passed: createPolymorphicTestUtilsCode.includes('testAsProps') && 
            createPolymorphicTestUtilsCode.includes('testRefForwarding') &&
            createPolymorphicTestUtilsCode.includes('testPropInheritance') &&
            createPolymorphicTestUtilsCode.includes('Component') &&
            !createPolymorphicTestUtilsCode.includes('TODO') &&
            createPolymorphicTestUtilsCode.length > 150,
    error: !createPolymorphicTestUtilsCode.includes('testAsProps')
      ? 'createPolymorphicTestUtils should provide testAsProps utility'
      : !createPolymorphicTestUtilsCode.includes('testRefForwarding')
      ? 'createPolymorphicTestUtils should provide testRefForwarding utility'
      : !createPolymorphicTestUtilsCode.includes('testPropInheritance')
      ? 'createPolymorphicTestUtils should provide testPropInheritance utility'
      : !createPolymorphicTestUtilsCode.includes('Component')
      ? 'createPolymorphicTestUtils should accept Component parameter'
      : createPolymorphicTestUtilsCode.includes('TODO')
      ? 'createPolymorphicTestUtils still contains TODO comments'
      : 'createPolymorphicTestUtils needs proper testing utility implementation',
    executionTime: 1,
  });

  // Test 10: Element type validation
  const isValidElementTypeCode = extractCode(compiledCode, 'isValidElementType');
  tests.push({
    name: 'isValidElementType implements proper element type checking',
    passed: isValidElementTypeCode.includes('typeof component === ') && 
            isValidElementTypeCode.includes('string') &&
            isValidElementTypeCode.includes('function') &&
            isValidElementTypeCode.includes('object') &&
            isValidElementTypeCode.includes('$$typeof') &&
            !isValidElementTypeCode.includes('TODO'),
    error: !isValidElementTypeCode.includes('typeof component === ')
      ? 'isValidElementType should check component type'
      : !isValidElementTypeCode.includes('string')
      ? 'isValidElementType should validate string element types'
      : !isValidElementTypeCode.includes('function')
      ? 'isValidElementType should validate function components'
      : !isValidElementTypeCode.includes('object')
      ? 'isValidElementType should validate object components'
      : !isValidElementTypeCode.includes('$$typeof')
      ? 'isValidElementType should check React element symbols'
      : 'isValidElementType needs proper element type validation',
    executionTime: 1,
  });

  // Test 11: Class generation utilities
  tests.push({
    name: 'Components implement comprehensive class generation utilities',
    passed: (compiledCode.match(/getColorClass|getSpacingClass|getSizeClass|getVariantClasses|getRoundedClass|getShadowClass|getBorderClass/g) || []).length >= 6 && 
            compiledCode.includes('switch') &&
            compiledCode.includes('property') &&
            compiledCode.includes('value') &&
            compiledCode.includes('filter(Boolean)') &&
            compiledCode.includes('join'),
    error: !(compiledCode.match(/getColorClass|getSpacingClass|getSizeClass|getVariantClasses|getRoundedClass|getShadowClass|getBorderClass/g) || []).length >= 6
      ? 'Should implement multiple class generation utilities'
      : !compiledCode.includes('switch')
      ? 'Should use switch statements for variant handling'
      : !compiledCode.includes('property')
      ? 'Should handle property-based class generation'
      : !compiledCode.includes('value')
      ? 'Should handle value-based class generation'
      : !compiledCode.includes('filter(Boolean)')
      ? 'Should filter out falsy classes'
      : !compiledCode.includes('join')
      ? 'Should join classes into className string'
      : 'Should implement comprehensive class generation utilities',
    executionTime: 1,
  });

  // Test 12: Ref forwarding implementation
  tests.push({
    name: 'All polymorphic components properly implement ref forwarding',
    passed: (compiledCode.match(/forwardRef/g) || []).length >= 3 && 
            compiledCode.includes('PolymorphicRef<C>') &&
            compiledCode.includes('ref?:') &&
            compiledCode.includes('<Component ref={ref}') &&
            (compiledCode.match(/const.*=.*forwardRef/g) || []).length >= 3,
    error: !(compiledCode.match(/forwardRef/g) || []).length >= 3
      ? 'Should use forwardRef for all polymorphic components'
      : !compiledCode.includes('PolymorphicRef<C>')
      ? 'Should use PolymorphicRef type for ref typing'
      : !compiledCode.includes('ref?:')
      ? 'Should include optional ref parameter'
      : !compiledCode.includes('<Component ref={ref}')
      ? 'Should forward ref to dynamic Component'
      : 'Should implement proper ref forwarding for all components',
    executionTime: 1,
  });

  // Test 13: Loading and state handling
  tests.push({
    name: 'Components implement proper loading states and conditional rendering',
    passed: compiledCode.includes('isLoading') && 
            compiledCode.includes('isDisabled') &&
            compiledCode.includes('Spinner') &&
            compiledCode.includes('emptyMessage') &&
            compiledCode.includes('loadingMessage') &&
            compiledCode.includes('animate-spin') &&
            compiledCode.includes('items.length === 0'),
    error: !compiledCode.includes('isLoading')
      ? 'Should handle loading states'
      : !compiledCode.includes('isDisabled')
      ? 'Should handle disabled states'
      : !compiledCode.includes('Spinner')
      ? 'Should implement loading spinner component'
      : !compiledCode.includes('emptyMessage')
      ? 'Should handle empty state messages'
      : !compiledCode.includes('loadingMessage')
      ? 'Should handle loading state messages'
      : !compiledCode.includes('animate-spin')
      ? 'Should use proper loading animations'
      : 'Should implement comprehensive state handling',
    executionTime: 1,
  });

  // Test 14: Runtime validation wrapper
  const withRuntimeValidationCode = extractCode(compiledCode, 'withRuntimeValidation');
  tests.push({
    name: 'withRuntimeValidation HOC implements development-time validation',
    passed: withRuntimeValidationCode.includes('ValidatedComponent') && 
            withRuntimeValidationCode.includes('validatePolymorphicProps') &&
            withRuntimeValidationCode.includes('process.env.NODE_ENV') &&
            withRuntimeValidationCode.includes('development') &&
            withRuntimeValidationCode.includes('console.warn') &&
            withRuntimeValidationCode.includes('displayName') &&
            !withRuntimeValidationCode.includes('TODO'),
    error: !withRuntimeValidationCode.includes('ValidatedComponent')
      ? 'withRuntimeValidation should create ValidatedComponent'
      : !withRuntimeValidationCode.includes('validatePolymorphicProps')
      ? 'withRuntimeValidation should use validatePolymorphicProps'
      : !withRuntimeValidationCode.includes('process.env.NODE_ENV')
      ? 'withRuntimeValidation should check environment'
      : !withRuntimeValidationCode.includes('development')
      ? 'withRuntimeValidation should only warn in development'
      : !withRuntimeValidationCode.includes('console.warn')
      ? 'withRuntimeValidation should log warnings'
      : !withRuntimeValidationCode.includes('displayName')
      ? 'withRuntimeValidation should preserve displayName'
      : 'withRuntimeValidation needs proper HOC implementation',
    executionTime: 1,
  });

  // Test 15: Demo component integration
  const demoCode = extractCode(compiledCode, 'PolymorphicComponentsDemo');
  tests.push({
    name: 'Demo component showcases all polymorphic patterns with interactive examples',
    passed: demoCode.includes('<Box') && 
            demoCode.includes('<Button') &&
            demoCode.includes('<List') &&
            demoCode.includes('as="') &&
            demoCode.includes('variant=') &&
            demoCode.includes('selectedExample') &&
            demoCode.includes('sampleUsers') &&
            demoCode.includes('renderItem') &&
            demoCode.length > 1500,
    error: !demoCode.includes('<Box')
      ? 'Demo should showcase Box component usage'
      : !demoCode.includes('<Button')
      ? 'Demo should showcase Button component usage'
      : !demoCode.includes('<List')
      ? 'Demo should showcase List component usage'
      : !demoCode.includes('as="')
      ? 'Demo should demonstrate polymorphic "as" prop usage'
      : !demoCode.includes('variant=')
      ? 'Demo should demonstrate variant prop usage'
      : !demoCode.includes('selectedExample')
      ? 'Demo should have interactive example selection'
      : !demoCode.includes('sampleUsers')
      ? 'Demo should use sample data'
      : !demoCode.includes('renderItem')
      ? 'Demo should demonstrate List renderItem usage'
      : 'Demo component needs substantial implementation showcasing all features',
    executionTime: 1,
  });

  // Test 16: TypeScript integration and constraints
  tests.push({
    name: 'Components implement proper TypeScript generic constraints and inference',
    passed: compiledCode.includes('<C extends ElementType') && 
            compiledCode.includes('<T>') &&
            compiledCode.includes('= \'div\'') &&
            compiledCode.includes('= \'button\'') &&
            compiledCode.includes('= \'ul\'') &&
            compiledCode.includes('ComponentPropsWithoutRef<C>') &&
            compiledCode.includes('Omit<') &&
            (compiledCode.match(/extends ElementType/g) || []).length >= 6,
    error: !compiledCode.includes('<C extends ElementType')
      ? 'Should use generic C extending ElementType'
      : !compiledCode.includes('<T>')
      ? 'Should use generic T for List item types'
      : !compiledCode.includes('= \'div\'')
      ? 'Should provide default element types'
      : !compiledCode.includes('ComponentPropsWithoutRef<C>')
      ? 'Should use ComponentPropsWithoutRef for prop inference'
      : !compiledCode.includes('Omit<')
      ? 'Should use Omit for prop exclusion'
      : 'Should implement comprehensive TypeScript generic constraints',
    executionTime: 1,
  });

  return tests;
}