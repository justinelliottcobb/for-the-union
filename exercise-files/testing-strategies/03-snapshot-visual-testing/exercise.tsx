import React, { useState } from 'react';

// =============================================================================
// EXERCISE: Snapshot & Visual Testing
// =============================================================================
// Learn comprehensive snapshot testing and visual regression strategies
// Focus: Component snapshots, visual regression, responsive testing, theme testing
// Tools: Jest snapshots, React Testing Library, visual testing workflows
//
// Complete all TODO sections to build visual testing knowledge
// =============================================================================

// =============================================================================
// BUTTON COMPONENT INTERFACES
// =============================================================================

export interface ButtonVariant {
  type: 'primary' | 'secondary' | 'danger' | 'success';
  styles: React.CSSProperties;
}

export interface ButtonSize {
  type: 'sm' | 'md' | 'lg';
  styles: React.CSSProperties;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  disabled?: boolean;
}

// =============================================================================
// BUTTON STYLE MANAGER
// =============================================================================

export class ButtonStyleManager {
  private variants: Map<string, ButtonVariant> = new Map();
  private sizes: Map<string, ButtonSize> = new Map();

  constructor() {
    this.initializeVariants();
    this.initializeSizes();
  }

  // TODO: Initialize button variant styles
  private initializeVariants(): void {
    // TODO: Define primary variant styles
    this.variants.set('primary', {
      type: 'primary',
      styles: {
        backgroundColor: '#007bff',
        color: 'white',
        border: '1px solid #007bff'
      }
    });

    // TODO: Define secondary variant styles
    this.variants.set('secondary', {
      type: 'secondary',
      styles: {
        backgroundColor: '#6c757d',
        color: 'white',
        border: '1px solid #6c757d'
      }
    });
  }

  // TODO: Initialize button size styles
  private initializeSizes(): void {
    // TODO: Define small size styles
    this.sizes.set('sm', {
      type: 'sm',
      styles: {
        padding: '4px 8px',
        fontSize: '12px'
      }
    });

    // TODO: Define medium size styles
    this.sizes.set('md', {
      type: 'md',
      styles: {
        padding: '8px 16px',
        fontSize: '14px'
      }
    });

    // TODO: Define large size styles
    this.sizes.set('lg', {
      type: 'lg',
      styles: {
        padding: '12px 24px',
        fontSize: '16px'
      }
    });
  }

  // TODO: Get combined button styles
  getButtonStyles(variant: string, size: string): React.CSSProperties {
    const baseStyles: React.CSSProperties = {
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    };

    const variantStyles = this.variants.get(variant)?.styles || {};
    const sizeStyles = this.sizes.get(size)?.styles || {};

    return { ...baseStyles, ...variantStyles, ...sizeStyles };
  }
}

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children,
  disabled = false 
}) => {
  // TODO: Create style manager instance
  const styleManager = new ButtonStyleManager();

  // TODO: Get button styles
  const buttonStyles = styleManager.getButtonStyles(variant, size);

  // TODO: Generate data attributes
  const getDataTestId = () => {
    return 'button-component';
  };

  return (
    <button 
      style={buttonStyles}
      data-testid={getDataTestId()}
      data-variant={variant}
      data-size={size}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// =============================================================================
// CARD COMPONENT INTERFACES
// =============================================================================

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  elevated?: boolean;
  theme?: 'light' | 'dark';
}

export interface CardTheme {
  backgroundColor: string;
  color: string;
  borderColor: string;
}

// =============================================================================
// CARD STYLE MANAGER
// =============================================================================

export class CardStyleManager {
  private themes: Map<string, CardTheme> = new Map();

  constructor() {
    this.initializeThemes();
  }

  // TODO: Initialize card themes
  private initializeThemes(): void {
    // TODO: Define light theme
    this.themes.set('light', {
      backgroundColor: '#ffffff',
      color: '#333333',
      borderColor: '#dee2e6'
    });

    // TODO: Define dark theme
    this.themes.set('dark', {
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      borderColor: '#444444'
    });
  }

  // TODO: Get card styles
  getCardStyles(theme: string, elevated: boolean): React.CSSProperties {
    const themeStyles = this.themes.get(theme) || this.themes.get('light')!;
    
    const baseStyles: React.CSSProperties = {
      padding: '16px',
      border: '1px solid ' + themeStyles.borderColor,
      borderRadius: '4px',
      backgroundColor: themeStyles.backgroundColor,
      color: themeStyles.color
    };

    if (elevated) {
      baseStyles.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    }

    return baseStyles;
  }
}

// =============================================================================
// CARD COMPONENT
// =============================================================================

export const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  elevated = false,
  theme = 'light' 
}) => {
  // TODO: Create style manager instance
  const styleManager = new CardStyleManager();

  // TODO: Get card styles
  const cardStyles = styleManager.getCardStyles(theme, elevated);

  return (
    <div style={cardStyles} data-testid="card" data-elevated={elevated} data-theme={theme}>
      {title && (
        <h3 data-testid="card-title" style={{ margin: '0 0 12px 0' }}>
          {title}
        </h3>
      )}
      <div data-testid="card-content">
        {children}
      </div>
    </div>
  );
};

// =============================================================================
// DEMO COMPONENT FOR TESTING
// =============================================================================

export const SnapshotVisualTestingDemo: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // TODO: Handle theme toggle
  const handleThemeToggle = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // TODO: Get demo container styles
  const getContainerStyles = (): React.CSSProperties => {
    return {
      backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a',
      color: theme === 'light' ? '#333333' : '#ffffff',
      padding: '20px',
      minHeight: '100vh'
    };
  };

  return (
    <div style={getContainerStyles()} data-testid="snapshot-visual-testing-demo" data-theme={theme}>
      <button 
        onClick={handleThemeToggle}
        style={{ marginBottom: '20px' }}
        data-testid="theme-toggle"
      >
        Toggle Theme (current: {theme})
      </button>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <Button variant="primary" size="sm">Small Primary</Button>
        <Button variant="primary">Medium Primary</Button>
        <Button variant="primary" size="lg">Large Primary</Button>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <Button variant="secondary" size="sm">Small Secondary</Button>
        <Button variant="secondary">Medium Secondary</Button>
        <Button variant="secondary" size="lg">Large Secondary</Button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <Card title="Basic Card" theme={theme}>
          <p>This is a basic card for visual testing.</p>
        </Card>
        
        <Card title="Elevated Card" elevated theme={theme}>
          <p>This is an elevated card with shadow for visual regression testing.</p>
        </Card>
        
        <Card elevated theme={theme}>
          <p>Card without title but with elevation.</p>
        </Card>
      </div>
    </div>
  );
};

export default SnapshotVisualTestingDemo;