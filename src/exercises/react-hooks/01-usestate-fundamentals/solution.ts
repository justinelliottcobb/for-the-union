// useState Fundamentals - Solution
// Master the basics of React useState hook for managing component state

import { useState, useEffect } from 'react';

// Define types for our state
type CounterState = {
  count: number;
  isVisible: boolean;
};

type UserFormData = {
  name: string;
  email: string;
  age: number;
};

type TodoItem = {
  id: number;
  text: string;
  completed: boolean;
};

// Counter component with useState
function Counter() {
  const [count, setCount] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  
  const increment = () => {
    setCount(prevCount => prevCount + 1);
  };
  
  const decrement = () => {
    setCount(prevCount => prevCount - 1);
  };
  
  const reset = () => {
    setCount(0);
  };
  
  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
  };
  
  return (
    <div>
      {isVisible && <p>Count: {count}</p>}
      <div>
        <button onClick={increment}>+ Increment</button>
        <button onClick={decrement}>- Decrement</button>
        <button onClick={reset}>Reset</button>
        <button onClick={toggleVisibility}>
          {isVisible ? 'Hide' : 'Show'} Counter
        </button>
      </div>
    </div>
  );
}

// UserForm component for handling form inputs
function UserForm() {
  const [user, setUser] = useState<UserFormData>({
    name: '',
    email: '',
    age: 0,
  });
  
  const handleInputChange = (field: keyof UserFormData, value: string | number) => {
    setUser(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', user);
  };
  
  const resetForm = () => {
    setUser({
      name: '',
      email: '',
      age: 0,
    });
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Name:
            <input
              type="text"
              value={user.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your name"
            />
          </label>
        </div>
        <div>
          <label>
            Email:
            <input
              type="email"
              value={user.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
            />
          </label>
        </div>
        <div>
          <label>
            Age:
            <input
              type="number"
              value={user.age}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
              placeholder="Enter your age"
            />
          </label>
        </div>
        <div>
          <button type="submit">Submit</button>
          <button type="button" onClick={resetForm}>Reset</button>
        </div>
      </form>
      
      <div>
        <h3>Current Form Data:</h3>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
    </div>
  );
}

// TodoList component managing an array in state
function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState<string>('');
  
  const addTodo = () => {
    if (newTodoText.trim()) {
      const newTodo: TodoItem = {
        id: Date.now(), // Simple ID generation
        text: newTodoText.trim(),
        completed: false,
      };
      setTodos(prev => [...prev, newTodo]);
      setNewTodoText('');
    }
  };
  
  const removeTodo = (id: number) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };
  
  const toggleCompleted = (id: number) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    );
  };
  
  const handleInputChange = (value: string) => {
    setNewTodoText(value);
  };
  
  const completedCount = todos.filter(todo => todo.completed).length;
  
  return (
    <div>
      <div>
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Enter new todo"
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
        />
        <button onClick={addTodo} disabled={!newTodoText.trim()}>
          Add Todo
        </button>
      </div>
      
      <div>
        <p>Total: {todos.length} | Completed: {completedCount}</p>
      </div>
      
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <span
              style={{
                textDecoration: todo.completed ? 'line-through' : 'none',
                opacity: todo.completed ? 0.6 : 1,
              }}
            >
              {todo.text}
            </span>
            <button onClick={() => toggleCompleted(todo.id)}>
              {todo.completed ? 'Undo' : 'Complete'}
            </button>
            <button onClick={() => removeTodo(todo.id)}>Remove</button>
          </li>
        ))}
      </ul>
      
      {todos.length === 0 && (
        <p style={{ color: 'gray', fontStyle: 'italic' }}>
          No todos yet. Add one above!
        </p>
      )}
    </div>
  );
}

// StateAnalyzer component that demonstrates re-render behavior
function StateAnalyzer() {
  const [renderCount, setRenderCount] = useState<number>(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [message, setMessage] = useState<string>('Initial message');
  
  // Increment render count on every render
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });
  
  const updateState = (newMessage: string) => {
    setMessage(newMessage);
    setLastUpdateTime(new Date());
  };
  
  // This won't cause a re-render if the state value is the same
  const updateWithSameValue = () => {
    setMessage(message); // Same value, no re-render
  };
  
  const formatTime = (date: Date | null) => {
    return date ? date.toLocaleTimeString() : 'Never';
  };
  
  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', margin: '16px' }}>
      <h3>State & Re-render Analysis</h3>
      
      <div>
        <p><strong>Render Count:</strong> {renderCount}</p>
        <p><strong>Last Update:</strong> {formatTime(lastUpdateTime)}</p>
        <p><strong>Current Message:</strong> "{message}"</p>
      </div>
      
      <div>
        <button onClick={() => updateState('Hello World!')}>
          Update to "Hello World!"
        </button>
        <button onClick={() => updateState('React is awesome!')}>
          Update to "React is awesome!"
        </button>
        <button onClick={() => updateState(`Random: ${Math.random()}`)}>
          Update to Random Value
        </button>
        <button onClick={updateWithSameValue}>
          Update with Same Value (no re-render)
        </button>
      </div>
      
      <div style={{ marginTop: '16px', fontSize: '14px', color: 'gray' }}>
        <p>💡 Notice how render count increases with each state update!</p>
        <p>🎯 Clicking "Update with Same Value" won't increase render count.</p>
      </div>
    </div>
  );
}

// Export all components for testing
export {
  Counter,
  UserForm,
  TodoList,
  StateAnalyzer,
  type CounterState,
  type UserFormData,
  type TodoItem,
};