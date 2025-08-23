import React, { useState, useRef, useEffect, useId } from 'react';

// Types for accessibility testing
interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
  validation?: (value: string) => string | null;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

// Form Validation Component - Accessibility testing for forms
export const FormValidation: React.FC = () => {
  const formId = useId();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  
  const firstErrorRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const fields: FormField[] = [
    {
      id: 'firstName',
      label: 'First Name',
      type: 'text',
      required: true,
      validation: (value) => value.length < 2 ? 'First name must be at least 2 characters' : null
    },
    {
      id: 'lastName',
      label: 'Last Name',
      type: 'text',
      required: true,
      validation: (value) => value.length < 2 ? 'Last name must be at least 2 characters' : null
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      validation: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Please enter a valid email address' : null;
      }
    },
    {
      id: 'password',
      label: 'Password',
      type: 'password',
      required: true,
      validation: (value) => value.length < 8 ? 'Password must be at least 8 characters' : null
    },
    {
      id: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      required: true,
      validation: (value) => value !== formData.password ? 'Passwords do not match' : null
    },
    {
      id: 'country',
      label: 'Country',
      type: 'select',
      required: true,
      options: ['', 'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Other']
    },
    {
      id: 'message',
      label: 'Message',
      type: 'textarea',
      required: false
    }
  ];

  const validateForm = (): ValidationResult => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const value = formData[field.id as keyof typeof formData];
      
      if (field.required && !value.trim()) {
        newErrors[field.id] = `${field.label} is required`;
      } else if (value && field.validation) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.id] = error;
        }
      }
    });

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  };

  const focusFirstError = () => {
    const firstErrorField = fields.find(field => errors[field.id]);
    if (firstErrorField) {
      const element = document.getElementById(firstErrorField.id) as HTMLInputElement;
      element?.focus();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    const validation = validateForm();
    
    if (!validation.isValid) {
      setTimeout(() => focusFirstError(), 100);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Form submitted successfully!');
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        country: '',
        message: ''
      });
      setSubmitAttempted(false);
    } catch (error) {
      alert('Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const hasError = !!errors[field.id];
    const value = formData[field.id as keyof typeof formData];
    const errorId = `${field.id}-error`;
    const helpId = `${field.id}-help`;

    const baseProps = {
      id: field.id,
      name: field.id,
      value,
      onChange: handleChange,
      required: field.required,
      'aria-invalid': hasError ? 'true' : 'false',
      'aria-describedby': `${hasError ? errorId : ''} ${field.id === 'email' ? helpId : ''}`.trim() || undefined,
      disabled: isSubmitting,
      ref: hasError && fields.findIndex(f => f.id === field.id) === fields.findIndex(f => errors[f.id]) ? firstErrorRef : undefined
    };

    return (
      <div key={field.id} className="form-group">
        <label htmlFor={field.id} className="form-label">
          {field.label}
          {field.required && (
            <span className="required-indicator" aria-label="required">*</span>
          )}
        </label>
        
        {field.type === 'select' ? (
          <select {...baseProps} className={`form-control ${hasError ? 'error' : ''}`}>
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option || 'Select an option'}
              </option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            {...baseProps}
            className={`form-control ${hasError ? 'error' : ''}`}
            rows={4}
          />
        ) : (
          <input
            {...baseProps}
            type={field.type}
            className={`form-control ${hasError ? 'error' : ''}`}
          />
        )}
        
        {field.id === 'email' && (
          <div id={helpId} className="form-help">
            We'll never share your email address with anyone else.
          </div>
        )}
        
        {hasError && (
          <div id={errorId} role="alert" className="form-error">
            {errors[field.id]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div data-testid="form-validation" className="form-validation-container">
      <h2 id={`${formId}-title`}>Contact Form</h2>
      <p id={`${formId}-description`}>
        Please fill out all required fields marked with an asterisk (*).
      </p>
      
      {submitAttempted && Object.keys(errors).length > 0 && (
        <div role="alert" className="form-summary-error">
          <h3>Please fix the following errors:</h3>
          <ul>
            {Object.entries(errors).map(([fieldId, error]) => (
              <li key={fieldId}>
                <a href={`#${fieldId}`} onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(fieldId)?.focus();
                }}>
                  {fields.find(f => f.id === fieldId)?.label}: {error}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        role="form"
        aria-labelledby={`${formId}-title`}
        aria-describedby={`${formId}-description`}
        data-testid="contact-form"
        className="contact-form"
      >
        <fieldset className="form-fieldset">
          <legend>Personal Information</legend>
          {fields.slice(0, 2).map(renderField)}
        </fieldset>

        <fieldset className="form-fieldset">
          <legend>Account Details</legend>
          {fields.slice(2, 5).map(renderField)}
        </fieldset>

        <fieldset className="form-fieldset">
          <legend>Additional Information</legend>
          {fields.slice(5).map(renderField)}
        </fieldset>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="submit-button"
            className="submit-button"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </button>
          
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                confirmPassword: '',
                country: '',
                message: ''
              });
              setErrors({});
              setSubmitAttempted(false);
            }}
            data-testid="reset-button"
            className="reset-button"
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
};

// Navigation Menu Component - Accessibility testing for navigation
export const NavigationMenu: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [focusedItem, setFocusedItem] = useState<number>(-1);
  const menuRef = useRef<HTMLElement>(null);

  const menuItems = [
    { 
      id: 'home', 
      label: 'Home', 
      href: '/', 
      submenu: null 
    },
    { 
      id: 'products', 
      label: 'Products', 
      href: '/products',
      submenu: [
        { id: 'laptops', label: 'Laptops', href: '/products/laptops' },
        { id: 'phones', label: 'Phones', href: '/products/phones' },
        { id: 'tablets', label: 'Tablets', href: '/products/tablets' }
      ]
    },
    { 
      id: 'services', 
      label: 'Services', 
      href: '/services',
      submenu: [
        { id: 'support', label: 'Technical Support', href: '/services/support' },
        { id: 'consulting', label: 'Consulting', href: '/services/consulting' },
        { id: 'training', label: 'Training', href: '/services/training' }
      ]
    },
    { 
      id: 'about', 
      label: 'About', 
      href: '/about', 
      submenu: null 
    },
    { 
      id: 'contact', 
      label: 'Contact', 
      href: '/contact', 
      submenu: null 
    }
  ];

  const handleKeyDown = (e: React.KeyboardEvent, index: number, itemId: string) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = (index + 1) % menuItems.length;
        setFocusedItem(nextIndex);
        (document.querySelector(`[data-menuitem="${menuItems[nextIndex].id}"]`) as HTMLElement)?.focus();
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = index === 0 ? menuItems.length - 1 : index - 1;
        setFocusedItem(prevIndex);
        (document.querySelector(`[data-menuitem="${menuItems[prevIndex].id}"]`) as HTMLElement)?.focus();
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        const currentItem = menuItems[index];
        if (currentItem.submenu) {
          setActiveMenu(itemId);
          setTimeout(() => {
            (document.querySelector(`[data-submenuitem="${currentItem.submenu![0].id}"]`) as HTMLElement)?.focus();
          }, 0);
        }
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        const item = menuItems[index];
        if (item.submenu) {
          setActiveMenu(activeMenu === itemId ? null : itemId);
        } else {
          // Navigate to link
          window.location.href = item.href;
        }
        break;
        
      case 'Escape':
        setActiveMenu(null);
        setFocusedItem(-1);
        break;
        
      case 'Home':
        e.preventDefault();
        setFocusedItem(0);
        (document.querySelector(`[data-menuitem="${menuItems[0].id}"]`) as HTMLElement)?.focus();
        break;
        
      case 'End':
        e.preventDefault();
        const lastIndex = menuItems.length - 1;
        setFocusedItem(lastIndex);
        (document.querySelector(`[data-menuitem="${menuItems[lastIndex].id}"]`) as HTMLElement)?.focus();
        break;
    }
  };

  const handleSubmenuKeyDown = (e: React.KeyboardEvent, parentIndex: number, submenuIndex: number) => {
    const parentItem = menuItems[parentIndex];
    if (!parentItem.submenu) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        const prevSubmenuIndex = submenuIndex === 0 ? parentItem.submenu.length - 1 : submenuIndex - 1;
        (document.querySelector(`[data-submenuitem="${parentItem.submenu[prevSubmenuIndex].id}"]`) as HTMLElement)?.focus();
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        const nextSubmenuIndex = (submenuIndex + 1) % parentItem.submenu.length;
        (document.querySelector(`[data-submenuitem="${parentItem.submenu[nextSubmenuIndex].id}"]`) as HTMLElement)?.focus();
        break;
        
      case 'ArrowLeft':
      case 'Escape':
        e.preventDefault();
        setActiveMenu(null);
        (document.querySelector(`[data-menuitem="${parentItem.id}"]`) as HTMLElement)?.focus();
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        const nextParentIndex = (parentIndex + 1) % menuItems.length;
        setActiveMenu(null);
        setFocusedItem(nextParentIndex);
        (document.querySelector(`[data-menuitem="${menuItems[nextParentIndex].id}"]`) as HTMLElement)?.focus();
        break;
    }
  };

  return (
    <nav data-testid="navigation-menu" className="navigation-menu" ref={menuRef}>
      {/* Skip Link */}
      <a href="#main-content" className="skip-link" data-testid="skip-link">
        Skip to main content
      </a>
      
      <div role="menubar" aria-label="Main navigation" className="menubar">
        {menuItems.map((item, index) => (
          <div key={item.id} className="menu-item-container">
            <button
              role="menuitem"
              aria-haspopup={item.submenu ? 'true' : 'false'}
              aria-expanded={item.submenu ? (activeMenu === item.id ? 'true' : 'false') : undefined}
              tabIndex={index === 0 ? 0 : -1}
              data-menuitem={item.id}
              data-testid={`menu-${item.id}`}
              className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => {
                if (item.submenu) {
                  setActiveMenu(activeMenu === item.id ? null : item.id);
                } else {
                  window.location.href = item.href;
                }
              }}
              onKeyDown={(e) => handleKeyDown(e, index, item.id)}
              onFocus={() => setFocusedItem(index)}
            >
              {item.label}
              {item.submenu && (
                <span className="submenu-indicator" aria-hidden="true">▼</span>
              )}
            </button>

            {item.submenu && activeMenu === item.id && (
              <ul 
                role="menu" 
                aria-labelledby={`menu-${item.id}`}
                className="submenu"
                data-testid={`submenu-${item.id}`}
              >
                {item.submenu.map((subitem, subIndex) => (
                  <li key={subitem.id} role="none">
                    <a
                      role="menuitem"
                      href={subitem.href}
                      tabIndex={-1}
                      data-submenuitem={subitem.id}
                      data-testid={`submenu-item-${subitem.id}`}
                      className="submenu-item"
                      onKeyDown={(e) => handleSubmenuKeyDown(e, index, subIndex)}
                    >
                      {subitem.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="breadcrumb" data-testid="breadcrumb">
        <ol>
          <li><a href="/">Home</a></li>
          <li><a href="/products">Products</a></li>
          <li aria-current="page">Current Page</li>
        </ol>
      </nav>

      {/* Main heading hierarchy example */}
      <main id="main-content" className="main-content">
        <h1>Page Title (H1)</h1>
        <section>
          <h2>Section Title (H2)</h2>
          <article>
            <h3>Article Title (H3)</h3>
            <p>Content goes here...</p>
          </article>
        </section>
      </main>
    </nav>
  );
};

// Data Visualization Component - Accessibility testing for charts
export const DataVisualization: React.FC = () => {
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');
  const [selectedDataPoint, setSelectedDataPoint] = useState<number>(-1);
  
  const chartData: ChartData[] = [
    { label: 'Q1 Sales', value: 25000, color: '#1f77b4' },
    { label: 'Q2 Sales', value: 32000, color: '#ff7f0e' },
    { label: 'Q3 Sales', value: 28000, color: '#2ca02c' },
    { label: 'Q4 Sales', value: 35000, color: '#d62728' }
  ];

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...chartData.map(item => item.value));

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (index + 1) % chartData.length;
        setSelectedDataPoint(nextIndex);
        (document.querySelector(`[data-chart-item="${nextIndex}"]`) as HTMLElement)?.focus();
        break;
        
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = index === 0 ? chartData.length - 1 : index - 1;
        setSelectedDataPoint(prevIndex);
        (document.querySelector(`[data-chart-item="${prevIndex}"]`) as HTMLElement)?.focus();
        break;
        
      case 'Home':
        e.preventDefault();
        setSelectedDataPoint(0);
        (document.querySelector(`[data-chart-item="0"]`) as HTMLElement)?.focus();
        break;
        
      case 'End':
        e.preventDefault();
        const lastIndex = chartData.length - 1;
        setSelectedDataPoint(lastIndex);
        (document.querySelector(`[data-chart-item="${lastIndex}"]`) as HTMLElement)?.focus();
        break;
    }
  };

  const renderBarChart = () => (
    <div className="bar-chart" role="img" aria-labelledby="chart-title" aria-describedby="chart-description">
      <div className="chart-bars">
        {chartData.map((item, index) => {
          const height = (item.value / maxValue) * 200;
          return (
            <div
              key={item.label}
              className={`bar ${selectedDataPoint === index ? 'focused' : ''}`}
              style={{ 
                height: `${height}px`, 
                backgroundColor: item.color,
                border: selectedDataPoint === index ? '2px solid #000' : 'none'
              }}
              tabIndex={0}
              role="button"
              aria-label={`${item.label}: $${item.value.toLocaleString()}, ${((item.value / totalValue) * 100).toFixed(1)}% of total`}
              data-chart-item={index}
              data-testid={`bar-${index}`}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setSelectedDataPoint(index)}
              onClick={() => setSelectedDataPoint(index)}
            />
          );
        })}
      </div>
    </div>
  );

  const renderDataTable = () => (
    <table className="data-table" data-testid="data-table">
      <caption>Quarterly Sales Data</caption>
      <thead>
        <tr>
          <th scope="col">Quarter</th>
          <th scope="col">Sales ($)</th>
          <th scope="col">Percentage</th>
        </tr>
      </thead>
      <tbody>
        {chartData.map((item, index) => (
          <tr key={item.label} className={selectedDataPoint === index ? 'highlighted' : ''}>
            <th scope="row">{item.label}</th>
            <td>${item.value.toLocaleString()}</td>
            <td>{((item.value / totalValue) * 100).toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Total</th>
          <td>${totalValue.toLocaleString()}</td>
          <td>100%</td>
        </tr>
      </tfoot>
    </table>
  );

  return (
    <div data-testid="data-visualization" className="data-visualization">
      <h2 id="chart-title">Quarterly Sales Performance</h2>
      
      <p id="chart-description">
        This chart shows sales performance across four quarters. 
        Q4 had the highest sales at ${Math.max(...chartData.map(d => d.value)).toLocaleString()}, 
        while Q1 had the lowest at ${Math.min(...chartData.map(d => d.value)).toLocaleString()}.
        Use arrow keys to navigate through data points.
      </p>

      <div className="chart-controls">
        <fieldset>
          <legend>Chart Type</legend>
          {(['bar', 'pie', 'line'] as const).map(type => (
            <label key={type}>
              <input
                type="radio"
                name="chartType"
                value={type}
                checked={chartType === type}
                onChange={(e) => setChartType(e.target.value as typeof chartType)}
                data-testid={`chart-type-${type}`}
              />
              {type.charAt(0).toUpperCase() + type.slice(1)} Chart
            </label>
          ))}
        </fieldset>
      </div>

      <div className="chart-container">
        {chartType === 'bar' && renderBarChart()}
        
        {selectedDataPoint >= 0 && (
          <div 
            className="data-point-details" 
            role="status" 
            aria-live="polite"
            data-testid="data-point-details"
          >
            <h3>Selected: {chartData[selectedDataPoint].label}</h3>
            <p>
              Value: ${chartData[selectedDataPoint].value.toLocaleString()} 
              ({((chartData[selectedDataPoint].value / totalValue) * 100).toFixed(1)}% of total)
            </p>
          </div>
        )}
      </div>

      <details className="chart-data" data-testid="chart-data-details">
        <summary>View Data Table</summary>
        {renderDataTable()}
      </details>

      <div className="chart-summary" data-testid="chart-summary">
        <h3>Key Insights</h3>
        <ul>
          <li>Total sales for the year: ${totalValue.toLocaleString()}</li>
          <li>Best performing quarter: Q4 (${Math.max(...chartData.map(d => d.value)).toLocaleString()})</li>
          <li>Growth trend: {chartData[3].value > chartData[0].value ? 'Positive' : 'Negative'}</li>
          <li>Average quarterly sales: ${Math.round(totalValue / 4).toLocaleString()}</li>
        </ul>
      </div>
    </div>
  );
};

// Modal System Component - Accessibility testing for modals
export const ModalSystem: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'confirm' | 'form'>('info');
  const [previousFocus, setPreviousFocus] = useState<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const { focusTrapRef } = useFocusTrap(isModalOpen);

  const openModal = (type: typeof modalType, triggerElement: HTMLElement) => {
    setPreviousFocus(triggerElement);
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Return focus to the element that opened the modal
    setTimeout(() => {
      previousFocus?.focus();
    }, 0);
  };

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Ask for confirmation before closing on backdrop click
      const confirmClose = window.confirm('Are you sure you want to close this dialog?');
      if (confirmClose) {
        closeModal();
      }
    }
  };

  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      const firstFocusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isModalOpen]);

  const renderModalContent = () => {
    switch (modalType) {
      case 'info':
        return (
          <>
            <h2 id="modal-title">Information Dialog</h2>
            <div id="modal-description">
              <p>This is an informational modal dialog demonstrating accessibility features.</p>
              <p>Key features include:</p>
              <ul>
                <li>Focus trapping within the modal</li>
                <li>Proper ARIA attributes</li>
                <li>Keyboard navigation support</li>
                <li>Screen reader announcements</li>
              </ul>
            </div>
            <div className="modal-actions">
              <button onClick={closeModal} data-testid="modal-close-button">
                Close
              </button>
            </div>
          </>
        );
        
      case 'confirm':
        return (
          <>
            <h2 id="modal-title">Confirm Action</h2>
            <div id="modal-description">
              <p>Are you sure you want to proceed with this action? This cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => {
                  alert('Action confirmed!');
                  closeModal();
                }} 
                data-testid="modal-confirm-button"
                className="confirm-button"
              >
                Confirm
              </button>
              <button 
                onClick={closeModal} 
                data-testid="modal-cancel-button"
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </>
        );
        
      case 'form':
        return (
          <>
            <h2 id="modal-title">Contact Form</h2>
            <div id="modal-description">
              <p>Please fill out the form below to get in touch.</p>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              alert('Form submitted!');
              closeModal();
            }}>
              <div className="form-group">
                <label htmlFor="modal-name">Name:</label>
                <input 
                  id="modal-name" 
                  type="text" 
                  required 
                  data-testid="modal-name-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-email">Email:</label>
                <input 
                  id="modal-email" 
                  type="email" 
                  required 
                  data-testid="modal-email-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="modal-message">Message:</label>
                <textarea 
                  id="modal-message" 
                  required 
                  rows={4}
                  data-testid="modal-message-input"
                />
              </div>
              
              <div className="modal-actions">
                <button type="submit" data-testid="modal-submit-button">
                  Send Message
                </button>
                <button type="button" onClick={closeModal} data-testid="modal-cancel-button">
                  Cancel
                </button>
              </div>
            </form>
          </>
        );
    }
  };

  return (
    <div data-testid="modal-system" className="modal-system">
      <h2>Modal Dialog Examples</h2>
      <p>Click the buttons below to open different types of accessible modal dialogs.</p>
      
      <div className="modal-triggers">
        <button
          onClick={(e) => openModal('info', e.currentTarget)}
          data-testid="open-info-modal"
          className="trigger-button"
        >
          Open Info Modal
        </button>
        
        <button
          onClick={(e) => openModal('confirm', e.currentTarget)}
          data-testid="open-confirm-modal"
          className="trigger-button"
        >
          Open Confirmation Modal
        </button>
        
        <button
          onClick={(e) => openModal('form', e.currentTarget)}
          data-testid="open-form-modal"
          className="trigger-button"
        >
          Open Form Modal
        </button>
      </div>

      {isModalOpen && (
        <div 
          className="modal-backdrop" 
          onClick={handleBackdropClick}
          data-testid="modal-backdrop"
        >
          <div
            ref={focusTrapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
            className="modal"
            onKeyDown={handleModalKeyDown}
            data-testid={`${modalType}-modal`}
          >
            <div className="modal-content">
              {renderModalContent()}
              
              <button
                className="modal-close-x"
                onClick={closeModal}
                aria-label="Close dialog"
                data-testid="modal-close-x"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Accessibility Testing App Component
export const AccessibilityTestingApp: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<'form' | 'navigation' | 'charts' | 'modals'>('form');
  
  const components = {
    form: FormValidation,
    navigation: NavigationMenu,
    charts: DataVisualization,
    modals: ModalSystem
  };

  const ComponentToRender = components[activeComponent];

  return (
    <div data-testid="accessibility-app" className="accessibility-app">
      <header role="banner">
        <h1>Accessibility Testing Application</h1>
        <p>This application demonstrates comprehensive accessibility testing patterns.</p>
      </header>

      <nav role="navigation" aria-label="Component selection">
        <ul className="component-tabs">
          {Object.keys(components).map(key => (
            <li key={key}>
              <button
                onClick={() => setActiveComponent(key as keyof typeof components)}
                className={activeComponent === key ? 'active' : ''}
                aria-pressed={activeComponent === key}
                data-testid={`${key}-tab`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main role="main" className="main-content">
        <ComponentToRender />
      </main>
    </div>
  );
};

// Utility hooks for accessibility testing
export const useAccessibleForm = (fields: FormField[]) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      const value = values[field.id] || '';
      
      if (field.required && !value.trim()) {
        newErrors[field.id] = `${field.label} is required`;
      } else if (value && field.validation) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.id] = error;
        }
      }
    });

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      focusFirstError();
      return false;
    }
    
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const focusFirstError = () => {
    const firstErrorField = fields.find(field => errors[field.id]);
    if (firstErrorField) {
      const element = document.getElementById(firstErrorField.id) as HTMLInputElement;
      element?.focus();
    }
  };

  return {
    values,
    errors,
    handleSubmit,
    handleChange,
    focusFirstError
  };
};

