# Exercise 01: Vue 3 Composition API Patterns

## Overview
Master Vue 3's Composition API and advanced patterns including reactivity system, composables, and state composition. This exercise focuses on building a comprehensive understanding of Vue's reactive architecture and how to create reusable composition functions that demonstrate framework-agnostic expertise.

## Learning Objectives
- Master Vue 3 Composition API fundamentals
- Implement custom composables with TypeScript
- Understand Vue's reactivity system deeply
- Build reusable composition patterns
- Integrate Vue patterns with React concepts
- Optimize Vue applications for production

## Key Concepts

### Composition API Fundamentals
- **Setup Function**: The entry point for Composition API
- **Reactive References**: `ref()`, `reactive()`, `toRef()`, `toRefs()`
- **Computed Properties**: `computed()` with dependency tracking
- **Watchers**: `watch()`, `watchEffect()`, `watchSyncEffect()`
- **Lifecycle Hooks**: `onMounted()`, `onUpdated()`, `onUnmounted()`

### Reactivity System
- **Proxy-based Reactivity**: Deep reactive object tracking
- **Dependency Tracking**: Automatic dependency collection
- **Effect System**: Reactive effect scheduling and execution
- **Reactive References**: Primitive value reactivity with `.value`
- **Computed Caching**: Intelligent computed property caching

### Composables Pattern
- **Reusable Logic**: Extracting and sharing reactive logic
- **Composition**: Combining multiple composables
- **Lifecycle Integration**: Composables with lifecycle hooks
- **State Isolation**: Preventing unwanted state sharing
- **TypeScript Integration**: Fully typed composable functions

## Implementation Requirements

### 1. ComposableManager
```typescript
class ComposableManager {
  // Composable registration and lifecycle
  // Dependency injection and resolution
  // Performance tracking and metrics
  // Hot reload and development tools
}
```

### 2. ReactivitySystem
```typescript
class ReactivitySystem {
  // Reactive reference creation
  // Computed property management
  // Watcher and effect handling
  // Dependency graph tracking
}
```

### 3. LifecycleHandler
```typescript
class LifecycleHandler {
  // Lifecycle hook registration
  // Component lifecycle tracking
  // Cleanup and disposal
  // Performance monitoring
}
```

### 4. StateComposer
```typescript
class StateComposer {
  // State composition patterns
  // Provide/inject implementation
  // Shared state management
  // State isolation utilities
}
```

## Technical Implementation

### Vue Composable Structure
```typescript
interface VueComposable<T = any> {
  name: string;
  setup: () => T;
  dependencies: string[];
  cleanup?: () => void;
  meta?: {
    reactive: boolean;
    computed: boolean;
    watchers: boolean;
  };
}
```

### Reactivity Tracking
```typescript
interface ReactiveMetrics {
  refsCount: number;
  reactiveObjectsCount: number;
  computedCount: number;
  watchersCount: number;
  effectsCount: number;
  memoryUsage: number;
}
```

### Lifecycle Events
```typescript
interface LifecycleEvent {
  name: string;
  timestamp: number;
  phase: 'created' | 'mounted' | 'updated' | 'unmounted';
  component: string;
  data?: any;
}
```

### Composition Patterns
```typescript
interface CompositionContext {
  provide<T>(key: string, value: T): void;
  inject<T>(key: string, defaultValue?: T): T | undefined;
  createShared<T>(key: string, factory: () => T): T;
  isolate<T>(factory: () => T): T;
}
```

## Advanced Features

### 1. Custom Composables
- **useCounter**: Reactive counter with increment/decrement
- **useToggle**: Boolean state toggle with utilities
- **useLocalStorage**: Reactive localStorage integration
- **useFetch**: Data fetching with loading and error states
- **useEventListener**: Event listener management with cleanup

### 2. Reactivity Patterns
- **Shallow Reactivity**: `shallowRef()`, `shallowReactive()`
- **Read-only State**: `readonly()` wrapper for immutable views
- **Reactive Collections**: `Map`, `Set`, `Array` reactivity
- **Reactive Transformations**: `computed()` chains and derivations
- **Effect Scheduling**: Custom effect scheduling and batching

