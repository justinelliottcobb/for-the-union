# Exercise 09: Risk Management Interfaces

## 🎯 Learning Objectives

By the end of this exercise, you will be able to:

1. **Build comprehensive risk assessment systems** with portfolio analysis and risk metrics calculation
2. **Implement advanced portfolio analyzers** with correlation analysis and diversification metrics
3. **Create intelligent alert systems** with real-time monitoring and automated notifications
4. **Develop position limit managers** with dynamic risk controls and automated enforcement
5. **Design VaR calculators** with Monte Carlo simulation and stress testing capabilities

## 📋 Pre-requisites

Before starting this exercise, you should have completed:

- Exercise 05: Trading Interface Patterns
- Exercise 07: Web3 Security Patterns
- Understanding of financial risk management concepts
- Knowledge of statistical analysis and portfolio theory
- Familiarity with Value at Risk (VaR) calculations

## 📚 Introduction

Risk management is critical for institutional crypto trading and portfolio management. This exercise teaches you to build sophisticated risk management systems including portfolio analysis, automated alerts, position limits, VaR calculations, stress testing, and automated risk controls to protect capital and ensure regulatory compliance.

## 🛠️ Setup

You'll implement a comprehensive risk management platform:

### Core Components

1. **RiskAssessment**: Real-time risk scoring and analysis engine
2. **PortfolioAnalyzer**: Advanced portfolio metrics and correlation analysis
3. **AlertSystem**: Intelligent monitoring with configurable notifications
4. **LimitManager**: Dynamic position sizing and exposure controls

### Key Features

- Real-time risk monitoring and scoring
- VaR calculations with multiple methodologies
- Stress testing and scenario analysis
- Correlation and concentration analysis
- Automated risk controls and circuit breakers
- Risk reporting and analytics dashboards

## 📝 Instructions

### Step 1: Implement RiskAssessment Component

Create comprehensive risk analysis engine:

