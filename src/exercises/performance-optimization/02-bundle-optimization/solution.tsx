import React, { useState, Suspense, useEffect, useRef, useCallback } from 'react';

// Bundle performance monitoring utility
interface BundleMetrics {
  initialBundleSize: number;
  loadedChunks: string[];
  chunkSizes: Record<string, number>;
  loadingTimes: Record<string, number>;
  totalTransferSize: number;
}

function useBundlePerformance() {
  const metricsRef = useRef<BundleMetrics>({
    initialBundleSize: 0,
    loadedChunks: [],
    chunkSizes: {},
    loadingTimes: {},
    totalTransferSize: 0,
  });

  const [metrics, setMetrics] = useState<BundleMetrics>(metricsRef.current);

  useEffect(() => {
    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.initiatorType === 'script' && entry.name.includes('chunk')) {
          const chunkName = entry.name.split('/').pop() || 'unknown';
          const transferSize = (entry as PerformanceResourceTiming).transferSize || 0;
          const duration = entry.duration;

          metricsRef.current.loadedChunks.push(chunkName);
          metricsRef.current.chunkSizes[chunkName] = transferSize;
          metricsRef.current.loadingTimes[chunkName] = duration;
          metricsRef.current.totalTransferSize += transferSize;

          setMetrics({ ...metricsRef.current });
          
          console.log(`📦 Chunk loaded: ${chunkName} (${transferSize} bytes, ${duration.toFixed(2)}ms)`);
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, []);

  const trackDynamicImport = useCallback(async (chunkName: string, importPromise: Promise<any>) => {
    const startTime = performance.now();
    
    try {
      const result = await importPromise;
      const loadTime = performance.now() - startTime;
      
      metricsRef.current.loadingTimes[chunkName] = loadTime;
      metricsRef.current.loadedChunks.push(chunkName);
      
      setMetrics({ ...metricsRef.current });
      console.log(`⚡ Dynamic import: ${chunkName} loaded in ${loadTime.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to load chunk: ${chunkName}`, error);
      throw error;
    }
  }, []);

  return { metrics, trackDynamicImport };
}

// Simulated heavy feature component
const HeavyFeatureComponent = React.lazy(() => 
  new Promise(resolve => {
    console.log('🔄 Loading heavy feature component...');
    setTimeout(() => {
      resolve({
        default: function HeavyFeature() {
          return (
            <div className="p-6 bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-lg">
              <h3 className="text-xl font-bold mb-4">Heavy Feature Loaded! 🚀</h3>
              <p>This component simulates a heavy feature that includes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Complex visualizations</li>
                <li>Large third-party libraries</li>
                <li>Advanced data processing</li>
                <li>Rich interactive elements</li>
              </ul>
              <div className="mt-4 p-3 bg-white bg-opacity-20 rounded">
                <p className="text-sm">
                  📊 Simulated bundle size: ~2.5MB | Load time: ~1.8s
                </p>
              </div>
            </div>
          );
        }
      });
    }, 1800); // Simulate loading time
  })
);

// Dynamic feature loading component
interface DynamicImportExampleProps {
  feature: 'charts' | 'editor' | 'analytics' | null;
}

function DynamicImportExample({ feature }: DynamicImportExampleProps) {
  const [loadedFeature, setLoadedFeature] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { trackDynamicImport } = useBundlePerformance();

  const loadChartsModule = useCallback(async () => {
    const startTime = performance.now();
    console.log('📈 Loading charts module...');
    
    // Simulate loading a charts library like Chart.js
    return new Promise(resolve => {
      setTimeout(() => {
        const loadTime = performance.now() - startTime;
        console.log(`✅ Charts module loaded in ${loadTime.toFixed(2)}ms`);
        resolve({
          default: function ChartsFeature() {
            return (
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">📈 Charts Feature</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600">Line Chart</span>
                  </div>
                  <div className="h-32 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600">Bar Chart</span>
                  </div>
                </div>
                <p className="text-sm text-blue-600 mt-3">
                  Simulated Chart.js bundle: ~280KB gzipped
                </p>
              </div>
            );
          }
        });
      }, 800);
    });
  }, []);

  const loadEditorModule = useCallback(async () => {
    const startTime = performance.now();
    console.log('✏️ Loading editor module...');
    
    // Simulate loading an editor like Monaco
    return new Promise(resolve => {
      setTimeout(() => {
        const loadTime = performance.now() - startTime;
        console.log(`✅ Editor module loaded in ${loadTime.toFixed(2)}ms`);
        resolve({
          default: function EditorFeature() {
            return (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">✏️ Code Editor Feature</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
                  <div>function hello() &#123;</div>
                  <div className="ml-4">console.log('Hello, World!');</div>
                  <div>&#125;</div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">Run</button>
                  <button className="px-3 py-1 bg-gray-500 text-white rounded text-sm">Save</button>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Simulated Monaco Editor: ~1.8MB gzipped
                </p>
              </div>
            );
          }
        });
      }, 1200);
    });
  }, []);

  const loadAnalyticsModule = useCallback(async () => {
    const startTime = performance.now();
    console.log('📊 Loading analytics module...');
    
    // Simulate loading analytics dashboard
    return new Promise(resolve => {
      setTimeout(() => {
        const loadTime = performance.now() - startTime;
        console.log(`✅ Analytics module loaded in ${loadTime.toFixed(2)}ms`);
        resolve({
          default: function AnalyticsFeature() {
            return (
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3">📊 Analytics Dashboard</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-100 p-3 rounded text-center">
                    <div className="text-2xl font-bold text-green-800">1,234</div>
                    <div className="text-sm text-green-600">Users</div>
                  </div>
                  <div className="bg-green-100 p-3 rounded text-center">
                    <div className="text-2xl font-bold text-green-800">5,678</div>
                    <div className="text-sm text-green-600">Sessions</div>
                  </div>
                  <div className="bg-green-100 p-3 rounded text-center">
                    <div className="text-2xl font-bold text-green-800">89%</div>
                    <div className="text-sm text-green-600">Retention</div>
                  </div>
                </div>
                <p className="text-sm text-green-600">
                  Simulated analytics bundle: ~450KB gzipped
                </p>
              </div>
            );
          }
        });
      }, 600);
    });
  }, []);

  useEffect(() => {
    if (!feature) {
      setLoadedFeature(null);
      return;
    }

    setLoading(true);
    setError(null);

    const loadFeature = async () => {
      try {
        let module;
        switch (feature) {
          case 'charts':
            module = await trackDynamicImport('charts', loadChartsModule());
            break;
          case 'editor':
            module = await trackDynamicImport('editor', loadEditorModule());
            break;
          case 'analytics':
            module = await trackDynamicImport('analytics', loadAnalyticsModule());
            break;
        }
        setLoadedFeature(() => module.default);
      } catch (err) {
        setError(`Failed to load ${feature} feature`);
      } finally {
        setLoading(false);
      }
    };

    loadFeature();
  }, [feature, trackDynamicImport, loadChartsModule, loadEditorModule, loadAnalyticsModule]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-gray-300 rounded-full animate-spin"></div>
          <span>Loading {feature} feature...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">❌ {error}</p>
      </div>
    );
  }

  if (loadedFeature) {
    const LoadedComponent = loadedFeature;
    return <LoadedComponent />;
  }

  return (
    <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
      <p className="text-gray-600">Select a feature to load dynamically</p>
    </div>
  );
}

