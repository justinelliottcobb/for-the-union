import React, { useState, useContext, createContext, useRef, useEffect, useCallback, cloneElement, isValidElement } from 'react';
import { createPortal } from 'react-dom';

// Compound component types
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  orientation: 'horizontal' | 'vertical';
  variant: 'default' | 'pills' | 'underline';
}

interface AccordionContextValue {
  activeItems: Set<string>;
  toggleItem: (itemId: string) => void;
  allowMultiple: boolean;
  variant: 'default' | 'bordered' | 'filled';
}

interface ModalContextValue {
  isOpen: boolean;
  onClose: () => void;
  closeOnOverlayClick: boolean;
  closeOnEscape: boolean;
}

// Generic compound component utilities
interface CompoundComponentProps {
  children: React.ReactNode;
  className?: string;
}

interface WithDisplayName {
  displayName?: string;
}

// Tabs Context and Hook
const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

// Tabs compound component implementation
interface TabsProps extends CompoundComponentProps {
  defaultActiveTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'pills' | 'underline';
}

function Tabs({
  children,
  defaultActiveTab,
  activeTab: controlledActiveTab,
  onTabChange,
  orientation = 'horizontal',
  variant = 'default',
  className = ''
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultActiveTab || '');
  
  const activeTab = controlledActiveTab ?? internalActiveTab;
  
  const setActiveTab = useCallback((tabId: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  }, [controlledActiveTab, onTabChange]);

  const contextValue: TabsContextValue = {
    activeTab,
    setActiveTab,
    orientation,
    variant,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={`tabs tabs--${orientation} tabs--${variant} ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// TabList component with keyboard navigation
interface TabListProps extends CompoundComponentProps {
  'aria-label'?: string;
}

function TabList({ children, className = '', 'aria-label': ariaLabel }: TabListProps) {
  const context = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const tabs = listRef.current?.querySelectorAll('[role="tab"]:not([disabled])') || [];
    const currentIndex = Array.from(tabs).findIndex(tab => tab === event.target);
    
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = context.orientation === 'horizontal' 
          ? (currentIndex + 1) % tabs.length
          : currentIndex + 1 < tabs.length ? currentIndex + 1 : currentIndex;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = context.orientation === 'horizontal'
          ? (currentIndex - 1 + tabs.length) % tabs.length
          : currentIndex > 0 ? currentIndex - 1 : currentIndex;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    
    (tabs[nextIndex] as HTMLElement)?.focus();
  }, [context.orientation]);

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation={context.orientation}
      className={`tab-list tab-list--${context.orientation} tab-list--${context.variant} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}

// Tab component
interface TabProps extends CompoundComponentProps {
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

function Tab({ children, value, disabled = false, icon, className = '' }: TabProps) {
  const context = useTabsContext();
  const isActive = context.activeTab === value;

  const handleClick = useCallback(() => {
    if (!disabled) {
      context.setActiveTab(value);
    }
  }, [value, disabled, context]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault();
      context.setActiveTab(value);
    }
  }, [value, disabled, context]);

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
      disabled={disabled}
      tabIndex={isActive ? 0 : -1}
      className={`tab ${isActive ? 'tab--active' : ''} ${disabled ? 'tab--disabled' : ''} tab--${context.variant} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {icon && <span className="tab__icon">{icon}</span>}
      <span className="tab__label">{children}</span>
    </button>
  );
}

// TabPanels component
function TabPanels({ children, className = '' }: CompoundComponentProps) {
  const context = useTabsContext();

  return (
    <div className={`tab-panels ${className}`}>
      {React.Children.map(children, (child) => {
        if (isValidElement(child) && child.props.value === context.activeTab) {
          return child;
        }
        return null;
      })}
    </div>
  );
}

// TabPanel component
interface TabPanelProps extends CompoundComponentProps {
  value: string;
  forceMount?: boolean;
}

function TabPanel({ children, value, forceMount = false, className = '' }: TabPanelProps) {
  const context = useTabsContext();
  const isActive = context.activeTab === value;

  if (!isActive && !forceMount) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      hidden={!isActive}
      className={`tab-panel ${isActive ? 'tab-panel--active' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// Create compound component with sub-components
Tabs.TabList = TabList;
Tabs.Tab = Tab;
Tabs.TabPanels = TabPanels;
Tabs.TabPanel = TabPanel;

// Accordion Context and Hook
const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion provider');
  }
  return context;
}

// Accordion compound component implementation
interface AccordionProps extends CompoundComponentProps {
  allowMultiple?: boolean;
  defaultItems?: string[];
  items?: string[];
  onItemsChange?: (items: string[]) => void;
  variant?: 'default' | 'bordered' | 'filled';
}

function Accordion({
  children,
  allowMultiple = false,
  defaultItems = [],
  items: controlledItems,
  onItemsChange,
  variant = 'default',
  className = ''
}: AccordionProps) {
  const [internalItems, setInternalItems] = useState(new Set(defaultItems));
  
  const activeItems = controlledItems ? new Set(controlledItems) : internalItems;

  const toggleItem = useCallback((itemId: string) => {
    const newItems = new Set(activeItems);
    
    if (newItems.has(itemId)) {
      newItems.delete(itemId);
    } else {
      if (!allowMultiple) {
        newItems.clear();
      }
      newItems.add(itemId);
    }
    
    if (controlledItems === undefined) {
      setInternalItems(newItems);
    }
    
    onItemsChange?.(Array.from(newItems));
  }, [activeItems, allowMultiple, controlledItems, onItemsChange]);

  const contextValue: AccordionContextValue = {
    activeItems,
    toggleItem,
    allowMultiple,
    variant,
  };

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={`accordion accordion--${variant} ${className}`}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

// AccordionItem component with context for its children
interface AccordionItemProps extends CompoundComponentProps {
  value: string;
  disabled?: boolean;
}

const AccordionItemContext = createContext<{ value: string; disabled: boolean } | null>(null);

function AccordionItem({ children, value, disabled = false, className = '' }: AccordionItemProps) {
  const context = useAccordionContext();
  const isActive = context.activeItems.has(value);

  const itemContextValue = { value, disabled };

  return (
    <AccordionItemContext.Provider value={itemContextValue}>
      <div className={`accordion-item ${isActive ? 'accordion-item--active' : ''} ${disabled ? 'accordion-item--disabled' : ''} accordion-item--${context.variant} ${className}`}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

// AccordionTrigger component
interface AccordionTriggerProps extends CompoundComponentProps {
  icon?: React.ReactNode;
}

function AccordionTrigger({ children, icon, className = '' }: AccordionTriggerProps) {
  const accordionContext = useAccordionContext();
  const itemContext = useContext(AccordionItemContext);
  
  if (!itemContext) {
    throw new Error('AccordionTrigger must be used within an AccordionItem');
  }

  const { value, disabled } = itemContext;
  const isActive = accordionContext.activeItems.has(value);

  const handleClick = useCallback(() => {
    if (!disabled) {
      accordionContext.toggleItem(value);
    }
  }, [value, disabled, accordionContext]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault();
      accordionContext.toggleItem(value);
    }
  }, [value, disabled, accordionContext]);

  return (
    <button
      className={`accordion-trigger ${isActive ? 'accordion-trigger--active' : ''} ${disabled ? 'accordion-trigger--disabled' : ''} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-expanded={isActive}
      aria-controls={`accordion-content-${value}`}
      id={`accordion-trigger-${value}`}
    >
      <span className="accordion-trigger__content">{children}</span>
      <span className={`accordion-trigger__icon ${isActive ? 'accordion-trigger__icon--active' : ''}`}>
        {icon || '▼'}
      </span>
    </button>
  );
}

// AccordionContent component with smooth animations
interface AccordionContentProps extends CompoundComponentProps {
  forceMount?: boolean;
}

function AccordionContent({ children, forceMount = false, className = '' }: AccordionContentProps) {
  const accordionContext = useAccordionContext();
  const itemContext = useContext(AccordionItemContext);
  
  if (!itemContext) {
    throw new Error('AccordionContent must be used within an AccordionItem');
  }

  const { value } = itemContext;
  const isActive = accordionContext.activeItems.has(value);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    if (isActive) {
      element.style.height = 'auto';
      const height = element.scrollHeight;
      element.style.height = '0px';
      element.offsetHeight; // Force reflow
      element.style.height = `${height}px`;
    } else {
      element.style.height = `${element.scrollHeight}px`;
      element.offsetHeight; // Force reflow
      element.style.height = '0px';
    }
  }, [isActive]);

  if (!isActive && !forceMount) {
    return null;
  }

  return (
    <div
      ref={contentRef}
      id={`accordion-content-${value}`}
      aria-labelledby={`accordion-trigger-${value}`}
      className={`accordion-content ${isActive ? 'accordion-content--active' : ''} ${className}`}
      style={{
        overflow: 'hidden',
        transition: 'height 0.2s ease-in-out',
        height: isActive ? 'auto' : '0px'
      }}
    >
      <div className="accordion-content__inner">
        {children}
      </div>
    </div>
  );
}

// Create compound component with sub-components
Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;

// Modal Context and Hook
const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal components must be used within a Modal provider');
  }
  return context;
}

// Modal compound component implementation
interface ModalProps extends CompoundComponentProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
}

function Modal({
  children,
  open = false,
  onOpenChange,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  size = 'medium',
  className = ''
}: ModalProps) {
  const lastActiveElementRef = useRef<Element | null>(null);

  const onClose = useCallback(() => {
    onOpenChange?.(false);
  }, [onOpenChange]);

  const contextValue: ModalContextValue = {
    isOpen: open,
    onClose,
    closeOnOverlayClick,
    closeOnEscape,
  };

  // Handle escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closeOnEscape, onClose]);

  // Handle focus management
  useEffect(() => {
    if (open) {
      lastActiveElementRef.current = document.activeElement;
      // Focus first focusable element in modal
      const modal = document.querySelector('[data-modal="true"]');
      const firstFocusable = modal?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      (firstFocusable as HTMLElement)?.focus();
    } else {
      // Restore focus to last active element
      (lastActiveElementRef.current as HTMLElement)?.focus();
    }
  }, [open]);

  // Handle scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <ModalContext.Provider value={contextValue}>
      <div className={`modal-overlay modal-overlay--${size} ${className}`} data-modal="true">
        {children}
      </div>
    </ModalContext.Provider>,
    document.body
  );
}

// ModalContent component
function ModalContent({ children, className = '' }: CompoundComponentProps) {
  const context = useModalContext();

  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && context.closeOnOverlayClick) {
      context.onClose();
    }
  }, [context]);

  const handleContentClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  return (
    <div className="modal-backdrop" onClick={handleOverlayClick}>
      <div 
        className={`modal-content ${className}`}
        onClick={handleContentClick}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

// ModalHeader component
function ModalHeader({ children, className = '' }: CompoundComponentProps) {
  return (
    <header className={`modal-header ${className}`}>
      {children}
    </header>
  );
}

// ModalBody component
function ModalBody({ children, className = '' }: CompoundComponentProps) {
  return (
    <div className={`modal-body ${className}`}>
      {children}
    </div>
  );
}

// ModalFooter component
function ModalFooter({ children, className = '' }: CompoundComponentProps) {
  return (
    <footer className={`modal-footer ${className}`}>
      {children}
    </footer>
  );
}

// ModalCloseButton component
interface ModalCloseButtonProps extends CompoundComponentProps {
  'aria-label'?: string;
}

function ModalCloseButton({ children, className = '', 'aria-label': ariaLabel = 'Close modal' }: ModalCloseButtonProps) {
  const context = useModalContext();

  const handleClick = useCallback(() => {
    context.onClose();
  }, [context]);

  return (
    <button
      className={`modal-close ${className}`}
      onClick={handleClick}
      aria-label={ariaLabel}
      type="button"
    >
      {children || '×'}
    </button>
  );
}

// Create compound component with sub-components
Modal.Content = ModalContent;
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.CloseButton = ModalCloseButton;

// Generic compound component utilities
interface CompoundComponentConfig<T = {}> {
  displayName: string;
  defaultProps?: Partial<T>;
  subComponents?: Record<string, React.ComponentType<any>>;
}

function createCompoundComponent<T extends CompoundComponentProps>(
  Component: React.ComponentType<T>,
  config: CompoundComponentConfig<T>
) {
  Component.displayName = config.displayName;

  if (config.defaultProps) {
    Component.defaultProps = config.defaultProps;
  }

  if (config.subComponents) {
    Object.entries(config.subComponents).forEach(([key, SubComponent]) => {
      (Component as any)[key] = SubComponent;
    });
  }

  return Component;
}

// Validation utilities for compound components
function validateCompoundChildren(
  children: React.ReactNode,
  allowedTypes: string[]
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    const displayName = (child.type as any)?.displayName;
    if (displayName && !allowedTypes.includes(displayName)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Invalid child component: ${displayName}. Allowed types: ${allowedTypes.join(', ')}`);
      }
    }

    return child;
  });
}

// Enhanced Children utilities
function enhanceChildren(
  children: React.ReactNode,
  enhancements: Record<string, any>
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    return cloneElement(child, { ...enhancements, ...child.props });
  });
}

// Demo component for testing compound components
export default function CompoundComponentsDemo() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [accordionItems, setAccordionItems] = useState(['faq1']);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [tabVariant, setTabVariant] = useState<'default' | 'pills' | 'underline'>('default');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Compound Components Pattern
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Master compound component patterns with Tabs, Accordion, and Modal examples.
            Learn flexible APIs, context sharing, and TypeScript generic constraints.
          </p>
        </div>

        {/* Tabs Example */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Tabs Component</h2>
            <div className="flex gap-2">
              <select 
                value={orientation} 
                onChange={(e) => setOrientation(e.target.value as any)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
              <select 
                value={tabVariant} 
                onChange={(e) => setTabVariant(e.target.value as any)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="default">Default</option>
                <option value="pills">Pills</option>
                <option value="underline">Underline</option>
              </select>
            </div>
          </div>
          
          <Tabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            orientation={orientation}
            variant={tabVariant}
          >
            <Tabs.TabList aria-label="Dashboard navigation">
              <Tabs.Tab value="dashboard" icon="📊">
                Dashboard
              </Tabs.Tab>
              <Tabs.Tab value="analytics" icon="📈">
                Analytics
              </Tabs.Tab>
              <Tabs.Tab value="settings" icon="⚙️">
                Settings
              </Tabs.Tab>
              <Tabs.Tab value="profile" icon="👤" disabled>
                Profile (Disabled)
              </Tabs.Tab>
            </Tabs.TabList>

            <Tabs.TabPanels>
              <Tabs.TabPanel value="dashboard">
                <div className="p-6 border rounded-lg bg-blue-50">
                  <h3 className="text-xl font-semibold mb-3 text-blue-800">Dashboard</h3>
                  <p className="text-blue-700 mb-4">
                    Welcome to your dashboard! Here you can view key metrics and recent activity.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded border">
                      <div className="text-2xl font-bold text-blue-600">1,234</div>
                      <div className="text-sm text-gray-600">Total Users</div>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <div className="text-2xl font-bold text-green-600">$45,678</div>
                      <div className="text-sm text-gray-600">Revenue</div>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <div className="text-2xl font-bold text-purple-600">89%</div>
                      <div className="text-sm text-gray-600">Satisfaction</div>
                    </div>
                  </div>
                </div>
              </Tabs.TabPanel>
              
              <Tabs.TabPanel value="analytics">
                <div className="p-6 border rounded-lg bg-green-50">
                  <h3 className="text-xl font-semibold mb-3 text-green-800">Analytics</h3>
                  <p className="text-green-700 mb-4">
                    Detailed analytics and insights about your application performance.
                  </p>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium mb-2">Page Views</h4>
                      <div className="h-4 bg-gray-200 rounded">
                        <div className="h-4 bg-green-500 rounded" style={{ width: '78%' }}></div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">78% increase from last month</div>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium mb-2">User Engagement</h4>
                      <div className="h-4 bg-gray-200 rounded">
                        <div className="h-4 bg-blue-500 rounded" style={{ width: '65%' }}></div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">65% average session duration</div>
                    </div>
                  </div>
                </div>
              </Tabs.TabPanel>
              
              <Tabs.TabPanel value="settings">
                <div className="p-6 border rounded-lg bg-purple-50">
                  <h3 className="text-xl font-semibold mb-3 text-purple-800">Settings</h3>
                  <p className="text-purple-700 mb-4">
                    Configure your application preferences and account settings.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <span className="font-medium">Email Notifications</span>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="font-medium">Dark Mode</span>
                      <input type="checkbox" className="rounded" />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="font-medium">Auto-save</span>
                      <input type="checkbox" className="rounded" defaultChecked />
                    </div>
                  </div>
                </div>
              </Tabs.TabPanel>
              
              <Tabs.TabPanel value="profile">
                <div className="p-6 border rounded-lg bg-gray-50">
                  <h3 className="text-xl font-semibold mb-3">Profile</h3>
                  <p className="text-gray-600">This tab is disabled and should not be accessible.</p>
                </div>
              </Tabs.TabPanel>
            </Tabs.TabPanels>
          </Tabs>
        </div>

        {/* Accordion Example */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Accordion Component</h2>
          
          <Accordion 
            items={accordionItems}
            onItemsChange={setAccordionItems}
            allowMultiple={true}
            variant="default"
          >
            <Accordion.Item value="faq1">
              <Accordion.Trigger>
                What is a compound component pattern?
              </Accordion.Trigger>
              <Accordion.Content>
                <div className="p-4 bg-blue-50 rounded">
                  <p className="text-blue-800 mb-3">
                    A compound component is a pattern where multiple components work together
                    to form a complete UI element. The parent component manages state and 
                    provides context to its children.
                  </p>
                  <p className="text-blue-700">
                    This pattern provides flexibility and composability while maintaining
                    a clean, intuitive API for developers.
                  </p>
                </div>
              </Accordion.Content>
            </Accordion.Item>

            <Accordion.Item value="faq2">
              <Accordion.Trigger icon="🔧">
                How does context sharing work in compound components?
              </Accordion.Trigger>
              <Accordion.Content>
                <div className="p-4 bg-green-50 rounded">
                  <p className="text-green-800 mb-3">
                    Context sharing allows parent components to pass state and functions
                    to deeply nested children without prop drilling. This creates a clean,
                    flexible API for compound components.
                  </p>
                  <div className="bg-white p-3 rounded border mt-3">
                    <code className="text-sm text-gray-700">
                      const context = useContext(ComponentContext);
                    </code>
                  </div>
                </div>
              </Accordion.Content>
            </Accordion.Item>

            <Accordion.Item value="faq3">
              <Accordion.Trigger icon="⚡">
                What are the main benefits of this pattern?
              </Accordion.Trigger>
              <Accordion.Content>
                <div className="p-4 bg-purple-50 rounded">
                  <ul className="list-disc list-inside space-y-2 text-purple-800">
                    <li>Flexible composition with intuitive APIs</li>
                    <li>Encapsulated state management</li>
                    <li>Improved developer experience</li>
                    <li>Better TypeScript integration</li>
                    <li>Reusable patterns across applications</li>
                  </ul>
                </div>
              </Accordion.Content>
            </Accordion.Item>

            <Accordion.Item value="faq4" disabled>
              <Accordion.Trigger>
                Disabled Accordion Item
              </Accordion.Trigger>
              <Accordion.Content>
                This content should not be accessible since the item is disabled.
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </div>

        {/* Modal Example */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Modal Component</h2>
          
          <div className="flex gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Open Modal
            </button>
          </div>

          <Modal 
            open={modalOpen}
            onOpenChange={setModalOpen}
            closeOnOverlayClick={true}
            closeOnEscape={true}
            size="medium"
          >
            <Modal.Content>
              <Modal.Header>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Compound Component Modal
                  </h3>
                  <Modal.CloseButton className="text-gray-400 hover:text-gray-600" />
                </div>
              </Modal.Header>
              
              <Modal.Body>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    This modal demonstrates the compound component pattern with proper
                    focus management, keyboard navigation, and accessibility features.
                  </p>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Key Features:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Portal rendering to document.body</li>
                      <li>• Escape key handling</li>
                      <li>• Overlay click to close</li>
                      <li>• Focus trap and management</li>
                      <li>• Scroll lock when open</li>
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Test focus management..."
                      className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                      Button
                    </button>
                  </div>
                </div>
              </Modal.Body>
              
              <Modal.Footer>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </Modal.Footer>
            </Modal.Content>
          </Modal>
        </div>

        {/* Pattern explanation */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            Compound Component Pattern Benefits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-blue-700">Design Benefits</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Flexible composition with React.Children utilities</li>
                <li>• Context sharing eliminates prop drilling</li>
                <li>• Clean separation of concerns and responsibilities</li>
                <li>• Intuitive, declarative component APIs</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-purple-700">Developer Benefits</h4>
              <ul className="text-sm text-purple-600 space-y-1">
                <li>• TypeScript generics provide excellent type safety</li>
                <li>• Enhanced IntelliSense and autocompletion</li>
                <li>• Reusable patterns across different applications</li>
                <li>• Improved maintainability and extensibility</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .tabs {
          display: flex;
          gap: 1rem;
        }
        .tabs--vertical {
          flex-direction: row;
        }
        .tabs--horizontal {
          flex-direction: column;
        }

        .tab-list {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }
        .tab-list--vertical {
          flex-direction: column;
          border-bottom: none;
          border-right: 1px solid #e5e7eb;
          min-width: 200px;
        }
        .tab-list--horizontal {
          flex-direction: row;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }
        .tab:hover:not(.tab--disabled) {
          background-color: #f3f4f6;
        }
        .tab--active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }
        .tab--disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tab-list--pills .tab {
          border-radius: 0.5rem;
          border-bottom: none;
        }
        .tab-list--pills .tab--active {
          background-color: #3b82f6;
          color: white;
        }

        .tab-list--underline .tab {
          border-bottom: 2px solid transparent;
        }
        .tab-list--underline .tab--active {
          border-bottom-color: #3b82f6;
        }

        .tab-panels {
          flex: 1;
        }

        .tab-panel {
          display: none;
        }
        .tab-panel--active {
          display: block;
        }

        .accordion {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .accordion-item {
          border-bottom: 1px solid #e5e7eb;
        }
        .accordion-item:last-child {
          border-bottom: none;
        }

        .accordion-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background-color 0.2s;
        }
        .accordion-trigger:hover:not(.accordion-trigger--disabled) {
          background-color: #f9fafb;
        }
        .accordion-trigger--disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .accordion-trigger__icon {
          transition: transform 0.2s;
        }
        .accordion-trigger__icon--active {
          transform: rotate(180deg);
        }

        .accordion-content {
          overflow: hidden;
        }

        .accordion-content__inner {
          padding: 0 1rem 1rem 1rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-backdrop {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          animation: slideIn 0.2s ease-out;
        }

        .modal-overlay--small .modal-content { max-width: 400px; }
        .modal-overlay--large .modal-content { max-width: 800px; }
        .modal-overlay--fullscreen .modal-content { 
          max-width: 95vw; 
          max-height: 95vh; 
          width: 95vw;
          height: 95vh;
        }

        .modal-header {
          padding: 1.5rem 1.5rem 0 1.5rem;
        }

        .modal-body {
          padding: 1.5rem;
          max-height: 60vh;
          overflow-y: auto;
        }

        .modal-footer {
          padding: 0 1.5rem 1.5rem 1.5rem;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}