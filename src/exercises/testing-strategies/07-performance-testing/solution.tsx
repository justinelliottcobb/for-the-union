import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// =============================================================================
// SOLUTION: Performance Testing - Frontend Performance Testing and Monitoring
// =============================================================================
// Complete implementation demonstrating comprehensive performance testing patterns
// Used by Staff Frontend Engineers for production-ready performance monitoring
// =============================================================================

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface PerformanceBudget {
  maxRenderTime: number;        // Maximum render time in ms
  maxMemoryUsage: number;       // Maximum memory usage in bytes
  minFrameRate: number;         // Minimum acceptable frame rate
  maxBundleSize: number;        // Maximum bundle size in bytes
  maxTimeToInteractive: number; // Maximum time to interactive in ms
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  frameRate: number;
  bundleSize: number;
  timeToInteractive: number;
  timestamp: number;
}

interface VirtualItem {
  id: string;
  content: string;
  height: number;
}

interface ImageItem {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

interface DataItem {
  id: string;
  value: number;
  category: string;
  processed?: boolean;
}

interface ProcessingResult {
  totalItems: number;
  processedItems: number;
  averageProcessingTime: number;
  throughput: number;
  memoryUsage: number;
}

interface BundleAnalysis {
  totalSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: Array<{ name: string; size: number }>;
  }>;
  unusedCode: Array<{ file: string; size: number }>;
  suggestions: string[];
}

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

// Performance measurement wrapper
export const measurePerformance = async <T>(
  operation: () => Promise<T> | T,
  operationName: string
): Promise<{ result: T; metrics: PerformanceMetrics }> => {
  // Mark start of operation
  performance.mark(`${operationName}-start`);
  
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  let result: T;
  let frameRate = 60; // Default assumption
  
  try {
    // Start frame rate monitoring
    const frameRateStart = performance.now();
    let frameCount = 0;
    
    const frameCallback = () => {
      frameCount++;
      if (performance.now() - frameRateStart < 1000) {
        requestAnimationFrame(frameCallback);
      } else {
        frameRate = frameCount;
      }
    };
    requestAnimationFrame(frameCallback);
    
    // Execute operation
    result = await Promise.resolve(operation());
    
    // Mark end of operation
    performance.mark(`${operationName}-end`);
    
    // Measure total time
    performance.measure(operationName, `${operationName}-start`, `${operationName}-end`);
    
    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    const metrics: PerformanceMetrics = {
      renderTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      frameRate,
      bundleSize: 0, // Would be populated from bundle analysis
      timeToInteractive: endTime - startTime,
      timestamp: Date.now()
    };
    
    return { result, metrics };
    
  } catch (error) {
    console.error(`Performance measurement failed for ${operationName}:`, error);
    throw error;
  }
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string, budget?: PerformanceBudget) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [violations, setViolations] = useState<string[]>([]);
  const mountTimeRef = useRef(performance.now());
  
  useEffect(() => {
    const measureComponentPerformance = () => {
      const renderTime = performance.now() - mountTimeRef.current;
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      
      const currentMetrics: PerformanceMetrics = {
        renderTime,
        memoryUsage,
        frameRate: 60, // Simplified for demo
        bundleSize: 0,
        timeToInteractive: renderTime,
        timestamp: Date.now()
      };
      
      setMetrics(currentMetrics);
      
      // Check budget violations
      if (budget) {
        const newViolations: string[] = [];
        
        if (renderTime > budget.maxRenderTime) {
          newViolations.push(`Render time (${renderTime.toFixed(2)}ms) exceeds budget (${budget.maxRenderTime}ms)`);
        }
        
        if (memoryUsage > budget.maxMemoryUsage) {
          newViolations.push(`Memory usage (${memoryUsage} bytes) exceeds budget (${budget.maxMemoryUsage} bytes)`);
        }
        
        setViolations(newViolations);
        
        if (newViolations.length > 0) {
          console.warn(`Performance budget violations in ${componentName}:`, newViolations);
        }
      }
    };
    
    // Measure after next tick to allow for rendering
    const timeoutId = setTimeout(measureComponentPerformance, 0);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [componentName, budget]);
  
  return { metrics, violations };
};

// Bundle analysis hook
export const useBundleAnalysis = (): BundleAnalysis => {
  return useMemo(() => {
    // Simulate bundle analysis (in real app, this would use webpack-bundle-analyzer data)
    return {
      totalSize: 245000,
      chunks: [
        {
          name: 'main',
          size: 150000,
          modules: [
            { name: 'react', size: 45000 },
            { name: 'lodash', size: 35000 },
            { name: 'components', size: 70000 }
          ]
        },
        {
          name: 'vendor',
          size: 95000,
          modules: [
            { name: 'third-party', size: 95000 }
          ]
        }
      ],
      unusedCode: [
        { file: 'unused-utility.js', size: 15000 },
        { file: 'old-component.js', size: 8000 }
      ],
      suggestions: [
        'Consider lazy loading vendor chunk',
        'Remove unused utility functions',
        'Implement tree shaking for lodash'
      ]
    };
  }, []);
};

// Memory profiler hook
export const useMemoryProfiler = (componentName: string) => {
  const [memoryData, setMemoryData] = useState<Array<{ timestamp: number; usage: number }>>([]);
  const [leakDetected, setLeakDetected] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if ((performance as any).memory) {
        const usage = (performance as any).memory.usedJSHeapSize;
        const timestamp = Date.now();
        
        setMemoryData(prev => {
          const newData = [...prev, { timestamp, usage }];
          
          // Keep only last 20 measurements
          if (newData.length > 20) {
            newData.shift();
          }
          
          // Simple leak detection: memory consistently increasing
          if (newData.length >= 10) {
            const recent = newData.slice(-10);
            const trend = recent.every((point, index) => 
              index === 0 || point.usage >= recent[index - 1].usage
            );
            
            if (trend && recent[recent.length - 1].usage > recent[0].usage * 1.5) {
              setLeakDetected(true);
              console.warn(`Potential memory leak detected in ${componentName}`);
            }
          }
          
          return newData;
        });
      }
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [componentName]);
  
  return { memoryData, leakDetected };
};

// =============================================================================
// 1. HEAVY COMPONENT - Computationally Expensive Component Testing
// =============================================================================

