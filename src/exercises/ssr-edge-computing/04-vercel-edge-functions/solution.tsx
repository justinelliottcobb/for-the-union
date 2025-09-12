import React, { useState, useEffect } from 'react';
import type { ReactElement } from 'react';

// === TYPES AND INTERFACES ===

interface EdgeRequest extends Request {
  geo?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: string;
    longitude?: string;
  };
  ip?: string;
}

interface EdgeContext {
  request: EdgeRequest;
  response: Response;
  geo: GeolocationData;
  cache: EdgeCacheInstance;
}

interface GeolocationData {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface CacheStrategy {
  ttl: number;
  tags: string[];
  vary: string[];
  staleWhileRevalidate?: boolean;
}

interface ABTestConfig {
  id: string;
  variants: ABVariant[];
  traffic: number;
  targeting?: TargetingRule[];
}

interface ABVariant {
  id: string;
  weight: number;
  config: Record<string, any>;
}

interface TargetingRule {
  type: 'geo' | 'device' | 'header' | 'cookie';
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'in';
  value: string | string[];
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (request: Request) => string;
  skipIf?: (request: Request) => boolean;
}

interface PersonalizationContext {
  userId?: string;
  sessionId: string;
  preferences: Record<string, any>;
  segments: string[];
  device: DeviceInfo;
}

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  version: string;
}

// === EDGE HANDLER CLASS ===

export class EdgeHandler {
  private middlewares: Array<(ctx: EdgeContext, next: () => Promise<void>) => Promise<void>> = [];
  private errorHandlers: Array<(error: Error, ctx: EdgeContext) => Promise<Response>> = [];

  constructor() {
    // Initialize default middleware
    this.use(this.createRequestProcessor());
    this.use(this.createGeolocationMiddleware());
    this.use(this.createSecurityHeadersMiddleware());
  }

  use(middleware: (ctx: EdgeContext, next: () => Promise<void>) => Promise<void>) {
    this.middlewares.push(middleware);
  }

  onError(handler: (error: Error, ctx: EdgeContext) => Promise<Response>) {
    this.errorHandlers.push(handler);
  }

  async handle(request: EdgeRequest): Promise<Response> {
    try {
      const geo = this.extractGeolocation(request);
      const cache = new EdgeCacheInstance();
      
      let response = new Response();
      const ctx: EdgeContext = { request, response, geo, cache };

      // Execute middleware chain
      let index = 0;
      const next = async (): Promise<void> => {
        if (index < this.middlewares.length) {
          const middleware = this.middlewares[index++];
          await middleware(ctx, next);
        }
      };

      await next();
      return ctx.response;
    } catch (error) {
      return this.handleError(error as Error, { request, response: new Response(), geo: this.extractGeolocation(request), cache: new EdgeCacheInstance() });
    }
  }

  private async handleError(error: Error, ctx: EdgeContext): Promise<Response> {
    for (const handler of this.errorHandlers) {
      try {
        return await handler(error, ctx);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    }

    // Default error response
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
        'x-error-id': crypto.randomUUID()
      }
    });
  }

  private extractGeolocation(request: EdgeRequest): GeolocationData {
    return {
      country: request.geo?.country || 'US',
      region: request.geo?.region || 'CA',
      city: request.geo?.city || 'San Francisco',
      latitude: parseFloat(request.geo?.latitude || '37.7749'),
      longitude: parseFloat(request.geo?.longitude || '-122.4194'),
      timezone: 'America/Los_Angeles'
    };
  }

  private createRequestProcessor() {
    return async (ctx: EdgeContext, next: () => Promise<void>) => {
      const requestProcessor = new RequestProcessor();
      ctx.request = await requestProcessor.process(ctx.request);
      await next();
    };
  }

  private createGeolocationMiddleware() {
    return async (ctx: EdgeContext, next: () => Promise<void>) => {
      const router = new GeolocationRouter();
      const routeResult = await router.route(ctx.request, ctx.geo);
      
      if (routeResult.redirect) {
        ctx.response = new Response(null, {
          status: 302,
          headers: { 'Location': routeResult.redirect }
        });
        return;
      }

      await next();
    };
  }

  private createSecurityHeadersMiddleware() {
    return async (ctx: EdgeContext, next: () => Promise<void>) => {
      await next();
      
      // Add security headers to response
      const headers = new Headers(ctx.response.headers);
      headers.set('X-Frame-Options', 'DENY');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      ctx.response = new Response(ctx.response.body, {
        status: ctx.response.status,
        statusText: ctx.response.statusText,
        headers
      });
    };
  }
}

