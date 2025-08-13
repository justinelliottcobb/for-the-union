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

  // Test 1: usePerformanceMonitor hook implementation
  const usePerformanceMonitorCode = extractCode(compiledCode, 'usePerformanceMonitor');
  tests.push({
    name: 'usePerformanceMonitor hook implements comprehensive performance tracking',
    passed: usePerformanceMonitorCode.includes('PerformanceObserver') && 
            usePerformanceMonitorCode.includes('startMonitoring') &&
            usePerformanceMonitorCode.includes('stopMonitoring') &&
            usePerformanceMonitorCode.includes('addCustomMetric') &&
            usePerformanceMonitorCode.includes('measureFunction') &&
            usePerformanceMonitorCode.includes('largest-contentful-paint') &&
            usePerformanceMonitorCode.includes('first-input') &&
            usePerformanceMonitorCode.includes('layout-shift') &&
            usePerformanceMonitorCode.includes('performance.memory') &&
            !usePerformanceMonitorCode.includes('TODO') &&
            usePerformanceMonitorCode.length > 1500,
    error: !usePerformanceMonitorCode.includes('PerformanceObserver')
      ? 'usePerformanceMonitor should use PerformanceObserver for Web Vitals tracking'
      : !usePerformanceMonitorCode.includes('startMonitoring')
      ? 'usePerformanceMonitor should implement startMonitoring function'
      : !usePerformanceMonitorCode.includes('stopMonitoring')
      ? 'usePerformanceMonitor should implement stopMonitoring function'
      : !usePerformanceMonitorCode.includes('addCustomMetric')
      ? 'usePerformanceMonitor should implement addCustomMetric function'
      : !usePerformanceMonitorCode.includes('measureFunction')
      ? 'usePerformanceMonitor should implement measureFunction decorator'
      : !usePerformanceMonitorCode.includes('largest-contentful-paint')
      ? 'usePerformanceMonitor should monitor LCP (largest-contentful-paint)'
      : !usePerformanceMonitorCode.includes('first-input')
      ? 'usePerformanceMonitor should monitor FID (first-input)'
      : !usePerformanceMonitorCode.includes('layout-shift')
      ? 'usePerformanceMonitor should monitor CLS (layout-shift)'
      : !usePerformanceMonitorCode.includes('performance.memory')
      ? 'usePerformanceMonitor should monitor memory usage'
      : usePerformanceMonitorCode.includes('TODO')
      ? 'usePerformanceMonitor still contains TODO comments - needs implementation'
      : 'usePerformanceMonitor needs substantial implementation with monitoring logic',
    executionTime: 1,
  });

  // Test 2: PerformanceMonitor component implementation
  const performanceMonitorCode = extractCode(compiledCode, 'PerformanceMonitor');
  tests.push({
    name: 'PerformanceMonitor component provides comprehensive monitoring dashboard',
    passed: performanceMonitorCode.includes('usePerformanceMonitor') && 
            performanceMonitorCode.includes('calculatePerformanceScore') &&
            performanceMonitorCode.includes('getMetricStatus') &&
            performanceMonitorCode.includes('Core Web Vitals') &&
            performanceMonitorCode.includes('LCP') &&
            performanceMonitorCode.includes('FID') &&
            performanceMonitorCode.includes('CLS') &&
            performanceMonitorCode.includes('Memory Usage') &&
            performanceMonitorCode.includes('Network Performance') &&
            !performanceMonitorCode.includes('TODO') &&
            performanceMonitorCode.length > 1200,
    error: !performanceMonitorCode.includes('usePerformanceMonitor')
      ? 'PerformanceMonitor should use usePerformanceMonitor hook'
      : !performanceMonitorCode.includes('calculatePerformanceScore')
      ? 'PerformanceMonitor should calculate performance scores'
      : !performanceMonitorCode.includes('getMetricStatus')
      ? 'PerformanceMonitor should evaluate metric status against budgets'
      : !performanceMonitorCode.includes('Core Web Vitals')
      ? 'PerformanceMonitor should display Core Web Vitals section'
      : !performanceMonitorCode.includes('Memory Usage')
      ? 'PerformanceMonitor should display memory usage metrics'
      : !performanceMonitorCode.includes('Network Performance')
      ? 'PerformanceMonitor should display network performance metrics'
      : performanceMonitorCode.includes('TODO')
      ? 'PerformanceMonitor still contains TODO comments - needs implementation'
      : 'PerformanceMonitor needs substantial implementation with dashboard interface',
    executionTime: 1,
  });

  // Test 3: useMemoryProfiler hook implementation
  const useMemoryProfilerCode = extractCode(compiledCode, 'useMemoryProfiler');
  tests.push({
    name: 'useMemoryProfiler implements memory analysis and leak detection',
    passed: useMemoryProfilerCode.includes('startProfiling') && 
            useMemoryProfilerCode.includes('stopProfiling') &&
            useMemoryProfilerCode.includes('analyzeMemoryUsage') &&
            useMemoryProfilerCode.includes('memoryStats') &&
            useMemoryProfilerCode.includes('memoryHistory') &&
            useMemoryProfilerCode.includes('usedJSHeapSize') &&
            useMemoryProfilerCode.includes('totalJSHeapSize') &&
            useMemoryProfilerCode.includes('jsHeapSizeLimit') &&
            useMemoryProfilerCode.includes('setInterval') &&
            !useMemoryProfilerCode.includes('TODO') &&
            useMemoryProfilerCode.length > 800,
    error: !useMemoryProfilerCode.includes('startProfiling')
      ? 'useMemoryProfiler should implement startProfiling function'
      : !useMemoryProfilerCode.includes('stopProfiling')
      ? 'useMemoryProfiler should implement stopProfiling function'
      : !useMemoryProfilerCode.includes('analyzeMemoryUsage')
      ? 'useMemoryProfiler should implement analyzeMemoryUsage function'
      : !useMemoryProfilerCode.includes('memoryStats')
      ? 'useMemoryProfiler should track memory statistics'
      : !useMemoryProfilerCode.includes('memoryHistory')
      ? 'useMemoryProfiler should maintain memory usage history'
      : !useMemoryProfilerCode.includes('usedJSHeapSize')
      ? 'useMemoryProfiler should track used heap size'
      : !useMemoryProfilerCode.includes('setInterval')
      ? 'useMemoryProfiler should use setInterval for periodic monitoring'
      : useMemoryProfilerCode.includes('TODO')
      ? 'useMemoryProfiler still contains TODO comments - needs implementation'
      : 'useMemoryProfiler needs substantial implementation with profiling logic',
    executionTime: 1,
  });

  // Test 4: MemoryProfiler component implementation
  const memoryProfilerCode = extractCode(compiledCode, 'MemoryProfiler');
  tests.push({
    name: 'MemoryProfiler component provides memory analysis interface',
    passed: memoryProfilerCode.includes('useMemoryProfiler') && 
            memoryProfilerCode.includes('formatBytes') &&
            memoryProfilerCode.includes('getUsagePercentage') &&
            memoryProfilerCode.includes('Memory Usage Trend') &&
            memoryProfilerCode.includes('Memory Analysis') &&
            memoryProfilerCode.includes('Used Heap') &&
            memoryProfilerCode.includes('Total Heap') &&
            memoryProfilerCode.includes('Heap Limit') &&
            memoryProfilerCode.includes('Recommendations') &&
            !memoryProfilerCode.includes('TODO') &&
            memoryProfilerCode.length > 800,
    error: !memoryProfilerCode.includes('useMemoryProfiler')
      ? 'MemoryProfiler should use useMemoryProfiler hook'
      : !memoryProfilerCode.includes('formatBytes')
      ? 'MemoryProfiler should implement formatBytes utility'
      : !memoryProfilerCode.includes('getUsagePercentage')
      ? 'MemoryProfiler should calculate usage percentage'
      : !memoryProfilerCode.includes('Memory Usage Trend')
      ? 'MemoryProfiler should display memory usage trends'
      : !memoryProfilerCode.includes('Memory Analysis')
      ? 'MemoryProfiler should provide memory analysis section'
      : !memoryProfilerCode.includes('Recommendations')
      ? 'MemoryProfiler should show optimization recommendations'
      : memoryProfilerCode.includes('TODO')
      ? 'MemoryProfiler still contains TODO comments - needs implementation'
      : 'MemoryProfiler needs substantial implementation with profiling interface',
    executionTime: 1,
  });

  // Test 5: useNetworkProfiler hook implementation
  const useNetworkProfilerCode = extractCode(compiledCode, 'useNetworkProfiler');
  tests.push({
    name: 'useNetworkProfiler implements network performance analysis',
    passed: useNetworkProfilerCode.includes('startNetworkProfiling') && 
            useNetworkProfilerCode.includes('analyzeNetworkPerformance') &&
            useNetworkProfilerCode.includes('networkMetrics') &&
            useNetworkProfilerCode.includes('connectionInfo') &&
            useNetworkProfilerCode.includes('getEntriesByType') &&
            useNetworkProfilerCode.includes('resource') &&
            useNetworkProfilerCode.includes('navigation') &&
            useNetworkProfilerCode.includes('bottlenecks') &&
            useNetworkProfilerCode.includes('recommendations') &&
            !useNetworkProfilerCode.includes('TODO') &&
            useNetworkProfilerCode.length > 800,
    error: !useNetworkProfilerCode.includes('startNetworkProfiling')
      ? 'useNetworkProfiler should implement startNetworkProfiling function'
      : !useNetworkProfilerCode.includes('analyzeNetworkPerformance')
      ? 'useNetworkProfiler should implement analyzeNetworkPerformance function'
      : !useNetworkProfilerCode.includes('networkMetrics')
      ? 'useNetworkProfiler should track network metrics'
      : !useNetworkProfilerCode.includes('connectionInfo')
      ? 'useNetworkProfiler should collect connection information'
      : !useNetworkProfilerCode.includes('getEntriesByType')
      ? 'useNetworkProfiler should use performance.getEntriesByType'
      : !useNetworkProfilerCode.includes('resource')
      ? 'useNetworkProfiler should analyze resource timing'
      : !useNetworkProfilerCode.includes('navigation')
      ? 'useNetworkProfiler should analyze navigation timing'
      : !useNetworkProfilerCode.includes('bottlenecks')
      ? 'useNetworkProfiler should identify performance bottlenecks'
      : useNetworkProfilerCode.includes('TODO')
      ? 'useNetworkProfiler still contains TODO comments - needs implementation'
      : 'useNetworkProfiler needs substantial implementation with analysis logic',
    executionTime: 1,
  });

  // Test 6: NetworkProfiler component implementation
  const networkProfilerCode = extractCode(compiledCode, 'NetworkProfiler');
  tests.push({
    name: 'NetworkProfiler component provides network analysis interface',
    passed: networkProfilerCode.includes('useNetworkProfiler') && 
            networkProfilerCode.includes('formatSize') &&
            networkProfilerCode.includes('getTotalStats') &&
            networkProfilerCode.includes('Connection Information') &&
            networkProfilerCode.includes('Network Statistics') &&
            networkProfilerCode.includes('Resource Timing') &&
            networkProfilerCode.includes('Performance Analysis') &&
            networkProfilerCode.includes('effectiveType') &&
            networkProfilerCode.includes('downlink') &&
            networkProfilerCode.includes('rtt') &&
            !networkProfilerCode.includes('TODO') &&
            networkProfilerCode.length > 1000,
    error: !networkProfilerCode.includes('useNetworkProfiler')
      ? 'NetworkProfiler should use useNetworkProfiler hook'
      : !networkProfilerCode.includes('formatSize')
      ? 'NetworkProfiler should implement formatSize utility'
      : !networkProfilerCode.includes('getTotalStats')
      ? 'NetworkProfiler should calculate total statistics'
      : !networkProfilerCode.includes('Connection Information')
      ? 'NetworkProfiler should display connection information'
      : !networkProfilerCode.includes('Network Statistics')
      ? 'NetworkProfiler should show network statistics'
      : !networkProfilerCode.includes('Resource Timing')
      ? 'NetworkProfiler should display resource timing data'
      : !networkProfilerCode.includes('Performance Analysis')
      ? 'NetworkProfiler should provide performance analysis'
      : networkProfilerCode.includes('TODO')
      ? 'NetworkProfiler still contains TODO comments - needs implementation'
      : 'NetworkProfiler needs substantial implementation with analysis interface',
    executionTime: 1,
  });

  // Test 7: useAlertManager hook implementation
  const useAlertManagerCode = extractCode(compiledCode, 'useAlertManager');
  tests.push({
    name: 'useAlertManager implements comprehensive alerting system',
    passed: useAlertManagerCode.includes('addAlertRule') && 
            useAlertManagerCode.includes('removeAlertRule') &&
            useAlertManagerCode.includes('toggleAlertRule') &&
            useAlertManagerCode.includes('checkAlerts') &&
            useAlertManagerCode.includes('acknowledgeAlert') &&
            useAlertManagerCode.includes('alertRules') &&
            useAlertManagerCode.includes('activeAlerts') &&
            useAlertManagerCode.includes('above') &&
            useAlertManagerCode.includes('below') &&
            useAlertManagerCode.includes('equals') &&
            !useAlertManagerCode.includes('TODO') &&
            useAlertManagerCode.length > 1000,
    error: !useAlertManagerCode.includes('addAlertRule')
      ? 'useAlertManager should implement addAlertRule function'
      : !useAlertManagerCode.includes('removeAlertRule')
      ? 'useAlertManager should implement removeAlertRule function'
      : !useAlertManagerCode.includes('toggleAlertRule')
      ? 'useAlertManager should implement toggleAlertRule function'
      : !useAlertManagerCode.includes('checkAlerts')
      ? 'useAlertManager should implement checkAlerts function'
      : !useAlertManagerCode.includes('acknowledgeAlert')
      ? 'useAlertManager should implement acknowledgeAlert function'
      : !useAlertManagerCode.includes('alertRules')
      ? 'useAlertManager should manage alert rules'
      : !useAlertManagerCode.includes('activeAlerts')
      ? 'useAlertManager should track active alerts'
      : !useAlertManagerCode.includes('above')
      ? 'useAlertManager should support above threshold condition'
      : !useAlertManagerCode.includes('below')
      ? 'useAlertManager should support below threshold condition'
      : useAlertManagerCode.includes('TODO')
      ? 'useAlertManager still contains TODO comments - needs implementation'
      : 'useAlertManager needs substantial implementation with alerting logic',
    executionTime: 1,
  });

  // Test 8: AlertManager component implementation
  const alertManagerCode = extractCode(compiledCode, 'AlertManager');
  tests.push({
    name: 'AlertManager component provides alert management interface',
    passed: alertManagerCode.includes('useAlertManager') && 
            alertManagerCode.includes('handleAddRule') &&
            alertManagerCode.includes('getSeverityColor') &&
            alertManagerCode.includes('Add Alert Rule') &&
            alertManagerCode.includes('Alert Rules') &&
            alertManagerCode.includes('Active Alerts') &&
            alertManagerCode.includes('severity') &&
            alertManagerCode.includes('condition') &&
            alertManagerCode.includes('threshold') &&
            alertManagerCode.includes('Acknowledge') &&
            !alertManagerCode.includes('TODO') &&
            alertManagerCode.length > 1200,
    error: !alertManagerCode.includes('useAlertManager')
      ? 'AlertManager should use useAlertManager hook'
      : !alertManagerCode.includes('handleAddRule')
      ? 'AlertManager should implement handleAddRule function'
      : !alertManagerCode.includes('getSeverityColor')
      ? 'AlertManager should implement getSeverityColor utility'
      : !alertManagerCode.includes('Add Alert Rule')
      ? 'AlertManager should provide rule creation interface'
      : !alertManagerCode.includes('Alert Rules')
      ? 'AlertManager should display configured rules'
      : !alertManagerCode.includes('Active Alerts')
      ? 'AlertManager should show active alerts'
      : !alertManagerCode.includes('Acknowledge')
      ? 'AlertManager should provide alert acknowledgment'
      : alertManagerCode.includes('TODO')
      ? 'AlertManager still contains TODO comments - needs implementation'
      : 'AlertManager needs substantial implementation with management interface',
    executionTime: 1,
  });

  // Test 9: Performance monitoring integration
  tests.push({
    name: 'Components implement comprehensive performance monitoring integration',
    passed: compiledCode.includes('PerformanceObserver') && 
            compiledCode.includes('performance.memory') &&
            compiledCode.includes('performance.getEntriesByType') &&
            compiledCode.includes('performance.mark') &&
            compiledCode.includes('performance.measure') &&
            compiledCode.includes('performance.now') &&
            compiledCode.includes('largest-contentful-paint') &&
            compiledCode.includes('first-input') &&
            compiledCode.includes('layout-shift') &&
            compiledCode.includes('navigation'),
    error: !compiledCode.includes('PerformanceObserver')
      ? 'Should use PerformanceObserver for Web Vitals monitoring'
      : !compiledCode.includes('performance.memory')
      ? 'Should use performance.memory for memory monitoring'
      : !compiledCode.includes('performance.getEntriesByType')
      ? 'Should use performance.getEntriesByType for timing data'
      : !compiledCode.includes('performance.mark')
      ? 'Should use performance.mark for custom metrics'
      : !compiledCode.includes('performance.measure')
      ? 'Should use performance.measure for duration tracking'
      : !compiledCode.includes('performance.now')
      ? 'Should use performance.now for accurate timing'
      : !compiledCode.includes('largest-contentful-paint')
      ? 'Should monitor LCP (largest-contentful-paint)'
      : !compiledCode.includes('first-input')
      ? 'Should monitor FID (first-input)'
      : !compiledCode.includes('layout-shift')
      ? 'Should monitor CLS (layout-shift)'
      : 'Should monitor navigation timing',
    executionTime: 1,
  });

  // Test 10: Core Web Vitals monitoring
  tests.push({
    name: 'Components implement accurate Core Web Vitals monitoring',
    passed: compiledCode.includes('LCP') && 
            compiledCode.includes('FID') &&
            compiledCode.includes('CLS') &&
            compiledCode.includes('2500') && // LCP threshold
            compiledCode.includes('100') && // FID threshold  
            compiledCode.includes('0.1') && // CLS threshold
            compiledCode.includes('processingStart') &&
            compiledCode.includes('startTime') &&
            compiledCode.includes('hadRecentInput'),
    error: !compiledCode.includes('LCP')
      ? 'Should monitor LCP (Largest Contentful Paint)'
      : !compiledCode.includes('FID')
      ? 'Should monitor FID (First Input Delay)'
      : !compiledCode.includes('CLS')
      ? 'Should monitor CLS (Cumulative Layout Shift)'
      : !compiledCode.includes('2500')
      ? 'Should use correct LCP threshold (2500ms)'
      : !compiledCode.includes('100')
      ? 'Should use correct FID threshold (100ms)'
      : !compiledCode.includes('0.1')
      ? 'Should use correct CLS threshold (0.1)'
      : !compiledCode.includes('processingStart')
      ? 'Should calculate FID using processingStart - startTime'
      : !compiledCode.includes('hadRecentInput')
      ? 'Should filter CLS entries without recent input'
      : 'Should implement accurate Web Vitals calculations',
    executionTime: 1,
  });

  // Test 11: Memory profiling and analysis
  tests.push({
    name: 'Components implement memory profiling with leak detection',
    passed: compiledCode.includes('usedJSHeapSize') && 
            compiledCode.includes('totalJSHeapSize') &&
            compiledCode.includes('jsHeapSizeLimit') &&
            compiledCode.includes('memoryHistory') &&
            compiledCode.includes('linear regression') &&
            compiledCode.includes('trend') &&
            compiledCode.includes('growing') &&
            compiledCode.includes('stable') &&
            compiledCode.includes('decreasing') &&
            compiledCode.includes('recommendations'),
    error: !compiledCode.includes('usedJSHeapSize')
      ? 'Should track used heap size from performance.memory'
      : !compiledCode.includes('totalJSHeapSize')
      ? 'Should track total heap size'
      : !compiledCode.includes('jsHeapSizeLimit')
      ? 'Should track heap size limit'
      : !compiledCode.includes('memoryHistory')
      ? 'Should maintain memory usage history'
      : !compiledCode.includes('linear regression')
      ? 'Should use linear regression for trend analysis'
      : !compiledCode.includes('trend')
      ? 'Should analyze memory usage trends'
      : !compiledCode.includes('growing')
      ? 'Should detect growing memory usage'
      : !compiledCode.includes('stable')
      ? 'Should detect stable memory usage'
      : !compiledCode.includes('decreasing')
      ? 'Should detect decreasing memory usage'
      : 'Should provide memory optimization recommendations',
    executionTime: 1,
  });

  // Test 12: Network performance analysis
  tests.push({
    name: 'Components implement network performance analysis with bottleneck detection',
    passed: compiledCode.includes('PerformanceResourceTiming') && 
            compiledCode.includes('PerformanceNavigationTiming') &&
            compiledCode.includes('transferSize') &&
            compiledCode.includes('duration') &&
            compiledCode.includes('bottlenecks') &&
            compiledCode.includes('slow resources') &&
            compiledCode.includes('large resources') &&
            compiledCode.includes('effectiveType') &&
            compiledCode.includes('downlink') &&
            compiledCode.includes('rtt'),
    error: !compiledCode.includes('PerformanceResourceTiming')
      ? 'Should use PerformanceResourceTiming for resource analysis'
      : !compiledCode.includes('PerformanceNavigationTiming')
      ? 'Should use PerformanceNavigationTiming for navigation analysis'
      : !compiledCode.includes('transferSize')
      ? 'Should analyze resource transfer sizes'
      : !compiledCode.includes('duration')
      ? 'Should analyze resource loading durations'
      : !compiledCode.includes('bottlenecks')
      ? 'Should identify performance bottlenecks'
      : !compiledCode.includes('slow resources')
      ? 'Should detect slow-loading resources'
      : !compiledCode.includes('large resources')
      ? 'Should detect large resources'
      : !compiledCode.includes('effectiveType')
      ? 'Should detect connection effective type'
      : !compiledCode.includes('downlink')
      ? 'Should detect connection downlink speed'
      : 'Should detect connection RTT',
    executionTime: 1,
  });

  // Test 13: Alert management and thresholds
  tests.push({
    name: 'Components implement comprehensive alert management with configurable thresholds',
    passed: compiledCode.includes('AlertRule') && 
            compiledCode.includes('PerformanceAlert') &&
            compiledCode.includes('above') &&
            compiledCode.includes('below') &&
            compiledCode.includes('equals') &&
            compiledCode.includes('severity') &&
            compiledCode.includes('low') &&
            compiledCode.includes('medium') &&
            compiledCode.includes('high') &&
            compiledCode.includes('critical') &&
            compiledCode.includes('acknowledged'),
    error: !compiledCode.includes('AlertRule')
      ? 'Should define AlertRule interface for rule configuration'
      : !compiledCode.includes('PerformanceAlert')
      ? 'Should define PerformanceAlert interface for alerts'
      : !compiledCode.includes('above')
      ? 'Should support above threshold condition'
      : !compiledCode.includes('below')
      ? 'Should support below threshold condition'
      : !compiledCode.includes('equals')
      ? 'Should support equals threshold condition'
      : !compiledCode.includes('severity')
      ? 'Should implement alert severity levels'
      : !compiledCode.includes('low')
      ? 'Should support low severity alerts'
      : !compiledCode.includes('medium')
      ? 'Should support medium severity alerts'
      : !compiledCode.includes('high')
      ? 'Should support high severity alerts'
      : !compiledCode.includes('critical')
      ? 'Should support critical severity alerts'
      : 'Should support alert acknowledgment',
    executionTime: 1,
  });

  // Test 14: Performance scoring and budgets
  tests.push({
    name: 'Components implement performance scoring and budget management',
    passed: compiledCode.includes('calculatePerformanceScore') && 
            compiledCode.includes('getMetricStatus') &&
            compiledCode.includes('budgets') &&
            compiledCode.includes('good') &&
            compiledCode.includes('needs-improvement') &&
            compiledCode.includes('poor') &&
            compiledCode.includes('performance score') &&
            (compiledCode.match(/100/g) || []).length >= 3, // Should have scoring values
    error: !compiledCode.includes('calculatePerformanceScore')
      ? 'Should implement calculatePerformanceScore function'
      : !compiledCode.includes('getMetricStatus')
      ? 'Should implement getMetricStatus function'
      : !compiledCode.includes('budgets')
      ? 'Should support performance budgets configuration'
      : !compiledCode.includes('good')
      ? 'Should classify metrics as good when within budget'
      : !compiledCode.includes('needs-improvement')
      ? 'Should classify metrics as needs-improvement when slightly over budget'
      : !compiledCode.includes('poor')
      ? 'Should classify metrics as poor when significantly over budget'
      : !compiledCode.includes('performance score')
      ? 'Should calculate overall performance score'
      : 'Should implement proper scoring algorithm with numerical values',
    executionTime: 1,
  });

  // Test 15: Main demo component integration
  const demoCode = extractCode(compiledCode, 'PerformanceMonitoringDemo');
  tests.push({
    name: 'PerformanceMonitoringDemo integrates all monitoring features',
    passed: demoCode.includes('PerformanceMonitor') && 
            demoCode.includes('MemoryProfiler') &&
            demoCode.includes('NetworkProfiler') &&
            demoCode.includes('AlertManager') &&
            demoCode.includes('activeTab') &&
            demoCode.includes('monitoringEnabled') &&
            demoCode.includes('overview') &&
            demoCode.includes('memory') &&
            demoCode.includes('network') &&
            demoCode.includes('alerts') &&
            demoCode.length > 800,
    error: !demoCode.includes('PerformanceMonitor')
      ? 'Demo should include PerformanceMonitor component'
      : !demoCode.includes('MemoryProfiler')
      ? 'Demo should include MemoryProfiler component'
      : !demoCode.includes('NetworkProfiler')
      ? 'Demo should include NetworkProfiler component'
      : !demoCode.includes('AlertManager')
      ? 'Demo should include AlertManager component'
      : !demoCode.includes('activeTab')
      ? 'Demo should implement tab switching functionality'
      : !demoCode.includes('monitoringEnabled')
      ? 'Demo should provide global monitoring toggle'
      : !demoCode.includes('overview')
      ? 'Demo should include performance overview tab'
      : !demoCode.includes('memory')
      ? 'Demo should include memory profiler tab'
      : !demoCode.includes('network')
      ? 'Demo should include network profiler tab'
      : !demoCode.includes('alerts')
      ? 'Demo should include alert manager tab'
      : 'Demo component needs substantial implementation integrating all features',
    executionTime: 1,
  });

  return tests;
}