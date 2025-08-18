import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

// Types for microservices coordination
interface Service {
  name: string;
  endpoint: string;
  priority: number;
  timeout: number;
  retryAttempts: number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastChecked?: Date;
  responseTime?: number;
  errorRate?: number;
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
  nextAttemptTime: number;
}

interface HealthMetrics {
  responseTime: number;
  errorRate: number;
  availability: number;
  throughput: number;
  lastCheck: Date;
}

interface ServiceRequest {
  id: string;
  service: string;
  endpoint: string;
  method: string;
  data?: any;
  priority: number;
  timestamp: number;
  traceId: string;
}

// Service Context for global coordination
interface ServiceContextValue {
  services: Map<string, Service>;
  circuitBreakers: Map<string, CircuitBreakerState>;
  healthMetrics: Map<string, HealthMetrics>;
  registerService: (service: Service) => void;
  executeRequest: (request: ServiceRequest) => Promise<any>;
  getServiceHealth: (serviceName: string) => HealthMetrics | undefined;
}

const ServiceContext = createContext<ServiceContextValue | null>(null);

// Service Orchestrator Component
export interface ServiceOrchestratorProps {
  services: Array<{
    name: string;
    endpoint: string;
    priority: number;
    timeout: number;
    retryAttempts: number;
  }>;
  onServiceResponse: (serviceName: string, response: any) => void;
  onServiceError: (serviceName: string, error: Error) => void;
  onOrchestrationComplete: (results: Map<string, any>) => void;
}

