import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Text, Group, Stack, Badge, Progress, Alert, Tabs, JsonInput, Select, NumberInput } from '@mantine/core';

// ===== DATABASE TESTING FRAMEWORK =====

interface DatabaseConfiguration {
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb';
  version: string;
  host: string;
  port: number;
  database: string;
  credentials: DatabaseCredentials;
  pooling: PoolingConfig;
}

interface DatabaseCredentials {
  username: string;
  password: string;
  ssl?: boolean;
}

interface PoolingConfig {
  min: number;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

interface TestContainer {
  id: string;
  database: DatabaseConfiguration;
  status: 'starting' | 'ready' | 'error' | 'stopped';
  health: ContainerHealth;
  performance: ContainerPerformance;
}

interface ContainerHealth {
  connected: boolean;
  latency: number;
  lastCheck: string;
  errorCount: number;
}

interface ContainerPerformance {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  connectionCount: number;
}

// Database Test Runner - Comprehensive Testing Framework
const DatabaseTestRunner: React.FC = () => {
  const [containers, setContainers] = useState<TestContainer[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const createContainer = useCallback((type: DatabaseConfiguration['type']) => {
    const config: DatabaseConfiguration = {
      type,
      version: type === 'postgresql' ? '14' : type === 'mysql' ? '8.0' : '3.9',
      host: 'localhost',
      port: type === 'postgresql' ? 5432 : type === 'mysql' ? 3306 : 27017,
      database: `test_db_${Date.now()}`,
      credentials: {
        username: 'test_user',
        password: 'test_pass',
        ssl: false
      },
      pooling: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 2000
      }
    };

    const container: TestContainer = {
      id: `container_${Date.now()}`,
      database: config,
      status: 'starting',
      health: {
        connected: false,
        latency: 0,
        lastCheck: new Date().toISOString(),
        errorCount: 0
      },
      performance: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        connectionCount: 0
      }
    };

    setContainers(prev => [...prev, container]);

    // Simulate container startup and health checks
    setTimeout(() => {
      setContainers(prev => prev.map(c => 
        c.id === container.id 
          ? {
              ...c,
              status: 'ready',
              health: {
                connected: true,
                latency: Math.floor(Math.random() * 50) + 10,
                lastCheck: new Date().toISOString(),
                errorCount: 0
              },
              performance: {
                cpuUsage: Math.floor(Math.random() * 30) + 10,
                memoryUsage: Math.floor(Math.random() * 40) + 20,
                diskUsage: Math.floor(Math.random() * 20) + 5,
                connectionCount: Math.floor(Math.random() * 5) + 2
              }
            }
          : c
      ));
    }, 2000);

    return container;
  }, []);

  const runDatabaseTests = useCallback(async (container: TestContainer) => {
    setIsRunning(true);

    // Simulate comprehensive database testing
    await new Promise(resolve => setTimeout(resolve, 3000));

    const testResults = [
      {
        name: 'Connection Pool Test',
        status: Math.random() > 0.1 ? 'passed' : 'failed',
        duration: Math.floor(Math.random() * 500) + 100,
        details: 'Connection pooling with concurrent connections'
      },
      {
        name: 'Transaction Isolation Test',
        status: Math.random() > 0.15 ? 'passed' : 'failed',
        duration: Math.floor(Math.random() * 800) + 200,
        details: 'Read committed isolation with rollback testing'
      },
      {
        name: 'Data Integrity Test',
        status: Math.random() > 0.05 ? 'passed' : 'failed',
        duration: Math.floor(Math.random() * 600) + 150,
        details: 'Foreign key constraints and referential integrity'
      },
      {
        name: 'Performance Benchmark',
        status: Math.random() > 0.2 ? 'passed' : 'failed',
        duration: Math.floor(Math.random() * 1200) + 300,
        details: 'Query performance with indexed and non-indexed operations'
      }
    ];

    const result = {
      containerId: container.id,
      database: container.database.type,
      testSuite: 'Database Integration Tests',
      tests: testResults,
      summary: {
        total: testResults.length,
        passed: testResults.filter(t => t.status === 'passed').length,
        failed: testResults.filter(t => t.status === 'failed').length,
        duration: testResults.reduce((sum, t) => sum + t.duration, 0)
      },
      timestamp: new Date().toISOString()
    };

    setTestResults(prev => [...prev, result]);
    setIsRunning(false);
  }, []);

