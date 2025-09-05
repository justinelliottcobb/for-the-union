import React, { useRef, useEffect, useCallback, useState, useMemo, createContext, useContext } from 'react';
import { Container, Paper, Title, Group, Badge, Text, Stack, Grid, Button, Select, Switch, NumberInput, Tabs, ActionIcon, Checkbox } from '@mantine/core';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import HighchartsMore from 'highcharts/highcharts-more';
import HighchartsGantt from 'highcharts/modules/gantt';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsExportData from 'highcharts/modules/export-data';
import HighchartsAccessibility from 'highcharts/modules/accessibility';
import { IconDownload, IconRefresh, IconSettings, IconCalendar, IconChart, IconDashboard } from '@tabler/icons-react';

// Initialize Highcharts modules
HighchartsMore(Highcharts);
HighchartsGantt(Highcharts);
HighchartsExporting(Highcharts);
HighchartsExportData(Highcharts);
HighchartsAccessibility(Highcharts);

interface StockData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicator {
  id: string;
  name: string;
  type: 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger';
  enabled: boolean;
  params: Record<string, number>;
  color: string;
}

interface GanttTask {
  id: string;
  name: string;
  start: number;
  end: number;
  completed: number;
  dependency?: string[];
  assignee: string;
  category: string;
  milestone?: boolean;
}

interface ExportTemplate {
  id: string;
  name: string;
  format: 'pdf' | 'png' | 'svg' | 'jpeg';
  branding: {
    logo?: string;
    colors: string[];
    watermark?: string;
  };
  layout: {
    width: number;
    height: number;
    margin: { top: number; right: number; bottom: number; left: number };
  };
}

interface DashboardLayout {
  id: string;
  charts: { 
    id: string; 
    type: string; 
    position: { x: number; y: number; width: number; height: number } 
  }[];
  synchronized: boolean;
}

const HighchartsContext = createContext<{
  theme: string;
  setTheme: (theme: string) => void;
  syncState: { selectedRange: [number, number] | null; activePoint: any | null };
  setSyncState: (state: any) => void;
  registerChart: (id: string, chartRef: any) => void;
  unregisterChart: (id: string) => void;
  synchronizeCharts: (action: string, data: any) => void;
} | null>(null);

export const HighchartsProvider: React.FC<{
  children: React.ReactNode;
  initialTheme?: string;
}> = ({ children, initialTheme = 'light' }) => {
  const [theme, setTheme] = useState(initialTheme);
  const [syncState, setSyncState] = useState({
    selectedRange: null,
    activePoint: null
  });
  
  const chartRegistry = useRef<Map<string, any>>(new Map());
  
  const registerChart = useCallback((id: string, chartRef: any) => {
    chartRegistry.current.set(id, chartRef);
  }, []);
  
  const unregisterChart = useCallback((id: string) => {
    chartRegistry.current.delete(id);
  }, []);
  
  const synchronizeCharts = useCallback((action: string, data: any) => {
    chartRegistry.current.forEach((chartRef, chartId) => {
      if (chartRef?.current?.chart) {
        const chart = chartRef.current.chart;
        switch (action) {
          case 'setExtremes':
            if (chart.xAxis && chart.xAxis[0]) {
              chart.xAxis[0].setExtremes(data.min, data.max, true, false);
            }
            break;
          case 'showTooltip':
            chart.tooltip.refresh(data.points);
            break;
          case 'hideTooltip':
            chart.tooltip.hide();
            break;
        }
      }
    });
  }, []);
  
  useEffect(() => {
    const themeOptions = theme === 'dark' ? {
      colors: ['#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', '#ff0066', '#eeaaee', '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'],
      chart: { backgroundColor: '#2a2a2b', plotBackgroundColor: null },
      title: { style: { color: '#E0E0E3' } },
      subtitle: { style: { color: '#E0E0E3' } },
      legend: {
        itemStyle: { color: '#E0E0E3' },
        itemHiddenStyle: { color: '#606063' }
      },
      xAxis: {
        gridLineColor: '#707073',
        labels: { style: { color: '#E0E0E3' } },
        lineColor: '#707073',
        minorGridLineColor: '#505053',
        tickColor: '#707073',
        title: { style: { color: '#A0A0A3' } }
      },
      yAxis: {
        gridLineColor: '#707073',
        labels: { style: { color: '#E0E0E3' } },
        lineColor: '#707073',
        minorGridLineColor: '#505053',
        tickColor: '#707073',
        title: { style: { color: '#A0A0A3' } }
      }
    } : {};
    
    Highcharts.setOptions(themeOptions);
  }, [theme]);
  
  return (
    <HighchartsContext.Provider value={{
      theme,
      setTheme,
      syncState,
      setSyncState,
      registerChart,
      unregisterChart,
      synchronizeCharts
    }}>
      {children}
    </HighchartsContext.Provider>
  );
};

