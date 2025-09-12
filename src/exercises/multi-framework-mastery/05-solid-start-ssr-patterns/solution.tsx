// Multi-Framework Mastery - Exercise 05: SolidStart SSR Patterns - SOLUTION
// ========================================================================
// This solution demonstrates SolidStart server-side rendering patterns with React-based
// demonstrations of server functions, islands architecture, and progressive enhancement.

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Button,
  Stack,
  Group,
  Tabs,
  Badge,
  Alert,
  Progress,
  NumberInput,
  TextInput,
  ActionIcon,
  Tooltip,
  Grid,
  Divider,
  Code,
  Table,
  Select,
  JsonInput,
  Loader,
  Switch
} from '@mantine/core';
import {
  IconServer,
  IconWorld,
  IconIsland,
  IconRoute,
  IconFunction,
  IconCpu,
  IconRefresh,
  IconCloudUpload,
  IconBolt,
  IconAnalyze,
  IconCheck,
  IconX,
  IconDatabase
} from '@tabler/icons-react';

// Type Definitions for SolidStart Patterns
interface SSRConfig {
  streaming: boolean;
  islands: boolean;
  hydration: 'full' | 'partial' | 'selective';
  prerender: string[];
}

interface ServerFunction {
  id: string;
  name: string;
  handler: (...args: any[]) => Promise<any>;
  cache?: boolean;
  revalidate?: number;
}

interface Route {
  path: string;
  component: string;
  preload?: boolean;
  ssr: boolean;
  islands?: string[];
}

interface Island {
  id: string;
  component: string;
  props: Record<string, any>;
  hydrated: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface SSRMetrics {
  ttfb: number;
  fcp: number;
  lcp: number;
  hydrationTime: number;
  bundleSize: number;
}

interface DeploymentConfig {
  platform: 'vercel' | 'netlify' | 'cloudflare' | 'node';
  regions: string[];
  optimization: boolean;
  caching: boolean;
}

// SSRProvider: Manages SolidStart SSR configuration and lifecycle
class SSRProvider {
  private config: SSRConfig;
  private renderCache = new Map<string, { html: string; timestamp: number; ttl: number }>();
  private streamControllers = new Map<string, ReadableStreamDefaultController>();

  constructor(initialConfig: SSRConfig) {
    this.config = initialConfig;
  }

  configureSSR(config: Partial<SSRConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('SSR Configuration updated:', this.config);
  }

  renderToStream(component: any, props?: any): ReadableStream {
    return new ReadableStream({
      start: (controller) => {
        const streamId = `stream_${Date.now()}`;
        this.streamControllers.set(streamId, controller);

        // Simulate streaming SSR
        this.simulateStreamingRender(controller, component, props);
      },
      cancel: () => {
        console.log('Stream cancelled');
      }
    });
  }

  renderToString(component: any, props?: any): string {
    // Simulate SSR rendering to string
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SolidStart SSR</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div id="root">${this.renderComponent(component, props)}</div>
          <script src="/client.js"></script>
        </body>
      </html>
    `;
    
    return html;
  }

  handleServerFunction(fn: ServerFunction): any {
    return async (...args: any[]) => {
      const startTime = Date.now();
      
      try {
        // Check cache if enabled
        if (fn.cache) {
          const cacheKey = `${fn.id}_${JSON.stringify(args)}`;
          const cached = this.renderCache.get(cacheKey);
          
          if (cached && Date.now() - cached.timestamp < (fn.revalidate || 60000)) {
            return JSON.parse(cached.html);
          }
        }

        const result = await fn.handler(...args);
        
        // Cache result if needed
        if (fn.cache) {
          const cacheKey = `${fn.id}_${JSON.stringify(args)}`;
          this.renderCache.set(cacheKey, {
            html: JSON.stringify(result),
            timestamp: Date.now(),
            ttl: fn.revalidate || 60000
          });
        }

        console.log(`Server function ${fn.name} executed in ${Date.now() - startTime}ms`);
        return result;
        
      } catch (error) {
        console.error(`Server function ${fn.name} failed:`, error);
        throw error;
      }
    };
  }

  optimizeBundle(): { size: number; chunks: number; treeshaking: number } {
    // Simulate bundle optimization analysis
    return {
      size: Math.floor(Math.random() * 500) + 200, // 200-700KB
      chunks: Math.floor(Math.random() * 10) + 3,   // 3-13 chunks
      treeshaking: Math.floor(Math.random() * 30) + 70 // 70-100%
    };
  }

  private simulateStreamingRender(controller: ReadableStreamDefaultController, component: any, props?: any): void {
    // Simulate progressive rendering
    const parts = [
      '<!DOCTYPE html><html><head><title>SolidStart SSR</title></head><body>',
      '<div id="root">',
      this.renderComponent(component, props),
      '</div>',
      '<script src="/client.js"></script>',
      '</body></html>'
    ];

    let index = 0;
    const streamInterval = setInterval(() => {
      if (index < parts.length) {
        controller.enqueue(new TextEncoder().encode(parts[index]));
        index++;
      } else {
        controller.close();
        clearInterval(streamInterval);
      }
    }, 100);
  }

  private renderComponent(component: any, props?: any): string {
    // Simulate component rendering
    return `<div class="ssr-component">${component.name || 'Component'} rendered with SSR</div>`;
  }

  getCacheMetrics() {
    return {
      totalCached: this.renderCache.size,
      hitRate: Math.random() * 0.8 + 0.1, // 10-90%
      avgResponseTime: Math.random() * 50 + 10 // 10-60ms
    };
  }
}

// RouteHandler: Manages SolidStart routing with SSR considerations
class RouteHandler {
  private routes = new Map<string, Route>();
  private staticPaths = new Set<string>();
  private routeMetrics = new Map<string, { hits: number; avgTime: number }>();

  registerRoute(route: Route): void {
    this.routes.set(route.path, route);
    console.log(`Route registered: ${route.path}`);

    // Initialize metrics
    this.routeMetrics.set(route.path, { hits: 0, avgTime: 0 });
  }

  async preloadRoute(path: string): Promise<void> {
    const route = this.routes.get(path);
    if (!route) {
      throw new Error(`Route not found: ${path}`);
    }

    console.log(`Preloading route: ${path}`);
    
    // Simulate preloading
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`Route preloaded: ${path}`);
  }

  generateStaticPaths(): string[] {
    const staticRoutes = Array.from(this.routes.values())
      .filter(route => !route.path.includes(':') && !route.path.includes('*'))
      .map(route => route.path);
    
    staticRoutes.forEach(path => this.staticPaths.add(path));
    return staticRoutes;
  }

  handleDynamicRoute(path: string, params: Record<string, string>): Route {
    // Find matching dynamic route
    const matchedRoute = Array.from(this.routes.values())
      .find(route => this.matchRoute(route.path, path));

    if (!matchedRoute) {
      throw new Error(`No matching route for: ${path}`);
    }

    // Update metrics
    const metrics = this.routeMetrics.get(matchedRoute.path);
    if (metrics) {
      metrics.hits++;
      metrics.avgTime = (metrics.avgTime + Math.random() * 100) / 2;
    }

    return {
      ...matchedRoute,
      path: path // Use actual path instead of pattern
    };
  }

  optimizeRouting(): { preloadedRoutes: number; cacheHits: number; avgResponseTime: number } {
    const preloadedRoutes = Array.from(this.routes.values())
      .filter(route => route.preload).length;

    const totalHits = Array.from(this.routeMetrics.values())
      .reduce((sum, metrics) => sum + metrics.hits, 0);

    const avgResponseTime = Array.from(this.routeMetrics.values())
      .reduce((sum, metrics) => sum + metrics.avgTime, 0) / this.routeMetrics.size;

    return {
      preloadedRoutes,
      cacheHits: totalHits,
      avgResponseTime: avgResponseTime || 0
    };
  }

  private matchRoute(pattern: string, path: string): boolean {
    // Simple route matching - in real implementation would be more sophisticated
    if (pattern === path) return true;
    
    // Handle dynamic segments
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    if (patternParts.length !== pathParts.length) return false;
    
    return patternParts.every((part, index) => 
      part.startsWith(':') || part === '*' || part === pathParts[index]
    );
  }

  getRouteMetrics() {
    return {
      totalRoutes: this.routes.size,
      staticPaths: this.staticPaths.size,
      avgResponseTime: Array.from(this.routeMetrics.values())
        .reduce((sum, metrics) => sum + metrics.avgTime, 0) / this.routeMetrics.size || 0
    };
  }
}

// ServerFunction: Handles SolidStart server functions and data mutations
class ServerFunctionManager {
  private functions = new Map<string, ServerFunction>();
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private mutationQueue: Array<{ id: string; args: any[]; timestamp: number }> = [];

  createServerFunction<T>(handler: (...args: any[]) => Promise<T>, name: string, options?: { cache?: boolean; revalidate?: number }): ServerFunction {
    const serverFunction: ServerFunction = {
      id: `server_fn_${Date.now()}_${Math.random()}`,
      name,
      handler,
      cache: options?.cache || false,
      revalidate: options?.revalidate || 60000
    };

    this.functions.set(serverFunction.id, serverFunction);
    console.log(`Server function created: ${name}`);

    return serverFunction;
  }

  async executeServerFunction(fnId: string, ...args: any[]): Promise<any> {
    const fn = this.functions.get(fnId);
    if (!fn) {
      throw new Error(`Server function not found: ${fnId}`);
    }

    // Check cache
    if (fn.cache) {
      const cacheKey = `${fnId}_${JSON.stringify(args)}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < (fn.revalidate || 60000)) {
        console.log(`Cache hit for server function: ${fn.name}`);
        return cached.data;
      }
    }

    try {
      const result = await fn.handler(...args);

      // Cache result
      if (fn.cache) {
        const cacheKey = `${fnId}_${JSON.stringify(args)}`;
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          ttl: fn.revalidate || 60000
        });
      }

      return result;
    } catch (error) {
      console.error(`Server function ${fn.name} failed:`, error);
      throw error;
    }
  }

  cacheServerFunction(fnId: string, duration: number): void {
    const fn = this.functions.get(fnId);
    if (fn) {
      fn.cache = true;
      fn.revalidate = duration;
      console.log(`Caching enabled for server function: ${fn.name}`);
    }
  }

  async revalidateCache(fnId: string): Promise<void> {
    const pattern = `${fnId}_`;
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.startsWith(pattern));
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`Cache revalidated for server function: ${fnId}`);
  }

  handleMutations(): void {
    // Process mutation queue
    while (this.mutationQueue.length > 0) {
      const mutation = this.mutationQueue.shift();
      if (mutation) {
        console.log(`Processing mutation: ${mutation.id}`);
        // In real implementation, would apply mutations and invalidate related caches
      }
    }
  }

  addMutation(id: string, args: any[]): void {
    this.mutationQueue.push({
      id,
      args,
      timestamp: Date.now()
    });
  }

  getFunctionMetrics() {
    return {
      totalFunctions: this.functions.size,
      cachedFunctions: Array.from(this.functions.values()).filter(fn => fn.cache).length,
      cacheSize: this.cache.size,
      pendingMutations: this.mutationQueue.length
    };
  }
}

// IslandComponent: Manages islands architecture with selective hydration
class IslandComponent {
  private islands = new Map<string, Island>();
  private hydrationQueue: Array<{ id: string; priority: Island['priority'] }> = [];
  private hydrationMetrics = { totalHydrated: 0, avgHydrationTime: 0 };

  createIsland(component: any, props: any, id: string, priority: Island['priority'] = 'medium'): Island {
    const island: Island = {
      id,
      component: component.name || 'UnnamedComponent',
      props,
      hydrated: false,
      priority
    };

    this.islands.set(id, island);
    console.log(`Island created: ${id} with priority ${priority}`);

    return island;
  }

  async hydrateIsland(islandId: string): Promise<void> {
    const island = this.islands.get(islandId);
    if (!island || island.hydrated) {
      return;
    }

    const startTime = Date.now();
    
    console.log(`Hydrating island: ${islandId}`);
    
    // Simulate hydration process
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
    
    island.hydrated = true;
    const hydrationTime = Date.now() - startTime;
    
    // Update metrics
    this.hydrationMetrics.totalHydrated++;
    this.hydrationMetrics.avgHydrationTime = 
      (this.hydrationMetrics.avgHydrationTime * (this.hydrationMetrics.totalHydrated - 1) + hydrationTime) / 
      this.hydrationMetrics.totalHydrated;

    console.log(`Island hydrated: ${islandId} in ${hydrationTime}ms`);
  }

  prioritizeHydration(priority: Island['priority']): void {
    const islandsToHydrate = Array.from(this.islands.values())
      .filter(island => !island.hydrated && island.priority === priority)
      .map(island => ({ id: island.id, priority: island.priority }));

    this.hydrationQueue.push(...islandsToHydrate);
    this.hydrationQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    console.log(`Prioritized ${islandsToHydrate.length} islands with ${priority} priority`);
  }

  lazyHydrateIsland(islandId: string, trigger: 'visible' | 'idle'): void {
    const island = this.islands.get(islandId);
    if (!island || island.hydrated) {
      return;
    }

    console.log(`Setting up lazy hydration for island: ${islandId} with trigger: ${trigger}`);

    if (trigger === 'visible') {
      // Simulate intersection observer
      setTimeout(() => {
        console.log(`Island ${islandId} became visible, starting hydration`);
        this.hydrateIsland(islandId);
      }, Math.random() * 2000 + 1000);
    } else if (trigger === 'idle') {
      // Simulate idle callback
      setTimeout(() => {
        console.log(`Browser is idle, hydrating island: ${islandId}`);
        this.hydrateIsland(islandId);
      }, Math.random() * 3000 + 2000);
    }
  }

  optimizeIslands(): void {
    // Process hydration queue
    while (this.hydrationQueue.length > 0) {
      const item = this.hydrationQueue.shift();
      if (item) {
        this.hydrateIsland(item.id);
      }
    }
  }

  getIslandMetrics() {
    const totalIslands = this.islands.size;
    const hydratedIslands = Array.from(this.islands.values()).filter(island => island.hydrated).length;
    
    return {
      totalIslands,
      hydratedIslands,
      hydrationProgress: totalIslands > 0 ? (hydratedIslands / totalIslands) * 100 : 0,
      queuedForHydration: this.hydrationQueue.length,
      avgHydrationTime: this.hydrationMetrics.avgHydrationTime
    };
  }
}

export default function SolidStartSSRPatterns() {
  const [activeTab, setActiveTab] = useState('ssr');
  const ssrProvider = useRef(new SSRProvider({
    streaming: true,
    islands: true,
    hydration: 'selective',
    prerender: ['/home', '/about']
  })).current;
  const routeHandler = useRef(new RouteHandler()).current;
  const serverFunctionManager = useRef(new ServerFunctionManager()).current;
  const islandComponent = useRef(new IslandComponent()).current;

  const [metrics, setMetrics] = useState<SSRMetrics>({
    ttfb: 0,
    fcp: 0,
    lcp: 0,
    hydrationTime: 0,
    bundleSize: 0
  });
  
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>({
    platform: 'vercel',
    regions: ['us-east-1'],
    optimization: true,
    caching: true
  });

  const [ssrConfig, setSsrConfig] = useState<SSRConfig>({
    streaming: true,
    islands: true,
    hydration: 'selective',
    prerender: ['/home', '/about']
  });

  const [routeMetrics, setRouteMetrics] = useState({ totalRoutes: 0, staticPaths: 0, avgResponseTime: 0 });
  const [functionMetrics, setFunctionMetrics] = useState({ totalFunctions: 0, cachedFunctions: 0, cacheSize: 0, pendingMutations: 0 });
  const [islandMetrics, setIslandMetrics] = useState({ totalIslands: 0, hydratedIslands: 0, hydrationProgress: 0, queuedForHydration: 0, avgHydrationTime: 0 });

  // Initialize demo data
  useEffect(() => {
    // Register some demo routes
    routeHandler.registerRoute({ path: '/home', component: 'HomePage', ssr: true, preload: true });
    routeHandler.registerRoute({ path: '/about', component: 'AboutPage', ssr: true, preload: false });
    routeHandler.registerRoute({ path: '/user/:id', component: 'UserPage', ssr: true, preload: false });

    // Create demo server functions
    serverFunctionManager.createServerFunction(
      async (userId: string) => ({ id: userId, name: 'John Doe', email: 'john@example.com' }),
      'getUser',
      { cache: true, revalidate: 30000 }
    );

    // Create demo islands
    islandComponent.createIsland({ name: 'Header' }, {}, 'header', 'high');
    islandComponent.createIsland({ name: 'Sidebar' }, {}, 'sidebar', 'medium');
    islandComponent.createIsland({ name: 'Footer' }, {}, 'footer', 'low');

    // Update metrics periodically
    const interval = setInterval(() => {
      setRouteMetrics(routeHandler.getRouteMetrics());
      setFunctionMetrics(serverFunctionManager.getFunctionMetrics());
      setIslandMetrics(islandComponent.getIslandMetrics());
      
      // Simulate performance metrics
      setMetrics({
        ttfb: Math.random() * 200 + 50,
        fcp: Math.random() * 800 + 200,
        lcp: Math.random() * 1500 + 500,
        hydrationTime: Math.random() * 300 + 100,
        bundleSize: Math.random() * 200 + 300
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSSRDemo = () => {
    const html = ssrProvider.renderToString({ name: 'DemoComponent' });
    console.log('SSR HTML generated:', html.substring(0, 200) + '...');
  };

  const handleStreamingDemo = () => {
    const stream = ssrProvider.renderToStream({ name: 'StreamingComponent' });
    console.log('Streaming SSR started');
    
    const reader = stream.getReader();
    reader.read().then(function processChunk({ done, value }) {
      if (done) {
        console.log('Streaming complete');
        return;
      }
      
      console.log('Received chunk:', new TextDecoder().decode(value));
      return reader.read().then(processChunk);
    });
  };

  const handleRoutePreload = async () => {
    try {
      await routeHandler.preloadRoute('/user/:id');
      console.log('Route preloaded successfully');
    } catch (error) {
      console.error('Route preload failed:', error);
    }
  };

  const handleServerFunctionDemo = async () => {
    const functions = Array.from(serverFunctionManager['functions'].values());
    if (functions.length > 0) {
      try {
        const result = await serverFunctionManager.executeServerFunction(functions[0].id, 'user123');
        console.log('Server function result:', result);
      } catch (error) {
        console.error('Server function failed:', error);
      }
    }
  };

  const handleIslandHydration = () => {
    islandComponent.prioritizeHydration('high');
    islandComponent.optimizeIslands();
    console.log('Island hydration prioritized and optimized');
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="md">
            SolidStart SSR Patterns - Solution
          </Title>
          <Text size="lg" c="dimmed" mb="xl">
            Complete implementation of SolidStart server-side rendering patterns with server functions, 
            islands architecture, and progressive enhancement strategies.
          </Text>
        </div>

        <Alert icon={<IconServer />} title="Implementation Complete" color="green">
          <Text size="sm">
            All SolidStart SSR patterns have been implemented including streaming SSR, server functions, 
            islands architecture, and deployment optimization strategies.
          </Text>
        </Alert>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="ssr" leftSection={<IconServer />}>
              SSR Provider
            </Tabs.Tab>
            <Tabs.Tab value="routing" leftSection={<IconRoute />}>
              Route Handling
            </Tabs.Tab>
            <Tabs.Tab value="functions" leftSection={<IconFunction />}>
              Server Functions
            </Tabs.Tab>
            <Tabs.Tab value="islands" leftSection={<IconIsland />}>
              Islands Architecture
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="ssr" pt="md">
            <Stack gap="md">
              <Card>
                <Title order={3} mb="md">SSR Configuration</Title>
                
                <Grid mb="md">
                  <Grid.Col span={6}>
                    <Group justify="space-between">
                      <Text size="sm">Streaming SSR</Text>
                      <Switch
                        checked={ssrConfig.streaming}
                        onChange={(event) => {
                          const newConfig = { ...ssrConfig, streaming: event.currentTarget.checked };
                          setSsrConfig(newConfig);
                          ssrProvider.configureSSR(newConfig);
                        }}
                      />
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Group justify="space-between">
                      <Text size="sm">Islands Architecture</Text>
                      <Switch
                        checked={ssrConfig.islands}
                        onChange={(event) => {
                          const newConfig = { ...ssrConfig, islands: event.currentTarget.checked };
                          setSsrConfig(newConfig);
                          ssrProvider.configureSSR(newConfig);
                        }}
                      />
                    </Group>
                  </Grid.Col>
                </Grid>

                <Group>
                  <Button onClick={handleSSRDemo} leftSection={<IconServer />}>
                    Generate SSR HTML
                  </Button>
                  <Button onClick={handleStreamingDemo} leftSection={<IconBolt />} variant="light">
                    Start Streaming
                  </Button>
                </Group>

                <Code block mt="md">
{`// SSR Configuration
const config = {
  streaming: true,
  islands: true,
  hydration: 'selective',
  prerender: ['/home', '/about']
};

// Render to String
const html = ssrProvider.renderToString(Component);

// Streaming SSR
const stream = ssrProvider.renderToStream(Component);`}
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Streaming Rendering</Title>
                
                <Text size="sm" c="dimmed" mb="md">
                  Streaming SSR enables progressive loading and faster TTFB by sending HTML chunks as they're ready.
                </Text>

                <Badge color="blue" mb="md">TTFB: {metrics.ttfb.toFixed(0)}ms</Badge>

                <Code block>
{`// Streaming Implementation
renderToStream(component) {
  return new ReadableStream({
    start(controller) {
      // Send HTML chunks progressively
      controller.enqueue(doctype + htmlStart);
      
      // Render and stream component chunks
      renderComponentChunks(component).forEach(chunk => {
        controller.enqueue(chunk);
      });
      
      controller.close();
    }
  });
}`}
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Server-Side Data Fetching</Title>
                
                <Text size="sm" c="dimmed" mb="md">
                  Data is fetched on the server before rendering, providing SEO benefits and faster initial page loads.
                </Text>

                <Code block>
{`// Server-Side Data Fetching
export async function getServerSideProps() {
  const data = await fetch('/api/data');
  return {
    props: { data: await data.json() }
  };
}

// Component with SSR data
function Page({ data }) {
  return <div>{data.title}</div>;
}`}
                </Code>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="routing" pt="md">
            <Stack gap="md">
              <Card>
                <Title order={3} mb="md">Route Registration & Optimization</Title>
                
                <Group align="center" mb="md">
                  <Text>Total Routes: <Code>{routeMetrics.totalRoutes}</Code></Text>
                  <Text>Static Paths: <Code>{routeMetrics.staticPaths}</Code></Text>
                  <Button onClick={handleRoutePreload} leftSection={<IconRefresh />} size="sm">
                    Preload Route
                  </Button>
                </Group>

                <Code block>
{`// Route Registration
routeHandler.registerRoute({
  path: '/user/:id',
  component: 'UserPage',
  ssr: true,
  preload: true,
  islands: ['UserProfile', 'UserPosts']
});

// Route Preloading
await routeHandler.preloadRoute('/user/:id');`}
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Static Path Generation</Title>
                
                <Text size="sm" c="dimmed" mb="md">
                  Automatically generate static paths for prerendering at build time.
                </Text>

                <Code block>
{`// Static Path Generation
function generateStaticPaths() {
  return [
    '/home',
    '/about',
    '/products/1',
    '/products/2',
    // ... dynamically generated paths
  ];
}

// Prerender Configuration
export const prerender = generateStaticPaths();`}
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Dynamic Route Handling</Title>
                
                <Text size="sm" c="dimmed" mb="md">
                  Handle dynamic routes with parameter extraction and validation.
                </Text>

                <Badge color="green" mb="md">Avg Response Time: {routeMetrics.avgResponseTime.toFixed(1)}ms</Badge>

                <Code block>
{`// Dynamic Route Matching
const route = routeHandler.handleDynamicRoute('/user/123', {
  id: '123'
});

// Route with Multiple Parameters
'/posts/:category/:slug' matches '/posts/tech/solid-start-guide'
// params: { category: 'tech', slug: 'solid-start-guide' }`}
                </Code>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="functions" pt="md">
            <Stack gap="md">
              <Card>
                <Title order={3} mb="md">Server Function Creation</Title>
                
                <Group align="center" mb="md">
                  <Text>Total Functions: <Code>{functionMetrics.totalFunctions}</Code></Text>
                  <Text>Cached: <Code>{functionMetrics.cachedFunctions}</Code></Text>
                  <Button onClick={handleServerFunctionDemo} leftSection={<IconFunction />} size="sm">
                    Execute Function
                  </Button>
                </Group>

                <Code block>
{`// Server Function Definition
const getUser = serverFunctionManager.createServerFunction(
  async (userId: string) => {
    const user = await db.users.findById(userId);
    return { 
      id: user.id, 
      name: user.name, 
      email: user.email 
    };
  },
  'getUser',
  { 
    cache: true, 
    revalidate: 30000 // 30 seconds
  }
);

// Client Usage
const userData = await getUser('123');`}
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Caching & Revalidation</Title>
                
                <Group justify="space-between" mb="md">
                  <Text>Cache Size: <Code>{functionMetrics.cacheSize}</Code></Text>
                  <Badge color="blue">Hit Rate: 85%</Badge>
                </Group>

                <Code block>
{`// Caching Configuration
serverFunctionManager.cacheServerFunction('getUserData', 60000);

// Manual Revalidation
await serverFunctionManager.revalidateCache('getUserData');

// Automatic Revalidation
// Cache expires after specified TTL and refetches on next request`}
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Server Actions & Mutations</Title>
                
                <Text>Pending Mutations: <Code>{functionMetrics.pendingMutations}</Code></Text>

                <Code block mt="md">
{`// Server Action for Mutations
const updateUser = createServerAction(async (userId, data) => {
  const updatedUser = await db.users.update(userId, data);
  
  // Invalidate related caches
  await revalidateCache('getUserData');
  
  return updatedUser;
});

// Form Integration
<form action={updateUser}>
  <input name="name" value={user.name} />
  <button type="submit">Update User</button>
</form>`}
                </Code>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="islands" pt="md">
            <Stack gap="md">
              <Card>
                <Title order={3} mb="md">Island Creation & Management</Title>
                
                <Grid align="center" mb="md">
                  <Grid.Col span={4}>
                    <Text size="sm">Total Islands: <Code>{islandMetrics.totalIslands}</Code></Text>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Text size="sm">Hydrated: <Code>{islandMetrics.hydratedIslands}</Code></Text>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Button onClick={handleIslandHydration} size="sm" leftSection={<IconIsland />}>
                      Hydrate Islands
                    </Button>
                  </Grid.Col>
                </Grid>

                <Progress value={islandMetrics.hydrationProgress} mb="md" />

                <Code block>
{`// Island Creation
const headerIsland = islandComponent.createIsland(
  HeaderComponent,
  { user: userData },
  'header',
  'high' // Priority: high, medium, low
);

// Selective Hydration
await islandComponent.hydrateIsland('header');`}
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Hydration Strategies</Title>
                
                <Text>Avg Hydration Time: <Code>{islandMetrics.avgHydrationTime.toFixed(1)}ms</Code></Text>

                <Code block mt="md">
{`// Lazy Hydration with Intersection Observer
islandComponent.lazyHydrateIsland('sidebar', 'visible');

// Idle Hydration
islandComponent.lazyHydrateIsland('footer', 'idle');

// Priority-based Hydration
islandComponent.prioritizeHydration('high');`}
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Island Communication</Title>
                
                <Text size="sm" c="dimmed" mb="md">
                  Islands can communicate through shared state or custom events.
                </Text>

                <Code block>
{`// Island Communication via Events
// Island A
const emitEvent = (data) => {
  window.dispatchEvent(new CustomEvent('island-update', { 
    detail: data 
  }));
};

// Island B
window.addEventListener('island-update', (event) => {
  updateIslandState(event.detail);
});

// Shared Store for Islands
const sharedStore = createStore({ user: null, theme: 'light' });`}
                </Code>
              </Card>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Grid>
          <Grid.Col span={6}>
            <Card>
              <Title order={3} mb="md">Performance Metrics</Title>
              
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Time to First Byte (TTFB)</Text>
                  <Badge color={metrics.ttfb < 100 ? 'green' : metrics.ttfb < 200 ? 'orange' : 'red'}>
                    {metrics.ttfb.toFixed(0)}ms
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">First Contentful Paint (FCP)</Text>
                  <Badge color={metrics.fcp < 500 ? 'green' : metrics.fcp < 1000 ? 'orange' : 'red'}>
                    {metrics.fcp.toFixed(0)}ms
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Largest Contentful Paint (LCP)</Text>
                  <Badge color={metrics.lcp < 1000 ? 'green' : metrics.lcp < 2000 ? 'orange' : 'red'}>
                    {metrics.lcp.toFixed(0)}ms
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Hydration Time</Text>
                  <Badge color={metrics.hydrationTime < 200 ? 'green' : 'orange'}>
                    {metrics.hydrationTime.toFixed(0)}ms
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Bundle Size</Text>
                  <Badge color={metrics.bundleSize < 400 ? 'green' : 'orange'}>
                    {metrics.bundleSize.toFixed(0)}KB
                  </Badge>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={6}>
            <Card>
              <Title order={3} mb="md">Deployment Configuration</Title>
              
              <Stack gap="md">
                <Select
                  label="Platform"
                  value={deploymentConfig.platform}
                  onChange={(value) => setDeploymentConfig(prev => ({ 
                    ...prev, 
                    platform: value as DeploymentConfig['platform']
                  }))}
                  data={[
                    { value: 'vercel', label: 'Vercel' },
                    { value: 'netlify', label: 'Netlify' },
                    { value: 'cloudflare', label: 'Cloudflare Workers' },
                    { value: 'node', label: 'Node.js Server' }
                  ]}
                />

                <Group justify="space-between">
                  <Text size="sm">Optimization</Text>
                  <Switch
                    checked={deploymentConfig.optimization}
                    onChange={(event) => setDeploymentConfig(prev => ({
                      ...prev, optimization: event.currentTarget.checked
                    }))}
                  />
                </Group>

                <Group justify="space-between">
                  <Text size="sm">Caching</Text>
                  <Switch
                    checked={deploymentConfig.caching}
                    onChange={(event) => setDeploymentConfig(prev => ({
                      ...prev, caching: event.currentTarget.checked
                    }))}
                  />
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        <Card>
          <Title order={3} mb="md">SolidStart Application Architecture</Title>
          
          <Text size="sm" c="dimmed" mb="md">
            Complete SolidStart SSR architecture with streaming rendering, server functions, 
            islands-based hydration, and optimized deployment strategies.
          </Text>

          <Code block>
{`// Complete SolidStart Setup
export default defineConfig({
  // Vite configuration
  ssr: {
    streaming: true,
    islands: ['Header', 'Sidebar', 'InteractiveWidget']
  },
  
  // Server functions
  serverFunctions: {
    cache: true,
    revalidate: 60000
  },
  
  // Deployment
  adapter: 'vercel', // or netlify, cloudflare, node
  
  // Performance optimization
  build: {
    target: 'es2020',
    minify: true,
    sourcemap: false
  }
});`}
          </Code>
        </Card>
      </Stack>
    </Container>
  );
}