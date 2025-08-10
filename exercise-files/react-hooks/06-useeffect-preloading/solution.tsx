// useEffect Data Preloading & Optimization - SOLUTION
// Master advanced useEffect patterns for data preloading and performance optimization

import { useState, useEffect, useRef, useCallback, RefObject } from 'react';

// Define types for preloading system
type PreloadItem<T = any> = {
  id: string;
  url: string;
  priority: number; // Higher = more important
  loader: () => Promise<T>;
  dependencies?: string[]; // IDs of items that must load first
};

type LoadingState<T = any> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
};

type PreloadCache<T = any> = Map<string, {
  promise: Promise<T>;
  data?: T;
  timestamp: number;
  abortController?: AbortController;
}>;

type RouteData = {
  id: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
};

// Mock API functions
const mockFetch = async <T = any>(url: string, delay = 1000): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) { // 90% success rate
        resolve({
          id: url.split('/').pop() || 'unknown',
          title: `Page ${url}`,
          content: `Content for ${url}`,
          url,
          data: `Data from ${url}`,
          timestamp: Date.now(),
          metadata: { loadTime: delay },
        } as T);
      } else {
        reject(new Error(`Failed to fetch ${url}`));
      }
    }, delay);
  });
};

const mockImageFetch = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

// Create useRoutePreloader custom hook
function useRoutePreloader() {
  // Create ref for preload cache
  const cacheRef = useRef<PreloadCache<RouteData>>(new Map());
  // Create ref for abort controllers
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  
  const preloadRoute = useCallback(async (route: string): Promise<RouteData> => {
    const cache = cacheRef.current;
    
    // Check if already preloading or preloaded
    const cached = cache.get(route);
    if (cached) {
      return cached.promise;
    }
    
    // Create AbortController for cancellation
    const abortController = new AbortController();
    abortControllersRef.current.set(route, abortController);
    
    // Start preload request
    const promise = mockFetch<RouteData>,(route, 800 + Math.random() * 1200);
    
    // Store promise in cache
    cache.set(route, {
      promise,
      timestamp: Date.now(),
      abortController,
    });
    
    try {
      const data = await promise;
      
      // Update cache with resolved data
      cache.set(route, {
        promise,
        data,
        timestamp: Date.now(),
      });
      
      // Clean up abort controller
      abortControllersRef.current.delete(route);
      
      return data;
    } catch (error) {
      // Remove failed request from cache
      cache.delete(route);
      abortControllersRef.current.delete(route);
      throw error;
    }
  }, []);
  
  const getPreloadedData = useCallback((route: string): RouteData | null => {
    // Get preloaded data from cache
    const cached = cacheRef.current.get(route);
    
    // Return data if available
    return cached?.data || null;
  }, []);
  
  const clearPreloadCache = useCallback(() => {
    // Abort any pending requests
    abortControllersRef.current.forEach(controller => {
      controller.abort();
    });
    abortControllersRef.current.clear();
    
    // Clear all cached preloads
    cacheRef.current.clear();
  }, []);
  
  const isPreloaded = useCallback((route: string): boolean => {
    const cached = cacheRef.current.get(route);
    return Boolean(cached?.data);
  }, []);
  
  const isPreloading = useCallback((route: string): boolean => {
    const cached = cacheRef.current.get(route);
    return Boolean(cached && !cached.data);
  }, []);
  
  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      clearPreloadCache();
    };
  }, [clearPreloadCache]);
  
  return {
    preloadRoute,
    getPreloadedData,
    clearPreloadCache,
    isPreloaded,
    isPreloading,
  };
}

// Create useIntersectionObserver for lazy loading
function useIntersectionObserver(
  target: RefObject<Element>,
  onIntersect: () => void,
  options: IntersectionObserverInit = {}
) {
  const observerRef = useRef<IntersectionObserver>,();
  
  useEffect(() => {
    if (!target.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onIntersect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );
    
    observer.observe(target.current);
    observerRef.current = observer;
    
    return () => {
      observer.disconnect();
    };
  }, [target, onIntersect, options]);
  
  return observerRef.current;
}

