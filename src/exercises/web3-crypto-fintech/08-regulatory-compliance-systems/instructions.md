# Exercise 08: Regulatory Compliance Systems

## 🎯 Learning Objectives

By the end of this exercise, you will be able to:

1. **Build KYC/AML integration systems** with identity verification and document processing
2. **Implement automated compliance monitoring** with real-time transaction screening
3. **Create comprehensive tax reporting** with multi-jurisdiction support and automated calculations
4. **Develop compliance dashboards** with audit trails and regulatory reporting
5. **Integrate GDPR and data privacy controls** with user consent management and data portability

## 📋 Pre-requisites

Before starting this exercise, you should have completed:

- Exercise 01: Web3 Wallet Integration
- Exercise 07: Web3 Security Patterns
- Understanding of regulatory frameworks (AML, KYC, GDPR, MiFID II)
- Knowledge of compliance requirements for fintech applications
- Familiarity with identity verification services and APIs

## 📚 Introduction

Regulatory compliance is essential for fintech and crypto applications operating in regulated environments. This exercise teaches you to build comprehensive compliance systems including KYC/AML integration, automated monitoring, tax reporting, regulatory frameworks, and data privacy controls to meet enterprise requirements.

## 🛠️ Setup

You'll implement a complete regulatory compliance system:

### Core Components

1. **KYCInterface**: Identity verification with document processing
2. **AMLMonitor**: Real-time transaction monitoring and screening
3. **TaxReporter**: Automated tax calculations and multi-jurisdiction reporting
4. **ComplianceChecker**: Policy enforcement and audit trail management

### Key Features

- Identity verification with Jumio, Onfido, or similar services
- Real-time AML screening against watchlists
- Automated tax calculation for crypto transactions
- Multi-jurisdiction compliance support
- GDPR compliance with consent management
- Regulatory reporting automation
- Data retention and deletion policies

## 📝 Instructions

### Step 1: Implement KYCInterface Component

Create comprehensive identity verification system:

```typescript
interface KYCData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  documents: {
    type: 'passport' | 'drivers_license' | 'national_id';
    number: string;
    expiryDate: string;
    issuingCountry: string;
  }[];
  riskScore: number;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'review';
}

interface VerificationProvider {
  name: 'jumio' | 'onfido' | 'veriff';
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
}

class KYCService {
  constructor(private provider: VerificationProvider) {}
  
  async initiateVerification(userId: string): Promise<{
    verificationId: string;
    redirectUrl: string;
  }> {
    switch (this.provider.name) {
      case 'jumio':
        return this.initiateJumioVerification(userId);
      case 'onfido':
        return this.initiateOnfidoVerification(userId);
      case 'veriff':
        return this.initiateVeriffVerification(userId);
      default:
        throw new Error('Unsupported verification provider');
    }
  }
  
  async checkVerificationStatus(verificationId: string): Promise<{
    status: 'pending' | 'completed' | 'failed';
    data?: KYCData;
    errors?: string[];
  }> {
    // Poll verification status from provider
    const response = await this.pollProviderStatus(verificationId);
    
    // Parse and standardize response
    return this.parseProviderResponse(response);
  }
  
  async extractKYCData(verificationResult: any): Promise<KYCData> {
    // Extract and standardize KYC data from provider response
    return {
      firstName: verificationResult.firstName,
      lastName: verificationResult.lastName,
      dateOfBirth: verificationResult.dateOfBirth,
      nationality: verificationResult.nationality,
      address: this.parseAddress(verificationResult.address),
      documents: this.parseDocuments(verificationResult.documents),
      riskScore: this.calculateRiskScore(verificationResult),
      verificationStatus: this.mapStatus(verificationResult.status)
    };
  }
  
  private async initiateJumioVerification(userId: string): Promise<any> {
    // Jumio integration
    const response = await fetch(`https://api.jumio.com/api/v4/accounts/${userId}/workflow`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerInternalReference: userId,
        workflowDefinition: {
          key: 1,
          credentials: [
            {
              category: 'ID',
              type: {
                values: ['PASSPORT', 'DRIVING_LICENSE', 'ID_CARD']
              }
            }
          ]
        }
      })
    });
    
    return response.json();
  }
  
  private calculateRiskScore(data: any): number {
    let score = 0;
    
    // Age factor
    const age = this.calculateAge(data.dateOfBirth);
    if (age < 25) score += 10;
    if (age > 65) score += 5;
    
    // Document quality
    if (data.documentQuality === 'low') score += 20;
    if (data.documentQuality === 'medium') score += 10;
    
    // Address verification
    if (!data.addressVerified) score += 15;
    
    // Watchlist check
    if (data.watchlistMatch) score += 50;
    
    return Math.min(score, 100);
  }
}

const KYCInterface: React.FC = () => {
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'not_started' | 'pending' | 'completed' | 'failed'>('not_started');
  
  const startVerification = async () => {
    setVerificationStatus('pending');
    
    // Initialize KYC service
    const kycService = new KYCService({
      name: 'jumio',
      apiKey: process.env.JUMIO_API_KEY,
      apiSecret: process.env.JUMIO_API_SECRET,
      webhookUrl: process.env.JUMIO_WEBHOOK_URL
    });
    
    try {
      const verification = await kycService.initiateVerification('user-123');
      
      // Redirect to verification flow
      window.open(verification.redirectUrl, '_blank');
      
      // Poll for completion
      this.pollVerificationStatus(kycService, verification.verificationId);
    } catch (error) {
      setVerificationStatus('failed');
    }
  };
}
```

Key implementation points:
- Multi-provider support (Jumio, Onfido, Veriff)
- Document processing and validation
- Risk scoring algorithms
- Real-time status updates
- Error handling and retry logic

### Step 2: Build AMLMonitor System

Create real-time AML monitoring and screening:

```typescript
interface AMLAlert {
  id: string;
  timestamp: number;
  transactionId: string;
  alertType: 'watchlist_match' | 'suspicious_amount' | 'velocity_check' | 'sanctions_check';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata: any;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
}

interface WatchlistEntry {
  name: string;
  aliases: string[];
  type: 'PEP' | 'sanctions' | 'adverse_media';
  country: string;
  lastUpdated: string;
  matchScore: number;
}

class AMLMonitor {
  private watchlists: Map<string, WatchlistEntry[]> = new Map();
  private suspiciousPatterns = new Map<string, number>();
  
  constructor() {
    this.initializeWatchlists();
    this.loadSuspiciousPatterns();
  }
  
  async screenTransaction(transaction: {
    from: string;
    to: string;
    amount: string;
    currency: string;
    timestamp: number;
    metadata?: any;
  }): Promise<{
    passed: boolean;
    alerts: AMLAlert[];
    riskScore: number;
  }> {
    const alerts: AMLAlert[] = [];
    let riskScore = 0;
    
    // Check sender and recipient against watchlists
    const senderCheck = await this.checkWatchlist(transaction.from);
    const recipientCheck = await this.checkWatchlist(transaction.to);
    
    if (senderCheck.matches.length > 0) {
      alerts.push({
        id: generateId(),
        timestamp: Date.now(),
        transactionId: transaction.metadata?.id || 'unknown',
        alertType: 'watchlist_match',
        severity: 'high',
        description: `Sender matches watchlist entry: ${senderCheck.matches[0].name}`,
        metadata: senderCheck.matches[0],
        status: 'open'
      });
      riskScore += 50;
    }
    
    // Check transaction amount patterns
    const amountCheck = this.checkSuspiciousAmount(
      parseFloat(transaction.amount),
      transaction.currency
    );
    
    if (amountCheck.suspicious) {
      alerts.push({
        id: generateId(),
        timestamp: Date.now(),
        transactionId: transaction.metadata?.id || 'unknown',
        alertType: 'suspicious_amount',
        severity: amountCheck.severity,
        description: amountCheck.reason,
        metadata: { amount: transaction.amount, currency: transaction.currency },
        status: 'open'
      });
      riskScore += amountCheck.riskPoints;
    }
    
    // Check velocity (transaction frequency)
    const velocityCheck = await this.checkVelocity(transaction.from);
    
    if (velocityCheck.exceeded) {
      alerts.push({
        id: generateId(),
        timestamp: Date.now(),
        transactionId: transaction.metadata?.id || 'unknown',
        alertType: 'velocity_check',
        severity: 'medium',
        description: `Transaction velocity exceeded: ${velocityCheck.count} transactions in ${velocityCheck.period}`,
        metadata: velocityCheck,
        status: 'open'
      });
      riskScore += 20;
    }
    
    return {
      passed: riskScore < 70, // Threshold for automatic approval
      alerts,
      riskScore: Math.min(riskScore, 100)
    };
  }
  
