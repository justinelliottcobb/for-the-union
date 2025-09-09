import React, { useState, useCallback, useEffect } from 'react';
import { Card, Text, Button, Group, Stack, Alert, Badge, Switch, NumberInput, Select, Loader, Progress, Modal, TextInput, Textarea, Table, Timeline, Tabs, ActionIcon } from '@mantine/core';
import { IconShield, IconAlertTriangle, IconFileText, IconCalendar, IconGavel, IconDatabase, IconDownload, IconEye, IconUserCheck, IconFlag, IconCurrency } from '@tabler/icons-react';

// Types and Interfaces
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
  type: 'transaction_limit' | 'geographic_restriction' | 'asset_restriction';
  condition: any;
  action: 'block' | 'flag' | 'approve_with_review';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ComplianceViolation {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: number;
  userId: string;
  resolved: boolean;
}

interface GDPRRequest {
  id: string;
  userId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restrict';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  submittedAt: number;
  completedAt?: number;
  reference: string;
}

// KYC Service Class
class KYCService {
  async initiateVerification(userId: string): Promise<{
    verificationId: string;
    redirectUrl: string;
  }> {
    // Mock Jumio/Onfido integration
    const verificationId = Math.random().toString(36).substr(2, 9);
    
    return {
      verificationId,
      redirectUrl: `https://verification-provider.com/verify/${verificationId}`
    };
  }
  
  async checkVerificationStatus(verificationId: string): Promise<{
    status: 'pending' | 'completed' | 'failed';
    data?: KYCData;
    errors?: string[];
  }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response based on random outcome
    const success = Math.random() > 0.2;
    
    if (success) {
      return {
        status: 'completed',
        data: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          nationality: 'US',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US'
          },
          documents: [
            {
              type: 'passport',
              number: 'US123456789',
              expiryDate: '2025-12-31',
              issuingCountry: 'US'
            }
          ],
          riskScore: Math.floor(Math.random() * 30), // Low risk
          verificationStatus: 'approved'
        }
      };
    } else {
      return {
        status: 'failed',
        errors: ['Document image quality too low', 'Address verification failed']
      };
    }
  }
}

// AML Monitor Class
class AMLMonitor {
  async screenTransaction(transaction: {
    from: string;
    to: string;
    amount: string;
    currency: string;
    timestamp: number;
  }): Promise<{
    passed: boolean;
    alerts: AMLAlert[];
    riskScore: number;
  }> {
    const alerts: AMLAlert[] = [];
    let riskScore = 0;
    
    // Check suspicious amounts
    const amount = parseFloat(transaction.amount);
    if (amount >= 10000) {
      alerts.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        transactionId: 'tx-' + Math.random().toString(36).substr(2, 6),
        alertType: 'suspicious_amount',
        severity: 'high',
        description: `Large transaction: ${amount} ${transaction.currency}`,
        metadata: { amount, currency: transaction.currency },
        status: 'open'
      });
      riskScore += 40;
    }
    
    // Simulate watchlist check
    if (Math.random() < 0.1) {
      alerts.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        transactionId: 'tx-' + Math.random().toString(36).substr(2, 6),
        alertType: 'watchlist_match',
        severity: 'critical',
        description: 'Address found on sanctions watchlist',
        metadata: { address: transaction.to },
        status: 'open'
      });
      riskScore += 70;
    }
    
    // Velocity check simulation
    if (Math.random() < 0.15) {
      alerts.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        transactionId: 'tx-' + Math.random().toString(36).substr(2, 6),
        alertType: 'velocity_check',
        severity: 'medium',
        description: 'High transaction velocity detected',
        metadata: { count: 15, period: '24h' },
        status: 'open'
      });
      riskScore += 25;
    }
    
    return {
      passed: riskScore < 50,
      alerts,
      riskScore: Math.min(riskScore, 100)
    };
  }
}

// Tax Calculator Class
class TaxCalculator {
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
  }> {
    const events: TaxableEvent[] = [];
    let totalGains = 0;
    let totalLosses = 0;
    
    // Simulate processing transactions
    for (let i = 0; i < 10; i++) {
      const gain = (Math.random() - 0.5) * 2000; // Random gain/loss
      const event: TaxableEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type: ['trade', 'income', 'staking'][Math.floor(Math.random() * 3)] as any,
        timestamp: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
        asset: ['BTC', 'ETH', 'USDC'][Math.floor(Math.random() * 3)],
        amount: (Math.random() * 10).toFixed(6),
        fiatValue: (Math.random() * 50000).toFixed(2),
        costBasis: (Math.random() * 45000).toFixed(2),
        gain: gain.toFixed(2),
        taxable: Math.abs(gain) > 200,
        jurisdiction
      };
      
      events.push(event);
      
      if (gain > 0) {
        totalGains += gain;
      } else {
        totalLosses += Math.abs(gain);
      }
    }
    
    const netGains = Math.max(0, totalGains - totalLosses);
    const taxRate = jurisdiction === 'US' ? 0.20 : 0.15;
    const taxOwed = netGains * taxRate;
    
    return {
      totalGains,
      totalLosses,
      netGains,
      taxOwed,
      events
    };
  }
}

// Compliance Checker Class
class ComplianceChecker {
  private policies: CompliancePolicy[] = [
    {
      id: 'aml-001',
      name: 'Anti-Money Laundering Policy',
      description: 'Prevents money laundering and terrorist financing',
      rules: [
        {
          id: 'aml-rule-001',
          type: 'transaction_limit',
          condition: { dailyLimit: 10000 },
          action: 'flag',
          severity: 'medium'
        }
      ],
      jurisdiction: 'US',
      effectiveDate: '2024-01-01',
      enabled: true
    }
  ];
  
  async checkCompliance(context: {
    userId: string;
    action: string;
    amount?: number;
    country?: string;
  }): Promise<{
    compliant: boolean;
    violations: ComplianceViolation[];
    canProceed: boolean;
  }> {
    const violations: ComplianceViolation[] = [];
    
    // Simulate compliance checking
    if (context.amount && context.amount > 10000) {
      violations.push({
        id: Math.random().toString(36).substr(2, 9),
        ruleId: 'aml-rule-001',
        severity: 'medium',
        description: 'Transaction exceeds daily limit',
        timestamp: Date.now(),
        userId: context.userId,
        resolved: false
      });
    }
    
    // Check geographic restrictions
    if (context.country && ['IR', 'KP', 'AF'].includes(context.country)) {
      violations.push({
        id: Math.random().toString(36).substr(2, 9),
        ruleId: 'geo-rule-001',
        severity: 'critical',
        description: 'Transaction from restricted jurisdiction',
        timestamp: Date.now(),
        userId: context.userId,
        resolved: false
      });
    }
    
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    
    return {
      compliant: violations.length === 0,
      violations,
      canProceed: criticalViolations.length === 0
    };
  }
  
  getPolicies(): CompliancePolicy[] {
    return this.policies;
  }
}

// GDPR Compliance Manager
class GDPRComplianceManager {
  private requests: GDPRRequest[] = [];
  
  async submitRequest(userId: string, type: GDPRRequest['type']): Promise<string> {
    const request: GDPRRequest = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      type,
      status: 'pending',
      submittedAt: Date.now(),
      reference: 'GDPR-' + Math.random().toString(36).substr(2, 8).toUpperCase()
    };
    
    this.requests.push(request);
    
    // Simulate processing
    setTimeout(() => {
      request.status = 'processing';
      setTimeout(() => {
        request.status = 'completed';
        request.completedAt = Date.now();
      }, 3000);
    }, 1000);
    
    return request.reference;
  }
  
  getRequests(userId?: string): GDPRRequest[] {
    return userId ? this.requests.filter(r => r.userId === userId) : this.requests;
  }
}

