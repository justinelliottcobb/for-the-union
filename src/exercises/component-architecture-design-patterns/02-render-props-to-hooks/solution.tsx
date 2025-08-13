import React, { useState, useEffect, useRef, useCallback, useMemo, Component, ReactNode } from 'react';

// Types for render props pattern
interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

interface MousePosition {
  x: number;
  y: number;
}

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

interface ToggleState {
  isOn: boolean;
  toggle: () => void;
  turnOn: () => void;
  turnOff: () => void;
}

// DataProvider render prop component implementation
interface DataProviderProps<T> {
  url: string;
  children: (state: DataState<T>) => ReactNode;
  refreshInterval?: number;
  retryCount?: number;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
}

class DataProvider<T> extends Component<DataProviderProps<T>, DataState<T>> {
  private intervalRef: NodeJS.Timeout | null = null;
  private retryTimeoutRef: NodeJS.Timeout | null = null;
  private abortController: AbortController | null = null;
  private currentRetries = 0;

  constructor(props: DataProviderProps<T>) {
    super(props);
    
    this.state = {
      data: null,
      loading: false,
      error: null,
      refresh: this.fetchData,
    };
  }

  componentDidMount() {
    this.fetchData();
    
    if (this.props.refreshInterval) {
      this.intervalRef = setInterval(this.fetchData, this.props.refreshInterval);
    }
  }

  componentDidUpdate(prevProps: DataProviderProps<T>) {
    if (prevProps.url !== this.props.url) {
      this.currentRetries = 0;
      this.fetchData();
    }
    
    if (prevProps.refreshInterval !== this.props.refreshInterval) {
      if (this.intervalRef) {
        clearInterval(this.intervalRef);
        this.intervalRef = null;
      }
      
      if (this.props.refreshInterval) {
        this.intervalRef = setInterval(this.fetchData, this.props.refreshInterval);
      }
    }
  }

  componentWillUnmount() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
    }
    if (this.retryTimeoutRef) {
      clearTimeout(this.retryTimeoutRef);
    }
    this.abortController?.abort();
  }

  fetchData = async (): Promise<void> => {
    this.setState({ loading: true, error: null });
    
    try {
      this.abortController = new AbortController();
      
      const response = await fetch(this.props.url, {
        signal: this.abortController.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      this.setState({ 
        data, 
        loading: false,
        error: null 
      });
      
      this.currentRetries = 0;
      this.props.onSuccess?.(data);
      
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        const retryCount = this.props.retryCount || 0;
        
        if (this.currentRetries < retryCount) {
          this.currentRetries++;
          this.retryTimeoutRef = setTimeout(
            this.fetchData, 
            1000 * Math.pow(2, this.currentRetries - 1)
          );
        } else {
          this.setState({ 
            error: error.message, 
            loading: false 
          });
          this.props.onError?.(error);
        }
      }
    }
  };

  render() {
    return this.props.children(this.state);
  }
}

// useData hook - converted from DataProvider
interface UseDataOptions<T> {
  refreshInterval?: number;
  retryCount?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
}

function useData<T>(
  url: string,
  options: UseDataOptions<T> = {}
): DataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const retriesRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      setData(result);
      setLoading(false);
      retriesRef.current = 0;
      options.onSuccess?.(result);
      
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const retryCount = options.retryCount || 0;
        
        if (retriesRef.current < retryCount) {
          retriesRef.current++;
          retryTimeoutRef.current = setTimeout(
            fetchData, 
            1000 * Math.pow(2, retriesRef.current - 1)
          );
        } else {
          setError(err.message);
          setLoading(false);
          options.onError?.(err);
        }
      }
    }
  }, [url, options.retryCount, options.onSuccess, options.onError]);

  const refresh = useCallback(() => {
    retriesRef.current = 0;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    fetchData();
  }, [fetchData]);

  // Initial fetch and refresh interval setup
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
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return { data, loading, error, refresh };
}

// MouseTracker render prop component implementation
interface MouseTrackerProps {
  children: (position: MousePosition) => ReactNode;
  throttle?: number;
  relative?: boolean;
}

class MouseTracker extends Component<MouseTrackerProps, MousePosition> {
  private throttleTimeoutRef: NodeJS.Timeout | null = null;
  private elementRef = React.createRef<HTMLDivElement>();

  constructor(props: MouseTrackerProps) {
    super(props);
    
    this.state = {
      x: 0,
      y: 0,
    };
  }

  componentDidMount() {
    const element = this.props.relative ? this.elementRef.current : document;
    element?.addEventListener('mousemove', this.handleMouseMove);
  }

