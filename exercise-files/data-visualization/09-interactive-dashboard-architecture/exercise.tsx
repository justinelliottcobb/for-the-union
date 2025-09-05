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
  // TODO: Implement reducer logic for all dashboard actions
  // Handle component management (add, update, remove)
  // Handle filter management (add, update, remove)
  // Handle layout mode changes and component selection
  // Handle global data updates and dashboard loading
  return state;
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
  // TODO: Initialize dashboard state with useReducer
  // Create default global data (sales, users, etc.)
  // Implement component management functions (add, update, remove)
  // Implement filter management functions (add, update, remove)
  // Implement data filtering logic with multiple operators
  // Add dashboard persistence (save, load, export)

  const addComponent = useCallback((component: Omit<DashboardComponent, 'id'>) => {
    // TODO: Generate unique ID and dispatch ADD_COMPONENT action
    return '';
  }, []);

  const updateComponent = useCallback((id: string, updates: Partial<DashboardComponent>) => {
    // TODO: Dispatch UPDATE_COMPONENT action
  }, []);

  const removeComponent = useCallback((id: string) => {
    // TODO: Dispatch REMOVE_COMPONENT action
  }, []);

  const addFilter = useCallback((filter: Omit<FilterCondition, 'id'>) => {
    // TODO: Generate unique ID and dispatch ADD_FILTER action
    return '';
  }, []);

  const updateFilter = useCallback((id: string, updates: Partial<FilterCondition>) => {
    // TODO: Dispatch UPDATE_FILTER action
  }, []);

  const removeFilter = useCallback((id: string) => {
    // TODO: Dispatch REMOVE_FILTER action
  }, []);

  const applyFilters = useCallback((data: any[], filters: FilterCondition[] = []) => {
    // TODO: Implement filter application logic
    // Support equals, contains, greater, less, between, in operators
    // Handle date comparisons and string operations
    return data;
  }, []);

  const getFilteredData = useCallback((datasetKey: string) => {
    // TODO: Get data from global state and apply active filters
    return [];
  }, []);

  const saveDashboard = useCallback(() => {
    // TODO: Save dashboard configuration to localStorage
  }, []);

  const loadDashboard = useCallback((config: string) => {
    // TODO: Parse and load dashboard configuration
  }, []);

  const exportDashboard = useCallback(() => {
    // TODO: Export dashboard configuration as JSON string
    return '';
  }, []);

  return (
    <StateOrchestratorContext.Provider value={{}}>
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
    // TODO: Implement D3.js bar chart
    // Create scales for x and y axes
    // Draw bars with data binding
    // Add axes with proper labels
    // Apply configuration (colors, fields, etc.)
  }, [data, config]);

  return <svg ref={svgRef} width="100%" height="300" />;
};

const LineChart: React.FC<{ data: any[]; config: any }> = ({ data, config }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // TODO: Implement D3.js line chart
    // Create scales for x and y axes
    // Draw line path with data binding
    // Add dots for data points
    // Add axes with proper labels
  }, [data, config]);

  return <svg ref={svgRef} width="100%" height="300" />;
};

const PieChart: React.FC<{ data: any[]; config: any }> = ({ data, config }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // TODO: Implement D3.js pie chart
    // Create pie layout and arc generator
    // Draw pie slices with colors
    // Add labels for each slice
    // Apply configuration settings
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
  // TODO: Add more chart types (line, pie, etc.)
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
  // TODO: Implement chart registry with plugin management
  // Support dynamic plugin registration
  // Provide plugin lookup and chart creation functions
  // Handle plugin configuration and validation

  const registerPlugin = useCallback((plugin: ChartPlugin) => {
    // TODO: Add or update plugin in registry
  }, []);

  const getPlugin = useCallback((type: string) => {
    // TODO: Find plugin by type
    return undefined;
  }, []);

  const createChart = useCallback((type: string, config: Record<string, any> = {}) => {
    // TODO: Create chart component from plugin
    // Merge default config with provided config
    // Return dashboard component structure
    return null;
  }, []);

  return (
    <ChartRegistryContext.Provider value={{}}>
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
  // TODO: Implement filter management UI
  // Show active filters with toggle switches
  // Provide filter creation modal
  // Support different filter operators
  // Handle filter updates and deletion

  return (
    <Card>
      <Group justify="space-between" mb="md">
        <Text fw={600}>Filter Manager</Text>
        <Button size="xs" leftSection={<IconPlus size={14} />}>
          Add Filter
        </Button>
      </Group>

      <Stack gap="xs">
        {/* TODO: Display active filters */}
        <Text size="sm" c="dimmed" ta="center" py="md">No filters active</Text>
      </Stack>

      {/* TODO: Add filter creation modal */}
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
  // TODO: Implement dashboard layout management
  // Display components in responsive grid
  // Handle component selection and removal
  // Support drag-and-drop positioning
  // Show empty state when no components

  return (
    <div style={{ position: 'relative', minHeight: '400px' }}>
      <Grid gutter={gap}>
        {/* TODO: Render dashboard components */}
        {children}
      </Grid>
      
      <Paper p="xl" ta="center" c="dimmed">
        <Text size="lg" mb="sm">No components added yet</Text>
        <Text size="sm">Add charts and visualizations to build your dashboard</Text>
      </Paper>
    </div>
  );
};

// === PERFORMANCE MONITOR ===

export const usePerformanceMonitor = () => {
  // TODO: Implement performance monitoring hook
  // Track render times, component counts, data points
  // Monitor memory usage and update frequencies
  // Provide measurement functions for timing
  // Maintain performance history

  const startMeasurement = useCallback(() => {
    // TODO: Start performance measurement
  }, []);

  const endMeasurement = useCallback(() => {
    // TODO: End measurement and update metrics
  }, []);

  const updateMetrics = useCallback((updates: Partial<PerformanceMetrics>) => {
    // TODO: Update performance metrics
  }, []);

  const trackUpdate = useCallback(() => {
    // TODO: Track update frequency
  }, []);

  return {
    metrics: {
      renderTime: 0,
      componentCount: 0,
      dataPoints: 0,
      memoryUsage: 0,
      updateFrequency: 0
    },
    history: [],
    startMeasurement,
    endMeasurement,
    updateMetrics,
    trackUpdate
  };
};

// === MAIN DASHBOARD COMPONENT ===

export const InteractiveDashboard: React.FC = () => {
  // TODO: Implement main dashboard interface
  // Integrate all components (layout, filters, performance)
  // Handle chart addition and configuration
  // Provide tabbed interface for different views
  // Show performance metrics and controls

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Interactive Dashboard</Title>
        <Group>
          <Button leftSection={<IconPlus size={16} />}>
            Add Chart
          </Button>
          <Button variant="outline" leftSection={<IconSettings size={16} />}>
            Settings
          </Button>
        </Group>
      </Group>

      <Tabs defaultValue="dashboard">
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
            {/* TODO: Display performance metrics */}
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* TODO: Add chart creation modal */}
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