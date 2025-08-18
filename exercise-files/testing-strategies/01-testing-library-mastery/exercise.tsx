import React, { useState, useEffect, useRef } from 'react';

// =============================================================================
// EXERCISE: Advanced React Testing Library Mastery
// =============================================================================
// Learn sophisticated testing patterns used by Staff Frontend Engineers
// Focus: User-centric testing, accessibility testing, async patterns, custom queries
// Tools: React Testing Library, Jest, jest-dom, testing-library/user-event
//
// Complete all TODO sections to build comprehensive testing knowledge
// =============================================================================

// =============================================================================
// FORM INTERFACES AND TYPES
// =============================================================================

export interface FormFieldConfig {
  id: string;
  type: 'text' | 'email' | 'number' | 'checkbox' | 'select';
  label: string;
  required: boolean;
  validation?: (value: any) => string | null;
  options?: string[];
}

export interface FormData {
  name: string;
  email: string;
  age: string;
  preferences: string[];
  agreedToTerms: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// =============================================================================
// FORM VALIDATION UTILITIES
// =============================================================================

export class FormValidator {
  private rules: Map<string, Array<(value: any) => string | null>> = new Map();

  // TODO: Implement validation rule registration
  addRule(fieldName: string, validator: (value: any) => string | null): void {
    // TODO: Add validation rule to field
    // TODO: Support multiple rules per field
  }

  // TODO: Implement form validation
  validate(formData: FormData): ValidationResult {
    // TODO: Run all validation rules
    // TODO: Collect errors by field
    // TODO: Return validation result
    const errors: Record<string, string> = {};
    
    // TODO: Validate name field
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    // TODO: Validate email field  
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    }

    // TODO: Validate age field
    if (!formData.age.trim()) {
      errors.age = 'Age is required';
    }

    // TODO: Validate preferences
    if (formData.preferences.length === 0) {
      errors.preferences = 'Select at least one preference';
    }

    // TODO: Validate terms agreement
    if (!formData.agreedToTerms) {
      errors.agreedToTerms = 'Must agree to terms';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // TODO: Implement field-level validation
  validateField(fieldName: string, value: any): string | null {
    // TODO: Run validation rules for specific field
    // TODO: Return first error or null
    return null;
  }
}

// =============================================================================
// FORM COMPONENT
// =============================================================================

export const ComplexForm: React.FC = () => {
  // TODO: Set up form state management
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    age: '',
    preferences: [],
    agreedToTerms: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // TODO: Create form validator instance
  const validator = useRef(new FormValidator());

  // TODO: Implement field change handler
  const handleFieldChange = (field: keyof FormData, value: any) => {
    // TODO: Update form data
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // TODO: Clear field errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // TODO: Implement form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Validate form
    const result = validator.current.validate(formData);
    
    if (result.isValid) {
      // TODO: Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSubmitted(true);
    } else {
      setErrors(result.errors);
    }

    setIsLoading(false);
  };

  // TODO: Render form JSX
  return (
    <form onSubmit={handleSubmit} data-testid="complex-form">
      <h2>User Registration Form</h2>
      
      <div>
        <label htmlFor="name">Full Name *</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          aria-invalid={!!errors.name}
        />
        {errors.name && <div role="alert">{errors.name}</div>}
      </div>

      <div>
        <label htmlFor="email">Email Address *</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          aria-invalid={!!errors.email}
        />
        {errors.email && <div role="alert">{errors.email}</div>}
      </div>

      <div>
        <label htmlFor="age">Age *</label>
        <input
          id="age"
          type="number"
          value={formData.age}
          onChange={(e) => handleFieldChange('age', e.target.value)}
          aria-invalid={!!errors.age}
        />
        {errors.age && <div role="alert">{errors.age}</div>}
      </div>

      <fieldset>
        <legend>Preferences *</legend>
        <div>
          <input
            type="checkbox"
            id="pref-newsletter"
            checked={formData.preferences.includes('Newsletter')}
            onChange={(e) => {
              const prefs = e.target.checked 
                ? [...formData.preferences, 'Newsletter']
                : formData.preferences.filter(p => p !== 'Newsletter');
              handleFieldChange('preferences', prefs);
            }}
          />
          <label htmlFor="pref-newsletter">Newsletter</label>
        </div>
        {errors.preferences && <div role="alert">{errors.preferences}</div>}
      </fieldset>

      <div>
        <input
          type="checkbox"
          id="terms"
          checked={formData.agreedToTerms}
          onChange={(e) => handleFieldChange('agreedToTerms', e.target.checked)}
          aria-invalid={!!errors.agreedToTerms}
        />
        <label htmlFor="terms">I agree to the Terms and Conditions *</label>
        {errors.agreedToTerms && <div role="alert">{errors.agreedToTerms}</div>}
      </div>

      <button type="submit" disabled={isLoading} data-testid="submit-button">
        {isLoading ? 'Submitting...' : 'Submit'}
      </button>

      {isSubmitted && (
        <div role="alert" data-testid="success-message">
          Registration successful!
        </div>
      )}
    </form>
  );
};

// =============================================================================
// TABLE INTERFACES AND UTILITIES
// =============================================================================

export interface TableData {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export class TableManager {
  private data: TableData[] = [];

  constructor(initialData: TableData[]) {
    this.data = initialData;
  }

  // TODO: Implement data filtering
  filter(searchTerm: string): TableData[] {
    // TODO: Filter data based on search term
    return this.data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }

  // TODO: Implement data sorting
  sort(config: SortConfig): TableData[] {
    // TODO: Sort data based on field and direction
    return [...this.data].sort((a, b) => {
      const aValue = a[config.field as keyof TableData];
      const bValue = b[config.field as keyof TableData];
      
      if (config.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }
}

// =============================================================================
// DATA TABLE COMPONENT
// =============================================================================

export const DataTable: React.FC<{ data?: TableData[] }> = ({ data = [] }) => {
  const [filterText, setFilterText] = useState('');
  const tableManager = useRef(new TableManager(data));

  // TODO: Update table manager when data changes
  useEffect(() => {
    tableManager.current = new TableManager(data);
  }, [data]);

  // TODO: Get filtered data
  const filteredData = tableManager.current.filter(filterText);

  // TODO: Render table rows
  const renderTableRows = () => {
    return filteredData.map((item) => {
      return (
        <tr key={item.id} data-testid="table-row">
          <td>{item.name}</td>
          <td>{item.email}</td>
          <td>{item.role}</td>
        </tr>
      );
    });
  };

  return (
    <div data-testid="data-table">
      <div>
        <label htmlFor="table-search">Search:</label>
        <input
          id="table-search"
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          data-testid="search-input"
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {renderTableRows()}
        </tbody>
      </table>
    </div>
  );
};

// =============================================================================
// DEMO COMPONENT FOR TESTING
// =============================================================================

export const TestingLibraryMasteryDemo: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('form');

  const sampleData: TableData[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' }
  ];

  return (
    <div data-testid="testing-library-mastery-demo">
      <nav data-testid="demo-navigation">
        <button 
          onClick={() => setCurrentView('form')}
          data-testid="nav-form"
          aria-pressed={currentView === 'form'}
        >
          Complex Form
        </button>
        <button 
          onClick={() => setCurrentView('table')}
          data-testid="nav-table"
          aria-pressed={currentView === 'table'}
        >
          Data Table
        </button>
      </nav>

      <main>
        {currentView === 'form' && <ComplexForm />}
        {currentView === 'table' && <DataTable data={sampleData} />}
      </main>
    </div>
  );
};

export default TestingLibraryMasteryDemo;