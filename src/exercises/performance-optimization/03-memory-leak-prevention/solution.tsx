import React, { useState, useEffect, useRef, useCallback } from 'react';

// Memory monitoring utility
interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

interface MemoryMetrics {
  current: MemoryStats;
  peak: MemoryStats;
  samples: MemoryStats[];
  leakDetected: boolean;
}

function useMemoryMonitor() {
  const [metrics, setMetrics] = useState<MemoryMetrics>({
    current: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0, timestamp: 0 },
    peak: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0, timestamp: 0 },
    samples: [],
    leakDetected: false,
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getMemoryStats = useCallback((): MemoryStats => {
    const memory = (performance as any).memory;
    if (!memory) {
      return { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0, timestamp: Date.now() };
    }
    
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now(),
    };
  }, []);

  const detectLeak = useCallback((samples: MemoryStats[]): boolean => {
    if (samples.length < 10) return false;

    // Check if memory usage has grown consistently over last 10 samples
    const recentSamples = samples.slice(-10);
    let increasingCount = 0;
    
    for (let i = 1; i < recentSamples.length; i++) {
      if (recentSamples[i].usedJSHeapSize > recentSamples[i - 1].usedJSHeapSize) {
        increasingCount++;
      }
    }

    // If memory increased in 80% of recent samples, likely a leak
    return increasingCount >= 8;
  }, []);

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    intervalRef.current = setInterval(() => {
      const current = getMemoryStats();
      
      setMetrics(prev => {
        const newSamples = [...prev.samples, current].slice(-50); // Keep last 50 samples
        const newPeak = current.usedJSHeapSize > prev.peak.usedJSHeapSize ? current : prev.peak;
        const leakDetected = detectLeak(newSamples);

        return {
          current,
          peak: newPeak,
          samples: newSamples,
          leakDetected,
        };
      });
    }, 1000);
  }, [isMonitoring, getMemoryStats, detectLeak]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  const clearHistory = useCallback(() => {
    setMetrics({
      current: getMemoryStats(),
      peak: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0, timestamp: 0 },
      samples: [],
      leakDetected: false,
    });
  }, [getMemoryStats]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { metrics, startMonitoring, stopMonitoring, clearHistory, isMonitoring };
}

// Memory profiler for components
function useMemoryProfiler(componentName: string) {
  const startMemoryRef = useRef<MemoryStats | null>(null);
  const endMemoryRef = useRef<MemoryStats | null>(null);

  const getMemoryStats = (): MemoryStats => {
    const memory = (performance as any).memory;
    return memory ? {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now(),
    } : { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0, timestamp: Date.now() };
  };

  const startProfiling = useCallback(() => {
    startMemoryRef.current = getMemoryStats();
    console.log(`📊 Starting memory profiling for ${componentName}`, startMemoryRef.current);
  }, [componentName]);

  const stopProfiling = useCallback(() => {
    endMemoryRef.current = getMemoryStats();
    console.log(`📊 Stopping memory profiling for ${componentName}`, endMemoryRef.current);
  }, [componentName]);

  const getProfile = useCallback(() => {
    if (!startMemoryRef.current || !endMemoryRef.current) return null;

    const memoryDiff = endMemoryRef.current.usedJSHeapSize - startMemoryRef.current.usedJSHeapSize;
    
    return {
      componentName,
      startMemory: startMemoryRef.current,
      endMemory: endMemoryRef.current,
      memoryDiff,
      memoryDiffMB: memoryDiff / 1024 / 1024,
    };
  }, [componentName]);

  const verifyCleanup = useCallback(() => {
    const profile = getProfile();
    if (!profile) return false;

    // Consider cleanup successful if memory difference is less than 1MB
    return Math.abs(profile.memoryDiffMB) < 1;
  }, [getProfile]);

  return { startProfiling, stopProfiling, getProfile, verifyCleanup };
}

// Intentionally leaky component for demonstration
interface LeakyComponentProps {
  data: Array<{ id: number; content: string; timestamp: Date }>;
  enableLeaks: boolean;
}

