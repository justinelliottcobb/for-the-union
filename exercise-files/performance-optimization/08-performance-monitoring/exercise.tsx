import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Performance monitoring types
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  threshold?: number;
  category: 'core-vitals' | 'runtime' | 'memory' | 'network';
}

interface AlertRule {
  id: string;
  metric: string;
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

interface PerformanceAlert {
  id: string;
  rule: AlertRule;
  value: number;
  timestamp: number;
  acknowledged: boolean;
}

interface ResourceTiming {
  name: string;
  startTime: number;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  type: 'navigation' | 'resource' | 'measure' | 'mark';
}

// TODO: Implement usePerformanceMonitor hook
// This hook should:
// - Monitor Core Web Vitals (LCP, FID, CLS) using PerformanceObserver
// - Track custom performance metrics with performance.measure()
// - Monitor memory usage with performance.memory (if available)
// - Collect network timing data from PerformanceNavigationTiming
// - Implement performance budget alerts and thresholds
// - Provide real-time metric updates and historical data
function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // TODO: Implement startMonitoring function
  const startMonitoring = useCallback(() => {
    // Set up PerformanceObserver for Core Web Vitals
    // Monitor LCP (largest-contentful-paint)
    // Monitor FID (first-input)
    // Monitor CLS (layout-shift)
    // Track custom metrics with marks and measures
    // Set up memory monitoring interval
    // Initialize network timing collection
    console.log('TODO: Implement performance monitoring setup');
  }, []);

  // TODO: Implement stopMonitoring function
  const stopMonitoring = useCallback(() => {
    // Disconnect all PerformanceObservers
    // Clear monitoring intervals
    // Clean up event listeners
    console.log('TODO: Implement monitoring cleanup');
  }, []);

  // TODO: Implement addCustomMetric function
  const addCustomMetric = useCallback((name: string, value: number, category: PerformanceMetric['category'] = 'runtime') => {
    // Add custom performance metric
    // Check against alert rules
    // Trigger alerts if thresholds exceeded
    console.log('TODO: Implement custom metric tracking');
  }, []);

  // TODO: Implement measureFunction decorator
  const measureFunction = useCallback((name: string, fn: Function) => {
    // Return wrapped function that measures execution time
    // Use performance.mark() and performance.measure()
    // Automatically add timing metrics
    console.log('TODO: Implement function measurement wrapper');
    return fn;
  }, []);

  return {
    metrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    addCustomMetric,
    measureFunction,
  };
}

// TODO: Implement PerformanceMonitor component
// This component should provide a comprehensive monitoring dashboard with:
// - Real-time metric display with charts and graphs
// - Performance budget status and threshold indicators
// - Alert management interface with severity levels
// - Historical data trends and performance regression detection
// - Export functionality for performance reports
interface PerformanceMonitorProps {
  autoStart?: boolean;
  budgets?: { [metric: string]: number };
  alertRules?: AlertRule[];
  refreshInterval?: number;
}

function PerformanceMonitor({ 
  autoStart = false, 
  budgets = {}, 
  alertRules = [],
  refreshInterval = 1000 
}: PerformanceMonitorProps) {
  const { metrics, alerts, isMonitoring, startMonitoring, stopMonitoring } = usePerformanceMonitor();

  // TODO: Implement dashboard interface
  // - Display current metrics with visual indicators
  // - Show performance budgets and status
  // - Alert management and acknowledgment
  // - Historical trends and charts
  // - Performance score calculation

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Performance Monitor</h3>
      
      {/* TODO: Add monitoring controls */}
      <div className="p-4 bg-gray-50 rounded">
        <h4 className="font-medium mb-3">Monitoring Status</h4>
        <div className="text-center py-8 text-gray-500">
          TODO: Implement monitoring dashboard interface
        </div>
      </div>
    </div>
  );
}

// TODO: Implement useMemoryProfiler hook
// This hook should:
// - Monitor heap usage with performance.memory API
// - Track memory allocation patterns and trends
// - Detect memory leaks through heap growth analysis
// - Provide memory usage breakdowns by component/feature
// - Generate memory optimization recommendations
function useMemoryProfiler() {
  const [memoryStats, setMemoryStats] = useState({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
  });
  const [memoryHistory, setMemoryHistory] = useState<number[]>([]);

  // TODO: Implement memory monitoring
  const startProfiling = useCallback(() => {
    // Set up interval to collect memory stats
    // Track memory usage trends
    // Detect memory leak patterns
    console.log('TODO: Implement memory profiling');
  }, []);

  // TODO: Implement memory analysis
  const analyzeMemoryUsage = useCallback(() => {
    // Analyze memory growth patterns
    // Detect potential memory leaks
    // Generate optimization recommendations
    console.log('TODO: Implement memory analysis');
    return {
      trend: 'stable' as 'growing' | 'stable' | 'decreasing',
      recommendations: [] as string[],
    };
  }, []);

  return {
    memoryStats,
    memoryHistory,
    startProfiling,
    analyzeMemoryUsage,
  };
}

