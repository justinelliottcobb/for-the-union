import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  ReactNode,
  ComponentType,
  ElementType,
  CSSProperties
} from 'react';

// Advanced Component Composition Strategies
// Enterprise-level composition patterns for scalable React architectures

// =============================================================================
// TASK 1: Layout System with Context-Aware Components
// =============================================================================

interface LayoutContextType {
  direction: 'horizontal' | 'vertical' | 'grid';
  spacing: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  debug?: boolean;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export const useLayoutContext = (): LayoutContextType => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within a Layout component');
  }
  return context;
};

interface LayoutProps {
  direction?: 'horizontal' | 'vertical' | 'grid';
  spacing?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  debug?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> & { Item: typeof LayoutItem } = ({
  direction = 'horizontal',
  spacing = 2,
  align = 'start',
  justify = 'start',
  debug = false,
  className = '',
  style = {},
  children
}) => {
  const contextValue = useMemo(() => ({
    direction,
    spacing,
    align,
    justify,
    debug
  }), [direction, spacing, align, justify, debug]);

  const layoutStyles: CSSProperties = {
    display: direction === 'grid' ? 'grid' : 'flex',
    flexDirection: direction === 'horizontal' ? 'row' : 'column',
    alignItems: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align,
    justifyContent: justify === 'start' ? 'flex-start' : justify === 'end' ? 'flex-end' : justify,
    gap: `${spacing * 8}px`,
    ...(debug && {
      border: '2px dashed #007acc',
      backgroundColor: 'rgba(0, 122, 204, 0.1)',
      position: 'relative'
    }),
    ...style
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className={`layout ${className}`} style={layoutStyles}>
        {debug && (
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '0',
              fontSize: '12px',
              color: '#007acc',
              fontWeight: 'bold'
            }}
          >
            Layout: {direction} | spacing: {spacing}
          </div>
        )}
        {children}
      </div>
    </LayoutContext.Provider>
  );
};

