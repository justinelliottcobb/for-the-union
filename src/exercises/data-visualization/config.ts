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
    },
    {
      id: '04-chartjs-react-patterns',
      title: 'Chart.js React Patterns',
      description: 'Master Chart.js integration with React best practices, responsive design, interactive features, multi-chart coordination, and custom plugin development',
      category: 'data-visualization',
      difficulty: 4,
      prerequisites: ['01-d3-react-integration'],
      learningObjectives: [
        'Master Chart.js integration with React lifecycle management and state synchronization',
        'Implement responsive design with container observation and dynamic sizing',
        'Design interactive features with custom tooltips, hover effects, and click handling',
        'Create multi-chart systems with coordinated layouts and synchronized interactions',
        'Build custom Chart.js plugins with React integration and performance optimization',
        'Handle data updates efficiently with smooth animations and state preservation'
      ],
      hints: [
        'Use useRef patterns to bridge Chart.js instances with React component lifecycle',
        'Implement ResizeObserver for responsive chart behavior without performance issues',
        'Leverage Chart.js plugin system for custom functionality and visual enhancements',
        'Create provider patterns for centralized chart configuration and theme management',
        'Use Chart.js animation callbacks to coordinate with React state updates'
      ],
      estimatedTime: 60,
      filePath: './exercise-files/data-visualization/04-chartjs-react-patterns/exercise.tsx',
      solutionPath: './src/exercises/data-visualization/04-chartjs-react-patterns/solution.tsx',
      testsPath: './src/exercises/data-visualization/04-chartjs-react-patterns/test.ts',
      instructionsPath: './src/exercises/data-visualization/04-chartjs-react-patterns/instructions.md',
    },
    {
      id: '05-apexcharts-advanced-features',
      title: 'ApexCharts Advanced Features',
      description: 'Build sophisticated ApexCharts integrations with drilldown navigation, real-time streaming, synchronized multi-chart systems, and dense sparkline grids',
      category: 'data-visualization',
      difficulty: 4,
      prerequisites: ['01-d3-react-integration', '04-chartjs-react-patterns'],
      learningObjectives: [
        'Master ApexCharts integration with React and advanced interactive patterns',
        'Implement drilldown navigation with hierarchical data and breadcrumb tracking',
        'Design real-time data streaming with WebSocket integration and buffer management',
        'Create multi-chart coordination with synchronized interactions and shared state',
        'Build sparkline grids with dense data visualization and interactive features',
        'Handle advanced interactions with custom toolbars and annotation systems'
      ],
      hints: [
        'Use ApexCharts event system to create coordinated interactions across multiple charts',
        'Implement hierarchical data structures with efficient navigation and state management',
        'Leverage WebSocket simulation for real-time data streaming with performance monitoring',
        'Create provider patterns for chart synchronization and shared configuration',
        'Use sparkline optimization techniques for rendering large numbers of micro-charts'
      ],
      estimatedTime: 75,
      filePath: './exercise-files/data-visualization/05-apexcharts-advanced-features/exercise.tsx',
      solutionPath: './src/exercises/data-visualization/05-apexcharts-advanced-features/solution.tsx',
      testsPath: './src/exercises/data-visualization/05-apexcharts-advanced-features/test.ts',
      instructionsPath: './src/exercises/data-visualization/05-apexcharts-advanced-features/instructions.md',
    },
    {
      id: '06-highcharts-enterprise-patterns',
      title: 'Highcharts Enterprise Patterns',
      description: 'Build enterprise-grade visualizations with Highcharts Stock, Gantt charts, export systems, coordinated dashboards, and advanced enterprise features',
      category: 'data-visualization',
      difficulty: 5,
      prerequisites: ['01-d3-react-integration', '04-chartjs-react-patterns', '05-apexcharts-advanced-features'],
      learningObjectives: [
        'Master Highcharts Stock for financial time-series with technical indicators and analysis',
        'Implement Gantt charts for project management with task dependencies and resource allocation',
        'Create enterprise export systems with custom branding, batch processing, and format flexibility',
        'Design coordinated dashboards with synchronized interactions and real-time updates',
        'Build advanced theming with brand compliance and accessibility support',
        'Handle enterprise integration with security, performance, and scalability features'
      ],
      hints: [
        'Use Highcharts Stock modules for advanced financial charting with OHLC data and indicators',
        'Leverage Highcharts Gantt for project visualization with dependency management',
        'Implement export customization with branding templates and high-quality output',
        'Create chart synchronization patterns for coordinated dashboard interactions',
        'Use Highcharts accessibility modules for enterprise compliance requirements'
      ],
      estimatedTime: 75,
      filePath: './exercise-files/data-visualization/06-highcharts-enterprise-patterns/exercise.tsx',
      solutionPath: './src/exercises/data-visualization/06-highcharts-enterprise-patterns/solution.tsx',
      testsPath: './src/exercises/data-visualization/06-highcharts-enterprise-patterns/test.ts',
      instructionsPath: './src/exercises/data-visualization/06-highcharts-enterprise-patterns/instructions.md',
    }
  ],
};