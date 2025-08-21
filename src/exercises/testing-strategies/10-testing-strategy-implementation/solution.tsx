import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Card, Text, Group, Stack, Badge, Progress, Alert, Tabs, TextInput, NumberInput, Select } from '@mantine/core';

// ===== TESTING PYRAMID STRATEGY DESIGN =====

interface TestingPyramidLayer {
  id: string;
  name: string;
  percentage: number;
  cost: number;
  speed: number;
  confidence: number;
  description: string;
  recommended: number;
  current: number;
  tools: string[];
}

interface PyramidStrategy {
  layers: TestingPyramidLayer[];
  maturity: number;
  antiPatterns: string[];
  recommendations: string[];
}

// Testing Pyramid - Strategic Testing Framework
const TestingPyramid: React.FC = () => {
  const [strategy, setStrategy] = useState<PyramidStrategy>({
    layers: [
      {
        id: 'unit',
        name: 'Unit Tests',
        percentage: 70,
        cost: 1,
        speed: 10,
        confidence: 6,
        description: 'Fast, isolated tests for individual functions and components',
        recommended: 70,
        current: 45,
        tools: ['Jest', 'Vitest', 'React Testing Library']
      },
      {
        id: 'integration',
        name: 'Integration Tests',
        percentage: 20,
        cost: 3,
        speed: 5,
        confidence: 8,
        description: 'Tests for component interactions and API integration',
        recommended: 20,
        current: 35,
        tools: ['Testing Library', 'MSW', 'Cypress']
      },
      {
        id: 'e2e',
        name: 'End-to-End Tests',
        percentage: 10,
        cost: 10,
        speed: 1,
        confidence: 10,
        description: 'Full user journey tests through the complete application',
        recommended: 10,
        current: 20,
        tools: ['Playwright', 'Cypress', 'Selenium']
      }
    ],
    maturity: 0,
    antiPatterns: [],
    recommendations: []
  });

  const [analysis, setAnalysis] = useState<any>(null);

  const analyzeStrategy = useCallback(() => {
    const currentTotal = strategy.layers.reduce((sum, layer) => sum + layer.current, 0);
    const recommendedTotal = strategy.layers.reduce((sum, layer) => sum + layer.recommended, 0);

    const deviations = strategy.layers.map(layer => ({
      layer: layer.name,
      deviation: Math.abs(layer.current - layer.recommended),
      direction: layer.current > layer.recommended ? 'too high' : 'too low'
    }));

    const antiPatterns = [];
    if (strategy.layers.find(l => l.id === 'e2e')?.current > 30) {
      antiPatterns.push('Ice Cream Cone Anti-pattern: Too many E2E tests');
    }
    if (strategy.layers.find(l => l.id === 'unit')?.current < 40) {
      antiPatterns.push('Inverted Pyramid: Not enough unit tests');
    }

    const recommendations = [];
    if (deviations.some(d => d.deviation > 15)) {
      recommendations.push('Rebalance test distribution according to pyramid principles');
    }
    if (antiPatterns.length > 0) {
      recommendations.push('Address anti-patterns to improve test efficiency');
    }

    const maturity = Math.max(0, 100 - deviations.reduce((sum, d) => sum + d.deviation, 0));

    setAnalysis({
      deviations,
      antiPatterns,
      recommendations,
      maturity: Math.round(maturity),
      efficiency: Math.round(maturity * 0.8),
      cost: strategy.layers.reduce((sum, layer) => sum + (layer.current * layer.cost), 0)
    });

    setStrategy(prev => ({
      ...prev,
      maturity: Math.round(maturity),
      antiPatterns,
      recommendations
    }));
  }, [strategy]);

  const optimizePyramid = useCallback(() => {
    const optimized = strategy.layers.map(layer => ({
      ...layer,
      current: layer.recommended
    }));

    setStrategy(prev => ({
      ...prev,
      layers: optimized
    }));

    // Re-analyze after optimization
    setTimeout(analyzeStrategy, 100);
  }, [strategy.layers, analyzeStrategy]);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>Testing Pyramid Strategy</Text>
          <Group>
            <Button onClick={analyzeStrategy} size="sm">
              Analyze Strategy
            </Button>
            <Button onClick={optimizePyramid} variant="light" size="sm">
              Optimize
            </Button>
          </Group>
        </Group>

        {strategy.layers.map((layer, index) => (
          <Card key={index} withBorder>
            <Group justify="apart" mb="md">
              <Text fw={500}>{layer.name}</Text>
              <Group>
                <Badge variant="light">
                  Current: {layer.current}%
                </Badge>
                <Badge color="blue">
                  Recommended: {layer.recommended}%
                </Badge>
              </Group>
            </Group>

            <Text size="sm" c="dimmed" mb="md">
              {layer.description}
            </Text>

            <Group mb="sm">
              <div>
                <Text size="xs" c="dimmed">Cost Factor</Text>
                <Text size="sm">{layer.cost}x</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Speed</Text>
                <Text size="sm">{layer.speed}/10</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Confidence</Text>
                <Text size="sm">{layer.confidence}/10</Text>
              </div>
            </Group>

            <Progress 
              value={layer.current} 
              color={Math.abs(layer.current - layer.recommended) > 10 ? 'orange' : 'blue'}
              mb="sm"
            />

            <Group>
              {layer.tools.map((tool, idx) => (
                <Badge key={idx} size="sm" variant="light">
                  {tool}
                </Badge>
              ))}
            </Group>
          </Card>
        ))}

        {analysis && (
          <Alert color="blue">
            <Text fw={500} mb="sm">Strategy Analysis</Text>
            <Group mb="sm">
              <Badge color="blue">Maturity: {analysis.maturity}%</Badge>
              <Badge color="green">Efficiency: {analysis.efficiency}%</Badge>
              <Badge color="orange">Cost Factor: {analysis.cost.toFixed(1)}x</Badge>
            </Group>

            {analysis.antiPatterns.length > 0 && (
              <div>
                <Text fw={500} size="sm" mb="xs">Anti-patterns Detected:</Text>
                <Stack gap="xs" mb="sm">
                  {analysis.antiPatterns.map((pattern: string, idx: number) => (
                    <Text key={idx} size="sm" c="orange">• {pattern}</Text>
                  ))}
                </Stack>
              </div>
            )}

            {analysis.recommendations.length > 0 && (
              <div>
                <Text fw={500} size="sm" mb="xs">Recommendations:</Text>
                <Stack gap="xs">
                  {analysis.recommendations.map((rec: string, idx: number) => (
                    <Text key={idx} size="sm">• {rec}</Text>
                  ))}
                </Stack>
              </div>
            )}
          </Alert>
        )}
      </Stack>
    </Card>
  );
};

