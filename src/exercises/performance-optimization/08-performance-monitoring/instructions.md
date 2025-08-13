# Performance Monitoring & Alerting

**Difficulty:** ⭐⭐⭐⭐⭐ (90 minutes)

## Learning Objectives

By completing this exercise, you will:

- Master production performance monitoring with real-time dashboards
- Learn to implement comprehensive alerting systems with performance budgets
- Practice memory profiling and leak detection techniques
- Build network performance analysis and optimization tools
- Understand performance regression detection and continuous monitoring
- Create automated performance reporting and alerting systems

## Background

Staff-level engineers must implement robust performance monitoring systems that provide actionable insights into production application performance. This exercise covers building comprehensive monitoring dashboards, automated alerting systems, and performance regression detection tools used by leading tech companies.

### Key Concepts

1. **Performance Monitoring** - Real-time tracking of Core Web Vitals and custom metrics
2. **Memory Profiling** - Heap analysis, leak detection, and memory optimization
3. **Network Analysis** - Resource timing, bottleneck identification, and optimization
4. **Alerting Systems** - Automated threshold monitoring and incident response
5. **Performance Budgets** - Proactive performance governance and regression prevention

## Performance Monitoring Architecture

### Core Web Vitals Monitoring
```typescript
// Real-time Web Vitals tracking
const observeWebVitals = () => {
  new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      switch (entry.entryType) {
        case 'largest-contentful-paint':
          trackMetric('LCP', entry.startTime);
          break;
        case 'first-input':
          trackMetric('FID', entry.processingStart - entry.startTime);
          break;
        case 'layout-shift':
          if (!entry.hadRecentInput) {
            trackMetric('CLS', entry.value);
          }
          break;
      }
    });
  }).observe({entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift']});
};
```

### Memory Monitoring System
```typescript
const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usage: memory.usedJSHeapSize / memory.jsHeapSizeLimit
    };
  }
  return null;
};
```

### Network Performance Analysis
```typescript
const analyzeNetworkPerformance = () => {
  const navigation = performance.getEntriesByType('navigation')[0];
  const resources = performance.getEntriesByType('resource');
  
  return {
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
    loadComplete: navigation.loadEventEnd - navigation.navigationStart,
    timeToFirstByte: navigation.responseStart - navigation.requestStart,
    resourceCount: resources.length,
    totalTransferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
  };
};
```

## Exercise Tasks

### 1. Core Performance Monitor (25 minutes)

Implement `usePerformanceMonitor` hook for comprehensive performance tracking:

```typescript
function usePerformanceMonitor() {
  // Real-time Core Web Vitals monitoring with PerformanceObserver
  // Custom metric tracking with performance.mark/measure
  // Memory usage monitoring with performance.memory
  // Network timing analysis with PerformanceNavigationTiming
  // Performance budget checking and threshold alerts
  // Historical data collection and trend analysis
}
```

**Key Features:**
- PerformanceObserver integration for LCP, FID, CLS tracking
- Custom performance mark and measure support
- Memory heap monitoring and trend analysis
- Network resource timing collection
- Real-time metric updates with configurable sampling rates

**Advanced Capabilities:**
- Performance budget enforcement with automated alerts
- Regression detection through statistical analysis
- Custom metric aggregation and percentile calculations
- Integration with external monitoring services
- Performance score calculation using industry standards

### 2. Memory Profiler Implementation (20 minutes)

Create `useMemoryProfiler` for memory analysis and leak detection:
- Heap usage monitoring with trend analysis
- Memory leak detection through growth pattern analysis
- Component-level memory attribution tracking
- Garbage collection timing and impact measurement
- Memory optimization recommendations generation

**Memory Analysis Features:**
- Real-time heap size monitoring
- Memory allocation pattern detection
- Leak detection through statistical analysis
- Memory pressure impact on performance
- Automatic cleanup recommendations

### 3. Network Performance Profiler (20 minutes)

Build `useNetworkProfiler` for network optimization analysis:
- Resource loading waterfall visualization
- Network bottleneck identification and analysis
- Cache effectiveness monitoring and optimization
- Bundle size analysis and code splitting recommendations
- CDN performance monitoring and geographic analysis

