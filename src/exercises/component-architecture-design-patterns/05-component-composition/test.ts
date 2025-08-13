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

  // Test 1: Layout System Implementation
  const layoutCode = extractCode(compiledCode, 'Layout');
  tests.push({
    name: 'Layout component implements context-based layout system',
    passed: layoutCode.includes('createContext') &&
            layoutCode.includes('direction') &&
            layoutCode.includes('spacing') &&
            layoutCode.includes('Provider') &&
            !layoutCode.includes('TODO') &&
            layoutCode.length > 200,
    error: !layoutCode.includes('createContext')
      ? 'Layout should use createContext for layout configuration'
      : !layoutCode.includes('direction')
      ? 'Layout should support direction prop (horizontal/vertical/grid)'
      : !layoutCode.includes('spacing')
      ? 'Layout should support spacing prop'
      : !layoutCode.includes('Provider')
      ? 'Layout should provide context to child components'
      : layoutCode.includes('TODO')
      ? 'Layout still contains TODO comments'
      : 'Layout needs proper implementation with context and configuration',
    executionTime: 1,
  });

  // Test 2: Layout.Item Implementation
  const layoutItemCode = extractCode(compiledCode, 'LayoutItem');
  tests.push({
    name: 'Layout.Item component uses layout context',
    passed: layoutItemCode.includes('useLayoutContext') &&
            layoutItemCode.includes('flex') &&
            !layoutItemCode.includes('TODO') &&
            layoutItemCode.length > 100,
    error: !layoutItemCode.includes('useLayoutContext')
      ? 'Layout.Item should use useLayoutContext hook'
      : !layoutItemCode.includes('flex')
      ? 'Layout.Item should support flex properties'
      : layoutItemCode.includes('TODO')
      ? 'Layout.Item still contains TODO comments'
      : 'Layout.Item needs proper implementation with context awareness',
    executionTime: 1,
  });

  // Test 3: Provider Composition Implementation
  const providerComposerCode = extractCode(compiledCode, 'ProviderComposer');
  tests.push({
    name: 'ProviderComposer implements provider composition utility',
    passed: providerComposerCode.includes('providers') &&
            providerComposerCode.includes('reduce') &&
            providerComposerCode.includes('Provider') &&
            !providerComposerCode.includes('TODO') &&
            providerComposerCode.length > 50,
    error: !providerComposerCode.includes('providers')
      ? 'ProviderComposer should accept providers array'
      : !providerComposerCode.includes('reduce')
      ? 'ProviderComposer should use reduce to compose providers'
      : !providerComposerCode.includes('Provider')
      ? 'ProviderComposer should render Provider components'
      : providerComposerCode.includes('TODO')
      ? 'ProviderComposer still contains TODO comments'
      : 'ProviderComposer needs proper implementation',
    executionTime: 1,
  });

  // Test 4: HOC Composition Implementation
  const composeHOCsCode = extractCode(compiledCode, 'composeHOCs');
  tests.push({
    name: 'composeHOCs implements HOC composition utility',
    passed: composeHOCsCode.includes('hocs') &&
            composeHOCsCode.includes('reduce') &&
            composeHOCsCode.includes('displayName') &&
            !composeHOCsCode.includes('TODO') &&
            composeHOCsCode.length > 100,
    error: !composeHOCsCode.includes('hocs')
      ? 'composeHOCs should accept hocs array parameter'
      : !composeHOCsCode.includes('reduce')
      ? 'composeHOCs should use reduce to compose HOCs'
      : !composeHOCsCode.includes('displayName')
      ? 'composeHOCs should preserve component displayName'
      : composeHOCsCode.includes('TODO')
      ? 'composeHOCs still contains TODO comments'
      : 'composeHOCs needs proper implementation with displayName handling',
    executionTime: 1,
  });

  // Test 5: Slot System Implementation
  const slotProviderCode = extractCode(compiledCode, 'SlotProvider');
  tests.push({
    name: 'SlotProvider implements slot-based composition system',
    passed: slotProviderCode.includes('useState') &&
            slotProviderCode.includes('Map') &&
            slotProviderCode.includes('setSlot') &&
            slotProviderCode.includes('removeSlot') &&
            !slotProviderCode.includes('TODO') &&
            slotProviderCode.length > 100,
    error: !slotProviderCode.includes('useState')
      ? 'SlotProvider should use useState for slot management'
      : !slotProviderCode.includes('Map')
      ? 'SlotProvider should use Map for slot storage'
      : !slotProviderCode.includes('setSlot')
      ? 'SlotProvider should provide setSlot function'
      : !slotProviderCode.includes('removeSlot')
      ? 'SlotProvider should provide removeSlot function'
      : slotProviderCode.includes('TODO')
      ? 'SlotProvider still contains TODO comments'
      : 'SlotProvider needs proper implementation',
    executionTime: 1,
  });

  // Test 6: Slot Component Implementation
  const slotCode = extractCode(compiledCode, 'Slot');
  tests.push({
    name: 'Slot component renders registered content with fallback support',
    passed: slotCode.includes('useSlotContext') &&
            slotCode.includes('slots.get') &&
            slotCode.includes('fallback') &&
            !slotCode.includes('TODO') &&
            slotCode.length > 50,
    error: !slotCode.includes('useSlotContext')
      ? 'Slot should use useSlotContext hook'
      : !slotCode.includes('slots.get')
      ? 'Slot should get content from slots map'
      : !slotCode.includes('fallback')
      ? 'Slot should support fallback content'
      : slotCode.includes('TODO')
      ? 'Slot still contains TODO comments'
      : 'Slot needs proper implementation',
    executionTime: 1,
  });

  // Test 7: SlotFill Component Implementation
  const slotFillCode = extractCode(compiledCode, 'SlotFill');
  tests.push({
    name: 'SlotFill component registers content for named slots',
    passed: slotFillCode.includes('useSlotContext') &&
            slotFillCode.includes('setSlot') &&
            slotFillCode.includes('useEffect') &&
            slotFillCode.includes('removeSlot') &&
            !slotFillCode.includes('TODO') &&
            slotFillCode.length > 50,
    error: !slotFillCode.includes('useSlotContext')
      ? 'SlotFill should use useSlotContext hook'
      : !slotFillCode.includes('setSlot')
      ? 'SlotFill should call setSlot to register content'
      : !slotFillCode.includes('useEffect')
      ? 'SlotFill should use useEffect for registration lifecycle'
      : !slotFillCode.includes('removeSlot')
      ? 'SlotFill should call removeSlot on unmount'
      : slotFillCode.includes('TODO')
      ? 'SlotFill still contains TODO comments'
      : 'SlotFill needs proper implementation',
    executionTime: 1,
  });

  // Test 8: Render Tracking Implementation
  const renderTrackerCode = extractCode(compiledCode, 'RenderTracker');
  tests.push({
    name: 'RenderTracker implements performance monitoring',
    passed: renderTrackerCode.includes('useRef') &&
            renderTrackerCode.includes('useEffect') &&
            renderTrackerCode.includes('renderCount') &&
            renderTrackerCode.includes('console') &&
            !renderTrackerCode.includes('TODO') &&
            renderTrackerCode.length > 100,
    error: !renderTrackerCode.includes('useRef')
      ? 'RenderTracker should use useRef for render counting'
      : !renderTrackerCode.includes('useEffect')
      ? 'RenderTracker should use useEffect to track renders'
      : !renderTrackerCode.includes('renderCount')
      ? 'RenderTracker should track render count'
      : !renderTrackerCode.includes('console')
      ? 'RenderTracker should log render information'
      : renderTrackerCode.includes('TODO')
      ? 'RenderTracker still contains TODO comments'
      : 'RenderTracker needs proper implementation',
    executionTime: 1,
  });

  // Test 9: Conditional Rendering Implementation
  const conditionalCode = extractCode(compiledCode, 'Conditional');
  tests.push({
    name: 'Conditional component supports function-based conditions and animation',
    passed: conditionalCode.includes('useState') &&
            conditionalCode.includes('useEffect') &&
            conditionalCode.includes('typeof when === \'function\'') &&
            conditionalCode.includes('animate') &&
            !conditionalCode.includes('TODO') &&
            conditionalCode.length > 100,
    error: !conditionalCode.includes('useState')
      ? 'Conditional should use useState for condition state'
      : !conditionalCode.includes('useEffect')
      ? 'Conditional should use useEffect to handle condition changes'
      : !conditionalCode.includes('typeof when === \'function\'')
      ? 'Conditional should support function-based conditions'
      : !conditionalCode.includes('animate')
      ? 'Conditional should support animation prop'
      : conditionalCode.includes('TODO')
      ? 'Conditional still contains TODO comments'
      : 'Conditional needs proper implementation',
    executionTime: 1,
  });

  // Test 10: Compound Tabs Implementation
  const tabsCode = extractCode(compiledCode, 'Tabs');
  tests.push({
    name: 'Tabs implements compound component pattern with context',
    passed: tabsCode.includes('createContext') &&
            tabsCode.includes('useState') &&
            tabsCode.includes('activeTab') &&
            tabsCode.includes('registerTab') &&
            !tabsCode.includes('TODO') &&
            tabsCode.length > 200,
    error: !tabsCode.includes('createContext')
      ? 'Tabs should use createContext for tab management'
      : !tabsCode.includes('useState')
      ? 'Tabs should use useState for tab state'
      : !tabsCode.includes('activeTab')
      ? 'Tabs should manage activeTab state'
      : !tabsCode.includes('registerTab')
      ? 'Tabs should provide registerTab function for dynamic tabs'
      : tabsCode.includes('TODO')
      ? 'Tabs still contains TODO comments'
      : 'Tabs needs proper compound component implementation',
    executionTime: 1,
  });

  // Test 11: Tab List Implementation
  const tabListCode = extractCode(compiledCode, 'TabList');
  tests.push({
    name: 'TabList renders tab buttons with accessibility',
    passed: tabListCode.includes('useTabsContext') &&
            tabListCode.includes('role="tablist"') &&
            tabListCode.includes('aria-selected') &&
            tabListCode.includes('setActiveTab') &&
            !tabListCode.includes('TODO') &&
            tabListCode.length > 100,
    error: !tabListCode.includes('useTabsContext')
      ? 'TabList should use useTabsContext hook'
      : !tabListCode.includes('role="tablist"')
      ? 'TabList should have proper ARIA role'
      : !tabListCode.includes('aria-selected')
      ? 'TabList should set aria-selected for accessibility'
      : !tabListCode.includes('setActiveTab')
      ? 'TabList should call setActiveTab on click'
      : tabListCode.includes('TODO')
      ? 'TabList still contains TODO comments'
      : 'TabList needs proper implementation with accessibility',
    executionTime: 1,
  });

  // Test 12: Tab Panels Implementation
  const tabPanelsCode = extractCode(compiledCode, 'TabPanels');
  tests.push({
    name: 'TabPanels renders active tab content with proper ARIA attributes',
    passed: tabPanelsCode.includes('useTabsContext') &&
            tabPanelsCode.includes('activeTab') &&
            tabPanelsCode.includes('role="tabpanel"') &&
            !tabPanelsCode.includes('TODO') &&
            tabPanelsCode.length > 50,
    error: !tabPanelsCode.includes('useTabsContext')
      ? 'TabPanels should use useTabsContext hook'
      : !tabPanelsCode.includes('activeTab')
      ? 'TabPanels should get activeTab from context'
      : !tabPanelsCode.includes('role="tabpanel"')
      ? 'TabPanels should have proper ARIA role'
      : tabPanelsCode.includes('TODO')
      ? 'TabPanels still contains TODO comments'
      : 'TabPanels needs proper implementation',
    executionTime: 1,
  });

  // Test 13: Component Composition Architecture
  tests.push({
    name: 'Layout.Item is properly attached to Layout component',
    passed: compiledCode.includes('Layout.Item = LayoutItem'),
    error: 'Layout.Item should be attached to Layout component for compound component pattern',
    executionTime: 1,
  });

  tests.push({
    name: 'Tabs sub-components are properly attached',
    passed: compiledCode.includes('Tabs.List') &&
            compiledCode.includes('Tabs.Panels') &&
            compiledCode.includes('Tabs.Panel'),
    error: 'Tabs.List, Tabs.Panels, and Tabs.Panel should be attached to Tabs component',
    executionTime: 1,
  });

  // Test 14: Error Handling and Context Validation
  tests.push({
    name: 'Context hooks include proper error handling',
    passed: (compiledCode.includes('useLayoutContext') && compiledCode.includes('throw new Error')) &&
            (compiledCode.includes('useSlotContext') && compiledCode.includes('throw new Error')) &&
            (compiledCode.includes('useTabsContext') && compiledCode.includes('throw new Error')),
    error: 'All context hooks should validate context availability and throw descriptive errors',
    executionTime: 1,
  });

  // Test 15: Export Structure
  tests.push({
    name: 'All components are properly exported',
    passed: compiledCode.includes('export {') &&
            compiledCode.includes('Layout') &&
            compiledCode.includes('ProviderComposer') &&
            compiledCode.includes('composeHOCs') &&
            compiledCode.includes('SlotProvider') &&
            compiledCode.includes('Tabs'),
    error: 'All major components should be exported for external use',
    executionTime: 1,
  });

  return tests;
}