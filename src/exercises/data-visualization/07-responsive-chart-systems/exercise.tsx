import React, { useRef, useEffect, useCallback, useState, useMemo, createContext, useContext } from 'react';
import { Container, Paper, Title, Group, Badge, Text, Stack, Grid, Button, Select, Switch, Slider, Tabs, ActionIcon } from '@mantine/core';
import { IconDeviceMobile, IconDeviceDesktop, IconDeviceTablet, IconRotate, IconAccessible, IconTouch } from '@tabler/icons-react';
import * as d3 from 'd3';

// Responsive Chart System Types
interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  touchEnabled: boolean;
  pixelRatio: number;
  capabilities: DeviceCapabilities;
}

interface DeviceCapabilities {
  hover: boolean;
  pointer: 'none' | 'coarse' | 'fine';
  anyHover: boolean;
  anyPointer: 'none' | 'coarse' | 'fine';
  reducedMotion: boolean;
  highContrast: boolean;
}

interface BreakpointDefinition {
  name: string;
  minWidth?: number;
  maxWidth?: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  features: string[];
  chartConfig: ResponsiveChartConfig;
}

interface ResponsiveChartConfig {
  margin: { top: number; right: number; bottom: number; left: number };
  fontSize: number;
  lineHeight: number;
  spacing: number;
  interactionMode: 'touch' | 'mouse' | 'hybrid';
  simplifyData: boolean;
  showLabels: boolean;
  animationDuration: number;
}

interface TouchGesture {
  type: 'tap' | 'double-tap' | 'pan' | 'pinch' | 'swipe';
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  scale: number;
  velocity: number;
  direction: 'up' | 'down' | 'left' | 'right' | 'none';
}

const ResponsiveContext = createContext<{
  deviceInfo: DeviceInfo;
  currentBreakpoint: BreakpointDefinition;
  breakpoints: BreakpointDefinition[];
  orientation: 'portrait' | 'landscape';
  touchEnabled: boolean;
  reducedMotion: boolean;
  updateDeviceInfo: (info: Partial<DeviceInfo>) => void;
  registerChart: (id: string, element: Element) => void;
  unregisterChart: (id: string) => void;
} | null>(null);

// TODO: Implement ResponsiveProvider component
// Requirements:
// - Create comprehensive device detection with capability assessment
// - Implement breakpoint management with intelligent transitions
// - Provide responsive context with coordinated state management
// - Handle media query coordination and preference detection
// - Include performance optimization and resource management
export const ResponsiveProvider: React.FC<{
  children: React.ReactNode;
  breakpoints?: BreakpointDefinition[];
}> = ({ children, breakpoints: customBreakpoints }) => {
  // TODO: Implement responsive provider with device detection
  const contextValue = {
    deviceInfo: {
      type: 'desktop' as const,
      width: 1200,
      height: 800,
      orientation: 'landscape' as const,
      touchEnabled: false,
      pixelRatio: 1,
      capabilities: {
        hover: true,
        pointer: 'fine' as const,
        anyHover: true,
        anyPointer: 'fine' as const,
        reducedMotion: false,
        highContrast: false
      }
    },
    currentBreakpoint: {
      name: 'desktop',
      deviceType: 'desktop' as const,
      features: ['mouse', 'large-screen'],
      chartConfig: {
        margin: { top: 30, right: 30, bottom: 60, left: 80 },
        fontSize: 16,
        lineHeight: 1.6,
        spacing: 16,
        interactionMode: 'mouse' as const,
        simplifyData: false,
        showLabels: true,
        animationDuration: 400
      }
    },
    breakpoints: [],
    orientation: 'landscape' as const,
    touchEnabled: false,
    reducedMotion: false,
    updateDeviceInfo: () => {},
    registerChart: () => {},
    unregisterChart: () => {}
  };

  return (
    <ResponsiveContext.Provider value={contextValue}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export const useResponsiveContext = () => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsiveContext must be used within ResponsiveProvider');
  }
  return context;
};

// TODO: Implement useChartContainer hook
// Requirements:
// - Create intelligent chart container with adaptive sizing
// - Implement ResizeObserver integration for efficient resize handling
// - Add aspect ratio management and constraint handling
// - Include visibility detection and performance optimization
// - Handle chart registration and lifecycle management
export const useChartContainer = (
  containerId: string,
  options: {
    aspectRatio?: number;
    minHeight?: number;
    maxHeight?: number;
    maintainAspectRatio?: boolean;
  } = {}
) => {
  // TODO: Implement chart container functionality
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentBreakpoint } = useResponsiveContext();
  
  return {
    containerRef,
    dimensions: { width: 800, height: 400 },
    isVisible: true,
    deviceInfo: {
      type: 'desktop' as const,
      width: 1200,
      height: 800,
      orientation: 'landscape' as const,
      touchEnabled: false,
      pixelRatio: 1,
      capabilities: {
        hover: true,
        pointer: 'fine' as const,
        anyHover: true,
        anyPointer: 'fine' as const,
        reducedMotion: false,
        highContrast: false
      }
    },
    currentBreakpoint,
    chartConfig: currentBreakpoint.chartConfig,
    recalculateDimensions: () => {}
  };
};

// TODO: Implement useBreakpointManager hook
// Requirements:
// - Create intelligent breakpoint detection and management
// - Implement device type categorization and feature detection
// - Add breakpoint value resolution and conditional rendering
// - Include performance optimization and smooth transitions
// - Handle responsive configuration and adaptation
export const useBreakpointManager = () => {
  // TODO: Implement breakpoint management functionality
  const { currentBreakpoint, deviceInfo } = useResponsiveContext();
  
  return {
    currentBreakpoint,
    breakpoints: [],
    deviceInfo,
    isBreakpoint: () => false,
    isDevice: () => false,
    hasFeature: () => false,
    getBreakpointValue: () => undefined
  };
};

// TODO: Implement useOrientationHandler hook
// Requirements:
// - Create seamless orientation change detection and handling
// - Implement smooth transitions with layout preservation
// - Add state management with orientation memory
// - Include performance optimization with debounced updates
// - Handle cross-platform compatibility and edge cases
export const useOrientationHandler = () => {
  // TODO: Implement orientation handling functionality
  const { orientation } = useResponsiveContext();
  
  return {
    orientation,
    isTransitioning: false,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  };
};

// TODO: Implement useTouchInteractions hook
// Requirements:
// - Create comprehensive touch gesture recognition system
// - Implement pan, pinch, swipe, and tap detection
// - Add velocity calculation and direction analysis
// - Include multi-touch coordination and gesture thresholds
// - Handle performance optimization and event delegation
export const useTouchInteractions = (
  elementRef: React.RefObject<HTMLElement>,
  options: {
    enablePan?: boolean;
    enablePinch?: boolean;
    enableSwipe?: boolean;
    threshold?: number;
  } = {}
) => {
  // TODO: Implement touch interaction functionality
  return {
    gesture: null,
    isInteracting: false,
    touchEnabled: true
  };
};

// TODO: Implement ResponsiveChart component
// Requirements:
// - Create adaptive chart rendering with D3.js integration
// - Implement responsive sizing and aspect ratio management
// - Add touch interaction support and gesture handling
// - Include accessibility features and ARIA compliance
// - Handle performance optimization and efficient rendering
export const ResponsiveChart: React.FC<{
  data: any[];
  type: 'bar' | 'line' | 'area';
  title?: string;
  aspectRatio?: number;
}> = ({ data, type, title, aspectRatio = 16 / 9 }) => {
  // TODO: Implement responsive chart component
  const chartId = useMemo(() => 'responsive-chart-' + Math.random().toString(36).substr(2, 9), []);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const {
    containerRef,
    dimensions,
    chartConfig
  } = useChartContainer(chartId, {
    aspectRatio,
    maintainAspectRatio: true
  });

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '2px dashed #dee2e6'
      }}
    >
      <Text c="dimmed" ta="center">
        Responsive {type} chart with adaptive rendering will appear here
      </Text>
    </div>
  );
};

// Data Generation Utilities
const generateChartData = (count: number = 10) => {
  return Array.from({ length: count }, (_, i) => ({
    label: 'Item ' + (i + 1),
    value: Math.random() * 100 + 10
  }));
};

// Exercise Component
const ResponsiveChartSystemsExercise: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('container');
  const [chartData, setChartData] = useState(() => generateChartData(8));
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  return (
    <ResponsiveProvider>
      <Container size="xl" py="xl">
        <ResponsiveSystemDemo 
          chartData={chartData}
          chartType={chartType}
          aspectRatio={aspectRatio}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setChartType={setChartType}
          setAspectRatio={setAspectRatio}
          onRegenerateData={() => setChartData(generateChartData(8))}
        />
      </Container>
    </ResponsiveProvider>
  );
};