const HeavyComponentInner: React.FC<{
  iterations?: number;
  enableProfiling?: boolean;
  budget?: PerformanceBudget;
}> = ({ iterations = 1000, enableProfiling = true, budget }) => {
  const [result, setResult] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const { metrics, violations } = usePerformanceMonitor('HeavyComponent', budget);
  
  // Expensive computation
  const expensiveCalculation = useCallback(() => {
    let sum = 0;
    for (let i = 0; i < iterations * 1000; i++) {
      sum += Math.sqrt(Math.random() * i);
    }
    return sum;
  }, [iterations]);
  
  const performCalculation = useCallback(async () => {
    setIsCalculating(true);
    
    if (enableProfiling) {
      const { result: calcResult, metrics: calcMetrics } = await measurePerformance(
        () => expensiveCalculation(),
        'heavy-calculation'
      );
      
      setResult(calcResult);
      console.log('Heavy calculation metrics:', calcMetrics);
    } else {
      setResult(expensiveCalculation());
    }
    
    setIsCalculating(false);
  }, [expensiveCalculation, enableProfiling]);
  
  // Memoized expensive render
  const expensiveRender = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => (
      <div key={i} className="heavy-item">
        {Math.random().toString(36).substring(7)}
      </div>
    ));
  }, []);
  
  return (
    <div data-testid="heavy-component">
      <h3>Heavy Component Performance Test</h3>
      
      {metrics && (
        <div data-testid="performance-metrics">
          <p>Render Time: {metrics.renderTime.toFixed(2)}ms</p>
          <p>Memory Usage: {(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</p>
          <p>Frame Rate: {metrics.frameRate}fps</p>
        </div>
      )}
      
      {violations.length > 0 && (
        <div data-testid="performance-violations" className="violations">
          {violations.map((violation, index) => (
            <p key={index} className="violation">{violation}</p>
          ))}
        </div>
      )}
      
      <button 
        onClick={performCalculation} 
        disabled={isCalculating}
        data-testid="calculate-button"
      >
        {isCalculating ? 'Calculating...' : 'Start Heavy Calculation'}
      </button>
      
      {result > 0 && (
        <p data-testid="calculation-result">
          Result: {result.toFixed(2)}
        </p>
      )}
      
      <div className="expensive-render">
        {expensiveRender}
      </div>
    </div>
  );
};

export const HeavyComponent = memo(HeavyComponentInner);

// =============================================================================
// 2. VIRTUALIZED LIST - Large Dataset Performance Testing
// =============================================================================

export const VirtualizedList: React.FC<{
  items: VirtualItem[];
  height: number;
  itemHeight: number;
  budget?: PerformanceBudget;
}> = ({ items, height, itemHeight, budget }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollMetrics, setScrollMetrics] = useState<{ fps: number; smoothness: number }>({ fps: 60, smoothness: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFrameRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const { metrics, violations } = usePerformanceMonitor('VirtualizedList', budget);
  
  // Calculate visible items
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(height / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index
    }));
  }, [scrollTop, itemHeight, height, items]);
  
  // Scroll performance monitoring
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    
    // Measure frame rate during scrolling
    const now = performance.now();
    const deltaTime = now - lastFrameRef.current;
    frameCountRef.current++;
    
    if (deltaTime >= 1000) {
      const fps = Math.round((frameCountRef.current / deltaTime) * 1000);
      const smoothness = Math.min(fps / 60, 1);
      
      setScrollMetrics({ fps, smoothness });
      
      frameCountRef.current = 0;
      lastFrameRef.current = now;
      
      if (fps < 30) {
        console.warn('Low scroll performance detected:', { fps, smoothness });
      }
    }
  }, []);
  
  const totalHeight = items.length * itemHeight;
  
  return (
    <div data-testid="virtualized-list">
      <h3>Virtualized List Performance Test</h3>
      
      {metrics && (
        <div data-testid="list-performance-metrics">
          <p>Items: {items.length}</p>
          <p>Visible: {visibleItems.length}</p>
          <p>Scroll FPS: {scrollMetrics.fps}</p>
          <p>Scroll Smoothness: {(scrollMetrics.smoothness * 100).toFixed(1)}%</p>
        </div>
      )}
      
      {violations.length > 0 && (
        <div data-testid="list-violations">
          {violations.map((violation, index) => (
            <p key={index}>{violation}</p>
          ))}
        </div>
      )}
      
      <div
        ref={containerRef}
        className="virtual-container"
        style={{ height, overflow: 'auto' }}
        onScroll={handleScroll}
        data-testid="virtual-container"
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map(item => (
            <div
              key={item.id}
              className="virtual-item"
              style={{
                position: 'absolute',
                top: item.index * itemHeight,
                height: itemHeight,
                width: '100%'
              }}
              data-testid={`virtual-item-${item.id}`}
            >
              <div>Item {item.index}: {item.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 3. IMAGE GALLERY - Media Loading Performance Testing
// =============================================================================

export const ImageGallery: React.FC<{
  images: ImageItem[];
  budget?: PerformanceBudget;
}> = ({ images, budget }) => {
  const [loadedImages, setLoadedImages] = useState(new Set<string>());
  const [loadingMetrics, setLoadingMetrics] = useState<Map<string, number>>(new Map());
  const [fcpTime, setFcpTime] = useState<number | null>(null);
  const [lcpTime, setLcpTime] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { metrics, violations } = usePerformanceMonitor('ImageGallery', budget);
  
  useEffect(() => {
    // Monitor FCP and LCP
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
          setFcpTime(entry.startTime);
        }
        if (entry.entryType === 'largest-contentful-paint') {
          setLcpTime(entry.startTime);
        }
      }
    });
    
    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
    
    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    // Intersection Observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const imageId = img.dataset.imageId;
            
            if (imageId && !loadedImages.has(imageId)) {
              const startTime = performance.now();
              
              img.onload = () => {
                const loadTime = performance.now() - startTime;
                setLoadingMetrics(prev => new Map(prev).set(imageId, loadTime));
                setLoadedImages(prev => new Set(prev).add(imageId));
                
                console.log(`Image ${imageId} loaded in ${loadTime.toFixed(2)}ms`);
              };
              
              img.onerror = () => {
                console.error(`Failed to load image ${imageId}`);
              };
              
              const imageData = images.find(img => img.id === imageId);
              if (imageData) {
                img.src = imageData.src;
              }
            }
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [images, loadedImages]);
  
  const averageLoadTime = useMemo(() => {
    const times = Array.from(loadingMetrics.values());
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
  }, [loadingMetrics]);
  
  return (
    <div data-testid="image-gallery">
      <h3>Image Gallery Performance Test</h3>
      
      {metrics && (
        <div data-testid="gallery-performance-metrics">
          <p>Total Images: {images.length}</p>
          <p>Loaded Images: {loadedImages.size}</p>
          <p>Average Load Time: {averageLoadTime.toFixed(2)}ms</p>
          {fcpTime && <p>FCP: {fcpTime.toFixed(2)}ms</p>}
          {lcpTime && <p>LCP: {lcpTime.toFixed(2)}ms</p>}
        </div>
      )}
      
      {violations.length > 0 && (
        <div data-testid="gallery-violations">
          {violations.map((violation, index) => (
            <p key={index}>{violation}</p>
          ))}
        </div>
      )}
      
      <div className="image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {images.map((image) => (
          <div key={image.id} className="image-container">
            <img
              data-image-id={image.id}
              data-testid={`gallery-image-${image.id}`}
              alt={image.alt}
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
              ref={(el) => {
                if (el && observerRef.current) {
                  observerRef.current.observe(el);
                }
              }}
            />
            {loadingMetrics.has(image.id) && (
              <p className="load-time">
                Loaded in {loadingMetrics.get(image.id)!.toFixed(2)}ms
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// 4. DATA PROCESSOR - Data Processing Performance Testing
// =============================================================================

// Web Worker mock (in real app, this would be a separate file)
const createMockWorker = () => {
  return {
    postMessage: (data: any) => {
      // Simulate processing delay
      setTimeout(() => {
        const processedData = data.map((item: DataItem) => ({
          ...item,
          processed: true,
          value: item.value * 2
        }));
        
        // Simulate worker message
        if (window.mockWorkerCallback) {
          window.mockWorkerCallback({ data: processedData });
        }
      }, Math.random() * 100);
    },
    terminate: () => {},
    onmessage: null as any,
    onerror: null as any
  };
};

declare global {
  interface Window {
    mockWorkerCallback?: (event: { data: any }) => void;
  }
}

export const DataProcessor: React.FC<{
  data: DataItem[];
  batchSize?: number;
  enableWorker?: boolean;
  budget?: PerformanceBudget;
}> = ({ data, batchSize = 100, enableWorker = true, budget }) => {
  const [processedData, setProcessedData] = useState<DataItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMetrics, setProcessingMetrics] = useState<ProcessingResult | null>(null);
  const workerRef = useRef<any>(null);
  const { metrics, violations } = usePerformanceMonitor('DataProcessor', budget);
  const { memoryData, leakDetected } = useMemoryProfiler('DataProcessor');
  
  // Initialize worker
  useEffect(() => {
    if (enableWorker) {
      workerRef.current = createMockWorker();
      
      window.mockWorkerCallback = (event) => {
        const batch = event.data;
        setProcessedData(prev => [...prev, ...batch]);
      };
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      window.mockWorkerCallback = undefined;
    };
  }, [enableWorker]);
  
  const processBatch = useCallback(async (batch: DataItem[]): Promise<DataItem[]> => {
    const startTime = performance.now();
    
    // Simulate CPU-intensive processing
    const processed = batch.map(item => ({
      ...item,
      processed: true,
      value: item.value * Math.sqrt(item.value) + Math.random()
    }));
    
    // Add artificial delay to simulate real processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
    
    const processingTime = performance.now() - startTime;
    console.log(`Batch processed in ${processingTime.toFixed(2)}ms`);
    
    return processed;
  }, []);
  
  const processData = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setProcessedData([]);
    
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    try {
      if (enableWorker && workerRef.current) {
        // Process with Web Worker
        const batches = [];
        for (let i = 0; i < data.length; i += batchSize) {
          batches.push(data.slice(i, i + batchSize));
        }
        
        for (const batch of batches) {
          workerRef.current.postMessage(batch);
        }
        
        // Wait for all batches to complete
        await new Promise(resolve => {
          const checkComplete = () => {
            if (processedData.length >= data.length) {
              resolve(undefined);
            } else {
              setTimeout(checkComplete, 100);
            }
          };
          checkComplete();
        });
      } else {
        // Process on main thread
        const allProcessed: DataItem[] = [];
        
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          const processed = await processBatch(batch);
          allProcessed.push(...processed);
        }
        
        setProcessedData(allProcessed);
      }
      
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const totalTime = endTime - startTime;
      
      const result: ProcessingResult = {
        totalItems: data.length,
        processedItems: data.length,
        averageProcessingTime: totalTime / Math.ceil(data.length / batchSize),
        throughput: data.length / (totalTime / 1000), // items per second
        memoryUsage: endMemory - startMemory
      };
      
      setProcessingMetrics(result);
      console.log('Processing completed:', result);
      
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [data, batchSize, enableWorker, processBatch, isProcessing, processedData.length]);
  
  return (
    <div data-testid="data-processor">
      <h3>Data Processing Performance Test</h3>
      
      {metrics && (
        <div data-testid="processor-performance-metrics">
          <p>Render Time: {metrics.renderTime.toFixed(2)}ms</p>
          <p>Memory Usage: {(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</p>
        </div>
      )}
      
      {processingMetrics && (
        <div data-testid="processing-metrics">
          <p>Total Items: {processingMetrics.totalItems}</p>
          <p>Processed Items: {processingMetrics.processedItems}</p>
          <p>Average Batch Time: {processingMetrics.averageProcessingTime.toFixed(2)}ms</p>
          <p>Throughput: {processingMetrics.throughput.toFixed(2)} items/sec</p>
          <p>Memory Delta: {(processingMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</p>
        </div>
      )}
      
      {leakDetected && (
        <div data-testid="memory-leak-warning" className="warning">
          ⚠️ Potential memory leak detected!
        </div>
      )}
      
      {violations.length > 0 && (
        <div data-testid="processor-violations">
          {violations.map((violation, index) => (
            <p key={index}>{violation}</p>
          ))}
        </div>
      )}
      
      <div>
        <p>Input Data: {data.length} items</p>
        <p>Processed: {processedData.length} items</p>
        <p>Batch Size: {batchSize}</p>
        <p>Worker Enabled: {enableWorker ? 'Yes' : 'No'}</p>
      </div>
      
      <button 
        onClick={processData} 
        disabled={isProcessing}
        data-testid="process-button"
      >
        {isProcessing ? 'Processing...' : 'Start Processing'}
      </button>
      
      {processedData.length > 0 && (
        <div data-testid="processed-results">
          <h4>Sample Processed Results:</h4>
          {processedData.slice(0, 5).map(item => (
            <div key={item.id}>
              {item.id}: {item.value.toFixed(2)} ({item.category})
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// JEST PERFORMANCE TESTING UTILITIES
// =============================================================================

// Performance testing utilities for Jest
export const performanceTestUtils = {
  // Measure component render time
  async measureComponentPerformance<T extends React.ComponentType<any>>(
    Component: T,
    props: React.ComponentProps<T>
  ): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    render(React.createElement(Component, props));
    
    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    return {
      renderTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      frameRate: 60, // Simplified for testing
      bundleSize: 0,
      timeToInteractive: endTime - startTime,
      timestamp: Date.now()
    };
  },
  
  // Assert performance budget
  assertPerformanceBudget(metrics: PerformanceMetrics, budget: PerformanceBudget) {
    const violations: string[] = [];
    
    if (metrics.renderTime > budget.maxRenderTime) {
      violations.push(`Render time ${metrics.renderTime}ms exceeds budget ${budget.maxRenderTime}ms`);
    }
    
    if (metrics.memoryUsage > budget.maxMemoryUsage) {
      violations.push(`Memory usage ${metrics.memoryUsage} bytes exceeds budget ${budget.maxMemoryUsage} bytes`);
    }
    
    if (violations.length > 0) {
      throw new Error(`Performance budget violations: ${violations.join(', ')}`);
    }
  },
  
  // Lighthouse CI configuration
  lighthouseConfig: {
    ci: {
      collect: {
        numberOfRuns: 3,
        settings: {
          chromeFlags: '--no-sandbox'
        }
      },
      assert: {
        assertions: {
          'categories:performance': ['error', { minScore: 0.9 }],
          'audits:first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
          'audits:largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
          'audits:cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }]
        }
      }
    }
  }
};

// =============================================================================
// DATA GENERATORS FOR TESTING
// =============================================================================

export const generateTestData = {
  // Generate heavy computation data
  heavyComponentData: (complexity: number = 1000) => ({
    iterations: complexity,
    enableProfiling: true,
    budget: {
      maxRenderTime: 100,
      maxMemoryUsage: 50 * 1024 * 1024,
      minFrameRate: 30,
      maxBundleSize: 250000,
      maxTimeToInteractive: 200
    } as PerformanceBudget
  }),
  
  // Generate virtual list items
  virtualListItems: (count: number = 10000): VirtualItem[] => 
    Array.from({ length: count }, (_, i) => ({
      id: `item-${i}`,
      content: `Item content ${i} - ${Math.random().toString(36).substring(7)}`,
      height: 50
    })),
  
  // Generate image gallery items
  imageGalleryItems: (count: number = 50): ImageItem[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `image-${i}`,
      src: `https://picsum.photos/400/300?random=${i}`,
      alt: `Test image ${i}`,
      width: 400,
      height: 300
    })),
  
  // Generate data processing items
  dataProcessingItems: (count: number = 5000): DataItem[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `data-${i}`,
      value: Math.random() * 1000,
      category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      processed: false
    }))
};

// =============================================================================
// DEMO COMPONENT - Integration of All Performance Testing Components
// =============================================================================

export const PerformanceTestingDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('heavy');
  const bundleAnalysis = useBundleAnalysis();
  
  const budget: PerformanceBudget = {
    maxRenderTime: 50,
    maxMemoryUsage: 100 * 1024 * 1024,
    minFrameRate: 30,
    maxBundleSize: 250000,
    maxTimeToInteractive: 100
  };
  
  const testData = {
    virtualItems: generateTestData.virtualListItems(5000),
    imageItems: generateTestData.imageGalleryItems(20),
    processingData: generateTestData.dataProcessingItems(1000)
  };
  
  return (
    <div data-testid="performance-testing-demo">
      <h2>Performance Testing Demo</h2>
      
      <div data-testid="bundle-analysis">
        <h3>Bundle Analysis</h3>
        <p>Total Bundle Size: {(bundleAnalysis.totalSize / 1024).toFixed(2)}KB</p>
        <p>Unused Code: {bundleAnalysis.unusedCode.reduce((sum, file) => sum + file.size, 0) / 1024}KB</p>
        <div>
          <h4>Suggestions:</h4>
          {bundleAnalysis.suggestions.map((suggestion, index) => (
            <p key={index}>• {suggestion}</p>
          ))}
        </div>
      </div>
      
      <div className="tab-navigation">
        {['heavy', 'list', 'gallery', 'processor'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'active' : ''}
            data-testid={`tab-${tab}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="tab-content">
        {activeTab === 'heavy' && (
          <HeavyComponent 
            iterations={500}
            enableProfiling={true}
            budget={budget}
          />
        )}
        
        {activeTab === 'list' && (
          <VirtualizedList
            items={testData.virtualItems}
            height={400}
            itemHeight={50}
            budget={budget}
          />
        )}
        
        {activeTab === 'gallery' && (
          <ImageGallery
            images={testData.imageItems}
            budget={budget}
          />
        )}
        
        {activeTab === 'processor' && (
          <DataProcessor
            data={testData.processingData}
            batchSize={100}
            enableWorker={true}
            budget={budget}
          />
        )}
      </div>
    </div>
  );
};

export default PerformanceTestingDemo;