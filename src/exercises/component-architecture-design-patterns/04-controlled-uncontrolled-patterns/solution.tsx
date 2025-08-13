import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';

// Complete implementation of controlled vs uncontrolled component patterns

// FlexibleInput component that can work in both controlled and uncontrolled modes
interface FlexibleInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue'> {
  // Controlled mode props
  value?: string;
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  
  // Uncontrolled mode props  
  defaultValue?: string;
  
  // Validation and behavior
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validator?: (value: string) => string | null;
  
  // State management
  onStateChange?: (state: { value: string; isValid: boolean; error: string | null }) => void;
  
  // UI enhancement
  showValidation?: boolean;
  clearButton?: boolean;
  onClear?: () => void;
  
  // Refs for imperative API
  inputRef?: React.RefObject<HTMLInputElement>;
}

interface FlexibleInputHandle {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
  validate: () => boolean;
  getValidationState: () => { isValid: boolean; error: string | null };
}

const FlexibleInput = forwardRef<FlexibleInputHandle, FlexibleInputProps>(({
  value,
  onChange,
  defaultValue = '',
  validateOnChange = false,
  validateOnBlur = true,
  validator,
  onStateChange,
  showValidation = true,
  clearButton = false,
  onClear,
  inputRef,
  className,
  ...props
}, ref) => {
  // Determine if component is controlled or uncontrolled
  const isControlled = value !== undefined;
  
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasBlurred, setHasBlurred] = useState(false);
  
  const localInputRef = useRef<HTMLInputElement>(null);
  const actualInputRef = inputRef || localInputRef;
  
  // Get current value based on controlled/uncontrolled mode
  const currentValue = isControlled ? value : internalValue;
  
  // Validation logic
  const validateValue = useCallback((val: string): string | null => {
    if (validator) {
      return validator(val);
    }
    return null;
  }, [validator]);
  
  // Handle value changes
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    // Update internal state if uncontrolled
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    // Validate if required
    let error: string | null = null;
    if (validateOnChange && validator) {
      error = validateValue(newValue);
      setValidationError(error);
    }
    
    // Call external onChange
    if (onChange) {
      onChange(newValue, event);
    }
    
    // Notify state changes
    if (onStateChange) {
      onStateChange({
        value: newValue,
        isValid: error === null,
        error
      });
    }
  }, [isControlled, validateOnChange, validator, validateValue, onChange, onStateChange]);
  
  // Handle blur validation
  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setHasBlurred(true);
    
    if (validateOnBlur && validator) {
      const error = validateValue(currentValue);
      setValidationError(error);
      
      if (onStateChange) {
        onStateChange({
          value: currentValue,
          isValid: error === null,
          error
        });
      }
    }
    
    if (props.onBlur) {
      props.onBlur(event);
    }
  }, [validateOnBlur, validator, validateValue, currentValue, onStateChange, props]);
  
  // Handle clear functionality
  const handleClear = useCallback(() => {
    const newValue = '';
    
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    setValidationError(null);
    
    if (onChange) {
      const syntheticEvent = {
        target: { value: newValue },
        currentTarget: { value: newValue }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(newValue, syntheticEvent);
    }
    
    if (onClear) {
      onClear();
    }
    
    if (onStateChange) {
      onStateChange({
        value: newValue,
        isValid: true,
        error: null
      });
    }
    
    // Focus input after clearing
    if (actualInputRef.current) {
      actualInputRef.current.focus();
    }
  }, [isControlled, onChange, onClear, onStateChange, actualInputRef]);
  
  // Implement imperative handle
  useImperativeHandle(ref, () => ({
    focus: () => actualInputRef.current?.focus(),
    blur: () => actualInputRef.current?.blur(),
    clear: handleClear,
    getValue: () => currentValue,
    setValue: (newValue: string) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      setValidationError(null);
      
      // Trigger validation if enabled
      if (validator && (validateOnChange || hasBlurred)) {
        const error = validateValue(newValue);
        setValidationError(error);
      }
    },
    validate: () => {
      if (validator) {
        const error = validateValue(currentValue);
        setValidationError(error);
        return error === null;
      }
      return true;
    },
    getValidationState: () => ({
      isValid: validationError === null,
      error: validationError
    })
  }), [currentValue, handleClear, isControlled, validator, validateValue, validationError, hasBlurred, validateOnChange]);
  
  // Determine if we should show validation feedback
  const shouldShowValidation = showValidation && hasBlurred && validationError;
  
  return (
    <div className="relative">
      <div className="relative">
        <input
          {...props}
          ref={actualInputRef}
          value={currentValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`
            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
            ${shouldShowValidation ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'}
            ${clearButton && currentValue ? 'pr-10' : ''}
            ${className || ''}
          `.trim()}
        />
        
        {clearButton && currentValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 hover:text-gray-600 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Clear input"
          >
            ✕
          </button>
        )}
      </div>
      
      {shouldShowValidation && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠️</span>
          {validationError}
        </p>
      )}
    </div>
  );
});

