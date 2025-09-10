import { TestResult } from '../../../types/test';

export function runTests(userCode: string): TestResult[] {
  const results: TestResult[] = [];
  const startTime = Date.now();

  try {
    // Test 1: SecurityProvider component implementation
    results.push({
      name: 'SecurityProvider component exists',
      passed: userCode.includes('SecurityProvider') &&
              userCode.includes('SecurityContext') &&
              userCode.includes('checkTransaction') &&
              userCode.includes('addSecurityAlert'),
      error: userCode.includes('SecurityProvider')
        ? undefined
        : 'SecurityProvider component must be implemented with security context',
      executionTime: Date.now() - startTime
    });

    // Test 2: TransactionValidator implementation
    results.push({
      name: 'TransactionValidator with simulation',
      passed: userCode.includes('TransactionValidator') &&
              userCode.includes('simulateTransaction') &&
              userCode.includes('validateTransaction') &&
              userCode.includes('riskScore'),
      error: userCode.includes('TransactionValidator')
        ? undefined
        : 'TransactionValidator must implement simulation and validation',
      executionTime: Date.now() - startTime
    });

    // Test 3: PhishingDetector system
    results.push({
      name: 'PhishingDetector with address checking',
      passed: userCode.includes('PhishingDetector') &&
              userCode.includes('checkAddress') &&
              userCode.includes('checkDomain') &&
              userCode.includes('blacklist'),
      error: userCode.includes('PhishingDetector')
        ? undefined
        : 'PhishingDetector must check addresses and domains against blacklists',
      executionTime: Date.now() - startTime
    });

    // Test 4: AuditLogger implementation
    results.push({
      name: 'AuditLogger with immutable logs',
      passed: userCode.includes('AuditLogger') &&
              userCode.includes('calculateHash') &&
              userCode.includes('verify') &&
              userCode.includes('previousHash'),
      error: userCode.includes('AuditLogger')
        ? undefined
        : 'AuditLogger must create immutable audit trail with hash chain',
      executionTime: Date.now() - startTime
    });

    // Test 5: Security configuration management
    results.push({
      name: 'Security configuration system',
      passed: userCode.includes('SecurityConfig') &&
              userCode.includes('requireSimulation') &&
              userCode.includes('securityLevel') &&
              userCode.includes('maxGasPrice'),
      error: userCode.includes('SecurityConfig')
        ? undefined
        : 'Must implement configurable security settings',
      executionTime: Date.now() - startTime
    });

    // Test 6: Alert system implementation
    results.push({
      name: 'Security alert management',
      passed: userCode.includes('SecurityAlert') &&
              userCode.includes('severity') &&
              userCode.includes('timestamp') &&
              (userCode.includes('warning') || userCode.includes('danger')),
      error: userCode.includes('SecurityAlert')
        ? undefined
        : 'Must implement security alert system with severity levels',
      executionTime: Date.now() - startTime
    });

    // Test 7: Transaction simulation
    results.push({
      name: 'Transaction simulation capability',
      passed: userCode.includes('TransactionSimulation') &&
              userCode.includes('gasUsed') &&
              userCode.includes('stateChanges') &&
              userCode.includes('warnings'),
      error: userCode.includes('TransactionSimulation')
        ? undefined
        : 'Must implement transaction simulation with state change analysis',
      executionTime: Date.now() - startTime
    });

    // Test 8: Hardware wallet support
    results.push({
      name: 'Hardware wallet integration',
      passed: userCode.includes('HardwareWallet') ||
              userCode.includes('Ledger') ||
              userCode.includes('Trezor') ||
              userCode.includes('connectHardwareWallet'),
      error: userCode.includes('HardwareWallet') || userCode.includes('Ledger')
        ? undefined
        : 'Should implement hardware wallet support',
      executionTime: Date.now() - startTime
    });

    // Test 9: Multi-signature support
    results.push({
      name: 'Multi-signature wallet support',
      passed: userCode.includes('MultiSig') &&
              (userCode.includes('threshold') || userCode.includes('owners')) &&
              (userCode.includes('proposeTransaction') || userCode.includes('approveTransaction')),
      error: userCode.includes('MultiSig')
        ? undefined
        : 'Must implement multi-signature wallet functionality',
      executionTime: Date.now() - startTime
    });

    // Test 10: Secure storage implementation
    results.push({
      name: 'Secure storage patterns',
      passed: userCode.includes('SecureStorage') &&
              (userCode.includes('encrypt') || userCode.includes('decrypt')) &&
              (userCode.includes('AES') || userCode.includes('crypto')),
      error: userCode.includes('SecureStorage')
        ? undefined
        : 'Must implement secure storage with encryption',
      executionTime: Date.now() - startTime
    });

    results.push({
      name: 'All TODOs completed',
      passed: !userCode.includes('TODO'),
      error: !userCode.includes('TODO')
        ? undefined
        : 'Must complete all TODO items in the exercise',
      executionTime: Date.now() - startTime
    });

  } catch (error) {
    results.push({
      name: 'Code execution',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      executionTime: Date.now() - startTime
    });
  }

  return results;
}