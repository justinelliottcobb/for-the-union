# Exercise 21: GraphQL Code Generation

## 🎯 Learning Objectives
- Master GraphQL Code Generator setup and configuration
- Generate type-safe TypeScript definitions from GraphQL schema
- Create automated React hooks for queries, mutations, and subscriptions
- Implement fragment composition and reusable operation patterns
- Build custom code generation templates for specific use cases

## 📚 Concepts Covered

### Code Generation Benefits
- **Type Safety**: Automatic TypeScript interfaces from GraphQL schema
- **Developer Experience**: Full IntelliSense support and autocompletion
- **Error Prevention**: Compile-time validation of GraphQL operations
- **Performance Optimization**: Generated operations with optimal field selection
- **Consistency**: Standardized patterns across the application

### Generated Artifacts
- TypeScript type definitions for all GraphQL schema types
- Type-safe React hooks (useQuery, useMutation, useSubscription)
- Operation variables and result type interfaces
- Fragment type definitions and composition helpers
- Custom scalar type mappings and transformations

## 🚀 Exercise Tasks

### Part 1: Code Generator Setup (⭐⭐⭐)

1. **Install Dependencies**
   ```bash
   npm install -D @graphql-codegen/cli @graphql-codegen/typescript \
     @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo
   ```

2. **Create Configuration File**
   - Create `codegen.yml` in project root
   - Configure schema endpoint and document patterns
   - Set up TypeScript and React Apollo plugins
   - Configure scalar type mappings

3. **Update Package Scripts**
   ```json
   {
     "scripts": {
       "graphql-codegen": "graphql-codegen",
       "graphql-codegen:watch": "graphql-codegen --watch"
     }
   }
   ```

### Part 2: GraphQL Operations (⭐⭐⭐⭐)

1. **Create Operation Files**
   - Set up `src/graphql/` directory structure
   - Create separate files for users, posts, comments operations
   - Write comprehensive queries with nested selections
   - Add mutations with proper error handling

2. **Fragment Composition**
   - Create reusable fragments for common data patterns
   - Implement fragment spreading and composition
   - Set up hierarchical fragment inheritance
   - Document fragment dependencies

3. **Operation Optimization**
   - Use field aliases for computed properties
   - Implement proper pagination patterns
   - Add operation directives (@include, @skip)
   - Configure query complexity analysis

### Part 3: Generated Code Usage (⭐⭐⭐⭐⭐)

1. **Type-Safe Components**
   - Replace manual typing with generated interfaces
   - Use generated hooks instead of raw useQuery/useMutation
   - Implement proper error handling with generated types
   - Add loading states with discriminated unions

2. **Cache Integration**
   - Use generated types for cache modifications
   - Implement optimistic updates with proper typing
   - Set up cache policies with generated field policies
   - Create type-safe cache helpers

3. **Form Validation**
   - Use generated input types for form validation
   - Implement runtime validation with generated schemas
   - Create reusable form components with generated types
   - Add proper error message mapping

### Part 4: Advanced Patterns (⭐⭐⭐⭐⭐)

1. **Custom Templates**
   - Create custom Handlebars templates for specific patterns
   - Generate utility functions for common operations
   - Build custom hook wrappers with additional functionality
   - Create documentation from GraphQL schema

2. **Plugin Customization**
   - Configure plugin options for optimal output
   - Set up custom naming conventions
   - Implement tree-shaking friendly exports
   - Add custom transformations for specific fields

3. **Workflow Integration**
   - Set up pre-commit hooks for code generation
   - Integrate with CI/CD pipeline
   - Create schema validation rules
   - Set up automatic PR generation for schema changes

## 🔧 Implementation Guide

### Configuration Example
```yaml
overwrite: true
schema: "http://localhost:4000/graphql"
documents: "src/graphql/**/*.graphql"
generates:
  src/graphql/generated.ts:
    plugins:
      - "typescript"
      - "typescript-operations"
      - "typescript-react-apollo"
    config:
      withHooks: true
      withComponent: false
      withHOC: false
      apolloReactHooksImportFrom: "@apollo/client"
      maybeValue: T | null | undefined
      avoidOptionals:
        field: true
        object: true
      scalars:
        DateTime: string
        JSON: any
        Upload: File
```

