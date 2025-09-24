import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';

// Types and Interfaces
interface MicroFrontendConfig {
  name: string;
  url: string;
  framework: 'react' | 'vue' | 'angular' | 'svelte';
  version: string;
  exposed: string[];
  dependencies?: Record<string, string>;
  routes?: string[];
  fallbackComponent?: React.ComponentType;
}

interface ModuleFederationManifest {
  remotes: Record<string, string>;
  shared: Record<string, any>;
  exposes: Record<string, string>;
}

interface RouterConfig {
  path: string;
  microfrontend: string;
  component?: string;
  exact?: boolean;
  fallback?: React.ComponentType;
}

interface SharedState {
  user: {
    id?: string;
    name?: string;
    email?: string;
    permissions?: string[];
  };
  theme: 'light' | 'dark';
  locale: string;
  notifications: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: number;
  }>;
  navigation: {
    currentRoute: string;
    history: string[];
  };
}

interface MicroFrontendModule {
  mount: (element: HTMLElement, props?: any) => Promise<void>;
  unmount: (element: HTMLElement) => Promise<void>;
  update?: (props: any) => Promise<void>;
  getRoutes?: () => string[];
}

interface CrossFrameworkEvent {
  type: string;
  source: string;
  target?: string;
  data: any;
  timestamp: number;
}

interface LoadingStrategy {
  type: 'eager' | 'lazy' | 'dynamic';
  preload?: boolean;
  retries?: number;
  timeout?: number;
}

// Shared State Context
const SharedStateContext = createContext<{
  state: SharedState;
  updateState: (updates: Partial<SharedState>) => void;
  subscribe: (listener: (state: SharedState) => void) => () => void;
}>({
  state: {
    user: {},
    theme: 'light',
    locale: 'en',
    notifications: [],
    navigation: { currentRoute: '/', history: [] }
  },
  updateState: () => {},
  subscribe: () => () => {}
});

// Event Bus for Cross-Framework Communication
class EventBus {
  private listeners: Map<string, Set<Function>> = new Map();
  private history: CrossFrameworkEvent[] = [];
  private maxHistorySize = 100;

  on(eventType: string, listener: Function): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    return () => {
      const eventListeners = this.listeners.get(eventType);
      if (eventListeners) {
        eventListeners.delete(listener);
        if (eventListeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  emit(event: Omit<CrossFrameworkEvent, 'timestamp'>): void {
    const fullEvent: CrossFrameworkEvent = {
      ...event,
      timestamp: Date.now()
    };

    // Add to history
    this.history.push(fullEvent);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Notify listeners
    const eventListeners = this.listeners.get(event.type);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(fullEvent);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      });
    }

    // Global listeners (listening to all events)
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(listener => {
        try {
          listener(fullEvent);
        } catch (error) {
          console.error(`Error in global event listener:`, error);
        }
      });
    }
  }

  getHistory(): CrossFrameworkEvent[] {
    return [...this.history];
  }

  clear(): void {
    this.listeners.clear();
    this.history = [];
  }
}

// Module Federation Utilities
class ModuleFederation {
  private loadedModules: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private retryAttempts: Map<string, number> = new Map();