FlexibleInput.displayName = 'FlexibleInput';

// SmartForm component with intelligent field management
interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number';
  required?: boolean;
  validator?: (value: string) => string | null;
  defaultValue?: string;
  controlled?: boolean;
  placeholder?: string;
}

interface SmartFormProps {
  fields: FormField[];
  onSubmit?: (data: Record<string, string>) => void;
  onFieldChange?: (name: string, value: string, isValid: boolean) => void;
  submitText?: string;
  resetText?: string;
  validateOnSubmit?: boolean;
  showValidationSummary?: boolean;
  
  // State management mode
  mode?: 'controlled' | 'uncontrolled' | 'hybrid';
  
  // External state for controlled mode
  values?: Record<string, string>;
  errors?: Record<string, string>;
  onChange?: (values: Record<string, string>, errors: Record<string, string>) => void;
}

function SmartForm({
  fields,
  onSubmit,
  onFieldChange,
  submitText = 'Submit',
  resetText = 'Reset',
  validateOnSubmit = true,
  showValidationSummary = true,
  mode = 'hybrid',
  values: controlledValues,
  errors: controlledErrors,
  onChange: controlledOnChange
}: SmartFormProps) {
  // Internal state for uncontrolled/hybrid modes
  const [internalValues, setInternalValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fields.forEach(field => {
      initial[field.name] = field.defaultValue || '';
    });
    return initial;
  });
  
  const [internalErrors, setInternalErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Determine values and errors based on mode
  const currentValues = mode === 'controlled' ? (controlledValues || {}) : internalValues;
  const currentErrors = mode === 'controlled' ? (controlledErrors || {}) : internalErrors;
  
  // Field change handler
  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    const field = fields.find(f => f.name === fieldName);
    let isValid = true;
    let error: string | null = null;
    
    // Validate the field
    if (field) {
      error = validateField(field, value);
      isValid = error === null;
    }
    
    const newValues = { ...currentValues, [fieldName]: value };
    const newErrors = { ...currentErrors };
    
    // Update error state
    if (error) {
      newErrors[fieldName] = error;
    } else {
      delete newErrors[fieldName];
    }
    
    // Update internal state if not fully controlled
    if (mode !== 'controlled') {
      setInternalValues(newValues);
      setInternalErrors(newErrors);
    }
    
    // Call external handlers
    if (controlledOnChange) {
      controlledOnChange(newValues, newErrors);
    }
    
    if (onFieldChange) {
      onFieldChange(fieldName, value, isValid);
    }
  }, [fields, currentValues, currentErrors, mode, controlledOnChange, onFieldChange]);
  
  // Validation helpers
  const validateField = useCallback((field: FormField, value: string): string | null => {
    // Required validation
    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }
    
    // Type-based validation
    if (value && field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }
    
    if (value && field.type === 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        return 'Please enter a valid number';
      }
    }
    
    // Custom validation
    if (field.validator) {
      try {
        return field.validator(value);
      } catch (error) {
        console.warn(`Validation error for field ${field.name}:`, error);
        return 'Validation error occurred';
      }
    }
    
    return null;
  }, []);
  
  const validateAllFields = useCallback(() => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    fields.forEach(field => {
      const value = currentValues[field.name] || '';
      const error = validateField(field, value);
      
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });
    
    if (mode !== 'controlled') {
      setInternalErrors(newErrors);
    }
    
    if (controlledOnChange) {
      controlledOnChange(currentValues, newErrors);
    }
    
    return isValid;
  }, [fields, currentValues, validateField, mode, controlledOnChange]);
  
  // Form submission
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setIsSubmitting(true);
    
    try {
      let isValid = true;
      if (validateOnSubmit) {
        isValid = validateAllFields();
      }
      
      if (isValid && onSubmit) {
        await onSubmit(currentValues);
        // Reset submit attempted on successful submission
        setSubmitAttempted(false);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateOnSubmit, validateAllFields, onSubmit, currentValues]);
  
  // Form reset
  const handleReset = useCallback(() => {
    const resetValues: Record<string, string> = {};
    fields.forEach(field => {
      resetValues[field.name] = field.defaultValue || '';
    });
    
    if (mode !== 'controlled') {
      setInternalValues(resetValues);
      setInternalErrors({});
    }
    
    setSubmitAttempted(false);
    
    if (controlledOnChange) {
      controlledOnChange(resetValues, {});
    }
  }, [fields, mode, controlledOnChange]);
  
  // Get validation errors to display
  const validationErrors = Object.entries(currentErrors)
    .filter(([_, error]) => Boolean(error))
    .map(([field, error]) => ({ field, error }));
  const hasErrors = validationErrors.length > 0;
  
  // Calculate form progress
  const totalFields = fields.filter(f => f.required).length;
  const completedFields = fields
    .filter(f => f.required)
    .filter(f => currentValues[f.name]?.trim()).length;
  const progress = totalFields > 0 ? (completedFields / totalFields) * 100 : 100;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress indicator for required fields */}
      {totalFields > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Form Progress</span>
            <span>{completedFields}/{totalFields} required fields</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {fields.map(field => {
        const fieldError = currentErrors[field.name];
        const shouldValidateField = field.controlled !== false && mode !== 'uncontrolled';
        const fieldValue = currentValues[field.name] || '';
        
        return (
          <div key={field.name} className="space-y-1">
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            <FlexibleInput
              id={field.name}
              name={field.name}
              type={field.type || 'text'}
              placeholder={field.placeholder}
              value={shouldValidateField ? fieldValue : undefined}
              defaultValue={shouldValidateField ? undefined : field.defaultValue}
              onChange={shouldValidateField ? (value) => handleFieldChange(field.name, value) : undefined}
              validator={(value) => validateField(field, value)}
              validateOnBlur={true}
              validateOnChange={submitAttempted}
              showValidation={true}
              clearButton={true}
              className="w-full"
            />
          </div>
        );
      })}
      
      {/* Validation summary */}
      {showValidationSummary && submitAttempted && hasErrors && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <span className="text-red-500 mr-2">⚠️</span>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map(({ field, error }) => {
                  const fieldLabel = fields.find(f => f.name === field)?.label || field;
                  return (
                    <li key={field}>
                      <strong>{fieldLabel}:</strong> {error}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Form actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Submitting...
            </>
          ) : (
            submitText
          )}
        </button>
        
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {resetText}
        </button>
      </div>
    </form>
  );
}

// StateManager for complex hybrid patterns
interface StateManagerProps<T> {
  children: (state: T, actions: StateActions<T>) => React.ReactNode;
  
  // State management configuration
  initialState: T;
  controlled?: Partial<T>;
  onChange?: (state: T) => void;
  
  // State persistence
  persistKey?: string;
  persistTo?: 'localStorage' | 'sessionStorage';
  
  // State validation
  validator?: (state: T) => Record<string, string>;
  
  // Debugging
  debug?: boolean;
}

interface StateActions<T> {
  setState: (updates: Partial<T> | ((prev: T) => Partial<T>)) => void;
  resetState: (newState?: T) => void;
  getState: () => T;
  isControlled: (key: keyof T) => boolean;
  validate: () => { isValid: boolean; errors: Record<string, string> };
}

function StateManager<T extends Record<string, any>>({
  children,
  initialState,
  controlled = {},
  onChange,
  persistKey,
  persistTo = 'localStorage',
  validator,
  debug = false
}: StateManagerProps<T>) {
  // Initialize state with persistence support
  const [internalState, setInternalState] = useState<T>(() => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        const storage = persistTo === 'localStorage' ? localStorage : sessionStorage;
        const saved = storage.getItem(persistKey);
        if (saved) {
          const parsedState = JSON.parse(saved);
          if (debug) {
            console.log('StateManager: Loaded persisted state', parsedState);
          }
          return { ...initialState, ...parsedState };
        }
      } catch (error) {
        if (debug) {
          console.warn('StateManager: Failed to load persisted state:', error);
        }
      }
    }
    return initialState;
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Compute current state (controlled + uncontrolled)
  const currentState = useMemo(() => {
    return { ...internalState, ...controlled } as T;
  }, [internalState, controlled]);
  
  // Persist state changes
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        const storage = persistTo === 'localStorage' ? localStorage : sessionStorage;
        const stateToStore = { ...internalState };
        
        // Remove controlled fields from persisted state
        Object.keys(controlled).forEach(key => {
          delete stateToStore[key];
        });
        
        storage.setItem(persistKey, JSON.stringify(stateToStore));
        
        if (debug) {
          console.log('StateManager: Persisted state', stateToStore);
        }
      } catch (error) {
        if (debug) {
          console.warn('StateManager: Failed to persist state:', error);
        }
      }
    }
  }, [internalState, persistKey, persistTo, controlled, debug]);
  
  // State update handler
  const setState = useCallback((updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setInternalState(prev => {
      const newUpdates = typeof updates === 'function' ? updates(prev) : updates;
      const newState = { ...prev };
      
      // Only update non-controlled fields
      Object.entries(newUpdates).forEach(([key, value]) => {
        if (!(key in controlled)) {
          newState[key] = value;
        }
      });
      
      if (debug) {
        console.log('StateManager update:', { 
          prev, 
          updates: newUpdates, 
          next: newState,
          controlled: Object.keys(controlled)
        });
      }
      
      // Validate new state
      if (validator) {
        try {
          const fullState = { ...newState, ...controlled } as T;
          const errors = validator(fullState);
          setValidationErrors(errors);
          
          if (debug && Object.keys(errors).length > 0) {
            console.warn('StateManager validation errors:', errors);
          }
        } catch (error) {
          if (debug) {
            console.error('StateManager validation error:', error);
          }
        }
      }
      
      return newState;
    });
    
    // Call external onChange with full state (including controlled fields)
    if (onChange) {
      const fullState = { ...internalState, ...controlled } as T;
      if (typeof updates === 'function') {
        const newUpdates = updates(internalState);
        const updatedState = { ...fullState, ...newUpdates };
        onChange(updatedState);
      } else {
        const updatedState = { ...fullState, ...updates };
        onChange(updatedState);
      }
    }
  }, [controlled, onChange, validator, debug, internalState]);
  
  // State reset handler
  const resetState = useCallback((newState?: T) => {
    const resetTo = newState || initialState;
    const stateToSet = { ...resetTo };
    
    // Remove controlled fields from internal state
    Object.keys(controlled).forEach(key => {
      delete stateToSet[key];
    });
    
    setInternalState(stateToSet);
    setValidationErrors({});
    
    if (onChange) {
      onChange(resetTo);
    }
    
    if (debug) {
      console.log('StateManager reset:', { resetTo, internal: stateToSet });
    }
  }, [initialState, controlled, onChange, debug]);
  
  // State validation
  const validate = useCallback(() => {
    if (validator) {
      try {
        const errors = validator(currentState);
        setValidationErrors(errors);
        const isValid = Object.keys(errors).length === 0;
        
        if (debug) {
          console.log('StateManager validation:', { isValid, errors });
        }
        
        return { isValid, errors };
      } catch (error) {
        if (debug) {
          console.error('StateManager validation failed:', error);
        }
        return { isValid: false, errors: { _general: 'Validation failed' } };
      }
    }
    return { isValid: true, errors: {} };
  }, [validator, currentState, debug]);
  
  // Check if field is controlled
  const isControlled = useCallback((key: keyof T) => {
    return key in controlled;
  }, [controlled]);
  
  // Create actions object
  const actions: StateActions<T> = useMemo(() => ({
    setState,
    resetState,
    getState: () => currentState,
    isControlled,
    validate
  }), [setState, resetState, currentState, isControlled, validate]);
  
  return <>{children(currentState, actions)}</>;
}

