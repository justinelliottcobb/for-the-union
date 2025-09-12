# SSR Performance Optimization

## Learning Objectives
- Master SSR performance optimization techniques
- Implement advanced caching strategies for SSR
- Optimize Time to First Byte (TTFB) and streaming
- Build resource preloading and critical CSS extraction
- Create progressive enhancement patterns

## Prerequisites
- Strong understanding of SSR concepts
- Knowledge of HTTP caching headers
- Experience with performance metrics
- Familiarity with Service Workers
- Understanding of CDN architectures

## Exercise Overview

Build a comprehensive SSR performance optimization system focusing on cache strategies, resource preloading, streaming optimization, and critical path optimization for production-scale applications.

## Step-by-Step Instructions

### Step 1: Cache Manager Implementation

Create an advanced cache management system:

```typescript
interface CacheStrategy {
  type: 'memory' | 'redis' | 'cdn' | 'service-worker';
  ttl: number;
  staleWhileRevalidate?: boolean;
  tags?: string[];
}

export class CacheManager {
  private memoryCache: Map<string, CacheEntry>;
  private redisClient?: RedisClient;
  private cacheStrategies: Map<string, CacheStrategy>;
  private invalidationQueue: InvalidationTask[];
  
  constructor(config: CacheConfig) {
    this.memoryCache = new Map();
    this.cacheStrategies = new Map();
    this.invalidationQueue = [];
    
    if (config.redis) {
      this.initializeRedis(config.redis);
    }
    
    this.setupCacheWarming();
  }
  
  async get<T>(
    key: string,
    options?: GetOptions
  ): Promise<T | null> {
    const strategy = this.getStrategy(key);
    
    // Check memory cache first (L1)
    const memoryHit = this.memoryCache.get(key);
    if (memoryHit && !this.isStale(memoryHit, strategy)) {
      this.trackCacheHit('memory', key);
      return memoryHit.data as T;
    }
    
    // Check Redis cache (L2)
    if (this.redisClient && strategy.type !== 'memory') {
      const redisHit = await this.getFromRedis(key);
      if (redisHit && !this.isStale(redisHit, strategy)) {
        // Promote to memory cache
        this.memoryCache.set(key, redisHit);
        this.trackCacheHit('redis', key);
        return redisHit.data as T;
      }
    }
    
    // Handle stale-while-revalidate
    if (strategy.staleWhileRevalidate && memoryHit) {
      this.revalidateInBackground(key, options);
      return memoryHit.data as T;
    }
    
    this.trackCacheMiss(key);
    return null;
  }
  
  async set<T>(
    key: string,
    data: T,
    options?: SetOptions
  ): Promise<void> {
    const strategy = this.getStrategy(key);
    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl: options?.ttl || strategy.ttl,
      tags: options?.tags || strategy.tags || [],
      version: this.getCacheVersion()
    };
    
    // Set in memory cache
    this.memoryCache.set(key, entry);
    
    // Set in Redis if configured
    if (this.redisClient && strategy.type !== 'memory') {
      await this.setInRedis(key, entry);
    }
    
    // Set CDN cache headers if applicable
    if (strategy.type === 'cdn') {
      this.setCDNHeaders(key, entry);
    }
    
    // Update service worker cache
    if (strategy.type === 'service-worker') {
      await this.updateServiceWorkerCache(key, entry);
    }
  }
  
  async invalidate(
    pattern: string | RegExp,
    options?: InvalidateOptions
  ): Promise<void> {
    const task: InvalidationTask = {
      pattern,
      timestamp: Date.now(),
      priority: options?.priority || 'normal'
    };
    
    if (options?.immediate) {
      await this.performInvalidation(task);
    } else {
      this.invalidationQueue.push(task);
      this.processInvalidationQueue();
    }
  }
  
  async invalidateByTags(tags: string[]): Promise<void> {
    const keysToInvalidate = new Set<string>();
    
    // Find all entries with matching tags
    for (const [key, entry] of this.memoryCache) {
      if (entry.tags?.some(tag => tags.includes(tag))) {
        keysToInvalidate.add(key);
      }
    }
    
    // Invalidate from all cache layers
    await Promise.all([
      this.invalidateMemoryCache(Array.from(keysToInvalidate)),
      this.invalidateRedisCache(Array.from(keysToInvalidate)),
      this.invalidateCDNCache(tags)
    ]);
  }
  
  private async revalidateInBackground(
    key: string,
    options?: GetOptions
  ): Promise<void> {
    // Perform background revalidation
    setTimeout(async () => {
      try {
        const fresh = await options?.revalidator?.(key);
        if (fresh) {
          await this.set(key, fresh);
        }
      } catch (error) {
        console.error(`Background revalidation failed for ${key}:`, error);
      }
    }, 0);
  }
  
  private setupCacheWarming() {
    // Warm critical caches on startup
    const criticalKeys = this.getCriticalCacheKeys();
    
    criticalKeys.forEach(async (key) => {
      const warmer = this.getCacheWarmer(key);
      if (warmer) {
        const data = await warmer();
        await this.set(key, data, { priority: 'high' });
      }
    });
  }
}
```

### Step 2: Preload Manager

Implement intelligent resource preloading:

```typescript
export class PreloadManager {
  private preloadQueue: PreloadTask[];
  private preloadedResources: Set<string>;
  private resourceHints: Map<string, ResourceHint>;
  private performanceObserver?: PerformanceObserver;
  
  constructor() {
    this.preloadQueue = [];
    this.preloadedResources = new Set();
    this.resourceHints = new Map();
    this.initializePerformanceObserver();
  }
  
  private initializePerformanceObserver() {
    if (typeof window === 'undefined') return;
    
    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.analyzeResourceTiming(entry as PerformanceResourceTiming);
      }
    });
    
    this.performanceObserver.observe({ 
      entryTypes: ['resource', 'navigation'] 
    });
  }
  
  generateResourceHints(
    route: RouteConfig,
    context: RequestContext
  ): string {
    const hints: string[] = [];
    
    // Critical resources - preload
    const critical = this.getCriticalResources(route);
    critical.forEach(resource => {
      hints.push(this.createPreloadHint(resource));
      this.trackResourceHint('preload', resource);
    });
    
    // Next navigation - prefetch
    const nextRoutes = this.predictNextNavigation(route, context);
    nextRoutes.forEach(nextRoute => {
      const resources = this.getRouteResources(nextRoute);
      resources.forEach(resource => {
        hints.push(this.createPrefetchHint(resource));
        this.trackResourceHint('prefetch', resource);
      });
    });
    
    // DNS prefetch for external resources
    const externalDomains = this.getExternalDomains(route);
    externalDomains.forEach(domain => {
      hints.push(this.createDNSPrefetchHint(domain));
    });
    
    // Preconnect to critical origins
    const criticalOrigins = this.getCriticalOrigins(route);
    criticalOrigins.forEach(origin => {
      hints.push(this.createPreconnectHint(origin));
    });
    
    return hints.join('\n');
  }
  
  private createPreloadHint(resource: Resource): string {
    const { url, type, crossOrigin, integrity } = resource;
    
    let hint = `<link rel="preload" href="${url}" as="${type}"`;
    
    if (crossOrigin) {
      hint += ` crossorigin="${crossOrigin}"`;
    }
    
    if (integrity) {
      hint += ` integrity="${integrity}"`;
    }
    
    if (type === 'font') {
      hint += ' type="font/woff2"';
    }
    
    hint += '>';
    
    return hint;
  }
  
  private predictNextNavigation(
    currentRoute: RouteConfig,
    context: RequestContext
  ): string[] {
    const predictions: string[] = [];
    
    // Analyze user behavior patterns
    const userPattern = this.analyzeUserPattern(context.userId);
    predictions.push(...userPattern.likelyNextRoutes);
    
    // Common navigation flows
    const commonFlows = this.getCommonNavigationFlows(currentRoute.path);
    predictions.push(...commonFlows);
    
    // Machine learning predictions
    if (this.mlPredictor) {
      const mlPredictions = this.mlPredictor.predict({
        currentRoute: currentRoute.path,
        userSegment: context.userSegment,
        timeOfDay: new Date().getHours(),
        deviceType: context.deviceType
      });
      predictions.push(...mlPredictions);
    }
    
    // Sort by probability and take top N
    return this.rankPredictions(predictions).slice(0, 3);
  }
  
  async preloadRoute(
    routePath: string,
    priority: PreloadPriority = 'normal'
  ): Promise<void> {
    if (this.preloadedResources.has(routePath)) {
      return;
    }
    
    const task: PreloadTask = {
      path: routePath,
      priority,
      timestamp: Date.now()
    };
    
    if (priority === 'immediate') {
      await this.executePreload(task);
    } else {
      this.preloadQueue.push(task);
      this.processPreloadQueue();
    }
  }
  
  private async executePreload(task: PreloadTask): Promise<void> {
    const resources = this.getRouteResources(task.path);
    
    await Promise.all(
      resources.map(async (resource) => {
        if (resource.type === 'script') {
          await this.preloadScript(resource);
        } else if (resource.type === 'style') {
          await this.preloadStyle(resource);
        } else if (resource.type === 'data') {
          await this.preloadData(resource);
        }
        
        this.preloadedResources.add(resource.url);
      })
    );
  }
  
  private analyzeResourceTiming(entry: PerformanceResourceTiming) {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      total: entry.responseEnd - entry.startTime
    };
    
    // Store metrics for optimization
    this.storeResourceMetrics(entry.name, metrics);
    
    // Adjust preloading strategy based on metrics
    if (metrics.total > 1000) {
      this.adjustPreloadStrategy(entry.name, 'increase-priority');
    }
  }
}
```

### Step 3: Stream Optimizer

Optimize streaming SSR performance:

```typescript
export class StreamOptimizer {
  private chunkSizeOptimizer: ChunkSizeOptimizer;
  private flushStrategy: FlushStrategy;
  private compressionEngine: CompressionEngine;
  
  constructor() {
    this.chunkSizeOptimizer = new ChunkSizeOptimizer();
    this.flushStrategy = new AdaptiveFlushStrategy();
    this.compressionEngine = new CompressionEngine();
  }
  
  optimizeStream(
    stream: ReadableStream,
    options: StreamOptions
  ): ReadableStream {
    const { request, response } = options;
    
    // Determine optimal chunk size based on network conditions
    const optimalChunkSize = this.chunkSizeOptimizer.calculate({
      bandwidth: this.estimateBandwidth(request),
      latency: this.estimateLatency(request),
      deviceType: this.detectDeviceType(request)
    });
    
    // Create optimized transform stream
    const transformStream = new TransformStream({
      start: (controller) => {
        this.injectEarlyHints(controller, options);
      },
      
      transform: async (chunk, controller) => {
        // Optimize chunk
        const optimized = await this.optimizeChunk(chunk, {
          size: optimalChunkSize,
          compress: this.shouldCompress(request),
          inline: this.shouldInlineCritical(chunk)
        });
        
        // Apply flush strategy
        if (this.flushStrategy.shouldFlush(optimized)) {
          controller.enqueue(optimized);
          await this.flush(response);
        } else {
          this.buffer(optimized);
        }
      },
      
      flush: (controller) => {
        // Final optimizations
        this.finalizeStream(controller);
      }
    });
    
    return stream.pipeThrough(transformStream);
  }
  
  private injectEarlyHints(
    controller: TransformStreamDefaultController,
    options: StreamOptions
  ) {
    // Send 103 Early Hints
    const earlyHints = this.generateEarlyHints(options);
    
    if (options.response && 'writeEarlyHints' in options.response) {
      options.response.writeEarlyHints({
        link: earlyHints
      });
    }
    
    // Inject critical CSS inline
    const criticalCSS = this.extractCriticalCSS(options.route);
    if (criticalCSS) {
      controller.enqueue(
        this.encoder.encode(`<style>${criticalCSS}</style>`)
      );
    }
  }
  
  private async optimizeChunk(
    chunk: Uint8Array,
    options: ChunkOptions
  ): Promise<Uint8Array> {
    let optimized = chunk;
    
    // Resize chunk if needed
    if (chunk.byteLength > options.size) {
      optimized = await this.splitChunk(chunk, options.size);
    }
    
    // Compress if beneficial
    if (options.compress && chunk.byteLength > 1024) {
      optimized = await this.compressionEngine.compress(optimized);
    }
    
    // Inline critical resources
    if (options.inline) {
      optimized = await this.inlineCriticalResources(optimized);
    }
    
    return optimized;
  }
  
  private extractCriticalCSS(route: RouteConfig): string {
    // Extract critical CSS for above-the-fold content
    const critical = new CriticalCSSExtractor();
    
    return critical.extract({
      html: route.template,
      viewport: { width: 1440, height: 900 },
      minify: true,
      inline: true
    });
  }
}

class ChunkSizeOptimizer {
  private readonly MIN_CHUNK_SIZE = 1024; // 1KB
  private readonly MAX_CHUNK_SIZE = 16384; // 16KB
  
  calculate(metrics: NetworkMetrics): number {
    const { bandwidth, latency, deviceType } = metrics;
    
    // Base size on bandwidth
    let size = Math.min(
      this.MAX_CHUNK_SIZE,
      Math.max(this.MIN_CHUNK_SIZE, bandwidth / 8)
    );
    
    // Adjust for latency
    if (latency > 100) {
      size = Math.min(size, 4096); // Smaller chunks for high latency
    }
    
    // Adjust for device type
    if (deviceType === 'mobile') {
      size = Math.min(size, 8192); // Smaller chunks for mobile
    }
    
    return size;
  }
}

class AdaptiveFlushStrategy implements FlushStrategy {
  private flushThreshold: number = 4096;
  private lastFlushTime: number = Date.now();
  private buffer: Uint8Array[] = [];
  
  shouldFlush(chunk: Uint8Array): boolean {
    const now = Date.now();
    const timeSinceFlush = now - this.lastFlushTime;
    const bufferSize = this.buffer.reduce((sum, b) => sum + b.byteLength, 0);
    
    // Flush if buffer exceeds threshold
    if (bufferSize + chunk.byteLength > this.flushThreshold) {
      this.lastFlushTime = now;
      return true;
    }
    
    // Flush if too much time has passed
    if (timeSinceFlush > 100) { // 100ms
      this.lastFlushTime = now;
      return true;
    }
    
    // Don't flush yet
    this.buffer.push(chunk);
    return false;
  }
}
```

### Step 4: Resource Hints Generator

Create intelligent resource hints:

```typescript
export class ResourceHints {
  private hints: Map<string, Hint[]>;
  private analytics: ResourceAnalytics;
  private predictor: NavigationPredictor;
  
  constructor() {
    this.hints = new Map();
    this.analytics = new ResourceAnalytics();
    this.predictor = new NavigationPredictor();
  }
  
  generateHTMLHints(route: string, context: RequestContext): string {
    const hints: string[] = [];
    
    // Resource hints
    hints.push(...this.generateResourceHints(route, context));
    
    // Security hints
    hints.push(...this.generateSecurityHints(route));
    
    // Performance hints
    hints.push(...this.generatePerformanceHints(route));
    
    return hints.join('\n');
  }
  
  private generateResourceHints(
    route: string,
    context: RequestContext
  ): string[] {
    const hints: string[] = [];
    
    // Preload critical resources
    const critical = this.getCriticalResources(route);
    critical.forEach(resource => {
      hints.push(
        `<link rel="preload" href="${resource.url}" ` +
        `as="${resource.type}" ` +
        `importance="${resource.importance}">`
      );
    });
    
    // Modulepreload for ES modules
    const modules = this.getESModules(route);
    modules.forEach(module => {
      hints.push(
        `<link rel="modulepreload" href="${module.url}" ` +
        `integrity="${module.integrity}">`
      );
    });
    
    // Prefetch next likely resources
    const predictions = this.predictor.predict(route, context);
    predictions.forEach(prediction => {
      if (prediction.probability > 0.7) {
        hints.push(
          `<link rel="prefetch" href="${prediction.url}" ` +
          `as="${prediction.type}">`
        );
      }
    });
    
    // DNS prefetch for third-party domains
    const thirdPartyDomains = this.getThirdPartyDomains(route);
    thirdPartyDomains.forEach(domain => {
      hints.push(`<link rel="dns-prefetch" href="//${domain}">`);
    });
    
    // Preconnect to critical origins
    const criticalOrigins = this.getCriticalOrigins(route);
    criticalOrigins.forEach(origin => {
      hints.push(
        `<link rel="preconnect" href="${origin}" crossorigin>`
      );
    });
    
    return hints;
  }
  
  private generateSecurityHints(route: string): string[] {
    const hints: string[] = [];
    
    // Content Security Policy
    hints.push(
      `<meta http-equiv="Content-Security-Policy" ` +
      `content="${this.generateCSP(route)}">`
    );
    
    // Permissions Policy
    hints.push(
      `<meta http-equiv="Permissions-Policy" ` +
      `content="${this.generatePermissionsPolicy(route)}">`
    );
    
    return hints;
  }
  
  private generatePerformanceHints(route: string): string[] {
    const hints: string[] = [];
    
    // Resource timing
    hints.push(
      `<meta http-equiv="Server-Timing" ` +
      `content="${this.generateServerTiming(route)}">`
    );
    
    // Cache control
    hints.push(
      `<meta http-equiv="Cache-Control" ` +
      `content="${this.generateCacheControl(route)}">`
    );
    
    return hints;
  }
}
```

### Step 5: Progressive Enhancement

Implement progressive enhancement patterns:

```typescript
export class ProgressiveEnhancement {
  private enhancementLevels: Map<string, EnhancementLevel>;
  private featureDetection: FeatureDetector;
  private polyfillLoader: PolyfillLoader;
  
  constructor() {
    this.enhancementLevels = new Map();
    this.featureDetection = new FeatureDetector();
    this.polyfillLoader = new PolyfillLoader();
  }
  
  async enhance(
    element: HTMLElement,
    context: EnhancementContext
  ): Promise<void> {
    const level = this.determineEnhancementLevel(context);
    
    // Base functionality (works without JS)
    this.applyBaseEnhancement(element);
    
    // Progressive layers
    if (level >= EnhancementLevel.Basic) {
      await this.applyBasicEnhancement(element);
    }
    
    if (level >= EnhancementLevel.Enhanced) {
      await this.applyEnhancedFeatures(element);
    }
    
    if (level >= EnhancementLevel.Full) {
      await this.applyFullEnhancement(element);
    }
  }
  
  private determineEnhancementLevel(
    context: EnhancementContext
  ): EnhancementLevel {
    const { capabilities, connection, device } = context;
    
    // No JavaScript
    if (!capabilities.javascript) {
      return EnhancementLevel.None;
    }
    
    // Slow connection or low-end device
    if (connection.effectiveType === '2g' || device.memory < 2) {
      return EnhancementLevel.Basic;
    }
    
    // Modern browser with good connection
    if (capabilities.modernBrowser && connection.effectiveType === '4g') {
      return EnhancementLevel.Full;
    }
    
    // Default to enhanced
    return EnhancementLevel.Enhanced;
  }
  
  private applyBaseEnhancement(element: HTMLElement) {
    // Ensure basic functionality without JavaScript
    
    // Forms work without JS
    element.querySelectorAll('form').forEach(form => {
      form.setAttribute('method', 'POST');
      form.setAttribute('action', form.dataset.action || '/submit');
    });
    
    // Links are crawlable
    element.querySelectorAll('a[data-spa]').forEach(link => {
      const href = link.getAttribute('data-href') || '#';
      link.setAttribute('href', href);
    });
    
    // Images have proper alt text
    element.querySelectorAll('img').forEach(img => {
      if (!img.alt) {
        img.alt = img.dataset.alt || 'Image';
      }
    });
  }
  
  private async applyBasicEnhancement(element: HTMLElement) {
    // Load minimal JavaScript
    await this.loadScript('/js/basic-enhancement.js');
    
    // Simple interactions
    this.attachBasicEventListeners(element);
    
    // Lazy load images
    this.setupLazyLoading(element);
  }
  
  private async applyEnhancedFeatures(element: HTMLElement) {
    // Load polyfills if needed
    const requiredPolyfills = await this.featureDetection.detectRequired();
    if (requiredPolyfills.length > 0) {
      await this.polyfillLoader.load(requiredPolyfills);
    }
    
    // Enhanced interactions
    await this.loadScript('/js/enhanced-features.js');
    
    // Progressive forms
    this.enhanceForms(element);
    
    // Smooth scrolling
    this.setupSmoothScrolling(element);
  }
  
  private async applyFullEnhancement(element: HTMLElement) {
    // Full SPA experience
    await this.loadScript('/js/full-app.js');
    
    // Advanced features
    this.setupAdvancedFeatures(element);
    
    // Real-time updates
    this.setupWebSocket(element);
    
    // Service worker
    await this.registerServiceWorker();
  }
}
```

### Step 6: Service Worker Integration

Implement service worker for optimal caching:

```typescript
export class ServiceWorkerManager {
  private registration?: ServiceWorkerRegistration;
  private messageChannel: MessageChannel;
  
  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }
    
    try {
      this.registration = await navigator.serviceWorker.register(
        '/sw.js',
        {
          scope: '/',
          updateViaCache: 'none'
        }
      );
      
      this.setupMessageChannel();
      this.setupUpdateHandling();
      
      console.log('Service Worker registered');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
  
  private setupMessageChannel() {
    this.messageChannel = new MessageChannel();
    
    this.messageChannel.port1.onmessage = (event) => {
      this.handleServiceWorkerMessage(event.data);
    };
  }
  
  async cacheRoute(route: string, strategy: CacheStrategy): Promise<void> {
    if (!this.registration?.active) return;
    
    this.registration.active.postMessage({
      type: 'CACHE_ROUTE',
      route,
      strategy
    });
  }
  
  async clearCache(pattern?: string): Promise<void> {
    if (!this.registration?.active) return;
    
    this.registration.active.postMessage({
      type: 'CLEAR_CACHE',
      pattern
    });
  }
  
  generateServiceWorkerScript(): string {
    return `
// Service Worker for SSR Performance Optimization
const CACHE_VERSION = 'v1';
const CACHE_NAME = \`ssr-cache-\${CACHE_VERSION}\`;

// Cache strategies
const cacheStrategies = {
  networkFirst: async (request) => {
    try {
      const response = await fetch(request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      return response;
    } catch (error) {
      return caches.match(request);
    }
  },
  
  cacheFirst: async (request) => {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  },
  
  staleWhileRevalidate: async (request) => {
    const cached = await caches.match(request);
    
    const fetchPromise = fetch(request).then(response => {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, response.clone()));
      return response;
    });
    
    return cached || fetchPromise;
  }
};

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/css/critical.css',
        '/js/app.js'
      ]);
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Determine strategy based on resource type
  let strategy = 'networkFirst';
  
  if (url.pathname.match(/\\.(css|js|woff2)$/)) {
    strategy = 'cacheFirst';
  } else if (url.pathname.match(/\\.json$/)) {
    strategy = 'staleWhileRevalidate';
  }
  
  event.respondWith(cacheStrategies[strategy](request));
});
    `;
  }
}
```

### Step 7: Testing Your Implementation

Test your SSR performance optimizations:

```typescript
// Test cache manager
const testCacheManager = async () => {
  const cache = new CacheManager({ type: 'memory' });
  
  await cache.set('test-key', { data: 'test' }, { ttl: 3600 });
  const result = await cache.get('test-key');
  
  assert(result?.data === 'test');
  
  // Test invalidation
  await cache.invalidate(/test-.*/);
  const invalidated = await cache.get('test-key');
  assert(invalidated === null);
};

// Test preload manager
const testPreloadManager = () => {
  const preloader = new PreloadManager();
  
  const hints = preloader.generateResourceHints(
    { path: '/products' },
    { userId: '123', deviceType: 'desktop' }
  );
  
  assert(hints.includes('rel="preload"'));
  assert(hints.includes('rel="prefetch"'));
};

// Test stream optimization
const testStreamOptimizer = async () => {
  const optimizer = new StreamOptimizer();
  const stream = new ReadableStream();
  
  const optimized = optimizer.optimizeStream(stream, {
    request: new Request('/'),
    route: { path: '/' }
  });
  
  assert(optimized instanceof ReadableStream);
};
```

## Advanced Challenges

1. **Implement edge caching with geo-distribution**
2. **Create adaptive streaming based on network conditions**
3. **Build machine learning-based resource prediction**
4. **Implement critical CSS extraction for all routes**
5. **Add real-time performance monitoring**

## Key Concepts to Master

- Multi-layer caching strategies
- Resource prioritization and hints
- Streaming optimization techniques
- Critical path optimization
- Progressive enhancement patterns
- Service worker strategies
- CDN integration
- Performance metrics and monitoring

## Common Pitfalls

1. **Over-caching**: Balance freshness with performance
2. **Cache invalidation**: Implement proper cache busting
3. **Resource priorities**: Don't preload everything
4. **Bundle size**: Keep JavaScript bundles small
5. **Network conditions**: Adapt to user's connection

## Success Criteria

- ✅ Multi-layer cache system implemented
- ✅ Resource hints optimize loading
- ✅ Streaming is properly optimized
- ✅ Progressive enhancement works without JS
- ✅ Service worker caches effectively
- ✅ TTFB < 200ms for cached content
- ✅ First paint < 1 second on 3G

## Next Steps

After completing this exercise, you have mastered SSR performance optimization. Continue with the next section to explore more advanced edge computing patterns and serverless architectures.