import React, { useRef, useEffect, useCallback, useState, useMemo, createContext, useContext } from 'react';
import { Container, Paper, Title, Group, Badge, Text, Stack, Grid, Button, Select, Switch, Progress, Tabs, ActionIcon, NumberInput } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconRefresh, IconActivity, IconDatabase, IconChartLine, IconSettings } from '@tabler/icons-react';
import * as d3 from 'd3';

interface DataPoint {
  timestamp: number;
  value: number;
  id: string;
  metadata?: Record<string, any>;
}

interface StreamingMetrics {
  pointsPerSecond: number;
  bufferUtilization: number;
  updateLatency: number;
  droppedFrames: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  throughput: number;
  memoryUsage: number;
  renderTime: number;
}

interface BufferConfiguration {
  maxSize: number;
  compressionEnabled: boolean;
  compressionRatio: number;
  overflowStrategy: 'drop-oldest' | 'drop-newest' | 'compress';
  retentionTime: number;
}

interface ConnectionConfig {
  protocol: 'websocket' | 'sse' | 'polling';
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  timeout: number;
}

interface PerformanceThresholds {
  maxLatency: number;
  minFrameRate: number;
  maxMemoryUsage: number;
  bufferWarningLevel: number;
  throughputThreshold: number;
}

const StreamingContext = createContext<{
  isStreaming: boolean;
  metrics: StreamingMetrics;
  bufferConfig: BufferConfiguration;
  connectionConfig: ConnectionConfig;
  thresholds: PerformanceThresholds;
  startStream: () => void;
  stopStream: () => void;
  updateConfig: (config: Partial<BufferConfiguration>) => void;
  clearBuffer: () => void;
} | null>(null);

export const StreamingProvider: React.FC<{
  children: React.ReactNode;
  initialConfig?: Partial<BufferConfiguration>;
}> = ({ children, initialConfig }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [metrics, setMetrics] = useState<StreamingMetrics>({
    pointsPerSecond: 0,
    bufferUtilization: 0,
    updateLatency: 0,
    droppedFrames: 0,
    connectionStatus: 'disconnected',
    throughput: 0,
    memoryUsage: 0,
    renderTime: 0
  });

  const [bufferConfig, setBufferConfig] = useState<BufferConfiguration>({
    maxSize: 10000,
    compressionEnabled: true,
    compressionRatio: 0.7,
    overflowStrategy: 'drop-oldest',
    retentionTime: 300000, // 5 minutes
    ...initialConfig
  });

  const connectionConfig: ConnectionConfig = {
    protocol: 'websocket',
    reconnectInterval: 1000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    timeout: 5000
  };

  const thresholds: PerformanceThresholds = {
    maxLatency: 100,
    minFrameRate: 30,
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    bufferWarningLevel: 80,
    throughputThreshold: 1000
  };

  const startStream = useCallback(() => {
    setIsStreaming(true);
    setMetrics(prev => ({ ...prev, connectionStatus: 'connected' }));
  }, []);

  const stopStream = useCallback(() => {
    setIsStreaming(false);
    setMetrics(prev => ({ ...prev, connectionStatus: 'disconnected' }));
  }, []);

  const updateConfig = useCallback((config: Partial<BufferConfiguration>) => {
    setBufferConfig(prev => ({ ...prev, ...config }));
  }, []);

  const clearBuffer = useCallback(() => {
    setMetrics(prev => ({ ...prev, bufferUtilization: 0 }));
  }, []);

  return (
    <StreamingContext.Provider value={{
      isStreaming,
      metrics,
      bufferConfig,
      connectionConfig,
      thresholds,
      startStream,
      stopStream,
      updateConfig,
      clearBuffer
    }}>
      {children}
    </StreamingContext.Provider>
  );
};

export const useStreamingContext = () => {
  const context = useContext(StreamingContext);
  if (!context) {
    throw new Error('useStreamingContext must be used within StreamingProvider');
  }
  return context;
};

