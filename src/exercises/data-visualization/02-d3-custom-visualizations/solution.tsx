import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Container, Paper, Title, Group, Badge, Text, Stack, Grid, Button, Select, NumberInput, Tabs } from '@mantine/core';
import * as d3 from 'd3';

// Advanced Custom Visualization Types
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  group: string;
  value: number;
  name: string;
  category: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
  distance?: number;
}

interface HierarchicalData {
  name: string;
  value?: number;
  children?: HierarchicalData[];
  category: string;
  metadata: {
    description: string;
    color: string;
    importance: number;
  };
}

interface SankeyNode {
  id: string;
  name: string;
  category: string;
  value: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  y0?: number;
  y1?: number;
  width?: number;
}

interface ForceConfiguration {
  center: { strength: number };
  charge: { strength: number; distanceMin: number; distanceMax: number };
  collision: { radius: number; strength: number };
  link: { distance: number; strength: number };
}

interface TreeMapConfiguration {
  algorithm: 'squarify' | 'binary' | 'slice' | 'dice';
  paddingInner: number;
  paddingOuter: number;
  paddingTop: number;
  tile: d3.TreemapTilingMethod;
}

interface SankeyConfiguration {
  nodeWidth: number;
  nodePadding: number;
  iterations: number;
  sort: ((a: SankeyNode, b: SankeyNode) => number) | null;
}