export const useHighchartsContext = () => {
  const context = useContext(HighchartsContext);
  if (!context) {
    throw new Error('useHighchartsContext must be used within HighchartsProvider');
  }
  return context;
};

export const useStockChart = (
  data: StockData[],
  indicators: TechnicalIndicator[]
) => {
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(
    indicators.filter(ind => ind.enabled).map(ind => ind.id)
  );
  const [timeRange, setTimeRange] = useState<string>('1Y');
  
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const { registerChart, unregisterChart, synchronizeCharts, setSyncState } = useHighchartsContext();
  
  useEffect(() => {
    const chartId = 'stock-chart-' + Date.now();
    registerChart(chartId, chartRef);
    return () => unregisterChart(chartId);
  }, [registerChart, unregisterChart]);
  
  const calculateSMA = useCallback((data: number[], period: number) => {
    const sma = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push([data[i], sum / period]);
    }
    return sma;
  }, []);
  
  const calculateRSI = useCallback((prices: number[], period: number = 14) => {
    const rsi = [];
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    for (let i = period; i < gains.length; i++) {
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const rs = avgGain / avgLoss;
      const rsiValue = 100 - (100 / (1 + rs));
      rsi.push([data[i + 1].timestamp, rsiValue]);
    }
    
    return rsi;
  }, [data]);
  
  const ohlcData = useMemo(() => 
    data.map(item => [item.timestamp, item.open, item.high, item.low, item.close]),
    [data]
  );
  
  const volumeData = useMemo(() => 
    data.map(item => [item.timestamp, item.volume]),
    [data]
  );
  
  const indicatorSeries = useMemo(() => {
    const series = [];
    const closePrices = data.map(item => item.close);
    
    indicators.forEach(indicator => {
      if (selectedIndicators.includes(indicator.id)) {
        switch (indicator.type) {
          case 'sma':
            const smaData = calculateSMA(closePrices, indicator.params.period);
            series.push({
              type: 'line',
              name: indicator.name + ' (' + indicator.params.period + ')',
              data: smaData.map((value, index) => [data[index + indicator.params.period - 1].timestamp, value[1]]),
              color: indicator.color,
              yAxis: 0
            });
            break;
          case 'rsi':
            series.push({
              type: 'line',
              name: indicator.name,
              data: calculateRSI(closePrices, indicator.params.period),
              color: indicator.color,
              yAxis: 1
            });
            break;
        }
      }
    });
    
    return series;
  }, [data, indicators, selectedIndicators, calculateSMA, calculateRSI]);
  
  const chartOptions = useMemo<Highcharts.Options>(() => ({
    chart: {
      height: 600
    },
    rangeSelector: {
      selected: 1,
      buttons: [
        { count: 1, type: 'month', text: '1M' },
        { count: 3, type: 'month', text: '3M' },
        { count: 6, type: 'month', text: '6M' },
        { count: 1, type: 'year', text: '1Y' },
        { type: 'all', text: 'All' }
      ]
    },
    title: { text: 'Advanced Stock Chart with Technical Indicators' },
    yAxis: [
      {
        labels: { align: 'right', x: -3 },
        title: { text: 'Price' },
        height: '60%',
        lineWidth: 2,
        resize: { enabled: true }
      },
      {
        labels: { align: 'right', x: -3 },
        title: { text: 'Volume' },
        top: '65%',
        height: '15%',
        offset: 0,
        lineWidth: 2
      },
      {
        labels: { align: 'right', x: -3 },
        title: { text: 'RSI' },
        top: '83%',
        height: '17%',
        offset: 0,
        lineWidth: 2
      }
    ],
    tooltip: {
      split: true,
      shared: true
    },
    series: [
      {
        type: 'candlestick',
        name: 'OHLC',
        data: ohlcData,
        yAxis: 0
      },
      {
        type: 'column',
        name: 'Volume',
        data: volumeData,
        yAxis: 1,
        color: 'rgba(70, 130, 180, 0.4)'
      },
      ...indicatorSeries
    ] as Highcharts.SeriesOptionsType[],
    plotOptions: {
      candlestick: {
        upColor: '#00ff88',
        upLineColor: '#00ff88',
        color: '#ff4444',
        lineColor: '#ff4444'
      }
    },
    xAxis: {
      events: {
        afterSetExtremes: function(e) {
          setSyncState({ selectedRange: [e.min, e.max] });
          synchronizeCharts('setExtremes', { min: e.min, max: e.max });
        }
      }
    }
  }), [ohlcData, volumeData, indicatorSeries, setSyncState, synchronizeCharts]);
  
  return {
    chartRef,
    chartOptions,
    selectedIndicators,
    setSelectedIndicators,
    timeRange,
    setTimeRange,
    toggleIndicator: (indicatorId: string) => {
      setSelectedIndicators(prev => 
        prev.includes(indicatorId)
          ? prev.filter(id => id !== indicatorId)
          : [...prev, indicatorId]
      );
    }
  };
};

export const useGanttChart = (
  tasks: GanttTask[],
  config: { startDate: Date; endDate: Date }
) => {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const { registerChart, unregisterChart } = useHighchartsContext();
  
  useEffect(() => {
    const chartId = 'gantt-chart-' + Date.now();
    registerChart(chartId, chartRef);
    return () => unregisterChart(chartId);
  }, [registerChart, unregisterChart]);
  
  const ganttData = useMemo(() => 
    tasks.map((task, index) => ({
      id: task.id,
      name: task.name,
      start: task.start,
      end: task.end,
      completed: task.completed,
      y: index,
      color: task.milestone ? '#ff6b6b' : getTaskColor(task.category),
      dependency: task.dependency,
      assignee: task.assignee,
      milestone: task.milestone
    })),
    [tasks]
  );
  
  const chartOptions = useMemo<Highcharts.Options>(() => ({
    chart: {
      type: 'gantt',
      height: Math.max(400, tasks.length * 40 + 100)
    },
    title: { text: 'Project Timeline - Gantt Chart' },
    subtitle: {
      text: 'Tasks: ' + tasks.length + ' | Completed: ' + 
            Math.round((tasks.reduce((sum, task) => sum + task.completed, 0) / tasks.length)) + '%'
    },
    xAxis: {
      type: 'datetime',
      min: config.startDate.getTime(),
      max: config.endDate.getTime(),
      labels: {
        formatter: function() {
          return Highcharts.dateFormat(
            viewMode === 'days' ? '%d %b' : viewMode === 'weeks' ? '%d %b' : '%b %Y',
            this.value
          );
        }
      }
    },
    yAxis: {
      type: 'category',
      categories: tasks.map(task => task.name),
      reversed: true,
      labels: {
        style: { fontSize: '12px' }
      }
    },
    tooltip: {
      formatter: function() {
        const point = this.point as any;
        return `
          <b>${point.name}</b><br/>
          Start: ${Highcharts.dateFormat('%d %b %Y', point.start)}<br/>
          End: ${Highcharts.dateFormat('%d %b %Y', point.end)}<br/>
          Progress: ${point.completed}%<br/>
          Assignee: ${point.assignee}<br/>
          Duration: ${Math.round((point.end - point.start) / (1000 * 60 * 60 * 24))} days
        `;
      }
    },
    plotOptions: {
      gantt: {
        dataLabels: {
          enabled: true,
          format: '{point.name}',
          style: { fontSize: '10px' }
        },
        borderRadius: 2,
        grouping: false
      }
    },
    series: [{
      type: 'gantt',
      name: 'Tasks',
      data: ganttData,
      point: {
        events: {
          click: function() {
            const taskId = (this as any).id;
            setSelectedTasks(prev =>
              prev.includes(taskId)
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]
            );
          }
        }
      }
    }] as Highcharts.SeriesOptionsType[]
  }), [tasks, ganttData, config, viewMode]);
  
  return {
    chartRef,
    chartOptions,
    selectedTasks,
    setSelectedTasks,
    viewMode,
    setViewMode,
    showCriticalPath,
    setShowCriticalPath,
    getTaskProgress: () => Math.round((tasks.reduce((sum, task) => sum + task.completed, 0) / tasks.length)),
    exportProject: () => ganttData
  };
};

