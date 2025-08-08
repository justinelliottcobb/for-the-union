# useRef Caching & Performance Optimization

Master useRef for caching expensive computations, storing mutable values, and DOM manipulation without triggering re-renders.

## Learning Objectives

- Understand useRef for mutable value storage without re-renders
- Learn to cache expensive computations and API responses
- Practice DOM manipulation and focus management
- Handle previous values and callback refs
- Implement performance optimizations with ref-based caching
- Avoid common useRef pitfalls and memory leaks

## Prerequisites

- React useState and useEffect mastery
- Understanding of React re-render cycles
- Basic performance optimization concepts
- TypeScript generics and utility types

## Background

`useRef` creates a mutable ref object with a `.current` property that persists for the full lifetime of the component. Unlike state, updating a ref doesn't trigger a re-render, making it perfect for caching values, storing DOM references, and keeping mutable data that doesn't affect the UI directly.

### Key Use Cases

- **Caching**: Store expensive computation results
- **DOM Access**: Reference DOM elements directly
- **Previous Values**: Track previous state/props without re-renders
- **Timers/Intervals**: Store timer IDs for cleanup
- **Callback Storage**: Keep latest callback without dependencies

## Instructions

You'll build advanced caching and performance optimization patterns:

1. **Computation Cache**: Cache expensive calculations with TTL
2. **API Response Cache**: Cache network requests with invalidation
3. **DOM Manipulation**: Focus management and element interaction
4. **Previous Value Tracking**: Compare current vs previous without re-renders
5. **Performance Monitor**: Track render counts and timing
6. **Scroll Position Cache**: Remember scroll positions across navigations

## Essential useRef Patterns

### Basic Ref Usage
```typescript
function MyComponent() {
  const countRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    countRef.current += 1; // No re-render
    inputRef.current?.focus(); // DOM manipulation
  };
  
  return <input ref={inputRef} />;
}
```

### Computation Caching
```typescript
function ExpensiveComponent({ data }: { data: number[] }) {
  const cacheRef = useRef<Map<string, number>>(new Map());
  
  const expensiveCalculation = useCallback((input: number[]) => {
    const key = input.join(',');
    
    if (cacheRef.current.has(key)) {
      console.log('Cache hit!');
      return cacheRef.current.get(key)!;
    }
    
    console.log('Computing...');
    const result = input.reduce((sum, n) => sum + Math.sqrt(n), 0);
    cacheRef.current.set(key, result);
    return result;
  }, []);
  
  const result = expensiveCalculation(data);
  return <div>Result: {result}</div>;
}
```

### Previous Value Tracking
```typescript
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}
```

### API Response Caching
```typescript
function useApiCache<T>(url: string) {
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const cached = cacheRef.current.get(url);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < 60000) { // 1 minute TTL
      setData(cached.data);
      setLoading(false);
      return;
    }
    
    fetch(url)
      .then(res => res.json())
      .then((result: T) => {
        cacheRef.current.set(url, { data: result, timestamp: now });
        setData(result);
        setLoading(false);
      });
  }, [url]);
  
  return { data, loading };
}
```

## Advanced Patterns

### LRU Cache Implementation
```typescript
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  
  constructor(private maxSize: number) {}
  
  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value); // Move to end
      return value;
    }
  }
  
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

### Callback Ref Pattern
```typescript
function useLatestCallback<T extends (...args: any[]) => any>(callback: T) {
  const callbackRef = useRef<T>(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });
  
  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []);
}
```

## Performance Monitoring

### Render Counter
```typescript
function useRenderCount(componentName: string) {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });
  
  return renderCount.current;
}
```

### Performance Profiler
```typescript
function usePerformanceProfile(name: string) {
  const startTime = useRef<number>(0);
  
  useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      const duration = performance.now() - startTime.current;
      console.log(`${name} render took ${duration.toFixed(2)}ms`);
    };
  });
}
```

## Common Pitfalls

1. **Memory Leaks**: Not clearing cached data when component unmounts
2. **Stale Closures**: Using outdated values in event handlers
3. **Ref Mutation**: Mutating refs during render (should be in effects/handlers)
4. **Over-Caching**: Caching too much data without cleanup
5. **DOM Ref Types**: Incorrect TypeScript types for DOM elements

## Hints

1. useRef doesn't trigger re-renders when .current changes
2. Perfect for storing values that don't affect the UI
3. Use for caching expensive computations between renders
4. Great for DOM manipulation and focus management
5. Implement TTL (time-to-live) for cache invalidation
6. Clear caches on unmount to prevent memory leaks

## Expected Behavior

When complete, you should have components that:

```typescript
// Expensive computation with caching
const Calculator = ({ numbers }: { numbers: number[] }) => {
  const cache = useRef(new Map<string, number>());
  
  const calculate = useCallback((nums: number[]) => {
    const key = nums.join(',');
    if (cache.current.has(key)) {
      return cache.current.get(key)!;
    }
    
    const result = nums.reduce((sum, n) => sum + Math.pow(n, 2), 0);
    cache.current.set(key, result);
    return result;
  }, []);
  
  return <div>Sum of squares: {calculate(numbers)}</div>;
};

// API caching with TTL
const UserProfile = ({ userId }: { userId: string }) => {
  const { data, loading } = useApiCache(`/api/users/${userId}`);
  
  return loading ? <div>Loading...</div> : <div>{data.name}</div>;
};
```

**Estimated time:** 30 minutes  
**Difficulty:** 4/5