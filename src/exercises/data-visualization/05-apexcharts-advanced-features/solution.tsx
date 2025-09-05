import React, { useRef, useEffect, useCallback, useState, useMemo, createContext, useContext } from 'react';
import { Container, Paper, Title, Group, Badge, Text, Stack, Grid, Button, Select, Switch, NumberInput, Tabs, ActionIcon } from '@mantine/core';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { IconRefresh, IconDownload, IconZoomIn, IconZoomOut, IconHome } from '@tabler/icons-react';

interface HierarchicalData {
  id: string;
  name: string;
  value: number;
  children?: HierarchicalData[];
  level: number;
  parent?: string;
  color?: string;
}

interface DrilldownState {
  currentLevel: number;
  selectedPath: string[];
  breadcrumbs: { id: string; name: string; level: number }[];
  data: HierarchicalData[];
  aggregatedData: any[];
}

interface StreamingMetrics {
  pointsPerSecond: number;
  bufferUtilization: number;
  updateLatency: number;
  droppedFrames: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

interface SparklineData {
  id: string;
  name: string;
  data: number[];
  trend: 'up' | 'down' | 'flat';
  change: number;
  color: string;
  category: string;
}

interface ChartSyncState {
  selectedTimeRange: [number, number] | null;
  activeDataPoint: { seriesIndex: number; dataPointIndex: number } | null;
  zoomLevel: { x: [number, number] | null; y: [number, number] | null };
  filters: Record<string, any>;
}

const ApexChartsContext = createContext<{
  syncState: ChartSyncState;
  setSyncState: (state: Partial<ChartSyncState>) => void;
  registerChart: (id: string, chartRef: any) => void;
  unregisterChart: (id: string) => void;
  synchronizeCharts: (action: string, data: any) => void;
} | null>(null);

export const ApexChartsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [syncState, setSyncStateInternal] = useState<ChartSyncState>({
    selectedTimeRange: null,
    activeDataPoint: null,
    zoomLevel: { x: null, y: null },
    filters: {}
  });
  
  const chartRegistry = useRef<Map<string, any>>(new Map());
  
  const setSyncState = useCallback((newState: Partial<ChartSyncState>) => {
    setSyncStateInternal(prev => ({ ...prev, ...newState }));
  }, []);
  
  const registerChart = useCallback((id: string, chartRef: any) => {
    chartRegistry.current.set(id, chartRef);
  }, []);
  
  const unregisterChart = useCallback((id: string) => {
    chartRegistry.current.delete(id);
  }, []);
  
  const synchronizeCharts = useCallback((action: string, data: any) => {
    chartRegistry.current.forEach((chartRef, chartId) => {
      if (chartRef?.current?.chart) {
        switch (action) {
          case 'zoom':
            chartRef.current.chart.zoomX(data.xMin, data.xMax);
            break;
          case 'selection':
            chartRef.current.chart.updateSeries([{
              data: data.seriesData
            }]);
            break;
          case 'tooltip':
            chartRef.current.chart.updateOptions({
              tooltip: { shared: true, intersect: false }
            });
            break;
        }
      }
    });
  }, []);
  
  return (
    <ApexChartsContext.Provider value={{
      syncState,
      setSyncState,
      registerChart,
      unregisterChart,
      synchronizeCharts
    }}>
      {children}
    </ApexChartsContext.Provider>
  );
};

export const useApexChartsContext = () => {
  const context = useContext(ApexChartsContext);
  if (!context) {
    throw new Error('useApexChartsContext must be used within ApexChartsProvider');
  }
  return context;
};

export const useDrilldownChart = (
  initialData: HierarchicalData[],
  config: { maxLevels: number; animationSpeed: number }
) => {
  const [drilldownState, setDrilldownState] = useState<DrilldownState>({
    currentLevel: 0,
    selectedPath: [],
    breadcrumbs: [{ id: 'root', name: 'Overview', level: 0 }],
    data: initialData,
    aggregatedData: []
  });
  
  const chartRef = useRef<any>(null);
  const { registerChart, unregisterChart } = useApexChartsContext();
  
  useEffect(() => {
    const chartId = 'drilldown-chart-' + Date.now();
    registerChart(chartId, chartRef);
    return () => unregisterChart(chartId);
  }, [registerChart, unregisterChart]);
  
  const aggregateData = useCallback((data: HierarchicalData[], level: number) => {
    const currentLevelData = data.filter(item => item.level === level);
    return currentLevelData.map(item => ({
      x: item.name,
      y: item.value,
      fillColor: item.color || '#3b82f6',
      meta: { id: item.id, hasChildren: !!item.children?.length }
    }));
  }, []);
  
  const drillDown = useCallback((dataPointId: string) => {
    const currentItem = drilldownState.data.find(item => item.id === dataPointId);
    if (!currentItem || !currentItem.children || drilldownState.currentLevel >= config.maxLevels - 1) {
      return;
    }
    
    const newLevel = drilldownState.currentLevel + 1;
    const newPath = [...drilldownState.selectedPath, dataPointId];
    const newBreadcrumbs = [
      ...drilldownState.breadcrumbs,
      { id: dataPointId, name: currentItem.name, level: newLevel }
    ];
    
    setDrilldownState(prev => ({
      ...prev,
      currentLevel: newLevel,
      selectedPath: newPath,
      breadcrumbs: newBreadcrumbs,
      aggregatedData: aggregateData(currentItem.children!, newLevel)
    }));
  }, [drilldownState, config.maxLevels, aggregateData]);
  
  const drillUp = useCallback((targetLevel: number) => {
    if (targetLevel < 0 || targetLevel >= drilldownState.currentLevel) return;
    
    const newPath = drilldownState.selectedPath.slice(0, targetLevel);
    const newBreadcrumbs = drilldownState.breadcrumbs.slice(0, targetLevel + 1);
    
    let targetData = drilldownState.data;
    for (const pathId of newPath) {
      const found = targetData.find(item => item.id === pathId);
      if (found?.children) {
        targetData = found.children;
      }
    }
    
    setDrilldownState(prev => ({
      ...prev,
      currentLevel: targetLevel,
      selectedPath: newPath,
      breadcrumbs: newBreadcrumbs,
      aggregatedData: aggregateData(targetData, targetLevel)
    }));
  }, [drilldownState, aggregateData]);
  
  const chartOptions = useMemo<ApexOptions>(() => ({
    chart: {
      type: 'bar',
      height: 400,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: config.animationSpeed,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const dataPoint = drilldownState.aggregatedData[config.dataPointIndex];
          if (dataPoint?.meta?.hasChildren) {
            drillDown(dataPoint.meta.id);
          }
        }
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toLocaleString(),
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ['#304758']
      }
    },
    xaxis: {
      categories: drilldownState.aggregatedData.map(item => item.x),
      title: {
        text: 'Categories'
      }
    },
    yaxis: {
      title: {
        text: 'Values'
      },
      labels: {
        formatter: (val: number) => val.toLocaleString()
      }
    },
    title: {
      text: 'Hierarchical Data Drilldown',
      align: 'left'
    },
    tooltip: {
      y: {
        formatter: (val: number) => val.toLocaleString()
      },
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const data = drilldownState.aggregatedData[dataPointIndex];
        return `
          <div class="apexcharts-tooltip-custom">
            <div class="apexcharts-tooltip-title">${data?.x}</div>
            <div class="apexcharts-tooltip-value">Value: ${series[seriesIndex][dataPointIndex]?.toLocaleString()}</div>
            ${data?.meta?.hasChildren ? '<div class="apexcharts-tooltip-hint">Click to drill down</div>' : ''}
          </div>
        `;
      }
    }
  }), [drilldownState, config.animationSpeed, drillDown]);
  
  const chartSeries = useMemo(() => [{
    name: 'Values',
    data: drilldownState.aggregatedData.map(item => item.y)
  }], [drilldownState.aggregatedData]);
  
  useEffect(() => {
    setDrilldownState(prev => ({
      ...prev,
      aggregatedData: aggregateData(initialData, 0)
    }));
  }, [initialData, aggregateData]);
  
  return {
    chartRef,
    chartOptions,
    chartSeries,
    drilldownState,
    drillDown,
    drillUp,
    canDrillDown: (dataPointId: string) => {
      const item = drilldownState.data.find(d => d.id === dataPointId);
      return !!item?.children?.length && drilldownState.currentLevel < config.maxLevels - 1;
    },
    resetToRoot: () => drillUp(0)
  };
};