  private async checkWatchlist(address: string): Promise<{
    matches: WatchlistEntry[];
    fuzzyMatches: WatchlistEntry[];
  }> {
    // In real implementation, this would check against OFAC, UN, EU sanctions lists
    const matches: WatchlistEntry[] = [];
    const fuzzyMatches: WatchlistEntry[] = [];
    
    // Check all watchlist categories
    for (const [category, entries] of this.watchlists) {
      for (const entry of entries) {
        // Exact match
        if (entry.name.toLowerCase() === address.toLowerCase()) {
          matches.push(entry);
        }
        
        // Fuzzy matching for similar names
        const similarity = this.calculateSimilarity(entry.name, address);
        if (similarity > 0.8) {
          fuzzyMatches.push({ ...entry, matchScore: similarity });
        }
      }
    }
    
    return { matches, fuzzyMatches };
  }
  
  private checkSuspiciousAmount(amount: number, currency: string): {
    suspicious: boolean;
    severity: 'low' | 'medium' | 'high';
    reason: string;
    riskPoints: number;
  } {
    // Convert to USD for consistent thresholds
    const usdAmount = this.convertToUSD(amount, currency);
    
    // Check against suspicious amount patterns
    if (usdAmount >= 10000) {
      return {
        suspicious: true,
        severity: 'high',
        reason: 'Large transaction above CTR threshold',
        riskPoints: 30
      };
    }
    
    if (this.isRoundNumber(usdAmount)) {
      return {
        suspicious: true,
        severity: 'low',
        reason: 'Round number transaction (possible structuring)',
        riskPoints: 10
      };
    }
    
    return {
      suspicious: false,
      severity: 'low',
      reason: '',
      riskPoints: 0
    };
  }
  
  private async checkVelocity(address: string): Promise<{
    exceeded: boolean;
    count: number;
    period: string;
    threshold: number;
  }> {
    // Check transaction frequency for the address
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    const recentTransactions = await this.getRecentTransactions(address, last24Hours);
    
    const threshold = 10; // Max 10 transactions per day
    
    return {
      exceeded: recentTransactions.length > threshold,
      count: recentTransactions.length,
      period: '24 hours',
      threshold
    };
  }
}
```

### Step 3: Create TaxReporter System

Implement comprehensive tax reporting with multi-jurisdiction support:

```typescript
interface TaxJurisdiction {
  country: string;
  taxYear: number;
  rules: {
    capitalGainsTax: number;
    shortTermRate: number;
    longTermRate: number;
    deMinimisThreshold: number;
    reportingCurrency: string;
  };
}

interface TaxableEvent {
  id: string;
  type: 'trade' | 'income' | 'gift' | 'mining' | 'staking';
  timestamp: number;
  asset: string;
  amount: string;
  fiatValue: string;
  costBasis?: string;
  gain?: string;
  taxable: boolean;
  jurisdiction: string;
}

class TaxCalculator {
  private jurisdictions = new Map<string, TaxJurisdiction>();
  private exchangeRates = new Map<string, number>();
  
  constructor() {
    this.initializeJurisdictions();
  }
  
  private initializeJurisdictions() {
    // US tax rules
    this.jurisdictions.set('US', {
      country: 'US',
      taxYear: 2024,
      rules: {
        capitalGainsTax: 0.20,
        shortTermRate: 0.37, // Ordinary income rate
        longTermRate: 0.20,
        deMinimisThreshold: 200, // $200 de minimis threshold
        reportingCurrency: 'USD'
      }
    });
    
    // UK tax rules
    this.jurisdictions.set('UK', {
      country: 'UK',
      taxYear: 2024,
      rules: {
        capitalGainsTax: 0.20,
        shortTermRate: 0.20,
        longTermRate: 0.10, // Basic rate CGT
        deMinimisThreshold: 12300, // £12,300 annual exemption
        reportingCurrency: 'GBP'
      }
    });
  }
  
  async calculateTaxes(
    transactions: any[],
    jurisdiction: string,
    taxYear: number
  ): Promise<{
    totalGains: number;
    totalLosses: number;
    netGains: number;
    taxOwed: number;
    events: TaxableEvent[];
    summary: TaxSummary;
  }> {
    const jurisdictionRules = this.jurisdictions.get(jurisdiction);
    if (!jurisdictionRules) {
      throw new Error(`Unsupported jurisdiction: ${jurisdiction}`);
    }
    
    const events: TaxableEvent[] = [];
    let totalGains = 0;
    let totalLosses = 0;
    
    // Process each transaction
    for (const tx of transactions) {
      const event = await this.processTransaction(tx, jurisdictionRules);
      if (event) {
        events.push(event);
        
        if (event.gain) {
          const gain = parseFloat(event.gain);
          if (gain > 0) {
            totalGains += gain;
          } else {
            totalLosses += Math.abs(gain);
          }
        }
      }
    }
    
    const netGains = Math.max(0, totalGains - totalLosses);
    const taxOwed = this.calculateTaxLiability(netGains, jurisdictionRules);
    
    return {
      totalGains,
      totalLosses,
      netGains,
      taxOwed,
      events,
      summary: this.generateTaxSummary(events, jurisdictionRules)
    };
  }
  
  private async processTransaction(
    tx: any,
    jurisdiction: TaxJurisdiction
  ): Promise<TaxableEvent | null> {
    // Determine if transaction is taxable
    const isTaxable = this.isTaxableEvent(tx);
    if (!isTaxable) return null;
    
    // Get historical price for the transaction
    const fiatValue = await this.getHistoricalPrice(
      tx.asset,
      tx.timestamp,
      jurisdiction.rules.reportingCurrency
    );
    
    // Calculate cost basis using FIFO method
    const costBasis = await this.calculateCostBasis(
      tx.asset,
      tx.amount,
      tx.timestamp
    );
    
    // Calculate gain/loss
    const gain = fiatValue - costBasis;
    
    return {
      id: generateId(),
      type: this.classifyTransaction(tx),
      timestamp: tx.timestamp,
      asset: tx.asset,
      amount: tx.amount,
      fiatValue: fiatValue.toString(),
      costBasis: costBasis.toString(),
      gain: gain.toString(),
      taxable: Math.abs(gain) >= jurisdiction.rules.deMinimisThreshold,
      jurisdiction: jurisdiction.country
    };
  }
  
  private calculateTaxLiability(
    netGains: number,
    jurisdiction: TaxJurisdiction
  ): number {
    // Apply de minimis threshold
    if (netGains <= jurisdiction.rules.deMinimisThreshold) {
      return 0;
    }
    
    // Calculate tax based on holding period
    // For simplicity, using long-term rate
    return netGains * jurisdiction.rules.longTermRate;
  }
  
