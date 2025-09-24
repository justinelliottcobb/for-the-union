import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, Title, Text, Button, Group, Badge, Stack, Progress, Tabs, Code, Alert, ScrollArea, JsonInput, TextInput, Select } from '@mantine/core';

interface ServerRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: (event: any) => Promise<any>;
  middleware?: string[];
  meta?: {
    auth?: boolean;
    cache?: number;
    rateLimit?: number;
  };
}

interface MiddlewareConfig {
  name: string;
  global: boolean;
  route?: string | RegExp;
  priority: number;
  handler: (event: any, next: () => void) => Promise<void>;
}

interface PluginDefinition {
  name: string;
  mode: 'all' | 'client' | 'server';
  setup: (nuxtApp: any) => void;
  options?: Record<string, any>;
  dependencies?: string[];
}

interface ModuleConfig {
  name: string;
  version: string;
  options: Record<string, any>;
  configKey?: string;
  defaults?: Record<string, any>;
  setup?: (options: any, nuxt: any) => void;
}

interface NuxtConfig {
  ssr: boolean;
  spa: boolean;
  target: 'static' | 'server';
  buildModules: string[];
  modules: string[];
  plugins: string[];
}

export class ServerRoutes {
  private routes = new Map<string, ServerRoute>();
  private requestLog: Array<{ path: string; method: string; timestamp: number; status: number }> = [];

  addRoute(route: ServerRoute): void {
    const key = `${route.method}:${route.path}`;
    this.routes.set(key, route);
  }

  removeRoute(path: string, method: string): boolean {
    const key = `${method}:${path}`;
    return this.routes.delete(key);
  }

  getRoutes(): ServerRoute[] {
    return Array.from(this.routes.values());
  }

  async handleRequest(path: string, method: string, event: any = {}): Promise<any> {
    const key = `${method}:${path}`;
    const route = this.routes.get(key);
    
    if (!route) {
      this.logRequest(path, method, 404);
      throw new Error(`Route not found: ${key}`);
    }

    try {
      const result = await route.handler(event);
      this.logRequest(path, method, 200);
      return result;
    } catch (error) {
      this.logRequest(path, method, 500);
      throw error;
    }
  }

  addMiddleware(middleware: MiddlewareConfig): void {
    // Middleware would be integrated with route handling
    console.log(`Middleware ${middleware.name} registered`);
  }

  getRequestLog(): Array<{ path: string; method: string; timestamp: number; status: number }> {
    return [...this.requestLog].sort((a, b) => b.timestamp - a.timestamp);
  }

  private logRequest(path: string, method: string, status: number): void {
    this.requestLog.push({
      path,
      method,
      timestamp: Date.now(),
      status
    });

    // Keep only last 100 requests
    if (this.requestLog.length > 100) {
      this.requestLog = this.requestLog.slice(-100);
    }
  }
}

export class MiddlewareSystem {
  private middleware = new Map<string, MiddlewareConfig>();
  private executionLog: Array<{ name: string; timestamp: number; duration: number }> = [];

  registerMiddleware(middleware: MiddlewareConfig): void {
    this.middleware.set(middleware.name, middleware);
  }

  async executeMiddleware(middlewareNames: string[], event: any): Promise<void> {
    const sortedMiddleware = middlewareNames
      .map(name => this.middleware.get(name))
      .filter(Boolean)
      .sort((a, b) => (a?.priority || 0) - (b?.priority || 0));

    for (const middleware of sortedMiddleware) {
      if (middleware) {
        const startTime = performance.now();
        await middleware.handler(event, () => {});
        const duration = performance.now() - startTime;
        
        this.executionLog.push({
          name: middleware.name,
          timestamp: Date.now(),
          duration
        });
      }
    }
  }

  addGlobalMiddleware(middleware: MiddlewareConfig): void {
    middleware.global = true;
    this.registerMiddleware(middleware);
  }

  addRouteMiddleware(middleware: MiddlewareConfig): void {
    middleware.global = false;
    this.registerMiddleware(middleware);
  }

  getMiddlewareChain(): MiddlewareConfig[] {
    return Array.from(this.middleware.values())
      .sort((a, b) => a.priority - b.priority);
  }

  getExecutionLog(): Array<{ name: string; timestamp: number; duration: number }> {
    return [...this.executionLog].sort((a, b) => b.timestamp - a.timestamp);
  }
}

export class PluginManager {
  private plugins = new Map<string, PluginDefinition>();
  private initializedPlugins = new Set<string>();
  private context = new Map<string, any>();

  registerPlugin(plugin: PluginDefinition): void {
    this.plugins.set(plugin.name, plugin);
  }

  async initializePlugin(pluginName: string, nuxtApp: any): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    if (this.initializedPlugins.has(pluginName)) {
      return; // Already initialized
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.initializedPlugins.has(dep)) {
          throw new Error(`Plugin ${pluginName} depends on ${dep} which is not initialized`);
        }
      }
    }

    await plugin.setup(nuxtApp);
    this.initializedPlugins.add(pluginName);
  }

  getPluginContext(pluginName: string): any {
    return this.context.get(pluginName);
  }

  executePluginHook(hookName: string, ...args: any[]): void {
    this.plugins.forEach((plugin) => {
      if (this.initializedPlugins.has(plugin.name)) {
        // Simulate hook execution
        console.log(`Executing ${hookName} hook for ${plugin.name}`);
      }
    });
  }

  listPlugins(): Array<{ name: string; initialized: boolean; mode: string }> {
    return Array.from(this.plugins.values()).map(plugin => ({
      name: plugin.name,
      initialized: this.initializedPlugins.has(plugin.name),
      mode: plugin.mode
    }));
  }
}

export class ModuleIntegration {
  private modules = new Map<string, ModuleConfig>();
  private buildChain: ModuleConfig[] = [];

  installModule(module: ModuleConfig): void {
    this.modules.set(module.name, module);
    this.buildModuleChain();
  }

  configureModule(name: string, options: Record<string, any>): void {
    const module = this.modules.get(name);
    if (!module) {
      throw new Error(`Module not found: ${name}`);
    }

    module.options = { ...module.defaults, ...options };
  }

  getModuleOptions(name: string): Record<string, any> | undefined {
    return this.modules.get(name)?.options;
  }

  buildModuleChain(): ModuleConfig[] {
    // Simple dependency resolution - in real Nuxt, this would be more complex
    this.buildChain = Array.from(this.modules.values())
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return this.buildChain;
  }

  validateModules(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    this.modules.forEach((module) => {
      if (!module.name) {
        errors.push(`Module missing name`);
      }
      if (!module.version) {
        errors.push(`Module ${module.name} missing version`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getInstalledModules(): ModuleConfig[] {
    return Array.from(this.modules.values());
  }
}

// Custom hooks for Nuxt patterns
function useNuxtServer() {
  const serverRoutes = useRef(new ServerRoutes());
  const middlewareSystem = useRef(new MiddlewareSystem());

  const addServerRoute = useCallback((route: ServerRoute) => {
    serverRoutes.current.addRoute(route);
  }, []);

  const handleRequest = useCallback(async (path: string, method: string, event?: any) => {
    return await serverRoutes.current.handleRequest(path, method, event);
  }, []);

  const addMiddleware = useCallback((middleware: MiddlewareConfig) => {
    middlewareSystem.current.registerMiddleware(middleware);
  }, []);

  return {
    addServerRoute,
    handleRequest,
    addMiddleware,
    getRoutes: () => serverRoutes.current.getRoutes(),
    getRequestLog: () => serverRoutes.current.getRequestLog(),
    getMiddlewareChain: () => middlewareSystem.current.getMiddlewareChain()
  };
}

function useUniversalData() {
  const [hydrationData, setHydrationData] = useState<Record<string, any>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  const fetchUniversalData = useCallback(async <T>(
    key: string, 
    fetcher: () => Promise<T>,
    options: { server?: boolean; client?: boolean } = { server: true, client: true }
  ): Promise<T> => {
    // Simulate server/client detection
    const isServer = typeof window === 'undefined';
    
    if (isServer && options.server) {
      const data = await fetcher();
      setHydrationData(prev => ({ ...prev, [key]: data }));
      return data;
    }
    
    if (!isServer && options.client) {
      if (hydrationData[key] && !isHydrated) {
        setIsHydrated(true);
        return hydrationData[key];
      }
      return await fetcher();
    }

    throw new Error(`Universal data fetching not available for ${key}`);
  }, [hydrationData, isHydrated]);

  return {
    fetchUniversalData,
    hydrationData,
    isHydrated,
    setHydrationData
  };
}

const DemoNuxtFullStack: React.FC = () => {
  const serverRoutes = useRef(new ServerRoutes());
  const middlewareSystem = useRef(new MiddlewareSystem());
  const pluginManager = useRef(new PluginManager());
  const moduleIntegration = useRef(new ModuleIntegration());

  const [registeredRoutes, setRegisteredRoutes] = useState<ServerRoute[]>([]);
  const [middlewareChain, setMiddlewareChain] = useState<MiddlewareConfig[]>([]);
  const [activePlugins, setActivePlugins] = useState<Array<{ name: string; initialized: boolean; mode: string }>>([]);
  const [installedModules, setInstalledModules] = useState<ModuleConfig[]>([]);
  const [requestLog, setRequestLog] = useState<Array<{ path: string; method: string; timestamp: number; status: number }>>([]);
  const [ssrMetrics, setSSRMetrics] = useState({
    renderTime: 0,
    hydrationTime: 0,
    bundleSize: 0,
    cacheHitRate: 0
  });

  const { addServerRoute, handleRequest, addMiddleware, getRoutes, getRequestLog } = useNuxtServer();
  const { fetchUniversalData, hydrationData, isHydrated } = useUniversalData();

  const handleCreateRoute = useCallback(() => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const paths = ['/api/users', '/api/posts', '/api/auth', '/api/data'];
    
    const route: ServerRoute = {
      path: paths[Math.floor(Math.random() * paths.length)] + `/${Date.now()}`,
      method: methods[Math.floor(Math.random() * methods.length)] as any,
      handler: async (event) => ({
        data: `Response from ${event?.path || 'server'}`,
        timestamp: Date.now(),
        method: event?.method
      }),
      middleware: Math.random() > 0.5 ? ['auth'] : [],
      meta: {
        auth: Math.random() > 0.7,
        cache: Math.random() > 0.5 ? 300 : undefined,
        rateLimit: Math.random() > 0.8 ? 100 : undefined
      }
    };

    serverRoutes.current.addRoute(route);
    setRegisteredRoutes(serverRoutes.current.getRoutes());
  }, []);

  const handleCreateMiddleware = useCallback(() => {
    const middlewareNames = ['auth', 'cors', 'logging', 'validation', 'compression'];
    const name = middlewareNames[Math.floor(Math.random() * middlewareNames.length)];
    
    const middleware: MiddlewareConfig = {
      name: `${name}_${Date.now()}`,
      global: Math.random() > 0.5,
      priority: Math.floor(Math.random() * 10),
      handler: async (event, next) => {
        console.log(`Middleware ${name} executed`);
        await next();
      }
    };

    middlewareSystem.current.registerMiddleware(middleware);
    setMiddlewareChain(middlewareSystem.current.getMiddlewareChain());
  }, []);

  const handleCreatePlugin = useCallback(() => {
    const pluginNames = ['analytics', 'auth', 'i18n', 'pwa', 'sitemap'];
    const name = pluginNames[Math.floor(Math.random() * pluginNames.length)];
    
    const plugin: PluginDefinition = {
      name: `${name}_${Date.now()}`,
      mode: Math.random() > 0.5 ? 'all' : (Math.random() > 0.5 ? 'client' : 'server'),
      setup: (nuxtApp) => {
        console.log(`Plugin ${name} initialized`);
      },
      options: {
        enabled: true,
        version: '1.0.0'
      }
    };

    pluginManager.current.registerPlugin(plugin);
    pluginManager.current.initializePlugin(plugin.name, {});
    setActivePlugins(pluginManager.current.listPlugins());
  }, []);

  const handleInstallModule = useCallback(() => {
    const moduleNames = ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@nuxt/content', '@nuxtjs/color-mode'];
    const name = moduleNames[Math.floor(Math.random() * moduleNames.length)];
    
    const module: ModuleConfig = {
      name: `${name}_${Date.now()}`,
      version: '1.0.0',
      options: {
        enabled: true,
        configKey: name.replace('@', '').replace('/', '_')
      },
      defaults: {
        enabled: false
      }
    };

    moduleIntegration.current.installModule(module);
    setInstalledModules(moduleIntegration.current.getInstalledModules());
  }, []);

  const handleTestRequest = useCallback(async () => {
    const routes = serverRoutes.current.getRoutes();
    if (routes.length === 0) {
      alert('No routes available. Create a route first.');
      return;
    }

    const route = routes[Math.floor(Math.random() * routes.length)];
    try {
      await serverRoutes.current.handleRequest(route.path, route.method, {
        path: route.path,
        method: route.method
      });
      setRequestLog(serverRoutes.current.getRequestLog());
    } catch (error) {
      console.error('Request failed:', error);
      setRequestLog(serverRoutes.current.getRequestLog());
    }
  }, []);

  const handleSSRSimulation = useCallback(async () => {
    const startTime = performance.now();
    
    // Simulate SSR process
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    const renderTime = performance.now() - startTime;
    
    setSSRMetrics(prev => ({
      renderTime,
      hydrationTime: Math.random() * 50 + 20,
      bundleSize: Math.floor(Math.random() * 500) + 200,
      cacheHitRate: Math.random() * 100
    }));
  }, []);

  useEffect(() => {
    // Initialize with sample data
    handleCreateRoute();
    handleCreateMiddleware();
    handleCreatePlugin();
    handleInstallModule();
  }, []);

  const routeSuccessRate = useMemo(() => {
    if (requestLog.length === 0) return 100;
    const successCount = requestLog.filter(req => req.status === 200).length;
    return (successCount / requestLog.length) * 100;
  }, [requestLog]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Title order={1} mb="md">Nuxt 3 Full-Stack Patterns</Title>
      <Text mb="xl" c="dimmed">
        Nuxt 3 server-side rendering and full-stack development with Nitro server
      </Text>

      <Tabs defaultValue="routes" className="w-full">
        <Tabs.List>
          <Tabs.Tab value="routes">Server Routes</Tabs.Tab>
          <Tabs.Tab value="middleware">Middleware System</Tabs.Tab>
          <Tabs.Tab value="plugins">Plugin Manager</Tabs.Tab>
          <Tabs.Tab value="modules">Module Integration</Tabs.Tab>
          <Tabs.Tab value="ssr">SSR Optimization</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="routes" pt="md">
          <Card>
            <Title order={3} mb="md">Server Routes Management</Title>
            
            <Group mb="md">
              <Button onClick={handleCreateRoute} variant="filled">
                Add Server Route
              </Button>
              <Button onClick={handleTestRequest} variant="outline">
                Test Request
              </Button>
              <Badge color="blue" variant="light">
                {registeredRoutes.length} Routes
              </Badge>
              <Badge color={routeSuccessRate > 90 ? 'green' : 'orange'} variant="light">
                {routeSuccessRate.toFixed(1)}% Success Rate
              </Badge>
            </Group>

            <Stack gap="md">
              <div>
                <Text size="sm" fw={500} mb="sm">Registered Routes:</Text>
                <ScrollArea h={200}>
                  {registeredRoutes.map((route, index) => (
                    <Card key={index} withBorder p="sm" mb="xs">
                      <Group justify="space-between">
                        <div>
                          <Group gap="xs">
                            <Badge size="xs" color="blue">{route.method}</Badge>
                            <Code>{route.path}</Code>
                          </Group>
                          {route.middleware && route.middleware.length > 0 && (
                            <Text size="xs" c="dimmed">
                              Middleware: {route.middleware.join(', ')}
                            </Text>
                          )}
                        </div>
                        <Group gap="xs">
                          {route.meta?.auth && <Badge size="xs" color="orange">Auth</Badge>}
                          {route.meta?.cache && <Badge size="xs" color="green">Cached</Badge>}
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </ScrollArea>
              </div>

              <div>
                <Text size="sm" fw={500} mb="sm">Recent Requests:</Text>
                <ScrollArea h={150}>
                  {requestLog.slice(0, 10).map((req, index) => (
                    <Group key={index} justify="space-between" p="xs">
                      <Group gap="xs">
                        <Badge size="xs" color="gray">{req.method}</Badge>
                        <Text size="sm">{req.path}</Text>
                      </Group>
                      <Group gap="xs">
                        <Badge 
                          size="xs" 
                          color={req.status === 200 ? 'green' : req.status === 404 ? 'orange' : 'red'}
                        >
                          {req.status}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          {new Date(req.timestamp).toLocaleTimeString()}
                        </Text>
                      </Group>
                    </Group>
                  ))}
                </ScrollArea>
              </div>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="middleware" pt="md">
          <Stack gap="md">
            <Card>
              <Title order={3} mb="md">Middleware Chain</Title>
              
              <Group mb="md">
                <Button onClick={handleCreateMiddleware} variant="filled">
                  Add Middleware
                </Button>
                <Badge color="purple" variant="light">
                  {middlewareChain.length} Middleware
                </Badge>
              </Group>

              <ScrollArea h={250}>
                {middlewareChain.map((middleware, index) => (
                  <Card key={index} withBorder p="sm" mb="xs">
                    <Group justify="space-between">
                      <div>
                        <Text size="sm" fw={500}>{middleware.name}</Text>
                        <Text size="xs" c="dimmed">Priority: {middleware.priority}</Text>
                      </div>
                      <Group gap="xs">
                        <Badge 
                          size="xs" 
                          color={middleware.global ? 'green' : 'blue'}
                        >
                          {middleware.global ? 'Global' : 'Route'}
                        </Badge>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </ScrollArea>
            </Card>

            <Card>
              <Title order={3} mb="md">Request Flow</Title>
              
              <Alert color="blue" title="Middleware Execution Order">
                Middleware executes in priority order (lowest first), with global middleware 
                running before route-specific middleware.
              </Alert>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="plugins" pt="md">
          <Card>
            <Title order={3} mb="md">Plugin Registry</Title>
            
            <Group mb="md">
              <Button onClick={handleCreatePlugin} variant="filled">
                Install Plugin
              </Button>
              <Badge color="green" variant="light">
                {activePlugins.filter(p => p.initialized).length} Active
              </Badge>
              <Badge color="gray" variant="light">
                {activePlugins.length} Total
              </Badge>
            </Group>

            <ScrollArea h={300}>
              {activePlugins.map((plugin, index) => (
                <Card key={index} withBorder p="sm" mb="xs">
                  <Group justify="space-between">
                    <div>
                      <Text size="sm" fw={500}>{plugin.name}</Text>
                      <Text size="xs" c="dimmed">Mode: {plugin.mode}</Text>
                    </div>
                    <Badge 
                      size="xs" 
                      color={plugin.initialized ? 'green' : 'gray'}
                    >
                      {plugin.initialized ? 'Initialized' : 'Pending'}
                    </Badge>
                  </Group>
                </Card>
              ))}
            </ScrollArea>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="modules" pt="md">
          <Stack gap="md">
            <Card>
              <Title order={3} mb="md">Module Configuration</Title>
              
              <Group mb="md">
                <Button onClick={handleInstallModule} variant="filled">
                  Install Module
                </Button>
                <Badge color="blue" variant="light">
                  {installedModules.length} Modules
                </Badge>
              </Group>

              <ScrollArea h={200}>
                {installedModules.map((module, index) => (
                  <Card key={index} withBorder p="sm" mb="xs">
                    <Group justify="space-between">
                      <div>
                        <Text size="sm" fw={500}>{module.name}</Text>
                        <Text size="xs" c="dimmed">v{module.version}</Text>
                      </div>
                      <Badge size="xs" color="green">
                        Installed
                      </Badge>
                    </Group>
                  </Card>
                ))}
              </ScrollArea>
            </Card>

            <Card>
              <Title order={3} mb="md">Build Integration</Title>
              
              <Group grow>
                <div>
                  <Text size="sm" c="dimmed">Build Modules</Text>
                  <Text size="lg" fw={600}>
                    {installedModules.filter(m => m.name.includes('build')).length}
                  </Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Runtime Modules</Text>
                  <Text size="lg" fw={600}>
                    {installedModules.filter(m => !m.name.includes('build')).length}
                  </Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Module Health</Text>
                  <Text size="lg" fw={600} c="green">Excellent</Text>
                </div>
              </Group>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="ssr" pt="md">
          <Stack gap="md">
            <Card>
              <Title order={3} mb="md">SSR Performance</Title>
              
              <Group mb="md">
                <Button onClick={handleSSRSimulation} variant="filled">
                  Simulate SSR
                </Button>
                <Button onClick={handleSSRSimulation} variant="outline">
                  Optimize Bundle
                </Button>
              </Group>

              <Group grow>
                <div>
                  <Text size="sm" c="dimmed">Render Time</Text>
                  <Text size="xl" fw={700}>{ssrMetrics.renderTime.toFixed(1)}ms</Text>
                  <Progress 
                    value={Math.min(ssrMetrics.renderTime / 2, 100)} 
                    color={ssrMetrics.renderTime < 100 ? 'green' : 'orange'} 
                    size="sm" 
                  />
                </div>
                <div>
                  <Text size="sm" c="dimmed">Hydration Time</Text>
                  <Text size="xl" fw={700}>{ssrMetrics.hydrationTime.toFixed(1)}ms</Text>
                  <Progress 
                    value={Math.min(ssrMetrics.hydrationTime / 1, 100)} 
                    color={ssrMetrics.hydrationTime < 50 ? 'green' : 'orange'} 
                    size="sm" 
                  />
                </div>
              </Group>
            </Card>

            <Card>
              <Title order={3} mb="md">Universal Data</Title>
              
              <Group grow>
                <div>
                  <Text size="sm" c="dimmed">Bundle Size</Text>
                  <Text size="lg" fw={600}>{ssrMetrics.bundleSize}KB</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Cache Hit Rate</Text>
                  <Text size="lg" fw={600}>{ssrMetrics.cacheHitRate.toFixed(1)}%</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Hydration Status</Text>
                  <Text size="lg" fw={600} c={isHydrated ? 'green' : 'orange'}>
                    {isHydrated ? 'Hydrated' : 'Pending'}
                  </Text>
                </div>
              </Group>

              <Alert mt="md" color="green" title="Universal Rendering">
                Nuxt 3's universal rendering provides optimal SEO and performance by pre-rendering 
                content on the server and seamlessly hydrating on the client.
              </Alert>
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default DemoNuxtFullStack;