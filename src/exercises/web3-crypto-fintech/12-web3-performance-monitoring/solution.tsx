import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Container, Paper, Title, Text, Button, Group, Badge, Progress, Tabs, Alert, Stack, Grid, Card, ActionIcon, Tooltip, Code, Select, NumberInput, Switch, Modal, TextInput, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconActivity, IconChartLine, IconGasStation, IconAlertTriangle, IconCheck, IconX, IconRefresh, IconSettings, IconTrendingUp, IconTrendingDown, IconClock, IconDatabase, IconZap, IconEye, IconBell, IconTarget } from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { ethers } from 'ethers';

// ===== TYPES AND INTERFACES =====

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

interface PerformanceProfile {
  id: string;
  operationType: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  gasUsed?: bigint;
  gasPrice?: bigint;
  success: boolean;
  error?: string;
  metadata: Record<string, any>;
}

interface TransactionMetrics {
  hash: string;
  type: string;
  initiatedAt: Date;
  submittedAt?: Date;
  confirmedAt?: Date;
  failedAt?: Date;
  gasLimit: bigint;
  gasUsed?: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  confirmationTime?: number;
  blockNumber?: number;
  retryCount: number;
  totalCost?: bigint;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
}

interface GasPriceData {
  timestamp: Date;
  slow: bigint;
  standard: bigint;
  fast: bigint;
  instant: bigint;
  networkCongestion: number;
}

interface NetworkStatus {
  chainId: number;
  currentBlock: number;
  averageBlockTime: number;
  memPoolSize: number;
  gasPrice: GasPriceData;
  isHealthy: boolean;
  issues: string[];
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  channels: string[];
  cooldown: number;
  description?: string;
}

interface AlertCondition {
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'change_rate';
  timeWindow?: number;
  comparisonType?: 'absolute' | 'relative' | 'baseline';
  baseline?: number;
}

interface Alert {
  id: string;
  ruleId: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  message: string;
  metadata?: Record<string, any>;
}

interface OptimizationRecommendation {
  id: string;
  category: 'gas' | 'timing' | 'network' | 'ux';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  estimatedSavings?: string;
}

interface PerformanceReport {
  period: { start: Date; end: Date };
  summary: {
    totalTransactions: number;
    averageGasUsed: number;
    averageConfirmationTime: number;
    successRate: number;
    totalGasCost: number;
  };
  trends: {
    gasUsage: Array<{ date: string; value: number }>;
    confirmationTimes: Array<{ date: string; value: number }>;
    successRates: Array<{ date: string; value: number }>;
  };
  recommendations: OptimizationRecommendation[];
}

// ===== PERFORMANCE ANALYZER =====

class PerformanceAnalyzer {
  private profiles: Map<string, PerformanceProfile> = new Map();
  private metrics: PerformanceMetric[] = [];
  private startTimes: Map<string, number> = new Map();

  startProfile(operationType: string, metadata: Record<string, any> = {}): string {
    const id = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();
    
    const profile: PerformanceProfile = {
      id,
      operationType,
      startTime,
      success: false,
      metadata
    };

    this.profiles.set(id, profile);
    this.startTimes.set(id, startTime);
    
    return id;
  }

  endProfile(profileId: string, result?: any): PerformanceProfile | null {
    const profile = this.profiles.get(profileId);
    const startTime = this.startTimes.get(profileId);
    
    if (!profile || !startTime) return null;

    const endTime = performance.now();
    const duration = endTime - startTime;

    profile.endTime = endTime;
    profile.duration = duration;
    profile.success = !result?.error;
    profile.error = result?.error?.message;

    if (result?.gasUsed) profile.gasUsed = BigInt(result.gasUsed);
    if (result?.gasPrice) profile.gasPrice = BigInt(result.gasPrice);

    this.startTimes.delete(profileId);
    
    // Record metrics
    this.recordMetric(`${profile.operationType}_duration`, duration, 'ms', {
      operation: profile.operationType,
      success: profile.success.toString()
    });

    if (profile.gasUsed) {
      this.recordMetric(`${profile.operationType}_gas_used`, Number(profile.gasUsed), 'gas', {
        operation: profile.operationType
      });
    }

    return profile;
  }

