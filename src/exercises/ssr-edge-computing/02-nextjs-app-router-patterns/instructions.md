# Next.js App Router Advanced Patterns

## Learning Objectives
- Master Next.js App Router architecture and patterns
- Implement React Server Components and Client Components
- Build parallel routes and intercepting routes
- Create optimized layouts with route groups
- Utilize metadata API for SEO optimization

## Prerequisites
- Strong React and TypeScript knowledge
- Understanding of Next.js fundamentals
- Familiarity with server components concepts
- Knowledge of SEO best practices
- Experience with async/await patterns

## Exercise Overview

Build a comprehensive Next.js App Router implementation showcasing advanced patterns including Server Components, parallel routes, intercepting routes, and sophisticated layout systems.

## Step-by-Step Instructions

### Step 1: Layout System Architecture

Create a flexible layout system with nested layouts:

```typescript
interface LayoutConfig {
  id: string;
  children: React.ReactNode;
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export class LayoutSystem {
  private layouts: Map<string, LayoutComponent>;
  private activeLayouts: Set<string>;
  private layoutCache: Map<string, CachedLayout>;
  
  constructor() {
    this.layouts = new Map();
    this.activeLayouts = new Set();
    this.layoutCache = new Map();
  }
  
  registerLayout(path: string, component: LayoutComponent) {
    this.layouts.set(path, component);
    
    // Precompile layout for performance
    this.precompileLayout(path, component);
  }
  
  async renderLayout(
    path: string,
    props: LayoutConfig
  ): Promise<React.ReactElement> {
    const layout = this.layouts.get(path);
    if (!layout) {
      throw new Error(`Layout not found for path: ${path}`);
    }
    
    // Check cache for server components
    const cacheKey = this.getCacheKey(path, props);
    const cached = await this.getCachedLayout(cacheKey);
    
    if (cached && !this.shouldRevalidate(cached)) {
      return cached.element;
    }
    
    // Render layout with streaming support
    const element = await this.renderWithStreaming(layout, props);
    
    // Cache if it's a server component
    if (layout.type === 'server') {
      await this.cacheLayout(cacheKey, element);
    }
    
    return element;
  }
  
  private async renderWithStreaming(
    layout: LayoutComponent,
    props: LayoutConfig
  ): Promise<React.ReactElement> {
    // Support streaming for server components
    return (
      <Suspense fallback={<LayoutSkeleton />}>
        {await layout.render(props)}
      </Suspense>
    );
  }
  
  // Nested layout composition
  composeLayouts(layouts: string[]): React.ReactElement {
    return layouts.reduceRight((children, layoutPath) => {
      const Layout = this.layouts.get(layoutPath);
      if (!Layout) return children;
      
      return <Layout>{children}</Layout>;
    }, <></> as React.ReactElement);
  }
}
```

### Step 2: Server Component Implementation

Implement React Server Components with data fetching:

```typescript
interface ServerComponentProps {
  params: Record<string, string>;
  searchParams: Record<string, string>;
}

export class ServerComponent {
  private dataCache: Map<string, CachedData>;
  private revalidateIntervals: Map<string, number>;
  
  constructor() {
    this.dataCache = new Map();
    this.revalidateIntervals = new Map();
  }
  
  // Server Component with async data fetching
  async ProductList({ searchParams }: ServerComponentProps) {
    // Fetch data on the server
    const products = await this.fetchProducts(searchParams);
    
    // Stream the response
    return (
      <div className="product-list">
        {products.map(product => (
          <Suspense
            key={product.id}
            fallback={<ProductSkeleton />}
          >
            <ProductCard product={product} />
          </Suspense>
        ))}
      </div>
    );
  }
  
  private async fetchProducts(
    searchParams: Record<string, string>
  ): Promise<Product[]> {
    const cacheKey = this.generateCacheKey('products', searchParams);
    
    // Check cache with revalidation
    const cached = this.dataCache.get(cacheKey);
    if (cached && !this.shouldRevalidate(cached)) {
      return cached.data;
    }
    
    // Fetch with automatic retries
    const data = await this.fetchWithRetry(
      `/api/products?${new URLSearchParams(searchParams)}`,
      {
        next: {
          revalidate: 60, // Revalidate every 60 seconds
          tags: ['products']
        }
      }
    );
    
    // Update cache
    this.dataCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      revalidate: 60
    });
    
    return data;
  }
  
  // Streaming Server Component
  async StreamingComponent({ id }: { id: string }) {
    const streamData = this.createDataStream(id);
    
    return (
      <StreamingBoundary
        fallback={<LoadingSpinner />}
        stream={streamData}
      >
        {async (data) => {
          const processedData = await this.processStreamData(data);
          return <DataDisplay data={processedData} />;
        }}
      </StreamingBoundary>
    );
  }
  
  private createDataStream(id: string): ReadableStream {
    return new ReadableStream({
      async start(controller) {
        // Stream chunks of data
        const chunks = await this.fetchDataChunks(id);
        
        for (const chunk of chunks) {
          controller.enqueue(chunk);
          
          // Add delay for demonstration
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        controller.close();
      }
    });
  }
}
```

### Step 3: Client Boundary Management

Create a client boundary system for interactive components:

```typescript
'use client';

export class ClientBoundary {
  private clientComponents: Map<string, ClientComponent>;
  private hydrationQueue: HydrationTask[];
  private interactionObserver?: IntersectionObserver;
  
  constructor() {
    this.clientComponents = new Map();
    this.hydrationQueue = [];
    this.setupInteractionObserver();
  }
  
  private setupInteractionObserver() {
    if (typeof window === 'undefined') return;
    
    this.interactionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.hydrateClientComponent(entry.target as HTMLElement);
          }
        });
      },
      { rootMargin: '50px' }
    );
  }
  
  // Client Component wrapper
  ClientWrapper<T extends {}>(
    Component: React.ComponentType<T>,
    options: ClientOptions = {}
  ) {
    return (props: T) => {
      const [isHydrated, setIsHydrated] = useState(false);
      const ref = useRef<HTMLDivElement>(null);
      
      useEffect(() => {
        if (options.lazy && ref.current) {
          this.interactionObserver?.observe(ref.current);
        } else {
          setIsHydrated(true);
        }
        
        return () => {
          if (ref.current) {
            this.interactionObserver?.unobserve(ref.current);
          }
        };
      }, []);
      
      if (!isHydrated && options.lazy) {
        return (
          <div ref={ref} data-client-component={Component.name}>
            {options.fallback || <ComponentSkeleton />}
          </div>
        );
      }
      
      return <Component {...props} />;
    };
  }
  
  // Interactive client component example
  InteractiveSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Debounced search
    const debouncedSearch = useMemo(
      () => debounce(async (searchQuery: string) => {
        setIsSearching(true);
        
        // Update URL without navigation
        const params = new URLSearchParams(searchParams);
        params.set('q', searchQuery);
        router.push(`?${params.toString()}`, { shallow: true });
        
        // Perform search
        const searchResults = await this.performSearch(searchQuery);
        setResults(searchResults);
        setIsSearching(false);
      }, 300),
      [searchParams, router]
    );
    
    useEffect(() => {
      if (query) {
        debouncedSearch(query);
      }
    }, [query, debouncedSearch]);
    
    return (
      <div className="search-component">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="search-input"
        />
        
        {isSearching && <SearchSpinner />}
        
        <SearchResults results={results} />
      </div>
    );
  }
  
  private async performSearch(query: string): Promise<SearchResult[]> {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    return response.json();
  }
}
```

### Step 4: Metadata Manager

Implement dynamic metadata generation:

```typescript
export class MetadataManager {
  private metadataCache: Map<string, Metadata>;
  private dynamicMetadata: Map<string, MetadataGenerator>;
  
  constructor() {
    this.metadataCache = new Map();
    this.dynamicMetadata = new Map();
  }
  
  // Generate metadata for a page
  async generateMetadata(
    params: MetadataParams
  ): Promise<Metadata> {
    const cacheKey = this.getCacheKey(params);
    
    // Check cache
    const cached = this.metadataCache.get(cacheKey);
    if (cached && !this.isExpired(cached)) {
      return cached;
    }
    
    // Generate fresh metadata
    const metadata = await this.buildMetadata(params);
    
    // Cache the result
    this.metadataCache.set(cacheKey, metadata);
    
    return metadata;
  }
  
  private async buildMetadata(params: MetadataParams): Promise<Metadata> {
    const { pathname, searchParams, data } = params;
    
    // Base metadata
    const baseMetadata: Metadata = {
      title: {
        template: '%s | Your App',
        default: 'Your App'
      },
      description: 'Default description',
      metadataBase: new URL('https://yourapp.com'),
      openGraph: {
        type: 'website',
        locale: 'en_US',
        url: `https://yourapp.com${pathname}`,
        siteName: 'Your App',
        images: []
      },
      twitter: {
        card: 'summary_large_image',
        site: '@yourapp'
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1
        }
      }
    };
    
    // Apply dynamic metadata
    const dynamicMeta = await this.applyDynamicMetadata(
      pathname,
      data
    );
    
    return {
      ...baseMetadata,
      ...dynamicMeta
    };
  }
  
  private async applyDynamicMetadata(
    pathname: string,
    data: any
  ): Promise<Partial<Metadata>> {
    // Product page metadata
    if (pathname.startsWith('/products/')) {
      const product = data?.product;
      if (!product) return {};
      
      return {
        title: product.name,
        description: product.description,
        openGraph: {
          title: product.name,
          description: product.description,
          images: [
            {
              url: product.image,
              width: 1200,
              height: 630,
              alt: product.name
            }
          ]
        },
        alternates: {
          canonical: `https://yourapp.com${pathname}`,
          languages: {
            'en-US': `https://yourapp.com/en${pathname}`,
            'es-ES': `https://yourapp.com/es${pathname}`
          }
        }
      };
    }
    
    return {};
  }
  
  // Generate structured data
  generateStructuredData(type: string, data: any): object {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': type
    };
    
    switch (type) {
      case 'Product':
        return {
          ...structuredData,
          name: data.name,
          description: data.description,
          image: data.images,
          offers: {
            '@type': 'Offer',
            price: data.price,
            priceCurrency: data.currency,
            availability: data.inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock'
          }
        };
        
      case 'Article':
        return {
          ...structuredData,
          headline: data.title,
          datePublished: data.publishedAt,
          dateModified: data.updatedAt,
          author: {
            '@type': 'Person',
            name: data.author
          }
        };
        
      default:
        return structuredData;
    }
  }
}
```

### Step 5: Parallel Routes Implementation

Create parallel routes for complex layouts:

```typescript
export class ParallelRoutes {
  private slots: Map<string, RouteSlot>;
  private activeSlots: Map<string, string>;
  
  constructor() {
    this.slots = new Map();
    this.activeSlots = new Map();
  }
  
  // Define parallel route slots
  defineSlot(name: string, config: SlotConfig) {
    this.slots.set(name, {
      name,
      config,
      component: null,
      state: 'idle'
    });
  }
  
  // Render parallel routes
  async renderParallelRoutes(
    slots: Record<string, React.ReactNode>
  ): Promise<React.ReactElement> {
    return (
      <div className="parallel-routes-container">
        {/* Team slot */}
        <div className="route-slot" data-slot="team">
          <Suspense fallback={<SlotSkeleton name="team" />}>
            {slots.team}
          </Suspense>
        </div>
        
        {/* Analytics slot */}
        <div className="route-slot" data-slot="analytics">
          <Suspense fallback={<SlotSkeleton name="analytics" />}>
            {slots.analytics}
          </Suspense>
        </div>
        
        {/* Main content */}
        <div className="route-slot" data-slot="children">
          {slots.children}
        </div>
      </div>
    );
  }
  
  // Intercepting routes handler
  interceptRoute(
    pattern: string,
    interceptor: RouteInterceptor
  ) {
    return async (params: any) => {
      // Check if route should be intercepted
      if (this.shouldIntercept(pattern, params)) {
        // Render modal or overlay
        return (
          <InterceptingModal
            onClose={() => this.closeInterception()}
          >
            {await interceptor.render(params)}
          </InterceptingModal>
        );
      }
      
      // Continue to regular route
      return null;
    };
  }
  
  private shouldIntercept(pattern: string, params: any): boolean {
    // Check conditions for interception
    const isModal = params.searchParams?.modal === 'true';
    const isQuickView = params.pathname.includes('/quick-view');
    
    return isModal || isQuickView;
  }
  
  // Route groups for organization
  createRouteGroup(
    name: string,
    routes: RouteDefinition[]
  ): RouteGroup {
    return {
      name,
      routes,
      layout: this.getGroupLayout(name),
      middleware: this.getGroupMiddleware(name)
    };
  }
  
  private getGroupLayout(groupName: string): React.ComponentType {
    const layouts: Record<string, React.ComponentType> = {
      '(shop)': ShopLayout,
      '(auth)': AuthLayout,
      '(admin)': AdminLayout
    };
    
    return layouts[groupName] || DefaultLayout;
  }
}
```

### Step 6: Loading States and Error Handling

Implement sophisticated loading and error states:

```typescript
export class LoadingStateManager {
  private loadingStates: Map<string, LoadingState>;
  private errorBoundaries: Map<string, ErrorBoundaryConfig>;
  
  // Loading component with progressive enhancement
  LoadingComponent({ segment }: { segment: string }) {
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('Loading...');
    
    useEffect(() => {
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      // Update message based on progress
      if (progress > 30) setMessage('Fetching data...');
      if (progress > 60) setMessage('Almost there...');
      
      return () => clearInterval(interval);
    }, [progress]);
    
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <div className="loading-progress">
          <div 
            className="progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="loading-message">{message}</p>
      </div>
    );
  }
  
  // Error boundary with recovery
  ErrorBoundary({ 
    children, 
    fallback,
    reset 
  }: ErrorBoundaryProps) {
    return (
      <ErrorBoundaryWrapper
        fallback={(error, reset) => (
          <div className="error-boundary">
            <h2>Something went wrong</h2>
            <details>
              <summary>Error details</summary>
              <pre>{error.message}</pre>
            </details>
            <button onClick={reset}>Try again</button>
          </div>
        )}
        onError={(error, errorInfo) => {
          // Log to error reporting service
          console.error('Error boundary caught:', error, errorInfo);
        }}
      >
        {children}
      </ErrorBoundaryWrapper>
    );
  }
  
  // Not found handling
  NotFound() {
    return (
      <div className="not-found">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }
}
```

### Step 7: Testing Your Implementation

Test your Next.js App Router implementation:

```typescript
// Test Server Components
const testServerComponents = async () => {
  const component = new ServerComponent();
  const result = await component.ProductList({
    params: {},
    searchParams: { category: 'electronics' }
  });
  
  assert(result.props.children.length > 0);
};

// Test parallel routes
const testParallelRoutes = async () => {
  const routes = new ParallelRoutes();
  
  routes.defineSlot('team', { priority: 'high' });
  routes.defineSlot('analytics', { priority: 'low' });
  
  const rendered = await routes.renderParallelRoutes({
    team: <TeamComponent />,
    analytics: <AnalyticsComponent />,
    children: <MainContent />
  });
  
  assert(rendered.props.children.length === 3);
};

// Test metadata generation
const testMetadata = async () => {
  const manager = new MetadataManager();
  
  const metadata = await manager.generateMetadata({
    pathname: '/products/laptop',
    searchParams: {},
    data: {
      product: {
        name: 'Laptop',
        description: 'High-performance laptop'
      }
    }
  });
  
  assert(metadata.title === 'Laptop');
  assert(metadata.openGraph.title === 'Laptop');
};
```

## Advanced Challenges

1. **Implement streaming with React Server Components**
2. **Create complex nested layouts with route groups**
3. **Build intercepting routes for modals**
4. **Add incremental static regeneration**
5. **Implement edge runtime optimization**

## Key Concepts to Master

- React Server Components vs Client Components
- Parallel routes and intercepting routes
- Route groups and layouts
- Metadata API and SEO
- Streaming and suspense
- Edge runtime compatibility
- Data fetching patterns
- Cache management

## Common Pitfalls

1. **Mixing server and client code**: Keep clear boundaries
2. **Over-using client components**: Prefer server components when possible
3. **Incorrect data fetching**: Use proper caching strategies
4. **Layout nesting issues**: Understand layout composition
5. **Metadata conflicts**: Handle dynamic metadata properly

## Success Criteria

- ✅ Server Components render without client JavaScript
- ✅ Client Components hydrate correctly
- ✅ Parallel routes work as expected
- ✅ Metadata is properly generated
- ✅ Loading states are smooth
- ✅ Error boundaries handle failures gracefully
- ✅ Performance metrics meet targets

## Next Steps

After completing this exercise, you'll move on to SSR performance optimization, where you'll learn advanced techniques for optimizing server-side rendering performance and reducing Time to First Byte (TTFB).