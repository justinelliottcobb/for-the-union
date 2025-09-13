import React, { useState, useRef, useEffect } from 'react';
import { Container, Title, Text, Card, Group, Button, Stack, Code, Badge, Tabs, Paper, Alert } from '@mantine/core';
import { IconComponents, IconCode, IconBrowserCheck, IconBulb } from '@tabler/icons-react';

export default function LitWebComponentsFundamentalsWorkshop() {
  const [activeDemo, setActiveDemo] = useState('component');

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="md">Lit Web Components Fundamentals Workshop</Title>
          <Text size="lg" c="dimmed">
            Master Lit and Web Components development for framework-agnostic, reusable components
          </Text>
        </div>

        <Tabs value={activeDemo} onTabChange={setActiveDemo}>
          <Tabs.List>
            <Tabs.Tab value="component" leftSection={<IconComponents size="0.8rem" />}>
              Custom Elements
            </Tabs.Tab>
            <Tabs.Tab value="shadow" leftSection={<IconBrowserCheck size="0.8rem" />}>
              Shadow DOM
            </Tabs.Tab>
            <Tabs.Tab value="lifecycle" leftSection={<IconCode size="0.8rem" />}>
              Lifecycle Management
            </Tabs.Tab>
            <Tabs.Tab value="properties" leftSection={<IconBulb size="0.8rem" />}>
              Reactive Properties
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="component" pt="xl">
            <LitCustomElementDemo />
          </Tabs.Panel>

          <Tabs.Panel value="shadow" pt="xl">
            <ShadowDOMDemo />
          </Tabs.Panel>

          <Tabs.Panel value="lifecycle" pt="xl">
            <LifecycleManagementDemo />
          </Tabs.Panel>

          <Tabs.Panel value="properties" pt="xl">
            <ReactivePropertiesDemo />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}

function LitCustomElementDemo() {
  const [componentCode, setComponentCode] = useState('');

  useEffect(() => {
    // Simulated Lit custom element implementation
    const litElementCode = `
import { LitElement, html, css, customElement, property } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

@customElement('user-card')
export class UserCard extends LitElement {
  @property({ type: String }) name = '';
  @property({ type: String }) email = '';
  @property({ type: String }) avatar = '';
  @property({ type: Boolean }) online = false;

  static styles = css\`
    :host {
      display: block;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 16px;
      margin: 8px 0;
      font-family: Arial, sans-serif;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .status {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-left: auto;
    }
    
    .online { background-color: #4CAF50; }
    .offline { background-color: #757575; }
  \`;

  render() {
    const statusStyles = {
      backgroundColor: this.online ? '#4CAF50' : '#757575'
    };

    return html\`
      <div class="user-info">
        <img class="avatar" src="\${this.avatar}" alt="\${this.name}" />
        <div>
          <div style="font-weight: bold;">\${this.name}</div>
          <div style="color: #666; font-size: 14px;">\${this.email}</div>
        </div>
        <div class="status" style=\${styleMap(statusStyles)}></div>
      </div>
    \`;
  }
}

// Usage in any framework or vanilla HTML
// <user-card name="John Doe" email="john@example.com" avatar="/avatar.jpg" online></user-card>
`;
    setComponentCode(litElementCode);
  }, []);

  return (
    <Card>
      <Card.Section p="md">
        <Title order={3} mb="md">Lit Custom Element Implementation</Title>
        <Alert icon={<IconComponents />} mb="md">
          Framework-agnostic custom elements with TypeScript decorators and encapsulated styling
        </Alert>
        
        <Code block style={{ fontSize: '11px' }}>
          {componentCode}
        </Code>

        <Group mt="md">
          <Badge color="blue">@customElement</Badge>
          <Badge color="green">@property</Badge>
          <Badge color="orange">Shadow DOM</Badge>
          <Badge color="purple">CSS Encapsulation</Badge>
        </Group>
      </Card.Section>
    </Card>
  );
}

