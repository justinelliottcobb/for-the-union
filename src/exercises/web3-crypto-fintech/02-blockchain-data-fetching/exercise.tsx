import * as React from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Card, 
  Text, 
  Group, 
  Stack, 
  Badge, 
  Table, 
  Loader, 
  Alert, 
  Button,
  Avatar,
  Progress,
  ScrollArea,
  Tabs,
  Grid,
  Paper
} from '@mantine/core';
import { 
  IconRefresh, 
  IconAlertCircle, 
  IconArrowUp, 
  IconArrowDown,
  IconClock,
  IconDatabase,
  IconNetwork,
  IconCoin
} from '@tabler/icons-react';
import { useQuery, useQueries, QueryClient, QueryClientProvider } from '@tanstack/react-query';

// === TYPES AND INTERFACES ===

interface RPCProvider {
  url: string;
  name: string;
  priority: number;
  healthy: boolean;
  responseTime: number;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  timestamp: number;
  blockNumber: number;
  status: 'pending' | 'confirmed' | 'failed';
}

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance?: string;
  usdValue?: number;
}

interface BlockchainProviderConfig {
  primaryRpc: string;
  fallbackRpcs: string[];
  maxRetries: number;
  cacheTime: number;
  requestsPerSecond: number;
}

// === BLOCKCHAIN PROVIDER CLASS ===

class BlockchainProvider {
  private providers: RPCProvider[] = [];
  private currentProviderIndex = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestCount = 0;
  private lastRequestTime = Date.now();

  constructor(config: BlockchainProviderConfig) {
    // Initialize providers
    this.providers = [
      { url: config.primaryRpc, name: 'Primary', priority: 1, healthy: true, responseTime: 0 },
      ...config.fallbackRpcs.map((url, i) => ({
        url,
        name: `Fallback ${i + 1}`,
        priority: i + 2,
        healthy: true,
        responseTime: 0
      }))
    ];
  }

  async fetchWithFallback<T>(method: string, params: any[]): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[this.currentProviderIndex];
      
      if (!provider.healthy) {
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
        continue;
      }

      try {
        const startTime = Date.now();
        
        // Simulate RPC call
        const result = await this.simulateRPCCall<T>(method, params);
        
        // Update metrics
        provider.responseTime = Date.now() - startTime;
        provider.healthy = true;
        
        return result;
      } catch (error) {
        lastError = error as Error;
        provider.healthy = false;
        
        // Move to next provider
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
      }
    }

    throw lastError || new Error('All providers failed');
  }

  private async simulateRPCCall<T>(method: string, params: any[]): Promise<T> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // Simulate different RPC methods
    switch (method) {
      case 'eth_getBalance':
        return '1234567890123456789' as any;
      
      case 'eth_getTransactionCount':
        return '42' as any;
      
      case 'eth_getBlockNumber':
        return '0x' + (15000000 + Math.floor(Math.random() * 1000)).toString(16) as any;
      
      case 'eth_getTransactionReceipt':
        return {
          status: '0x1',
          blockNumber: '0xe4b8d0',
          gasUsed: '0x5208'
        } as any;
      
      default:
        return {} as T;
    }
  }

  async rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.requestQueue.length > 0) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      const minInterval = 1000 / 10; // 10 requests per second

      if (timeSinceLastRequest < minInterval) {
        await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastRequest));
      }

      const request = this.requestQueue.shift();
      if (request) {
        await request();
        this.lastRequestTime = Date.now();
        this.requestCount++;
      }
    }

    this.processing = false;
  }

  getProviderStats() {
    return this.providers.map(p => ({
      ...p,
      requestCount: this.requestCount
    }));
  }
}

// === REACT QUERY SETUP ===

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 300000, // 5 minutes
      refetchInterval: false,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});

// === CUSTOM HOOKS ===

const blockchainProvider = new BlockchainProvider({
  primaryRpc: 'https://eth-mainnet.alchemyapi.io/v2/demo',
  fallbackRpcs: [
    'https://mainnet.infura.io/v3/demo',
    'https://eth-mainnet.public.blastapi.io'
  ],
  maxRetries: 3,
  cacheTime: 300000,
  requestsPerSecond: 10
});

const useBlockchainQuery = <T,>(
  queryKey: any[],
  method: string,
  params: any[],
  options?: {
    staleTime?: number;
    refetchInterval?: number | false;
  }
) => {
  return useQuery({
    queryKey,
    queryFn: () => blockchainProvider.fetchWithFallback<T>(method, params),
    staleTime: options?.staleTime,
    refetchInterval: options?.refetchInterval
  });
};

