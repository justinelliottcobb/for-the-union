// useReducer with Discriminated Union Patterns
// Master advanced state management combining useReducer with discriminated unions

import { useReducer, useCallback, useEffect } from 'react';

// Learning objectives:
// - Combine discriminated unions with useReducer for type-safe actions
// - Design complex state machines with predictable transitions
// - Implement async operations with discriminated union states
// - Create reusable reducer patterns for different domains
// - Handle error states and loading patterns elegantly
// - Build undo/redo functionality with discriminated unions

// Hints:
// 1. Always define discriminated unions for both state and actions
// 2. Use exhaustive checking with `never` type for complete coverage
// 3. Keep reducers pure - no side effects or mutations
// 4. Use immer for complex state updates if needed
// 5. Implement state machine guards for valid transitions
// 6. Create action creators for better ergonomics

// TODO: Define discriminated union types for async data fetching
type AsyncState<TData, TError = string> = 
  | { status: 'idle' }
  | { status: 'loading'; progress?: number; message?: string }
  | { status: 'success'; data: TData; timestamp: Date; fromCache?: boolean }
  | { status: 'error'; error: TError; retryCount: number; lastAttempt: Date };

type AsyncAction<TData, TError = string> =
  | { type: 'FETCH_START'; message?: string }
  | { type: 'FETCH_PROGRESS'; progress: number }
  | { type: 'FETCH_SUCCESS'; data: TData; fromCache?: boolean }
  | { type: 'FETCH_ERROR'; error: TError }
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'SET_CACHE'; data: TData };

// TODO: Define shopping cart types
type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type Discount = {
  id: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  minAmount?: number;
};

type Address = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

type PaymentMethod = {
  type: 'credit_card' | 'paypal' | 'apple_pay';
  details: Record<string, any>;
};

type Order = {
  id: string;
  items: CartItem[];
  total: number;
  createdAt: Date;
};

type CheckoutPhase =
  | { phase: 'cart' }
  | { phase: 'shipping'; address: Address | null; validationErrors?: string[] }
  | { phase: 'payment'; paymentMethod: PaymentMethod | null; processing?: boolean }
  | { phase: 'processing'; orderId: string; progress: number }
  | { phase: 'complete'; order: Order }
  | { phase: 'error'; error: string; previousPhase: CheckoutPhase['phase'] };

type ShoppingCartState = {
  items: CartItem[];
  discounts: Discount[];
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  };
  checkout: CheckoutPhase;
};

type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'UPDATE_QUANTITY'; itemId: string; quantity: number }
  | { type: 'APPLY_DISCOUNT'; discount: Discount }
  | { type: 'REMOVE_DISCOUNT'; discountId: string }
  | { type: 'SET_SHIPPING_ADDRESS'; address: Address }
  | { type: 'SET_PAYMENT_METHOD'; paymentMethod: PaymentMethod }
  | { type: 'PROCEED_TO_SHIPPING' }
  | { type: 'PROCEED_TO_PAYMENT' }
  | { type: 'START_PROCESSING'; orderId: string }
  | { type: 'UPDATE_PROCESSING'; progress: number }
  | { type: 'COMPLETE_ORDER'; order: Order }
  | { type: 'CHECKOUT_ERROR'; error: string }
  | { type: 'RESET_CHECKOUT' };

// TODO: Define form wizard types
type FormStep = 'personal' | 'address' | 'preferences' | 'review' | 'complete';

type PersonalInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type Preferences = {
  newsletter: boolean;
  notifications: boolean;
  theme: 'light' | 'dark';
};

type ValidationError = {
  field: string;
  message: string;
};

type FormWizardState = {
  currentStep: FormStep;
  completedSteps: FormStep[];
  data: {
    personal: Partial<PersonalInfo>;
    address: Partial<Address>;
    preferences: Partial<Preferences>;
  };
  validation: {
    errors: ValidationError[];
    isValid: boolean;
  };
  submission: {
    status: 'idle' | 'submitting' | 'success' | 'error';
    error?: string;
    submittedAt?: Date;
  };
};