### 3. Performance Optimization
- **Lazy Evaluation**: Computed properties with lazy loading
- **Effect Batching**: Batched reactive updates
- **Memory Management**: Automatic cleanup and disposal
- **Tree Shaking**: Composable tree shaking optimization
- **Bundle Splitting**: Dynamic composable loading

### 4. Development Tools
- **Composable Inspector**: Runtime composable inspection
- **Reactivity Debugger**: Dependency tracking visualization
- **Performance Profiler**: Reactive system performance analysis
- **Hot Reload**: Development-time composable replacement
- **Type Checking**: Full TypeScript integration

## Vue vs React Comparison

### Reactivity Systems
```typescript
// Vue: Automatic dependency tracking
const count = ref(0);
const doubled = computed(() => count.value * 2);
watch(count, (newValue) => console.log(newValue));

// React: Manual dependency management
const [count, setCount] = useState(0);
const doubled = useMemo(() => count * 2, [count]);
useEffect(() => console.log(count), [count]);
```

### Composition Patterns
```typescript
// Vue: Composable functions
function useCounter(initialValue = 0) {
  const count = ref(initialValue);
  const increment = () => count.value++;
  const decrement = () => count.value--;
  return { count, increment, decrement };
}

// React: Custom hooks
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  return { count, increment, decrement };
}
```

## Implementation Strategy

### 1. Composable Creation
```typescript
// Define composable interface
interface UseCounterReturn {
  count: Ref<number>;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  isEven: ComputedRef<boolean>;
}

// Implement composable
function useCounter(initial = 0): UseCounterReturn {
  const count = ref(initial);
  
  const increment = () => count.value++;
  const decrement = () => count.value--;
  const reset = () => count.value = initial;
  const isEven = computed(() => count.value % 2 === 0);
  
  return { count, increment, decrement, reset, isEven };
}
```

### 2. Reactivity Management
```typescript
class ReactivityManager {
  private effects = new Set<Effect>();
  private computeds = new Map<string, ComputedRef>();
  private watchers = new Set<WatchStopHandle>();
  
  createReactive<T extends object>(obj: T): T {
    return reactive(obj);
  }
  
  createRef<T>(value: T): Ref<T> {
    return ref(value);
  }
  
  createComputed<T>(getter: () => T): ComputedRef<T> {
    const computed = computed(getter);
    this.computeds.set(generateId(), computed);
    return computed;
  }
  
  watch<T>(
    source: WatchSource<T>,
    callback: WatchCallback<T>,
    options?: WatchOptions
  ): WatchStopHandle {
    const stopHandle = watch(source, callback, options);
    this.watchers.add(stopHandle);
    return stopHandle;
  }
}
```

### 3. State Composition
```typescript
// Provide/Inject pattern
const ThemeKey = Symbol('theme');

function provideTheme(theme: Theme) {
  provide(ThemeKey, theme);
}

function useTheme(): Theme {
  const theme = inject(ThemeKey);
  if (!theme) {
    throw new Error('useTheme must be used within a theme provider');
  }
  return theme;
}

// Shared state management
function createSharedState<T>(key: string, initialValue: T) {
  const state = ref(initialValue);
  const setState = (newValue: T) => {
    state.value = newValue;
  };
  
  return {
    state: readonly(state),
    setState,
    subscribe: (callback: (value: T) => void) => {
      return watchEffect(() => callback(state.value));
    }
  };
}
```

