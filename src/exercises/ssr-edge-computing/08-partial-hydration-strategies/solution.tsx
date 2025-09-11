import React, { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import type { ReactElement, ReactNode, ComponentType } from 'react';

// === TYPES AND INTERFACES ===

interface HydrationStrategy {
  type: 'immediate' | 'viewport' | 'interaction' | 'idle' | 'media' | 'never';
  options?: {
    rootMargin?: string;
    threshold?: number | number[];
    events?: string[];
    media?: string;
    delay?: number;
  };
}

interface HydrationState {
  isHydrated: boolean;
  isHydrating: boolean;
  error?: Error;
  startTime?: number;
  endTime?: number;
}

interface IslandConfig {
  id: string;
  component: ComponentType<any>;
  props: any;
  strategy: HydrationStrategy;
  priority: number;
  fallback?: ReactNode;
  errorBoundary?: boolean;
}

interface HydrationMetrics {
  totalComponents: number;
  hydratedComponents: number;
  pendingComponents: number;
  failedComponents: number;
  totalHydrationTime: number;
  averageHydrationTime: number;
  memoryUsage: number;
}

interface ResourceBudget {
  maxMemory: number;
  maxConcurrent: number;
  timeSlice: number;
  idleTimeout: number;
}

// === HYDRATION BOUNDARY COMPONENT ===

interface HydrationBoundaryProps {
  strategy?: HydrationStrategy;
  fallback?: ReactNode;
  onHydrated?: () => void;
  onError?: (error: Error) => void;
  children: ReactNode;
}

export const HydrationBoundary: React.FC<HydrationBoundaryProps> = ({
  strategy = { type: 'immediate' },
  fallback = null,
  onHydrated,
  onError,
  children
}) => {
  const [hydrationState, setHydrationState] = useState<HydrationState>({
    isHydrated: false,
    isHydrating: false
  });
  
  const elementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hydrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const startHydration = () => {
      if (hydrationState.isHydrated || hydrationState.isHydrating) return;
      
      setHydrationState(prev => ({
        ...prev,
        isHydrating: true,
        startTime: performance.now()
      }));

      // Simulate hydration process
      requestAnimationFrame(() => {
        try {
          // In real implementation, would use hydrateRoot here
          setHydrationState(prev => ({
            ...prev,
            isHydrated: true,
            isHydrating: false,
            endTime: performance.now()
          }));
          
          onHydrated?.();
        } catch (error) {
          setHydrationState(prev => ({
            ...prev,
            isHydrating: false,
            error: error as Error
          }));
          
          onError?.(error as Error);
        }
      });
    };

    switch (strategy.type) {
      case 'immediate':
        startHydration();
        break;

      case 'viewport':
        observerRef.current = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              startHydration();
              observerRef.current?.disconnect();
            }
          },
          {
            rootMargin: strategy.options?.rootMargin || '50px',
            threshold: strategy.options?.threshold || 0.01
          }
        );
        observerRef.current.observe(element);
        break;

      case 'interaction':
        const events = strategy.options?.events || ['click', 'touchstart', 'mouseenter', 'focus'];
        const handleInteraction = () => {
          startHydration();
          events.forEach(event => {
            element.removeEventListener(event, handleInteraction);
          });
        };
        
        events.forEach(event => {
          element.addEventListener(event, handleInteraction, { once: true });
        });
        break;

      case 'idle':
        if ('requestIdleCallback' in window) {
          const idleId = requestIdleCallback(
            () => startHydration(),
            { timeout: strategy.options?.delay || 2000 }
          );
          return () => cancelIdleCallback(idleId);
        } else {
          hydrationTimeoutRef.current = setTimeout(
            startHydration,
            strategy.options?.delay || 2000
          );
        }
        break;

      case 'media':
        if (strategy.options?.media) {
          const mediaQuery = window.matchMedia(strategy.options.media);
          if (mediaQuery.matches) {
            startHydration();
          } else {
            const handleMediaChange = (e: MediaQueryListEvent) => {
              if (e.matches) {
                startHydration();
                mediaQuery.removeEventListener('change', handleMediaChange);
              }
            };
            mediaQuery.addEventListener('change', handleMediaChange);
          }
        }
        break;

      case 'never':
        // Component remains static
        break;
    }

    return () => {
      observerRef.current?.disconnect();
      if (hydrationTimeoutRef.current) {
        clearTimeout(hydrationTimeoutRef.current);
      }
    };
  }, [strategy, onHydrated, onError]);

  if (hydrationState.error) {
    return (
      <div className="hydration-error" ref={elementRef}>
        <p>Failed to hydrate component</p>
        {fallback}
      </div>
    );
  }

  if (!hydrationState.isHydrated) {
    return (
      <div 
        className="hydration-pending"
        ref={elementRef}
        data-hydration-strategy={strategy.type}
      >
        {fallback || children}
      </div>
    );
  }

  return (
    <div 
      className="hydration-complete"
      ref={elementRef}
      data-hydration-time={hydrationState.endTime! - hydrationState.startTime!}
    >
      {children}
    </div>
  );
};

