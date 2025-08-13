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

  // Test 1: Tabs compound component implementation
  const tabsCode = extractCode(compiledCode, 'Tabs');
  tests.push({
    name: 'Tabs compound component implements context sharing and state management',
    passed: tabsCode.includes('TabsContext') && 
            tabsCode.includes('createContext') &&
            tabsCode.includes('Provider') &&
            tabsCode.includes('activeTab') &&
            tabsCode.includes('setActiveTab') &&
            tabsCode.includes('controlledActiveTab') &&
            tabsCode.includes('onTabChange') &&
            !tabsCode.includes('TODO') &&
            tabsCode.length > 500,
    error: !tabsCode.includes('TabsContext')
      ? 'Tabs should create and use TabsContext for state sharing'
      : !tabsCode.includes('createContext')
      ? 'Tabs should use createContext to create the context'
      : !tabsCode.includes('Provider')
      ? 'Tabs should provide context to children via Provider'
      : !tabsCode.includes('activeTab')
      ? 'Tabs should manage activeTab state'
      : !tabsCode.includes('setActiveTab')
      ? 'Tabs should provide setActiveTab function'
      : !tabsCode.includes('controlledActiveTab')
      ? 'Tabs should support controlled mode'
      : tabsCode.includes('TODO')
      ? 'Tabs still contains TODO comments - needs implementation'
      : 'Tabs needs substantial implementation with context and state management',
    executionTime: 1,
  });

  // Test 2: useTabsContext hook implementation
  const useTabsContextCode = extractCode(compiledCode, 'useTabsContext');
  tests.push({
    name: 'useTabsContext hook provides proper context validation and typed access',
    passed: useTabsContextCode.includes('useContext') && 
            useTabsContextCode.includes('TabsContext') &&
            (useTabsContextCode.includes('throw') || useTabsContextCode.includes('error')) &&
            !useTabsContextCode.includes('TODO') &&
            useTabsContextCode.length > 100,
    error: !useTabsContextCode.includes('useContext')
      ? 'useTabsContext should use useContext hook'
      : !useTabsContextCode.includes('TabsContext')
      ? 'useTabsContext should access TabsContext'
      : !(useTabsContextCode.includes('throw') || useTabsContextCode.includes('error'))
      ? 'useTabsContext should validate context and throw error if used outside provider'
      : useTabsContextCode.includes('TODO')
      ? 'useTabsContext still contains TODO comments'
      : 'useTabsContext needs proper implementation with validation',
    executionTime: 1,
  });

  // Test 3: TabList component with keyboard navigation
  const tabListCode = extractCode(compiledCode, 'TabList');
  tests.push({
    name: 'TabList component implements keyboard navigation and accessibility',
    passed: tabListCode.includes('useTabsContext') && 
            tabListCode.includes('onKeyDown') &&
            tabListCode.includes('ArrowRight') &&
            tabListCode.includes('ArrowLeft') &&
            tabListCode.includes('role="tablist"') &&
            tabListCode.includes('aria-orientation') &&
            !tabListCode.includes('TODO') &&
            tabListCode.length > 300,
    error: !tabListCode.includes('useTabsContext')
      ? 'TabList should use useTabsContext hook'
      : !tabListCode.includes('onKeyDown')
      ? 'TabList should handle keyboard events'
      : !tabListCode.includes('ArrowRight')
      ? 'TabList should handle arrow key navigation'
      : !tabListCode.includes('role="tablist"')
      ? 'TabList should have proper ARIA role'
      : !tabListCode.includes('aria-orientation')
      ? 'TabList should set aria-orientation'
      : tabListCode.includes('TODO')
      ? 'TabList still contains TODO comments'
      : 'TabList needs substantial implementation with navigation and accessibility',
    executionTime: 1,
  });

  // Test 4: Tab component implementation
  const tabCode = extractCode(compiledCode, 'Tab');
  tests.push({
    name: 'Tab component handles selection, disabled state, and accessibility',
    passed: tabCode.includes('useTabsContext') && 
            tabCode.includes('onClick') &&
            tabCode.includes('onKeyDown') &&
            tabCode.includes('role="tab"') &&
            tabCode.includes('aria-selected') &&
            tabCode.includes('disabled') &&
            tabCode.includes('icon') &&
            !tabCode.includes('TODO') &&
            tabCode.length > 300,
    error: !tabCode.includes('useTabsContext')
      ? 'Tab should use useTabsContext hook'
      : !tabCode.includes('onClick')
      ? 'Tab should handle click events'
      : !tabCode.includes('onKeyDown')
      ? 'Tab should handle keyboard events (Enter/Space)'
      : !tabCode.includes('role="tab"')
      ? 'Tab should have proper ARIA role'
      : !tabCode.includes('aria-selected')
      ? 'Tab should set aria-selected attribute'
      : !tabCode.includes('disabled')
      ? 'Tab should handle disabled state'
      : !tabCode.includes('icon')
      ? 'Tab should support icon prop'
      : tabCode.includes('TODO')
      ? 'Tab still contains TODO comments'
      : 'Tab needs substantial implementation with interaction and accessibility',
    executionTime: 1,
  });

  // Test 5: Accordion compound component implementation
  const accordionCode = extractCode(compiledCode, 'Accordion');
  tests.push({
    name: 'Accordion compound component implements multi-item state management',
    passed: accordionCode.includes('AccordionContext') && 
            accordionCode.includes('allowMultiple') &&
            accordionCode.includes('toggleItem') &&
            accordionCode.includes('activeItems') &&
            accordionCode.includes('Set') &&
            accordionCode.includes('controlledItems') &&
            !accordionCode.includes('TODO') &&
            accordionCode.length > 400,
    error: !accordionCode.includes('AccordionContext')
      ? 'Accordion should create and use AccordionContext'
      : !accordionCode.includes('allowMultiple')
      ? 'Accordion should support allowMultiple prop'
      : !accordionCode.includes('toggleItem')
      ? 'Accordion should provide toggleItem function'
      : !accordionCode.includes('activeItems')
      ? 'Accordion should manage activeItems state'
      : !accordionCode.includes('Set')
      ? 'Accordion should use Set for managing active items'
      : !accordionCode.includes('controlledItems')
      ? 'Accordion should support controlled mode'
      : accordionCode.includes('TODO')
      ? 'Accordion still contains TODO comments'
      : 'Accordion needs substantial implementation with state management',
    executionTime: 1,
  });

  // Test 6: Modal compound component implementation
  const modalCode = extractCode(compiledCode, 'Modal');
  tests.push({
    name: 'Modal compound component implements portal rendering and focus management',
    passed: modalCode.includes('ModalContext') && 
            modalCode.includes('createPortal') &&
            modalCode.includes('useEffect') &&
            modalCode.includes('onClose') &&
            modalCode.includes('closeOnEscape') &&
            modalCode.includes('Escape') &&
            modalCode.includes('focus') &&
            !modalCode.includes('TODO') &&
            modalCode.length > 500,
    error: !modalCode.includes('ModalContext')
      ? 'Modal should create and use ModalContext'
      : !modalCode.includes('createPortal')
      ? 'Modal should use createPortal for rendering'
      : !modalCode.includes('useEffect')
      ? 'Modal should use useEffect for side effects'
      : !modalCode.includes('onClose')
      ? 'Modal should provide onClose function'
      : !modalCode.includes('closeOnEscape')
      ? 'Modal should support closeOnEscape prop'
      : !modalCode.includes('Escape')
      ? 'Modal should handle Escape key'
      : !modalCode.includes('focus')
      ? 'Modal should handle focus management'
      : modalCode.includes('TODO')
      ? 'Modal still contains TODO comments'
      : 'Modal needs substantial implementation with portal and focus management',
    executionTime: 1,
  });

  // Test 7: Compound component attachment
  tests.push({
    name: 'Components properly attach sub-components to create compound APIs',
    passed: compiledCode.includes('Tabs.TabList') && 
            compiledCode.includes('Tabs.Tab') &&
            compiledCode.includes('Tabs.TabPanels') &&
            compiledCode.includes('Tabs.TabPanel') &&
            compiledCode.includes('Accordion.Item') &&
            compiledCode.includes('Accordion.Trigger') &&
            compiledCode.includes('Modal.Content') &&
            compiledCode.includes('Modal.Header'),
    error: !compiledCode.includes('Tabs.TabList')
      ? 'Should attach TabList to Tabs component'
      : !compiledCode.includes('Tabs.Tab')
      ? 'Should attach Tab to Tabs component'
      : !compiledCode.includes('Accordion.Item')
      ? 'Should attach Item to Accordion component'
      : !compiledCode.includes('Modal.Content')
      ? 'Should attach Content to Modal component'
      : 'Should properly attach all sub-components to their parent components',
    executionTime: 1,
  });

  // Test 8: Context validation and error handling
  tests.push({
    name: 'Context hooks implement proper validation and error handling',
    passed: (compiledCode.match(/throw.*error/gi) || []).length >= 2 && 
            compiledCode.includes('useContext') &&
            (compiledCode.includes('must be used within') || compiledCode.includes('provider')) &&
            compiledCode.includes('useTabsContext') &&
            compiledCode.includes('useAccordionContext') &&
            compiledCode.includes('useModalContext'),
    error: !(compiledCode.match(/throw.*error/gi) || []).length >= 2
      ? 'Context hooks should throw errors when used outside providers'
      : !compiledCode.includes('useContext')
      ? 'Should use useContext for accessing context values'
      : !(compiledCode.includes('must be used within') || compiledCode.includes('provider'))
      ? 'Error messages should mention provider requirement'
      : 'Should implement proper context validation in all hooks',
    executionTime: 1,
  });

  // Test 9: Controlled vs uncontrolled patterns
  tests.push({
    name: 'Components support both controlled and uncontrolled modes',
    passed: compiledCode.includes('controlledActiveTab') && 
            compiledCode.includes('defaultActiveTab') &&
            compiledCode.includes('controlledItems') &&
            compiledCode.includes('defaultItems') &&
            compiledCode.includes('onTabChange') &&
            compiledCode.includes('onItemsChange') &&
            (compiledCode.includes('??') || compiledCode.includes('undefined')),
    error: !compiledCode.includes('controlledActiveTab')
      ? 'Should support controlled activeTab prop in Tabs'
      : !compiledCode.includes('defaultActiveTab')
      ? 'Should support defaultActiveTab prop in Tabs'
      : !compiledCode.includes('controlledItems')
      ? 'Should support controlled items prop in Accordion'
      : !compiledCode.includes('onTabChange')
      ? 'Should provide onTabChange callback'
      : !(compiledCode.includes('??') || compiledCode.includes('undefined'))
      ? 'Should use nullish coalescing or undefined checks for controlled/uncontrolled logic'
      : 'Should implement both controlled and uncontrolled patterns',
    executionTime: 1,
  });

  // Test 10: Accessibility implementation
  tests.push({
    name: 'Components implement comprehensive accessibility features',
    passed: compiledCode.includes('role="tab"') && 
            compiledCode.includes('role="tablist"') &&
            compiledCode.includes('role="tabpanel"') &&
            compiledCode.includes('aria-selected') &&
            compiledCode.includes('aria-expanded') &&
            compiledCode.includes('aria-controls') &&
            compiledCode.includes('aria-labelledby') &&
            compiledCode.includes('tabIndex'),
    error: !compiledCode.includes('role="tab"')
      ? 'Should implement proper ARIA roles for tabs'
      : !compiledCode.includes('aria-selected')
      ? 'Should implement aria-selected for tabs'
      : !compiledCode.includes('aria-expanded')
      ? 'Should implement aria-expanded for accordion'
      : !compiledCode.includes('aria-controls')
      ? 'Should implement aria-controls for proper labeling'
      : !compiledCode.includes('tabIndex')
      ? 'Should manage tabIndex for keyboard navigation'
      : 'Should implement comprehensive accessibility features',
    executionTime: 1,
  });

  // Test 11: Event handling and interactions
  tests.push({
    name: 'Components handle keyboard and mouse interactions properly',
    passed: compiledCode.includes('onClick') && 
            compiledCode.includes('onKeyDown') &&
            (compiledCode.includes('Enter') || compiledCode.includes('Space')) &&
            compiledCode.includes('ArrowRight') &&
            compiledCode.includes('preventDefault') &&
            compiledCode.includes('stopPropagation') &&
            (compiledCode.includes('focus') || compiledCode.includes('blur')),
    error: !compiledCode.includes('onClick')
      ? 'Should handle click events'
      : !compiledCode.includes('onKeyDown')
      ? 'Should handle keyboard events'
      : !(compiledCode.includes('Enter') || compiledCode.includes('Space'))
      ? 'Should handle Enter and Space keys for activation'
      : !compiledCode.includes('ArrowRight')
      ? 'Should handle arrow keys for navigation'
      : !compiledCode.includes('preventDefault')
      ? 'Should prevent default behavior for keyboard events'
      : 'Should implement comprehensive event handling',
    executionTime: 1,
  });

  // Test 12: State management and updates
  tests.push({
    name: 'Components properly manage internal state and updates',
    passed: compiledCode.includes('useState') && 
            compiledCode.includes('useCallback') &&
            compiledCode.includes('setActiveTab') &&
            compiledCode.includes('toggleItem') &&
            (compiledCode.match(/useState/g) || []).length >= 3 &&
            (compiledCode.match(/useCallback/g) || []).length >= 5,
    error: !compiledCode.includes('useState')
      ? 'Should use useState for state management'
      : !compiledCode.includes('useCallback')
      ? 'Should use useCallback for event handlers'
      : !compiledCode.includes('setActiveTab')
      ? 'Should implement setActiveTab function'
      : !compiledCode.includes('toggleItem')
      ? 'Should implement toggleItem function'
      : 'Should implement proper state management with multiple useState and useCallback hooks',
    executionTime: 1,
  });

  // Test 13: Generic compound component utilities
  const createCompoundCode = extractCode(compiledCode, 'createCompoundComponent');
  tests.push({
    name: 'Generic compound component utilities provide reusable patterns',
    passed: createCompoundCode.includes('displayName') && 
            createCompoundCode.includes('subComponents') &&
            createCompoundCode.includes('Object.entries') &&
            createCompoundCode.includes('Component') &&
            !createCompoundCode.includes('TODO') &&
            createCompoundCode.length > 200,
    error: !createCompoundCode.includes('displayName')
      ? 'createCompoundComponent should set displayName'
      : !createCompoundCode.includes('subComponents')
      ? 'createCompoundComponent should handle subComponents'
      : !createCompoundCode.includes('Object.entries')
      ? 'createCompoundComponent should iterate over subComponents'
      : createCompoundCode.includes('TODO')
      ? 'createCompoundComponent still contains TODO comments'
      : 'createCompoundComponent needs substantial implementation',
    executionTime: 1,
  });

  // Test 14: Children validation utilities
  const validateChildrenCode = extractCode(compiledCode, 'validateCompoundChildren');
  tests.push({
    name: 'Children validation utilities ensure proper compound component usage',
    passed: validateChildrenCode.includes('React.Children.map') && 
            validateChildrenCode.includes('isValidElement') &&
            validateChildrenCode.includes('displayName') &&
            validateChildrenCode.includes('allowedTypes') &&
            (validateChildrenCode.includes('console.warn') || validateChildrenCode.includes('warn')) &&
            !validateChildrenCode.includes('TODO') &&
            validateChildrenCode.length > 150,
    error: !validateChildrenCode.includes('React.Children.map')
      ? 'validateCompoundChildren should use React.Children.map'
      : !validateChildrenCode.includes('isValidElement')
      ? 'validateCompoundChildren should check for valid React elements'
      : !validateChildrenCode.includes('displayName')
      ? 'validateCompoundChildren should check component displayName'
      : !validateChildrenCode.includes('allowedTypes')
      ? 'validateCompoundChildren should validate against allowedTypes'
      : validateChildrenCode.includes('TODO')
      ? 'validateCompoundChildren still contains TODO comments'
      : 'validateCompoundChildren needs substantial implementation',
    executionTime: 1,
  });

  // Test 15: Enhanced children utilities
  const enhanceChildrenCode = extractCode(compiledCode, 'enhanceChildren');
  tests.push({
    name: 'Enhanced children utilities provide flexible child manipulation',
    passed: enhanceChildrenCode.includes('React.Children.map') && 
            enhanceChildrenCode.includes('isValidElement') &&
            enhanceChildrenCode.includes('cloneElement') &&
            enhanceChildrenCode.includes('enhancements') &&
            !enhanceChildrenCode.includes('TODO') &&
            enhanceChildrenCode.length > 100,
    error: !enhanceChildrenCode.includes('React.Children.map')
      ? 'enhanceChildren should use React.Children.map'
      : !enhanceChildrenCode.includes('isValidElement')
      ? 'enhanceChildren should check for valid React elements'
      : !enhanceChildrenCode.includes('cloneElement')
      ? 'enhanceChildren should use cloneElement for prop injection'
      : !enhanceChildrenCode.includes('enhancements')
      ? 'enhanceChildren should apply enhancements to children'
      : enhanceChildrenCode.includes('TODO')
      ? 'enhanceChildren still contains TODO comments'
      : 'enhanceChildren needs proper implementation',
    executionTime: 1,
  });

  // Test 16: Demo component integration
  const demoCode = extractCode(compiledCode, 'CompoundComponentsDemo');
  tests.push({
    name: 'Demo component showcases all compound components with interactive examples',
    passed: demoCode.includes('<Tabs') && 
            demoCode.includes('<Accordion') &&
            demoCode.includes('<Modal') &&
            demoCode.includes('useState') &&
            demoCode.includes('activeTab') &&
            demoCode.includes('modalOpen') &&
            demoCode.includes('accordionItems') &&
            demoCode.length > 1000,
    error: !demoCode.includes('<Tabs')
      ? 'Demo should include Tabs component usage'
      : !demoCode.includes('<Accordion')
      ? 'Demo should include Accordion component usage'
      : !demoCode.includes('<Modal')
      ? 'Demo should include Modal component usage'
      : !demoCode.includes('useState')
      ? 'Demo should use useState for interactive examples'
      : !demoCode.includes('activeTab')
      ? 'Demo should manage activeTab state'
      : 'Demo component needs substantial implementation showcasing all features',
    executionTime: 1,
  });

  return tests;
}