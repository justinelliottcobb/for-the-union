# Render Props to Hooks Migration

## Overview

Master the migration from render props patterns to modern React hooks. Learn to convert complex render prop components to hooks while maintaining functionality, improving performance, and providing backward compatibility strategies.

## Learning Objectives

By completing this exercise, you will:

- **Understand Render Props Pattern**: Learn the benefits and limitations of render props
- **Master Hook Conversion**: Convert render prop components to equivalent hooks
- **Performance Optimization**: Compare and optimize performance between patterns
- **Migration Strategies**: Implement gradual migration approaches with backward compatibility
- **Pattern Comparison**: Understand when to use each pattern and their trade-offs
- **Testing & Debugging**: Learn testing strategies for both patterns

## Key Concepts

### 1. Render Props Pattern

Render props is a pattern where a component takes a function as a prop and calls it with data:

```tsx
// Traditional render props
<DataProvider url="/api/users">
  {({ data, loading, error }) => (
    <div>
      {loading && <Spinner />}
      {error && <Error message={error} />}
      {data && <UserList users={data} />}
    </div>
  )}
</DataProvider>

// Modern hooks equivalent
function UserComponent() {
  const { data, loading, error } = useData('/api/users');
  
  return (
    <div>
      {loading && <Spinner />}
      {error && <Error message={error} />}
      {data && <UserList users={data} />}
    </div>
  );
}
```

### 2. Hook Conversion Benefits

- **Simpler Composition**: No callback hell or deep nesting
- **Better TypeScript**: Improved type inference and IntelliSense
- **Performance**: Fewer re-renders and better optimization
- **Testing**: Easier to test individual hooks
- **Reusability**: Compose multiple hooks easily

### 3. Migration Strategy

Convert render props to hooks systematically:

```tsx
// 1. Extract logic from render prop component
class DataProvider extends Component {
  // State and lifecycle methods
}

// 2. Convert to hook
function useData(url, options) {
  // Same logic using hooks
}

// 3. Optional: Create backward compatibility wrapper
const DataProvider = withRenderProps(useData);
```

## Implementation Tasks

### Task 1: DataProvider Render Prop to useData Hook (20 minutes)

Convert a comprehensive data fetching render prop component to a hook:

**Render Prop Implementation:**
```tsx
class DataProvider<T> extends Component<DataProviderProps<T>, DataState<T>> {
  private intervalRef: NodeJS.Timeout | null = null;
  private abortController: AbortController | null = null;
  
  state = {
    data: null,
    loading: false,
    error: null,
    refresh: this.fetchData,
  };

  async fetchData() {
    this.setState({ loading: true, error: null });
    
    try {
      this.abortController = new AbortController();
      const response = await fetch(this.props.url, {
        signal: this.abortController.signal
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      this.setState({ data, loading: false });
      this.props.onSuccess?.(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.setState({ error: error.message, loading: false });
        this.props.onError?.(error);
      }
    }
  }

  componentDidMount() {
    this.fetchData();
    if (this.props.refreshInterval) {
      this.intervalRef = setInterval(this.fetchData, this.props.refreshInterval);
    }
  }

  componentWillUnmount() {
    if (this.intervalRef) clearInterval(this.intervalRef);
    this.abortController?.abort();
  }

  render() {
    return this.props.children(this.state);
  }
}
```

**Hook Conversion:**
```tsx
function useData<T>(url: string, options: UseDataOptions = {}): DataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const retriesRef = useRef(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      setData(result);
      setLoading(false);
      retriesRef.current = 0;
      options.onSuccess?.(result);
    } catch (err) {
      if (err.name !== 'AbortError') {
        const error = err as Error;
        
        if (retriesRef.current < (options.retryCount || 0)) {
          retriesRef.current++;
          setTimeout(fetchData, 1000 * retriesRef.current);
        } else {
          setError(error.message);
          setLoading(false);
          options.onError?.(error);
        }
      }
    }
  }, [url, options.retryCount, options.onSuccess, options.onError]);

  // Set up refresh interval
  useEffect(() => {
    if (options.enabled !== false) {
      fetchData();
    }
    
    if (options.refreshInterval && options.enabled !== false) {
      const interval = setInterval(fetchData, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, options.refreshInterval, options.enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const refresh = useCallback(() => {
    retriesRef.current = 0;
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
}
```

### Task 2: MouseTracker Render Prop to useMouse Hook (15 minutes)

Convert mouse tracking functionality:

**Key Features:**
- Real-time mouse position tracking
- Throttling for performance
- Relative vs absolute positioning
- Element-specific tracking

**Hook Implementation:**
```tsx
function useMouse(options: UseMouseOptions = {}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = options.element?.current || elementRef.current || document;
    
    const handleMouseMove = (event: MouseEvent) => {
      if (options.throttle && throttleRef.current) return;
      
      let x = event.clientX;
      let y = event.clientY;
      
      if (options.relative && elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
      }
      
      setPosition({ x, y });
      
      if (options.throttle) {
        throttleRef.current = setTimeout(() => {
          throttleRef.current = null;
        }, options.throttle);
      }
    };

    element.addEventListener('mousemove', handleMouseMove);
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, [options.throttle, options.relative, options.element]);

  return { ...position, ref: elementRef };
}
```

### Task 3: Counter and Toggle Components (15 minutes)

Convert state management render props to hooks:

**Counter Hook:**
```tsx
function useCounter(initialValue = 0, options: UseCounterOptions = {}) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(prev => {
      const next = prev + (options.step || 1);
      const newValue = options.max !== undefined ? Math.min(next, options.max) : next;
      options.onChange?.(newValue);
      return newValue;
    });
  }, [options.step, options.max, options.onChange]);

  const decrement = useCallback(() => {
    setCount(prev => {
      const next = prev - (options.step || 1);
      const newValue = options.min !== undefined ? Math.max(next, options.min) : next;
      options.onChange?.(newValue);
      return newValue;
    });
  }, [options.step, options.min, options.onChange]);

  const reset = useCallback(() => {
    options.onChange?.(initialValue);
    setCount(initialValue);
  }, [initialValue, options.onChange]);

  return { count, increment, decrement, reset };
}
```

### Task 4: Performance Tracking (10 minutes)

Implement performance comparison utilities:

**Performance Hook:**
```tsx
function usePerformanceTracker(componentName: string): PerformanceMetrics {
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
    lastRenderTime: 0,
  });
  
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;
    
    const metrics = metricsRef.current;
    metrics.renderCount++;
    metrics.lastRenderTime = renderTime;
    metrics.totalRenderTime += renderTime;
    metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;
    
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
    }
  });

  // Reset start time for next render
  startTimeRef.current = performance.now();

  return metricsRef.current;
}
```

### Task 5: Backward Compatibility Wrapper (15 minutes)

Create a utility to wrap hooks for render prop compatibility:

**Migration Wrapper:**
```tsx
function withRenderProps<T>(
  hook: () => T,
  displayName?: string
): React.ComponentType<{ children: (value: T) => ReactNode }> {
  const WrappedComponent: React.FC<{ children: (value: T) => ReactNode }> = ({ 
    children 
  }) => {
    const value = hook();
    return <>{children(value)}</>;
  };

  WrappedComponent.displayName = displayName || `withRenderProps(${hook.name})`;
  return WrappedComponent;
}

// Usage for gradual migration
const DataProviderCompat = withRenderProps(() => 
  useData('/api/data'), 
  'DataProvider'
);

// Old code continues to work
<DataProviderCompat>
  {({ data, loading, error }) => (
    <div>{/* existing render prop code */}</div>
  )}
</DataProviderCompat>
```

## Migration Strategies

### 1. Gradual Migration Approach

```tsx
// Phase 1: Extract hook from render prop
function useData(url) {
  // Hook implementation
}

// Phase 2: Update render prop to use hook internally
class DataProvider extends Component {
  render() {
    const state = useData(this.props.url); // Error: hooks in class!
    return this.props.children(state);
  }
}

// Phase 2 (correct): Use wrapper component
const DataProvider = withRenderProps(() => useData('/api/data'));

// Phase 3: Migrate consumers to hooks
// Old: <DataProvider>{state => <UI {...state} />}</DataProvider>
// New: const state = useData('/api/data'); return <UI {...state} />;
```

### 2. Performance Optimization

```tsx
// Render props can cause unnecessary re-renders
<MouseTracker>
  {({ x, y }) => (
    <ExpensiveComponent position={{ x, y }} />
  )}
</MouseTracker>

// Hook version with better memoization
function MyComponent() {
  const { x, y } = useMouse();
  const position = useMemo(() => ({ x, y }), [x, y]);
  
  return <ExpensiveComponent position={position} />;
}
```

### 3. Testing Strategies

```tsx
// Testing render props
test('DataProvider handles loading state', () => {
  let capturedState;
  render(
    <DataProvider url="/test">
      {(state) => {
        capturedState = state;
        return null;
      }}
    </DataProvider>
  );
  expect(capturedState.loading).toBe(true);
});

// Testing hooks (simpler)
test('useData handles loading state', () => {
  const { result } = renderHook(() => useData('/test'));
  expect(result.current.loading).toBe(true);
});
```

## Success Criteria

- [ ] All render prop components are successfully converted to hooks
- [ ] Hook versions maintain the same functionality as render props
- [ ] Performance tracking shows improvements in hook versions
- [ ] Backward compatibility wrappers work correctly
- [ ] Components handle edge cases (cleanup, error states, retries)
- [ ] TypeScript types are accurate and provide good IntelliSense
- [ ] Demo component shows side-by-side comparison
- [ ] Migration utilities are implemented and functional

## Real-World Applications

This migration pattern is essential for:

- **Legacy Code Modernization**: Updating older React codebases to modern patterns
- **Performance Optimization**: Reducing component tree depth and re-renders
- **Developer Experience**: Improving code readability and maintainability
- **Library Migration**: Converting render prop libraries to hook-based alternatives
- **Team Onboarding**: Teaching modern React patterns to developers familiar with older patterns

Master this migration to modernize React applications effectively!