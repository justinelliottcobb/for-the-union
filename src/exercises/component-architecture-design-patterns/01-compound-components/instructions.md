# Compound Components Pattern

## Overview

Master the compound components pattern - one of the most powerful and flexible design patterns in React. Learn to build composable, reusable components that provide clean APIs through context sharing and flexible composition.

## Learning Objectives

By completing this exercise, you will:

- **Understand Compound Components**: Learn the core concepts and benefits of the compound component pattern
- **Master Context Sharing**: Implement context-based communication between parent and child components
- **Build Flexible APIs**: Create components with intuitive, composable interfaces
- **Apply TypeScript Generics**: Use advanced TypeScript patterns for type-safe compound components
- **Handle State Management**: Implement both controlled and uncontrolled component patterns
- **Enhance Developer Experience**: Build components that are easy to use and customize

## Key Concepts

### 1. Compound Component Architecture

Compound components work together as a cohesive unit:

```tsx
// ✅ Clean, intuitive API
<Tabs defaultActiveTab="dashboard">
  <Tabs.TabList>
    <Tabs.Tab value="dashboard">Dashboard</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
  </Tabs.TabList>
  <Tabs.TabPanels>
    <Tabs.TabPanel value="dashboard">Dashboard content</Tabs.TabPanel>
    <Tabs.TabPanel value="settings">Settings content</Tabs.TabPanel>
  </Tabs.TabPanels>
</Tabs>

// ❌ Complex prop drilling alternative
<Tabs 
  tabs={[
    { id: 'dashboard', label: 'Dashboard', content: 'Dashboard content' },
    { id: 'settings', label: 'Settings', content: 'Settings content' }
  ]}
  defaultActiveTab="dashboard"
/>
```

### 2. Context-Based Communication

Use React Context to share state between compound components:

```tsx
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  orientation: 'horizontal' | 'vertical';
  variant: 'default' | 'pills' | 'underline';
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}
```

### 3. Component Composition

Attach sub-components to the main component:

```tsx
function Tabs(props: TabsProps) {
  // Main component implementation
}

Tabs.TabList = TabList;
Tabs.Tab = Tab;
Tabs.TabPanels = TabPanels;
Tabs.TabPanel = TabPanel;
```

### 4. Controlled vs Uncontrolled Patterns

Support both controlled and uncontrolled usage:

```tsx
// Controlled
<Tabs activeTab={activeTab} onTabChange={setActiveTab}>

// Uncontrolled  
<Tabs defaultActiveTab="dashboard">
```

## Implementation Tasks

### Task 1: Tabs Compound Component (25 minutes)

Implement a complete tabs system with compound components:

**Components to implement:**
- `Tabs` - Main container with context provider
- `TabList` - Container for tab buttons with keyboard navigation
- `Tab` - Individual tab button with active/disabled states
- `TabPanels` - Container for tab content panels
- `TabPanel` - Individual content panel

**Key features:**
- Context sharing between all components
- Keyboard navigation (arrow keys, home/end)
- Controlled and uncontrolled modes
- Multiple variants (default, pills, underline)
- Horizontal and vertical orientations
- Icon support in tabs
- Proper ARIA attributes for accessibility

**Implementation details:**
```tsx
function Tabs({ 
  children, 
  defaultActiveTab, 
  activeTab: controlledActiveTab,
  onTabChange,
  orientation = 'horizontal',
  variant = 'default' 
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultActiveTab || '');
  
  const activeTab = controlledActiveTab ?? internalActiveTab;
  
  const setActiveTab = useCallback((tabId: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  }, [controlledActiveTab, onTabChange]);

  // Provide context and render children
}
```

### Task 2: Accordion Compound Component (25 minutes)

Build a flexible accordion with compound components:

**Components to implement:**
- `Accordion` - Main container managing active items
- `AccordionItem` - Individual accordion section
- `AccordionTrigger` - Clickable header to toggle sections
- `AccordionContent` - Collapsible content area

