import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Card, Text, Group, Stack, Badge, Progress, Alert, Tabs, TextInput, Select, Textarea, NumberInput, Code, ScrollArea, Divider, ActionIcon, Modal, Slider, Switch, Paper, Container, Grid, RingProgress, Table, Tooltip, Timeline, Stepper } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconWorkflow, IconRobot, IconRoute, IconStack, IconChartDots, IconPlay, IconPause, IconStop, IconRefresh, IconSettings, IconEye, IconAlertTriangle, IconCheck, IconX, IconClock, IconTarget, IconTrendingUp } from '@tabler/icons-react';

// ===== AI WORKFLOW TYPES =====

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  tasks: TaskDefinition[];
  dependencies: DependencyGraph;
  configuration: WorkflowConfiguration;
  triggers: WorkflowTrigger[];
  version: number;
  createdAt: number;
  updatedAt: number;
}

interface TaskDefinition {
  id: string;
  name: string;
  type: TaskType;
  aiProvider?: string;
  configuration: TaskConfiguration;
  dependencies: string[];
  validation: ValidationRules;
  timeout: number;
  retryPolicy: RetryConfiguration;
  errorHandling: ErrorHandlingPolicy;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startTime: number;
  endTime?: number;
  context: ExecutionContext;
  results: Map<string, TaskResult>;
  metrics: ExecutionMetrics;
  currentStep: number;
  errors: ExecutionError[];
}

interface TaskResult {
  taskId: string;
  status: TaskStatus;
  result: any;
  startTime: number;
  endTime: number;
  duration: number;
  quality: number;
  confidence: number;
  metadata: ResultMetadata;
  errors: TaskError[];
}

interface PipelineStage {
  id: string;
  name: string;
  processor: StageProcessor;
  dependencies: string[];
  configuration: StageConfiguration;
  validation: ValidationRules;
  errorHandling: ErrorHandlingPolicy;
  parallelizable: boolean;
  timeout: number;
}

interface PipelineExecution {
  pipelineId: string;
  executionId: string;
  status: PipelineStatus;
  currentStage: string;
  stageResults: Map<string, StageResult>;
  dataFlow: DataFlowState;
  metrics: PipelineMetrics;
  startTime: number;
  endTime?: number;
}

interface AIOrchestrationConfig {
  providers: AIProviderConfig[];
  routing: RoutingStrategy;
  loadBalancing: LoadBalancingStrategy;
  failover: FailoverConfiguration;
  optimization: OptimizationSettings;
  monitoring: MonitoringConfiguration;
}

interface ResourceAllocation {
  taskId: string;
  providerId: string;
  allocated: number;
  used: number;
  efficiency: number;
  cost: number;
}

interface AggregationStrategy {
  method: AggregationMethod;
  weights: Map<string, number>;
  qualityThreshold: number;
  confidenceThreshold: number;
  conflictResolution: ConflictResolutionStrategy;
}

interface WorkflowVisualization {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  layout: LayoutConfiguration;
  styling: VisualizationStyling;
  interactivity: InteractivitySettings;
}

// Enums and utility types
type ExecutionStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'retrying';
type TaskType = 'ai-generation' | 'ai-analysis' | 'data-processing' | 'validation' | 'aggregation';
type PipelineStatus = 'idle' | 'running' | 'completed' | 'failed' | 'paused';
type RoutingStrategy = 'round-robin' | 'weighted' | 'cost-optimized' | 'performance-based';
type LoadBalancingStrategy = 'least-connections' | 'resource-based' | 'response-time';
type AggregationMethod = 'weighted-average' | 'majority-vote' | 'consensus' | 'best-quality';
type ConflictResolutionStrategy = 'highest-confidence' | 'voting' | 'manual-review';

interface DependencyGraph {
  nodes: string[];
  edges: DependencyEdge[];
  resolved: string[];
}

interface DependencyEdge {
  from: string;
  to: string;
  type: DependencyType;
  condition?: string;
}

interface ExecutionContext {
  workflowId: string;
  executionId: string;
  variables: Map<string, any>;
  sharedData: Map<string, any>;
  metadata: ContextMetadata;
}

interface ExecutionMetrics {
  totalDuration: number;
  taskDurations: Map<string, number>;
  resourceUtilization: ResourceMetrics;
  costBreakdown: CostMetrics;
  qualityScore: number;
  throughput: number;
  errorRate: number;
}

type DependencyType = 'sequential' | 'conditional' | 'parallel' | 'optional';

// ===== WORKFLOW ENGINE HOOK =====