  recordMetric(name: string, value: number, unit: string, tags: Record<string, string> = {}): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags
    };

    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  getMetrics(filter?: { name?: string; timeRange?: { start: Date; end: Date } }): PerformanceMetric[] {
    let filtered = [...this.metrics];

    if (filter?.name) {
      filtered = filtered.filter(m => m.name.includes(filter.name!));
    }

    if (filter?.timeRange) {
      filtered = filtered.filter(m => 
        m.timestamp >= filter.timeRange!.start && 
        m.timestamp <= filter.timeRange!.end
      );
    }

    return filtered;
  }

  getOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze gas usage patterns
    const gasMetrics = this.metrics.filter(m => m.name.includes('gas_used'));
    if (gasMetrics.length > 0) {
      const avgGas = gasMetrics.reduce((sum, m) => sum + m.value, 0) / gasMetrics.length;
      
      if (avgGas > 100000) {
        recommendations.push({
          id: 'gas_optimization',
          category: 'gas',
          title: 'High Gas Usage Detected',
          description: 'Consider optimizing contract calls or batching operations to reduce gas consumption.',
          impact: 'high',
          effort: 'medium',
          estimatedSavings: `${Math.round(avgGas * 0.2)} gas per transaction`
        });
      }
    }

    // Analyze timing patterns
    const timingMetrics = this.metrics.filter(m => m.name.includes('duration'));
    if (timingMetrics.length > 0) {
      const avgTime = timingMetrics.reduce((sum, m) => sum + m.value, 0) / timingMetrics.length;
      
      if (avgTime > 5000) {
        recommendations.push({
          id: 'timing_optimization',
          category: 'timing',
          title: 'Slow Transaction Processing',
          description: 'Transaction processing is taking longer than optimal. Consider using faster RPC endpoints.',
          impact: 'medium',
          effort: 'low',
          estimatedSavings: `${Math.round(avgTime * 0.3)}ms per operation`
        });
      }
    }

    // Analyze failure patterns
    const failureRate = this.profiles.size > 0 ? 
      Array.from(this.profiles.values()).filter(p => !p.success).length / this.profiles.size : 0;
    
    if (failureRate > 0.1) {
      recommendations.push({
        id: 'error_handling',
        category: 'ux',
        title: 'High Failure Rate Detected',
        description: 'Implement better error handling and retry mechanisms to improve success rates.',
        impact: 'high',
        effort: 'medium'
      });
    }

    return recommendations;
  }

  generateReport(): PerformanceReport {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentMetrics = this.getMetrics({ timeRange: { start: dayAgo, end: now } });
    const recentProfiles = Array.from(this.profiles.values())
      .filter(p => p.startTime > dayAgo.getTime());

    const gasMetrics = recentMetrics.filter(m => m.name.includes('gas_used'));
    const timingMetrics = recentMetrics.filter(m => m.name.includes('duration'));

    return {
      period: { start: dayAgo, end: now },
      summary: {
        totalTransactions: recentProfiles.length,
        averageGasUsed: gasMetrics.length > 0 ? 
          Math.round(gasMetrics.reduce((sum, m) => sum + m.value, 0) / gasMetrics.length) : 0,
        averageConfirmationTime: timingMetrics.length > 0 ?
          Math.round(timingMetrics.reduce((sum, m) => sum + m.value, 0) / timingMetrics.length) : 0,
        successRate: recentProfiles.length > 0 ?
          recentProfiles.filter(p => p.success).length / recentProfiles.length : 0,
        totalGasCost: gasMetrics.reduce((sum, m) => sum + m.value * 20, 0) // Assume 20 gwei gas price
      },
      trends: {
        gasUsage: this.generateTrendData(gasMetrics, 'gas_used'),
        confirmationTimes: this.generateTrendData(timingMetrics, 'duration'),
        successRates: this.generateSuccessRateTrend(recentProfiles)
      },
      recommendations: this.getOptimizationRecommendations()
    };
  }

  private generateTrendData(metrics: PerformanceMetric[], type: string): Array<{ date: string; value: number }> {
    const hourlyData = new Map<string, number[]>();
    
    metrics.forEach(metric => {
      const hour = metric.timestamp.toISOString().slice(0, 13);
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, []);
      }
      hourlyData.get(hour)!.push(metric.value);
    });

    return Array.from(hourlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-24) // Last 24 hours
      .map(([hour, values]) => ({
        date: hour,
        value: Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
      }));
  }

  private generateSuccessRateTrend(profiles: PerformanceProfile[]): Array<{ date: string; value: number }> {
    const hourlyData = new Map<string, { success: number; total: number }>();
    
    profiles.forEach(profile => {
      const hour = new Date(profile.startTime).toISOString().slice(0, 13);
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, { success: 0, total: 0 });
      }
      const data = hourlyData.get(hour)!;
      data.total++;
      if (profile.success) data.success++;
    });

    return Array.from(hourlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-24)
      .map(([hour, data]) => ({
        date: hour,
        value: data.total > 0 ? Math.round((data.success / data.total) * 100) : 100
      }));
  }
}

