import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Title, Text, Button, Group, Badge, Stack, Progress, Tabs, Code, Alert, Grid, Select } from '@mantine/core';

interface DeploymentConfig {
  environment: 'staging' | 'production';
  strategy: 'blue-green' | 'rolling' | 'canary';
  replicas: number;
  resources: {
    cpu: string;
    memory: string;
  };
  healthCheck: {
    path: string;
    interval: number;
    timeout: number;
    retries: number;
  };
}

interface ScalingMetrics {
  cpuUtilization: number;
  memoryUtilization: number;
  requestsPerSecond: number;
  responseTime: number;
  errorRate: number;
  activeConnections: number;
}

interface HealthCheckResult {
  endpoint: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  timestamp: number;
  checks: {
    database: boolean;
    cache: boolean;
    external_apis: boolean;
    disk_space: boolean;
  };
}

interface DeploymentEvent {
  id: string;
  type: 'deploy' | 'scale' | 'rollback' | 'health_check';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: number;
  details: string;
  version?: string;
  replicas?: number;
}

export class DeploymentOrchestrator {
  private config: DeploymentConfig;
  private currentVersion: string = 'v1.0.0';
  private deploymentEvents: DeploymentEvent[] = [];
  private onEvent?: (event: DeploymentEvent) => void;

  constructor(config: DeploymentConfig) {
    this.config = config;
  }

  setOnEvent(callback: (event: DeploymentEvent) => void): void {
    this.onEvent = callback;
  }

  async deploy(version: string, strategy: DeploymentConfig['strategy'] = 'blue-green'): Promise<boolean> {
    const deploymentId = `deploy-${Date.now()}`;
    
    this.emitEvent({
      id: deploymentId,
      type: 'deploy',
      status: 'pending',
      timestamp: Date.now(),
      details: `Starting ${strategy} deployment for version ${version}`,
      version
    });

    try {
      switch (strategy) {
        case 'blue-green':
          return await this.blueGreenDeploy(deploymentId, version);
        case 'rolling':
          return await this.rollingDeploy(deploymentId, version);
        case 'canary':
          return await this.canaryDeploy(deploymentId, version);
        default:
          throw new Error(`Unknown deployment strategy: ${strategy}`);
      }
    } catch (error) {
      this.emitEvent({
        id: deploymentId,
        type: 'deploy',
        status: 'failed',
        timestamp: Date.now(),
        details: `Deployment failed: ${error}`,
        version
      });
      return false;
    }
  }

  private async blueGreenDeploy(deploymentId: string, version: string): Promise<boolean> {
    const stages = [
      'Creating green environment',
      'Deploying to green environment',
      'Running health checks',
      'Switching traffic to green',
      'Terminating blue environment'
    ];

    for (let i = 0; i < stages.length; i++) {
      this.emitEvent({
        id: `${deploymentId}-stage-${i}`,
        type: 'deploy',
        status: 'in_progress',
        timestamp: Date.now(),
        details: stages[i],
        version
      });

      await this.simulateAsyncOperation(2000);

      if (i === 2) {
        const healthCheck = await this.performHealthCheck();
        if (!healthCheck) {
          throw new Error('Health check failed');
        }
      }
    }

    this.currentVersion = version;
    this.emitEvent({
      id: deploymentId,
      type: 'deploy',
      status: 'completed',
      timestamp: Date.now(),
      details: `Blue-green deployment completed successfully`,
      version
    });

    return true;
  }