  async loadModule(
    remoteName: string, 
    exposedModule: string,
    strategy: LoadingStrategy = { type: 'lazy' }
  ): Promise<any> {
    const moduleKey = `${remoteName}/${exposedModule}`;
    
    // Return cached module if available
    if (this.loadedModules.has(moduleKey)) {
      return this.loadedModules.get(moduleKey);
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(moduleKey)) {
      return this.loadingPromises.get(moduleKey);
    }

    const loadingPromise = this.loadModuleInternal(remoteName, exposedModule, strategy);
    this.loadingPromises.set(moduleKey, loadingPromise);

    try {
      const module = await loadingPromise;
      this.loadedModules.set(moduleKey, module);
      this.loadingPromises.delete(moduleKey);
      this.retryAttempts.delete(moduleKey);
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleKey);
      
      // Retry logic
      const retries = this.retryAttempts.get(moduleKey) || 0;
      const maxRetries = strategy.retries || 3;
      
      if (retries < maxRetries) {
        this.retryAttempts.set(moduleKey, retries + 1);
        console.warn(`Retrying module load (${retries + 1}/${maxRetries}):`, moduleKey);
        return this.loadModule(remoteName, exposedModule, strategy);
      }
      
      throw error;
    }
  }

  private async loadModuleInternal(
    remoteName: string, 
    exposedModule: string,
    strategy: LoadingStrategy
  ): Promise<any> {
    const timeout = strategy.timeout || 10000;
    
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Module load timeout: ${remoteName}/${exposedModule}`));
      }, timeout);

      try {
        // Simulate module federation loading
        await this.loadRemoteScript(remoteName);
        
        // Get the module from the remote
        const container = (window as any)[remoteName];
        if (!container) {
          throw new Error(`Remote container not found: ${remoteName}`);
        }

        await container.init({});
        const factory = await container.get(exposedModule);
        const module = factory();
        
        clearTimeout(timeoutId);
        resolve(module);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  private async loadRemoteScript(remoteName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // In a real implementation, this would load the actual remote script
      // For this demo, we'll simulate the loading
      setTimeout(() => {
        // Mock the remote container
        (window as any)[remoteName] = {
          init: async () => {},
          get: async (module: string) => {
            // Return mock module factory
            return () => ({
              default: this.createMockModule(remoteName, module)
            });
          }
        };
        resolve();
      }, Math.random() * 1000 + 500); // Simulate network delay
    });
  }

  private createMockModule(remoteName: string, moduleName: string): MicroFrontendModule {
    return {
      mount: async (element: HTMLElement, props?: any) => {
        const div = document.createElement('div');
        div.innerHTML = `
          <div style="padding: 20px; border: 2px solid #ddd; border-radius: 8px; margin: 10px;">
            <h3>Micro-Frontend: ${remoteName}/${moduleName}</h3>
            <p>Framework: ${this.getRandomFramework()}</p>
            <p>Props: ${JSON.stringify(props || {}, null, 2)}</p>
            <div>
              <button onclick="this.parentElement.querySelector('.dynamic-content').textContent = 'Updated at ' + new Date().toLocaleTimeString()">
                Update Content
              </button>
              <div class="dynamic-content">Ready</div>
            </div>
          </div>
        `;
        element.appendChild(div);
      },
      unmount: async (element: HTMLElement) => {
        element.innerHTML = '';
      },
      update: async (props: any) => {
        console.log(`Updating ${remoteName}/${moduleName} with props:`, props);
      },
      getRoutes: () => [`/${remoteName.toLowerCase()}`, `/${remoteName.toLowerCase()}/${moduleName}`]
    };
  }

  private getRandomFramework(): string {
    const frameworks = ['React 18', 'Vue 3', 'Angular 15', 'Svelte 4'];
    return frameworks[Math.floor(Math.random() * frameworks.length)];
  }

  preloadModules(modules: Array<{ remote: string; exposed: string }>): Promise<void[]> {
    return Promise.all(
      modules.map(({ remote, exposed }) => 
        this.loadModule(remote, exposed, { type: 'eager', preload: true })
          .catch(error => {
            console.warn(`Failed to preload ${remote}/${exposed}:`, error);
            return null;
          })
      )
    );
  }

  getLoadedModules(): string[] {
    return Array.from(this.loadedModules.keys());
  }

  clearCache(): void {
    this.loadedModules.clear();
    this.loadingPromises.clear();
    this.retryAttempts.clear();
  }
}

// Routing Orchestrator
class RoutingOrchestrator {
  private routes: Map<string, RouterConfig> = new Map();
  private activeRoute: string = '/';
  private microfrontendStates: Map<string, any> = new Map();
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupPopstateListener();
  }

  registerRoute(config: RouterConfig): void {
    this.routes.set(config.path, config);
  }

  registerRoutes(configs: RouterConfig[]): void {
    configs.forEach(config => this.registerRoute(config));
  }

  navigate(path: string, state?: any): void {
    if (path === this.activeRoute) return;

    // Save current microfrontend state
    if (this.activeRoute) {
      const currentRoute = this.routes.get(this.activeRoute);
      if (currentRoute) {
        this.microfrontendStates.set(currentRoute.microfrontend, state);
      }
    }

    this.activeRoute = path;
    
    // Update browser history
    window.history.pushState({ path, state }, '', path);
    
    // Emit navigation event
    this.eventBus.emit({
      type: 'navigation',
      source: 'router',
      data: { from: this.activeRoute, to: path, state }
    });
  }

  back(): void {
    window.history.back();
  }

  forward(): void {
    window.history.forward();
  }

  getCurrentRoute(): RouterConfig | null {
    return this.routes.get(this.activeRoute) || null;
  }

  getMicrofrontendState(microfrontend: string): any {
    return this.microfrontendStates.get(microfrontend);
  }

  getAllRoutes(): RouterConfig[] {
    return Array.from(this.routes.values());
  }

  private setupPopstateListener(): void {
    window.addEventListener('popstate', (event) => {
      const path = event.state?.path || window.location.pathname;
      this.activeRoute = path;
      
      this.eventBus.emit({
        type: 'navigation',
        source: 'browser',
        data: { to: path, state: event.state?.state }
      });
    });
  }
}

// State Coordinator
class StateCoordinator {
  private state: SharedState;
  private listeners: Set<(state: SharedState) => void> = new Set();
  private eventBus: EventBus;
  private persistenceKey = 'microfrontend-shared-state';

  constructor(eventBus: EventBus, initialState?: Partial<SharedState>) {
    this.eventBus = eventBus;
    this.state = {
      user: {},
      theme: 'light',
      locale: 'en',
      notifications: [],
      navigation: { currentRoute: '/', history: [] },
      ...this.loadPersistedState(),
      ...initialState
    };

    this.setupEventListeners();
  }

  getState(): SharedState {
    return { ...this.state };
  }

  updateState(updates: Partial<SharedState>): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Persist state
    this.persistState();
    
    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });

    // Emit state change event
    this.eventBus.emit({
      type: 'state-change',
      source: 'state-coordinator',
      data: { oldState, newState: this.state, updates }
    });
  }

  subscribe(listener: (state: SharedState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // User management
  setUser(user: Partial<SharedState['user']>): void {
    this.updateState({ user: { ...this.state.user, ...user } });
  }

  logout(): void {
    this.updateState({ 
      user: {},
      notifications: [
        ...this.state.notifications,
        {
          id: Date.now().toString(),
          type: 'info',
          message: 'User logged out',
          timestamp: Date.now()
        }
      ]
    });
  }

  // Theme management
  setTheme(theme: 'light' | 'dark'): void {
    this.updateState({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Notification management
  addNotification(notification: Omit<SharedState['notifications'][0], 'id' | 'timestamp'>): void {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now()
    };

    this.updateState({
      notifications: [...this.state.notifications, newNotification]
    });

    // Auto-remove after 5 seconds for non-error notifications
    if (notification.type !== 'error') {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, 5000);
    }
  }

  removeNotification(id: string): void {
    this.updateState({
      notifications: this.state.notifications.filter(n => n.id !== id)
    });
  }

  clearNotifications(): void {
    this.updateState({ notifications: [] });
  }

  // Navigation management
  updateNavigation(currentRoute: string): void {
    const navigation = {
      currentRoute,
      history: [...this.state.navigation.history, currentRoute].slice(-10) // Keep last 10
    };
    this.updateState({ navigation });
  }

  private setupEventListeners(): void {
    // Listen to navigation events to update navigation state
    this.eventBus.on('navigation', (event: CrossFrameworkEvent) => {
      if (event.data.to) {
        this.updateNavigation(event.data.to);
      }
    });

    // Listen to microfrontend-specific state requests
    this.eventBus.on('state-request', (event: CrossFrameworkEvent) => {
      this.eventBus.emit({
        type: 'state-response',
        source: 'state-coordinator',
        target: event.source,
        data: this.state
      });
    });
  }

  private loadPersistedState(): Partial<SharedState> {
    try {
      const saved = localStorage.getItem(this.persistenceKey);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
      return {};
    }
  }

  private persistState(): void {
    try {
      localStorage.setItem(this.persistenceKey, JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to persist state:', error);
    }
  }
}

// Micro-Frontend Host Component
interface MicroFrontendHostProps {
  config: MicroFrontendConfig;
  props?: any;
  fallback?: React.ComponentType;
  onError?: (error: Error) => void;
}

const MicroFrontendHost: React.FC<MicroFrontendHostProps> = ({
  config,
  props,
  fallback: Fallback,
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [module, setModule] = useState<MicroFrontendModule | null>(null);
  const moduleFederation = useRef(new ModuleFederation());

  const loadMicrofrontend = useCallback(async () => {
    if (!containerRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // For demo purposes, we'll use the first exposed module
      const exposedModule = config.exposed[0] || 'default';
      const loadedModule = await moduleFederation.current.loadModule(
        config.name,
        exposedModule,
        { type: 'lazy', retries: 2, timeout: 10000 }
      );

      setModule(loadedModule.default || loadedModule);
      
      if (loadedModule.default?.mount || loadedModule.mount) {
        const mountFunction = loadedModule.default?.mount || loadedModule.mount;
        await mountFunction(containerRef.current, props);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  }, [config, props, onError]);

  const unmountMicrofrontend = useCallback(async () => {
    if (containerRef.current && module?.unmount) {
      try {
        await module.unmount(containerRef.current);
      } catch (err) {
        console.warn('Error unmounting microfrontend:', err);
      }
    }
  }, [module]);

  useEffect(() => {
    loadMicrofrontend();
    return () => {
      unmountMicrofrontend();
    };
  }, [loadMicrofrontend, unmountMicrofrontend]);

  useEffect(() => {
    if (module?.update && props) {
      module.update(props).catch(err => {
        console.warn('Error updating microfrontend props:', err);
      });
    }
  }, [module, props]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading {config.name}...</span>
      </div>
    );
  }

  if (error) {
    if (Fallback) {
      return <Fallback />;
    }
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Failed to load {config.name}</h3>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
        <button
          onClick={loadMicrofrontend}
          className="mt-3 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return <div ref={containerRef} className="microfrontend-container" />;
};

// Router Component
interface MicroFrontendRouterProps {
  routes: RouterConfig[];
  orchestrator: RoutingOrchestrator;
  moduleFederation: ModuleFederation;
}

const MicroFrontendRouter: React.FC<MicroFrontendRouterProps> = ({
  routes,
  orchestrator,
  moduleFederation
}) => {
  const [currentRoute, setCurrentRoute] = useState(orchestrator.getCurrentRoute());
  const eventBus = useRef(new EventBus());

  useEffect(() => {
    const unsubscribe = eventBus.current.on('navigation', () => {
      setCurrentRoute(orchestrator.getCurrentRoute());
    });

    return unsubscribe;
  }, [orchestrator]);

  const renderRoute = () => {
    if (!currentRoute) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">404 - Route Not Found</h2>
            <p className="text-gray-600 mt-2">The requested route could not be found.</p>
          </div>
        </div>
      );
    }

    const microfrontendConfig: MicroFrontendConfig = {
      name: currentRoute.microfrontend,
      url: `http://localhost:3001/${currentRoute.microfrontend}`,
      framework: 'react',
      version: '1.0.0',
      exposed: [currentRoute.component || 'App']
    };

    return (
      <MicroFrontendHost
        config={microfrontendConfig}
        fallback={currentRoute.fallback}
      />
    );
  };

  return (
    <div className="microfrontend-router">
      {renderRoute()}
    </div>
  );
};

