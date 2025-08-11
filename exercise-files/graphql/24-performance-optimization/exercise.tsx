import React, { useState, useEffect, useMemo } from 'react';
import { Container, Title, Text, Group, Button, Card, Stack, Badge, Alert, Code, Tabs, Progress, Table, Select } from '@mantine/core';
import { IconRocket, IconGraph, IconClock, IconDashboard, IconZoom, IconBolt } from '@tabler/icons-react';

// TODO: Install performance optimization packages
// npm install @apollo/client dataloader graphql-query-complexity graphql-depth-limit

// TODO: Set up query batching and optimization
const performanceSetup = `
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { RetryLink } from '@apollo/client/link/retry';
import { setContext } from '@apollo/client/link/context';

// Batched HTTP Link for query batching
const batchLink = new BatchHttpLink({
  uri: 'http://localhost:4000/graphql',
  batchMax: 10, // Maximum queries per batch
  batchInterval: 20, // Wait 20ms to collect queries
  batchKey: (operation) => {
    // Group by query complexity or priority
    const complexity = operation.getContext().complexity || 1;
    return complexity > 5 ? 'complex' : 'simple';
  }
});

// Performance monitoring link
const performanceLink = setContext((_, { headers }) => {
  const startTime = performance.now();
  
  return {
    headers: {
      ...headers,
      'x-query-start-time': startTime.toString()
    },
    startTime
  };
});

// Cache with optimized type policies
const cache = new InMemoryCache({
  typePolicies: {
    User: {
      keyFields: ['id'],
      fields: {
        posts: {
          merge(existing = [], incoming, { args, readField }) {
            // Efficient pagination merge
            return paginationMerge(existing, incoming, args);
          }
        }
      }
    },
    Post: {
      fields: {
        comments: offsetLimitPagination(['postId']),
        likes: {
          merge: false // Don't merge, replace entirely
        }
      }
    },
    Query: {
      fields: {
        searchPosts: {
          keyArgs: ['query', 'filters'],
          merge(existing, incoming, { args }) {
            // Smart search result merging
            if (args?.offset === 0) {
              return incoming;
            }
            return existing ? [...existing, ...incoming] : incoming;
          }
        }
      }
    }
  },
  // Enable result caching
  resultCaching: true,
  // Optimize garbage collection
  possibleTypes: {
    // Define possible types for union/interface optimization
    SearchResult: ['Post', 'User', 'Comment'],
    NotificationTarget: ['Post', 'Comment', 'User']
  }
});

// Client with performance optimizations
const client = new ApolloClient({
  link: from([
    performanceLink,
    new RetryLink({
      delay: {
        initial: 300,
        max: Infinity,
        jitter: true
      },
      attempts: {
        max: 3,
        retryIf: (error, _operation) => !!error && error.networkError?.statusCode !== 401
      }
    }),
    batchLink
  ]),
  cache,
  // Performance settings
  queryDeduplication: true,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'partial',
      notifyOnNetworkStatusChange: false
    },
    query: {
      errorPolicy: 'partial'
    }
  }
});
`;

