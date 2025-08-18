import React, { useState, useEffect, useRef } from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// =============================================================================
// SOLUTION: Advanced React Testing Library Mastery
// =============================================================================
// Complete implementation demonstrating sophisticated testing patterns
// Used by Staff Frontend Engineers in production React applications
// =============================================================================

export const ComplexForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    preferences: [] as string[],
    agreedToTerms: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field errors when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate name (required, min 2 chars)
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Validate email (required, valid format)
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate age (required, 18-100)
    const age = parseInt(formData.age);
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (isNaN(age) || age < 18 || age > 100) {
      newErrors.age = 'Age must be between 18 and 100';
    }

    // Validate preferences (at least one selected)
    if (formData.preferences.length === 0) {
      newErrors.preferences = 'Please select at least one preference';
    }

    // Validate terms agreement (must be checked)
    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSubmitted(true);
    } catch (error) {
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = (preference: string, checked: boolean) => {
    const newPreferences = checked
      ? [...formData.preferences, preference]
      : formData.preferences.filter(p => p !== preference);
    
    handleFieldChange('preferences', newPreferences);
  };

  return (
    <form onSubmit={handleSubmit} data-testid="complex-form">
      <h2>User Registration Form</h2>
      
      {/* Name field with validation */}
      <div>
        <label htmlFor="name">Full Name *</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          aria-describedby={errors.name ? 'name-error' : undefined}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <div id="name-error" role="alert" data-testid="name-error">
            {errors.name}
          </div>
        )}
      </div>

      {/* Email field with validation */}
      <div>
        <label htmlFor="email">Email Address *</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <div id="email-error" role="alert" data-testid="email-error">
            {errors.email}
          </div>
        )}
      </div>

      {/* Age field with validation */}
      <div>
        <label htmlFor="age">Age *</label>
        <input
          id="age"
          type="number"
          min="18"
          max="100"
          value={formData.age}
          onChange={(e) => handleFieldChange('age', e.target.value)}
          aria-describedby={errors.age ? 'age-error' : undefined}
          aria-invalid={!!errors.age}
        />
        {errors.age && (
          <div id="age-error" role="alert" data-testid="age-error">
            {errors.age}
          </div>
        )}
      </div>

      {/* Preferences checkboxes */}
      <fieldset>
        <legend>Preferences (select at least one) *</legend>
        {['Newsletter', 'Updates', 'Promotions', 'Events'].map((pref) => (
          <div key={pref}>
            <input
              type="checkbox"
              id={`pref-${pref.toLowerCase()}`}
              checked={formData.preferences.includes(pref)}
              onChange={(e) => handlePreferenceChange(pref, e.target.checked)}
            />
            <label htmlFor={`pref-${pref.toLowerCase()}`}>{pref}</label>
          </div>
        ))}
        {errors.preferences && (
          <div role="alert" data-testid="preferences-error">
            {errors.preferences}
          </div>
        )}
      </fieldset>

      {/* Terms agreement */}
      <div>
        <input
          type="checkbox"
          id="terms"
          checked={formData.agreedToTerms}
          onChange={(e) => handleFieldChange('agreedToTerms', e.target.checked)}
          aria-describedby={errors.agreedToTerms ? 'terms-error' : undefined}
          aria-invalid={!!errors.agreedToTerms}
        />
        <label htmlFor="terms">I agree to the Terms and Conditions *</label>
        {errors.agreedToTerms && (
          <div id="terms-error" role="alert" data-testid="terms-error">
            {errors.agreedToTerms}
          </div>
        )}
      </div>

      {/* Submit button with loading state */}
      <button
        type="submit"
        disabled={isLoading}
        data-testid="submit-button"
      >
        {isLoading ? 'Registering...' : 'Register'}
      </button>

      {/* Success message */}
      {isSubmitted && (
        <div role="alert" data-testid="success-message">
          Registration successful! Welcome aboard.
        </div>
      )}
    </form>
  );
};

