import React, { useState, useEffect, useRef, useCallback } from 'react';

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

// TODO: Implement Web Vitals monitoring hook
function useWebVitals(config: WebVitalsConfig = {}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  });

  const observerRef = useRef<PerformanceObserver | null>(null);

  const measureLCP = useCallback(() => {
    // TODO: Implement Largest Contentful Paint measurement
    // Use PerformanceObserver to track 'largest-contentful-paint'
    // Calculate LCP value and rating (good: <2.5s, needs-improvement: <4s, poor: >=4s)
    return 0;
  }, []);

  const measureFID = useCallback(() => {
    // TODO: Implement First Input Delay measurement
    // Use PerformanceObserver to track 'first-input'
    // Calculate FID value and rating (good: <100ms, needs-improvement: <300ms, poor: >=300ms)
    return 0;
  }, []);

  const measureCLS = useCallback(() => {
    // TODO: Implement Cumulative Layout Shift measurement
    // Use PerformanceObserver to track 'layout-shift'
    // Calculate CLS value and rating (good: <0.1, needs-improvement: <0.25, poor: >=0.25)
    return 0;
  }, []);

  const measureFCP = useCallback(() => {
    // TODO: Implement First Contentful Paint measurement
    // Use PerformanceObserver to track 'paint'
    // Calculate FCP value and rating (good: <1.8s, needs-improvement: <3s, poor: >=3s)
    return 0;
  }, []);

  const measureTTFB = useCallback(() => {
    // TODO: Implement Time to First Byte measurement
    // Use performance.timing or performance.getEntriesByType('navigation')
    // Calculate TTFB value and rating (good: <800ms, needs-improvement: <1800ms, poor: >=1800ms)
    return 0;
  }, []);

  const startMonitoring = useCallback(() => {
    // TODO: Start all performance observers
    // Initialize PerformanceObserver instances for each metric
    // Handle browser compatibility and feature detection
  }, [measureLCP, measureFID, measureCLS, measureFCP, measureTTFB]);

  const stopMonitoring = useCallback(() => {
    // TODO: Stop all performance observers
    // Disconnect observers and clean up resources
  }, []);

  useEffect(() => {
    // TODO: Auto-start monitoring when component mounts
    return () => {
      // TODO: Clean up on unmount
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

// TODO: Implement WebVitalsReporter component
interface WebVitalsReporterProps {
  onReport?: (metrics: PerformanceMetrics) => void;
  endpoint?: string;
  enableRealTime?: boolean;
}

function WebVitalsReporter({ onReport, endpoint, enableRealTime = true }: WebVitalsReporterProps) {
  // TODO: Implement real-time Web Vitals reporting
  // Use useWebVitals hook to collect metrics
  // Report metrics to analytics endpoint or callback
  // Provide visual dashboard for current metrics
  // Handle offline scenarios and retry logic

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h3 className="text-lg font-semibold mb-4">Web Vitals Monitor</h3>
      
      {/* TODO: Metrics display */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {/* TODO: Add metric cards for LCP, FID, CLS, FCP, TTFB */}
      </div>

      {/* TODO: Controls */}
      <div className="flex space-x-4">
        {/* TODO: Add start/stop monitoring buttons */}
      </div>

      {/* TODO: Real-time chart or visualization */}
      <div className="mt-6">
        {/* TODO: Add metrics visualization */}
      </div>
    </div>
  );
}

// TODO: Implement ImageOptimizer component
interface ImageOptimizerProps {
  images: Array<{
    src: string;
    alt: string;
    priority?: boolean;
  }>;
  onLCPImprovement?: (improvement: number) => void;
}

function ImageOptimizer({ images, onLCPImprovement }: ImageOptimizerProps) {
  // TODO: Implement image optimization for LCP improvement
  // Use intersection observer for lazy loading
  // Implement responsive images with srcset
  // Preload critical images above the fold
  // Use next-gen image formats (WebP, AVIF) with fallbacks
  // Measure and report LCP improvements

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Image Optimization</h3>
      
      {/* TODO: Image grid with optimization features */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div key={index} className="aspect-square bg-gray-200 rounded">
            {/* TODO: Implement optimized image component */}
            {/* Features: lazy loading, responsive images, preloading */}
          </div>
        ))}
      </div>

      {/* TODO: Optimization controls */}
      <div className="flex flex-wrap gap-4">
        {/* TODO: Add toggles for different optimization techniques */}
      </div>
    </div>
  );
}

// TODO: Implement LayoutStabilizer component
interface LayoutStabilizerProps {
  onCLSImprovement?: (improvement: number) => void;
}

function LayoutStabilizer({ onCLSImprovement }: LayoutStabilizerProps) {
  // TODO: Implement layout stability optimizations
  // Reserve space for dynamic content
  // Use CSS aspect-ratio for media
  // Implement smooth loading states
  // Prevent layout shifts from fonts, ads, embeds
  // Measure and report CLS improvements

  const [showDynamicContent, setShowDynamicContent] = useState(false);
  const [enableLayoutReserve, setEnableLayoutReserve] = useState(true);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Layout Stability</h3>
      
      {/* TODO: Layout shift demonstration */}
      <div className="border-2 border-dashed border-gray-300 p-4 min-h-64">
        <h4 className="font-medium mb-4">Dynamic Content Area</h4>
        
        {/* TODO: Implement layout-stable content loading */}
        {/* Show examples of good vs bad layout practices */}
      </div>

      {/* TODO: Controls */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setShowDynamicContent(!showDynamicContent)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showDynamicContent ? 'Hide' : 'Show'} Dynamic Content
        </button>
        
        <button
          onClick={() => setEnableLayoutReserve(!enableLayoutReserve)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          {enableLayoutReserve ? 'Disable' : 'Enable'} Layout Reserve
        </button>
      </div>

      {/* TODO: CLS measurement display */}
      <div className="mt-4 p-4 bg-gray-50 rounded">
        {/* TODO: Show current CLS score and recommendations */}
      </div>
    </div>
  );
}

// TODO: Implement performance budget checker
interface PerformanceBudget {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
}

function usePerformanceBudget(budget: PerformanceBudget) {
  // TODO: Implement performance budget monitoring
  // Compare current metrics against budget
  // Alert when budgets are exceeded
  // Provide recommendations for improvements
  // Track budget compliance over time

  return {
    // TODO: Return budget status and violations
  };
}

// Main demo component
export default function WebVitalsOptimizationDemo() {
  const [selectedTool, setSelectedTool] = useState<'reporter' | 'images' | 'layout'>('reporter');

  // Sample data
  const sampleImages = Array.from({ length: 9 }, (_, i) => ({
    src: "https://picsum.photos/300/300?random=" + i,
    alt: "Sample image " + i,
    priority: i < 3, // First 3 images are above the fold
  }));

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