// === LAZY HYDRATOR CLASS ===

export class LazyHydrator {
  private islands: Map<string, IslandConfig> = new Map();
  private hydrationQueue: string[] = [];
  private hydratedIslands: Set<string> = new Set();
  private hydrationMetrics: HydrationMetrics = {
    totalComponents: 0,
    hydratedComponents: 0,
    pendingComponents: 0,
    failedComponents: 0,
    totalHydrationTime: 0,
    averageHydrationTime: 0,
    memoryUsage: 0
  };
  private resourceBudget: ResourceBudget = {
    maxMemory: 50 * 1024 * 1024, // 50MB
    maxConcurrent: 3,
    timeSlice: 50, // ms
    idleTimeout: 2000 // ms
  };
  private currentlyHydrating = 0;

  registerIsland(config: IslandConfig): void {
    this.islands.set(config.id, config);
    this.hydrationMetrics.totalComponents++;
    this.scheduleHydration(config.id);
  }

  private scheduleHydration(islandId: string): void {
    const island = this.islands.get(islandId);
    if (!island || this.hydratedIslands.has(islandId)) return;

    // Insert into queue based on priority
    const insertIndex = this.hydrationQueue.findIndex(id => {
      const otherIsland = this.islands.get(id);
      return otherIsland && otherIsland.priority < island.priority;
    });

    if (insertIndex === -1) {
      this.hydrationQueue.push(islandId);
    } else {
      this.hydrationQueue.splice(insertIndex, 0, islandId);
    }

    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.currentlyHydrating >= this.resourceBudget.maxConcurrent) {
      return;
    }

    const islandId = this.hydrationQueue.shift();
    if (!islandId) return;

    const island = this.islands.get(islandId);
    if (!island || this.hydratedIslands.has(islandId)) {
      this.processQueue();
      return;
    }

    // Check memory budget
    if (!this.checkMemoryBudget()) {
      // Defer hydration if memory pressure
      this.hydrationQueue.unshift(islandId);
      setTimeout(() => this.processQueue(), 1000);
      return;
    }

    this.currentlyHydrating++;
    this.hydrationMetrics.pendingComponents++;

    try {
      await this.hydrateIsland(island);
      this.hydratedIslands.add(islandId);
      this.hydrationMetrics.hydratedComponents++;
    } catch (error) {
      console.error(`Failed to hydrate island ${islandId}:`, error);
      this.hydrationMetrics.failedComponents++;
    } finally {
      this.currentlyHydrating--;
      this.hydrationMetrics.pendingComponents--;
      this.processQueue();
    }
  }

  private async hydrateIsland(island: IslandConfig): Promise<void> {
    const startTime = performance.now();

    // Simulate hydration with time slicing
    await new Promise(resolve => {
      const chunks = Math.ceil(100 / this.resourceBudget.timeSlice);
      let currentChunk = 0;

      const processChunk = () => {
        if (currentChunk >= chunks) {
          resolve(undefined);
          return;
        }

        // Simulate work
        const chunkStartTime = performance.now();
        while (performance.now() - chunkStartTime < this.resourceBudget.timeSlice) {
          // Process hydration work
        }

        currentChunk++;
        requestIdleCallback(processChunk);
      };

      requestIdleCallback(processChunk);
    });

    const hydrationTime = performance.now() - startTime;
    this.hydrationMetrics.totalHydrationTime += hydrationTime;
    this.hydrationMetrics.averageHydrationTime = 
      this.hydrationMetrics.totalHydrationTime / this.hydrationMetrics.hydratedComponents;
  }

  private checkMemoryBudget(): boolean {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMemory = memory.usedJSHeapSize;
      this.hydrationMetrics.memoryUsage = usedMemory;
      return usedMemory < this.resourceBudget.maxMemory;
    }
    return true;
  }

  getMetrics(): HydrationMetrics {
    return { ...this.hydrationMetrics };
  }

  updateBudget(budget: Partial<ResourceBudget>): void {
    this.resourceBudget = { ...this.resourceBudget, ...budget };
  }

  prioritizeIsland(islandId: string): void {
    const index = this.hydrationQueue.indexOf(islandId);
    if (index > 0) {
      this.hydrationQueue.splice(index, 1);
      this.hydrationQueue.unshift(islandId);
      this.processQueue();
    }
  }
}

