// useEffect Lifecycle Management
// Master React's useEffect hook for handling side effects and lifecycle events

import { useState, useEffect } from 'react';

// Learning objectives:
// - Understand useEffect basics and dependency arrays
// - Learn to handle component mounting and unmounting
// - Practice cleanup functions to prevent memory leaks
// - Manage async operations with useEffect
// - Handle multiple effects and their interactions
// - Debug infinite re-render loops

// Hints:
// 1. useEffect runs after the render is committed to the screen
// 2. Empty dependency array [] means effect runs only once after mount
// 3. Missing dependency array means effect runs after every render
// 4. Cleanup function runs before component unmounts or effect re-runs
// 5. Use async functions inside useEffect, don't make useEffect itself async
// 6. Always include state/props used inside effect in dependency array

// TODO: Define types for our components
type User = {
  id: number;
  name: string;
  email: string;
};

type Post = {
  id: number;
  title: string;
  body: string;
  userId: number;
};

type WindowSize = {
  width: number;
  height: number;
};

// Mock API functions (you would normally import these)
const mockFetchUsers = (): Promise<User[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
      ]);
    }, 1000);
  });
};

const mockSearchPosts = (query: string): Promise<Post[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allPosts = [
        { id: 1, title: 'React Hooks Guide', body: 'Learn React Hooks...', userId: 1 },
        { id: 2, title: 'TypeScript Tips', body: 'Advanced TypeScript...', userId: 2 },
        { id: 3, title: 'JavaScript Fundamentals', body: 'Master JS basics...', userId: 1 },
      ];
      const filteredPosts = allPosts.filter(post => 
        post.title.toLowerCase().includes(query.toLowerCase())
      );
      resolve(filteredPosts);
    }, 500);
  });
};

// TODO: Implement DataFetcher component
function DataFetcher() {
  // TODO: Add state for users (User[] | null)
  // TODO: Add state for loading (boolean, starts true)
  // TODO: Add state for error (string | null)
  
  // TODO: Add useEffect to fetch users on component mount
  // - Should run only once (empty dependency array)
  // - Set loading to true initially
  // - Call mockFetchUsers()
  // - Handle success: set users and set loading to false
  // - Handle errors: set error message and set loading to false
  // - Use proper async/await pattern inside useEffect
  
  // TODO: Return JSX that shows:
  // - Loading message while fetching
  // - Error message if error occurred
  // - List of users when loaded successfully
  // - User count when data is available
  return null; // Replace with your JSX
}

// TODO: Implement Timer component with start/stop functionality
function Timer() {
  // TODO: Add state for seconds (number, starts at 0)
  // TODO: Add state for isRunning (boolean, starts false)
  
  // TODO: Add useEffect for timer interval
  // - Should depend on isRunning state
  // - When isRunning is true, create setInterval to increment seconds
  // - Return cleanup function to clear interval
  // - Use functional state update for seconds
  
  // TODO: Implement start function
  const startTimer = () => {
    // Your code here
  };
  
  // TODO: Implement stop function
  const stopTimer = () => {
    // Your code here
  };
  
  // TODO: Implement reset function
  const resetTimer = () => {
    // Your code here
  };
  
  // TODO: Return JSX with:
  // - Display current seconds
  // - Start button (disabled when running)
  // - Stop button (disabled when not running)
  // - Reset button
  return null; // Replace with your JSX
}

// TODO: Implement WindowSizeTracker component
function WindowSizeTracker() {
  // TODO: Add state for window size (WindowSize type)
  
  // TODO: Add useEffect to handle window resize
  // - Should run once on mount to set initial size
  // - Add event listener for 'resize' event
  // - Update state with current window dimensions
  // - Return cleanup function to remove event listener
  
  // TODO: Helper function to get current window size
  const getWindowSize = (): WindowSize => {
    // Your code here - return current window.innerWidth and window.innerHeight
    return { width: 0, height: 0 }; // Replace with actual implementation
  };
  
  // TODO: Return JSX showing current window dimensions
  return null; // Replace with your JSX
}

// TODO: Implement SearchComponent with debounced search
function SearchComponent() {
  // TODO: Add state for search query (string)
  // TODO: Add state for search results (Post[])
  // TODO: Add state for loading (boolean)
  // TODO: Add state for error (string | null)
  
  // TODO: Add useEffect for debounced search
  // - Should depend on search query
  // - Use setTimeout to delay search by 300ms
  // - Call mockSearchPosts with current query
  // - Handle loading states and results
  // - Return cleanup function to clear timeout (prevent race conditions)
  // - Skip search if query is empty or less than 2 characters
  
  // TODO: Implement input change handler
  const handleSearchChange = (value: string) => {
    // Your code here
  };
  
  // TODO: Return JSX with:
  // - Search input field
  // - Loading indicator during search
  // - List of search results
  // - Message when no results found
  // - Message for minimum search length
  return null; // Replace with your JSX
}

// TODO: Implement MultiEffectComponent showing effect coordination
function MultiEffectComponent() {
  // TODO: Add state for count (number)
  // TODO: Add state for doubled count (number)
  // TODO: Add state for log messages (string[])
  
  // TODO: Add first useEffect to log count changes
  // - Should depend on count
  // - Add message to log array when count changes
  // - Log format: "Count changed to: {count}"
  
  // TODO: Add second useEffect to calculate doubled count
  // - Should depend on count
  // - Update doubled count whenever count changes
  
  // TODO: Add third useEffect to log when component mounts/unmounts
  // - Should run only once (empty dependency array)
  // - Log "Component mounted" on mount
  // - Return cleanup function that logs "Component will unmount"
  
  // TODO: Implement increment function
  const increment = () => {
    // Your code here
  };
  
  // TODO: Implement clear logs function
  const clearLogs = () => {
    // Your code here
  };
  
  // TODO: Return JSX showing:
  // - Current count and doubled count
  // - Increment button
  // - Clear logs button
  // - List of log messages (most recent first)
  return null; // Replace with your JSX
}

// TODO: Implement ConditionalEffect component
function ConditionalEffect() {
  // TODO: Add state for number (number, starts at 1)
  // TODO: Add state for isEven (boolean)
  // TODO: Add state for effect log (string[])
  
  // TODO: Add useEffect that runs only when number is even
  // - Should depend on number
  // - Check if number is even
  // - If even, add log message: "Even number effect: {number}"
  // - Use early return if not even
  
  // TODO: Add useEffect to always update isEven state
  // - Should depend on number
  // - Update isEven based on number % 2 === 0
  
  // TODO: Implement increment function
  const incrementNumber = () => {
    // Your code here
  };
  
  // TODO: Implement set random function
  const setRandomNumber = () => {
    // Your code here - set random number between 1-20
  };
  
  // TODO: Return JSX showing:
  // - Current number and whether it's even/odd
  // - Increment button
  // - Set random number button
  // - Effect log messages
  return null; // Replace with your JSX
}

// Export all components for testing
export {
  DataFetcher,
  Timer,
  WindowSizeTracker,
  SearchComponent,
  MultiEffectComponent,
  ConditionalEffect,
  type User,
  type Post,
  type WindowSize,
};