// Apollo Client Advanced Patterns Exercise
// Master custom links, local state, directives, and performance optimization

import React, { useState, useEffect } from 'react';
import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  useApolloClient,
  useQuery,
  useMutation,
  gql,
  from,
  Observable,
  Operation,
  NextLink,
  FetchResult,
  makeVar,
  FieldPolicy,
  InMemoryCache
} from '@apollo/client';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';

// TODO 1: Custom Apollo Links for Middleware Functionality

// Authentication Link with Token Refresh
export class AuthLink extends ApolloLink {
  private tokenRefreshPromise: Promise<string> | null = null;

  constructor(private getToken: () => string | null, private refreshToken: () => Promise<string>) {
    super();
  }

  request(operation: Operation, forward: NextLink) {
    return new Observable(observer => {
      // TODO: Implement authentication link with automatic token refresh
      const token = this.getToken();
      
      // Add auth header
      operation.setContext({
        headers: {
          ...operation.getContext().headers,
          authorization: token ? `Bearer ${token}` : ''
        }
      });

      const subscription = forward(operation).subscribe({
        next: (result) => {
          // Check for authentication errors
          const hasAuthError = result.errors?.some(
            error => error.extensions?.code === 'UNAUTHENTICATED'
          );

          if (hasAuthError && !this.tokenRefreshPromise) {
            // TODO: Attempt token refresh and retry
            this.handleTokenRefresh(operation, forward, observer);
          } else {
            observer.next(result);
          }
        },
        error: observer.error.bind(observer),
        complete: observer.complete.bind(observer)
      });

      return subscription;
    });
  }

  private async handleTokenRefresh(
    operation: Operation, 
    forward: NextLink, 
    observer: any
  ) {
    try {
      // TODO: Implement token refresh logic
      if (!this.tokenRefreshPromise) {
        this.tokenRefreshPromise = this.refreshToken();
      }

      const newToken = await this.tokenRefreshPromise;
      this.tokenRefreshPromise = null;

      // Update operation with new token
      operation.setContext({
        headers: {
          ...operation.getContext().headers,
          authorization: `Bearer ${newToken}`
        }
      });

      // Retry the operation
      const retrySubscription = forward(operation).subscribe({
        next: observer.next.bind(observer),
        error: observer.error.bind(observer),
        complete: observer.complete.bind(observer)
      });

      return retrySubscription;
    } catch (error) {
      // Token refresh failed - redirect to login
      observer.error(error);
      // TODO: Trigger logout/redirect to login
    }
  }
}

// Queue Link for Offline Support
export class QueueLink extends ApolloLink {
  private queue: Array<{
    operation: Operation;
    forward: NextLink;
    observer: any;
  }> = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    super();
    this.setupOnlineListener();
  }

  request(operation: Operation, forward: NextLink) {
    return new Observable(observer => {
      if (this.isOnline) {
        // TODO: Execute immediately when online
        return forward(operation).subscribe(observer);
      } else {
        // TODO: Queue operation for later when offline
        this.queue.push({ operation, forward, observer });
        
        // Return a subscription that can be cancelled
        return {
          unsubscribe: () => {
            const index = this.queue.findIndex(item => item.observer === observer);
            if (index > -1) {
              this.queue.splice(index, 1);
            }
          }
        };
      }
    });
  }

  private setupOnlineListener() {
    // TODO: Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private processQueue() {
    // TODO: Process all queued operations
    while (this.queue.length > 0) {
      const { operation, forward, observer } = this.queue.shift()!;
      forward(operation).subscribe(observer);
    }
  }
}

// Batching Link for Query Optimization
export class BatchLink extends ApolloLink {
  private batchQueue: Array<{
    operation: Operation;
    observer: any;
  }> = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(private batchInterval: number = 10) {
    super();
  }

