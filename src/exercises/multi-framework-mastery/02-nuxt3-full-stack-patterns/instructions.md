# Exercise 02: Nuxt 3 Full-Stack Patterns

## Overview
Master Nuxt 3's full-stack development capabilities including server-side rendering, Nitro server integration, middleware patterns, and plugin architecture. This exercise focuses on building comprehensive full-stack applications with Nuxt 3's modern architecture and deployment strategies.

## Learning Objectives
- Master Nuxt 3 server-side rendering and universal mode
- Implement server routes with Nitro server engine
- Build middleware systems for request processing
- Create and manage Nuxt plugins and modules
- Optimize SSR performance and deployment
- Understand Nuxt 3's build and deployment pipeline

## Key Concepts

### Nuxt 3 Architecture
- **Universal Rendering**: Seamless client/server rendering
- **Nitro Server**: High-performance server engine
- **Auto-imports**: Automatic component and composable imports
- **File-based Routing**: Convention over configuration routing
- **Server Directory**: API routes and server-side logic

### Server-Side Rendering
- **Hydration**: Client-side takeover of server-rendered HTML
- **Payload Extraction**: Optimized data serialization
- **Route-level Rendering**: Per-route rendering strategies
- **Performance Optimization**: Critical resource prioritization
- **SEO Optimization**: Meta tags and structured data

### Nitro Server Engine
- **Universal Deployment**: Deploy anywhere (serverless, edge, traditional)
- **Hot Module Replacement**: Fast development iteration
- **Route Handling**: Dynamic API route creation
- **Middleware Integration**: Request/response processing
- **Static Generation**: Pre-rendering capabilities

## Implementation Requirements

### 1. ServerRoutes
```typescript
class ServerRoutes {
  // Route registration and management
  // Middleware integration
  // Request handling and response formatting
  // Dynamic route creation
}
```

### 2. MiddlewareSystem
```typescript
class MiddlewareSystem {
  // Global and route-specific middleware
  // Request/response transformation
  // Error handling and recovery
  // Performance monitoring
}
```

### 3. PluginManager
```typescript
class PluginManager {
  // Plugin registration and lifecycle
  // Context injection and sharing
  // Hook system for extensibility
  // Development and production modes
}
```

### 4. ModuleIntegration
```typescript
class ModuleIntegration {
  // Module installation and configuration
  // Build-time and runtime integration
  // Dependency resolution
  // Module ecosystem management
}
```

## Technical Implementation

### Server Route Structure
```typescript
interface ServerRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: (event: H3Event) => any;
  middleware?: string[];
  meta?: {
    auth?: boolean;
    cache?: number;
    rateLimit?: number;
  };
}
```

### Middleware Configuration
```typescript
interface MiddlewareConfig {
  name: string;
  global: boolean;
  route?: string | RegExp;
  priority: number;
  handler: (event: H3Event, next: () => void) => Promise<void>;
}
```

### Plugin Definition
```typescript
interface PluginDefinition {
  name: string;
  mode: 'all' | 'client' | 'server';
  setup: (nuxtApp: NuxtApp) => void;
  options?: Record<string, any>;
  dependencies?: string[];
}
```

### Module Configuration
```typescript
interface ModuleConfig {
  name: string;
  version: string;
  options: Record<string, any>;
  configKey?: string;
  defaults?: Record<string, any>;
  setup?: (options: any, nuxt: Nuxt) => void;
}
```

## Advanced Features

### 1. Server API Routes
- **H3 Integration**: Modern server framework integration
- **Request Validation**: Input validation and sanitization
- **Response Formatting**: Consistent API response structure
- **Error Handling**: Centralized error processing
- **Authentication**: JWT and session-based auth patterns

### 2. Universal Data Fetching
- **useFetch**: Reactive data fetching with caching
- **useAsyncData**: Advanced async data handling
- **Server-only**: Server-side data fetching
- **Hydration**: Client-side state hydration
- **Error Boundaries**: Data fetching error handling