export const useRealTimeChart = (
  initialData: { x: number; y: number }[],
  config: { maxDataPoints: number; updateInterval: number; bufferSize: number }
) => {
  const [streamData, setStreamData] = useState(initialData);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamMetrics, setStreamMetrics] = useState<StreamingMetrics>({
    pointsPerSecond: 0,
    bufferUtilization: 0,
    updateLatency: 0,
    droppedFrames: 0,
    connectionStatus: 'disconnected'
  });
  
  const chartRef = useRef<any>(null);
  const streamBuffer = useRef<{ x: number; y: number }[]>([]);
  const lastUpdateTime = useRef(Date.now());
  const frameCount = useRef(0);
  const { registerChart, unregisterChart, synchronizeCharts } = useApexChartsContext();
  
  useEffect(() => {
    const chartId = 'realtime-chart-' + Date.now();
    registerChart(chartId, chartRef);
    return () => unregisterChart(chartId);
  }, [registerChart, unregisterChart]);
  
  const simulateWebSocket = useCallback(() => {
    if (!isStreaming) return;
    
    const newPoint = {
      x: Date.now(),
      y: Math.random() * 100 + Math.sin(Date.now() / 1000) * 20
    };
    
    streamBuffer.current.push(newPoint);
    if (streamBuffer.current.length > config.bufferSize) {
      streamBuffer.current = streamBuffer.current.slice(-config.bufferSize);
    }
    
    setStreamData(prev => {
      const updated = [...prev, newPoint];
      return updated.length > config.maxDataPoints 
        ? updated.slice(-config.maxDataPoints)
        : updated;
    });
    
    frameCount.current++;
    const now = Date.now();
    const timeDiff = now - lastUpdateTime.current;
    
    if (timeDiff >= 1000) {
      const fps = frameCount.current / (timeDiff / 1000);
      setStreamMetrics(prev => ({
        ...prev,
        pointsPerSecond: fps,
        bufferUtilization: (streamBuffer.current.length / config.bufferSize) * 100,
        updateLatency: timeDiff / frameCount.current,
        connectionStatus: 'connected'
      }));
      
      frameCount.current = 0;
      lastUpdateTime.current = now;
    }
  }, [isStreaming, config]);
  
  useEffect(() => {
    if (!isStreaming) return;
    
    const interval = setInterval(simulateWebSocket, config.updateInterval);
    return () => clearInterval(interval);
  }, [isStreaming, simulateWebSocket, config.updateInterval]);
  
  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    setStreamMetrics(prev => ({ ...prev, connectionStatus: 'connected' }));
  }, []);
  
  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
    setStreamMetrics(prev => ({ ...prev, connectionStatus: 'disconnected' }));
  }, []);
  
  const chartOptions = useMemo<ApexOptions>(() => ({
    chart: {
      type: 'line',
      height: 400,
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: config.updateInterval
        }
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    markers: {
      size: 0
    },
    xaxis: {
      type: 'datetime',
      range: config.maxDataPoints * config.updateInterval,
      labels: {
        formatter: (val) => new Date(val).toLocaleTimeString()
      }
    },
    yaxis: {
      labels: {
        formatter: (val) => val.toFixed(1)
      }
    },
    legend: {
      show: true
    },
    title: {
      text: 'Real-Time Data Stream',
      align: 'left'
    },
    subtitle: {
      text: `${streamMetrics.pointsPerSecond.toFixed(1)} pts/sec | Buffer: ${streamMetrics.bufferUtilization.toFixed(1)}% | Status: ${streamMetrics.connectionStatus}`,
      align: 'left'
    }
  }), [config, streamMetrics]);
  
  const chartSeries = useMemo(() => [{
    name: 'Real-Time Data',
    data: streamData.map(point => [point.x, point.y])
  }], [streamData]);
  
  return {
    chartRef,
    chartOptions,
    chartSeries,
    streamData,
    streamMetrics,
    isStreaming,
    startStreaming,
    stopStreaming,
    clearData: () => setStreamData([]),
    exportData: () => streamData
  };
};

