import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef, useMemo } from 'react';

// Controlled vs Uncontrolled Component Patterns
// Learn when to use each pattern and how to implement hybrid approaches

// TODO: Implement FlexibleInput component that can work in both controlled and uncontrolled modes

interface FlexibleInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'> {
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
  // TODO: Determine if component is controlled or uncontrolled
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
  
  const inputClassName = [
    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
    shouldShowValidation ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400',
    clearButton && currentValue ? 'pr-10' : '',
    className || ''
  ].filter(Boolean).join(' ');

  return (
    <div className="relative">
      <div className="relative">
        <input
          {...props}
          ref={actualInputRef}
          value={currentValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={inputClassName}
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

// TODO: Implement SmartForm component with intelligent field management
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
  
  // TODO: Implement validation helpers
  const validateField = useCallback((field: FormField, value: string): string | null => {
    // Required validation
    if (field.required && !value.trim()) {
      return field.label + ' is required';
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
        console.warn('Validation error for field ' + field.name + ':', error);
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
              style={{ width: progress + '%' }}
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

// TODO: Implement StateManager for complex hybrid patterns
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
          (newState as any)[key] = value;
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

// TODO: Implement demo data and examples
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

// TODO: Implement demo component showcasing controlled/uncontrolled patterns
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

        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-600">
            TODO: Implement comprehensive examples showcasing flexible input, smart form, state manager, 
            and decision tree patterns for controlled vs uncontrolled component architectures.
          </p>
        </div>
      </div>
    </div>
  );
}