interface LayoutItemProps {
  flex?: number | string;
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export const LayoutItem: React.FC<LayoutItemProps> = ({
  flex,
  align,
  className = '',
  style = {},
  children
}) => {
  const context = useLayoutContext();
  
  const itemStyles: CSSProperties = {
    flex: flex || 'none',
    alignSelf: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align,
    ...(context.debug && {
      border: '1px solid #ff6b6b',
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
      position: 'relative'
    }),
    ...style
  };

  return (
    <div className={`layout-item ${className}`} style={itemStyles}>
      {context.debug && (
        <div
          style={{
            position: 'absolute',
            top: '-15px',
            right: '0',
            fontSize: '10px',
            color: '#ff6b6b',
            fontWeight: 'bold'
          }}
        >
          flex: {flex || 'none'}
        </div>
      )}
      {children}
    </div>
  );
};

Layout.Item = LayoutItem;

// =============================================================================
// TASK 2: Provider Composition Utilities
// =============================================================================

interface ProviderConfig {
  Provider: ComponentType<any>;
  props?: Record<string, any>;
}

interface ProviderComposerProps {
  providers: ProviderConfig[];
  children: ReactNode;
}

export const ProviderComposer: React.FC<ProviderComposerProps> = ({ providers, children }) => {
  return providers.reduce((acc, { Provider, props = {} }) => (
    <Provider {...props}>{acc}</Provider>
  ), children as React.ReactElement);
};

// =============================================================================
// TASK 3: HOC Composition with Performance Optimization
// =============================================================================

type HOC<P = any> = (Component: ComponentType<P>) => ComponentType<P>;

interface ComposeOptions {
  displayName?: string;
  forwardRef?: boolean;
}

export const composeHOCs = <P extends object = any>(
  ...hocs: HOC<P>[]
) => (
  Component: ComponentType<P>,
  options: ComposeOptions = {}
): ComponentType<P> => {
  const composed = hocs.reduce((acc, hoc) => hoc(acc), Component);
  
  if (options.displayName) {
    composed.displayName = options.displayName;
  } else {
    const hocNames = hocs.map(hoc => hoc.name || 'HOC').join('(');
    composed.displayName = `${hocNames}(${Component.displayName || Component.name || 'Component'})`;
  }

  // Preserve static properties
  Object.assign(composed, Component);

  return composed;
};

// Example HOCs for demonstration
export const withLoading = <P extends object>(Component: ComponentType<P>) => {
  const WrappedComponent = (props: P & { loading?: boolean }) => {
    const { loading, ...restProps } = props;
    if (loading) return <div>Loading...</div>;
    return <Component {...(restProps as P)} />;
  };
  WrappedComponent.displayName = `withLoading(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export const withError = <P extends object>(Component: ComponentType<P>) => {
  const WrappedComponent = (props: P & { error?: string }) => {
    const { error, ...restProps } = props;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
    return <Component {...(restProps as P)} />;
  };
  WrappedComponent.displayName = `withError(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// =============================================================================
// TASK 4: Slot-based Composition System
// =============================================================================

interface SlotContextType {
  slots: Map<string, ReactNode>;
  setSlot: (name: string, content: ReactNode) => void;
  removeSlot: (name: string) => void;
}

const SlotContext = createContext<SlotContextType | null>(null);

export const useSlotContext = (): SlotContextType => {
  const context = useContext(SlotContext);
  if (!context) {
    throw new Error('useSlotContext must be used within a SlotProvider');
  }
  return context;
};

export const SlotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [slots, setSlots] = useState<Map<string, ReactNode>>(new Map());

  const setSlot = useCallback((name: string, content: ReactNode) => {
    setSlots(prev => new Map(prev.set(name, content)));
  }, []);

  const removeSlot = useCallback((name: string) => {
    setSlots(prev => {
      const newSlots = new Map(prev);
      newSlots.delete(name);
      return newSlots;
    });
  }, []);

  const contextValue = useMemo(() => ({
    slots,
    setSlot,
    removeSlot
  }), [slots, setSlot, removeSlot]);

  return (
    <SlotContext.Provider value={contextValue}>
      {children}
    </SlotContext.Provider>
  );
};

interface SlotProps {
  name: string;
  fallback?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const Slot: React.FC<SlotProps> = ({ name, fallback, className, style }) => {
  const { slots } = useSlotContext();
  const content = slots.get(name);
  
  return (
    <div className={className} style={style}>
      {content || fallback || null}
    </div>
  );
};

interface SlotFillProps {
  slot: string;
  children: ReactNode;
}

export const SlotFill: React.FC<SlotFillProps> = ({ slot, children }) => {
  const { setSlot, removeSlot } = useSlotContext();

  useEffect(() => {
    setSlot(slot, children);
    return () => removeSlot(slot);
  }, [slot, children, setSlot, removeSlot]);

  return null;
};

// =============================================================================
// TASK 5: Render Optimization and Performance Monitoring
// =============================================================================

interface RenderTrackerProps {
  name: string;
  logLevel?: 'debug' | 'info' | 'warn';
  children: ReactNode;
}

export const RenderTracker: React.FC<RenderTrackerProps> = ({ 
  name, 
  logLevel = 'debug', 
  children 
}) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (process.env.NODE_ENV === 'development') {
      const message = `[${name}] Render #${renderCount.current} (+${timeSinceLastRender}ms)`;
      
      switch (logLevel) {
        case 'warn':
          console.warn(message);
          break;
        case 'info':
          console.info(message);
          break;
        default:
          console.debug(message);
      }
    }
  });

  return <>{children}</>;
};

interface ConditionalProps {
  when: boolean | (() => boolean);
  animate?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export const Conditional: React.FC<ConditionalProps> = ({ 
  when, 
  animate = false, 
  fallback, 
  children 
}) => {
  const [shouldRender, setShouldRender] = useState(() => 
    typeof when === 'function' ? when() : when
  );

  useEffect(() => {
    const condition = typeof when === 'function' ? when() : when;
    if (!animate) {
      setShouldRender(condition);
    } else {
      // Simple animation delay for demonstration
      if (condition) {
        setShouldRender(true);
      } else {
        const timeout = setTimeout(() => setShouldRender(false), 150);
        return () => clearTimeout(timeout);
      }
    }
  }, [when, animate]);

  if (!shouldRender) {
    return <>{fallback || null}</>;
  }

  return (
    <div
      style={animate ? {
        transition: 'opacity 0.15s ease-in-out',
        opacity: shouldRender ? 1 : 0
      } : undefined}
    >
      {children}
    </div>
  );
};

// =============================================================================
// TASK 6: Compound Tabs System
// =============================================================================

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: Map<string, { label: string; disabled?: boolean }>;
  registerTab: (id: string, label: string, disabled?: boolean) => void;
  unregisterTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

export const useTabsContext = (): TabsContextType => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabsContext must be used within a Tabs component');
  }
  return context;
};