function LeakyComponent({ data, enableLeaks }: LeakyComponentProps) {
  const [updates, setUpdates] = useState(0);
  const { startProfiling, stopProfiling } = useMemoryProfiler('LeakyComponent');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventHandlerRef = useRef<((e: Event) => void) | null>(null);
  const subscriptionRef = useRef<(() => void) | null>(null);
  const largeDataRef = useRef<any[]>([]);

  useEffect(() => {
    startProfiling();
    return () => stopProfiling();
  }, [startProfiling, stopProfiling]);

  // Event listener leak
  useEffect(() => {
    const handleScroll = () => {
      setUpdates(prev => prev + 1);
      // Intentionally store reference to large data in closure
      if (enableLeaks) {
        largeDataRef.current.push(data);
      }
    };

    if (enableLeaks) {
      // ❌ Leak: Add event listener without cleanup
      document.addEventListener('scroll', handleScroll);
      eventHandlerRef.current = handleScroll;
      console.log('🚨 Adding scroll listener WITHOUT cleanup');
    } else {
      // ✅ Clean: Add event listener with proper cleanup
      document.addEventListener('scroll', handleScroll);
      eventHandlerRef.current = handleScroll;
      console.log('✅ Adding scroll listener WITH cleanup');
    }
    
    return () => {
      if (!enableLeaks && eventHandlerRef.current) {
        document.removeEventListener('scroll', eventHandlerRef.current);
        console.log('✅ Cleaned up scroll listener');
      } else if (enableLeaks) {
        console.log('🚨 NOT cleaning up scroll listener (intentional leak)');
      }
    };
  }, [enableLeaks, data]);

  // Interval leak
  useEffect(() => {
    if (enableLeaks) {
      // ❌ Leak: Create interval without cleanup
      intervalRef.current = setInterval(() => {
        setUpdates(prev => prev + 1);
        // Store large objects in closure
        largeDataRef.current = [...largeDataRef.current, ...data];
      }, 2000);
      console.log('🚨 Creating interval WITHOUT cleanup');
    } else {
      // ✅ Clean: Create interval with proper cleanup
      intervalRef.current = setInterval(() => {
        setUpdates(prev => prev + 1);
      }, 2000);
      console.log('✅ Creating interval WITH cleanup');
    }

    return () => {
      if (!enableLeaks && intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('✅ Cleaned up interval');
      } else if (enableLeaks) {
        console.log('🚨 NOT cleaning up interval (intentional leak)');
      }
    };
  }, [enableLeaks, data]);

  // Subscription leak
  useEffect(() => {
    // Simulate subscription to external service
    const subscription = () => {
      const unsubscribe = () => {
        console.log('Unsubscribed from external service');
      };
      
      // Simulate subscription that holds reference to data
      const handleUpdate = () => {
        if (enableLeaks) {
          // Store reference to data in subscription closure
          largeDataRef.current.push(...data);
        }
        setUpdates(prev => prev + 1);
      };

      // Simulate subscription
      const intervalId = setInterval(handleUpdate, 3000);
      
      return () => {
        clearInterval(intervalId);
        unsubscribe();
      };
    };

    if (enableLeaks) {
      // ❌ Leak: Create subscription without cleanup
      const unsubscribe = subscription();
      subscriptionRef.current = unsubscribe;
      console.log('🚨 Creating subscription WITHOUT cleanup');
    } else {
      // ✅ Clean: Create subscription with proper cleanup
      const unsubscribe = subscription();
      subscriptionRef.current = unsubscribe;
      console.log('✅ Creating subscription WITH cleanup');
    }

    return () => {
      if (!enableLeaks && subscriptionRef.current) {
        subscriptionRef.current();
        console.log('✅ Cleaned up subscription');
      } else if (enableLeaks) {
        console.log('🚨 NOT cleaning up subscription (intentional leak)');
      }
    };
  }, [enableLeaks, data]);

  // Clear accumulated data when switching to clean mode
  useEffect(() => {
    if (!enableLeaks) {
      largeDataRef.current = [];
    }
  }, [enableLeaks]);

  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-2">
        {enableLeaks ? '🚨 Leaky Component' : '✅ Clean Component'}
      </h3>
      <p>Updates: {updates}</p>
      <p>Data items: {data.length}</p>
      <p>Accumulated refs: {largeDataRef.current.length}</p>
      <div className="mt-2 text-sm text-gray-600">
        {enableLeaks ? (
          <ul className="list-disc list-inside">
            <li>Event listeners not cleaned up</li>
            <li>Intervals not cleared</li>
            <li>Subscriptions not unsubscribed</li>
            <li>Large objects held in closures</li>
          </ul>
        ) : (
          <p>All resources properly cleaned up</p>
        )}
      </div>
    </div>
  );
}

// Component demonstrating proper cleanup
interface CleanupExampleProps {
  isActive: boolean;
}

