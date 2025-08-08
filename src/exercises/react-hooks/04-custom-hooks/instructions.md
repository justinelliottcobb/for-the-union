# Custom Hooks Creation

Learn to create reusable custom hooks that encapsulate common stateful logic and side effects.

## Learning Objectives

- Understand custom hook patterns and conventions
- Learn to extract and reuse stateful logic
- Practice creating hooks for common use cases
- Handle async operations in custom hooks
- Create hooks that return multiple values and functions

## Prerequisites

- React useState and useEffect mastery
- Understanding of React component lifecycle
- Basic knowledge of async/await and Promises
- TypeScript generics and utility types

## Background

Custom hooks are JavaScript functions that start with "use" and can call other hooks. They allow you to extract component logic into reusable functions, making your code more modular and testable.

### Key Benefits

- **Reusability**: Share stateful logic between components
- **Separation of Concerns**: Keep components focused on rendering
- **Testability**: Test complex logic independently
- **Composition**: Combine multiple hooks for complex behavior

## Instructions

You'll create a comprehensive library of custom hooks:

1. **Basic State Hooks**: Counter, toggle, localStorage integration
2. **Async Hooks**: Data fetching, async operations
3. **UI Hooks**: Window size, debouncing, form handling
4. **Utility Hooks**: Previous values, intervals, local storage
5. **Complex Hooks**: Form management with validation
6. **Hook Testing**: Components that demonstrate each hook

## Essential Custom Hook Patterns

### Simple State Hook
```typescript
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);
  
  return { count, increment, decrement, reset };
}
```

### Hook with Side Effects
```typescript
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  }, [key, storedValue]);
  
  return [storedValue, setValue] as const;
}
```

### Async Hook
```typescript
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        const result = await response.json();
        
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, [url]);
  
  return { data, loading, error };
}
```

### Hook with Cleanup
```typescript
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (delay === null) return;
    
    const interval = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(interval);
  }, [delay]);
}
```

## Hook Design Principles

### 1. **Naming Convention**
- Always start with "use" prefix
- Use descriptive names that indicate purpose
- Follow camelCase convention

### 2. **Return Values**
- Return arrays for ordered values (like useState)
- Return objects for named values
- Use `as const` for tuple types when returning arrays

### 3. **Parameters**
- Accept configuration objects for complex hooks
- Provide sensible defaults
- Use TypeScript generics for type safety

### 4. **Dependencies**
- Include all dependencies in useEffect arrays
- Use useCallback and useMemo for optimization
- Be careful with object/function dependencies

## Common Custom Hook Patterns

### Toggle Hook
```typescript
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle] as const;
}
```

### Debounce Hook
```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}
```

### Previous Value Hook
```typescript
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
```

## Hints

1. Custom hooks must start with "use" prefix
2. Extract common stateful logic into reusable functions
3. Return arrays for ordered values, objects for named values
4. Custom hooks can use other hooks internally
5. Test custom hooks by using them in components
6. Use TypeScript generics for flexible, reusable hooks

## Expected Behavior

When complete, you should have hooks that work like:

```typescript
// Counter hook usage
const Counter = () => {
  const { count, increment, decrement, reset } = useCounter(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
};

// Form hook usage
const ContactForm = () => {
  const form = useForm({
    initialValues: { name: '', email: '', message: '' },
    validate: values => ({
      name: values.name ? undefined : 'Name is required',
      email: values.email.includes('@') ? undefined : 'Invalid email',
    }),
    onSubmit: values => console.log('Submitted:', values),
  });
  
  return (
    <form onSubmit={form.handleSubmit}>
      <input
        value={form.values.name}
        onChange={e => form.handleChange('name')(e.target.value)}
        onBlur={form.handleBlur('name')}
      />
      {form.errors.name && <span>{form.errors.name}</span>}
      {/* More fields... */}
      <button type="submit" disabled={form.isSubmitting}>
        Submit
      </button>
    </form>
  );
};
```

**Estimated time:** 35 minutes  
**Difficulty:** 4/5