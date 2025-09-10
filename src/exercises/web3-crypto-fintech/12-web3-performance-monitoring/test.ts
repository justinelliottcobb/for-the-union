import type { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test PerformanceAnalyzer class implementation
  tests.push({
    name: 'PerformanceAnalyzer class exists',
    passed: compiledCode.includes('class PerformanceAnalyzer'),
    error: !compiledCode.includes('class PerformanceAnalyzer') ? 'PerformanceAnalyzer class is missing' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'PerformanceAnalyzer profiling methods',
    passed: compiledCode.includes('startProfile') && compiledCode.includes('endProfile'),
    error: !compiledCode.includes('startProfile') || !compiledCode.includes('endProfile') ? 'PerformanceAnalyzer needs startProfile and endProfile methods' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'PerformanceAnalyzer metrics recording',
    passed: compiledCode.includes('recordMetric') && compiledCode.includes('getMetrics'),
    error: !compiledCode.includes('recordMetric') || !compiledCode.includes('getMetrics') ? 'PerformanceAnalyzer needs recordMetric and getMetrics methods' : undefined,
    executionTime: 1
  });

  // Test TransactionTracker class implementation
  tests.push({
    name: 'TransactionTracker class exists',
    passed: compiledCode.includes('class TransactionTracker'),
    error: !compiledCode.includes('class TransactionTracker') ? 'TransactionTracker class is missing' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'TransactionTracker monitoring methods',
    passed: compiledCode.includes('trackTransaction') && compiledCode.includes('getTransactionMetrics'),
    error: !compiledCode.includes('trackTransaction') || !compiledCode.includes('getTransactionMetrics') ? 'TransactionTracker needs tracking methods' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'TransactionTracker gas analysis',
    passed: compiledCode.includes('analyzeGasPriceHistory') && compiledCode.includes('getNetworkStatus'),
    error: !compiledCode.includes('analyzeGasPriceHistory') || !compiledCode.includes('getNetworkStatus') ? 'TransactionTracker needs gas analysis methods' : undefined,
    executionTime: 1
  });

  // Test MetricsCollector class implementation
  tests.push({
    name: 'MetricsCollector class exists',
    passed: compiledCode.includes('class MetricsCollector'),
    error: !compiledCode.includes('class MetricsCollector') ? 'MetricsCollector class is missing' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'MetricsCollector data operations',
    passed: compiledCode.includes('collect') && compiledCode.includes('query'),
    error: !compiledCode.includes('collect') || !compiledCode.includes('query') ? 'MetricsCollector needs collect and query methods' : undefined,
    executionTime: 1
  });

  // Test AlertSystem class implementation
  tests.push({
    name: 'AlertSystem class exists',
    passed: compiledCode.includes('class AlertSystem'),
    error: !compiledCode.includes('class AlertSystem') ? 'AlertSystem class is missing' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'AlertSystem rule management',
    passed: compiledCode.includes('addRule') && compiledCode.includes('evaluateMetrics'),
    error: !compiledCode.includes('addRule') || !compiledCode.includes('evaluateMetrics') ? 'AlertSystem needs rule management methods' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'AlertSystem alert handling',
    passed: compiledCode.includes('getActiveAlerts') && compiledCode.includes('acknowledgeAlert'),
    error: !compiledCode.includes('getActiveAlerts') || !compiledCode.includes('acknowledgeAlert') ? 'AlertSystem needs alert handling methods' : undefined,
    executionTime: 1
  });

  // Test React component implementation
  tests.push(createComponentTest('Web3PerformanceMonitoringExercise', compiledCode, {
    requiredElements: ['Container', 'Title', 'Tabs'],
    customValidation: (code) => code.includes('useState') && code.includes('ethers'),
    errorMessage: 'Main component needs proper React hooks and ethers integration'
  }));

  // Test performance interfaces
  tests.push({
    name: 'PerformanceMetric interface defined',
    passed: compiledCode.includes('interface PerformanceMetric'),
    error: !compiledCode.includes('interface PerformanceMetric') ? 'PerformanceMetric interface is missing' : undefined,
    executionTime: 1
  });

  tests.push({
    name: 'TransactionMetrics interface defined',
    passed: compiledCode.includes('interface TransactionMetrics'),
    error: !compiledCode.includes('interface TransactionMetrics') ? 'TransactionMetrics interface is missing' : undefined,
    executionTime: 1
  });

  // Test optimization features
  tests.push({
    name: 'Optimization recommendations',
    passed: compiledCode.includes('getOptimizationRecommendations') && compiledCode.includes('OptimizationRecommendation'),
    error: !compiledCode.includes('getOptimizationRecommendations') ? 'Optimization recommendation system is missing' : undefined,
    executionTime: 1
  });

  // Test alert system interfaces
  tests.push({
    name: 'Alert interfaces defined',
    passed: compiledCode.includes('interface Alert') && compiledCode.includes('interface AlertRule'),
    error: !compiledCode.includes('interface Alert') || !compiledCode.includes('interface AlertRule') ? 'Alert system interfaces are missing' : undefined,
    executionTime: 1
  });

  // Test dashboard components
  tests.push({
    name: 'Dashboard components defined',
    passed: compiledCode.includes('MetricsChart') && compiledCode.includes('GasPriceTrends'),
    error: !compiledCode.includes('MetricsChart') || !compiledCode.includes('GasPriceTrends') ? 'Dashboard components are missing' : undefined,
    executionTime: 1
  });

  // Test performance report generation
  tests.push({
    name: 'Performance reporting',
    passed: compiledCode.includes('generateReport') && compiledCode.includes('export'),
    error: !compiledCode.includes('generateReport') ? 'Performance report generation is missing' : undefined,
    executionTime: 1
  });

  return tests;
}