export const DataTable: React.FC<{ data?: any[], loading?: boolean }> = ({ 
  data = [], 
  loading = false 
}) => {
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredData = data.filter(item => {
    if (!filterText) return true;
    
    const searchText = filterText.toLowerCase();
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchText)
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = String(a[sortField]).toLowerCase();
    const bValue = String(b[sortField]).toLowerCase();
    
    const comparison = aValue.localeCompare(bValue);
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText]);

  if (loading) {
    return (
      <div role="status" aria-live="polite" data-testid="loading-indicator">
        Loading data...
      </div>
    );
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div data-testid="data-table">
      {/* Search/filter input */}
      <div>
        <label htmlFor="table-search">Search:</label>
        <input
          id="table-search"
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Search all fields..."
          data-testid="search-input"
        />
      </div>

      {/* Data table */}
      <table role="table">
        <thead>
          <tr>
            <th>
              <button
                onClick={() => handleSort('name')}
                aria-sort={sortField === 'name' ? sortDirection : 'none'}
                data-testid="sort-name"
              >
                Name {getSortIcon('name')}
              </button>
            </th>
            <th>
              <button
                onClick={() => handleSort('email')}
                aria-sort={sortField === 'email' ? sortDirection : 'none'}
                data-testid="sort-email"
              >
                Email {getSortIcon('email')}
              </button>
            </th>
            <th>
              <button
                onClick={() => handleSort('role')}
                aria-sort={sortField === 'role' ? sortDirection : 'none'}
                data-testid="sort-role"
              >
                Role {getSortIcon('role')}
              </button>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={4} data-testid="no-results">
                {filterText ? `No results found for "${filterText}"` : 'No data available'}
              </td>
            </tr>
          ) : (
            paginatedData.map((item, index) => (
              <tr key={item.id || index} data-testid={`table-row-${item.id}`}>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.role}</td>
                <td>
                  <button
                    onClick={() => console.log('Edit', item.id)}
                    data-testid={`edit-${item.id}`}
                    aria-label={`Edit ${item.name}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => console.log('Delete', item.id)}
                    data-testid={`delete-${item.id}`}
                    aria-label={`Delete ${item.name}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination controls */}
      <div data-testid="pagination">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          data-testid="prev-page"
        >
          Previous
        </button>
        <span data-testid="page-info">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
          data-testid="next-page"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export const InteractiveChart: React.FC<{ data?: any[] }> = ({ data = [] }) => {
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const chartRef = useRef<HTMLDivElement>(null);

  const handlePointClick = (point: any, index: number) => {
    setSelectedPoint(point);
    
    // Announce selection to screen readers
    const announcement = `Selected data point ${index + 1}: ${point.label} with value ${point.value}`;
    const ariaLive = document.createElement('div');
    ariaLive.setAttribute('aria-live', 'polite');
    ariaLive.setAttribute('aria-atomic', 'true');
    ariaLive.style.position = 'absolute';
    ariaLive.style.left = '-9999px';
    ariaLive.textContent = announcement;
    
    document.body.appendChild(ariaLive);
    setTimeout(() => document.body.removeChild(ariaLive), 1000);
  };

  const handlePointHover = (point: any) => {
    setHoveredPoint(point);
  };

  return (
    <div 
      ref={chartRef}
      data-testid="interactive-chart"
      role="img"
      aria-label="Interactive data visualization chart"
    >
      {/* Chart toolbar */}
      <div data-testid="chart-toolbar">
        <button
          onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))}
          data-testid="zoom-out"
          disabled={zoomLevel <= 0.5}
        >
          Zoom Out
        </button>
        <span data-testid="zoom-level">Zoom: {Math.round(zoomLevel * 100)}%</span>
        <button
          onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))}
          data-testid="zoom-in"
          disabled={zoomLevel >= 2}
        >
          Zoom In
        </button>
        <button
          onClick={() => setZoomLevel(1)}
          data-testid="reset-zoom"
        >
          Reset
        </button>
      </div>

      {/* Chart visualization */}
      <div 
        style={{ 
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          transition: 'transform 0.2s ease',
          display: 'flex',
          gap: '10px',
          padding: '20px'
        }}
        data-testid="chart-content"
      >
        {data.map((point, index) => (
          <div
            key={index}
            data-testid={`chart-point-${index}`}
            onClick={() => handlePointClick(point, index)}
            onMouseEnter={() => handlePointHover(point)}
            onMouseLeave={() => setHoveredPoint(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePointClick(point, index);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Data point: ${point.label}, value: ${point.value}`}
            style={{
              width: '50px',
              height: `${point.value}px`,
              minHeight: '20px',
              cursor: 'pointer',
              backgroundColor: selectedPoint === point ? '#007bff' : '#6c757d',
              border: hoveredPoint === point ? '2px solid #ffc107' : '1px solid #dee2e6',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              padding: '4px'
            }}
          >
            {point.value}
          </div>
        ))}
      </div>

      {/* Tooltip for hovered point */}
      {hoveredPoint && (
        <div 
          role="tooltip"
          data-testid="chart-tooltip"
          style={{ 
            position: 'absolute',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '14px',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          {hoveredPoint.label}: {hoveredPoint.value}
        </div>
      )}

      {/* Selected point details */}
      {selectedPoint && (
        <div 
          role="region"
          aria-label="Selected data point details"
          data-testid="selected-point-details"
          style={{
            marginTop: '20px',
            padding: '15px',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            backgroundColor: '#f8f9fa'
          }}
        >
          <h3>Selected Point Details</h3>
          <p><strong>Label:</strong> {selectedPoint.label}</p>
          <p><strong>Value:</strong> {selectedPoint.value}</p>
          <p><strong>Category:</strong> {selectedPoint.category || 'N/A'}</p>
          <button 
            onClick={() => setSelectedPoint(null)}
            data-testid="clear-selection"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};

export const AsyncComponent: React.FC<{ 
  endpoint?: string;
  delay?: number;
  shouldError?: boolean;
}> = ({ 
  endpoint = '/api/data',
  delay = 1000,
  shouldError = false 
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (shouldError) {
        throw new Error('Failed to fetch data from server');
      }
      
      // Simulate successful response
      const mockData = {
        timestamp: new Date().toISOString(),
        endpoint,
        items: [
          { id: 1, name: 'Item 1', value: Math.random() * 100 },
          { id: 2, name: 'Item 2', value: Math.random() * 100 },
          { id: 3, name: 'Item 3', value: Math.random() * 100 }
        ]
      };
      
      setData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      fetchData();
    }
  };

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [endpoint, delay, shouldError]);

  // Loading state
  if (loading) {
    return (
      <div 
        role="status" 
        aria-live="polite"
        data-testid="async-loading"
        style={{ padding: '20px' }}
      >
        <div data-testid="loading-spinner" style={{ marginBottom: '10px' }}>
          <span>⏳</span> Loading...
        </div>
        <p>Fetching data from {endpoint}</p>
        {retryCount > 0 && <p>Retry attempt: {retryCount}</p>}
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div 
        role="alert"
        data-testid="async-error"
        style={{ padding: '20px', border: '1px solid #dc3545', borderRadius: '4px', backgroundColor: '#f8d7da' }}
      >
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <p>Endpoint: {endpoint}</p>
        <p>Retry attempt: {retryCount}/3</p>
        
        <div style={{ marginTop: '15px' }}>
          <button 
            onClick={handleRetry}
            data-testid="retry-button"
            disabled={retryCount >= 3}
            style={{ 
              marginRight: '10px',
              padding: '8px 16px',
              backgroundColor: retryCount >= 3 ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: retryCount >= 3 ? 'not-allowed' : 'pointer'
            }}
          >
            {retryCount >= 3 ? 'Max Retries Reached' : `Retry (${retryCount}/3)`}
          </button>
          
          <button 
            onClick={() => {
              setRetryCount(0);
              setError('');
              fetchData();
            }}
            data-testid="reset-button"
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset & Retry
          </button>
        </div>
      </div>
    );
  }

  // Success state with data
  return (
    <div 
      data-testid="async-success"
      style={{ padding: '20px', border: '1px solid #28a745', borderRadius: '4px', backgroundColor: '#d4edda' }}
    >
      <h3>Data Loaded Successfully ✅</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <p><strong>Endpoint:</strong> {endpoint}</p>
        <p><strong>Loaded at:</strong> {data?.timestamp}</p>
        <p><strong>Items count:</strong> {data?.items?.length || 0}</p>
      </div>
      
      <details>
        <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
          <strong>View Raw Data</strong>
        </summary>
        <pre 
          data-testid="async-data"
          style={{ 
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '14px'
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
      
      <div style={{ marginTop: '15px' }}>
        <button 
          onClick={() => {
            setRetryCount(0);
            fetchData();
          }}
          data-testid="refresh-button"
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// TESTING UTILITIES AND PATTERNS
// =============================================================================

export const customRender = (ui: React.ReactElement, options: any = {}) => {
  // Wrapper component with necessary providers
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <div data-testid="test-wrapper">
        {/* Add theme provider, router, etc. as needed */}
        {children}
      </div>
    );
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

export const customQueries = {
  // Query for form fields with validation states
  queryFormField: (container: HTMLElement, name: string) => {
    const field = container.querySelector(`[name="${name}"], #${name}`);
    const errorElement = container.querySelector(`[data-testid="${name}-error"]`);
    const isInvalid = field?.getAttribute('aria-invalid') === 'true';
    
    return {
      field,
      errorElement,
      isInvalid,
      hasError: !!errorElement,
      errorText: errorElement?.textContent || ''
    };
  },

  // Query for table rows by specific content
  queryTableRowByContent: (container: HTMLElement, content: string) => {
    const rows = container.querySelectorAll('tbody tr');
    return Array.from(rows).find(row => 
      row.textContent?.toLowerCase().includes(content.toLowerCase())
    );
  },

  // Query for interactive elements with specific states
  queryInteractiveElement: (container: HTMLElement, role: string, state: string) => {
    const elements = container.querySelectorAll(`[role="${role}"]`);
    return Array.from(elements).find(el => {
      const ariaPressed = el.getAttribute('aria-pressed');
      const ariaSelected = el.getAttribute('aria-selected');
      const disabled = el.hasAttribute('disabled');
      
      switch (state) {
        case 'pressed': return ariaPressed === 'true';
        case 'selected': return ariaSelected === 'true';
        case 'disabled': return disabled;
        default: return false;
      }
    });
  }
};

export const testHelpers = {
  // Helper to fill out and submit forms
  fillAndSubmitForm: async (formData: Record<string, any>) => {
    const user = userEvent.setup();
    
    // Fill out form fields
    for (const [field, value] of Object.entries(formData)) {
      const input = screen.getByLabelText(new RegExp(field, 'i'));
      
      if (input.type === 'checkbox') {
        if (value) await user.click(input);
      } else if (input.tagName === 'SELECT') {
        await user.selectOptions(input, value);
      } else {
        await user.clear(input);
        await user.type(input, String(value));
      }
    }
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit|register|save/i });
    await user.click(submitButton);
    
    // Wait for form processing
    await waitFor(() => {
      expect(screen.queryByText(/loading|submitting/i)).not.toBeInTheDocument();
    }, { timeout: 5000 });
  },

  // Helper to test table interactions
  testTableInteractions: async (searchTerm: string, sortField: string) => {
    const user = userEvent.setup();
    
    // Search in table
    const searchInput = screen.getByLabelText(/search/i);
    await user.clear(searchInput);
    await user.type(searchInput, searchTerm);
    
    // Wait for search results
    await waitFor(() => {
      const noResults = screen.queryByTestId('no-results');
      const hasResults = screen.queryAllByTestId(/table-row/).length > 0;
      expect(noResults || hasResults).toBeTruthy();
    });
    
    // Sort by field
    const sortButton = screen.getByTestId(`sort-${sortField}`);
    await user.click(sortButton);
    
    // Verify sort indicators
    await waitFor(() => {
      const sortedButton = screen.getByTestId(`sort-${sortField}`);
      expect(sortedButton).toHaveAttribute('aria-sort');
    });
  },

  // Helper to test async loading states
  testAsyncStates: async (component: React.ReactElement) => {
    render(component);
    
    // Verify loading state
    expect(screen.getByTestId('async-loading')).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    // Wait for completion (success or error)
    await waitFor(() => {
      const success = screen.queryByTestId('async-success');
      const error = screen.queryByTestId('async-error');
      expect(success || error).toBeTruthy();
    }, { timeout: 5000 });
    
    // Return final state for further assertions
    const success = screen.queryByTestId('async-success');
    const error = screen.queryByTestId('async-error');
    
    return {
      success: !!success,
      error: !!error,
      data: success ? screen.queryByTestId('async-data')?.textContent : null
    };
  }
};

// =============================================================================
// DEMO COMPONENT FOR TESTING
// =============================================================================

export const TestingLibraryMasteryDemo: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('form');
  
  const sampleData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor' },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'Manager' },
    { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'User' }
  ];

  const chartData = [
    { label: 'Q1 2023', value: 100, category: 'Sales' },
    { label: 'Q2 2023', value: 150, category: 'Sales' },
    { label: 'Q3 2023', value: 120, category: 'Sales' },
    { label: 'Q4 2023', value: 200, category: 'Sales' }
  ];

  return (
    <div data-testid="testing-demo">
      <nav data-testid="demo-navigation" style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <button 
          onClick={() => setCurrentView('form')}
          data-testid="nav-form"
          aria-pressed={currentView === 'form'}
          style={{ 
            margin: '0 10px 0 0', 
            padding: '10px 15px',
            backgroundColor: currentView === 'form' ? '#007bff' : '#f8f9fa',
            color: currentView === 'form' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Complex Form
        </button>
        <button 
          onClick={() => setCurrentView('table')}
          data-testid="nav-table"
          aria-pressed={currentView === 'table'}
          style={{ 
            margin: '0 10px 0 0', 
            padding: '10px 15px',
            backgroundColor: currentView === 'table' ? '#007bff' : '#f8f9fa',
            color: currentView === 'table' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Data Table
        </button>
        <button 
          onClick={() => setCurrentView('chart')}
          data-testid="nav-chart"
          aria-pressed={currentView === 'chart'}
          style={{ 
            margin: '0 10px 0 0', 
            padding: '10px 15px',
            backgroundColor: currentView === 'chart' ? '#007bff' : '#f8f9fa',
            color: currentView === 'chart' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Interactive Chart
        </button>
        <button 
          onClick={() => setCurrentView('async')}
          data-testid="nav-async"
          aria-pressed={currentView === 'async'}
          style={{ 
            margin: '0 10px 0 0', 
            padding: '10px 15px',
            backgroundColor: currentView === 'async' ? '#007bff' : '#f8f9fa',
            color: currentView === 'async' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Async Component
        </button>
      </nav>

      <main>
        {currentView === 'form' && <ComplexForm />}
        {currentView === 'table' && <DataTable data={sampleData} />}
        {currentView === 'chart' && <InteractiveChart data={chartData} />}
        {currentView === 'async' && <AsyncComponent />}
      </main>
    </div>
  );
};

export default TestingLibraryMasteryDemo;