// Navigation Component
interface NavigationProps {
  routes: RouterConfig[];
  orchestrator: RoutingOrchestrator;
  currentRoute?: string;
}

const Navigation: React.FC<NavigationProps> = ({ routes, orchestrator, currentRoute }) => {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Micro-Frontend Hub</h1>
            </div>
            <div className="ml-6 flex space-x-8">
              {routes.map(route => (
                <button
                  key={route.path}
                  onClick={() => orchestrator.navigate(route.path)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    currentRoute === route.path
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {route.microfrontend}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Notification Component
const NotificationCenter: React.FC = () => {
  const { state, updateState } = useContext(SharedStateContext);

  const removeNotification = (id: string) => {
    updateState({
      notifications: state.notifications.filter(n => n.id !== id)
    });
  };

  if (state.notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {state.notifications.map(notification => (
        <div
          key={notification.id}
          className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto border-l-4 ${
            notification.type === 'error' ? 'border-red-500' :
            notification.type === 'warning' ? 'border-yellow-500' :
            notification.type === 'success' ? 'border-green-500' :
            'border-blue-500'
          }`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-4 inline-flex text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Event Monitor Component (for debugging)
const EventMonitor: React.FC<{ eventBus: EventBus }> = ({ eventBus }) => {
  const [events, setEvents] = useState<CrossFrameworkEvent[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = eventBus.on('*', (event: CrossFrameworkEvent) => {
      setEvents(prev => [...prev.slice(-19), event]); // Keep last 20 events
    });

    return unsubscribe;
  }, [eventBus]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 z-40"
        title="Open Event Monitor"
      >
        📡
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border shadow-lg rounded-lg w-96 max-h-96 overflow-hidden z-40">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-medium">Event Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No events yet
          </div>
        ) : (
          <div className="divide-y">
            {events.map((event, index) => (
              <div key={index} className="p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-600">{event.type}</span>
                  <span className="text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-gray-600">
                  From: {event.source}
                  {event.target && ` → ${event.target}`}
                </div>
                {Object.keys(event.data).length > 0 && (
                  <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono">
                    {JSON.stringify(event.data, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Application Component
const MicroFrontendArchitecture: React.FC = () => {
  // Initialize systems
  const eventBus = useRef(new EventBus());
  const moduleFederation = useRef(new ModuleFederation());
  const orchestrator = useRef(new RoutingOrchestrator(eventBus.current));
  const stateCoordinator = useRef(new StateCoordinator(eventBus.current));

  // State
  const [sharedState, setSharedState] = useState(stateCoordinator.current.getState());
  const [currentRoute, setCurrentRoute] = useState('/dashboard');
  const [statistics, setStatistics] = useState({
    loadedModules: 0,
    activeConnections: 0,
    eventsProcessed: 0
  });

  // Mock microfrontend configurations
  const microfrontendConfigs: MicroFrontendConfig[] = [
    {
      name: 'dashboard',
      url: 'http://localhost:3001/dashboard',
      framework: 'react',
      version: '1.2.0',
      exposed: ['Dashboard'],
      routes: ['/dashboard']
    },
    {
      name: 'user-management',
      url: 'http://localhost:3002/users',
      framework: 'vue',
      version: '2.1.0',
      exposed: ['UserList', 'UserProfile'],
      routes: ['/users', '/users/:id']
    },
    {
      name: 'analytics',
      url: 'http://localhost:3003/analytics',
      framework: 'angular',
      version: '1.0.5',
      exposed: ['Analytics', 'Reports'],
      routes: ['/analytics', '/reports']
    },
    {
      name: 'settings',
      url: 'http://localhost:3004/settings',
      framework: 'svelte',
      version: '1.3.0',
      exposed: ['Settings'],
      routes: ['/settings']
    }
  ];

  // Route configurations
  const routes: RouterConfig[] = [
    { path: '/dashboard', microfrontend: 'dashboard', component: 'Dashboard', exact: true },
    { path: '/users', microfrontend: 'user-management', component: 'UserList', exact: true },
    { path: '/analytics', microfrontend: 'analytics', component: 'Analytics', exact: true },
    { path: '/settings', microfrontend: 'settings', component: 'Settings', exact: true }
  ];

  // Initialize routes
  useEffect(() => {
    orchestrator.current.registerRoutes(routes);
  }, []);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = stateCoordinator.current.subscribe(setSharedState);
    return unsubscribe;
  }, []);

  // Subscribe to navigation events
  useEffect(() => {
    const unsubscribe = eventBus.current.on('navigation', (event: CrossFrameworkEvent) => {
      if (event.data.to) {
        setCurrentRoute(event.data.to);
        stateCoordinator.current.updateNavigation(event.data.to);
      }
    });

    return unsubscribe;
  }, []);

  // Update statistics
  useEffect(() => {
    const updateStats = () => {
      setStatistics({
        loadedModules: moduleFederation.current.getLoadedModules().length,
        activeConnections: microfrontendConfigs.length,
        eventsProcessed: eventBus.current.getHistory().length
      });
    };

    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [microfrontendConfigs.length]);

  // Demo actions
  const handleUserLogin = () => {
    stateCoordinator.current.setUser({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      permissions: ['read', 'write']
    });
    
    stateCoordinator.current.addNotification({
      type: 'success',
      message: 'User logged in successfully'
    });
  };

  const handleThemeToggle = () => {
    const newTheme = sharedState.theme === 'light' ? 'dark' : 'light';
    stateCoordinator.current.setTheme(newTheme);
    
    stateCoordinator.current.addNotification({
      type: 'info',
      message: `Switched to ${newTheme} theme`
    });
  };

  const handleTestCommunication = () => {
    eventBus.current.emit({
      type: 'test-communication',
      source: 'host-app',
      data: {
        message: 'Hello from host application!',
        timestamp: Date.now(),
        user: sharedState.user
      }
    });

    stateCoordinator.current.addNotification({
      type: 'info',
      message: 'Test communication event sent'
    });
  };

  const contextValue = {
    state: sharedState,
    updateState: (updates: Partial<SharedState>) => {
      stateCoordinator.current.updateState(updates);
    },
    subscribe: (listener: (state: SharedState) => void) => {
      return stateCoordinator.current.subscribe(listener);
    }
  };

  return (
    <SharedStateContext.Provider value={contextValue}>
      <div className={`min-h-screen transition-colors ${
        sharedState.theme === 'dark' 
          ? 'bg-gray-900 text-white' 
          : 'bg-gray-50 text-gray-900'
      }`}>
        {/* Navigation */}
        <Navigation 
          routes={routes} 
          orchestrator={orchestrator.current}
          currentRoute={currentRoute}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Demo Controls */}
          <div className="mb-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Micro-Frontend Demo Controls</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded">
                <div className="text-2xl font-bold text-blue-600">{statistics.loadedModules}</div>
                <div className="text-sm text-blue-800 dark:text-blue-200">Loaded Modules</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded">
                <div className="text-2xl font-bold text-green-600">{statistics.activeConnections}</div>
                <div className="text-sm text-green-800 dark:text-green-200">Active Connections</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded">
                <div className="text-2xl font-bold text-purple-600">{statistics.eventsProcessed}</div>
                <div className="text-sm text-purple-800 dark:text-purple-200">Events Processed</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleUserLogin}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Simulate Login
              </button>
              <button
                onClick={handleThemeToggle}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Toggle Theme
              </button>
              <button
                onClick={handleTestCommunication}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Test Communication
              </button>
              <button
                onClick={() => moduleFederation.current.clearCache()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear Module Cache
              </button>
            </div>

            {/* User Info */}
            {sharedState.user.name && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 rounded">
                <p className="text-sm">
                  <span className="font-medium">Current User:</span> {sharedState.user.name} ({sharedState.user.email})
                </p>
              </div>
            )}
          </div>

          {/* Microfrontend Content */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <MicroFrontendRouter
              routes={routes}
              orchestrator={orchestrator.current}
              moduleFederation={moduleFederation.current}
            />
          </div>

          {/* Architecture Overview */}
          <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Architecture Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Registered Microfrontends</h3>
                <div className="space-y-2">
                  {microfrontendConfigs.map(config => (
                    <div key={config.name} className="text-sm p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="font-medium">{config.name}</div>
                      <div className="text-gray-600 dark:text-gray-300">
                        Framework: {config.framework} v{config.version}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300">
                        Exposed: {config.exposed.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Current State</h3>
                <pre className="text-xs bg-gray-50 dark:bg-gray-700 p-3 rounded overflow-auto">
                  {JSON.stringify({
                    currentRoute,
                    theme: sharedState.theme,
                    user: sharedState.user,
                    notifications: sharedState.notifications.length
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Center */}
        <NotificationCenter />

        {/* Event Monitor */}
        <EventMonitor eventBus={eventBus.current} />
      </div>
    </SharedStateContext.Provider>
  );
};

export default MicroFrontendArchitecture;