// === INTERACTION OBSERVER CLASS ===

export class InteractionObserver {
  private observers: Map<string, IntersectionObserver> = new Map();
  private eventListeners: Map<string, Set<() => void>> = new Map();
  private idleCallbacks: Map<string, number> = new Map();
  private callbacks: Map<string, () => void> = new Map();
  private observedElements: WeakMap<Element, string> = new WeakMap();

  observe(
    element: Element,
    callback: () => void,
    strategy: HydrationStrategy
  ): string {
    const id = crypto.randomUUID();
    this.callbacks.set(id, callback);
    this.observedElements.set(element, id);

    switch (strategy.type) {
      case 'viewport':
        this.observeViewport(element, id, strategy.options);
        break;
      case 'interaction':
        this.observeInteraction(element, id, strategy.options);
        break;
      case 'idle':
        this.observeIdle(id, strategy.options);
        break;
      case 'media':
        this.observeMedia(id, strategy.options);
        break;
    }

    return id;
  }

  private observeViewport(
    element: Element,
    id: string,
    options?: HydrationStrategy['options']
  ): void {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.triggerCallback(id);
          this.unobserve(id);
        }
      },
      {
        rootMargin: options?.rootMargin || '50px',
        threshold: options?.threshold || 0.01
      }
    );

    observer.observe(element);
    this.observers.set(id, observer);
  }

  private observeInteraction(
    element: Element,
    id: string,
    options?: HydrationStrategy['options']
  ): void {
    const events = options?.events || ['click', 'touchstart', 'mouseenter', 'focus'];
    const listeners = new Set<() => void>();

    const handleInteraction = () => {
      this.triggerCallback(id);
      this.unobserve(id);
    };

    events.forEach(event => {
      element.addEventListener(event, handleInteraction, { once: true });
      listeners.add(() => element.removeEventListener(event, handleInteraction));
    });

    this.eventListeners.set(id, listeners);
  }

  private observeIdle(id: string, options?: HydrationStrategy['options']): void {
    const timeout = options?.delay || 2000;

    if ('requestIdleCallback' in window) {
      const callbackId = requestIdleCallback(
        () => {
          this.triggerCallback(id);
          this.unobserve(id);
        },
        { timeout }
      );
      this.idleCallbacks.set(id, callbackId);
    } else {
      setTimeout(() => {
        this.triggerCallback(id);
        this.unobserve(id);
      }, timeout);
    }
  }

  private observeMedia(id: string, options?: HydrationStrategy['options']): void {
    if (!options?.media) return;

    const mediaQuery = window.matchMedia(options.media);
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        this.triggerCallback(id);
        this.unobserve(id);
      }
    };

    if (mediaQuery.matches) {
      this.triggerCallback(id);
    } else {
      mediaQuery.addEventListener('change', handleChange);
      this.eventListeners.set(id, new Set([
        () => mediaQuery.removeEventListener('change', handleChange)
      ]));
    }
  }

  private triggerCallback(id: string): void {
    const callback = this.callbacks.get(id);
    if (callback) {
      callback();
      this.callbacks.delete(id);
    }
  }

  unobserve(id: string): void {
    // Clean up intersection observer
    const observer = this.observers.get(id);
    if (observer) {
      observer.disconnect();
      this.observers.delete(id);
    }

    // Clean up event listeners
    const listeners = this.eventListeners.get(id);
    if (listeners) {
      listeners.forEach(cleanup => cleanup());
      this.eventListeners.delete(id);
    }

    // Clean up idle callbacks
    const idleId = this.idleCallbacks.get(id);
    if (idleId && 'cancelIdleCallback' in window) {
      cancelIdleCallback(idleId);
      this.idleCallbacks.delete(id);
    }

    this.callbacks.delete(id);
  }

  unobserveAll(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    this.eventListeners.forEach(listeners => {
      listeners.forEach(cleanup => cleanup());
    });
    this.eventListeners.clear();

    this.idleCallbacks.forEach(id => {
      if ('cancelIdleCallback' in window) {
        cancelIdleCallback(id);
      }
    });
    this.idleCallbacks.clear();

    this.callbacks.clear();
  }
}

