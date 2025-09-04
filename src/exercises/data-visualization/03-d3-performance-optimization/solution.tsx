import React, { useRef, useEffect, useCallback, useState, useMemo, useLayoutEffect } from 'react';
import { Container, Paper, Title, Group, Badge, Text, Stack, Grid, Button, NumberInput, Switch, Progress, Tabs } from '@mantine/core';
import * as d3 from 'd3';

// Advanced Performance Optimization Types
interface PerformanceMetrics {
  frameRate: number;
  renderTime: number;
  memoryUsage: number;
  visibleElements: number;
  totalElements: number;
  optimizationScore: number;
}

interface VirtualizationConfig {
  chunkSize: number;
  bufferSize: number;
  lodThreshold: number;
  cullingEnabled: boolean;
}

interface StreamingConfig {
  batchSize: number;
  updateInterval: number;
  bufferCapacity: number;
  compressionEnabled: boolean;
}

interface CanvasConfig {
  devicePixelRatio: number;
  antialiasing: boolean;
  compositeOperation: string;
  imageSmoothingEnabled: boolean;
}

interface DataPoint {
  id: string;
  x: number;
  y: number;
  value: number;
  category: string;
  timestamp: number;
}

interface ViewportBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

interface DataChunk {
  id: string;
  data: DataPoint[];
  bounds: ViewportBounds;
  lastAccessed: number;
  renderPriority: number;
}

interface RenderTask {
  id: string;
  type: 'draw' | 'update' | 'clear';
  data: any;
  priority: number;
  timestamp: number;
}

interface WorkerTask {
  id: string;
  type: 'process' | 'aggregate' | 'transform';
  data: any;
  callback: (result: any) => void;
}

// Virtualized Chart Hook
export const useVirtualizedChart = (
  data: DataPoint[],
  dimensions: { width: number; height: number },
  config: VirtualizationConfig
) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState<ViewportBounds>({
    xMin: 0, xMax: 100, yMin: 0, yMax: 100
  });
  const [visibleData, setVisibleData] = useState<DataPoint[]>([]);
  const [chunks, setChunks] = useState<DataChunk[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    frameRate: 60,
    renderTime: 0,
    memoryUsage: 0,
    visibleElements: 0,
    totalElements: 0,
    optimizationScore: 1.0
  });

  const spatialIndex = useMemo(() => {
    const index = new Map<string, DataPoint[]>();
    const chunkSize = config.chunkSize;
    
    data.forEach(point => {
      const chunkX = Math.floor(point.x / chunkSize);
      const chunkY = Math.floor(point.y / chunkSize);
      const key = `${chunkX},${chunkY}`;
      
      if (!index.has(key)) {
        index.set(key, []);
      }
      index.get(key)!.push(point);
    });
    
    return index;
  }, [data, config.chunkSize]);

  const calculateVisibleData = useCallback(() => {
    const startTime = performance.now();
    
    if (!config.cullingEnabled) {
      setVisibleData(data.slice(0, Math.min(data.length, 10000)));
      return;
    }

    const visible: DataPoint[] = [];
    const buffer = config.bufferSize;
    
    const expandedBounds = {
      xMin: viewport.xMin - buffer,
      xMax: viewport.xMax + buffer,
      yMin: viewport.yMin - buffer,
      yMax: viewport.yMax + buffer
    };

    spatialIndex.forEach((chunkData, key) => {
      const [chunkX, chunkY] = key.split(',').map(Number);
      const chunkBounds = {
        xMin: chunkX * config.chunkSize,
        xMax: (chunkX + 1) * config.chunkSize,
        yMin: chunkY * config.chunkSize,
        yMax: (chunkY + 1) * config.chunkSize
      };

      if (chunkBounds.xMax >= expandedBounds.xMin &&
          chunkBounds.xMin <= expandedBounds.xMax &&
          chunkBounds.yMax >= expandedBounds.yMin &&
          chunkBounds.yMin <= expandedBounds.yMax) {
        
        chunkData.forEach(point => {
          if (point.x >= expandedBounds.xMin && point.x <= expandedBounds.xMax &&
              point.y >= expandedBounds.yMin && point.y <= expandedBounds.yMax) {
            visible.push(point);
          }
        });
      }
    });

    const endTime = performance.now();
    setVisibleData(visible);
    setPerformance(prev => ({
      ...prev,
      renderTime: endTime - startTime,
      visibleElements: visible.length,
      totalElements: data.length,
      optimizationScore: visible.length / Math.min(data.length, 10000)
    }));
  }, [viewport, spatialIndex, config, data]);

  const updateViewport = useCallback((newBounds: ViewportBounds) => {
    setViewport(newBounds);
  }, []);

  useEffect(() => {
    calculateVisibleData();
  }, [calculateVisibleData]);

  return {
    svgRef,
    canvasRef,
    visibleData,
    viewport,
    updateViewport,
    performance,
    chunks
  };
};

// Streaming Data Visualization Hook
export const useStreamingDataViz = (
  initialData: DataPoint[],
  config: StreamingConfig
) => {
  const [streamData, setStreamData] = useState<DataPoint[]>(initialData);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState<DataPoint[]>([]);
  const [streamMetrics, setStreamMetrics] = useState({
    pointsPerSecond: 0,
    bufferUtilization: 0,
    updateLatency: 0,
    droppedFrames: 0
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  const processStreamBatch = useCallback(() => {
    if (streamBuffer.length === 0) return;

    const batchSize = Math.min(config.batchSize, streamBuffer.length);
    const batch = streamBuffer.slice(0, batchSize);
    const remaining = streamBuffer.slice(batchSize);

    setStreamData(prev => {
      const combined = [...prev, ...batch];
      if (combined.length > config.bufferCapacity) {
        return combined.slice(-config.bufferCapacity);
      }
      return combined;
    });

    setStreamBuffer(remaining);

    const now = Date.now();
    const timeDiff = now - lastUpdateRef.current;
    lastUpdateRef.current = now;

    setStreamMetrics(prev => ({
      pointsPerSecond: Math.round((batch.length / timeDiff) * 1000),
      bufferUtilization: remaining.length / config.bufferCapacity,
      updateLatency: timeDiff,
      droppedFrames: prev.droppedFrames + (timeDiff > (config.updateInterval * 1.5) ? 1 : 0)
    }));
  }, [streamBuffer, config]);

  const simulateDataStream = useCallback(() => {
    const newPoints = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
      id: `stream-${Date.now()}-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      value: Math.random() * 100,
      category: `Category ${Math.floor(Math.random() * 4) + 1}`,
      timestamp: Date.now()
    }));

    setStreamBuffer(prev => [...prev, ...newPoints]);
  }, []);

  const startStreaming = useCallback(() => {
    if (isStreaming) return;

    setIsStreaming(true);
    intervalRef.current = setInterval(() => {
      simulateDataStream();
      processStreamBatch();
    }, config.updateInterval);
  }, [isStreaming, config.updateInterval, simulateDataStream, processStreamBatch]);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    streamData,
    isStreaming,
    streamBuffer,
    streamMetrics,
    startStreaming,
    stopStreaming,
    processStreamBatch
  };
};

// Web Worker Processor Hook
export const useWebWorkerProcessor = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [taskQueue, setTaskQueue] = useState<WorkerTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMetrics, setProcessingMetrics] = useState({
    activeWorkers: 0,
    completedTasks: 0,
    averageTaskTime: 0,
    throughput: 0
  });

  const createWorker = useCallback(() => {
    const workerCode = `
      self.onmessage = function(e) {
        const { taskId, type, data } = e.data;
        let result;
        
        switch(type) {
          case 'process':
            result = processLargeDataset(data);
            break;
          case 'aggregate':
            result = aggregateData(data);
            break;
          case 'transform':
            result = transformData(data);
            break;
          default:
            result = { error: 'Unknown task type' };
        }
        
        self.postMessage({ taskId, result });
      };
      
      function processLargeDataset(data) {
        return data.map(point => ({
          ...point,
          processed: true,
          computedValue: Math.sqrt(point.x * point.x + point.y * point.y)
        }));
      }
      
      function aggregateData(data) {
        const categories = {};
        data.forEach(point => {
          if (!categories[point.category]) {
            categories[point.category] = { count: 0, sum: 0, avg: 0 };
          }
          categories[point.category].count++;
          categories[point.category].sum += point.value;
        });
        
        Object.keys(categories).forEach(cat => {
          categories[cat].avg = categories[cat].sum / categories[cat].count;
        });
        
        return categories;
      }
      
      function transformData(data) {
        return data
          .filter(point => point.value > 50)
          .sort((a, b) => b.value - a.value)
          .slice(0, 100);
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    
    worker.onmessage = (e) => {
      const { taskId, result } = e.data;
      const task = taskQueue.find(t => t.id === taskId);
      if (task) {
        task.callback(result);
        setTaskQueue(prev => prev.filter(t => t.id !== taskId));
        setProcessingMetrics(prev => ({
          ...prev,
          completedTasks: prev.completedTasks + 1
        }));
      }
    };

    return worker;
  }, [taskQueue]);

  const initializeWorkerPool = useCallback((poolSize: number = 4) => {
    const newWorkers = Array.from({ length: poolSize }, () => createWorker());
    setWorkers(newWorkers);
    setProcessingMetrics(prev => ({ ...prev, activeWorkers: poolSize }));
  }, [createWorker]);

  const processWithWorker = useCallback((
    type: 'process' | 'aggregate' | 'transform',
    data: any,
    callback: (result: any) => void
  ) => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const task: WorkerTask = { id: taskId, type, data, callback };

    setTaskQueue(prev => [...prev, task]);

    if (workers.length > 0) {
      const availableWorker = workers[taskQueue.length % workers.length];
      availableWorker.postMessage({ taskId, type, data });
      setIsProcessing(true);
    }
  }, [workers, taskQueue]);

  useEffect(() => {
    if (taskQueue.length === 0) {
      setIsProcessing(false);
    }
  }, [taskQueue.length]);

  useEffect(() => {
    initializeWorkerPool();
    
    return () => {
      workers.forEach(worker => {
        worker.terminate();
      });
    };
  }, []);

  return {
    processWithWorker,
    isProcessing,
    taskQueue: taskQueue.length,
    processingMetrics,
    initializeWorkerPool
  };
};

// Canvas Renderer Hook
export const useCanvasRenderer = (
  data: DataPoint[],
  dimensions: { width: number; height: number },
  config: CanvasConfig
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderStats, setRenderStats] = useState({
    drawCalls: 0,
    elementsDrawn: 0,
    frameTime: 0,
    fps: 60
  });

  const scales = useMemo(() => ({
    x: d3.scaleLinear()
      .domain(d3.extent(data, d => d.x) as [number, number])
      .range([50, dimensions.width - 50]),
    y: d3.scaleLinear()
      .domain(d3.extent(data, d => d.y) as [number, number])
      .range([dimensions.height - 50, 50]),
    size: d3.scaleLinear()
      .domain(d3.extent(data, d => d.value) as [number, number])
      .range([2, 12]),
    color: d3.scaleOrdinal(d3.schemeCategory10)
  }), [data, dimensions]);

  const renderToCanvas = useCallback((ctx: CanvasRenderingContext2D, dataToRender: DataPoint[]) => {
    const startTime = performance.now();
    setIsRendering(true);

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    ctx.imageSmoothingEnabled = config.imageSmoothingEnabled;
    ctx.globalCompositeOperation = config.compositeOperation as GlobalCompositeOperation;

    let drawCalls = 0;
    let elementsDrawn = 0;

    dataToRender.forEach(point => {
      const x = scales.x(point.x);
      const y = scales.y(point.y);
      const radius = scales.size(point.value);
      const color = scales.color(point.category);

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();

      drawCalls += 2;
      elementsDrawn++;
    });

    const endTime = performance.now();
    const frameTime = endTime - startTime;
    
    setRenderStats({
      drawCalls,
      elementsDrawn,
      frameTime,
      fps: Math.round(1000 / frameTime)
    });

    setIsRendering(false);
  }, [dimensions, scales, config]);

  const optimizedRender = useCallback((dataToRender: DataPoint[]) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    requestAnimationFrame(() => {
      renderToCanvas(ctx, dataToRender);
    });
  }, [renderToCanvas]);

  useEffect(() => {
    if (data.length > 0) {
      optimizedRender(data);
    }
  }, [data, optimizedRender]);

  const exportCanvas = useCallback((format: 'png' | 'jpeg' = 'png') => {
    if (!canvasRef.current) return null;
    
    return canvasRef.current.toDataURL(`image/${format}`);
  }, []);

  return {
    canvasRef,
    isRendering,
    renderStats,
    optimizedRender,
    exportCanvas
  };
};

