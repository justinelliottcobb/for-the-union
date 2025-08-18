import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DOMPurify from 'dompurify';
import SecureLS from 'secure-ls';
import CryptoJS from 'crypto-js';

// Security Configuration Types
interface CSPConfig {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  connectSrc: string[];
  fontSrc: string[];
  objectSrc: string[];
  mediaSrc: string[];
  frameSrc: string[];
  reportUri?: string;
  reportOnly?: boolean;
}

interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security': string;
}

interface InputValidationRule {
  type: 'regex' | 'length' | 'whitelist' | 'blacklist' | 'custom';
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  whitelist?: string[];
  blacklist?: string[];
  validator?: (value: string) => boolean;
  message: string;
}

interface SecurityPolicy {
  xss: {
    enabled: boolean;
    allowedTags: string[];
    allowedAttributes: Record<string, string[]>;
    sanitizeOptions: DOMPurify.Config;
  };
  csrf: {
    enabled: boolean;
    tokenHeader: string;
    cookieName: string;
    sameSite: 'strict' | 'lax' | 'none';
  };
  rateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
    blockDuration: number;
  };
  encryption: {
    algorithm: string;
    keySize: number;
    saltLength: number;
  };
}

interface ThreatAssessment {
  id: string;
  type: 'xss' | 'csrf' | 'injection' | 'dos' | 'data-leak' | 'unauthorized-access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  vector: string;
  impact: string;
  mitigation: string[];
  detected: boolean;
  timestamp: Date;
}

interface SecurityMetrics {
  blockedRequests: number;
  xssAttempts: number;
  csrfAttempts: number;
  rateLimitHits: number;
  encryptionOperations: number;
  validationFailures: number;
}

// TODO: Implement CSPHandler class
class CSPHandler {
  private config: CSPConfig;
  private nonces: Set<string> = new Set();

  constructor(config: CSPConfig) {
    this.config = config;
  }

  // TODO: Generate CSP header string
  generateCSPHeader(): string {
    // Build CSP directive string from configuration
    // Include nonces for inline scripts and styles
    // Handle different directive types
    // Return complete CSP header value
    return '';
  }

  // TODO: Generate cryptographic nonce
  generateNonce(): string {
    // Generate cryptographically secure nonce
    // Store nonce for validation
    // Use for inline script/style execution
    // Return base64 encoded nonce
    return '';
  }

  // TODO: Validate nonce
  validateNonce(nonce: string): boolean {
    // Check if nonce exists in valid set
    // Remove used nonces (single use)
    // Return validation result
    return false;
  }

  // TODO: Add dynamic source to CSP
  addDynamicSource(directive: keyof CSPConfig, source: string): void {
    // Add source to specific CSP directive
    // Update CSP header if needed
    // Handle source validation
  }

  // TODO: Report CSP violations
  handleCSPViolation(violation: any): void {
    // Parse CSP violation report
    // Log security incident
    // Trigger alerting if needed
    // Store for analysis
  }

  // TODO: Enable CSP report-only mode
  enableReportOnly(): void {
    // Switch to report-only mode for testing
    // Monitor violations without blocking
    // Useful for CSP deployment testing
  }
}

// TODO: Implement XSSProtection class
class XSSProtection {
  private sanitizer: typeof DOMPurify;
  private config: SecurityPolicy['xss'];

  constructor(config: SecurityPolicy['xss']) {
    this.config = config;
    this.sanitizer = DOMPurify;
  }

  // TODO: Sanitize HTML content
  sanitizeHTML(content: string): string {
    // Use DOMPurify to sanitize HTML
    // Apply configuration options
    // Handle special cases and edge cases
    // Return sanitized content
    return '';
  }

  // TODO: Sanitize user input
  sanitizeInput(input: string, context: 'html' | 'attribute' | 'css' | 'url'): string {
    // Context-aware input sanitization
    // Handle different input contexts
    // Apply appropriate escaping
    // Return sanitized input
    return '';
  }

  // TODO: Validate and sanitize URLs
  sanitizeURL(url: string): string {
    // Validate URL format and protocol
    // Check against allowed domains
    // Prevent javascript: and data: URLs
    // Return sanitized URL or empty string
    return '';
  }

