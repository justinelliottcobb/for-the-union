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

  // Test 1: useWebVitals hook implementation
  const useWebVitalsCode = extractCode(compiledCode, 'useWebVitals');
  tests.push({
    name: 'useWebVitals hook implements comprehensive Web Vitals monitoring',
    passed: useWebVitalsCode.includes('PerformanceObserver') && 
            useWebVitalsCode.includes('largest-contentful-paint') &&
            useWebVitalsCode.includes('first-input') &&
            useWebVitalsCode.includes('layout-shift') &&
            useWebVitalsCode.includes('paint') &&
            useWebVitalsCode.includes('startMonitoring') &&
            useWebVitalsCode.includes('stopMonitoring') &&
            !useWebVitalsCode.includes('TODO') &&
            useWebVitalsCode.length > 1000,
    error: !useWebVitalsCode.includes('PerformanceObserver')
      ? 'useWebVitals should use PerformanceObserver for metrics collection'
      : !useWebVitalsCode.includes('largest-contentful-paint')
      ? 'useWebVitals should monitor largest-contentful-paint for LCP'
      : !useWebVitalsCode.includes('first-input')
      ? 'useWebVitals should monitor first-input for FID'
      : !useWebVitalsCode.includes('layout-shift')
      ? 'useWebVitals should monitor layout-shift for CLS'
      : !useWebVitalsCode.includes('paint')
      ? 'useWebVitals should monitor paint events for FCP'
      : !useWebVitalsCode.includes('startMonitoring')
      ? 'useWebVitals should provide startMonitoring function'
      : useWebVitalsCode.includes('TODO')
      ? 'useWebVitals still contains TODO comments - needs implementation'
      : 'useWebVitals needs substantial implementation with all Web Vitals metrics',
    executionTime: 1,
  });

  // Test 2: LCP measurement implementation
  const measureLCPCode = extractCode(compiledCode, 'measureLCP');
  tests.push({
    name: 'measureLCP accurately tracks Largest Contentful Paint timing',
    passed: measureLCPCode.includes('PerformanceObserver') && 
            measureLCPCode.includes('largest-contentful-paint') &&
            measureLCPCode.includes('startTime') &&
            measureLCPCode.includes('rating') &&
            measureLCPCode.includes('getMetricRating') &&
            !measureLCPCode.includes('TODO') &&
            measureLCPCode.length > 200,
    error: !measureLCPCode.includes('PerformanceObserver')
      ? 'measureLCP should use PerformanceObserver'
      : !measureLCPCode.includes('largest-contentful-paint')
      ? 'measureLCP should observe largest-contentful-paint entries'
      : !measureLCPCode.includes('startTime')
      ? 'measureLCP should extract startTime from performance entries'
      : !measureLCPCode.includes('rating')
      ? 'measureLCP should calculate metric rating'
      : measureLCPCode.includes('TODO')
      ? 'measureLCP still contains TODO comments - needs implementation'
      : 'measureLCP needs substantial implementation with LCP tracking',
    executionTime: 1,
  });

  // Test 3: FID measurement implementation
  const measureFIDCode = extractCode(compiledCode, 'measureFID');
  tests.push({
    name: 'measureFID accurately tracks First Input Delay',
    passed: measureFIDCode.includes('PerformanceObserver') && 
            measureFIDCode.includes('first-input') &&
            measureFIDCode.includes('processingStart') &&
            measureFIDCode.includes('startTime') &&
            measureFIDCode.includes('rating') &&
            !measureFIDCode.includes('TODO') &&
            measureFIDCode.length > 200,
    error: !measureFIDCode.includes('PerformanceObserver')
      ? 'measureFID should use PerformanceObserver'
      : !measureFIDCode.includes('first-input')
      ? 'measureFID should observe first-input entries'
      : !measureFIDCode.includes('processingStart')
      ? 'measureFID should calculate delay using processingStart'
      : !measureFIDCode.includes('startTime')
      ? 'measureFID should use startTime for delay calculation'
      : measureFIDCode.includes('TODO')
      ? 'measureFID still contains TODO comments - needs implementation'
      : 'measureFID needs substantial implementation with FID tracking',
    executionTime: 1,
  });

  // Test 4: CLS measurement implementation
  const measureCLSCode = extractCode(compiledCode, 'measureCLS');
  tests.push({
    name: 'measureCLS accurately tracks Cumulative Layout Shift',
    passed: measureCLSCode.includes('PerformanceObserver') && 
            measureCLSCode.includes('layout-shift') &&
            measureCLSCode.includes('hadRecentInput') &&
            measureCLSCode.includes('value') &&
            measureCLSCode.includes('rating') &&
            !measureCLSCode.includes('TODO') &&
            measureCLSCode.length > 200,
    error: !measureCLSCode.includes('PerformanceObserver')
      ? 'measureCLS should use PerformanceObserver'
      : !measureCLSCode.includes('layout-shift')
      ? 'measureCLS should observe layout-shift entries'
      : !measureCLSCode.includes('hadRecentInput')
      ? 'measureCLS should filter out shifts caused by user input'
      : !measureCLSCode.includes('value')
      ? 'measureCLS should accumulate shift values'
      : measureCLSCode.includes('TODO')
      ? 'measureCLS still contains TODO comments - needs implementation'
      : 'measureCLS needs substantial implementation with CLS tracking',
    executionTime: 1,
  });

  // Test 5: WebVitalsReporter component implementation
  const webVitalsReporterCode = extractCode(compiledCode, 'WebVitalsReporter');
  tests.push({
    name: 'WebVitalsReporter provides comprehensive metrics monitoring and reporting',
    passed: webVitalsReporterCode.includes('useWebVitals') && 
            webVitalsReporterCode.includes('onReport') &&
            webVitalsReporterCode.includes('endpoint') &&
            webVitalsReporterCode.includes('handleMetric') &&
            webVitalsReporterCode.includes('startMonitoring') &&
            webVitalsReporterCode.includes('stopMonitoring') &&
            !webVitalsReporterCode.includes('TODO') &&
            webVitalsReporterCode.length > 800,
    error: !webVitalsReporterCode.includes('useWebVitals')
      ? 'WebVitalsReporter should use useWebVitals hook'
      : !webVitalsReporterCode.includes('onReport')
      ? 'WebVitalsReporter should handle onReport callback'
      : !webVitalsReporterCode.includes('endpoint')
      ? 'WebVitalsReporter should support reporting to endpoints'
      : !webVitalsReporterCode.includes('handleMetric')
      ? 'WebVitalsReporter should implement metric handling'
      : !webVitalsReporterCode.includes('startMonitoring')
      ? 'WebVitalsReporter should provide monitoring controls'
      : webVitalsReporterCode.includes('TODO')
      ? 'WebVitalsReporter still contains TODO comments - needs implementation'
      : 'WebVitalsReporter needs substantial implementation with monitoring features',
    executionTime: 1,
  });

  // Test 6: ImageOptimizer component implementation
  const imageOptimizerCode = extractCode(compiledCode, 'ImageOptimizer');
  tests.push({
    name: 'ImageOptimizer implements LCP-focused image optimization techniques',
    passed: imageOptimizerCode.includes('IntersectionObserver') && 
            imageOptimizerCode.includes('preload') &&
            imageOptimizerCode.includes('lazy') &&
            imageOptimizerCode.includes('priority') &&
            imageOptimizerCode.includes('onLCPImprovement') &&
            imageOptimizerCode.includes('aspectRatio') &&
            !imageOptimizerCode.includes('TODO') &&
            imageOptimizerCode.length > 1000,
    error: !imageOptimizerCode.includes('IntersectionObserver')
      ? 'ImageOptimizer should use IntersectionObserver for lazy loading'
      : !imageOptimizerCode.includes('preload')
      ? 'ImageOptimizer should implement image preloading'
      : !imageOptimizerCode.includes('lazy')
      ? 'ImageOptimizer should support lazy loading'
      : !imageOptimizerCode.includes('priority')
      ? 'ImageOptimizer should handle priority images'
      : !imageOptimizerCode.includes('onLCPImprovement')
      ? 'ImageOptimizer should track LCP improvements'
      : imageOptimizerCode.includes('TODO')
      ? 'ImageOptimizer still contains TODO comments - needs implementation'
      : 'ImageOptimizer needs substantial implementation with optimization features',
    executionTime: 1,
  });

  // Test 7: LayoutStabilizer component implementation
  const layoutStabilizerCode = extractCode(compiledCode, 'LayoutStabilizer');
  tests.push({
    name: 'LayoutStabilizer prevents layout shifts and improves CLS',
    passed: layoutStabilizerCode.includes('PerformanceObserver') && 
            layoutStabilizerCode.includes('layout-shift') &&
            layoutStabilizerCode.includes('enableLayoutReserve') &&
            layoutStabilizerCode.includes('minHeight') &&
            layoutStabilizerCode.includes('onCLSImprovement') &&
            layoutStabilizerCode.includes('setCLSScore') &&
            !layoutStabilizerCode.includes('TODO') &&
            layoutStabilizerCode.length > 800,
    error: !layoutStabilizerCode.includes('PerformanceObserver')
      ? 'LayoutStabilizer should monitor layout shifts'
      : !layoutStabilizerCode.includes('layout-shift')
      ? 'LayoutStabilizer should observe layout-shift entries'
      : !layoutStabilizerCode.includes('enableLayoutReserve')
      ? 'LayoutStabilizer should provide layout reservation toggle'
      : !layoutStabilizerCode.includes('minHeight')
      ? 'LayoutStabilizer should use minHeight for space reservation'
      : !layoutStabilizerCode.includes('onCLSImprovement')
      ? 'LayoutStabilizer should track CLS improvements'
      : layoutStabilizerCode.includes('TODO')
      ? 'LayoutStabilizer still contains TODO comments - needs implementation'
      : 'LayoutStabilizer needs substantial implementation with CLS prevention',
    executionTime: 1,
  });

  // Test 8: Performance metrics rating calculation
  tests.push({
    name: 'Components implement accurate Web Vitals rating calculations',
    passed: compiledCode.includes('getMetricRating') && 
            compiledCode.includes('THRESHOLDS') &&
            compiledCode.includes('good') &&
            compiledCode.includes('needs-improvement') &&
            compiledCode.includes('poor') &&
            (compiledCode.includes('2500') || compiledCode.includes('2.5')) && // LCP threshold
            (compiledCode.includes('100') || compiledCode.includes('0.1')), // FID/CLS threshold
    error: !compiledCode.includes('getMetricRating')
      ? 'Should implement getMetricRating function for metric evaluation'
      : !compiledCode.includes('THRESHOLDS')
      ? 'Should define THRESHOLDS for Web Vitals rating'
      : !compiledCode.includes('good')
      ? 'Should categorize metrics as good/needs-improvement/poor'
      : !(compiledCode.includes('2500') || compiledCode.includes('2.5'))
      ? 'Should use correct LCP thresholds (2.5s, 4s)'
      : 'Should implement proper Web Vitals rating system',
    executionTime: 1,
  });

  // Test 9: Performance Observer implementation
  tests.push({
    name: 'Components properly implement Performance Observer patterns',
    passed: compiledCode.includes('PerformanceObserver') && 
            compiledCode.includes('observe') &&
            compiledCode.includes('disconnect') &&
            compiledCode.includes('getEntries') &&
            compiledCode.includes('entryTypes') &&
            (compiledCode.match(/PerformanceObserver/g) || []).length >= 3,
    error: !compiledCode.includes('PerformanceObserver')
      ? 'Should use PerformanceObserver for metrics collection'
      : !compiledCode.includes('observe')
      ? 'Should call observe() to start monitoring'
      : !compiledCode.includes('disconnect')
      ? 'Should call disconnect() for cleanup'
      : !compiledCode.includes('getEntries')
      ? 'Should use getEntries() to access performance data'
      : !compiledCode.includes('entryTypes')
      ? 'Should specify entryTypes for observation'
      : 'Should implement multiple PerformanceObserver instances for different metrics',
    executionTime: 1,
  });

  // Test 10: Image optimization features
  tests.push({
    name: 'ImageOptimizer implements comprehensive optimization features',
    passed: compiledCode.includes('lazyLoadEnabled') && 
            compiledCode.includes('preloadEnabled') &&
            compiledCode.includes('webpEnabled') &&
            compiledCode.includes('data-src') &&
            compiledCode.includes('loading=') &&
            compiledCode.includes('createElement') &&
            compiledCode.includes('rel=') &&
            compiledCode.includes('preload'),
    error: !compiledCode.includes('lazyLoadEnabled')
      ? 'Should provide lazy loading toggle'
      : !compiledCode.includes('preloadEnabled')
      ? 'Should provide preloading toggle'
      : !compiledCode.includes('webpEnabled')
      ? 'Should provide WebP format toggle'
      : !compiledCode.includes('data-src')
      ? 'Should use data-src for lazy loading'
      : !compiledCode.includes('loading=')
      ? 'Should use loading attribute for native lazy loading'
      : !compiledCode.includes('createElement')
      ? 'Should create preload link elements'
      : 'Should implement comprehensive image optimization features',
    executionTime: 1,
  });

  // Test 11: Layout stability features
  tests.push({
    name: 'LayoutStabilizer implements effective CLS prevention techniques',
    passed: compiledCode.includes('minHeight') && 
            compiledCode.includes('aspectRatio') &&
            compiledCode.includes('hadRecentInput') &&
            compiledCode.includes('clsValueRef') &&
            compiledCode.includes('animate-fade-in') &&
            (compiledCode.includes('skeleton') || compiledCode.includes('placeholder')),
    error: !compiledCode.includes('minHeight')
      ? 'Should use minHeight for layout reservation'
      : !compiledCode.includes('aspectRatio')
      ? 'Should use aspectRatio for stable image containers'
      : !compiledCode.includes('hadRecentInput')
      ? 'Should filter layout shifts caused by user input'
      : !compiledCode.includes('clsValueRef')
      ? 'Should track cumulative CLS value'
      : !compiledCode.includes('animate-fade-in')
      ? 'Should use smooth animations for content transitions'
      : 'Should implement loading placeholders or skeleton screens',
    executionTime: 1,
  });

  // Test 12: Metrics reporting and analytics
  tests.push({
    name: 'Components implement proper metrics reporting and analytics integration',
    passed: compiledCode.includes('reportMetric') && 
            compiledCode.includes('fetch') &&
            compiledCode.includes('POST') &&
            compiledCode.includes('JSON.stringify') &&
            compiledCode.includes('endpoint') &&
            compiledCode.includes('onReport') &&
            compiledCode.includes('timestamp'),
    error: !compiledCode.includes('reportMetric')
      ? 'Should implement metric reporting function'
      : !compiledCode.includes('fetch')
      ? 'Should use fetch for analytics reporting'
      : !compiledCode.includes('POST')
      ? 'Should use POST method for metrics submission'
      : !compiledCode.includes('JSON.stringify')
      ? 'Should serialize metrics data'
      : !compiledCode.includes('endpoint')
      ? 'Should support analytics endpoints'
      : !compiledCode.includes('onReport')
      ? 'Should support callback-based reporting'
      : 'Should include timestamps in metric reports',
    executionTime: 1,
  });

  // Test 13: Performance budget implementation
  const performanceBudgetCode = extractCode(compiledCode, 'usePerformanceBudget');
  tests.push({
    name: 'usePerformanceBudget implements budget monitoring and violations',
    passed: performanceBudgetCode.includes('violations') && 
            performanceBudgetCode.includes('checkBudget') &&
            performanceBudgetCode.includes('budget') &&
            performanceBudgetCode.includes('severity') &&
            (performanceBudgetCode.includes('warning') || performanceBudgetCode.includes('error')),
    error: !performanceBudgetCode.includes('violations')
      ? 'usePerformanceBudget should track budget violations'
      : !performanceBudgetCode.includes('checkBudget')
      ? 'usePerformanceBudget should implement budget checking'
      : !performanceBudgetCode.includes('budget')
      ? 'usePerformanceBudget should accept budget parameters'
      : !performanceBudgetCode.includes('severity')
      ? 'usePerformanceBudget should categorize violation severity'
      : 'usePerformanceBudget should provide warning/error levels',
    executionTime: 1,
  });

  // Test 14: Main demo component integration
  const demoCode = extractCode(compiledCode, 'WebVitalsOptimizationDemo');
  tests.push({
    name: 'WebVitalsOptimizationDemo integrates all Web Vitals optimization features',
    passed: demoCode.includes('WebVitalsReporter') && 
            demoCode.includes('ImageOptimizer') &&
            demoCode.includes('LayoutStabilizer') &&
            demoCode.includes('selectedTool') &&
            demoCode.includes('sampleImages') &&
            demoCode.includes('handleMetricsReport') &&
            demoCode.length > 800,
    error: !demoCode.includes('WebVitalsReporter')
      ? 'Demo should include WebVitalsReporter component'
      : !demoCode.includes('ImageOptimizer')
      ? 'Demo should include ImageOptimizer component'
      : !demoCode.includes('LayoutStabilizer')
      ? 'Demo should include LayoutStabilizer component'
      : !demoCode.includes('selectedTool')
      ? 'Demo should allow switching between different tools'
      : !demoCode.includes('sampleImages')
      ? 'Demo should provide sample data for testing'
      : 'Demo component needs substantial implementation integrating all features',
    executionTime: 1,
  });

  // Test 15: Browser compatibility and error handling
  tests.push({
    name: 'Components implement proper browser compatibility and error handling',
    passed: compiledCode.includes("'PerformanceObserver' in window") && 
            compiledCode.includes('catch') &&
            compiledCode.includes('try') &&
            compiledCode.includes('console.warn') &&
            compiledCode.includes('not supported') &&
            (compiledCode.includes('typeof') || compiledCode.includes('in window')),
    error: !compiledCode.includes("'PerformanceObserver' in window")
      ? 'Should check for PerformanceObserver support'
      : !compiledCode.includes('catch')
      ? 'Should implement error handling with try-catch blocks'
      : !compiledCode.includes('try')
      ? 'Should use try-catch for observer initialization'
      : !compiledCode.includes('console.warn')
      ? 'Should warn about unsupported features'
      : !compiledCode.includes('not supported')
      ? 'Should provide helpful error messages'
      : 'Should implement comprehensive browser compatibility checks',
    executionTime: 1,
  });

  return tests;
}