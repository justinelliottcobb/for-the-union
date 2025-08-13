import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  forwardRef,
  ReactNode,
  ComponentType,
  ElementType,
  CSSProperties,
  HTMLAttributes
} from 'react';

// Design System Architecture & Component Libraries
// Production-ready design system with tokens, variants, and extensible components

// =============================================================================
// TASK 1: Design Token System
// =============================================================================

interface ColorTokens {
  50?: string;
  100?: string;
  200?: string;
  300?: string;
  400?: string;
  500?: string;
  600?: string;
  700?: string;
  800?: string;
  900?: string;
}

interface SemanticColors {
  background: string;
  foreground: string;
  muted: string;
  accent: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
}

interface TypographyTokens {
  fontSizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

interface SpacingTokens {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  6: string;
  8: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
}

interface ShadowTokens {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
}

interface BorderRadiusTokens {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  full: string;
}

export interface DesignTokens {
  colors: {
    primary: ColorTokens;
    secondary: ColorTokens;
    gray: ColorTokens;
    semantic: SemanticColors;
  };
  typography: TypographyTokens;
  spacing: SpacingTokens;
  shadows: ShadowTokens;
  borderRadius: BorderRadiusTokens;
}

export const defaultTokens: DesignTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a'
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    },
    semantic: {
      background: '#ffffff',
      foreground: '#1a202c',
      muted: '#f7fafc',
      accent: '#3b82f6',
      destructive: '#ef4444',
      border: '#e5e7eb',
      input: '#ffffff',
      ring: '#3b82f6'
    }
  },
  typography: {
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
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em'
    }
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem'
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px'
  }
};

// Token merging utility
export const mergeTokens = (baseTokens: DesignTokens, overrides: Partial<DesignTokens>): DesignTokens => {
  const result = { ...baseTokens };
  
  Object.keys(overrides).forEach(key => {
    const overrideValue = overrides[key as keyof DesignTokens];
    if (overrideValue && typeof overrideValue === 'object' && !Array.isArray(overrideValue)) {
      result[key as keyof DesignTokens] = {
        ...result[key as keyof DesignTokens],
        ...overrideValue
      } as any;
    } else if (overrideValue !== undefined) {
      result[key as keyof DesignTokens] = overrideValue as any;
    }
  });
  
  return result;
};

// Dark mode token transformation
export const applyDarkModeTokens = (tokens: DesignTokens): DesignTokens => {
  const darkTokens = { ...tokens };
  
  // Transform semantic colors for dark mode
  darkTokens.colors.semantic = {
    background: '#0f172a',
    foreground: '#f8fafc',
    muted: '#1e293b',
    accent: '#60a5fa',
    destructive: '#f87171',
    border: '#334155',
    input: '#1e293b',
    ring: '#60a5fa'
  };
  
  return darkTokens;
};

// CSS Variables generation
export const createCSSVariables = (tokens: DesignTokens): Record<string, string> => {
  const variables: Record<string, string> = {};
  
  // Colors
  Object.entries(tokens.colors).forEach(([category, colors]) => {
    if (category === 'semantic') {
      Object.entries(colors).forEach(([name, value]) => {
        variables[`--color-${name}`] = value;
      });
    } else {
      Object.entries(colors).forEach(([shade, value]) => {
        variables[`--color-${category}-${shade}`] = value;
      });
    }
  });
  
  // Typography
  Object.entries(tokens.typography.fontSizes).forEach(([size, value]) => {
    variables[`--font-size-${size}`] = value;
  });
  
  Object.entries(tokens.typography.fontWeights).forEach(([weight, value]) => {
    variables[`--font-weight-${weight}`] = value.toString();
  });
  
  // Spacing
  Object.entries(tokens.spacing).forEach(([size, value]) => {
    variables[`--spacing-${size}`] = value;
  });
  
  // Shadows
  Object.entries(tokens.shadows).forEach(([size, value]) => {
    variables[`--shadow-${size}`] = value;
  });
  
  // Border radius
  Object.entries(tokens.borderRadius).forEach(([size, value]) => {
    variables[`--radius-${size}`] = value;
  });
  
  return variables;
};