// Demo data and examples
interface User {
  name: string;
  email: string;
  age: number;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
}

const initialUser: User = {
  name: '',
  email: '',
  age: 0,
  preferences: {
    theme: 'light',
    notifications: true,
    language: 'en'
  }
};

// Demo component showcasing controlled/uncontrolled patterns
export default function ControlledUncontrolledDemo() {
  const [selectedPattern, setSelectedPattern] = useState<'flexible' | 'form' | 'state-manager' | 'decision-tree'>('flexible');
  
  // State for controlled examples
  const [controlledInputValue, setControlledInputValue] = useState('');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // State manager controlled state
  const [controlledUserName, setControlledUserName] = useState('John Doe');
  
  // Refs for imperative API demo
  const imperativeInputRef = useRef<FlexibleInputHandle>(null);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Controlled vs Uncontrolled Patterns
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Master the art of component state management. Learn when to use controlled vs uncontrolled patterns,
            and implement flexible components that adapt to different use cases.
          </p>
        </div>

        {/* Pattern selection */}
        <div className="flex justify-center flex-wrap gap-4">
          {[
            { key: 'flexible', label: 'Flexible Input' },
            { key: 'form', label: 'Smart Form' },
            { key: 'state-manager', label: 'State Manager' },
            { key: 'decision-tree', label: 'Decision Tree' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedPattern(key as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedPattern === key
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border shadow-sm'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Pattern content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {selectedPattern === 'flexible' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold">FlexibleInput Component</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-green-700">✅ Controlled Mode</h3>
                    <p className="text-sm text-gray-600">
                      Parent component manages the value state. Every keystroke updates the parent state.
                    </p>
                    
                    <div className="space-y-4">
                      <FlexibleInput
                        value={controlledInputValue}
                        onChange={(value) => setControlledInputValue(value)}
                        placeholder="Type something..."
                        validator={(value) => value.length < 3 ? 'Must be at least 3 characters' : null}
                        clearButton
                        className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      />
                      
                      <div className="p-3 bg-green-50 rounded text-sm border border-green-200">
                        <p className="font-medium text-green-800">Parent State:</p>
                        <p className="text-green-700 font-mono mt-1">"{controlledInputValue}"</p>
                        <p className="text-green-600 text-xs mt-1">
                          Length: {controlledInputValue.length} characters
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-blue-700">⚡ Uncontrolled Mode</h3>
                    <p className="text-sm text-gray-600">
                      Component manages its own state internally. Parent only receives notifications.
                    </p>
                    
                    <div className="space-y-4">
                      <FlexibleInput
                        defaultValue="Initial value"
                        placeholder="Uncontrolled input..."
                        validator={(value) => value.includes('@') ? null : 'Must contain @ symbol'}
                        clearButton
                        onStateChange={(state) => console.log('Uncontrolled state changed:', state)}
                        className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      
                      <div className="p-3 bg-blue-50 rounded text-sm border border-blue-200">
                        <p className="font-medium text-blue-800">Internal State:</p>
                        <p className="text-blue-700">Managed by the component itself</p>
                        <p className="text-blue-600 text-xs mt-1">
                          Check browser console for state changes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-purple-700">🔧 Imperative API Demo</h3>
                  <p className="text-sm text-gray-600">
                    Use refs to programmatically control the component
                  </p>
                  
                  <div className="flex gap-6 items-start">
                    <div className="flex-1">
                      <FlexibleInput
                        ref={imperativeInputRef}
                        defaultValue="Test imperative API"
                        placeholder="Imperative API demo..."
                        validator={(value) => value.length > 10 ? null : 'Must be longer than 10 characters'}
                        clearButton
                        className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => imperativeInputRef.current?.focus()}
                        className="px-4 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                      >
                        Focus
                      </button>
                      <button
                        onClick={() => imperativeInputRef.current?.clear()}
                        className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => {
                          const isValid = imperativeInputRef.current?.validate();
                          const state = imperativeInputRef.current?.getValidationState();
                          alert(`Validation Result:\nValid: ${isValid}\nError: ${state?.error || 'None'}`);
                        }}
                        className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        Validate
                      </button>
                      <button
                        onClick={() => {
                          imperativeInputRef.current?.setValue('New value set programmatically');
                        }}
                        className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Set Value
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPattern === 'form' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold">SmartForm Component</h2>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-purple-700">🔄 Hybrid Mode (Recommended)</h3>
                    <p className="text-sm text-gray-600">
                      Form manages state internally but provides external hooks for monitoring and control.
                    </p>
                    
                    <SmartForm
                      fields={[
                        {
                          name: 'name',
                          label: 'Full Name',
                          required: true,
                          placeholder: 'Enter your full name',
                          validator: (value) => {
                            if (value.length < 2) return 'Name must be at least 2 characters';
                            if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters and spaces';
                            return null;
                          }
                        },
                        {
                          name: 'email',
                          label: 'Email Address',
                          type: 'email',
                          required: true,
                          placeholder: 'your.email@example.com'
                        },
                        {
                          name: 'phone',
                          label: 'Phone Number',
                          placeholder: '+1 (555) 123-4567',
                          validator: (value) => {
                            if (!value) return null;
                            const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
                            return phoneRegex.test(value) ? null : 'Please enter a valid phone number';
                          }
                        },
                        {
                          name: 'age',
                          label: 'Age',
                          type: 'number',
                          required: true,
                          validator: (value) => {
                            const age = parseInt(value);
                            if (isNaN(age)) return 'Please enter a valid age';
                            if (age < 13) return 'Must be at least 13 years old';
                            if (age > 120) return 'Please enter a realistic age';
                            return null;
                          }
                        }
                      ]}
                      onSubmit={(data) => {
                        alert('Hybrid Form submitted!\n\n' + JSON.stringify(data, null, 2));
                      }}
                      onFieldChange={(name, value, isValid) => {
                        console.log(`Field ${name}: "${value}" (${isValid ? 'valid' : 'invalid'})`);
                      }}
                    />
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-green-700">✅ Controlled Mode</h3>
                    <p className="text-sm text-gray-600">
                      Parent component fully controls all form state and validation.
                    </p>
                    
                    <SmartForm
                      mode="controlled"
                      values={formValues}
                      errors={formErrors}
                      onChange={(values, errors) => {
                        setFormValues(values);
                        setFormErrors(errors);
                      }}
                      fields={[
                        {
                          name: 'username',
                          label: 'Username',
                          required: true,
                          placeholder: 'Choose a username',
                          validator: (value) => {
                            if (value.length < 3) return 'Username must be at least 3 characters';
                            if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
                            if (value.toLowerCase().includes('admin')) return 'Username cannot contain "admin"';
                            return null;
                          }
                        },
                        {
                          name: 'password',
                          label: 'Password',
                          type: 'password',
                          required: true,
                          placeholder: 'Create a strong password',
                          validator: (value) => {
                            if (value.length < 8) return 'Password must be at least 8 characters';
                            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                              return 'Password must contain uppercase, lowercase, and number';
                            }
                            if (!/(?=.*[!@#$%^&*])/.test(value)) {
                              return 'Password must contain at least one special character';
                            }
                            return null;
                          }
                        },
                        {
                          name: 'confirmPassword',
                          label: 'Confirm Password',
                          type: 'password',
                          required: true,
                          placeholder: 'Confirm your password',
                          validator: (value) => {
                            const password = formValues.password;
                            if (password && value !== password) return 'Passwords do not match';
                            return null;
                          }
                        }
                      ]}
                      onSubmit={(data) => {
                        alert('Controlled form submitted!\n\n' + JSON.stringify(data, null, 2));
                      }}
                    />
                    
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="font-medium text-gray-800 mb-2">External State Monitor:</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-600">Values:</p>
                          <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                            {JSON.stringify(formValues, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Errors:</p>
                          <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                            {JSON.stringify(formErrors, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPattern === 'state-manager' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold">StateManager Component</h2>
                <p className="text-gray-600">
                  Advanced state management with persistence, validation, and hybrid control patterns.
                </p>
                
                <StateManager
                  initialState={initialUser}
                  controlled={{ name: controlledUserName }} // Partially controlled
                  persistKey="demo-user-profile"
                  validator={(state) => {
                    const errors: Record<string, string> = {};
                    if (!state.name.trim()) errors.name = 'Name is required';
                    if (!state.email.includes('@')) errors.email = 'Invalid email format';
                    if (state.age < 0 || state.age > 120) errors.age = 'Age must be between 0 and 120';
                    if (!['en', 'es', 'fr', 'de'].includes(state.preferences.language)) {
                      errors.language = 'Unsupported language';
                    }
                    return errors;
                  }}
                  debug={true}
                  onChange={(state) => console.log('StateManager onChange:', state)}
                >
                  {(state, actions) => (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <h3 className="text-lg font-medium">User Profile</h3>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name (Controlled Externally) <span className="text-blue-500">*</span>
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={controlledUserName}
                                  onChange={(e) => setControlledUserName(e.target.value)}
                                  className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter name..."
                                />
                                <span className="px-2 py-2 text-sm bg-blue-100 text-blue-800 rounded">
                                  External Control
                                </span>
                              </div>
                            </div>
                            
                            <FlexibleInput
                              value={state.email}
                              onChange={(value) => actions.setState({ email: value })}
                              placeholder="Enter your email..."
                              type="email"
                              validator={(value) => {
                                if (!value) return 'Email is required';
                                if (!value.includes('@')) return 'Invalid email format';
                                return null;
                              }}
                              clearButton
                            />
                            
                            <FlexibleInput
                              value={state.age.toString()}
                              onChange={(value) => actions.setState({ age: parseInt(value) || 0 })}
                              placeholder="Enter your age..."
                              type="number"
                              validator={(value) => {
                                const age = parseInt(value);
                                if (isNaN(age) || age < 0 || age > 120) return 'Age must be between 0 and 120';
                                return null;
                              }}
                            />
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="font-medium">Preferences</h4>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                                <div className="space-y-2">
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      name="theme"
                                      checked={state.preferences.theme === 'light'}
                                      onChange={() => actions.setState({
                                        preferences: { ...state.preferences, theme: 'light' }
                                      })}
                                      className="text-blue-500"
                                    />
                                    <span>☀️ Light theme</span>
                                  </label>
                                  
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      name="theme"
                                      checked={state.preferences.theme === 'dark'}
                                      onChange={() => actions.setState({
                                        preferences: { ...state.preferences, theme: 'dark' }
                                      })}
                                      className="text-blue-500"
                                    />
                                    <span>🌙 Dark theme</span>
                                  </label>
                                </div>
                              </div>
                              
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={state.preferences.notifications}
                                  onChange={(e) => actions.setState({
                                    preferences: { ...state.preferences, notifications: e.target.checked }
                                  })}
                                  className="text-blue-500"
                                />
                                <span>🔔 Enable notifications</span>
                              </label>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Language
                                </label>
                                <select
                                  value={state.preferences.language}
                                  onChange={(e) => actions.setState({
                                    preferences: { ...state.preferences, language: e.target.value }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="en">🇺🇸 English</option>
                                  <option value="es">🇪🇸 Spanish</option>
                                  <option value="fr">🇫🇷 French</option>
                                  <option value="de">🇩🇪 German</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          <h3 className="text-lg font-medium">State Management</h3>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => {
                                  const validation = actions.validate();
                                  const message = validation.isValid 
                                    ? '✅ All fields are valid!' 
                                    : `❌ Validation errors:\n${Object.entries(validation.errors).map(([k, v]) => `${k}: ${v}`).join('\n')}`;
                                  alert(message);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                              >
                                Validate State
                              </button>
                              
                              <button
                                onClick={() => {
                                  const confirmed = confirm('Are you sure you want to reset all data?');
                                  if (confirmed) {
                                    actions.resetState();
                                  }
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                              >
                                Reset State
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => {
                                  const currentState = actions.getState();
                                  navigator.clipboard.writeText(JSON.stringify(currentState, null, 2));
                                  alert('State copied to clipboard!');
                                }}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                              >
                                Copy State
                              </button>
                              
                              <button
                                onClick={() => {
                                  actions.setState({
                                    email: `user${Math.floor(Math.random() * 1000)}@example.com`,
                                    age: Math.floor(Math.random() * 50) + 20,
                                    preferences: {
                                      ...state.preferences,
                                      theme: Math.random() > 0.5 ? 'light' : 'dark',
                                      notifications: Math.random() > 0.5
                                    }
                                  });
                                }}
                                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm"
                              >
                                Randomize
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-gray-50 rounded border">
                            <p className="text-sm font-medium text-gray-800 mb-3">Current State:</p>
                            <div className="space-y-2">
                              <div>
                                <span className="text-xs text-gray-600">Controlled fields:</span>
                                <div className="text-xs bg-blue-50 p-2 rounded border">
                                  {Object.keys({ name: controlledUserName }).map(key => (
                                    <div key={key}>
                                      <strong>{key}:</strong> {actions.isControlled(key as any) ? 'Yes' : 'No'}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="text-xs text-gray-600">Full state:</span>
                                <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-48">
                                  {JSON.stringify(state, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </StateManager>
              </div>
            )}

            {selectedPattern === 'decision-tree' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold">Decision Tree: When to Use Each Pattern</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="p-6 border-2 border-green-200 bg-green-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">✅ Use Controlled</h3>
                    <ul className="text-sm text-green-700 space-y-2">
                      <li>• Real-time form validation needed</li>
                      <li>• Cross-field dependencies exist</li>
                      <li>• Complex business logic required</li>
                      <li>• External state management (Redux/Zustand)</li>
                      <li>• Multi-step forms with navigation</li>
                      <li>• Field synchronization across components</li>
                      <li>• Undo/redo functionality</li>
                      <li>• Server-side validation integration</li>
                      <li>• Strict data flow requirements</li>
                      <li>• Testing requires predictable state</li>
                    </ul>
                  </div>
                  
                  <div className="p-6 border-2 border-blue-200 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">⚡ Use Uncontrolled</h3>
                    <ul className="text-sm text-blue-700 space-y-2">
                      <li>• Simple forms with minimal validation</li>
                      <li>• Performance is critical concern</li>
                      <li>• File inputs and DOM refs needed</li>
                      <li>• Third-party library integration</li>
                      <li>• Legacy codebase migration</li>
                      <li>• Quick prototypes and demos</li>
                      <li>• Submit-only validation sufficient</li>
                      <li>• Minimize React re-renders</li>
                      <li>• Native HTML behavior preferred</li>
                      <li>• Simple contact/search forms</li>
                    </ul>
                  </div>
                  
                  <div className="p-6 border-2 border-purple-200 bg-purple-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-800 mb-4">🔄 Use Hybrid</h3>
                    <ul className="text-sm text-purple-700 space-y-2">
                      <li>• Building reusable component libraries</li>
                      <li>• Need flexible API for different use cases</li>
                      <li>• Progressive enhancement approach</li>
                      <li>• Optional external control required</li>
                      <li>• Smooth migration paths needed</li>
                      <li>• Optimize developer experience</li>
                      <li>• Requirements change over time</li>
                      <li>• Enterprise component systems</li>
                      <li>• Support multiple teams/preferences</li>
                      <li>• Future-proof component design</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-6">Interactive Decision Flow Chart</h3>
                  
                  <div className="bg-white p-8 border rounded-lg shadow-sm">
                    <div className="text-center space-y-6">
                      <div className="p-4 bg-gray-100 rounded-lg inline-block max-w-md">
                        <p className="font-medium">
                          🤔 Do you need real-time field validation or cross-field synchronization?
                        </p>
                      </div>
                      
                      <div className="flex justify-center gap-16">
                        <div className="text-center">
                          <div className="p-3 bg-green-100 text-green-800 rounded-lg font-medium">
                            ✅ YES
                          </div>
                          <div className="my-3 text-2xl">↓</div>
                          <div className="p-4 bg-green-500 text-white rounded-lg shadow-lg">
                            <strong>Use Controlled</strong>
                            <p className="text-sm mt-1 opacity-90">
                              Parent manages state
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="p-3 bg-blue-100 text-blue-800 rounded-lg font-medium">
                            ❌ NO
                          </div>
                          <div className="my-3 text-2xl">↓</div>
                          <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                            <p className="font-medium text-sm">
                              🛠️ Are you building a reusable component?
                            </p>
                          </div>
                          <div className="mt-4 flex gap-8">
                            <div className="text-center">
                              <div className="p-2 bg-purple-100 text-purple-800 rounded text-sm font-medium">
                                ✅ YES
                              </div>
                              <div className="my-2 text-lg">↓</div>
                              <div className="p-3 bg-purple-500 text-white rounded-lg shadow-lg">
                                <strong className="text-sm">Hybrid</strong>
                                <p className="text-xs mt-1 opacity-90">
                                  Flexible API
                                </p>
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="p-2 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                                ❌ NO
                              </div>
                              <div className="my-2 text-lg">↓</div>
                              <div className="p-3 bg-blue-500 text-white rounded-lg shadow-lg">
                                <strong className="text-sm">Uncontrolled</strong>
                                <p className="text-xs mt-1 opacity-90">
                                  Internal state
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-3">💡 Pro Tips</h4>
                    <ul className="text-sm text-yellow-700 space-y-2">
                      <li>• Start with uncontrolled for simplicity</li>
                      <li>• Upgrade to controlled when complexity grows</li>
                      <li>• Hybrid components provide best DX</li>
                      <li>• Use refs for imperative APIs</li>
                      <li>• Consider performance implications</li>
                      <li>• Document your choice clearly</li>
                    </ul>
                  </div>
                  
                  <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-3">⚠️ Common Pitfalls</h4>
                    <ul className="text-sm text-red-700 space-y-2">
                      <li>• Mixing controlled/uncontrolled without purpose</li>
                      <li>• Overusing controlled for simple forms</li>
                      <li>• Forgetting to handle edge cases</li>
                      <li>• Not considering migration paths</li>
                      <li>• Ignoring performance implications</li>
                      <li>• Poor error handling in hybrid mode</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pattern summary */}
        <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
          <h3 className="text-lg font-semibold text-indigo-800 mb-4">Component State Management Patterns Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-indigo-700 mb-3">✅ Controlled Components</h4>
              <ul className="text-sm text-indigo-600 space-y-1">
                <li>• Parent owns and manages state</li>
                <li>• Props drive component value</li>
                <li>• Predictable, testable data flow</li>
                <li>• External validation and processing</li>
                <li>• Real-time synchronization possible</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-indigo-700 mb-3">⚡ Uncontrolled Components</h4>
              <ul className="text-sm text-indigo-600 space-y-1">
                <li>• Component manages internal state</li>
                <li>• Default values for initialization</li>
                <li>• Better performance (fewer renders)</li>
                <li>• Simpler implementation pattern</li>
                <li>• Closer to native HTML behavior</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-indigo-700 mb-3">🔄 Hybrid Approach</h4>
              <ul className="text-sm text-indigo-600 space-y-1">
                <li>• Combines benefits of both patterns</li>
                <li>• Flexible, adaptable API design</li>
                <li>• Progressive enhancement support</li>
                <li>• Enterprise-ready architecture</li>
                <li>• Best developer experience</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}