```typescript
interface RiskMetrics {
  portfolioVaR: number; // Value at Risk
  portfolioVar95: number; // 95% confidence VaR
  portfolioVar99: number; // 99% confidence VaR
  expectedShortfall: number; // Conditional VaR
  maxDrawdown: number;
  volatility: number;
  sharpeRatio: number;
  calmarRatio: number;
  beta: number;
  alpha: number;
  trackingError: number;
  informationRatio: number;
}

interface Position {
  asset: string;
  quantity: number;
  price: number;
  value: number;
  weight: number;
  dailyReturn?: number;
  volatility?: number;
  beta?: number;
}

interface PortfolioSnapshot {
  timestamp: number;
  totalValue: number;
  positions: Position[];
  cash: number;
  leverage: number;
  riskMetrics: RiskMetrics;
}

class RiskAssessment {
  private historicalData = new Map<string, number[]>();
  private correlationMatrix = new Map<string, Map<string, number>>();
  
  async calculatePortfolioRisk(positions: Position[]): Promise<RiskMetrics> {
    // Calculate individual asset metrics
    const assetMetrics = await this.calculateAssetMetrics(positions);
    
    // Build correlation matrix
    await this.updateCorrelationMatrix(positions.map(p => p.asset));
    
    // Calculate portfolio-level metrics
    const portfolioVolatility = this.calculatePortfolioVolatility(positions);
    const portfolioVaR = this.calculateVaR(positions, 0.95);
    const portfolioVar99 = this.calculateVaR(positions, 0.99);
    const expectedShortfall = this.calculateExpectedShortfall(positions, 0.95);
    const maxDrawdown = await this.calculateMaxDrawdown(positions);
    const sharpeRatio = this.calculateSharpeRatio(positions);
    
    return {
      portfolioVaR,
      portfolioVar95: portfolioVaR,
      portfolioVar99,
      expectedShortfall,
      maxDrawdown,
      volatility: portfolioVolatility,
      sharpeRatio,
      calmarRatio: sharpeRatio / Math.abs(maxDrawdown),
      beta: this.calculatePortfolioBeta(positions),
      alpha: this.calculatePortfolioAlpha(positions),
      trackingError: this.calculateTrackingError(positions),
      informationRatio: this.calculateInformationRatio(positions)
    };
  }
  
  private calculateVaR(positions: Position[], confidence: number): number {
    // Historical simulation method
    const portfolioReturns = this.getPortfolioReturns(positions);
    
    if (portfolioReturns.length < 100) {
      throw new Error('Insufficient historical data for VaR calculation');
    }
    
    // Sort returns in ascending order
    const sortedReturns = portfolioReturns.sort((a, b) => a - b);
    
    // Find VaR at specified confidence level
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    return Math.abs(sortedReturns[index]);
  }
  
  private calculateExpectedShortfall(positions: Position[], confidence: number): number {
    const portfolioReturns = this.getPortfolioReturns(positions);
    const sortedReturns = portfolioReturns.sort((a, b) => a - b);
    const varIndex = Math.floor((1 - confidence) * sortedReturns.length);
    
    // Average of all returns worse than VaR
    const tailReturns = sortedReturns.slice(0, varIndex);
    const expectedShortfall = tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
    
    return Math.abs(expectedShortfall);
  }
  
  private calculatePortfolioVolatility(positions: Position[]): number {
    const portfolioReturns = this.getPortfolioReturns(positions);
    const mean = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length;
    
    const variance = portfolioReturns.reduce((sum, ret) => {
      return sum + Math.pow(ret - mean, 2);
    }, 0) / (portfolioReturns.length - 1);
    
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized
  }
  
  async runMonteCarloSimulation(
    positions: Position[],
    scenarios: number = 10000,
    timeHorizon: number = 1
  ): Promise<{
    scenarios: number[];
    var95: number;
    var99: number;
    expectedReturn: number;
    worstCase: number;
    bestCase: number;
  }> {
    const simulatedReturns: number[] = [];
    
    for (let i = 0; i < scenarios; i++) {
      const scenarioReturn = this.simulateScenario(positions, timeHorizon);
      simulatedReturns.push(scenarioReturn);
    }
    
    simulatedReturns.sort((a, b) => a - b);
    
    return {
      scenarios: simulatedReturns,
      var95: Math.abs(simulatedReturns[Math.floor(0.05 * scenarios)]),
      var99: Math.abs(simulatedReturns[Math.floor(0.01 * scenarios)]),
      expectedReturn: simulatedReturns.reduce((sum, ret) => sum + ret, 0) / scenarios,
      worstCase: simulatedReturns[0],
      bestCase: simulatedReturns[simulatedReturns.length - 1]
    };
  }
  
  private simulateScenario(positions: Position[], timeHorizon: number): number {
    let portfolioReturn = 0;
    
    for (const position of positions) {
      // Generate random return using normal distribution
      const mean = position.dailyReturn || 0;
      const volatility = position.volatility || 0.02;
      
      const randomReturn = this.generateNormalRandom(mean * timeHorizon, volatility * Math.sqrt(timeHorizon));
      portfolioReturn += position.weight * randomReturn;
    }
    
    return portfolioReturn;
  }
  
  private generateNormalRandom(mean: number, stdDev: number): number {
    // Box-Muller transformation
    const u1 = Math.random();
    const u2 = Math.random();
    
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z;
  }
}
```

Key implementation points:
- Multiple VaR calculation methodologies
- Monte Carlo simulation for scenario analysis
- Correlation analysis for portfolio risk
- Real-time risk metric updates
- Stress testing capabilities

### Step 2: Build PortfolioAnalyzer

Create advanced portfolio analysis and optimization tools:

```typescript
interface PortfolioAnalysis {
  concentrationRisk: {
    herfindahlIndex: number;
    maxWeight: number;
    topHoldings: Array<{ asset: string; weight: number }>;
  };
  diversificationMetrics: {
    effectiveAssets: number;
    diversificationRatio: number;
    correlationScore: number;
  };
  performanceMetrics: {
    returns: {
      daily: number;
      weekly: number;
      monthly: number;
      quarterly: number;
      yearly: number;
      inception: number;
    };
    riskAdjustedReturns: {
      sharpe: number;
      sortino: number;
      calmar: number;
      omega: number;
    };
  };
  attributionAnalysis: {
    assetAllocation: number;
    security: number;
    interaction: number;
    total: number;
  };
}

class PortfolioAnalyzer {
  private benchmarkReturns: number[] = [];
  private riskFreeRate: number = 0.02; // 2% annual
  
  constructor(benchmarkData?: number[]) {
    this.benchmarkReturns = benchmarkData || [];
  }
  
  async analyzePortfolio(
    positions: Position[],
    historicalSnapshots: PortfolioSnapshot[]
  ): Promise<PortfolioAnalysis> {
    const concentrationRisk = this.analyzeConcentration(positions);
    const diversificationMetrics = await this.analyzeDiversification(positions);
    const performanceMetrics = this.analyzePerformance(historicalSnapshots);
    const attributionAnalysis = this.performAttributionAnalysis(positions, historicalSnapshots);
    
    return {
      concentrationRisk,
      diversificationMetrics,
      performanceMetrics,
      attributionAnalysis
    };
  }
  
  private analyzeConcentration(positions: Position[]): any {
    // Calculate Herfindahl-Hirschman Index
    const herfindahlIndex = positions.reduce((sum, pos) => {
      return sum + Math.pow(pos.weight, 2);
    }, 0);
    
    // Find maximum weight
    const maxWeight = Math.max(...positions.map(p => p.weight));
    
    // Get top 5 holdings
    const topHoldings = positions
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map(p => ({ asset: p.asset, weight: p.weight }));
    
    return {
      herfindahlIndex,
      maxWeight,
      topHoldings
    };
  }
  
  private async analyzeDiversification(positions: Position[]): Promise<any> {
    // Calculate effective number of assets
    const effectiveAssets = 1 / positions.reduce((sum, pos) => {
      return sum + Math.pow(pos.weight, 2);
    }, 0);
    
    // Calculate diversification ratio
    const weightedVolatilities = positions.reduce((sum, pos) => {
      return sum + pos.weight * (pos.volatility || 0);
    }, 0);
    
    const portfolioVolatility = this.calculatePortfolioVolatility(positions);
    const diversificationRatio = weightedVolatilities / portfolioVolatility;
    
    // Calculate average correlation
    const correlationScore = await this.calculateAverageCorrelation(positions);
    
    return {
      effectiveAssets,
      diversificationRatio,
      correlationScore
    };
  }
  
  optimizePortfolio(
    expectedReturns: number[],
    covarianceMatrix: number[][],
    constraints: {
      minWeights?: number[];
      maxWeights?: number[];
      targetReturn?: number;
      maxRisk?: number;
    }
  ): Promise<{
    weights: number[];
    expectedReturn: number;
    expectedRisk: number;
    sharpeRatio: number;
  }> {
    // Implement mean-variance optimization
    // This would typically use quadratic programming
    // For demonstration, we'll use a simplified approach
    
    return this.meanVarianceOptimization(expectedReturns, covarianceMatrix, constraints);
  }
  
  private async meanVarianceOptimization(
    expectedReturns: number[],
    covarianceMatrix: number[][],
    constraints: any
  ): Promise<any> {
    // Simplified optimization - in practice use libraries like cvxopt or similar
    const numAssets = expectedReturns.length;
    
    // Equal weight as starting point
    let weights = new Array(numAssets).fill(1 / numAssets);
    
    // Apply constraints
    if (constraints.maxWeights) {
      weights = weights.map((w, i) => Math.min(w, constraints.maxWeights[i]));
    }
    
    if (constraints.minWeights) {
      weights = weights.map((w, i) => Math.max(w, constraints.minWeights[i]));
    }
    
    // Normalize weights
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    weights = weights.map(w => w / totalWeight);
    
    // Calculate portfolio metrics
    const expectedReturn = weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0);
    const expectedRisk = this.calculatePortfolioRisk(weights, covarianceMatrix);
    const sharpeRatio = (expectedReturn - this.riskFreeRate) / expectedRisk;
    
    return {
      weights,
      expectedReturn,
      expectedRisk,
      sharpeRatio
    };
  }
  
  generateEfficientFrontier(
    expectedReturns: number[],
    covarianceMatrix: number[][],
    numPoints: number = 50
  ): Promise<Array<{ return: number; risk: number; weights: number[] }>> {
    // Generate efficient frontier points
    const minReturn = Math.min(...expectedReturns);
    const maxReturn = Math.max(...expectedReturns);
    
    const points = [];
    
    for (let i = 0; i < numPoints; i++) {
      const targetReturn = minReturn + (i / (numPoints - 1)) * (maxReturn - minReturn);
      
      // Optimize for minimum risk at target return
      const result = this.optimizeForTargetReturn(expectedReturns, covarianceMatrix, targetReturn);
      points.push(result);
    }
    
    return Promise.resolve(points);
  }
}
```

### Step 3: Create AlertSystem

Implement intelligent monitoring and notification system:

```typescript
interface RiskAlert {
  id: string;
  type: 'var_breach' | 'concentration_risk' | 'correlation_spike' | 'drawdown_limit' | 'volatility_spike';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  threshold: number;
  currentValue: number;
  timestamp: number;
  asset?: string;
  action?: 'reduce_position' | 'hedge' | 'liquidate' | 'review';
  acknowledged: boolean;
}

interface AlertRule {
  id: string;
  name: string;
  type: RiskAlert['type'];
  enabled: boolean;
  threshold: number;
  severity: RiskAlert['severity'];
  condition: 'greater_than' | 'less_than' | 'equals' | 'percentage_change';
  lookbackPeriod?: number; // in minutes
  cooldownPeriod?: number; // minimum time between alerts
}

class AlertSystem {
  private alerts: RiskAlert[] = [];
  private rules: AlertRule[] = [];
  private lastAlertTime = new Map<string, number>();
  private subscribers = new Map<string, Function[]>();
  
  constructor() {
    this.initializeDefaultRules();
  }
  
  private initializeDefaultRules() {
    this.rules = [
      {
        id: 'var-breach-critical',
        name: 'VaR Breach Critical',
        type: 'var_breach',
        enabled: true,
        threshold: 0.05, // 5%
        severity: 'critical',
        condition: 'greater_than',
        cooldownPeriod: 30 * 60 * 1000 // 30 minutes
      },
      {
        id: 'concentration-high',
        name: 'High Concentration Risk',
        type: 'concentration_risk',
        enabled: true,
        threshold: 0.25, // 25% max position
        severity: 'warning',
        condition: 'greater_than',
        cooldownPeriod: 60 * 60 * 1000 // 1 hour
      },
      {
        id: 'volatility-spike',
        name: 'Volatility Spike',
        type: 'volatility_spike',
        enabled: true,
        threshold: 0.5, // 50% increase
        severity: 'warning',
        condition: 'percentage_change',
        lookbackPeriod: 24 * 60 * 60 * 1000, // 24 hours
        cooldownPeriod: 15 * 60 * 1000 // 15 minutes
      }
    ];
  }
  
  async checkRisks(portfolioSnapshot: PortfolioSnapshot): Promise<RiskAlert[]> {
    const newAlerts: RiskAlert[] = [];
    
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      
      // Check cooldown period
      const lastAlert = this.lastAlertTime.get(rule.id);
      if (lastAlert && Date.now() - lastAlert < (rule.cooldownPeriod || 0)) {
        continue;
      }
      
      const alert = await this.evaluateRule(rule, portfolioSnapshot);
      if (alert) {
        newAlerts.push(alert);
        this.lastAlertTime.set(rule.id, Date.now());
      }
    }
    
    // Add new alerts
    this.alerts.push(...newAlerts);
    
    // Notify subscribers
    for (const alert of newAlerts) {
      this.notifySubscribers(alert.type, alert);
    }
    
    return newAlerts;
  }
  
  private async evaluateRule(rule: AlertRule, snapshot: PortfolioSnapshot): Promise<RiskAlert | null> {
    let currentValue: number;
    let shouldAlert = false;
    
    switch (rule.type) {
      case 'var_breach':
        currentValue = snapshot.riskMetrics.portfolioVaR;
        shouldAlert = this.evaluateCondition(currentValue, rule.threshold, rule.condition);
        break;
        
      case 'concentration_risk':
        currentValue = Math.max(...snapshot.positions.map(p => p.weight));
        shouldAlert = this.evaluateCondition(currentValue, rule.threshold, rule.condition);
        break;
        
      case 'volatility_spike':
        currentValue = snapshot.riskMetrics.volatility;
        // For percentage change, we need historical data
        shouldAlert = await this.checkVolatilitySpike(currentValue, rule);
        break;
        
      case 'drawdown_limit':
        currentValue = Math.abs(snapshot.riskMetrics.maxDrawdown);
        shouldAlert = this.evaluateCondition(currentValue, rule.threshold, rule.condition);
        break;
        
      default:
        return null;
    }
    
    if (!shouldAlert) return null;
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: rule.type,
      severity: rule.severity,
      title: this.generateAlertTitle(rule.type, currentValue),
      description: this.generateAlertDescription(rule, currentValue),
      threshold: rule.threshold,
      currentValue,
      timestamp: Date.now(),
      action: this.suggestAction(rule.type, currentValue, rule.threshold),
      acknowledged: false
    };
  }
  
  private evaluateCondition(value: number, threshold: number, condition: AlertRule['condition']): boolean {
    switch (condition) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return Math.abs(value - threshold) < 0.001;
      default:
        return false;
    }
  }
  
  private suggestAction(type: RiskAlert['type'], currentValue: number, threshold: number): RiskAlert['action'] {
    const exceedance = currentValue / threshold;
    
    switch (type) {
      case 'var_breach':
        return exceedance > 2 ? 'liquidate' : 'reduce_position';
      case 'concentration_risk':
        return 'reduce_position';
      case 'volatility_spike':
        return exceedance > 1.5 ? 'hedge' : 'review';
      default:
        return 'review';
    }
  }
  
  subscribe(alertType: string, callback: Function): void {
    if (!this.subscribers.has(alertType)) {
      this.subscribers.set(alertType, []);
    }
    this.subscribers.get(alertType)!.push(callback);
  }
  
  private notifySubscribers(alertType: string, alert: RiskAlert): void {
    const callbacks = this.subscribers.get(alertType) || [];
    const allCallbacks = this.subscribers.get('all') || [];
    
    [...callbacks, ...allCallbacks].forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }
  
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }
  
  getActiveAlerts(severity?: RiskAlert['severity']): RiskAlert[] {
    let activeAlerts = this.alerts.filter(a => !a.acknowledged);
    
    if (severity) {
      activeAlerts = activeAlerts.filter(a => a.severity === severity);
    }
    
    return activeAlerts.sort((a, b) => b.timestamp - a.timestamp);
  }
}
```

