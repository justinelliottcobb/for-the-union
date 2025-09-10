import { TestResult } from '../../../types/test';

export function runTests(userCode: string): TestResult[] {
  const results: TestResult[] = [];
  const startTime = Date.now();

  try {
    // Test 1: OrderBook component implementation
    results.push({
      name: 'OrderBook component exists',
      passed: userCode.includes('const OrderBook') &&
              userCode.includes('bids') &&
              userCode.includes('asks') &&
              userCode.includes('WebSocket'),
      error: userCode.includes('const OrderBook')
        ? undefined
        : 'OrderBook component must be implemented with real-time WebSocket connection',
      executionTime: Date.now() - startTime
    });

    // Test 2: TradingChart component with indicators
    results.push({
      name: 'TradingChart with technical indicators',
      passed: userCode.includes('TradingChart') &&
              userCode.includes('timeframe') &&
              userCode.includes('indicators') &&
              (userCode.includes('SMA') || userCode.includes('RSI') || userCode.includes('MACD')),
      error: userCode.includes('TradingChart')
        ? undefined
        : 'TradingChart component must support technical indicators',
      executionTime: Date.now() - startTime
    });

    // Test 3: PositionManager with P&L calculations
    results.push({
      name: 'PositionManager with P&L tracking',
      passed: userCode.includes('PositionManager') &&
              userCode.includes('calculatePnL') &&
              userCode.includes('unrealizedPnl') &&
              userCode.includes('realizedPnl'),
      error: userCode.includes('PositionManager')
        ? undefined
        : 'PositionManager must calculate P&L accurately',
      executionTime: Date.now() - startTime
    });

    // Test 4: RiskCalculator implementation
    results.push({
      name: 'RiskCalculator with position sizing',
      passed: userCode.includes('RiskCalculator') &&
              userCode.includes('calculatePositionSize') &&
              userCode.includes('riskPercentage') &&
              userCode.includes('stopLoss'),
      error: userCode.includes('RiskCalculator')
        ? undefined
        : 'RiskCalculator must implement position sizing logic',
      executionTime: Date.now() - startTime
    });

    // Test 5: WebSocket market data service
    results.push({
      name: 'MarketDataService WebSocket integration',
      passed: userCode.includes('MarketDataService') &&
              userCode.includes('WebSocket') &&
              userCode.includes('subscribe') &&
              userCode.includes('connect'),
      error: userCode.includes('MarketDataService')
        ? undefined
        : 'MarketDataService must handle WebSocket connections',
      executionTime: Date.now() - startTime
    });

    // Test 6: Order management system
    results.push({
      name: 'OrderManager with multiple order types',
      passed: userCode.includes('OrderManager') &&
              userCode.includes('placeOrder') &&
              userCode.includes('cancelOrder') &&
              (userCode.includes('market') || userCode.includes('limit')),
      error: userCode.includes('OrderManager')
        ? undefined
        : 'OrderManager must support multiple order types',
      executionTime: Date.now() - startTime
    });

    // Test 7: Technical indicators calculation
    results.push({
      name: 'Technical indicators implementation',
      passed: (userCode.includes('calculateSMA') || userCode.includes('SMA')) &&
              (userCode.includes('calculateRSI') || userCode.includes('RSI')),
      error: (userCode.includes('calculateSMA') || userCode.includes('SMA'))
        ? undefined
        : 'Must implement technical indicators (SMA, RSI, etc.)',
      executionTime: Date.now() - startTime
    });

    // Test 8: Portfolio tracking
    results.push({
      name: 'Portfolio tracking with metrics',
      passed: userCode.includes('Portfolio') &&
              userCode.includes('totalValue') &&
              userCode.includes('totalPnl') &&
              userCode.includes('positions'),
      error: userCode.includes('Portfolio')
        ? undefined
        : 'Portfolio component must track total value and P&L',
      executionTime: Date.now() - startTime
    });

    // Test 9: Risk metrics calculation
    results.push({
      name: 'Risk metrics and calculations',
      passed: userCode.includes('RiskMetrics') &&
              (userCode.includes('sharpeRatio') || userCode.includes('volatility') || userCode.includes('maxDrawdown')),
      error: userCode.includes('RiskMetrics')
        ? undefined
        : 'Must implement risk metrics calculations',
      executionTime: Date.now() - startTime
    });

    // Test 10: Real-time updates handling
    results.push({
      name: 'Real-time data updates',
      passed: userCode.includes('useEffect') &&
              userCode.includes('WebSocket') &&
              (userCode.includes('onmessage') || userCode.includes('addEventListener')),
      error: userCode.includes('useEffect')
        ? undefined
        : 'Must handle real-time WebSocket data updates',
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