### 4. Performance Monitoring
```typescript
class VuePerformanceMonitor {
  private metrics: ReactivityMetrics = {
    refsCount: 0,
    reactiveObjectsCount: 0,
    computedCount: 0,
    watchersCount: 0,
    effectsCount: 0,
    memoryUsage: 0
  };
  
  trackRef() {
    this.metrics.refsCount++;
    this.updateMemoryUsage();
  }
  
  trackReactive() {
    this.metrics.reactiveObjectsCount++;
    this.updateMemoryUsage();
  }
  
  trackComputed() {
    this.metrics.computedCount++;
    this.updateMemoryUsage();
  }
  
  getMetrics(): ReactivityMetrics {
    return { ...this.metrics };
  }
  
  private updateMemoryUsage() {
    // Estimate memory usage based on reactive objects
    this.metrics.memoryUsage = (
      this.metrics.refsCount * 8 +
      this.metrics.reactiveObjectsCount * 64 +
      this.metrics.computedCount * 32 +
      this.metrics.watchersCount * 16
    );
  }
}
```

## Migration Patterns

### React to Vue Migration
```typescript
// React component
function ReactCounter() {
  const [count, setCount] = useState(0);
  const doubled = useMemo(() => count * 2, [count]);
  
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);
  
  return (
    <div>
      <p>{count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}

// Vue equivalent
function VueCounter() {
  const count = ref(0);
  const doubled = computed(() => count.value * 2);
  
  watchEffect(() => {
    document.title = `Count: ${count.value}`;
  });
  
  const increment = () => count.value++;
  
  return { count, doubled, increment };
}
```

### Vue to React Migration
```typescript
// Vue composable
function useVueCounter(initial = 0) {
  const count = ref(initial);
  const increment = () => count.value++;
  const decrement = () => count.value--;
  
  return { count, increment, decrement };
}

// React hook equivalent
function useReactCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  
  return { count, increment, decrement };
}
```

## Testing Strategy

### Composable Testing
```typescript
import { renderHook, act } from '@testing-library/react-hooks';

describe('useCounter composable', () => {
  test('should increment count', () => {
    const { result } = renderHook(() => useCounter(0));
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
  
  test('should track reactivity', () => {
    const { result } = renderHook(() => useCounter(0));
    
    expect(result.current.isEven).toBe(true);
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.isEven).toBe(false);
  });
});
```

### Integration Testing
```typescript
describe('Vue integration patterns', () => {
  test('should provide and inject state', () => {
    const wrapper = mount(ParentComponent);
    const child = wrapper.findComponent(ChildComponent);
    
    expect(child.vm.injectedValue).toBeDefined();
    expect(child.vm.injectedValue.theme).toBe('dark');
  });
  
  test('should cleanup effects on unmount', () => {
    const cleanup = jest.fn();
    const wrapper = mount(ComponentWithEffects);
    
    wrapper.unmount();
    
    expect(cleanup).toHaveBeenCalled();
  });
});
```

## Production Considerations

### Bundle Optimization
- **Tree Shaking**: Remove unused composables and utilities
- **Code Splitting**: Dynamic imports for large composables
- **Bundle Analysis**: Track composable bundle impact
- **Dead Code Elimination**: Remove unused reactive references

### Performance Monitoring
- **Reactive Updates**: Track excessive reactive updates
- **Memory Leaks**: Monitor for unreleased reactive objects
- **Effect Performance**: Profile expensive computed properties
- **Bundle Size**: Monitor composable bundle growth

### Best Practices
1. **Single Responsibility**: Each composable should have one clear purpose
2. **Consistent Naming**: Use consistent naming conventions across composables
3. **Type Safety**: Provide full TypeScript coverage for all composables
4. **Documentation**: Document composable APIs and usage patterns
5. **Testing**: Comprehensive unit and integration testing coverage

## Deliverables

1. **ComposableManager**: Registration, lifecycle, and dependency management system
2. **ReactivitySystem**: Reactive references, computed properties, and watchers
3. **LifecycleHandler**: Component lifecycle tracking and management
4. **StateComposer**: State composition and provide/inject patterns
5. **Custom Composables**: Reusable composition functions with TypeScript
6. **Performance Monitor**: Reactivity system performance analysis
7. **Migration Guide**: React ↔ Vue migration patterns and strategies

Focus on building production-ready Vue 3 composition patterns that demonstrate deep understanding of reactive programming and provide clear migration paths between React and Vue ecosystems.