// Component Implementations
const KYCInterface: React.FC = () => {
  const [verificationStatus, setVerificationStatus] = useState<'not_started' | 'pending' | 'completed' | 'failed'>('not_started');
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [loading, setLoading] = useState(false);
  const kycService = new KYCService();
  
  const startVerification = async () => {
    setLoading(true);
    setVerificationStatus('pending');
    
    try {
      const verification = await kycService.initiateVerification('user-123');
      
      // Simulate verification process
      setTimeout(async () => {
        const result = await kycService.checkVerificationStatus(verification.verificationId);
        
        if (result.status === 'completed' && result.data) {
          setKycData(result.data);
          setVerificationStatus('completed');
        } else {
          setVerificationStatus('failed');
        }
        setLoading(false);
      }, 3000);
    } catch (error) {
      setVerificationStatus('failed');
      setLoading(false);
    }
  };
  
  return (
    <Card shadow="sm" p="lg">
      <Group position="apart" mb="md">
        <Text size="lg" weight={500}>KYC Verification</Text>
        <Badge color={
          verificationStatus === 'completed' ? 'green' :
          verificationStatus === 'failed' ? 'red' :
          verificationStatus === 'pending' ? 'yellow' : 'gray'
        }>
          {verificationStatus.replace('_', ' ').toUpperCase()}
        </Badge>
      </Group>
      
      <Stack spacing="md">
        {verificationStatus === 'not_started' && (
          <div>
            <Text size="sm" color="dimmed" mb="md">
              Complete identity verification to access all features
            </Text>
            <Button 
              onClick={startVerification}
              leftIcon={<IconUserCheck size={16} />}
            >
              Start Verification
            </Button>
          </div>
        )}
        
        {verificationStatus === 'pending' && (
          <div>
            <Text size="sm" mb="md">Verification in progress...</Text>
            <Loader size="sm" />
            <Progress value={66} animate />
          </div>
        )}
        
        {verificationStatus === 'completed' && kycData && (
          <div>
            <Alert color="green" mb="md">
              <Text size="sm">Verification completed successfully!</Text>
            </Alert>
            
            <Stack spacing="xs">
              <Group>
                <Text size="sm" weight={500}>Name:</Text>
                <Text size="sm">{kycData.firstName} {kycData.lastName}</Text>
              </Group>
              <Group>
                <Text size="sm" weight={500}>Nationality:</Text>
                <Text size="sm">{kycData.nationality}</Text>
              </Group>
              <Group>
                <Text size="sm" weight={500}>Risk Score:</Text>
                <Badge color={kycData.riskScore < 30 ? 'green' : 'yellow'}>
                  {kycData.riskScore}%
                </Badge>
              </Group>
            </Stack>
          </div>
        )}
        
        {verificationStatus === 'failed' && (
          <Alert color="red">
            <Text size="sm">Verification failed. Please try again or contact support.</Text>
          </Alert>
        )}
      </Stack>
    </Card>
  );
};

const AMLMonitorComponent: React.FC = () => {
  const [alerts, setAlerts] = useState<AMLAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const amlMonitor = new AMLMonitor();
  
  const screenMockTransaction = async () => {
    setLoading(true);
    
    const mockTransaction = {
      from: '0x1234...5678',
      to: '0x8765...4321',
      amount: (Math.random() * 20000).toFixed(2),
      currency: 'USDC',
      timestamp: Date.now()
    };
    
    const result = await amlMonitor.screenTransaction(mockTransaction);
    setAlerts(result.alerts);
    setLoading(false);
  };
  
  return (
    <Card shadow="sm" p="lg">
      <Group position="apart" mb="md">
        <Text size="lg" weight={500}>AML Monitoring</Text>
        <Button size="sm" onClick={screenMockTransaction} loading={loading}>
          Screen Transaction
        </Button>
      </Group>
      
      <Stack spacing="md">
        {alerts.length === 0 ? (
          <Text size="sm" color="dimmed">No alerts at this time</Text>
        ) : (
          alerts.map(alert => (
            <Alert
              key={alert.id}
              color={
                alert.severity === 'critical' ? 'red' :
                alert.severity === 'high' ? 'orange' :
                alert.severity === 'medium' ? 'yellow' : 'blue'
              }
              icon={<IconFlag size={16} />}
            >
              <Group position="apart">
                <div>
                  <Text size="sm" weight={500}>{alert.description}</Text>
                  <Text size="xs" color="dimmed">
                    {alert.alertType.replace('_', ' ').toUpperCase()} • {new Date(alert.timestamp).toLocaleTimeString()}
                  </Text>
                </div>
                <Badge color={
                  alert.severity === 'critical' ? 'red' :
                  alert.severity === 'high' ? 'orange' :
                  alert.severity === 'medium' ? 'yellow' : 'blue'
                }>
                  {alert.severity.toUpperCase()}
                </Badge>
              </Group>
            </Alert>
          ))
        )}
      </Stack>
    </Card>
  );
};

