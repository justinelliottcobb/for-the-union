import React, { useState } from 'react';

// Complete solution with all components implemented
export const Button: React.FC<{
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}> = ({ variant = 'primary', size = 'md', children }) => {
  const getButtonStyles = () => {
    const baseStyles = { padding: '8px 16px', border: 'none', borderRadius: '4px' };
    const variantStyles = variant === 'primary' ? { backgroundColor: '#007bff', color: 'white' } : { backgroundColor: '#6c757d', color: 'white' };
    const sizeStyles = size === 'sm' ? { fontSize: '12px' } : size === 'lg' ? { fontSize: '18px' } : { fontSize: '14px' };
    
    return { ...baseStyles, ...variantStyles, ...sizeStyles };
  };

  return (
    <button 
      style={getButtonStyles()}
      data-testid={`button-${variant}-${size}`}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<{
  title?: string;
  children: React.ReactNode;
  elevated?: boolean;
}> = ({ title, children, elevated = false }) => {
  const cardStyles = {
    padding: '16px',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    boxShadow: elevated ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
  };

  return (
    <div style={cardStyles} data-testid="card" data-elevated={elevated}>
      {title && <h3 data-testid="card-title" style={{ margin: '0 0 12px 0' }}>{title}</h3>}
      <div data-testid="card-content">{children}</div>
    </div>
  );
};

export const SnapshotVisualTestingDemo: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const themeStyles = {
    backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a',
    color: theme === 'light' ? '#333333' : '#ffffff',
    padding: '20px',
    minHeight: '100vh'
  };

  return (
    <div style={themeStyles} data-testid="snapshot-visual-testing-demo" data-theme={theme}>
      <button 
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        style={{ marginBottom: '20px' }}
      >
        Toggle Theme ({theme})
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
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <Card title="Basic Card">
          <p>This is a basic card for visual testing.</p>
        </Card>
        
        <Card title="Elevated Card" elevated>
          <p>This is an elevated card with shadow for visual regression testing.</p>
        </Card>
        
        <Card elevated>
          <p>Card without title but with elevation.</p>
        </Card>
      </div>
    </div>
  );
};

export default SnapshotVisualTestingDemo;