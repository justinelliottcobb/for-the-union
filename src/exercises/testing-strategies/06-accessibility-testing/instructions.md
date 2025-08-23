# Accessibility Testing and WCAG Compliance

**Difficulty**: ⭐⭐⭐⭐ (75 minutes)

## Learning Objectives

By completing this exercise, you will master:

- **WCAG 2.1 Compliance**: Understanding and implementing Web Content Accessibility Guidelines
- **Automated Accessibility Testing**: Using tools like axe-core, jest-axe, and pa11y for automated testing
- **Screen Reader Testing**: Ensuring applications work correctly with assistive technologies
- **Keyboard Navigation**: Implementing and testing comprehensive keyboard accessibility
- **Focus Management**: Proper focus handling in dynamic interfaces like modals and forms
- **Color and Contrast**: Ensuring visual accessibility for users with visual impairments
- **ARIA Implementation**: Proper use of ARIA roles, properties, and states

## Overview

Accessibility testing ensures that web applications are usable by everyone, including users with disabilities. This exercise focuses on implementing comprehensive accessibility features and testing them using automated tools and manual testing strategies.

You'll learn to create accessible forms, navigation menus, data visualizations, and modal systems while ensuring WCAG 2.1 AA compliance.

## Key Concepts

### 1. WCAG 2.1 Principles (POUR)
- **Perceivable**: Information must be presentable in ways users can perceive
- **Operable**: Interface components must be operable by all users  
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must be robust enough for various assistive technologies

### 2. Automated Accessibility Testing
```typescript
// jest-axe integration
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<FormValidation />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 3. ARIA Best Practices
```typescript
// Proper ARIA implementation
<form role="form" aria-labelledby="form-title">
  <h2 id="form-title">Contact Form</h2>
  
  <div className="form-group">
    <label htmlFor="email">Email Address *</label>
    <input
      id="email"
      type="email"
      required
      aria-describedby="email-error email-help"
      aria-invalid={hasError ? 'true' : 'false'}
    />
    <div id="email-help">We'll never share your email</div>
    {hasError && (
      <div id="email-error" role="alert">
        Please enter a valid email address
      </div>
    )}
  </div>
</form>
```

### 4. Focus Management
```typescript
// Focus trap implementation
const useFocusTrap = (isActive: boolean) => {
  const focusTrapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isActive || !focusTrapRef.current) return;
    
    const focusableElements = focusTrapRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();
    
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isActive]);
  
  return { focusTrapRef };
};
```

## Your Tasks

### Task 1: Implement FormValidation Component
Create an accessible form with comprehensive validation:

```typescript
export const FormValidation: React.FC = () => {
  // Implement accessible form with validation
};
```

**Requirements:**
- **Form Structure**: Use proper form elements with labels and fieldsets
- **ARIA Attributes**: Include `role`, `aria-labelledby`, `aria-describedby`, `aria-invalid`
- **Error Handling**: Live error announcements with `role="alert"`
- **Required Fields**: Visual and programmatic indication of required fields
- **Keyboard Navigation**: Full keyboard accessibility with logical tab order
- **Focus Management**: Focus first error field on validation failure
- **Screen Reader Support**: Proper announcements for form state changes

### Task 2: Create NavigationMenu Component
Build a fully accessible navigation menu:

```typescript
export const NavigationMenu: React.FC = () => {
  // Implement accessible navigation with ARIA menu pattern
};
```

**Requirements:**
- **ARIA Roles**: Use `role="menubar"`, `role="menu"`, `role="menuitem"`
- **Keyboard Navigation**: Arrow keys, Home, End, Enter, Escape support
- **Focus Management**: Visual focus indicators and logical focus flow
- **Screen Reader Support**: Proper menu structure announcements
- **Skip Links**: Skip to main content functionality
- **Heading Hierarchy**: Proper use of heading levels (h1, h2, h3, etc.)
- **Submenu Support**: Expandable submenus with proper ARIA states

### Task 3: Build DataVisualization Component
Create accessible charts and data displays:

```typescript
export const DataVisualization: React.FC = () => {
  // Implement accessible data visualization
};
```

**Requirements:**
- **Alternative Formats**: Provide data table alternative to visual charts
- **ARIA Labels**: Descriptive labels for chart elements and data points
- **Color Independence**: Don't rely solely on color to convey information
- **Keyboard Navigation**: Navigate through data points using keyboard
- **Screen Reader Descriptions**: Comprehensive descriptions of chart data
- **High Contrast Support**: Ensure visibility in high contrast mode
- **Data Summaries**: Provide textual summaries of key insights

### Task 4: Implement ModalSystem Component
Build accessible modal dialogs:

```typescript
export const ModalSystem: React.FC = () => {
  // Implement accessible modal system
};
```

**Requirements:**
- **ARIA Attributes**: Use `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- **Focus Trapping**: Keep focus within modal while open
- **Focus Return**: Return focus to trigger element when closed
- **Keyboard Controls**: ESC to close, Tab navigation within modal
- **Screen Reader Announcements**: Announce modal opening/closing
- **Backdrop Interaction**: Handle backdrop clicks appropriately
- **Content Structure**: Proper heading hierarchy within modals

### Task 5: Implement Accessibility Utility Hooks
Create hooks that support accessibility patterns:

```typescript
export const useAccessibleForm = (fields: FormField[]) => {
  // Form accessibility management
};

export const useFocusTrap = (isActive: boolean) => {
  // Focus trapping functionality
};

export const useAnnouncement = () => {
  // Screen reader announcements
};
```