// ===== QUALITY GATES FRAMEWORK =====

interface QualityGate {
  id: string;
  name: string;
  type: 'mandatory' | 'advisory' | 'blocking';
  criteria: QualityCriteria[];
  environment: string;
  enabled: boolean;
  lastEvaluation?: GateEvaluation;
}

interface QualityCriteria {
  id: string;
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '=' | '!=';
  threshold: number;
  weight: number;
}

interface GateEvaluation {
  timestamp: Date;
  passed: boolean;
  score: number;
  failedCriteria: string[];
  evaluator: string;
}

const QualityGates: React.FC = () => {
  const [gates, setGates] = useState<QualityGate[]>([
    {
      id: 'unit-test-gate',
      name: 'Unit Test Quality Gate',
      type: 'mandatory',
      criteria: [
        { id: 'coverage', metric: 'code_coverage', operator: '>=', threshold: 80, weight: 3 },
        { id: 'pass-rate', metric: 'test_pass_rate', operator: '>=', threshold: 95, weight: 4 },
        { id: 'duration', metric: 'test_duration', operator: '<=', threshold: 300, weight: 2 }
      ],
      environment: 'CI/CD',
      enabled: true
    },
    {
      id: 'integration-gate',
      name: 'Integration Quality Gate',
      type: 'blocking',
      criteria: [
        { id: 'api-coverage', metric: 'api_coverage', operator: '>=', threshold: 70, weight: 3 },
        { id: 'contract-tests', metric: 'contract_compliance', operator: '>=', threshold: 100, weight: 4 },
        { id: 'response-time', metric: 'avg_response_time', operator: '<=', threshold: 500, weight: 2 }
      ],
      environment: 'Staging',
      enabled: true
    },
    {
      id: 'performance-gate',
      name: 'Performance Quality Gate',
      type: 'advisory',
      criteria: [
        { id: 'lcp', metric: 'largest_contentful_paint', operator: '<=', threshold: 2500, weight: 4 },
        { id: 'fid', metric: 'first_input_delay', operator: '<=', threshold: 100, weight: 3 },
        { id: 'cls', metric: 'cumulative_layout_shift', operator: '<=', threshold: 0.1, weight: 3 }
      ],
      environment: 'Production',
      enabled: true
    }
  ]);

  const [gateResults, setGateResults] = useState<Record<string, GateEvaluation>>({});

  const evaluateGate = useCallback(async (gateId: string) => {
    const gate = gates.find(g => g.id === gateId);
    if (!gate) return;

    // Simulate gate evaluation with mock metrics
    const mockMetrics: Record<string, number> = {
      code_coverage: Math.random() * 100,
      test_pass_rate: 90 + Math.random() * 10,
      test_duration: 200 + Math.random() * 200,
      api_coverage: Math.random() * 100,
      contract_compliance: Math.random() > 0.1 ? 100 : 80,
      avg_response_time: 300 + Math.random() * 400,
      largest_contentful_paint: 2000 + Math.random() * 1000,
      first_input_delay: Math.random() * 200,
      cumulative_layout_shift: Math.random() * 0.2
    };

    await new Promise(resolve => setTimeout(resolve, 1500));

    const results = gate.criteria.map(criteria => {
      const value = mockMetrics[criteria.metric] || 0;
      let passed = false;
      
      switch (criteria.operator) {
        case '>': passed = value > criteria.threshold; break;
        case '<': passed = value < criteria.threshold; break;
        case '>=': passed = value >= criteria.threshold; break;
        case '<=': passed = value <= criteria.threshold; break;
        case '=': passed = value === criteria.threshold; break;
        case '!=': passed = value !== criteria.threshold; break;
      }
      
      return { 
        criteriaId: criteria.id, 
        passed, 
        value, 
        weight: criteria.weight,
        metric: criteria.metric,
        threshold: criteria.threshold,
        operator: criteria.operator
      };
    });

    const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
    const weightedScore = results.reduce((sum, r) => 
      sum + (r.passed ? r.weight : 0), 0) / totalWeight;

    const evaluation: GateEvaluation = {
      timestamp: new Date(),
      passed: weightedScore >= 0.8,
      score: weightedScore,
      failedCriteria: results.filter(r => !r.passed).map(r => r.criteriaId),
      evaluator: 'system'
    };

    setGateResults(prev => ({
      ...prev,
      [gateId]: evaluation
    }));

    setGates(prev => prev.map(g => 
      g.id === gateId ? { ...g, lastEvaluation: evaluation } : g
    ));
  }, [gates]);

  const runAllGates = useCallback(async () => {
    for (const gate of gates.filter(g => g.enabled)) {
      await evaluateGate(gate.id);
    }
  }, [gates, evaluateGate]);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>Quality Gates</Text>
          <Button onClick={runAllGates} size="sm">
            Evaluate All Gates
          </Button>
        </Group>

        {gates.map((gate, index) => (
          <Card key={index} withBorder>
            <Group justify="apart" mb="md">
              <Group>
                <Text fw={500}>{gate.name}</Text>
                <Badge color={
                  gate.type === 'mandatory' ? 'red' : 
                  gate.type === 'blocking' ? 'orange' : 'blue'
                }>
                  {gate.type}
                </Badge>
                <Badge variant="light">{gate.environment}</Badge>
              </Group>
              <Group>
                <Button 
                  onClick={() => evaluateGate(gate.id)}
                  size="xs"
                  variant="light"
                >
                  Evaluate
                </Button>
              </Group>
            </Group>

            <Stack gap="xs" mb="md">
              {gate.criteria.map((criteria, idx) => (
                <Group key={idx} justify="apart">
                  <Group>
                    <Text size="sm">{criteria.metric}</Text>
                    <Text size="sm" c="dimmed">
                      {criteria.operator} {criteria.threshold}
                    </Text>
                  </Group>
                  <Badge size="xs" variant="light">
                    Weight: {criteria.weight}
                  </Badge>
                </Group>
              ))}
            </Stack>

            {gate.lastEvaluation && (
              <Alert color={gate.lastEvaluation.passed ? 'green' : 'red'}>
                <Group justify="apart" mb="sm">
                  <Text fw={500}>
                    {gate.lastEvaluation.passed ? 'PASSED' : 'FAILED'}
                  </Text>
                  <Badge>
                    Score: {(gate.lastEvaluation.score * 100).toFixed(1)}%
                  </Badge>
                </Group>
                
                {gate.lastEvaluation.failedCriteria.length > 0 && (
                  <div>
                    <Text size="sm" mb="xs">Failed Criteria:</Text>
                    <Stack gap="xs">
                      {gate.lastEvaluation.failedCriteria.map((criteria, idx) => (
                        <Text key={idx} size="sm">• {criteria}</Text>
                      ))}
                    </Stack>
                  </div>
                )}
                
                <Text size="xs" c="dimmed" mt="sm">
                  Evaluated: {gate.lastEvaluation.timestamp.toLocaleTimeString()}
                </Text>
              </Alert>
            )}
          </Card>
        ))}
      </Stack>
    </Card>
  );
};