  componentWillUnmount() {
    const element = this.props.relative ? this.elementRef.current : document;
    element?.removeEventListener('mousemove', this.handleMouseMove);
    
    if (this.throttleTimeoutRef) {
      clearTimeout(this.throttleTimeoutRef);
    }
  }

  handleMouseMove = (event: MouseEvent): void => {
    if (this.props.throttle && this.throttleTimeoutRef) {
      return;
    }
    
    let x = event.clientX;
    let y = event.clientY;
    
    if (this.props.relative && this.elementRef.current) {
      const rect = this.elementRef.current.getBoundingClientRect();
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }
    
    this.setState({ x, y });
    
    if (this.props.throttle) {
      this.throttleTimeoutRef = setTimeout(() => {
        this.throttleTimeoutRef = null;
      }, this.props.throttle);
    }
  };

  render() {
    return (
      <div 
        ref={this.elementRef} 
        style={{ width: '100%', height: '100%', position: 'relative' }}
      >
        {this.props.children(this.state)}
      </div>
    );
  }
}

// useMouse hook - converted from MouseTracker
interface UseMouseOptions {
  throttle?: number;
  relative?: boolean;
  element?: React.RefObject<HTMLElement>;
}

function useMouse(options: UseMouseOptions = {}): MousePosition & { ref: React.RefObject<HTMLDivElement> } {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = options.element?.current || 
                   (options.relative ? elementRef.current : document);
    
    if (!element) return;
    
    const handleMouseMove = (event: MouseEvent) => {
      if (options.throttle && throttleRef.current) {
        return;
      }
      
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

// Counter render prop component implementation
interface CounterProps {
  children: (state: CounterState) => ReactNode;
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
}

class Counter extends Component<CounterProps, { count: number }> {
  constructor(props: CounterProps) {
    super(props);
    
    this.state = {
      count: props.initialValue || 0,
    };
  }

  increment = (): void => {
    this.setState(prevState => {
      const nextValue = prevState.count + (this.props.step || 1);
      const newValue = this.props.max !== undefined 
        ? Math.min(nextValue, this.props.max) 
        : nextValue;
      
      this.props.onChange?.(newValue);
      return { count: newValue };
    });
  };

  decrement = (): void => {
    this.setState(prevState => {
      const nextValue = prevState.count - (this.props.step || 1);
      const newValue = this.props.min !== undefined 
        ? Math.max(nextValue, this.props.min) 
        : nextValue;
      
      this.props.onChange?.(newValue);
      return { count: newValue };
    });
  };

  reset = (): void => {
    const initialValue = this.props.initialValue || 0;
    this.setState({ count: initialValue });
    this.props.onChange?.(initialValue);
  };

  render() {
    const counterState: CounterState = {
      count: this.state.count,
      increment: this.increment,
      decrement: this.decrement,
      reset: this.reset,
    };

    return this.props.children(counterState);
  }
}

// useCounter hook - converted from Counter
interface UseCounterOptions {
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
}

function useCounter(
  initialValue: number = 0,
  options: UseCounterOptions = {}
): CounterState {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(prevCount => {
      const nextValue = prevCount + (options.step || 1);
      const newValue = options.max !== undefined 
        ? Math.min(nextValue, options.max) 
        : nextValue;
      
      options.onChange?.(newValue);
      return newValue;
    });
  }, [options.step, options.max, options.onChange]);

  const decrement = useCallback(() => {
    setCount(prevCount => {
      const nextValue = prevCount - (options.step || 1);
      const newValue = options.min !== undefined 
        ? Math.max(nextValue, options.min) 
        : nextValue;
      
      options.onChange?.(newValue);
      return newValue;
    });
  }, [options.step, options.min, options.onChange]);

  const reset = useCallback(() => {
    setCount(initialValue);
    options.onChange?.(initialValue);
  }, [initialValue, options.onChange]);

  return { count, increment, decrement, reset };
}

// Toggle render prop component implementation
interface ToggleProps {
  children: (state: ToggleState) => ReactNode;
  initialValue?: boolean;
  onChange?: (value: boolean) => void;
}

class Toggle extends Component<ToggleProps, { isOn: boolean }> {
  constructor(props: ToggleProps) {
    super(props);
    
    this.state = {
      isOn: props.initialValue || false,
    };
  }

  toggle = (): void => {
    this.setState(prevState => {
      const newValue = !prevState.isOn;
      this.props.onChange?.(newValue);
      return { isOn: newValue };
    });
  };

  turnOn = (): void => {
    if (!this.state.isOn) {
      this.setState({ isOn: true });
      this.props.onChange?.(true);
    }
  };

