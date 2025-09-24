# Design System with Lit

Build scalable design systems using Lit with comprehensive theming, design tokens, component libraries, and documentation systems.

## Learning Objectives

By completing this exercise, you will:

- Build scalable design systems with Lit and design tokens
- Implement comprehensive theming and token management
- Create component libraries with consistent design patterns
- Design documentation systems for component libraries
- Master component composition and variant patterns
- Integrate with modern design tooling and workflows

## Exercise Overview

You'll create a complete design system implementation featuring:

1. **Design Tokens**: Semantic color, typography, spacing, and animation tokens
2. **Theming System**: Multi-theme support with runtime switching and system preference detection
3. **Component Library**: Base components with variants, composition patterns, and accessibility
4. **Documentation System**: Automated documentation generation with interactive examples

## Key Concepts

### 1. Design Tokens

Design tokens are the visual design atoms of a design system:

```typescript
export const designTokens = {
  colors: {
    primitive: {
      blue: { 50: '#eff6ff', 500: '#3b82f6', 900: '#1e3a8a' }
    },
    semantic: {
      primary: 'var(--color-blue-500)',
      background: { primary: 'var(--color-white)' }
    }
  },
  typography: {
    fontFamily: { sans: 'Inter, system-ui, sans-serif' },
    fontSize: { base: '1rem', lg: '1.125rem' }
  },
  spacing: { sm: '0.5rem', md: '1rem', lg: '1.5rem' }
};
```

### 2. CSS Custom Properties

Generate CSS variables from design tokens:

```css
:root {
  --color-blue-500: #3b82f6;
  --color-primary: var(--color-blue-500);
  --typography-fontSize-base: 1rem;
  --spacing-md: 1rem;
}
```

### 3. Theme Management

```typescript
export class ThemeManager {
  setTheme(themeId: string): void {
    const theme = this.getTheme(themeId);
    this.applyTheme(theme);
    this.notifyListeners(theme);
  }
  
  detectSystemTheme(): string {
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  }
}
```

### 4. Base Component Architecture

```typescript
export abstract class BaseComponent extends LitElement {
  @property({ type: String, reflect: true }) 
  size: 'small' | 'medium' | 'large' = 'medium';
  
  @property({ type: Boolean, reflect: true }) 
  disabled = false;
  
  protected getBaseClasses() {
    return {
      'base-component': true,
      [`size-${this.size}`]: true,
      'disabled': this.disabled
    };
  }
}
```

## Implementation Requirements

### 1. Design Token System

Create a comprehensive token system with:

- **Primitive tokens**: Base colors, fonts, sizes
- **Semantic tokens**: Purpose-driven aliases (primary, secondary, success, error)
- **Component tokens**: Component-specific values
- **Token validation**: Contrast ratios, spacing scales
- **CSS generation**: Automated CSS custom property generation

### 2. Theme Management

Implement a theme manager with:

- **Multiple themes**: Light, dark, high-contrast
- **Runtime switching**: Change themes without page reload
- **System preference detection**: Auto-detect and respond to OS theme changes
- **Persistence**: Save user preferences in localStorage
- **Theme inheritance**: Themes can extend base themes

### 3. Component Library

Build a comprehensive component library including:

#### Button Component
- Variants: primary, secondary, outline, ghost
- Sizes: small, medium, large
- States: disabled, loading, focus, hover
- Accessibility: proper ARIA attributes and keyboard support

#### Input Component
- Types: text, email, password, number
- Validation: real-time validation with error display
- States: focused, error, disabled
- Accessibility: proper labeling and error announcements

#### Modal Component
- Backdrop handling: click-to-close configuration
- Focus management: trap focus within modal
- Keyboard support: Escape key to close
- Animation: enter/exit transitions

### 4. Documentation System

Create an automated documentation system with:

- **Component docs**: Auto-generated from decorators
- **Property documentation**: Types, defaults, descriptions
- **Event documentation**: Custom events with detail types
- **Interactive examples**: Live component previews
- **Storybook integration**: Generate Storybook stories
- **Markdown export**: Generate markdown documentation

## Design Token Structure

### Color System
```typescript
colors: {
  primitive: {
    blue: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 900: '#1e3a8a' },
    gray: { 50: '#f9fafb', 100: '#f3f4f6', 500: '#6b7280', 900: '#111827' }
  },
  semantic: {
    primary: 'var(--color-blue-500)',
    background: { primary: 'var(--color-white)', secondary: 'var(--color-gray-50)' },
    text: { primary: 'var(--color-gray-900)', secondary: 'var(--color-gray-600)' }
  }
}
```

### Typography System
```typescript
typography: {
  fontFamily: { sans: 'Inter, system-ui, sans-serif', mono: 'JetBrains Mono, monospace' },
  fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem' },
  lineHeight: { tight: '1.25', normal: '1.5', relaxed: '1.75' },
  fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' }
}
```

## Component Architecture Patterns

### Composition over Inheritance
```typescript
// Good: Composable behaviors
const withValidation = (BaseClass) => class extends BaseClass {
  validate() { /* validation logic */ }
};

const withAsyncState = (BaseClass) => class extends BaseClass {
  @state() loading = false;
};

// Usage
@customElement('form-input')
class FormInput extends withAsyncState(withValidation(BaseComponent)) {}
```

### Variant System
```typescript
static styles = css`
  /* Size variants */
  .size-small { padding: var(--spacing-xs) var(--spacing-sm); }
  .size-medium { padding: var(--spacing-sm) var(--spacing-md); }
  .size-large { padding: var(--spacing-md) var(--spacing-lg); }
  
  /* Color variants */
  .variant-primary { background: var(--color-primary); color: var(--color-primary-contrast); }
  .variant-secondary { background: var(--color-secondary); color: var(--color-secondary-contrast); }
`;
```

## Testing Requirements

Your implementation should include tests for:

1. **Token Generation**: CSS custom properties are generated correctly
2. **Theme Switching**: Themes apply and persist properly
3. **Component Variants**: All size and color variants render correctly
4. **Accessibility**: ARIA attributes, keyboard navigation, color contrast
5. **Documentation**: Auto-generated docs include all required information
6. **Performance**: Theme switching doesn't cause layout thrashing

## Documentation System Architecture

### Component Documentation Decorator
```typescript
@documentComponent({
  name: 'ds-button',
  description: 'A flexible button component with multiple variants',
  examples: [{
    title: 'Basic Usage',
    code: '<ds-button>Click me</ds-button>'
  }]
})
@customElement('ds-button')
class DSButton extends BaseComponent {}
```

### Automated Story Generation
```typescript
export function generateStorybookStories(componentName: string): string {
  const doc = ComponentDocRegistry.get(componentName);
  // Generate complete Storybook configuration
  return storybookTemplate;
}
```

## Accessibility Requirements

- **Color Contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text
- **Keyboard Navigation**: Full keyboard accessibility for all interactive components
- **Screen Reader Support**: Proper ARIA labels, roles, and descriptions
- **Focus Management**: Visible focus indicators and logical tab order
- **High Contrast Mode**: Support for Windows high contrast mode

## Integration Patterns

### Storybook Integration
```javascript
// .storybook/main.js
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-design-tokens'
  ]
};
```

### Design Tool Integration
- Figma token sync with Style Dictionary
- Sketch symbol library generation
- Adobe XD component exports
- InVision DSM integration

## Performance Optimizations

1. **CSS Custom Property Optimization**: Minimize repaints during theme changes
2. **Component Lazy Loading**: Load components only when needed
3. **Bundle Splitting**: Separate core from optional components
4. **Tree Shaking**: Ensure unused components can be eliminated

## Tips

1. **Use design tokens consistently** - Never hardcode values in components
2. **Implement proper contrast validation** for accessibility compliance
3. **Create comprehensive component variants** to avoid custom styling
4. **Generate automated documentation** to keep it in sync with code
5. **Integrate with Storybook** for interactive component development

## Common Pitfalls

- Not validating color contrast ratios in automated tests
- Hardcoding values instead of using design tokens
- Missing accessibility attributes in complex components
- Not handling theme changes gracefully (causing flashes or layout shifts)
- Forgetting to update documentation when components change

Complete the implementation to create a production-ready design system that serves as the foundation for scalable, maintainable component libraries across multiple frameworks and applications.