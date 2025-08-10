// Comprehensive tests for GraphQL Basic Queries exercise

import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import {
  fetchProduct,
  fetchProducts,
  fetchProductsByCategory,
  safeGraphQLQuery,
  batchQueries,
} from './exercise';
import { Product, GraphQLResponse } from './types';

// Mock fetch globally
const mockFetch = vi.fn() as MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Test data fixtures
const mockCategory = {
  id: 'cat-1',
  name: 'Electronics',
  description: 'Electronic devices and accessories',
};

const mockProduct: Product = {
  id: 'prod-1',
  name: 'Laptop',
  description: 'High-performance laptop',
  price: 999.99,
  category: mockCategory,
  inStock: true,
  tags: ['electronics', 'computing'],
  createdAt: '2024-01-01T00:00:00Z',
};

const mockProducts: Product[] = [
  mockProduct,
  {
    id: 'prod-2',
    name: 'Mouse',
    description: null,
    price: 29.99,
    category: mockCategory,
    inStock: false,
    tags: ['electronics', 'peripherals'],
    createdAt: '2024-01-02T00:00:00Z',
  },
];

describe('GraphQL Basic Queries', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('fetchProduct', () => {
    it('should fetch a product successfully', async () => {
      const mockResponse: GraphQLResponse<{ product: Product }> = {
        data: { product: mockProduct },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await fetchProduct('prod-1');
      
      expect(result).toEqual(mockProduct);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/graphql',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: expect.stringContaining('query GetProduct($id: ID!)'),
            variables: { id: 'prod-1' },
          }),
        })
      );
    });

    it('should return null when product is not found', async () => {
      const mockResponse: GraphQLResponse<{ product: null }> = {
        data: { product: null },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await fetchProduct('nonexistent');
      expect(result).toBeNull();
    });

    it('should handle GraphQL errors', async () => {
      const mockResponse: GraphQLResponse<{ product: Product }> = {
        data: { product: mockProduct },
        errors: [
          {
            message: 'Product not found',
            path: ['product'],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      await expect(fetchProduct('invalid-id')).rejects.toThrow('GraphQL query failed');
    });

    it('should handle network errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(fetchProduct('prod-1')).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should validate product ID parameter', async () => {
      await expect(fetchProduct('')).rejects.toThrow('Product ID must be a non-empty string');
      await expect(fetchProduct('   ')).rejects.toThrow('Product ID must be a non-empty string');
    });

    it('should handle invalid product data structure', async () => {
      const mockResponse = {
        data: {
          product: {
            id: 'prod-1',
            // Missing required fields
            name: 'Laptop',
            // price is missing
            inStock: true,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      await expect(fetchProduct('prod-1')).rejects.toThrow('Invalid product data structure');
    });
  });

  describe('fetchProducts', () => {
    it('should fetch products list successfully', async () => {
      const mockResponse: GraphQLResponse<{ products: Product[] }> = {
        data: { products: mockProducts },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await fetchProducts();
      expect(result).toEqual(mockProducts);
    });

    it('should handle pagination parameters', async () => {
      const mockResponse: GraphQLResponse<{ products: Product[] }> = {
        data: { products: [mockProduct] },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      await fetchProducts(10, 20);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/graphql',
        expect.objectContaining({
          body: JSON.stringify({
            query: expect.stringContaining('query GetProducts($limit: Int, $offset: Int)'),
            variables: { limit: 10, offset: 20 },
          }),
        })
      );
    });

    it('should validate pagination parameters', async () => {
      await expect(fetchProducts(-1)).rejects.toThrow('Limit must be a positive integer');
      await expect(fetchProducts(0)).rejects.toThrow('Limit must be a positive integer');
      await expect(fetchProducts(1.5)).rejects.toThrow('Limit must be a positive integer');
      await expect(fetchProducts(undefined, -1)).rejects.toThrow('Offset must be a non-negative integer');
      await expect(fetchProducts(undefined, 1.5)).rejects.toThrow('Offset must be a non-negative integer');
    });

    it('should return empty array when no products found', async () => {
      const mockResponse: GraphQLResponse<{ products: Product[] }> = {
        data: { products: [] },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await fetchProducts();
      expect(result).toEqual([]);
    });
  });

  describe('fetchProductsByCategory', () => {
    it('should fetch products by category successfully', async () => {
      const mockResponse: GraphQLResponse<{ productsByCategory: Product[] }> = {
        data: { productsByCategory: mockProducts },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await fetchProductsByCategory('cat-1');
      expect(result).toEqual(mockProducts);
    });

    it('should handle limit parameter', async () => {
      const mockResponse: GraphQLResponse<{ productsByCategory: Product[] }> = {
        data: { productsByCategory: [mockProduct] },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      await fetchProductsByCategory('cat-1', 5);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/graphql',
        expect.objectContaining({
          body: JSON.stringify({
            query: expect.stringContaining('query GetProductsByCategory($categoryId: ID!, $limit: Int)'),
            variables: { categoryId: 'cat-1', limit: 5 },
          }),
        })
      );
    });

    it('should validate category ID parameter', async () => {
      await expect(fetchProductsByCategory('')).rejects.toThrow('Category ID must be a non-empty string');
      await expect(fetchProductsByCategory('   ')).rejects.toThrow('Category ID must be a non-empty string');
    });
  });

  describe('safeGraphQLQuery', () => {
    it('should return data when query succeeds', async () => {
      const mockQueryFn = vi.fn().mockResolvedValue(mockProduct);

      const result = await safeGraphQLQuery(mockQueryFn);

      expect(result).toEqual({
        data: mockProduct,
        error: undefined,
      });
    });

    it('should return error when query fails', async () => {
      const mockError = new Error('Network failed') as any;
      mockError.code = 'NETWORK_ERROR';
      
      const mockQueryFn = vi.fn().mockRejectedValue(mockError);

      const result = await safeGraphQLQuery(mockQueryFn);

      expect(result).toEqual({
        data: undefined,
        error: mockError,
      });
    });

    it('should wrap unexpected errors', async () => {
      const mockQueryFn = vi.fn().mockRejectedValue(new Error('Unexpected error'));

      const result = await safeGraphQLQuery(mockQueryFn);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Unexpected error');
    });
  });

  describe('batchQueries', () => {
    it('should handle empty queries array', async () => {
      const result = await batchQueries([]);
      expect(result).toEqual({});
    });

    it('should batch multiple queries successfully', async () => {
      const mockResponse = {
        data: {
          Operation_product1_0: { product: mockProducts[0] },
          Operation_product2_1: { product: mockProducts[1] },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const queries = [
        {
          query: 'query { product(id: $id) { id name } }',
          variables: { id: 'prod-1' },
          key: 'product1',
        },
        {
          query: 'query { product(id: $id) { id name } }',
          variables: { id: 'prod-2' },
          key: 'product2',
        },
      ];

      const result = await batchQueries(queries);

      expect(result).toEqual({
        product1: {
          data: { product: mockProducts[0] },
          errors: undefined,
        },
        product2: {
          data: { product: mockProducts[1] },
          errors: undefined,
        },
      });
    });

    it('should handle batch query errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const queries = [
        {
          query: 'query { product(id: $id) { id } }',
          variables: { id: 'prod-1' },
          key: 'product1',
        },
      ];

      const result = await batchQueries(queries);

      expect(result.product1.data).toBeUndefined();
      expect(result.product1.errors).toBeDefined();
      expect(result.product1.errors![0].message).toContain('Network error');
    });
  });

  describe('Network error scenarios', () => {
    it('should handle fetch timeout', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('NetworkError'));

      await expect(fetchProduct('prod-1')).rejects.toThrow('Network request failed');
    });

    it('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      await expect(fetchProduct('prod-1')).rejects.toThrow('Unexpected error');
    });

    it('should handle malformed GraphQL response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve('invalid response'),
      } as Response);

      await expect(fetchProduct('prod-1')).rejects.toThrow('Invalid JSON response');
    });
  });
});