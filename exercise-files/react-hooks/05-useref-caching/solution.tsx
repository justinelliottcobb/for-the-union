// useRef Caching & Performance Optimization - SOLUTION
// Master useRef for caching, DOM manipulation, and performance optimization

import { useState, useEffect, useRef, useCallback } from 'react';

// Define types for caching system
type CacheEntry<T> = {
  data: T;
  timestamp: number;
  accessCount: number;
};

type LRUCacheOptions = {
  maxSize: number;
  ttl?: number; // Time to live in milliseconds
};

type ApiResponse<T = any> = {
  data: T;
  status: 'success' | 'error';
  message?: string;
};

// Implement LRU Cache class using Map
class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private maxSize: number;
  private ttl?: number;

  constructor(options: LRUCacheOptions) {
    // Initialize cache Map and options
    this.cache = new Map();
    this.maxSize = options.maxSize;
    this.ttl = options.ttl;
  }

  get(key: K): V | undefined {
    // Implement LRU get logic
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Move accessed item to end (mark as recently used)
    entry.accessCount++;
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.data;
  }

  set(key: K, value: V): void {
    // Implement LRU set logic
    const entry: CacheEntry<V> = {
      data: value,
      timestamp: Date.now(),
      accessCount: 1,
    };
    
    // If key exists, update and move to end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // If cache is full, remove least recently used item (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    // Add new entry
    this.cache.set(key, entry);
  }

  clear(): void {
    // Clear all cache entries
    this.cache.clear();
  }

  size(): number {
    // Return current cache size
    return this.cache.size;
  }

  private isExpired(entry: CacheEntry<V>): boolean {
    // Check if entry has expired based on TTL
    if (!this.ttl) return false;
    return Date.now() - entry.timestamp > this.ttl;
  }

  // Helper method to get cache stats
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        timestamp: entry.timestamp,
        accessCount: entry.accessCount,
        age: Date.now() - entry.timestamp,
      })),
    };
  }
}

// Create useComputationCache custom hook
function useComputationCache<T extends (...args: any[]) => any>(
  computeFn: T,
  options: LRUCacheOptions = { maxSize: 100 }
): T {
  // Create ref for LRU cache
  const cacheRef = useRef<LRUCache<string, ReturnType<T>>>();
  
  // Initialize cache on first render
  if (!cacheRef.current) {
    cacheRef.current = new LRUCache(options);
  }
  
  // Return memoized function that checks cache first
  const memoizedFunction = useCallback((...args: Parameters<T>) => {
    const cache = cacheRef.current!;
    const key = JSON.stringify(args);
    
    // Check cache first
    const cachedResult = cache.get(key);
    if (cachedResult !== undefined) {
      return cachedResult;
    }
    
    // If not in cache, compute result and store it
    const result = computeFn(...args);
    cache.set(key, result);
    
    return result;
  }, [computeFn]) as T;
  
  // Clear cache on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      cacheRef.current?.clear();
    };
  }, []);
  
  return memoizedFunction;
}

// Create useApiCache custom hook
function useApiCache<T = any>(url: string, ttl: number = 60000) {
  // Add states for data, loading, error
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create ref for cache storage
  const cacheRef = useRef<LRUCache<string, ApiResponse<T>>>();
  
  // Initialize cache
  if (!cacheRef.current) {
    cacheRef.current = new LRUCache<string, ApiResponse<T>>({
      maxSize: 50,
      ttl,
    });
  }
  
  const fetchData = useCallback(async () => {
    const cache = cacheRef.current!;
    
    // Check cache first
    const cachedResponse = cache.get(url);
    if (cachedResponse) {
      if (cachedResponse.status === 'success') {
        setData(cachedResponse.data);
        setError(null);
      } else {
        setError(cachedResponse.message || 'Cached error');
        setData(null);
      }
      return;
    }
    
    // If not in cache, fetch from API
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const apiResponse: ApiResponse<T> = {
        data: result,
        status: 'success',
      };
      
      // Cache the successful response
      cache.set(url, apiResponse);
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'An error occurred';
      const apiResponse: ApiResponse<T> = {
        data: null as any,
        status: 'error',
        message: error,
      };
      
      // Cache the error response (with shorter TTL)
      cache.set(url, apiResponse);
      setError(error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url, ttl]);
  
  // Fetch data when URL changes
  useEffect(() => {
    if (url) {
      fetchData();
    }
  }, [url, fetchData]);
  
  // Manual refetch function
  const refetch = useCallback(() => {
    // Clear cache for this URL and refetch
    cacheRef.current?.cache?.delete(url);
    fetchData();
  }, [url, fetchData]);
  
  return {
    data,
    loading,
    error,
    refetch,
    cacheStats: cacheRef.current?.getStats(),
  };
}

// Create useScrollPosition custom hook using useRef
function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const throttleTimeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    const handleScroll = () => {
      // Throttle scroll events
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      
      throttleTimeoutRef.current = setTimeout(() => {
        setScrollPosition({
          x: window.scrollX,
          y: window.scrollY,
        });
      }, 16); // ~60fps
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);
  
  return scrollPosition;
}

// Create useDOMRef custom hook for DOM manipulation
function useDOMRef<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  
  const focus = useCallback(() => {
    ref.current?.focus();
  }, []);
  
  const blur = useCallback(() => {
    ref.current?.blur();
  }, []);
  
  const scrollIntoView = useCallback((options?: ScrollIntoViewOptions) => {
    ref.current?.scrollIntoView(options);
  }, []);
  
  const getBoundingRect = useCallback(() => {
    return ref.current?.getBoundingClientRect();
  }, []);
  
  return {
    ref,
    focus,
    blur,
    scrollIntoView,
    getBoundingRect,
  };
}

// Example Components

// Expensive computation component with caching
function ExpensiveComputationExample() {
  const [input, setInput] = useState(5);
  const [results, setResults] = useState<string[]>([]);
  const computationCountRef = useRef(0);
  
  // Expensive fibonacci computation
  const fibonacciWithoutCache = (n: number): number => {
    computationCountRef.current++;
    if (n <= 1) return n;
    return fibonacciWithoutCache(n - 1) + fibonacciWithoutCache(n - 2);
  };
  
  // Cached version
  const fibonacciWithCache = useComputationCache(fibonacciWithoutCache, {
    maxSize: 50,
    ttl: 30000, // 30 seconds
  });
  
  const handleComputeWithoutCache = () => {
    const startTime = performance.now();
    computationCountRef.current = 0;
    const result = fibonacciWithoutCache(input);
    const endTime = performance.now();
    
    setResults(prev => [
      `Without Cache: fib(${input}) = ${result}, took ${(endTime - startTime).toFixed(2)}ms (${computationCountRef.current} computations)`,
      ...prev.slice(0, 4)
    ]);
  };
  
  const handleComputeWithCache = () => {
    const startTime = performance.now();
    computationCountRef.current = 0;
    const result = fibonacciWithCache(input);
    const endTime = performance.now();
    
    setResults(prev => [
      `With Cache: fib(${input}) = ${result}, took ${(endTime - startTime).toFixed(2)}ms (${computationCountRef.current} computations)`,
      ...prev.slice(0, 4)
    ]);
  };
  
  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', margin: '8px' }}>
      <h3>Expensive Computation Caching</h3>
      
      <div style={{ marginBottom: '12px' }}>
        <label>
          Fibonacci number (try 35-40):
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(parseInt(e.target.value) || 0)}
            min="0"
            max="45"
            style={{ marginLeft: '8px', padding: '4px', width: '60px' }}
          />
        </label>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <button onClick={handleComputeWithoutCache} style={{ marginRight: '8px' }}>
          Compute Without Cache
        </button>
        <button onClick={handleComputeWithCache}>
          Compute With Cache
        </button>
      </div>
      
      <div>
        <h4>Results:</h4>
        {results.map((result, index) => (
          <div key={index} style={{ 
            fontSize: '12px', 
            fontFamily: 'monospace',
            padding: '4px',
            background: index === 0 ? '#e3f2fd' : '#f5f5f5',
            margin: '2px 0',
            borderRadius: '4px'
          }}>
            {result}
          </div>
        ))}
      </div>
    </div>
  );
}

// API caching example component
function ApiCachingExample() {
  const [userId, setUserId] = useState(1);
  const [url, setUrl] = useState(`https://jsonplaceholder.typicode.com/users/${userId}`);
  
  const { data, loading, error, refetch, cacheStats } = useApiCache(url, 30000); // 30 second cache
  
  const handleUserChange = (newUserId: number) => {
    setUserId(newUserId);
    setUrl(`https://jsonplaceholder.typicode.com/users/${newUserId}`);
  };
  
  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', margin: '8px' }}>
      <h3>API Response Caching</h3>
      
      <div style={{ marginBottom: '12px' }}>
        <label>
          User ID:
          <input
            type="number"
            value={userId}
            onChange={(e) => handleUserChange(parseInt(e.target.value) || 1)}
            min="1"
            max="10"
            style={{ marginLeft: '8px', padding: '4px', width: '60px' }}
          />
        </label>
        <button onClick={refetch} style={{ marginLeft: '8px' }}>
          Force Refetch
        </button>
      </div>
      
      {loading && <p>Loading user data...</p>}
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {data && (
        <div style={{ background: '#f8f9fa', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
          <strong>User:</strong> {data.name}<br />
          <strong>Email:</strong> {data.email}<br />
          <strong>Website:</strong> {data.website}
        </div>
      )}
      
      {cacheStats && (
        <div style={{ fontSize: '12px', color: '#666' }}>
          <strong>Cache Stats:</strong> {cacheStats.size}/{cacheStats.maxSize} entries
        </div>
      )}
      
      <p style={{ fontSize: '12px', color: '#666' }}>
        Switch between different user IDs to see caching in action. 
        Data is cached for 30 seconds.
      </p>
    </div>
  );
}

// DOM manipulation example
function DOMManipulationExample() {
  const inputRef = useDOMRef<HTMLInputElement>();
  const divRef = useDOMRef<HTMLDivElement>();
  const [message, setMessage] = useState('');
  const scrollPosition = useScrollPosition();
  
  const handleFocus = () => {
    inputRef.focus();
    setMessage('Input focused');
  };
  
  const handleScrollToDiv = () => {
    divRef.scrollIntoView({ behavior: 'smooth' });
    setMessage('Scrolled to div');
  };
  
  const handleGetBounds = () => {
    const bounds = divRef.getBoundingRect();
    if (bounds) {
      setMessage(`Div bounds: ${Math.round(bounds.width)}x${Math.round(bounds.height)} at (${Math.round(bounds.left)}, ${Math.round(bounds.top)})`);
    }
  };
  
  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', margin: '8px' }}>
      <h3>DOM Manipulation with useRef</h3>
      
      <div style={{ marginBottom: '12px' }}>
        <input
          ref={inputRef.ref}
          type="text"
          placeholder="This input can be focused programmatically"
          style={{ width: '300px', padding: '4px', marginBottom: '8px' }}
        />
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <button onClick={handleFocus} style={{ marginRight: '8px' }}>
          Focus Input
        </button>
        <button onClick={handleScrollToDiv} style={{ marginRight: '8px' }}>
          Scroll to Div
        </button>
        <button onClick={handleGetBounds}>
          Get Div Bounds
        </button>
      </div>
      
      {message && (
        <div style={{ 
          padding: '8px', 
          background: '#e3f2fd', 
          borderRadius: '4px',
          marginBottom: '12px',
          fontSize: '12px'
        }}>
          {message}
        </div>
      )}
      
      <div style={{ 
        fontSize: '12px', 
        color: '#666',
        marginBottom: '12px'
      }}>
        Current scroll position: ({Math.round(scrollPosition.x)}, {Math.round(scrollPosition.y)})
      </div>
      
      <div
        ref={divRef.ref}
        style={{
          height: '100px',
          background: '#f8f9fa',
          border: '2px dashed #dee2e6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px'
        }}
      >
        This div can be scrolled to and measured
      </div>
    </div>
  );
}

// Performance monitoring component
function PerformanceMonitoringExample() {
  const [renderCount, setRenderCount] = useState(0);
  const [operations, setOperations] = useState<string[]>([]);
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  
  // Track renders
  renderCountRef.current++;
  
  useEffect(() => {
    setRenderCount(renderCountRef.current);
  });
  
  const addOperation = (operation: string) => {
    const elapsed = Date.now() - startTimeRef.current;
    setOperations(prev => [
      `[${elapsed}ms] ${operation}`,
      ...prev.slice(0, 9)
    ]);
  };
  
  const handleReset = () => {
    renderCountRef.current = 0;
    startTimeRef.current = Date.now();
    setRenderCount(0);
    setOperations([]);
    addOperation('Performance monitor reset');
  };
  
  const handleTriggerRender = () => {
    setRenderCount(prev => prev + 1);
    addOperation('Forced re-render triggered');
  };
  
  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', margin: '8px' }}>
      <h3>Performance Monitoring with useRef</h3>
      
      <div style={{ marginBottom: '12px' }}>
        <strong>Render Count:</strong> {renderCount}
        <br />
        <strong>Ref Render Count:</strong> {renderCountRef.current}
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <button onClick={handleTriggerRender} style={{ marginRight: '8px' }}>
          Trigger Re-render
        </button>
        <button onClick={handleReset}>
          Reset Monitor
        </button>
      </div>
      
      <div>
        <h4>Operations Log:</h4>
        <div style={{ 
          height: '120px', 
          overflow: 'auto', 
          background: '#f8f9fa',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {operations.map((op, index) => (
            <div key={index}>{op}</div>
          ))}
          {operations.length === 0 && (
            <div style={{ color: '#666' }}>No operations logged yet...</div>
          )}
        </div>
      </div>
      
      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        Notice how useRef doesn't trigger re-renders when its value changes.
        The ref render count updates without causing additional renders.
      </p>
    </div>
  );
}

// Main App component
function App() {
  const [showAll, setShowAll] = useState(true);
  
  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>useRef Caching & Performance Optimization</h1>
      
      <div style={{ marginBottom: '16px' }}>
        <label>
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
          Show all examples (uncheck to improve performance)
        </label>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '16px' 
      }}>
        <ExpensiveComputationExample />
        <ApiCachingExample />
        {showAll && <DOMManipulationExample />}
        {showAll && <PerformanceMonitoringExample />}
      </div>
      
      <div style={{ 
        marginTop: '24px', 
        padding: '16px',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h3>useRef Techniques Demonstrated:</h3>
        <ul>
          <li><strong>LRU Caching:</strong> Efficient memory management with TTL support</li>
          <li><strong>Computation Caching:</strong> Memoization of expensive calculations</li>
          <li><strong>API Response Caching:</strong> Reduce network requests with smart caching</li>
          <li><strong>DOM Manipulation:</strong> Direct element access without re-renders</li>
          <li><strong>Performance Monitoring:</strong> Track renders and operations</li>
          <li><strong>Scroll Tracking:</strong> Throttled scroll position monitoring</li>
          <li><strong>Memory Management:</strong> Proper cleanup to prevent leaks</li>
        </ul>
        
        <p style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
          <strong>Key Benefits:</strong> useRef enables performance optimizations that would be 
          impossible with regular state. Use it for caching, DOM access, and storing values 
          that don't need to trigger re-renders.
        </p>
      </div>
    </div>
  );
}

// Export all components and hooks
export {
  LRUCache,
  useComputationCache,
  useApiCache,
  useScrollPosition,
  useDOMRef,
  ExpensiveComputationExample,
  ApiCachingExample,
  DOMManipulationExample,
  PerformanceMonitoringExample,
  App,
  type CacheEntry,
  type LRUCacheOptions,
  type ApiResponse,
};