// Multi-Framework Mastery - Exercise 07: Lit Web Components Fundamentals
// ========================================================================
// In this exercise, you will master Lit and Web Components development patterns
// for building framework-agnostic, reusable components with modern web standards.

import React, { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Group,
  Tabs,
  Badge,
  Alert,
  Code
} from '@mantine/core';
import {
  IconComponents,
  IconSettings,
  IconShadow,
  IconRefresh,
  IconBulb,
  IconTarget
} from '@tabler/icons-react';

export default function LitWebComponentsFundamentalsExercise() {
  const [activeTab, setActiveTab] = useState('custom-elements');

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
                
                <Text c="dimmed" mt="md">
                  Lit element creation and property configuration interface will be displayed here
                </Text>

                <Code block mt="md">
                  Lit Element Example with @customElement decorator and LitElement base class
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Reactive Properties</Title>
                
                <Text c="dimmed" mb="md">
                  Reactive property configuration with TypeScript decorators will be displayed here
                </Text>

                <Code block>
                  Property configuration with @property and @state decorators
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Shadow DOM & Encapsulation</Title>
                
                <Text c="dimmed" mb="md">
                  Shadow DOM creation and style encapsulation management will be displayed here
                </Text>

                <Code block>
                  Shadow DOM implementation with style encapsulation and slot composition
                </Code>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="properties" pt="xl">
            <Stack gap="lg">
              <Card>
                <Title order={3} mb="md">Property Types and Reflection</Title>
                
                <Text c="dimmed" mb="md">
                  Property type configuration and attribute reflection interface will be displayed here
                </Text>

                <Code block>
                  Property types with String, Number, Boolean, and Object configurations
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">State Management</Title>
                
                <Text c="dimmed" mb="md">
                  Internal state management with @state decorator will be displayed here
                </Text>

                <Code block>
                  Internal state management with private properties and async operations
                </Code>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="shadow-dom" pt="xl">
            <Stack gap="lg">
              <Card>
                <Title order={3} mb="md">Style Encapsulation</Title>
                
                <Text c="dimmed" mb="md">
                  CSS encapsulation and host styling patterns will be displayed here
                </Text>

                <Code block>
                  Style encapsulation with :host selectors and CSS custom properties
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Slot Composition</Title>
                
                <Text c="dimmed" mb="md">
                  Content projection with named and default slots will be displayed here
                </Text>

                <Code block>
                  Slot usage with named slots and default content fallbacks
                </Code>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="lifecycle" pt="xl">
            <Stack gap="lg">
              <Card>
                <Title order={3} mb="md">Lifecycle Hooks</Title>
                
                <Text c="dimmed" mb="md">
                  Component lifecycle management and cleanup patterns will be displayed here
                </Text>

                <Code block>
                  Lifecycle methods: connectedCallback, disconnectedCallback, updated
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Event Handling</Title>
                
                <Text c="dimmed" mb="md">
                  Custom event creation and handling patterns will be displayed here
                </Text>

                <Code block>
                  Custom event dispatch with bubbles, composed, and detail properties
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Performance Optimization</Title>
                
                <Text c="dimmed" mb="md">
                  Performance optimization techniques and monitoring will be displayed here
                </Text>

                <Code block>
                  Performance optimization with shouldUpdate and PerformanceObserver
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