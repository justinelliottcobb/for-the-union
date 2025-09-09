# Exercise 07: Web3 Security Patterns

## 🎯 Learning Objectives

By the end of this exercise, you will be able to:

1. **Implement comprehensive security providers** for Web3 applications with multi-layered protection
2. **Build transaction validators** with simulation, analysis, and approval workflows
3. **Create phishing detection systems** to protect users from malicious sites and contracts
4. **Develop audit logging systems** for compliance and security monitoring
5. **Integrate hardware wallet support** with secure transaction signing flows

## 📋 Pre-requisites

Before starting this exercise, you should have completed:

- Exercise 01: Web3 Wallet Integration
- Exercise 03: Smart Contract Interaction
- Understanding of Web3 security threats and attack vectors
- Knowledge of transaction simulation and validation
- Familiarity with hardware wallet protocols

## 📚 Introduction

Security is paramount in Web3 applications where transactions are irreversible and users directly control their assets. This exercise teaches you to build enterprise-grade security patterns including transaction validation, phishing protection, secure storage, audit trails, multi-signature support, and hardware wallet integration to protect users and meet regulatory requirements.

## 🛠️ Setup

You'll implement a comprehensive Web3 security system:

### Core Components

1. **SecurityProvider**: Central security context with threat monitoring
2. **TransactionValidator**: Transaction analysis and approval system
3. **PhishingDetector**: Real-time phishing and scam detection
4. **AuditLogger**: Immutable audit trail for all operations

### Key Features

- Transaction simulation before execution
- Address and contract verification
- Phishing site and contract detection
- Hardware wallet integration (Ledger, Trezor)
- Multi-signature wallet support
- Secure key storage patterns
- Real-time threat monitoring

## 📝 Instructions

### Step 1: Implement SecurityProvider Component

Create a comprehensive security context for the application:

```typescript
interface SecurityConfig {
  requireSimulation: boolean;
  requireApproval: boolean;
  maxGasPrice: bigint;
  maxSlippage: number;
  blacklistedAddresses: string[];
  whitelistedContracts: string[];
  securityLevel: 'low' | 'medium' | 'high' | 'paranoid';
}

interface SecurityAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  timestamp: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SecurityConfig>({
    requireSimulation: true,
    requireApproval: true,
    maxGasPrice: ethers.parseEther('0.1'),
    maxSlippage: 5,
    blacklistedAddresses: [],
    whitelistedContracts: [],
    securityLevel: 'high'
  });
  
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  
  const checkTransaction = async (tx: TransactionRequest): Promise<ValidationResult> => {
    // Check against security policies
    // Verify addresses aren't blacklisted
    // Ensure gas price is reasonable
    // Check for unusual patterns
  };
  
  const addSecurityAlert = (alert: Omit<SecurityAlert, 'id' | 'timestamp'>) => {
    setAlerts(prev => [...prev, {
      ...alert,
      id: generateId(),
      timestamp: Date.now()
    }]);
  };
  
  return (
    <SecurityContext.Provider value={{
      config,
      setConfig,
      alerts,
      checkTransaction,
      addSecurityAlert
    }}>
      {children}
    </SecurityContext.Provider>
  );
};
```

Key implementation points:
- Configurable security levels
- Real-time threat monitoring
- Transaction policy enforcement
- Alert management system
- Security event tracking

### Step 2: Build TransactionValidator

Create comprehensive transaction validation and simulation:

```typescript
interface TransactionSimulation {
  success: boolean;
  gasUsed: string;
  stateChanges: StateChange[];
  tokenTransfers: TokenTransfer[];
  warnings: string[];
  riskScore: number;
}

interface StateChange {
  address: string;
  stateDiff: {
    before: any;
    after: any;
  };
}

class TransactionValidator {
  private simulationProviders = [
    'https://api.tenderly.co/api/v1/simulate',
    'https://api.blocknative.com/simulate'
  ];
  
  async simulateTransaction(
    tx: TransactionRequest,
    provider: Provider
  ): Promise<TransactionSimulation> {
    // Use Tenderly or BlockNative for simulation
    const simulation = await this.runSimulation(tx);
    
    // Analyze state changes
    const analysis = this.analyzeStateChanges(simulation);
    
    // Calculate risk score
    const riskScore = this.calculateRiskScore(analysis);
    
    return {
      ...simulation,
      riskScore,
      warnings: this.generateWarnings(analysis)
    };
  }
  
  async validateTransaction(tx: TransactionRequest): Promise<{
    valid: boolean;
    issues: ValidationIssue[];
    suggestions: string[];
  }> {
    const issues: ValidationIssue[] = [];
    
    // Check recipient address
    if (await this.isPhishingAddress(tx.to)) {
      issues.push({
        severity: 'critical',
        message: 'Recipient address flagged as phishing'
      });
    }
    
    // Validate gas settings
    if (tx.gasPrice && tx.gasPrice > this.maxSafeGasPrice) {
      issues.push({
        severity: 'warning',
        message: 'Gas price unusually high'
      });
    }
    
    // Check for reentrancy patterns
    if (await this.hasReentrancyRisk(tx)) {
      issues.push({
        severity: 'warning',
        message: 'Potential reentrancy risk detected'
      });
    }
    
    return {
      valid: issues.filter(i => i.severity === 'critical').length === 0,
      issues,
      suggestions: this.generateSuggestions(issues)
    };
  }
  
  private calculateRiskScore(analysis: any): number {
    let score = 0;
    
    // Factor in various risk indicators
    if (analysis.hasUnverifiedContract) score += 30;
    if (analysis.hasHighValueTransfer) score += 20;
    if (analysis.hasStorageWrites) score += 10;
    if (analysis.hasMultipleRecipients) score += 15;
    
    return Math.min(score, 100);
  }
}
```

### Step 3: Create PhishingDetector

Implement comprehensive phishing and scam detection:

```typescript
interface PhishingDatabase {
  blacklistedDomains: Set<string>;
  blacklistedAddresses: Set<string>;
  suspiciousPatterns: RegExp[];
  verifiedContracts: Map<string, ContractInfo>;
}

class PhishingDetector {
  private database: PhishingDatabase;
  private updateInterval: NodeJS.Timer;
  
  constructor() {
    this.database = {
      blacklistedDomains: new Set(),
      blacklistedAddresses: new Set(),
      suspiciousPatterns: [],
      verifiedContracts: new Map()
    };
    
    this.initializeDatabase();
    this.startPeriodicUpdates();
  }
  
  async initializeDatabase() {
    // Load from multiple threat intelligence sources
    const sources = [
      'https://api.cryptoscamdb.org/v1/blacklist',
      'https://phishing.detector.api/addresses',
      'https://chainabuse.com/api/reports'
    ];
    
    for (const source of sources) {
      try {
        const data = await fetch(source);
        await this.updateDatabase(data);
      } catch (error) {
        console.error(`Failed to fetch from ${source}:`, error);
      }
    }
  }
  
  async checkAddress(address: string): Promise<{
    safe: boolean;
    risk: 'safe' | 'suspicious' | 'dangerous';
    details?: string;
  }> {
    // Check against blacklist
    if (this.database.blacklistedAddresses.has(address.toLowerCase())) {
      return {
        safe: false,
        risk: 'dangerous',
        details: 'Address found in phishing database'
      };
    }
    
    // Check for homograph attacks
    if (this.hasHomographAttack(address)) {
      return {
        safe: false,
        risk: 'suspicious',
        details: 'Address contains suspicious characters'
      };
    }
    
    // Check contract verification status
    const contractInfo = await this.getContractInfo(address);
    if (contractInfo && !contractInfo.verified) {
      return {
        safe: false,
        risk: 'suspicious',
        details: 'Unverified contract'
      };
    }
    
    return { safe: true, risk: 'safe' };
  }
  
  async checkDomain(domain: string): Promise<{
    safe: boolean;
    details?: string;
  }> {
    // Check against known phishing domains
    if (this.database.blacklistedDomains.has(domain)) {
      return {
        safe: false,
        details: 'Domain listed in phishing database'
      };
    }
    
    // Check for typosquatting
    const legitimate = this.findLegitimateVersion(domain);
    if (legitimate && legitimate !== domain) {
      return {
        safe: false,
        details: `Possible typosquatting of ${legitimate}`
      };
    }
    
    // Check SSL certificate
    const sslValid = await this.verifySSlCertificate(domain);
    if (!sslValid) {
      return {
        safe: false,
        details: 'Invalid or missing SSL certificate'
      };
    }
    
    return { safe: true };
  }
  
  private hasHomographAttack(address: string): boolean {
    // Check for visually similar characters
    const suspiciousChars = /[а-яА-Я]/; // Cyrillic characters
    return suspiciousChars.test(address);
  }
}
```

