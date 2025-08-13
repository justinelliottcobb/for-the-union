# Controlled vs Uncontrolled Component Patterns

## Overview

Master the art of component state management by understanding when to use controlled vs uncontrolled patterns. Learn to build flexible components that can adapt to different architectural requirements while maintaining excellent developer experience and performance.

## Learning Objectives

By completing this exercise, you will:

- **Understand State Management Patterns**: Learn the fundamental differences between controlled and uncontrolled components
- **Build Flexible Component APIs**: Create components that work in both controlled and uncontrolled modes
- **Master Decision Making**: Know when to use each pattern based on requirements and constraints
- **Implement Hybrid Solutions**: Build enterprise-ready components with optional external control
- **Handle State Validation**: Implement robust validation patterns for different state management approaches
- **Design Imperative APIs**: Create ref-based APIs for programmatic component control

## Key Concepts

### 1. Controlled Components

Components where the parent manages all state:

```tsx
// Parent controls the state
function App() {
  const [value, setValue] = useState('');
  
  return (
    <input 
      value={value} 
      onChange={(e) => setValue(e.target.value)} 
    />
  );
}

// Benefits:
// ✅ Predictable data flow
// ✅ External validation and processing
// ✅ Easy to test and debug
// ✅ State synchronization across components

// Drawbacks:
// ❌ More boilerplate code
// ❌ Performance overhead from re-renders
// ❌ Requires careful state management
```

### 2. Uncontrolled Components

Components that manage their own internal state:

```tsx
// Component manages its own state
function UncontrolledInput() {
  const ref = useRef<HTMLInputElement>(null);
  
  const handleSubmit = () => {
    console.log(ref.current?.value);
  };
  
  return <input ref={ref} defaultValue="initial" />;
}

// Benefits:
// ✅ Simple implementation
// ✅ Better performance (fewer re-renders)
// ✅ Works well with form libraries
// ✅ Closer to native HTML behavior

// Drawbacks:
// ❌ Limited external control
// ❌ Harder to validate in real-time
// ❌ State not easily accessible
// ❌ Difficult to synchronize
```

### 3. Hybrid Approach

Components that support both patterns:

```tsx
function FlexibleInput({ value, defaultValue, onChange, ...props }) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  
  const currentValue = isControlled ? value : internalValue;
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue, e);
  };
  
  return <input value={currentValue} onChange={handleChange} {...props} />;
}
```

## Implementation Tasks

### Task 1: FlexibleInput Component (25 minutes)

Build a versatile input component that works in both modes:

**Core Features:**
```tsx
interface FlexibleInputProps {
  // Controlled mode
  value?: string;
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  
  // Uncontrolled mode
  defaultValue?: string;
  
  // Validation
  validator?: (value: string) => string | null;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  
  // UI enhancements
  showValidation?: boolean;
  clearButton?: boolean;
  onClear?: () => void;
}

interface FlexibleInputHandle {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
  validate: () => boolean;
}
```

**Key Implementation Details:**
- Automatically detect controlled vs uncontrolled mode
- Maintain internal state for uncontrolled mode
- Forward refs with imperative API
- Real-time validation with configurable timing
- Clear button functionality
- State change notifications

**Example Usage:**
```tsx
// Uncontrolled with validation
<FlexibleInput
  defaultValue=""
  validator={(value) => value.length < 3 ? 'Too short' : null}
  validateOnBlur
  clearButton
/>

// Controlled with real-time validation
<FlexibleInput
  value={state.email}
  onChange={(value) => setState({ email: value })}
  validator={emailValidator}
  validateOnChange
/>

// Imperative API
const inputRef = useRef<FlexibleInputHandle>(null);
inputRef.current?.focus();
inputRef.current?.validate();
```

### Task 2: SmartForm Component (25 minutes)

Create an intelligent form that adapts its state management:

**Form Configuration:**
```tsx
interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number';
  required?: boolean;
  validator?: (value: string) => string | null;
  defaultValue?: string;
  controlled?: boolean; // Per-field control
}

interface SmartFormProps {
  fields: FormField[];
  mode?: 'controlled' | 'uncontrolled' | 'hybrid';
  
  // Controlled mode props
  values?: Record<string, string>;
  errors?: Record<string, string>;
  onChange?: (values: Record<string, string>, errors: Record<string, string>) => void;
  
  // Event handlers
  onSubmit?: (data: Record<string, string>) => void;
  onFieldChange?: (name: string, value: string, isValid: boolean) => void;
  
  // Validation settings
  validateOnSubmit?: boolean;
  showValidationSummary?: boolean;
}
```

**Smart Behavior:**
- **Hybrid Mode (Default)**: Form manages state internally but provides external hooks
- **Controlled Mode**: Parent manages all form state
- **Uncontrolled Mode**: Minimal external dependencies
- **Per-field Control**: Mix controlled and uncontrolled fields in same form

**Advanced Features:**
```tsx
// Dynamic field validation
const userForm = [
  {
    name: 'username',
    label: 'Username',
    required: true,
    validator: (value) => {
      if (value.length < 3) return 'Username too short';
      if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Invalid characters';
      return null;
    }
  },
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    required: true
  },
  {
    name: 'phone',
    label: 'Phone (Optional)',
    validator: (value) => {
      if (!value) return null; // Optional field
      return /^\+?[\d\s\-\(\)]+$/.test(value) ? null : 'Invalid phone format';
    }
  }
];

// Form with intelligent state management
<SmartForm
  fields={userForm}
  mode="hybrid"
  onSubmit={(data) => console.log('Submitted:', data)}
  onFieldChange={(name, value, isValid) => {
    console.log(`${name}: ${value} (${isValid ? 'valid' : 'invalid'})`);
  }}
  validateOnSubmit
  showValidationSummary
/>
```

### Task 3: StateManager Component (25 minutes)

Build a powerful state management solution for complex scenarios:

**StateManager API:**
```tsx
interface StateManagerProps<T> {
  children: (state: T, actions: StateActions<T>) => React.ReactNode;
  
  // Initial state
  initialState: T;
  
  // Controlled fields (partial control)
  controlled?: Partial<T>;
  onChange?: (state: T) => void;
  
  // Persistence
  persistKey?: string;
  persistTo?: 'localStorage' | 'sessionStorage';
  
  // Validation
  validator?: (state: T) => Record<string, string>;
  
  // Development
  debug?: boolean;
}

interface StateActions<T> {
  setState: (updates: Partial<T> | ((prev: T) => Partial<T>)) => void;
  resetState: (newState?: T) => void;
  getState: () => T;
  isControlled: (key: keyof T) => boolean;
  validate: () => { isValid: boolean; errors: Record<string, string> };
}
```

**Advanced Patterns:**
```tsx
// Complex state management
<StateManager
  initialState={{ 
    user: { name: '', email: '' },
    preferences: { theme: 'light', notifications: true }
  }}
  controlled={{ user: externalUser }} // Partial control
  persistKey="app-state"
  validator={(state) => {
    const errors = {};
    if (!state.user.name) errors.name = 'Name required';
    if (!state.user.email.includes('@')) errors.email = 'Invalid email';
    return errors;
  }}
  debug={isDevelopment}
>
  {(state, actions) => (
    <div>
      {/* Your component tree */}
      <UserForm 
        user={state.user}
        onChange={(user) => actions.setState({ user })}
        isControlled={actions.isControlled}
      />
      
      <PreferencesPanel
        preferences={state.preferences}
        onChange={(preferences) => actions.setState({ preferences })}
      />
      
      <button onClick={() => actions.validate()}>
        Validate All
      </button>
    </div>
  )}
</StateManager>
```

## Decision Tree: When to Use Each Pattern

### Use Controlled Components When:

✅ **Real-time Validation Required**
- Form fields need immediate feedback
- Cross-field validation dependencies
- Server-side validation integration

✅ **Complex Business Logic**
- Field values affect other components
- Advanced formatting or transformation
- State synchronization across views

✅ **External State Management**
- Using Redux, Zustand, or similar
- State needs to persist across routes
- Undo/redo functionality required

✅ **Testing and Predictability**
- Easier to test with known state
- Debugging complex state interactions
- Strict data flow requirements

### Use Uncontrolled Components When:

⚡ **Performance is Critical**
- High-frequency input (search, autocomplete)
- Large forms with many fields
- Minimal React re-renders needed

⚡ **Simple Form Scenarios**
- Basic contact forms
- Search boxes
- File uploads and refs

⚡ **Third-party Integration**
- Working with jQuery libraries
- Legacy code integration
- Native HTML behavior preferred

⚡ **Rapid Prototyping**
- Quick demos and prototypes
- Minimal state management needs
- Simple submit-only validation

### Use Hybrid Approach When:

🔄 **Building Reusable Components**
- Component libraries and design systems
- Need to support both patterns
- Flexible API requirements

🔄 **Progressive Enhancement**
- Starting simple, adding features later
- Migration from uncontrolled to controlled
- Optional external control

🔄 **Enterprise Applications**
- Different teams, different needs
- Flexibility for future requirements
- Best developer experience

## Advanced Implementation Patterns

### 1. Validation Strategies

```tsx
// Real-time validation with debouncing
const useValidation = (value: string, validator: Function, delay = 300) => {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  useEffect(() => {
    setIsValidating(true);
    const timer = setTimeout(async () => {
      const result = await validator(value);
      setError(result);
      setIsValidating(false);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, validator, delay]);
  
  return { error, isValidating };
};

// Conditional validation timing
<FlexibleInput
  value={value}
  onChange={setValue}
  validator={expensiveValidator}
  validateOnChange={isDirty} // Only after user interaction
  validateOnBlur={true}
/>
```

### 2. State Synchronization

```tsx
// Bidirectional sync between controlled and uncontrolled
function SyncedComponent({ value, defaultValue, onChange }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  
  // Sync external changes to internal state
  useEffect(() => {
    if (isControlled && value !== internalValue) {
      setInternalValue(value);
    }
  }, [value, isControlled]);
  
  const handleChange = (newValue) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };
  
  return (
    <input 
      value={isControlled ? value : internalValue}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
}
```

### 3. Performance Optimization

```tsx
// Minimize re-renders with careful memo usage
const OptimizedInput = memo(forwardRef<HTMLInputElement, InputProps>(
  ({ value, onChange, ...props }, ref) => {
    // Memoize handlers to prevent child re-renders
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value, e);
    }, [onChange]);
    
    return <input ref={ref} value={value} onChange={handleChange} {...props} />;
  }
));

// Debounced state updates for expensive operations
const useDebouncedState = (initialValue: string, delay = 300) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return [value, setValue, debouncedValue] as const;
};
```

### 4. Error Handling and Recovery

```tsx
// Error boundaries for form validation
class FormErrorBoundary extends Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="form-error">
          <p>Something went wrong with form validation.</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Graceful degradation for validation failures
const safeValidator = (validator: Function) => (value: string) => {
  try {
    return validator(value);
  } catch (error) {
    console.warn('Validation error:', error);
    return null; // Fail open - allow the value
  }
};
```

## Success Criteria

- [ ] FlexibleInput works seamlessly in controlled and uncontrolled modes
- [ ] SmartForm provides intelligent state management across different modes
- [ ] StateManager handles complex state scenarios with partial control
- [ ] All components include proper validation with configurable timing
- [ ] Imperative APIs work correctly with ref forwarding
- [ ] Performance is optimized for different use cases
- [ ] Error handling is robust and user-friendly
- [ ] Decision tree helps developers choose the right pattern

## Real-World Applications

This pattern is essential for:

- **Design System Libraries**: Components that work in any application architecture
- **Form Libraries**: Supporting different validation and state strategies
- **Enterprise Applications**: Flexibility for different team preferences and requirements
- **Component Migration**: Smooth transitions between state management approaches
- **Performance Optimization**: Choosing the right pattern for performance needs
- **Developer Experience**: Providing intuitive APIs that adapt to usage patterns

Master these patterns to build components that developers love to use!