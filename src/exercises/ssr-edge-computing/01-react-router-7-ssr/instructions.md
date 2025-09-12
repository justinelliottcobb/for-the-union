# React Router 7 SSR Implementation

> **Note**: This exercise demonstrates SSR concepts in a client-side compatible format for the learning platform. In production, you would use server-side specific APIs like `renderToPipeableStream` from `react-dom/server` and run this code on an actual server.

## Learning Objectives
- Master React Router 7 server-side rendering patterns
- Implement streaming SSR with progressive enhancement
- Build hydration-aware components with error boundaries
- Optimize route-based code splitting for performance
- Create production-ready SSR infrastructure

## Prerequisites
- Strong understanding of React and React Router
- Knowledge of Node.js server development
- Understanding of SSR/CSR concepts
- Familiarity with streaming APIs
- TypeScript proficiency

## Exercise Overview

Build a comprehensive SSR implementation using React Router 7 patterns, focusing on streaming rendering, progressive enhancement, and optimal hydration strategies.

## Step-by-Step Instructions

### Step 1: SSR Provider Implementation

Create a provider that manages server-side rendering context:

```typescript
interface SSRContextType {
  isServer: boolean;
  isHydrating: boolean;
  request?: Request;
  response?: Response;
  manifest?: RouteManifest;
  criticalCSS?: string;
  nonce?: string;
}

class SSRProvider extends React.Component<SSRProviderProps, SSRProviderState> {
  private hydrationPromises: Map<string, Promise<any>>;
  private streamController?: ReadableStreamDefaultController;
  
  constructor(props: SSRProviderProps) {
    super(props);
    this.hydrationPromises = new Map();
    
    this.state = {
      isHydrating: !props.isServer && !window.__HYDRATED__,
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
      window.__HYDRATED__ = true;
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
}
```

### Step 2: Route Handler with Code Splitting

Implement a route handler that supports server-side code splitting:

```typescript
interface RouteConfig {
  path: string;
  component: React.ComponentType | (() => Promise<{ default: React.ComponentType }>);
  loader?: (args: LoaderArgs) => Promise<any>;
  meta?: (args: MetaArgs) => MetaDescriptor[];
  ErrorBoundary?: React.ComponentType<ErrorBoundaryProps>;
}

class RouteHandler {
  private routes: Map<string, RouteConfig>;
  private preloadedModules: Set<string>;
  private criticalRoutes: Set<string>;
  
  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const route = this.matchRoute(url.pathname);
    
    if (!route) {
      return this.handle404(request);
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
  
  private async renderRoute(
    route: RouteConfig,
    loaderData: any,
    request: Request
  ) {
    const Component = await this.loadComponent(route);
    
    const stream = renderToPipeableStream(
      <SSRProvider
        isServer={true}
        request={request}
        manifest={this.getManifest()}
      >
        <RouterProvider
          router={this.createRouter(route, loaderData)}
          fallbackElement={<RouteSpinner />}
        />
      </SSRProvider>,
      {
        bootstrapScripts: this.getBootstrapScripts(route),
        onShellReady() {
          // Shell is ready, start streaming
        },
        onError(error) {
          console.error('SSR Error:', error);
        }
      }
    );
    
    return { stream, statusCode: 200 };
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
}
```

### Step 3: Hydration Manager

Create a hydration manager that handles progressive enhancement:

```typescript
class HydrationManager {
  private hydrationQueue: HydrationTask[];
  private hydrationObserver?: IntersectionObserver;
  private priorityQueue: Map<string, number>;
  
  constructor(options: HydrationOptions) {
    this.hydrationQueue = [];
    this.priorityQueue = new Map();
    
    if (options.progressive) {
      this.setupProgressiveHydration();
    }
  }
  
  private setupProgressiveHydration() {
    this.hydrationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
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
    priority: HydrationPriority = 'normal'
  ) {
    const task: HydrationTask = {
      id: componentId,
      priority,
      timestamp: Date.now(),
      hydrate: () => this.performHydration(componentId)
    };
    
    if (priority === 'immediate') {
      this.performHydration(componentId);
    } else if (priority === 'idle') {
      requestIdleCallback(() => this.performHydration(componentId));
    } else {
      this.hydrationQueue.push(task);
      this.processQueue();
    }
  }
  
  private async performHydration(componentId: string) {
    const element = document.getElementById(componentId);
    if (!element) return;
    
    const Component = await this.loadComponent(componentId);
    const props = this.extractProps(element);
    
    // Use React 18's selective hydration
    const root = hydrateRoot(element, <Component {...props} />, {
      onRecoverableError: (error) => {
        console.warn('Hydration error recovered:', error);
        this.handleHydrationMismatch(componentId, error);
      }
    });
    
    this.trackHydrationMetrics(componentId);
  }
  
  private handleHydrationMismatch(
    componentId: string,
    error: Error
  ) {
    // Log mismatch for monitoring
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
}
```

### Step 4: Stream Renderer

Implement streaming SSR with progressive rendering:

```typescript
class StreamRenderer {
  private encoder: TextEncoder;
  private decoder: TextDecoder;
  private boundary: string;
  
  constructor() {
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
    this.boundary = `B${Math.random().toString(36).slice(2)}`;
  }
  
  renderToStream(
    element: React.ReactElement,
    options: StreamRenderOptions
  ): ReadableStream {
    let shellSent = false;
    let controller: ReadableStreamDefaultController;
    
    const stream = new ReadableStream({
      start(c) {
        controller = c;
      }
    });
    
    const { pipe, abort } = renderToPipeableStream(element, {
      ...options,
      
      onShellReady() {
        if (!shellSent) {
          shellSent = true;
          const shellHTML = this.generateShell(options);
          controller.enqueue(this.encoder.encode(shellHTML));
        }
      },
      
      onShellError(error) {
        if (!shellSent) {
          shellSent = true;
          const errorHTML = this.generateErrorShell(error, options);
          controller.enqueue(this.encoder.encode(errorHTML));
        }
      },
      
      onAllReady() {
        // All suspense boundaries have resolved
        const completeScript = this.generateCompletionScript();
        controller.enqueue(this.encoder.encode(completeScript));
        controller.close();
      },
      
      onError(error) {
        console.error('Streaming error:', error);
        options.onError?.(error);
      }
    });
    
    // Handle streaming with backpressure
    const reader = pipe.getReader();
    this.pumpStream(reader, controller);
    
    return stream;
  }
  
  private async pumpStream(
    reader: ReadableStreamDefaultReader,
    controller: ReadableStreamDefaultController
  ) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          controller.close();
          break;
        }
        
        // Apply transformations if needed
        const transformed = this.transformChunk(value);
        controller.enqueue(transformed);
        
        // Handle backpressure
        if (controller.desiredSize !== null && controller.desiredSize <= 0) {
          await this.waitForBackpressure();
        }
      }
    } catch (error) {
      controller.error(error);
    }
  }
  
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
  </script>
</head>
<body>
  <div id="root"><!--${this.boundary}-->`;
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
}
```

### Step 5: Error Boundaries for SSR

Implement SSR-aware error boundaries:

```typescript
class SSRErrorBoundary extends React.Component<
  SSRErrorBoundaryProps,
  SSRErrorBoundaryState
> {
  constructor(props: SSRErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isClient: typeof window !== 'undefined'
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<SSRErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const context = this.getErrorContext();
    
    // Log error for monitoring
    this.logError({
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context,
      isSSR: !this.state.isClient,
      url: this.state.isClient ? window.location.href : context.request?.url
    });
    
    // Handle based on environment
    if (this.state.isClient) {
      this.handleClientError(error, errorInfo);
    } else {
      this.handleServerError(error, errorInfo);
    }
  }
  
  private handleServerError(error: Error, errorInfo: React.ErrorInfo) {
    // During SSR, we want to capture but continue rendering
    if (this.props.fallbackOnServer) {
      // Mark for client-side recovery
      this.markForClientRecovery();
    }
    
    // Report to monitoring
    this.reportToMonitoring({
      type: 'ssr_error',
      error,
      errorInfo,
      route: this.props.route
    });
  }
  
  private handleClientError(error: Error, errorInfo: React.ErrorInfo) {
    // Attempt recovery strategies
    if (this.canRecover(error)) {
      this.attemptRecovery();
    } else {
      // Show user-friendly error
      this.setState({
        hasError: true,
        error,
        errorInfo
      });
    }
  }
  
  render() {
    if (this.state.hasError) {
      if (!this.state.isClient && this.props.fallbackOnServer) {
        // During SSR, render a placeholder that will be hydrated on client
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
```

### Step 6: Testing Your Implementation

Test your SSR implementation with comprehensive scenarios:

```typescript
// Test streaming SSR
const testStreamingSSR = async () => {
  const renderer = new StreamRenderer();
  const stream = renderer.renderToStream(
    <App />,
    {
      bootstrapScripts: ['/client.js'],
      onShellReady: () => console.log('Shell ready'),
      onAllReady: () => console.log('All ready')
    }
  );
  
  const response = new Response(stream);
  const html = await response.text();
  
  assert(html.includes('<!DOCTYPE html>'));
  assert(html.includes('window.__INITIAL_DATA__'));
};

// Test hydration
const testHydration = async () => {
  const manager = new HydrationManager({ progressive: true });
  
  manager.scheduleHydration('header', 'immediate');
  manager.scheduleHydration('main-content', 'normal');
  manager.scheduleHydration('footer', 'idle');
  
  await waitFor(() => {
    assert(document.querySelector('#header[data-hydrated="true"]'));
  });
};

// Test error boundaries
const testSSRErrorBoundary = () => {
  const ErrorComponent = () => {
    throw new Error('Test error');
  };
  
  const { container } = renderToString(
    <SSRErrorBoundary fallback={<div>Error occurred</div>}>
      <ErrorComponent />
    </SSRErrorBoundary>
  );
  
  assert(container.querySelector('[data-error-boundary="true"]'));
};
```

## Advanced Challenges

1. **Implement streaming with Suspense boundaries**
2. **Add progressive enhancement for JavaScript-disabled users**
3. **Create custom hydration priorities based on viewport**
4. **Implement edge caching strategies**
5. **Add performance monitoring and metrics**

## Key Concepts to Master

- Server-side rendering lifecycle
- Streaming HTML responses
- Progressive enhancement strategies
- Hydration mismatch handling
- Route-based code splitting
- Critical CSS extraction
- Resource hints and preloading
- Error boundary strategies for SSR

## Common Pitfalls

1. **Hydration Mismatches**: Ensure server and client render identical HTML
2. **Memory Leaks**: Clean up server-side resources properly
3. **Performance**: Avoid blocking operations during streaming
4. **Error Handling**: Implement proper error boundaries for both SSR and CSR
5. **State Management**: Handle server/client state synchronization

## Success Criteria

- ✅ Streaming SSR implementation works correctly
- ✅ Progressive hydration based on priority
- ✅ Error boundaries handle SSR and CSR errors
- ✅ Route-based code splitting optimized
- ✅ No hydration mismatches in production
- ✅ Performance metrics meet targets
- ✅ Graceful degradation for JS-disabled users

## Next Steps

After completing this exercise, you'll move on to Next.js App Router patterns, where you'll learn about React Server Components and advanced routing patterns in the Next.js ecosystem.