### Step 4: Implement AuditLogger

Create immutable audit logging system:

```typescript
interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  action: string;
  details: any;
  metadata: {
    ip?: string;
    userAgent?: string;
    sessionId?: string;
  };
  hash: string;
  previousHash: string;
}

class AuditLogger {
  private logs: AuditLog[] = [];
  private storageAdapter: StorageAdapter;
  
  constructor(adapter: StorageAdapter) {
    this.storageAdapter = adapter;
  }
  
  async log(action: string, details: any, metadata?: any): Promise<string> {
    const previousLog = this.logs[this.logs.length - 1];
    const previousHash = previousLog?.hash || '0x0';
    
    const log: AuditLog = {
      id: generateId(),
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
      action,
      details,
      metadata: {
        ...metadata,
        ip: await this.getClientIP(),
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId()
      },
      hash: '',
      previousHash
    };
    
    // Calculate hash for immutability
    log.hash = this.calculateHash(log);
    
    // Store locally
    this.logs.push(log);
    
    // Persist to storage
    await this.storageAdapter.store(log);
    
    // Optional: Store hash on blockchain for true immutability
    if (this.blockchainEnabled) {
      await this.storeHashOnChain(log.hash);
    }
    
    return log.id;
  }
  
  private calculateHash(log: Omit<AuditLog, 'hash'>): string {
    const data = JSON.stringify({
      ...log,
      previousHash: log.previousHash
    });
    return keccak256(toUtf8Bytes(data));
  }
  
  async verify(): Promise<boolean> {
    // Verify the integrity of the audit chain
    for (let i = 1; i < this.logs.length; i++) {
      const current = this.logs[i];
      const previous = this.logs[i - 1];
      
      // Verify previous hash reference
      if (current.previousHash !== previous.hash) {
        return false;
      }
      
      // Recalculate and verify current hash
      const recalculated = this.calculateHash({
        ...current,
        hash: undefined
      });
      
      if (recalculated !== current.hash) {
        return false;
      }
    }
    
    return true;
  }
  
  async query(filters: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    action?: string;
  }): Promise<AuditLog[]> {
    let results = [...this.logs];
    
    if (filters.startDate) {
      results = results.filter(log => 
        log.timestamp >= filters.startDate.getTime()
      );
    }
    
    if (filters.userId) {
      results = results.filter(log => 
        log.userId === filters.userId
      );
    }
    
    return results;
  }
}
```

## 💡 Hints

### Hardware Wallet Integration

```typescript
// Ledger integration example
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import Eth from '@ledgerhq/hw-app-eth';

class HardwareWalletManager {
  async connectLedger(): Promise<string> {
    const transport = await TransportWebHID.create();
    const eth = new Eth(transport);
    
    // Get address from first account
    const result = await eth.getAddress("44'/60'/0'/0/0");
    return result.address;
  }
  
  async signTransactionWithLedger(
    tx: TransactionRequest,
    derivationPath: string = "44'/60'/0'/0/0"
  ): Promise<string> {
    const transport = await TransportWebHID.create();
    const eth = new Eth(transport);
    
    // Serialize transaction for signing
    const serialized = serializeTransaction(tx);
    
    // Sign with Ledger
    const signature = await eth.signTransaction(
      derivationPath,
      serialized
    );
    
    return signature;
  }
}
```

### Multi-Signature Implementation

```typescript
interface MultiSigWallet {
  address: string;
  owners: string[];
  threshold: number;
  pendingTransactions: PendingTransaction[];
}

class MultiSigManager {
  async proposeTransaction(
    wallet: MultiSigWallet,
    tx: TransactionRequest
  ): Promise<string> {
    const proposal = {
      id: generateId(),
      transaction: tx,
      signatures: [],
      createdAt: Date.now(),
      status: 'pending'
    };
    
    // Store proposal
    await this.storePendingTransaction(wallet.address, proposal);
    
    // Notify other owners
    await this.notifyOwners(wallet.owners, proposal);
    
    return proposal.id;
  }
  
  async approveTransaction(
    wallet: MultiSigWallet,
    proposalId: string,
    signature: string
  ): Promise<boolean> {
    const proposal = await this.getPendingTransaction(proposalId);
    
    // Add signature
    proposal.signatures.push(signature);
    
    // Check if threshold met
    if (proposal.signatures.length >= wallet.threshold) {
      // Execute transaction
      await this.executeMultiSigTransaction(proposal);
      proposal.status = 'executed';
      return true;
    }
    
    return false;
  }
}
```