const TaxReporterComponent: React.FC = () => {
  const [taxData, setTaxData] = useState<any>(null);
  const [jurisdiction, setJurisdiction] = useState('US');
  const [loading, setLoading] = useState(false);
  const taxCalculator = new TaxCalculator();
  
  const calculateTaxes = async () => {
    setLoading(true);
    
    const mockTransactions = []; // Empty array - calculator will generate mock data
    const result = await taxCalculator.calculateTaxes(mockTransactions, jurisdiction, 2024);
    setTaxData(result);
    setLoading(false);
  };
  
  return (
    <Card shadow="sm" p="lg">
      <Group position="apart" mb="md">
        <Text size="lg" weight={500}>Tax Reporter</Text>
        <Group>
          <Select
            value={jurisdiction}
            onChange={setJurisdiction}
            data={[
              { label: 'United States', value: 'US' },
              { label: 'United Kingdom', value: 'UK' },
              { label: 'Germany', value: 'DE' }
            ]}
            size="sm"
          />
          <Button size="sm" onClick={calculateTaxes} loading={loading} leftIcon={<IconCalendar size={16} />}>
            Calculate 2024 Taxes
          </Button>
        </Group>
      </Group>
      
      {taxData && (
        <Stack spacing="md">
          <Group grow>
            <Card withBorder p="sm">
              <Text size="xs" color="dimmed">Total Gains</Text>
              <Text size="lg" weight={500} color="green">
                ${taxData.totalGains.toFixed(2)}
              </Text>
            </Card>
            <Card withBorder p="sm">
              <Text size="xs" color="dimmed">Total Losses</Text>
              <Text size="lg" weight={500} color="red">
                ${taxData.totalLosses.toFixed(2)}
              </Text>
            </Card>
            <Card withBorder p="sm">
              <Text size="xs" color="dimmed">Net Gains</Text>
              <Text size="lg" weight={500}>
                ${taxData.netGains.toFixed(2)}
              </Text>
            </Card>
            <Card withBorder p="sm">
              <Text size="xs" color="dimmed">Tax Owed</Text>
              <Text size="lg" weight={500} color="orange">
                ${taxData.taxOwed.toFixed(2)}
              </Text>
            </Card>
          </Group>
          
          <div>
            <Group position="apart" mb="xs">
              <Text size="sm" weight={500}>Taxable Events ({taxData.events.length})</Text>
              <Button size="xs" variant="light" leftIcon={<IconDownload size={14} />}>
                Export CSV
              </Button>
            </Group>
            
            <Table fontSize="sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Asset</th>
                  <th>Gain/Loss</th>
                </tr>
              </thead>
              <tbody>
                {taxData.events.slice(0, 5).map((event: TaxableEvent) => (
                  <tr key={event.id}>
                    <td>{new Date(event.timestamp).toLocaleDateString()}</td>
                    <td><Badge size="sm">{event.type}</Badge></td>
                    <td>{event.asset}</td>
                    <td>
                      <Text color={parseFloat(event.gain || '0') >= 0 ? 'green' : 'red'}>
                        ${parseFloat(event.gain || '0').toFixed(2)}
                      </Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Stack>
      )}
    </Card>
  );
};

const ComplianceCheckerComponent: React.FC = () => {
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [policies, setPolicies] = useState<CompliancePolicy[]>([]);
  const complianceChecker = new ComplianceChecker();
  
  useEffect(() => {
    setPolicies(complianceChecker.getPolicies());
  }, []);
  
  const runComplianceCheck = async () => {
    const result = await complianceChecker.checkCompliance({
      userId: 'user-123',
      action: 'SEND_TRANSACTION',
      amount: Math.random() * 15000,
      country: Math.random() > 0.8 ? 'IR' : 'US'
    });
    
    setViolations(result.violations);
  };
  
  return (
    <Card shadow="sm" p="lg">
      <Group position="apart" mb="md">
        <Text size="lg" weight={500}>Compliance Checker</Text>
        <Button size="sm" onClick={runComplianceCheck} leftIcon={<IconGavel size={16} />}>
          Run Check
        </Button>
      </Group>
      
      <Tabs defaultValue="policies">
        <Tabs.List>
          <Tabs.Tab value="policies" icon={<IconShield size={14} />}>Policies</Tabs.Tab>
          <Tabs.Tab value="violations" icon={<IconAlertTriangle size={14} />}>Violations</Tabs.Tab>
        </Tabs.List>
        
        <Tabs.Panel value="policies" pt="sm">
          <Stack spacing="sm">
            {policies.map(policy => (
              <Card key={policy.id} withBorder p="sm">
                <Group position="apart">
                  <div>
                    <Text size="sm" weight={500}>{policy.name}</Text>
                    <Text size="xs" color="dimmed">{policy.description}</Text>
                    <Badge size="xs" color={policy.enabled ? 'green' : 'gray'}>
                      {policy.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <Switch checked={policy.enabled} size="sm" />
                </Group>
              </Card>
            ))}
          </Stack>
        </Tabs.Panel>
        
        <Tabs.Panel value="violations" pt="sm">
          <Stack spacing="sm">
            {violations.length === 0 ? (
              <Text size="sm" color="dimmed">No violations detected</Text>
            ) : (
              violations.map(violation => (
                <Alert
                  key={violation.id}
                  color={
                    violation.severity === 'critical' ? 'red' :
                    violation.severity === 'high' ? 'orange' :
                    violation.severity === 'medium' ? 'yellow' : 'blue'
                  }
                >
                  <Text size="sm">{violation.description}</Text>
                  <Text size="xs" color="dimmed">
                    Rule: {violation.ruleId} • {new Date(violation.timestamp).toLocaleString()}
                  </Text>
                </Alert>
              ))
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Card>
  );
};

const GDPRComplianceComponent: React.FC = () => {
  const [requests, setRequests] = useState<GDPRRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const gdprManager = new GDPRComplianceManager();
  
  const submitRequest = async (type: GDPRRequest['type']) => {
    setLoading(true);
    const reference = await gdprManager.submitRequest('user-123', type);
    
    // Refresh requests
    setTimeout(() => {
      setRequests(gdprManager.getRequests('user-123'));
      setLoading(false);
    }, 1000);
  };
  
  useEffect(() => {
    setRequests(gdprManager.getRequests('user-123'));
  }, []);
  
  return (
    <Card shadow="sm" p="lg">
      <Text size="lg" weight={500} mb="md">GDPR Data Rights</Text>
      
      <Stack spacing="md">
        <Group>
          <Button 
            size="sm" 
            variant="light"
            onClick={() => submitRequest('access')}
            loading={loading}
          >
            Request My Data
          </Button>
          <Button 
            size="sm" 
            variant="light"
            onClick={() => submitRequest('erasure')}
            loading={loading}
          >
            Delete My Data
          </Button>
          <Button 
            size="sm" 
            variant="light"
            onClick={() => submitRequest('portability')}
            loading={loading}
          >
            Export Data
          </Button>
        </Group>
        
        {requests.length > 0 && (
          <div>
            <Text size="sm" weight={500} mb="xs">Recent Requests</Text>
            <Stack spacing="xs">
              {requests.map(request => (
                <Group key={request.id} position="apart">
                  <div>
                    <Text size="sm">{request.type.replace('_', ' ').toUpperCase()}</Text>
                    <Text size="xs" color="dimmed">Ref: {request.reference}</Text>
                  </div>
                  <Badge color={
                    request.status === 'completed' ? 'green' :
                    request.status === 'processing' ? 'yellow' : 'blue'
                  }>
                    {request.status.toUpperCase()}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </div>
        )}
      </Stack>
    </Card>
  );
};

// Main Exercise Component
const RegulatoryComplianceSystemsExercise: React.FC = () => {
  return (
    <Stack spacing="md">
      <Alert icon={<IconShield size={16} />} title="Compliance Status" color="blue">
        All compliance systems operational. Regulatory framework: Multi-jurisdiction
      </Alert>
      
      <Tabs defaultValue="kyc">
        <Tabs.List>
          <Tabs.Tab value="kyc" icon={<IconUserCheck size={14} />}>KYC/AML</Tabs.Tab>
          <Tabs.Tab value="tax" icon={<IconCurrency size={14} />}>Tax Reporting</Tabs.Tab>
          <Tabs.Tab value="compliance" icon={<IconGavel size={14} />}>Compliance</Tabs.Tab>
          <Tabs.Tab value="gdpr" icon={<IconDatabase size={14} />}>GDPR</Tabs.Tab>
        </Tabs.List>
        
        <Tabs.Panel value="kyc" pt="md">
          <Group align="flex-start" spacing="md">
            <KYCInterface />
            <AMLMonitorComponent />
          </Group>
        </Tabs.Panel>
        
        <Tabs.Panel value="tax" pt="md">
          <TaxReporterComponent />
        </Tabs.Panel>
        
        <Tabs.Panel value="compliance" pt="md">
          <ComplianceCheckerComponent />
        </Tabs.Panel>
        
        <Tabs.Panel value="gdpr" pt="md">
          <GDPRComplianceComponent />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default RegulatoryComplianceSystemsExercise;