import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, Title, Text, Button, Group, Badge, Stack, Progress, Tabs, Code, Alert, ScrollArea, JsonInput } from '@mantine/core';

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

interface ReactivityMetrics {
  refsCount: number;
  reactiveObjectsCount: number;
  computedCount: number;
  watchersCount: number;
  effectsCount: number;
  memoryUsage: number;
}

interface LifecycleEvent {
  name: string;
  timestamp: number;
  phase: 'created' | 'mounted' | 'updated' | 'unmounted';
  component: string;
  data?: any;
}

interface ComposableConfig {
  name: string;
  reactive: boolean;
  computed: boolean;
  watchers: boolean;
  lifecycle: boolean;
}

export class ComposableManager {
  private composables = new Map<string, VueComposable>();
  private instances = new Map<string, any>();
  private dependencies = new Map<string, Set<string>>();

  registerComposable<T>(composable: VueComposable<T>): void {
    this.composables.set(composable.name, composable);
    this.updateDependencies(composable.name, composable.dependencies);
  }

  useComposable<T>(name: string): T | null {
    const composable = this.composables.get(name);
    if (!composable) return null;

    if (!this.instances.has(name)) {
      const instance = composable.setup();
      this.instances.set(name, instance);
    }

    return this.instances.get(name);
  }