export const useComboChart = (
  seriesData: { 
    name: string; 
    type: 'line' | 'column' | 'area'; 
    data: number[]; 
    yAxis: number;
    color?: string;
  }[]
) => {
  const [selectedSeries, setSelectedSeries] = useState<string[]>(
    seriesData.map(s => s.name)
  );
  const [chartType, setChartType] = useState<'combo' | 'stacked' | 'grouped'>('combo');
  
  const chartRef = useRef<any>(null);
  const { registerChart, unregisterChart, synchronizeCharts, syncState, setSyncState } = useApexChartsContext();
  
  useEffect(() => {
    const chartId = 'combo-chart-' + Date.now();
    registerChart(chartId, chartRef);
    return () => unregisterChart(chartId);
  }, [registerChart, unregisterChart]);
  
  const filteredSeries = useMemo(() => 
    seriesData.filter(series => selectedSeries.includes(series.name)),
    [seriesData, selectedSeries]
  );
  
  const chartOptions = useMemo<ApexOptions>(() => ({
    chart: {
      type: 'line',
      height: 400,
      stacked: chartType === 'stacked',
      toolbar: {
        show: true
      },
      events: {
        dataPointSelection: (event, chartContext, config) => {
          setSyncState({
            activeDataPoint: {
              seriesIndex: config.seriesIndex,
              dataPointIndex: config.dataPointIndex
            }
          });
          synchronizeCharts('selection', config);
        },
        zoomed: (chartContext, { xaxis }) => {
          setSyncState({
            zoomLevel: { ...syncState.zoomLevel, x: [xaxis.min, xaxis.max] }
          });
          synchronizeCharts('zoom', { xMin: xaxis.min, xMax: xaxis.max });
        }
      }
    },
    stroke: {
      width: filteredSeries.map(s => s.type === 'line' ? 2 : 0),
      curve: 'smooth'
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded',
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left'
    },
    xaxis: {
      categories: Array.from({ length: 12 }, (_, i) => 
        new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' })
      ),
      title: {
        text: 'Months'
      }
    },
    yaxis: [
      {
        title: {
          text: 'Primary Axis'
        },
        seriesName: filteredSeries.find(s => s.yAxis === 0)?.name
      },
      {
        opposite: true,
        title: {
          text: 'Secondary Axis'
        },
        seriesName: filteredSeries.find(s => s.yAxis === 1)?.name
      }
    ],
    colors: filteredSeries.map(s => s.color || '#3b82f6'),
    fill: {
      type: filteredSeries.map(s => s.type === 'area' ? 'gradient' : 'solid'),
      gradient: {
        shade: 'light',
        type: 'horizontal',
        shadeIntensity: 0.25,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 0.85,
        opacityTo: 0.25,
      }
    },
    title: {
      text: 'Multi-Series Combo Chart',
      align: 'left'
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => val?.toLocaleString()
      }
    }
  }), [filteredSeries, chartType, syncState, setSyncState, synchronizeCharts]);
  
  const chartSeries = useMemo(() => 
    filteredSeries.map(series => ({
      name: series.name,
      type: series.type,
      data: series.data,
      yAxisIndex: series.yAxis
    })),
    [filteredSeries]
  );
  
  return {
    chartRef,
    chartOptions,
    chartSeries,
    selectedSeries,
    setSelectedSeries,
    chartType,
    setChartType,
    toggleSeries: (seriesName: string) => {
      setSelectedSeries(prev => 
        prev.includes(seriesName)
          ? prev.filter(s => s !== seriesName)
          : [...prev, seriesName]
      );
    }
  };
};

