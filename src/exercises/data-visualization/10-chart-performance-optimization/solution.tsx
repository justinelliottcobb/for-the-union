import * as React from 'react';
import { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext } from 'react';
import { Card, Text, Group, Stack, Button, Progress, Badge, Tabs, Grid, Paper, Title, Divider, Select, Switch, Slider } from '@mantine/core';
import { IconActivity, IconMemory, IconCpu, IconChartBar, IconSettings, IconRefresh, IconDatabase, IconGauge } from '@tabler/icons-react';
import * as d3 from 'd3';

// === TYPES AND INTERFACES ===

interface PerformanceMetrics {
  renderTime: number;
  fps: number;
  memoryUsage: number;
  dataPoints: number;
  updateFrequency: number;
  frameDrops: number;
  gcCollections: number;
  cpuUsage: number;
}

interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  heapLimit: number;
  allocations: number;
  deallocations: number;
  leaks: number;
  gcPressure: number;
  poolUtilization: number;
}

interface RenderMetrics {
  frameTime: number;
  drawCalls: number;
  vertexCount: number;
  textureMemory: number;
  shaderCompiles: number;
  bufferUploads: number;
  contextSwitches: number;
  culledObjects: number;
}

interface DataMetrics {
  processingTime: number;
  compressionRatio: number;
  indexingTime: number;
  filterTime: number;
  transformTime: number;
  streamingThroughput: number;
  cacheHitRate: number;
  workerUtilization: number;
}

interface OptimizationConfig {
  enableVirtualization: boolean;
  enableCompression: boolean;
  enableWebGL: boolean;
  enableWorkers: boolean;
  maxDataPoints: number;
  frameTarget: number;
  memoryLimit: number;
  compressionLevel: number;
}

interface ProfilerReport {
  timestamp: number;
  performance: PerformanceMetrics;
  memory: MemoryMetrics;
  rendering: RenderMetrics;
  data: DataMetrics;
  recommendations: string[];
  score: number;
}

// === CHART PROFILER ===

interface ChartProfilerContextValue {
  metrics: PerformanceMetrics;
  reports: ProfilerReport[];
  isProfileng: boolean;
  startProfiling: () => void;
  stopProfiling: () => void;
  measureFrame: <T>(fn: () => T) => T;
  measureMemory: <T>(fn: () => T) => T;
  generateReport: () => ProfilerReport;
  getRecommendations: () => string[];
}

const ChartProfilerContext = createContext<ChartProfilerContextValue | null>(null);

export const ChartProfiler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    fps: 60,
    memoryUsage: 0,
    dataPoints: 0,
    updateFrequency: 0,
    frameDrops: 0,
    gcCollections: 0,
    cpuUsage: 0
  });

  const [reports, setReports] = useState<ProfilerReport[]>([]);
  const [isProfileng, setIsProfiling] = useState(false);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number>();

  // Frame timing measurement
  const measureFrame = useCallback(<T,>(fn: () => T): T => {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    const frameTime = endTime - startTime;

    frameTimesRef.current.push(frameTime);
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }

    // Calculate FPS
    const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
    const fps = Math.min(60, 1000 / avgFrameTime);

    setMetrics(prev => ({
      ...prev,
      renderTime: frameTime,
      fps: Math.round(fps),
      frameDrops: prev.frameDrops + (frameTime > 16.67 ? 1 : 0)
    }));

    return result;
  }, []);

  // Memory measurement
  const measureMemory = useCallback(<T,>(fn: () => T): T => {
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const result = fn();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

    setMetrics(prev => ({
      ...prev,
      memoryUsage: Math.round(endMemory / 1024 / 1024), // Convert to MB
    }));

    return result;
  }, []);

  // Performance monitoring loop
  const monitorPerformance = useCallback(() => {
    if (!isProfileng) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTimeRef.current;
    lastFrameTimeRef.current = currentTime;

    // Monitor CPU usage approximation
    const cpuUsage = Math.min(100, (deltaTime / 16.67) * 100);

    setMetrics(prev => ({
      ...prev,
      cpuUsage: Math.round(cpuUsage),
      updateFrequency: prev.updateFrequency + 1
    }));

    animationFrameRef.current = requestAnimationFrame(monitorPerformance);
  }, [isProfileng]);

  const startProfiling = useCallback(() => {
    setIsProfiling(true);
    frameTimesRef.current = [];
    setMetrics(prev => ({ ...prev, updateFrequency: 0, frameDrops: 0, gcCollections: 0 }));
  }, []);

  const stopProfiling = useCallback(() => {
    setIsProfiling(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const generateReport = useCallback((): ProfilerReport => {
    const memoryInfo = (performance as any).memory;
    const memoryMetrics: MemoryMetrics = {
      heapUsed: memoryInfo?.usedJSHeapSize || 0,
      heapTotal: memoryInfo?.totalJSHeapSize || 0,
      heapLimit: memoryInfo?.jsHeapSizeLimit || 0,
      allocations: 0,
      deallocations: 0,
      leaks: 0,
      gcPressure: metrics.gcCollections,
      poolUtilization: 0
    };

    const renderMetrics: RenderMetrics = {
      frameTime: metrics.renderTime,
      drawCalls: 0,
      vertexCount: 0,
      textureMemory: 0,
      shaderCompiles: 0,
      bufferUploads: 0,
      contextSwitches: 0,
      culledObjects: 0
    };

    const dataMetrics: DataMetrics = {
      processingTime: 0,
      compressionRatio: 0,
      indexingTime: 0,
      filterTime: 0,
      transformTime: 0,
      streamingThroughput: 0,
      cacheHitRate: 0,
      workerUtilization: 0
    };

    const recommendations = getRecommendations();
    const score = calculatePerformanceScore();

    const report: ProfilerReport = {
      timestamp: Date.now(),
      performance: metrics,
      memory: memoryMetrics,
      rendering: renderMetrics,
      data: dataMetrics,
      recommendations,
      score
    };

    setReports(prev => [...prev, report].slice(-10)); // Keep last 10 reports
    return report;
  }, [metrics]);

  const getRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];

    if (metrics.fps < 30) {
      recommendations.push('Low FPS detected. Consider enabling virtualization or reducing data points.');
    }

    if (metrics.renderTime > 16.67) {
      recommendations.push('Frame time exceeds 16.67ms. Optimize rendering or use Web Workers.');
    }

    if (metrics.memoryUsage > 100) {
      recommendations.push('High memory usage. Enable compression or implement memory pooling.');
    }

    if (metrics.frameDrops > 10) {
      recommendations.push('Multiple frame drops detected. Consider reducing animation complexity.');
    }

    if (metrics.cpuUsage > 80) {
      recommendations.push('High CPU usage. Implement debouncing or reduce update frequency.');
    }

    return recommendations;
  }, [metrics]);

  const calculatePerformanceScore = useCallback((): number => {
    let score = 100;

    // FPS penalty
    if (metrics.fps < 60) score -= (60 - metrics.fps) * 2;
    if (metrics.fps < 30) score -= 20;

    // Memory penalty
    if (metrics.memoryUsage > 50) score -= (metrics.memoryUsage - 50) * 0.5;
    if (metrics.memoryUsage > 100) score -= 10;

    // Frame drops penalty
    score -= metrics.frameDrops * 2;

    // CPU usage penalty
    if (metrics.cpuUsage > 70) score -= (metrics.cpuUsage - 70) * 0.5;

    return Math.max(0, Math.round(score));
  }, [metrics]);

  useEffect(() => {
    if (isProfileng) {
      monitorPerformance();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isProfileng, monitorPerformance]);

  return (
    <ChartProfilerContext.Provider value={{
      metrics,
      reports,
      isProfileng,
      startProfiling,
      stopProfiling,
      measureFrame,
      measureMemory,
      generateReport,
      getRecommendations
    }}>
      {children}
    </ChartProfilerContext.Provider>
  );
};

export const useChartProfiler = () => {
  const context = useContext(ChartProfilerContext);
  if (!context) {
    throw new Error('useChartProfiler must be used within ChartProfiler');
  }
  return context;
};

// === MEMORY MONITOR ===

interface MemoryMonitorContextValue {
  memoryMetrics: MemoryMetrics;
  isMonitoring: boolean;
  objectPools: Map<string, any[]>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  allocateFromPool: (poolName: string, factory: () => any) => any;
  releaseToPool: (poolName: string, object: any) => void;
  forceGarbageCollection: () => void;
  detectLeaks: () => any[];
  optimizeMemory: () => void;
}

const MemoryMonitorContext = createContext<MemoryMonitorContextValue | null>(null);

export const MemoryMonitor: React.FC<{ children: React.ReactNode; poolConfig?: Record<string, number> }> = ({ 
  children, 
  poolConfig = {} 
}) => {
  const [memoryMetrics, setMemoryMetrics] = useState<MemoryMetrics>({
    heapUsed: 0,
    heapTotal: 0,
    heapLimit: 0,
    allocations: 0,
    deallocations: 0,
    leaks: 0,
    gcPressure: 0,
    poolUtilization: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const objectPools = useRef(new Map<string, any[]>());
  const allocationTracker = useRef(new WeakSet());
  const intervalRef = useRef<NodeJS.Timeout>();

  // Initialize object pools
  useEffect(() => {
    Object.entries(poolConfig).forEach(([poolName, size]) => {
      if (!objectPools.current.has(poolName)) {
        objectPools.current.set(poolName, []);
      }
    });
  }, [poolConfig]);

  const updateMemoryMetrics = useCallback(() => {
    if (!isMonitoring) return;

    const memoryInfo = (performance as any).memory;
    if (memoryInfo) {
      setMemoryMetrics(prev => ({
        ...prev,
        heapUsed: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024),
        heapTotal: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024),
        heapLimit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024),
        poolUtilization: calculatePoolUtilization()
      }));
    }
  }, [isMonitoring]);

  const calculatePoolUtilization = useCallback((): number => {
    let totalCapacity = 0;
    let totalUsed = 0;

    objectPools.current.forEach((pool, poolName) => {
      const maxSize = poolConfig[poolName] || 100;
      totalCapacity += maxSize;
      totalUsed += maxSize - pool.length;
    });

    return totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;
  }, [poolConfig]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    intervalRef.current = setInterval(updateMemoryMetrics, 1000);
  }, [updateMemoryMetrics]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const allocateFromPool = useCallback((poolName: string, factory: () => any): any => {
    let pool = objectPools.current.get(poolName);
    if (!pool) {
      pool = [];
      objectPools.current.set(poolName, pool);
    }

    let obj = pool.pop();
    if (!obj) {
      obj = factory();
      setMemoryMetrics(prev => ({ ...prev, allocations: prev.allocations + 1 }));
    }

    allocationTracker.current.add(obj);
    return obj;
  }, []);

  const releaseToPool = useCallback((poolName: string, obj: any) => {
    const pool = objectPools.current.get(poolName);
    if (pool && pool.length < (poolConfig[poolName] || 100)) {
      // Reset object properties if needed
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          if (obj[key] && typeof obj[key] === 'object') {
            obj[key] = null;
          }
        });
      }

      pool.push(obj);
      allocationTracker.current.delete(obj);
      setMemoryMetrics(prev => ({ ...prev, deallocations: prev.deallocations + 1 }));
    }
  }, [poolConfig]);

  const forceGarbageCollection = useCallback(() => {
    // Clear pools that are over capacity
    objectPools.current.forEach((pool, poolName) => {
      const maxSize = poolConfig[poolName] || 100;
      if (pool.length > maxSize) {
        pool.splice(maxSize);
      }
    });

    setMemoryMetrics(prev => ({ ...prev, gcCollections: prev.gcCollections + 1 }));
  }, [poolConfig]);

  const detectLeaks = useCallback((): any[] => {
    // Simple leak detection - in real implementation would be more sophisticated
    const leaks: any[] = [];
    setMemoryMetrics(prev => ({ ...prev, leaks: leaks.length }));
    return leaks;
  }, []);

  const optimizeMemory = useCallback(() => {
    forceGarbageCollection();
    detectLeaks();

    // Trigger browser GC if available
    if ((window as any).gc) {
      (window as any).gc();
    }
  }, [forceGarbageCollection, detectLeaks]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <MemoryMonitorContext.Provider value={{
      memoryMetrics,
      isMonitoring,
      objectPools: objectPools.current,
      startMonitoring,
      stopMonitoring,
      allocateFromPool,
      releaseToPool,
      forceGarbageCollection,
      detectLeaks,
      optimizeMemory
    }}>
      {children}
    </MemoryMonitorContext.Provider>
  );
};

export const useMemoryMonitor = () => {
  const context = useContext(MemoryMonitorContext);
  if (!context) {
    throw new Error('useMemoryMonitor must be used within MemoryMonitor');
  }
  return context;
};

// === RENDER OPTIMIZER ===

interface RenderOptimizerContextValue {
  renderMetrics: RenderMetrics;
  config: OptimizationConfig;
  updateConfig: (updates: Partial<OptimizationConfig>) => void;
  scheduleRender: (renderFn: () => void, priority?: number) => void;
  batchRenders: (renders: (() => void)[]) => void;
  enableVirtualization: (enabled: boolean) => void;
  optimizeCanvas: (canvas: HTMLCanvasElement) => void;
  measureRenderTime: <T>(fn: () => T) => T;
}

