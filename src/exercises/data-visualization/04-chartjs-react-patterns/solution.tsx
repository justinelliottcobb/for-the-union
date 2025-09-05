import React, { useRef, useEffect, useCallback, useState, useMemo, createContext, useContext } from 'react';
import { Container, Paper, Title, Group, Badge, Text, Stack, Grid, Button, Select, Switch, ColorPicker, Tabs } from '@mantine/core';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Chart, Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import type { ChartOptions, ChartData, Plugin, ChartType } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

// Advanced Chart.js React Integration Types
interface ChartConfiguration {
  type: ChartType;
  responsive: boolean;
  maintainAspectRatio: boolean;
  animation: AnimationConfiguration;
  interaction: InteractionConfiguration;
  plugins: PluginConfiguration;
  theme: ThemeConfiguration;
}

interface AnimationConfiguration {
  duration: number;
  easing: 'linear' | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad';
  delay: number;
  loop: boolean;
  onComplete?: () => void;
  onProgress?: (animation: any) => void;
}

interface InteractionConfiguration {
  mode: 'nearest' | 'point' | 'index' | 'dataset' | 'x' | 'y';
  intersect: boolean;
  includeInvisible: boolean;
  axis?: 'x' | 'y' | 'xy';
}

interface PluginConfiguration {
  legend: LegendConfiguration;
  tooltip: TooltipConfiguration;
  title: TitleConfiguration;
  customPlugins: CustomPlugin[];
}

interface CustomPlugin extends Plugin {
  id: string;
  configuration?: any;
  enabled: boolean;
}

interface ThemeConfiguration {
  colorScheme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: number;
}

interface LegendConfiguration {
  display: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  labels: LegendLabelConfiguration;
}

interface LegendLabelConfiguration {
  usePointStyle: boolean;
  color: string;
  font: FontConfiguration;
  padding: number;
  filter?: (item: any) => boolean;
}

interface TooltipConfiguration {
  enabled: boolean;
  mode: 'nearest' | 'point' | 'index' | 'dataset';
  position: 'average' | 'nearest';
  backgroundColor: string;
  titleColor: string;
  bodyColor: string;
  borderColor: string;
  borderWidth: number;
  callbacks: TooltipCallbacks;
}

interface TooltipCallbacks {
  title?: (tooltipItems: any[]) => string | string[];
  label?: (tooltipItem: any) => string;
  footer?: (tooltipItems: any[]) => string | string[];
  afterLabel?: (tooltipItem: any) => string | string[];
}

interface TitleConfiguration {
  display: boolean;
  text: string | string[];
  position: 'top' | 'bottom';
  font: FontConfiguration;
  color: string;
  padding: number;
}

interface FontConfiguration {
  family: string;
  size: number;
  weight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  style: 'normal' | 'italic' | 'oblique';
}

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  tension?: number;
  fill?: boolean | string;
  pointRadius?: number;
  pointHoverRadius?: number;
}

interface MultiChartLayout {
  charts: ChartConfiguration[];
  layout: LayoutConfiguration;
  synchronization: SynchronizationConfiguration;
  coordination: CoordinationConfiguration;
}

interface LayoutConfiguration {
  columns: number;
  rows: number;
  spacing: number;
  responsive: boolean;
  breakpoints: LayoutBreakpoint[];
}

interface LayoutBreakpoint {
  width: number;
  columns: number;
  spacing: number;
}

interface SynchronizationConfiguration {
  zoom: boolean;
  pan: boolean;
  selection: boolean;
  hover: boolean;
  timeRange: boolean;
}

interface CoordinationConfiguration {
  sharedData: boolean;
  linkedInteractions: boolean;
  unifiedTheme: boolean;
  synchronizedAnimations: boolean;
}

