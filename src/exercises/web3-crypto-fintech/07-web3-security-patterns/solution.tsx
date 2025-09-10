import React, { useState, useCallback, useContext, createContext, useEffect } from 'react';
import { Card, Text, Button, Group, Stack, Alert, Badge, Switch, NumberInput, Select, Loader, Progress, Modal, TextInput, PasswordInput, Timeline } from '@mantine/core';
import { IconShieldCheck, IconAlertTriangle, IconLock, IconFingerprint, IconDatabase, IconKey, IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
import { ethers, keccak256, toUtf8Bytes } from 'ethers';

// Types and Interfaces
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

interface TokenTransfer {
  from: string;
  to: string;
  token: string;
  amount: string;
  symbol: string;
}

interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  suggestions: string[];
}

interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

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

interface PhishingCheckResult {
  safe: boolean;
  risk: 'safe' | 'suspicious' | 'dangerous';
  details?: string;
}

// Security Context
interface SecurityContextType {
  config: SecurityConfig;
  setConfig: (config: SecurityConfig) => void;
  alerts: SecurityAlert[];
  checkTransaction: (tx: any) => Promise<ValidationResult>;
  addSecurityAlert: (alert: Omit<SecurityAlert, 'id' | 'timestamp'>) => void;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

// Transaction Validator Class
class TransactionValidator {
  private simulationProviders = [
    'https://api.tenderly.co/api/v1/simulate',
    'https://api.blocknative.com/simulate'
  ];
  
  async simulateTransaction(tx: any): Promise<TransactionSimulation> {
    // Simulate transaction execution
    const simulation = await this.runSimulation(tx);
    
    // Analyze state changes
    const analysis = this.analyzeStateChanges(simulation);
    
    // Calculate risk score
    const riskScore = this.calculateRiskScore(analysis);
    
    return {
      success: simulation.success,
      gasUsed: simulation.gasUsed || '0',
      stateChanges: simulation.stateChanges || [],
      tokenTransfers: this.extractTokenTransfers(simulation),
      warnings: this.generateWarnings(analysis),
      riskScore
    };
  }
  
  private async runSimulation(tx: any): Promise<any> {
    // Mock simulation for demonstration
    return {
      success: Math.random() > 0.1,
      gasUsed: '50000',
      stateChanges: [
        {
          address: tx.to,
          stateDiff: {
            before: { balance: '1000' },
            after: { balance: '900' }
          }
        }
      ]
    };
  }
  
  private analyzeStateChanges(simulation: any): any {
    return {
      hasUnverifiedContract: Math.random() > 0.7,
      hasHighValueTransfer: Math.random() > 0.5,
      hasStorageWrites: true,
      hasMultipleRecipients: false
    };
  }
  
  private calculateRiskScore(analysis: any): number {
    let score = 0;
    
    if (analysis.hasUnverifiedContract) score += 30;
    if (analysis.hasHighValueTransfer) score += 20;
    if (analysis.hasStorageWrites) score += 10;
    if (analysis.hasMultipleRecipients) score += 15;
    
    return Math.min(score, 100);
  }
  
  private extractTokenTransfers(simulation: any): TokenTransfer[] {
    // Extract token transfers from simulation
    return [
      {
        from: '0x123...',
        to: '0x456...',
        token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        amount: '1000000',
        symbol: 'USDC'
      }
    ];
  }
  
  private generateWarnings(analysis: any): string[] {
    const warnings: string[] = [];
    
    if (analysis.hasUnverifiedContract) {
      warnings.push('Interacting with unverified contract');
    }
    if (analysis.hasHighValueTransfer) {
      warnings.push('High value transfer detected');
    }
    
    return warnings;
  }
  
  async validateTransaction(tx: any): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    
    // Check recipient address
    if (await this.isPhishingAddress(tx.to)) {
      issues.push({
        severity: 'critical',
        message: 'Recipient address flagged as phishing'
      });
    }
    
