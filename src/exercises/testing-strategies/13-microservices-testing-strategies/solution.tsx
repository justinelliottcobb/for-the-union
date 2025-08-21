import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Text, Group, Stack, Badge, Progress, Alert, Tabs, JsonInput, Select, NumberInput, Switch } from '@mantine/core';

// ===== SERVICE TEST ORCHESTRATION FRAMEWORK =====

interface ServiceDefinition {
  name: string;
  version: string;
  port: number;
  endpoints: ServiceEndpoint[];
  dependencies: ServiceDependency[];
  healthCheck: HealthCheck;
  status: ServiceStatus;
}

interface ServiceEndpoint {
  path: string;
  method: string;
  responseTime: number;
  errorRate: number;
}

interface ServiceDependency {
  service: string;
  type: 'synchronous' | 'asynchronous' | 'eventual';
  timeout: number;
  retries: number;
}

interface HealthCheck {
  endpoint: string;
  interval: number;
  timeout: number;
  healthy: boolean;
  lastCheck: string;
}

interface ServiceStatus {
  state: 'starting' | 'healthy' | 'unhealthy' | 'stopped';
  uptime: number;
  requestCount: number;
  errorCount: number;
}

interface TestOrchestrationResult {
  testId: string;
  services: ServiceTestResult[];
  duration: number;
  success: boolean;
  errors: string[];
}

interface ServiceTestResult {
  service: string;
  tests: TestCase[];
  performance: PerformanceMetrics;
  status: 'passed' | 'failed' | 'skipped';
}

interface TestCase {
  name: string;
  status: 'passed' | 'failed';
  duration: number;
  error?: string;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  throughput: number;
  errorRate: number;
  p95ResponseTime: number;
}

// Service Test Orchestrator - Multi-Service Testing Framework
const ServiceTestOrchestrator: React.FC = () => {
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [orchestrationResults, setOrchestrationResults] = useState<TestOrchestrationResult[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);

  const createMicroservice = useCallback((serviceName: string) => {
    const service: ServiceDefinition = {
      name: serviceName,
      version: '1.0.0',
      port: 8080 + services.length,
      endpoints: [
        {
          path: `/${serviceName.toLowerCase()}`,
          method: 'GET',
          responseTime: Math.floor(Math.random() * 200) + 50,
          errorRate: Math.random() * 0.05
        },
        {
          path: `/${serviceName.toLowerCase()}`,
          method: 'POST',
          responseTime: Math.floor(Math.random() * 300) + 100,
          errorRate: Math.random() * 0.1
        }
      ],
      dependencies: serviceName !== 'UserService' ? [
        {
          service: 'UserService',
          type: 'synchronous',
          timeout: 5000,
          retries: 3
        }
      ] : [],
      healthCheck: {
        endpoint: '/health',
        interval: 30000,
        timeout: 5000,
        healthy: true,
        lastCheck: new Date().toISOString()
      },
      status: {
        state: 'starting',
        uptime: 0,
        requestCount: 0,
        errorCount: 0
      }
    };

    setServices(prev => [...prev, service]);

    // Simulate service startup
    setTimeout(() => {
      setServices(prev => prev.map(s => 
        s.name === serviceName 
          ? {
              ...s,
              status: {
                ...s.status,
                state: 'healthy',
                uptime: Date.now()
              }
            }
          : s
      ));
    }, 2000);

    return service;
  }, [services.length]);

  const runOrchestration = useCallback(async () => {
    if (services.length === 0) return;

    setIsOrchestrating(true);
    const startTime = performance.now();

    // Simulate orchestrated testing across services
    await new Promise(resolve => setTimeout(resolve, 4000));

    const serviceResults: ServiceTestResult[] = services.map(service => {
      const testCases: TestCase[] = [
        {
          name: 'Health Check Test',
          status: Math.random() > 0.1 ? 'passed' : 'failed',
          duration: Math.floor(Math.random() * 100) + 20,
          error: Math.random() > 0.1 ? undefined : 'Health check endpoint not responding'
        },
        {
          name: 'API Contract Test',
          status: Math.random() > 0.15 ? 'passed' : 'failed',
          duration: Math.floor(Math.random() * 200) + 50,
          error: Math.random() > 0.15 ? undefined : 'Contract validation failed for endpoint response'
        },
        {
          name: 'Dependency Integration Test',
          status: service.dependencies.length > 0 ? (Math.random() > 0.2 ? 'passed' : 'failed') : 'passed',
          duration: Math.floor(Math.random() * 300) + 100,
          error: service.dependencies.length > 0 && Math.random() > 0.2 ? undefined : 'Dependency service timeout'
        },
        {
          name: 'Load Test',
          status: Math.random() > 0.25 ? 'passed' : 'failed',
          duration: Math.floor(Math.random() * 1000) + 500,
          error: Math.random() > 0.25 ? undefined : 'Response time exceeded threshold'
        }
      ];

      return {
        service: service.name,
        tests: testCases,
        performance: {
          averageResponseTime: Math.floor(Math.random() * 200) + 50,
          throughput: Math.floor(Math.random() * 1000) + 100,
          errorRate: Math.random() * 0.05,
          p95ResponseTime: Math.floor(Math.random() * 400) + 100
        },
        status: testCases.every(t => t.status === 'passed') ? 'passed' : 'failed'
      };
    });

    const endTime = performance.now();
    const result: TestOrchestrationResult = {
      testId: `orchestration_${Date.now()}`,
      services: serviceResults,
      duration: Math.round(endTime - startTime),
      success: serviceResults.every(s => s.status === 'passed'),
      errors: serviceResults
        .flatMap(s => s.tests)
        .filter(t => t.status === 'failed' && t.error)
        .map(t => t.error!)
    };

    setOrchestrationResults(prev => [...prev, result]);
    setIsOrchestrating(false);
  }, [services]);

  const simulateServiceFailure = useCallback((serviceName: string) => {
    setServices(prev => prev.map(s => 
      s.name === serviceName 
        ? {
            ...s,
            status: {
              ...s.status,
              state: 'unhealthy',
              errorCount: s.status.errorCount + 1
            },
            healthCheck: {
              ...s.healthCheck,
              healthy: false,
              lastCheck: new Date().toISOString()
            }
          }
        : s
    ));
  }, []);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>Service Test Orchestrator</Text>
          <Group>
            <Button 
              onClick={() => createMicroservice('UserService')}
              variant="light"
              size="sm"
            >
              User Service
            </Button>
            <Button 
              onClick={() => createMicroservice('OrderService')}
              variant="light"
              size="sm"
            >
              Order Service
            </Button>
            <Button 
              onClick={() => createMicroservice('PaymentService')}
              variant="light"
              size="sm"
            >
              Payment Service
            </Button>
            <Button 
              onClick={runOrchestration}
              loading={isOrchestrating}
              disabled={services.length === 0}
            >
              Run Orchestration
            </Button>
          </Group>
        </Group>

        {services.map((service, index) => (
          <Card key={index} withBorder>
            <Group justify="apart" mb="md">
              <Group>
                <Text fw={500}>{service.name}</Text>
                <Badge color={
                  service.status.state === 'healthy' ? 'green' : 
                  service.status.state === 'unhealthy' ? 'red' : 
                  service.status.state === 'starting' ? 'blue' : 'gray'
                }>
                  {service.status.state}
                </Badge>
                <Text size="sm" c="dimmed">:{service.port}</Text>
              </Group>
              <Group>
                <Button 
                  onClick={() => simulateServiceFailure(service.name)}
                  color="red"
                  variant="light"
                  size="xs"
                >
                  Simulate Failure
                </Button>
              </Group>
            </Group>

            <Group mb="sm" grow>
              <div>
                <Text size="xs" c="dimmed">Endpoints</Text>
                <Text size="sm">{service.endpoints.length}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Dependencies</Text>
                <Text size="sm">{service.dependencies.length}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Requests</Text>
                <Text size="sm">{service.status.requestCount}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Errors</Text>
                <Text size="sm">{service.status.errorCount}</Text>
              </div>
            </Group>

            {service.dependencies.length > 0 && (
              <Group mb="sm">
                <Text size="sm" fw={500}>Dependencies:</Text>
                {service.dependencies.map((dep, idx) => (
                  <Badge key={idx} size="sm" variant="light">
                    {dep.service} ({dep.type})
                  </Badge>
                ))}
              </Group>
            )}
          </Card>
        ))}

        {orchestrationResults.slice(-3).reverse().map((result, index) => (
          <Alert 
            key={index} 
            color={result.success ? 'green' : 'red'}
          >
            <Group justify="apart" mb="sm">
              <Text fw={500}>
                Orchestration Test {result.testId.split('_')[1]}
              </Text>
              <Group>
                <Badge color={result.success ? 'green' : 'red'}>
                  {result.success ? 'Success' : 'Failed'}
                </Badge>
                <Text size="sm" c="dimmed">{result.duration}ms</Text>
              </Group>
            </Group>

            <Stack gap="xs">
              {result.services.map((service, idx) => (
                <Group key={idx} justify="apart">
                  <Group>
                    <Text size="sm" fw={500}>{service.service}</Text>
                    <Badge 
                      size="xs" 
                      color={service.status === 'passed' ? 'green' : 'red'}
                    >
                      {service.tests.filter(t => t.status === 'passed').length}/{service.tests.length}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {service.performance.averageResponseTime}ms avg
                  </Text>
                </Group>
              ))}
            </Stack>

            {result.errors.length > 0 && (
              <Alert color="red" size="sm" mt="sm">
                <Text fw={500} mb="xs">Errors:</Text>
                <Stack gap="xs">
                  {result.errors.slice(0, 3).map((error, idx) => (
                    <Text key={idx} size="sm">• {error}</Text>
                  ))}
                </Stack>
              </Alert>
            )}
          </Alert>
        ))}
      </Stack>
    </Card>
  );
};

// ===== CONTRACT REGISTRY MANAGEMENT =====

interface ContractDefinition {
  id: string;
  service: string;
  version: string;
  consumer: string;
  provider: string;
  schema: ContractSchema;
  status: ContractStatus;
  compatibility: CompatibilityInfo;
}

interface ContractSchema {
  endpoints: SchemaEndpoint[];
  models: SchemaModel[];
  validation: ValidationRule[];
}

interface SchemaEndpoint {
  path: string;
  method: string;
  request: SchemaModel;
  response: SchemaModel;
}

interface SchemaModel {
  name: string;
  properties: SchemaProperty[];
}

interface SchemaProperty {
  name: string;
  type: string;
  required: boolean;
  constraints?: any;
}

interface ValidationRule {
  field: string;
  rule: string;
  message: string;
}

interface ContractStatus {
  verified: boolean;
  lastVerification: string;
  verificationResults: VerificationResult[];
}

interface VerificationResult {
  test: string;
  status: 'passed' | 'failed';
  message: string;
}

interface CompatibilityInfo {
  backward: boolean;
  forward: boolean;
  breaking_changes: string[];
  migration_required: boolean;
}

const ContractRegistry: React.FC = () => {
  const [contracts, setContracts] = useState<ContractDefinition[]>([]);
  const [registryStats, setRegistryStats] = useState({
    totalContracts: 0,
    verifiedContracts: 0,
    compatibilityIssues: 0,
    lastSync: new Date().toISOString()
  });

  const registerContract = useCallback((serviceName: string, consumerName: string) => {
    const contract: ContractDefinition = {
      id: `contract_${Date.now()}`,
      service: serviceName,
      version: '1.0.0',
      consumer: consumerName,
      provider: serviceName,
      schema: {
        endpoints: [
          {
            path: `/${serviceName.toLowerCase()}/users`,
            method: 'GET',
            request: {
              name: 'GetUsersRequest',
              properties: [
                { name: 'page', type: 'integer', required: false },
                { name: 'limit', type: 'integer', required: false }
              ]
            },
            response: {
              name: 'GetUsersResponse',
              properties: [
                { name: 'users', type: 'array', required: true },
                { name: 'total', type: 'integer', required: true },
                { name: 'page', type: 'integer', required: true }
              ]
            }
          }
        ],
        models: [
          {
            name: 'User',
            properties: [
              { name: 'id', type: 'string', required: true },
              { name: 'name', type: 'string', required: true },
              { name: 'email', type: 'string', required: true }
            ]
          }
        ],
        validation: [
          { field: 'email', rule: 'format', message: 'Must be valid email format' },
          { field: 'id', rule: 'required', message: 'ID is required' }
        ]
      },
      status: {
        verified: false,
        lastVerification: '',
        verificationResults: []
      },
      compatibility: {
        backward: true,
        forward: true,
        breaking_changes: [],
        migration_required: false
      }
    };

    setContracts(prev => [...prev, contract]);
    
    // Update registry stats
    setRegistryStats(prev => ({
      ...prev,
      totalContracts: prev.totalContracts + 1,
      lastSync: new Date().toISOString()
    }));
  }, []);

  const verifyContract = useCallback(async (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;

    // Simulate contract verification
    await new Promise(resolve => setTimeout(resolve, 2000));

    const verificationResults: VerificationResult[] = [
      {
        test: 'Schema Validation',
        status: Math.random() > 0.1 ? 'passed' : 'failed',
        message: Math.random() > 0.1 ? 'Schema is valid' : 'Schema validation failed - missing required field'
      },
      {
        test: 'Endpoint Availability',
        status: Math.random() > 0.15 ? 'passed' : 'failed',
        message: Math.random() > 0.15 ? 'All endpoints are available' : 'Endpoint not found or not responding'
      },
      {
        test: 'Response Format',
        status: Math.random() > 0.05 ? 'passed' : 'failed',
        message: Math.random() > 0.05 ? 'Response format matches contract' : 'Response format does not match schema'
      },
      {
        test: 'Backward Compatibility',
        status: Math.random() > 0.2 ? 'passed' : 'failed',
        message: Math.random() > 0.2 ? 'No breaking changes detected' : 'Breaking changes found in API'
      }
    ];

    const verified = verificationResults.every(r => r.status === 'passed');

    setContracts(prev => prev.map(c => 
      c.id === contractId 
        ? {
            ...c,
            status: {
              verified,
              lastVerification: new Date().toISOString(),
              verificationResults
            },
            compatibility: {
              ...c.compatibility,
              breaking_changes: verified ? [] : ['Field type changed', 'Required field removed']
            }
          }
        : c
    ));

    setRegistryStats(prev => ({
      ...prev,
      verifiedContracts: prev.verifiedContracts + (verified ? 1 : 0),
      compatibilityIssues: prev.compatibilityIssues + (verified ? 0 : 1),
      lastSync: new Date().toISOString()
    }));
  }, [contracts]);

  const checkCompatibility = useCallback((contractId: string) => {
    setContracts(prev => prev.map(c => 
      c.id === contractId 
        ? {
            ...c,
            compatibility: {
              backward: Math.random() > 0.3,
              forward: Math.random() > 0.4,
              breaking_changes: Math.random() > 0.3 ? [] : [
                'Changed response field type from string to integer',
                'Removed optional field from request'
              ],
              migration_required: Math.random() > 0.7
            }
          }
        : c
    ));
  }, []);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>Contract Registry</Text>
          <Group>
            <Button 
              onClick={() => registerContract('UserService', 'WebApp')}
              variant="light"
              size="sm"
            >
              Register User Contract
            </Button>
            <Button 
              onClick={() => registerContract('OrderService', 'MobileApp')}
              variant="light"
              size="sm"
            >
              Register Order Contract
            </Button>
          </Group>
        </Group>

        <Card withBorder>
          <Text fw={500} mb="md">Registry Statistics</Text>
          <Group grow>
            <div>
              <Text size="xs" c="dimmed">Total Contracts</Text>
              <Text size="lg" fw={700}>{registryStats.totalContracts}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Verified</Text>
              <Text size="lg" fw={700} c="green">{registryStats.verifiedContracts}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Issues</Text>
              <Text size="lg" fw={700} c="red">{registryStats.compatibilityIssues}</Text>
            </div>
          </Group>
          <Text size="xs" c="dimmed" mt="sm">
            Last sync: {new Date(registryStats.lastSync).toLocaleTimeString()}
          </Text>
        </Card>

        {contracts.map((contract, index) => (
          <Card key={index} withBorder>
            <Group justify="apart" mb="md">
              <Group>
                <Text fw={500}>{contract.service}</Text>
                <Badge color="blue">v{contract.version}</Badge>
                <Badge 
                  color={contract.status.verified ? 'green' : 'gray'}
                  variant={contract.status.verified ? 'filled' : 'light'}
                >
                  {contract.status.verified ? 'Verified' : 'Unverified'}
                </Badge>
              </Group>
              <Group>
                <Button 
                  onClick={() => verifyContract(contract.id)}
                  size="xs"
                  variant="light"
                >
                  Verify
                </Button>
                <Button 
                  onClick={() => checkCompatibility(contract.id)}
                  size="xs"
                  variant="light"
                >
                  Check Compatibility
                </Button>
              </Group>
            </Group>

            <Group mb="sm">
              <Text size="sm">Consumer: {contract.consumer}</Text>
              <Text size="sm">Provider: {contract.provider}</Text>
            </Group>

            <Group mb="sm">
              <Badge 
                size="sm" 
                color={contract.compatibility.backward ? 'green' : 'red'}
                variant="light"
              >
                Backward: {contract.compatibility.backward ? 'Compatible' : 'Breaking'}
              </Badge>
              <Badge 
                size="sm" 
                color={contract.compatibility.forward ? 'green' : 'orange'}
                variant="light"
              >
                Forward: {contract.compatibility.forward ? 'Compatible' : 'Limited'}
              </Badge>
            </Group>

            {contract.compatibility.breaking_changes.length > 0 && (
              <Alert color="orange" size="sm" mb="sm">
                <Text fw={500} mb="xs">Breaking Changes:</Text>
                <Stack gap="xs">
                  {contract.compatibility.breaking_changes.map((change, idx) => (
                    <Text key={idx} size="sm">• {change}</Text>
                  ))}
                </Stack>
              </Alert>
            )}

            {contract.status.verificationResults.length > 0 && (
              <Stack gap="xs">
                {contract.status.verificationResults.map((result, idx) => (
                  <Group key={idx} justify="apart">
                    <Text size="sm">{result.test}</Text>
                    <Badge 
                      size="xs" 
                      color={result.status === 'passed' ? 'green' : 'red'}
                    >
                      {result.status}
                    </Badge>
                  </Group>
                ))}
              </Stack>
            )}
          </Card>
        ))}
      </Stack>
    </Card>
  );
};

