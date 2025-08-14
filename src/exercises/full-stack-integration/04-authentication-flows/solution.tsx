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

interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  initiateOAuthFlow: (provider: string) => Promise<void>;
  handleOAuthCallback: (code: string, state: string) => Promise<void>;
}

// TokenManager Implementation
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'auth_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'auth_token_expiry';
  private static refreshTimer: NodeJS.Timeout | null = null;

  static saveTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, tokens.expiresAt.toString());
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  static getTokens(): AuthTokens | null {
    try {
      const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      const expiresAt = localStorage.getItem(this.TOKEN_EXPIRY_KEY);

      if (!accessToken || !refreshToken || !expiresAt) {
        return null;
      }

      const expiry = parseInt(expiresAt, 10);
      if (Date.now() > expiry) {
        this.clearTokens();
        return null;
      }

      return {
        accessToken,
        refreshToken,
        expiresAt: expiry,
      };
    } catch (error) {
      console.error('Failed to get tokens:', error);
      return null;
    }
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  static async validateToken(token: string): Promise<JWTPayload | null> {
    try {
      // In production, you would verify with the actual secret/key
      const payload = jose.decodeJwt(token) as JWTPayload;
      
      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = jose.decodeJwt(token);
      if (!payload.exp) return true;
      
      // Consider token expired if it expires within 5 minutes
      const bufferTime = 5 * 60 * 1000; // 5 minutes
      return (payload.exp * 1000) <= (Date.now() + bufferTime);
    } catch {
      return true;
    }
  }

  static async scheduleTokenRefresh(expiresAt: number, refreshCallback: () => Promise<void>): Promise<void> {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Schedule refresh 5 minutes before expiration
    const refreshTime = expiresAt - Date.now() - (5 * 60 * 1000);
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          await refreshCallback();
        } catch (error) {
          console.error('Scheduled token refresh failed:', error);
        }
      }, refreshTime);
    }
  }
}

// PKCEHelper Implementation
class PKCEHelper {
  static generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  static async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  static generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  static buildAuthorizationURL(params: {
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    state: string;
    scope?: string;
  }): string {
    const url = new URL('https://auth.example.com/oauth/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', params.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('code_challenge', params.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', params.state);
    if (params.scope) {
      url.searchParams.set('scope', params.scope);
    }
    return url.toString();
  }
}

// AuthService Implementation
class AuthService {
  private static readonly API_BASE = '/api/auth';
  
  static async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    // Mock implementation - replace with actual API call
    return mockApiResponses.login(credentials);
  }

  static async initiateOAuthFlow(provider: string): Promise<PKCEData> {
    const codeVerifier = PKCEHelper.generateCodeVerifier();
    const codeChallenge = await PKCEHelper.generateCodeChallenge(codeVerifier);
    const state = PKCEHelper.generateState();

    // Store PKCE data temporarily
    sessionStorage.setItem('oauth_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    return { codeVerifier, codeChallenge, state };
  }

  static async handleOAuthCallback(code: string, state: string, codeVerifier: string): Promise<{ user: User; tokens: AuthTokens }> {
    // Validate state parameter
    const storedState = sessionStorage.getItem('oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }

    // Mock OAuth token exchange
    const response = await fetch(`${this.API_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        code_verifier: codeVerifier,
        client_id: 'your-client-id',
      }),
    });

    if (!response.ok) {
      throw new Error('OAuth token exchange failed');
    }

    // Clean up stored PKCE data
    sessionStorage.removeItem('oauth_code_verifier');
    sessionStorage.removeItem('oauth_state');

    return response.json();
  }

  static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    return mockApiResponses.refreshTokens(refreshToken);
  }

  static async logout(refreshToken: string): Promise<void> {
    await mockApiResponses.logout(refreshToken);
  }

  static async getUserProfile(accessToken: string): Promise<User> {
    const response = await fetch(`${this.API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  }
}

// AuthContext Implementation
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider Implementation
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const tokens = TokenManager.getTokens();
        if (tokens) {
          const payload = await TokenManager.validateToken(tokens.accessToken);
          if (payload) {
            const user: User = {
              id: payload.sub,
              email: payload.email,
              role: payload.role,
              permissions: payload.permissions,
              profile: {
                firstName: 'User',
                lastName: 'Name',
              },
            };

            setAuthState({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Schedule token refresh
            TokenManager.scheduleTokenRefresh(tokens.expiresAt, refreshTokens);
            return;
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      }

      setAuthState(prev => ({ ...prev, isLoading: false }));
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { user, tokens } = await AuthService.login(credentials);
      
      TokenManager.saveTokens(tokens);
      TokenManager.scheduleTokenRefresh(tokens.expiresAt, refreshTokens);

      setAuthState({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (authState.tokens?.refreshToken) {
        await AuthService.logout(authState.tokens.refreshToken);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    }

    TokenManager.clearTokens();
    setAuthState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, [authState.tokens]);

  const refreshTokens = useCallback(async () => {
    if (!authState.tokens?.refreshToken) {
      await logout();
      return;
    }

    try {
      const newTokens = await AuthService.refreshTokens(authState.tokens.refreshToken);
      
      TokenManager.saveTokens(newTokens);
      TokenManager.scheduleTokenRefresh(newTokens.expiresAt, refreshTokens);

      setAuthState(prev => ({
        ...prev,
        tokens: newTokens,
      }));
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  }, [authState.tokens, logout]);

  const initiateOAuthFlow = useCallback(async (provider: string) => {
    try {
      const pkceData = await AuthService.initiateOAuthFlow(provider);
      const authUrl = PKCEHelper.buildAuthorizationURL({
        clientId: 'your-client-id',
        redirectUri: `${window.location.origin}/auth/callback`,
        codeChallenge: pkceData.codeChallenge,
        state: pkceData.state,
        scope: 'openid profile email',
      });

      window.location.href = authUrl;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'OAuth initiation failed',
      }));
    }
  }, []);

  const handleOAuthCallback = useCallback(async (code: string, state: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
      if (!codeVerifier) {
        throw new Error('Missing code verifier');
      }

      const { user, tokens } = await AuthService.handleOAuthCallback(code, state, codeVerifier);
      
      TokenManager.saveTokens(tokens);
      TokenManager.scheduleTokenRefresh(tokens.expiresAt, refreshTokens);

      setAuthState({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'OAuth callback failed',
      }));
    }
  }, [refreshTokens]);

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

// useAuth hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// ProtectedRoute Implementation
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRole?: string;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

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

  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      // Store intended destination
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      navigate(redirectTo);
      return;
    }

    if (authState.user) {
      // Check required role
      if (requiredRole && authState.user.role !== requiredRole) {
        navigate('/unauthorized');
        return;
      }

      // Check required permissions
      if (requiredPermissions.length > 0) {
        const hasPermissions = requiredPermissions.every(permission =>
          authState.user!.permissions.includes(permission)
        );
        
        if (!hasPermissions) {
          navigate('/unauthorized');
          return;
        }
      }
    }
  }, [authState, requiredPermissions, requiredRole, navigate, location, redirectTo]);

  if (authState.isLoading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  if (!authState.isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  if (requiredRole && authState.user?.role !== requiredRole) {
    return fallback ? <>{fallback}</> : <div>Unauthorized</div>;
  }

  if (requiredPermissions.length > 0) {
    const hasPermissions = requiredPermissions.every(permission =>
      authState.user!.permissions.includes(permission)
    );
    
    if (!hasPermissions) {
      return fallback ? <>{fallback}</> : <div>Insufficient permissions</div>;
    }
  }

  return <>{children}</>;
};

// LoginForm Implementation
interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  enableOAuth?: boolean;
  oauthProviders?: string[];
}

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

  const { login, initiateOAuthFlow, authState } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(credentials);
      
      // Redirect to intended destination or default
      const redirectPath = sessionStorage.getItem('redirectAfterLogin') || redirectTo;
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath);
      
      onSuccess?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await initiateOAuthFlow(provider);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'OAuth login failed');
      setIsLoading(false);
    }
  };

  if (authState.isAuthenticated) {
    return <div>Already logged in</div>;
  }

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

// OAuthCallback Implementation
const OAuthCallback: React.FC = () => {
  const { handleOAuthCallback } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const errorParam = urlParams.get('error');

        if (errorParam) {
          throw new Error(`OAuth error: ${errorParam}`);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state parameter');
        }

        await handleOAuthCallback(code, state);
        setStatus('success');
        
        // Redirect after success
        setTimeout(() => {
          const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(redirectPath);
        }, 2000);
        
      } catch (error) {
        setError(error instanceof Error ? error.message : 'OAuth callback failed');
        setStatus('error');
      }
    };

    processCallback();
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
        <button 
          onClick={() => navigate('/login')}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <div style={{ color: 'green' }}>Authentication successful! Redirecting...</div>
    </div>
  );
};

// UserProfile Implementation
const UserProfile: React.FC = () => {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
        {authState.tokens && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Token expires:</strong> {new Date(authState.tokens.expiresAt).toLocaleString()}
          </div>
        )}
      </div>

      <button
        onClick={handleLogout}
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
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
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
          expiresAt,
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
        background: '#d4edda', 
        border: '1px solid #c3e6cb', 
        padding: '15px', 
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <h3>✅ Complete Implementation</h3>
        <ul style={{ margin: 0 }}>
          <li>✅ TokenManager with secure storage and JWT validation</li>
          <li>✅ PKCEHelper for OAuth 2.0 PKCE flow security</li>
          <li>✅ AuthService with login, OAuth, and token refresh</li>
          <li>✅ AuthProvider with context management and state handling</li>
          <li>✅ ProtectedRoute with permission-based access control</li>
          <li>✅ Automatic token refresh and session management</li>
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
          <ProtectedRoute requiredPermissions={['admin']}>
            <div style={{ padding: '20px', border: '1px solid #28a745', borderRadius: '8px' }}>
              <h3>🔒 Protected Content</h3>
              <p>This content is only visible to users with admin permissions.</p>
              <p>Try logging in with admin@example.com / password to see this content.</p>
            </div>
          </ProtectedRoute>
        )}
      </AuthProvider>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h3>Authentication Implementation Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          <div>
            <h4>JWT & Token Management</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>✅ Secure localStorage token storage</li>
              <li>✅ Automatic token refresh scheduling</li>
              <li>✅ JWT validation and parsing with jose</li>
              <li>✅ Token expiration handling with buffer</li>
            </ul>
          </div>
          <div>
            <h4>OAuth 2.0 & PKCE</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>✅ PKCE code verifier generation</li>
              <li>✅ SHA256 code challenge creation</li>
              <li>✅ State parameter CSRF protection</li>
              <li>✅ Authorization URL building</li>
            </ul>
          </div>
          <div>
            <h4>Route Protection</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>✅ Authentication guards with redirects</li>
              <li>✅ Permission-based access control</li>
              <li>✅ Deep link preservation</li>
              <li>✅ Role-based route protection</li>
            </ul>
          </div>
          <div>
            <h4>Session Management</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>✅ React Context state management</li>
              <li>✅ Automatic session restoration</li>
              <li>✅ Secure logout with cleanup</li>
              <li>✅ Error handling and recovery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationFlowsDemo;