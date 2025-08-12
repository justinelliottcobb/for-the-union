# Exercise 1.2: GraphQL Schema Design and Type Generation

## Learning Objectives

By completing this exercise, you will:
- Design comprehensive GraphQL schemas with proper relationships
- Generate TypeScript types from GraphQL schema definitions
- Implement scalar types, enums, and input types effectively
- Master pagination patterns (cursor-based and offset-based)
- Understand schema evolution and versioning strategies

## Background

GraphQL's type system is its most powerful feature, allowing you to define precisely what data is available and how it relates. A well-designed schema serves as a contract between frontend and backend teams, ensuring type safety throughout the application.

This exercise focuses on designing a schema for a social media platform, incorporating complex relationships, custom scalars, and advanced patterns used in production GraphQL APIs.

## Scenario

You're designing the GraphQL schema for "SocialConnect" - a professional networking platform. The schema needs to support:
- User profiles with skills and experience
- Posts with rich content (text, images, polls)
- Comments and reactions system
- Friend connections and follow relationships
- Real-time notifications
- Advanced search and filtering

## Schema Requirements

### Core Entities
- **User**: Profile, skills, work history, preferences
- **Post**: Text, media, polls, metadata, engagement metrics
- **Comment**: Nested comments, reactions, mentions
- **Connection**: Friend requests, followers, professional networks
- **Notification**: Real-time updates, preferences, read status

### Advanced Features
- **Pagination**: Both cursor-based and offset-based
- **Search**: Full-text search with filters and ranking
- **Real-time**: Subscriptions for live updates
- **Media**: File uploads with metadata and processing status
- **Privacy**: Field-level permissions and content visibility

## Tasks

### Task 1: Core Schema Design

Design the complete GraphQL schema including:
- All entity types with proper relationships
- Custom scalar types for specialized data
- Enums for status fields and categories
- Input types for mutations and filters
- Interface and union types for polymorphic data

### Task 2: Query Design

Create comprehensive query definitions:
- Single entity queries with field selection
- List queries with pagination and filtering
- Search queries with ranking and facets
- Nested data fetching with batching considerations

### Task 3: Mutation Design

Design mutations for all CRUD operations:
- User registration and profile management
- Post creation, editing, and deletion
- Comment threads and reactions
- Connection management (follow, unfollow, block)
- File upload handling

### Task 4: Subscription Design

Implement real-time subscriptions:
- New posts from followed users
- Live comment threads
- Notification delivery
- Typing indicators and presence

### Task 5: TypeScript Integration

Generate TypeScript definitions:
- Complete type coverage for all schema elements
- Generic types for pagination patterns
- Utility types for common operations
- Proper handling of nullable and optional fields

## Schema Evolution Considerations

Your schema should support:
- **Backward compatibility** - Adding fields without breaking changes
- **Deprecation strategy** - Marking fields for future removal
- **Versioning approach** - Managing breaking changes
- **Federation readiness** - Designing for microservice architecture

## Expected Implementation

Your solution should demonstrate:
1. **Comprehensive schema coverage** - All social media features
2. **Best practices** - Naming conventions, relationship patterns
3. **Performance considerations** - N+1 prevention, efficient pagination
4. **Type safety** - Complete TypeScript integration
5. **Real-world patterns** - Production-ready schema design

## Testing Strategy

The tests will verify:
- Schema parses and validates correctly
- All types are properly defined and related
- Generated TypeScript types match schema
- Pagination patterns work correctly
- Input validation handles edge cases

## Advanced Patterns to Implement

### Relay-style Pagination
```graphql
type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}
```

### Union Types for Polymorphic Data
```graphql
union FeedItem = Post | Article | Poll | Event
```

### Interface Implementation
```graphql
interface Node {
  id: ID!
}

interface Reactable {
  reactions: ReactionConnection!
  totalReactions: Int!
}
```

### Custom Scalars
```graphql
scalar DateTime
scalar EmailAddress
scalar URL
scalar JSON
scalar Upload
```

## Success Criteria

✅ Complete schema covers all social media features  
✅ Proper relationships between all entities  
✅ Pagination patterns implemented correctly  
✅ Custom scalars and enums used appropriately  
✅ TypeScript types generated and validated  
✅ Schema follows GraphQL best practices  
✅ Performance and N+1 considerations addressed  
✅ Real-time subscription support included