    // Validate gas settings
    if (tx.gasPrice && BigInt(tx.gasPrice) > BigInt('100000000000')) {
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
  
  private async isPhishingAddress(address: string): Promise<boolean> {
    // Check against phishing database
    const blacklist = ['0xbad...', '0xscam...'];
    return blacklist.includes(address.toLowerCase());
  }
  
  private async hasReentrancyRisk(tx: any): Promise<boolean> {
    // Check for reentrancy patterns
    return tx.data && tx.data.includes('call');
  }
  
  private generateSuggestions(issues: ValidationIssue[]): string[] {
    const suggestions: string[] = [];
    
    if (issues.some(i => i.message.includes('gas'))) {
      suggestions.push('Consider waiting for lower gas prices');
    }
    if (issues.some(i => i.severity === 'critical')) {
      suggestions.push('Do not proceed with this transaction');
    }
    
    return suggestions;
  }
}

// Phishing Detector Class
class PhishingDetector {
  private blacklistedDomains = new Set(['scam-site.com', 'phishing-dapp.io']);
  private blacklistedAddresses = new Set(['0xbad...', '0xscam...']);
  private verifiedContracts = new Map([
    ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', { name: 'USDC', verified: true }],
    ['0xdAC17F958D2ee523a2206206994597C13D831ec7', { name: 'USDT', verified: true }]
  ]);
  
  async checkAddress(address: string): Promise<PhishingCheckResult> {
    // Check against blacklist
    if (this.blacklistedAddresses.has(address.toLowerCase())) {
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
    const contractInfo = this.verifiedContracts.get(address);
    if (contractInfo && !contractInfo.verified) {
      return {
        safe: false,
        risk: 'suspicious',
        details: 'Unverified contract'
      };
    }
    
    return { safe: true, risk: 'safe' };
  }
  
  async checkDomain(domain: string): Promise<{ safe: boolean; details?: string }> {
    // Check against known phishing domains
    if (this.blacklistedDomains.has(domain)) {
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
    
    return { safe: true };
  }
  
  private hasHomographAttack(address: string): boolean {
    // Check for visually similar characters
    const suspiciousChars = /[а-яА-Я]/; // Cyrillic characters
    return suspiciousChars.test(address);
  }
  
  private findLegitimateVersion(domain: string): string | null {
    const legitimateDomains = ['uniswap.org', 'opensea.io', 'etherscan.io'];
    
    for (const legitimate of legitimateDomains) {
      if (this.calculateSimilarity(domain, legitimate) > 0.8) {
        return legitimate;
      }
    }
    
    return null;
  }
  
  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

// Audit Logger Class
class AuditLogger {
  private logs: AuditLog[] = [];
  
  async log(action: string, details: any, metadata?: any): Promise<string> {
    const previousLog = this.logs[this.logs.length - 1];
    const previousHash = previousLog?.hash || '0x0';
    
    const log: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      userId: 'user-123',
      action,
      details,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        sessionId: 'session-456'
      },
      hash: '',
      previousHash
    };
    
    // Calculate hash for immutability
    log.hash = this.calculateHash(log);
    
    // Store locally
    this.logs.push(log);
    
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
      const { hash, ...logWithoutHash } = current;
      const recalculated = this.calculateHash(logWithoutHash);
      
      if (recalculated !== current.hash) {
        return false;
      }
    }
    
    return true;
  }
  
  getLogs(): AuditLog[] {
    return [...this.logs];
  }
}

// Component implementations
const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SecurityConfig>({
    requireSimulation: true,
    requireApproval: true,
    maxGasPrice: BigInt('100000000000'),
    maxSlippage: 5,
    blacklistedAddresses: [],
    whitelistedContracts: [],
    securityLevel: 'high'
  });
  
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const validator = new TransactionValidator();
  
  const checkTransaction = async (tx: any): Promise<ValidationResult> => {
    return validator.validateTransaction(tx);
  };
  
  const addSecurityAlert = (alert: Omit<SecurityAlert, 'id' | 'timestamp'>) => {
    setAlerts(prev => [...prev, {
      ...alert,
      id: Math.random().toString(36).substr(2, 9),
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

const TransactionValidatorComponent: React.FC = () => {
  const [simulation, setSimulation] = useState<TransactionSimulation | null>(null);
  const [loading, setLoading] = useState(false);
  const validator = new TransactionValidator();
  
  const simulateTransaction = async () => {
    setLoading(true);
    const mockTx = {
      to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      value: '1000000000000000000',
      data: '0x',
      gasPrice: '50000000000'
    };
    
    const result = await validator.simulateTransaction(mockTx);
    setSimulation(result);
    setLoading(false);
  };
  
  return (
    <Card shadow="sm" p="lg">
      <Group position="apart" mb="md">
        <Text size="lg" weight={500}>Transaction Validator</Text>
        <Badge color={simulation?.success ? 'green' : 'red'} variant="light">
          {simulation ? (simulation.success ? 'Valid' : 'Invalid') : 'Not Validated'}
        </Badge>
      </Group>
      
      <Stack spacing="md">
        <Button 
          onClick={simulateTransaction} 
          loading={loading}
          leftIcon={<IconShieldCheck size={16} />}
        >
          Simulate Transaction
        </Button>
        
        {simulation && (
          <>
            <Alert 
              icon={<IconAlertTriangle size={16} />}
              title="Risk Score"
              color={simulation.riskScore > 50 ? 'red' : simulation.riskScore > 20 ? 'yellow' : 'green'}
            >
              <Progress value={simulation.riskScore} color={simulation.riskScore > 50 ? 'red' : 'yellow'} />
              <Text size="sm" mt="xs">Risk Level: {simulation.riskScore}%</Text>
            </Alert>
            
            {simulation.warnings.length > 0 && (
              <Alert icon={<IconAlertCircle size={16} />} title="Warnings" color="yellow">
                <Stack spacing="xs">
                  {simulation.warnings.map((warning, index) => (
                    <Text key={index} size="sm">• {warning}</Text>
                  ))}
                </Stack>
              </Alert>
            )}
            
            <Card withBorder>
              <Text size="sm" weight={500} mb="xs">Gas Estimation</Text>
              <Text size="xs" color="dimmed">{simulation.gasUsed} gas units</Text>
            </Card>
            
            {simulation.tokenTransfers.length > 0 && (
              <Card withBorder>
                <Text size="sm" weight={500} mb="xs">Token Transfers</Text>
                {simulation.tokenTransfers.map((transfer, index) => (
                  <Group key={index} spacing="xs">
                    <Badge size="sm">{transfer.symbol}</Badge>
                    <Text size="xs">{transfer.amount}</Text>
                    <Text size="xs" color="dimmed">
                      {transfer.from.slice(0, 6)}...{transfer.from.slice(-4)} → 
                      {transfer.to.slice(0, 6)}...{transfer.to.slice(-4)}
                    </Text>
                  </Group>
                ))}
              </Card>
            )}
          </>
        )}
      </Stack>
    </Card>
  );
};

const PhishingDetectorComponent: React.FC = () => {
  const [address, setAddress] = useState('');
  const [domain, setDomain] = useState('');
  const [addressResult, setAddressResult] = useState<PhishingCheckResult | null>(null);
  const [domainResult, setDomainResult] = useState<{ safe: boolean; details?: string } | null>(null);
  const detector = new PhishingDetector();
  
  const checkAddress = async () => {
    if (address) {
      const result = await detector.checkAddress(address);
      setAddressResult(result);
    }
  };
  
  const checkDomain = async () => {
    if (domain) {
      const result = await detector.checkDomain(domain);
      setDomainResult(result);
    }
  };
  
  return (
    <Card shadow="sm" p="lg">
      <Text size="lg" weight={500} mb="md">Phishing Detector</Text>
      
      <Stack spacing="md">
        <div>
          <TextInput
            label="Check Address"
            placeholder="0x..."
            value={address}
            onChange={(e) => setAddress(e.currentTarget.value)}
            rightSection={
              <Button size="xs" onClick={checkAddress}>Check</Button>
            }
          />
          {addressResult && (
            <Alert
              mt="xs"
              icon={addressResult.safe ? <IconCheck size={16} /> : <IconX size={16} />}
              color={addressResult.safe ? 'green' : 'red'}
            >
              <Text size="sm">
                {addressResult.safe ? 'Address is safe' : addressResult.details}
              </Text>
              <Badge size="sm" color={
                addressResult.risk === 'safe' ? 'green' : 
                addressResult.risk === 'suspicious' ? 'yellow' : 'red'
              }>
                {addressResult.risk.toUpperCase()}
              </Badge>
            </Alert>
          )}
        </div>
        
        <div>
          <TextInput
            label="Check Domain"
            placeholder="example.com"
            value={domain}
            onChange={(e) => setDomain(e.currentTarget.value)}
            rightSection={
              <Button size="xs" onClick={checkDomain}>Check</Button>
            }
          />
          {domainResult && (
            <Alert
              mt="xs"
              icon={domainResult.safe ? <IconCheck size={16} /> : <IconX size={16} />}
              color={domainResult.safe ? 'green' : 'red'}
            >
              <Text size="sm">
                {domainResult.safe ? 'Domain is safe' : domainResult.details}
              </Text>
            </Alert>
          )}
        </div>
      </Stack>
    </Card>
  );
};

const AuditLoggerComponent: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const logger = new AuditLogger();
  
  const logAction = async (action: string) => {
    await logger.log(action, { test: 'data' });
    setLogs(logger.getLogs());
  };
  
  const verifyIntegrity = async () => {
    const valid = await logger.verify();
    setIsValid(valid);
  };
  
  return (
    <Card shadow="sm" p="lg">
      <Group position="apart" mb="md">
        <Text size="lg" weight={500}>Audit Logger</Text>
        {isValid !== null && (
          <Badge color={isValid ? 'green' : 'red'}>
            {isValid ? 'Verified' : 'Compromised'}
          </Badge>
        )}
      </Group>
      
      <Stack spacing="md">
        <Group>
          <Button 
            onClick={() => logAction('TRANSACTION_SENT')}
            leftIcon={<IconDatabase size={16} />}
            size="sm"
          >
            Log Transaction
          </Button>
          <Button 
            onClick={() => logAction('WALLET_CONNECTED')}
            leftIcon={<IconKey size={16} />}
            size="sm"
          >
            Log Connection
          </Button>
          <Button 
            onClick={verifyIntegrity}
            leftIcon={<IconFingerprint size={16} />}
            variant="outline"
            size="sm"
          >
            Verify Integrity
          </Button>
        </Group>
        
        {logs.length > 0 && (
          <Timeline active={logs.length - 1} bulletSize={24} lineWidth={2}>
            {logs.map((log, index) => (
              <Timeline.Item
                key={log.id}
                bullet={<IconLock size={12} />}
                title={log.action}
              >
                <Text size="xs" color="dimmed" mt={4}>
                  {new Date(log.timestamp).toLocaleString()}
                </Text>
                <Text size="xs" color="dimmed">
                  Hash: {log.hash.slice(0, 10)}...
                </Text>
                {index > 0 && (
                  <Text size="xs" color="dimmed">
                    Previous: {log.previousHash.slice(0, 10)}...
                  </Text>
                )}
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Stack>
    </Card>
  );
};

const SecuritySettingsPanel: React.FC = () => {
  const context = useContext(SecurityContext);
  if (!context) return null;
  
  const { config, setConfig } = context;
  
  return (
    <Card shadow="sm" p="lg">
      <Text size="lg" weight={500} mb="md">Security Settings</Text>
      
      <Stack spacing="md">
        <Select
          label="Security Level"
          value={config.securityLevel}
          onChange={(value) => setConfig({ ...config, securityLevel: value as any })}
          data={[
            { label: 'Low - Basic Protection', value: 'low' },
            { label: 'Medium - Standard Protection', value: 'medium' },
            { label: 'High - Enhanced Protection', value: 'high' },
            { label: 'Paranoid - Maximum Protection', value: 'paranoid' }
          ]}
        />
        
        <Switch
          label="Require Transaction Simulation"
          checked={config.requireSimulation}
          onChange={(e) => setConfig({ ...config, requireSimulation: e.currentTarget.checked })}
        />
        
        <Switch
          label="Require Manual Approval"
          checked={config.requireApproval}
          onChange={(e) => setConfig({ ...config, requireApproval: e.currentTarget.checked })}
        />
        
        <NumberInput
          label="Max Slippage %"
          value={config.maxSlippage}
          onChange={(value) => setConfig({ ...config, maxSlippage: value || 0 })}
          min={0}
          max={50}
          precision={1}
        />
      </Stack>
    </Card>
  );
};

// Main Exercise Component
const Web3SecurityPatternsExercise: React.FC = () => {
  return (
    <SecurityProvider>
      <Stack spacing="md">
        <Alert icon={<IconShieldCheck size={16} />} title="Security Status" color="blue">
          All security systems operational. Protection level: HIGH
        </Alert>
        
        <Group align="flex-start" spacing="md">
          <Stack spacing="md" style={{ flex: 1 }}>
            <TransactionValidatorComponent />
            <PhishingDetectorComponent />
          </Stack>
          
          <Stack spacing="md" style={{ flex: 1 }}>
            <AuditLoggerComponent />
            <SecuritySettingsPanel />
          </Stack>
        </Group>
      </Stack>
    </SecurityProvider>
  );
};

export default Web3SecurityPatternsExercise;