export const useFocusTrap = (isActive: boolean) => {
  const focusTrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !focusTrapRef.current) return;

    const focusableElements = focusTrapRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return { focusTrapRef };
};

export const useAnnouncement = () => {
  const [liveRegion, setLiveRegion] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const region = document.createElement('div');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';
    
    document.body.appendChild(region);
    setLiveRegion(region);

    return () => {
      document.body.removeChild(region);
    };
  }, []);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!liveRegion) return;
    
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    
    // Clear the message after announcement
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);
  };

  return { announce };
};

// Utility functions for accessibility testing
export const getAccessibilityViolations = (element: HTMLElement): string[] => {
  const violations: string[] = [];

  // Check for images without alt text
  const images = element.querySelectorAll('img');
  images.forEach(img => {
    if (!img.getAttribute('alt') && img.getAttribute('alt') !== '') {
      violations.push(`Image missing alt text: ${img.src || 'unknown source'}`);
    }
  });

  // Check for form inputs without labels
  const inputs = element.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    
    if (id) {
      const label = element.querySelector(`label[for="${id}"]`);
      if (!label && !ariaLabel && !ariaLabelledBy) {
        violations.push(`Form input missing label: ${input.tagName.toLowerCase()} with id="${id}"`);
      }
    }
  });

  // Check heading hierarchy
  const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let currentLevel = 0;
  
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    if (currentLevel > 0 && level > currentLevel + 1) {
      violations.push(`Heading level skipped: ${heading.tagName} follows h${currentLevel}`);
    }
    currentLevel = level;
  });

  return violations;
};

