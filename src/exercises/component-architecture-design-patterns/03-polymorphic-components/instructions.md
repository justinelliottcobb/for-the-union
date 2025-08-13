# Polymorphic Components with TypeScript

## Overview

Master polymorphic component design - a critical pattern for enterprise design systems. Learn to build components that can render as different HTML elements while maintaining type safety, prop inference, and consistent styling APIs.

## Learning Objectives

By completing this exercise, you will:

- **Understand Polymorphic Components**: Learn the core concepts and enterprise use cases
- **Master TypeScript Constraints**: Implement complex generic constraints and prop inference
- **Build Design System Foundations**: Create flexible, reusable component APIs
- **Handle Component Prop Inference**: Ensure type safety across different element types
- **Implement Advanced Patterns**: Forward refs, conditional rendering, and validation
- **Apply Enterprise Architecture**: Design patterns used in production design systems

## Key Concepts

### 1. Polymorphic Component Definition

A polymorphic component can render as different HTML elements while maintaining its core functionality:

```tsx
// Same component, different elements
<Box as="div">Renders as div</Box>
<Box as="section">Renders as section</Box>
<Box as="article">Renders as article</Box>

// All with the same styling API
<Box p={4} bg="primary" rounded="md" as="header">
  Header Box
</Box>
```

### 2. TypeScript Polymorphic Types

Essential type utilities for polymorphic components:

```tsx
type AsProp<C extends ElementType> = {
  as?: C;
};

type PropsToOmit<C extends ElementType, P> = keyof (AsProp<C> & P);

type PolymorphicComponentProp<
  C extends ElementType,
  Props = {}
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

type PolymorphicRef<C extends ElementType> = ComponentRef<C>;

type PolymorphicComponentPropWithRef<
  C extends ElementType,
  Props = {}
> = PolymorphicComponentProp<C, Props> & { ref?: PolymorphicRef<C> };
```

### 3. Forward Ref Integration

Proper ref forwarding for polymorphic components:

```tsx
function BoxComponent<C extends ElementType = 'div'>(
  props: BoxProps<C>,
  ref?: PolymorphicRef<C>
) {
  const Component = props.as || 'div';
  return <Component ref={ref} {...props} />;
}

const Box = forwardRef(BoxComponent) as <C extends ElementType = 'div'>(
  props: BoxProps<C>
) => ReactElement | null;
```

## Implementation Tasks

### Task 1: Box Polymorphic Component (25 minutes)

Build a foundational Box component for design systems:

**Core Features:**
- Polymorphic `as` prop for any HTML element
- Design system spacing (padding, margin)
- Color system (text, background)
- Visual properties (border, shadow, rounded)
- Size variants and responsive design

**Key Implementation:**
```tsx
interface BoxOwnProps {
  color?: ColorScale;
  bg?: ColorScale;
  p?: SpacingScale;
  px?: SpacingScale;
  py?: SpacingScale;
  // ... other spacing props
  size?: SizeScale;
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'full';
  shadow?: boolean | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean | ColorScale;
}

type BoxProps<C extends ElementType> = PolymorphicComponentPropWithRef<C, BoxOwnProps>;

function BoxComponent<C extends ElementType = 'div'>(
  { as, color, bg, p, px, py, /* ... */, className, ...rest }: BoxProps<C>,
  ref?: PolymorphicRef<C>
) {
  const Component = as || 'div';
  
  // Generate className from design system props
  const classes = generateClasses({
    color: getColorClass('text', color),
    background: getColorClass('bg', bg),
    padding: getSpacingClass('p', p),
    // ... other style generators
  });

  return (
    <Component ref={ref} className={classes} {...rest}>
      {children}
    </Component>
  );
}
```

**Design System Integration:**
- Implement spacing scale (0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24)
- Color scale (primary, secondary, success, warning, error, neutral)
- Size scale (xs, sm, md, lg, xl)
- Consistent class generation utilities

### Task 2: Button Polymorphic Component (20 minutes)

Create an advanced Button component with variants:

**Variant System:**
```tsx
interface ButtonOwnProps {
  variant?: 'solid' | 'outline' | 'ghost' | 'link';
  size?: SizeScale;
  color?: ColorScale;
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Usage examples
<Button variant="solid" color="primary">Solid Button</Button>
<Button as="a" href="/link" variant="outline">Link Button</Button>
<Button as="div" onClick={handler} variant="ghost">Div Button</Button>
```

**Advanced Features:**
- Loading states with spinner
- Icon support with proper spacing
- Disabled state handling
- Size-responsive padding and typography
- Variant-specific styling logic

**Implementation Pattern:**
```tsx
function ButtonComponent<C extends ElementType = 'button'>(
  { as, variant = 'solid', size = 'md', isLoading, leftIcon, rightIcon, ...rest }: ButtonProps<C>,
  ref?: PolymorphicRef<C>
) {
  const Component = as || 'button';
  
  const classes = combineClasses([
    getVariantClasses(variant, color),
    getSizeClasses(size),
    getStateClasses(isLoading, isDisabled),
  ]);

  return (
    <Component ref={ref} className={classes} disabled={isDisabled || isLoading} {...rest}>
      {isLoading && <Spinner />}
      {!isLoading && leftIcon && <IconWrapper>{leftIcon}</IconWrapper>}
      {children}
      {!isLoading && rightIcon && <IconWrapper>{rightIcon}</IconWrapper>}
    </Component>
  );
}
```

### Task 3: Generic List Component (25 minutes)

Build a generic, polymorphic List component:

**Generic Implementation:**
```tsx
interface ListOwnProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  emptyMessage?: ReactNode;
  isLoading?: boolean;
  variant?: 'default' | 'divided' | 'bordered' | 'card';
  size?: SizeScale;
}

type ListProps<C extends ElementType, T> = PolymorphicComponentPropWithRef<C, ListOwnProps<T>>;

function ListComponent<C extends ElementType = 'ul', T = any>(
  { as, items, renderItem, keyExtractor, variant, ...rest }: ListProps<C, T>,
  ref?: PolymorphicRef<C>
) {
  const Component = as || 'ul';
  
  // Handle loading and empty states
  if (isLoading) return <LoadingState />;
  if (items.length === 0) return <EmptyState />;

  return (
    <Component ref={ref} className={getVariantClasses(variant)} {...rest}>
      {items.map((item, index) => (
        <li key={keyExtractor(item, index)} className={getItemClasses(variant)}>
          {renderItem(item, index)}
        </li>
      ))}
    </Component>
  );
}
```

**Type Safety Features:**
- Generic `T` type for items array
- Type-safe `renderItem` function
- Proper key extraction with fallback
- Variant-specific styling

### Task 4: Advanced Polymorphic Patterns (20 minutes)

Implement enterprise-level patterns:

**1. Polymorphic Link Component:**
```tsx
function createPolymorphicLink<RouterLinkComponent extends ElementType>(
  RouterLink?: RouterLinkComponent
) {
  function LinkComponent<C extends ElementType = 'a'>(
    { as, href, to, external, download, ...rest }: LinkProps<C>,
    ref?: PolymorphicRef<C>
  ) {
    // Smart routing logic
    if (external || href?.startsWith('http') || download) {
      return <a ref={ref} href={href} target="_blank" {...rest} />;
    }
    
    if (to && RouterLink) {
      const Component = as || RouterLink;
      return <Component ref={ref} to={to} {...rest} />;
    }

    return <a ref={ref} href={href || to} {...rest} />;
  }

  return forwardRef(LinkComponent);
}

// Usage with different routers
const Link = createPolymorphicLink(ReactRouterLink);
const NextLink = createPolymorphicLink(NextRouterLink);
```

**2. Validation Utilities:**
```tsx
function validatePolymorphicProps<T extends Record<string, any>>(
  props: T,
  component: string
): string[] {
  const warnings: string[] = [];
  
  // Check for conflicting props
  if (props.href && props.to) {
    warnings.push(`${component}: Cannot use both 'href' and 'to' props`);
  }
  
  // Validate 'as' prop usage
  if (props.as && !isValidElementType(props.as)) {
    warnings.push(`${component}: Invalid 'as' prop value`);
  }
  
  return warnings;
}
```

**3. Testing Utilities:**
```tsx
function createPolymorphicTestUtils<C extends ElementType>(
  Component: React.ComponentType<any>
) {
  return {
    testAsProps: (asPropValues: C[]) => {
      // Test component with different 'as' values
      asPropValues.forEach(as => {
        render(<Component as={as} />);
        // Verify correct element type
      });
    },
    
    testRefForwarding: () => {
      const ref = createRef();
      render(<Component ref={ref} />);
      expect(ref.current).toBeTruthy();
    },
    
    testPropInheritance: () => {
      const props = { 'data-testid': 'test', className: 'test-class' };
      const { getByTestId } = render(<Component {...props} />);
      expect(getByTestId('test')).toHaveClass('test-class');
    },
  };
}
```

## Advanced TypeScript Patterns

### 1. Conditional Props Based on Element Type

```tsx
type ConditionalProps<C extends ElementType> = 
  C extends 'a' ? { href?: string } :
  C extends 'button' ? { type?: 'button' | 'submit' | 'reset' } :
  C extends 'input' ? { type?: string; placeholder?: string } :
  {};

type SmartComponentProps<C extends ElementType> = 
  PolymorphicComponentProp<C, BaseProps> & ConditionalProps<C>;
```

### 2. Design System Token Integration

```tsx
interface DesignSystemProps {
  // Spacing tokens
  p?: keyof typeof spacingTokens;
  m?: keyof typeof spacingTokens;
  
  // Color tokens  
  color?: keyof typeof colorTokens;
  bg?: keyof typeof colorTokens;
  
  // Typography tokens
  fontSize?: keyof typeof typographyTokens;
  fontWeight?: keyof typeof fontWeightTokens;
}

const spacingTokens = {
  0: '0px',
  1: '4px', 
  2: '8px',
  // ... design system values
} as const;
```

### 3. Runtime Type Checking

```tsx
function isValidElementType(component: any): component is ElementType {
  return (
    typeof component === 'string' ||
    typeof component === 'function' ||
    (typeof component === 'object' && component?.$$typeof)
  );
}

function withRuntimeValidation<P extends Record<string, any>>(
  Component: React.ComponentType<P>
) {
  return function ValidatedComponent(props: P) {
    const warnings = validatePolymorphicProps(props, Component.displayName || 'Component');
    
    if (process.env.NODE_ENV === 'development' && warnings.length > 0) {
      warnings.forEach(warning => console.warn(warning));
    }
    
    return <Component {...props} />;
  };
}
```

## Success Criteria

- [ ] Box component implements complete design system API
- [ ] Button supports all variants with proper TypeScript inference
- [ ] List component handles generic types and empty/loading states
- [ ] All components support polymorphic `as` prop with type safety
- [ ] Refs are properly forwarded for all element types
- [ ] Advanced patterns (Link, validation, testing) are implemented
- [ ] Components work with different HTML elements seamlessly
- [ ] TypeScript provides accurate IntelliSense and error checking

## Real-World Applications

This pattern is essential for:

- **Design System Libraries**: Chakra UI, Mantine, Stitches use this pattern
- **Component Libraries**: Building flexible, reusable components
- **Enterprise Applications**: Consistent styling APIs across large codebases
- **Framework Integration**: Components that work with different routing libraries
- **Accessibility**: Semantic HTML while maintaining component APIs

Master polymorphic components to build world-class design systems!