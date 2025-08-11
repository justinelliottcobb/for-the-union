// useEffect Lifecycle Management - Solution
// Master React's useEffect hook for handling side effects and lifecycle events

import React, { useState, useEffect } from 'react';

// Types
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

// Mock API functions
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

// DataFetcher component
function DataFetcher() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await mockFetchUsers();
        
        if (!cancelled) {
          setUsers(userData);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch users');
          setLoading(false);
        }
      }
    };
    
    fetchUsers();
    
    return () => {
      cancelled = true;
    };
  }, []);
  
  if (loading) {
    return <div>Loading users...</div>;
  }
  
  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }
  
  if (!users) {
    return <div>No users found</div>;
  }
  
  return (
    <div>
      <h3>Users ({users.length})</h3>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            <strong>{user.name}</strong> - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Timer component
function Timer() {
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning]);
  
  const startTimer = () => {
    setIsRunning(true);
  };
  
  const stopTimer = () => {
    setIsRunning(false);
  };
  
  const resetTimer = () => {
    setSeconds(0);
    setIsRunning(false);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div>
      <h3>Timer: {formatTime(seconds)}</h3>
      <div>
        <button onClick={startTimer} disabled={isRunning}>
          Start
        </button>
        <button onClick={stopTimer} disabled={!isRunning}>
          Stop
        </button>
        <button onClick={resetTimer}>
          Reset
        </button>
      </div>
      <p>Status: {isRunning ? 'Running' : 'Stopped'}</p>
    </div>
  );
}

// WindowSizeTracker component
function WindowSizeTracker() {
  const [windowSize, setWindowSize] = useState<WindowSize>({ width: 0, height: 0 });
  
  const getWindowSize = (): WindowSize => {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  };
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize(getWindowSize());
    };
    
    // Set initial size
    setWindowSize(getWindowSize());
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div>
      <h3>Window Size Tracker</h3>
      <p>Width: {windowSize.width}px</p>
      <p>Height: {windowSize.height}px</p>
      <p>
        Screen size: {windowSize.width < 768 ? 'Small' : windowSize.width < 1024 ? 'Medium' : 'Large'}
      </p>
    </div>
  );
}

// SearchComponent with debounced search
function SearchComponent() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let cancelled = false;
    
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const results = await mockSearchPosts(searchQuery);
        
        if (!cancelled) {
          setSearchResults(results);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Search failed');
          setLoading(false);
        }
      }
    };
    
    if (searchQuery.trim().length >= 2) {
      timeoutId = setTimeout(performSearch, 300);
    } else {
      setSearchResults([]);
      setLoading(false);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      cancelled = true;
    };
  }, [searchQuery]);
  
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };
  
  return (
    <div>
      <h3>Search Posts</h3>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Search posts... (min 2 characters)"
        style={{ width: '100%', padding: '8px', marginBottom: '16px' }}
      />
      
      {loading && <p>Searching...</p>}
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {searchQuery.trim().length < 2 && !loading && (
        <p style={{ color: 'gray' }}>Enter at least 2 characters to search</p>
      )}
      
      {searchQuery.trim().length >= 2 && !loading && searchResults.length === 0 && (
        <p>No posts found for "{searchQuery}"</p>
      )}
      
      {searchResults.length > 0 && (
        <div>
          <p>Found {searchResults.length} result(s) for "{searchQuery}":</p>
          <ul>
            {searchResults.map(post => (
              <li key={post.id}>
                <strong>{post.title}</strong>
                <p style={{ color: 'gray', fontSize: '14px' }}>{post.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// MultiEffectComponent showing effect coordination
function MultiEffectComponent() {
  const [count, setCount] = useState<number>(0);
  const [doubledCount, setDoubledCount] = useState<number>(0);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  // Effect to log count changes
  useEffect(() => {
    const message = `Count changed to: ${count}`;
    setLogMessages(prev => [message, ...prev].slice(0, 10)); // Keep only last 10 messages
  }, [count]);
  
  // Effect to calculate doubled count
  useEffect(() => {
    setDoubledCount(count * 2);
  }, [count]);
  
  // Effect for mount/unmount logging
  useEffect(() => {
    console.log('MultiEffectComponent mounted');
    setLogMessages(prev => ['Component mounted', ...prev]);
    
    return () => {
      console.log('MultiEffectComponent will unmount');
    };
  }, []);
  
  const increment = () => {
    setCount(prev => prev + 1);
  };
  
  const clearLogs = () => {
    setLogMessages([]);
  };
  
  return (
    <div>
      <h3>Multi-Effect Coordination</h3>
      <p>Count: {count}</p>
      <p>Doubled Count: {doubledCount}</p>
      
      <div>
        <button onClick={increment}>Increment</button>
        <button onClick={clearLogs} style={{ marginLeft: '8px' }}>
          Clear Logs
        </button>
      </div>
      
      <div style={{ marginTop: '16px' }}>
        <h4>Effect Logs:</h4>
        <div
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #ccc',
            padding: '8px',
            backgroundColor: '#f5f5f5',
          }}
        >
          {logMessages.length === 0 ? (
            <p style={{ color: 'gray' }}>No logs yet</p>
          ) : (
            logMessages.map((message, index) => (
              <div key={index} style={{ fontSize: '14px', marginBottom: '4px' }}>
                {message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ConditionalEffect component
function ConditionalEffect() {
  const [number, setNumber] = useState<number>(1);
  const [isEven, setIsEven] = useState<boolean>(false);
  const [effectLog, setEffectLog] = useState<string[]>([]);
  
  // Effect that runs only when number is even
  useEffect(() => {
    if (number % 2 !== 0) {
      return; // Early return for odd numbers
    }
    
    const message = `Even number effect: ${number}`;
    setEffectLog(prev => [message, ...prev].slice(0, 5)); // Keep only last 5 messages
  }, [number]);
  
  // Effect to always update isEven state
  useEffect(() => {
    setIsEven(number % 2 === 0);
  }, [number]);
  
  const incrementNumber = () => {
    setNumber(prev => prev + 1);
  };
  
  const setRandomNumber = () => {
    const randomNum = Math.floor(Math.random() * 20) + 1;
    setNumber(randomNum);
  };
  
  return (
    <div>
      <h3>Conditional Effects</h3>
      <p>
        Number: {number} ({isEven ? 'Even' : 'Odd'})
      </p>
      
      <div>
        <button onClick={incrementNumber}>Increment</button>
        <button onClick={setRandomNumber} style={{ marginLeft: '8px' }}>
          Random (1-20)
        </button>
      </div>
      
      <div style={{ marginTop: '16px' }}>
        <h4>Even Number Effect Log:</h4>
        <div
          style={{
            maxHeight: '120px',
            overflowY: 'auto',
            border: '1px solid #ccc',
            padding: '8px',
            backgroundColor: '#f9f9f9',
          }}
        >
          {effectLog.length === 0 ? (
            <p style={{ color: 'gray' }}>No even numbers yet</p>
          ) : (
            effectLog.map((message, index) => (
              <div key={index} style={{ fontSize: '14px', marginBottom: '2px' }}>
                {message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Export all components
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