interface TabsProps {
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  children: ReactNode;
}

export const Tabs: React.FC<TabsProps> & {
  List: typeof TabList;
  Panels: typeof TabPanels;
  Panel: typeof TabPanel;
} = ({ defaultTab, activeTab: controlledActiveTab, onTabChange, children }) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || '');
  const [tabs, setTabs] = useState<Map<string, { label: string; disabled?: boolean }>>(new Map());

  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const setActiveTab = useCallback((tab: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tab);
    }
    onTabChange?.(tab);
  }, [controlledActiveTab, onTabChange]);

  const registerTab = useCallback((id: string, label: string, disabled = false) => {
    setTabs(prev => new Map(prev.set(id, { label, disabled })));
  }, []);

  const unregisterTab = useCallback((id: string) => {
    setTabs(prev => {
      const newTabs = new Map(prev);
      newTabs.delete(id);
      return newTabs;
    });
  }, []);

  const contextValue = useMemo(() => ({
    activeTab,
    setActiveTab,
    tabs,
    registerTab,
    unregisterTab
  }), [activeTab, setActiveTab, tabs, registerTab, unregisterTab]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div className="tabs">
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabList: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const { tabs, activeTab, setActiveTab } = useTabsContext();

  const handleKeyDown = useCallback((e: React.KeyboardEvent, tabId: string) => {
    const tabArray = Array.from(tabs.keys());
    const currentIndex = tabArray.indexOf(tabId);

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % tabArray.length;
        setActiveTab(tabArray[nextIndex]);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? tabArray.length - 1 : currentIndex - 1;
        setActiveTab(tabArray[prevIndex]);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        setActiveTab(tabId);
        break;
    }
  }, [tabs, setActiveTab]);

  return (
    <div className="tab-list" role="tablist" aria-orientation="horizontal">
      {Array.from(tabs.entries()).map(([id, { label, disabled }]) => (
        <button
          key={id}
          role="tab"
          aria-selected={activeTab === id}
          aria-controls={`panel-${id}`}
          disabled={disabled}
          onClick={() => !disabled && setActiveTab(id)}
          onKeyDown={(e) => handleKeyDown(e, id)}
          style={{
            padding: '8px 16px',
            border: '1px solid #ccc',
            backgroundColor: activeTab === id ? '#007acc' : '#f5f5f5',
            color: activeTab === id ? 'white' : '#333',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1
          }}
        >
          {label}
        </button>
      ))}
      {children}
    </div>
  );
};

export const TabPanels: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { activeTab } = useTabsContext();

  return (
    <div className="tab-panels">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.props.id === activeTab) {
          return React.cloneElement(child, { active: true });
        }
        return null;
      })}
    </div>
  );
};

interface TabPanelProps {
  id: string;
  label: string;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}

export const TabPanel: React.FC<TabPanelProps> = ({ 
  id, 
  label, 
  disabled = false, 
  active = false, 
  children 
}) => {
  const { registerTab, unregisterTab } = useTabsContext();

  useEffect(() => {
    registerTab(id, label, disabled);
    return () => unregisterTab(id);
  }, [id, label, disabled, registerTab, unregisterTab]);

  if (!active) return null;

  return (
    <div
      className="tab-panel"
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      style={{ padding: '16px' }}
    >
      {children}
    </div>
  );
};

Tabs.List = TabList;
Tabs.Panels = TabPanels;
Tabs.Panel = TabPanel;

// =============================================================================
// DEMO COMPONENT
// =============================================================================

