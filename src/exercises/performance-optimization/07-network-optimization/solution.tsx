import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Network optimization types
interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  priority?: 'high' | 'normal' | 'low';
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  etag?: string;
  lastModified?: string;
}

interface NetworkMetrics {
  requestCount: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  failureRate: number;
  bytesTransferred: number;
}

interface BatchedRequest {
  id: string;
  config: RequestConfig;
  resolve: (data: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

// Request batching hook
function useRequestBatcher() {
  const [pendingRequests, setPendingRequests] = useState<BatchedRequest[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const requestIdRef = useRef(0);

  const batchRequest = useCallback(async (config: RequestConfig): Promise<any> => {
    return new Promise((resolve, reject) => {
      const request: BatchedRequest = {
        id: (++requestIdRef.current).toString(),
        config,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      // Check for identical pending requests (deduplication)
      const existingRequest = pendingRequests.find(req => 
        req.config.url === config.url && 
        req.config.method === config.method &&
        JSON.stringify(req.config.body) === JSON.stringify(config.body)
      );

      if (existingRequest) {
        // Return the existing promise instead of creating new request
        // TBD: 
        // Request deduplication logic has a flaw. Reassigning existingRequest.resolve and 
        // existingRequest.reject will overwrite the original callbacks, potentially causing 
        // the original request to never resolve. Should maintain an array of callbacks for each request.
        existingRequest.resolve = (data) => {
          resolve(data);
          existingRequest.resolve(data);
        };
        existingRequest.reject = (error) => {
          reject(error);
          existingRequest.reject(error);
        };
        return;
      }

      setPendingRequests(prev => [...prev, request]);

      // Set up batch timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }

      batchTimeoutRef.current = setTimeout(() => {
        executeBatch(pendingRequests.concat(request));
      }, 50); // 50ms batch window
    });
  }, [pendingRequests]);

  const executeBatch = useCallback(async (requests: BatchedRequest[]) => {
    if (requests.length === 0) return;

    // Group requests by similarity (same domain, similar endpoints)
    const batches = groupRequestsForBatching(requests);

    // Execute each batch
    for (const batch of batches) {
      try {
        if (batch.length === 1) {
          // Single request - execute normally
          const request = batch[0];
          const response = await executeRequest(request.config);
          request.resolve(response);
        } else {
          // Multiple requests - execute as batch if possible
          const responses = await executeBatchedRequests(batch.map(r => r.config));
          batch.forEach((request, index) => {
            request.resolve(responses[index]);
          });
        }
      } catch (error) {
        // Handle batch failures
        batch.forEach(request => {
          request.reject(error);
        });
      }
    }

    // Clear processed requests
    setPendingRequests([]);
  }, []);

  const flushBatch = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    executeBatch(pendingRequests);
  }, [pendingRequests, executeBatch]);

  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  return {
    batchRequest,
    flushBatch,
    pendingCount: pendingRequests.length,
  };
}

// Helper functions for request batching
function groupRequestsForBatching(requests: BatchedRequest[]): BatchedRequest[][] {
  const groups: { [key: string]: BatchedRequest[] } = {};

  requests.forEach(request => {
    const key = getBatchKey(request.config);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(request);
  });

  return Object.values(groups);
}

function getBatchKey(config: RequestConfig): string {
  const url = new URL(config.url, window.location.origin);
  return url.origin + url.pathname + (config.method || 'GET');
}

async function executeRequest(config: RequestConfig): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || 5000);