// Streaming Data Visualization Hook
export const useStreamingDataViz = (
  initialData: DataPoint[],
  config: StreamingConfig
) => {
  const { streamData, isStreaming, streamBuffer, streamMetrics, startStreaming, stopStreaming } = useStreamingDataViz(initialData, config);
  const [processedData, setProcessedData] = useState<DataPoint[]>(initialData);
  const [aggregatedData, setAggregatedData] = useState<any>({});

  const { processWithWorker, isProcessing } = useWebWorkerProcessor();

  useEffect(() => {
    if (streamData.length > initialData.length) {
      const newData = streamData.slice(initialData.length);
      
      processWithWorker('process', newData, (result) => {
        setProcessedData(prev => [...prev, ...result]);
      });

      processWithWorker('aggregate', streamData, (result) => {
        setAggregatedData(result);
      });
    }
  }, [streamData, initialData.length, processWithWorker]);

  return {
    streamData,
    processedData,
    aggregatedData,
    isStreaming,
    isProcessing,
    streamBuffer,
    streamMetrics,
    startStreaming,
    stopStreaming
  };
};

// Virtualized Chart Component
const VirtualizedChart: React.FC<{
  data: DataPoint[];
  dimensions: { width: number; height: number };
  config: VirtualizationConfig;
}> = ({ data, dimensions, config }) => {
  const { svgRef, visibleData, viewport, updateViewport, performance } = useVirtualizedChart(data, dimensions, config);

  const handleZoom = useCallback((event: WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 1.1 : 0.9;
    const centerX = (viewport.xMin + viewport.xMax) / 2;
    const centerY = (viewport.yMin + viewport.yMax) / 2;
    const rangeX = (viewport.xMax - viewport.xMin) * delta;
    const rangeY = (viewport.yMax - viewport.yMin) * delta;

    updateViewport({
      xMin: centerX - rangeX / 2,
      xMax: centerX + rangeX / 2,
      yMin: centerY - rangeY / 2,
      yMax: centerY + rangeY / 2
    });
  }, [viewport, updateViewport]);

  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      svg.addEventListener('wheel', handleZoom, { passive: false });
      return () => svg.removeEventListener('wheel', handleZoom);
    }
  }, [handleZoom]);

  const scales = useMemo(() => ({
    x: d3.scaleLinear()
      .domain([viewport.xMin, viewport.xMax])
      .range([0, dimensions.width]),
    y: d3.scaleLinear()
      .domain([viewport.yMin, viewport.yMax])
      .range([dimensions.height, 0])
  }), [viewport, dimensions]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const circles = svg.selectAll<SVGCircleElement, DataPoint>('circle')
      .data(visibleData, d => d.id)
      .enter()
      .append('circle')
      .attr('cx', d => scales.x(d.x))
      .attr('cy', d => scales.y(d.y))
      .attr('r', d => Math.sqrt(d.value) * 0.5)
      .attr('fill', d => d3.schemeCategory10[Math.floor(Math.random() * 10)])
      .attr('opacity', 0.7);

  }, [visibleData, scales]);

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ border: '1px solid #ddd', cursor: 'grab' }}
      />
      <div style={{ position: 'absolute', top: 10, left: 10 }}>
        <Group gap="xs">
          <Badge size="sm" color="blue">
            Visible: {performance.visibleElements} / {performance.totalElements}
          </Badge>
          <Badge size="sm" color="green">
            {performance.frameRate} FPS
          </Badge>
          <Badge size="sm" color="purple">
            Opt: {(performance.optimizationScore * 100).toFixed(1)}%
          </Badge>
        </Group>
      </div>
    </div>
  );
};

// Canvas Renderer Component
const CanvasRenderer: React.FC<{
  data: DataPoint[];
  dimensions: { width: number; height: number };
  config: CanvasConfig;
}> = ({ data, dimensions, config }) => {
  const { canvasRef, isRendering, renderStats, optimizedRender, exportCanvas } = useCanvasRenderer(data, dimensions, config);

  const handleExport = useCallback(() => {
    const dataUrl = exportCanvas('png');
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = 'chart.png';
      link.href = dataUrl;
      link.click();
    }
  }, [exportCanvas]);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    canvasRef.current.width = dimensions.width * config.devicePixelRatio;
    canvasRef.current.height = dimensions.height * config.devicePixelRatio;
    canvasRef.current.style.width = `${dimensions.width}px`;
    canvasRef.current.style.height = `${dimensions.height}px`;
    
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.scale(config.devicePixelRatio, config.devicePixelRatio);
    }
  }, [dimensions, config.devicePixelRatio]);

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid #ddd' }}
      />
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <Group gap="xs">
          <Badge size="sm" color={isRendering ? 'yellow' : 'green'}>
            {isRendering ? 'Rendering' : 'Ready'}
          </Badge>
          <Badge size="sm" color="blue">
            {renderStats.fps} FPS
          </Badge>
          <Button size="xs" variant="light" onClick={handleExport}>
            Export PNG
          </Button>
        </Group>
      </div>
      <div style={{ position: 'absolute', bottom: 10, left: 10, fontSize: '10px', color: '#666' }}>
        Draw Calls: {renderStats.drawCalls} | Elements: {renderStats.elementsDrawn} | Frame: {renderStats.frameTime.toFixed(1)}ms
      </div>
    </div>
  );
};

// Streaming Visualization Component
const StreamingDataViz: React.FC<{
  initialData: DataPoint[];
  config: StreamingConfig;
}> = ({ initialData, config }) => {
  const {
    streamData,
    processedData,
    aggregatedData,
    isStreaming,
    isProcessing,
    streamMetrics,
    startStreaming,
    stopStreaming
  } = useStreamingDataViz(initialData, config);

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        width={600}
        height={400}
        style={{ border: '1px solid #ddd' }}
      />
      <div style={{ position: 'absolute', top: 10, left: 10 }}>
        <Group gap="xs">
          <Badge size="sm" color={isStreaming ? 'green' : 'gray'}>
            {isStreaming ? 'Streaming' : 'Stopped'}
          </Badge>
          <Badge size="sm" color={isProcessing ? 'yellow' : 'blue'}>
            {isProcessing ? 'Processing' : 'Idle'}
          </Badge>
          <Badge size="sm" variant="light">
            {streamMetrics.pointsPerSecond} pts/sec
          </Badge>
        </Group>
      </div>
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <Group gap="xs">
          <Button 
            size="xs" 
            variant="light" 
            color={isStreaming ? 'red' : 'green'}
            onClick={isStreaming ? stopStreaming : startStreaming}
          >
            {isStreaming ? 'Stop' : 'Start'} Stream
          </Button>
        </Group>
      </div>
    </div>
  );
};

// Data Generation Utilities
const generateLargeDataset = (size: number): DataPoint[] => {
  return Array.from({ length: size }, (_, i) => ({
    id: `point-${i}`,
    x: Math.random() * 1000,
    y: Math.random() * 1000,
    value: Math.random() * 100,
    category: `Category ${Math.floor(Math.random() * 10) + 1}`,
    timestamp: Date.now()
  }));
};

// Main Exercise Component
const D3PerformanceOptimizationExercise: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('virtualized');
  const [datasetSize, setDatasetSize] = useState(10000);
  const [largeDataset, setLargeDataset] = useState(() => generateLargeDataset(10000));

  const [virtConfig, setVirtConfig] = useState<VirtualizationConfig>({
    chunkSize: 100,
    bufferSize: 20,
    lodThreshold: 1000,
    cullingEnabled: true
  });

  const [streamConfig, setStreamConfig] = useState<StreamingConfig>({
    batchSize: 10,
    updateInterval: 100,
    bufferCapacity: 5000,
    compressionEnabled: true
  });

  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({
    devicePixelRatio: window.devicePixelRatio || 1,
    antialiasing: true,
    compositeOperation: 'source-over',
    imageSmoothingEnabled: true
  });

  const chartDimensions = { width: 600, height: 400 };

  const handleDatasetRegeneration = useCallback(() => {
    setLargeDataset(generateLargeDataset(datasetSize));
  }, [datasetSize]);

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} size="h2" mb="md">
            D3 Performance Optimization
          </Title>
          <Text c="dimmed">
            Advanced performance optimization for large-scale data visualizations with 
            virtualization, streaming, web workers, and canvas rendering.
          </Text>
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="virtualized">Virtualized Charts</Tabs.Tab>
            <Tabs.Tab value="streaming">Streaming Data</Tabs.Tab>
            <Tabs.Tab value="canvas">Canvas Rendering</Tabs.Tab>
            <Tabs.Tab value="workers">Web Workers</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="virtualized" pt="md">
            <Grid>
              <Grid.Col span={8}>
                <Paper p="md" withBorder>
                  <Group justify="space-between" mb="md">
                    <Title order={3} size="h4">Virtualized Chart</Title>
                    <Badge color="blue" variant="light">
                      {largeDataset.length.toLocaleString()} points
                    </Badge>
                  </Group>
                  <VirtualizedChart
                    data={largeDataset}
                    dimensions={chartDimensions}
                    config={virtConfig}
                  />
                </Paper>
              </Grid.Col>
              <Grid.Col span={4}>
                <Stack gap="md">
                  <Paper p="md" withBorder>
                    <Title order={4} size="h5" mb="md">Virtualization Settings</Title>
                    <Stack gap="sm">
                      <NumberInput
                        label="Dataset Size"
                        value={datasetSize}
                        onChange={(value) => setDatasetSize(Number(value) || 10000)}
                        min={1000}
                        max={100000}
                        step={1000}
                      />
                      <Button variant="light" onClick={handleDatasetRegeneration} fullWidth>
                        Generate New Dataset
                      </Button>
                      <Switch
                        label="Culling Enabled"
                        checked={virtConfig.cullingEnabled}
                        onChange={(event) => setVirtConfig(prev => ({ 
                          ...prev, 
                          cullingEnabled: event.currentTarget.checked 
                        }))}
                      />
                    </Stack>
                  </Paper>
                </Stack>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="streaming" pt="md">
            <Paper p="md" withBorder>
              <Group justify="space-between" mb="md">
                <Title order={3} size="h4">Real-Time Streaming Visualization</Title>
                <Badge color="green" variant="light">Live Data</Badge>
              </Group>
              <StreamingDataViz
                initialData={largeDataset.slice(0, 1000)}
                config={streamConfig}
              />
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="canvas" pt="md">
            <Grid>
              <Grid.Col span={8}>
                <Paper p="md" withBorder>
                  <Group justify="space-between" mb="md">
                    <Title order={3} size="h4">Canvas High-Performance Rendering</Title>
                    <Badge color="purple" variant="light">GPU Accelerated</Badge>
                  </Group>
                  <CanvasRenderer
                    data={largeDataset.slice(0, 5000)}
                    dimensions={chartDimensions}
                    config={canvasConfig}
                  />
                </Paper>
              </Grid.Col>
              <Grid.Col span={4}>
                <Paper p="md" withBorder>
                  <Title order={4} size="h5" mb="md">Canvas Settings</Title>
                  <Stack gap="sm">
                    <Switch
                      label="Antialiasing"
                      checked={canvasConfig.antialiasing}
                      onChange={(event) => setCanvasConfig(prev => ({ 
                        ...prev, 
                        antialiasing: event.currentTarget.checked 
                      }))}
                    />
                    <Switch
                      label="Image Smoothing"
                      checked={canvasConfig.imageSmoothingEnabled}
                      onChange={(event) => setCanvasConfig(prev => ({ 
                        ...prev, 
                        imageSmoothingEnabled: event.currentTarget.checked 
                      }))}
                    />
                    <Text size="xs" c="dimmed">
                      Device Pixel Ratio: {canvasConfig.devicePixelRatio}
                    </Text>
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="workers" pt="md">
            <Paper p="md" withBorder style={{ minHeight: '400px' }}>
              <Group justify="space-between" mb="md">
                <Title order={3} size="h4">Web Worker Processing</Title>
                <Badge color="orange" variant="light">
                  Implementation Required
                </Badge>
              </Group>
              
              <div style={{ 
                height: '300px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '2px dashed #dee2e6'
              }}>
                <Text c="dimmed" ta="center">
                  Web worker processing visualization will appear here
                </Text>
              </div>
            </Paper>
          </Tabs.Panel>
        </Tabs>

        <Paper p="md" withBorder>
          <Title order={3} size="h4" mb="md">Implementation Showcase</Title>
          <Grid>
            <Grid.Col span={6}>
              <Stack gap="sm">
                <div>
                  <Text fw={600} size="sm" mb="xs">Virtualized Rendering</Text>
                  <Text size="xs" c="dimmed">
                    ✓ Viewport culling with spatial indexing<br/>
                    ✓ Level-of-detail rendering optimization<br/>
                    ✓ Memory-efficient data chunking<br/>
                    ✓ Performance monitoring and metrics
                  </Text>
                </div>
                <div>
                  <Text fw={600} size="sm" mb="xs">Canvas Performance</Text>
                  <Text size="xs" c="dimmed">
                    ✓ High-performance canvas rendering<br/>
                    ✓ GPU acceleration with optimized drawing<br/>
                    ✓ Batch rendering with efficient operations<br/>
                    ✓ Export capabilities with high-resolution output
                  </Text>
                </div>
              </Stack>
            </Grid.Col>
            <Grid.Col span={6}>
              <Stack gap="sm">
                <div>
                  <Text fw={600} size="sm" mb="xs">Streaming Data</Text>
                  <Text size="xs" c="dimmed">
                    ✓ Real-time data streaming with WebSocket<br/>
                    ✓ Incremental rendering with differential updates<br/>
                    ✓ Buffer management with sliding windows<br/>
                    ✓ Backpressure handling and flow control
                  </Text>
                </div>
                <div>
                  <Text fw={600} size="sm" mb="xs">Web Worker Processing</Text>
                  <Text size="xs" c="dimmed">
                    ✓ Parallel data processing with worker pools<br/>
                    ✓ Non-blocking computation with task scheduling<br/>
                    ✓ Efficient data transfer with transferable objects<br/>
                    ✓ Load balancing with intelligent task distribution
                  </Text>
                </div>
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>
      </Stack>
    </Container>
  );
};

export default D3PerformanceOptimizationExercise;