function CleanupExample({ isActive }: CleanupExampleProps) {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { startProfiling, stopProfiling } = useMemoryProfiler('CleanupExample');

  useEffect(() => {
    startProfiling();
    return () => stopProfiling();
  }, [startProfiling, stopProfiling]);

  // Fetch with AbortController
  const handleFetchData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setStatus('loading');

    try {
      // Simulate API call
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, 2000);
        
        abortControllerRef.current!.signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Aborted'));
        });
      });

      if (!abortControllerRef.current.signal.aborted) {
        setData({ message: 'Fetch completed', timestamp: Date.now() });
        setStatus('success');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Aborted') {
        setStatus('aborted');
      } else {
        setStatus('error');
      }
    }
  }, []);

  // Event listener cleanup
  useEffect(() => {
    if (!isActive) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r') {
        handleFetchData();
      }
    };

    const handleVisibilityChange = () => {
      setStatus(prev => document.hidden ? 'paused' : prev);
    };

    document.addEventListener('keypress', handleKeyPress);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    console.log('✅ Added event listeners with cleanup');

    return () => {
      document.removeEventListener('keypress', handleKeyPress);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('✅ Cleaned up event listeners');
    };
  }, [isActive, handleFetchData]);

  // Subscription management
  useEffect(() => {
    if (!isActive) return;

    // Simulate WebSocket or SSE subscription
    const subscription = {
      unsubscribe: () => console.log('✅ Unsubscribed from service'),
    };

    const handleMessage = (message: any) => {
      setData(prev => ({ ...prev, lastMessage: message }));
    };

    // Simulate subscription
    const interval = setInterval(() => {
      handleMessage({ type: 'ping', timestamp: Date.now() });
    }, 5000);

    console.log('✅ Created subscription with cleanup');

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
      console.log('✅ Cleaned up subscription');
    };
  }, [isActive]);

  // Cleanup AbortController on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('✅ Aborted pending requests');
      }
    };
  }, []);

  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-2">✅ Cleanup Example</h3>
      <p>Status: {status}</p>
      <p>Active: {isActive ? 'Yes' : 'No'}</p>
      {data && (
        <p className="text-sm">Last update: {JSON.stringify(data, null, 2)}</p>
      )}
      <div className="mt-2 space-x-2">
        <button
          onClick={handleFetchData}
          disabled={!isActive}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Fetch Data
        </button>
        <button
          onClick={() => abortControllerRef.current?.abort()}
          disabled={!isActive}
          className="px-3 py-1 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          Cancel Request
        </button>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Press 'R' key to trigger fetch. All resources cleaned up properly.
      </p>
    </div>
  );
}

// WeakMap example for object associations
class ObjectRegistry {
  private metadata = new WeakMap<object, any>();
  private registrationCount = 0;

  associate(obj: object, metadata: any) {
    this.metadata.set(obj, { ...metadata, registeredAt: Date.now() });
    this.registrationCount++;
    console.log(`✅ Associated metadata with object #${this.registrationCount}`);
  }

  getMetadata(obj: object) {
    return this.metadata.get(obj);
  }

  hasMetadata(obj: object) {
    return this.metadata.has(obj);
  }

  getRegistrationCount() {
    return this.registrationCount;
  }
}

// Memory monitoring dashboard
function MemoryMonitorDashboard() {
  const { metrics, startMonitoring, stopMonitoring, clearHistory, isMonitoring } = useMemoryMonitor();

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="p-4 bg-gray-50 rounded">
      <h3 className="font-semibold mb-2">Memory Monitor</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-3 rounded border">
          <div className="text-sm text-gray-600">Current Usage</div>
          <div className="text-lg font-semibold">
            {formatBytes(metrics.current.usedJSHeapSize)}
          </div>
        </div>
        <div className="bg-white p-3 rounded border">
          <div className="text-sm text-gray-600">Peak Usage</div>
          <div className="text-lg font-semibold">
            {formatBytes(metrics.peak.usedJSHeapSize)}
          </div>
        </div>
        <div className="bg-white p-3 rounded border">
          <div className="text-sm text-gray-600">Heap Limit</div>
          <div className="text-lg font-semibold">
            {formatBytes(metrics.current.jsHeapSizeLimit)}
          </div>
        </div>
      </div>

      {metrics.leakDetected && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          🚨 Potential memory leak detected! Memory usage has been consistently increasing.
        </div>
      )}

      <div className="flex space-x-2 mb-4">
        <button
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
          className={`px-4 py-2 rounded ${
            isMonitoring
              ? 'bg-red-500 text-white'
              : 'bg-green-500 text-white'
          }`}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
        <button
          onClick={clearHistory}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Clear History
        </button>
      </div>

      <div className="text-sm text-gray-600">
        <p>Samples: {metrics.samples.length}</p>
        <p>Monitoring: {isMonitoring ? 'Active' : 'Stopped'}</p>
        {metrics.samples.length > 0 && (
          <p>
            Memory trend: {
              metrics.samples.length > 1
                ? metrics.samples[metrics.samples.length - 1].usedJSHeapSize > 
                  metrics.samples[0].usedJSHeapSize
                  ? 'Increasing ↗️'
                  : 'Stable/Decreasing ↘️'
                : 'Insufficient data'
            }
          </p>
        )}
      </div>
    </div>
  );
}

// Leak detector utility
function useLeakDetector() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [leakReport, setLeakReport] = useState<any>({});

  const startDetection = useCallback(() => {
    setIsDetecting(true);
    console.log('🔍 Started leak detection');
  }, []);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    console.log('🔍 Stopped leak detection');
  }, []);

  const getLeakReport = useCallback(() => {
    const report = {
      timestamp: Date.now(),
      detectionActive: isDetecting,
      eventListeners: document.addEventListener.length || 'Unknown',
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      recommendations: [
        'Check for unremoved event listeners',
        'Verify interval/timeout cleanup',
        'Review subscription management',
        'Monitor DOM node retention',
      ],
    };
    
    setLeakReport(report);
    return report;
  }, [isDetecting]);

  return { startDetection, stopDetection, getLeakReport, isDetecting };
}

// Main demo component
export default function MemoryLeakPreventionDemo() {
  const [enableLeaks, setEnableLeaks] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [dataSize, setDataSize] = useState(100);
  const [showWeakMapDemo, setShowWeakMapDemo] = useState(false);
  const { startDetection, stopDetection, getLeakReport, isDetecting } = useLeakDetector();
  const objectRegistryRef = useRef(new ObjectRegistry());

  // Generate sample data
  const sampleData = Array.from({ length: dataSize }, (_, i) => ({
    id: i,
    content: `Item ${i} with some content data that could potentially be leaked`,
    timestamp: new Date(),
  }));

  // WeakMap demo
  const handleWeakMapDemo = () => {
    const objects = Array.from({ length: 5 }, (_, i) => ({ id: i, data: `Object ${i}` }));
    
    objects.forEach(obj => {
      objectRegistryRef.current.associate(obj, {
        type: 'demo',
        description: `Metadata for object ${obj.id}`,
      });
    });

    setShowWeakMapDemo(true);
    
    // Clear references after 3 seconds to demonstrate WeakMap cleanup
    setTimeout(() => {
      // Objects will be eligible for garbage collection
      console.log('🗑️ Object references cleared - WeakMap entries will be cleaned up automatically');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Memory Leak Prevention & Detection
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            This demo showcases memory leak detection, prevention patterns, and debugging tools.
            Open browser DevTools Memory tab to monitor heap usage in real-time.
          </p>
        </div>

        {/* Memory monitoring dashboard */}
        <MemoryMonitorDashboard />

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Demo Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={enableLeaks}
                onChange={(e) => setEnableLeaks(e.target.checked)}
                className="mr-2"
              />
              Enable Memory Leaks
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="mr-2"
              />
              Component Active
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isDetecting}
                onChange={(e) => e.target.checked ? startDetection() : stopDetection()}
                className="mr-2"
              />
              Leak Detection
            </label>
            <button
              onClick={handleWeakMapDemo}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              WeakMap Demo
            </button>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Size: {dataSize} items
            </label>
            <input
              type="range"
              min="10"
              max="1000"
              value={dataSize}
              onChange={(e) => setDataSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Leaky component demo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Memory Leak Demonstration</h2>
          <LeakyComponent data={sampleData} enableLeaks={enableLeaks} />
        </div>

        {/* Cleanup example demo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Proper Cleanup Patterns</h2>
          <CleanupExample isActive={isActive} />
        </div>

        {/* WeakMap example */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">WeakMap Usage Example</h2>
          <div className="space-y-4">
            <p className="text-gray-600">
              WeakMap automatically cleans up entries when objects are garbage collected.
            </p>
            <div className="bg-gray-50 p-4 rounded">
              <p>Total registrations: {objectRegistryRef.current.getRegistrationCount()}</p>
              {showWeakMapDemo && (
                <p className="text-green-600 mt-2">
                  ✅ WeakMap demo completed - check console for cleanup messages
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Leak detection results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Leak Detection Results</h2>
          <button
            onClick={getLeakReport}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Generate Leak Report
          </button>
          
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-medium mb-2">Current Status:</h4>
            <ul className="text-sm space-y-1">
              <li>🔍 Detection Active: {isDetecting ? 'Yes' : 'No'}</li>
              <li>🚨 Leaks Enabled: {enableLeaks ? 'Yes' : 'No'}</li>
              <li>📊 Data Size: {dataSize} items</li>
              <li>⚡ Component Active: {isActive ? 'Yes' : 'No'}</li>
            </ul>
          </div>
        </div>

        {/* Debug tips */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Debugging Tips</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Open DevTools → Memory tab → Take heap snapshots to compare memory usage</li>
            <li>• Enable memory leaks and watch the console for leak indicators</li>
            <li>• Use Performance tab to record memory allocation timeline</li>
            <li>• Force garbage collection in DevTools to see true memory retention</li>
            <li>• Monitor event listener counts and subscriptions in console logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}