// =============================================================================
// TASK 2: Theme Provider System
// =============================================================================

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedTokens: DesignTokens;
  cssVariables: Record<string, string>;
  onTokenChange: (tokens: Partial<DesignTokens>) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  customTokens?: Partial<DesignTokens>;
  defaultMode?: ThemeMode;
  onTokenChange?: (tokens: Partial<DesignTokens>) => void;
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  customTokens = {},
  defaultMode = 'light',
  onTokenChange: onTokenChangeProp,
  children
}) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      return (localStorage.getItem('theme-mode') as ThemeMode) || defaultMode;
    } catch {
      return defaultMode;
    }
  });
  
  const [customTokenOverrides, setCustomTokenOverrides] = useState<Partial<DesignTokens>>(customTokens);

  // System preference detection for auto mode
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('theme-mode', newMode);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const onTokenChange = useCallback((tokens: Partial<DesignTokens>) => {
    setCustomTokenOverrides(prev => mergeTokens(defaultTokens, { ...prev, ...tokens }));
    onTokenChangeProp?.(tokens);
  }, [onTokenChangeProp]);

  const resolvedTokens = useMemo(() => {
    const baseTokens = mergeTokens(defaultTokens, customTokenOverrides);
    const effectiveMode = mode === 'auto' ? (systemPrefersDark ? 'dark' : 'light') : mode;
    
    return effectiveMode === 'dark' ? applyDarkModeTokens(baseTokens) : baseTokens;
  }, [mode, systemPrefersDark, customTokenOverrides]);

  const cssVariables = useMemo(() => createCSSVariables(resolvedTokens), [resolvedTokens]);

  const contextValue = useMemo(() => ({
    mode,
    setMode,
    resolvedTokens,
    cssVariables,
    onTokenChange
  }), [mode, setMode, resolvedTokens, cssVariables, onTokenChange]);

  // Apply CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [cssVariables]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// =============================================================================
// TASK 3: Variant System Architecture
// =============================================================================

interface VariantConfig {
  [variantKey: string]: {
    [variantValue: string]: string;
  };
}

interface CompoundVariant {
  [variantKey: string]: string;
  class: string;
}

interface VariantSchema {
  variants: VariantConfig;
  compoundVariants?: CompoundVariant[];
  defaultVariants?: Record<string, string>;
  base?: string;
}

export const createVariants = (schema: VariantSchema) => {
  return function resolveVariants(props: Record<string, any>): string {
    const classes: string[] = [];
    
    // Add base classes
    if (schema.base) {
      classes.push(schema.base);
    }
    
    // Apply variant classes
    Object.entries(schema.variants).forEach(([variantKey, variantValues]) => {
      const propValue = props[variantKey] || schema.defaultVariants?.[variantKey];
      if (propValue && variantValues[propValue]) {
        classes.push(variantValues[propValue]);
      }
    });
    
    // Apply compound variant classes
    schema.compoundVariants?.forEach(compoundVariant => {
      const { class: compoundClass, ...conditions } = compoundVariant;
      const matches = Object.entries(conditions).every(([key, value]) => props[key] === value);
      if (matches) {
        classes.push(compoundClass);
      }
    });
    
    // Handle responsive variants (simplified implementation)
    Object.keys(props).forEach(propKey => {
      const propValue = props[propKey];
      if (typeof propValue === 'object' && propValue !== null) {
        Object.entries(propValue).forEach(([breakpoint, value]) => {
          if (schema.variants[propKey] && schema.variants[propKey][value as string]) {
            classes.push(`${breakpoint}:${schema.variants[propKey][value as string]}`);
          }
        });
      }
    });
    
    return classes.join(' ');
  };
};

// =============================================================================
// TASK 4: Extensible Component Factory
// =============================================================================

interface ExtensibleComponentProps<T extends ElementType = 'div'> extends HTMLAttributes<HTMLElement> {
  as?: T;
  variant?: string;
  size?: string;
  color?: string;
  disabled?: boolean;
  className?: string;
}

export const createExtensibleComponent = <T extends ElementType = 'div'>(
  displayName: string,
  defaultElement: T,
  variantSchema?: VariantSchema
) => {
  const Component = forwardRef<
    HTMLElement,
    ExtensibleComponentProps<T>
  >(({ as, className = '', ...props }, ref) => {
    const theme = useTheme();
    const Element = (as || defaultElement) as ElementType;
    
    const variantClasses = useMemo(() => {
      if (variantSchema) {
        const resolveVariants = createVariants(variantSchema);
        return resolveVariants(props);
      }
      return '';
    }, [props]);
    
    const componentClasses = useMemo(() => {
      const baseClass = `ds-${displayName.toLowerCase()}`;
      return [baseClass, variantClasses, className].filter(Boolean).join(' ');
    }, [variantClasses, className]);
    
    return (
      <Element
        ref={ref}
        className={componentClasses}
        {...props}
      />
    );
  });
  
  Component.displayName = displayName;
  return Component;
};

// Example components using the factory
const buttonVariants: VariantSchema = {
  base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline'
    },
    size: {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10'
    }
  },
  compoundVariants: [
    {
      variant: 'destructive',
      size: 'sm',
      class: 'text-xs'
    }
  ],
  defaultVariants: {
    variant: 'default',
    size: 'default'
  }
};

export const Button = createExtensibleComponent('Button', 'button', buttonVariants);

// =============================================================================
// TASK 5: Card Component with Compound Pattern
// =============================================================================

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: keyof SpacingTokens;
  shadow?: keyof ShadowTokens;
  border?: boolean;
  children: ReactNode;
}

export const Card: React.FC<CardProps> & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
} = ({ 
  padding = '6',
  shadow = 'base',
  border = true,
  className = '',
  style = {},
  children,
  ...props
}) => {
  const { resolvedTokens } = useTheme();
  
  const cardStyles: CSSProperties = {
    padding: resolvedTokens.spacing[padding],
    boxShadow: resolvedTokens.shadows[shadow],
    borderRadius: resolvedTokens.borderRadius.lg,
    backgroundColor: resolvedTokens.colors.semantic.background,
    ...(border && {
      border: `1px solid ${resolvedTokens.colors.semantic.border}`
    }),
    ...style
  };
  
  return (
    <div
      className={`ds-card ${className}`}
      style={cardStyles}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => {
  const { resolvedTokens } = useTheme();
  return (
    <div 
      className={`ds-card-header ${className}`}
      style={{
        marginBottom: resolvedTokens.spacing[4],
        paddingBottom: resolvedTokens.spacing[4],
        borderBottom: `1px solid ${resolvedTokens.colors.semantic.border}`
      }}
    >
      {children}
    </div>
  );
};

const CardBody: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`ds-card-body ${className}`}>
    {children}
  </div>
);

