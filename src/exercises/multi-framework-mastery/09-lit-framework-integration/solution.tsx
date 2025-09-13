import React, { useState, useEffect, useRef } from 'react';
import { Container, Title, Text, Card, Group, Button, Stack, Code, Badge, Tabs, Paper, Grid, Alert } from '@mantine/core';
import { IconBridge2, IconRefresh, IconTestPipe, IconRocket } from '@tabler/icons-react';

export default function LitFrameworkIntegrationWorkshop() {
  const [activeDemo, setActiveDemo] = useState('adapters');

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="md">Lit Framework Integration Workshop</Title>
          <Text size="lg" c="dimmed">
            Master integrating Lit components across different frameworks with comprehensive event communication and state synchronization
          </Text>
        </div>

        <Tabs value={activeDemo} onTabChange={setActiveDemo}>
          <Tabs.List>
            <Tabs.Tab value="adapters" leftSection={<IconBridge2 size="0.8rem" />}>
              Framework Adapters
            </Tabs.Tab>
            <Tabs.Tab value="communication" leftSection={<IconRefresh size="0.8rem" />}>
              Event Communication
            </Tabs.Tab>
            <Tabs.Tab value="testing" leftSection={<IconTestPipe size="0.8rem" />}>
              Integration Testing
            </Tabs.Tab>
            <Tabs.Tab value="deployment" leftSection={<IconRocket size="0.8rem" />}>
              Deployment Strategies
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="adapters" pt="xl">
            <FrameworkAdaptersDemo />
          </Tabs.Panel>

          <Tabs.Panel value="communication" pt="xl">
            <EventCommunicationDemo />
          </Tabs.Panel>

          <Tabs.Panel value="testing" pt="xl">
            <IntegrationTestingDemo />
          </Tabs.Panel>

          <Tabs.Panel value="deployment" pt="xl">
            <DeploymentStrategiesDemo />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}