  turnOff = (): void => {
    if (this.state.isOn) {
      this.setState({ isOn: false });
      this.props.onChange?.(false);
    }
  };

  render() {
    const toggleState: ToggleState = {
      isOn: this.state.isOn,
      toggle: this.toggle,
      turnOn: this.turnOn,
      turnOff: this.turnOff,
    };

    return this.props.children(toggleState);
  }
}

// useToggle hook - converted from Toggle
interface UseToggleOptions {
  onChange?: (value: boolean) => void;
}

function useToggle(
  initialValue: boolean = false,
  options: UseToggleOptions = {}
): ToggleState {
  const [isOn, setIsOn] = useState(initialValue);

  const toggle = useCallback(() => {
    setIsOn(prevIsOn => {
      const newValue = !prevIsOn;
      options.onChange?.(newValue);
      return newValue;
    });
  }, [options.onChange]);

  const turnOn = useCallback(() => {
    setIsOn(prevIsOn => {
      if (!prevIsOn) {
        options.onChange?.(true);
        return true;
      }
      return prevIsOn;
    });
  }, [options.onChange]);

  const turnOff = useCallback(() => {
    setIsOn(prevIsOn => {
      if (prevIsOn) {
        options.onChange?.(false);
        return false;
      }
      return prevIsOn;
    });
  }, [options.onChange]);

  return { isOn, toggle, turnOn, turnOff };
}

// Performance comparison utilities
interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  totalRenderTime: number;
  lastRenderTime: number;
}

function usePerformanceTracker(componentName: string): PerformanceMetrics {
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
    lastRenderTime: 0,
  });

  const startTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;
    
    const metrics = metricsRef.current;
    metrics.renderCount++;
    metrics.lastRenderTime = renderTime;
    metrics.totalRenderTime += renderTime;
    metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;
    
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(`${componentName} render exceeded 16ms: ${renderTime.toFixed(2)}ms`);
    }
  });

  // Reset start time for next render
  startTimeRef.current = performance.now();

  return metricsRef.current;
}

// Migration utilities
interface MigrationExample {
  renderPropVersion: ReactNode;
  hookVersion: ReactNode;
  description: string;
  performanceComparison?: {
    renderProp: PerformanceMetrics;
    hook: PerformanceMetrics;
  };
}

function createMigrationExample(
  name: string,
  renderPropComponent: ReactNode,
  hookComponent: ReactNode,
  description: string
): MigrationExample {
  return {
    renderPropVersion: renderPropComponent,
    hookVersion: hookComponent,
    description,
  };
}

// Backward compatibility wrapper
function withRenderProps<T>(
  hook: () => T,
  displayName?: string
): React.ComponentType<{ children: (value: T) => ReactNode }> {
  const WrappedComponent: React.FC<{ children: (value: T) => ReactNode }> = ({ children }) => {
    const value = hook();
    return <>{children(value)}</>;
  };

  WrappedComponent.displayName = displayName || `withRenderProps(${hook.name})`;
  return WrappedComponent;
}

