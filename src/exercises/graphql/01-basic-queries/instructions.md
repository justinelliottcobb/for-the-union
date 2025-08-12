# Exercise 1.1: Basic GraphQL Queries with TypeScript

## Learning Objectives

By completing this exercise, you will:
- Understand GraphQL query syntax and structure
- Learn to define TypeScript interfaces for GraphQL responses
- Master basic error handling patterns for GraphQL operations
- Implement type-safe GraphQL queries without a client library

## Background

GraphQL is a query language and runtime for APIs that allows clients to request exactly the data they need. Unlike REST APIs that return fixed data structures, GraphQL enables precise data fetching through its flexible query system.

In this exercise, you'll work with a product catalog system, implementing basic GraphQL queries with full TypeScript integration.

## Scenario

You're building an e-commerce product catalog that needs to fetch product information from a GraphQL API. The API provides product details, categories, and inventory information through a well-defined schema.

## GraphQL Schema (Reference)

```graphql
type Product {
  id: ID!
  name: String!
  description: String
  price: Float!
  category: Category!
  inStock: Boolean!
  tags: [String!]!
  createdAt: DateTime!
}

type Category {
  id: ID!
  name: String!
  description: String
}

scalar DateTime

type Query {
  product(id: ID!): Product
  products(limit: Int, offset: Int): [Product!]!
  productsByCategory(categoryId: ID!, limit: Int): [Product!]!
}
```

## Tasks

### Task 1: Define TypeScript Interfaces

Create comprehensive TypeScript interfaces that match the GraphQL schema, including:
- Proper scalar type mappings
- Nullable vs non-nullable field handling
- Nested object relationships

### Task 2: Implement Query Functions

Build functions to execute GraphQL queries:
- `fetchProduct(id: string)` - Get single product by ID
- `fetchProducts(limit?: number, offset?: number)` - Get products with pagination  
- `fetchProductsByCategory(categoryId: string, limit?: number)` - Get products by category

### Task 3: Error Handling

Implement comprehensive error handling:
- Network error detection
- GraphQL error parsing
- Type-safe error responses
- Fallback mechanisms

### Task 4: Response Validation

Add runtime validation to ensure API responses match expected types:
- Validate required fields exist
- Check data types match expectations
- Handle malformed responses gracefully

## Expected Implementation

Your solution should handle these scenarios:
1. Successful product queries with complete data
2. Partial data responses (missing optional fields)
3. Network failures and timeouts
4. GraphQL errors (invalid IDs, server errors)
5. Malformed JSON responses

## Testing Strategy

The tests will verify:
- Correct TypeScript interfaces are defined
- Query functions return properly typed data
- Error cases are handled appropriately
- Edge cases like empty results are managed
- Network timeouts are handled gracefully

## Hints

Need help getting started? Check `hints.ts` for progressive guidance on:
- Setting up the basic type structure
- Implementing the fetch logic
- Adding error handling
- Validating responses

## Advanced Considerations

Think about these aspects as you implement:
- How would you implement query caching?
- What about request deduplication?
- How could you add query complexity analysis?
- What patterns would work for subscription queries?

## Success Criteria

✅ TypeScript interfaces match GraphQL schema exactly  
✅ All query functions are fully typed  
✅ Error handling covers all failure modes  
✅ Response validation prevents runtime errors  
✅ Code follows TypeScript strict mode  
✅ All tests pass with comprehensive coverage