export const simulateScreenReader = (element: HTMLElement): string => {
  const getAccessibleText = (el: Element): string => {
    // Check for aria-label first
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Check for aria-labelledby
    const ariaLabelledBy = el.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) return labelElement.textContent || '';
    }

    // For form elements, check associated label
    if (el.tagName.match(/^(INPUT|SELECT|TEXTAREA)$/)) {
      const id = el.getAttribute('id');
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) return label.textContent || '';
      }
    }

    // Return text content
    return el.textContent || '';
  };

  const parts: string[] = [];
  
  // Process headings
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(heading => {
    parts.push(`${heading.tagName} ${getAccessibleText(heading)}`);
  });

  // Process links
  const links = element.querySelectorAll('a[href]');
  links.forEach(link => {
    parts.push(`Link ${getAccessibleText(link)}`);
  });

  // Process buttons
  const buttons = element.querySelectorAll('button');
  buttons.forEach(button => {
    parts.push(`Button ${getAccessibleText(button)}`);
  });

  // Process form fields
  const formFields = element.querySelectorAll('input, select, textarea');
  formFields.forEach(field => {
    const type = field.getAttribute('type') || field.tagName.toLowerCase();
    const required = field.hasAttribute('required') ? ' required' : '';
    parts.push(`${type}${required} ${getAccessibleText(field)}`);
  });

  return parts.join('. ');
};

export const checkKeyboardNavigation = (element: HTMLElement) => {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ];

  const focusableElements = Array.from(
    element.querySelectorAll(focusableSelectors.join(', '))
  ) as HTMLElement[];

  const tabOrder = focusableElements
    .map(el => ({
      element: el,
      tabIndex: parseInt(el.getAttribute('tabindex') || '0')
    }))
    .sort((a, b) => a.tabIndex - b.tabIndex)
    .map(item => item.element);

  const hasVisibleFocusIndicators = focusableElements.every(el => {
    const styles = window.getComputedStyle(el, ':focus');
    return (
      styles.outline !== 'none' ||
      styles.boxShadow !== 'none' ||
      styles.border !== styles.getPropertyValue('border') // Different focus border
    );
  });

  return {
    focusableElements,
    tabOrder,
    hasVisibleFocusIndicators
  };
};