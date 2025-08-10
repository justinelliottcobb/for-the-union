// GraphQL Exercise Configuration
import type { ExerciseCategory } from '@/types';

export const graphqlCategory: ExerciseCategory = {
  id: 'graphql',
  name: 'GraphQL Integration',
  description: 'Master GraphQL integration with React and TypeScript, from fundamentals to advanced patterns',
  icon: 'IconApi',
  order: 5,
  exercises: [
    // 1. GraphQL Fundamentals
    {
      id: 'basic-queries',
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
      testsPath: './src/exercises/graphql/01-basic-queries/test.spec.ts',
      instructionsPath: './src/exercises/graphql/01-basic-queries/instructions.md',
    },
    {
      id: 'schema-design',
      title: 'GraphQL Schema Design and Type Generation',
      description: 'Design comprehensive schemas with relationships, custom scalars, and pagination patterns',
      category: 'graphql',
      difficulty: 4,
      prerequisites: ['basic-queries'],
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
      testsPath: './src/exercises/graphql/02-schema-design/test.spec.ts',
      instructionsPath: './src/exercises/graphql/02-schema-design/instructions.md',
    },
    {
      id: 'error-handling',
      title: 'Advanced Error Handling and Resilience',
      description: 'Implement robust error handling, retry mechanisms, and graceful degradation strategies',
      category: 'graphql',
      difficulty: 4,
      prerequisites: ['basic-queries'],
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
      testsPath: './src/exercises/graphql/03-error-handling/test.spec.ts',
      instructionsPath: './src/exercises/graphql/03-error-handling/instructions.md',
    },
    
    // 2. Apollo Client Integration
    {
      id: 'apollo-setup',
      title: 'Apollo Client Setup and Configuration',
      description: 'Configure Apollo Client with InMemoryCache, type policies, and advanced caching strategies',
      category: 'graphql',
      difficulty: 3,
      prerequisites: ['basic-queries', 'schema-design'],
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
      testsPath: './src/exercises/graphql/04-apollo-setup/test.spec.tsx',
      instructionsPath: './src/exercises/graphql/04-apollo-setup/instructions.md',
    },
    {
      id: 'apollo-hooks',
      title: 'Apollo Client React Hooks Integration',
      description: 'Master useQuery, useMutation, useSubscription hooks with proper TypeScript integration',
      category: 'graphql',
      difficulty: 3,
      prerequisites: ['apollo-setup'],
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
      testsPath: './src/exercises/graphql/05-apollo-hooks/test.spec.tsx',
      instructionsPath: './src/exercises/graphql/05-apollo-hooks/instructions.md',
    },
    {
      id: 'cache-management',
      title: 'Advanced Apollo Cache Management',
      description: 'Implement sophisticated caching strategies, cache updates, and normalization patterns',
      category: 'graphql',
      difficulty: 5,
      prerequisites: ['apollo-hooks'],
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
      testsPath: './src/exercises/graphql/06-cache-management/test.spec.tsx',
      instructionsPath: './src/exercises/graphql/06-cache-management/instructions.md',
    },
    {
      id: 'apollo-advanced',
      title: 'Apollo Client Advanced Patterns',
      description: 'Implement advanced Apollo patterns: links, local state, custom directives, and performance optimization',
      category: 'graphql',
      difficulty: 5,
      prerequisites: ['cache-management'],
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
      testsPath: './src/exercises/graphql/07-apollo-advanced/test.spec.tsx',
      instructionsPath: './src/exercises/graphql/07-apollo-advanced/instructions.md',
    },
  ],
};