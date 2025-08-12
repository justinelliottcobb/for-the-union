import React, { useState, useEffect, useRef } from 'react';
import { Container, Title, Text, Group, Button, Card, Stack, Badge, Alert, Code, Tabs, TextInput, ScrollArea, Indicator } from '@mantine/core';
import { IconWifi, IconWifiOff, IconMessage, IconUsers, IconBell, IconActivityHeartbeat } from '@tabler/icons-react';

// TODO: Install WebSocket and subscription packages
// npm install graphql-ws ws @apollo/client graphql-subscriptions

// TODO: Set up WebSocket link for Apollo Client
const webSocketSetup = `
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql'
});

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4000/graphql',
  connectionParams: () => ({
    authToken: localStorage.getItem('auth-token'),
  }),
  shouldRetry: (errOrCloseEvent) => {
    // Retry on network errors, not on auth failures
    return !errOrCloseEvent || errOrCloseEvent.code !== 4401;
  },
  retryAttempts: 5,
  retryWait: async (retries) => {
    // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
  }
}));

// Split link: WebSocket for subscriptions, HTTP for queries/mutations
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);
`;

// TODO: Define GraphQL subscriptions
const subscriptionOperations = `
# Real-time message subscription
subscription MessageAdded($channelId: ID!) {
  messageAdded(channelId: $channelId) {
    id
    content
    createdAt
    user {
      id
      profile {
        firstName
        lastName
        avatar
      }
    }
    channel {
      id
      name
    }
  }
}

# User presence subscription
subscription UserPresenceChanged {
  userPresenceChanged {
    userId
    status
    lastSeen
    isTyping
    currentChannel
  }
}

# Notification subscription
subscription NotificationReceived($userId: ID!) {
  notificationReceived(userId: $userId) {
    id
    type
    title
    message
    data
    createdAt
    read
  }
}

# Live activity feed
subscription ActivityFeedUpdated {
  activityFeedUpdated {
    id
    type
    actor {
      id
      profile {
        firstName
        lastName
        avatar
      }
    }
    target {
      ... on Post {
        id
        title
      }
      ... on User {
        id
        profile {
          firstName
          lastName
        }
      }
    }
    action
    createdAt
  }
}
`;

// Connection status hook
const useConnectionStatus = () => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [lastConnected, setLastConnected] = useState<Date | null>(null);

  useEffect(() => {
    // TODO: Implement WebSocket connection monitoring
    // This would connect to the actual WebSocket client events
    const timer = setInterval(() => {
      // Simulate connection status changes for demo
      setStatus(prev => {
        if (prev === 'connecting') {
          setLastConnected(new Date());
          return 'connected';
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  return { status, lastConnected };
};

// Real-time message component
const RealtimeMessages: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // TODO: Use actual subscription hook
  // const { data: messageData } = useMessageAddedSubscription({
  //   variables: { channelId },
  //   onSubscriptionData: ({ subscriptionData }) => {
  //     if (subscriptionData.data?.messageAdded) {
  //       setMessages(prev => [...prev, subscriptionData.data.messageAdded]);
  //       scrollToBottom();
  //     }
  //   }
  // });

  // TODO: Use presence subscription
  // const { data: presenceData } = useUserPresenceChangedSubscription({
  //   onSubscriptionData: ({ subscriptionData }) => {
  //     if (subscriptionData.data?.userPresenceChanged) {
  //       const { userId, isTyping, currentChannel } = subscriptionData.data.userPresenceChanged;
  //       if (currentChannel === channelId) {
  //         setTypingUsers(prev => 
  //           isTyping 
  //             ? [...prev.filter(id => id !== userId), userId]
  //             : prev.filter(id => id !== userId)
  //         );
  //       }
  //     }
  //   }
  // });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Demo data
  useEffect(() => {
    const demoMessages = [
      { id: '1', content: 'Hello everyone!', user: { profile: { firstName: 'Alice', lastName: 'Smith' } }, createdAt: new Date().toISOString() },
      { id: '2', content: 'How is everyone doing?', user: { profile: { firstName: 'Bob', lastName: 'Jones' } }, createdAt: new Date().toISOString() }
    ];
    setMessages(demoMessages);
  }, [channelId]);

  return (
    <Card withBorder h={300}>
      <Stack gap="xs" h="100%">
        <ScrollArea flex={1}>
          <Stack gap="xs">
            {messages.map(message => (
              <Card key={message.id} padding="xs" withBorder>
                <Group justify="space-between">
                  <Text fw={600} size="sm">
                    {message.user.profile.firstName} {message.user.profile.lastName}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </Text>
                </Group>
                <Text size="sm">{message.content}</Text>
              </Card>
            ))}
            {typingUsers.length > 0 && (
              <Text size="xs" c="dimmed" fs="italic">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </Text>
            )}
            <div ref={messagesEndRef} />
          </Stack>
        </ScrollArea>
        <TextInput
          placeholder="Type a message..."
          rightSection={<Button size="xs">Send</Button>}
        />
      </Stack>
    </Card>
  );
};

// Live notifications component
const LiveNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // TODO: Use notification subscription
  // const { data } = useNotificationReceivedSubscription({
  //   variables: { userId: getCurrentUserId() },
  //   onSubscriptionData: ({ subscriptionData }) => {
  //     if (subscriptionData.data?.notificationReceived) {
  //       const notification = subscriptionData.data.notificationReceived;
  //       setNotifications(prev => [notification, ...prev]);
  //       if (!notification.read) {
  //         setUnreadCount(prev => prev + 1);
  //         // Show browser notification
  //         if (Notification.permission === 'granted') {
  //           new Notification(notification.title, {
  //             body: notification.message,
  //             icon: '/favicon.ico'
  //           });
  //         }
  //       }
  //     }
  //   }
  // });

  // Demo notifications
  useEffect(() => {
    const timer = setInterval(() => {
      const demoNotification = {
        id: Date.now().toString(),
        type: 'message',
        title: 'New Message',
        message: 'You have a new message from Alice',
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [demoNotification, ...prev.slice(0, 4)]);
      setUnreadCount(prev => prev + 1);
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card withBorder>
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <IconBell size={20} />
          <Text fw={600}>Live Notifications</Text>
          {unreadCount > 0 && (
            <Indicator color="red" size={16} label={unreadCount} />
          )}
        </Group>
        <Button size="xs" variant="subtle" onClick={() => setUnreadCount(0)}>
          Mark All Read
        </Button>
      </Group>
      <Stack gap="xs">
        {notifications.length === 0 ? (
          <Text size="sm" c="dimmed">No notifications</Text>
        ) : (
          notifications.map(notification => (
            <Card key={notification.id} padding="xs" withBorder>
              <Group justify="space-between">
                <div>
                  <Text fw={600} size="sm">{notification.title}</Text>
                  <Text size="xs" c="dimmed">{notification.message}</Text>
                </div>
                {!notification.read && <Badge color="blue" size="xs">New</Badge>}
              </Group>
            </Card>
          ))
        )}
      </Stack>
    </Card>
  );
};

// Activity feed component
const LiveActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);

  // TODO: Use activity feed subscription
  // const { data } = useActivityFeedUpdatedSubscription({
  //   onSubscriptionData: ({ subscriptionData }) => {
  //     if (subscriptionData.data?.activityFeedUpdated) {
  //       setActivities(prev => [subscriptionData.data.activityFeedUpdated, ...prev.slice(0, 9)]);
  //     }
  //   }
  // });

  // Demo activities
  useEffect(() => {
    const demoActivities = [
      { id: '1', type: 'like', actor: { profile: { firstName: 'Alice', lastName: 'Smith' } }, action: 'liked a post', createdAt: new Date().toISOString() },
      { id: '2', type: 'follow', actor: { profile: { firstName: 'Bob', lastName: 'Jones' } }, action: 'started following you', createdAt: new Date().toISOString() }
    ];
    setActivities(demoActivities);
  }, []);

  return (
    <Card withBorder>
      <Group mb="sm">
        <IconActivityHeartbeat size={20} />
        <Text fw={600}>Live Activity</Text>
      </Group>
      <Stack gap="xs">
        {activities.map(activity => (
          <Group key={activity.id} gap="sm">
            <Text size="sm">
              <Text component="span" fw={600}>
                {activity.actor.profile.firstName} {activity.actor.profile.lastName}
              </Text>
              {' '}{activity.action}
            </Text>
            <Text size="xs" c="dimmed">
              {new Date(activity.createdAt).toLocaleTimeString()}
            </Text>
          </Group>
        ))}
      </Stack>
    </Card>
  );
};

// Connection status indicator
const ConnectionStatus: React.FC = () => {
  const { status, lastConnected } = useConnectionStatus();

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return { icon: <IconWifi />, color: 'green', text: 'Connected' };
      case 'connecting':
        return { icon: <IconWifi />, color: 'yellow', text: 'Connecting...' };
      case 'disconnected':
        return { icon: <IconWifiOff />, color: 'gray', text: 'Disconnected' };
      case 'error':
        return { icon: <IconWifiOff />, color: 'red', text: 'Connection Error' };
      default:
        return { icon: <IconWifi />, color: 'gray', text: 'Unknown' };
    }
  };

  const config = getStatusConfig();

  return (
    <Group gap="xs">
      <Badge color={config.color} variant="light" leftSection={config.icon}>
        {config.text}
      </Badge>
      {lastConnected && (
        <Text size="xs" c="dimmed">
          Last connected: {lastConnected.toLocaleTimeString()}
        </Text>
      )}
    </Group>
  );
};

export default function SubscriptionsWebSocketsExercise() {
  const [selectedTab, setSelectedTab] = useState<string | null>('overview');
  const [selectedChannel, setSelectedChannel] = useState('general');

  const channels = [
    { id: 'general', name: 'General' },
    { id: 'development', name: 'Development' },
    { id: 'random', name: 'Random' }
  ];

  return (
    <Container size="lg">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={2} mb="xs">Exercise 22: Real-time Subscriptions</Title>
          <Text c="dimmed">WebSocket-powered real-time GraphQL subscriptions</Text>
        </div>
        <Group>
          <Badge color="blue" variant="light" size="lg">
            Advanced Patterns
          </Badge>
          <ConnectionStatus />
        </Group>
      </Group>

      <Tabs value={selectedTab} onChange={setSelectedTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconMessage size={16} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="setup" leftSection={<IconWifi size={16} />}>
            Setup
          </Tabs.Tab>
          <Tabs.Tab value="subscriptions" leftSection={<IconBell size={16} />}>
            Live Demo
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <Stack gap="md">
            <Alert icon={<IconMessage />} color="blue">
              <Text fw={600}>Exercise Objective</Text>
              <Text size="sm">
                Implement real-time GraphQL subscriptions using WebSockets for live messaging, 
                notifications, presence indicators, and activity feeds.
              </Text>
            </Alert>

            <Card withBorder p="md">
              <Title order={4} mb="sm">Subscription Features</Title>
              <Stack gap="xs">
                <Text size="sm">• <strong>Real-time Messaging:</strong> Live chat with typing indicators</Text>
                <Text size="sm">• <strong>User Presence:</strong> Online status and activity tracking</Text>
                <Text size="sm">• <strong>Push Notifications:</strong> Instant browser notifications</Text>
                <Text size="sm">• <strong>Activity Feeds:</strong> Live updates of user interactions</Text>
                <Text size="sm">• <strong>Connection Management:</strong> Automatic reconnection and error handling</Text>
              </Stack>
            </Card>

            <Card withBorder p="md">
              <Title order={4} mb="sm">WebSocket Benefits</Title>
              <Stack gap="xs">
                <Text size="sm">• Bi-directional real-time communication</Text>
                <Text size="sm">• Lower latency compared to polling</Text>
                <Text size="sm">• Efficient resource usage</Text>
                <Text size="sm">• Automatic connection management</Text>
                <Text size="sm">• Authentication and authorization support</Text>
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="setup" pt="md">
          <Stack gap="md">
            <Card withBorder p="md">
              <Title order={4} mb="sm">Apollo Client WebSocket Setup</Title>
              <Code block>{webSocketSetup}</Code>
            </Card>

            <Card withBorder p="md">
              <Title order={4} mb="sm">Subscription Operations</Title>
              <Code block>{subscriptionOperations}</Code>
            </Card>

            <Alert icon={<IconWifi />} color="green">
              <Text fw={600}>Connection Features</Text>
              <Text size="sm">
                • Authentication with connection params<br/>
                • Exponential backoff retry strategy<br/>
                • Automatic reconnection handling<br/>
                • Link splitting for optimal performance
              </Text>
            </Alert>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="subscriptions" pt="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                <Text fw={600}>Channel:</Text>
                {channels.map(channel => (
                  <Button
                    key={channel.id}
                    size="xs"
                    variant={selectedChannel === channel.id ? 'filled' : 'outline'}
                    onClick={() => setSelectedChannel(channel.id)}
                  >
                    {channel.name}
                  </Button>
                ))}
              </Group>
            </Group>

            <Group align="flex-start">
              <div style={{ flex: 2 }}>
                <Text fw={600} mb="sm">Real-time Messages</Text>
                <RealtimeMessages channelId={selectedChannel} />
              </div>
              <div style={{ flex: 1 }}>
                <Stack gap="md">
                  <LiveNotifications />
                  <LiveActivityFeed />
                </Stack>
              </div>
            </Group>

            <Alert icon={<IconActivityHeartbeat />} color="green">
              <Text fw={600}>Live Features Active</Text>
              <Text size="sm">
                This demo shows WebSocket subscriptions in action. In a real implementation,
                these would connect to your GraphQL WebSocket server for true real-time updates.
              </Text>
            </Alert>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}