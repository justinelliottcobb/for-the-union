import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Title, Text, Button, Group, Badge, Stack, Progress, Tabs, Code, Alert } from '@mantine/core';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  accessCount: number;
  lastAccessed: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
  avgResponseTime: number;
  memory: {
    used: number;
    limit: number;
  };
}

interface InvalidationRule {
  pattern: string | RegExp;
  strategy: 'immediate' | 'background' | 'lazy';
  dependencies?: string[];
}

interface CacheConfig {
  maxSize: number;
  defaultTtl: number;
  checkInterval: number;
  compressionEnabled: boolean;
  geoDistribution: boolean;
}

export class CacheOrchestrator {
  private layers: Map<string, CacheLayer> = new Map();
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private invalidationRules: InvalidationRule[] = [];

  constructor(config: CacheConfig) {
    this.config = config;
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      memory: { used: 0, limit: config.maxSize }
    };
  }

  addLayer(name: string, layer: CacheLayer): void {
    this.layers.set(name, layer);
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    this.metrics.totalRequests++;

    for (const [name, layer] of this.layers) {
      const result = await layer.get<T>(key);
      if (result) {
        this.metrics.hits++;
        this.updateResponseTime(startTime);
        
        await this.promoteToUpperLayers(key, result, name);
        return result.data;
      }
    }

    this.metrics.misses++;
    this.updateResponseTime(startTime);
    return null;
  }

  async set<T>(key: string, data: T, options: {
    ttl?: number;
    tags?: string[];
    layer?: string;
  } = {}): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || this.config.defaultTtl,
      tags: options.tags || [],
      accessCount: 0,
      lastAccessed: Date.now()
    };

    if (options.layer && this.layers.has(options.layer)) {
      await this.layers.get(options.layer)!.set(key, entry);
    } else {
      for (const layer of this.layers.values()) {
        await layer.set(key, entry);
      }
    }
  }

  async invalidate(pattern: string | string[]): Promise<void> {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    
    for (const layer of this.layers.values()) {
      for (const pat of patterns) {
        await layer.invalidate(pat);
      }
    }
  }

  async warmCache(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async (key) => {
      const cached = await this.get(key);
      if (!cached) {
        const data = await fetcher(key);
        await this.set(key, data);
      }
    });

    await Promise.all(promises);
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  private async promoteToUpperLayers(key: string, entry: CacheEntry, foundLayer: string): Promise<void> {
    const layerNames = Array.from(this.layers.keys());
    const foundIndex = layerNames.indexOf(foundLayer);
    
    for (let i = 0; i < foundIndex; i++) {
      const upperLayer = this.layers.get(layerNames[i])!;
      await upperLayer.set(key, entry);
    }
  }

  private updateResponseTime(startTime: number): void {
    const responseTime = performance.now() - startTime;
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests;
  }
}

abstract class CacheLayer {
  protected name: string;
  protected config: any;

  constructor(name: string, config: any) {
    this.name = name;
    this.config = config;
  }

  abstract get<T>(key: string): Promise<CacheEntry<T> | null>;
  abstract set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
  abstract invalidate(pattern: string): Promise<void>;
  abstract clear(): Promise<void>;
  abstract getSize(): Promise<number>;
}

export class EdgeCache extends CacheLayer {
  private cache = new Map<string, CacheEntry>();
  private edgeNodes: string[] = [];

