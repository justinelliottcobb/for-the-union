# Discriminated Union State Patterns

Master advanced patterns for modeling complex domain state with discriminated unions, creating bulletproof business logic and type-safe state management.

## Learning Objectives

- Model complex business domains with discriminated unions
- Implement entity lifecycle states with type safety
- Design validation and error handling patterns
- Create nested and hierarchical state structures
- Handle state normalization and denormalization
- Build reactive state update patterns

## Prerequisites

- Mastery of useReducer patterns and Redux
- Understanding of discriminated unions and exhaustive checking
- Knowledge of business domain modeling
- TypeScript advanced types and conditional types

## Background

Discriminated unions shine when modeling complex business domains. They provide:

- **Domain Accuracy**: State models match real-world business rules
- **Type Safety**: Invalid state combinations are impossible
- **Clarity**: Business logic becomes self-documenting
- **Maintainability**: Changes are safe and predictable

### The Domain Modeling Pattern

```typescript
// Entity Lifecycle States
type EntityState<T> = 
  | { status: 'draft'; data: T; validationErrors: ValidationError[] }
  | { status: 'pending'; data: T; submittedAt: Date; submittedBy: string }
  | { status: 'approved'; data: T; approvedAt: Date; approvedBy: string; version: number }
  | { status: 'rejected'; data: T; rejectedAt: Date; rejectedBy: string; reason: string }
  | { status: 'published'; data: T; publishedAt: Date; url: string; analytics: Analytics }
  | { status: 'archived'; data: T; archivedAt: Date; reason: string };

// Business Process States
type OrderState = 
  | { phase: 'cart'; items: CartItem[]; estimatedTotal: number }
  | { phase: 'checkout'; items: CartItem[]; shipping: ShippingInfo; billing: BillingInfo }
  | { phase: 'payment'; orderId: string; paymentMethod: PaymentMethod; amount: number }
  | { phase: 'processing'; orderId: string; paymentConfirmed: boolean; estimatedShipping: Date }
  | { phase: 'shipped'; orderId: string; trackingNumber: string; carrier: string; shippedAt: Date }
  | { phase: 'delivered'; orderId: string; deliveredAt: Date; signedBy?: string }
  | { phase: 'cancelled'; orderId: string; cancelledAt: Date; reason: string; refundStatus: RefundStatus };
```

## Instructions

You'll build sophisticated domain models with:

1. **Entity Lifecycle Management**: Model complex business entity states
2. **Form Validation System**: Multi-step validation with discriminated union results
3. **Resource Management**: Loading, caching, and error states
4. **Business Process Flows**: Model real-world business processes
5. **State Normalization**: Efficient state structures for complex data
6. **Reactive Updates**: State changes that cascade through the system

## Essential Patterns

### Entity Lifecycle Pattern

```typescript
interface Document {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

type DocumentState = EntityState<Document>;

interface DocumentActions {
  create: (document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => void;
  submit: (id: string) => void;
  approve: (id: string, approverId: string) => void;
  reject: (id: string, rejectorId: string, reason: string) => void;
  publish: (id: string, url: string) => void;
  archive: (id: string, reason: string) => void;
}

function documentReducer(
  state: DocumentState, 
  action: DocumentAction
): DocumentState {
  switch (action.type) {
    case 'CREATE':
      return {
        status: 'draft',
        data: {
          ...action.payload,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        validationErrors: [],
      };
      
    case 'SUBMIT':
      if (state.status !== 'draft') {
        throw new Error(`Cannot submit document in ${state.status} state`);
      }
      
      const validationErrors = validateDocument(state.data);
      if (validationErrors.length > 0) {
        return { ...state, validationErrors };
      }
      
      return {
        status: 'pending',
        data: { ...state.data, updatedAt: new Date() },
        submittedAt: new Date(),
        submittedBy: action.payload.userId,
      };
      
    case 'APPROVE':
      if (state.status !== 'pending') {
        throw new Error(`Cannot approve document in ${state.status} state`);
      }
      
      return {
        status: 'approved',
        data: state.data,
        approvedAt: new Date(),
        approvedBy: action.payload.approverId,
        version: (state.data as any).version ? (state.data as any).version + 1 : 1,
      };
      
    // ... other cases
  }
}
```