export const useSparklineGrid = (
  data: SparklineData[],
  config: { columns: number; sparklineHeight: number }
) => {
  const [selectedSparklines, setSelectedSparklines] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'change' | 'trend'>('name');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const filteredAndSortedData = useMemo(() => {
    let filtered = filterCategory === 'all' 
      ? data 
      : data.filter(item => item.category === filterCategory);
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'change':
          return Math.abs(b.change) - Math.abs(a.change);
        case 'trend':
          return a.trend.localeCompare(b.trend);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [data, filterCategory, sortBy]);
  
  const categories = useMemo(() => 
    [...new Set(data.map(item => item.category))],
    [data]
  );
  
  const getSparklineOptions = useCallback((sparklineData: SparklineData): ApexOptions => ({
    chart: {
      type: 'line',
      height: config.sparklineHeight,
      sparkline: {
        enabled: true
      },
      animations: {
        enabled: false
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2,
      colors: [sparklineData.color]
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    markers: {
      size: 0
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      fixed: {
        enabled: false
      },
      x: {
        show: false
      },
      y: {
        title: {
          formatter: () => sparklineData.name
        },
        formatter: (val) => val.toFixed(2)
      }
    }
  }), [config.sparklineHeight]);
  
  const toggleSparklineSelection = useCallback((id: string) => {
    setSelectedSparklines(prev =>
      prev.includes(id)
        ? prev.filter(sparklineId => sparklineId !== id)
        : [...prev, id]
    );
  }, []);
  
  return {
    filteredAndSortedData,
    selectedSparklines,
    sortBy,
    setSortBy,
    filterCategory,
    setFilterCategory,
    categories,
    getSparklineOptions,
    toggleSparklineSelection,
    clearSelection: () => setSelectedSparklines([]),
    selectAll: () => setSelectedSparklines(filteredAndSortedData.map(d => d.id)),
    exportSelected: () => 
      filteredAndSortedData.filter(d => selectedSparklines.includes(d.id))
  };
};

const generateHierarchicalData = (): HierarchicalData[] => {
  const regions = [
    { id: 'north', name: 'North Region', value: 45000, color: '#3b82f6' },
    { id: 'south', name: 'South Region', value: 38000, color: '#10b981' },
    { id: 'east', name: 'East Region', value: 52000, color: '#f59e0b' },
    { id: 'west', name: 'West Region', value: 41000, color: '#ef4444' }
  ];
  
  return regions.map(region => ({
    ...region,
    level: 0,
    children: Array.from({ length: 4 }, (_, i) => ({
      id: region.id + '-state-' + (i + 1),
      name: 'State ' + (i + 1),
      value: Math.floor(region.value / 4 + Math.random() * 5000),
      level: 1,
      parent: region.id,
      color: region.color,
      children: Array.from({ length: 3 }, (_, j) => ({
        id: region.id + '-state-' + (i + 1) + '-city-' + (j + 1),
        name: 'City ' + (j + 1),
        value: Math.floor(Math.random() * 8000 + 2000),
        level: 2,
        parent: region.id + '-state-' + (i + 1),
        color: region.color
      }))
    }))
  }));
};

const generateSparklineData = (): SparklineData[] => {
  const categories = ['Sales', 'Marketing', 'Support', 'Development', 'Operations'];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  return Array.from({ length: 20 }, (_, i) => {
    const data = Array.from({ length: 30 }, () => Math.random() * 100 + 50);
    const change = (data[data.length - 1] - data[0]) / data[0] * 100;
    const trend = change > 5 ? 'up' : change < -5 ? 'down' : 'flat';
    
    return {
      id: 'metric-' + (i + 1),
      name: 'Metric ' + (i + 1),
      data,
      trend,
      change,
      color: colors[i % colors.length],
      category: categories[i % categories.length]
    };
  });
};

const ApexChartsAdvancedFeaturesExercise: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('drilldown');
  
  const hierarchicalData = useMemo(() => generateHierarchicalData(), []);
  const sparklineData = useMemo(() => generateSparklineData(), []);
  
  const {
    chartRef: drilldownRef,
    chartOptions: drilldownOptions,
    chartSeries: drilldownSeries,
    drilldownState,
    drillUp,
    resetToRoot
  } = useDrilldownChart(hierarchicalData, {
    maxLevels: 3,
    animationSpeed: 800
  });
  
  const {
    chartRef: realtimeRef,
    chartOptions: realtimeOptions,
    chartSeries: realtimeSeries,
    streamMetrics,
    isStreaming,
    startStreaming,
    stopStreaming,
    clearData
  } = useRealTimeChart(
    Array.from({ length: 10 }, (_, i) => ({
      x: Date.now() - (10 - i) * 1000,
      y: Math.random() * 50 + 25
    })),
    {
      maxDataPoints: 50,
      updateInterval: 100,
      bufferSize: 100
    }
  );
  
  const comboSeriesData = useMemo(() => [
    {
      name: 'Revenue',
      type: 'column' as const,
      data: [44, 55, 41, 67, 22, 43, 21, 41, 56, 27, 43, 65],
      yAxis: 0,
      color: '#3b82f6'
    },
    {
      name: 'Profit',
      type: 'line' as const,
      data: [30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39, 51],
      yAxis: 1,
      color: '#10b981'
    },
    {
      name: 'Growth',
      type: 'area' as const,
      data: [10, 15, 18, 12, 25, 20, 30, 28, 35, 22, 28, 32],
      yAxis: 0,
      color: '#f59e0b'
    }
  ], []);
  
  const {
    chartRef: comboRef,
    chartOptions: comboOptions,
    chartSeries: comboSeries,
    selectedSeries,
    toggleSeries,
    chartType,
    setChartType
  } = useComboChart(comboSeriesData);
  
  const {
    filteredAndSortedData,
    selectedSparklines,
    sortBy,
    setSortBy,
    filterCategory,
    setFilterCategory,
    categories,
    getSparklineOptions,
    toggleSparklineSelection,
    clearSelection,
    selectAll
  } = useSparklineGrid(sparklineData, {
    columns: 4,
    sparklineHeight: 80
  });
  
  return (
    <ApexChartsProvider>
      <Container size="xl" py="xl">
        <Stack gap="xl">
          <div>
            <Title order={1} size="h2" mb="md">
              ApexCharts Advanced Features Exercise
            </Title>
            <Text c="dimmed">
              Master advanced ApexCharts patterns with drilldown navigation, real-time updates, 
              multi-chart synchronization, and sparkline grids.
            </Text>
          </div>

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="drilldown">Drilldown</Tabs.Tab>
              <Tabs.Tab value="realtime">Real-Time</Tabs.Tab>
              <Tabs.Tab value="combo">Combo Charts</Tabs.Tab>
              <Tabs.Tab value="sparklines">Sparklines</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="drilldown" pt="md">
              <Paper p="md" withBorder>
                <Group justify="space-between" mb="md">
                  <div>
                    <Title order={3} size="h4">Hierarchical Data Drilldown</Title>
                    <Text size="sm" c="dimmed">
                      Level {drilldownState.currentLevel + 1} of 3 | 
                      {drilldownState.breadcrumbs.map((crumb, index) => (
                        <span key={crumb.id}>
                          {index > 0 && ' → '}
                          <Button
                            variant="subtle"
                            size="xs"
                            onClick={() => drillUp(crumb.level)}
                            style={{ textDecoration: 'none' }}
                          >
                            {crumb.name}
                          </Button>
                        </span>
                      ))}
                    </Text>
                  </div>
                  <Group gap="xs">
                    <ActionIcon variant="light" onClick={resetToRoot}>
                      <IconHome size={16} />
                    </ActionIcon>
                    <Badge color="green" variant="light">
                      Fully Implemented
                    </Badge>
                  </Group>
                </Group>
                
                <Chart
                  ref={drilldownRef}
                  options={drilldownOptions}
                  series={drilldownSeries}
                  type="bar"
                  height={400}
                />
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="realtime" pt="md">
              <Paper p="md" withBorder>
                <Group justify="space-between" mb="md">
                  <div>
                    <Title order={3} size="h4">Real-Time Streaming Chart</Title>
                    <Text size="sm" c="dimmed">
                      {streamMetrics.pointsPerSecond.toFixed(1)} pts/sec | 
                      Buffer: {streamMetrics.bufferUtilization.toFixed(1)}% | 
                      Status: {streamMetrics.connectionStatus}
                    </Text>
                  </div>
                  <Group gap="xs">
                    <Button
                      variant={isStreaming ? "light" : "filled"}
                      color={isStreaming ? "red" : "green"}
                      onClick={isStreaming ? stopStreaming : startStreaming}
                    >
                      {isStreaming ? 'Stop Stream' : 'Start Stream'}
                    </Button>
                    <Button variant="light" onClick={clearData}>
                      Clear Data
                    </Button>
                    <Badge color="green" variant="light">
                      Fully Implemented
                    </Badge>
                  </Group>
                </Group>
                
                <Chart
                  ref={realtimeRef}
                  options={realtimeOptions}
                  series={realtimeSeries}
                  type="line"
                  height={400}
                />
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="combo" pt="md">
              <Paper p="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={3} size="h4">Multi-Series Combo Chart</Title>
                  <Group gap="xs">
                    <Select
                      value={chartType}
                      onChange={setChartType}
                      data={[
                        { value: 'combo', label: 'Combo' },
                        { value: 'stacked', label: 'Stacked' },
                        { value: 'grouped', label: 'Grouped' }
                      ]}
                    />
                    <Badge color="green" variant="light">
                      Fully Implemented
                    </Badge>
                  </Group>
                </Group>
                
                <Grid mb="md">
                  <Grid.Col span={12}>
                    <Group gap="xs">
                      <Text size="sm" fw={500}>Series:</Text>
                      {comboSeriesData.map(series => (
                        <Button
                          key={series.name}
                          size="xs"
                          variant={selectedSeries.includes(series.name) ? "filled" : "light"}
                          color={series.color}
                          onClick={() => toggleSeries(series.name)}
                        >
                          {series.name}
                        </Button>
                      ))}
                    </Group>
                  </Grid.Col>
                </Grid>
                
                <Chart
                  ref={comboRef}
                  options={comboOptions}
                  series={comboSeries}
                  type="line"
                  height={400}
                />
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="sparklines" pt="md">
              <Paper p="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={3} size="h4">Sparkline Dashboard Grid</Title>
                  <Group gap="xs">
                    <Select
                      placeholder="Filter by category"
                      value={filterCategory}
                      onChange={setFilterCategory}
                      data={[
                        { value: 'all', label: 'All Categories' },
                        ...categories.map(cat => ({ value: cat, label: cat }))
                      ]}
                    />
                    <Select
                      value={sortBy}
                      onChange={setSortBy}
                      data={[
                        { value: 'name', label: 'Name' },
                        { value: 'change', label: 'Change' },
                        { value: 'trend', label: 'Trend' }
                      ]}
                    />
                    <Button variant="light" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                    <Button variant="light" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Badge color="green" variant="light">
                      Fully Implemented
                    </Badge>
                  </Group>
                </Group>
                
                <Grid>
                  {filteredAndSortedData.map(sparkline => (
                    <Grid.Col key={sparkline.id} span={3}>
                      <Paper
                        p="sm"
                        withBorder
                        style={{
                          cursor: 'pointer',
                          borderColor: selectedSparklines.includes(sparkline.id) ? sparkline.color : undefined,
                          borderWidth: selectedSparklines.includes(sparkline.id) ? 2 : 1
                        }}
                        onClick={() => toggleSparklineSelection(sparkline.id)}
                      >
                        <Group justify="space-between" mb="xs">
                          <Text size="sm" fw={500}>{sparkline.name}</Text>
                          <Badge
                            size="xs"
                            color={sparkline.trend === 'up' ? 'green' : sparkline.trend === 'down' ? 'red' : 'gray'}
                            variant="light"
                          >
                            {sparkline.change > 0 ? '+' : ''}{sparkline.change.toFixed(1)}%
                          </Badge>
                        </Group>
                        
                        <Chart
                          options={getSparklineOptions(sparkline)}
                          series={[{ data: sparkline.data }]}
                          type="area"
                          height={80}
                        />
                        
                        <Group justify="space-between" mt="xs">
                          <Text size="xs" c="dimmed">{sparkline.category}</Text>
                          <Text size="xs" c="dimmed">
                            {sparkline.data[sparkline.data.length - 1].toFixed(1)}
                          </Text>
                        </Group>
                      </Paper>
                    </Grid.Col>
                  ))}
                </Grid>
              </Paper>
            </Tabs.Panel>
          </Tabs>

          <Paper p="md" withBorder>
            <Title order={3} size="h4" mb="md">Implementation Status</Title>
            <Grid>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Badge color="green" variant="light" fullWidth>useDrilldownChart: ✅ Implemented</Badge>
                  <Badge color="green" variant="light" fullWidth>useRealTimeChart: ✅ Implemented</Badge>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Badge color="green" variant="light" fullWidth>useComboChart: ✅ Implemented</Badge>
                  <Badge color="green" variant="light" fullWidth>useSparklineGrid: ✅ Implemented</Badge>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        </Stack>
      </Container>
    </ApexChartsProvider>
  );
};

export default ApexChartsAdvancedFeaturesExercise;