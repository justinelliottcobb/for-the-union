import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// =============================================================================
// SOLUTION: Test Architecture Patterns - Scalable Test Architecture for Large Applications
// =============================================================================
// Complete implementation demonstrating sophisticated test architecture patterns
// Used by Staff Frontend Engineers for enterprise-scale testing systems
// =============================================================================

// =============================================================================
// TYPE DEFINITIONS AND INTERFACES
// =============================================================================

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  categories: string[];
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  estimatedDuration: number;
  parallelizable: boolean;
  resourceRequirements: ResourceRequirements;
  tests: TestCase[];
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  suiteId: string;
  fn: () => Promise<TestResult>;
  timeout: number;
  retries: number;
  tags: string[];
  prerequisites: string[];
}

export interface TestResult {
  id: string;
  testId: string;
  suiteId: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration: number;
  error?: TestError;
  metadata: Record<string, any>;
  timestamp: Date;
  retryCount: number;
}

export interface TestError {
  message: string;
  stack?: string;
  type: 'assertion' | 'timeout' | 'setup' | 'teardown' | 'system';
  category: 'configuration' | 'environment' | 'data' | 'logic' | 'infrastructure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestions: string[];
}

export interface ResourceRequirements {
  memory: number;
  cpu: number;
  database: boolean;
  network: boolean;
  filesystem: boolean;
  externalServices: string[];
}

export interface TestFrameworkConfig {
  discovery: {
    patterns: string[];
    excludePatterns: string[];
    testCategories: TestCategory[];
    maxDepth: number;
  };
  execution: {
    parallel: boolean;
    maxWorkers: number;
    timeout: number;
    retries: number;
    bail: boolean;
    randomize: boolean;
  };
  reporting: {
    formats: ReportFormat[];
    outputs: OutputTarget[];
    realTime: boolean;
    includeMetrics: boolean;
  };
  integrations: {
    cicd: CICDConfig;
    monitoring: MonitoringConfig;
    notifications: NotificationConfig;
  };
}

export interface TestCategory {
  name: string;
  pattern: string;
  priority: number;
  parallel: boolean;
  timeout: number;
}

export interface ReportFormat {
  type: 'console' | 'json' | 'html' | 'junit' | 'lcov' | 'custom';
  options: Record<string, any>;
}

export interface OutputTarget {
  type: 'file' | 'console' | 'webhook' | 's3' | 'database';
  destination: string;
  format: string;
}

export interface CICDConfig {
  platform: 'github' | 'gitlab' | 'jenkins' | 'azure' | 'circleci';
  qualityGates: QualityGate[];
  artifactUpload: boolean;
  notifications: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  endpoint: string;
  metrics: string[];
  alerts: AlertConfig[];
}

export interface NotificationConfig {
  channels: NotificationChannel[];
  conditions: NotificationCondition[];
}

export interface QualityGate {
  name: string;
  conditions: QualityCondition[];
  actions: QualityAction[];
  stakeholders: string[];
  blocking: boolean;
}

export interface QualityCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq';
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface QualityAction {
  type: 'notify' | 'block' | 'retry' | 'escalate';
  target: string;
  parameters: Record<string, any>;
}

export interface AlertConfig {
  condition: string;
  threshold: number;
  recipients: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'teams' | 'webhook';
  target: string;
  template: string;
}

export interface NotificationCondition {
  event: string;
  filter: string;
  threshold?: number;
}

export interface WorkerPool {
  id: string;
  maxWorkers: number;
  currentWorkers: number;
  queue: TestCase[];
  running: Map<string, WorkerProcess>;
  completed: TestResult[];
  failed: TestResult[];
}

export interface WorkerProcess {
  id: string;
  pid: number;
  status: 'idle' | 'running' | 'crashed' | 'terminated';
  currentTest?: TestCase;
  startTime: Date;
  resources: ResourceUsage;
}

export interface ResourceUsage {
  memory: number;
  cpu: number;
  handles: number;
}

export interface TestOrchestrationPlan {
  phases: TestPhase[];
  dependencies: DependencyGraph;
  resourceRequirements: ResourceMap;
  executionStrategy: ExecutionStrategy;
  failureHandling: FailureStrategy;
  qualityGates: QualityGate[];
}

export interface TestPhase {
  id: string;
  name: string;
  suites: string[];
  parallel: boolean;
  timeout: number;
  prerequisites: string[];
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface DependencyNode {
  id: string;
  type: 'suite' | 'test' | 'resource';
  metadata: Record<string, any>;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'requires' | 'blocks' | 'enhances';
  weight: number;
}

export interface ResourceMap {
  [resourceId: string]: ResourceAllocation;
}

export interface ResourceAllocation {
  type: 'database' | 'service' | 'file' | 'network';
  capacity: number;
  allocated: number;
  queue: string[];
}

export interface ExecutionStrategy {
  type: 'sequential' | 'parallel' | 'hybrid' | 'adaptive';
  parameters: Record<string, any>;
  optimization: OptimizationStrategy;
}

export interface OptimizationStrategy {
  prioritization: 'risk' | 'duration' | 'failure-rate' | 'impact';
  loadBalancing: 'round-robin' | 'least-loaded' | 'resource-aware';
  scheduling: 'immediate' | 'batched' | 'smart';
}

export interface FailureStrategy {
  retries: RetryStrategy;
  isolation: IsolationStrategy;
  recovery: RecoveryStrategy;
  reporting: FailureReportingStrategy;
}

export interface RetryStrategy {
  maxRetries: number;
  backoff: 'linear' | 'exponential' | 'fixed';
  conditions: string[];
}

export interface IsolationStrategy {
  type: 'process' | 'container' | 'vm';
  cleanup: CleanupStrategy;
}

export interface CleanupStrategy {
  automatic: boolean;
  resources: string[];
  timeout: number;
}

export interface RecoveryStrategy {
  automatic: boolean;
  fallback: string;
  escalation: EscalationStrategy;
}

export interface EscalationStrategy {
  levels: EscalationLevel[];
  timeout: number;
}

export interface EscalationLevel {
  threshold: number;
  action: string;
  recipients: string[];
}

export interface FailureReportingStrategy {
  immediate: boolean;
  aggregation: AggregationStrategy;
  categorization: CategorizationStrategy;
}

export interface AggregationStrategy {
  window: number;
  groupBy: string[];
  threshold: number;
}

export interface CategorizationStrategy {
  rules: CategorizationRule[];
  machine_learning: boolean;
}

export interface CategorizationRule {
  pattern: string;
  category: string;
  severity: string;
  actions: string[];
}

export interface TestMetrics {
  execution: ExecutionMetrics;
  coverage: CoverageMetrics;
  performance: PerformanceMetrics;
  quality: QualityMetrics;
  trends: TrendMetrics;
}

export interface ExecutionMetrics {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  parallelization: number;
  efficiency: number;
}

export interface CoverageMetrics {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
  files: CoverageFile[];
}

export interface CoverageFile {
  path: string;
  coverage: number;
  uncoveredLines: number[];
}

export interface PerformanceMetrics {
  averageTestDuration: number;
  slowestTests: TestPerformance[];
  resourceUtilization: ResourceMetrics;
  bottlenecks: Bottleneck[];
}

export interface TestPerformance {
  testId: string;
  duration: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface ResourceMetrics {
  cpu: number;
  memory: number;
  io: number;
  network: number;
}

export interface Bottleneck {
  type: 'cpu' | 'memory' | 'io' | 'network' | 'database';
  severity: number;
  impact: string[];
  suggestions: string[];
}

export interface QualityMetrics {
  testReliability: number;
  falsePositives: number;
  falseNegatives: number;
  maintenanceIndex: number;
}

export interface TrendMetrics {
  passRate: TrendData;
  duration: TrendData;
  coverage: TrendData;
  flakiness: TrendData;
}

export interface TrendData {
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

// =============================================================================
// 1. TESTFRAMEWORK COMPONENT - Scalable Test Framework Architecture
// =============================================================================

export const TestFramework: React.FC<{ config: TestFrameworkConfig }> = ({ config }) => {
  const [discoveredTests, setDiscoveredTests] = useState<TestSuite[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testFilter, setTestFilter] = useState<string>('');

  // Test discovery and categorization
  const discoverTests = useCallback(async () => {
    setIsDiscovering(true);
    
    try {
      // Simulate test discovery process
      const mockTests: TestSuite[] = [
        {
          id: 'unit-tests',
          name: 'Unit Tests',
          description: 'Individual component and function tests',
          categories: ['unit', 'fast'],
          tags: ['unit', 'components', 'utilities'],
          priority: 'high',
          dependencies: [],
          estimatedDuration: 300000,
          parallelizable: true,
          resourceRequirements: {
            memory: 256,
            cpu: 0.5,
            database: false,
            network: false,
            filesystem: false,
            externalServices: []
          },
          tests: []
        },
        {
          id: 'integration-tests',
          name: 'Integration Tests',
          description: 'Component integration and API tests',
          categories: ['integration', 'medium'],
          tags: ['integration', 'api', 'database'],
          priority: 'high',
          dependencies: ['unit-tests'],
          estimatedDuration: 600000,
          parallelizable: true,
          resourceRequirements: {
            memory: 512,
            cpu: 1.0,
            database: true,
            network: true,
            filesystem: true,
            externalServices: ['database', 'redis']
          },
          tests: []
        },
        {
          id: 'e2e-tests',
          name: 'End-to-End Tests',
          description: 'Full user workflow tests',
          categories: ['e2e', 'slow'],
          tags: ['e2e', 'browser', 'workflows'],
          priority: 'medium',
          dependencies: ['integration-tests'],
          estimatedDuration: 1200000,
          parallelizable: false,
          resourceRequirements: {
            memory: 1024,
            cpu: 2.0,
            database: true,
            network: true,
            filesystem: true,
            externalServices: ['browser', 'database', 'external-api']
          },
          tests: []
        }
      ];

      setDiscoveredTests(mockTests);
      setCategories(config.discovery.testCategories);
    } catch (error) {
      console.error('Test discovery failed:', error);
    } finally {
      setIsDiscovering(false);
    }
  }, [config.discovery.testCategories]);

  // Filter tests based on category and search
  const filteredTests = useMemo(() => {
    return discoveredTests.filter(suite => {
      const matchesCategory = selectedCategory === 'all' || 
        suite.categories.includes(selectedCategory);
      const matchesFilter = !testFilter || 
        suite.name.toLowerCase().includes(testFilter.toLowerCase()) ||
        suite.description.toLowerCase().includes(testFilter.toLowerCase()) ||
        suite.tags.some(tag => tag.toLowerCase().includes(testFilter.toLowerCase()));
      
      return matchesCategory && matchesFilter;
    });
  }, [discoveredTests, selectedCategory, testFilter]);

  useEffect(() => {
    discoverTests();
  }, [discoverTests]);

  return (
    <div className="test-framework" data-testid="test-framework">
      <div className="framework-header">
        <h2>Test Framework</h2>
        <div className="framework-controls">
          <button 
            onClick={discoverTests}
            disabled={isDiscovering}
            className="discover-btn"
            data-testid="discover-tests-btn"
          >
            {isDiscovering ? 'Discovering...' : 'Discover Tests'}
          </button>
        </div>
      </div>

      <div className="framework-filters">
        <div className="category-filter">
          <label htmlFor="category-select">Category:</label>
          <select 
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            data-testid="category-filter"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.name} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="search-filter">
          <label htmlFor="test-search">Search:</label>
          <input
            id="test-search"
            type="text"
            value={testFilter}
            onChange={(e) => setTestFilter(e.target.value)}
            placeholder="Search tests, tags, or descriptions..."
            data-testid="test-search"
          />
        </div>
      </div>

      <div className="test-suites" data-testid="test-suites">
        {filteredTests.map(suite => (
          <div key={suite.id} className="test-suite" data-testid={`suite-${suite.id}`}>
            <div className="suite-header">
              <h3>{suite.name}</h3>
              <div className="suite-metadata">
                <span className="priority priority-{suite.priority}">{suite.priority}</span>
                <span className="duration">{(suite.estimatedDuration / 1000).toFixed(1)}s</span>
                <span className="parallelizable">{suite.parallelizable ? 'Parallel' : 'Sequential'}</span>
              </div>
            </div>
            
            <p className="suite-description">{suite.description}</p>
            
            <div className="suite-details">
              <div className="categories">
                <strong>Categories:</strong> {suite.categories.join(', ')}
              </div>
              <div className="tags">
                <strong>Tags:</strong> {suite.tags.join(', ')}
              </div>
              {suite.dependencies.length > 0 && (
                <div className="dependencies">
                  <strong>Dependencies:</strong> {suite.dependencies.join(', ')}
                </div>
              )}
              <div className="resources">
                <strong>Resources:</strong>
                {suite.resourceRequirements.database && ' Database'}
                {suite.resourceRequirements.network && ' Network'}
                {suite.resourceRequirements.filesystem && ' Filesystem'}
                {suite.resourceRequirements.externalServices.length > 0 && 
                  ` External: ${suite.resourceRequirements.externalServices.join(', ')}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="framework-stats" data-testid="framework-stats">
        <div className="stat">
          <label>Total Suites:</label>
          <span>{discoveredTests.length}</span>
        </div>
        <div className="stat">
          <label>Filtered Suites:</label>
          <span>{filteredTests.length}</span>
        </div>
        <div className="stat">
          <label>Parallelizable:</label>
          <span>{filteredTests.filter(s => s.parallelizable).length}</span>
        </div>
        <div className="stat">
          <label>Estimated Duration:</label>
          <span>{(filteredTests.reduce((sum, s) => sum + s.estimatedDuration, 0) / 1000).toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 2. TESTORCHESTRATOR COMPONENT - Test Execution Orchestration and Coordination
// =============================================================================

export const TestOrchestrator: React.FC<{ 
  suites: TestSuite[], 
  config: TestFrameworkConfig 
}> = ({ suites, config }) => {
  const [orchestrationPlan, setOrchestrationPlan] = useState<TestOrchestrationPlan | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'planning' | 'executing' | 'completed' | 'failed'>('idle');
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [phaseProgress, setPhaseProgress] = useState<Record<string, number>>({});
  const [resourceUsage, setResourceUsage] = useState<ResourceMap>({});

  // Create orchestration plan
  const createOrchestrationPlan = useCallback(async () => {
    setIsPlanning(true);
    setExecutionStatus('planning');

    try {
      // Build dependency graph
      const dependencyGraph: DependencyGraph = {
        nodes: suites.map(suite => ({
          id: suite.id,
          type: 'suite' as const,
          metadata: { 
            priority: suite.priority,
            parallelizable: suite.parallelizable,
            duration: suite.estimatedDuration
          }
        })),
        edges: suites.flatMap(suite => 
          suite.dependencies.map(dep => ({
            from: dep,
            to: suite.id,
            type: 'requires' as const,
            weight: 1
          }))
        )
      };

      // Create phases based on dependencies
      const phases: TestPhase[] = [
        {
          id: 'phase-1',
          name: 'Unit Tests Phase',
          suites: ['unit-tests'],
          parallel: true,
          timeout: 600000,
          prerequisites: []
        },
        {
          id: 'phase-2',
          name: 'Integration Tests Phase',
          suites: ['integration-tests'],
          parallel: true,
          timeout: 900000,
          prerequisites: ['phase-1']
        },
        {
          id: 'phase-3',
          name: 'End-to-End Tests Phase',
          suites: ['e2e-tests'],
          parallel: false,
          timeout: 1800000,
          prerequisites: ['phase-2']
        }
      ];

      // Calculate resource requirements
      const resourceRequirements: ResourceMap = {
        database: {
          type: 'database',
          capacity: 10,
          allocated: 0,
          queue: []
        },
        network: {
          type: 'network',
          capacity: 100,
          allocated: 0,
          queue: []
        },
        browser: {
          type: 'service',
          capacity: 5,
          allocated: 0,
          queue: []
        }
      };

      const plan: TestOrchestrationPlan = {
        phases,
        dependencies: dependencyGraph,
        resourceRequirements,
        executionStrategy: {
          type: 'hybrid',
          parameters: {
            maxParallelPhases: 2,
            resourceOptimization: true,
            failFast: config.execution.bail
          },
          optimization: {
            prioritization: 'risk',
            loadBalancing: 'resource-aware',
            scheduling: 'smart'
          }
        },
        failureHandling: {
          retries: {
            maxRetries: config.execution.retries,
            backoff: 'exponential',
            conditions: ['timeout', 'flaky']
          },
          isolation: {
            type: 'process',
            cleanup: {
              automatic: true,
              resources: ['temp-files', 'database-connections', 'browser-instances'],
              timeout: 30000
            }
          },
          recovery: {
            automatic: true,
            fallback: 'skip-failed-dependencies',
            escalation: {
              levels: [
                { threshold: 5, action: 'notify-team', recipients: ['team-lead'] },
                { threshold: 10, action: 'escalate-management', recipients: ['engineering-manager'] },
                { threshold: 20, action: 'emergency-response', recipients: ['on-call'] }
              ],
              timeout: 300000
            }
          },
          reporting: {
            immediate: true,
            aggregation: {
              window: 300000,
              groupBy: ['suite', 'category', 'error-type'],
              threshold: 3
            },
            categorization: {
              rules: [
                { pattern: 'timeout', category: 'performance', severity: 'medium', actions: ['investigate-performance'] },
                { pattern: 'assertion', category: 'logic', severity: 'high', actions: ['review-test-logic'] },
                { pattern: 'network', category: 'infrastructure', severity: 'low', actions: ['check-connectivity'] }
              ],
              machine_learning: false
            }
          }
        },
        qualityGates: config.integrations.cicd.qualityGates
      };

      setOrchestrationPlan(plan);
      setExecutionStatus('idle');
    } catch (error) {
      console.error('Failed to create orchestration plan:', error);
      setExecutionStatus('failed');
    } finally {
      setIsPlanning(false);
    }
  }, [suites, config]);

  // Execute orchestration plan
  const executeOrchestrationPlan = useCallback(async () => {
    if (!orchestrationPlan) return;

    setExecutionStatus('executing');

    try {
      for (const phase of orchestrationPlan.phases) {
        setCurrentPhase(phase.id);
        setPhaseProgress(prev => ({ ...prev, [phase.id]: 0 }));

        // Simulate phase execution
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setPhaseProgress(prev => ({ ...prev, [phase.id]: progress }));
        }

        // Update resource usage
        setResourceUsage(prev => ({
          ...prev,
          [`${phase.id}-resources`]: {
            type: 'service',
            capacity: 100,
            allocated: Math.floor(Math.random() * 80) + 20,
            queue: []
          }
        }));
      }

      setExecutionStatus('completed');
      setCurrentPhase(null);
    } catch (error) {
      console.error('Orchestration execution failed:', error);
      setExecutionStatus('failed');
    }
  }, [orchestrationPlan]);

  useEffect(() => {
    if (suites.length > 0) {
      createOrchestrationPlan();
    }
  }, [suites, createOrchestrationPlan]);

  return (
    <div className="test-orchestrator" data-testid="test-orchestrator">
      <div className="orchestrator-header">
        <h2>Test Orchestrator</h2>
        <div className="orchestrator-controls">
          <button 
            onClick={createOrchestrationPlan}
            disabled={isPlanning}
            className="plan-btn"
            data-testid="create-plan-btn"
          >
            {isPlanning ? 'Planning...' : 'Create Plan'}
          </button>
          <button 
            onClick={executeOrchestrationPlan}
            disabled={!orchestrationPlan || executionStatus === 'executing'}
            className="execute-btn"
            data-testid="execute-plan-btn"
          >
            {executionStatus === 'executing' ? 'Executing...' : 'Execute Plan'}
          </button>
        </div>
      </div>

      <div className="orchestrator-status" data-testid="orchestrator-status">
        <div className="status-item">
          <label>Status:</label>
          <span className={`status status-${executionStatus}`}>{executionStatus}</span>
        </div>
        {currentPhase && (
          <div className="status-item">
            <label>Current Phase:</label>
            <span>{orchestrationPlan?.phases.find(p => p.id === currentPhase)?.name}</span>
          </div>
        )}
      </div>

      {orchestrationPlan && (
        <div className="orchestration-plan" data-testid="orchestration-plan">
          <h3>Execution Plan</h3>
          
          <div className="execution-strategy">
            <h4>Strategy: {orchestrationPlan.executionStrategy.type}</h4>
            <div className="strategy-details">
              <div>Prioritization: {orchestrationPlan.executionStrategy.optimization.prioritization}</div>
              <div>Load Balancing: {orchestrationPlan.executionStrategy.optimization.loadBalancing}</div>
              <div>Scheduling: {orchestrationPlan.executionStrategy.optimization.scheduling}</div>
            </div>
          </div>

          <div className="phases">
            <h4>Execution Phases</h4>
            {orchestrationPlan.phases.map(phase => (
              <div key={phase.id} className="phase" data-testid={`phase-${phase.id}`}>
                <div className="phase-header">
                  <h5>{phase.name}</h5>
                  <div className="phase-metadata">
                    <span className="parallel">{phase.parallel ? 'Parallel' : 'Sequential'}</span>
                    <span className="timeout">{(phase.timeout / 1000).toFixed(0)}s timeout</span>
                  </div>
                </div>
                
                <div className="phase-suites">
                  <strong>Suites:</strong> {phase.suites.join(', ')}
                </div>
                
                {phase.prerequisites.length > 0 && (
                  <div className="phase-prerequisites">
                    <strong>Prerequisites:</strong> {phase.prerequisites.join(', ')}
                  </div>
                )}

                {phaseProgress[phase.id] !== undefined && (
                  <div className="phase-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${phaseProgress[phase.id]}%` }}
                      />
                    </div>
                    <span className="progress-text">{phaseProgress[phase.id]}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="resource-usage">
            <h4>Resource Usage</h4>
            {Object.entries(resourceUsage).map(([resourceId, allocation]) => (
              <div key={resourceId} className="resource-item">
                <div className="resource-header">
                  <span className="resource-name">{resourceId}</span>
                  <span className="resource-usage">{allocation.allocated}/{allocation.capacity}</span>
                </div>
                <div className="resource-bar">
                  <div 
                    className="resource-fill" 
                    style={{ width: `${(allocation.allocated / allocation.capacity) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="quality-gates">
            <h4>Quality Gates</h4>
            {orchestrationPlan.qualityGates.map((gate, index) => (
              <div key={index} className="quality-gate">
                <div className="gate-header">
                  <span className="gate-name">{gate.name}</span>
                  <span className={`gate-blocking ${gate.blocking ? 'blocking' : 'non-blocking'}`}>
                    {gate.blocking ? 'Blocking' : 'Non-blocking'}
                  </span>
                </div>
                <div className="gate-conditions">
                  {gate.conditions.map((condition, condIndex) => (
                    <div key={condIndex} className="condition">
                      {condition.metric} {condition.operator} {condition.threshold} ({condition.severity})
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// 3. PARALLELRUNNER COMPONENT - Parallel Test Execution and Worker Management
// =============================================================================

export const ParallelRunner: React.FC<{ 
  testCases: TestCase[], 
  maxWorkers?: number 
}> = ({ testCases, maxWorkers = 4 }) => {
  const [workerPool, setWorkerPool] = useState<WorkerPool>({
    id: 'main-pool',
    maxWorkers,
    currentWorkers: 0,
    queue: [],
    running: new Map(),
    completed: [],
    failed: []
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [executionStartTime, setExecutionStartTime] = useState<Date | null>(null);
  const [executionStats, setExecutionStats] = useState({
    totalTests: 0,
    completed: 0,
    failed: 0,
    duration: 0,
    throughput: 0
  });

  // Worker management
  const createWorker = useCallback((): WorkerProcess => {
    return {
      id: `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pid: Math.floor(Math.random() * 10000),
      status: 'idle',
      startTime: new Date(),
      resources: {
        memory: 0,
        cpu: 0,
        handles: 0
      }
    };
  }, []);

  const scaleWorkers = useCallback((targetWorkers: number) => {
    setWorkerPool(prev => {
      const newPool = { ...prev };
      
      if (targetWorkers > prev.currentWorkers) {
        // Scale up
        for (let i = prev.currentWorkers; i < targetWorkers; i++) {
          const worker = createWorker();
          newPool.running.set(worker.id, worker);
        }
        newPool.currentWorkers = targetWorkers;
      } else if (targetWorkers < prev.currentWorkers) {
        // Scale down
        const workersToRemove = Array.from(prev.running.keys()).slice(targetWorkers);
        workersToRemove.forEach(workerId => {
          const worker = newPool.running.get(workerId);
          if (worker && worker.status === 'idle') {
            newPool.running.delete(workerId);
          }
        });
        newPool.currentWorkers = newPool.running.size;
      }
      
      return newPool;
    });
  }, [createWorker]);

  // Test execution simulation
  const executeTest = useCallback(async (testCase: TestCase, workerId: string): Promise<TestResult> => {
    // Update worker status
    setWorkerPool(prev => {
      const newPool = { ...prev };
      const worker = newPool.running.get(workerId);
      if (worker) {
        worker.status = 'running';
        worker.currentTest = testCase;
        worker.resources = {
          memory: Math.floor(Math.random() * 512) + 128,
          cpu: Math.random() * 100,
          handles: Math.floor(Math.random() * 50) + 10
        };
      }
      return newPool;
    });

    // Simulate test execution
    const startTime = Date.now();
    const duration = Math.floor(Math.random() * 5000) + 1000; // 1-6 seconds
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    const passed = Math.random() > 0.1; // 90% pass rate
    
    const result: TestResult = {
      id: `result-${testCase.id}-${Date.now()}`,
      testId: testCase.id,
      suiteId: testCase.suiteId,
      name: testCase.name,
      status: passed ? 'passed' : 'failed',
      duration: Date.now() - startTime,
      timestamp: new Date(),
      retryCount: 0,
      metadata: {
        workerId,
        resourceUsage: {
          memory: Math.floor(Math.random() * 256) + 64,
          cpu: Math.random() * 50,
          io: Math.random() * 100
        }
      },
      ...(passed ? {} : {
        error: {
          message: `Test ${testCase.name} failed with assertion error`,
          type: 'assertion',
          category: 'logic',
          severity: 'medium',
          suggestions: [
            'Check test assertions',
            'Verify test data',
            'Review component behavior'
          ]
        }
      })
    };

    // Update worker status back to idle
    setWorkerPool(prev => {
      const newPool = { ...prev };
      const worker = newPool.running.get(workerId);
      if (worker) {
        worker.status = 'idle';
        worker.currentTest = undefined;
        worker.resources = { memory: 0, cpu: 0, handles: 0 };
      }
      
      if (passed) {
        newPool.completed.push(result);
      } else {
        newPool.failed.push(result);
      }
      
      return newPool;
    });

    return result;
  }, []);

  // Parallel execution orchestration
  const runParallelTests = useCallback(async () => {
    if (testCases.length === 0) return;

    setIsRunning(true);
    setExecutionStartTime(new Date());
    
    // Initialize worker pool
    scaleWorkers(Math.min(maxWorkers, testCases.length));
    
    // Initialize queue
    setWorkerPool(prev => ({
      ...prev,
      queue: [...testCases],
      completed: [],
      failed: []
    }));

    const results: TestResult[] = [];
    const activeWorkers = new Set<string>();
    
    const processQueue = async () => {
      while (workerPool.queue.length > 0 || activeWorkers.size > 0) {
        // Assign tests to idle workers
        const idleWorkers = Array.from(workerPool.running.values())
          .filter(worker => worker.status === 'idle' && !activeWorkers.has(worker.id));
        
        for (const worker of idleWorkers) {
          if (workerPool.queue.length === 0) break;
          
          const testCase = workerPool.queue.shift();
          if (testCase) {
            activeWorkers.add(worker.id);
            
            executeTest(testCase, worker.id)
              .then(result => {
                results.push(result);
                activeWorkers.delete(worker.id);
                
                // Update stats
                setExecutionStats(prev => ({
                  totalTests: testCases.length,
                  completed: prev.completed + (result.status === 'passed' ? 1 : 0),
                  failed: prev.failed + (result.status === 'failed' ? 1 : 0),
                  duration: Date.now() - (executionStartTime?.getTime() || Date.now()),
                  throughput: results.length / ((Date.now() - (executionStartTime?.getTime() || Date.now())) / 1000)
                }));
              })
              .catch(error => {
                console.error('Worker execution failed:', error);
                activeWorkers.delete(worker.id);
              });
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };

    await processQueue();
    
    setIsRunning(false);
    setExecutionStats(prev => ({
      ...prev,
      duration: Date.now() - (executionStartTime?.getTime() || Date.now())
    }));
  }, [testCases, maxWorkers, workerPool.queue.length, workerPool.running, executeTest, executionStartTime, scaleWorkers]);

  // Auto-scaling based on queue length
  useEffect(() => {
    if (isRunning) {
      const queueLength = workerPool.queue.length;
      const optimalWorkers = Math.min(
        maxWorkers,
        Math.max(1, Math.ceil(queueLength / 3))
      );
      
      if (optimalWorkers !== workerPool.currentWorkers) {
        scaleWorkers(optimalWorkers);
      }
    }
  }, [isRunning, workerPool.queue.length, workerPool.currentWorkers, maxWorkers, scaleWorkers]);

  return (
    <div className="parallel-runner" data-testid="parallel-runner">
      <div className="runner-header">
        <h2>Parallel Test Runner</h2>
        <div className="runner-controls">
          <button 
            onClick={runParallelTests}
            disabled={isRunning || testCases.length === 0}
            className="run-btn"
            data-testid="run-parallel-tests-btn"
          >
            {isRunning ? 'Running...' : 'Run Tests'}
          </button>
          <div className="worker-scaling">
            <label htmlFor="max-workers">Max Workers:</label>
            <input
              id="max-workers"
              type="number"
              min="1"
              max="16"
              value={maxWorkers}
              onChange={(e) => scaleWorkers(parseInt(e.target.value) || 1)}
              disabled={isRunning}
              data-testid="max-workers-input"
            />
          </div>
        </div>
      </div>

      <div className="execution-stats" data-testid="execution-stats">
        <div className="stat-item">
          <label>Total Tests:</label>
          <span>{executionStats.totalTests}</span>
        </div>
        <div className="stat-item">
          <label>Completed:</label>
          <span className="passed">{executionStats.completed}</span>
        </div>
        <div className="stat-item">
          <label>Failed:</label>
          <span className="failed">{executionStats.failed}</span>
        </div>
        <div className="stat-item">
          <label>Duration:</label>
          <span>{(executionStats.duration / 1000).toFixed(1)}s</span>
        </div>
        <div className="stat-item">
          <label>Throughput:</label>
          <span>{executionStats.throughput.toFixed(2)} tests/s</span>
        </div>
      </div>

      <div className="worker-pool" data-testid="worker-pool">
        <h3>Worker Pool ({workerPool.currentWorkers}/{workerPool.maxWorkers})</h3>
        
        <div className="queue-status">
          <div className="queue-item">
            <label>Queue:</label>
            <span>{workerPool.queue.length} tests</span>
          </div>
          <div className="queue-item">
            <label>Running:</label>
            <span>{Array.from(workerPool.running.values()).filter(w => w.status === 'running').length}</span>
          </div>
          <div className="queue-item">
            <label>Idle:</label>
            <span>{Array.from(workerPool.running.values()).filter(w => w.status === 'idle').length}</span>
          </div>
        </div>

        <div className="workers">
          {Array.from(workerPool.running.values()).map(worker => (
            <div key={worker.id} className="worker" data-testid={`worker-${worker.id}`}>
              <div className="worker-header">
                <span className="worker-id">{worker.id}</span>
                <span className={`worker-status status-${worker.status}`}>{worker.status}</span>
              </div>
              
              {worker.currentTest && (
                <div className="worker-current-test">
                  <strong>Test:</strong> {worker.currentTest.name}
                </div>
              )}
              
              <div className="worker-resources">
                <div className="resource">
                  <span>Memory:</span>
                  <span>{worker.resources.memory}MB</span>
                </div>
                <div className="resource">
                  <span>CPU:</span>
                  <span>{worker.resources.cpu.toFixed(1)}%</span>
                </div>
                <div className="resource">
                  <span>Handles:</span>
                  <span>{worker.resources.handles}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="execution-results">
        <div className="results-summary">
          <h3>Results Summary</h3>
          <div className="summary-stats">
            <div className="summary-item passed">
              <span className="count">{workerPool.completed.length}</span>
              <span className="label">Passed</span>
            </div>
            <div className="summary-item failed">
              <span className="count">{workerPool.failed.length}</span>
              <span className="label">Failed</span>
            </div>
          </div>
        </div>
        
        {workerPool.failed.length > 0 && (
          <div className="failed-tests">
            <h4>Failed Tests</h4>
            {workerPool.failed.slice(0, 5).map(result => (
              <div key={result.id} className="failed-test">
                <div className="test-name">{result.name}</div>
                <div className="test-error">{result.error?.message}</div>
                <div className="test-suggestions">
                  <strong>Suggestions:</strong> {result.error?.suggestions.join(', ')}
                </div>
              </div>
            ))}
            {workerPool.failed.length > 5 && (
              <div className="more-failures">
                +{workerPool.failed.length - 5} more failures
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// 4. TESTREPORTER COMPONENT - Comprehensive Test Reporting and Analytics
// =============================================================================

export const TestReporter: React.FC<{ 
  results: TestResult[], 
  metrics: TestMetrics,
  config: { formats: ReportFormat[], realTime: boolean }
}> = ({ results, metrics, config }) => {
  const [selectedFormat, setSelectedFormat] = useState<string>(config.formats[0]?.type || 'console');
  const [reportFilter, setReportFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'duration' | 'status'>('name');
  const [exportLoading, setExportLoading] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState<'1d' | '7d' | '30d'>('7d');

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let filtered = results;
    
    if (reportFilter !== 'all') {
      filtered = results.filter(result => result.status === reportFilter);
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'duration':
          return b.duration - a.duration;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [results, reportFilter, sortBy]);

  // Generate different report formats
  const generateReport = useCallback(async (format: string) => {
    setExportLoading(true);
    
    try {
      switch (format) {
        case 'json':
          const jsonReport = {
            timestamp: new Date().toISOString(),
            summary: {
              total: results.length,
              passed: results.filter(r => r.status === 'passed').length,
              failed: results.filter(r => r.status === 'failed').length,
              skipped: results.filter(r => r.status === 'skipped').length,
              duration: results.reduce((sum, r) => sum + r.duration, 0)
            },
            metrics,
            results: filteredResults
          };
          
          const jsonBlob = new Blob([JSON.stringify(jsonReport, null, 2)], { 
            type: 'application/json' 
          });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          const jsonLink = document.createElement('a');
          jsonLink.href = jsonUrl;
          jsonLink.download = `test-report-${Date.now()}.json`;
          jsonLink.click();
          break;
          
        case 'html':
          const htmlReport = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Test Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .passed { color: #28a745; }
                .failed { color: #dc3545; }
                .skipped { color: #6c757d; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f8f9fa; }
              </style>
            </head>
            <body>
              <h1>Test Execution Report</h1>
              <div class="summary">
                <h2>Summary</h2>
                <p><strong>Total Tests:</strong> ${results.length}</p>
                <p><strong>Passed:</strong> <span class="passed">${results.filter(r => r.status === 'passed').length}</span></p>
                <p><strong>Failed:</strong> <span class="failed">${results.filter(r => r.status === 'failed').length}</span></p>
                <p><strong>Skipped:</strong> <span class="skipped">${results.filter(r => r.status === 'skipped').length}</span></p>
                <p><strong>Duration:</strong> ${(results.reduce((sum, r) => sum + r.duration, 0) / 1000).toFixed(2)}s</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Suite</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredResults.map(result => `
                    <tr>
                      <td>${result.name}</td>
                      <td><span class="${result.status}">${result.status}</span></td>
                      <td>${(result.duration / 1000).toFixed(3)}s</td>
                      <td>${result.suiteId}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
            </html>
          `;
          
          const htmlBlob = new Blob([htmlReport], { type: 'text/html' });
          const htmlUrl = URL.createObjectURL(htmlBlob);
          const htmlLink = document.createElement('a');
          htmlLink.href = htmlUrl;
          htmlLink.download = `test-report-${Date.now()}.html`;
          htmlLink.click();
          break;
          
        case 'junit':
          const junitReport = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="All Tests" tests="${results.length}" failures="${results.filter(r => r.status === 'failed').length}" time="${(results.reduce((sum, r) => sum + r.duration, 0) / 1000).toFixed(3)}">
    ${filteredResults.map(result => `
    <testcase classname="${result.suiteId}" name="${result.name}" time="${(result.duration / 1000).toFixed(3)}">
      ${result.status === 'failed' ? `<failure message="${result.error?.message || 'Test failed'}">${result.error?.stack || ''}</failure>` : ''}
      ${result.status === 'skipped' ? '<skipped/>' : ''}
    </testcase>`).join('')}
  </testsuite>
</testsuites>`;
          
          const junitBlob = new Blob([junitReport], { type: 'application/xml' });
          const junitUrl = URL.createObjectURL(junitBlob);
          const junitLink = document.createElement('a');
          junitLink.href = junitUrl;
          junitLink.download = `test-report-${Date.now()}.xml`;
          junitLink.click();
          break;
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setExportLoading(false);
    }
  }, [results, filteredResults, metrics]);

  // Calculate trend indicators
  const getTrendIndicator = (current: number, previous: number) => {
    if (current > previous) return '↗️';
    if (current < previous) return '↘️';
    return '→';
  };

  return (
    <div className="test-reporter" data-testid="test-reporter">
      <div className="reporter-header">
        <h2>Test Reporter & Analytics</h2>
        <div className="reporter-controls">
          <div className="export-controls">
            <select 
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              data-testid="report-format-select"
            >
              {config.formats.map(format => (
                <option key={format.type} value={format.type}>
                  {format.type.toUpperCase()}
                </option>
              ))}
            </select>
            <button 
              onClick={() => generateReport(selectedFormat)}
              disabled={exportLoading}
              className="export-btn"
              data-testid="export-report-btn"
            >
              {exportLoading ? 'Exporting...' : 'Export Report'}
            </button>
          </div>
        </div>
      </div>

      <div className="metrics-dashboard" data-testid="metrics-dashboard">
        <div className="metrics-section">
          <h3>Execution Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{metrics.execution.totalTests}</div>
              <div className="metric-label">Total Tests</div>
            </div>
            <div className="metric-card passed">
              <div className="metric-value">{metrics.execution.passed}</div>
              <div className="metric-label">Passed</div>
            </div>
            <div className="metric-card failed">
              <div className="metric-value">{metrics.execution.failed}</div>
              <div className="metric-label">Failed</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{(metrics.execution.duration / 1000).toFixed(1)}s</div>
              <div className="metric-label">Duration</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{(metrics.execution.efficiency * 100).toFixed(1)}%</div>
              <div className="metric-label">Efficiency</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics.execution.parallelization.toFixed(1)}x</div>
              <div className="metric-label">Parallelization</div>
            </div>
          </div>
        </div>

        <div className="metrics-section">
          <h3>Coverage Metrics</h3>
          <div className="coverage-grid">
            <div className="coverage-item">
              <label>Lines:</label>
              <div className="coverage-bar">
                <div 
                  className="coverage-fill" 
                  style={{ width: `${metrics.coverage.lines}%` }}
                />
              </div>
              <span>{metrics.coverage.lines.toFixed(1)}%</span>
            </div>
            <div className="coverage-item">
              <label>Functions:</label>
              <div className="coverage-bar">
                <div 
                  className="coverage-fill" 
                  style={{ width: `${metrics.coverage.functions}%` }}
                />
              </div>
              <span>{metrics.coverage.functions.toFixed(1)}%</span>
            </div>
            <div className="coverage-item">
              <label>Branches:</label>
              <div className="coverage-bar">
                <div 
                  className="coverage-fill" 
                  style={{ width: `${metrics.coverage.branches}%` }}
                />
              </div>
              <span>{metrics.coverage.branches.toFixed(1)}%</span>
            </div>
            <div className="coverage-item">
              <label>Statements:</label>
              <div className="coverage-bar">
                <div 
                  className="coverage-fill" 
                  style={{ width: `${metrics.coverage.statements}%` }}
                />
              </div>
              <span>{metrics.coverage.statements.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="metrics-section">
          <h3>Performance Metrics</h3>
          <div className="performance-grid">
            <div className="performance-item">
              <label>Average Test Duration:</label>
              <span>{(metrics.performance.averageTestDuration / 1000).toFixed(3)}s</span>
            </div>
            <div className="performance-item">
              <label>CPU Usage:</label>
              <span>{metrics.performance.resourceUtilization.cpu.toFixed(1)}%</span>
            </div>
            <div className="performance-item">
              <label>Memory Usage:</label>
              <span>{metrics.performance.resourceUtilization.memory.toFixed(1)}MB</span>
            </div>
            <div className="performance-item">
              <label>I/O Usage:</label>
              <span>{metrics.performance.resourceUtilization.io.toFixed(1)}%</span>
            </div>
          </div>

          {metrics.performance.slowestTests.length > 0 && (
            <div className="slowest-tests">
              <h4>Slowest Tests</h4>
              {metrics.performance.slowestTests.slice(0, 5).map(test => (
                <div key={test.testId} className="slow-test">
                  <span className="test-name">{test.testId}</span>
                  <span className="test-duration">{(test.duration / 1000).toFixed(3)}s</span>
                  <span className={`test-trend trend-${test.trend}`}>
                    {getTrendIndicator(test.duration, test.duration * 0.9)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="metrics-section">
          <h3>Quality Metrics</h3>
          <div className="quality-grid">
            <div className="quality-item">
              <label>Test Reliability:</label>
              <span>{(metrics.quality.testReliability * 100).toFixed(1)}%</span>
            </div>
            <div className="quality-item">
              <label>False Positives:</label>
              <span>{metrics.quality.falsePositives}</span>
            </div>
            <div className="quality-item">
              <label>False Negatives:</label>
              <span>{metrics.quality.falseNegatives}</span>
            </div>
            <div className="quality-item">
              <label>Maintenance Index:</label>
              <span>{(metrics.quality.maintenanceIndex * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="metrics-section">
          <h3>Trend Analysis</h3>
          <div className="trend-controls">
            <label htmlFor="trend-period">Period:</label>
            <select 
              id="trend-period"
              value={trendPeriod}
              onChange={(e) => setTrendPeriod(e.target.value as '1d' | '7d' | '30d')}
              data-testid="trend-period-select"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
          
          <div className="trend-grid">
            <div className="trend-item">
              <label>Pass Rate:</label>
              <span className="trend-value">{(metrics.trends.passRate.current * 100).toFixed(1)}%</span>
              <span className={`trend-indicator trend-${metrics.trends.passRate.trend}`}>
                {getTrendIndicator(metrics.trends.passRate.current, metrics.trends.passRate.previous)}
              </span>
            </div>
            <div className="trend-item">
              <label>Duration:</label>
              <span className="trend-value">{(metrics.trends.duration.current / 1000).toFixed(1)}s</span>
              <span className={`trend-indicator trend-${metrics.trends.duration.trend}`}>
                {getTrendIndicator(metrics.trends.duration.current, metrics.trends.duration.previous)}
              </span>
            </div>
            <div className="trend-item">
              <label>Coverage:</label>
              <span className="trend-value">{(metrics.trends.coverage.current * 100).toFixed(1)}%</span>
              <span className={`trend-indicator trend-${metrics.trends.coverage.trend}`}>
                {getTrendIndicator(metrics.trends.coverage.current, metrics.trends.coverage.previous)}
              </span>
            </div>
            <div className="trend-item">
              <label>Flakiness:</label>
              <span className="trend-value">{(metrics.trends.flakiness.current * 100).toFixed(1)}%</span>
              <span className={`trend-indicator trend-${metrics.trends.flakiness.trend}`}>
                {getTrendIndicator(metrics.trends.flakiness.previous, metrics.trends.flakiness.current)} {/* Inverted for flakiness */}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="results-table-section">
        <div className="table-controls">
          <div className="filter-controls">
            <label htmlFor="result-filter">Filter:</label>
            <select 
              id="result-filter"
              value={reportFilter}
              onChange={(e) => setReportFilter(e.target.value)}
              data-testid="result-filter"
            >
              <option value="all">All Results</option>
              <option value="passed">Passed Only</option>
              <option value="failed">Failed Only</option>
              <option value="skipped">Skipped Only</option>
            </select>
          </div>
          
          <div className="sort-controls">
            <label htmlFor="sort-by">Sort by:</label>
            <select 
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'duration' | 'status')}
              data-testid="sort-by"
            >
              <option value="name">Name</option>
              <option value="duration">Duration</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        <div className="results-table" data-testid="results-table">
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Suite</th>
                <th>Retries</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.slice(0, 100).map(result => (
                <tr key={result.id} className={`result-row status-${result.status}`}>
                  <td className="test-name">{result.name}</td>
                  <td className={`test-status status-${result.status}`}>{result.status}</td>
                  <td className="test-duration">{(result.duration / 1000).toFixed(3)}s</td>
                  <td className="test-suite">{result.suiteId}</td>
                  <td className="test-retries">{result.retryCount}</td>
                  <td className="test-timestamp">{result.timestamp.toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredResults.length > 100 && (
            <div className="table-pagination">
              Showing 100 of {filteredResults.length} results
            </div>
          )}
        </div>
      </div>

      {filteredResults.filter(r => r.status === 'failed').length > 0 && (
        <div className="failure-analysis" data-testid="failure-analysis">
          <h3>Failure Analysis</h3>
          
          <div className="failure-categories">
            <h4>Failure Categories</h4>
            {Object.entries(
              filteredResults
                .filter(r => r.status === 'failed' && r.error)
                .reduce((acc, result) => {
                  const category = result.error!.category;
                  acc[category] = (acc[category] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
            ).map(([category, count]) => (
              <div key={category} className="failure-category">
                <span className="category-name">{category}</span>
                <span className="category-count">{count}</span>
              </div>
            ))}
          </div>

          <div className="failure-suggestions">
            <h4>Common Suggestions</h4>
            {Array.from(new Set(
              filteredResults
                .filter(r => r.status === 'failed' && r.error?.suggestions)
                .flatMap(r => r.error!.suggestions)
            )).slice(0, 5).map((suggestion, index) => (
              <div key={index} className="suggestion">
                • {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// 5. TEST ARCHITECTURE UTILITIES
// =============================================================================

// Custom Hooks for Test Framework Management

export const useTestFramework = (config: TestFrameworkConfig) => {
  const [framework, setFramework] = useState<{
    isInitialized: boolean;
    discoveredTests: TestSuite[];
    categories: TestCategory[];
    plugins: any[];
  }>({
    isInitialized: false,
    discoveredTests: [],
    categories: [],
    plugins: []
  });

  const initializeFramework = useCallback(async () => {
    try {
      // Simulate framework initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFramework({
        isInitialized: true,
        discoveredTests: [], // Would be populated by actual discovery
        categories: config.discovery.testCategories,
        plugins: [] // Would be loaded from configuration
      });
    } catch (error) {
      console.error('Framework initialization failed:', error);
    }
  }, [config]);

  const discoverTests = useCallback(async (patterns?: string[]) => {
    // Test discovery logic would go here
    return framework.discoveredTests;
  }, [framework.discoveredTests]);

  const runTests = useCallback(async (suiteIds?: string[]) => {
    // Test execution logic would go here
    return [];
  }, []);

  return {
    framework,
    initializeFramework,
    discoverTests,
    runTests
  };
};

export const useTestOrchestration = (suites: TestSuite[], config: TestFrameworkConfig) => {
  const [orchestration, setOrchestration] = useState<{
    plan: TestOrchestrationPlan | null;
    isExecuting: boolean;
    currentPhase: string | null;
    results: TestResult[];
  }>({
    plan: null,
    isExecuting: false,
    currentPhase: null,
    results: []
  });

  const createExecutionPlan = useCallback(async () => {
    // Plan creation logic would go here
    return null;
  }, [suites, config]);

  const executePhase = useCallback(async (phaseId: string) => {
    // Phase execution logic would go here
    return [];
  }, []);

  const handleFailure = useCallback(async (error: TestError, context: any) => {
    // Failure handling logic would go here
  }, []);

  return {
    orchestration,
    createExecutionPlan,
    executePhase,
    handleFailure
  };
};

export const useParallelExecution = (maxWorkers: number) => {
  const [execution, setExecution] = useState<{
    workerPool: WorkerPool;
    isRunning: boolean;
    stats: any;
  }>({
    workerPool: {
      id: 'main',
      maxWorkers,
      currentWorkers: 0,
      queue: [],
      running: new Map(),
      completed: [],
      failed: []
    },
    isRunning: false,
    stats: {}
  });

  const scaleWorkers = useCallback((targetCount: number) => {
    // Worker scaling logic would go here
  }, []);

  const distributeTests = useCallback((tests: TestCase[]) => {
    // Test distribution logic would go here
  }, []);

  const monitorWorkers = useCallback(() => {
    // Worker monitoring logic would go here
  }, []);

  return {
    execution,
    scaleWorkers,
    distributeTests,
    monitorWorkers
  };
};

export const useTestReporting = (results: TestResult[]) => {
  const [reporting, setReporting] = useState<{
    metrics: TestMetrics | null;
    trends: any;
    analyses: any;
  }>({
    metrics: null,
    trends: {},
    analyses: {}
  });

  const generateMetrics = useCallback(() => {
    if (results.length === 0) return null;

    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    return {
      execution: {
        totalTests: results.length,
        passed,
        failed,
        skipped,
        duration: totalDuration,
        parallelization: 2.5,
        efficiency: 0.85
      },
      coverage: {
        lines: 87.5,
        functions: 92.3,
        branches: 78.9,
        statements: 89.1,
        files: []
      },
      performance: {
        averageTestDuration: totalDuration / results.length,
        slowestTests: results
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5)
          .map(r => ({
            testId: r.testId,
            duration: r.duration,
            trend: 'stable' as const
          })),
        resourceUtilization: {
          cpu: 45.2,
          memory: 256.8,
          io: 23.1,
          network: 12.4
        },
        bottlenecks: []
      },
      quality: {
        testReliability: 0.96,
        falsePositives: 2,
        falseNegatives: 1,
        maintenanceIndex: 0.78
      },
      trends: {
        passRate: {
          current: passed / results.length,
          previous: 0.92,
          trend: 'up' as const,
          history: [0.88, 0.90, 0.92, 0.94, passed / results.length]
        },
        duration: {
          current: totalDuration,
          previous: totalDuration * 1.1,
          trend: 'down' as const,
          history: []
        },
        coverage: {
          current: 0.875,
          previous: 0.864,
          trend: 'up' as const,
          history: []
        },
        flakiness: {
          current: 0.03,
          previous: 0.045,
          trend: 'down' as const,
          history: []
        }
      }
    };
  }, [results]);

  const analyzeFailures = useCallback(() => {
    // Failure analysis logic would go here
  }, [results]);

  const generateTrends = useCallback(() => {
    // Trend analysis logic would go here
  }, [results]);

  useEffect(() => {
    const metrics = generateMetrics();
    setReporting(prev => ({ ...prev, metrics }));
  }, [generateMetrics]);

  return {
    reporting,
    generateMetrics,
    analyzeFailures,
    generateTrends
  };
};

// Jest Configuration Utilities

export const createJestConfig = (options: {
  testMatch?: string[];
  setupFilesAfterEnv?: string[];
  maxWorkers?: number;
  collectCoverage?: boolean;
  coverageThreshold?: any;
}) => {
  return {
    testEnvironment: 'jsdom',
    testMatch: options.testMatch || ['**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)'],
    setupFilesAfterEnv: options.setupFilesAfterEnv || ['<rootDir>/src/setupTests.ts'],
    moduleNameMapping: {
      '^@/(.*)$': '<rootDir>/src/$1'
    },
    transform: {
      '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/*.stories.{ts,tsx}',
      '!src/**/*.test.{ts,tsx}'
    ],
    coverageThreshold: options.coverageThreshold || {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    maxWorkers: options.maxWorkers || '50%',
    testTimeout: 30000,
    collectCoverage: options.collectCoverage || false,
    coverageReporters: ['text', 'lcov', 'html'],
    reporters: [
      'default',
      ['jest-junit', { outputDirectory: 'test-results', outputName: 'junit.xml' }]
    ]
  };
};

// Custom Test Runner Class

export class CustomTestRunner {
  private config: TestFrameworkConfig;
  private suites: TestSuite[] = [];
  private results: TestResult[] = [];

  constructor(config: TestFrameworkConfig) {
    this.config = config;
  }

  async discoverTests(): Promise<TestSuite[]> {
    // Test discovery implementation
    return this.suites;
  }

  async runSuite(suite: TestSuite): Promise<TestResult[]> {
    // Suite execution implementation
    return [];
  }

  async runTests(options?: { suiteIds?: string[], parallel?: boolean }): Promise<TestResult[]> {
    // Main test execution implementation
    return this.results;
  }

  getMetrics(): TestMetrics {
    // Metrics calculation implementation
    return {
      execution: {
        totalTests: this.results.length,
        passed: this.results.filter(r => r.status === 'passed').length,
        failed: this.results.filter(r => r.status === 'failed').length,
        skipped: this.results.filter(r => r.status === 'skipped').length,
        duration: this.results.reduce((sum, r) => sum + r.duration, 0),
        parallelization: 1,
        efficiency: 1
      },
      coverage: { lines: 0, functions: 0, branches: 0, statements: 0, files: [] },
      performance: {
        averageTestDuration: 0,
        slowestTests: [],
        resourceUtilization: { cpu: 0, memory: 0, io: 0, network: 0 },
        bottlenecks: []
      },
      quality: { testReliability: 0, falsePositives: 0, falseNegatives: 0, maintenanceIndex: 0 },
      trends: {
        passRate: { current: 0, previous: 0, trend: 'stable', history: [] },
        duration: { current: 0, previous: 0, trend: 'stable', history: [] },
        coverage: { current: 0, previous: 0, trend: 'stable', history: [] },
        flakiness: { current: 0, previous: 0, trend: 'stable', history: [] }
      }
    };
  }
}

// CI/CD Integration Utilities

export const createGitHubActionsConfig = (options: {
  nodeVersion?: string;
  testCommand?: string;
  coverageUpload?: boolean;
}) => {
  return `
name: Test Suite
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [${options.nodeVersion || '16.x, 18.x'}]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: ${options.testCommand || 'npm test -- --coverage --watchAll=false'}
      
      ${options.coverageUpload ? `
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true
      ` : ''}
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results-\${{ matrix.node-version }}
          path: test-results/
  `;
};

export const createJenkinsConfig = (options: {
  nodeVersion?: string;
  testCommand?: string;
  qualityGates?: QualityGate[];
}) => {
  return `
pipeline {
  agent any
  
  tools {
    nodejs '${options.nodeVersion || '16'}'
  }
  
  stages {
    stage('Install') {
      steps {
        sh 'npm ci'
      }
    }
    
    stage('Test') {
      steps {
        sh '${options.testCommand || 'npm test -- --coverage --watchAll=false'}'
      }
      post {
        always {
          publishTestResults testResultsPattern: 'test-results/junit.xml'
          publishHTML([
            allowMissing: false,
            alwaysLinkToLastBuild: false,
            keepAll: true,
            reportDir: 'coverage',
            reportFiles: 'index.html',
            reportName: 'Coverage Report'
          ])
        }
      }
    }
    
    ${options.qualityGates?.map(gate => `
    stage('Quality Gate: ${gate.name}') {
      steps {
        script {
          // Quality gate implementation
          echo 'Checking ${gate.name}...'
        }
      }
    }
    `).join('') || ''}
  }
}
  `;
};

// =============================================================================
// COMPREHENSIVE DEMO COMPONENT
// =============================================================================

export const TestArchitectureDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'framework' | 'orchestrator' | 'parallel' | 'reporter'>('framework');
  const [demoConfig] = useState<TestFrameworkConfig>({
    discovery: {
      patterns: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      excludePatterns: ['**/node_modules/**', '**/dist/**'],
      testCategories: [
        { name: 'unit', pattern: '**/*.unit.test.*', priority: 1, parallel: true, timeout: 5000 },
        { name: 'integration', pattern: '**/*.integration.test.*', priority: 2, parallel: true, timeout: 10000 },
        { name: 'e2e', pattern: '**/*.e2e.test.*', priority: 3, parallel: false, timeout: 30000 }
      ],
      maxDepth: 10
    },
    execution: {
      parallel: true,
      maxWorkers: 4,
      timeout: 30000,
      retries: 2,
      bail: false,
      randomize: false
    },
    reporting: {
      formats: [
        { type: 'console', options: {} },
        { type: 'json', options: {} },
        { type: 'html', options: {} },
        { type: 'junit', options: {} }
      ],
      outputs: [
        { type: 'console', destination: 'stdout', format: 'console' },
        { type: 'file', destination: './test-results/report.json', format: 'json' }
      ],
      realTime: true,
      includeMetrics: true
    },
    integrations: {
      cicd: {
        platform: 'github',
        qualityGates: [
          {
            name: 'Coverage Gate',
            conditions: [
              { metric: 'coverage.lines', operator: 'gte', threshold: 80, severity: 'error' },
              { metric: 'coverage.branches', operator: 'gte', threshold: 75, severity: 'warning' }
            ],
            actions: [
              { type: 'block', target: 'deployment', parameters: {} }
            ],
            stakeholders: ['dev-team', 'qa-team'],
            blocking: true
          }
        ],
        artifactUpload: true,
        notifications: true
      },
      monitoring: {
        enabled: true,
        endpoint: 'https://monitoring.example.com/webhook',
        metrics: ['duration', 'pass-rate', 'coverage'],
        alerts: [
          {
            condition: 'pass-rate < 0.95',
            threshold: 0.95,
            recipients: ['team-lead@example.com'],
            severity: 'high'
          }
        ]
      },
      notifications: {
        channels: [
          { type: 'slack', target: '#qa-alerts', template: 'test-failure' },
          { type: 'email', target: 'qa-team@example.com', template: 'daily-summary' }
        ],
        conditions: [
          { event: 'test-failure', filter: 'severity >= high' },
          { event: 'daily-summary', filter: 'time == 09:00' }
        ]
      }
    }
  });

  const [mockTestCases] = useState<TestCase[]>([
    {
      id: 'test-1',
      name: 'User Authentication Flow',
      description: 'Tests user login and logout functionality',
      suiteId: 'integration-tests',
      fn: async () => ({ id: 'result-1', testId: 'test-1', suiteId: 'integration-tests', name: 'User Authentication Flow', status: 'passed', duration: 1500, timestamp: new Date(), retryCount: 0, metadata: {} }),
      timeout: 10000,
      retries: 2,
      tags: ['auth', 'user', 'integration'],
      prerequisites: []
    },
    {
      id: 'test-2',
      name: 'Payment Processing',
      description: 'Tests payment gateway integration',
      suiteId: 'integration-tests',
      fn: async () => ({ id: 'result-2', testId: 'test-2', suiteId: 'integration-tests', name: 'Payment Processing', status: 'passed', duration: 2200, timestamp: new Date(), retryCount: 0, metadata: {} }),
      timeout: 15000,
      retries: 3,
      tags: ['payment', 'gateway', 'integration'],
      prerequisites: ['test-1']
    },
    {
      id: 'test-3',
      name: 'Data Validation',
      description: 'Tests form validation logic',
      suiteId: 'unit-tests',
      fn: async () => ({ id: 'result-3', testId: 'test-3', suiteId: 'unit-tests', name: 'Data Validation', status: 'passed', duration: 800, timestamp: new Date(), retryCount: 0, metadata: {} }),
      timeout: 5000,
      retries: 1,
      tags: ['validation', 'forms', 'unit'],
      prerequisites: []
    }
  ]);

  const [mockResults] = useState<TestResult[]>([
    {
      id: 'result-1',
      testId: 'test-1',
      suiteId: 'integration-tests',
      name: 'User Authentication Flow',
      status: 'passed',
      duration: 1543,
      timestamp: new Date(),
      retryCount: 0,
      metadata: { workerId: 'worker-1', resourceUsage: { memory: 128, cpu: 25, io: 15 } }
    },
    {
      id: 'result-2',
      testId: 'test-2',
      suiteId: 'integration-tests',
      name: 'Payment Processing',
      status: 'failed',
      duration: 2187,
      timestamp: new Date(),
      retryCount: 1,
      metadata: { workerId: 'worker-2', resourceUsage: { memory: 256, cpu: 45, io: 30 } },
      error: {
        message: 'Payment gateway timeout',
        type: 'timeout',
        category: 'infrastructure',
        severity: 'medium',
        suggestions: ['Check network connectivity', 'Verify payment gateway status', 'Increase timeout threshold']
      }
    },
    {
      id: 'result-3',
      testId: 'test-3',
      suiteId: 'unit-tests',
      name: 'Data Validation',
      status: 'passed',
      duration: 823,
      timestamp: new Date(),
      retryCount: 0,
      metadata: { workerId: 'worker-1', resourceUsage: { memory: 64, cpu: 15, io: 5 } }
    }
  ]);

  const mockMetrics: TestMetrics = {
    execution: {
      totalTests: 3,
      passed: 2,
      failed: 1,
      skipped: 0,
      duration: 4553,
      parallelization: 2.1,
      efficiency: 0.87
    },
    coverage: {
      lines: 87.5,
      functions: 92.3,
      branches: 78.9,
      statements: 89.1,
      files: [
        { path: 'src/auth/login.ts', coverage: 95.2, uncoveredLines: [23, 45] },
        { path: 'src/payment/gateway.ts', coverage: 78.6, uncoveredLines: [12, 34, 56, 78] }
      ]
    },
    performance: {
      averageTestDuration: 1517.67,
      slowestTests: [
        { testId: 'test-2', duration: 2187, trend: 'degrading' },
        { testId: 'test-1', duration: 1543, trend: 'stable' },
        { testId: 'test-3', duration: 823, trend: 'improving' }
      ],
      resourceUtilization: {
        cpu: 28.3,
        memory: 149.3,
        io: 16.7,
        network: 8.2
      },
      bottlenecks: [
        {
          type: 'network',
          severity: 0.6,
          impact: ['test-2'],
          suggestions: ['Optimize network calls', 'Add connection pooling', 'Implement retry logic']
        }
      ]
    },
    quality: {
      testReliability: 0.94,
      falsePositives: 1,
      falseNegatives: 0,
      maintenanceIndex: 0.82
    },
    trends: {
      passRate: {
        current: 0.67,
        previous: 0.85,
        trend: 'down',
        history: [0.95, 0.88, 0.92, 0.85, 0.67]
      },
      duration: {
        current: 4553,
        previous: 4200,
        trend: 'up',
        history: [3800, 4000, 4100, 4200, 4553]
      },
      coverage: {
        current: 0.875,
        previous: 0.864,
        trend: 'up',
        history: [0.82, 0.85, 0.86, 0.864, 0.875]
      },
      flakiness: {
        current: 0.033,
        previous: 0.045,
        trend: 'down',
        history: [0.08, 0.06, 0.05, 0.045, 0.033]
      }
    }
  };

  return (
    <div className="test-architecture-demo" data-testid="test-architecture-demo">
      <div className="demo-header">
        <h1>Test Architecture Patterns Demo</h1>
        <p>Comprehensive test architecture for large-scale applications</p>
      </div>

      <div className="demo-tabs">
        <button 
          className={`tab ${activeTab === 'framework' ? 'active' : ''}`}
          onClick={() => setActiveTab('framework')}
          data-testid="framework-tab"
        >
          Test Framework
        </button>
        <button 
          className={`tab ${activeTab === 'orchestrator' ? 'active' : ''}`}
          onClick={() => setActiveTab('orchestrator')}
          data-testid="orchestrator-tab"
        >
          Test Orchestrator
        </button>
        <button 
          className={`tab ${activeTab === 'parallel' ? 'active' : ''}`}
          onClick={() => setActiveTab('parallel')}
          data-testid="parallel-tab"
        >
          Parallel Runner
        </button>
        <button 
          className={`tab ${activeTab === 'reporter' ? 'active' : ''}`}
          onClick={() => setActiveTab('reporter')}
          data-testid="reporter-tab"
        >
          Test Reporter
        </button>
      </div>

      <div className="demo-content">
        {activeTab === 'framework' && (
          <TestFramework config={demoConfig} />
        )}
        
        {activeTab === 'orchestrator' && (
          <TestOrchestrator suites={[]} config={demoConfig} />
        )}
        
        {activeTab === 'parallel' && (
          <ParallelRunner testCases={mockTestCases} maxWorkers={4} />
        )}
        
        {activeTab === 'reporter' && (
          <TestReporter 
            results={mockResults} 
            metrics={mockMetrics}
            config={{ formats: demoConfig.reporting.formats, realTime: true }}
          />
        )}
      </div>

      <div className="demo-footer">
        <p>
          This demo showcases enterprise-grade test architecture patterns for scalable applications.
          In production, these components would integrate with Jest, Playwright, CI/CD pipelines,
          and monitoring systems to provide comprehensive test management and reporting.
        </p>
      </div>
    </div>
  );
};

// Export the main demo component as default
export default TestArchitectureDemo;