**Network Analysis Tools:**
- Resource timing waterfall charts
- Critical resource path identification
- Cache hit rate analysis and optimization
- Bundle loading performance metrics
- Network condition adaptation strategies

### 4. Alert Management System (25 minutes)

Implement `useAlertManager` for automated performance alerting:
- Performance budget threshold monitoring
- Multi-severity alert classification system
- Alert deduplication and noise reduction
- Automated incident response and escalation
- Integration with external alerting platforms

**Alerting Features:**
- Configurable alert rules with multiple conditions
- Real-time threshold monitoring and notifications
- Alert acknowledgment and resolution tracking
- Performance regression alerts with trend analysis
- Integration with Slack, PagerDuty, or custom webhooks

## Advanced Challenges

### Real User Monitoring (RUM)
Implement production RUM system:
- User session performance tracking
- Geographic performance analysis
- Device and browser performance correlation
- Business metric correlation with performance
- A/B testing performance impact analysis

### Performance Regression Detection
Build automated regression detection:
- Statistical change point detection
- Performance trend analysis and forecasting
- Automated performance CI/CD gates
- Release performance impact assessment
- Performance budget governance automation

### Advanced Memory Analysis
Create sophisticated memory profiling:
- Component memory leak attribution
- Memory allocation hotspot identification
- Garbage collection optimization analysis
- Memory usage prediction and scaling
- Memory-performance correlation analysis

## Testing Your Implementation

Your solution should demonstrate:

1. **Accurate Monitoring**: Precise Web Vitals measurement and custom metric tracking
2. **Effective Alerting**: Timely alerts for performance degradation with minimal false positives
3. **Memory Insights**: Clear memory usage patterns and leak detection
4. **Network Analysis**: Actionable network optimization recommendations
5. **Production Ready**: Robust error handling and minimal performance overhead

## Success Criteria

- [ ] `usePerformanceMonitor` accurately tracks Core Web Vitals and custom metrics
- [ ] `useMemoryProfiler` detects memory leaks and provides optimization recommendations
- [ ] `useNetworkProfiler` identifies bottlenecks and provides actionable insights
- [ ] `useAlertManager` provides reliable alerting with configurable thresholds
- [ ] Real-time dashboard provides comprehensive performance overview
- [ ] Memory profiling detects leaks within 30 seconds of occurrence
- [ ] Network analysis identifies critical path bottlenecks accurately
- [ ] Alert system maintains <1% false positive rate for threshold violations

## Performance Targets

Your implementation should achieve:

### Monitoring Overhead
- Performance monitoring: <1ms overhead per metric collection
- Memory profiling: <500KB memory overhead for profiling data
- Network analysis: <10ms latency impact on resource loading
- Alert processing: <100ms to evaluate and trigger alerts

### Accuracy Requirements
- Web Vitals measurement: ±5ms accuracy for timing metrics
- Memory tracking: ±1MB accuracy for heap size measurements
- Network timing: ±10ms accuracy for resource loading times
- Alert responsiveness: <30 seconds from threshold breach to notification

### Data Management
- Metric storage: Efficient circular buffer for 24-hour retention
- Memory efficiency: <50MB total memory usage for monitoring system
- Data compression: 10:1 compression ratio for historical metric data
- Export capability: Sub-second data export for performance reports

## Real-world Performance Monitoring Patterns

### Production Monitoring Setup
```typescript
// Enterprise-grade monitoring configuration
const productionMonitoringConfig = {
  coreVitals: {
    lcp: { budget: 2500, alertThreshold: 3000 },
    fid: { budget: 100, alertThreshold: 150 },
    cls: { budget: 0.1, alertThreshold: 0.15 }
  },
  customMetrics: {
    'api-response-time': { budget: 500, alertThreshold: 1000 },
    'component-render-time': { budget: 16, alertThreshold: 32 },
    'bundle-load-time': { budget: 2000, alertThreshold: 3000 }
  },
  memory: {
    heapUsageThreshold: 0.8,
    leakDetectionWindow: 300000, // 5 minutes
    gcPressureThreshold: 10
  },
  network: {
    resourceCountBudget: 100,
    totalSizeBudget: 2048000, // 2MB
    criticalPathBudget: 1500
  },
  alerting: {
    channels: ['webhook', 'console', 'ui'],
    severityLevels: ['low', 'medium', 'high', 'critical'],
    dedupWindow: 300000, // 5 minutes
    escalationRules: {
      criticalThreshold: 2,
      escalationDelay: 900000 // 15 minutes
    }
  }
};
```