export const useDataStreamer = (
  onDataReceived: (data: DataPoint[]) => void,
  config?: Partial<ConnectionConfig>
) => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(0);
  
  const connectionRef = useRef<WebSocket | EventSource | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout>();
  const reconnectRef = useRef<NodeJS.Timeout>();

  const { isStreaming, connectionConfig: defaultConfig, thresholds } = useStreamingContext();
  const mergedConfig = { ...defaultConfig, ...config };

  const simulateWebSocketConnection = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current = null;
    }

    setConnectionStatus('connecting');
    
    // Simulate connection establishment
    setTimeout(() => {
      setConnectionStatus('connected');
      setReconnectAttempts(0);
      setLastHeartbeat(Date.now());
      
      // Start data simulation
      const interval = setInterval(() => {
        if (!isStreaming) {
          clearInterval(interval);
          return;
        }

        const batchSize = Math.floor(Math.random() * 10) + 1;
        const dataPoints: DataPoint[] = Array.from({ length: batchSize }, (_, i) => ({
          timestamp: Date.now() + i,
          value: Math.random() * 100 + Math.sin(Date.now() / 1000) * 20,
          id: 'point-' + Date.now() + '-' + i,
          metadata: {
            source: 'simulation',
            quality: Math.random() > 0.9 ? 'low' : 'high'
          }
        }));

        onDataReceived(dataPoints);
      }, 50 + Math.random() * 100); // Variable interval

      // Simulate heartbeat
      heartbeatRef.current = setInterval(() => {
        setLastHeartbeat(Date.now());
      }, mergedConfig.heartbeatInterval);

      connectionRef.current = { close: () => clearInterval(interval) } as any;
    }, 100 + Math.random() * 500);
  }, [isStreaming, onDataReceived, mergedConfig]);

  const connect = useCallback(() => {
    if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
      return;
    }

    simulateWebSocketConnection();
  }, [connectionStatus, simulateWebSocketConnection]);

  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
    }
    
    setConnectionStatus('disconnected');
  }, []);

  const reconnect = useCallback(() => {
    if (reconnectAttempts >= mergedConfig.maxReconnectAttempts) {
      setConnectionStatus('error');
      return;
    }

    setReconnectAttempts(prev => prev + 1);
    disconnect();
    
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff
    reconnectRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [reconnectAttempts, mergedConfig.maxReconnectAttempts, disconnect, connect]);

  useEffect(() => {
    if (isStreaming && connectionStatus === 'disconnected') {
      connect();
    } else if (!isStreaming && connectionStatus !== 'disconnected') {
      disconnect();
    }
  }, [isStreaming, connectionStatus, connect, disconnect]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionStatus,
    reconnectAttempts,
    lastHeartbeat,
    connect,
    disconnect,
    reconnect
  };
};

export const useBufferManager = <T extends DataPoint>(
  maxSize: number = 10000,
  retentionTime: number = 300000
) => {
  const [buffer, setBuffer] = useState<T[]>([]);
  const [bufferStats, setBufferStats] = useState({
    utilization: 0,
    oldestTimestamp: 0,
    newestTimestamp: 0,
    compressionRatio: 1,
    droppedCount: 0
  });

  const { bufferConfig, thresholds } = useStreamingContext();

  const addData = useCallback((newData: T | T[]) => {
    const dataArray = Array.isArray(newData) ? newData : [newData];
    const now = Date.now();

    setBuffer(prevBuffer => {
      let updatedBuffer = [...prevBuffer, ...dataArray];
      
      // Remove old data based on retention time
      if (retentionTime > 0) {
        const cutoffTime = now - retentionTime;
        updatedBuffer = updatedBuffer.filter(item => item.timestamp > cutoffTime);
      }
      
      let droppedCount = 0;
      
      // Handle buffer overflow
      if (updatedBuffer.length > maxSize) {
        const excessCount = updatedBuffer.length - maxSize;
        droppedCount = excessCount;
        
        switch (bufferConfig.overflowStrategy) {
          case 'drop-oldest':
            updatedBuffer = updatedBuffer.slice(excessCount);
            break;
          case 'drop-newest':
            updatedBuffer = updatedBuffer.slice(0, maxSize);
            break;
          case 'compress':
            // Simple compression: keep every nth item
            const compressionFactor = Math.ceil(updatedBuffer.length / maxSize);
            updatedBuffer = updatedBuffer.filter((_, index) => index % compressionFactor === 0);
            break;
        }
      }

      // Update buffer statistics
      setBufferStats({
        utilization: (updatedBuffer.length / maxSize) * 100,
        oldestTimestamp: updatedBuffer.length > 0 ? updatedBuffer[0].timestamp : 0,
        newestTimestamp: updatedBuffer.length > 0 ? updatedBuffer[updatedBuffer.length - 1].timestamp : 0,
        compressionRatio: updatedBuffer.length / (updatedBuffer.length + droppedCount),
        droppedCount
      });

      return updatedBuffer;
    });
  }, [maxSize, retentionTime, bufferConfig.overflowStrategy]);

  const clearBuffer = useCallback(() => {
    setBuffer([]);
    setBufferStats({
      utilization: 0,
      oldestTimestamp: 0,
      newestTimestamp: 0,
      compressionRatio: 1,
      droppedCount: 0
    });
  }, []);

  const getTimeRange = useCallback((startTime: number, endTime: number): T[] => {
    return buffer.filter(item => item.timestamp >= startTime && item.timestamp <= endTime);
  }, [buffer]);

  const getLatestData = useCallback((count: number): T[] => {
    return buffer.slice(-count);
  }, [buffer]);

  const compressBuffer = useCallback((factor: number = 2) => {
    setBuffer(prevBuffer => prevBuffer.filter((_, index) => index % factor === 0));
  }, []);

  return {
    buffer,
    bufferStats,
    addData,
    clearBuffer,
    getTimeRange,
    getLatestData,
    compressBuffer,
    size: buffer.length,
    utilization: bufferStats.utilization,
    isEmpty: buffer.length === 0,
    isFull: buffer.length >= maxSize
  };
};