// Performance monitoring hook
const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    queryCount: 0,
    avgResponseTime: 0,
    cacheHitRate: 0,
    networkRequests: 0,
    errors: 0
  });

  const [realtimeMetrics, setRealtimeMetrics] = useState<any[]>([]);

  useEffect(() => {
    // Simulate performance data collection
    const interval = setInterval(() => {
      const newMetric = {
        timestamp: Date.now(),
        responseTime: Math.random() * 500 + 50, // 50-550ms
        cacheHit: Math.random() > 0.3, // 70% cache hit rate
        queryComplexity: Math.floor(Math.random() * 10) + 1,
        operation: ['GetUsers', 'GetPosts', 'SearchContent'][Math.floor(Math.random() * 3)]
      };

      setRealtimeMetrics(prev => [...prev.slice(-19), newMetric]);

      setMetrics(prev => ({
        queryCount: prev.queryCount + 1,
        avgResponseTime: (prev.avgResponseTime * prev.queryCount + newMetric.responseTime) / (prev.queryCount + 1),
        cacheHitRate: newMetric.cacheHit ? (prev.cacheHitRate * prev.queryCount + 100) / (prev.queryCount + 1) : (prev.cacheHitRate * prev.queryCount) / (prev.queryCount + 1),
        networkRequests: newMetric.cacheHit ? prev.networkRequests : prev.networkRequests + 1,
        errors: Math.random() > 0.95 ? prev.errors + 1 : prev.errors
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { metrics, realtimeMetrics };
};

// Query batching simulator
const QueryBatchingDemo: React.FC = () => {
  const [batchedQueries, setBatchedQueries] = useState<any[]>([]);
  const [isBatching, setIsBatching] = useState(false);

  const simulateQuery = (queryName: string) => {
    const query = {
      id: Date.now().toString(),
      name: queryName,
      timestamp: Date.now(),
      status: 'batching',
      complexity: Math.floor(Math.random() * 5) + 1
    };

    setBatchedQueries(prev => [...prev, query]);

    // Simulate batch processing
    setTimeout(() => {
      setBatchedQueries(prev => 
        prev.map(q => q.id === query.id ? { ...q, status: 'executing' } : q)
      );
    }, 100);

    setTimeout(() => {
      setBatchedQueries(prev => 
        prev.map(q => q.id === query.id ? { ...q, status: 'completed', responseTime: Math.random() * 200 + 50 } : q)
      );
    }, 500);
  };

  const processBatch = () => {
    setIsBatching(true);
    const pendingQueries = batchedQueries.filter(q => q.status === 'batching');
    
    pendingQueries.forEach(query => {
      setBatchedQueries(prev => 
        prev.map(q => q.id === query.id ? { ...q, status: 'executing' } : q)
      );
    });

    setTimeout(() => {
      setBatchedQueries(prev => 
        prev.map(q => 
          pendingQueries.some(pq => pq.id === q.id) 
            ? { ...q, status: 'completed', responseTime: Math.random() * 300 + 100 }
            : q
        )
      );
      setIsBatching(false);
    }, 800);
  };

  return (
    <Card withBorder p="md">
      <Group justify="space-between" mb="sm">
        <Title order={4}>Query Batching</Title>
        <Group gap="xs">
          <Button size="xs" onClick={() => simulateQuery('GetUser')}>
            Add User Query
          </Button>
          <Button size="xs" onClick={() => simulateQuery('GetPosts')}>
            Add Posts Query
          </Button>
          <Button size="xs" onClick={processBatch} loading={isBatching}>
            Process Batch
          </Button>
        </Group>
      </Group>

      <Stack gap="xs">
        {batchedQueries.length === 0 ? (
          <Text size="sm" c="dimmed">No queries in batch</Text>
        ) : (
          batchedQueries.slice(-5).map(query => (
            <Card key={query.id} padding="xs" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="sm" fw={600}>{query.name}</Text>
                  <Text size="xs" c="dimmed">
                    Complexity: {query.complexity} | {new Date(query.timestamp).toLocaleTimeString()}
                  </Text>
                </div>
                <Badge color={
                  query.status === 'batching' ? 'yellow' :
                  query.status === 'executing' ? 'blue' : 'green'
                }>
                  {query.status}
                  {query.responseTime && ` (${Math.round(query.responseTime)}ms)`}
                </Badge>
              </Group>
            </Card>
          ))
        )}
      </Stack>
    </Card>
  );
};

// Cache optimization panel
const CacheOptimization: React.FC = () => {
  const [cacheStats, setCacheStats] = useState({
    size: '12.4 MB',
    entries: 1247,
    hitRate: 73,
    evictions: 42
  });

  const [optimizations, setOptimizations] = useState([
    { name: 'Fragment Deduplication', enabled: true, savings: '15%' },
    { name: 'Query Result Normalization', enabled: true, savings: '23%' },
    { name: 'Automatic Cache Eviction', enabled: false, savings: '8%' },
    { name: 'Partial Query Matching', enabled: true, savings: '12%' }
  ]);

  const toggleOptimization = (index: number) => {
    setOptimizations(prev => 
      prev.map((opt, i) => 
        i === index ? { ...opt, enabled: !opt.enabled } : opt
      )
    );
  };

  return (
    <Card withBorder p="md">
      <Title order={4} mb="sm">Cache Optimization</Title>
      
      <Group grow mb="md">
        <Card padding="xs" bg="blue.0">
          <Text size="xs" fw={600} c="blue">Cache Size</Text>
          <Text size="lg" fw={700}>{cacheStats.size}</Text>
        </Card>
        <Card padding="xs" bg="green.0">
          <Text size="xs" fw={600} c="green">Hit Rate</Text>
          <Text size="lg" fw={700}>{cacheStats.hitRate}%</Text>
        </Card>
        <Card padding="xs" bg="orange.0">
          <Text size="xs" fw={600} c="orange">Entries</Text>
          <Text size="lg" fw={700}>{cacheStats.entries}</Text>
        </Card>
      </Group>

      <Stack gap="xs">
        <Text size="sm" fw={600}>Active Optimizations:</Text>
        {optimizations.map((opt, index) => (
          <Card key={opt.name} padding="xs" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" fw={600}>{opt.name}</Text>
                <Text size="xs" c="dimmed">Memory savings: {opt.savings}</Text>
              </div>
              <Button
                size="xs"
                variant={opt.enabled ? 'filled' : 'outline'}
                color={opt.enabled ? 'green' : 'gray'}
                onClick={() => toggleOptimization(index)}
              >
                {opt.enabled ? 'Enabled' : 'Disabled'}
              </Button>
            </Group>
          </Card>
        ))}
      </Stack>
    </Card>
  );
};

// Performance metrics dashboard
const PerformanceDashboard: React.FC = () => {
  const { metrics, realtimeMetrics } = usePerformanceMonitor();

  const chartData = useMemo(() => {
    return realtimeMetrics.map((metric, index) => ({
      x: index,
      responseTime: metric.responseTime,
      cacheHit: metric.cacheHit ? 100 : 0,
      complexity: metric.queryComplexity * 10
    }));
  }, [realtimeMetrics]);

  return (
    <Card withBorder p="md">
      <Title order={4} mb="sm">Performance Dashboard</Title>
      
      <Group grow mb="md">
        <Card padding="xs" bg="blue.0">
          <Text size="xs" fw={600} c="blue">Avg Response Time</Text>
          <Text size="lg" fw={700}>{Math.round(metrics.avgResponseTime)}ms</Text>
        </Card>
        <Card padding="xs" bg="green.0">
          <Text size="xs" fw={600} c="green">Cache Hit Rate</Text>
          <Text size="lg" fw={700}>{Math.round(metrics.cacheHitRate)}%</Text>
        </Card>
        <Card padding="xs" bg="orange.0">
          <Text size="xs" fw={600} c="orange">Total Queries</Text>
          <Text size="lg" fw={700}>{metrics.queryCount}</Text>
        </Card>
      </Group>

      <Card withBorder padding="xs" mb="sm">
        <Text size="sm" fw={600} mb="xs">Response Time Trend</Text>
        <div style={{ height: '100px', background: 'linear-gradient(45deg, #e3f2fd, #bbdefb)', borderRadius: '4px', display: 'flex', alignItems: 'end', padding: '8px' }}>
          {chartData.slice(-10).map((data, index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: `${(data.responseTime / 500) * 80}px`,
                backgroundColor: data.cacheHit > 0 ? '#4caf50' : '#ff9800',
                margin: '0 1px',
                borderRadius: '2px 2px 0 0'
              }}
            />
          ))}
        </div>
      </Card>

      <Alert icon={<IconRocket />} color="blue">
        <Text fw={600}>Performance Tips</Text>
        <Text size="sm">
          • Use query batching for multiple concurrent requests<br/>
          • Implement field-level caching for frequently accessed data<br/>
          • Enable query deduplication to prevent duplicate requests<br/>
          • Use fragment caching for reusable data patterns
        </Text>
      </Alert>
    </Card>
  );
};

// Query complexity analyzer
const QueryComplexityAnalyzer: React.FC = () => {
  const [selectedQuery, setSelectedQuery] = useState<string | null>('getUserWithPosts');
  
  const queries = {
    'getUserWithPosts': {
      name: 'Get User With Posts',
      complexity: 15,
      depth: 4,
      fields: 23,
      cost: 'Medium',
      optimizations: ['Use fragments', 'Limit post fields', 'Add pagination']
    },
    'searchContent': {
      name: 'Search Content',
      complexity: 28,
      depth: 3,
      fields: 31,
      cost: 'High',
      optimizations: ['Add search indexing', 'Use cursor pagination', 'Limit result size']
    },
    'getPostComments': {
      name: 'Get Post Comments',
      complexity: 8,
      depth: 2,
      fields: 12,
      cost: 'Low',
      optimizations: ['Already optimized', 'Consider comment threading']
    }
  };

  const selectedQueryData = selectedQuery ? queries[selectedQuery as keyof typeof queries] : null;

  return (
    <Card withBorder p="md">
      <Title order={4} mb="sm">Query Complexity Analysis</Title>
      
      <Select
        value={selectedQuery}
        onChange={setSelectedQuery}
        data={Object.entries(queries).map(([key, query]) => ({
          value: key,
          label: query.name
        }))}
        mb="md"
      />

      {selectedQueryData && (
        <Stack gap="md">
          <Group grow>
            <Card padding="xs" bg="red.0">
              <Text size="xs" fw={600} c="red">Complexity Score</Text>
              <Text size="lg" fw={700}>{selectedQueryData.complexity}</Text>
            </Card>
            <Card padding="xs" bg="orange.0">
              <Text size="xs" fw={600} c="orange">Query Depth</Text>
              <Text size="lg" fw={700}>{selectedQueryData.depth}</Text>
            </Card>
            <Card padding="xs" bg="blue.0">
              <Text size="xs" fw={600} c="blue">Field Count</Text>
              <Text size="lg" fw={700}>{selectedQueryData.fields}</Text>
            </Card>
          </Group>

          <Progress 
            value={(selectedQueryData.complexity / 50) * 100} 
            color={selectedQueryData.complexity > 20 ? 'red' : selectedQueryData.complexity > 10 ? 'orange' : 'green'}
            size="lg"
            label={`${selectedQueryData.cost} Cost`}
          />

          <Card withBorder padding="sm">
            <Text size="sm" fw={600} mb="xs">Optimization Suggestions:</Text>
            <Stack gap="xs">
              {selectedQueryData.optimizations.map((suggestion, index) => (
                <Text key={index} size="sm">• {suggestion}</Text>
              ))}
            </Stack>
          </Card>
        </Stack>
      )}
    </Card>
  );
};

export default function PerformanceOptimizationExercise() {
  const [selectedTab, setSelectedTab] = useState<string | null>('overview');

  return (
    <Container size="lg">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} mb="xs">Exercise 24: Performance Optimization</Title>
          <Text c="dimmed">Master GraphQL performance tuning and query optimization</Text>
        </div>
        <Badge color="blue" variant="light" size="lg">
          Advanced Patterns
        </Badge>
      </Group>

      <Tabs value={selectedTab} onChange={setSelectedTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconRocket size={16} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="setup" leftSection={<IconGraph size={16} />}>
            Setup
          </Tabs.Tab>
          <Tabs.Tab value="dashboard" leftSection={<IconDashboard size={16} />}>
            Live Dashboard
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <Stack gap="md">
            <Alert icon={<IconBolt />} color="orange">
              <Text fw={600}>Exercise Objective</Text>
              <Text size="sm">
                Master GraphQL performance optimization through query batching, caching strategies, 
                complexity analysis, and real-time monitoring for production-ready applications.
              </Text>
            </Alert>

            <Card withBorder p="md">
              <Title order={4} mb="sm">Performance Optimization Areas</Title>
              <Stack gap="xs">
                <Text size="sm">• <strong>Query Batching:</strong> Combine multiple queries into single requests</Text>
                <Text size="sm">• <strong>Cache Optimization:</strong> Intelligent caching and invalidation strategies</Text>
                <Text size="sm">• <strong>Complexity Analysis:</strong> Monitor and limit query complexity</Text>
                <Text size="sm">• <strong>Field-level Performance:</strong> Optimize individual field resolvers</Text>
                <Text size="sm">• <strong>Network Optimization:</strong> Reduce payload size and request count</Text>
              </Stack>
            </Card>

            <Card withBorder p="md">
              <Title order={4} mb="sm">Monitoring & Analytics</Title>
              <Stack gap="xs">
                <Text size="sm">• Real-time performance metrics and dashboards</Text>
                <Text size="sm">• Query complexity scoring and analysis</Text>
                <Text size="sm">• Cache hit rates and memory usage tracking</Text>
                <Text size="sm">• Network latency and error rate monitoring</Text>
                <Text size="sm">• Automated performance alerts and optimization suggestions</Text>
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="setup" pt="md">
          <Stack gap="md">
            <Card withBorder p="md">
              <Title order={4} mb="sm">Performance Setup Configuration</Title>
              <Code block>{performanceSetup}</Code>
            </Card>

            <Alert icon={<IconClock />} color="green">
              <Text fw={600}>Optimization Strategies</Text>
              <Text size="sm">
                • Query deduplication prevents duplicate requests<br/>
                • Batch HTTP link combines queries efficiently<br/>
                • Result caching reduces computation overhead<br/>
                • Smart type policies optimize cache operations
              </Text>
            </Alert>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="dashboard" pt="md">
          <Stack gap="md">
            <Group align="flex-start">
              <div style={{ flex: 1 }}>
                <PerformanceDashboard />
              </div>
              <div style={{ flex: 1 }}>
                <QueryBatchingDemo />
              </div>
            </Group>

            <Group align="flex-start">
              <div style={{ flex: 1 }}>
                <CacheOptimization />
              </div>
              <div style={{ flex: 1 }}>
                <QueryComplexityAnalyzer />
              </div>
            </Group>

            <Alert icon={<IconZoom />} color="blue">
              <Text fw={600}>Performance Monitoring Active</Text>
              <Text size="sm">
                This dashboard shows real-time GraphQL performance metrics. In production,
                connect these components to your actual Apollo Client and monitoring infrastructure
                for comprehensive performance tracking and optimization.
              </Text>
            </Alert>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}