type FormWizardAction =
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'GO_TO_STEP'; step: FormStep }
  | { type: 'UPDATE_PERSONAL'; data: Partial<PersonalInfo> }
  | { type: 'UPDATE_ADDRESS'; data: Partial<Address> }
  | { type: 'UPDATE_PREFERENCES'; data: Partial<Preferences> }
  | { type: 'VALIDATE_STEP'; step: FormStep }
  | { type: 'VALIDATION_ERROR'; errors: ValidationError[] }
  | { type: 'VALIDATION_SUCCESS' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'RESET_FORM' };

// TODO: Define time travel types
type TimeTravelState<T> = {
  past: T[];
  present: T;
  future: T[];
  maxHistorySize: number;
};

type TimeTravelAction<A> =
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'JUMP_TO_PAST'; index: number }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'PRESENT'; action: A };

// TODO: Implement asyncReducer
function asyncReducer<TData, TError = string>(
  state: AsyncState<TData, TError>,
  action: AsyncAction<TData, TError>
): AsyncState<TData, TError> {
  switch (action.type) {
    case 'FETCH_START':
      return {
        status: 'loading',
        message: action.message
      };
    
    case 'FETCH_PROGRESS':
      if (state.status !== 'loading') return state;
      return {
        ...state,
        progress: action.progress
      };
    
    case 'FETCH_SUCCESS':
      return {
        status: 'success',
        data: action.data,
        timestamp: new Date(),
        fromCache: action.fromCache || false
      };
    
    case 'FETCH_ERROR':
      const retryCount = state.status === 'error' ? state.retryCount + 1 : 1;
      return {
        status: 'error',
        error: action.error,
        retryCount,
        lastAttempt: new Date()
      };
    
    case 'RETRY':
      if (state.status !== 'error') return state;
      return {
        status: 'loading',
        progress: 0,
        message: 'Retrying...'
      };
    
    case 'RESET':
      return { status: 'idle' };
    
    case 'SET_CACHE':
      return {
        status: 'success',
        data: action.data,
        timestamp: new Date(),
        fromCache: true
      };
    
    default:
      const _exhaustive: never = action;
      throw new Error(`Unhandled action: ${_exhaustive}`);
  }
}

// TODO: Implement shoppingCartReducer
function shoppingCartReducer(
  state: ShoppingCartState,
  action: CartAction
): ShoppingCartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(item => item.id === action.item.id);
      let newItems: CartItem[];
      
      if (existingIndex >= 0) {
        newItems = state.items.map((item, index) => 
          index === existingIndex 
            ? { ...item, quantity: item.quantity + action.item.quantity }
            : item
        );
      } else {
        newItems = [...state.items, action.item];
      }
      
      const totals = calculateCartTotals(newItems, state.discounts);
      return { ...state, items: newItems, totals };
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.itemId);
      const totals = calculateCartTotals(newItems, state.discounts);
      return { ...state, items: newItems, totals };
    }
    
    case 'UPDATE_QUANTITY': {
      const newItems = action.quantity === 0 
        ? state.items.filter(item => item.id !== action.itemId)
        : state.items.map(item => 
            item.id === action.itemId 
              ? { ...item, quantity: action.quantity }
              : item
          );
      const totals = calculateCartTotals(newItems, state.discounts);
      return { ...state, items: newItems, totals };
    }
    
    case 'APPLY_DISCOUNT': {
      if (state.discounts.some(d => d.id === action.discount.id)) return state;
      const newDiscounts = [...state.discounts, action.discount];
      const totals = calculateCartTotals(state.items, newDiscounts);
      return { ...state, discounts: newDiscounts, totals };
    }
    
    case 'REMOVE_DISCOUNT': {
      const newDiscounts = state.discounts.filter(d => d.id !== action.discountId);
      const totals = calculateCartTotals(state.items, newDiscounts);
      return { ...state, discounts: newDiscounts, totals };
    }
    
    case 'PROCEED_TO_SHIPPING':
      if (state.checkout.phase !== 'cart') return state;
      return { ...state, checkout: { phase: 'shipping', address: null } };
    
    case 'SET_SHIPPING_ADDRESS':
      if (state.checkout.phase !== 'shipping') return state;
      return { ...state, checkout: { phase: 'shipping', address: action.address } };
    
    case 'PROCEED_TO_PAYMENT':
      if (state.checkout.phase !== 'shipping' || !state.checkout.address) return state;
      return { ...state, checkout: { phase: 'payment', paymentMethod: null } };
    
    case 'SET_PAYMENT_METHOD':
      if (state.checkout.phase !== 'payment') return state;
      return { ...state, checkout: { phase: 'payment', paymentMethod: action.paymentMethod } };
    
    case 'START_PROCESSING':
      if (state.checkout.phase !== 'payment' || !state.checkout.paymentMethod) return state;
      return { ...state, checkout: { phase: 'processing', orderId: action.orderId, progress: 0 } };
    
    case 'UPDATE_PROCESSING':
      if (state.checkout.phase !== 'processing') return state;
      return { ...state, checkout: { ...state.checkout, progress: action.progress } };
    
    case 'COMPLETE_ORDER':
      if (state.checkout.phase !== 'processing') return state;
      return { ...state, checkout: { phase: 'complete', order: action.order } };
    
    case 'CHECKOUT_ERROR': {
      const previousPhase = state.checkout.phase;
      return { ...state, checkout: { phase: 'error', error: action.error, previousPhase } };
    }
    
    case 'RESET_CHECKOUT':
      return { ...state, checkout: { phase: 'cart' } };
    
    default:
      const _exhaustive: never = action;
      throw new Error(`Unhandled action: ${_exhaustive}`);
  }
}