// Chunked data grid component
interface DataItem {
  id: number;
  name: string;
  category: string;
  value: number;
  description: string;
}

interface ChunkedDataGridProps {
  data: DataItem[];
  chunkSize: number;
}

function ChunkedDataGrid({ data, chunkSize }: ChunkedDataGridProps) {
  const [loadedChunks, setLoadedChunks] = useState<number>(1);
  const [sortingEnabled, setSortingEnabled] = useState(false);
  const [filteringEnabled, setFilteringEnabled] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadTriggerRef = useRef<HTMLDivElement>(null);

  const visibleData = data.slice(0, loadedChunks * chunkSize);
  const hasMoreData = visibleData.length < data.length;

  const loadNextChunk = useCallback(() => {
    if (hasMoreData) {
      console.log(`📊 Loading chunk ${loadedChunks + 1}...`);
      setLoadedChunks(prev => prev + 1);
    }
  }, [hasMoreData, loadedChunks]);

  const loadSortingFeature = useCallback(async () => {
    console.log('🔄 Loading sorting feature...');
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('✅ Sorting feature loaded');
        setSortingEnabled(true);
        resolve(true);
      }, 500);
    });
  }, []);

  const loadFilteringFeature = useCallback(async () => {
    console.log('🔄 Loading filtering feature...');
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('✅ Filtering feature loaded');
        setFilteringEnabled(true);
        resolve(true);
      }, 500);
    });
  }, []);

  // Set up intersection observer for automatic loading
  useEffect(() => {
    if (!loadTriggerRef.current || !hasMoreData) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextChunk();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadTriggerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadNextChunk, hasMoreData]);

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 mb-4">
        <button
          onClick={loadSortingFeature}
          disabled={sortingEnabled}
          className="px-3 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {sortingEnabled ? '✅ Sorting Loaded' : 'Load Sorting'}
        </button>
        <button
          onClick={loadFilteringFeature}
          disabled={filteringEnabled}
          className="px-3 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
        >
          {filteringEnabled ? '✅ Filtering Loaded' : 'Load Filtering'}
        </button>
      </div>

      <div className="text-sm text-gray-600 mb-2">
        Showing {visibleData.length} of {data.length} items 
        (Loaded chunks: {loadedChunks}, Chunk size: {chunkSize})
      </div>

      <div className="grid gap-2">
        {visibleData.map(item => (
          <div key={item.id} className="p-3 bg-white border rounded-lg shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-gray-600">{item.category}</p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
              <div className="text-right">
                <div className="font-semibold">${item.value}</div>
                <div className="text-xs text-gray-500">ID: {item.id}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMoreData && (
        <div
          ref={loadTriggerRef}
          className="p-4 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded"
        >
          Scroll to load more data...
        </div>
      )}

      {!hasMoreData && (
        <div className="p-4 text-center text-gray-500">
          ✅ All data loaded ({data.length} items)
        </div>
      )}
    </div>
  );
}

