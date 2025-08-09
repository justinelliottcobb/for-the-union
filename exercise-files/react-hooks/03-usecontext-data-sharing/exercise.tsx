// useContext Data Sharing
// Master React's Context API for sharing data across component trees

import { createContext, useContext, useState, ReactNode } from 'react';

// Learning objectives:
// - Understand Context API and useContext hook
// - Learn to share state across component trees
// - Practice creating custom context providers
// - Handle context updates and re-renders
// - Implement theme and user authentication patterns

// TODO: Define types for theme context
type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

// TODO: Define types for user context
type User = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
};

type UserContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
};

// TODO: Create ThemeContext with createContext
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// TODO: Create UserContext with createContext
const UserContext = createContext<UserContextType | undefined>(undefined);

// TODO: Implement ThemeProvider component
function ThemeProvider({ children }: { children: ReactNode }) {
  // TODO: Add theme state (starts with 'light')
  
  // TODO: Implement toggleTheme function
  const toggleTheme = () => {
    // Your code here
  };
  
  // TODO: Create context value object
  const value = {
    // Your context value here
  };
  
  // TODO: Return ThemeContext.Provider with value and children
  return null; // Replace with your JSX
}

// TODO: Implement UserProvider component
function UserProvider({ children }: { children: ReactNode }) {
  // TODO: Add user state (User | null, starts with null)
  
  // TODO: Implement login function
  const login = (user: User) => {
    // Your code here
  };
  
  // TODO: Implement logout function
  const logout = () => {
    // Your code here
  };
  
  // TODO: Implement updateUser function
  const updateUser = (updates: Partial<User>) => {
    // Your code here - merge updates with current user
  };
  
  // TODO: Create context value object
  const value = {
    // Your context value here
  };
  
  // TODO: Return UserContext.Provider with value and children
  return null; // Replace with your JSX
}

// TODO: Create custom hook useTheme
function useTheme(): ThemeContextType {
  // TODO: Use useContext to get theme context
  // TODO: Throw error if used outside ThemeProvider
  // TODO: Return context value
  return { theme: 'light', toggleTheme: () => {} }; // Replace with actual implementation
}

// TODO: Create custom hook useUser
function useUser(): UserContextType {
  // TODO: Use useContext to get user context
  // TODO: Throw error if used outside UserProvider
  // TODO: Return context value
  return { user: null, login: () => {}, logout: () => {}, updateUser: () => {} }; // Replace with actual implementation
}

// TODO: Implement Header component using contexts
function Header() {
  // TODO: Use useTheme and useUser hooks
  
  // TODO: Return JSX with:
  // - App title
  // - Theme toggle button
  // - User info if logged in
  // - Login/Logout buttons
  return null; // Replace with your JSX
}

// TODO: Implement UserProfile component
function UserProfile() {
  // TODO: Use useUser hook
  
  // TODO: If no user, show "Please log in" message
  
  // TODO: Return JSX with:
  // - User details (name, email, role)
  // - Edit form for user details
  // - Update button
  // - Role-based content (admin sees extra options)
  return null; // Replace with your JSX
}

// TODO: Implement ThemeDemo component
function ThemeDemo() {
  // TODO: Use useTheme hook
  
  // TODO: Return JSX with theme-based styling:
  // - Background color based on theme
  // - Text color based on theme
  // - Different content for light/dark themes
  return null; // Replace with your JSX
}

// TODO: Implement LoginForm component
function LoginForm() {
  // TODO: Use useUser hook
  // TODO: Add local state for form fields (name, email, role)
  
  // TODO: Implement form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Your code here - create user object and call login
  };
  
  // TODO: Return JSX with:
  // - Form inputs for name, email, role
  // - Submit button
  // - Hide form if user is already logged in
  return null; // Replace with your JSX
}

// TODO: Implement NestedComponent that uses context deep in tree
function NestedComponent() {
  // TODO: Use both useTheme and useUser hooks
  
  // TODO: Return JSX showing:
  // - Current theme
  // - Current user name (if logged in)
  // - Message demonstrating context works at any depth
  return null; // Replace with your JSX
}

function DeepNested() {
  return (
    <div style={{ padding: '16px', border: '1px dashed #ccc' }}>
      <h4>Deeply Nested Component</h4>
      <NestedComponent />
    </div>
  );
}

// TODO: Implement main App component with providers
function App() {
  // TODO: Wrap components with ThemeProvider and UserProvider
  // TODO: Include Header, UserProfile, ThemeDemo, LoginForm, and DeepNested
  return null; // Replace with your JSX
}

// Export all components and types for testing
export {
  ThemeProvider,
  UserProvider,
  useTheme,
  useUser,
  Header,
  UserProfile,
  ThemeDemo,
  LoginForm,
  NestedComponent,
  DeepNested,
  App,
  type Theme,
  type User,
  type ThemeContextType,
  type UserContextType,
};