### Validation Result Pattern

```typescript
type ValidationResult<T> = 
  | { status: 'valid'; value: T; warnings?: string[] }
  | { status: 'invalid'; errors: ValidationError[]; partialValue?: Partial<T> };

type ValidationError = {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
};

interface FormState<T> {
  fields: Record<keyof T, FieldState>;
  validation: ValidationResult<T>;
  submission: SubmissionState;
}

type FieldState = 
  | { status: 'pristine'; value: any }
  | { status: 'dirty'; value: any; lastChanged: Date }
  | { status: 'validating'; value: any; validationId: string }
  | { status: 'valid'; value: any; validatedAt: Date }
  | { status: 'invalid'; value: any; errors: ValidationError[] };

type SubmissionState = 
  | { status: 'idle' }
  | { status: 'validating'; progress: number }
  | { status: 'submitting'; progress: number; startedAt: Date }
  | { status: 'success'; submittedAt: Date; response: any }
  | { status: 'error'; error: string; failedAt: Date; retryCount: number };

// Validation functions
function validateField<T>(
  fieldName: keyof T, 
  value: any, 
  rules: ValidationRule[]
): ValidationResult<any> {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  for (const rule of rules) {
    const result = rule.validate(value);
    if (result.type === 'error') {
      errors.push({
        field: fieldName as string,
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
  
  return { status: 'valid', value, warnings: warnings.length > 0 ? warnings : undefined };
}
```

### Resource State Pattern

```typescript
type ResourceState<T, E = string> = 
  | { state: 'idle' }
  | { state: 'loading'; progress?: number; estimatedTime?: number }
  | { state: 'loaded'; data: T; loadedAt: Date; fromCache: boolean; expiresAt?: Date }
  | { state: 'revalidating'; data: T; progress?: number }
  | { state: 'error'; error: E; lastAttempt: Date; retryCount: number; canRetry: boolean };

interface ResourceManager<T> {
  load: (force?: boolean) => Promise<void>;
  reload: () => Promise<void>;
  invalidate: () => void;
  retry: () => Promise<void>;
}

function useResource<T>(
  key: string, 
  fetcher: () => Promise<T>,
  options: ResourceOptions = {}
): [ResourceState<T>, ResourceManager<T>] {
  const [state, setState] = useState<ResourceState<T>>({ state: 'idle' });
  
  const load = useCallback(async (force = false) => {
    if (state.state === 'loading') return;
    
    // Check cache
    if (!force && state.state === 'loaded' && !isExpired(state)) {
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
  }, [fetcher, state, options.ttl]);
  
  const manager: ResourceManager<T> = {
    load,
    reload: () => load(true),
    invalidate: () => setState({ state: 'idle' }),
    retry: () => {
      if (state.state === 'error' && state.canRetry) {
        return load(true);
      }
      return Promise.resolve();
    },
  };
  
  return [state, manager];
}
```

## Advanced Patterns

### State Normalization

```typescript
// Normalized state structure
interface NormalizedState<T> {
  entities: Record<string, T>;
  ids: string[];
  indexes: {
    byStatus: Record<string, string[]>;
    byAuthor: Record<string, string[]>;
    byDate: Record<string, string[]>;
  };
  meta: {
    total: number;
    loaded: number;
    lastSync: Date;
  };
}

// Normalization utilities
function normalizeEntities<T extends { id: string }>(
  entities: T[]
): NormalizedState<T> {
  const normalized: NormalizedState<T> = {
    entities: {},
    ids: [],
    indexes: {
      byStatus: {},
      byAuthor: {},
      byDate: {},
    },
    meta: {
      total: entities.length,
      loaded: entities.length,
      lastSync: new Date(),
    },
  };
  
  entities.forEach(entity => {
    normalized.entities[entity.id] = entity;
    normalized.ids.push(entity.id);
    
    // Build indexes
    const status = (entity as any).status;
    if (status) {
      if (!normalized.indexes.byStatus[status]) {
        normalized.indexes.byStatus[status] = [];
      }
      normalized.indexes.byStatus[status].push(entity.id);
    }
    
    // ... other indexes
  });
  
  return normalized;
}

// Denormalization utilities
function denormalizeEntities<T>(
  normalized: NormalizedState<T>,
  filter?: (entity: T) => boolean
): T[] {
  return normalized.ids
    .map(id => normalized.entities[id])
    .filter(Boolean)
    .filter(filter || (() => true));
}
```

