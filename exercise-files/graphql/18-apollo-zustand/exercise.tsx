// Apollo Client + Zustand Integration Exercise
// Integrate Apollo Client with Zustand for hybrid server and client state management

import React, { useState, useEffect } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useQuery, useMutation } from '@apollo/client';
import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// TODO 1: Define State Boundaries
// Clear separation between server state (Apollo) and client state (Zustand)

// Server State (Apollo): GraphQL data from API
interface ServerUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
}

interface ServerPost {
  id: string;
  title: string;
  content: string;
  author: ServerUser;
  likesCount: number;
  isLiked: boolean;
}

// Client State (Zustand): UI state, user preferences, local interactions
interface UIState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  currentView: 'feed' | 'profile' | 'settings';
  notifications: Notification[];
  drafts: PostDraft[];
}

interface UserPreferences {
  language: 'en' | 'es' | 'fr';
  emailNotifications: boolean;
  autoSave: boolean;
  postsPerPage: number;
}

interface AppState {
  currentUserId: string | null;
  isOnline: boolean;
  lastSync: string | null;
  connectionQuality: 'good' | 'poor' | 'offline';
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  message: string;
  read: boolean;
  createdAt: string;
  relatedUserId?: string;
  relatedPostId?: string;
}

interface PostDraft {
  id: string;
  title: string;
  content: string;
  tags: string[];
  lastSaved: string;
  autoSaved: boolean;
}

// TODO 2: Create Zustand Stores with Clear Boundaries

// UI State Store
interface UIStore extends UIState {
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setCurrentView: (view: 'feed' | 'profile' | 'settings') => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  saveDraft: (draft: Omit<PostDraft, 'id' | 'lastSaved'>) => void;
  updateDraft: (id: string, updates: Partial<PostDraft>) => void;
  deleteDraft: (id: string) => void;
}

// TODO: Implement UI store with Zustand
export const useUIStore = create<UIStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        theme: 'light',
        sidebarCollapsed: false,
        currentView: 'feed',
        notifications: [],
        drafts: [],

        // Actions
        setTheme: (theme) =>
          set((state) => {
            state.theme = theme;
          }),

        toggleSidebar: () =>
          set((state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
          }),

        setCurrentView: (view) =>
          set((state) => {
            state.currentView = view;
          }),

        addNotification: (notification) =>
          set((state) => {
            const newNotification = {
              ...notification,
              id: `notif_${Date.now()}_${Math.random()}`,
            };
            state.notifications.unshift(newNotification);
            // TODO: Keep only last 50 notifications
            if (state.notifications.length > 50) {
              state.notifications = state.notifications.slice(0, 50);
            }
          }),

        markNotificationRead: (id) =>
          set((state) => {
            const notification = state.notifications.find(n => n.id === id);
            if (notification) {
              notification.read = true;
            }
          }),

        clearNotifications: () =>
          set((state) => {
            state.notifications = [];
          }),

        saveDraft: (draft) =>
          set((state) => {
            const newDraft: PostDraft = {
              ...draft,
              id: `draft_${Date.now()}`,
              lastSaved: new Date().toISOString(),
              autoSaved: false,
            };
            state.drafts.push(newDraft);
          }),

        updateDraft: (id, updates) =>
          set((state) => {
            const draft = state.drafts.find(d => d.id === id);
            if (draft) {
              Object.assign(draft, updates);
              draft.lastSaved = new Date().toISOString();
            }
          }),

        deleteDraft: (id) =>
          set((state) => {
            state.drafts = state.drafts.filter(d => d.id !== id);
          }),
      }))
    ),
    { name: 'ui-store' }
  )
);

// User Preferences Store
interface PreferencesStore extends UserPreferences {
  setLanguage: (language: 'en' | 'es' | 'fr') => void;
  toggleEmailNotifications: () => void;
  toggleAutoSave: () => void;
  setPostsPerPage: (count: number) => void;
  resetPreferences: () => void;
}

// TODO: Implement preferences store with persistence
export const usePreferencesStore = create<PreferencesStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state from localStorage
      language: (localStorage.getItem('language') as 'en' | 'es' | 'fr') || 'en',
      emailNotifications: localStorage.getItem('emailNotifications') === 'true',
      autoSave: localStorage.getItem('autoSave') !== 'false', // Default true
      postsPerPage: parseInt(localStorage.getItem('postsPerPage') || '10'),

      setLanguage: (language) => {
        set({ language });
        localStorage.setItem('language', language);
      },

      toggleEmailNotifications: () => {
        const newValue = !get().emailNotifications;
        set({ emailNotifications: newValue });
        localStorage.setItem('emailNotifications', String(newValue));
      },

      toggleAutoSave: () => {
        const newValue = !get().autoSave;
        set({ autoSave: newValue });
        localStorage.setItem('autoSave', String(newValue));
      },

      setPostsPerPage: (count) => {
        set({ postsPerPage: count });
        localStorage.setItem('postsPerPage', String(count));
      },

      resetPreferences: () => {
        const defaults = {
          language: 'en' as const,
          emailNotifications: false,
          autoSave: true,
          postsPerPage: 10,
        };
        set(defaults);
        Object.entries(defaults).forEach(([key, value]) => {
          localStorage.setItem(key, String(value));
        });
      },
    })),
    { name: 'preferences-store' }
  )
);

// App State Store
interface AppStateStore extends AppState {
  setCurrentUserId: (userId: string | null) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  updateConnectionQuality: (quality: 'good' | 'poor' | 'offline') => void;
  updateLastSync: () => void;
}

// TODO: Implement app state store
export const useAppStateStore = create<AppStateStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      currentUserId: localStorage.getItem('currentUserId'),
      isOnline: navigator.onLine,
      lastSync: localStorage.getItem('lastSync'),
      connectionQuality: 'good',

      setCurrentUserId: (userId) => {
        set({ currentUserId: userId });
        if (userId) {
          localStorage.setItem('currentUserId', userId);
        } else {
          localStorage.removeItem('currentUserId');
        }
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline });
        if (!isOnline) {
          set({ connectionQuality: 'offline' });
        }
      },

      updateConnectionQuality: (quality) => {
        set({ connectionQuality: quality });
      },

      updateLastSync: () => {
        const now = new Date().toISOString();
        set({ lastSync: now });
        localStorage.setItem('lastSync', now);
      },
    })),
    { name: 'app-state-store' }
  )
);

// TODO 3: Apollo Client Configuration
// Configure Apollo Client to work alongside Zustand

const GRAPHQL_ENDPOINT = 'https://api.example.com/graphql';

export const apolloClient = new ApolloClient({
  uri: GRAPHQL_ENDPOINT,
  cache: new InMemoryCache({
    typePolicies: {
      User: {
        fields: {
          // TODO: Merge server data with client preferences
          preferences: {
            read(existing, { readField }) {
              // Get user preferences from Zustand store
              const userId = readField('id');
              return usePreferencesStore.getState();
            },
          },
        },
      },
      Post: {
        fields: {
          // TODO: Add client-side computed fields
          isDraft: {
            read(existing, { readField }) {
              const postId = readField('id');
              const drafts = useUIStore.getState().drafts;
              return drafts.some(d => d.id === postId);
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
  },
  // TODO: Add custom link to sync with app state
  link: undefined, // Would add custom link here
});

// TODO 4: State Synchronization Patterns
// Create hooks that coordinate between Apollo and Zustand

// Hook to sync authentication state
export const useAuthSync = () => {
  const setCurrentUserId = useAppStateStore(state => state.setCurrentUserId);
  const currentUserId = useAppStateStore(state => state.currentUserId);

  // TODO: Sync with Apollo Client auth state
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && !currentUserId) {
      // Decode token to get user ID (simplified)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      } catch (error) {
        console.error('Failed to decode auth token:', error);
      }
    }
  }, [currentUserId, setCurrentUserId]);

  const login = (token: string, userId: string) => {
    localStorage.setItem('authToken', token);
    setCurrentUserId(userId);
    // TODO: Reset Apollo cache on login
    apolloClient.resetStore();
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setCurrentUserId(null);
    // TODO: Clear Apollo cache on logout
    apolloClient.clearStore();
    // TODO: Clear sensitive Zustand state
    useUIStore.getState().clearNotifications();
  };

  return { login, logout, isAuthenticated: !!currentUserId };
};

// Hook to sync online/offline state
export const useOnlineSync = () => {
  const setOnlineStatus = useAppStateStore(state => state.setOnlineStatus);
  const updateConnectionQuality = useAppStateStore(state => state.updateConnectionQuality);

  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true);
      updateConnectionQuality('good');
    };

    const handleOffline = () => {
      setOnlineStatus(false);
      updateConnectionQuality('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // TODO: Monitor connection quality
    const checkConnectionQuality = () => {
      if (navigator.onLine) {
        // Simple connection quality check
        const start = Date.now();
        fetch(GRAPHQL_ENDPOINT, { method: 'HEAD', mode: 'no-cors' })
          .then(() => {
            const duration = Date.now() - start;
            updateConnectionQuality(duration < 1000 ? 'good' : 'poor');
          })
          .catch(() => {
            updateConnectionQuality('poor');
          });
      }
    };

    const qualityInterval = setInterval(checkConnectionQuality, 30000); // Check every 30s

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(qualityInterval);
    };
  }, [setOnlineStatus, updateConnectionQuality]);
};

// TODO 5: GraphQL Operations
const GET_POSTS = gql`
  query GetPosts($limit: Int, $offset: Int) {
    posts(limit: $limit, offset: $offset) {
      id
      title
      content
      author {
        id
        username
        fullName
        avatar
      }
      likesCount
      isLiked
    }
  }
`;

const LIKE_POST = gql`
  mutation LikePost($postId: ID!, $liked: Boolean!) {
    likePost(postId: $postId, liked: $liked) {
      id
      likesCount
      isLiked
    }
  }
`;

// TODO 6: Hybrid Components
// Components that use both Apollo and Zustand

