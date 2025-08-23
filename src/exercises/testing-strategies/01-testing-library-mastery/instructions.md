# Testing Library Mastery

**Difficulty**: ⭐⭐⭐⭐ (75 minutes)

## Learning Objectives

By completing this exercise, you will master:

- **Advanced React Testing Library patterns** used by Staff Frontend Engineers
- **User-centric testing approaches** that focus on behavior over implementation
- **Accessibility testing integration** with proper ARIA attributes and screen reader support
- **Async testing patterns** for complex loading states and error handling
- **Custom queries and utilities** for domain-specific testing scenarios
- **Testing complex user interactions** with forms, tables, and interactive components

## Overview

This exercise focuses on sophisticated testing patterns that senior engineers use to ensure code quality at scale in production React applications. You'll learn to write tests that prioritize user experience and accessibility while maintaining robust coverage of complex scenarios.

## What You'll Build

You'll implement and test four comprehensive components that demonstrate advanced testing patterns:

1. **ComplexForm** - Multi-field form with validation, async submission, and accessibility
2. **DataTable** - Sortable, filterable table with pagination and user interactions
3. **InteractiveChart** - Data visualization with zoom, selection, and keyboard navigation
4. **AsyncComponent** - Component with loading states, error handling, and retry logic

## Key Concepts

### User-Centric Testing Philosophy

React Testing Library emphasizes testing components the way users interact with them:

```typescript
// ❌ Testing implementation details
expect(wrapper.state('isLoading')).toBe(true);

// ✅ Testing user-observable behavior
expect(screen.getByText('Loading...')).toBeInTheDocument();
```

### Accessibility-First Testing

Always include accessibility testing as part of your test suite:

```typescript
// Test ARIA attributes
expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');

// Test screen reader announcements
expect(screen.getByRole('alert')).toHaveTextContent('Form submitted successfully');

// Test keyboard navigation
await user.tab();
expect(screen.getByRole('button')).toHaveFocus();
```

### Async Testing Patterns

Handle loading states, API calls, and user interactions properly:

```typescript
// Wait for loading to complete
await waitFor(() => {
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
});

// Test error states with retry logic
fireEvent.click(screen.getByTestId('retry-button'));
await waitFor(() => {
  expect(screen.getByTestId('async-success')).toBeInTheDocument();
});
```

## Implementation Steps

### Step 1: ComplexForm Component
1. Set up form state management with TypeScript interfaces
2. Implement field validation with clear error messages
3. Add proper ARIA attributes for accessibility
4. Handle async form submission with loading states
5. Provide user feedback for success/error scenarios

### Step 2: DataTable Component
1. Create sortable column headers with visual indicators
2. Implement search/filter functionality across all fields
3. Add pagination with proper controls and information
4. Handle loading and empty states gracefully
5. Ensure table accessibility with proper ARIA roles

### Step 3: InteractiveChart Component
1. Create clickable data points with selection state
2. Add hover tooltips with positioning logic
3. Implement zoom controls with boundaries
4. Add keyboard navigation support
5. Provide screen reader announcements for interactions

### Step 4: AsyncComponent
1. Manage loading, success, and error states
2. Implement retry logic with counting and limits
3. Handle different error scenarios appropriately
4. Provide clear user feedback during operations
5. Add reset functionality for error recovery

### Step 5: Testing Utilities
1. Create custom render function with necessary providers
2. Build domain-specific query helpers
3. Implement common interaction test helpers
4. Add utilities for async state testing

## Testing Best Practices

### 1. Test User Behavior, Not Implementation
```typescript
// ❌ Don't test internal state
expect(component.state('count')).toBe(5);

// ✅ Test what users see
expect(screen.getByText('Count: 5')).toBeInTheDocument();
```

### 2. Use Proper Queries
```typescript
// Preferred query order:
// 1. getByRole (most accessible)
expect(screen.getByRole('button', { name: 'Submit' }));

// 2. getByLabelText (forms)
expect(screen.getByLabelText('Email Address'));

// 3. getByText (content)
expect(screen.getByText('Welcome!'));

// 4. getByTestId (last resort)
expect(screen.getByTestId('complex-component'));
```

### 3. Handle Async Operations Properly
```typescript
// Wait for elements to appear
await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});

// Wait for elements to disappear
await waitFor(() => {
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
});
```

## Completion Criteria

Your implementation should:

✅ **Form Component**
- [ ] All form fields with proper validation
- [ ] Real-time error clearing when user types
- [ ] Proper ARIA attributes for accessibility
- [ ] Loading state during submission
- [ ] Success message after completion

✅ **Data Table Component**
- [ ] Search functionality across all fields
- [ ] Column sorting with visual indicators
- [ ] Pagination with proper controls
- [ ] Loading and empty states
- [ ] Accessible table structure

✅ **Interactive Chart Component**
- [ ] Clickable data points with selection
- [ ] Hover tooltips with proper positioning
- [ ] Zoom controls with boundaries
- [ ] Keyboard navigation support
- [ ] Screen reader announcements

✅ **Async Component**
- [ ] Loading, success, and error states
- [ ] Retry mechanism with counting
- [ ] Clear error handling
- [ ] Reset functionality
- [ ] Proper user feedback

## Tools and Libraries

This exercise uses these testing tools:

- **@testing-library/react** - Core testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers
- **@testing-library/user-event** - User interaction simulation
- **Jest** - Test runner and assertion library

Remember: Write tests that give you confidence in your component's behavior from a user's perspective, not just code coverage metrics!