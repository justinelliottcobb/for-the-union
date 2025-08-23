import type { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const tests: TestResult[] = [];

  // Test 1: FormValidation Component Implementation
  tests.push(createComponentTest('FormValidation', compiledCode, {
    requiredHooks: ['useId', 'useState', 'useRef'],
    customValidation: (code) => 
      code.includes('data-testid="form-validation"') &&
      code.includes('data-testid="contact-form"') &&
      code.includes('data-testid="submit-button"') &&
      code.includes('role="form"') &&
      code.includes('role="alert"') &&
      code.includes('aria-labelledby') &&
      code.includes('aria-describedby') &&
      code.includes('aria-invalid') &&
      code.includes('required-indicator') &&
      code.includes('fieldset') &&
      code.includes('legend') &&
      code.includes('validateForm') &&
      code.includes('focusFirstError') &&
      code.includes('handleSubmit') &&
      code.includes('handleChange') &&
      !code.includes('TODO: Implement FormValidation'),
    errorMessage: 'FormValidation must implement comprehensive accessible form with ARIA attributes, validation, and focus management'
  }));

  // Test 2: NavigationMenu Component Implementation
  tests.push(createComponentTest('NavigationMenu', compiledCode, {
    requiredHooks: ['useState', 'useRef'],
    customValidation: (code) => 
      code.includes('data-testid="navigation-menu"') &&
      code.includes('data-testid="skip-link"') &&
      code.includes('data-testid="breadcrumb"') &&
      code.includes('role="menubar"') &&
      code.includes('role="menu"') &&
      code.includes('role="menuitem"') &&
      code.includes('aria-haspopup') &&
      code.includes('aria-expanded') &&
      code.includes('aria-labelledby') &&
      code.includes('handleKeyDown') &&
      code.includes('handleSubmenuKeyDown') &&
      code.includes('ArrowRight') &&
      code.includes('ArrowLeft') &&
      code.includes('ArrowDown') &&
      code.includes('ArrowUp') &&
      code.includes('Escape') &&
      code.includes('Home') &&
      code.includes('End') &&
      code.includes('Skip to main content') &&
      !code.includes('TODO: Implement NavigationMenu'),
    errorMessage: 'NavigationMenu must implement accessible menu with ARIA roles, keyboard navigation, and skip links'
  }));

  // Test 3: DataVisualization Component Implementation
  tests.push(createComponentTest('DataVisualization', compiledCode, {
    requiredHooks: ['useState'],
    customValidation: (code) => 
      code.includes('data-testid="data-visualization"') &&
      code.includes('data-testid="data-table"') &&
      code.includes('data-testid="chart-data-details"') &&
      code.includes('data-testid="chart-summary"') &&
      code.includes('role="img"') &&
      code.includes('role="button"') &&
      code.includes('role="status"') &&
      code.includes('aria-labelledby') &&
      code.includes('aria-describedby') &&
      code.includes('aria-live="polite"') &&
      code.includes('caption') &&
      code.includes('scope="col"') &&
      code.includes('scope="row"') &&
      code.includes('handleKeyDown') &&
      code.includes('renderBarChart') &&
      code.includes('renderDataTable') &&
      code.includes('selectedDataPoint') &&
      code.includes('tabIndex={0}') &&
      !code.includes('TODO: Implement DataVisualization'),
    errorMessage: 'DataVisualization must implement accessible charts with alternative formats, keyboard navigation, and screen reader support'
  }));

  // Test 4: ModalSystem Component Implementation
  tests.push(createComponentTest('ModalSystem', compiledCode, {
    requiredHooks: ['useState', 'useRef', 'useEffect'],
    customValidation: (code) => 
      code.includes('data-testid="modal-system"') &&
      code.includes('data-testid="open-info-modal"') &&
      code.includes('data-testid="open-confirm-modal"') &&
      code.includes('data-testid="open-form-modal"') &&
      code.includes('data-testid="modal-backdrop"') &&
      code.includes('role="dialog"') &&
      code.includes('aria-modal="true"') &&
      code.includes('aria-labelledby') &&
      code.includes('aria-describedby') &&
      code.includes('useFocusTrap') &&
      code.includes('openModal') &&
      code.includes('closeModal') &&
      code.includes('handleModalKeyDown') &&
      code.includes('handleBackdropClick') &&
      code.includes('previousFocus') &&
      code.includes('setPreviousFocus') &&
      code.includes('triggerElement') &&
      !code.includes('TODO: Implement ModalSystem'),
    errorMessage: 'ModalSystem must implement accessible modals with focus trapping, ARIA attributes, and proper focus management'
  }));

  // Test 5: Form Validation and ARIA Implementation
  tests.push({
    name: 'FormValidation implements proper ARIA attributes and validation',
    passed: (
      compiledCode.includes('const validateForm = (): ValidationResult => {') &&
      compiledCode.includes('const focusFirstError = () => {') &&
      compiledCode.includes('aria-invalid={hasError ? \'true\' : \'false\'}') &&
      compiledCode.includes('aria-describedby={`${hasError ? errorId') &&
      compiledCode.includes('role="alert"') &&
      compiledCode.includes('const errorId = `${field.id}-error`') &&
      compiledCode.includes('const helpId = `${field.id}-help`') &&
      compiledCode.includes('required-indicator') &&
      compiledCode.includes('aria-label="required"')
    ),
    error: 'FormValidation must implement comprehensive ARIA attributes, validation logic, and error focus management',
    executionTime: 1
  });

  // Test 6: Keyboard Navigation Implementation
  tests.push({
    name: 'NavigationMenu implements comprehensive keyboard navigation',
    passed: (
      compiledCode.includes('const handleKeyDown = (e: React.KeyboardEvent, index: number, itemId: string)') &&
      compiledCode.includes('const handleSubmenuKeyDown = (e: React.KeyboardEvent, parentIndex: number, submenuIndex: number)') &&
      compiledCode.includes('case \'ArrowRight\':') &&
      compiledCode.includes('case \'ArrowLeft\':') &&
      compiledCode.includes('case \'ArrowDown\':') &&
      compiledCode.includes('case \'ArrowUp\':') &&
      compiledCode.includes('case \'Enter\':') &&
      compiledCode.includes('case \'Escape\':') &&
      compiledCode.includes('case \'Home\':') &&
      compiledCode.includes('case \'End\':') &&
      compiledCode.includes('e.preventDefault()') &&
      compiledCode.includes('focus()')
    ),
    error: 'NavigationMenu must implement complete keyboard navigation with arrow keys, Enter, Escape, Home, and End support',
    executionTime: 1
  });

  // Test 7: Data Visualization Accessibility
  tests.push({
    name: 'DataVisualization implements accessible chart patterns',
    passed: (
      compiledCode.includes('role="img"') &&
      compiledCode.includes('aria-labelledby="chart-title"') &&
      compiledCode.includes('aria-describedby="chart-description"') &&
      compiledCode.includes('aria-label={`${item.label}: $${item.value.toLocaleString()}') &&
      compiledCode.includes('role="status"') &&
      compiledCode.includes('aria-live="polite"') &&
      compiledCode.includes('tabIndex={0}') &&
      compiledCode.includes('onKeyDown={(e) => handleKeyDown(e, index)}') &&
      compiledCode.includes('renderDataTable') &&
      compiledCode.includes('<caption>') &&
      compiledCode.includes('scope="col"') &&
      compiledCode.includes('scope="row"')
    ),
    error: 'DataVisualization must implement accessible chart with proper ARIA labels, keyboard navigation, and data table alternative',
    executionTime: 1
  });

  // Test 8: Modal Focus Management
  tests.push({
    name: 'ModalSystem implements proper focus management and trapping',
    passed: (
      compiledCode.includes('const [previousFocus, setPreviousFocus] = useState<HTMLElement | null>(null)') &&
      compiledCode.includes('setPreviousFocus(triggerElement)') &&
      compiledCode.includes('previousFocus?.focus()') &&
      compiledCode.includes('const { focusTrapRef } = useFocusTrap(isModalOpen)') &&
      compiledCode.includes('ref={focusTrapRef}') &&
      compiledCode.includes('const firstFocusable = modalRef.current.querySelector(') &&
      compiledCode.includes('firstFocusable?.focus()') &&
      compiledCode.includes('handleModalKeyDown') &&
      compiledCode.includes('if (e.key === \'Escape\') {')
    ),
    error: 'ModalSystem must implement proper focus management including focus trapping and returning focus to trigger element',
    executionTime: 1
  });

  // Test 9: useFocusTrap Hook Implementation
  tests.push({
    name: 'useFocusTrap hook implements focus trapping functionality',
    passed: (
      compiledCode.includes('export const useFocusTrap = (isActive: boolean) => {') &&
      compiledCode.includes('const focusTrapRef = useRef<HTMLDivElement>(null)') &&
      compiledCode.includes('const focusableElements = focusTrapRef.current.querySelectorAll(') &&
      compiledCode.includes('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') &&
      compiledCode.includes('const firstElement = focusableElements[0] as HTMLElement') &&
      compiledCode.includes('const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement') &&
      compiledCode.includes('const handleTabKey = (e: KeyboardEvent) => {') &&
      compiledCode.includes('if (e.key !== \'Tab\') return') &&
      compiledCode.includes('if (e.shiftKey) {') &&
      compiledCode.includes('document.addEventListener(\'keydown\', handleTabKey)') &&
      compiledCode.includes('document.removeEventListener(\'keydown\', handleTabKey)')
    ),
    error: 'useFocusTrap must implement complete focus trapping with Tab and Shift+Tab handling',
    executionTime: 1
  });

  // Test 10: useAnnouncement Hook Implementation
  tests.push({
    name: 'useAnnouncement hook implements screen reader announcements',
    passed: (
      compiledCode.includes('export const useAnnouncement = () => {') &&
      compiledCode.includes('const [liveRegion, setLiveRegion] = useState<HTMLDivElement | null>(null)') &&
      compiledCode.includes('const region = document.createElement(\'div\')') &&
      compiledCode.includes('region.setAttribute(\'aria-live\', \'polite\')') &&
      compiledCode.includes('region.setAttribute(\'aria-atomic\', \'true\')') &&
      compiledCode.includes('document.body.appendChild(region)') &&
      compiledCode.includes('document.body.removeChild(region)') &&
      compiledCode.includes('const announce = (message: string, priority: \'polite\' | \'assertive\' = \'polite\')') &&
      compiledCode.includes('liveRegion.setAttribute(\'aria-live\', priority)') &&
      compiledCode.includes('liveRegion.textContent = message')
    ),
    error: 'useAnnouncement must implement screen reader announcement functionality with live regions',
    executionTime: 1
  });

  // Test 11: Accessibility Testing Utilities Implementation
  tests.push({
    name: 'Accessibility testing utilities implement violation detection',
    passed: (
      compiledCode.includes('export const getAccessibilityViolations = (element: HTMLElement): string[]') &&
      compiledCode.includes('const violations: string[] = []') &&
      compiledCode.includes('const images = element.querySelectorAll(\'img\')') &&
      compiledCode.includes('const inputs = element.querySelectorAll(\'input, select, textarea\')') &&
      compiledCode.includes('const headings = Array.from(element.querySelectorAll(\'h1, h2, h3, h4, h5, h6\'))') &&
      compiledCode.includes('Image missing alt text') &&
      compiledCode.includes('Form input missing label') &&
      compiledCode.includes('Heading level skipped') &&
      compiledCode.includes('export const simulateScreenReader = (element: HTMLElement): string') &&
      compiledCode.includes('export const checkKeyboardNavigation = (element: HTMLElement)')
    ),
    error: 'Accessibility testing utilities must implement violation detection for images, forms, and heading hierarchy',
    executionTime: 1
  });

  // Test 12: WCAG Compliance Features
  tests.push({
    name: 'Components implement comprehensive WCAG compliance features',
    passed: (
      compiledCode.includes('aria-label') &&
      compiledCode.includes('aria-labelledby') &&
      compiledCode.includes('aria-describedby') &&
      compiledCode.includes('aria-invalid') &&
      compiledCode.includes('aria-expanded') &&
      compiledCode.includes('aria-haspopup') &&
      compiledCode.includes('aria-modal') &&
      compiledCode.includes('aria-live') &&
      compiledCode.includes('role="alert"') &&
      compiledCode.includes('role="dialog"') &&
      compiledCode.includes('role="menubar"') &&
      compiledCode.includes('role="menuitem"') &&
      compiledCode.includes('role="button"') &&
      compiledCode.includes('role="img"') &&
      compiledCode.includes('tabIndex') &&
      (compiledCode.match(/aria-/g) || []).length >= 15 &&
      (compiledCode.match(/role="/g) || []).length >= 8
    ),
    error: 'Components must implement comprehensive WCAG compliance with proper ARIA attributes and roles',
    executionTime: 1
  });

  return tests;
}