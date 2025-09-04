import type { ExerciseCategory } from '@/types';

export const dataVisualizationCategory: ExerciseCategory = {
  id: 'data-visualization',
  name: 'Data Visualization',
  description: 'Master modern data visualization patterns for React applications with D3.js integration, custom visualizations, and performance optimization',
  icon: 'IconChartBar',
  order: 11,
  exercises: [
    {
      id: '01-d3-react-integration',
      title: 'D3-React Integration',
      description: 'Master D3.js integration patterns with React lifecycle management, SVG containers, scale coordination, and animation control systems',
      category: 'data-visualization',
      difficulty: 4,
      prerequisites: [],
      learningObjectives: [
        'Master D3-React integration with useRef patterns and lifecycle management',
        'Implement SVG container systems with responsive design and coordinate transformation',
        'Design scale management with intelligent domain calculation and multi-scale coordination',
        'Create animation controllers with transition orchestration and React synchronization',
        'Handle data binding between D3 selections and React state efficiently',
        'Build responsive charts with viewport adaptation and performance optimization'
      ],
      hints: [
        'Use useRef to bridge D3 DOM manipulation with React component lifecycle',
        'Implement proper cleanup in useEffect to prevent memory leaks',
        'Leverage D3\'s enter/update/exit pattern for efficient data binding',
        'Use ResizeObserver for responsive behavior without performance penalties',
        'Coordinate D3 transitions with React state updates for smooth UX'
      ],
      estimatedTime: 75,
      filePath: './exercise-files/data-visualization/01-d3-react-integration/exercise.tsx',
      solutionPath: './src/exercises/data-visualization/01-d3-react-integration/solution.tsx',
      testsPath: './src/exercises/data-visualization/01-d3-react-integration/test.ts',
      instructionsPath: './src/exercises/data-visualization/01-d3-react-integration/instructions.md',
    },
    {
      id: '02-d3-custom-visualizations',
      title: 'D3 Custom Visualizations',
      description: 'Build advanced custom visualizations including force-directed graphs, treemaps, Sankey diagrams, and custom axis systems with sophisticated interaction patterns',
      category: 'data-visualization',
      difficulty: 5,
      prerequisites: ['01-d3-react-integration'],
      learningObjectives: [
        'Master force-directed graphs with physics simulation and interactive manipulation',
        'Implement treemap visualizations with hierarchical navigation and zoom capabilities',
        'Design Sankey diagrams with flow calculation and interactive path editing',
        'Create custom axis systems with intelligent formatting and grid management',
        'Handle complex data structures for network, hierarchical, and flow visualizations',
        'Build advanced interaction patterns with brushing, zooming, and multi-touch support'
      ],
      hints: [
        'Use D3 force simulation for dynamic network layouts with interactive manipulation',
        'Implement hierarchical navigation with breadcrumb tracking for treemap exploration',
        'Leverage D3 Sankey layout for automatic flow calculation and positioning',
        'Create custom axis generators with intelligent tick placement and formatting',
        'Optimize complex visualizations with spatial indexing and selective rendering'
      ],
      estimatedTime: 90,
      filePath: './exercise-files/data-visualization/02-d3-custom-visualizations/exercise.tsx',
      solutionPath: './src/exercises/data-visualization/02-d3-custom-visualizations/solution.tsx',
      testsPath: './src/exercises/data-visualization/02-d3-custom-visualizations/test.ts',
      instructionsPath: './src/exercises/data-visualization/02-d3-custom-visualizations/instructions.md',
    },
    {
      id: '03-d3-performance-optimization',
      title: 'D3 Performance Optimization',
      description: 'Master advanced performance optimization for massive datasets using virtualization, canvas rendering, web workers, and streaming data with comprehensive monitoring',
      category: 'data-visualization',
      difficulty: 5,
      prerequisites: ['01-d3-react-integration', '02-d3-custom-visualizations'],
      learningObjectives: [
        'Master visualization virtualization for handling millions of data points efficiently',
        'Implement canvas rendering with GPU acceleration and optimized drawing operations',
        'Design web worker processing for non-blocking parallel data computation',
        'Create streaming visualization systems with real-time updates and backpressure handling',
        'Build performance monitoring with bottleneck identification and optimization recommendations',
        'Develop memory management strategies with object pooling and efficient resource utilization'
      ],
      hints: [
        'Use spatial indexing to efficiently cull elements outside the viewport',
        'Implement canvas rendering for maximum performance with large datasets',
        'Leverage web workers for heavy data processing without blocking the UI',
        'Use requestAnimationFrame for smooth animation and rendering coordination',
        'Monitor performance metrics to identify and resolve bottlenecks proactively'
      ],
      estimatedTime: 90,
      filePath: './exercise-files/data-visualization/03-d3-performance-optimization/exercise.tsx',
      solutionPath: './src/exercises/data-visualization/03-d3-performance-optimization/solution.tsx',
      testsPath: './src/exercises/data-visualization/03-d3-performance-optimization/test.ts',
      instructionsPath: './src/exercises/data-visualization/03-d3-performance-optimization/instructions.md',
    }
  ],
};