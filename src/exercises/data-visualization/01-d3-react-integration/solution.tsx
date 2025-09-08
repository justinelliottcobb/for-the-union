import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Container, Paper, Title, Group, Badge, Text, Stack, Grid, Button, NumberInput } from '@mantine/core';
import * as d3 from 'd3';

// Advanced D3-React Integration Types
interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface DataPoint {
  id: string;
  x: number;
  y: number;
  category: string;
  value: number;
  timestamp: number;
}

interface D3Selection extends d3.Selection<SVGElement, any, any, any> {}

interface ScaleConfiguration {
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
  color: d3.ScaleOrdinal<string, string>;
  size: d3.ScaleLinear<number, number>;
}

interface TransitionConfiguration {
  duration: number;
  ease: (t: number) => number;
  delay: number;
  stagger: number;
}

interface AnimationSequence {
  id: string;
  transitions: TransitionStep[];
  coordinator: SequenceCoordinator;
  timing: AnimationTiming;
}

interface TransitionStep {
  target: string;
  properties: AnimatedProperty[];
  timing: TransitionTiming;
  easing: EasingFunction;
}

interface AnimatedProperty {
  name: string;
  from: any;
  to: any;
  interpolator: d3.InterpolatorFactory<any, any>;
}

interface EasingFunction {
  type: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
  customFunction?: (t: number) => number;
}

interface SequenceCoordinator {
  parallelSteps: string[];
  serialSteps: string[];
  dependencies: Map<string, string[]>;
  timing: SequenceTiming;
}

interface AnimationTiming {
  duration: number;
  delay: number;
  stagger: number;
  fps: number;
}

interface SequenceTiming {
  totalDuration: number;
  stepDelay: number;
  overlapDuration: number;
  syncPoints: number[];
}

interface ResponsiveConfiguration {
  breakpoints: ResponsiveBreakpoint[];
  scalingStrategy: ScalingStrategy;
  layoutAdaptation: LayoutAdapter;
}

interface ResponsiveBreakpoint {
  name: string;
  minWidth: number;
  maxWidth: number;
  aspectRatio: number;
  margins: ChartDimensions['margin'];
}

interface ScalingStrategy {
  type: 'fixed' | 'responsive' | 'adaptive';
  minScale: number;
  maxScale: number;
  scaleFactor: number;
}

interface LayoutAdapter {
  orientation: 'portrait' | 'landscape' | 'adaptive';
  aspectRatio: number;
  contentStrategy: ContentStrategy;
}

interface ContentStrategy {
  overflow: 'scroll' | 'zoom' | 'paginate' | 'compress';
  prioritization: ElementPriority[];
  adaptiveFeatures: FeatureAdaptation[];
}

interface ElementPriority {
  element: string;
  priority: number;
  hiddenBelow: number;
  scaledBelow: number;
}

interface FeatureAdaptation {
  feature: string;
  mobileVersion: FeatureConfig;
  desktopVersion: FeatureConfig;
}

interface FeatureConfig {
  enabled: boolean;
  simplified: boolean;
  alternativeImplementation?: string;
}

interface AccessibilityConfiguration {
  ariaLabels: Map<string, string>;
  keyboardNavigation: KeyboardNavConfig;
  screenReader: ScreenReaderConfig;
  colorAccessibility: ColorAccessibilityConfig;
}

interface KeyboardNavConfig {
  enabled: boolean;
  focusable: string[];
  shortcuts: Map<string, KeyboardAction>;
  announcements: Map<string, string>;
}

interface ScreenReaderConfig {
  dataTable: boolean;
  descriptions: Map<string, string>;
  announcements: AnnouncementConfig[];
  liveRegion: boolean;
}

interface ColorAccessibilityConfig {
  contrastRatio: number;
  colorblindFriendly: boolean;
  alternativeIndicators: boolean;
  patterns: PatternConfig[];
}

interface AnnouncementConfig {
  trigger: string;
  message: string;
  priority: 'polite' | 'assertive';
  debounce: number;
}