const useWorkflowEngine = () => {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [activeExecution, setActiveExecution] = useState<WorkflowExecution | null>(null);
  const [engineState, setEngineState] = useState({
    isRunning: false,
    queuedExecutions: 0,
    completedExecutions: 0,
    failedExecutions: 0,
    averageExecutionTime: 0
  });

  const createWorkflow = useCallback((definition: Omit<WorkflowDefinition, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => {
    const workflow: WorkflowDefinition = {
      ...definition,
      id: `workflow_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setWorkflows(prev => [...prev, workflow]);

    notifications.show({
      title: 'Workflow Created',
      message: `Workflow "${workflow.name}" created successfully`,
      color: 'green'
    });

    return workflow;
  }, []);

  const executeWorkflow = useCallback(async (workflowId: string, context: Partial<ExecutionContext> = {}) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const execution: WorkflowExecution = {
      id: `execution_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      workflowId,
      status: 'pending',
      startTime: Date.now(),
      context: {
        workflowId,
        executionId: '',
        variables: new Map(),
        sharedData: new Map(),
        metadata: { startTime: Date.now(), version: workflow.version },
        ...context
      },
      results: new Map(),
      metrics: {
        totalDuration: 0,
        taskDurations: new Map(),
        resourceUtilization: { cpu: 0, memory: 0, network: 0 },
        costBreakdown: { total: 0, byProvider: new Map(), byTask: new Map() },
        qualityScore: 0,
        throughput: 0,
        errorRate: 0
      },
      currentStep: 0,
      errors: []
    };

    execution.context.executionId = execution.id;
    setExecutions(prev => [...prev, execution]);
    setActiveExecution(execution);
    setEngineState(prev => ({ ...prev, isRunning: true, queuedExecutions: prev.queuedExecutions + 1 }));

    // Start workflow execution
    setTimeout(async () => {
      await processWorkflowExecution(execution, workflow);
    }, 100);

    notifications.show({
      title: 'Workflow Started',
      message: `Executing workflow "${workflow.name}"`,
      color: 'blue'
    });

    return execution;
  }, [workflows]);

  const processWorkflowExecution = useCallback(async (execution: WorkflowExecution, workflow: WorkflowDefinition) => {
    try {
      // Update status to running
      setExecutions(prev => prev.map(e => 
        e.id === execution.id ? { ...e, status: 'running' } : e
      ));

      // Resolve task dependencies and create execution order
      const executionOrder = resolveDependencies(workflow.dependencies);
      
      for (let i = 0; i < executionOrder.length; i++) {
        const taskId = executionOrder[i];
        const task = workflow.tasks.find(t => t.id === taskId);
        
        if (!task) continue;

        // Update current step
        setExecutions(prev => prev.map(e => 
          e.id === execution.id ? { ...e, currentStep: i + 1 } : e
        ));

        // Execute task
        const taskResult = await executeTask(task, execution.context);
        
        // Update results
        setExecutions(prev => prev.map(e => 
          e.id === execution.id ? {
            ...e,
            results: new Map(e.results).set(taskId, taskResult)
          } : e
        ));

        // Check for task failure
        if (taskResult.status === 'failed') {
          if (task.errorHandling.strategy === 'fail-fast') {
            throw new Error(`Task ${task.name} failed: ${taskResult.errors[0]?.message}`);
          }
        }

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));
      }

      // Complete execution
      const endTime = Date.now();
      const totalDuration = endTime - execution.startTime;

      setExecutions(prev => prev.map(e => 
        e.id === execution.id ? {
          ...e,
          status: 'completed',
          endTime,
          metrics: {
            ...e.metrics,
            totalDuration,
            qualityScore: calculateOverallQuality(e.results),
            throughput: executionOrder.length / (totalDuration / 1000)
          }
        } : e
      ));

      setEngineState(prev => ({
        ...prev,
        isRunning: false,
        completedExecutions: prev.completedExecutions + 1,
        queuedExecutions: Math.max(0, prev.queuedExecutions - 1),
        averageExecutionTime: (prev.averageExecutionTime * prev.completedExecutions + totalDuration) / (prev.completedExecutions + 1)
      }));

      notifications.show({
        title: 'Workflow Completed',
        message: `Workflow "${workflow.name}" completed successfully`,
        color: 'green'
      });

    } catch (error) {
      // Handle execution failure
      setExecutions(prev => prev.map(e => 
        e.id === execution.id ? {
          ...e,
          status: 'failed',
          endTime: Date.now(),
          errors: [...e.errors, { message: (error as Error).message, timestamp: Date.now() }]
        } : e
      ));

      setEngineState(prev => ({
        ...prev,
        isRunning: false,
        failedExecutions: prev.failedExecutions + 1,
        queuedExecutions: Math.max(0, prev.queuedExecutions - 1)
      }));

      notifications.show({
        title: 'Workflow Failed',
        message: `Workflow execution failed: ${(error as Error).message}`,
        color: 'red'
      });
    }
  }, []);

  const executeTask = useCallback(async (task: TaskDefinition, context: ExecutionContext): Promise<TaskResult> => {
    const startTime = Date.now();
    
    try {
      // Simulate task execution based on type
      let result: any;
      let quality = 80 + Math.random() * 20;
      let confidence = 75 + Math.random() * 25;

      switch (task.type) {
        case 'ai-generation':
          result = `AI-generated content for task ${task.name}`;
          break;
        case 'ai-analysis':
          result = { analysis: `Analysis result for ${task.name}`, insights: ['Insight 1', 'Insight 2'] };
          break;
        case 'data-processing':
          result = { processed: true, recordCount: Math.floor(Math.random() * 1000) };
          break;
        case 'validation':
          result = { valid: Math.random() > 0.1, issues: [] };
          break;
        case 'aggregation':
          result = { aggregated: true, sources: task.dependencies.length };
          break;
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, task.timeout * 0.1 + Math.random() * 1000));

      const endTime = Date.now();

      return {
        taskId: task.id,
        status: 'completed',
        result,
        startTime,
        endTime,
        duration: endTime - startTime,
        quality,
        confidence,
        metadata: {
          provider: task.aiProvider,
          retries: 0,
          resourcesUsed: Math.random() * 100
        },
        errors: []
      };

    } catch (error) {
      const endTime = Date.now();
      
      return {
        taskId: task.id,
        status: 'failed',
        result: null,
        startTime,
        endTime,
        duration: endTime - startTime,
        quality: 0,
        confidence: 0,
        metadata: { retries: task.retryPolicy?.maxRetries || 0 },
        errors: [{ message: (error as Error).message, timestamp: Date.now() }]
      };
    }
  }, []);

  const resolveDependencies = useCallback((dependencyGraph: DependencyGraph): string[] => {
    // Simple topological sort implementation
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    // Initialize
    dependencyGraph.nodes.forEach(node => {
      inDegree.set(node, 0);
      graph.set(node, []);
    });

    // Build graph and calculate in-degrees
    dependencyGraph.edges.forEach(edge => {
      graph.get(edge.from)?.push(edge.to);
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    });

    // Topological sort
    const queue: string[] = [];
    const result: string[] = [];

    inDegree.forEach((degree, node) => {
      if (degree === 0) queue.push(node);
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      graph.get(current)?.forEach(neighbor => {
        const newDegree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      });
    }

    return result;
  }, []);

  const calculateOverallQuality = useCallback((results: Map<string, TaskResult>): number => {
    const validResults = Array.from(results.values()).filter(r => r.status === 'completed');
    if (validResults.length === 0) return 0;

    const averageQuality = validResults.reduce((sum, r) => sum + r.quality, 0) / validResults.length;
    return Math.round(averageQuality * 100) / 100;
  }, []);

  const pauseExecution = useCallback((executionId: string) => {
    setExecutions(prev => prev.map(e => 
      e.id === executionId ? { ...e, status: 'paused' } : e
    ));
  }, []);

  const cancelExecution = useCallback((executionId: string) => {
    setExecutions(prev => prev.map(e => 
      e.id === executionId ? { ...e, status: 'cancelled', endTime: Date.now() } : e
    ));
  }, []);

  return {
    workflows,
    executions,
    activeExecution,
    engineState,
    createWorkflow,
    executeWorkflow,
    pauseExecution,
    cancelExecution,
    setActiveExecution
  };
};

// ===== AI ORCHESTRATOR HOOK =====

const useAIOrchestrator = () => {
  const [orchestrationConfig, setOrchestrationConfig] = useState<AIOrchestrationConfig>({
    providers: [
      { id: 'openai', name: 'OpenAI', endpoint: 'api.openai.com', weight: 0.4, cost: 0.02 },
      { id: 'anthropic', name: 'Anthropic', endpoint: 'api.anthropic.com', weight: 0.3, cost: 0.015 },
      { id: 'google', name: 'Google AI', endpoint: 'api.google.com', weight: 0.3, cost: 0.01 }
    ],
    routing: 'cost-optimized',
    loadBalancing: 'resource-based',
    failover: { enabled: true, maxRetries: 3, backoffMultiplier: 2 },
    optimization: { cacheEnabled: true, batchingEnabled: true, compressionEnabled: true },
    monitoring: { metricsEnabled: true, alertingEnabled: true, loggingLevel: 'info' }
  });

  const [orchestrationState, setOrchestrationState] = useState({
    activeTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    resourceUtilization: new Map<string, number>()
  });

  const [resourceAllocations, setResourceAllocations] = useState<ResourceAllocation[]>([]);

  const orchestrateAITask = useCallback(async (taskDefinition: TaskDefinition, context: ExecutionContext) => {
    const startTime = Date.now();
    
    // Select optimal AI provider
    const selectedProvider = selectOptimalProvider(taskDefinition, orchestrationConfig);
    
    // Allocate resources
    const allocation: ResourceAllocation = {
      taskId: taskDefinition.id,
      providerId: selectedProvider.id,
      allocated: 100, // Percentage of capacity
      used: 0,
      efficiency: 0,
      cost: 0
    };

    setResourceAllocations(prev => [...prev, allocation]);
    setOrchestrationState(prev => ({ 
      ...prev, 
      activeTasks: prev.activeTasks + 1,
      totalRequests: prev.totalRequests + 1
    }));

    try {
      // Simulate AI task execution
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Update allocation with results
      const endTime = Date.now();
      const duration = endTime - startTime;
      const cost = selectedProvider.cost * (duration / 1000);

      setResourceAllocations(prev => prev.map(a => 
        a.taskId === taskDefinition.id ? {
          ...a,
          used: 85 + Math.random() * 15,
          efficiency: 75 + Math.random() * 25,
          cost
        } : a
      ));

      setOrchestrationState(prev => ({ 
        ...prev, 
        activeTasks: prev.activeTasks - 1,
        completedTasks: prev.completedTasks + 1,
        averageResponseTime: (prev.averageResponseTime * prev.completedTasks + duration) / (prev.completedTasks + 1)
      }));

      notifications.show({
        title: 'AI Task Completed',
        message: `Task orchestrated through ${selectedProvider.name}`,
        color: 'green'
      });

      return {
        success: true,
        provider: selectedProvider.id,
        duration,
        cost,
        result: `AI result from ${selectedProvider.name}`
      };

    } catch (error) {
      setOrchestrationState(prev => ({ 
        ...prev, 
        activeTasks: prev.activeTasks - 1,
        failedTasks: prev.failedTasks + 1
      }));

      notifications.show({
        title: 'AI Task Failed',
        message: `Task orchestration failed: ${(error as Error).message}`,
        color: 'red'
      });

      throw error;
    }
  }, [orchestrationConfig]);

  const selectOptimalProvider = useCallback((task: TaskDefinition, config: AIOrchestrationConfig) => {
    switch (config.routing) {
      case 'cost-optimized':
        return config.providers.reduce((best, current) => 
          current.cost < best.cost ? current : best
        );
      case 'performance-based':
        return config.providers.reduce((best, current) => 
          current.weight > best.weight ? current : best
        );
      case 'weighted':
        // Simple weighted selection based on availability
        const available = config.providers.filter(p => 
          (orchestrationState.resourceUtilization.get(p.id) || 0) < 80
        );
        return available.length > 0 ? available[0] : config.providers[0];
      default:
        return config.providers[Math.floor(Math.random() * config.providers.length)];
    }
  }, [orchestrationState]);

  const optimizeResourceAllocation = useCallback(() => {
    // Analyze current allocations and suggest optimizations
    const totalCost = resourceAllocations.reduce((sum, a) => sum + a.cost, 0);
    const averageEfficiency = resourceAllocations.reduce((sum, a) => sum + a.efficiency, 0) / resourceAllocations.length;

    const recommendations = [];
    
    if (averageEfficiency < 70) {
      recommendations.push('Consider switching to higher-performance providers');
    }
    if (totalCost > 100) {
      recommendations.push('Cost optimization needed - switch to more cost-effective providers');
    }

    return {
      totalCost,
      averageEfficiency,
      recommendations,
      utilization: orchestrationState.resourceUtilization
    };
  }, [resourceAllocations, orchestrationState]);

  return {
    orchestrationConfig,
    orchestrationState,
    resourceAllocations,
    orchestrateAITask,
    optimizeResourceAllocation,
    setOrchestrationConfig
  };
};

// ===== TASK PIPELINE HOOK =====

const useTaskPipeline = () => {
  const [pipelines, setPipelines] = useState<TaskPipeline[]>([]);
  const [pipelineExecutions, setPipelineExecutions] = useState<PipelineExecution[]>([]);
  const [activePipeline, setActivePipeline] = useState<PipelineExecution | null>(null);

  const createPipeline = useCallback((stages: PipelineStage[], configuration: PipelineConfiguration) => {
    const pipeline: TaskPipeline = {
      id: `pipeline_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      stages,
      configuration,
      executor: { parallelism: configuration.maxParallelStages || 3 },
      monitor: { enabled: true, detailLevel: 'full' }
    };

    setPipelines(prev => [...prev, pipeline]);

    notifications.show({
      title: 'Pipeline Created',
      message: 'Task pipeline created successfully',
      color: 'green'
    });

    return pipeline;
  }, []);

  const executePipeline = useCallback(async (pipelineId: string, inputData: any) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    if (!pipeline) throw new Error('Pipeline not found');

    const execution: PipelineExecution = {
      pipelineId,
      executionId: `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: 'running',
      currentStage: pipeline.stages[0]?.id || '',
      stageResults: new Map(),
      dataFlow: { input: inputData, intermediate: new Map(), output: null },
      metrics: {
        totalDuration: 0,
        stageDurations: new Map(),
        throughput: 0,
        errorRate: 0,
        resourceUsage: new Map()
      },
      startTime: Date.now()
    };

    setPipelineExecutions(prev => [...prev, execution]);
    setActivePipeline(execution);

    try {
      let currentData = inputData;

      for (const stage of pipeline.stages) {
        // Update current stage
        setPipelineExecutions(prev => prev.map(e => 
          e.executionId === execution.executionId ? { ...e, currentStage: stage.id } : e
        ));

        // Execute stage
        const stageResult = await executeStage(stage, currentData, execution);
        
        // Update results
        setPipelineExecutions(prev => prev.map(e => 
          e.executionId === execution.executionId ? {
            ...e,
            stageResults: new Map(e.stageResults).set(stage.id, stageResult),
            dataFlow: { ...e.dataFlow, intermediate: new Map(e.dataFlow.intermediate).set(stage.id, stageResult.output) }
          } : e
        ));

        if (stageResult.status === 'failed') {
          throw new Error(`Stage ${stage.name} failed: ${stageResult.error}`);
        }

        currentData = stageResult.output;
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Complete pipeline
      const endTime = Date.now();
      setPipelineExecutions(prev => prev.map(e => 
        e.executionId === execution.executionId ? {
          ...e,
          status: 'completed',
          endTime,
          dataFlow: { ...e.dataFlow, output: currentData },
          metrics: {
            ...e.metrics,
            totalDuration: endTime - execution.startTime,
            throughput: pipeline.stages.length / ((endTime - execution.startTime) / 1000)
          }
        } : e
      ));

      notifications.show({
        title: 'Pipeline Completed',
        message: 'Task pipeline executed successfully',
        color: 'green'
      });

      return currentData;

    } catch (error) {
      setPipelineExecutions(prev => prev.map(e => 
        e.executionId === execution.executionId ? {
          ...e,
          status: 'failed',
          endTime: Date.now()
        } : e
      ));

      notifications.show({
        title: 'Pipeline Failed',
        message: `Pipeline execution failed: ${(error as Error).message}`,
        color: 'red'
      });

      throw error;
    }
  }, [pipelines]);

  const executeStage = useCallback(async (stage: PipelineStage, inputData: any, execution: PipelineExecution): Promise<StageResult> => {
    const startTime = Date.now();

    try {
      // Simulate stage processing
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      // Process data based on stage type
      let output;
      switch (stage.processor.type) {
        case 'transform':
          output = { ...inputData, transformed: true, stage: stage.name };
          break;
        case 'filter':
          output = { ...inputData, filtered: true, items: Math.floor(Math.random() * 100) };
          break;
        case 'aggregate':
          output = { summary: 'Aggregated data', count: Math.floor(Math.random() * 1000) };
          break;
        case 'validate':
          output = { ...inputData, valid: Math.random() > 0.1 };
          break;
        default:
          output = { ...inputData, processed: true };
      }

      const endTime = Date.now();
      
      return {
        stageId: stage.id,
        status: 'completed',
        output,
        startTime,
        endTime,
        duration: endTime - startTime,
        metadata: { resourcesUsed: Math.random() * 50 }
      };

    } catch (error) {
      return {
        stageId: stage.id,
        status: 'failed',
        output: null,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        error: (error as Error).message,
        metadata: {}
      };
    }
  }, []);

  const visualizePipeline = useCallback((pipelineId: string): WorkflowVisualization => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    if (!pipeline) return { nodes: [], edges: [], layout: {}, styling: {}, interactivity: {} };

    const nodes: WorkflowNode[] = pipeline.stages.map((stage, index) => ({
      id: stage.id,
      label: stage.name,
      type: 'stage',
      position: { x: index * 150, y: 50 },
      data: stage,
      status: getStageStatus(stage.id)
    }));

    const edges: WorkflowEdge[] = [];
    for (let i = 0; i < pipeline.stages.length - 1; i++) {
      edges.push({
        id: `edge_${i}`,
        source: pipeline.stages[i].id,
        target: pipeline.stages[i + 1].id,
        type: 'sequential'
      });
    }

    return {
      nodes,
      edges,
      layout: { direction: 'horizontal', spacing: 150 },
      styling: { theme: 'modern', animations: true },
      interactivity: { zoomEnabled: true, panEnabled: true }
    };
  }, [pipelines, activePipeline]);

  const getStageStatus = useCallback((stageId: string): TaskStatus => {
    if (!activePipeline) return 'pending';
    
    const result = activePipeline.stageResults.get(stageId);
    if (result) return result.status === 'completed' ? 'completed' : 'failed';
    
    return activePipeline.currentStage === stageId ? 'running' : 'pending';
  }, [activePipeline]);

  return {
    pipelines,
    pipelineExecutions,
    activePipeline,
    createPipeline,
    executePipeline,
    visualizePipeline,
    setActivePipeline
  };
};

// ===== RESULT AGGREGATOR HOOK =====

const useResultAggregator = () => {
  const [aggregationStrategies, setAggregationStrategies] = useState<AggregationStrategy[]>([
    {
      method: 'weighted-average',
      weights: new Map([['quality', 0.4], ['confidence', 0.3], ['speed', 0.3]]),
      qualityThreshold: 0.7,
      confidenceThreshold: 0.8,
      conflictResolution: 'highest-confidence'
    }
  ]);

  const [aggregationResults, setAggregationResults] = useState<AggregatedResult[]>([]);

  const aggregateResults = useCallback(async (results: TaskResult[], strategy: AggregationStrategy) => {
    const startTime = Date.now();

    try {
      // Filter results by quality and confidence thresholds
      const qualifiedResults = results.filter(r => 
        r.quality >= strategy.qualityThreshold * 100 && 
        r.confidence >= strategy.confidenceThreshold * 100
      );

      if (qualifiedResults.length === 0) {
        throw new Error('No results meet the quality and confidence thresholds');
      }

      let aggregatedResult;
      switch (strategy.method) {
        case 'weighted-average':
          aggregatedResult = performWeightedAverageAggregation(qualifiedResults, strategy.weights);
          break;
        case 'majority-vote':
          aggregatedResult = performMajorityVoteAggregation(qualifiedResults);
          break;
        case 'consensus':
          aggregatedResult = performConsensusAggregation(qualifiedResults);
          break;
        case 'best-quality':
          aggregatedResult = qualifiedResults.reduce((best, current) => 
            current.quality > best.quality ? current : best
          );
          break;
        default:
          throw new Error(`Unknown aggregation method: ${strategy.method}`);
      }

      const endTime = Date.now();
      const finalResult: AggregatedResult = {
        id: `agg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        sourceResults: results.map(r => r.taskId),
        method: strategy.method,
        result: aggregatedResult,
        confidence: calculateAggregatedConfidence(qualifiedResults),
        quality: calculateAggregatedQuality(qualifiedResults),
        metadata: {
          sourceCount: results.length,
          qualifiedCount: qualifiedResults.length,
          aggregationTime: endTime - startTime,
          strategy: strategy.method
        },
        timestamp: Date.now()
      };

      setAggregationResults(prev => [...prev, finalResult]);

      notifications.show({
        title: 'Results Aggregated',
        message: `Successfully aggregated ${qualifiedResults.length} results using ${strategy.method}`,
        color: 'green'
      });

      return finalResult;

    } catch (error) {
      notifications.show({
        title: 'Aggregation Failed',
        message: `Result aggregation failed: ${(error as Error).message}`,
        color: 'red'
      });
      throw error;
    }
  }, []);

  const performWeightedAverageAggregation = useCallback((results: TaskResult[], weights: Map<string, number>) => {
    // Simplified weighted average based on quality and confidence
    let totalWeight = 0;
    let weightedSum = 0;

    results.forEach(result => {
      const weight = (result.quality * (weights.get('quality') || 0.5)) + 
                    (result.confidence * (weights.get('confidence') || 0.5));
      weightedSum += weight;
      totalWeight += 1;
    });

    return {
      aggregatedValue: weightedSum / totalWeight,
      method: 'weighted-average',
      contributors: results.length
    };
  }, []);

  const performMajorityVoteAggregation = useCallback((results: TaskResult[]) => {
    // Simple majority vote based on most common result pattern
    const votes = new Map<string, number>();
    
    results.forEach(result => {
      const key = JSON.stringify(result.result);
      votes.set(key, (votes.get(key) || 0) + 1);
    });

    const winner = Array.from(votes.entries()).reduce((a, b) => a[1] > b[1] ? a : b);
    
    return {
      result: JSON.parse(winner[0]),
      votes: winner[1],
      totalVotes: results.length,
      method: 'majority-vote'
    };
  }, []);

  const performConsensusAggregation = useCallback((results: TaskResult[]) => {
    // Consensus-based aggregation requiring high agreement
    const consensusThreshold = 0.8;
    const agreement = results.filter(r => r.quality > 80 && r.confidence > 80).length / results.length;
    
    if (agreement < consensusThreshold) {
      throw new Error('Insufficient consensus among results');
    }

    return {
      consensusReached: true,
      agreement,
      result: results.find(r => r.quality === Math.max(...results.map(r => r.quality)))?.result,
      method: 'consensus'
    };
  }, []);

  const calculateAggregatedConfidence = useCallback((results: TaskResult[]): number => {
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const consensusFactor = results.length > 1 ? Math.min(1.1, 1 + (results.length - 1) * 0.05) : 1;
    return Math.min(100, avgConfidence * consensusFactor);
  }, []);

  const calculateAggregatedQuality = useCallback((results: TaskResult[]): number => {
    const avgQuality = results.reduce((sum, r) => sum + r.quality, 0) / results.length;
    const diversityBonus = new Set(results.map(r => r.metadata.provider)).size > 1 ? 5 : 0;
    return Math.min(100, avgQuality + diversityBonus);
  }, []);

  const resolveConflicts = useCallback((conflictingResults: TaskResult[], strategy: ConflictResolutionStrategy) => {
    switch (strategy) {
      case 'highest-confidence':
        return conflictingResults.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
      case 'voting':
        return performMajorityVoteAggregation(conflictingResults);
      case 'manual-review':
        // In a real implementation, this would trigger a manual review process
        return { requiresManualReview: true, conflictingResults };
      default:
        return conflictingResults[0];
    }
  }, [performMajorityVoteAggregation]);

  return {
    aggregationStrategies,
    aggregationResults,
    aggregateResults,
    resolveConflicts,
    setAggregationStrategies
  };
};

// ===== WORKFLOW VISUALIZATION COMPONENT =====

interface WorkflowVisualizationProps {
  workflow: WorkflowDefinition | null;
  execution: WorkflowExecution | null;
  pipeline: ReturnType<typeof useTaskPipeline>;
}

const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
  workflow,
  execution,
  pipeline
}) => {
  const renderWorkflowDiagram = () => {
    if (!workflow) return <Text c="dimmed">No workflow selected</Text>;

    return (
      <Stack>
        <Group justify="space-between" mb="md">
          <Text fw={500}>Workflow: {workflow.name}</Text>
          <Badge color={execution?.status === 'completed' ? 'green' : execution?.status === 'running' ? 'blue' : 'gray'}>
            {execution?.status || 'idle'}
          </Badge>
        </Group>

        <Stepper
          active={execution?.currentStep || 0}
          breakpoint="sm"
          orientation="horizontal"
        >
          {workflow.tasks.map((task, index) => {
            const result = execution?.results.get(task.id);
            const isActive = execution?.currentStep === index + 1;
            const isCompleted = result?.status === 'completed';
            const isFailed = result?.status === 'failed';

            return (
              <Stepper.Step
                key={task.id}
                label={task.name}
                description={task.type}
                icon={
                  isFailed ? <IconX size={16} /> : 
                  isCompleted ? <IconCheck size={16} /> :
                  isActive ? <IconClock size={16} /> : 
                  undefined
                }
                color={
                  isFailed ? 'red' : 
                  isCompleted ? 'green' : 
                  isActive ? 'blue' : 'gray'
                }
              >
                {result && (
                  <Paper p="sm" withBorder mt="sm">
                    <Group justify="space-between">
                      <Text size="sm">Quality: {result.quality.toFixed(1)}%</Text>
                      <Text size="sm">Duration: {result.duration}ms</Text>
                    </Group>
                  </Paper>
                )}
              </Stepper.Step>
            );
          })}
        </Stepper>
      </Stack>
    );
  };

  const renderPipelineVisualization = () => {
    if (!pipeline.activePipeline) return <Text c="dimmed">No active pipeline</Text>;

    const pipelineData = pipeline.pipelines.find(p => p.id === pipeline.activePipeline?.pipelineId);
    if (!pipelineData) return <Text c="dimmed">Pipeline not found</Text>;

    return (
      <Stack>
        <Group justify="space-between" mb="md">
          <Text fw={500}>Pipeline Execution</Text>
          <Badge color={pipeline.activePipeline.status === 'completed' ? 'green' : 'blue'}>
            {pipeline.activePipeline.status}
          </Badge>
        </Group>

        <Timeline>
          {pipelineData.stages.map(stage => {
            const result = pipeline.activePipeline?.stageResults.get(stage.id);
            const isCurrent = pipeline.activePipeline?.currentStage === stage.id;
            const isCompleted = result?.status === 'completed';
            const isFailed = result?.status === 'failed';

            return (
              <Timeline.Item
                key={stage.id}
                title={stage.name}
                bullet={
                  isFailed ? <IconX size={12} /> :
                  isCompleted ? <IconCheck size={12} /> :
                  isCurrent ? <IconClock size={12} /> :
                  <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#e9ecef' }} />
                }
                color={
                  isFailed ? 'red' :
                  isCompleted ? 'green' :
                  isCurrent ? 'blue' : 'gray'
                }
              >
                <Text size="sm" c="dimmed">
                  {stage.processor.type} stage
                  {result && ` • ${result.duration}ms`}
                </Text>
              </Timeline.Item>
            );
          })}
        </Timeline>
      </Stack>
    );
  };

  return (
    <Card>
      <Tabs defaultValue="workflow">
        <Tabs.List>
          <Tabs.Tab value="workflow">Workflow Diagram</Tabs.Tab>
          <Tabs.Tab value="pipeline">Pipeline Flow</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="workflow" pt="md">
          {renderWorkflowDiagram()}
        </Tabs.Panel>

        <Tabs.Panel value="pipeline" pt="md">
          {renderPipelineVisualization()}
        </Tabs.Panel>
      </Tabs>
    </Card>
  );
};

// ===== MAIN COMPONENT =====

export const AIPoweredWorkflowsExercise: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>('engine');
  
  const workflowEngine = useWorkflowEngine();
  const aiOrchestrator = useAIOrchestrator();
  const taskPipeline = useTaskPipeline();
  const resultAggregator = useResultAggregator();

  const [demoWorkflowName, setDemoWorkflowName] = useState('AI Content Generation Workflow');

  const handleCreateDemoWorkflow = () => {
    const tasks: TaskDefinition[] = [
      {
        id: 'task-1',
        name: 'Generate Content',
        type: 'ai-generation',
        aiProvider: 'openai',
        configuration: { model: 'gpt-4', temperature: 0.7 },
        dependencies: [],
        validation: { required: true, minLength: 100 },
        timeout: 30000,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2 },
        errorHandling: { strategy: 'retry', fallbackAction: 'skip' }
      },
      {
        id: 'task-2',
        name: 'Analyze Content',
        type: 'ai-analysis',
        aiProvider: 'anthropic',
        configuration: { model: 'claude-3', temperature: 0.3 },
        dependencies: ['task-1'],
        validation: { required: true },
        timeout: 20000,
        retryPolicy: { maxRetries: 2, backoffMultiplier: 1.5 },
        errorHandling: { strategy: 'fail-fast', fallbackAction: 'alert' }
      },
      {
        id: 'task-3',
        name: 'Aggregate Results',
        type: 'aggregation',
        configuration: { method: 'weighted-average' },
        dependencies: ['task-1', 'task-2'],
        validation: { required: true },
        timeout: 10000,
        retryPolicy: { maxRetries: 1, backoffMultiplier: 1 },
        errorHandling: { strategy: 'retry', fallbackAction: 'manual-review' }
      }
    ];

    const dependencyGraph: DependencyGraph = {
      nodes: ['task-1', 'task-2', 'task-3'],
      edges: [
        { from: 'task-1', to: 'task-2', type: 'sequential' },
        { from: 'task-1', to: 'task-3', type: 'parallel' },
        { from: 'task-2', to: 'task-3', type: 'sequential' }
      ],
      resolved: []
    };

    workflowEngine.createWorkflow({
      name: demoWorkflowName,
      description: 'Demo workflow for AI-powered content generation and analysis',
      tasks,
      dependencies: dependencyGraph,
      configuration: { maxRetries: 3, timeout: 60000, parallelism: 2 },
      triggers: [{ type: 'manual', configuration: {} }]
    });
  };

  const handleExecuteWorkflow = () => {
    if (workflowEngine.workflows.length === 0) {
      handleCreateDemoWorkflow();
      setTimeout(() => {
        if (workflowEngine.workflows.length > 0) {
          workflowEngine.executeWorkflow(workflowEngine.workflows[0].id);
        }
      }, 100);
    } else {
      workflowEngine.executeWorkflow(workflowEngine.workflows[0].id);
    }
  };

  const handleCreateDemoPipeline = () => {
    const stages: PipelineStage[] = [
      {
        id: 'stage-1',
        name: 'Data Input',
        processor: { type: 'transform', configuration: {} },
        dependencies: [],
        configuration: { bufferSize: 1000 },
        validation: { required: true },
        errorHandling: { strategy: 'retry', maxRetries: 3 },
        parallelizable: false,
        timeout: 5000
      },
      {
        id: 'stage-2',
        name: 'AI Processing',
        processor: { type: 'ai-analysis', configuration: {} },
        dependencies: ['stage-1'],
        configuration: { batchSize: 10 },
        validation: { required: true, qualityThreshold: 0.8 },
        errorHandling: { strategy: 'skip', maxRetries: 2 },
        parallelizable: true,
        timeout: 15000
      },
      {
        id: 'stage-3',
        name: 'Result Validation',
        processor: { type: 'validate', configuration: {} },
        dependencies: ['stage-2'],
        configuration: { strictMode: true },
        validation: { required: true },
        errorHandling: { strategy: 'fail-fast', maxRetries: 1 },
        parallelizable: false,
        timeout: 3000
      }
    ];

    taskPipeline.createPipeline(stages, {
      maxParallelStages: 3,
      bufferSize: 1000,
      errorStrategy: 'continue-on-error',
      monitoringEnabled: true
    });
  };

  const handleExecutePipeline = () => {
    if (taskPipeline.pipelines.length === 0) {
      handleCreateDemoPipeline();
      setTimeout(() => {
        if (taskPipeline.pipelines.length > 0) {
          taskPipeline.executePipeline(taskPipeline.pipelines[0].id, { 
            message: 'Demo pipeline input data',
            timestamp: Date.now()
          });
        }
      }, 100);
    } else {
      taskPipeline.executePipeline(taskPipeline.pipelines[0].id, { 
        message: 'Demo pipeline input data',
        timestamp: Date.now()
      });
    }
  };

  return (
    <Container size="xl" p="md">
      <Stack>
        <div>
          <h1>AI-Powered Workflows</h1>
          <p>Complex AI workflow orchestration systems with multi-step processing and intelligent result composition</p>
        </div>

        <Tabs value={selectedDemo} onChange={(value) => setSelectedDemo(value || '')}>
          <Tabs.List>
            <Tabs.Tab value="engine">Workflow Engine</Tabs.Tab>
            <Tabs.Tab value="orchestrator">AI Orchestrator</Tabs.Tab>
            <Tabs.Tab value="pipeline">Task Pipeline</Tabs.Tab>
            <Tabs.Tab value="aggregator">Result Aggregator</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="engine" pt="md">
            <Stack>
              <Card>
                <Group justify="space-between" mb="md">
                  <Text fw={500}>Workflow Engine</Text>
                  <Group>
                    <Badge color={workflowEngine.engineState.isRunning ? 'green' : 'gray'}>
                      {workflowEngine.engineState.isRunning ? 'Running' : 'Idle'}
                    </Badge>
                    <Badge>Workflows: {workflowEngine.workflows.length}</Badge>
                  </Group>
                </Group>

                <Grid mb="md">
                  <Grid.Col span={3}>
                    <Paper p="sm" withBorder ta="center">
                      <Text size="sm" c="dimmed">Completed</Text>
                      <Text fw={500} size="lg">{workflowEngine.engineState.completedExecutions}</Text>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Paper p="sm" withBorder ta="center">
                      <Text size="sm" c="dimmed">Failed</Text>
                      <Text fw={500} size="lg">{workflowEngine.engineState.failedExecutions}</Text>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Paper p="sm" withBorder ta="center">
                      <Text size="sm" c="dimmed">Queued</Text>
                      <Text fw={500} size="lg">{workflowEngine.engineState.queuedExecutions}</Text>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Paper p="sm" withBorder ta="center">
                      <Text size="sm" c="dimmed">Avg Time</Text>
                      <Text fw={500} size="lg">{Math.round(workflowEngine.engineState.averageExecutionTime)}ms</Text>
                    </Paper>
                  </Grid.Col>
                </Grid>

                <Group mb="md">
                  <TextInput
                    placeholder="Workflow name"
                    value={demoWorkflowName}
                    onChange={(e) => setDemoWorkflowName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    leftSection={<IconWorkflow size={16} />}
                    onClick={handleCreateDemoWorkflow}
                  >
                    Create Workflow
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<IconPlay size={16} />}
                    onClick={handleExecuteWorkflow}
                    disabled={workflowEngine.engineState.isRunning}
                  >
                    Execute
                  </Button>
                </Group>

                {workflowEngine.executions.length > 0 && (
                  <WorkflowVisualization
                    workflow={workflowEngine.workflows[0] || null}
                    execution={workflowEngine.activeExecution}
                    pipeline={taskPipeline}
                  />
                )}
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="orchestrator" pt="md">
            <Stack>
              <Card>
                <Group justify="space-between" mb="md">
                  <Text fw={500}>AI Orchestrator</Text>
                  <Badge>Providers: {aiOrchestrator.orchestrationConfig.providers.length}</Badge>
                </Group>

                <Grid mb="md">
                  <Grid.Col span={4}>
                    <Paper p="sm" withBorder ta="center">
                      <Text size="sm" c="dimmed">Active Tasks</Text>
                      <Text fw={500} size="lg">{aiOrchestrator.orchestrationState.activeTasks}</Text>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Paper p="sm" withBorder ta="center">
                      <Text size="sm" c="dimmed">Completed</Text>
                      <Text fw={500} size="lg">{aiOrchestrator.orchestrationState.completedTasks}</Text>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Paper p="sm" withBorder ta="center">
                      <Text size="sm" c="dimmed">Avg Response</Text>
                      <Text fw={500} size="lg">{Math.round(aiOrchestrator.orchestrationState.averageResponseTime)}ms</Text>
                    </Paper>
                  </Grid.Col>
                </Grid>

                <Text fw={500} mb="sm">AI Providers</Text>
                <Stack gap="sm" mb="md">
                  {aiOrchestrator.orchestrationConfig.providers.map(provider => (
                    <Paper key={provider.id} p="sm" withBorder>
                      <Group justify="space-between">
                        <Group>
                          <Text fw={500}>{provider.name}</Text>
                          <Badge size="sm">Weight: {provider.weight}</Badge>
                        </Group>
                        <Text size="sm" c="dimmed">
                          Cost: ${provider.cost}/1k tokens
                        </Text>
                      </Group>
                    </Paper>
                  ))}
                </Stack>

                <Group>
                  <Select
                    label="Routing Strategy"
                    value={aiOrchestrator.orchestrationConfig.routing}
                    onChange={(value) => {
                      if (value) {
                        aiOrchestrator.setOrchestrationConfig(prev => ({
                          ...prev,
                          routing: value as RoutingStrategy
                        }));
                      }
                    }}
                    data={[
                      { value: 'cost-optimized', label: 'Cost Optimized' },
                      { value: 'performance-based', label: 'Performance Based' },
                      { value: 'weighted', label: 'Weighted' },
                      { value: 'round-robin', label: 'Round Robin' }
                    ]}
                    style={{ flex: 1 }}
                  />
                  <Button
                    leftSection={<IconTarget size={16} />}
                    onClick={() => {
                      const optimization = aiOrchestrator.optimizeResourceAllocation();
                      notifications.show({
                        title: 'Optimization Analysis',
                        message: `Avg efficiency: ${optimization.averageEfficiency.toFixed(1)}% | Total cost: $${optimization.totalCost.toFixed(2)}`,
                        color: 'blue'
                      });
                    }}
                  >
                    Optimize
                  </Button>
                </Group>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="pipeline" pt="md">
            <Stack>
              <Card>
                <Group justify="space-between" mb="md">
                  <Text fw={500}>Task Pipeline</Text>
                  <Group>
                    <Badge color={taskPipeline.activePipeline?.status === 'running' ? 'blue' : 'gray'}>
                      {taskPipeline.activePipeline?.status || 'idle'}
                    </Badge>
                    <Badge>Pipelines: {taskPipeline.pipelines.length}</Badge>
                  </Group>
                </Group>

                <Group mb="md">
                  <Button
                    leftSection={<IconStack size={16} />}
                    onClick={handleCreateDemoPipeline}
                  >
                    Create Pipeline
                  </Button>
                  <Button
                    variant="light"
                    leftSection={<IconPlay size={16} />}
                    onClick={handleExecutePipeline}
                    disabled={taskPipeline.activePipeline?.status === 'running'}
                  >
                    Execute Pipeline
                  </Button>
                </Group>

                {taskPipeline.activePipeline && (
                  <Card withBorder>
                    <Group justify="space-between" mb="md">
                      <Text fw={500}>Pipeline Execution</Text>
                      <Badge color={taskPipeline.activePipeline.status === 'completed' ? 'green' : 'blue'}>
                        {taskPipeline.activePipeline.status}
                      </Badge>
                    </Group>

                    <Grid mb="md">
                      <Grid.Col span={4}>
                        <Text size="sm" c="dimmed">Current Stage</Text>
                        <Text fw={500}>{taskPipeline.activePipeline.currentStage}</Text>
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <Text size="sm" c="dimmed">Completed Stages</Text>
                        <Text fw={500}>{taskPipeline.activePipeline.stageResults.size}</Text>
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <Text size="sm" c="dimmed">Total Duration</Text>
                        <Text fw={500}>{taskPipeline.activePipeline.metrics.totalDuration}ms</Text>
                      </Grid.Col>
                    </Grid>

                    {taskPipeline.activePipeline.metrics.totalDuration > 0 && (
                      <Progress
                        value={(taskPipeline.activePipeline.stageResults.size / (taskPipeline.pipelines[0]?.stages.length || 1)) * 100}
                        label={`${taskPipeline.activePipeline.stageResults.size} / ${taskPipeline.pipelines[0]?.stages.length || 0} stages`}
                        size="lg"
                        radius="md"
                      />
                    )}
                  </Card>
                )}
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="aggregator" pt="md">
            <Stack>
              <Card>
                <Group justify="space-between" mb="md">
                  <Text fw={500}>Result Aggregator</Text>
                  <Badge>Results: {resultAggregator.aggregationResults.length}</Badge>
                </Group>

                <Grid mb="md">
                  <Grid.Col span={6}>
                    <Select
                      label="Aggregation Method"
                      value={resultAggregator.aggregationStrategies[0]?.method}
                      onChange={(value) => {
                        if (value) {
                          resultAggregator.setAggregationStrategies(prev => [
                            {
                              ...prev[0],
                              method: value as AggregationMethod
                            }
                          ]);
                        }
                      }}
                      data={[
                        { value: 'weighted-average', label: 'Weighted Average' },
                        { value: 'majority-vote', label: 'Majority Vote' },
                        { value: 'consensus', label: 'Consensus' },
                        { value: 'best-quality', label: 'Best Quality' }
                      ]}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Select
                      label="Conflict Resolution"
                      value={resultAggregator.aggregationStrategies[0]?.conflictResolution}
                      data={[
                        { value: 'highest-confidence', label: 'Highest Confidence' },
                        { value: 'voting', label: 'Voting' },
                        { value: 'manual-review', label: 'Manual Review' }
                      ]}
                    />
                  </Grid.Col>
                </Grid>

                <Button
                  leftSection={<IconChartDots size={16} />}
                  onClick={() => {
                    // Simulate aggregating some demo results
                    const demoResults: TaskResult[] = [
                      {
                        taskId: 'demo-1',
                        status: 'completed',
                        result: { value: 85 },
                        startTime: Date.now() - 2000,
                        endTime: Date.now() - 1000,
                        duration: 1000,
                        quality: 87,
                        confidence: 92,
                        metadata: { provider: 'openai' },
                        errors: []
                      },
                      {
                        taskId: 'demo-2', 
                        status: 'completed',
                        result: { value: 78 },
                        startTime: Date.now() - 2000,
                        endTime: Date.now() - 800,
                        duration: 1200,
                        quality: 82,
                        confidence: 88,
                        metadata: { provider: 'anthropic' },
                        errors: []
                      }
                    ];

                    resultAggregator.aggregateResults(demoResults, resultAggregator.aggregationStrategies[0]);
                  }}
                  mb="md"
                >
                  Test Aggregation
                </Button>

                {resultAggregator.aggregationResults.length > 0 && (
                  <Card withBorder>
                    <Text fw={500} mb="md">Recent Aggregation Results</Text>
                    <Stack gap="sm">
                      {resultAggregator.aggregationResults.slice(-3).map(result => (
                        <Paper key={result.id} p="sm" withBorder>
                          <Group justify="space-between" mb="xs">
                            <Badge>{result.method}</Badge>
                            <Text size="xs" c="dimmed">
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </Text>
                          </Group>
                          <Grid>
                            <Grid.Col span={4}>
                              <Text size="sm" c="dimmed">Quality</Text>
                              <Text fw={500}>{result.quality.toFixed(1)}%</Text>
                            </Grid.Col>
                            <Grid.Col span={4}>
                              <Text size="sm" c="dimmed">Confidence</Text>
                              <Text fw={500}>{result.confidence.toFixed(1)}%</Text>
                            </Grid.Col>
                            <Grid.Col span={4}>
                              <Text size="sm" c="dimmed">Sources</Text>
                              <Text fw={500}>{result.metadata.sourceCount}</Text>
                            </Grid.Col>
                          </Grid>
                        </Paper>
                      ))}
                    </Stack>
                  </Card>
                )}
              </Card>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default AIPoweredWorkflowsExercise;