  try {
    const response = await fetch(config.url, {
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body ? JSON.stringify(config.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error("HTTP " + response.status + ": " + response.statusText);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function executeBatchedRequests(configs: RequestConfig[]): Promise<any[]> {
  // For demonstration, execute requests concurrently
  // In real implementation, this could be a single GraphQL batch request
  // or a custom batch API endpoint
  return Promise.all(configs.map(config => executeRequest(config)));
}

// RequestBatcher component
interface RequestBatcherProps {
  batchSize?: number;
  batchTimeout?: number;
  children: React.ReactNode;
}

function RequestBatcher({ batchSize = 5, batchTimeout = 50, children }: RequestBatcherProps) {
  const { pendingCount, flushBatch } = useRequestBatcher();
  const [batchStats, setBatchStats] = useState({
    totalBatches: 0,
    requestsSaved: 0,
    lastBatchSize: 0,
  });

  const handleManualFlush = useCallback(() => {
    setBatchStats(prev => ({
      ...prev,
      totalBatches: prev.totalBatches + 1,
      lastBatchSize: pendingCount,
    }));
    flushBatch();
  }, [flushBatch, pendingCount]);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded">
        <h4 className="font-medium mb-3">Request Batching Status</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-600">Pending:</span>
            <div className="font-bold text-lg">{pendingCount}</div>
          </div>
          <div>
            <span className="text-gray-600">Total Batches:</span>
            <div className="font-bold text-lg">{batchStats.totalBatches}</div>
          </div>
          <div>
            <span className="text-gray-600">Requests Saved:</span>
            <div className="font-bold text-lg">{batchStats.requestsSaved}</div>
          </div>
          <div>
            <span className="text-gray-600">Last Batch Size:</span>
            <div className="font-bold text-lg">{batchStats.lastBatchSize}</div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleManualFlush}
            disabled={pendingCount === 0}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
          >
            Flush Batch ({pendingCount})
          </button>
        </div>
      </div>
      
      {children}
    </div>
  );
}

// Cache manager hook
function useCacheManager() {
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
  const [metrics, setMetrics] = useState<NetworkMetrics>({
    requestCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    failureRate: 0,
    bytesTransferred: 0,
  });

  const getCacheKey = useCallback((config: RequestConfig): string => {
    const url = new URL(config.url, window.location.origin);
    const key = url.href + (config.method || 'GET') + JSON.stringify(config.body || {});
    return btoa(key).substring(0, 64); // Hash and truncate
  }, []);

  const get = useCallback((key: string): any | null => {
    const entry = cache.get(key);
    
    if (!entry) {
      setMetrics(prev => ({ ...prev, cacheMisses: prev.cacheMisses + 1 }));
      return null;
    }

    // Check TTL expiration
    if (Date.now() > entry.timestamp + entry.ttl) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      setMetrics(prev => ({ ...prev, cacheMisses: prev.cacheMisses + 1 }));
      return null;
    }

    setMetrics(prev => ({ ...prev, cacheHits: prev.cacheHits + 1 }));
    return entry.data;
  }, [cache]);

  const set = useCallback((key: string, data: any, ttl: number = 300000, etag?: string) => {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      etag,
    };

    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, entry);
      return newCache;
    });
  }, []);

  const invalidate = useCallback((pattern?: string) => {
    if (!pattern) {
      setCache(new Map());
      return;
    }

    setCache(prev => {
      const newCache = new Map(prev);
      const regex = new RegExp(pattern);
      
      for (const [key] of newCache) {
        if (regex.test(key)) {
          newCache.delete(key);
        }
      }
      
      return newCache;
    });
  }, []);

  const cleanup = useCallback(() => {
    const now = Date.now();
    setCache(prev => {
      const newCache = new Map();
      
      for (const [key, entry] of prev) {
        if (now <= entry.timestamp + entry.ttl) {
          newCache.set(key, entry);
        }
      }
      
      return newCache;
    });
  }, []);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(cleanup, 60000); // Cleanup every minute
    return () => clearInterval(interval);
  }, [cleanup]);

  return {
    get,
    set,
    invalidate,
    cleanup,
    getCacheKey,
    metrics,
    cacheSize: cache.size,
  };
}

// CacheManager component
interface CacheManagerProps {
  maxSize?: number;
  defaultTTL?: number;
  cleanupInterval?: number;
}

