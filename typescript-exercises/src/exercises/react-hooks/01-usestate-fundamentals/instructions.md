# useState Fundamentals

Master the basics of React useState hook for managing component state effectively and safely.

## Learning Objectives

- Understand useState basics and syntax
- Learn how state updates trigger re-renders
- Practice with different data types in state
- Handle form inputs with controlled components
- Use functional updates for state based on previous state

## Prerequisites

- Basic understanding of React components
- TypeScript fundamentals
- JSX syntax knowledge

## Background

The `useState` hook is the most fundamental hook in React for managing local component state. It allows functional components to have state variables that persist between re-renders and can trigger component updates when changed.

### Key Concepts

- **State Variable**: The current value stored in state
- **State Setter**: Function to update the state value
- **Re-renders**: When state changes, React re-renders the component
- **State Initialization**: Setting initial state value
- **Functional Updates**: Using a function to calculate new state based on previous state

## Instructions

You'll build a multi-purpose counter and form handler that demonstrates various useState patterns:

1. **Basic Counter**: Implement increment, decrement, and reset functionality
2. **Text Input Handler**: Control form input with state
3. **Object State**: Manage complex state with objects
4. **Array State**: Handle list operations with state
5. **Conditional Rendering**: Show/hide elements based on state
6. **Performance Optimization**: Use functional updates for efficiency

## Key useState Patterns

### Basic Usage
```typescript
const [count, setCount] = useState<number>(0);
```

### Functional Updates
```typescript
// When new state depends on previous state
setCount(prevCount => prevCount + 1);
```

### Object State
```typescript
const [user, setUser] = useState<{name: string; email: string}>({
  name: '',
  email: ''
});

// Update specific property
setUser(prev => ({ ...prev, name: 'John' }));
```

### Array State
```typescript
const [items, setItems] = useState<string[]>([]);

// Add item
setItems(prev => [...prev, 'new item']);

// Remove item
setItems(prev => prev.filter((_, index) => index !== indexToRemove));
```

## Hints

1. useState returns an array with current state and setter function
2. State updates trigger component re-renders
3. Use functional updates for state based on previous state
4. Always use the setter function, never mutate state directly
5. TypeScript can infer types from initial values
6. For complex state, consider if useReducer might be better

## Expected Behavior

When complete, you should have:

```typescript
// A counter component that:
const Counter = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
};

// A form handler that manages input state:
const UserForm = () => {
  const [user, setUser] = useState({ name: '', email: '' });
  
  const handleInputChange = (field: keyof typeof user, value: string) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };
  
  return (
    <form>
      <input 
        value={user.name}
        onChange={(e) => handleInputChange('name', e.target.value)}
        placeholder="Name"
      />
      <input 
        value={user.email}
        onChange={(e) => handleInputChange('email', e.target.value)}
        placeholder="Email"
      />
    </form>
  );
};
```

**Estimated time:** 20 minutes  
**Difficulty:** 2/5