### Business Process State Machine

```typescript
type OrderProcessState = 
  | { phase: 'cart'; items: CartItem[]; customer?: Customer }
  | { phase: 'shipping'; items: CartItem[]; customer: Customer; shippingOptions: ShippingOption[] }
  | { phase: 'payment'; order: Order; paymentMethods: PaymentMethod[] }
  | { phase: 'confirmation'; order: Order; payment: Payment }
  | { phase: 'processing'; order: Order; payment: Payment; estimatedShipping: Date }
  | { phase: 'shipped'; order: Order; shipping: ShippingInfo }
  | { phase: 'delivered'; order: Order; delivery: DeliveryInfo }
  | { phase: 'completed'; order: Order; review?: Review };

type OrderAction = 
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'SET_CUSTOMER'; customer: Customer }
  | { type: 'SELECT_SHIPPING'; option: ShippingOption }
  | { type: 'PROCESS_PAYMENT'; paymentMethod: PaymentMethod }
  | { type: 'CONFIRM_ORDER' }
  | { type: 'SHIP_ORDER'; trackingInfo: TrackingInfo }
  | { type: 'DELIVER_ORDER'; deliveryInfo: DeliveryInfo }
  | { type: 'COMPLETE_ORDER'; review?: Review };

function orderProcessReducer(
  state: OrderProcessState,
  action: OrderAction
): OrderProcessState {
  switch (action.type) {
    case 'ADD_ITEM':
      if (state.phase !== 'cart') {
        throw new Error(`Cannot add items in ${state.phase} phase`);
      }
      return {
        ...state,
        items: [...state.items, action.item],
      };
      
    case 'SELECT_SHIPPING':
      if (state.phase !== 'shipping') {
        throw new Error(`Cannot select shipping in ${state.phase} phase`);
      }
      return {
        phase: 'payment',
        order: createOrder(state.items, state.customer, action.option),
        paymentMethods: getPaymentMethods(state.customer),
      };
      
    // ... other transitions
  }
}
```

## Hints

1. Use discriminated unions to model entity lifecycles
2. Consider state normalization for complex relationships
3. Implement validation as discriminated union results
4. Use tagged unions for different operation types
5. Consider using optics for deep state updates
6. Design state machines for business processes

## Expected Behavior

When complete, you'll have mastered:

```typescript
// Entity lifecycle management
const [documentState, dispatch] = useEntityManager<Document>();

// Type-safe state transitions
if (documentState.status === 'draft') {
  // Can submit for approval
  dispatch({ type: 'SUBMIT', payload: { userId } });
}

// Validation with discriminated unions
const validationResult = validateForm(formData);
if (validationResult.status === 'valid') {
  // TypeScript knows value is T
  submitForm(validationResult.value);
} else {
  // TypeScript knows errors exist
  displayErrors(validationResult.errors);
}

// Resource state management
const [resourceState, resourceManager] = useResource('users', fetchUsers);
switch (resourceState.state) {
  case 'loaded':
    // TypeScript knows data exists
    return <UserList users={resourceState.data} />;
  case 'error':
    // TypeScript knows error exists
    return <ErrorDisplay error={resourceState.error} onRetry={resourceManager.retry} />;
}
```

**Estimated time:** 40 minutes  
**Difficulty:** 4/5