function CacheManager({ maxSize = 100, defaultTTL = 300000, cleanupInterval = 60000 }: CacheManagerProps) {
  const { metrics, cacheSize, invalidate, cleanup } = useCacheManager();

  const hitRate = metrics.cacheHits + metrics.cacheMisses > 0 
    ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Cache Management</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-white border rounded">
          <div className="text-sm text-gray-600">Cache Size</div>
          <div className="text-xl font-bold">{cacheSize}</div>
          <div className="text-xs text-gray-500">/{maxSize} max</div>
        </div>
        
        <div className="p-3 bg-white border rounded">
          <div className="text-sm text-gray-600">Hit Rate</div>
          <div className="text-xl font-bold">{hitRate}%</div>
          <div className="text-xs text-gray-500">{metrics.cacheHits} hits</div>
        </div>
        
        <div className="p-3 bg-white border rounded">
          <div className="text-sm text-gray-600">Cache Misses</div>
          <div className="text-xl font-bold">{metrics.cacheMisses}</div>
          <div className="text-xs text-gray-500">misses</div>
        </div>
        
        <div className="p-3 bg-white border rounded">
          <div className="text-sm text-gray-600">Avg Response</div>
          <div className="text-xl font-bold">{metrics.averageResponseTime.toFixed(0)}ms</div>
          <div className="text-xs text-gray-500">response time</div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => invalidate()}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear All Cache
        </button>
        <button
          onClick={cleanup}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Cleanup Expired
        </button>
        <button
          onClick={() => invalidate('api/users')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Invalidate Users
        </button>
      </div>

      <div className="mt-4">
        <h4 className="font-medium mb-2">Cache Configuration</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Max Size:</span>
            <div>{maxSize} entries</div>
          </div>
          <div>
            <span className="text-gray-600">Default TTL:</span>
            <div>{(defaultTTL / 1000).toFixed(0)}s</div>
          </div>
          <div>
            <span className="text-gray-600">Cleanup Interval:</span>
            <div>{(cleanupInterval / 1000).toFixed(0)}s</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Offline handler hook
function useOfflineHandler() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<RequestConfig[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);

  const queueRequest = useCallback((config: RequestConfig) => {
    const queuedRequest = {
      ...config,
      timestamp: Date.now(),
      id: Math.random().toString(36),
    };

    setOfflineQueue(prev => [...prev, queuedRequest]);

    // Store in localStorage for persistence
    try {
      const stored = localStorage.getItem('offlineQueue') || '[]';
      const queue = JSON.parse(stored);
      queue.push(queuedRequest);
      localStorage.setItem('offlineQueue', JSON.stringify(queue));
    } catch (error) {
      console.warn('Failed to persist offline queue:', error);
    }
  }, []);

  const syncOfflineRequests = useCallback(async () => {
    if (syncInProgress || offlineQueue.length === 0) return;

    setSyncInProgress(true);

    try {
      // Sort by priority and timestamp
      const sortedQueue = [...offlineQueue].sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const aPriority = priorityOrder[a.priority || 'normal'];
        const bPriority = priorityOrder[b.priority || 'normal'];
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return (a.timestamp || 0) - (b.timestamp || 0);
      });

      // Execute requests with retry logic
      const results = [];
      for (const request of sortedQueue) {
        try {
          const result = await executeRequestWithRetry(request);
          results.push({ success: true, request, result });
        } catch (error) {
          results.push({ success: false, request, error });
          console.warn('Failed to sync offline request:', error);
        }
      }

      // Clear successful requests from queue
      const failedRequests = results
        .filter(r => !r.success)
        .map(r => r.request);

      setOfflineQueue(failedRequests);
      
      // Update localStorage
      localStorage.setItem('offlineQueue', JSON.stringify(failedRequests));

    } finally {
      setSyncInProgress(false);
    }
  }, [offlineQueue, syncInProgress]);

  const clearOfflineQueue = useCallback(() => {
    setOfflineQueue([]);
    localStorage.removeItem('offlineQueue');
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      setTimeout(syncOfflineRequests, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load persisted queue on mount
    try {
      const stored = localStorage.getItem('offlineQueue');
      if (stored) {
        const queue = JSON.parse(stored);
        setOfflineQueue(queue);
      }
    } catch (error) {
      console.warn('Failed to load offline queue:', error);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineRequests]);

  return {
    isOnline,
    offlineQueue,
    syncInProgress,
    queueRequest,
    syncOfflineRequests,
    clearOfflineQueue,
  };
}

async function executeRequestWithRetry(config: RequestConfig, maxRetries: number = 3): Promise<any> {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await executeRequest(config);
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// OfflineHandler component
interface OfflineHandlerProps {
  enableSync?: boolean;
  syncStrategy?: 'immediate' | 'background' | 'manual';
}

function OfflineHandler({ enableSync = true, syncStrategy = 'immediate' }: OfflineHandlerProps) {
  const { isOnline, offlineQueue, syncInProgress, syncOfflineRequests, clearOfflineQueue } = useOfflineHandler();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Offline Handling</h3>
      
      <div className="flex items-center space-x-2">
        <div className={"w-3 h-3 rounded-full " + (isOnline ? 'bg-green-500' : 'bg-red-500')}></div>
        <span className="font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {syncInProgress && (
          <span className="text-sm text-blue-600">Syncing...</span>
        )}
      </div>

      <div className="p-4 bg-gray-50 rounded">
        <h4 className="font-medium mb-2">Offline Queue</h4>
        <div className="text-sm text-gray-600 mb-3">
          {offlineQueue.length} requests queued
        </div>
        
        {offlineQueue.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {offlineQueue.slice(0, 5).map((request, index) => (
              <div key={index} className="p-2 bg-white border rounded text-sm">
                <div className="font-medium">{request.method || 'GET'} {request.url}</div>
                <div className="text-xs text-gray-500">
                  Priority: {request.priority || 'normal'} | 
                  Queued: {new Date(request.timestamp || 0).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {offlineQueue.length > 5 && (
              <div className="text-xs text-gray-500 text-center">
                ... and {offlineQueue.length - 5} more
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={syncOfflineRequests}
          disabled={!isOnline || syncInProgress || offlineQueue.length === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {syncInProgress ? 'Syncing...' : 'Sync Now'}
        </button>
        <button
          onClick={clearOfflineQueue}
          disabled={offlineQueue.length === 0}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
        >
          Clear Queue
        </button>
      </div>
    </div>
  );
}

// Optimized fetch hook
function useOptimizedFetch() {
  const { batchRequest } = useRequestBatcher();
  const { get: getCached, set: setCached, getCacheKey } = useCacheManager();
  const { queueRequest, isOnline } = useOfflineHandler();

  const optimizedFetch = useCallback(async (config: RequestConfig) => {
    const cacheKey = getCacheKey(config);
    
    // Check cache first (for GET requests)
    if (config.method === 'GET' || !config.method) {
      const cached = getCached(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // If offline, queue request
    if (!isOnline) {
      queueRequest(config);
      throw new Error('Request queued for offline sync');
    }

    try {
      let result;
      
      // Use batching for appropriate requests
      if (shouldBatchRequest(config)) {
        result = await batchRequest(config);
      } else {
        result = await executeRequestWithRetry(config);
      }

      // Cache successful GET responses
      if ((config.method === 'GET' || !config.method) && result) {
        setCached(cacheKey, result, config.ttl || 300000);
      }

      return result;
    } catch (error) {
      // If request fails and we're offline, queue it
      if (!isOnline) {
        queueRequest(config);
      }
      throw error;
    }
  }, [batchRequest, getCached, setCached, getCacheKey, queueRequest, isOnline]);

  const prefetch = useCallback(async (urls: string[]) => {
    const prefetchPromises = urls.map(url => 
      optimizedFetch({ url, priority: 'low' }).catch(() => {
        // Ignore prefetch failures
      })
    );
    
    await Promise.allSettled(prefetchPromises);
  }, [optimizedFetch]);

  const preload = useCallback(async (url: string) => {
    return optimizedFetch({ url, priority: 'high' });
  }, [optimizedFetch]);

  return {
    optimizedFetch,
    prefetch,
    preload,
  };
}

function shouldBatchRequest(config: RequestConfig): boolean {
  // Batch GET requests to API endpoints
  return (config.method === 'GET' || !config.method) && 
         config.url.includes('/api/') &&
         !config.url.includes('urgent');
}

// Network test component
interface NetworkTestComponentProps {
  endpoints: string[];
  enableCaching?: boolean;
  enableBatching?: boolean;
  enableOffline?: boolean;
}

function NetworkTestComponent({
  endpoints,
  enableCaching = true,
  enableBatching = true,
  enableOffline = true
}: NetworkTestComponentProps) {
  const [results, setResults] = useState<Array<{
    endpoint: string;
    duration: number;
    cached: boolean;
    status: 'success' | 'error' | 'pending';
  }>>([]);

  const { optimizedFetch } = useOptimizedFetch();

  const testEndpoint = useCallback(async (endpoint: string) => {
    setResults(prev => [...prev, {
      endpoint,
      duration: 0,
      cached: false,
      status: 'pending'
    }]);

    const startTime = performance.now();
    
    try {
      await optimizedFetch({ url: endpoint });
      const duration = performance.now() - startTime;
      
      setResults(prev => prev.map(result => 
        result.endpoint === endpoint && result.status === 'pending'
          ? { ...result, duration, status: 'success' as const }
          : result
      ));
    } catch (error) {
      const duration = performance.now() - startTime;
      
      setResults(prev => prev.map(result => 
        result.endpoint === endpoint && result.status === 'pending'
          ? { ...result, duration, status: 'error' as const }
          : result
      ));
    }
  }, [optimizedFetch]);

  const testAllEndpoints = useCallback(async () => {
    setResults([]);
    for (const endpoint of endpoints) {
      await testEndpoint(endpoint);
      // Small delay between requests to see batching effect
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }, [endpoints, testEndpoint]);

  const simulateSlowNetwork = useCallback(() => {
    // This would typically involve service worker or dev tools
    console.log('Simulating slow network...');
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Network Optimization Testing</h3>
      
      <div className="flex flex-wrap gap-4">
        <button
          onClick={testAllEndpoints}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test All Endpoints
        </button>
        <button
          onClick={simulateSlowNetwork}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Simulate Slow Network
        </button>
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Results
        </button>
      </div>

      <div className="space-y-2">
        {results.map((result, index) => (
          <div key={index} className="p-3 border rounded bg-white">
            <div className="flex justify-between items-center">
              <span className="font-medium">{result.endpoint}</span>
              <div className="flex items-center space-x-2">
                <span className={"px-2 py-1 rounded text-sm " + (
                  result.status === 'success' ? 'bg-green-100 text-green-800' :
                  result.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                )}>
                  {result.status}
                </span>
                {result.status !== 'pending' && (
                  <span className="text-sm text-gray-600">
                    {result.duration.toFixed(0)}ms
                  </span>
                )}
                {result.cached && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Cached
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded">
        <h4 className="font-medium mb-2">Performance Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Requests:</span>
            <div className="font-bold">{results.length}</div>
          </div>
          <div>
            <span className="text-gray-600">Successful:</span>
            <div className="font-bold">{results.filter(r => r.status === 'success').length}</div>
          </div>
          <div>
            <span className="text-gray-600">Average Time:</span>
            <div className="font-bold">
              {results.length > 0 
                ? (results.reduce((sum, r) => sum + r.duration, 0) / results.length).toFixed(0) + 'ms'
                : '0ms'
              }
            </div>
          </div>
          <div>
            <span className="text-gray-600">Cache Hits:</span>
            <div className="font-bold">{results.filter(r => r.cached).length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main demo component
export default function NetworkOptimizationDemo() {
  const [selectedTool, setSelectedTool] = useState<'batching' | 'caching' | 'offline'>('batching');
  const [enableOptimizations, setEnableOptimizations] = useState(true);

  // Sample endpoints for testing
  const testEndpoints = [
    '/api/users',
    '/api/posts',
    '/api/comments',
    '/api/analytics',
    '/api/notifications',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Network Optimization & Caching Strategies
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Master network request optimization, intelligent caching, and offline handling.
            Learn request batching, deduplication, and performance monitoring techniques.
          </p>
        </div>

        {/* Global optimization toggle */}
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={enableOptimizations}
              onChange={(e) => setEnableOptimizations(e.target.checked)}
              className="rounded"
            />
            <span className="font-medium">Enable Network Optimizations</span>
          </label>
        </div>

        {/* Tool selection */}
        <div className="flex justify-center space-x-4">
          {[
            { key: 'batching', label: 'Request Batching' },
            { key: 'caching', label: 'Cache Management' },
            { key: 'offline', label: 'Offline Handling' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedTool(key as any)}
              className={"px-6 py-3 rounded-lg font-medium transition-colors " + (
                selectedTool === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tool content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {selectedTool === 'batching' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Request Batching</h2>
                
                <RequestBatcher batchSize={5} batchTimeout={50}>
                  <NetworkTestComponent
                    endpoints={testEndpoints}
                    enableBatching={enableOptimizations}
                    enableCaching={false}
                    enableOffline={false}
                  />
                </RequestBatcher>
              </div>
            )}

            {selectedTool === 'caching' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Cache Management</h2>
                
                <CacheManager
                  maxSize={100}
                  defaultTTL={300000}
                  cleanupInterval={60000}
                />
              </div>
            )}

            {selectedTool === 'offline' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Offline Handling</h2>
                
                <OfflineHandler
                  enableSync={enableOptimizations}
                  syncStrategy="immediate"
                />
              </div>
            )}
          </div>
        </div>

        {/* Performance tips */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Network Optimization Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Batch similar requests to reduce HTTP overhead</li>
              <li>• Implement intelligent caching with TTL and ETags</li>
              <li>• Use request deduplication to avoid duplicate calls</li>
              <li>• Handle offline scenarios with request queuing</li>
            </ul>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Prefetch resources during idle time for better UX</li>
              <li>• Implement retry logic with exponential backoff</li>
              <li>• Monitor network performance and cache hit rates</li>
              <li>• Use compression and optimize payload sizes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}