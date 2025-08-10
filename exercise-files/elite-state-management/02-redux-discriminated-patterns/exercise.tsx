// Redux with Discriminated Union Patterns
// Master Redux architecture using discriminated unions for type-safe, scalable state management

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { configureStore, createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

// Learning objectives:
// - Build Redux store with discriminated union state patterns
// - Create type-safe actions and reducers using discriminated unions
// - Implement complex async flows with proper error handling
// - Design normalized state for optimal performance
// - Use discriminated unions for different entity loading states
// - Build reusable patterns for CRUD operations with optimistic updates

// Hints:
// 1. Use discriminated unions for both actions and state shapes
// 2. Normalize your data to avoid nested updates
// 3. Create typed hooks for type-safe dispatching and selecting
// 4. Use createAsyncThunk for handling async operations
// 5. Implement optimistic updates with rollback on errors
// 6. Consider using RTK Query for advanced data fetching

// TODO: Define discriminated union types for different entity states
type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading'; message?: string }
  | { status: 'success'; timestamp: Date }
  | { status: 'error'; error: string; code?: number };

// TODO: Define User entity with discriminated union state
type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
  updatedAt: Date;
};

type UserState = LoadingState & {
  data?: User;
  optimisticUpdate?: Partial<User>;
};

// TODO: Define Post entity with discriminated union state
type Post = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
};

type PostState = LoadingState & {
  data?: Post;
  isEditing?: boolean;
  optimisticUpdate?: Partial<Post>;
};

// TODO: Define normalized root state
type RootState = {
  users: {
    entities: Record<string, UserState>;
    currentUserId: string | null;
    searchQuery: string;
    filters: {
      role?: User['role'];
      sortBy: 'name' | 'createdAt' | 'updatedAt';
      sortOrder: 'asc' | 'desc';
    };
  };
  posts: {
    entities: Record<string, PostState>;
    byAuthor: Record<string, string[]>;
    featured: string[];
    searchQuery: string;
    filters: {
      status?: Post['status'];
      tags: string[];
      sortBy: 'title' | 'createdAt' | 'likesCount';
      sortOrder: 'asc' | 'desc';
    };
  };
  ui: {
    modal: {
      type: 'none';
    } | {
      type: 'user-edit';
      userId: string;
    } | {
      type: 'post-create' | 'post-edit';
      postId?: string;
    } | {
      type: 'confirmation';
      message: string;
      action: string;
    };
    notifications: Array<{
      id: string;
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
      timestamp: Date;
      autoClose?: boolean;
    }>;
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
  };
};

// TODO: Define discriminated union actions for users
type UserAction =
  | { type: 'users/fetchStart'; userId: string; message?: string }
  | { type: 'users/fetchSuccess'; userId: string; user: User }
  | { type: 'users/fetchError'; userId: string; error: string }
  | { type: 'users/updateStart'; userId: string; updates: Partial<User> }
  | { type: 'users/updateSuccess'; userId: string; user: User }
  | { type: 'users/updateError'; userId: string; error: string }
  | { type: 'users/deleteStart'; userId: string }
  | { type: 'users/deleteSuccess'; userId: string }
  | { type: 'users/deleteError'; userId: string; error: string }
  | { type: 'users/setCurrentUser'; userId: string | null }
  | { type: 'users/setSearchQuery'; query: string }
  | { type: 'users/setFilters'; filters: Partial<RootState['users']['filters']> };

// TODO: Define discriminated union actions for posts
type PostAction =
  | { type: 'posts/fetchStart'; postId: string; message?: string }
  | { type: 'posts/fetchSuccess'; postId: string; post: Post }
  | { type: 'posts/fetchError'; postId: string; error: string }
  | { type: 'posts/createStart'; post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'posts/createSuccess'; post: Post }
  | { type: 'posts/createError'; error: string }
  | { type: 'posts/updateStart'; postId: string; updates: Partial<Post> }
  | { type: 'posts/updateSuccess'; postId: string; post: Post }
  | { type: 'posts/updateError'; postId: string; error: string }
  | { type: 'posts/deleteStart'; postId: string }
  | { type: 'posts/deleteSuccess'; postId: string }
  | { type: 'posts/deleteError'; postId: string; error: string }
  | { type: 'posts/toggleEdit'; postId: string }
  | { type: 'posts/setSearchQuery'; query: string }
  | { type: 'posts/setFilters'; filters: Partial<RootState['posts']['filters']> }
  | { type: 'posts/addToFeatured'; postId: string }
  | { type: 'posts/removeFromFeatured'; postId: string };