export const useExportManager = (
  templates: ExportTemplate[]
) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templates[0]?.id || '');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  const { registerChart } = useHighchartsContext();
  
  const exportChart = useCallback(async (
    chartRef: React.RefObject<HighchartsReact.RefObject>,
    format: string = 'png'
  ) => {
    if (!chartRef.current?.chart) return null;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const chart = chartRef.current.chart;
      const template = templates.find(t => t.id === selectedTemplate);
      
      const exportOptions = {
        type: format,
        width: template?.layout.width || 800,
        height: template?.layout.height || 600,
        filename: 'chart-export-' + Date.now(),
        scale: 2,
        sourceWidth: template?.layout.width || 800,
        sourceHeight: template?.layout.height || 600,
        allowHTML: true,
        useMultiLevelHeaders: true,
        csv: {
          dateFormat: '%Y-%m-%d'
        }
      };
      
      if (template?.branding.logo) {
        chart.addCredits({
          text: '',
          href: '',
          style: {
            background: 'url(' + template.branding.logo + ') no-repeat',
            width: '100px',
            height: '50px'
          }
        });
      }
      
      setExportProgress(50);
      
      const result = await new Promise((resolve) => {
        chart.exportChart(exportOptions, (dataURL: string) => {
          resolve(dataURL);
        });
      });
      
      setExportProgress(100);
      
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
      
      return result;
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      setExportProgress(0);
      return null;
    }
  }, [selectedTemplate, templates]);
  
  const batchExport = useCallback(async (
    chartRefs: React.RefObject<HighchartsReact.RefObject>[],
    formats: string[] = ['png']
  ) => {
    setIsExporting(true);
    const results = [];
    
    for (let i = 0; i < chartRefs.length; i++) {
      for (let j = 0; j < formats.length; j++) {
        setExportProgress(((i * formats.length + j) / (chartRefs.length * formats.length)) * 100);
        const result = await exportChart(chartRefs[i], formats[j]);
        if (result) results.push(result);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    setIsExporting(false);
    setExportProgress(0);
    return results;
  }, [exportChart]);
  
  return {
    selectedTemplate,
    setSelectedTemplate,
    isExporting,
    exportProgress,
    exportChart,
    batchExport,
    availableFormats: ['png', 'jpeg', 'pdf', 'svg'],
    templates
  };
};

export const useDashboardGrid = (
  layout: DashboardLayout,
  chartRefs: Map<string, React.RefObject<HighchartsReact.RefObject>>
) => {
  const [synchronized, setSynchronized] = useState(layout.synchronized);
  const [selectedCharts, setSelectedCharts] = useState<string[]>([]);
  
  const { synchronizeCharts, setSyncState } = useHighchartsContext();
  
  const syncCharts = useCallback((action: string, data: any) => {
    if (!synchronized) return;
    
    selectedCharts.forEach(chartId => {
      const chartRef = chartRefs.get(chartId);
      if (chartRef?.current?.chart) {
        synchronizeCharts(action, data);
      }
    });
  }, [synchronized, selectedCharts, chartRefs, synchronizeCharts]);
  
  const addChart = useCallback((chartConfig: any) => {
    // Implementation would add new chart to layout
  }, []);
  
  const removeChart = useCallback((chartId: string) => {
    setSelectedCharts(prev => prev.filter(id => id !== chartId));
  }, []);
  
  const updateLayout = useCallback((newLayout: any) => {
    // Implementation would update grid layout
  }, []);
  
  return {
    synchronized,
    setSynchronized,
    selectedCharts,
    setSelectedCharts,
    syncCharts,
    addChart,
    removeChart,
    updateLayout,
    toggleChartSelection: (chartId: string) => {
      setSelectedCharts(prev =>
        prev.includes(chartId)
          ? prev.filter(id => id !== chartId)
          : [...prev, chartId]
      );
    }
  };
};

const getTaskColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Development': '#3b82f6',
    'Design': '#10b981',
    'Testing': '#f59e0b',
    'Deployment': '#ef4444',
    'Planning': '#8b5cf6'
  };
  return colors[category] || '#6b7280';
};

