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

  // Test 1: useVirtualScroll hook implementation
  const useVirtualScrollCode = extractCode(compiledCode, 'useVirtualScroll');
  tests.push({
    name: 'useVirtualScroll hook efficiently calculates visible ranges',
    passed: useVirtualScrollCode.includes('startIndex') && 
            useVirtualScrollCode.includes('endIndex') &&
            useVirtualScrollCode.includes('Math.floor') &&
            useVirtualScrollCode.includes('Math.ceil') &&
            useVirtualScrollCode.includes('scrollTop') &&
            useVirtualScrollCode.includes('itemHeight') &&
            useVirtualScrollCode.includes('overscan') &&
            !useVirtualScrollCode.includes('TODO') &&
            useVirtualScrollCode.length > 600,
    error: !useVirtualScrollCode.includes('startIndex')
      ? 'useVirtualScroll should calculate startIndex for visible range'
      : !useVirtualScrollCode.includes('endIndex')
      ? 'useVirtualScroll should calculate endIndex for visible range'
      : !useVirtualScrollCode.includes('Math.floor')
      ? 'useVirtualScroll should use Math.floor for start index calculation'
      : !useVirtualScrollCode.includes('Math.ceil')
      ? 'useVirtualScroll should use Math.ceil for end index calculation'
      : !useVirtualScrollCode.includes('scrollTop')
      ? 'useVirtualScroll should track scrollTop position'
      : !useVirtualScrollCode.includes('overscan')
      ? 'useVirtualScroll should implement overscan for smooth scrolling'
      : useVirtualScrollCode.includes('TODO')
      ? 'useVirtualScroll still contains TODO comments - needs implementation'
      : 'useVirtualScroll needs substantial implementation with range calculations',
    executionTime: 1,
  });

  // Test 2: Virtual scroll performance monitoring
  const useVirtualScrollPerfCode = extractCode(compiledCode, 'useVirtualScrollPerformance');
  tests.push({
    name: 'useVirtualScrollPerformance tracks rendering and scroll metrics',
    passed: useVirtualScrollPerfCode.includes('performance.now') && 
            useVirtualScrollPerfCode.includes('renderTime') &&
            useVirtualScrollPerfCode.includes('startMeasurement') &&
            useVirtualScrollPerfCode.includes('endMeasurement') &&
            useVirtualScrollPerfCode.includes('useState') &&
            !useVirtualScrollPerfCode.includes('TODO') &&
            useVirtualScrollPerfCode.length > 300,
    error: !useVirtualScrollPerfCode.includes('performance.now')
      ? 'useVirtualScrollPerformance should use performance.now for timing'
      : !useVirtualScrollPerfCode.includes('renderTime')
      ? 'useVirtualScrollPerformance should track renderTime metrics'
      : !useVirtualScrollPerfCode.includes('startMeasurement')
      ? 'useVirtualScrollPerformance should provide startMeasurement function'
      : !useVirtualScrollPerfCode.includes('endMeasurement')
      ? 'useVirtualScrollPerformance should provide endMeasurement function'
      : useVirtualScrollPerfCode.includes('TODO')
      ? 'useVirtualScrollPerformance still contains TODO comments - needs implementation'
      : 'useVirtualScrollPerformance needs substantial implementation with performance tracking',
    executionTime: 1,
  });

  // Test 3: VirtualList component implementation
  const virtualListCode = extractCode(compiledCode, 'VirtualList');
  tests.push({
    name: 'VirtualList renders only visible items with proper positioning',
    passed: virtualListCode.includes('useVirtualScroll') && 
            virtualListCode.includes('startIndex') &&
            virtualListCode.includes('endIndex') &&
            virtualListCode.includes('slice') &&
            virtualListCode.includes('getItemStyle') &&
            virtualListCode.includes('onScroll') &&
            virtualListCode.includes('position: \'absolute\'') &&
            !virtualListCode.includes('TODO') &&
            virtualListCode.length > 500,
    error: !virtualListCode.includes('useVirtualScroll')
      ? 'VirtualList should use useVirtualScroll hook'
      : !virtualListCode.includes('slice')
      ? 'VirtualList should slice items array for visible range'
      : !virtualListCode.includes('getItemStyle')
      ? 'VirtualList should use getItemStyle for item positioning'
      : !virtualListCode.includes('onScroll')
      ? 'VirtualList should handle scroll events'
      : !virtualListCode.includes('position: \'absolute\'')
      ? 'VirtualList should use absolute positioning for items'
      : virtualListCode.includes('TODO')
      ? 'VirtualList still contains TODO comments - needs implementation'
      : 'VirtualList needs substantial implementation with virtual rendering',
    executionTime: 1,
  });

  // Test 4: WindowedGrid 2D virtualization
  const windowedGridCode = extractCode(compiledCode, 'WindowedGrid');
  tests.push({
    name: 'WindowedGrid implements 2D virtualization for grid layouts',
    passed: windowedGridCode.includes('visibleRowStart') && 
            windowedGridCode.includes('visibleRowEnd') &&
            windowedGridCode.includes('visibleColumnStart') &&
            windowedGridCode.includes('visibleColumnEnd') &&
            windowedGridCode.includes('rowHeight') &&
            windowedGridCode.includes('columnWidth') &&
            windowedGridCode.includes('scrollTop') &&
            windowedGridCode.includes('scrollLeft') &&
            !windowedGridCode.includes('TODO') &&
            windowedGridCode.length > 800,
    error: !windowedGridCode.includes('visibleRowStart')
      ? 'WindowedGrid should calculate visibleRowStart for vertical range'
      : !windowedGridCode.includes('visibleRowEnd')
      ? 'WindowedGrid should calculate visibleRowEnd for vertical range'
      : !windowedGridCode.includes('visibleColumnStart')
      ? 'WindowedGrid should calculate visibleColumnStart for horizontal range'
      : !windowedGridCode.includes('visibleColumnEnd')
      ? 'WindowedGrid should calculate visibleColumnEnd for horizontal range'
      : !windowedGridCode.includes('rowHeight')
      ? 'WindowedGrid should use rowHeight for positioning'
      : !windowedGridCode.includes('columnWidth')
      ? 'WindowedGrid should use columnWidth for positioning'
      : windowedGridCode.includes('TODO')
      ? 'WindowedGrid still contains TODO comments - needs implementation'
      : 'WindowedGrid needs substantial implementation with 2D virtualization',
    executionTime: 1,
  });

  // Test 5: InfiniteScroller combination with virtual scrolling
  const infiniteScrollerCode = extractCode(compiledCode, 'InfiniteScroller');
  tests.push({
    name: 'InfiniteScroller combines virtual scrolling with infinite loading',
    passed: infiniteScrollerCode.includes('useVirtualScroll') && 
            infiniteScrollerCode.includes('loadMore') &&
            infiniteScrollerCode.includes('hasMore') &&
            infiniteScrollerCode.includes('threshold') &&
            infiniteScrollerCode.includes('distanceFromBottom') &&
            infiniteScrollerCode.includes('scrollHeight') &&
            infiniteScrollerCode.includes('isLoading') &&
            !infiniteScrollerCode.includes('TODO') &&
            infiniteScrollerCode.length > 600,
    error: !infiniteScrollerCode.includes('useVirtualScroll')
      ? 'InfiniteScroller should use virtual scrolling'
      : !infiniteScrollerCode.includes('loadMore')
      ? 'InfiniteScroller should call loadMore function'
      : !infiniteScrollerCode.includes('hasMore')
      ? 'InfiniteScroller should check hasMore status'
      : !infiniteScrollerCode.includes('threshold')
      ? 'InfiniteScroller should use threshold for load trigger'
      : !infiniteScrollerCode.includes('distanceFromBottom')
      ? 'InfiniteScroller should calculate distanceFromBottom'
      : !infiniteScrollerCode.includes('scrollHeight')
      ? 'InfiniteScroller should use scrollHeight for distance calculation'
      : infiniteScrollerCode.includes('TODO')
      ? 'InfiniteScroller still contains TODO comments - needs implementation'
      : 'InfiniteScroller needs substantial implementation combining virtual scrolling and infinite loading',
    executionTime: 1,
  });

  // Test 6: Performance benchmark implementation
  const performanceBenchmarkCode = extractCode(compiledCode, 'PerformanceBenchmark');
  tests.push({
    name: 'PerformanceBenchmark measures virtual scrolling performance',
    passed: performanceBenchmarkCode.includes('runBenchmark') && 
            performanceBenchmarkCode.includes('performance.now') &&
            performanceBenchmarkCode.includes('renderTime') &&
            performanceBenchmarkCode.includes('itemCount') &&
            performanceBenchmarkCode.includes('results') &&
            !performanceBenchmarkCode.includes('TODO') &&
            performanceBenchmarkCode.length > 300,
    error: !performanceBenchmarkCode.includes('runBenchmark')
      ? 'PerformanceBenchmark should implement runBenchmark function'
      : !performanceBenchmarkCode.includes('performance.now')
      ? 'PerformanceBenchmark should use performance.now for timing'
      : !performanceBenchmarkCode.includes('renderTime')
      ? 'PerformanceBenchmark should measure renderTime'
      : !performanceBenchmarkCode.includes('itemCount')
      ? 'PerformanceBenchmark should test different itemCount configurations'
      : performanceBenchmarkCode.includes('TODO')
      ? 'PerformanceBenchmark still contains TODO comments - needs implementation'
      : 'PerformanceBenchmark needs substantial implementation with performance testing',
    executionTime: 1,
  });

  // Test 7: Viewport calculations accuracy
  tests.push({
    name: 'Virtual scrolling implements accurate viewport calculations',
    passed: compiledCode.includes('Math.floor(scrollTop / itemHeight)') && 
            compiledCode.includes('Math.ceil') &&
            compiledCode.includes('containerHeight') &&
            (compiledCode.includes('overscan') || compiledCode.includes('buffer')),
    error: !compiledCode.includes('Math.floor(scrollTop / itemHeight)')
      ? 'Should use Math.floor(scrollTop / itemHeight) for start index calculation'
      : !compiledCode.includes('Math.ceil')
      ? 'Should use Math.ceil for end index calculation'
      : !compiledCode.includes('containerHeight')
      ? 'Should use containerHeight in viewport calculations'
      : 'Should implement overscan/buffer for smooth scrolling',
    executionTime: 1,
  });

  // Test 8: Item positioning and styling
  tests.push({
    name: 'Components properly position virtual items with absolute positioning',
    passed: compiledCode.includes('position: \'absolute\'') && 
            compiledCode.includes('top:') &&
            compiledCode.includes('height:') &&
            (compiledCode.includes('index * itemHeight') || compiledCode.includes('index * rowHeight')),
    error: !compiledCode.includes('position: \'absolute\'')
      ? 'Virtual items should use absolute positioning'
      : !compiledCode.includes('top:')
      ? 'Virtual items should have top positioning'
      : !compiledCode.includes('height:')
      ? 'Virtual items should have height styling'
      : 'Should calculate item position based on index and item height',
    executionTime: 1,
  });

  // Test 9: Scroll event handling optimization
  tests.push({
    name: 'Components optimize scroll event handling for performance',
    passed: compiledCode.includes('onScroll') && 
            compiledCode.includes('useCallback') &&
            compiledCode.includes('scrollTop') &&
            (compiledCode.includes('scrollLeft') || compiledCode.includes('WindowedGrid')),
    error: !compiledCode.includes('onScroll')
      ? 'Components should handle scroll events'
      : !compiledCode.includes('useCallback')
      ? 'Scroll handlers should use useCallback for optimization'
      : !compiledCode.includes('scrollTop')
      ? 'Should track scrollTop position'
      : 'Grid components should also handle scrollLeft for 2D scrolling',
    executionTime: 1,
  });

  // Test 10: Large dataset handling efficiency
  tests.push({
    name: 'Virtual scrolling handles large datasets efficiently',
    passed: compiledCode.includes('useMemo') && 
            compiledCode.includes('slice') &&
            (compiledCode.includes('10000') || compiledCode.includes('50000') || compiledCode.includes('100000')) &&
            !compiledCode.includes('items.map((item, index) => {') || 
            compiledCode.includes('visibleItems.map'),
    error: !compiledCode.includes('useMemo')
      ? 'Should use useMemo for expensive calculations'
      : !compiledCode.includes('slice')
      ? 'Should slice items array to render only visible items'
      : !(compiledCode.includes('10000') || compiledCode.includes('50000') || compiledCode.includes('100000'))
      ? 'Should demonstrate handling of large datasets (10k+ items)'
      : 'Should not render all items - only visible items should be rendered',
    executionTime: 1,
  });

  // Test 11: Infinite loading integration
  tests.push({
    name: 'Infinite scrolling properly integrates loading states and thresholds',
    passed: compiledCode.includes('loadMore') && 
            compiledCode.includes('hasMore') &&
            compiledCode.includes('isLoading') &&
            compiledCode.includes('threshold') &&
            compiledCode.includes('distanceFromBottom'),
    error: !compiledCode.includes('loadMore')
      ? 'Should implement loadMore functionality'
      : !compiledCode.includes('hasMore')
      ? 'Should track hasMore state for end-of-data detection'
      : !compiledCode.includes('isLoading')
      ? 'Should track isLoading state'
      : !compiledCode.includes('threshold')
      ? 'Should use threshold for load trigger distance'
      : 'Should calculate distanceFromBottom for load trigger',
    executionTime: 1,
  });

  // Test 12: Main demo component integration
  const demoCode = extractCode(compiledCode, 'VirtualScrollingDemo');
  tests.push({
    name: 'VirtualScrollingDemo integrates all virtual scrolling features',
    passed: demoCode.includes('VirtualList') && 
            demoCode.includes('WindowedGrid') &&
            demoCode.includes('InfiniteScroller') &&
            demoCode.includes('PerformanceBenchmark') &&
            demoCode.includes('selectedDemo') &&
            demoCode.includes('useState') &&
            (demoCode.includes('_jsx') || demoCode.includes('<')) &&
            demoCode.length > 800,
    error: !demoCode.includes('VirtualList')
      ? 'Demo should include VirtualList component'
      : !demoCode.includes('WindowedGrid')
      ? 'Demo should include WindowedGrid component'
      : !demoCode.includes('InfiniteScroller')
      ? 'Demo should include InfiniteScroller component'
      : !demoCode.includes('PerformanceBenchmark')
      ? 'Demo should include PerformanceBenchmark component'
      : !demoCode.includes('selectedDemo')
      ? 'Demo should allow switching between different virtual scrolling demos'
      : 'Demo component needs substantial implementation integrating all features',
    executionTime: 1,
  });

  // Test 13: Performance optimization patterns
  tests.push({
    name: 'Components implement performance optimization patterns',
    passed: (compiledCode.match(/useCallback/g) || []).length >= 3 && 
            (compiledCode.match(/useMemo/g) || []).length >= 2 &&
            compiledCode.includes('React.memo') || compiledCode.includes('memo('),
    error: (compiledCode.match(/useCallback/g) || []).length < 3
      ? 'Should use useCallback in multiple places for performance optimization'
      : (compiledCode.match(/useMemo/g) || []).length < 2
      ? 'Should use useMemo for expensive calculations'
      : 'Should use React.memo for component optimization',
    executionTime: 1,
  });

  // Test 14: Grid virtualization calculations
  tests.push({
    name: 'Grid components correctly calculate 2D virtualization ranges',
    passed: compiledCode.includes('rowIndex') && 
            compiledCode.includes('columnIndex') &&
            compiledCode.includes('rowCount') &&
            compiledCode.includes('columnCount') &&
            (compiledCode.includes('Math.ceil(items.length / columnCount)') || 
             compiledCode.includes('Math.ceil') && compiledCode.includes('columnCount')),
    error: !compiledCode.includes('rowIndex')
      ? 'Grid should calculate rowIndex for items'
      : !compiledCode.includes('columnIndex')
      ? 'Grid should calculate columnIndex for items'
      : !compiledCode.includes('rowCount')
      ? 'Grid should calculate total rowCount'
      : !compiledCode.includes('columnCount')
      ? 'Grid should use columnCount for layout'
      : 'Should calculate rowCount based on items.length and columnCount',
    executionTime: 1,
  });

  // Test 15: Smooth scrolling and user experience
  tests.push({
    name: 'Virtual scrolling provides smooth user experience with proper feedback',
    passed: compiledCode.includes('isScrolling') && 
            (compiledCode.includes('Loading') || compiledCode.includes('loading')) &&
            compiledCode.includes('totalHeight') &&
            (compiledCode.includes('overscan') || compiledCode.includes('buffer')),
    error: !compiledCode.includes('isScrolling')
      ? 'Should track isScrolling state for user feedback'
      : !(compiledCode.includes('Loading') || compiledCode.includes('loading'))
      ? 'Should provide loading indicators for better user experience'
      : !compiledCode.includes('totalHeight')
      ? 'Should calculate totalHeight for proper scrollbar sizing'
      : 'Should implement overscan/buffer for smooth scrolling experience',
    executionTime: 1,
  });

  return tests;
}