// TODO: Define UI actions
type UIAction =
  | { type: 'ui/openModal'; modal: RootState['ui']['modal'] }
  | { type: 'ui/closeModal' }
  | { type: 'ui/addNotification'; notification: Omit<RootState['ui']['notifications'][0], 'id' | 'timestamp'> }
  | { type: 'ui/removeNotification'; id: string }
  | { type: 'ui/clearNotifications' }
  | { type: 'ui/setTheme'; theme: RootState['ui']['theme'] }
  | { type: 'ui/toggleSidebar' }
  | { type: 'ui/setSidebar'; open: boolean };

// TODO: Advanced Pattern - Tagged Union with Handler Map (Most TypeScript-idiomatic)
// This pattern provides excellent type safety and eliminates the switch statement anti-pattern

type ActionHandler<S, A> = (state: S, action: A) => S;

type ActionHandlers<S, A extends { type: string }> = {
  [K in A['type']]: ActionHandler<S, Extract<A, { type: K }>>
};

function createTypedReducer<S, A extends { type: string }>(
  handlers: ActionHandlers<S, A>
) {
  return (state: S, action: A): S => {
    const handler = handlers[action.type] as ActionHandler<S, A> | undefined;
    return handler ? handler(state, action) : state;
  };
}

// Example: Counter with business logic using the handler map pattern
type CounterState = {
  count: number;
  error: string | null;
  min: number;
  max: number;
};

type CounterAction =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' }
  | { type: 'setLimits'; min: number; max: number };

// TODO: Implement counter reducer using the handler map pattern
const counterReducer = createTypedReducer<CounterState, CounterAction>({
  increment: (state, action) => {
    const newCount = state.count + 1;
    const canIncrement = newCount <= state.max;
    return {
      ...state,
      count: canIncrement ? newCount : state.count,
      error: canIncrement ? null : `Maximum value ${state.max} reached!`,
    };
  },
  
  decrement: (state, action) => {
    const newCount = state.count - 1;
    const canDecrement = newCount >= state.min;
    return {
      ...state,
      count: canDecrement ? newCount : state.count,
      error: canDecrement ? null : `Minimum value ${state.min} reached!`,
    };
  },
  
  reset: (state, action) => ({
    ...state,
    count: 0,
    error: null,
  }),
  
  setLimits: (state, action) => ({
    ...state,
    min: action.min,
    max: action.max,
    error: null,
  }),
});

// TODO: Example of using handler map pattern for complex entity management
type EntityAction<T> =
  | { type: 'create'; entity: T }
  | { type: 'update'; id: string; updates: Partial<T> }
  | { type: 'delete'; id: string }
  | { type: 'setLoading'; id: string; loading: boolean }
  | { type: 'setError'; id: string; error: string }
  | { type: 'clearError'; id: string };

type EntityState<T> = {
  entities: Record<string, T & { loading?: boolean; error?: string }>;
  ids: string[];
};

function createEntityReducer<T extends { id: string }>() {
  return createTypedReducer<EntityState<T>, EntityAction<T>>({
    create: (state, action) => {
      const entity = action.entity;
      return {
        ...state,
        entities: {
          ...state.entities,
          [entity.id]: { ...entity, loading: false, error: undefined },
        },
        ids: state.ids.includes(entity.id) ? state.ids : [...state.ids, entity.id],
      };
    },
    
    update: (state, action) => {
      const existingEntity = state.entities[action.id];
      if (!existingEntity) return state;
      
      return {
        ...state,
        entities: {
          ...state.entities,
          [action.id]: {
            ...existingEntity,
            ...action.updates,
            loading: false,
            error: undefined,
          },
        },
      };
    },
    
    delete: (state, action) => {
      const { [action.id]: deleted, ...restEntities } = state.entities;
      return {
        ...state,
        entities: restEntities,
        ids: state.ids.filter(id => id !== action.id),
      };
    },
    
    setLoading: (state, action) => {
      const entity = state.entities[action.id];
      if (!entity) return state;
      
      return {
        ...state,
        entities: {
          ...state.entities,
          [action.id]: { ...entity, loading: action.loading },
        },
      };
    },
    
    setError: (state, action) => {
      const entity = state.entities[action.id];
      if (!entity) return state;
      
      return {
        ...state,
        entities: {
          ...state.entities,
          [action.id]: { ...entity, error: action.error, loading: false },
        },
      };
    },
    
    clearError: (state, action) => {
      const entity = state.entities[action.id];
      if (!entity) return state;
      
      return {
        ...state,
        entities: {
          ...state.entities,
          [action.id]: { ...entity, error: undefined },
        },
      };
    },
  });
}

// TODO: Create async thunks for API operations
const fetchUser = createAsyncThunk(
  'users/fetchUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate random failure
      if (Math.random() < 0.2) {
        throw new Error('User not found');
      }
      
      const user: User = {
        id: userId,
        name: `User ${userId}`,
        email: `user${userId}@example.com`,
        role: Math.random() > 0.5 ? 'user' : 'admin',
        createdAt: new Date(Date.now() - Math.random() * 10000000),
        updatedAt: new Date(),
      };
      
      return user;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ userId, updates }: { userId: string; updates: Partial<User> }, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate random failure
      if (Math.random() < 0.1) {
        throw new Error('Update failed');
      }
      
      const updatedUser: User = {
        id: userId,
        name: updates.name || `User ${userId}`,
        email: updates.email || `user${userId}@example.com`,
        role: updates.role || 'user',
        createdAt: new Date(Date.now() - Math.random() * 10000000),
        updatedAt: new Date(),
      };
      
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// TODO: Implement users slice with discriminated union patterns
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    entities: {} as Record<string, UserState>,
    currentUserId: null as string | null,
    searchQuery: '',
    filters: {
      sortBy: 'name' as const,
      sortOrder: 'asc' as const,
    },
  },
  reducers: {
    // TODO: Implement regular reducers
    setCurrentUser: (state, action: PayloadAction<string | null>) => {
      // Your code here
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      // Your code here
    },
    setFilters: (state, action: PayloadAction<Partial<RootState['users']['filters']>>) => {
      // Your code here
    },
    // TODO: Implement optimistic update reducers
    startOptimisticUpdate: (state, action: PayloadAction<{ userId: string; updates: Partial<User> }>) => {
      // Your code here
    },
    revertOptimisticUpdate: (state, action: PayloadAction<string>) => {
      // Your code here
    },
  },
  extraReducers: (builder) => {
    // TODO: Handle fetchUser async thunk
    builder
      .addCase(fetchUser.pending, (state, action) => {
        // Your code here
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        // Your code here
      })
      .addCase(fetchUser.rejected, (state, action) => {
        // Your code here
      });
    
    // TODO: Handle updateUser async thunk
    builder
      .addCase(updateUser.pending, (state, action) => {
        // Your code here
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        // Your code here
      })
      .addCase(updateUser.rejected, (state, action) => {
        // Your code here
      });
  },
});

// TODO: Implement posts slice (similar pattern to users)
const postsSlice = createSlice({
  name: 'posts',
  initialState: {
    entities: {} as Record<string, PostState>,
    byAuthor: {} as Record<string, string[]>,
    featured: [] as string[],
    searchQuery: '',
    filters: {
      tags: [] as string[],
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    },
  },
  reducers: {
    // TODO: Implement post reducers
    setSearchQuery: (state, action: PayloadAction<string>) => {
      // Your code here
    },
    setFilters: (state, action: PayloadAction<Partial<RootState['posts']['filters']>>) => {
      // Your code here
    },
    toggleEdit: (state, action: PayloadAction<string>) => {
      // Your code here
    },
    addToFeatured: (state, action: PayloadAction<string>) => {
      // Your code here
    },
    removeFromFeatured: (state, action: PayloadAction<string>) => {
      // Your code here
    },
  },
  extraReducers: (builder) => {
    // TODO: Handle async thunks for posts
  },
});

// TODO: Implement UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    modal: { type: 'none' as const },
    notifications: [] as RootState['ui']['notifications'],
    theme: 'light' as const,
    sidebarOpen: true,
  },
  reducers: {
    // TODO: Implement UI reducers
    openModal: (state, action: PayloadAction<RootState['ui']['modal']>) => {
      // Your code here
    },
    closeModal: (state) => {
      // Your code here
    },
    addNotification: (state, action: PayloadAction<Omit<RootState['ui']['notifications'][0], 'id' | 'timestamp'>>) => {
      // Your code here
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      // Your code here
    },
    clearNotifications: (state) => {
      // Your code here
    },
    setTheme: (state, action: PayloadAction<RootState['ui']['theme']>) => {
      // Your code here
    },
    toggleSidebar: (state) => {
      // Your code here
    },
    setSidebar: (state, action: PayloadAction<boolean>) => {
      // Your code here
    },
  },
});

// TODO: Configure store
const store = configureStore({
  reducer: {
    users: usersSlice.reducer,
    posts: postsSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['ui/addNotification'],
        ignoredPaths: ['ui.notifications.timestamp'],
      },
    }),
});

type AppDispatch = typeof store.dispatch;

// TODO: Create typed hooks
const useAppDispatch = () => useDispatch<AppDispatch>,();
const useAppSelector = <T,>(selector: (state: RootState) => T) => useSelector(selector);

// TODO: Create selector functions
const selectUser = (state: RootState, userId: string) => {
  // Your code here - return user state by id
  return state.users.entities[userId];
};

const selectUsersByRole = (state: RootState, role: User['role']) => {
  // Your code here - return users filtered by role
  return Object.values(state.users.entities)
    .filter(userState => userState.data?.role === role)
    .map(userState => userState.data)
    .filter(Boolean);
};

const selectPostsByAuthor = (state: RootState, authorId: string) => {
  // Your code here - return posts by author
  const postIds = state.posts.byAuthor[authorId] || [];
  return postIds
    .map(id => state.posts.entities[id]?.data)
    .filter(Boolean);
};

// TODO: Create action creators (already provided by slices, but you can create custom ones)
const { 
  setCurrentUser, 
  setSearchQuery: setUserSearchQuery,
  setFilters: setUserFilters,
  startOptimisticUpdate,
  revertOptimisticUpdate 
} = usersSlice.actions;

const {
  setSearchQuery: setPostSearchQuery,
  setFilters: setPostFilters,
  toggleEdit,
  addToFeatured,
  removeFromFeatured
} = postsSlice.actions;

const {
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  clearNotifications,
  setTheme,
  toggleSidebar,
  setSidebar
} = uiSlice.actions;

// TODO: Implement component examples using the Redux patterns

// User Management Component
function UserList() {
  const dispatch = useAppDispatch();
  const users = useAppSelector(state => Object.values(state.users.entities));
  const currentUserId = useAppSelector(state => state.users.currentUserId);
  const searchQuery = useAppSelector(state => state.users.searchQuery);

  const handleFetchUser = (userId: string) => {
    dispatch(fetchUser(userId));
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    // TODO: Implement optimistic update
    dispatch(startOptimisticUpdate({ userId, updates }));
    dispatch(updateUser({ userId, updates }))
      .unwrap()
      .catch(() => {
        dispatch(revertOptimisticUpdate(userId));
        dispatch(addNotification({
          type: 'error',
          message: 'Failed to update user',
          autoClose: true,
        }));
      });
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => dispatch(setUserSearchQuery(e.target.value))}
      />
      {users.map((userState) => {
        if (!userState.data) return null;
        
        const user = userState.data;
        const isLoading = userState.status === 'loading';
        const hasError = userState.status === 'error';
        
        return (
          <div key={user.id}>
            <h3>{user.name} {isLoading && '(Loading...)'}</h3>
            <p>{user.email}</p>
            <p>Role: {user.role}</p>
            {hasError && userState.status === 'error' && (
              <p style={{ color: 'red' }}>Error: {userState.error}</p>
            )}
            <button onClick={() => handleFetchUser(user.id)} disabled={isLoading}>
              Refresh
            </button>
            <button 
              onClick={() => handleUpdateUser(user.id, { name: user.name + ' (Updated)' })}
              disabled={isLoading}
            >
              Update Name
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Post Management Component
function PostList() {
  const dispatch = useAppDispatch();
  const posts = useAppSelector(state => Object.values(state.posts.entities));
  const featuredPosts = useAppSelector(state => state.posts.featured);
  
  return (
    <div>
      {posts.map((postState) => {
        if (!postState.data) return null;
        
        const post = postState.data;
        const isFeatured = featuredPosts.includes(post.id);
        const isEditing = postState.isEditing;
        
        return (
          <div key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            <p>Status: {post.status}</p>
            <p>Likes: {post.likesCount}</p>
            {isFeatured && <span>⭐ Featured</span>}
            <button onClick={() => dispatch(toggleEdit(post.id))}>
              {isEditing ? 'Stop Editing' : 'Edit'}
            </button>
            <button onClick={() => 
              isFeatured 
                ? dispatch(removeFromFeatured(post.id))
                : dispatch(addToFeatured(post.id))
            }>
              {isFeatured ? 'Remove from Featured' : 'Add to Featured'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Main App Component
function App() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.ui.theme);
  const sidebarOpen = useAppSelector(state => state.ui.sidebarOpen);
  const notifications = useAppSelector(state => state.ui.notifications);

  return (
    <div style={{ 
      backgroundColor: theme === 'dark' ? '#333' : '#fff',
      color: theme === 'dark' ? '#fff' : '#333',
      minHeight: '100vh'
    }}>
      <header>
        <button onClick={() => dispatch(toggleSidebar())}>
          Toggle Sidebar
        </button>
        <button onClick={() => dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'))}>
          Toggle Theme
        </button>
      </header>
      
      {sidebarOpen && (
        <aside style={{ 
          position: 'fixed', 
          left: 0, 
          top: 0, 
          width: '200px', 
          height: '100vh', 
          backgroundColor: theme === 'dark' ? '#222' : '#f5f5f5',
          padding: '1rem' 
        }}>
          <h3>Navigation</h3>
          <ul>
            <li>Users</li>
            <li>Posts</li>
            <li>Settings</li>
          </ul>
        </aside>
      )}

      <main style={{ marginLeft: sidebarOpen ? '200px' : '0' }}>
        <h1>Redux with Discriminated Union Patterns</h1>
        
        <section>
          <h2>Users</h2>
          <UserList />
        </section>
        
        <section>
          <h2>Posts</h2>
          <PostList />
        </section>
      </main>

      {/* Notifications */}
      <div style={{ 
        position: 'fixed', 
        top: '1rem', 
        right: '1rem',
        zIndex: 1000 
      }}>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              padding: '0.5rem 1rem',
              margin: '0.5rem 0',
              borderRadius: '4px',
              backgroundColor: notification.type === 'error' ? '#f44' : '#4f4',
              color: 'white',
            }}
          >
            {notification.message}
            <button 
              onClick={() => dispatch(removeNotification(notification.id))}
              style={{ marginLeft: '1rem', background: 'transparent', border: 'none', color: 'white' }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export components and utilities for testing
export {
  App,
  UserList,
  PostList,
  store,
  useAppDispatch,
  useAppSelector,
  selectUser,
  selectUsersByRole,
  selectPostsByAuthor,
  fetchUser,
  updateUser,
  setCurrentUser,
  setUserSearchQuery,
  setUserFilters,
  openModal,
  closeModal,
  addNotification,
  type RootState,
  type User,
  type Post,
  type UserState,
  type PostState,
  type LoadingState,
};