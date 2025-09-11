import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, Title, Text, Button, Group, Badge, Stack, Progress, Tabs, Code, Alert, Grid, NumberInput } from '@mantine/core';

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB';
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

interface ServerMetric {
  timestamp: number;
  cpu: number;
  memory: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
}

interface HydrationMetric {
  component: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  operator: '>' | '<' | '=' | '>=' | '<=';
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
}

interface PerformanceBudget {
  metric: string;
  budget: number;
  current: number;
  threshold: number;
}

export class PerformanceTracker {
  private observers: Map<string, PerformanceObserver> = new Map();
  private metrics: Map<string, any[]> = new Map();
  private budgets: PerformanceBudget[] = [];
  private onMetricCallback?: (metric: any) => void;

  constructor() {
    this.initializeObservers();
  }

  setOnMetric(callback: (metric: any) => void): void {
    this.onMetricCallback = callback;
  }

  setBudgets(budgets: PerformanceBudget[]): void {
    this.budgets = budgets;
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    this.setupWebVitalsObserver();
    this.setupNavigationObserver();
    this.setupResourceObserver();
    this.setupLongTaskObserver();
  }

  private setupWebVitalsObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordWebVital(entry);
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      this.observers.set('web-vitals', observer);
    } catch (error) {
      console.warn('Web Vitals observer not supported:', error);
    }
  }

  private setupNavigationObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordNavigationTiming(entry as PerformanceNavigationTiming);
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', observer);
    } catch (error) {
      console.warn('Navigation observer not supported:', error);
    }
  }

  private setupResourceObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordResourceTiming(entry as PerformanceResourceTiming);
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    } catch (error) {
      console.warn('Resource observer not supported:', error);
    }
  }

  private setupLongTaskObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordLongTask(entry);
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', observer);
    } catch (error) {
      console.warn('Long task observer not supported:', error);
    }
  }

  private recordWebVital(entry: PerformanceEntry): void {
    let metric: WebVitalsMetric;

    switch (entry.entryType) {
      case 'largest-contentful-paint':
        metric = {
          name: 'LCP',
          value: entry.startTime,
          delta: entry.startTime,
          id: entry.name,
          rating: this.getRating('LCP', entry.startTime)
        };
        break;
      case 'first-input':
        metric = {
          name: 'FID',
          value: (entry as any).processingStart - entry.startTime,
          delta: (entry as any).processingStart - entry.startTime,
          id: entry.name,
          rating: this.getRating('FID', (entry as any).processingStart - entry.startTime)
        };
        break;
      case 'layout-shift':
        if (!(entry as any).hadRecentInput) {
          metric = {
            name: 'CLS',
            value: (entry as any).value,
            delta: (entry as any).value,
            id: entry.name,
            rating: this.getRating('CLS', (entry as any).value)
          };
        }
        break;
      default:
        return;
    }

    if (metric!) {
      this.addMetric('web-vitals', metric);
      this.onMetricCallback?.(metric);
    }
  }

  private recordNavigationTiming(entry: PerformanceNavigationTiming): void {
    const metrics = {
      ttfb: entry.responseStart - entry.requestStart,
      fcp: entry.domContentLoadedEventStart - entry.navigationStart,
      domComplete: entry.domComplete - entry.navigationStart,
      loadComplete: entry.loadEventEnd - entry.navigationStart
    };

    this.addMetric('navigation', metrics);
    this.onMetricCallback?.({ type: 'navigation', ...metrics });
  }

  private recordResourceTiming(entry: PerformanceResourceTiming): void {
    const resource = {
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize,
      type: this.getResourceType(entry.name),
      timestamp: entry.startTime
    };

    this.addMetric('resources', resource);
  }

  private recordLongTask(entry: PerformanceEntry): void {
    const longTask = {
      duration: entry.duration,
      startTime: entry.startTime,
      attribution: (entry as any).attribution
    };

    this.addMetric('longtasks', longTask);
    this.onMetricCallback?.({ type: 'longtask', ...longTask });
  }

  private getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)/)) return 'image';
    if (url.includes('.woff')) return 'font';
    return 'other';
  }

  private addMetric(category: string, metric: any): void {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }
    this.metrics.get(category)!.push({ ...metric, timestamp: Date.now() });
  }

  getMetrics(category: string): any[] {
    return this.metrics.get(category) || [];
  }

  getLatestWebVitals(): WebVitalsMetric[] {
    return this.getMetrics('web-vitals').slice(-5);
  }

  checkBudgets(): { violated: PerformanceBudget[], warning: PerformanceBudget[] } {
    const violated: PerformanceBudget[] = [];
    const warning: PerformanceBudget[] = [];

    for (const budget of this.budgets) {
      if (budget.current > budget.budget) {
        violated.push(budget);
      } else if (budget.current > budget.threshold) {
        warning.push(budget);
      }
    }

    return { violated, warning };
  }

  disconnect(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error, errorInfo: any) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error } {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any): void {
    this.props.onError?.(error, errorInfo);
    
    this.reportError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  }

  private reportError(errorData: any): void {
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    }).catch(console.error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Alert color="red" title="Something went wrong">
          <Text size="sm">
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Button size="xs" mt="sm" onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export class MetricsCollector {
  private metrics: Map<string, any[]> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  startCollection(config: { serverMetrics: boolean; clientMetrics: boolean }): void {
    if (config.serverMetrics) {
      this.startServerMetricsCollection();
    }

    if (config.clientMetrics) {
      this.startClientMetricsCollection();
    }
  }

  private startServerMetricsCollection(): void {
    const interval = setInterval(() => {
      const serverMetric: ServerMetric = {
        timestamp: Date.now(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        responseTime: Math.random() * 1000,
        throughput: Math.random() * 10000,
        errorRate: Math.random() * 5
      };

      this.addMetric('server', serverMetric);
    }, 5000);

    this.intervals.set('server', interval);
  }

  private startClientMetricsCollection(): void {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        const clientMetric = {
          timestamp: Date.now(),
          memoryUsed: (performance as any).memory?.usedJSHeapSize || 0,
          memoryTotal: (performance as any).memory?.totalJSHeapSize || 0,
          connectionType: (navigator as any).connection?.effectiveType || 'unknown',
          onlineStatus: navigator.onLine
        };

        this.addMetric('client', clientMetric);
      }
    }, 10000);

    this.intervals.set('client', interval);
  }

  recordHydration(component: string, startTime: number, success: boolean, error?: string): void {
    const hydrationMetric: HydrationMetric = {
      component,
      startTime,
      endTime: performance.now(),
      duration: performance.now() - startTime,
      success,
      error
    };

    this.addMetric('hydration', hydrationMetric);
  }

  private addMetric(category: string, metric: any): void {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }
    
    const categoryMetrics = this.metrics.get(category)!;
    categoryMetrics.push(metric);
    
    if (categoryMetrics.length > 100) {
      categoryMetrics.shift();
    }
  }

  getMetrics(category: string): any[] {
    return this.metrics.get(category) || [];
  }

  getLatestMetrics(category: string, count: number = 10): any[] {
    const metrics = this.getMetrics(category);
    return metrics.slice(-count);
  }

  stopCollection(): void {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }
}

export class AlertingSystem {
  private rules: AlertRule[] = [];
  private activeAlerts: Map<string, any> = new Map();
  private onAlert?: (alert: any) => void;

  constructor() {
    this.setupDefaultRules();
  }

  setOnAlert(callback: (alert: any) => void): void {
    this.onAlert = callback;
  }

  private setupDefaultRules(): void {
    this.rules = [
      {
        id: 'high-lcp',
        name: 'High LCP',
        metric: 'LCP',
        threshold: 2500,
        operator: '>',
        severity: 'warning',
        enabled: true
      },
      {
        id: 'poor-cls',
        name: 'Poor CLS',
        metric: 'CLS',
        threshold: 0.1,
        operator: '>',
        severity: 'critical',
        enabled: true
      },
      {
        id: 'high-fid',
        name: 'High FID',
        metric: 'FID',
        threshold: 100,
        operator: '>',
        severity: 'warning',
        enabled: true
      },
      {
        id: 'server-cpu',
        name: 'High CPU Usage',
        metric: 'cpu',
        threshold: 80,
        operator: '>',
        severity: 'critical',
        enabled: true
      },
      {
        id: 'error-rate',
        name: 'High Error Rate',
        metric: 'errorRate',
        threshold: 2,
        operator: '>',
        severity: 'critical',
        enabled: true
      }
    ];
  }