### Fragment Composition Pattern
```graphql
fragment UserCore on User {
  id
  email
  createdAt
  updatedAt
}

fragment UserProfile on User {
  ...UserCore
  profile {
    firstName
    lastName
    avatar
    bio
    location
  }
}

fragment UserWithStats on User {
  ...UserProfile
  stats {
    postsCount
    followersCount
    followingCount
  }
}

query GetUserDetails($id: ID!) {
  user(id: $id) {
    ...UserWithStats
    posts(first: 5) {
      edges {
        node {
          id
          title
          excerpt
          createdAt
        }
      }
    }
  }
}
```

### Generated Hook Usage
```typescript
import {
  GetUserDetailsQuery,
  GetUserDetailsQueryVariables,
  useGetUserDetailsQuery,
  UserCoreFragment
} from '../graphql/generated';

const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const { data, loading, error, refetch } = useGetUserDetailsQuery({
    variables: { id: userId },
    errorPolicy: 'partial',
    notifyOnNetworkStatusChange: true
  });

  if (loading) return <UserProfileSkeleton />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  if (!data?.user) return <UserNotFound />;

  return <UserCard user={data.user} />;
};
```

## 🧪 Testing Requirements

### Generated Code Testing
```typescript
// Test generated types
const mockUser: UserCoreFragment = {
  id: '1',
  email: 'test@example.com',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

// Test generated hooks
const { result } = renderHook(() => useGetUserDetailsQuery({
  variables: { id: '1' }
}), {
  wrapper: MockedProvider,
  mocks: [getUserDetailsMock]
});
```

### Schema Validation Testing
```typescript
// Validate operations against schema
import { validate } from 'graphql';
import { schema } from '../schema';
import { GetUserDetailsDocument } from '../generated';

test('operation is valid against schema', () => {
  const errors = validate(schema, GetUserDetailsDocument);
  expect(errors).toHaveLength(0);
});
```

## 🎯 Acceptance Criteria

### Core Functionality
- [ ] GraphQL Code Generator properly configured and running
- [ ] All GraphQL operations generate type-safe hooks
- [ ] Generated types are used throughout the application
- [ ] Fragment composition working with proper type inference
- [ ] Custom scalar mappings functioning correctly

### Advanced Features
- [ ] Custom templates generating utility functions
- [ ] Optimistic updates using generated types
- [ ] Form validation with generated input types
- [ ] Cache policies using generated type information
- [ ] Error handling with proper type discrimination

### Code Quality
- [ ] No `any` types in generated code usage
- [ ] Proper error boundary implementation
- [ ] Loading states handled with discriminated unions
- [ ] All generated hooks properly typed
- [ ] Custom templates follow TypeScript best practices

### Performance
- [ ] Generated operations optimized for minimal data fetching
- [ ] Fragment deduplication working correctly
- [ ] Tree-shaking friendly exports
- [ ] Lazy-loaded generated components
- [ ] Minimal bundle size impact from generated code

## 🚀 Bonus Challenges

### Schema Evolution
- Implement schema versioning with generated types
- Create migration utilities for breaking changes
- Set up automated schema compatibility testing
- Build schema documentation generator

### Developer Experience
- Create VS Code snippets for generated operations
- Set up automatic import suggestions
- Build schema explorer with generated types
- Create GraphQL playground integration

### Advanced Templates
- Generate mock data from schema types
- Create test utilities from operations
- Build documentation from schema annotations
- Generate API client SDKs for different platforms

## 📖 Key Concepts to Understand

### Code Generation Pipeline
- Schema introspection and parsing
- Document analysis and validation  
- Plugin architecture and customization
- Template processing and output generation

### Type Safety Benefits
- Compile-time operation validation
- Automatic refactoring support
- IntelliSense and autocompletion
- Runtime error prevention

### Performance Considerations
- Generated code bundle size
- Tree-shaking optimization
- Lazy loading strategies
- Cache efficiency with typed operations

---

**Estimated Time:** 75-90 minutes

**Difficulty:** ⭐⭐⭐⭐⭐ (Expert - Advanced tooling and automation)

**Prerequisites:** 
- GraphQL schema design knowledge
- TypeScript advanced patterns
- Build tool configuration experience
- Template engine familiarity