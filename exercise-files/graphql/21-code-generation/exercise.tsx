import React, { useState } from 'react';
import { Container, Title, Text, Group, Button, Card, Stack, Badge, Alert, Code, Tabs, TextInput, Textarea } from '@mantine/core';
import { IconCode, IconFileCheck, IconRocket, IconAlertCircle } from '@tabler/icons-react';

// TODO: Install GraphQL Code Generator packages
// npm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo

// TODO: Create codegen.yml configuration file
const codegenConfig = `
# TODO: Create this file in project root
# codegen.yml
overwrite: true
schema: "http://localhost:4000/graphql"
documents: "src/graphql/**/*.graphql"
generates:
  src/graphql/generated.ts:
    plugins:
      - "typescript"
      - "typescript-operations"
      - "typescript-react-apollo"
    config:
      withHooks: true
      withComponent: false
      withHOC: false
      apolloReactHooksImportFrom: "@apollo/client"
      maybeValue: T | null | undefined
      avoidOptionals:
        field: true
        object: true
      scalars:
        DateTime: string
        JSON: any
`;

// TODO: Create GraphQL operation files
const userOperations = `
# TODO: Create src/graphql/users.graphql
query GetUsers($first: Int!, $after: String) {
  users(first: $first, after: $after) {
    edges {
      node {
        id
        email
        profile {
          firstName
          lastName
          avatar
          bio
        }
        posts {
          id
          title
          content
          createdAt
          likes {
            id
            user {
              id
              profile {
                firstName
                lastName
              }
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}

mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    user {
      id
      email
      profile {
        firstName
        lastName
      }
    }
    errors {
      field
      message
    }
  }
}

subscription UserUpdated($userId: ID!) {
  userUpdated(userId: $userId) {
    id
    email
    profile {
      firstName
      lastName
      avatar
      bio
    }
  }
}
`;

// TODO: Import and use generated types and hooks
// import {
//   GetUsersQuery,
//   GetUsersQueryVariables,
//   useGetUsersQuery,
//   useCreateUserMutation,
//   useUserUpdatedSubscription,
//   CreateUserInput
// } from '../graphql/generated';

// TODO: Implement type-safe component using generated hooks
const UsersListGenerated: React.FC = () => {
  // TODO: Use generated hooks with full type safety
  // const { data, loading, error, fetchMore } = useGetUsersQuery({
  //   variables: { first: 10, after: null },
  //   errorPolicy: 'partial'
  // });

  // TODO: Use generated mutation hook
  // const [createUser, { loading: creating }] = useCreateUserMutation({
  //   update: (cache, { data }) => {
  //     if (data?.createUser.user) {
  //       cache.modify({
  //         fields: {
  //           users(existing) {
  //             const newUser = cache.writeFragment({
  //               data: data.createUser.user,
  //               fragment: gql`
  //                 fragment NewUser on User {
  //                   id
  //                   email
  //                   profile {
  //                     firstName
  //                     lastName
  //                   }
  //                 }
  //               `
  //             });
  //             return { ...existing, edges: [{ node: newUser }, ...existing.edges] };
  //           }
  //         }
  //       });
  //     }
  //   }
  // });

  // TODO: Use generated subscription hook
  // useUserUpdatedSubscription({
  //   variables: { userId: "current-user-id" },
  //   onSubscriptionData: ({ subscriptionData, client }) => {
  //     if (subscriptionData.data?.userUpdated) {
  //       client.cache.modify({
  //         id: client.cache.identify(subscriptionData.data.userUpdated),
  //         fields: {
  //           profile: () => subscriptionData.data.userUpdated.profile
  //         }
  //       });
  //     }
  //   }
  // });

  return (
    <Card withBorder p="md">
      <Text c="dimmed">Generated hooks implementation placeholder</Text>
      <Alert icon={<IconCode />} color="blue" mt="md">
        Complete the TODOs above to use fully type-safe GraphQL operations
      </Alert>
    </Card>
  );
};

// TODO: Create custom code generation templates
const customTemplate = `
# TODO: Create templates/react-apollo-hooks.handlebars
{{#each operations}}
export const use{{name}}Hook = () => {
  const {{toLowerCase name}}Result = use{{name}}({{#if variables}}{
    variables: {
      {{#each variables}}
      {{name}}: undefined, // TODO: Provide {{type}}
      {{/each}}
    }
  }{{/if}});
  
  return {
    ...{{toLowerCase name}}Result,
    // Add custom utilities
    isInitialLoading: {{toLowerCase name}}Result.loading && !{{toLowerCase name}}Result.data,
    isEmpty: !{{toLowerCase name}}Result.loading && (!{{toLowerCase name}}Result.data{{#if hasListField}} || {{toLowerCase name}}Result.data.{{listField}}.edges.length === 0{{/if}}),
  };
};
{{/each}}
`;

// TODO: Implement type-safe form handling
interface GeneratedFormProps {
  onSubmit: (data: any) => void; // TODO: Replace with CreateUserInput
}

const GeneratedForm: React.FC<GeneratedFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    bio: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Use generated CreateUserInput type for validation
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="sm">
        <TextInput
          label="Email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
        <TextInput
          label="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
          required
        />
        <TextInput
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
          required
        />
        <Textarea
          label="Bio"
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          rows={3}
        />
        <Button type="submit">Create User</Button>
      </Stack>
    </form>
  );
};

// TODO: Implement fragment composition patterns
const fragmentExample = `
# TODO: Create src/graphql/fragments.graphql
fragment UserCore on User {
  id
  email
  createdAt
}

fragment UserProfile on User {
  ...UserCore
  profile {
    firstName
    lastName
    avatar
    bio
  }
}

fragment UserWithPosts on User {
  ...UserProfile
  posts {
    id
    title
    excerpt: content(truncate: 100)
    createdAt
  }
}

# Use fragments in operations
query GetUserDetails($id: ID!) {
  user(id: $id) {
    ...UserWithPosts
  }
}
`;

export default function CodeGenerationExercise() {
  const [selectedTab, setSelectedTab] = useState<string | null>('overview');

  return (
    <Container size="lg">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} mb="xs">Exercise 21: GraphQL Code Generation</Title>
          <Text c="dimmed">Automate type-safe GraphQL operations with code generation</Text>
        </div>
        <Badge color="blue" variant="light" size="lg">
          Advanced Patterns
        </Badge>
      </Group>

      <Tabs value={selectedTab} onChange={setSelectedTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconCode size={16} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="setup" leftSection={<IconFileCheck size={16} />}>
            Setup
          </Tabs.Tab>
          <Tabs.Tab value="generated" leftSection={<IconRocket size={16} />}>
            Generated Code
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <Stack gap="md">
            <Alert icon={<IconAlertCircle />} color="orange">
              <Text fw={600}>Exercise Objective</Text>
              <Text size="sm">
                Set up GraphQL Code Generator to automatically create type-safe hooks, 
                components, and TypeScript definitions from your GraphQL schema and operations.
              </Text>
            </Alert>

            <Card withBorder p="md">
              <Title order={4} mb="sm">Code Generation Benefits</Title>
              <Stack gap="xs">
                <Text size="sm">• <strong>Type Safety:</strong> Automatic TypeScript types from schema</Text>
                <Text size="sm">• <strong>Developer Experience:</strong> IntelliSense and autocompletion</Text>
                <Text size="sm">• <strong>Error Prevention:</strong> Compile-time validation of operations</Text>
                <Text size="sm">• <strong>Performance:</strong> Optimized queries and mutations</Text>
                <Text size="sm">• <strong>Consistency:</strong> Standardized operation patterns</Text>
              </Stack>
            </Card>

            <Card withBorder p="md">
              <Title order={4} mb="sm">Generated Artifacts</Title>
              <Stack gap="xs">
                <Text size="sm">• TypeScript interfaces for all GraphQL types</Text>
                <Text size="sm">• Type-safe React hooks (useQuery, useMutation, etc.)</Text>
                <Text size="sm">• Operation variables and result types</Text>
                <Text size="sm">• Fragment type definitions</Text>
                <Text size="sm">• Custom scalar mappings</Text>
              </Stack>
            </Card>

            <UsersListGenerated />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="setup" pt="md">
          <Stack gap="md">
            <Card withBorder p="md">
              <Title order={4} mb="sm">Configuration File</Title>
              <Code block>{codegenConfig}</Code>
            </Card>

            <Card withBorder p="md">
              <Title order={4} mb="sm">GraphQL Operations</Title>
              <Code block>{userOperations}</Code>
            </Card>

            <Card withBorder p="md">
              <Title order={4} mb="sm">Fragment Patterns</Title>
              <Code block>{fragmentExample}</Code>
            </Card>

            <Alert icon={<IconCode />} color="blue">
              <Text fw={600}>Generation Command</Text>
              <Code>npm run graphql-codegen</Code>
            </Alert>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="generated" pt="md">
          <Stack gap="md">
            <Card withBorder p="md">
              <Title order={4} mb="sm">Type-Safe Form</Title>
              <GeneratedForm onSubmit={(data) => console.log('Form submitted:', data)} />
            </Card>

            <Card withBorder p="md">
              <Title order={4} mb="sm">Custom Template</Title>
              <Code block>{customTemplate}</Code>
            </Card>

            <Alert icon={<IconRocket />} color="green">
              <Text fw={600}>Next Steps</Text>
              <Text size="sm">
                1. Run code generation after schema changes<br/>
                2. Use generated types in components<br/>
                3. Set up watch mode for development<br/>
                4. Create custom templates for specific patterns
              </Text>
            </Alert>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}