  private async rollingDeploy(deploymentId: string, version: string): Promise<boolean> {
    const totalReplicas = this.config.replicas;
    const batchSize = Math.ceil(totalReplicas / 3);

    for (let batch = 0; batch < Math.ceil(totalReplicas / batchSize); batch++) {
      const startReplica = batch * batchSize;
      const endReplica = Math.min(startReplica + batchSize, totalReplicas);

      this.emitEvent({
        id: `${deploymentId}-batch-${batch}`,
        type: 'deploy',
        status: 'in_progress',
        timestamp: Date.now(),
        details: `Updating replicas ${startReplica + 1}-${endReplica}`,
        version
      });

      await this.simulateAsyncOperation(3000);

      const healthCheck = await this.performHealthCheck();
      if (!healthCheck) {
        throw new Error(`Health check failed for batch ${batch + 1}`);
      }
    }

    this.currentVersion = version;
    this.emitEvent({
      id: deploymentId,
      type: 'deploy',
      status: 'completed',
      timestamp: Date.now(),
      details: `Rolling deployment completed successfully`,
      version
    });

    return true;
  }

  private async canaryDeploy(deploymentId: string, version: string): Promise<boolean> {
    const stages = [
      { name: 'Deploy 10% canary', percentage: 10 },
      { name: 'Monitor canary metrics', percentage: 10 },
      { name: 'Deploy 50% canary', percentage: 50 },
      { name: 'Monitor expanded canary', percentage: 50 },
      { name: 'Complete canary deployment', percentage: 100 }
    ];

    for (const stage of stages) {
      this.emitEvent({
        id: `${deploymentId}-${stage.name.replace(/\s+/g, '-')}`,
        type: 'deploy',
        status: 'in_progress',
        timestamp: Date.now(),
        details: `${stage.name} (${stage.percentage}% traffic)`,
        version
      });

      await this.simulateAsyncOperation(2500);

      if (stage.name.includes('Monitor')) {
        const metrics = await this.checkCanaryMetrics();
        if (!metrics.success) {
          throw new Error(`Canary metrics check failed: ${metrics.reason}`);
        }
      }
    }

    this.currentVersion = version;
    this.emitEvent({
      id: deploymentId,
      type: 'deploy',
      status: 'completed',
      timestamp: Date.now(),
      details: `Canary deployment completed successfully`,
      version
    });

    return true;
  }

  async rollback(targetVersion: string = this.getPreviousVersion()): Promise<boolean> {
    const rollbackId = `rollback-${Date.now()}`;

    this.emitEvent({
      id: rollbackId,
      type: 'rollback',
      status: 'in_progress',
      timestamp: Date.now(),
      details: `Rolling back to version ${targetVersion}`,
      version: targetVersion
    });

    try {
      await this.simulateAsyncOperation(5000);

      this.currentVersion = targetVersion;
      this.emitEvent({
        id: rollbackId,
        type: 'rollback',
        status: 'completed',
        timestamp: Date.now(),
        details: `Rollback completed successfully`,
        version: targetVersion
      });

      return true;
    } catch (error) {
      this.emitEvent({
        id: rollbackId,
        type: 'rollback',
        status: 'failed',
        timestamp: Date.now(),
        details: `Rollback failed: ${error}`,
        version: targetVersion
      });
      return false;
    }
  }

  private async performHealthCheck(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.1);
      }, 1000);
    });
  }

  private async checkCanaryMetrics(): Promise<{ success: boolean; reason?: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.15;
        resolve({
          success,
          reason: success ? undefined : 'Error rate increased significantly'
        });
      }, 1500);
    });
  }

  private getPreviousVersion(): string {
    const versions = ['v1.0.0', 'v1.1.0', 'v1.2.0', 'v2.0.0'];
    const currentIndex = versions.indexOf(this.currentVersion);
    return currentIndex > 0 ? versions[currentIndex - 1] : versions[0];
  }

  private async simulateAsyncOperation(delay: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  private emitEvent(event: DeploymentEvent): void {
    this.deploymentEvents.push(event);
    this.onEvent?.(event);
  }

  getCurrentVersion(): string {
    return this.currentVersion;
  }

  getDeploymentHistory(): DeploymentEvent[] {
    return [...this.deploymentEvents];
  }
}

export class LoadBalancer {
  private upstreamServers: Map<string, { weight: number; healthy: boolean }> = new Map();
  private algorithm: 'round-robin' | 'weighted' | 'least-connections' = 'round-robin';
  private currentIndex = 0;

  addServer(id: string, weight: number = 1): void {
    this.upstreamServers.set(id, { weight, healthy: true });
  }

  removeServer(id: string): void {
    this.upstreamServers.delete(id);
  }

  setServerHealth(id: string, healthy: boolean): void {
    const server = this.upstreamServers.get(id);
    if (server) {
      server.healthy = healthy;
    }
  }

  getNextServer(): string | null {
    const healthyServers = Array.from(this.upstreamServers.entries())
      .filter(([_, server]) => server.healthy);

    if (healthyServers.length === 0) return null;

    switch (this.algorithm) {
      case 'round-robin':
        const server = healthyServers[this.currentIndex % healthyServers.length];
        this.currentIndex++;
        return server[0];
      
      case 'weighted':
        return this.weightedSelection(healthyServers);
      
      case 'least-connections':
        return healthyServers[0][0];
      
      default:
        return healthyServers[0][0];
    }
  }

  private weightedSelection(servers: [string, { weight: number; healthy: boolean }][]): string {
    const totalWeight = servers.reduce((sum, [_, server]) => sum + server.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const [id, server] of servers) {
      random -= server.weight;
      if (random <= 0) return id;
    }
    
    return servers[0][0];
  }

  setAlgorithm(algorithm: 'round-robin' | 'weighted' | 'least-connections'): void {
    this.algorithm = algorithm;
  }

  getServerStatus(): Array<{ id: string; healthy: boolean; weight: number }> {
    return Array.from(this.upstreamServers.entries()).map(([id, server]) => ({
      id,
      healthy: server.healthy,
      weight: server.weight
    }));
  }
}

export class AutoScaler {
  private config: {
    minReplicas: number;
    maxReplicas: number;
    targetCpuUtilization: number;
    scaleUpCooldown: number;
    scaleDownCooldown: number;
  };
  private currentReplicas = 3;
  private lastScaleEvent = 0;
  private onScale?: (replicas: number, reason: string) => void;

  constructor(config: AutoScaler['config']) {
    this.config = config;
    this.currentReplicas = config.minReplicas;
  }

  setOnScale(callback: (replicas: number, reason: string) => void): void {
    this.onScale = callback;
  }

  evaluateScaling(metrics: ScalingMetrics): void {
    const now = Date.now();
    const timeSinceLastScale = now - this.lastScaleEvent;

    const shouldScaleUp = 
      metrics.cpuUtilization > this.config.targetCpuUtilization &&
      this.currentReplicas < this.config.maxReplicas &&
      timeSinceLastScale > this.config.scaleUpCooldown;

    const shouldScaleDown = 
      metrics.cpuUtilization < this.config.targetCpuUtilization * 0.7 &&
      this.currentReplicas > this.config.minReplicas &&
      timeSinceLastScale > this.config.scaleDownCooldown;

    if (shouldScaleUp) {
      this.scaleUp(metrics);
    } else if (shouldScaleDown) {
      this.scaleDown(metrics);
    }
  }

  private scaleUp(metrics: ScalingMetrics): void {
    const newReplicas = Math.min(
      this.config.maxReplicas,
      Math.ceil(this.currentReplicas * 1.5)
    );
    
    this.currentReplicas = newReplicas;
    this.lastScaleEvent = Date.now();
    
    this.onScale?.(
      newReplicas,
      `Scaled up due to high CPU utilization (${metrics.cpuUtilization.toFixed(1)}%)`
    );
  }

  private scaleDown(metrics: ScalingMetrics): void {
    const newReplicas = Math.max(
      this.config.minReplicas,
      Math.floor(this.currentReplicas * 0.7)
    );
    
    this.currentReplicas = newReplicas;
    this.lastScaleEvent = Date.now();
    
    this.onScale?.(
      newReplicas,
      `Scaled down due to low CPU utilization (${metrics.cpuUtilization.toFixed(1)}%)`
    );
  }

  getCurrentReplicas(): number {
    return this.currentReplicas;
  }

  getScalingConfig(): typeof this.config {
    return { ...this.config };
  }
}

export class HealthChecker {
  private endpoints: Map<string, HealthCheckResult> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private onHealthChange?: (result: HealthCheckResult) => void;

  setOnHealthChange(callback: (result: HealthCheckResult) => void): void {
    this.onHealthChange = callback;
  }

  startChecking(interval: number = 30000): void {
    this.checkInterval = setInterval(() => {
      this.performHealthChecks();
    }, interval);
  }

  stopChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  addEndpoint(endpoint: string): void {
    this.endpoints.set(endpoint, {
      endpoint,
      status: 'healthy',
      responseTime: 0,
      timestamp: Date.now(),
      checks: {
        database: true,
        cache: true,
        external_apis: true,
        disk_space: true
      }
    });
  }

  private async performHealthChecks(): Promise<void> {
    for (const endpoint of this.endpoints.keys()) {
      const result = await this.checkEndpoint(endpoint);
      this.endpoints.set(endpoint, result);
      this.onHealthChange?.(result);
    }
  }

  private async checkEndpoint(endpoint: string): Promise<HealthCheckResult> {
    const startTime = performance.now();
    
    try {
      await this.simulateHealthCheck();
      
      const responseTime = performance.now() - startTime;
      const status = this.determineHealthStatus(responseTime);
      
      return {
        endpoint,
        status,
        responseTime,
        timestamp: Date.now(),
        checks: {
          database: Math.random() > 0.05,
          cache: Math.random() > 0.02,
          external_apis: Math.random() > 0.1,
          disk_space: Math.random() > 0.01
        }
      };
    } catch (error) {
      return {
        endpoint,
        status: 'unhealthy',
        responseTime: performance.now() - startTime,
        timestamp: Date.now(),
        checks: {
          database: false,
          cache: false,
          external_apis: false,
          disk_space: false
        }
      };
    }
  }

  private async simulateHealthCheck(): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.95) {
          reject(new Error('Health check failed'));
        } else {
          resolve();
        }
      }, Math.random() * 1000);
    });
  }

  private determineHealthStatus(responseTime: number): HealthCheckResult['status'] {
    if (responseTime > 5000) return 'unhealthy';
    if (responseTime > 2000) return 'degraded';
    return 'healthy';
  }

  getHealthResults(): HealthCheckResult[] {
    return Array.from(this.endpoints.values());
  }
}