// ===== TEST METRICS FRAMEWORK =====

interface TestMetric {
  id: string;
  name: string;
  category: 'coverage' | 'performance' | 'quality' | 'velocity';
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

const TestMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<TestMetric[]>([
    { id: 'coverage', name: 'Code Coverage', category: 'coverage', value: 78, target: 80, trend: 'up', unit: '%' },
    { id: 'mutation', name: 'Mutation Score', category: 'quality', value: 65, target: 70, trend: 'stable', unit: '%' },
    { id: 'duration', name: 'Test Duration', category: 'performance', value: 145, target: 120, trend: 'down', unit: 's' },
    { id: 'flakiness', name: 'Test Flakiness', category: 'quality', value: 2.3, target: 1.0, trend: 'up', unit: '%' },
    { id: 'velocity', name: 'Test Velocity', category: 'velocity', value: 23, target: 25, trend: 'stable', unit: 'tests/day' }
  ]);

  const [alerts, setAlerts] = useState<Array<{
    metric: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: Date;
  }>>([]);

  const collectMetrics = useCallback(() => {
    // Simulate metric collection with some randomness
    setMetrics(prev => prev.map(metric => {
      const variance = (Math.random() - 0.5) * 0.1; // ±5% variance
      let newValue = metric.value * (1 + variance);
      
      // Apply category-specific logic
      if (metric.category === 'coverage' || metric.category === 'quality') {
        newValue = Math.max(0, Math.min(100, newValue));
      } else if (metric.id === 'duration') {
        newValue = Math.max(60, newValue);
      } else if (metric.id === 'flakiness') {
        newValue = Math.max(0, Math.min(10, newValue));
      }

      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      const diff = newValue - metric.value;
      if (Math.abs(diff) > metric.value * 0.02) { // 2% threshold
        trend = diff > 0 ? 'up' : 'down';
      }

      return {
        ...metric,
        value: Math.round(newValue * 10) / 10,
        trend
      };
    }));

    // Generate alerts for metrics outside targets
    const newAlerts = metrics
      .filter(metric => {
        if (metric.id === 'duration' || metric.id === 'flakiness') {
          return metric.value > metric.target;
        }
        return metric.value < metric.target;
      })
      .map(metric => ({
        metric: metric.name,
        severity: Math.abs(metric.value - metric.target) / metric.target > 0.2 ? 'high' : 
                 Math.abs(metric.value - metric.target) / metric.target > 0.1 ? 'medium' : 'low',
        message: `${metric.name} is ${metric.value < metric.target ? 'below' : 'above'} target (${metric.value}${metric.unit} vs ${metric.target}${metric.unit})`,
        timestamp: new Date()
      })) as Array<{
        metric: string;
        severity: 'low' | 'medium' | 'high';
        message: string;
        timestamp: Date;
      }>;

    setAlerts(newAlerts.slice(0, 5)); // Keep only 5 most recent alerts
  }, [metrics]);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>Test Metrics</Text>
          <Button onClick={collectMetrics} size="sm">
            Collect Metrics
          </Button>
        </Group>

        <Group grow>
          {metrics.slice(0, 4).map((metric, index) => (
            <Card key={index} withBorder padding="md">
              <Group justify="apart" mb="xs">
                <Text size="sm" fw={500}>{metric.name}</Text>
                <Badge 
                  size="xs" 
                  color={
                    metric.trend === 'up' ? 'green' : 
                    metric.trend === 'down' ? 'red' : 'gray'
                  }
                >
                  {metric.trend}
                </Badge>
              </Group>
              <Text size="xl" fw={700} mb="xs">
                {metric.value}{metric.unit}
              </Text>
              <Text size="xs" c="dimmed">
                Target: {metric.target}{metric.unit}
              </Text>
              <Progress 
                value={(metric.value / metric.target) * 100} 
                color={metric.value >= metric.target ? 'green' : 'orange'}
                size="xs"
                mt="xs"
              />
            </Card>
          ))}
        </Group>

        {alerts.length > 0 && (
          <Card withBorder>
            <Text fw={500} mb="md">Active Alerts</Text>
            <Stack gap="xs">
              {alerts.map((alert, index) => (
                <Alert 
                  key={index} 
                  color={
                    alert.severity === 'high' ? 'red' : 
                    alert.severity === 'medium' ? 'orange' : 'yellow'
                  }
                >
                  <Group justify="apart">
                    <Text size="sm">{alert.message}</Text>
                    <Badge size="xs" color={
                      alert.severity === 'high' ? 'red' : 
                      alert.severity === 'medium' ? 'orange' : 'yellow'
                    }>
                      {alert.severity}
                    </Badge>
                  </Group>
                </Alert>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
};

// ===== COVERAGE ANALYSIS SYSTEM =====

interface CoverageReport {
  id: string;
  type: 'statement' | 'branch' | 'function' | 'line';
  percentage: number;
  covered: number;
  total: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  gaps: CoverageGap[];
}

interface CoverageGap {
  file: string;
  type: 'uncovered' | 'partially-covered';
  lines: number[];
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

const CoverageAnalysis: React.FC = () => {
  const [reports, setReports] = useState<CoverageReport[]>([
    {
      id: 'statement',
      type: 'statement',
      percentage: 78.5,
      covered: 1425,
      total: 1815,
      quality: 'good',
      gaps: [
        { file: 'components/UserProfile.tsx', type: 'uncovered', lines: [23, 45, 67], priority: 'high', reason: 'Error handling paths not tested' },
        { file: 'utils/validation.ts', type: 'partially-covered', lines: [12], priority: 'medium', reason: 'Edge cases missing' }
      ]
    },
    {
      id: 'branch',
      type: 'branch',
      percentage: 72.1,
      covered: 234,
      total: 325,
      quality: 'fair',
      gaps: [
        { file: 'hooks/useAuth.ts', type: 'uncovered', lines: [34, 56], priority: 'high', reason: 'Authentication failure scenarios' }
      ]
    },
    {
      id: 'function',
      type: 'function',
      percentage: 85.3,
      covered: 156,
      total: 183,
      quality: 'excellent',
      gaps: []
    },
    {
      id: 'line',
      type: 'line',
      percentage: 76.8,
      covered: 2341,
      total: 3048,
      quality: 'good',
      gaps: []
    }
  ]);

  const [analysis, setAnalysis] = useState<any>(null);

  const analyzeQuality = useCallback(() => {
    const overallCoverage = reports.reduce((sum, report) => sum + report.percentage, 0) / reports.length;
    const totalGaps = reports.reduce((sum, report) => sum + report.gaps.length, 0);
    const highPriorityGaps = reports.reduce((sum, report) => 
      sum + report.gaps.filter(gap => gap.priority === 'high').length, 0);

    const recommendations = [];
    if (overallCoverage < 80) recommendations.push('Increase overall coverage to meet 80% threshold');
    if (highPriorityGaps > 0) recommendations.push(`Address ${highPriorityGaps} high-priority coverage gaps`);
    if (reports.find(r => r.type === 'branch')?.percentage < 75) {
      recommendations.push('Focus on branch coverage - many conditional paths untested');
    }

    const quality = overallCoverage >= 85 ? 'excellent' : 
                   overallCoverage >= 75 ? 'good' : 
                   overallCoverage >= 65 ? 'fair' : 'poor';

    setAnalysis({
      overallCoverage: Math.round(overallCoverage * 10) / 10,
      quality,
      totalGaps,
      highPriorityGaps,
      recommendations,
      trend: 'stable' // Would be calculated from historical data
    });
  }, [reports]);

  const generateTestPlan = useCallback(() => {
    const highPriorityGaps = reports
      .flatMap(report => report.gaps)
      .filter(gap => gap.priority === 'high')
      .slice(0, 5);

    const plan = highPriorityGaps.map(gap => ({
      file: gap.file,
      task: `Add tests for ${gap.reason.toLowerCase()}`,
      priority: gap.priority,
      estimatedHours: gap.lines.length * 0.5,
      type: gap.type === 'uncovered' ? 'New tests' : 'Extend existing tests'
    }));

    console.log('Generated Test Plan:', plan);
    return plan;
  }, [reports]);

  return (
    <Card>
      <Stack>
        <Group justify="apart">
          <Text fw={500}>Coverage Analysis</Text>
          <Group>
            <Button onClick={analyzeQuality} size="sm">
              Analyze Quality
            </Button>
            <Button onClick={generateTestPlan} variant="light" size="sm">
              Generate Test Plan
            </Button>
          </Group>
        </Group>

        <Group grow>
          {reports.map((report, index) => (
            <Card key={index} withBorder padding="md">
              <Group justify="apart" mb="xs">
                <Text size="sm" fw={500} tt="capitalize">
                  {report.type}
                </Text>
                <Badge 
                  color={
                    report.quality === 'excellent' ? 'green' :
                    report.quality === 'good' ? 'blue' :
                    report.quality === 'fair' ? 'orange' : 'red'
                  }
                >
                  {report.quality}
                </Badge>
              </Group>
              <Text size="xl" fw={700} mb="xs">
                {report.percentage}%
              </Text>
              <Text size="xs" c="dimmed" mb="xs">
                {report.covered} / {report.total} covered
              </Text>
              <Progress 
                value={report.percentage} 
                color={report.percentage >= 80 ? 'green' : 'orange'}
                size="xs"
              />
            </Card>
          ))}
        </Group>

        {analysis && (
          <Alert color="blue">
            <Text fw={500} mb="sm">Coverage Quality Analysis</Text>
            <Group mb="sm">
              <Badge>Overall: {analysis.overallCoverage}%</Badge>
              <Badge color={
                analysis.quality === 'excellent' ? 'green' :
                analysis.quality === 'good' ? 'blue' :
                analysis.quality === 'fair' ? 'orange' : 'red'
              }>
                Quality: {analysis.quality}
              </Badge>
              <Badge color="orange">Gaps: {analysis.totalGaps}</Badge>
              {analysis.highPriorityGaps > 0 && (
                <Badge color="red">High Priority: {analysis.highPriorityGaps}</Badge>
              )}
            </Group>
            
            {analysis.recommendations.length > 0 && (
              <div>
                <Text fw={500} size="sm" mb="xs">Recommendations:</Text>
                <Stack gap="xs">
                  {analysis.recommendations.map((rec: string, idx: number) => (
                    <Text key={idx} size="sm">• {rec}</Text>
                  ))}
                </Stack>
              </div>
            )}
          </Alert>
        )}

        {reports.some(r => r.gaps.length > 0) && (
          <Card withBorder>
            <Text fw={500} mb="md">Coverage Gaps</Text>
            <Stack gap="xs">
              {reports
                .filter(r => r.gaps.length > 0)
                .flatMap(r => r.gaps)
                .slice(0, 5)
                .map((gap, index) => (
                  <Group key={index} justify="apart">
                    <div>
                      <Text size="sm" fw={500}>{gap.file}</Text>
                      <Text size="xs" c="dimmed">{gap.reason}</Text>
                    </div>
                    <Group>
                      <Badge 
                        size="xs" 
                        color={
                          gap.priority === 'high' ? 'red' :
                          gap.priority === 'medium' ? 'orange' : 'gray'
                        }
                      >
                        {gap.priority}
                      </Badge>
                      <Badge size="xs" variant="light">
                        {gap.lines.length} lines
                      </Badge>
                    </Group>
                  </Group>
                ))}
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  );
};

// ===== MAIN COMPONENT =====

export const TestingStrategyImplementationExercise: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <Stack>
        <div>
          <h1>Testing Strategy Implementation</h1>
          <p>Comprehensive testing strategy design and implementation with pyramids, quality gates, metrics, and coverage analysis</p>
        </div>

        <Tabs defaultValue="pyramid">
          <Tabs.List>
            <Tabs.Tab value="pyramid">Testing Pyramid</Tabs.Tab>
            <Tabs.Tab value="gates">Quality Gates</Tabs.Tab>
            <Tabs.Tab value="metrics">Test Metrics</Tabs.Tab>
            <Tabs.Tab value="coverage">Coverage Analysis</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pyramid" pt="md">
            <TestingPyramid />
          </Tabs.Panel>

          <Tabs.Panel value="gates" pt="md">
            <QualityGates />
          </Tabs.Panel>

          <Tabs.Panel value="metrics" pt="md">
            <TestMetrics />
          </Tabs.Panel>

          <Tabs.Panel value="coverage" pt="md">
            <CoverageAnalysis />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </div>
  );
};

export default TestingStrategyImplementationExercise;