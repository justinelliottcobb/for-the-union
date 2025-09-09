import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Text,
  Group,
  Stack,
  Button,
  Badge,
  NumberInput,
  Select,
  Progress,
  Alert,
  Tabs,
  Grid,
  Paper,
  Table,
  ActionIcon,
  Tooltip,
  Switch,
  Slider
} from '@mantine/core';
import {
  IconArrowsRightLeft,
  IconCoins,
  IconTrendingUp,
  IconShield,
  IconAlertTriangle,
  IconRefresh,
  IconSettings,
  IconGasStation,
  IconRocket,
  IconLock,
  IconUnlock,
  IconChartBar
} from '@tabler/icons-react';

// === TYPES AND INTERFACES ===

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  balance?: string;
  price?: number;
}

interface ProtocolConfig {
  name: string;
  contractAddress: string;
  abi: any[];
  fee: number;
  tvl: number;
  gasMultiplier: number;
}

interface RouteResult {
  protocol: string;
  path: string[];
  amountOut: string;
  priceImpact: number;
  gasEstimate: string;
  effectiveRate: number;
}

interface LiquidityPosition {
  protocol: string;
  pair: string;
  liquidity: string;
  token0Amount: string;
  token1Amount: string;
  token0Symbol: string;
  token1Symbol: string;
  fees24h: string;
  impermanentLoss: string;
  apy: number;
  createdAt: number;
}

interface YieldStrategy {
  protocol: string;
  asset: string;
  apy: number;
  risk: 'low' | 'medium' | 'high';
  tvl: number;
  rewards: RewardToken[];
}

interface RewardToken {
  symbol: string;
  apy: number;
  price: number;
}

// === PROTOCOL ROUTER CLASS ===

class ProtocolRouter {
  private protocols: Map<string, ProtocolConfig> = new Map();

  constructor() {
    // Initialize with major DeFi protocols
    this.protocols.set('uniswap-v2', {
      name: 'Uniswap V2',
      contractAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      abi: [],
      fee: 0.3,
      tvl: 2500000000, // $2.5B
      gasMultiplier: 1.0
    });

    this.protocols.set('uniswap-v3', {
      name: 'Uniswap V3',
      contractAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      abi: [],
      fee: 0.05, // Variable
      tvl: 4000000000, // $4B
      gasMultiplier: 1.2
    });

    this.protocols.set('sushiswap', {
      name: 'SushiSwap',
      contractAddress: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      abi: [],
      fee: 0.3,
      tvl: 800000000, // $800M
      gasMultiplier: 1.1
    });

    this.protocols.set('1inch', {
      name: '1inch',
      contractAddress: '0x1111111254EEB25477B68fb85Ed929f73A960582',
      abi: [],
      fee: 0.0, // Aggregator
      tvl: 0,
      gasMultiplier: 0.9
    });
  }

  async findBestRoute(
    tokenIn: string,
    tokenOut: string,
    amount: string,
    maxSlippage: number
  ): Promise<RouteResult[]> {
    const routes: RouteResult[] = [];

    // Simulate route finding across protocols
    for (const [key, protocol] of this.protocols) {
      try {
        // Simulate API calls to different protocols
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300));

        const mockAmountOut = this.calculateMockOutput(amount, protocol.fee);
        const priceImpact = this.calculatePriceImpact(amount, tokenIn, tokenOut);
        
        routes.push({
          protocol: protocol.name,
          path: [tokenIn, tokenOut],
          amountOut: mockAmountOut,
          priceImpact,
          gasEstimate: (50000 * protocol.gasMultiplier).toFixed(0),
          effectiveRate: parseFloat(mockAmountOut) / parseFloat(amount)
        });
      } catch (error) {
        console.warn(`Route finding failed for ${protocol.name}:`, error);
      }
    }

    // Sort by best effective rate (accounting for gas costs)
    return routes.sort((a, b) => b.effectiveRate - a.effectiveRate);
  }

  private calculateMockOutput(amountIn: string, fee: number): string {
    const input = parseFloat(amountIn);
    const output = input * (1 - fee / 100) * (0.98 + Math.random() * 0.04);
    return output.toFixed(6);
  }

  private calculatePriceImpact(amount: string, tokenIn: string, tokenOut: string): number {
    // Simulate price impact calculation
    const amountFloat = parseFloat(amount);
    return Math.min(amountFloat / 100000 * (0.5 + Math.random() * 2), 15);
  }

  async executeSwap(
    route: RouteResult,
    userAddress: string,
    maxSlippage: number
  ): Promise<{ hash: string; status: 'pending' | 'confirmed' | 'failed' }> {
    // Simulate swap execution with MEV protection
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      hash: '0x' + Math.random().toString(16).substr(2, 64),
      status: Math.random() > 0.1 ? 'confirmed' : 'failed'
    };
  }
}