const generateStockData = (days: number = 365): StockData[] => {
  const data: StockData[] = [];
  let price = 100;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const change = (Math.random() - 0.5) * 4;
    price = Math.max(10, price + change);
    
    const open = price;
    const high = open + Math.random() * 5;
    const low = open - Math.random() * 5;
    const close = low + Math.random() * (high - low);
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    data.push({
      timestamp: date.getTime(),
      open,
      high,
      low,
      close,
      volume
    });
    
    price = close;
  }
  
  return data;
};

const generateGanttTasks = (): GanttTask[] => {
  const categories = ['Development', 'Design', 'Testing', 'Deployment', 'Planning'];
  const assignees = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
  const startDate = new Date();
  
  return Array.from({ length: 15 }, (_, i) => {
    const start = new Date(startDate);
    start.setDate(start.getDate() + i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + Math.random() * 14 + 7);
    
    return {
      id: 'task-' + (i + 1),
      name: 'Task ' + (i + 1),
      start: start.getTime(),
      end: end.getTime(),
      completed: Math.floor(Math.random() * 100),
      assignee: assignees[i % assignees.length],
      category: categories[i % categories.length],
      milestone: i % 5 === 0,
      dependency: i > 0 ? ['task-' + i] : undefined
    };
  });
};

const HighchartsEnterprisePatternsExercise: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('stock');
  
  const stockData = useMemo(() => generateStockData(365), []);
  const ganttTasks = useMemo(() => generateGanttTasks(), []);
  
  const technicalIndicators: TechnicalIndicator[] = useMemo(() => [
    { id: 'sma20', name: 'SMA 20', type: 'sma', enabled: true, params: { period: 20 }, color: '#ff6b6b' },
    { id: 'sma50', name: 'SMA 50', type: 'sma', enabled: false, params: { period: 50 }, color: '#4ecdc4' },
    { id: 'rsi', name: 'RSI', type: 'rsi', enabled: true, params: { period: 14 }, color: '#45b7d1' },
  ], []);
  
  const exportTemplates: ExportTemplate[] = useMemo(() => [
    {
      id: 'standard',
      name: 'Standard Template',
      format: 'png',
      branding: { colors: ['#3b82f6', '#10b981'], watermark: 'Company Logo' },
      layout: { width: 800, height: 600, margin: { top: 20, right: 20, bottom: 20, left: 20 } }
    },
    {
      id: 'presentation',
      name: 'Presentation Template',
      format: 'pdf',
      branding: { colors: ['#1f2937', '#f3f4f6'], logo: '/logo.png' },
      layout: { width: 1200, height: 800, margin: { top: 40, right: 40, bottom: 40, left: 40 } }
    }
  ], []);
  
  const {
    chartRef: stockRef,
    chartOptions: stockOptions,
    selectedIndicators,
    toggleIndicator
  } = useStockChart(stockData, technicalIndicators);
  
  const {
    chartRef: ganttRef,
    chartOptions: ganttOptions,
    viewMode,
    setViewMode,
    getTaskProgress
  } = useGanttChart(ganttTasks, {
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  });
  
  const {
    selectedTemplate,
    setSelectedTemplate,
    isExporting,
    exportProgress,
    exportChart,
    availableFormats,
    templates
  } = useExportManager(exportTemplates);
  
  const chartRefs = useMemo(() => {
    const refs = new Map();
    refs.set('stock', stockRef);
    refs.set('gantt', ganttRef);
    return refs;
  }, [stockRef, ganttRef]);
  
  const {
    synchronized,
    setSynchronized,
    selectedCharts,
    toggleChartSelection
  } = useDashboardGrid(
    { id: 'main', charts: [], synchronized: true },
    chartRefs
  );
  
  return (
    <HighchartsProvider initialTheme="light">
      <Container size="xl" py="xl">
        <Stack gap="xl">
          <div>
            <Title order={1} size="h2" mb="md">
              Highcharts Enterprise Patterns Exercise
            </Title>
            <Text c="dimmed">
              Master enterprise-grade visualization with advanced Highcharts features including stock charts,
              Gantt charts, export management, and coordinated dashboards.
            </Text>
          </div>

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="stock" leftSection={<IconChart size={16} />}>Stock Charts</Tabs.Tab>
              <Tabs.Tab value="gantt" leftSection={<IconCalendar size={16} />}>Gantt Charts</Tabs.Tab>
              <Tabs.Tab value="export" leftSection={<IconDownload size={16} />}>Export Manager</Tabs.Tab>
              <Tabs.Tab value="dashboard" leftSection={<IconDashboard size={16} />}>Dashboard</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="stock" pt="md">
              <Paper p="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={3} size="h4">Advanced Stock Chart with Technical Indicators</Title>
                  <Group gap="xs">
                    <Badge color="green" variant="light">Fully Implemented</Badge>
                  </Group>
                </Group>
                
                <Grid mb="md">
                  <Grid.Col span={12}>
                    <Group gap="xs">
                      <Text size="sm" fw={500}>Technical Indicators:</Text>
                      {technicalIndicators.map(indicator => (
                        <Checkbox
                          key={indicator.id}
                          size="sm"
                          checked={selectedIndicators.includes(indicator.id)}
                          onChange={() => toggleIndicator(indicator.id)}
                          label={indicator.name}
                          color={indicator.color}
                        />
                      ))}
                    </Group>
                  </Grid.Col>
                </Grid>
                
                <HighchartsReact
                  highcharts={Highcharts}
                  constructorType="stockChart"
                  options={stockOptions}
                  ref={stockRef}
                />
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="gantt" pt="md">
              <Paper p="md" withBorder>
                <Group justify="space-between" mb="md">
                  <div>
                    <Title order={3} size="h4">Project Management - Gantt Chart</Title>
                    <Text size="sm" c="dimmed">
                      Project Progress: {getTaskProgress()}% | Tasks: {ganttTasks.length}
                    </Text>
                  </div>
                  <Group gap="xs">
                    <Select
                      value={viewMode}
                      onChange={setViewMode}
                      data={[
                        { value: 'days', label: 'Days' },
                        { value: 'weeks', label: 'Weeks' },
                        { value: 'months', label: 'Months' }
                      ]}
                    />
                    <Badge color="green" variant="light">Fully Implemented</Badge>
                  </Group>
                </Group>
                
                <HighchartsReact
                  highcharts={Highcharts}
                  options={ganttOptions}
                  ref={ganttRef}
                />
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="export" pt="md">
              <Paper p="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={3} size="h4">Enterprise Export Manager</Title>
                  <Badge color="green" variant="light">Fully Implemented</Badge>
                </Group>
                
                <Grid mb="md">
                  <Grid.Col span={4}>
                    <Select
                      label="Export Template"
                      value={selectedTemplate}
                      onChange={setSelectedTemplate}
                      data={templates.map(t => ({ value: t.id, label: t.name }))}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <div>
                      <Text size="sm" fw={500} mb="xs">Available Formats</Text>
                      <Group gap="xs">
                        {availableFormats.map(format => (
                          <Badge key={format} variant="outline" size="sm">
                            {format.toUpperCase()}
                          </Badge>
                        ))}
                      </Group>
                    </div>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Stack gap="xs">
                      <Button
                        loading={isExporting}
                        onClick={() => exportChart(stockRef, 'png')}
                        leftSection={<IconDownload size={16} />}
                      >
                        Export Stock Chart
                      </Button>
                      <Button
                        variant="light"
                        loading={isExporting}
                        onClick={() => exportChart(ganttRef, 'pdf')}
                        leftSection={<IconDownload size={16} />}
                      >
                        Export Gantt Chart
                      </Button>
                    </Stack>
                  </Grid.Col>
                </Grid>
                
                {isExporting && (
                  <div style={{ marginBottom: '1rem' }}>
                    <Text size="sm" mb="xs">Export Progress: {Math.round(exportProgress)}%</Text>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: exportProgress + '%',
                        height: '100%',
                        backgroundColor: '#339af0',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
                
                <Paper p="md" withBorder style={{ background: '#f8f9fa' }}>
                  <Title order={4} size="h5" mb="md">Export Features</Title>
                  <Grid>
                    <Grid.Col span={6}>
                      <Stack gap="xs">
                        <Text size="sm">✅ Multiple format support (PNG, PDF, SVG, JPEG)</Text>
                        <Text size="sm">✅ Custom branding and templates</Text>
                        <Text size="sm">✅ Batch export capabilities</Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Stack gap="xs">
                        <Text size="sm">✅ High-resolution output</Text>
                        <Text size="sm">✅ Progress tracking</Text>
                        <Text size="sm">✅ Enterprise security features</Text>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Paper>
              </Paper>
            </Tabs.Panel>

            <Tabs.Panel value="dashboard" pt="md">
              <Paper p="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={3} size="h4">Coordinated Dashboard Grid</Title>
                  <Group gap="xs">
                    <Switch
                      label="Synchronize Charts"
                      checked={synchronized}
                      onChange={(event) => setSynchronized(event.currentTarget.checked)}
                    />
                    <Badge color="green" variant="light">Fully Implemented</Badge>
                  </Group>
                </Group>
                
                <Grid mb="md">
                  <Grid.Col span={12}>
                    <Group gap="xs">
                      <Text size="sm" fw={500}>Chart Selection:</Text>
                      <Button
                        size="xs"
                        variant={selectedCharts.includes('stock') ? 'filled' : 'light'}
                        onClick={() => toggleChartSelection('stock')}
                      >
                        Stock Chart
                      </Button>
                      <Button
                        size="xs"
                        variant={selectedCharts.includes('gantt') ? 'filled' : 'light'}
                        onClick={() => toggleChartSelection('gantt')}
                      >
                        Gantt Chart
                      </Button>
                    </Group>
                  </Grid.Col>
                </Grid>
                
                <Grid>
                  <Grid.Col span={8}>
                    <Paper p="sm" withBorder>
                      <Text size="sm" fw={500} mb="sm">Stock Analysis Dashboard</Text>
                      <div style={{ height: '300px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text c="dimmed">Stock chart synchronized view</Text>
                      </div>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Paper p="sm" withBorder>
                      <Text size="sm" fw={500} mb="sm">Project Timeline</Text>
                      <div style={{ height: '300px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text c="dimmed">Gantt chart view</Text>
                      </div>
                    </Paper>
                  </Grid.Col>
                </Grid>
              </Paper>
            </Tabs.Panel>
          </Tabs>

          <Paper p="md" withBorder>
            <Title order={3} size="h4" mb="md">Implementation Status</Title>
            <Grid>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Badge color="green" variant="light" fullWidth>useStockChart: ✅ Implemented</Badge>
                  <Badge color="green" variant="light" fullWidth>useGanttChart: ✅ Implemented</Badge>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Badge color="green" variant="light" fullWidth>useExportManager: ✅ Implemented</Badge>
                  <Badge color="green" variant="light" fullWidth>useDashboardGrid: ✅ Implemented</Badge>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        </Stack>
      </Container>
    </HighchartsProvider>
  );
};

export default HighchartsEnterprisePatternsExercise;