function FrameworkAdaptersDemo() {
  const [adaptersCode, setAdaptersCode] = useState('');

  useEffect(() => {
    const frameworkAdaptersImplementation = `
// Universal framework adapter system for Lit components
import { LitElement, html, css, customElement, property, state } from 'lit';
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { Component } from 'vue';

// Base adapter interface
export interface FrameworkAdapter<T = any> {
  mount(element: HTMLElement, props: T): void;
  unmount(element: HTMLElement): void;
  updateProps(element: HTMLElement, props: T): void;
  getComponent(): any;
}

// React adapter for Lit components
export class ReactAdapter<T = any> implements FrameworkAdapter<T> {
  private componentName: string;
  private eventHandlers = new Map<string, Function>();

  constructor(componentName: string) {
    this.componentName = componentName;
  }

  mount(element: HTMLElement, props: T): void {
    // Set properties on the custom element
    Object.entries(props as any).forEach(([key, value]) => {
      if (key.startsWith('on') && typeof value === 'function') {
        // Handle React-style event props
        const eventName = key.slice(2).toLowerCase();
        this.eventHandlers.set(eventName, value);
        element.addEventListener(eventName, value as EventListener);
      } else {
        // Set property on custom element
        (element as any)[key] = value;
      }
    });
  }

  unmount(element: HTMLElement): void {
    // Clean up event listeners
    this.eventHandlers.forEach((handler, event) => {
      element.removeEventListener(event, handler as EventListener);
    });
    this.eventHandlers.clear();
  }

  updateProps(element: HTMLElement, props: T): void {
    Object.entries(props as any).forEach(([key, value]) => {
      if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        const oldHandler = this.eventHandlers.get(eventName);
        
        if (oldHandler) {
          element.removeEventListener(eventName, oldHandler as EventListener);
        }
        
        this.eventHandlers.set(eventName, value);
        element.addEventListener(eventName, value as EventListener);
      } else {
        (element as any)[key] = value;
      }
    });
  }

  getComponent() {
    const adapter = this;
    const componentName = this.componentName;

    return forwardRef<HTMLElement, any>((props, ref) => {
      const elementRef = useRef<HTMLElement>(null);

      useImperativeHandle(ref, () => elementRef.current as HTMLElement);

      useEffect(() => {
        if (elementRef.current) {
          adapter.mount(elementRef.current, props);
        }

        return () => {
          if (elementRef.current) {
            adapter.unmount(elementRef.current);
          }
        };
      }, []);

      useEffect(() => {
        if (elementRef.current) {
          adapter.updateProps(elementRef.current, props);
        }
      }, [props]);

      return React.createElement(componentName, {
        ref: elementRef,
        ...Object.keys(props).reduce((acc, key) => {
          if (!key.startsWith('on')) {
            acc[key] = props[key];
          }
          return acc;
        }, {} as any)
      });
    });
  }
}

// Vue adapter for Lit components
export class VueAdapter<T = any> implements FrameworkAdapter<T> {
  private componentName: string;

  constructor(componentName: string) {
    this.componentName = componentName;
  }

  mount(element: HTMLElement, props: T): void {
    Object.entries(props as any).forEach(([key, value]) => {
      (element as any)[key] = value;
    });
  }

  unmount(element: HTMLElement): void {
    // Vue handles cleanup automatically
  }

  updateProps(element: HTMLElement, props: T): void {
    Object.entries(props as any).forEach(([key, value]) => {
      (element as any)[key] = value;
    });
  }

  getComponent(): Component {
    const adapter = this;
    const componentName = this.componentName;

    return {
      name: \`\${componentName}-wrapper\`,
      props: {
        // Define props based on the Lit component
      },
      emits: [
        // Define emits based on the Lit component events
      ],
      mounted() {
        adapter.mount(this.$el, this.$props);
        
        // Listen for custom events and emit them as Vue events
        Object.keys(this.$attrs).forEach(key => {
          if (key.startsWith('on')) {
            const eventName = key.slice(2).toLowerCase();
            this.$el.addEventListener(eventName, (event: CustomEvent) => {
              this.$emit(eventName, event.detail);
            });
          }
        });
      },
      beforeUnmount() {
        adapter.unmount(this.$el);
      },
      updated() {
        adapter.updateProps(this.$el, this.$props);
      },
      render() {
        return h(componentName, {
          ...this.$props,
          ...this.$attrs
        }, this.$slots);
      }
    };
  }
}

// Angular adapter for Lit components
export class AngularAdapter<T = any> implements FrameworkAdapter<T> {
  private componentName: string;

  constructor(componentName: string) {
    this.componentName = componentName;
  }

  mount(element: HTMLElement, props: T): void {
    Object.entries(props as any).forEach(([key, value]) => {
      (element as any)[key] = value;
    });
  }

  unmount(element: HTMLElement): void {
    // Angular handles cleanup
  }

  updateProps(element: HTMLElement, props: T): void {
    Object.entries(props as any).forEach(([key, value]) => {
      (element as any)[key] = value;
    });
  }

  getComponent() {
    // Angular component would be created using @Component decorator
    // This is a simplified version showing the concept
    return {
      selector: this.componentName,
      template: \`<\${this.componentName}><ng-content></ng-content></\${this.componentName}>\`,
      // Additional Angular-specific configuration
    };
  }
}

// Universal adapter factory
export class AdapterFactory {
  private static adapters = new Map<string, FrameworkAdapter>();

  static register<T>(
    componentName: string, 
    framework: 'react' | 'vue' | 'angular',
    customAdapter?: FrameworkAdapter<T>
  ): FrameworkAdapter<T> {
    const key = \`\${componentName}-\${framework}\`;
    
    if (customAdapter) {
      this.adapters.set(key, customAdapter);
      return customAdapter;
    }

    let adapter: FrameworkAdapter<T>;
    
    switch (framework) {
      case 'react':
        adapter = new ReactAdapter<T>(componentName);
        break;
      case 'vue':
        adapter = new VueAdapter<T>(componentName);
        break;
      case 'angular':
        adapter = new AngularAdapter<T>(componentName);
        break;
      default:
        throw new Error(\`Unsupported framework: \${framework}\`);
    }
    
    this.adapters.set(key, adapter);
    return adapter;
  }

  static get<T>(componentName: string, framework: string): FrameworkAdapter<T> | undefined {
    return this.adapters.get(\`\${componentName}-\${framework}\`) as FrameworkAdapter<T>;
  }

  static createComponent<T>(
    componentName: string,
    framework: 'react' | 'vue' | 'angular',
    options?: any
  ) {
    const adapter = this.register<T>(componentName, framework);
    return adapter.getComponent();
  }
}

// Hydration strategies for SSR
export class HydrationManager {
  private static strategies = new Map<string, HydrationStrategy>();

  static registerStrategy(name: string, strategy: HydrationStrategy): void {
    this.strategies.set(name, strategy);
  }

  static getStrategy(name: string): HydrationStrategy | undefined {
    return this.strategies.get(name);
  }

  static async hydrateComponent(
    element: HTMLElement,
    strategyName: string,
    props: any
  ): Promise<void> {
    const strategy = this.getStrategy(strategyName);
    if (!strategy) {
      throw new Error(\`Hydration strategy '\${strategyName}' not found\`);
    }

    await strategy.hydrate(element, props);
  }
}

export interface HydrationStrategy {
  hydrate(element: HTMLElement, props: any): Promise<void>;
  canHydrate(element: HTMLElement): boolean;
}

// Progressive hydration strategy
export class ProgressiveHydrationStrategy implements HydrationStrategy {
  async hydrate(element: HTMLElement, props: any): Promise<void> {
    // Check if element is in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.hydrateImmediately(entry.target as HTMLElement, props);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
  }

  canHydrate(element: HTMLElement): boolean {
    return element.hasAttribute('data-hydrate-progressive');
  }

  private hydrateImmediately(element: HTMLElement, props: any): void {
    // Perform actual hydration
    Object.entries(props).forEach(([key, value]) => {
      (element as any)[key] = value;
    });
    
    element.setAttribute('hydrated', 'true');
  }
}

// Eager hydration strategy
export class EagerHydrationStrategy implements HydrationStrategy {
  async hydrate(element: HTMLElement, props: any): Promise<void> {
    // Hydrate immediately on page load
    Object.entries(props).forEach(([key, value]) => {
      (element as any)[key] = value;
    });
    
    element.setAttribute('hydrated', 'true');
  }

  canHydrate(element: HTMLElement): boolean {
    return element.hasAttribute('data-hydrate-eager');
  }
}

// Idle hydration strategy
export class IdleHydrationStrategy implements HydrationStrategy {
  async hydrate(element: HTMLElement, props: any): Promise<void> {
    const hydrateWhenIdle = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.hydrateImmediately(element, props);
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          this.hydrateImmediately(element, props);
        }, 50);
      }
    };

    if (document.readyState === 'complete') {
      hydrateWhenIdle();
    } else {
      window.addEventListener('load', hydrateWhenIdle, { once: true });
    }
  }

  canHydrate(element: HTMLElement): boolean {
    return element.hasAttribute('data-hydrate-idle');
  }

  private hydrateImmediately(element: HTMLElement, props: any): void {
    Object.entries(props).forEach(([key, value]) => {
      (element as any)[key] = value;
    });
    
    element.setAttribute('hydrated', 'true');
  }
}

// Register default hydration strategies
HydrationManager.registerStrategy('progressive', new ProgressiveHydrationStrategy());
HydrationManager.registerStrategy('eager', new EagerHydrationStrategy());
HydrationManager.registerStrategy('idle', new IdleHydrationStrategy());

// Example Lit component for integration
@customElement('integration-example')
export class IntegrationExample extends LitElement {
  @property({ type: String }) message = 'Hello from Lit!';
  @property({ type: Number }) count = 0;
  @property({ type: Boolean }) disabled = false;

  @state() private internalState = 'active';

  private handleClick() {
    if (this.disabled) return;
    
    this.count++;
    
    this.dispatchEvent(new CustomEvent('count-changed', {
      detail: { 
        count: this.count, 
        message: this.message 
      },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html\`
      <div class="integration-example">
        <h3>\${this.message}</h3>
        <p>Count: \${this.count}</p>
        <button 
          @click=\${this.handleClick} 
          ?disabled=\${this.disabled}
          class="\${this.internalState}"
        >
          Increment
        </button>
        <slot></slot>
      </div>
    \`;
  }

  static styles = css\`
    .integration-example {
      padding: 16px;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      font-family: system-ui, sans-serif;
    }
    
    button {
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    button.active:hover:not(:disabled) {
      background: #2563eb;
    }
  \`;
}

// Create React wrapper using the adapter
const ReactIntegrationExample = AdapterFactory.createComponent<{
  message: string;
  count: number;
  disabled: boolean;
  onCountChanged?: (event: CustomEvent) => void;
}>('integration-example', 'react');

// Usage examples
export const examples = {
  react: \`
// React usage
import { ReactIntegrationExample } from './adapters';

function App() {
  const [count, setCount] = useState(0);
  
  const handleCountChanged = (event) => {
    setCount(event.detail.count);
  };
  
  return (
    <ReactIntegrationExample
      message="Hello from React!"
      count={count}
      disabled={false}
      onCountChanged={handleCountChanged}
    >
      <p>This content is slotted</p>
    </ReactIntegrationExample>
  );
}
  \`,
  
  vue: \`
<!-- Vue usage -->
<template>
  <integration-example
    :message="message"
    :count="count"
    :disabled="disabled"
    @count-changed="handleCountChanged"
  >
    <p>This content is slotted</p>
  </integration-example>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello from Vue!',
      count: 0,
      disabled: false
    };
  },
  methods: {
    handleCountChanged(event) {
      this.count = event.detail.count;
    }
  }
};
</script>
  \`,
  
  angular: \`
<!-- Angular usage -->
<integration-example
  [message]="message"
  [count]="count"
  [disabled]="disabled"
  (count-changed)="handleCountChanged($event)"
>
  <p>This content is slotted</p>
</integration-example>

<!-- Component TypeScript -->
export class AppComponent {
  message = 'Hello from Angular!';
  count = 0;
  disabled = false;
  
  handleCountChanged(event: CustomEvent) {
    this.count = event.detail.count;
  }
}
  \`
};
`;
    setAdaptersCode(frameworkAdaptersImplementation);
  }, []);

  return (
    <Card>
      <Card.Section p="md">
        <Title order={3} mb="md">Framework Adapters</Title>
        <Alert icon={<IconBridge2 />} mb="md">
          Universal adapter system for seamless Lit component integration across React, Vue, and Angular
        </Alert>

        <Grid mb="md">
          <Grid.Col span={4}>
            <Paper p="md" bg="blue.0">
              <Text fw={500} size="sm" mb="xs">React Adapter</Text>
              <Text size="xs" c="dimmed">forwardRef, hooks integration, event handling</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={4}>
            <Paper p="md" bg="green.0">
              <Text fw={500} size="sm" mb="xs">Vue Adapter</Text>
              <Text size="xs" c="dimmed">Composition API, reactive props, emit events</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={4}>
            <Paper p="md" bg="orange.0">
              <Text fw={500} size="sm" mb="xs">Angular Adapter</Text>
              <Text size="xs" c="dimmed">Component decorator, change detection</Text>
            </Paper>
          </Grid.Col>
        </Grid>
        
        <Code block style={{ fontSize: '9px' }}>
          {adaptersCode}
        </Code>

        <Group mt="md">
          <Badge color="blue">React</Badge>
          <Badge color="green">Vue</Badge>
          <Badge color="orange">Angular</Badge>
          <Badge color="purple">SSR Hydration</Badge>
        </Group>
      </Card.Section>
    </Card>
  );
}