// TODO: Implement MemoryProfiler component
// This component should provide memory analysis tools:
// - Real-time memory usage graphs and statistics
// - Memory leak detection and warnings
// - Component-level memory attribution
// - Memory optimization recommendations
// - Garbage collection timing and impact analysis
interface MemoryProfilerProps {
  samplingInterval?: number;
  historyLength?: number;
  leakDetectionThreshold?: number;
}

function MemoryProfiler({ 
  samplingInterval = 5000,
  historyLength = 100,
  leakDetectionThreshold = 10 
}: MemoryProfilerProps) {
  const { memoryStats, memoryHistory, startProfiling, analyzeMemoryUsage } = useMemoryProfiler();

  // TODO: Implement memory profiling interface
  // - Memory usage charts and trends
  // - Leak detection alerts
  // - Optimization recommendations
  // - Component memory attribution

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Memory Profiler</h3>
      
      <div className="p-4 bg-gray-50 rounded">
        <div className="text-center py-8 text-gray-500">
          TODO: Implement memory profiling interface
        </div>
      </div>
    </div>
  );
}

// TODO: Implement useNetworkProfiler hook
// This hook should:
// - Monitor network request timing and performance
// - Track resource loading patterns and bottlenecks
// - Analyze bundle loading performance and optimization opportunities
// - Monitor CDN performance and cache effectiveness
// - Provide network optimization recommendations
function useNetworkProfiler() {
  const [networkMetrics, setNetworkMetrics] = useState<ResourceTiming[]>([]);
  const [connectionInfo, setConnectionInfo] = useState({
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
  });

  // TODO: Implement network monitoring
  const startNetworkProfiling = useCallback(() => {
    // Monitor navigation timing
    // Track resource loading performance
    // Analyze network connection quality
    // Monitor cache effectiveness
    console.log('TODO: Implement network profiling');
  }, []);

  // TODO: Implement network analysis
  const analyzeNetworkPerformance = useCallback(() => {
    // Analyze loading bottlenecks
    // Identify optimization opportunities
    // Generate recommendations
    console.log('TODO: Implement network analysis');
    return {
      bottlenecks: [] as string[],
      recommendations: [] as string[],
    };
  }, []);

  return {
    networkMetrics,
    connectionInfo,
    startNetworkProfiling,
    analyzeNetworkPerformance,
  };
}

// TODO: Implement NetworkProfiler component
// This component should provide network analysis tools:
// - Resource loading waterfall charts
// - Network timing analysis and bottleneck identification
// - Cache performance metrics and optimization suggestions
// - Bundle analysis and code splitting recommendations
// - CDN performance monitoring and geographic analysis
interface NetworkProfilerProps {
  enableWaterfall?: boolean;
  trackResources?: boolean;
  analyzeBundles?: boolean;
}

function NetworkProfiler({ 
  enableWaterfall = true,
  trackResources = true,
  analyzeBundles = true 
}: NetworkProfilerProps) {
  const { networkMetrics, connectionInfo, startNetworkProfiling, analyzeNetworkPerformance } = useNetworkProfiler();

  // TODO: Implement network profiling interface
  // - Resource loading waterfall
  // - Network timing charts
  // - Cache analysis
  // - Bundle optimization recommendations

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Network Profiler</h3>
      
      <div className="p-4 bg-gray-50 rounded">
        <div className="text-center py-8 text-gray-500">
          TODO: Implement network profiling interface
        </div>
      </div>
    </div>
  );
}

// TODO: Implement useAlertManager hook
// This hook should:
// - Manage performance alert rules and thresholds
// - Monitor metrics against defined budgets
// - Generate and dispatch alerts when thresholds exceeded
// - Provide alert acknowledgment and management
// - Support different alert channels (console, webhook, UI notification)
function useAlertManager() {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<PerformanceAlert[]>([]);

  // TODO: Implement alert management
  const addAlertRule = useCallback((rule: Omit<AlertRule, 'id'>) => {
    // Add new alert rule with generated ID
    // Validate rule configuration
    // Start monitoring for the rule
    console.log('TODO: Implement alert rule creation');
  }, []);

  // TODO: Implement alert checking
  const checkAlerts = useCallback((metrics: PerformanceMetric[]) => {
    // Check each metric against active rules
    // Generate alerts for threshold violations
    // Handle alert deduplication
    console.log('TODO: Implement alert checking');
  }, []);

  // TODO: Implement alert acknowledgment
  const acknowledgeAlert = useCallback((alertId: string) => {
    // Mark alert as acknowledged
    // Update alert status
    // Log acknowledgment
    console.log('TODO: Implement alert acknowledgment');
  }, []);

  return {
    alertRules,
    activeAlerts,
    addAlertRule,
    checkAlerts,
    acknowledgeAlert,
  };
}