### Advanced Memory Profiling
```typescript
// Sophisticated memory leak detection
class MemoryLeakDetector {
  private samples: number[] = [];
  private readonly maxSamples = 100;
  private readonly leakThreshold = 0.05; // 5% growth per minute
  
  addSample(heapSize: number) {
    this.samples.push(heapSize);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }
  
  detectLeak(): { isLeaking: boolean; growthRate: number; severity: string } {
    if (this.samples.length < 10) return { isLeaking: false, growthRate: 0, severity: 'none' };
    
    // Linear regression to detect growth trend
    const n = this.samples.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = this.samples;
    
    const xMean = x.reduce((a, b) => a + b) / n;
    const yMean = y.reduce((a, b) => a + b) / n;
    
    const slope = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0) /
                  x.reduce((sum, xi) => sum + (xi - xMean) ** 2, 0);
    
    const growthRate = slope / yMean; // Normalized growth rate
    const isLeaking = growthRate > this.leakThreshold;
    
    let severity = 'none';
    if (isLeaking) {
      if (growthRate > 0.2) severity = 'critical';
      else if (growthRate > 0.1) severity = 'high';
      else if (growthRate > 0.05) severity = 'medium';
      else severity = 'low';
    }
    
    return { isLeaking, growthRate, severity };
  }
}
```

### Network Performance Analysis
```typescript
// Comprehensive network performance analyzer
class NetworkPerformanceAnalyzer {
  private resourceTimings: PerformanceResourceTiming[] = [];
  
  analyzeLoadingWaterfall() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    // Group resources by loading phase
    const phases = {
      critical: resources.filter(r => r.startTime < 1000), // First second
      important: resources.filter(r => r.startTime >= 1000 && r.startTime < 3000),
      deferred: resources.filter(r => r.startTime >= 3000)
    };
    
    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(resources);
    
    // Calculate optimization opportunities
    const optimizations = this.calculateOptimizations(resources);
    
    return {
      phases,
      bottlenecks,
      optimizations,
      metrics: this.calculateNetworkMetrics(resources)
    };
  }
  
  private identifyBottlenecks(resources: PerformanceResourceTiming[]) {
    return resources
      .filter(r => r.duration > 1000) // Resources taking >1s
      .map(r => ({
        name: r.name,
        duration: r.duration,
        size: r.transferSize,
        type: this.getResourceType(r.name),
        recommendation: this.getBottleneckRecommendation(r)
      }));
  }
  
  private calculateOptimizations(resources: PerformanceResourceTiming[]) {
    const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const compressibleResources = resources.filter(r => 
      ['script', 'stylesheet', 'document'].includes(this.getResourceType(r.name))
    );
    
    return {
      bundleSplitting: this.analyzeBundleSplitting(resources),
      compression: this.analyzeCompressionOpportunities(compressibleResources),
      caching: this.analyzeCachingOpportunities(resources),
      preloading: this.analyzePreloadingOpportunities(resources)
    };
  }
}
```

### Alert Management System
```typescript
// Production-grade alert management
class AlertManager {
  private rules: AlertRule[] = [];
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private alertHistory: PerformanceAlert[] = [];
  
  async evaluateMetric(metric: PerformanceMetric) {
    const applicableRules = this.rules.filter(rule => 
      rule.metric === metric.name && rule.enabled
    );
    
    for (const rule of applicableRules) {
      const violation = this.checkRuleViolation(metric, rule);
      if (violation) {
        await this.triggerAlert(rule, metric.value);
      } else {
        // Check if we should resolve an existing alert
        this.resolveAlert(rule.id);
      }
    }
  }
  
  private checkRuleViolation(metric: PerformanceMetric, rule: AlertRule): boolean {
    switch (rule.condition) {
      case 'above': return metric.value > rule.threshold;
      case 'below': return metric.value < rule.threshold;
      case 'equals': return Math.abs(metric.value - rule.threshold) < 0.01;
      default: return false;
    }
  }
  
  private async triggerAlert(rule: AlertRule, value: number) {
    const alertId = `${rule.id}-${Date.now()}`;
    
    // Check for deduplication
    const existingAlert = this.activeAlerts.get(rule.id);
    if (existingAlert && Date.now() - existingAlert.timestamp < 300000) {
      return; // Don't spam alerts within 5 minutes
    }
    
    const alert: PerformanceAlert = {
      id: alertId,
      rule,
      value,
      timestamp: Date.now(),
      acknowledged: false
    };
    
    this.activeAlerts.set(rule.id, alert);
    this.alertHistory.push(alert);
    
    // Send notifications
    await this.sendNotifications(alert);
  }
  
  private async sendNotifications(alert: PerformanceAlert) {
    const notifications = [];
    
    // Console notification
    notifications.push(this.sendConsoleNotification(alert));
    
    // Webhook notification
    if (this.webhookUrl) {
      notifications.push(this.sendWebhookNotification(alert));
    }
    
    // UI notification
    notifications.push(this.sendUINotification(alert));
    
    await Promise.allSettled(notifications);
  }
}
```

### Performance Dashboard Integration
```typescript
// Real-time performance dashboard
const usePerformanceDashboard = () => {
  const [dashboardState, setDashboardState] = useState({
    coreVitals: { LCP: 0, FID: 0, CLS: 0 },
    customMetrics: {},
    memoryUsage: { current: 0, trend: 'stable' },
    networkPerformance: { requests: 0, totalSize: 0, avgDuration: 0 },
    alerts: { active: 0, critical: 0 },
    performanceScore: 0
  });
  
  const calculatePerformanceScore = useCallback((metrics) => {
    // Lighthouse-style scoring algorithm
    const weights = { LCP: 0.25, FID: 0.25, CLS: 0.25, TTI: 0.25 };
    let score = 0;
    
    // LCP scoring (0-100 scale)
    const lcpScore = metrics.LCP <= 2500 ? 100 : 
                    metrics.LCP <= 4000 ? 90 - ((metrics.LCP - 2500) / 1500) * 40 : 50;
    
    // FID scoring
    const fidScore = metrics.FID <= 100 ? 100 :
                    metrics.FID <= 300 ? 90 - ((metrics.FID - 100) / 200) * 40 : 50;
    
    // CLS scoring
    const clsScore = metrics.CLS <= 0.1 ? 100 :
                    metrics.CLS <= 0.25 ? 90 - ((metrics.CLS - 0.1) / 0.15) * 40 : 50;
    
    score = lcpScore * weights.LCP + fidScore * weights.FID + clsScore * weights.CLS;
    
    return Math.round(score);
  }, []);
  
  return {
    dashboardState,
    calculatePerformanceScore,
    updateMetrics: setDashboardState
  };
};
```

## Production Deployment Considerations

### Monitoring Strategy
- Implement progressive monitoring rollout to avoid performance impact
- Use sampling for high-traffic applications to reduce overhead
- Configure appropriate data retention policies for historical analysis
- Set up monitoring redundancy with multiple data collection points

### Alert Configuration
- Start with conservative thresholds and adjust based on baseline data
- Implement alert escalation policies for different severity levels
- Use alert correlation to reduce noise and identify related issues
- Configure appropriate notification channels for different team roles

### Data Management
- Implement efficient data aggregation for long-term storage
- Use compression and archival strategies for historical data
- Configure data export capabilities for external analysis tools
- Ensure GDPR compliance for user performance data collection

### Integration Considerations
- Connect monitoring system with existing observability infrastructure
- Implement performance data correlation with business metrics
- Set up automated performance regression detection in CI/CD pipelines
- Configure integration with incident management and on-call systems

Remember: Performance monitoring is about enabling data-driven optimization decisions. Focus on actionable metrics that directly impact user experience and business outcomes.