const RenderOptimizerContext = createContext<RenderOptimizerContextValue | null>(null);

export const RenderOptimizer: React.FC<{ 
  children: React.ReactNode; 
  initialConfig?: Partial<OptimizationConfig> 
}> = ({ children, initialConfig = {} }) => {
  const [renderMetrics, setRenderMetrics] = useState<RenderMetrics>({
    frameTime: 0,
    drawCalls: 0,
    vertexCount: 0,
    textureMemory: 0,
    shaderCompiles: 0,
    bufferUploads: 0,
    contextSwitches: 0,
    culledObjects: 0
  });

  const [config, setConfig] = useState<OptimizationConfig>({
    enableVirtualization: true,
    enableCompression: true,
    enableWebGL: true,
    enableWorkers: true,
    maxDataPoints: 10000,
    frameTarget: 60,
    memoryLimit: 100,
    compressionLevel: 5,
    ...initialConfig
  });

  const renderQueue = useRef<{ fn: () => void; priority: number }[]>([]);
  const frameRef = useRef<number>();

  const updateConfig = useCallback((updates: Partial<OptimizationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const scheduleRender = useCallback((renderFn: () => void, priority: number = 0) => {
    renderQueue.current.push({ fn: renderFn, priority });
    renderQueue.current.sort((a, b) => b.priority - a.priority);

    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(() => {
        const startTime = performance.now();

        while (renderQueue.current.length > 0 && (performance.now() - startTime < 16.67)) {
          const render = renderQueue.current.shift();
          if (render) {
            render.fn();
          }
        }

        frameRef.current = undefined;
        
        if (renderQueue.current.length > 0) {
          scheduleRender(() => {}, 0); // Schedule remaining renders
        }
      });
    }
  }, []);

  const batchRenders = useCallback((renders: (() => void)[]) => {
    renders.forEach(render => scheduleRender(render, 1));
  }, [scheduleRender]);

  const enableVirtualization = useCallback((enabled: boolean) => {
    updateConfig({ enableVirtualization: enabled });
  }, [updateConfig]);

  const optimizeCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Enable alpha for transparency optimizations
      ctx.globalCompositeOperation = 'source-over';
      
      // Use will-change CSS property for GPU acceleration
      canvas.style.willChange = 'transform';
      
      // Set canvas size to match display size for crisp rendering
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    }
  }, []);

  const measureRenderTime = useCallback(<T,>(fn: () => T): T => {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    setRenderMetrics(prev => ({
      ...prev,
      frameTime: endTime - startTime,
      drawCalls: prev.drawCalls + 1
    }));
    
    return result;
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <RenderOptimizerContext.Provider value={{
      renderMetrics,
      config,
      updateConfig,
      scheduleRender,
      batchRenders,
      enableVirtualization,
      optimizeCanvas,
      measureRenderTime
    }}>
      {children}
    </RenderOptimizerContext.Provider>
  );
};

export const useRenderOptimizer = () => {
  const context = useContext(RenderOptimizerContext);
  if (!context) {
    throw new Error('useRenderOptimizer must be used within RenderOptimizer');
  }
  return context;
};

// === DATA PROCESSOR ===

interface DataProcessorContextValue {
  dataMetrics: DataMetrics;
  isProcessing: boolean;
  processLargeDataset: (data: any[], options?: ProcessingOptions) => Promise<any[]>;
  compressData: (data: any[], level?: number) => any[];
  decompressData: (compressedData: any[]) => any[];
  createIndex: (data: any[], field: string) => Map<any, any[]>;
  filterWithIndex: (index: Map<any, any[]>, predicate: (item: any) => boolean) => any[];
  aggregateData: (data: any[], groupBy: string, aggregateFields: string[]) => any[];
  streamProcess: (dataStream: AsyncIterable<any>, processor: (chunk: any[]) => any[]) => AsyncIterable<any>;
}

interface ProcessingOptions {
  chunkSize?: number;
  useWorkers?: boolean;
  enableCompression?: boolean;
  enableIndexing?: boolean;
}

const DataProcessorContext = createContext<DataProcessorContextValue | null>(null);

