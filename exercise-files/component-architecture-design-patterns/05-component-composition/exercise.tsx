import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useMemo, 
  useRef, 
  useEffect,
  Children,
  cloneElement,
  isValidElement,
  ReactNode, 
  ReactElement, 
  ComponentType,
  forwardRef,
  useImperativeHandle
} from 'react';

// Advanced Component Composition Patterns
// Master composition over inheritance with enterprise-scale patterns

// TODO: Implement Layout System with Flexible Composition

interface LayoutContextValue {
  spacing: number;
  direction: 'horizontal' | 'vertical' | 'grid';
  align: 'start' | 'center' | 'end' | 'stretch';
  justify: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap: boolean;
  responsive: boolean;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('Layout components must be used within a Layout provider');
  }
  return context;
};

// TODO: Implement Layout Provider with intelligent spacing and alignment
interface LayoutProps extends Partial<LayoutContextValue> {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  debug?: boolean;
}

function Layout({ 
  children, 
  spacing = 4, 
  direction = 'vertical',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  responsive = false,
  as: Component = 'div',
  className = '',
  debug = false,
  ...props 
}: LayoutProps) {
  // TODO: Implement layout context provider
  // Generate CSS classes based on layout props
  // Support responsive breakpoints
  // Add debug mode for development
  
  const layoutValue: LayoutContextValue = useMemo(() => ({
    spacing,
    direction,
    align,
    justify,
    wrap,
    responsive
  }), [spacing, direction, align, justify, wrap, responsive]);

  const getLayoutClasses = useCallback(() => {
    const baseClasses = ['layout'];
    
    // Direction classes
    if (direction === 'horizontal') {
      baseClasses.push('flex', 'flex-row');
    } else if (direction === 'vertical') {
      baseClasses.push('flex', 'flex-col');
    } else if (direction === 'grid') {
      baseClasses.push('grid');
    }
    
    // Alignment classes
    const alignMap = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch'
    };
    baseClasses.push(alignMap[align]);
    
    // Justify classes
    const justifyMap = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly'
    };
    baseClasses.push(justifyMap[justify]);
    
    // Wrap classes
    if (wrap) {
      baseClasses.push('flex-wrap');
    }
    
    // Spacing classes
    if (direction === 'horizontal') {
      baseClasses.push(`space-x-${spacing}`);
    } else if (direction === 'vertical') {
      baseClasses.push(`space-y-${spacing}`);
    } else if (direction === 'grid') {
      baseClasses.push(`gap-${spacing}`);
    }
    
    // Debug classes
    if (debug) {
      baseClasses.push('border-2', 'border-dashed', 'border-red-300', 'bg-red-50');
    }
    
    return baseClasses.concat(className.split(' ')).filter(Boolean).join(' ');
  }, [direction, align, justify, wrap, spacing, debug, className]);

  return (
    <LayoutContext.Provider value={layoutValue}>
      <Component className={getLayoutClasses()} {...props}>
        {children}
      </Component>
    </LayoutContext.Provider>
  );
}

// TODO: Implement Layout.Item with intelligent spacing awareness
interface LayoutItemProps {
  children: ReactNode;
  flex?: number | string;
  align?: LayoutContextValue['align'];
  basis?: string;
  grow?: number;
  shrink?: number;
  order?: number;
  offset?: number;
  span?: number; // For grid layouts
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

function LayoutItem({ 
  children, 
  flex,
  align,
  basis,
  grow,
  shrink,
  order,
  offset,
  span,
  className = '',
  as: Component = 'div',
  ...props 
}: LayoutItemProps) {
  // TODO: Implement layout item with context awareness
  // Apply flex properties based on parent layout
  // Handle grid-specific properties
  // Support responsive behavior
  
  const layout = useLayoutContext();
  
  const getItemClasses = useCallback(() => {
    const baseClasses = ['layout-item'];
    
    // Flex properties
    if (typeof flex === 'number') {
      baseClasses.push(`flex-${flex}`);
    } else if (flex) {
      baseClasses.push(flex);
    }
    
    if (grow !== undefined) {
      baseClasses.push(`flex-grow-${grow}`);
    }
    
    if (shrink !== undefined) {
      baseClasses.push(`flex-shrink-${shrink}`);
    }
    
    if (basis) {
      baseClasses.push(`flex-basis-${basis}`);
    }
    
    // Alignment override
    if (align && align !== layout.align) {
      const alignMap = {
        start: 'self-start',
        center: 'self-center', 
        end: 'self-end',
        stretch: 'self-stretch'
      };
      baseClasses.push(alignMap[align]);
    }
    
    // Order
    if (order !== undefined) {
      baseClasses.push(`order-${order}`);
    }
    
    // Grid-specific properties
    if (layout.direction === 'grid') {
      if (span) {
        baseClasses.push(`col-span-${span}`);
      }
      if (offset) {
        baseClasses.push(`col-start-${offset + 1}`);
      }
    }
    
    return baseClasses.concat(className.split(' ')).filter(Boolean).join(' ');
  }, [flex, align, basis, grow, shrink, order, offset, span, className, layout]);

  return (
    <Component className={getItemClasses()} {...props}>
      {children}
    </Component>
  );
}

// Attach sub-components
Layout.Item = LayoutItem;

// TODO: Implement Provider Composition System
interface ProviderComposerProps {
  providers: Array<{
    Provider: ComponentType<any>;
    props?: Record<string, any>;
  }>;
  children: ReactNode;
}

function ProviderComposer({ providers, children }: ProviderComposerProps) {
  // TODO: Implement provider composition utility
  // Reduce nesting by composing multiple providers
  // Support provider props and configuration
  // Handle provider dependencies and ordering
  
  return providers.reduceRight(
    (acc, { Provider, props = {} }) => (
      <Provider {...props}>
        {acc}
      </Provider>
    ),
    children as ReactElement
  );
}

// TODO: Implement Advanced HOC Composition System
type HOCFunction<P = {}> = <T extends ComponentType<any>>(
  Component: T
) => ComponentType<P>;

interface HOCCompositionOptions {
  displayName?: string;
  skipMemoization?: boolean;
  forwardRef?: boolean;
  hoistStatics?: boolean;
}

function composeHOCs<P = {}>(...hocs: HOCFunction<P>[]) {
  // TODO: Implement HOC composition utility
  // Compose multiple HOCs into a single function
  // Preserve component displayName and static properties
  // Handle ref forwarding across HOC chain
  // Support memoization and performance optimization
  
  return function composedHOC<T extends ComponentType<any>>(
    Component: T,
    options: HOCCompositionOptions = {}
  ): ComponentType<P> {
    const {
      displayName,
      skipMemoization = false,
      forwardRef: shouldForwardRef = false,
      hoistStatics = true
    } = options;

    // Apply HOCs in reverse order (right-to-left composition)
    const ComposedComponent = hocs.reduceRight(
      (acc, hoc) => hoc(acc),
      Component
    );

    // Set display name
    if (displayName) {
      ComposedComponent.displayName = displayName;
    } else {
      const hocNames = hocs.map(hoc => hoc.name || 'HOC').join('(');
      ComposedComponent.displayName = `${hocNames}(${Component.displayName || Component.name})${''.repeat(hocs.length - 1)}`;
    }

    // Handle ref forwarding
    let FinalComponent = ComposedComponent;
    if (shouldForwardRef) {
      FinalComponent = forwardRef((props: any, ref: any) => (
        // @ts-ignore - Complex generic typing
        <ComposedComponent {...props} ref={ref} />
      )) as ComponentType<P>;
      FinalComponent.displayName = ComposedComponent.displayName;
    }

    // Skip memoization if requested
    if (!skipMemoization) {
      FinalComponent = React.memo(FinalComponent);
      FinalComponent.displayName = ComposedComponent.displayName;
    }

    return FinalComponent;
  };
}

// TODO: Implement Render Optimization Utilities
interface RenderTrackerProps {
  name: string;
  children: ReactNode;
  logLevel?: 'debug' | 'info' | 'warn';
  trackProps?: boolean;
}

function RenderTracker({ name, children, logLevel = 'debug', trackProps = false }: RenderTrackerProps) {
  // TODO: Implement render tracking for performance monitoring
  // Track component render frequency and timing
  // Log render causes and prop changes
  // Support different log levels
  // Integrate with performance monitoring systems
  
  const renderCount = useRef(0);
  const lastRender = useRef(Date.now());
  const lastProps = useRef<any>(null);
  
  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRender.current;
    lastRender.current = now;
    
    if (trackProps && lastProps.current) {
      const propsChanged = Object.keys({ name, children, logLevel, trackProps }).some(
        key => lastProps.current[key] !== ({ name, children, logLevel, trackProps } as any)[key]
      );
      
      if (propsChanged && logLevel !== 'debug') {
        console[logLevel](`${name} rendered (#${renderCount.current}) - Props changed - ${timeSinceLastRender}ms since last render`);
      }
    }
    
    if (logLevel === 'debug') {
      console.debug(`${name} rendered (#${renderCount.current}) - ${timeSinceLastRender}ms since last render`);
    }
  });
  
  lastProps.current = { name, children, logLevel, trackProps };
  
  return <>{children}</>;
}

// TODO: Implement Conditional Rendering Composition
interface ConditionalProps {
  when: boolean | (() => boolean);
  children: ReactNode;
  fallback?: ReactNode;
  animate?: boolean;
}

function Conditional({ when, children, fallback = null, animate = false }: ConditionalProps) {
  // TODO: Implement conditional rendering with animation support
  // Support function-based conditions
  // Handle animation transitions
  // Provide fallback content
  // Optimize re-renders
  
  const [shouldRender, setShouldRender] = useState(() => 
    typeof when === 'function' ? when() : when
  );
  
  useEffect(() => {
    const newCondition = typeof when === 'function' ? when() : when;
    setShouldRender(newCondition);
  }, [when]);
  
  if (animate) {
    return (
      <div className={`transition-opacity duration-300 ${shouldRender ? 'opacity-100' : 'opacity-0'}`}>
        {shouldRender ? children : fallback}
      </div>
    );
  }
  
  return <>{shouldRender ? children : fallback}</>;
}

// TODO: Implement Slot-based Composition System
interface SlotContextValue {
  slots: Map<string, ReactNode>;
  setSlot: (name: string, content: ReactNode) => void;
  removeSlot: (name: string) => void;
  hasSlot: (name: string) => boolean;
}

const SlotContext = createContext<SlotContextValue | null>(null);

const useSlotContext = () => {
  const context = useContext(SlotContext);
  if (!context) {
    throw new Error('Slot components must be used within a SlotProvider');
  }
  return context;
};

interface SlotProviderProps {
  children: ReactNode;
}

function SlotProvider({ children }: SlotProviderProps) {
  // TODO: Implement slot-based composition provider
  // Manage named slots for flexible content placement
  // Support dynamic slot registration and removal
  // Handle slot content updates and re-rendering
  
  const [slots, setSlots] = useState<Map<string, ReactNode>>(new Map());
  
  const setSlot = useCallback((name: string, content: ReactNode) => {
    setSlots(prev => new Map(prev).set(name, content));
  }, []);
  
  const removeSlot = useCallback((name: string) => {
    setSlots(prev => {
      const newSlots = new Map(prev);
      newSlots.delete(name);
      return newSlots;
    });
  }, []);
  
  const hasSlot = useCallback((name: string) => {
    return slots.has(name);
  }, [slots]);
  
  const contextValue: SlotContextValue = useMemo(() => ({
    slots,
    setSlot,
    removeSlot,
    hasSlot
  }), [slots, setSlot, removeSlot, hasSlot]);
  
  return (
    <SlotContext.Provider value={contextValue}>
      {children}
    </SlotContext.Provider>
  );
}

interface SlotProps {
  name: string;
  children?: ReactNode;
  fallback?: ReactNode;
}

