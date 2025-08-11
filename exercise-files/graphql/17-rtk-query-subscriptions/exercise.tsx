// RTK Query Advanced Patterns with GraphQL Subscriptions Exercise
// Implement real-time subscriptions and advanced caching patterns with RTK Query

import React, { useState, useEffect, useRef } from 'react';
import { Provider, useSelector } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';

// TODO 1: WebSocket-based Base Query for Subscriptions
// Create a base query that can handle both HTTP and WebSocket connections

interface SubscriptionRequest {
  type: 'subscription';
  query: string;
  variables?: Record<string, any>;
}

interface HttpRequest {
  type: 'query' | 'mutation';
  query: string;
  variables?: Record<string, any>;
}

type GraphQLRequest = HttpRequest | SubscriptionRequest;

// TODO: WebSocket connection manager
class WebSocketManager {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, {
    callback: (data: any) => void;
    query: string;
    variables?: Record<string, any>;
  }>();
  
  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // TODO: Implement WebSocket connection with GraphQL-WS protocol
      this.ws = new WebSocket(url, 'graphql-ws');
      
      this.ws.onopen = () => {
        // Initialize connection with GraphQL-WS protocol
        this.send({ type: 'connection_init' });
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };
      
      this.ws.onerror = (error) => {
        reject(error);
      };
      
      this.ws.onclose = () => {
        // TODO: Implement reconnection logic
        console.log('WebSocket connection closed');
        this.reconnect();
      };
    });
  }
  
  private handleMessage(message: any) {
    // TODO: Handle different GraphQL-WS message types
    switch (message.type) {
      case 'connection_ack':
        console.log('WebSocket connection acknowledged');
        break;
      case 'data':
        // Route data to appropriate subscription
        const subscription = this.subscriptions.get(message.id);
        if (subscription && message.payload) {
          subscription.callback(message.payload);
        }
        break;
      case 'error':
        console.error('Subscription error:', message.payload);
        break;
      case 'complete':
        // Subscription completed
        this.subscriptions.delete(message.id);
        break;
    }
  }
  
  subscribe(id: string, query: string, variables?: Record<string, any>, callback?: (data: any) => void) {
    if (callback) {
      this.subscriptions.set(id, { callback, query, variables });
    }
    
    // TODO: Send subscription message
    this.send({
      id,
      type: 'start',
      payload: {
        query,
        variables,
      },
    });
  }
  
  unsubscribe(id: string) {
    this.subscriptions.delete(id);
    this.send({
      id,
      type: 'stop',
    });
  }
  
  private send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  private reconnect() {
    // TODO: Implement exponential backoff reconnection
    setTimeout(() => {
      this.connect('wss://api.example.com/graphql');
    }, 1000);
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
  }
}

const wsManager = new WebSocketManager();

// TODO: Create hybrid base query for HTTP and WebSocket
const hybridBaseQuery: BaseQueryFn<GraphQLRequest, unknown, any> = async (args, api) => {
  if (args.type === 'subscription') {
    // Handle subscriptions via WebSocket
    return new Promise((resolve) => {
      const subscriptionId = `sub_${Date.now()}_${Math.random()}`;
      
      wsManager.subscribe(
        subscriptionId,
        args.query,
        args.variables,
        (data) => {
          // For RTK Query, we need to handle streaming data differently
          // This is a simplified approach - real implementation would be more complex
          resolve({ data });
        }
      );
      
      // Return initial empty result
      resolve({ data: { subscriptionId } });
    });
  } else {
    // Handle queries and mutations via HTTP
    const baseQuery = fetchBaseQuery({
      baseUrl: 'https://api.example.com/graphql',
      prepareHeaders: (headers) => {
        headers.set('content-type', 'application/json');
        const token = localStorage.getItem('authToken');
        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
      },
    });
    
    return baseQuery({
      url: '',
      method: 'POST',
      body: JSON.stringify({
        query: args.query,
        variables: args.variables,
      }),
    }, api, {});
  }
};

// TODO 2: Real-time State Management
// Create a slice to manage real-time updates and connection status

interface RealTimeState {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  activeSubscriptions: Record<string, {
    query: string;
    variables?: Record<string, any>;
    lastUpdate: string;
  }>;
  liveUpdates: {
    posts: Record<string, any>;
    comments: Record<string, any>;
    likes: Record<string, number>;
    onlineUsers: string[];
  };
}

const initialState: RealTimeState = {
  connectionStatus: 'disconnected',
  activeSubscriptions: {},
  liveUpdates: {
    posts: {},
    comments: {},
    likes: {},
    onlineUsers: [],
  },
};

export const realTimeSlice = createSlice({
  name: 'realTime',
  initialState,
  reducers: {
    setConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload;
    },
    addSubscription: (state, action) => {
      const { id, query, variables } = action.payload;
      state.activeSubscriptions[id] = {
        query,
        variables,
        lastUpdate: new Date().toISOString(),
      };
    },
    removeSubscription: (state, action) => {
      delete state.activeSubscriptions[action.payload];
    },
    updatePostLive: (state, action) => {
      const { postId, data } = action.payload;
      state.liveUpdates.posts[postId] = {
        ...state.liveUpdates.posts[postId],
        ...data,
        lastUpdate: new Date().toISOString(),
      };
    },
    updateLikesLive: (state, action) => {
      const { postId, count } = action.payload;
      state.liveUpdates.likes[postId] = count;
    },
    setOnlineUsers: (state, action) => {
      state.liveUpdates.onlineUsers = action.payload;
    },
  },
});

export const {
  setConnectionStatus,
  addSubscription,
  removeSubscription,
  updatePostLive,
  updateLikesLive,
  setOnlineUsers,
} = realTimeSlice.actions;

// TODO 3: Advanced API with Subscription Support