  request(operation: Operation, forward: NextLink) {
    return new Observable(observer => {
      // TODO: Implement query batching
      if (operation.operationName === 'IntrospectionQuery') {
        // Don't batch introspection queries
        return forward(operation).subscribe(observer);
      }

      // Add to batch queue
      this.batchQueue.push({ operation, observer });

      // Set batch timer if not already set
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatch(forward);
        }, this.batchInterval);
      }

      return {
        unsubscribe: () => {
          const index = this.batchQueue.findIndex(item => item.observer === observer);
          if (index > -1) {
            this.batchQueue.splice(index, 1);
          }
        }
      };
    });
  }

  private processBatch(forward: NextLink) {
    // TODO: Process batched operations
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimer = null;

    if (batch.length === 0) return;

    if (batch.length === 1) {
      // Single operation, execute normally
      const { operation, observer } = batch[0];
      forward(operation).subscribe(observer);
    } else {
      // TODO: Implement actual query batching
      // For now, execute each operation individually
      batch.forEach(({ operation, observer }) => {
        forward(operation).subscribe(observer);
      });
    }
  }
}

// TODO 2: Local State Management with Apollo Client
// Define local state schema and resolvers

const localStateTypeDefs = gql`
  type CartItem {
    productId: ID!
    quantity: Int!
    price: Float!
  }

  type ShoppingCart {
    items: [CartItem!]!
    total: Float!
    itemCount: Int!
  }

  type UIState {
    isLoggedIn: Boolean!
    currentUserId: ID
    theme: String!
    sidebarOpen: Boolean!
    notifications: [Notification!]!
  }

  type Notification {
    id: ID!
    type: String!
    message: String!
    timestamp: String!
    read: Boolean!
  }

  extend type Query {
    cart: ShoppingCart!
    uiState: UIState!
  }

  extend type Mutation {
    addToCart(productId: ID!, quantity: Int = 1, price: Float!): ShoppingCart!
    removeFromCart(productId: ID!): ShoppingCart!
    clearCart: ShoppingCart!
    updateQuantity(productId: ID!, quantity: Int!): ShoppingCart!
    setTheme(theme: String!): UIState!
    toggleSidebar: UIState!
    addNotification(type: String!, message: String!): UIState!
    markNotificationRead(id: ID!): UIState!
  }
`;

// Reactive variables for local state
const cartVar = makeVar<Array<{ productId: string; quantity: number; price: number }>>([]);
const uiStateVar = makeVar({
  isLoggedIn: false,
  currentUserId: null,
  theme: 'light',
  sidebarOpen: false,
  notifications: []
});

// Local resolvers
const localResolvers = {
  Query: {
    cart: () => {
      const items = cartVar();
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        __typename: 'ShoppingCart',
        items,
        total,
        itemCount
      };
    },
    
    uiState: () => ({
      __typename: 'UIState',
      ...uiStateVar()
    })
  },

  Mutation: {
    addToCart: (_parent: any, { productId, quantity, price }: any) => {
      // TODO: Implement add to cart logic
      const currentCart = cartVar();
      const existingItemIndex = currentCart.findIndex(item => item.productId === productId);

      let updatedCart;
      if (existingItemIndex > -1) {
        // Update existing item
        updatedCart = [...currentCart];
        updatedCart[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        updatedCart = [...currentCart, { productId, quantity, price }];
      }

      cartVar(updatedCart);

      // Return updated cart
      const total = updatedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = updatedCart.reduce((sum, item) => sum + item.quantity, 0);

      return {
        __typename: 'ShoppingCart',
        items: updatedCart,
        total,
        itemCount
      };
    },

    removeFromCart: (_parent: any, { productId }: any) => {
      // TODO: Implement remove from cart logic
      const updatedCart = cartVar().filter(item => item.productId !== productId);
      cartVar(updatedCart);

      const total = updatedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = updatedCart.reduce((sum, item) => sum + item.quantity, 0);

      return {
        __typename: 'ShoppingCart',
        items: updatedCart,
        total,
        itemCount
      };
    },

    clearCart: () => {
      cartVar([]);
      return {
        __typename: 'ShoppingCart',
        items: [],
        total: 0,
        itemCount: 0
      };
    },

    setTheme: (_parent: any, { theme }: any) => {
      const updatedState = { ...uiStateVar(), theme };
      uiStateVar(updatedState);
      return { __typename: 'UIState', ...updatedState };
    },

    toggleSidebar: () => {
      const updatedState = { ...uiStateVar(), sidebarOpen: !uiStateVar().sidebarOpen };
      uiStateVar(updatedState);
      return { __typename: 'UIState', ...updatedState };
    },

    addNotification: (_parent: any, { type, message }: any) => {
      const notification = {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date().toISOString(),
        read: false
      };

      const currentState = uiStateVar();
      const updatedState = {
        ...currentState,
        notifications: [...currentState.notifications, notification]
      };
      
      uiStateVar(updatedState);
      return { __typename: 'UIState', ...updatedState };
    }
  }
};