### 3. Build Optimization
- **Tree Shaking**: Unused code elimination
- **Bundle Splitting**: Optimal chunk strategies
- **Critical CSS**: Above-the-fold CSS extraction
- **Image Optimization**: Automatic image processing
- **Preload Strategies**: Resource preloading optimization

### 4. Deployment Strategies
- **Static Generation**: JAMstack deployment
- **Server-Side Rendering**: Dynamic SSR deployment
- **Hybrid Rendering**: Mixed rendering strategies
- **Edge Deployment**: CDN and edge computing
- **Serverless Functions**: Function-as-a-Service deployment

## Nuxt vs Next.js Comparison

### File Structure
```typescript
// Nuxt 3: Convention-based
pages/
  index.vue          // Route: /
  about.vue          // Route: /about
  posts/
    [slug].vue       // Route: /posts/:slug

server/
  api/
    users.get.ts     // API: GET /api/users
    users.post.ts    // API: POST /api/users

// Next.js: Also convention-based
pages/
  index.tsx          // Route: /
  about.tsx          // Route: /about
  posts/
    [slug].tsx       // Route: /posts/:slug

pages/api/
  users.ts           // API: /api/users (all methods)
```

### Data Fetching
```typescript
// Nuxt 3: Built-in composables
const { data, pending, error } = await useFetch('/api/users');
const { data } = await useAsyncData('users', () => fetchUsers());

// Next.js: Multiple patterns
export async function getServerSideProps() {
  const users = await fetchUsers();
  return { props: { users } };
}

// Or with SWR/React Query
const { data, error } = useSWR('/api/users', fetcher);
```

### Server Routes
```typescript
// Nuxt 3: File-based API routes
// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  return await getUsers();
});

// Next.js: API routes
// pages/api/users.ts
export default function handler(req, res) {
  if (req.method === 'GET') {
    const users = await getUsers();
    res.json(users);
  }
}
```

## Implementation Strategy

### 1. Server Route Management
```typescript
class NuxtServerRoutes {
  private routes = new Map<string, ServerRoute>();
  private middleware = new Map<string, MiddlewareConfig>();
  
  addRoute(route: ServerRoute): void {
    const key = `${route.method}:${route.path}`;
    this.routes.set(key, route);
  }
  
  async handleRequest(path: string, method: string, event: any): Promise<any> {
    const key = `${method}:${path}`;
    const route = this.routes.get(key);
    
    if (!route) {
      throw new Error(`Route not found: ${key}`);
    }
    
    // Execute middleware chain
    await this.executeMiddleware(route, event);
    
    // Execute route handler
    return await route.handler(event);
  }
  
  private async executeMiddleware(route: ServerRoute, event: any): Promise<void> {
    const middlewareChain = route.middleware || [];
    
    for (const middlewareName of middlewareChain) {
      const middleware = this.middleware.get(middlewareName);
      if (middleware) {
        await middleware.handler(event, () => {});
      }
    }
  }
}
```

### 2. Plugin System
```typescript
class NuxtPluginManager {
  private plugins = new Map<string, PluginDefinition>();
  private context = new Map<string, any>();
  
  registerPlugin(plugin: PluginDefinition): void {
    this.plugins.set(plugin.name, plugin);
  }
  
  async initializePlugins(nuxtApp: any): Promise<void> {
    const sortedPlugins = Array.from(this.plugins.values())
      .sort((a, b) => (a.dependencies?.length || 0) - (b.dependencies?.length || 0));
    
    for (const plugin of sortedPlugins) {
      await this.initializePlugin(plugin, nuxtApp);
    }
  }
  
  private async initializePlugin(plugin: PluginDefinition, nuxtApp: any): Promise<void> {
    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.context.has(dep)) {
          throw new Error(`Plugin ${plugin.name} depends on ${dep} which is not available`);
        }
      }
    }
    
    // Setup plugin
    await plugin.setup(nuxtApp);
    this.context.set(plugin.name, true);
  }
}
```

### 3. Universal Data Management
```typescript
class UniversalDataManager {
  private cache = new Map<string, any>();
  private hydrationData = new Map<string, any>();
  
  async fetchData<T>(key: string, fetcher: () => Promise<T>, options?: {
    server?: boolean;
    client?: boolean;
    cache?: boolean;
  }): Promise<T> {
    const opts = { server: true, client: true, cache: true, ...options };
    
    // Check cache first
    if (opts.cache && this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // Server-side fetching
    if (typeof window === 'undefined' && opts.server) {
      const data = await fetcher();
      
      if (opts.cache) {
        this.cache.set(key, data);
      }
      
      // Store for hydration
      this.hydrationData.set(key, data);
      return data;
    }
    
    // Client-side fetching
    if (typeof window !== 'undefined' && opts.client) {
      // Check hydration data first
      if (this.hydrationData.has(key)) {
        const data = this.hydrationData.get(key);
        this.hydrationData.delete(key); // Use once
        return data;
      }
      
      const data = await fetcher();
      
      if (opts.cache) {
        this.cache.set(key, data);
      }
      
      return data;
    }
    
    throw new Error(`Data fetching not available for key: ${key}`);
  }
  
  serializeForHydration(): string {
    const data = Object.fromEntries(this.hydrationData);
    return JSON.stringify(data);
  }
  
  hydrateFromSerialized(serialized: string): void {
    const data = JSON.parse(serialized);
    Object.entries(data).forEach(([key, value]) => {
      this.hydrationData.set(key, value);
    });
  }
}
```

### 4. Module Integration
```typescript
class NuxtModuleManager {
  private modules = new Map<string, ModuleConfig>();
  private buildModules = new Set<string>();
  
  installModule(module: ModuleConfig): void {
    this.modules.set(module.name, module);
    
    // Validate dependencies
    if (module.dependencies) {
      for (const dep of module.dependencies) {
        if (!this.modules.has(dep)) {
          console.warn(`Module ${module.name} depends on ${dep} which is not installed`);
        }
      }
    }
  }
  
  configureModule(name: string, options: Record<string, any>): void {
    const module = this.modules.get(name);
    if (!module) {
      throw new Error(`Module not found: ${name}`);
    }
    
    module.options = { ...module.defaults, ...options };
  }
  
  buildModuleChain(): ModuleConfig[] {
    // Topological sort based on dependencies
    const sorted: ModuleConfig[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (moduleName: string): void => {
      if (visiting.has(moduleName)) {
        throw new Error(`Circular dependency detected involving ${moduleName}`);
      }
      
      if (visited.has(moduleName)) {
        return;
      }
      
      visiting.add(moduleName);
      
      const module = this.modules.get(moduleName);
      if (module?.dependencies) {
        for (const dep of module.dependencies) {
          visit(dep);
        }
      }
      
      visiting.delete(moduleName);
      visited.add(moduleName);
      
      if (module) {
        sorted.push(module);
      }
    };
    
    Array.from(this.modules.keys()).forEach(visit);
    return sorted;
  }
}
```

## Performance Optimization

### SSR Optimization
```typescript
class SSROptimizer {
  private renderCache = new Map<string, string>();
  private criticalCSS = new Map<string, string>();
  
  async renderWithCaching(path: string, context: any): Promise<string> {
    const cacheKey = this.generateCacheKey(path, context);
    
    if (this.renderCache.has(cacheKey)) {
      return this.renderCache.get(cacheKey)!;
    }
    
    const html = await this.render(path, context);
    
    // Cache for 5 minutes
    this.renderCache.set(cacheKey, html);
    setTimeout(() => this.renderCache.delete(cacheKey), 5 * 60 * 1000);
    
    return html;
  }
  
  private generateCacheKey(path: string, context: any): string {
    return `${path}:${JSON.stringify(context)}`;
  }
  
  private async render(path: string, context: any): Promise<string> {
    // Simulate SSR rendering
    const criticalCSS = await this.extractCriticalCSS(path);
    const pageContent = await this.renderPage(path, context);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${criticalCSS}</style>
        </head>
        <body>
          ${pageContent}
          <script>window.__NUXT_DATA__ = ${JSON.stringify(context)};</script>
        </body>
      </html>
    `;
  }
  
  private async extractCriticalCSS(path: string): Promise<string> {
    if (this.criticalCSS.has(path)) {
      return this.criticalCSS.get(path)!;
    }
    
    // Simulate critical CSS extraction
    const css = `/* Critical CSS for ${path} */ body { margin: 0; }`;
    this.criticalCSS.set(path, css);
    return css;
  }
  
  private async renderPage(path: string, context: any): Promise<string> {
    // Simulate page rendering
    return `<div id="app">Page content for ${path}</div>`;
  }
}
```

## Testing Strategy

### Server Route Testing
```typescript
describe('Nuxt server routes', () => {
  test('should handle GET request', async () => {
    const routes = new NuxtServerRoutes();
    routes.addRoute({
      path: '/api/users',
      method: 'GET',
      handler: async () => ({ users: [] })
    });
    
    const result = await routes.handleRequest('/api/users', 'GET', {});
    expect(result).toEqual({ users: [] });
  });
  
  test('should execute middleware chain', async () => {
    const middleware = jest.fn();
    const routes = new NuxtServerRoutes();
    
    routes.addMiddleware({
      name: 'auth',
      handler: middleware
    });
    
    routes.addRoute({
      path: '/api/protected',
      method: 'GET',
      handler: async () => ({ data: 'protected' }),
      middleware: ['auth']
    });
    
    await routes.handleRequest('/api/protected', 'GET', {});
    expect(middleware).toHaveBeenCalled();
  });
});
```

### Plugin System Testing
```typescript
describe('Nuxt plugins', () => {
  test('should initialize plugins in correct order', async () => {
    const manager = new NuxtPluginManager();
    const initOrder: string[] = [];
    
    manager.registerPlugin({
      name: 'plugin-b',
      dependencies: ['plugin-a'],
      setup: () => initOrder.push('plugin-b')
    });
    
    manager.registerPlugin({
      name: 'plugin-a',
      setup: () => initOrder.push('plugin-a')
    });
    
    await manager.initializePlugins({});
    expect(initOrder).toEqual(['plugin-a', 'plugin-b']);
  });
});
```

## Production Considerations

### Deployment Optimization
- **Bundle Analysis**: Analyze and optimize bundle size
- **Tree Shaking**: Remove unused code and modules
- **Code Splitting**: Implement optimal chunk strategies
- **Preloading**: Configure resource preloading
- **Caching**: Implement effective caching strategies

### Performance Monitoring
- **Core Web Vitals**: Monitor LCP, FID, CLS metrics
- **Server Response Time**: Track SSR performance
- **Hydration Time**: Monitor client-side takeover
- **Memory Usage**: Track server memory consumption
- **Error Tracking**: Comprehensive error monitoring

### Security Considerations
- **Input Validation**: Validate all server inputs
- **CSRF Protection**: Cross-site request forgery protection
- **Rate Limiting**: API rate limiting and throttling
- **Content Security Policy**: CSP header configuration
- **Authentication**: Secure authentication patterns

## Deliverables

1. **ServerRoutes**: Complete server route management system
2. **MiddlewareSystem**: Request/response middleware processing
3. **PluginManager**: Plugin registration and lifecycle management
4. **ModuleIntegration**: Module installation and configuration system
5. **SSR Optimizer**: Server-side rendering performance optimization
6. **Universal Data**: Client/server data fetching and hydration
7. **Deployment Strategy**: Production deployment patterns and optimization

Focus on building production-ready Nuxt 3 applications with optimal SSR performance, comprehensive middleware systems, and scalable plugin architecture.