// ===== SERVICE MOCK MANAGER =====

interface ServiceMock {
  id: string;
  service: string;
  port: number;
  scenarios: MockScenario[];
  networking: NetworkConfig;
  state: MockState;
  performance: MockPerformance;
}

interface MockScenario {
  name: string;
  active: boolean;
  behaviors: MockBehavior[];
  conditions: ScenarioCondition[];
}

interface MockBehavior {
  endpoint: string;
  method: string;
  response: MockResponse;
  latency: LatencyConfig;
  failure: FailureConfig;
}

interface MockResponse {
  status: number;
  body: any;
  headers: Record<string, string>;
}

interface LatencyConfig {
  min: number;
  max: number;
  distribution: 'uniform' | 'normal' | 'exponential';
}

interface FailureConfig {
  rate: number;
  type: 'timeout' | 'connection_refused' | 'internal_error';
  recoveryTime: number;
}

interface ScenarioCondition {
  field: string;
  operator: string;
  value: any;
}

interface NetworkConfig {
  latency: number;
  bandwidth: number;
  packetLoss: number;
  jitter: number;
}

interface MockState {
  requests: MockRequest[];
  responses: MockResponseLog[];
  errors: MockError[];
}

interface MockRequest {
  timestamp: string;
  endpoint: string;
  method: string;
  duration: number;
}