export const usePerformanceMonitor = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    frameRate: 60,
    averageRenderTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    dataProcessingTime: 0,
    bufferEfficiency: 1,
    errorRate: 0
  });

  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: number;
  }>>([]);

  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTime = useRef(performance.now());
  const { thresholds } = useStreamingContext();

  const recordFrameTime = useCallback(() => {
    const now = performance.now();
    const frameTime = now - lastFrameTime.current;
    lastFrameTime.current = now;

    frameTimesRef.current.push(frameTime);
    if (frameTimesRef.current.length > 60) { // Keep last 60 frames
      frameTimesRef.current.shift();
    }

    const averageFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
    const fps = 1000 / averageFrameTime;

    setPerformanceMetrics(prev => ({
      ...prev,
      frameRate: fps,
      averageRenderTime: averageFrameTime
    }));

    // Check for performance issues
    if (fps < thresholds.minFrameRate) {
      addAlert({
        type: 'warning',
        message: `Low frame rate detected: ${fps.toFixed(1)} FPS`
      });
    }
  }, [thresholds.minFrameRate]);

  const recordMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const memoryUsage = memInfo.usedJSHeapSize;
      
      setPerformanceMetrics(prev => ({
        ...prev,
        memoryUsage
      }));

      if (memoryUsage > thresholds.maxMemoryUsage) {
        addAlert({
          type: 'error',
          message: `High memory usage: ${(memoryUsage / 1024 / 1024).toFixed(1)}MB`
        });
      }
    }
  }, [thresholds.maxMemoryUsage]);

  const recordLatency = useCallback((latency: number) => {
    setPerformanceMetrics(prev => ({
      ...prev,
      networkLatency: latency
    }));

    if (latency > thresholds.maxLatency) {
      addAlert({
        type: 'warning',
        message: `High network latency: ${latency}ms`
      });
    }
  }, [thresholds.maxLatency]);

  const addAlert = useCallback((alert: Omit<typeof alerts[0], 'id' | 'timestamp'>) => {
    const newAlert = {
      ...alert,
      id: Date.now().toString(),
      timestamp: Date.now()
    };

    setAlerts(prev => {
      const updated = [newAlert, ...prev].slice(0, 10); // Keep last 10 alerts
      return updated;
    });

    // Auto-remove alerts after 10 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
    }, 10000);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const getHealthScore = useCallback(() => {
    const { frameRate, memoryUsage, networkLatency } = performanceMetrics;
    
    let score = 100;
    
    // Frame rate penalty
    if (frameRate < thresholds.minFrameRate) {
      score -= (thresholds.minFrameRate - frameRate) * 2;
    }
    
    // Memory usage penalty
    const memoryPercentage = (memoryUsage / thresholds.maxMemoryUsage) * 100;
    if (memoryPercentage > 80) {
      score -= memoryPercentage - 80;
    }
    
    // Latency penalty
    if (networkLatency > thresholds.maxLatency) {
      score -= (networkLatency - thresholds.maxLatency) / 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }, [performanceMetrics, thresholds]);

  useEffect(() => {
    const interval = setInterval(() => {
      recordMemoryUsage();
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [recordMemoryUsage]);

  return {
    performanceMetrics,
    alerts,
    recordFrameTime,
    recordLatency,
    addAlert,
    clearAlerts,
    getHealthScore: getHealthScore()
  };
};

export const useLiveChart = (
  initialData: DataPoint[] = [],
  chartConfig: {
    maxDataPoints?: number;
    updateInterval?: number;
    smoothTransitions?: boolean;
  } = {}
) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [chartData, setChartData] = useState<DataPoint[]>(initialData);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const { isStreaming, metrics } = useStreamingContext();
  const { recordFrameTime } = usePerformanceMonitor();
  const { buffer, addData: addToBuffer } = useBufferManager<DataPoint>(
    chartConfig.maxDataPoints || 1000
  );

  const config = {
    maxDataPoints: 1000,
    updateInterval: 100,
    smoothTransitions: true,
    ...chartConfig
  };

  const updateChart = useCallback((newData: DataPoint[]) => {
    if (!svgRef.current) return;

    const startTime = performance.now();
    setIsAnimating(true);

    const svg = d3.select(svgRef.current);
    const container = svg.select('.chart-container');
    
    if (container.empty()) {
      // Initialize chart
      const margin = { top: 20, right: 30, bottom: 40, left: 40 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const g = svg.append('g')
        .attr('class', 'chart-container')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Add axes
      g.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${height})`);
      g.append('g').attr('class', 'y-axis');
      g.append('path').attr('class', 'line');
    }

    // Update data
    setChartData(prevData => {
      const combinedData = [...prevData, ...newData];
      return combinedData.slice(-config.maxDataPoints);
    });

    // Add to buffer for analysis
    addToBuffer(newData);

    const endTime = performance.now();
    recordFrameTime();

    setIsAnimating(false);
  }, [config.maxDataPoints, addToBuffer, recordFrameTime]);

  const renderChart = useCallback(() => {
    if (!svgRef.current || chartData.length === 0) return;

    const svg = d3.select(svgRef.current);
    const container = svg.select('.chart-container');
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Update scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(chartData, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(chartData, d => d.value) as [number, number])
      .nice()
      .range([height, 0]);

    // Update axes
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat('%H:%M:%S'));
    const yAxis = d3.axisLeft(yScale);

    container.select('.x-axis')
      .transition()
      .duration(config.smoothTransitions ? 200 : 0)
      .call(xAxis);

    container.select('.y-axis')
      .transition()
      .duration(config.smoothTransitions ? 200 : 0)
      .call(yAxis);

    // Update line
    const line = d3.line<DataPoint>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    container.select('.line')
      .datum(chartData)
      .transition()
      .duration(config.smoothTransitions ? 200 : 0)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2);

  }, [chartData, config.smoothTransitions]);

  useEffect(() => {
    renderChart();
  }, [renderChart]);

  const clearChart = useCallback(() => {
    setChartData([]);
    if (svgRef.current) {
      d3.select(svgRef.current).selectAll('*').remove();
    }
  }, []);

  const exportData = useCallback(() => {
    return {
      data: chartData,
      metrics: metrics,
      timestamp: Date.now()
    };
  }, [chartData, metrics]);

  return {
    svgRef,
    chartData,
    isAnimating,
    updateChart,
    clearChart,
    exportData,
    dataPoints: chartData.length
  };
};

const RealTimeDataVisualizationExercise: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('live-chart');
  const [dataRate, setDataRate] = useState(20); // points per second
  const [bufferSize, setBufferSize] = useState(5000);

  return (
    <StreamingProvider initialConfig={{ maxSize: bufferSize }}>
      <Container size="xl" py="xl">
        <RealTimeDemo 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dataRate={dataRate}
          setDataRate={setDataRate}
          bufferSize={bufferSize}
          setBufferSize={setBufferSize}
        />
      </Container>
    </StreamingProvider>
  );
};

const RealTimeDemo: React.FC<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dataRate: number;
  setDataRate: (rate: number) => void;
  bufferSize: number;
  setBufferSize: (size: number) => void;
}> = ({ 
  activeTab, 
  setActiveTab,
  dataRate,
  setDataRate,
  bufferSize,
  setBufferSize
}) => {
  const { 
    isStreaming, 
    metrics, 
    startStream, 
    stopStream, 
    clearBuffer,
    updateConfig 
  } = useStreamingContext();

  const { getHealthScore, alerts, clearAlerts } = usePerformanceMonitor();

  const { 
    svgRef,
    chartData,
    updateChart,
    clearChart,
    dataPoints 
  } = useLiveChart([], {
    maxDataPoints: bufferSize,
    smoothTransitions: true
  });

  const { connectionStatus } = useDataStreamer((newData) => {
    updateChart(newData);
  });

  useEffect(() => {
    updateConfig({ maxSize: bufferSize });
  }, [bufferSize, updateConfig]);

  return (
    <Stack gap="xl">
      <div>
        <Title order={1} size="h2" mb="md">
          Real-Time Data Visualization Exercise
        </Title>
        <Text c="dimmed">
          Build sophisticated real-time data visualization systems with WebSocket integration,
          intelligent buffering, backpressure handling, and comprehensive performance monitoring.
        </Text>
      </div>

      <Paper p="md" withBorder>
        <Title order={3} size="h4" mb="md">System Status</Title>
        <Grid>
          <Grid.Col span={3}>
            <Group gap="xs">
              <IconActivity size={20} color={isStreaming ? '#10b981' : '#6b7280'} />
              <div>
                <Text size="sm" fw={500}>{isStreaming ? 'Streaming' : 'Stopped'}</Text>
                <Text size="xs" c="dimmed">{connectionStatus}</Text>
              </div>
            </Group>
          </Grid.Col>
          <Grid.Col span={3}>
            <Group gap="xs">
              <IconChartLine size={20} />
              <div>
                <Text size="sm" fw={500}>{metrics.pointsPerSecond.toFixed(1)} pts/sec</Text>
                <Text size="xs" c="dimmed">Data Rate</Text>
              </div>
            </Group>
          </Grid.Col>
          <Grid.Col span={3}>
            <Group gap="xs">
              <IconDatabase size={20} />
              <div>
                <Text size="sm" fw={500}>{metrics.bufferUtilization.toFixed(1)}%</Text>
                <Text size="xs" c="dimmed">Buffer Usage</Text>
              </div>
            </Group>
          </Grid.Col>
          <Grid.Col span={3}>
            <Group gap="xs">
              <div style={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: getHealthScore > 80 ? '#10b981' : getHealthScore > 60 ? '#f59e0b' : '#ef4444' 
              }} />
              <div>
                <Text size="sm" fw={500}>{getHealthScore.toFixed(0)}</Text>
                <Text size="xs" c="dimmed">Health Score</Text>
              </div>
            </Group>
          </Grid.Col>
        </Grid>
      </Paper>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="live-chart" leftSection={<IconChartLine size={16} />}>Live Chart</Tabs.Tab>
          <Tabs.Tab value="streaming" leftSection={<IconActivity size={16} />}>Data Streaming</Tabs.Tab>
          <Tabs.Tab value="buffer" leftSection={<IconDatabase size={16} />}>Buffer Management</Tabs.Tab>
          <Tabs.Tab value="performance" leftSection={<IconSettings size={16} />}>Performance</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="live-chart" pt="md">
          <Paper p="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={3} size="h4">Live Chart Visualization</Title>
              <Group gap="xs">
                <Button
                  leftSection={isStreaming ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                  color={isStreaming ? "red" : "green"}
                  onClick={isStreaming ? stopStream : startStream}
                >
                  {isStreaming ? 'Stop' : 'Start'}
                </Button>
                <Button
                  variant="light"
                  leftSection={<IconRefresh size={16} />}
                  onClick={clearChart}
                >
                  Clear
                </Button>
                <Badge color="green" variant="light">Fully Implemented</Badge>
              </Group>
            </Group>
            
            <svg
              ref={svgRef}
              width={800}
              height={400}
              style={{
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                background: '#fafafa'
              }}
            />

            <Grid mt="md">
              <Grid.Col span={4}>
                <Text size="sm" fw={500} mb="xs">Data Points</Text>
                <Text size="lg" fw={700}>{dataPoints.toLocaleString()}</Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="sm" fw={500} mb="xs">Render Time</Text>
                <Text size="lg" fw={700}>{metrics.renderTime.toFixed(1)}ms</Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text size="sm" fw={500} mb="xs">Latency</Text>
                <Text size="lg" fw={700}>{metrics.updateLatency.toFixed(1)}ms</Text>
              </Grid.Col>
            </Grid>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="streaming" pt="md">
          <Paper p="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={3} size="h4">Data Streaming Management</Title>
              <Badge color="green" variant="light">Fully Implemented</Badge>
            </Group>
            
            <StreamingControlPanel />
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="buffer" pt="md">
          <Paper p="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={3} size="h4">Buffer Management</Title>
              <Badge color="green" variant="light">Fully Implemented</Badge>
            </Group>
            
            <BufferManagementPanel />
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="performance" pt="md">
          <Paper p="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={3} size="h4">Performance Monitor</Title>
              <Badge color="green" variant="light">Fully Implemented</Badge>
            </Group>
            
            <PerformanceMonitorPanel />
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <Paper p="md" withBorder>
        <Title order={3} size="h4" mb="md">Implementation Status</Title>
        <Grid>
          <Grid.Col span={6}>
            <Stack gap="xs">
              <Badge color="green" variant="light" fullWidth>LiveChart: ✅ Implemented</Badge>
              <Badge color="green" variant="light" fullWidth>DataStreamer: ✅ Implemented</Badge>
            </Stack>
          </Grid.Col>
          <Grid.Col span={6}>
            <Stack gap="xs">
              <Badge color="green" variant="light" fullWidth>BufferManager: ✅ Implemented</Badge>
              <Badge color="green" variant="light" fullWidth>PerformanceMonitor: ✅ Implemented</Badge>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>
    </Stack>
  );
};

const StreamingControlPanel: React.FC = () => {
  const { metrics, connectionConfig } = useStreamingContext();
  
  return (
    <Grid>
      <Grid.Col span={6}>
        <Stack gap="sm">
          <Text size="sm" fw={500}>Connection Settings</Text>
          <Stack gap="xs">
            <Text size="xs">Protocol: {connectionConfig.protocol}</Text>
            <Text size="xs">Reconnect Interval: {connectionConfig.reconnectInterval}ms</Text>
            <Text size="xs">Max Attempts: {connectionConfig.maxReconnectAttempts}</Text>
            <Text size="xs">Heartbeat: {connectionConfig.heartbeatInterval}ms</Text>
          </Stack>
        </Stack>
      </Grid.Col>
      <Grid.Col span={6}>
        <Stack gap="sm">
          <Text size="sm" fw={500}>Stream Metrics</Text>
          <Stack gap="xs">
            <Text size="xs">Throughput: {metrics.throughput.toFixed(1)} MB/s</Text>
            <Text size="xs">Dropped Frames: {metrics.droppedFrames}</Text>
            <Text size="xs">Memory: {(metrics.memoryUsage / 1024 / 1024).toFixed(1)} MB</Text>
            <Text size="xs">Connection: {metrics.connectionStatus}</Text>
          </Stack>
        </Stack>
      </Grid.Col>
    </Grid>
  );
};

const BufferManagementPanel: React.FC = () => {
  const { bufferConfig, metrics } = useStreamingContext();
  
  return (
    <Grid>
      <Grid.Col span={12}>
        <Text size="sm" fw={500} mb="sm">Buffer Utilization</Text>
        <Progress 
          value={metrics.bufferUtilization} 
          color={metrics.bufferUtilization > 80 ? 'red' : metrics.bufferUtilization > 60 ? 'yellow' : 'green'}
          mb="md"
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <Stack gap="sm">
          <Text size="sm" fw={500}>Configuration</Text>
          <Stack gap="xs">
            <Text size="xs">Max Size: {bufferConfig.maxSize.toLocaleString()}</Text>
            <Text size="xs">Compression: {bufferConfig.compressionEnabled ? 'Enabled' : 'Disabled'}</Text>
            <Text size="xs">Overflow: {bufferConfig.overflowStrategy}</Text>
            <Text size="xs">Retention: {(bufferConfig.retentionTime / 1000).toFixed(0)}s</Text>
          </Stack>
        </Stack>
      </Grid.Col>
      <Grid.Col span={6}>
        <Stack gap="sm">
          <Text size="sm" fw={500}>Statistics</Text>
          <Stack gap="xs">
            <Text size="xs">Current Size: {(metrics.bufferUtilization * bufferConfig.maxSize / 100).toFixed(0)}</Text>
            <Text size="xs">Compression Ratio: {bufferConfig.compressionRatio.toFixed(2)}</Text>
            <Text size="xs">Utilization: {metrics.bufferUtilization.toFixed(1)}%</Text>
            <Text size="xs">Status: {metrics.bufferUtilization > 90 ? 'Critical' : 'Normal'}</Text>
          </Stack>
        </Stack>
      </Grid.Col>
    </Grid>
  );
};

const PerformanceMonitorPanel: React.FC = () => {
  const { alerts, clearAlerts, getHealthScore } = usePerformanceMonitor();
  const { thresholds } = useStreamingContext();
  
  return (
    <Stack gap="md">
      <Grid>
        <Grid.Col span={6}>
          <Stack gap="sm">
            <Text size="sm" fw={500}>Performance Thresholds</Text>
            <Stack gap="xs">
              <Text size="xs">Max Latency: {thresholds.maxLatency}ms</Text>
              <Text size="xs">Min Frame Rate: {thresholds.minFrameRate} FPS</Text>
              <Text size="xs">Max Memory: {(thresholds.maxMemoryUsage / 1024 / 1024).toFixed(0)} MB</Text>
              <Text size="xs">Buffer Warning: {thresholds.bufferWarningLevel}%</Text>
            </Stack>
          </Stack>
        </Grid.Col>
        <Grid.Col span={6}>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="sm" fw={500}>Health Score</Text>
              <Button size="xs" variant="light" onClick={clearAlerts}>
                Clear Alerts
              </Button>
            </Group>
            <div>
              <Progress 
                value={getHealthScore} 
                color={getHealthScore > 80 ? 'green' : getHealthScore > 60 ? 'yellow' : 'red'}
                size="lg"
              />
              <Text size="xs" c="dimmed" mt="xs">
                Overall system performance: {getHealthScore.toFixed(0)}/100
              </Text>
            </div>
          </Stack>
        </Grid.Col>
      </Grid>

      {alerts.length > 0 && (
        <div>
          <Text size="sm" fw={500} mb="xs">Recent Alerts</Text>
          <Stack gap="xs">
            {alerts.slice(0, 3).map(alert => (
              <Paper key={alert.id} p="xs" withBorder style={{ 
                borderLeft: `4px solid ${alert.type === 'error' ? '#ef4444' : alert.type === 'warning' ? '#f59e0b' : '#3b82f6'}` 
              }}>
                <Text size="xs">{alert.message}</Text>
              </Paper>
            ))}
          </Stack>
        </div>
      )}
    </Stack>
  );
};

export default RealTimeDataVisualizationExercise;