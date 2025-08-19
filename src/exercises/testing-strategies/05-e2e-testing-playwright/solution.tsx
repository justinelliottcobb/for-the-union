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
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        );
      } else {
        return [...prevItems, { product, quantity: Math.min(quantity, product.stock) }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.product.id === productId) {
          const newQuantity = Math.min(quantity, item.product.stock);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems
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
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    try {
      const success = await login(formData.username, formData.password);
      
      if (!success) {
        setError('Invalid username or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div data-testid="login-flow" className="login-container">
      <div className="login-form-wrapper">
        <h2 data-testid="login-title">Login</h2>
        
        <form onSubmit={handleSubmit} data-testid="login-form" className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              data-testid="username-input"
              className={validationErrors.username ? 'error' : ''}
              disabled={isLoading}
            />
            {validationErrors.username && (
              <span data-testid="username-error" className="field-error">
                {validationErrors.username}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              data-testid="password-input"
              className={validationErrors.password ? 'error' : ''}
              disabled={isLoading}
            />
            {validationErrors.password && (
              <span data-testid="password-error" className="field-error">
                {validationErrors.password}
              </span>
            )}
          </div>

          {error && (
            <div data-testid="error-message" className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            data-testid="login-button"
            className="login-btn"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-links">
          <Link to="/forgot-password" data-testid="forgot-password-link">
            Forgot Password?
          </Link>
          <Link to="/signup" data-testid="signup-link">
            Don't have an account? Sign up
          </Link>
        </div>

        <div className="demo-credentials" data-testid="demo-credentials">
          <h4>Demo Credentials:</h4>
          <p><strong>Admin:</strong> admin / admin123</p>
          <p><strong>User:</strong> user / user123</p>
        </div>
      </div>
    </div>
  );
};

// ShoppingCart Component - E2E testing for e-commerce workflows
export const ShoppingCart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart();
  const [showConfirmRemove, setShowConfirmRemove] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity >= 1) {
      updateQuantity(productId, quantity);
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
    setShowConfirmRemove(null);
  };

  const handleCheckout = () => {
    // Navigate to checkout process
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div data-testid="shopping-cart" className="cart-empty">
        <h2>Your Cart is Empty</h2>
        <p>Add some products to your cart to get started.</p>
        <Link to="/products" data-testid="continue-shopping-link" className="continue-shopping-btn">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="shopping-cart" className="cart-container">
      <div className="cart-header">
        <h2>Shopping Cart</h2>
        <button 
          onClick={clearCart}
          data-testid="clear-cart-button"
          className="clear-cart-btn"
        >
          Clear Cart
        </button>
      </div>

      <div className="cart-items">
        {items.map((item) => (
          <div key={item.product.id} data-testid={`cart-item-${item.product.id}`} className="cart-item">
            <div className="item-details">
              <h3 data-testid={`item-name-${item.product.id}`}>{item.product.name}</h3>
              <p data-testid={`item-price-${item.product.id}`} className="item-price">
                ${item.product.price}
              </p>
              <p data-testid={`item-category-${item.product.id}`} className="item-category">
                Category: {item.product.category}
              </p>
            </div>

            <div className="quantity-controls">
              <button
                onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                data-testid={`decrease-quantity-${item.product.id}`}
                className="quantity-btn"
              >
                -
              </button>
              
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value) || 1)}
                min="1"
                max={item.product.stock}
                data-testid={`quantity-input-${item.product.id}`}
                className="quantity-input"
              />
              
              <button
                onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                disabled={item.quantity >= item.product.stock}
                data-testid={`increase-quantity-${item.product.id}`}
                className="quantity-btn"
              >
                +
              </button>
            </div>

            <div className="item-total">
              <span data-testid={`item-total-${item.product.id}`} className="total-price">
                ${(item.product.price * item.quantity).toFixed(2)}
              </span>
            </div>

            <div className="item-actions">
              <button
                onClick={() => setShowConfirmRemove(item.product.id)}
                data-testid={`remove-item-${item.product.id}`}
                className="remove-btn"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary" data-testid="cart-summary">
        <div className="summary-row">
          <span>Total Items:</span>
          <span data-testid="total-items">{getTotalItems()}</span>
        </div>
        <div className="summary-row total">
          <span>Total Price:</span>
          <span data-testid="total-price">${getTotalPrice().toFixed(2)}</span>
        </div>
      </div>

      <div className="cart-actions">
        <Link to="/products" data-testid="continue-shopping-button" className="continue-btn">
          Continue Shopping
        </Link>
        <button
          onClick={handleCheckout}
          data-testid="checkout-button"
          className="checkout-btn"
        >
          Proceed to Checkout
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmRemove && (
        <div className="modal-overlay" data-testid="remove-confirmation-modal">
          <div className="modal">
            <h3>Confirm Removal</h3>
            <p>Are you sure you want to remove this item from your cart?</p>
            <div className="modal-actions">
              <button
                onClick={() => handleRemoveItem(showConfirmRemove)}
                data-testid="confirm-remove-button"
                className="confirm-btn"
              >
                Yes, Remove
              </button>
              <button
                onClick={() => setShowConfirmRemove(null)}
                data-testid="cancel-remove-button"
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// AdminDashboard Component - E2E testing for admin workflows
export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSales: 0,
    totalProducts: 0,
    isLoading: true
  });
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products' | 'settings'>('overview');

  useEffect(() => {
    // Simulate loading stats
    const loadStats = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalUsers: 150,
        totalSales: 25000,
        totalProducts: 45,
        isLoading: false
      });
      
      // Mock users data
      setUsers([
        { id: '1', username: 'admin', email: 'admin@example.com', role: 'admin', isAuthenticated: true },
        { id: '2', username: 'user1', email: 'user1@example.com', role: 'user', isAuthenticated: true },
        { id: '3', username: 'user2', email: 'user2@example.com', role: 'user', isAuthenticated: false }
      ]);

      // Mock products data
      setProducts([
        { id: '1', name: 'Laptop', price: 999, category: 'Electronics', stock: 10 },
        { id: '2', name: 'Phone', price: 699, category: 'Electronics', stock: 15 },
        { id: '3', name: 'Book', price: 29, category: 'Education', stock: 50 }
      ]);
    };

    loadStats();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div data-testid="admin-dashboard" className="access-denied">
        <h2>Access Denied</h2>
        <p data-testid="access-denied-message">
          You don't have permission to access this page. Admin privileges required.
        </p>
        <Link to="/" data-testid="go-home-link">Go to Home</Link>
      </div>
    );
  }

  const renderOverview = () => (
    <div data-testid="overview-tab" className="overview-section">
      <h3>Dashboard Overview</h3>
      {stats.isLoading ? (
        <div data-testid="stats-loading" className="loading">Loading statistics...</div>
      ) : (
        <div className="stats-grid">
          <div data-testid="total-users-stat" className="stat-card">
            <h4>Total Users</h4>
            <span className="stat-number">{stats.totalUsers}</span>
          </div>
          <div data-testid="total-sales-stat" className="stat-card">
            <h4>Total Sales</h4>
            <span className="stat-number">${stats.totalSales.toLocaleString()}</span>
          </div>
          <div data-testid="total-products-stat" className="stat-card">
            <h4>Total Products</h4>
            <span className="stat-number">{stats.totalProducts}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div data-testid="users-tab" className="users-section">
      <h3>User Management</h3>
      <div className="users-list">
        {users.map(user => (
          <div key={user.id} data-testid={`user-${user.id}`} className="user-card">
            <div className="user-info">
              <h4>{user.username}</h4>
              <p>{user.email}</p>
              <span className={`role-badge ${user.role}`}>{user.role}</span>
              <span className={`status-badge ${user.isAuthenticated ? 'online' : 'offline'}`}>
                {user.isAuthenticated ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="user-actions">
              <button data-testid={`edit-user-${user.id}`} className="edit-btn">Edit</button>
              <button data-testid={`delete-user-${user.id}`} className="delete-btn">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProducts = () => (
    <div data-testid="products-tab" className="products-section">
      <h3>Product Management</h3>
      <button data-testid="add-product-button" className="add-product-btn">Add New Product</button>
      <div className="products-list">
        {products.map(product => (
          <div key={product.id} data-testid={`product-${product.id}`} className="product-card">
            <div className="product-info">
              <h4>{product.name}</h4>
              <p>${product.price}</p>
              <p>Category: {product.category}</p>
              <p>Stock: {product.stock}</p>
            </div>
            <div className="product-actions">
              <button data-testid={`edit-product-${product.id}`} className="edit-btn">Edit</button>
              <button data-testid={`delete-product-${product.id}`} className="delete-btn">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div data-testid="settings-tab" className="settings-section">
      <h3>System Settings</h3>
      <div className="settings-groups">
        <div className="setting-group">
          <h4>Application Settings</h4>
          <button data-testid="maintenance-mode-btn" className="setting-btn">
            Toggle Maintenance Mode
          </button>
          <button data-testid="clear-cache-btn" className="setting-btn">
            Clear Cache
          </button>
        </div>
        <div className="setting-group">
          <h4>Security Settings</h4>
          <button data-testid="reset-passwords-btn" className="setting-btn">
            Force Password Reset
          </button>
          <button data-testid="audit-logs-btn" className="setting-btn">
            View Audit Logs
          </button>
        </div>
      </div>
    </div>
  );

  const tabs = {
    overview: renderOverview,
    users: renderUsers,
    products: renderProducts,
    settings: renderSettings
  };

  return (
    <div data-testid="admin-dashboard" className="admin-dashboard">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <p>Welcome, {user.username}!</p>
      </div>

      <nav className="admin-nav" data-testid="admin-navigation">
        {Object.keys(tabs).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as keyof typeof tabs)}
            className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
            data-testid={`${tab}-tab-button`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <div className="admin-content" data-testid="admin-content">
        {tabs[activeTab]()}
      </div>
    </div>
  );
};

// ReportGenerator Component - E2E testing for complex workflows
export const ReportGenerator: React.FC = () => {
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'users'>('sales');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [reports, setReports] = useState<Report[]>([]);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    setIsGenerating(true);
    
    const newReport: Report = {
      id: Date.now().toString(),
      title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
      type: reportType,
      status: 'generating',
      createdAt: new Date()
    };

    setCurrentReport(newReport);
    setReports(prev => [newReport, ...prev]);

    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock report data
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: Math.floor(Math.random() * 1000)
      }));

      const completedReport = {
        ...newReport,
        status: 'completed' as const,
        data: mockData
      };

      setReports(prev => prev.map(r => r.id === newReport.id ? completedReport : r));
      setCurrentReport(completedReport);
    } catch (error) {
      const failedReport = {
        ...newReport,
        status: 'failed' as const
      };
      
      setReports(prev => prev.map(r => r.id === newReport.id ? failedReport : r));
      setCurrentReport(failedReport);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = (reportId: string, format: 'pdf' | 'csv' | 'excel') => {
    // Simulate download
    const report = reports.find(r => r.id === reportId);
    if (report) {
      alert(`Downloading ${report.title} as ${format.toUpperCase()}`);
    }
  };

  const retryReport = (reportId: string) => {
    setReports(prev => prev.map(r => 
      r.id === reportId ? { ...r, status: 'pending' as const } : r
    ));
  };

  return (
    <div data-testid="report-generator" className="report-generator">
      <div className="report-header">
        <h2>Report Generator</h2>
        <p>Generate and download various business reports</p>
      </div>

      <div className="report-form" data-testid="report-form">
        <div className="form-group">
          <label htmlFor="report-type">Report Type:</label>
          <select
            id="report-type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as 'sales' | 'inventory' | 'users')}
            data-testid="report-type-select"
          >
            <option value="sales">Sales Report</option>
            <option value="inventory">Inventory Report</option>
            <option value="users">Users Report</option>
          </select>
        </div>

        <div className="date-range">
          <div className="form-group">
            <label htmlFor="start-date">Start Date:</label>
            <input
              id="start-date"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              data-testid="start-date-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="end-date">End Date:</label>
            <input
              id="end-date"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              data-testid="end-date-input"
            />
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={isGenerating}
          data-testid="generate-report-button"
          className="generate-btn"
        >
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {currentReport && currentReport.status === 'generating' && (
        <div data-testid="generation-progress" className="progress-section">
          <h3>Generating Report...</h3>
          <div className="progress-bar">
            <div className="progress-fill" data-testid="progress-fill"></div>
          </div>
          <p>Please wait while we generate your report...</p>
        </div>
      )}

      <div className="reports-list" data-testid="reports-list">
        <h3>Generated Reports</h3>
        
        {reports.length === 0 ? (
          <p data-testid="no-reports">No reports generated yet.</p>
        ) : (
          <div className="reports-grid">
            {reports.map(report => (
              <div key={report.id} data-testid={`report-${report.id}`} className="report-card">
                <div className="report-info">
                  <h4 data-testid={`report-title-${report.id}`}>{report.title}</h4>
                  <p>Type: {report.type}</p>
                  <p>Created: {report.createdAt.toLocaleDateString()}</p>
                  <span 
                    className={`status-badge ${report.status}`}
                    data-testid={`report-status-${report.id}`}
                  >
                    {report.status}
                  </span>
                </div>

                <div className="report-actions">
                  {report.status === 'completed' && (
                    <>
                      <button
                        onClick={() => downloadReport(report.id, 'pdf')}
                        data-testid={`download-pdf-${report.id}`}
                        className="download-btn"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => downloadReport(report.id, 'csv')}
                        data-testid={`download-csv-${report.id}`}
                        className="download-btn"
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => downloadReport(report.id, 'excel')}
                        data-testid={`download-excel-${report.id}`}
                        className="download-btn"
                      >
                        Excel
                      </button>
                    </>
                  )}

                  {report.status === 'failed' && (
                    <button
                      onClick={() => retryReport(report.id)}
                      data-testid={`retry-report-${report.id}`}
                      className="retry-btn"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Product List Component for shopping cart testing
export const ProductList: React.FC = () => {
  const { addToCart } = useCart();
  const [products] = useState<Product[]>([
    { id: '1', name: 'Laptop', price: 999, category: 'Electronics', stock: 10 },
    { id: '2', name: 'Phone', price: 699, category: 'Electronics', stock: 15 },
    { id: '3', name: 'Book', price: 29, category: 'Education', stock: 50 },
    { id: '4', name: 'Headphones', price: 199, category: 'Electronics', stock: 8 }
  ]);

  return (
    <div data-testid="product-list" className="product-list">
      <h2>Products</h2>
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} data-testid={`product-${product.id}`} className="product-card">
            <h3>{product.name}</h3>
            <p className="price">${product.price}</p>
            <p className="stock">Stock: {product.stock}</p>
            <p className="category">Category: {product.category}</p>
            <button 
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              data-testid={`add-to-cart-${product.id}`}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Navigation Component for E2E testing
export const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();

  return (
    <nav data-testid="main-navigation" className="main-nav">
      <div className="nav-brand">
        <Link to="/" data-testid="home-link">E2E Test App</Link>
      </div>
      
      <div className="nav-links">
        <Link to="/products" data-testid="products-link">Products</Link>
        <Link to="/cart" data-testid="cart-link">
          Cart ({getTotalItems()})
        </Link>
        
        {user?.role === 'admin' && (
          <>
            <Link to="/admin" data-testid="admin-link">Admin</Link>
            <Link to="/reports" data-testid="reports-link">Reports</Link>
          </>
        )}
        
        {user ? (
          <div className="user-menu" data-testid="user-menu">
            <span>Welcome, {user.username}</span>
            <button onClick={logout} data-testid="logout-button">Logout</button>
          </div>
        ) : (
          <Link to="/login" data-testid="login-link">Login</Link>
        )}
      </div>
    </nav>
  );
};

// Main App Component for E2E testing
export const E2ETestingApp: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="app" data-testid="e2e-app">
            <Navigation />
            
            <main className="main-content">
              <Routes>
                <Route path="/" element={
                  <div data-testid="home-page">
                    <h1>Welcome to E2E Testing App</h1>
                    <p>This application demonstrates end-to-end testing patterns.</p>
                  </div>
                } />
                
                <Route path="/login" element={<LoginFlow />} />
                <Route path="/products" element={<ProductList />} />
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
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
};

export const useApiCall = <T,>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (url) {
      fetchData();
    }
  }, [url]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};