  const stopContainer = useCallback((containerId: string) => {
    setContainers(prev => prev.map(c => 
      c.id === containerId 
        ? { ...c, status: 'stopped', health: { ...c.health, connected: false } }
        : c
    ));
  }, []);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>Database Test Runner</Text>
          <Group>
            <Button 
              onClick={() => createContainer('postgresql')}
              variant="light"
              size="sm"
            >
              PostgreSQL
            </Button>
            <Button 
              onClick={() => createContainer('mysql')}
              variant="light"
              size="sm"
            >
              MySQL
            </Button>
            <Button 
              onClick={() => createContainer('mongodb')}
              variant="light"
              size="sm"
            >
              MongoDB
            </Button>
          </Group>
        </Group>

        {containers.map((container, index) => (
          <Card key={index} withBorder>
            <Group justify="apart" mb="md">
              <Group>
                <Text fw={500}>{container.database.type.toUpperCase()}</Text>
                <Badge color={
                  container.status === 'ready' ? 'green' : 
                  container.status === 'starting' ? 'blue' : 
                  container.status === 'error' ? 'red' : 'gray'
                }>
                  {container.status}
                </Badge>
              </Group>
              <Group>
                <Button 
                  onClick={() => runDatabaseTests(container)}
                  disabled={container.status !== 'ready' || isRunning}
                  size="sm"
                  loading={isRunning}
                >
                  Run Tests
                </Button>
                <Button 
                  onClick={() => stopContainer(container.id)}
                  color="red"
                  variant="light"
                  size="sm"
                >
                  Stop
                </Button>
              </Group>
            </Group>

            <Group mb="sm" grow>
              <div>
                <Text size="xs" c="dimmed">Latency</Text>
                <Text size="sm">{container.health.latency}ms</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">CPU</Text>
                <Text size="sm">{container.performance.cpuUsage}%</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Memory</Text>
                <Text size="sm">{container.performance.memoryUsage}%</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Connections</Text>
                <Text size="sm">{container.performance.connectionCount}</Text>
              </div>
            </Group>

            <Progress 
              value={container.performance.cpuUsage} 
              size="sm" 
              color={container.performance.cpuUsage > 80 ? 'red' : 'blue'} 
            />
          </Card>
        ))}

        {testResults.map((result, index) => (
          <Alert key={index} color={result.summary.failed > 0 ? 'orange' : 'green'}>
            <Group justify="apart" mb="sm">
              <Text fw={500}>
                {result.database.toUpperCase()} Test Results
              </Text>
              <Badge>
                {result.summary.passed}/{result.summary.total} passed
              </Badge>
            </Group>
            <Stack gap="xs">
              {result.tests.map((test: any, idx: number) => (
                <Group key={idx} justify="apart">
                  <Text size="sm">{test.name}</Text>
                  <Group>
                    <Badge 
                      size="xs" 
                      color={test.status === 'passed' ? 'green' : 'red'}
                    >
                      {test.status}
                    </Badge>
                    <Text size="xs" c="dimmed">{test.duration}ms</Text>
                  </Group>
                </Group>
              ))}
            </Stack>
            <Text size="xs" c="dimmed" mt="sm">
              Total Duration: {result.summary.duration}ms
            </Text>
          </Alert>
        ))}
      </Stack>
    </Card>
  );
};

// ===== DATA SEEDING MANAGEMENT =====

interface SeedData {
  table: string;
  records: Record<string, any>[];
  relationships: RelationshipConfig[];
  constraints: DataConstraint[];
}

interface RelationshipConfig {
  field: string;
  references: {
    table: string;
    field: string;
  };
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

interface DataConstraint {
  field: string;
  constraint: 'unique' | 'not-null' | 'foreign-key' | 'check';
  value?: any;
}

interface DataFactory {
  name: string;
  model: string;
  generator: () => Record<string, any>;
  relationships: string[];
  count: number;
}

const SeedDataManager: React.FC = () => {
  const [factories, setFactories] = useState<DataFactory[]>([]);
  const [seedData, setSeedData] = useState<SeedData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const createUserFactory = useCallback(() => {
    const factory: DataFactory = {
      name: 'User Factory',
      model: 'users',
      generator: () => ({
        id: Math.floor(Math.random() * 10000),
        name: `User ${Math.floor(Math.random() * 1000)}`,
        email: `user${Math.floor(Math.random() * 1000)}@example.com`,
        created_at: new Date().toISOString(),
        status: Math.random() > 0.2 ? 'active' : 'inactive'
      }),
      relationships: ['orders', 'preferences'],
      count: 100
    };

    setFactories(prev => [...prev, factory]);
  }, []);

  const createOrderFactory = useCallback(() => {
    const factory: DataFactory = {
      name: 'Order Factory',
      model: 'orders',
      generator: () => ({
        id: Math.floor(Math.random() * 10000),
        user_id: Math.floor(Math.random() * 100) + 1,
        amount: Math.floor(Math.random() * 1000) + 10,
        status: ['pending', 'completed', 'cancelled'][Math.floor(Math.random() * 3)],
        created_at: new Date().toISOString()
      }),
      relationships: ['users', 'order_items'],
      count: 500
    };

    setFactories(prev => [...prev, factory]);
  }, []);

  const generateSeedData = useCallback(async () => {
    setIsGenerating(true);

    // Simulate data generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const generatedData: SeedData[] = factories.map(factory => {
      const records = Array.from({ length: factory.count }, () => factory.generator());
      
      return {
        table: factory.model,
        records,
        relationships: [
          {
            field: factory.model === 'orders' ? 'user_id' : 'id',
            references: {
              table: factory.model === 'orders' ? 'users' : 'orders',
              field: 'id'
            },
            type: factory.model === 'orders' ? 'many-to-one' : 'one-to-many'
          }
        ],
        constraints: [
          { field: 'id', constraint: 'unique' },
          { field: 'id', constraint: 'not-null' },
          ...(factory.model === 'users' 
            ? [{ field: 'email', constraint: 'unique' }]
            : [{ field: 'user_id', constraint: 'foreign-key' }]
          )
        ]
      };
    });

    setSeedData(generatedData);
    setIsGenerating(false);
  }, [factories]);

  const validateData = useCallback((data: SeedData) => {
    // Simulate data validation
    const issues = [];
    
    // Check for duplicate IDs
    const ids = data.records.map(r => r.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      issues.push(`Duplicate IDs found: ${duplicateIds.join(', ')}`);
    }

    // Check referential integrity
    if (data.table === 'orders') {
      const userIds = seedData.find(d => d.table === 'users')?.records.map(r => r.id) || [];
      const invalidUserIds = data.records
        .map(r => r.user_id)
        .filter(userId => !userIds.includes(userId));
      
      if (invalidUserIds.length > 0) {
        issues.push(`Invalid user references: ${invalidUserIds.length} orders`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      recordCount: data.records.length
    };
  }, [seedData]);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>Seed Data Manager</Text>
          <Group>
            <Button onClick={createUserFactory} variant="light" size="sm">
              User Factory
            </Button>
            <Button onClick={createOrderFactory} variant="light" size="sm">
              Order Factory
            </Button>
            <Button 
              onClick={generateSeedData}
              disabled={factories.length === 0}
              loading={isGenerating}
            >
              Generate Data
            </Button>
          </Group>
        </Group>

        {factories.map((factory, index) => (
          <Card key={index} withBorder>
            <Group justify="apart" mb="md">
              <Text fw={500}>{factory.name}</Text>
              <Badge>{factory.count} records</Badge>
            </Group>
            
            <Text size="sm" c="dimmed" mb="sm">
              Model: {factory.model}
            </Text>
            
            <Group mb="sm">
              <Text size="sm">Relationships:</Text>
              {factory.relationships.map((rel, idx) => (
                <Badge key={idx} variant="light" size="sm">
                  {rel}
                </Badge>
              ))}
            </Group>
          </Card>
        ))}

        {seedData.map((data, index) => {
          const validation = validateData(data);
          
          return (
            <Card key={index} withBorder>
              <Group justify="apart" mb="md">
                <Text fw={500}>Table: {data.table}</Text>
                <Group>
                  <Badge color={validation.valid ? 'green' : 'red'}>
                    {validation.valid ? 'Valid' : 'Issues'}
                  </Badge>
                  <Badge variant="light">{validation.recordCount} records</Badge>
                </Group>
              </Group>

              {!validation.valid && (
                <Alert color="orange" mb="sm">
                  <Text fw={500} mb="xs">Data Validation Issues:</Text>
                  <Stack gap="xs">
                    {validation.issues.map((issue, idx) => (
                      <Text key={idx} size="sm">• {issue}</Text>
                    ))}
                  </Stack>
                </Alert>
              )}

              <Text size="sm" c="dimmed" mb="sm">
                Relationships: {data.relationships.length}, Constraints: {data.constraints.length}
              </Text>

              <Group>
                {data.constraints.map((constraint, idx) => (
                  <Badge key={idx} size="xs" variant="light">
                    {constraint.field}: {constraint.constraint}
                  </Badge>
                ))}
              </Group>
            </Card>
          );
        })}
      </Stack>
    </Card>
  );
};

// ===== TRANSACTION MANAGEMENT =====

interface TransactionConfig {
  isolation: 'read-uncommitted' | 'read-committed' | 'repeatable-read' | 'serializable';
  timeout: number;
  retries: number;
  rollbackOnError: boolean;
}

interface TransactionResult {
  id: string;
  status: 'committed' | 'rolled-back' | 'failed';
  operations: Operation[];
  timing: TransactionTiming;
  errors?: string[];
}

interface Operation {
  type: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  table: string;
  duration: number;
  rowsAffected: number;
}

interface TransactionTiming {
  startTime: number;
  commitTime: number;
  totalDuration: number;
}

const TransactionWrapper: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionResult[]>([]);
  const [config, setConfig] = useState<TransactionConfig>({
    isolation: 'read-committed',
    timeout: 30000,
    retries: 3,
    rollbackOnError: true
  });
  const [isRunning, setIsRunning] = useState(false);

  const runTransaction = useCallback(async () => {
    setIsRunning(true);
    const startTime = performance.now();
    const transactionId = `tx_${Date.now()}`;

    // Simulate transaction operations
    const operations: Operation[] = [
      {
        type: 'INSERT',
        table: 'users',
        duration: Math.floor(Math.random() * 100) + 50,
        rowsAffected: 1
      },
      {
        type: 'INSERT',
        table: 'orders',
        duration: Math.floor(Math.random() * 150) + 75,
        rowsAffected: 1
      },
      {
        type: 'UPDATE',
        table: 'inventory',
        duration: Math.floor(Math.random() * 200) + 100,
        rowsAffected: 3
      }
    ];

    // Simulate transaction execution
    let currentTime = startTime;
    for (const op of operations) {
      await new Promise(resolve => setTimeout(resolve, op.duration));
      currentTime += op.duration;
    }

    const commitTime = performance.now();
    const shouldFail = Math.random() > 0.8; // 20% failure rate

    const result: TransactionResult = {
      id: transactionId,
      status: shouldFail ? (config.rollbackOnError ? 'rolled-back' : 'failed') : 'committed',
      operations,
      timing: {
        startTime,
        commitTime,
        totalDuration: commitTime - startTime
      },
      errors: shouldFail ? ['Simulated constraint violation in inventory update'] : undefined
    };

    setTransactions(prev => [...prev, result]);
    setIsRunning(false);
  }, [config]);

  const runNestedTransaction = useCallback(async () => {
    setIsRunning(true);
    const startTime = performance.now();
    const transactionId = `nested_tx_${Date.now()}`;

    // Simulate nested transaction with savepoints
    const operations: Operation[] = [
      {
        type: 'INSERT',
        table: 'users',
        duration: Math.floor(Math.random() * 100) + 50,
        rowsAffected: 1
      },
      {
        type: 'INSERT',
        table: 'profiles',
        duration: Math.floor(Math.random() * 100) + 50,
        rowsAffected: 1
      },
      // Nested transaction starts here
      {
        type: 'INSERT',
        table: 'preferences',
        duration: Math.floor(Math.random() * 150) + 75,
        rowsAffected: 1
      },
      {
        type: 'UPDATE',
        table: 'settings',
        duration: Math.floor(Math.random() * 100) + 50,
        rowsAffected: 2
      }
    ];

    // Simulate execution with potential nested rollback
    let currentTime = startTime;
    const nestedFails = Math.random() > 0.7; // 30% nested failure rate
    
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      await new Promise(resolve => setTimeout(resolve, op.duration));
      currentTime += op.duration;

      // Simulate nested transaction failure
      if (i >= 2 && nestedFails) {
        const result: TransactionResult = {
          id: transactionId,
          status: 'rolled-back',
          operations: operations.slice(0, i + 1),
          timing: {
            startTime,
            commitTime: performance.now(),
            totalDuration: performance.now() - startTime
          },
          errors: ['Nested transaction failed - rolled back to savepoint']
        };

        setTransactions(prev => [...prev, result]);
        setIsRunning(false);
        return;
      }
    }

    const commitTime = performance.now();
    const result: TransactionResult = {
      id: transactionId,
      status: 'committed',
      operations,
      timing: {
        startTime,
        commitTime,
        totalDuration: commitTime - startTime
      }
    };

    setTransactions(prev => [...prev, result]);
    setIsRunning(false);
  }, []);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>Transaction Wrapper</Text>
          <Group>
            <Button 
              onClick={runTransaction}
              loading={isRunning}
              size="sm"
            >
              Run Transaction
            </Button>
            <Button 
              onClick={runNestedTransaction}
              loading={isRunning}
              variant="light"
              size="sm"
            >
              Nested Transaction
            </Button>
          </Group>
        </Group>

        <Card withBorder>
          <Text fw={500} mb="md">Transaction Configuration</Text>
          <Group>
            <Select
              label="Isolation Level"
              value={config.isolation}
              onChange={(value) => setConfig(prev => ({ ...prev, isolation: value as any }))}
              data={[
                { value: 'read-uncommitted', label: 'Read Uncommitted' },
                { value: 'read-committed', label: 'Read Committed' },
                { value: 'repeatable-read', label: 'Repeatable Read' },
                { value: 'serializable', label: 'Serializable' }
              ]}
              size="sm"
            />
            <NumberInput
              label="Timeout (ms)"
              value={config.timeout}
              onChange={(value) => setConfig(prev => ({ ...prev, timeout: value || 30000 }))}
              size="sm"
              min={1000}
              max={300000}
            />
          </Group>
        </Card>

        {transactions.slice(-5).reverse().map((transaction, index) => (
          <Alert 
            key={index} 
            color={
              transaction.status === 'committed' ? 'green' : 
              transaction.status === 'rolled-back' ? 'orange' : 'red'
            }
          >
            <Group justify="apart" mb="sm">
              <Text fw={500}>Transaction {transaction.id}</Text>
              <Badge color={
                transaction.status === 'committed' ? 'green' : 
                transaction.status === 'rolled-back' ? 'orange' : 'red'
              }>
                {transaction.status.toUpperCase()}
              </Badge>
            </Group>

            <Group mb="sm">
              <Text size="sm">
                Duration: {Math.round(transaction.timing.totalDuration)}ms
              </Text>
              <Text size="sm">
                Operations: {transaction.operations.length}
              </Text>
              <Text size="sm">
                Rows: {transaction.operations.reduce((sum, op) => sum + op.rowsAffected, 0)}
              </Text>
            </Group>

            {transaction.errors && (
              <Alert color="red" size="sm" mb="sm">
                <Stack gap="xs">
                  {transaction.errors.map((error, idx) => (
                    <Text key={idx} size="sm">• {error}</Text>
                  ))}
                </Stack>
              </Alert>
            )}

            <Stack gap="xs">
              {transaction.operations.map((op, idx) => (
                <Group key={idx} justify="apart">
                  <Group>
                    <Badge size="xs" variant="light">{op.type}</Badge>
                    <Text size="sm">{op.table}</Text>
                  </Group>
                  <Group>
                    <Text size="xs" c="dimmed">{op.rowsAffected} rows</Text>
                    <Text size="xs" c="dimmed">{op.duration}ms</Text>
                  </Group>
                </Group>
              ))}
            </Stack>
          </Alert>
        ))}
      </Stack>
    </Card>
  );
};

// ===== STATE VERIFICATION =====

interface DatabaseState {
  tables: TableState[];
  constraints: ConstraintState[];
  indexes: IndexState[];
  timestamp: string;
}

interface TableState {
  name: string;
  rowCount: number;
  size: number;
  lastModified: string;
  checksum: string;
}

interface ConstraintState {
  name: string;
  type: 'primary-key' | 'foreign-key' | 'unique' | 'check';
  table: string;
  valid: boolean;
}

interface IndexState {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
  size: number;
}

interface StateComparison {
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: string[];
}

const StateVerifier: React.FC = () => {
  const [snapshots, setSnapshots] = useState<DatabaseState[]>([]);
  const [comparison, setComparison] = useState<StateComparison | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const captureState = useCallback(async () => {
    setIsCapturing(true);

    // Simulate state capture
    await new Promise(resolve => setTimeout(resolve, 1500));

    const state: DatabaseState = {
      tables: [
        {
          name: 'users',
          rowCount: Math.floor(Math.random() * 1000) + 100,
          size: Math.floor(Math.random() * 10000) + 5000,
          lastModified: new Date().toISOString(),
          checksum: Math.random().toString(36).substring(2, 15)
        },
        {
          name: 'orders',
          rowCount: Math.floor(Math.random() * 2000) + 500,
          size: Math.floor(Math.random() * 15000) + 8000,
          lastModified: new Date().toISOString(),
          checksum: Math.random().toString(36).substring(2, 15)
        },
        {
          name: 'products',
          rowCount: Math.floor(Math.random() * 500) + 50,
          size: Math.floor(Math.random() * 5000) + 2000,
          lastModified: new Date().toISOString(),
          checksum: Math.random().toString(36).substring(2, 15)
        }
      ],
      constraints: [
        { name: 'pk_users_id', type: 'primary-key', table: 'users', valid: true },
        { name: 'fk_orders_user_id', type: 'foreign-key', table: 'orders', valid: Math.random() > 0.1 },
        { name: 'uk_users_email', type: 'unique', table: 'users', valid: Math.random() > 0.05 }
      ],
      indexes: [
        { name: 'idx_users_email', table: 'users', columns: ['email'], unique: true, size: 1024 },
        { name: 'idx_orders_user_id', table: 'orders', columns: ['user_id'], unique: false, size: 2048 },
        { name: 'idx_orders_created_at', table: 'orders', columns: ['created_at'], unique: false, size: 1536 }
      ],
      timestamp: new Date().toISOString()
    };

    setSnapshots(prev => [...prev, state]);
    setIsCapturing(false);
  }, []);

  const compareStates = useCallback(() => {
    if (snapshots.length < 2) return;

    const current = snapshots[snapshots.length - 1];
    const previous = snapshots[snapshots.length - 2];

    const currentTables = current.tables.map(t => `${t.name}:${t.checksum}`);
    const previousTables = previous.tables.map(t => `${t.name}:${t.checksum}`);

    const comparison: StateComparison = {
      added: currentTables.filter(t => !previousTables.some(p => p.split(':')[0] === t.split(':')[0])),
      removed: previousTables.filter(p => !currentTables.some(t => t.split(':')[0] === p.split(':')[0])),
      modified: currentTables.filter(t => {
        const tableName = t.split(':')[0];
        const prevTable = previousTables.find(p => p.split(':')[0] === tableName);
        return prevTable && prevTable !== t;
      }),
      unchanged: currentTables.filter(t => previousTables.includes(t))
    };

    setComparison(comparison);
  }, [snapshots]);

  const validateConstraints = useCallback((state: DatabaseState) => {
    const issues = state.constraints.filter(c => !c.valid);
    return {
      valid: issues.length === 0,
      issues: issues.map(c => `${c.type} constraint '${c.name}' on table '${c.table}' is invalid`),
      totalConstraints: state.constraints.length
    };
  }, []);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>State Verifier</Text>
          <Group>
            <Button 
              onClick={captureState}
              loading={isCapturing}
              size="sm"
            >
              Capture State
            </Button>
            <Button 
              onClick={compareStates}
              disabled={snapshots.length < 2}
              variant="light"
              size="sm"
            >
              Compare States
            </Button>
          </Group>
        </Group>

        {snapshots.slice(-3).reverse().map((state, index) => {
          const validation = validateConstraints(state);
          
          return (
            <Card key={index} withBorder>
              <Group justify="apart" mb="md">
                <Text fw={500}>
                  Snapshot {snapshots.length - index}
                </Text>
                <Group>
                  <Badge color={validation.valid ? 'green' : 'red'}>
                    {validation.valid ? 'Valid' : 'Issues'}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {new Date(state.timestamp).toLocaleTimeString()}
                  </Text>
                </Group>
              </Group>

              {!validation.valid && (
                <Alert color="orange" mb="sm">
                  <Text fw={500} mb="xs">Constraint Issues:</Text>
                  <Stack gap="xs">
                    {validation.issues.map((issue, idx) => (
                      <Text key={idx} size="sm">• {issue}</Text>
                    ))}
                  </Stack>
                </Alert>
              )}

              <Group mb="sm" grow>
                <div>
                  <Text size="xs" c="dimmed">Tables</Text>
                  <Text size="sm">{state.tables.length}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Total Rows</Text>
                  <Text size="sm">
                    {state.tables.reduce((sum, t) => sum + t.rowCount, 0).toLocaleString()}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Constraints</Text>
                  <Text size="sm">{state.constraints.length}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Indexes</Text>
                  <Text size="sm">{state.indexes.length}</Text>
                </div>
              </Group>

              <Stack gap="xs">
                {state.tables.map((table, idx) => (
                  <Group key={idx} justify="apart">
                    <Group>
                      <Text size="sm" fw={500}>{table.name}</Text>
                      <Badge size="xs" variant="light">
                        {table.rowCount.toLocaleString()} rows
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {(table.size / 1024).toFixed(1)} KB
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Card>
          );
        })}

        {comparison && (
          <Alert color="blue">
            <Text fw={500} mb="sm">State Comparison Results</Text>
            <Group mb="sm">
              <Badge color="green">Added: {comparison.added.length}</Badge>
              <Badge color="red">Removed: {comparison.removed.length}</Badge>
              <Badge color="orange">Modified: {comparison.modified.length}</Badge>
              <Badge color="gray">Unchanged: {comparison.unchanged.length}</Badge>
            </Group>
            
            {comparison.modified.length > 0 && (
              <div>
                <Text fw={500} size="sm" mb="xs">Modified Tables:</Text>
                <Stack gap="xs">
                  {comparison.modified.map((item, idx) => (
                    <Text key={idx} size="sm">• {item.split(':')[0]}</Text>
                  ))}
                </Stack>
              </div>
            )}
          </Alert>
        )}
      </Stack>
    </Card>
  );
};

// ===== MAIN COMPONENT =====

export const DatabaseIntegrationTestingExercise: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <Stack>
        <div>
          <h1>Database Integration Testing</h1>
          <p>Full-stack database testing with real data scenarios and comprehensive state management</p>
        </div>

        <Tabs defaultValue="runner">
          <Tabs.List>
            <Tabs.Tab value="runner">Test Runner</Tabs.Tab>
            <Tabs.Tab value="seeding">Data Seeding</Tabs.Tab>
            <Tabs.Tab value="transactions">Transactions</Tabs.Tab>
            <Tabs.Tab value="verification">State Verification</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="runner" pt="md">
            <DatabaseTestRunner />
          </Tabs.Panel>

          <Tabs.Panel value="seeding" pt="md">
            <SeedDataManager />
          </Tabs.Panel>

          <Tabs.Panel value="transactions" pt="md">
            <TransactionWrapper />
          </Tabs.Panel>

          <Tabs.Panel value="verification" pt="md">
            <StateVerifier />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </div>
  );
};

export default DatabaseIntegrationTestingExercise;