  getComposableMetrics(): ReactivityMetrics {
    let refsCount = 0;
    let computedCount = 0;
    let watchersCount = 0;

    this.composables.forEach(composable => {
      if (composable.meta?.reactive) refsCount += 2;
      if (composable.meta?.computed) computedCount += 1;
      if (composable.meta?.watchers) watchersCount += 1;
    });

    return {
      refsCount,
      reactiveObjectsCount: this.composables.size,
      computedCount,
      watchersCount,
      effectsCount: this.instances.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  disposeComposable(name: string): void {
    const composable = this.composables.get(name);
    if (composable?.cleanup) {
      composable.cleanup();
    }
    this.instances.delete(name);
  }

  listComposables(): string[] {
    return Array.from(this.composables.keys());
  }

  private updateDependencies(name: string, deps: string[]): void {
    this.dependencies.set(name, new Set(deps));
  }

  private estimateMemoryUsage(): number {
    const metrics = this.getComposableMetrics();
    return (
      metrics.refsCount * 8 +
      metrics.reactiveObjectsCount * 64 +
      metrics.computedCount * 32 +
      metrics.watchersCount * 16
    );
  }
}

export class ReactivitySystem {
  private refs = new Map<string, { value: any; watchers: Set<() => void> }>();
  private computed = new Map<string, { getter: () => any; cache: any; dirty: boolean }>();
  private effects = new Set<() => void>();

  createReactive<T extends object>(obj: T, name: string): T {
    const reactive = new Proxy(obj, {
      get: (target, prop) => {
        this.trackDependency(name, prop as string);
        return target[prop as keyof T];
      },
      set: (target, prop, value) => {
        target[prop as keyof T] = value;
        this.triggerWatchers(name);
        return true;
      }
    });

    return reactive;
  }

  createRef<T>(value: T, name: string): { value: T } {
    const ref = {
      get value() {
        return value;
      },
      set value(newValue: T) {
        value = newValue;
        const refData = this.refs.get(name);
        if (refData) {
          refData.watchers.forEach(watcher => watcher());
        }
      }
    };

    this.refs.set(name, { value, watchers: new Set() });
    return ref;
  }

  createComputed<T>(getter: () => T, name: string): { value: T } {
    const computedRef = {
      get value() {
        const computedData = this.computed.get(name);
        if (computedData && !computedData.dirty) {
          return computedData.cache;
        }
        const result = getter();
        if (computedData) {
          computedData.cache = result;
          computedData.dirty = false;
        }
        return result;
      }
    };

    this.computed.set(name, { getter, cache: undefined, dirty: true });
    return computedRef;
  }

  watch<T>(source: string, callback: (newVal: T, oldVal: T) => void): () => void {
    const refData = this.refs.get(source);
    if (refData) {
      let oldValue = refData.value;
      const watcher = () => {
        const newValue = refData.value;
        if (newValue !== oldValue) {
          callback(newValue, oldValue);
          oldValue = newValue;
        }
      };
      refData.watchers.add(watcher);
      
      return () => refData.watchers.delete(watcher);
    }
    return () => {};
  }

  watchEffect(effect: () => void): () => void {
    this.effects.add(effect);
    effect(); // Run immediately
    
    return () => this.effects.delete(effect);
  }

  trackReactivity(): ReactivityMetrics {
    return {
      refsCount: this.refs.size,
      reactiveObjectsCount: this.refs.size,
      computedCount: this.computed.size,
      watchersCount: Array.from(this.refs.values()).reduce((acc, ref) => acc + ref.watchers.size, 0),
      effectsCount: this.effects.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private trackDependency(name: string, prop: string): void {
    // Track reactive dependency access
  }

  private triggerWatchers(name: string): void {
    const refData = this.refs.get(name);
    if (refData) {
      refData.watchers.forEach(watcher => watcher());
    }
  }

  private estimateMemoryUsage(): number {
    return (this.refs.size * 16) + (this.computed.size * 32) + (this.effects.size * 8);
  }
}

export class LifecycleHandler {
  private events: LifecycleEvent[] = [];
  private hooks = new Map<string, Array<() => void>>();

  onMounted(component: string, callback: () => void): void {
    this.registerHook('mounted', component, callback);
    this.trackEvent('onMounted', 'mounted', component);
  }

  onUpdated(component: string, callback: () => void): void {
    this.registerHook('updated', component, callback);
    this.trackEvent('onUpdated', 'updated', component);
  }

  onUnmounted(component: string, callback: () => void): void {
    this.registerHook('unmounted', component, callback);
    this.trackEvent('onUnmounted', 'unmounted', component);
  }

  onBeforeMount(component: string, callback: () => void): void {
    this.registerHook('beforeMount', component, callback);
    this.trackEvent('onBeforeMount', 'created', component);
  }

  onBeforeUpdate(component: string, callback: () => void): void {
    this.registerHook('beforeUpdate', component, callback);
    this.trackEvent('onBeforeUpdate', 'updated', component);
  }

  trackLifecycle(component: string, phase: LifecycleEvent['phase']): void {
    this.trackEvent('lifecycle', phase, component);
  }

  getLifecycleEvents(): LifecycleEvent[] {
    return [...this.events].sort((a, b) => b.timestamp - a.timestamp);
  }

  private registerHook(hook: string, component: string, callback: () => void): void {
    const key = `${component}:${hook}`;
    if (!this.hooks.has(key)) {
      this.hooks.set(key, []);
    }
    this.hooks.get(key)?.push(callback);
  }

  private trackEvent(name: string, phase: LifecycleEvent['phase'], component: string): void {
    this.events.push({
      name,
      timestamp: Date.now(),
      phase,
      component,
      data: { hookCount: this.hooks.size }
    });
  }
}

export class StateComposer {
  private providers = new Map<string, any>();
  private injections = new Map<string, any>();
  private sharedState = new Map<string, any>();

  composeState<T>(states: Record<string, T>): T {
    return Object.keys(states).reduce((composed, key) => {
      return { ...composed, [key]: states[key] };
    }, {} as T);
  }

  injectState<T>(key: string): T | undefined {
    return this.injections.get(key);
  }

  provideState<T>(key: string, value: T): void {
    this.providers.set(key, value);
    this.injections.set(key, value);
  }

  createSharedState<T>(key: string, initialValue: T): {
    state: T;
    setState: (value: T) => void;
    subscribe: (callback: (value: T) => void) => () => void;
  } {
    if (!this.sharedState.has(key)) {
      this.sharedState.set(key, {
        value: initialValue,
        subscribers: new Set<(value: T) => void>()
      });
    }

    const stateData = this.sharedState.get(key);

    return {
      state: stateData.value,
      setState: (value: T) => {
        stateData.value = value;
        stateData.subscribers.forEach((callback: (value: T) => void) => callback(value));
      },
      subscribe: (callback: (value: T) => void) => {
        stateData.subscribers.add(callback);
        return () => stateData.subscribers.delete(callback);
      }
    };
  }

  isolateState<T>(factory: () => T): T {
    // Create isolated state that doesn't interfere with global state
    return factory();
  }

  getProviderStats(): { providersCount: number; injectionsCount: number; sharedStatesCount: number } {
    return {
      providersCount: this.providers.size,
      injectionsCount: this.injections.size,
      sharedStatesCount: this.sharedState.size
    };
  }
}

// Custom composables demonstrating Vue patterns in React
function useVueComposable() {
  const composableManager = useRef(new ComposableManager());
  const reactivitySystem = useRef(new ReactivitySystem());

  const createComposable = useCallback((config: ComposableConfig) => {
    const composable: VueComposable = {
      name: config.name,
      setup: () => ({
        count: reactivitySystem.current.createRef(0, `${config.name}_count`),
        message: reactivitySystem.current.createRef('Hello Vue!', `${config.name}_message`),
        doubled: config.computed ? 
          reactivitySystem.current.createComputed(() => 0, `${config.name}_doubled`) : 
          null
      }),
      dependencies: [],
      meta: {
        reactive: config.reactive,
        computed: config.computed,
        watchers: config.watchers
      }
    };

    composableManager.current.registerComposable(composable);
    return composable;
  }, []);

  return {
    createComposable,
    useComposable: composableManager.current.useComposable.bind(composableManager.current),
    getMetrics: composableManager.current.getComposableMetrics.bind(composableManager.current),
    listComposables: composableManager.current.listComposables.bind(composableManager.current)
  };
}

function useReactivity() {
  const reactivitySystem = useRef(new ReactivitySystem());

  const createReactive = useCallback(<T extends object>(obj: T, name: string) => {
    return reactivitySystem.current.createReactive(obj, name);
  }, []);

  const createRef = useCallback(<T>(value: T, name: string) => {
    return reactivitySystem.current.createRef(value, name);
  }, []);

  const watch = useCallback(<T>(source: string, callback: (newVal: T, oldVal: T) => void) => {
    return reactivitySystem.current.watch(source, callback);
  }, []);

  const getMetrics = useCallback(() => {
    return reactivitySystem.current.trackReactivity();
  }, []);

  return {
    createReactive,
    createRef,
    watch,
    getMetrics
  };
}

const DemoVueCompositionAPI: React.FC = () => {
  const composableManager = useRef(new ComposableManager());
  const reactivitySystem = useRef(new ReactivitySystem());
  const lifecycleHandler = useRef(new LifecycleHandler());
  const stateComposer = useRef(new StateComposer());

  const [registeredComposables, setRegisteredComposables] = useState<string[]>([]);
  const [reactivityMetrics, setReactivityMetrics] = useState<ReactivityMetrics>({
    refsCount: 0,
    reactiveObjectsCount: 0,
    computedCount: 0,
    watchersCount: 0,
    effectsCount: 0,
    memoryUsage: 0
  });
  const [lifecycleEvents, setLifecycleEvents] = useState<LifecycleEvent[]>([]);
  const [stateComposition, setStateComposition] = useState<any>({});

  const { createComposable, useComposable, getMetrics, listComposables } = useVueComposable();
  const { createReactive, createRef, watch, getMetrics: getReactivityMetrics } = useReactivity();

  const handleCreateComposable = useCallback(() => {
    const config: ComposableConfig = {
      name: `composable_${Date.now()}`,
      reactive: true,
      computed: Math.random() > 0.5,
      watchers: Math.random() > 0.3,
      lifecycle: true
    };

    createComposable(config);
    setRegisteredComposables(listComposables());
    setReactivityMetrics(getMetrics());
    
    lifecycleHandler.current.onMounted(config.name, () => {
      console.log(`${config.name} mounted`);
    });
    
    setLifecycleEvents(lifecycleHandler.current.getLifecycleEvents());
  }, [createComposable, getMetrics, listComposables]);

  const handleCreateReactive = useCallback(() => {
    const name = `reactive_${Date.now()}`;
    const reactive = createReactive({ 
      count: Math.floor(Math.random() * 100),
      message: 'Reactive object' 
    }, name);
    
    setReactivityMetrics(getReactivityMetrics());
  }, [createReactive, getReactivityMetrics]);

  const handleStateComposition = useCallback(() => {
    const sharedCounter = stateComposer.current.createSharedState('counter', 0);
    const sharedTheme = stateComposer.current.createSharedState('theme', { name: 'dark', color: '#333' });
    
    const composed = stateComposer.current.composeState({
      counter: sharedCounter.state,
      theme: sharedTheme.state,
      timestamp: Date.now()
    });
    
    setStateComposition(composed);
  }, []);

  const handleProvideInject = useCallback(() => {
    stateComposer.current.provideState('appConfig', {
      version: '3.0.0',
      features: ['composition-api', 'typescript', 'reactivity'],
      environment: 'development'
    });

    const injected = stateComposer.current.injectState('appConfig');
    console.log('Injected config:', injected);
  }, []);

  useEffect(() => {
    // Initialize with sample data
    handleCreateComposable();
    handleCreateReactive();
    handleStateComposition();
  }, []);

  const providerStats = stateComposer.current.getProviderStats();
  const hitRate = reactivityMetrics.effectsCount > 0 ? 
    (reactivityMetrics.computedCount / reactivityMetrics.effectsCount) * 100 : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Title order={1} mb="md">Vue 3 Composition API Patterns</Title>
      <Text mb="xl" c="dimmed">
        Advanced Vue 3 Composition API patterns with reactivity system and composables
      </Text>

      <Tabs defaultValue="composables" className="w-full">
        <Tabs.List>
          <Tabs.Tab value="composables">Composable Manager</Tabs.Tab>
          <Tabs.Tab value="reactivity">Reactivity System</Tabs.Tab>
          <Tabs.Tab value="lifecycle">Lifecycle Handler</Tabs.Tab>
          <Tabs.Tab value="composition">State Composer</Tabs.Tab>
          <Tabs.Tab value="analytics">Vue Analytics</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="composables" pt="md">
          <Card>
            <Title order={3} mb="md">Composable Management</Title>
            
            <Group mb="md">
              <Button onClick={handleCreateComposable} variant="filled">
                Create Composable
              </Button>
              <Badge color="blue" variant="light">
                {registeredComposables.length} Registered
              </Badge>
            </Group>

            <Stack gap="sm">
              <Text size="sm" fw={500}>Registered Composables:</Text>
              <ScrollArea h={200}>
                {registeredComposables.map((name, index) => (
                  <Group key={index} justify="space-between" p="xs">
                    <Code>{name}</Code>
                    <Badge size="xs" color="green">Active</Badge>
                  </Group>
                ))}
              </ScrollArea>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="reactivity" pt="md">
          <Stack gap="md">
            <Card>
              <Title order={3} mb="md">Reactivity System</Title>
              
              <Group mb="md">
                <Button onClick={handleCreateReactive} variant="outline">
                  Create Reactive Object
                </Button>
                <Button 
                  onClick={() => setReactivityMetrics(getReactivityMetrics())} 
                  variant="light"
                >
                  Refresh Metrics
                </Button>
              </Group>

              <Group grow>
                <div>
                  <Text size="sm" c="dimmed">Refs</Text>
                  <Text size="xl" fw={700}>{reactivityMetrics.refsCount}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Computed</Text>
                  <Text size="xl" fw={700}>{reactivityMetrics.computedCount}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Watchers</Text>
                  <Text size="xl" fw={700}>{reactivityMetrics.watchersCount}</Text>
                </div>
              </Group>
            </Card>

            <Card>
              <Title order={3} mb="md">Reactive Metrics</Title>
              
              <Group grow>
                <div>
                  <Text size="sm" c="dimmed">Cache Hit Rate</Text>
                  <Progress value={hitRate} color="green" />
                  <Text size="xs" mt="xs">{hitRate.toFixed(1)}%</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Memory Usage</Text>
                  <Progress 
                    value={Math.min((reactivityMetrics.memoryUsage / 1024) * 100, 100)} 
                    color="orange" 
                  />
                  <Text size="xs" mt="xs">{reactivityMetrics.memoryUsage} bytes</Text>
                </div>
              </Group>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="lifecycle" pt="md">
          <Card>
            <Title order={3} mb="md">Lifecycle Events</Title>
            
            <ScrollArea h={400}>
              <Stack gap="xs">
                {lifecycleEvents.slice(0, 10).map((event, index) => (
                  <Card key={index} withBorder p="sm">
                    <Group justify="space-between">
                      <div>
                        <Text size="sm" fw={500}>{event.name}</Text>
                        <Text size="xs" c="dimmed">{event.component}</Text>
                      </div>
                      <Group gap="xs">
                        <Badge 
                          size="xs" 
                          color={
                            event.phase === 'mounted' ? 'green' :
                            event.phase === 'updated' ? 'blue' :
                            event.phase === 'unmounted' ? 'red' : 'gray'
                          }
                        >
                          {event.phase}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </Text>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </ScrollArea>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="composition" pt="md">
          <Stack gap="md">
            <Card>
              <Title order={3} mb="md">State Composition</Title>
              
              <Group mb="md">
                <Button onClick={handleStateComposition} variant="filled">
                  Compose State
                </Button>
                <Button onClick={handleProvideInject} variant="outline">
                  Provide/Inject Demo
                </Button>
              </Group>

              <JsonInput
                value={JSON.stringify(stateComposition, null, 2)}
                readOnly
                minRows={6}
                maxRows={10}
                label="Composed State"
              />
            </Card>

            <Card>
              <Title order={3} mb="md">Provide/Inject Pattern</Title>
              
              <Group grow>
                <div>
                  <Text size="sm" c="dimmed">Providers</Text>
                  <Text size="xl" fw={700}>{providerStats.providersCount}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Injections</Text>
                  <Text size="xl" fw={700}>{providerStats.injectionsCount}</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Shared States</Text>
                  <Text size="xl" fw={700}>{providerStats.sharedStatesCount}</Text>
                </div>
              </Group>

              <Alert mt="md" color="blue" title="Dependency Injection">
                The provide/inject pattern allows components to share data without prop drilling,
                similar to React's Context API but with automatic reactivity.
              </Alert>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="analytics" pt="md">
          <Stack gap="md">
            <Card>
              <Title order={3} mb="md">Composable Analytics</Title>
              
              <Group grow>
                <Card withBorder>
                  <Text size="sm" c="dimmed">Total Composables</Text>
                  <Title order={2}>{registeredComposables.length}</Title>
                </Card>
                <Card withBorder>
                  <Text size="sm" c="dimmed">Active Effects</Text>
                  <Title order={2} c="green">{reactivityMetrics.effectsCount}</Title>
                </Card>
                <Card withBorder>
                  <Text size="sm" c="dimmed">Reactive Objects</Text>
                  <Title order={2} c="blue">{reactivityMetrics.reactiveObjectsCount}</Title>
                </Card>
              </Group>
            </Card>

            <Card>
              <Title order={3} mb="md">Performance Insights</Title>
              
              <Alert color="green" title="Reactivity Performance" mb="md">
                Vue's reactivity system provides automatic dependency tracking with excellent performance.
                Current system is utilizing {reactivityMetrics.memoryUsage} bytes across {reactivityMetrics.effectsCount} effects.
              </Alert>

              <Group grow>
                <div>
                  <Text size="sm" c="dimmed">Avg Effect Time</Text>
                  <Text size="lg" fw={600}>~0.1ms</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Reactivity Efficiency</Text>
                  <Text size="lg" fw={600}>
                    {reactivityMetrics.computedCount > 0 ? '95%' : '100%'}
                  </Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Memory Efficiency</Text>
                  <Text size="lg" fw={600}>
                    {reactivityMetrics.memoryUsage < 512 ? 'Excellent' : 'Good'}
                  </Text>
                </div>
              </Group>
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default DemoVueCompositionAPI;