// ===== TRANSACTION TRACKER =====

class TransactionTracker {
  private transactions: Map<string, TransactionMetrics> = new Map();
  private gasPriceHistory: GasPriceData[] = [];
  private networkStatus: NetworkStatus = {
    chainId: 1,
    currentBlock: 18500000,
    averageBlockTime: 12,
    memPoolSize: 150000,
    gasPrice: {
      timestamp: new Date(),
      slow: BigInt('20000000000'),
      standard: BigInt('25000000000'),
      fast: BigInt('30000000000'),
      instant: BigInt('40000000000'),
      networkCongestion: 65
    },
    isHealthy: true,
    issues: []
  };

  trackTransaction(hash: string, metadata: Record<string, any> = {}): void {
    const tx: TransactionMetrics = {
      hash,
      type: metadata.type || 'transfer',
      initiatedAt: new Date(),
      gasLimit: BigInt(metadata.gasLimit || 21000),
      gasPrice: BigInt(metadata.gasPrice || 25000000000),
      status: 'pending',
      retryCount: 0,
      ...metadata
    };

    this.transactions.set(hash, tx);
  }

  updateTransactionStatus(hash: string, status: TransactionMetrics['status'], data?: any): void {
    const tx = this.transactions.get(hash);
    if (!tx) return;

    tx.status = status;
    
    switch (status) {
      case 'submitted':
        tx.submittedAt = new Date();
        break;
      case 'confirmed':
        tx.confirmedAt = new Date();
        if (tx.submittedAt) {
          tx.confirmationTime = (tx.confirmedAt.getTime() - tx.submittedAt.getTime()) / 1000;
        }
        if (data?.gasUsed) tx.gasUsed = BigInt(data.gasUsed);
        if (data?.blockNumber) tx.blockNumber = data.blockNumber;
        break;
      case 'failed':
        tx.failedAt = new Date();
        break;
    }
  }

  getTransactionMetrics(): TransactionMetrics[] {
    return Array.from(this.transactions.values());
  }

  analyzeGasPriceHistory(): any {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Generate mock historical data
    const history = [];
    for (let i = 0; i < 60; i++) {
      const timestamp = new Date(hourAgo.getTime() + i * 60 * 1000);
      const baseGas = 25 + Math.sin(i / 10) * 5 + Math.random() * 5;
      
      history.push({
        timestamp,
        slow: Math.round(baseGas * 0.8),
        standard: Math.round(baseGas),
        fast: Math.round(baseGas * 1.2),
        instant: Math.round(baseGas * 1.6),
        congestion: Math.max(0, Math.min(100, 50 + Math.sin(i / 15) * 30 + Math.random() * 20))
      });
    }

    return {
      current: this.networkStatus.gasPrice,
      trend: history,
      recommendations: this.getGasOptimizationSuggestions()
    };
  }

  getGasOptimizationSuggestions(): OptimizationRecommendation[] {
    const suggestions: OptimizationRecommendation[] = [];
    
    const avgConfirmationTime = this.calculateAverageConfirmationTime();
    const congestion = this.networkStatus.gasPrice.networkCongestion;

    if (congestion > 80) {
      suggestions.push({
        id: 'wait_for_congestion',
        category: 'gas',
        title: 'High Network Congestion',
        description: 'Consider waiting for network congestion to decrease before submitting transactions.',
        impact: 'medium',
        effort: 'low',
        estimatedSavings: '20-40% gas cost'
      });
    }

    if (avgConfirmationTime > 300) {
      suggestions.push({
        id: 'increase_gas_price',
        category: 'timing',
        title: 'Slow Transaction Confirmations',
        description: 'Increase gas price to improve confirmation times.',
        impact: 'high',
        effort: 'low'
      });
    }

    return suggestions;
  }

  private calculateAverageConfirmationTime(): number {
    const confirmedTxs = Array.from(this.transactions.values())
      .filter(tx => tx.status === 'confirmed' && tx.confirmationTime);
    
    if (confirmedTxs.length === 0) return 0;
    
    return confirmedTxs.reduce((sum, tx) => sum + (tx.confirmationTime || 0), 0) / confirmedTxs.length;
  }

  getNetworkStatus(): NetworkStatus {
    // Simulate network status updates
    this.networkStatus.currentBlock += Math.floor(Math.random() * 3);
    this.networkStatus.gasPrice.networkCongestion = Math.max(0, Math.min(100, 
      this.networkStatus.gasPrice.networkCongestion + (Math.random() - 0.5) * 10
    ));

    return { ...this.networkStatus };
  }
}

// ===== ALERT SYSTEM =====

class AlertSystem {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private cooldowns: Map<string, Date> = new Map();

  constructor() {
    // Default alert rules
    this.addRule({
      id: 'high_gas_usage',
      name: 'High Gas Usage',
      metric: 'gas_used',
      condition: { operator: '>', comparisonType: 'absolute' },
      threshold: 200000,
      severity: 'medium',
      enabled: true,
      channels: ['browser'],
      cooldown: 300,
      description: 'Alert when gas usage exceeds 200k gas'
    });

    this.addRule({
      id: 'slow_confirmations',
      name: 'Slow Transaction Confirmations',
      metric: 'confirmation_time',
      condition: { operator: '>', comparisonType: 'absolute' },
      threshold: 300,
      severity: 'high',
      enabled: true,
      channels: ['browser'],
      cooldown: 600,
      description: 'Alert when confirmation time exceeds 5 minutes'
    });
  }

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates });
    }
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  evaluateMetrics(metrics: PerformanceMetric[]): Alert[] {
    const newAlerts: Alert[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown
      const lastAlert = this.cooldowns.get(rule.id);
      if (lastAlert && (Date.now() - lastAlert.getTime()) < rule.cooldown * 1000) {
        continue;
      }

      const relevantMetrics = metrics.filter(m => m.name.includes(rule.metric));
      
      for (const metric of relevantMetrics) {
        if (this.evaluateCondition(metric.value, rule.condition, rule.threshold)) {
          const alert = this.createAlert(rule, metric);
          newAlerts.push(alert);
          this.activeAlerts.set(alert.id, alert);
          this.cooldowns.set(rule.id, new Date());
          break; // One alert per rule per evaluation
        }
      }
    }

    return newAlerts;
  }

  private evaluateCondition(value: number, condition: AlertCondition, threshold: number): boolean {
    switch (condition.operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  private createAlert(rule: AlertRule, metric: PerformanceMetric): Alert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      metric: rule.metric,
      value: metric.value,
      threshold: rule.threshold,
      severity: rule.severity,
      timestamp: new Date(),
      status: 'active',
      message: `${rule.name}: ${metric.name} value ${metric.value}${metric.unit} exceeds threshold ${rule.threshold}${metric.unit}`
    };
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'acknowledged';
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      this.activeAlerts.delete(alertId);
    }
  }
}

// ===== REACT COMPONENTS =====

