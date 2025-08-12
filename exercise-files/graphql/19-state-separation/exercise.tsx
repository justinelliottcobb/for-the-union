// Server State vs Client State Separation Exercise
// Design clear architectural boundaries between server and client state management

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector, persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// TODO 1: Define Clear State Boundaries
// Establish architectural patterns for state separation

// ============================================
// SERVER STATE DOMAIN (Remote Data)
// ============================================
// Data that comes from and belongs to the server
// - Should be fetched, cached, and synchronized
// - Truth source is the server
// - Examples: User profiles, posts, comments, etc.

interface ServerUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ServerPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: ServerUser;
  likesCount: number;
  commentsCount: number;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
}

interface ServerComment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author: ServerUser;
  createdAt: string;
}

// ============================================
// CLIENT STATE DOMAIN (Local Data)
// ============================================
// Data that exists only on the client
// - UI state, user preferences, temporary data
// - Truth source is the client
// - Examples: Theme, filters, form data, etc.

interface UIState {
  // Layout and navigation
  sidebarOpen: boolean;
  currentRoute: string;
  breadcrumbs: string[];
  
  // Modals and overlays
  activeModal: string | null;
  modalData: Record<string, any>;
  
  // Loading and feedback
  globalLoading: boolean;
  toasts: Toast[];
  
  // View preferences
  listView: 'grid' | 'list';
  sortBy: string;
  filterBy: Record<string, any>;
}

interface FormState {
  // Active form data
  activeForm: string | null;
  formData: Record<string, any>;
  formErrors: Record<string, string[]>;
  isDirty: boolean;
  isSubmitting: boolean;
}

interface UserPreferences {
  // Appearance
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: string;
  
  // Behavior
  autoSave: boolean;
  notifications: boolean;
  language: string;
  timezone: string;
  
  // Content preferences
  postsPerPage: number;
  defaultSort: string;
  hiddenTags: string[];
}

interface SessionState {
  // Authentication
  isAuthenticated: boolean;
  currentUserId: string | null;
  sessionToken: string | null;
  tokenExpiry: string | null;
  
  // Connection
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingActions: PendingAction[];
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  actions?: Array<{ label: string; action: () => void }>;
}

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'post' | 'comment' | 'like';
  data: any;
  timestamp: string;
  retryCount: number;
}

// TODO 2: Create Separated Store Architecture

// ============================================
// UI STATE STORE
// ============================================
interface UIStore extends UIState {
  // Navigation actions
  setSidebarOpen: (open: boolean) => void;
  navigateTo: (route: string) => void;
  addBreadcrumb: (crumb: string) => void;
  clearBreadcrumbs: () => void;
  
  // Modal actions
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  updateModalData: (data: Record<string, any>) => void;
  
  // Loading and feedback
  setGlobalLoading: (loading: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // View preferences
  setListView: (view: 'grid' | 'list') => void;
  setSortBy: (sortBy: string) => void;
  updateFilter: (key: string, value: any) => void;
  clearFilters: () => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        sidebarOpen: true,
        currentRoute: '/',
        breadcrumbs: [],
        activeModal: null,
        modalData: {},
        globalLoading: false,
        toasts: [],
        listView: 'list',
        sortBy: 'createdAt',
        filterBy: {},

        // Navigation actions
        setSidebarOpen: (open) => set(state => { state.sidebarOpen = open; }),
        
        navigateTo: (route) => set(state => {
          state.currentRoute = route;
          // TODO: Could integrate with router here
        }),
        
        addBreadcrumb: (crumb) => set(state => {
          state.breadcrumbs.push(crumb);
        }),
        
        clearBreadcrumbs: () => set(state => {
          state.breadcrumbs = [];
        }),

        // Modal actions
        openModal: (modalId, data = {}) => set(state => {
          state.activeModal = modalId;
          state.modalData = data;
        }),
        
        closeModal: () => set(state => {
          state.activeModal = null;
          state.modalData = {};
        }),
        
        updateModalData: (data) => set(state => {
          Object.assign(state.modalData, data);
        }),

        // Loading and feedback
        setGlobalLoading: (loading) => set(state => {
          state.globalLoading = loading;
        }),
        
        addToast: (toast) => set(state => {
          const newToast = {
            ...toast,
            id: `toast_${Date.now()}_${Math.random()}`,
          };
          state.toasts.push(newToast);
        }),
        
        removeToast: (id) => set(state => {
          state.toasts = state.toasts.filter(t => t.id !== id);
        }),
        
        clearToasts: () => set(state => {
          state.toasts = [];
        }),

        // View preferences
        setListView: (view) => set(state => {
          state.listView = view;
        }),
        
        setSortBy: (sortBy) => set(state => {
          state.sortBy = sortBy;
        }),
        
        updateFilter: (key, value) => set(state => {
          state.filterBy[key] = value;
        }),
        
        clearFilters: () => set(state => {
          state.filterBy = {};
        }),
      }))
    ),
    { name: 'ui-store' }
  )
);

// ============================================
// FORM STATE STORE
// ============================================
interface FormStore extends FormState {
  initializeForm: (formId: string, initialData?: any) => void;
  updateField: (field: string, value: any) => void;
  setFieldError: (field: string, errors: string[]) => void;
  clearFieldError: (field: string) => void;
  setFormErrors: (errors: Record<string, string[]>) => void;
  clearErrors: () => void;
  markDirty: () => void;
  markClean: () => void;
  setSubmitting: (submitting: boolean) => void;
  resetForm: () => void;
  destroyForm: () => void;
}

export const useFormStore = create<FormStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        activeForm: null,
        formData: {},
        formErrors: {},
        isDirty: false,
        isSubmitting: false,

        initializeForm: (formId, initialData = {}) => set(state => {
          state.activeForm = formId;
          state.formData = { ...initialData };
          state.formErrors = {};
          state.isDirty = false;
          state.isSubmitting = false;
        }),

        updateField: (field, value) => set(state => {
          state.formData[field] = value;
          state.isDirty = true;
          // Clear field error when user types
          if (state.formErrors[field]) {
            delete state.formErrors[field];
          }
        }),

        setFieldError: (field, errors) => set(state => {
          state.formErrors[field] = errors;
        }),

        clearFieldError: (field) => set(state => {
          delete state.formErrors[field];
        }),

        setFormErrors: (errors) => set(state => {
          state.formErrors = errors;
        }),

        clearErrors: () => set(state => {
          state.formErrors = {};
        }),

        markDirty: () => set(state => {
          state.isDirty = true;
        }),

        markClean: () => set(state => {
          state.isDirty = false;
        }),

        setSubmitting: (submitting) => set(state => {
          state.isSubmitting = submitting;
        }),

        resetForm: () => set(state => {
          state.formData = {};
          state.formErrors = {};
          state.isDirty = false;
          state.isSubmitting = false;
        }),

        destroyForm: () => set(state => {
          state.activeForm = null;
          state.formData = {};
          state.formErrors = {};
          state.isDirty = false;
          state.isSubmitting = false;
        }),
      }))
    ),
    { name: 'form-store' }
  )
);

// ============================================
// USER PREFERENCES STORE (Persisted)
// ============================================
interface PreferencesStore extends UserPreferences {
  updateTheme: (theme: 'light' | 'dark' | 'auto') => void;
  updateFontSize: (size: 'small' | 'medium' | 'large') => void;
  updateColorScheme: (scheme: string) => void;
  toggleAutoSave: () => void;
  toggleNotifications: () => void;
  updateLanguage: (language: string) => void;
  updateTimezone: (timezone: string) => void;
  updatePostsPerPage: (count: number) => void;
  updateDefaultSort: (sort: string) => void;
  addHiddenTag: (tag: string) => void;
  removeHiddenTag: (tag: string) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'auto',
  fontSize: 'medium',
  colorScheme: 'blue',
  autoSave: true,
  notifications: true,
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  postsPerPage: 10,
  defaultSort: 'createdAt',
  hiddenTags: [],
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    devtools(
      subscribeWithSelector((set, get) => ({
        ...defaultPreferences,

        updateTheme: (theme) => set({ theme }),
        updateFontSize: (fontSize) => set({ fontSize }),
        updateColorScheme: (colorScheme) => set({ colorScheme }),
        toggleAutoSave: () => set(state => ({ autoSave: !state.autoSave })),
        toggleNotifications: () => set(state => ({ notifications: !state.notifications })),
        updateLanguage: (language) => set({ language }),
        updateTimezone: (timezone) => set({ timezone }),
        updatePostsPerPage: (postsPerPage) => set({ postsPerPage }),
        updateDefaultSort: (defaultSort) => set({ defaultSort }),
        
        addHiddenTag: (tag) => set(state => ({
          hiddenTags: [...state.hiddenTags, tag].filter((t, i, arr) => arr.indexOf(t) === i)
        })),
        
        removeHiddenTag: (tag) => set(state => ({
          hiddenTags: state.hiddenTags.filter(t => t !== tag)
        })),
        
        resetPreferences: () => set(defaultPreferences),
      })),
      { name: 'preferences-store' }
    ),
    {
      name: 'user-preferences',
      version: 1,
    }
  )
);

// ============================================
// SESSION STATE STORE
// ============================================
interface SessionStore extends SessionState {
  login: (userId: string, token: string, expiry: string) => void;
  logout: () => void;
  updateToken: (token: string, expiry: string) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  updateLastSync: () => void;
  addPendingAction: (action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>) => void;
  removePendingAction: (id: string) => void;
  incrementRetryCount: (id: string) => void;
  clearPendingActions: () => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    devtools(
      subscribeWithSelector((set, get) => ({
        // Initial state
        isAuthenticated: false,
        currentUserId: null,
        sessionToken: null,
        tokenExpiry: null,
        isOnline: navigator.onLine,
        lastSyncTime: null,
        pendingActions: [],

        login: (userId, token, expiry) => set({
          isAuthenticated: true,
          currentUserId: userId,
          sessionToken: token,
          tokenExpiry: expiry,
        }),

        logout: () => set({
          isAuthenticated: false,
          currentUserId: null,
          sessionToken: null,
          tokenExpiry: null,
          pendingActions: [], // Clear pending actions on logout
        }),

        updateToken: (token, expiry) => set({
          sessionToken: token,
          tokenExpiry: expiry,
        }),

        setOnlineStatus: (isOnline) => set({ isOnline }),

        updateLastSync: () => set({
          lastSyncTime: new Date().toISOString(),
        }),

        addPendingAction: (action) => set(state => ({
          pendingActions: [
            ...state.pendingActions,
            {
              ...action,
              id: `pending_${Date.now()}_${Math.random()}`,
              timestamp: new Date().toISOString(),
              retryCount: 0,
            },
          ],
        })),

        removePendingAction: (id) => set(state => ({
          pendingActions: state.pendingActions.filter(a => a.id !== id),
        })),

        incrementRetryCount: (id) => set(state => ({
          pendingActions: state.pendingActions.map(a =>
            a.id === id ? { ...a, retryCount: a.retryCount + 1 } : a
          ),
        })),

        clearPendingActions: () => set({ pendingActions: [] }),
      })),
      { name: 'session-store' }
    ),
    {
      name: 'session-state',
      partialize: (state) => ({
        // Only persist authentication data, not connection state
        isAuthenticated: state.isAuthenticated,
        currentUserId: state.currentUserId,
        sessionToken: state.sessionToken,
        tokenExpiry: state.tokenExpiry,
        pendingActions: state.pendingActions,
      }),
    }
  )
);

// TODO 3: State Communication Patterns

// ============================================
// CROSS-STORE COMMUNICATION CONTEXT
// ============================================
interface StateCoordinator {
  // Sync actions across stores
  handleUserLogin: (userId: string, token: string) => void;
  handleUserLogout: () => void;
  handleOfflineMode: () => void;
  handleOnlineMode: () => void;
  handleFormSubmit: (formId: string, data: any) => Promise<void>;
  handleBulkAction: (action: string, items: any[]) => void;
}