function Slot({ name, children, fallback = null }: SlotProps) {
  // TODO: Implement slot consumer component
  // Render content registered for named slot
  // Support fallback content when slot is empty
  // Handle slot content updates
  
  const { slots } = useSlotContext();
  const slotContent = slots.get(name);
  
  if (slotContent) {
    return <>{slotContent}</>;
  }
  
  if (children) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

interface SlotFillProps {
  slot: string;
  children: ReactNode;
}

function SlotFill({ slot, children }: SlotFillProps) {
  // TODO: Implement slot fill component
  // Register content for named slot
  // Handle component mount/unmount
  // Update slot content dynamically
  
  const { setSlot, removeSlot } = useSlotContext();
  
  useEffect(() => {
    setSlot(slot, children);
    return () => removeSlot(slot);
  }, [slot, children, setSlot, removeSlot]);
  
  return null; // This component doesn't render anything itself
}

// TODO: Implement Compound Component with Composition
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: Map<string, { label: string; content: ReactNode }>;
  registerTab: (id: string, label: string, content: ReactNode) => void;
  unregisterTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

interface TabsProps {
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'pills' | 'underline';
}

function Tabs({ 
  defaultTab, 
  activeTab: controlledActiveTab, 
  onTabChange,
  children,
  orientation = 'horizontal',
  variant = 'default' 
}: TabsProps) {
  // TODO: Implement compound tabs component
  // Support controlled and uncontrolled modes
  // Handle tab registration and content management
  // Provide flexible styling variants
  
  const [tabs, setTabs] = useState<Map<string, { label: string; content: ReactNode }>>(new Map());
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || '');
  
  const isControlled = controlledActiveTab !== undefined;
  const activeTab = isControlled ? controlledActiveTab : internalActiveTab;
  
  const setActiveTab = useCallback((tab: string) => {
    if (!isControlled) {
      setInternalActiveTab(tab);
    }
    onTabChange?.(tab);
  }, [isControlled, onTabChange]);
  
  const registerTab = useCallback((id: string, label: string, content: ReactNode) => {
    setTabs(prev => new Map(prev).set(id, { label, content }));
    
    // Set as active if it's the first tab and no default is set
    if (!activeTab && tabs.size === 0) {
      if (!isControlled) {
        setInternalActiveTab(id);
      }
    }
  }, [activeTab, tabs.size, isControlled]);
  
  const unregisterTab = useCallback((id: string) => {
    setTabs(prev => {
      const newTabs = new Map(prev);
      newTabs.delete(id);
      return newTabs;
    });
  }, []);
  
  const contextValue: TabsContextValue = useMemo(() => ({
    activeTab,
    setActiveTab,
    tabs,
    registerTab,
    unregisterTab
  }), [activeTab, setActiveTab, tabs, registerTab, unregisterTab]);
  
  return (
    <TabsContext.Provider value={contextValue}>
      <div className={`tabs tabs-${orientation} tabs-${variant}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabList({ children, ...props }: { children: ReactNode }) {
  // TODO: Implement tab list component
  // Render tab buttons with proper styling
  // Handle keyboard navigation
  // Support accessibility attributes
  
  const { tabs, activeTab, setActiveTab } = useTabsContext();
  
  return (
    <div role="tablist" className="tab-list flex space-x-2 border-b border-gray-200" {...props}>
      {Array.from(tabs.entries()).map(([id, { label }]) => (
        <button
          key={id}
          role="tab"
          tabIndex={activeTab === id ? 0 : -1}
          aria-selected={activeTab === id}
          className={`tab-button px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === id
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
          }`}
          onClick={() => setActiveTab(id)}
        >
          {label}
        </button>
      ))}
      {children}
    </div>
  );
}

function TabPanels({ children, ...props }: { children: ReactNode }) {
  // TODO: Implement tab panels component
  // Render active tab content
  // Handle content switching
  // Support lazy loading
  
  const { tabs, activeTab } = useTabsContext();
  const activeContent = tabs.get(activeTab);
  
  return (
    <div className="tab-panels mt-4" {...props}>
      <div 
        role="tabpanel" 
        tabIndex={0}
        className="tab-panel focus:outline-none"
      >
        {activeContent?.content}
      </div>
      {children}
    </div>
  );
}

function TabPanel({ 
  id, 
  label, 
  children, 
  lazy = false 
}: { 
  id: string; 
  label: string; 
  children: ReactNode; 
  lazy?: boolean;
}) {
  // TODO: Implement individual tab panel
  // Register with tabs context
  // Support lazy loading
  // Handle mount/unmount lifecycle
  
  const { registerTab, unregisterTab, activeTab } = useTabsContext();
  const hasBeenActive = useRef(false);
  
  useEffect(() => {
    if (activeTab === id) {
      hasBeenActive.current = true;
    }
  }, [activeTab, id]);
  
  useEffect(() => {
    const content = lazy && !hasBeenActive.current ? null : children;
    registerTab(id, label, content);
    
    return () => unregisterTab(id);
  }, [id, label, children, lazy, registerTab, unregisterTab]);
  
  return null; // Content is managed by the context
}

// Attach sub-components
Tabs.List = TabList;
Tabs.Panels = TabPanels;
Tabs.Panel = TabPanel;

// TODO: Implement demo data and examples
interface DemoUser {
  id: string;
  name: string;
  role: 'admin' | 'user' | 'moderator';
  avatar: string;
}

const demoUsers: DemoUser[] = [
  { id: '1', name: 'Alice Johnson', role: 'admin', avatar: '👩‍💼' },
  { id: '2', name: 'Bob Smith', role: 'user', avatar: '👨‍💻' },
  { id: '3', name: 'Carol Davis', role: 'moderator', avatar: '👩‍🔧' },
];

// Export all components for testing
export { 
  Layout, 
  ProviderComposer, 
  composeHOCs, 
  SlotProvider, 
  Slot, 
  SlotFill, 
  Tabs, 
  RenderTracker, 
  Conditional 
};

// TODO: Implement demo component showcasing composition patterns
export default function ComponentCompositionDemo() {
  const [selectedPattern, setSelectedPattern] = useState<'layout' | 'providers' | 'hocs' | 'slots' | 'compound'>('layout');
  const [debugMode, setDebugMode] = useState(false);
  
  // Provider composition example
  const providers = [
    { Provider: SlotProvider, props: {} },
    { 
      Provider: Layout, 
      props: { 
        direction: 'vertical' as const, 
        spacing: 6, 
        className: 'min-h-screen bg-gray-50 p-6' 
      } 
    }
  ];
  
  return (
    <ProviderComposer providers={providers}>
      <div className="container mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Advanced Component Composition
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Master enterprise-level composition patterns: layouts, providers, HOCs, slots, and compound components.
            Learn composition over inheritance and advanced architectural patterns.
          </p>
        </div>

        {/* Debug mode toggle */}
        <div className="flex justify-center">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="rounded"
            />
            <span>Debug Mode</span>
          </label>
        </div>

        {/* Pattern selector */}
        <div className="flex justify-center space-x-4">
          {(['layout', 'providers', 'hocs', 'slots', 'compound'] as const).map(pattern => (
            <button
              key={pattern}
              onClick={() => setSelectedPattern(pattern)}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedPattern === pattern
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
            </button>
          ))}
        </div>

        {/* Demo content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <RenderTracker name={`${selectedPattern}-demo`} trackProps={debugMode}>
            <p className="text-gray-600 mb-4">
              TODO: Implement comprehensive examples showcasing:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Layout System:</strong> Flexible composition with intelligent spacing and alignment</li>
              <li><strong>Provider Composition:</strong> Reduce nesting with provider composition utilities</li>
              <li><strong>HOC Composition:</strong> Chain multiple HOCs with performance optimization</li>
              <li><strong>Slot System:</strong> Named content placement with fallback support</li>
              <li><strong>Compound Components:</strong> Complex tab system with flexible composition</li>
            </ul>
            
            {selectedPattern === 'layout' && (
              <Layout direction="horizontal" spacing={4} debug={debugMode} className="mt-6 p-4 border rounded">
                <Layout.Item flex={1}>
                  <div className="bg-blue-100 p-4 rounded">Flexible Item 1</div>
                </Layout.Item>
                <Layout.Item flex={2}>
                  <div className="bg-green-100 p-4 rounded">Flexible Item 2 (2x)</div>
                </Layout.Item>
                <Layout.Item>
                  <div className="bg-yellow-100 p-4 rounded">Fixed Item</div>
                </Layout.Item>
              </Layout>
            )}
            
            {selectedPattern === 'compound' && (
              <Tabs defaultTab="composition" className="mt-6">
                <Tabs.List />
                <Tabs.Panels />
                <Tabs.Panel id="composition" label="Composition">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Composition Patterns</h3>
                    <p>Learn how to compose components effectively for maximum reusability.</p>
                  </div>
                </Tabs.Panel>
                <Tabs.Panel id="performance" label="Performance">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Performance Optimization</h3>
                    <p>Optimize rendering and prevent unnecessary re-renders in composed components.</p>
                  </div>
                </Tabs.Panel>
                <Tabs.Panel id="patterns" label="Patterns">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Advanced Patterns</h3>
                    <p>Explore slots, providers, and other advanced composition patterns.</p>
                  </div>
                </Tabs.Panel>
              </Tabs>
            )}
            
            {selectedPattern === 'slots' && (
              <div className="mt-6 space-y-4">
                <SlotFill slot="header">
                  <div className="bg-blue-500 text-white p-4 rounded-t">Dynamic Header Content</div>
                </SlotFill>
                <SlotFill slot="sidebar">
                  <div className="bg-gray-200 p-4">Sidebar Content</div>
                </SlotFill>
                
                <div className="border rounded">
                  <Slot name="header" fallback={<div className="bg-gray-100 p-4">Default Header</div>} />
                  <div className="flex">
                    <div className="flex-1 p-4">
                      <h3 className="font-semibold">Main Content</h3>
                      <p>This demonstrates slot-based composition.</p>
                    </div>
                    <div className="w-64 border-l">
                      <Slot name="sidebar" fallback={<div className="p-4 text-gray-500">No sidebar</div>} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </RenderTracker>
        </div>
      </div>
    </ProviderComposer>
  );
}