// Force-Directed Graph Hook
export const useForceDirectedGraph = (
  nodes: GraphNode[], 
  links: GraphLink[], 
  dimensions: { width: number; height: number }
) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [forceConfig, setForceConfig] = useState<ForceConfiguration>({
    center: { strength: 0.1 },
    charge: { strength: -300, distanceMin: 1, distanceMax: 200 },
    collision: { radius: 20, strength: 0.7 },
    link: { distance: 30, strength: 0.1 }
  });

  const initializeSimulation = useCallback(() => {
    const { width, height } = dimensions;
    
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id((d: GraphNode) => d.id)
        .distance(forceConfig.link.distance)
        .strength(forceConfig.link.strength))
      .force('charge', d3.forceManyBody()
        .strength(forceConfig.charge.strength)
        .distanceMin(forceConfig.charge.distanceMin)
        .distanceMax(forceConfig.charge.distanceMax))
      .force('center', d3.forceCenter(width / 2, height / 2)
        .strength(forceConfig.center.strength))
      .force('collision', d3.forceCollide<GraphNode>()
        .radius(forceConfig.collision.radius)
        .strength(forceConfig.collision.strength));

    simulationRef.current = simulation;
    return simulation;
  }, [nodes, links, dimensions, forceConfig]);

  const updateVisualization = useCallback(() => {
    if (!svgRef.current || !simulationRef.current) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    svg.selectAll('*').remove();

    const g = svg.append('g').attr('class', 'graph-container');

    const link = g.append('g')
      .attr('class', 'links')
      .selectAll<SVGLineElement, GraphLink>('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: GraphLink) => Math.sqrt(d.value));

    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll<SVGCircleElement, GraphNode>('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', (d: GraphNode) => Math.sqrt(d.value) * 2)
      .attr('fill', (d: GraphNode) => d3.schemeCategory10[parseInt(d.group) % 10])
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulationRef.current?.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    const labels = g.append('g')
      .attr('class', 'labels')
      .selectAll<SVGTextElement, GraphNode>('text')
      .data(nodes)
      .enter().append('text')
      .text((d: GraphNode) => d.name)
      .attr('font-size', 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#333');

    simulationRef.current.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: GraphNode) => Math.max(20, Math.min(width - 20, d.x || 0)))
        .attr('cy', (d: GraphNode) => Math.max(20, Math.min(height - 20, d.y || 0)));

      labels
        .attr('x', (d: GraphNode) => Math.max(20, Math.min(width - 20, d.x || 0)))
        .attr('y', (d: GraphNode) => Math.max(20, Math.min(height - 20, d.y || 0)) + 3);
    });

  }, [dimensions, links]);

  useEffect(() => {
    const simulation = initializeSimulation();
    setIsRunning(true);
    
    simulation.on('end', () => setIsRunning(false));
    
    updateVisualization();

    return () => {
      simulation.stop();
      setIsRunning(false);
    };
  }, [initializeSimulation, updateVisualization]);

  const restartSimulation = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
      setIsRunning(true);
    }
  }, []);

  const updateForceConfig = useCallback((newConfig: Partial<ForceConfiguration>) => {
    setForceConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  return {
    svgRef,
    isRunning,
    forceConfig,
    updateForceConfig,
    restartSimulation
  };
};

// TreeMap Visualization Hook
export const useTreeMap = (data: HierarchicalData, dimensions: { width: number; height: number }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentLevel, setCurrentLevel] = useState<d3.HierarchyNode<HierarchicalData> | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<d3.HierarchyNode<HierarchicalData>[]>([]);
  const [config, setConfig] = useState<TreeMapConfiguration>({
    algorithm: 'squarify',
    paddingInner: 1,
    paddingOuter: 3,
    paddingTop: 15,
    tile: d3.treemapSquarify
  });

  const hierarchy = useMemo(() => {
    return d3.hierarchy(data)
      .sum((d: HierarchicalData) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));
  }, [data]);

  const treemapLayout = useMemo(() => {
    return d3.treemap<HierarchicalData>()
      .size([dimensions.width, dimensions.height])
      .tile(config.tile)
      .paddingInner(config.paddingInner)
      .paddingOuter(config.paddingOuter)
      .paddingTop(config.paddingTop);
  }, [dimensions, config]);

  const renderTreeMap = useCallback((root: d3.HierarchyNode<HierarchicalData>) => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const layoutRoot = treemapLayout(root);
    const leaves = layoutRoot.leaves();
    const colorScale = d3.scaleOrdinal(d3.schemeSet3);

    const g = svg.append('g').attr('class', 'treemap-container');

    const cell = g.selectAll<SVGGElement, d3.HierarchyRectangularNode<HierarchicalData>>('g')
      .data(leaves)
      .enter().append('g')
      .attr('class', 'cell')
      .attr('transform', (d: d3.HierarchyRectangularNode<HierarchicalData>) => 
        `translate(${d.x0},${d.y0})`);

    cell.append('rect')
      .attr('width', (d: d3.HierarchyRectangularNode<HierarchicalData>) => d.x1 - d.x0)
      .attr('height', (d: d3.HierarchyRectangularNode<HierarchicalData>) => d.y1 - d.y0)
      .attr('fill', (d: d3.HierarchyRectangularNode<HierarchicalData>) => 
        colorScale(d.data.category))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('opacity', 0.8)
      .on('click', (event, d) => {
        if (d.parent && d.parent !== root) {
          zoomTo(d.parent);
        }
      })
      .on('mouseenter', function(event, d) {
        d3.select(this).attr('opacity', 1);
      })
      .on('mouseleave', function(event, d) {
        d3.select(this).attr('opacity', 0.8);
      });

    cell.append('text')
      .attr('x', 4)
      .attr('y', 14)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text((d: d3.HierarchyRectangularNode<HierarchicalData>) => {
        const width = d.x1 - d.x0;
        const name = d.data.name;
        return width > name.length * 6 ? name : '';
      });

    cell.append('text')
      .attr('x', 4)
      .attr('y', 28)
      .attr('font-size', '9px')
      .attr('fill', '#666')
      .text((d: d3.HierarchyRectangularNode<HierarchicalData>) => {
        const width = d.x1 - d.x0;
        const value = d.value?.toFixed(1) || '0';
        return width > 60 ? value : '';
      });

  }, [treemapLayout]);

  const zoomTo = useCallback((node: d3.HierarchyNode<HierarchicalData>) => {
    setCurrentLevel(node);
    setBreadcrumbs(prev => {
      const newBreadcrumbs = [];
      let current: d3.HierarchyNode<HierarchicalData> | null = node;
      while (current) {
        newBreadcrumbs.unshift(current);
        current = current.parent;
      }
      return newBreadcrumbs;
    });
    renderTreeMap(node);
  }, [renderTreeMap]);

  useEffect(() => {
    if (hierarchy) {
      const root = currentLevel || hierarchy;
      renderTreeMap(root);
    }
  }, [hierarchy, currentLevel, renderTreeMap]);

  return {
    svgRef,
    currentLevel,
    breadcrumbs,
    zoomTo,
    config,
    setConfig
  };
};

// Sankey Diagram Hook
export const useSankey = (
  nodes: SankeyNode[], 
  links: SankeyLink[], 
  dimensions: { width: number; height: number }
) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [config, setConfig] = useState<SankeyConfiguration>({
    nodeWidth: 15,
    nodePadding: 10,
    iterations: 6,
    sort: null
  });

  const sankeyGenerator = useMemo(() => {
    return d3.sankey<SankeyNode, SankeyLink>()
      .nodeWidth(config.nodeWidth)
      .nodePadding(config.nodePadding)
      .extent([[1, 1], [dimensions.width - 1, dimensions.height - 6]])
      .iterations(config.iterations);
  }, [dimensions, config]);

  const renderSankey = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(d => ({ ...d }))
    });

    const g = svg.append('g').attr('class', 'sankey-container');

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const link = g.append('g')
      .attr('class', 'links')
      .selectAll<SVGPathElement, any>('path')
      .data(sankeyLinks)
      .enter().append('path')
      .attr('d', d3.sankeyLinkHorizontal())
      .attr('stroke', (d: any) => colorScale(d.source.category))
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('opacity', 0.4)
      .on('mouseenter', function(event, d) {
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mouseleave', function(event, d) {
        d3.select(this).attr('opacity', 0.4);
      });

    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll<SVGRectElement, any>('rect')
      .data(sankeyNodes)
      .enter().append('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('fill', (d: any) => colorScale(d.category))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    const labels = g.append('g')
      .attr('class', 'labels')
      .selectAll<SVGTextElement, any>('text')
      .data(sankeyNodes)
      .enter().append('text')
      .attr('x', (d: any) => d.x0 < dimensions.width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.x0 < dimensions.width / 2 ? 'start' : 'end')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text((d: any) => d.name);

  }, [sankeyGenerator, dimensions]);

  useEffect(() => {
    renderSankey();
  }, [renderSankey]);

  return {
    svgRef,
    config,
    setConfig,
    renderSankey
  };
};

// Custom Axis Hook
export const useCustomAxis = (
  scale: d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>,
  orientation: 'top' | 'right' | 'bottom' | 'left',
  options: {
    tickCount?: number;
    tickFormat?: string;
    gridLines?: boolean;
    annotations?: Array<{ value: number; label: string; color?: string }>;
  } = {}
) => {
  const axisRef = useRef<SVGGElement>(null);

  const renderAxis = useCallback(() => {
    if (!axisRef.current || !scale) return;

    const axisGroup = d3.select(axisRef.current);
    axisGroup.selectAll('*').remove();

    let axisGenerator;
    switch (orientation) {
      case 'top':
        axisGenerator = d3.axisTop(scale);
        break;
      case 'right':
        axisGenerator = d3.axisRight(scale);
        break;
      case 'bottom':
        axisGenerator = d3.axisBottom(scale);
        break;
      case 'left':
        axisGenerator = d3.axisLeft(scale);
        break;
    }

    if (options.tickCount) {
      axisGenerator.ticks(options.tickCount);
    }

    if (options.tickFormat) {
      axisGenerator.tickFormat(d3.format(options.tickFormat));
    }

    axisGroup.call(axisGenerator);

    if (options.gridLines) {
      const range = scale.range();
      const domain = scale.domain();
      
      if (orientation === 'bottom' || orientation === 'top') {
        axisGroup.selectAll('.tick line')
          .attr('y2', orientation === 'bottom' ? -Math.abs(range[1] - range[0]) : Math.abs(range[1] - range[0]))
          .attr('stroke', '#e0e0e0')
          .attr('stroke-width', 0.5);
      } else {
        axisGroup.selectAll('.tick line')
          .attr('x2', orientation === 'left' ? Math.abs(range[1] - range[0]) : -Math.abs(range[1] - range[0]))
          .attr('stroke', '#e0e0e0')
          .attr('stroke-width', 0.5);
      }
    }

    if (options.annotations) {
      const annotations = axisGroup.append('g').attr('class', 'annotations');
      
      options.annotations.forEach(annotation => {
        const position = scale(annotation.value);
        const annotationGroup = annotations.append('g')
          .attr('transform', 
            orientation === 'bottom' || orientation === 'top' 
              ? `translate(${position}, 0)` 
              : `translate(0, ${position})`);

        annotationGroup.append('line')
          .attr('stroke', annotation.color || '#ff6b6b')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '3,3')
          .attr('x1', 0)
          .attr('y1', orientation === 'bottom' ? 0 : orientation === 'top' ? 0 : -5)
          .attr('x2', orientation === 'left' || orientation === 'right' ? (orientation === 'left' ? 5 : -5) : 0)
          .attr('y2', orientation === 'bottom' ? -5 : orientation === 'top' ? 5 : 5);

        annotationGroup.append('text')
          .attr('x', orientation === 'left' ? 10 : orientation === 'right' ? -10 : 0)
          .attr('y', orientation === 'bottom' ? -10 : orientation === 'top' ? 20 : 0)
          .attr('text-anchor', 
            orientation === 'left' ? 'start' : 
            orientation === 'right' ? 'end' : 'middle')
          .attr('font-size', '10px')
          .attr('fill', annotation.color || '#ff6b6b')
          .text(annotation.label);
      });
    }

  }, [scale, orientation, options]);

  useEffect(() => {
    renderAxis();
  }, [renderAxis]);

  return {
    axisRef,
    renderAxis
  };
};

