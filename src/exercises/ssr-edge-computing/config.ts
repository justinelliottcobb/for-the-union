import type { ExerciseCategory } from '@/types';

export const ssrEdgeComputingCategory: ExerciseCategory = {
  id: 'ssr-edge-computing',
  name: 'SSR & Edge Computing',
  description: 'Master modern server-side rendering patterns and edge computing architectures for high-performance web applications at Staff Frontend Engineer level',
  icon: 'IconServer',
  order: 13,
  exercises: [
    {
      id: '01-react-router-7-ssr',
      title: 'React Router 7 SSR Implementation',
      description: 'Master React Router 7 server-side rendering with streaming, hydration management, and progressive enhancement patterns.',
      category: 'ssr-edge-computing',
      difficulty: 4,
      prerequisites: [],
      learningObjectives: [
        'Implement React Router 7 SSR architecture',
        'Build streaming SSR with progressive enhancement', 
        'Create hydration-aware components with error boundaries',
        'Optimize route-based code splitting for performance',
        'Handle hydration mismatches gracefully'
      ],
      hints: [
        'Use React 18 streaming APIs for optimal performance',
        'Implement progressive hydration with IntersectionObserver',
        'Handle server/client environment differences carefully',
        'Preload critical routes based on navigation patterns',
        'Implement proper error recovery strategies'
      ],
      estimatedTime: 75,
      filePath: './exercise-files/ssr-edge-computing/01-react-router-7-ssr/exercise.tsx',
      solutionPath: './src/exercises/ssr-edge-computing/01-react-router-7-ssr/solution.tsx',
      testsPath: './src/exercises/ssr-edge-computing/01-react-router-7-ssr/test.ts',
      instructionsPath: './src/exercises/ssr-edge-computing/01-react-router-7-ssr/instructions.md',
    },
  
    {
      id: '02-nextjs-app-router-patterns',
      title: 'Next.js App Router Advanced Patterns',
      description: 'Build sophisticated Next.js App Router implementations with React Server Components, parallel routes, and advanced layout patterns.',
      category: 'ssr-edge-computing',
      difficulty: 4,
      prerequisites: ['01-react-router-7-ssr'],
      learningObjectives: [
        'Master Next.js App Router architecture',
        'Implement React Server Components and Client Components',
        'Build parallel routes and intercepting routes',
        'Create optimized layouts with route groups',
        'Utilize metadata API for SEO optimization'
      ],
      hints: [
        'Keep Server Components pure and avoid client-side state',
        'Use parallel routes for complex dashboard layouts',
        'Implement intercepting routes for modal patterns',
        'Optimize layouts with proper route group organization',
        'Generate dynamic metadata for better SEO'
      ],
      estimatedTime: 75,
      filePath: './exercise-files/ssr-edge-computing/02-nextjs-app-router-patterns/exercise.tsx',
      solutionPath: './src/exercises/ssr-edge-computing/02-nextjs-app-router-patterns/solution.tsx',
      testsPath: './src/exercises/ssr-edge-computing/02-nextjs-app-router-patterns/test.ts',
      instructionsPath: './src/exercises/ssr-edge-computing/02-nextjs-app-router-patterns/instructions.md',
    },

    {
      id: '03-ssr-performance-optimization',
      title: 'SSR Performance Optimization',
      description: 'Build comprehensive SSR performance optimization systems with advanced caching, resource preloading, and progressive enhancement.',
      category: 'ssr-edge-computing',
      difficulty: 5,
      prerequisites: ['02-nextjs-app-router-patterns'],
      learningObjectives: [
        'Implement multi-layer caching strategies for SSR',
        'Build intelligent resource preloading systems',
        'Optimize streaming SSR performance and TTFB', 
        'Create progressive enhancement patterns',
        'Integrate service workers for optimal caching'
      ],
      hints: [
        'Implement stale-while-revalidate for better UX',
        'Use machine learning for navigation prediction',
        'Optimize chunk sizes based on network conditions',
        'Extract and inline critical CSS automatically',
        'Build graceful degradation for all enhancement levels'
      ],
      estimatedTime: 90,
      filePath: './exercise-files/ssr-edge-computing/03-ssr-performance-optimization/exercise.tsx',
      solutionPath: './src/exercises/ssr-edge-computing/03-ssr-performance-optimization/solution.tsx',
      testsPath: './src/exercises/ssr-edge-computing/03-ssr-performance-optimization/test.ts',
      instructionsPath: './src/exercises/ssr-edge-computing/03-ssr-performance-optimization/instructions.md',
    },

    {
      id: '04-vercel-edge-functions',
      title: 'Vercel Edge Functions',
      description: 'Build Vercel Edge Functions with geographic routing, A/B testing, personalization, and rate limiting at the edge.',
      category: 'ssr-edge-computing',
      difficulty: 4,
      prerequisites: ['03-ssr-performance-optimization'],
      learningObjectives: [
        'Master Vercel Edge Functions and Edge Runtime patterns',
        'Implement geographic routing and request/response manipulation',
        'Build A/B testing infrastructure at the edge',
        'Create personalization and rate limiting systems'
      ],
      hints: [
        'Use Edge Runtime APIs for optimal performance',
        'Implement consistent A/B testing without client JavaScript',
        'Handle geographic routing with proper fallbacks',
        'Optimize caching strategies for edge distribution'
      ],
      estimatedTime: 75,
      filePath: './exercise-files/ssr-edge-computing/04-vercel-edge-functions/exercise.tsx',
      solutionPath: './src/exercises/ssr-edge-computing/04-vercel-edge-functions/solution.tsx',
      testsPath: './src/exercises/ssr-edge-computing/04-vercel-edge-functions/test.ts',
      instructionsPath: './src/exercises/ssr-edge-computing/04-vercel-edge-functions/instructions.md',
    },

    {
      id: '05-cloudflare-workers-integration',
      title: 'Cloudflare Workers Integration',
      description: 'Build Cloudflare Workers for React applications with KV storage, Durable Objects, and real-time features using WebStreams.',
      category: 'ssr-edge-computing',
      difficulty: 4,
      prerequisites: ['04-vercel-edge-functions'],
      learningObjectives: [
        'Master Cloudflare Workers for React applications',
        'Implement KV storage and Durable Objects patterns',
        'Build real-time features using WebStreams',
        'Create distributed state management systems'
      ],
      hints: [
        'Use Durable Objects for stateful edge computing',
        'Implement efficient KV storage patterns',
        'Handle WebSocket connections with proper cleanup',
        'Optimize streaming for real-time data processing'
      ],
      estimatedTime: 75,
      filePath: './exercise-files/ssr-edge-computing/05-cloudflare-workers-integration/exercise.tsx',
      solutionPath: './src/exercises/ssr-edge-computing/05-cloudflare-workers-integration/solution.tsx',
      testsPath: './src/exercises/ssr-edge-computing/05-cloudflare-workers-integration/test.ts',
      instructionsPath: './src/exercises/ssr-edge-computing/05-cloudflare-workers-integration/instructions.md',
    },

    {
      id: '06-edge-middleware-patterns',
      title: 'Edge Middleware Patterns',
      description: 'Build sophisticated edge middleware systems with authentication, rate limiting, and dynamic routing patterns.',
      category: 'ssr-edge-computing',
      difficulty: 5,
      prerequisites: ['05-cloudflare-workers-integration'],
      learningObjectives: [
        'Build sophisticated edge middleware systems',
        'Implement middleware composition patterns',
        'Create authentication and authorization at edge',
        'Design traffic shaping and security policies'
      ],
      hints: [
        'Use middleware composition for flexibility',
        'Implement proper error handling and recovery',
        'Design efficient authentication flows',
        'Handle edge cases and network failures gracefully'
      ],
      estimatedTime: 90,
      filePath: './exercise-files/ssr-edge-computing/06-edge-middleware-patterns/exercise.tsx',
      solutionPath: './src/exercises/ssr-edge-computing/06-edge-middleware-patterns/solution.tsx',
      testsPath: './src/exercises/ssr-edge-computing/06-edge-middleware-patterns/test.ts',
      instructionsPath: './src/exercises/ssr-edge-computing/06-edge-middleware-patterns/instructions.md',
    }
  ]
};