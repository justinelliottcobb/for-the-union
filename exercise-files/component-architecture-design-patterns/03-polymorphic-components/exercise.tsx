import React, { forwardRef, ElementType, ComponentPropsWithoutRef, ReactNode, ReactElement, useState } from 'react';

// Polymorphic component types and utilities
type AsProp<C extends ElementType> = {
  as?: C;
};

type PropsToOmit<C extends ElementType, P> = keyof (AsProp<C> & P);

// TODO: Implement PolymorphicComponentProp type
type PolymorphicComponentProp<
  C extends ElementType,
  Props = {}
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

// TODO: Implement PolymorphicRef type for forwarded refs
type PolymorphicRef<C extends ElementType> = React.ComponentRef<C>;

// TODO: Implement PolymorphicComponentPropWithRef type
type PolymorphicComponentPropWithRef<
  C extends ElementType,
  Props = {}
> = PolymorphicComponentProp<C, Props> & { ref?: PolymorphicRef<C> };

// Design system color and size scales
type ColorScale = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
type SizeScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type SpacingScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;

// TODO: Implement Box polymorphic component
interface BoxOwnProps {
  color?: ColorScale;
  bg?: ColorScale;
  p?: SpacingScale;
  px?: SpacingScale;
  py?: SpacingScale;
  pt?: SpacingScale;
  pr?: SpacingScale;
  pb?: SpacingScale;
  pl?: SpacingScale;
  m?: SpacingScale;
  mx?: SpacingScale;
  my?: SpacingScale;
  mt?: SpacingScale;
  mr?: SpacingScale;
  mb?: SpacingScale;
  ml?: SpacingScale;
  size?: SizeScale;
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'full';
  shadow?: boolean | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean | ColorScale;
  children?: ReactNode;
}

type BoxProps<C extends ElementType> = PolymorphicComponentPropWithRef<C, BoxOwnProps>;

function BoxComponent<C extends ElementType = 'div'>(
  { as, color, bg, p, px, py, pt, pr, pb, pl, m, mx, my, mt, mr, mb, ml, size, rounded, shadow, border, children, className, ...rest }: BoxProps<C>,
  ref?: PolymorphicRef<C>
) {
  // TODO: Implement polymorphic Box component
  // Generate className based on props
  // Handle 'as' prop for element type
  // Apply design system styles
  // Forward ref correctly
  
  const Component = as || 'div';
  
  const getSpacingClass = (property: string, value?: SpacingScale) => {
    // TODO: Convert spacing values to CSS classes
    // p-0, p-1, p-2, etc.
    if (value === undefined) return '';
    return `${property}-${value}`;
  };

  const getColorClass = (property: string, value?: ColorScale) => {
    // TODO: Convert color values to CSS classes
    // text-primary, bg-secondary, etc.
    if (!value) return '';
    return `${property}-${value}`;
  };

  const getSizeClass = (value?: SizeScale) => {
    // TODO: Convert size to width/height classes
    if (!value) return '';
    return `size-${value}`;
  };

  const getRoundedClass = (value?: BoxOwnProps['rounded']) => {
    // TODO: Convert rounded values to border-radius classes
    if (value === undefined) return '';
    if (value === true) return 'rounded';
    return `rounded-${value}`;
  };

  const getShadowClass = (value?: BoxOwnProps['shadow']) => {
    // TODO: Convert shadow values to box-shadow classes
    if (value === undefined) return '';
    if (value === true) return 'shadow';
    return `shadow-${value}`;
  };

  const getBorderClass = (value?: BoxOwnProps['border']) => {
    // TODO: Convert border values to border classes
    if (value === undefined) return '';
    if (value === true) return 'border';
    return `border border-${value}`;
  };

  const classes = [
    // TODO: Combine all generated classes
    getColorClass('text', color),
    getColorClass('bg', bg),
    // Padding classes
    getSpacingClass('p', p),
    // Margin classes  
    getSpacingClass('m', m),
    // Size classes
    getSizeClass(size),
    // Visual classes
    getRoundedClass(rounded),
    getShadowClass(shadow),
    getBorderClass(border),
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component ref={ref} className={classes} {...rest}>
      {children}
    </Component>
  );
}

// TODO: Create polymorphic Box with forwardRef
const Box = forwardRef(BoxComponent) as <C extends ElementType = 'div'>(
  props: BoxProps<C>
) => ReactElement | null;