export const CompositionDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('layout');
  const [layoutDebug, setLayoutDebug] = useState(false);
  const [showConditional, setShowConditional] = useState(true);

  // Example providers for composition demo
  const providers = [
    { 
      Provider: ({ children }: { children: ReactNode }) => (
        <div style={{ backgroundColor: '#f0f8ff', padding: '8px' }}>{children}</div>
      )
    },
    { 
      Provider: ({ children }: { children: ReactNode }) => (
        <div style={{ border: '1px solid #007acc', margin: '4px' }}>{children}</div>
      )
    }
  ];

  // Enhanced component using HOC composition
  const EnhancedComponent = useMemo(() => 
    composeHOCs(withLoading, withError)(
      ({ message }: { message: string }) => <div>{message}</div>,
      { displayName: 'EnhancedDemo' }
    ),
    []
  );

  return (
    <RenderTracker name="CompositionDemo" logLevel="info">
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <h2>Advanced Component Composition Strategies</h2>
        
        <Tabs activeTab={activeTab} onTabChange={setActiveTab}>
          <Tabs.List />
          <Tabs.Panels>
            <Tabs.Panel id="layout" label="Layout System">
              <div style={{ marginBottom: '20px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={layoutDebug}
                    onChange={(e) => setLayoutDebug(e.target.checked)}
                  />
                  Debug Mode
                </label>
              </div>
              
              <Layout direction="vertical" spacing={3} debug={layoutDebug}>
                <Layout.Item>
                  <Layout direction="horizontal" spacing={2} debug={layoutDebug}>
                    <Layout.Item flex={1}>Flex 1</Layout.Item>
                    <Layout.Item flex={2}>Flex 2 (2x width)</Layout.Item>
                    <Layout.Item>Fixed width</Layout.Item>
                  </Layout>
                </Layout.Item>
                
                <Layout.Item>
                  <Layout direction="horizontal" spacing={1} justify="space-between" debug={layoutDebug}>
                    <Layout.Item>Left</Layout.Item>
                    <Layout.Item>Center</Layout.Item>
                    <Layout.Item>Right</Layout.Item>
                  </Layout>
                </Layout.Item>
              </Layout>
            </Tabs.Panel>
            
            <Tabs.Panel id="providers" label="Provider Composition">
              <ProviderComposer providers={providers}>
                <div>Content wrapped by composed providers</div>
              </ProviderComposer>
            </Tabs.Panel>
            
            <Tabs.Panel id="hoc" label="HOC Composition">
              <div style={{ marginBottom: '20px' }}>
                <EnhancedComponent 
                  message="Normal component" 
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <EnhancedComponent 
                  message="This won't show" 
                  loading={true}
                />
              </div>
              <div>
                <EnhancedComponent 
                  message="This won't show either" 
                  error="Something went wrong!"
                />
              </div>
            </Tabs.Panel>
            
            <Tabs.Panel id="slots" label="Slot System">
              <SlotProvider>
                <SlotFill slot="header">
                  <h3>Dynamically Filled Header</h3>
                </SlotFill>
                <SlotFill slot="sidebar">
                  <div style={{ backgroundColor: '#e3f2fd', padding: '10px' }}>
                    Sidebar Content
                  </div>
                </SlotFill>
                
                <Layout direction="horizontal" spacing={2}>
                  <Layout.Item flex={3}>
                    <Slot name="header" fallback={<h3>Default Header</h3>} />
                    <div>Main content area</div>
                  </Layout.Item>
                  <Layout.Item flex={1}>
                    <Slot name="sidebar" fallback={<div>No sidebar</div>} />
                  </Layout.Item>
                </Layout>
              </SlotProvider>
            </Tabs.Panel>
            
            <Tabs.Panel id="conditional" label="Conditional Rendering">
              <div style={{ marginBottom: '20px' }}>
                <button onClick={() => setShowConditional(!showConditional)}>
                  Toggle Content
                </button>
              </div>
              
              <Conditional 
                when={showConditional} 
                animate={true}
                fallback={<div>Content is hidden</div>}
              >
                <div style={{ 
                  backgroundColor: '#e8f5e8', 
                  padding: '20px', 
                  borderRadius: '4px' 
                }}>
                  This content appears/disappears with animation
                </div>
              </Conditional>
            </Tabs.Panel>
          </Tabs.Panels>
        </Tabs>
      </div>
    </RenderTracker>
  );
};

// All components are exported individually above