// TODO: Implement formWizardReducer
function formWizardReducer(
  state: FormWizardState,
  action: FormWizardAction
): FormWizardState {
  switch (action.type) {
    case 'NEXT_STEP': {
      const stepOrder: FormStep[] = ['personal', 'address', 'preferences', 'review', 'complete'];
      const currentIndex = stepOrder.indexOf(state.currentStep);
      const nextStep = stepOrder[currentIndex + 1];
      
      if (!nextStep || !state.validation.isValid) return state;
      
      const completedSteps = [...state.completedSteps];
      if (!completedSteps.includes(state.currentStep)) {
        completedSteps.push(state.currentStep);
      }
      
      return {
        ...state,
        currentStep: nextStep,
        completedSteps,
        validation: { errors: [], isValid: true }
      };
    }
    
    case 'PREVIOUS_STEP': {
      const stepOrder: FormStep[] = ['personal', 'address', 'preferences', 'review', 'complete'];
      const currentIndex = stepOrder.indexOf(state.currentStep);
      const previousStep = stepOrder[currentIndex - 1];
      
      if (!previousStep) return state;
      
      return {
        ...state,
        currentStep: previousStep,
        validation: { errors: [], isValid: true }
      };
    }
    
    case 'GO_TO_STEP':
      if (!isStepAccessible(action.step, state.currentStep, state.completedSteps)) {
        return state;
      }
      return {
        ...state,
        currentStep: action.step,
        validation: { errors: [], isValid: true }
      };
    
    case 'UPDATE_PERSONAL':
      return {
        ...state,
        data: {
          ...state.data,
          personal: { ...state.data.personal, ...action.data }
        }
      };
    
    case 'UPDATE_ADDRESS':
      return {
        ...state,
        data: {
          ...state.data,
          address: { ...state.data.address, ...action.data }
        }
      };
    
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        data: {
          ...state.data,
          preferences: { ...state.data.preferences, ...action.data }
        }
      };
    
    case 'VALIDATE_STEP': {
      const errors = validateFormStep(action.step, state.data);
      return {
        ...state,
        validation: {
          errors,
          isValid: errors.length === 0
        }
      };
    }
    
    case 'VALIDATION_ERROR':
      return {
        ...state,
        validation: {
          errors: action.errors,
          isValid: false
        }
      };
    
    case 'VALIDATION_SUCCESS':
      return {
        ...state,
        validation: {
          errors: [],
          isValid: true
        }
      };
    
    case 'SUBMIT_START':
      if (state.currentStep !== 'review' || !state.validation.isValid) {
        return state;
      }
      return {
        ...state,
        submission: {
          status: 'submitting',
          error: undefined,
          submittedAt: undefined
        }
      };
    
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        currentStep: 'complete',
        submission: {
          status: 'success',
          error: undefined,
          submittedAt: new Date()
        }
      };
    
    case 'SUBMIT_ERROR':
      return {
        ...state,
        submission: {
          status: 'error',
          error: action.error,
          submittedAt: undefined
        }
      };
    
    case 'RESET_FORM':
      return {
        currentStep: 'personal',
        completedSteps: [],
        data: { personal: {}, address: {}, preferences: {} },
        validation: { errors: [], isValid: false },
        submission: { status: 'idle' }
      };
    
    default:
      const _exhaustive: never = action;
      throw new Error(`Unhandled action: ${_exhaustive}`);
  }
}