function ShadowDOMDemo() {
  const [shadowCode, setShadowCode] = useState('');

  useEffect(() => {
    const shadowImplementation = `
import { LitElement, html, css, customElement } from 'lit';

@customElement('modal-dialog')
export class ModalDialog extends LitElement {
  static styles = css\`
    /* Styles are completely encapsulated */
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;
    }
    
    .dialog {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      min-width: 320px;
    }
    
    .header {
      border-bottom: 1px solid #eee;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
    
    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .primary {
      background-color: #007bff;
      color: white;
    }
    
    .secondary {
      background-color: #6c757d;
      color: white;
    }
  \`;

  render() {
    return html\`
      <div class="dialog">
        <div class="header">
          <slot name="header"></slot>
        </div>
        <div class="content">
          <slot></slot>
        </div>
        <div class="actions">
          <button class="secondary" @click=\${this.handleCancel}>Cancel</button>
          <button class="primary" @click=\${this.handleConfirm}>Confirm</button>
        </div>
      </div>
    \`;
  }

  handleCancel() {
    this.dispatchEvent(new CustomEvent('modal-cancel', { bubbles: true }));
  }

  handleConfirm() {
    this.dispatchEvent(new CustomEvent('modal-confirm', { bubbles: true }));
  }
}

// Advanced shadow DOM features
class AdvancedComponent extends LitElement {
  createRenderRoot() {
    // Custom shadow root configuration
    const shadowRoot = this.attachShadow({ 
      mode: 'open',
      delegatesFocus: true 
    });
    return shadowRoot;
  }
  
  firstUpdated() {
    // Access shadow DOM directly
    const slottedElements = this.shadowRoot?.querySelectorAll('slot');
    console.log('Slots:', slottedElements);
  }
}
`;
    setShadowCode(shadowImplementation);
  }, []);

  return (
    <Card>
      <Card.Section p="md">
        <Title order={3} mb="md">Shadow DOM Encapsulation</Title>
        <Alert icon={<IconBrowserCheck />} mb="md">
          Complete style isolation and advanced slot composition patterns
        </Alert>
        
        <Code block style={{ fontSize: '11px' }}>
          {shadowCode}
        </Code>

        <Group mt="md">
          <Badge color="violet">Shadow Root</Badge>
          <Badge color="cyan">Style Encapsulation</Badge>
          <Badge color="teal">Slot Composition</Badge>
          <Badge color="pink">Event Delegation</Badge>
        </Group>
      </Card.Section>
    </Card>
  );
}

function LifecycleManagementDemo() {
  const [lifecycleCode, setLifecycleCode] = useState('');

  useEffect(() => {
    const lifecycleImplementation = `
import { LitElement, html, css, customElement, property, state } from 'lit';

@customElement('data-fetcher')
export class DataFetcher extends LitElement {
  @property({ type: String }) endpoint = '';
  @property({ type: Object }) headers = {};
  @state() private data: any = null;
  @state() private loading = false;
  @state() private error: string | null = null;

  private abortController?: AbortController;
  private retryCount = 0;
  private maxRetries = 3;

  // Lifecycle: Called when element is connected to DOM
  connectedCallback() {
    super.connectedCallback();
    console.log('DataFetcher connected to DOM');
    
    if (this.endpoint) {
      this.fetchData();
    }
  }

  // Lifecycle: Called when element is disconnected from DOM
  disconnectedCallback() {
    super.disconnectedCallback();
    console.log('DataFetcher disconnected from DOM');
    
    // Cleanup: Cancel ongoing requests
    this.abortController?.abort();
    this.cleanup();
  }

  // Lifecycle: Called before update to determine if re-render needed
  shouldUpdate(changedProperties: Map<string, any>) {
    // Optimize renders - only update if meaningful properties changed
    const meaningfulProps = ['endpoint', 'data', 'loading', 'error'];
    return Array.from(changedProperties.keys()).some(
      prop => meaningfulProps.includes(prop as string)
    );
  }

  // Lifecycle: Called when properties change
  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    
    if (changedProperties.has('endpoint') && this.endpoint) {
      this.retryCount = 0;
      this.fetchData();
    }
  }

  // Lifecycle: Called after first render
  firstUpdated() {
    console.log('DataFetcher first render complete');
    this.setupPerformanceObserver();
  }

  private async fetchData() {
    this.loading = true;
    this.error = null;
    
    // Cancel previous request
    this.abortController?.abort();
    this.abortController = new AbortController();

    try {
      const response = await fetch(this.endpoint, {
        headers: this.headers,
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }

      this.data = await response.json();
      this.retryCount = 0;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }

      this.error = error.message;
      
      // Retry logic with exponential backoff
      if (this.retryCount < this.maxRetries) {
        const delay = Math.pow(2, this.retryCount) * 1000;
        setTimeout(() => {
          this.retryCount++;
          this.fetchData();
        }, delay);
      }
    } finally {
      this.loading = false;
    }
  }

  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.name.includes('data-fetcher')) {
            console.log(\`DataFetcher performance: \${entry.duration}ms\`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure'] });
    }
  }

  private cleanup() {
    // Cleanup performance observers, timers, etc.
    this.abortController = undefined;
    this.data = null;
    this.error = null;
  }

  render() {
    if (this.loading) {
      return html\`<div class="loading">Loading...</div>\`;
    }

    if (this.error) {
      return html\`
        <div class="error">
          <p>Error: \${this.error}</p>
          <button @click=\${this.fetchData}>Retry</button>
        </div>
      \`;
    }

    if (this.data) {
      return html\`
        <div class="data">
          <pre>\${JSON.stringify(this.data, null, 2)}</pre>
        </div>
      \`;
    }

    return html\`<div class="empty">No data</div>\`;
  }

  static styles = css\`
    :host {
      display: block;
      font-family: monospace;
    }
    
    .loading, .error, .empty {
      padding: 16px;
      text-align: center;
    }
    
    .error {
      color: #d32f2f;
      background-color: #ffebee;
      border-radius: 4px;
    }
    
    .data pre {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      overflow: auto;
    }
  \`;
}
`;
    setLifecycleCode(lifecycleImplementation);
  }, []);

  return (
    <Card>
      <Card.Section p="md">
        <Title order={3} mb="md">Lifecycle Management</Title>
        <Alert icon={<IconCode />} mb="md">
          Proper cleanup, performance monitoring, and resource management
        </Alert>
        
        <Code block style={{ fontSize: '10px' }}>
          {lifecycleCode}
        </Code>

        <Group mt="md">
          <Badge color="red">connectedCallback</Badge>
          <Badge color="orange">disconnectedCallback</Badge>
          <Badge color="yellow">shouldUpdate</Badge>
          <Badge color="green">Cleanup</Badge>
        </Group>
      </Card.Section>
    </Card>
  );
}