const useTransactionHistory = (address: string, limit = 10) => {
  return useQuery({
    queryKey: ['transactions', address, limit],
    queryFn: async () => {
      // Simulate fetching transaction history
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return Array.from({ length: limit }, (_, i) => ({
        hash: '0x' + Math.random().toString(16).substr(2, 64),
        from: i % 2 === 0 ? address : '0x' + Math.random().toString(16).substr(2, 40),
        to: i % 2 === 1 ? address : '0x' + Math.random().toString(16).substr(2, 40),
        value: (Math.random() * 10).toFixed(4),
        gasUsed: (21000 + Math.random() * 100000).toFixed(0),
        timestamp: Date.now() - i * 3600000,
        blockNumber: 15000000 - i * 100,
        status: 'confirmed' as const
      }));
    },
    staleTime: 60000 // 1 minute
  });
};

const useTokenBalance = (tokenAddress: string, userAddress: string) => {
  const [balance, setBalance] = useState('0');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Simulate initial balance fetch
    const fetchBalance = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      setBalance((Math.random() * 1000).toFixed(2));
    };
    
    fetchBalance();

    // Simulate real-time updates
    const interval = setInterval(() => {
      if (isSubscribed) {
        setBalance(prev => (parseFloat(prev) + Math.random() * 10 - 5).toFixed(2));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [tokenAddress, userAddress, isSubscribed]);

  return { balance, isSubscribed, setIsSubscribed };
};

const useMultipleTokenBalances = (tokens: Token[], userAddress: string) => {
  return useQueries({
    queries: tokens.map(token => ({
      queryKey: ['balance', token.address, userAddress],
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        return {
          ...token,
          balance: (Math.random() * 1000).toFixed(2),
          usdValue: Math.random() * 10000
        };
      },
      staleTime: 30000
    }))
  });
};

// === TRANSACTION HISTORY COMPONENT ===

export const TransactionHistory: React.FC<{ address: string }> = ({ address }) => {
  const { data: transactions, isLoading, error, refetch } = useTransactionHistory(address);

  if (isLoading) {
    return (
      <Card>
        <Group justify="center" p="lg">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Loading transactions...</Text>
        </Group>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert color="red" icon={<IconAlertCircle />}>
        Failed to load transactions
      </Alert>
    );
  }

  return (
    <Card>
      <Stack>
        <Group justify="space-between">
          <Text fw={600}>Transaction History</Text>
          <Button size="xs" variant="subtle" onClick={() => refetch()}>
            <IconRefresh size={16} />
          </Button>
        </Group>

        <ScrollArea h={400}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Type</Table.Th>
                <Table.Th>Hash</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th>Time</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {transactions?.map((tx) => (
                <Table.Tr key={tx.hash}>
                  <Table.Td>
                    {tx.from.toLowerCase() === address.toLowerCase() ? (
                      <Badge color="red" leftSection={<IconArrowUp size={12} />}>
                        Sent
                      </Badge>
                    ) : (
                      <Badge color="green" leftSection={<IconArrowDown size={12} />}>
                        Received
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" style={{ fontFamily: 'monospace' }}>
                      {tx.hash.slice(0, 10)}...
                    </Text>
                  </Table.Td>
                  <Table.Td>{tx.value} ETH</Table.Td>
                  <Table.Td>
                    <Text size="xs">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="green" size="sm">
                      {tx.status}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>
    </Card>
  );
};

// === BALANCE DISPLAY COMPONENT ===

export const BalanceDisplay: React.FC<{ tokenAddress: string; userAddress: string }> = ({
  tokenAddress,
  userAddress
}) => {
  const { balance, isSubscribed, setIsSubscribed } = useTokenBalance(tokenAddress, userAddress);
  const { data: blockNumber } = useBlockchainQuery<string>(
    ['blockNumber'],
    'eth_getBlockNumber',
    [],
    { refetchInterval: 12000 }
  );

  return (
    <Card>
      <Stack>
        <Group justify="space-between">
          <Text fw={600}>Balance Monitor</Text>
          <Button
            size="xs"
            variant={isSubscribed ? 'filled' : 'light'}
            onClick={() => setIsSubscribed(!isSubscribed)}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </Button>
        </Group>

        <Paper withBorder p="md">
          <Group justify="space-between">
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Token Balance</Text>
              <Text size="xl" fw={700}>{balance} USDC</Text>
              <Text size="xs" c="dimmed">
                ≈ ${(parseFloat(balance) * 1.0).toFixed(2)} USD
              </Text>
            </Stack>
            {isSubscribed && (
              <Badge color="green" variant="dot">
                Live
              </Badge>
            )}
          </Group>
        </Paper>

        {blockNumber && (
          <Group justify="space-between">
            <Text size="xs" c="dimmed">Latest Block</Text>
            <Text size="xs" fw={500}>
              {parseInt(blockNumber, 16).toLocaleString()}
            </Text>
          </Group>
        )}
      </Stack>
    </Card>
  );
};

// === TOKEN LIST COMPONENT ===

export const TokenList: React.FC<{ userAddress: string }> = ({ userAddress }) => {
  const tokens: Token[] = [
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether', decimals: 6 },
    { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai', decimals: 18 },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 }
  ];

  const balanceQueries = useMultipleTokenBalances(tokens, userAddress);
  const allLoaded = balanceQueries.every(q => !q.isLoading);
  const totalValue = balanceQueries.reduce((sum, q) => sum + (q.data?.usdValue || 0), 0);

  return (
    <Card>
      <Stack>
        <Group justify="space-between">
          <Text fw={600}>Token Balances</Text>
          <Badge leftSection={<IconCoin size={14} />}>
            ${totalValue.toFixed(2)}
          </Badge>
        </Group>

        {!allLoaded && <Progress value={balanceQueries.filter(q => !q.isLoading).length / tokens.length * 100} />}

        <Stack gap="sm">
          {balanceQueries.map((query, index) => {
            const token = tokens[index];
            
            if (query.isLoading) {
              return (
                <Paper key={token.address} withBorder p="sm">
                  <Group justify="space-between">
                    <Loader size="xs" />
                    <Text size="sm" c="dimmed">Loading {token.symbol}...</Text>
                  </Group>
                </Paper>
              );
            }

            const data = query.data;
            
            return (
              <Paper key={token.address} withBorder p="sm">
                <Group justify="space-between">
                  <Group gap="sm">
                    <Avatar size="sm" color="blue">
                      {token.symbol[0]}
                    </Avatar>
                    <div>
                      <Text size="sm" fw={500}>{token.symbol}</Text>
                      <Text size="xs" c="dimmed">{token.name}</Text>
                    </div>
                  </Group>
                  <div style={{ textAlign: 'right' }}>
                    <Text size="sm" fw={500}>{data?.balance || '0'}</Text>
                    <Text size="xs" c="dimmed">
                      ${data?.usdValue?.toFixed(2) || '0.00'}
                    </Text>
                  </div>
                </Group>
              </Paper>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
};

// === BLOCKCHAIN PROVIDER STATS ===

export const ProviderStats: React.FC = () => {
  const [stats, setStats] = useState(blockchainProvider.getProviderStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(blockchainProvider.getProviderStats());
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <Stack>
        <Text fw={600}>RPC Provider Status</Text>
        
        {stats.map((provider) => (
          <Paper key={provider.name} withBorder p="sm">
            <Group justify="space-between">
              <Group gap="sm">
                <IconNetwork size={20} />
                <div>
                  <Text size="sm" fw={500}>{provider.name}</Text>
                  <Text size="xs" c="dimmed">{provider.url.slice(0, 30)}...</Text>
                </div>
              </Group>
              <Group gap="xs">
                <Badge color={provider.healthy ? 'green' : 'red'}>
                  {provider.healthy ? 'Healthy' : 'Down'}
                </Badge>
                {provider.responseTime > 0 && (
                  <Badge variant="light">
                    {provider.responseTime}ms
                  </Badge>
                )}
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Card>
  );
};

// === MAIN COMPONENT ===

export default function BlockchainDataFetching() {
  const userAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7';

  return (
    <QueryClientProvider client={queryClient}>
      <Stack gap="lg">
        <Text size="xl" fw={700}>Blockchain Data Fetching</Text>
        
        <Tabs defaultValue="transactions">
          <Tabs.List>
            <Tabs.Tab value="transactions" leftSection={<IconClock size={16} />}>
              Transactions
            </Tabs.Tab>
            <Tabs.Tab value="balances" leftSection={<IconCoin size={16} />}>
              Balances
            </Tabs.Tab>
            <Tabs.Tab value="providers" leftSection={<IconDatabase size={16} />}>
              Providers
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="transactions" pt="lg">
            <TransactionHistory address={userAddress} />
          </Tabs.Panel>

          <Tabs.Panel value="balances" pt="lg">
            <Grid>
              <Grid.Col span={12} md={6}>
                <BalanceDisplay 
                  tokenAddress="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
                  userAddress={userAddress}
                />
              </Grid.Col>
              <Grid.Col span={12} md={6}>
                <TokenList userAddress={userAddress} />
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="providers" pt="lg">
            <ProviderStats />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </QueryClientProvider>
  );
}