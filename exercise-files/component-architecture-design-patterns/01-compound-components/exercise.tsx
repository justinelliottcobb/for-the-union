import React, { useState, useContext, createContext, useRef, useEffect, useCallback, cloneElement, isValidElement } from 'react';

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

// TODO: Create TabsContext and useTabsContext hook
const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  // TODO: Implement context validation
  // Throw error if used outside Tabs provider
  // Return typed context value
  const context = useContext(TabsContext);
  return context;
}

// TODO: Implement Tabs compound component
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
  // TODO: Implement controlled/uncontrolled state logic
  // Handle defaultActiveTab vs activeTab prop
  // Provide context to children
  // Apply orientation and variant styling

  const [internalActiveTab, setInternalActiveTab] = useState(defaultActiveTab || '');
  
  const activeTab = controlledActiveTab ?? internalActiveTab;
  
  const setActiveTab = useCallback((tabId: string) => {
    // TODO: Handle controlled vs uncontrolled mode
    // Call onTabChange if provided
    // Update internal state if uncontrolled
  }, [controlledActiveTab, onTabChange]);

  const contextValue: TabsContextValue = {
    activeTab,
    setActiveTab,
    orientation,
    variant,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={"tabs " + orientation + " " + variant + " " + className}>
        {/* TODO: Render children with proper context */}
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// TODO: Implement TabList component
interface TabListProps extends CompoundComponentProps {
  'aria-label'?: string;
}

function TabList({ children, className = '', 'aria-label': ariaLabel }: TabListProps) {
  // TODO: Use TabsContext to get orientation and variant
  // Apply proper ARIA attributes
  // Handle keyboard navigation (arrow keys)
  // Style based on orientation and variant

  const context = useTabsContext();
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // TODO: Implement keyboard navigation
    // Arrow keys for tab navigation
    // Home/End for first/last tab
    // Handle orientation (horizontal vs vertical)
  }, []);

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation={context?.orientation}
      className={"tab-list " + (context?.orientation || '') + " " + (context?.variant || '') + " " + className}
      onKeyDown={handleKeyDown}
    >
      {/* TODO: Enhance children with tab functionality */}
      {children}
    </div>
  );
}

// TODO: Implement Tab component
interface TabProps extends CompoundComponentProps {
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

function Tab({ children, value, disabled = false, icon, className = '' }: TabProps) {
  // TODO: Use TabsContext to check if this tab is active
  // Handle click events to change active tab
  // Apply proper ARIA attributes (role, selected, controls)
  // Handle disabled state
  // Support icon + text layout

  const context = useTabsContext();
  const isActive = context?.activeTab === value;

  const handleClick = useCallback(() => {
    // TODO: Activate this tab if not disabled
    // Call context.setActiveTab with this tab's value
  }, [value, disabled, context]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // TODO: Handle Enter and Space to activate tab
  }, []);

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={"tabpanel-" + value}
      disabled={disabled}
      className={"tab " + (isActive ? 'active' : '') + " " + (disabled ? 'disabled' : '') + " " + className}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* TODO: Render icon and children with proper layout */}
      {icon && <span className="tab-icon">{icon}</span>}
      {children}
    </button>
  );
}

// TODO: Implement TabPanels component
function TabPanels({ children, className = '' }: CompoundComponentProps) {
  // TODO: Only render the active tab panel
  // Use TabsContext to determine which panel is active
  // Apply proper CSS classes for styling

  const context = useTabsContext();

  return (
    <div className={"tab-panels " + className}>
      {/* TODO: Filter and render only active panel */}
      {children}
    </div>
  );
}

// TODO: Implement TabPanel component
interface TabPanelProps extends CompoundComponentProps {
  value: string;
  forceMount?: boolean;
}

function TabPanel({ children, value, forceMount = false, className = '' }: TabPanelProps) {
  // TODO: Use TabsContext to check if this panel should be visible
  // Handle forceMount prop for keeping panels in DOM
  // Apply proper ARIA attributes

  const context = useTabsContext();
  const isActive = context?.activeTab === value;

  if (!isActive && !forceMount) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={"tabpanel-" + value}
      aria-labelledby={"tab-" + value}
      hidden={!isActive}
      className={"tab-panel " + (isActive ? 'active' : '') + " " + className}
    >
      {children}
    </div>
  );
}

// TODO: Create compound component with sub-components
Tabs.TabList = TabList;
Tabs.Tab = Tab;
Tabs.TabPanels = TabPanels;
Tabs.TabPanel = TabPanel;

// TODO: Create AccordionContext and useAccordionContext hook
const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  // TODO: Implement context validation
  const context = useContext(AccordionContext);
  return context;
}

// TODO: Implement Accordion compound component
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
  // TODO: Implement controlled/uncontrolled state for active items
  // Handle allowMultiple logic
  // Provide context to children

  const [internalItems, setInternalItems] = useState(new Set(defaultItems));
  
  const activeItems = controlledItems ? new Set(controlledItems) : internalItems;

  const toggleItem = useCallback((itemId: string) => {
    // TODO: Implement toggle logic
    // Handle allowMultiple constraint
    // Update controlled/uncontrolled state
  }, [allowMultiple, controlledItems, onItemsChange]);

  const contextValue: AccordionContextValue = {
    activeItems,
    toggleItem,
    allowMultiple,
    variant,
  };

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={"accordion " + variant + " " + className}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

// TODO: Implement AccordionItem component
interface AccordionItemProps extends CompoundComponentProps {
  value: string;
  disabled?: boolean;
}

function AccordionItem({ children, value, disabled = false, className = '' }: AccordionItemProps) {
  // TODO: Use AccordionContext to check if this item is active
  // Provide item-specific context to children

  const context = useAccordionContext();
  const isActive = context?.activeItems.has(value) || false;

  return (
    <div className={"accordion-item " + (isActive ? 'active' : '') + " " + (disabled ? 'disabled' : '') + " " + className}>
      {children}
    </div>
  );
}

// TODO: Implement AccordionTrigger component
interface AccordionTriggerProps extends CompoundComponentProps {
  icon?: React.ReactNode;
}

function AccordionTrigger({ children, icon, className = '' }: AccordionTriggerProps) {
  // TODO: Handle click to toggle accordion item
  // Apply proper ARIA attributes
  // Show expand/collapse icon

  const handleClick = useCallback(() => {
    // TODO: Toggle the parent AccordionItem
  }, []);

  return (
    <button
      className={"accordion-trigger " + className}
      onClick={handleClick}
    >
      {children}
      {/* TODO: Add expand/collapse icon */}
      <span className="accordion-icon">
        {icon || '▼'}
      </span>
    </button>
  );
}

// TODO: Implement AccordionContent component
interface AccordionContentProps extends CompoundComponentProps {
  forceMount?: boolean;
}

function AccordionContent({ children, forceMount = false, className = '' }: AccordionContentProps) {
  // TODO: Show/hide based on accordion item state
  // Handle forceMount prop
  // Apply smooth animations

  return (
    <div className={"accordion-content " + className}>
      {children}
    </div>
  );
}

// TODO: Create compound component with sub-components
Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;

// TODO: Create ModalContext and useModalContext hook
const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext() {
  // TODO: Implement context validation
  const context = useContext(ModalContext);
  return context;
}

// TODO: Implement Modal compound component
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
  // TODO: Implement modal state management
  // Handle escape key and overlay clicks
  // Manage focus trap and scroll lock
  // Portal rendering for proper z-index

  const onClose = useCallback(() => {
    // TODO: Call onOpenChange with false
  }, [onOpenChange]);

  const contextValue: ModalContextValue = {
    isOpen: open,
    onClose,
    closeOnOverlayClick,
    closeOnEscape,
  };

  // TODO: Handle escape key
  useEffect(() => {
    // TODO: Add/remove escape key listener
  }, [open, closeOnEscape, onClose]);

  if (!open) {
    return null;
  }

  return (
    <ModalContext.Provider value={contextValue}>
      {/* TODO: Portal to document.body */}
      <div className={"modal-overlay " + size + " " + className}>
        {children}
      </div>
    </ModalContext.Provider>
  );
}

