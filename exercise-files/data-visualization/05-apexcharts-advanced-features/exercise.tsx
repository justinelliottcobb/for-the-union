import React, { useRef, useEffect, useCallback, useState, useMemo, createContext, useContext } from 'react';
import { Container, Paper, Title, Group, Badge, Text, Stack, Grid, Button, Select, Switch, NumberInput, Tabs, ActionIcon } from '@mantine/core';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { IconRefresh, IconDownload, IconZoomIn, IconZoomOut, IconHome } from '@tabler/icons-react';

// Advanced ApexCharts Types
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

// TODO: Implement ApexChartsProvider component
// Requirements:
// - Create centralized chart synchronization
// - Manage shared state across multiple charts
// - Provide chart registration and coordination
// - Handle synchronized interactions and zooming
// - Include performance optimization
export const ApexChartsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // TODO: Implement chart provider with synchronization
  const contextValue = {
    syncState: {
      selectedTimeRange: null,
      activeDataPoint: null,
      zoomLevel: { x: null, y: null },
      filters: {}
    },
    setSyncState: () => {},
    registerChart: () => {},
    unregisterChart: () => {},
    synchronizeCharts: () => {}
  };

  return (
    <ApexChartsContext.Provider value={contextValue}>
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

// TODO: Implement useDrilldownChart hook
// Requirements:
// - Create hierarchical data navigation
// - Implement breadcrumb tracking and drill-up/down
// - Add smooth animations and transitions
// - Include data aggregation at each level
// - Handle state preservation and context management
export const useDrilldownChart = (
  initialData: HierarchicalData[],
  config: { maxLevels: number; animationSpeed: number }
) => {
  // TODO: Implement drilldown functionality
  const chartRef = useRef<any>(null);
  
  return {
    chartRef,
    chartOptions: {},
    chartSeries: [],
    drilldownState: {
      currentLevel: 0,
      selectedPath: [],
      breadcrumbs: [{ id: 'root', name: 'Overview', level: 0 }],
      data: initialData,
      aggregatedData: []
    },
    drillDown: () => {},
    drillUp: () => {},
    canDrillDown: () => false,
    resetToRoot: () => {}
  };
};

// TODO: Implement useRealTimeChart hook
// Requirements:
// - Create WebSocket-like streaming data simulation
// - Implement buffer management and circular buffers
// - Add performance metrics and monitoring
// - Include backpressure handling and rate limiting
// - Handle connection management and error recovery
export const useRealTimeChart = (
  initialData: { x: number; y: number }[],
  config: { maxDataPoints: number; updateInterval: number; bufferSize: number }
) => {
  // TODO: Implement real-time streaming
  const chartRef = useRef<any>(null);
  
  return {
    chartRef,
    chartOptions: {},
    chartSeries: [],
    streamData: initialData,
    streamMetrics: {
      pointsPerSecond: 0,
      bufferUtilization: 0,
      updateLatency: 0,
      droppedFrames: 0,
      connectionStatus: 'disconnected' as const
    },
    isStreaming: false,
    startStreaming: () => {},
    stopStreaming: () => {},
    clearData: () => {},
    exportData: () => initialData
  };
};

// TODO: Implement useComboChart hook
// Requirements:
// - Create multi-series chart coordination
// - Implement dual-axis support and scaling
// - Add series visibility management
// - Include synchronized interactions and tooltips
// - Handle chart type switching and morphing
export const useComboChart = (
  seriesData: { 
    name: string; 
    type: 'line' | 'column' | 'area'; 
    data: number[]; 
    yAxis: number;
    color?: string;
  }[]
) => {
  // TODO: Implement combo chart functionality
  const chartRef = useRef<any>(null);
  
  return {
    chartRef,
    chartOptions: {},
    chartSeries: [],
    selectedSeries: seriesData.map(s => s.name),
    setSelectedSeries: () => {},
    chartType: 'combo' as const,
    setChartType: () => {},
    toggleSeries: () => {}
  };
};

// TODO: Implement useSparklineGrid hook
// Requirements:
// - Create dense micro-chart visualization grid
// - Implement filtering and sorting capabilities
// - Add selection management and bulk operations
// - Include trend analysis and change detection
// - Handle responsive grid layouts and optimization
export const useSparklineGrid = (
  data: SparklineData[],
  config: { columns: number; sparklineHeight: number }
) => {
  // TODO: Implement sparkline grid functionality
  return {
    filteredAndSortedData: data,
    selectedSparklines: [],
    sortBy: 'name' as const,
    setSortBy: () => {},
    filterCategory: 'all',
    setFilterCategory: () => {},
    categories: [],
    getSparklineOptions: () => ({}),
    toggleSparklineSelection: () => {},
    clearSelection: () => {},
    selectAll: () => {},
    exportSelected: () => []
  };
};

// Data Generation Utilities
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

// Exercise Component
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
              Build advanced ApexCharts integration patterns with drilldown navigation, real-time streaming, 
              synchronized multi-chart systems, and dense sparkline grids.
            </Text>
          </div>

          <Paper p="md" withBorder>
            <Title order={3} size="h4" mb="md">Your Task</Title>
            <Text size="sm" mb="md">
              Implement advanced ApexCharts patterns including hierarchical navigation, real-time data streaming, 
              multi-series coordination, and micro-chart visualization grids.
            </Text>
            
            <Stack gap="sm">
              <Text size="sm">🎯 Implement <code>useDrilldownChart</code> with hierarchical navigation</Text>
              <Text size="sm">🎯 Create <code>useRealTimeChart</code> with streaming data and metrics</Text>
              <Text size="sm">🎯 Build <code>useComboChart</code> with multi-series coordination</Text>
              <Text size="sm">🎯 Develop <code>useSparklineGrid</code> with dense visualization patterns</Text>
            </Stack>
          </Paper>

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="drilldown">Drilldown</Tabs.Tab>
              <Tabs.Tab value="realtime">Real-Time</Tabs.Tab>
              <Tabs.Tab value="combo">Combo Charts</Tabs.Tab>
              <Tabs.Tab value="sparklines">Sparklines</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="drilldown" pt="md">
              <Paper p="md" withBorder style={{ minHeight: '400px' }}>
                <Group justify="space-between" mb="md">
                  <div>
                    <Title order={3} size="h4">Hierarchical Data Drilldown</Title>
                    <Text size="sm" c="dimmed">Navigate through data hierarchy with breadcrumb tracking</Text>
                  </div>
                  <Group gap="xs">
                    <ActionIcon variant="light" onClick={resetToRoot}>
                      <IconHome size={16} />
                    </ActionIcon>
                    <Badge color="orange" variant="light">
                      Implementation Required
                    </Badge>
                  </Group>
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
                    Drilldown chart with hierarchical navigation will appear here
                  </Text>
                </div>
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="realtime" pt="md">
              <Paper p="md" withBorder style={{ minHeight: '400px' }}>
                <Group justify="space-between" mb="md">
                  <div>
                    <Title order={3} size="h4">Real-Time Streaming Chart</Title>
                    <Text size="sm" c="dimmed">Live data streaming with performance metrics</Text>
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
                    <Badge color="orange" variant="light">
                      Implementation Required
                    </Badge>
                  </Group>
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
                    Real-time streaming chart with WebSocket simulation will appear here
                  </Text>
                </div>
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="combo" pt="md">
              <Paper p="md" withBorder style={{ minHeight: '400px' }}>
                <Group justify="space-between" mb="md">
                  <Title order={3} size="h4">Multi-Series Combo Chart</Title>
                  <Group gap="xs">
                    <Select
                      placeholder="Chart Type"
                      value={chartType}
                      onChange={setChartType}
                      data={[
                        { value: 'combo', label: 'Combo' },
                        { value: 'stacked', label: 'Stacked' },
                        { value: 'grouped', label: 'Grouped' }
                      ]}
                    />
                    <Badge color="orange" variant="light">
                      Implementation Required
                    </Badge>
                  </Group>
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
                    Multi-series combo chart with synchronized interactions will appear here
                  </Text>
                </div>
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="sparklines" pt="md">
              <Paper p="md" withBorder style={{ minHeight: '400px' }}>
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
                    <Badge color="orange" variant="light">
                      Implementation Required
                    </Badge>
                  </Group>
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
                    Dense sparkline grid with trend analysis will appear here
                  </Text>
                </div>
              </Paper>
            </Tabs.Panel>
          </Tabs>

          <Paper p="md" withBorder>
            <Title order={3} size="h4" mb="md">Implementation Status</Title>
            <Grid>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Badge color="red" variant="light" fullWidth>useDrilldownChart: Not Implemented</Badge>
                  <Badge color="red" variant="light" fullWidth>useRealTimeChart: Not Implemented</Badge>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Badge color="red" variant="light" fullWidth>useComboChart: Not Implemented</Badge>
                  <Badge color="red" variant="light" fullWidth>useSparklineGrid: Not Implemented</Badge>
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