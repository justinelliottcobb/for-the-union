// GraphQL Exercise Configuration
import type { ExerciseCategory } from '@/types';

export const graphqlCategory: ExerciseCategory = {
  id: 'graphql',
  name: 'GraphQL Integration',
  description: 'Master GraphQL integration with React and TypeScript, from fundamentals to advanced patterns',
  icon: 'IconApi',
  order: 5,
  exercises: [
    // 1. GraphQL Fundamentals (3 exercises)
    {
      id: '01-basic-queries',
      title: 'Basic GraphQL Queries with TypeScript',
      description: 'Master type-safe GraphQL queries, error handling, and response validation without client libraries',
      category: 'graphql',
      difficulty: 3,
      prerequisites: [],
      learningObjectives: [
        'Understand GraphQL query syntax and structure',
        'Define TypeScript interfaces for GraphQL responses', 
        'Implement comprehensive error handling',
        'Master response validation patterns'
      ],
      hints: [
        'Start with the basic GraphQL request structure using fetch()',
        'Define TypeScript interfaces that match your GraphQL schema exactly',
        'Implement runtime validation to ensure API responses match expected types',
        'Handle both network errors and GraphQL errors appropriately'
      ],
      estimatedTime: 30,
      filePath: './exercise-files/graphql/01-basic-queries/exercise.ts',
      solutionPath: './src/exercises/graphql/01-basic-queries/solution.ts',
      testsPath: './src/exercises/graphql/01-basic-queries/test.ts',
      instructionsPath: './src/exercises/graphql/01-basic-queries/instructions.md',
    },
    {
      id: '02-schema-design',
      title: 'GraphQL Schema Design and Type Generation',
      description: 'Design comprehensive schemas with relationships, custom scalars, and pagination patterns',
      category: 'graphql',
      difficulty: 4,
      prerequisites: ['01-basic-queries'],
      learningObjectives: [
        'Design comprehensive GraphQL schemas',
        'Implement pagination patterns effectively',
        'Use custom scalars and enums appropriately',
        'Generate TypeScript types from schema'
      ],
      hints: [
        'Start with core entities and their relationships',
        'Use interfaces and unions for polymorphic data',
        'Implement both cursor-based and offset-based pagination',
        'Design input types for mutations and filters'
      ],
      estimatedTime: 45,
      filePath: './exercise-files/graphql/02-schema-design/exercise.ts',
      solutionPath: './src/exercises/graphql/02-schema-design/solution.ts',
      testsPath: './src/exercises/graphql/02-schema-design/test.ts',
      instructionsPath: './src/exercises/graphql/02-schema-design/instructions.md',
    },
    {
      id: '03-error-handling',
      title: 'Advanced Error Handling and Resilience',
      description: 'Implement robust error handling, retry mechanisms, and graceful degradation strategies',
      category: 'graphql',
      difficulty: 4,
      prerequisites: ['01-basic-queries'],
      learningObjectives: [
        'Implement sophisticated error handling strategies',
        'Build retry mechanisms with exponential backoff',
        'Handle partial data and graceful degradation',
        'Create circuit breaker patterns for resilience'
      ],
      hints: [
        'Distinguish between network errors and GraphQL errors',
        'Implement exponential backoff for retries',
        'Handle partial success in GraphQL responses',
        'Create fallback mechanisms for when queries fail'
      ],
      estimatedTime: 35,
      filePath: './exercise-files/graphql/03-error-handling/exercise.ts',
      solutionPath: './src/exercises/graphql/03-error-handling/solution.ts',
      testsPath: './src/exercises/graphql/03-error-handling/test.ts',
      instructionsPath: './src/exercises/graphql/03-error-handling/instructions.md',
    },
    
    // 2. Apollo Client Integration (4 exercises)
    {
      id: '04-apollo-setup',
      title: 'Apollo Client Setup and Configuration',
      description: 'Configure Apollo Client with InMemoryCache, type policies, and advanced caching strategies',
      category: 'graphql',
      difficulty: 3,
      prerequisites: ['01-basic-queries', '02-schema-design'],
      learningObjectives: [
        'Set up Apollo Client with optimal configuration',
        'Configure InMemoryCache with type policies',
        'Implement field policies for computed fields',
        'Set up development tools and debugging'
      ],
      hints: [
        'Start with basic Apollo Client configuration',
        'Configure the InMemoryCache with proper type policies',
        'Set up field policies for client-side computed fields',
        'Enable Apollo DevTools for debugging'
      ],
      estimatedTime: 40,
      filePath: './exercise-files/graphql/04-apollo-setup/exercise.tsx',
      solutionPath: './src/exercises/graphql/04-apollo-setup/solution.tsx',
      testsPath: './src/exercises/graphql/04-apollo-setup/test.tsx',
      instructionsPath: './src/exercises/graphql/04-apollo-setup/instructions.md',
    },
    {
      id: '05-apollo-hooks',
      title: 'Apollo Client React Hooks Integration',
      description: 'Master useQuery, useMutation, useSubscription hooks with proper TypeScript integration',
      category: 'graphql',
      difficulty: 3,
      prerequisites: ['04-apollo-setup'],
      learningObjectives: [
        'Implement useQuery with loading and error states',
        'Handle mutations with optimistic updates',
        'Set up real-time subscriptions',
        'Integrate with React Suspense and Error Boundaries'
      ],
      hints: [
        'Use generated TypeScript types for all hooks',
        'Handle loading, error, and data states properly',
        'Implement optimistic updates for better UX',
        'Set up proper error boundaries for Apollo errors'
      ],
      estimatedTime: 50,
      filePath: './exercise-files/graphql/05-apollo-hooks/exercise.tsx',
      solutionPath: './src/exercises/graphql/05-apollo-hooks/solution.tsx',
      testsPath: './src/exercises/graphql/05-apollo-hooks/test.tsx',
      instructionsPath: './src/exercises/graphql/05-apollo-hooks/instructions.md',
    },
    {
      id: '06-cache-management',
      title: 'Advanced Apollo Cache Management',
      description: 'Implement sophisticated caching strategies, cache updates, and normalization patterns',
      category: 'graphql',
      difficulty: 5,
      prerequisites: ['05-apollo-hooks'],
      learningObjectives: [
        'Master cache normalization and data consistency',
        'Implement optimistic updates with rollback',
        'Use cache.modify and cache.updateQuery effectively',
        'Design cache-first vs network-first strategies'
      ],
      hints: [
        'Understand how Apollo normalizes data in the cache',
        'Use cache.modify for surgical cache updates',
        'Implement optimistic updates with proper rollback',
        'Choose appropriate fetch policies for different scenarios'
      ],
      estimatedTime: 60,
      filePath: './exercise-files/graphql/06-cache-management/exercise.tsx',
      solutionPath: './src/exercises/graphql/06-cache-management/solution.tsx',
      testsPath: './src/exercises/graphql/06-cache-management/test.tsx',
      instructionsPath: './src/exercises/graphql/06-cache-management/instructions.md',
    },
    {
      id: '07-apollo-advanced',
      title: 'Apollo Client Advanced Patterns',
      description: 'Implement advanced Apollo patterns: links, local state, custom directives, and performance optimization',
      category: 'graphql',
      difficulty: 5,
      prerequisites: ['06-cache-management'],
      learningObjectives: [
        'Create custom Apollo Links for middleware',
        'Manage local state with Apollo Client',
        'Implement custom directives and schema extensions',
        'Optimize performance and implement testing strategies'
      ],
      hints: [
        'Create custom links for authentication and error handling',
        'Use Apollo Client for local state management',
        'Implement custom directives for authorization',
        'Set up comprehensive testing with MockedProvider'
      ],
      estimatedTime: 70,
      filePath: './exercise-files/graphql/07-apollo-advanced/exercise.tsx',
      solutionPath: './src/exercises/graphql/07-apollo-advanced/solution.tsx',
      testsPath: './src/exercises/graphql/07-apollo-advanced/test.tsx',
      instructionsPath: './src/exercises/graphql/07-apollo-advanced/instructions.md',
    },

    // 3. URQL Implementation (3 exercises)
    {
      id: '08-urql-basics',
      title: 'URQL Basic Setup and Querying',
      description: 'Learn URQL fundamentals with TypeScript integration and basic caching',
      category: 'graphql',
      difficulty: 3,
      prerequisites: ['01-basic-queries'],
      learningObjectives: [
        'Set up URQL client with TypeScript',
        'Use URQL hooks for queries and mutations',
        'Understand URQL\'s document caching strategy',
        'Implement error handling with URQL patterns'
      ],
      hints: [
        'URQL uses a document cache by default, different from normalized caching',
        'The useQuery hook provides requestPolicy options',
        'URQL exchanges are composable middleware',
        'TypeScript integration works well with code generation'
      ],
      estimatedTime: 40,
      filePath: './exercise-files/graphql/08-urql-basics/exercise.tsx',
      solutionPath: './src/exercises/graphql/08-urql-basics/solution.tsx',
      testsPath: './src/exercises/graphql/08-urql-basics/test.tsx',
      instructionsPath: './src/exercises/graphql/08-urql-basics/instructions.md',
    },
    {
      id: '09-urql-graphcache',
      title: 'URQL Graphcache Configuration',
      description: 'Configure URQL\'s Graphcache for normalized caching and updates',
      category: 'graphql',
      difficulty: 4,
      prerequisites: ['08-urql-basics'],
      learningObjectives: [
        'Configure Graphcache for normalized caching',
        'Implement cache updates and invalidation',
        'Handle optimistic updates with Graphcache',
        'Design resolvers for computed fields'
      ],
      hints: [
        'Graphcache provides Apollo-like normalized caching for URQL',
        'Use keys configuration to define cache normalization',
        'Resolvers can compute derived data client-side',
        'Updates configuration handles mutation cache updates'
      ],
      estimatedTime: 55,
      filePath: './exercise-files/graphql/09-urql-graphcache/exercise.tsx',
      solutionPath: './src/exercises/graphql/09-urql-graphcache/solution.tsx',
      testsPath: './src/exercises/graphql/09-urql-graphcache/test.tsx',
      instructionsPath: './src/exercises/graphql/09-urql-graphcache/instructions.md',
    },
    {
      id: '10-urql-exchanges',
      title: 'Custom URQL Exchanges and Middleware',
      description: 'Build custom URQL exchanges for authentication, retry logic, and advanced patterns',
      category: 'graphql',
      difficulty: 4,
      prerequisites: ['09-urql-graphcache'],
      learningObjectives: [
        'Create custom URQL exchanges',
        'Implement authentication and retry exchanges',
        'Build middleware for request/response transformation',
        'Understand URQL\'s stream-based architecture'
      ],
      hints: [
        'Exchanges are stream transformers using Wonka streams',
        'The exchange pipeline is composable and order-dependent',
        'Authentication exchanges can handle token refresh',
        'Retry exchanges should implement exponential backoff'
      ],
      estimatedTime: 50,
      filePath: './exercise-files/graphql/10-urql-exchanges/exercise.tsx',
      solutionPath: './src/exercises/graphql/10-urql-exchanges/solution.tsx',
      testsPath: './src/exercises/graphql/10-urql-exchanges/test.tsx',
      instructionsPath: './src/exercises/graphql/10-urql-exchanges/instructions.md',
    },

    // 4. React Query + GraphQL (3 exercises)
    {
      id: '11-react-query-integration',
      title: 'Manual GraphQL Integration with TanStack Query',
      description: 'Integrate GraphQL with React Query for flexible caching and synchronization',
      category: 'graphql',
      difficulty: 4,
      prerequisites: ['03-error-handling'],
      learningObjectives: [
        'Integrate GraphQL queries with React Query',
        'Design query keys for GraphQL operations',
        'Handle GraphQL errors with React Query patterns',
        'Implement background refetching and stale-while-revalidate'
      ],
      hints: [
        'Use structured query keys that reflect GraphQL operation structure',
        'GraphQL queries can be wrapped in standard fetch functions',
        'React Query\'s error handling works well with GraphQL errors',
        'Consider using React Query for client-side state as well'
      ],
      estimatedTime: 45,
      filePath: './exercise-files/graphql/11-react-query-integration/exercise.tsx',
      solutionPath: './src/exercises/graphql/11-react-query-integration/solution.tsx',
      testsPath: './src/exercises/graphql/11-react-query-integration/test.tsx',
      instructionsPath: './src/exercises/graphql/11-react-query-integration/instructions.md',
    },
    {
      id: '12-query-invalidation',
      title: 'Query Invalidation and Cache Synchronization',
      description: 'Master React Query invalidation patterns for GraphQL data consistency',
      category: 'graphql',
      difficulty: 4,
      prerequisites: ['11-react-query-integration'],
      learningObjectives: [
        'Design invalidation strategies for GraphQL mutations',
        'Implement selective cache invalidation patterns',
        'Handle related data updates efficiently',
        'Build cache synchronization across components'
      ],
      hints: [
        'Invalidation patterns should match GraphQL relationship structure',
        'Use query key prefixes for bulk invalidation',
        'Consider both optimistic and pessimistic update strategies',
        'Related queries should be invalidated based on data dependencies'
      ],
      estimatedTime: 50,
      filePath: './exercise-files/graphql/12-query-invalidation/exercise.tsx',
      solutionPath: './src/exercises/graphql/12-query-invalidation/solution.tsx',
      testsPath: './src/exercises/graphql/12-query-invalidation/test.tsx',
      instructionsPath: './src/exercises/graphql/12-query-invalidation/instructions.md',
    },
    {
      id: '13-react-query-optimistic',
      title: 'Optimistic Updates and Error Boundaries',
      description: 'Implement optimistic updates and comprehensive error handling with React Query + GraphQL',
      category: 'graphql',
      difficulty: 5,
      prerequisites: ['12-query-invalidation'],
      learningObjectives: [
        'Implement optimistic updates with React Query',
        'Handle rollbacks on mutation failures',
        'Design error boundaries for GraphQL operations',
        'Build retry mechanisms with exponential backoff'
      ],
      hints: [
        'React Query\'s onMutate can perform optimistic updates',
        'Use onError to rollback optimistic changes',
        'Error boundaries should handle both network and GraphQL errors',
        'Retry logic should differentiate between error types'
      ],
      estimatedTime: 55,
      filePath: './exercise-files/graphql/13-react-query-optimistic/exercise.tsx',
      solutionPath: './src/exercises/graphql/13-react-query-optimistic/solution.tsx',
      testsPath: './src/exercises/graphql/13-react-query-optimistic/test.tsx',
      instructionsPath: './src/exercises/graphql/13-react-query-optimistic/instructions.md',
    },

    // 5. Redux Toolkit Query (RTK Query) with GraphQL (4 exercises)
    {
      id: '14-rtk-query-setup',
      title: 'RTK Query GraphQL Integration Setup',
      description: 'Set up RTK Query with GraphQL endpoints and TypeScript integration',
      category: 'graphql',
      difficulty: 3,
      prerequisites: ['01-basic-queries'],
      learningObjectives: [
        'Configure RTK Query for GraphQL operations',
        'Define GraphQL endpoints with createApi',
        'Implement TypeScript integration with RTK Query',
        'Set up base query for GraphQL requests'
      ],
      hints: [
        'RTK Query can use a custom baseQuery for GraphQL',
        'Endpoints should be defined for each GraphQL operation',
        'Code generation works well with RTK Query TypeScript integration',
        'Tags provide cache invalidation capabilities'
      ],
      estimatedTime: 40,
      filePath: './exercise-files/graphql/14-rtk-query-setup/exercise.tsx',
      solutionPath: './src/exercises/graphql/14-rtk-query-setup/solution.tsx',
      testsPath: './src/exercises/graphql/14-rtk-query-setup/test.tsx',
      instructionsPath: './src/exercises/graphql/14-rtk-query-setup/instructions.md',
    },
    {
      id: '15-rtk-query-endpoints',
      title: 'Building GraphQL Endpoints with createApi',
      description: 'Create comprehensive GraphQL endpoints with queries, mutations, and subscriptions',
      category: 'graphql',
      difficulty: 4,
      prerequisites: ['14-rtk-query-setup'],
      learningObjectives: [
        'Build query endpoints with RTK Query',
        'Implement mutation endpoints with cache updates',
        'Handle GraphQL errors in RTK Query endpoints',
        'Design endpoint transformations for response shaping'
      ],
      hints: [
        'Each GraphQL operation should be a separate endpoint',
        'Mutations can use providesTags and invalidatesTags',
        'transformResponse can reshape GraphQL responses',
        'Error handling should extract GraphQL errors properly'
      ],
      estimatedTime: 50,
      filePath: './exercise-files/graphql/15-rtk-query-endpoints/exercise.tsx',
      solutionPath: './src/exercises/graphql/15-rtk-query-endpoints/solution.tsx',
      testsPath: './src/exercises/graphql/15-rtk-query-endpoints/test.tsx',
      instructionsPath: './src/exercises/graphql/15-rtk-query-endpoints/instructions.md',
    },
    {
      id: '16-rtk-query-cache',
      title: 'Cache Tag Invalidation Strategies',
      description: 'Master RTK Query cache invalidation with tags for GraphQL data consistency',
      category: 'graphql',
      difficulty: 4,
      prerequisites: ['15-rtk-query-endpoints'],
      learningObjectives: [
        'Design cache tag strategies for GraphQL entities',
        'Implement selective invalidation patterns',
        'Handle optimistic updates with RTK Query',
        'Build cache warming and preloading strategies'
      ],
      hints: [
        'Tags should represent both entity types and specific instances',
        'Invalidation patterns should match GraphQL relationship structure',
        'Optimistic updates can use cache updates in RTK Query',
        'Preloading can prime the cache before user interactions'
      ],
      estimatedTime: 55,
      filePath: './exercise-files/graphql/16-rtk-query-cache/exercise.tsx',
      solutionPath: './src/exercises/graphql/16-rtk-query-cache/solution.tsx',
      testsPath: './src/exercises/graphql/16-rtk-query-cache/test.tsx',
      instructionsPath: './src/exercises/graphql/16-rtk-query-cache/instructions.md',
    },
    {
      id: '17-rtk-query-subscriptions',
      title: 'Advanced RTK Query Patterns with GraphQL Subscriptions',
      description: 'Implement real-time subscriptions and advanced caching patterns with RTK Query',
      category: 'graphql',
      difficulty: 5,
      prerequisites: ['16-rtk-query-cache'],
      learningObjectives: [
        'Integrate GraphQL subscriptions with RTK Query',
        'Build streaming data patterns',
        'Handle connection management and errors',
        'Implement cache updates from subscription data'
      ],
      hints: [
        'Subscriptions can be implemented as streaming endpoints',
        'WebSocket management needs careful connection handling',
        'Subscription data should update existing cache entries',
        'Error handling for subscriptions requires reconnection logic'
      ],
      estimatedTime: 65,
      filePath: './exercise-files/graphql/17-rtk-query-subscriptions/exercise.tsx',
      solutionPath: './src/exercises/graphql/17-rtk-query-subscriptions/solution.tsx',
      testsPath: './src/exercises/graphql/17-rtk-query-subscriptions/test.tsx',
      instructionsPath: './src/exercises/graphql/17-rtk-query-subscriptions/instructions.md',
    },

    // 6. Hybrid State Management (3 exercises)
    {
      id: '18-apollo-zustand',
      title: 'Apollo Client + Zustand Integration',
      description: 'Integrate Apollo Client with Zustand for hybrid server and client state management',
      category: 'graphql',
      difficulty: 4,
      prerequisites: ['05-apollo-hooks'],
      learningObjectives: [
        'Integrate Apollo Client with Zustand stores',
        'Design clear boundaries between server and client state',
        'Implement state synchronization patterns',
        'Handle authentication and user state with both systems'
      ],
      hints: [
        'Use Zustand for UI state and user preferences',
        'Apollo should handle server data and caching',
        'State boundaries should be clearly defined',
        'Authentication state might need synchronization'
      ],
      estimatedTime: 50,
      filePath: './exercise-files/graphql/18-apollo-zustand/exercise.tsx',
      solutionPath: './src/exercises/graphql/18-apollo-zustand/solution.tsx',
      testsPath: './src/exercises/graphql/18-apollo-zustand/test.tsx',
      instructionsPath: './src/exercises/graphql/18-apollo-zustand/instructions.md',
    },
    {
      id: '19-state-separation',
      title: 'Server State vs Client State Separation',
      description: 'Design clear architectural boundaries between server and client state management',
      category: 'graphql',
      difficulty: 4,
      prerequisites: ['18-apollo-zustand'],
      learningObjectives: [
        'Architect clear state boundaries',
        'Design patterns for state communication',
        'Implement state normalization strategies',
        'Handle state persistence and hydration'
      ],
      hints: [
        'Server state should be managed by GraphQL clients',
        'Client state should be managed by local state libraries',
        'Communication between states should be explicit',
        'Persistence strategies may differ for different state types'
      ],
      estimatedTime: 45,
      filePath: './exercise-files/graphql/19-state-separation/exercise.tsx',
      solutionPath: './src/exercises/graphql/19-state-separation/solution.tsx',
      testsPath: './src/exercises/graphql/19-state-separation/test.tsx',
      instructionsPath: './src/exercises/graphql/19-state-separation/instructions.md',
    },
    {
      id: '20-state-sync',
      title: 'Complex State Synchronization Patterns',
      description: 'Implement sophisticated synchronization between multiple state management systems',
      category: 'graphql',
      difficulty: 5,
      prerequisites: ['19-state-separation'],
      learningObjectives: [
        'Build bidirectional state synchronization',
        'Handle state conflicts and resolution',
        'Implement event-driven state updates',
        'Design state validation and consistency checks'
      ],
      hints: [
        'Event systems can coordinate between state managers',
        'Conflict resolution needs clear priority rules',
        'State validation should happen at boundaries',
        'Performance considerations for frequent synchronization'
      ],
      estimatedTime: 60,
      filePath: './exercise-files/graphql/20-state-sync/exercise.tsx',
      solutionPath: './src/exercises/graphql/20-state-sync/solution.tsx',
      testsPath: './src/exercises/graphql/20-state-sync/test.tsx',
      instructionsPath: './src/exercises/graphql/20-state-sync/instructions.md',
    },

    // 7. Advanced Patterns (4 exercises)
    {
      id: '21-code-generation',
      title: 'GraphQL Code Generation Integration',
      description: 'Set up comprehensive code generation for types, hooks, and operations',
      category: 'graphql',
      difficulty: 3,
      prerequisites: ['05-apollo-hooks'],
      learningObjectives: [
        'Configure GraphQL Code Generator',
        'Generate TypeScript types from schema',
        'Generate React hooks for operations',
        'Integrate code generation with build pipeline'
      ],
      hints: [
        'GraphQL Code Generator supports multiple frameworks',
        'Configuration should match your GraphQL client choice',
        'Generated types should be version controlled',
        'Build pipeline integration ensures types stay in sync'
      ],
      estimatedTime: 40,
      filePath: './exercise-files/graphql/21-code-generation/exercise.tsx',
      solutionPath: './src/exercises/graphql/21-code-generation/solution.tsx',
      testsPath: './src/exercises/graphql/21-code-generation/test.tsx',
      instructionsPath: './src/exercises/graphql/21-code-generation/instructions.md',
    },
    {
      id: '22-subscriptions-websockets',
      title: 'Real-time Subscriptions with WebSockets',
      description: 'Implement comprehensive real-time GraphQL subscriptions with WebSocket management',
      category: 'graphql',
      difficulty: 5,
      prerequisites: ['07-apollo-advanced'],
      learningObjectives: [
        'Set up GraphQL subscriptions over WebSockets',
        'Handle connection lifecycle and errors',
        'Implement subscription multiplexing',
        'Build real-time UI patterns with subscriptions'
      ],
      hints: [
        'WebSocket lifecycle needs careful management',
        'Subscriptions should handle reconnection gracefully',
        'Multiplexing can optimize connection usage',
        'UI patterns should handle loading and error states'
      ],
      estimatedTime: 65,
      filePath: './exercise-files/graphql/22-subscriptions-websockets/exercise.tsx',
      solutionPath: './src/exercises/graphql/22-subscriptions-websockets/solution.tsx',
      testsPath: './src/exercises/graphql/22-subscriptions-websockets/test.tsx',
      instructionsPath: './src/exercises/graphql/22-subscriptions-websockets/instructions.md',
    },
    {
      id: '23-offline-first',
      title: 'Offline-First GraphQL Applications',
      description: 'Build resilient offline-first applications with GraphQL and local storage',
      category: 'graphql',
      difficulty: 5,
      prerequisites: ['06-cache-management'],
      learningObjectives: [
        'Implement offline data persistence',
        'Build sync strategies for online/offline transitions',
        'Handle conflict resolution for offline edits',
        'Design offline-first UI patterns'
      ],
      hints: [
        'Local storage should persist GraphQL cache',
        'Sync strategies need conflict resolution',
        'Offline edits require queue management',
        'UI should clearly indicate offline state'
      ],
      estimatedTime: 70,
      filePath: './exercise-files/graphql/23-offline-first/exercise.tsx',
      solutionPath: './src/exercises/graphql/23-offline-first/solution.tsx',
      testsPath: './src/exercises/graphql/23-offline-first/test.tsx',
      instructionsPath: './src/exercises/graphql/23-offline-first/instructions.md',
    },
    {
      id: '24-performance-optimization',
      title: 'Performance Optimization and Query Batching',
      description: 'Optimize GraphQL performance with batching, caching, and advanced patterns',
      category: 'graphql',
      difficulty: 5,
      prerequisites: ['21-code-generation'],
      learningObjectives: [
        'Implement query batching and deduplication',
        'Optimize bundle size with code splitting',
        'Build performance monitoring for GraphQL',
        'Implement advanced caching strategies'
      ],
      hints: [
        'Query batching can reduce network requests',
        'Code splitting should be operation-based',
        'Performance monitoring should track query metrics',
        'Advanced caching includes predictive preloading'
      ],
      estimatedTime: 75,
      filePath: './exercise-files/graphql/24-performance-optimization/exercise.tsx',
      solutionPath: './src/exercises/graphql/24-performance-optimization/solution.tsx',
      testsPath: './src/exercises/graphql/24-performance-optimization/test.tsx',
      instructionsPath: './src/exercises/graphql/24-performance-optimization/instructions.md',
    },
  ],
};