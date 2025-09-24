import type { Exercise, ExerciseCategory } from '@/types';

export const multiFrameworkMasteryExercises: Exercise[] = [
  {
    id: '01-vue3-composition-api-patterns',
    title: 'Vue 3 Composition API Patterns',
    description: 'Master Vue 3 Composition API with reactivity system, composables, and advanced patterns for framework-agnostic expertise.',
    category: 'multi-framework-mastery',
    difficulty: 4,
    estimatedTime: 75,
    prerequisites: [],
    learningObjectives: [
      'Master Vue 3 Composition API fundamentals',
      'Implement custom composables with TypeScript',
      'Understand Vue\'s reactivity system deeply',
      'Build reusable composition patterns',
      'Integrate Vue patterns with React concepts',
      'Optimize Vue applications for production'
    ],
    hints: [
      'Use TypeScript generics for type-safe composables',
      'Implement proper cleanup in lifecycle handlers',
      'Design composables for maximum reusability',
      'Monitor reactivity performance with custom metrics',
      'Test composables in isolation from components'
    ],
    filePath: './exercise-files/multi-framework-mastery/01-vue3-composition-api-patterns/exercise.tsx',
    solutionPath: './src/exercises/multi-framework-mastery/01-vue3-composition-api-patterns/solution.tsx',
    testsPath: './src/exercises/multi-framework-mastery/01-vue3-composition-api-patterns/test.ts',
    instructionsPath: './src/exercises/multi-framework-mastery/01-vue3-composition-api-patterns/instructions.md',
  },

  {
    id: '02-nuxt3-full-stack-patterns',
    title: 'Nuxt 3 Full-Stack Patterns',
    description: 'Build full-stack applications with Nuxt 3, server-side rendering, Nitro server integration, and deployment strategies.',
    category: 'multi-framework-mastery',
    difficulty: 4,
    estimatedTime: 75,
    prerequisites: ['01-vue3-composition-api-patterns'],
    learningObjectives: [
      'Master Nuxt 3 server-side rendering and universal mode',
      'Implement server routes with Nitro server engine',
      'Build middleware systems for request processing',
      'Create and manage Nuxt plugins and modules',
      'Optimize SSR performance and deployment',
      'Understand Nuxt 3\'s build and deployment pipeline'
    ],
    hints: [
      'Use Nitro server engine for optimal performance',
      'Implement proper middleware composition patterns',
      'Handle server/client hydration carefully',
      'Optimize route-based code splitting',
      'Test SSR and universal mode thoroughly'
    ],
    filePath: './exercise-files/multi-framework-mastery/02-nuxt3-full-stack-patterns/exercise.tsx',
    solutionPath: './src/exercises/multi-framework-mastery/02-nuxt3-full-stack-patterns/solution.tsx',
    testsPath: './src/exercises/multi-framework-mastery/02-nuxt3-full-stack-patterns/test.ts',
    instructionsPath: './src/exercises/multi-framework-mastery/02-nuxt3-full-stack-patterns/instructions.md',
  },

  {
    id: '03-vue-ecosystem-integration',
    title: 'Vue Ecosystem Integration',
    description: 'Integrate Vue with Pinia state management, Vue Router 4, comprehensive testing strategies, and Vue DevTools.',
    category: 'multi-framework-mastery',
    difficulty: 5,
    estimatedTime: 90,
    prerequisites: ['02-nuxt3-full-stack-patterns'],
    learningObjectives: [
      'Master Pinia state management with TypeScript',
      'Implement Vue Router 4 with advanced routing patterns',
      'Build comprehensive testing strategies for Vue applications',
      'Integrate Vue DevTools for optimal development experience',
      'Optimize Vue ecosystem performance and bundle size',
      'Create migration guides and comparison frameworks'
    ],
    hints: [
      'Use Pinia for scalable state management',
      'Implement Vue Router guards effectively',
      'Write comprehensive component tests with Vue Test Utils',
      'Integrate Vue DevTools for debugging',
      'Optimize bundle size with proper tree-shaking'
    ],
    filePath: './exercise-files/multi-framework-mastery/03-vue-ecosystem-integration/exercise.tsx',
    solutionPath: './src/exercises/multi-framework-mastery/03-vue-ecosystem-integration/solution.tsx',
    testsPath: './src/exercises/multi-framework-mastery/03-vue-ecosystem-integration/test.ts',
    instructionsPath: './src/exercises/multi-framework-mastery/03-vue-ecosystem-integration/instructions.md',
  },

  {
    id: '04-solidjs-reactivity-mastery',
    title: 'SolidJS Reactivity Mastery',
    description: 'Master SolidJS fine-grained reactivity patterns with signals, effects, resources, and stores for maximum performance applications.',
    category: 'multi-framework-mastery',
    difficulty: 4,
    estimatedTime: 75,
    prerequisites: ['03-vue-ecosystem-integration'],
    learningObjectives: [
      'Master SolidJS signals and fine-grained reactivity',
      'Implement signal composition and derived state patterns',
      'Build comprehensive effect systems with proper cleanup',
      'Create resource handling for async operations',
      'Design store patterns for complex state management',
      'Analyze and optimize reactive performance'
    ],
    hints: [
      'Use TypeScript generics for type-safe signals',
      'Implement proper effect cleanup to prevent memory leaks',
      'Design signals for maximum granularity and performance',
      'Monitor reactive performance with custom metrics',
      'Test reactivity patterns thoroughly in isolation'
    ],
    filePath: './exercise-files/multi-framework-mastery/04-solidjs-reactivity-mastery/exercise.tsx',
    solutionPath: './src/exercises/multi-framework-mastery/04-solidjs-reactivity-mastery/solution.tsx',
    testsPath: './src/exercises/multi-framework-mastery/04-solidjs-reactivity-mastery/test.ts',
    instructionsPath: './src/exercises/multi-framework-mastery/04-solidjs-reactivity-mastery/instructions.md',
  },

  {
    id: '05-solid-start-ssr-patterns',
    title: 'SolidStart SSR Patterns',
    description: 'Build SolidStart server-side rendering applications with server functions, islands architecture, and progressive enhancement.',
    category: 'multi-framework-mastery',
    difficulty: 4,
    estimatedTime: 75,
    prerequisites: ['04-solidjs-reactivity-mastery'],
    learningObjectives: [
      'Master SolidStart SSR architecture and routing patterns',
      'Implement server functions with proper data fetching',
      'Build islands architecture for selective hydration',
      'Create progressive enhancement strategies',
      'Design streaming SSR with SolidJS patterns',
      'Optimize deployment and performance for SolidStart applications'
    ],
    hints: [
      'Use SolidStart server functions for optimal data fetching',
      'Implement islands architecture for selective hydration',
      'Handle server/client boundaries carefully',
      'Optimize streaming SSR for better performance',
      'Test SSR applications thoroughly across environments'
    ],
    filePath: './exercise-files/multi-framework-mastery/05-solid-start-ssr-patterns/exercise.tsx',
    solutionPath: './src/exercises/multi-framework-mastery/05-solid-start-ssr-patterns/solution.tsx',
    testsPath: './src/exercises/multi-framework-mastery/05-solid-start-ssr-patterns/test.ts',
    instructionsPath: './src/exercises/multi-framework-mastery/05-solid-start-ssr-patterns/instructions.md',
  },

  {
    id: '06-solid-performance-optimization',
    title: 'Solid Performance Optimization',
    description: 'Master advanced SolidJS performance optimization with bundle analysis, memoization strategies, lazy loading, and compilation optimizations.',
    category: 'multi-framework-mastery',
    difficulty: 5,
    estimatedTime: 90,
    prerequisites: ['05-solid-start-ssr-patterns'],
    learningObjectives: [
      'Master SolidJS compilation and build optimizations',
      'Implement intelligent bundle splitting and lazy loading',
      'Build comprehensive memoization and caching strategies',
      'Create performance profiling and monitoring systems',
      'Design memory management and garbage collection optimization',
      'Analyze and optimize runtime performance metrics'
    ],
    hints: [
      'Use Vite and Rollup for optimal bundle optimization',
      'Implement intelligent lazy loading with intersection observers',
      'Design custom memoization strategies for specific use cases',
      'Profile performance regularly with browser dev tools',
      'Optimize compilation settings for production builds'
    ],
    filePath: './exercise-files/multi-framework-mastery/06-solid-performance-optimization/exercise.tsx',
    solutionPath: './src/exercises/multi-framework-mastery/06-solid-performance-optimization/solution.tsx',
    testsPath: './src/exercises/multi-framework-mastery/06-solid-performance-optimization/test.ts',
    instructionsPath: './src/exercises/multi-framework-mastery/06-solid-performance-optimization/instructions.md',
  },

  {
    id: '07-lit-web-components-fundamentals',
    title: 'Lit Web Components Fundamentals',
    description: 'Master Lit and Web Components development patterns for building framework-agnostic, reusable components with modern web standards.',
    category: 'multi-framework-mastery',
    difficulty: 3,
    estimatedTime: 60,
    prerequisites: ['06-solid-performance-optimization'],
    learningObjectives: [
      'Master Lit custom element development with TypeScript decorators',
      'Implement shadow DOM encapsulation and styling strategies',
      'Build template management systems with reactive properties',
      'Create lifecycle management for Web Components',
      'Design property binding and event handling patterns',
      'Understand Web Components standards and browser compatibility'
    ],
    hints: [
      'Use TypeScript decorators for clean property definitions',
      'Implement proper shadow DOM encapsulation for style isolation',
      'Design components with framework-agnostic APIs',
      'Handle lifecycle methods carefully to prevent memory leaks',
      'Test components across different browsers and frameworks'
    ],
    filePath: './exercise-files/multi-framework-mastery/07-lit-web-components-fundamentals/exercise.tsx',
    solutionPath: './src/exercises/multi-framework-mastery/07-lit-web-components-fundamentals/solution.tsx',
    testsPath: './src/exercises/multi-framework-mastery/07-lit-web-components-fundamentals/test.ts',
    instructionsPath: './src/exercises/multi-framework-mastery/07-lit-web-components-fundamentals/instructions.md',
  },

  {
    id: '08-design-system-with-lit',
    title: 'Design System with Lit',
    description: 'Build scalable design systems using Lit with comprehensive theming, design tokens, component libraries, and documentation systems.',
    category: 'multi-framework-mastery',
    difficulty: 4,
    estimatedTime: 75,
    prerequisites: ['07-lit-web-components-fundamentals'],
    learningObjectives: [
      'Build scalable design systems with Lit and design tokens',
      'Implement comprehensive theming and token management',
      'Create component libraries with consistent design patterns',
      'Design documentation systems for component libraries',
      'Master component composition and variant patterns',
      'Integrate with modern design tooling and workflows'
    ],
    hints: [
      'Use design tokens for consistent theming across components',
      'Implement CSS custom properties for flexible styling',
      'Create comprehensive component variants and compositions',
      'Generate automated documentation with interactive examples',
      'Integrate with Storybook for component development workflow'
    ],
    filePath: './exercise-files/multi-framework-mastery/08-design-system-with-lit/exercise.tsx',
    solutionPath: './src/exercises/multi-framework-mastery/08-design-system-with-lit/solution.tsx',
    testsPath: './src/exercises/multi-framework-mastery/08-design-system-with-lit/test.ts',
    instructionsPath: './src/exercises/multi-framework-mastery/08-design-system-with-lit/instructions.md',
  },

  {
    id: '09-lit-framework-integration',
    title: 'Lit Framework Integration',
    description: 'Master integrating Lit components across different frameworks with comprehensive event communication, state synchronization, and performance optimization.',
    category: 'multi-framework-mastery',
    difficulty: 5,
    estimatedTime: 90,
    prerequisites: ['08-design-system-with-lit'],
    learningObjectives: [
      'Build framework-agnostic components that work seamlessly across React, Vue, Angular',
      'Implement cross-framework event communication and state synchronization',
      'Create adapter patterns for framework-specific integration',
      'Design hydration strategies for SSR environments',
      'Master performance optimization for multi-framework scenarios',
      'Build comprehensive integration testing and deployment strategies'
    ],
    hints: [
      'Create framework adapters for seamless integration',
      'Implement event bridges for cross-framework communication',
      'Design state synchronization strategies for different frameworks',
      'Handle SSR hydration carefully across different environments',
      'Test integration thoroughly with automated cross-framework testing'
    ],
    filePath: './exercise-files/multi-framework-mastery/09-lit-framework-integration/exercise.tsx',
    solutionPath: './src/exercises/multi-framework-mastery/09-lit-framework-integration/solution.tsx',
    testsPath: './src/exercises/multi-framework-mastery/09-lit-framework-integration/test.ts',
    instructionsPath: './src/exercises/multi-framework-mastery/09-lit-framework-integration/instructions.md',
  },

  {
    id: '10-framework-migration-strategies',
    title: 'Framework Migration Strategies',
    description: 'Master strategies for migrating between frontend frameworks with comprehensive planning, transformation, and testing approaches.',
    category: 'multi-framework-mastery',
    difficulty: 5,
    estimatedTime: 90,
    prerequisites: ['09-lit-framework-integration'],
    learningObjectives: [
      'Design comprehensive migration planning and risk assessment strategies',
      'Implement automated code transformation with AST parsing and codemods',
      'Build state management migration utilities for different frameworks',
      'Create test suite migration and coverage preservation systems',
      'Master incremental migration patterns with compatibility layers',
      'Develop rollback strategies and emergency procedures'
    ],
    hints: [
      'Use AST transformations and codemods for automated migration',
      'Implement incremental migration with component boundaries',
      'Design compatibility layers for gradual transitions',
      'Preserve test coverage during framework transitions',
      'Plan comprehensive rollback and emergency procedures'
    ],
    filePath: './exercise-files/multi-framework-mastery/10-framework-migration-strategies/exercise.tsx',
    solutionPath: './src/exercises/multi-framework-mastery/10-framework-migration-strategies/solution.tsx',
    testsPath: './src/exercises/multi-framework-mastery/10-framework-migration-strategies/test.ts',
    instructionsPath: './src/exercises/multi-framework-mastery/10-framework-migration-strategies/instructions.md',
  },

  {
    id: '11-framework-performance-comparison',
    title: 'Framework Performance Comparison',
    description: 'Build comprehensive performance analysis tools to compare frontend frameworks across multiple metrics and real-world scenarios.',
    category: 'multi-framework-mastery',
    difficulty: 5,
    estimatedTime: 90,
    prerequisites: ['10-framework-migration-strategies'],
    learningObjectives: [
      'Build comprehensive benchmarking suites for framework comparison',
      'Implement detailed performance profiling and bottleneck detection',
      'Create metrics collection systems with Web Vitals and custom markers',
      'Design automated reporting and comparative analysis tools',
      'Master decision frameworks for framework selection',
      'Develop performance monitoring for production environments'
    ],
    hints: [
      'Use Web Vitals and Performance API for accurate measurements',
      'Implement comprehensive benchmarking across real-world scenarios',
      'Design automated analysis and recommendation systems',
      'Profile memory usage and bundle sizes effectively',
      'Create decision matrices for framework selection criteria'
    ],
    filePath: './exercise-files/multi-framework-mastery/11-framework-performance-comparison/exercise.tsx',
    solutionPath: './src/exercises/multi-framework-mastery/11-framework-performance-comparison/solution.tsx',
    testsPath: './src/exercises/multi-framework-mastery/11-framework-performance-comparison/test.ts',
    instructionsPath: './src/exercises/multi-framework-mastery/11-framework-performance-comparison/instructions.md',
  },

  {
    id: '12-micro-frontend-architecture',
    title: 'Micro-Frontend Architecture',
    description: 'Master micro-frontend architecture patterns for building scalable applications with multiple frameworks and shared resources.',
    category: 'multi-framework-mastery',
    difficulty: 5,
    estimatedTime: 90,
    prerequisites: ['11-framework-performance-comparison'],
    learningObjectives: [
      'Build micro-frontend host systems with module federation',
      'Implement cross-framework routing and navigation orchestration',
      'Create shared state coordination and event communication systems',
      'Design deployment pipelines for multi-framework applications',
      'Master framework isolation and error boundary strategies',
      'Develop performance optimization for micro-frontend architectures'
    ],
    hints: [
      'Use Webpack Module Federation for dynamic loading',
      'Implement event bus systems for cross-framework communication',
      'Design framework-agnostic routing orchestration',
      'Create shared dependency management strategies',
      'Build comprehensive error boundaries and recovery mechanisms'
    ],
    filePath: './exercise-files/multi-framework-mastery/12-micro-frontend-architecture/exercise.tsx',
    solutionPath: './src/exercises/multi-framework-mastery/12-micro-frontend-architecture/solution.tsx',
    testsPath: './src/exercises/multi-framework-mastery/12-micro-frontend-architecture/test.ts',
    instructionsPath: './src/exercises/multi-framework-mastery/12-micro-frontend-architecture/instructions.md',
  }
];

export const multiFrameworkMasteryCategory: ExerciseCategory = {
  id: 'multi-framework-mastery',
  name: 'Multi-Framework Mastery',
  description: 'Master essential frameworks beyond React including Vue.js, Nuxt.js, SolidJS, and Lit for framework-agnostic expertise.',
  icon: 'IconBrandVue',
  order: 14,
  exercises: multiFrameworkMasteryExercises,
};