// Performance comparison components
const RenderPropExample: React.FC = () => {
  const metrics = usePerformanceTracker('RenderPropExample');

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-purple-800">Render Props Pattern</h3>
      
      {/* DataProvider example */}
      <DataProvider<{ message: string; timestamp: number }>
        url="https://api.github.com/zen"
        refreshInterval={30000}
        retryCount={3}
      >
        {({ data, loading, error, refresh }) => (
          <div className="p-4 border rounded-lg bg-purple-50">
            <h4 className="font-medium mb-2">Data Fetching</h4>
            {loading && <div className="text-blue-600">Loading GitHub Zen...</div>}
            {error && <div className="text-red-600">Error: {error}</div>}
            {data && (
              <div className="space-y-2">
                <div className="text-green-700 font-medium">
                  Message: {typeof data === 'string' ? data : JSON.stringify(data)}
                </div>
                <button 
                  onClick={refresh}
                  className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        )}
      </DataProvider>

      {/* MouseTracker example */}
      <MouseTracker throttle={16} relative>
        {({ x, y }) => (
          <div className="p-4 border rounded-lg h-32 bg-purple-50 relative cursor-crosshair">
            <h4 className="font-medium mb-2">Mouse Tracking (Relative)</h4>
            <div className="text-sm text-gray-600">
              Position: ({x.toFixed(0)}, {y.toFixed(0)})
            </div>
            <div 
              className="absolute w-2 h-2 bg-purple-500 rounded-full pointer-events-none"
              style={{ 
                left: x - 4, 
                top: y - 4,
                transform: 'translate(0, -20px)' 
              }}
            />
          </div>
        )}
      </MouseTracker>

      {/* Counter example */}
      <Counter initialValue={5} min={0} max={10} step={1}>
        {({ count, increment, decrement, reset }) => (
          <div className="p-4 border rounded-lg bg-purple-50">
            <h4 className="font-medium mb-2">Counter (0-10)</h4>
            <div className="flex items-center space-x-3">
              <button 
                onClick={decrement}
                disabled={count <= 0}
                className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="text-xl font-bold min-w-8 text-center">{count}</span>
              <button 
                onClick={increment}
                disabled={count >= 10}
                className="px-3 py-1 bg-green-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
              <button 
                onClick={reset}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </Counter>

      {/* Toggle example */}
      <Toggle initialValue={false}>
        {({ isOn, toggle, turnOn, turnOff }) => (
          <div className="p-4 border rounded-lg bg-purple-50">
            <h4 className="font-medium mb-2">Toggle Control</h4>
            <div className="flex items-center space-x-3">
              <span className="text-sm">Status: </span>
              <span className={`font-medium ${isOn ? 'text-green-600' : 'text-red-600'}`}>
                {isOn ? 'ON' : 'OFF'}
              </span>
              <button 
                onClick={toggle}
                className={`px-3 py-1 rounded text-white ${isOn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                Toggle
              </button>
              <button 
                onClick={turnOn}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Turn On
              </button>
              <button 
                onClick={turnOff}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Turn Off
              </button>
            </div>
          </div>
        )}
      </Toggle>

      {/* Performance metrics display */}
      <div className="text-xs text-purple-600 bg-purple-100 p-2 rounded">
        <strong>Render Props Performance:</strong> {metrics.renderCount} renders | 
        Avg: {metrics.averageRenderTime.toFixed(2)}ms | 
        Last: {metrics.lastRenderTime.toFixed(2)}ms
      </div>
    </div>
  );
};

const HookExample: React.FC = () => {
  const metrics = usePerformanceTracker('HookExample');
  
  // Use hooks
  const data = useData<string>('https://api.github.com/zen', {
    refreshInterval: 30000,
    retryCount: 3,
  });
  
  const mouse = useMouse({ throttle: 16, relative: true });
  const counter = useCounter(5, { min: 0, max: 10, step: 1 });
  const toggle = useToggle(false);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-green-800">Hooks Pattern</h3>
      
      {/* Data example */}
      <div className="p-4 border rounded-lg bg-green-50">
        <h4 className="font-medium mb-2">Data Fetching</h4>
        {data.loading && <div className="text-blue-600">Loading GitHub Zen...</div>}
        {data.error && <div className="text-red-600">Error: {data.error}</div>}
        {data.data && (
          <div className="space-y-2">
            <div className="text-green-700 font-medium">
              Message: {data.data}
            </div>
            <button 
              onClick={data.refresh}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Mouse tracking example */}
      <div ref={mouse.ref} className="p-4 border rounded-lg h-32 bg-green-50 relative cursor-crosshair">
        <h4 className="font-medium mb-2">Mouse Tracking (Relative)</h4>
        <div className="text-sm text-gray-600">
          Position: ({mouse.x.toFixed(0)}, {mouse.y.toFixed(0)})
        </div>
        <div 
          className="absolute w-2 h-2 bg-green-500 rounded-full pointer-events-none"
          style={{ 
            left: mouse.x - 4, 
            top: mouse.y - 4,
            transform: 'translate(0, -20px)' 
          }}
        />
      </div>

      {/* Counter example */}
      <div className="p-4 border rounded-lg bg-green-50">
        <h4 className="font-medium mb-2">Counter (0-10)</h4>
        <div className="flex items-center space-x-3">
          <button 
            onClick={counter.decrement}
            disabled={counter.count <= 0}
            className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -
          </button>
          <span className="text-xl font-bold min-w-8 text-center">{counter.count}</span>
          <button 
            onClick={counter.increment}
            disabled={counter.count >= 10}
            className="px-3 py-1 bg-green-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
          <button 
            onClick={counter.reset}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Toggle example */}
      <div className="p-4 border rounded-lg bg-green-50">
        <h4 className="font-medium mb-2">Toggle Control</h4>
        <div className="flex items-center space-x-3">
          <span className="text-sm">Status: </span>
          <span className={`font-medium ${toggle.isOn ? 'text-green-600' : 'text-red-600'}`}>
            {toggle.isOn ? 'ON' : 'OFF'}
          </span>
          <button 
            onClick={toggle.toggle}
            className={`px-3 py-1 rounded text-white ${toggle.isOn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            Toggle
          </button>
          <button 
            onClick={toggle.turnOn}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Turn On
          </button>
          <button 
            onClick={toggle.turnOff}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Turn Off
          </button>
        </div>
      </div>

      {/* Performance metrics display */}
      <div className="text-xs text-green-600 bg-green-100 p-2 rounded">
        <strong>Hooks Performance:</strong> {metrics.renderCount} renders | 
        Avg: {metrics.averageRenderTime.toFixed(2)}ms | 
        Last: {metrics.lastRenderTime.toFixed(2)}ms
      </div>
    </div>
  );
};

// Backward compatibility demonstration
const BackwardCompatibilityExample: React.FC = () => {
  // Create backward compatible versions
  const DataProviderCompat = useMemo(() => 
    withRenderProps(() => useData('/api/test'), 'DataProvider'), 
    []
  );
  
  const CounterCompat = useMemo(() => 
    withRenderProps(() => useCounter(0), 'Counter'), 
    []
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-blue-800">Backward Compatibility</h3>
      <p className="text-sm text-gray-600">
        Using hooks with render prop APIs for gradual migration
      </p>
      
      <DataProviderCompat>
        {({ data, loading, error }) => (
          <div className="p-3 border rounded bg-blue-50">
            <h5 className="font-medium">Hook-powered DataProvider</h5>
            <div className="text-sm">
              {loading && 'Loading...'} 
              {error && `Error: ${error}`}
              {data && 'Data loaded successfully'}
            </div>
          </div>
        )}
      </DataProviderCompat>
      
      <CounterCompat>
        {({ count, increment, decrement }) => (
          <div className="p-3 border rounded bg-blue-50">
            <h5 className="font-medium">Hook-powered Counter</h5>
            <div className="flex items-center space-x-2">
              <button onClick={decrement} className="px-2 py-1 bg-red-400 text-white rounded text-sm">-</button>
              <span>{count}</span>
              <button onClick={increment} className="px-2 py-1 bg-green-400 text-white rounded text-sm">+</button>
            </div>
          </div>
        )}
      </CounterCompat>
    </div>
  );
};

// Main demo component
export default function RenderPropsToHooksDemo() {
  const [selectedPattern, setSelectedPattern] = useState<'render-props' | 'hooks' | 'comparison' | 'compatibility'>('comparison');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Render Props to Hooks Migration
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Learn to migrate from render props patterns to modern hooks with performance comparisons
            and backward compatibility strategies.
          </p>
        </div>

        {/* Pattern selection */}
        <div className="flex justify-center space-x-4 flex-wrap">
          {[
            { key: 'render-props', label: 'Render Props' },
            { key: 'hooks', label: 'Hooks' },
            { key: 'comparison', label: 'Side by Side' },
            { key: 'compatibility', label: 'Compatibility' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedPattern(key as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedPattern === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Pattern content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {selectedPattern === 'render-props' && <RenderPropExample />}
            {selectedPattern === 'hooks' && <HookExample />}
            {selectedPattern === 'comparison' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RenderPropExample />
                <HookExample />
              </div>
            )}
            {selectedPattern === 'compatibility' && <BackwardCompatibilityExample />}
          </div>
        </div>

        {/* Migration guidance */}
        <div className="bg-gradient-to-r from-purple-50 to-green-50 p-6 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-3">Migration Benefits & Strategy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-purple-700">Hook Benefits</h4>
              <ul className="text-sm text-purple-600 space-y-1">
                <li>• Simpler component composition and reuse</li>
                <li>• Better TypeScript integration and inference</li>
                <li>• Reduced component tree depth and complexity</li>
                <li>• Improved developer experience and debugging</li>
                <li>• Better performance with fewer re-renders</li>
                <li>• Easier testing with react-hooks-testing-library</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-green-700">Migration Strategy</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Start with simple render props (Counter, Toggle)</li>
                <li>• Convert complex ones (DataProvider) gradually</li>
                <li>• Use withRenderProps wrapper for compatibility</li>
                <li>• Migrate consumers to hooks incrementally</li>
                <li>• Monitor performance improvements</li>
                <li>• Remove render prop versions when safe</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-white rounded border-l-4 border-blue-500">
            <h5 className="font-medium text-gray-800 mb-2">Performance Comparison</h5>
            <p className="text-sm text-gray-600">
              Notice how hooks typically show fewer renders and better performance metrics. 
              The render props pattern can cause additional re-renders due to inline function creation,
              while hooks with proper memoization are more efficient.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}