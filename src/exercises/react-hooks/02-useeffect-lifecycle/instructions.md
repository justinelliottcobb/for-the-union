# useEffect Lifecycle Management

Master React's useEffect hook for handling side effects, lifecycle events, and asynchronous operations in functional components.

## Learning Objectives

- Understand useEffect basics and dependency arrays
- Learn to handle component mounting and unmounting
- Practice cleanup functions to prevent memory leaks
- Manage async operations with useEffect
- Handle multiple effects and their interactions
- Debug infinite re-render loops

## Prerequisites

- React useState fundamentals
- Understanding of component lifecycle
- Basic knowledge of async/await and Promises
- Event handling in React

## Background

The `useEffect` hook lets you perform side effects in functional components. It serves the same purpose as `componentDidMount`, `componentDidUpdate`, and `componentWillUnmount` combined in React class components.

### Key Concepts

- **Side Effects**: Operations that affect something outside the component (API calls, DOM manipulation, subscriptions)
- **Dependency Array**: Controls when the effect runs
- **Cleanup Function**: Prevents memory leaks and cancels ongoing operations
- **Effect Timing**: Effects run after render by default

## Instructions

You'll build several components that demonstrate different useEffect patterns:

1. **Data Fetcher**: Load data from an API on mount
2. **Timer Component**: Handle intervals and cleanup
3. **Window Listener**: Add and remove event listeners
4. **Search Component**: Debounced search with cleanup
5. **Multiple Effects**: Coordinate multiple useEffect hooks
6. **Conditional Effects**: Effects that run based on conditions

## Key useEffect Patterns

### Basic Effect (No Dependencies)
```typescript
useEffect(() => {
  // Runs after every render
  console.log('Component rendered');
});
```

### Effect with Empty Dependencies (Mount Only)
```typescript
useEffect(() => {
  // Runs only once after mount
  console.log('Component mounted');
}, []);
```

### Effect with Dependencies
```typescript
useEffect(() => {
  // Runs when count changes
  console.log('Count changed:', count);
}, [count]);
```

### Effect with Cleanup
```typescript
useEffect(() => {
  const timer = setInterval(() => {
    console.log('Timer tick');
  }, 1000);

  return () => {
    clearInterval(timer);
  };
}, []);
```

### Async Operations in useEffect
```typescript
useEffect(() => {
  let cancelled = false;

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      if (!cancelled) {
        setData(data);
      }
    } catch (error) {
      if (!cancelled) {
        setError(error);
      }
    }
  };

  fetchData();

  return () => {
    cancelled = true;
  };
}, []);
```

## Common Pitfalls to Avoid

1. **Missing Dependencies**: Not including all used variables in dependency array
2. **Infinite Loops**: Dependency array causes effect to run indefinitely
3. **Memory Leaks**: Not cleaning up subscriptions, timers, or listeners
4. **Race Conditions**: Not handling async operations properly
5. **Stale Closures**: Using outdated values in effect callbacks

## Hints

1. useEffect runs after the render is committed to the screen
2. Empty dependency array `[]` means effect runs only once after mount
3. Missing dependency array means effect runs after every render
4. Cleanup function runs before component unmounts or effect re-runs
5. Use async functions inside useEffect, don't make useEffect itself async
6. Always include state/props used inside effect in dependency array

## Expected Behavior

When complete, you should have components that:

```typescript
// Data fetching with loading states
const DataFetcher = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data on mount
    fetchDataFromAPI().then(setData).finally(() => setLoading(false));
  }, []);

  return loading ? <div>Loading...</div> : <div>{data}</div>;
};

// Timer with cleanup
const Timer = () => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div>Timer: {seconds}s</div>;
};
```

**Estimated time:** 30 minutes  
**Difficulty:** 3/5