export const PostsList: React.FC = () => {
  const postsPerPage = usePreferencesStore(state => state.postsPerPage);
  const addNotification = useUIStore(state => state.addNotification);
  const [offset, setOffset] = useState(0);

  const { data, loading, error } = useQuery(GET_POSTS, {
    variables: { limit: postsPerPage, offset },
    errorPolicy: 'all',
  });

  const [likePost] = useLikePost({
    onCompleted: () => {
      addNotification({
        type: 'like',
        message: 'Post liked successfully!',
        read: false,
        createdAt: new Date().toISOString(),
      });
    },
  });

  const handleLike = (postId: string, currentlyLiked: boolean) => {
    likePost({
      variables: { postId, liked: !currentlyLiked },
      optimisticResponse: {
        likePost: {
          __typename: 'Post',
          id: postId,
          likesCount: currentlyLiked ? -1 : 1, // Simplified
          isLiked: !currentlyLiked,
        },
      },
    });
  };

  if (loading) return <div>Loading posts...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Posts ({postsPerPage} per page)</h3>
      <div style={{ display: 'grid', gap: '16px' }}>
        {data?.posts.map((post: ServerPost) => (
          <div key={post.id} style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
            <h4>{post.title}</h4>
            <p>By {post.author.fullName}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => handleLike(post.id, post.isLiked)}
                style={{
                  backgroundColor: post.isLiked ? '#e74c3c' : '#ecf0f1',
                  color: post.isLiked ? 'white' : '#2c3e50',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ❤️ {post.likesCount}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setOffset(Math.max(0, offset - postsPerPage))}
          disabled={offset === 0}
        >
          Previous
        </button>
        <button
          onClick={() => setOffset(offset + postsPerPage)}
          disabled={!data?.posts || data.posts.length < postsPerPage}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const { theme, sidebarCollapsed, toggleSidebar, setCurrentView } = useUIStore();
  const notifications = useUIStore(state => state.notifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  if (sidebarCollapsed) {
    return (
      <div style={{ width: '60px', backgroundColor: theme === 'dark' ? '#2c3e50' : '#ecf0f1' }}>
        <button onClick={toggleSidebar} style={{ width: '100%', padding: '10px' }}>
          →
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: '250px',
      backgroundColor: theme === 'dark' ? '#2c3e50' : '#ecf0f1',
      padding: '20px',
      color: theme === 'dark' ? 'white' : 'black',
    }}>
      <button onClick={toggleSidebar} style={{ float: 'right' }}>←</button>
      
      <nav style={{ marginTop: '40px' }}>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>
            <button onClick={() => setCurrentView('feed')}>
              📰 Feed
            </button>
          </li>
          <li>
            <button onClick={() => setCurrentView('profile')}>
              👤 Profile
            </button>
          </li>
          <li>
            <button onClick={() => setCurrentView('settings')}>
              ⚙️ Settings {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export const StatusBar: React.FC = () => {
  const { isOnline, connectionQuality, lastSync } = useAppStateStore();
  const theme = useUIStore(state => state.theme);

  const getStatusColor = () => {
    if (!isOnline) return '#e74c3c';
    if (connectionQuality === 'poor') return '#f39c12';
    return '#27ae60';
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '30px',
      backgroundColor: theme === 'dark' ? '#34495e' : '#bdc3c7',
      color: theme === 'dark' ? 'white' : 'black',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      fontSize: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
          }}
        />
        <span>
          {isOnline ? `Online (${connectionQuality})` : 'Offline'}
        </span>
      </div>
      
      {lastSync && (
        <div>Last sync: {new Date(lastSync).toLocaleTimeString()}</div>
      )}
    </div>
  );
};

// TODO 7: Main Application Component
export const ApolloZustandExercise: React.FC = () => {
  const { theme, currentView, setTheme } = useUIStore();
  const { login, logout, isAuthenticated } = useAuthSync();
  
  useOnlineSync(); // Initialize online/offline sync

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Login Required</h2>
        <button
          onClick={() => login('mock.jwt.token', 'user123')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Login (Demo)
        </button>
      </div>
    );
  }

  return (
    <ApolloProvider client={apolloClient}>
      <div style={{
        minHeight: '100vh',
        backgroundColor: theme === 'dark' ? '#2c3e50' : '#ffffff',
        color: theme === 'dark' ? 'white' : 'black',
        display: 'flex',
      }}>
        <Sidebar />
        
        <main style={{ flex: 1, padding: '20px', paddingBottom: '50px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h1>Apollo + Zustand Integration</h1>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                style={{ padding: '8px 12px', borderRadius: '4px' }}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button
                onClick={logout}
                style={{ padding: '8px 12px', borderRadius: '4px' }}
              >
                Logout
              </button>
            </div>
          </div>

          {currentView === 'feed' && <PostsList />}
          {currentView === 'profile' && <ProfileView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
        
        <StatusBar />
      </div>
    </ApolloProvider>
  );
};

// Placeholder components - TODO: Implement these
const ProfileView = () => <div>Profile view - TODO: Implement</div>;
const SettingsView = () => <div>Settings view - TODO: Implement</div>;

export default ApolloZustandExercise;