  checkMetrics(metrics: any): void {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      const value = this.extractMetricValue(metrics, rule.metric);
      if (value !== null && this.evaluateCondition(value, rule.threshold, rule.operator)) {
        this.triggerAlert(rule, value);
      } else {
        this.resolveAlert(rule.id);
      }
    }
  }

  private extractMetricValue(metrics: any, metricName: string): number | null {
    if (typeof metrics === 'object' && metrics !== null) {
      if (metrics.hasOwnProperty(metricName)) {
        return metrics[metricName];
      }
      if (metrics.value && metricName === metrics.name) {
        return metrics.value;
      }
    }
    return null;
  }

  private evaluateCondition(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '=': return value === threshold;
      default: return false;
    }
  }

  private triggerAlert(rule: AlertRule, value: number): void {
    if (this.activeAlerts.has(rule.id)) return;

    const alert = {
      id: rule.id,
      name: rule.name,
      severity: rule.severity,
      value,
      threshold: rule.threshold,
      timestamp: Date.now(),
      status: 'active'
    };

    this.activeAlerts.set(rule.id, alert);
    this.onAlert?.(alert);
  }

  private resolveAlert(ruleId: string): void {
    if (this.activeAlerts.has(ruleId)) {
      const alert = this.activeAlerts.get(ruleId);
      alert.status = 'resolved';
      alert.resolvedAt = Date.now();
      this.activeAlerts.delete(ruleId);
      this.onAlert?.(alert);
    }
  }

  getActiveAlerts(): any[] {
    return Array.from(this.activeAlerts.values());
  }

  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  updateRule(id: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.find(r => r.id === id);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  getRules(): AlertRule[] {
    return [...this.rules];
  }
}

const DemoMonitoringObservability: React.FC = () => {
  const [performanceTracker] = useState(() => new PerformanceTracker());
  const [metricsCollector] = useState(() => new MetricsCollector());
  const [alertingSystem] = useState(() => new AlertingSystem());
  
  const [webVitals, setWebVitals] = useState<WebVitalsMetric[]>([]);
  const [serverMetrics, setServerMetrics] = useState<ServerMetric[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [hydrationMetrics, setHydrationMetrics] = useState<HydrationMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const [performanceBudgets] = useState<PerformanceBudget[]>([
    { metric: 'LCP', budget: 2500, current: 2100, threshold: 2000 },
    { metric: 'FID', budget: 100, current: 85, threshold: 80 },
    { metric: 'CLS', budget: 0.1, current: 0.08, threshold: 0.05 },
    { metric: 'Bundle Size', budget: 250000, current: 185000, threshold: 200000 }
  ]);

  useEffect(() => {
    performanceTracker.setOnMetric((metric) => {
      if (metric.name) {
        setWebVitals(prev => [...prev.slice(-4), metric]);
        alertingSystem.checkMetrics(metric);
      }
    });

    alertingSystem.setOnAlert((alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 9)]);
    });

    return () => {
      performanceTracker.disconnect();
      metricsCollector.stopCollection();
    };
  }, [performanceTracker, alertingSystem, metricsCollector]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    metricsCollector.startCollection({ serverMetrics: true, clientMetrics: true });
    
    const interval = setInterval(() => {
      const latest = metricsCollector.getLatestMetrics('server', 1)[0];
      if (latest) {
        setServerMetrics(prev => [...prev.slice(-9), latest]);
        alertingSystem.checkMetrics(latest);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [metricsCollector, alertingSystem]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    metricsCollector.stopCollection();
  }, [metricsCollector]);

  const simulateHydration = useCallback(() => {
    const components = ['UserProfile', 'ProductList', 'ShoppingCart', 'Navigation'];
    const component = components[Math.floor(Math.random() * components.length)];
    const startTime = performance.now();
    const success = Math.random() > 0.1;
    const error = success ? undefined : 'Hydration mismatch detected';
    
    setTimeout(() => {
      metricsCollector.recordHydration(component, startTime, success, error);
      setHydrationMetrics(prev => [...prev.slice(-9), {
        component,
        startTime,
        endTime: performance.now(),
        duration: performance.now() - startTime,
        success,
        error
      }]);
    }, Math.random() * 1000);
  }, [metricsCollector]);

  const budgetStatus = useMemo(() => {
    return performanceTracker.checkBudgets();
  }, [performanceTracker]);

  const averageResponseTime = useMemo(() => {
    if (serverMetrics.length === 0) return 0;
    return serverMetrics.reduce((sum, m) => sum + m.responseTime, 0) / serverMetrics.length;
  }, [serverMetrics]);

  const errorRate = useMemo(() => {
    if (serverMetrics.length === 0) return 0;
    return serverMetrics[serverMetrics.length - 1]?.errorRate || 0;
  }, [serverMetrics]);

  const getVitalColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'green';
      case 'needs-improvement': return 'yellow';
      case 'poor': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Title order={1} mb="md">SSR Monitoring & Observability</Title>
      <Text mb="xl" c="dimmed">
        Comprehensive monitoring system for SSR applications with real-time metrics and alerting
      </Text>

      <Group mb="xl">
        <Button 
          onClick={startMonitoring} 
          disabled={isMonitoring}
          color="green"
        >
          Start Monitoring
        </Button>
        <Button 
          onClick={stopMonitoring} 
          disabled={!isMonitoring}
          color="red"
          variant="outline"
        >
          Stop Monitoring
        </Button>
        <Button 
          onClick={simulateHydration}
          variant="light"
        >
          Simulate Hydration
        </Button>
      </Group>

      <Tabs defaultValue="vitals" className="w-full">
        <Tabs.List>
          <Tabs.Tab value="vitals">Web Vitals</Tabs.Tab>
          <Tabs.Tab value="server">Server Metrics</Tabs.Tab>
          <Tabs.Tab value="hydration">Hydration</Tabs.Tab>
          <Tabs.Tab value="budgets">Performance Budgets</Tabs.Tab>
          <Tabs.Tab value="alerts">Alerts</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="vitals" pt="md">
          <Grid>
            <Grid.Col span={12}>
              <Card>
                <Title order={3} mb="md">Core Web Vitals</Title>
                <Group>
                  {webVitals.slice(-3).map((vital, index) => (
                    <Card key={index} withBorder p="sm">
                      <Badge color={getVitalColor(vital.rating)} mb="xs">
                        {vital.name}
                      </Badge>
                      <Text size="lg" fw={500}>{vital.value.toFixed(0)}</Text>
                      <Text size="xs" c="dimmed">
                        {vital.name === 'CLS' ? '' : 'ms'}
                      </Text>
                    </Card>
                  ))}
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="server" pt="md">
          <Grid>
            <Grid.Col span={6}>
              <Card>
                <Title order={4} mb="md">System Resources</Title>
                <Stack gap="md">
                  <div>
                    <Text size="sm" c="dimmed">CPU Usage</Text>
                    <Progress 
                      value={serverMetrics[serverMetrics.length - 1]?.cpu || 0} 
                      color={serverMetrics[serverMetrics.length - 1]?.cpu > 80 ? 'red' : 'blue'}
                    />
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Memory Usage</Text>
                    <Progress 
                      value={serverMetrics[serverMetrics.length - 1]?.memory || 0} 
                      color={serverMetrics[serverMetrics.length - 1]?.memory > 80 ? 'red' : 'blue'}
                    />
                  </div>
                </Stack>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Card>
                <Title order={4} mb="md">Performance Metrics</Title>
                <Group grow>
                  <div>
                    <Text size="sm" c="dimmed">Avg Response Time</Text>
                    <Text size="xl" fw={500}>{averageResponseTime.toFixed(0)}ms</Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed">Error Rate</Text>
                    <Text size="xl" fw={500} c={errorRate > 2 ? 'red' : 'green'}>
                      {errorRate.toFixed(1)}%
                    </Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="hydration" pt="md">
          <Card>
            <Title order={3} mb="md">Hydration Metrics</Title>
            
            <Stack gap="md">
              {hydrationMetrics.length === 0 ? (
                <Text c="dimmed">No hydration events recorded</Text>
              ) : (
                hydrationMetrics.map((metric, index) => (
                  <Alert 
                    key={index} 
                    color={metric.success ? 'green' : 'red'}
                    title={`${metric.component} Hydration`}
                  >
                    <Group>
                      <Text size="sm">Duration: {metric.duration.toFixed(2)}ms</Text>
                      {metric.error && <Text size="sm" c="red">{metric.error}</Text>}
                    </Group>
                  </Alert>
                ))
              )}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="budgets" pt="md">
          <Card>
            <Title order={3} mb="md">Performance Budgets</Title>
            
            <Stack gap="md">
              {performanceBudgets.map((budget, index) => {
                const percentage = (budget.current / budget.budget) * 100;
                const isOverBudget = budget.current > budget.budget;
                const isNearThreshold = budget.current > budget.threshold;
                
                return (
                  <div key={index}>
                    <Group justify="apart" mb="xs">
                      <Text size="sm" fw={500}>{budget.metric}</Text>
                      <Text size="sm" c={isOverBudget ? 'red' : isNearThreshold ? 'yellow' : 'green'}>
                        {budget.current} / {budget.budget}
                      </Text>
                    </Group>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      color={isOverBudget ? 'red' : isNearThreshold ? 'yellow' : 'green'}
                    />
                  </div>
                );
              })}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="alerts" pt="md">
          <Card>
            <Title order={3} mb="md">Active Alerts</Title>
            
            <Stack gap="md">
              {alerts.length === 0 ? (
                <Text c="dimmed">No active alerts</Text>
              ) : (
                alerts.map((alert, index) => (
                  <Alert 
                    key={index} 
                    color={alert.severity === 'critical' ? 'red' : 'yellow'}
                    title={alert.name}
                  >
                    <Group>
                      <Text size="sm">
                        Value: {alert.value?.toFixed?.(2) || alert.value} 
                        (Threshold: {alert.threshold})
                      </Text>
                      <Badge color={alert.status === 'active' ? 'red' : 'green'}>
                        {alert.status}
                      </Badge>
                    </Group>
                  </Alert>
                ))
              )}
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default DemoMonitoringObservability;