### Step 4: Implement LimitManager

Create dynamic position sizing and exposure controls:

```typescript
interface PositionLimit {
  id: string;
  asset?: string; // If null, applies to entire portfolio
  category?: string; // 'crypto', 'defi', 'nft', etc.
  type: 'absolute' | 'percentage' | 'var_based' | 'correlation_based';
  value: number;
  enabled: boolean;
  breachAction: 'warn' | 'block' | 'auto_reduce';
  lastUpdated: number;
}

interface ExposureLimit {
  id: string;
  name: string;
  description: string;
  limits: PositionLimit[];
  overrideAllowed: boolean;
  overrideRequiresApproval: boolean;
}

class LimitManager {
  private limits: Map<string, PositionLimit> = new Map();
  private exposureLimits: Map<string, ExposureLimit> = new Map();
  private overrides: Map<string, { timestamp: number; reason: string; approver?: string }> = new Map();
  
  constructor() {
    this.initializeDefaultLimits();
  }
  
  private initializeDefaultLimits() {
    // Portfolio-level limits
    this.addLimit({
      id: 'portfolio-leverage',
      type: 'absolute',
      value: 3, // 3x max leverage
      enabled: true,
      breachAction: 'block',
      lastUpdated: Date.now()
    });
    
    this.addLimit({
      id: 'single-asset-max',
      type: 'percentage',
      value: 0.20, // 20% max per asset
      enabled: true,
      breachAction: 'warn',
      lastUpdated: Date.now()
    });
    
    // Category limits
    this.addLimit({
      id: 'defi-exposure',
      category: 'defi',
      type: 'percentage',
      value: 0.30, // 30% max DeFi exposure
      enabled: true,
      breachAction: 'warn',
      lastUpdated: Date.now()
    });
    
    // VaR-based limit
    this.addLimit({
      id: 'portfolio-var',
      type: 'var_based',
      value: 0.05, // 5% daily VaR limit
      enabled: true,
      breachAction: 'auto_reduce',
      lastUpdated: Date.now()
    });
  }
  
  addLimit(limit: Omit<PositionLimit, 'id'> & { id?: string }): string {
    const id = limit.id || Math.random().toString(36).substr(2, 9);
    const fullLimit: PositionLimit = {
      ...limit,
      id,
      lastUpdated: Date.now()
    };
    
    this.limits.set(id, fullLimit);
    return id;
  }
  
  async checkLimits(
    proposedPosition: Position,
    currentPortfolio: Position[],
    riskMetrics: RiskMetrics
  ): Promise<{
    allowed: boolean;
    violations: Array<{
      limitId: string;
      currentValue: number;
      limitValue: number;
      action: PositionLimit['breachAction'];
    }>;
    suggestedSize?: number;
  }> {
    const violations = [];
    let allowed = true;
    let suggestedSize: number | undefined;
    
    // Create hypothetical portfolio with proposed position
    const hypotheticalPortfolio = this.updatePortfolio(currentPortfolio, proposedPosition);
    
    for (const [limitId, limit] of this.limits) {
      if (!limit.enabled) continue;
      
      // Check if override is active
      if (this.overrides.has(limitId)) {
        const override = this.overrides.get(limitId)!;
        if (Date.now() - override.timestamp < 24 * 60 * 60 * 1000) { // 24 hour override
          continue;
        } else {
          this.overrides.delete(limitId); // Expired override
        }
      }
      
      const violation = await this.checkLimit(limit, hypotheticalPortfolio, riskMetrics, proposedPosition);
      
      if (violation) {
        violations.push(violation);
        
        if (limit.breachAction === 'block') {
          allowed = false;
        } else if (limit.breachAction === 'auto_reduce') {
          // Calculate suggested position size
          suggestedSize = this.calculateMaxAllowedSize(limit, currentPortfolio, proposedPosition);
        }
      }
    }
    
    return {
      allowed,
      violations,
      suggestedSize
    };
  }
  
  private async checkLimit(
    limit: PositionLimit,
    portfolio: Position[],
    riskMetrics: RiskMetrics,
    proposedPosition: Position
  ): Promise<any> {
    let currentValue: number;
    
    switch (limit.type) {
      case 'absolute':
        // Check leverage or absolute exposure
        if (limit.id === 'portfolio-leverage') {
          const totalValue = portfolio.reduce((sum, p) => sum + Math.abs(p.value), 0);
          const equity = portfolio.reduce((sum, p) => sum + p.value, 0);
          currentValue = totalValue / equity;
        } else {
          currentValue = Math.abs(proposedPosition.value);
        }
        break;
        
      case 'percentage':
        const portfolioValue = portfolio.reduce((sum, p) => sum + Math.abs(p.value), 0);
        
        if (limit.asset) {
          // Single asset limit
          const assetPosition = portfolio.find(p => p.asset === limit.asset);
          currentValue = assetPosition ? Math.abs(assetPosition.value) / portfolioValue : 0;
        } else if (limit.category) {
          // Category limit
          const categoryValue = this.getCategoryValue(portfolio, limit.category);
          currentValue = categoryValue / portfolioValue;
        } else {
          // Individual position as % of portfolio
          currentValue = Math.abs(proposedPosition.value) / portfolioValue;
        }
        break;
        
      case 'var_based':
        currentValue = riskMetrics.portfolioVaR;
        break;
        
      case 'correlation_based':
        // Check correlation with existing positions
        currentValue = await this.calculateCorrelationRisk(portfolio, proposedPosition);
        break;
        
      default:
        return null;
    }
    
    if (currentValue > limit.value) {
      return {
        limitId: limit.id,
        currentValue,
        limitValue: limit.value,
        action: limit.breachAction
      };
    }
    
    return null;
  }
  
  private calculateMaxAllowedSize(
    limit: PositionLimit,
    currentPortfolio: Position[],
    proposedPosition: Position
  ): number {
    switch (limit.type) {
      case 'percentage':
        const portfolioValue = currentPortfolio.reduce((sum, p) => sum + Math.abs(p.value), 0);
        const maxValue = portfolioValue * limit.value;
        return maxValue / proposedPosition.price;
        
      case 'var_based':
        // This would require complex calculation - simplified for demo
        return proposedPosition.quantity * 0.5; // 50% of requested size
        
      default:
        return proposedPosition.quantity * 0.8; // 80% of requested size
    }
  }
  
  async performStressTest(
    portfolio: Position[],
    scenarios: Array<{ name: string; shocks: Map<string, number> }>
  ): Promise<{
    results: Array<{
      scenario: string;
      portfolioValue: number;
      totalReturn: number;
      maxDrawdown: number;
      limitBreaches: string[];
    }>;
    worstCase: {
      scenario: string;
      loss: number;
      breaches: string[];
    };
  }> {
    const results = [];
    let worstLoss = 0;
    let worstScenario = '';
    let worstBreaches: string[] = [];
    
    for (const scenario of scenarios) {
      const stressedPortfolio = this.applyStressScenario(portfolio, scenario.shocks);
      const portfolioValue = stressedPortfolio.reduce((sum, p) => sum + p.value, 0);
      const originalValue = portfolio.reduce((sum, p) => sum + p.value, 0);
      const totalReturn = (portfolioValue - originalValue) / originalValue;
      
      // Check which limits would be breached
      const breaches = await this.checkStressBreaches(stressedPortfolio);
      
      results.push({
        scenario: scenario.name,
        portfolioValue,
        totalReturn,
        maxDrawdown: Math.min(0, totalReturn),
        limitBreaches: breaches
      });
      
      if (totalReturn < worstLoss) {
        worstLoss = totalReturn;
        worstScenario = scenario.name;
        worstBreaches = breaches;
      }
    }
    
    return {
      results,
      worstCase: {
        scenario: worstScenario,
        loss: worstLoss,
        breaches: worstBreaches
      }
    };
  }
  
  private applyStressScenario(portfolio: Position[], shocks: Map<string, number>): Position[] {
    return portfolio.map(position => {
      const shock = shocks.get(position.asset) || 0;
      const newPrice = position.price * (1 + shock);
      
      return {
        ...position,
        price: newPrice,
        value: position.quantity * newPrice
      };
    });
  }
}
```

## 💡 Hints

### Advanced Risk Calculations

```typescript
// Black-Scholes for options risk
const calculateOptionsRisk = (
  spot: number,
  strike: number,
  timeToExpiry: number,
  volatility: number,
  riskFreeRate: number,
  optionType: 'call' | 'put'
): { delta: number; gamma: number; theta: number; vega: number } => {
  const d1 = (Math.log(spot / strike) + (riskFreeRate + 0.5 * volatility * volatility) * timeToExpiry) / 
             (volatility * Math.sqrt(timeToExpiry));
  const d2 = d1 - volatility * Math.sqrt(timeToExpiry);
  
  const Nd1 = normalCDF(d1);
  const Nd2 = normalCDF(d2);
  const nd1 = normalPDF(d1);
  
  const delta = optionType === 'call' ? Nd1 : Nd1 - 1;
  const gamma = nd1 / (spot * volatility * Math.sqrt(timeToExpiry));
  const theta = optionType === 'call' ? 
    (-spot * nd1 * volatility / (2 * Math.sqrt(timeToExpiry)) - riskFreeRate * strike * Math.exp(-riskFreeRate * timeToExpiry) * Nd2) / 365 :
    (-spot * nd1 * volatility / (2 * Math.sqrt(timeToExpiry)) + riskFreeRate * strike * Math.exp(-riskFreeRate * timeToExpiry) * (1 - Nd2)) / 365;
  const vega = spot * nd1 * Math.sqrt(timeToExpiry) / 100;
  
  return { delta, gamma, theta, vega };
};
```