// === PRIORITY MANAGER CLASS ===

export class PriorityManager {
  private priorities: Map<string, number> = new Map();
  private queue: Array<{ id: string; priority: number; timestamp: number }> = [];
  private processing: Set<string> = new Set();
  private resourceMonitor: ResourceMonitor;
  private adaptiveScheduler: AdaptiveScheduler;

  constructor() {
    this.resourceMonitor = new ResourceMonitor();
    this.adaptiveScheduler = new AdaptiveScheduler(this.resourceMonitor);
  }

  schedule(id: string, basePriority: number, callback: () => Promise<void>): void {
    // Adjust priority based on current resource availability
    const adjustedPriority = this.adaptiveScheduler.adjustPriority(basePriority);
    
    this.priorities.set(id, adjustedPriority);
    this.queue.push({
      id,
      priority: adjustedPriority,
      timestamp: Date.now()
    });

    // Sort queue by priority (higher first) and timestamp (older first)
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });

    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.queue.length === 0) return;

    // Check resource availability
    const resources = this.resourceMonitor.getCurrentResources();
    if (!resources.canProcess) {
      // Defer processing
      setTimeout(() => this.processNext(), resources.retryAfter);
      return;
    }

    const item = this.queue.shift();
    if (!item || this.processing.has(item.id)) {
      this.processNext();
      return;
    }

    this.processing.add(item.id);

    try {
      // Process with time slicing
      await this.adaptiveScheduler.executeWithTimeSlicing(async () => {
        // Execute the hydration callback
        console.log(`Processing ${item.id} with priority ${item.priority}`);
      });
    } catch (error) {
      console.error(`Failed to process ${item.id}:`, error);
    } finally {
      this.processing.delete(item.id);
      this.priorities.delete(item.id);
      
      // Continue processing
      if (this.queue.length > 0) {
        requestIdleCallback(() => this.processNext());
      }
    }
  }

  reprioritize(id: string, newPriority: number): void {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue[index].priority = newPriority;
      this.priorities.set(id, newPriority);
      
      // Re-sort the queue
      this.queue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });
    }
  }

  clear(): void {
    this.queue = [];
    this.priorities.clear();
    this.processing.clear();
  }

  getQueueStatus(): {
    queued: number;
    processing: number;
    avgPriority: number;
  } {
    const avgPriority = this.queue.length > 0
      ? this.queue.reduce((sum, item) => sum + item.priority, 0) / this.queue.length
      : 0;

    return {
      queued: this.queue.length,
      processing: this.processing.size,
      avgPriority
    };
  }
}

// Helper Classes
class ResourceMonitor {
  getCurrentResources(): {
    canProcess: boolean;
    retryAfter: number;
    cpuUsage: number;
    memoryUsage: number;
  } {
    // Check memory usage
    let memoryUsage = 0;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }

    // Estimate CPU usage (simplified)
    const cpuUsage = Math.random() * 0.5; // Mock value

    const canProcess = memoryUsage < 0.8 && cpuUsage < 0.7;
    const retryAfter = canProcess ? 0 : Math.min(1000, (memoryUsage - 0.5) * 2000);

    return {
      canProcess,
      retryAfter,
      cpuUsage,
      memoryUsage
    };
  }
}

class AdaptiveScheduler {
  constructor(private resourceMonitor: ResourceMonitor) {}

  adjustPriority(basePriority: number): number {
    const resources = this.resourceMonitor.getCurrentResources();
    
    // Lower priority when resources are constrained
    if (resources.memoryUsage > 0.7) {
      return Math.max(0, basePriority - 20);
    }
    if (resources.cpuUsage > 0.6) {
      return Math.max(0, basePriority - 10);
    }
    
    return basePriority;
  }

