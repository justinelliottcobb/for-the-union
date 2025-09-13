// Multi-Framework Mastery - Exercise 07: Lit Web Components Fundamentals
// ========================================================================
// In this exercise, you will master Lit and Web Components development patterns
// for building framework-agnostic, reusable components with modern web standards.
// 
// Learning Objectives:
// • Master Lit custom element development with TypeScript decorators
// • Implement shadow DOM encapsulation and styling strategies
// • Build template management systems with reactive properties
// • Create lifecycle management for Web Components
// • Design property binding and event handling patterns
// • Understand Web Components standards and browser compatibility

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Button,
  Stack,
  Group,
  Tabs,
  Badge,
  Alert,
  Progress,
  NumberInput,
  TextInput,
  ActionIcon,
  Tooltip,
  Grid,
  Divider,
  Code,
  Table,
  Select,
  Switch,
  JsonInput,
  Textarea
} from '@mantine/core';
import {
  IconComponents,
  IconTemplate,
  IconPalette,
  IconSettings,
  IconRefresh,
  IconCode,
  IconBrandHtml5,
  IconShadow,
  IconBolt,
  IconBox,
  IconBrowserCheck,
  IconBulb,
  IconFlask,
  IconTarget,
  IconZap,
  IconEye,
  IconClipboardList
} from '@tabler/icons-react';