// === REQUEST PROCESSOR CLASS ===

export class RequestProcessor {
  async process(request: EdgeRequest): Promise<EdgeRequest> {
    // Enrich request with additional metadata
    const enrichedRequest = this.enrichRequest(request);
    
    // Validate and sanitize request
    this.validateRequest(enrichedRequest);
    
    // Add security headers
    this.addSecurityContext(enrichedRequest);
    
    return enrichedRequest;
  }

  private enrichRequest(request: EdgeRequest): EdgeRequest {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Add custom properties
    (request as any).metadata = {
      timestamp: Date.now(),
      userAgent: this.parseUserAgent(userAgent),
      referrer: request.headers.get('referer'),
      acceptLanguage: request.headers.get('accept-language'),
      clientIP: this.extractClientIP(request),
      protocol: url.protocol,
      host: url.hostname,
      path: url.pathname,
      queryParams: Object.fromEntries(url.searchParams)
    };

    return request;
  }

  private validateRequest(request: EdgeRequest): void {
    const url = new URL(request.url);
    
    // Validate URL
    if (url.pathname.includes('..') || url.pathname.includes('//')) {
      throw new Error('Invalid URL path');
    }
    
    // Validate headers
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      throw new Error('Request too large');
    }
    
    // Check for suspicious patterns
    const suspiciousHeaders = ['x-forwarded-host', 'x-real-ip'];
    for (const header of suspiciousHeaders) {
      if (request.headers.get(header)?.includes('localhost')) {
        throw new Error('Suspicious request detected');
      }
    }
  }

  private addSecurityContext(request: EdgeRequest): void {
    // Add security-related metadata
    (request as any).security = {
      isBot: this.detectBot(request.headers.get('user-agent') || ''),
      riskScore: this.calculateRiskScore(request),
      fingerprint: this.generateFingerprint(request)
    };
  }

  private parseUserAgent(userAgent: string): DeviceInfo {
    // Simple user agent parsing (in production, use a proper library)
    const mobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const tablet = /iPad|Tablet/.test(userAgent);
    
    return {
      type: tablet ? 'tablet' : mobile ? 'mobile' : 'desktop',
      os: this.extractOS(userAgent),
      browser: this.extractBrowser(userAgent),
      version: this.extractVersion(userAgent)
    };
  }

  private extractClientIP(request: EdgeRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           'unknown';
  }

  private extractOS(userAgent: string): string {
    if (/Windows/.test(userAgent)) return 'Windows';
    if (/Mac OS/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    if (/Android/.test(userAgent)) return 'Android';
    if (/iOS/.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  private extractBrowser(userAgent: string): string {
    if (/Chrome/.test(userAgent)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Safari/.test(userAgent)) return 'Safari';
    if (/Edge/.test(userAgent)) return 'Edge';
    return 'Unknown';
  }

  private extractVersion(userAgent: string): string {
    const match = userAgent.match(/(?:Chrome|Firefox|Safari|Edge)\/(\d+\.\d+)/);
    return match ? match[1] : 'Unknown';
  }

  private detectBot(userAgent: string): boolean {
    const botPatterns = [
      /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
      /baiduspider/i, /yandexbot/i, /facebookexternalhit/i
    ];
    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  private calculateRiskScore(request: EdgeRequest): number {
    let score = 0;
    
    // Check for suspicious patterns
    const userAgent = request.headers.get('user-agent') || '';
    if (!userAgent || userAgent.length < 10) score += 30;
    if (this.detectBot(userAgent)) score += 20;
    
    // Check request frequency (simplified)
    const referer = request.headers.get('referer');
    if (!referer) score += 10;
    
    return Math.min(score, 100);
  }

  private generateFingerprint(request: EdgeRequest): string {
    const components = [
      request.headers.get('user-agent'),
      request.headers.get('accept-language'),
      request.headers.get('accept-encoding'),
      (request as any).ip
    ].filter(Boolean);
    
    return btoa(components.join('|')).substring(0, 16);
  }
}

// === GEOLOCATION ROUTER CLASS ===

export class GeolocationRouter {
  private routes: Map<string, RouteConfig> = new Map();
  private fallbackRoute: RouteConfig;

  constructor() {
    this.setupDefaultRoutes();
    this.fallbackRoute = {
      region: 'global',
      origin: 'https://global.example.com',
      cacheStrategy: { ttl: 3600, tags: ['global'], vary: ['Accept-Language'] }
    };
  }

  async route(request: EdgeRequest, geo: GeolocationData): Promise<RouteResult> {
    const routeKey = this.generateRouteKey(geo);
    const route = this.routes.get(routeKey) || this.findBestMatch(geo) || this.fallbackRoute;
    
    // Check for regional redirects
    if (this.shouldRedirect(request, geo, route)) {
      return {
        route,
        redirect: this.generateRedirectUrl(request, route)
      };
    }
    
    // Apply route-specific transformations
    const transformedRequest = await this.transformRequest(request, route);
    
    return {
      route,
      request: transformedRequest,
      cacheStrategy: route.cacheStrategy
    };
  }

  private setupDefaultRoutes(): void {
    // North America
    this.routes.set('US', {
      region: 'us-east-1',
      origin: 'https://us.example.com',
      cacheStrategy: { ttl: 7200, tags: ['us'], vary: ['Accept-Language'] },
      features: { abTesting: true, personalization: true }
    });
    
    // Europe
    this.routes.set('GB', {
      region: 'eu-west-1',
      origin: 'https://eu.example.com',
      cacheStrategy: { ttl: 3600, tags: ['eu'], vary: ['Accept-Language'] },
      features: { gdprCompliant: true, abTesting: true }
    });
    
    // Asia Pacific
    this.routes.set('JP', {
      region: 'ap-northeast-1',
      origin: 'https://ap.example.com',
      cacheStrategy: { ttl: 1800, tags: ['ap'], vary: ['Accept-Language'] },
      features: { localization: true }
    });
  }

  private generateRouteKey(geo: GeolocationData): string {
    return geo.country;
  }

  private findBestMatch(geo: GeolocationData): RouteConfig | null {
    // Simple region-based fallback
    const regionMap: Record<string, string> = {
      'CA': 'US', // Canada uses US infrastructure
      'FR': 'GB', // France uses EU infrastructure
      'DE': 'GB', // Germany uses EU infrastructure
      'AU': 'JP', // Australia uses AP infrastructure
    };
    
    const fallbackCountry = regionMap[geo.country];
    return fallbackCountry ? this.routes.get(fallbackCountry) || null : null;
  }

  private shouldRedirect(request: EdgeRequest, geo: GeolocationData, route: RouteConfig): boolean {
    const url = new URL(request.url);
    
    // Check if user is accessing wrong regional domain
    if (route.origin && !url.hostname.includes(route.region)) {
      return true;
    }
    
    // Check for compliance requirements
    if (geo.country === 'CN' && !route.features?.chinaCompliant) {
      return true;
    }
    
    return false;
  }

  private generateRedirectUrl(request: EdgeRequest, route: RouteConfig): string {
    const url = new URL(request.url);
    const routeUrl = new URL(route.origin);
    
    return `${routeUrl.protocol}//${routeUrl.hostname}${url.pathname}${url.search}`;
  }

  private async transformRequest(request: EdgeRequest, route: RouteConfig): Promise<EdgeRequest> {
    const headers = new Headers(request.headers);
    
    // Add regional headers
    headers.set('X-Region', route.region);
    headers.set('X-Origin', route.origin);
    
    // Add feature flags
    if (route.features) {
      headers.set('X-Features', JSON.stringify(route.features));
    }
    
    return new Request(request.url, {
      method: request.method,
      headers,
      body: request.body
    }) as EdgeRequest;
  }
}

interface RouteConfig {
  region: string;
  origin: string;
  cacheStrategy: CacheStrategy;
  features?: Record<string, any>;
}

interface RouteResult {
  route: RouteConfig;
  request?: EdgeRequest;
  redirect?: string;
  cacheStrategy?: CacheStrategy;
}

// === EDGE CACHE CLASS ===

export class EdgeCacheInstance {
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0 };

  async get(key: string, strategy?: CacheStrategy): Promise<CacheEntry | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Handle stale-while-revalidate
    if (strategy?.staleWhileRevalidate && this.isStale(entry)) {
      // Return stale data but mark for background revalidation
      (entry as any).needsRevalidation = true;
    }
    
    this.stats.hits++;
    entry.lastAccessed = Date.now();
    return entry;
  }

  async set(key: string, data: any, strategy: CacheStrategy): Promise<void> {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: strategy.ttl,
      tags: strategy.tags,
      vary: strategy.vary,
      lastAccessed: Date.now()
    };
    
    this.cache.set(key, entry);
    this.stats.sets++;
    
    // Implement LRU eviction if cache gets too large
    if (this.cache.size > 10000) {
      this.evictLRU();
    }
  }

  async invalidate(pattern: string | RegExp): Promise<number> {
    let deletedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.matchesPattern(key, pattern)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    this.stats.deletes += deletedCount;
    return deletedCount;
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    let deletedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    this.stats.deletes += deletedCount;
    return deletedCount;
  }

  generateKey(request: Request, context?: Record<string, any>): string {
    const url = new URL(request.url);
    const baseKey = `${request.method}:${url.pathname}${url.search}`;
    
    if (!context) return baseKey;
    
    const contextKey = Object.entries(context)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    
    return `${baseKey}|${contextKey}`;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl * 1000;
  }

  private isStale(entry: CacheEntry): boolean {
    // Consider stale if more than 50% of TTL has passed
    return Date.now() - entry.timestamp > (entry.ttl * 1000) * 0.5;
  }

  private matchesPattern(key: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      return key.includes(pattern);
    }
    return pattern.test(key);
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  tags: string[];
  vary: string[];
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
}

// === A/B TESTING SYSTEM ===

export class ABTestingEngine {
  private experiments: Map<string, ABTestConfig> = new Map();
  private assignmentCache: Map<string, string> = new Map();

  registerExperiment(config: ABTestConfig): void {
    this.experiments.set(config.id, config);
  }

  async assignVariant(experimentId: string, context: PersonalizationContext): Promise<string> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return 'control';
    
    // Check cache for consistent assignment
    const cacheKey = `${experimentId}:${context.sessionId}`;
    const cachedAssignment = this.assignmentCache.get(cacheKey);
    if (cachedAssignment) return cachedAssignment;
    
    // Check targeting rules
    if (experiment.targeting && !this.matchesTargeting(experiment.targeting, context)) {
      return 'control';
    }
    
    // Assign variant based on weights
    const variant = this.selectVariant(experiment.variants, context.sessionId);
    this.assignmentCache.set(cacheKey, variant);
    
    return variant;
  }

  private matchesTargeting(rules: TargetingRule[], context: PersonalizationContext): boolean {
    return rules.every(rule => this.evaluateRule(rule, context));
  }

  private evaluateRule(rule: TargetingRule, context: PersonalizationContext): boolean {
    let value: any;
    
    switch (rule.type) {
      case 'device':
        value = context.device[rule.field as keyof DeviceInfo];
        break;
      case 'geo':
        // Would need geo context
        return true;
      default:
        return true;
    }
    
    switch (rule.operator) {
      case 'equals':
        return value === rule.value;
      case 'contains':
        return String(value).includes(String(rule.value));
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(value);
      default:
        return false;
    }
  }

  private selectVariant(variants: ABVariant[], sessionId: string): string {
    // Simple hash-based assignment for consistency
    const hash = this.hashString(sessionId);
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const threshold = (hash % 100) * totalWeight / 100;
    
    let currentWeight = 0;
    for (const variant of variants) {
      currentWeight += variant.weight;
      if (threshold <= currentWeight) {
        return variant.id;
      }
    }
    
    return variants[0]?.id || 'control';
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// === RATE LIMITING SYSTEM ===

export class EdgeRateLimiter {
  private windows: Map<string, RateLimitWindow> = new Map();
  private defaultConfig: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    keyGenerator: (req) => this.getClientIP(req)
  };

  async checkLimit(request: Request, config?: Partial<RateLimitConfig>): Promise<RateLimitResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    if (finalConfig.skipIf && finalConfig.skipIf(request)) {
      return { allowed: true, remaining: finalConfig.maxRequests };
    }
    
    const key = finalConfig.keyGenerator(request);
    const window = this.getOrCreateWindow(key, finalConfig);
    
    if (window.requests >= finalConfig.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: window.resetTime,
        retryAfter: Math.ceil((window.resetTime - Date.now()) / 1000)
      };
    }
    
    window.requests++;
    return {
      allowed: true,
      remaining: finalConfig.maxRequests - window.requests
    };
  }

  private getOrCreateWindow(key: string, config: RateLimitConfig): RateLimitWindow {
    const now = Date.now();
    const existing = this.windows.get(key);
    
    if (existing && now < existing.resetTime) {
      return existing;
    }
    
    // Create new window
    const window: RateLimitWindow = {
      requests: 0,
      resetTime: now + config.windowMs
    };
    
    this.windows.set(key, window);
    return window;
  }

  private getClientIP(request: Request): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('cf-connecting-ip') ||
           'unknown';
  }
}

interface RateLimitWindow {
  requests: number;
  resetTime: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime?: number;
  retryAfter?: number;
}

// === DEMO COMPONENT ===

export const DemoVercelEdgeFunctions: React.FC = () => {
  const [edgeStatus, setEdgeStatus] = useState<string>('Initializing...');
  const [geoInfo, setGeoInfo] = useState<GeolocationData | null>(null);
  const [abVariant, setAbVariant] = useState<string>('loading...');
  const [cacheStats, setCacheStats] = useState<CacheStats>({ hits: 0, misses: 0, sets: 0, deletes: 0 });

  useEffect(() => {
    // Simulate edge function initialization
    const initializeEdge = async () => {
      setEdgeStatus('Edge functions initialized');
      
      // Mock geolocation data
      setGeoInfo({
        country: 'US',
        region: 'CA',
        city: 'San Francisco',
        latitude: 37.7749,
        longitude: -122.4194,
        timezone: 'America/Los_Angeles'
      });
      
      // Mock A/B test assignment
      const abEngine = new ABTestingEngine();
      abEngine.registerExperiment({
        id: 'homepage-redesign',
        variants: [
          { id: 'control', weight: 50, config: { layout: 'original' } },
          { id: 'variant-a', weight: 50, config: { layout: 'new' } }
        ],
        traffic: 100
      });
      
      const mockContext: PersonalizationContext = {
        sessionId: 'session-123',
        preferences: {},
        segments: ['new-user'],
        device: { type: 'desktop', os: 'macOS', browser: 'Chrome', version: '91.0' }
      };
      
      const variant = await abEngine.assignVariant('homepage-redesign', mockContext);
      setAbVariant(variant);
      
      // Mock cache stats
      setCacheStats({ hits: 150, misses: 23, sets: 45, deletes: 2 });
    };
    
    initializeEdge();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vercel Edge Functions Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Edge Status</h3>
          <p className="text-sm">{edgeStatus}</p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold mb-2">Geolocation</h3>
          {geoInfo ? (
            <div className="text-sm space-y-1">
              <p>Country: {geoInfo.country}</p>
              <p>Region: {geoInfo.region}</p>
              <p>City: {geoInfo.city}</p>
            </div>
          ) : (
            <p className="text-sm">Loading location...</p>
          )}
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="font-semibold mb-2">A/B Test Assignment</h3>
          <p className="text-sm">Variant: {abVariant}</p>
        </div>
        
        <div className="p-4 bg-orange-50 rounded-lg">
          <h3 className="font-semibold mb-2">Cache Statistics</h3>
          <div className="text-sm space-y-1">
            <p>Hits: {cacheStats.hits}</p>
            <p>Misses: {cacheStats.misses}</p>
            <p>Hit Rate: {((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Edge Function Features</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Geographic routing with fallbacks</li>
          <li>✅ A/B testing with consistent assignment</li>
          <li>✅ Edge caching with TTL and tags</li>
          <li>✅ Rate limiting with sliding windows</li>
          <li>✅ Request/response transformation</li>
          <li>✅ Security headers and bot detection</li>
        </ul>
      </div>
    </div>
  );
};

export default DemoVercelEdgeFunctions;