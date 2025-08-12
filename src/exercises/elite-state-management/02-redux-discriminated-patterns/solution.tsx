// Solution: Redux with Discriminated Union Actions
// Complete Redux implementation with discriminated unions

import React from 'react';
import { configureStore, createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Provider, useSelector, useDispatch, TypedUseSelectorHook } from 'react-redux';

// User entity types
interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
}

// State types with discriminated unions
type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading'; operation: string }
  | { status: 'succeeded'; lastOperation: string; timestamp: number }
  | { status: 'failed'; operation: string; error: string };

interface UserState {
  entities: Record<string, User>;
  ids: string[];
  loading: LoadingState;
  optimistic: {
    pending: OptimisticOperation[];
    failed: FailedOperation[];
  };
}

type OptimisticOperation = {
  id: string;
  type: 'create' | 'update' | 'delete';
  tempId?: string;
  original?: User;
  data?: any;
};

type FailedOperation = OptimisticOperation & {
  error: string;
  failedAt: Date;
};

// Async thunks
export const fetchUsers = createAsyncThunk<
  { users: User[]; total: number },
  { page: number; limit: number },
  { rejectValue: string }
>('users/fetchUsers', async ({ page, limit }, { rejectWithValue }) => {
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const users: User[] = Array.from({ length: limit }, (_, i) => ({
      id: `user_${page}_${i}`,
      name: `User ${page}_${i}`,
      email: `user${page}_${i}@example.com`,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    return { users, total: 100 };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const createUser = createAsyncThunk<
  User,
  Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  { rejectValue: string }
>('users/createUser', async (userData, { rejectWithValue }) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      ...userData,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// User slice
const userSlice = createSlice({
  name: 'users',
  initialState: {
    entities: {},
    ids: [],
    loading: { status: 'idle' },
    optimistic: {
      pending: [],
      failed: [],
    },
  } as UserState,
  reducers: {
    optimisticAdd: (state, action: PayloadAction<{ tempId: string; user: Omit<User, 'id'> }>) => {
      const { tempId, user } = action.payload;
      const tempUser = { ...user, id: tempId };
      state.entities[tempId] = tempUser;
      state.ids.push(tempId);
      state.optimistic.pending.push({
        id: `op_${Date.now()}`,
        type: 'create',
        tempId,
        data: user,
      });
    },
    
    optimisticUpdate: (state, action: PayloadAction<{ id: string; updates: Partial<User> }>) => {
      const { id, updates } = action.payload;
      if (state.entities[id]) {
        const original = { ...state.entities[id] };
        Object.assign(state.entities[id], updates);
        state.optimistic.pending.push({
          id: `op_${Date.now()}`,
          type: 'update',
          original,
          data: updates,
        });
      }
    },
    
    rollbackOptimistic: (state, action: PayloadAction<{ operationId: string }>) => {
      const operation = state.optimistic.pending.find(op => op.id === action.payload.operationId);
      if (operation) {
        switch (operation.type) {
          case 'create':
            if (operation.tempId) {
              delete state.entities[operation.tempId];
              state.ids = state.ids.filter(id => id !== operation.tempId);
            }
            break;
          case 'update':
            if (operation.original) {
              state.entities[operation.original.id] = operation.original;
            }
            break;
        }
        state.optimistic.pending = state.optimistic.pending.filter(op => op.id !== action.payload.operationId);
      }
    },
    
    confirmOptimistic: (state, action: PayloadAction<{ tempId: string; realId: string; realData: User }>) => {
      const { tempId, realId, realData } = action.payload;
      delete state.entities[tempId];
      state.entities[realId] = realData;
      state.ids = state.ids.map(id => id === tempId ? realId : id);
      state.optimistic.pending = state.optimistic.pending.filter(op => op.tempId !== tempId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = { status: 'loading', operation: 'fetch' };
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = { 
          status: 'succeeded', 
          lastOperation: 'fetch', 
          timestamp: Date.now() 
        };
        const { users } = action.payload;
        users.forEach(user => {
          state.entities[user.id] = user;
        });
        state.ids = Object.keys(state.entities);
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = {
          status: 'failed',
          operation: 'fetch',
          error: action.payload || action.error.message || 'Unknown error',
        };
      })
      .addCase(createUser.fulfilled, (state, action) => {
        const user = action.payload;
        state.entities[user.id] = user;
        if (!state.ids.includes(user.id)) {
          state.ids.push(user.id);
        }
      });
  },
});

// Store configuration
export const store = configureStore({
  reducer: {
    users: userSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['users/optimisticAdd'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Selectors
const selectUserState = (state: RootState) => state.users;
const selectUserEntities = (state: RootState) => state.users.entities;
const selectUserIds = (state: RootState) => state.users.ids;

export const selectAllUsers = createSelector(
  [selectUserEntities, selectUserIds],
  (entities, ids) => ids.map(id => entities[id]).filter(Boolean)
);

export const selectUserById = createSelector(
  [selectUserEntities, (state: RootState, userId: string) => userId],
  (entities, userId) => entities[userId] || null
);

export const selectUserLoadingState = createSelector(
  [selectUserState],
  (userState) => ({
    isLoading: userState.loading.status === 'loading',
    isError: userState.loading.status === 'failed',
    error: userState.loading.status === 'failed' ? userState.loading.error : null,
    hasOptimisticOperations: userState.optimistic.pending.length > 0,
  })
);

// Domain-specific hooks
export const useUsers = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectAllUsers);
  const loadingState = useAppSelector(selectUserLoadingState);
  
  const fetchUsersData = React.useCallback((page: number = 1, limit: number = 20) => {
    dispatch(fetchUsers({ page, limit }));
  }, [dispatch]);
  
  const createUserOptimistic = React.useCallback((userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    const tempId = `temp_${Date.now()}`;
    dispatch(userSlice.actions.optimisticAdd({ tempId, user: userData }));
    
    dispatch(createUser(userData))
      .unwrap()
      .then((createdUser) => {
        dispatch(userSlice.actions.confirmOptimistic({ 
          tempId, 
          realId: createdUser.id, 
          realData: createdUser 
        }));
      })
      .catch(() => {
        dispatch(userSlice.actions.rollbackOptimistic({ operationId: tempId }));
      });
  }, [dispatch]);
  
  return {
    users,
    ...loadingState,
    actions: {
      fetchUsers: fetchUsersData,
      createUser: createUserOptimistic,
    },
  };
};

// Components
function UserList() {
  const { users, isLoading, isError, error, actions } = useUsers();
  
  React.useEffect(() => {
    actions.fetchUsers();
  }, []);
  
  if (isLoading && users.length === 0) {
    return <div>Loading users...</div>;
  }
  
  if (isError) {
    return (
      <div>
        <div>Error: {error}</div>
        <button onClick={() => actions.fetchUsers()}>Retry</button>
      </div>
    );
  }
  
  return (
    <div>
      <h3>Users ({users.length})</h3>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} ({user.email}) - {user.status}
            {user.id.startsWith('temp_') && <span> (Saving...)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function UserForm() {
  const { actions } = useUsers();
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    status: 'active' as const,
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      actions.createUser(formData);
      setFormData({ name: '', email: '', status: 'active' });
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h3>Add User</h3>
      <div>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>
      <div>
        <select
          value={formData.status}
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'pending' }))}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <button type="submit">Add User</button>
    </form>
  );
}

function App() {
  return (
    <Provider store={store}>
      <div style={{ padding: '20px' }}>
        <h1>Redux with Discriminated Union Patterns</h1>
        <UserForm />
        <UserList />
      </div>
    </Provider>
  );
}

export default App;

// Export all necessary pieces for testing
export {
  UserList,
  UserForm,
  userSlice,
  type User,
  type UserState,
  type LoadingState,
  type OptimisticOperation,
};