const DemoDeploymentScaling: React.FC = () => {
  const [deploymentOrchestrator] = useState(() => new DeploymentOrchestrator({
    environment: 'production',
    strategy: 'blue-green',
    replicas: 3,
    resources: { cpu: '500m', memory: '1Gi' },
    healthCheck: { path: '/health', interval: 30, timeout: 5, retries: 3 }
  }));

  const [loadBalancer] = useState(() => {
    const lb = new LoadBalancer();
    lb.addServer('server-1', 1);
    lb.addServer('server-2', 1);
    lb.addServer('server-3', 2);
    return lb;
  });

  const [autoScaler] = useState(() => new AutoScaler({
    minReplicas: 2,
    maxReplicas: 10,
    targetCpuUtilization: 70,
    scaleUpCooldown: 300000,
    scaleDownCooldown: 600000
  }));

  const [healthChecker] = useState(() => {
    const hc = new HealthChecker();
    hc.addEndpoint('/api/health');
    hc.addEndpoint('/api/ready');
    return hc;
  });

  const [deploymentEvents, setDeploymentEvents] = useState<DeploymentEvent[]>([]);
  const [healthResults, setHealthResults] = useState<HealthCheckResult[]>([]);
  const [scalingEvents, setScalingEvents] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStrategy, setDeploymentStrategy] = useState<'blue-green' | 'rolling' | 'canary'>('blue-green');

  const [currentMetrics] = useState<ScalingMetrics>({
    cpuUtilization: 45,
    memoryUtilization: 60,
    requestsPerSecond: 1200,
    responseTime: 150,
    errorRate: 0.5,
    activeConnections: 500
  });

  useEffect(() => {
    deploymentOrchestrator.setOnEvent((event) => {
      setDeploymentEvents(prev => [event, ...prev.slice(0, 9)]);
    });

    autoScaler.setOnScale((replicas, reason) => {
      setScalingEvents(prev => [
        `${new Date().toLocaleTimeString()}: ${reason} (${replicas} replicas)`,
        ...prev.slice(0, 4)
      ]);
    });

    healthChecker.setOnHealthChange((result) => {
      setHealthResults(prev => {
        const updated = [...prev];
        const index = updated.findIndex(r => r.endpoint === result.endpoint);
        if (index >= 0) {
          updated[index] = result;
        } else {
          updated.push(result);
        }
        return updated;
      });
    });

    healthChecker.startChecking();

    return () => {
      healthChecker.stopChecking();
    };
  }, [deploymentOrchestrator, autoScaler, healthChecker]);

  const handleDeploy = useCallback(async () => {
    setIsDeploying(true);
    const version = `v${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`;
    
    try {
      await deploymentOrchestrator.deploy(version, deploymentStrategy);
    } finally {
      setIsDeploying(false);
    }
  }, [deploymentOrchestrator, deploymentStrategy]);

  const handleRollback = useCallback(async () => {
    setIsDeploying(true);
    try {
      await deploymentOrchestrator.rollback();
    } finally {
      setIsDeploying(false);
    }
  }, [deploymentOrchestrator]);

  const simulateLoad = useCallback(() => {
    const newMetrics = {
      ...currentMetrics,
      cpuUtilization: Math.min(100, currentMetrics.cpuUtilization + Math.random() * 30),
      requestsPerSecond: currentMetrics.requestsPerSecond + Math.random() * 500
    };
    
    autoScaler.evaluateScaling(newMetrics);
  }, [autoScaler, currentMetrics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'degraded': return 'yellow';
      case 'unhealthy': return 'red';
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'in_progress': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Title order={1} mb="md">SSR Deployment & Scaling</Title>
      <Text mb="xl" c="dimmed">
        Enterprise deployment strategies with auto-scaling and health monitoring
      </Text>

      <Tabs defaultValue="deployment" className="w-full">
        <Tabs.List>
          <Tabs.Tab value="deployment">Deployment</Tabs.Tab>
          <Tabs.Tab value="scaling">Auto Scaling</Tabs.Tab>
          <Tabs.Tab value="health">Health Checks</Tabs.Tab>
          <Tabs.Tab value="load-balancer">Load Balancer</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="deployment" pt="md">
          <Grid>
            <Grid.Col span={6}>
              <Card>
                <Title order={3} mb="md">Deployment Control</Title>
                
                <Stack gap="md">
                  <Select
                    label="Deployment Strategy"
                    value={deploymentStrategy}
                    onChange={(value) => setDeploymentStrategy(value as any)}
                    data={[
                      { value: 'blue-green', label: 'Blue-Green Deployment' },
                      { value: 'rolling', label: 'Rolling Deployment' },
                      { value: 'canary', label: 'Canary Deployment' }
                    ]}
                    disabled={isDeploying}
                  />
                  
                  <Group>
                    <Button 
                      onClick={handleDeploy} 
                      loading={isDeploying}
                      disabled={isDeploying}
                    >
                      Deploy New Version
                    </Button>
                    <Button 
                      onClick={handleRollback} 
                      loading={isDeploying}
                      disabled={isDeploying}
                      color="red"
                      variant="outline"
                    >
                      Rollback
                    </Button>
                  </Group>

                  <div>
                    <Text size="sm" c="dimmed">Current Version</Text>
                    <Badge size="lg" color="green">
                      {deploymentOrchestrator.getCurrentVersion()}
                    </Badge>
                  </div>
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={6}>
              <Card>
                <Title order={4} mb="md">Deployment Events</Title>
                <Stack gap="xs">
                  {deploymentEvents.length === 0 ? (
                    <Text c="dimmed" size="sm">No deployment events</Text>
                  ) : (
                    deploymentEvents.map((event, index) => (
                      <div key={index}>
                        <Group gap="xs">
                          <Badge color={getStatusColor(event.status)} size="sm">
                            {event.status}
                          </Badge>
                          <Text size="sm">{event.details}</Text>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </Text>
                      </div>
                    ))
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="scaling" pt="md">
          <Grid>
            <Grid.Col span={8}>
              <Card>
                <Title order={3} mb="md">Auto Scaling Configuration</Title>
                
                <Group grow mb="md">
                  <div>
                    <Text size="sm" c="dimmed">Min Replicas</Text>
                    <Text size="xl" fw={500}>2</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Max Replicas</Text>
                    <Text size="xl" fw={500}>10</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Current Replicas</Text>
                    <Text size="xl" fw={500} c="blue">
                      {autoScaler.getCurrentReplicas()}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Target CPU</Text>
                    <Text size="xl" fw={500}>70%</Text>
                  </div>
                </Group>

                <div>
                  <Text size="sm" c="dimmed" mb="xs">Current CPU Utilization</Text>
                  <Progress 
                    value={currentMetrics.cpuUtilization} 
                    color={currentMetrics.cpuUtilization > 70 ? 'red' : 'green'}
                    size="lg"
                  />
                  <Text size="sm" mt="xs">{currentMetrics.cpuUtilization.toFixed(1)}%</Text>
                </div>

                <Button mt="md" onClick={simulateLoad}>
                  Simulate Load Spike
                </Button>
              </Card>
            </Grid.Col>

            <Grid.Col span={4}>
              <Card>
                <Title order={4} mb="md">Scaling Events</Title>
                <Stack gap="xs">
                  {scalingEvents.length === 0 ? (
                    <Text c="dimmed" size="sm">No scaling events</Text>
                  ) : (
                    scalingEvents.map((event, index) => (
                      <Text key={index} size="sm">{event}</Text>
                    ))
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="health" pt="md">
          <Stack gap="md">
            {healthResults.map((result, index) => (
              <Card key={index}>
                <Group justify="apart" mb="md">
                  <Title order={4}>{result.endpoint}</Title>
                  <Badge color={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </Group>

                <Group>
                  <Text size="sm">Response Time: {result.responseTime.toFixed(0)}ms</Text>
                  <Text size="sm">
                    Last Check: {new Date(result.timestamp).toLocaleTimeString()}
                  </Text>
                </Group>

                <Group mt="md">
                  <Badge color={result.checks.database ? 'green' : 'red'} variant="light">
                    Database
                  </Badge>
                  <Badge color={result.checks.cache ? 'green' : 'red'} variant="light">
                    Cache
                  </Badge>
                  <Badge color={result.checks.external_apis ? 'green' : 'red'} variant="light">
                    External APIs
                  </Badge>
                  <Badge color={result.checks.disk_space ? 'green' : 'red'} variant="light">
                    Disk Space
                  </Badge>
                </Group>
              </Card>
            ))}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="load-balancer" pt="md">
          <Card>
            <Title order={3} mb="md">Load Balancer Status</Title>
            
            <Stack gap="md">
              {loadBalancer.getServerStatus().map((server, index) => (
                <Group key={index} justify="apart">
                  <Group>
                    <Text fw={500}>{server.id}</Text>
                    <Badge color={server.healthy ? 'green' : 'red'}>
                      {server.healthy ? 'Healthy' : 'Unhealthy'}
                    </Badge>
                  </Group>
                  <Text>Weight: {server.weight}</Text>
                </Group>
              ))}
            </Stack>

            <Group mt="md">
              <Text size="sm" c="dimmed">
                Next Server: {loadBalancer.getNextServer() || 'None available'}
              </Text>
            </Group>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default DemoDeploymentScaling;