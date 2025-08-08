// useState Fundamentals
// Master the basics of React useState hook for managing component state

import { useState } from 'react';

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
  // TODO: Add state for visibility (boolean, starts true)
  
  // TODO: Implement increment function (use functional update)
  const increment = () => {
    // Your code here
  };
  
  // TODO: Implement decrement function (use functional update)  
  const decrement = () => {
    // Your code here
  };
  
  // TODO: Implement reset function (set back to 0)
  const reset = () => {
    // Your code here
  };
  
  // TODO: Implement toggle visibility function
  const toggleVisibility = () => {
    // Your code here
  };
  
  // TODO: Return JSX that shows:
  // - Current count (only when visible)
  // - Increment button
  // - Decrement button  
  // - Reset button
  // - Toggle visibility button
  return null; // Replace with your JSX
}

// TODO: Implement a UserForm component for handling form inputs
function UserForm() {
  // TODO: Add state for user form data (UserFormData type)
  
  // TODO: Implement input change handler
  const handleInputChange = (field: keyof UserFormData, value: string | number) => {
    // Your code here - use functional update to merge new field value
  };
  
  // TODO: Implement form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Your code here - log the form data
  };
  
  // TODO: Implement reset form handler
  const resetForm = () => {
    // Your code here - reset all fields to initial values
  };
  
  // TODO: Return JSX form with:
  // - Name input (controlled by state)
  // - Email input (controlled by state)
  // - Age input (controlled by state, number type)
  // - Submit button
  // - Reset button
  // - Display current form data as JSON
  return null; // Replace with your JSX
}

// TODO: Implement a TodoList component managing an array in state
function TodoList() {
  // TODO: Add state for todos array (TodoItem[])
  // TODO: Add state for new todo text input (string)
  
  // TODO: Implement add todo function
  const addTodo = () => {
    // Your code here - add new todo with unique ID
    // Reset input after adding
  };
  
  // TODO: Implement remove todo function
  const removeTodo = (id: number) => {
    // Your code here - filter out todo with given id
  };
  
  // TODO: Implement toggle completed function
  const toggleCompleted = (id: number) => {
    // Your code here - toggle completed status of todo with given id
  };
  
  // TODO: Implement input change handler
  const handleInputChange = (value: string) => {
    // Your code here
  };
  
  // TODO: Return JSX with:
  // - Input for new todo text
  // - Add button
  // - List of todos showing text and completed status
  // - Toggle completed button for each todo
  // - Remove button for each todo
  // - Show count of total and completed todos
  return null; // Replace with your JSX
}

// TODO: Implement a StateAnalyzer component that demonstrates re-render behavior
function StateAnalyzer() {
  // TODO: Add state for render count (number, starts at 0)
  // TODO: Add state for last update time (Date | null)
  // TODO: Add state for update message (string)
  
  // TODO: Use useEffect to increment render count on every render
  // Hint: This will demonstrate when re-renders happen
  
  // TODO: Implement update state function that:
  // - Updates the message
  // - Sets the last update time to current time
  const updateState = (newMessage: string) => {
    // Your code here
  };
  
  // TODO: Return JSX showing:
  // - Current render count
  // - Last update time (formatted)
  // - Current message
  // - Buttons to trigger different state updates
  // - Button to trigger same state update (show no re-render)
  return null; // Replace with your JSX
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