**Requirements:**
- `useAccessibleForm`: Form state, validation, error focus, ARIA management
- `useFocusTrap`: Tab trapping, focus cycling, cleanup
- `useAnnouncement`: Live regions, announcement queue, politeness levels

### Task 6: Create Accessibility Testing Utilities
Build functions for testing accessibility:

```typescript
export const getAccessibilityViolations = (element: HTMLElement) => {
  // Detect common accessibility issues
};

export const simulateScreenReader = (element: HTMLElement) => {
  // Extract screen reader announcements
};

export const checkKeyboardNavigation = (element: HTMLElement) => {
  // Validate keyboard accessibility
};
```

**Requirements:**
- `getAccessibilityViolations`: Check alt text, headings, ARIA, contrast
- `simulateScreenReader`: Extract accessible names and descriptions
- `checkKeyboardNavigation`: Verify focusable elements and tab order

## Accessibility Testing Best Practices

### 1. Automated Testing Setup
```typescript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironment: 'jsdom'
};

// setupTests.ts
import 'jest-axe/extend-expect';
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
```

### 2. Comprehensive Test Coverage
```typescript
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import userEvent from '@testing-library/user-event';

test('form has no accessibility violations', async () => {
  const { container } = render(<FormValidation />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('keyboard navigation works correctly', async () => {
  const user = userEvent.setup();
  render(<NavigationMenu />);
  
  // Test tab navigation
  await user.tab();
  expect(screen.getByRole('menuitem', { name: 'Home' })).toHaveFocus();
  
  // Test arrow key navigation
  await user.keyboard('{ArrowRight}');
  expect(screen.getByRole('menuitem', { name: 'About' })).toHaveFocus();
});

test('screen reader announcements work', async () => {
  const { container } = render(<FormValidation />);
  
  // Trigger validation error
  const submitButton = screen.getByRole('button', { name: 'Submit' });
  await userEvent.click(submitButton);
  
  // Check for live region announcement
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent('Please fix the errors below');
});
```

### 3. Manual Testing Checklist
```typescript
// Manual accessibility testing checklist
const accessibilityChecklist = {
  keyboard: {
    'All interactive elements focusable': false,
    'Logical tab order': false,
    'Visible focus indicators': false,
    'Keyboard shortcuts work': false,
    'No keyboard traps': false
  },
  screenReader: {
    'Meaningful headings': false,
    'Descriptive link text': false,
    'Form labels associated': false,
    'Error messages announced': false,
    'Page landmarks identified': false
  },
  visual: {
    'Sufficient color contrast': false,
    'Information not color-only': false,
    'Scalable to 200% zoom': false,
    'Responsive design works': false
  }
};
```

## WCAG 2.1 AA Compliance Requirements

### Level A Requirements
- **1.1.1 Non-text Content**: Alt text for images
- **1.3.1 Info and Relationships**: Proper semantic structure
- **2.1.1 Keyboard**: All functionality via keyboard
- **4.1.2 Name, Role, Value**: Proper ARIA implementation

### Level AA Requirements  
- **1.4.3 Contrast (Minimum)**: 4.5:1 contrast ratio for normal text
- **1.4.11 Non-text Contrast**: 3:1 contrast for UI components
- **2.4.6 Headings and Labels**: Descriptive headings and labels
- **3.2.3 Consistent Navigation**: Consistent navigation order

## Testing Tools and Commands

### Automated Testing Tools
```bash
# Install accessibility testing dependencies
npm install --save-dev jest-axe @testing-library/jest-dom

# Run accessibility tests
npm test -- --testNamePattern="accessibility"

# Generate accessibility report
npx pa11y http://localhost:3000

# Lighthouse accessibility audit
npx lighthouse http://localhost:3000 --only-categories=accessibility
```

### Browser Extensions for Testing
- **axe DevTools**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation  
- **Lighthouse**: Built-in Chrome accessibility audit
- **Color Oracle**: Color blindness simulator

## Success Criteria

Your implementation should:

✅ **WCAG 2.1 AA Compliance**: Meet all Level A and AA success criteria  
✅ **Automated Testing**: Pass axe-core accessibility tests without violations  
✅ **Keyboard Navigation**: Full keyboard accessibility with logical tab order  
✅ **Screen Reader Support**: Proper ARIA implementation and announcements  
✅ **Focus Management**: Appropriate focus handling in dynamic content  
✅ **Color Accessibility**: Sufficient contrast and color-independent design  
✅ **Form Accessibility**: Proper labels, validation, and error handling  
✅ **Modal Accessibility**: Focus trapping and proper modal behavior

## Advanced Accessibility Challenges

1. **Custom Components**: Create accessible custom controls (date picker, autocomplete)
2. **Dynamic Content**: Handle live regions and content updates
3. **Complex Interactions**: Implement accessible drag-and-drop or sortable lists
4. **Mobile Accessibility**: Ensure touch accessibility and screen reader support
5. **Performance Impact**: Optimize accessibility without affecting performance

## Accessibility Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Accessibility Testing](https://webaim.org/articles/testing/)
- [axe-core Documentation](https://www.deque.com/axe/axe-for-web/)
- [Testing Library Accessibility Testing](https://testing-library.com/docs/guide-accessibility-testing/)

Building accessible applications ensures that everyone can use your software effectively! ♿️