// TODO: Implement timeTravelReducer
function timeTravelReducer<S, A>(
  state: TimeTravelState<S>,
  action: TimeTravelAction<A>,
  baseReducer: (state: S, action: A) => S
): TimeTravelState<S> {
  switch (action.type) {
    case 'UNDO':
      if (state.past.length === 0) return state;
      
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      
      return {
        ...state,
        past: newPast,
        present: previous,
        future: [state.present, ...state.future]
      };
    
    case 'REDO':
      if (state.future.length === 0) return state;
      
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      
      return {
        ...state,
        past: [...state.past, state.present],
        present: next,
        future: newFuture
      };
    
    case 'JUMP_TO_PAST': {
      if (action.index < 0 || action.index >= state.past.length) return state;
      
      const targetState = state.past[action.index];
      const newPast = state.past.slice(0, action.index);
      const newFuture = [
        ...state.past.slice(action.index + 1),
        state.present,
        ...state.future
      ];
      
      return {
        ...state,
        past: newPast,
        present: targetState,
        future: newFuture
      };
    }
    
    case 'CLEAR_HISTORY':
      return {
        ...state,
        past: [],
        future: []
      };
    
    case 'PRESENT': {
      const newPresent = baseReducer(state.present, action.action);
      
      // Don't add to history if state didn't change
      if (newPresent === state.present) return state;
      
      let newPast = [...state.past, state.present];
      
      // Respect maxHistorySize
      if (newPast.length > state.maxHistorySize) {
        newPast = newPast.slice(-state.maxHistorySize);
      }
      
      return {
        ...state,
        past: newPast,
        present: newPresent,
        future: [] // Clear future when new action is taken
      };
    }
    
    default:
      const _exhaustive: never = action;
      throw new Error(`Unhandled action: ${_exhaustive}`);
  }
}

// TODO: Helper function to calculate cart totals
function calculateCartTotals(items: CartItem[], discounts: Discount[]): ShoppingCartState['totals'] {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  let discountAmount = 0;
  for (const discount of discounts) {
    if (discount.minAmount && subtotal < discount.minAmount) continue;
    
    if (discount.type === 'percentage') {
      discountAmount += subtotal * (discount.value / 100);
    } else {
      discountAmount += discount.value;
    }
  }
  
  const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
  const tax = (subtotal - discountAmount) * 0.085; // 8.5% tax
  const total = subtotal - discountAmount + shipping + tax;
  
  return {
    subtotal,
    tax: Math.max(0, tax),
    shipping,
    discount: discountAmount,
    total: Math.max(0, total),
  };
}

// TODO: Helper function to validate form step
function validateFormStep(step: FormStep, data: FormWizardState['data']): ValidationError[] {
  const errors: ValidationError[] = [];
  
  switch (step) {
    case 'personal':
      if (!data.personal.firstName) {
        errors.push({ field: 'firstName', message: 'First name is required' });
      }
      if (!data.personal.lastName) {
        errors.push({ field: 'lastName', message: 'Last name is required' });
      }
      if (!data.personal.email) {
        errors.push({ field: 'email', message: 'Email is required' });
      } else if (!/\S+@\S+\.\S+/.test(data.personal.email)) {
        errors.push({ field: 'email', message: 'Email is invalid' });
      }
      if (!data.personal.phone) {
        errors.push({ field: 'phone', message: 'Phone number is required' });
      }
      break;
      
    case 'address':
      if (!data.address.street) {
        errors.push({ field: 'street', message: 'Street address is required' });
      }
      if (!data.address.city) {
        errors.push({ field: 'city', message: 'City is required' });
      }
      if (!data.address.state) {
        errors.push({ field: 'state', message: 'State is required' });
      }
      if (!data.address.zipCode) {
        errors.push({ field: 'zipCode', message: 'ZIP code is required' });
      }
      break;
      
    case 'preferences':
      // All preferences are optional
      break;
      
    case 'review':
      // Validate all previous steps
      errors.push(
        ...validateFormStep('personal', data),
        ...validateFormStep('address', data),
        ...validateFormStep('preferences', data)
      );
      break;
  }
  
  return errors;
}

// TODO: Helper function to check if step is accessible
function isStepAccessible(
  targetStep: FormStep,
  currentStep: FormStep,
  completedSteps: FormStep[]
): boolean {
  const stepOrder: FormStep[] = ['personal', 'address', 'preferences', 'review', 'complete'];
  const currentIndex = stepOrder.indexOf(currentStep);
  const targetIndex = stepOrder.indexOf(targetStep);
  
  // Can't go to complete step directly
  if (targetStep === 'complete') return false;
  
  // Can always go back to previous steps
  if (targetIndex <= currentIndex) return true;
  
  // Can only go forward one step at a time
  if (targetIndex === currentIndex + 1) {
    // Can only proceed if current step is completed
    return completedSteps.includes(currentStep);
  }
  
  return false;
}

// TODO: Create custom hook useAsyncOperation
function useAsyncOperation<TData, TError = string>(
  operation: () => Promise<TData>
): [AsyncState<TData, TError>, {
  execute: () => void;
  retry: () => void;
  reset: () => void;
}] {
  const initialState: AsyncState<TData, TError> = { status: 'idle' };
  const [state, dispatch] = useReducer(asyncReducer<TData, TError>, initialState);
  
  const execute = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    
    try {
      const result = await operation();
      dispatch({ type: 'FETCH_SUCCESS', data: result });
    } catch (error) {
      dispatch({ 
        type: 'FETCH_ERROR', 
        error: error instanceof Error ? error.message as TError : 'Unknown error' as TError
      });
    }
  }, [operation]);
  
  const retry = useCallback(() => {
    dispatch({ type: 'RETRY' });
    execute();
  }, [execute]);
  
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);
  
  return [state, { execute, retry, reset }];
}

// TODO: Create custom hook useShoppingCart
function useShoppingCart(initialItems: CartItem[] = []) {
  const initialTotals = calculateCartTotals(initialItems, []);
  const initialState: ShoppingCartState = {
    items: initialItems,
    discounts: [],
    totals: initialTotals,
    checkout: { phase: 'cart' },
  };
  
  const [state, dispatch] = useReducer(shoppingCartReducer, initialState);
  
  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', item });
  }, []);
  
  const removeItem = useCallback((itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', itemId });
  }, []);
  
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', itemId, quantity });
  }, []);
  
  const applyDiscount = useCallback((discount: Discount) => {
    dispatch({ type: 'APPLY_DISCOUNT', discount });
  }, []);
  
  const proceedToShipping = useCallback(() => {
    dispatch({ type: 'PROCEED_TO_SHIPPING' });
  }, []);
  
  const setShippingAddress = useCallback((address: Address) => {
    dispatch({ type: 'SET_SHIPPING_ADDRESS', address });
  }, []);
  
  return [state, {
    addItem,
    removeItem,
    updateQuantity,
    applyDiscount,
    proceedToShipping,
    setShippingAddress,
    dispatch
  }];
}

