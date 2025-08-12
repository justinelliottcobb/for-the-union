// Solution: Discriminated Union State Patterns
// Complete implementation of advanced domain modeling with discriminated unions

import React, { useState, useReducer, useCallback, useEffect } from 'react';

// Entity lifecycle discriminated unions
type EntityState<T> = 
  | { status: 'draft'; data: T; validationErrors: ValidationError[] }
  | { status: 'pending'; data: T; submittedAt: Date; submittedBy: string }
  | { status: 'approved'; data: T; approvedAt: Date; approvedBy: string; version: number }
  | { status: 'rejected'; data: T; rejectedAt: Date; rejectedBy: string; reason: string }
  | { status: 'published'; data: T; publishedAt: Date; url: string }
  | { status: 'archived'; data: T; archivedAt: Date; reason: string };

// Validation result discriminated unions
type ValidationResult<T> = 
  | { status: 'valid'; value: T; warnings?: string[] }
  | { status: 'invalid'; errors: ValidationError[]; partialValue?: Partial<T> };

type ValidationError = {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
};

// Form field state discriminated unions
type FieldState = 
  | { status: 'pristine'; value: any }
  | { status: 'dirty'; value: any; lastChanged: Date }
  | { status: 'validating'; value: any; validationId: string }
  | { status: 'valid'; value: any; validatedAt: Date }
  | { status: 'invalid'; value: any; errors: ValidationError[] };

// Resource loading states
type Resource<T, E = string> = 
  | { state: 'idle' }
  | { state: 'loading'; progress?: number; estimatedTime?: number }
  | { state: 'loaded'; data: T; loadedAt: Date; fromCache: boolean; expiresAt?: Date }
  | { state: 'revalidating'; data: T; progress?: number }
  | { state: 'error'; error: E; lastAttempt: Date; retryCount: number; canRetry: boolean };

// Business domain models
interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  address: string;
}

// Nested state structures
interface ApplicationState {
  auth: {
    user: Customer | null;
    isAuthenticated: boolean;
  };
  orders: {
    entities: Record<string, EntityState<Order>>;
    ids: string[];
  };
  ui: {
    loading: boolean;
    error: string | null;
    activeModal: string | null;
  };
}

// State normalization patterns
interface NormalizedState<T> {
  entities: Record<string, T>;
  ids: string[];
  meta: {
    total: number;
    loaded: number;
    lastSync: Date;
  };
}

// Validation functions
function validateEntity<T>(entity: T, rules: ValidationRule<T>[]): ValidationResult<T> {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  for (const rule of rules) {
    const result = rule.validate(entity);
    if (result.type === 'error') {
      errors.push({
        field: rule.field,
        message: result.message,
        code: result.code,
        severity: 'error',
      });
    } else if (result.type === 'warning') {
      warnings.push(result.message);
    }
  }
  
  if (errors.length > 0) {
    return { status: 'invalid', errors };
  }
  
  return { 
    status: 'valid', 
    value: entity, 
    warnings: warnings.length > 0 ? warnings : undefined 
  };
}

interface ValidationRule<T> {
  field: keyof T;
  validate: (entity: T) => { type: 'success' } | { type: 'error'; message: string; code: string } | { type: 'warning'; message: string };
}

// Custom hooks
function useResource<T>(
  key: string, 
  fetcher: () => Promise<T>,
  options: { ttl?: number } = {}
): [Resource<T>, { load: () => Promise<void>; reload: () => Promise<void>; retry: () => Promise<void> }] {
  const [state, setState] = useState<Resource<T>>({ state: 'idle' });
  
  const load = useCallback(async (force = false) => {
    if (state.state === 'loading') return;
    
    // Check cache
    if (!force && state.state === 'loaded' && state.expiresAt && new Date() < state.expiresAt) {
      return;
    }
    
    setState(prev => 
      prev.state === 'loaded' 
        ? { ...prev, state: 'revalidating' }
        : { state: 'loading', progress: 0 }
    );
    
    try {
      const data = await fetcher();
      setState({
        state: 'loaded',
        data,
        loadedAt: new Date(),
        fromCache: false,
        expiresAt: options.ttl ? new Date(Date.now() + options.ttl) : undefined,
      });
    } catch (error) {
      setState(prev => ({
        state: 'error',
        error: error.message,
        lastAttempt: new Date(),
        retryCount: (prev.state === 'error' ? prev.retryCount : 0) + 1,
        canRetry: true,
      }));
    }
  }, [fetcher, options.ttl]);
  
  const reload = () => load(true);
  const retry = () => {
    if (state.state === 'error' && state.canRetry) {
      return load(true);
    }
    return Promise.resolve();
  };
  
  return [state, { load, reload, retry }];
}

function useFormValidation<T>(
  initialData: T,
  validationRules: ValidationRule<T>[]
) {
  const [fields, setFields] = useState<Record<keyof T, FieldState>>(() => {
    const initial: Record<keyof T, FieldState> = {} as any;
    Object.keys(initialData).forEach(key => {
      initial[key as keyof T] = { status: 'pristine', value: initialData[key as keyof T] };
    });
    return initial;
  });
  
  const [formValidation, setFormValidation] = useState<ValidationResult<T>>({ status: 'valid', value: initialData });
  
  const updateField = useCallback((field: keyof T, value: any) => {
    setFields(prev => ({
      ...prev,
      [field]: { status: 'dirty', value, lastChanged: new Date() },
    }));
    
    // Validate field
    const fieldRules = validationRules.filter(rule => rule.field === field);
    const tempData = { ...initialData, [field]: value };
    const validation = validateEntity(tempData, fieldRules);
    
    if (validation.status === 'invalid') {
      setFields(prev => ({
        ...prev,
        [field]: { status: 'invalid', value, errors: validation.errors },
      }));
    } else {
      setFields(prev => ({
        ...prev,
        [field]: { status: 'valid', value, validatedAt: new Date() },
      }));
    }
  }, [initialData, validationRules]);
  
  const validateForm = useCallback(() => {
    const data = Object.keys(fields).reduce((acc, key) => {
      acc[key as keyof T] = fields[key as keyof T].value;
      return acc;
    }, {} as T);
    
    const validation = validateEntity(data, validationRules);
    setFormValidation(validation);
    return validation;
  }, [fields, validationRules]);
  
  return {
    fields,
    formValidation,
    updateField,
    validateForm,
  };
}

