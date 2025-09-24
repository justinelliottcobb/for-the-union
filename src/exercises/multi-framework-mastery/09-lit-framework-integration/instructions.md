# Lit Framework Integration

Master integrating Lit components across different frameworks with comprehensive event communication, state synchronization, and performance optimization.

## Learning Objectives

By completing this exercise, you will:

- Build framework-agnostic components that work seamlessly across React, Vue, Angular
- Implement cross-framework event communication and state synchronization
- Create adapter patterns for framework-specific integration
- Design hydration strategies for SSR environments
- Master performance optimization for multi-framework scenarios
- Build comprehensive integration testing and deployment strategies

## Exercise Overview

You'll create a comprehensive framework integration system that includes:

1. **Framework Adapters**: Universal adapter pattern for React, Vue, and Angular integration
2. **Event Communication**: Global event bus with middleware and state synchronization
3. **Integration Testing**: Cross-framework testing utilities and performance monitoring
4. **Deployment Strategies**: Multi-target deployment with automated CI/CD pipelines

## Key Concepts

### 1. Framework Adapter Pattern

Adapters provide a consistent interface for integrating Lit components across frameworks:

```typescript
export interface FrameworkAdapter<T = any> {
  mount(element: HTMLElement, props: T): void;
  unmount(element: HTMLElement): void;
  updateProps(element: HTMLElement, props: T): void;
  getComponent(): any;
}
```

### 2. React Integration

```typescript
const ReactAdapter = forwardRef<HTMLElement, Props>((props, ref) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      // Set properties and event listeners
      Object.entries(props).forEach(([key, value]) => {
        if (key.startsWith('on')) {
          const eventName = key.slice(2).toLowerCase();
          elementRef.current.addEventListener(eventName, value);
        } else {
          elementRef.current[key] = value;
        }
      });
    }
  }, [props]);

  return React.createElement('my-lit-component', { ref: elementRef });
});
```

### 3. Vue Integration

```typescript
export const VueComponent = {
  props: ['message', 'count'],
  emits: ['custom-event'],
  mounted() {
    // Set properties
    Object.entries(this.$props).forEach(([key, value]) => {
      this.$el[key] = value;
    });
    
    // Listen for events
    this.$el.addEventListener('custom-event', (event) => {
      this.$emit('custom-event', event.detail);
    });
  },
  render() {
    return h('my-lit-component', this.$attrs);
  }
};
```

### 4. Global Event Communication

```typescript
export class GlobalEventBus {
  emit(eventName: string, data?: any): void {
    const event = new CustomEvent(eventName, { 
      detail: data, 
      bubbles: true, 
      composed: true 
    });
    this.eventTarget.dispatchEvent(event);
  }

  on(eventName: string, callback: Function): () => void {
    this.eventTarget.addEventListener(eventName, callback);
    return () => this.eventTarget.removeEventListener(eventName, callback);
  }
}
```

## Implementation Requirements

### 1. Universal Adapter System

Create framework adapters that provide:

- **Property Binding**: Convert framework props to web component properties
- **Event Handling**: Bridge custom events to framework event systems
- **Lifecycle Management**: Handle mounting, updating, and unmounting
- **TypeScript Support**: Full type safety for all framework integrations

#### React Adapter Features:
- forwardRef support for imperative component access
- useEffect-based lifecycle management  
- Event prop conversion (onClick → click event listener)
- React 18 concurrent features compatibility

#### Vue Adapter Features:
- Composition API support
- Reactive prop binding
- Emit event bridging
- Vue 3 teleport and suspense compatibility

#### Angular Adapter Features:
- Component decorator integration
- Change detection optimization
- Dependency injection compatibility
- Angular Universal SSR support

### 2. Cross-Framework Event System

Build a global event bus with:

- **Middleware Pipeline**: Process events before emission (logging, validation, transformation)
- **Event Routing**: Route events between different parts of the application
- **State Synchronization**: Share state across framework boundaries
- **Debugging Tools**: Event history, subscriber tracking, performance monitoring

