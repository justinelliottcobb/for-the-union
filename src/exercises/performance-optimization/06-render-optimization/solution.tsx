import React, { useState, useEffect, useRef, useCallback, useMemo, useTransition, useDeferredValue, startTransition } from 'react';

// Render tracking types
interface RenderMetrics {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
  isExpensive: boolean;
}

interface BatchedUpdate {
  id: string;
  updates: Array<() => void>;
  priority: 'urgent' | 'normal' | 'low';
  timestamp: number;
}

interface ConcurrentConfig {
  enableTimeSlicing?: boolean;
  enableSuspense?: boolean;
  enablePrioritization?: boolean;
  maxConcurrentWork?: number;
}

// Render tracking hook
function useRenderTracker(componentName: string) {
  const metricsRef = useRef<RenderMetrics>({
    componentName,
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
    isExpensive: false,
  });

  const startTimeRef = useRef<number>(0);
  const [, forceUpdate] = useState({});

  const startTracking = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const endTracking = useCallback(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;
    const metrics = metricsRef.current;

    metrics.renderCount++;
    metrics.lastRenderTime = renderTime;
    metrics.totalRenderTime += renderTime;
    metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;
    metrics.isExpensive = renderTime > 16; // >16ms is expensive for 60fps

    if (metrics.isExpensive) {
      console.warn(`Expensive render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }

    // Force update to refresh metrics display
    forceUpdate({});
  }, [componentName]);

  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      componentName,
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
      isExpensive: false,
    };
    forceUpdate({});
  }, [componentName]);

  // Auto-start tracking on each render
  useEffect(() => {
    startTracking();
    return endTracking;
  });

  return {
    startTracking,
    endTracking,
    getMetrics,
    resetMetrics,
    metrics: metricsRef.current,
  };
}

// Render Tracker component
interface RenderTrackerProps {
  children: React.ReactNode;
  name: string;
  onMetrics?: (metrics: RenderMetrics) => void;
  showWarnings?: boolean;
}

function RenderTracker({ children, name, onMetrics, showWarnings = true }: RenderTrackerProps) {
  const { metrics, resetMetrics } = useRenderTracker(name);

  useEffect(() => {
    if (onMetrics) {
      onMetrics(metrics);
    }
  }, [metrics, onMetrics]);

  const getPerformanceColor = (isExpensive: boolean, avgTime: number) => {
    if (isExpensive || avgTime > 16) return 'text-red-600 bg-red-50';
    if (avgTime > 8) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="relative">
      {/* Performance indicator */}
      <div className="mb-4 p-3 border rounded bg-gray-50">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-sm">Render Metrics: {name}</h4>
          <button
            onClick={resetMetrics}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reset
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-gray-600">Count:</span>
            <div className="font-medium">{metrics.renderCount}</div>
          </div>
          <div>
            <span className="text-gray-600">Last:</span>
            <div className={"font-medium px-1 rounded " + 
              getPerformanceColor(metrics.isExpensive, metrics.lastRenderTime)}>
              {metrics.lastRenderTime.toFixed(1)}ms
            </div>
          </div>
          <div>
            <span className="text-gray-600">Avg:</span>
            <div className={"font-medium px-1 rounded " + 
              getPerformanceColor(false, metrics.averageRenderTime)}>
              {metrics.averageRenderTime.toFixed(1)}ms
            </div>
          </div>
          <div>
            <span className="text-gray-600">Total:</span>
            <div className="font-medium">{metrics.totalRenderTime.toFixed(1)}ms</div>
          </div>
        </div>

        {showWarnings && metrics.isExpensive && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            ⚠️ Expensive render detected! Consider optimization.
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

// Batched updates system
function useBatchedUpdates() {
  const [pendingUpdates, setPendingUpdates] = useState<BatchedUpdate[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const [isPending, startTransition] = useTransition();
  const updateIdRef = useRef(0);

  const scheduleUpdate = useCallback((
    updateFn: () => void,
    priority: 'urgent' | 'normal' | 'low' = 'normal'
  ) => {
    const update: BatchedUpdate = {
      id: (++updateIdRef.current).toString(),
      updates: [updateFn],
      priority,
      timestamp: Date.now(),
    };

    setPendingUpdates(prev => [...prev, update]);

    // Flush urgent updates immediately
    if (priority === 'urgent') {
      updateFn();
      setPendingUpdates(prev => prev.filter(u => u.id !== update.id));
      return;
    }

    // Batch non-urgent updates
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      flushUpdates();
    }, priority === 'normal' ? 16 : 32); // Normal: 1 frame, Low: 2 frames
  }, []);

  const flushUpdates = useCallback(() => {
    setPendingUpdates(currentUpdates => {
      if (currentUpdates.length === 0) return currentUpdates;

      // Sort by priority and execute
      const sortedUpdates = [...currentUpdates].sort((a, b) => {
        const priorityOrder = { urgent: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      const urgentUpdates = sortedUpdates.filter(u => u.priority === 'urgent');
      const nonUrgentUpdates = sortedUpdates.filter(u => u.priority !== 'urgent');

      // Execute urgent updates immediately
      urgentUpdates.forEach(update => {
        update.updates.forEach(fn => fn());
      });

      // Execute non-urgent updates in transition
      if (nonUrgentUpdates.length > 0) {
        startTransition(() => {
          nonUrgentUpdates.forEach(update => {
            update.updates.forEach(fn => fn());
          });
        });
      }

      return []; // Clear all updates
    });
  }, []);

  const flushUrgentUpdates = useCallback(() => {
    setPendingUpdates(currentUpdates => {
      const urgentUpdates = currentUpdates.filter(u => u.priority === 'urgent');
      const nonUrgentUpdates = currentUpdates.filter(u => u.priority !== 'urgent');

      urgentUpdates.forEach(update => {
        update.updates.forEach(fn => fn());
      });

      return nonUrgentUpdates;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  return {
    scheduleUpdate,
    flushUpdates,
    flushUrgentUpdates,
    pendingCount: pendingUpdates.length,
    isPending,
  };
}

// Batched Updates component
interface BatchedUpdatesProps {
  children: React.ReactNode;
  batchTimeout?: number;
  maxBatchSize?: number;
}

function BatchedUpdates({ children, batchTimeout = 16, maxBatchSize = 10 }: BatchedUpdatesProps) {
  const { scheduleUpdate, flushUpdates, pendingCount, isPending } = useBatchedUpdates();
  const [updateCount, setUpdateCount] = useState(0);
  const [lastFlushTime, setLastFlushTime] = useState<Date | null>(null);

  const handleTestUpdate = useCallback((priority: 'urgent' | 'normal' | 'low') => {
    scheduleUpdate(() => {
      setUpdateCount(prev => prev + 1);
      setLastFlushTime(new Date());
    }, priority);
  }, [scheduleUpdate]);

  const handleManualFlush = useCallback(() => {
    flushUpdates();
  }, [flushUpdates]);

  return (
    <div className="space-y-4">
      {/* Batching status display */}
      <div className="p-4 bg-gray-50 rounded border">
        <h4 className="font-medium mb-3">Batch Update Status</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-600">Pending:</span>
            <div className="font-bold text-lg">{pendingCount}</div>
          </div>
          <div>
            <span className="text-gray-600">Updates:</span>
            <div className="font-bold text-lg">{updateCount}</div>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>
            <div className={isPending ? 'text-yellow-600' : 'text-green-600'}>
              {isPending ? 'Batching...' : 'Idle'}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Last Flush:</span>
            <div className="text-xs">
              {lastFlushTime ? lastFlushTime.toLocaleTimeString() : 'None'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTestUpdate('urgent')}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Urgent Update
          </button>
          <button
            onClick={() => handleTestUpdate('normal')}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Normal Update
          </button>
          <button
            onClick={() => handleTestUpdate('low')}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Low Priority
          </button>
          <button
            onClick={handleManualFlush}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Flush Now
          </button>
        </div>
      </div>
      
      {children}
    </div>
  );
}

// Concurrent rendering utilities
function useConcurrentFeatures(config: ConcurrentConfig = {}) {
  const [isTransitionPending, startTransition] = useTransition();
  
  const scheduleWork = useCallback((work: () => void, priority: 'urgent' | 'normal' | 'low' = 'normal') => {
    if (priority === 'urgent') {
      work();
    } else {
      startTransition(() => {
        work();
      });
    }
  }, []);

  const deferValue = useCallback(<T>(value: T): T => {
    return useDeferredValue(value);
  }, []);

  const timeSlice = useCallback(async (work: Array<() => void>, sliceSize: number = 5) => {
    for (let i = 0; i < work.length; i += sliceSize) {
      const slice = work.slice(i, i + sliceSize);
      
      // Execute slice
      slice.forEach(fn => fn());
      
      // Yield control back to browser
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }, []);

  return {
    scheduleWork,
    deferValue,
    timeSlice,
    isTransitionPending,
  };
}

// Concurrent Renderer component
interface ConcurrentRendererProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  enableTimeSlicing?: boolean;
  enablePrioritization?: boolean;
  sliceSize?: number;
}

function ConcurrentRenderer({
  data,
  renderItem,
  enableTimeSlicing = true,
  enablePrioritization = true,
  sliceSize = 10
}: ConcurrentRendererProps) {
  const [renderedItems, setRenderedItems] = useState<React.ReactNode[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { timeSlice } = useConcurrentFeatures();

  const renderConcurrently = useCallback(async () => {
    if (data.length === 0) {
      setRenderedItems([]);
      return;
    }

    setIsRendering(true);
    setRenderProgress(0);
    setRenderedItems([]);

    if (enableTimeSlicing) {
      // Time-sliced rendering
      const renderTasks: Array<() => void> = [];
      
      for (let i = 0; i < data.length; i++) {
        renderTasks.push(() => {
          const item = renderItem(data[i], i);
          setRenderedItems(prev => [...prev, item]);
          setRenderProgress((i + 1) / data.length * 100);
        });
      }

      // Process in slices
      for (let i = 0; i < renderTasks.length; i += sliceSize) {
        const slice = renderTasks.slice(i, i + sliceSize);
        
        if (enablePrioritization) {
          startTransition(() => {
            slice.forEach(task => task());
          });
        } else {
          slice.forEach(task => task());
        }
        
        // Yield control
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } else {
      // Traditional rendering
      const items = data.map((item, index) => renderItem(item, index));
      
      if (enablePrioritization) {
        startTransition(() => {
          setRenderedItems(items);
          setRenderProgress(100);
        });
      } else {
        setRenderedItems(items);
        setRenderProgress(100);
      }
    }

    setIsRendering(false);
  }, [data, renderItem, enableTimeSlicing, enablePrioritization, sliceSize]);

  useEffect(() => {
    renderConcurrently();
  }, [renderConcurrently]);

  return (
    <div className="space-y-2">
      {/* Rendering status */}
      {(isRendering || isPending) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <div className="flex justify-between items-center mb-2">
            <span>Rendering {data.length} items...</span>
            <span>{renderProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: renderProgress + '%' }}
            ></div>
          </div>
          
          <div className="mt-2 text-xs text-blue-600">
            Mode: {enableTimeSlicing ? 'Time Sliced' : 'Standard'} | 
            Priority: {enablePrioritization ? 'Concurrent' : 'Synchronous'}
          </div>
        </div>
      )}

      {/* Rendered items */}
      <div className="space-y-1">
        {renderedItems}
      </div>

      {/* Statistics */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>Total Items: {data.length}</div>
          <div>Rendered: {renderedItems.length}</div>
          <div>Slice Size: {sliceSize}</div>
          <div>Status: {isRendering ? 'Rendering' : isPending ? 'Pending' : 'Complete'}</div>
        </div>
      </div>
    </div>
  );
}

// Expensive component for testing
interface ExpensiveComponentProps {
  data: number[];
  computation: 'light' | 'medium' | 'heavy';
  enableOptimization?: boolean;
}

const ExpensiveComponent = React.memo(function ExpensiveComponent({
  data,
  computation,
  enableOptimization = true
}: ExpensiveComponentProps) {
  const expensiveResult = useMemo(() => {
    const start = performance.now();
    
    let result = 0;
    const iterations = computation === 'light' ? 1000 : 
                     computation === 'medium' ? 50000 : 
                     1000000;

    // Perform computation
    for (let i = 0; i < iterations; i++) {
      for (let j = 0; j < data.length; j++) {
        result += Math.sqrt(data[j] * i);
      }
    }
    
    const duration = performance.now() - start;
    console.log("Computation (" + computation + ") took " + duration.toFixed(2) + "ms");
    return { result: result.toFixed(2), duration: duration.toFixed(2) };
  }, enableOptimization ? [data, computation] : [data, computation, Math.random()]);

  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <div className="p-4 border rounded bg-white">
      <h4 className="font-medium mb-2">Expensive Component</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-600">Computation:</span>
          <div className="font-medium">{computation}</div>
        </div>
        <div>
          <span className="text-gray-600">Result:</span>
          <div className="font-medium">{expensiveResult.result}</div>
        </div>
        <div>
          <span className="text-gray-600">Duration:</span>
          <div className={"font-medium " + (parseFloat(expensiveResult.duration) > 16 ? 'text-red-600' : 'text-green-600')}>
            {expensiveResult.duration}ms
          </div>
        </div>
        <div>
          <span className="text-gray-600">Renders:</span>
          <div className="font-medium">{renderCount.current}</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        <div>Optimization: {enableOptimization ? 'Enabled (useMemo + React.memo)' : 'Disabled'}</div>
        <div>Data Size: {data.length} items</div>
      </div>
    </div>
  );
});

// Performance profiler
function usePerformanceProfiler() {
  const [profiles, setProfiles] = useState<Array<{
    name: string;
    duration: number;
    timestamp: number;
    phase: 'mount' | 'update' | 'unmount';
  }>>([]);

  const profileComponent = useCallback((
    name: string,
    phase: 'mount' | 'update' | 'unmount',
    actualDuration: number
  ) => {
    const profile = {
      name,
      duration: actualDuration,
      timestamp: Date.now(),
      phase,
    };

    setProfiles(prev => [...prev.slice(-49), profile]); // Keep last 50 profiles
  }, []);

  const getProfileSummary = useCallback(() => {
    if (profiles.length === 0) {
      return {
        totalComponents: 0,
        averageDuration: 0,
        slowestComponent: null,
        totalRenderTime: 0,
      };
    }

    const totalRenderTime = profiles.reduce((sum, p) => sum + p.duration, 0);
    const averageDuration = totalRenderTime / profiles.length;
    const slowestComponent = profiles.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    );

    return {
      totalComponents: profiles.length,
      averageDuration,
      slowestComponent,
      totalRenderTime,
    };
  }, [profiles]);

  const clearProfiles = useCallback(() => {
    setProfiles([]);
  }, []);

  return {
    profileComponent,
    getProfileSummary,
    clearProfiles,
    profiles,
  };
}

// Main demo component
export default function RenderOptimizationDemo() {
  const [selectedTool, setSelectedTool] = useState<'tracker' | 'batching' | 'concurrent'>('tracker');
  const [dataSize, setDataSize] = useState(100);
  const [computationLevel, setComputationLevel] = useState<'light' | 'medium' | 'heavy'>('medium');
  const [enableOptimizations, setEnableOptimizations] = useState(true);

  // Generate sample data
  const sampleData = useMemo(() => 
    Array.from({ length: dataSize }, (_, i) => ({
      id: i,
      value: Math.random() * 1000,
      label: "Item " + i,
    }))
  , [dataSize]);

  const heavyComputationData = useMemo(() => 
    Array.from({ length: Math.min(dataSize, 50) }, (_, i) => i)
  , [dataSize]);

  const { profileComponent, getProfileSummary, clearProfiles } = usePerformanceProfiler();
  const summary = getProfileSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Render Optimization & Concurrent Features
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Master advanced rendering patterns and React concurrent features for optimal performance.
            Learn render tracking, batched updates, and time slicing techniques.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-4">Demo Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Size: {dataSize}
              </label>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={dataSize}
                onChange={(e) => setDataSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Computation Level
              </label>
              <select
                value={computationLevel}
                onChange={(e) => setComputationLevel(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enableOptimizations}
                  onChange={(e) => setEnableOptimizations(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Enable Optimizations</span>
              </label>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Performance Summary</h3>
            <button
              onClick={clearProfiles}
              className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Components:</span>
              <div className="font-bold">{summary.totalComponents}</div>
            </div>
            <div>
              <span className="text-gray-600">Avg Duration:</span>
              <div className="font-bold">{summary.averageDuration.toFixed(2)}ms</div>
            </div>
            <div>
              <span className="text-gray-600">Total Time:</span>
              <div className="font-bold">{summary.totalRenderTime.toFixed(2)}ms</div>
            </div>
            <div>
              <span className="text-gray-600">Slowest:</span>
              <div className="font-bold text-xs">
                {summary.slowestComponent ? 
                  summary.slowestComponent.name + " (" + summary.slowestComponent.duration.toFixed(1) + "ms)" : 
                  'None'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Tool selection */}
        <div className="flex justify-center space-x-4">
          {[
            { key: 'tracker', label: 'Render Tracker' },
            { key: 'batching', label: 'Batched Updates' },
            { key: 'concurrent', label: 'Concurrent Rendering' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedTool(key as any)}
              className={"px-6 py-3 rounded-lg font-medium transition-colors " + (
                selectedTool === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tool content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {selectedTool === 'tracker' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Render Tracking</h2>
                
                <RenderTracker 
                  name="ExpensiveComponent" 
                  showWarnings={true}
                  onMetrics={(metrics) => {
                    profileComponent(metrics.componentName, 'update', metrics.lastRenderTime);
                  }}
                >
                  <ExpensiveComponent
                    data={heavyComputationData}
                    computation={computationLevel}
                    enableOptimization={enableOptimizations}
                  />
                </RenderTracker>
              </div>
            )}

            {selectedTool === 'batching' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Batched Updates</h2>
                
                <BatchedUpdates batchTimeout={16} maxBatchSize={10}>
                  <div className="p-4 border rounded">
                    <p className="mb-4">
                      Use the buttons above to test different update priorities. 
                      Urgent updates execute immediately, while normal and low priority updates are batched.
                    </p>
                    <div className="text-sm text-gray-600">
                      <p>• <strong>Urgent:</strong> Executes immediately (user interactions)</p>
                      <p>• <strong>Normal:</strong> Batched with 16ms timeout (~1 frame)</p>
                      <p>• <strong>Low:</strong> Batched with 32ms timeout (~2 frames)</p>
                    </div>
                  </div>
                </BatchedUpdates>
              </div>
            )}

            {selectedTool === 'concurrent' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Concurrent Rendering</h2>
                
                <ConcurrentRenderer
                  data={sampleData}
                  renderItem={(item, index) => (
                    <div key={item.id} className="p-2 border rounded text-sm bg-gray-50">
                      <span className="font-medium">{item.label}:</span> {item.value.toFixed(2)}
                    </div>
                  )}
                  enableTimeSlicing={enableOptimizations}
                  enablePrioritization={enableOptimizations}
                  sliceSize={10}
                />
              </div>
            )}
          </div>
        </div>

        {/* Performance tips */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Render Optimization Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Use React.memo to prevent unnecessary re-renders of components</li>
              <li>• Implement useMemo for expensive calculations and object creation</li>
              <li>• Use useCallback to stabilize function references</li>
              <li>• Leverage useTransition for non-urgent state updates</li>
            </ul>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Break large rendering work into time slices</li>
              <li>• Use concurrent features to maintain responsive UI</li>
              <li>• Monitor render performance with profiling tools</li>
              <li>• Batch multiple state updates to reduce render frequency</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}