function ReactivePropertiesDemo() {
  const [propertiesCode, setPropertiesCode] = useState('');

  useEffect(() => {
    const propertiesImplementation = `
import { LitElement, html, css, customElement, property, state } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';

interface FormData {
  username: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

@customElement('reactive-form')
export class ReactiveForm extends LitElement {
  // Public properties - trigger re-render when changed
  @property({ type: String }) title = 'User Form';
  @property({ type: Boolean, attribute: 'show-validation' }) 
  showValidation = false;
  
  @property({ 
    type: Object,
    hasChanged: (newVal: FormData, oldVal: FormData) => {
      // Custom change detection for complex objects
      return JSON.stringify(newVal) !== JSON.stringify(oldVal);
    }
  }) 
  initialData: FormData = {
    username: '',
    email: '',
    preferences: {
      theme: 'light',
      notifications: true
    }
  };

  // Private state - only accessible within component
  @state() private formData: FormData = { ...this.initialData };
  @state() private errors: Record<string, string> = {};
  @state() private touched: Record<string, boolean> = {};
  @state() private isSubmitting = false;

  // Computed properties using getters
  get isValid() {
    return Object.keys(this.errors).length === 0;
  }

  get hasChanges() {
    return JSON.stringify(this.formData) !== JSON.stringify(this.initialData);
  }

  // Property change observers
  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('initialData')) {
      this.formData = { ...this.initialData };
      this.resetValidation();
    }
  }

  private handleInputChange(field: keyof FormData, value: any) {
    this.formData = {
      ...this.formData,
      [field]: value
    };
    
    this.touched = {
      ...this.touched,
      [field]: true
    };
    
    this.validateField(field);
  }

  private handleNestedChange(path: string, value: any) {
    const keys = path.split('.');
    const updated = { ...this.formData };
    
    let current: any = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    this.formData = updated;
    this.touched = { ...this.touched, [path]: true };
    this.validateField(path);
  }

  private validateField(field: string) {
    const newErrors = { ...this.errors };
    delete newErrors[field];

    if (field === 'username') {
      if (!this.formData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (this.formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }
    }

    if (field === 'email') {
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!this.formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!emailRegex.test(this.formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    this.errors = newErrors;
  }

  private validateAll() {
    this.validateField('username');
    this.validateField('email');
    
    this.touched = {
      username: true,
      email: true,
      'preferences.theme': true,
      'preferences.notifications': true
    };
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.validateAll();
    
    if (!this.isValid) return;
    
    this.isSubmitting = true;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Dispatch custom event with form data
      this.dispatchEvent(new CustomEvent('form-submit', {
        detail: { data: this.formData },
        bubbles: true,
        composed: true
      }));
      
      this.resetForm();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private resetForm() {
    this.formData = { ...this.initialData };
    this.errors = {};
    this.touched = {};
  }

  private resetValidation() {
    this.errors = {};
    this.touched = {};
  }

  render() {
    const formClasses = {
      'reactive-form': true,
      'has-errors': !this.isValid && this.showValidation,
      'has-changes': this.hasChanges
    };

    return html\`
      <form class=\${classMap(formClasses)} @submit=\${this.handleSubmit}>
        <h3>\${this.title}</h3>
        
        <div class="field">
          <label for="username">Username</label>
          <input
            id="username"
            type="text"
            .value=\${this.formData.username}
            @input=\${(e: Event) => 
              this.handleInputChange('username', (e.target as HTMLInputElement).value)}
            ?disabled=\${this.isSubmitting}
            aria-invalid=\${ifDefined(this.errors.username ? 'true' : undefined)}
          />
          \${this.showValidation && this.errors.username ? 
            html\`<span class="error">\${this.errors.username}</span>\` : 
            ''
          }
        </div>

        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            .value=\${this.formData.email}
            @input=\${(e: Event) => 
              this.handleInputChange('email', (e.target as HTMLInputElement).value)}
            ?disabled=\${this.isSubmitting}
            aria-invalid=\${ifDefined(this.errors.email ? 'true' : undefined)}
          />
          \${this.showValidation && this.errors.email ? 
            html\`<span class="error">\${this.errors.email}</span>\` : 
            ''
          }
        </div>

        <div class="field">
          <label>Theme</label>
          <select
            .value=\${this.formData.preferences.theme}
            @change=\${(e: Event) => 
              this.handleNestedChange('preferences.theme', (e.target as HTMLSelectElement).value)}
            ?disabled=\${this.isSubmitting}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div class="field checkbox">
          <label>
            <input
              type="checkbox"
              .checked=\${this.formData.preferences.notifications}
              @change=\${(e: Event) => 
                this.handleNestedChange('preferences.notifications', (e.target as HTMLInputElement).checked)}
              ?disabled=\${this.isSubmitting}
            />
            Enable notifications
          </label>
        </div>

        <div class="actions">
          <button type="button" @click=\${this.resetForm} ?disabled=\${this.isSubmitting}>
            Reset
          </button>
          <button type="submit" ?disabled=\${this.isSubmitting || !this.isValid}>
            \${this.isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>

        <div class="debug">
          <details>
            <summary>Debug Info</summary>
            <pre>Form Data: \${JSON.stringify(this.formData, null, 2)}</pre>
            <pre>Errors: \${JSON.stringify(this.errors, null, 2)}</pre>
            <pre>Touched: \${JSON.stringify(this.touched, null, 2)}</pre>
            <p>Valid: \${this.isValid}</p>
            <p>Has Changes: \${this.hasChanges}</p>
          </details>
        </div>
      </form>
    \`;
  }

  static styles = css\`
    .reactive-form {
      max-width: 400px;
      padding: 24px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-family: Arial, sans-serif;
    }
    
    .field {
      margin-bottom: 16px;
    }
    
    .field label {
      display: block;
      margin-bottom: 4px;
      font-weight: bold;
    }
    
    .field input, .field select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    
    .field.checkbox label {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .field.checkbox input {
      width: auto;
    }
    
    .error {
      color: #d32f2f;
      font-size: 12px;
      margin-top: 4px;
    }
    
    .actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    
    .actions button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .actions button[type="submit"] {
      background-color: #007bff;
      color: white;
    }
    
    .actions button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .debug {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }
    
    .debug pre {
      background-color: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      font-size: 11px;
      overflow: auto;
    }
    
    .has-errors {
      border-color: #d32f2f;
    }
    
    .has-changes {
      border-color: #ff9800;
    }
  \`;
}
`;
    setPropertiesCode(propertiesImplementation);
  }, []);

  return (
    <Card>
      <Card.Section p="md">
        <Title order={3} mb="md">Reactive Properties & State</Title>
        <Alert icon={<IconBulb />} mb="md">
          Advanced property binding, state management, and event handling patterns
        </Alert>
        
        <Code block style={{ fontSize: '10px' }}>
          {propertiesCode}
        </Code>

        <Group mt="md">
          <Badge color="indigo">@property</Badge>
          <Badge color="grape">@state</Badge>
          <Badge color="lime">Custom Events</Badge>
          <Badge color="cyan">Validation</Badge>
        </Group>
      </Card.Section>
    </Card>
  );
}