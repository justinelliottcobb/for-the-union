import React, { useState, useContext, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// User Context for integration testing
interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface UserContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (user: User) => {
    setUser(user);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

// Payment Context for integration testing
interface PaymentState {
  step: 'billing' | 'payment' | 'confirmation';
  billingInfo: {
    name: string;
    address: string;
    city: string;
  };
  paymentMethod: 'card' | 'paypal' | null;
  isProcessing: boolean;
}

interface PaymentContextType {
  state: PaymentState;
  updateBillingInfo: (info: PaymentState['billingInfo']) => void;
  setPaymentMethod: (method: PaymentState['paymentMethod']) => void;
  nextStep: () => void;
  prevStep: () => void;
  processPayment: () => Promise<boolean>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PaymentState>({
    step: 'billing',
    billingInfo: {
      name: '',
      address: '',
      city: ''
    },
    paymentMethod: null,
    isProcessing: false
  });

  const updateBillingInfo = (info: PaymentState['billingInfo']) => {
    setState(prev => ({
      ...prev,
      billingInfo: { ...prev.billingInfo, ...info }
    }));
  };

  const setPaymentMethod = (method: PaymentState['paymentMethod']) => {
    setState(prev => ({
      ...prev,
      paymentMethod: method
    }));
  };

  const nextStep = () => {
    setState(prev => {
      const steps = ['billing', 'payment', 'confirmation'] as const;
      const currentIndex = steps.indexOf(prev.step);
      const nextIndex = Math.min(currentIndex + 1, steps.length - 1);
      return {
        ...prev,
        step: steps[nextIndex]
      };
    });
  };

  const prevStep = () => {
    setState(prev => {
      const steps = ['billing', 'payment', 'confirmation'] as const;
      const currentIndex = steps.indexOf(prev.step);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return {
        ...prev,
        step: steps[prevIndex]
      };
    });
  };

  const processPayment = async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      // Simulate async payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate payment success/failure based on payment method
      const success = state.paymentMethod === 'card' || state.paymentMethod === 'paypal';
      
      setState(prev => ({ ...prev, isProcessing: false }));
      return success;
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }));
      return false;
    }
  };

  const value: PaymentContextType = {
    state,
    updateBillingInfo,
    setPaymentMethod,
    nextStep,
    prevStep,
    processPayment
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within PaymentProvider');
  }
  return context;
};