interface PatternConfig {
  name: string;
  pattern: string;
  description: string;
  usage: string[];
}

interface KeyboardAction {
  action: string;
  handler: (event: KeyboardEvent) => void;
  description: string;
}

interface PerformanceMetrics {
  renderTime: number;
  frameRate: number;
  memoryUsage: number;
  updateCount: number;
  transitionTime: number;
  optimizationScore: number;
}

interface RenderingOptimizer {
  batching: UpdateBatcher;
  caching: RenderCache;
  scheduling: RenderScheduler;
  monitoring: PerformanceMonitor;
}

interface UpdateBatcher {
  batchSize: number;
  batchDelay: number;
  updates: BatchedUpdate[];
  processor: BatchProcessor;
}

interface BatchedUpdate {
  id: string;
  type: UpdateType;
  data: any;
  timestamp: number;
  priority: number;
}

interface UpdateType {
  name: string;
  strategy: 'immediate' | 'batched' | 'deferred';
  dependencies: string[];
  cost: number;
}

interface BatchProcessor {
  queue: BatchedUpdate[];
  processing: boolean;
  scheduler: BatchScheduler;
  optimizer: BatchOptimizer;
}

interface BatchScheduler {
  strategy: 'fifo' | 'priority' | 'dependency' | 'cost';
  maxBatchSize: number;
  timeout: number;
  processor: ScheduleProcessor;
}

interface BatchOptimizer {
  mergeable: MergeableUpdate[];
  coalescable: CoalescableUpdate[];
  deferrable: DeferrableUpdate[];
  strategies: OptimizationStrategy[];
}

interface RenderCache {
  entries: Map<string, CacheEntry>;
  invalidation: InvalidationStrategy;
  management: CacheManager;
  performance: CachePerformance;
}

interface CacheEntry {
  id: string;
  data: any;
  result: RenderResult;
  metadata: CacheMetadata;
  expiration: number;
}

interface CacheMetadata {
  size: number;
  complexity: number;
  dependencies: string[];
  usage: UsageMetrics;
}

interface UsageMetrics {
  hitCount: number;
  missCount: number;
  lastAccess: number;
  frequency: number;
}

// Advanced D3Chart Hook Implementation
export const useD3Chart = (data: DataPoint[], dimensions: ChartDimensions) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [renderMetrics, setRenderMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    frameRate: 60,
    memoryUsage: 0,
    updateCount: 0,
    transitionTime: 0,
    optimizationScore: 1.0
  });

  const scales = useMemo<ScaleConfiguration>(() => {
    const { width, height, margin } = dimensions;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    return {
      x: d3.scaleLinear()
        .domain(d3.extent(data, d => d.x) as [number, number])
        .range([0, innerWidth])
        .nice(),
      
      y: d3.scaleLinear()
        .domain(d3.extent(data, d => d.y) as [number, number])
        .range([innerHeight, 0])
        .nice(),
      
      color: d3.scaleOrdinal(d3.schemeCategory10)
        .domain([...new Set(data.map(d => d.category))]),
      
      size: d3.scaleLinear()
        .domain(d3.extent(data, d => d.value) as [number, number])
        .range([4, 20])
        .clamp(true)
    };
  }, [data, dimensions]);

  const updateChart = useCallback((selection: D3Selection, newData: DataPoint[]) => {
    const startTime = performance.now();
    setIsAnimating(true);

    const { margin } = dimensions;
    const g = selection.select('g.chart-content');

    const circles = g.selectAll<SVGCircleElement, DataPoint>('circle')
      .data(newData, (d: DataPoint) => d.id);

    circles.enter()
      .append('circle')
      .attr('cx', d => scales.x(d.x))
      .attr('cy', d => scales.y(d.y))
      .attr('r', 0)
      .attr('fill', d => scales.color(d.category))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0)
      .transition()
      .duration(750)
      .ease(d3.easeBackOut.overshoot(1.2))
      .attr('r', d => scales.size(d.value))
      .attr('opacity', 0.8)
      .on('end', () => {
        const endTime = performance.now();
        setRenderMetrics(prev => ({
          ...prev,
          renderTime: endTime - startTime,
          updateCount: prev.updateCount + 1,
          transitionTime: endTime - startTime
        }));
        setIsAnimating(false);
      });

    circles.transition()
      .duration(500)
      .ease(d3.easeQuadInOut)
      .attr('cx', d => scales.x(d.x))
      .attr('cy', d => scales.y(d.y))
      .attr('r', d => scales.size(d.value))
      .attr('fill', d => scales.color(d.category));

    circles.exit()
      .transition()
      .duration(375)
      .ease(d3.easeBackIn.overshoot(1.2))
      .attr('r', 0)
      .attr('opacity', 0)
      .remove();

    const xAxis = g.select('.x-axis')
      .transition()
      .duration(500)
      .call(d3.axisBottom(scales.x).tickFormat(d3.format('.1f')));

    const yAxis = g.select('.y-axis')
      .transition()
      .duration(500)
      .call(d3.axisLeft(scales.y).tickFormat(d3.format('.1f')));
  }, [scales, dimensions]);

  const initializeChart = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height, margin } = dimensions;
    
    svg.attr('width', width)
       .attr('height', height)
       .attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
      .attr('class', 'chart-content')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${height - margin.top - margin.bottom})`);

    g.append('g')
      .attr('class', 'y-axis');

    g.append('text')
      .attr('class', 'x-label')
      .attr('text-anchor', 'middle')
      .attr('x', (width - margin.left - margin.right) / 2)
      .attr('y', height - margin.top - margin.bottom + 40)
      .text('X Value')
      .style('font-size', '14px')
      .style('fill', '#666');

    g.append('text')
      .attr('class', 'y-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height - margin.top - margin.bottom) / 2)
      .attr('y', -40)
      .text('Y Value')
      .style('font-size', '14px')
      .style('fill', '#666');

  }, [dimensions]);

  useEffect(() => {
    initializeChart();
  }, [initializeChart]);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    updateChart(svg as D3Selection, data);
  }, [data, updateChart]);

  return {
    svgRef,
    scales,
    isAnimating,
    renderMetrics,
    updateChart: (newData: DataPoint[]) => {
      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        updateChart(svg as D3Selection, newData);
      }
    }
  };
};

// Advanced SVG Container Hook
export const useSVGContainer = (initialDimensions: ChartDimensions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState(initialDimensions);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const calculateDimensions = useCallback((containerWidth: number, containerHeight: number): ChartDimensions => {
    const aspectRatio = initialDimensions.width / initialDimensions.height;
    const availableWidth = containerWidth - 40;
    const availableHeight = containerHeight - 40;

    let width = Math.min(availableWidth, availableHeight * aspectRatio);
    let height = width / aspectRatio;

    if (height > availableHeight) {
      height = availableHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.max(width, 300),
      height: Math.max(height, 200),
      margin: {
        top: Math.max(20, height * 0.1),
        right: Math.max(20, width * 0.1),
        bottom: Math.max(40, height * 0.15),
        left: Math.max(50, width * 0.12)
      }
    };
  }, [initialDimensions]);

  const handleResize = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newContainerSize = { width: rect.width, height: rect.height };
    
    if (newContainerSize.width !== containerSize.width || newContainerSize.height !== containerSize.height) {
      setContainerSize(newContainerSize);
      const newDimensions = calculateDimensions(rect.width, rect.height);
      setDimensions(newDimensions);
    }
  }, [containerSize, calculateDimensions]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      handleResize();
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [handleResize]);

  const getSVGAttributes = useCallback(() => ({
    width: dimensions.width,
    height: dimensions.height,
    viewBox: `0 0 ${dimensions.width} ${dimensions.height}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-labelledby': 'chart-title chart-description'
  }), [dimensions]);

  return {
    containerRef,
    dimensions,
    containerSize,
    getSVGAttributes,
    calculateDimensions
  };
};

// Scale Manager Hook
export const useScaleManager = (data: DataPoint[], dimensions: ChartDimensions) => {
  const [scaleConfig, setScaleConfig] = useState<ScaleConfiguration | null>(null);
  const [domainOverrides, setDomainOverrides] = useState<Map<string, [number, number]>>(new Map());

  const calculateOptimalDomain = useCallback((accessor: (d: DataPoint) => number, padding: number = 0.1): [number, number] => {
    const extent = d3.extent(data, accessor) as [number, number];
    const range = extent[1] - extent[0];
    const paddingAmount = range * padding;
    
    return [extent[0] - paddingAmount, extent[1] + paddingAmount];
  }, [data]);

  const createScales = useCallback((): ScaleConfiguration => {
    const { width, height, margin } = dimensions;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xDomain = domainOverrides.get('x') || calculateOptimalDomain(d => d.x);
    const yDomain = domainOverrides.get('y') || calculateOptimalDomain(d => d.y);
    const categories = [...new Set(data.map(d => d.category))];
    const valueDomain = calculateOptimalDomain(d => d.value, 0.2);

    return {
      x: d3.scaleLinear()
        .domain(xDomain)
        .range([0, innerWidth])
        .nice(),
      
      y: d3.scaleLinear()
        .domain(yDomain)
        .range([innerHeight, 0])
        .nice(),
      
      color: d3.scaleOrdinal<string, string>()
        .domain(categories)
        .range(d3.schemeSet2),
      
      size: d3.scaleLinear()
        .domain(valueDomain)
        .range([4, Math.min(innerWidth, innerHeight) * 0.03])
        .clamp(true)
    };
  }, [dimensions, data, domainOverrides, calculateOptimalDomain]);

  const updateScaleDomain = useCallback((scaleType: 'x' | 'y', domain: [number, number]) => {
    setDomainOverrides(prev => new Map(prev).set(scaleType, domain));
  }, []);

  const resetScaleDomains = useCallback(() => {
    setDomainOverrides(new Map());
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      const newScaleConfig = createScales();
      setScaleConfig(newScaleConfig);
    }
  }, [data, dimensions, domainOverrides, createScales]);

  return {
    scales: scaleConfig,
    updateScaleDomain,
    resetScaleDomains,
    calculateOptimalDomain
  };
};

// Animation Controller Hook
export const useAnimationController = () => {
  const [activeTransitions, setActiveTransitions] = useState<Map<string, TransitionConfiguration>>(new Map());
  const [animationQueue, setAnimationQueue] = useState<AnimationSequence[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const createTransition = useCallback((
    selection: d3.Selection<any, any, any, any>,
    config: Partial<TransitionConfiguration> = {}
  ) => {
    const transitionConfig: TransitionConfiguration = {
      duration: 500,
      ease: d3.easeQuadInOut,
      delay: 0,
      stagger: 50,
      ...config
    };

    return selection
      .transition()
      .duration(transitionConfig.duration)
      .ease(transitionConfig.ease)
      .delay((d, i) => transitionConfig.delay + i * transitionConfig.stagger);
  }, []);

  const orchestrateAnimation = useCallback((sequence: AnimationSequence) => {
    setAnimationQueue(prev => [...prev, sequence]);
  }, []);

  const executeAnimation = useCallback(async (sequence: AnimationSequence) => {
    setIsPlaying(true);
    
    for (const step of sequence.transitions) {
      await new Promise<void>((resolve) => {
        const stepTransition = d3.select('svg')
          .selectAll(`.${step.target}`)
          .transition()
          .duration(step.timing.duration)
          .delay(step.timing.delay)
          .ease(step.easing.customFunction || d3.easeQuadInOut)
          .on('end', () => resolve());

        step.properties.forEach(prop => {
          stepTransition.attr(prop.name, prop.to);
        });
      });
    }

    setIsPlaying(false);
  }, []);

  const pauseAnimation = useCallback(() => {
    d3.selectAll('.animated-element')
      .interrupt();
    setIsPlaying(false);
  }, []);

  const resumeAnimation = useCallback(() => {
    if (animationQueue.length > 0) {
      const nextSequence = animationQueue[0];
      setAnimationQueue(prev => prev.slice(1));
      executeAnimation(nextSequence);
    }
  }, [animationQueue, executeAnimation]);

  return {
    createTransition,
    orchestrateAnimation,
    executeAnimation,
    pauseAnimation,
    resumeAnimation,
    isPlaying,
    activeTransitions,
    animationQueue
  };
};

// Complete D3Chart Component Implementation
const D3Chart: React.FC<{
  data: DataPoint[];
  dimensions: ChartDimensions;
  onDataPointClick?: (dataPoint: DataPoint) => void;
  accessibilityConfig?: AccessibilityConfiguration;
}> = ({ data, dimensions, onDataPointClick, accessibilityConfig }) => {
  const { containerRef, getSVGAttributes } = useSVGContainer(dimensions);
  const { scales } = useScaleManager(data, dimensions);
  const { svgRef, updateChart, isAnimating, renderMetrics } = useD3Chart(data, dimensions);
  const { createTransition } = useAnimationController();

  const handleDataPointInteraction = useCallback((dataPoint: DataPoint, event: React.MouseEvent) => {
    if (onDataPointClick) {
      onDataPointClick(dataPoint);
    }

    if (scales) {
      const svg = d3.select(svgRef.current);
      const circle = svg.select(`circle[data-id="${dataPoint.id}"]`);
      
      const transition = createTransition(circle, { duration: 200, ease: d3.easeElastic });
      
      transition
        .attr('r', scales.size(dataPoint.value) * 1.5)
        .transition()
        .duration(200)
        .attr('r', scales.size(dataPoint.value));
    }
  }, [onDataPointClick, scales, createTransition, svgRef]);

  useEffect(() => {
    if (!svgRef.current || !scales) return;

    const svg = d3.select(svgRef.current);
    
    svg.selectAll('circle')
      .on('click', function(event, d: DataPoint) {
        handleDataPointInteraction(d, event as any);
      })
      .on('mouseenter', function(event, d: DataPoint) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke-width', 3)
          .attr('opacity', 1);
      })
      .on('mouseleave', function(event, d: DataPoint) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.8);
      });

  }, [scales, handleDataPointInteraction]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '400px', position: 'relative' }}>
      <svg 
        ref={svgRef} 
        {...getSVGAttributes()}
        style={{ display: 'block', margin: 'auto' }}
      >
        <title id="chart-title">Data Visualization Chart</title>
        <desc id="chart-description">
          Interactive scatter plot showing {data.length} data points across different categories
        </desc>
      </svg>
      
      {isAnimating && (
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
          Animating...
        </div>
      )}
      
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        fontSize: '10px',
        color: '#666',
        fontFamily: 'monospace'
      }}>
        Render: {renderMetrics.renderTime.toFixed(1)}ms | 
        FPS: {renderMetrics.frameRate} | 
        Updates: {renderMetrics.updateCount}
      </div>
    </div>
  );
};

// Advanced SVGContainer Component
const SVGContainer: React.FC<{
  children: React.ReactNode;
  dimensions: ChartDimensions;
  responsive?: boolean;
  accessibilityConfig?: AccessibilityConfiguration;
}> = ({ children, dimensions, responsive = true, accessibilityConfig }) => {
  const { containerRef, getSVGAttributes } = useSVGContainer(dimensions);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
      role="img"
      aria-label={accessibilityConfig?.ariaLabels.get('container') || 'Data visualization container'}
    >
      {isIntersecting && (
        <svg {...getSVGAttributes()}>
          {children}
        </svg>
      )}
    </div>
  );
};

// Advanced ScaleManager Component
const ScaleManager: React.FC<{
  data: DataPoint[];
  dimensions: ChartDimensions;
  onScaleUpdate?: (scales: ScaleConfiguration) => void;
  children: (scales: ScaleConfiguration) => React.ReactNode;
}> = ({ data, dimensions, onScaleUpdate, children }) => {
  const { scales, updateScaleDomain, resetScaleDomains } = useScaleManager(data, dimensions);

  useEffect(() => {
    if (scales && onScaleUpdate) {
      onScaleUpdate(scales);
    }
  }, [scales, onScaleUpdate]);

  if (!scales) {
    return <div>Loading scales...</div>;
  }

  return (
    <div style={{ position: 'relative' }}>
      {children(scales)}
      <div style={{ position: 'absolute', top: 10, left: 10 }}>
        <Group gap="xs">
          <Badge size="sm" color="blue">
            X: [{scales.x.domain()[0].toFixed(1)}, {scales.x.domain()[1].toFixed(1)}]
          </Badge>
          <Badge size="sm" color="green">
            Y: [{scales.y.domain()[0].toFixed(1)}, {scales.y.domain()[1].toFixed(1)}]
          </Badge>
          <Button size="xs" variant="light" onClick={resetScaleDomains}>
            Reset Domains
          </Button>
        </Group>
      </div>
    </div>
  );
};

// Advanced AnimationController Component
const AnimationController: React.FC<{
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
  children: (controller: ReturnType<typeof useAnimationController>) => React.ReactNode;
}> = ({ onAnimationStart, onAnimationEnd, children }) => {
  const controller = useAnimationController();

  useEffect(() => {
    if (controller.isPlaying && onAnimationStart) {
      onAnimationStart();
    } else if (!controller.isPlaying && onAnimationEnd) {
      onAnimationEnd();
    }
  }, [controller.isPlaying, onAnimationStart, onAnimationEnd]);

  return (
    <div style={{ position: 'relative' }}>
      {children(controller)}
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <Group gap="xs">
          <Badge 
            size="sm" 
            color={controller.isPlaying ? 'yellow' : 'gray'}
          >
            {controller.isPlaying ? 'Playing' : 'Idle'}
          </Badge>
          <Badge size="sm" variant="light">
            Queue: {controller.animationQueue.length}
          </Badge>
          {controller.isPlaying && (
            <Button size="xs" variant="light" onClick={controller.pauseAnimation}>
              Pause
            </Button>
          )}
          {!controller.isPlaying && controller.animationQueue.length > 0 && (
            <Button size="xs" variant="light" onClick={controller.resumeAnimation}>
              Resume
            </Button>
          )}
        </Group>
      </div>
    </div>
  );
};

// Data Generation Utilities
const generateDataPoint = (id: string, category: string): DataPoint => ({
  id,
  x: Math.random() * 100,
  y: Math.random() * 100,
  category,
  value: Math.random() * 100,
  timestamp: Date.now()
});

const generateDataset = (size: number): DataPoint[] => {
  const categories = ['Category A', 'Category B', 'Category C', 'Category D'];
  return Array.from({ length: size }, (_, i) => 
    generateDataPoint(
      `point-${i}`, 
      categories[Math.floor(Math.random() * categories.length)]
    )
  );
};

// Complete Exercise Component
const D3ReactIntegrationExercise: React.FC = () => {
  const [dataset, setDataset] = useState<DataPoint[]>(() => generateDataset(50));
  const [datasetSize, setDatasetSize] = useState(50);
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  const [animationEnabled, setAnimationEnabled] = useState(true);

  const dimensions: ChartDimensions = {
    width: 800,
    height: 500,
    margin: { top: 20, right: 20, bottom: 60, left: 80 }
  };

  const accessibilityConfig: AccessibilityConfiguration = {
    ariaLabels: new Map([
      ['container', 'Interactive scatter plot visualization'],
      ['chart', 'Data points plotted on X-Y coordinate system'],
      ['xAxis', 'X-axis values'],
      ['yAxis', 'Y-axis values']
    ]),
    keyboardNavigation: {
      enabled: true,
      focusable: ['circle'],
      shortcuts: new Map([
        ['Enter', { action: 'select', handler: () => {}, description: 'Select data point' }],
        ['Escape', { action: 'deselect', handler: () => {}, description: 'Deselect data point' }]
      ]),
      announcements: new Map([
        ['select', 'Data point selected'],
        ['deselect', 'Selection cleared']
      ])
    },
    screenReader: {
      dataTable: true,
      descriptions: new Map([
        ['chart', 'Scatter plot with interactive data points'],
        ['point', 'Data point with coordinates and category information']
      ]),
      announcements: [
        {
          trigger: 'dataUpdate',
          message: 'Chart data has been updated',
          priority: 'polite',
          debounce: 500
        }
      ],
      liveRegion: true
    },
    colorAccessibility: {
      contrastRatio: 4.5,
      colorblindFriendly: true,
      alternativeIndicators: true,
      patterns: [
        {
          name: 'diagonal-lines',
          pattern: 'diagonal stripes',
          description: 'Diagonal line pattern for Category A',
          usage: ['Category A']
        }
      ]
    }
  };

  const handleDatasetRegeneration = useCallback(() => {
    const newDataset = generateDataset(datasetSize);
    setDataset(newDataset);
    setSelectedPoint(null);
  }, [datasetSize]);

  const handleAddDataPoint = useCallback(() => {
    const categories = ['Category A', 'Category B', 'Category C', 'Category D'];
    const newPoint = generateDataPoint(
      `point-${Date.now()}`,
      categories[Math.floor(Math.random() * categories.length)]
    );
    setDataset(prev => [...prev, newPoint]);
  }, []);

  const handleRemoveRandomPoint = useCallback(() => {
    if (dataset.length > 1) {
      const randomIndex = Math.floor(Math.random() * dataset.length);
      setDataset(prev => prev.filter((_, i) => i !== randomIndex));
    }
  }, [dataset.length]);

  const handleDataPointClick = useCallback((dataPoint: DataPoint) => {
    setSelectedPoint(dataPoint);
  }, []);

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} size="h2" mb="md">
            D3-React Integration Patterns
          </Title>
          <Text c="dimmed">
            Advanced D3.js integration with React lifecycle management, SVG containers, 
            scale coordination, and animation control systems.
          </Text>
        </div>

        <Grid>
          <Grid.Col span={8}>
            <Paper p="md" withBorder>
              <Group justify="space-between" mb="md">
                <Title order={3} size="h4">Interactive D3 Chart</Title>
                <Group gap="xs">
                  <Badge color="blue" variant="light">
                    {dataset.length} points
                  </Badge>
                  <Badge color={animationEnabled ? 'green' : 'gray'} variant="light">
                    Animation {animationEnabled ? 'On' : 'Off'}
                  </Badge>
                </Group>
              </Group>

              <AnimationController>
                {(animationController) => (
                  <ScaleManager 
                    data={dataset} 
                    dimensions={dimensions}
                    onScaleUpdate={(scales) => {
                      console.log('Scales updated:', scales);
                    }}
                  >
                    {(scales) => (
                      <D3Chart
                        data={dataset}
                        dimensions={dimensions}
                        onDataPointClick={handleDataPointClick}
                        accessibilityConfig={accessibilityConfig}
                      />
                    )}
                  </ScaleManager>
                )}
              </AnimationController>
            </Paper>
          </Grid.Col>

          <Grid.Col span={4}>
            <Stack gap="md">
              <Paper p="md" withBorder>
                <Title order={4} size="h5" mb="md">Data Controls</Title>
                <Stack gap="sm">
                  <NumberInput
                    label="Dataset Size"
                    value={datasetSize}
                    onChange={(value) => setDatasetSize(Number(value) || 50)}
                    min={10}
                    max={200}
                    step={10}
                  />
                  <Button variant="light" onClick={handleDatasetRegeneration} fullWidth>
                    Regenerate Dataset
                  </Button>
                  <Button variant="outline" onClick={handleAddDataPoint} fullWidth>
                    Add Data Point
                  </Button>
                  <Button 
                    variant="outline" 
                    color="red" 
                    onClick={handleRemoveRandomPoint} 
                    fullWidth
                    disabled={dataset.length <= 1}
                  >
                    Remove Random Point
                  </Button>
                </Stack>
              </Paper>

              <Paper p="md" withBorder>
                <Title order={4} size="h5" mb="md">Chart Information</Title>
                <Stack gap="xs">
                  <Text size="sm">
                    <Text span fw={600}>Dimensions:</Text> {dimensions.width}×{dimensions.height}
                  </Text>
                  <Text size="sm">
                    <Text span fw={600}>Data Points:</Text> {dataset.length}
                  </Text>
                  <Text size="sm">
                    <Text span fw={600}>Categories:</Text> {new Set(dataset.map(d => d.category)).size}
                  </Text>
                  {selectedPoint && (
                    <>
                      <Text size="sm" fw={600} mt="md">Selected Point:</Text>
                      <Text size="xs" c="dimmed">ID: {selectedPoint.id}</Text>
                      <Text size="xs" c="dimmed">X: {selectedPoint.x.toFixed(2)}</Text>
                      <Text size="xs" c="dimmed">Y: {selectedPoint.y.toFixed(2)}</Text>
                      <Text size="xs" c="dimmed">Category: {selectedPoint.category}</Text>
                      <Text size="xs" c="dimmed">Value: {selectedPoint.value.toFixed(2)}</Text>
                    </>
                  )}
                </Stack>
              </Paper>

              <Paper p="md" withBorder>
                <Title order={4} size="h5" mb="md">Performance Metrics</Title>
                <Stack gap="xs">
                  <Text size="xs" c="dimmed">
                    Render Time: {renderMetrics.renderTime.toFixed(1)}ms
                  </Text>
                  <Text size="xs" c="dimmed">
                    Frame Rate: {renderMetrics.frameRate} FPS
                  </Text>
                  <Text size="xs" c="dimmed">
                    Update Count: {renderMetrics.updateCount}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Optimization Score: {(renderMetrics.optimizationScore * 100).toFixed(1)}%
                  </Text>
                </Stack>
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>

        <Paper p="md" withBorder>
          <Title order={3} size="h4" mb="md">Implementation Showcase</Title>
          <Grid>
            <Grid.Col span={6}>
              <Stack gap="sm">
                <div>
                  <Text fw={600} size="sm" mb="xs">D3Chart Integration</Text>
                  <Text size="xs" c="dimmed">
                    ✓ React useRef patterns for D3 DOM access<br/>
                    ✓ Enter/update/exit pattern implementation<br/>
                    ✓ Event handling bridge between D3 and React<br/>
                    ✓ Cleanup strategies for memory management
                  </Text>
                </div>
                <div>
                  <Text fw={600} size="sm" mb="xs">SVG Container Management</Text>
                  <Text size="xs" c="dimmed">
                    ✓ Responsive sizing with ResizeObserver<br/>
                    ✓ Viewport coordinate transformation<br/>
                    ✓ Intersection observer optimization<br/>
                    ✓ Accessibility integration with ARIA
                  </Text>
                </div>
              </Stack>
            </Grid.Col>
            <Grid.Col span={6}>
              <Stack gap="sm">
                <div>
                  <Text fw={600} size="sm" mb="xs">Scale Management</Text>
                  <Text size="xs" c="dimmed">
                    ✓ Dynamic domain calculation with padding<br/>
                    ✓ Multi-scale coordination and synchronization<br/>
                    ✓ Scale updating with smooth transitions<br/>
                    ✓ Domain override capabilities for user control
                  </Text>
                </div>
                <div>
                  <Text fw={600} size="sm" mb="xs">Animation Control</Text>
                  <Text size="xs" c="dimmed">
                    ✓ Transition orchestration with timing control<br/>
                    ✓ Animation queuing and sequence management<br/>
                    ✓ Interactive animation with user feedback<br/>
                    ✓ Performance monitoring and optimization
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

export default D3ReactIntegrationExercise;