// Chart Provider Context
interface ChartContextValue {
  theme: ThemeConfiguration;
  setTheme: (theme: ThemeConfiguration) => void;
  plugins: CustomPlugin[];
  registerPlugin: (plugin: CustomPlugin) => void;
  unregisterPlugin: (pluginId: string) => void;
  globalOptions: ChartOptions;
  updateGlobalOptions: (options: Partial<ChartOptions>) => void;
}

const ChartContext = createContext<ChartContextValue | null>(null);

// Chart Provider Implementation
export const ChartProvider: React.FC<{
  children: React.ReactNode;
  initialTheme?: ThemeConfiguration;
  initialPlugins?: CustomPlugin[];
}> = ({ children, initialTheme, initialPlugins = [] }) => {
  const [theme, setTheme] = useState<ThemeConfiguration>(initialTheme || {
    colorScheme: 'light',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, sans-serif',
    fontSize: 12
  });

  const [plugins, setPlugins] = useState<CustomPlugin[]>(initialPlugins);
  const [globalOptions, setGlobalOptions] = useState<ChartOptions>({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'X Axis'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Y Axis'
        }
      }
    }
  });

  const registerPlugin = useCallback((plugin: CustomPlugin) => {
    ChartJS.register(plugin);
    setPlugins(prev => [...prev.filter(p => p.id !== plugin.id), plugin]);
  }, []);

  const unregisterPlugin = useCallback((pluginId: string) => {
    ChartJS.unregister(plugins.find(p => p.id === pluginId));
    setPlugins(prev => prev.filter(p => p.id !== pluginId));
  }, [plugins]);

  const updateGlobalOptions = useCallback((options: Partial<ChartOptions>) => {
    setGlobalOptions(prev => ({ ...prev, ...options }));
  }, []);

  const contextValue: ChartContextValue = {
    theme,
    setTheme,
    plugins,
    registerPlugin,
    unregisterPlugin,
    globalOptions,
    updateGlobalOptions
  };

  return (
    <ChartContext.Provider value={contextValue}>
      {children}
    </ChartContext.Provider>
  );
};

// Custom Hook for Chart Context
const useChartContext = () => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error('useChartContext must be used within a ChartProvider');
  }
  return context;
};

// Responsive Chart Hook
export const useResponsiveChart = (
  data: ChartData,
  initialOptions: ChartOptions = {},
  chartType: ChartType = 'line'
) => {
  const chartRef = useRef<ChartJS | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const { theme, globalOptions } = useChartContext();

  const mergedOptions = useMemo((): ChartOptions => {
    return {
      ...globalOptions,
      ...initialOptions,
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        ...globalOptions.plugins,
        ...initialOptions.plugins,
        tooltip: {
          backgroundColor: theme.backgroundColor,
          titleColor: theme.primaryColor,
          bodyColor: theme.secondaryColor,
          borderColor: theme.primaryColor,
          borderWidth: 1,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            title: (tooltipItems) => {
              return tooltipItems[0]?.label || '';
            },
            label: (tooltipItem) => {
              return `${tooltipItem.dataset.label}: ${tooltipItem.parsed.y}`;
            },
            footer: (tooltipItems) => {
              const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
              return `Total: ${total.toFixed(2)}`;
            }
          }
        },
        legend: {
          position: 'top',
          labels: {
            font: {
              family: theme.fontFamily,
              size: theme.fontSize
            },
            color: theme.secondaryColor,
            usePointStyle: true,
            padding: 20
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: theme.colorScheme === 'dark' ? '#374151' : '#e5e7eb'
          },
          ticks: {
            color: theme.secondaryColor,
            font: {
              family: theme.fontFamily,
              size: theme.fontSize - 1
            }
          }
        },
        y: {
          grid: {
            color: theme.colorScheme === 'dark' ? '#374151' : '#e5e7eb'
          },
          ticks: {
            color: theme.secondaryColor,
            font: {
              family: theme.fontFamily,
              size: theme.fontSize - 1
            }
          }
        }
      },
      animation: {
        duration: 750,
        easing: 'easeInOutQuart',
        onComplete: () => setIsLoading(false),
        onProgress: () => setIsLoading(true)
      }
    };
  }, [theme, globalOptions, initialOptions]);

  const updateChart = useCallback((newData: ChartData, newOptions?: ChartOptions) => {
    if (!chartRef.current) return;

    setIsLoading(true);
    
    chartRef.current.data = newData;
    if (newOptions) {
      chartRef.current.options = { ...mergedOptions, ...newOptions };
    }
    
    chartRef.current.update('active');
  }, [mergedOptions]);

  const resizeChart = useCallback(() => {
    if (!chartRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newSize = { width: containerRect.width, height: containerRect.height };
    
    if (newSize.width !== chartSize.width || newSize.height !== chartSize.height) {
      setChartSize(newSize);
      chartRef.current.resize();
    }
  }, [chartSize]);

  const exportChart = useCallback((format: 'png' | 'jpeg' = 'png', quality: number = 1.0) => {
    if (!chartRef.current) return null;
    
    return chartRef.current.toBase64Image(`image/${format}`, quality);
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      resizeChart();
    });

    if (canvasRef.current?.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [resizeChart]);

  return {
    chartRef,
    canvasRef,
    isLoading,
    chartSize,
    mergedOptions,
    updateChart,
    exportChart,
    resizeChart
  };
};

