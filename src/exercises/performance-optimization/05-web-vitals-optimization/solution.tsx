import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Web Vitals types
interface WebVital {
  name: 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  id: string;
}

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
}

interface WebVitalsConfig {
  reportAllChanges?: boolean;
  onMetric?: (metric: WebVital) => void;
  debug?: boolean;
}

// Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

// Helper function to calculate metric rating
function getMetricRating(name: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// Generate unique ID for metrics
function generateMetricId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Web Vitals monitoring hook
function useWebVitals(config: WebVitalsConfig = {}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  });

  const observersRef = useRef<PerformanceObserver[]>([]);
  const clsValueRef = useRef(0);
  const isMonitoringRef = useRef(false);

  const reportMetric = useCallback((metric: WebVital) => {
    if (config.debug) {
      console.log('Web Vital reported:', metric);
    }
    config.onMetric?.(metric);
  }, [config]);

  const measureLCP = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      
      if (lastEntry) {
        const value = lastEntry.startTime;
        const metric: WebVital = {
          name: 'LCP',
          value,
          rating: getMetricRating('LCP', value),
          timestamp: Date.now(),
          id: generateMetricId(),
        };

        setMetrics(prev => ({ ...prev, lcp: value }));
        reportMetric(metric);
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      observersRef.current.push(observer);
    } catch (error) {
      console.warn('LCP observation not supported:', error);
    }
  }, [reportMetric]);

  const measureFID = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry: any) => {
        const value = entry.processingStart - entry.startTime;
        const metric: WebVital = {
          name: 'FID',
          value,
          rating: getMetricRating('FID', value),
          timestamp: Date.now(),
          id: generateMetricId(),
        };

        setMetrics(prev => ({ ...prev, fid: value }));
        reportMetric(metric);
      });
    });

    try {
      observer.observe({ entryTypes: ['first-input'] });
      observersRef.current.push(observer);
    } catch (error) {
      console.warn('FID observation not supported:', error);
    }
  }, [reportMetric]);

  const measureCLS = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValueRef.current += entry.value;
          
          const metric: WebVital = {
            name: 'CLS',
            value: clsValueRef.current,
            rating: getMetricRating('CLS', clsValueRef.current),
            timestamp: Date.now(),
            id: generateMetricId(),
          };

          setMetrics(prev => ({ ...prev, cls: clsValueRef.current }));
          
          if (config.reportAllChanges) {
            reportMetric(metric);
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['layout-shift'] });
      observersRef.current.push(observer);
    } catch (error) {
      console.warn('CLS observation not supported:', error);
    }
  }, [reportMetric, config.reportAllChanges]);

  const measureFCP = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry: any) => {
        if (entry.name === 'first-contentful-paint') {
          const value = entry.startTime;
          const metric: WebVital = {
            name: 'FCP',
            value,
            rating: getMetricRating('FCP', value),
            timestamp: Date.now(),
            id: generateMetricId(),
          };

          setMetrics(prev => ({ ...prev, fcp: value }));
          reportMetric(metric);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
      observersRef.current.push(observer);
    } catch (error) {
      console.warn('FCP observation not supported:', error);
    }
  }, [reportMetric]);

  const measureTTFB = useCallback(() => {
    const navigationEntries = performance.getEntriesByType('navigation');
    
    if (navigationEntries.length > 0) {
      const entry = navigationEntries[0] as PerformanceNavigationTiming;
      const value = entry.responseStart - entry.requestStart;
      
      const metric: WebVital = {
        name: 'TTFB',
        value,
        rating: getMetricRating('TTFB', value),
        timestamp: Date.now(),
        id: generateMetricId(),
      };

      setMetrics(prev => ({ ...prev, ttfb: value }));
      reportMetric(metric);
    }
  }, [reportMetric]);

  const startMonitoring = useCallback(() => {
    if (isMonitoringRef.current) return;
    
    isMonitoringRef.current = true;
    clsValueRef.current = 0;
    
    measureLCP();
    measureFID();
    measureCLS();
    measureFCP();
    measureTTFB();
  }, [measureLCP, measureFID, measureCLS, measureFCP, measureTTFB]);

  const stopMonitoring = useCallback(() => {
    isMonitoringRef.current = false;
    
    observersRef.current.forEach(observer => {
      observer.disconnect();
    });
    observersRef.current = [];
    
    // Report final CLS value
    if (clsValueRef.current > 0) {
      const metric: WebVital = {
        name: 'CLS',
        value: clsValueRef.current,
        rating: getMetricRating('CLS', clsValueRef.current),
        timestamp: Date.now(),
        id: generateMetricId(),
      };
      reportMetric(metric);
    }
  }, [reportMetric]);

  useEffect(() => {
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    metrics,
    startMonitoring,
    stopMonitoring,
    measureLCP,
    measureFID,
    measureCLS,
    measureFCP,
    measureTTFB,
  };
}

// Web Vitals Reporter component
interface WebVitalsReporterProps {
  onReport?: (metrics: PerformanceMetrics) => void;
  endpoint?: string;
  enableRealTime?: boolean;
}

function WebVitalsReporter({ onReport, endpoint, enableRealTime = true }: WebVitalsReporterProps) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [reportCount, setReportCount] = useState(0);
  const [lastReportTime, setLastReportTime] = useState<Date | null>(null);

  const handleMetric = useCallback((metric: WebVital) => {
    setReportCount(prev => prev + 1);
    setLastReportTime(new Date());
    
    // Report to callback
    if (onReport) {
      // Convert single metric to full metrics object
      const fullMetrics: PerformanceMetrics = {
        lcp: metric.name === 'LCP' ? metric.value : null,
        fid: metric.name === 'FID' ? metric.value : null,
        cls: metric.name === 'CLS' ? metric.value : null,
        fcp: metric.name === 'FCP' ? metric.value : null,
        ttfb: metric.name === 'TTFB' ? metric.value : null,
      };
      onReport(fullMetrics);
    }

    // Report to endpoint
    if (endpoint) {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      }).catch(error => {
        console.error('Failed to report metric to endpoint:', error);
      });
    }
  }, [onReport, endpoint]);

  const { metrics, startMonitoring, stopMonitoring } = useWebVitals({
    reportAllChanges: enableRealTime,
    onMetric: handleMetric,
    debug: true,
  });

  const handleStartMonitoring = useCallback(() => {
    setIsMonitoring(true);
    startMonitoring();
  }, [startMonitoring]);

  const handleStopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    stopMonitoring();
  }, [stopMonitoring]);

  const getMetricColor = (name: string, value: number | null) => {
    if (value === null) return 'bg-gray-100 text-gray-400';
    const rating = getMetricRating(name as keyof typeof THRESHOLDS, value);
    switch (rating) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'needs-improvement': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-400';
    }
  };

  const formatMetricValue = (name: string, value: number | null) => {
    if (value === null) return 'N/A';
    if (name === 'CLS') return value.toFixed(3);
    return Math.round(value) + 'ms';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h3 className="text-lg font-semibold mb-4">Web Vitals Monitor</h3>
      
      {/* Metrics display */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {Object.entries(metrics).map(([key, value]) => (
          <div
            key={key}
            className={"p-4 rounded-lg border " + getMetricColor(key.toUpperCase(), value)}
          >
            <div className="text-xs font-medium uppercase tracking-wide mb-1">
              {key.toUpperCase()}
            </div>
            <div className="text-xl font-bold">
              {formatMetricValue(key.toUpperCase(), value)}
            </div>
            <div className="text-xs mt-1">
              {value !== null ? getMetricRating(key.toUpperCase() as keyof typeof THRESHOLDS, value) : 'pending'}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
          className={"px-4 py-2 rounded font-medium " + (
            isMonitoring 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-green-500 text-white hover:bg-green-600'
          )}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
        
        <div className="flex items-center text-sm text-gray-600">
          <span>Reports: {reportCount}</span>
          {lastReportTime && (
            <span className="ml-4">
              Last: {lastReportTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Monitoring Status:</span>
          <div className={"flex items-center space-x-2 " + (isMonitoring ? 'text-green-600' : 'text-gray-400')}>
            <div className={"w-2 h-2 rounded-full " + (isMonitoring ? 'bg-green-500' : 'bg-gray-400')}></div>
            <span className="text-sm">{isMonitoring ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
        
        {enableRealTime && (
          <div className="mt-2 text-xs text-gray-500">
            Real-time reporting enabled • Endpoint: {endpoint || 'callback only'}
          </div>
        )}
      </div>
    </div>
  );
}

// Image Optimizer component
interface ImageOptimizerProps {
  images: Array<{
    src: string;
    alt: string;
    priority?: boolean;
  }>;
  onLCPImprovement?: (improvement: number) => void;
}

function ImageOptimizer({ images, onLCPImprovement }: ImageOptimizerProps) {
  const [lazyLoadEnabled, setLazyLoadEnabled] = useState(true);
  const [preloadEnabled, setPreloadEnabled] = useState(true);
  const [webpEnabled, setWebpEnabled] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (lazyLoadEnabled) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const dataSrc = img.getAttribute('data-src');
              if (dataSrc) {
                img.src = dataSrc;
                img.removeAttribute('data-src');
                observerRef.current?.unobserve(img);
              }
            }
          });
        },
        { rootMargin: '50px' }
      );
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazyLoadEnabled]);

  useEffect(() => {
    if (preloadEnabled) {
      // Preload critical images (above the fold)
      images
        .filter(img => img.priority)
        .forEach(img => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = img.src;
          link.as = 'image';
          document.head.appendChild(link);
        });
    }
  }, [images, preloadEnabled]);

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set([...prev, index]));
    
    if (onLCPImprovement && index < 3) { // Assume first 3 images affect LCP
      onLCPImprovement(Math.random() * 500 + 200); // Simulated improvement
    }
  }, [onLCPImprovement]);

  const getOptimizedSrc = useCallback((src: string) => {
    if (webpEnabled && 'WebP' in window) {
      return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    return src;
  }, [webpEnabled]);

  const OptimizedImage = React.memo(({ image, index }: { image: any; index: number }) => {
    const [aspectRatio, setAspectRatio] = useState('1');
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      if (imgRef.current && observerRef.current && lazyLoadEnabled && !image.priority) {
        observerRef.current.observe(imgRef.current);
      }
    }, [image.priority]);

    const handleLoad = () => {
      handleImageLoad(index);
      if (imgRef.current) {
        const ratio = imgRef.current.naturalWidth / imgRef.current.naturalHeight;
        setAspectRatio(ratio.toString());
      }
    };

    const isLoaded = loadedImages.has(index);
    const shouldLazyLoad = lazyLoadEnabled && !image.priority;

    return (
      <div 
        className="relative overflow-hidden rounded-lg bg-gray-200"
        style={{ aspectRatio }}
      >
        <img
          ref={imgRef}
          src={shouldLazyLoad ? undefined : getOptimizedSrc(image.src)}
          data-src={shouldLazyLoad ? getOptimizedSrc(image.src) : undefined}
          alt={image.alt}
          className={"w-full h-full object-cover transition-opacity duration-300 " + (
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={handleLoad}
          loading={image.priority ? 'eager' : 'lazy'}
        />
        
        {/* Loading placeholder */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        )}
        
        {/* Priority indicator */}
        {image.priority && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
            Priority
          </div>
        )}
      </div>
    );
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Image Optimization</h3>
      
      {/* Image grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <OptimizedImage key={index} image={image} index={index} />
        ))}
      </div>

      {/* Optimization controls */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={lazyLoadEnabled}
            onChange={(e) => setLazyLoadEnabled(e.target.checked)}
            className="rounded"
          />
          <span>Lazy Loading</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={preloadEnabled}
            onChange={(e) => setPreloadEnabled(e.target.checked)}
            className="rounded"
          />
          <span>Preload Critical Images</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={webpEnabled}
            onChange={(e) => setWebpEnabled(e.target.checked)}
            className="rounded"
          />
          <span>WebP Format</span>
        </label>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 p-4 rounded">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Images:</span> {images.length}
          </div>
          <div>
            <span className="font-medium">Loaded:</span> {loadedImages.size}
          </div>
          <div>
            <span className="font-medium">Priority:</span> {images.filter(img => img.priority).length}
          </div>
          <div>
            <span className="font-medium">Optimizations:</span> {[lazyLoadEnabled, preloadEnabled, webpEnabled].filter(Boolean).length}/3
          </div>
        </div>
      </div>
    </div>
  );
}

// Layout Stabilizer component
interface LayoutStabilizerProps {
  onCLSImprovement?: (improvement: number) => void;
}

function LayoutStabilizer({ onCLSImprovement }: LayoutStabilizerProps) {
  const [showDynamicContent, setShowDynamicContent] = useState(false);
  const [enableLayoutReserve, setEnableLayoutReserve] = useState(true);
  const [clsScore, setCLSScore] = useState(0);
  const [improvements, setImprovements] = useState<number[]>([]);

  const clsObserverRef = useRef<PerformanceObserver | null>(null);
  const clsValueRef = useRef(0);

  useEffect(() => {
    if ('PerformanceObserver' in window) {
      clsObserverRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValueRef.current += entry.value;
            setCLSScore(clsValueRef.current);
          }
        });
      });

      try {
        clsObserverRef.current.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('CLS observation not supported:', error);
      }
    }

    return () => {
      clsObserverRef.current?.disconnect();
    };
  }, []);

  const handleShowDynamicContent = () => {
    const oldScore = clsValueRef.current;
    setShowDynamicContent(!showDynamicContent);
    
    // Simulate measuring improvement after layout stabilization
    setTimeout(() => {
      const improvement = Math.max(0, oldScore - clsValueRef.current);
      if (improvement > 0) {
        setImprovements(prev => [...prev, improvement]);
        onCLSImprovement?.(improvement);
      }
    }, 1000);
  };

  const DynamicContent = React.memo(() => (
    <div className={enableLayoutReserve ? "min-h-32" : ""}>
      {showDynamicContent && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded animate-fade-in">
          <h4 className="font-medium text-blue-800 mb-2">Dynamic Content Loaded</h4>
          <p className="text-sm text-blue-600">
            This content was loaded dynamically. Notice how layout reservation 
            {enableLayoutReserve ? ' prevents' : ' causes'} layout shifts.
          </p>
          <div className="mt-3 flex space-x-2">
            <div className="w-12 h-12 bg-blue-200 rounded"></div>
            <div className="w-12 h-12 bg-blue-200 rounded"></div>
            <div className="w-12 h-12 bg-blue-200 rounded"></div>
          </div>
        </div>
      )}
    </div>
  ));

  const SkeletonLoader = () => (
    <div className="p-4 border rounded animate-pulse">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
      <div className="flex space-x-2">
        <div className="w-12 h-12 bg-gray-200 rounded"></div>
        <div className="w-12 h-12 bg-gray-200 rounded"></div>
        <div className="w-12 h-12 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Layout Stability</h3>
      
      {/* Layout shift demonstration */}
      <div className="border-2 border-dashed border-gray-300 p-4 min-h-64">
        <h4 className="font-medium mb-4">Dynamic Content Area</h4>
        
        {/* Static content that should not shift */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            This is static content that should remain stable when dynamic content loads below.
          </p>
        </div>

        {/* Dynamic content with optional layout reservation */}
        <DynamicContent />

        {/* Additional static content */}
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            This content should also remain stable and not shift when content above changes.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleShowDynamicContent}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showDynamicContent ? 'Hide' : 'Show'} Dynamic Content
        </button>
        
        <button
          onClick={() => setEnableLayoutReserve(!enableLayoutReserve)}
          className={"px-4 py-2 rounded hover:opacity-90 " + (
            enableLayoutReserve 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          )}
        >
          {enableLayoutReserve ? 'Disable' : 'Enable'} Layout Reserve
        </button>
      </div>

      {/* CLS measurement display */}
      <div className="mt-4 p-4 bg-gray-50 rounded">
        <h4 className="font-medium mb-2">Cumulative Layout Shift (CLS)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-gray-600">Current Score:</span>
            <div className={"text-2xl font-bold " + (
              clsScore <= 0.1 ? 'text-green-600' : 
              clsScore <= 0.25 ? 'text-yellow-600' : 'text-red-600'
            )}>
              {clsScore.toFixed(3)}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Rating:</span>
            <div className="text-lg font-medium">
              {clsScore <= 0.1 ? 'Good' : clsScore <= 0.25 ? 'Needs Improvement' : 'Poor'}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Improvements:</span>
            <div className="text-lg font-medium text-green-600">
              {improvements.length} detected
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          <p>• Good: ≤ 0.1 • Needs Improvement: ≤ 0.25 • Poor: > 0.25</p>
          <p>• Layout reservation {enableLayoutReserve ? 'helps prevent' : 'is disabled, may cause'} layout shifts</p>
        </div>
      </div>
    </div>
  );
}