// === SWAP INTERFACE COMPONENT ===

interface SwapInterfaceProps {
  defaultTokenIn?: string;
  defaultTokenOut?: string;
  maxSlippage?: number;
}

export const SwapInterface: React.FC<SwapInterfaceProps> = ({
  maxSlippage = 0.5
}) => {
  const [tokenIn, setTokenIn] = useState<Token>({
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: '',
    balance: '1000.0'
  });
  
  const [tokenOut, setTokenOut] = useState<Token>({
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logoURI: '',
    balance: '0.0'
  });

  const [amountIn, setAmountIn] = useState<string>('100');
  const [amountOut, setAmountOut] = useState<string>('');
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [slippage, setSlippage] = useState(maxSlippage);
  const [mevProtection, setMevProtection] = useState(true);

  const router = useMemo(() => new ProtocolRouter(), []);

  const fetchRoutes = useCallback(async () => {
    if (!amountIn || parseFloat(amountIn) <= 0) return;

    setIsLoading(true);
    try {
      const foundRoutes = await router.findBestRoute(
        tokenIn.address,
        tokenOut.address,
        amountIn,
        slippage
      );
      
      setRoutes(foundRoutes);
      if (foundRoutes.length > 0) {
        setSelectedRoute(foundRoutes[0]);
        setAmountOut(foundRoutes[0].amountOut);
      }
    } catch (error) {
      console.error('Route finding failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [amountIn, tokenIn.address, tokenOut.address, slippage, router]);

  useEffect(() => {
    const debounce = setTimeout(fetchRoutes, 500);
    return () => clearTimeout(debounce);
  }, [fetchRoutes]);

  const handleSwap = async () => {
    if (!selectedRoute) return;

    try {
      const result = await router.executeSwap(
        selectedRoute,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        slippage
      );
      
      console.log('Swap executed:', result);
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  const swapTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setAmountIn(amountOut);
    setAmountOut('');
  };

  return (
    <Card>
      <Stack>
        <Group justify="space-between">
          <Text fw={600}>DeFi Swap Interface</Text>
          <Group gap="xs">
            <ActionIcon variant="subtle" onClick={() => setSlippage(0.5)}>
              <IconSettings size={16} />
            </ActionIcon>
            <Switch
              label="MEV Protection"
              checked={mevProtection}
              onChange={(e) => setMevProtection(e.target.checked)}
              size="sm"
            />
          </Group>
        </Group>

        {/* From Token */}
        <Paper withBorder p="md">
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">From</Text>
              <Text size="sm" c="dimmed">Balance: {tokenIn.balance}</Text>
            </Group>
            <Group>
              <NumberInput
                value={amountIn}
                onChange={(value) => setAmountIn(value?.toString() || '0')}
                placeholder="0.0"
                style={{ flex: 1 }}
                min={0}
                decimalScale={6}
              />
              <Badge variant="light" size="lg">
                {tokenIn.symbol}
              </Badge>
            </Group>
          </Stack>
        </Paper>

        {/* Swap Direction */}
        <Group justify="center">
          <ActionIcon
            variant="filled"
            size="lg"
            onClick={swapTokens}
            disabled={isLoading}
          >
            <IconArrowsRightLeft size={20} />
          </ActionIcon>
        </Group>

        {/* To Token */}
        <Paper withBorder p="md">
          <Stack gap="sm">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">To</Text>
              <Text size="sm" c="dimmed">Balance: {tokenOut.balance}</Text>
            </Group>
            <Group>
              <NumberInput
                value={amountOut}
                readOnly
                placeholder="0.0"
                style={{ flex: 1 }}
                decimalScale={6}
              />
              <Badge variant="light" size="lg">
                {tokenOut.symbol}
              </Badge>
            </Group>
          </Stack>
        </Paper>

        {/* Route Selection */}
        {routes.length > 0 && (
          <Paper withBorder p="md">
            <Stack gap="sm">
              <Text size="sm" fw={500}>Best Routes</Text>
              {routes.slice(0, 3).map((route, index) => (
                <Paper
                  key={route.protocol}
                  withBorder
                  p="sm"
                  style={{
                    cursor: 'pointer',
                    borderColor: selectedRoute?.protocol === route.protocol ? 'var(--mantine-color-blue-6)' : undefined
                  }}
                  onClick={() => {
                    setSelectedRoute(route);
                    setAmountOut(route.amountOut);
                  }}
                >
                  <Group justify="space-between">
                    <Group gap="xs">
                      <Badge variant="dot" size="sm">
                        {route.protocol}
                      </Badge>
                      <Text size="sm">{route.amountOut} {tokenOut.symbol}</Text>
                    </Group>
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">
                        Impact: {route.priceImpact.toFixed(2)}%
                      </Text>
                      <Text size="xs" c="dimmed">
                        Gas: {route.gasEstimate}
                      </Text>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Slippage Settings */}
        <Paper withBorder p="md">
          <Stack gap="sm">
            <Text size="sm" fw={500}>Slippage Tolerance</Text>
            <Group>
              {[0.1, 0.5, 1.0].map((value) => (
                <Button
                  key={value}
                  size="xs"
                  variant={slippage === value ? 'filled' : 'light'}
                  onClick={() => setSlippage(value)}
                >
                  {value}%
                </Button>
              ))}
              <NumberInput
                size="xs"
                value={slippage}
                onChange={(value) => setSlippage(value || 0.5)}
                min={0.01}
                max={50}
                step={0.1}
                style={{ width: 80 }}
                decimalScale={2}
              />
            </Group>
          </Stack>
        </Paper>

        <Button
          onClick={handleSwap}
          disabled={!selectedRoute || isLoading}
          loading={isLoading}
          leftSection={<IconArrowsRightLeft size={20} />}
          fullWidth
          size="lg"
        >
          {isLoading ? 'Finding Best Route...' : 'Swap Tokens'}
        </Button>
      </Stack>
    </Card>
  );
};

// === LIQUIDITY PROVIDER COMPONENT ===

export const LiquidityProvider: React.FC = () => {
  const [positions, setPositions] = useState<LiquidityPosition[]>([
    {
      protocol: 'Uniswap V3',
      pair: 'USDC/WETH',
      liquidity: '45632.123',
      token0Amount: '25000',
      token1Amount: '12.5',
      token0Symbol: 'USDC',
      token1Symbol: 'WETH',
      fees24h: '125.50',
      impermanentLoss: '-2.3',
      apy: 15.2,
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000
    },
    {
      protocol: 'SushiSwap',
      pair: 'WBTC/WETH',
      liquidity: '12845.67',
      token0Amount: '0.8',
      token1Amount: '12.1',
      token0Symbol: 'WBTC',
      token1Symbol: 'WETH',
      fees24h: '78.25',
      impermanentLoss: '1.1',
      apy: 22.8,
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000
    }
  ]);

  const [newPosition, setNewPosition] = useState({
    protocol: 'uniswap-v3',
    token0: 'USDC',
    token1: 'WETH',
    amount0: '',
    amount1: ''
  });

  const calculateImpermanentLoss = (priceChange: number): number => {
    const k = priceChange;
    return (2 * Math.sqrt(k) / (1 + k) - 1) * 100;
  };

  const addLiquidity = async () => {
    if (!newPosition.amount0 || !newPosition.amount1) return;

    // Simulate adding liquidity
    const position: LiquidityPosition = {
      protocol: newPosition.protocol,
      pair: `${newPosition.token0}/${newPosition.token1}`,
      liquidity: (parseFloat(newPosition.amount0) + parseFloat(newPosition.amount1) * 2000).toString(),
      token0Amount: newPosition.amount0,
      token1Amount: newPosition.amount1,
      token0Symbol: newPosition.token0,
      token1Symbol: newPosition.token1,
      fees24h: '0',
      impermanentLoss: '0',
      apy: 8.5 + Math.random() * 20,
      createdAt: Date.now()
    };

    setPositions(prev => [position, ...prev]);
    setNewPosition({ protocol: 'uniswap-v3', token0: 'USDC', token1: 'WETH', amount0: '', amount1: '' });
  };

  return (
    <Card>
      <Stack>
        <Text fw={600}>Liquidity Positions</Text>

        {/* Add New Position */}
        <Paper withBorder p="md">
          <Stack gap="sm">
            <Text size="sm" fw={500}>Add Liquidity</Text>
            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Protocol"
                  value={newPosition.protocol}
                  onChange={(value) => setNewPosition(prev => ({ ...prev, protocol: value! }))}
                  data={[
                    { value: 'uniswap-v3', label: 'Uniswap V3' },
                    { value: 'uniswap-v2', label: 'Uniswap V2' },
                    { value: 'sushiswap', label: 'SushiSwap' }
                  ]}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Pair"
                  value={`${newPosition.token0}/${newPosition.token1}`}
                  data={[
                    { value: 'USDC/WETH', label: 'USDC/WETH' },
                    { value: 'WBTC/WETH', label: 'WBTC/WETH' },
                    { value: 'DAI/USDC', label: 'DAI/USDC' }
                  ]}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label={`${newPosition.token0} Amount`}
                  value={newPosition.amount0}
                  onChange={(value) => setNewPosition(prev => ({ ...prev, amount0: value?.toString() || '' }))}
                  placeholder="0.0"
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label={`${newPosition.token1} Amount`}
                  value={newPosition.amount1}
                  onChange={(value) => setNewPosition(prev => ({ ...prev, amount1: value?.toString() || '' }))}
                  placeholder="0.0"
                />
              </Grid.Col>
            </Grid>
            <Button onClick={addLiquidity} disabled={!newPosition.amount0 || !newPosition.amount1}>
              Add Liquidity
            </Button>
          </Stack>
        </Paper>

        {/* Existing Positions */}
        <Stack gap="sm">
          {positions.map((position, index) => (
            <Paper key={index} withBorder p="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Group gap="xs">
                    <Badge variant="dot">{position.protocol}</Badge>
                    <Text fw={500}>{position.pair}</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge color="green">APY: {position.apy.toFixed(1)}%</Badge>
                    <Badge color={parseFloat(position.impermanentLoss) < 0 ? 'red' : 'green'}>
                      IL: {position.impermanentLoss}%
                    </Badge>
                  </Group>
                </Group>

                <Grid>
                  <Grid.Col span={3}>
                    <Text size="xs" c="dimmed">Total Value</Text>
                    <Text size="sm" fw={500}>${parseFloat(position.liquidity).toLocaleString()}</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" c="dimmed">24h Fees</Text>
                    <Text size="sm" fw={500}>${position.fees24h}</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" c="dimmed">{position.token0Symbol}</Text>
                    <Text size="sm" fw={500}>{position.token0Amount}</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="xs" c="dimmed">{position.token1Symbol}</Text>
                    <Text size="sm" fw={500}>{position.token1Amount}</Text>
                  </Grid.Col>
                </Grid>

                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Created {Math.floor((Date.now() - position.createdAt) / (24 * 60 * 60 * 1000))} days ago
                  </Text>
                  <Group gap="xs">
                    <Button size="xs" variant="light">Collect Fees</Button>
                    <Button size="xs" variant="light" color="red">Remove</Button>
                  </Group>
                </Group>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
};

// === YIELD CALCULATOR COMPONENT ===

export const YieldCalculator: React.FC = () => {
  const [strategies, setStrategies] = useState<YieldStrategy[]>([
    {
      protocol: 'Aave',
      asset: 'USDC',
      apy: 4.2,
      risk: 'low',
      tvl: 8500000000,
      rewards: [{ symbol: 'AAVE', apy: 2.1, price: 85.50 }]
    },
    {
      protocol: 'Compound',
      asset: 'WETH',
      apy: 2.8,
      risk: 'low',
      tvl: 5200000000,
      rewards: [{ symbol: 'COMP', apy: 1.9, price: 45.20 }]
    },
    {
      protocol: 'Yearn',
      asset: 'YFI',
      apy: 18.5,
      risk: 'high',
      tvl: 850000000,
      rewards: [{ symbol: 'YFI', apy: 12.3, price: 8500.00 }]
    },
    {
      protocol: 'Curve',
      asset: '3CRV',
      apy: 12.7,
      risk: 'medium',
      tvl: 3400000000,
      rewards: [
        { symbol: 'CRV', apy: 8.2, price: 0.95 },
        { symbol: 'CVX', apy: 4.5, price: 3.20 }
      ]
    }
  ]);

  const [calculator, setCalculator] = useState({
    asset: 'USDC',
    amount: '10000',
    duration: 365, // days
    selectedStrategy: strategies[0]
  });

  const calculateYield = useMemo(() => {
    const principal = parseFloat(calculator.amount);
    const apy = calculator.selectedStrategy.apy;
    const days = calculator.duration;
    
    // Compound interest calculation
    const dailyRate = apy / 100 / 365;
    const compoundYield = principal * Math.pow(1 + dailyRate, days) - principal;
    
    // Reward token calculations
    const rewardValue = calculator.selectedStrategy.rewards.reduce((total, reward) => {
      return total + (principal * reward.apy / 100 / 365 * days);
    }, 0);

    return {
      baseYield: compoundYield,
      rewardYield: rewardValue,
      totalYield: compoundYield + rewardValue,
      finalAmount: principal + compoundYield + rewardValue
    };
  }, [calculator]);

  return (
    <Card>
      <Stack>
        <Text fw={600}>Yield Calculator</Text>

        {/* Calculator Inputs */}
        <Paper withBorder p="md">
          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Asset"
                value={calculator.asset}
                onChange={(value) => setCalculator(prev => ({ ...prev, asset: value! }))}
                data={['USDC', 'WETH', 'WBTC', 'DAI', 'YFI']}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Amount"
                value={calculator.amount}
                onChange={(value) => setCalculator(prev => ({ ...prev, amount: value?.toString() || '0' }))}
                placeholder="10000"
                prefix="$"
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Stack gap="xs">
                <Text size="sm" fw={500}>Duration: {calculator.duration} days</Text>
                <Slider
                  value={calculator.duration}
                  onChange={(value) => setCalculator(prev => ({ ...prev, duration: value }))}
                  min={1}
                  max={365}
                  marks={[
                    { value: 7, label: '1W' },
                    { value: 30, label: '1M' },
                    { value: 90, label: '3M' },
                    { value: 180, label: '6M' },
                    { value: 365, label: '1Y' }
                  ]}
                />
              </Stack>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Strategy Selection */}
        <Paper withBorder p="md">
          <Stack gap="sm">
            <Text size="sm" fw={500}>Select Strategy</Text>
            {strategies.map((strategy, index) => (
              <Paper
                key={index}
                withBorder
                p="sm"
                style={{
                  cursor: 'pointer',
                  borderColor: calculator.selectedStrategy === strategy ? 'var(--mantine-color-blue-6)' : undefined
                }}
                onClick={() => setCalculator(prev => ({ ...prev, selectedStrategy: strategy }))}
              >
                <Group justify="space-between">
                  <Group gap="xs">
                    <Badge variant="dot">{strategy.protocol}</Badge>
                    <Text size="sm">{strategy.asset}</Text>
                    <Badge
                      color={strategy.risk === 'low' ? 'green' : strategy.risk === 'medium' ? 'yellow' : 'red'}
                      size="sm"
                    >
                      {strategy.risk} risk
                    </Badge>
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" fw={500}>{strategy.apy}% APY</Text>
                    <Text size="xs" c="dimmed">
                      TVL: ${(strategy.tvl / 1e9).toFixed(1)}B
                    </Text>
                  </Group>
                </Group>
                {strategy.rewards.length > 0 && (
                  <Group gap="xs" mt="xs">
                    <Text size="xs" c="dimmed">Rewards:</Text>
                    {strategy.rewards.map((reward, i) => (
                      <Badge key={i} variant="light" size="xs">
                        {reward.symbol}: +{reward.apy}%
                      </Badge>
                    ))}
                  </Group>
                )}
              </Paper>
            ))}
          </Stack>
        </Paper>

        {/* Results */}
        <Paper withBorder p="md" bg="blue.0">
          <Stack gap="sm">
            <Text size="sm" fw={500}>Projected Returns</Text>
            <Grid>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Base Yield</Text>
                <Text size="lg" fw={700} c="green">
                  ${calculateYield.baseYield.toFixed(2)}
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Reward Tokens</Text>
                <Text size="lg" fw={700} c="blue">
                  ${calculateYield.rewardYield.toFixed(2)}
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Total Yield</Text>
                <Text size="xl" fw={700} c="green">
                  ${calculateYield.totalYield.toFixed(2)}
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Final Amount</Text>
                <Text size="xl" fw={700}>
                  ${calculateYield.finalAmount.toFixed(2)}
                </Text>
              </Grid.Col>
            </Grid>
            
            <Alert color="orange" icon={<IconAlertTriangle />}>
              <Text size="sm">
                Yield calculations are estimates and subject to market conditions, 
                smart contract risks, and impermanent loss for liquidity positions.
              </Text>
            </Alert>
          </Stack>
        </Paper>
      </Stack>
    </Card>
  );
};

// === MAIN COMPONENT ===

export default function DefiProtocolIntegration() {
  return (
    <Stack gap="lg">
      <Text size="xl" fw={700}>DeFi Protocol Integration</Text>

      <Tabs defaultValue="swap">
        <Tabs.List>
          <Tabs.Tab value="swap" leftSection={<IconArrowsRightLeft size={16} />}>
            Token Swaps
          </Tabs.Tab>
          <Tabs.Tab value="liquidity" leftSection={<IconCoins size={16} />}>
            Liquidity
          </Tabs.Tab>
          <Tabs.Tab value="yield" leftSection={<IconTrendingUp size={16} />}>
            Yield Farming
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="swap" pt="lg">
          <SwapInterface />
        </Tabs.Panel>

        <Tabs.Panel value="liquidity" pt="lg">
          <LiquidityProvider />
        </Tabs.Panel>

        <Tabs.Panel value="yield" pt="lg">
          <YieldCalculator />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}