// TODO: Implement AlertManager component
// This component should provide alert management interface:
// - Alert rule configuration and management
// - Active alert display with severity indicators
// - Alert acknowledgment and resolution tracking
// - Alert history and trend analysis
// - Integration with external alerting systems
interface AlertManagerProps {
  defaultRules?: AlertRule[];
  enableNotifications?: boolean;
  webhookUrl?: string;
}

function AlertManager({ 
  defaultRules = [],
  enableNotifications = true,
  webhookUrl 
}: AlertManagerProps) {
  const { alertRules, activeAlerts, addAlertRule, acknowledgeAlert } = useAlertManager();

  // TODO: Implement alert management interface
  // - Rule configuration form
  // - Active alerts display
  // - Alert history
  // - Notification settings

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Alert Manager</h3>
      
      <div className="p-4 bg-gray-50 rounded">
        <div className="text-center py-8 text-gray-500">
          TODO: Implement alert management interface
        </div>
      </div>
    </div>
  );
}

// TODO: Implement main demo component
// This component should integrate all monitoring tools into a comprehensive dashboard:
// - Tabbed interface for different monitoring aspects
// - Real-time performance overview with key metrics
// - Integrated alerting and notification system
// - Performance report generation and export
// - Historical data visualization and trend analysis
export default function PerformanceMonitoringDemo() {
  const [activeTab, setActiveTab] = useState<'overview' | 'memory' | 'network' | 'alerts'>('overview');
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);

  // TODO: Implement comprehensive monitoring dashboard
  // - Performance overview with key metrics
  // - Memory profiling integration
  // - Network analysis tools
  // - Alert management system
  // - Report generation capabilities

  const tabs = [
    { key: 'overview', label: 'Performance Overview' },
    { key: 'memory', label: 'Memory Profiler' },
    { key: 'network', label: 'Network Profiler' },
    { key: 'alerts', label: 'Alert Manager' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Performance Monitoring & Alerting
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Master production performance monitoring, alerting systems, and comprehensive profiling tools.
            Learn to build real-time dashboards and automated performance tracking.
          </p>
        </div>

        {/* Global monitoring toggle */}
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={monitoringEnabled}
              onChange={(e) => setMonitoringEnabled(e.target.checked)}
              className="rounded"
            />
            <span className="font-medium">Enable Performance Monitoring</span>
          </label>
        </div>

        {/* Tab navigation */}
        <div className="flex justify-center space-x-4">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={"px-6 py-3 rounded-lg font-medium transition-colors " + (
                activeTab === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Performance Overview</h2>
                <PerformanceMonitor 
                  autoStart={monitoringEnabled}
                  budgets={{
                    LCP: 2500,
                    FID: 100,
                    CLS: 0.1,
                  }}
                  refreshInterval={1000}
                />
              </div>
            )}

            {activeTab === 'memory' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Memory Profiler</h2>
                <MemoryProfiler 
                  samplingInterval={5000}
                  historyLength={100}
                  leakDetectionThreshold={10}
                />
              </div>
            )}

            {activeTab === 'network' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Network Profiler</h2>
                <NetworkProfiler 
                  enableWaterfall={true}
                  trackResources={true}
                  analyzeBundles={true}
                />
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Alert Manager</h2>
                <AlertManager 
                  enableNotifications={true}
                  defaultRules={[
                    {
                      id: '1',
                      metric: 'LCP',
                      condition: 'above',
                      threshold: 2500,
                      severity: 'high',
                      enabled: true,
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        {/* Performance tips */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Performance Monitoring Best Practices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Monitor Core Web Vitals continuously in production</li>
              <li>• Set performance budgets and alert thresholds</li>
              <li>• Track memory usage patterns and detect leaks</li>
              <li>• Analyze network bottlenecks and optimization opportunities</li>
            </ul>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Implement automated performance regression detection</li>
              <li>• Use Real User Monitoring (RUM) for production insights</li>
              <li>• Generate regular performance reports and trends</li>
              <li>• Integrate monitoring with CI/CD performance gates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}