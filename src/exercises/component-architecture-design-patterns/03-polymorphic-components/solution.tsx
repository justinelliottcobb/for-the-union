import React, { forwardRef, ElementType, ComponentPropsWithoutRef, ReactNode, HTMLAttributes, ComponentRef, ReactElement, createRef, useState } from 'react';

// Polymorphic component types and utilities
type AsProp<C extends ElementType> = {
  as?: C;
};

type PropsToOmit<C extends ElementType, P> = keyof (AsProp<C> & P);

// Polymorphic component prop type
type PolymorphicComponentProp<
  C extends ElementType,
  Props = {}
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

// Polymorphic ref type for forwarded refs
type PolymorphicRef<C extends ElementType> = ComponentRef<C>;

// Polymorphic component prop type with ref
type PolymorphicComponentPropWithRef<
  C extends ElementType,
  Props = {}
> = PolymorphicComponentProp<C, Props> & { ref?: PolymorphicRef<C> };

// Design system color and size scales
type ColorScale = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
type SizeScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type SpacingScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24;

// Design system tokens
const spacingTokens = {
  0: '0px',
  1: '0.25rem',
  2: '0.5rem', 
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const;

const colorTokens = {
  primary: { 
    bg: 'bg-blue-500', 
    text: 'text-blue-500', 
    border: 'border-blue-500',
    hover: 'hover:bg-blue-600'
  },
  secondary: { 
    bg: 'bg-gray-500', 
    text: 'text-gray-500', 
    border: 'border-gray-500',
    hover: 'hover:bg-gray-600'
  },
  success: { 
    bg: 'bg-green-500', 
    text: 'text-green-500', 
    border: 'border-green-500',
    hover: 'hover:bg-green-600'
  },
  warning: { 
    bg: 'bg-yellow-500', 
    text: 'text-yellow-500', 
    border: 'border-yellow-500',
    hover: 'hover:bg-yellow-600'
  },
  error: { 
    bg: 'bg-red-500', 
    text: 'text-red-500', 
    border: 'border-red-500',
    hover: 'hover:bg-red-600'
  },
  neutral: { 
    bg: 'bg-gray-300', 
    text: 'text-gray-700', 
    border: 'border-gray-300',
    hover: 'hover:bg-gray-400'
  },
} as const;

// Box polymorphic component implementation
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
  { 
    as, 
    color, 
    bg, 
    p, px, py, pt, pr, pb, pl, 
    m, mx, my, mt, mr, mb, ml, 
    size, 
    rounded, 
    shadow, 
    border, 
    children, 
    className, 
    ...rest 
  }: BoxProps<C>,
  ref?: PolymorphicRef<C>
) {
  const Component = as || 'div';
  
  // Spacing class generators
  const getSpacingClass = (property: string, value?: SpacingScale) => {
    if (value === undefined) return '';
    return `${property}-${value}`;
  };

  const getSpacingXClass = (property: string, value?: SpacingScale) => {
    if (value === undefined) return '';
    return `${property}x-${value}`;
  };

  const getSpacingYClass = (property: string, value?: SpacingScale) => {
    if (value === undefined) return '';
    return `${property}y-${value}`;
  };

  const getSpacingDirectionalClass = (property: string, direction: string, value?: SpacingScale) => {
    if (value === undefined) return '';
    return `${property}${direction}-${value}`;
  };

  // Color class generators
  const getColorClass = (property: string, value?: ColorScale) => {
    if (!value) return '';
    const token = colorTokens[value];
    switch (property) {
      case 'text':
        return token.text;
      case 'bg':
        return token.bg;
      case 'border':
        return token.border;
      default:
        return '';
    }
  };

  // Size class generator
  const getSizeClass = (value?: SizeScale) => {
    if (!value) return '';
    const sizeMap = {
      xs: 'w-4 h-4',
      sm: 'w-6 h-6',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
    };
    return sizeMap[value];
  };

  // Visual class generators
  const getRoundedClass = (value?: BoxOwnProps['rounded']) => {
    if (value === undefined) return '';
    if (value === true) return 'rounded';
    if (value === 'sm') return 'rounded-sm';
    if (value === 'md') return 'rounded-md';
    if (value === 'lg') return 'rounded-lg';
    if (value === 'full') return 'rounded-full';
    return '';
  };

  const getShadowClass = (value?: BoxOwnProps['shadow']) => {
    if (value === undefined) return '';
    if (value === true) return 'shadow';
    if (value === 'sm') return 'shadow-sm';
    if (value === 'md') return 'shadow-md';
    if (value === 'lg') return 'shadow-lg';
    if (value === 'xl') return 'shadow-xl';
    return '';
  };

  const getBorderClass = (value?: BoxOwnProps['border']) => {
    if (value === undefined) return '';
    if (value === true) return 'border';
    return `border ${getColorClass('border', value)}`;
  };

  // Combine all classes
  const classes = [
    // Color classes
    getColorClass('text', color),
    getColorClass('bg', bg),
    
    // Padding classes
    getSpacingClass('p', p),
    getSpacingXClass('p', px),
    getSpacingYClass('p', py),
    getSpacingDirectionalClass('p', 't', pt),
    getSpacingDirectionalClass('p', 'r', pr),
    getSpacingDirectionalClass('p', 'b', pb),
    getSpacingDirectionalClass('p', 'l', pl),
    
    // Margin classes
    getSpacingClass('m', m),
    getSpacingXClass('m', mx),
    getSpacingYClass('m', my),
    getSpacingDirectionalClass('m', 't', mt),
    getSpacingDirectionalClass('m', 'r', mr),
    getSpacingDirectionalClass('m', 'b', mb),
    getSpacingDirectionalClass('m', 'l', ml),
    
    // Size classes
    getSizeClass(size),
    
    // Visual classes
    getRoundedClass(rounded),
    getShadowClass(shadow),
    getBorderClass(border),
    
    // Custom className
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component ref={ref} className={classes} {...rest}>
      {children}
    </Component>
  );
}

