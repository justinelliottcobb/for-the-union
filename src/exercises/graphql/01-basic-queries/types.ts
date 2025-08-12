// Shared TypeScript definitions for GraphQL Basic Queries exercise

// Scalar Types
export type DateTime = string; // ISO 8601 datetime string
export type ID = string;

// Core Domain Types
export interface Category {
  id: ID;
  name: string;
  description: string | null;
}

export interface Product {
  id: ID;
  name: string;
  description: string | null;
  price: number;
  category: Category;
  inStock: boolean;
  tags: string[];
  createdAt: DateTime;
}

// Query Variables
export interface ProductQueryVariables {
  id: ID;
}

export interface ProductsQueryVariables {
  limit?: number;
  offset?: number;
}

export interface ProductsByCategoryQueryVariables {
  categoryId: ID;
  limit?: number;
}

// GraphQL Response Wrapper
export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

// Query Response Types
export interface ProductQueryResponse {
  product: Product | null;
}

export interface ProductsQueryResponse {
  products: Product[];
}

export interface ProductsByCategoryQueryResponse {
  productsByCategory: Product[];
}

// Error Types
export interface NetworkError extends Error {
  code: 'NETWORK_ERROR';
  status?: number;
}

export interface GraphQLQueryError extends Error {
  code: 'GRAPHQL_ERROR';
  graphqlErrors: GraphQLError[];
}

export interface ValidationError extends Error {
  code: 'VALIDATION_ERROR';
  field: string;
}

export type QueryError = NetworkError | GraphQLQueryError | ValidationError;

// Query Result Type
export interface QueryResult<T> {
  data?: T;
  error?: QueryError;
  loading: boolean;
}