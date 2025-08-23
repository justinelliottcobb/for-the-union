# Integration Testing Patterns

**Difficulty**: ⭐⭐⭐⭐⭐ (90 minutes)

## Learning Objectives

By completing this exercise, you will master:

- **Component Integration Testing**: Testing components that work together through shared contexts and state
- **Provider Testing Strategies**: Testing React context providers and their integration with components  
- **Routing Integration Tests**: Testing components that depend on React Router and navigation state
- **Hook Composition Testing**: Testing custom hooks that integrate multiple React hooks and contexts
- **Multi-Component Workflows**: Testing complex user flows that span multiple components and state changes
- **State Management Integration**: Testing how components interact with global state through context providers

## Overview

Integration testing focuses on verifying that multiple components, hooks, and systems work correctly together. Unlike unit tests that isolate individual components, integration tests validate the interactions and data flow between different parts of your application.

This exercise covers advanced integration testing patterns using React Testing Library, including provider testing, routing integration, and complex multi-component workflows.

## Key Concepts

### 1. Component Integration Testing
```typescript
// Testing components that share state through context
test('user workflow integrates login and dashboard', async () => {
  render(
    <UserProvider>
      <UserWorkflow />
    </UserProvider>
  );
  
  // Test login flow
  await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
  await userEvent.click(screen.getByRole('button', { name: /login/i }));
  
  // Verify dashboard appears
  expect(screen.getByText(/welcome/i)).toBeInTheDocument();
});
```

### 2. Provider Testing Strategies
```typescript
// Testing context providers with multiple consumers
test('payment provider manages state across components', async () => {
  const TestComponent = () => {
    const { state, nextStep } = usePayment();
    return (
      <div>
        <span data-testid="step">{state.step}</span>
        <button onClick={nextStep}>Next</button>
      </div>
    );
  };

  render(
    <PaymentProvider>
      <TestComponent />
    </PaymentProvider>
  );
  
  expect(screen.getByTestId('step')).toHaveTextContent('billing');
  await userEvent.click(screen.getByRole('button', { name: /next/i }));
  expect(screen.getByTestId('step')).toHaveTextContent('payment');
});
```

### 3. Routing Integration Tests
```typescript
// Testing components that depend on routing
test('dashboard shows different content based on route', () => {
  render(
    <MemoryRouter initialEntries={['/dashboard/admin']}>
      <UserProvider>
        <DashboardIntegration />
      </UserProvider>
    </MemoryRouter>
  );
  
  expect(screen.getByText(/admin panel/i)).toBeInTheDocument();
});
```

### 4. Hook Composition Testing
```typescript
// Testing custom hooks that integrate multiple hooks
test('useWorkflowState combines user and navigation state', () => {
  const TestComponent = () => {
    const { currentStep, canProceed, nextStep } = useWorkflowState();
    return (
      <div>
        <span data-testid="step">{currentStep}</span>
        <button disabled={!canProceed} onClick={nextStep}>
          Next
        </button>
      </div>
    );
  };

  render(<TestComponent />);
  // Test hook behavior
});
```

## Your Tasks

### Task 1: Implement PaymentProvider Context
Complete the `PaymentProvider` component with full state management:

```typescript
export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with proper structure
  // Implement all required functions
  // Handle state transitions and validation
};
```

**Requirements:**
- Initialize state with `step: 'billing'`, empty billing info, null payment method
- Implement `updateBillingInfo` to update billing information
- Implement `setPaymentMethod` to set payment method selection
- Implement `nextStep` to progress through: billing → payment → confirmation
- Implement `prevStep` to go back through steps
- Implement `processPayment` as async function with simulation

### Task 2: Create UserWorkflow Component
Build a complete user authentication workflow component:

```typescript
export const UserWorkflow: React.FC = () => {
  // Use useUser hook for state management
  // Implement login/logout UI
  // Handle form submission and validation
};
```

**Requirements:**
- Show login form when user is null (email, password fields, login button)
- Show user dashboard when logged in (user info, logout button)
- Handle form submission with validation
- Display appropriate loading and error states
- Use proper accessibility attributes and test IDs

### Task 3: Build PaymentFlow Component
Create a multi-step payment process component:

```typescript
export const PaymentFlow: React.FC = () => {
  // Use usePayment hook for state management
  // Render step-specific UI based on current step
  // Handle navigation and validation
};
```

**Requirements:**
- **Billing Step**: Form with name, address, city fields and Next button
- **Payment Step**: Payment method selection (card/paypal) with Next/Previous buttons
- **Confirmation Step**: Summary display with Submit/Previous buttons
- Handle step validation (require all fields before proceeding)
- Show loading state during payment processing
- Display success/error messages after submission

### Task 4: Implement DashboardIntegration Component
Build a routing-integrated dashboard component:

```typescript
export const DashboardIntegration: React.FC = () => {
  // Use useUser and useLocation hooks
  // Show role-specific content
  // Handle navigation and route changes
};
```

**Requirements:**
- Display different content based on user role (admin vs user)
- Show navigation links to different dashboard sections
- Handle route changes and state updates
- Display current route information
- Include role-based access control

### Task 5: Create MultiStepWizard Component
Build a flexible multi-step wizard component:

```typescript
export const MultiStepWizard: React.FC<{ steps: WizardStep[] }> = ({ steps }) => {
  // Manage current step state and navigation
  // Handle step validation and progression
  // Show progress indicator and step content
};
```

**Requirements:**
- Track current step index and manage navigation
- Implement Next/Previous buttons with proper enablement
- Show progress indicator (step X of Y)
- Display current step title and component
- Validate steps before allowing progression
- Handle wizard completion when reaching final step

### Task 6: Implement Integration Hooks
Create custom hooks that integrate multiple React features:

```typescript
export const useWorkflowState = () => {
  // Combine user state with workflow-specific state
  // Handle workflow progression and validation
};

export const useIntegratedNavigation = () => {
  // Combine React Router with user context
  // Handle role-based navigation restrictions
};
```

**Requirements:**
- `useWorkflowState`: Return current workflow step, validation status, navigation functions
- `useIntegratedNavigation`: Return navigation functions, current route, role-based access info
- Handle edge cases and error states
- Provide clear TypeScript types for return values

## Integration Testing Best Practices

### 1. Provider Testing
```typescript
// Test context providers thoroughly
const renderWithProviders = (component: ReactElement) => {
  return render(
    <UserProvider>
      <PaymentProvider>
        <MemoryRouter>
          {component}
        </MemoryRouter>
      </PaymentProvider>
    </UserProvider>
  );
};
```

### 2. Multi-Component Flows
```typescript
// Test complete user flows across components
test('complete payment flow integration', async () => {
  renderWithProviders(<PaymentFlow />);
  
  // Fill billing info
  await userEvent.type(screen.getByLabelText(/name/i), 'John Doe');
  await userEvent.click(screen.getByRole('button', { name: /next/i }));
  
  // Select payment method
  await userEvent.click(screen.getByLabelText(/card/i));
  await userEvent.click(screen.getByRole('button', { name: /next/i }));
  
  // Submit payment
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(await screen.findByText(/payment successful/i)).toBeInTheDocument();
});
```

### 3. State Integration Testing
```typescript
// Test state changes across multiple components
test('user state integrates with dashboard routing', async () => {
  const mockUser = { id: '1', name: 'John', email: 'john@test.com', role: 'admin' };
  
  render(
    <UserProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardIntegration />} />
        </Routes>
      </MemoryRouter>
    </UserProvider>
  );
  
  // Login user and verify dashboard updates
  // Test role-based content display
});
```

## Testing Tools and Utilities

### Required Testing Dependencies
- `@testing-library/react` - Component testing utilities
- `@testing-library/user-event` - User interaction simulation
- `@testing-library/react-hooks` - Hook testing utilities  
- `react-router-dom` - Routing for integration tests

### Useful Testing Patterns
- **Provider wrapper functions** for consistent test setup
- **Custom render functions** with pre-configured providers
- **Mock implementations** for external dependencies
- **Async testing utilities** for asynchronous state changes

## Success Criteria

Your implementation should:

✅ **Context Integration**: All context providers manage state correctly and integrate with components  
✅ **Multi-Component Flows**: User workflows span multiple components with shared state  
✅ **Routing Integration**: Components respond appropriately to route changes and navigation  
✅ **Hook Composition**: Custom hooks properly integrate multiple React features  
✅ **State Synchronization**: State changes propagate correctly across integrated components  
✅ **Error Handling**: Proper error boundaries and validation throughout workflows  
✅ **Accessibility**: All components use proper ARIA attributes and keyboard navigation  
✅ **TypeScript**: Full type safety with proper interfaces and error handling

## Advanced Challenges

1. **Real-time Integration**: Add WebSocket integration for real-time state updates
2. **Optimistic Updates**: Implement optimistic UI updates with rollback on failure  
3. **Cross-Tab Sync**: Synchronize state across browser tabs using localStorage events
4. **Performance Integration**: Add performance monitoring for complex workflows
5. **Error Recovery**: Implement comprehensive error recovery for failed integrations

## Integration Testing Resources

- [React Testing Library Integration Testing](https://testing-library.com/docs/example-react-integ/)
- [Testing React Context](https://kentcdodds.com/blog/how-to-test-custom-react-hooks)
- [React Router Testing](https://reactrouter.com/en/main/start/testing)
- [Testing Patterns for Integration](https://martinfowler.com/bliki/IntegrationTest.html)

Integration testing ensures your React applications work seamlessly as complete systems rather than isolated components! 🔧