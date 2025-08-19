import React, { useState, useContext, createContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

// Types for E2E testing scenarios
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  isAuthenticated: boolean;
}

interface Report {
  id: string;
  title: string;
  type: 'sales' | 'inventory' | 'users';
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: Date;
  data?: any[];
}

// Authentication Context for E2E testing
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication logic
      if (username === 'admin' && password === 'admin123') {
        setUser({
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          isAuthenticated: true
        });
        return true;
      } else if (username === 'user' && password === 'user123') {
        setUser({
          id: '2',
          username: 'user',
          email: 'user@example.com',
          role: 'user',
          isAuthenticated: true
        });
        return true;
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Shopping Cart Context for E2E testing
interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // TODO: Implement CartProvider state management
  // - Initialize items state as empty array
  // - Implement addToCart function (handle existing items)
  // - Implement removeFromCart function
  // - Implement updateQuantity function
  // - Implement clearCart function
  // - Implement getTotalPrice calculation
  // - Implement getTotalItems calculation
  
  const value: CartContextType = {
    items: [],
    addToCart: () => {},
    removeFromCart: () => {},
    updateQuantity: () => {},
    clearCart: () => {},
    getTotalPrice: () => 0,
    getTotalItems: () => 0
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

// LoginFlow Component - E2E testing for authentication flows
export const LoginFlow: React.FC = () => {
  // TODO: Implement LoginFlow component
  // - Use useAuth hook for authentication
  // - Implement login form with username and password
  // - Handle form validation and submission
  // - Show loading states during authentication
  // - Display success/error messages
  // - Redirect after successful login
  // - Include forgot password and sign up links

  return (
    <div data-testid="login-flow">
      {/* TODO: Implement login flow UI */}
    </div>
  );
};

// ShoppingCart Component - E2E testing for e-commerce workflows
export const ShoppingCart: React.FC = () => {
  // TODO: Implement ShoppingCart component
  // - Use useCart hook for cart state
  // - Display cart items with product details
  // - Implement quantity controls (increase/decrease)
  // - Show item removal functionality
  // - Calculate and display total price
  // - Implement checkout process
  // - Handle empty cart state

  return (
    <div data-testid="shopping-cart">
      {/* TODO: Implement shopping cart UI */}
    </div>
  );
};

// AdminDashboard Component - E2E testing for admin workflows
export const AdminDashboard: React.FC = () => {
  // TODO: Implement AdminDashboard component
  // - Use useAuth hook to verify admin access
  // - Display admin statistics and metrics
  // - Implement user management features
  // - Show product management interface
  // - Include system settings and configuration
  // - Handle role-based access control

  return (
    <div data-testid="admin-dashboard">
      {/* TODO: Implement admin dashboard UI */}
    </div>
  );
};

// ReportGenerator Component - E2E testing for complex workflows
export const ReportGenerator: React.FC = () => {
  // TODO: Implement ReportGenerator component
  // - Manage report generation state
  // - Implement report type selection
  // - Handle date range selection
  // - Show report generation progress
  // - Display generated reports list
  // - Implement report download functionality
  // - Handle export to different formats

  return (
    <div data-testid="report-generator">
      {/* TODO: Implement report generator UI */}
    </div>
  );
};

// Main App Component for E2E testing
export const E2ETestingApp: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="app" data-testid="e2e-app">
            <nav data-testid="main-navigation" className="main-nav">
              <div className="nav-brand">
                <Link to="/" data-testid="home-link">E2E Test App</Link>
              </div>
              
              <div className="nav-links">
                <Link to="/login" data-testid="login-link">Login</Link>
              </div>
            </nav>
            
            <main className="main-content">
              <Routes>
                <Route path="/" element={
                  <div data-testid="home-page">
                    <h1>Welcome to E2E Testing App</h1>
                    <p>This application demonstrates end-to-end testing patterns.</p>
                  </div>
                } />
                
                <Route path="/login" element={<LoginFlow />} />
                <Route path="/cart" element={<ShoppingCart />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/reports" element={<ReportGenerator />} />
              </Routes>
            </main>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

// Utility hooks for E2E testing scenarios
export const usePageTitle = (title: string) => {
  // TODO: Implement usePageTitle hook
  // - Update document title when component mounts
  // - Clean up on unmount
  
  useEffect(() => {
    // TODO: Set document.title and cleanup
  }, [title]);
};

export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  // TODO: Implement useLocalStorage hook
  // - Read from localStorage on mount
  // - Update localStorage when value changes
  // - Handle serialization/deserialization
  
  return [initialValue, (value: T) => {}];
};

export const useApiCall = <T,>(url: string) => {
  // TODO: Implement useApiCall hook
  // - Manage loading, data, and error states
  // - Make API call on mount or when URL changes
  // - Handle cleanup and cancellation
  
  return {
    data: null,
    loading: false,
    error: null,
    refetch: () => {}
  };
};