export const ServiceOrchestrator: React.FC<ServiceOrchestratorProps> = ({
  services,
  onServiceResponse,
  onServiceError,
  onOrchestrationComplete,
}) => {
  const [orchestrationState, setOrchestrationState] = useState<{
    activeRequests: Map<string, ServiceRequest>;
    completedRequests: Map<string, any>;
    failedRequests: Map<string, Error>;
    executionStrategy: 'parallel' | 'sequential' | 'priority-based';
  }>({
    activeRequests: new Map(),
    completedRequests: new Map(),
    failedRequests: new Map(),
    executionStrategy: 'priority-based',
  });

  const [loadBalancer, setLoadBalancer] = useState<{
    roundRobinIndex: Map<string, number>;
    serviceWeights: Map<string, number>;
    activeConnections: Map<string, number>;
  }>({
    roundRobinIndex: new Map(),
    serviceWeights: new Map(),
    activeConnections: new Map(),
  });

  const requestQueue = useRef<ServiceRequest[]>([]);
  const maxConcurrentRequests = 10;

  const generateTraceId = (): string => {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const selectServiceInstance = useCallback((serviceName: string): Service | null => {
    const serviceInstances = services.filter(s => s.name === serviceName);
    if (serviceInstances.length === 0) return null;

    // Load balancing strategies
    const strategy = 'weighted-round-robin'; // Could be configurable

    switch (strategy) {
      case 'round-robin':
        const currentIndex = loadBalancer.roundRobinIndex.get(serviceName) || 0;
        const nextIndex = (currentIndex + 1) % serviceInstances.length;
        setLoadBalancer(prev => ({
          ...prev,
          roundRobinIndex: new Map(prev.roundRobinIndex).set(serviceName, nextIndex),
        }));
        return { ...serviceInstances[currentIndex], status: 'healthy' };

      case 'weighted-round-robin':
        // Select based on inverse response time (faster services get more requests)
        const weights = serviceInstances.map(service => {
          const responseTime = service.timeout || 1000;
          return 1000 / responseTime; // Inverse weight
        });
        
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < serviceInstances.length; i++) {
          random -= weights[i];
          if (random <= 0) {
            return { ...serviceInstances[i], status: 'healthy' };
          }
        }
        return { ...serviceInstances[0], status: 'healthy' };

      case 'least-connections':
        const leastConnections = serviceInstances.reduce((min, service) => {
          const connections = loadBalancer.activeConnections.get(service.name) || 0;
          const minConnections = loadBalancer.activeConnections.get(min.name) || 0;
          return connections < minConnections ? service : min;
        });
        return { ...leastConnections, status: 'healthy' };

      default:
        return { ...serviceInstances[0], status: 'healthy' };
    }
  }, [services, loadBalancer]);

  const executeServiceRequest = useCallback(async (request: ServiceRequest): Promise<any> => {
    const service = selectServiceInstance(request.service);
    if (!service) {
      throw new Error(`Service ${request.service} not found`);
    }

    // Update active connections
    setLoadBalancer(prev => ({
      ...prev,
      activeConnections: new Map(prev.activeConnections).set(
        service.name,
        (prev.activeConnections.get(service.name) || 0) + 1
      ),
    }));

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), service.timeout);

      const response = await fetch(service.endpoint, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Trace-ID': request.traceId,
          'X-Request-ID': request.id,
        },
        body: request.data ? JSON.stringify(request.data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const responseTime = Date.now() - startTime;

      // Update service metrics
      setLoadBalancer(prev => ({
        ...prev,
        activeConnections: new Map(prev.activeConnections).set(
          service.name,
          Math.max(0, (prev.activeConnections.get(service.name) || 1) - 1)
        ),
      }));

      onServiceResponse(service.name, { ...result, responseTime, traceId: request.traceId });
      return result;
    } catch (error) {
      setLoadBalancer(prev => ({
        ...prev,
        activeConnections: new Map(prev.activeConnections).set(
          service.name,
          Math.max(0, (prev.activeConnections.get(service.name) || 1) - 1)
        ),
      }));

      const serviceError = error instanceof Error ? error : new Error('Request failed');
      onServiceError(service.name, serviceError);
      throw serviceError;
    }
  }, [selectServiceInstance, onServiceResponse, onServiceError]);

  const orchestrateServices = useCallback(async (requests: ServiceRequest[]) => {
    const results = new Map<string, any>();
    const errors = new Map<string, Error>();

    setOrchestrationState(prev => ({
      ...prev,
      activeRequests: new Map(requests.map(req => [req.id, req])),
    }));

    try {
      if (orchestrationState.executionStrategy === 'parallel') {
        // Execute all requests in parallel
        const promises = requests.map(async (request) => {
          try {
            const result = await executeServiceRequest(request);
            results.set(request.service, result);
          } catch (error) {
            errors.set(request.service, error as Error);
          }
        });

        await Promise.all(promises);
      } else if (orchestrationState.executionStrategy === 'sequential') {
        // Execute requests one by one
        for (const request of requests) {
          try {
            const result = await executeServiceRequest(request);
            results.set(request.service, result);
          } catch (error) {
            errors.set(request.service, error as Error);
            // Continue with next request even if current fails
          }
        }
      } else if (orchestrationState.executionStrategy === 'priority-based') {
        // Execute by priority, with high priority requests first
        const sortedRequests = [...requests].sort((a, b) => a.priority - b.priority);
        
        // Group by priority and execute each group in parallel
        const priorityGroups = new Map<number, ServiceRequest[]>();
        sortedRequests.forEach(request => {
          if (!priorityGroups.has(request.priority)) {
            priorityGroups.set(request.priority, []);
          }
          priorityGroups.get(request.priority)!.push(request);
        });

        for (const [priority, groupRequests] of priorityGroups) {
          const groupPromises = groupRequests.map(async (request) => {
            try {
              const result = await executeServiceRequest(request);
              results.set(request.service, result);
            } catch (error) {
              errors.set(request.service, error as Error);
            }
          });

          await Promise.all(groupPromises);
        }
      }

      setOrchestrationState(prev => ({
        ...prev,
        completedRequests: results,
        failedRequests: errors,
        activeRequests: new Map(),
      }));

      onOrchestrationComplete(results);
    } catch (error) {
      console.error('Orchestration failed:', error);
    }
  }, [orchestrationState.executionStrategy, executeServiceRequest, onOrchestrationComplete]);

  const addToQueue = (request: ServiceRequest) => {
    requestQueue.current.push(request);
    processQueue();
  };

  const processQueue = useCallback(() => {
    if (requestQueue.current.length === 0) return;
    if (orchestrationState.activeRequests.size >= maxConcurrentRequests) return;

    const availableSlots = maxConcurrentRequests - orchestrationState.activeRequests.size;
    const requestsToProcess = requestQueue.current.splice(0, availableSlots);
    
    if (requestsToProcess.length > 0) {
      orchestrateServices(requestsToProcess);
    }
  }, [orchestrationState.activeRequests.size, orchestrateServices]);

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
      <h4>Service Orchestrator</h4>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <div>
            <strong>Registered Services:</strong> {services.length}
          </div>
          <div>
            <strong>Active Requests:</strong> {orchestrationState.activeRequests.size}
          </div>
          <div>
            <strong>Queue Length:</strong> {requestQueue.current.length}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h5>Execution Strategy</h5>
        <select
          value={orchestrationState.executionStrategy}
          onChange={(e) => setOrchestrationState(prev => ({
            ...prev,
            executionStrategy: e.target.value as any,
          }))}
          style={{ padding: '5px', borderRadius: '4px' }}
        >
          <option value="parallel">Parallel</option>
          <option value="sequential">Sequential</option>
          <option value="priority-based">Priority-based</option>
        </select>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h5>Services Status</h5>
        {services.map(service => {
          const connections = loadBalancer.activeConnections.get(service.name) || 0;
          return (
            <div key={service.name} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '8px',
              backgroundColor: '#f8f9fa',
              margin: '2px 0',
              borderRadius: '4px',
            }}>
              <span><strong>{service.name}</strong></span>
              <span>Priority: {service.priority}</span>
              <span>Connections: {connections}</span>
              <span>Timeout: {service.timeout}ms</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={() => {
            const sampleRequest: ServiceRequest = {
              id: `req_${Date.now()}`,
              service: services[0]?.name || 'test-service',
              endpoint: services[0]?.endpoint || '/api/test',
              method: 'GET',
              priority: 1,
              timestamp: Date.now(),
              traceId: generateTraceId(),
            };
            addToQueue(sampleRequest);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px',
          }}
        >
          Add Test Request
        </button>

        <button
          onClick={() => {
            requestQueue.current = [];
            setOrchestrationState(prev => ({
              ...prev,
              activeRequests: new Map(),
              completedRequests: new Map(),
              failedRequests: new Map(),
            }));
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Clear Queue
        </button>
      </div>

      {orchestrationState.completedRequests.size > 0 && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
          <strong>Completed Requests:</strong> {orchestrationState.completedRequests.size}
        </div>
      )}

      {orchestrationState.failedRequests.size > 0 && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
          <strong>Failed Requests:</strong> {orchestrationState.failedRequests.size}
        </div>
      )}
    </div>
  );
};

// Circuit Breaker Component
export interface CircuitBreakerProps {
  serviceName: string;
  failureThreshold: number;
  timeoutDuration: number;
  monitoringWindow: number;
  onStateChange: (state: 'closed' | 'open' | 'half-open') => void;
  onFailure: (error: Error) => void;
  children: React.ReactNode;
}

export const CircuitBreaker: React.FC<CircuitBreakerProps> = ({
  serviceName,
  failureThreshold,
  timeoutDuration,
  monitoringWindow,
  onStateChange,
  onFailure,
  children,
}) => {
  const [circuitState, setCircuitState] = useState<CircuitBreakerState>({
    state: 'closed',
    failureCount: 0,
    lastFailureTime: 0,
    successCount: 0,
    nextAttemptTime: 0,
  });

  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    lastRequestTime: 0,
  });

  const requestHistory = useRef<Array<{ timestamp: number; success: boolean; responseTime: number }>>([]);

  const cleanupOldRequests = useCallback(() => {
    const cutoff = Date.now() - monitoringWindow;
    requestHistory.current = requestHistory.current.filter(req => req.timestamp > cutoff);
  }, [monitoringWindow]);

  const calculateFailureRate = useCallback(() => {
    cleanupOldRequests();
    if (requestHistory.current.length === 0) return 0;
    
    const failures = requestHistory.current.filter(req => !req.success).length;
    return failures / requestHistory.current.length;
  }, [cleanupOldRequests]);

  const updateCircuitState = useCallback((newState: Partial<CircuitBreakerState>) => {
    setCircuitState(prev => {
      const updated = { ...prev, ...newState };
      if (updated.state !== prev.state) {
        onStateChange(updated.state);
      }
      return updated;
    });
  }, [onStateChange]);

  const recordRequest = useCallback((success: boolean, responseTime: number = 0) => {
    const timestamp = Date.now();
    
    requestHistory.current.push({ timestamp, success, responseTime });
    cleanupOldRequests();

    setMetrics(prev => ({
      totalRequests: prev.totalRequests + 1,
      successfulRequests: prev.successfulRequests + (success ? 1 : 0),
      failedRequests: prev.failedRequests + (success ? 0 : 1),
      averageResponseTime: requestHistory.current.length > 0 
        ? requestHistory.current.reduce((sum, req) => sum + req.responseTime, 0) / requestHistory.current.length
        : 0,
      lastRequestTime: timestamp,
    }));

    if (success) {
      if (circuitState.state === 'half-open') {
        updateCircuitState({
          successCount: circuitState.successCount + 1,
          failureCount: 0,
        });

        // Reset to closed after successful requests in half-open state
        if (circuitState.successCount + 1 >= 3) {
          updateCircuitState({
            state: 'closed',
            failureCount: 0,
            successCount: 0,
          });
        }
      } else if (circuitState.state === 'closed') {
        updateCircuitState({
          failureCount: Math.max(0, circuitState.failureCount - 1),
        });
      }
    } else {
      const newFailureCount = circuitState.failureCount + 1;
      const failureRate = calculateFailureRate();

      updateCircuitState({
        failureCount: newFailureCount,
        lastFailureTime: timestamp,
      });

      // Open circuit if failure threshold is exceeded
      if (newFailureCount >= failureThreshold || failureRate > 0.5) {
        updateCircuitState({
          state: 'open',
          nextAttemptTime: timestamp + timeoutDuration,
        });
      }

      onFailure(new Error(`Service ${serviceName} request failed`));
    }
  }, [circuitState, failureThreshold, timeoutDuration, serviceName, calculateFailureRate, updateCircuitState, onFailure, cleanupOldRequests]);

  const canExecuteRequest = useCallback((): boolean => {
    const now = Date.now();

    switch (circuitState.state) {
      case 'closed':
        return true;
      case 'open':
        if (now >= circuitState.nextAttemptTime) {
          updateCircuitState({
            state: 'half-open',
            successCount: 0,
          });
          return true;
        }
        return false;
      case 'half-open':
        return true;
      default:
        return false;
    }
  }, [circuitState, updateCircuitState]);

  const executeWithCircuitBreaker = useCallback(async (operation: () => Promise<any>) => {
    if (!canExecuteRequest()) {
      throw new Error(`Circuit breaker is open for service ${serviceName}`);
    }

    const startTime = Date.now();
    try {
      const result = await operation();
      const responseTime = Date.now() - startTime;
      recordRequest(true, responseTime);
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      recordRequest(false, responseTime);
      throw error;
    }
  }, [canExecuteRequest, serviceName, recordRequest]);

  // Automatic state monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Transition from open to half-open if timeout has elapsed
      if (circuitState.state === 'open' && now >= circuitState.nextAttemptTime) {
        updateCircuitState({
          state: 'half-open',
          successCount: 0,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [circuitState, updateCircuitState]);

  const getStateColor = (state: string): string => {
    switch (state) {
      case 'closed': return '#28a745';
      case 'open': return '#dc3545';
      case 'half-open': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStateIcon = (state: string): string => {
    switch (state) {
      case 'closed': return '✅';
      case 'open': return '⛔';
      case 'half-open': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
      <h4>Circuit Breaker - {serviceName}</h4>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '20px' }}>{getStateIcon(circuitState.state)}</span>
          <span style={{ 
            fontWeight: 'bold', 
            color: getStateColor(circuitState.state),
            textTransform: 'uppercase',
          }}>
            {circuitState.state}
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '14px' }}>
          <div>Failure Count: {circuitState.failureCount}</div>
          <div>Success Count: {circuitState.successCount}</div>
          <div>Total Requests: {metrics.totalRequests}</div>
          <div>Success Rate: {metrics.totalRequests > 0 ? Math.round((metrics.successfulRequests / metrics.totalRequests) * 100) : 0}%</div>
          <div>Avg Response: {Math.round(metrics.averageResponseTime)}ms</div>
          <div>Threshold: {failureThreshold}</div>
        </div>
      </div>

      {circuitState.state === 'open' && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          borderRadius: '4px',
          marginBottom: '15px',
        }}>
          <strong>Circuit Open:</strong> Next attempt in {Math.max(0, Math.round((circuitState.nextAttemptTime - Date.now()) / 1000))}s
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={() => {
            // Simulate a successful request
            recordRequest(true, Math.random() * 1000);
          }}
          disabled={!canExecuteRequest()}
          style={{
            padding: '8px 16px',
            backgroundColor: canExecuteRequest() ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: canExecuteRequest() ? 'pointer' : 'not-allowed',
            marginRight: '10px',
          }}
        >
          Simulate Success
        </button>

        <button
          onClick={() => {
            // Simulate a failed request
            recordRequest(false, Math.random() * 2000);
          }}
          disabled={!canExecuteRequest()}
          style={{
            padding: '8px 16px',
            backgroundColor: canExecuteRequest() ? '#dc3545' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: canExecuteRequest() ? 'pointer' : 'not-allowed',
            marginRight: '10px',
          }}
        >
          Simulate Failure
        </button>

        <button
          onClick={() => {
            setCircuitState({
              state: 'closed',
              failureCount: 0,
              lastFailureTime: 0,
              successCount: 0,
              nextAttemptTime: 0,
            });
            setMetrics({
              totalRequests: 0,
              successfulRequests: 0,
              failedRequests: 0,
              averageResponseTime: 0,
              lastRequestTime: 0,
            });
            requestHistory.current = [];
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ 
        padding: '10px', 
        backgroundColor: canExecuteRequest() ? '#d4edda' : '#f8d7da',
        borderRadius: '4px',
      }}>
        {children}
      </div>
    </div>
  );
};

// Service Monitor Component
export interface ServiceMonitorProps {
  services: Array<{
    name: string;
    healthEndpoint: string;
    checkInterval: number;
    alertThresholds: {
      responseTime: number;
      errorRate: number;
      availability: number;
    };
  }>;
  onHealthCheck: (serviceName: string, health: any) => void;
  onAlert: (serviceName: string, alert: any) => void;
}

export const ServiceMonitor: React.FC<ServiceMonitorProps> = ({
  services,
  onHealthCheck,
  onAlert,
}) => {
  const [healthStatus, setHealthStatus] = useState<Map<string, HealthMetrics>>(new Map());
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    serviceName: string;
    type: 'warning' | 'critical';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
  }>>([]);

  const healthCheckIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const performHealthCheck = useCallback(async (service: any) => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(service.healthEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Health-Check': 'true',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;
      
      let healthData: any = {};
      try {
        healthData = await response.json();
      } catch {
        healthData = { status: response.ok ? 'healthy' : 'unhealthy' };
      }

      const metrics: HealthMetrics = {
        responseTime,
        errorRate: isHealthy ? 0 : 1,
        availability: isHealthy ? 1 : 0,
        throughput: 1 / (responseTime / 1000), // requests per second
        lastCheck: new Date(),
      };

      setHealthStatus(prev => new Map(prev).set(service.name, metrics));
      onHealthCheck(service.name, { ...healthData, metrics });

      // Check against thresholds and generate alerts
      const thresholds = service.alertThresholds;
      
      if (responseTime > thresholds.responseTime) {
        createAlert(service.name, 'warning', 
          `High response time: ${responseTime}ms (threshold: ${thresholds.responseTime}ms)`);
      }

      if (!isHealthy) {
        createAlert(service.name, 'critical', 
          `Service unavailable: HTTP ${response.status}`);
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const metrics: HealthMetrics = {
        responseTime,
        errorRate: 1,
        availability: 0,
        throughput: 0,
        lastCheck: new Date(),
      };

      setHealthStatus(prev => new Map(prev).set(service.name, metrics));
      
      createAlert(service.name, 'critical', 
        `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      onHealthCheck(service.name, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics,
      });
    }
  }, [onHealthCheck]);

  const createAlert = useCallback((serviceName: string, type: 'warning' | 'critical', message: string) => {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serviceName,
      type,
      message,
      timestamp: new Date(),
      acknowledged: false,
    };

    setAlerts(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
    onAlert(serviceName, alert);
  }, [onAlert]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Setup health check intervals
  useEffect(() => {
    services.forEach(service => {
      // Clear existing interval if any
      const existingInterval = healthCheckIntervals.current.get(service.name);
      if (existingInterval) {
        clearInterval(existingInterval);
      }

      // Perform initial health check
      performHealthCheck(service);

      // Setup recurring health checks
      const interval = setInterval(() => {
        performHealthCheck(service);
      }, service.checkInterval);

      healthCheckIntervals.current.set(service.name, interval);
    });

    return () => {
      healthCheckIntervals.current.forEach(interval => clearInterval(interval));
      healthCheckIntervals.current.clear();
    };
  }, [services, performHealthCheck]);

  const getHealthColor = (metrics: HealthMetrics): string => {
    if (metrics.availability >= 0.99) return '#28a745';
    if (metrics.availability >= 0.95) return '#ffc107';
    return '#dc3545';
  };

  const getHealthIcon = (metrics: HealthMetrics): string => {
    if (metrics.availability >= 0.99) return '✅';
    if (metrics.availability >= 0.95) return '⚠️';
    return '❌';
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const criticalAlerts = unacknowledgedAlerts.filter(alert => alert.type === 'critical');

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h4>Service Monitor</h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {criticalAlerts.length > 0 && (
            <span style={{ 
              padding: '4px 8px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}>
              {criticalAlerts.length} Critical
            </span>
          )}
          {unacknowledgedAlerts.length > 0 && (
            <span style={{ 
              padding: '4px 8px', 
              backgroundColor: '#ffc107', 
              color: 'black', 
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}>
              {unacknowledgedAlerts.length} Alerts
            </span>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h5>Service Health Status</h5>
        {services.map(service => {
          const metrics = healthStatus.get(service.name);
          return (
            <div key={service.name} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              margin: '5px 0',
              borderRadius: '6px',
              border: metrics ? `2px solid ${getHealthColor(metrics)}` : '2px solid #ccc',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>
                  {metrics ? getHealthIcon(metrics) : '❓'}
                </span>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{service.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Check interval: {service.checkInterval / 1000}s
                  </div>
                </div>
              </div>
              
              {metrics && (
                <div style={{ textAlign: 'right', fontSize: '12px' }}>
                  <div>Response: {Math.round(metrics.responseTime)}ms</div>
                  <div>Availability: {Math.round(metrics.availability * 100)}%</div>
                  <div>Last check: {metrics.lastCheck.toLocaleTimeString()}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {alerts.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h5>Recent Alerts</h5>
            <button
              onClick={clearAlerts}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Clear All
            </button>
          </div>
          
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {alerts.slice(0, 10).map(alert => (
              <div key={alert.id} style={{ 
                padding: '8px',
                backgroundColor: alert.type === 'critical' ? '#f8d7da' : '#fff3cd',
                margin: '2px 0',
                borderRadius: '4px',
                opacity: alert.acknowledged ? 0.6 : 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                    {alert.serviceName} - {alert.type.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '11px' }}>{alert.message}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>
                    {alert.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                
                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    style={{
                      padding: '2px 6px',
                      fontSize: '10px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    ACK
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ 
        padding: '10px', 
        backgroundColor: '#e9ecef', 
        borderRadius: '4px',
        fontSize: '12px',
      }}>
        <strong>Monitoring:</strong> {services.length} services • 
        <strong> Total Alerts:</strong> {alerts.length} • 
        <strong> Last Update:</strong> {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

// Fallback Provider Component
export interface FallbackProviderProps {
  primaryService: string;
  fallbackServices: string[];
  fallbackStrategy: 'sequential' | 'parallel' | 'circuit-breaker';
  degradationLevels: Array<{
    level: number;
    services: string[];
    features: string[];
  }>;
  onFallback: (fromService: string, toService: string) => void;
  onDegradation: (level: number, availableFeatures: string[]) => void;
  children: React.ReactNode;
}

export const FallbackProvider: React.FC<FallbackProviderProps> = ({
  primaryService,
  fallbackServices,
  fallbackStrategy,
  degradationLevels,
  onFallback,
  onDegradation,
  children,
}) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [activeService, setActiveService] = useState(primaryService);
  const [serviceHealth, setServiceHealth] = useState<Map<string, boolean>>(new Map());
  const [fallbackHistory, setFallbackHistory] = useState<Array<{
    timestamp: Date;
    from: string;
    to: string;
    reason: string;
  }>>([]);

  const allServices = [primaryService, ...fallbackServices];

  // Monitor service health
  useEffect(() => {
    const checkServiceHealth = async (serviceName: string): Promise<boolean> => {
      try {
        // Simulate health check
        const response = await fetch(`/health/${serviceName}`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        });
        return response.ok;
      } catch {
        return false;
      }
    };

    const healthCheckInterval = setInterval(async () => {
      const healthChecks = await Promise.all(
        allServices.map(async service => ({
          service,
          healthy: await checkServiceHealth(service),
        }))
      );

      const newHealthMap = new Map<string, boolean>();
      healthChecks.forEach(({ service, healthy }) => {
        newHealthMap.set(service, healthy);
      });

      setServiceHealth(newHealthMap);

      // Determine appropriate service and degradation level
      evaluateServiceAndDegradation(newHealthMap);
    }, 10000); // Check every 10 seconds

    return () => clearInterval(healthCheckInterval);
  }, [allServices]);

  const evaluateServiceAndDegradation = useCallback((healthMap: Map<string, boolean>) => {
    let bestLevel = degradationLevels.length - 1; // Start with worst case
    let bestService = fallbackServices[fallbackServices.length - 1] || primaryService;

    // Find the best available degradation level
    for (let i = 0; i < degradationLevels.length; i++) {
      const level = degradationLevels[i];
      const availableServices = level.services.filter(service => healthMap.get(service) === true);
      
      if (availableServices.length > 0) {
        bestLevel = i;
        bestService = availableServices[0]; // Use first available service
        break;
      }
    }

    // Update if changes are needed
    if (bestLevel !== currentLevel) {
      setCurrentLevel(bestLevel);
      onDegradation(bestLevel, degradationLevels[bestLevel]?.features || []);
    }

    if (bestService !== activeService) {
      const fallbackEvent = {
        timestamp: new Date(),
        from: activeService,
        to: bestService,
        reason: `Service ${activeService} unavailable, switching to ${bestService}`,
      };

      setFallbackHistory(prev => [fallbackEvent, ...prev.slice(0, 9)]); // Keep last 10 events
      setActiveService(bestService);
      onFallback(activeService, bestService);
    }
  }, [currentLevel, activeService, degradationLevels, fallbackServices, primaryService, onFallback, onDegradation]);

  const executeWithFallback = useCallback(async (operation: () => Promise<any>) => {
    const currentDegradationLevel = degradationLevels[currentLevel];
    if (!currentDegradationLevel) {
      throw new Error('No available services');
    }

    if (fallbackStrategy === 'sequential') {
      // Try services one by one
      for (const serviceName of currentDegradationLevel.services) {
        if (serviceHealth.get(serviceName)) {
          try {
            return await operation();
          } catch (error) {
            console.warn(`Service ${serviceName} failed, trying next fallback`);
            continue;
          }
        }
      }
      throw new Error('All fallback services failed');
    } else if (fallbackStrategy === 'parallel') {
      // Try all services in parallel, return first success
      const promises = currentDegradationLevel.services
        .filter(service => serviceHealth.get(service))
        .map(service => operation());

      if (promises.length === 0) {
        throw new Error('No healthy services available');
      }

      return await Promise.race(promises);
    } else if (fallbackStrategy === 'circuit-breaker') {
      // Use circuit breaker logic for each service
      if (serviceHealth.get(activeService)) {
        return await operation();
      } else {
        throw new Error('Primary service circuit breaker is open');
      }
    }
  }, [currentLevel, degradationLevels, fallbackStrategy, serviceHealth, activeService]);

  const getCurrentFeatures = (): string[] => {
    return degradationLevels[currentLevel]?.features || [];
  };

  const isFeatureAvailable = (feature: string): boolean => {
    return getCurrentFeatures().includes(feature);
  };

  const getServiceStatusColor = (serviceName: string): string => {
    const isHealthy = serviceHealth.get(serviceName);
    if (isHealthy === undefined) return '#6c757d'; // Unknown
    return isHealthy ? '#28a745' : '#dc3545'; // Healthy or Unhealthy
  };

  const getServiceStatusIcon = (serviceName: string): string => {
    const isHealthy = serviceHealth.get(serviceName);
    if (isHealthy === undefined) return '❓';
    return isHealthy ? '✅' : '❌';
  };

  const getDegradationLevelColor = (level: number): string => {
    if (level === 0) return '#28a745'; // Full functionality
    if (level < degradationLevels.length - 1) return '#ffc107'; // Partial functionality
    return '#dc3545'; // Minimal functionality
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
      <h4>Fallback Provider</h4>
      
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div>
            <strong>Active Service:</strong> 
            <span style={{ 
              marginLeft: '5px',
              color: getServiceStatusColor(activeService),
              fontWeight: 'bold',
            }}>
              {activeService}
            </span>
          </div>
          <div>
            <strong>Strategy:</strong> {fallbackStrategy}
          </div>
          <div>
            <strong>Degradation Level:</strong> 
            <span style={{ 
              marginLeft: '5px',
              color: getDegradationLevelColor(currentLevel),
              fontWeight: 'bold',
            }}>
              {currentLevel + 1}/{degradationLevels.length}
            </span>
          </div>
          <div>
            <strong>Available Features:</strong> {getCurrentFeatures().length}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h5>Service Health</h5>
        {allServices.map(service => (
          <div key={service} style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px',
            backgroundColor: service === activeService ? '#e7f3ff' : '#f8f9fa',
            margin: '2px 0',
            borderRadius: '4px',
            border: service === activeService ? '2px solid #007bff' : '1px solid #ccc',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{getServiceStatusIcon(service)}</span>
              <span style={{ fontWeight: service === activeService ? 'bold' : 'normal' }}>
                {service}
              </span>
              {service === activeService && (
                <span style={{ 
                  fontSize: '12px', 
                  backgroundColor: '#007bff', 
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '10px',
                }}>
                  ACTIVE
                </span>
              )}
            </div>
            <span style={{ fontSize: '12px', color: '#666' }}>
              {serviceHealth.get(service) === true ? 'Healthy' : 
               serviceHealth.get(service) === false ? 'Unhealthy' : 'Unknown'}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h5>Degradation Levels</h5>
        {degradationLevels.map((level, index) => (
          <div key={index} style={{ 
            padding: '8px',
            backgroundColor: index === currentLevel ? getDegradationLevelColor(index) + '20' : '#f8f9fa',
            margin: '2px 0',
            borderRadius: '4px',
            border: index === currentLevel ? `2px solid ${getDegradationLevelColor(index)}` : '1px solid #ccc',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              Level {index + 1} {index === currentLevel && '(CURRENT)'}
            </div>
            <div style={{ fontSize: '12px' }}>
              <div><strong>Services:</strong> {level.services.join(', ')}</div>
              <div><strong>Features:</strong> {level.features.join(', ')}</div>
            </div>
          </div>
        ))}
      </div>

      {fallbackHistory.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h5>Fallback History</h5>
          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
            {fallbackHistory.slice(0, 5).map((event, index) => (
              <div key={index} style={{ 
                padding: '6px',
                backgroundColor: '#fff3cd',
                margin: '2px 0',
                borderRadius: '4px',
                fontSize: '12px',
              }}>
                <div><strong>{event.timestamp.toLocaleTimeString()}</strong></div>
                <div>{event.from} → {event.to}</div>
                <div style={{ color: '#666' }}>{event.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={() => {
            // Simulate service failure
            const randomService = allServices[Math.floor(Math.random() * allServices.length)];
            setServiceHealth(prev => new Map(prev).set(randomService, false));
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px',
          }}
        >
          Simulate Failure
        </button>

        <button
          onClick={() => {
            // Restore all services
            const restoredHealth = new Map<string, boolean>();
            allServices.forEach(service => restoredHealth.set(service, true));
            setServiceHealth(restoredHealth);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Restore All
        </button>
      </div>

      <div style={{ 
        padding: '10px', 
        backgroundColor: '#e9ecef', 
        borderRadius: '4px',
      }}>
        {children}
      </div>
    </div>
  );
};

// Demo component showing microservices coordination
export const MicroservicesCoordinationDemo: React.FC = () => {
  const [orchestrationResults, setOrchestrationResults] = useState<Map<string, any>>(new Map());
  
  const sampleServices = [
    { name: 'user-service', endpoint: '/api/users', priority: 1, timeout: 5000, retryAttempts: 3 },
    { name: 'order-service', endpoint: '/api/orders', priority: 2, timeout: 3000, retryAttempts: 2 },
    { name: 'payment-service', endpoint: '/api/payments', priority: 1, timeout: 10000, retryAttempts: 1 },
    { name: 'notification-service', endpoint: '/api/notifications', priority: 3, timeout: 2000, retryAttempts: 2 },
  ];

  const degradationLevels = [
    { 
      level: 0, 
      services: ['user-service', 'order-service', 'payment-service', 'notification-service'], 
      features: ['full-functionality', 'real-time-notifications', 'advanced-analytics', 'recommendations'] 
    },
    { 
      level: 1, 
      services: ['user-service', 'order-service', 'payment-service'], 
      features: ['core-functionality', 'basic-notifications', 'essential-analytics'] 
    },
    { 
      level: 2, 
      services: ['user-service', 'order-service'], 
      features: ['basic-functionality', 'read-only-mode'] 
    },
    { 
      level: 3, 
      services: ['user-service'], 
      features: ['minimal-functionality', 'cached-data-only'] 
    },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1400px' }}>
      <h2>Microservices Coordination Demo</h2>
      <p>Enterprise-scale microservices patterns including orchestration, circuit breakers, monitoring, and graceful degradation</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div>
          <h3>Service Orchestrator</h3>
          <ServiceOrchestrator
            services={sampleServices}
            onServiceResponse={(service, response) => {
              console.log('Service response:', { service, response });
              setOrchestrationResults(prev => new Map(prev).set(service, response));
            }}
            onServiceError={(service, error) => {
              console.error('Service error:', { service, error: error.message });
            }}
            onOrchestrationComplete={(results) => {
              console.log('Orchestration complete:', results);
              setOrchestrationResults(results);
            }}
          />
        </div>

        <div>
          <h3>Circuit Breaker</h3>
          <CircuitBreaker
            serviceName="payment-service"
            failureThreshold={3}
            timeoutDuration={15000}
            monitoringWindow={60000}
            onStateChange={(state) => {
              console.log('Circuit breaker state change:', state);
            }}
            onFailure={(error) => {
              console.error('Circuit breaker failure:', error.message);
            }}
          >
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>💳</div>
              <div>Payment Service</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Protected by circuit breaker
              </div>
            </div>
          </CircuitBreaker>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Service Monitor</h3>
        <ServiceMonitor
          services={[
            {
              name: 'user-service',
              healthEndpoint: '/health/users',
              checkInterval: 15000,
              alertThresholds: { responseTime: 1000, errorRate: 0.05, availability: 0.99 },
            },
            {
              name: 'order-service',
              healthEndpoint: '/health/orders',
              checkInterval: 20000,
              alertThresholds: { responseTime: 800, errorRate: 0.03, availability: 0.995 },
            },
            {
              name: 'payment-service',
              healthEndpoint: '/health/payments',
              checkInterval: 10000,
              alertThresholds: { responseTime: 2000, errorRate: 0.01, availability: 0.999 },
            },
          ]}
          onHealthCheck={(service, health) => {
            console.log('Health check result:', { service, health });
          }}
          onAlert={(service, alert) => {
            console.warn('Service alert triggered:', { service, alert });
          }}
        />
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Fallback Provider</h3>
        <FallbackProvider
          primaryService="primary-api"
          fallbackServices={['backup-api', 'cache-service', 'static-service']}
          fallbackStrategy="sequential"
          degradationLevels={degradationLevels}
          onFallback={(from, to) => {
            console.log('Fallback triggered:', { from, to });
          }}
          onDegradation={(level, features) => {
            console.log('Degradation level changed:', { level, availableFeatures: features });
          }}
        >
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>🛡️</div>
            <div>Application Core</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Protected by fallback provider
            </div>
          </div>
        </FallbackProvider>
      </div>

      {orchestrationResults.size > 0 && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#d4edda',
          borderRadius: '8px',
        }}>
          <h4>Orchestration Results</h4>
          <div style={{ fontSize: '14px' }}>
            {Array.from(orchestrationResults.entries()).map(([service, result]) => (
              <div key={service} style={{ marginBottom: '5px' }}>
                <strong>{service}:</strong> {JSON.stringify(result, null, 2)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MicroservicesCoordinationDemo;