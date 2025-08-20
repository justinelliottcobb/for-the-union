import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ===== TYPES AND INTERFACES =====

interface LoadTestMetrics {
  startTime: number;
  duration: number;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  connectionCount: number;
  messageCount: number;
}

interface UserJourney {
  id: string;
  name: string;
  steps: UserStep[];
  thinkTime: number[];
  probability: number;
  priority: 'low' | 'medium' | 'high';
}

interface UserStep {
  action: 'navigate' | 'click' | 'input' | 'scroll' | 'wait' | 'websocket' | 'api';
  target: string;
  data?: any;
  expectedTime?: number;
  assertions?: string[];
}

interface LoadTestConfig {
  maxConcurrentUsers: number;
  rampUpDuration: number;
  sustainedDuration: number;
  rampDownDuration: number;
  targetRPS: number;
  dataVolumeSize: number;
  webSocketConnections: number;
  messageRate: number;
}

interface PerformanceThresholds {
  maxResponseTime: number;
  maxErrorRate: number;
  minThroughput: number;
  maxMemoryUsage: number;
  maxCPUUsage: number;
  maxConnectionLatency: number;
}

interface WebSocketMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  size: number;
}

interface UserSession {
  id: string;
  startTime: number;
  isActive: boolean;
  currentStep: number;
  journey: UserJourney;
  metrics: {
    requestCount: number;
    errorCount: number;
    totalTime: number;
  };
}

interface DataBatch {
  id: string;
  data: any[];
  size: number;
  processingTime?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// ===== LOAD TESTING HOOKS =====

// Main orchestration hook for load testing
const useLoadTesting = (config: LoadTestConfig, thresholds: PerformanceThresholds) => {
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<LoadTestMetrics>({
    startTime: 0,
    duration: 0,
    requestCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    throughput: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    connectionCount: 0,
    messageCount: 0,
  });
  const [alerts, setAlerts] = useState<string[]>([]);
  const metricsRef = useRef<LoadTestMetrics>(metrics);
  const intervalRef = useRef<NodeJS.Timeout>();

  const updateMetrics = useCallback((updates: Partial<LoadTestMetrics>) => {
    const newMetrics = { ...metricsRef.current, ...updates };
    metricsRef.current = newMetrics;
    setMetrics(newMetrics);

    // Check thresholds and generate alerts
    const newAlerts: string[] = [];
    if (newMetrics.averageResponseTime > thresholds.maxResponseTime) {
      newAlerts.push(`Response time exceeded threshold: ${newMetrics.averageResponseTime}ms > ${thresholds.maxResponseTime}ms`);
    }
    if (newMetrics.errorCount / newMetrics.requestCount > thresholds.maxErrorRate) {
      newAlerts.push(`Error rate exceeded threshold: ${(newMetrics.errorCount / newMetrics.requestCount * 100).toFixed(2)}% > ${(thresholds.maxErrorRate * 100)}%`);
    }
    if (newMetrics.throughput < thresholds.minThroughput) {
      newAlerts.push(`Throughput below threshold: ${newMetrics.throughput} RPS < ${thresholds.minThroughput} RPS`);
    }
    if (newMetrics.memoryUsage > thresholds.maxMemoryUsage) {
      newAlerts.push(`Memory usage exceeded threshold: ${newMetrics.memoryUsage}MB > ${thresholds.maxMemoryUsage}MB`);
    }
    if (newMetrics.cpuUsage > thresholds.maxCPUUsage) {
      newAlerts.push(`CPU usage exceeded threshold: ${newMetrics.cpuUsage}% > ${thresholds.maxCPUUsage}%`);
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
    }
  }, [thresholds]);

  const startLoadTest = useCallback(() => {
    const startTime = Date.now();
    setIsRunning(true);
    setAlerts([]);
    updateMetrics({
      startTime,
      duration: 0,
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      throughput: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      connectionCount: 0,
      messageCount: 0,
    });

    intervalRef.current = setInterval(() => {
      const duration = Date.now() - startTime;
      updateMetrics({ duration });
    }, 1000);
  }, [updateMetrics]);

  const stopLoadTest = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const recordRequest = useCallback((responseTime: number, isError: boolean = false) => {
    const current = metricsRef.current;
    const newRequestCount = current.requestCount + 1;
    const newErrorCount = current.errorCount + (isError ? 1 : 0);
    const newAverageResponseTime = ((current.averageResponseTime * current.requestCount) + responseTime) / newRequestCount;
    const newThroughput = current.duration > 0 ? (newRequestCount / (current.duration / 1000)) : 0;

    updateMetrics({
      requestCount: newRequestCount,
      errorCount: newErrorCount,
      averageResponseTime: newAverageResponseTime,
      throughput: newThroughput,
    });
  }, [updateMetrics]);

  const recordConnection = useCallback((isOpen: boolean) => {
    const current = metricsRef.current;
    const delta = isOpen ? 1 : -1;
    updateMetrics({
      connectionCount: Math.max(0, current.connectionCount + delta),
    });
  }, [updateMetrics]);

  const recordMessage = useCallback(() => {
    const current = metricsRef.current;
    updateMetrics({
      messageCount: current.messageCount + 1,
    });
  }, [updateMetrics]);

  const updateSystemMetrics = useCallback((memoryUsage: number, cpuUsage: number) => {
    updateMetrics({ memoryUsage, cpuUsage });
  }, [updateMetrics]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isRunning,
    metrics,
    alerts,
    startLoadTest,
    stopLoadTest,
    recordRequest,
    recordConnection,
    recordMessage,
    updateSystemMetrics,
  };
};

// User simulation hook for concurrent user testing
const useUserSimulation = (journeys: UserJourney[], maxConcurrentUsers: number) => {
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [completedSessions, setCompletedSessions] = useState<UserSession[]>([]);
  const sessionRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const createUserSession = useCallback((journey: UserJourney): UserSession => {
    return {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      isActive: true,
      currentStep: 0,
      journey,
      metrics: {
        requestCount: 0,
        errorCount: 0,
        totalTime: 0,
      },
    };
  }, []);

  const executeUserStep = useCallback(async (session: UserSession, step: UserStep): Promise<boolean> => {
    const startTime = Date.now();
    
    try {
      switch (step.action) {
        case 'navigate':
          // Simulate navigation delay
          await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
          break;
        case 'click':
          // Simulate click action
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
          break;
        case 'input':
          // Simulate typing delay
          const inputLength = step.data?.value?.length || 10;
          await new Promise(resolve => setTimeout(resolve, inputLength * 50));
          break;
        case 'scroll':
          // Simulate scroll action
          await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
          break;
        case 'wait':
          // Explicit wait time
          await new Promise(resolve => setTimeout(resolve, step.data?.duration || 1000));
          break;
        case 'api':
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
          break;
        case 'websocket':
          // Simulate WebSocket message
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
          break;
      }

      const responseTime = Date.now() - startTime;
      session.metrics.requestCount++;
      session.metrics.totalTime += responseTime;

      return true;
    } catch (error) {
      session.metrics.errorCount++;
      return false;
    }
  }, []);

  const runUserSession = useCallback(async (session: UserSession, onStepComplete?: (session: UserSession, step: UserStep, success: boolean) => void) => {
    const { journey } = session;
    
    for (let i = 0; i < journey.steps.length; i++) {
      if (!session.isActive) break;

      const step = journey.steps[i];
      session.currentStep = i;
      
      const success = await executeUserStep(session, step);
      onStepComplete?.(session, step, success);

      // Think time between steps
      if (i < journey.steps.length - 1) {
        const thinkTime = journey.thinkTime[i] || 1000;
        await new Promise(resolve => setTimeout(resolve, thinkTime));
      }
    }

    session.isActive = false;
    setActiveSessions(prev => prev.filter(s => s.id !== session.id));
    setCompletedSessions(prev => [...prev, session]);
  }, [executeUserStep]);

  const startUserSimulation = useCallback((concurrentUsers: number, onStepComplete?: (session: UserSession, step: UserStep, success: boolean) => void) => {
    const usersToStart = Math.min(concurrentUsers, maxConcurrentUsers);
    
    for (let i = 0; i < usersToStart; i++) {
      // Select journey based on probability
      const random = Math.random();
      let cumulativeProbability = 0;
      let selectedJourney = journeys[0];
      
      for (const journey of journeys) {
        cumulativeProbability += journey.probability;
        if (random <= cumulativeProbability) {
          selectedJourney = journey;
          break;
        }
      }

      const session = createUserSession(selectedJourney);
      setActiveSessions(prev => [...prev, session]);

      // Start user session with some random delay for realistic behavior
      const delay = Math.random() * 2000;
      const timeoutId = setTimeout(() => {
        runUserSession(session, onStepComplete);
        sessionRefs.current.delete(session.id);
      }, delay);

      sessionRefs.current.set(session.id, timeoutId);
    }
  }, [journeys, maxConcurrentUsers, createUserSession, runUserSession]);

  const stopUserSimulation = useCallback(() => {
    // Stop all active sessions
    setActiveSessions(prev => {
      prev.forEach(session => {
        session.isActive = false;
        const timeoutId = sessionRefs.current.get(session.id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          sessionRefs.current.delete(session.id);
        }
      });
      return [];
    });
  }, []);

  const getSessionMetrics = useCallback(() => {
    const all = [...activeSessions, ...completedSessions];
    return {
      total: all.length,
      active: activeSessions.length,
      completed: completedSessions.length,
      totalRequests: all.reduce((sum, s) => sum + s.metrics.requestCount, 0),
      totalErrors: all.reduce((sum, s) => sum + s.metrics.errorCount, 0),
      averageSessionTime: completedSessions.length > 0 
        ? completedSessions.reduce((sum, s) => sum + s.metrics.totalTime, 0) / completedSessions.length 
        : 0,
    };
  }, [activeSessions, completedSessions]);

  useEffect(() => {
    return () => {
      sessionRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      sessionRefs.current.clear();
    };
  }, []);

  return {
    activeSessions,
    completedSessions,
    startUserSimulation,
    stopUserSimulation,
    getSessionMetrics,
  };
};

// Data volume simulation hook
const useDataVolumeSimulation = (batchSize: number, processingDelay: number) => {
  const [batches, setBatches] = useState<DataBatch[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [metrics, setMetrics] = useState({
    totalProcessed: 0,
    totalFailed: 0,
    averageProcessingTime: 0,
    throughput: 0,
    queueLength: 0,
  });

  const generateDataBatch = useCallback((size: number): DataBatch => {
    const data = Array.from({ length: size }, (_, i) => ({
      id: `item-${Date.now()}-${i}`,
      value: Math.random() * 1000,
      timestamp: Date.now(),
      metadata: {
        type: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        priority: Math.floor(Math.random() * 5) + 1,
      },
    }));

    return {
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data,
      size,
      status: 'pending',
    };
  }, []);

  const processBatch = useCallback(async (batch: DataBatch): Promise<boolean> => {
    const startTime = Date.now();
    batch.status = 'processing';

    try {
      // Simulate data processing with variable delay based on batch size
      const baseDelay = processingDelay;
      const sizeMultiplier = batch.size / batchSize;
      const delay = baseDelay * sizeMultiplier;
      
      await new Promise(resolve => setTimeout(resolve, delay));

      // Simulate occasional processing failures (5% failure rate)
      if (Math.random() < 0.05) {
        throw new Error('Processing failed');
      }

      batch.processingTime = Date.now() - startTime;
      batch.status = 'completed';
      return true;
    } catch (error) {
      batch.status = 'failed';
      return false;
    }
  }, [batchSize, processingDelay]);

  const startDataVolumeTest = useCallback(async (totalVolume: number) => {
    setIsProcessing(true);
    const numBatches = Math.ceil(totalVolume / batchSize);
    const newBatches: DataBatch[] = [];

    // Generate all batches
    for (let i = 0; i < numBatches; i++) {
      const currentBatchSize = i === numBatches - 1 ? totalVolume % batchSize || batchSize : batchSize;
      newBatches.push(generateDataBatch(currentBatchSize));
    }

    setBatches(newBatches);

    // Process batches with concurrency control
    const maxConcurrentBatches = 3;
    const startTime = Date.now();
    let processed = 0;
    let failed = 0;
    let totalProcessingTime = 0;

    const processBatches = async (batchesToProcess: DataBatch[]) => {
      const promises = batchesToProcess.slice(0, maxConcurrentBatches).map(async (batch) => {
        const success = await processBatch(batch);
        if (success) {
          processed++;
          totalProcessingTime += batch.processingTime || 0;
        } else {
          failed++;
        }

        const duration = Date.now() - startTime;
        setMetrics({
          totalProcessed: processed,
          totalFailed: failed,
          averageProcessingTime: processed > 0 ? totalProcessingTime / processed : 0,
          throughput: duration > 0 ? (processed / (duration / 1000)) : 0,
          queueLength: batchesToProcess.length - processed - failed,
        });

        return batch;
      });

      const completedBatches = await Promise.all(promises);
      const remainingBatches = batchesToProcess.slice(maxConcurrentBatches);

      if (remainingBatches.length > 0) {
        await processBatches(remainingBatches);
      }
    };

    await processBatches(newBatches);
    setIsProcessing(false);
  }, [batchSize, generateDataBatch, processBatch]);

  const resetDataVolumeTest = useCallback(() => {
    setBatches([]);
    setIsProcessing(false);
    setMetrics({
      totalProcessed: 0,
      totalFailed: 0,
      averageProcessingTime: 0,
      throughput: 0,
      queueLength: 0,
    });
  }, []);

  return {
    batches,
    isProcessing,
    metrics,
    startDataVolumeTest,
    resetDataVolumeTest,
  };
};

// WebSocket load simulation hook
const useWebSocketLoadSimulation = (maxConnections: number, messageRate: number) => {
  const [connections, setConnections] = useState<Map<string, WebSocket>>(new Map());
  const [metrics, setMetrics] = useState({
    activeConnections: 0,
    totalMessages: 0,
    messagesSent: 0,
    messagesReceived: 0,
    averageLatency: 0,
    connectionErrors: 0,
    reconnectionAttempts: 0,
  });
  const [isRunning, setIsRunning] = useState(false);
  const metricsRef = useRef(metrics);
  const messageIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const latencyMeasurements = useRef<number[]>([]);

  const createWebSocketConnection = useCallback((id: string, url: string = 'ws://localhost:8080'): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      try {
        // Simulate WebSocket with setTimeout for testing
        const mockWebSocket = {
          id,
          readyState: 1, // OPEN
          onopen: null as ((event: Event) => void) | null,
          onmessage: null as ((event: MessageEvent) => void) | null,
          onclose: null as ((event: CloseEvent) => void) | null,
          onerror: null as ((event: Event) => void) | null,
          send: (data: string) => {
            const sendTime = Date.now();
            // Simulate network latency
            setTimeout(() => {
              const latency = Date.now() - sendTime + Math.random() * 50;
              latencyMeasurements.current.push(latency);
              
              if (mockWebSocket.onmessage) {
                mockWebSocket.onmessage({
                  data: JSON.stringify({ echo: data, timestamp: Date.now() }),
                  type: 'message',
                } as MessageEvent);
              }
              
              const current = metricsRef.current;
              const newMessagesSent = current.messagesSent + 1;
              const newMessagesReceived = current.messagesReceived + 1;
              const newAverageLatency = latencyMeasurements.current.reduce((a, b) => a + b, 0) / latencyMeasurements.current.length;
              
              metricsRef.current = {
                ...current,
                messagesSent: newMessagesSent,
                messagesReceived: newMessagesReceived,
                totalMessages: newMessagesSent + newMessagesReceived,
                averageLatency: newAverageLatency,
              };
              setMetrics(metricsRef.current);
            }, Math.random() * 20 + 5);
          },
          close: () => {
            mockWebSocket.readyState = 3; // CLOSED
            if (mockWebSocket.onclose) {
              mockWebSocket.onclose({} as CloseEvent);
            }
          },
        } as unknown as WebSocket;

        // Simulate connection establishment
        setTimeout(() => {
          if (mockWebSocket.onopen) {
            mockWebSocket.onopen({} as Event);
          }
          resolve(mockWebSocket);
        }, Math.random() * 100 + 50);

      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const startMessageStream = useCallback((connectionId: string, ws: WebSocket) => {
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN && isRunning) {
        const message: WebSocketMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'test',
          payload: {
            timestamp: Date.now(),
            data: Array.from({ length: 10 }, () => Math.random()),
          },
          timestamp: Date.now(),
          size: 1024, // Simulate 1KB messages
        };

        ws.send(JSON.stringify(message));
      }
    }, 1000 / messageRate);

    messageIntervals.current.set(connectionId, interval);
  }, [messageRate, isRunning]);

  const createConnection = useCallback(async (connectionId: string) => {
    try {
      const ws = await createWebSocketConnection(connectionId);
      
      ws.onopen = () => {
        setConnections(prev => new Map(prev.set(connectionId, ws)));
        const current = metricsRef.current;
        metricsRef.current = {
          ...current,
          activeConnections: current.activeConnections + 1,
        };
        setMetrics(metricsRef.current);

        startMessageStream(connectionId, ws);
      };

      ws.onclose = () => {
        setConnections(prev => {
          const newMap = new Map(prev);
          newMap.delete(connectionId);
          return newMap;
        });

        const current = metricsRef.current;
        metricsRef.current = {
          ...current,
          activeConnections: Math.max(0, current.activeConnections - 1),
        };
        setMetrics(metricsRef.current);

        const interval = messageIntervals.current.get(connectionId);
        if (interval) {
          clearInterval(interval);
          messageIntervals.current.delete(connectionId);
        }
      };

      ws.onerror = () => {
        const current = metricsRef.current;
        metricsRef.current = {
          ...current,
          connectionErrors: current.connectionErrors + 1,
        };
        setMetrics(metricsRef.current);
      };

    } catch (error) {
      const current = metricsRef.current;
      metricsRef.current = {
        ...current,
        connectionErrors: current.connectionErrors + 1,
      };
      setMetrics(metricsRef.current);
    }
  }, [createWebSocketConnection, startMessageStream]);

  const startWebSocketLoadTest = useCallback(async (connectionCount: number) => {
    setIsRunning(true);
    latencyMeasurements.current = [];
    
    const connectionsToCreate = Math.min(connectionCount, maxConnections);
    
    // Create connections with staggered timing
    for (let i = 0; i < connectionsToCreate; i++) {
      const connectionId = `conn-${i}`;
      setTimeout(() => createConnection(connectionId), i * 100);
    }
  }, [maxConnections, createConnection]);

  const stopWebSocketLoadTest = useCallback(() => {
    setIsRunning(false);
    
    // Close all connections
    connections.forEach((ws, id) => {
      ws.close();
      const interval = messageIntervals.current.get(id);
      if (interval) {
        clearInterval(interval);
        messageIntervals.current.delete(id);
      }
    });
    
    setConnections(new Map());
  }, [connections]);

  const resetWebSocketMetrics = useCallback(() => {
    setMetrics({
      activeConnections: 0,
      totalMessages: 0,
      messagesSent: 0,
      messagesReceived: 0,
      averageLatency: 0,
      connectionErrors: 0,
      reconnectionAttempts: 0,
    });
    metricsRef.current = {
      activeConnections: 0,
      totalMessages: 0,
      messagesSent: 0,
      messagesReceived: 0,
      averageLatency: 0,
      connectionErrors: 0,
      reconnectionAttempts: 0,
    };
    latencyMeasurements.current = [];
  }, []);

  useEffect(() => {
    return () => {
      stopWebSocketLoadTest();
    };
  }, [stopWebSocketLoadTest]);

  return {
    connections: Array.from(connections.entries()),
    metrics,
    isRunning,
    startWebSocketLoadTest,
    stopWebSocketLoadTest,
    resetWebSocketMetrics,
  };
};

// ===== MAIN COMPONENTS =====

// Real-Time Updates Component
const RealTimeUpdates: React.FC<{
  updateRate: number;
  onMetricsUpdate: (metrics: { memoryUsage: number; updateCount: number; droppedUpdates: number }) => void;
}> = ({ updateRate, onMetricsUpdate }) => {
  const [updates, setUpdates] = useState<Array<{ id: string; data: any; timestamp: number }>>([]);
  const [isActive, setIsActive] = useState(false);
  const [metrics, setMetrics] = useState({
    updateCount: 0,
    droppedUpdates: 0,
    memoryUsage: 0,
    averageProcessingTime: 0,
  });
  const updateIntervalRef = useRef<NodeJS.Timeout>();
  const metricsIntervalRef = useRef<NodeJS.Timeout>();
  const processingTimes = useRef<number[]>([]);

  const generateUpdate = useCallback(() => {
    const startTime = performance.now();
    
    const update = {
      id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data: {
        value: Math.random() * 100,
        timestamp: Date.now(),
        type: ['price', 'volume', 'status'][Math.floor(Math.random() * 3)],
        metadata: Array.from({ length: 50 }, () => Math.random()),
      },
      timestamp: Date.now(),
    };

    setUpdates(prev => {
      // Keep only last 1000 updates to prevent memory overflow
      const newUpdates = [...prev, update];
      if (newUpdates.length > 1000) {
        setMetrics(current => ({ ...current, droppedUpdates: current.droppedUpdates + 1 }));
        return newUpdates.slice(-1000);
      }
      return newUpdates;
    });

    const processingTime = performance.now() - startTime;
    processingTimes.current.push(processingTime);
    if (processingTimes.current.length > 100) {
      processingTimes.current = processingTimes.current.slice(-100);
    }

    setMetrics(current => {
      const newMetrics = {
        ...current,
        updateCount: current.updateCount + 1,
        averageProcessingTime: processingTimes.current.reduce((a, b) => a + b, 0) / processingTimes.current.length,
      };
      return newMetrics;
    });
  }, []);

  const startUpdates = useCallback(() => {
    setIsActive(true);
    setMetrics({ updateCount: 0, droppedUpdates: 0, memoryUsage: 0, averageProcessingTime: 0 });
    processingTimes.current = [];

    const interval = 1000 / updateRate;
    updateIntervalRef.current = setInterval(generateUpdate, interval);

    // Memory monitoring
    metricsIntervalRef.current = setInterval(() => {
      const memoryUsage = (performance as any).memory?.usedJSHeapSize / (1024 * 1024) || 0;
      setMetrics(current => {
        const newMetrics = { ...current, memoryUsage };
        onMetricsUpdate(newMetrics);
        return newMetrics;
      });
    }, 1000);
  }, [updateRate, generateUpdate, onMetricsUpdate]);

  const stopUpdates = useCallback(() => {
    setIsActive(false);
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopUpdates();
    };
  }, [stopUpdates]);

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Real-Time Updates Load Testing</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-blue-50 rounded">
          <div className="text-sm text-blue-600">Update Rate</div>
          <div className="text-lg font-bold">{updateRate} Hz</div>
        </div>
        <div className="p-3 bg-green-50 rounded">
          <div className="text-sm text-green-600">Updates Processed</div>
          <div className="text-lg font-bold">{metrics.updateCount}</div>
        </div>
        <div className="p-3 bg-yellow-50 rounded">
          <div className="text-sm text-yellow-600">Dropped Updates</div>
          <div className="text-lg font-bold">{metrics.droppedUpdates}</div>
        </div>
        <div className="p-3 bg-purple-50 rounded">
          <div className="text-sm text-purple-600">Memory Usage</div>
          <div className="text-lg font-bold">{metrics.memoryUsage.toFixed(1)} MB</div>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={startUpdates}
          disabled={isActive}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          Start Updates
        </button>
        <button
          onClick={stopUpdates}
          disabled={!isActive}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400"
        >
          Stop Updates
        </button>
      </div>

      <div className="max-h-40 overflow-y-auto border rounded p-3 bg-gray-50">
        <div className="text-sm font-medium mb-2">Recent Updates (showing last 10):</div>
        {updates.slice(-10).map(update => (
          <div key={update.id} className="text-xs text-gray-600 mb-1">
            {new Date(update.timestamp).toLocaleTimeString()} - {update.data.type}: {update.data.value.toFixed(2)}
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <div>Average Processing Time: {metrics.averageProcessingTime.toFixed(2)}ms</div>
        <div>Status: {isActive ? 'Active' : 'Stopped'}</div>
      </div>
    </div>
  );
};

// Concurrent Users Component
const ConcurrentUsers: React.FC<{
  maxUsers: number;
  journeys: UserJourney[];
  onMetricsUpdate: (metrics: any) => void;
}> = ({ maxUsers, journeys, onMetricsUpdate }) => {
  const [currentUsers, setCurrentUsers] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const {
    activeSessions,
    completedSessions,
    startUserSimulation,
    stopUserSimulation,
    getSessionMetrics,
  } = useUserSimulation(journeys, maxUsers);

  const sessionMetrics = useMemo(() => getSessionMetrics(), [getSessionMetrics]);

  useEffect(() => {
    onMetricsUpdate(sessionMetrics);
  }, [sessionMetrics, onMetricsUpdate]);

  const handleStartSimulation = useCallback(() => {
    setIsRunning(true);
    startUserSimulation(currentUsers, (session, step, success) => {
      // Optional: Handle step completion for detailed monitoring
    });
  }, [currentUsers, startUserSimulation]);

  const handleStopSimulation = useCallback(() => {
    setIsRunning(false);
    stopUserSimulation();
  }, [stopUserSimulation]);

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Concurrent Users Load Testing</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-blue-50 rounded">
          <div className="text-sm text-blue-600">Active Sessions</div>
          <div className="text-lg font-bold">{sessionMetrics.active}</div>
        </div>
        <div className="p-3 bg-green-50 rounded">
          <div className="text-sm text-green-600">Completed Sessions</div>
          <div className="text-lg font-bold">{sessionMetrics.completed}</div>
        </div>
        <div className="p-3 bg-yellow-50 rounded">
          <div className="text-sm text-yellow-600">Total Requests</div>
          <div className="text-lg font-bold">{sessionMetrics.totalRequests}</div>
        </div>
        <div className="p-3 bg-red-50 rounded">
          <div className="text-sm text-red-600">Total Errors</div>
          <div className="text-lg font-bold">{sessionMetrics.totalErrors}</div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Concurrent Users: {currentUsers}
        </label>
        <input
          type="range"
          min="1"
          max={maxUsers}
          value={currentUsers}
          onChange={(e) => setCurrentUsers(parseInt(e.target.value))}
          disabled={isRunning}
          className="w-full"
        />
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={handleStartSimulation}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          Start Simulation
        </button>
        <button
          onClick={handleStopSimulation}
          disabled={!isRunning}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400"
        >
          Stop Simulation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-3 bg-gray-50">
          <div className="text-sm font-medium mb-2">Active Sessions:</div>
          <div className="max-h-32 overflow-y-auto text-xs">
            {activeSessions.map(session => (
              <div key={session.id} className="mb-1">
                {session.journey.name} - Step {session.currentStep + 1}/{session.journey.steps.length}
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded p-3 bg-gray-50">
          <div className="text-sm font-medium mb-2">Journey Distribution:</div>
          <div className="text-xs">
            {journeys.map(journey => {
              const count = [...activeSessions, ...completedSessions].filter(s => s.journey.name === journey.name).length;
              return (
                <div key={journey.name} className="mb-1">
                  {journey.name}: {count} sessions ({(journey.probability * 100).toFixed(0)}% probability)
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <div>Average Session Time: {sessionMetrics.averageSessionTime.toFixed(0)}ms</div>
        <div>Error Rate: {sessionMetrics.totalRequests > 0 ? ((sessionMetrics.totalErrors / sessionMetrics.totalRequests) * 100).toFixed(2) : 0}%</div>
        <div>Status: {isRunning ? 'Running' : 'Stopped'}</div>
      </div>
    </div>
  );
};

// High Volume Data Component
const HighVolumeData: React.FC<{
  batchSize: number;
  onMetricsUpdate: (metrics: any) => void;
}> = ({ batchSize, onMetricsUpdate }) => {
  const [totalVolume, setTotalVolume] = useState(10000);
  const processingDelay = 100; // Base processing delay in ms

  const {
    batches,
    isProcessing,
    metrics,
    startDataVolumeTest,
    resetDataVolumeTest,
  } = useDataVolumeSimulation(batchSize, processingDelay);

  useEffect(() => {
    onMetricsUpdate(metrics);
  }, [metrics, onMetricsUpdate]);

  const handleStartTest = useCallback(() => {
    startDataVolumeTest(totalVolume);
  }, [startDataVolumeTest, totalVolume]);

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">High Volume Data Processing Load Testing</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-blue-50 rounded">
          <div className="text-sm text-blue-600">Processed</div>
          <div className="text-lg font-bold">{metrics.totalProcessed}</div>
        </div>
        <div className="p-3 bg-green-50 rounded">
          <div className="text-sm text-green-600">Throughput</div>
          <div className="text-lg font-bold">{metrics.throughput.toFixed(1)} B/s</div>
        </div>
        <div className="p-3 bg-yellow-50 rounded">
          <div className="text-sm text-yellow-600">Queue Length</div>
          <div className="text-lg font-bold">{metrics.queueLength}</div>
        </div>
        <div className="p-3 bg-red-50 rounded">
          <div className="text-sm text-red-600">Failed</div>
          <div className="text-lg font-bold">{metrics.totalFailed}</div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Total Data Volume: {totalVolume.toLocaleString()} items
        </label>
        <input
          type="range"
          min="1000"
          max="100000"
          step="1000"
          value={totalVolume}
          onChange={(e) => setTotalVolume(parseInt(e.target.value))}
          disabled={isProcessing}
          className="w-full"
        />
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={handleStartTest}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          Start Processing
        </button>
        <button
          onClick={resetDataVolumeTest}
          disabled={isProcessing}
          className="px-4 py-2 bg-gray-600 text-white rounded disabled:bg-gray-400"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-3 bg-gray-50">
          <div className="text-sm font-medium mb-2">Processing Statistics:</div>
          <div className="text-xs space-y-1">
            <div>Batch Size: {batchSize} items</div>
            <div>Total Batches: {batches.length}</div>
            <div>Average Processing Time: {metrics.averageProcessingTime.toFixed(0)}ms</div>
            <div>Success Rate: {batches.length > 0 ? (((batches.length - metrics.totalFailed) / batches.length) * 100).toFixed(1) : 0}%</div>
          </div>
        </div>

        <div className="border rounded p-3 bg-gray-50">
          <div className="text-sm font-medium mb-2">Batch Status:</div>
          <div className="max-h-32 overflow-y-auto text-xs">
            {batches.slice(-10).map(batch => (
              <div key={batch.id} className="mb-1 flex justify-between">
                <span>{batch.id.split('-')[1]}</span>
                <span className={`px-1 rounded text-white text-xs ${
                  batch.status === 'completed' ? 'bg-green-500' :
                  batch.status === 'failed' ? 'bg-red-500' :
                  batch.status === 'processing' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}>
                  {batch.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <div>Status: {isProcessing ? 'Processing...' : 'Idle'}</div>
        <div>Memory Efficiency: {totalVolume > 0 ? ((metrics.totalProcessed / totalVolume) * 100).toFixed(1) : 0}% complete</div>
      </div>
    </div>
  );
};

// WebSocket Load Component
const WebSocketLoad: React.FC<{
  maxConnections: number;
  messageRate: number;
  onMetricsUpdate: (metrics: any) => void;
}> = ({ maxConnections, messageRate, onMetricsUpdate }) => {
  const [connectionCount, setConnectionCount] = useState(10);

  const {
    connections,
    metrics,
    isRunning,
    startWebSocketLoadTest,
    stopWebSocketLoadTest,
    resetWebSocketMetrics,
  } = useWebSocketLoadSimulation(maxConnections, messageRate);

  useEffect(() => {
    onMetricsUpdate(metrics);
  }, [metrics, onMetricsUpdate]);

  const handleStartTest = useCallback(() => {
    startWebSocketLoadTest(connectionCount);
  }, [startWebSocketLoadTest, connectionCount]);

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">WebSocket Load Testing</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-blue-50 rounded">
          <div className="text-sm text-blue-600">Active Connections</div>
          <div className="text-lg font-bold">{metrics.activeConnections}</div>
        </div>
        <div className="p-3 bg-green-50 rounded">
          <div className="text-sm text-green-600">Messages Sent</div>
          <div className="text-lg font-bold">{metrics.messagesSent}</div>
        </div>
        <div className="p-3 bg-yellow-50 rounded">
          <div className="text-sm text-yellow-600">Average Latency</div>
          <div className="text-lg font-bold">{metrics.averageLatency.toFixed(1)}ms</div>
        </div>
        <div className="p-3 bg-red-50 rounded">
          <div className="text-sm text-red-600">Connection Errors</div>
          <div className="text-lg font-bold">{metrics.connectionErrors}</div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Target Connections: {connectionCount}
        </label>
        <input
          type="range"
          min="1"
          max={maxConnections}
          value={connectionCount}
          onChange={(e) => setConnectionCount(parseInt(e.target.value))}
          disabled={isRunning}
          className="w-full"
        />
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={handleStartTest}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          Start Test
        </button>
        <button
          onClick={stopWebSocketLoadTest}
          disabled={!isRunning}
          className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400"
        >
          Stop Test
        </button>
        <button
          onClick={resetWebSocketMetrics}
          disabled={isRunning}
          className="px-4 py-2 bg-gray-600 text-white rounded disabled:bg-gray-400"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-3 bg-gray-50">
          <div className="text-sm font-medium mb-2">Connection Statistics:</div>
          <div className="text-xs space-y-1">
            <div>Message Rate: {messageRate} msg/s per connection</div>
            <div>Total Messages: {metrics.totalMessages}</div>
            <div>Messages Received: {metrics.messagesReceived}</div>
            <div>Reconnection Attempts: {metrics.reconnectionAttempts}</div>
          </div>
        </div>

        <div className="border rounded p-3 bg-gray-50">
          <div className="text-sm font-medium mb-2">Active Connections:</div>
          <div className="max-h-32 overflow-y-auto text-xs">
            {connections.slice(0, 10).map(([id, ws]) => (
              <div key={id} className="mb-1 flex justify-between">
                <span>{id}</span>
                <span className={`px-1 rounded text-white text-xs ${
                  ws.readyState === WebSocket.OPEN ? 'bg-green-500' :
                  ws.readyState === WebSocket.CONNECTING ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {ws.readyState === WebSocket.OPEN ? 'OPEN' :
                   ws.readyState === WebSocket.CONNECTING ? 'CONNECTING' : 'CLOSED'}
                </span>
              </div>
            ))}
            {connections.length > 10 && (
              <div className="text-gray-500">... and {connections.length - 10} more</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <div>Status: {isRunning ? 'Running' : 'Stopped'}</div>
        <div>Success Rate: {metrics.messagesSent > 0 ? (((metrics.messagesSent - metrics.connectionErrors) / metrics.messagesSent) * 100).toFixed(1) : 0}%</div>
      </div>
    </div>
  );
};

// ===== LOAD TESTING UTILITIES =====

// Artillery.js Configuration Generator
export const generateArtilleryConfig = (config: LoadTestConfig) => {
  return {
    config: {
      target: 'http://localhost:3000',
      phases: [
        { duration: config.rampUpDuration, arrivalRate: Math.floor(config.targetRPS / 4), name: 'Warm up' },
        { duration: config.rampUpDuration, arrivalRate: Math.floor(config.targetRPS / 2), name: 'Ramp up' },
        { duration: config.sustainedDuration, arrivalRate: config.targetRPS, name: 'Sustained load' },
        { duration: config.rampDownDuration, arrivalRate: Math.floor(config.targetRPS / 4), name: 'Ramp down' },
      ],
      processor: './load-test-processor.js'
    },
    scenarios: [
      {
        name: 'User journey simulation',
        weight: 70,
        flow: [
          { get: { url: '/' } },
          { think: 2 },
          { get: { url: '/api/data' } },
          { think: 1 },
          { post: { url: '/api/interactions', json: { action: 'click', timestamp: '{{ $timestamp }}' } } },
          { think: 3 },
          { get: { url: '/api/realtime-data' } },
        ]
      },
      {
        name: 'WebSocket simulation',
        weight: 20,
        engine: 'ws',
        flow: [
          { connect: { target: 'ws://localhost:8080' } },
          { send: { message: '{"type": "subscribe", "channel": "updates"}' } },
          { think: 5 },
          { send: { message: '{"type": "message", "data": "test"}' } },
          { think: 10 },
        ]
      },
      {
        name: 'High volume data',
        weight: 10,
        flow: [
          { post: { 
            url: '/api/bulk-data', 
            json: {
              data: '{{ generateBulkData(1000) }}',
              batchSize: 100
            }
          }},
          { think: 5 },
        ]
      }
    ]
  };
};

// k6 Script Generator
export const generateK6Script = (config: LoadTestConfig, thresholds: PerformanceThresholds) => {
  return `
import http from 'k6/http';
import ws from 'k6/ws';
import { check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const customLatency = new Trend('custom_latency');

export let options = {
  stages: [
    { duration: '${config.rampUpDuration}s', target: ${Math.floor(config.maxConcurrentUsers / 4)} },
    { duration: '${config.rampUpDuration}s', target: ${Math.floor(config.maxConcurrentUsers / 2)} },
    { duration: '${config.sustainedDuration}s', target: ${config.maxConcurrentUsers} },
    { duration: '${config.rampDownDuration}s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(99)<${thresholds.maxResponseTime}'],
    'error_rate': ['rate<${thresholds.maxErrorRate}'],
    'custom_latency': ['p(95)<${thresholds.maxConnectionLatency}'],
    'ws_session_duration': ['p(95)<5000'],
  },
};

export default function() {
  group('User Journey', () => {
    let response = http.get('http://localhost:3000/');
    check(response, { 'status is 200': (r) => r.status === 200 });
    errorRate.add(response.status !== 200);
    
    response = http.get('http://localhost:3000/api/data');
    check(response, { 'data response time < 500ms': (r) => r.timings.duration < 500 });
    customLatency.add(response.timings.duration);
    
    response = http.post('http://localhost:3000/api/interactions', 
      JSON.stringify({ action: 'click', timestamp: Date.now() }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(response, { 'post successful': (r) => r.status === 200 || r.status === 201 });
  });

  group('WebSocket Load', () => {
    const url = 'ws://localhost:8080';
    const params = { tags: { my_tag: 'websocket' } };
    
    const response = ws.connect(url, params, function(socket) {
      socket.on('open', () => {
        socket.send(JSON.stringify({ type: 'subscribe', channel: 'updates' }));
      });
      
      socket.on('message', (data) => {
        const message = JSON.parse(data);
        check(message, { 'message received': (m) => m !== null });
      });
      
      socket.setTimeout(() => {
        socket.send(JSON.stringify({ type: 'ping' }));
      }, 1000);
      
      socket.setTimeout(() => socket.close(), 10000);
    });
  });

  group('High Volume Data', () => {
    const bulkData = Array.from({ length: ${config.dataVolumeSize} }, (_, i) => ({
      id: i,
      value: Math.random() * 100,
      timestamp: Date.now()
    }));
    
    const response = http.post('http://localhost:3000/api/bulk-data',
      JSON.stringify({ data: bulkData, batchSize: 100 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    check(response, { 
      'bulk data processed': (r) => r.status === 200,
      'processing time acceptable': (r) => r.timings.duration < 5000
    });
  });
}
`;
};

// Playwright Load Test Generator
export const generatePlaywrightLoadTest = (config: LoadTestConfig) => {
  return `
const { test, expect } = require('@playwright/test');

test.describe('Load Testing Suite', () => {
  test('Concurrent user simulation', async ({ context }) => {
    const userPromises = [];
    
    for (let i = 0; i < ${config.maxConcurrentUsers}; i++) {
      userPromises.push(simulateUser(context, i));
    }
    
    const results = await Promise.allSettled(userPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(\`Simulation completed: \${successful} successful, \${failed} failed\`);
    expect(failed / ${config.maxConcurrentUsers}).toBeLessThan(${(1 - (1 - 0.05))}); // 5% failure tolerance
  });

  async function simulateUser(context, userId) {
    const page = await context.newPage();
    const startTime = Date.now();
    
    try {
      // Navigation
      await page.goto('http://localhost:3000');
      await expect(page).toHaveTitle(/.*/, { timeout: 5000 });
      
      // User interactions
      await page.click('[data-testid="nav-menu"]');
      await page.waitForTimeout(Math.random() * 1000 + 500); // Think time
      
      await page.fill('[data-testid="search-input"]', \`test query \${userId}\`);
      await page.press('[data-testid="search-input"]', 'Enter');
      
      await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 });
      
      // API interactions
      const response = await page.request.post('/api/interactions', {
        data: {
          userId,
          action: 'search',
          timestamp: Date.now()
        }
      });
      expect(response.status()).toBe(200);
      
      // WebSocket simulation
      await page.evaluate(() => {
        return new Promise((resolve) => {
          const ws = new WebSocket('ws://localhost:8080');
          ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'join', userId: \`\${userId}\` }));
            setTimeout(() => {
              ws.close();
              resolve();
            }, 5000);
          };
        });
      });
      
      const endTime = Date.now();
      console.log(\`User \${userId} completed journey in \${endTime - startTime}ms\`);
      
    } finally {
      await page.close();
    }
  }

  test('Real-time updates stress test', async ({ page }) => {
    await page.goto('http://localhost:3000/realtime');
    
    // Monitor for memory leaks and performance
    await page.evaluate(() => {
      window.performanceStart = performance.now();
      window.initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    // Simulate high-frequency updates
    for (let i = 0; i < 1000; i++) {
      await page.evaluate((updateId) => {
        window.dispatchEvent(new CustomEvent('realtime-update', {
          detail: {
            id: updateId,
            data: { value: Math.random() * 100 },
            timestamp: Date.now()
          }
        }));
      }, i);
      
      if (i % 100 === 0) {
        await page.waitForTimeout(10); // Brief pause to prevent overwhelming
      }
    }
    
    // Check performance impact
    const metrics = await page.evaluate(() => {
      const endTime = performance.now();
      const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      return {
        duration: endTime - window.performanceStart,
        memoryIncrease: endMemory - window.initialMemory
      };
    });
    
    expect(metrics.duration).toBeLessThan(30000); // Should complete within 30 seconds
    expect(metrics.memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
  });
});
`;
};

// Custom Load Generator
export class CustomLoadGenerator {
  private config: LoadTestConfig;
  private thresholds: PerformanceThresholds;
  private isRunning = false;
  private metrics: LoadTestMetrics = {
    startTime: 0,
    duration: 0,
    requestCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    throughput: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    connectionCount: 0,
    messageCount: 0,
  };

  constructor(config: LoadTestConfig, thresholds: PerformanceThresholds) {
    this.config = config;
    this.thresholds = thresholds;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.metrics.startTime = Date.now();
    
    console.log('Starting custom load test...');
    
    // Run different load test phases
    await this.runRampUp();
    await this.runSustainedLoad();
    await this.runRampDown();
    
    this.isRunning = false;
    console.log('Load test completed');
    this.generateReport();
  }

  private async runRampUp(): Promise<void> {
    console.log('Ramp-up phase starting...');
    const duration = this.config.rampUpDuration * 1000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration && this.isRunning) {
      const progress = (Date.now() - startTime) / duration;
      const currentRPS = Math.floor(this.config.targetRPS * progress);
      
      await this.generateLoad(currentRPS, 1000);
    }
  }

  private async runSustainedLoad(): Promise<void> {
    console.log('Sustained load phase starting...');
    const duration = this.config.sustainedDuration * 1000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration && this.isRunning) {
      await this.generateLoad(this.config.targetRPS, 1000);
    }
  }

  private async runRampDown(): Promise<void> {
    console.log('Ramp-down phase starting...');
    const duration = this.config.rampDownDuration * 1000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration && this.isRunning) {
      const progress = 1 - ((Date.now() - startTime) / duration);
      const currentRPS = Math.floor(this.config.targetRPS * progress);
      
      await this.generateLoad(currentRPS, 1000);
    }
  }

  private async generateLoad(rps: number, duration: number): Promise<void> {
    const interval = 1000 / rps;
    const endTime = Date.now() + duration;
    
    while (Date.now() < endTime && this.isRunning) {
      const startTime = Date.now();
      
      // Simulate request
      try {
        await this.simulateRequest();
        const responseTime = Date.now() - startTime;
        this.recordSuccess(responseTime);
      } catch (error) {
        this.recordError();
      }
      
      // Wait for next request
      const elapsed = Date.now() - startTime;
      const waitTime = Math.max(0, interval - elapsed);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  private async simulateRequest(): Promise<void> {
    // Simulate various types of requests
    const requestType = Math.random();
    
    if (requestType < 0.6) {
      // Regular HTTP request
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
    } else if (requestType < 0.8) {
      // API request
      await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
    } else {
      // Heavy operation
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    }
    
    // Simulate occasional failures
    if (Math.random() < 0.05) {
      throw new Error('Simulated request failure');
    }
  }

  private recordSuccess(responseTime: number): void {
    this.metrics.requestCount++;
    this.metrics.averageResponseTime = 
      ((this.metrics.averageResponseTime * (this.metrics.requestCount - 1)) + responseTime) / this.metrics.requestCount;
    
    const duration = Date.now() - this.metrics.startTime;
    this.metrics.duration = duration;
    this.metrics.throughput = this.metrics.requestCount / (duration / 1000);
  }

  private recordError(): void {
    this.metrics.errorCount++;
  }

  private generateReport(): void {
    const errorRate = this.metrics.requestCount > 0 ? 
      (this.metrics.errorCount / this.metrics.requestCount) * 100 : 0;
    
    console.log('\n=== Load Test Report ===');
    console.log(`Duration: ${(this.metrics.duration / 1000).toFixed(1)}s`);
    console.log(`Total Requests: ${this.metrics.requestCount}`);
    console.log(`Total Errors: ${this.metrics.errorCount}`);
    console.log(`Error Rate: ${errorRate.toFixed(2)}%`);
    console.log(`Average Response Time: ${this.metrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`Throughput: ${this.metrics.throughput.toFixed(2)} RPS`);
    
    // Check against thresholds
    console.log('\n=== Threshold Analysis ===');
    console.log(`Response Time: ${this.metrics.averageResponseTime.toFixed(2)}ms (threshold: ${this.thresholds.maxResponseTime}ms) - ${this.metrics.averageResponseTime <= this.thresholds.maxResponseTime ? 'PASS' : 'FAIL'}`);
    console.log(`Error Rate: ${errorRate.toFixed(2)}% (threshold: ${(this.thresholds.maxErrorRate * 100)}%) - ${errorRate <= (this.thresholds.maxErrorRate * 100) ? 'PASS' : 'FAIL'}`);
    console.log(`Throughput: ${this.metrics.throughput.toFixed(2)} RPS (threshold: ${this.thresholds.minThroughput} RPS) - ${this.metrics.throughput >= this.thresholds.minThroughput ? 'PASS' : 'FAIL'}`);
  }

  stop(): void {
    this.isRunning = false;
  }

  getMetrics(): LoadTestMetrics {
    return { ...this.metrics };
  }
}

// ===== MAIN LOAD TESTING DASHBOARD =====

const LoadTestingSimulation: React.FC = () => {
  const [config, setConfig] = useState<LoadTestConfig>({
    maxConcurrentUsers: 50,
    rampUpDuration: 60,
    sustainedDuration: 300,
    rampDownDuration: 60,
    targetRPS: 100,
    dataVolumeSize: 10000,
    webSocketConnections: 20,
    messageRate: 10,
  });

  const [thresholds, setThresholds] = useState<PerformanceThresholds>({
    maxResponseTime: 1000,
    maxErrorRate: 0.05,
    minThroughput: 50,
    maxMemoryUsage: 500,
    maxCPUUsage: 80,
    maxConnectionLatency: 200,
  });

  const [journeys] = useState<UserJourney[]>([
    {
      id: 'journey-1',
      name: 'Standard User Flow',
      steps: [
        { action: 'navigate', target: '/' },
        { action: 'click', target: '[data-testid="search-button"]' },
        { action: 'input', target: '[data-testid="search-input"]', data: { value: 'test query' } },
        { action: 'wait', target: '', data: { duration: 1000 } },
        { action: 'api', target: '/api/search' },
      ],
      thinkTime: [2000, 1000, 500, 1500],
      probability: 0.6,
      priority: 'medium',
    },
    {
      id: 'journey-2',
      name: 'Power User Flow',
      steps: [
        { action: 'navigate', target: '/dashboard' },
        { action: 'api', target: '/api/data' },
        { action: 'click', target: '[data-testid="advanced-filters"]' },
        { action: 'input', target: '[data-testid="filter-input"]', data: { value: 'advanced query' } },
        { action: 'websocket', target: 'realtime-updates' },
        { action: 'api', target: '/api/export' },
      ],
      thinkTime: [1000, 500, 2000, 1000, 3000],
      probability: 0.3,
      priority: 'high',
    },
    {
      id: 'journey-3',
      name: 'Casual Browser Flow',
      steps: [
        { action: 'navigate', target: '/' },
        { action: 'scroll', target: 'main' },
        { action: 'click', target: '[data-testid="featured-item"]' },
        { action: 'wait', target: '', data: { duration: 3000 } },
      ],
      thinkTime: [3000, 5000, 2000],
      probability: 0.1,
      priority: 'low',
    },
  ]);

  const {
    isRunning,
    metrics,
    alerts,
    startLoadTest,
    stopLoadTest,
    recordRequest,
    recordConnection,
    recordMessage,
    updateSystemMetrics,
  } = useLoadTesting(config, thresholds);

  const handleComponentMetricsUpdate = useCallback((componentMetrics: any) => {
    // Aggregate metrics from individual components
    if (componentMetrics.memoryUsage !== undefined) {
      updateSystemMetrics(componentMetrics.memoryUsage, 50); // Mock CPU usage
    }
  }, [updateSystemMetrics]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6">Load Testing Simulation Dashboard</h1>
        
        {/* Global Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600">Total Requests</div>
            <div className="text-2xl font-bold">{metrics.requestCount}</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600">Throughput</div>
            <div className="text-2xl font-bold">{metrics.throughput.toFixed(1)} RPS</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-sm text-yellow-600">Response Time</div>
            <div className="text-2xl font-bold">{metrics.averageResponseTime.toFixed(0)}ms</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-sm text-red-600">Error Rate</div>
            <div className="text-2xl font-bold">{metrics.requestCount > 0 ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2) : 0}%</div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={startLoadTest}
            disabled={isRunning}
            className="px-6 py-3 bg-green-600 text-white rounded-lg disabled:bg-gray-400 font-medium"
          >
            Start Global Load Test
          </button>
          <button
            onClick={stopLoadTest}
            disabled={!isRunning}
            className="px-6 py-3 bg-red-600 text-white rounded-lg disabled:bg-gray-400 font-medium"
          >
            Stop All Tests
          </button>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-medium mb-2">Performance Alerts</h3>
            <div className="space-y-1">
              {alerts.slice(-5).map((alert, index) => (
                <div key={index} className="text-red-700 text-sm">{alert}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Load Testing Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealTimeUpdates
          updateRate={20}
          onMetricsUpdate={handleComponentMetricsUpdate}
        />
        
        <ConcurrentUsers
          maxUsers={config.maxConcurrentUsers}
          journeys={journeys}
          onMetricsUpdate={handleComponentMetricsUpdate}
        />
        
        <HighVolumeData
          batchSize={1000}
          onMetricsUpdate={handleComponentMetricsUpdate}
        />
        
        <WebSocketLoad
          maxConnections={config.webSocketConnections}
          messageRate={config.messageRate}
          onMetricsUpdate={handleComponentMetricsUpdate}
        />
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Load Test Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium mb-3">Test Parameters</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Max Concurrent Users</label>
                <input
                  type="number"
                  value={config.maxConcurrentUsers}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxConcurrentUsers: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target RPS</label>
                <input
                  type="number"
                  value={config.targetRPS}
                  onChange={(e) => setConfig(prev => ({ ...prev, targetRPS: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Test Duration (seconds)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Ramp Up</label>
                <input
                  type="number"
                  value={config.rampUpDuration}
                  onChange={(e) => setConfig(prev => ({ ...prev, rampUpDuration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sustained Load</label>
                <input
                  type="number"
                  value={config.sustainedDuration}
                  onChange={(e) => setConfig(prev => ({ ...prev, sustainedDuration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Performance Thresholds</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Max Response Time (ms)</label>
                <input
                  type="number"
                  value={thresholds.maxResponseTime}
                  onChange={(e) => setThresholds(prev => ({ ...prev, maxResponseTime: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Error Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={thresholds.maxErrorRate * 100}
                  onChange={(e) => setThresholds(prev => ({ ...prev, maxErrorRate: parseFloat(e.target.value) / 100 }))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Examples */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Load Testing Tool Integration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Artillery.js</h3>
            <p className="text-sm text-gray-600 mb-3">
              Generate Artillery.js configuration for this load test scenario.
            </p>
            <button
              onClick={() => {
                const artilleryConfig = generateArtilleryConfig(config);
                console.log('Artillery.js Configuration:', JSON.stringify(artilleryConfig, null, 2));
                alert('Artillery.js configuration generated (check console)');
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
            >
              Generate Artillery Config
            </button>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">k6</h3>
            <p className="text-sm text-gray-600 mb-3">
              Generate k6 load testing script with current configuration.
            </p>
            <button
              onClick={() => {
                const k6Script = generateK6Script(config, thresholds);
                console.log('k6 Script:', k6Script);
                alert('k6 script generated (check console)');
              }}
              className="px-3 py-2 bg-green-600 text-white rounded text-sm"
            >
              Generate k6 Script
            </button>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Playwright</h3>
            <p className="text-sm text-gray-600 mb-3">
              Generate Playwright load test for browser-based testing.
            </p>
            <button
              onClick={() => {
                const playwrightTest = generatePlaywrightLoadTest(config);
                console.log('Playwright Test:', playwrightTest);
                alert('Playwright test generated (check console)');
              }}
              className="px-3 py-2 bg-purple-600 text-white rounded text-sm"
            >
              Generate Playwright Test
            </button>
          </div>
        </div>
      </div>

      {/* Test Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Test Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Current Session</h3>
            <div className="space-y-2 text-sm">
              <div>Status: <span className={`font-medium ${isRunning ? 'text-green-600' : 'text-gray-600'}`}>
                {isRunning ? 'Running' : 'Stopped'}
              </span></div>
              <div>Duration: {(metrics.duration / 1000).toFixed(1)}s</div>
              <div>Total Connections: {metrics.connectionCount}</div>
              <div>Total Messages: {metrics.messageCount}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">System Resources</h3>
            <div className="space-y-2 text-sm">
              <div>Memory Usage: {metrics.memoryUsage.toFixed(1)} MB</div>
              <div>CPU Usage: {metrics.cpuUsage.toFixed(1)}%</div>
              <div className="text-xs text-gray-500 mt-2">
                Note: System metrics are simulated for demonstration purposes
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadTestingSimulation;

// ===== EXPORTS FOR EXTERNAL USE =====

// Components and hooks are exported individually above
// Types exported separately
export type {
  LoadTestMetrics,
  UserJourney,
  UserStep,
  LoadTestConfig,
  PerformanceThresholds,
  WebSocketMessage,
  UserSession,
  DataBatch,
};