#### Event Bus Features:
```typescript
// Middleware for event processing
class LoggingMiddleware implements EventMiddleware {
  process(event: CustomEvent): CustomEvent {
    console.log(`Event: ${event.type}`, event.detail);
    return event;
  }
}

// State synchronization
class StateSyncMiddleware implements EventMiddleware {
  setState(key: string, value: any): void {
    this.stateStore.set(key, value);
    this.eventBus.emit('state-changed', { key, value });
  }
}
```

### 3. SSR Hydration Strategies

Implement hydration strategies for server-side rendering:

#### Progressive Hydration
```typescript
class ProgressiveHydrationStrategy {
  async hydrate(element: HTMLElement, props: any): Promise<void> {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.hydrateImmediately(entry.target, props);
        }
      });
    });
    observer.observe(element);
  }
}
```

#### Idle Hydration
```typescript
class IdleHydrationStrategy {
  async hydrate(element: HTMLElement, props: any): Promise<void> {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.hydrateImmediately(element, props));
    } else {
      setTimeout(() => this.hydrateImmediately(element, props), 50);
    }
  }
}
```

### 4. Integration Testing Framework

Create comprehensive testing utilities:

#### Cross-Framework Test Runner
```typescript
export class CrossFrameworkTester {
  async testInReact(Component: React.ComponentType, props: any, testFn: Function) {
    const { container } = render(React.createElement(Component, props));
    const litElement = container.querySelector('[is]');
    await testFn(litElement, container);
  }

  async testInVue(Component: any, props: any, testFn: Function) {
    const wrapper = mount(Component, { props });
    await testFn(wrapper.element, wrapper);
    wrapper.unmount();
  }
}
```

#### Performance Testing
```typescript
export class PerformanceTester {
  async measureRenderTime(element: LitElement, operation: Function): Promise<number> {
    performance.mark('render-start');
    await operation();
    await elementUpdated(element);
    performance.mark('render-end');
    
    const measurement = performance.measure('render', 'render-start', 'render-end');
    return measurement.duration;
  }

  async measureMemoryUsage(operation: Function): Promise<MemoryUsage> {
    const beforeMemory = performance.memory?.usedJSHeapSize || 0;
    await operation();
    const afterMemory = performance.memory?.usedJSHeapSize || 0;
    
    return {
      before: beforeMemory,
      after: afterMemory,
      delta: afterMemory - beforeMemory
    };
  }
}
```

## Event Communication Patterns

### 1. Framework-Specific Bridges

#### React Event Bridge
```typescript
export function useGlobalEvent(eventName: string, callback: Function) {
  const eventBus = GlobalEventBus.getInstance();
  
  React.useEffect(() => {
    const unsubscribe = eventBus.on(eventName, callback);
    return unsubscribe;
  }, [eventName, callback]);
}

export function useGlobalState(key: string, initialValue: any) {
  const [state, setState] = React.useState(initialValue);
  
  const setGlobalState = React.useCallback((value: any) => {
    GlobalEventBus.getInstance().emit('state-changed', { key, value });
  }, [key]);
  
  return [state, setGlobalState];
}
```

#### Vue Event Bridge
```typescript
// Vue 3 Composition API
export function useGlobalEvent(eventName: string, callback: Function) {
  const eventBus = GlobalEventBus.getInstance();
  
  onMounted(() => {
    const unsubscribe = eventBus.on(eventName, callback);
    onUnmounted(unsubscribe);
  });
}

// Vue Plugin
export const GlobalEventPlugin = {
  install(app: any) {
    app.provide('globalEvents', {
      emit: GlobalEventBus.getInstance().emit,
      on: GlobalEventBus.getInstance().on
    });
  }
};
```

### 2. Event Routing and Transformation

```typescript
export class EventRouter {
  addRoute(sourceEvent: string, targetEvent: string, options?: RouteOptions) {
    this.routes.set(sourceEvent, {
      target: targetEvent,
      condition: options?.condition,
      transformer: options?.transformer,
      debounceMs: options?.debounceMs
    });
  }

  // Example: Route user actions to analytics
  addRoute('user-action', 'analytics-track', {
    transformer: (data) => ({
      event: 'user_action',
      properties: data,
      timestamp: Date.now()
    })
  });
}
```

## Testing Strategy

### 1. Unit Testing
Test individual adapters and components:

```typescript
describe('ReactAdapter', () => {
  it('should mount component with props', async () => {
    const element = await LitTestUtils.createFixture('test-component');
    const adapter = new ReactAdapter('test-component');
    
    adapter.mount(element, { message: 'Hello', count: 5 });
    
    expect(element.message).toBe('Hello');
    expect(element.count).toBe(5);
  });
});
```

### 2. Integration Testing
Test cross-framework communication:

```typescript
describe('Cross-Framework Integration', () => {
  it('should communicate between React and Vue components', async () => {
    const eventBus = GlobalEventBus.getInstance();
    let receivedMessage = '';
    
    // Vue component listening
    eventBus.on('test-message', (event) => {
      receivedMessage = event.detail.text;
    });
    
    // React component emitting
    const ReactComponent = () => {
      const handleClick = () => {
        eventBus.emit('test-message', { text: 'Hello Vue!' });
      };
      return React.createElement('button', { onClick: handleClick }, 'Send');
    };
    
    const { container } = render(React.createElement(ReactComponent));
    fireEvent.click(container.querySelector('button'));
    
    expect(receivedMessage).toBe('Hello Vue!');
  });
});
```

### 3. Performance Testing
Measure integration overhead:

```typescript
describe('Performance', () => {
  it('should hydrate components within performance budget', async () => {
    const element = document.createElement('test-component');
    const strategy = new ProgressiveHydrationStrategy();
    
    const startTime = performance.now();
    await strategy.hydrate(element, { data: complexData });
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(16); // 60fps budget
  });
});
```

## Deployment Architecture

### 1. Multi-Target Build System

```typescript
export const buildConfigs = {
  // Standalone library
  library: {
    entry: 'src/index.ts',
    formats: ['es', 'umd', 'cjs'],
    external: ['lit']
  },
  
  // Framework-specific builds
  react: {
    entry: 'src/adapters/react.ts',
    external: ['react', 'react-dom', 'lit']
  },
  
  vue: {
    entry: 'src/adapters/vue.ts', 
    external: ['vue', 'lit']
  },
  
  angular: {
    entry: 'src/adapters/angular.ts',
    external: ['@angular/core', 'lit']
  }
};
```

### 2. Package Distribution

Create framework-specific entry points:

```json
{
  "name": "@your-org/lit-components",
  "exports": {
    ".": "./dist/index.js",
    "./react": "./dist/react.js",
    "./vue": "./dist/vue.js", 
    "./angular": "./dist/angular.js"
  },
  "peerDependencies": {
    "lit": "^3.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "vue": { "optional": true },
    "@angular/core": { "optional": true }
  }
}
```

### 3. CI/CD Pipeline

```yaml
name: Build and Deploy
on: [push, pull_request]

jobs:
  test:
    strategy:
      matrix:
        framework: [react, vue, angular]
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:${{ matrix.framework }}

  build:
    steps:
      - name: Build all variants
        run: npm run build:all
      - name: Upload artifacts
        uses: actions/upload-artifact@v3

  deploy:
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to NPM
        run: npm publish
      - name: Deploy to CDN  
        run: ./deploy-cdn.sh
```

## Tips

1. **Use TypeScript generics** for type-safe adapter implementations
2. **Implement proper event cleanup** to prevent memory leaks in long-running applications
3. **Design event schemas** for consistent cross-framework communication
4. **Handle SSR hydration carefully** to prevent hydration mismatches
5. **Test integration thoroughly** with automated cross-framework testing

## Common Pitfalls

- Not handling event listener cleanup in framework adapters
- Missing error boundaries when integrating across framework boundaries  
- Forgetting to handle SSR vs client-side rendering differences
- Not optimizing for bundle size when including multiple framework adapters
- Inadequate error handling for cross-framework event communication
- Missing accessibility considerations when events cross framework boundaries

## Performance Considerations

- Minimize adapter overhead with efficient property binding
- Use event delegation to reduce memory usage
- Implement proper cleanup to prevent memory leaks
- Optimize bundle splitting for framework-specific builds
- Monitor performance impact of cross-framework communication

Complete the implementation to create a production-ready integration system that enables seamless use of Lit components across React, Vue, Angular, and other modern frameworks while maintaining optimal performance and developer experience.