// useState Fundamentals
// Master the basics of React useState hook for managing component state

import { use, useEffect, useState } from 'react';

// Learning objectives:
// - Understand useState basics and syntax
// - Learn how state updates trigger re-renders  
// - Practice with different data types in state
// - Handle form inputs with controlled components
// - Use functional updates for state based on previous state

// Hints:
// 1. useState returns an array with current state and setter function
// 2. State updates trigger component re-renders
// 3. Use functional updates for state based on previous state
// 4. Always use the setter function, never mutate state directly
// 5. TypeScript can infer types from initial values

// TODO: Define types for our state
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

// TODO: Implement a Counter component with useState
function Counter() {
  // TODO: Add state for count (number, starts at 0)
  const [state, setState] = useState<CounterState>({
    count: 0,
    isVisible: true,
  });
  // TODO: Add state for visibility (boolean, starts true)
  const { count, isVisible } = state;
  
  // TODO: Implement increment function (use functional update)
  const increment = () => {
    setState(prevState => ({ ...prevState, count: prevState.count + 1 }));
  };
  
  // TODO: Implement decrement function (use functional update)  
  const decrement = () => {
    setState(prevState => ({ ...prevState, count: prevState.count - 1 }));
  };
  
  // TODO: Implement reset function (set back to 0)
  const reset = () => {
    setState(prevState => ({ ...prevState, count: 0 }));
  };
  
  // TODO: Implement toggle visibility function
  const toggleVisibility = () => {
    setState(prevState => ({ ...prevState, isVisible: !prevState.isVisible }));
  };
  
  // TODO: Return JSX that shows:
  // - Current count (only when visible)
  // - Increment button
  // - Decrement button  
  // - Reset button
  // - Toggle visibility button
  return (
    <>
      <div>
        {isVisible && <h1>Count: {count}</h1>}
        <button onClick={increment}>Increment</button>
        <button onClick={decrement}>Decrement</button>
        <button onClick={reset}>Reset</button>
        <button onClick={toggleVisibility}>
          {isVisible ? 'Hide' : 'Show'} Count
        </button>
      </div>
    </>
  );
}

// TODO: Implement a UserForm component for handling form inputs
function UserForm() {
  // TODO: Add state for user form data (UserFormData type)
  const [state, setState] = useState<UserFormData>({
    name: '',
    email: '',
    age: 0,
  });
  
  // TODO: Implement input change handler
  const handleInputChange = (field: keyof UserFormData, value: string | number) => {
    setState(prevState => ({
      ...prevState,
      [field]: value,
    }));
  };
  
  // TODO: Implement form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setState(prevState => ({
      ...prevState,
      // Here you could handle form submission logic, e.g. send to API
    }));
    console.log('Form submitted:', JSON.stringify(state, null, 2));
  };
  
  // TODO: Implement reset form handler
  const resetForm = () => {
    setState({
      name: '',
      email: '',
      age: 0,
    });
    console.log('Form reset');
  };
  
  // TODO: Return JSX form with:
  // - Name input (controlled by state)
  // - Email input (controlled by state)
  // - Age input (controlled by state, number type)
  // - Submit button
  // - Reset button
  // - Display current form data as JSON
  return (
    <>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Name:
            <input
              type="text"
              value={state.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Email:
            <input
              type="email"
              value={state.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Age:
            <input
              type="number"
              value={state.age}
              onChange={(e) => handleInputChange('age', Number(e.target.value))}
            />
          </label>
        </div>
        <button type="submit">Submit</button>
        <button type="button" onClick={resetForm}>Reset</button>
      </form>
      <pre>{JSON.stringify(state, null, 2)}</pre>
      <h2>Current Form Data</h2>
      <p>Name: {state.name}</p>
      <p>Email: {state.email}</p>
      <p>Age: {state.age}</p>
    </>
  ); 
}

// TODO: Implement a TodoList component managing an array in state
function TodoList() {
  // TODO: Add state for todos array (TodoItem[])
  const [todos, setTodos] = useState<TodoItem[]>([]);
  // TODO: Add state for new todo text input (string)
  const [newTodoText, setNewTodoText] = useState<string>('');
  
  // TODO: Implement add todo function
  const addTodo = () => {
    if (newTodoText.trim() === '') return; // Prevent empty todos
    const newTodo: TodoItem = {
      id: Date.now(), // Use timestamp as unique ID
      text: newTodoText,
      completed: false,
    };
    setTodos(prevTodos => [...prevTodos, newTodo]);
    setNewTodoText(''); // Clear input after adding
  };
  
  // TODO: Implement remove todo function
  const removeTodo = (id: number) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));};
  
  // TODO: Implement toggle completed function
  const toggleCompleted = (id: number) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };
  
  // TODO: Implement input change handler
  const handleInputChange = (value: string) => {
    setNewTodoText(value);
  };
  
  // TODO: Return JSX with:
  // - Input for new todo text
  // - Add button
  // - List of todos showing text and completed status
  // - Toggle completed button for each todo
  // - Remove button for each todo
  // - Show count of total and completed todos
  return (
    <>
      <div>
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Add new todo"
        />
        <button onClick={addTodo}>Add Todo</button>
      </div>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => toggleCompleted(todo.id)}>
              {todo.completed ? 'Undo' : 'Complete'}
            </button>
            <button onClick={() => removeTodo(todo.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <p>Total Todos: {todos.length}</p>
      <p>Completed Todos: {todos.filter(todo => todo.completed).length}</p>
      <p>Pending Todos: {todos.filter(todo => !todo.completed).length}</p>
      <p>All Todos: {JSON.stringify(todos, null, 2)}</p>
    </>
  );
}

// TODO: Implement a StateAnalyzer component that demonstrates re-render behavior
function StateAnalyzer() {
  // TODO: Add state for render count (number, starts at 0)
  const [renderCount, setRenderCount] = useState<number>(0);

  // TODO: Add state for last update time (Date | null)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // TODO: Add state for update message (string)
  const [message, setMessage] = useState<string>('Initial message');

  // TODO: Use useEffect to increment render count on every render
  // Hint: This will demonstrate when re-renders happen
  useEffect(() => {
    setRenderCount(prevCount => prevCount + 1);
  }, []);

  // TODO: Implement update state function that:
  // - Updates the message
  // - Sets the last update time to current time
  const updateState = (newMessage: string) => {
    setMessage(newMessage);
    setLastUpdateTime(new Date());
  };
  
  // TODO: Return JSX showing:
  // - Current render count
  // - Last update time (formatted)
  // - Current message
  // - Buttons to trigger different state updates
  // - Button to trigger same state update (show no re-render)
  return (
    <>
      <h2>State Analyzer</h2>
      <p>Render Count: {renderCount}</p>
      <p>Last Update Time: {lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : 'Never'}</p>
      <p>Current Message: {message}</p>
      <button onClick={() => updateState('Updated message at ' + new Date().toLocaleTimeString())}>
        Update State
      </button>
      <button onClick={() => updateState('Same message, no re-render')}>
        Same Message (No Re-render)
      </button>
    </>
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
