# useEffect Data Preloading & Optimization

Master advanced useEffect patterns for data preloading, background fetching, and performance optimization strategies.

## Learning Objectives

- Implement intelligent data preloading strategies
- Learn background data fetching and cache warming
- Practice resource prioritization and loading optimization
- Handle complex async dependency chains
- Implement progressive loading and lazy loading patterns
- Master cleanup and cancellation for optimal performance

## Prerequisites

- Advanced useEffect and useState knowledge
- Understanding of async/await and Promises
- Basic knowledge of browser performance APIs
- Familiarity with caching strategies
- Understanding of component lifecycle optimization

## Background

Data preloading is a critical performance optimization technique where you fetch data before it's actually needed. This can dramatically improve perceived performance by eliminating loading states and providing instant user experiences.

### Key Strategies

- **Route-based Preloading**: Load data for likely next routes
- **User Intent Prediction**: Preload based on hover/focus events
- **Background Synchronization**: Keep cache fresh in background
- **Progressive Loading**: Load critical data first, details later
- **Resource Prioritization**: Load important resources first

## Instructions

You'll build a comprehensive data preloading system:

1. **Route Preloader**: Anticipate and preload route data
2. **Background Cache Warmer**: Keep data fresh without user awareness
3. **Progressive Image Loader**: Load images with blur-to-sharp effect
4. **Search Suggestions Preloader**: Preload search results on input
5. **Infinite Scroll Optimizer**: Preload next pages intelligently
6. **Resource Priority Manager**: Manage loading priorities

## Advanced useEffect Patterns

### Route-based Preloading
```typescript
function useRoutePreloader() {
  const preloadCache = useRef<Map<string, Promise<any>>>(new Map());
  
  const preloadRoute = useCallback(async (route: string) => {
    if (preloadCache.current.has(route)) {
      return preloadCache.current.get(route);
    }
    
    const promise = fetch(`/api${route}`).then(res => res.json());
    preloadCache.current.set(route, promise);
    
    return promise;
  }, []);
  
  return { preloadRoute, preloadCache: preloadCache.current };
}
```

### Background Data Sync
```typescript
function useBackgroundSync<T>(
  fetchFn: () => Promise<T>,
  interval: number = 30000
) {
  const [data, setData] = useState<T | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  
  const syncData = useCallback(async (silent = false) => {
    try {
      const result = await fetchFn();
      setData(result);
      setLastUpdated(new Date());
      
      if (!silent) {
        // Notify user of update
      }
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }, [fetchFn]);
  
  useEffect(() => {
    syncData(); // Initial load
    
    intervalRef.current = setInterval(() => {
      syncData(true); // Silent background updates
    }, interval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [syncData, interval]);
  
  return { data, lastUpdated, syncData };
}
```

### Progressive Image Loading
```typescript
function useProgressiveImage(src: string, placeholder?: string) {
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!src) return;
    
    setLoading(true);
    setError(null);
    
    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setLoading(false);
    };
    
    img.onerror = () => {
      setError('Failed to load image');
      setLoading(false);
    };
    
    img.src = src;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);
  
  return { src: currentSrc, loading, error };
}
```

### Smart Preloading Hook
```typescript
function useSmartPreloader<T>(
  items: Array<{ id: string; priority: number; loader: () => Promise<T> }>
) {
  const [loadedItems, setLoadedItems] = useState<Map<string, T>>(new Map());
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  
  useEffect(() => {
    // Sort by priority and load high-priority items first
    const sortedItems = [...items].sort((a, b) => b.priority - a.priority);
    
    sortedItems.forEach((item, index) => {
      // Use setTimeout to space out requests
      const delay = index * 100; // 100ms between requests
      
      const timeoutId = setTimeout(async () => {
        if (loadedItems.has(item.id) || loadingItems.has(item.id)) {
          return;
        }
        
        const controller = new AbortController();
        abortControllers.current.set(item.id, controller);
        
        setLoadingItems(prev => new Set(prev).add(item.id));
        
        try {
          const result = await item.loader();
          
          if (!controller.signal.aborted) {
            setLoadedItems(prev => new Map(prev).set(item.id, result));
            setLoadingItems(prev => {
              const newSet = new Set(prev);
              newSet.delete(item.id);
              return newSet;
            });
          }
        } catch (error) {
          if (!controller.signal.aborted) {
            console.error(`Failed to load item ${item.id}:`, error);
            setLoadingItems(prev => {
              const newSet = new Set(prev);
              newSet.delete(item.id);
              return newSet;
            });
          }
        }
      }, delay);
      
      return () => clearTimeout(timeoutId);
    });
    
    return () => {
      // Cancel all pending requests
      abortControllers.current.forEach(controller => {
        controller.abort();
      });
      abortControllers.current.clear();
    };
  }, [items]);
  
  return { loadedItems, loadingItems };
}
```

## Performance Optimization Patterns

### Intersection Observer for Lazy Loading
```typescript
function useIntersectionObserver(
  elementRef: RefObject<Element>,
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        callback();
        observer.unobserve(element);
      }
    }, options);
    
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, callback, options]);
}
```

### Prefetch on User Intent
```typescript
function usePrefetchOnHover<T>(
  fetchFn: () => Promise<T>,
  delay: number = 300
) {
  const [data, setData] = useState<T | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const prefetchedRef = useRef(false);
  
  const handleMouseEnter = useCallback(() => {
    if (prefetchedRef.current) return;
    
    timeoutRef.current = setTimeout(async () => {
      try {
        const result = await fetchFn();
        setData(result);
        prefetchedRef.current = true;
      } catch (error) {
        console.error('Prefetch failed:', error);
      }
    }, delay);
  }, [fetchFn, delay]);
  
  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);
  
  return {
    data,
    isPrefetched: prefetchedRef.current,
    prefetchProps: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
}
```

## Advanced Loading Strategies

### Waterfall vs Parallel Loading
```typescript
// Waterfall (sequential)
async function waterfallLoading() {
  const user = await fetchUser();
  const profile = await fetchProfile(user.id);
  const preferences = await fetchPreferences(user.id);
  return { user, profile, preferences };
}

// Parallel (concurrent)
async function parallelLoading(userId: string) {
  const [user, profile, preferences] = await Promise.all([
    fetchUser(),
    fetchProfile(userId),
    fetchPreferences(userId),
  ]);
  return { user, profile, preferences };
}

// Mixed strategy
async function smartLoading() {
  const user = await fetchUser(); // Must load first
  
  const [profile, preferences, posts] = await Promise.all([
    fetchProfile(user.id),
    fetchPreferences(user.id),
    fetchRecentPosts(user.id),
  ]);
  
  return { user, profile, preferences, posts };
}
```

## Hints

1. Use AbortController to cancel unnecessary requests
2. Implement request deduplication to avoid duplicate fetches
3. Consider using Intersection Observer for lazy loading
4. Prioritize critical data over nice-to-have data
5. Use background sync for data freshness
6. Implement proper error boundaries for failed preloads

## Expected Behavior

When complete, you should have:

```typescript
// Route preloader that loads data before navigation
const ProductCatalog = () => {
  const { preloadRoute } = useRoutePreloader();
  
  return (
    <div>
      <Link 
        to="/product/1"
        onMouseEnter={() => preloadRoute('/product/1')}
      >
        Product 1
      </Link>
    </div>
  );
};

// Background sync that keeps data fresh
const Dashboard = () => {
  const { data, lastUpdated } = useBackgroundSync(
    () => fetch('/api/dashboard').then(r => r.json()),
    30000 // Sync every 30 seconds
  );
  
  return (
    <div>
      <div>Last updated: {lastUpdated?.toLocaleTimeString()}</div>
      <div>{JSON.stringify(data)}</div>
    </div>
  );
};

// Progressive image loading with blur effect
const ImageGallery = ({ images }: { images: string[] }) => {
  return (
    <div>
      {images.map(src => (
        <ProgressiveImage key={src} src={src} placeholder="/blur.jpg" />
      ))}
    </div>
  );
};
```

**Estimated time:** 40 minutes  
**Difficulty:** 5/5