**Key features:**
- Multiple items can be open simultaneously (allowMultiple)
- Controlled and uncontrolled modes
- Smooth animations for expand/collapse
- Custom trigger icons
- Different variants (default, bordered, filled)
- Proper ARIA attributes

**State management:**
```tsx
function Accordion({ 
  allowMultiple = false,
  defaultItems = [],
  items: controlledItems,
  onItemsChange 
}: AccordionProps) {
  const [internalItems, setInternalItems] = useState(new Set(defaultItems));
  
  const activeItems = controlledItems ? new Set(controlledItems) : internalItems;

  const toggleItem = useCallback((itemId: string) => {
    if (allowMultiple) {
      // Toggle item in set
    } else {
      // Only allow one item open
    }
  }, [allowMultiple, controlledItems, onItemsChange]);
}
```

### Task 3: Modal Compound Component (25 minutes)

Create a comprehensive modal system:

**Components to implement:**
- `Modal` - Main container with overlay and portal rendering
- `ModalContent` - Content wrapper handling clicks and styling
- `ModalHeader` - Header section with title area
- `ModalBody` - Main content area
- `ModalFooter` - Footer with action buttons
- `ModalCloseButton` - Close button component

**Key features:**
- Portal rendering to document.body
- Escape key handling
- Overlay click to close
- Focus management and trapping
- Scroll lock when open
- Multiple sizes (small, medium, large, fullscreen)
- Smooth animations

**Advanced functionality:**
```tsx
function Modal({ 
  open, 
  onOpenChange,
  closeOnOverlayClick = true,
  closeOnEscape = true 
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange?.(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closeOnEscape, onOpenChange]);

  // Portal rendering and context provision
}
```

## Advanced Patterns

### 1. Generic Compound Component Factory

Create reusable utilities for building compound components:

```tsx
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
  
  if (config.subComponents) {
    Object.entries(config.subComponents).forEach(([key, SubComponent]) => {
      (Component as any)[key] = SubComponent;
    });
  }
  
  return Component;
}
```

### 2. Children Validation

Validate compound component usage:

```tsx
function validateCompoundChildren(
  children: React.ReactNode,
  allowedTypes: string[]
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    
    const displayName = (child.type as any)?.displayName;
    if (displayName && !allowedTypes.includes(displayName)) {
      console.warn(`Invalid child component: ${displayName}`);
    }
    
    return child;
  });
}
```

### 3. Enhanced Children Utilities

Enhance children with additional props:

```tsx
function enhanceChildren(
  children: React.ReactNode,
  enhancements: Record<string, any>
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    return cloneElement(child, enhancements);
  });
}
```

## Testing Strategy

Your implementation should handle:

1. **Context Validation**: Proper error handling when components are used outside their provider
2. **State Management**: Both controlled and uncontrolled modes working correctly
3. **Keyboard Navigation**: Arrow keys, Enter, Space, Escape handling
4. **Accessibility**: Proper ARIA attributes and screen reader support
5. **Event Handling**: Click, keyboard, and focus events
6. **Edge Cases**: Empty children, invalid props, missing context

## Success Criteria

- [ ] All compound components properly use context for communication
- [ ] Tabs support keyboard navigation and accessibility
- [ ] Accordion handles multiple open items correctly
- [ ] Modal provides proper focus management and escape handling
- [ ] All components support both controlled and uncontrolled modes
- [ ] TypeScript types are accurate and provide good IntelliSense
- [ ] Components render correctly with various props and configurations
- [ ] Error boundaries and validation work properly

## Real-World Applications

This pattern is essential for:

- **Design System Components**: Building flexible, reusable UI libraries
- **Complex UI Widgets**: Multi-part components like datepickers, dropdowns
- **Layout Components**: Flexible containers with multiple content areas
- **Navigation Systems**: Tabs, menus, breadcrumbs with complex interactions
- **Form Components**: Multi-step forms, field groups, validation displays

Master this pattern to build components that are both powerful and easy to use!