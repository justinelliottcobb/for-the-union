// Solution: useReducer with Discriminated Union Patterns
// Complete implementation of advanced state management patterns

import { useReducer, useCallback, useEffect, useState } from 'react';

// Discriminated union types for async data fetching
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

// Shopping cart types
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
  code: string;
  minAmount?: number;
};

type CartState = {
  items: CartItem[];
  discounts: Discount[];
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
  };
  meta: {
    itemCount: number;
    lastUpdated: Date;
  };
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'APPLY_DISCOUNT'; payload: Discount }
  | { type: 'REMOVE_DISCOUNT'; payload: { code: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'CALCULATE_TOTALS' };

// Undo/redo types
type UndoRedoState<T> = {
  past: T[];
  present: T;
  future: T[];
  maxHistorySize: number;
};

type UndoRedoAction<T> =
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'ADD_STATE'; payload: T }
  | { type: 'CLEAR_HISTORY' };

// Form validation types
type ValidationResult<T> = 
  | { status: 'valid'; value: T }
  | { status: 'invalid'; errors: ValidationError[] };

type ValidationError = {
  field: string;
  message: string;
  code: string;
};

type FormState<T> = {
  data: T;
  validation: ValidationResult<T>;
  submission: {
    isSubmitting: boolean;
    hasSubmitted: boolean;
    error: string | null;
  };
  meta: {
    isDirty: boolean;
    touchedFields: Set<keyof T>;
  };
};

type FormAction<T> =
  | { type: 'UPDATE_FIELD'; payload: { field: keyof T; value: any } }
  | { type: 'VALIDATE' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; payload: { error: string } }
  | { type: 'RESET' };

// Async data reducer
function asyncDataReducer<TData, TError = string>(
  state: AsyncState<TData, TError>,
  action: AsyncAction<TData, TError>
): AsyncState<TData, TError> {
  switch (action.type) {
    case 'FETCH_START':
      return {
        status: 'loading',
        progress: 0,
        message: action.message,
      };

    case 'FETCH_PROGRESS':
      if (state.status !== 'loading') return state;
      return {
        ...state,
        progress: action.progress,
      };

    case 'FETCH_SUCCESS':
      return {
        status: 'success',
        data: action.data,
        timestamp: new Date(),
        fromCache: action.fromCache || false,
      };

    case 'FETCH_ERROR':
      return {
        status: 'error',
        error: action.error,
        retryCount: state.status === 'error' ? state.retryCount + 1 : 1,
        lastAttempt: new Date(),
      };

    case 'RETRY':
      if (state.status !== 'error') return state;
      return {
        status: 'loading',
        progress: 0,
        message: 'Retrying...',
      };

    case 'RESET':
      return { status: 'idle' };

    case 'SET_CACHE':
      return {
        status: 'success',
        data: action.data,
        timestamp: new Date(),
        fromCache: true,
      };

    default:
      const _exhaustive: never = action;
      return state;
  }
}

// Shopping cart reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
          meta: {
            ...state.meta,
            lastUpdated: new Date(),
          },
        };
      }

      return {
        ...state,
        items: [...state.items, action.payload],
        meta: {
          itemCount: state.meta.itemCount + 1,
          lastUpdated: new Date(),
        },
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id),
        meta: {
          itemCount: Math.max(0, state.meta.itemCount - 1),
          lastUpdated: new Date(),
        },
      };

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { id: action.payload.id } });
      }

      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
        meta: {
          ...state.meta,
          lastUpdated: new Date(),
        },
      };
    }

    case 'APPLY_DISCOUNT': {
      const exists = state.discounts.some(d => d.code === action.payload.code);
      if (exists) return state;

      return {
        ...state,
        discounts: [...state.discounts, action.payload],
        meta: {
          ...state.meta,
          lastUpdated: new Date(),
        },
      };
    }

    case 'REMOVE_DISCOUNT':
      return {
        ...state,
        discounts: state.discounts.filter(d => d.code !== action.payload.code),
        meta: {
          ...state.meta,
          lastUpdated: new Date(),
        },
      };

    case 'CLEAR_CART':
      return {
        items: [],
        discounts: [],
        totals: {
          subtotal: 0,
          discount: 0,
          tax: 0,
          shipping: 0,
          total: 0,
        },
        meta: {
          itemCount: 0,
          lastUpdated: new Date(),
        },
      };

    case 'CALCULATE_TOTALS': {
      const subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const discount = state.discounts.reduce((sum, disc) => {
        if (disc.minAmount && subtotal < disc.minAmount) return sum;
        
        if (disc.type === 'percentage') {
          return sum + (subtotal * disc.value / 100);
        } else {
          return sum + disc.value;
        }
      }, 0);

      const discountedSubtotal = Math.max(0, subtotal - discount);
      const tax = discountedSubtotal * 0.08; // 8% tax
      const shipping = discountedSubtotal > 50 ? 0 : 9.99;
      const total = discountedSubtotal + tax + shipping;

      return {
        ...state,
        totals: {
          subtotal,
          discount,
          tax,
          shipping,
          total,
        },
      };
    }

    default:
      const _exhaustive: never = action;
      return state;
  }
}

// Undo/redo reducer
function undoRedoReducer<T>(
  state: UndoRedoState<T>,
  action: UndoRedoAction<T>
): UndoRedoState<T> {
  switch (action.type) {
    case 'UNDO': {
      if (state.past.length === 0) return state;
      
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      
      return {
        ...state,
        past: newPast,
        present: previous,
        future: [state.present, ...state.future].slice(0, state.maxHistorySize),
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      
      return {
        ...state,
        past: [...state.past, state.present].slice(-state.maxHistorySize),
        present: next,
        future: newFuture,
      };
    }

    case 'ADD_STATE': {
      return {
        ...state,
        past: [...state.past, state.present].slice(-state.maxHistorySize),
        present: action.payload,
        future: [],
      };
    }

    case 'CLEAR_HISTORY':
      return {
        ...state,
        past: [],
        future: [],
      };

    default:
      const _exhaustive: never = action;
      return state;
  }
}

// Custom hooks
function useAsyncData<TData>(
  fetcher: () => Promise<TData>,
  dependencies: any[] = []
) {
  const [state, dispatch] = useReducer(asyncDataReducer<TData>, { status: 'idle' });

  const fetchData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    
    try {
      const data = await fetcher();
      dispatch({ type: 'FETCH_SUCCESS', data });
    } catch (error) {
      dispatch({ type: 'FETCH_ERROR', error: error.message });
    }
  }, dependencies);

  const retry = useCallback(() => {
    if (state.status === 'error') {
      dispatch({ type: 'RETRY' });
      fetchData();
    }
  }, [state.status, fetchData]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    actions: {
      fetch: fetchData,
      retry,
      reset,
    },
  };
}

function useShoppingCart() {
  const initialState: CartState = {
    items: [],
    discounts: [],
    totals: {
      subtotal: 0,
      discount: 0,
      tax: 0,
      shipping: 0,
      total: 0,
    },
    meta: {
      itemCount: 0,
      lastUpdated: new Date(),
    },
  };

  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Auto-calculate totals when items or discounts change
  useEffect(() => {
    dispatch({ type: 'CALCULATE_TOTALS' });
  }, [state.items, state.discounts]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { ...item, quantity: item.quantity || 1 },
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, []);

  const applyDiscount = useCallback((discount: Discount) => {
    dispatch({ type: 'APPLY_DISCOUNT', payload: discount });
  }, []);

  const removeDiscount = useCallback((code: string) => {
    dispatch({ type: 'REMOVE_DISCOUNT', payload: { code } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  return {
    state,
    actions: {
      addItem,
      removeItem,
      updateQuantity,
      applyDiscount,
      removeDiscount,
      clearCart,
    },
  };
}

function useUndoRedo<T>(initialState: T, maxHistorySize: number = 50) {
  const [state, dispatch] = useReducer(undoRedoReducer<T>, {
    past: [],
    present: initialState,
    future: [],
    maxHistorySize,
  });

  const addState = useCallback((newState: T) => {
    dispatch({ type: 'ADD_STATE', payload: newState });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  return {
    state: state.present,
    canUndo,
    canRedo,
    actions: {
      addState,
      undo,
      redo,
      clearHistory,
    },
  };
}

// Demo components
function DataFetcher() {
  const mockFetcher = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (Math.random() > 0.7) {
      throw new Error('Random network error');
    }
    return [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ];
  };

  const { state, actions } = useAsyncData(mockFetcher);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '10px' }}>
      <h3>Data Fetcher with Async State</h3>
      
      {state.status === 'idle' && (
        <div>
          <p>Click fetch to load data</p>
          <button onClick={actions.fetch}>Fetch Data</button>
        </div>
      )}
      
      {state.status === 'loading' && (
        <div>
          <p>Loading... {state.progress !== undefined && `${state.progress}%`}</p>
          {state.message && <p><em>{state.message}</em></p>}
        </div>
      )}
      
      {state.status === 'success' && (
        <div>
          <p>✅ Data loaded successfully!</p>
          <p>From cache: {state.fromCache ? 'Yes' : 'No'}</p>
          <p>Loaded at: {state.timestamp.toLocaleTimeString()}</p>
          <pre>{JSON.stringify(state.data, null, 2)}</pre>
          <button onClick={actions.fetch}>Refetch</button>
          <button onClick={actions.reset}>Reset</button>
        </div>
      )}
      
      {state.status === 'error' && (
        <div>
          <p>❌ Error: {state.error}</p>
          <p>Retry count: {state.retryCount}</p>
          <p>Last attempt: {state.lastAttempt.toLocaleTimeString()}</p>
          <button onClick={actions.retry}>Retry</button>
          <button onClick={actions.reset}>Reset</button>
        </div>
      )}
    </div>
  );
}

function ShoppingCartComponent() {
  const { state, actions } = useShoppingCart();

  const sampleProducts = [
    { id: '1', name: 'Laptop', price: 999.99, image: '💻' },
    { id: '2', name: 'Mouse', price: 29.99, image: '🖱️' },
    { id: '3', name: 'Keyboard', price: 79.99, image: '⌨️' },
  ];

  const sampleDiscounts = [
    { id: '1', type: 'percentage' as const, value: 10, code: 'SAVE10', minAmount: 50 },
    { id: '2', type: 'fixed' as const, value: 25, code: 'FLAT25', minAmount: 100 },
  ];

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '10px' }}>
      <h3>Shopping Cart with Complex State</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Products</h4>
        {sampleProducts.map(product => (
          <div key={product.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>{product.image}</span>
            <span style={{ marginRight: '10px' }}>{product.name} - ${product.price}</span>
            <button onClick={() => actions.addItem(product)}>Add to Cart</button>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Cart Items ({state.meta.itemCount})</h4>
        {state.items.length === 0 ? (
          <p>Cart is empty</p>
        ) : (
          state.items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ marginRight: '10px' }}>{item.name}</span>
              <span style={{ marginRight: '10px' }}>Qty: {item.quantity}</span>
              <span style={{ marginRight: '10px' }}>${(item.price * item.quantity).toFixed(2)}</span>
              <button onClick={() => actions.updateQuantity(item.id, item.quantity + 1)}>+</button>
              <button onClick={() => actions.updateQuantity(item.id, item.quantity - 1)}>-</button>
              <button onClick={() => actions.removeItem(item.id)}>Remove</button>
            </div>
          ))
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Discounts</h4>
        {sampleDiscounts.map(discount => (
          <div key={discount.id} style={{ marginBottom: '10px' }}>
            <span style={{ marginRight: '10px' }}>
              {discount.code} - {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`} off
              {discount.minAmount && ` (min $${discount.minAmount})`}
            </span>
            <button 
              onClick={() => actions.applyDiscount(discount)}
              disabled={state.discounts.some(d => d.code === discount.code)}
            >
              Apply
            </button>
          </div>
        ))}
        
        {state.discounts.length > 0 && (
          <div>
            <h5>Applied Discounts:</h5>
            {state.discounts.map(discount => (
              <div key={discount.code} style={{ marginBottom: '5px' }}>
                <span style={{ marginRight: '10px' }}>{discount.code}</span>
                <button onClick={() => actions.removeDiscount(discount.code)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <h4>Totals</h4>
        <p>Subtotal: ${state.totals.subtotal.toFixed(2)}</p>
        <p>Discount: -${state.totals.discount.toFixed(2)}</p>
        <p>Tax: ${state.totals.tax.toFixed(2)}</p>
        <p>Shipping: ${state.totals.shipping.toFixed(2)}</p>
        <p><strong>Total: ${state.totals.total.toFixed(2)}</strong></p>
      </div>

      <button onClick={actions.clearCart} disabled={state.items.length === 0}>
        Clear Cart
      </button>
    </div>
  );
}

function UndoRedoDemo() {
  const [counter, setCounter] = useState(0);
  const { state: historyState, canUndo, canRedo, actions } = useUndoRedo(counter);

  const increment = () => {
    const newValue = historyState + 1;
    setCounter(newValue);
    actions.addState(newValue);
  };

  const decrement = () => {
    const newValue = historyState - 1;
    setCounter(newValue);
    actions.addState(newValue);
  };

  const handleUndo = () => {
    actions.undo();
    setCounter(historyState);
  };

  const handleRedo = () => {
    actions.redo();
    setCounter(historyState);
  };

  // Sync counter with history state
  useEffect(() => {
    setCounter(historyState);
  }, [historyState]);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '10px' }}>
      <h3>Undo/Redo Counter Demo</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Counter: {counter}</h2>
        <button onClick={increment}>Increment</button>
        <button onClick={decrement}>Decrement</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleUndo} disabled={!canUndo}>
          ⬅️ Undo {canUndo && `(${canUndo})`}
        </button>
        <button onClick={handleRedo} disabled={!canRedo}>
          ➡️ Redo {canRedo && `(${canRedo})`}
        </button>
        <button onClick={actions.clearHistory}>Clear History</button>
      </div>

      <div style={{ fontSize: '12px', color: '#666' }}>
        <p>Can Undo: {canUndo ? 'Yes' : 'No'}</p>
        <p>Can Redo: {canRedo ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}

// Main demo component
export default function UseReducerPatternsDemo() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>useReducer with Discriminated Union Patterns</h1>
      <p>Demonstration of advanced state management patterns using useReducer and discriminated unions.</p>
      
      <DataFetcher />
      <ShoppingCartComponent />
      <UndoRedoDemo />
    </div>
  );
}

// Export individual components for testing
export {
  DataFetcher,
  ShoppingCartComponent,
  UndoRedoDemo,
  useAsyncData,
  useShoppingCart,
  useUndoRedo,
  asyncDataReducer,
  cartReducer,
  undoRedoReducer,
  type AsyncState,
  type AsyncAction,
  type CartState,
  type CartAction,
  type UndoRedoState,
  type UndoRedoAction,
  type ValidationResult,
  type FormState,
};