// TODO: Create custom hook useFormWizard
function useFormWizard() {
  const initialState: FormWizardState = {
    currentStep: 'personal',
    completedSteps: [],
    data: { personal: {}, address: {}, preferences: {} },
    validation: { errors: [], isValid: false },
    submission: { status: 'idle' },
  };
  
  const [state, dispatch] = useReducer(formWizardReducer, initialState);
  
  const updatePersonal = useCallback((data: Partial<PersonalInfo>) => {
    dispatch({ type: 'UPDATE_PERSONAL', data });
  }, []);
  
  const updateAddress = useCallback((data: Partial<Address>) => {
    dispatch({ type: 'UPDATE_ADDRESS', data });
  }, []);
  
  const updatePreferences = useCallback((data: Partial<Preferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', data });
  }, []);
  
  const validateStep = useCallback((step: FormStep) => {
    dispatch({ type: 'VALIDATE_STEP', step });
  }, []);
  
  const nextStep = useCallback(() => {
    // Validate current step before proceeding
    const errors = validateFormStep(state.currentStep, state.data);
    if (errors.length > 0) {
      dispatch({ type: 'VALIDATION_ERROR', errors });
      return;
    }
    dispatch({ type: 'VALIDATION_SUCCESS' });
    dispatch({ type: 'NEXT_STEP' });
  }, [state.currentStep, state.data]);
  
  const previousStep = useCallback(() => {
    dispatch({ type: 'PREVIOUS_STEP' });
  }, []);
  
  const goToStep = useCallback((step: FormStep) => {
    dispatch({ type: 'GO_TO_STEP', step });
  }, []);
  
  const submitForm = useCallback(async () => {
    dispatch({ type: 'SUBMIT_START' });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      dispatch({ type: 'SUBMIT_SUCCESS' });
    } catch (error) {
      dispatch({ 
        type: 'SUBMIT_ERROR', 
        error: error instanceof Error ? error.message : 'Submission failed' 
      });
    }
  }, []);
  
  return [state, {
    updatePersonal,
    updateAddress,
    updatePreferences,
    validateStep,
    nextStep,
    previousStep,
    goToStep,
    submitForm,
    dispatch
  }];
}

// TODO: Create custom hook useTimeTravel
function useTimeTravel<S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S,
  maxHistorySize: number = 50
) {
  const initialTimeTravelState: TimeTravelState<S> = {
    past: [],
    present: initialState,
    future: [],
    maxHistorySize,
  };
  
  const [timeTravelState, dispatch] = useReducer(
    (state: TimeTravelState<S>, action: TimeTravelAction<A>) => 
      timeTravelReducer(state, action, reducer),
    initialTimeTravelState
  );
  
  const dispatchAction = useCallback((action: A) => {
    dispatch({ type: 'PRESENT', action });
  }, []);
  
  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);
  
  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);
  
  const jumpToPast = useCallback((index: number) => {
    dispatch({ type: 'JUMP_TO_PAST', index });
  }, []);
  
  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);
  
  return [timeTravelState, {
    dispatch: dispatchAction,
    undo,
    redo,
    jumpToPast,
    clearHistory,
    canUndo: timeTravelState.past.length > 0,
    canRedo: timeTravelState.future.length > 0
  }];
}

// Export all types and functions for testing
export {
  asyncReducer,
  shoppingCartReducer,
  formWizardReducer,
  timeTravelReducer,
  calculateCartTotals,
  validateFormStep,
  isStepAccessible,
  useAsyncOperation,
  useShoppingCart,
  useFormWizard,
  useTimeTravel,
  type AsyncState,
  type AsyncAction,
  type ShoppingCartState,
  type CartAction,
  type FormWizardState,
  type FormWizardAction,
  type TimeTravelState,
  type TimeTravelAction,
  type CartItem,
  type Discount,
  type CheckoutPhase,
  type FormStep,
  type PersonalInfo,
  type Preferences,
  type ValidationError,
};