// UserWorkflow Component - Integration testing for user authentication flow
export const UserWorkflow: React.FC = () => {
  const { user, login, logout } = useUser();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (formData.email && formData.password) {
        const mockUser: User = {
          id: '1',
          name: formData.email.split('@')[0],
          email: formData.email,
          role: formData.email.includes('admin') ? 'admin' : 'user'
        };
        login(mockUser);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (user) {
    return (
      <div data-testid="user-workflow" className="user-dashboard">
        <h2>Welcome, {user.name}!</h2>
        <div data-testid="user-info">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>
        <button 
          onClick={logout}
          data-testid="logout-button"
          className="logout-btn"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div data-testid="user-workflow" className="login-form">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} data-testid="login-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            data-testid="email-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            data-testid="password-input"
          />
        </div>
        
        {error && (
          <div data-testid="error-message" className="error">
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
    </div>
  );
};

// PaymentFlow Component - Integration testing for multi-step payment process
export const PaymentFlow: React.FC = () => {
  const { state, updateBillingInfo, setPaymentMethod, nextStep, prevStep, processPayment } = usePayment();
  const [paymentResult, setPaymentResult] = useState<'success' | 'error' | null>(null);

  const handleBillingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    updateBillingInfo({
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string
    });
    nextStep();
  };

  const handlePaymentSubmit = async () => {
    if (!state.paymentMethod) return;
    
    try {
      const success = await processPayment();
      setPaymentResult(success ? 'success' : 'error');
      if (success) nextStep();
    } catch (error) {
      setPaymentResult('error');
    }
  };

  const canProceedFromBilling = () => {
    return state.billingInfo.name && state.billingInfo.address && state.billingInfo.city;
  };

  const canProceedFromPayment = () => {
    return state.paymentMethod !== null;
  };

  const renderBillingStep = () => (
    <div data-testid="billing-step">
      <h3>Billing Information</h3>
      <form onSubmit={handleBillingSubmit} data-testid="billing-form">
        <div className="form-group">
          <label htmlFor="name">Full Name:</label>
          <input
            id="name"
            name="name"
            defaultValue={state.billingInfo.name}
            required
            data-testid="name-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="address">Address:</label>
          <input
            id="address"
            name="address"
            defaultValue={state.billingInfo.address}
            required
            data-testid="address-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="city">City:</label>
          <input
            id="city"
            name="city"
            defaultValue={state.billingInfo.city}
            required
            data-testid="city-input"
          />
        </div>
        
        <button 
          type="submit"
          data-testid="next-button"
          className="next-btn"
        >
          Next
        </button>
      </form>
    </div>
  );

  const renderPaymentStep = () => (
    <div data-testid="payment-step">
      <h3>Payment Method</h3>
      <div className="payment-methods">
        <label>
          <input
            type="radio"
            name="paymentMethod"
            value="card"
            checked={state.paymentMethod === 'card'}
            onChange={() => setPaymentMethod('card')}
            data-testid="card-radio"
          />
          Credit Card
        </label>
        
        <label>
          <input
            type="radio"
            name="paymentMethod"
            value="paypal"
            checked={state.paymentMethod === 'paypal'}
            onChange={() => setPaymentMethod('paypal')}
            data-testid="paypal-radio"
          />
          PayPal
        </label>
      </div>
      
      <div className="navigation-buttons">
        <button 
          onClick={prevStep}
          data-testid="previous-button"
          className="prev-btn"
        >
          Previous
        </button>
        
        <button 
          onClick={nextStep}
          disabled={!canProceedFromPayment()}
          data-testid="next-button"
          className="next-btn"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div data-testid="confirmation-step">
      <h3>Order Confirmation</h3>
      <div className="order-summary" data-testid="order-summary">
        <h4>Billing Information:</h4>
        <p><strong>Name:</strong> {state.billingInfo.name}</p>
        <p><strong>Address:</strong> {state.billingInfo.address}</p>
        <p><strong>City:</strong> {state.billingInfo.city}</p>
        
        <h4>Payment Method:</h4>
        <p><strong>Method:</strong> {state.paymentMethod}</p>
      </div>
      
      {paymentResult === 'success' && (
        <div data-testid="success-message" className="success">
          Payment successful! Thank you for your order.
        </div>
      )}
      
      {paymentResult === 'error' && (
        <div data-testid="error-message" className="error">
          Payment failed. Please try again.
        </div>
      )}
      
      <div className="navigation-buttons">
        <button 
          onClick={prevStep}
          data-testid="previous-button"
          className="prev-btn"
          disabled={state.isProcessing}
        >
          Previous
        </button>
        
        <button 
          onClick={handlePaymentSubmit}
          disabled={state.isProcessing || paymentResult === 'success'}
          data-testid="submit-button"
          className="submit-btn"
        >
          {state.isProcessing ? 'Processing...' : 'Submit Payment'}
        </button>
      </div>
    </div>
  );

  const stepComponents = {
    billing: renderBillingStep,
    payment: renderPaymentStep,
    confirmation: renderConfirmationStep
  };

  return (
    <div data-testid="payment-flow" className="payment-flow">
      <div className="progress-indicator" data-testid="progress-indicator">
        Step {['billing', 'payment', 'confirmation'].indexOf(state.step) + 1} of 3
      </div>
      
      {stepComponents[state.step]()}
    </div>
  );
};

// DashboardIntegration Component - Integration testing with routing and context
export const DashboardIntegration: React.FC = () => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const sections = [
    { id: 'overview', title: 'Overview', path: '/dashboard/overview' },
    { id: 'profile', title: 'Profile', path: '/dashboard/profile' },
    ...(user?.role === 'admin' ? [{ id: 'admin', title: 'Admin Panel', path: '/dashboard/admin' }] : [])
  ];

  const currentSection = location.pathname.split('/').pop() || 'overview';

  const renderSectionContent = () => {
    switch (currentSection) {
      case 'overview':
        return (
          <div data-testid="overview-section">
            <h3>Dashboard Overview</h3>
            <p>Welcome to your dashboard, {user?.name}!</p>
            <p>Current route: {location.pathname}</p>
          </div>
        );
      
      case 'profile':
        return (
          <div data-testid="profile-section">
            <h3>Profile Settings</h3>
            <p>Manage your profile settings here.</p>
            <div className="user-details">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {user?.role}</p>
            </div>
          </div>
        );
      
      case 'admin':
        return user?.role === 'admin' ? (
          <div data-testid="admin-section">
            <h3>Admin Panel</h3>
            <p>Administrative controls and settings.</p>
            <div className="admin-controls">
              <button>Manage Users</button>
              <button>System Settings</button>
              <button>View Reports</button>
            </div>
          </div>
        ) : (
          <div data-testid="access-denied">
            <p>Access denied. Admin privileges required.</p>
          </div>
        );
      
      default:
        return (
          <div data-testid="not-found">
            <p>Section not found.</p>
          </div>
        );
    }
  };

  if (!user) {
    return (
      <div data-testid="dashboard-integration" className="login-required">
        <p>Please log in to access the dashboard.</p>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-integration" className="dashboard">
      <nav className="dashboard-nav" data-testid="dashboard-nav">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => navigate(section.path)}
            className={currentSection === section.id ? 'active' : ''}
            data-testid={`nav-${section.id}`}
          >
            {section.title}
          </button>
        ))}
      </nav>
      
      <main className="dashboard-content" data-testid="dashboard-content">
        <div className="route-info" data-testid="route-info">
          Current Route: {location.pathname}
        </div>
        {renderSectionContent()}
      </main>
    </div>
  );
};

// MultiStepWizard Component - Integration testing for complex workflows
interface WizardStep {
  id: string;
  title: string;
  component: React.ComponentType;
  isValid: boolean;
}

export const MultiStepWizard: React.FC<{ steps: WizardStep[] }> = ({ steps }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isCompleted, setIsCompleted] = useState(false);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const canProceed = () => {
    return currentStep?.isValid || completedSteps.has(currentStepIndex);
  };

  const nextStep = () => {
    if (canProceed() && !isLastStep) {
      setCompletedSteps(prev => new Set([...prev, currentStepIndex]));
      setCurrentStepIndex(prev => prev + 1);
    } else if (isLastStep && canProceed()) {
      setCompletedSteps(prev => new Set([...prev, currentStepIndex]));
      setIsCompleted(true);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const jumpToStep = (stepIndex: number) => {
    if (stepIndex <= currentStepIndex || completedSteps.has(stepIndex - 1)) {
      setCurrentStepIndex(stepIndex);
    }
  };

  const resetWizard = () => {
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
    setIsCompleted(false);
  };

  if (isCompleted) {
    return (
      <div data-testid="multi-step-wizard" className="wizard-completed">
        <div className="completion-message" data-testid="completion-message">
          <h3>Wizard Completed Successfully!</h3>
          <p>All steps have been completed.</p>
        </div>
        
        <button 
          onClick={resetWizard}
          data-testid="reset-button"
          className="reset-btn"
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div data-testid="multi-step-wizard" className="wizard-container">
      <div className="wizard-header">
        <div className="progress-indicator" data-testid="progress-indicator">
          Step {currentStepIndex + 1} of {steps.length}
        </div>
        
        <div className="step-progress" data-testid="step-progress">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => jumpToStep(index)}
              disabled={index > currentStepIndex && !completedSteps.has(index - 1)}
              className={`step-indicator ${
                index === currentStepIndex ? 'current' : 
                completedSteps.has(index) ? 'completed' : 'pending'
              }`}
              data-testid={`step-${index}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
      
      <div className="wizard-content" data-testid="wizard-content">
        <h3 data-testid="step-title">{currentStep?.title}</h3>
        
        <div className="step-component" data-testid="step-component">
          {currentStep && <currentStep.component />}
        </div>
      </div>
      
      <div className="wizard-navigation" data-testid="wizard-navigation">
        <button
          onClick={prevStep}
          disabled={isFirstStep}
          data-testid="prev-button"
          className="nav-btn prev-btn"
        >
          Previous
        </button>
        
        <div className="step-status" data-testid="step-status">
          {canProceed() ? 'Ready to proceed' : 'Complete this step to continue'}
        </div>
        
        <button
          onClick={nextStep}
          disabled={!canProceed()}
          data-testid="next-button"
          className="nav-btn next-btn"
        >
          {isLastStep ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
};

// Main App Component for integration testing
export const IntegrationTestingApp: React.FC = () => {
  return (
    <Router>
      <UserProvider>
        <PaymentProvider>
          <div className="app">
            <nav data-testid="main-navigation">
              <a href="/workflow">User Workflow</a>
              <a href="/payment">Payment Flow</a>
              <a href="/dashboard">Dashboard</a>
              <a href="/wizard">Wizard</a>
            </nav>
            
            <Routes>
              <Route path="/workflow" element={<UserWorkflow />} />
              <Route path="/payment" element={<PaymentFlow />} />
              <Route path="/dashboard/*" element={<DashboardIntegration />} />
              <Route path="/wizard" element={
                <MultiStepWizard steps={[
                  { id: 'step1', title: 'Personal Information', component: () => <div>Step 1 Content</div>, isValid: true },
                  { id: 'step2', title: 'Preferences', component: () => <div>Step 2 Content</div>, isValid: false },
                  { id: 'step3', title: 'Review', component: () => <div>Step 3 Content</div>, isValid: false }
                ]} />
              } />
            </Routes>
          </div>
        </PaymentProvider>
      </UserProvider>
    </Router>
  );
};

// Custom hooks for testing integration
export const useWorkflowState = () => {
  const { user } = useUser();
  const location = useLocation();
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState<'login' | 'dashboard' | 'complete'>('login');

  const isAuthenticated = Boolean(user);
  const canProceed = isAuthenticated && location.pathname !== '/';
  
  const nextStep = () => {
    if (!isAuthenticated) {
      setCurrentWorkflowStep('login');
    } else if (location.pathname.includes('dashboard')) {
      setCurrentWorkflowStep('dashboard');
    } else {
      setCurrentWorkflowStep('complete');
    }
  };

  return {
    currentStep: currentWorkflowStep,
    isAuthenticated,
    canProceed,
    nextStep,
    user
  };
};

export const useIntegratedNavigation = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const navigateWithRoleCheck = (path: string) => {
    // Role-based navigation restrictions
    if (path.includes('admin') && user?.role !== 'admin') {
      throw new Error('Admin access required');
    }
    
    if (path.includes('dashboard') && !user) {
      navigate('/login');
      return;
    }

    navigate(path);
  };

  const canAccess = (path: string) => {
    if (path.includes('admin')) {
      return user?.role === 'admin';
    }
    
    if (path.includes('dashboard')) {
      return Boolean(user);
    }

    return true;
  };

  return {
    navigate: navigateWithRoleCheck,
    canAccess,
    currentPath: location.pathname,
    user,
    isAuthenticated: Boolean(user)
  };
};