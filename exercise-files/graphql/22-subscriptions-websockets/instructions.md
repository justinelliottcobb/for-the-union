# Exercise 22: Real-time Subscriptions & WebSockets

## 🎯 Learning Objectives
- Implement GraphQL subscriptions using WebSocket connections
- Build real-time messaging systems with typing indicators
- Create user presence tracking and status updates
- Develop push notification systems with browser integration
- Master connection management and error handling strategies

## 📚 Concepts Covered

### WebSocket Integration
- **Connection Setup**: GraphQL WebSocket Link configuration
- **Authentication**: Secure connection parameters and token management
- **Error Handling**: Reconnection strategies and failure recovery
- **Performance**: Connection pooling and resource optimization

### Real-time Features
- **Live Messaging**: Instant message delivery and display
- **User Presence**: Online status and activity indicators
- **Push Notifications**: Browser notification integration
- **Activity Feeds**: Real-time updates of user interactions
- **Typing Indicators**: Live feedback for user input

## 🚀 Exercise Tasks

### Part 1: WebSocket Client Setup (⭐⭐⭐)

1. **Install Dependencies**
   ```bash
   npm install graphql-ws ws @apollo/client graphql-subscriptions
   ```

2. **Configure WebSocket Link**
   - Set up GraphQL WebSocket Link with proper URL
   - Implement authentication through connection parameters
   - Configure retry logic with exponential backoff
   - Set up link splitting for queries vs subscriptions

3. **Apollo Client Integration**
   - Combine HTTP and WebSocket links
   - Configure subscription-specific cache policies
   - Set up connection monitoring and status tracking
   - Implement proper cleanup and disconnection

### Part 2: Subscription Operations (⭐⭐⭐⭐)

1. **Message Subscriptions**
   - Create real-time message delivery subscriptions
   - Implement channel-based message filtering
   - Add message metadata (timestamps, user info)
   - Handle message ordering and deduplication

2. **Presence Tracking**
   - Build user online/offline status subscriptions
   - Implement typing indicator subscriptions
   - Create activity status updates (idle, active, away)
   - Add location-based presence (current channel/page)

3. **Notification System**
   - Set up push notification subscriptions
   - Implement notification categorization and priority
   - Add read/unread status tracking
   - Create notification history and management

### Part 3: Real-time Components (⭐⭐⭐⭐⭐)

1. **Live Chat Interface**
   - Build message list with auto-scrolling
   - Implement typing indicators display
   - Add message composition with real-time preview
   - Create emoji reactions and rich text support

2. **Presence Indicators**
   - Show user online status in real-time
   - Display typing indicators per channel
   - Implement user activity tracking
   - Add "last seen" timestamp functionality

3. **Notification Center**
   - Build real-time notification panel
   - Integrate browser push notifications
   - Add notification sound and visual effects
   - Implement notification grouping and batching

### Part 4: Advanced Patterns (⭐⭐⭐⭐⭐)

1. **Connection Management**
   - Implement connection health monitoring
   - Add automatic reconnection with backoff
   - Handle network disconnection gracefully
   - Create connection status indicators

2. **Performance Optimization**
   - Implement subscription batching
   - Add selective subscription management
   - Create efficient cache updates
   - Optimize re-rendering with proper memoization

3. **Error Handling**
   - Handle WebSocket connection failures
   - Implement subscription error recovery
   - Add rate limiting and throttling
   - Create fallback mechanisms for poor connectivity

## 🔧 Implementation Guide

### WebSocket Link Configuration
```typescript
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
    userId: getCurrentUserId(),
  }),
  shouldRetry: (errOrCloseEvent) => {
    // Don't retry on authentication errors
    return !errOrCloseEvent || errOrCloseEvent.code !== 4401;
  },
  retryAttempts: 5,
  retryWait: async (retries) => {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    await new Promise(resolve => 
      setTimeout(resolve, Math.pow(2, retries) * 1000)
    );
  },
  on: {
    connected: () => console.log('WebSocket connected'),
    closed: () => console.log('WebSocket closed'),
    error: (error) => console.error('WebSocket error:', error),
  },
}));

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
```

### Subscription Hook Pattern
```typescript
const useRealtimeMessages = (channelId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const { data, loading, error } = useMessageAddedSubscription({
    variables: { channelId },
    onSubscriptionData: ({ subscriptionData, client }) => {
      if (subscriptionData.data?.messageAdded) {
        const newMessage = subscriptionData.data.messageAdded;
        
        // Update local state
        setMessages(prev => [...prev, newMessage]);
        
        // Update Apollo cache
        client.cache.modify({
          fields: {
            messages(existingMessages = []) {
              const newMessageRef = client.cache.writeFragment({
                data: newMessage,
                fragment: MESSAGE_FRAGMENT,
              });
              return [...existingMessages, newMessageRef];
            }
          }
        });
        
        // Scroll to new message
        scrollToBottom();
        
        // Show notification if not in focus
        if (document.hidden) {
          showNotification(newMessage);
        }
      }
    },
    onError: (error) => {
      console.error('Subscription error:', error);
      // Handle connection issues
      handleSubscriptionError(error);
    }
  });
  
  return { messages, loading, error };
};
```