function EventCommunicationDemo() {
  const [communicationCode, setCommunicationCode] = useState('');

  useEffect(() => {
    const eventCommunicationImplementation = `
// Cross-framework event communication and state synchronization
import { LitElement, html, css, customElement, property, state } from 'lit';

// Global event bus for cross-framework communication
export class GlobalEventBus {
  private static instance: GlobalEventBus;
  private eventTarget = new EventTarget();
  private subscribers = new Map<string, Set<Function>>();
  private eventHistory = new Map<string, any[]>();
  private middleware: EventMiddleware[] = [];

  static getInstance(): GlobalEventBus {
    if (!GlobalEventBus.instance) {
      GlobalEventBus.instance = new GlobalEventBus();
    }
    return GlobalEventBus.instance;
  }

  // Add middleware for event processing
  use(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
  }

  // Emit an event across all frameworks
  emit(eventName: string, data?: any): void {
    const event = new CustomEvent(eventName, { 
      detail: data,
      bubbles: true,
      composed: true 
    });

    // Process through middleware
    let processedEvent = event;
    for (const middleware of this.middleware) {
      processedEvent = middleware.process(processedEvent) || processedEvent;
    }

    // Store in history for debugging
    if (!this.eventHistory.has(eventName)) {
      this.eventHistory.set(eventName, []);
    }
    this.eventHistory.get(eventName)!.push({
      timestamp: Date.now(),
      data: data,
      processed: processedEvent.detail
    });

    // Emit to all subscribers
    this.eventTarget.dispatchEvent(processedEvent);
  }

  // Subscribe to events
  on(eventName: string, callback: (event: CustomEvent) => void): () => void {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, new Set());
    }
    
    this.subscribers.get(eventName)!.add(callback);
    this.eventTarget.addEventListener(eventName, callback as EventListener);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(eventName)?.delete(callback);
      this.eventTarget.removeEventListener(eventName, callback as EventListener);
    };
  }

  // Subscribe once
  once(eventName: string, callback: (event: CustomEvent) => void): void {
    const unsubscribe = this.on(eventName, (event) => {
      callback(event);
      unsubscribe();
    });
  }

  // Get event history for debugging
  getEventHistory(eventName?: string): Map<string, any[]> | any[] {
    if (eventName) {
      return this.eventHistory.get(eventName) || [];
    }
    return this.eventHistory;
  }

  // Clear event history
  clearHistory(eventName?: string): void {
    if (eventName) {
      this.eventHistory.delete(eventName);
    } else {
      this.eventHistory.clear();
    }
  }

  // Get active subscribers count
  getSubscriberCount(eventName: string): number {
    return this.subscribers.get(eventName)?.size || 0;
  }
}

export interface EventMiddleware {
  process(event: CustomEvent): CustomEvent | null;
}

// Logging middleware
export class LoggingMiddleware implements EventMiddleware {
  process(event: CustomEvent): CustomEvent {
    console.group(\`🌐 Global Event: \${event.type}\`);
    console.log('Detail:', event.detail);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
    return event;
  }
}

// Validation middleware
export class ValidationMiddleware implements EventMiddleware {
  private validators = new Map<string, (data: any) => boolean>();

  addValidator(eventName: string, validator: (data: any) => boolean): void {
    this.validators.set(eventName, validator);
  }

  process(event: CustomEvent): CustomEvent | null {
    const validator = this.validators.get(event.type);
    if (validator && !validator(event.detail)) {
      console.error(\`Event validation failed for \${event.type}\`, event.detail);
      return null; // Block invalid events
    }
    return event;
  }
}

// State synchronization middleware
export class StateSyncMiddleware implements EventMiddleware {
  private stateStore = new Map<string, any>();

  process(event: CustomEvent): CustomEvent {
    // Update state store
    if (event.detail?.stateKey) {
      this.stateStore.set(event.detail.stateKey, event.detail.value);
    }
    return event;
  }

  getState(key: string): any {
    return this.stateStore.get(key);
  }

  setState(key: string, value: any): void {
    this.stateStore.set(key, value);
    GlobalEventBus.getInstance().emit('state-changed', {
      stateKey: key,
      value: value
    });
  }
}

// Framework-specific event bridges
export class ReactEventBridge {
  private eventBus = GlobalEventBus.getInstance();
  private subscriptions = new Set<() => void>();

  // React hook for subscribing to global events
  useGlobalEvent(eventName: string, callback: (data: any) => void): void {
    React.useEffect(() => {
      const unsubscribe = this.eventBus.on(eventName, (event) => {
        callback(event.detail);
      });
      
      this.subscriptions.add(unsubscribe);
      return unsubscribe;
    }, [eventName, callback]);
  }

  // Emit event from React component
  emit(eventName: string, data?: any): void {
    this.eventBus.emit(eventName, data);
  }

  // Custom hook for state synchronization
  useGlobalState(key: string, initialValue?: any): [any, (value: any) => void] {
    const [state, setState] = React.useState(initialValue);
    const stateSyncMiddleware = new StateSyncMiddleware();

    React.useEffect(() => {
      const unsubscribe = this.eventBus.on('state-changed', (event) => {
        if (event.detail.stateKey === key) {
          setState(event.detail.value);
        }
      });

      return unsubscribe;
    }, [key]);

    const setGlobalState = React.useCallback((value: any) => {
      stateSyncMiddleware.setState(key, value);
    }, [key]);

    return [state, setGlobalState];
  }

  cleanup(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }
}

export class VueEventBridge {
  private eventBus = GlobalEventBus.getInstance();

  // Vue composition API for global events
  useGlobalEvent(eventName: string, callback: (data: any) => void) {
    onMounted(() => {
      const unsubscribe = this.eventBus.on(eventName, (event) => {
        callback(event.detail);
      });
      
      onUnmounted(() => {
        unsubscribe();
      });
    });
  }

  // Vue plugin for global event bus
  install(app: any) {
    app.config.globalProperties.$globalEvents = {
      emit: (eventName: string, data?: any) => {
        this.eventBus.emit(eventName, data);
      },
      on: (eventName: string, callback: (data: any) => void) => {
        return this.eventBus.on(eventName, (event) => callback(event.detail));
      }
    };

    app.provide('globalEvents', {
      emit: this.eventBus.emit.bind(this.eventBus),
      on: this.eventBus.on.bind(this.eventBus)
    });
  }

  emit(eventName: string, data?: any): void {
    this.eventBus.emit(eventName, data);
  }
}

// Event routing and transformation
export class EventRouter {
  private routes = new Map<string, EventRoute[]>();
  private transformers = new Map<string, EventTransformer>();

  addRoute(
    sourceEvent: string, 
    targetEvent: string, 
    options?: RouteOptions
  ): void {
    if (!this.routes.has(sourceEvent)) {
      this.routes.set(sourceEvent, []);
    }
    
    this.routes.get(sourceEvent)!.push({
      target: targetEvent,
      condition: options?.condition,
      transformer: options?.transformer,
      debounceMs: options?.debounceMs
    });
  }

  addTransformer(eventName: string, transformer: EventTransformer): void {
    this.transformers.set(eventName, transformer);
  }

  process(event: CustomEvent): void {
    const routes = this.routes.get(event.type);
    if (!routes) return;

    routes.forEach(route => {
      // Check condition
      if (route.condition && !route.condition(event.detail)) {
        return;
      }

      // Transform data
      let transformedData = event.detail;
      if (route.transformer) {
        transformedData = route.transformer(event.detail);
      }

      // Apply debouncing if specified
      if (route.debounceMs) {
        this.debounceEmit(route.target, transformedData, route.debounceMs);
      } else {
        GlobalEventBus.getInstance().emit(route.target, transformedData);
      }
    });
  }

  private debounceTimers = new Map<string, number>();

  private debounceEmit(eventName: string, data: any, delay: number): void {
    const key = \`\${eventName}-\${JSON.stringify(data)}\`;
    
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timerId = setTimeout(() => {
      GlobalEventBus.getInstance().emit(eventName, data);
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timerId);
  }
}

interface EventRoute {
  target: string;
  condition?: (data: any) => boolean;
  transformer?: EventTransformer;
  debounceMs?: number;
}

interface RouteOptions {
  condition?: (data: any) => boolean;
  transformer?: EventTransformer;
  debounceMs?: number;
}

type EventTransformer = (data: any) => any;

// Example Lit component with global event communication
@customElement('event-communicator')
export class EventCommunicator extends LitElement {
  @property({ type: String }) componentId = '';
  @property({ type: String }) framework = 'lit';
  
  @state() private messages: Array<{id: string, text: string, from: string}> = [];
  @state() private inputValue = '';

  private eventBus = GlobalEventBus.getInstance();
  private unsubscribes: (() => void)[] = [];

  connectedCallback() {
    super.connectedCallback();
    
    // Subscribe to global messages
    const unsubscribeMessages = this.eventBus.on('global-message', (event) => {
      this.messages = [...this.messages, {
        id: Date.now().toString(),
        text: event.detail.text,
        from: event.detail.from
      }];
    });

    // Subscribe to state changes
    const unsubscribeState = this.eventBus.on('state-changed', (event) => {
      if (event.detail.stateKey === 'sharedCounter') {
        this.requestUpdate();
      }
    });

    this.unsubscribes.push(unsubscribeMessages, unsubscribeState);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribes.forEach(unsubscribe => unsubscribe());
  }

  private sendMessage() {
    if (!this.inputValue.trim()) return;

    this.eventBus.emit('global-message', {
      text: this.inputValue,
      from: \`\${this.framework}(\${this.componentId})\`,
      timestamp: Date.now()
    });

    this.inputValue = '';
  }

  private clearMessages() {
    this.messages = [];
    this.eventBus.emit('messages-cleared', {
      clearedBy: \`\${this.framework}(\${this.componentId})\`
    });
  }

  render() {
    return html\`
      <div class="event-communicator">
        <h4>Event Communicator (\${this.framework})</h4>
        <div class="id">Component ID: \${this.componentId}</div>
        
        <div class="message-input">
          <input
            .value=\${this.inputValue}
            @input=\${(e: Event) => {
              this.inputValue = (e.target as HTMLInputElement).value;
            }}
            @keydown=\${(e: KeyboardEvent) => {
              if (e.key === 'Enter') this.sendMessage();
            }}
            placeholder="Type a message..."
          />
          <button @click=\${this.sendMessage}>Send</button>
          <button @click=\${this.clearMessages}>Clear</button>
        </div>

        <div class="messages">
          <h5>Global Messages:</h5>
          \${this.messages.length === 0 
            ? html\`<p class="empty">No messages yet</p>\`
            : this.messages.map(msg => html\`
                <div class="message">
                  <strong>\${msg.from}:</strong> \${msg.text}
                </div>
              \`)
          }
        </div>

        <div class="debug">
          <details>
            <summary>Debug Info</summary>
            <p>Active subscribers: \${this.eventBus.getSubscriberCount('global-message')}</p>
            <p>Message history: \${this.eventBus.getEventHistory('global-message').length} events</p>
          </details>
        </div>
      </div>
    \`;
  }

  static styles = css\`
    .event-communicator {
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 16px;
      margin: 8px;
      font-family: system-ui, sans-serif;
      max-width: 400px;
    }
    
    .id {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 12px;
    }
    
    .message-input {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .message-input input {
      flex: 1;
      padding: 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
    }
    
    .message-input button {
      padding: 8px 12px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .messages {
      background: #f8fafc;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 12px;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .messages h5 {
      margin: 0 0 8px 0;
      color: #374151;
    }
    
    .message {
      margin-bottom: 4px;
      font-size: 14px;
    }
    
    .empty {
      color: #9ca3af;
      font-style: italic;
      margin: 0;
    }
    
    .debug {
      font-size: 12px;
      color: #6b7280;
    }
    
    .debug details {
      margin-top: 8px;
    }
    
    .debug p {
      margin: 4px 0;
    }
  \`;
}

// Initialize global event bus with middleware
const eventBus = GlobalEventBus.getInstance();
eventBus.use(new LoggingMiddleware());
eventBus.use(new ValidationMiddleware());
eventBus.use(new StateSyncMiddleware());

// Set up event routing
const eventRouter = new EventRouter();
eventRouter.addRoute('user-action', 'analytics-track', {
  transformer: (data) => ({
    event: 'user_action',
    properties: data,
    timestamp: Date.now()
  })
});

// Usage examples for different frameworks
export const frameworkUsageExamples = {
  react: \`
// React usage with hooks
function ReactComponent() {
  const bridge = new ReactEventBridge();
  const [messages, setMessages] = useState([]);
  const [globalCount, setGlobalCount] = bridge.useGlobalState('counter', 0);

  bridge.useGlobalEvent('global-message', (data) => {
    setMessages(prev => [...prev, data]);
  });

  const sendMessage = () => {
    bridge.emit('global-message', {
      text: 'Hello from React!',
      from: 'react-component'
    });
  };

  return (
    <div>
      <button onClick={sendMessage}>Send Message</button>
      <p>Global Count: {globalCount}</p>
      <button onClick={() => setGlobalCount(globalCount + 1)}>
        Increment Global Count
      </button>
    </div>
  );
}
  \`,

  vue: \`
<!-- Vue usage with Composition API -->
<template>
  <div>
    <button @click="sendMessage">Send Message</button>
    <p>Global Count: {{ globalCount }}</p>
    <button @click="incrementGlobalCount">Increment Global Count</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { GlobalEventBus } from './event-communication';

const messages = ref([]);
const globalCount = ref(0);
const eventBus = GlobalEventBus.getInstance();

let unsubscribes = [];

onMounted(() => {
  const unsubscribeMessages = eventBus.on('global-message', (event) => {
    messages.value.push(event.detail);
  });
  
  const unsubscribeCount = eventBus.on('state-changed', (event) => {
    if (event.detail.stateKey === 'counter') {
      globalCount.value = event.detail.value;
    }
  });
  
  unsubscribes.push(unsubscribeMessages, unsubscribeCount);
});

onUnmounted(() => {
  unsubscribes.forEach(unsubscribe => unsubscribe());
});

const sendMessage = () => {
  eventBus.emit('global-message', {
    text: 'Hello from Vue!',
    from: 'vue-component'
  });
};

const incrementGlobalCount = () => {
  eventBus.emit('state-changed', {
    stateKey: 'counter',
    value: globalCount.value + 1
  });
};
</script>
  \`
};
`;
    setCommunicationCode(eventCommunicationImplementation);
  }, []);

  return (
    <Card>
      <Card.Section p="md">
        <Title order={3} mb="md">Cross-Framework Event Communication</Title>
        <Alert icon={<IconRefresh />} mb="md">
          Global event bus with middleware, state synchronization, and framework-specific bridges
        </Alert>

        <Grid mb="md">
          <Grid.Col span={6}>
            <Paper p="md" bg="purple.0">
              <Text fw={500} size="sm" mb="xs">Event Bus Features</Text>
              <Text size="xs" c="dimmed">• Middleware pipeline</Text>
              <Text size="xs" c="dimmed">• Event history & debugging</Text>
              <Text size="xs" c="dimmed">• Subscription management</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={6}>
            <Paper p="md" bg="teal.0">
              <Text fw={500} size="sm" mb="xs">State Synchronization</Text>
              <Text size="xs" c="dimmed">• Global state store</Text>
              <Text size="xs" c="dimmed">• Framework-specific hooks</Text>
              <Text size="xs" c="dimmed">• Reactive updates</Text>
            </Paper>
          </Grid.Col>
        </Grid>
        
        <Code block style={{ fontSize: '9px' }}>
          {communicationCode}
        </Code>

        <Group mt="md">
          <Badge color="purple">Event Bus</Badge>
          <Badge color="cyan">Middleware</Badge>
          <Badge color="teal">State Sync</Badge>
          <Badge color="orange">Routing</Badge>
        </Group>
      </Card.Section>
    </Card>
  );
}

