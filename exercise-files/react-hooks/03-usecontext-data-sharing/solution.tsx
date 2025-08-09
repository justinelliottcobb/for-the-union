// useContext Data Sharing - SOLUTION
// Master React's Context API for sharing data across component trees

import { createContext, useContext, useState, ReactNode } from 'react';

// Define types for theme context
type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

// Define types for user context
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

// Create ThemeContext with createContext
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Create UserContext with createContext
const UserContext = createContext<UserContextType | undefined>(undefined);

// Implement ThemeProvider component
function ThemeProvider({ children }: { children: ReactNode }) {
  // Add theme state (starts with 'light')
  const [theme, setTheme] = useState<Theme>('light');
  
  // Implement toggleTheme function
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  // Create context value object
  const value: ThemeContextType = {
    theme,
    toggleTheme,
  };
  
  // Return ThemeContext.Provider with value and children
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Implement UserProvider component
function UserProvider({ children }: { children: ReactNode }) {
  // Add user state (User | null, starts with null)
  const [user, setUser] = useState<User | null>(null);
  
  // Implement login function
  const login = (user: User) => {
    setUser(user);
  };
  
  // Implement logout function
  const logout = () => {
    setUser(null);
  };
  
  // Implement updateUser function
  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };
  
  // Create context value object
  const value: UserContextType = {
    user,
    login,
    logout,
    updateUser,
  };
  
  // Return UserContext.Provider with value and children
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Create custom hook useTheme
function useTheme(): ThemeContextType {
  // Use useContext to get theme context
  const context = useContext(ThemeContext);
  
  // Throw error if used outside ThemeProvider
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  // Return context value
  return context;
}

// Create custom hook useUser
function useUser(): UserContextType {
  // Use useContext to get user context
  const context = useContext(UserContext);
  
  // Throw error if used outside UserProvider
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  
  // Return context value
  return context;
}

// Implement Header component using contexts
function Header() {
  // Use useTheme and useUser hooks
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useUser();
  
  const headerStyle = {
    padding: '16px',
    background: theme === 'light' ? '#f5f5f5' : '#333',
    color: theme === 'light' ? '#333' : '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `2px solid ${theme === 'light' ? '#ddd' : '#555'}`,
  };
  
  // Return JSX with app title, theme toggle, user info, login/logout buttons
  return (
    <header style={headerStyle}>
      <h1>Context Demo App</h1>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={toggleTheme}>
          Switch to {theme === 'light' ? 'dark' : 'light'} theme
        </button>
        
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Welcome, {user.name}!</span>
            <span style={{ 
              fontSize: '12px', 
              padding: '2px 6px', 
              background: theme === 'light' ? '#007bff' : '#0056b3',
              color: 'white',
              borderRadius: '3px'
            }}>
              {user.role}
            </span>
            <button onClick={logout}>Logout</button>
          </div>
        ) : (
          <span>Please log in</span>
        )}
      </div>
    </header>
  );
}

// Implement UserProfile component
function UserProfile() {
  // Use useUser hook
  const { user, updateUser } = useUser();
  const { theme } = useTheme();
  
  // Local state for editing
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '' });
  
  // If no user, show "Please log in" message
  if (!user) {
    return (
      <div style={{ 
        padding: '16px',
        background: theme === 'light' ? '#fff' : '#444',
        color: theme === 'light' ? '#333' : '#fff',
        borderRadius: '8px',
        margin: '16px 0'
      }}>
        <h3>User Profile</h3>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }
  
  const handleEdit = () => {
    setEditData({ name: user.name, email: user.email });
    setEditing(true);
  };
  
  const handleSave = () => {
    updateUser(editData);
    setEditing(false);
  };
  
  const handleCancel = () => {
    setEditing(false);
    setEditData({ name: '', email: '' });
  };
  
  const profileStyle = {
    padding: '16px',
    background: theme === 'light' ? '#fff' : '#444',
    color: theme === 'light' ? '#333' : '#fff',
    borderRadius: '8px',
    margin: '16px 0',
    border: `1px solid ${theme === 'light' ? '#ddd' : '#666'}`,
  };
  
  // Return JSX with user details, edit form, role-based content
  return (
    <div style={profileStyle}>
      <h3>User Profile</h3>
      
      {!editing ? (
        <div>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          
          <button onClick={handleEdit}>Edit Profile</button>
          
          {user.role === 'admin' && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px',
              background: theme === 'light' ? '#e7f3ff' : '#1a365d',
              borderRadius: '4px'
            }}>
              <h4>Admin Panel</h4>
              <p>You have administrative privileges!</p>
              <button>Manage Users</button>
              <button style={{ marginLeft: '8px' }}>System Settings</button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '8px' }}>
            <label>
              Name:
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                style={{ 
                  marginLeft: '8px', 
                  padding: '4px',
                  background: theme === 'light' ? '#fff' : '#555',
                  color: theme === 'light' ? '#333' : '#fff',
                  border: `1px solid ${theme === 'light' ? '#ddd' : '#666'}`
                }}
              />
            </label>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label>
              Email:
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                style={{ 
                  marginLeft: '8px', 
                  padding: '4px',
                  background: theme === 'light' ? '#fff' : '#555',
                  color: theme === 'light' ? '#333' : '#fff',
                  border: `1px solid ${theme === 'light' ? '#ddd' : '#666'}`
                }}
              />
            </label>
          </div>
          
          <button onClick={handleSave}>Save</button>
          <button onClick={handleCancel} style={{ marginLeft: '8px' }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

// Implement ThemeDemo component
function ThemeDemo() {
  // Use useTheme hook
  const { theme } = useTheme();
  
  const demoStyle = {
    padding: '24px',
    background: theme === 'light' ? '#f8f9fa' : '#2d3748',
    color: theme === 'light' ? '#495057' : '#e2e8f0',
    borderRadius: '12px',
    margin: '16px 0',
    border: `2px solid ${theme === 'light' ? '#dee2e6' : '#4a5568'}`,
    textAlign: 'center' as const,
  };
  
  // Return JSX with theme-based styling
  return (
    <div style={demoStyle}>
      <h3>Theme Demo</h3>
      <p>Current theme: <strong>{theme}</strong></p>
      <p>
        {theme === 'light' 
          ? '🌞 Light theme provides a bright, clean interface for daytime use.'
          : '🌙 Dark theme offers a comfortable viewing experience in low-light conditions.'
        }
      </p>
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: theme === 'light' ? '#e3f2fd' : '#1a202c',
        borderRadius: '6px'
      }}>
        <p>This content changes based on the current theme!</p>
      </div>
    </div>
  );
}

// Implement LoginForm component
function LoginForm() {
  // Use useUser hook
  const { user, login } = useUser();
  const { theme } = useTheme();
  
  // Add local state for form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as User['role']
  });
  
  // Implement form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      const newUser: User = {
        id: Date.now(), // Simple ID generation
        ...formData
      };
      login(newUser);
      setFormData({ name: '', email: '', role: 'user' });
    }
  };
  
  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };
  
  // Hide form if user is already logged in
  if (user) {
    return (
      <div style={{ 
        padding: '16px',
        background: theme === 'light' ? '#d4edda' : '#1e4d3a',
        color: theme === 'light' ? '#155724' : '#a3d9b1',
        borderRadius: '8px',
        margin: '16px 0'
      }}>
        <p>✅ You are already logged in as {user.name}!</p>
      </div>
    );
  }
  
  const formStyle = {
    padding: '16px',
    background: theme === 'light' ? '#fff' : '#444',
    color: theme === 'light' ? '#333' : '#fff',
    borderRadius: '8px',
    margin: '16px 0',
    border: `1px solid ${theme === 'light' ? '#ddd' : '#666'}`,
  };
  
  const inputStyle = {
    width: '100%',
    padding: '8px',
    marginTop: '4px',
    marginBottom: '12px',
    background: theme === 'light' ? '#fff' : '#555',
    color: theme === 'light' ? '#333' : '#fff',
    border: `1px solid ${theme === 'light' ? '#ddd' : '#666'}`,
    borderRadius: '4px',
  };
  
  // Return JSX with form inputs and submit button
  return (
    <div style={formStyle}>
      <h3>Login Form</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Name:
            <input
              type="text"
              value={formData.name}
              onChange={handleInputChange('name')}
              style={inputStyle}
              required
            />
          </label>
        </div>
        
        <div>
          <label>
            Email:
            <input
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              style={inputStyle}
              required
            />
          </label>
        </div>
        
        <div>
          <label>
            Role:
            <select
              value={formData.role}
              onChange={handleInputChange('role')}
              style={inputStyle}
            >
              <option value="guest">Guest</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        
        <button type="submit" style={{
          padding: '8px 16px',
          background: theme === 'light' ? '#007bff' : '#0056b3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Login
        </button>
      </form>
    </div>
  );
}

// Implement NestedComponent that uses context deep in tree
function NestedComponent() {
  // Use both useTheme and useUser hooks
  const { theme } = useTheme();
  const { user } = useUser();
  
  const nestedStyle = {
    padding: '12px',
    background: theme === 'light' ? '#fff3cd' : '#5d4e00',
    color: theme === 'light' ? '#856404' : '#fff3cd',
    borderRadius: '6px',
    border: `1px solid ${theme === 'light' ? '#ffeeba' : '#6c5700'}`,
  };
  
  // Return JSX showing current theme, user name, and context depth message
  return (
    <div style={nestedStyle}>
      <h5>Nested Component</h5>
      <p><strong>Theme:</strong> {theme}</p>
      <p><strong>User:</strong> {user ? user.name : 'Not logged in'}</p>
      <p>🎯 This component demonstrates that context works at any depth in the component tree!</p>
    </div>
  );
}

function DeepNested() {
  const { theme } = useTheme();
  
  return (
    <div style={{ 
      padding: '16px', 
      border: `1px dashed ${theme === 'light' ? '#ccc' : '#666'}`,
      borderRadius: '8px',
      margin: '16px 0'
    }}>
      <h4>Deeply Nested Component</h4>
      <p>This component is nested multiple levels deep, but still has access to context!</p>
      <NestedComponent />
    </div>
  );
}

// Implement main App component with providers
function App() {
  const [mounted, setMounted] = useState(false);
  
  // Simple mounted state to demonstrate provider lifecycle
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div>Loading...</div>;
  }
  
  // Wrap components with ThemeProvider and UserProvider
  return (
    <ThemeProvider>
      <UserProvider>
        <div style={{ minHeight: '100vh' }}>
          <Header />
          
          <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
            <LoginForm />
            <UserProfile />
            <ThemeDemo />
            <DeepNested />
            
            <div style={{ 
              marginTop: '24px', 
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              <h4>Context Demo Complete! 🎉</h4>
              <p>This app demonstrates:</p>
              <ul>
                <li>✅ Multiple contexts (Theme & User)</li>
                <li>✅ Custom context hooks with error boundaries</li>
                <li>✅ Context updates triggering re-renders</li>
                <li>✅ Context access at any component depth</li>
                <li>✅ Role-based conditional rendering</li>
                <li>✅ Theme-based dynamic styling</li>
              </ul>
            </div>
          </div>
        </div>
      </UserProvider>
    </ThemeProvider>
  );
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