  generateTaxReport(
    calculations: any,
    jurisdiction: string,
    format: 'pdf' | 'csv' | 'xml'
  ): Promise<Buffer> {
    // Generate tax report in requested format
    switch (format) {
      case 'pdf':
        return this.generatePDFReport(calculations, jurisdiction);
      case 'csv':
        return this.generateCSVReport(calculations);
      case 'xml':
        return this.generateXMLReport(calculations);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}
```

### Step 4: Implement ComplianceChecker

Create comprehensive compliance monitoring and policy enforcement:

```typescript
interface CompliancePolicy {
  id: string;
  name: string;
  description: string;
  rules: ComplianceRule[];
  jurisdiction: string;
  effectiveDate: string;
  enabled: boolean;
}

interface ComplianceRule {
  id: string;
  type: 'transaction_limit' | 'geographic_restriction' | 'asset_restriction' | 'time_restriction';
  condition: any;
  action: 'block' | 'flag' | 'approve_with_review';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ComplianceChecker {
  private policies: Map<string, CompliancePolicy> = new Map();
  private violations: ComplianceViolation[] = [];
  
  constructor() {
    this.initializePolicies();
  }
  
  private initializePolicies() {
    // AML Policy
    const amlPolicy: CompliancePolicy = {
      id: 'aml-001',
      name: 'Anti-Money Laundering Policy',
      description: 'Prevents money laundering and terrorist financing',
      rules: [
        {
          id: 'aml-rule-001',
          type: 'transaction_limit',
          condition: { dailyLimit: 10000, currency: 'USD' },
          action: 'flag',
          severity: 'medium'
        },
        {
          id: 'aml-rule-002',
          type: 'geographic_restriction',
          condition: { blockedCountries: ['AF', 'IR', 'KP'] },
          action: 'block',
          severity: 'critical'
        }
      ],
      jurisdiction: 'global',
      effectiveDate: '2024-01-01',
      enabled: true
    };
    
    this.policies.set(amlPolicy.id, amlPolicy);
  }
  
  async checkCompliance(context: {
    user: any;
    transaction?: any;
    action: string;
    metadata?: any;
  }): Promise<{
    compliant: boolean;
    violations: ComplianceViolation[];
    requiredActions: string[];
    canProceed: boolean;
  }> {
    const violations: ComplianceViolation[] = [];
    const requiredActions: string[] = [];
    
    // Check all active policies
    for (const [policyId, policy] of this.policies) {
      if (!policy.enabled) continue;
      
      const policyResult = await this.checkPolicy(policy, context);
      violations.push(...policyResult.violations);
    }
    
    // Determine if user can proceed
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    const canProceed = criticalViolations.length === 0;
    
    // Generate required actions
    if (!canProceed) {
      requiredActions.push('Complete additional verification');
      requiredActions.push('Contact compliance team');
    }
    
    return {
      compliant: violations.length === 0,
      violations,
      requiredActions,
      canProceed
    };
  }
  
  private async checkPolicy(
    policy: CompliancePolicy,
    context: any
  ): Promise<{ violations: ComplianceViolation[] }> {
    const violations: ComplianceViolation[] = [];
    
    for (const rule of policy.rules) {
      const violation = await this.checkRule(rule, context);
      if (violation) {
        violations.push(violation);
      }
    }
    
    return { violations };
  }
  
  private async checkRule(
    rule: ComplianceRule,
    context: any
  ): Promise<ComplianceViolation | null> {
    switch (rule.type) {
      case 'transaction_limit':
        return this.checkTransactionLimit(rule, context);
      case 'geographic_restriction':
        return this.checkGeographicRestriction(rule, context);
      case 'asset_restriction':
        return this.checkAssetRestriction(rule, context);
      default:
        return null;
    }
  }
}
```

## 💡 Hints

### GDPR Compliance Implementation

```typescript
class GDPRComplianceManager {
  async handleDataRequest(
    userId: string,
    requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restrict'
  ): Promise<{ success: boolean; data?: any; reference: string }> {
    const reference = generateRequestReference();
    
    switch (requestType) {
      case 'access':
        // Right to access personal data
        const userData = await this.exportUserData(userId);
        return { success: true, data: userData, reference };
        
      case 'erasure':
        // Right to be forgotten
        await this.anonymizeUserData(userId);
        return { success: true, reference };
        
      case 'portability':
        // Right to data portability
        const portableData = await this.exportPortableData(userId);
        return { success: true, data: portableData, reference };
        
      default:
        throw new Error(`Unsupported request type: ${requestType}`);
    }
  }
  
  async recordConsent(userId: string, consentType: string, granted: boolean) {
    await this.auditLogger.log('CONSENT_RECORDED', {
      userId,
      consentType,
      granted,
      timestamp: Date.now(),
      ipAddress: this.getCurrentIP(),
      userAgent: navigator.userAgent
    });
  }
}
```

## 🔍 Debugging Tips

1. **API Integration**: Test with sandbox environments first
2. **Compliance Rules**: Validate against current regulations
3. **Data Privacy**: Ensure proper encryption and access controls
4. **Tax Calculations**: Verify against professional tax software
5. **Audit Trails**: Maintain comprehensive logging

## ✅ Checklist

Before submitting your solution, ensure:

- [ ] KYC integration supports multiple providers
- [ ] AML monitoring screens all transactions
- [ ] Tax calculations handle multiple jurisdictions
- [ ] Compliance policies are configurable
- [ ] GDPR rights are fully implemented
- [ ] Audit trails are comprehensive
- [ ] Data retention policies are enforced
- [ ] Regulatory reports generate correctly
- [ ] Error handling covers all scenarios
- [ ] User interfaces are compliant-friendly

## 🚀 Extensions

Once you've completed the basic requirements, try:

1. **RegTech Integration**: Connect with regulatory technology providers
2. **Machine Learning**: Implement ML-based risk scoring
3. **Real-time Sanctions**: Live sanctions list updates
4. **Advanced Analytics**: Compliance dashboard with KPIs
5. **Cross-border Rules**: Multi-jurisdiction rule coordination

## 📚 Resources

- [FinCEN Guidance](https://www.fincen.gov/resources/guidance)
- [FATF Recommendations](https://www.fatf-gafi.org/recommendations.html)
- [GDPR Official Text](https://gdpr-info.eu/)
- [Jumio API Documentation](https://github.com/Jumio/implementation-guides)
- [OFAC Sanctions Lists](https://www.treasury.gov/resource-center/sanctions/)
- [Tax API Services](https://www.coingecko.com/en/api/documentation)