// TODO 3: Custom Directives Implementation
const customDirectives = {
  // @cached directive for field-level caching
  cached: {
    definition: gql`
      directive @cached(ttl: Int = 300) on FIELD_DEFINITION
    `,
    transformer: (schema: any) => {
      // TODO: Implement cached directive transformer
      return schema;
    }
  },

  // @auth directive for authorization
  auth: {
    definition: gql`
      directive @auth(requires: String!) on FIELD_DEFINITION | OBJECT
    `,
    transformer: (schema: any) => {
      // TODO: Implement auth directive transformer
      return schema;
    }
  },

  // @deprecated directive for field deprecation
  deprecated: {
    definition: gql`
      directive @deprecated(reason: String = "No longer supported") on FIELD_DEFINITION | ENUM_VALUE
    `,
    transformer: (schema: any) => {
      // TODO: Implement deprecated directive transformer
      return schema;
    }
  }
};

// TODO 4: Advanced Caching with Field Policies
const advancedFieldPolicies: Record<string, FieldPolicy> = {
  // Computed field with dependencies
  fullName: {
    read(existing, { readField }) {
      const firstName = readField('firstName');
      const lastName = readField('lastName');
      return `${firstName} ${lastName}`.trim();
    }
  },

  // Paginated list with cursor-based pagination
  posts: {
    keyArgs: ['sortBy', 'filter'],
    merge(existing = { edges: [], pageInfo: { hasNextPage: false } }, incoming) {
      // TODO: Implement cursor-based pagination merge
      return {
        edges: [...existing.edges, ...incoming.edges],
        pageInfo: incoming.pageInfo
      };
    }
  },

  // Real-time data with TTL
  liveStats: {
    read(existing, { cache, readField }) {
      // TODO: Check if data is stale and needs refresh
      const lastUpdated = readField('lastUpdated');
      if (lastUpdated) {
        const age = Date.now() - new Date(lastUpdated as string).getTime();
        if (age > 30000) { // 30 seconds TTL
          // Trigger background refresh
          // This would typically be done through a separate mechanism
        }
      }
      return existing;
    }
  }
};

// TODO 5: Performance Optimization Techniques
export class PerformanceMonitor {
  private metrics: Map<string, {
    count: number;
    totalTime: number;
    avgTime: number;
    maxTime: number;
    minTime: number;
  }> = new Map();

  startTiming(operationName: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operationName, duration);
    };
  }

  private recordMetric(operationName: string, duration: number) {
    const existing = this.metrics.get(operationName);
    
    if (existing) {
      const newCount = existing.count + 1;
      const newTotal = existing.totalTime + duration;
      
      this.metrics.set(operationName, {
        count: newCount,
        totalTime: newTotal,
        avgTime: newTotal / newCount,
        maxTime: Math.max(existing.maxTime, duration),
        minTime: Math.min(existing.minTime, duration)
      });
    } else {
      this.metrics.set(operationName, {
        count: 1,
        totalTime: duration,
        avgTime: duration,
        maxTime: duration,
        minTime: duration
      });
    }
  }

  getMetrics(): Record<string, any> {
    return Object.fromEntries(this.metrics);
  }

  // TODO: Detect slow operations
  getSlowOperations(threshold: number = 1000): string[] {
    return Array.from(this.metrics.entries())
      .filter(([_, metrics]) => metrics.avgTime > threshold)
      .map(([name]) => name);
  }
}