interface MockResponseLog {
  timestamp: string;
  status: number;
  size: number;
}

interface MockError {
  timestamp: string;
  type: string;
  message: string;
}

interface MockPerformance {
  requestsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  uptime: number;
}

const ServiceMockManager: React.FC = () => {
  const [mocks, setMocks] = useState<ServiceMock[]>([]);
  const [isCreatingMock, setIsCreatingMock] = useState(false);

  const createServiceMock = useCallback(async (serviceName: string) => {
    setIsCreatingMock(true);
    
    // Simulate mock creation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mock: ServiceMock = {
      id: `mock_${Date.now()}`,
      service: serviceName,
      port: 9000 + mocks.length,
      scenarios: [
        {
          name: 'Happy Path',
          active: true,
          behaviors: [
            {
              endpoint: `/${serviceName.toLowerCase()}`,
              method: 'GET',
              response: {
                status: 200,
                body: { message: `${serviceName} response`, data: [] },
                headers: { 'Content-Type': 'application/json' }
              },
              latency: {
                min: 50,
                max: 200,
                distribution: 'normal'
              },
              failure: {
                rate: 0.01,
                type: 'timeout',
                recoveryTime: 1000
              }
            }
          ],
          conditions: []
        },
        {
          name: 'High Load',
          active: false,
          behaviors: [
            {
              endpoint: `/${serviceName.toLowerCase()}`,
              method: 'GET',
              response: {
                status: 503,
                body: { error: 'Service Unavailable' },
                headers: { 'Content-Type': 'application/json' }
              },
              latency: {
                min: 1000,
                max: 5000,
                distribution: 'exponential'
              },
              failure: {
                rate: 0.3,
                type: 'connection_refused',
                recoveryTime: 5000
              }
            }
          ],
          conditions: [
            { field: 'requests_per_second', operator: '>', value: 100 }
          ]
        }
      ],
      networking: {
        latency: Math.floor(Math.random() * 100) + 20,
        bandwidth: 1000,
        packetLoss: Math.random() * 0.01,
        jitter: Math.floor(Math.random() * 10) + 1
      },
      state: {
        requests: [],
        responses: [],
        errors: []
      },
      performance: {
        requestsPerSecond: Math.floor(Math.random() * 100) + 10,
        averageLatency: Math.floor(Math.random() * 200) + 50,
        errorRate: Math.random() * 0.05,
        uptime: Math.random() * 100
      }
    };

    setMocks(prev => [...prev, mock]);
    setIsCreatingMock(false);
  }, [mocks.length]);

  const toggleScenario = useCallback((mockId: string, scenarioName: string) => {
    setMocks(prev => prev.map(mock => 
      mock.id === mockId 
        ? {
            ...mock,
            scenarios: mock.scenarios.map(scenario => 
              scenario.name === scenarioName
                ? { ...scenario, active: !scenario.active }
                : { ...scenario, active: false } // Only one scenario active at a time
            )
          }
        : mock
    ));
  }, []);

  const simulateNetworkConditions = useCallback((mockId: string, conditions: Partial<NetworkConfig>) => {
    setMocks(prev => prev.map(mock => 
      mock.id === mockId 
        ? {
            ...mock,
            networking: {
              ...mock.networking,
              ...conditions
            }
          }
        : mock
    ));
  }, []);

  const simulateChaos = useCallback((mockId: string) => {
    setMocks(prev => prev.map(mock => 
      mock.id === mockId 
        ? {
            ...mock,
            networking: {
              latency: Math.floor(Math.random() * 1000) + 500,
              bandwidth: Math.floor(Math.random() * 100) + 10,
              packetLoss: Math.random() * 0.2,
              jitter: Math.floor(Math.random() * 100) + 10
            },
            performance: {
              ...mock.performance,
              errorRate: Math.random() * 0.5 + 0.1,
              averageLatency: Math.floor(Math.random() * 2000) + 500
            }
          }
        : mock
    ));
  }, []);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>Service Mock Manager</Text>
          <Group>
            <Button 
              onClick={() => createServiceMock('PaymentGateway')}
              variant="light"
              size="sm"
              loading={isCreatingMock}
            >
              Payment Mock
            </Button>
            <Button 
              onClick={() => createServiceMock('NotificationService')}
              variant="light"
              size="sm"
              loading={isCreatingMock}
            >
              Notification Mock
            </Button>
            <Button 
              onClick={() => createServiceMock('AnalyticsService')}
              variant="light"
              size="sm"
              loading={isCreatingMock}
            >
              Analytics Mock
            </Button>
          </Group>
        </Group>

        {mocks.map((mock, index) => (
          <Card key={index} withBorder>
            <Group justify="apart" mb="md">
              <Group>
                <Text fw={500}>{mock.service} Mock</Text>
                <Badge variant="light">Port {mock.port}</Badge>
                <Badge 
                  color={mock.performance.errorRate < 0.1 ? 'green' : 'orange'}
                >
                  {(mock.performance.uptime).toFixed(1)}% uptime
                </Badge>
              </Group>
              <Group>
                <Button 
                  onClick={() => simulateChaos(mock.id)}
                  color="red"
                  variant="light"
                  size="xs"
                >
                  Chaos Test
                </Button>
              </Group>
            </Group>

            <Group mb="md" grow>
              <div>
                <Text size="xs" c="dimmed">Avg Latency</Text>
                <Text size="sm">{mock.performance.averageLatency}ms</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">RPS</Text>
                <Text size="sm">{mock.performance.requestsPerSecond}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Error Rate</Text>
                <Text size="sm">{(mock.performance.errorRate * 100).toFixed(2)}%</Text>
              </div>
            </Group>

            <Text fw={500} mb="sm">Network Conditions</Text>
            <Group mb="md" grow>
              <div>
                <Text size="xs" c="dimmed">Latency</Text>
                <Text size="sm">{mock.networking.latency}ms</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Packet Loss</Text>
                <Text size="sm">{(mock.networking.packetLoss * 100).toFixed(2)}%</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Jitter</Text>
                <Text size="sm">{mock.networking.jitter}ms</Text>
              </div>
            </Group>

            <Group mb="sm">
              <Button 
                onClick={() => simulateNetworkConditions(mock.id, { 
                  latency: 1000, 
                  packetLoss: 0.1 
                })}
                size="xs"
                variant="light"
              >
                Slow Network
              </Button>
              <Button 
                onClick={() => simulateNetworkConditions(mock.id, { 
                  packetLoss: 0.5, 
                  jitter: 100 
                })}
                size="xs"
                variant="light"
                color="orange"
              >
                Unreliable Network
              </Button>
              <Button 
                onClick={() => simulateNetworkConditions(mock.id, { 
                  latency: 20, 
                  packetLoss: 0 
                })}
                size="xs"
                variant="light"
                color="green"
              >
                Reset Network
              </Button>
            </Group>

            <Text fw={500} mb="sm">Test Scenarios</Text>
            <Stack gap="xs">
              {mock.scenarios.map((scenario, idx) => (
                <Group key={idx} justify="apart">
                  <Group>
                    <Switch 
                      checked={scenario.active}
                      onChange={() => toggleScenario(mock.id, scenario.name)}
                      size="sm"
                    />
                    <Text size="sm" fw={scenario.active ? 500 : 400}>
                      {scenario.name}
                    </Text>
                  </Group>
                  <Badge 
                    size="xs" 
                    color={scenario.active ? 'green' : 'gray'}
                  >
                    {scenario.behaviors.length} behaviors
                  </Badge>
                </Group>
              ))}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Card>
  );
};

// ===== DISTRIBUTED TRACING VALIDATION =====

interface TraceSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  service: string;
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  tags: Record<string, any>;
  status: 'ok' | 'error' | 'timeout';
}