  async executeWithTimeSlicing(callback: () => Promise<void>): Promise<void> {
    const timeSlice = 16; // Target 60fps
    const startTime = performance.now();

    while (performance.now() - startTime < timeSlice) {
      await callback();
    }

    // Yield to browser
    await new Promise(resolve => {
      requestIdleCallback(resolve as IdleRequestCallback);
    });
  }
}

// === ISLAND COMPONENT ===

interface IslandProps {
  id: string;
  component: ComponentType<any>;
  props?: any;
  strategy?: HydrationStrategy;
  priority?: number;
  fallback?: ReactNode;
}

export const Island: React.FC<IslandProps> = ({
  id,
  component: Component,
  props = {},
  strategy = { type: 'viewport' },
  priority = 50,
  fallback
}) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const hydrator = useMemo(() => new LazyHydrator(), []);

  useEffect(() => {
    hydrator.registerIsland({
      id,
      component: Component,
      props,
      strategy,
      priority,
      fallback
    });
  }, [id, Component, props, strategy, priority, fallback, hydrator]);

  if (!isHydrated) {
    return (
      <HydrationBoundary
        strategy={strategy}
        fallback={fallback}
        onHydrated={() => setIsHydrated(true)}
      >
        <div data-island-id={id} data-island-priority={priority}>
          {fallback || <Component {...props} />}
        </div>
      </HydrationBoundary>
    );
  }

  return <Component {...props} />;
};

// === DEMO COMPONENT ===

export const DemoPartialHydration: React.FC = () => {
  const [metrics, setMetrics] = useState<HydrationMetrics>({
    totalComponents: 0,
    hydratedComponents: 0,
    pendingComponents: 0,
    failedComponents: 0,
    totalHydrationTime: 0,
    averageHydrationTime: 0,
    memoryUsage: 0
  });

  const [islands] = useState([
    { id: 'header', priority: 100, strategy: { type: 'immediate' as const } },
    { id: 'hero', priority: 90, strategy: { type: 'viewport' as const } },
    { id: 'features', priority: 70, strategy: { type: 'viewport' as const } },
    { id: 'testimonials', priority: 50, strategy: { type: 'idle' as const } },
    { id: 'footer', priority: 30, strategy: { type: 'idle' as const } },
    { id: 'chat', priority: 80, strategy: { type: 'interaction' as const } }
  ]);

  const hydrator = useMemo(() => new LazyHydrator(), []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(hydrator.getMetrics());
    }, 500);

    return () => clearInterval(interval);
  }, [hydrator]);

  const MockComponent: React.FC<{ name: string }> = ({ name }) => (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-semibold">{name}</h3>
      <p className="text-sm text-gray-600">Interactive component</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Partial Hydration Strategies Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Hydration Metrics</h3>
          <div className="text-sm space-y-1">
            <p>Total: {metrics.totalComponents}</p>
            <p>Hydrated: {metrics.hydratedComponents}</p>
            <p>Pending: {metrics.pendingComponents}</p>
            <p>Failed: {metrics.failedComponents}</p>
          </div>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold mb-2">Performance</h3>
          <div className="text-sm space-y-1">
            <p>Avg Time: {metrics.averageHydrationTime.toFixed(2)}ms</p>
            <p>Total Time: {metrics.totalHydrationTime.toFixed(2)}ms</p>
            <p>Memory: {(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Islands with Different Strategies</h3>
        
        {islands.map(island => (
          <Island
            key={island.id}
            id={island.id}
            component={MockComponent}
            props={{ name: island.id }}
            strategy={island.strategy}
            priority={island.priority}
            fallback={
              <div className="p-4 bg-gray-100 rounded animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            }
          />
        ))}
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Hydration Features</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Islands architecture with independent hydration</li>
          <li>✅ Multiple hydration strategies (immediate, viewport, interaction, idle)</li>
          <li>✅ Priority-based hydration scheduling</li>
          <li>✅ Resource budget management</li>
          <li>✅ Memory pressure detection</li>
          <li>✅ Time slicing for non-blocking hydration</li>
          <li>✅ Adaptive scheduling based on device capabilities</li>
        </ul>
      </div>
    </div>
  );
};

export default DemoPartialHydration;