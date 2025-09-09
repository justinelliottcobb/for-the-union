import React, { useState, useCallback, useEffect } from 'react';
import { Card, Text, Button, Group, Stack, Alert, Badge, Switch, Select, Loader, Progress, Modal, Table, Timeline, Tabs, ActionIcon, NumberInput } from '@mantine/core';
import { IconNetwork, IconBridge, IconGasStation, IconArrowsExchange, IconCheck, IconX, IconClock, IconSettings, IconActivity } from '@tabler/icons-react';

// Types and Interfaces
interface NetworkConfig {
  chainId: number;
  name: string;
  shortName: string;
  networkType: 'mainnet' | 'testnet' | 'layer2' | 'sidechain';
  rpcUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  gasOptimization?: {
    maxGasPrice: string;
    preferredGasPrice: string;
    gasMultiplier: number;
  };
}

interface BridgeRoute {
  id: string;
  name: string;
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fee: string;
  estimatedTime: number;
  provider: 'hop' | 'across' | 'arbitrum' | 'optimism' | 'polygon';
}

interface BridgeTransaction {
  id: string;
  route: BridgeRoute;
  amount: string;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'failed';
  fromTxHash?: string;
  toTxHash?: string;
  estimatedCompletion: number;
}

interface L2Metrics {
  chainId: number;
  blockTime: number;
  tps: number;
  avgGasPrice: string;
  sequencerStatus: 'active' | 'down' | 'delayed';
  bridgeVolume24h: string;
  tvl: string;
}

interface CrossChainOperation {
  id: string;
  type: 'bridge' | 'arbitrage' | 'yield' | 'governance';
  chains: number[];
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'partial';
  steps: CrossChainStep[];
  totalValue: string;
  estimatedDuration: number;
  actualDuration?: number;
}

interface CrossChainStep {
  id: string;
  chainId: number;
  action: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  txHash?: string;
  dependsOn: string[];
}

// Chain Switcher Class
class ChainSwitcher {
  private supportedNetworks = new Map<number, NetworkConfig>();
  private currentChain: number | null = null;
  
  constructor() {
    this.initializeSupportedNetworks();
  }
  
  private initializeSupportedNetworks() {
    // Ethereum Mainnet
    this.supportedNetworks.set(1, {
      chainId: 1,
      name: 'Ethereum Mainnet',
      shortName: 'eth',
      networkType: 'mainnet',
      rpcUrls: ['https://mainnet.infura.io/v3/'],
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      gasOptimization: {
        maxGasPrice: '100000000000',
        preferredGasPrice: '20000000000',
        gasMultiplier: 1.1
      }
    });
    
    // Polygon
    this.supportedNetworks.set(137, {
      chainId: 137,
      name: 'Polygon Mainnet',
      shortName: 'matic',
      networkType: 'sidechain',
      rpcUrls: ['https://polygon-rpc.com/'],
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      gasOptimization: {
        maxGasPrice: '50000000000',
        preferredGasPrice: '2000000000',
        gasMultiplier: 1.2
      }
    });
    
    // Arbitrum
    this.supportedNetworks.set(42161, {
      chainId: 42161,
      name: 'Arbitrum One',
      shortName: 'arb',
      networkType: 'layer2',
      rpcUrls: ['https://arb1.arbitrum.io/rpc'],
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      gasOptimization: {
        maxGasPrice: '1000000000',
        preferredGasPrice: '100000000',
        gasMultiplier: 1.0
      }
    });
    
    // Optimism
    this.supportedNetworks.set(10, {
      chainId: 10,
      name: 'Optimism',
      shortName: 'opt',
      networkType: 'layer2',
      rpcUrls: ['https://mainnet.optimism.io'],
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
    });
  }
  
  async getCurrentChain(): Promise<number | null> {
    // Mock implementation
    return this.currentChain || 1;
  }
  
  async switchChain(chainId: number): Promise<boolean> {
    const networkConfig = this.supportedNetworks.get(chainId);
    if (!networkConfig) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }
    
    // Simulate chain switching delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.currentChain = chainId;
    return true;
  }
  
  getNetworkConfig(chainId: number): NetworkConfig | undefined {
    return this.supportedNetworks.get(chainId);
  }
  
  getSupportedNetworks(): NetworkConfig[] {
    return Array.from(this.supportedNetworks.values());
  }
}

// Bridge Interface Class
class BridgeInterface {
  private routes: BridgeRoute[] = [
    {
      id: 'eth-polygon-usdc-hop',
      name: 'Hop Protocol',
      fromChain: 1,
      toChain: 137,
      fromToken: 'USDC',
      toToken: 'USDC',
      fee: '0.1',
      estimatedTime: 10,
      provider: 'hop'
    },
    {
      id: 'eth-arbitrum-eth-native',
      name: 'Arbitrum Native Bridge',
      fromChain: 1,
      toChain: 42161,
      fromToken: 'ETH',
      toToken: 'ETH',
      fee: '0',
      estimatedTime: 420,
      provider: 'arbitrum'
    },
    {
      id: 'eth-arbitrum-usdc-across',
      name: 'Across Protocol',
      fromChain: 1,
      toChain: 42161,
      fromToken: 'USDC',
      toToken: 'USDC',
      fee: '0.25',
      estimatedTime: 2,
      provider: 'across'
    }
  ];
  
  private transactions = new Map<string, BridgeTransaction>();
  
  async getAvailableRoutes(fromChain: number, toChain: number, token?: string): Promise<BridgeRoute[]> {
    return this.routes.filter(route => 
      route.fromChain === fromChain && 
      route.toChain === toChain &&
      (!token || route.fromToken === token)
    );
  }
  
  async getBestRoute(
    fromChain: number, 
    toChain: number, 
    token: string, 
    priority: 'cost' | 'speed' = 'cost'
  ): Promise<BridgeRoute | null> {
    const routes = await this.getAvailableRoutes(fromChain, toChain, token);
    
    if (routes.length === 0) return null;
    
    if (priority === 'speed') {
      routes.sort((a, b) => a.estimatedTime - b.estimatedTime);
    } else {
      routes.sort((a, b) => parseFloat(a.fee) - parseFloat(b.fee));
    }
    
    return routes[0];
  }
  
  async initiateBridge(
    route: BridgeRoute,
    amount: string,
    recipientAddress: string
  ): Promise<BridgeTransaction> {
    const transactionId = Math.random().toString(36).substr(2, 9);
    
    const transaction: BridgeTransaction = {
      id: transactionId,
      route,
      amount,
      status: 'pending',
      estimatedCompletion: Date.now() + route.estimatedTime * 60 * 1000
    };
    
    this.transactions.set(transactionId, transaction);
    
    // Simulate bridge execution
    setTimeout(() => {
      transaction.status = 'confirmed';
      transaction.fromTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      setTimeout(() => {
        transaction.status = 'processing';
        
        setTimeout(() => {
          transaction.status = 'completed';
          transaction.toTxHash = '0x' + Math.random().toString(16).substr(2, 64);
        }, route.estimatedTime * 1000); // Convert to seconds for demo
      }, 2000);
    }, 1000);
    
    return transaction;
  }
  
  getBridgeHistory(): BridgeTransaction[] {
    return Array.from(this.transactions.values());
  }
  
  getTransaction(id: string): BridgeTransaction | undefined {
    return this.transactions.get(id);
  }
}

// L2 Monitor Class
class L2Monitor {
  private metrics = new Map<number, L2Metrics>();
  
  async getL2Metrics(chainId: number): Promise<L2Metrics> {
    const cached = this.metrics.get(chainId);
    if (cached) return cached;
    
    // Simulate fetching metrics
    const metrics: L2Metrics = {
      chainId,
      blockTime: chainId === 137 ? 2.1 : chainId === 42161 ? 0.26 : chainId === 10 ? 2.0 : 12,
      tps: chainId === 137 ? 65000 : chainId === 42161 ? 40000 : chainId === 10 ? 2000 : 15,
      avgGasPrice: chainId === 137 ? '30000000000' : chainId === 42161 ? '100000000' : chainId === 10 ? '1000000000' : '20000000000',
      sequencerStatus: Math.random() > 0.1 ? 'active' : 'delayed',
      bridgeVolume24h: (Math.random() * 10000000).toFixed(0),
      tvl: (Math.random() * 1000000000).toFixed(0)
    };
    
    this.metrics.set(chainId, metrics);
    return metrics;
  }
  
  async monitorL2Health(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    const l2Chains = [42161, 10, 137];
    
    for (const chainId of l2Chains) {
      const metrics = await this.getL2Metrics(chainId);
      
      if (metrics.sequencerStatus !== 'active') {
        issues.push(`${this.getChainName(chainId)} sequencer is ${metrics.sequencerStatus}`);
        recommendations.push(`Consider using alternative L2 or wait for ${this.getChainName(chainId)} recovery`);
      }
      
      if (parseFloat(metrics.avgGasPrice) > this.getGasThreshold(chainId)) {
        issues.push(`High gas prices on ${this.getChainName(chainId)}`);
        recommendations.push(`Consider batching transactions or switching to lower-cost L2`);
      }
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      recommendations
    };
  }
  
