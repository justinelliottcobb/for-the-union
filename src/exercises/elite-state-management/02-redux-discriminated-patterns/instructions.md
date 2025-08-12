# Redux with Discriminated Union Actions

Build scalable Redux applications using discriminated unions for actions and state management with complete type safety and predictable patterns.

## Learning Objectives

- Implement Redux with discriminated union action types
- Design normalized state with discriminated unions
- Create type-safe action creators and selectors
- Handle complex async flows with Redux Toolkit
- Implement optimistic updates with rollback patterns
- Build real-time synchronization with state machines

## Prerequisites

- Mastery of useReducer with discriminated unions
- Understanding of Redux principles and data flow
- Knowledge of Redux Toolkit basics
- TypeScript advanced types and generics

## Background

Redux becomes dramatically more powerful when combined with discriminated unions. This approach provides:

- **Type Safety**: All actions and state are strictly typed
- **Predictability**: State transitions are explicit and documented
- **Scalability**: Large applications remain maintainable
- **Developer Experience**: Excellent TypeScript inference and IDE support

### The Redux + Discriminated Union Pattern

```typescript
// Action Types with Discriminated Unions
type UserAction = 
  | { type: 'users/fetchStart'; payload: { page: number } }
  | { type: 'users/fetchSuccess'; payload: { users: User[]; total: number } }
  | { type: 'users/fetchFailure'; payload: { error: string } }
  | { type: 'users/create'; payload: { user: CreateUserRequest } }
  | { type: 'users/update'; payload: { id: string; updates: Partial<User> } }
  | { type: 'users/delete'; payload: { id: string } };

// State with Discriminated Unions
type UserState = {
  entities: Record<string, User>;
  ids: string[];
  loading: LoadingState;
  error: string | null;
  pagination: PaginationState;
};

type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading'; operation: 'fetch' | 'create' | 'update' | 'delete' }
  | { status: 'success'; lastOperation: string; timestamp: number }
  | { status: 'error'; operation: string; error: string };
```

## Instructions

You'll build a complete Redux application with:

1. **User Management**: CRUD operations with normalized state
2. **Real-time Sync**: WebSocket integration with state machines
3. **Optimistic Updates**: Immediate UI updates with rollback
4. **Complex Async Flows**: Multi-step operations with proper error handling
5. **Type-safe Integration**: Custom hooks and selectors
6. **Performance Optimization**: Memoization and selective updates

## Essential Patterns

### Redux Toolkit Slice with Discriminated Unions

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Async thunk with proper typing
export const fetchUsers = createAsyncThunk<
  { users: User[]; total: number },
  { page: number; limit: number },
  { rejectValue: string }
>('users/fetchUsers', async ({ page, limit }, { rejectWithValue }) => {
  try {
    const response = await api.getUsers({ page, limit });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// Slice with discriminated union state
const userSlice = createSlice({
  name: 'users',
  initialState: {
    entities: {} as Record<string, User>,
    ids: [] as string[],
    status: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
    error: null as string | null,
    optimistic: {
      pending: [] as OptimisticOperation[],
      failed: [] as FailedOperation[],
    },
  },
  reducers: {
    // Optimistic actions
    optimisticAdd: (state, action: PayloadAction<{ tempId: string; user: CreateUserRequest }>) => {
      const { tempId, user } = action.payload;
      state.entities[tempId] = { ...user, id: tempId, status: 'pending' };
      state.ids.push(tempId);
      state.optimistic.pending.push({ type: 'create', tempId, data: user });
    },
    
    optimisticUpdate: (state, action: PayloadAction<{ id: string; updates: Partial<User> }>) => {
      const { id, updates } = action.payload;
      if (state.entities[id]) {
        Object.assign(state.entities[id], updates);
        state.optimistic.pending.push({ type: 'update', id, original: { ...state.entities[id] } });
      }
    },
    
    rollbackOptimistic: (state, action: PayloadAction<{ operationId: string }>) => {
      const operation = state.optimistic.pending.find(op => op.id === action.payload.operationId);
      if (operation) {
        switch (operation.type) {
          case 'create':
            delete state.entities[operation.tempId];
            state.ids = state.ids.filter(id => id !== operation.tempId);
            break;
          case 'update':
            if (operation.original) {
              state.entities[operation.id] = operation.original;
            }
            break;
        }
        state.optimistic.pending = state.optimistic.pending.filter(op => op.id !== action.payload.operationId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { users } = action.payload;
        users.forEach(user => {
          state.entities[user.id] = user;
        });
        state.ids = Object.keys(state.entities);
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message || 'Unknown error';
      });
  },
});
```

### Type-safe Selectors

```typescript
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './store';

// Base selectors
const selectUserState = (state: RootState) => state.users;
const selectUserEntities = (state: RootState) => state.users.entities;
const selectUserIds = (state: RootState) => state.users.ids;

// Memoized selectors
export const selectAllUsers = createSelector(
  [selectUserEntities, selectUserIds],
  (entities, ids) => ids.map(id => entities[id]).filter(Boolean)
);

export const selectUserById = createSelector(
  [selectUserEntities, (state: RootState, userId: string) => userId],
  (entities, userId) => entities[userId] || null
);

export const selectUsersByStatus = createSelector(
  [selectAllUsers, (state: RootState, status: UserStatus) => status],
  (users, status) => users.filter(user => user.status === status)
);

export const selectUserLoadingState = createSelector(
  [selectUserState],
  (userState) => ({
    isLoading: userState.status === 'loading',
    isError: userState.status === 'failed',
    error: userState.error,
    hasOptimisticOperations: userState.optimistic.pending.length > 0,
  })
);
```

### Custom Typed Hooks

```typescript
import { useSelector, useDispatch, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Domain-specific hooks
export const useUsers = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectAllUsers);
  const loadingState = useAppSelector(selectUserLoadingState);
  
  const fetchUsers = useCallback((page: number = 1, limit: number = 20) => {
    dispatch(fetchUsersThunk({ page, limit }));
  }, [dispatch]);
  
  const createUser = useCallback((userData: CreateUserRequest) => {
    const tempId = `temp_${Date.now()}`;
    dispatch(userSlice.actions.optimisticAdd({ tempId, user: userData }));
    
    // Async creation with rollback on failure
    dispatch(createUserThunk(userData))
      .unwrap()
      .then((createdUser) => {
        dispatch(userSlice.actions.confirmOptimistic({ tempId, realId: createdUser.id }));
      })
      .catch(() => {
        dispatch(userSlice.actions.rollbackOptimistic({ operationId: tempId }));
      });
  }, [dispatch]);
  
  return {
    users,
    ...loadingState,
    actions: {
      fetchUsers,
      createUser,
    },
  };
};
```

## Advanced Patterns

### Real-time State Synchronization

```typescript
// WebSocket middleware for real-time updates
const websocketMiddleware: Middleware<{}, RootState> = (store) => (next) => {
  let socket: WebSocket | null = null;
  
  return (action) => {
    switch (action.type) {
      case 'websocket/connect':
        if (socket !== null) {
          socket.close();
        }
        
        socket = new WebSocket(action.payload.url);
        
        socket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          
          // Handle different message types
          switch (message.type) {
            case 'USER_UPDATED':
              store.dispatch(userSlice.actions.syncUpdate(message.payload));
              break;
            case 'USER_DELETED':
              store.dispatch(userSlice.actions.syncDelete(message.payload));
              break;
          }
        };
        break;
        
      case 'websocket/disconnect':
        if (socket !== null) {
          socket.close();
          socket = null;
        }
        break;
    }
    
    return next(action);
  };
};
```

### Normalized State Management

```typescript
// Entity adapter for normalized state
import { createEntityAdapter } from '@reduxjs/toolkit';

const usersAdapter = createEntityAdapter<User>({
  selectId: (user) => user.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

// Use adapter selectors
export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectIds: selectUserIds,
  selectEntities: selectUserEntities,
  selectTotal: selectUserTotal,
} = usersAdapter.getSelectors((state: RootState) => state.users);
```

## Hints

1. Use Redux Toolkit for better developer experience
2. Normalize your state shape for better performance
3. Create typed hooks for dispatching and selecting
4. Use discriminated unions for different entity states
5. Implement middleware for complex async patterns
6. Consider using RTK Query for data fetching

## Expected Behavior

When complete, you'll have mastered:

```typescript
// Type-safe dispatching
dispatch(fetchUsers({ page: 1, limit: 20 })); // ✅
dispatch(fetchUsers({ page: 'invalid' })); // ❌ TypeScript error

// Type-safe selecting
const users = useAppSelector(selectAllUsers); // User[]
const user = useAppSelector(state => selectUserById(state, 'id')); // User | null

// Optimistic updates
const createUser = (userData: CreateUserRequest) => {
  dispatch(optimisticAdd({ tempId: generateId(), user: userData }));
  // API call with rollback on failure
};

// Real-time synchronization
const { isConnected, connectionState } = useWebSocketSync();
```

**Estimated time:** 50 minutes  
**Difficulty:** 5/5