  constructor(config: { regions: string[]; replicationFactor: number }) {
    super('edge', config);
    this.edgeNodes = config.regions;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = Date.now();
    return entry as CacheEntry<T>;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    this.cache.set(key, entry);
    
    if (this.config.replicationFactor > 1) {
      await this.replicateToNodes(key, entry);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const [key] of this.cache) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async getSize(): Promise<number> {
    return this.cache.size;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private async replicateToNodes<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    const targetNodes = this.edgeNodes.slice(0, this.config.replicationFactor);
    
    const promises = targetNodes.map(async (node) => {
      try {
        await fetch(`https://${node}/cache/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });
      } catch (error) {
        console.warn(`Failed to replicate to node ${node}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }
}

export class DatabaseCache extends CacheLayer {
  private connection: any;
  private tableName: string;

  constructor(config: { connectionString: string; tableName: string }) {
    super('database', config);
    this.tableName = config.tableName;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE cache_key = ? AND expires_at > NOW()`;
      const result = await this.executeQuery(query, [key]);
      
      if (result.length === 0) return null;

      const row = result[0];
      return {
        data: JSON.parse(row.data),
        timestamp: row.created_at.getTime(),
        ttl: row.ttl,
        tags: JSON.parse(row.tags || '[]'),
        accessCount: row.access_count,
        lastAccessed: row.last_accessed.getTime()
      };
    } catch (error) {
      console.error('Database cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      const expiresAt = new Date(entry.timestamp + entry.ttl);
      const query = `
        INSERT INTO ${this.tableName} 
        (cache_key, data, created_at, expires_at, ttl, tags, access_count, last_accessed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        data = VALUES(data), expires_at = VALUES(expires_at)
      `;
      
      await this.executeQuery(query, [
        key,
        JSON.stringify(entry.data),
        new Date(entry.timestamp),
        expiresAt,
        entry.ttl,
        JSON.stringify(entry.tags),
        entry.accessCount,
        new Date(entry.lastAccessed)
      ]);
    } catch (error) {
      console.error('Database cache set error:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE cache_key REGEXP ?`;
      await this.executeQuery(query, [pattern]);
    } catch (error) {
      console.error('Database cache invalidate error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const query = `DELETE FROM ${this.tableName}`;
      await this.executeQuery(query, []);
    } catch (error) {
      console.error('Database cache clear error:', error);
    }
  }

  async getSize(): Promise<number> {
    try {
      const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE expires_at > NOW()`;
      const result = await this.executeQuery(query, []);
      return result[0].count;
    } catch (error) {
      console.error('Database cache size error:', error);
      return 0;
    }
  }

  private async executeQuery(query: string, params: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve([{ count: 100, access_count: 1, last_accessed: new Date() }]);
      }, 10);
    });
  }
}

export class InvalidationManager {
  private orchestrator: CacheOrchestrator;
  private rules: InvalidationRule[] = [];
  private dependencyGraph = new Map<string, Set<string>>();

  constructor(orchestrator: CacheOrchestrator) {
    this.orchestrator = orchestrator;
  }

  addRule(rule: InvalidationRule): void {
    this.rules.push(rule);
    
    if (rule.dependencies) {
      rule.dependencies.forEach(dep => {
        if (!this.dependencyGraph.has(dep)) {
          this.dependencyGraph.set(dep, new Set());
        }
        this.dependencyGraph.get(dep)!.add(rule.pattern.toString());
      });
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    const patterns = this.dependencyGraph.get(tag) || new Set();
    
    for (const pattern of patterns) {
      const rule = this.rules.find(r => r.pattern.toString() === pattern);
      if (rule) {
        await this.executeInvalidation(rule);
      }
    }
  }

  async invalidateStale(): Promise<void> {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000;
    
    for (const rule of this.rules) {
      if (rule.strategy === 'background') {
        await this.executeInvalidation(rule);
      }
    }
  }

  private async executeInvalidation(rule: InvalidationRule): Promise<void> {
    switch (rule.strategy) {
      case 'immediate':
        await this.orchestrator.invalidate(rule.pattern.toString());
        break;
      case 'background':
        setTimeout(() => {
          this.orchestrator.invalidate(rule.pattern.toString());
        }, 0);
        break;
      case 'lazy':
        break;
    }
  }
}

const DemoCachingStrategies: React.FC = () => {
  const [orchestrator] = useState(() => {
    const config: CacheConfig = {
      maxSize: 1000,
      defaultTtl: 5 * 60 * 1000,
      checkInterval: 30000,
      compressionEnabled: true,
      geoDistribution: true
    };
    
    const orch = new CacheOrchestrator(config);
    
    const edgeCache = new EdgeCache({
      regions: ['us-east-1', 'eu-west-1', 'ap-south-1'],
      replicationFactor: 2
    });
    
    const dbCache = new DatabaseCache({
      connectionString: 'redis://localhost:6379',
      tableName: 'cache_entries'
    });
    
    orch.addLayer('edge', edgeCache);
    orch.addLayer('database', dbCache);
    
    return orch;
  });

  const [invalidationManager] = useState(() => {
    const manager = new InvalidationManager(orchestrator);
    
    manager.addRule({
      pattern: 'user:*',
      strategy: 'immediate',
      dependencies: ['user_update', 'profile_change']
    });
    
    manager.addRule({
      pattern: 'page:*',
      strategy: 'background',
      dependencies: ['content_update']
    });
    
    return manager;
  });

  const [metrics, setMetrics] = useState<CacheMetrics>(() => orchestrator.getMetrics());
  const [isLoading, setIsLoading] = useState(false);
  const [cacheOperations, setCacheOperations] = useState<string[]>([]);

  const addOperation = useCallback((operation: string) => {
    setCacheOperations(prev => [operation, ...prev.slice(0, 9)]);
  }, []);

  const handleCacheTest = useCallback(async (operation: string) => {
    setIsLoading(true);
    
    try {
      switch (operation) {
        case 'set':
          await orchestrator.set('user:123', { name: 'John Doe', email: 'john@example.com' }, {
            ttl: 60000,
            tags: ['user', 'profile']
          });
          addOperation('Set user:123 in cache');
          break;
          
        case 'get':
          const result = await orchestrator.get('user:123');
          addOperation(result ? 'Cache HIT for user:123' : 'Cache MISS for user:123');
          break;
          
        case 'invalidate':
          await orchestrator.invalidate('user:*');
          addOperation('Invalidated all user:* keys');
          break;
          
        case 'warm':
          await orchestrator.warmCache(['user:123', 'user:456'], async (key) => {
            return { name: `User ${key.split(':')[1]}`, email: `user${key.split(':')[1]}@example.com` };
          });
          addOperation('Warmed cache for user keys');
          break;
          
        case 'invalidate-tag':
          await invalidationManager.invalidateByTag('user_update');
          addOperation('Invalidated by tag: user_update');
          break;
      }
      
      setMetrics(orchestrator.getMetrics());
    } catch (error) {
      addOperation(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [orchestrator, invalidationManager, addOperation]);

  const hitRate = useMemo(() => {
    const total = metrics.hits + metrics.misses;
    return total > 0 ? (metrics.hits / total) * 100 : 0;
  }, [metrics]);

  const memoryUsage = useMemo(() => {
    return (metrics.memory.used / metrics.memory.limit) * 100;
  }, [metrics]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Title order={1} mb="md">SSR Caching Strategies</Title>
      <Text mb="xl" c="dimmed">
        Advanced multi-layer caching with smart invalidation and geographic distribution
      </Text>

      <Tabs defaultValue="orchestrator" className="w-full">
        <Tabs.List>
          <Tabs.Tab value="orchestrator">Cache Orchestrator</Tabs.Tab>
          <Tabs.Tab value="layers">Cache Layers</Tabs.Tab>
          <Tabs.Tab value="invalidation">Invalidation</Tabs.Tab>
          <Tabs.Tab value="metrics">Metrics</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="orchestrator" pt="md">
          <Card>
            <Title order={3} mb="md">Multi-Layer Cache Operations</Title>
            
            <Group mb="md">
              <Button 
                onClick={() => handleCacheTest('set')} 
                loading={isLoading}
                variant="filled"
              >
                Set Cache Entry
              </Button>
              <Button 
                onClick={() => handleCacheTest('get')} 
                loading={isLoading}
                variant="outline"
              >
                Get Cache Entry
              </Button>
              <Button 
                onClick={() => handleCacheTest('invalidate')} 
                loading={isLoading}
                color="red"
                variant="light"
              >
                Invalidate Pattern
              </Button>
              <Button 
                onClick={() => handleCacheTest('warm')} 
                loading={isLoading}
                color="blue"
                variant="light"
              >
                Warm Cache
              </Button>
            </Group>

            <Stack gap="md">
              <Card withBorder>
                <Title order={4} mb="sm">Recent Operations</Title>
                {cacheOperations.length === 0 ? (
                  <Text c="dimmed">No operations yet</Text>
                ) : (
                  cacheOperations.map((op, index) => (
                    <Code key={index} block mb="xs">{op}</Code>
                  ))
                )}
              </Card>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="layers" pt="md">
          <Stack gap="md">
            <Card>
              <Title order={3} mb="md">Edge Cache Layer</Title>
              <Text mb="sm">Geographic distribution with replication</Text>
              <Group>
                <Badge color="green">us-east-1</Badge>
                <Badge color="blue">eu-west-1</Badge>
                <Badge color="orange">ap-south-1</Badge>
              </Group>
              <Text mt="sm" size="sm" c="dimmed">
                Replication factor: 2 | TTL: 5 minutes | Compression: Enabled
              </Text>
            </Card>

            <Card>
              <Title order={3} mb="md">Database Cache Layer</Title>
              <Text mb="sm">Persistent storage with SQL-based invalidation</Text>
              <Code block>
                SELECT * FROM cache_entries WHERE cache_key = ? AND expires_at > NOW()
              </Code>
              <Text mt="sm" size="sm" c="dimmed">
                Connection: Redis Cluster | Backup: MySQL | Sharding: Consistent Hash
              </Text>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="invalidation" pt="md">
          <Card>
            <Title order={3} mb="md">Smart Invalidation Rules</Title>
            
            <Stack gap="md">
              <Alert title="Immediate Invalidation" color="red">
                <Text>Pattern: user:* | Triggers: user_update, profile_change</Text>
                <Button 
                  size="xs" 
                  mt="xs"
                  onClick={() => handleCacheTest('invalidate-tag')}
                  loading={isLoading}
                >
                  Trigger user_update
                </Button>
              </Alert>

              <Alert title="Background Invalidation" color="blue">
                <Text>Pattern: page:* | Triggers: content_update</Text>
                <Text size="sm" c="dimmed">
                  Invalidated asynchronously to avoid blocking requests
                </Text>
              </Alert>

              <Alert title="Lazy Invalidation" color="yellow">
                <Text>Pattern: static:* | Strategy: Check on access</Text>
                <Text size="sm" c="dimmed">
                  Validation occurs when cache entry is accessed
                </Text>
              </Alert>
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="metrics" pt="md">
          <Stack gap="md">
            <Card>
              <Title order={3} mb="md">Cache Performance Metrics</Title>
              
              <Group grow>
                <div>
                  <Text size="sm" c="dimmed">Hit Rate</Text>
                  <Progress value={hitRate} color="green" />
                  <Text size="xs" mt="xs">{hitRate.toFixed(1)}%</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Memory Usage</Text>
                  <Progress value={memoryUsage} color={memoryUsage > 80 ? 'red' : 'blue'} />
                  <Text size="xs" mt="xs">{memoryUsage.toFixed(1)}%</Text>
                </div>
              </Group>
            </Card>

            <Group grow>
              <Card withBorder>
                <Text size="sm" c="dimmed">Total Requests</Text>
                <Title order={2}>{metrics.totalRequests}</Title>
              </Card>
              <Card withBorder>
                <Text size="sm" c="dimmed">Cache Hits</Text>
                <Title order={2} c="green">{metrics.hits}</Title>
              </Card>
              <Card withBorder>
                <Text size="sm" c="dimmed">Cache Misses</Text>
                <Title order={2} c="red">{metrics.misses}</Title>
              </Card>
              <Card withBorder>
                <Text size="sm" c="dimmed">Avg Response</Text>
                <Title order={2}>{metrics.avgResponseTime.toFixed(1)}ms</Title>
              </Card>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default DemoCachingStrategies;