// TODO: Implement ModalContent component
function ModalContent({ children, className = '' }: CompoundComponentProps) {
  // TODO: Handle overlay clicks
  // Prevent event bubbling from content
  // Apply proper styling and animations

  const context = useModalContext();

  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    // TODO: Close modal if clicking overlay and closeOnOverlayClick is true
  }, [context]);

  const handleContentClick = useCallback((event: React.MouseEvent) => {
    // TODO: Prevent event bubbling to overlay
  }, []);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div 
        className={"modal-content " + className}
        onClick={handleContentClick}
      >
        {children}
      </div>
    </div>
  );
}

// TODO: Implement ModalHeader component
function ModalHeader({ children, className = '' }: CompoundComponentProps) {
  return (
    <div className={"modal-header " + className}>
      {children}
    </div>
  );
}

// TODO: Implement ModalBody component
function ModalBody({ children, className = '' }: CompoundComponentProps) {
  return (
    <div className={"modal-body " + className}>
      {children}
    </div>
  );
}

// TODO: Implement ModalFooter component
function ModalFooter({ children, className = '' }: CompoundComponentProps) {
  return (
    <div className={"modal-footer " + className}>
      {children}
    </div>
  );
}

// TODO: Implement ModalCloseButton component
interface ModalCloseButtonProps extends CompoundComponentProps {
  'aria-label'?: string;
}

function ModalCloseButton({ children, className = '', 'aria-label': ariaLabel = 'Close modal' }: ModalCloseButtonProps) {
  // TODO: Use modal context to close modal
  const context = useModalContext();

  const handleClick = useCallback(() => {
    // TODO: Call context.onClose()
  }, [context]);

  return (
    <button
      className={"modal-close " + className}
      onClick={handleClick}
      aria-label={ariaLabel}
    >
      {children || '×'}
    </button>
  );
}

// TODO: Create compound component with sub-components
Modal.Content = ModalContent;
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.CloseButton = ModalCloseButton;

// TODO: Implement generic compound component utilities
interface CompoundComponentConfig<T = {}> {
  displayName: string;
  defaultProps?: Partial<T>;
  subComponents?: Record<string, React.ComponentType<any>>;
}

function createCompoundComponent<T extends CompoundComponentProps>(
  Component: React.ComponentType<T>,
  config: CompoundComponentConfig<T>
) {
  // TODO: Enhance component with compound utilities
  // Add displayName and sub-components
  // Provide TypeScript generics support
  // Handle default props merging

  Component.displayName = config.displayName;

  if (config.subComponents) {
    // TODO: Attach sub-components to main component
    Object.entries(config.subComponents).forEach(([key, SubComponent]) => {
      (Component as any)[key] = SubComponent;
    });
  }

  return Component;
}

// TODO: Implement validation utilities for compound components
function validateCompoundChildren(
  children: React.ReactNode,
  allowedTypes: string[]
): React.ReactNode {
  // TODO: Validate that children are correct compound components
  // Warn about invalid children in development
  // Filter out invalid children or throw errors

  return React.Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    // TODO: Check if child is an allowed compound component
    const displayName = (child.type as any)?.displayName;
    if (displayName && !allowedTypes.includes(displayName)) {
      console.warn("Invalid child component: " + displayName);
    }

    return child;
  });
}

// TODO: Implement enhanced Children utilities
function enhanceChildren(
  children: React.ReactNode,
  enhancements: Record<string, any>
): React.ReactNode {
  // TODO: Clone children and add additional props
  // Support function children pattern
  // Maintain component types and refs

  return React.Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    // TODO: Clone element with enhancements
    return cloneElement(child, enhancements);
  });
}

// Demo component for testing compound components
export default function CompoundComponentsDemo() {
  const [activeTab, setActiveTab] = useState('tab1');
  const [modalOpen, setModalOpen] = useState(false);
  const [accordionItems, setAccordionItems] = useState(['item1']);

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
          <h2 className="text-2xl font-semibold mb-4">Tabs Component</h2>
          
          <Tabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            orientation="horizontal"
            variant="default"
          >
            <Tabs.TabList aria-label="Example tabs">
              <Tabs.Tab value="tab1" icon="📊">
                Dashboard
              </Tabs.Tab>
              <Tabs.Tab value="tab2" icon="⚙️">
                Settings
              </Tabs.Tab>
              <Tabs.Tab value="tab3" icon="👤" disabled>
                Profile
              </Tabs.Tab>
            </Tabs.TabList>

            <Tabs.TabPanels>
              <Tabs.TabPanel value="tab1">
                <div className="p-4 border rounded">
                  <h3 className="font-semibold mb-2">Dashboard Content</h3>
                  <p>This is the dashboard tab content with charts and metrics.</p>
                </div>
              </Tabs.TabPanel>
              
              <Tabs.TabPanel value="tab2">
                <div className="p-4 border rounded">
                  <h3 className="font-semibold mb-2">Settings Content</h3>
                  <p>Configure your application settings here.</p>
                </div>
              </Tabs.TabPanel>
              
              <Tabs.TabPanel value="tab3">
                <div className="p-4 border rounded">
                  <h3 className="font-semibold mb-2">Profile Content</h3>
                  <p>Manage your user profile and preferences.</p>
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
            <Accordion.Item value="item1">
              <Accordion.Trigger>
                What is a compound component?
              </Accordion.Trigger>
              <Accordion.Content>
                A compound component is a pattern where multiple components work together
                to form a complete UI element. The parent component manages state and 
                provides context to its children.
              </Accordion.Content>
            </Accordion.Item>

            <Accordion.Item value="item2">
              <Accordion.Trigger>
                How does context sharing work?
              </Accordion.Trigger>
              <Accordion.Content>
                Context sharing allows parent components to pass state and functions
                to deeply nested children without prop drilling. This creates a clean,
                flexible API for compound components.
              </Accordion.Content>
            </Accordion.Item>

            <Accordion.Item value="item3">
              <Accordion.Trigger>
                What are the benefits?
              </Accordion.Trigger>
              <Accordion.Content>
                Compound components provide flexibility, composability, and a clear
                separation of concerns. They create reusable patterns that are easy
                to customize and extend.
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </div>

        {/* Modal Example */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Modal Component</h2>
          
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Open Modal
          </button>

          <Modal 
            open={modalOpen}
            onOpenChange={setModalOpen}
            closeOnOverlayClick={true}
            closeOnEscape={true}
            size="medium"
          >
            <Modal.Content>
              <Modal.Header>
                <h3 className="text-xl font-semibold">Example Modal</h3>
                <Modal.CloseButton />
              </Modal.Header>
              
              <Modal.Body>
                <p className="mb-4">
                  This is an example modal using the compound component pattern.
                  It demonstrates context sharing and flexible composition.
                </p>
                <p>
                  The modal can be closed by clicking the X button, pressing Escape,
                  or clicking outside the modal content.
                </p>
              </Modal.Body>
              
              <Modal.Footer>
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded mr-2 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Confirm
                </button>
              </Modal.Footer>
            </Modal.Content>
          </Modal>
        </div>

        {/* Pattern explanation */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Compound Component Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Flexible composition with React.Children utilities</li>
              <li>• Context sharing eliminates prop drilling</li>
              <li>• TypeScript generics provide type safety</li>
              <li>• Clean separation of concerns</li>
            </ul>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Customizable and extensible APIs</li>
              <li>• Implicit parent-child communication</li>
              <li>• Reusable patterns across applications</li>
              <li>• Enhanced developer experience</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}