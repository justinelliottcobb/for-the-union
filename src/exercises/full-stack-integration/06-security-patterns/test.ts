import { TestResult } from '@/types';
import { createComponentTest } from '@/lib/test-utils';

export function runTests(compiledCode: string): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: Security configuration types
  results.push({
    name: 'Security Configuration Type System',
    passed: compiledCode.includes('interface CSPConfig') && 
            compiledCode.includes('interface SecurityHeaders') && 
            compiledCode.includes('interface InputValidationRule') &&
            compiledCode.includes('interface SecurityPolicy') &&
            compiledCode.includes('interface ThreatAssessment') &&
            compiledCode.includes('interface SecurityMetrics'),
    message: compiledCode.includes('interface CSPConfig') ? 
      'Security configuration types properly defined with CSP, headers, validation, and threat assessment' : 
      'Security type definitions are missing or incomplete. Should include comprehensive security configuration types'
  });

  // Test 2: CSPHandler class exists
  results.push({
    name: 'CSPHandler Content Security Policy',
    passed: compiledCode.includes('class CSPHandler') &&
            compiledCode.includes('generateCSPHeader') &&
            compiledCode.includes('generateNonce') &&
            compiledCode.includes('validateNonce') &&
            compiledCode.includes('addDynamicSource') &&
            compiledCode.includes('handleCSPViolation') &&
            compiledCode.includes('enableReportOnly'),
    message: compiledCode.includes('class CSPHandler') ? 
      'CSPHandler class implemented with header generation, nonce management, and violation handling' : 
      'CSPHandler class is missing or incomplete. Should handle CSP headers, nonces, and violation reporting'
  });

  // Test 3: XSSProtection class exists
  results.push({
    name: 'XSSProtection Security Implementation',
    passed: compiledCode.includes('class XSSProtection') &&
            compiledCode.includes('sanitizeHTML') &&
            compiledCode.includes('sanitizeInput') &&
            compiledCode.includes('sanitizeURL') &&
            compiledCode.includes('encodeForContext') &&
            compiledCode.includes('detectXSSPatterns') &&
            compiledCode.includes('DOMPurify'),
    message: compiledCode.includes('class XSSProtection') ? 
      'XSSProtection class implemented with HTML sanitization and context-aware encoding' : 
      'XSSProtection class is missing or incomplete. Should handle XSS prevention with DOMPurify integration'
  });

  // Test 4: SecureStorage class exists
  results.push({
    name: 'SecureStorage Encryption Implementation',
    passed: compiledCode.includes('class SecureStorage') &&
            compiledCode.includes('setSecure') &&
            compiledCode.includes('getSecure') &&
            compiledCode.includes('removeSecure') &&
            compiledCode.includes('encrypt') &&
            compiledCode.includes('decrypt') &&
            compiledCode.includes('rotateKeys') &&
            compiledCode.includes('SecureLS'),
    message: compiledCode.includes('class SecureStorage') ? 
      'SecureStorage class implemented with encryption, secure operations, and key rotation' : 
      'SecureStorage class is missing or incomplete. Should handle encrypted storage with secure-ls integration'
  });

  // Test 5: InputSanitizer class exists
  results.push({
    name: 'InputSanitizer Validation System',
    passed: compiledCode.includes('class InputSanitizer') &&
            compiledCode.includes('addRule') &&
            compiledCode.includes('validate') &&
            compiledCode.includes('sanitizeSQL') &&
            compiledCode.includes('sanitizeNoSQL') &&
            compiledCode.includes('validateFileUpload') &&
            compiledCode.includes('sanitizeFileName') &&
            compiledCode.includes('checkRateLimit'),
    message: compiledCode.includes('class InputSanitizer') ? 
      'InputSanitizer class implemented with validation rules, SQL/NoSQL sanitization, and file validation' : 
      'InputSanitizer class is missing or incomplete. Should handle comprehensive input validation and sanitization'
  });

  // Test 6: SecurityAuditor class exists
  results.push({
    name: 'SecurityAuditor Threat Detection',
    passed: compiledCode.includes('class SecurityAuditor') &&
            compiledCode.includes('scanForThreats') &&
            compiledCode.includes('logSecurityEvent') &&
            compiledCode.includes('generateSecurityReport') &&
            compiledCode.includes('updateMetrics') &&
            compiledCode.includes('assessSecurityPosture') &&
            compiledCode.includes('detectAnomalies'),
    message: compiledCode.includes('class SecurityAuditor') ? 
      'SecurityAuditor class implemented with threat scanning, logging, and security assessment' : 
      'SecurityAuditor class is missing or incomplete. Should handle threat detection, logging, and security analysis'
  });

  // Test 7: SecurityMiddleware class exists
  results.push({
    name: 'SecurityMiddleware Request Processing',
    passed: compiledCode.includes('class SecurityMiddleware') &&
            compiledCode.includes('applySecurityHeaders') &&
            compiledCode.includes('processRequest') &&
            compiledCode.includes('secureResponse') &&
            compiledCode.includes('SecurityHeaders'),
    message: compiledCode.includes('class SecurityMiddleware') ? 
      'SecurityMiddleware class implemented with request processing and security header application' : 
      'SecurityMiddleware class is missing or incomplete. Should handle request/response security processing'
  });

  // Test 8: SecureForm component exists
  results.push({
    name: 'SecureForm Component Implementation',
    passed: compiledCode.includes('SecureForm:') &&
            compiledCode.includes('validationRules') &&
            compiledCode.includes('enableCSRF') &&
            compiledCode.includes('enableXSSProtection') &&
            compiledCode.includes('csrf_token') &&
            compiledCode.includes('handleInputChange'),
    message: compiledCode.includes('SecureForm:') ? 
      'SecureForm component implemented with CSRF protection and XSS prevention' : 
      'SecureForm component is missing or incomplete. Should handle secure form submission with validation'
  });

  // Test 9: SecurityDashboard component exists
  results.push({
    name: 'SecurityDashboard Monitoring Interface',
    passed: compiledCode.includes('SecurityDashboard:') &&
            compiledCode.includes('securityReport') &&
            compiledCode.includes('runSecurityScan') &&
            compiledCode.includes('SecurityAuditor') &&
            compiledCode.includes('isScanning'),
    message: compiledCode.includes('SecurityDashboard:') ? 
      'SecurityDashboard component implemented with security monitoring and scanning' : 
      'SecurityDashboard component is missing or incomplete. Should provide security monitoring interface'
  });

  // Test 10: ContentSanitizer component exists
  results.push({
    name: 'ContentSanitizer Demo Component',
    passed: compiledCode.includes('ContentSanitizer:') &&
            compiledCode.includes('rawContent') &&
            compiledCode.includes('sanitizedContent') &&
            compiledCode.includes('sanitizeContent') &&
            compiledCode.includes('XSSProtection') &&
            compiledCode.includes('dangerouslySetInnerHTML'),
    message: compiledCode.includes('ContentSanitizer:') ? 
      'ContentSanitizer component implemented with content sanitization demo' : 
      'ContentSanitizer component is missing or incomplete. Should demonstrate XSS protection and content sanitization'
  });

  // Test 11: DOMPurify integration
  results.push({
    name: 'DOMPurify XSS Prevention Integration',
    passed: compiledCode.includes('DOMPurify') &&
            compiledCode.includes('sanitizeHTML') &&
            (compiledCode.includes('allowedTags') || compiledCode.includes('sanitizeOptions')) &&
            compiledCode.includes('sanitizer'),
    message: compiledCode.includes('DOMPurify') ? 
      'DOMPurify properly integrated for XSS prevention and HTML sanitization' : 
      'DOMPurify integration is missing or incomplete. Should use DOMPurify for HTML sanitization'
  });

  // Test 12: Secure-LS encryption integration
  results.push({
    name: 'Secure-LS Encryption Integration',
    passed: compiledCode.includes('SecureLS') &&
            compiledCode.includes('encryptor') &&
            compiledCode.includes('generateEncryptionKey') &&
            (compiledCode.includes('aes') || compiledCode.includes('encryption')),
    message: compiledCode.includes('SecureLS') ? 
      'Secure-LS properly integrated for encrypted local storage with AES encryption' : 
      'Secure-LS integration is missing or incomplete. Should use secure-ls for encrypted storage'
  });

  // Test 13: CSP nonce generation
  results.push({
    name: 'CSP Nonce Generation and Validation',
    passed: compiledCode.includes('generateNonce') &&
            compiledCode.includes('validateNonce') &&
            (compiledCode.includes('crypto') || compiledCode.includes('random')) &&
            (compiledCode.includes('base64') || compiledCode.includes('btoa')),
    message: compiledCode.includes('generateNonce') ? 
      'CSP nonce generation and validation implemented with cryptographic security' : 
      'CSP nonce handling is missing or incomplete. Should generate and validate cryptographic nonces'
  });

  // Test 14: Input validation rules
  results.push({
    name: 'Comprehensive Input Validation',
    passed: compiledCode.includes('InputValidationRule') &&
            compiledCode.includes('validationRules') &&
            (compiledCode.includes('regex') || compiledCode.includes('pattern')) &&
            (compiledCode.includes('length') || compiledCode.includes('minLength')) &&
            (compiledCode.includes('whitelist') || compiledCode.includes('blacklist')),
    message: compiledCode.includes('InputValidationRule') ? 
      'Input validation rules implemented with regex patterns, length checks, and allow/deny lists' : 
      'Input validation is missing or incomplete. Should support multiple validation rule types'
  });

  // Test 15: Component integration test
  const componentResult = createComponentTest(
    'SecurityPatternsDemo',
    compiledCode,
    {
      requiredElements: ['button', 'div'],
      customValidation: (code) => code.includes('Security') || code.includes('OWASP') || code.includes('CSP'),
      errorMessage: 'SecurityPatternsDemo component should render security patterns demonstration interface'
    }
  );
  results.push(componentResult);

  return results;
}