// React Router 7 SSR Implementation Demo
// Note: This is a client-side compatible version for the learning platform
// In production SSR, you would use react-dom/server imports and actual server-side APIs
import React, { createContext, useContext, useState, useEffect, useRef, Suspense } from 'react';
import { hydrateRoot } from 'react-dom/client';
import type { ReactElement, ComponentType, ErrorInfo } from 'react';

// Types
interface SSRContextType {
  isServer: boolean;
  isHydrating: boolean;
  request?: Request;
  response?: Response;
  manifest?: RouteManifest;
  criticalCSS?: string;
  nonce?: string;
}

interface RouteManifest {
  routes: Map<string, RouteConfig>;
  assets: Map<string, AssetInfo>;
  criticalRoutes: Set<string>;
}

interface RouteConfig {
  path: string;
  component: ComponentType | (() => Promise<{ default: ComponentType }>);
  loader?: (args: LoaderArgs) => Promise<any>;
  meta?: (args: MetaArgs) => MetaDescriptor[];
  ErrorBoundary?: ComponentType<ErrorBoundaryProps>;
  hydrationPriority?: 'immediate' | 'normal' | 'idle';
}

interface LoaderArgs {
  request: Request;
  params: Record<string, string>;
  context: any;
}

interface MetaArgs {
  data: any;
  params: Record<string, string>;
  location: Location;
}

interface MetaDescriptor {
  name?: string;
  property?: string;
  content?: string;
  httpEquiv?: string;
}

interface AssetInfo {
  url: string;
  type: 'script' | 'style' | 'image' | 'font';
  size: number;
  critical: boolean;
}

interface HydrationTask {
  id: string;
  priority: 'immediate' | 'normal' | 'idle';
  timestamp: number;
  hydrate: () => Promise<void>;
}

interface StreamRenderOptions {
  lang?: string;
  meta?: MetaDescriptor[];
  criticalCSS?: string;
  links?: LinkDescriptor[];
  initialData?: any;
  bootstrapScripts?: string[];
  onShellReady?: () => void;
  onShellError?: (error: Error) => void;
  onAllReady?: () => void;
  onError?: (error: Error) => void;
}

interface LinkDescriptor {
  rel: string;
  href: string;
  as?: string;
  type?: string;
  crossOrigin?: string;
}

interface ErrorBoundaryProps {
  fallback?: ReactElement;
  fallbackOnServer?: boolean;
  route?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// SSR Context
const SSRContext = createContext<SSRContextType>({
  isServer: typeof window === 'undefined',
  isHydrating: false
});

// SSR Provider
export class SSRProvider extends React.Component<
  {
    children: React.ReactNode;
    isServer: boolean;
    request?: Request;
    manifest?: RouteManifest;
    onHydrationComplete?: () => void;
  },
  {
    isHydrating: boolean;
    hydrationErrors: Error[];
    streamedChunks: Set<string>;
  }
> {
  private hydrationPromises: Map<string, Promise<any>>;
  private streamController?: ReadableStreamDefaultController;

  constructor(props: any) {
    super(props);
    this.hydrationPromises = new Map();

    this.state = {
      isHydrating: !props.isServer && typeof window !== 'undefined' && !window.__HYDRATED__,
      hydrationErrors: [],
      streamedChunks: new Set()
    };
  }

  registerHydrationPromise(key: string, promise: Promise<any>) {
    this.hydrationPromises.set(key, promise);

    promise.finally(() => {
      this.hydrationPromises.delete(key);
      this.checkHydrationComplete();
    });
  }

  private checkHydrationComplete() {
    if (this.hydrationPromises.size === 0 && this.state.isHydrating) {
      this.setState({ isHydrating: false });
      if (typeof window !== 'undefined') {
        window.__HYDRATED__ = true;
      }
      this.props.onHydrationComplete?.();
    }
  }

  renderToStream(): ReadableStream {
    return new ReadableStream({
      start: (controller) => {
        this.streamController = controller;
        this.startStreaming();
      }
    });
  }

  private startStreaming() {
    // Implementation would integrate with React's streaming renderer
    console.log('Starting SSR streaming');
  }

  render() {
    const contextValue: SSRContextType = {
      isServer: this.props.isServer,
      isHydrating: this.state.isHydrating,
      request: this.props.request,
      manifest: this.props.manifest
    };

    return (
      <SSRContext.Provider value={contextValue}>
        {this.props.children}
      </SSRContext.Provider>
    );
  }
}

// Route Handler
export class RouteHandler {
  private routes: Map<string, RouteConfig>;
  private preloadedModules: Set<string>;
  private criticalRoutes: Set<string>;
  private cache: Map<string, CacheEntry>;

  constructor() {
    this.routes = new Map();
    this.preloadedModules = new Set();
    this.criticalRoutes = new Set();
    this.cache = new Map();
  }

  registerRoute(path: string, config: RouteConfig) {
    this.routes.set(path, config);
    if (config.hydrationPriority === 'immediate') {
      this.criticalRoutes.add(path);
    }
  }

  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const route = this.matchRoute(url.pathname);

    if (!route) {
      return this.handle404(request);
    }

    // Check cache
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isCacheExpired(cached)) {
      return new Response(cached.html, {
        headers: cached.headers
      });
    }

    // Preload critical routes
    await this.preloadCriticalRoutes(route);

    // Load route data
    const loaderData = await this.loadRouteData(route, request);

    // Render component
    const { stream, statusCode } = await this.renderRoute(
      route,
      loaderData,
      request
    );

    return new Response(stream, {
      status: statusCode,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': this.getCacheControl(route),
        'Link': this.getResourceHints(route)
      }
    });
  }

  private matchRoute(pathname: string): RouteConfig | null {
    // Simple exact match for demo - real implementation would use path-to-regexp
    return this.routes.get(pathname) || null;
  }

  private async handle404(request: Request): Promise<Response> {
    return new Response('404 Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }

  private async preloadCriticalRoutes(route: RouteConfig): Promise<void> {
    const criticalPaths = this.getCriticalPaths(route);
    
    await Promise.all(
      criticalPaths.map(async (path) => {
        if (!this.preloadedModules.has(path)) {
          const module = await this.loadModule(path);
          this.preloadedModules.add(path);
          return module;
        }
      })
    );
  }

  private getCriticalPaths(route: RouteConfig): string[] {
    // Return paths that should be preloaded for this route
    return [`/js/${route.path}.js`];
  }

  private async loadModule(path: string): Promise<any> {
    // In production, this would perform actual dynamic imports
    // For demo purposes, return a mock module
    return { default: () => React.createElement('div', null, `Module: ${path}`) };
  }

  private async loadRouteData(route: RouteConfig, request: Request): Promise<any> {
    if (!route.loader) {
      return null;
    }

    const params = this.extractParams(route.path, new URL(request.url).pathname);
    
    return route.loader({
      request,
      params,
      context: {}
    });
  }

  private extractParams(pattern: string, pathname: string): Record<string, string> {
    // Simple parameter extraction - real implementation would be more robust
    return {};
  }

  private async renderRoute(
    route: RouteConfig,
    loaderData: any,
    request: Request
  ): Promise<{ stream: ReadableStream; statusCode: number }> {
    const Component = await this.loadComponent(route);
    const renderer = new StreamRenderer();

    const stream = renderer.renderToStream(
      <SSRProvider isServer={true} request={request}>
        <SSRErrorBoundary
          fallback={<div>Something went wrong</div>}
          fallbackOnServer={true}
          route={route.path}
        >
          <Component data={loaderData} />
        </SSRErrorBoundary>
      </SSRProvider>,
      {
        bootstrapScripts: this.getBootstrapScripts(route),
        initialData: loaderData,
        criticalCSS: await this.extractCriticalCSS(route)
      }
    );

    return { stream, statusCode: 200 };
  }

  private async loadComponent(route: RouteConfig): Promise<ComponentType> {
    if (typeof route.component === 'function' && route.component.length === 0) {
      const module = await (route.component as () => Promise<{ default: ComponentType }>)();
      return module.default;
    }
    return route.component as ComponentType;
  }

  private getBootstrapScripts(route: RouteConfig): string[] {
    return [
      '/js/runtime.js',
      '/js/vendor.js',
      `/js/${route.path}.js`
    ];
  }

  private async extractCriticalCSS(route: RouteConfig): Promise<string> {
    // Extract critical CSS for the route
    return `
      /* Critical CSS for ${route.path} */
      body { margin: 0; font-family: system-ui; }
      .container { max-width: 1200px; margin: 0 auto; }
    `;
  }

  private getCacheControl(route: RouteConfig): string {
    if (route.loader) {
      return 'private, max-age=0, must-revalidate';
    }
    return 'public, max-age=3600, s-maxage=86400';
  }

  private getResourceHints(route: RouteConfig): string {
    const hints: string[] = [];

    // Preload critical resources
    const criticalResources = this.getCriticalResources(route);
    criticalResources.forEach(resource => {
      hints.push(`<${resource}>; rel=preload; as=${this.getResourceType(resource)}`);
    });

    // Prefetch next likely navigation
    const nextRoutes = this.predictNextNavigation(route);
    nextRoutes.forEach(nextRoute => {
      const resources = this.getRouteResources(nextRoute);
      resources.forEach(resource => {
        hints.push(`<${resource}>; rel=prefetch`);
      });
    });

    return hints.join(', ');
  }

  private getCriticalResources(route: RouteConfig): string[] {
    return [
      `/js/${route.path}.js`,
      `/css/${route.path}.css`
    ];
  }

  private getResourceType(resource: string): string {
    if (resource.endsWith('.js')) return 'script';
    if (resource.endsWith('.css')) return 'style';
    if (resource.match(/\.(jpg|jpeg|png|webp|avif)$/)) return 'image';
    if (resource.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    return 'fetch';
  }

  private predictNextNavigation(route: RouteConfig): string[] {
    // Predict likely next navigation based on current route
    const predictions: string[] = [];
    
    // Add common navigation patterns
    if (route.path === '/') {
      predictions.push('/about', '/products');
    } else if (route.path.startsWith('/products')) {
      predictions.push('/checkout', '/cart');
    }

    return predictions;
  }

  private getRouteResources(routePath: string): string[] {
    return [
      `/js/${routePath}.js`,
      `/css/${routePath}.css`
    ];
  }

  private getCacheKey(request: Request): string {
    const url = new URL(request.url);
    return `${url.pathname}${url.search}`;
  }

  private isCacheExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.maxAge;
  }
}

// Hydration Manager
export class HydrationManager {
  private hydrationQueue: HydrationTask[];
  private hydrationObserver?: IntersectionObserver;
  private priorityQueue: Map<string, number>;
  private hydratedComponents: Set<string>;
  private metrics: Map<string, HydrationMetrics>;

  constructor(options: { progressive?: boolean } = {}) {
    this.hydrationQueue = [];
    this.priorityQueue = new Map();
    this.hydratedComponents = new Set();
    this.metrics = new Map();

    if (options.progressive) {
      this.setupProgressiveHydration();
    }
  }

  private setupProgressiveHydration() {
    if (typeof window === 'undefined') return;

    this.hydrationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.hydratedComponents.has(entry.target.id)) {
            this.hydrateComponent(entry.target.id);
          }
        });
      },
      {
        rootMargin: '50px'
      }
    );
  }

  scheduleHydration(
    componentId: string,
    priority: 'immediate' | 'normal' | 'idle' = 'normal'
  ) {
    if (this.hydratedComponents.has(componentId)) {
      return;
    }

    const task: HydrationTask = {
      id: componentId,
      priority,
      timestamp: Date.now(),
      hydrate: () => this.performHydration(componentId)
    };

    if (priority === 'immediate') {
      this.performHydration(componentId);
    } else if (priority === 'idle' && typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => this.performHydration(componentId));
    } else {
      this.hydrationQueue.push(task);
      this.processQueue();
    }
  }

  private async processQueue() {
    // Sort queue by priority
    this.hydrationQueue.sort((a, b) => {
      const priorityOrder = { immediate: 0, normal: 1, idle: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    while (this.hydrationQueue.length > 0) {
      const task = this.hydrationQueue.shift()!;
      await task.hydrate();
    }
  }

  private hydrateComponent(componentId: string) {
    this.scheduleHydration(componentId, 'normal');
  }

  private async performHydration(componentId: string) {
    if (typeof window === 'undefined') return;

    const startTime = performance.now();
    const element = document.getElementById(componentId);
    
    if (!element) {
      console.warn(`Element with id ${componentId} not found for hydration`);
      return;
    }

    try {
      const Component = await this.loadComponent(componentId);
      const props = this.extractProps(element);

      // Mark as hydrating
      element.setAttribute('data-hydrating', 'true');

      // Hydrate the component
      const root = hydrateRoot(element, <Component {...props} />, {
        onRecoverableError: (error) => {
          console.warn('Hydration error recovered:', error);
          this.handleHydrationMismatch(componentId, error);
        }
      });

      // Mark as hydrated
      element.setAttribute('data-hydrated', 'true');
      element.removeAttribute('data-hydrating');
      this.hydratedComponents.add(componentId);

      // Track metrics
      const endTime = performance.now();
      this.trackHydrationMetrics(componentId, startTime, endTime);

    } catch (error) {
      console.error(`Failed to hydrate component ${componentId}:`, error);
      this.handleHydrationError(componentId, error as Error);
    }
  }

  private async loadComponent(componentId: string): Promise<ComponentType> {
    // Mock component loading for demo - in real app these would be actual imports
    const componentMap: Record<string, ComponentType> = {
      'header': () => React.createElement('header', { className: 'app-header' }, 
        React.createElement('h1', null, 'App Header'),
        React.createElement('nav', null, 
          React.createElement('a', { href: '/' }, 'Home'),
          React.createElement('a', { href: '/about' }, 'About')
        )
      ),
      'main-content': () => React.createElement('main', { className: 'main-content' },
        React.createElement('h2', null, 'Main Content'),
        React.createElement('p', null, 'This is the main content area.')
      ),
      'footer': () => React.createElement('footer', { className: 'app-footer' },
        React.createElement('p', null, '© 2024 SSR Demo App')
      )
    };

    const component = componentMap[componentId];
    if (!component) {
      throw new Error(`No component found for ${componentId}`);
    }

    // Simulate async loading delay
    await new Promise(resolve => setTimeout(resolve, 10));
    return component;
  }

  private extractProps(element: Element): any {
    const propsAttr = element.getAttribute('data-props');
    if (!propsAttr) return {};

    try {
      return JSON.parse(propsAttr);
    } catch (error) {
      console.error('Failed to parse props:', error);
      return {};
    }
  }

  private handleHydrationMismatch(componentId: string, error: Error) {
    this.logHydrationMismatch({
      componentId,
      error: error.message,
      url: window.location.href,
      timestamp: Date.now()
    });

    // Attempt client-side recovery
    const element = document.getElementById(componentId);
    if (element) {
      element.setAttribute('data-hydration-failed', 'true');
      this.rehydrateOnClient(componentId);
    }
  }

  private handleHydrationError(componentId: string, error: Error) {
    const element = document.getElementById(componentId);
    if (element) {
      element.setAttribute('data-hydration-error', 'true');
      element.setAttribute('data-error-message', error.message);
    }

    // Report to monitoring
    this.reportError({
      type: 'hydration_error',
      componentId,
      error: error.message,
      stack: error.stack
    });
  }

  private rehydrateOnClient(componentId: string) {
    // Force client-side re-render
    const element = document.getElementById(componentId);
    if (!element) return;

    // Clear content and re-render on client
    element.innerHTML = '';
    this.performHydration(componentId);
  }

  private trackHydrationMetrics(componentId: string, startTime: number, endTime: number) {
    const duration = endTime - startTime;
    
    this.metrics.set(componentId, {
      duration,
      timestamp: Date.now(),
      successful: true
    });

    // Report metrics
    if (typeof window !== 'undefined' && window.performance?.measure) {
      window.performance.measure(
        `hydration-${componentId}`,
        {
          start: startTime,
          end: endTime
        }
      );
    }
  }

  private logHydrationMismatch(details: any) {
    console.warn('Hydration mismatch:', details);
    // Send to monitoring service
  }

  private reportError(error: any) {
    console.error('Hydration error:', error);
    // Send to error tracking service
  }

  observeComponent(element: Element) {
    if (this.hydrationObserver) {
      this.hydrationObserver.observe(element);
    }
  }

  disconnectObserver() {
    if (this.hydrationObserver) {
      this.hydrationObserver.disconnect();
    }
  }
}

// Stream Renderer
export class StreamRenderer {
  private encoder: TextEncoder;
  private decoder: TextDecoder;
  private boundary: string;

  constructor() {
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
    this.boundary = `B${Math.random().toString(36).slice(2)}`;
  }

  renderToStream(
    element: ReactElement,
    options: StreamRenderOptions
  ): ReadableStream {
    let shellSent = false;
    let controller: ReadableStreamDefaultController;

    const stream = new ReadableStream({
      start(c) {
        controller = c;
      }
    });

    // Mock streaming for client-side demo (in real SSR, this would use renderToPipeableStream)
    setTimeout(() => {
      if (!shellSent) {
        shellSent = true;
        const shellHTML = this.generateShell(options);
        controller.enqueue(this.encoder.encode(shellHTML));
        options.onShellReady?.();
      }
    }, 0);

    setTimeout(() => {
      // Simulate streaming content
      const contentHTML = '<div id="app-content">Streaming content...</div>';
      controller.enqueue(this.encoder.encode(contentHTML));
    }, 100);

    setTimeout(() => {
      const completeScript = this.generateCompletionScript();
      controller.enqueue(this.encoder.encode(completeScript));
      controller.close();
      options.onAllReady?.();
    }, 200);

    return stream;
  }

  // Note: In production SSR, this would use React's renderToPipeableStream
  // This demo version simulates streaming for client-side execution

  private generateShell(options: StreamRenderOptions): string {
    return `
<!DOCTYPE html>
<html lang="${options.lang || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${options.meta?.map(m => this.renderMeta(m)).join('\n') || ''}
  ${options.criticalCSS ? `<style>${options.criticalCSS}</style>` : ''}
  ${options.links?.map(l => this.renderLink(l)).join('\n') || ''}
  <script>
    window.__INITIAL_DATA__ = ${JSON.stringify(options.initialData || {})};
    window.__STREAM_BOUNDARY__ = "${this.boundary}";
    window.__HYDRATED__ = false;
  </script>
</head>
<body>
  <div id="root"><!--${this.boundary}-->`;
  }

  private generateErrorShell(error: Error, options: StreamRenderOptions): string {
    return `
<!DOCTYPE html>
<html lang="${options.lang || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error</title>
</head>
<body>
  <div id="root">
    <div class="error-container">
      <h1>Something went wrong</h1>
      <p>${error.message}</p>
    </div>
  </div>
</body>
</html>`;
  }

  private generateCompletionScript(): string {
    return `
<!--/${this.boundary}--></div>
<script>
  window.__SSR_COMPLETE__ = true;
  if (window.__onSSRComplete) {
    window.__onSSRComplete();
  }
</script>
${this.generateHydrationScript()}
</body>
</html>`;
  }

  private generateHydrationScript(): string {
    return `
<script type="module">
  import { HydrationManager } from '/js/hydration.js';
  
  const manager = new HydrationManager({ progressive: true });
  
  // Schedule hydration based on priority
  document.querySelectorAll('[data-hydration-priority]').forEach(element => {
    const priority = element.getAttribute('data-hydration-priority');
    manager.scheduleHydration(element.id, priority);
  });
  
  // Observe components for progressive hydration
  document.querySelectorAll('[data-hydrate-on-visible]').forEach(element => {
    manager.observeComponent(element);
  });
</script>`;
  }

  private renderMeta(meta: MetaDescriptor): string {
    const attrs = Object.entries(meta)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    return `<meta ${attrs}>`;
  }

  private renderLink(link: LinkDescriptor): string {
    const attrs = Object.entries(link)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    return `<link ${attrs}>`;
  }
}

// SSR Error Boundary
export class SSRErrorBoundary extends React.Component<
  ErrorBoundaryProps & { children: React.ReactNode },
  {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    isClient: boolean;
  }
> {
  constructor(props: ErrorBoundaryProps & { children: React.ReactNode }) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isClient: typeof window !== 'undefined'
    };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for monitoring
    this.logError({
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      isSSR: !this.state.isClient,
      url: this.state.isClient ? window.location.href : this.props.route
    });

    // Handle based on environment
    if (this.state.isClient) {
      this.handleClientError(error, errorInfo);
    } else {
      this.handleServerError(error, errorInfo);
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  private handleServerError(error: Error, errorInfo: ErrorInfo) {
    if (this.props.fallbackOnServer) {
      this.markForClientRecovery();
    }

    this.reportToMonitoring({
      type: 'ssr_error',
      error,
      errorInfo,
      route: this.props.route
    });
  }

  private handleClientError(error: Error, errorInfo: ErrorInfo) {
    if (this.canRecover(error)) {
      this.attemptRecovery();
    } else {
      this.setState({
        hasError: true,
        error,
        errorInfo
      });
    }
  }

  private canRecover(error: Error): boolean {
    // Check if error is recoverable
    return error.message.includes('ChunkLoadError') ||
           error.message.includes('NetworkError');
  }

  private attemptRecovery() {
    // Attempt to recover from error
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }, 1000);
  }

  private markForClientRecovery() {
    // Mark component for client-side recovery
    if (typeof document !== 'undefined') {
      const marker = document.createElement('script');
      marker.setAttribute('data-error-recovery', 'true');
      marker.textContent = `window.__ERROR_RECOVERY__ = true;`;
      document.head.appendChild(marker);
    }
  }

  private logError(details: any) {
    console.error('Error boundary caught:', details);
  }

  private reportToMonitoring(report: any) {
    // Send to monitoring service
    if (typeof window !== 'undefined' && window.fetch) {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      }).catch(err => console.error('Failed to report error:', err));
    }
  }

  render() {
    if (this.state.hasError) {
      if (!this.state.isClient && this.props.fallbackOnServer) {
        return (
          <div
            data-error-boundary="true"
            data-error={this.state.error?.message}
            suppressHydrationWarning
          >
            {this.props.fallback || <DefaultErrorFallback />}
          </div>
        );
      }

      return this.props.fallback || <DefaultErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Default Error Fallback
const DefaultErrorFallback: React.FC<{ error?: Error | null }> = ({ error }) => (
  <div className="error-boundary-fallback">
    <h2>Something went wrong</h2>
    {error && (
      <details>
        <summary>Error details</summary>
        <pre>{error.message}</pre>
      </details>
    )}
  </div>
);

// Helper types
interface CacheEntry {
  html: string;
  headers: Headers;
  timestamp: number;
  maxAge: number;
}

interface HydrationMetrics {
  duration: number;
  timestamp: number;
  successful: boolean;
}

// Window augmentation
declare global {
  interface Window {
    __HYDRATED__: boolean;
    __INITIAL_DATA__: any;
    __STREAM_BOUNDARY__: string;
    __SSR_COMPLETE__: boolean;
    __ERROR_RECOVERY__: boolean;
    __onSSRComplete?: () => void;
  }
}

// Demo Component
export const DemoSSRApp: React.FC = () => {
  const ssrContext = useContext(SSRContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="ssr-app">
      <header data-hydration-priority="immediate">
        <h1>SSR Demo App</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/products">Products</a>
        </nav>
      </header>

      <main data-hydration-priority="normal">
        <Suspense fallback={<div>Loading...</div>}>
          <div className="content">
            <h2>Server-Side Rendering with React Router 7</h2>
            <p>
              {ssrContext.isServer
                ? 'Rendered on server'
                : mounted
                ? 'Hydrated on client'
                : 'Hydrating...'}
            </p>
          </div>
        </Suspense>
      </main>

      <footer data-hydration-priority="idle">
        <p>&copy; 2024 SSR Demo</p>
      </footer>
    </div>
  );
};

export default DemoSSRApp;