export const DataProcessor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataMetrics, setDataMetrics] = useState<DataMetrics>({
    processingTime: 0,
    compressionRatio: 0,
    indexingTime: 0,
    filterTime: 0,
    transformTime: 0,
    streamingThroughput: 0,
    cacheHitRate: 0,
    workerUtilization: 0
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const cacheRef = useRef(new Map<string, any>());
  const indexCacheRef = useRef(new Map<string, Map<any, any[]>>());

  const processLargeDataset = useCallback(async (data: any[], options: ProcessingOptions = {}): Promise<any[]> => {
    const {
      chunkSize = 1000,
      useWorkers = true,
      enableCompression = true,
      enableIndexing = true
    } = options;

    setIsProcessing(true);
    const startTime = performance.now();

    try {
      let processedData = [...data];

      // Process in chunks to avoid blocking the main thread
      if (data.length > chunkSize) {
        const chunks: any[][] = [];
        for (let i = 0; i < data.length; i += chunkSize) {
          chunks.push(data.slice(i, i + chunkSize));
        }

        if (useWorkers && 'Worker' in window) {
          // Simulate worker processing with setTimeout
          const processedChunks = await Promise.all(
            chunks.map(chunk => 
              new Promise<any[]>(resolve => 
                setTimeout(() => resolve(chunk), 10)
              )
            )
          );
          processedData = processedChunks.flat();
        } else {
          // Process synchronously with yield points
          processedData = [];
          for (const chunk of chunks) {
            processedData.push(...chunk);
            await new Promise(resolve => setTimeout(resolve, 0)); // Yield to browser
          }
        }
      }

      // Apply compression if enabled
      if (enableCompression) {
        processedData = compressData(processedData);
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      setDataMetrics(prev => ({
        ...prev,
        processingTime,
        streamingThroughput: data.length / (processingTime / 1000) // Items per second
      }));

      return processedData;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const compressData = useCallback((data: any[], level: number = 5): any[] => {
    const startTime = performance.now();
    const originalSize = JSON.stringify(data).length;

    // Simulate compression by removing redundant properties
    const compressed = data.map(item => {
      const compressed: any = {};
      Object.keys(item).forEach(key => {
        if (item[key] !== null && item[key] !== undefined && item[key] !== '') {
          compressed[key] = item[key];
        }
      });
      return compressed;
    });

    const compressedSize = JSON.stringify(compressed).length;
    const compressionRatio = (1 - compressedSize / originalSize) * 100;

    const endTime = performance.now();
    setDataMetrics(prev => ({
      ...prev,
      compressionRatio,
      processingTime: prev.processingTime + (endTime - startTime)
    }));

    return compressed;
  }, []);

  const decompressData = useCallback((compressedData: any[]): any[] => {
    // In a real implementation, this would decompress the data
    return compressedData;
  }, []);

  const createIndex = useCallback((data: any[], field: string): Map<any, any[]> => {
    const startTime = performance.now();
    const cacheKey = `index_${field}_${data.length}`;
    
    let index = indexCacheRef.current.get(cacheKey);
    if (index) {
      setDataMetrics(prev => ({ ...prev, cacheHitRate: prev.cacheHitRate + 1 }));
      return index;
    }

    index = new Map();
    data.forEach(item => {
      const value = item[field];
      if (!index!.has(value)) {
        index!.set(value, []);
      }
      index!.get(value)!.push(item);
    });

    indexCacheRef.current.set(cacheKey, index);
    
    const endTime = performance.now();
    setDataMetrics(prev => ({
      ...prev,
      indexingTime: prev.indexingTime + (endTime - startTime)
    }));

    return index;
  }, []);

  const filterWithIndex = useCallback((index: Map<any, any[]>, predicate: (item: any) => boolean): any[] => {
    const startTime = performance.now();
    const results: any[] = [];

    index.forEach(items => {
      items.forEach(item => {
        if (predicate(item)) {
          results.push(item);
        }
      });
    });

    const endTime = performance.now();
    setDataMetrics(prev => ({
      ...prev,
      filterTime: prev.filterTime + (endTime - startTime)
    }));

    return results;
  }, []);

  const aggregateData = useCallback((data: any[], groupBy: string, aggregateFields: string[]): any[] => {
    const startTime = performance.now();
    const groups = new Map();

    data.forEach(item => {
      const key = item[groupBy];
      if (!groups.has(key)) {
        groups.set(key, {
          [groupBy]: key,
          count: 0,
          ...aggregateFields.reduce((acc, field) => ({
            ...acc,
            [`${field}_sum`]: 0,
            [`${field}_avg`]: 0,
            [`${field}_min`]: Infinity,
            [`${field}_max`]: -Infinity
          }), {})
        });
      }

      const group = groups.get(key);
      group.count++;

      aggregateFields.forEach(field => {
        const value = item[field] || 0;
        group[`${field}_sum`] += value;
        group[`${field}_min`] = Math.min(group[`${field}_min`], value);
        group[`${field}_max`] = Math.max(group[`${field}_max`], value);
      });
    });

    // Calculate averages
    groups.forEach(group => {
      aggregateFields.forEach(field => {
        group[`${field}_avg`] = group.count > 0 ? group[`${field}_sum`] / group.count : 0;
      });
    });

    const result = Array.from(groups.values());
    
    const endTime = performance.now();
    setDataMetrics(prev => ({
      ...prev,
      transformTime: prev.transformTime + (endTime - startTime)
    }));

    return result;
  }, []);

  const streamProcess = useCallback(async function* (
    dataStream: AsyncIterable<any>, 
    processor: (chunk: any[]) => any[]
  ): AsyncIterable<any> {
    for await (const chunk of dataStream) {
      const processed = processor(Array.isArray(chunk) ? chunk : [chunk]);
      yield* processed;
    }
  }, []);

  return (
    <DataProcessorContext.Provider value={{
      dataMetrics,
      isProcessing,
      processLargeDataset,
      compressData,
      decompressData,
      createIndex,
      filterWithIndex,
      aggregateData,
      streamProcess
    }}>
      {children}
    </DataProcessorContext.Provider>
  );
};

export const useDataProcessor = () => {
  const context = useContext(DataProcessorContext);
  if (!context) {
    throw new Error('useDataProcessor must be used within DataProcessor');
  }
  return context;
};

// === OPTIMIZED CHART COMPONENT ===

interface OptimizedChartProps {
  data: any[];
  width?: number;
  height?: number;
  type?: 'line' | 'bar' | 'scatter';
  enableVirtualization?: boolean;
}

export const OptimizedChart: React.FC<OptimizedChartProps> = ({
  data,
  width = 800,
  height = 400,
  type = 'line',
  enableVirtualization = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { measureFrame } = useChartProfiler();
  const { measureRenderTime } = useRenderOptimizer();
  const { processLargeDataset } = useDataProcessor();
  const { allocateFromPool, releaseToPool } = useMemoryMonitor();

  // Process and render data with optimization
  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const renderChart = async () => {
      // Process large datasets
      const processedData = data.length > 1000 
        ? await processLargeDataset(data, { enableCompression: true, enableIndexing: true })
        : data;

      measureFrame(() => {
        measureRenderTime(() => {
          const svg = d3.select(svgRef.current);
          svg.selectAll('*').remove();

          const margin = { top: 20, right: 20, bottom: 30, left: 40 };
          const chartWidth = width - margin.left - margin.right;
          const chartHeight = height - margin.top - margin.bottom;

          const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

          if (type === 'line' && processedData.length > 0) {
            const xScale = d3.scaleLinear()
              .domain(d3.extent(processedData, (d: any, i) => i) as [number, number])
              .range([0, chartWidth]);

            const yScale = d3.scaleLinear()
              .domain(d3.extent(processedData, (d: any) => d.value || d.y || 0) as [number, number])
              .range([chartHeight, 0]);

            const line = d3.line<any>()
              .x((d, i) => xScale(i))
              .y(d => yScale(d.value || d.y || 0))
              .curve(d3.curveMonotoneX);

            // Virtualization for large datasets
            const visibleData = enableVirtualization && processedData.length > 500
              ? processedData.filter((_, i) => i % Math.ceil(processedData.length / 500) === 0)
              : processedData;

            g.append('path')
              .datum(visibleData)
              .attr('fill', 'none')
              .attr('stroke', '#4C6EF5')
              .attr('stroke-width', 2)
              .attr('d', line);

            // Add axes
            g.append('g')
              .attr('transform', `translate(0,${chartHeight})`)
              .call(d3.axisBottom(xScale));

            g.append('g')
              .call(d3.axisLeft(yScale));
          }
        });
      });
    };

    renderChart();
  }, [data, width, height, type, enableVirtualization, measureFrame, measureRenderTime, processLargeDataset]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: '#f8f9fa', borderRadius: '4px' }}
    />
  );
};

// === PERFORMANCE DASHBOARD ===

export const PerformanceDashboard: React.FC = () => {
  const profiler = useChartProfiler();
  const memoryMonitor = useMemoryMonitor();
  const renderOptimizer = useRenderOptimizer();
  const dataProcessor = useDataProcessor();

  const [activeTab, setActiveTab] = useState('profiler');

  // Generate sample data
  const sampleData = useMemo(() => 
    Array.from({ length: 1000 }, (_, i) => ({
      x: i,
      y: Math.sin(i * 0.1) * 50 + Math.random() * 20,
      value: Math.random() * 100
    }))
  , []);

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Performance Optimization Dashboard</Title>
        <Group>
          <Button 
            onClick={profiler.isProfileng ? profiler.stopProfiling : profiler.startProfiling}
            color={profiler.isProfileng ? 'red' : 'green'}
            leftSection={<IconActivity size={16} />}
          >
            {profiler.isProfileng ? 'Stop Profiling' : 'Start Profiling'}
          </Button>
          <Button 
            onClick={memoryMonitor.isMonitoring ? memoryMonitor.stopMonitoring : memoryMonitor.startMonitoring}
            color={memoryMonitor.isMonitoring ? 'red' : 'blue'}
            leftSection={<IconMemory size={16} />}
          >
            {memoryMonitor.isMonitoring ? 'Stop Memory Monitor' : 'Start Memory Monitor'}
          </Button>
        </Group>
      </Group>

      <Grid mb="lg">
        <Grid.Col span={3}>
          <Card>
            <Group>
              <IconGauge size={24} color="#4C6EF5" />
              <div>
                <Text size="lg" fw={600}>{profiler.metrics.fps}</Text>
                <Text size="sm" c="dimmed">FPS</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Group>
              <IconMemory size={24} color="#51CF66" />
              <div>
                <Text size="lg" fw={600}>{memoryMonitor.memoryMetrics.heapUsed}MB</Text>
                <Text size="sm" c="dimmed">Memory Used</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Group>
              <IconCpu size={24} color="#FF6B6B" />
              <div>
                <Text size="lg" fw={600}>{profiler.metrics.renderTime.toFixed(1)}ms</Text>
                <Text size="sm" c="dimmed">Render Time</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Group>
              <IconDatabase size={24} color="#7C3AED" />
              <div>
                <Text size="lg" fw={600}>{dataProcessor.dataMetrics.processingTime.toFixed(1)}ms</Text>
                <Text size="sm" c="dimmed">Processing Time</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'profiler')}>
        <Tabs.List>
          <Tabs.Tab value="profiler" leftSection={<IconActivity size={16} />}>
            Profiler
          </Tabs.Tab>
          <Tabs.Tab value="memory" leftSection={<IconMemory size={16} />}>
            Memory
          </Tabs.Tab>
          <Tabs.Tab value="render" leftSection={<IconCpu size={16} />}>
            Render
          </Tabs.Tab>
          <Tabs.Tab value="chart" leftSection={<IconChartBar size={16} />}>
            Optimized Chart
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="profiler" pt="lg">
          <Grid>
            <Grid.Col span={6}>
              <Card>
                <Title order={3} mb="md">Performance Metrics</Title>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text>FPS</Text>
                    <Badge color={profiler.metrics.fps >= 50 ? 'green' : profiler.metrics.fps >= 30 ? 'yellow' : 'red'}>
                      {profiler.metrics.fps}
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text>Frame Drops</Text>
                    <Badge color={profiler.metrics.frameDrops < 5 ? 'green' : 'red'}>
                      {profiler.metrics.frameDrops}
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text>CPU Usage</Text>
                    <Badge color={profiler.metrics.cpuUsage < 70 ? 'green' : 'red'}>
                      {profiler.metrics.cpuUsage}%
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text>Update Frequency</Text>
                    <Badge>{profiler.metrics.updateFrequency}</Badge>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card>
                <Title order={3} mb="md">Recommendations</Title>
                <Stack gap="xs">
                  {profiler.getRecommendations().map((recommendation, index) => (
                    <Paper key={index} p="xs" bg="yellow.0" c="yellow.8">
                      <Text size="sm">{recommendation}</Text>
                    </Paper>
                  ))}
                  {profiler.getRecommendations().length === 0 && (
                    <Text size="sm" c="dimmed">No recommendations - performance is optimal!</Text>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="memory" pt="lg">
          <Grid>
            <Grid.Col span={6}>
              <Card>
                <Title order={3} mb="md">Memory Usage</Title>
                <Stack gap="md">
                  <div>
                    <Text size="sm" mb="xs">Heap Usage</Text>
                    <Progress
                      value={(memoryMonitor.memoryMetrics.heapUsed / memoryMonitor.memoryMetrics.heapLimit) * 100}
                      color="blue"
                      label={`${memoryMonitor.memoryMetrics.heapUsed}MB / ${memoryMonitor.memoryMetrics.heapLimit}MB`}
                    />
                  </div>
                  <div>
                    <Text size="sm" mb="xs">Pool Utilization</Text>
                    <Progress
                      value={memoryMonitor.memoryMetrics.poolUtilization}
                      color="green"
                      label={`${memoryMonitor.memoryMetrics.poolUtilization.toFixed(1)}%`}
                    />
                  </div>
                  <Group justify="space-between">
                    <Text>Allocations</Text>
                    <Badge>{memoryMonitor.memoryMetrics.allocations}</Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text>Deallocations</Text>
                    <Badge>{memoryMonitor.memoryMetrics.deallocations}</Badge>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card>
                <Title order={3} mb="md">Memory Controls</Title>
                <Stack gap="md">
                  <Button onClick={memoryMonitor.forceGarbageCollection} fullWidth>
                    Force Garbage Collection
                  </Button>
                  <Button onClick={memoryMonitor.optimizeMemory} fullWidth color="green">
                    Optimize Memory
                  </Button>
                  <Button onClick={() => memoryMonitor.detectLeaks()} fullWidth color="orange">
                    Detect Leaks
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="render" pt="lg">
          <Grid>
            <Grid.Col span={6}>
              <Card>
                <Title order={3} mb="md">Render Settings</Title>
                <Stack gap="md">
                  <Switch
                    label="Enable Virtualization"
                    checked={renderOptimizer.config.enableVirtualization}
                    onChange={(e) => renderOptimizer.updateConfig({ enableVirtualization: e.target.checked })}
                  />
                  <Switch
                    label="Enable WebGL"
                    checked={renderOptimizer.config.enableWebGL}
                    onChange={(e) => renderOptimizer.updateConfig({ enableWebGL: e.target.checked })}
                  />
                  <Switch
                    label="Enable Compression"
                    checked={renderOptimizer.config.enableCompression}
                    onChange={(e) => renderOptimizer.updateConfig({ enableCompression: e.target.checked })}
                  />
                  <div>
                    <Text size="sm" mb="xs">Max Data Points: {renderOptimizer.config.maxDataPoints}</Text>
                    <Slider
                      value={renderOptimizer.config.maxDataPoints}
                      onChange={(value) => renderOptimizer.updateConfig({ maxDataPoints: value })}
                      min={1000}
                      max={100000}
                      step={1000}
                    />
                  </div>
                </Stack>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card>
                <Title order={3} mb="md">Render Metrics</Title>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text>Frame Time</Text>
                    <Badge>{renderOptimizer.renderMetrics.frameTime.toFixed(2)}ms</Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text>Draw Calls</Text>
                    <Badge>{renderOptimizer.renderMetrics.drawCalls}</Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text>Frame Target</Text>
                    <Badge>{renderOptimizer.config.frameTarget} FPS</Badge>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="chart" pt="lg">
          <Card>
            <Group justify="space-between" mb="md">
              <Title order={3}>Optimized Chart Performance Test</Title>
              <Button onClick={profiler.generateReport} leftSection={<IconRefresh size={16} />}>
                Generate Report
              </Button>
            </Group>
            <OptimizedChart
              data={sampleData}
              width={800}
              height={400}
              type="line"
              enableVirtualization={renderOptimizer.config.enableVirtualization}
            />
            <Divider my="md" />
            <Grid>
              <Grid.Col span={4}>
                <Text size="sm" c="dimmed">Data Points: {sampleData.length}</Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="sm" c="dimmed">Processing: {dataProcessor.dataMetrics.processingTime.toFixed(1)}ms</Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="sm" c="dimmed">Compression: {dataProcessor.dataMetrics.compressionRatio.toFixed(1)}%</Text>
              </Grid.Col>
            </Grid>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

// === MAIN PERFORMANCE OPTIMIZATION COMPONENT ===

export default function Exercise10() {
  return (
    <ChartProfiler>
      <MemoryMonitor>
        <RenderOptimizer>
          <DataProcessor>
            <PerformanceDashboard />
          </DataProcessor>
        </RenderOptimizer>
      </MemoryMonitor>
    </ChartProfiler>
  );
}