function IntegrationTestingDemo() {
  const [testingCode, setTestingCode] = useState('');

  useEffect(() => {
    const integrationTestingImplementation = `
// Comprehensive integration testing framework for Lit components across frameworks
import { fixture, html, expect, elementUpdated, oneEvent } from '@open-wc/testing';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { mount } from '@vue/test-utils';
import { TestBed, ComponentFixture } from '@angular/core/testing';

// Base test utilities for Lit components
export class LitTestUtils {
  static async createFixture<T extends LitElement>(
    tag: string, 
    properties: Record<string, any> = {}
  ): Promise<T> {
    const propertyString = Object.entries(properties)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return \`\${key}="\${value}"\`;
        }
        return \`.\${key}=\${JSON.stringify(value)}\`;
      })
      .join(' ');

    return fixture(html\`<\${tag} \${propertyString}></\${tag}>\`) as Promise<T>;
  }

  static async waitForProperty<T extends LitElement>(
    element: T,
    property: string,
    value: any,
    timeout = 5000
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if ((element as any)[property] === value) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    throw new Error(\`Property \${property} did not reach expected value \${value} within \${timeout}ms\`);
  }

  static async waitForEvent<T extends LitElement>(
    element: T,
    eventName: string,
    timeout = 5000
  ): Promise<CustomEvent> {
    return oneEvent(element, eventName, { timeout });
  }

  static async simulateInteraction<T extends LitElement>(
    element: T,
    selector: string,
    interaction: 'click' | 'input' | 'focus' | 'blur',
    value?: any
  ): Promise<void> {
    await elementUpdated(element);
    const target = element.shadowRoot?.querySelector(selector) as HTMLElement;
    
    if (!target) {
      throw new Error(\`Element with selector "\${selector}" not found\`);
    }

    switch (interaction) {
      case 'click':
        target.click();
        break;
      case 'input':
        (target as HTMLInputElement).value = value;
        target.dispatchEvent(new Event('input', { bubbles: true }));
        break;
      case 'focus':
        target.focus();
        break;
      case 'blur':
        target.blur();
        break;
    }

    await elementUpdated(element);
  }

  static getComputedStyleProperty(element: Element, property: string): string {
    return getComputedStyle(element).getPropertyValue(property);
  }

  static async waitForSlotContent(
    element: LitElement,
    slotName?: string,
    timeout = 5000
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const slot = element.shadowRoot?.querySelector(
        slotName ? \`slot[name="\${slotName}"]\` : 'slot'
      ) as HTMLSlotElement;
      
      if (slot?.assignedNodes().length > 0) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    throw new Error(\`Slot content not found within \${timeout}ms\`);
  }
}

// Cross-framework testing utilities
export class CrossFrameworkTester {
  // Test Lit component in React context
  static async testInReact<T>(
    ReactComponent: React.ComponentType<T>,
    props: T,
    testFn: (element: HTMLElement, utils: any) => Promise<void>
  ): Promise<void> {
    const TestWrapper = () => React.createElement(ReactComponent, props);
    const { container, ...utils } = render(React.createElement(TestWrapper));
    
    const litElement = container.querySelector('[is]') || container.firstElementChild as HTMLElement;
    await testFn(litElement, utils);
  }

  // Test Lit component in Vue context
  static async testInVue<T>(
    VueComponent: any,
    props: T,
    testFn: (element: HTMLElement, wrapper: any) => Promise<void>
  ): Promise<void> {
    const wrapper = mount(VueComponent, { props });
    await wrapper.vm.$nextTick();
    
    const litElement = wrapper.element as HTMLElement;
    await testFn(litElement, wrapper);
    
    wrapper.unmount();
  }

  // Test Lit component in Angular context
  static async testInAngular<T>(
    AngularComponent: any,
    props: T,
    testFn: (element: HTMLElement, fixture: ComponentFixture<any>) => Promise<void>
  ): Promise<void> {
    const fixture = TestBed.createComponent(AngularComponent);
    Object.assign(fixture.componentInstance, props);
    fixture.detectChanges();
    
    const litElement = fixture.nativeElement as HTMLElement;
    await testFn(litElement, fixture);
    
    fixture.destroy();
  }
}

// Performance testing utilities
export class PerformanceTester {
  private static performanceEntries: PerformanceEntry[] = [];

  static startMeasurement(name: string): void {
    performance.mark(\`\${name}-start\`);
  }

  static endMeasurement(name: string): PerformanceEntry | null {
    try {
      performance.mark(\`\${name}-end\`);
      performance.measure(name, \`\${name}-start\`, \`\${name}-end\`);
      
      const entry = performance.getEntriesByName(name)[0];
      this.performanceEntries.push(entry);
      
      return entry;
    } catch (error) {
      console.error('Performance measurement failed:', error);
      return null;
    }
  }

  static async measureRenderTime<T extends LitElement>(
    element: T,
    operation: () => Promise<void>
  ): Promise<number> {
    this.startMeasurement('render');
    
    await operation();
    await elementUpdated(element);
    
    const measurement = this.endMeasurement('render');
    return measurement?.duration || 0;
  }

  static async measureMemoryUsage(
    operation: () => Promise<void>
  ): Promise<{ before: number; after: number; delta: number }> {
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
    
    const beforeMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    await operation();
    
    // Allow time for memory allocation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const afterMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    return {
      before: beforeMemory,
      after: afterMemory,
      delta: afterMemory - beforeMemory
    };
  }

  static getPerformanceReport(): {
    entries: PerformanceEntry[];
    averageRenderTime: number;
    totalMeasurements: number;
  } {
    const renderEntries = this.performanceEntries.filter(entry => 
      entry.name.includes('render')
    );
    
    const averageRenderTime = renderEntries.length > 0
      ? renderEntries.reduce((sum, entry) => sum + entry.duration, 0) / renderEntries.length
      : 0;

    return {
      entries: this.performanceEntries,
      averageRenderTime,
      totalMeasurements: this.performanceEntries.length
    };
  }

  static clearPerformanceData(): void {
    this.performanceEntries = [];
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// Accessibility testing utilities
export class AccessibilityTester {
  static async testKeyboardNavigation(
    element: LitElement,
    expectedFocusableElements: string[]
  ): Promise<boolean> {
    await elementUpdated(element);
    
    const focusableElements = element.shadowRoot?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements?.length !== expectedFocusableElements.length) {
      return false;
    }

    // Test Tab navigation
    let currentIndex = 0;
    for (const expectedSelector of expectedFocusableElements) {
      const expectedElement = element.shadowRoot?.querySelector(expectedSelector);
      const actualElement = focusableElements?.[currentIndex];
      
      if (expectedElement !== actualElement) {
        return false;
      }
      
      currentIndex++;
    }

    return true;
  }

  static async testAriaAttributes(
    element: LitElement,
    expectedAttributes: Record<string, string>
  ): Promise<boolean> {
    await elementUpdated(element);
    
    for (const [attribute, expectedValue] of Object.entries(expectedAttributes)) {
      const actualValue = element.getAttribute(attribute);
      if (actualValue !== expectedValue) {
        console.error(\`ARIA attribute mismatch: \${attribute}. Expected: \${expectedValue}, Actual: \${actualValue}\`);
        return false;
      }
    }

    return true;
  }

  static async testScreenReaderContent(
    element: LitElement,
    expectedText: string
  ): Promise<boolean> {
    await elementUpdated(element);
    
    // Create a simple screen reader text extractor
    const extractScreenReaderText = (el: Element): string => {
      let text = '';
      
      // Check for aria-label
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel) {
        text += ariaLabel + ' ';
      }
      
      // Check for aria-describedby
      const describedBy = el.getAttribute('aria-describedby');
      if (describedBy) {
        const descElement = document.getElementById(describedBy);
        if (descElement) {
          text += descElement.textContent + ' ';
        }
      }
      
      // Get visible text content
      text += el.textContent || '';
      
      return text.trim();
    };
    
    const screenReaderText = extractScreenReaderText(element);
    return screenReaderText.includes(expectedText);
  }
}

// Example test suite
export class IntegrationTestSuite {
  static async runBasicTests(componentName: string): Promise<TestResult[]> {
    const results: TestResult[] = [];

    try {
      // Test 1: Component creation
      const element = await LitTestUtils.createFixture(componentName);
      results.push({
        name: 'Component Creation',
        passed: !!element,
        duration: 0
      });

      // Test 2: Property binding
      await LitTestUtils.simulateInteraction(element, 'input', 'input', 'test value');
      const hasValue = element.shadowRoot?.querySelector('input')?.value === 'test value';
      results.push({
        name: 'Property Binding',
        passed: hasValue,
        duration: 0
      });

      // Test 3: Event emission
      const eventPromise = LitTestUtils.waitForEvent(element, 'test-event');
      await LitTestUtils.simulateInteraction(element, 'button', 'click');
      const event = await eventPromise;
      results.push({
        name: 'Event Emission',
        passed: !!event,
        duration: 0
      });

      // Test 4: Performance measurement
      const renderTime = await PerformanceTester.measureRenderTime(element, async () => {
        (element as any).someProperty = 'new value';
      });
      results.push({
        name: 'Render Performance',
        passed: renderTime < 16, // 60fps target
        duration: renderTime,
        details: \`Render time: \${renderTime.toFixed(2)}ms\`
      });

      // Test 5: Accessibility
      const keyboardNavWorking = await AccessibilityTester.testKeyboardNavigation(
        element,
        ['input', 'button']
      );
      results.push({
        name: 'Keyboard Navigation',
        passed: keyboardNavWorking,
        duration: 0
      });

    } catch (error) {
      results.push({
        name: 'Test Execution',
        passed: false,
        duration: 0,
        error: error.message
      });
    }

    return results;
  }

  static async runCrossFrameworkTests(
    componentName: string,
    adapters: {
      react?: React.ComponentType<any>;
      vue?: any;
      angular?: any;
    }
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test React integration
    if (adapters.react) {
      try {
        await CrossFrameworkTester.testInReact(
          adapters.react,
          { testProp: 'react-test' },
          async (element, utils) => {
            expect(element).toBeTruthy();
            expect((element as any).testProp).toBe('react-test');
          }
        );
        results.push({
          name: 'React Integration',
          passed: true,
          duration: 0
        });
      } catch (error) {
        results.push({
          name: 'React Integration',
          passed: false,
          duration: 0,
          error: error.message
        });
      }
    }

    // Test Vue integration
    if (adapters.vue) {
      try {
        await CrossFrameworkTester.testInVue(
          adapters.vue,
          { testProp: 'vue-test' },
          async (element, wrapper) => {
            expect(element).toBeTruthy();
            expect((element as any).testProp).toBe('vue-test');
          }
        );
        results.push({
          name: 'Vue Integration',
          passed: true,
          duration: 0
        });
      } catch (error) {
        results.push({
          name: 'Vue Integration',
          passed: false,
          duration: 0,
          error: error.message
        });
      }
    }

    return results;
  }
}

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: string;
}

// Automated testing runner
export class TestRunner {
  private results: TestResult[] = [];
  private coverage = new Map<string, number>();

  async runTestSuite(
    componentName: string,
    tests: Array<() => Promise<TestResult[]>>
  ): Promise<TestReport> {
    const startTime = performance.now();
    this.results = [];

    for (const testFn of tests) {
      try {
        const testResults = await testFn();
        this.results.push(...testResults);
      } catch (error) {
        this.results.push({
          name: 'Test Suite Execution',
          passed: false,
          duration: 0,
          error: error.message
        });
      }
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.length - passed;

    return {
      componentName,
      totalTests: this.results.length,
      passed,
      failed,
      duration: totalDuration,
      results: this.results,
      coverage: Object.fromEntries(this.coverage),
      summary: \`\${passed}/\${this.results.length} tests passed in \${totalDuration.toFixed(2)}ms\`
    };
  }

  generateReport(results: TestReport[]): string {
    let report = '# Integration Test Report\\n\\n';
    
    results.forEach(result => {
      report += \`## \${result.componentName}\\n\`;
      report += \`- **Total Tests**: \${result.totalTests}\\n\`;
      report += \`- **Passed**: \${result.passed}\\n\`;
      report += \`- **Failed**: \${result.failed}\\n\`;
      report += \`- **Duration**: \${result.duration.toFixed(2)}ms\\n\\n\`;
      
      if (result.failed > 0) {
        report += '### Failed Tests:\\n';
        result.results
          .filter(r => !r.passed)
          .forEach(r => {
            report += \`- **\${r.name}**: \${r.error || 'Test failed'}\\n\`;
          });
        report += '\\n';
      }
    });

    return report;
  }
}

interface TestReport {
  componentName: string;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
  coverage: Record<string, number>;
  summary: string;
}

// Example usage
const testRunner = new TestRunner();

export const exampleTestSuite = async () => {
  const report = await testRunner.runTestSuite('my-component', [
    () => IntegrationTestSuite.runBasicTests('my-component'),
    () => IntegrationTestSuite.runCrossFrameworkTests('my-component', {
      react: MyComponentReact,
      vue: MyComponentVue
    })
  ]);
  
  console.log(testRunner.generateReport([report]));
  return report;
};
`;
    setTestingCode(integrationTestingImplementation);
  }, []);

  return (
    <Card>
      <Card.Section p="md">
        <Title order={3} mb="md">Integration Testing Framework</Title>
        <Alert icon={<IconTestPipe />} mb="md">
          Comprehensive testing utilities for Lit components across React, Vue, and Angular environments
        </Alert>

        <Grid mb="md">
          <Grid.Col span={3}>
            <Paper p="md" bg="blue.0">
              <Text fw={500} size="sm" mb="xs">Lit Testing</Text>
              <Text size="xs" c="dimmed">Fixtures, interactions, events</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={3}>
            <Paper p="md" bg="green.0">
              <Text fw={500} size="sm" mb="xs">Cross-Framework</Text>
              <Text size="xs" c="dimmed">React, Vue, Angular testing</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={3}>
            <Paper p="md" bg="orange.0">
              <Text fw={500} size="sm" mb="xs">Performance</Text>
              <Text size="xs" c="dimmed">Render time, memory usage</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={3}>
            <Paper p="md" bg="purple.0">
              <Text fw={500} size="sm" mb="xs">Accessibility</Text>
              <Text size="xs" c="dimmed">Keyboard, ARIA, screen reader</Text>
            </Paper>
          </Grid.Col>
        </Grid>
        
        <Code block style={{ fontSize: '9px' }}>
          {testingCode}
        </Code>

        <Group mt="md">
          <Badge color="blue">Unit Testing</Badge>
          <Badge color="green">Integration</Badge>
          <Badge color="orange">Performance</Badge>
          <Badge color="purple">Accessibility</Badge>
        </Group>
      </Card.Section>
    </Card>
  );
}

function DeploymentStrategiesDemo() {
  const [deploymentCode, setDeploymentCode] = useState('');

  useEffect(() => {
    const deploymentStrategiesImplementation = `
// Comprehensive deployment strategies for multi-framework Lit components
import { build, defineConfig } from 'vite';
import { resolve } from 'path';

// Build configuration for different deployment targets
export const buildConfigs = {
  // Standalone component library build
  library: defineConfig({
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'LitComponentLibrary',
        fileName: (format) => \`lit-components.\${format}.js\`,
        formats: ['es', 'umd', 'cjs']
      },
      rollupOptions: {
        external: ['lit', 'lit/decorators.js'],
        output: {
          globals: {
            'lit': 'Lit',
            'lit/decorators.js': 'LitDecorators'
          }
        }
      }
    }
  }),

  // CDN-ready build with all dependencies bundled
  cdn: defineConfig({
    build: {
      outDir: 'dist/cdn',
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'LitComponentLibrary',
        fileName: 'lit-components.bundle',
        formats: ['umd']
      }
    }
  }),

  // Framework-specific builds
  react: defineConfig({
    build: {
      outDir: 'dist/react',
      lib: {
        entry: resolve(__dirname, 'src/adapters/react.ts'),
        name: 'ReactLitComponents',
        fileName: 'react-lit-components'
      },
      rollupOptions: {
        external: ['react', 'react-dom']
      }
    }
  }),

  vue: defineConfig({
    build: {
      outDir: 'dist/vue',
      lib: {
        entry: resolve(__dirname, 'src/adapters/vue.ts'),
        name: 'VueLitComponents',
        fileName: 'vue-lit-components'
      },
      rollupOptions: {
        external: ['vue']
      }
    }
  })
};

// Deployment pipeline configuration
export class DeploymentPipeline {
  private configs: Map<string, DeploymentConfig> = new Map();
  private deploymentHooks: DeploymentHooks = {};

  registerConfig(name: string, config: DeploymentConfig): void {
    this.configs.set(name, config);
  }

  setHooks(hooks: DeploymentHooks): void {
    this.deploymentHooks = hooks;
  }

  async deploy(configName: string, environment: 'development' | 'staging' | 'production'): Promise<DeploymentResult> {
    const config = this.configs.get(configName);
    if (!config) {
      throw new Error(\`Deployment config '\${configName}' not found\`);
    }

    const startTime = Date.now();
    
    try {
      // Pre-deployment hooks
      await this.deploymentHooks.beforeDeploy?.(config, environment);

      // Build step
      console.log(\`Building for \${environment}...\`);
      await this.build(config, environment);

      // Test step
      if (config.runTests) {
        console.log('Running tests...');
        await this.runTests(config);
      }

      // Deploy step
      console.log(\`Deploying to \${environment}...\`);
      await this.deployToTarget(config, environment);

      // Post-deployment hooks
      await this.deploymentHooks.afterDeploy?.(config, environment);

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        duration,
        environment,
        config: configName,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      await this.deploymentHooks.onError?.(error, config, environment);
      
      return {
        success: false,
        duration: Date.now() - startTime,
        environment,
        config: configName,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async build(config: DeploymentConfig, environment: string): Promise<void> {
    // Dynamic build configuration based on environment
    const buildConfig = {
      ...config.buildConfig,
      mode: environment,
      define: {
        ...config.buildConfig.define,
        'process.env.NODE_ENV': JSON.stringify(environment),
        'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString())
      }
    };

    await build(buildConfig);
  }

  private async runTests(config: DeploymentConfig): Promise<void> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const { stdout, stderr } = await execAsync(config.testCommand || 'npm test');
      console.log('Test output:', stdout);
      if (stderr) console.error('Test errors:', stderr);
    } catch (error) {
      throw new Error(\`Tests failed: \${error.message}\`);
    }
  }

  private async deployToTarget(config: DeploymentConfig, environment: string): Promise<void> {
    const target = config.targets[environment];
    if (!target) {
      throw new Error(\`No deployment target configured for \${environment}\`);
    }

    switch (target.type) {
      case 'static':
        await this.deployToStatic(target);
        break;
      case 'cdn':
        await this.deployToCDN(target);
        break;
      case 'npm':
        await this.deployToNPM(target);
        break;
      case 'docker':
        await this.deployToDocker(target);
        break;
      default:
        throw new Error(\`Unsupported deployment target: \${target.type}\`);
    }
  }

  private async deployToStatic(target: StaticTarget): Promise<void> {
    const { readdir, copyFile, mkdir } = await import('fs/promises');
    const { resolve, join } = await import('path');

    const distPath = resolve('./dist');
    const files = await readdir(distPath, { recursive: true });

    for (const file of files) {
      const srcPath = join(distPath, file as string);
      const destPath = join(target.outputDir, file as string);
      
      // Ensure directory exists
      await mkdir(join(target.outputDir, '..'), { recursive: true });
      await copyFile(srcPath, destPath);
    }

    console.log(\`Deployed \${files.length} files to \${target.outputDir}\`);
  }

  private async deployToCDN(target: CDNTarget): Promise<void> {
    // Simulate CDN deployment (would integrate with actual CDN APIs)
    console.log(\`Uploading to CDN: \${target.endpoint}\`);
    
    const uploadFiles = async (files: string[]) => {
      for (const file of files) {
        // Simulate upload with progress
        console.log(\`Uploading \${file}...\`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    await uploadFiles(['lit-components.es.js', 'lit-components.umd.js']);
    console.log(\`CDN deployment complete. Files available at: \${target.baseUrl}\`);
  }

  private async deployToNPM(target: NPMTarget): Promise<void> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Update package.json version if needed
    if (target.autoVersion) {
      await execAsync('npm version patch');
    }

    // Publish to NPM
    const publishCommand = target.registry 
      ? \`npm publish --registry \${target.registry}\`
      : 'npm publish';
    
    await execAsync(publishCommand);
    console.log('Package published to NPM');
  }

  private async deployToDocker(target: DockerTarget): Promise<void> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Build Docker image
    const buildCommand = \`docker build -t \${target.imageName}:\${target.tag} .\`;
    await execAsync(buildCommand);

    // Push to registry
    if (target.registry) {
      const pushCommand = \`docker push \${target.registry}/\${target.imageName}:\${target.tag}\`;
      await execAsync(pushCommand);
    }

    console.log(\`Docker image built and pushed: \${target.imageName}:\${target.tag}\`);
  }
}

// Multi-framework package configuration
export class PackageManager {
  static generatePackageJSON(componentName: string): Record<string, any> {
    return {
      name: \`@your-org/\${componentName}\`,
      version: '1.0.0',
      description: 'Multi-framework Lit component library',
      main: 'dist/lib/index.js',
      module: 'dist/es/index.js',
      types: 'dist/types/index.d.ts',
      exports: {
        '.': {
          import: './dist/es/index.js',
          require: './dist/lib/index.js',
          types: './dist/types/index.d.ts'
        },
        './react': {
          import: './dist/react/react-lit-components.js',
          types: './dist/types/react.d.ts'
        },
        './vue': {
          import: './dist/vue/vue-lit-components.js',
          types: './dist/types/vue.d.ts'
        },
        './angular': {
          import: './dist/angular/angular-lit-components.js',
          types: './dist/types/angular.d.ts'
        }
      },
      files: [
        'dist',
        'README.md',
        'CHANGELOG.md'
      ],
      scripts: {
        build: 'vite build',
        'build:all': 'npm run build:lib && npm run build:react && npm run build:vue',
        'build:lib': 'vite build --config vite.config.lib.ts',
        'build:react': 'vite build --config vite.config.react.ts',
        'build:vue': 'vite build --config vite.config.vue.ts',
        test: 'vitest',
        'test:ci': 'vitest run',
        'test:cross-framework': 'npm run test:react && npm run test:vue',
        'test:react': 'jest --config jest.react.config.js',
        'test:vue': 'jest --config jest.vue.config.js',
        typecheck: 'tsc --noEmit',
        lint: 'eslint src --ext .ts,.tsx',
        prepublishOnly: 'npm run build:all && npm run test:ci'
      },
      peerDependencies: {
        lit: '^3.0.0'
      },
      peerDependenciesMeta: {
        react: { optional: true },
        'react-dom': { optional: true },
        vue: { optional: true },
        '@angular/core': { optional: true }
      },
      devDependencies: {
        '@types/react': '^18.0.0',
        '@types/react-dom': '^18.0.0',
        '@vue/test-utils': '^2.0.0',
        '@angular/testing': '^16.0.0',
        typescript: '^5.0.0',
        vite: '^4.0.0',
        vitest: '^0.34.0',
        jest: '^29.0.0'
      },
      keywords: [
        'web-components',
        'lit',
        'react',
        'vue',
        'angular',
        'multi-framework',
        'design-system'
      ]
    };
  }

  static generateDockerfile(): string {
    return \`
# Multi-stage build for Lit component library
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build all framework variants
RUN npm run build:all

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
    \`.trim();
  }

  static generateGitHubActions(): string {
    return \`
name: Build and Deploy

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type checking
      run: npm run typecheck
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm run test:ci
    
    - name: Run cross-framework tests
      run: npm run test:cross-framework

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 18.x
      uses: actions/setup-node@v3
      with:
        node-version: 18.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build all variants
      run: npm run build:all
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-files
        path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-files
        path: dist/
    
    - name: Deploy to NPM
      if: contains(github.event.head_commit.message, '[npm-publish]')
      run: |
        npm config set //registry.npmjs.org/:_authToken \${NPM_TOKEN}
        npm publish
      env:
        NPM_TOKEN: \${{ secrets.NPM_TOKEN }}
    
    - name: Deploy to CDN
      run: |
        # Upload to CDN (customize for your CDN provider)
        echo "Deploying to CDN..."
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: your-registry/lit-components:latest
    \`.trim();
  }
}

// Environment-specific configurations
export const deploymentConfigs = {
  development: {
    buildConfig: buildConfigs.library,
    targets: {
      development: {
        type: 'static' as const,
        outputDir: './dev-server/public'
      }
    },
    runTests: true,
    testCommand: 'npm run test:watch'
  },

  staging: {
    buildConfig: buildConfigs.library,
    targets: {
      staging: {
        type: 'static' as const,
        outputDir: './staging-build'
      }
    },
    runTests: true,
    testCommand: 'npm run test:ci'
  },

  production: {
    buildConfig: buildConfigs.library,
    targets: {
      production: [
        {
          type: 'npm' as const,
          autoVersion: true,
          registry: 'https://registry.npmjs.org'
        },
        {
          type: 'cdn' as const,
          endpoint: 'https://cdn.example.com',
          baseUrl: 'https://cdn.example.com/lit-components'
        },
        {
          type: 'docker' as const,
          imageName: 'lit-components',
          tag: 'latest',
          registry: 'your-docker-registry.com'
        }
      ]
    },
    runTests: true,
    testCommand: 'npm run test:ci && npm run test:cross-framework'
  }
};

// Type definitions
interface DeploymentConfig {
  buildConfig: any;
  targets: Record<string, DeploymentTarget | DeploymentTarget[]>;
  runTests: boolean;
  testCommand?: string;
}

interface DeploymentHooks {
  beforeDeploy?: (config: DeploymentConfig, environment: string) => Promise<void>;
  afterDeploy?: (config: DeploymentConfig, environment: string) => Promise<void>;
  onError?: (error: Error, config: DeploymentConfig, environment: string) => Promise<void>;
}

interface DeploymentResult {
  success: boolean;
  duration: number;
  environment: string;
  config: string;
  error?: string;
  timestamp: string;
}

type DeploymentTarget = StaticTarget | CDNTarget | NPMTarget | DockerTarget;

interface StaticTarget {
  type: 'static';
  outputDir: string;
}

interface CDNTarget {
  type: 'cdn';
  endpoint: string;
  baseUrl: string;
}

interface NPMTarget {
  type: 'npm';
  autoVersion?: boolean;
  registry?: string;
}

interface DockerTarget {
  type: 'docker';
  imageName: string;
  tag: string;
  registry?: string;
}

// Example deployment pipeline usage
const pipeline = new DeploymentPipeline();

// Register configurations
Object.entries(deploymentConfigs).forEach(([name, config]) => {
  pipeline.registerConfig(name, config);
});

// Set deployment hooks
pipeline.setHooks({
  beforeDeploy: async (config, environment) => {
    console.log(\`Starting deployment to \${environment}\`);
  },
  afterDeploy: async (config, environment) => {
    console.log(\`Deployment to \${environment} completed successfully\`);
    // Send notifications, update status badges, etc.
  },
  onError: async (error, config, environment) => {
    console.error(\`Deployment to \${environment} failed:\`, error);
    // Send error notifications, rollback if needed, etc.
  }
});

export const deployToProduction = () => pipeline.deploy('production', 'production');
export const deployToStaging = () => pipeline.deploy('staging', 'staging');
export const deployToDevelopment = () => pipeline.deploy('development', 'development');
`;
    setDeploymentCode(deploymentStrategiesImplementation);
  }, []);

  return (
    <Card>
      <Card.Section p="md">
        <Title order={3} mb="md">Deployment Strategies</Title>
        <Alert icon={<IconRocket />} mb="md">
          Multi-target deployment pipeline with framework-specific builds and automated CI/CD
        </Alert>

        <Grid mb="md">
          <Grid.Col span={3}>
            <Paper p="md" bg="green.0">
              <Text fw={500} size="sm" mb="xs">NPM Publishing</Text>
              <Text size="xs" c="dimmed">Multi-export packages, version management</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={3}>
            <Paper p="md" bg="blue.0">
              <Text fw={500} size="sm" mb="xs">CDN Deployment</Text>
              <Text size="xs" c="dimmed">Bundle optimization, global distribution</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={3}>
            <Paper p="md" bg="orange.0">
              <Text fw={500} size="sm" mb="xs">Docker Containers</Text>
              <Text size="xs" c="dimmed">Multi-stage builds, health checks</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={3}>
            <Paper p="md" bg="purple.0">
              <Text fw={500} size="sm" mb="xs">CI/CD Pipeline</Text>
              <Text size="xs" c="dimmed">GitHub Actions, automated testing</Text>
            </Paper>
          </Grid.Col>
        </Grid>
        
        <Code block style={{ fontSize: '9px' }}>
          {deploymentCode}
        </Code>

        <Group mt="md">
          <Badge color="green">NPM</Badge>
          <Badge color="blue">CDN</Badge>
          <Badge color="orange">Docker</Badge>
          <Badge color="purple">CI/CD</Badge>
        </Group>
      </Card.Section>
    </Card>
  );
}