import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as jose from 'jose';

// JWT Token Interfaces
interface JWTPayload extends jose.JWTPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  exp: number;
  iat: number;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface PKCEData {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// TODO: Define AuthContextType interface
interface AuthContextType {
  // Add properties:
  // - authState: AuthState
  // - login: (credentials: LoginCredentials) => Promise<void>
  // - logout: () => Promise<void>
  // - refreshTokens: () => Promise<void>
  // - initiateOAuthFlow: (provider: string) => Promise<void>
  // - handleOAuthCallback: (code: string, state: string) => Promise<void>
}

// TODO: Implement TokenManager class
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'auth_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'auth_token_expiry';

  // TODO: Implement secure token storage
  static saveTokens(tokens: AuthTokens): void {
    // Store tokens securely (consider httpOnly cookies in production)
    // Handle token expiration timestamps
    // Implement secure storage with encryption if needed
  }

  // TODO: Implement token retrieval
  static getTokens(): AuthTokens | null {
    // Retrieve stored tokens
    // Validate token expiration
    // Return null if tokens are invalid or expired
    return null;
  }

  // TODO: Implement token cleanup
  static clearTokens(): void {
    // Remove all stored tokens
    // Clear any related storage
    // Handle cleanup of secure storage
  }

  // TODO: Implement JWT validation
  static async validateToken(token: string): Promise<JWTPayload | null> {
    // Validate JWT signature and claims
    // Check token expiration
    // Parse and return payload if valid
    return null;
  }

  // TODO: Implement token refresh check
  static isTokenExpired(token: string): boolean {
    // Check if token is expired or near expiration
    // Consider refresh buffer time
    // Return true if token needs refresh
    return true;
  }

  // TODO: Implement automatic token refresh
  static async scheduleTokenRefresh(expiresAt: number, refreshCallback: () => Promise<void>): Promise<void> {
    // Schedule automatic token refresh before expiration
    // Handle refresh timing and retry logic
    // Cancel previous refresh timers if any
  }
}

// TODO: Implement PKCEHelper class
class PKCEHelper {
  // TODO: Generate PKCE code verifier
  static generateCodeVerifier(): string {
    // Generate cryptographically secure random string
    // Use URL-safe base64 encoding
    // Ensure proper length for security
    return '';
  }

  // TODO: Generate PKCE code challenge
  static async generateCodeChallenge(verifier: string): Promise<string> {
    // Create SHA256 hash of code verifier
    // Encode as URL-safe base64
    // Return code challenge for authorization request
    return '';
  }

  // TODO: Generate secure state parameter
  static generateState(): string {
    // Generate cryptographically secure random state
    // Use for CSRF protection
    // Store temporarily for validation
    return '';
  }

  // TODO: Build authorization URL
  static buildAuthorizationURL(params: {
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    state: string;
    scope?: string;
  }): string {
    // Construct OAuth authorization URL with PKCE parameters
    // Include required and optional parameters
    // Return complete authorization URL
    return '';
  }
}

// TODO: Implement AuthService class
class AuthService {
  private static readonly API_BASE = '/api/auth';
  
  // TODO: Implement login with credentials
  static async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    // Send login request to API
    // Handle authentication response
    // Validate response structure
    // Return user and tokens
    throw new Error('Login not implemented');
  }

  // TODO: Implement OAuth flow initiation
  static async initiateOAuthFlow(provider: string): Promise<PKCEData> {
    // Generate PKCE parameters
    // Store state and code verifier
    // Return PKCE data for redirect
    throw new Error('OAuth initiation not implemented');
  }

  // TODO: Implement OAuth callback handling
  static async handleOAuthCallback(code: string, state: string, codeVerifier: string): Promise<{ user: User; tokens: AuthTokens }> {
    // Validate state parameter for CSRF protection
    // Exchange authorization code for tokens
    // Include PKCE code verifier in request
    // Return user and tokens
    throw new Error('OAuth callback not implemented');
  }

  // TODO: Implement token refresh
  static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    // Send refresh token request
    // Handle refresh response
    // Validate new tokens
    // Return updated tokens
    throw new Error('Token refresh not implemented');
  }

  // TODO: Implement logout
  static async logout(refreshToken: string): Promise<void> {
    // Send logout request to invalidate tokens
    // Handle server-side session cleanup
    // Clear local storage
  }

  // TODO: Implement user profile fetch
  static async getUserProfile(accessToken: string): Promise<User> {
    // Fetch user profile with access token
    // Handle authorization headers
    // Validate and parse response
    throw new Error('User profile fetch not implemented');
  }
}

// TODO: Create AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// TODO: Implement AuthProvider component
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // TODO: Initialize authentication state
  useEffect(() => {
    // Check for existing tokens on mount
    // Validate stored tokens
    // Refresh if needed
    // Set initial authentication state
  }, []);

  // TODO: Implement login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    // Set loading state
    // Call AuthService.login
    // Store tokens securely
    // Update authentication state
    // Handle errors
  }, []);

  // TODO: Implement logout function
  const logout = useCallback(async () => {
    // Call AuthService.logout
    // Clear stored tokens
    // Reset authentication state
    // Handle cleanup
  }, []);

  // TODO: Implement token refresh
  const refreshTokens = useCallback(async () => {
    // Check for refresh token
    // Call AuthService.refreshTokens
    // Update stored tokens
    // Update authentication state
    // Handle refresh errors
  }, []);

  // TODO: Implement OAuth flow initiation
  const initiateOAuthFlow = useCallback(async (provider: string) => {
    // Generate PKCE parameters
    // Store verification data
    // Redirect to authorization server
  }, []);

  // TODO: Implement OAuth callback handling
  const handleOAuthCallback = useCallback(async (code: string, state: string) => {
    // Retrieve stored PKCE data
    // Validate state parameter
    // Exchange code for tokens
    // Update authentication state
  }, []);

  return (
    <AuthContext.Provider value={{
      authState,
      login,
      logout,
      refreshTokens,
      initiateOAuthFlow,
      handleOAuthCallback,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// TODO: Implement useAuth hook
export function useAuth(): AuthContextType {
  // Get context value
  // Throw error if used outside provider
  // Return auth context
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// TODO: Define ProtectedRouteProps interface
interface ProtectedRouteProps {
  // Add properties:
  // - children: React.ReactNode
  // - requiredPermissions?: string[]
  // - requiredRole?: string
  // - redirectTo?: string
  // - fallback?: React.ReactNode
}

// TODO: Implement ProtectedRoute component
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermissions = [], 
  requiredRole,
  redirectTo = '/login',
  fallback 
}) => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // TODO: Implement route protection logic
  useEffect(() => {
    // Check authentication status
    // Validate required permissions
    // Validate required role
    // Redirect if unauthorized
    // Store intended destination for post-login redirect
  }, [authState, requiredPermissions, requiredRole, navigate, location]);

  // TODO: Implement loading and error states
  if (authState.isLoading) {
    return <div>Loading...</div>;
  }

  // TODO: Implement authorization checks
  // Check if user is authenticated
  // Check if user has required permissions
  // Check if user has required role
  // Return fallback or redirect if unauthorized

  return <>{children}</>;
};

// TODO: Define LoginFormProps interface
interface LoginFormProps {
  // Add properties:
  // - onSuccess?: () => void
  // - redirectTo?: string
  // - enableOAuth?: boolean
  // - oauthProviders?: string[]
}

// TODO: Implement LoginForm component
const LoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess, 
  redirectTo = '/dashboard',
  enableOAuth = true,
  oauthProviders = ['google', 'github'] 
}) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, initiateOAuthFlow } = useAuth();
  const navigate = useNavigate();

  // TODO: Implement form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form inputs
    // Set loading state
    // Call login function
    // Handle success and errors
    // Navigate on success
  };

  // TODO: Implement OAuth login
  const handleOAuthLogin = async (provider: string) => {
    // Set loading state
    // Initiate OAuth flow
    // Handle errors
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Sign In</h2>
      
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#a00'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email
          </label>
          <input
            type="email"
            value={credentials.email}
            onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Password
          </label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {enableOAuth && (
        <div>
          <div style={{ 
            textAlign: 'center', 
            margin: '20px 0',
            color: '#666',
            fontSize: '14px'
          }}>
            Or sign in with
          </div>
          
          {oauthProviders.map(provider => (
            <button
              key={provider}
              onClick={() => handleOAuthLogin(provider)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Continue with {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// TODO: Implement OAuthCallback component
const OAuthCallback: React.FC = () => {
  const { handleOAuthCallback } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Extract code and state from URL parameters
    // TODO: Call handleOAuthCallback
    // TODO: Handle success and error states
    // TODO: Redirect after processing
  }, [handleOAuthCallback, navigate, location]);

  if (status === 'processing') {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div>Processing authentication...</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ color: 'red' }}>Authentication failed: {error}</div>
        <button onClick={() => navigate('/login')}>Try Again</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <div style={{ color: 'green' }}>Authentication successful! Redirecting...</div>
    </div>
  );
};

// TODO: Implement UserProfile component
const UserProfile: React.FC = () => {
  const { authState, logout } = useAuth();

  if (!authState.user) {
    return <div>No user information available</div>;
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2>User Profile</h2>
      
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px', 
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>Name:</strong> {authState.user.profile.firstName} {authState.user.profile.lastName}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Email:</strong> {authState.user.email}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Role:</strong> {authState.user.role}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Permissions:</strong> {authState.user.permissions.join(', ')}
        </div>
      </div>

      <button
        onClick={logout}
        style={{
          padding: '10px 20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  );
};

// Mock API responses for demonstration
const mockApiResponses = {
  login: async (credentials: LoginCredentials) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
      return {
        user: {
          id: '1',
          email: 'admin@example.com',
          role: 'admin',
          permissions: ['read', 'write', 'admin'],
          profile: {
            firstName: 'Admin',
            lastName: 'User',
          }
        },
        tokens: {
          accessToken: 'mock-access-token-12345',
          refreshToken: 'mock-refresh-token-67890',
          expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
        }
      };
    }
    
    throw new Error('Invalid credentials');
  },

  refreshTokens: async (refreshToken: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      accessToken: 'new-mock-access-token-12345',
      refreshToken: 'new-mock-refresh-token-67890',
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    };
  },

  logout: async (refreshToken: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Mock server-side token invalidation
  }
};

// Main Demo Component
const AuthenticationFlowsDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'login' | 'profile' | 'protected'>('login');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Authentication Flows & Security</h1>
      
      <div style={{ 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        padding: '15px', 
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <h3>Implementation Required</h3>
        <ul style={{ margin: 0 }}>
          <li>Complete the TokenManager class with secure storage and JWT validation</li>
          <li>Implement PKCEHelper for OAuth 2.0 PKCE flow security</li>
          <li>Build AuthService with login, OAuth, and token refresh functionality</li>
          <li>Create AuthProvider with context management and state handling</li>
          <li>Implement ProtectedRoute with permission-based access control</li>
          <li>Add automatic token refresh and session management</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setActiveDemo('login')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeDemo === 'login' ? '#007bff' : '#f8f9fa',
            color: activeDemo === 'login' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px 0 0 4px',
            cursor: 'pointer'
          }}
        >
          Login Form
        </button>
        <button
          onClick={() => setActiveDemo('profile')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeDemo === 'profile' ? '#007bff' : '#f8f9fa',
            color: activeDemo === 'profile' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderLeft: 'none',
            cursor: 'pointer'
          }}
        >
          User Profile
        </button>
        <button
          onClick={() => setActiveDemo('protected')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeDemo === 'protected' ? '#007bff' : '#f8f9fa',
            color: activeDemo === 'protected' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderLeft: 'none',
            borderRadius: '0 4px 4px 0',
            cursor: 'pointer'
          }}
        >
          Protected Route
        </button>
      </div>

      <AuthProvider>
        {activeDemo === 'login' && <LoginForm />}
        {activeDemo === 'profile' && <UserProfile />}
        
        {activeDemo === 'protected' && (
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>Protected Route Demo</h3>
            <p>This section demonstrates route protection and permission checking.</p>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Complete the ProtectedRoute component to see route protection in action.
            </p>
          </div>
        )}
      </AuthProvider>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h3>Authentication Pattern Implementation Guide</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          <div>
            <h4>JWT & Token Management</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Secure token storage strategies</li>
              <li>Automatic token refresh logic</li>
              <li>JWT validation and parsing</li>
              <li>Token expiration handling</li>
            </ul>
          </div>
          <div>
            <h4>OAuth 2.0 & PKCE</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>PKCE flow implementation</li>
              <li>State parameter CSRF protection</li>
              <li>Authorization code exchange</li>
              <li>Secure redirect handling</li>
            </ul>
          </div>
          <div>
            <h4>Route Protection</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Authentication guards</li>
              <li>Permission-based access control</li>
              <li>Redirect after login</li>
              <li>Deep link preservation</li>
            </ul>
          </div>
          <div>
            <h4>Session Management</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Authentication state management</li>
              <li>Context provider patterns</li>
              <li>Logout and cleanup</li>
              <li>Cross-tab session sync</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationFlowsDemo;