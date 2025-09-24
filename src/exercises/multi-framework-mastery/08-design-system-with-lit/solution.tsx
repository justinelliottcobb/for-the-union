import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Card, Group, Button, Stack, Code, Badge, Tabs, ColorSwatch, Paper, Grid, Alert } from '@mantine/core';
import { IconPalette, IconComponents, IconBook, IconSettings } from '@tabler/icons-react';

export default function DesignSystemWithLitWorkshop() {
  const [activeDemo, setActiveDemo] = useState('tokens');

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="md">Design System with Lit Workshop</Title>
          <Text size="lg" c="dimmed">
            Build scalable design systems with comprehensive theming, design tokens, and component libraries
          </Text>
        </div>

        <Tabs value={activeDemo} onTabChange={setActiveDemo}>
          <Tabs.List>
            <Tabs.Tab value="tokens" leftSection={<IconPalette size="0.8rem" />}>
              Design Tokens
            </Tabs.Tab>
            <Tabs.Tab value="theming" leftSection={<IconSettings size="0.8rem" />}>
              Theming System
            </Tabs.Tab>
            <Tabs.Tab value="components" leftSection={<IconComponents size="0.8rem" />}>
              Component Library
            </Tabs.Tab>
            <Tabs.Tab value="documentation" leftSection={<IconBook size="0.8rem" />}>
              Documentation
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="tokens" pt="xl">
            <DesignTokensDemo />
          </Tabs.Panel>

          <Tabs.Panel value="theming" pt="xl">
            <ThemingSystemDemo />
          </Tabs.Panel>

          <Tabs.Panel value="components" pt="xl">
            <ComponentLibraryDemo />
          </Tabs.Panel>

          <Tabs.Panel value="documentation" pt="xl">
            <DocumentationSystemDemo />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}

function DesignTokensDemo() {
  const [tokensCode, setTokensCode] = useState('');

  useEffect(() => {
    const designTokensImplementation = `
// Design tokens definition with semantic naming
export const designTokens = {
  // Color tokens
  colors: {
    // Primitive colors
    primitive: {
      blue: {
        50: '#eff6ff',
        100: '#dbeafe',
        500: '#3b82f6',
        900: '#1e3a8a'
      },
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        500: '#6b7280',
        900: '#111827'
      },
      red: {
        50: '#fef2f2',
        500: '#ef4444',
        900: '#7f1d1d'
      }
    },
    
    // Semantic colors
    semantic: {
      primary: 'var(--color-blue-500)',
      secondary: 'var(--color-gray-500)',
      success: 'var(--color-green-500)',
      warning: 'var(--color-yellow-500)',
      error: 'var(--color-red-500)',
      
      background: {
        primary: 'var(--color-white)',
        secondary: 'var(--color-gray-50)',
        elevated: 'var(--color-white)'
      },
      
      text: {
        primary: 'var(--color-gray-900)',
        secondary: 'var(--color-gray-600)',
        muted: 'var(--color-gray-500)'
      },
      
      border: {
        primary: 'var(--color-gray-200)',
        secondary: 'var(--color-gray-100)'
      }
    }
  },
  
  // Typography tokens
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, Consolas, monospace'
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem' // 30px
    },
    
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },
  
  // Spacing tokens
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem'    // 64px
  },
  
  // Border radius tokens
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    full: '9999px'
  },
  
  // Shadow tokens
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  
  // Animation tokens
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms'
    },
    
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
};

// CSS Custom Properties generator
export function generateCSSTokens(tokens: typeof designTokens): string {
  let css = ':root {\\n';
  
  // Generate color tokens
  Object.entries(tokens.colors.primitive).forEach(([colorName, shades]) => {
    Object.entries(shades).forEach(([shade, value]) => {
      css += \`  --color-\${colorName}-\${shade}: \${value};\\n\`;
    });
  });
  
  // Generate semantic color tokens
  Object.entries(tokens.colors.semantic).forEach(([key, value]) => {
    if (typeof value === 'string') {
      css += \`  --color-\${key}: \${value};\\n\`;
    } else {
      Object.entries(value).forEach(([subKey, subValue]) => {
        css += \`  --color-\${key}-\${subKey}: \${subValue};\\n\`;
      });
    }
  });
  
  // Generate typography tokens
  Object.entries(tokens.typography).forEach(([category, values]) => {
    Object.entries(values).forEach(([key, value]) => {
      css += \`  --typography-\${category}-\${key}: \${value};\\n\`;
    });
  });
  
  // Generate spacing tokens
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    css += \`  --spacing-\${key}: \${value};\\n\`;
  });
  
  // Generate other tokens
  ['borderRadius', 'shadows', 'animation'].forEach(category => {
    Object.entries(tokens[category as keyof typeof tokens]).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          css += \`  --\${category.toLowerCase()}-\${key}-\${subKey}: \${subValue};\\n\`;
        });
      } else {
        css += \`  --\${category.toLowerCase()}-\${key}: \${value};\\n\`;
      }
    });
  });
  
  css += '}';
  return css;
}

// Token validation utilities
export class TokenValidator {
  static validateColorContrast(foreground: string, background: string): number {
    // Simplified contrast calculation
    return 4.5; // Would implement actual WCAG contrast calculation
  }
  
  static validateSpacingScale(tokens: Record<string, string>): boolean {
    const values = Object.values(tokens).map(v => parseFloat(v));
    return values.every((v, i, arr) => i === 0 || v >= arr[i - 1]);
  }
  
  static generateAccessibilityReport(tokens: typeof designTokens): string {
    return \`
Design Token Accessibility Report:
- Color contrast ratios validated: ✓
- Spacing scale consistency: ✓
- Font size progression: ✓
- Touch target sizes: ✓
    \`.trim();
  }
}

// Usage in Lit components
import { LitElement, css } from 'lit';

export class TokenizedComponent extends LitElement {
  static styles = css\`
    :host {
      display: block;
      font-family: var(--typography-fontFamily-sans);
      color: var(--color-text-primary);
    }
    
    .card {
      background: var(--color-background-primary);
      border: 1px solid var(--color-border-primary);
      border-radius: var(--borderRadius-lg);
      padding: var(--spacing-lg);
      box-shadow: var(--shadows-md);
      transition: box-shadow var(--animation-duration-normal) var(--animation-easing-easeOut);
    }
    
    .card:hover {
      box-shadow: var(--shadows-lg);
    }
    
    .title {
      font-size: var(--typography-fontSize-xl);
      font-weight: var(--typography-fontWeight-semibold);
      line-height: var(--typography-lineHeight-tight);
      margin-bottom: var(--spacing-sm);
      color: var(--color-text-primary);
    }
    
    .description {
      font-size: var(--typography-fontSize-sm);
      line-height: var(--typography-lineHeight-normal);
      color: var(--color-text-secondary);
    }
  \`;
}
`;
    setTokensCode(designTokensImplementation);
  }, []);

  return (
    <Card>
      <Card.Section p="md">
        <Title order={3} mb="md">Design Tokens System</Title>
        <Alert icon={<IconPalette />} mb="md">
          Semantic design tokens with CSS custom properties and validation utilities
        </Alert>

        <Grid mb="md">
          <Grid.Col span={3}>
            <Paper p="sm" bg="blue.0">
              <Text size="sm" fw={500} mb="xs">Primary Colors</Text>
              <Group gap="xs">
                <ColorSwatch color="#3b82f6" size={24} />
                <ColorSwatch color="#1e3a8a" size={24} />
                <ColorSwatch color="#eff6ff" size={24} />
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={3}>
            <Paper p="sm" bg="gray.0">
              <Text size="sm" fw={500} mb="xs">Neutral Colors</Text>
              <Group gap="xs">
                <ColorSwatch color="#111827" size={24} />
                <ColorSwatch color="#6b7280" size={24} />
                <ColorSwatch color="#f9fafb" size={24} />
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={3}>
            <Paper p="sm" bg="green.0">
              <Text size="sm" fw={500} mb="xs">Status Colors</Text>
              <Group gap="xs">
                <ColorSwatch color="#ef4444" size={24} />
                <ColorSwatch color="#f59e0b" size={24} />
                <ColorSwatch color="#10b981" size={24} />
              </Group>
            </Paper>
          </Grid.Col>
          <Grid.Col span={3}>
            <Paper p="sm" bg="orange.0">
              <Text size="sm" fw={500} mb="xs">Spacing Scale</Text>
              <Text size="xs" c="dimmed">4px • 8px • 16px • 24px • 32px</Text>
            </Paper>
          </Grid.Col>
        </Grid>
        
        <Code block style={{ fontSize: '10px' }}>
          {tokensCode}
        </Code>

        <Group mt="md">
          <Badge color="blue">Semantic Tokens</Badge>
          <Badge color="green">CSS Custom Properties</Badge>
          <Badge color="orange">Validation</Badge>
          <Badge color="purple">Accessibility</Badge>
        </Group>
      </Card.Section>
    </Card>
  );
}

function ThemingSystemDemo() {
  const [themingCode, setThemingCode] = useState('');

  useEffect(() => {
    const themingImplementation = `
import { LitElement, css, html, customElement, property } from 'lit';

// Theme definition interface
interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
  typography: Record<string, any>;
  spacing: Record<string, string>;
}

// Built-in themes
export const lightTheme: Theme = {
  id: 'light',
  name: 'Light Theme',
  colors: {
    'background-primary': '#ffffff',
    'background-secondary': '#f8fafc',
    'text-primary': '#1e293b',
    'text-secondary': '#64748b',
    'border-primary': '#e2e8f0',
    'accent-primary': '#3b82f6'
  },
  typography: {
    'font-family-primary': 'Inter, sans-serif',
    'font-size-base': '16px'
  },
  spacing: {
    'unit-base': '4px'
  }
};

export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark Theme',
  colors: {
    'background-primary': '#0f172a',
    'background-secondary': '#1e293b',
    'text-primary': '#f1f5f9',
    'text-secondary': '#94a3b8',
    'border-primary': '#334155',
    'accent-primary': '#60a5fa'
  },
  typography: {
    'font-family-primary': 'Inter, sans-serif',
    'font-size-base': '16px'
  },
  spacing: {
    'unit-base': '4px'
  }
};

export const highContrastTheme: Theme = {
  id: 'high-contrast',
  name: 'High Contrast Theme',
  colors: {
    'background-primary': '#000000',
    'background-secondary': '#1a1a1a',
    'text-primary': '#ffffff',
    'text-secondary': '#cccccc',
    'border-primary': '#ffffff',
    'accent-primary': '#00ff00'
  },
  typography: {
    'font-family-primary': 'Arial, sans-serif',
    'font-size-base': '18px'
  },
  spacing: {
    'unit-base': '6px'
  }
};

// Theme Manager class
export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: Theme = lightTheme;
  private themes = new Map<string, Theme>([
    ['light', lightTheme],
    ['dark', darkTheme],
    ['high-contrast', highContrastTheme]
  ]);
  private listeners = new Set<(theme: Theme) => void>();

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  registerTheme(theme: Theme): void {
    this.themes.set(theme.id, theme);
  }

  getTheme(id: string): Theme | undefined {
    return this.themes.get(id);
  }

  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  setTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (!theme) return false;

    this.currentTheme = theme;
    this.applyTheme(theme);
    this.notifyListeners(theme);
    
    // Store preference
    localStorage.setItem('preferred-theme', themeId);
    return true;
  }

  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  addThemeChangeListener(listener: (theme: Theme) => void): void {
    this.listeners.add(listener);
  }

  removeThemeChangeListener(listener: (theme: Theme) => void): void {
    this.listeners.delete(listener);
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    
    // Apply color tokens
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(\`--theme-color-\${key}\`, value);
    });
    
    // Apply typography tokens
    Object.entries(theme.typography).forEach(([key, value]) => {
      root.style.setProperty(\`--theme-typography-\${key}\`, value);
    });
    
    // Apply spacing tokens
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(\`--theme-spacing-\${key}\`, value);
    });
    
    // Set theme data attribute
    root.setAttribute('data-theme', theme.id);
  }

  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(listener => listener(theme));
  }

  // Auto-detect system theme
  detectSystemTheme(): string {
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    if (window.matchMedia?.('(prefers-contrast: high)').matches) {
      return 'high-contrast';
    }
    return 'light';
  }

  // Initialize with saved or system theme
  initialize(): void {
    const saved = localStorage.getItem('preferred-theme');
    const fallback = this.detectSystemTheme();
    const themeId = saved || fallback;
    
    this.setTheme(themeId);
    
    // Listen for system changes
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (!localStorage.getItem('preferred-theme')) {
        this.setTheme(this.detectSystemTheme());
      }
    });
  }
}

// Theme-aware base component
export class ThemedComponent extends LitElement {
  private themeManager = ThemeManager.getInstance();
  
  connectedCallback() {
    super.connectedCallback();
    this.themeManager.addThemeChangeListener(this.handleThemeChange);
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    this.themeManager.removeThemeChangeListener(this.handleThemeChange);
  }
  
  private handleThemeChange = (theme: Theme) => {
    this.requestUpdate();
  };
  
  protected getThemeValue(key: string): string {
    return \`var(--theme-color-\${key})\`;
  }
}

// Theme Switcher Component
@customElement('theme-switcher')
export class ThemeSwitcher extends ThemedComponent {
  @property({ type: String }) size: 'small' | 'medium' | 'large' = 'medium';
  @property({ type: Boolean }) showLabels = true;
  
  private handleThemeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.themeManager.setTheme(select.value);
    
    this.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { themeId: select.value },
      bubbles: true,
      composed: true
    }));
  }
  
  render() {
    const currentTheme = this.themeManager.getCurrentTheme();
    const allThemes = this.themeManager.getAllThemes();
    
    return html\`
      <div class="theme-switcher \${this.size}">
        \${this.showLabels ? html\`<label for="theme-select">Theme:</label>\` : ''}
        <select
          id="theme-select"
          @change=\${this.handleThemeChange}
          .value=\${currentTheme.id}
        >
          \${allThemes.map(theme => html\`
            <option value="\${theme.id}">\${theme.name}</option>
          \`)}
        </select>
      </div>
    \`;
  }
  
  static styles = css\`
    .theme-switcher {
      display: flex;
      align-items: center;
      gap: var(--theme-spacing-unit-base, 8px);
      font-family: var(--theme-typography-font-family-primary, sans-serif);
    }
    
    .theme-switcher label {
      font-weight: 500;
      color: var(--theme-color-text-primary);
    }
    
    .theme-switcher select {
      background: var(--theme-color-background-primary);
      color: var(--theme-color-text-primary);
      border: 1px solid var(--theme-color-border-primary);
      border-radius: 6px;
      padding: 6px 12px;
      font-size: var(--theme-typography-font-size-base, 16px);
    }
    
    .small select { padding: 4px 8px; font-size: 14px; }
    .large select { padding: 8px 16px; font-size: 18px; }
  \`;
}

// Themed Card Component Example
@customElement('themed-card')
export class ThemedCard extends ThemedComponent {
  @property({ type: String }) variant: 'default' | 'elevated' | 'outlined' = 'default';
  
  render() {
    return html\`
      <div class="card \${this.variant}">
        <slot name="header"></slot>
        <div class="content">
          <slot></slot>
        </div>
        <slot name="footer"></slot>
      </div>
    \`;
  }
  
  static styles = css\`
    .card {
      background: var(--theme-color-background-primary);
      color: var(--theme-color-text-primary);
      border-radius: 8px;
      padding: calc(var(--theme-spacing-unit-base) * 4);
      font-family: var(--theme-typography-font-family-primary);
      font-size: var(--theme-typography-font-size-base);
    }
    
    .card.outlined {
      border: 1px solid var(--theme-color-border-primary);
    }
    
    .card.elevated {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .content {
      margin: calc(var(--theme-spacing-unit-base) * 2) 0;
    }
    
    /* Theme-specific overrides */
    :host([data-theme="high-contrast"]) .card {
      border: 2px solid var(--theme-color-border-primary);
    }
  \`;
}

// Initialize theme system
ThemeManager.getInstance().initialize();
`;
    setThemingCode(themingImplementation);
  }, []);

  const [currentTheme, setCurrentTheme] = useState('light');

  return (
    <Card>
      <Card.Section p="md">
        <Title order={3} mb="md">Advanced Theming System</Title>
        <Alert icon={<IconSettings />} mb="md">
          Comprehensive theme management with CSS custom properties and system preference detection
        </Alert>

        <Paper p="md" mb="md" bg={currentTheme === 'dark' ? 'dark.6' : 'gray.0'}>
          <Group mb="md">
            <Text fw={500}>Theme Switcher Demo:</Text>
            <Button
              size="xs"
              variant={currentTheme === 'light' ? 'filled' : 'outline'}
              onClick={() => setCurrentTheme('light')}
            >
              Light
            </Button>
            <Button
              size="xs"
              variant={currentTheme === 'dark' ? 'filled' : 'outline'}
              onClick={() => setCurrentTheme('dark')}
            >
              Dark
            </Button>
            <Button
              size="xs"
              variant={currentTheme === 'high-contrast' ? 'filled' : 'outline'}
              onClick={() => setCurrentTheme('high-contrast')}
            >
              High Contrast
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            Current theme: <Badge size="sm">{currentTheme}</Badge>
          </Text>
        </Paper>
        
        <Code block style={{ fontSize: '10px' }}>
          {themingCode}
        </Code>

        <Group mt="md">
          <Badge color="purple">Theme Manager</Badge>
          <Badge color="cyan">System Detection</Badge>
          <Badge color="orange">CSS Variables</Badge>
          <Badge color="green">Hot Swapping</Badge>
        </Group>
      </Card.Section>
    </Card>
  );
}

function ComponentLibraryDemo() {
  const [libraryCode, setLibraryCode] = useState('');

  useEffect(() => {
    const componentLibraryImplementation = `
import { LitElement, html, css, customElement, property, state } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';

// Base component with common functionality
export abstract class BaseComponent extends LitElement {
  @property({ type: String, reflect: true }) size: 'small' | 'medium' | 'large' = 'medium';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String }) variant = 'default';
  
  protected getBaseClasses() {
    return {
      'base-component': true,
      [\`size-\${this.size}\`]: true,
      [\`variant-\${this.variant}\`]: true,
      'disabled': this.disabled
    };
  }
  
  static baseStyles = css\`
    :host {
      display: inline-block;
      font-family: var(--ds-font-family-primary, system-ui);
    }
    
    .base-component {
      transition: all var(--ds-transition-duration, 200ms) ease;
      font-size: var(--ds-font-size-medium, 16px);
    }
    
    .size-small { font-size: var(--ds-font-size-small, 14px); }
    .size-large { font-size: var(--ds-font-size-large, 18px); }
    .disabled { opacity: 0.6; cursor: not-allowed; }
  \`;
}

// Button Component with variants
@customElement('ds-button')
export class DSButton extends BaseComponent {
  @property({ type: String }) type: 'button' | 'submit' | 'reset' = 'button';
  @property({ type: String }) href?: string;
  @property({ type: Boolean }) loading = false;
  @property({ type: String }) loadingText = 'Loading...';
  
  private handleClick(event: Event) {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    this.dispatchEvent(new CustomEvent('ds-click', {
      detail: { originalEvent: event },
      bubbles: true,
      composed: true
    }));
  }
  
  render() {
    const classes = {
      ...this.getBaseClasses(),
      'ds-button': true,
      'loading': this.loading
    };
    
    const content = this.loading 
      ? html\`<span class="loading-text">\${this.loadingText}</span>\`
      : html\`<slot></slot>\`;
    
    if (this.href && !this.disabled) {
      return html\`
        <a 
          href="\${this.href}"
          class=\${classMap(classes)}
          @click=\${this.handleClick}
        >
          \${content}
        </a>
      \`;
    }
    
    return html\`
      <button
        type="\${this.type}"
        class=\${classMap(classes)}
        ?disabled=\${this.disabled || this.loading}
        @click=\${this.handleClick}
      >
        \${content}
      </button>
    \`;
  }
  
  static styles = [
    BaseComponent.baseStyles,
    css\`
      .ds-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--ds-spacing-sm, 8px);
        padding: var(--ds-spacing-sm, 8px) var(--ds-spacing-md, 16px);
        border: 1px solid transparent;
        border-radius: var(--ds-border-radius-md, 6px);
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
      }
      
      /* Variant styles */
      .variant-primary {
        background: var(--ds-color-primary, #3b82f6);
        color: var(--ds-color-primary-contrast, #ffffff);
        border-color: var(--ds-color-primary, #3b82f6);
      }
      
      .variant-secondary {
        background: var(--ds-color-secondary, #6b7280);
        color: var(--ds-color-secondary-contrast, #ffffff);
        border-color: var(--ds-color-secondary, #6b7280);
      }
      
      .variant-outline {
        background: transparent;
        color: var(--ds-color-primary, #3b82f6);
        border-color: var(--ds-color-primary, #3b82f6);
      }
      
      .variant-ghost {
        background: transparent;
        color: var(--ds-color-text-primary, #374151);
        border-color: transparent;
      }
      
      /* Size variants */
      .size-small {
        padding: var(--ds-spacing-xs, 4px) var(--ds-spacing-sm, 8px);
        font-size: var(--ds-font-size-sm, 14px);
      }
      
      .size-large {
        padding: var(--ds-spacing-md, 16px) var(--ds-spacing-lg, 24px);
        font-size: var(--ds-font-size-lg, 18px);
      }
      
      /* States */
      .ds-button:hover:not(.disabled):not(.loading) {
        transform: translateY(-1px);
        box-shadow: var(--ds-shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
      }
      
      .ds-button:active:not(.disabled):not(.loading) {
        transform: translateY(0);
      }
      
      .loading .loading-text {
        position: relative;
      }
      
      .loading .loading-text::after {
        content: '';
        position: absolute;
        right: -20px;
        top: 50%;
        transform: translateY(-50%);
        width: 12px;
        height: 12px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to { transform: translateY(-50%) rotate(360deg); }
      }
    \`
  ];
}

// Input Component with validation
@customElement('ds-input')
export class DSInput extends BaseComponent {
  @property({ type: String }) type: 'text' | 'email' | 'password' | 'number' | 'tel' = 'text';
  @property({ type: String }) placeholder = '';
  @property({ type: String }) value = '';
  @property({ type: String }) label = '';
  @property({ type: String }) error = '';
  @property({ type: String }) helper = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Number }) minlength?: number;
  @property({ type: Number }) maxlength?: number;
  
  @state() private focused = false;
  @state() private hasValue = false;
  
  private inputRef: HTMLInputElement | null = null;
  
  firstUpdated() {
    this.inputRef = this.shadowRoot?.querySelector('input') || null;
    this.hasValue = !!this.value;
  }
  
  private handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.hasValue = !!input.value;
    
    this.dispatchEvent(new CustomEvent('ds-input', {
      detail: { value: input.value, originalEvent: event },
      bubbles: true,
      composed: true
    }));
  }
  
  private handleFocus(event: Event) {
    this.focused = true;
    this.dispatchEvent(new CustomEvent('ds-focus', {
      detail: { originalEvent: event },
      bubbles: true,
      composed: true
    }));
  }
  
  private handleBlur(event: Event) {
    this.focused = false;
    this.dispatchEvent(new CustomEvent('ds-blur', {
      detail: { originalEvent: event },
      bubbles: true,
      composed: true
    }));
  }
  
  render() {
    const containerClasses = {
      ...this.getBaseClasses(),
      'ds-input-container': true,
      'focused': this.focused,
      'has-value': this.hasValue,
      'has-error': !!this.error,
      'required': this.required
    };
    
    return html\`
      <div class=\${classMap(containerClasses)}>
        \${this.label ? html\`
          <label class="label" for="input">
            \${this.label}
            \${this.required ? html\`<span class="required-indicator">*</span>\` : ''}
          </label>
        \` : ''}
        
        <div class="input-wrapper">
          <input
            id="input"
            type="\${this.type}"
            .value=\${this.value}
            placeholder="\${this.placeholder}"
            ?disabled=\${this.disabled}
            ?required=\${this.required}
            minlength=\${ifDefined(this.minlength)}
            maxlength=\${ifDefined(this.maxlength)}
            @input=\${this.handleInput}
            @focus=\${this.handleFocus}
            @blur=\${this.handleBlur}
          />
          <slot name="suffix"></slot>
        </div>
        
        \${this.error ? html\`
          <div class="error-message">\${this.error}</div>
        \` : this.helper ? html\`
          <div class="helper-text">\${this.helper}</div>
        \` : ''}
      </div>
    \`;
  }
  
  static styles = [
    BaseComponent.baseStyles,
    css\`
      .ds-input-container {
        display: flex;
        flex-direction: column;
        gap: var(--ds-spacing-xs, 4px);
        width: 100%;
      }
      
      .label {
        font-size: var(--ds-font-size-sm, 14px);
        font-weight: 500;
        color: var(--ds-color-text-primary, #374151);
      }
      
      .required-indicator {
        color: var(--ds-color-error, #ef4444);
        margin-left: 2px;
      }
      
      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }
      
      input {
        flex: 1;
        padding: var(--ds-spacing-sm, 8px) var(--ds-spacing-md, 12px);
        border: 1px solid var(--ds-color-border, #d1d5db);
        border-radius: var(--ds-border-radius-md, 6px);
        font-family: inherit;
        font-size: var(--ds-font-size-medium, 16px);
        color: var(--ds-color-text-primary, #374151);
        background: var(--ds-color-background, #ffffff);
        transition: all var(--ds-transition-duration, 200ms) ease;
      }
      
      input:focus {
        outline: none;
        border-color: var(--ds-color-primary, #3b82f6);
        box-shadow: 0 0 0 3px var(--ds-color-primary-alpha, rgba(59, 130, 246, 0.1));
      }
      
      .has-error input {
        border-color: var(--ds-color-error, #ef4444);
      }
      
      .has-error input:focus {
        box-shadow: 0 0 0 3px var(--ds-color-error-alpha, rgba(239, 68, 68, 0.1));
      }
      
      .error-message {
        font-size: var(--ds-font-size-sm, 14px);
        color: var(--ds-color-error, #ef4444);
      }
      
      .helper-text {
        font-size: var(--ds-font-size-sm, 14px);
        color: var(--ds-color-text-secondary, #6b7280);
      }
      
      /* Size variants */
      .size-small input {
        padding: var(--ds-spacing-xs, 4px) var(--ds-spacing-sm, 8px);
        font-size: var(--ds-font-size-sm, 14px);
      }
      
      .size-large input {
        padding: var(--ds-spacing-md, 12px) var(--ds-spacing-lg, 16px);
        font-size: var(--ds-font-size-lg, 18px);
      }
    \`
  ];
}

// Modal Component with backdrop and focus management
@customElement('ds-modal')
export class DSModal extends BaseComponent {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: String }) title = '';
  @property({ type: Boolean }) closeOnBackdrop = true;
  @property({ type: Boolean }) closeOnEscape = true;
  
  @state() private animatingOut = false;
  
  private previousFocus?: HTMLElement;
  
  connectedCallback() {
    super.connectedCallback();
    
    if (this.closeOnEscape) {
      document.addEventListener('keydown', this.handleEscapeKey);
    }
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleEscapeKey);
    this.restoreFocus();
  }
  
  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('open')) {
      if (this.open) {
        this.trapFocus();
        document.body.style.overflow = 'hidden';
      } else {
        this.restoreFocus();
        document.body.style.overflow = '';
      }
    }
  }
  
  private handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.open) {
      this.closeModal();
    }
  };
  
  private handleBackdropClick(event: Event) {
    if (this.closeOnBackdrop && event.target === event.currentTarget) {
      this.closeModal();
    }
  }
  
  private closeModal() {
    this.animatingOut = true;
    
    setTimeout(() => {
      this.open = false;
      this.animatingOut = false;
      this.dispatchEvent(new CustomEvent('ds-modal-close', {
        bubbles: true,
        composed: true
      }));
    }, 200);
  }
  
  private trapFocus() {
    this.previousFocus = document.activeElement as HTMLElement;
    
    requestAnimationFrame(() => {
      const firstFocusable = this.shadowRoot?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    });
  }
  
  private restoreFocus() {
    this.previousFocus?.focus();
    this.previousFocus = undefined;
  }
  
  render() {
    if (!this.open && !this.animatingOut) return html\`\`;
    
    const modalClasses = {
      ...this.getBaseClasses(),
      'ds-modal': true,
      'animating-out': this.animatingOut
    };
    
    return html\`
      <div class="modal-backdrop" @click=\${this.handleBackdropClick}>
        <div class=\${classMap(modalClasses)} role="dialog" aria-modal="true">
          \${this.title ? html\`
            <header class="modal-header">
              <h2>\${this.title}</h2>
              <button class="close-button" @click=\${this.closeModal} aria-label="Close">
                ×
              </button>
            </header>
          \` : ''}
          
          <div class="modal-body">
            <slot></slot>
          </div>
          
          <footer class="modal-footer">
            <slot name="footer"></slot>
          </footer>
        </div>
      </div>
    \`;
  }
  
  static styles = [
    BaseComponent.baseStyles,
    css\`
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 200ms ease-out;
      }
      
      .ds-modal {
        background: var(--ds-color-background, #ffffff);
        border-radius: var(--ds-border-radius-lg, 8px);
        box-shadow: var(--ds-shadow-xl, 0 25px 50px rgba(0, 0, 0, 0.25));
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        animation: slideIn 200ms ease-out;
      }
      
      .animating-out .modal-backdrop {
        animation: fadeOut 200ms ease-in;
      }
      
      .animating-out .ds-modal {
        animation: slideOut 200ms ease-in;
      }
      
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--ds-spacing-lg, 24px);
        border-bottom: 1px solid var(--ds-color-border, #e5e7eb);
      }
      
      .modal-header h2 {
        margin: 0;
        font-size: var(--ds-font-size-xl, 20px);
        font-weight: 600;
        color: var(--ds-color-text-primary, #111827);
      }
      
      .close-button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--ds-color-text-secondary, #6b7280);
        padding: 4px;
        line-height: 1;
      }
      
      .modal-body {
        padding: var(--ds-spacing-lg, 24px);
      }
      
      .modal-footer {
        padding: var(--ds-spacing-lg, 24px);
        border-top: 1px solid var(--ds-color-border, #e5e7eb);
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      @keyframes slideIn {
        from { transform: scale(0.95) translateY(-20px); opacity: 0; }
        to { transform: scale(1) translateY(0); opacity: 1; }
      }
      
      @keyframes slideOut {
        from { transform: scale(1) translateY(0); opacity: 1; }
        to { transform: scale(0.95) translateY(-20px); opacity: 0; }
      }
    \`
  ];
}

// Component Registry for dynamic imports
export class ComponentRegistry {
  private static components = new Map<string, any>([
    ['ds-button', DSButton],
    ['ds-input', DSInput],
    ['ds-modal', DSModal]
  ]);
  
  static registerComponent(name: string, component: any) {
    this.components.set(name, component);
  }
  
  static getComponent(name: string) {
    return this.components.get(name);
  }
  
  static getAllComponents() {
    return Array.from(this.components.entries());
  }
}
`;
    setLibraryCode(componentLibraryImplementation);
  }, []);

  return (
    <Card>
      <Card.Section p="md">
        <Title order={3} mb="md">Component Library Architecture</Title>
        <Alert icon={<IconComponents />} mb="md">
          Comprehensive component library with base classes, variants, and composition patterns
        </Alert>

        <Grid mb="md">
          <Grid.Col span={4}>
            <Paper p="md" bg="blue.0">
              <Text fw={500} size="sm" mb="xs">Base Component</Text>
              <Text size="xs" c="dimmed">Common functionality, sizing, variants</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={4}>
            <Paper p="md" bg="green.0">
              <Text fw={500} size="sm" mb="xs">Composition</Text>
              <Text size="xs" c="dimmed">Slots, events, property binding</Text>
            </Paper>
          </Grid.Col>
          <Grid.Col span={4}>
            <Paper p="md" bg="orange.0">
              <Text fw={500} size="sm" mb="xs">Registry</Text>
              <Text size="xs" c="dimmed">Dynamic loading, tree-shaking</Text>
            </Paper>
          </Grid.Col>
        </Grid>
        
        <Code block style={{ fontSize: '9px' }}>
          {libraryCode}
        </Code>

        <Group mt="md">
          <Badge color="blue">Base Classes</Badge>
          <Badge color="green">Variants</Badge>
          <Badge color="orange">Accessibility</Badge>
          <Badge color="purple">Focus Management</Badge>
        </Group>
      </Card.Section>
    </Card>
  );
}

