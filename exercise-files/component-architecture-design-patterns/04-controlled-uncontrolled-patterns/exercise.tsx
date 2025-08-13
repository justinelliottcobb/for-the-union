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
  
  // TODO: Implement internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasBlurred, setHasBlurred] = useState(false);
  
  const localInputRef = useRef<HTMLInputElement>(null);
  const actualInputRef = inputRef || localInputRef;
  
  // TODO: Get current value based on controlled/uncontrolled mode
  const currentValue = isControlled ? value : internalValue;
  
  // TODO: Implement validation logic
  const validateValue = useCallback((val: string): string | null => {
    if (validator) {
      return validator(val);
    }
    return null;
  }, [validator]);
  
  // TODO: Handle value changes
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
  
  // TODO: Handle blur validation
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
  
  // TODO: Handle clear functionality
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
  
  // TODO: Implement imperative handle
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
  }), [currentValue, handleClear, isControlled, validator, validateValue, validationError]);
  
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
          className={[
            "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
            shouldShowValidation ? "border-red-500" : "border-gray-300",
            clearButton && currentValue ? "pr-10" : "",
            className || ""
          ].filter(Boolean).join(" ")}
        />
        
        {clearButton && currentValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
      
      {shouldShowValidation && (
        <p className="mt-1 text-sm text-red-600">
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
  // TODO: Internal state for uncontrolled/hybrid modes
  const [internalValues, setInternalValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fields.forEach(field => {
      initial[field.name] = field.defaultValue || '';
    });
    return initial;
  });
  
  const [internalErrors, setInternalErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  
  // TODO: Determine values and errors based on mode
  const currentValues = mode === 'controlled' ? (controlledValues || {}) : internalValues;
  const currentErrors = mode === 'controlled' ? (controlledErrors || {}) : internalErrors;
  
  // TODO: Field change handler
  const handleFieldChange = useCallback((fieldName: string, value: string, isValid: boolean) => {
    const newValues = { ...currentValues, [fieldName]: value };
    const newErrors = { ...currentErrors };
    
    // Update error state
    if (isValid) {
      delete newErrors[fieldName];
    } else {
      // Error will be set by field validation
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
  }, [currentValues, currentErrors, mode, controlledOnChange, onFieldChange]);
  
  // TODO: Validation helpers
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
    
    // Custom validation
    if (field.validator) {
      return field.validator(value);
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
  
  // TODO: Form submission
  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    
    let isValid = true;
    if (validateOnSubmit) {
      isValid = validateAllFields();
    }
    
    if (isValid && onSubmit) {
      onSubmit(currentValues);
    }
  }, [validateOnSubmit, validateAllFields, onSubmit, currentValues]);
  
  // TODO: Form reset
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
  const validationErrors = Object.values(currentErrors).filter(Boolean);
  const hasErrors = validationErrors.length > 0;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => {
        const fieldError = currentErrors[field.name];
        const shouldValidateField = field.controlled !== false && mode !== 'uncontrolled';
        
        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            <FlexibleInput
              id={field.name}
              name={field.name}
              type={field.type || 'text'}
              value={shouldValidateField ? currentValues[field.name] : undefined}
              defaultValue={shouldValidateField ? undefined : field.defaultValue}
              onChange={shouldValidateField ? (value) => handleFieldChange(field.name, value, !validateField(field, value)) : undefined}
              validator={field.validator || ((value) => validateField(field, value))}
              validateOnBlur={true}
              validateOnChange={submitAttempted}
              showValidation={true}
              clearButton={true}
              onStateChange={shouldValidateField ? ({ value, error }) => {
                const newErrors = { ...currentErrors };
                if (error) {
                  newErrors[field.name] = error;
                } else {
                  delete newErrors[field.name];
                }
                
                if (mode !== 'controlled') {
                  setInternalErrors(newErrors);
                }
              } : undefined}
            />
            
            {fieldError && (
              <p className="mt-1 text-sm text-red-600">{fieldError}</p>
            )}
          </div>
        );
      })}
      
      {showValidationSummary && submitAttempted && hasErrors && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex gap-4">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {submitText}
        </button>
        
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
  // TODO: Initialize state with persistence support
  const [internalState, setInternalState] = useState<T>(() => {
    if (persistKey) {
      try {
        const storage = persistTo === 'localStorage' ? localStorage : sessionStorage;
        const saved = storage.getItem(persistKey);
        if (saved) {
          const parsedState = JSON.parse(saved);
          return { ...initialState, ...parsedState };
        }
      } catch (error) {
        if (debug) {
          console.warn('Failed to load persisted state:', error);
        }
      }
    }
    return initialState;
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // TODO: Compute current state (controlled + uncontrolled)
  const currentState = useMemo(() => {
    return { ...internalState, ...controlled } as T;
  }, [internalState, controlled]);
  
  // TODO: Persist state changes
  useEffect(() => {
    if (persistKey) {
      try {
        const storage = persistTo === 'localStorage' ? localStorage : sessionStorage;
        storage.setItem(persistKey, JSON.stringify(internalState));
      } catch (error) {
        if (debug) {
          console.warn('Failed to persist state:', error);
        }
      }
    }
  }, [internalState, persistKey, persistTo, debug]);
  
  // TODO: State update handler
  const setState = useCallback((updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setInternalState(prev => {
      const newUpdates = typeof updates === 'function' ? updates(prev) : updates;
      const newState = { ...prev, ...newUpdates };
      
      if (debug) {
        console.log('StateManager update:', { prev, updates: newUpdates, next: newState });
      }
      
      // Validate new state
      if (validator) {
        const errors = validator(newState);
        setValidationErrors(errors);
      }
      
      // Call external onChange
      if (onChange) {
        onChange(newState);
      }
      
      return newState;
    });
  }, [onChange, validator, debug]);
  
  // TODO: State reset handler
  const resetState = useCallback((newState?: T) => {
    const resetTo = newState || initialState;
    setInternalState(resetTo);
    setValidationErrors({});
    
    if (onChange) {
      onChange(resetTo);
    }
    
    if (debug) {
      console.log('StateManager reset:', resetTo);
    }
  }, [initialState, onChange, debug]);
  
  // TODO: State validation
  const validate = useCallback(() => {
    if (validator) {
      const errors = validator(currentState);
      setValidationErrors(errors);
      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    }
    return { isValid: true, errors: {} };
  }, [validator, currentState]);
  
  // TODO: Check if field is controlled
  const isControlled = useCallback((key: keyof T) => {
    return key in controlled;
  }, [controlled]);
  
  // Create actions object
  const actions: StateActions<T> = {
    setState,
    resetState,
    getState: () => currentState,
    isControlled,
    validate
  };
  
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

// TODO: Implement demo component showcasing controlled/uncontrolled patterns
export default function ControlledUncontrolledDemo() {
  const [selectedPattern, setSelectedPattern] = useState<'flexible' | 'form' | 'state-manager' | 'decision-tree'>('flexible');
  
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

        {/* TODO: Implement pattern selection and examples */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-600">
            Implement the pattern selection and comprehensive examples here.
            The exercise should demonstrate FlexibleInput, SmartForm, StateManager, and decision tree patterns.
          </p>
        </div>
      </div>
    </div>
  );
}