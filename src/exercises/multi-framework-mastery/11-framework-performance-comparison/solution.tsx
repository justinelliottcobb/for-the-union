import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// Types and Interfaces
interface BenchmarkResult {
  framework: string;
  testName: string;
  duration: number;
  memoryUsage: number;
  bundleSize: number;
  timestamp: number;
}

interface WebVitalMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

interface RenderMetrics {
  componentName: string;
  renderTime: number;
  reconciliationTime: number;
  updateCount: number;
  rerenderCount: number;
}

interface MemoryProfile {
  heapSize: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
  leakSuspected: boolean;
}

interface PerformanceMarkers {
  name: string;
  startTime: number;
  duration: number;
  metadata: Record<string, any>;
}

interface BundleAnalysis {
  framework: string;
  totalSize: number;
  gzippedSize: number;
  treeshakingEffectiveness: number;
  dependencies: Array<{ name: string; size: number; }>;
  codeSplitting: {
    chunks: number;
    asyncChunks: number;
    lazyLoadingEffectiveness: number;
  };
}

interface DecisionMatrix {
  criteria: Array<{
    name: string;
    weight: number;
    frameworks: Record<string, number>;
  }>;
  recommendations: Array<{
    framework: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
    useCase: string;
  }>;
}

interface PaintMetrics {
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  domInteractive: number;
  domComplete: number;
}

