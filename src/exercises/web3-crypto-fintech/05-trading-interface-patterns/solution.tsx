import * as React from 'react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Card,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  NumberInput,
  Select,
  Table,
  Progress,
  Alert,
  Tabs,
  Grid,
  Paper,
  ActionIcon,
  Switch,
  Slider,
  ScrollArea,
  RingProgress
} from '@mantine/core';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconChartCandle,
  IconWallet,
  IconShield,
  IconTargetArrow,
  IconRefresh,
  IconSettings,
  IconBolt,
  IconEye,
  IconX,
  IconChartBar,
  IconActivity
} from '@tabler/icons-react';

// === TYPES AND INTERFACES ===

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
  volume24h: number;
}

interface ChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  margin: number;
  liquidationPrice?: number;
  timestamp: number;
}

interface Portfolio {
  totalValue: number;
  availableBalance: number;
  marginUsed: number;
  totalPnl: number;
  totalPnlPercent: number;
  positions: Position[];
}

interface RiskMetrics {
  portfolioRisk: number;
  maxDrawdown: number;
  volatility: number;
  varAtRisk: number;
  winRate: number;
}

interface TradingOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop-limit';
  amount: number;
  price?: number;
  stopPrice?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  timestamp: number;
}

// === MARKET DATA SERVICE ===

class MarketDataService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(symbol: string) {
    if (this.ws) {
      this.ws.close();
    }