const CardFooter: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => {
  const { resolvedTokens } = useTheme();
  return (
    <div 
      className={`ds-card-footer ${className}`}
      style={{
        marginTop: resolvedTokens.spacing[4],
        paddingTop: resolvedTokens.spacing[4],
        borderTop: `1px solid ${resolvedTokens.colors.semantic.border}`
      }}
    >
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

// =============================================================================
// TASK 5: Component Documentation System
// =============================================================================

interface ComponentExample {
  name: string;
  description: string;
  code: string;
  component: ReactNode;
}

interface ComponentDocProps {
  component: ComponentType<any>;
  examples: ComponentExample[];
  props: Array<{
    name: string;
    type: string;
    default?: string;
    description: string;
  }>;
}

export const ComponentDoc: React.FC<ComponentDocProps> = ({ 
  component, 
  examples, 
  props 
}) => {
  const [activeExample, setActiveExample] = useState(0);
  
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  }, []);
  
  return (
    <div className="component-doc">
      <div className="examples-section">
        <div className="example-tabs">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setActiveExample(index)}
              className={`tab ${activeExample === index ? 'active' : ''}`}
              style={{
                padding: '8px 16px',
                border: 'none',
                backgroundColor: activeExample === index ? '#007acc' : '#f5f5f5',
                color: activeExample === index ? 'white' : '#333',
                cursor: 'pointer'
              }}
            >
              {example.name}
            </button>
          ))}
        </div>
        
        <div className="example-content">
          <div className="example-preview" style={{ padding: '20px', border: '1px solid #e5e7eb' }}>
            {examples[activeExample]?.component}
          </div>
          
          <div className="example-code" style={{ position: 'relative' }}>
            <button
              onClick={() => copyToClipboard(examples[activeExample]?.code || '')}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '4px 8px',
                background: '#007acc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Copy
            </button>
            <pre
              style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                overflow: 'auto',
                fontSize: '14px'
              }}
            >
              <code>{examples[activeExample]?.code}</code>
            </pre>
          </div>
        </div>
      </div>
      
      <div className="props-section" style={{ marginTop: '40px' }}>
        <h3>Props</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Default</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {props.map((prop, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{prop.name}</td>
                <td style={{ padding: '8px', fontFamily: 'monospace', color: '#007acc' }}>{prop.type}</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{prop.default || '-'}</td>
                <td style={{ padding: '8px' }}>{prop.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =============================================================================
// TASK 6: Theme Customization Tools
// =============================================================================

interface ThemeCustomizerProps {
  onTokenChange: (tokens: Partial<DesignTokens>) => void;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ onTokenChange }) => {
  const { mode, setMode, resolvedTokens } = useTheme();
  const [customColors, setCustomColors] = useState({
    primaryMain: resolvedTokens.colors.primary[500] || '#3b82f6',
    semanticBackground: resolvedTokens.colors.semantic.background,
    semanticForeground: resolvedTokens.colors.semantic.foreground
  });

  const handleColorChange = useCallback((colorKey: string, value: string) => {
    setCustomColors(prev => ({ ...prev, [colorKey]: value }));
    
    const tokenUpdates: Partial<DesignTokens> = {};
    
    if (colorKey === 'primaryMain') {
      tokenUpdates.colors = {
        primary: { ...resolvedTokens.colors.primary, 500: value }
      };
    } else if (colorKey === 'semanticBackground') {
      tokenUpdates.colors = {
        semantic: { ...resolvedTokens.colors.semantic, background: value }
      };
    } else if (colorKey === 'semanticForeground') {
      tokenUpdates.colors = {
        semantic: { ...resolvedTokens.colors.semantic, foreground: value }
      };
    }
    
    onTokenChange(tokenUpdates);
  }, [resolvedTokens, onTokenChange]);

  return (
    <div className="theme-customizer" style={{ padding: '20px', border: '1px solid #e5e7eb' }}>
      <h3>Theme Customizer</h3>
      
      <div className="mode-section" style={{ marginBottom: '20px' }}>
        <h4>Theme Mode</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['light', 'dark', 'auto'] as ThemeMode[]).map(modeOption => (
            <button
              key={modeOption}
              onClick={() => setMode(modeOption)}
              style={{
                padding: '8px 16px',
                border: '1px solid #e5e7eb',
                backgroundColor: mode === modeOption ? '#007acc' : 'white',
                color: mode === modeOption ? 'white' : '#333',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {modeOption.charAt(0).toUpperCase() + modeOption.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="color-section">
        <h4>Colors</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ width: '150px' }}>Primary Main:</label>
            <input
              type="color"
              value={customColors.primaryMain}
              onChange={(e) => handleColorChange('primaryMain', e.target.value)}
              style={{ width: '50px', height: '30px' }}
            />
            <input
              type="text"
              value={customColors.primaryMain}
              onChange={(e) => handleColorChange('primaryMain', e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ width: '150px' }}>Background:</label>
            <input
              type="color"
              value={customColors.semanticBackground}
              onChange={(e) => handleColorChange('semanticBackground', e.target.value)}
              style={{ width: '50px', height: '30px' }}
            />
            <input
              type="text"
              value={customColors.semanticBackground}
              onChange={(e) => handleColorChange('semanticBackground', e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ width: '150px' }}>Foreground:</label>
            <input
              type="color"
              value={customColors.semanticForeground}
              onChange={(e) => handleColorChange('semanticForeground', e.target.value)}
              style={{ width: '50px', height: '30px' }}
            />
            <input
              type="text"
              value={customColors.semanticForeground}
              onChange={(e) => handleColorChange('semanticForeground', e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// DEMO COMPONENT
// =============================================================================

export const DesignSystemDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tokens');

  const buttonExamples: ComponentExample[] = [
    {
      name: 'Default',
      description: 'Standard button with primary styling',
      code: '<Button>Click me</Button>',
      component: <Button>Click me</Button>
    },
    {
      name: 'Variants',
      description: 'Different button variants',
      code: `<div style={{ display: 'flex', gap: '8px' }}>
  <Button variant="default">Default</Button>
  <Button variant="outline">Outline</Button>
  <Button variant="ghost">Ghost</Button>
</div>`,
      component: (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="default">Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      )
    },
    {
      name: 'Sizes',
      description: 'Different button sizes',
      code: `<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
  <Button size="sm">Small</Button>
  <Button size="default">Default</Button>
  <Button size="lg">Large</Button>
</div>`,
      component: (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
      )
    }
  ];

  const buttonProps = [
    { name: 'variant', type: 'string', default: 'default', description: 'Button style variant' },
    { name: 'size', type: 'string', default: 'default', description: 'Button size' },
    { name: 'disabled', type: 'boolean', description: 'Whether the button is disabled' },
    { name: 'as', type: 'ElementType', description: 'Component or element to render as' }
  ];

  return (
    <ThemeProvider>
      <div style={{ padding: '20px', maxWidth: '1000px' }}>
        <h2>Design System Architecture & Component Libraries</h2>
        
        <div className="demo-tabs" style={{ marginBottom: '20px' }}>
          {[
            { id: 'tokens', label: 'Design Tokens' },
            { id: 'components', label: 'Components' },
            { id: 'docs', label: 'Documentation' },
            { id: 'customizer', label: 'Theme Customizer' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                border: '1px solid #e5e7eb',
                backgroundColor: activeTab === tab.id ? '#007acc' : 'white',
                color: activeTab === tab.id ? 'white' : '#333',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                marginRight: '4px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {activeTab === 'tokens' && (
          <div>
            <h3>Design Token System</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <Card>
                <Card.Header>
                  <h4>Color Tokens</h4>
                </Card.Header>
                <Card.Body>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.entries(defaultTokens.colors.primary).map(([shade, color]) => (
                      <div
                        key={shade}
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: color,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: parseInt(shade) > 400 ? 'white' : 'black',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                        title={`${shade}: ${color}`}
                      >
                        {shade}
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
              
              <Card>
                <Card.Header>
                  <h4>Typography Tokens</h4>
                </Card.Header>
                <Card.Body>
                  {Object.entries(defaultTokens.typography.fontSizes).map(([size, value]) => (
                    <div key={size} style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: value, fontWeight: 'bold' }}>
                        {size}: {value}
                      </span>
                    </div>
                  ))}
                </Card.Body>
              </Card>
              
              <Card>
                <Card.Header>
                  <h4>Spacing Tokens</h4>
                </Card.Header>
                <Card.Body>
                  {Object.entries(defaultTokens.spacing).slice(1, 8).map(([size, value]) => (
                    <div key={size} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: value,
                          height: '20px',
                          backgroundColor: '#3b82f6',
                          marginRight: '12px'
                        }}
                      />
                      <span>{size}: {value}</span>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </div>
          </div>
        )}
        
        {activeTab === 'components' && (
          <div>
            <h3>Component Examples</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Card>
                <Card.Header>
                  <h4>Button Components</h4>
                </Card.Header>
                <Card.Body>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Button variant="default">Default</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                </Card.Body>
              </Card>
              
              <Card>
                <Card.Header>
                  <h4>Card with Compound Components</h4>
                </Card.Header>
                <Card.Body>
                  This card demonstrates the compound component pattern with Header, Body, and Footer components.
                </Card.Body>
                <Card.Footer>
                  <Button size="sm">Action</Button>
                </Card.Footer>
              </Card>
            </div>
          </div>
        )}
        
        {activeTab === 'docs' && (
          <div>
            <h3>Component Documentation</h3>
            <ComponentDoc
              component={Button}
              examples={buttonExamples}
              props={buttonProps}
            />
          </div>
        )}
        
        {activeTab === 'customizer' && (
          <div>
            <h3>Live Theme Customization</h3>
            <ThemeCustomizer onTokenChange={(tokens) => console.log('Token changes:', tokens)} />
            
            <div style={{ marginTop: '20px' }}>
              <h4>Preview Components</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button>Primary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Card style={{ width: '200px' }}>
                  <Card.Header>Card Title</Card.Header>
                  <Card.Body>Card content with theme colors</Card.Body>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
};

// All components and utilities are exported individually above