  private getChainName(chainId: number): string {
    const names = { 42161: 'Arbitrum', 10: 'Optimism', 137: 'Polygon' };
    return names[chainId as keyof typeof names] || `Chain ${chainId}`;
  }
  
  private getGasThreshold(chainId: number): number {
    const thresholds = { 42161: 1000000000, 10: 1000000000, 137: 50000000000 };
    return thresholds[chainId as keyof typeof thresholds] || 20000000000;
  }
}

// Cross Chain Manager Class  
class CrossChainManager {
  private operations = new Map<string, CrossChainOperation>();
  
  async executeArbitrage(
    token: string,
    amount: string,
    sourceChain: number,
    targetChain: number
  ): Promise<CrossChainOperation> {
    const operationId = `arbitrage_${Date.now()}`;
    
    const operation: CrossChainOperation = {
      id: operationId,
      type: 'arbitrage',
      chains: [sourceChain, targetChain],
      status: 'pending',
      steps: [
        {
          id: 'price_check_source',
          chainId: sourceChain,
          action: 'Check token price',
          status: 'pending',
          dependsOn: []
        },
        {
          id: 'bridge_tokens',
          chainId: sourceChain,
          action: `Bridge ${amount} ${token}`,
          status: 'pending',
          dependsOn: ['price_check_source']
        },
        {
          id: 'execute_swap',
          chainId: targetChain,
          action: 'Execute arbitrage swap',
          status: 'pending',
          dependsOn: ['bridge_tokens']
        }
      ],
      totalValue: amount,
      estimatedDuration: 15 * 60
    };
    
    this.operations.set(operationId, operation);
    this.executeOperation(operationId);
    
    return operation;
  }
  
  private async executeOperation(operationId: string) {
    const operation = this.operations.get(operationId);
    if (!operation) return;
    
    operation.status = 'executing';
    
    // Simulate step execution
    for (const step of operation.steps) {
      const canExecute = step.dependsOn.every(dep => 
        operation.steps.find(s => s.id === dep)?.status === 'completed'
      );
      
      if (canExecute) {
        step.status = 'executing';
        
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
        
        if (Math.random() > 0.1) {
          step.status = 'completed';
          step.txHash = '0x' + Math.random().toString(16).substr(2, 64);
        } else {
          step.status = 'failed';
          operation.status = 'failed';
          return;
        }
      }
    }
    
    operation.status = 'completed';
    operation.actualDuration = Math.floor(Math.random() * 600 + 300);
  }
  
  getOperations(): CrossChainOperation[] {
    return Array.from(this.operations.values());
  }
  
  getOperation(id: string): CrossChainOperation | undefined {
    return this.operations.get(id);
  }
}

// Component Implementations
const ChainSwitcherComponent: React.FC = () => {
  const [currentChain, setCurrentChain] = useState<number>(1);
  const [switching, setSwitching] = useState(false);
  const chainSwitcher = new ChainSwitcher();
  
  const switchChain = async (chainId: number) => {
    setSwitching(true);
    try {
      await chainSwitcher.switchChain(chainId);
      setCurrentChain(chainId);
    } catch (error) {
      console.error('Chain switch failed:', error);
    }
    setSwitching(false);
  };
  
  const networks = chainSwitcher.getSupportedNetworks();
  const currentNetwork = chainSwitcher.getNetworkConfig(currentChain);
  
  return (
    <Card shadow="sm" p="lg">
      <Group position="apart" mb="md">
        <Text size="lg" weight={500}>Chain Switcher</Text>
        <Badge color={switching ? 'yellow' : 'green'} variant="light">
          {currentNetwork?.name || 'Unknown'}
        </Badge>
      </Group>
      
      <Stack spacing="sm">
        <Text size="sm" color="dimmed">Available Networks:</Text>
        
        <Group spacing="xs">
          {networks.map(network => (
            <Button
              key={network.chainId}
              size="sm"
              variant={currentChain === network.chainId ? 'filled' : 'light'}
              onClick={() => switchChain(network.chainId)}
              loading={switching}
              leftIcon={<IconNetwork size={14} />}
            >
              {network.shortName.toUpperCase()}
            </Button>
          ))}
        </Group>
        
        {currentNetwork && (
          <div>
            <Text size="sm" weight={500} mt="md" mb="xs">Network Details:</Text>
            <Group spacing="md">
              <div>
                <Text size="xs" color="dimmed">Type</Text>
                <Badge size="sm">{currentNetwork.networkType}</Badge>
              </div>
              <div>
                <Text size="xs" color="dimmed">Currency</Text>
                <Text size="sm">{currentNetwork.nativeCurrency.symbol}</Text>
              </div>
              {currentNetwork.gasOptimization && (
                <div>
                  <Text size="xs" color="dimmed">Preferred Gas</Text>
                  <Text size="sm">{(parseInt(currentNetwork.gasOptimization.preferredGasPrice) / 1e9).toFixed(1)} Gwei</Text>
                </div>
              )}
            </Group>
          </div>
        )}
      </Stack>
    </Card>
  );
};

