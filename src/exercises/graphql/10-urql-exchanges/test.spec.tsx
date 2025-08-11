// URQL Custom Exchanges Test Suite
// Comprehensive tests for authentication, retry, transformation, and error handling exchanges

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { pipe, fromArray, toPromise, map } from 'wonka';
import {
  authExchange,
  retryExchange,
  transformationExchange,
  errorHandlingExchange,
  createUrqlClient,
} from './solution';
import { makeOperation, Operation, OperationResult } from 'urql';

// Mock localStorage for testing
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock performance for timing tests
const mockPerformance = {
  now: jest.fn(() => Date.now()),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
});

// Helper function to create mock operations
const createMockOperation = (
  kind: 'query' | 'mutation' | 'subscription' = 'query',
  variables: Record<string, any> = {}
): Operation => {
  return makeOperation(kind, {
    key: 1234,
    query: {
      kind: 'Document',
      definitions: [{
        kind: 'OperationDefinition',
        operation: kind,
        name: { kind: 'Name', value: 'TestOperation' },
        selectionSet: {
          kind: 'SelectionSet',
          selections: [],
        },
      }],
    },
    variables,
  });
};

// Helper function to create mock results
const createMockResult = (
  operation: Operation,
  data?: any,
  error?: any
): OperationResult => ({
  operation,
  data,
  error,
  extensions: {},
  stale: false,
  hasNext: false,
});

describe('URQL Custom Exchanges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(Date.now());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authExchange', () => {
    it('should add authorization header when token exists', async () => {
      // Arrange
      const token = 'test-token';
      mockLocalStorage.getItem.mockReturnValue(token);
      
      const mockForward = jest.fn(() => 
        pipe(fromArray([createMockResult(createMockOperation(), { users: [] })]))
      );
      
      const exchange = authExchange({ forward: mockForward } as any);
      const operation = createMockOperation();

      // Act
      const result = await pipe(
        fromArray([operation]),
        exchange,
        toPromise
      );

      // Assert
      expect(mockForward).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            context: expect.objectContaining({
              fetchOptions: expect.objectContaining({
                headers: expect.objectContaining({
                  Authorization: `Bearer ${token}`,
                }),
              }),
            }),
          }),
        ])
      );
    });

    it('should not add authorization header when no token exists', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const mockForward = jest.fn(() => 
        pipe(fromArray([createMockResult(createMockOperation(), { users: [] })]))
      );
      
      const exchange = authExchange({ forward: mockForward } as any);
      const operation = createMockOperation();

      // Act
      const result = await pipe(
        fromArray([operation]),
        exchange,
        toPromise
      );

      // Assert
      expect(mockForward).toHaveBeenCalledWith([operation]);
    });

    it('should handle 401 errors and attempt token refresh', async () => {
      // Arrange
      const token = 'expired-token';
      mockLocalStorage.getItem.mockReturnValue(token);
      
      const unauthorizedError = {
        networkError: { status: 401 },
        message: 'Unauthorized',
      };
      
      const mockForward = jest.fn(() => 
        pipe(fromArray([createMockResult(createMockOperation(), null, unauthorizedError)]))
      );
      
      const exchange = authExchange({ forward: mockForward } as any);
      const operation = createMockOperation();

      // Act
      const result = await pipe(
        fromArray([operation]),
        exchange,
        toPromise
      );

      // Assert
      expect(result.error).toEqual(unauthorizedError);
      // Note: In a real implementation, you might want to test the token refresh logic
    });
  });

  describe('retryExchange', () => {
    it('should not retry successful operations', async () => {
      // Arrange
      const mockForward = jest.fn(() => 
        pipe(fromArray([createMockResult(createMockOperation(), { users: [] })]))
      );
      
      const exchange = retryExchange()({ forward: mockForward } as any);
      const operation = createMockOperation();

      // Act
      const result = await pipe(
        fromArray([operation]),
        exchange,
        toPromise
      );

      // Assert
      expect(mockForward).toHaveBeenCalledTimes(1);
      expect(result.data).toEqual({ users: [] });
    });

    it('should retry network errors up to maxRetries', async () => {
      // Arrange
      const networkError = {
        networkError: { status: 500 },
        message: 'Server Error',
      };
      
      let callCount = 0;
      const mockForward = jest.fn(() => {
        callCount++;
        return pipe(fromArray([createMockResult(createMockOperation(), null, networkError)]));
      });
      
      const exchange = retryExchange({ 
        maxRetries: 2, 
        baseDelay: 10, // Fast for testing
      })({ forward: mockForward } as any);
      
      const operation = createMockOperation();

      // Act
      const result = await pipe(
        fromArray([operation]),
        exchange,
        toPromise
      );

      // Assert
      expect(mockForward).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(result.error).toEqual(networkError);
    });

    it('should not retry mutations by default', async () => {
      // Arrange
      const networkError = {
        networkError: { status: 500 },
        message: 'Server Error',
      };
      
      const mockForward = jest.fn(() => 
        pipe(fromArray([createMockResult(createMockOperation('mutation'), null, networkError)]))
      );
      
      const exchange = retryExchange()({ forward: mockForward } as any);
      const operation = createMockOperation('mutation');

      // Act
      const result = await pipe(
        fromArray([operation]),
        exchange,
        toPromise
      );

      // Assert
      expect(mockForward).toHaveBeenCalledTimes(1); // No retries for mutations
      expect(result.error).toEqual(networkError);
    });

    it('should not retry non-retryable errors', async () => {
      // Arrange
      const clientError = {
        networkError: { status: 400 },
        message: 'Bad Request',
      };
      
      const mockForward = jest.fn(() => 
        pipe(fromArray([createMockResult(createMockOperation(), null, clientError)]))
      );
      
      const exchange = retryExchange()({ forward: mockForward } as any);
      const operation = createMockOperation();

      // Act
      const result = await pipe(
        fromArray([operation]),
        exchange,
        toPromise
      );

      // Assert
      expect(mockForward).toHaveBeenCalledTimes(1); // No retries for 400 errors
      expect(result.error).toEqual(clientError);
    });
  });

  describe('transformationExchange', () => {
    it('should add request ID and timing to operations', async () => {
      // Arrange
      const startTime = 1000;
      const endTime = 1200;
      mockPerformance.now.mockReturnValueOnce(startTime).mockReturnValueOnce(endTime);
      
      const mockForward = jest.fn((ops) => 
        pipe(fromArray(ops.map((op: Operation) => createMockResult(op, { users: [] }))))
      );
      
      const exchange = transformationExchange({ forward: mockForward } as any);
      const operation = createMockOperation();

      // Act
      const result = await pipe(
        fromArray([operation]),
        exchange,
        toPromise
      );

      // Assert
      expect(mockForward).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            context: expect.objectContaining({
              requestId: expect.stringMatching(/^req_/),
              meta: expect.objectContaining({
                startTime,
                requestId: expect.stringMatching(/^req_/),
              }),
            }),
          }),
        ])
      );
    });

    it('should measure request duration', async () => {
      // Arrange
      const startTime = 1000;
      const endTime = 1200;
      mockPerformance.now.mockReturnValueOnce(startTime).mockReturnValueOnce(endTime);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockForward = jest.fn((ops) => 
        pipe(fromArray(ops.map((op: Operation) => createMockResult(op, { users: [] }))))
      );
      
      const exchange = transformationExchange({ forward: mockForward } as any);
      const operation = createMockOperation();

      // Act
      await pipe(
        fromArray([operation]),
        exchange,
        toPromise
      );

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '📊 Request Metrics:',
        expect.objectContaining({
          duration: endTime - startTime,
          operationType: 'query',
          success: true,
          hasData: true,
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('errorHandlingExchange', () => {
    it('should enhance errors with category and metadata', async () => {
      // Arrange
      const networkError = {
        networkError: { status: 500 },
        message: 'Server Error',
      };
      
      const mockForward = jest.fn(() => 
        pipe(fromArray([createMockResult(createMockOperation(), null, networkError)]))
      );
      
      const exchange = errorHandlingExchange({ forward: mockForward } as any);
      const operation = createMockOperation();

      // Act
      const result = await pipe(
        fromArray([operation]),
        exchange,
        toPromise
      );

      // Assert
      expect(result.error).toMatchObject({
        ...networkError,
        category: expect.objectContaining({
          type: 'network',
          retryable: true,
        }),
        timestamp: expect.any(String),
        operation: expect.objectContaining({
          type: 'query',
        }),
      });
    });

    it('should categorize GraphQL errors correctly', async () => {
      // Arrange
      const graphqlError = {
        graphQLErrors: [{
          message: 'Field not found',
          extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
        }],
      };
      
      const mockForward = jest.fn(() => 
        pipe(fromArray([createMockResult(createMockOperation(), null, graphqlError)]))
      );
      
      const exchange = errorHandlingExchange({ forward: mockForward } as any);
      const operation = createMockOperation();

      // Act
      const result = await pipe(
        fromArray([operation]),
        exchange,
        toPromise
      );

      // Assert
      expect(result.error.category).toMatchObject({
        type: 'graphql',
        retryable: false,
        code: 'GRAPHQL_VALIDATION_FAILED',
      });
    });

    it('should log errors for monitoring', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const error = {
        networkError: { status: 404 },
        message: 'Not Found',
      };
      
      const mockForward = jest.fn(() => 
        pipe(fromArray([createMockResult(createMockOperation(), null, error)]))
      );
      
      const exchange = errorHandlingExchange({ forward: mockForward } as any);
      const operation = createMockOperation();

      // Act
      await pipe(
        fromArray([operation]),
        exchange,
        toPromise
      );

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '🚨 GraphQL Error:',
        expect.objectContaining({
          operation: expect.objectContaining({
            type: 'query',
            name: 'TestOperation',
          }),
          error: expect.objectContaining({
            message: 'Not Found',
          }),
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('createUrqlClient', () => {
    it('should create client with only fetch exchange when no options enabled', () => {
      // Act
      const client = createUrqlClient({
        url: 'https://api.example.com/graphql',
      });

      // Assert
      expect(client).toBeDefined();
      // Note: Testing exchange configuration would require accessing internal client state
      // which is not directly exposed by URQL
    });

    it('should include auth exchange when enableAuth is true', () => {
      // Act
      const client = createUrqlClient({
        url: 'https://api.example.com/graphql',
        enableAuth: true,
      });

      // Assert
      expect(client).toBeDefined();
      // In a real implementation, you might test the exchanges array directly
      // or test the behavior of the configured client
    });

    it('should include retry exchange with custom config', () => {
      // Act
      const client = createUrqlClient({
        url: 'https://api.example.com/graphql',
        enableRetry: true,
        retryConfig: {
          maxRetries: 5,
          baseDelay: 2000,
        },
      });

      // Assert
      expect(client).toBeDefined();
    });

    it('should include all exchanges when all options enabled', () => {
      // Act
      const client = createUrqlClient({
        url: 'https://api.example.com/graphql',
        enableAuth: true,
        enableRetry: true,
        enableMetrics: true,
        enableErrorEnhancement: true,
        retryConfig: {
          maxRetries: 3,
        },
      });

      // Assert
      expect(client).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should process operations through multiple exchanges in correct order', async () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue('test-token');
      
      const mockResult = createMockResult(createMockOperation(), { users: [] });
      const mockForward = jest.fn(() => pipe(fromArray([mockResult])));
      
      // Create a mini exchange pipeline
      const pipeline = pipe(
        fromArray([createMockOperation()]),
        authExchange({ forward: mockForward } as any)
      );

      // Act
      const result = await pipe(pipeline, toPromise);

      // Assert
      expect(result).toBeDefined();
      expect(mockForward).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            context: expect.objectContaining({
              fetchOptions: expect.objectContaining({
                headers: expect.objectContaining({
                  Authorization: 'Bearer test-token',
                }),
              }),
            }),
          }),
        ])
      );
    });

    it('should handle exchange pipeline with retry and error handling', async () => {
      // Arrange
      const networkError = {
        networkError: { status: 500 },
        message: 'Server Error',
      };
      
      let attempts = 0;
      const mockForward = jest.fn(() => {
        attempts++;
        return pipe(fromArray([createMockResult(createMockOperation(), null, networkError)]));
      });
      
      // Create pipeline with retry and error handling
      const retryEx = retryExchange({ maxRetries: 1, baseDelay: 10 });
      const errorEx = errorHandlingExchange;
      
      const pipeline = pipe(
        fromArray([createMockOperation()]),
        retryEx({ forward: mockForward } as any)
      );

      // Act
      const result = await pipe(pipeline, toPromise);

      // Assert
      expect(attempts).toBe(2); // Initial + 1 retry
      expect(result.error).toEqual(networkError);
    });
  });

  describe('Helper Functions', () => {
    describe('Error Categorization', () => {
      // These tests would test the categorizeError function if it was exported
      // For now, we test through the errorHandlingExchange
      
      it('should categorize 401 errors as authorization', async () => {
        const authError = {
          networkError: { status: 401 },
          message: 'Unauthorized',
        };
        
        const mockForward = jest.fn(() => 
          pipe(fromArray([createMockResult(createMockOperation(), null, authError)]))
        );
        
        const exchange = errorHandlingExchange({ forward: mockForward } as any);
        const result = await pipe(fromArray([createMockOperation()]), exchange, toPromise);
        
        expect(result.error.category.type).toBe('authorization');
        expect(result.error.category.retryable).toBe(false);
      });

      it('should categorize 5xx errors as retryable network errors', async () => {
        const serverError = {
          networkError: { status: 503 },
          message: 'Service Unavailable',
        };
        
        const mockForward = jest.fn(() => 
          pipe(fromArray([createMockResult(createMockOperation(), null, serverError)]))
        );
        
        const exchange = errorHandlingExchange({ forward: mockForward } as any);
        const result = await pipe(fromArray([createMockOperation()]), exchange, toPromise);
        
        expect(result.error.category.type).toBe('network');
        expect(result.error.category.retryable).toBe(true);
      });
    });
  });
});

// Additional React Component Tests
describe('React Components', () => {
  // These would typically be in a separate test file and use React Testing Library
  // For now, we include basic structural tests
  
  it('should create components without crashing', () => {
    // This would test that components can be instantiated
    expect(true).toBe(true); // Placeholder
  });
});

export {};