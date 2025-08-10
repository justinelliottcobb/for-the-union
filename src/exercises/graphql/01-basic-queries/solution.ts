// Complete solution for GraphQL Basic Queries exercise

import {
  Product,
  Category,
  ProductQueryVariables,
  ProductsQueryVariables,
  ProductsByCategoryQueryVariables,
  ProductQueryResponse,
  ProductsQueryResponse,
  ProductsByCategoryQueryResponse,
  GraphQLResponse,
  GraphQLError,
  QueryError,
  NetworkError,
  GraphQLQueryError,
  ValidationError,
} from './types';

const GRAPHQL_ENDPOINT = 'https://api.example.com/graphql';

// Base GraphQL query executor with comprehensive error handling
async function executeGraphQLQuery<TResponse, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables
): Promise<GraphQLResponse<TResponse>> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In real scenarios, you'd include authentication:
        // 'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        query,
        variables: variables || {},
      }),
    });

    if (!response.ok) {
      throw createNetworkError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    const jsonResponse = await response.json();
    
    // Validate that response has the expected GraphQL structure
    if (typeof jsonResponse !== 'object' || jsonResponse === null) {
      throw createNetworkError('Invalid JSON response from GraphQL endpoint');
    }

    return jsonResponse as GraphQLResponse<TResponse>;
  } catch (error) {
    // Handle fetch errors (network issues, DNS failures, etc.)
    if (error instanceof TypeError) {
      throw createNetworkError('Network request failed - check your connection');
    }
    
    // Re-throw our custom errors
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    // Wrap unexpected errors
    throw createNetworkError(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Runtime validation functions with comprehensive type checking
function validateCategory(data: unknown): data is Category {
  if (!data || typeof data !== 'object') return false;
  
  const category = data as Record<string, unknown>;
  
  return (
    typeof category.id === 'string' &&
    category.id.length > 0 &&
    typeof category.name === 'string' &&
    category.name.length > 0 &&
    (category.description === null || typeof category.description === 'string')
  );
}

function validateProduct(data: unknown): data is Product {
  if (!data || typeof data !== 'object') return false;
  
  const product = data as Record<string, unknown>;
  
  return (
    typeof product.id === 'string' &&
    product.id.length > 0 &&
    typeof product.name === 'string' &&
    product.name.length > 0 &&
    (product.description === null || typeof product.description === 'string') &&
    typeof product.price === 'number' &&
    product.price >= 0 &&
    typeof product.inStock === 'boolean' &&
    Array.isArray(product.tags) &&
    product.tags.every((tag: unknown) => typeof tag === 'string') &&
    typeof product.createdAt === 'string' &&
    product.createdAt.length > 0 &&
    product.category &&
    validateCategory(product.category)
  );
}

function validateProductArray(data: unknown): data is Product[] {
  if (!Array.isArray(data)) return false;
  return data.every(validateProduct);
}

// Error creation utilities with proper typing
function createNetworkError(message: string, status?: number): NetworkError {
  const error = new Error(message) as NetworkError;
  error.code = 'NETWORK_ERROR';
  error.status = status;
  error.name = 'NetworkError';
  return error;
}

function createGraphQLError(
  message: string,
  graphqlErrors: GraphQLError[] = []
): GraphQLQueryError {
  const error = new Error(message) as GraphQLQueryError;
  error.code = 'GRAPHQL_ERROR';
  error.graphqlErrors = graphqlErrors;
  error.name = 'GraphQLQueryError';
  return error;
}

function createValidationError(message: string, field: string): ValidationError {
  const error = new Error(message) as ValidationError;
  error.code = 'VALIDATION_ERROR';
  error.field = field;
  error.name = 'ValidationError';
  return error;
}

// Query implementations with full error handling and validation

export async function fetchProduct(id: string): Promise<Product | null> {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw createValidationError('Product ID must be a non-empty string', 'id');
  }

  const query = `
    query GetProduct($id: ID!) {
      product(id: $id) {
        id
        name
        description
        price
        category {
          id
          name
          description
        }
        inStock
        tags
        createdAt
      }
    }
  `;

  const variables: ProductQueryVariables = { id: id.trim() };

  try {
    const response = await executeGraphQLQuery<ProductQueryResponse, ProductQueryVariables>(
      query,
      variables
    );

    // Handle GraphQL errors
    if (response.errors && response.errors.length > 0) {
      throw createGraphQLError(
        `GraphQL query failed: ${response.errors.map(e => e.message).join(', ')}`,
        response.errors
      );
    }

    // Check if data exists
    if (!response.data) {
      throw createGraphQLError('No data returned from GraphQL query');
    }

    // Handle the case where product is null (valid GraphQL response)
    const product = response.data.product;
    if (product === null) {
      return null;
    }

    // Validate the product structure
    if (!validateProduct(product)) {
      throw createValidationError('Invalid product data structure received from API', 'product');
    }

    return product;
  } catch (error) {
    // Re-throw known error types
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    // Wrap unexpected errors
    throw createNetworkError(
      `Unexpected error fetching product: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function fetchProducts(limit?: number, offset?: number): Promise<Product[]> {
  // Validate parameters
  if (limit !== undefined && (typeof limit !== 'number' || limit <= 0 || !Number.isInteger(limit))) {
    throw createValidationError('Limit must be a positive integer', 'limit');
  }
  
  if (offset !== undefined && (typeof offset !== 'number' || offset < 0 || !Number.isInteger(offset))) {
    throw createValidationError('Offset must be a non-negative integer', 'offset');
  }

  const query = `
    query GetProducts($limit: Int, $offset: Int) {
      products(limit: $limit, offset: $offset) {
        id
        name
        description
        price
        category {
          id
          name
          description
        }
        inStock
        tags
        createdAt
      }
    }
  `;

  const variables: ProductsQueryVariables = {};
  if (limit !== undefined) variables.limit = limit;
  if (offset !== undefined) variables.offset = offset;

  try {
    const response = await executeGraphQLQuery<ProductsQueryResponse, ProductsQueryVariables>(
      query,
      variables
    );

    if (response.errors && response.errors.length > 0) {
      throw createGraphQLError(
        `GraphQL query failed: ${response.errors.map(e => e.message).join(', ')}`,
        response.errors
      );
    }

    if (!response.data) {
      throw createGraphQLError('No data returned from GraphQL query');
    }

    // Validate products array
    if (!validateProductArray(response.data.products)) {
      throw createValidationError('Invalid products data structure received from API', 'products');
    }

    return response.data.products;
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    throw createNetworkError(
      `Unexpected error fetching products: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function fetchProductsByCategory(categoryId: string, limit?: number): Promise<Product[]> {
  if (!categoryId || typeof categoryId !== 'string' || categoryId.trim().length === 0) {
    throw createValidationError('Category ID must be a non-empty string', 'categoryId');
  }

  if (limit !== undefined && (typeof limit !== 'number' || limit <= 0 || !Number.isInteger(limit))) {
    throw createValidationError('Limit must be a positive integer', 'limit');
  }

  const query = `
    query GetProductsByCategory($categoryId: ID!, $limit: Int) {
      productsByCategory(categoryId: $categoryId, limit: $limit) {
        id
        name
        description
        price
        category {
          id
          name
          description
        }
        inStock
        tags
        createdAt
      }
    }
  `;

  const variables: ProductsByCategoryQueryVariables = { categoryId: categoryId.trim() };
  if (limit !== undefined) variables.limit = limit;

  try {
    const response = await executeGraphQLQuery<ProductsByCategoryQueryResponse, ProductsByCategoryQueryVariables>(
      query,
      variables
    );

    if (response.errors && response.errors.length > 0) {
      throw createGraphQLError(
        `GraphQL query failed: ${response.errors.map(e => e.message).join(', ')}`,
        response.errors
      );
    }

    if (!response.data) {
      throw createGraphQLError('No data returned from GraphQL query');
    }

    if (!validateProductArray(response.data.productsByCategory)) {
      throw createValidationError(
        'Invalid products by category data structure received from API',
        'productsByCategory'
      );
    }

    return response.data.productsByCategory;
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    throw createNetworkError(
      `Unexpected error fetching products by category: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Generic query wrapper that converts exceptions to return values
export async function safeGraphQLQuery<T>(
  queryFn: () => Promise<T>
): Promise<{ data?: T; error?: QueryError }> {
  try {
    const data = await queryFn();
    return { data, error: undefined };
  } catch (error) {
    // Check if it's one of our known error types
    if (error instanceof Error && 'code' in error) {
      const knownCodes = ['NETWORK_ERROR', 'GRAPHQL_ERROR', 'VALIDATION_ERROR'];
      if (knownCodes.includes((error as any).code)) {
        return { data: undefined, error: error as QueryError };
      }
    }
    
    // Wrap unexpected errors
    return {
      data: undefined,
      error: createNetworkError(
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    };
  }
}

// Advanced: Query batching implementation
export async function batchQueries<T extends Record<string, unknown>>(
  queries: Array<{ query: string; variables?: Record<string, unknown>; key: string }>
): Promise<Record<string, GraphQLResponse<T>>> {
  if (queries.length === 0) {
    return {};
  }

  // Create a single GraphQL query with multiple named operations
  const operationDefinitions: string[] = [];
  const mergedVariables: Record<string, unknown> = {};
  
  queries.forEach((q, index) => {
    // Create unique operation name
    const operationName = `Operation_${q.key}_${index}`;
    
    // Extract the query body (remove any existing query wrapper)
    const queryBody = q.query.replace(/^\s*query\s+\w*\s*(\([^)]*\))?\s*{/, '').replace(/}\s*$/, '');
    
    // Create the named operation
    operationDefinitions.push(`
      ${operationName}: {
        ${queryBody}
      }
    `);
    
    // Merge variables with unique prefixes
    if (q.variables) {
      Object.entries(q.variables).forEach(([key, value]) => {
        mergedVariables[`${operationName}_${key}`] = value;
      });
    }
  });

  // Combine all operations into a single query
  const batchedQuery = `
    query BatchedOperations {
      ${operationDefinitions.join('\n')}
    }
  `;

  try {
    const response = await executeGraphQLQuery<Record<string, T>>(batchedQuery, mergedVariables);
    
    // Transform the response back into individual query results
    const results: Record<string, GraphQLResponse<T>> = {};
    
    queries.forEach((q, index) => {
      const operationName = `Operation_${q.key}_${index}`;
      results[q.key] = {
        data: response.data?.[operationName],
        errors: response.errors, // Share errors across all batched queries
      };
    });
    
    return results;
  } catch (error) {
    // If batching fails, return error for all queries
    const errorResponse: GraphQLResponse<T> = {
      data: undefined,
      errors: [
        {
          message: error instanceof Error ? error.message : 'Batch query failed',
          extensions: { code: 'BATCH_ERROR' }
        }
      ]
    };
    
    const results: Record<string, GraphQLResponse<T>> = {};
    queries.forEach(q => {
      results[q.key] = errorResponse;
    });
    
    return results;
  }
}