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

// TODO: Implement DataProvider render prop component
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
    
    // TODO: Initialize state
    this.state = {
      data: null,
      loading: false,
      error: null,
      refresh: this.fetchData,
    };
  }

  componentDidMount() {
    // TODO: Start data fetching when component mounts
    // Set up refresh interval if provided
  }

  componentDidUpdate(prevProps: DataProviderProps<T>) {
    // TODO: Refetch data if URL changes
    // Update refresh interval if it changes
  }

  componentWillUnmount() {
    // TODO: Clean up intervals and abort ongoing requests
  }

  fetchData = async (): Promise<void> => {
    // TODO: Implement data fetching logic
    // Handle loading states
    // Implement error handling and retries
    // Support request abortion
    // Call onSuccess/onError callbacks
  };

  render() {
    // TODO: Call children function with current state
    return this.props.children(this.state);
  }
}

// TODO: Convert DataProvider to useData hook
function useData<T>(
  url: string,
  options: {
    refreshInterval?: number;
    retryCount?: number;
    enabled?: boolean;
    onError?: (error: Error) => void;
    onSuccess?: (data: T) => void;
  } = {}
): DataState<T> {
  // TODO: Implement hook version of DataProvider functionality
  // Use useState for data, loading, error state
  // Use useEffect for data fetching and cleanup
  // Use useCallback for refresh function
  // Implement same retry and interval logic as render prop version

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // TODO: Implement data fetching with same logic as render prop
  }, [url, options.retryCount, options.onError, options.onSuccess]);

  const refresh = useCallback(() => {
    // TODO: Trigger data refresh
  }, [fetchData]);

  useEffect(() => {
    // TODO: Set up data fetching and intervals
    // Handle cleanup
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
  };
}

// TODO: Implement MouseTracker render prop component
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
    
    // TODO: Initialize mouse position state
    this.state = {
      x: 0,
      y: 0,
    };
  }

  componentDidMount() {
    // TODO: Add mouse move event listener
    // Handle relative positioning if enabled
  }

  componentWillUnmount() {
    // TODO: Clean up event listeners and timeouts
  }

  handleMouseMove = (event: MouseEvent): void => {
    // TODO: Update mouse position with throttling
    // Calculate relative position if needed
  };

  render() {
    // TODO: Render wrapper div and call children with position
    return (
      <div ref={this.elementRef} style={{ width: '100%', height: '100%' }}>
        {this.props.children(this.state)}
      </div>
    );
  }
}

// TODO: Convert MouseTracker to useMouse hook
function useMouse(options: {
  throttle?: number;
  relative?: boolean;
  element?: React.RefObject<HTMLElement>;
} = {}): MousePosition & { ref: React.RefObject<HTMLDivElement> } {
  // TODO: Implement hook version of MouseTracker
  // Use useState for position
  // Use useRef for element reference
  // Use useEffect for event listeners
  // Implement same throttling logic

  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // TODO: Set up mouse move listener
    // Handle cleanup
  }, []);

  return {
    ...position,
    ref,
  };
}

// TODO: Implement Counter render prop component
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
    
    // TODO: Initialize count state
    this.state = {
      count: props.initialValue || 0,
    };
  }

  increment = (): void => {
    // TODO: Implement increment with bounds checking
    // Call onChange if provided
  };

  decrement = (): void => {
    // TODO: Implement decrement with bounds checking
    // Call onChange if provided
  };

  reset = (): void => {
    // TODO: Reset to initial value
    // Call onChange if provided
  };

  render() {
    // TODO: Call children with state and methods
    const counterState: CounterState = {
      count: this.state.count,
      increment: this.increment,
      decrement: this.decrement,
      reset: this.reset,
    };

    return this.props.children(counterState);
  }
}

// TODO: Convert Counter to useCounter hook
function useCounter(
  initialValue: number = 0,
  options: {
    min?: number;
    max?: number;
    step?: number;
    onChange?: (value: number) => void;
  } = {}
): CounterState {
  // TODO: Implement hook version of Counter
  // Use useState for count
  // Use useCallback for methods
  // Implement same bounds checking logic

  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    // TODO: Implement increment with bounds
  }, [count, options.max, options.step, options.onChange]);

  const decrement = useCallback(() => {
    // TODO: Implement decrement with bounds
  }, [count, options.min, options.step, options.onChange]);

  const reset = useCallback(() => {
    // TODO: Reset to initial value
  }, [initialValue, options.onChange]);

  return {
    count,
    increment,
    decrement,
    reset,
  };
}

// TODO: Implement Toggle render prop component
interface ToggleProps {
  children: (state: ToggleState) => ReactNode;
  initialValue?: boolean;
  onChange?: (value: boolean) => void;
}

class Toggle extends Component<ToggleProps, { isOn: boolean }> {
  constructor(props: ToggleProps) {
    super(props);
    
    // TODO: Initialize toggle state
    this.state = {
      isOn: props.initialValue || false,
    };
  }

  toggle = (): void => {
    // TODO: Toggle state
    // Call onChange if provided
  };

  turnOn = (): void => {
    // TODO: Set to true
    // Call onChange if provided
  };

  turnOff = (): void => {
    // TODO: Set to false
    // Call onChange if provided
  };

  render() {
    // TODO: Call children with state and methods
    const toggleState: ToggleState = {
      isOn: this.state.isOn,
      toggle: this.toggle,
      turnOn: this.turnOn,
      turnOff: this.turnOff,
    };

    return this.props.children(toggleState);
  }
}

// TODO: Convert Toggle to useToggle hook
function useToggle(
  initialValue: boolean = false,
  options: {
    onChange?: (value: boolean) => void;
  } = {}
): ToggleState {
  // TODO: Implement hook version of Toggle
  // Use useState for isOn
  // Use useCallback for methods

  const [isOn, setIsOn] = useState(initialValue);

  const toggle = useCallback(() => {
    // TODO: Toggle state
  }, [isOn, options.onChange]);

  const turnOn = useCallback(() => {
    // TODO: Set to true
  }, [options.onChange]);

  const turnOff = useCallback(() => {
    // TODO: Set to false
  }, [options.onChange]);

  return {
    isOn,
    toggle,
    turnOn,
    turnOff,
  };
}

// TODO: Implement performance comparison utilities
interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  totalRenderTime: number;
  lastRenderTime: number;
}

function usePerformanceTracker(componentName: string): PerformanceMetrics {
  // TODO: Track component performance metrics
  // Use useRef to persist metrics across renders
  // Use performance.now() for timing
  // Calculate averages and totals

  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
    lastRenderTime: 0,
  });

  const startTimeRef = useRef<number>(0);

  // TODO: Start timing at beginning of render
  startTimeRef.current = performance.now();

  useEffect(() => {
    // TODO: End timing and update metrics
    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;
    
    // TODO: Update metrics
  });

  return metricsRef.current;
}

// TODO: Implement migration utilities
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
  // TODO: Create comparison example
  // Include performance tracking
  // Provide migration guidance

  return {
    renderPropVersion: renderPropComponent,
    hookVersion: hookComponent,
    description,
  };
}

// TODO: Implement backward compatibility wrapper
function withRenderProps<T>(
  hook: () => T,
  displayName?: string
): React.ComponentType<{ children: (value: T) => ReactNode }> {
  // TODO: Create HOC that wraps hook for render prop compatibility
  // Useful for gradual migration

  const WrappedComponent: React.FC<{ children: (value: T) => ReactNode }> = ({ children }) => {
    // TODO: Use hook and call children with result
    const value = hook();
    return <>{children(value)}</>;
  };

  WrappedComponent.displayName = displayName || 'withRenderProps(Hook)';
  return WrappedComponent;
}

// Performance comparison components
const RenderPropExample: React.FC = () => {
  // TODO: Implement render prop usage examples
  const metrics = usePerformanceTracker('RenderPropExample');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Render Props Pattern</h3>
      
      {/* TODO: DataProvider example */}
      <DataProvider<{ message: string; timestamp: number }>
        url="/api/example"
        refreshInterval={5000}
      >
        {({ data, loading, error, refresh }) => (
          <div className="p-4 border rounded">
            {/* TODO: Render data state */}
          </div>
        )}
      </DataProvider>

      {/* TODO: MouseTracker example */}
      <MouseTracker throttle={16}>
        {({ x, y }) => (
          <div className="p-4 border rounded h-32 bg-blue-50">
            {/* TODO: Show mouse position */}
          </div>
        )}
      </MouseTracker>

      {/* TODO: Counter example */}
      <Counter initialValue={0} min={0} max={10}>
        {({ count, increment, decrement, reset }) => (
          <div className="p-4 border rounded">
            {/* TODO: Render counter controls */}
          </div>
        )}
      </Counter>

      {/* TODO: Performance metrics display */}
      <div className="text-xs text-gray-500">
        Renders: {metrics.renderCount} | Avg: {metrics.averageRenderTime.toFixed(2)}ms
      </div>
    </div>
  );
};

const HookExample: React.FC = () => {
  // TODO: Implement hook usage examples
  const metrics = usePerformanceTracker('HookExample');
  
  // TODO: Use hooks
  const data = useData<{ message: string; timestamp: number }>('/api/example', {
    refreshInterval: 5000,
  });
  
  const mouse = useMouse({ throttle: 16 });
  const counter = useCounter(0, { min: 0, max: 10 });
  const toggle = useToggle(false);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Hooks Pattern</h3>
      
      {/* TODO: Data example */}
      <div className="p-4 border rounded">
        {/* TODO: Render data state */}
      </div>

      {/* TODO: Mouse tracking example */}
      <div ref={mouse.ref} className="p-4 border rounded h-32 bg-green-50">
        {/* TODO: Show mouse position */}
      </div>

      {/* TODO: Counter example */}
      <div className="p-4 border rounded">
        {/* TODO: Render counter controls */}
      </div>

      {/* TODO: Toggle example */}
      <div className="p-4 border rounded">
        {/* TODO: Render toggle controls */}
      </div>

      {/* TODO: Performance metrics display */}
      <div className="text-xs text-gray-500">
        Renders: {metrics.renderCount} | Avg: {metrics.averageRenderTime.toFixed(2)}ms
      </div>
    </div>
  );
};

// Main demo component
export default function RenderPropsToHooksDemo() {
  const [selectedPattern, setSelectedPattern] = useState<'render-props' | 'hooks' | 'comparison'>('comparison');

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
        <div className="flex justify-center space-x-4">
          {[
            { key: 'render-props', label: 'Render Props' },
            { key: 'hooks', label: 'Hooks' },
            { key: 'comparison', label: 'Side by Side' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedPattern(key as any)}
              className={"px-6 py-3 rounded-lg font-medium transition-colors " + (
                selectedPattern === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              )}
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
          </div>
        </div>

        {/* Migration guidance */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Migration Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Simpler component composition and reuse</li>
              <li>• Better TypeScript integration and inference</li>
              <li>• Reduced component tree depth</li>
              <li>• Improved developer experience</li>
            </ul>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Better performance with fewer re-renders</li>
              <li>• Easier testing and debugging</li>
              <li>• More intuitive data flow</li>
              <li>• Gradual migration strategies available</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}