const StateCoordinatorContext = createContext<StateCoordinator | null>(null);

export const useStateCoordinator = () => {
  const coordinator = useContext(StateCoordinatorContext);
  if (!coordinator) {
    throw new Error('useStateCoordinator must be used within StateCoordinatorProvider');
  }
  return coordinator;
};

export const StateCoordinatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get store actions
  const sessionActions = useSessionStore();
  const uiActions = useUIStore();
  const formActions = useFormStore();
  
  const coordinator: StateCoordinator = {
    handleUserLogin: (userId, token) => {
      // TODO: Coordinate login across stores
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      
      // Update session
      sessionActions.login(userId, token, expiry);
      
      // Update UI
      uiActions.addToast({
        type: 'success',
        message: 'Successfully logged in!',
        duration: 3000,
      });
      uiActions.navigateTo('/dashboard');
      
      // TODO: Could trigger server state refetch here
    },

    handleUserLogout: () => {
      // TODO: Coordinate logout across stores
      sessionActions.logout();
      
      // Clear UI state
      uiActions.closeModal();
      uiActions.clearToasts();
      uiActions.clearFilters();
      uiActions.navigateTo('/');
      
      // Clear form state
      formActions.destroyForm();
      
      uiActions.addToast({
        type: 'info',
        message: 'You have been logged out.',
        duration: 3000,
      });
    },

    handleOfflineMode: () => {
      sessionActions.setOnlineStatus(false);
      uiActions.addToast({
        type: 'warning',
        message: 'You are now offline. Changes will be synced when connection is restored.',
        duration: 0, // Persistent toast
      });
    },

    handleOnlineMode: () => {
      sessionActions.setOnlineStatus(true);
      uiActions.removeToast('offline-warning');
      uiActions.addToast({
        type: 'success',
        message: 'Connection restored. Syncing changes...',
        duration: 3000,
      });
      
      // TODO: Process pending actions
      const pendingActions = useSessionStore.getState().pendingActions;
      if (pendingActions.length > 0) {
        uiActions.setGlobalLoading(true);
        // Process pending actions...
        // sessionActions.clearPendingActions();
        uiActions.setGlobalLoading(false);
      }
      
      sessionActions.updateLastSync();
    },

    handleFormSubmit: async (formId, data) => {
      formActions.setSubmitting(true);
      
      try {
        // TODO: Submit to server state management layer
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        
        formActions.markClean();
        formActions.setSubmitting(false);
        
        uiActions.addToast({
          type: 'success',
          message: 'Form submitted successfully!',
          duration: 3000,
        });
        
        if (formId === 'create-post') {
          uiActions.navigateTo('/posts');
        }
        
      } catch (error) {
        formActions.setSubmitting(false);
        formActions.setFormErrors({
          general: ['Submission failed. Please try again.'],
        });
        
        // Add to pending actions if offline
        if (!sessionActions.isOnline) {
          sessionActions.addPendingAction({
            type: 'create',
            entity: 'post', // Would be determined by formId
            data,
          });
        }
      }
    },

    handleBulkAction: (action, items) => {
      uiActions.setGlobalLoading(true);
      
      // TODO: Process bulk action
      setTimeout(() => {
        uiActions.setGlobalLoading(false);
        uiActions.addToast({
          type: 'success',
          message: `${action} completed for ${items.length} items.`,
          duration: 3000,
        });
      }, 1000);
    },
  };

  return (
    <StateCoordinatorContext.Provider value={coordinator}>
      {children}
    </StateCoordinatorContext.Provider>
  );
};

// TODO 4: Demo Components

const Header: React.FC = () => {
  const { currentRoute, globalLoading } = useUIStore();
  const { isAuthenticated, currentUserId } = useSessionStore();
  const { handleUserLogin, handleUserLogout } = useStateCoordinator();

  return (
    <header style={{
      padding: '16px',
      backgroundColor: '#3498db',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div>
        <h1>State Separation Demo</h1>
        <div style={{ fontSize: '12px' }}>Current Route: {currentRoute}</div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {globalLoading && <div>⏳ Loading...</div>}
        
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>User: {currentUserId}</span>
            <button onClick={handleUserLogout}>Logout</button>
          </div>
        ) : (
          <button onClick={() => handleUserLogin('demo-user', 'demo-token')}>
            Login
          </button>
        )}
      </div>
    </header>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            padding: '12px',
            borderRadius: '4px',
            backgroundColor: getToastColor(toast.type),
            color: 'white',
            maxWidth: '300px',
            cursor: 'pointer',
          }}
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
          {toast.duration === 0 && (
            <button
              style={{ float: 'right', marginLeft: '8px' }}
              onClick={() => removeToast(toast.id)}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

function getToastColor(type: string): string {
  switch (type) {
    case 'success': return '#27ae60';
    case 'error': return '#e74c3c';
    case 'warning': return '#f39c12';
    default: return '#3498db';
  }
}

const StatusPanel: React.FC = () => {
  const uiState = useUIStore();
  const sessionState = useSessionStore();
  const preferences = usePreferencesStore();
  const formState = useFormStore();

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      fontSize: '12px',
      maxWidth: '300px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <h4>State Overview</h4>
      
      <div style={{ marginBottom: '12px' }}>
        <strong>Session:</strong>
        <div>Authenticated: {sessionState.isAuthenticated ? '✅' : '❌'}</div>
        <div>Online: {sessionState.isOnline ? '🟢' : '🔴'}</div>
        <div>Pending Actions: {sessionState.pendingActions.length}</div>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <strong>UI:</strong>
        <div>Active Modal: {uiState.activeModal || 'None'}</div>
        <div>Toasts: {uiState.toasts.length}</div>
        <div>Filters: {Object.keys(uiState.filterBy).length}</div>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <strong>Form:</strong>
        <div>Active: {formState.activeForm || 'None'}</div>
        <div>Dirty: {formState.isDirty ? '✅' : '❌'}</div>
        <div>Errors: {Object.keys(formState.formErrors).length}</div>
      </div>
      
      <div>
        <strong>Preferences:</strong>
        <div>Theme: {preferences.theme}</div>
        <div>Language: {preferences.language}</div>
        <div>Posts/Page: {preferences.postsPerPage}</div>
      </div>
    </div>
  );
};

// TODO 5: Main Component
export const StateSeparationExercise: React.FC = () => {
  return (
    <StateCoordinatorProvider>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Header />
        <ToastContainer />
        <StatusPanel />
        
        <main style={{ padding: '20px' }}>
          <h2>Server State vs Client State Separation</h2>
          <p style={{ color: '#666', marginBottom: '32px' }}>
            This exercise demonstrates clear architectural boundaries between server state 
            (managed by GraphQL clients) and client state (managed by Zustand stores).
          </p>
          
          <div style={{ 
            display: 'grid', 
            gap: '24px', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          }}>
            <StateDemo />
            <PreferencesDemo />
            <FormDemo />
          </div>
          
          <div style={{ 
            marginTop: '32px', 
            padding: '16px', 
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}>
            <h4>🏗️ Architecture Principles:</h4>
            <ul>
              <li>📊 <strong>Server State:</strong> Remote data managed by GraphQL clients</li>
              <li>🖥️ <strong>Client State:</strong> Local UI state managed by Zustand</li>
              <li>🔄 <strong>Clear Boundaries:</strong> No mixing of concerns</li>
              <li>📡 <strong>Communication:</strong> Explicit coordination patterns</li>
              <li>💾 <strong>Persistence:</strong> Selective data persistence</li>
              <li>🧪 <strong>Testability:</strong> Isolated state domains</li>
            </ul>
          </div>
        </main>
      </div>
    </StateCoordinatorProvider>
  );
};

// Demo components - TODO: Implement these
const StateDemo = () => <div>State demonstration - TODO: Implement</div>;
const PreferencesDemo = () => <div>Preferences demo - TODO: Implement</div>;
const FormDemo = () => <div>Form demo - TODO: Implement</div>;

export default StateSeparationExercise;