function useEntityManager<T extends { id: string }>() {
  const [entities, setEntities] = useState<Record<string, EntityState<T>>>({});
  const [ids, setIds] = useState<string[]>([]);
  
  const createEntity = useCallback((data: Omit<T, 'id'>) => {
    const id = `entity_${Date.now()}`;
    const entity: T = { ...data, id } as T;
    const entityState: EntityState<T> = {
      status: 'draft',
      data: entity,
      validationErrors: [],
    };
    
    setEntities(prev => ({ ...prev, [id]: entityState }));
    setIds(prev => [...prev, id]);
    
    return id;
  }, []);
  
  const updateEntity = useCallback((id: string, updates: Partial<T>) => {
    setEntities(prev => {
      const current = prev[id];
      if (!current) return prev;
      
      return {
        ...prev,
        [id]: {
          ...current,
          data: { ...current.data, ...updates },
        },
      };
    });
  }, []);
  
  const transitionEntity = useCallback((id: string, transition: EntityTransition) => {
    setEntities(prev => {
      const current = prev[id];
      if (!current) return prev;
      
      const newState = applyTransition(current, transition);
      return { ...prev, [id]: newState };
    });
  }, []);
  
  const deleteEntity = useCallback((id: string) => {
    setEntities(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
    setIds(prev => prev.filter(entityId => entityId !== id));
  }, []);
  
  return {
    entities,
    ids,
    createEntity,
    updateEntity,
    transitionEntity,
    deleteEntity,
  };
}

type EntityTransition = 
  | { type: 'submit'; submittedBy: string }
  | { type: 'approve'; approvedBy: string }
  | { type: 'reject'; rejectedBy: string; reason: string }
  | { type: 'publish'; url: string }
  | { type: 'archive'; reason: string };

function applyTransition<T>(state: EntityState<T>, transition: EntityTransition): EntityState<T> {
  switch (transition.type) {
    case 'submit':
      if (state.status !== 'draft') return state;
      return {
        status: 'pending',
        data: state.data,
        submittedAt: new Date(),
        submittedBy: transition.submittedBy,
      };
      
    case 'approve':
      if (state.status !== 'pending') return state;
      return {
        status: 'approved',
        data: state.data,
        approvedAt: new Date(),
        approvedBy: transition.approvedBy,
        version: 1,
      };
      
    case 'reject':
      if (state.status !== 'pending') return state;
      return {
        status: 'rejected',
        data: state.data,
        rejectedAt: new Date(),
        rejectedBy: transition.rejectedBy,
        reason: transition.reason,
      };
      
    case 'publish':
      if (state.status !== 'approved') return state;
      return {
        status: 'published',
        data: state.data,
        publishedAt: new Date(),
        url: transition.url,
      };
      
    case 'archive':
      return {
        status: 'archived',
        data: state.data,
        archivedAt: new Date(),
        reason: transition.reason,
      };
      
    default:
      return state;
  }
}

// Components
function OrderManager() {
  const { entities, ids, createEntity, updateEntity, transitionEntity } = useEntityManager<Order>();
  const [newOrder, setNewOrder] = useState({
    customerId: '',
    items: [] as OrderItem[],
    total: 0,
  });
  
  const handleCreateOrder = () => {
    if (newOrder.customerId && newOrder.items.length > 0) {
      createEntity({
        ...newOrder,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setNewOrder({ customerId: '', items: [], total: 0 });
    }
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Order Manager</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Create New Order</h4>
        <input
          type="text"
          placeholder="Customer ID"
          value={newOrder.customerId}
          onChange={(e) => setNewOrder(prev => ({ ...prev, customerId: e.target.value }))}
        />
        <button onClick={handleCreateOrder}>Create Order</button>
      </div>
      
      <div>
        <h4>Orders ({ids.length})</h4>
        {ids.map(id => {
          const entityState = entities[id];
          const order = entityState.data;
          
          return (
            <div key={id} style={{ padding: '10px', border: '1px solid #ddd', marginBottom: '10px' }}>
              <p><strong>Order {order.id}</strong> - Status: {entityState.status}</p>
              <p>Customer: {order.customerId}</p>
              <p>Total: ${order.total}</p>
              
              <div>
                {entityState.status === 'draft' && (
                  <button onClick={() => transitionEntity(id, { type: 'submit', submittedBy: 'user' })}>
                    Submit
                  </button>
                )}
                {entityState.status === 'pending' && (
                  <>
                    <button onClick={() => transitionEntity(id, { type: 'approve', approvedBy: 'admin' })}>
                      Approve
                    </button>
                    <button onClick={() => transitionEntity(id, { type: 'reject', rejectedBy: 'admin', reason: 'Invalid order' })}>
                      Reject
                    </button>
                  </>
                )}
                {entityState.status === 'approved' && (
                  <button onClick={() => transitionEntity(id, { type: 'publish', url: `/orders/${id}` })}>
                    Publish
                  </button>
                )}
                <button onClick={() => transitionEntity(id, { type: 'archive', reason: 'Manual archive' })}>
                  Archive
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ValidationForm() {
  const validationRules: ValidationRule<{ name: string; email: string; age: number }>[] = [
    {
      field: 'name',
      validate: (data) => 
        data.name.length < 2 
          ? { type: 'error', message: 'Name must be at least 2 characters', code: 'NAME_TOO_SHORT' }
          : { type: 'success' },
    },
    {
      field: 'email',
      validate: (data) => 
        !data.email.includes('@') 
          ? { type: 'error', message: 'Invalid email format', code: 'INVALID_EMAIL' }
          : { type: 'success' },
    },
    {
      field: 'age',
      validate: (data) => 
        data.age < 18 
          ? { type: 'warning', message: 'User is under 18' }
          : { type: 'success' },
    },
  ];
  
  const { fields, formValidation, updateField, validateForm } = useFormValidation(
    { name: '', email: '', age: 0 },
    validationRules
  );
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm();
    if (validation.status === 'valid') {
      alert('Form submitted successfully!');
    }
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Validation Form</h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Name"
            value={fields.name.value}
            onChange={(e) => updateField('name', e.target.value)}
          />
          {fields.name.status === 'invalid' && (
            <div style={{ color: 'red', fontSize: '12px' }}>
              {fields.name.errors.map(error => error.message).join(', ')}
            </div>
          )}
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={fields.email.value}
            onChange={(e) => updateField('email', e.target.value)}
          />
          {fields.email.status === 'invalid' && (
            <div style={{ color: 'red', fontSize: '12px' }}>
              {fields.email.errors.map(error => error.message).join(', ')}
            </div>
          )}
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <input
            type="number"
            placeholder="Age"
            value={fields.age.value}
            onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
          />
          {fields.age.status === 'invalid' && (
            <div style={{ color: 'red', fontSize: '12px' }}>
              {fields.age.errors.map(error => error.message).join(', ')}
            </div>
          )}
        </div>
        
        <button type="submit" disabled={formValidation.status === 'invalid'}>
          Submit
        </button>
      </form>
      
      <div style={{ marginTop: '20px', fontSize: '12px' }}>
        <p>Form Status: {formValidation.status}</p>
        {formValidation.status === 'invalid' && (
          <p>Errors: {formValidation.errors.map(e => e.message).join(', ')}</p>
        )}
      </div>
    </div>
  );
}

function ResourceViewer() {
  const mockFetcher = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { message: 'Hello from API!', timestamp: new Date().toISOString() };
  };
  
  const [resource, { load, reload, retry }] = useResource('test-resource', mockFetcher, { ttl: 5000 });
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Resource Viewer</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => load()}>Load</button>
        <button onClick={reload}>Reload</button>
        {resource.state === 'error' && <button onClick={retry}>Retry</button>}
      </div>
      
      <div>
        <p>State: {resource.state}</p>
        
        {resource.state === 'loading' && <p>Loading...</p>}
        
        {resource.state === 'loaded' && (
          <div>
            <p>Data: {JSON.stringify(resource.data)}</p>
            <p>Loaded at: {resource.loadedAt.toLocaleTimeString()}</p>
            <p>From cache: {resource.fromCache ? 'Yes' : 'No'}</p>
          </div>
        )}
        
        {resource.state === 'error' && (
          <div>
            <p style={{ color: 'red' }}>Error: {resource.error}</p>
            <p>Retry count: {resource.retryCount}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Main demo component
export default function DiscriminatedUnionStatePatternsDemo() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Discriminated Union State Patterns</h1>
      <p>Demonstration of advanced domain modeling with discriminated unions.</p>
      
      <OrderManager />
      <ValidationForm />
      <ResourceViewer />
    </div>
  );
}

// Export components for testing
export {
  OrderManager,
  ValidationForm,
  ResourceViewer,
  useResource,
  useFormValidation,
  useEntityManager,
  validateEntity,
  type EntityState,
  type ValidationResult,
  type Resource,
  type FieldState,
};