// Performance monitoring link
export const createPerformanceLink = (monitor: PerformanceMonitor) => {
  return new ApolloLink((operation, forward) => {
    const endTiming = monitor.startTiming(operation.operationName || 'Unknown');
    
    return forward(operation).map(result => {
      endTiming();
      
      // TODO: Add performance warnings
      const slowOps = monitor.getSlowOperations(500);
      if (slowOps.includes(operation.operationName || '')) {
        console.warn(`Slow GraphQL operation detected: ${operation.operationName}`);
      }
      
      return result;
    });
  });
};

// TODO 6: Advanced Testing with MockedProvider
export const createAdvancedMocks = (): MockedResponse[] => [
  // TODO: Create comprehensive mocks for testing
  {
    request: {
      query: gql`
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            username
            email
            profile {
              firstName
              lastName
              avatar
            }
          }
        }
      `,
      variables: { id: '1' }
    },
    result: {
      data: {
        user: {
          __typename: 'User',
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          profile: {
            __typename: 'UserProfile',
            firstName: 'Test',
            lastName: 'User',
            avatar: 'https://example.com/avatar.jpg'
          }
        }
      }
    }
  },

  // Mock with loading delay
  {
    request: {
      query: gql`
        query GetPosts {
          posts {
            id
            title
            content
          }
        }
      `
    },
    result: {
      data: {
        posts: [
          {
            __typename: 'Post',
            id: '1',
            title: 'Test Post',
            content: 'This is a test post'
          }
        ]
      }
    },
    delay: 1000 // 1 second delay
  },

  // Mock with error
  {
    request: {
      query: gql`
        mutation CreatePost($input: CreatePostInput!) {
          createPost(input: $input) {
            id
            title
          }
        }
      `,
      variables: {
        input: {
          title: 'Invalid Post'
        }
      }
    },
    result: {
      errors: [new GraphQLError('Validation failed')]
    }
  }
];

// TODO 7: Schema Stitching and Federation Support
export const createFederatedClient = (services: Array<{ name: string; url: string }>) => {
  // TODO: Implement federated client setup
  const links = services.map(service => 
    new ApolloLink((operation, forward) => {
      // Route operations to appropriate service
      if (operation.getContext().serviceName === service.name) {
        operation.setContext({
          uri: service.url
        });
      }
      return forward ? forward(operation) : null;
    })
  );

  return from(links);
};

// TODO 8: Real-time Subscriptions with Advanced Patterns
export const SubscriptionManager = {
  // Connection pooling for subscriptions
  connectionPool: new Map<string, any>(),

  createSubscription(subscription: any, variables: any) {
    // TODO: Implement subscription connection pooling
    const key = `${subscription.loc?.source.body}-${JSON.stringify(variables)}`;
    
    if (this.connectionPool.has(key)) {
      return this.connectionPool.get(key);
    }

    // Create new subscription
    const sub = { subscription, variables };
    this.connectionPool.set(key, sub);
    return sub;
  },

  cleanup() {
    // TODO: Clean up idle subscriptions
    this.connectionPool.clear();
  }
};

