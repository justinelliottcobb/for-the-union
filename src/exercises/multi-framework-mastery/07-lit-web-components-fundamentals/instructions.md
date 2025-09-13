# Lit Web Components Fundamentals

Master Lit and Web Components development patterns for building framework-agnostic, reusable components with modern web standards.

## Learning Objectives

By completing this exercise, you will:

- Master Lit custom element development with TypeScript decorators
- Implement shadow DOM encapsulation and styling strategies
- Build template management systems with reactive properties
- Create lifecycle management for Web Components
- Design property binding and event handling patterns
- Understand Web Components standards and browser compatibility

## Exercise Overview

You'll implement a comprehensive Lit component system that demonstrates:

1. **Custom Element Creation**: Use `@customElement` decorator and extend LitElement
2. **Shadow DOM Encapsulation**: Implement proper style isolation and slot composition
3. **Lifecycle Management**: Handle connection, disconnection, and cleanup properly
4. **Reactive Properties**: Build complex form components with validation and state management

## Key Concepts

### 1. Lit Custom Elements

```typescript
import { LitElement, html, css, customElement, property } from 'lit';

@customElement('user-card')
export class UserCard extends LitElement {
  @property({ type: String }) name = '';
  @property({ type: Boolean }) online = false;

  static styles = css`
    :host {
      display: block;
      border-radius: 8px;
    }
  `;

  render() {
    return html`
      <div class="user-info">
        <h3>${this.name}</h3>
        <span class="${this.online ? 'online' : 'offline'}"></span>
      </div>
    `;
  }
}
```

### 2. Shadow DOM and Encapsulation

- **Style Isolation**: Styles are completely encapsulated within shadow DOM
- **Slot Composition**: Use `<slot>` elements for content projection
- **CSS Custom Properties**: Enable theming through CSS variables
- **Event Delegation**: Proper event handling with composed events

### 3. Property System

```typescript
// Different property configurations
@property({ type: String }) message = '';
@property({ type: Number }) count = 0;
@property({ type: Boolean, reflect: true }) active = false;
@property({ 
  type: Object,
  hasChanged: (newVal, oldVal) => JSON.stringify(newVal) !== JSON.stringify(oldVal)
}) data = {};
```

### 4. Lifecycle Methods

- `connectedCallback()`: Element added to DOM
- `disconnectedCallback()`: Element removed from DOM
- `updated()`: After properties change and re-render
- `firstUpdated()`: After first render
- `shouldUpdate()`: Control whether re-render is needed

## Implementation Requirements

### 1. UserCard Component
Create a user card component with:
- Name, email, avatar properties
- Online status indicator
- Click events for interaction
- Proper TypeScript typing

### 2. Modal Dialog Component
Build a modal with:
- Backdrop click handling
- Escape key support
- Focus management and trapping
- Slot-based content projection

### 3. Data Fetcher Component
Implement a data fetching component with:
- Abort controller for request cancellation
- Retry logic with exponential backoff
- Performance monitoring
- Proper cleanup in disconnectedCallback

### 4. Reactive Form Component
Create a complex form with:
- Multiple input types (text, email, select, checkbox)
- Real-time validation
- State management with `@state`
- Custom event emission
- Accessibility features

## Testing Requirements

Your implementation should pass tests for:

1. **Component Creation**: Elements render correctly
2. **Property Binding**: Properties update and reflect changes
3. **Event Handling**: Custom events are emitted properly
4. **Lifecycle Management**: Proper setup and cleanup
5. **Accessibility**: ARIA attributes and keyboard navigation
6. **Performance**: Render times under 16ms for 60fps

## Styling Guidelines

Use CSS-in-JS with the `css` template literal:

```typescript
static styles = css`
  :host {
    display: block;
    --primary-color: #3b82f6;
  }
  
  .button {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
  }
`;
```

## Browser Compatibility

Ensure compatibility with:
- Modern browsers with native Web Components support
- Polyfills for older browsers if needed
- Progressive enhancement patterns
- Proper feature detection

## Performance Considerations

- Minimize re-renders with `shouldUpdate()`
- Use `@state()` for internal state that doesn't need reflection
- Implement proper event listener cleanup
- Monitor performance with custom metrics

## Accessibility Requirements

- Proper ARIA attributes and roles
- Keyboard navigation support
- Focus management for complex components
- Screen reader compatibility
- Color contrast compliance

## Tips

1. **Use TypeScript generics** for type-safe property definitions
2. **Implement proper cleanup** in lifecycle handlers to prevent memory leaks
3. **Design components for maximum reusability** across different contexts
4. **Monitor reactivity performance** with custom metrics and performance observers
5. **Test components in isolation** from other components to ensure encapsulation

## Common Pitfalls

- Forgetting to call `super.connectedCallback()` in lifecycle methods
- Not properly cleaning up event listeners in `disconnectedCallback()`
- Using incorrect property types or change detection
- Missing `composed: true` for events that need to cross shadow boundaries
- Not handling edge cases in property validation

Complete the implementation following these guidelines to create robust, reusable Lit components that work seamlessly across different environments and frameworks.