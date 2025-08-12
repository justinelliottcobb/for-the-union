import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Group, Button, Card, Stack, Badge, Alert, Code, Tabs, Progress, Switch, Indicator } from '@mantine/core';
import { IconWifiOff, IconWifi, IconDatabase, IconSync, IconCloudOff, IconDeviceFloppy } from '@tabler/icons-react';

// TODO: Install offline-first packages
// npm install @apollo/client apollo3-cache-persist localforage workbox-webpack-plugin

// TODO: Set up offline cache persistence
const offlineSetup = `
import { InMemoryCache } from '@apollo/client';
import { persistCache, LocalForageWrapper } from 'apollo3-cache-persist';
import localforage from 'localforage';

const cache = new InMemoryCache({
  typePolicies: {
    User: {
      fields: {
        posts: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          }
        }
      }
    },
    Post: {
      fields: {
        comments: offsetLimitPagination()
      }
    }
  }
});

// Persist cache to IndexedDB
await persistCache({
  cache,
  storage: new LocalForageWrapper(localforage),
  trigger: 'write',
  debounce: 1000,
  maxSize: 1048576 * 50, // 50 MB
});

// Offline queue for mutations
class OfflineQueue {
  private queue: Array<{
    id: string;
    mutation: any;
    variables: any;
    timestamp: number;
    retryCount: number;
  }> = [];

  async addMutation(mutation: any, variables: any) {
    const item = {
      id: generateId(),
      mutation,
      variables,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    this.queue.push(item);
    await this.persistQueue();
    
    // Try to execute immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue() {
    for (const item of this.queue) {
      try {
        await client.mutate({
          mutation: item.mutation,
          variables: item.variables
        });
        this.removeFromQueue(item.id);
      } catch (error) {
        item.retryCount++;
        if (item.retryCount > 3) {
          this.removeFromQueue(item.id);
        }
      }
    }
  }
}
`;

// Offline status hook
const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Sync when coming back online
        console.log('Back online, syncing...');
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};