const ResponsiveSystemDemo: React.FC<{
  chartData: any[];
  chartType: 'bar' | 'line' | 'area';
  aspectRatio: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setChartType: (type: 'bar' | 'line' | 'area') => void;
  setAspectRatio: (ratio: number) => void;
  onRegenerateData: () => void;
}> = ({ 
  chartData, 
  chartType, 
  aspectRatio, 
  activeTab, 
  setActiveTab,
  setChartType,
  setAspectRatio,
  onRegenerateData 
}) => {
  const { deviceInfo, currentBreakpoint, orientation } = useBreakpointManager();

  return (
    <Stack gap="xl">
      <div>
        <Title order={1} size="h2" mb="md">
          Responsive Chart Systems Exercise
        </Title>
        <Text c="dimmed">
          Build adaptive chart systems that work seamlessly across all devices with intelligent
          breakpoint management, touch interactions, and accessibility features.
        </Text>
      </div>

      <Paper p="md" withBorder>
        <Title order={3} size="h4" mb="md">Your Task</Title>
        <Text size="sm" mb="md">
          Implement responsive chart systems including device detection, breakpoint management, 
          touch interactions, and orientation handling for optimal cross-device experiences.
        </Text>
        
        <Stack gap="sm">
          <Text size="sm">🎯 Implement <code>useChartContainer</code> with ResizeObserver integration</Text>
          <Text size="sm">🎯 Create <code>useBreakpointManager</code> with intelligent device detection</Text>
          <Text size="sm">🎯 Build <code>useOrientationHandler</code> with smooth transitions</Text>
          <Text size="sm">🎯 Develop <code>useTouchInteractions</code> with gesture recognition</Text>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Title order={3} size="h4" mb="md">Device Information</Title>
        <Grid>
          <Grid.Col span={4}>
            <Group gap="xs">
              {deviceInfo.type === 'mobile' && <IconDeviceMobile size={20} />}
              {deviceInfo.type === 'tablet' && <IconDeviceTablet size={20} />}
              {deviceInfo.type === 'desktop' && <IconDeviceDesktop size={20} />}
              <Text size="sm" fw={500}>{deviceInfo.type.charAt(0).toUpperCase() + deviceInfo.type.slice(1)}</Text>
            </Group>
          </Grid.Col>
          <Grid.Col span={4}>
            <Group gap="xs">
              <IconRotate size={20} />
              <Text size="sm">{orientation} ({deviceInfo.width} × {deviceInfo.height})</Text>
            </Group>
          </Grid.Col>
          <Grid.Col span={4}>
            <Group gap="xs">
              <IconTouch size={20} />
              <Text size="sm">{deviceInfo.touchEnabled ? 'Touch Enabled' : 'Mouse Only'}</Text>
            </Group>
          </Grid.Col>
        </Grid>
        <Text size="xs" c="dimmed" mt="sm">
          Current Breakpoint: {currentBreakpoint.name} | Features: {currentBreakpoint.features.join(', ')}
        </Text>
      </Paper>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="container">Chart Container</Tabs.Tab>
          <Tabs.Tab value="responsive">Responsive Features</Tabs.Tab>
          <Tabs.Tab value="touch">Touch Interactions</Tabs.Tab>
          <Tabs.Tab value="accessibility">Accessibility</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="container" pt="md">
          <Paper p="md" withBorder style={{ minHeight: '400px' }}>
            <Group justify="space-between" mb="md">
              <Title order={3} size="h4">Responsive Chart Container</Title>
              <Group gap="xs">
                <Select
                  value={chartType}
                  onChange={setChartType}
                  data={[
                    { value: 'bar', label: 'Bar Chart' },
                    { value: 'line', label: 'Line Chart' },
                    { value: 'area', label: 'Area Chart' }
                  ]}
                />
                <Button variant="light" onClick={onRegenerateData}>
                  Regenerate Data
                </Button>
                <Badge color="orange" variant="light">
                  Implementation Required
                </Badge>
              </Group>
            </Group>
            
            <ResponsiveChart
              data={chartData}
              type={chartType}
              title="Responsive Visualization"
              aspectRatio={aspectRatio}
            />
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="responsive" pt="md">
          <Paper p="md" withBorder style={{ minHeight: '400px' }}>
            <Group justify="space-between" mb="md">
              <Title order={3} size="h4">Responsive Features</Title>
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
                Responsive feature demonstration will appear here
              </Text>
            </div>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="touch" pt="md">
          <Paper p="md" withBorder style={{ minHeight: '400px' }}>
            <Group justify="space-between" mb="md">
              <Title order={3} size="h4">Touch Interactions</Title>
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
                Touch interaction demo will appear here
              </Text>
            </div>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="accessibility" pt="md">
          <Paper p="md" withBorder style={{ minHeight: '400px' }}>
            <Group justify="space-between" mb="md">
              <Title order={3} size="h4">Accessibility Features</Title>
              <Group gap="xs">
                <IconAccessible size={20} />
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
                Accessibility feature demonstration will appear here
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
              <Badge color="red" variant="light" fullWidth>useChartContainer: Not Implemented</Badge>
              <Badge color="red" variant="light" fullWidth>useBreakpointManager: Not Implemented</Badge>
            </Stack>
          </Grid.Col>
          <Grid.Col span={6}>
            <Stack gap="xs">
              <Badge color="red" variant="light" fullWidth>useOrientationHandler: Not Implemented</Badge>
              <Badge color="red" variant="light" fullWidth>useTouchInteractions: Not Implemented</Badge>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>
    </Stack>
  );
};

export default ResponsiveChartSystemsExercise;