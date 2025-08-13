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

  // Test 1: FlexibleInput controlled/uncontrolled detection
  tests.push({
    name: 'FlexibleInput correctly detects controlled vs uncontrolled mode',
    passed: compiledCode.includes('isControlled = value !== undefined') && 
            compiledCode.includes('currentValue = isControlled ? value : internalValue'),
    error: !compiledCode.includes('isControlled = value !== undefined')
      ? 'FlexibleInput should detect controlled mode by checking if value prop is defined'
      : !compiledCode.includes('currentValue = isControlled ? value : internalValue')
      ? 'FlexibleInput should use controlled value when available, otherwise internal value'
      : 'FlexibleInput needs proper controlled/uncontrolled mode detection',
    executionTime: 1,
  });

  // Test 2: FlexibleInput imperative handle implementation
  tests.push({
    name: 'FlexibleInput implements comprehensive imperative handle with all required methods',
    passed: compiledCode.includes('useImperativeHandle') && 
            compiledCode.includes('focus:') &&
            compiledCode.includes('blur:') &&
            compiledCode.includes('clear:') &&
            compiledCode.includes('getValue:') &&
            compiledCode.includes('setValue:') &&
            compiledCode.includes('validate:') &&
            compiledCode.includes('getValidationState:'),
    error: !compiledCode.includes('useImperativeHandle')
      ? 'FlexibleInput should use useImperativeHandle for ref API'
      : !compiledCode.includes('focus:')
      ? 'FlexibleInput imperative handle should include focus method'
      : !compiledCode.includes('clear:')
      ? 'FlexibleInput imperative handle should include clear method'
      : !compiledCode.includes('getValue:')
      ? 'FlexibleInput imperative handle should include getValue method'
      : !compiledCode.includes('validate:')
      ? 'FlexibleInput imperative handle should include validate method'
      : 'FlexibleInput needs complete imperative handle implementation',
    executionTime: 1,
  });

  // Test 3: FlexibleInput validation logic
  const flexibleInputCode = extractCode(compiledCode, 'FlexibleInput');
  tests.push({
    name: 'FlexibleInput implements proper validation with configurable timing',
    passed: flexibleInputCode.includes('validateOnChange') && 
            flexibleInputCode.includes('validateOnBlur') &&
            flexibleInputCode.includes('validationError') &&
            flexibleInputCode.includes('hasBlurred') &&
            flexibleInputCode.includes('validator') &&
            flexibleInputCode.includes('shouldShowValidation') &&
            flexibleInputCode.length > 2000,
    error: !flexibleInputCode.includes('validateOnChange')
      ? 'FlexibleInput should support validateOnChange option'
      : !flexibleInputCode.includes('validateOnBlur')
      ? 'FlexibleInput should support validateOnBlur option'
      : !flexibleInputCode.includes('validationError')
      ? 'FlexibleInput should track validation errors'
      : !flexibleInputCode.includes('hasBlurred')
      ? 'FlexibleInput should track blur state for validation display'
      : !flexibleInputCode.includes('shouldShowValidation')
      ? 'FlexibleInput should conditionally show validation feedback'
      : 'FlexibleInput needs comprehensive validation implementation',
    executionTime: 1,
  });

  // Test 4: SmartForm mode detection and state management
  const smartFormCode = extractCode(compiledCode, 'SmartForm');
  tests.push({
    name: 'SmartForm implements intelligent state management across different modes',
    passed: smartFormCode.includes('mode === \'controlled\'') && 
            smartFormCode.includes('internalValues') &&
            smartFormCode.includes('internalErrors') &&
            smartFormCode.includes('currentValues') &&
            smartFormCode.includes('currentErrors') &&
            smartFormCode.includes('controlledValues') &&
            smartFormCode.includes('controlledOnChange'),
    error: !smartFormCode.includes('mode === \'controlled\'')
      ? 'SmartForm should check for controlled mode'
      : !smartFormCode.includes('internalValues')
      ? 'SmartForm should maintain internal values for uncontrolled/hybrid mode'
      : !smartFormCode.includes('currentValues')
      ? 'SmartForm should compute current values based on mode'
      : !smartFormCode.includes('controlledOnChange')
      ? 'SmartForm should call external onChange in controlled mode'
      : 'SmartForm needs proper mode-based state management',
    executionTime: 1,
  });

  // Test 5: SmartForm field validation implementation
  tests.push({
    name: 'SmartForm implements comprehensive field validation with multiple validation types',
    passed: smartFormCode.includes('validateField') && 
            smartFormCode.includes('field.required') &&
            smartFormCode.includes('field.type === \'email\'') &&
            smartFormCode.includes('emailRegex') &&
            smartFormCode.includes('field.validator') &&
            smartFormCode.includes('validateAllFields') &&
            smartFormCode.includes('submitAttempted'),
    error: !smartFormCode.includes('validateField')
      ? 'SmartForm should implement validateField function'
      : !smartFormCode.includes('field.required')
      ? 'SmartForm should handle required field validation'
      : !smartFormCode.includes('field.type === \'email\'')
      ? 'SmartForm should handle email type validation'
      : !smartFormCode.includes('field.validator')
      ? 'SmartForm should support custom field validators'
      : !smartFormCode.includes('validateAllFields')
      ? 'SmartForm should validate all fields on submit'
      : 'SmartForm needs comprehensive field validation',
    executionTime: 1,
  });

  // Test 6: SmartForm progress tracking and UX features
  tests.push({
    name: 'SmartForm implements user experience enhancements with progress tracking',
    passed: smartFormCode.includes('totalFields') && 
            smartFormCode.includes('completedFields') &&
            smartFormCode.includes('progress') &&
            smartFormCode.includes('isSubmitting') &&
            smartFormCode.includes('validationErrors') &&
            smartFormCode.includes('showValidationSummary'),
    error: !smartFormCode.includes('totalFields')
      ? 'SmartForm should calculate total required fields'
      : !smartFormCode.includes('completedFields')
      ? 'SmartForm should track completed required fields'
      : !smartFormCode.includes('progress')
      ? 'SmartForm should calculate form completion progress'
      : !smartFormCode.includes('isSubmitting')
      ? 'SmartForm should track submission state'
      : !smartFormCode.includes('showValidationSummary')
      ? 'SmartForm should optionally show validation summary'
      : 'SmartForm needs user experience enhancements',
    executionTime: 1,
  });

  // Test 7: StateManager controlled field handling
  const stateManagerCode = extractCode(compiledCode, 'StateManager');
  tests.push({
    name: 'StateManager implements proper controlled field handling and state computation',
    passed: stateManagerCode.includes('controlled = {}') && 
            stateManagerCode.includes('currentState') &&
            stateManagerCode.includes('...internalState, ...controlled') &&
            stateManagerCode.includes('isControlled') &&
            stateManagerCode.includes('key in controlled') &&
            stateManagerCode.length > 1500,
    error: !stateManagerCode.includes('controlled = {}')
      ? 'StateManager should accept controlled fields parameter'
      : !stateManagerCode.includes('currentState')
      ? 'StateManager should compute current state'
      : !stateManagerCode.includes('...internalState, ...controlled')
      ? 'StateManager should merge internal and controlled state'
      : !stateManagerCode.includes('isControlled')
      ? 'StateManager should provide isControlled method'
      : 'StateManager needs proper controlled field handling',
    executionTime: 1,
  });

  // Test 8: StateManager persistence implementation
  tests.push({
    name: 'StateManager implements state persistence with localStorage/sessionStorage support',
    passed: stateManagerCode.includes('persistKey') && 
            stateManagerCode.includes('persistTo') &&
            stateManagerCode.includes('localStorage') &&
            stateManagerCode.includes('sessionStorage') &&
            stateManagerCode.includes('JSON.parse') &&
            stateManagerCode.includes('JSON.stringify') &&
            stateManagerCode.includes('typeof window !== \'undefined\''),
    error: !stateManagerCode.includes('persistKey')
      ? 'StateManager should support persistence key'
      : !stateManagerCode.includes('persistTo')
      ? 'StateManager should support different storage types'
      : !stateManagerCode.includes('localStorage')
      ? 'StateManager should support localStorage'
      : !stateManagerCode.includes('sessionStorage')
      ? 'StateManager should support sessionStorage'
      : !stateManagerCode.includes('typeof window !== \'undefined\'')
      ? 'StateManager should check for browser environment'
      : 'StateManager needs proper persistence implementation',
    executionTime: 1,
  });

  // Test 9: StateManager validation and error handling
  tests.push({
    name: 'StateManager implements comprehensive validation and error handling',
    passed: stateManagerCode.includes('validator') && 
            stateManagerCode.includes('validationErrors') &&
            stateManagerCode.includes('validate') &&
            stateManagerCode.includes('setValidationErrors') &&
            stateManagerCode.includes('try') &&
            stateManagerCode.includes('catch') &&
            stateManagerCode.includes('debug'),
    error: !stateManagerCode.includes('validator')
      ? 'StateManager should accept validator function'
      : !stateManagerCode.includes('validationErrors')
      ? 'StateManager should track validation errors'
      : !stateManagerCode.includes('validate')
      ? 'StateManager should provide validate method'
      : !stateManagerCode.includes('try')
      ? 'StateManager should use try-catch for error handling'
      : !stateManagerCode.includes('debug')
      ? 'StateManager should support debug mode'
      : 'StateManager needs comprehensive validation and error handling',
    executionTime: 1,
  });

  // Test 10: StateManager state update logic
  tests.push({
    name: 'StateManager implements intelligent state updates with controlled field exclusion',
    passed: stateManagerCode.includes('setState') && 
            stateManagerCode.includes('typeof updates === \'function\'') &&
            stateManagerCode.includes('!(key in controlled)') &&
            stateManagerCode.includes('Object.entries') &&
            stateManagerCode.includes('resetState') &&
            stateManagerCode.includes('newState || initialState'),
    error: !stateManagerCode.includes('setState')
      ? 'StateManager should provide setState method'
      : !stateManagerCode.includes('typeof updates === \'function\'')
      ? 'StateManager should handle functional updates'
      : !stateManagerCode.includes('!(key in controlled)')
      ? 'StateManager should exclude controlled fields from internal updates'
      : !stateManagerCode.includes('resetState')
      ? 'StateManager should provide resetState method'
      : 'StateManager needs intelligent state update logic',
    executionTime: 1,
  });

  // Test 11: FlexibleInput clear functionality
  tests.push({
    name: 'FlexibleInput implements comprehensive clear functionality with proper state management',
    passed: compiledCode.includes('handleClear') && 
            compiledCode.includes('clearButton') &&
            compiledCode.includes('onClear') &&
            compiledCode.includes('setInternalValue(\'\')') &&
            compiledCode.includes('setValidationError(null)') &&
            compiledCode.includes('focus()'),
    error: !compiledCode.includes('handleClear')
      ? 'FlexibleInput should implement handleClear function'
      : !compiledCode.includes('clearButton')
      ? 'FlexibleInput should support clearButton prop'
      : !compiledCode.includes('onClear')
      ? 'FlexibleInput should call onClear callback'
      : !compiledCode.includes('setInternalValue(\'\')') 
      ? 'FlexibleInput should clear internal value'
      : !compiledCode.includes('focus()')
      ? 'FlexibleInput should focus after clearing'
      : 'FlexibleInput needs comprehensive clear functionality',
    executionTime: 1,
  });

  // Test 12: FlexibleInput state change notifications
  tests.push({
    name: 'FlexibleInput implements proper state change notifications with validation state',
    passed: compiledCode.includes('onStateChange') && 
            compiledCode.includes('value: newValue') &&
            compiledCode.includes('isValid:') &&
            compiledCode.includes('error:') &&
            compiledCode.includes('handleChange') &&
            compiledCode.includes('handleBlur'),
    error: !compiledCode.includes('onStateChange')
      ? 'FlexibleInput should support onStateChange callback'
      : !compiledCode.includes('value: newValue')
      ? 'FlexibleInput should include value in state change'
      : !compiledCode.includes('isValid:')
      ? 'FlexibleInput should include isValid in state change'
      : !compiledCode.includes('error:')
      ? 'FlexibleInput should include error in state change'
      : 'FlexibleInput needs proper state change notifications',
    executionTime: 1,
  });

  // Test 13: SmartForm form submission and reset
  tests.push({
    name: 'SmartForm implements proper form submission and reset with async support',
    passed: smartFormCode.includes('handleSubmit') && 
            smartFormCode.includes('event.preventDefault()') &&
            smartFormCode.includes('setIsSubmitting(true)') &&
            smartFormCode.includes('async') &&
            smartFormCode.includes('handleReset') &&
            smartFormCode.includes('setSubmitAttempted(false)') &&
            smartFormCode.includes('resetValues'),
    error: !smartFormCode.includes('handleSubmit')
      ? 'SmartForm should implement handleSubmit function'
      : !smartFormCode.includes('event.preventDefault()')
      ? 'SmartForm should prevent default form submission'
      : !smartFormCode.includes('setIsSubmitting(true)')
      ? 'SmartForm should track submission state'
      : !smartFormCode.includes('handleReset')
      ? 'SmartForm should implement handleReset function'
      : !smartFormCode.includes('resetValues')
      ? 'SmartForm should reset values to defaults'
      : 'SmartForm needs proper form submission and reset',
    executionTime: 1,
  });

  // Test 14: Demo component integration and examples
  const demoCode = extractCode(compiledCode, 'ControlledUncontrolledDemo');
  tests.push({
    name: 'Demo component showcases all patterns with comprehensive examples',
    passed: demoCode.includes('selectedPattern') && 
            demoCode.includes('FlexibleInput') &&
            demoCode.includes('SmartForm') &&
            demoCode.includes('StateManager') &&
            demoCode.includes('controlledInputValue') &&
            demoCode.includes('formValues') &&
            demoCode.includes('decision-tree') &&
            demoCode.length > 3000,
    error: !demoCode.includes('selectedPattern')
      ? 'Demo should have pattern selection'
      : !demoCode.includes('FlexibleInput')
      ? 'Demo should showcase FlexibleInput component'
      : !demoCode.includes('SmartForm')
      ? 'Demo should showcase SmartForm component'
      : !demoCode.includes('StateManager')
      ? 'Demo should showcase StateManager component'
      : !demoCode.includes('decision-tree')
      ? 'Demo should include decision tree section'
      : 'Demo component needs comprehensive pattern showcase',
    executionTime: 1,
  });

  // Test 15: Component prop interfaces and TypeScript integration
  tests.push({
    name: 'Components implement comprehensive TypeScript interfaces with proper prop typing',
    passed: compiledCode.includes('FlexibleInputProps') && 
            compiledCode.includes('FlexibleInputHandle') &&
            compiledCode.includes('FormField') &&
            compiledCode.includes('SmartFormProps') &&
            compiledCode.includes('StateManagerProps<T>') &&
            compiledCode.includes('StateActions<T>') &&
            compiledCode.includes('extends Record<string, any>'),
    error: !compiledCode.includes('FlexibleInputProps')
      ? 'Should define FlexibleInputProps interface'
      : !compiledCode.includes('FlexibleInputHandle')
      ? 'Should define FlexibleInputHandle interface'
      : !compiledCode.includes('FormField')
      ? 'Should define FormField interface'
      : !compiledCode.includes('SmartFormProps')
      ? 'Should define SmartFormProps interface'
      : !compiledCode.includes('StateManagerProps<T>')
      ? 'Should define generic StateManagerProps interface'
      : 'Components need comprehensive TypeScript interfaces',
    executionTime: 1,
  });

  // Test 16: Advanced patterns and error handling
  tests.push({
    name: 'Components implement advanced patterns with robust error handling and edge cases',
    passed: compiledCode.includes('forwardRef') && 
            compiledCode.includes('useCallback') &&
            compiledCode.includes('useMemo') &&
            compiledCode.includes('useEffect') &&
            (compiledCode.match(/try\s*{/g) || []).length >= 3 &&
            (compiledCode.match(/catch/g) || []).length >= 3 &&
            compiledCode.includes('displayName'),
    error: !compiledCode.includes('forwardRef')
      ? 'Components should use forwardRef for ref forwarding'
      : !compiledCode.includes('useCallback')
      ? 'Components should use useCallback for performance'
      : !compiledCode.includes('useMemo')
      ? 'Components should use useMemo for computed values'
      : !(compiledCode.match(/try\s*{/g) || []).length >= 3
      ? 'Components should implement proper error handling with try-catch'
      : !compiledCode.includes('displayName')
      ? 'Components should set displayName for debugging'
      : 'Components need advanced patterns and error handling',
    executionTime: 1,
  });

  return tests;
}