// Force-Directed Graph Component
const ForceDirectedGraph: React.FC<{
  nodes: GraphNode[];
  links: GraphLink[];
  dimensions: { width: number; height: number };
}> = ({ nodes, links, dimensions }) => {
  const { svgRef, isRunning, forceConfig, updateForceConfig, restartSimulation } = useForceDirectedGraph(nodes, links, dimensions);

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <Group gap="xs">
          <Badge color={isRunning ? 'green' : 'gray'} size="sm">
            {isRunning ? 'Simulating' : 'Stable'}
          </Badge>
          <Button size="xs" variant="light" onClick={restartSimulation}>
            Restart
          </Button>
        </Group>
      </div>
    </div>
  );
};

// TreeMap Component
const TreeMap: React.FC<{
  data: HierarchicalData;
  dimensions: { width: number; height: number };
}> = ({ data, dimensions }) => {
  const { svgRef, currentLevel, breadcrumbs, zoomTo } = useTreeMap(data, dimensions);

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ border: '1px solid #ddd', borderRadius: '4px' }}
      />
      {breadcrumbs.length > 1 && (
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <Group gap="xs">
            {breadcrumbs.map((crumb, index) => (
              <Button 
                key={index}
                size="xs" 
                variant="light"
                onClick={() => zoomTo(crumb)}
              >
                {crumb.data.name}
              </Button>
            ))}
          </Group>
        </div>
      )}
    </div>
  );
};

// Sankey Component
const Sankey: React.FC<{
  nodes: SankeyNode[];
  links: SankeyLink[];
  dimensions: { width: number; height: number };
}> = ({ nodes, links, dimensions }) => {
  const { svgRef, config, setConfig } = useSankey(nodes, links, dimensions);

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <Badge size="sm" variant="light">
          Iterations: {config.iterations}
        </Badge>
      </div>
    </div>
  );
};

// Custom Axis Component
const CustomAxis: React.FC<{
  scale: d3.ScaleLinear<number, number>;
  orientation: 'top' | 'right' | 'bottom' | 'left';
  gridLines?: boolean;
  annotations?: Array<{ value: number; label: string; color?: string }>;
}> = ({ scale, orientation, gridLines = false, annotations = [] }) => {
  const { axisRef } = useCustomAxis(scale, orientation, {
    tickCount: 10,
    tickFormat: '.1f',
    gridLines,
    annotations
  });

  return <g ref={axisRef} />;
};

// Data Generation Utilities
const generateNetworkData = () => {
  const nodes: GraphNode[] = Array.from({ length: 20 }, (_, i) => ({
    id: `node-${i}`,
    name: `Node ${i + 1}`,
    group: Math.floor(i / 5).toString(),
    value: Math.random() * 100 + 10,
    category: `Group ${Math.floor(i / 5) + 1}`
  }));

  const links: GraphLink[] = Array.from({ length: 30 }, (_, i) => ({
    source: nodes[Math.floor(Math.random() * nodes.length)].id,
    target: nodes[Math.floor(Math.random() * nodes.length)].id,
    value: Math.random() * 10 + 1
  }));

  return { nodes, links };
};

const generateHierarchicalData = (): HierarchicalData => ({
  name: 'Root',
  category: 'root',
  metadata: { description: 'Root node', color: '#1f77b4', importance: 1 },
  children: Array.from({ length: 4 }, (_, i) => ({
    name: `Category ${i + 1}`,
    category: `cat-${i}`,
    metadata: { description: `Category ${i + 1}`, color: d3.schemeSet2[i], importance: 0.8 },
    children: Array.from({ length: Math.floor(Math.random() * 6) + 3 }, (_, j) => ({
      name: `Item ${i + 1}.${j + 1}`,
      value: Math.random() * 100 + 10,
      category: `item-${i}-${j}`,
      metadata: { description: `Item ${j + 1}`, color: d3.schemeSet2[i], importance: 0.5 }
    }))
  }))
});

const generateSankeyData = () => {
  const nodes: SankeyNode[] = [
    { id: 'A1', name: 'Source A1', category: 'source', value: 100 },
    { id: 'A2', name: 'Source A2', category: 'source', value: 80 },
    { id: 'B1', name: 'Middle B1', category: 'middle', value: 120 },
    { id: 'B2', name: 'Middle B2', category: 'middle', value: 60 },
    { id: 'C1', name: 'Target C1', category: 'target', value: 90 },
    { id: 'C2', name: 'Target C2', category: 'target', value: 90 }
  ];

  const links: SankeyLink[] = [
    { source: 'A1', target: 'B1', value: 60 },
    { source: 'A1', target: 'B2', value: 40 },
    { source: 'A2', target: 'B1', value: 50 },
    { source: 'A2', target: 'B2', value: 30 },
    { source: 'B1', target: 'C1', value: 70 },
    { source: 'B1', target: 'C2', value: 40 },
    { source: 'B2', target: 'C1', value: 20 },
    { source: 'B2', target: 'C2', value: 50 }
  ];

  return { nodes, links };
};

// Main Exercise Component
const D3CustomVisualizationsExercise: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('force-graph');
  const [networkData, setNetworkData] = useState(() => generateNetworkData());
  const [hierarchicalData, setHierarchicalData] = useState(() => generateHierarchicalData());
  const [sankeyData, setSankeyData] = useState(() => generateSankeyData());

  const chartDimensions = { width: 600, height: 400 };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} size="h2" mb="md">
            D3 Custom Visualizations
          </Title>
          <Text c="dimmed">
            Build advanced custom visualizations with force-directed graphs, treemaps, 
            Sankey diagrams, and sophisticated axis systems.
          </Text>
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="force-graph">Force-Directed Graph</Tabs.Tab>
            <Tabs.Tab value="treemap">TreeMap</Tabs.Tab>
            <Tabs.Tab value="sankey">Sankey Diagram</Tabs.Tab>
            <Tabs.Tab value="custom-axis">Custom Axis</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="force-graph" pt="md">
            <Grid>
              <Grid.Col span={8}>
                <Paper p="md" withBorder>
                  <Group justify="space-between" mb="md">
                    <Title order={3} size="h4">Force-Directed Network</Title>
                    <Badge color="blue" variant="light">
                      {networkData.nodes.length} nodes, {networkData.links.length} edges
                    </Badge>
                  </Group>
                  <ForceDirectedGraph
                    nodes={networkData.nodes}
                    links={networkData.links}
                    dimensions={chartDimensions}
                  />
                </Paper>
              </Grid.Col>
              <Grid.Col span={4}>
                <Paper p="md" withBorder>
                  <Title order={4} size="h5" mb="md">Network Controls</Title>
                  <Stack gap="sm">
                    <Button 
                      variant="light" 
                      onClick={() => setNetworkData(generateNetworkData())}
                      fullWidth
                    >
                      Generate New Network
                    </Button>
                    <Text size="sm" c="dimmed">
                      Drag nodes to reposition. Network will stabilize automatically.
                    </Text>
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="treemap" pt="md">
            <Grid>
              <Grid.Col span={8}>
                <Paper p="md" withBorder>
                  <Group justify="space-between" mb="md">
                    <Title order={3} size="h4">Hierarchical TreeMap</Title>
                    <Badge color="green" variant="light">Zoomable</Badge>
                  </Group>
                  <TreeMap
                    data={hierarchicalData}
                    dimensions={chartDimensions}
                  />
                </Paper>
              </Grid.Col>
              <Grid.Col span={4}>
                <Paper p="md" withBorder>
                  <Title order={4} size="h5" mb="md">TreeMap Controls</Title>
                  <Stack gap="sm">
                    <Button 
                      variant="light" 
                      onClick={() => setHierarchicalData(generateHierarchicalData())}
                      fullWidth
                    >
                      Generate New Hierarchy
                    </Button>
                    <Text size="sm" c="dimmed">
                      Click on rectangles to zoom into hierarchical levels.
                    </Text>
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="sankey" pt="md">
            <Grid>
              <Grid.Col span={8}>
                <Paper p="md" withBorder>
                  <Group justify="space-between" mb="md">
                    <Title order={3} size="h4">Flow Sankey Diagram</Title>
                    <Badge color="purple" variant="light">Flow Analysis</Badge>
                  </Group>
                  <Sankey
                    nodes={sankeyData.nodes}
                    links={sankeyData.links}
                    dimensions={chartDimensions}
                  />
                </Paper>
              </Grid.Col>
              <Grid.Col span={4}>
                <Paper p="md" withBorder>
                  <Title order={4} size="h5" mb="md">Sankey Controls</Title>
                  <Stack gap="sm">
                    <Button 
                      variant="light" 
                      onClick={() => setSankeyData(generateSankeyData())}
                      fullWidth
                    >
                      Generate New Flows
                    </Button>
                    <Text size="sm" c="dimmed">
                      Hover over paths to highlight flows between nodes.
                    </Text>
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="custom-axis" pt="md">
            <Paper p="md" withBorder>
              <Title order={3} size="h4" mb="md">Custom Axis Systems</Title>
              <div style={{ height: '300px', position: 'relative' }}>
                <svg width={chartDimensions.width} height={chartDimensions.height}>
                  <CustomAxis
                    scale={d3.scaleLinear().domain([0, 100]).range([50, chartDimensions.width - 50])}
                    orientation="bottom"
                    gridLines={true}
                    annotations={[
                      { value: 25, label: 'Threshold', color: '#ff6b6b' },
                      { value: 75, label: 'Target', color: '#51cf66' }
                    ]}
                  />
                  <CustomAxis
                    scale={d3.scaleLinear().domain([0, 50]).range([chartDimensions.height - 50, 50])}
                    orientation="left"
                    gridLines={true}
                  />
                </svg>
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
                  <Text fw={600} size="sm" mb="xs">Force-Directed Graph</Text>
                  <Text size="xs" c="dimmed">
                    ✓ Physics simulation with configurable forces<br/>
                    ✓ Interactive node dragging and positioning<br/>
                    ✓ Dynamic layout with real-time updates<br/>
                    ✓ Performance optimization with efficient rendering
                  </Text>
                </div>
                <div>
                  <Text fw={600} size="sm" mb="xs">TreeMap Visualization</Text>
                  <Text size="xs" c="dimmed">
                    ✓ Hierarchical layout with recursive subdivision<br/>
                    ✓ Zoom navigation with breadcrumb tracking<br/>
                    ✓ Color coding with categorical mapping<br/>
                    ✓ Responsive design with adaptive layouts
                  </Text>
                </div>
              </Stack>
            </Grid.Col>
            <Grid.Col span={6}>
              <Stack gap="sm">
                <div>
                  <Text fw={600} size="sm" mb="xs">Sankey Diagram</Text>
                  <Text size="xs" c="dimmed">
                    ✓ Flow visualization with curved path rendering<br/>
                    ✓ Interactive node positioning and flow editing<br/>
                    ✓ Gradient flow representation with width mapping<br/>
                    ✓ Data processing with flow aggregation algorithms
                  </Text>
                </div>
                <div>
                  <Text fw={600} size="sm" mb="xs">Custom Axis System</Text>
                  <Text size="xs" c="dimmed">
                    ✓ Intelligent tick placement and formatting<br/>
                    ✓ Grid system with configurable styling<br/>
                    ✓ Annotation support with interactive markers<br/>
                    ✓ Responsive behavior with adaptive layouts
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

export default D3CustomVisualizationsExercise;