// Create polymorphic Box with forwardRef
const Box = forwardRef(BoxComponent) as <C extends ElementType = 'div'>(
  props: BoxProps<C>
) => ReactElement | null;

// Button polymorphic component implementation
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
  const Component = as || 'button';

  const getVariantClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    const colorToken = colorTokens[color];
    
    switch (variant) {
      case 'solid':
        return `${baseClasses} ${colorToken.bg} text-white ${colorToken.hover} focus:ring-${color}-500`;
      case 'outline':
        return `${baseClasses} border ${colorToken.border} ${colorToken.text} hover:${colorToken.bg} hover:text-white focus:ring-${color}-500`;
      case 'ghost':
        return `${baseClasses} ${colorToken.text} hover:bg-${color}-100 focus:ring-${color}-500`;
      case 'link':
        return `${baseClasses} ${colorToken.text} underline hover:no-underline focus:ring-${color}-500`;
      default:
        return baseClasses;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'px-2 py-1 text-xs rounded gap-1';
      case 'sm':
        return 'px-3 py-2 text-sm rounded gap-1.5';
      case 'md':
        return 'px-4 py-2 text-sm rounded-md gap-2';
      case 'lg':
        return 'px-6 py-3 text-base rounded-md gap-2';
      case 'xl':
        return 'px-8 py-4 text-lg rounded-lg gap-3';
      default:
        return 'px-4 py-2 text-sm rounded-md gap-2';
    }
  };

  const getStateClasses = () => {
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

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <Component
      ref={ref}
      className={classes}
      disabled={isDisabled || isLoading}
      {...rest}
    >
      {isLoading && <Spinner />}
      {!isLoading && leftIcon && (
        <span className="flex-shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </Component>
  );
}

// Create polymorphic Button with forwardRef
const Button = forwardRef(ButtonComponent) as <C extends ElementType = 'button'>(
  props: ButtonProps<C>
) => ReactElement | null;

// Generic List polymorphic component implementation
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
  const Component = as || 'ul';

  const getVariantClasses = () => {
    const baseClasses = 'list-none';
    
    switch (variant) {
      case 'divided':
        return `${baseClasses} divide-y divide-gray-200`;
      case 'bordered':
        return `${baseClasses} border border-gray-200 rounded-md overflow-hidden`;
      case 'card':
        return `${baseClasses} bg-white shadow rounded-lg overflow-hidden`;
      default:
        return baseClasses;
    }
  };

  const getSizeClasses = () => {
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

  const getItemClasses = () => {
    switch (variant) {
      case 'divided':
        return 'py-3 first:pt-0 last:pb-0';
      case 'bordered':
      case 'card':
        return 'p-4 first:border-t-0';
      default:
        return '';
    }
  };

  const classes = [
    getVariantClasses(),
    variant === 'default' ? getSizeClasses() : '',
    className,
  ].filter(Boolean).join(' ');

  // Loading state
  if (isLoading) {
    return (
      <Component ref={ref} className={classes} {...rest}>
        <li className="p-4 text-center text-gray-500 flex items-center justify-center">
          <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {loadingMessage}
        </li>
      </Component>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <Component ref={ref} className={classes} {...rest}>
        <li className="p-4 text-center text-gray-500">
          {emptyMessage}
        </li>
      </Component>
    );
  }

  // Items list
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
}

// Create polymorphic List with forwardRef
const List = forwardRef(ListComponent) as <C extends ElementType = 'ul', T = any>(
  props: ListProps<C, T>
) => ReactElement | null;

// Advanced polymorphic patterns
interface PolymorphicLinkProps {
  href?: string;
  to?: string; // For React Router
  external?: boolean;
  download?: boolean | string;
}

// Polymorphic Link component factory
function createPolymorphicLink<RouterLinkComponent extends ElementType>(
  RouterLink?: RouterLinkComponent
) {
  interface LinkOwnProps extends PolymorphicLinkProps {
    children: ReactNode;
  }

  type LinkProps<C extends ElementType> = PolymorphicComponentPropWithRef<C, LinkOwnProps>;

  function LinkComponent<C extends ElementType = 'a'>(
    { as, href, to, external, download, children, ...rest }: LinkProps<C>,
    ref?: PolymorphicRef<C>
  ) {
    // External link or download - use anchor tag
    if (external || href?.startsWith('http') || download) {
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

    // Internal router link
    if (to && RouterLink) {
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

// Validation utilities for polymorphic components
function validatePolymorphicProps<T extends Record<string, any>>(
  props: T,
  component: string
): string[] {
  const warnings: string[] = [];

  // Check for conflicting link props
  if (props.href && props.to) {
    warnings.push(`${component}: Cannot use both 'href' and 'to' props`);
  }

  // Validate 'as' prop
  if (props.as && !isValidElementType(props.as)) {
    warnings.push(`${component}: Invalid 'as' prop value`);
  }

  // Check for accessibility concerns
  if (props.as === 'div' && props.onClick && !props.role) {
    warnings.push(`${component}: Interactive div should have a role attribute`);
  }

  return warnings;
}

function isValidElementType(component: any): component is ElementType {
  return (
    typeof component === 'string' ||
    typeof component === 'function' ||
    (typeof component === 'object' && component?.$$typeof)
  );
}

// Testing utilities for polymorphic components
function createPolymorphicTestUtils<C extends ElementType>(
  Component: React.ComponentType<any>
) {
  return {
    testAsProps: (asPropValues: ElementType[]) => {
      // Would test component with different 'as' values in a real test environment
      return asPropValues.map(as => ({
        as,
        shouldRender: isValidElementType(as),
      }));
    },
    
    testRefForwarding: () => {
      // Would test ref forwarding in a real test environment
      const ref = createRef<HTMLElement>();
      return { ref, isForwarded: true }; // Simplified for demo
    },
    
    testPropInheritance: () => {
      // Would test that native props are passed through
      const testProps = { 'data-testid': 'test', className: 'test-class' };
      return { testProps, inherited: true }; // Simplified for demo
    },
  };
}

// Runtime validation wrapper
function withRuntimeValidation<P extends Record<string, any>>(
  Component: React.ComponentType<P>
) {
  const ValidatedComponent = (props: P) => {
    const warnings = validatePolymorphicProps(props, Component.displayName || 'Component');
    
    if (process.env.NODE_ENV === 'development' && warnings.length > 0) {
      warnings.forEach(warning => console.warn(warning));
    }
    
    return <Component {...props} />;
  };

  ValidatedComponent.displayName = `Validated(${Component.displayName || 'Component'})`;
  return ValidatedComponent;
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
  { id: '4', name: 'Alice Johnson', email: 'alice@example.com', role: 'user' },
  { id: '5', name: 'Charlie Brown', email: 'charlie@example.com', role: 'moderator' },
];

// Main demo component showcasing polymorphic patterns
export default function PolymorphicComponentsDemo() {
  const [selectedExample, setSelectedExample] = useState<'box' | 'button' | 'list' | 'advanced'>('box');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

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

        {/* Example selection */}
        <div className="flex justify-center space-x-4 flex-wrap">
          {[
            { key: 'box', label: 'Box Component' },
            { key: 'button', label: 'Button Variants' },
            { key: 'list', label: 'Generic List' },
            { key: 'advanced', label: 'Advanced Patterns' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedExample(key as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedExample === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Example content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {selectedExample === 'box' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Box Component Examples</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">As Different Elements</h3>
                    
                    <Box p={4} bg="primary" color="white" rounded="md">
                      Default div Box
                    </Box>
                    
                    <Box as="section" p={4} bg="secondary" rounded="lg" className="text-white">
                      Section Box
                    </Box>
                    
                    <Box as="article" p={6} border="primary" rounded="xl" shadow="md">
                      Article Box with border and shadow
                    </Box>

                    <Box as="header" p={4} bg="success" rounded="full" className="text-white text-center">
                      Header Box - rounded full
                    </Box>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Spacing & Visual Properties</h3>
                    
                    <Box p={2} m={2} bg="neutral" rounded>
                      Small padding and margin
                    </Box>
                    
                    <Box px={6} py={3} mx={4} bg="warning" rounded="md" className="text-white">
                      Custom horizontal/vertical spacing
                    </Box>
                    
                    <Box p={8} bg="error" rounded="lg" shadow="xl" className="text-white">
                      Large padding with extra shadow
                    </Box>

                    <Box pt={2} pr={4} pb={6} pl={8} border="success" rounded="sm">
                      Individual padding sides
                    </Box>
                  </div>
                </div>

                <div className="bg-gray-100 p-4 rounded">
                  <h4 className="font-medium mb-2">TypeScript Benefits</h4>
                  <p className="text-sm text-gray-700">
                    Notice how TypeScript provides full intellisense for HTML attributes based on the 'as' prop.
                    Try using Box as="input" and see the available props!
                  </p>
                </div>
              </div>
            )}

            {selectedExample === 'button' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Button Component Examples</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Button Variants</h3>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button variant="solid" color="primary">
                        Solid Button
                      </Button>
                      <Button variant="outline" color="primary">
                        Outline Button
                      </Button>
                      <Button variant="ghost" color="primary">
                        Ghost Button
                      </Button>
                      <Button variant="link" color="primary">
                        Link Button
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="solid" color="success">
                        Success
                      </Button>
                      <Button variant="solid" color="warning">
                        Warning
                      </Button>
                      <Button variant="solid" color="error">
                        Error
                      </Button>
                      <Button variant="solid" color="neutral">
                        Neutral
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">As Different Elements</h3>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button as="a" href="#" variant="solid" color="success">
                        Anchor Button
                      </Button>
                      <Button as="div" onClick={() => alert('Div clicked!')} variant="outline" color="warning">
                        Div Button
                      </Button>
                      <Button as="span" variant="ghost" color="primary">
                        Span Button
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Sizes & States</h3>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="xs" variant="solid">Extra Small</Button>
                    <Button size="sm" variant="solid">Small</Button>
                    <Button size="md" variant="solid">Medium</Button>
                    <Button size="lg" variant="solid">Large</Button>
                    <Button size="xl" variant="solid">Extra Large</Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button isLoading variant="solid" color="primary">
                      Loading Button
                    </Button>
                    <Button isDisabled variant="solid" color="primary">
                      Disabled Button
                    </Button>
                    <Button leftIcon="👍" variant="solid" color="success">
                      With Left Icon
                    </Button>
                    <Button rightIcon="🚀" variant="solid" color="primary">
                      With Right Icon
                    </Button>
                    <Button 
                      leftIcon="⚡" 
                      rightIcon="🎯" 
                      variant="outline" 
                      color="warning"
                      onClick={handleLoadingDemo}
                    >
                      Both Icons
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedExample === 'list' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Generic List Examples</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Default List</h3>
                    
                    <List
                      items={sampleUsers.slice(0, 3)}
                      variant="default"
                      renderItem={(user) => (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      )}
                      keyExtractor={(user) => user.id}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Divided List</h3>
                    
                    <List
                      items={sampleUsers.slice(0, 4)}
                      variant="divided"
                      renderItem={(user) => (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{user.name}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      )}
                      keyExtractor={(user) => user.id}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Card List</h3>
                    
                    <List
                      items={sampleUsers.slice(0, 3)}
                      variant="card"
                      renderItem={(user) => (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" color="primary">
                            View
                          </Button>
                        </div>
                      )}
                      keyExtractor={(user) => user.id}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">States & Different Elements</h3>
                    
                    <div className="space-y-3">
                      <List
                        as="ol"
                        items={sampleUsers.slice(0, 3)}
                        variant="bordered"
                        renderItem={(user, index) => (
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-bold text-blue-500">#{index + 1}</span>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        )}
                        keyExtractor={(user) => user.id}
                      />
                      
                      <List
                        items={[]}
                        emptyMessage="No users found"
                        variant="bordered"
                        renderItem={() => null}
                      />
                      
                      <List
                        items={sampleUsers}
                        isLoading={isLoading}
                        loadingMessage="Loading users..."
                        variant="default"
                        renderItem={(user) => <span>{user.name}</span>}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedExample === 'advanced' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Advanced Polymorphic Patterns</h2>
                
                <div className="space-y-6">
                  <div className="bg-gray-100 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">Polymorphic Link Pattern</h3>
                    <p className="text-gray-700 mb-4">
                      The createPolymorphicLink factory can create Link components that adapt to different routing libraries:
                    </p>
                    <div className="bg-white p-4 rounded border">
                      <pre className="text-sm text-gray-800">
{`// Usage with React Router
const Link = createPolymorphicLink(ReactRouterLink);

// Usage with Next.js
const NextLink = createPolymorphicLink(NextRouterLink);

// Smart routing
<Link to="/internal">Internal Link</Link>
<Link href="https://external.com" external>External Link</Link>
<Link href="/file.pdf" download>Download Link</Link>`}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-4 text-blue-800">Type Safety Demonstration</h3>
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded border">
                        <h5 className="font-medium mb-2">Component Prop Inference</h5>
                        <p className="text-sm text-gray-700 mb-2">
                          TypeScript automatically infers the correct props based on the 'as' prop:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• <code>&lt;Box as="a"&gt;</code> - provides href, target, rel props</li>
                          <li>• <code>&lt;Box as="button"&gt;</code> - provides onClick, disabled, type props</li>
                          <li>• <code>&lt;Box as="input"&gt;</code> - provides value, onChange, placeholder props</li>
                          <li>• <code>&lt;Button as="a"&gt;</code> - combines Button props with anchor props</li>
                        </ul>
                      </div>
                      
                      <div className="bg-white p-4 rounded border">
                        <h5 className="font-medium mb-2">Ref Forwarding</h5>
                        <p className="text-sm text-gray-700">
                          Refs are properly typed for the target element type and forwarded correctly.
                          The ref type changes based on the 'as' prop value.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-4 text-green-800">Validation & Testing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded border">
                        <h5 className="font-medium mb-2">Runtime Validation</h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>• Prop conflict detection</li>
                          <li>• Invalid 'as' prop warnings</li>
                          <li>• Accessibility recommendations</li>
                          <li>• Development-only warnings</li>
                        </ul>
                      </div>
                      
                      <div className="bg-white p-4 rounded border">
                        <h5 className="font-medium mb-2">Testing Utilities</h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>• Test different 'as' prop values</li>
                          <li>• Verify ref forwarding</li>
                          <li>• Check prop inheritance</li>
                          <li>• Validate element rendering</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-4 text-purple-800">Enterprise Benefits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ul className="text-sm text-purple-700 space-y-2">
                        <li>• <strong>Reduced Bundle Size:</strong> Single component, multiple elements</li>
                        <li>• <strong>Type Safety:</strong> Full TypeScript inference and validation</li>
                        <li>• <strong>Consistent APIs:</strong> Same styling props across all elements</li>
                        <li>• <strong>Flexible Design Systems:</strong> Adapt to any HTML structure</li>
                      </ul>
                      <ul className="text-sm text-purple-700 space-y-2">
                        <li>• <strong>Developer Experience:</strong> Enhanced IntelliSense and autocomplete</li>
                        <li>• <strong>Maintainability:</strong> Single source of truth for styling</li>
                        <li>• <strong>Accessibility:</strong> Semantic HTML with component benefits</li>
                        <li>• <strong>Performance:</strong> Optimized component architecture</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pattern explanation */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Polymorphic Components in Practice</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-blue-700">Used By</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Chakra UI - Box, Button, Text</li>
                <li>• Mantine - All core components</li>
                <li>• Radix UI - Primitive components</li>
                <li>• Stitches - Styled components</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-purple-700">Key Features</h4>
              <ul className="text-sm text-purple-600 space-y-1">
                <li>• Generic constraints & prop inference</li>
                <li>• Forward ref support for all elements</li>
                <li>• Design system token integration</li>
                <li>• Runtime validation & testing utilities</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-green-700">Enterprise Value</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Consistent component APIs</li>
                <li>• Reduced library bundle size</li>
                <li>• Enhanced type safety</li>
                <li>• Future-proof architecture</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}