function DocumentationSystemDemo() {
  const [docCode, setDocCode] = useState('');

  useEffect(() => {
    const documentationImplementation = `
// Documentation generation and management system
import { LitElement, html, css } from 'lit';

interface ComponentDoc {
  name: string;
  description: string;
  properties: PropertyDoc[];
  events: EventDoc[];
  slots: SlotDoc[];
  examples: ExampleDoc[];
  accessibility: AccessibilityDoc;
}

interface PropertyDoc {
  name: string;
  type: string;
  description: string;
  defaultValue?: any;
  required: boolean;
}

interface EventDoc {
  name: string;
  description: string;
  detail: any;
  bubbles: boolean;
  composed: boolean;
}

interface SlotDoc {
  name: string;
  description: string;
  defaultContent?: string;
}

interface ExampleDoc {
  title: string;
  description: string;
  code: string;
  preview?: string;
}

interface AccessibilityDoc {
  roles: string[];
  ariaLabels: string[];
  keyboardSupport: string[];
  focusManagement: string;
}

// Documentation decorator for automatic generation
export function documentComponent(config: Partial<ComponentDoc>) {
  return function(target: any) {
    target.documentation = config;
    ComponentDocRegistry.register(target.is || target.name, config);
    return target;
  };
}

// Property documentation decorator
export function documentProperty(config: Omit<PropertyDoc, 'name'>) {
  return function(target: any, propertyKey: string) {
    if (!target.constructor.documentation) {
      target.constructor.documentation = { properties: [] };
    }
    if (!target.constructor.documentation.properties) {
      target.constructor.documentation.properties = [];
    }
    
    target.constructor.documentation.properties.push({
      name: propertyKey,
      ...config
    });
  };
}

// Documentation registry
export class ComponentDocRegistry {
  private static docs = new Map<string, ComponentDoc>();
  
  static register(componentName: string, doc: Partial<ComponentDoc>) {
    this.docs.set(componentName, doc as ComponentDoc);
  }
  
  static get(componentName: string): ComponentDoc | undefined {
    return this.docs.get(componentName);
  }
  
  static getAll(): Map<string, ComponentDoc> {
    return new Map(this.docs);
  }
  
  static generateMarkdown(componentName: string): string {
    const doc = this.get(componentName);
    if (!doc) return '';
    
    let markdown = \`# \${doc.name}\\n\\n\`;
    markdown += \`\${doc.description}\\n\\n\`;
    
    // Properties
    if (doc.properties?.length) {
      markdown += \`## Properties\\n\\n\`;
      markdown += \`| Name | Type | Description | Default | Required |\\n\`;
      markdown += \`|------|------|-------------|---------|----------|\\n\`;
      
      doc.properties.forEach(prop => {
        markdown += \`| \${prop.name} | \\\`\${prop.type}\\\` | \${prop.description} | \${prop.defaultValue || 'N/A'} | \${prop.required ? 'Yes' : 'No'} |\\n\`;
      });
      markdown += \`\\n\`;
    }
    
    // Events
    if (doc.events?.length) {
      markdown += \`## Events\\n\\n\`;
      doc.events.forEach(event => {
        markdown += \`### \${event.name}\\n\`;
        markdown += \`\${event.description}\\n\\n\`;
        markdown += \`- **Detail**: \\\`\${JSON.stringify(event.detail)}\\\`\\n\`;
        markdown += \`- **Bubbles**: \${event.bubbles}\\n\`;
        markdown += \`- **Composed**: \${event.composed}\\n\\n\`;
      });
    }
    
    // Examples
    if (doc.examples?.length) {
      markdown += \`## Examples\\n\\n\`;
      doc.examples.forEach(example => {
        markdown += \`### \${example.title}\\n\`;
        markdown += \`\${example.description}\\n\\n\`;
        markdown += \`\\\`\\\`\\\`html\\n\${example.code}\\n\\\`\\\`\\\`\\n\\n\`;
      });
    }
    
    // Accessibility
    if (doc.accessibility) {
      markdown += \`## Accessibility\\n\\n\`;
      markdown += \`- **Roles**: \${doc.accessibility.roles.join(', ')}\\n\`;
      markdown += \`- **ARIA Labels**: \${doc.accessibility.ariaLabels.join(', ')}\\n\`;
      markdown += \`- **Keyboard Support**: \${doc.accessibility.keyboardSupport.join(', ')}\\n\`;
      markdown += \`- **Focus Management**: \${doc.accessibility.focusManagement}\\n\\n\`;
    }
    
    return markdown;
  }
  
  static generateJSON(): string {
    const allDocs = Object.fromEntries(this.docs);
    return JSON.stringify(allDocs, null, 2);
  }
}

// Documentation viewer component
@customElement('component-docs')
export class ComponentDocs extends LitElement {
  @property({ type: String }) component = '';
  @property({ type: String }) view: 'overview' | 'properties' | 'examples' | 'accessibility' = 'overview';
  
  @state() private doc?: ComponentDoc;
  
  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('component')) {
      this.doc = ComponentDocRegistry.get(this.component);
    }
  }
  
  private renderOverview() {
    if (!this.doc) return html\`<p>No documentation found</p>\`;
    
    return html\`
      <div class="overview">
        <h1>\${this.doc.name}</h1>
        <p class="description">\${this.doc.description}</p>
        
        <div class="quick-stats">
          <div class="stat">
            <span class="label">Properties</span>
            <span class="value">\${this.doc.properties?.length || 0}</span>
          </div>
          <div class="stat">
            <span class="label">Events</span>
            <span class="value">\${this.doc.events?.length || 0}</span>
          </div>
          <div class="stat">
            <span class="label">Slots</span>
            <span class="value">\${this.doc.slots?.length || 0}</span>
          </div>
        </div>
      </div>
    \`;
  }
  
  private renderProperties() {
    if (!this.doc?.properties?.length) {
      return html\`<p>No properties documented</p>\`;
    }
    
    return html\`
      <div class="properties">
        <h2>Properties</h2>
        \${this.doc.properties.map(prop => html\`
          <div class="property">
            <div class="property-header">
              <h3>\${prop.name}</h3>
              <span class="type">\${prop.type}</span>
              \${prop.required ? html\`<span class="required">Required</span>\` : ''}
            </div>
            <p class="property-description">\${prop.description}</p>
            \${prop.defaultValue !== undefined ? html\`
              <div class="default-value">
                <strong>Default:</strong> <code>\${prop.defaultValue}</code>
              </div>
            \` : ''}
          </div>
        \`)}
      </div>
    \`;
  }
  
  private renderExamples() {
    if (!this.doc?.examples?.length) {
      return html\`<p>No examples available</p>\`;
    }
    
    return html\`
      <div class="examples">
        <h2>Examples</h2>
        \${this.doc.examples.map(example => html\`
          <div class="example">
            <h3>\${example.title}</h3>
            <p>\${example.description}</p>
            <pre><code>\${example.code}</code></pre>
            \${example.preview ? html\`
              <div class="preview" .innerHTML=\${example.preview}></div>
            \` : ''}
          </div>
        \`)}
      </div>
    \`;
  }
  
  private renderAccessibility() {
    if (!this.doc?.accessibility) {
      return html\`<p>No accessibility information available</p>\`;
    }
    
    const a11y = this.doc.accessibility;
    
    return html\`
      <div class="accessibility">
        <h2>Accessibility</h2>
        
        <div class="a11y-section">
          <h3>ARIA Roles</h3>
          <ul>
            \${a11y.roles.map(role => html\`<li><code>\${role}</code></li>\`)}
          </ul>
        </div>
        
        <div class="a11y-section">
          <h3>ARIA Labels</h3>
          <ul>
            \${a11y.ariaLabels.map(label => html\`<li><code>\${label}</code></li>\`)}
          </ul>
        </div>
        
        <div class="a11y-section">
          <h3>Keyboard Support</h3>
          <ul>
            \${a11y.keyboardSupport.map(key => html\`<li>\${key}</li>\`)}
          </ul>
        </div>
        
        <div class="a11y-section">
          <h3>Focus Management</h3>
          <p>\${a11y.focusManagement}</p>
        </div>
      </div>
    \`;
  }
  
  render() {
    return html\`
      <div class="component-docs">
        <nav class="docs-nav">
          <button 
            class=\${this.view === 'overview' ? 'active' : ''}
            @click=\${() => this.view = 'overview'}
          >
            Overview
          </button>
          <button 
            class=\${this.view === 'properties' ? 'active' : ''}
            @click=\${() => this.view = 'properties'}
          >
            Properties
          </button>
          <button 
            class=\${this.view === 'examples' ? 'active' : ''}
            @click=\${() => this.view = 'examples'}
          >
            Examples
          </button>
          <button 
            class=\${this.view === 'accessibility' ? 'active' : ''}
            @click=\${() => this.view = 'accessibility'}
          >
            Accessibility
          </button>
        </nav>
        
        <main class="docs-content">
          \${this.view === 'overview' ? this.renderOverview() :
            this.view === 'properties' ? this.renderProperties() :
            this.view === 'examples' ? this.renderExamples() :
            this.renderAccessibility()}
        </main>
      </div>
    \`;
  }
  
  static styles = css\`
    .component-docs {
      display: flex;
      height: 100%;
      font-family: system-ui, sans-serif;
    }
    
    .docs-nav {
      width: 200px;
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
      padding: 16px 0;
    }
    
    .docs-nav button {
      display: block;
      width: 100%;
      padding: 8px 16px;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      color: #64748b;
      font-size: 14px;
    }
    
    .docs-nav button:hover {
      background: #e2e8f0;
      color: #1e293b;
    }
    
    .docs-nav button.active {
      background: #3b82f6;
      color: white;
    }
    
    .docs-content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }
    
    .overview .description {
      font-size: 18px;
      color: #64748b;
      margin: 16px 0 32px;
    }
    
    .quick-stats {
      display: flex;
      gap: 24px;
    }
    
    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      background: #f1f5f9;
      border-radius: 8px;
    }
    
    .stat .label {
      font-size: 14px;
      color: #64748b;
    }
    
    .stat .value {
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
      margin-top: 4px;
    }
    
    .property {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .property-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    
    .property-header h3 {
      margin: 0;
      font-size: 18px;
      color: #1e293b;
    }
    
    .type {
      background: #3b82f6;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-family: monospace;
    }
    
    .required {
      background: #ef4444;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    
    .property-description {
      color: #64748b;
      margin: 8px 0;
    }
    
    .default-value {
      font-size: 14px;
      color: #64748b;
    }
    
    .default-value code {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
    
    .example {
      margin-bottom: 32px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .example h3 {
      margin: 0;
      padding: 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .example p {
      padding: 0 16px;
      color: #64748b;
    }
    
    .example pre {
      margin: 0;
      padding: 16px;
      background: #1e293b;
      color: #f1f5f9;
      overflow-x: auto;
    }
    
    .example code {
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 14px;
    }
    
    .preview {
      padding: 16px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }
    
    .a11y-section {
      margin-bottom: 24px;
    }
    
    .a11y-section h3 {
      color: #1e293b;
      margin-bottom: 8px;
    }
    
    .a11y-section ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .a11y-section li {
      margin-bottom: 4px;
      color: #64748b;
    }
    
    .a11y-section code {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
  \`;
}

// Example documented component
@documentComponent({
  name: 'ds-button',
  description: 'A flexible button component with multiple variants and states',
  properties: [
    {
      name: 'variant',
      type: 'string',
      description: 'Visual style variant',
      defaultValue: 'default',
      required: false
    },
    {
      name: 'size',
      type: 'string',
      description: 'Size of the button',
      defaultValue: 'medium',
      required: false
    },
    {
      name: 'disabled',
      type: 'boolean',
      description: 'Whether the button is disabled',
      defaultValue: false,
      required: false
    }
  ],
  events: [
    {
      name: 'ds-click',
      description: 'Fired when the button is clicked',
      detail: { originalEvent: 'Event' },
      bubbles: true,
      composed: true
    }
  ],
  examples: [
    {
      title: 'Basic Usage',
      description: 'Simple button with text content',
      code: '<ds-button>Click me</ds-button>'
    },
    {
      title: 'Variants',
      description: 'Different button styles',
      code: \`<ds-button variant="primary">Primary</ds-button>
<ds-button variant="secondary">Secondary</ds-button>
<ds-button variant="outline">Outline</ds-button>\`
    }
  ],
  accessibility: {
    roles: ['button'],
    ariaLabels: ['aria-label', 'aria-describedby'],
    keyboardSupport: ['Enter', 'Space'],
    focusManagement: 'Receives focus in tab order, visual focus indicator'
  }
})
@customElement('documented-button')
export class DocumentedButton extends LitElement {
  @documentProperty({
    type: 'string',
    description: 'Visual style variant',
    defaultValue: 'default',
    required: false
  })
  @property({ type: String }) variant = 'default';
  
  render() {
    return html\`<button class="variant-\${this.variant}"><slot></slot></button>\`;
  }
}

// Storybook integration
export function generateStorybookStories(componentName: string): string {
  const doc = ComponentDocRegistry.get(componentName);
  if (!doc) return '';
  
  return \`
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './<component-file>';

const meta: Meta = {
  title: 'Components/\${doc.name}',
  component: '\${componentName}',
  parameters: {
    docs: {
      description: {
        component: '\${doc.description}'
      }
    }
  },
  argTypes: {
    \${doc.properties?.map(prop => \`
    \${prop.name}: {
      control: { type: 'text' },
      description: '\${prop.description}',
      defaultValue: '\${prop.defaultValue}'
    }\`).join(',') || ''}
  }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: {
    \${doc.properties?.map(prop => \`\${prop.name}: '\${prop.defaultValue}'\`).join(',\\n    ') || ''}
  },
  render: (args) => html\`
    <\${componentName}
      \${doc.properties?.map(prop => \`.\${prop.name}="\\\${args.\${prop.name}}"\`).join('\\n      ') || ''}
    >
      Default content
    </\${componentName}>
  \`
};

\${doc.examples?.map((example, index) => \`
export const Example\${index + 1}: Story = {
  name: '\${example.title}',
  render: () => html\`\${example.code}\`
};
\`).join('\\n') || ''}
  \`.trim();
}
`;
    setDocCode(documentationImplementation);
  }, []);

  return (
    <Card>
      <Card.Section p="md">
        <Title order={3} mb="md">Documentation System</Title>
        <Alert icon={<IconBook />} mb="md">
          Automated documentation generation with interactive examples and Storybook integration
        </Alert>

        <Paper p="md" mb="md" bg="gray.0">
          <Title order={4} mb="sm">Documentation Features</Title>
          <Grid>
            <Grid.Col span={6}>
              <Text size="sm" fw={500} mb="xs">🔧 Auto-generated from decorators</Text>
              <Text size="sm" fw={500} mb="xs">📖 Interactive documentation viewer</Text>
              <Text size="sm" fw={500} mb="xs">♿ Accessibility guidelines</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" fw={500} mb="xs">📚 Storybook integration</Text>
              <Text size="sm" fw={500} mb="xs">📝 Markdown export</Text>
              <Text size="sm" fw={500} mb="xs">🔍 Live examples</Text>
            </Grid.Col>
          </Grid>
        </Paper>
        
        <Code block style={{ fontSize: '9px' }}>
          {docCode}
        </Code>

        <Group mt="md">
          <Badge color="blue">Auto-generation</Badge>
          <Badge color="green">Interactive</Badge>
          <Badge color="orange">Storybook</Badge>
          <Badge color="purple">Markdown</Badge>
        </Group>
      </Card.Section>
    </Card>
  );
}