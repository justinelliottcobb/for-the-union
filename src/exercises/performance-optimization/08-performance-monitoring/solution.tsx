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

// Core performance monitor hook
function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const observersRef = useRef<PerformanceObserver[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  const addMetric = useCallback((name: string, value: number, category: PerformanceMetric['category'], threshold?: number) => {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      threshold,
      category
    };

    setMetrics(prev => {
      const filtered = prev.filter(m => !(m.name === name && Date.now() - m.timestamp < 1000));
      return [...filtered, metric].slice(-100); // Keep last 100 metrics
    });

    return metric;
  }, []);

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);

    // Core Web Vitals monitoring
    try {
      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        addMetric('LCP', lastEntry.startTime, 'core-vitals', 2500);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observersRef.current.push(lcpObserver);

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          addMetric('FID', fid, 'core-vitals', 100);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      observersRef.current.push(fidObserver);

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            addMetric('CLS', clsValue, 'core-vitals', 0.1);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observersRef.current.push(clsObserver);

      // Navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          addMetric('DOMContentLoaded', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart, 'network');
          addMetric('LoadComplete', entry.loadEventEnd - entry.loadEventStart, 'network');
          addMetric('TTFB', entry.responseStart - entry.requestStart, 'network', 600);
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      observersRef.current.push(navigationObserver);

    } catch (error) {
      console.warn('PerformanceObserver not supported or failed:', error);
    }

    // Memory monitoring
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        addMetric('HeapUsed', memory.usedJSHeapSize / 1024 / 1024, 'memory'); // MB
        addMetric('HeapTotal', memory.totalJSHeapSize / 1024 / 1024, 'memory'); // MB
        addMetric('HeapLimit', memory.jsHeapSizeLimit / 1024 / 1024, 'memory'); // MB
        
        const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        addMetric('HeapUsage', usage * 100, 'memory', 80); // 80% threshold
      }
    }, 5000);
    intervalsRef.current.push(memoryInterval);

    // Custom runtime metrics
    const runtimeInterval = setInterval(() => {
      // Frame rate approximation
      let frameCount = 0;
      const startTime = performance.now();
      
      const countFrames = () => {
        frameCount++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(countFrames);
        } else {
          addMetric('FPS', frameCount, 'runtime', 60);
        }
      };
      requestAnimationFrame(countFrames);

      // Long task detection
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          addMetric('LongTask', entry.duration, 'runtime', 50);
        });
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        observersRef.current.push(longTaskObserver);
      } catch (error) {
        // Long task API not supported
      }
    }, 10000);
    intervalsRef.current.push(runtimeInterval);

  }, [isMonitoring, addMetric]);

  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    setIsMonitoring(false);

    // Disconnect all observers
    observersRef.current.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Error disconnecting observer:', error);
      }
    });
    observersRef.current = [];

    // Clear all intervals
    intervalsRef.current.forEach(interval => clearInterval(interval));
    intervalsRef.current = [];
  }, [isMonitoring]);

  const addCustomMetric = useCallback((name: string, value: number, category: PerformanceMetric['category'] = 'runtime') => {
    // Mark the start of measurement
    performance.mark(`${name}-start`);
    
    // Mark the end and measure
    setTimeout(() => {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measures = performance.getEntriesByName(name, 'measure');
      if (measures.length > 0) {
        const measure = measures[measures.length - 1];
        addMetric(name, measure.duration, category);
      }
    }, 0);

    return addMetric(name, value, category);
  }, [addMetric]);

  const measureFunction = useCallback((name: string, fn: Function) => {
    return async (...args: any[]) => {
      const startTime = performance.now();
      
      try {
        const result = await fn(...args);
        const duration = performance.now() - startTime;
        addCustomMetric(`${name}-duration`, duration, 'runtime');
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        addCustomMetric(`${name}-error-duration`, duration, 'runtime');
        throw error;
      }
    };
  }, [addCustomMetric]);

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

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

// Performance monitor component
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
  const [currentMetrics, setCurrentMetrics] = useState<{ [key: string]: PerformanceMetric }>({});

  // Update current metrics
  useEffect(() => {
    const latest: { [key: string]: PerformanceMetric } = {};
    metrics.forEach(metric => {
      if (!latest[metric.name] || latest[metric.name].timestamp < metric.timestamp) {
        latest[metric.name] = metric;
      }
    });
    setCurrentMetrics(latest);
  }, [metrics]);

  // Auto-start monitoring
  useEffect(() => {
    if (autoStart && !isMonitoring) {
      startMonitoring();
    }
  }, [autoStart, isMonitoring, startMonitoring]);

  const getMetricStatus = (metric: PerformanceMetric) => {
    const budget = budgets[metric.name] || metric.threshold;
    if (!budget) return 'unknown';
    
    if (metric.value <= budget) return 'good';
    if (metric.value <= budget * 1.5) return 'needs-improvement';
    return 'poor';
  };

  const calculatePerformanceScore = () => {
    const coreVitals = ['LCP', 'FID', 'CLS'];
    const scores = coreVitals.map(vital => {
      const metric = currentMetrics[vital];
      if (!metric) return 0;
      
      const status = getMetricStatus(metric);
      switch (status) {
        case 'good': return 100;
        case 'needs-improvement': return 70;
        case 'poor': return 40;
        default: return 0;
      }
    });
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / Math.max(scores.length, 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Performance Monitor</h3>
        <div className="flex space-x-2">
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`px-4 py-2 rounded font-medium ${
              isMonitoring
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
        </div>
      </div>

      {/* Performance Score */}
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="font-medium mb-2">Performance Score</h4>
        <div className="flex items-center space-x-4">
          <div className="text-3xl font-bold">
            {calculatePerformanceScore()}
          </div>
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  calculatePerformanceScore() >= 90 ? 'bg-green-500' :
                  calculatePerformanceScore() >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${calculatePerformanceScore()}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['LCP', 'FID', 'CLS'].map(vital => {
          const metric = currentMetrics[vital];
          const status = metric ? getMetricStatus(metric) : 'unknown';
          
          return (
            <div key={vital} className="bg-white p-4 rounded-lg border">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium">{vital}</h5>
                <div className={`w-3 h-3 rounded-full ${
                  status === 'good' ? 'bg-green-500' :
                  status === 'needs-improvement' ? 'bg-yellow-500' :
                  status === 'poor' ? 'bg-red-500' : 'bg-gray-300'
                }`}></div>
              </div>
              <div className="text-2xl font-bold mb-1">
                {metric ? (
                  vital === 'CLS' 
                    ? metric.value.toFixed(3)
                    : Math.round(metric.value) + (vital === 'LCP' || vital === 'FID' ? 'ms' : '')
                ) : '--'}
              </div>
              <div className="text-sm text-gray-600">
                Budget: {budgets[vital] || 'Not set'}
                {budgets[vital] && vital !== 'CLS' && 'ms'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Memory Metrics */}
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="font-medium mb-3">Memory Usage</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['HeapUsed', 'HeapTotal', 'HeapLimit', 'HeapUsage'].map(memoryMetric => {
            const metric = currentMetrics[memoryMetric];
            return (
              <div key={memoryMetric} className="text-center">
                <div className="text-sm text-gray-600 mb-1">
                  {memoryMetric.replace('Heap', '')}
                </div>
                <div className="text-lg font-bold">
                  {metric ? (
                    memoryMetric === 'HeapUsage' 
                      ? metric.value.toFixed(1) + '%'
                      : metric.value.toFixed(1) + 'MB'
                  ) : '--'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Network Metrics */}
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="font-medium mb-3">Network Performance</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['TTFB', 'DOMContentLoaded', 'LoadComplete'].map(networkMetric => {
            const metric = currentMetrics[networkMetric];
            return (
              <div key={networkMetric} className="text-center">
                <div className="text-sm text-gray-600 mb-1">{networkMetric}</div>
                <div className="text-lg font-bold">
                  {metric ? Math.round(metric.value) + 'ms' : '--'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Runtime Metrics */}
      {(currentMetrics['FPS'] || currentMetrics['LongTask']) && (
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-3">Runtime Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentMetrics['FPS'] && (
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">FPS</div>
                <div className="text-lg font-bold">
                  {Math.round(currentMetrics['FPS'].value)}
                </div>
              </div>
            )}
            {currentMetrics['LongTask'] && (
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Long Task</div>
                <div className="text-lg font-bold">
                  {Math.round(currentMetrics['LongTask'].value)}ms
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-red-300">
          <h4 className="font-medium mb-3 text-red-800">Active Alerts</h4>
          <div className="space-y-2">
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="p-2 bg-red-50 rounded text-sm">
                <div className="font-medium text-red-800">
                  {alert.rule.metric} {alert.rule.condition} {alert.rule.threshold}
                </div>
                <div className="text-red-600">
                  Current value: {alert.value} | {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Memory profiler hook
function useMemoryProfiler() {
  const [memoryStats, setMemoryStats] = useState({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
  });
  const [memoryHistory, setMemoryHistory] = useState<number[]>([]);
  const [isProfiling, setIsProfiling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const startProfiling = useCallback(() => {
    if (isProfiling) return;
    setIsProfiling(true);

    const collectMemoryStats = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const stats = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
        
        setMemoryStats(stats);
        setMemoryHistory(prev => [...prev.slice(-99), memory.usedJSHeapSize]); // Keep last 100 samples
      }
    };

    collectMemoryStats();
    intervalRef.current = setInterval(collectMemoryStats, 5000);
  }, [isProfiling]);

  const stopProfiling = useCallback(() => {
    setIsProfiling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const analyzeMemoryUsage = useCallback(() => {
    if (memoryHistory.length < 10) {
      return {
        trend: 'insufficient-data' as const,
        recommendations: ['Collect more data points for analysis'],
      };
    }

    // Calculate trend using linear regression
    const n = memoryHistory.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = memoryHistory;
    
    const xMean = x.reduce((a, b) => a + b) / n;
    const yMean = y.reduce((a, b) => a + b) / n;
    
    const slope = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0) /
                  x.reduce((sum, xi) => sum + (xi - xMean) ** 2, 0);
    
    const growthRate = slope / yMean;
    
    let trend: 'growing' | 'stable' | 'decreasing';
    if (growthRate > 0.01) trend = 'growing';
    else if (growthRate < -0.01) trend = 'decreasing';
    else trend = 'stable';

    const recommendations = [];
    if (trend === 'growing') {
      recommendations.push('Memory usage is increasing - check for memory leaks');
      recommendations.push('Review event listeners and ensure proper cleanup');
      recommendations.push('Check for retained DOM references in closures');
    } else if (memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit > 0.8) {
      recommendations.push('High memory usage detected - consider optimization');
      recommendations.push('Implement object pooling for frequently created objects');
      recommendations.push('Review large data structures and caching strategies');
    } else {
      recommendations.push('Memory usage appears healthy');
    }

    return { trend, recommendations };
  }, [memoryHistory, memoryStats]);

  useEffect(() => {
    return () => {
      stopProfiling();
    };
  }, [stopProfiling]);

  return {
    memoryStats,
    memoryHistory,
    isProfiling,
    startProfiling,
    stopProfiling,
    analyzeMemoryUsage,
  };
}

// Memory profiler component
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
  const { memoryStats, memoryHistory, isProfiling, startProfiling, stopProfiling, analyzeMemoryUsage } = useMemoryProfiler();
  const analysis = analyzeMemoryUsage();

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const getUsagePercentage = () => {
    if (!memoryStats.jsHeapSizeLimit) return 0;
    return (memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 100;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Memory Profiler</h3>
        <button
          onClick={isProfiling ? stopProfiling : startProfiling}
          className={`px-4 py-2 rounded font-medium ${
            isProfiling
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isProfiling ? 'Stop Profiling' : 'Start Profiling'}
        </button>
      </div>

      {/* Memory Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-2">Used Heap</h4>
          <div className="text-2xl font-bold">
            {formatBytes(memoryStats.usedJSHeapSize)}
          </div>
          <div className="text-sm text-gray-600">
            {getUsagePercentage().toFixed(1)}% of limit
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-2">Total Heap</h4>
          <div className="text-2xl font-bold">
            {formatBytes(memoryStats.totalJSHeapSize)}
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-2">Heap Limit</h4>
          <div className="text-2xl font-bold">
            {formatBytes(memoryStats.jsHeapSizeLimit)}
          </div>
        </div>
      </div>

      {/* Memory Usage Chart */}
      {memoryHistory.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-3">Memory Usage Trend</h4>
          <div className="h-32 relative bg-gray-50 rounded">
            <svg className="w-full h-full">
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                points={memoryHistory.map((value, index) => {
                  const x = (index / (memoryHistory.length - 1)) * 100;
                  const y = 100 - ((value - Math.min(...memoryHistory)) / (Math.max(...memoryHistory) - Math.min(...memoryHistory))) * 80;
                  return `${x}%,${y}%`;
                }).join(' ')}
              />
            </svg>
          </div>
        </div>
      )}

      {/* Memory Analysis */}
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="font-medium mb-3">Memory Analysis</h4>
        <div className="mb-3">
          <span className="text-sm text-gray-600">Trend: </span>
          <span className={`font-medium ${
            analysis.trend === 'growing' ? 'text-red-600' :
            analysis.trend === 'decreasing' ? 'text-green-600' :
            analysis.trend === 'stable' ? 'text-blue-600' : 'text-gray-600'
          }`}>
            {analysis.trend.replace('-', ' ')}
          </span>
        </div>
        <div>
          <h5 className="font-medium mb-2">Recommendations:</h5>
          <ul className="text-sm space-y-1">
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="text-gray-700">• {rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Network profiler hook
function useNetworkProfiler() {
  const [networkMetrics, setNetworkMetrics] = useState<ResourceTiming[]>([]);
  const [connectionInfo, setConnectionInfo] = useState({
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
  });
  const [isProfiling, setIsProfiling] = useState(false);

  const startNetworkProfiling = useCallback(() => {
    setIsProfiling(true);

    // Collect existing performance entries
    const collectMetrics = () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      const resourceTimings: ResourceTiming[] = resources.map(resource => ({
        name: resource.name,
        startTime: resource.startTime,
        duration: resource.duration,
        transferSize: resource.transferSize || 0,
        encodedBodySize: resource.encodedBodySize || 0,
        type: 'resource'
      }));

      if (navigation) {
        resourceTimings.unshift({
          name: 'Navigation',
          startTime: navigation.startTime,
          duration: navigation.loadEventEnd - navigation.navigationStart,
          transferSize: navigation.transferSize || 0,
          encodedBodySize: navigation.encodedBodySize || 0,
          type: 'navigation'
        });
      }

      setNetworkMetrics(resourceTimings);
    };

    // Get connection info
    const getConnectionInfo = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        setConnectionInfo({
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100,
        });
      }
    };

    collectMetrics();
    getConnectionInfo();
  }, []);

  const analyzeNetworkPerformance = useCallback(() => {
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    // Analyze slow resources
    const slowResources = networkMetrics.filter(r => r.duration > 1000);
    if (slowResources.length > 0) {
      bottlenecks.push(`${slowResources.length} resources loading slowly (>1s)`);
      recommendations.push('Consider optimizing slow-loading resources');
      recommendations.push('Implement resource preloading for critical assets');
    }

    // Analyze large resources
    const largeResources = networkMetrics.filter(r => r.transferSize > 1024 * 1024); // >1MB
    if (largeResources.length > 0) {
      bottlenecks.push(`${largeResources.length} large resources (>1MB)`);
      recommendations.push('Compress large resources or implement lazy loading');
      recommendations.push('Consider code splitting for large JavaScript bundles');
    }

    // Analyze total requests
    if (networkMetrics.length > 100) {
      bottlenecks.push('High number of network requests');
      recommendations.push('Bundle resources to reduce request count');
      recommendations.push('Implement HTTP/2 server push for critical resources');
    }

    // General recommendations
    if (bottlenecks.length === 0) {
      recommendations.push('Network performance appears good');
      recommendations.push('Consider implementing a CDN for global users');
    }

    return { bottlenecks, recommendations };
  }, [networkMetrics]);

  return {
    networkMetrics,
    connectionInfo,
    isProfiling,
    startNetworkProfiling,
    analyzeNetworkPerformance,
  };
}

// Network profiler component
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
  const { networkMetrics, connectionInfo, isProfiling, startNetworkProfiling, analyzeNetworkPerformance } = useNetworkProfiler();
  const analysis = analyzeNetworkPerformance();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const getTotalStats = () => {
    return {
      totalRequests: networkMetrics.length,
      totalSize: networkMetrics.reduce((sum, r) => sum + r.transferSize, 0),
      averageDuration: networkMetrics.length > 0 
        ? networkMetrics.reduce((sum, r) => sum + r.duration, 0) / networkMetrics.length 
        : 0
    };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Network Profiler</h3>
        <button
          onClick={startNetworkProfiling}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Analyze Network
        </button>
      </div>

      {/* Connection Info */}
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="font-medium mb-3">Connection Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Effective Type</div>
            <div className="text-lg font-bold">{connectionInfo.effectiveType}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Downlink</div>
            <div className="text-lg font-bold">{connectionInfo.downlink} Mbps</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">RTT</div>
            <div className="text-lg font-bold">{connectionInfo.rtt} ms</div>
          </div>
        </div>
      </div>

      {/* Network Stats */}
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="font-medium mb-3">Network Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Total Requests</div>
            <div className="text-lg font-bold">{stats.totalRequests}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Total Size</div>
            <div className="text-lg font-bold">{formatSize(stats.totalSize)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Average Duration</div>
            <div className="text-lg font-bold">{Math.round(stats.averageDuration)} ms</div>
          </div>
        </div>
      </div>

      {/* Resource List */}
      {networkMetrics.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium mb-3">Resource Timing</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {networkMetrics.slice(0, 20).map((resource, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <div className="flex-1 truncate">
                  <div className="font-medium truncate">
                    {resource.name.split('/').pop() || resource.name}
                  </div>
                  <div className="text-gray-600 text-xs">{resource.type}</div>
                </div>
                <div className="text-right">
                  <div>{Math.round(resource.duration)}ms</div>
                  <div className="text-gray-600 text-xs">
                    {formatSize(resource.transferSize)}
                  </div>
                </div>
              </div>
            ))}
            {networkMetrics.length > 20 && (
              <div className="text-center text-gray-500 text-sm">
                ... and {networkMetrics.length - 20} more resources
              </div>
            )}
          </div>
        </div>
      )}

      {/* Network Analysis */}
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="font-medium mb-3">Performance Analysis</h4>
        
        {analysis.bottlenecks.length > 0 && (
          <div className="mb-4">
            <h5 className="font-medium mb-2 text-red-800">Bottlenecks Detected:</h5>
            <ul className="text-sm space-y-1">
              {analysis.bottlenecks.map((bottleneck, index) => (
                <li key={index} className="text-red-700">• {bottleneck}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div>
          <h5 className="font-medium mb-2">Recommendations:</h5>
          <ul className="text-sm space-y-1">
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="text-gray-700">• {rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Alert manager hook
function useAlertManager() {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<PerformanceAlert[]>([]);

  const addAlertRule = useCallback((rule: Omit<AlertRule, 'id'>) => {
    const newRule: AlertRule = {
      ...rule,
      id: Math.random().toString(36).substr(2, 9),
    };
    setAlertRules(prev => [...prev, newRule]);
  }, []);

  const removeAlertRule = useCallback((ruleId: string) => {
    setAlertRules(prev => prev.filter(rule => rule.id !== ruleId));
  }, []);

  const toggleAlertRule = useCallback((ruleId: string) => {
    setAlertRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  }, []);

  const checkAlerts = useCallback((metrics: PerformanceMetric[]) => {
    const now = Date.now();
    const newAlerts: PerformanceAlert[] = [];

    metrics.forEach(metric => {
      const applicableRules = alertRules.filter(rule => 
        rule.metric === metric.name && rule.enabled
      );

      applicableRules.forEach(rule => {
        let violation = false;
        
        switch (rule.condition) {
          case 'above':
            violation = metric.value > rule.threshold;
            break;
          case 'below':
            violation = metric.value < rule.threshold;
            break;
          case 'equals':
            violation = Math.abs(metric.value - rule.threshold) < 0.01;
            break;
        }

        if (violation) {
          // Check if alert already exists for this rule
          const existingAlert = activeAlerts.find(alert => 
            alert.rule.id === rule.id && now - alert.timestamp < 300000 // 5 minutes
          );

          if (!existingAlert) {
            const alert: PerformanceAlert = {
              id: `${rule.id}-${now}`,
              rule,
              value: metric.value,
              timestamp: now,
              acknowledged: false
            };
            newAlerts.push(alert);
          }
        }
      });
    });

    if (newAlerts.length > 0) {
      setActiveAlerts(prev => [...prev, ...newAlerts]);
    }
  }, [alertRules, activeAlerts]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setActiveAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  const clearAcknowledgedAlerts = useCallback(() => {
    setActiveAlerts(prev => prev.filter(alert => !alert.acknowledged));
  }, []);

  return {
    alertRules,
    activeAlerts,
    addAlertRule,
    removeAlertRule,
    toggleAlertRule,
    checkAlerts,
    acknowledgeAlert,
    clearAcknowledgedAlerts,
  };
}

// Alert manager component
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
  const { 
    alertRules, 
    activeAlerts, 
    addAlertRule, 
    removeAlertRule, 
    toggleAlertRule,
    acknowledgeAlert,
    clearAcknowledgedAlerts 
  } = useAlertManager();

  const [newRule, setNewRule] = useState({
    metric: '',
    condition: 'above' as AlertRule['condition'],
    threshold: 0,
    severity: 'medium' as AlertRule['severity']
  });

  const handleAddRule = () => {
    if (newRule.metric && newRule.threshold > 0) {
      addAlertRule({
        ...newRule,
        enabled: true
      });
      setNewRule({
        metric: '',
        condition: 'above',
        threshold: 0,
        severity: 'medium'
      });
    }
  };

  const getSeverityColor = (severity: AlertRule['severity']) => {
    switch (severity) {
      case 'low': return 'text-blue-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Alert Manager</h3>

      {/* Add New Rule */}
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="font-medium mb-3">Add Alert Rule</h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Metric name"
            value={newRule.metric}
            onChange={(e) => setNewRule(prev => ({ ...prev, metric: e.target.value }))}
            className="border rounded px-3 py-2"
          />
          <select
            value={newRule.condition}
            onChange={(e) => setNewRule(prev => ({ ...prev, condition: e.target.value as AlertRule['condition'] }))}
            className="border rounded px-3 py-2"
          >
            <option value="above">Above</option>
            <option value="below">Below</option>
            <option value="equals">Equals</option>
          </select>
          <input
            type="number"
            placeholder="Threshold"
            value={newRule.threshold || ''}
            onChange={(e) => setNewRule(prev => ({ ...prev, threshold: parseFloat(e.target.value) || 0 }))}
            className="border rounded px-3 py-2"
          />
          <select
            value={newRule.severity}
            onChange={(e) => setNewRule(prev => ({ ...prev, severity: e.target.value as AlertRule['severity'] }))}
            className="border rounded px-3 py-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <button
            onClick={handleAddRule}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Rule
          </button>
        </div>
      </div>

      {/* Alert Rules */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium">Alert Rules</h4>
          <span className="text-sm text-gray-600">{alertRules.length} rules</span>
        </div>
        
        {alertRules.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No alert rules configured
          </div>
        ) : (
          <div className="space-y-2">
            {alertRules.map(rule => (
              <div key={rule.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="font-medium">
                    {rule.metric} {rule.condition} {rule.threshold}
                  </div>
                  <div className={`text-sm ${getSeverityColor(rule.severity)}`}>
                    {rule.severity} severity
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleAlertRule(rule.id)}
                    className={`px-3 py-1 rounded text-sm ${
                      rule.enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => removeAlertRule(rule.id)}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Alerts */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium">Active Alerts</h4>
          <div className="flex space-x-2">
            <span className="text-sm text-gray-600">{activeAlerts.length} alerts</span>
            {activeAlerts.some(alert => alert.acknowledged) && (
              <button
                onClick={clearAcknowledgedAlerts}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Acknowledged
              </button>
            )}
          </div>
        </div>
        
        {activeAlerts.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No active alerts
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activeAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`p-3 rounded border-l-4 ${
                  alert.rule.severity === 'critical' ? 'border-red-500 bg-red-50' :
                  alert.rule.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                  alert.rule.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                } ${alert.acknowledged ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">
                      {alert.rule.metric} violation
                    </div>
                    <div className="text-sm text-gray-600">
                      {alert.rule.metric} {alert.rule.condition} {alert.rule.threshold}, current: {alert.value.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main demo component
export default function PerformanceMonitoringDemo() {
  const [activeTab, setActiveTab] = useState<'overview' | 'memory' | 'network' | 'alerts'>('overview');
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);

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
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
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