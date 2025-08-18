import { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: JWT interfaces and types
  results.push({
    name: 'JWT and Auth Type Definitions',
    passed: compiledCode.includes('interface JWTPayload') && 
            compiledCode.includes('interface AuthTokens') && 
            compiledCode.includes('interface User') &&
            compiledCode.includes('interface LoginCredentials') &&
            compiledCode.includes('interface PKCEData') &&
            compiledCode.includes('interface AuthState'),
    message: compiledCode.includes('interface JWTPayload') ? 
      'Authentication type definitions properly defined with JWT, tokens, and user interfaces' : 
      'Authentication type definitions are missing or incomplete. Should include JWTPayload, AuthTokens, User, LoginCredentials, PKCEData, and AuthState'
  });

  // Test 2: TokenManager class exists
  results.push({
    name: 'TokenManager Implementation',
    passed: compiledCode.includes('class TokenManager') &&
            compiledCode.includes('saveTokens') &&
            compiledCode.includes('getTokens') &&
            compiledCode.includes('clearTokens') &&
            compiledCode.includes('validateToken') &&
            compiledCode.includes('isTokenExpired') &&
            compiledCode.includes('scheduleTokenRefresh'),
    message: compiledCode.includes('class TokenManager') ? 
      'TokenManager class implemented with all required token management methods' : 
      'TokenManager class is missing or incomplete. Should include token storage, validation, expiration checking, and refresh scheduling'
  });

  // Test 3: PKCEHelper class exists
  results.push({
    name: 'PKCEHelper Security Implementation',
    passed: compiledCode.includes('class PKCEHelper') &&
            compiledCode.includes('generateCodeVerifier') &&
            compiledCode.includes('generateCodeChallenge') &&
            compiledCode.includes('generateState') &&
            compiledCode.includes('buildAuthorizationURL'),
    message: compiledCode.includes('class PKCEHelper') ? 
      'PKCEHelper class implemented with PKCE flow security methods' : 
      'PKCEHelper class is missing or incomplete. Should include code verifier, challenge, state generation, and URL building'
  });

  // Test 4: AuthService class exists
  results.push({
    name: 'AuthService API Integration',
    passed: compiledCode.includes('class AuthService') &&
            compiledCode.includes('login') &&
            compiledCode.includes('initiateOAuthFlow') &&
            compiledCode.includes('handleOAuthCallback') &&
            compiledCode.includes('refreshTokens') &&
            compiledCode.includes('logout') &&
            compiledCode.includes('getUserProfile'),
    message: compiledCode.includes('class AuthService') ? 
      'AuthService class implemented with all authentication API methods' : 
      'AuthService class is missing or incomplete. Should include login, OAuth flows, token refresh, logout, and profile methods'
  });

  // Test 5: AuthProvider component exists
  results.push({
    name: 'AuthProvider Context Implementation',
    passed: compiledCode.includes('AuthProvider:') &&
            compiledCode.includes('AuthContext') &&
            compiledCode.includes('useState') &&
            compiledCode.includes('useEffect') &&
            compiledCode.includes('useCallback'),
    message: compiledCode.includes('AuthProvider:') ? 
      'AuthProvider component implemented with React Context and state management' : 
      'AuthProvider component is missing or incomplete. Should use Context, useState, useEffect, and useCallback'
  });

  // Test 6: useAuth hook exists
  results.push({
    name: 'useAuth Custom Hook',
    passed: compiledCode.includes('function useAuth') &&
            compiledCode.includes('useContext') &&
            compiledCode.includes('AuthContext') &&
            (compiledCode.includes('throw new Error') || compiledCode.includes('throw')),
    message: compiledCode.includes('function useAuth') ? 
      'useAuth hook implemented with context access and error handling' : 
      'useAuth hook is missing or incomplete. Should use useContext and throw error if used outside provider'
  });

  // Test 7: ProtectedRoute component exists
  results.push({
    name: 'ProtectedRoute Access Control',
    passed: compiledCode.includes('ProtectedRoute:') &&
            compiledCode.includes('useAuth') &&
            compiledCode.includes('useNavigate') &&
            compiledCode.includes('useLocation') &&
            compiledCode.includes('requiredPermissions') &&
            compiledCode.includes('requiredRole'),
    message: compiledCode.includes('ProtectedRoute:') ? 
      'ProtectedRoute component implemented with navigation and permission checking' : 
      'ProtectedRoute component is missing or incomplete. Should handle authentication, permissions, and navigation'
  });

  // Test 8: LoginForm component exists
  results.push({
    name: 'LoginForm UI Implementation',
    passed: compiledCode.includes('LoginForm:') &&
            compiledCode.includes('useState') &&
            compiledCode.includes('credentials') &&
            compiledCode.includes('handleSubmit') &&
            compiledCode.includes('handleOAuthLogin') &&
            compiledCode.includes('oauthProviders'),
    message: compiledCode.includes('LoginForm:') ? 
      'LoginForm component implemented with credentials and OAuth support' : 
      'LoginForm component is missing or incomplete. Should handle form submission and OAuth providers'
  });

  // Test 9: OAuthCallback component exists
  results.push({
    name: 'OAuthCallback Handler Implementation',
    passed: compiledCode.includes('OAuthCallback:') &&
            compiledCode.includes('handleOAuthCallback') &&
            compiledCode.includes('useLocation') &&
            compiledCode.includes('useNavigate') &&
            compiledCode.includes('URLSearchParams' || compiledCode.includes('location.search')),
    message: compiledCode.includes('OAuthCallback:') ? 
      'OAuthCallback component implemented with URL parameter handling and navigation' : 
      'OAuthCallback component is missing or incomplete. Should extract URL parameters and handle OAuth callback'
  });

  // Test 10: UserProfile component exists
  results.push({
    name: 'UserProfile Display Component',
    passed: compiledCode.includes('UserProfile:') &&
            compiledCode.includes('useAuth') &&
            compiledCode.includes('logout') &&
            compiledCode.includes('authState.user'),
    message: compiledCode.includes('UserProfile:') ? 
      'UserProfile component implemented with user data display and logout functionality' : 
      'UserProfile component is missing or incomplete. Should display user information and provide logout'
  });

  // Test 11: JWT validation and parsing
  results.push({
    name: 'JWT Validation Integration',
    passed: (compiledCode.includes('jose') || compiledCode.includes('jwt')) &&
            compiledCode.includes('validateToken') &&
            (compiledCode.includes('parse') || compiledCode.includes('verify')) &&
            compiledCode.includes('exp'),
    message: (compiledCode.includes('jose') || compiledCode.includes('jwt')) ? 
      'JWT validation properly integrated with token parsing and expiration checking' : 
      'JWT validation is missing or incomplete. Should use jose library for token validation and parsing'
  });

  // Test 12: PKCE flow implementation
  results.push({
    name: 'PKCE Flow Security',
    passed: compiledCode.includes('codeVerifier') &&
            compiledCode.includes('codeChallenge') &&
            compiledCode.includes('state') &&
            (compiledCode.includes('SHA256') || compiledCode.includes('crypto')) &&
            compiledCode.includes('base64'),
    message: compiledCode.includes('codeVerifier') ? 
      'PKCE flow implemented with code verifier, challenge, and state parameters' : 
      'PKCE flow is missing or incomplete. Should include code verifier generation, challenge creation, and state management'
  });

  // Test 13: Token refresh mechanism
  results.push({
    name: 'Automatic Token Refresh',
    passed: compiledCode.includes('refreshTokens') &&
            compiledCode.includes('scheduleTokenRefresh') &&
            (compiledCode.includes('setTimeout') || compiledCode.includes('setInterval')) &&
            compiledCode.includes('expiresAt'),
    message: compiledCode.includes('refreshTokens') ? 
      'Token refresh mechanism implemented with automatic scheduling and timing' : 
      'Token refresh is missing or incomplete. Should include automatic refresh scheduling and expiration handling'
  });

  // Test 14: Secure storage handling
  results.push({
    name: 'Secure Token Storage',
    passed: compiledCode.includes('saveTokens') &&
            compiledCode.includes('clearTokens') &&
            (compiledCode.includes('localStorage') || compiledCode.includes('sessionStorage') || compiledCode.includes('cookie')) &&
            (compiledCode.includes('secure') || compiledCode.includes('httpOnly')),
    message: compiledCode.includes('saveTokens') ? 
      'Secure token storage implemented with proper storage mechanisms and security considerations' : 
      'Secure token storage is missing or incomplete. Should handle secure storage and cleanup of authentication tokens'
  });

  // Test 15: Component integration test
  const componentResult = createComponentTest(
    'AuthenticationFlowsDemo',
    compiledCode,
    {
      requiredElements: ['button', 'div', 'AuthProvider'],
      customValidation: (code) => code.includes('Authentication') || code.includes('login') || code.includes('auth'),
      errorMessage: 'AuthenticationFlowsDemo component should render authentication demonstration interface'
    }
  );
  results.push(componentResult);

  return results;
}