  // TODO: Encode output for different contexts
  encodeForContext(data: string, context: 'html' | 'attribute' | 'css' | 'js' | 'url'): string {
    // Context-specific output encoding
    // Prevent XSS in different contexts
    // Handle special characters appropriately
    // Return encoded data
    return '';
  }

  // TODO: Detect XSS patterns
  detectXSSPatterns(input: string): boolean {
    // Scan input for known XSS patterns
    // Use regex and heuristics
    // Check for encoded payloads
    // Return true if suspicious patterns found
    return false;
  }

  // TODO: Content Security Policy integration
  generateCSPForContent(content: string): string[] {
    // Analyze content for CSP requirements
    // Extract inline script/style hashes
    // Generate appropriate CSP directives
    // Return CSP sources array
    return [];
  }
}

// TODO: Implement SecureStorage class
class SecureStorage {
  private encryptor: SecureLS;
  private config: SecurityPolicy['encryption'];

  constructor(config: SecurityPolicy['encryption']) {
    this.config = config;
    this.encryptor = new SecureLS({
      encodingType: 'aes',
      isCompression: false,
      encryptionSecret: this.generateEncryptionKey(),
    });
  }

  // TODO: Generate encryption key
  private generateEncryptionKey(): string {
    // Generate strong encryption key
    // Use cryptographically secure random
    // Consider key derivation if needed
    // Return encryption key
    return '';
  }

  // TODO: Store sensitive data securely
  setSecure(key: string, value: any, expirationMs?: number): void {
    // Encrypt and store data
    // Handle expiration timestamps
    // Add integrity checks
    // Store in secure storage
  }

  // TODO: Retrieve and decrypt data
  getSecure(key: string): any {
    // Retrieve encrypted data
    // Check expiration
    // Decrypt and validate integrity
    // Return decrypted data or null
    return null;
  }

  // TODO: Remove sensitive data
  removeSecure(key: string): void {
    // Securely remove data
    // Clear from all storage locations
    // Overwrite memory if possible
  }

  // TODO: Encrypt arbitrary data
  encrypt(data: string): string {
    // Encrypt data with current configuration
    // Add salt and IV
    // Return encrypted string
    return '';
  }

  // TODO: Decrypt arbitrary data
  decrypt(encryptedData: string): string {
    // Decrypt data with current configuration
    // Validate integrity
    // Return decrypted string
    return '';
  }

  // TODO: Clear all secure storage
  clearAll(): void {
    // Remove all encrypted data
    // Clear storage mechanisms
    // Reset encryption state
  }

  // TODO: Rotate encryption keys
  rotateKeys(): void {
    // Generate new encryption key
    // Re-encrypt existing data
    // Update key references
    // Securely dispose old keys
  }
}

// TODO: Implement InputSanitizer class
class InputSanitizer {
  private validationRules: Map<string, InputValidationRule[]> = new Map();

  // TODO: Add validation rule
  addRule(fieldName: string, rule: InputValidationRule): void {
    // Add validation rule for field
    // Support multiple rules per field
    // Validate rule configuration
  }

  // TODO: Validate input against rules
  validate(fieldName: string, value: string): { isValid: boolean; errors: string[] } {
    // Get rules for field
    // Apply all validation rules
    // Collect validation errors
    // Return validation result
    return { isValid: true, errors: [] };
  }

  // TODO: Sanitize SQL input
  sanitizeSQL(input: string): string {
    // Escape SQL special characters
    // Handle injection patterns
    // Use parameterized query patterns
    // Return sanitized input
    return '';
  }

  // TODO: Sanitize NoSQL input
  sanitizeNoSQL(input: any): any {
    // Handle NoSQL injection patterns
    // Validate object structures
    // Escape dangerous operators
    // Return sanitized input
    return input;
  }

  // TODO: Validate file uploads
  validateFileUpload(file: File, allowedTypes: string[], maxSize: number): { isValid: boolean; error?: string } {
    // Check file type and extension
    // Validate file size
    // Scan for malicious content
    // Return validation result
    return { isValid: true };
  }

  // TODO: Sanitize file names
  sanitizeFileName(fileName: string): string {
    // Remove dangerous characters
    // Limit file name length
    // Prevent directory traversal
    // Return sanitized name
    return '';
  }

  // TODO: Rate limiting integration
  checkRateLimit(identifier: string, action: string): boolean {
    // Check rate limit for user/IP
    // Track request counts
    // Apply rate limiting rules
    // Return true if allowed
    return true;
  }
}

// TODO: Implement SecurityAuditor class
class SecurityAuditor {
  private threats: Map<string, ThreatAssessment> = new Map();
  private metrics: SecurityMetrics = {
    blockedRequests: 0,
    xssAttempts: 0,
    csrfAttempts: 0,
    rateLimitHits: 0,
    encryptionOperations: 0,
    validationFailures: 0,
  };

  // TODO: Scan for security threats
  scanForThreats(input: any, context: string): ThreatAssessment[] {
    // Analyze input for security threats
    // Check against known patterns
    // Assess threat severity
    // Return threat assessments
    return [];
  }

  // TODO: Log security event
  logSecurityEvent(type: ThreatAssessment['type'], details: any): void {
    // Create security event log
    // Include contextual information
    // Store for analysis and reporting
    // Trigger alerts for critical events
  }

  // TODO: Generate security report
  generateSecurityReport(): SecurityMetrics & { threats: ThreatAssessment[] } {
    // Compile security metrics
    // Include threat assessments
    // Calculate risk scores
    // Return comprehensive report
    return {
      ...this.metrics,
      threats: Array.from(this.threats.values()),
    };
  }

  // TODO: Update security metrics
  updateMetrics(type: keyof SecurityMetrics): void {
    // Increment specific metric counters
    // Track security-related events
    // Maintain rolling windows if needed
  }

  // TODO: Assess application security posture
  assessSecurityPosture(): { score: number; recommendations: string[] } {
    // Analyze current security configuration
    // Check for security gaps
    // Generate recommendations
    // Return security score and advice
    return { score: 0, recommendations: [] };
  }

  // TODO: Monitor for anomalies
  detectAnomalies(): ThreatAssessment[] {
    // Analyze patterns for anomalies
    // Detect unusual behavior
    // Flag potential security incidents
    // Return anomaly assessments
    return [];
  }
}

// TODO: Implement SecurityMiddleware class
class SecurityMiddleware {
  private cspHandler: CSPHandler;
  private xssProtection: XSSProtection;
  private secureStorage: SecureStorage;
  private inputSanitizer: InputSanitizer;
  private auditor: SecurityAuditor;

  constructor(config: SecurityPolicy) {
    // Initialize security components
    // Configure based on policy
    // Set up monitoring and logging
  }

  // TODO: Apply security headers
  applySecurityHeaders(): SecurityHeaders {
    // Generate all required security headers
    // Include CSP, HSTS, XSS protection
    // Configure frame options and content type
    // Return complete header set
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    };
  }

  // TODO: Process request through security pipeline
  processRequest(request: any): { allowed: boolean; sanitizedData?: any; threats?: ThreatAssessment[] } {
    // Apply input validation and sanitization
    // Check for security threats
    // Apply rate limiting
    // Return processed result
    return { allowed: true };
  }

  // TODO: Secure response data
  secureResponse(data: any): any {
    // Sanitize output data
    // Apply XSS protection
    // Add security headers
    // Return secured response
    return data;
  }
}

// TODO: Implement SecureForm component
interface SecureFormProps {
  onSubmit: (data: Record<string, any>) => void;
  validationRules: Record<string, InputValidationRule[]>;
  enableCSRF?: boolean;
  enableXSSProtection?: boolean;
}