// TODO 9: Error Recovery and Resilience Patterns
export const createResilientClient = (uri: string) => {
  const performanceMonitor = new PerformanceMonitor();
  
  const resilientLink = from([
    // Error handling with classification
    new ApolloLink((operation, forward) => {
      return forward(operation).map(result => {
        if (result.errors) {
          // TODO: Classify and handle different error types
          result.errors.forEach(error => {
            const errorCode = error.extensions?.code;
            switch (errorCode) {
              case 'RATE_LIMITED':
                // Implement exponential backoff
                break;
              case 'SERVICE_UNAVAILABLE':
                // Try alternative endpoint
                break;
              default:
                // Log for monitoring
                break;
            }
          });
        }
        return result;
      });
    }),

    // Authentication with refresh
    new AuthLink(
      () => localStorage.getItem('token'),
      async () => {
        // TODO: Implement token refresh
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        
        // Call refresh endpoint
        const response = await fetch('/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        
        const { token } = await response.json();
        localStorage.setItem('token', token);
        return token;
      }
    ),

    // Offline support
    new QueueLink(),

    // Performance monitoring
    createPerformanceLink(performanceMonitor),

    // HTTP link
    new ApolloLink(() => {
      return new Observable(observer => {
        fetch(uri, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }).then(response => response.json())
          .then(result => observer.next(result))
          .catch(observer.error.bind(observer));
      });
    })
  ]);

  return new ApolloClient({
    link: resilientLink,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: advancedFieldPolicies
        }
      }
    }),
    typeDefs: localStateTypeDefs,
    resolvers: localResolvers
  });
};

// TODO 10: Example Components Demonstrating Advanced Patterns
export const AdvancedApolloDemo: React.FC = () => {
  const [mocks] = useState(createAdvancedMocks());
  const [showRealClient, setShowRealClient] = useState(false);

  const MockedDemo = () => (
    <MockedProvider mocks={mocks} addTypename={false}>
      <TestComponent />
    </MockedProvider>
  );

  const RealClientDemo = () => {
    const client = createResilientClient('http://localhost:4000/graphql');
    
    return (
      <ApolloProvider client={client}>
        <ProductionComponent />
      </ApolloProvider>
    );
  };

  return (
    <div className="advanced-apollo-demo">
      <h2>Advanced Apollo Client Patterns</h2>
      
      <div className="demo-controls">
        <button onClick={() => setShowRealClient(!showRealClient)}>
          {showRealClient ? 'Show Mocked Demo' : 'Show Real Client Demo'}
        </button>
      </div>

      {showRealClient ? <RealClientDemo /> : <MockedDemo />}
    </div>
  );
};

const TestComponent: React.FC = () => {
  // TODO: Component for testing with mocks
  const { data, loading, error } = useQuery(gql`
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        username
        email
        profile {
          firstName
          lastName
          avatar
        }
      }
    }
  `, { variables: { id: '1' } });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="test-component">
      <h3>Mocked User Data:</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

const ProductionComponent: React.FC = () => {
  const client = useApolloClient();
  
  // TODO: Component demonstrating production features
  const { data: cartData } = useQuery(gql`
    query GetCart {
      cart @client {
        items {
          productId
          quantity
          price
        }
        total
        itemCount
      }
    }
  `);

  const [addToCart] = useMutation(gql`
    mutation AddToCart($productId: ID!, $quantity: Int!, $price: Float!) {
      addToCart(productId: $productId, quantity: $quantity, price: $price) @client {
        items {
          productId
          quantity
          price
        }
        total
        itemCount
      }
    }
  `);

  const handleAddToCart = () => {
    addToCart({
      variables: {
        productId: 'product-1',
        quantity: 1,
        price: 29.99
      }
    });
  };

  return (
    <div className="production-component">
      <h3>Local State Management:</h3>
      <div>Cart Items: {cartData?.cart.itemCount || 0}</div>
      <div>Cart Total: ${cartData?.cart.total.toFixed(2) || '0.00'}</div>
      <button onClick={handleAddToCart}>Add Test Product to Cart</button>
      
      <h4>Cache Operations:</h4>
      <button onClick={() => client.resetStore()}>Reset Store</button>
      <button onClick={() => client.clearStore()}>Clear Store</button>
    </div>
  );
};

export default AdvancedApolloDemo;