## 🔍 Debugging Tips

1. **VaR Validation**: Compare multiple VaR methodologies
2. **Backtesting**: Test risk models against historical data
3. **Stress Testing**: Validate models under extreme scenarios
4. **Alert Tuning**: Adjust thresholds to minimize false positives
5. **Performance**: Optimize calculations for real-time usage

## ✅ Checklist

Before submitting your solution, ensure:

- [ ] Risk assessment calculates comprehensive metrics
- [ ] Portfolio analyzer provides detailed insights
- [ ] Alert system monitors all risk factors
- [ ] Limit manager enforces position controls
- [ ] VaR calculations use proper methodologies
- [ ] Stress testing covers extreme scenarios
- [ ] Real-time monitoring updates efficiently
- [ ] User interfaces display risk clearly
- [ ] Automated controls prevent breaches
- [ ] Risk reports generate accurately

## 🚀 Extensions

Once you've completed the basic requirements, try:

1. **Machine Learning**: Implement ML-based risk prediction
2. **Options Risk**: Add Greeks calculation and options strategies
3. **Credit Risk**: Implement counterparty risk assessment
4. **Liquidity Risk**: Add market impact and liquidity metrics
5. **RegTech**: Integrate with regulatory reporting systems

## 📚 Resources

- [Risk Management Theory](https://www.investopedia.com/terms/r/riskmanagement.asp)
- [VaR Methodologies](https://www.risk.net/definition/value-at-risk-var)
- [Portfolio Theory](https://www.investopedia.com/terms/m/modernportfoliotheory.asp)
- [Monte Carlo Methods](https://en.wikipedia.org/wiki/Monte_Carlo_method)
- [Stress Testing Guidelines](https://www.bis.org/publ/bcbs238.htm)
- [Risk Metrics Documentation](https://www.msci.com/www/research-paper/research-insight-portfolio/0224974153)