// Offline queue hook
const useOfflineQueue = () => {
  const [queuedOperations, setQueuedOperations] = useState<any[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const addToQueue = async (operation: any) => {
    const queueItem = {
      id: Date.now().toString(),
      ...operation,
      timestamp: new Date(),
      status: 'pending'
    };
    
    setQueuedOperations(prev => [...prev, queueItem]);
    
    // Store in local storage
    const stored = localStorage.getItem('offline-queue') || '[]';
    const queue = JSON.parse(stored);
    queue.push(queueItem);
    localStorage.setItem('offline-queue', JSON.stringify(queue));
  };

  const processQueue = async () => {
    if (queuedOperations.length === 0) return;
    
    setIsSyncing(true);
    setSyncProgress(0);
    
    for (let i = 0; i < queuedOperations.length; i++) {
      const operation = queuedOperations[i];
      
      try {
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update progress
        setSyncProgress(((i + 1) / queuedOperations.length) * 100);
        
        // Mark as synced
        setQueuedOperations(prev => 
          prev.map(op => 
            op.id === operation.id 
              ? { ...op, status: 'synced' }
              : op
          )
        );
      } catch (error) {
        // Mark as failed
        setQueuedOperations(prev => 
          prev.map(op => 
            op.id === operation.id 
              ? { ...op, status: 'failed' }
              : op
          )
        );
      }
    }
    
    setIsSyncing(false);
    
    // Clean up synced operations
    setTimeout(() => {
      setQueuedOperations(prev => prev.filter(op => op.status !== 'synced'));
      localStorage.setItem('offline-queue', JSON.stringify(
        queuedOperations.filter(op => op.status !== 'synced')
      ));
    }, 2000);
  };

  return { queuedOperations, addToQueue, processQueue, syncProgress, isSyncing };
};

// Offline data component
const OfflineDataManager: React.FC = () => {
  const [cacheSize, setCacheSize] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Simulate cache size calculation
    setCacheSize(Math.floor(Math.random() * 50) + 10); // 10-60 MB
    setLastSync(new Date(Date.now() - Math.random() * 3600000)); // Random time in last hour
  }, []);

  const clearCache = () => {
    setCacheSize(0);
    // TODO: Clear actual Apollo cache
    // client.cache.reset();
    // localStorage.clear();
  };

  return (
    <Card withBorder p="md">
      <Title order={4} mb="sm">Offline Data Management</Title>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="sm">Cache Size:</Text>
          <Text size="sm" fw={600}>{cacheSize} MB</Text>
        </Group>
        
        <Group justify="space-between">
          <Text size="sm">Last Sync:</Text>
          <Text size="sm" c="dimmed">
            {lastSync ? lastSync.toLocaleString() : 'Never'}
          </Text>
        </Group>
        
        <Group justify="space-between">
          <Text size="sm">Storage Used:</Text>
          <Progress value={(cacheSize / 50) * 100} size="sm" style={{ flex: 1, marginLeft: '10px' }} />
        </Group>
        
        <Group justify="space-between" mt="sm">
          <Button size="xs" variant="outline" onClick={clearCache}>
            Clear Cache
          </Button>
          <Button size="xs" leftSection={<IconSync size={14} />}>
            Force Sync
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

// Offline operations queue component
const OfflineOperationsQueue: React.FC = () => {
  const { queuedOperations, addToQueue, processQueue, syncProgress, isSyncing } = useOfflineQueue();
  const { isOnline } = useOfflineStatus();

  const addDemoOperation = () => {
    addToQueue({
      type: 'CREATE_POST',
      title: 'Offline Post',
      content: 'This post was created while offline',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'synced': return 'green';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Card withBorder p="md">
      <Group justify="space-between" mb="sm">
        <Title order={4}>Offline Queue</Title>
        <Group gap="xs">
          <Button size="xs" onClick={addDemoOperation} disabled={isOnline}>
            Add Operation
          </Button>
          <Button 
            size="xs" 
            leftSection={<IconSync size={14} />}
            onClick={processQueue}
            loading={isSyncing}
            disabled={!isOnline || queuedOperations.length === 0}
          >
            Sync All
          </Button>
        </Group>
      </Group>

      {isSyncing && (
        <Progress value={syncProgress} mb="sm" size="sm" />
      )}

      <Stack gap="xs">
        {queuedOperations.length === 0 ? (
          <Text size="sm" c="dimmed">No queued operations</Text>
        ) : (
          queuedOperations.map(operation => (
            <Card key={operation.id} padding="xs" withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="sm" fw={600}>{operation.type}</Text>
                  <Text size="xs" c="dimmed">
                    {operation.timestamp.toLocaleTimeString()}
                  </Text>
                </div>
                <Badge color={getStatusColor(operation.status)} size="sm">
                  {operation.status}
                </Badge>
              </Group>
            </Card>
          ))
        )}
      </Stack>
    </Card>
  );
};

// Conflict resolution component
const ConflictResolution: React.FC = () => {
  const [conflicts, setConflicts] = useState([
    {
      id: '1',
      type: 'UPDATE_POST',
      localVersion: { title: 'My Offline Edit', updatedAt: '2023-01-01T10:00:00Z' },
      serverVersion: { title: 'Server Edit', updatedAt: '2023-01-01T10:05:00Z' },
      resolved: false
    }
  ]);

  const resolveConflict = (conflictId: string, resolution: 'local' | 'server' | 'merge') => {
    setConflicts(prev => 
      prev.map(conflict => 
        conflict.id === conflictId 
          ? { ...conflict, resolved: true, resolution }
          : conflict
      )
    );
  };

  return (
    <Card withBorder p="md">
      <Title order={4} mb="sm">Conflict Resolution</Title>
      
      {conflicts.filter(c => !c.resolved).length === 0 ? (
        <Text size="sm" c="dimmed">No conflicts to resolve</Text>
      ) : (
        <Stack gap="sm">
          {conflicts
            .filter(conflict => !conflict.resolved)
            .map(conflict => (
              <Card key={conflict.id} padding="sm" withBorder>
                <Text size="sm" fw={600} mb="xs">
                  Post Update Conflict
                </Text>
                
                <Group grow mb="sm">
                  <Card padding="xs" bg="blue.0">
                    <Text size="xs" fw={600} c="blue">Local Version</Text>
                    <Text size="xs">{conflict.localVersion.title}</Text>
                    <Text size="xs" c="dimmed">
                      {new Date(conflict.localVersion.updatedAt).toLocaleString()}
                    </Text>
                  </Card>
                  
                  <Card padding="xs" bg="orange.0">
                    <Text size="xs" fw={600} c="orange">Server Version</Text>
                    <Text size="xs">{conflict.serverVersion.title}</Text>
                    <Text size="xs" c="dimmed">
                      {new Date(conflict.serverVersion.updatedAt).toLocaleString()}
                    </Text>
                  </Card>
                </Group>
                
                <Group gap="xs">
                  <Button 
                    size="xs" 
                    variant="outline"
                    onClick={() => resolveConflict(conflict.id, 'local')}
                  >
                    Use Local
                  </Button>
                  <Button 
                    size="xs" 
                    variant="outline"
                    onClick={() => resolveConflict(conflict.id, 'server')}
                  >
                    Use Server
                  </Button>
                  <Button 
                    size="xs" 
                    color="green"
                    onClick={() => resolveConflict(conflict.id, 'merge')}
                  >
                    Merge Both
                  </Button>
                </Group>
              </Card>
            ))}
        </Stack>
      )}
    </Card>
  );
};

// Network status indicator
const NetworkStatus: React.FC = () => {
  const { isOnline, wasOffline } = useOfflineStatus();
  
  return (
    <Group gap="xs">
      <Indicator color={isOnline ? 'green' : 'red'} size={8}>
        <Badge 
          color={isOnline ? 'green' : 'red'} 
          variant="light" 
          leftSection={isOnline ? <IconWifi size={12} /> : <IconWifiOff size={12} />}
        >
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
      </Indicator>
      {wasOffline && isOnline && (
        <Badge color="blue" variant="light" leftSection={<IconSync size={12} />}>
          Syncing...
        </Badge>
      )}
    </Group>
  );
};

// Offline simulator
const OfflineSimulator: React.FC = () => {
  const [simulateOffline, setSimulateOffline] = useState(false);

  useEffect(() => {
    // Override navigator.onLine for simulation
    if (simulateOffline) {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      window.dispatchEvent(new Event('offline'));
    } else {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      window.dispatchEvent(new Event('online'));
    }
  }, [simulateOffline]);

  return (
    <Card withBorder p="md" bg="gray.0">
      <Group justify="space-between">
        <div>
          <Text fw={600} size="sm">Offline Mode Simulator</Text>
          <Text size="xs" c="dimmed">Toggle to test offline functionality</Text>
        </div>
        <Switch
          checked={simulateOffline}
          onChange={(event) => setSimulateOffline(event.currentTarget.checked)}
          label={simulateOffline ? 'Go Online' : 'Go Offline'}
        />
      </Group>
    </Card>
  );
};

export default function OfflineFirstExercise() {
  const [selectedTab, setSelectedTab] = useState<string | null>('overview');

  return (
    <Container size="lg">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} mb="xs">Exercise 23: Offline-first GraphQL</Title>
          <Text c="dimmed">Build resilient applications that work without internet</Text>
        </div>
        <Group>
          <Badge color="blue" variant="light" size="lg">
            Advanced Patterns
          </Badge>
          <NetworkStatus />
        </Group>
      </Group>

      <Tabs value={selectedTab} onChange={setSelectedTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconCloudOff size={16} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="setup" leftSection={<IconDatabase size={16} />}>
            Setup
          </Tabs.Tab>
          <Tabs.Tab value="demo" leftSection={<IconDeviceFloppy size={16} />}>
            Offline Demo
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <Stack gap="md">
            <Alert icon={<IconCloudOff />} color="orange">
              <Text fw={600}>Exercise Objective</Text>
              <Text size="sm">
                Build offline-first GraphQL applications with cache persistence, 
                operation queuing, conflict resolution, and seamless online/offline transitions.
              </Text>
            </Alert>

            <Card withBorder p="md">
              <Title order={4} mb="sm">Offline-first Features</Title>
              <Stack gap="xs">
                <Text size="sm">• <strong>Cache Persistence:</strong> Store GraphQL cache in IndexedDB</Text>
                <Text size="sm">• <strong>Operation Queue:</strong> Queue mutations when offline</Text>
                <Text size="sm">• <strong>Conflict Resolution:</strong> Handle data conflicts intelligently</Text>
                <Text size="sm">• <strong>Optimistic Updates:</strong> Instant UI feedback</Text>
                <Text size="sm">• <strong>Background Sync:</strong> Sync when connection returns</Text>
              </Stack>
            </Card>

            <Card withBorder p="md">
              <Title order={4} mb="sm">Offline Architecture Benefits</Title>
              <Stack gap="xs">
                <Text size="sm">• Improved user experience in poor connectivity</Text>
                <Text size="sm">• Reduced server load through intelligent caching</Text>
                <Text size="sm">• Better performance with local-first operations</Text>
                <Text size="sm">• Data consistency across devices</Text>
                <Text size="sm">• Resilient to network failures</Text>
              </Stack>
            </Card>

            <OfflineSimulator />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="setup" pt="md">
          <Stack gap="md">
            <Card withBorder p="md">
              <Title order={4} mb="sm">Offline Cache Setup</Title>
              <Code block>{offlineSetup}</Code>
            </Card>

            <Alert icon={<IconDatabase />} color="blue">
              <Text fw={600}>Storage Strategy</Text>
              <Text size="sm">
                • IndexedDB for cache persistence (50MB+)<br/>
                • LocalStorage for offline queue (5MB)<br/>
                • Service Worker for background sync<br/>
                • WebSQL fallback for older browsers
              </Text>
            </Alert>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="demo" pt="md">
          <Stack gap="md">
            <Group align="flex-start">
              <div style={{ flex: 1 }}>
                <OfflineDataManager />
              </div>
              <div style={{ flex: 1 }}>
                <OfflineOperationsQueue />
              </div>
            </Group>

            <ConflictResolution />

            <Alert icon={<IconSync />} color="green">
              <Text fw={600}>Try It Out</Text>
              <Text size="sm">
                1. Use the simulator to go offline<br/>
                2. Add operations to the queue<br/>
                3. Go back online to see automatic sync<br/>
                4. Observe conflict resolution in action
              </Text>
            </Alert>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}