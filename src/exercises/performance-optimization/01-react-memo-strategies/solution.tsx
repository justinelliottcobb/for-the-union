import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';

// Performance monitoring utility
interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
}

function useRenderPerformance(componentName: string) {
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
  });
  
  const startTimeRef = useRef<number>(0);

  // Start timing at render start
  startTimeRef.current = performance.now();

  useEffect(() => {
    // Calculate render time after render completes
    const renderTime = performance.now() - startTimeRef.current;
    const metrics = metricsRef.current;
    
    metrics.renderCount += 1;
    metrics.lastRenderTime = renderTime;
    metrics.totalRenderTime += renderTime;
    metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;

    console.log(`${componentName} render #${metrics.renderCount}: ${renderTime.toFixed(2)}ms`);
  });

  const reset = useCallback(() => {
    metricsRef.current = {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      totalRenderTime: 0,
    };
  }, []);

  return { metrics: metricsRef.current, reset };
}

// Expensive computation function
function expensiveCalculation(items: Array<{ id: number; value: number; factor: number }>) {
  console.log('🔥 Running expensive calculation with', items.length, 'items');
  
  let result = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < 1000; j++) {
      result += items[i].value * items[i].factor * Math.sqrt(j + 1);
    }
  }
  
  return {
    total: result,
    average: result / items.length,
    processed: items.length,
  };
}

// User card component types
interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  lastActive: Date;
}

interface UserCardProps {
  user: User;
  onSelect: (userId: number) => void;
  isSelected: boolean;
  theme: 'light' | 'dark';
}