// Create useImagePreloader for image optimization
function useImagePreloader() {
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const preloadPromisesRef = useRef<Map<string, Promise<string>>>(new Map());
  
  const preloadImage = useCallback(async (url: string): Promise<string> => {
    // Check if already preloaded
    if (preloadedImages.has(url)) {
      return url;
    }
    
    // Check if already preloading
    const existingPromise = preloadPromisesRef.current.get(url);
    if (existingPromise) {
      return existingPromise;
    }
    
    // Start preloading
    const promise = mockImageFetch(url);
    preloadPromisesRef.current.set(url, promise);
    
    try {
      const result = await promise;
      setPreloadedImages(prev => new Set([...prev, url]));
      preloadPromisesRef.current.delete(url);
      return result;
    } catch (error) {
      preloadPromisesRef.current.delete(url);
      throw error;
    }
  }, [preloadedImages]);
  
  const preloadImages = useCallback(async (urls: string[]): Promise<string[]> => {
    const promises = urls.map(preloadImage);
    return Promise.all(promises);
  }, [preloadImage]);
  
  const isImagePreloaded = useCallback((url: string): boolean => {
    return preloadedImages.has(url);
  }, [preloadedImages]);
  
  return {
    preloadImage,
    preloadImages,
    isImagePreloaded,
    preloadedImages: Array.from(preloadedImages),
  };
}

// Create useBackgroundSync for data freshness
function useBackgroundSync<T>,(
  fetchFn: () => Promise<T>,
  interval: number = 30000,
  enabled: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  
  const sync = useCallback(async (): Promise<T> => {
    try {
      const result = await fetchFn();
      setData(result);
      setLastSync(new Date());
      return result;
    } catch (error) {
      console.error('Background sync failed:', error);
      throw error;
    }
  }, [fetchFn]);
  
  useEffect(() => {
    if (!enabled) return;
    
    // Initial sync
    sync();
    
    // Setup interval for background sync
    intervalRef.current = setInterval(sync, interval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sync, interval, enabled]);
  
  return {
    data,
    lastSync,
    sync,
  };
}

// Create usePriorityQueue for managing load priorities
function usePriorityQueue<T extends { priority: number }>() {
  const [queue, setQueue] = useState<T[]>([]);
  const processingRef = useRef(false);
  
  const addToQueue = useCallback((item: T) => {
    setQueue(prev => {
      const newQueue = [...prev, item];
      // Sort by priority (higher first)
      newQueue.sort((a, b) => b.priority - a.priority);
      return newQueue;
    });
  }, []);
  
  const processNext = useCallback(async (processor: (item: T) => Promise<void>) => {
    if (processingRef.current) return;
    
    setQueue(prev => {
      if (prev.length === 0) return prev;
      
      const [nextItem, ...rest] = prev;
      
      processingRef.current = true;
      
      processor(nextItem).finally(() => {
        processingRef.current = false;
      });
      
      return rest;
    });
  }, []);
  
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);
  
  return {
    queue,
    addToQueue,
    processNext,
    clearQueue,
    hasItems: queue.length > 0,
  };
}

// Example Components

// Navigation component with route preloading
function SmartNavigation() {
  const { preloadRoute, getPreloadedData, isPreloaded, isPreloading } = useRoutePreloader();
  const [currentRoute, setCurrentRoute] = useState('/home');
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const routes = [
    '/home',
    '/about',
    '/products',
    '/services',
    '/contact',
  ];
  
  const handleMouseEnter = useCallback((route: string) => {
    // Preload on hover
    if (!isPreloaded(route) && !isPreloading(route)) {
      preloadRoute(route).catch(console.error);
    }
  }, [preloadRoute, isPreloaded, isPreloading]);
  
  const handleNavigation = useCallback(async (route: string) => {
    setCurrentRoute(route);
    
    // Check if data is already preloaded
    const preloadedData = getPreloadedData(route);
    if (preloadedData) {
      setRouteData(preloadedData);
      return;
    }
    
    // Load data if not preloaded
    setLoading(true);
    try {
      const data = await preloadRoute(route);
      setRouteData(data);
    } catch (error) {
      console.error('Navigation failed:', error);
    } finally {
      setLoading(false);
    }
  }, [preloadRoute, getPreloadedData]);
  
  // Preload likely next routes
  useEffect(() => {
    const currentIndex = routes.indexOf(currentRoute);
    const nextRoutes = [
      routes[currentIndex + 1],
      routes[currentIndex - 1],
    ].filter(Boolean);
    
    // Preload adjacent routes with delay
    nextRoutes.forEach((route, index) => {
      setTimeout(() => {
        if (!isPreloaded(route) && !isPreloading(route)) {
          preloadRoute(route).catch(console.error);
        }
      }, (index + 1) * 1000);
    });
  }, [currentRoute, routes, preloadRoute, isPreloaded, isPreloading]);
  
  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', margin: '8px' }}>
      <h3>Smart Navigation with Preloading</h3>
      
      <nav style={{ marginBottom: '16px' }}>
        {routes.map(route => (
          <button
            key={route}
            onClick={() => handleNavigation(route)}
            onMouseEnter={() => handleMouseEnter(route)}
            style={{
              marginRight: '8px',
              padding: '8px 12px',
              background: currentRoute === route ? '#007bff' : '#f8f9fa',
              color: currentRoute === route ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            {route.replace('/', '')}
            {isPreloaded(route) && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                background: '#28a745',
                borderRadius: '50%',
              }} />
            )}
            {isPreloading(route) && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                background: '#ffc107',
                borderRadius: '50%',
              }} />
            )}
          </button>
        ))}
      </nav>
      
      <div style={{ minHeight: '100px', padding: '16px', background: '#f8f9fa', borderRadius: '4px' }}>
        {loading ? (
          <p>Loading...</p>
        ) : routeData ? (
          <div>
            <h4>{routeData.title}</h4>
            <p>{routeData.content}</p>
            <p style={{ fontSize: '12px', color: '#666' }}>
              Loaded at: {new Date(routeData.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <p>Select a route to navigate</p>
        )}
      </div>
      
      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        🟢 Preloaded | 🟡 Preloading | Hover over buttons to preload
      </p>
    </div>
  );
}

