// Multi-Framework Mastery - Exercise 08: Design System with Lit
// ========================================================================
// In this exercise, you will build scalable design systems using Lit
// with comprehensive theming, design tokens, and component library patterns.

import React, { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Stack,
  Tabs,
  Badge,
  Alert,
  Group,
  Code
} from '@mantine/core';
import {
  IconPalette,
  IconComponents,
  IconBook,
  IconSettings,
  IconBulb,
  IconTarget
} from '@tabler/icons-react';

export default function DesignSystemWithLitExercise() {
  const [activeTab, setActiveTab] = useState('tokens');

  // TODO: Implement design tokens system
  // Create a comprehensive token system with:
  // - primitive tokens (base colors, fonts, sizes)
  // - semantic tokens (purpose-driven aliases)
  // - component tokens (component-specific values)
  // - token validation (contrast ratios, spacing scales)

  // TODO: Implement theme management
  // Build a theme manager with:
  // - multiple themes (light, dark, high-contrast)
  // - runtime switching (change themes without page reload)
  // - system preference detection
  // - persistence (save user preferences)

  // TODO: Implement component library
  // Create comprehensive components including:
  // - Button component with variants and sizes
  // - Input component with validation
  // - Modal component with accessibility
  // - Base component architecture

  // TODO: Implement documentation system
  // Build automated documentation with:
  // - component docs auto-generated from decorators
  // - interactive examples
  // - Storybook integration

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="md">Design System with Lit</Title>
          <Text size="lg" c="dimmed">
            Build scalable design systems with comprehensive theming, design tokens, and component libraries.
          </Text>
          
          <Alert icon={<IconBulb />} title="Learning Focus" mt="md">
            This exercise covers design tokens, theme management, component library architecture, and automated documentation systems.
          </Alert>
        </div>

        <Tabs value={activeTab} onTabChange={setActiveTab}>
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
            <Stack gap="lg">
              <Card>
                <Title order={3} mb="md">Token Architecture</Title>
                
                <Text c="dimmed" mb="md">
                  Design token system implementation will be displayed here
                </Text>

                <Code block>
                  Design tokens configuration and CSS custom property generation
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Semantic Tokens</Title>
                
                <Text c="dimmed" mb="md">
                  Semantic token management and validation will be displayed here
                </Text>

                <Code block>
                  Semantic color and typography token definitions
                </Code>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="theming" pt="xl">
            <Stack gap="lg">
              <Card>
                <Title order={3} mb="md">Theme Manager</Title>
                
                <Text c="dimmed" mb="md">
                  Theme management system implementation will be displayed here
                </Text>

                <Code block>
                  Theme switching and persistence logic
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">CSS Custom Properties</Title>
                
                <Text c="dimmed" mb="md">
                  CSS variable generation and theme application will be displayed here
                </Text>

                <Code block>
                  CSS custom property generation from tokens
                </Code>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="components" pt="xl">
            <Stack gap="lg">
              <Card>
                <Title order={3} mb="md">Base Component</Title>
                
                <Text c="dimmed" mb="md">
                  Base component architecture with shared functionality will be displayed here
                </Text>

                <Code block>
                  Base component class with common properties and methods
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Component Variants</Title>
                
                <Text c="dimmed" mb="md">
                  Component variant system and styling patterns will be displayed here
                </Text>

                <Code block>
                  Button, Input, and Modal component implementations
                </Code>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="documentation" pt="xl">
            <Stack gap="lg">
              <Card>
                <Title order={3} mb="md">Auto Documentation</Title>
                
                <Text c="dimmed" mb="md">
                  Automated documentation generation system will be displayed here
                </Text>

                <Code block>
                  Documentation decorators and generation utilities
                </Code>
              </Card>

              <Card>
                <Title order={3} mb="md">Storybook Integration</Title>
                
                <Text c="dimmed" mb="md">
                  Storybook story generation and integration will be displayed here
                </Text>

                <Code block>
                  Automated Storybook story generation from component metadata
                </Code>
              </Card>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Card>
          <Title order={3} mb="md">Implementation Checklist</Title>
          <Stack gap="sm">
            <Group>
              <Badge color="blue" variant="light">Design Tokens</Badge>
              <Text size="sm">Primitive and semantic token definitions</Text>
            </Group>
            <Group>
              <Badge color="green" variant="light">Theme System</Badge>
              <Text size="sm">Multi-theme support with runtime switching</Text>
            </Group>
            <Group>
              <Badge color="orange" variant="light">Components</Badge>
              <Text size="sm">Base component architecture with variants</Text>
            </Group>
            <Group>
              <Badge color="purple" variant="light">Documentation</Badge>
              <Text size="sm">Auto-generated docs with interactive examples</Text>
            </Group>
          </Stack>
        </Card>

        <Alert icon={<IconTarget />} title="Success Criteria">
          <Stack gap="xs">
            <Text size="sm">✅ Design tokens generate consistent CSS custom properties</Text>
            <Text size="sm">✅ Theme switching works without page reload</Text>
            <Text size="sm">✅ Components use base architecture with variants</Text>
            <Text size="sm">✅ Documentation generates automatically from decorators</Text>
          </Stack>
        </Alert>
      </Stack>
    </Container>
  );
}