// BenchmarkSuite Class
class BenchmarkSuite {
  private results: BenchmarkResult[] = [];
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initializePerformanceObserver();
  }

  private initializePerformanceObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          console.log(`Performance entry: ${entry.name} - ${entry.duration}ms`);
        });
      });
      
      this.observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    }
  }

  async runRuntimeBenchmarks(frameworks: string[]): Promise<BenchmarkResult[]> {
    const tests = [
      'component-creation',
      'dom-manipulation',
      'list-rendering',
      'state-updates',
      'event-handling'
    ];

    for (const framework of frameworks) {
      for (const testName of tests) {
        const result = await this.executeBenchmark(framework, testName);
        this.results.push(result);
      }
    }

    return this.results;
  }

  private async executeBenchmark(framework: string, testName: string): Promise<BenchmarkResult> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    
    // Simulate framework-specific operations
    await this.simulateFrameworkOperation(framework, testName);
    
    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();
    
    return {
      framework,
      testName,
      duration: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      bundleSize: this.estimateBundleSize(framework),
      timestamp: Date.now()
    };
  }

  private async simulateFrameworkOperation(framework: string, testName: string): Promise<void> {
    // Simulate different complexity based on test type
    const iterations = testName === 'list-rendering' ? 1000 : 100;
    const complexity = {
      'react': 1.2,
      'vue': 1.0,
      'svelte': 0.8,
      'solid': 0.9,
      'lit': 1.1
    }[framework] || 1.0;

    for (let i = 0; i < iterations * complexity; i++) {
      // Simulate DOM operations
      const div = document.createElement('div');
      div.textContent = `${framework}-${testName}-${i}`;
      document.body.appendChild(div);
      document.body.removeChild(div);
    }
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private estimateBundleSize(framework: string): number {
    const baseSizes = {
      'react': 45000,
      'vue': 38000,
      'svelte': 12000,
      'solid': 15000,
      'lit': 25000
    };
    return baseSizes[framework] || 30000;
  }

  analyzeBundleSize(framework: string): BundleAnalysis {
    const bundleData = {
      framework,
      totalSize: this.estimateBundleSize(framework),
      gzippedSize: Math.round(this.estimateBundleSize(framework) * 0.3),
      treeshakingEffectiveness: Math.random() * 0.4 + 0.6, // 60-100%
      dependencies: this.generateDependencyList(framework),
      codeSplitting: {
        chunks: Math.floor(Math.random() * 5) + 3,
        asyncChunks: Math.floor(Math.random() * 3) + 1,
        lazyLoadingEffectiveness: Math.random() * 0.3 + 0.7
      }
    };

    return bundleData;
  }

  private generateDependencyList(framework: string): Array<{ name: string; size: number; }> {
    const commonDeps = [
      { name: 'polyfills', size: 5000 },
      { name: 'utilities', size: 3000 },
      { name: 'components', size: 8000 }
    ];

    const frameworkSpecific = {
      'react': [
        { name: 'react-dom', size: 25000 },
        { name: 'react-router', size: 12000 }
      ],
      'vue': [
        { name: 'vue-router', size: 10000 },
        { name: 'vuex', size: 8000 }
      ],
      'svelte': [
        { name: 'svelte-kit', size: 5000 }
      ],
      'solid': [
        { name: 'solid-router', size: 4000 }
      ],
      'lit': [
        { name: 'lit-html', size: 8000 }
      ]
    };

    return [...commonDeps, ...(frameworkSpecific[framework] || [])];
  }

  profileMemoryUsage(): MemoryProfile {
    const memInfo = (performance as any).memory || {};
    
    return {
      heapSize: memInfo.totalJSHeapSize || 0,
      heapUsed: memInfo.usedJSHeapSize || 0,
      external: memInfo.totalJSHeapSize - memInfo.usedJSHeapSize || 0,
      arrayBuffers: 0,
      leakSuspected: (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) > 0.9
    };
  }

  measureFirstPaint(): PaintMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    
    return {
      firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      largestContentfulPaint: 0, // Would need to be measured separately
      domInteractive: navigation?.domInteractive || 0,
      domComplete: navigation?.domComplete || 0
    };
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// PerformanceProfiler Class
class PerformanceProfiler {
  private renderMetrics: Map<string, RenderMetrics> = new Map();
  private startTimes: Map<string, number> = new Map();

  measureRenderTime(componentName: string): RenderMetrics {
    const existing = this.renderMetrics.get(componentName) || {
      componentName,
      renderTime: 0,
      reconciliationTime: 0,
      updateCount: 0,
      rerenderCount: 0
    };

    // Simulate render measurement
    const renderTime = Math.random() * 10 + 1; // 1-11ms
    const reconciliationTime = renderTime * 0.3; // 30% of render time

    const updated = {
      ...existing,
      renderTime: (existing.renderTime + renderTime) / 2, // Average
      reconciliationTime: (existing.reconciliationTime + reconciliationTime) / 2,
      updateCount: existing.updateCount + 1,
      rerenderCount: existing.rerenderCount + (Math.random() > 0.7 ? 1 : 0)
    };

    this.renderMetrics.set(componentName, updated);
    return updated;
  }

  startMeasurement(id: string) {
    this.startTimes.set(id, performance.now());
    performance.mark(`${id}-start`);
  }

  endMeasurement(id: string): number {
    const startTime = this.startTimes.get(id);
    const endTime = performance.now();
    
    if (startTime) {
      performance.mark(`${id}-end`);
      performance.measure(id, `${id}-start`, `${id}-end`);
      this.startTimes.delete(id);
      return endTime - startTime;
    }
    
    return 0;
  }

  analyzeReconciliation(): { averageTime: number; efficiency: number } {
    const metrics = Array.from(this.renderMetrics.values());
    const avgReconciliation = metrics.reduce((sum, m) => sum + m.reconciliationTime, 0) / metrics.length;
    const efficiency = 1 - (avgReconciliation / metrics.reduce((sum, m) => sum + m.renderTime, 0));
    
    return {
      averageTime: avgReconciliation,
      efficiency: Math.max(0, efficiency)
    };
  }

  detectMemoryLeaks(): { suspected: boolean; growth: number; recommendations: string[] } {
    const profile = new BenchmarkSuite().profileMemoryUsage();
    const growth = profile.heapUsed / profile.heapSize;
    
    return {
      suspected: profile.leakSuspected,
      growth,
      recommendations: growth > 0.8 ? [
        'Check for unremoved event listeners',
        'Verify component cleanup in useEffect',
        'Review closure usage for memory retention'
      ] : []
    };
  }
}

// MetricsCollector Class
class MetricsCollector {
  private webVitals: WebVitalMetrics | null = null;
  private customMarkers: PerformanceMarkers[] = [];

  async collectWebVitals(): Promise<WebVitalMetrics> {
    // In a real implementation, this would use the web-vitals library
    return new Promise((resolve) => {
      // Simulate Web Vitals collection
      setTimeout(() => {
        this.webVitals = {
          lcp: Math.random() * 2000 + 1000, // 1-3s
          fid: Math.random() * 100 + 50,    // 50-150ms
          cls: Math.random() * 0.1,          // 0-0.1
          fcp: Math.random() * 1500 + 500,  // 0.5-2s
          ttfb: Math.random() * 500 + 100   // 100-600ms
        };
        resolve(this.webVitals);
      }, 1000);
    });
  }

  createCustomMarker(name: string, metadata: Record<string, any>): PerformanceMarkers {
    const startTime = performance.now();
    performance.mark(`${name}-start`);
    
    const marker: PerformanceMarkers = {
      name,
      startTime,
      duration: 0,
      metadata
    };
    
    this.customMarkers.push(marker);
    return marker;
  }

  completeCustomMarker(name: string): PerformanceMarkers | null {
    const marker = this.customMarkers.find(m => m.name === name && m.duration === 0);
    if (marker) {
      const endTime = performance.now();
      marker.duration = endTime - marker.startTime;
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
    return marker || null;
  }

  trackUserInteractions(): { clicks: number; scrolls: number; inputs: number } {
    // In a real implementation, this would track actual user interactions
    return {
      clicks: Math.floor(Math.random() * 50) + 10,
      scrolls: Math.floor(Math.random() * 100) + 20,
      inputs: Math.floor(Math.random() * 20) + 5
    };
  }

  monitorNetworkRequests(): { count: number; averageTime: number; errors: number } {
    // Simulate network monitoring
    return {
      count: Math.floor(Math.random() * 20) + 5,
      averageTime: Math.random() * 1000 + 200,
      errors: Math.floor(Math.random() * 3)
    };
  }
}

// ReportGenerator Class
class ReportGenerator {
  generateComparativeCharts(results: BenchmarkResult[]): any[] {
    const frameworks = [...new Set(results.map(r => r.framework))];
    const testNames = [...new Set(results.map(r => r.testName))];
    
    return testNames.map(testName => {
      const testResults = results.filter(r => r.testName === testName);
      return {
        testName,
        data: frameworks.map(framework => {
          const result = testResults.find(r => r.framework === framework);
          return {
            framework,
            duration: result?.duration || 0,
            memoryUsage: result?.memoryUsage || 0
          };
        })
      };
    });
  }

  createRecommendations(results: BenchmarkResult[], webVitals: WebVitalMetrics): string[] {
    const recommendations: string[] = [];
    
    // Performance recommendations
    if (webVitals.lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint - consider image optimization and critical CSS');
    }
    
    if (webVitals.fid > 100) {
      recommendations.push('Reduce First Input Delay - minimize JavaScript execution time');
    }
    
    if (webVitals.cls > 0.1) {
      recommendations.push('Improve Cumulative Layout Shift - reserve space for dynamic content');
    }
    
    // Framework-specific recommendations
    const avgMemoryByFramework = this.calculateAverageMemoryUsage(results);
    const highMemoryFrameworks = Object.entries(avgMemoryByFramework)
      .filter(([_, memory]) => memory > 1000000) // 1MB threshold
      .map(([framework]) => framework);
    
    if (highMemoryFrameworks.length > 0) {
      recommendations.push(`Consider memory optimization for: ${highMemoryFrameworks.join(', ')}`);
    }
    
    return recommendations;
  }

  private calculateAverageMemoryUsage(results: BenchmarkResult[]): Record<string, number> {
    const memoryByFramework: Record<string, number[]> = {};
    
    results.forEach(result => {
      if (!memoryByFramework[result.framework]) {
        memoryByFramework[result.framework] = [];
      }
      memoryByFramework[result.framework].push(result.memoryUsage);
    });
    
    return Object.entries(memoryByFramework).reduce((acc, [framework, memories]) => {
      acc[framework] = memories.reduce((sum, mem) => sum + mem, 0) / memories.length;
      return acc;
    }, {} as Record<string, number>);
  }

  buildDecisionMatrix(): DecisionMatrix {
    const criteria = [
      { name: 'Performance', weight: 0.25, frameworks: { react: 8, vue: 8.5, svelte: 9.5, solid: 9, lit: 8 } },
      { name: 'Bundle Size', weight: 0.15, frameworks: { react: 6, vue: 7, svelte: 10, solid: 9, lit: 8 } },
      { name: 'Learning Curve', weight: 0.20, frameworks: { react: 7, vue: 9, svelte: 8, solid: 7, lit: 6 } },
      { name: 'Ecosystem', weight: 0.25, frameworks: { react: 10, vue: 8, svelte: 6, solid: 5, lit: 5 } },
      { name: 'Community', weight: 0.15, frameworks: { react: 10, vue: 8, svelte: 7, solid: 6, lit: 6 } }
    ];
    
    const frameworks = Object.keys(criteria[0].frameworks);
    const scores = frameworks.map(framework => {
      const score = criteria.reduce((sum, criterion) => {
        return sum + (criterion.frameworks[framework] * criterion.weight);
      }, 0);
      
      return { framework, score };
    }).sort((a, b) => b.score - a.score);
    
    const recommendations = scores.map(({ framework, score }) => ({
      framework,
      score: Math.round(score * 10) / 10,
      strengths: this.getFrameworkStrengths(framework),
      weaknesses: this.getFrameworkWeaknesses(framework),
      useCase: this.getFrameworkUseCase(framework)
    }));
    
    return { criteria, recommendations };
  }

  private getFrameworkStrengths(framework: string): string[] {
    const strengths = {
      react: ['Large ecosystem', 'Strong community', 'Flexible architecture'],
      vue: ['Easy learning curve', 'Great documentation', 'Progressive adoption'],
      svelte: ['Minimal bundle size', 'Compile-time optimizations', 'Simple syntax'],
      solid: ['Fine-grained reactivity', 'No virtual DOM', 'Great performance'],
      lit: ['Web standards', 'Lightweight', 'Framework agnostic']
    };
    
    return strengths[framework] || [];
  }

  private getFrameworkWeaknesses(framework: string): string[] {
    const weaknesses = {
      react: ['Large bundle size', 'Frequent updates', 'Complex state management'],
      vue: ['Smaller ecosystem than React', 'Less enterprise adoption'],
      svelte: ['Smaller community', 'Limited tooling', 'Compile step complexity'],
      solid: ['Small ecosystem', 'Learning curve', 'Limited resources'],
      lit: ['Limited framework features', 'Manual state management', 'Browser support']
    };
    
    return weaknesses[framework] || [];
  }

  private getFrameworkUseCase(framework: string): string {
    const useCases = {
      react: 'Large applications with complex state management needs',
      vue: 'Progressive enhancement and medium-sized applications',
      svelte: 'Performance-critical applications with size constraints',
      solid: 'High-performance applications with complex interactions',
      lit: 'Web components and design systems'
    };
    
    return useCases[framework] || 'General purpose applications';
  }
}

// Main Component
const FrameworkPerformanceComparison: React.FC = () => {
  const [benchmarkSuite] = useState(() => new BenchmarkSuite());
  const [profiler] = useState(() => new PerformanceProfiler());
  const [metricsCollector] = useState(() => new MetricsCollector());
  const [reportGenerator] = useState(() => new ReportGenerator());
  
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [webVitals, setWebVitals] = useState<WebVitalMetrics | null>(null);
  const [memoryProfile, setMemoryProfile] = useState<MemoryProfile | null>(null);
  const [decisionMatrix, setDecisionMatrix] = useState<DecisionMatrix | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('benchmarks');

  const frameworks = ['react', 'vue', 'svelte', 'solid', 'lit'];

  useEffect(() => {
    return () => {
      benchmarkSuite.cleanup();
    };
  }, [benchmarkSuite]);

  const runBenchmarks = useCallback(async () => {
    setIsRunning(true);
    try {
      // Run benchmarks
      const results = await benchmarkSuite.runRuntimeBenchmarks(frameworks);
      setBenchmarkResults(results);
      
      // Collect Web Vitals
      const vitals = await metricsCollector.collectWebVitals();
      setWebVitals(vitals);
      
      // Profile memory
      const memory = benchmarkSuite.profileMemoryUsage();
      setMemoryProfile(memory);
      
      // Generate decision matrix
      const matrix = reportGenerator.buildDecisionMatrix();
      setDecisionMatrix(matrix);
      
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [benchmarkSuite, metricsCollector, reportGenerator]);

  const chartData = useMemo(() => {
    if (!benchmarkResults.length) return [];
    return reportGenerator.generateComparativeCharts(benchmarkResults);
  }, [benchmarkResults, reportGenerator]);

  const recommendations = useMemo(() => {
    if (!benchmarkResults.length || !webVitals) return [];
    return reportGenerator.createRecommendations(benchmarkResults, webVitals);
  }, [benchmarkResults, webVitals, reportGenerator]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const renderBenchmarkCharts = () => {
    if (!chartData.length) return null;

    return (
      <div className="space-y-8">
        {chartData.map(({ testName, data }) => (
          <div key={testName} className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4 capitalize">
              {testName.replace('-', ' ')} Performance
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Execution Time (ms)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="framework" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="duration" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="font-medium mb-2">Memory Usage (bytes)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="framework" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="memoryUsage" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWebVitals = () => {
    if (!webVitals) return null;

    const vitalsData = [
      { name: 'LCP', value: webVitals.lcp, threshold: 2500, unit: 'ms' },
      { name: 'FID', value: webVitals.fid, threshold: 100, unit: 'ms' },
      { name: 'CLS', value: webVitals.cls, threshold: 0.1, unit: '' },
      { name: 'FCP', value: webVitals.fcp, threshold: 1800, unit: 'ms' },
      { name: 'TTFB', value: webVitals.ttfb, threshold: 600, unit: 'ms' }
    ];

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Web Vitals Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {vitalsData.map(({ name, value, threshold, unit }) => (
            <div key={name} className="text-center">
              <div className={`text-2xl font-bold ${value > threshold ? 'text-red-600' : 'text-green-600'}`}>
                {value.toFixed(1)}{unit}
              </div>
              <div className="text-sm text-gray-600">{name}</div>
              <div className="text-xs text-gray-500">
                Threshold: {threshold}{unit}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={vitalsData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={18} domain={[0, 'dataMax']} />
              <Radar
                name="Current Values"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Radar
                name="Thresholds"
                dataKey="threshold"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.3}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderDecisionMatrix = () => {
    if (!decisionMatrix) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Framework Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decisionMatrix.recommendations.slice(0, 3).map((rec, index) => (
              <div key={rec.framework} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold capitalize">{rec.framework}</h4>
                  <div className={`px-2 py-1 rounded text-sm ${
                    index === 0 ? 'bg-green-100 text-green-800' :
                    index === 1 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    Score: {rec.score}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-green-700">Strengths</h5>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {rec.strengths.map(strength => (
                        <li key={strength}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-red-700">Considerations</h5>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {rec.weaknesses.map(weakness => (
                        <li key={weakness}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-blue-700">Best For</h5>
                    <p className="text-sm text-gray-600">{rec.useCase}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Decision Criteria Weights</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={decisionMatrix.criteria.map(c => ({ name: c.name, value: c.weight * 100 }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {decisionMatrix.criteria.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Framework Performance Comparison
          </h1>
          <p className="text-gray-600">
            Comprehensive benchmarking and analysis for modern web frameworks
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-center">
            <button
              onClick={runBenchmarks}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              {isRunning ? 'Running Benchmarks...' : 'Run Performance Analysis'}
            </button>
          </div>
        </div>

        {(benchmarkResults.length > 0 || webVitals || memoryProfile || decisionMatrix) && (
          <>
            <div className="mb-6">
              <nav className="flex space-x-8 justify-center">
                {[
                  { id: 'benchmarks', label: 'Benchmark Results' },
                  { id: 'vitals', label: 'Web Vitals' },
                  { id: 'recommendations', label: 'Recommendations' },
                  { id: 'decision', label: 'Decision Matrix' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="space-y-8">
              {activeTab === 'benchmarks' && renderBenchmarkCharts()}
              {activeTab === 'vitals' && renderWebVitals()}
              
              {activeTab === 'recommendations' && (
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Performance Recommendations</h3>
                  {recommendations.length > 0 ? (
                    <ul className="space-y-2">
                      {recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No specific recommendations at this time. Performance metrics look good!</p>
                  )}
                </div>
              )}
              
              {activeTab === 'decision' && renderDecisionMatrix()}
            </div>
          </>
        )}

        {memoryProfile && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Memory Profile</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(memoryProfile.heapSize / 1024 / 1024).toFixed(1)}MB
                </div>
                <div className="text-sm text-gray-600">Heap Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(memoryProfile.heapUsed / 1024 / 1024).toFixed(1)}MB
                </div>
                <div className="text-sm text-gray-600">Heap Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(memoryProfile.external / 1024 / 1024).toFixed(1)}MB
                </div>
                <div className="text-sm text-gray-600">External</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  memoryProfile.leakSuspected ? 'text-red-600' : 'text-green-600'
                }`}>
                  {memoryProfile.leakSuspected ? 'Warning' : 'Normal'}
                </div>
                <div className="text-sm text-gray-600">Memory Status</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FrameworkPerformanceComparison;