// TODO: Implement Button polymorphic component with variants
interface ButtonOwnProps {
  variant?: 'solid' | 'outline' | 'ghost' | 'link';
  size?: SizeScale;
  color?: ColorScale;
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

type ButtonProps<C extends ElementType> = PolymorphicComponentPropWithRef<C, ButtonOwnProps>;

function ButtonComponent<C extends ElementType = 'button'>(
  { 
    as, 
    variant = 'solid', 
    size = 'md', 
    color = 'primary',
    isLoading = false,
    isDisabled = false,
    leftIcon,
    rightIcon,
    children,
    className,
    ...rest 
  }: ButtonProps<C>,
  ref?: PolymorphicRef<C>
) {
  // TODO: Implement polymorphic Button component
  // Handle different variants (solid, outline, ghost, link)
  // Support different sizes and colors
  // Handle loading and disabled states
  // Support icons and proper spacing

  const Component = as || 'button';

  const getVariantClasses = () => {
    // TODO: Generate variant-specific classes
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors';
    
    switch (variant) {
      case 'solid':
        return `${baseClasses} bg-${color} text-white hover:bg-${color}-600`;
      case 'outline':
        return `${baseClasses} border border-${color} text-${color} hover:bg-${color} hover:text-white`;
      case 'ghost':
        return `${baseClasses} text-${color} hover:bg-${color}-100`;
      case 'link':
        return `${baseClasses} text-${color} underline hover:no-underline`;
      default:
        return baseClasses;
    }
  };

  const getSizeClasses = () => {
    // TODO: Generate size-specific classes
    switch (size) {
      case 'xs':
        return 'px-2 py-1 text-xs rounded';
      case 'sm':
        return 'px-3 py-2 text-sm rounded';
      case 'md':
        return 'px-4 py-2 text-sm rounded-md';
      case 'lg':
        return 'px-6 py-3 text-base rounded-md';
      case 'xl':
        return 'px-8 py-4 text-lg rounded-lg';
      default:
        return 'px-4 py-2 text-sm rounded-md';
    }
  };

  const getStateClasses = () => {
    // TODO: Generate state-specific classes
    const stateClasses = [];
    
    if (isDisabled || isLoading) {
      stateClasses.push('opacity-50 cursor-not-allowed');
    }
    
    if (isLoading) {
      stateClasses.push('pointer-events-none');
    }

    return stateClasses.join(' ');
  };

  const classes = [
    getVariantClasses(),
    getSizeClasses(),
    getStateClasses(),
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component
      ref={ref}
      className={classes}
      disabled={isDisabled || isLoading}
      {...rest}
    >
      {isLoading && (
        <span className="mr-2 animate-spin">⟳</span>
      )}
      {!isLoading && leftIcon && (
        <span className="mr-2">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </Component>
  );
}

// TODO: Create polymorphic Button with forwardRef
const Button = forwardRef(ButtonComponent) as <C extends ElementType = 'button'>(
  props: ButtonProps<C>
) => ReactElement | null;

// TODO: Implement generic List polymorphic component
interface ListOwnProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  emptyMessage?: ReactNode;
  isLoading?: boolean;
  loadingMessage?: ReactNode;
  variant?: 'default' | 'divided' | 'bordered' | 'card';
  size?: SizeScale;
}

type ListProps<C extends ElementType, T> = PolymorphicComponentPropWithRef<C, ListOwnProps<T>>;

function ListComponent<C extends ElementType = 'ul', T = any>(
  {
    as,
    items,
    renderItem,
    keyExtractor = (_, index) => index,
    emptyMessage = 'No items to display',
    isLoading = false,
    loadingMessage = 'Loading...',
    variant = 'default',
    size = 'md',
    className,
    children,
    ...rest
  }: ListProps<C, T>,
  ref?: PolymorphicRef<C>
) {
  // TODO: Implement generic polymorphic List component
  // Support different variants and sizes
  // Handle loading and empty states
  // Generate proper list structure
  // Support custom key extraction

  const Component = as || 'ul';

  const getVariantClasses = () => {
    // TODO: Generate variant-specific classes
    const baseClasses = 'list-none';
    
    switch (variant) {
      case 'divided':
        return `${baseClasses} divide-y divide-gray-200`;
      case 'bordered':
        return `${baseClasses} border border-gray-200 rounded-md`;
      case 'card':
        return `${baseClasses} bg-white shadow rounded-lg`;
      default:
        return baseClasses;
    }
  };

  const getSizeClasses = () => {
    // TODO: Generate size-specific classes for items
    switch (size) {
      case 'xs':
        return 'space-y-1';
      case 'sm':
        return 'space-y-2';
      case 'md':
        return 'space-y-3';
      case 'lg':
        return 'space-y-4';
      case 'xl':
        return 'space-y-6';
      default:
        return 'space-y-3';
    }
  };

  const classes = [
    getVariantClasses(),
    getSizeClasses(),
    className,
  ].filter(Boolean).join(' ');

  if (isLoading) {
    return (
      <Component ref={ref} className={classes} {...rest}>
        <li className="p-4 text-center text-gray-500">
          {loadingMessage}
        </li>
      </Component>
    );
  }

  if (items.length === 0) {
    return (
      <Component ref={ref} className={classes} {...rest}>
        <li className="p-4 text-center text-gray-500">
          {emptyMessage}
        </li>
      </Component>
    );
  }

  return (
    <Component ref={ref} className={classes} {...rest}>
      {items.map((item, index) => {
        const key = keyExtractor(item, index);
        return (
          <li key={key} className={getItemClasses()}>
            {renderItem(item, index)}
          </li>
        );
      })}
      {children}
    </Component>
  );

  function getItemClasses() {
    // TODO: Generate item-specific classes based on variant
    const baseClasses = '';
    
    switch (variant) {
      case 'divided':
        return `${baseClasses} py-3 first:pt-0 last:pb-0`;
      case 'bordered':
      case 'card':
        return `${baseClasses} p-4`;
      default:
        return baseClasses;
    }
  }
}

// TODO: Create polymorphic List with forwardRef
const List = forwardRef(ListComponent) as <C extends ElementType = 'ul', T = any>(
  props: ListProps<C, T>
) => ReactElement | null;

// TODO: Implement advanced polymorphic patterns
interface PolymorphicLinkProps {
  href?: string;
  to?: string; // For React Router
  external?: boolean;
  download?: boolean | string;
}

// TODO: Implement Link component that works with different routing libraries
function createPolymorphicLink<RouterLinkComponent extends ElementType>(
  RouterLink?: RouterLinkComponent
) {
  // TODO: Create a Link component that adapts to different routing systems
  // Support both native anchor tags and router components
  // Handle external links appropriately
  // Provide type safety for different link types

  interface LinkOwnProps extends PolymorphicLinkProps {
    children: ReactNode;
  }

  type LinkProps<C extends ElementType> = PolymorphicComponentPropWithRef<C, LinkOwnProps>;

  function LinkComponent<C extends ElementType = 'a'>(
    { as, href, to, external, download, children, ...rest }: LinkProps<C>,
    ref?: PolymorphicRef<C>
  ) {
    // TODO: Implement smart link logic
    // Use RouterLink for internal navigation if available
    // Use anchor tag for external links
    // Handle download attributes
    
    if (external || href?.startsWith('http') || download) {
      // External link - use anchor tag
      const Component = as || 'a';
      return (
        <Component
          ref={ref}
          href={href}
          download={download}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          {...rest}
        >
          {children}
        </Component>
      );
    }

    if (to && RouterLink) {
      // Internal link - use router component
      const Component = as || RouterLink;
      return (
        <Component ref={ref} to={to} {...rest}>
          {children}
        </Component>
      );
    }

    // Fallback to anchor tag
    const Component = as || 'a';
    return (
      <Component ref={ref} href={href || to} {...rest}>
        {children}
      </Component>
    );
  }

  return forwardRef(LinkComponent) as <C extends ElementType = 'a'>(
    props: LinkProps<C>
  ) => ReactElement | null;
}

// TODO: Implement polymorphic component validation utilities
function validatePolymorphicProps<T extends Record<string, any>>(
  props: T,
  component: string
): string[] {
  // TODO: Validate polymorphic component props
  // Check for conflicting props
  // Warn about invalid combinations
  // Return array of validation messages

  const warnings: string[] = [];

  // TODO: Add validation logic
  
  return warnings;
}

// TODO: Implement polymorphic component testing utilities
function createPolymorphicTestUtils<C extends ElementType>(
  Component: React.ComponentType<any>
) {
  // TODO: Create utilities for testing polymorphic components
  // Test different 'as' prop values
  // Verify ref forwarding
  // Check prop inheritance

  return {
    testAsProps: (asPropValues: C[]) => {
      // TODO: Test component with different 'as' values
    },
    testRefForwarding: () => {
      // TODO: Test ref forwarding functionality
    },
    testPropInheritance: () => {
      // TODO: Test that native props are passed through
    },
  };
}

// Demo data and examples
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'moderator';
}

const sampleUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'moderator' },
];

// TODO: Implement demo component showcasing polymorphic patterns
export default function PolymorphicComponentsDemo() {
  const [selectedExample, setSelectedExample] = useState<'box' | 'button' | 'list' | 'advanced'>('box');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Polymorphic Components
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Master polymorphic component design with TypeScript for enterprise-level design systems.
            Learn component prop inference, generic constraints, and type safety.
          </p>
        </div>

        {/* TODO: Implement pattern selection and examples */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-600">
            Implement the pattern selection and comprehensive examples here.
            The exercise should demonstrate Box, Button, List, and advanced polymorphic patterns.
          </p>
        </div>
      </div>
    </div>
  );
}