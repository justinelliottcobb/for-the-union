// Custom Hooks Creation - SOLUTION
// Learn to create reusable custom hooks for common patterns

import { useState, useEffect, useCallback, useRef } from 'react';

// Create useCounter custom hook
function useCounter(initialValue: number = 0) {
  // Add state for count
  const [count, setCount] = useState(initialValue);
  
  // Implement increment, decrement, reset functions
  const increment = useCallback(() => setCount(prev => prev + 1), []);
  const decrement = useCallback(() => setCount(prev => prev - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);
  
  // Return object with count, increment, decrement, reset
  return {
    count,
    increment,
    decrement,
    reset,
  };
}

// Create useToggle custom hook
function useToggle(initialValue: boolean = false) {
  // Add state for toggle value
  const [value, setValue] = useState(initialValue);
  
  // Implement toggle, setTrue, setFalse functions
  const toggle = useCallback(() => setValue(prev => !prev), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  
  // Return array with [value, toggle, setTrue, setFalse]
  return [value, toggle, setTrue, setFalse] as const;
}

// Create useLocalStorage custom hook
function useLocalStorage<T>,(key: string, initialValue: T) {
  // Add state that reads from localStorage on init
  const [storedValue, setStoredValue] = useState<T>,(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  // Implement setValue function that updates both state and localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  
  return [storedValue, setValue] as const;
}

// Create useFetch custom hook for API calls
type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

function useFetch<T>,(url: string): FetchState<T> {
  // Add states for data, loading, error
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [url]);
  
  // Add useEffect to fetch data when url changes
  useEffect(() => {
    if (url) {
      fetchData();
    }
  }, [url, fetchData]);
  
  // Implement refetch function to manually trigger fetch
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  return {
    data,
    loading,
    error,
    refetch,
  };
}

// Create useDebounce custom hook
function useDebounce<T>,(value: T, delay: number): T {
  // Add state for debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>,(value);
  
  useEffect(() => {
    // Add useEffect with timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    // Clear timeout on cleanup
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  // Return debounced value
  return debouncedValue;
}

// Create usePrevious custom hook
function usePrevious<T>,(value: T): T | undefined {
  // Use useRef to store previous value
  const ref = useRef<T>,();
  
  useEffect(() => {
    // Update ref after render
    ref.current = value;
  });
  
  // Return previous value
  return ref.current;
}

// Create useWindowSize custom hook
type WindowSize = {
  width: number;
  height: number;
};

function useWindowSize(): WindowSize {
  // Add state for window size
  const [windowSize, setWindowSize] = useState<WindowSize>,(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));
  
  useEffect(() => {
    // Add useEffect to handle resize events
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Clean up event listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Return current window size
  return windowSize;
}

// Create useInterval custom hook
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();
  
  // Use useRef to store latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  // Add useEffect to set up interval
  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }
    
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

// Create useAsync custom hook for async operations
type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: () => Promise<void>;
};

function useAsync<T>,(asyncFunction: () => Promise<T>): AsyncState<T> {
  // Add states for data, loading, error
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Implement execute function that calls asyncFunction
  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);
  
  return {
    data,
    loading,
    error,
    execute,
  };
}

// Create useForm custom hook for form handling
type FormConfig<T> = {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => void | Promise<void>;
};

type FormState<T> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (field: keyof T) => (value: any) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (e: React.FormEvent) => void;
  reset: () => void;
};

function useForm<T extends Record<string, any>>(config: FormConfig<T>): FormState<T> {
  // Add states for values, errors, touched, isSubmitting
  const [values, setValues] = useState<T>,(config.initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Implement handleChange function
  const handleChange = useCallback((field: keyof T) => (value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);
  
  // Implement handleBlur function
  const handleBlur = useCallback((field: keyof T) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate single field on blur if validator exists
    if (config.validate) {
      const fieldErrors = config.validate(values);
      if (fieldErrors[field]) {
        setErrors(prev => ({ ...prev, [field]: fieldErrors[field] }));
      }
    }
  }, [config, values]);
  
  // Implement handleSubmit function with validation
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => ({
      ...acc,
      [key]: true,
    }), {});
    setTouched(allTouched);
    
    // Validate all fields
    let formErrors: Partial<Record<keyof T, string>> = {};
    if (config.validate) {
      formErrors = config.validate(values);
      setErrors(formErrors);
    }
    
    // Submit if no errors
    const hasErrors = Object.values(formErrors).some(error => error);
    if (!hasErrors) {
      try {
        await config.onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
  }, [config, values]);
  
  // Implement reset function
  const reset = useCallback(() => {
    setValues(config.initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [config.initialValues]);
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  };
}

// Example components using the custom hooks

// Implement CounterExample component
function CounterExample() {
  // Use useCounter hook
  const { count, increment, decrement, reset } = useCounter(0);
  
  // Return JSX with counter display and buttons
  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', margin: '8px' }}>
      <h3>Counter Example</h3>
      <p>Count: <strong>{count}</strong></p>
      <div>
        <button onClick={increment}>Increment</button>
        <button onClick={decrement} style={{ margin: '0 8px' }}>Decrement</button>
        <button onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

// Implement ToggleExample component
function ToggleExample() {
  // Use useToggle hook
  const [isToggled, toggle, setTrue, setFalse] = useToggle(false);
  
  // Return JSX showing toggle state and controls
  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', margin: '8px' }}>
      <h3>Toggle Example</h3>
      <p>Toggle is: <strong>{isToggled ? 'ON' : 'OFF'}</strong></p>
      <div>
        <button onClick={toggle}>Toggle</button>
        <button onClick={setTrue} style={{ margin: '0 8px' }}>Set True</button>
        <button onClick={setFalse}>Set False</button>
      </div>
    </div>
  );
}

// Implement LocalStorageExample component
function LocalStorageExample() {
  // Use useLocalStorage hook with a name field
  const [name, setName] = useLocalStorage('user-name', '');
  
  // Return JSX with input and display
  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', margin: '8px' }}>
      <h3>LocalStorage Example</h3>
      <p>Stored name: <strong>{name || 'None'}</strong></p>
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          style={{ marginRight: '8px', padding: '4px' }}
        />
        <button onClick={() => setName('')}>Clear</button>
      </div>
      <p style={{ fontSize: '12px', color: '#666' }}>
        This value persists across page reloads!
      </p>
    </div>
  );
}

// Implement FetchExample component
function FetchExample() {
  // Use useFetch hook with a sample API endpoint
  const { data, loading, error, refetch } = useFetch<{id: number; title: string}[]>(
    'https://jsonplaceholder.typicode.com/posts?_limit=3'
  );
  
  // Return JSX showing loading, error, data states
  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', margin: '8px' }}>
      <h3>Fetch Example</h3>
      
      <div style={{ marginBottom: '8px' }}>
        <button onClick={refetch} disabled={loading}>
          {loading ? 'Loading...' : 'Refetch Data'}
        </button>
      </div>
      
      {loading && <p>Loading posts...</p>}
      
      {error && (
        <p style={{ color: 'red' }}>Error: {error}</p>
      )}
      
      {data && (
        <div>
          <h4>Posts:</h4>
          {data.map(post => (
            <div key={post.id} style={{ 
              padding: '8px', 
              border: '1px solid #eee', 
              borderRadius: '4px', 
              margin: '4px 0' 
            }}>
              <strong>#{post.id}</strong>: {post.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Implement SearchExample component using useDebounce
function SearchExample() {
  // Use useState for search term
  const [searchTerm, setSearchTerm] = useState('');
  // Use useDebounce for debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  
  // Sample data for searching
  const sampleData = [
    'Apple', 'Banana', 'Cherry', 'Date', 'Elderberry',
    'Fig', 'Grape', 'Honeydew', 'Kiwi', 'Lemon',
    'Mango', 'Nectarine', 'Orange', 'Papaya', 'Quince'
  ];
  
  // Use useEffect to perform search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      const results = sampleData.filter(item =>
        item.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);
  
  // Return JSX with search input and results
  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', margin: '8px' }}>
      <h3>Search with Debounce Example</h3>
      
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search fruits..."
        style={{ width: '200px', padding: '4px', marginBottom: '8px' }}
      />
      
      <p>
        Search term: <code>{searchTerm}</code><br />
        Debounced term: <code>{debouncedSearchTerm}</code>
      </p>
      
      {searchResults.length > 0 && (
        <div>
          <h4>Results:</h4>
          <ul>
            {searchResults.map((result, index) => (
              <li key={index}>{result}</li>
            ))}
          </ul>
        </div>
      )}
      
      {debouncedSearchTerm && searchResults.length === 0 && (
        <p>No results found.</p>
      )}
    </div>
  );
}

// Implement FormExample component using useForm
function FormExample() {
  // Use useForm hook with user registration form
  const form = useForm({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    // Include validation for required fields
    validate: (values) => {
      const errors: Partial<Record<string, string>> = {};
      
      if (!values.username) {
        errors.username = 'Username is required';
      } else if (values.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      }
      
      if (!values.email) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = 'Invalid email format';
      }
      
      if (!values.password) {
        errors.password = 'Password is required';
      } else if (values.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      
      if (!values.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (values.password !== values.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      
      return errors;
    },
    onSubmit: async (values) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Form submitted with username: ${values.username}`);
      form.reset();
    },
  });
  
  const inputStyle = {
    width: '200px',
    padding: '4px',
    marginBottom: '4px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  };
  
  const errorStyle = {
    color: 'red',
    fontSize: '12px',
    marginBottom: '8px',
  };
  
  // Return JSX with form inputs and validation messages
  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', margin: '8px' }}>
      <h3>Form with Validation Example</h3>
      
      <form onSubmit={form.handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label>Username:</label><br />
          <input
            type="text"
            value={form.values.username}
            onChange={(e) => form.handleChange('username')(e.target.value)}
            onBlur={form.handleBlur('username')}
            style={inputStyle}
          />
          {form.touched.username && form.errors.username && (
            <div style={errorStyle}>{form.errors.username}</div>
          )}
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <label>Email:</label><br />
          <input
            type="email"
            value={form.values.email}
            onChange={(e) => form.handleChange('email')(e.target.value)}
            onBlur={form.handleBlur('email')}
            style={inputStyle}
          />
          {form.touched.email && form.errors.email && (
            <div style={errorStyle}>{form.errors.email}</div>
          )}
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <label>Password:</label><br />
          <input
            type="password"
            value={form.values.password}
            onChange={(e) => form.handleChange('password')(e.target.value)}
            onBlur={form.handleBlur('password')}
            style={inputStyle}
          />
          {form.touched.password && form.errors.password && (
            <div style={errorStyle}>{form.errors.password}</div>
          )}
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <label>Confirm Password:</label><br />
          <input
            type="password"
            value={form.values.confirmPassword}
            onChange={(e) => form.handleChange('confirmPassword')(e.target.value)}
            onBlur={form.handleBlur('confirmPassword')}
            style={inputStyle}
          />
          {form.touched.confirmPassword && form.errors.confirmPassword && (
            <div style={errorStyle}>{form.errors.confirmPassword}</div>
          )}
        </div>
        
        <div>
          <button type="submit" disabled={form.isSubmitting}>
            {form.isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button type="button" onClick={form.reset} style={{ marginLeft: '8px' }}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}

// Demo app showing all custom hooks
function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const windowSize = useWindowSize();
  
  // Use useInterval to update time
  useInterval(() => {
    setCurrentTime(new Date());
  }, 1000);
  
  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Custom Hooks Examples</h1>
      
      <div style={{ 
        padding: '12px', 
        background: '#f0f0f0', 
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <p><strong>Current Time:</strong> {currentTime.toLocaleTimeString()}</p>
        <p><strong>Window Size:</strong> {windowSize.width} × {windowSize.height}</p>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '16px' 
      }}>
        <CounterExample />
        <ToggleExample />
        <LocalStorageExample />
        <FetchExample />
        <SearchExample />
        <FormExample />
      </div>
      
      <div style={{ 
        marginTop: '24px', 
        padding: '16px',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h3>Custom Hooks Demonstrated:</h3>
        <ul>
          <li><strong>useCounter:</strong> Manages counter state with increment/decrement/reset</li>
          <li><strong>useToggle:</strong> Boolean toggle with convenience functions</li>
          <li><strong>useLocalStorage:</strong> Syncs state with localStorage</li>
          <li><strong>useFetch:</strong> Handles API calls with loading/error states</li>
          <li><strong>useDebounce:</strong> Delays value updates for search optimization</li>
          <li><strong>useWindowSize:</strong> Tracks window resize events</li>
          <li><strong>useInterval:</strong> Manages intervals with proper cleanup</li>
          <li><strong>useForm:</strong> Complete form handling with validation</li>
          <li><strong>useAsync:</strong> Generic async operation handling</li>
          <li><strong>usePrevious:</strong> Tracks previous values across renders</li>
        </ul>
      </div>
    </div>
  );
}

// Export all hooks and components for testing
export {
  useCounter,
  useToggle,
  useLocalStorage,
  useFetch,
  useDebounce,
  usePrevious,
  useWindowSize,
  useInterval,
  useAsync,
  useForm,
  CounterExample,
  ToggleExample,
  LocalStorageExample,
  FetchExample,
  SearchExample,
  FormExample,
  App,
  type FetchState,
  type AsyncState,
  type FormConfig,
  type FormState,
};