// Lazy loading gallery with intersection observer
function LazyImageGallery() {
  const { preloadImage, isImagePreloaded } = useImagePreloader();
  const [visibleImages, setVisibleImages] = useState<Set<number>>(new Set());
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Mock image URLs
  const images = Array.from({ length: 12 }, (_, i) => 
    `https://picsum.photos/300/200?random=${i + 1}`
  );
  
  const handleImageIntersection = useCallback((index: number) => {
    setVisibleImages(prev => new Set([...prev, index]));
    
    // Preload this image and next few
    const imagesToPreload = images.slice(index, index + 3);
    imagesToPreload.forEach(url => {
      if (!isImagePreloaded(url)) {
        preloadImage(url).catch(console.error);
      }
    });
  }, [images, preloadImage, isImagePreloaded]);
  
  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', margin: '8px' }}>
      <h3>Lazy Loading Gallery</h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: '16px' 
      }}>
        {images.map((url, index) => (
          <LazyImageItem
            key={index}
            url={url}
            index={index}
            isVisible={visibleImages.has(index)}
            onIntersect={() => handleImageIntersection(index)}
            isPreloaded={isImagePreloaded(url)}
          />
        ))}
      </div>
    </div>
  );
}

// Individual lazy image component
function LazyImageItem({ 
  url, 
  index, 
  isVisible, 
  onIntersect, 
  isPreloaded 
}: {
  url: string;
  index: number;
  isVisible: boolean;
  onIntersect: () => void;
  isPreloaded: boolean;
}) {
  const elementRef = useRef<HTMLDivElement>,(null);
  const [loaded, setLoaded] = useState(false);
  
  useIntersectionObserver(elementRef, onIntersect, { threshold: 0.1 });
  
  useEffect(() => {
    if (isVisible) {
      setLoaded(true);
    }
  }, [isVisible]);
  
  return (
    <div
      ref={elementRef}
      style={{
        height: '150px',
        background: loaded ? '#f8f9fa' : '#e9ecef',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {loaded ? (
        <img
          src={url}
          alt={`Image ${index + 1}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isPreloaded ? 1 : 0.7,
          }}
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '12px' }}>Loading...</div>
          <div style={{ fontSize: '10px' }}>Image {index + 1}</div>
        </div>
      )}
      
      {isPreloaded && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          background: '#28a745',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
        }}>
          Cached
        </div>
      )}
    </div>
  );
}

// Background sync example
function BackgroundSyncExample() {
  const [enabled, setEnabled] = useState(true);
  const [interval, setInterval] = useState(5000);
  
  const { data, lastSync, sync } = useBackgroundSync<{ 
    timestamp: number; 
    randomValue: number 
  }>(
    async () => ({
      timestamp: Date.now(),
      randomValue: Math.floor(Math.random() * 1000),
    }),
    interval,
    enabled
  );
  
  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', margin: '8px' }}>
      <h3>Background Data Sync</h3>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enable background sync
        </label>
        
        <label>
          Sync interval (ms):
          <input
            type="number"
            value={interval}
            onChange={(e) => setInterval(parseInt(e.target.value) || 5000)}
            min="1000"
            step="1000"
            style={{ marginLeft: '8px', padding: '4px', width: '80px' }}
          />
        </label>
        
        <button onClick={sync} style={{ marginLeft: '8px' }}>
          Manual Sync
        </button>
      </div>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '12px', 
        borderRadius: '4px' 
      }}>
        <h4>Latest Data:</h4>
        {data ? (
          <div>
            <p><strong>Random Value:</strong> {data.randomValue}</p>
            <p><strong>Timestamp:</strong> {new Date(data.timestamp).toLocaleTimeString()}</p>
          </div>
        ) : (
          <p>No data yet...</p>
        )}
        
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          Last synced: {lastSync?.toLocaleTimeString() || 'Never'}
        </p>
      </div>
    </div>
  );
}

// Priority queue example
function PriorityLoadingExample() {
  const { queue, addToQueue, processNext, clearQueue, hasItems } = usePriorityQueue<{
    id: string;
    name: string;
    priority: number;
  }>();
  
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  
  const handleAddItem = (priority: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    addToQueue({
      id,
      name: `Task ${id}`,
      priority,
    });
  };
  
  const handleProcess = useCallback(async () => {
    if (!hasItems || processing) return;
    
    await processNext(async (item) => {
      setProcessing(true);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      setResults(prev => [`Processed: ${item.name} (Priority: ${item.priority})`, ...prev.slice(0, 4)]);
      setProcessing(false);
    });
  }, [hasItems, processing, processNext]);
  
  // Auto-process queue
  useEffect(() => {
    if (hasItems && !processing) {
      handleProcess();
    }
  }, [hasItems, processing, handleProcess]);
  
  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', margin: '8px' }}>
      <h3>Priority Loading Queue</h3>
      
      <div style={{ marginBottom: '12px' }}>
        <button onClick={() => handleAddItem(1)} style={{ marginRight: '8px' }}>
          Add Low Priority (1)
        </button>
        <button onClick={() => handleAddItem(5)} style={{ marginRight: '8px' }}>
          Add Medium Priority (5)
        </button>
        <button onClick={() => handleAddItem(10)} style={{ marginRight: '8px' }}>
          Add High Priority (10)
        </button>
        <button onClick={clearQueue}>
          Clear Queue
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <h4>Queue ({queue.length} items):</h4>
          <div style={{ 
            height: '120px', 
            overflowY: 'auto', 
            background: '#f8f9fa',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            {queue.map((item, index) => (
              <div 
                key={item.id} 
                style={{ 
                  padding: '4px',
                  background: index === 0 && processing ? '#fff3cd' : 'transparent',
                  borderRadius: '2px'
                }}
              >
                {index === 0 && processing && '⏳ '}
                {item.name} (P: {item.priority})
              </div>
            ))}
            {queue.length === 0 && (
              <div style={{ color: '#666' }}>Queue is empty</div>
            )}
          </div>
        </div>
        
        <div>
          <h4>Processed:</h4>
          <div style={{ 
            height: '120px', 
            overflowY: 'auto', 
            background: '#f8f9fa',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            {results.map((result, index) => (
              <div key={index} style={{ padding: '2px 0' }}>
                {result}
              </div>
            ))}
            {results.length === 0 && (
              <div style={{ color: '#666' }}>No items processed yet</div>
            )}
          </div>
        </div>
      </div>
      
      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        Items are processed in priority order (higher first).
      </p>
    </div>
  );
}

// Main App component
function App() {
  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>useEffect Data Preloading & Optimization</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '16px' 
      }}>
        <SmartNavigation />
        <BackgroundSyncExample />
        <PriorityLoadingExample />
      </div>
      
      <LazyImageGallery />
      
      <div style={{ 
        marginTop: '24px', 
        padding: '16px',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h3>Advanced useEffect Patterns Demonstrated:</h3>
        <ul>
          <li><strong>Route Preloading:</strong> Smart navigation with hover-triggered preloading</li>
          <li><strong>Intersection Observer:</strong> Lazy loading with viewport detection</li>
          <li><strong>Background Sync:</strong> Automatic data freshness without user action</li>
          <li><strong>Priority Queues:</strong> Load critical resources first</li>
          <li><strong>Request Deduplication:</strong> Avoid duplicate network requests</li>
          <li><strong>Cleanup & Cancellation:</strong> Proper resource management</li>
          <li><strong>Cache Management:</strong> Intelligent caching with TTL</li>
          <li><strong>Performance Optimization:</strong> Reduced perceived loading times</li>
        </ul>
        
        <p style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
          <strong>Performance Benefits:</strong> These patterns dramatically improve user 
          experience by reducing perceived loading times, managing resources efficiently, 
          and providing smooth, responsive interactions.
        </p>
      </div>
    </div>
  );
}

// Export all components and hooks
export {
  useRoutePreloader,
  useIntersectionObserver,
  useImagePreloader,
  useBackgroundSync,
  usePriorityQueue,
  SmartNavigation,
  LazyImageGallery,
  LazyImageItem,
  BackgroundSyncExample,
  PriorityLoadingExample,
  App,
  mockFetch,
  type PreloadItem,
  type LoadingState,
  type PreloadCache,
  type RouteData,
};