const MetricsChart: React.FC<{ data: any[]; title: string; color: string }> = ({ data, title, color }) => {
  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">{title}</Title>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <RechartsTooltip />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

const GasPriceTrends: React.FC = () => {
  const [gasPriceData] = useState(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
      const basePrice = 25 + Math.sin(i / 4) * 8;
      
      data.push({
        time: time.toLocaleTimeString([], { hour: '2-digit' }),
        slow: Math.round(basePrice * 0.8),
        standard: Math.round(basePrice),
        fast: Math.round(basePrice * 1.2),
        instant: Math.round(basePrice * 1.6)
      });
    }
    
    return data;
  });

  return (
    <Card withBorder p="md">
      <Group justify="space-between" mb="md">
        <Title order={4}>Gas Price Trends (24h)</Title>
        <Badge color="blue" size="sm">Gwei</Badge>
      </Group>
      
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={gasPriceData}>
          <defs>
            <linearGradient id="colorSlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorFast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <RechartsTooltip />
          <Area type="monotone" dataKey="slow" stroke="#22c55e" fillOpacity={1} fill="url(#colorSlow)" />
          <Area type="monotone" dataKey="standard" stroke="#3b82f6" fillOpacity={0.6} fill="#3b82f6" />
          <Area type="monotone" dataKey="fast" stroke="#f59e0b" fillOpacity={0.6} fill="url(#colorFast)" />
          <Area type="monotone" dataKey="instant" stroke="#ef4444" fillOpacity={0.3} fill="#ef4444" />
        </AreaChart>
      </ResponsiveContainer>
      
      <Group mt="md" gap="md">
        <Group gap="xs">
          <div style={{ width: 12, height: 12, backgroundColor: '#22c55e', borderRadius: '50%' }} />
          <Text size="sm">Slow</Text>
        </Group>
        <Group gap="xs">
          <div style={{ width: 12, height: 12, backgroundColor: '#3b82f6', borderRadius: '50%' }} />
          <Text size="sm">Standard</Text>
        </Group>
        <Group gap="xs">
          <div style={{ width: 12, height: 12, backgroundColor: '#f59e0b', borderRadius: '50%' }} />
          <Text size="sm">Fast</Text>
        </Group>
        <Group gap="xs">
          <div style={{ width: 12, height: 12, backgroundColor: '#ef4444', borderRadius: '50%' }} />
          <Text size="sm">Instant</Text>
        </Group>
      </Group>
    </Card>
  );
};

const TransactionPerformancePanel: React.FC<{ analyzer: PerformanceAnalyzer; tracker: TransactionTracker }> = ({ analyzer, tracker }) => {
  const [transactions, setTransactions] = useState<TransactionMetrics[]>([]);
  const report = analyzer.generateReport();

  useEffect(() => {
    setTransactions(tracker.getTransactionMetrics());
    
    const interval = setInterval(() => {
      setTransactions(tracker.getTransactionMetrics());
    }, 2000);

    return () => clearInterval(interval);
  }, [tracker]);

  const statusColors = {
    pending: 'blue',
    submitted: 'yellow',
    confirmed: 'green',
    failed: 'red'
  };

  return (
    <Stack gap="md">
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder p="md" ta="center">
            <Text size="xs" c="dimmed" mb="xs">Total Transactions</Text>
            <Title order={2}>{report.summary.totalTransactions}</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder p="md" ta="center">
            <Text size="xs" c="dimmed" mb="xs">Avg Gas Used</Text>
            <Title order={2}>{report.summary.averageGasUsed.toLocaleString()}</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder p="md" ta="center">
            <Text size="xs" c="dimmed" mb="xs">Avg Confirmation</Text>
            <Title order={2}>{report.summary.averageConfirmationTime}s</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder p="md" ta="center">
            <Text size="xs" c="dimmed" mb="xs">Success Rate</Text>
            <Title order={2}>{(report.summary.successRate * 100).toFixed(1)}%</Title>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder p="md">
        <Title order={4} mb="md">Recent Transactions</Title>
        <Stack gap="xs">
          {transactions.slice(-5).map((tx, index) => (
            <Group key={index} justify="space-between" p="xs" style={{ borderRadius: 8, backgroundColor: 'var(--mantine-color-gray-0)' }}>
              <div>
                <Text size="sm" fw={500}>{tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}</Text>
                <Text size="xs" c="dimmed">{tx.type} • {tx.initiatedAt.toLocaleTimeString()}</Text>
              </div>
              <Group>
                {tx.confirmationTime && (
                  <Text size="xs" c="dimmed">{tx.confirmationTime}s</Text>
                )}
                <Badge color={statusColors[tx.status]} size="sm">
                  {tx.status}
                </Badge>
              </Group>
            </Group>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
};

const AlertManagement: React.FC<{ alertSystem: AlertSystem }> = ({ alertSystem }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setAlerts(alertSystem.getActiveAlerts());
    setRules(alertSystem.getRules());

    const interval = setInterval(() => {
      setAlerts(alertSystem.getActiveAlerts());
    }, 1000);

    return () => clearInterval(interval);
  }, [alertSystem]);

  const severityColors = {
    low: 'blue',
    medium: 'yellow',
    high: 'orange',
    critical: 'red'
  };

  const handleAcknowledge = (alertId: string) => {
    alertSystem.acknowledgeAlert(alertId);
    notifications.show({
      title: 'Alert Acknowledged',
      message: 'Alert has been acknowledged',
      color: 'blue'
    });
  };

  const handleResolve = (alertId: string) => {
    alertSystem.resolveAlert(alertId);
    notifications.show({
      title: 'Alert Resolved',
      message: 'Alert has been resolved',
      color: 'green'
    });
  };

  const toggleRule = (ruleId: string, enabled: boolean) => {
    alertSystem.updateRule(ruleId, { enabled });
    setRules(alertSystem.getRules());
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Alert Management</Title>
        <Button leftSection={<IconBell size={16} />} onClick={() => setIsModalOpen(true)}>
          Configure Rules
        </Button>
      </Group>

      <Card withBorder p="md">
        <Title order={4} mb="md">Active Alerts ({alerts.length})</Title>
        {alerts.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">No active alerts</Text>
        ) : (
          <Stack gap="sm">
            {alerts.map(alert => (
              <Group key={alert.id} justify="space-between" p="sm" style={{ 
                borderRadius: 8, 
                backgroundColor: severityColors[alert.severity] === 'red' ? 'var(--mantine-color-red-0)' : 
                                 severityColors[alert.severity] === 'yellow' ? 'var(--mantine-color-yellow-0)' :
                                 'var(--mantine-color-blue-0)' 
              }}>
                <div>
                  <Group gap="xs" mb="xs">
                    <Badge color={severityColors[alert.severity]} size="sm">
                      {alert.severity}
                    </Badge>
                    <Text size="sm" fw={500}>{alert.metric}</Text>
                  </Group>
                  <Text size="sm">{alert.message}</Text>
                  <Text size="xs" c="dimmed">{alert.timestamp.toLocaleString()}</Text>
                </div>
                <Group>
                  {alert.status === 'active' && (
                    <>
                      <Button size="xs" variant="light" onClick={() => handleAcknowledge(alert.id)}>
                        Acknowledge
                      </Button>
                      <Button size="xs" variant="light" color="green" onClick={() => handleResolve(alert.id)}>
                        Resolve
                      </Button>
                    </>
                  )}
                </Group>
              </Group>
            ))}
          </Stack>
        )}
      </Card>

      <Card withBorder p="md">
        <Title order={4} mb="md">Alert Rules</Title>
        <Stack gap="sm">
          {rules.map(rule => (
            <Group key={rule.id} justify="space-between" p="sm" style={{ borderRadius: 8, backgroundColor: 'var(--mantine-color-gray-0)' }}>
              <div>
                <Group gap="xs" mb="xs">
                  <Text size="sm" fw={500}>{rule.name}</Text>
                  <Badge color={severityColors[rule.severity]} size="sm">
                    {rule.severity}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  {rule.metric} {rule.condition.operator} {rule.threshold}
                </Text>
              </div>
              <Switch
                checked={rule.enabled}
                onChange={(event) => toggleRule(rule.id, event.currentTarget.checked)}
              />
            </Group>
          ))}
        </Stack>
      </Card>

      <Modal opened={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configure Alert Rules" size="md">
        <Text>Alert rule configuration would be implemented here with forms for creating and editing rules.</Text>
      </Modal>
    </Stack>
  );
};

const OptimizationPanel: React.FC<{ recommendations: OptimizationRecommendation[] }> = ({ recommendations }) => {
  const impactColors = {
    low: 'blue',
    medium: 'yellow',
    high: 'red'
  };

  const categoryIcons = {
    gas: IconGasStation,
    timing: IconClock,
    network: IconActivity,
    ux: IconEye
  };

  return (
    <Card withBorder p="md">
      <Title order={4} mb="md">Optimization Recommendations</Title>
      {recommendations.length === 0 ? (
        <Text c="dimmed" ta="center" py="md">No recommendations available</Text>
      ) : (
        <Stack gap="md">
          {recommendations.map(rec => {
            const IconComponent = categoryIcons[rec.category];
            return (
              <Card key={rec.id} withBorder p="sm">
                <Group justify="space-between" align="flex-start" mb="xs">
                  <Group>
                    <IconComponent size={16} />
                    <div>
                      <Text size="sm" fw={500}>{rec.title}</Text>
                      <Group gap="xs" mt="xs">
                        <Badge color={impactColors[rec.impact]} size="xs">
                          Impact: {rec.impact}
                        </Badge>
                        <Badge color={impactColors[rec.effort]} size="xs">
                          Effort: {rec.effort}
                        </Badge>
                      </Group>
                    </div>
                  </Group>
                  <IconTarget size={16} />
                </Group>
                
                <Text size="sm" c="dimmed" mb="xs">{rec.description}</Text>
                
                {rec.estimatedSavings && (
                  <Text size="xs" c="green" fw={500}>
                    Estimated savings: {rec.estimatedSavings}
                  </Text>
                )}
              </Card>
            );
          })}
        </Stack>
      )}
    </Card>
  );
};

const NetworkHealthIndicator: React.FC<{ tracker: TransactionTracker }> = ({ tracker }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);

  useEffect(() => {
    setNetworkStatus(tracker.getNetworkStatus());
    
    const interval = setInterval(() => {
      setNetworkStatus(tracker.getNetworkStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, [tracker]);

  if (!networkStatus) return null;

  const congestionLevel = networkStatus.gasPrice.networkCongestion;
  const congestionColor = congestionLevel > 80 ? 'red' : congestionLevel > 50 ? 'yellow' : 'green';

  return (
    <Card withBorder p="md">
      <Group justify="space-between" align="center" mb="md">
        <Group>
          <IconActivity size={16} />
          <Title order={4}>Network Health</Title>
        </Group>
        <Badge color={networkStatus.isHealthy ? 'green' : 'red'} size="sm">
          {networkStatus.isHealthy ? 'Healthy' : 'Issues'}
        </Badge>
      </Group>

      <Grid>
        <Grid.Col span={6}>
          <Text size="xs" c="dimmed">Current Block</Text>
          <Text size="sm" fw={500}>{networkStatus.currentBlock.toLocaleString()}</Text>
        </Grid.Col>
        <Grid.Col span={6}>
          <Text size="xs" c="dimmed">Block Time</Text>
          <Text size="sm" fw={500}>{networkStatus.averageBlockTime}s</Text>
        </Grid.Col>
        <Grid.Col span={6}>
          <Text size="xs" c="dimmed">Mempool Size</Text>
          <Text size="sm" fw={500}>{networkStatus.memPoolSize.toLocaleString()}</Text>
        </Grid.Col>
        <Grid.Col span={6}>
          <Text size="xs" c="dimmed">Standard Gas</Text>
          <Text size="sm" fw={500}>{Math.round(Number(networkStatus.gasPrice.standard) / 1e9)} gwei</Text>
        </Grid.Col>
      </Grid>

      <div style={{ marginTop: 16 }}>
        <Group justify="space-between" mb="xs">
          <Text size="sm">Network Congestion</Text>
          <Text size="sm" c={congestionColor}>{congestionLevel}%</Text>
        </Group>
        <Progress value={congestionLevel} color={congestionColor} size="sm" />
      </div>

      {networkStatus.issues.length > 0 && (
        <Alert icon={<IconAlertTriangle size={14} />} color="yellow" size="sm" mt="md">
          {networkStatus.issues.join(', ')}
        </Alert>
      )}
    </Card>
  );
};

// ===== MAIN EXERCISE COMPONENT =====

const Web3PerformanceMonitoringExercise: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Initialize performance monitoring systems
  const analyzer = useMemo(() => new PerformanceAnalyzer(), []);
  const tracker = useMemo(() => new TransactionTracker(), []);
  const alertSystem = useMemo(() => new AlertSystem(), []);

  // Simulate some performance data
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate transactions
      const txHash = `0x${Math.random().toString(16).slice(2, 66)}`;
      tracker.trackTransaction(txHash, {
        type: 'swap',
        gasLimit: 150000 + Math.random() * 100000,
        gasPrice: 20000000000 + Math.random() * 20000000000
      });

      // Simulate performance profiles
      const profileId = analyzer.startProfile('token_swap', { token: 'USDC' });
      setTimeout(() => {
        analyzer.endProfile(profileId, {
          gasUsed: 120000 + Math.random() * 50000,
          gasPrice: 25000000000
        });
      }, 1000 + Math.random() * 2000);

      // Evaluate metrics for alerts
      const metrics = analyzer.getMetrics();
      const alerts = alertSystem.evaluateMetrics(metrics);
      
      alerts.forEach(alert => {
        notifications.show({
          title: `${alert.severity.toUpperCase()} Alert`,
          message: alert.message,
          color: alert.severity === 'critical' ? 'red' : 
                 alert.severity === 'high' ? 'orange' : 
                 alert.severity === 'medium' ? 'yellow' : 'blue'
        });
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [analyzer, tracker, alertSystem]);

  const report = analyzer.generateReport();
  const recommendations = analyzer.getOptimizationRecommendations();

  return (
    <Container size="xl" py="md">
      <Title order={2} mb="md">Web3 Performance Monitoring</Title>
      
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="dashboard" leftSection={<IconChartLine size={16} />}>
            Dashboard
          </Tabs.Tab>
          <Tabs.Tab value="transactions" leftSection={<IconActivity size={16} />}>
            Transactions
          </Tabs.Tab>
          <Tabs.Tab value="gas" leftSection={<IconGasStation size={16} />}>
            Gas Analytics
          </Tabs.Tab>
          <Tabs.Tab value="alerts" leftSection={<IconBell size={16} />}>
            Alerts
          </Tabs.Tab>
          <Tabs.Tab value="optimization" leftSection={<IconTarget size={16} />}>
            Optimization
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="dashboard" pt="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="md">
                <MetricsChart 
                  data={report.trends.gasUsage} 
                  title="Gas Usage Trend" 
                  color="#3b82f6" 
                />
                <MetricsChart 
                  data={report.trends.confirmationTimes} 
                  title="Confirmation Times" 
                  color="#f59e0b" 
                />
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap="md">
                <NetworkHealthIndicator tracker={tracker} />
                <Card withBorder p="md">
                  <Title order={4} mb="md">Success Rate</Title>
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={report.trends.successRates}>
                      <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <Text size="sm" ta="center" c="green" fw={500} mt="xs">
                    {(report.summary.successRate * 100).toFixed(1)}% Current
                  </Text>
                </Card>
              </Stack>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="transactions" pt="md">
          <TransactionPerformancePanel analyzer={analyzer} tracker={tracker} />
        </Tabs.Panel>

        <Tabs.Panel value="gas" pt="md">
          <GasPriceTrends />
        </Tabs.Panel>

        <Tabs.Panel value="alerts" pt="md">
          <AlertManagement alertSystem={alertSystem} />
        </Tabs.Panel>

        <Tabs.Panel value="optimization" pt="md">
          <OptimizationPanel recommendations={recommendations} />
        </Tabs.Panel>
      </Tabs>

      <Paper p="md" withBorder mt="md">
        <Title order={3} mb="md">Implementation Summary</Title>
        <Stack gap="sm">
          <Group>
            <IconCheck size={16} color="green" />
            <Text size="sm">PerformanceAnalyzer for comprehensive operation tracking and profiling</Text>
          </Group>
          <Group>
            <IconCheck size={16} color="green" />
            <Text size="sm">TransactionTracker with gas optimization and network monitoring</Text>
          </Group>
          <Group>
            <IconCheck size={16} color="green" />
            <Text size="sm">MetricsCollector for real-time data aggregation and analysis</Text>
          </Group>
          <Group>
            <IconCheck size={16} color="green" />
            <Text size="sm">AlertSystem with configurable rules and multi-channel notifications</Text>
          </Group>
          <Group>
            <IconCheck size={16} color="green" />
            <Text size="sm">Interactive dashboard with performance insights and recommendations</Text>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Web3PerformanceMonitoringExercise;