### Secure Storage Patterns

```typescript
class SecureStorage {
  private encryptionKey: CryptoKey | null = null;
  
  async initialize(password: string) {
    // Derive encryption key from password
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await this.getKeyMaterial(password);
    
    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  async encryptData(data: any): Promise<string> {
    if (!this.encryptionKey) throw new Error('Not initialized');
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encoded
    );
    
    // Combine IV and ciphertext for storage
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }
  
  async decryptData(encryptedData: string): Promise<any> {
    if (!this.encryptionKey) throw new Error('Not initialized');
    
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      ciphertext
    );
    
    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded);
  }
}
```

## 🎓 Learning Notes

### Security Best Practices

1. **Defense in Depth**: Multiple layers of security
2. **Least Privilege**: Minimal permissions by default
3. **Fail Secure**: Default to denying operations
4. **Audit Everything**: Comprehensive logging
5. **User Education**: Clear security warnings

### Common Attack Vectors

1. **Phishing**: Fake websites and addresses
2. **Reentrancy**: Recursive contract calls
3. **Front-running**: MEV and transaction ordering
4. **Signature Replay**: Reusing signed messages
5. **Private Key Theft**: Malware and social engineering

### Compliance Considerations

```typescript
// GDPR compliance for audit logs
class GDPRCompliantLogger extends AuditLogger {
  async anonymizeOldLogs(daysToKeep: number = 90) {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    for (const log of this.logs) {
      if (log.timestamp < cutoffDate) {
        // Anonymize personal data
        log.userId = this.hashUserId(log.userId);
        log.metadata.ip = 'REDACTED';
        delete log.details.personalInfo;
      }
    }
  }
  
  async exportUserData(userId: string): Promise<AuditLog[]> {
    // GDPR right to data portability
    return this.query({ userId });
  }
  
  async deleteUserData(userId: string): Promise<void> {
    // GDPR right to be forgotten
    this.logs = this.logs.filter(log => log.userId !== userId);
  }
}
```

## 🔍 Debugging Tips

1. **Transaction Simulation**: Always test in simulation first
2. **Security Alerts**: Monitor and respond to alerts promptly
3. **Audit Trail**: Regularly verify audit log integrity
4. **Hardware Wallets**: Test with multiple device types
5. **Phishing Database**: Keep threat intelligence updated

## ✅ Checklist

Before submitting your solution, ensure:

- [ ] SecurityProvider manages global security state
- [ ] Transaction validation includes simulation
- [ ] Phishing detection covers addresses and domains
- [ ] Audit logs are immutable and verifiable
- [ ] Hardware wallet support works correctly
- [ ] Multi-signature flows are implemented
- [ ] Security alerts display prominently
- [ ] Secure storage encrypts sensitive data
- [ ] All security checks run before transactions
- [ ] User receives clear security warnings

## 🚀 Extensions

Once you've completed the basic requirements, try:

1. **Zero-Knowledge Proofs**: Implement privacy-preserving verification
2. **Threshold Signatures**: Advanced multi-party computation
3. **Time-Locked Transactions**: Delayed execution for security
4. **Behavioral Analysis**: Detect unusual user patterns
5. **Security Scoring**: Rate application security posture

## 📚 Resources

- [Web3 Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [OpenZeppelin Security](https://docs.openzeppelin.com/contracts/4.x/)
- [Ledger Developer Portal](https://developers.ledger.com/)
- [Trezor Integration Guide](https://wiki.trezor.io/Developers_guide)
- [CryptoScamDB API](https://cryptoscamdb.org/api)
- [Tenderly Simulation API](https://docs.tenderly.co/simulations/simulation-api)
- [OWASP Web3 Security](https://owasp.org/www-project-web3-security/)