    // Simulate WebSocket connection
    this.simulateMarketData(symbol);
  }

  private simulateMarketData(symbol: string) {
    // Simulate real-time market data
    let lastPrice = 45000 + Math.random() * 5000;
    
    const interval = setInterval(() => {
      const priceChange = (Math.random() - 0.5) * 100;
      lastPrice += priceChange;
      
      const data = {
        symbol,
        price: lastPrice,
        volume: Math.random() * 1000,
        timestamp: Date.now()
      };

      this.notifySubscribers(symbol, data);
    }, 1000);

    // Simulate connection management
    this.ws = {
      close: () => clearInterval(interval)
    } as WebSocket;
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

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// === ORDER BOOK COMPONENT ===

export const OrderBook: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [orderBook, setOrderBook] = useState<OrderBookData>({
    bids: [],
    asks: [],
    spread: 0,
    lastPrice: 45250.50,
    volume24h: 125000000
  });
  
  const marketData = useRef(new MarketDataService());

  useEffect(() => {
    // Generate mock order book data
    const generateOrders = (side: 'buy' | 'sell', basePrice: number, count = 15) => {
      const orders: Order[] = [];
      let currentPrice = basePrice;
      
      for (let i = 0; i < count; i++) {
        const priceStep = side === 'buy' ? -Math.random() * 10 : Math.random() * 10;
        currentPrice += priceStep;
        const amount = Math.random() * 5 + 0.1;
        
        orders.push({
          id: `${side}-${i}`,
          side,
          price: currentPrice,
          amount,
          total: currentPrice * amount,
          timestamp: Date.now() - i * 1000
        });
      }
      
      return orders.sort((a, b) => side === 'buy' ? b.price - a.price : a.price - b.price);
    };

    const updateOrderBook = () => {
      const lastPrice = 45250.50 + (Math.random() - 0.5) * 200;
      const bids = generateOrders('buy', lastPrice - 5);
      const asks = generateOrders('sell', lastPrice + 5);
      const spread = asks[0]?.price - bids[0]?.price;
      
      setOrderBook({
        bids,
        asks,
        spread,
        lastPrice,
        volume24h: 125000000 + Math.random() * 25000000
      });
    };

    updateOrderBook();
    const interval = setInterval(updateOrderBook, 2000);
    
    return () => clearInterval(interval);
  }, [symbol]);

  const formatPrice = (price: number) => price.toFixed(2);
  const formatAmount = (amount: number) => amount.toFixed(4);

  return (
    <Card>
      <Stack>
        <Group justify="space-between">
          <Text fw={600}>Order Book</Text>
          <Group gap="xs">
            <Badge variant="light">{symbol}</Badge>
            <Badge color="green">${formatPrice(orderBook.lastPrice)}</Badge>
          </Group>
        </Group>

        {/* Market Stats */}
        <Paper withBorder p="sm">
          <Grid>
            <Grid.Col span={4}>
              <Text size="xs" c="dimmed">24h Volume</Text>
              <Text size="sm" fw={500}>${(orderBook.volume24h / 1e6).toFixed(1)}M</Text>
            </Grid.Col>
            <Grid.Col span={4}>
              <Text size="xs" c="dimmed">Spread</Text>
              <Text size="sm" fw={500}>${orderBook.spread.toFixed(2)}</Text>
            </Grid.Col>
            <Grid.Col span={4}>
              <Text size="xs" c="dimmed">Last Price</Text>
              <Text size="sm" fw={500}>${formatPrice(orderBook.lastPrice)}</Text>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Order Book Table */}
        <ScrollArea h={400}>
          <Stack gap="xs">
            {/* Asks (Sell Orders) */}
            <Stack gap={2}>
              <Text size="xs" fw={500} c="red">ASKS</Text>
              {orderBook.asks.slice(0, 8).reverse().map((order, index) => (
                <Paper key={order.id} p="xs" bg="red.0">
                  <Group justify="space-between">
                    <Group gap="sm">
                      <Text size="xs" c="red" style={{ minWidth: 80 }}>
                        {formatPrice(order.price)}
                      </Text>
                      <Text size="xs" style={{ minWidth: 60 }}>
                        {formatAmount(order.amount)}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      ${(order.total).toFixed(0)}
                    </Text>
                  </Group>
                </Paper>
              ))}
            </Stack>

            {/* Current Price */}
            <Paper withBorder p="md" bg="gray.1">
              <Group justify="center">
                <Text size="lg" fw={700} c="green">
                  ${formatPrice(orderBook.lastPrice)}
                </Text>
                <Badge color="green" size="sm">
                  +2.3%
                </Badge>
              </Group>
            </Paper>

            {/* Bids (Buy Orders) */}
            <Stack gap={2}>
              <Text size="xs" fw={500} c="green">BIDS</Text>
              {orderBook.bids.slice(0, 8).map((order, index) => (
                <Paper key={order.id} p="xs" bg="green.0">
                  <Group justify="space-between">
                    <Group gap="sm">
                      <Text size="xs" c="green" style={{ minWidth: 80 }}>
                        {formatPrice(order.price)}
                      </Text>
                      <Text size="xs" style={{ minWidth: 60 }}>
                        {formatAmount(order.amount)}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      ${(order.total).toFixed(0)}
                    </Text>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Stack>
        </ScrollArea>
      </Stack>
    </Card>
  );
};

// === TRADING CHART COMPONENT ===

export const TradingChart: React.FC<{
  symbol: string;
  timeframe: string;
}> = ({ symbol, timeframe }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [indicators, setIndicators] = useState<string[]>(['SMA']);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Generate mock OHLC data
    const generateChartData = () => {
      const data: ChartData[] = [];
      let currentPrice = 45000 + Math.random() * 5000;
      const timeInterval = timeframe === '1m' ? 60000 : 
                          timeframe === '5m' ? 300000 :
                          timeframe === '1h' ? 3600000 : 86400000;
      
      for (let i = 0; i < 100; i++) {
        const timestamp = Date.now() - (100 - i) * timeInterval;
        const open = currentPrice;
        const volatility = 0.02; // 2% volatility
        const change = (Math.random() - 0.5) * currentPrice * volatility;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * Math.abs(change);
        const low = Math.min(open, close) - Math.random() * Math.abs(change);
        const volume = Math.random() * 1000 + 500;
        
        data.push({
          timestamp,
          open,
          high,
          low,
          close,
          volume
        });
        
        currentPrice = close;
      }
      
      return data;
    };

    setIsLoading(true);
    setTimeout(() => {
      setChartData(generateChartData());
      setIsLoading(false);
    }, 1000);
  }, [symbol, timeframe]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card>
      <Stack>
        <Group justify="space-between">
          <Text fw={600}>Trading Chart - {symbol}</Text>
          <Group gap="xs">
            <Select
              value={timeframe}
              data={[
                { value: '1m', label: '1m' },
                { value: '5m', label: '5m' },
                { value: '1h', label: '1h' },
                { value: '1d', label: '1d' }
              ]}
              size="xs"
            />
            <ActionIcon variant="subtle">
              <IconSettings size={16} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Chart Area (Simplified visualization) */}
        <Paper withBorder p="md" h={300} bg="gray.0">
          {isLoading ? (
            <Group justify="center" align="center" h="100%">
              <Text c="dimmed">Loading chart data...</Text>
            </Group>
          ) : (
            <Stack>
              <Group justify="space-between">
                <Group gap="xs">
                  {indicators.map((indicator) => (
                    <Badge key={indicator} variant="light" size="sm">
                      {indicator}
                    </Badge>
                  ))}
                </Group>
                <Group gap="xs">
                  <Text size="sm" c="green" fw={500}>
                    H: ${chartData[chartData.length - 1]?.high.toFixed(2)}
                  </Text>
                  <Text size="sm" c="red" fw={500}>
                    L: ${chartData[chartData.length - 1]?.low.toFixed(2)}
                  </Text>
                </Group>
              </Group>
              
              {/* Simplified chart representation */}
              <Progress
                value={75}
                size="lg"
                color="green"
                style={{ height: 200 }}
              />
              
              <Text size="xs" c="dimmed" ta="center">
                Chart visualization would integrate with TradingView or similar library
              </Text>
              
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  Volume: {chartData[chartData.length - 1]?.volume.toFixed(0)}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatTime(chartData[chartData.length - 1]?.timestamp || 0)}
                </Text>
              </Group>
            </Stack>
          )}
        </Paper>

        {/* Technical Indicators */}
        <Group gap="xs">
          {['SMA', 'RSI', 'MACD', 'Bollinger'].map((indicator) => (
            <Button
              key={indicator}
              size="xs"
              variant={indicators.includes(indicator) ? 'filled' : 'light'}
              onClick={() => {
                setIndicators(prev => 
                  prev.includes(indicator)
                    ? prev.filter(i => i !== indicator)
                    : [...prev, indicator]
                );
              }}
            >
              {indicator}
            </Button>
          ))}
        </Group>
      </Stack>
    </Card>
  );
};

// === POSITION MANAGER COMPONENT ===

export const PositionManager: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Portfolio>({
    totalValue: 125000,
    availableBalance: 85000,
    marginUsed: 40000,
    totalPnl: 8500,
    totalPnlPercent: 7.3,
    positions: [
      {
        symbol: 'BTC/USDT',
        side: 'long',
        size: 2.5,
        entryPrice: 44200,
        currentPrice: 45250,
        unrealizedPnl: 2625,
        unrealizedPnlPercent: 2.37,
        margin: 22100,
        liquidationPrice: 35000,
        timestamp: Date.now() - 2 * 60 * 60 * 1000
      },
      {
        symbol: 'ETH/USDT',
        side: 'short',
        size: 15,
        entryPrice: 3150,
        currentPrice: 3080,
        unrealizedPnl: 1050,
        unrealizedPnlPercent: 2.22,
        margin: 23625,
        liquidationPrice: 3780,
        timestamp: Date.now() - 45 * 60 * 1000
      }
    ]
  });

  const [orders, setOrders] = useState<TradingOrder[]>([
    {
      id: 'order-1',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'limit',
      amount: 1.0,
      price: 44000,
      status: 'pending',
      timestamp: Date.now() - 10 * 60 * 1000
    },
    {
      id: 'order-2',
      symbol: 'ETH/USDT',
      side: 'sell',
      type: 'stop',
      amount: 5.0,
      stopPrice: 3000,
      status: 'pending',
      timestamp: Date.now() - 5 * 60 * 1000
    }
  ]);

  useEffect(() => {
    // Simulate real-time P&L updates
    const interval = setInterval(() => {
      setPortfolio(prev => ({
        ...prev,
        positions: prev.positions.map(position => {
          const priceChange = (Math.random() - 0.5) * 50;
          const newPrice = position.currentPrice + priceChange;
          const pnl = position.side === 'long'
            ? (newPrice - position.entryPrice) * position.size
            : (position.entryPrice - newPrice) * position.size;
          const pnlPercent = (pnl / (position.entryPrice * position.size)) * 100;

          return {
            ...position,
            currentPrice: newPrice,
            unrealizedPnl: pnl,
            unrealizedPnlPercent: pnlPercent
          };
        })
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const closePosition = (symbol: string) => {
    setPortfolio(prev => ({
      ...prev,
      positions: prev.positions.filter(pos => pos.symbol !== symbol)
    }));
  };

  const cancelOrder = (orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
  };

  return (
    <Card>
      <Stack>
        <Text fw={600}>Portfolio & Positions</Text>

        {/* Portfolio Overview */}
        <Paper withBorder p="md">
          <Grid>
            <Grid.Col span={3}>
              <Text size="xs" c="dimmed">Total Value</Text>
              <Text size="lg" fw={700}>
                ${portfolio.totalValue.toLocaleString()}
              </Text>
            </Grid.Col>
            <Grid.Col span={3}>
              <Text size="xs" c="dimmed">Available</Text>
              <Text size="lg" fw={700}>
                ${portfolio.availableBalance.toLocaleString()}
              </Text>
            </Grid.Col>
            <Grid.Col span={3}>
              <Text size="xs" c="dimmed">Margin Used</Text>
              <Text size="lg" fw={700}>
                ${portfolio.marginUsed.toLocaleString()}
              </Text>
            </Grid.Col>
            <Grid.Col span={3}>
              <Text size="xs" c="dimmed">Total P&L</Text>
              <Text size="lg" fw={700} c={portfolio.totalPnl >= 0 ? 'green' : 'red'}>
                ${portfolio.totalPnl.toLocaleString()} ({portfolio.totalPnlPercent.toFixed(1)}%)
              </Text>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Active Positions */}
        <Stack gap="sm">
          <Text size="sm" fw={500}>Active Positions</Text>
          {portfolio.positions.map((position, index) => (
            <Paper key={index} withBorder p="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Group gap="xs">
                    <Text fw={500}>{position.symbol}</Text>
                    <Badge color={position.side === 'long' ? 'green' : 'red'}>
                      {position.side.toUpperCase()}
                    </Badge>
                    <Text size="sm">Size: {position.size}</Text>
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c={position.unrealizedPnl >= 0 ? 'green' : 'red'} fw={500}>
                      ${position.unrealizedPnl.toFixed(2)} ({position.unrealizedPnlPercent.toFixed(2)}%)
                    </Text>
                    <ActionIcon color="red" variant="light" onClick={() => closePosition(position.symbol)}>
                      <IconX size={16} />
                    </ActionIcon>
                  </Group>
                </Group>

                <Grid>
                  <Grid.Col span={3}>
                    <Text size="xs" c="dimmed">Entry</Text>
                    <Text size="sm">${position.entryPrice.toFixed(2)}</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" c="dimmed">Current</Text>
                    <Text size="sm">${position.currentPrice.toFixed(2)}</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" c="dimmed">Margin</Text>
                    <Text size="sm">${position.margin.toLocaleString()}</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" c="dimmed">Liq. Price</Text>
                    <Text size="sm" c="red">${position.liquidationPrice?.toFixed(2)}</Text>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Paper>
          ))}
        </Stack>

        {/* Open Orders */}
        <Stack gap="sm">
          <Text size="sm" fw={500}>Open Orders</Text>
          {orders.map((order) => (
            <Paper key={order.id} withBorder p="sm">
              <Group justify="space-between">
                <Group gap="xs">
                  <Text size="sm" fw={500}>{order.symbol}</Text>
                  <Badge color={order.side === 'buy' ? 'green' : 'red'} size="sm">
                    {order.side.toUpperCase()}
                  </Badge>
                  <Badge variant="light" size="sm">
                    {order.type.toUpperCase()}
                  </Badge>
                  <Text size="sm">
                    {order.amount} @ ${order.price?.toFixed(2) || order.stopPrice?.toFixed(2)}
                  </Text>
                </Group>
                <ActionIcon color="red" variant="light" onClick={() => cancelOrder(order.id)}>
                  <IconX size={16} />
                </ActionIcon>
              </Group>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
};

// === RISK CALCULATOR COMPONENT ===

export const RiskCalculator: React.FC = () => {
  const [riskSettings, setRiskSettings] = useState({
    accountSize: 100000,
    riskPerTrade: 2,
    entryPrice: 45000,
    stopLoss: 44000,
    takeProfit: 47000
  });

  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    portfolioRisk: 15.5,
    maxDrawdown: -8.2,
    volatility: 24.5,
    varAtRisk: -3200,
    winRate: 65.8
  });

  const positionSizing = useMemo(() => {
    const riskAmount = riskSettings.accountSize * (riskSettings.riskPerTrade / 100);
    const priceRisk = Math.abs(riskSettings.entryPrice - riskSettings.stopLoss);
    const recommendedSize = priceRisk > 0 ? riskAmount / priceRisk : 0;
    const riskRewardRatio = Math.abs(riskSettings.takeProfit - riskSettings.entryPrice) / priceRisk;

    return {
      recommendedSize,
      riskAmount,
      riskRewardRatio,
      maxPosition: recommendedSize * 1.5
    };
  }, [riskSettings]);

  return (
    <Card>
      <Stack>
        <Text fw={600}>Risk Management</Text>

        {/* Risk Settings */}
        <Paper withBorder p="md">
          <Stack gap="md">
            <Text size="sm" fw={500}>Position Sizing Calculator</Text>
            
            <Grid>
              <Grid.Col span={6}>
                <NumberInput
                  label="Account Size"
                  value={riskSettings.accountSize}
                  onChange={(value) => setRiskSettings(prev => ({ ...prev, accountSize: value || 0 }))}
                  prefix="$"
                  thousandSeparator=","
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Risk per Trade (%)"
                  value={riskSettings.riskPerTrade}
                  onChange={(value) => setRiskSettings(prev => ({ ...prev, riskPerTrade: value || 0 }))}
                  min={0.1}
                  max={10}
                  step={0.1}
                  suffix="%"
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <NumberInput
                  label="Entry Price"
                  value={riskSettings.entryPrice}
                  onChange={(value) => setRiskSettings(prev => ({ ...prev, entryPrice: value || 0 }))}
                  prefix="$"
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <NumberInput
                  label="Stop Loss"
                  value={riskSettings.stopLoss}
                  onChange={(value) => setRiskSettings(prev => ({ ...prev, stopLoss: value || 0 }))}
                  prefix="$"
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <NumberInput
                  label="Take Profit"
                  value={riskSettings.takeProfit}
                  onChange={(value) => setRiskSettings(prev => ({ ...prev, takeProfit: value || 0 }))}
                  prefix="$"
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>

        {/* Position Sizing Results */}
        <Paper withBorder p="md" bg="blue.0">
          <Stack gap="sm">
            <Text size="sm" fw={500}>Recommended Position</Text>
            <Grid>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Position Size</Text>
                <Text size="lg" fw={700}>
                  {positionSizing.recommendedSize.toFixed(4)} BTC
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Risk Amount</Text>
                <Text size="lg" fw={700} c="red">
                  ${positionSizing.riskAmount.toLocaleString()}
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Risk:Reward Ratio</Text>
                <Text size="lg" fw={700} c={positionSizing.riskRewardRatio >= 2 ? 'green' : 'orange'}>
                  1:{positionSizing.riskRewardRatio.toFixed(1)}
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Max Position</Text>
                <Text size="lg" fw={700}>
                  {positionSizing.maxPosition.toFixed(4)} BTC
                </Text>
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>

        {/* Portfolio Risk Metrics */}
        <Paper withBorder p="md">
          <Stack gap="sm">
            <Text size="sm" fw={500}>Portfolio Risk Metrics</Text>
            <Grid>
              <Grid.Col span={6}>
                <Group gap="xs">
                  <RingProgress
                    size={60}
                    thickness={8}
                    sections={[{ value: riskMetrics.portfolioRisk, color: 'red' }]}
                    label={
                      <Text size="xs" ta="center">
                        {riskMetrics.portfolioRisk}%
                      </Text>
                    }
                  />
                  <div>
                    <Text size="xs" c="dimmed">Portfolio Risk</Text>
                    <Text size="sm" fw={500}>{riskMetrics.portfolioRisk}%</Text>
                  </div>
                </Group>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Max Drawdown</Text>
                <Text size="sm" fw={500} c="red">{riskMetrics.maxDrawdown}%</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Volatility (30d)</Text>
                <Text size="sm" fw={500}>{riskMetrics.volatility}%</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Win Rate</Text>
                <Text size="sm" fw={500} c="green">{riskMetrics.winRate}%</Text>
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>

        {/* Risk Alerts */}
        {positionSizing.riskRewardRatio < 2 && (
          <Alert color="orange" icon={<IconShield />}>
            Risk:Reward ratio is below 2:1. Consider adjusting your take profit or stop loss levels.
          </Alert>
        )}
        
        {riskSettings.riskPerTrade > 5 && (
          <Alert color="red" icon={<IconTargetArrow />}>
            Risk per trade exceeds 5%. This may lead to significant portfolio drawdowns.
          </Alert>
        )}
      </Stack>
    </Card>
  );
};

// === MAIN COMPONENT ===

export default function TradingInterfacePatterns() {
  const [activeSymbol, setActiveSymbol] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('1h');

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Text size="xl" fw={700}>Trading Interface</Text>
        <Group gap="xs">
          <Select
            value={activeSymbol}
            onChange={(value) => setActiveSymbol(value!)}
            data={['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT']}
          />
          <Badge leftSection={<IconActivity size={14} />} color="green">
            Live
          </Badge>
        </Group>
      </Group>

      <Tabs defaultValue="trading">
        <Tabs.List>
          <Tabs.Tab value="trading" leftSection={<IconChartCandle size={16} />}>
            Trading
          </Tabs.Tab>
          <Tabs.Tab value="portfolio" leftSection={<IconWallet size={16} />}>
            Portfolio
          </Tabs.Tab>
          <Tabs.Tab value="risk" leftSection={<IconShield size={16} />}>
            Risk Management
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="trading" pt="lg">
          <Grid>
            <Grid.Col span={12} lg={8}>
              <Stack gap="lg">
                <TradingChart symbol={activeSymbol} timeframe={timeframe} />
              </Stack>
            </Grid.Col>
            <Grid.Col span={12} lg={4}>
              <OrderBook symbol={activeSymbol} />
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="portfolio" pt="lg">
          <PositionManager />
        </Tabs.Panel>

        <Tabs.Panel value="risk" pt="lg">
          <RiskCalculator />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}