interface DistributedTrace {
  traceId: string;
  spans: TraceSpan[];
  services: string[];
  totalDuration: number;
  status: 'success' | 'error' | 'partial';
  errors: TraceError[];
}

interface TraceError {
  spanId: string;
  service: string;
  error: string;
  timestamp: number;
}

interface TraceAnalysis {
  traceId: string;
  bottlenecks: Bottleneck[];
  performance: TracePerformance;
  dependencies: ServiceDependency[];
  recommendations: string[];
}

interface Bottleneck {
  service: string;
  operation: string;
  duration: number;
  percentage: number;
}

interface TracePerformance {
  totalTime: number;
  networkTime: number;
  serviceTime: number;
  errorRate: number;
  throughput: number;
}

const DistributedTracer: React.FC = () => {
  const [traces, setTraces] = useState<DistributedTrace[]>([]);
  const [traceAnalyses, setTraceAnalyses] = useState<TraceAnalysis[]>([]);
  const [isTracing, setIsTracing] = useState(false);

  const generateTrace = useCallback(async () => {
    setIsTracing(true);

    // Simulate distributed trace generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const traceId = `trace_${Date.now()}`;
    const services = ['WebApp', 'UserService', 'OrderService', 'PaymentService', 'Database'];
    
    const spans: TraceSpan[] = [];
    let currentTime = Date.now();

    // Generate spans for a typical request flow
    services.forEach((service, index) => {
      const duration = Math.floor(Math.random() * 500) + 50;
      const hasError = Math.random() > 0.85;
      
      const span: TraceSpan = {
        spanId: `span_${index}`,
        traceId,
        parentSpanId: index > 0 ? `span_${index - 1}` : undefined,
        service,
        operation: `${service.toLowerCase()}_operation`,
        startTime: currentTime,
        endTime: currentTime + duration,
        duration,
        tags: {
          'http.method': 'POST',
          'http.url': `/${service.toLowerCase()}/api`,
          'http.status_code': hasError ? 500 : 200,
          'user.id': '12345'
        },
        status: hasError ? 'error' : 'ok'
      };

      spans.push(span);
      currentTime += Math.floor(duration * 0.8); // Overlapping spans
    });

    const errors: TraceError[] = spans
      .filter(span => span.status === 'error')
      .map(span => ({
        spanId: span.spanId,
        service: span.service,
        error: 'Internal server error',
        timestamp: span.endTime
      }));

    const trace: DistributedTrace = {
      traceId,
      spans,
      services: [...new Set(spans.map(s => s.service))],
      totalDuration: Math.max(...spans.map(s => s.endTime)) - Math.min(...spans.map(s => s.startTime)),
      status: errors.length > 0 ? 'error' : 'success',
      errors
    };

    setTraces(prev => [...prev, trace]);
    setIsTracing(false);
  }, []);

  const analyzeTrace = useCallback((traceId: string) => {
    const trace = traces.find(t => t.traceId === traceId);
    if (!trace) return;

    const totalTime = trace.totalDuration;
    const bottlenecks: Bottleneck[] = trace.spans
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 3)
      .map(span => ({
        service: span.service,
        operation: span.operation,
        duration: span.duration,
        percentage: (span.duration / totalTime) * 100
      }));

    const networkTime = trace.spans.reduce((sum, span, index) => {
      if (index === 0) return sum;
      const prevSpan = trace.spans[index - 1];
      return sum + Math.max(0, span.startTime - prevSpan.endTime);
    }, 0);

    const serviceTime = trace.spans.reduce((sum, span) => sum + span.duration, 0);
    const errorRate = trace.errors.length / trace.spans.length;

    const analysis: TraceAnalysis = {
      traceId,
      bottlenecks,
      performance: {
        totalTime,
        networkTime,
        serviceTime,
        errorRate,
        throughput: 1000 / totalTime // requests per second theoretical
      },
      dependencies: trace.spans.map(span => ({
        service: span.service,
        type: 'synchronous',
        timeout: 5000,
        retries: 3
      })),
      recommendations: [
        ...(bottlenecks.length > 0 ? [`Optimize ${bottlenecks[0].service} - highest latency contributor`] : []),
        ...(networkTime > totalTime * 0.3 ? ['Consider service co-location to reduce network overhead'] : []),
        ...(errorRate > 0.1 ? ['Investigate error patterns and implement circuit breakers'] : []),
        ...(totalTime > 1000 ? ['Consider implementing caching or async processing'] : [])
      ]
    };

    setTraceAnalyses(prev => [...prev.filter(a => a.traceId !== traceId), analysis]);
  }, [traces]);

  const simulateTraceScenarios = useCallback(async () => {
    setIsTracing(true);

    // Generate multiple trace scenarios
    const scenarios = ['normal_flow', 'high_load', 'service_failure', 'network_issues'];
    
    for (const scenario of scenarios) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const traceId = `${scenario}_${Date.now()}`;
      const services = ['WebApp', 'UserService', 'OrderService', 'PaymentService'];
      const spans: TraceSpan[] = [];
      let currentTime = Date.now();

      services.forEach((service, index) => {
        let duration = Math.floor(Math.random() * 200) + 50;
        let hasError = false;

        // Scenario-specific modifications
        switch (scenario) {
          case 'high_load':
            duration *= 3;
            break;
          case 'service_failure':
            if (service === 'PaymentService') {
              hasError = true;
              duration *= 10;
            }
            break;
          case 'network_issues':
            duration += Math.floor(Math.random() * 1000) + 200;
            break;
        }

        const span: TraceSpan = {
          spanId: `${scenario}_span_${index}`,
          traceId,
          parentSpanId: index > 0 ? `${scenario}_span_${index - 1}` : undefined,
          service,
          operation: `${service.toLowerCase()}_${scenario}`,
          startTime: currentTime,
          endTime: currentTime + duration,
          duration,
          tags: {
            'scenario': scenario,
            'http.method': 'POST',
            'http.status_code': hasError ? 500 : 200
          },
          status: hasError ? 'error' : 'ok'
        };

        spans.push(span);
        currentTime += Math.floor(duration * 0.7);
      });

      const errors: TraceError[] = spans
        .filter(span => span.status === 'error')
        .map(span => ({
          spanId: span.spanId,
          service: span.service,
          error: `${scenario} error simulation`,
          timestamp: span.endTime
        }));

      const trace: DistributedTrace = {
        traceId,
        spans,
        services: [...new Set(spans.map(s => s.service))],
        totalDuration: Math.max(...spans.map(s => s.endTime)) - Math.min(...spans.map(s => s.startTime)),
        status: errors.length > 0 ? 'error' : 'success',
        errors
      };

      setTraces(prev => [...prev, trace]);
    }

    setIsTracing(false);
  }, []);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>Distributed Tracer</Text>
          <Group>
            <Button 
              onClick={generateTrace}
              variant="light"
              size="sm"
              loading={isTracing}
            >
              Generate Trace
            </Button>
            <Button 
              onClick={simulateTraceScenarios}
              variant="light"
              size="sm"
              loading={isTracing}
            >
              Scenario Testing
            </Button>
          </Group>
        </Group>

        {traces.slice(-5).reverse().map((trace, index) => (
          <Card key={index} withBorder>
            <Group justify="apart" mb="md">
              <Group>
                <Text fw={500}>Trace {trace.traceId.split('_').slice(-1)[0]}</Text>
                <Badge color={
                  trace.status === 'success' ? 'green' : 
                  trace.status === 'error' ? 'red' : 'orange'
                }>
                  {trace.status}
                </Badge>
                <Text size="sm" c="dimmed">{trace.totalDuration}ms</Text>
              </Group>
              <Button 
                onClick={() => analyzeTrace(trace.traceId)}
                size="xs"
                variant="light"
              >
                Analyze
              </Button>
            </Group>

            <Group mb="sm">
              <Text size="sm">Services: {trace.services.length}</Text>
              <Text size="sm">Spans: {trace.spans.length}</Text>
              <Text size="sm">Errors: {trace.errors.length}</Text>
            </Group>

            <Stack gap="xs" mb="sm">
              {trace.spans.map((span, idx) => (
                <Group key={idx} justify="apart">
                  <Group>
                    <Badge 
                      size="xs" 
                      color={span.status === 'ok' ? 'green' : 'red'}
                      variant="light"
                    >
                      {span.service}
                    </Badge>
                    <Text size="sm">{span.operation}</Text>
                  </Group>
                  <Text size="xs" c="dimmed">{span.duration}ms</Text>
                </Group>
              ))}
            </Stack>

            {trace.errors.length > 0 && (
              <Alert color="red" size="sm" mb="sm">
                <Text fw={500} mb="xs">Errors:</Text>
                <Stack gap="xs">
                  {trace.errors.map((error, idx) => (
                    <Text key={idx} size="sm">
                      {error.service}: {error.error}
                    </Text>
                  ))}
                </Stack>
              </Alert>
            )}

            {traceAnalyses
              .filter(analysis => analysis.traceId === trace.traceId)
              .map((analysis, idx) => (
                <Alert key={idx} color="blue" size="sm">
                  <Text fw={500} mb="sm">Trace Analysis</Text>
                  
                  <Group mb="sm" grow>
                    <div>
                      <Text size="xs" c="dimmed">Total Time</Text>
                      <Text size="sm">{analysis.performance.totalTime}ms</Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed">Network Time</Text>
                      <Text size="sm">{analysis.performance.networkTime}ms</Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed">Error Rate</Text>
                      <Text size="sm">{(analysis.performance.errorRate * 100).toFixed(1)}%</Text>
                    </div>
                  </Group>

                  {analysis.bottlenecks.length > 0 && (
                    <div>
                      <Text fw={500} size="sm" mb="xs">Top Bottlenecks:</Text>
                      <Stack gap="xs" mb="sm">
                        {analysis.bottlenecks.map((bottleneck, bIdx) => (
                          <Group key={bIdx} justify="apart">
                            <Text size="sm">{bottleneck.service}</Text>
                            <Badge size="xs" variant="light">
                              {bottleneck.percentage.toFixed(1)}%
                            </Badge>
                          </Group>
                        ))}
                      </Stack>
                    </div>
                  )}

                  {analysis.recommendations.length > 0 && (
                    <div>
                      <Text fw={500} size="sm" mb="xs">Recommendations:</Text>
                      <Stack gap="xs">
                        {analysis.recommendations.map((rec, rIdx) => (
                          <Text key={rIdx} size="sm">• {rec}</Text>
                        ))}
                      </Stack>
                    </div>
                  )}
                </Alert>
              ))
            }
          </Card>
        ))}
      </Stack>
    </Card>
  );
};

// ===== MAIN COMPONENT =====

export const MicroservicesTestingStrategiesExercise: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <Stack>
        <div>
          <h1>Microservices Testing Strategies</h1>
          <p>Distributed systems testing with service orchestration, contract management, and chaos engineering</p>
        </div>

        <Tabs defaultValue="orchestrator">
          <Tabs.List>
            <Tabs.Tab value="orchestrator">Service Orchestrator</Tabs.Tab>
            <Tabs.Tab value="contracts">Contract Registry</Tabs.Tab>
            <Tabs.Tab value="mocks">Service Mocks</Tabs.Tab>
            <Tabs.Tab value="tracing">Distributed Tracing</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="orchestrator" pt="md">
            <ServiceTestOrchestrator />
          </Tabs.Panel>

          <Tabs.Panel value="contracts" pt="md">
            <ContractRegistry />
          </Tabs.Panel>

          <Tabs.Panel value="mocks" pt="md">
            <ServiceMockManager />
          </Tabs.Panel>

          <Tabs.Panel value="tracing" pt="md">
            <DistributedTracer />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </div>
  );
};

export default MicroservicesTestingStrategiesExercise;