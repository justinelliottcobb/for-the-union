import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, Title, Text, Button, Group, Badge, Stack, Progress, Tabs, Code, Alert, ScrollArea, JsonInput, TextInput } from '@mantine/core';

interface PiniaStore<T = any> {
  id: string;
  state: () => T;
  getters?: Record<string, (state: T) => any>;
  actions?: Record<string, (...args: any[]) => any>;
  persist?: {
    enabled: boolean;
    storage: 'localStorage' | 'sessionStorage';
    key?: string;
  };
}

interface VueRoute {
  path: string;
  name?: string;
  component: () => Promise<any>;
  meta?: {
    requiresAuth?: boolean;
    roles?: string[];
    title?: string;
  };
  children?: VueRoute[];
  beforeEnter?: (to: any, from: any, next: () => void) => void;
}

interface TestSuite {
  name: string;
  tests: Array<{
    name: string;
    fn: () => Promise<void> | void;
    timeout?: number;
  }>;
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  results: TestResult[];
}

interface DevtoolsConfig {
  enabled: boolean;
  features: {
    componentInspector: boolean;
    routeInspector: boolean;
    storeInspector: boolean;
    performanceProfiler: boolean;
  };
  inspector?: {
    nodeId: string;
    label: string;
    icon?: string;
  };
  performance: {
    trackComponents: boolean;
    trackStores: boolean;
    trackRoutes: boolean;
  };
}

interface EcosystemMetrics {
  storeCount: number;
  routeCount: number;
  testCoverage: number;
  bundleSize: number;
  performanceScore: number;
}

export class PiniaStore {
  private stores = new Map<string, any>();
  private persistedStores = new Set<string>();
  private storeSubscriptions = new Map<string, Set<(state: any) => void>>();

  createStore<T>(definition: PiniaStore<T>): any {
    const storeData = {
      id: definition.id,
      state: definition.state(),
      getters: {},
      actions: {}
    };

    // Initialize getters
    if (definition.getters) {
      Object.entries(definition.getters).forEach(([key, getter]) => {
        Object.defineProperty(storeData.getters, key, {
          get: () => getter(storeData.state),
          enumerable: true
        });
      });
    }

    // Initialize actions
    if (definition.actions) {
      Object.entries(definition.actions).forEach(([key, action]) => {
        storeData.actions[key] = (...args: any[]) => {
          const result = action.apply(storeData, args);
          this.notifySubscribers(definition.id, storeData.state);
          return result;
        };
      });
    }

    this.stores.set(definition.id, storeData);

    // Setup persistence if enabled
    if (definition.persist?.enabled) {
      this.setupPersistence(definition.id, definition.persist);
    }

    return storeData;
  }

  useStore<T>(storeId: string): T | null {
    return this.stores.get(storeId) || null;
  }

  persistStore(storeId: string, config: { storage: 'localStorage' | 'sessionStorage'; key?: string }): void {
    this.setupPersistence(storeId, { enabled: true, ...config });
  }

  resetStore(storeId: string): void {
    const store = this.stores.get(storeId);
    if (store) {
      // Reset to initial state
      const initialState = store.state;
      Object.assign(store.state, initialState);
      this.notifySubscribers(storeId, store.state);
    }
  }

  getStoreState(storeId: string): any {
    const store = this.stores.get(storeId);
    return store ? { ...store.state } : null;
  }

  subscribe(storeId: string, callback: (state: any) => void): () => void {
    if (!this.storeSubscriptions.has(storeId)) {
      this.storeSubscriptions.set(storeId, new Set());
    }
    
    this.storeSubscriptions.get(storeId)!.add(callback);
    
    return () => {
      this.storeSubscriptions.get(storeId)?.delete(callback);
    };
  }

  getStoreList(): Array<{ id: string; persisted: boolean; subscriberCount: number }> {
    return Array.from(this.stores.keys()).map(id => ({
      id,
      persisted: this.persistedStores.has(id),
      subscriberCount: this.storeSubscriptions.get(id)?.size || 0
    }));
  }

  private setupPersistence(storeId: string, config: any): void {
    const store = this.stores.get(storeId);
    if (!store) return;

    const storageKey = config.key || `pinia-${storeId}`;
    const storage = window[config.storage];

    // Load persisted state
    try {
      const persistedState = storage.getItem(storageKey);
      if (persistedState) {
        const state = JSON.parse(persistedState);
        Object.assign(store.state, state);
      }
    } catch (error) {
      console.warn(`Failed to load persisted state for ${storeId}:`, error);
    }

    // Subscribe to state changes
    this.subscribe(storeId, (state) => {
      try {
        storage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.warn(`Failed to persist state for ${storeId}:`, error);
      }
    });

    this.persistedStores.add(storeId);
  }

  private notifySubscribers(storeId: string, state: any): void {
    const subscribers = this.storeSubscriptions.get(storeId);
    if (subscribers) {
      subscribers.forEach(callback => callback(state));
    }
  }
}

export class VueRouter {
  private routes: VueRoute[] = [];
  private currentRoute: VueRoute | null = null;
  private history: string[] = [];
  private guards = new Map<string, Function>();
  private navigationLog: Array<{ from: string; to: string; timestamp: number; success: boolean }> = [];

  addRoute(route: VueRoute): void {
    this.routes.push(route);
  }

  removeRoute(name: string): void {
    this.routes = this.routes.filter(route => route.name !== name);
  }

  async navigate(to: string | { name: string; params?: any }): Promise<void> {
    const fromPath = this.currentRoute?.path || '/';
    let toPath: string;
    
    if (typeof to === 'string') {
      toPath = to;
    } else {
      const route = this.routes.find(r => r.name === to.name);
      if (!route) {
        throw new Error(`Route not found: ${to.name}`);
      }
      toPath = route.path;
      // Replace params if provided
      if (to.params) {
        Object.entries(to.params).forEach(([key, value]) => {
          toPath = toPath.replace(`:${key}`, String(value));
        });
      }
    }

    const targetRoute = this.routes.find(route => 
      route.path === toPath || this.matchRoute(route.path, toPath)
    );

    if (!targetRoute) {
      this.logNavigation(fromPath, toPath, false);
      throw new Error(`No route matches: ${toPath}`);
    }

    try {
      // Execute navigation guards
      await this.executeGuards(targetRoute, fromPath, toPath);
      
      this.currentRoute = targetRoute;
      this.history.push(toPath);
      this.logNavigation(fromPath, toPath, true);
    } catch (error) {
      this.logNavigation(fromPath, toPath, false);
      throw error;
    }
  }

  getRoutes(): VueRoute[] {
    return [...this.routes];
  }

  getCurrentRoute(): VueRoute | null {
    return this.currentRoute;
  }

  getHistory(): string[] {
    return [...this.history];
  }

  beforeEach(guard: (to: any, from: any, next: Function) => void): void {
    this.guards.set('global', guard);
  }

  getNavigationLog(): Array<{ from: string; to: string; timestamp: number; success: boolean }> {
    return [...this.navigationLog].sort((a, b) => b.timestamp - a.timestamp);
  }

  private matchRoute(routePath: string, actualPath: string): boolean {
    const routeParts = routePath.split('/');
    const actualParts = actualPath.split('/');
    
    if (routeParts.length !== actualParts.length) return false;
    
    return routeParts.every((part, index) => {
      return part.startsWith(':') || part === actualParts[index];
    });
  }

  private async executeGuards(route: VueRoute, from: string, to: string): Promise<void> {
    // Execute global guards
    const globalGuard = this.guards.get('global');
    if (globalGuard) {
      await new Promise<void>((resolve, reject) => {
        globalGuard({ path: to }, { path: from }, (result?: any) => {
          if (result === false) {
            reject(new Error('Navigation cancelled by global guard'));
          } else {
            resolve();
          }
        });
      });
    }

    // Execute route-specific guards
    if (route.beforeEnter) {
      await new Promise<void>((resolve, reject) => {
        route.beforeEnter!({ path: to }, { path: from }, (result?: any) => {
          if (result === false) {
            reject(new Error('Navigation cancelled by route guard'));
          } else {
            resolve();
          }
        });
      });
    }
  }

  private logNavigation(from: string, to: string, success: boolean): void {
    this.navigationLog.push({
      from,
      to,
      timestamp: Date.now(),
      success
    });

    // Keep only last 50 navigation entries
    if (this.navigationLog.length > 50) {
      this.navigationLog = this.navigationLog.slice(-50);
    }
  }
}

export class TestingUtils {
  private mountedComponents = new Map<string, any>();
  private mockStores = new Map<string, any>();
  private testResults = new Map<string, TestResult[]>();

  mountComponent(component: any, options: {
    props?: Record<string, any>;
    slots?: Record<string, any>;
    global?: {
      plugins?: any[];
      mocks?: Record<string, any>;
    };
  } = {}): any {
    const wrapper = {
      vm: {
        ...component,
        $props: options.props || {},
        $slots: options.slots || {},
        $emit: jest.fn(),
        $nextTick: () => Promise.resolve()
      },
      html: () => '<div>Mocked Component HTML</div>',
      text: () => 'Mocked Component Text',
      find: (selector: string) => ({
        trigger: jest.fn(),
        exists: () => true,
        text: () => 'Mocked Element Text'
      }),
      findAll: (selector: string) => [],
      exists: () => true,
      unmount: () => {
        const id = this.findComponentId(wrapper);
        if (id) this.mountedComponents.delete(id);
      }
    };

    const id = `component_${Date.now()}_${Math.random()}`;
    this.mountedComponents.set(id, wrapper);
    
    return wrapper;
  }

  mockStore(storeId: string, mockState: any): void {
    const mockStore = {
      $id: storeId,
      $state: mockState,
      $patch: jest.fn((updates: any) => {
        Object.assign(mockStore.$state, updates);
      }),
      $subscribe: jest.fn(),
      $dispose: jest.fn(),
      ...mockState
    };

    this.mockStores.set(storeId, mockStore);
  }

  mockRoute(route: {
    path?: string;
    params?: Record<string, any>;
    query?: Record<string, any>;
    meta?: Record<string, any>;
  }): void {
    const mockRoute = {
      path: '/',
      name: 'home',
      params: {},
      query: {},
      meta: {},
      ...route
    };

    const mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      beforeEach: jest.fn(),
      currentRoute: { value: mockRoute }
    };

    // Mock Vue Router composables (would be done differently in actual Vue testing)
    (global as any).useRoute = jest.fn(() => mockRoute);
    (global as any).useRouter = jest.fn(() => mockRouter);
  }

  async runTestSuite(suite: TestSuite): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const test of suite.tests) {
      const startTime = performance.now();

      try {
        await test.fn();
        results.push({
          name: test.name,
          passed: true,
          executionTime: performance.now() - startTime
        });
      } catch (error) {
        results.push({
          name: test.name,
          passed: false,
          error: error instanceof Error ? error.message : String(error),
          executionTime: performance.now() - startTime
        });
      }
    }

    this.testResults.set(suite.name, results);
    return results;
  }

  getCoverage(): any {
    // Mock coverage data - in real implementation, this would integrate with Istanbul/NYC
    const baseScore = 75 + Math.random() * 20;
    
    return {
      statements: { 
        pct: Math.round(baseScore), 
        covered: Math.round(baseScore * 4), 
        total: 400 
      },
      branches: { 
        pct: Math.round(baseScore - 5), 
        covered: Math.round((baseScore - 5) * 2), 
        total: 200 
      },
      functions: { 
        pct: Math.round(baseScore + 5), 
        covered: Math.round((baseScore + 5) * 0.6), 
        total: 60 
      },
      lines: { 
        pct: Math.round(baseScore), 
        covered: Math.round(baseScore * 4), 
        total: 400 
      }
    };
  }

  getTestResults(): Map<string, TestResult[]> {
    return new Map(this.testResults);
  }

  private findComponentId(wrapper: any): string | null {
    for (const [id, component] of this.mountedComponents) {
      if (component === wrapper) return id;
    }
    return null;
  }
}

export class DevtoolsIntegration {
  private devtools: any = null;
  private inspectors = new Map<string, any>();
  private performanceMetrics = {
    components: new Map<string, any>(),
    stores: new Map<string, any>(),
    routes: new Map<string, any>()
  };
  private isEnabled = false;

  async initializeDevtools(app: any): Promise<void> {
    // Mock DevTools initialization
    this.devtools = {
      addInspector: (inspector: any) => {
        this.inspectors.set(inspector.id, inspector);
      },
      sendInspectorTree: jest.fn(),
      sendInspectorState: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    };

    this.isEnabled = true;
    console.log('Vue DevTools initialized (mocked)');
  }

  trackComponent(componentName: string, operation: 'render' | 'update' | 'unmount'): void {
    if (!this.isEnabled) return;

    const timestamp = performance.now();
    
    if (!this.performanceMetrics.components.has(componentName)) {
      this.performanceMetrics.components.set(componentName, {
        renders: 0,
        updates: 0,
        unmounts: 0,
        totalTime: 0,
        averageRenderTime: 0,
        lastOperation: null
      });
    }

    const metrics = this.performanceMetrics.components.get(componentName);
    
    switch (operation) {
      case 'render':
        metrics.renders++;
        break;
      case 'update':
        metrics.updates++;
        break;
      case 'unmount':
        metrics.unmounts++;
        break;
    }

    if (metrics.lastOperation) {
      const duration = timestamp - metrics.lastOperation;
      metrics.totalTime += duration;
      metrics.averageRenderTime = metrics.totalTime / (metrics.renders + metrics.updates);
    }

    metrics.lastOperation = timestamp;
  }

  trackStore(storeId: string, mutation: { type: string; payload?: any }): void {
    if (!this.isEnabled) return;

    if (!this.performanceMetrics.stores.has(storeId)) {
      this.performanceMetrics.stores.set(storeId, {
        mutations: 0,
        lastMutation: null,
        stateSize: 0,
        subscribers: 0
      });
    }

    const metrics = this.performanceMetrics.stores.get(storeId);
    metrics.mutations++;
    metrics.lastMutation = {
      type: mutation.type,
      timestamp: Date.now(),
      payload: mutation.payload
    };
    
    if (mutation.payload) {
      metrics.stateSize = JSON.stringify(mutation.payload).length;
    }
  }

  getPerformanceMetrics(): any {
    return {
      components: Object.fromEntries(this.performanceMetrics.components),
      stores: Object.fromEntries(this.performanceMetrics.stores),
      routes: Object.fromEntries(this.performanceMetrics.routes),
      isEnabled: this.isEnabled,
      inspectorCount: this.inspectors.size
    };
  }

  enableInspector(config: {
    id: string;
    label: string;
    icon?: string;
    treeFilterPlaceholder?: string;
  }): void {
    if (!this.devtools) return;

    const inspector = {
      id: config.id,
      label: config.label,
      icon: config.icon || 'component',
      treeFilterPlaceholder: config.treeFilterPlaceholder || 'Search...',
      actions: [],
      nodeActions: []
    };

    this.inspectors.set(config.id, inspector);
    this.devtools.addInspector(inspector);
  }

  getInspectors(): Array<{ id: string; label: string }> {
    return Array.from(this.inspectors.values()).map(inspector => ({
      id: inspector.id,
      label: inspector.label
    }));
  }
}

// Custom hooks for Vue ecosystem integration
function usePinia() {
  const piniaStore = useRef(new PiniaStore());

  const createStore = useCallback(<T>(definition: PiniaStore<T>) => {
    return piniaStore.current.createStore(definition);
  }, []);

  const useStore = useCallback(<T>(storeId: string): T | null => {
    return piniaStore.current.useStore<T>(storeId);
  }, []);

  return {
    createStore,
    useStore,
    getStoreList: () => piniaStore.current.getStoreList(),
    resetStore: (storeId: string) => piniaStore.current.resetStore(storeId),
    getStoreState: (storeId: string) => piniaStore.current.getStoreState(storeId)
  };
}

function useVueRouter() {
  const router = useRef(new VueRouter());

  const addRoute = useCallback((route: VueRoute) => {
    router.current.addRoute(route);
  }, []);

  const navigate = useCallback(async (to: string | { name: string; params?: any }) => {
    return await router.current.navigate(to);
  }, []);

  return {
    addRoute,
    navigate,
    getRoutes: () => router.current.getRoutes(),
    getCurrentRoute: () => router.current.getCurrentRoute(),
    getHistory: () => router.current.getHistory(),
    getNavigationLog: () => router.current.getNavigationLog()
  };
}

const DemoVueEcosystemIntegration: React.FC = () => {
  const piniaStore = useRef(new PiniaStore());
  const vueRouter = useRef(new VueRouter());
  const testingUtils = useRef(new TestingUtils());
  const devtoolsIntegration = useRef(new DevtoolsIntegration());

  const [createdStores, setCreatedStores] = useState<Array<{ id: string; persisted: boolean; subscriberCount: number }>>([]);
  const [registeredRoutes, setRegisteredRoutes] = useState<VueRoute[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [devtoolsMetrics, setDevtoolsMetrics] = useState<any>({});
  const [ecosystemMetrics, setEcosystemMetrics] = useState<EcosystemMetrics>({
    storeCount: 0,
    routeCount: 0,
    testCoverage: 0,
    bundleSize: 0,
    performanceScore: 0
  });

  const { createStore, useStore, getStoreList } = usePinia();
  const { addRoute, navigate, getRoutes, getNavigationLog } = useVueRouter();

  const handleCreateStore = useCallback(() => {
    const storeNames = ['user', 'cart', 'products', 'auth', 'ui'];
    const storeName = storeNames[Math.floor(Math.random() * storeNames.length)];
    
    const storeDefinition: PiniaStore = {
      id: `${storeName}_${Date.now()}`,
      state: () => ({
        data: `${storeName} data`,
        count: Math.floor(Math.random() * 100),
        isActive: Math.random() > 0.5
      }),
      getters: {
        displayName: (state: any) => `${state.data} (${state.count})`,
        status: (state: any) => state.isActive ? 'active' : 'inactive'
      },
      actions: {
        increment() {
          (this as any).state.count++;
        },
        toggle() {
          (this as any).state.isActive = !(this as any).state.isActive;
        }
      },
      persist: {
        enabled: Math.random() > 0.5,
        storage: 'localStorage'
      }
    };

    piniaStore.current.createStore(storeDefinition);
    setCreatedStores(piniaStore.current.getStoreList());
    
    // Track with DevTools
    devtoolsIntegration.current.trackStore(storeDefinition.id, {
      type: 'STORE_CREATED',
      payload: storeDefinition.state()
    });
  }, []);

  const handleCreateRoute = useCallback(() => {
    const routePaths = ['/home', '/about', '/products', '/user/:id', '/settings'];
    const routeNames = ['home', 'about', 'products', 'user-detail', 'settings'];
    
    const index = Math.floor(Math.random() * routePaths.length);
    const route: VueRoute = {
      path: routePaths[index] + `_${Date.now()}`,
      name: `${routeNames[index]}_${Date.now()}`,
      component: async () => ({ default: () => 'Component' }),
      meta: {
        requiresAuth: Math.random() > 0.6,
        title: `${routeNames[index]} Page`
      }
    };

    vueRouter.current.addRoute(route);
    setRegisteredRoutes(vueRouter.current.getRoutes());
  }, []);

  const handleRunTests = useCallback(async () => {
    const testSuite: TestSuite = {
      name: 'Vue Ecosystem Tests',
      tests: [
        {
          name: 'Store creation test',
          fn: () => {
            const store = piniaStore.current.useStore('test-store');
            if (!store) throw new Error('Store not created');
          }
        },
        {
          name: 'Route navigation test',
          fn: async () => {
            const routes = vueRouter.current.getRoutes();
            if (routes.length === 0) throw new Error('No routes available');
          }
        },
        {
          name: 'Component mounting test',
          fn: () => {
            const wrapper = testingUtils.current.mountComponent({});
            if (!wrapper) throw new Error('Component not mounted');
          }
        }
      ],
      coverage: {
        statements: 85,
        branches: 78,
        functions: 90,
        lines: 85
      },
      results: []
    };

    const results = await testingUtils.current.runTestSuite(testSuite);
    setTestResults(results);
    
    const coverage = testingUtils.current.getCoverage();
    setEcosystemMetrics(prev => ({
      ...prev,
      testCoverage: coverage.statements.pct
    }));
  }, []);

  const handleInitializeDevtools = useCallback(async () => {
    await devtoolsIntegration.current.initializeDevtools({});
    
    // Enable inspectors
    devtoolsIntegration.current.enableInspector({
      id: 'vue-stores',
      label: 'Pinia Stores',
      icon: 'storage'
    });
    
    devtoolsIntegration.current.enableInspector({
      id: 'vue-routes',
      label: 'Vue Router',
      icon: 'route'
    });

    setDevtoolsMetrics(devtoolsIntegration.current.getPerformanceMetrics());
  }, []);

  const handleNavigateRoute = useCallback(async () => {
    const routes = vueRouter.current.getRoutes();
    if (routes.length === 0) {
      alert('No routes available. Create a route first.');
      return;
    }

    const route = routes[Math.floor(Math.random() * routes.length)];
    try {
      await vueRouter.current.navigate(route.path);
    } catch (error) {
      console.error('Navigation failed:', error);
    }
  }, []);

  useEffect(() => {
    // Initialize with sample data
    handleCreateStore();
    handleCreateRoute();
    handleInitializeDevtools();
  }, []);

  useEffect(() => {
    // Update ecosystem metrics
    setEcosystemMetrics(prev => ({
      storeCount: createdStores.length,
      routeCount: registeredRoutes.length,
      testCoverage: prev.testCoverage,
      bundleSize: Math.floor(Math.random() * 500) + 200,
      performanceScore: Math.floor(Math.random() * 30) + 70
    }));
  }, [createdStores.length, registeredRoutes.length]);

  const testSuccessRate = useMemo(() => {
    if (testResults.length === 0) return 100;
    const passedTests = testResults.filter(test => test.passed).length;
    return (passedTests / testResults.length) * 100;
  }, [testResults]);

  const navigationLog = vueRouter.current.getNavigationLog();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Title order={1} mb="md">Vue Ecosystem Integration</Title>
      <Text mb="xl" c="dimmed">
        Integrating Vue with modern tooling and state management ecosystem
      </Text>

      <Tabs defaultValue="pinia" className="w-full">
        <Tabs.List>
          <Tabs.Tab value="pinia">Pinia Store</Tabs.Tab>
          <Tabs.Tab value="router">Vue Router</Tabs.Tab>
          <Tabs.Tab value="testing">Testing Utils</Tabs.Tab>
          <Tabs.Tab value="devtools">DevTools Integration</Tabs.Tab>
          <Tabs.Tab value="performance">Performance</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="pinia" pt="md">
          <Card>
            <Title order={3} mb="md">Pinia State Management</Title>
            
            <Group mb="md">
              <Button onClick={handleCreateStore} variant="filled">
                Create Store
              </Button>
              <Badge color="green" variant="light">
                {createdStores.length} Stores
              </Badge>
              <Badge color="blue" variant="light">
                {createdStores.filter(s => s.persisted).length} Persisted
              </Badge>
            </Group>

            <ScrollArea h={300}>
              {createdStores.map((store, index) => (
                <Card key={index} withBorder p="sm" mb="xs">
                  <Group justify="space-between">
                    <div>
                      <Text size="sm" fw={500}>{store.id}</Text>
                      <Text size="xs" c="dimmed">
                        Subscribers: {store.subscriberCount}
                      </Text>
                    </div>
                    <Group gap="xs">
                      {store.persisted && <Badge size="xs" color="green">Persisted</Badge>}
                      <Badge size="xs" color="blue">Active</Badge>
                    </Group>
                  </Group>
                </Card>
              ))}
            </ScrollArea>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="router" pt="md">
          <Stack gap="md">
            <Card>
              <Title order={3} mb="md">Vue Router 4</Title>
              
              <Group mb="md">
                <Button onClick={handleCreateRoute} variant="filled">
                  Add Route
                </Button>
                <Button onClick={handleNavigateRoute} variant="outline">
                  Navigate Random
                </Button>
                <Badge color="blue" variant="light">
                  {registeredRoutes.length} Routes
                </Badge>
              </Group>

              <ScrollArea h={200}>
                {registeredRoutes.map((route, index) => (
                  <Card key={index} withBorder p="sm" mb="xs">
                    <Group justify="space-between">
                      <div>
                        <Group gap="xs">
                          <Code size="sm">{route.path}</Code>
                          {route.name && <Text size="xs" c="dimmed">({route.name})</Text>}
                        </Group>
                        {route.meta?.title && (
                          <Text size="xs" c="dimmed">{route.meta.title}</Text>
                        )}
                      </div>
                      <Group gap="xs">
                        {route.meta?.requiresAuth && <Badge size="xs" color="orange">Auth</Badge>}
                        <Badge size="xs" color="green">Active</Badge>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </ScrollArea>
            </Card>

            <Card>
              <Title order={3} mb="md">Navigation Guards</Title>
              
              <ScrollArea h={150}>
                {navigationLog.slice(0, 5).map((nav, index) => (
                  <Group key={index} justify="space-between" p="xs">
                    <Group gap="xs">
                      <Text size="sm">{nav.from} → {nav.to}</Text>
                    </Group>
                    <Group gap="xs">
                      <Badge 
                        size="xs" 
                        color={nav.success ? 'green' : 'red'}
                      >
                        {nav.success ? 'Success' : 'Failed'}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {new Date(nav.timestamp).toLocaleTimeString()}
                      </Text>
                    </Group>
                  </Group>
                ))}
              </ScrollArea>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="testing" pt="md">
          <Card>
            <Title order={3} mb="md">Vue Testing Library</Title>
            
            <Group mb="md">
              <Button onClick={handleRunTests} variant="filled">
                Run Test Suite
              </Button>
              <Badge color={testSuccessRate === 100 ? 'green' : 'orange'} variant="light">
                {testSuccessRate.toFixed(0)}% Pass Rate
              </Badge>
              <Badge color="blue" variant="light">
                {testResults.length} Tests
              </Badge>
            </Group>

            <Stack gap="md">
              <div>
                <Text size="sm" fw={500} mb="sm">Test Results:</Text>
                <ScrollArea h={200}>
                  {testResults.map((test, index) => (
                    <Card key={index} withBorder p="sm" mb="xs">
                      <Group justify="space-between">
                        <div>
                          <Text size="sm" fw={500}>{test.name}</Text>
                          {test.error && (
                            <Text size="xs" c="red">{test.error}</Text>
                          )}
                        </div>
                        <Group gap="xs">
                          <Badge 
                            size="xs" 
                            color={test.passed ? 'green' : 'red'}
                          >
                            {test.passed ? 'PASS' : 'FAIL'}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {test.executionTime.toFixed(1)}ms
                          </Text>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </ScrollArea>
              </div>

              <div>
                <Text size="sm" fw={500} mb="sm">Coverage Report:</Text>
                <Group grow>
                  <div>
                    <Text size="xs" c="dimmed">Statements</Text>
                    <Progress value={ecosystemMetrics.testCoverage} color="green" size="sm" />
                    <Text size="xs">{ecosystemMetrics.testCoverage}%</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Branches</Text>
                    <Progress value={ecosystemMetrics.testCoverage - 5} color="blue" size="sm" />
                    <Text size="xs">{(ecosystemMetrics.testCoverage - 5).toFixed(0)}%</Text>
                  </div>
                </Group>
              </div>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="devtools" pt="md">
          <Stack gap="md">
            <Card>
              <Title order={3} mb="md">Vue DevTools</Title>
              
              <Group mb="md">
                <Button onClick={handleInitializeDevtools} variant="filled">
                  Initialize DevTools
                </Button>
                <Badge 
                  color={devtoolsMetrics.isEnabled ? 'green' : 'gray'} 
                  variant="light"
                >
                  {devtoolsMetrics.isEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <Badge color="blue" variant="light">
                  {devtoolsMetrics.inspectorCount || 0} Inspectors
                </Badge>
              </Group>

              <Group grow>
                <div>
                  <Text size="sm" c="dimmed">Components Tracked</Text>
                  <Text size="xl" fw={700}>
                    {Object.keys(devtoolsMetrics.components || {}).length}
                  </Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Store Mutations</Text>
                  <Text size="xl" fw={700}>
                    {Object.values(devtoolsMetrics.stores || {}).reduce((acc: number, store: any) => acc + (store.mutations || 0), 0)}
                  </Text>
                </div>
              </Group>
            </Card>

            <Card>
              <Title order={3} mb="md">Component Inspector</Title>
              
              <Alert color="blue" title="DevTools Integration">
                Vue DevTools provides comprehensive debugging capabilities including component 
                inspection, store state tracking, and performance profiling.
              </Alert>

              <Group grow mt="md">
                <div>
                  <Text size="sm" c="dimmed">Render Performance</Text>
                  <Text size="lg" fw={600}>Optimal</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Memory Usage</Text>
                  <Text size="lg" fw={600}>Low</Text>
                </div>
              </Group>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="performance" pt="md">
          <Stack gap="md">
            <Card>
              <Title order={3} mb="md">Ecosystem Metrics</Title>
              
              <Group grow>
                <Card withBorder>
                  <Text size="sm" c="dimmed">Total Stores</Text>
                  <Title order={2}>{ecosystemMetrics.storeCount}</Title>
                </Card>
                <Card withBorder>
                  <Text size="sm" c="dimmed">Total Routes</Text>
                  <Title order={2} c="blue">{ecosystemMetrics.routeCount}</Title>
                </Card>
                <Card withBorder>
                  <Text size="sm" c="dimmed">Test Coverage</Text>
                  <Title order={2} c="green">{ecosystemMetrics.testCoverage}%</Title>
                </Card>
                <Card withBorder>
                  <Text size="sm" c="dimmed">Performance Score</Text>
                  <Title order={2} c="orange">{ecosystemMetrics.performanceScore}</Title>
                </Card>
              </Group>
            </Card>

            <Card>
              <Title order={3} mb="md">Bundle Analysis</Title>
              
              <Group grow>
                <div>
                  <Text size="sm" c="dimmed">Bundle Size</Text>
                  <Progress 
                    value={Math.min(ecosystemMetrics.bundleSize / 10, 100)} 
                    color={ecosystemMetrics.bundleSize < 300 ? 'green' : 'orange'} 
                  />
                  <Text size="sm" mt="xs">{ecosystemMetrics.bundleSize}KB</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Tree Shaking</Text>
                  <Progress value={85} color="green" />
                  <Text size="sm" mt="xs">85% Optimized</Text>
                </div>
              </Group>

              <Alert mt="md" color="green" title="Ecosystem Performance">
                Vue's ecosystem provides excellent performance with efficient reactivity, 
                optimal bundle sizes, and comprehensive development tools.
              </Alert>
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default DemoVueEcosystemIntegration;