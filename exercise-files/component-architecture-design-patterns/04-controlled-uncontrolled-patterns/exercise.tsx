import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

// Controlled vs Uncontrolled Component Patterns
// Learn when to use each pattern and how to implement hybrid approaches

// TODO: Implement FlexibleInput component that can work in both controlled and uncontrolled modes
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
  }, [validateOnBlur, validator, validateValue, currentValue, onStateChange, props.onBlur]);
  
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
          className={`
            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
            ${shouldShowValidation ? 'border-red-500' : 'border-gray-300'}
            ${clearButton && currentValue ? 'pr-10' : ''}
            ${className || ''}
          `}
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
  
  // State for controlled examples
  const [controlledInputValue, setControlledInputValue] = useState('');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
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
        <div className="flex justify-center space-x-4">
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
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
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
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">FlexibleInput Component</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Controlled Mode</h3>
                    <p className="text-sm text-gray-600">
                      Parent component manages the value state
                    </p>
                    
                    <FlexibleInput
                      value={controlledInputValue}
                      onChange={(value) => setControlledInputValue(value)}
                      placeholder="Controlled input..."
                      validator={(value) => value.length < 3 ? 'Must be at least 3 characters' : null}
                      clearButton
                    />
                    
                    <p className="text-sm text-gray-500">
                      Current value: "{controlledInputValue}"
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Uncontrolled Mode</h3>
                    <p className="text-sm text-gray-600">
                      Component manages its own state internally
                    </p>
                    
                    <FlexibleInput
                      defaultValue="Initial value"
                      placeholder="Uncontrolled input..."
                      validator={(value) => value.includes('@') ? null : 'Must contain @ symbol'}
                      clearButton
                      onStateChange={(state) => console.log('State changed:', state)}
                    />
                    
                    <p className="text-sm text-gray-500">
                      Check console for state changes
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Imperative API</h3>
                  
                  <div className="flex gap-4">
                    {(() => {
                      const inputRef = useRef<{ focus: () => void; clear: () => void; validate: () => boolean }>(null);
                      
                      return (
                        <>
                          <FlexibleInput
                            ref={inputRef}
                            defaultValue="Test imperative API"
                            placeholder="Imperative API demo..."
                            validator={(value) => value.length > 10 ? null : 'Must be longer than 10 characters'}
                          />
                          
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => inputRef.current?.focus()}
                              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Focus
                            </button>
                            <button
                              onClick={() => inputRef.current?.clear()}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => {
                                const isValid = inputRef.current?.validate();
                                alert(`Valid: ${isValid}`);
                              }}
                              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Validate
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {selectedPattern === 'form' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">SmartForm Component</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Hybrid Mode (Recommended)</h3>
                    <p className="text-sm text-gray-600">
                      Form manages state internally but provides external control
                    </p>
                    
                    <SmartForm
                      fields={[
                        {
                          name: 'name',
                          label: 'Full Name',
                          required: true,
                          validator: (value) => value.length < 2 ? 'Name must be at least 2 characters' : null
                        },
                        {
                          name: 'email',
                          label: 'Email Address',
                          type: 'email',
                          required: true
                        },
                        {
                          name: 'phone',
                          label: 'Phone Number',
                          validator: (value) => {
                            if (!value) return null;
                            const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
                            return phoneRegex.test(value) ? null : 'Please enter a valid phone number';
                          }
                        }
                      ]}
                      onSubmit={(data) => {
                        alert('Form submitted!\n' + JSON.stringify(data, null, 2));
                      }}
                      onFieldChange={(name, value, isValid) => {
                        console.log(`Field ${name}: ${value} (valid: ${isValid})`);
                      }}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Controlled Mode</h3>
                    <p className="text-sm text-gray-600">
                      Parent component fully controls form state
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
                          validator: (value) => {
                            if (value.length < 3) return 'Username must be at least 3 characters';
                            if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
                            return null;
                          }
                        },
                        {
                          name: 'password',
                          label: 'Password',
                          type: 'password',
                          required: true,
                          validator: (value) => {
                            if (value.length < 8) return 'Password must be at least 8 characters';
                            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) return 'Password must contain uppercase, lowercase, and number';
                            return null;
                          }
                        }
                      ]}
                      onSubmit={(data) => {
                        alert('Controlled form submitted!\n' + JSON.stringify(data, null, 2));
                      }}
                    />
                    
                    <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
                      <p className="font-medium">External State:</p>
                      <pre className="mt-2 text-xs">{JSON.stringify({ formValues, formErrors }, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPattern === 'state-manager' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">StateManager Component</h2>
                
                <StateManager
                  initialState={initialUser}
                  persistKey="demo-user"
                  validator={(state) => {
                    const errors: Record<string, string> = {};
                    if (!state.name.trim()) errors.name = 'Name is required';
                    if (!state.email.includes('@')) errors.email = 'Invalid email';
                    if (state.age < 0 || state.age > 120) errors.age = 'Age must be between 0 and 120';
                    return errors;
                  }}
                  debug
                >
                  {(state, actions) => (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">User Profile</h3>
                          
                          <div className="space-y-3">
                            <FlexibleInput
                              value={state.name}
                              onChange={(value) => actions.setState({ name: value })}
                              placeholder="Enter your name..."
                              validator={(value) => !value.trim() ? 'Name is required' : null}
                            />
                            
                            <FlexibleInput
                              value={state.email}
                              onChange={(value) => actions.setState({ email: value })}
                              placeholder="Enter your email..."
                              type="email"
                            />
                            
                            <FlexibleInput
                              value={state.age.toString()}
                              onChange={(value) => actions.setState({ age: parseInt(value) || 0 })}
                              placeholder="Enter your age..."
                              type="number"
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="font-medium">Preferences</h4>
                            
                            <div className="space-y-2">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name="theme"
                                  checked={state.preferences.theme === 'light'}
                                  onChange={() => actions.setState({
                                    preferences: { ...state.preferences, theme: 'light' }
                                  })}
                                />
                                <span>Light theme</span>
                              </label>
                              
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name="theme"
                                  checked={state.preferences.theme === 'dark'}
                                  onChange={() => actions.setState({
                                    preferences: { ...state.preferences, theme: 'dark' }
                                  })}
                                />
                                <span>Dark theme</span>
                              </label>
                            </div>
                            
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={state.preferences.notifications}
                                onChange={(e) => actions.setState({
                                  preferences: { ...state.preferences, notifications: e.target.checked }
                                })}
                              />
                              <span>Enable notifications</span>
                            </label>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">State Debug</h3>
                          
                          <div className="space-y-3">
                            <button
                              onClick={() => {
                                const validation = actions.validate();
                                alert(`Valid: ${validation.isValid}\nErrors: ${JSON.stringify(validation.errors, null, 2)}`);
                              }}
                              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Validate State
                            </button>
                            
                            <button
                              onClick={() => actions.resetState()}
                              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Reset State
                            </button>
                            
                            <button
                              onClick={() => {
                                const currentState = actions.getState();
                                alert(JSON.stringify(currentState, null, 2));
                              }}
                              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Log State
                            </button>
                          </div>
                          
                          <div className="p-4 bg-gray-100 rounded">
                            <p className="text-sm font-medium mb-2">Current State:</p>
                            <pre className="text-xs overflow-auto">
                              {JSON.stringify(state, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </StateManager>
              </div>
            )}

            {selectedPattern === 'decision-tree' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Decision Tree: When to Use Each Pattern</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="p-6 border-2 border-green-200 bg-green-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">✅ Use Controlled</h3>
                    <ul className="text-sm text-green-700 space-y-2">
                      <li>• Form validation on every keystroke</li>
                      <li>• Real-time field synchronization</li>
                      <li>• Complex business logic</li>
                      <li>• External state management (Redux, Zustand)</li>
                      <li>• Multi-step forms with navigation</li>
                      <li>• Field interdependencies</li>
                      <li>• Undo/redo functionality</li>
                      <li>• Server-side validation integration</li>
                    </ul>
                  </div>
                  
                  <div className="p-6 border-2 border-blue-200 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">⚡ Use Uncontrolled</h3>
                    <ul className="text-sm text-blue-700 space-y-2">
                      <li>• Simple forms with minimal validation</li>
                      <li>• Performance-critical applications</li>
                      <li>• File inputs and refs</li>
                      <li>• Third-party library integration</li>
                      <li>• Legacy code migration</li>
                      <li>• Quick prototypes</li>
                      <li>• Submit-only validation</li>
                      <li>• Minimal React re-renders</li>
                    </ul>
                  </div>
                  
                  <div className="p-6 border-2 border-purple-200 bg-purple-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-purple-800 mb-4">🔄 Use Hybrid</h3>
                    <ul className="text-sm text-purple-700 space-y-2">
                      <li>• Flexible component APIs</li>
                      <li>• Library/framework development</li>
                      <li>• Progressive enhancement</li>
                      <li>• Optional external control</li>
                      <li>• Migration paths</li>
                      <li>• Developer experience optimization</li>
                      <li>• Conditional requirements</li>
                      <li>• Enterprise component systems</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Decision Flow Chart</h3>
                  
                  <div className="bg-white p-6 border rounded-lg">
                    <div className="text-center space-y-4">
                      <div className="p-4 bg-gray-100 rounded-lg inline-block">
                        <p className="font-medium">Do you need real-time field validation or synchronization?</p>
                      </div>
                      
                      <div className="flex justify-center gap-8">
                        <div className="text-center">
                          <div className="p-2 bg-green-100 text-green-800 rounded">YES</div>
                          <div className="mt-2 text-sm">↓</div>
                          <div className="p-3 bg-green-500 text-white rounded">
                            Use Controlled
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="p-2 bg-blue-100 text-blue-800 rounded">NO</div>
                          <div className="mt-2 text-sm">↓</div>
                          <div className="p-4 bg-gray-100 rounded-lg">
                            <p className="font-medium text-sm">Are you building a reusable component?</p>
                          </div>
                          <div className="mt-2 flex gap-4">
                            <div className="text-center">
                              <div className="p-1 bg-purple-100 text-purple-800 rounded text-sm">YES</div>
                              <div className="mt-1 text-xs">↓</div>
                              <div className="p-2 bg-purple-500 text-white rounded text-sm">
                                Use Hybrid
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="p-1 bg-blue-100 text-blue-800 rounded text-sm">NO</div>
                              <div className="mt-1 text-xs">↓</div>
                              <div className="p-2 bg-blue-500 text-white rounded text-sm">
                                Use Uncontrolled
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">💡 Pro Tips</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Start with uncontrolled for simplicity, upgrade to controlled when needed</li>
                    <li>• Hybrid components provide the best developer experience</li>
                    <li>• Use refs for imperative APIs (focus, validation, etc.)</li>
                    <li>• Consider performance implications of frequent re-renders</li>
                    <li>• Document your choice clearly for other developers</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pattern explanation */}
        <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
          <h3 className="text-lg font-semibold text-indigo-800 mb-3">Component State Management Patterns</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-indigo-700 mb-2">Controlled Components</h4>
              <ul className="text-sm text-indigo-600 space-y-1">
                <li>• Parent owns the state</li>
                <li>• Props drive component value</li>
                <li>• Predictable data flow</li>
                <li>• External validation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-indigo-700 mb-2">Uncontrolled Components</h4>
              <ul className="text-sm text-indigo-600 space-y-1">
                <li>• Component owns the state</li>
                <li>• Default values initialize</li>
                <li>• Better performance</li>
                <li>• Simpler implementation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-indigo-700 mb-2">Hybrid Approach</h4>
              <ul className="text-sm text-indigo-600 space-y-1">
                <li>• Best of both worlds</li>
                <li>• Flexible API design</li>
                <li>• Progressive enhancement</li>
                <li>• Enterprise-ready</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}