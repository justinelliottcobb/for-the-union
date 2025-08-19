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
  // TODO: Implement PaymentProvider state management
  // - Initialize state with step: 'billing', empty billingInfo, null paymentMethod
  // - Implement updateBillingInfo function
  // - Implement setPaymentMethod function  
  // - Implement nextStep function (billing -> payment -> confirmation)
  // - Implement prevStep function (confirmation -> payment -> billing)
  // - Implement processPayment function (simulate async payment processing)
  
  return (
    <PaymentContext.Provider value={{}}>
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
  // TODO: Implement UserWorkflow component
  // - Use useUser hook to get user state and actions
  // - Show login form when user is null
  // - Show user dashboard when user is logged in
  // - Include login, logout buttons
  // - Display user information (name, email, role)
  // - Handle form submission for login

  return (
    <div data-testid="user-workflow">
      {/* TODO: Implement user workflow UI */}
    </div>
  );
};

// PaymentFlow Component - Integration testing for multi-step payment process
export const PaymentFlow: React.FC = () => {
  // TODO: Implement PaymentFlow component
  // - Use usePayment hook to get payment state and actions
  // - Render different step components based on current step
  // - Include navigation buttons (Next, Previous, Submit)
  // - Handle form validation for each step
  // - Show loading state during payment processing
  // - Display success/error messages

  return (
    <div data-testid="payment-flow">
      {/* TODO: Implement payment flow UI */}
    </div>
  );
};

// DashboardIntegration Component - Integration testing with routing and context
export const DashboardIntegration: React.FC = () => {
  // TODO: Implement DashboardIntegration component
  // - Use useUser and useLocation hooks
  // - Show different content based on user role
  // - Include navigation to different dashboard sections
  // - Handle route changes and state updates
  // - Display role-specific content (admin vs user)

  return (
    <div data-testid="dashboard-integration">
      {/* TODO: Implement dashboard integration UI */}
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
  // TODO: Implement MultiStepWizard component
  // - Manage current step state
  // - Handle step navigation (next, previous, jump to step)
  // - Validate steps before allowing progression
  // - Show progress indicator
  // - Handle wizard completion
  // - Support step validation and error states

  return (
    <div data-testid="multi-step-wizard">
      {/* TODO: Implement multi-step wizard UI */}
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
              <Route path="/dashboard" element={<DashboardIntegration />} />
              <Route path="/wizard" element={
                <MultiStepWizard steps={[
                  { id: 'step1', title: 'Personal Info', component: () => <div>Step 1</div>, isValid: false },
                  { id: 'step2', title: 'Preferences', component: () => <div>Step 2</div>, isValid: false },
                  { id: 'step3', title: 'Review', component: () => <div>Step 3</div>, isValid: false }
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
  // TODO: Implement useWorkflowState hook
  // - Combine user state with workflow-specific state
  // - Handle workflow progression and validation
  // - Return workflow status and actions
  
  return {};
};

export const useIntegratedNavigation = () => {
  // TODO: Implement useIntegratedNavigation hook
  // - Combine React Router navigation with user context
  // - Handle role-based navigation restrictions
  // - Return navigation functions and current route info
  
  return {};
};