// Base UserCard component
function UserCard({ user, onSelect, isSelected, theme }: UserCardProps) {
  const { metrics } = useRenderPerformance(`UserCard-${user.id}`);

  const handleClick = useCallback(() => {
    onSelect(user.id);
  }, [onSelect, user.id]);

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-800 text-white border-gray-600' 
    : 'bg-white text-gray-900 border-gray-200';
    
  const selectedClasses = isSelected 
    ? 'ring-2 ring-blue-500' 
    : '';

  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-all ${themeClasses} ${selectedClasses}`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{user.name}</h3>
          <p className="text-sm opacity-70">{user.email}</p>
          <p className="text-xs opacity-50">
            Last active: {user.lastActive.toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="mt-2 text-xs opacity-50">
        Renders: {metrics.renderCount} | Avg: {metrics.averageRenderTime.toFixed(2)}ms
      </div>
    </div>
  );
}

// Custom comparison function for UserCard
function userCardPropsAreEqual(prevProps: UserCardProps, nextProps: UserCardProps) {
  // Compare user object by key properties (not reference)
  if (prevProps.user.id !== nextProps.user.id ||
      prevProps.user.name !== nextProps.user.name ||
      prevProps.user.email !== nextProps.user.email ||
      prevProps.user.avatar !== nextProps.user.avatar ||
      prevProps.user.lastActive.getTime() !== nextProps.user.lastActive.getTime()) {
    return false;
  }

  // Compare other props
  if (prevProps.isSelected !== nextProps.isSelected ||
      prevProps.theme !== nextProps.theme) {
    return false;
  }

  // Don't compare onSelect function reference - assume it's stable if other props are equal
  return true;
}

// Optimized UserCard with React.memo
const OptimizedUserCard = memo(UserCard, userCardPropsAreEqual);

// Expensive list component
interface ExpensiveListProps {
  items: Array<{ id: number; value: number; factor: number }>;
  multiplier: number;
  sortDirection: 'asc' | 'desc';
  filterThreshold: number;
}

function ExpensiveList({ items, multiplier, sortDirection, filterThreshold }: ExpensiveListProps) {
  const { metrics } = useRenderPerformance('ExpensiveList');

  // Memoize expensive filtering, sorting, and computation
  const processedItems = useMemo(() => {
    console.log('🔄 Processing items in ExpensiveList');
    
    // Filter items based on threshold
    const filtered = items.filter(item => item.value >= filterThreshold);
    
    // Sort items based on direction
    const sorted = [...filtered].sort((a, b) => {
      const comparison = a.value - b.value;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Apply expensive calculation to each item
    const processed = sorted.map(item => ({
      ...item,
      computedValue: expensiveCalculation([{ ...item, factor: item.factor * multiplier }]).total,
    }));

    return processed;
  }, [items, multiplier, sortDirection, filterThreshold]);

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">
        Showing {processedItems.length} items | Renders: {metrics.renderCount}
      </div>
      <div className="grid gap-2">
        {processedItems.map(item => (
          <div key={item.id} className="p-3 bg-gray-50 rounded border">
            <div className="flex justify-between">
              <span>Item {item.id}</span>
              <span className="font-mono">Value: {item.value}</span>
            </div>
            <div className="text-sm text-gray-600">
              Computed: {item.computedValue.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Form component types
interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'number';
  value: string;
  validation?: (value: string) => string | null;
}

interface MemoizedFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => void;
}

function MemoizedForm({ fields, onSubmit }: MemoizedFormProps) {
  const { metrics } = useRenderPerformance('MemoizedForm');
  const [formData, setFormData] = useState<Record<string, string>>(() =>
    fields.reduce((acc, field) => ({ ...acc, [field.id]: field.value }), {})
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Optimized field change handler using useCallback
  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  }, [errors]);

  // Optimized validation handler using useCallback
  const handleFieldValidation = useCallback((fieldId: string, value: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.validation) {
      const error = field.validation(value);
      setErrors(prev => ({ ...prev, [fieldId]: error || '' }));
    }
  }, [fields]);

  // Optimized form submission handler
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    fields.forEach(field => {
      if (field.validation) {
        const error = field.validation(formData[field.id] || '');
        if (error) {
          newErrors[field.id] = error;
          hasErrors = true;
        }
      }
    });

    setErrors(newErrors);

    if (!hasErrors) {
      onSubmit(formData);
    }
  }, [fields, formData, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Form renders: {metrics.renderCount}
      </div>
      
      {fields.map(field => (
        <FieldComponent
          key={field.id}
          field={field}
          value={formData[field.id] || ''}
          error={errors[field.id]}
          onChange={handleFieldChange}
          onValidate={handleFieldValidation}
        />
      ))}
      
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Submit Form
      </button>
    </form>
  );
}

// Optimized field component
interface FieldComponentProps {
  field: FormField;
  value: string;
  error?: string;
  onChange: (fieldId: string, value: string) => void;
  onValidate: (fieldId: string, value: string) => void;
}

const FieldComponent = memo(function FieldComponent({
  field,
  value,
  error,
  onChange,
  onValidate,
}: FieldComponentProps) {
  const { metrics } = useRenderPerformance(`Field-${field.id}`);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(field.id, e.target.value);
  }, [onChange, field.id]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    onValidate(field.id, e.target.value);
  }, [onValidate, field.id]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        <span className="text-xs text-gray-500 ml-2">
          (renders: {metrics.renderCount})
        </span>
      </label>
      <input
        type={field.type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        placeholder={`Enter ${field.label.toLowerCase()}`}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
});

// Main demo component
export default function ReactMemoStrategiesDemo() {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [listMultiplier, setListMultiplier] = useState(1);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [triggerRerender, setTriggerRerender] = useState(0);

  // Sample data
  const users: User[] = useMemo(() => [
    {
      id: 1,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      avatar: 'A',
      lastActive: new Date('2024-01-15'),
    },
    {
      id: 2,
      name: 'Bob Smith',
      email: 'bob@example.com',
      avatar: 'B',
      lastActive: new Date('2024-01-14'),
    },
    {
      id: 3,
      name: 'Carol Wilson',
      email: 'carol@example.com',
      avatar: 'C',
      lastActive: new Date('2024-01-13'),
    },
  ], []);

  const listItems = useMemo(() => [
    { id: 1, value: 100, factor: 1.5 },
    { id: 2, value: 75, factor: 2.0 },
    { id: 3, value: 120, factor: 1.2 },
    { id: 4, value: 30, factor: 3.0 },
    { id: 5, value: 90, factor: 1.8 },
  ], []);

  const formFields: FormField[] = useMemo(() => [
    {
      id: 'name',
      label: 'Full Name',
      type: 'text',
      value: '',
      validation: (value) => value.length < 2 ? 'Name must be at least 2 characters' : null,
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      value: '',
      validation: (value) => 
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Please enter a valid email' : null,
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      value: '',
      validation: (value) => {
        const num = parseInt(value);
        return isNaN(num) || num < 18 || num > 120 ? 'Age must be between 18 and 120' : null;
      },
    },
  ], []);

  // Optimized handlers using useCallback
  const handleUserSelect = useCallback((userId: number) => {
    setSelectedUser(prev => prev === userId ? null : userId);
  }, []);

  const handleFormSubmit = useCallback((data: Record<string, string>) => {
    console.log('Form submitted:', data);
    alert('Form submitted successfully! Check console for data.');
  }, []);

  const handleThemeToggle = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const forceRerender = useCallback(() => {
    setTriggerRerender(prev => prev + 1);
  }, []);

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">React.memo Optimization Strategies</h1>
          <p className="text-lg opacity-80 mb-6">
            This demo shows strategic use of React.memo, useMemo, and useCallback for performance optimization.
            Open the browser console to see render tracking and optimization effects.
          </p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleThemeToggle}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Toggle Theme ({theme})
            </button>
            <button
              onClick={forceRerender}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Force Re-render ({triggerRerender})
            </button>
          </div>
        </div>

        {/* Performance metrics display */}
        <div className={`p-6 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } shadow-lg`}>
          <h3 className="text-xl font-semibold mb-4">Performance Optimization Demo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-600 mb-2">✅ Optimized Components</h4>
              <ul className="text-sm space-y-1">
                <li>• UserCard: React.memo with custom comparison</li>
                <li>• ExpensiveList: useMemo for filtering/sorting</li>
                <li>• Form: useCallback for stable handlers</li>
                <li>• FieldComponent: memo + useCallback optimization</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-600 mb-2">📊 What to Watch</h4>
              <ul className="text-sm space-y-1">
                <li>• Render counts in component corners</li>
                <li>• Console logs showing when expensive operations run</li>
                <li>• Performance timing for each render</li>
                <li>• How optimizations prevent unnecessary work</li>
              </ul>
            </div>
          </div>
        </div>

        {/* User list demo */}
        <div className={`p-6 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } shadow-lg`}>
          <h2 className="text-2xl font-semibold mb-4">User List (React.memo with custom comparison)</h2>
          <p className="text-sm opacity-70 mb-4">
            Try toggling theme or forcing re-renders. Notice how user cards only re-render when their props actually change.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => (
              <OptimizedUserCard
                key={user.id}
                user={user}
                onSelect={handleUserSelect}
                isSelected={selectedUser === user.id}
                theme={theme}
              />
            ))}
          </div>
        </div>

        {/* Expensive list demo */}
        <div className={`p-6 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } shadow-lg`}>
          <h2 className="text-2xl font-semibold mb-4">Expensive List (useMemo optimization)</h2>
          <p className="text-sm opacity-70 mb-4">
            Watch the console - expensive calculations only run when the multiplier changes, not on theme changes.
          </p>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Multiplier: {listMultiplier}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={listMultiplier}
              onChange={(e) => setListMultiplier(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <ExpensiveList
            items={listItems}
            multiplier={listMultiplier}
            sortDirection="asc"
            filterThreshold={50}
          />
        </div>

        {/* Form demo */}
        <div className={`p-6 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } shadow-lg`}>
          <h2 className="text-2xl font-semibold mb-4">Memoized Form (useCallback optimization)</h2>
          <p className="text-sm opacity-70 mb-4">
            Each field component only re-renders when its own value or error changes. Watch the render counts!
          </p>
          <MemoizedForm fields={formFields} onSubmit={handleFormSubmit} />
        </div>
      </div>
    </div>
  );
}