export const advancedApi = createApi({
  reducerPath: 'advancedApi',
  baseQuery: hybridBaseQuery,
  tagTypes: ['Post', 'Comment', 'Like', 'User', 'OnlineStatus'],
  endpoints: (builder) => ({
    
    // TODO 4: Standard HTTP Queries and Mutations
    
    getPosts: builder.query<{ posts: any[] }, { limit?: number }>({
      query: ({ limit = 20 }) => ({
        type: 'query' as const,
        query: `
          query GetPosts($limit: Int) {
            posts(limit: $limit) {
              id title content author { id fullName }
              likesCount commentsCount createdAt
            }
          }
        `,
        variables: { limit },
      }),
      providesTags: ['Post'],
    }),
    
    likePost: builder.mutation<any, { postId: string; action: 'like' | 'unlike' }>({
      query: ({ postId, action }) => ({
        type: 'mutation' as const,
        query: `
          mutation LikePost($postId: ID!, $action: String!) {
            likePost(postId: $postId, action: $action) {
              success
              post {
                id likesCount
              }
            }
          }
        `,
        variables: { postId, action },
      }),
      invalidatesTags: ['Post', 'Like'],
      // TODO: Optimistic update
      async onQueryStarted({ postId, action }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          advancedApi.util.updateQueryData('getPosts', {}, (draft) => {
            const post = draft.posts.find(p => p.id === postId);
            if (post) {
              post.likesCount += action === 'like' ? 1 : -1;
            }
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    
    // TODO 5: GraphQL Subscriptions
    
    // Subscribe to post likes in real-time
    subscribeToPostLikes: builder.query<any, { postId: string }>({
      query: ({ postId }) => ({
        type: 'subscription' as const,
        query: `
          subscription PostLikesUpdated($postId: ID!) {
            postLikesUpdated(postId: $postId) {
              postId
              likesCount
              lastLikedBy {
                id
                fullName
              }
            }
          }
        `,
        variables: { postId },
      }),
      // TODO: Handle subscription updates
      async onCacheEntryAdded(
        { postId },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        try {
          await cacheDataLoaded;
          
          // Set up real-time listener
          const subscriptionId = `post_likes_${postId}`;
          dispatch(addSubscription({ id: subscriptionId, query: 'PostLikesUpdated', variables: { postId } }));
          
          // TODO: In real implementation, this would listen to WebSocket messages
          // For demo, we'll simulate updates
          const interval = setInterval(() => {
            const simulatedUpdate = {
              postId,
              likesCount: Math.floor(Math.random() * 100),
              lastLikedBy: {
                id: 'user123',
                fullName: 'Simulated User',
              },
            };
            
            // Update cached data
            updateCachedData((draft) => {
              Object.assign(draft, simulatedUpdate);
            });
            
            // Update live state
            dispatch(updateLikesLive({ postId, count: simulatedUpdate.likesCount }));
            
            // Invalidate related queries
            dispatch(advancedApi.util.invalidateTags(['Post', 'Like']));
          }, 5000);
          
          await cacheEntryRemoved;
          clearInterval(interval);
          dispatch(removeSubscription(subscriptionId));
          
        } catch (error) {
          console.error('Subscription error:', error);
        }
      },
    }),
    
    // Subscribe to new comments
    subscribeToPostComments: builder.query<any, { postId: string }>({
      query: ({ postId }) => ({
        type: 'subscription' as const,
        query: `
          subscription PostCommentsAdded($postId: ID!) {
            postCommentsAdded(postId: $postId) {
              id
              content
              author {
                id
                fullName
              }
              createdAt
            }
          }
        `,
        variables: { postId },
      }),
      async onCacheEntryAdded(
        { postId },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        try {
          await cacheDataLoaded;
          
          // Simulate new comments
          const interval = setInterval(() => {
            const newComment = {
              id: `comment_${Date.now()}`,
              content: `New comment at ${new Date().toLocaleTimeString()}`,
              author: {
                id: 'user456',
                fullName: 'Comment Author',
              },
              createdAt: new Date().toISOString(),
            };
            
            updateCachedData((draft) => {
              if (!draft.comments) draft.comments = [];
              draft.comments.unshift(newComment);
            });
            
            // Update post comment count
            dispatch(
              advancedApi.util.updateQueryData('getPosts', {}, (draft) => {
                const post = draft.posts.find(p => p.id === postId);
                if (post) {
                  post.commentsCount += 1;
                }
              })
            );
            
          }, 8000);
          
          await cacheEntryRemoved;
          clearInterval(interval);
          
        } catch (error) {
          console.error('Comment subscription error:', error);
        }
      },
    }),
    
    // Subscribe to online users
    subscribeToOnlineUsers: builder.query<any, void>({
      query: () => ({
        type: 'subscription' as const,
        query: `
          subscription OnlineUsersUpdated {
            onlineUsersUpdated {
              users {
                id
                fullName
                avatar
                lastSeen
              }
              count
            }
          }
        `,
      }),
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        try {
          await cacheDataLoaded;
          
          // Simulate online user updates
          const users = [
            'Alice Johnson', 'Bob Smith', 'Carol Williams', 
            'David Brown', 'Emma Davis', 'Frank Miller'
          ];
          
          const interval = setInterval(() => {
            const onlineCount = Math.floor(Math.random() * users.length) + 1;
            const onlineUsers = users
              .sort(() => Math.random() - 0.5)
              .slice(0, onlineCount)
              .map((name, index) => ({
                id: `user_${index}`,
                fullName: name,
                avatar: '👤',
                lastSeen: new Date().toISOString(),
              }));
            
            updateCachedData((draft) => {
              draft.users = onlineUsers;
              draft.count = onlineCount;
            });
            
            dispatch(setOnlineUsers(onlineUsers.map(u => u.id)));
            
          }, 3000);
          
          await cacheEntryRemoved;
          clearInterval(interval);
          
        } catch (error) {
          console.error('Online users subscription error:', error);
        }
      },
    }),
    
    // TODO 6: Streaming Queries with Progressive Loading
    
    getPostsStream: builder.query<{ posts: any[]; hasMore: boolean }, { limit?: number; cursor?: string }>({
      query: ({ limit = 10, cursor }) => ({
        type: 'subscription' as const,
        query: `
          subscription PostsStream($limit: Int, $cursor: String) {
            postsStream(limit: $limit, cursor: $cursor) {
              posts {
                id title excerpt likesCount
                author { fullName }
              }
              hasMore
              cursor
            }
          }
        `,
        variables: { limit, cursor },
      }),
      // TODO: Handle streaming data
      async onCacheEntryAdded(
        args,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        try {
          await cacheDataLoaded;
          
          // Simulate streaming posts
          let postCount = 0;
          const interval = setInterval(() => {
            const newPost = {
              id: `stream_post_${Date.now()}_${postCount}`,
              title: `Streamed Post #${postCount + 1}`,
              excerpt: `This is post ${postCount + 1} from the stream`,
              likesCount: Math.floor(Math.random() * 50),
              author: { fullName: `Streamer ${postCount % 3 + 1}` },
            };
            
            updateCachedData((draft) => {
              if (!draft.posts) draft.posts = [];
              draft.posts.unshift(newPost);
              draft.hasMore = postCount < 20; // Simulate finite stream
            });
            
            postCount++;
            if (postCount >= 20) {
              clearInterval(interval);
            }
          }, 2000);
          
          await cacheEntryRemoved;
          clearInterval(interval);
          
        } catch (error) {
          console.error('Streaming error:', error);
        }
      },
    }),
  }),
});

// TODO 7: Hooks and Utilities

export const {
  useGetPostsQuery,
  useLikePostMutation,
  useSubscribeToPostLikesQuery,
  useSubscribeToPostCommentsQuery,
  useSubscribeToOnlineUsersQuery,
  useGetPostsStreamQuery,
} = advancedApi;

// TODO 8: Real-time Connection Hook
export const useRealTimeConnection = () => {
  const dispatch = useAppDispatch();
  const connectionStatus = useSelector((state: RootState) => state.realTime.connectionStatus);
  const activeSubscriptions = useSelector((state: RootState) => state.realTime.activeSubscriptions);
  
  useEffect(() => {
    // Initialize WebSocket connection
    dispatch(setConnectionStatus('connecting'));
    
    wsManager.connect('wss://api.example.com/graphql')
      .then(() => {
        dispatch(setConnectionStatus('connected'));
      })
      .catch(() => {
        dispatch(setConnectionStatus('error'));
      });
    
    return () => {
      wsManager.disconnect();
      dispatch(setConnectionStatus('disconnected'));
    };
  }, [dispatch]);
  
  return {
    connectionStatus,
    activeSubscriptions: Object.keys(activeSubscriptions).length,
    isConnected: connectionStatus === 'connected',
  };
};

// TODO 9: Store Configuration
export const store = configureStore({
  reducer: {
    [advancedApi.reducerPath]: advancedApi.reducer,
    realTime: realTimeSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(advancedApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
const useAppDispatch = () => useSelector(() => store.dispatch);

// TODO 10: Demo Components

const ConnectionStatus: React.FC = () => {
  const { connectionStatus, activeSubscriptions, isConnected } = useRealTimeConnection();
  
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#27ae60';
      case 'connecting': return '#f39c12';
      case 'error': return '#e74c3c';
      default: return '#95a5a6';
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: `2px solid ${getStatusColor()}`,
      zIndex: 1000,
    }}>
      <div style={{ fontWeight: 'bold', color: getStatusColor() }}>
        {connectionStatus === 'connected' && '🟢'}
        {connectionStatus === 'connecting' && '🟡'}
        {connectionStatus === 'error' && '🔴'}
        {connectionStatus === 'disconnected' && '⚪'}
        {connectionStatus.toUpperCase()}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        Active Subscriptions: {activeSubscriptions}
      </div>
    </div>
  );
};

const LivePostsDemo: React.FC = () => {
  const [selectedPostId, setSelectedPostId] = useState<string>('post1');
  const { data: posts } = useGetPostsQuery({});
  const { data: likesData } = useSubscribeToPostLikesQuery({ postId: selectedPostId });
  const { data: commentsData } = useSubscribeToPostCommentsQuery({ postId: selectedPostId });
  
  return (
    <div>
      <h3>📝 Live Posts Demo</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <label>
          Select Post for Live Updates: 
          <select 
            value={selectedPostId} 
            onChange={(e) => setSelectedPostId(e.target.value)}
            style={{ marginLeft: '8px', padding: '4px' }}
          >
            <option value="post1">Post 1</option>
            <option value="post2">Post 2</option>
            <option value="post3">Post 3</option>
          </select>
        </label>
      </div>
      
      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h4>❤️ Live Likes</h4>
          <div>Post: {selectedPostId}</div>
          <div>Current Likes: {likesData?.likesCount || 0}</div>
          {likesData?.lastLikedBy && (
            <div>Last Liked By: {likesData.lastLikedBy.fullName}</div>
          )}
        </div>
        
        <div style={{ padding: '16px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
          <h4>💬 Live Comments</h4>
          <div>Comments: {commentsData?.comments?.length || 0}</div>
          {commentsData?.comments?.[0] && (
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              Latest: {commentsData.comments[0].content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const OnlineUsersDemo: React.FC = () => {
  const { data: onlineData } = useSubscribeToOnlineUsersQuery();
  
  return (
    <div>
      <h3>👥 Online Users ({onlineData?.count || 0})</h3>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {onlineData?.users?.map((user: any) => (
          <div
            key={user.id}
            style={{
              padding: '4px 8px',
              backgroundColor: '#e8f5e8',
              borderRadius: '12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>🟢</span>
            {user.fullName}
          </div>
        ))}
      </div>
    </div>
  );
};

const StreamingDemo: React.FC = () => {
  const { data: streamData } = useGetPostsStreamQuery({});
  
  return (
    <div>
      <h3>🌊 Streaming Posts</h3>
      <div>Posts Received: {streamData?.posts?.length || 0}</div>
      <div>Has More: {streamData?.hasMore ? '✅' : '❌'}</div>
      
      <div style={{ 
        maxHeight: '200px', 
        overflowY: 'auto', 
        marginTop: '12px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '8px',
      }}>
        {streamData?.posts?.slice(0, 5).map((post: any) => (
          <div key={post.id} style={{ 
            padding: '4px 0', 
            borderBottom: '1px solid #eee',
            fontSize: '12px',
          }}>
            <strong>{post.title}</strong> by {post.author.fullName} (❤️ {post.likesCount})
          </div>
        ))}
      </div>
    </div>
  );
};

export const RTKQuerySubscriptionsExercise: React.FC = () => {
  return (
    <Provider store={store}>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', paddingTop: '80px' }}>
        <ConnectionStatus />
        
        <h2>RTK Query Advanced Patterns with GraphQL Subscriptions</h2>
        <p style={{ color: '#666', marginBottom: '32px' }}>
          Advanced real-time patterns with WebSocket subscriptions, streaming queries, 
          and sophisticated cache management.
        </p>
        
        <div style={{ display: 'grid', gap: '24px' }}>
          <LivePostsDemo />
          <OnlineUsersDemo />
          <StreamingDemo />
        </div>
        
        <div style={{ 
          marginTop: '32px', 
          padding: '16px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
        }}>
          <h4>🚀 Advanced RTK Query Features:</h4>
          <ul>
            <li>🔌 WebSocket integration with GraphQL subscriptions</li>
            <li>⚡ Real-time data updates with cache synchronization</li>
            <li>🌊 Streaming queries with progressive loading</li>
            <li>🔄 Connection management with automatic reconnection</li>
            <li>📊 Live state management for real-time features</li>
            <li>🎯 Optimistic updates with subscription validation</li>
          </ul>
        </div>
      </div>
    </Provider>
  );
};

export default RTKQuerySubscriptionsExercise;