const SecureForm: React.FC<SecureFormProps> = ({ 
  onSubmit, 
  validationRules, 
  enableCSRF = true,
  enableXSSProtection = true 
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [csrfToken, setCsrfToken] = useState<string>('');
  
  const sanitizer = useMemo(() => new InputSanitizer(), []);
  const xssProtection = useMemo(() => new XSSProtection({
    enabled: enableXSSProtection,
    allowedTags: ['b', 'i', 'em', 'strong'],
    allowedAttributes: {},
    sanitizeOptions: {},
  }), [enableXSSProtection]);

  // TODO: Initialize CSRF token
  useEffect(() => {
    if (enableCSRF) {
      // Generate CSRF token
      // Store in form state
      // Send to server for validation
    }
  }, [enableCSRF]);

  // TODO: Handle input changes with sanitization
  const handleInputChange = useCallback((fieldName: string, value: string) => {
    // Sanitize input value
    // Apply XSS protection
    // Update form state
    // Trigger validation
  }, [sanitizer, xssProtection]);

  // TODO: Validate form data
  const validateForm = useCallback((): boolean => {
    // Validate all fields against rules
    // Collect validation errors
    // Update error state
    // Return validation result
    return true;
  }, [formData, validationRules, sanitizer]);

  // TODO: Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Validate form
    // Include CSRF token
    // Sanitize data
    // Call onSubmit with secure data
  }, [formData, validateForm, onSubmit, csrfToken]);

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
      {enableCSRF && (
        <input type="hidden" name="csrf_token" value={csrfToken} />
      )}
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Email *
        </label>
        <input
          type="email"
          value={formData.email || ''}
          onChange={(e) => handleInputChange('email', e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        {errors.email && errors.email.map((error, index) => (
          <div key={index} style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
            {error}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Message *
        </label>
        <textarea
          value={formData.message || ''}
          onChange={(e) => handleInputChange('message', e.target.value)}
          rows={4}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
        {errors.message && errors.message.map((error, index) => (
          <div key={index} style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
            {error}
          </div>
        ))}
      </div>

      <button
        type="submit"
        style={{
          padding: '12px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Submit Secure Form
      </button>
    </form>
  );
};

// TODO: Implement SecurityDashboard component
const SecurityDashboard: React.FC = () => {
  const [securityReport, setSecurityReport] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const auditor = useMemo(() => new SecurityAuditor(), []);

  // TODO: Run security scan
  const runSecurityScan = useCallback(async () => {
    setIsScanning(true);
    // Perform comprehensive security scan
    // Generate security report
    // Update dashboard state
    setIsScanning(false);
  }, [auditor]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h3>Security Dashboard</h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          padding: '15px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4>XSS Protection</h4>
          <div style={{ fontSize: '24px', color: '#28a745' }}>✅</div>
          <p>Active</p>
        </div>
        
        <div style={{ 
          padding: '15px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4>CSP Headers</h4>
          <div style={{ fontSize: '24px', color: '#28a745' }}>✅</div>
          <p>Configured</p>
        </div>
        
        <div style={{ 
          padding: '15px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4>Secure Storage</h4>
          <div style={{ fontSize: '24px', color: '#28a745' }}>✅</div>
          <p>Encrypted</p>
        </div>
        
        <div style={{ 
          padding: '15px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4>Input Validation</h4>
          <div style={{ fontSize: '24px', color: '#ffc107' }}>⚠️</div>
          <p>Partial</p>
        </div>
      </div>

      <button
        onClick={runSecurityScan}
        disabled={isScanning}
        style={{
          padding: '10px 20px',
          backgroundColor: isScanning ? '#6c757d' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isScanning ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isScanning ? 'Scanning...' : 'Run Security Scan'}
      </button>

      {securityReport && (
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '15px' 
        }}>
          <h4>Security Report</h4>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Complete the SecurityAuditor implementation to see detailed security analysis.
          </p>
        </div>
      )}
    </div>
  );
};

// TODO: Implement ContentSanitizer component
const ContentSanitizer: React.FC = () => {
  const [rawContent, setRawContent] = useState('<script>alert("XSS")</script><p>Safe content</p>');
  const [sanitizedContent, setSanitizedContent] = useState('');
  
  const xssProtection = useMemo(() => new XSSProtection({
    enabled: true,
    allowedTags: ['p', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li'],
    allowedAttributes: {},
    sanitizeOptions: {},
  }), []);

  // TODO: Sanitize content
  const sanitizeContent = useCallback(() => {
    // Use XSSProtection to sanitize content
    // Update sanitized content state
    // Show before/after comparison
  }, [rawContent, xssProtection]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h3>Content Sanitization Demo</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Raw HTML Content (potentially dangerous):
        </label>
        <textarea
          value={rawContent}
          onChange={(e) => setRawContent(e.target.value)}
          rows={4}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}
        />
      </div>

      <button
        onClick={sanitizeContent}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Sanitize Content
      </button>

      {sanitizedContent && (
        <div>
          <h4>Sanitized Content:</h4>
          <div style={{
            padding: '15px',
            border: '1px solid #28a745',
            borderRadius: '4px',
            backgroundColor: '#f8f9fa',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}>
            {sanitizedContent}
          </div>
          
          <h4 style={{ marginTop: '20px' }}>Rendered Output:</h4>
          <div 
            style={{
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white'
            }}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      )}
    </div>
  );
};

// Main Demo Component
const SecurityPatternsDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<'dashboard' | 'sanitizer' | 'form'>('dashboard');

  // Example validation rules
  const validationRules = {
    email: [
      {
        type: 'regex' as const,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
      }
    ],
    message: [
      {
        type: 'length' as const,
        minLength: 10,
        maxLength: 500,
        message: 'Message must be between 10 and 500 characters'
      }
    ]
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Security Patterns & OWASP Compliance</h1>
      
      <div style={{ 
        background: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        padding: '15px', 
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <h3>Implementation Required</h3>
        <ul style={{ margin: 0 }}>
          <li>Complete the CSPHandler class with nonce generation and violation reporting</li>
          <li>Implement XSSProtection with context-aware sanitization and encoding</li>
          <li>Build SecureStorage with encryption, key rotation, and secure data handling</li>
          <li>Create InputSanitizer with comprehensive validation and rate limiting</li>
          <li>Implement SecurityAuditor for threat detection and compliance reporting</li>
          <li>Add SecurityMiddleware for request/response security processing</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setActiveDemo('dashboard')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeDemo === 'dashboard' ? '#007bff' : '#f8f9fa',
            color: activeDemo === 'dashboard' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px 0 0 4px',
            cursor: 'pointer'
          }}
        >
          Security Dashboard
        </button>
        <button
          onClick={() => setActiveDemo('sanitizer')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeDemo === 'sanitizer' ? '#007bff' : '#f8f9fa',
            color: activeDemo === 'sanitizer' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderLeft: 'none',
            cursor: 'pointer'
          }}
        >
          Content Sanitizer
        </button>
        <button
          onClick={() => setActiveDemo('form')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeDemo === 'form' ? '#007bff' : '#f8f9fa',
            color: activeDemo === 'form' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderLeft: 'none',
            borderRadius: '0 4px 4px 0',
            cursor: 'pointer'
          }}
        >
          Secure Form
        </button>
      </div>

      {activeDemo === 'dashboard' && <SecurityDashboard />}
      {activeDemo === 'sanitizer' && <ContentSanitizer />}
      {activeDemo === 'form' && (
        <SecureForm 
          onSubmit={(data) => console.log('Secure form submitted:', data)}
          validationRules={validationRules}
        />
      )}

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
        <h3>Security Implementation Guide</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          <div>
            <h4>Content Security Policy</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Nonce-based script execution</li>
              <li>Strict directive configuration</li>
              <li>Violation reporting and monitoring</li>
              <li>Dynamic source management</li>
            </ul>
          </div>
          <div>
            <h4>XSS Prevention</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Context-aware output encoding</li>
              <li>HTML sanitization with DOMPurify</li>
              <li>Input validation and filtering</li>
              <li>Pattern detection and blocking</li>
            </ul>
          </div>
          <div>
            <h4>Secure Storage</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>AES encryption for sensitive data</li>
              <li>Key rotation and management</li>
              <li>Expiration and cleanup</li>
              <li>Cross-tab security sync</li>
            </ul>
          </div>
          <div>
            <h4>Threat Assessment</h4>
            <ul style={{ fontSize: '14px' }}>
              <li>Real-time threat detection</li>
              <li>Security posture assessment</li>
              <li>Anomaly detection and alerting</li>
              <li>Compliance reporting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPatternsDemo;