import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useMemo, 
  useEffect,
  ReactNode, 
  ComponentType,
  CSSProperties,
  forwardRef,
  ElementType
} from 'react';

// Design System Architecture and Component Libraries
// Master scalable design system patterns for enterprise applications

// TODO: Implement Design Token System
interface DesignTokens {
  colors: {
    primary: Record<string, string>;
    secondary: Record<string, string>;
    success: Record<string, string>;
    warning: Record<string, string>;
    error: Record<string, string>;
    neutral: Record<string, string>;
    semantic: Record<string, string>;
  };
  typography: {
    fontFamilies: Record<string, string>;
    fontSizes: Record<string, string>;
    fontWeights: Record<string, number>;
    lineHeights: Record<string, string>;
    letterSpacing: Record<string, string>;
  };
  spacing: Record<string, string>;
  borders: {
    radius: Record<string, string>;
    width: Record<string, string>;
    style: Record<string, string>;
  };
  shadows: Record<string, string>;
  breakpoints: Record<string, string>;
  zIndex: Record<string, number>;
  transitions: Record<string, string>;
  animations: Record<string, string>;
}

const defaultTokens: DesignTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      900: '#1e3a8a'
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      500: '#64748b',
      900: '#0f172a'
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      900: '#14532d'
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      900: '#78350f'
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      900: '#7f1d1d'
    },
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      500: '#71717a',
      900: '#18181b'
    },
    semantic: {
      background: '#ffffff',
      surface: '#f8fafc',
      border: '#e2e8f0',
      text: '#1a202c',
      textMuted: '#718096'
    }
  },
  typography: {
    fontFamilies: {
      sans: 'Inter, system-ui, sans-serif',
      serif: 'Georgia, serif',
      mono: 'Fira Code, monospace'
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeights: {
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2'
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em'
    }
  },
  spacing: {
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
    24: '6rem'
  },
  borders: {
    radius: {
      none: '0px',
      sm: '0.125rem',
      base: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px'
    },
    width: {
      0: '0px',
      1: '1px',
      2: '2px',
      4: '4px',
      8: '8px'
    },
    style: {
      solid: 'solid',
      dashed: 'dashed',
      dotted: 'dotted',
      none: 'none'
    }
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  zIndex: {
    hide: -1,
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600
  },
  transitions: {
    fast: 'all 150ms ease',
    normal: 'all 250ms ease',
    slow: 'all 300ms ease',
    bounce: 'all 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  animations: {
    spin: 'spin 1s linear infinite',
    ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    bounce: 'bounce 1s infinite'
  }
};

// TODO: Implement Theme Context and Provider
interface ThemeContextValue {
  tokens: DesignTokens;
  mode: 'light' | 'dark' | 'auto';
  setMode: (mode: 'light' | 'dark' | 'auto') => void;
  customTokens?: Partial<DesignTokens>;
  setCustomTokens: (tokens: Partial<DesignTokens>) => void;
  resolvedTokens: DesignTokens;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: 'light' | 'dark' | 'auto';
  customTokens?: Partial<DesignTokens>;
  storageKey?: string;
}

export function ThemeProvider({ 
  children, 
  defaultMode = 'light',
  customTokens: initialCustomTokens,
  storageKey = 'theme-mode'
}: ThemeProviderProps) {
  // TODO: Implement theme provider with token resolution
  // Support light/dark mode switching
  // Handle custom token overrides
  // Persist theme preferences
  // Calculate resolved token values
  
  const [mode, setModeState] = useState<'light' | 'dark' | 'auto'>(() => {
    if (typeof window === 'undefined') return defaultMode;
    
    try {
      const stored = localStorage.getItem(storageKey);
      return (stored as 'light' | 'dark' | 'auto') || defaultMode;
    } catch {
      return defaultMode;
    }
  });
  
  const [customTokens, setCustomTokens] = useState<Partial<DesignTokens> | undefined>(
    initialCustomTokens
  );
  
  const setMode = useCallback((newMode: 'light' | 'dark' | 'auto') => {
    setModeState(newMode);
    try {
      localStorage.setItem(storageKey, newMode);
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey]);
  
  // Resolve actual mode (handle 'auto')
  const resolvedMode = useMemo(() => {
    if (mode !== 'auto') return mode;
    
    if (typeof window === 'undefined') return 'light';
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, [mode]);
  
  // Merge default tokens with custom overrides and dark mode adjustments
  const resolvedTokens = useMemo(() => {
    let tokens = { ...defaultTokens };
    
    // Apply custom token overrides
    if (customTokens) {
      tokens = mergeTokens(tokens, customTokens);
    }
    
    // Apply dark mode adjustments
    if (resolvedMode === 'dark') {
      tokens = applyDarkModeTokens(tokens);
    }
    
    return tokens;
  }, [customTokens, resolvedMode]);
  
  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (mode !== 'auto') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Force re-render by updating a state value
      setModeState('auto');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);
  
  const contextValue: ThemeContextValue = useMemo(() => ({
    tokens: defaultTokens,
    mode,
    setMode,
    customTokens,
    setCustomTokens,
    resolvedTokens
  }), [mode, setMode, customTokens, resolvedTokens]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      <div className={'theme-' + resolvedMode} style={createCSSVariables(resolvedTokens)}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// TODO: Implement token merging and transformation utilities
function mergeTokens(base: DesignTokens, override: Partial<DesignTokens>): DesignTokens {
  // TODO: Deep merge tokens with proper handling of nested objects
  const merged = { ...base };
  
  Object.keys(override).forEach(key => {
    const baseValue = (base as any)[key];
    const overrideValue = (override as any)[key];
    
    if (typeof baseValue === 'object' && typeof overrideValue === 'object' && !Array.isArray(overrideValue)) {
      (merged as any)[key] = { ...baseValue, ...overrideValue };
    } else {
      (merged as any)[key] = overrideValue;
    }
  });
  
  return merged;
}

function applyDarkModeTokens(tokens: DesignTokens): DesignTokens {
  // TODO: Apply dark mode color transformations
  const darkTokens = { ...tokens };
  
  // Invert semantic colors for dark mode
  darkTokens.colors.semantic = {
    background: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    text: '#f8fafc',
    textMuted: '#94a3b8'
  };
  
  return darkTokens;
}

function createCSSVariables(tokens: DesignTokens): CSSProperties {
  // TODO: Convert design tokens to CSS custom properties
  const variables: Record<string, string> = {};
  
  // Colors
  Object.entries(tokens.colors).forEach(([colorFamily, colors]) => {
    if (typeof colors === 'object') {
      Object.entries(colors).forEach(([shade, value]) => {
        variables['--color-' + colorFamily + '-' + shade] = value;
      });
    }
  });
  
  // Typography
  Object.entries(tokens.typography.fontSizes).forEach(([size, value]) => {
    variables['--font-size-' + size] = value;
  });
  
  // Spacing
  Object.entries(tokens.spacing).forEach(([scale, value]) => {
    variables['--spacing-' + scale] = value;
  });
  
  // Other token categories...
  Object.entries(tokens.shadows).forEach(([size, value]) => {
    variables['--shadow-' + size] = value;
  });
  
  return variables as CSSProperties;
}

// TODO: Implement Variant System
type VariantConfig<T extends Record<string, any>> = {
  [K in keyof T]: {
    [V in keyof T[K]]: CSSProperties | string;
  };
};

interface ComponentVariants {
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant: 'solid' | 'outline' | 'ghost' | 'link';
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

function createVariants<T extends Record<string, any>>(config: VariantConfig<T>) {
  // TODO: Create variant resolver with intelligent CSS class generation
  // Support compound variants (combinations)
  // Handle responsive variants
  // Optimize for performance
  
  return function resolveVariants(
    variants: Partial<T>,
    options?: {
      responsive?: Record<string, Partial<T>>;
      compoundVariants?: Array<{
        variants: Partial<T>;
        styles: CSSProperties | string;
      }>;
    }
  ): string {
    const classes: string[] = [];
    
    // Resolve base variants
    Object.entries(variants).forEach(([key, value]) => {
      if (value && config[key] && config[key][value]) {
        const style = config[key][value];
        if (typeof style === 'string') {
          classes.push(style);
        }
        // Handle CSS-in-JS styles would need additional processing
      }
    });
    
    // Handle compound variants
    if (options?.compoundVariants) {
      options.compoundVariants.forEach(({ variants: compoundVariant, styles }) => {
        const matches = Object.entries(compoundVariant).every(([key, value]) => 
          variants[key] === value
        );
        
        if (matches && typeof styles === 'string') {
          classes.push(styles);
        }
      });
    }
    
    // Handle responsive variants
    if (options?.responsive) {
      Object.entries(options.responsive).forEach(([breakpoint, responsiveVariants]) => {
        Object.entries(responsiveVariants).forEach(([key, value]) => {
          if (value && config[key] && config[key][value]) {
            const style = config[key][value];
            if (typeof style === 'string') {
              // Add breakpoint prefix
              classes.push(breakpoint + ':' + style);
            }
          }
        });
      });
    }
    
    return classes.join(' ');
  };
}

// TODO: Implement Extensible Component System
interface ExtensibleComponentProps {
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
  variant?: string;
  size?: string;
  color?: string;
}

function createExtensibleComponent<P extends ExtensibleComponentProps>(
  displayName: string,
  defaultElement: ElementType = 'div',
  baseVariants?: VariantConfig<any>
) {
  // TODO: Create extensible component factory
  // Support variant resolution
  // Handle polymorphic rendering (as prop)
  // Provide extension points for customization
  // Include debugging and development tools
  
  const Component = forwardRef<any, P>(({
    className = '',
    style,
    as: Element = defaultElement,
    variant,
    size,
    color,
    children,
    ...rest
  }, ref) => {
    const theme = useTheme();
    
    // Resolve variants to classes
    const variantClasses = useMemo(() => {
      if (!baseVariants) return '';
      
      const resolveVariants = createVariants(baseVariants);
      return resolveVariants({ variant, size, color });
    }, [variant, size, color]);
    
    // Combine classes
    const finalClassName = [
      'ds-' + displayName.toLowerCase(),
      variantClasses,
      className
    ].filter(Boolean).join(' ');
    
    return (
      <Element
        ref={ref}
        className={finalClassName}
        style={style}
        {...rest}
      >
        {children}
      </Element>
    );
  });
  
  Component.displayName = displayName;
  return Component;
}

// TODO: Implement Button with Full Variant System
const buttonVariants: VariantConfig<ComponentVariants> = {
  size: {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  },
  variant: {
    solid: 'font-medium shadow-sm',
    outline: 'font-medium border-2',
    ghost: 'font-medium',
    link: 'underline'
  },
  color: {
    primary: 'focus:ring-2 focus:ring-blue-500',
    secondary: 'focus:ring-2 focus:ring-gray-500',
    success: 'focus:ring-2 focus:ring-green-500',
    warning: 'focus:ring-2 focus:ring-yellow-500',
    error: 'focus:ring-2 focus:ring-red-500'
  }
};

interface ButtonProps extends ExtensibleComponentProps {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: () => void;
}

const Button = createExtensibleComponent<ButtonProps>('Button', 'button', buttonVariants);

// TODO: Implement Card with Composition Slots
interface CardProps extends ExtensibleComponentProps {
  children: ReactNode;
  padding?: keyof DesignTokens['spacing'];
  shadow?: keyof DesignTokens['shadows'];
  border?: boolean;
}

function Card({ 
  children, 
  padding = '4',
  shadow = 'base',
  border = true,
  className = '',
  ...rest 
}: CardProps) {
  // TODO: Implement card component with slot composition
  // Support header, body, footer slots
  // Handle padding and styling variants
  // Provide compound component API
  
  const theme = useTheme();
  const paddingValue = theme.resolvedTokens.spacing[padding];
  const shadowValue = theme.resolvedTokens.shadows[shadow];
  
  const cardClasses = [
    'ds-card',
    'bg-white rounded-lg',
    border ? 'border border-gray-200' : '',
    className
  ].filter(Boolean).join(' ');
  
  const cardStyle = {
    padding: paddingValue,
    boxShadow: shadowValue,
    ...rest.style
  };
  
  return (
    <div className={cardClasses} style={cardStyle} {...rest}>
      {children}
    </div>
  );
}

function CardHeader({ children, className = '', ...rest }: { children: ReactNode; className?: string }) {
  return (
    <div className={'ds-card-header pb-4 mb-4 border-b border-gray-100 ' + className} {...rest}>
      {children}
    </div>
  );
}

function CardBody({ children, className = '', ...rest }: { children: ReactNode; className?: string }) {
  return (
    <div className={'ds-card-body ' + className} {...rest}>
      {children}
    </div>
  );
}

function CardFooter({ children, className = '', ...rest }: { children: ReactNode; className?: string }) {
  return (
    <div className={'ds-card-footer pt-4 mt-4 border-t border-gray-100 ' + className} {...rest}>
      {children}
    </div>
  );
}

// Attach sub-components
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

// TODO: Implement Component Documentation System
interface ComponentDocProps {
  component: ComponentType<any>;
  examples: Array<{
    title: string;
    description: string;
    code: string;
    component: ReactNode;
  }>;
  props?: Array<{
    name: string;
    type: string;
    required?: boolean;
    default?: string;
    description: string;
  }>;
}

function ComponentDoc({ component: Component, examples, props }: ComponentDocProps) {
  // TODO: Implement component documentation generator
  // Display component examples with live preview
  // Show prop documentation
  // Generate usage code snippets
  // Support interactive examples
  
  const [activeExample, setActiveExample] = useState(0);
  
  return (
    <div className="component-doc space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">{Component.displayName || 'Component'}</h2>
        
        {/* Examples */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Examples</h3>
          
          <div className="flex space-x-2 border-b">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => setActiveExample(index)}
                className={'px-4 py-2 text-sm font-medium border-b-2 transition-colors ' + (
                  activeExample === index
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {example.title}
              </button>
            ))}
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">{examples[activeExample].title}</h4>
              <p className="text-gray-600 text-sm mb-4">{examples[activeExample].description}</p>
            </div>
            
            {/* Live Preview */}
            <div className="p-6 border rounded-lg bg-gray-50">
              {examples[activeExample].component}
            </div>
            
            {/* Code */}
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                <code>{examples[activeExample].code}</code>
              </pre>
            </div>
          </div>
        </div>
        
        {/* Props Documentation */}
        {props && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Props</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Name</th>
                    <th className="px-4 py-2 text-left font-medium">Type</th>
                    <th className="px-4 py-2 text-left font-medium">Required</th>
                    <th className="px-4 py-2 text-left font-medium">Default</th>
                    <th className="px-4 py-2 text-left font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {props.map((prop, index) => (
                    <tr key={prop.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 font-mono text-sm">{prop.name}</td>
                      <td className="px-4 py-2 font-mono text-sm text-blue-600">{prop.type}</td>
                      <td className="px-4 py-2 text-sm">
                        {prop.required ? (
                          <span className="text-red-600">Yes</span>
                        ) : (
                          <span className="text-gray-500">No</span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-sm text-gray-600">
                        {prop.default || '-'}
                      </td>
                      <td className="px-4 py-2 text-sm">{prop.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// TODO: Implement Theme Customization Tools
interface ThemeCustomizerProps {
  onTokenChange: (tokens: Partial<DesignTokens>) => void;
}

function ThemeCustomizer({ onTokenChange }: ThemeCustomizerProps) {
  // TODO: Implement visual theme customization interface
  // Color picker for theme colors
  // Typography scale adjustments
  // Spacing and sizing controls
  // Live preview of changes
  // Export/import theme configurations
  
  const theme = useTheme();
  const [customColors, setCustomColors] = useState(theme.resolvedTokens.colors);
  
  const handleColorChange = (colorFamily: string, shade: string, value: string) => {
    const newColors = {
      ...customColors,
      [colorFamily]: {
        ...customColors[colorFamily as keyof typeof customColors],
        [shade]: value
      }
    };
    
    setCustomColors(newColors);
    onTokenChange({ colors: newColors });
  };
  
  return (
    <div className="theme-customizer p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Theme Customizer</h3>
      
      <div className="space-y-6">
        {/* Color Customization */}
        <div>
          <h4 className="font-medium mb-3">Colors</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(customColors).slice(0, 5).map(([colorFamily, colors]) => (
              <div key={colorFamily} className="space-y-2">
                <label className="text-sm font-medium capitalize">{colorFamily}</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(colors as Record<string, string>).slice(0, 3).map(([shade, value]) => (
                    <div key={shade} className="space-y-1">
                      <label className="text-xs text-gray-500">{shade}</label>
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => handleColorChange(colorFamily, shade, e.target.value)}
                        className="w-full h-8 rounded border"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Mode Toggle */}
        <div>
          <h4 className="font-medium mb-3">Theme Mode</h4>
          <div className="flex space-x-2">
            {(['light', 'dark', 'auto'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => theme.setMode(mode)}
                className={'px-3 py-1 rounded text-sm transition-colors ' + (
                  theme.mode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                )}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export all components and utilities for testing
export { 
  ThemeProvider, 
  useTheme,
  Button,
  Card,
  ComponentDoc,
  ThemeCustomizer,
  createVariants,
  createExtensibleComponent,
  mergeTokens,
  applyDarkModeTokens,
  createCSSVariables
};

// TODO: Implement demo component showcasing design system patterns
export default function DesignSystemDemo() {
  const [selectedPattern, setSelectedPattern] = useState<'tokens' | 'variants' | 'components' | 'customizer'>('tokens');
  const [customTokens, setCustomTokens] = useState<Partial<DesignTokens>>({});
  
  // Example component documentation
  const buttonExamples = [
    {
      title: 'Variants',
      description: 'Different visual styles for various use cases',
      code: 'Button variant="solid" color="primary">Solid Button</Button>\n<Button variant="outline" color="secondary">Outline Button</Button>\n<Button variant="ghost" color="success">Ghost Button</Button>',
      component: (
        <div className="flex space-x-4">
          <Button variant="solid" color="primary">Solid Button</Button>
          <Button variant="outline" color="secondary">Outline Button</Button>  
          <Button variant="ghost" color="success">Ghost Button</Button>
        </div>
      )
    },
    {
      title: 'Sizes',
      description: 'Different sizes for various hierarchical contexts',
      code: '<Button size="xs">Extra Small</Button>\n<Button size="sm">Small</Button>\n<Button size="md">Medium</Button>\n<Button size="lg">Large</Button>',
      component: (
        <div className="flex items-center space-x-4">
          <Button size="xs">XS</Button>
          <Button size="sm">SM</Button>
          <Button size="md">MD</Button>
          <Button size="lg">LG</Button>
        </div>
      )
    }
  ];
  
  return (
    <ThemeProvider customTokens={customTokens}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Design System Patterns
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Master enterprise design system architecture: tokens, variants, extensible components, and team scalability.
              Build production-ready design systems for large organizations.
            </p>
          </div>

          {/* Pattern selector */}
          <div className="flex justify-center space-x-4">
            {(['tokens', 'variants', 'components', 'customizer'] as const).map(pattern => (
              <button
                key={pattern}
                onClick={() => setSelectedPattern(pattern)}
                className={'px-4 py-2 rounded-md transition-colors ' + (
                  selectedPattern === pattern
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                )}
              >
                {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
              </button>
            ))}
          </div>

          {/* Demo content */}
          <div className="space-y-8">
            {selectedPattern === 'tokens' && (
              <Card>
                <Card.Header>
                  <h2 className="text-xl font-semibold">Design Tokens</h2>
                  <p className="text-gray-600">Foundational design decisions as data</p>
                </Card.Header>
                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">Colors</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded bg-blue-500"></div>
                          <span className="text-sm">Primary</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded bg-green-500"></div>
                          <span className="text-sm">Success</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded bg-red-500"></div>
                          <span className="text-sm">Error</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-3">Typography</h3>
                      <div className="space-y-2">
                        <div className="text-xs">Extra Small</div>
                        <div className="text-sm">Small</div>
                        <div className="text-base">Base</div>
                        <div className="text-lg">Large</div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-3">Spacing</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400"></div>
                          <span className="text-sm">2 (0.5rem)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gray-400"></div>
                          <span className="text-sm">4 (1rem)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-400"></div>
                          <span className="text-sm">6 (1.5rem)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}
            
            {selectedPattern === 'components' && (
              <ComponentDoc 
                component={Button}
                examples={buttonExamples}
                props={[
                  { name: 'variant', type: '"solid" | "outline" | "ghost" | "link"', default: '"solid"', description: 'Visual style variant' },
                  { name: 'size', type: '"xs" | "sm" | "md" | "lg" | "xl"', default: '"md"', description: 'Button size' },
                  { name: 'color', type: '"primary" | "secondary" | "success" | "warning" | "error"', default: '"primary"', description: 'Color theme' },
                  { name: 'disabled', type: 'boolean', description: 'Whether the button is disabled' },
                  { name: 'loading', type: 'boolean', description: 'Whether the button shows loading state' }
                ]}
              />
            )}
            
            {selectedPattern === 'customizer' && (
              <ThemeCustomizer onTokenChange={setCustomTokens} />
            )}
            
            {selectedPattern === 'variants' && (
              <Card>
                <Card.Header>
                  <h2 className="text-xl font-semibold">Variant System</h2>
                  <p className="text-gray-600">Systematic approach to component variations</p>
                </Card.Header>
                <Card.Body>
                  <p className="text-gray-600">
                    TODO: Implement comprehensive variant system examples showcasing:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 mt-4">
                    <li>Compound variant combinations</li>
                    <li>Responsive variant breakpoints</li>
                    <li>Performance-optimized class generation</li>
                    <li>Type-safe variant APIs</li>
                    <li>Default variant inheritance</li>
                    <li>Runtime variant validation</li>
                  </ul>
                </Card.Body>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}