// Performance budget checker
interface PerformanceBudget {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
}

function usePerformanceBudget(budget: PerformanceBudget) {
  const [violations, setViolations] = useState<Array<{
    metric: string;
    current: number;
    budget: number;
    severity: 'warning' | 'error';
  }>>([]);

  const checkBudget = useCallback((metrics: PerformanceMetrics) => {
    const newViolations: typeof violations = [];

    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== null) {
        const budgetValue = budget[key as keyof PerformanceBudget];
        if (value > budgetValue) {
          const severity = value > budgetValue * 1.5 ? 'error' : 'warning';
          newViolations.push({
            metric: key.toUpperCase(),
            current: value,
            budget: budgetValue,
            severity,
          });
        }
      }
    });

    setViolations(newViolations);
  }, [budget]);

  return { violations, checkBudget };
}

// Main demo component
export default function WebVitalsOptimizationDemo() {
  const [selectedTool, setSelectedTool] = useState<'reporter' | 'images' | 'layout'>('reporter');

  // Sample data
  const sampleImages = useMemo(() => 
    Array.from({ length: 9 }, (_, i) => ({
      src: "https://picsum.photos/300/300?random=" + i,
      alt: "Sample image " + i,
      priority: i < 3, // First 3 images are above the fold
    }))
  , []);

  const handleMetricsReport = useCallback((metrics: PerformanceMetrics) => {
    console.log('Web Vitals metrics:', metrics);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Web Vitals Optimization
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Master Core Web Vitals measurement and optimization for production applications.
            Monitor LCP, FID, CLS and implement real-world performance improvements.
          </p>
        </div>

        {/* Tool selection */}
        <div className="flex justify-center space-x-4">
          {[
            { key: 'reporter', label: 'Web Vitals Reporter' },
            { key: 'images', label: 'Image Optimizer' },
            { key: 'layout', label: 'Layout Stabilizer' },
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
            {selectedTool === 'reporter' && (
              <WebVitalsReporter
                onReport={handleMetricsReport}
                endpoint="/api/metrics"
                enableRealTime={true}
              />
            )}

            {selectedTool === 'images' && (
              <ImageOptimizer
                images={sampleImages}
                onLCPImprovement={(improvement) => {
                  console.log('LCP improved by:', improvement, 'ms');
                }}
              />
            )}

            {selectedTool === 'layout' && (
              <LayoutStabilizer
                onCLSImprovement={(improvement) => {
                  console.log('CLS improved by:', improvement);
                }}
              />
            )}
          </div>
        </div>

        {/* Performance tips */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Web Vitals Optimization Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Optimize LCP by improving server response times and preloading critical resources</li>
              <li>• Reduce FID by minimizing main thread blocking and using web workers</li>
              <li>• Improve CLS by reserving space for dynamic content and avoiding layout shifts</li>
              <li>• Monitor metrics in production with Performance Observer API</li>
            </ul>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Use resource hints (preload, prefetch, preconnect) strategically</li>
              <li>• Implement progressive image loading with proper aspect ratios</li>
              <li>• Set performance budgets and monitor compliance continuously</li>
              <li>• Test on real devices and network conditions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}