const BridgeInterfaceComponent: React.FC = () => {
  const [fromChain, setFromChain] = useState<number>(1);
  const [toChain, setToChain] = useState<number>(137);
  const [token, setToken] = useState('USDC');
  const [amount, setAmount] = useState('100');
  const [selectedRoute, setSelectedRoute] = useState<BridgeRoute | null>(null);
  const [routes, setRoutes] = useState<BridgeRoute[]>([]);
  const [bridging, setBridging] = useState(false);
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  
  const bridgeInterface = new BridgeInterface();
  
  const searchRoutes = async () => {
    const availableRoutes = await bridgeInterface.getAvailableRoutes(fromChain, toChain, token);
    setRoutes(availableRoutes);
    if (availableRoutes.length > 0) {
      setSelectedRoute(availableRoutes[0]);
    }
  };
  
  useEffect(() => {
    searchRoutes();
  }, [fromChain, toChain, token]);
  
  const executeBridge = async () => {
    if (!selectedRoute) return;
    
    setBridging(true);
    try {
      const transaction = await bridgeInterface.initiateBridge(
        selectedRoute,
        amount,
        '0x742d35Cc6644C3532FDE7E40c5F0A7eF6C3c8B15'
      );
      
      setTransactions(prev => [transaction, ...prev]);
    } catch (error) {
      console.error('Bridge failed:', error);
    }
    setBridging(false);
  };
  
  return (
    <Card shadow="sm" p="lg">
      <Text size="lg" weight={500} mb="md">Bridge Interface</Text>
      
      <Stack spacing="md">
        <Group grow>
          <Select
            label="From Chain"
            value={fromChain.toString()}
            onChange={(value) => setFromChain(parseInt(value!))}
            data={[
              { label: 'Ethereum', value: '1' },
              { label: 'Polygon', value: '137' },
              { label: 'Arbitrum', value: '42161' },
              { label: 'Optimism', value: '10' }
            ]}
          />
          <Select
            label="To Chain"
            value={toChain.toString()}
            onChange={(value) => setToChain(parseInt(value!))}
            data={[
              { label: 'Ethereum', value: '1' },
              { label: 'Polygon', value: '137' },
              { label: 'Arbitrum', value: '42161' },
              { label: 'Optimism', value: '10' }
            ]}
          />
        </Group>
        
        <Group grow>
          <Select
            label="Token"
            value={token}
            onChange={(value) => setToken(value!)}
            data={[
              { label: 'USDC', value: 'USDC' },
              { label: 'ETH', value: 'ETH' },
              { label: 'USDT', value: 'USDT' }
            ]}
          />
          <NumberInput
            label="Amount"
            value={amount}
            onChange={(value) => setAmount(value.toString())}
            min={0}
          />
        </Group>
        
        {routes.length > 0 && (
          <div>
            <Text size="sm" weight={500} mb="xs">Available Routes:</Text>
            <Stack spacing="xs">
              {routes.map(route => (
                <Card 
                  key={route.id} 
                  withBorder 
                  p="sm"
                  style={{ 
                    cursor: 'pointer',
                    borderColor: selectedRoute?.id === route.id ? 'var(--mantine-color-blue-5)' : undefined
                  }}
                  onClick={() => setSelectedRoute(route)}
                >
                  <Group position="apart">
                    <div>
                      <Text size="sm" weight={500}>{route.name}</Text>
                      <Text size="xs" color="dimmed">
                        Fee: {route.fee}% • Time: {route.estimatedTime < 60 ? `${route.estimatedTime}m` : `${(route.estimatedTime/60).toFixed(1)}h`}
                      </Text>
                    </div>
                    <Badge size="sm" color={route.provider === 'across' ? 'blue' : route.provider === 'hop' ? 'green' : 'orange'}>
                      {route.provider}
                    </Badge>
                  </Group>
                </Card>
              ))}
            </Stack>
          </div>
        )}
        
        <Button
          onClick={executeBridge}
          disabled={!selectedRoute || bridging}
          loading={bridging}
          leftIcon={<IconBridge size={16} />}
        >
          Bridge {amount} {token}
        </Button>
        
        {transactions.length > 0 && (
          <div>
            <Text size="sm" weight={500} mb="xs">Recent Transactions:</Text>
            <Stack spacing="xs">
              {transactions.slice(0, 3).map(tx => (
                <Group key={tx.id} position="apart">
                  <div>
                    <Text size="sm">{tx.amount} {tx.route.fromToken}</Text>
                    <Text size="xs" color="dimmed">{tx.route.name}</Text>
                  </div>
                  <Badge color={
                    tx.status === 'completed' ? 'green' :
                    tx.status === 'failed' ? 'red' :
                    tx.status === 'processing' ? 'yellow' : 'blue'
                  }>
                    {tx.status}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </div>
        )}
      </Stack>
    </Card>
  );
};

const L2MonitorComponent: React.FC = () => {
  const [metrics, setMetrics] = useState<Map<number, L2Metrics>>(new Map());
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const l2Monitor = new L2Monitor();
  
  const refreshMetrics = async () => {
    setLoading(true);
    const l2Chains = [42161, 10, 137];
    const newMetrics = new Map();
    
    for (const chainId of l2Chains) {
      const metric = await l2Monitor.getL2Metrics(chainId);
      newMetrics.set(chainId, metric);
    }
    
    setMetrics(newMetrics);
    
    const healthCheck = await l2Monitor.monitorL2Health();
    setHealth(healthCheck);
    
    setLoading(false);
  };
  
  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);
  
  const getChainName = (chainId: number) => {
    const names = { 42161: 'Arbitrum', 10: 'Optimism', 137: 'Polygon' };
    return names[chainId as keyof typeof names] || `Chain ${chainId}`;
  };
  
  return (
    <Card shadow="sm" p="lg">
      <Group position="apart" mb="md">
        <Text size="lg" weight={500}>L2 Monitor</Text>
        <Button size="xs" onClick={refreshMetrics} loading={loading}>
          Refresh
        </Button>
      </Group>
      
      <Stack spacing="md">
        {health && (
          <Alert
            color={health.healthy ? 'green' : 'red'}
            icon={health.healthy ? <IconCheck size={16} /> : <IconX size={16} />}
          >
            <Text size="sm" weight={500}>
              L2 Health: {health.healthy ? 'All systems operational' : `${health.issues.length} issues detected`}
            </Text>
            {!health.healthy && health.issues.length > 0 && (
              <Stack spacing="xs" mt="xs">
                {health.issues.slice(0, 2).map((issue, index) => (
                  <Text key={index} size="xs">• {issue}</Text>
                ))}
              </Stack>
            )}
          </Alert>
        )}
        
        <div>
          <Text size="sm" weight={500} mb="xs">Network Metrics:</Text>
          <Stack spacing="sm">
            {Array.from(metrics.entries()).map(([chainId, metric]) => (
              <Card key={chainId} withBorder p="sm">
                <Group position="apart" mb="xs">
                  <Text size="sm" weight={500}>{getChainName(chainId)}</Text>
                  <Badge 
                    size="sm" 
                    color={metric.sequencerStatus === 'active' ? 'green' : 'red'}
                  >
                    {metric.sequencerStatus}
                  </Badge>
                </Group>
                
                <Group spacing="md">
                  <div>
                    <Text size="xs" color="dimmed">Block Time</Text>
                    <Text size="sm">{metric.blockTime}s</Text>
                  </div>
                  <div>
                    <Text size="xs" color="dimmed">TPS</Text>
                    <Text size="sm">{metric.tps.toLocaleString()}</Text>
                  </div>
                  <div>
                    <Text size="xs" color="dimmed">Avg Gas</Text>
                    <Text size="sm">{(parseInt(metric.avgGasPrice) / 1e9).toFixed(1)} Gwei</Text>
                  </div>
                  <div>
                    <Text size="xs" color="dimmed">TVL</Text>
                    <Text size="sm">${(parseInt(metric.tvl) / 1e6).toFixed(0)}M</Text>
                  </div>
                </Group>
              </Card>
            ))}
          </Stack>
        </div>
      </Stack>
    </Card>
  );
};

const CrossChainManagerComponent: React.FC = () => {
  const [operations, setOperations] = useState<CrossChainOperation[]>([]);
  const [loading, setLoading] = useState(false);
  
  const crossChainManager = new CrossChainManager();
  
  const executeArbitrage = async () => {
    setLoading(true);
    try {
      const operation = await crossChainManager.executeArbitrage('USDC', '1000', 1, 137);
      setOperations(prev => [operation, ...prev]);
      
      // Poll for updates
      const pollOperation = () => {
        const updated = crossChainManager.getOperation(operation.id);
        if (updated) {
          setOperations(prev => prev.map(op => op.id === operation.id ? updated : op));
          
          if (updated.status === 'executing') {
            setTimeout(pollOperation, 2000);
          }
        }
      };
      setTimeout(pollOperation, 1000);
    } catch (error) {
      console.error('Arbitrage failed:', error);
    }
    setLoading(false);
  };
  
  return (
    <Card shadow="sm" p="lg">
      <Group position="apart" mb="md">
        <Text size="lg" weight={500}>Cross-Chain Manager</Text>
        <Button
          size="sm"
          onClick={executeArbitrage}
          loading={loading}
          leftIcon={<IconArrowsExchange size={16} />}
        >
          Execute Arbitrage
        </Button>
      </Group>
      
      <Stack spacing="md">
        {operations.length === 0 ? (
          <Text size="sm" color="dimmed" align="center" py="md">
            No cross-chain operations yet
          </Text>
        ) : (
          operations.map(operation => (
            <Card key={operation.id} withBorder p="sm">
              <Group position="apart" mb="xs">
                <div>
                  <Text size="sm" weight={500}>{operation.type.toUpperCase()}</Text>
                  <Text size="xs" color="dimmed">
                    Value: ${operation.totalValue} • Chains: {operation.chains.join(', ')}
                  </Text>
                </div>
                <Badge color={
                  operation.status === 'completed' ? 'green' :
                  operation.status === 'failed' ? 'red' :
                  operation.status === 'executing' ? 'yellow' : 'blue'
                }>
                  {operation.status}
                </Badge>
              </Group>
              
              <Timeline active={operation.steps.filter(s => s.status === 'completed').length - 1}>
                {operation.steps.map(step => (
                  <Timeline.Item
                    key={step.id}
                    bullet={
                      step.status === 'completed' ? <IconCheck size={12} /> :
                      step.status === 'failed' ? <IconX size={12} /> :
                      step.status === 'executing' ? <IconClock size={12} /> :
                      <IconActivity size={12} />
                    }
                    title={step.action}
                  >
                    <Text size="xs" color="dimmed">
                      Chain {step.chainId} • {step.status}
                      {step.txHash && (
                        <>
                          <br />
                          Tx: {step.txHash.slice(0, 10)}...
                        </>
                      )}
                    </Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          ))
        )}
      </Stack>
    </Card>
  );
};

// Main Exercise Component
const Layer2MultichainIntegrationExercise: React.FC = () => {
  return (
    <Stack spacing="md">
      <Alert icon={<IconNetwork size={16} />} title="Multi-Chain Integration" color="blue">
        Managing operations across multiple blockchain networks and Layer 2 solutions
      </Alert>
      
      <Tabs defaultValue="switcher">
        <Tabs.List>
          <Tabs.Tab value="switcher" icon={<IconNetwork size={14} />}>Chain Switcher</Tabs.Tab>
          <Tabs.Tab value="bridge" icon={<IconBridge size={14} />}>Bridge Interface</Tabs.Tab>
          <Tabs.Tab value="monitor" icon={<IconGasStation size={14} />}>L2 Monitor</Tabs.Tab>
          <Tabs.Tab value="manager" icon={<IconArrowsExchange size={14} />}>Cross-Chain Manager</Tabs.Tab>
        </Tabs.List>
        
        <Tabs.Panel value="switcher" pt="md">
          <ChainSwitcherComponent />
        </Tabs.Panel>
        
        <Tabs.Panel value="bridge" pt="md">
          <BridgeInterfaceComponent />
        </Tabs.Panel>
        
        <Tabs.Panel value="monitor" pt="md">
          <L2MonitorComponent />
        </Tabs.Panel>
        
        <Tabs.Panel value="manager" pt="md">
          <CrossChainManagerComponent />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default Layer2MultichainIntegrationExercise;