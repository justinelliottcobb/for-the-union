# API Client Architecture

## Overview

In this exercise, you'll design and implement a production-ready API client architecture using TypeScript, Axios, and Zod. This exercise focuses on patterns that Staff Frontend Engineers use to build scalable, maintainable API layers in large applications.

**Difficulty:** ⭐⭐⭐ (60 minutes)

## Learning Objectives

By completing this exercise, you will:

- Design scalable API client architecture with TypeScript
- Implement Axios interceptors for request/response transformation
- Handle authentication flows and token management
- Create robust error handling and retry mechanisms
- Build request deduplication and caching strategies
- Integrate runtime validation with Zod schemas

## Background

Modern web applications require sophisticated API client architectures that can handle:
- Authentication and token refresh flows
- Request/response transformation and validation
- Error handling and retry logic
- Request deduplication and caching
- Type safety and runtime validation

This exercise demonstrates enterprise-grade patterns used in production applications with millions of users.

## Requirements

### Core Components

1. **ApiClient Class**
   - Base client with Axios configuration
   - Request/response interceptors
   - Error handling and retry logic
   - Authentication token management

2. **TypedEndpoints Interface**
   - Strongly typed API endpoint definitions
   - Request/response type safety
   - Runtime validation integration

3. **ErrorBoundaryHandler**
   - Comprehensive error categorization
   - Custom error types for different scenarios
   - Error recovery strategies

### Key Features

1. **Authentication Flow**
   - Automatic token injection
   - Token refresh on expiration
   - Logout on authentication failure

2. **Request Deduplication**
   - Prevent duplicate concurrent requests
   - Cache in-flight requests
   - Return shared promises

3. **Retry Logic**
   - Exponential backoff strategy
   - Configurable retry attempts
   - Smart retry for specific error types

4. **Runtime Validation**
   - Zod schema validation
   - Type-safe response parsing
   - Graceful handling of malformed data

## Implementation Tasks

### Task 1: Base ApiClient Architecture

Create a `BaseApiClient` class that:

```typescript
interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  authTokenHeader: string;
}

class BaseApiClient {
  // Configure Axios instance with interceptors
  // Implement token management
  // Set up error handling
}
```

### Task 2: Request/Response Interceptors

Implement interceptors for:

```typescript
// Request interceptor for:
// - Adding authentication headers
// - Request logging
// - Request transformation

// Response interceptor for:
// - Response validation
// - Error handling
// - Token refresh logic
```

### Task 3: Typed Endpoints System

Create a type-safe endpoint system:

```typescript
interface EndpointDefinition<TRequest, TResponse> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  requestSchema?: z.ZodSchema<TRequest>;
  responseSchema: z.ZodSchema<TResponse>;
  requiresAuth?: boolean;
  cacheKey?: string;
}

// Usage example:
const getUserEndpoint: EndpointDefinition<void, User> = {
  method: 'GET',
  path: '/users/{id}',
  responseSchema: UserSchema,
  requiresAuth: true,
  cacheKey: 'user-{id}'
};
```

### Task 4: Error Handling System

Implement comprehensive error handling:

```typescript
// Custom error types
class ApiError extends Error { }
class AuthenticationError extends ApiError { }
class ValidationError extends ApiError { }
class NetworkError extends ApiError { }
class ServerError extends ApiError { }

// Error recovery strategies
interface ErrorRecoveryStrategy {
  canRecover(error: ApiError): boolean;
  recover(error: ApiError): Promise<any>;
}
```

### Task 5: Request Deduplication

Implement request deduplication to prevent duplicate requests:

```typescript
class RequestDeduplicator {
  // Track in-flight requests
  // Return cached promises for duplicate requests
  // Clean up completed requests
}
```

### Task 6: Authentication Flow

Implement complete authentication handling:

```typescript
interface AuthService {
  getToken(): string | null;
  refreshToken(): Promise<string>;
  logout(): void;
  isTokenExpired(token: string): boolean;
}

// Integration with API client
// - Automatic token injection
// - Token refresh on 401 responses
// - Logout on refresh failure
```

## Example Usage

Your implementation should support this usage pattern:

```typescript
// Initialize API client
const apiClient = new ApiClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retryAttempts: 3,
  authTokenHeader: 'Authorization'
});

// Define typed endpoints
const endpoints = {
  getUser: {
    method: 'GET' as const,
    path: '/users/{id}',
    responseSchema: UserSchema,
    requiresAuth: true
  },
  createPost: {
    method: 'POST' as const,
    path: '/posts',
    requestSchema: CreatePostSchema,
    responseSchema: PostSchema,
    requiresAuth: true
  }
};

// Make type-safe requests
const user = await apiClient.request(endpoints.getUser, { id: '123' });
const post = await apiClient.request(endpoints.createPost, {
  title: 'Hello World',
  content: 'This is my first post'
});
```

## Testing Requirements

Your implementation should be thoroughly tested:

1. **Unit Tests**
   - API client configuration
   - Interceptor functionality
   - Error handling scenarios
   - Request deduplication

2. **Integration Tests**
   - Authentication flows
   - Retry logic with mock failures
   - Response validation
   - Type safety verification

3. **Error Scenarios**
   - Network failures
   - Invalid responses
   - Authentication errors
   - Server errors

## Advanced Challenges

For additional practice, consider implementing:

1. **Request Queue Management**
   - Priority-based request ordering
   - Concurrent request limiting
   - Background request processing

2. **Advanced Caching**
   - TTL-based cache invalidation
   - Cache warming strategies
   - Selective cache invalidation

3. **Metrics and Monitoring**
   - Request timing and success rates
   - Error rate monitoring
   - Performance analytics

## Success Criteria

Your implementation should:

- ✅ Provide complete type safety for all API operations
- ✅ Handle authentication flows automatically
- ✅ Implement robust error handling and recovery
- ✅ Prevent duplicate requests efficiently
- ✅ Validate responses at runtime
- ✅ Support configurable retry logic
- ✅ Maintain clean, testable architecture
- ✅ Follow enterprise-grade patterns

## Tips

- Start with the base ApiClient class and build incrementally
- Use Axios interceptors effectively for cross-cutting concerns
- Leverage TypeScript's type system for compile-time safety
- Implement proper error boundaries and recovery strategies
- Consider the trade-offs between caching and data freshness
- Test error scenarios thoroughly to ensure robustness

This exercise represents patterns used in production applications serving millions of users. Focus on building a foundation that can scale and evolve with complex application requirements.