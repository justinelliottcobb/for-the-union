# Exercise 05: Trading Interface Patterns

## 🎯 Learning Objectives

By the end of this exercise, you will be able to:

1. **Build professional trading interfaces** with real-time price feeds and advanced charting
2. **Implement order management systems** with multiple order types and execution strategies
3. **Create portfolio tracking** with P&L calculations and risk metrics
4. **Handle WebSocket connections** for real-time market data and order updates
5. **Design risk management tools** with position sizing and stop-loss automation

## 📋 Pre-requisites

Before starting this exercise, you should have completed:

- Exercise 01: Web3 Wallet Integration
- Exercise 02: Blockchain Data Fetching
- Exercise 03: Smart Contract Interaction
- Exercise 04: DeFi Protocol Integration
- Understanding of trading concepts (orders, positions, P&L)
- Familiarity with WebSocket connections and real-time data

## 📚 Introduction

Professional trading interfaces are the backbone of crypto exchanges and DeFi trading platforms. This exercise teaches you to build sophisticated trading UIs with real-time data, advanced order management, portfolio tracking, and risk management tools that meet the standards of professional trading platforms.

## 🛠️ Setup

You'll implement a comprehensive trading platform:

### Core Components

1. **OrderBook**: Real-time order book with depth visualization
2. **TradingChart**: Advanced price charts with technical indicators
3. **PositionManager**: Portfolio tracking with real-time P&L updates
4. **RiskCalculator**: Risk management tools and position sizing

### Key Features

- WebSocket integration for real-time market data
- Advanced order types (market, limit, stop-loss, OCO)
- TradingView-style charting with indicators
- Portfolio analytics and risk metrics
- Automated trading strategies
- Multi-timeframe analysis

## 📝 Instructions

### Step 1: Implement OrderBook Component

Create a real-time order book with depth visualization:

```typescript
interface Order {
  id: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  total: number;
  timestamp: number;
}

interface OrderBookData {
  bids: Order[];
  asks: Order[];
  spread: number;
  lastPrice: number;
}

const OrderBook: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [orderBook, setOrderBook] = useState<OrderBookData>({
    bids: [],
    asks: [],
    spread: 0,
    lastPrice: 0
  });
  
  useEffect(() => {
    // Connect to WebSocket for real-time order book updates
    const ws = new WebSocket(`wss://api.exchange.com/ws/${symbol}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setOrderBook(updateOrderBook(data));
    };
    
    return () => ws.close();
  }, [symbol]);
};
```

Key implementation points:
- Real-time WebSocket updates
- Depth chart visualization
- Price level aggregation
- Spread calculation and monitoring
- Order book animation and smoothing

### Step 2: Build TradingChart Component

Implement advanced charting with technical indicators:

```typescript
interface ChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicator {
  name: string;
  values: { timestamp: number; value: number }[];
  color: string;
}

const TradingChart: React.FC<{
  symbol: string;
  timeframe: string;
  indicators: string[];
}> = ({ symbol, timeframe, indicators }) => {
  // Implement candlestick chart with technical indicators
  // Support multiple timeframes (1m, 5m, 1h, 1d)
  // Add drawing tools and annotations
};
```

Features to implement:
- Candlestick and OHLC chart types
- Technical indicators (MA, RSI, MACD, Bollinger Bands)
- Multiple timeframe support
- Drawing tools (trend lines, support/resistance)
- Volume analysis and profile

### Step 3: Create PositionManager

Build comprehensive portfolio tracking:

```typescript
interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  margin: number;
  liquidationPrice?: number;
}

interface Portfolio {
  totalValue: number;
  availableBalance: number;
  marginUsed: number;
  totalPnl: number;
  positions: Position[];
}

const PositionManager: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Portfolio>({
    totalValue: 0,
    availableBalance: 0,
    marginUsed: 0,
    totalPnl: 0,
    positions: []
  });
  
  const calculatePnL = useCallback((position: Position) => {
    const priceDiff = position.currentPrice - position.entryPrice;
    const multiplier = position.side === 'long' ? 1 : -1;
    return priceDiff * position.size * multiplier;
  }, []);
};
```

### Step 4: Implement RiskCalculator

Build risk management and position sizing tools:

```typescript
interface RiskMetrics {
  portfolioRisk: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  varAtRisk: number;
}

interface PositionSizing {
  recommendedSize: number;
  maxPosition: number;
  riskAmount: number;
  stopLossPrice: number;
  takeProfitPrice: number;
}

const RiskCalculator: React.FC = () => {
  const calculatePositionSize = useCallback((
    accountSize: number,
    riskPercentage: number,
    entryPrice: number,
    stopLossPrice: number
  ): PositionSizing => {
    const riskAmount = accountSize * (riskPercentage / 100);
    const priceRisk = Math.abs(entryPrice - stopLossPrice);
    const recommendedSize = riskAmount / priceRisk;
    
    return {
      recommendedSize,
      maxPosition: recommendedSize,
      riskAmount,
      stopLossPrice,
      takeProfitPrice: 0
    };
  }, []);
};
```

## 💡 Hints

### WebSocket Market Data

```typescript
class MarketDataService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Function[]> = new Map();
  
  connect() {
    this.ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.notifySubscribers(data.s, data);
    };
  }
  
  subscribe(symbol: string, callback: Function) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, []);
    }
    this.subscribers.get(symbol)!.push(callback);
  }
  
  private notifySubscribers(symbol: string, data: any) {
    const callbacks = this.subscribers.get(symbol) || [];
    callbacks.forEach(callback => callback(data));
  }
}
```

### Technical Indicators Calculation

```typescript
const calculateSMA = (prices: number[], period: number): number[] => {
  const sma: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
};

const calculateRSI = (prices: number[], period: number = 14): number[] => {
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }
  
  // Calculate RSI using exponential moving average
  // ... RSI calculation logic
  
  return []; // Return calculated RSI values
};
```

### Order Management System

```typescript
class OrderManager {
  private orders: Map<string, Order> = new Map();
  
  async placeOrder(order: {
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop';
    amount: number;
    price?: number;
    stopPrice?: number;
  }): Promise<string> {
    const orderId = generateOrderId();
    
    // Validate order
    await this.validateOrder(order);
    
    // Submit to exchange
    const result = await this.submitOrder(order);
    
    // Track order status
    this.orders.set(orderId, {
      ...order,
      id: orderId,
      status: 'pending',
      timestamp: Date.now()
    });
    
    return orderId;
  }
  
  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order) return false;
    
    // Cancel on exchange
    await this.cancelOnExchange(orderId);
    
    // Update local state
    this.orders.set(orderId, {
      ...order,
      status: 'cancelled'
    });
    
    return true;
  }
}
```

## 🎓 Learning Notes

### Trading Interface Best Practices

1. **Real-time Updates**: Use WebSockets for live market data
2. **Order Validation**: Validate all orders before submission
3. **Risk Management**: Implement position sizing and stop-losses
4. **Performance**: Optimize chart rendering for smooth updates
5. **Error Handling**: Handle network failures and order rejections gracefully

### Market Data Management

1. **Data Compression**: Use efficient data structures for OHLC data
2. **Buffering**: Buffer WebSocket messages to prevent UI lag
3. **Throttling**: Limit update frequency for smooth animations
4. **Fallbacks**: Implement REST API fallbacks for WebSocket failures

### Advanced Trading Features

```typescript
// Implement trailing stop-loss
const updateTrailingStop = (
  position: Position,
  currentPrice: number,
  trailPercent: number
) => {
  if (position.side === 'long') {
    const newStop = currentPrice * (1 - trailPercent / 100);
    if (newStop > position.stopLoss) {
      position.stopLoss = newStop;
    }
  } else {
    const newStop = currentPrice * (1 + trailPercent / 100);
    if (newStop < position.stopLoss) {
      position.stopLoss = newStop;
    }
  }
};

// Risk-reward ratio calculation
const calculateRiskReward = (
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): number => {
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  return reward / risk;
};
```

## 🔍 Debugging Tips

1. **WebSocket Monitoring**: Use browser dev tools to monitor WebSocket messages
2. **Order Validation**: Test edge cases with minimum/maximum order sizes
3. **Performance Profiling**: Monitor chart rendering performance
4. **State Management**: Debug order state transitions carefully
5. **Data Accuracy**: Verify P&L calculations against exchange data

## ✅ Checklist

Before submitting your solution, ensure:

- [ ] Real-time order book updates work correctly
- [ ] Trading charts display multiple timeframes
- [ ] Technical indicators calculate accurately
- [ ] Position tracking shows correct P&L
- [ ] Order management handles all order types
- [ ] Risk calculator provides accurate position sizing
- [ ] WebSocket connections handle reconnection
- [ ] Error states are handled gracefully
- [ ] Performance is optimized for real-time updates
- [ ] UI is responsive on different screen sizes

## 🚀 Extensions

Once you've completed the basic requirements, try:

1. **Algorithmic Trading**: Implement basic trading bots
2. **Advanced Analytics**: Add portfolio performance metrics
3. **Social Trading**: Implement copy trading features
4. **Options Trading**: Add options chain and Greeks
5. **Futures Trading**: Implement margin and leverage controls

## 📚 Resources

- [TradingView Charting Library](https://www.tradingview.com/charting-library/)
- [Binance WebSocket API](https://binance-docs.github.io/apidocs/spot/en/#websocket-market-streams)
- [CoinGecko API](https://www.coingecko.com/en/api/documentation)
- [Technical Analysis Library](https://github.com/anandanand84/technicalindicators)
- [WebSocket Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Trading Interface Design Patterns](https://uxplanet.org/trading-interface-design-patterns-b5b2c8f8f8c8)