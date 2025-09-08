import React, { useState, useEffect, useCallback, useMemo, useRef, useReducer } from 'react';
import { Card, Text, Group, Stack, Button, Select, TextInput, Badge, Tabs, Grid, ActionIcon, Modal, Switch, Slider, Paper, Title, Divider } from '@mantine/core';
import { IconPlus, IconSettings, IconFilter, IconChartBar, IconTrash, IconGripVertical, IconSearch, IconRefresh } from '@tabler/icons-react';
import * as d3 from 'd3';

// === TYPES AND INTERFACES ===

interface DashboardComponent {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
  data?: any[];
}

interface FilterCondition {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
  value: any;
  active: boolean;
}

interface DashboardState {
  components: DashboardComponent[];
  filters: FilterCondition[];
  selectedComponent: string | null;
  layoutMode: 'view' | 'edit';
  globalData: Record<string, any[]>;
}

interface ChartPlugin {
  type: string;
  name: string;
  component: React.ComponentType<any>;
  defaultConfig: Record<string, any>;
  configSchema: Record<string, any>;
}

interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  dataPoints: number;
  memoryUsage: number;
  updateFrequency: number;
}

// === DASHBOARD STATE MANAGEMENT ===

type DashboardAction = 
  | { type: 'ADD_COMPONENT'; payload: DashboardComponent }
  | { type: 'UPDATE_COMPONENT'; payload: { id: string; updates: Partial<DashboardComponent> } }
  | { type: 'REMOVE_COMPONENT'; payload: string }
  | { type: 'ADD_FILTER'; payload: FilterCondition }
  | { type: 'UPDATE_FILTER'; payload: { id: string; updates: Partial<FilterCondition> } }
  | { type: 'REMOVE_FILTER'; payload: string }
  | { type: 'SET_SELECTED_COMPONENT'; payload: string | null }
  | { type: 'SET_LAYOUT_MODE'; payload: 'view' | 'edit' }
  | { type: 'UPDATE_GLOBAL_DATA'; payload: { key: string; data: any[] } }
  | { type: 'LOAD_DASHBOARD'; payload: DashboardState };

const dashboardReducer = (state: DashboardState, action: DashboardAction): DashboardState => {
  switch (action.type) {
    case 'ADD_COMPONENT':
      return { ...state, components: [...state.components, action.payload] };
    
    case 'UPDATE_COMPONENT':
      return {
        ...state,
        components: state.components.map(comp => 
          comp.id === action.payload.id ? { ...comp, ...action.payload.updates } : comp
        )
      };
    
    case 'REMOVE_COMPONENT':
      return {
        ...state,
        components: state.components.filter(comp => comp.id !== action.payload),
        selectedComponent: state.selectedComponent === action.payload ? null : state.selectedComponent
      };
    
    case 'ADD_FILTER':
      return { ...state, filters: [...state.filters, action.payload] };
    
    case 'UPDATE_FILTER':
      return {
        ...state,
        filters: state.filters.map(filter =>
          filter.id === action.payload.id ? { ...filter, ...action.payload.updates } : filter
        )
      };
    
    case 'REMOVE_FILTER':
      return { ...state, filters: state.filters.filter(filter => filter.id !== action.payload) };
    
    case 'SET_SELECTED_COMPONENT':
      return { ...state, selectedComponent: action.payload };
    
    case 'SET_LAYOUT_MODE':
      return { ...state, layoutMode: action.payload };
    
    case 'UPDATE_GLOBAL_DATA':
      return { ...state, globalData: { ...state.globalData, [action.payload.key]: action.payload.data } };
    
    case 'LOAD_DASHBOARD':
      return action.payload;
    
    default:
      return state;
  }
};

// === STATE ORCHESTRATOR ===

interface StateOrchestratorContextValue {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
  addComponent: (component: Omit<DashboardComponent, 'id'>) => string;
  updateComponent: (id: string, updates: Partial<DashboardComponent>) => void;
  removeComponent: (id: string) => void;
  addFilter: (filter: Omit<FilterCondition, 'id'>) => string;
  updateFilter: (id: string, updates: Partial<FilterCondition>) => void;
  removeFilter: (id: string) => void;
  applyFilters: (data: any[], filters?: FilterCondition[]) => any[];
  getFilteredData: (datasetKey: string) => any[];
  saveDashboard: () => void;
  loadDashboard: (config: string) => void;
  exportDashboard: () => string;
}

const StateOrchestratorContext = React.createContext<StateOrchestratorContextValue | null>(null);

export const StateOrchestrator: React.FC<{ children: React.ReactNode; initialState?: Partial<DashboardState> }> = ({
  children,
  initialState = {}
}) => {
  const [state, dispatch] = useReducer(dashboardReducer, {
    components: [],
    filters: [],
    selectedComponent: null,
    layoutMode: 'view',
    globalData: {
      sales: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        date: new Date(2024, 0, i + 1),
        revenue: Math.random() * 10000 + 5000,
        category: ['Electronics', 'Clothing', 'Books', 'Home'][Math.floor(Math.random() * 4)],
        region: ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)]
      })),
      users: Array.from({ length: 50 }, (_, i) => ({
        id: i,
        signupDate: new Date(2024, 0, i * 2 + 1),
        age: Math.floor(Math.random() * 50) + 18,
        country: ['USA', 'Canada', 'UK', 'Germany', 'France'][Math.floor(Math.random() * 5)],
        plan: ['Basic', 'Pro', 'Enterprise'][Math.floor(Math.random() * 3)]
      }))
    },
    ...initialState
  });

  const addComponent = useCallback((component: Omit<DashboardComponent, 'id'>) => {
    const id = `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    dispatch({ type: 'ADD_COMPONENT', payload: { ...component, id } });
    return id;
  }, []);

  const updateComponent = useCallback((id: string, updates: Partial<DashboardComponent>) => {
    dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates } });
  }, []);

  const removeComponent = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_COMPONENT', payload: id });
  }, []);

  const addFilter = useCallback((filter: Omit<FilterCondition, 'id'>) => {
    const id = `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    dispatch({ type: 'ADD_FILTER', payload: { ...filter, id } });
    return id;
  }, []);

  const updateFilter = useCallback((id: string, updates: Partial<FilterCondition>) => {
    dispatch({ type: 'UPDATE_FILTER', payload: { id, updates } });
  }, []);

  const removeFilter = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_FILTER', payload: id });
  }, []);

  const applyFilters = useCallback((data: any[], filters: FilterCondition[] = state.filters) => {
    return data.filter(item => {
      return filters.every(filter => {
        if (!filter.active) return true;
        
        const fieldValue = item[filter.field];
        const filterValue = filter.value;
        
        switch (filter.operator) {
          case 'equals':
            return fieldValue === filterValue;
          case 'contains':
            return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'greater':
            return fieldValue > filterValue;
          case 'less':
            return fieldValue < filterValue;
          case 'between':
            return fieldValue >= filterValue[0] && fieldValue <= filterValue[1];
          case 'in':
            return Array.isArray(filterValue) && filterValue.includes(fieldValue);
          default:
            return true;
        }
      });
    });
  }, [state.filters]);

  const getFilteredData = useCallback((datasetKey: string) => {
    const data = state.globalData[datasetKey] || [];
    return applyFilters(data);
  }, [state.globalData, applyFilters]);

  const saveDashboard = useCallback(() => {
    const config = JSON.stringify(state, null, 2);
    localStorage.setItem('dashboard-config', config);
  }, [state]);

  const loadDashboard = useCallback((config: string) => {
    try {
      const parsedConfig = JSON.parse(config);
      dispatch({ type: 'LOAD_DASHBOARD', payload: parsedConfig });
    } catch (error) {
      console.error('Failed to load dashboard config:', error);
    }
  }, []);

  const exportDashboard = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const value: StateOrchestratorContextValue = {
    state,
    dispatch,
    addComponent,
    updateComponent,
    removeComponent,
    addFilter,
    updateFilter,
    removeFilter,
    applyFilters,
    getFilteredData,
    saveDashboard,
    loadDashboard,
    exportDashboard
  };

  return (
    <StateOrchestratorContext.Provider value={value}>
      {children}
    </StateOrchestratorContext.Provider>
  );
};

export const useStateOrchestrator = () => {
  const context = React.useContext(StateOrchestratorContext);
  if (!context) {
    throw new Error('useStateOrchestrator must be used within StateOrchestrator');
  }
  return context;
};

// === CHART REGISTRY ===

const BarChart: React.FC<{ data: any[]; config: any }> = ({ data, config }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(data.map((d, i) => i.toString()))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[config.yField || 'revenue']) || 0])
      .range([height, 0]);

    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', (d, i) => xScale(i.toString()) || 0)
      .attr('y', d => yScale(d[config.yField || 'revenue']))
      .attr('width', xScale.bandwidth())
      .attr('height', d => height - yScale(d[config.yField || 'revenue']))
      .attr('fill', config.color || '#4C6EF5');

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));
  }, [data, config]);

  return <svg ref={svgRef} width="100%" height="300" />;
};

const LineChart: React.FC<{ data: any[]; config: any }> = ({ data, config }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, (d, i) => i) as [number, number])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d[config.yField || 'revenue']) as [number, number])
      .range([height, 0]);

    const line = d3.line<any>()
      .x((d, i) => xScale(i))
      .y(d => yScale(d[config.yField || 'revenue']))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', config.color || '#4C6EF5')
      .attr('stroke-width', 2)
      .attr('d', line);

    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', (d, i) => xScale(i))
      .attr('cy', d => yScale(d[config.yField || 'revenue']))
      .attr('r', 3)
      .attr('fill', config.color || '#4C6EF5');

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));
  }, [data, config]);

  return <svg ref={svgRef} width="100%" height="300" />;
};

const PieChart: React.FC<{ data: any[]; config: any }> = ({ data, config }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 400;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 20;

    const g = svg.append('g')
      .attr('transform', `translate(${width/2},${height/2})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    
    const pie = d3.pie<any>()
      .value(d => d[config.yField || 'revenue'])
      .sort(null);

    const path = d3.arc<any>()
      .outerRadius(radius - 10)
      .innerRadius(0);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', path)
      .attr('fill', (d, i) => color(i.toString()));

    arcs.append('text')
      .attr('transform', d => `translate(${path.centroid(d)})`)
      .attr('dy', '.35em')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(d => d.data[config.labelField || 'category']);
  }, [data, config]);

  return <svg ref={svgRef} width="100%" height="300" />;
};

const chartPlugins: ChartPlugin[] = [
  {
    type: 'bar',
    name: 'Bar Chart',
    component: BarChart,
    defaultConfig: { color: '#4C6EF5', yField: 'revenue', labelField: 'category' },
    configSchema: {
      color: { type: 'string', default: '#4C6EF5' },
      yField: { type: 'string', default: 'revenue' },
      labelField: { type: 'string', default: 'category' }
    }
  },
  {
    type: 'line',
    name: 'Line Chart',
    component: LineChart,
    defaultConfig: { color: '#51CF66', yField: 'revenue', xField: 'date' },
    configSchema: {
      color: { type: 'string', default: '#51CF66' },
      yField: { type: 'string', default: 'revenue' },
      xField: { type: 'string', default: 'date' }
    }
  },
  {
    type: 'pie',
    name: 'Pie Chart',
    component: PieChart,
    defaultConfig: { yField: 'revenue', labelField: 'category' },
    configSchema: {
      yField: { type: 'string', default: 'revenue' },
      labelField: { type: 'string', default: 'category' }
    }
  }
];

interface ChartRegistryContextValue {
  plugins: ChartPlugin[];
  registerPlugin: (plugin: ChartPlugin) => void;
  getPlugin: (type: string) => ChartPlugin | undefined;
  createChart: (type: string, config?: Record<string, any>) => DashboardComponent | null;
}

const ChartRegistryContext = React.createContext<ChartRegistryContextValue | null>(null);

export const ChartRegistry: React.FC<{ children: React.ReactNode; initialPlugins?: ChartPlugin[] }> = ({
  children,
  initialPlugins = chartPlugins
}) => {
  const [plugins, setPlugins] = useState<ChartPlugin[]>(initialPlugins);

  const registerPlugin = useCallback((plugin: ChartPlugin) => {
    setPlugins(prev => [...prev.filter(p => p.type !== plugin.type), plugin]);
  }, []);

  const getPlugin = useCallback((type: string) => {
    return plugins.find(p => p.type === type);
  }, [plugins]);

  const createChart = useCallback((type: string, config: Record<string, any> = {}) => {
    const plugin = getPlugin(type);
    if (!plugin) return null;

    const finalConfig = { ...plugin.defaultConfig, ...config };
    
    return {
      id: '',
      type,
      title: plugin.name,
      position: { x: 0, y: 0, w: 6, h: 4 },
      config: finalConfig
    };
  }, [getPlugin]);

  const value: ChartRegistryContextValue = {
    plugins,
    registerPlugin,
    getPlugin,
    createChart
  };

  return (
    <ChartRegistryContext.Provider value={value}>
      {children}
    </ChartRegistryContext.Provider>
  );
};

export const useChartRegistry = () => {
  const context = React.useContext(ChartRegistryContext);
  if (!context) {
    throw new Error('useChartRegistry must be used within ChartRegistry');
  }
  return context;
};

// === FILTER MANAGER ===

interface FilterManagerProps {
  onFiltersChange?: (filters: FilterCondition[]) => void;
}

export const FilterManager: React.FC<FilterManagerProps> = ({ onFiltersChange }) => {
  const { state, addFilter, updateFilter, removeFilter } = useStateOrchestrator();
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [newFilter, setNewFilter] = useState<Partial<FilterCondition>>({
    field: '',
    operator: 'equals',
    value: '',
    active: true
  });

  useEffect(() => {
    onFiltersChange?.(state.filters);
  }, [state.filters, onFiltersChange]);

  const handleAddFilter = () => {
    if (newFilter.field && newFilter.operator && newFilter.value !== '') {
      addFilter(newFilter as Omit<FilterCondition, 'id'>);
      setNewFilter({ field: '', operator: 'equals', value: '', active: true });
      setShowAddFilter(false);
    }
  };

  const availableFields = ['revenue', 'category', 'region', 'date', 'age', 'country', 'plan'];
  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater', label: 'Greater than' },
    { value: 'less', label: 'Less than' },
    { value: 'between', label: 'Between' },
    { value: 'in', label: 'In list' }
  ];

  return (
    <Card>
      <Group justify="space-between" mb="md">
        <Text fw={600}>Filter Manager</Text>
        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => setShowAddFilter(true)}>
          Add Filter
        </Button>
      </Group>

      <Stack gap="xs">
        {state.filters.map(filter => (
          <Paper key={filter.id} p="xs" withBorder>
            <Group justify="space-between">
              <Group gap="xs">
                <Switch
                  size="sm"
                  checked={filter.active}
                  onChange={(event) => updateFilter(filter.id, { active: event.currentTarget.checked })}
                />
                <Badge variant="light" size="sm">{filter.field}</Badge>
                <Text size="sm" c="dimmed">{filter.operator}</Text>
                <Badge variant="outline" size="sm">{String(filter.value)}</Badge>
              </Group>
              <ActionIcon size="sm" variant="subtle" color="red" onClick={() => removeFilter(filter.id)}>
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          </Paper>
        ))}

        {state.filters.length === 0 && (
          <Text size="sm" c="dimmed" ta="center" py="md">No filters active</Text>
        )}
      </Stack>

      <Modal opened={showAddFilter} onClose={() => setShowAddFilter(false)} title="Add Filter">
        <Stack>
          <Select
            label="Field"
            placeholder="Select field"
            data={availableFields.map(field => ({ value: field, label: field }))}
            value={newFilter.field}
            onChange={(value) => setNewFilter(prev => ({ ...prev, field: value || '' }))}
          />
          
          <Select
            label="Operator"
            placeholder="Select operator"
            data={operators}
            value={newFilter.operator}
            onChange={(value) => setNewFilter(prev => ({ ...prev, operator: value as any || 'equals' }))}
          />
          
          <TextInput
            label="Value"
            placeholder="Enter value"
            value={String(newFilter.value)}
            onChange={(event) => setNewFilter(prev => ({ ...prev, value: event.currentTarget.value }))}
          />
          
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setShowAddFilter(false)}>Cancel</Button>
            <Button onClick={handleAddFilter}>Add Filter</Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
};

// === DASHBOARD LAYOUT ===

interface DashboardLayoutProps {
  children?: React.ReactNode;
  gridCols?: number;
  gap?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  gridCols = 12, 
  gap = 'md' 
}) => {
  const { state, updateComponent, removeComponent, dispatch } = useStateOrchestrator();
  const { getPlugin } = useChartRegistry();

  const handleComponentUpdate = (id: string, updates: Partial<DashboardComponent>) => {
    updateComponent(id, updates);
  };

  const handleComponentRemove = (id: string) => {
    removeComponent(id);
  };

  return (
    <div style={{ position: 'relative', minHeight: '400px' }}>
      <Grid gutter={gap}>
        {state.components.map(component => {
          const plugin = getPlugin(component.type);
          if (!plugin) return null;

          const ChartComponent = plugin.component;
          const isSelected = state.selectedComponent === component.id;

          return (
            <Grid.Col
              key={component.id}
              span={component.position.w}
              style={{
                border: isSelected ? '2px solid #4C6EF5' : '1px solid #e9ecef',
                borderRadius: '8px',
                position: 'relative',
                minHeight: `${component.position.h * 80}px`
              }}
              onClick={() => dispatch({ type: 'SET_SELECTED_COMPONENT', payload: component.id })}
            >
              <Card h="100%" p="sm">
                <Group justify="space-between" mb="xs">
                  <Text fw={600} size="sm">{component.title}</Text>
                  <Group gap="xs">
                    <ActionIcon size="xs" variant="subtle">
                      <IconGripVertical size={12} />
                    </ActionIcon>
                    <ActionIcon 
                      size="xs" 
                      variant="subtle" 
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComponentRemove(component.id);
                      }}
                    >
                      <IconTrash size={12} />
                    </ActionIcon>
                  </Group>
                </Group>
                
                <div style={{ height: 'calc(100% - 40px)' }}>
                  <ChartComponent 
                    data={component.data || []} 
                    config={component.config}
                  />
                </div>
              </Card>
            </Grid.Col>
          );
        })}
        
        {children}
      </Grid>
      
      {state.components.length === 0 && (
        <Paper p="xl" ta="center" c="dimmed">
          <Text size="lg" mb="sm">No components added yet</Text>
          <Text size="sm">Add charts and visualizations to build your dashboard</Text>
        </Paper>
      )}
    </div>
  );
};

// === PERFORMANCE MONITOR ===

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    componentCount: 0,
    dataPoints: 0,
    memoryUsage: 0,
    updateFrequency: 0
  });
  
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);
  const startTimeRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);

  const startMeasurement = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const endMeasurement = useCallback(() => {
    const renderTime = performance.now() - startTimeRef.current;
    setMetrics(prev => ({ ...prev, renderTime }));
  }, []);

  const updateMetrics = useCallback((updates: Partial<PerformanceMetrics>) => {
    setMetrics(prev => {
      const newMetrics = { ...prev, ...updates };
      setHistory(prevHistory => {
        const newHistory = [...prevHistory, newMetrics].slice(-50);
        return newHistory;
      });
      return newMetrics;
    });
  }, []);

  const trackUpdate = useCallback(() => {
    updateCountRef.current += 1;
    const now = Date.now();
    const frequency = updateCountRef.current / ((now - (startTimeRef.current || now)) / 1000) || 0;
    updateMetrics({ updateFrequency: frequency });
  }, [updateMetrics]);

  return {
    metrics,
    history,
    startMeasurement,
    endMeasurement,
    updateMetrics,
    trackUpdate
  };
};

// === MAIN DASHBOARD COMPONENT ===

export const InteractiveDashboard: React.FC = () => {
  const { state, addComponent, getFilteredData } = useStateOrchestrator();
  const { plugins, createChart } = useChartRegistry();
  const { metrics, updateMetrics } = usePerformanceMonitor();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showAddChart, setShowAddChart] = useState(false);

  const handleAddChart = (type: string) => {
    const chart = createChart(type);
    if (chart) {
      const salesData = getFilteredData('sales').slice(0, 20);
      const componentId = addComponent({
        ...chart,
        data: salesData
      });
      setShowAddChart(false);
      
      // Update performance metrics
      updateMetrics({
        componentCount: state.components.length + 1,
        dataPoints: salesData.length
      });
    }
  };

  useEffect(() => {
    // Simulate memory usage calculation
    const memoryUsage = state.components.reduce((total, comp) => {
      return total + (comp.data?.length || 0) * 100; // Rough estimate
    }, 0);
    
    updateMetrics({
      componentCount: state.components.length,
      memoryUsage: memoryUsage / 1024 // Convert to KB
    });
  }, [state.components, updateMetrics]);

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Interactive Dashboard</Title>
        <Group>
          <Button 
            leftSection={<IconPlus size={16} />}
            onClick={() => setShowAddChart(true)}
          >
            Add Chart
          </Button>
          <Button variant="outline" leftSection={<IconSettings size={16} />}>
            Settings
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab || ''}>
        <Tabs.List>
          <Tabs.Tab value="dashboard" leftSection={<IconChartBar size={16} />}>
            Dashboard
          </Tabs.Tab>
          <Tabs.Tab value="filters" leftSection={<IconFilter size={16} />}>
            Filters
          </Tabs.Tab>
          <Tabs.Tab value="performance" leftSection={<IconRefresh size={16} />}>
            Performance
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="dashboard" pt="lg">
          <DashboardLayout />
        </Tabs.Panel>

        <Tabs.Panel value="filters" pt="lg">
          <FilterManager />
        </Tabs.Panel>

        <Tabs.Panel value="performance" pt="lg">
          <Card>
            <Title order={3} mb="md">Performance Metrics</Title>
            <Grid>
              <Grid.Col span={6}>
                <Paper p="md" withBorder>
                  <Text size="sm" c="dimmed">Render Time</Text>
                  <Text size="xl" fw={700}>{metrics.renderTime.toFixed(2)}ms</Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={6}>
                <Paper p="md" withBorder>
                  <Text size="sm" c="dimmed">Components</Text>
                  <Text size="xl" fw={700}>{metrics.componentCount}</Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={6}>
                <Paper p="md" withBorder>
                  <Text size="sm" c="dimmed">Data Points</Text>
                  <Text size="xl" fw={700}>{metrics.dataPoints}</Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={6}>
                <Paper p="md" withBorder>
                  <Text size="sm" c="dimmed">Memory Usage</Text>
                  <Text size="xl" fw={700}>{metrics.memoryUsage.toFixed(1)}KB</Text>
                </Paper>
              </Grid.Col>
            </Grid>
          </Card>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={showAddChart} onClose={() => setShowAddChart(false)} title="Add Chart">
        <Stack>
          <Text size="sm" c="dimmed">Choose a chart type to add to your dashboard:</Text>
          {plugins.map(plugin => (
            <Button
              key={plugin.type}
              variant="light"
              fullWidth
              onClick={() => handleAddChart(plugin.type)}
            >
              {plugin.name}
            </Button>
          ))}
        </Stack>
      </Modal>
    </div>
  );
};

// === EXPORT COMPONENT ===

export default function Exercise09() {
  return (
    <StateOrchestrator>
      <ChartRegistry>
        <InteractiveDashboard />
      </ChartRegistry>
    </StateOrchestrator>
  );
}