// Interactive Chart Hook
export const useInteractiveChart = (
  data: ChartData,
  options: ChartOptions = {},
  chartType: ChartType = 'line'
) => {
  const { chartRef, canvasRef, mergedOptions, updateChart } = useResponsiveChart(data, options, chartType);
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any>(null);
  const [interactionMode, setInteractionMode] = useState<'hover' | 'click' | 'both'>('both');

  const interactiveOptions = useMemo((): ChartOptions => {
    return {
      ...mergedOptions,
      onHover: (event, elements) => {
        if (interactionMode === 'click') return;
        
        if (elements.length > 0) {
          const element = elements[0];
          const datasetIndex = element.datasetIndex;
          const index = element.index;
          const value = data.datasets[datasetIndex].data[index];
          const label = data.labels?.[index];
          
          setHoveredDataPoint({
            datasetIndex,
            index,
            value,
            label,
            dataset: data.datasets[datasetIndex]
          });
        } else {
          setHoveredDataPoint(null);
        }
      },
      onClick: (event, elements) => {
        if (interactionMode === 'hover') return;
        
        if (elements.length > 0) {
          const element = elements[0];
          const datasetIndex = element.datasetIndex;
          const index = element.index;
          const value = data.datasets[datasetIndex].data[index];
          const label = data.labels?.[index];
          
          setSelectedDataPoint({
            datasetIndex,
            index,
            value,
            label,
            dataset: data.datasets[datasetIndex]
          });
        } else {
          setSelectedDataPoint(null);
        }
      },
      plugins: {
        ...mergedOptions.plugins,
        tooltip: {
          ...mergedOptions.plugins?.tooltip,
          callbacks: {
            title: (tooltipItems) => {
              const item = tooltipItems[0];
              return item.label || '';
            },
            label: (tooltipItem) => {
              const datasetLabel = tooltipItem.dataset.label || '';
              const value = tooltipItem.parsed.y || tooltipItem.parsed;
              return `${datasetLabel}: ${typeof value === 'number' ? value.toFixed(2) : value}`;
            },
            footer: (tooltipItems) => {
              if (tooltipItems.length > 1) {
                const total = tooltipItems.reduce((sum, item) => {
                  const value = item.parsed.y || item.parsed;
                  return sum + (typeof value === 'number' ? value : 0);
                }, 0);
                return `Total: ${total.toFixed(2)}`;
              }
              return '';
            },
            afterLabel: (tooltipItem) => {
              const percentage = ((tooltipItem.parsed.y / tooltipItems.reduce((sum: number, item: any) => sum + item.parsed.y, 0)) * 100).toFixed(1);
              return `(${percentage}%)`;
            }
          }
        }
      }
    };
  }, [mergedOptions, data, interactionMode]);

  const handleDataPointSelection = useCallback((datasetIndex: number, index: number) => {
    const value = data.datasets[datasetIndex].data[index];
    const label = data.labels?.[index];
    
    setSelectedDataPoint({
      datasetIndex,
      index,
      value,
      label,
      dataset: data.datasets[datasetIndex]
    });
  }, [data]);

  const clearSelection = useCallback(() => {
    setSelectedDataPoint(null);
    setHoveredDataPoint(null);
  }, []);

  return {
    chartRef,
    canvasRef,
    interactiveOptions,
    selectedDataPoint,
    hoveredDataPoint,
    interactionMode,
    setInteractionMode,
    handleDataPointSelection,
    clearSelection,
    updateChart
  };
};

// Multi-Chart Hook
export const useMultiChart = (
  charts: Array<{ data: ChartData; options: ChartOptions; type: ChartType; id: string }>,
  layout: LayoutConfiguration,
  synchronization: SynchronizationConfiguration
) => {
  const [activeCharts, setActiveCharts] = useState(charts);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [syncState, setSyncState] = useState({
    zoomRange: null,
    selectedTimeRange: null,
    hoveredDataPoint: null
  });

  const synchronizeCharts = useCallback((sourceChartId: string, action: string, data: any) => {
    if (!synchronization[action as keyof SynchronizationConfiguration]) return;

    setActiveCharts(prev => prev.map(chart => {
      if (chart.id === sourceChartId) return chart;
      
      switch (action) {
        case 'zoom':
          if (synchronization.zoom) {
            return {
              ...chart,
              options: {
                ...chart.options,
                scales: {
                  ...chart.options.scales,
                  x: {
                    ...chart.options.scales?.x,
                    min: data.min,
                    max: data.max
                  }
                }
              }
            };
          }
          break;
        case 'hover':
          if (synchronization.hover) {
            setSyncState(prev => ({ ...prev, hoveredDataPoint: data }));
          }
          break;
      }
      
      return chart;
    }));
  }, [synchronization]);

  const addChart = useCallback((chart: { data: ChartData; options: ChartOptions; type: ChartType; id: string }) => {
    setActiveCharts(prev => [...prev, chart]);
  }, []);

  const removeChart = useCallback((chartId: string) => {
    setActiveCharts(prev => prev.filter(chart => chart.id !== chartId));
  }, []);

  const updateChartData = useCallback((chartId: string, newData: ChartData) => {
    setActiveCharts(prev => prev.map(chart => 
      chart.id === chartId ? { ...chart, data: newData } : chart
    ));
  }, []);

  const exportAllCharts = useCallback(async () => {
    const exports = await Promise.all(
      activeCharts.map(async (chart) => ({
        id: chart.id,
        data: chart.data,
        image: null // Would be implemented with actual chart export
      }))
    );
    return exports;
  }, [activeCharts]);

  return {
    activeCharts,
    selectedChart,
    setSelectedChart,
    syncState,
    synchronizeCharts,
    addChart,
    removeChart,
    updateChartData,
    exportAllCharts
  };
};

// Custom Chart.js Plugins
const customTooltipPlugin: CustomPlugin = {
  id: 'customTooltip',
  enabled: true,
  beforeDraw: (chart) => {
    if (chart.tooltip?.opacity === 0) return;

    const ctx = chart.ctx;
    const tooltip = chart.tooltip;
    
    if (!tooltip || !ctx) return;

    ctx.save();
    
    const tooltipModel = tooltip;
    const position = tooltipModel.caretX;
    const bodyFontSize = tooltipModel.options.bodyFont?.size || 12;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(position - 40, tooltipModel.caretY - 30, 80, 20);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `${bodyFontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Custom', position, tooltipModel.caretY - 15);
    
    ctx.restore();
  }
};

const dataLabelsPlugin: CustomPlugin = {
  id: 'dataLabels',
  enabled: true,
  afterDatasetDraw: (chart, args) => {
    const { ctx, data } = chart;
    const dataset = data.datasets[args.index];
    const meta = chart.getDatasetMeta(args.index);
    
    if (!meta.visible) return;

    ctx.save();
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';

    meta.data.forEach((element, index) => {
      const value = dataset.data[index];
      if (typeof value === 'number' && value > 50) {
        ctx.fillText(
          value.toFixed(1),
          element.x,
          element.y - 10
        );
      }
    });

    ctx.restore();
  }
};

const backgroundGradientPlugin: CustomPlugin = {
  id: 'backgroundGradient',
  enabled: true,
  beforeDraw: (chart) => {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    ctx.save();
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
    ctx.restore();
  }
};

// Responsive Chart Component
const ResponsiveChart: React.FC<{
  data: ChartData;
  type: ChartType;
  options?: ChartOptions;
  onDataPointClick?: (dataPoint: any) => void;
}> = ({ data, type, options = {}, onDataPointClick }) => {
  const { chartRef, canvasRef, isLoading, mergedOptions, updateChart, exportChart } = useResponsiveChart(data, options, type);

  const handleExport = useCallback(() => {
    const image = exportChart('png', 1.0);
    if (image) {
      const link = document.createElement('a');
      link.download = `chart-${type}-${Date.now()}.png`;
      link.href = image;
      link.click();
    }
  }, [exportChart, type]);

  const chartProps = {
    ref: (ref: ChartJS | null) => {
      chartRef.current = ref;
      if (ref && canvasRef) {
        canvasRef.current = ref.canvas;
      }
    },
    type,
    data,
    options: mergedOptions
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Chart {...chartProps} />
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Updating...
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 10, right: 10 }}>
        <Button size="xs" variant="light" onClick={handleExport}>
          Export PNG
        </Button>
      </div>
    </div>
  );
};

// Interactive Chart Component
const InteractiveChart: React.FC<{
  data: ChartData;
  type: ChartType;
  options?: ChartOptions;
}> = ({ data, type, options = {} }) => {
  const {
    chartRef,
    canvasRef,
    interactiveOptions,
    selectedDataPoint,
    hoveredDataPoint,
    interactionMode,
    setInteractionMode,
    clearSelection
  } = useInteractiveChart(data, options, type);

  const chartProps = {
    ref: (ref: ChartJS | null) => {
      chartRef.current = ref;
      if (ref && canvasRef) {
        canvasRef.current = ref.canvas;
      }
    },
    type,
    data,
    options: interactiveOptions
  };

  return (
    <div style={{ position: 'relative' }}>
      <Chart {...chartProps} />
      
      <div style={{ position: 'absolute', top: 10, left: 10 }}>
        <Group gap="xs">
          <Select
            size="xs"
            value={interactionMode}
            onChange={(value) => setInteractionMode(value as 'hover' | 'click' | 'both')}
            data={[
              { value: 'hover', label: 'Hover' },
              { value: 'click', label: 'Click' },
              { value: 'both', label: 'Both' }
            ]}
          />
          {(selectedDataPoint || hoveredDataPoint) && (
            <Button size="xs" variant="light" onClick={clearSelection}>
              Clear
            </Button>
          )}
        </Group>
      </div>

      {(selectedDataPoint || hoveredDataPoint) && (
        <Paper
          p="xs"
          withBorder
          style={{
            position: 'absolute',
            top: 50,
            left: 10,
            minWidth: 200,
            background: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          <Stack gap="xs">
            <Text size="xs" fw={600}>
              {selectedDataPoint ? 'Selected' : 'Hovered'} Data Point
            </Text>
            <Text size="xs">
              <Text span fw={500}>Label:</Text> {(selectedDataPoint || hoveredDataPoint)?.label}
            </Text>
            <Text size="xs">
              <Text span fw={500}>Value:</Text> {(selectedDataPoint || hoveredDataPoint)?.value}
            </Text>
            <Text size="xs">
              <Text span fw={500}>Dataset:</Text> {(selectedDataPoint || hoveredDataPoint)?.dataset?.label}
            </Text>
          </Stack>
        </Paper>
      )}
    </div>
  );
};

// Multi-Chart Component
const MultiChart: React.FC<{
  charts: Array<{ data: ChartData; options: ChartOptions; type: ChartType; id: string; title: string }>;
  layout?: LayoutConfiguration;
  synchronization?: SynchronizationConfiguration;
}> = ({ 
  charts, 
  layout = { columns: 2, rows: 2, spacing: 16, responsive: true, breakpoints: [] },
  synchronization = { zoom: false, pan: false, selection: false, hover: true, timeRange: false }
}) => {
  const { activeCharts, selectedChart, setSelectedChart, synchronizeCharts } = useMultiChart(charts, layout, synchronization);

  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
    gap: `${layout.spacing}px`,
    width: '100%'
  }), [layout]);

  return (
    <div>
      <div style={gridStyle}>
        {activeCharts.map((chart, index) => (
          <Paper
            key={chart.id}
            p="md"
            withBorder
            style={{ 
              height: '300px',
              cursor: 'pointer',
              border: selectedChart === chart.id ? '2px solid #3b82f6' : '1px solid #e5e7eb'
            }}
            onClick={() => setSelectedChart(chart.id === selectedChart ? null : chart.id)}
          >
            <Group justify="space-between" mb="sm">
              <Text size="sm" fw={600}>{chart.title || chart.id}</Text>
              <Badge size="sm" variant="light" color={chart.type === 'line' ? 'blue' : chart.type === 'bar' ? 'green' : 'purple'}>
                {chart.type}
              </Badge>
            </Group>
            <div style={{ height: 'calc(100% - 40px)' }}>
              <ResponsiveChart
                data={chart.data}
                type={chart.type}
                options={chart.options}
                onDataPointClick={(dataPoint) => synchronizeCharts(chart.id, 'selection', dataPoint)}
              />
            </div>
          </Paper>
        ))}
      </div>
      
      {selectedChart && (
        <Paper p="md" withBorder mt="md">
          <Text size="sm" fw={600} mb="sm">Chart Details: {selectedChart}</Text>
          <Grid>
            <Grid.Col span={6}>
              <Text size="xs" c="dimmed">
                Datasets: {activeCharts.find(c => c.id === selectedChart)?.data.datasets.length}
              </Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="xs" c="dimmed">
                Data Points: {activeCharts.find(c => c.id === selectedChart)?.data.labels?.length || 0}
              </Text>
            </Grid.Col>
          </Grid>
        </Paper>
      )}
    </div>
  );
};

// Data Generation Utilities
const generateChartData = (type: ChartType, points: number = 7): ChartData => {
  const labels = Array.from({ length: points }, (_, i) => `Point ${i + 1}`);
  
  switch (type) {
    case 'line':
      return {
        labels,
        datasets: [
          {
            label: 'Dataset 1',
            data: Array.from({ length: points }, () => Math.floor(Math.random() * 100)),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Dataset 2', 
            data: Array.from({ length: points }, () => Math.floor(Math.random() * 100)),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      };
    
    case 'bar':
      return {
        labels,
        datasets: [
          {
            label: 'Sales',
            data: Array.from({ length: points }, () => Math.floor(Math.random() * 1000)),
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1
          },
          {
            label: 'Revenue',
            data: Array.from({ length: points }, () => Math.floor(Math.random() * 1000)),
            backgroundColor: '#8b5cf6',
            borderColor: '#7c3aed',
            borderWidth: 1
          }
        ]
      };
    
    case 'doughnut':
      return {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
        datasets: [
          {
            data: Array.from({ length: 5 }, () => Math.floor(Math.random() * 100)),
            backgroundColor: ['#ef4444', '#3b82f6', '#eab308', '#10b981', '#8b5cf6'],
            borderColor: ['#dc2626', '#2563eb', '#ca8a04', '#059669', '#7c3aed'],
            borderWidth: 2
          }
        ]
      };
    
    default:
      return { labels: [], datasets: [] };
  }
};

const generateMultiChartData = () => [
  {
    id: 'chart-1',
    title: 'Revenue Trends',
    type: 'line' as ChartType,
    data: generateChartData('line', 12),
    options: { plugins: { title: { display: true, text: 'Monthly Revenue' } } }
  },
  {
    id: 'chart-2',
    title: 'Category Breakdown',
    type: 'doughnut' as ChartType,
    data: generateChartData('doughnut'),
    options: { plugins: { title: { display: true, text: 'Sales by Category' } } }
  },
  {
    id: 'chart-3',
    title: 'Performance Metrics',
    type: 'bar' as ChartType,
    data: generateChartData('bar', 6),
    options: { plugins: { title: { display: true, text: 'KPI Dashboard' } } }
  },
  {
    id: 'chart-4',
    title: 'Growth Analysis',
    type: 'line' as ChartType,
    data: generateChartData('line', 8),
    options: { plugins: { title: { display: true, text: 'Year over Year Growth' } } }
  }
];

// Main Exercise Component
const ChartJSReactPatternsExercise: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('responsive');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [chartData, setChartData] = useState(() => generateChartData('line'));
  const [multiChartData, setMultiChartData] = useState(() => generateMultiChartData());

  const handleChartTypeChange = useCallback((newType: string | null) => {
    if (newType) {
      const type = newType as ChartType;
      setChartType(type);
      setChartData(generateChartData(type));
    }
  }, []);

  const handleDataRegeneration = useCallback(() => {
    setChartData(generateChartData(chartType));
  }, [chartType]);

  const handleMultiChartRegeneration = useCallback(() => {
    setMultiChartData(generateMultiChartData());
  }, []);

  return (
    <ChartProvider
      initialTheme={{
        colorScheme: 'light',
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        backgroundColor: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        fontSize: 12
      }}
      initialPlugins={[customTooltipPlugin, dataLabelsPlugin, backgroundGradientPlugin]}
    >
      <Container size="xl" py="xl">
        <Stack gap="xl">
          <div>
            <Title order={1} size="h2" mb="md">
              Chart.js React Integration Patterns
            </Title>
            <Text c="dimmed">
              Modern Chart.js integration with React best practices, responsive design, 
              interactive features, and custom plugin development.
            </Text>
          </div>

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="responsive">Responsive Charts</Tabs.Tab>
              <Tabs.Tab value="interactive">Interactive Charts</Tabs.Tab>
              <Tabs.Tab value="multi-chart">Multi-Chart Layout</Tabs.Tab>
              <Tabs.Tab value="plugins">Custom Plugins</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="responsive" pt="md">
              <Grid>
                <Grid.Col span={8}>
                  <Paper p="md" withBorder>
                    <Group justify="space-between" mb="md">
                      <Title order={3} size="h4">Responsive Chart</Title>
                      <Badge color="blue" variant="light">{chartType}</Badge>
                    </Group>
                    <div style={{ height: '400px' }}>
                      <ResponsiveChart
                        data={chartData}
                        type={chartType}
                        options={{
                          plugins: {
                            title: {
                              display: true,
                              text: `Responsive ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`
                            }
                          }
                        }}
                      />
                    </div>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Stack gap="md">
                    <Paper p="md" withBorder>
                      <Title order={4} size="h5" mb="md">Chart Configuration</Title>
                      <Stack gap="sm">
                        <Select
                          label="Chart Type"
                          value={chartType}
                          onChange={handleChartTypeChange}
                          data={[
                            { value: 'line', label: 'Line Chart' },
                            { value: 'bar', label: 'Bar Chart' },
                            { value: 'doughnut', label: 'Doughnut Chart' },
                            { value: 'radar', label: 'Radar Chart' }
                          ]}
                        />
                        <Button variant="light" onClick={handleDataRegeneration} fullWidth>
                          Regenerate Data
                        </Button>
                      </Stack>
                    </Paper>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>

            <Tabs.Panel value="interactive" pt="md">
              <Paper p="md" withBorder>
                <Title order={3} size="h4" mb="md">Interactive Chart Features</Title>
                <div style={{ height: '400px' }}>
                  <InteractiveChart
                    data={chartData}
                    type={chartType}
                    options={{
                      plugins: {
                        title: {
                          display: true,
                          text: 'Click or hover on data points'
                        }
                      }
                    }}
                  />
                </div>
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="multi-chart" pt="md">
              <Stack gap="md">
                <Paper p="sm" withBorder>
                  <Group justify="space-between">
                    <Title order={3} size="h4">Multi-Chart Dashboard</Title>
                    <Button size="sm" variant="light" onClick={handleMultiChartRegeneration}>
                      Refresh All Charts
                    </Button>
                  </Group>
                </Paper>
                
                <MultiChart
                  charts={multiChartData}
                  layout={{ columns: 2, rows: 2, spacing: 16, responsive: true, breakpoints: [] }}
                  synchronization={{ zoom: false, pan: false, selection: false, hover: true, timeRange: false }}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="plugins" pt="md">
              <Paper p="md" withBorder>
                <Title order={3} size="h4" mb="md">Custom Plugin Showcase</Title>
                <Text size="sm" mb="md" c="dimmed">
                  Demonstrating custom Chart.js plugins: background gradient, data labels, and custom tooltips.
                </Text>
                <div style={{ height: '400px' }}>
                  <ResponsiveChart
                    data={generateChartData('line', 10)}
                    type="line"
                    options={{
                      plugins: {
                        title: {
                          display: true,
                          text: 'Chart with Custom Plugins'
                        },
                        customTooltip: { enabled: true },
                        dataLabels: { enabled: true },
                        backgroundGradient: { enabled: true }
                      }
                    }}
                  />
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
                    <Text fw={600} size="sm" mb="xs">Responsive Design</Text>
                    <Text size="xs" c="dimmed">
                      ✓ Dynamic container observation with ResizeObserver<br/>
                      ✓ Adaptive sizing with aspect ratio maintenance<br/>
                      ✓ Breakpoint-aware layout adjustments<br/>
                      ✓ Performance-optimized resize handling
                    </Text>
                  </div>
                  <div>
                    <Text fw={600} size="sm" mb="xs">Interactive Features</Text>
                    <Text size="xs" c="dimmed">
                      ✓ Custom tooltip systems with dynamic positioning<br/>
                      ✓ Data point selection with visual feedback<br/>
                      ✓ Event handling integration with React patterns<br/>
                      ✓ Multiple interaction modes with user control
                    </Text>
                  </div>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap="sm">
                  <div>
                    <Text fw={600} size="sm" mb="xs">Multi-Chart Coordination</Text>
                    <Text size="xs" c="dimmed">
                      ✓ Responsive grid layouts with dynamic columns<br/>
                      ✓ Chart synchronization with linked interactions<br/>
                      ✓ Unified export capabilities for dashboards<br/>
                      ✓ Coordinated theme management across charts
                    </Text>
                  </div>
                  <div>
                    <Text fw={600} size="sm" mb="xs">Custom Plugin System</Text>
                    <Text size="xs" c="dimmed">
                      ✓ Background gradient plugin with Canvas API<br/>
                      ✓ Data labels plugin with intelligent positioning<br/>
                      ✓ Custom tooltip plugin with enhanced styling<br/>
                      ✓ Plugin lifecycle management with React integration
                    </Text>
                  </div>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        </Stack>
      </Container>
    </ChartProvider>
  );
};

export default ChartJSReactPatternsExercise;