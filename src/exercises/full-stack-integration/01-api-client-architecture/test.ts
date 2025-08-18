import { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: ApiClientConfig interface exists
  results.push({
    name: 'ApiClientConfig Interface Definition',
    passed: compiledCode.includes('interface ApiClientConfig') && 
            compiledCode.includes('baseURL') && 
            compiledCode.includes('timeout') &&
            compiledCode.includes('retryAttempts') &&
            compiledCode.includes('authTokenHeader'),
    message: compiledCode.includes('interface ApiClientConfig') ? 
      'ApiClientConfig interface properly defined with all required properties' : 
      'ApiClientConfig interface is missing or incomplete. Should include baseURL, timeout, retryAttempts, and authTokenHeader properties'
  });

  // Test 2: EndpointDefinition interface exists
  results.push({
    name: 'EndpointDefinition Interface Type Safety',
    passed: compiledCode.includes('interface EndpointDefinition<TRequest, TResponse>') &&
            compiledCode.includes('method:') &&
            compiledCode.includes('path:') &&
            compiledCode.includes('responseSchema:') &&
            compiledCode.includes('requestSchema?:'),
    message: compiledCode.includes('interface EndpointDefinition<TRequest, TResponse>') ? 
      'EndpointDefinition interface properly defined with generic types and required properties' : 
      'EndpointDefinition interface is missing or incomplete. Should be generic with TRequest and TResponse types'
  });

  // Test 3: Custom error classes exist
  results.push({
    name: 'Custom Error Classes Hierarchy',
    passed: compiledCode.includes('class ApiError extends Error') &&
            compiledCode.includes('class AuthenticationError extends ApiError') &&
            compiledCode.includes('class ValidationError extends ApiError') &&
            compiledCode.includes('class NetworkError extends ApiError') &&
            compiledCode.includes('class ServerError extends ApiError'),
    message: compiledCode.includes('class ApiError extends Error') ? 
      'Complete error class hierarchy implemented with proper inheritance' : 
      'Error classes are missing or incomplete. Need ApiError base class and specific error types'
  });

  // Test 4: AuthService interface exists
  results.push({
    name: 'AuthService Interface Definition',
    passed: compiledCode.includes('interface AuthService') &&
            compiledCode.includes('getToken()') &&
            compiledCode.includes('refreshToken()') &&
            compiledCode.includes('logout()') &&
            compiledCode.includes('isTokenExpired'),
    message: compiledCode.includes('interface AuthService') ? 
      'AuthService interface properly defined with all authentication methods' : 
      'AuthService interface is missing or incomplete. Should include getToken, refreshToken, logout, and isTokenExpired methods'
  });

  // Test 5: RequestDeduplicator class exists
  results.push({
    name: 'RequestDeduplicator Implementation',
    passed: compiledCode.includes('class RequestDeduplicator') &&
            compiledCode.includes('getKey') &&
            compiledCode.includes('deduplicate') &&
            compiledCode.includes('cleanup'),
    message: compiledCode.includes('class RequestDeduplicator') ? 
      'RequestDeduplicator class implemented with key methods for request deduplication' : 
      'RequestDeduplicator class is missing or incomplete. Should include getKey, deduplicate, and cleanup methods'
  });

  // Test 6: BaseApiClient class exists
  results.push({
    name: 'BaseApiClient Core Implementation',
    passed: compiledCode.includes('class BaseApiClient') &&
            compiledCode.includes('constructor') &&
            compiledCode.includes('setupRequestInterceptors') &&
            compiledCode.includes('setupResponseInterceptors') &&
            compiledCode.includes('request'),
    message: compiledCode.includes('class BaseApiClient') ? 
      'BaseApiClient class implemented with core methods and proper structure' : 
      'BaseApiClient class is missing or incomplete. Should include constructor, interceptor setup, and request method'
  });

  // Test 7: Axios interceptors setup
  results.push({
    name: 'Axios Interceptors Configuration',
    passed: compiledCode.includes('interceptors.request.use') &&
            compiledCode.includes('interceptors.response.use') &&
            compiledCode.includes('authTokenHeader') &&
            compiledCode.includes('Bearer'),
    message: compiledCode.includes('interceptors.request.use') ? 
      'Axios interceptors properly configured for request/response handling and authentication' : 
      'Axios interceptors are missing or incomplete. Should handle authentication headers and error responses'
  });

  // Test 8: Error handling implementation
  results.push({
    name: 'Comprehensive Error Handling',
    passed: compiledCode.includes('handleError') &&
            compiledCode.includes('response.status') &&
            (compiledCode.includes('401') || compiledCode.includes('AuthenticationError')) &&
            (compiledCode.includes('400') || compiledCode.includes('ValidationError')),
    message: compiledCode.includes('handleError') ? 
      'Error handling implemented with proper status code categorization' : 
      'Error handling is missing or incomplete. Should categorize errors by HTTP status codes'
  });

  // Test 9: Retry logic implementation
  results.push({
    name: 'Retry Logic with Exponential Backoff',
    passed: compiledCode.includes('retryRequest') &&
            (compiledCode.includes('Math.pow') || compiledCode.includes('exponential')) &&
            compiledCode.includes('setTimeout'),
    message: compiledCode.includes('retryRequest') ? 
      'Retry logic implemented with exponential backoff strategy' : 
      'Retry logic is missing or incomplete. Should include exponential backoff and configurable attempts'
  });

  // Test 10: MockAuthService implementation
  results.push({
    name: 'MockAuthService Implementation',
    passed: compiledCode.includes('class MockAuthService') &&
            compiledCode.includes('implements AuthService') &&
            compiledCode.includes('getToken()') &&
            compiledCode.includes('refreshToken()'),
    message: compiledCode.includes('class MockAuthService') ? 
      'MockAuthService properly implements AuthService interface for testing' : 
      'MockAuthService is missing or incomplete. Should implement all AuthService methods'
  });

  // Test 11: Request method with proper typing
  results.push({
    name: 'Type-Safe Request Method',
    passed: compiledCode.includes('request<TRequest, TResponse>') &&
            compiledCode.includes('EndpointDefinition<TRequest, TResponse>') &&
            compiledCode.includes('pathParams') &&
            (compiledCode.includes('responseSchema.parse') || compiledCode.includes('.parse(')),
    message: compiledCode.includes('request<TRequest, TResponse>') ? 
      'Request method properly typed with generic parameters and validation' : 
      'Request method is missing proper typing or validation. Should use generics and parse responses'
  });

  // Test 12: Component integration test
  const componentResult = createComponentTest(
    'ApiClientDemo',
    compiledCode,
    {
      requiredElements: ['button', 'div'],
      customValidation: (code) => code.includes('API Client') || code.includes('demo'),
      errorMessage: 'ApiClientDemo component should render API client demonstration interface'
    }
  );
  results.push(componentResult);

  return results;
}