export default function LitWebComponentsFundamentalsExercise() {
  const [activeTab, setActiveTab] = useState('custom-elements');
  const [demoState, setDemoState] = useState({
    userName: 'John Doe',
    userEmail: 'john@example.com',
    isOnline: true,
    messageCount: 3
  });

  // TODO: Implement UserCard component
  // This should be a Lit custom element with:
  // - name, email, avatar properties
  // - online status indicator
  // - click events for interaction
  // - proper TypeScript typing

  // TODO: Implement modal dialog
  // Build a modal with:
  // - backdrop click handling
  // - escape key support
  // - focus management and trapping
  // - slot-based content projection

  // TODO: Implement data fetcher component
  // Create a data fetching component with:
  // - abort controller for request cancellation
  // - retry logic with exponential backoff
  // - performance monitoring
  // - proper cleanup in disconnectedCallback

  // TODO: Implement reactive form component
  // Create a complex form with:
  // - multiple input types (text, email, select, checkbox)
  // - real-time validation
  // - state management with @state
  // - custom event emission
  // - accessibility features

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="md">Lit Web Components Fundamentals</Title>
          <Text size="lg" c="dimmed">
            Master Lit and Web Components development patterns for building framework-agnostic, reusable components with modern web standards.
          </Text>
          
          <Alert icon={<IconBulb />} title="Learning Focus" mt="md">
            This exercise covers Lit custom elements, shadow DOM encapsulation, reactive properties, lifecycle management, and event handling patterns for Web Components.
          </Alert>
        </div>

        <Tabs value={activeTab} onTabChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="custom-elements" leftSection={<IconComponents size="0.8rem" />}>
              Custom Elements
            </Tabs.Tab>
            <Tabs.Tab value="properties" leftSection={<IconSettings size="0.8rem" />}>
              Reactive Properties  
            </Tabs.Tab>
            <Tabs.Tab value="shadow-dom" leftSection={<IconShadow size="0.8rem" />}>
              Shadow DOM
            </Tabs.Tab>
            <Tabs.Tab value="lifecycle" leftSection={<IconRefresh size="0.8rem" />}>
              Lifecycle
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="custom-elements" pt="xl">
            <Stack gap="lg">
              <Card>
                <Title order={3} mb="md">Basic Custom Element</Title>
                
                {/* TODO: Implement basic custom element demo */}
                <Text c="dimmed" mt="md">
                  Lit element creation and property configuration interface will be displayed here
                </Text>

                <Code block mt="md">
                  {'// Lit Element Example\n@customElement(\'my-button\')\nexport class MyButton extends LitElement {\n  @property() label = \'Click me\';\n  @property({ type: Boolean }) disabled = false;\n  \n  static styles = css`\n    :host {\n      display: inline-block;\n    }\n    button {\n      padding: 8px 16px;\n      border-radius: 4px;\n      border: none;\n      background: var(--primary-color, #007bff);\n      color: white;\n    }\n  `;\n  \n  render() {\n    return html`\n      <button ?disabled="${this.disabled}">\n        ${this.label}\n      </button>\n    `;\n  }\n}'}
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Reactive Properties</Title>
                
                {/* TODO: Implement property configuration interface */}
                <Text c="dimmed" mb="md">
                  Reactive property configuration with TypeScript decorators will be displayed here
                </Text>

                <Code block>
                  {'// Property Configuration\n@property({ \n  type: String, \n  reflect: true,\n  attribute: \'custom-attr\',\n  converter: value => value.toLowerCase()\n})\ncustomProperty = \'default\';\n\n@state()\nprivate _internalState = false;\n\n@query(\'#myInput\')\ninput!: HTMLInputElement;\n\n@queryAll(\'.items\')\nitems!: NodeListOf<Element>;'}
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Shadow DOM & Encapsulation</Title>
                
                {/* TODO: Implement shadow DOM management */}
                <Text c="dimmed" mb="md">
                  Shadow DOM creation and style encapsulation management will be displayed here
                </Text>

                <Code block>
                  {'// Shadow DOM Implementation\nclass MyElement extends HTMLElement {\n  constructor() {\n    super();\n    const shadow = this.attachShadow({ mode: \'open\' });\n    \n    shadow.innerHTML = `\n      <style>\n        :host {\n          display: block;\n          border: 1px solid #ccc;\n        }\n        ::slotted(p) {\n          color: blue;\n        }\n      </style>\n      <div class="wrapper">\n        <slot></slot>\n      </div>\n    `;\n  }\n}'}
                </Code>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="properties" pt="xl">
            <Stack gap="lg">
              <Card>
                <Title order={3} mb="md">Property Types and Reflection</Title>
                
                {/* TODO: Implement property types demo */}
                <Text c="dimmed" mb="md">
                  Property type configuration and attribute reflection interface will be displayed here
                </Text>

                <Code block>
                  {'// Property Types\n@property({ type: String })\nmessage = \'Hello\';\n\n@property({ type: Number, reflect: true })\ncount = 0;\n\n@property({ type: Boolean, attribute: \'is-active\' })\nactive = false;\n\n@property({ \n  type: Object,\n  hasChanged: (newVal, oldVal) => {\n    return JSON.stringify(newVal) !== JSON.stringify(oldVal);\n  }\n})\ndata = {};'}
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">State Management</Title>
                
                {/* TODO: Implement state management demo */}
                <Text c="dimmed" mb="md">
                  Internal state management with @state decorator will be displayed here
                </Text>

                <Code block>
                  {'// Internal State\n@state()\nprivate _loading = false;\n\n@state()\nprivate _errors: string[] = [];\n\nprivate async fetchData() {\n  this._loading = true;\n  this._errors = [];\n  \n  try {\n    const response = await fetch(\'/api/data\');\n    const data = await response.json();\n    this.data = data;\n  } catch (error) {\n    this._errors = [error.message];\n  } finally {\n    this._loading = false;\n  }\n}'}
                </Code>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="shadow-dom" pt="xl">
            <Stack gap="lg">
              <Card>
                <Title order={3} mb="md">Style Encapsulation</Title>
                
                {/* TODO: Implement style encapsulation demo */}
                <Text c="dimmed" mb="md">
                  CSS encapsulation and host styling patterns will be displayed here
                </Text>

                <Code block>
                  {'// Style Encapsulation\nstatic styles = css`\n  :host {\n    display: block;\n    --primary-color: #007bff;\n    --text-color: #333;\n  }\n  \n  :host([hidden]) {\n    display: none;\n  }\n  \n  :host(.large) {\n    font-size: 1.2em;\n  }\n  \n  .content {\n    color: var(--text-color);\n    background: var(--primary-color);\n  }\n  \n  ::slotted(h1) {\n    margin-top: 0;\n  }\n`;'}
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Slot Composition</Title>
                
                {/* TODO: Implement slot composition demo */}
                <Text c="dimmed" mb="md">
                  Content projection with named and default slots will be displayed here
                </Text>

                <Code block>
                  {'// Slot Usage\nrender() {\n  return html`\n    <div class="card">\n      <header class="card-header">\n        <slot name="header"></slot>\n      </header>\n      \n      <main class="card-content">\n        <slot></slot>\n      </main>\n      \n      <footer class="card-footer">\n        <slot name="footer">\n          <p>Default footer content</p>\n        </slot>\n      </footer>\n    </div>\n  `;\n}'}
                </Code>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="lifecycle" pt="xl">
            <Stack gap="lg">
              <Card>
                <Title order={3} mb="md">Lifecycle Hooks</Title>
                
                {/* TODO: Implement lifecycle management demo */}
                <Text c="dimmed" mb="md">
                  Component lifecycle management and cleanup patterns will be displayed here
                </Text>

                <Code block>
                  {'// Lifecycle Methods\nconnectedCallback() {\n  super.connectedCallback();\n  console.log(\'Element connected to DOM\');\n  this.addEventListener(\'click\', this.handleClick);\n  this.startPolling();\n}\n\ndisconnectedCallback() {\n  super.disconnectedCallback();\n  console.log(\'Element removed from DOM\');\n  this.removeEventListener(\'click\', this.handleClick);\n  this.cleanup();\n}\n\nupdated(changedProperties) {\n  super.updated(changedProperties);\n  if (changedProperties.has(\'data\')) {\n    this.processDataChange();\n  }\n}'}
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Event Handling</Title>
                
                {/* TODO: Implement event handling demo */}
                <Text c="dimmed" mb="md">
                  Custom event creation and handling patterns will be displayed here
                </Text>

                <Code block>
                  {'// Event Handling\nprivate handleClick(event: Event) {\n  this.dispatchEvent(new CustomEvent(\'item-clicked\', {\n    detail: { \n      value: this.value,\n      timestamp: Date.now()\n    },\n    bubbles: true,\n    composed: true\n  }));\n}\n\nprivate handleInput(event: InputEvent) {\n  const target = event.target as HTMLInputElement;\n  this.value = target.value;\n  \n  this.dispatchEvent(new CustomEvent(\'value-changed\', {\n    detail: { value: this.value },\n    bubbles: true,\n    composed: true\n  }));\n}'}
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Performance Optimization</Title>
                
                {/* TODO: Implement performance optimization demo */}
                <Text c="dimmed" mb="md">
                  Performance optimization techniques and monitoring will be displayed here
                </Text>

                <Code block>
                  {'// Performance Optimization\nshouldUpdate(changedProperties) {\n  // Only update if meaningful properties changed\n  const meaningfulProps = [\'data\', \'loading\', \'error\'];\n  return Array.from(changedProperties.keys()).some(\n    prop => meaningfulProps.includes(prop)\n  );\n}\n\nfirstUpdated() {\n  // Setup performance monitoring\n  if (\'PerformanceObserver\' in window) {\n    const observer = new PerformanceObserver((list) => {\n      const entries = list.getEntries();\n      entries.forEach(entry => {\n        console.log(`${entry.name}: ${entry.duration}ms`);\n      });\n    });\n    observer.observe({ entryTypes: [\'measure\'] });\n  }\n}'}
                </Code>
              </Card>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Card>
          <Title order={3} mb="md">Implementation Checklist</Title>
          <Stack gap="sm">
            <Group>
              <Badge color="blue" variant="light">Custom Elements</Badge>
              <Text size="sm">@customElement decorator and LitElement extension</Text>
            </Group>
            <Group>
              <Badge color="green" variant="light">Properties</Badge>
              <Text size="sm">@property and @state decorators with TypeScript types</Text>
            </Group>
            <Group>
              <Badge color="orange" variant="light">Shadow DOM</Badge>
              <Text size="sm">Style encapsulation and slot composition</Text>
            </Group>
            <Group>
              <Badge color="purple" variant="light">Lifecycle</Badge>
              <Text size="sm">Connected/disconnected callbacks and cleanup</Text>
            </Group>
            <Group>
              <Badge color="red" variant="light">Events</Badge>
              <Text size="sm">Custom event dispatch with bubbles and composed</Text>
            </Group>
            <Group>
              <Badge color="teal" variant="light">Performance</Badge>
              <Text size="sm">shouldUpdate optimization and monitoring</Text>
            </Group>
          </Stack>
        </Card>

        <Alert icon={<IconTarget />} title="Success Criteria">
          <Stack gap="xs">
            <Text size="sm">✅ All components extend LitElement with proper decorators</Text>
            <Text size="sm">✅ Shadow DOM styling is properly encapsulated</Text>
            <Text size="sm">✅ Reactive properties update component state correctly</Text>
            <Text size="sm">✅ Lifecycle methods handle setup and cleanup</Text>
            <Text size="sm">✅ Custom events are dispatched with proper options</Text>
            <Text size="sm">✅ Performance optimizations prevent unnecessary renders</Text>
          </Stack>
        </Alert>
      </Stack>
    </Container>
  );
}