### Presence Management
```typescript
const useUserPresence = () => {
  const [presence, setPresence] = useState<PresenceState>({});
  const [currentUser, setCurrentUser] = useState<string>('');
  
  // Subscribe to presence changes
  const { data } = useUserPresenceChangedSubscription({
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data?.userPresenceChanged) {
        const update = subscriptionData.data.userPresenceChanged;
        setPresence(prev => ({
          ...prev,
          [update.userId]: {
            status: update.status,
            lastSeen: update.lastSeen,
            isTyping: update.isTyping,
            currentChannel: update.currentChannel,
          }
        }));
      }
    }
  });
  
  // Update own presence
  const updatePresence = useUpdatePresenceMutation();
  
  const setUserTyping = (isTyping: boolean, channelId: string) => {
    updatePresence({
      variables: {
        input: {
          isTyping,
          currentChannel: channelId,
        }
      }
    });
  };
  
  return { presence, setUserTyping };
};
```

## 🧪 Testing Requirements

### Subscription Testing
```typescript
import { MockedProvider } from '@apollo/client/testing';
import { act, renderHook, waitFor } from '@testing-library/react';

const subscriptionMocks = [
  {
    request: {
      query: MESSAGE_ADDED_SUBSCRIPTION,
      variables: { channelId: 'test-channel' }
    },
    result: {
      data: {
        messageAdded: {
          id: '1',
          content: 'Test message',
          user: { id: '1', name: 'Test User' },
          createdAt: '2023-01-01T00:00:00Z'
        }
      }
    }
  }
];

test('processes subscription data correctly', async () => {
  const { result } = renderHook(
    () => useRealtimeMessages('test-channel'),
    {
      wrapper: ({ children }) => (
        <MockedProvider mocks={subscriptionMocks} addTypename={false}>
          {children}
        </MockedProvider>
      )
    }
  );
  
  await waitFor(() => {
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Test message');
  });
});
```

### WebSocket Connection Testing
```typescript
import WS from 'jest-websocket-mock';

test('handles WebSocket connection lifecycle', async () => {
  const server = new WS('ws://localhost:4000/graphql');
  
  // Test connection
  const client = createWSClient();
  await server.connected;
  
  // Test message sending
  client.send(JSON.stringify({ type: 'connection_init' }));
  await expect(server).toReceiveMessage({ type: 'connection_init' });
  
  // Test disconnection
  server.close();
  await expect(client).toReceiveMessage({ type: 'connection_error' });
  
  server.cleanup();
});
```

## 🎯 Acceptance Criteria

### Core Functionality
- [ ] WebSocket connection established with proper authentication
- [ ] Real-time message delivery working in both directions
- [ ] User presence tracking active and updating
- [ ] Push notifications functioning with proper permissions
- [ ] Connection status monitoring and display

### Advanced Features
- [ ] Automatic reconnection with exponential backoff
- [ ] Typing indicators updating in real-time
- [ ] Message history loading on reconnection
- [ ] Optimistic updates with rollback on failure
- [ ] Subscription cleanup on component unmount

### Error Handling
- [ ] Graceful handling of connection failures
- [ ] User feedback for connection issues
- [ ] Fallback mechanisms for poor connectivity
- [ ] Rate limiting and throttling protection
- [ ] Authentication error recovery

### Performance
- [ ] Minimal re-renders on subscription updates
- [ ] Efficient cache updates and invalidation
- [ ] Memory leak prevention in long-lived connections
- [ ] Batching of rapid subscription updates
- [ ] Lazy subscription activation based on visibility

## 🚀 Bonus Challenges

### Advanced Real-time Features
- Implement collaborative editing with operational transforms
- Create real-time cursor tracking and selection sharing
- Build voice/video call signaling through GraphQL subscriptions
- Add real-time collaborative whiteboard functionality

### Performance Optimization
- Implement subscription multiplexing for related data
- Create intelligent subscription batching and debouncing
- Add connection pooling for multiple subscription types
- Build subscription priority and bandwidth management

### Monitoring and Analytics
- Create WebSocket connection metrics and monitoring
- Implement subscription performance analytics
- Add real-time user engagement tracking
- Build connection health dashboards

## 📖 Key Concepts to Understand

### WebSocket vs HTTP
- Connection persistence and resource efficiency
- Bi-directional communication capabilities
- Real-time latency characteristics
- Scalability considerations and trade-offs

### Subscription Lifecycle
- Connection establishment and authentication
- Subscription registration and management
- Data delivery and client processing
- Cleanup and disconnection handling

### Error Recovery Strategies
- Connection failure detection and classification
- Retry logic and exponential backoff
- State synchronization after reconnection
- User experience during connectivity issues

---

**Estimated Time:** 90-105 minutes

**Difficulty:** ⭐⭐⭐⭐⭐ (Expert - Real-time systems and WebSocket management)

**Prerequisites:** 
- WebSocket and real-time systems knowledge
- GraphQL subscription concepts
- Browser notification API familiarity
- Advanced React hooks and state management