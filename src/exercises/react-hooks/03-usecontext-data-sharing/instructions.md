# useContext Data Sharing

Master React's Context API for sharing data across component trees without prop drilling.

## Learning Objectives

- Understand Context API and useContext hook
- Learn to share state across component trees
- Practice creating custom context providers
- Handle context updates and re-renders
- Implement theme and user authentication patterns

## Prerequisites

- React useState fundamentals
- React useEffect basics
- Understanding of component composition
- TypeScript interfaces and generics

## Background

The Context API solves the "prop drilling" problem by allowing you to share data across multiple levels of components without manually passing props through each level. The `useContext` hook provides a clean way to consume context values in functional components.

### Key Concepts

- **Context**: A way to pass data through the component tree without props
- **Provider**: Component that supplies context values to its children
- **Consumer**: Component that uses context values (via useContext hook)
- **Context Value**: The data shared through the context
- **Re-renders**: Context updates trigger re-renders in all consuming components

## Instructions

You'll build a complete context system with theme and user management:

1. **Theme Context**: Dark/light theme switching across the app
2. **User Context**: User authentication and profile management
3. **Custom Context Hooks**: Type-safe hooks for consuming contexts
4. **Nested Components**: Demonstrate context access at any component depth
5. **Multiple Contexts**: Coordinate multiple context providers
6. **Context Optimization**: Understand re-render implications

## Key Context Patterns

### Creating Context
```typescript
type ThemeContextType = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
```

### Context Provider
```typescript
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const value = { theme, toggleTheme };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Custom Hook for Context
```typescript
function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

### Using Context in Components
```typescript
function ThemedComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className={theme}>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

## Common Patterns

### Multiple Providers
```typescript
function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
}
```

### Conditional Context
```typescript
function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
```

### Context with Reducer
```typescript
function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, initialState);
  
  const value = {
    ...state,
    login: (user: User) => dispatch({ type: 'LOGIN', payload: user }),
    logout: () => dispatch({ type: 'LOGOUT' }),
  };
  
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
```

## Hints

1. Create context with createContext and provide default value
2. Wrap components with Provider to share context down the tree
3. Use useContext hook to consume context in any descendant
4. Custom hooks can encapsulate context logic and validation
5. Context triggers re-renders in all consuming components
6. Separate contexts for different concerns to minimize re-renders

## Expected Behavior

When complete, you should have:

```typescript
// Theme switching that works across all components
const App = () => (
  <ThemeProvider>
    <UserProvider>
      <Header />        {/* Can access theme and user */}
      <MainContent />   {/* Can access theme and user */}
      <Footer />        {/* Can access theme and user */}
    </UserProvider>
  </ThemeProvider>
);

// Components at any depth can use context
function DeeplyNestedComponent() {
  const { theme } = useTheme();
  const { user } = useUser();
  
  return (
    <div style={{ backgroundColor: theme === 'dark' ? '#333' : '#fff' }}>
      {user ? `Welcome, ${user.name}!` : 'Please log in'}
    </div>
  );
}
```

**Estimated time:** 25 minutes  
**Difficulty:** 3/5