// Route-level lazy loading components
const DashboardRoute = React.lazy(() => 
  new Promise(resolve => {
    console.log('📊 Loading Dashboard route...');
    setTimeout(() => {
      resolve({
        default: function Dashboard() {
          return (
            <div className="p-6 bg-blue-50 rounded-lg">
              <h2 className="text-xl font-bold text-blue-800 mb-4">📊 Dashboard</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-blue-600">125</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-green-600">$12.5K</div>
                  <div className="text-sm text-gray-600">Revenue</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-purple-600">89%</div>
                  <div className="text-sm text-gray-600">Performance</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-orange-600">3.2s</div>
                  <div className="text-sm text-gray-600">Load Time</div>
                </div>
              </div>
            </div>
          );
        }
      });
    }, 600);
  })
);

const SettingsRoute = React.lazy(() => 
  new Promise(resolve => {
    console.log('⚙️ Loading Settings route...');
    setTimeout(() => {
      resolve({
        default: function Settings() {
          return (
            <div className="p-6 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">⚙️ Settings</h2>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded border">
                  <h3 className="font-semibold mb-2">Performance Settings</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      Enable code splitting
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      Preload critical routes
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Aggressive chunking
                    </label>
                  </div>
                </div>
              </div>
            </div>
          );
        }
      });
    }, 400);
  })
);

// Resource preloader hook
function useResourcePreloader() {
  const preloadedRoutes = useRef<Set<string>>(new Set());

  const preloadRoute = useCallback((route: string) => {
    if (preloadedRoutes.current.has(route)) return;

    console.log(`🔄 Preloading route: ${route}`);
    preloadedRoutes.current.add(route);

    // Simulate route preloading
    switch (route) {
      case 'dashboard':
        import('./dashboard').catch(() => console.log('Dashboard preload failed'));
        break;
      case 'settings':
        import('./settings').catch(() => console.log('Settings preload failed'));
        break;
    }
  }, []);

  const preloadFeature = useCallback((feature: string) => {
    console.log(`🔄 Preloading feature: ${feature}`);
    // Implement feature preloading logic
  }, []);

  return { preloadRoute, preloadFeature };
}

// Performance monitoring dashboard
function PerformanceDashboard() {
  const { metrics } = useBundlePerformance();

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-semibold text-gray-800 mb-3">📊 Bundle Performance Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-3 rounded border">
          <div className="text-sm text-gray-600">Loaded Chunks</div>
          <div className="text-lg font-semibold">{metrics.loadedChunks.length}</div>
        </div>
        <div className="bg-white p-3 rounded border">
          <div className="text-sm text-gray-600">Total Transfer</div>
          <div className="text-lg font-semibold">
            {(metrics.totalTransferSize / 1024).toFixed(1)}KB
          </div>
        </div>
        <div className="bg-white p-3 rounded border">
          <div className="text-sm text-gray-600">Avg Load Time</div>
          <div className="text-lg font-semibold">
            {Object.values(metrics.loadingTimes).length > 0
              ? (Object.values(metrics.loadingTimes).reduce((a, b) => a + b, 0) / 
                 Object.values(metrics.loadingTimes).length).toFixed(0)
              : '0'}ms
          </div>
        </div>
      </div>

      {metrics.loadedChunks.length > 0 && (
        <div className="bg-white p-3 rounded border">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Loaded Chunks</h4>
          <div className="space-y-1">
            {metrics.loadedChunks.map((chunk, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-gray-600">{chunk}</span>
                <span className="text-gray-500">
                  {metrics.loadingTimes[chunk]?.toFixed(0)}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main demo component
export default function BundleOptimizationDemo() {
  const [selectedFeature, setSelectedFeature] = useState<'charts' | 'editor' | 'analytics' | null>(null);
  const [currentRoute, setCurrentRoute] = useState<'dashboard' | 'settings'>('dashboard');
  const [showHeavyFeature, setShowHeavyFeature] = useState(false);
  const [gridChunkSize, setGridChunkSize] = useState(10);

  const { preloadRoute } = useResourcePreloader();

  // Sample data for the grid
  const gridData: DataItem[] = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    category: ['Electronics', 'Books', 'Clothing', 'Home'][i % 4],
    value: Math.floor(Math.random() * 1000) + 50,
    description: `Description for item ${i + 1} with various details`,
  }));

  // Preload routes on hover
  const handleRouteHover = (route: 'dashboard' | 'settings') => {
    preloadRoute(route);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Bundle Optimization & Code Splitting
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            This demo showcases advanced bundle optimization techniques including lazy loading,
            dynamic imports, and progressive enhancement. Monitor the Network tab to see chunked loading.
          </p>
        </div>

        {/* Performance monitoring section */}
        <PerformanceDashboard />

        {/* Route-level code splitting demo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Route-Level Code Splitting</h2>
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setCurrentRoute('dashboard')}
              onMouseEnter={() => handleRouteHover('dashboard')}
              className={`px-4 py-2 rounded ${
                currentRoute === 'dashboard'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentRoute('settings')}
              onMouseEnter={() => handleRouteHover('settings')}
              className={`px-4 py-2 rounded ${
                currentRoute === 'settings'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Settings
            </button>
          </div>
          
          <Suspense fallback={
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Loading route...</p>
            </div>
          }>
            {currentRoute === 'dashboard' ? <DashboardRoute /> : <SettingsRoute />}
          </Suspense>
        </div>

        {/* Dynamic feature loading demo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dynamic Feature Loading</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {(['charts', 'editor', 'analytics'] as const).map(feature => (
              <button
                key={feature}
                onClick={() => setSelectedFeature(selectedFeature === feature ? null : feature)}
                className={`px-4 py-2 rounded capitalize ${
                  selectedFeature === feature
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {feature}
              </button>
            ))}
          </div>
          
          <DynamicImportExample feature={selectedFeature} />
        </div>

        {/* Heavy feature demo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Lazy-Loaded Heavy Feature</h2>
          <p className="text-gray-600 mb-4">
            This simulates loading a heavy feature with large dependencies (2.5MB bundle).
          </p>
          <button
            onClick={() => setShowHeavyFeature(!showHeavyFeature)}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            {showHeavyFeature ? 'Hide' : 'Load'} Heavy Feature
          </button>
          
          {showHeavyFeature && (
            <div className="mt-6">
              <Suspense fallback={
                <div className="p-8 text-center border-2 border-dashed border-purple-300 rounded-lg">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <p className="mt-2 text-purple-600">Loading heavy feature...</p>
                </div>
              }>
                <HeavyFeatureComponent />
              </Suspense>
            </div>
          )}
        </div>

        {/* Chunked data grid demo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Progressive Data Loading</h2>
          <p className="text-gray-600 mb-4">
            This grid loads data progressively and features on-demand. Scroll to trigger automatic loading.
          </p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chunk Size: {gridChunkSize}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={gridChunkSize}
              onChange={(e) => setGridChunkSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <ChunkedDataGrid data={gridData} chunkSize={gridChunkSize} />
        </div>
      </div>
    </div>
  );
}